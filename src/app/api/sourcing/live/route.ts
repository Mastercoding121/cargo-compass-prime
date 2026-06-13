import { NextResponse } from 'next/server';

// Configuration parameters for your logistics margins
const EXCHANGE_RATE_CNY_TO_NGN = 215; // 1 CNY = 215 NGN
const AIR_FREIGHT_PER_KG_USD = 8.5;   // $8.50 USD per Kg
const NGN_PER_USD = 1550;             // 1 USD = 1,550 NGN

// Type definitions for API response
interface MarketplaceProduct {
  id?: string | number;
  title?: string;
  price?: number | string;
  imageUrl?: string;
  thumbnail?: string;
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
    // 1. Check for MARKETPLACE_API_KEY
    const API_KEY = process.env.MARKETPLACE_API_KEY;
    if (!API_KEY) {
      console.warn('MARKETPLACE_API_KEY is missing! Proceeding with unauthenticated request.');
    }

    // 2. Fetch from the marketplace API bridge endpoint with cache revalidation (3600s = 1 hour)
    const targetUrl = 'https://api.parse.bot/v1/1688/search_products?query=musical+instruments&page=1';
    const response = await fetch(targetUrl, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        ...(API_KEY ? { 'Authorization': `Bearer ${API_KEY}` } : {}),
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from marketplace API');
    }

    const scrapedData: MarketplaceProduct[] = await response.json();

    // 3. Process and map the data
    const dynamicCatalog = scrapedData
      .slice(0, 12) // Limit to top 12 primary products
      .map((item: MarketplaceProduct): MappedProduct => {
        // Safely extract cost in CNY, default to 50 if missing/corrupt
        let rawCostCNY: number;
        if (typeof item.price === 'number') {
          rawCostCNY = item.price;
        } else if (typeof item.price === 'string') {
          rawCostCNY = parseFloat(item.price.replace(/[^\d.]/g, ''));
        } else {
          rawCostCNY = 50;
        }
        // Fallback if parsed value is NaN
        if (isNaN(rawCostCNY)) {
          rawCostCNY = 50;
        }

        // Calculate baseline product factory cost in local currency
        const baseCostNGN = rawCostCNY * EXCHANGE_RATE_CNY_TO_NGN;

        // Fixed estimated weight
        const estimatedWeight = 2.5;
        const estimatedShippingNGN = estimatedWeight * AIR_FREIGHT_PER_KG_USD * NGN_PER_USD;

        // Final customer presentation price including 15% markup, rounded up
        const calculatedListingPrice = Math.ceil((baseCostNGN + estimatedShippingNGN) * 1.15);

        // Map to our UI state contract
        return {
          id: `1688-${item.id || 'unknown'}`,
          title: item.title || 'Untitled Product',
          description: "Factory Procurement Option. Sourced directly from verified international supplier network.",
          priceNGN: calculatedListingPrice,
          costCNY: rawCostCNY,
          imageUrl: item.imageUrl || item.thumbnail || '',
          sourceType: 'preorder',
          weightKg: estimatedWeight,
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
