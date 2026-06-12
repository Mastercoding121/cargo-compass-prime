/* SERVER_FUNCTIONS: Order management API handlers */
import { createServerFn } from "@tanstack/react-start";
import type { Order, OrderItem, OrderStatus } from "./orders";
import { getSession } from "./auth";
import { db } from "./db-adapter";
import { Query } from "node-appwrite";

/* Helper: Validate session */
async function getValidSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("Not authenticated");
  }
  return session;
}

/* Helper: Transform Appwrite document to Order type */
function transformAppwriteOrderToOrder(doc: any): Order {
  return {
    id: doc.$id,
    userId: doc.user_id,
    status: doc.status,
    totalNairaAmount: doc.total_naira_amount,
    items: doc.items as OrderItem[],
    supplier1688CartId: doc.supplier_1688_cart_id,
    chinaWaybillNumber: doc.china_waybill_number,
    localWaybillNumber: doc.local_waybill_number,
    createdAt: new Date(doc.$createdAt).getTime(),
    updatedAt: new Date(doc.$updatedAt).getTime(),
  };
}

/* GET: Fetch user's orders */
export const getOrders = createServerFn({
  method: "GET",
}).handler(async () => {
  try {
    const session = await getValidSession();

    // Get orders from Appwrite, filtered by user_id
    const appwriteOrders = await db.getAllOrders([
      Query.equal("user_id", session.id),
      Query.orderDesc("$createdAt"),
    ]);

    // Transform
    const orders = appwriteOrders.map(transformAppwriteOrderToOrder);
    return { success: true, orders };
  } catch (error) {
    console.error("Error fetching orders:", error);
    // Fallback to mock localStorage for development
    if (typeof window !== "undefined") {
      const session = await getValidSession();
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
    const session = await getValidSession();

    const newAppwriteOrder = await db.createOrder({
      user_id: session.id,
      status: "PENDING_PAYMENT",
      total_naira_amount: data.totalNaira,
      items: data.items,
    });

    const newOrder = transformAppwriteOrderToOrder(newAppwriteOrder);
    return { success: true, order: newOrder };
  } catch (error) {
    console.error("Error creating order:", error);
    // Fallback to mock localStorage for development
    if (typeof window !== "undefined") {
      const session = await getValidSession();
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
      const session = await getValidSession();

      // Mock: Simulate 1688 proxy API call
      console.log("Syncing with 1688 proxy API:", data);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const supplierCartId = `1688-CART-${Math.random().toString(36).substr(2, 9)}`;

      // Get existing order
      const existingOrder = await db.getOrderById(data.orderId);
      if (!existingOrder || existingOrder.user_id !== session.id) {
        throw new Error("Order not found");
      }

      // Update order
      const updatedAppwriteOrder = await db.updateOrder(data.orderId, {
        supplier_1688_cart_id: supplierCartId,
      });

      return {
        success: true,
        message: "Cart synced with 1688 successfully",
        supplierCartId,
      };
    } catch (error) {
      console.error("Error syncing with 1688:", error);
      // Fallback to mock
      if (typeof window !== "undefined") {
        const session = await getValidSession();
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
      const session = await getValidSession();

      // Get existing order
      const existingOrder = await db.getOrderById(data.orderId);
      if (!existingOrder || existingOrder.user_id !== session.id) {
        throw new Error("Order not found");
      }

      // Update order
      const updatedAppwriteOrder = await db.updateOrder(data.orderId, {
        status: data.status,
      });

      const updatedOrder = transformAppwriteOrderToOrder(updatedAppwriteOrder);
      return { success: true, order: updatedOrder };
    } catch (error) {
      console.error("Error updating order:", error);
      // Fallback to mock
      if (typeof window !== "undefined") {
        const session = await getValidSession();
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
    const session = await getValidSession();

    // Mock payment processing
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Get existing order
    const existingOrder = await db.getOrderById(data.orderId);
    if (!existingOrder || existingOrder.user_id !== session.id) {
      throw new Error("Order not found");
    }

    // Update order
    const updatedAppwriteOrder = await db.updateOrder(data.orderId, {
      status: "PAID",
    });

    const updatedOrder = transformAppwriteOrderToOrder(updatedAppwriteOrder);
    return {
      success: true,
      order: updatedOrder,
      message: "Payment processed successfully",
    };
  } catch (error) {
    console.error("Error processing payment:", error);
    // Fallback to mock
    if (typeof window !== "undefined") {
      const session = await getValidSession();
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
