/* ORDER_STATUS_ENUM: Strict sequential order states */
export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "WAREHOUSE_PENDING"
  | "CHINA_WAREHOUSE"
  | "PACKING"
  | "TO_BE_CONFIRMED"
  | "SHIPPING_SOON"
  | "SHIPPED"
  | "LOCAL_WAREHOUSE"
  | "PENDING_PICKUP"
  | "PICKED_UP";

/* ORDER_ITEM: Individual product in an order */
export interface OrderItem {
  productLink: string;
  title: string;
  image: string;
  quantity: number;
  chosenSku?: string;
  priceYuan: number;
}

/* ORDER: Main order tracking object */
export interface Order {
  id: string;
  userId: string;
  supplier1688CartId?: string;
  status: OrderStatus;
  totalNairaAmount: number;
  chinaWaybillNumber?: string;
  localWaybillNumber?: string;
  items: OrderItem[];
  createdAt: number;
  updatedAt: number;
}

/* ORDER_STATUS_CONFIG: UI and behavior config for each status */
export interface OrderStatusConfig {
  label: string;
  section: "orders" | "chinaWarehouse" | "localWarehouse" | "complete";
  requiresAction: boolean;
  actionText?: string;
  color: string;
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, OrderStatusConfig> = {
  PENDING_PAYMENT: {
    label: "Pending Payment",
    section: "orders",
    requiresAction: true,
    actionText: "Pay Now (Naira Wallet) 👆",
    color: "#ff5000",
  },
  PAID: {
    label: "Paid",
    section: "orders",
    requiresAction: false,
    color: "#10b981",
  },
  WAREHOUSE_PENDING: {
    label: "Warehouse Pending",
    section: "orders",
    requiresAction: false,
    color: "#64748b",
  },
  CHINA_WAREHOUSE: {
    label: "China Warehouse",
    section: "chinaWarehouse",
    requiresAction: true,
    actionText: "Verify Items & Dimensions 👆",
    color: "#ff5000",
  },
  PACKING: {
    label: "Packing",
    section: "chinaWarehouse",
    requiresAction: false,
    color: "#64748b",
  },
  TO_BE_CONFIRMED: {
    label: "To Be Confirmed",
    section: "chinaWarehouse",
    requiresAction: true,
    actionText: "Confirm Waybill & Select Sea/Air Shipping 👆",
    color: "#ff5000",
  },
  SHIPPING_SOON: {
    label: "Shipping Soon",
    section: "chinaWarehouse",
    requiresAction: false,
    color: "#64748b",
  },
  SHIPPED: {
    label: "Shipped",
    section: "chinaWarehouse",
    requiresAction: false,
    color: "#3b82f6",
  },
  LOCAL_WAREHOUSE: {
    label: "Local Warehouse",
    section: "localWarehouse",
    requiresAction: false,
    color: "#0ea5e9",
  },
  PENDING_PICKUP: {
    label: "Pending Pickup",
    section: "localWarehouse",
    requiresAction: true,
    actionText: "View Pickup Details 👆",
    color: "#ff5000",
  },
  PICKED_UP: {
    label: "Picked Up",
    section: "complete",
    requiresAction: false,
    color: "#10b981",
  },
};

/* SECTION_CONFIG: Grouping config for UI sections */
export interface SectionConfig {
  id: "orders" | "chinaWarehouse" | "localWarehouse" | "complete";
  label: string;
  icon: string;
}

export const SECTION_CONFIG: SectionConfig[] = [
  {
    id: "orders",
    label: "ORDERS",
    icon: "📦",
  },
  {
    id: "chinaWarehouse",
    label: "NEXTGEN HUB CHINA WAREHOUSE",
    icon: "🇨🇳",
  },
  {
    id: "localWarehouse",
    label: "NEXTGEN HUB LOCAL WAREHOUSE",
    icon: "🇳🇬",
  },
  {
    id: "complete",
    label: "COMPLETE",
    icon: "✅",
  },
];
