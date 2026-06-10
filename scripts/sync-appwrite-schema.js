import { Client, Databases, ID } from "node-appwrite";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

config({ path: ".env.local" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

// Define all required collections with attributes and indexes
const collections = [
  {
    id: "products",
    name: "Products",
    attributes: [
      { key: "product_id", type: "string", size: 255, required: true },
      { key: "title_english", type: "string", size: 500, required: true },
      { key: "image_url", type: "string", size: 2000, required: true },
      { key: "original_1688_link", type: "string", size: 255, required: true },
      { key: "price_yuan", type: "double", required: true },
      { key: "price_naira", type: "double", required: true },
      { key: "moq", type: "integer", required: true },
      { key: "sales_volume", type: "integer", required: false, default: 0 },
      { key: "source", type: "string", size: 50, required: false, default: "csv_ingest" },
    ],
    indexes: [
      { key: "idx_product_id", type: "unique", attributes: ["product_id"] },
      { key: "idx_sales_volume", type: "key", attributes: ["sales_volume"] },
    ],
  },
  {
    id: "pending_scraping_queue",
    name: "Pending Scraping Queue",
    attributes: [
      { key: "original_1688_link", type: "string", size: 255, required: true },
      { key: "requested_at", type: "datetime", required: false },
      { key: "user_id", type: "string", size: 255, required: false },
      { key: "is_processed", type: "boolean", required: false, default: false },
      { key: "title_english", type: "string", size: 500, required: false },
      { key: "image_url", type: "string", size: 2000, required: false },
      { key: "price_yuan", type: "double", required: false },
      { key: "price_naira", type: "double", required: false },
      { key: "source", type: "string", size: 50, required: false, default: "ai_sourced" },
    ],
    indexes: [
      { key: "idx_original_link", type: "unique", attributes: ["original_1688_link"] },
      { key: "idx_is_processed", type: "key", attributes: ["is_processed"] },
    ],
  },
  {
    id: "system_logs",
    name: "System Logs",
    attributes: [
      { key: "level", type: "string", size: 20, required: true, default: "info" },
      { key: "message", type: "string", size: 2000, required: true },
      { key: "metadata", type: "string", size: 5000, required: false },
      { key: "timestamp", type: "datetime", required: true },
    ],
    indexes: [
      { key: "idx_timestamp", type: "key", attributes: ["timestamp"] },
      { key: "idx_level", type: "key", attributes: ["level"] },
    ],
  },
  {
    id: "settings",
    name: "Settings",
    attributes: [
      { key: "key", type: "string", size: 100, required: true },
      { key: "value", type: "string", size: 1000, required: true },
      { key: "updated_at", type: "datetime", required: false },
    ],
    indexes: [
      { key: "idx_key", type: "unique", attributes: ["key"] },
    ],
  },
  {
    id: "profiles",
    name: "Profiles",
    attributes: [
      { key: "email", type: "string", size: 255, required: true },
      { key: "name", type: "string", size: 255, required: false },
      { key: "role", type: "string", size: 20, required: false, default: "customer" },
      { key: "handleId", type: "string", size: 50, required: true },
      { key: "walletBalance", type: "double", required: false, default: 0 },
    ],
    indexes: [
      { key: "idx_email", type: "unique", attributes: ["email"] },
      { key: "idx_role", type: "key", attributes: ["role"] },
    ],
  },
  {
    id: "orders",
    name: "Orders",
    attributes: [
      { key: "userId", type: "string", size: 255, required: true },
      { key: "supplier1688CartId", type: "string", size: 255, required: false },
      { key: "status", type: "string", size: 50, required: true },
      { key: "totalNairaAmount", type: "double", required: true },
      { key: "chinaWaybillNumber", type: "string", size: 255, required: false },
      { key: "localWaybillNumber", type: "string", size: 255, required: false },
    ],
    indexes: [
      { key: "idx_user_id", type: "key", attributes: ["userId"] },
      { key: "idx_status", type: "key", attributes: ["status"] },
    ],
  },
];

async function syncSchema() {
  console.log("🔍 Starting Appwrite Schema Sync...\n");
  console.log("-------------------------------------");

  if (!DATABASE_ID) {
    console.error("❌ NEXT_PUBLIC_APPWRITE_DATABASE_ID not found in .env.local");
    process.exit(1);
  }

  try {
    // Try to get the database first
    let database;
    try {
      database = await databases.get({ databaseId: DATABASE_ID });
      console.log(`✅ Found database: ${database.name} (${DATABASE_ID})`);
    } catch (dbError) {
      // If database not found, try to create it (only in dev/self-hosted)
      console.warn(
        `⚠️ Database not found (${DATABASE_ID}). Please create a database in Appwrite Console first.`
      );
      process.exit(1);
    }

    for (const collectionDef of collections) {
      console.log(`\n📦 Processing collection: ${collectionDef.name}`);

      // Check if collection exists
      let collectionId;
      try {
        // First try with collectionDef.id
        const existingCollection = await databases.getCollection({ databaseId: DATABASE_ID, collectionId: collectionDef.id });
        collectionId = existingCollection.$id;
        console.log(`   ✅ Collection exists: ${collectionDef.name}`);
      } catch (colError) {
        if (colError.code === 404) {
          console.log(`   ➕ Creating collection: ${collectionDef.name}`);
          const newCollection = await databases.createCollection({
            databaseId: DATABASE_ID,
            collectionId: ID.unique(),
            name: collectionDef.name
          });
          collectionId = newCollection.$id;
          console.log(`   ✅ Created collection: ${collectionId}`);
        } else {
          throw colError;
        }
      }

      // Skip listing attributes/indexes to avoid API issues, just try to create them and catch errors
      for (const attrDef of collectionDef.attributes) {
        console.log(`   ➕ Trying to add attribute: ${attrDef.key}`);
        try {
          if (attrDef.type === "string") {
            await databases.createStringAttribute({
              databaseId: DATABASE_ID,
              collectionId: collectionId,
              key: attrDef.key,
              size: attrDef.size || 255,
              required: attrDef.required,
              xdefault: attrDef.default,
              array: attrDef.array || false
            });
            console.log(`   ✅ Added attribute: ${attrDef.key}`);
          } else if (attrDef.type === "double") {
            await databases.createFloatAttribute({
              databaseId: DATABASE_ID,
              collectionId: collectionId,
              key: attrDef.key,
              required: attrDef.required,
              xdefault: attrDef.default,
              array: attrDef.array || false
            });
            console.log(`   ✅ Added attribute: ${attrDef.key}`);
          } else if (attrDef.type === "integer") {
            await databases.createIntegerAttribute({
              databaseId: DATABASE_ID,
              collectionId: collectionId,
              key: attrDef.key,
              required: attrDef.required,
              xdefault: attrDef.default,
              array: attrDef.array || false
            });
            console.log(`   ✅ Added attribute: ${attrDef.key}`);
          } else if (attrDef.type === "boolean") {
            await databases.createBooleanAttribute({
              databaseId: DATABASE_ID,
              collectionId: collectionId,
              key: attrDef.key,
              required: attrDef.required,
              xdefault: attrDef.default,
              array: attrDef.array || false
            });
            console.log(`   ✅ Added attribute: ${attrDef.key}`);
          } else if (attrDef.type === "datetime") {
            await databases.createDatetimeAttribute({
              databaseId: DATABASE_ID,
              collectionId: collectionId,
              key: attrDef.key,
              required: attrDef.required,
              xdefault: attrDef.default,
              array: attrDef.array || false
            });
            console.log(`   ✅ Added attribute: ${attrDef.key}`);
          }
        } catch (attrError) {
          // If attribute already exists, we'll get a 409 Conflict, which is fine!
          if (attrError.code === 409) {
            console.log(`   ✓ Attribute already exists: ${attrDef.key}`);
          } else {
            console.warn(`   ⚠️ Failed to add attribute ${attrDef.key}: ${attrError.message}`);
          }
        }
      }

      // Add indexes
      for (const idxDef of collectionDef.indexes) {
        console.log(`   ➕ Trying to add index: ${idxDef.key}`);
        try {
          await databases.createIndex({
            databaseId: DATABASE_ID,
            collectionId: collectionId,
            key: idxDef.key,
            type: idxDef.type,
            attributes: idxDef.attributes
          });
          console.log(`   ✅ Added index: ${idxDef.key}`);
        } catch (idxError) {
          if (idxError.code === 409) {
            console.log(`   ✓ Index already exists: ${idxDef.key}`);
          } else {
            console.warn(`   ⚠️ Failed to add index ${idxDef.key}: ${idxError.message}`);
          }
        }
      }
    }

    console.log("\n-------------------------------------");
    console.log("🎉 Schema sync complete!");
    console.log("-------------------------------------");
  } catch (error) {
    console.error("\n❌ Schema sync failed!");
    console.error("   Error:", error.message);
    if (error.response) {
      console.error("   Details:", error.response);
    }
    process.exit(1);
  }
}

syncSchema();
