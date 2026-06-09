/* ROUTE_KEY: DASHBOARD_HOME */
import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, Calculator, ArrowUpRight } from "lucide-react";
import { ProductGrid } from "@/components/product/ProductGrid";
import { FreightModalsRow } from "@/components/freight/FreightModals";
import { useCart } from "@/lib/cart";
import { cnyToNgn, formatNGN } from "@/lib/fx";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const items = useCart();
  const cartCount = items.filter((i) => i.status === "In Cart").length;
  const cartValue = items
    .filter((i) => i.status === "In Cart")
    .reduce((s, i) => s + cnyToNgn(i.product.pricePerUnitCNY) * i.quantity, 0);

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">1688 procurement feed</h1>
          <p className="text-sm text-muted-foreground">
            Live products sourced from 1688.com — prices converted from ¥ RMB to ₦ NGN.
          </p>
        </div>
        <Link to="/dashboard/shipments">
          <Button className="gap-2">
            <ShoppingCart className="size-4" /> Cart ({cartCount}) · {formatNGN(cartValue)}
            <ArrowUpRight className="size-4" />
          </Button>
        </Link>
      </div>

      {/* Freight calculator triggers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="size-4 text-primary" /> Freight trial calculators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FreightModalsRow />
        </CardContent>
      </Card>

      {/* Product grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="size-4 text-primary" /> Browse products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProductGrid />
        </CardContent>
      </Card>
    </div>
  );
}
