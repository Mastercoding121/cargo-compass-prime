import { createFileRoute } from "@tanstack/react-router";
import { LoaderFunctionArgs } from "@tanstack/react-router";

// Configuration parameters for logistics margins
const EXCHANGE_RATE_CNY_TO_NGN = 215; // 1 CNY = 215 NGN
const AIR_FREIGHT_PER_KG_USD = 8.5;   // $8.50 USD per Kg
const NGN_PER_USD = 1550;             // 1 USD = 1,550 NGN

// Type definitions for parse.bot response
interface ParseBotResponse {
  data?: {
    offer_id?: string;
    title?: string;
    main_images?: Array<{ fullPathImageURI?: string }>;
    images?: Array<{ fullPathImageURI?: string }>;
    price_range?: {
      max?: string;
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

export const Route = createFileRoute("/api/sourcing/live")({
  async loader({ request }: LoaderFunctionArgs) {
    try {
      // Target URL with offer_id
      const targetUrl = "https://api.parse.bot/scraper/e73b8c09-cc45-45a0-b8c7-c972f586c2d0/get_product_details?offer_id=573787401272";
      
      // Execute fetch
      const response = await fetch(targetUrl, {
        headers: {
          "X-API-Key": "20c0627a2fmshbb5438e9be896fcp143339jsn11600c604ceb",
          "API-Snapshot-Version": "7",
          "Content-Type": "application/json",
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch from parse.bot: ${response.statusText}`);
      }

      const jsonPayload: ParseBotResponse = await response.json();
      const data = jsonPayload?.data;
      if (!data) {
        throw new Error("No product data found in response");
      }

      // Extract costCNY
      let costCNY: number;
      if (data.price_range?.max) {
        costCNY = parseFloat(data.price_range.max.replace(/[^\d.]/g, ""));
      } else {
        costCNY = 50;
      }
      if (isNaN(costCNY)) {
        costCNY = 50;
      }

      // Get image URL
      const mainImages = data.main_images || data.images || [];
      const imageUrl = mainImages[0]?.fullPathImageURI || "";

      // Calculate logistics metrics
      const baseProductCostNGN = costCNY * EXCHANGE_RATE_CNY_TO_NGN;
      const airFreightChargeNGN = 2.5 * AIR_FREIGHT_PER_KG_USD * NGN_PER_USD;
      const finalPresentationPrice = Math.ceil((baseProductCostNGN + airFreightChargeNGN) * 1.15);

      // Map to frontend schema
      const id = data.offer_id || "573787401272";
      const rawTitle = data.title || "Factory Sourced Item";
      const trimmedTitle = rawTitle.trim().substring(0, 60);

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

      return new Response(
        JSON.stringify({
          success: true,
          products: [product],
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
