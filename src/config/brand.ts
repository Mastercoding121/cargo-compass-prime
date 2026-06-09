/* BRAND_CONFIG: GLOBAL_BRAND_OBJECT */
export const BRAND = {
  name: "NEXTGEN HUB",
  shortName: "NextGen Hub",
  currency: "NGN" as "NGN" | "USD",
  supportEmail: "support@nextgenhub.com",
  tagline: "China Procurement & Freight Forwarding",
  handlePrefix: "NH",
} as const;

/* ROUTE_KEY_REGISTRY: All top-level grep keys for route discovery */
export const ROUTE_KEYS = {
  PUBLIC_LANDING: "/",
  AUTH_SIGNIN: "/login",
  AUTH_SIGNUP: "/register",
  DASHBOARD_HOME: "/dashboard",
  DASHBOARD_PARCELS: "/dashboard/parcels",
  DASHBOARD_CONSOLIDATION: "/dashboard/shipments",
  DASHBOARD_ADDRESSES: "/dashboard/addresses",
  ADMIN_ROOT: "/admin",
} as const;
