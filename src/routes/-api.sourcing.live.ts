import { createFileRoute } from "@tanstack/react-router";
import { LoaderFunctionArgs } from "@tanstack/react-router";

// Configuration parameters for logistics margins
const EXCHANGE_RATE_CNY_TO_NGN = 215; // 1 CNY = 215 NGN
const AIR_FREIGHT_PER_KG_USD = 8.5;   // $8.50 USD per Kg
const NGN_PER_USD = 1550;             // 1 USD = 1,550 NGN

// Target offer IDs to fetch
const OFFER_IDS = ["573787401272", "7492017493", "612345678901"];

// Type definitions for parse.bot response
interface ParseBotResponse {
  data?: {
    offer_id?: string;
    title?: string;
    main_images?: Array<{ fullPathImageURI?: string; url?: string; imageUrl?: string }>;
    images?: Array<{ fullPathImageURI?: string; url?: string; imageUrl?: string }>;
    price_range?: {
      max?: string;
      min?: string;
    };
  };
}

interface MappedProduct {
  id: string;
  title: string;
  description: string;
  priceNGN: number;
  costCNY: number;
  imageUrl: string;
  sourceType: 'preorder';
  weightKg: number;
}

// Helper function to safely extract image URL
function extractImageUrl(data: ParseBotResponse['data']): string {
  if (!data) return "";
  
  const sources = [data.main_images, data.images];
  for (const imageArray of sources) {
    if (imageArray && imageArray.length > 0) {
      const img = imageArray[0];
      if (img.fullPathImageURI) return img.fullPathImageURI;
      if (img.url) return img.url;
      if (img.imageUrl) return img.imageUrl;
    }
  }
  
  return "";
}

// Helper function to safely parse price
function parsePrice(priceStr?: string): number {
  if (!priceStr) return 50;
  const num = parseFloat(priceStr.replace(/[^\d.]/g, ""));
  return isNaN(num) ? 50 : num;
}

export const Route = createFileRoute("/api/sourcing/live")({
  async loader({ request }: LoaderFunctionArgs) {
    try {
      // Get API key from environment variable if available
      const API_KEY = process.env.PARSEBOT_API_KEY || "20c0627a2fmshbb5438e9be896fcp143339jsn11600c604ceb";
      
      // Fetch all products in parallel
      const fetchPromises = OFFER_IDS.map(async (offerId) => {
        const targetUrl = `https://api.parse.bot/scraper/e73b8c09-cc45-45a0-b8c7-c972f586c2d0/get_product_details?offer_id=${offerId}`;
        
        try {
          const response = await fetch(targetUrl, {
            headers: {
              "X-API-Key": API_KEY,
              "API-Snapshot-Version": "7",
              "Content-Type": "application/json",
            },
            next: { revalidate: 3600 }, // Cache for 1 hour
          });

          if (!response.ok) {
            console.warn(`Failed to fetch offer ${offerId}: ${response.statusText}`);
            return null;
          }

          const jsonPayload: ParseBotResponse = await response.json();
          const data = jsonPayload?.data;
          
          if (!data) {
            console.warn(`No data returned for offer ${offerId}`);
            return null;
          }

          // Extract properties
          const id = data.offer_id || offerId;
          const rawTitle = data.title || "Factory Sourced Item";
          const trimmedTitle = rawTitle.trim().substring(0, 60);
          const costCNY = parsePrice(data.price_range?.max);
          const imageUrl = extractImageUrl(data);

          // Calculate logistics metrics
          const baseProductCostNGN = costCNY * EXCHANGE_RATE_CNY_TO_NGN;
          const airFreightChargeNGN = 2.5 * AIR_FREIGHT_PER_KG_USD * NGN_PER_USD;
          const finalPresentationPrice = Math.ceil((baseProductCostNGN + airFreightChargeNGN) * 1.15);

          // Map to frontend schema
          const product: MappedProduct = {
            id: `1688-${id}`,
            title: trimmedTitle,
            description: "Factory Sourced Procurement Option. Imported directly to Nigeria.",
            priceNGN: finalPresentationPrice,
            costCNY,
            imageUrl,
            sourceType: 'preorder',
            weightKg: 2.5,
          };

          return product;
        } catch (err) {
          console.warn(`Error processing offer ${offerId}:`, err);
          return null;
        }
      });

      const results = await Promise.all(fetchPromises);
      const products = results.filter((p): p is MappedProduct => p !== null);

      return new Response(
        JSON.stringify({
          success: true,
          products,
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        }
      );
    } catch (error) {
      console.error("API sourcing error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          products: [],
        }),
        {
          status: 500,
          headers: { "content-type": "application/json" },
        }
      );
    }
  },
});
