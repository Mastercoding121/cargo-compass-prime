import { createFileRoute } from "@tanstack/react-router";
import { LoaderFunctionArgs } from "@tanstack/react-router";
import { search1688, SourcedProduct } from "../lib/server/scraper";
import { Client, Databases, ID, Query } from "node-appwrite";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

config({ path: path.join(fileURLToPath(import.meta.url), "../../../.env.local") });

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const PRODUCTS_COLLECTION_ID =
  process.env.APPWRITE_PRODUCTS_COLLECTION_ID || "products";
const PENDING_QUEUE_COLLECTION_ID = "pending_scraping_queue";
const SYSTEM_LOGS_COLLECTION_ID = "system_logs";

async function logSystemEvent(
  level: "info" | "warn" | "error",
  message: string,
  metadata?: Record<string, any>
) {
  if (!DATABASE_ID) return;
  try {
    await databases.createDocument({
      databaseId: DATABASE_ID,
      collectionId: SYSTEM_LOGS_COLLECTION_ID,
      documentId: ID.unique(),
      data: {
        level,
        message,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to log system event:", error);
  }
}

export const Route = createFileRoute("/api/search")({
  async loader({ request, params }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const query = url.searchParams.get("q") || "";

    if (!query) {
      return new Response(JSON.stringify({ error: "Query parameter 'q' is required" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    try {
      // First check Appwrite for existing products
      let existingProducts: any[] = [];
      if (DATABASE_ID) {
        try {
          const result = await databases.listDocuments({
            databaseId: DATABASE_ID,
            collectionId: PRODUCTS_COLLECTION_ID,
            queries: [Query.search("title_english", query)],
          });
          existingProducts = result.documents;
        } catch (error) {
          console.warn("Failed to fetch existing products:", error);
        }
      }

      if (existingProducts.length > 0) {
        return new Response(JSON.stringify({
          type: "cached",
          products: existingProducts,
        }), {
          headers: { "content-type": "application/json" },
        });
      }

      // If no existing products, try to scrape 1688
      let sourcedProducts: SourcedProduct[] = [];
      let scrapeError = false;

      try {
        sourcedProducts = await search1688(query);
      } catch (error) {
        scrapeError = true;
        await logSystemEvent("error", "1688 scrape failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      }

      if (scrapeError) {
        return new Response(JSON.stringify({
          type: "error",
          message: "Manual sourcing required",
        }), {
          headers: { "content-type": "application/json" },
        });
      }

      // Save products to pending queue for admin approval
      for (const product of sourcedProducts) {
        try {
          if (DATABASE_ID) {
            await databases.createDocument({
              databaseId: DATABASE_ID,
              collectionId: PENDING_QUEUE_COLLECTION_ID,
              documentId: ID.unique(),
              data: {
                original_1688_link: product.original_1688_link,
                title_english: product.title_english,
                image_url: product.image_url,
                price_yuan: product.price_yuan,
                price_naira: product.price_naira,
                is_processed: false,
                source: "ai_sourced",
                requested_at: new Date().toISOString(),
              },
            });
          }
        } catch (error) {
          // If product already exists in queue, just skip
          console.warn("Product already in queue:", error);
        }
      }

      await logSystemEvent("info", "1688 search completed", {
        query,
        resultsCount: sourcedProducts.length,
      });

      return new Response(JSON.stringify({
        type: "sourced",
        products: sourcedProducts,
      }), {
        headers: { "content-type": "application/json" },
      });
    } catch (error) {
      console.error("Search failed:", error);
      return new Response(JSON.stringify({
        type: "error",
        message: "An error occurred during search",
      }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
  },
});
