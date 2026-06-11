import { Client, Databases, Query } from "node-appwrite";
import { config } from "dotenv";

config({ path: ".env.local" });

const APPWRITE_ENDPOINT =
  process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID =
  process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || "";
const DATABASE_ID =
  process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "";

if (!APPWRITE_PROJECT_ID || !APPWRITE_API_KEY || !DATABASE_ID) {
  console.error("Missing Appwrite credentials. Please set APPWRITE_PROJECT_ID, APPWRITE_API_KEY, and APPWRITE_DATABASE_ID in .env.local or environment variables.");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);
const collectionIds = [
  "6a28a55d0019a1b84974",
  "6a28a7880006c1d7174d",
  "6a28a834003b0ab87ba3",
  "6a28a78c0029b2bca508",
  "6a28a83800284a66c8f2",
  "6a28a78f003002c27730",
  "6a28a83b001634d7554c",
];

async function printDetails() {
  console.log(`\nCollection metadata for databaseId=${DATABASE_ID}`);
  for (const id of collectionIds) {
    try {
      const collection = await databases.getCollection({ databaseId: DATABASE_ID, collectionId: id });
      console.log("--------------------------------------------------");
      console.log(`Name: ${collection.name}`);
      console.log(`ID: ${collection.$id}`);
      console.log(`Permissions: ${JSON.stringify(collection.permissions || [])}`);
      console.log(`Attribute keys: ${Array.isArray(collection.attributes) ? collection.attributes.map((attr) => attr.key).join(", ") : "<none>"}`);
      console.log(`Index keys: ${Array.isArray(collection.indexes) ? collection.indexes.map((index) => index.key).join(", ") : "<none>"}`);
      const docs = await databases.listDocuments({
        databaseId: DATABASE_ID,
        collectionId: collection.$id,
        queries: [Query.limit(1)],
      });
      console.log(`Sample document count: ${docs.documents?.length || 0}`);
    } catch (error) {
      console.error(`Failed to inspect collection ${id}:`, error.message || error);
    }
  }
}

printDetails();
