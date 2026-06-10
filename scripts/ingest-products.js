import { Client, Databases, Query, ID } from "node-appwrite";
import { config } from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import csvParser from "csv-parser";
import { parseArgs } from "node:util";
import axios from "axios";

config({ path: ".env.local" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXCHANGE_RATE_API_URL = "https://api.exchangerate-api.com/v4/latest/CNY";
const FALLBACK_RATE = 280;

async function getLiveExchangeRate() {
  try {
    const response = await axios.get(EXCHANGE_RATE_API_URL);
    const rate = response.data.rates.NGN;
    if (!rate) throw new Error("NGN rate not found in API response");
    console.log(`[Exchange Rate] Fetched live rate: 1 CNY = ${rate} NGN`);
    return rate;
  } catch (error) {
    console.warn(`[Exchange Rate] Failed to fetch live rate, using fallback: ${FALLBACK_RATE}`, error);
    return FALLBACK_RATE;
  }
}

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const PRODUCTS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_PRODUCTS_COLLECTION_ID || "products";

// Read CSV file
function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
}

// Main ingestion function
async function ingestProducts() {
  console.log("🚀 Starting product ingestion...");
  console.log("-------------------------------");

  // Get exchange rate first
  console.log("🔄 Fetching exchange rate...");
  const exchangeRate = await getLiveExchangeRate();
  console.log(`✅ Exchange rate: 1 CNY = ${exchangeRate} NGN`);

  // Parse command line arguments
  const { values } = parseArgs({
    options: {
      file: { type: 'string' },
    },
    strict: false
  });

  // Read products from data/products.json, CSV file, or use command line args
  let productsToIngest;
  try {
    if (values.file) {
      const ext = path.extname(values.file).toLowerCase();
      if (ext === '.csv') {
        const csvData = await readCSV(values.file);
        productsToIngest = csvData.map(row => ({
          product_id: row.product_id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title_english: row.title_english || row.title,
          image_url: row.image_url || row.image,
          original_1688_link: row.original_1688_link || row.link,
          price_yuan: parseFloat(row.price_yuan),
          price_naira: row.price_naira ? parseFloat(row.price_naira) : null,
          moq: parseInt(row.moq) || 1,
          sales_volume: parseInt(row.sales_volume) || 0,
          source: "csv_ingest"
        }));
        console.log(`✅ Loaded ${productsToIngest.length} products from CSV file`);
      } else if (ext === '.json') {
        const dataPath = values.file;
        const data = fs.readFileSync(dataPath, "utf8");
        productsToIngest = JSON.parse(data).map(p => ({ ...p, source: "csv_ingest" }));
        console.log(`✅ Loaded ${productsToIngest.length} products from JSON file`);
      } else {
        console.error(`❌ Unsupported file type: ${ext}`);
        process.exit(1);
      }
    } else {
      const dataPath = path.join(__dirname, "..", "data", "products.json");
      const data = fs.readFileSync(dataPath, "utf8");
      productsToIngest = JSON.parse(data).map(p => ({ ...p, source: "csv_ingest" }));
    }
  } catch (err) {
    console.warn("⚠️ Default data source not found, checking command line arguments...");
    if (process.argv.length < 3) {
      console.error("❌ Error: No products provided. Either create data/products.json, use --file=path/to/file, or pass products as a JSON string.");
      process.exit(1);
    }
    try {
      productsToIngest = JSON.parse(process.argv[2]).map(p => ({ ...p, source: "csv_ingest" }));
    } catch (parseErr) {
      console.error("❌ Error: Invalid JSON string provided as argument.");
      process.exit(1);
    }
  }

  if (!Array.isArray(productsToIngest)) {
    console.error("❌ Error: Products must be an array.");
    process.exit(1);
  }

  if (!DATABASE_ID) {
    console.error("❌ Error: APPWRITE_DATABASE_ID is not set in .env.local.");
    process.exit(1);
  }

  let addedCount = 0;
  let skippedCount = 0;

  for (const product of productsToIngest) {
    try {
      // Check if product with same original_1688_link already exists
      const existingProducts = await databases.listDocuments({
        databaseId: DATABASE_ID,
        collectionId: PRODUCTS_COLLECTION_ID,
        queries: [Query.equal("original_1688_link", product.original_1688_link)]
      });

      if (existingProducts.documents.length > 0) {
        skippedCount++;
        console.log(`⏭️ Skipping duplicate product: ${product.title_english} (link exists)`);
        continue;
      }

      // Clean and truncate title
      let cleanedTitle = (product.title_english || "").trim();
      if (cleanedTitle.length > 500) {
        cleanedTitle = cleanedTitle.substring(0, 497) + "...";
      }

      // Create the product document
      const newProduct = await databases.createDocument({
        databaseId: DATABASE_ID,
        collectionId: PRODUCTS_COLLECTION_ID,
        documentId: ID.unique(),
        data: {
          product_id:
            product.product_id ||
            `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title_english: cleanedTitle,
          image_url: product.image_url,
          original_1688_link: product.original_1688_link,
          price_yuan: parseFloat(product.price_yuan),
          price_naira: product.price_naira || parseFloat(product.price_yuan) * exchangeRate,
          moq: parseInt(product.moq) || 1,
          sales_volume: parseInt(product.sales_volume) || 0,
          source: product.source || "csv_ingest"
        },
      });

      addedCount++;
      console.log(`✅ Added product: ${cleanedTitle}`);
    } catch (error) {
      console.error(
        `❌ Error processing product "${product.title_english || 'Unknown'}":`,
        error.response ? error.response.message : error.message
      );
    }
  }

  // Summary report
  console.log("\n-------------------------------");
  console.log("📊 Ingestion Complete:");
  console.log(`✅ ${addedCount} products added.`);
  console.log(`⏭️ ${skippedCount} products skipped (duplicates).`);
}

// Run the script
ingestProducts().catch((err) => {
  console.error("❌ Fatal error during ingestion:", err);
  process.exit(1);
});
