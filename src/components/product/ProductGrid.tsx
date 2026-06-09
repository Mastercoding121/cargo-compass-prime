/* PRODUCT_GRID: 1688 product display with pagination, MOQ, currency conversion */
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { PRODUCT_FEED, FREIGHT_CLASS_COLOR, type Product1688 } from "@/lib/products";
import { cnyToNgn, formatCNY, formatNGN } from "@/lib/fx";
import { cartStore } from "@/lib/cart";
import { getSession } from "@/lib/auth";
import { useNavigate } from "@tanstack/react-router";
import { ShoppingCart, ChevronLeft, ChevronRight, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 8;

export function ProductGrid({ compact = false }: { compact?: boolean }) {
  const [page, setPage] = useState(1);
  const pageCount = Math.ceil(PRODUCT_FEED.length / PAGE_SIZE);
  const slice = useMemo(
    () => PRODUCT_FEED.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [page],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs sm:text-sm">
        <Info className="size-4 text-primary mt-0.5 shrink-0" />
        <p className="text-foreground/80">
          Item prices below are sourced live from <span className="font-semibold">1688.com</span> in ¥ RMB and converted to ₦ NGN at today's rate.
          <span className="font-semibold"> These prices exclude custom service fees, local handling, and destination freight charges.</span>
        </p>
      </div>

      <div className={[
        "grid gap-3",
        compact ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
      ].join(" ")}>
        {slice.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-center gap-1 pt-2">
        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="gap-1">
          <ChevronLeft className="size-4" /> Prev
        </Button>
        {Array.from({ length: pageCount }).map((_, i) => {
          const n = i + 1;
          const active = n === page;
          return (
            <Button
              key={n}
              variant={active ? "default" : "outline"}
              size="sm"
              onClick={() => setPage(n)}
              className="min-w-9"
            >
              {n}
            </Button>
          );
        })}
        <Button variant="outline" size="sm" disabled={page === pageCount} onClick={() => setPage((p) => p + 1)} className="gap-1">
          Next <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product1688 }) {
  const [qty, setQty] = useState(product.moq);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ngn = cnyToNgn(product.pricePerUnitCNY);

  function handleAdd() {
    const session = getSession();
    if (!session) {
      toast.message("Sign in required", { description: "Create an account to add items to your cart." });
      navigate({ to: "/login" });
      return;
    }
    try {
      cartStore.add(product, qty);
      toast.success("Added to cart", { description: `${qty} × ${product.title}` });
      setOpen(false);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    }
  }

  return (
    <Card
      data-freight-class={product.freightClass}
      data-product-id={product.id}
      className="overflow-hidden hover:shadow-[var(--shadow-glow)] transition group"
    >
      <div className="aspect-square bg-muted overflow-hidden">
        <img
          src={product.image}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <CardContent className="p-3 space-y-2">
        <Badge variant="outline" className={["text-[10px] font-medium", FREIGHT_CLASS_COLOR[product.freightClass]].join(" ")}>
          {product.freightClass}
        </Badge>
        <div className="text-sm font-medium leading-snug line-clamp-2 min-h-10">{product.title}</div>
        <div className="text-[10px] text-muted-foreground truncate">{product.vendor}</div>
        <div>
          <div className="text-lg font-semibold text-primary leading-none">{formatNGN(ngn)}</div>
          <div className="text-[11px] text-muted-foreground">{formatCNY(product.pricePerUnitCNY)} • MOQ {product.moq}</div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="w-full gap-1.5">
              <ShoppingCart className="size-3.5" /> Add to cart
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-base">Add to procurement cart</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex gap-3">
                <img src={product.image} alt="" className="size-20 rounded-md object-cover border border-border" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{product.title}</div>
                  <div className="text-xs text-muted-foreground">{product.vendor}</div>
                  <Badge variant="outline" className={["mt-1 text-[10px]", FREIGHT_CLASS_COLOR[product.freightClass]].join(" ")}>
                    {product.freightClass}
                  </Badge>
                </div>
              </div>

              <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 flex gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>Minimum order quantity (M.O.Q): <b>{product.moq} {product.unit}(s)</b></span>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm">Quantity</label>
                <Input
                  type="number"
                  min={product.moq}
                  value={qty}
                  onChange={(e) => setQty(parseInt(e.target.value) || 0)}
                  className="w-28"
                />
                <div className="text-xs text-muted-foreground">
                  Total: <span className="font-semibold text-primary">{formatNGN(ngn * qty)}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={qty < product.moq}>Confirm add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
