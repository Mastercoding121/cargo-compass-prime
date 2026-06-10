import { Client, Databases, Query, ID } from "node-appwrite";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { config as dotenvConfig } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenvConfig({ path: path.join(__dirname, "../../.env.local") });

// Load env vars
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID || "";
const APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID || "";
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || "";
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Initialize clients
const appwriteClient = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);
const appwriteDB = new Databases(appwriteClient);

const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Health state tracking
let lastHealthCheck = {
  appwrite: { isHealthy: true, lastChecked: Date.now() },
  supabase: { isHealthy: true, lastChecked: Date.now() },
};
let roundRobinCounter = 0;

// Health check
async function checkHealth(): Promise<{ appwrite: boolean; supabase: boolean }> {
  const checkTime = Date.now();

  // Check Appwrite health
  try {
    await appwriteDB.listDocuments(APPWRITE_DATABASE_ID, "products", [
      Query.limit(1),
    ]);
    lastHealthCheck.appwrite.isHealthy = true;
  } catch (error) {
    console.error("Appwrite health check failed:", error);
    lastHealthCheck.appwrite.isHealthy = false;
  }
  lastHealthCheck.appwrite.lastChecked = checkTime;

  // Check Supabase health
  try {
    const { error } = await supabase.from("orders").select("id").limit(1);
    if (error) throw error;
    lastHealthCheck.supabase.isHealthy = true;
  } catch (error) {
    console.error("Supabase health check failed:", error);
    lastHealthCheck.supabase.isHealthy = false;
  }
  lastHealthCheck.supabase.lastChecked = checkTime;

  return {
    appwrite: lastHealthCheck.appwrite.isHealthy,
    supabase: lastHealthCheck.supabase.isHealthy,
  };
}

// Load balancer - round robin with health check failover
function getActiveProvider(): "appwrite" | "supabase" {
  const healthy = {
    appwrite: lastHealthCheck.appwrite.isHealthy,
    supabase: lastHealthCheck.supabase.isHealthy,
  };

  // Failover logic
  if (!healthy.appwrite && healthy.supabase) return "supabase";
  if (!healthy.supabase && healthy.appwrite) return "appwrite";
  if (!healthy.appwrite && !healthy.supabase) {
    // Fallback to mock mode?
    throw new Error("Both databases are down!");
  }

  // Round robin (50/50)
  roundRobinCounter++;
  return roundRobinCounter % 2 === 0 ? "appwrite" : "supabase";
}

// Uniform interface
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
  created_at?: string;
  updated_at?: string;
  last_updated_at?: string;
}

export interface Order {
  id?: string;
  user_id?: string;
  supplier_1688_cart_id?: string;
  status?: string;
  total_naira_amount?: number;
  china_waybill_number?: string;
  local_waybill_number?: string;
  items?: any[];
  created_at?: string;
  updated_at?: string;
  last_updated_at?: string;
}

// Sync function
async function syncRecord(
  record: Product | Order,
  type: "product" | "order",
  source: "appwrite" | "supabase"
): Promise<void> {
  try {
    if (type === "product") {
      const product = record as Product;
      const targetProvider = source === "appwrite" ? "supabase" : "appwrite";
      const now = new Date().toISOString();

      if (targetProvider === "supabase") {
        await supabase.from("products").upsert({
          id: product.id || product.product_id,
          product_id: product.product_id,
          title_english: product.title_english,
          image_url: product.image_url,
          original_1688_link: product.original_1688_link,
          price_yuan: product.price_yuan,
          price_naira: product.price_naira,
          moq: product.moq,
          sales_volume: product.sales_volume,
          category: product.category,
          source: product.source,
          last_updated_at: now,
        });
      } else {
        const docId = product.id || ID.unique();
        await appwriteDB.createDocument(
          APPWRITE_DATABASE_ID,
          "products",
          docId,
          {
            ...product,
            last_updated_at: now,
          }
        );
      }
    } else if (type === "order") {
      const order = record as Order;
      const targetProvider = source === "appwrite" ? "supabase" : "appwrite";
      const now = new Date().toISOString();

      if (targetProvider === "supabase") {
        await supabase.from("orders").upsert({
          id: order.id,
          user_id: order.user_id,
          supplier_1688_cart_id: order.supplier_1688_cart_id,
          status: order.status,
          total_naira_amount: order.total_naira_amount,
          china_waybill_number: order.china_waybill_number,
          local_waybill_number: order.local_waybill_number,
          items: order.items,
          last_updated_at: now,
        });
      } else {
        const docId = order.id || ID.unique();
        await appwriteDB.createDocument(
          APPWRITE_DATABASE_ID,
          "orders",
          docId,
          {
            ...order,
            last_updated_at: now,
          }
        );
      }
    }
  } catch (error) {
    console.error("Sync failed:", error);
  }
}

// Product resource
const products = {
  async getAll(queries: string[] = []): Promise<Product[]> {
    const provider = getActiveProvider();
    let products: Product[] = [];

    if (provider === "appwrite") {
      const result = await appwriteDB.listDocuments(
        APPWRITE_DATABASE_ID,
        "products",
        queries
      );
      products = result.documents as unknown as Product[];
    } else {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .limit(100);
      if (error) throw error;
      products = data || [];
    }

    // Trigger async sync
    products.forEach((p) => syncRecord(p, "product", provider));
    return products;
  },

  async get(id: string): Promise<Product | null> {
    const provider = getActiveProvider();
    let product: Product | null = null;

    if (provider === "appwrite") {
      try {
        product = (await appwriteDB.getDocument(
          APPWRITE_DATABASE_ID,
          "products",
          id
        )) as unknown as Product;
      } catch (error) {
        product = null;
      }
    } else {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
      if (error) product = null;
      else product = data;
    }

    if (product) {
      syncRecord(product, "product", provider);
    }

    return product;
  },

  async create(data: Omit<Product, "id" | "created_at" | "updated_at">): Promise<Product> {
    const provider = getActiveProvider();
    const now = new Date().toISOString();
    let product: Product;

    if (provider === "appwrite") {
      const docId = data.product_id || ID.unique();
      product = (await appwriteDB.createDocument(
        APPWRITE_DATABASE_ID,
        "products",
        docId,
        {
          ...data,
          last_updated_at: now,
        }
      )) as unknown as Product;
    } else {
      const { data: newProduct, error } = await supabase
        .from("products")
        .insert({
          ...data,
          last_updated_at: now,
        })
        .select()
        .single();
      if (error) throw error;
      product = newProduct;
    }

    syncRecord(product, "product", provider);
    return product;
  },
};

// Order resource
const orders = {
  async getAll(queries: string[] = []): Promise<Order[]> {
    const provider = getActiveProvider();
    let orders: Order[] = [];

    if (provider === "appwrite") {
      const result = await appwriteDB.listDocuments(
        APPWRITE_DATABASE_ID,
        "orders",
        queries
      );
      orders = result.documents as unknown as Order[];
    } else {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .limit(100);
      if (error) throw error;
      orders = data || [];
    }

    orders.forEach((o) => syncRecord(o, "order", provider));
    return orders;
  },

  async get(id: string): Promise<Order | null> {
    const provider = getActiveProvider();
    let order: Order | null = null;

    if (provider === "appwrite") {
      try {
        order = (await appwriteDB.getDocument(
          APPWRITE_DATABASE_ID,
          "orders",
          id
        )) as unknown as Order;
      } catch (error) {
        order = null;
      }
    } else {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();
      if (error) order = null;
      else order = data;
    }

    if (order) {
      syncRecord(order, "order", provider);
    }

    return order;
  },

  async create(data: Omit<Order, "id" | "created_at" | "updated_at">): Promise<Order> {
    const provider = getActiveProvider();
    const now = new Date().toISOString();
    let order: Order;

    if (provider === "appwrite") {
      const docId = ID.unique();
      order = (await appwriteDB.createDocument(
        APPWRITE_DATABASE_ID,
        "orders",
        docId,
        {
          ...data,
          last_updated_at: now,
        }
      )) as unknown as Order;
    } else {
      const { data: newOrder, error } = await supabase
        .from("orders")
        .insert({
          ...data,
          last_updated_at: now,
        })
        .select()
        .single();
      if (error) throw error;
      order = newOrder;
    }

    syncRecord(order, "order", provider);
    return order;
  },

  async update(id: string, data: Partial<Omit<Order, "id" | "created_at">>): Promise<Order> {
    const provider = getActiveProvider();
    const now = new Date().toISOString();
    let order: Order;

    if (provider === "appwrite") {
      order = (await appwriteDB.updateDocument(
        APPWRITE_DATABASE_ID,
        "orders",
        id,
        {
          ...data,
          last_updated_at: now,
        }
      )) as unknown as Order;
    } else {
      const { data: updatedOrder, error } = await supabase
        .from("orders")
        .update({
          ...data,
          last_updated_at: now,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      order = updatedOrder;
    }

    syncRecord(order, "order", provider);
    return order;
  },
};

// Export db object
export const db = {
  products,
  orders,
  getActiveProvider,
  checkHealth,
};
