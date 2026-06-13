import { NextResponse } from 'next/server';

// Configuration parameters for your logistics margins
const EXCHANGE_RATE_CNY_TO_NGN = 215; // 1 CNY = 215 NGN
const AIR_FREIGHT_PER_KG_USD = 8.5;   // $8.50 USD per Kg
const NGN_PER_USD = 1550;             // 1 USD = 1,550 NGN

// Static target 1688 product IDs
const offerIds = ['573787401272', '7492017493', '612345678901'];

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

export async function GET() {
  try {
    // Fetch details for all target offer IDs in parallel
    const fetchPromises = offerIds.map(async (offerId) => {
      const targetUrl = `https://api.parse.bot/scraper/e73b8c09-cc45-45a0-b8c7-c972f586c2d0/get_product_details?offer_id=${offerId}`;
      const response = await fetch(targetUrl, {
        headers: {
          'X-API-Key': '20c0627a2fmshbb5438e9be896fcp143339jsn11600c604ceb',
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
      const data = apiResponse?.data;
      if (!data) continue;

      // Safely extract cost in CNY
      let costCNY: number;
      if (data.price_range?.max) {
        costCNY = parseFloat(data.price_range.max.replace(/[^\d.]/g, ''));
      } else {
        costCNY = 50;
      }
      if (isNaN(costCNY)) {
        costCNY = 50;
      }

      // Get image URL
      const mainImages = data.main_images || data.images || [];
      const imageUrl = mainImages[0]?.fullPathImageURI || '';

      // Calculate base cost and shipping
      const baseProductCostNGN = costCNY * EXCHANGE_RATE_CNY_TO_NGN;
      const airFreightOverheadNGN = 2.5 * AIR_FREIGHT_PER_KG_USD * NGN_PER_USD;
      const finalCustomerPrice = Math.ceil((baseProductCostNGN + airFreightOverheadNGN) * 1.15);

      // Map to frontend structure
      const rawTitle = data.title || 'Factory Sourced Item';
      const trimmedTitle = rawTitle.trim().substring(0, 60);
      const id = data.offer_id || 'unknown';

      dynamicCatalog.push({
        id: `1688-${id}`,
        title: trimmedTitle,
        description: "Factory Sourced Procurement Option. Imported directly to Nigeria.",
        priceNGN: finalCustomerPrice,
        costCNY,
        imageUrl,
        sourceType: 'preorder',
        weightKg: 2.5,
      });
    }

    return NextResponse.json({ success: true, products: dynamicCatalog });

  } catch (error: any) {
    console.error("NextGen Sourcing Route Error:", error.message);
    return NextResponse.json(
      { success: false, products: [] },
      { status: 500 }
    );
  }
}
