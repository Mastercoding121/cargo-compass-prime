import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "../db-adapter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, "../../../.env.local") });

export const searchProducts = createServerFn({ method: "GET" })
  .inputValidator(z.object({ q: z.string().min(1) }))
  .handler(async ({ data }) => {
    try {
      // First check db for existing products
      let existingProducts = [];
      try {
        existingProducts = await db.searchProducts(data.q);
      } catch (error) {
        console.warn("Failed to fetch existing products:", error);
      }

      if (existingProducts.length > 0) {
        return {
          type: "cached",
          products: existingProducts,
        };
      }

      // Dynamically import server-only scraper
      const { search1688 } = await import("../server/scraper.server.js");
      let sourcedProducts: any[] = [];
      let scrapeError = false;

      try {
        sourcedProducts = await search1688(data.q);
      } catch (error) {
        scrapeError = true;
        await db.logSystemEvent("error", "1688 scrape failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      }

      if (scrapeError) {
        return {
          type: "error",
          message: "Manual sourcing required",
        };
      }

      // Save products to pending queue for admin approval
      for (const product of sourcedProducts) {
        try {
          await db.saveToQueue({
            original_1688_link: product.original_1688_link,
            title_english: product.title_english,
            image_url: product.image_url,
            price_yuan: product.price_yuan,
            price_naira: product.price_naira,
            source: "ai_sourced",
          });
        } catch (error) {
          // If product already exists in queue, just skip
          console.warn("Product already in queue:", error);
        }
      }

      await db.logSystemEvent("info", "1688 search completed", {
        query: data.q,
        resultsCount: sourcedProducts.length,
      });

      return {
        type: "sourced",
        products: sourcedProducts,
      };
    } catch (error) {
      console.error("Search failed:", error);
      return {
        type: "error",
        message: "An error occurred during search",
      };
    }
  });
