import { NextResponse } from 'next/server';

// Configuration parameters for your logistics margins
const EXCHANGE_RATE_CNY_TO_NGN = 215; // 1 CNY = 215 NGN
const AIR_FREIGHT_PER_KG_USD = 8.5;   // $8.50 USD per Kg
const NGN_PER_USD = 1550;             // 1 USD = 1,550 NGN

// Static target 1688 product IDs
const targetOfferIds = ['573787401272', '7492017493', '612345678901'];

// Type definitions for parse.bot response
interface ParseBotResponse {
  responseBody?: {
    data?: {
      offer_id?: string;
      title?: string;
      main_images?: Array<{ fullPathImageURI?: string }>;
      images?: Array<{ fullPathImageURI?: string }>;
      price_range?: {
        max?: string;
      };
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

export async function GET() {
  try {
    // Get API key from environment or use placeholder
    const apiKey = process.env.PARSE_API_KEY || 'YOUR_ACTUAL_PARSE_BOT_API_KEY';

    // Fetch details for all target offer IDs in parallel
    const fetchPromises = targetOfferIds.map(async (offerId) => {
      const targetUrl = `https://api.parse.bot/scraper/bb0ade25-1595-4730-86be-b24affd889da/get_product_details?offer_id=${offerId}`;
      const response = await fetch(targetUrl, {
        headers: {
          'X-API-Key': apiKey,
          'API-Snapshot-Version': '7',
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (!response.ok) {
        console.error(`Failed to fetch product ${offerId}:`, response.statusText);
        return null;
      }

      return response.json();
    });

    const responses = await Promise.all(fetchPromises);

    // Process and map valid responses
    const dynamicCatalog: MappedProduct[] = [];
    for (const apiResponse of responses) {
      if (!apiResponse) continue;
      const data = apiResponse?.responseBody?.data;
      if (!data) continue;

      // Safely extract cost in CNY
      let rawCostCNY: number;
      if (data.price_range?.max) {
        rawCostCNY = parseFloat(data.price_range.max.replace(/[^\d.]/g, ''));
      } else {
        rawCostCNY = 50;
      }
      if (isNaN(rawCostCNY)) {
        rawCostCNY = 50;
      }

      // Get image URL
      const mainImages = data.main_images || data.images || [];
      const imageUrl = mainImages[0]?.fullPathImageURI || '';

      // Calculate base cost and shipping
      const baseCostNGN = rawCostCNY * EXCHANGE_RATE_CNY_TO_NGN;
      const estimatedWeight = 2.5;
      const estimatedShippingNGN = estimatedWeight * AIR_FREIGHT_PER_KG_USD * NGN_PER_USD;
      const calculatedListingPrice = Math.ceil((baseCostNGN + estimatedShippingNGN) * 1.15);

      // Map to frontend structure
      const rawTitle = data.title || 'Wholesale Factory Import';
      const trimmedTitle = rawTitle.trim().substring(0, 60);
      const id = data.offer_id || 'unknown';

      dynamicCatalog.push({
        id: `1688-${id}`,
        title: trimmedTitle,
        description: "Factory Sourced Procurement Option. Imported directly to Nigeria.",
        priceNGN: calculatedListingPrice,
        costCNY: rawCostCNY,
        imageUrl,
        sourceType: 'preorder',
        weightKg: 2.5,
      });
    }

    return NextResponse.json({ success: true, products: dynamicCatalog });

  } catch (error: any) {
    console.error('NextGen Sourcing Route Error:', error.message);
    return NextResponse.json(
      { success: false, products: [] },
      { status: 500 }
    );
  }
}
