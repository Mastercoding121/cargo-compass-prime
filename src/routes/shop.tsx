/* ROUTE_KEY: Shop/Home Feed (Alias for /) */
import { createFileRoute } from "@tanstack/react-router";
import { BRAND } from "@/config/brand";
import { useEffect } from "react";

export const Route = createFileRoute("/shop")({
  head: () => ({ meta: [{ title: `Shop — ${BRAND.name}` }] }),
  component: ShopPage,
});

function ShopPage() {
  useEffect(() => {
    // Redirect to home page
    Route.navigate({ to: "/" });
  }, []);
  return null;
}
