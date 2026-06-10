/* APPWRITE: Client and server configuration for database access */
import { Client, Databases, Query, ID } from "appwrite";

// Environment variables with fallbacks
export const APPWRITE_ENDPOINT =
  import.meta.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
  "https://cloud.appwrite.io/v1";
export const APPWRITE_PROJECT_ID =
  import.meta.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";
export const APPWRITE_DATABASE_ID =
  import.meta.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "";
export const APPWRITE_PRODUCTS_COLLECTION_ID =
  import.meta.env.NEXT_PUBLIC_APPWRITE_PRODUCTS_COLLECTION_ID || "products";
export const APPWRITE_PENDING_QUEUE_COLLECTION_ID =
  import.meta.env.NEXT_PUBLIC_APPWRITE_PENDING_QUEUE_COLLECTION_ID || "pending_scraping_queue";

// Initialize Appwrite client
export const createAppwriteClient = () => {
  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);
  return client;
};

// Appwrite Products Collection Type
export interface AppwriteProduct {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  $databaseId: string;
  $collectionId: string;
  product_id: string;
  title_english: string;
  image_url: string;
  original_1688_link: string;
  price_yuan: number;
  price_naira: number;
  moq: number;
  sales_volume: number;
  category: string;
}

// Helper to fetch products from Appwrite (or fall back to mock data)
export async function fetchProducts({
  page = 1,
  limit = 20,
}: {
  page?: number;
  limit?: number;
} = {}): Promise<{
  products: AppwriteProduct[];
  total: number;
}> {
  try {
    // Only try Appwrite if we have the necessary credentials
    if (!APPWRITE_PROJECT_ID || !APPWRITE_DATABASE_ID) {
      throw new Error("Appwrite credentials not configured");
    }

    const client = createAppwriteClient();
    const databases = new Databases(client);
    const offset = (page - 1) * limit;

    const response = await databases.listDocuments({
      databaseId: APPWRITE_DATABASE_ID,
      collectionId: APPWRITE_PRODUCTS_COLLECTION_ID,
      queries: [Query.limit(limit), Query.offset(offset), Query.orderDesc("sales_volume")]
    });

    return {
      products: response.documents as unknown as AppwriteProduct[],
      total: response.total,
    };
  } catch (error) {
    console.error("Error fetching from Appwrite:", error);
    // Fall back to mock data with pagination
    return getMockProducts({ page, limit });
  }
}

// Helper to find product by 1688 link
export async function fetchProductBy1688Link(url: string): Promise<AppwriteProduct | null> {
  try {
    if (!APPWRITE_PROJECT_ID || !APPWRITE_DATABASE_ID) {
      throw new Error("Appwrite credentials not configured");
    }

    const client = createAppwriteClient();
    const databases = new Databases(client);
    const response = await databases.listDocuments({
      databaseId: APPWRITE_DATABASE_ID,
      collectionId: APPWRITE_PRODUCTS_COLLECTION_ID,
      queries: [Query.equal("original_1688_link", url), Query.limit(1)]
    });

    if (response.documents.length > 0) {
      return response.documents[0] as unknown as AppwriteProduct;
    }
    return null;
  } catch (error) {
    console.error("Error fetching product by link:", error);
    return null;
  }
}

// Helper to add a URL to pending scraping queue
export async function addToPendingScrapingQueue(original1688Link: string, userId?: string): Promise<boolean> {
  try {
    if (!APPWRITE_PROJECT_ID || !APPWRITE_DATABASE_ID) {
      throw new Error("Appwrite credentials not configured");
    }

    const client = createAppwriteClient();
    const databases = new Databases(client);
    await databases.createDocument({
      databaseId: APPWRITE_DATABASE_ID,
      collectionId: APPWRITE_PENDING_QUEUE_COLLECTION_ID,
      documentId: ID.unique(),
      data: {
        original_1688_link: original1688Link,
        requested_at: new Date().toISOString(),
        user_id: userId || "",
        is_processed: false,
      },
    });

    return true;
  } catch (error) {
    // If URL already exists, just return true
    console.warn("URL already in queue or error adding to queue:", error);
    return true;
  }
}

// Mock data generator that mimics the Appwrite schema (for development without Appwrite)
import { PRODUCT_FEED } from "./products";

export function getMockProducts({
  page = 1,
  limit = 20,
}: {
  page?: number;
  limit?: number;
} = {}): {
  products: AppwriteProduct[];
  total: number;
} {
  // Convert PRODUCT_FEED to AppwriteProduct format
  const mockProducts: AppwriteProduct[] = PRODUCT_FEED.map((p, index) => ({
    $id: p.id,
    $createdAt: new Date().toISOString(),
    $updatedAt: new Date().toISOString(),
    $permissions: [],
    $databaseId: "mock-db",
    $collectionId: "products",
    product_id: p.id,
    title_english: p.title,
    image_url: p.image,
    original_1688_link: `https://1688.com/item/${p.id}`,
    price_yuan: p.pricePerUnitCNY,
    price_naira: p.pricePerUnitCNY * 50, // Mock conversion
    moq: p.moq,
    sales_volume: PRODUCT_FEED.length - index, // Descending sales volume for sorting
    category: p.category,
  }));

  const offset = (page - 1) * limit;
  const paginatedProducts = mockProducts.slice(offset, offset + limit);

  return {
    products: paginatedProducts,
    total: mockProducts.length,
  };
}

// Helper to get related items by category
export async function getRelatedItems(category: string, excludeId: string): Promise<AppwriteProduct[]> {
  try {
    // Only try Appwrite if we have credentials, otherwise use mock data
    if (!APPWRITE_PROJECT_ID || !APPWRITE_DATABASE_ID) {
      throw new Error("Appwrite credentials not configured");
    }
    const client = createAppwriteClient();
    const databases = new Databases(client);
    const response = await databases.listDocuments({
      databaseId: APPWRITE_DATABASE_ID,
      collectionId: APPWRITE_PRODUCTS_COLLECTION_ID,
      queries: [
        Query.equal("category", category),
        Query.notEqual("product_id", excludeId),
        Query.limit(4),
        Query.orderDesc("sales_volume"),
      ]
    });
    return response.documents as unknown as AppwriteProduct[];
  } catch (error) {
    console.error("Error fetching related items:", error);
    const { products } = getMockProducts({ limit: 100 });
    return products.filter(p => p.category === category && p.product_id !== excludeId).slice(0, 4);
  }
}
