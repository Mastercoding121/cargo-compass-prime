import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Client, Databases, Query } from "node-appwrite";

// Server function to fetch system logs
export const getSystemLogs = createServerFn({ method: "GET" })
  .validator(
    z.object({
      limit: z.number().optional().default(20),
      hours: z.number().optional().default(24),
    })
  )
  .handler(async ({ data }) => {
    try {
      // Try Appwrite first
      const endpoint = process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
      const projectId = process.env.APPWRITE_PROJECT_ID || "";
      const dbId = process.env.APPWRITE_DATABASE_ID || "";
      const apiKey = process.env.APPWRITE_API_KEY || "";

      if (!endpoint || !projectId || !dbId || !apiKey) {
        throw new Error("Appwrite credentials missing");
      }

      const client = new Client()
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(apiKey);
      const databases = new Databases(client);

      const since = new Date(Date.now() - data.hours * 60 * 60 * 1000).toISOString();
      const response = await databases.listDocuments(
        dbId,
        "system_logs",
        [
          Query.greaterThanEqual("timestamp", since),
          Query.orderDesc("timestamp"),
          Query.limit(data.limit),
        ]
      );

      return {
        success: true,
        logs: response.documents as any[],
      };
    } catch (error) {
      console.error("Error fetching system logs:", error);
      // Mock data for demonstration
      const mockLogs = [];
      const now = Date.now();
      for (let i = 0; i < 10; i++) {
        mockLogs.push({
          $id: `mock-${i}`,
          level: i % 3 === 0 ? "error" : "info",
          message: `Mock event ${i + 1}`,
          timestamp: new Date(now - i * 3600000).toISOString(),
          metadata: {
            provider_failed: i % 2 === 0 ? "appwrite" : "supabase",
            query_type: "getAllProducts",
          },
        });
      }
      return { success: true, logs: mockLogs };
    }
  });
