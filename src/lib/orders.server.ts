/* SERVER_FUNCTIONS: Order management API handlers */
import { createServerFn } from "@tanstack/react-start";
import type { Order, OrderItem, OrderStatus } from "./orders";
import { createSupabaseServerClient } from "./supabase";
import { getSession } from "./auth";

/* Helper: Get Supabase server client and validate session */
async function getSupabaseAndSession() {
  const supabaseServer = createSupabaseServerClient();
  const session = await getSession();
  if (!session) {
    throw new Error("Not authenticated");
  }
  return { supabaseServer, session };
}

/* GET: Fetch user's orders */
export const getOrders = createServerFn({
  method: "GET",
}).handler(async () => {
  try {
    const { supabaseServer, session } = await getSupabaseAndSession();

    const { data: orders, error } = await supabaseServer
      .from("orders")
      .select("*")
      .eq("user_id", session.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Transform to our Order type
    const transformedOrders: Order[] = orders.map((order) => ({
      id: order.id,
      userId: order.user_id,
      status: order.status,
      totalNairaAmount: order.total_naira_amount,
      items: order.items as OrderItem[],
      supplier1688CartId: order.supplier_1688_cart_id,
      chinaWaybillNumber: order.china_waybill_number,
      localWaybillNumber: order.local_waybill_number,
      createdAt: new Date(order.created_at).getTime(),
      updatedAt: new Date(order.updated_at).getTime(),
    }));

    return { success: true, orders: transformedOrders };
  } catch (error) {
    console.error("Error fetching orders:", error);
    // Fallback to mock localStorage for development
    if (typeof window !== "undefined") {
      const session = await getSession();
      if (!session) throw new Error("Not authenticated");
      const ORDERS_KEY = "ngh_orders_v1";
      const raw = localStorage.getItem(ORDERS_KEY);
      const orders = raw ? (JSON.parse(raw) as Order[]) : [];
      return { success: true, orders: orders.filter((o) => o.userId === session.id) };
    }
    throw error;
  }
});

/* POST: Create a new order from cart items */
export const createOrder = createServerFn({
  method: "POST",
}).handler(async ({ data }: { data: { items: OrderItem[]; totalNaira: number } }) => {
  try {
    const { supabaseServer, session } = await getSupabaseAndSession();

    const { data: order, error } = await supabaseServer
      .from("orders")
      .insert({
        user_id: session.id,
        status: "PENDING_PAYMENT",
        total_naira_amount: data.totalNaira,
        items: data.items,
      })
      .select("*")
      .single();

    if (error) throw error;

    // Transform to our Order type
    const newOrder: Order = {
      id: order.id,
      userId: order.user_id,
      status: order.status,
      totalNairaAmount: order.total_naira_amount,
      items: order.items as OrderItem[],
      createdAt: new Date(order.created_at).getTime(),
      updatedAt: new Date(order.updated_at).getTime(),
    };

    return { success: true, order: newOrder };
  } catch (error) {
    console.error("Error creating order:", error);
    // Fallback to mock localStorage for development
    if (typeof window !== "undefined") {
      const session = await getSession();
      if (!session) throw new Error("Not authenticated");
      const ORDERS_KEY = "ngh_orders_v1";
      const raw = localStorage.getItem(ORDERS_KEY);
      const orders = raw ? (JSON.parse(raw) as Order[]) : [];
      const newOrder: Order = {
        id: crypto.randomUUID(),
        userId: session.id,
        status: "PENDING_PAYMENT",
        totalNairaAmount: data.totalNaira,
        items: data.items,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      orders.unshift(newOrder);
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      return { success: true, order: newOrder };
    }
    throw error;
  }
});

/* POST: Sync cart with 1688 proxy API */
export const syncCartWith1688 = createServerFn({
  method: "POST",
}).handler(
  async ({
    data,
  }: {
    data: {
      orderId: string;
      items: Array<{
        productLink: string;
        quantity: number;
        skuProperties?: string;
      }>;
    };
  }) => {
    try {
      const { supabaseServer, session } = await getSupabaseAndSession();

      // Mock: Simulate 1688 proxy API call
      console.log("Syncing with 1688 proxy API:", data);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const supplierCartId = `1688-CART-${Math.random().toString(36).substr(2, 9)}`;

      const { error } = await supabaseServer
        .from("orders")
        .update({
          supplier_1688_cart_id: supplierCartId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.orderId)
        .eq("user_id", session.id);

      if (error) throw error;

      return {
        success: true,
        message: "Cart synced with 1688 successfully",
        supplierCartId,
      };
    } catch (error) {
      console.error("Error syncing with 1688:", error);
      // Fallback to mock
      if (typeof window !== "undefined") {
        const session = await getSession();
        if (!session) throw new Error("Not authenticated");
        const ORDERS_KEY = "ngh_orders_v1";
        const raw = localStorage.getItem(ORDERS_KEY);
        const orders = raw ? (JSON.parse(raw) as Order[]) : [];
        const orderIndex = orders.findIndex(
          (o) => o.id === data.orderId && o.userId === session.id
        );
        if (orderIndex === -1) {
          throw new Error("Order not found");
        }
        orders[orderIndex].supplier1688CartId = `1688-CART-${Math.random().toString(36).substr(2, 9)}`;
        orders[orderIndex].updatedAt = Date.now();
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
        return {
          success: true,
          message: "Cart synced with 1688 successfully",
          supplierCartId: orders[orderIndex].supplier1688CartId,
        };
      }
      throw new Error("Failed to sync with 1688");
    }
  }
);

/* POST: Update order status */
export const updateOrderStatus = createServerFn({
  method: "POST",
}).handler(
  async ({
    data,
  }: {
    data: {
      orderId: string;
      status: OrderStatus;
    };
  }) => {
    try {
      const { supabaseServer, session } = await getSupabaseAndSession();

      const { data: order, error } = await supabaseServer
        .from("orders")
        .update({
          status: data.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.orderId)
        .eq("user_id", session.id)
        .select("*")
        .single();

      if (error) throw error;

      const transformedOrder: Order = {
        id: order.id,
        userId: order.user_id,
        status: order.status,
        totalNairaAmount: order.total_naira_amount,
        items: order.items as OrderItem[],
        supplier1688CartId: order.supplier_1688_cart_id,
        chinaWaybillNumber: order.china_waybill_number,
        localWaybillNumber: order.local_waybill_number,
        createdAt: new Date(order.created_at).getTime(),
        updatedAt: new Date(order.updated_at).getTime(),
      };

      return { success: true, order: transformedOrder };
    } catch (error) {
      console.error("Error updating order:", error);
      // Fallback to mock
      if (typeof window !== "undefined") {
        const session = await getSession();
        if (!session) throw new Error("Not authenticated");
        const ORDERS_KEY = "ngh_orders_v1";
        const raw = localStorage.getItem(ORDERS_KEY);
        const orders = raw ? (JSON.parse(raw) as Order[]) : [];
        const orderIndex = orders.findIndex(
          (o) => o.id === data.orderId && o.userId === session.id
        );
        if (orderIndex === -1) {
          throw new Error("Order not found");
        }
        orders[orderIndex].status = data.status;
        orders[orderIndex].updatedAt = Date.now();
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
        return { success: true, order: orders[orderIndex] };
      }
      throw error;
    }
  }
);

/* POST: Process payment */
export const processPayment = createServerFn({
  method: "POST",
}).handler(async ({ data }: { data: { orderId: string } }) => {
  try {
    const { supabaseServer, session } = await getSupabaseAndSession();

    // Mock payment processing
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const { data: order, error } = await supabaseServer
      .from("orders")
      .update({
        status: "PAID",
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.orderId)
      .eq("user_id", session.id)
      .select("*")
      .single();

    if (error) throw error;

    const transformedOrder: Order = {
      id: order.id,
      userId: order.user_id,
      status: order.status,
      totalNairaAmount: order.total_naira_amount,
      items: order.items as OrderItem[],
      supplier1688CartId: order.supplier_1688_cart_id,
      chinaWaybillNumber: order.china_waybill_number,
      localWaybillNumber: order.local_waybill_number,
      createdAt: new Date(order.created_at).getTime(),
      updatedAt: new Date(order.updated_at).getTime(),
    };

    return {
      success: true,
      order: transformedOrder,
      message: "Payment processed successfully",
    };
  } catch (error) {
    console.error("Error processing payment:", error);
    // Fallback to mock
    if (typeof window !== "undefined") {
      const session = await getSession();
      if (!session) throw new Error("Not authenticated");
      const ORDERS_KEY = "ngh_orders_v1";
      const raw = localStorage.getItem(ORDERS_KEY);
      const orders = raw ? (JSON.parse(raw) as Order[]) : [];
      const orderIndex = orders.findIndex(
        (o) => o.id === data.orderId && o.userId === session.id
      );
      if (orderIndex === -1) {
        throw new Error("Order not found");
      }
      if (orders[orderIndex].status !== "PENDING_PAYMENT") {
        throw new Error("Order is not in pending payment status");
      }
      orders[orderIndex].status = "PAID";
      orders[orderIndex].updatedAt = Date.now();
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      return {
        success: true,
        order: orders[orderIndex],
        message: "Payment processed successfully",
      };
    }
    throw error;
  }
});

/* Helper: Create mock orders for demo */
import { PRODUCT_FEED } from "./products";
import { cnyToNgn } from "./fx";

export function createMockOrders(userId: string): Order[] {
  const ORDERS_KEY = "ngh_orders_v1";
  const mockOrders: Order[] = [
    {
      id: crypto.randomUUID(),
      userId,
      status: "PENDING_PAYMENT",
      totalNairaAmount: 45000,
      items: [
        {
          productLink: "https://1688.com/item/123456",
          title: PRODUCT_FEED[0].title,
          image: PRODUCT_FEED[0].image,
          quantity: 5,
          priceYuan: PRODUCT_FEED[0].pricePerUnitCNY,
        },
      ],
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 86400000,
    },
    {
      id: crypto.randomUUID(),
      userId,
      status: "CHINA_WAREHOUSE",
      totalNairaAmount: 125000,
      chinaWaybillNumber: "CN-789456123",
      items: [
        {
          productLink: "https://1688.com/item/789012",
          title: PRODUCT_FEED[1].title,
          image: PRODUCT_FEED[1].image,
          quantity: 10,
          priceYuan: PRODUCT_FEED[1].pricePerUnitCNY,
        },
      ],
      createdAt: Date.now() - 3 * 86400000,
      updatedAt: Date.now() - 86400000,
    },
    {
      id: crypto.randomUUID(),
      userId,
      status: "TO_BE_CONFIRMED",
      totalNairaAmount: 85000,
      items: [
        {
          productLink: "https://1688.com/item/345678",
          title: PRODUCT_FEED[2].title,
          image: PRODUCT_FEED[2].image,
          quantity: 3,
          priceYuan: PRODUCT_FEED[2].pricePerUnitCNY,
        },
      ],
      createdAt: Date.now() - 5 * 86400000,
      updatedAt: Date.now() - 2 * 86400000,
    },
    {
      id: crypto.randomUUID(),
      userId,
      status: "PENDING_PICKUP",
      totalNairaAmount: 180000,
      localWaybillNumber: "NG-456789123",
      items: [
        {
          productLink: "https://1688.com/item/901234",
          title: PRODUCT_FEED[3].title,
          image: PRODUCT_FEED[3].image,
          quantity: 20,
          priceYuan: PRODUCT_FEED[3].pricePerUnitCNY,
        },
      ],
      createdAt: Date.now() - 14 * 86400000,
      updatedAt: Date.now() - 2 * 86400000,
    },
    {
      id: crypto.randomUUID(),
      userId,
      status: "PICKED_UP",
      totalNairaAmount: 65000,
      items: [
        {
          productLink: "https://1688.com/item/567890",
          title: PRODUCT_FEED[4].title,
          image: PRODUCT_FEED[4].image,
          quantity: 25,
          priceYuan: PRODUCT_FEED[4].pricePerUnitCNY,
        },
      ],
      createdAt: Date.now() - 30 * 86400000,
      updatedAt: Date.now() - 7 * 86400000,
    },
  ];
  localStorage.setItem(ORDERS_KEY, JSON.stringify(mockOrders));
  return mockOrders;
}
