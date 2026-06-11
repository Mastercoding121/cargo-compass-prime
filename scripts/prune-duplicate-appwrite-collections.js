import { Client, Databases, Query, ID } from "node-appwrite";
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
const confirmDelete = args.includes("--confirm");

const canonicalGroups = [
  {
    name: "Products",
    canonicalId: "6a28a834003b0ab87ba3",
    duplicateIds: ["6a28a55d0019a1b84974", "6a28a7880006c1d7174d"],
  },
  {
    name: "Profiles",
    canonicalId: "6a28a83800284a66c8f2",
    duplicateIds: ["6a28a78c0029b2bca508"],
  },
  {
    name: "Orders",
    canonicalId: "6a28a78f003002c27730",
    duplicateIds: ["6a28a83b001634d7554c"],
  },
];

function sanitizeDocument(doc) {
  const sanitized = { ...doc };
  delete sanitized.$id;
  delete sanitized.$databaseId;
  delete sanitized.$collectionId;
  delete sanitized.$createdAt;
  delete sanitized.$updatedAt;
  delete sanitized.$permissions;
  return sanitized;
}

async function listDocumentsPage(collectionId, offset) {
  const response = await databases.listDocuments({
    databaseId: DATABASE_ID,
    collectionId,
    queries: [Query.limit(100), Query.offset(offset)],
  });
  return response.documents || [];
}

async function migrateDocuments(sourceId, targetId) {
  let offset = 0;
  let migrated = 0;
  while (true) {
    const docs = await listDocumentsPage(sourceId, offset);
    if (!docs.length) break;

    for (const doc of docs) {
      const data = sanitizeDocument(doc);
      const desiredId = doc.$id || ID.unique();
      try {
        await databases.createDocument({
          databaseId: DATABASE_ID,
          collectionId: targetId,
          documentId: desiredId,
          data,
        });
      } catch (error) {
        if (error.code === 409) {
          await databases.createDocument({
            databaseId: DATABASE_ID,
            collectionId: targetId,
            documentId: ID.unique(),
            data,
          });
        } else {
          throw error;
        }
      }
      migrated += 1;
    }

    if (docs.length < 100) break;
    offset += docs.length;
  }
  return migrated;
}

async function deleteCollection(collectionId) {
  await databases.deleteCollection({ databaseId: DATABASE_ID, collectionId });
}

async function auditAndPrune() {
  console.log("\nAppwrite duplicate collection cleanup\n");
  const response = await databases.listCollections({ databaseId: DATABASE_ID });
  const collections = response.collections || [];

  const collectionMap = collections.reduce((acc, collection) => {
    acc[collection.name] = acc[collection.name] || [];
    acc[collection.name].push(collection.$id);
    return acc;
  }, {});
  const existingIds = new Set(collections.map((collection) => collection.$id));

  Object.entries(collectionMap).forEach(([name, ids]) => {
    if (ids.length > 1) {
      console.log(`Duplicate collection name: ${name}`);
      ids.forEach((id) => console.log(`  - ${id}`));
    }
  });

  console.log("\nCanonical duplicate groups:");
  canonicalGroups.forEach((group) => {
    const presentDuplicateIds = group.duplicateIds.filter((id) => existingIds.has(id));
    console.log(`\n${group.name}`);
    console.log(`  canonical: ${group.canonicalId}${existingIds.has(group.canonicalId) ? "" : " (missing)"}`);
    presentDuplicateIds.forEach((id) => console.log(`  remove: ${id}`));
    const missing = group.duplicateIds.filter((id) => !existingIds.has(id));
    missing.forEach((id) => console.log(`  skip missing: ${id}`));
  });

  if (!confirmDelete) {
    console.log("\nDry run complete. Add --confirm to migrate and delete duplicate collections.");
    return;
  }

  for (const group of canonicalGroups) {
    if (!existingIds.has(group.canonicalId)) {
      console.warn(`\nWarning: canonical collection ID ${group.canonicalId} for ${group.name} is not present. Skipping group.`);
      continue;
    }

    const candidateDuplicates = group.duplicateIds.filter((id) => id !== group.canonicalId && existingIds.has(id));
    if (!candidateDuplicates.length) {
      console.log(`\nNo present duplicate collections to prune for ${group.name}.`);
      continue;
    }

    for (const duplicateId of candidateDuplicates) {
      const docs = await databases.listDocuments({
        databaseId: DATABASE_ID,
        collectionId: duplicateId,
        queries: [Query.limit(1)],
      });

      if (docs.total > 0) {
        console.log(`\nMigrating documents from ${duplicateId} to ${group.canonicalId}...`);
        const migrated = await migrateDocuments(duplicateId, group.canonicalId);
        console.log(`Migrated ${migrated} documents from ${duplicateId} to ${group.canonicalId}.`);
      } else {
        console.log(`\nNo documents to migrate from ${duplicateId}.`);
      }

      console.log(`Deleting duplicate collection ${duplicateId}...`);
      await deleteCollection(duplicateId);
      console.log(`Deleted ${duplicateId}`);
    }
  }

  console.log("\nCleanup complete.");
}

auditAndPrune().catch((error) => {
  console.error("Cleanup failed:", error);
  process.exit(1);
});
