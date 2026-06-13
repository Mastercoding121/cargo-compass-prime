import { NextResponse } from 'next/server';

// Configuration parameters for your logistics margins
const EXCHANGE_RATE_CNY_TO_NGN = 215; // 1 CNY = 215 NGN
const AIR_FREIGHT_PER_KG_USD = 8.5;   // $8.50 USD per Kg
const NGN_PER_USD = 1550;             // 1 USD = 1,550 NGN

// Type definitions for RapidAPI response
interface RapidAPIResponse {
  data?: {
    items?: RapidAPIProduct[];
  };
}

interface RapidAPIProduct {
  offerId?: string | number;
  id?: string | number;
  subject?: string;
  title?: string;
  price?: string;
  imageUrl?: string;
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
    // Fetch from RapidAPI endpoint with cache revalidation (3600s = 1 hour)
    const targetUrl = 'https://1688-product2.p.rapidapi.com/1688/shop/items?member_id=b2b-30949146618ee80&page_size=12&page=1';
    const response = await fetch(targetUrl, {
      headers: {
        'x-rapidapi-key': '20c0627a2fmshbb5438e9be896fcp143339jsn11600c604ceb',
        'x-rapidapi-host': '1688-product2.p.rapidapi.com',
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from RapidAPI');
    }

    const apiResponse: RapidAPIResponse = await response.json();
    const scrapedData = apiResponse?.data?.items || [];

    // Process and map the data
    const dynamicCatalog = scrapedData
      .map((item: RapidAPIProduct): MappedProduct => {
        // Safely extract cost in CNY from item.price string, default to 50 if missing/corrupt
        let rawCostCNY: number;
        if (typeof item.price === 'string') {
          rawCostCNY = parseFloat(item.price.replace(/[^\d.]/g, ''));
        } else if (typeof item.price === 'number') {
          rawCostCNY = item.price;
        } else {
          rawCostCNY = 50;
        }
        if (isNaN(rawCostCNY)) {
          rawCostCNY = 50;
        }

        // Calculate base cost and shipping
        const baseCostNGN = rawCostCNY * EXCHANGE_RATE_CNY_TO_NGN;
        const estimatedWeight = 2.5;
        const estimatedShippingNGN = estimatedWeight * AIR_FREIGHT_PER_KG_USD * NGN_PER_USD;
        const calculatedListingPrice = Math.ceil((baseCostNGN + estimatedShippingNGN) * 1.15);

        // Map to frontend structure
        const rawTitle = (item.subject || item.title || 'Untitled Product');
        const trimmedTitle = rawTitle.trim().substring(0, 60);

        return {
          id: `1688-${item.offerId || item.id || 'unknown'}`,
          title: trimmedTitle,
          description: "Factory Sourced Item",
          priceNGN: calculatedListingPrice,
          costCNY: rawCostCNY,
          imageUrl: item.imageUrl || '',
          sourceType: 'preorder',
          weightKg: 2.5,
        };
      });

    return NextResponse.json({ success: true, products: dynamicCatalog });

  } catch (error: any) {
    console.error('NextGen Sourcing Route Error:', error.message);
    return NextResponse.json(
      { success: false, products: [] },
      { status: 500 }
    );
  }
}
