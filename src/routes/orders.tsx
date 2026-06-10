/* ROUTE_KEY: Public Orders Page (Redirects to dashboard) */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { getSession } from "@/lib/auth";

export const Route = createFileRoute("/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  useEffect(() => {
    const session = getSession();
    if (session) {
      Route.navigate({ to: "/dashboard/orders" });
    } else {
      Route.navigate({ to: "/login" });
    }
  }, []);
  return null;
}
