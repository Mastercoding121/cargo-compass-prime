/* PRODUCT_GRID: 1688 product display with pagination, MOQ, currency conversion */
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { PRODUCT_FEED, FREIGHT_CLASS_COLOR, type Product1688 } from "@/lib/products";
import { formatCNY, formatNGN } from "@/lib/fx";
import { cartStore } from "@/lib/cart";
import { getSession } from "@/lib/auth";
import { useNavigate } from "@tanstack/react-router";
import { ShoppingCart, AlertCircle, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { getMockProducts, type AppwriteProduct } from "@/lib/appwrite";
import { Pagination } from "@/components/Pagination";

interface ProductGridProps {
  compact?: boolean;
  products?: AppwriteProduct[];
  currentPage?: number;
  totalPages?: number;
}

const PAGE_SIZE = 20;

export function ProductGrid({
  compact = false,
  products: externalProducts,
  currentPage: externalCurrentPage,
  totalPages: externalTotalPages,
}: ProductGridProps) {
  const [internalPage, setInternalPage] = useState(1);
  const [internalProducts, setInternalProducts] = useState<AppwriteProduct[]>([]);
  const [internalTotal, setInternalTotal] = useState(0);

  useEffect(() => {
    // If external props are not provided, use internal state with mock data
    if (!externalProducts) {
      const { products, total } = getMockProducts({ page: internalPage, limit: PAGE_SIZE });
      setInternalProducts(products);
      setInternalTotal(total);
    }
  }, [internalPage, externalProducts]);

  const products = externalProducts || internalProducts;
  const currentPage = externalCurrentPage || internalPage;
  const totalPages = externalTotalPages || Math.ceil(internalTotal / PAGE_SIZE);

  // Convert AppwriteProduct to Product1688 for compatibility with cart
  const convertToProduct1688 = (p: AppwriteProduct): Product1688 => ({
    id: p.product_id,
    title: p.title_english,
    image: p.image_url,
    vendor: "1688 Supplier",
    pricePerUnitCNY: p.price_yuan,
    moq: p.moq,
    freightClass: "Normal Goods", // Default for now
    unit: "piece",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs sm:text-sm">
        <Info className="size-4 text-primary mt-0.5 shrink-0" />
        <p className="text-foreground/80">
          Item prices below are sourced live from{" "}
          <span className="font-semibold">1688.com</span> in ¥ RMB and converted
          to ₦ NGN at today's rate.
          <span className="font-semibold">
            {" "}
            These prices exclude custom service fees, local handling, and
            destination freight charges.
          </span>
        </p>
      </div>

      <div
        className={[
          "grid gap-3",
          compact ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4" : "grid-cols-2 md:grid-cols-4 lg:grid-cols-5",
        ].join(" ")}
      >
        {products.map((p) => (
          <ProductCard
            key={p.$id}
            product={convertToProduct1688(p)}
            appwriteProduct={p}
          />
        ))}
      </div>

      {/* PAGINATION */}
      {externalProducts ? (
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      ) : (
        <div className="flex items-center justify-center gap-1 pt-2">
          <Button variant="outline" size="sm" disabled={internalPage === 1} onClick={() => setInternalPage((p) => p - 1)} className="gap-1">
            <ChevronLeft className="size-4" /> Prev
          </Button>
          {Array.from({ length: totalPages }).map((_, i) => {
            const n = i + 1;
            const active = n === internalPage;
            return (
              <Button
                key={n}
                variant={active ? "default" : "outline"}
                size="sm"
                onClick={() => setInternalPage(n)}
                className="min-w-9"
              >
                {n}
              </Button>
            );
          })}
          <Button variant="outline" size="sm" disabled={internalPage === totalPages} onClick={() => setInternalPage((p) => p + 1)} className="gap-1">
            Next <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

interface ProductCardProps {
  product: Product1688;
  appwriteProduct: AppwriteProduct;
}

function ProductCard({ product, appwriteProduct }: ProductCardProps) {
  const [qty, setQty] = useState(product.moq);
  const [open, setOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();
  const ngn = appwriteProduct.price_naira;

  // Fallback image URL
  const fallbackImageUrl = "https://placehold.co/400x400/111827/ffffff/png?text=Product";
  
  // Get valid image URL
  const imageUrl = !imageError && appwriteProduct.image_url ? appwriteProduct.image_url : fallbackImageUrl;

  function handleAdd() {
    const session = getSession();
    if (!session) {
      toast.message("Sign in required", {
        description: "Create an account to add items to your cart.",
      });
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

  // Navigate to product detail page on card click
  function handleCardClick() {
    navigate({ to: "/product/$id", params: { id: appwriteProduct.product_id } });
  }

  return (
    <Card
      data-product-id={product.id}
      className="overflow-hidden hover:shadow-[var(--shadow-glow)] transition group cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="aspect-square bg-muted overflow-hidden">
        <img
          src={imageUrl}
          alt={appwriteProduct.title_english}
          loading="lazy"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
            Verified 1688 Item
          </Badge>
        </div>
        <div className="text-sm font-medium leading-snug line-clamp-2 min-h-10">
          {appwriteProduct.title_english}
        </div>
        <div>
          <div className="text-lg font-bold text-orange-600 leading-none">
            {formatNGN(ngn)}
          </div>
          <div className="text-[11px] text-slate-400">
            Direct: ¥{appwriteProduct.price_yuan.toFixed(2)} • MOQ {appwriteProduct.moq}
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="w-full gap-1.5 mt-1"
              onClick={(e) => e.stopPropagation()} // Prevent card navigation
            >
              <ShoppingCart className="size-3.5" /> Add to cart
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-base">Add to procurement cart</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex gap-3">
                <img
                  src={imageUrl}
                  alt=""
                  onError={() => setImageError(true)}
                  className="size-20 rounded-md object-cover border border-border"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{product.title}</div>
                  <Badge
                    variant="outline"
                    className={[
                      "mt-1 text-[10px]",
                      FREIGHT_CLASS_COLOR[product.freightClass],
                    ].join(" ")}
                  >
                    {product.freightClass}
                  </Badge>
                </div>
              </div>

              <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 flex gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>
                  Minimum order quantity (M.O.Q):{" "}
                  <b>
                    {product.moq} {product.unit}(s)
                  </b>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm">Quantity</label>
                <Input
                  type="number"
                  min={product.moq}
                  value={qty}
                  onChange={(e) => setQty(parseInt(e.target.value) || 0)}
                  className="w-32"
                />
                <div className="text-xs text-muted-foreground">
                  Total:{" "}
                  <span className="font-semibold text-primary">
                    {formatNGN(ngn * qty)}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={qty < product.moq}>
                Confirm add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
