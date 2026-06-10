import puppeteer from "puppeteer";
import { getLiveExchangeRate } from "../exchange";

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
];

export interface SourcedProduct {
  title_english: string;
  image_url: string;
  original_1688_link: string;
  price_yuan: number;
  price_naira: number;
  moq: number;
}

export async function search1688(query: string): Promise<SourcedProduct[]> {
  const exchangeRate = await getLiveExchangeRate();
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const proxyUrl = process.env.SCRAPER_PROXY_URL || "";

  const browser = await puppeteer.launch({
    headless: true,
    args: proxyUrl ? [`--proxy-server=${proxyUrl}`] : [
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 1920, height: 1080 });

    const searchUrl = `https://s.1688.com/selloffer/offer_search.htm?keywords=${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: "networkidle2" });

    // Check if we hit a CAPTCHA
    const captchaSelectors = ["#nc_1_n1z", ".nc-container", ".captcha"];
    for (const selector of captchaSelectors) {
      if (await page.$(selector)) {
        throw new Error("CAPTCHA detected");
      }
    }

    const products: SourcedProduct[] = await page.evaluate((rate: number) => {
      const results: SourcedProduct[] = [];
      const items = document.querySelectorAll(".offer-item");

      items.forEach((item, index) => {
        if (index >= 5) return;

        const titleEl = item.querySelector(".title a") as HTMLAnchorElement;
        const imageEl = item.querySelector(".image img") as HTMLImageElement;
        const priceEl = item.querySelector(".price em") as HTMLElement;
        const moqEl = item.querySelector(".moq") as HTMLElement;

        if (titleEl && imageEl && priceEl) {
          const title = titleEl.textContent?.trim() || "";
          let imageUrl = imageEl.src || imageEl.dataset.src || "";
          
          // Try to get a higher resolution image
          if (imageUrl) {
            // Common 1688 image URL patterns for higher resolution
            imageUrl = imageUrl
              .replace(/\.\d+x\d+\./g, ".") // Remove any dimension suffix
              .replace(/\.jpg$/, ".800x800.jpg")
              .replace(/\.png$/, ".800x800.png");
          }
          
          const link = titleEl.href || "";
          const priceYuanStr = priceEl.textContent?.replace(/[^0-9.]/g, "") || "0";
          const priceYuan = parseFloat(priceYuanStr);
          const priceNaira = priceYuan * rate;
          const moqStr = moqEl?.textContent?.match(/\d+/)?.[0] || "1";
          const moq = parseInt(moqStr);

          results.push({
            title_english: title,
            image_url: imageUrl,
            original_1688_link: link,
            price_yuan: priceYuan,
            price_naira: priceNaira,
            moq: moq,
          });
        }
      });

      return results;
    }, exchangeRate);

    await browser.close();
    return products;
  } catch (error) {
    await browser.close();
    throw error;
  }
}
