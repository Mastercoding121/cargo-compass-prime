import { Client, Databases, Query, ID } from "node-appwrite";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID || "6a289d82001be83823ce";
const APPWRITE_PRODUCTS_COLLECTION_ID = process.env.APPWRITE_PRODUCTS_COLLECTION_ID || "6a28a834003b0ab87ba3";
const APPWRITE_ORDERS_COLLECTION_ID = process.env.APPWRITE_ORDERS_COLLECTION_ID || "6a28a78f003002c27730";
const APPWRITE_PENDING_QUEUE_COLLECTION_ID = process.env.APPWRITE_PENDING_QUEUE_COLLECTION_ID || "6a28a9a9000912345678";
const APPWRITE_LOGS_COLLECTION_ID = process.env.APPWRITE_LOGS_COLLECTION_ID || "6a28a9f0001234567890";

// Universal Types
export interface Product {
  id?: string;
  product_id?: string;
  title_english?: string;
  image_url?: string;
  original_1688_link?: string;
  price_yuan?: number;
  price_naira?: number;
  moq?: number;
  sales_volume?: number;
  category?: string;
  source?: string;
}

export interface OrderItem {
  productLink: string;
  title: string;
  image: string;
  quantity: number;
  priceYuan: number;
}

export interface Order {
  id?: string;
  user_id?: string;
  status?: string;
  total_naira_amount?: number;
  items?: OrderItem[];
  supplier_1688_cart_id?: string;
  china_waybill_number?: string;
  local_waybill_number?: string;
  created_at?: string;
  updated_at?: string;
}

export interface QueueItem {
  original_1688_link: string;
  title_english: string;
  image_url: string;
  price_yuan: number;
  price_naira: number;
  source?: string;
}

export interface DBInterface {
  // Products
  getAllProducts(queries?: string[]): Promise<Product[]>;
  getProductById(id: string): Promise<Product | null>;
  searchProducts(query: string): Promise<Product[]>;
  getRelatedProducts(category: string, excludeId?: string): Promise<Product[]>;
  createProduct(data: Omit<Product, "id">): Promise<Product>;
  // Orders
  getAllOrders(userId?: string): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | null>;
  createOrder(data: Omit<Order, "id" | "created_at" | "updated_at">): Promise<Order>;
  updateOrder(id: string, data: Partial<Omit<Order, "id" | "created_at">>): Promise<Order>;
  // Queue
  saveToQueue(data: QueueItem): Promise<{ id: string }>;
  // Logging
  logSystemEvent(
    level: "info" | "warn" | "error",
    message: string,
    metadata?: Record<string, any>
  ): Promise<void>;
}

// Appwrite Adapter
class AppwriteAdapter implements DBInterface {
  private databases: Databases;
  private dbId: string;
  private productsCollection = APPWRITE_PRODUCTS_COLLECTION_ID;
  private ordersCollection = APPWRITE_ORDERS_COLLECTION_ID;
  private queueCollection = APPWRITE_PENDING_QUEUE_COLLECTION_ID;
  private logsCollection = APPWRITE_LOGS_COLLECTION_ID;

  constructor() {
    const endpoint = process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
    const projectId = process.env.APPWRITE_PROJECT_ID || "";
    const apiKey = process.env.APPWRITE_API_KEY || "";
    this.dbId = APPWRITE_DATABASE_ID;

    const client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);

    this.databases = new Databases(client);
  }

  async getAllProducts(queries: string[] = []): Promise<Product[]> {
    try {
      const result = await this.databases.listDocuments(this.dbId, this.productsCollection, queries);
      return result.documents as unknown as Product[];
    } catch (error) {
      console.error(`[DB] Error in getAllProducts (collection: ${this.productsCollection}):`, error);
      throw error;
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    try {
      const doc = await this.databases.getDocument(this.dbId, this.productsCollection, id);
      return doc as unknown as Product;
    } catch (error) {
      console.error(`[DB] Error in getProductById (collection: ${this.productsCollection}, id: ${id}):`, error);
      return null;
    }
  }

  async searchProducts(query: string): Promise<Product[]> {
    try {
      const result = await this.databases.listDocuments(this.dbId, this.productsCollection, [
        Query.search("title_english", query),
      ]);
      return result.documents as unknown as Product[];
    } catch (error) {
      console.error(`[DB] Error in searchProducts (collection: ${this.productsCollection}, query: ${query}):`, error);
      throw error;
    }
  }

  async getRelatedProducts(category: string, excludeId?: string): Promise<Product[]> {
    try {
      const queries = [Query.equal("category", category), Query.limit(5)];
      if (excludeId) {
        queries.push(Query.notEqual("$id", excludeId));
      }
      const result = await this.databases.listDocuments(this.dbId, this.productsCollection, queries);
      return result.documents as unknown as Product[];
    } catch (error) {
      console.error(`[DB] Error in getRelatedProducts (collection: ${this.productsCollection}, category: ${category}):`, error);
      throw error;
    }
  }

  async createProduct(data: Omit<Product, "id">): Promise<Product> {
    try {
      const docId = data.product_id || ID.unique();
      const doc = await this.databases.createDocument(this.dbId, this.productsCollection, docId, data);
      return doc as unknown as Product;
    } catch (error) {
      console.error(`[DB] Error in createProduct (collection: ${this.productsCollection}):`, error);
      throw error;
    }
  }

  async getAllOrders(userId?: string): Promise<Order[]> {
    try {
      const queries: string[] = [];
      if (userId) {
        queries.push(Query.equal("user_id", userId));
      }
      const result = await this.databases.listDocuments(this.dbId, this.ordersCollection, queries);
      return result.documents as unknown as Order[];
    } catch (error) {
      console.error(`[DB] Error in getAllOrders (collection: ${this.ordersCollection}):`, error);
      throw error;
    }
  }

  async getOrderById(id: string): Promise<Order | null> {
    try {
      const doc = await this.databases.getDocument(this.dbId, this.ordersCollection, id);
      return doc as unknown as Order;
    } catch (error) {
      console.error(`[DB] Error in getOrderById (collection: ${this.ordersCollection}, id: ${id}):`, error);
      return null;
    }
  }

  async createOrder(data: Omit<Order, "id" | "created_at" | "updated_at">): Promise<Order> {
    try {
      const docId = ID.unique();
      const doc = await this.databases.createDocument(this.dbId, this.ordersCollection, docId, data);
      return doc as unknown as Order;
    } catch (error) {
      console.error(`[DB] Error in createOrder (collection: ${this.ordersCollection}):`, error);
      throw error;
    }
  }

  async updateOrder(id: string, data: Partial<Omit<Order, "id" | "created_at">>): Promise<Order> {
    try {
      const doc = await this.databases.updateDocument(this.dbId, this.ordersCollection, id, data);
      return doc as unknown as Order;
    } catch (error) {
      console.error(`[DB] Error in updateOrder (collection: ${this.ordersCollection}, id: ${id}):`, error);
      throw error;
    }
  }

  async saveToQueue(data: QueueItem): Promise<{ id: string }> {
    try {
      const docId = ID.unique();
      const doc = await this.databases.createDocument(this.dbId, this.queueCollection, docId, {
        ...data,
        is_processed: false,
        requested_at: new Date().toISOString(),
      });
      return { id: doc.$id };
    } catch (error) {
      console.error(`[DB] Error in saveToQueue (collection: ${this.queueCollection}):`, error);
      throw error;
    }
  }

  async logSystemEvent(
    level: "info" | "warn" | "error",
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const docId = ID.unique();
      await this.databases.createDocument(this.dbId, this.logsCollection, docId, {
        level,
        message,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`[DB] Error in logSystemEvent (collection: ${this.logsCollection}):`, error);
      throw error;
    }
  }
}

// Supabase Adapter
class SupabaseAdapter implements DBInterface {
  private supabase: ReturnType<typeof createSupabaseClient>;

  constructor() {
    const url = process.env.SUPABASE_URL || "";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    this.supabase = createSupabaseClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  async getAllProducts(queries?: string[]): Promise<Product[]> {
    try {
      let builder = this.supabase.from("products").select("*");
      const { data, error } = await builder;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`[DB] Error in getAllProducts (collection: products):`, error);
      throw error;
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await this.supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
      if (error) return null;
      return data;
    } catch (error) {
      console.error(`[DB] Error in getProductById (collection: products, id: ${id}):`, error);
      return null;
    }
  }

  async searchProducts(query: string): Promise<Product[]> {
    try {
      const { data, error } = await this.supabase
        .from("products")
        .select("*")
        .ilike("title_english", `%${query}%`);
      if (error) return [];
      return data || [];
    } catch (error) {
      console.error(`[DB] Error in searchProducts (collection: products, query: ${query}):`, error);
      return [];
    }
  }

  async getRelatedProducts(category: string, excludeId?: string): Promise<Product[]> {
    try {
      let builder = this.supabase
        .from("products")
        .select("*")
        .eq("category", category)
        .limit(5);
      if (excludeId) {
        builder = builder.neq("id", excludeId);
      }
      const { data, error } = await builder;
      if (error) return [];
      return data || [];
    } catch (error) {
      console.error(`[DB] Error in getRelatedProducts (collection: products, category: ${category}):`, error);
      return [];
    }
  }

  async createProduct(data: Omit<Product, "id">): Promise<Product> {
    try {
      const { data: product, error } = await this.supabase
        .from("products")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return product;
    } catch (error) {
      console.error(`[DB] Error in createProduct (collection: products):`, error);
      throw error;
    }
  }

  async getAllOrders(userId?: string): Promise<Order[]> {
    try {
      let builder = this.supabase.from("orders").select("*");
      if (userId) {
        builder = builder.eq("user_id", userId);
      }
      const { data, error } = await builder;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`[DB] Error in getAllOrders (collection: orders):`, error);
      throw error;
    }
  }

  async getOrderById(id: string): Promise<Order | null> {
    try {
      const { data, error } = await this.supabase.from("orders").select("*").eq("id", id).single();
      if (error) return null;
      return data;
    } catch (error) {
      console.error(`[DB] Error in getOrderById (collection: orders, id: ${id}):`, error);
      return null;
    }
  }

  async createOrder(data: Omit<Order, "id" | "created_at" | "updated_at">): Promise<Order> {
    try {
      const { data: order, error } = await this.supabase
        .from("orders")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return order;
    } catch (error) {
      console.error(`[DB] Error in createOrder (collection: orders):`, error);
      throw error;
    }
  }

  async updateOrder(id: string, data: Partial<Omit<Order, "id" | "created_at">>): Promise<Order> {
    try {
      const { data: order, error } = await this.supabase
        .from("orders")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return order;
    } catch (error) {
      console.error(`[DB] Error in updateOrder (collection: orders, id: ${id}):`, error);
      throw error;
    }
  }

  async saveToQueue(data: QueueItem): Promise<{ id: string }> {
    try {
      const { data: item, error } = await this.supabase
        .from("pending_scraping_queue")
        .insert({
          ...data,
          is_processed: false,
          requested_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (error) throw error;
      return { id: item.id };
    } catch (error) {
      console.error(`[DB] Error in saveToQueue (collection: pending_scraping_queue):`, error);
      throw error;
    }
  }

  async logSystemEvent(
    level: "info" | "warn" | "error",
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await this.supabase.from("system_logs").insert({
        level,
        message,
        metadata,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`[DB] Error in logSystemEvent (collection: system_logs):`, error);
      throw error;
    }
  }
}

// Database Factory with Failover Logic
class DatabaseFactory {
  private primary: DBInterface;
  private secondary: DBInterface;
  private primaryName: "appwrite" | "supabase";
  private secondaryName: "appwrite" | "supabase";

  constructor(primaryProvider: "appwrite" | "supabase" = "appwrite") {
    this.primaryName = primaryProvider;
    this.secondaryName = primaryProvider === "appwrite" ? "supabase" : "appwrite";
    this.primary = primaryProvider === "appwrite" ? new AppwriteAdapter() : new SupabaseAdapter();
    this.secondary = primaryProvider === "appwrite" ? new SupabaseAdapter() : new AppwriteAdapter();
  }

  async execute<T>(
    operation: (db: DBInterface) => Promise<T>,
    isWriteOperation: boolean = false,
    queryType?: string
  ): Promise<T> {
    try {
      // Try primary first
      const result = await operation(this.primary);

      // If it's a write operation, mirror to secondary (async)
      if (isWriteOperation) {
        (async () => {
          try {
            await operation(this.secondary);
          } catch (error) {
            console.warn(`[DB Mirror] Failed to mirror to secondary:`, error);
          }
        })();
      }

      return result;
    } catch (error: any) {
      // Check for retryable errors (429 Rate Limit, 503 Unavailable, etc.)
      const shouldRetry =
        error.message?.includes("429") ||
        error.message?.includes("503") ||
        error.code === 429 ||
        error.code === 503 ||
        error.status === 429 ||
        error.status === 503;

      if (shouldRetry) {
        console.warn(`[DB Failover] Primary failed, switching to secondary`);
        
        // Log failover event to system_metrics
        try {
          await this.primary.logSystemEvent("error", `${this.primaryName} failed, using ${this.secondaryName}`, {
            provider_failed: this.primaryName,
            fallback_used_at: new Date().toISOString(),
            query_type: queryType,
            error: error.message,
          });
        } catch (logError) {
          console.warn(`[DB Failover] Failed to log event:`, logError);
        }
        
        // Try secondary
        return await operation(this.secondary);
      }

      // Re-throw non-retryable errors
      throw error;
    }
  }

  // Convenience methods with auto-failover
  getDB(): DBInterface {
    // Create a proxy to wrap all methods with failover logic
    const self = this;
    return new Proxy({} as DBInterface, {
      get(_target, prop) {
        if (typeof (self.primary as any)[prop] === "function") {
          return async (...args: any[]) => {
            const methodName = prop as keyof DBInterface;
            const isWrite =
              methodName.startsWith("create") ||
              methodName.startsWith("update") ||
              methodName.startsWith("save") ||
              methodName.startsWith("log");
            return self.execute(
              (db) => (db as any)[methodName](...args),
              isWrite,
              methodName
            );
          };
        }
        return (self.primary as any)[prop];
      },
    });
  }
}

// Export the factory and instance
const factory = new DatabaseFactory("appwrite");
export const db = factory.getDB();
export { DatabaseFactory, AppwriteAdapter, SupabaseAdapter };
