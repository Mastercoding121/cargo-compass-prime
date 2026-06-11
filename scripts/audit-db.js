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
const args = process.argv.slice(2);
const deleteArg = args.find((arg) => arg.startsWith("--delete="));
const deleteIds = deleteArg
  ? deleteArg
      .split("=")[1]
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  : [];
const confirmDelete = args.includes("--confirm");

async function deleteCollections(ids) {
  for (const id of ids) {
    try {
      await databases.deleteCollection({ databaseId: DATABASE_ID, collectionId: id });
      console.log(`Deleted collection ${id}`);
    } catch (error) {
      console.error(`Failed to delete collection ${id}:`, error);
    }
  }
}

async function auditCollections() {
  try {
    const response = await databases.listCollections({ databaseId: DATABASE_ID });
    const collections = response.collections || [];

    console.log(`\nAppwrite Database Audit for databaseId=${DATABASE_ID}`);
    console.log("===============================================================\n");
    console.log("Collection mapping (Name -> ID):");
    const collectionInfo = await Promise.all(
      collections.map(async (collection) => {
        const docs = await databases.listDocuments({
          databaseId: DATABASE_ID,
          collectionId: collection.$id,
          queries: [Query.limit(1)],
        });
        const total = typeof docs.total === "number" ? docs.total : docs.documents?.length || 0;
        console.log(`- ${collection.name} -> ${collection.$id} (total docs: ${total})`);
        return { name: collection.name, id: collection.$id, total };
      })
    );

    const duplicates = collectionInfo.reduce((acc, collection) => {
      acc[collection.name] = acc[collection.name] || [];
      acc[collection.name].push(collection.id);
      return acc;
    }, {});

    const duplicateNames = Object.entries(duplicates).filter(([, ids]) => ids.length > 1);

    if (duplicateNames.length === 0) {
      console.log("\n✅ No duplicate collection names found.");
    } else {
      console.log("\n⚠️ Duplicate collection names detected:");
      duplicateNames.forEach(([name, ids]) => {
        console.log(`\n- Name: ${name}`);
        ids.forEach((id) => console.log(`   • ${id}`));
      });
      console.log("\nUse the collection IDs above to update your adapter and remove orphaned copies if needed.");
    }
    if (deleteIds.length && !confirmDelete) {
      console.log("\n--delete flag detected but not confirmed.");
      console.log("Run with --delete=<id1,id2> --confirm to remove the specified collections.");
    }

    if (deleteIds.length && confirmDelete) {
      console.log("\nDeleting specified collections...");
      await deleteCollections(deleteIds);
    }
    console.log("\nTo delete an unused collection by ID, use the following API call:");
    console.log("  await databases.deleteCollection({ databaseId: DATABASE_ID, collectionId: '<collection-id>' });");
    console.log("\nRun with `node scripts/audit-db.js`.");
  } catch (error) {
    console.error("Failed to audit Appwrite collections:", error);
    process.exit(1);
  }
}

auditCollections();
