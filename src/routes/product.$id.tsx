/* ROUTE_KEY: PRODUCT_DETAIL */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BRAND } from "@/config/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShoppingCart, AlertCircle } from "lucide-react";
import { getMockProducts, type AppwriteProduct, getRelatedItems } from "@/lib/appwrite";
import { PRODUCT_FEED, FREIGHT_CLASS_COLOR, type Product1688 } from "@/lib/products";
import { formatCNY, formatNGN } from "@/lib/fx";
import { cartStore } from "@/lib/cart";
import { getSession } from "@/lib/auth";
import { useState, useEffect } from "react";
import { ProductGrid } from "@/components/product/ProductGrid";
import { toast } from "sonner";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [{ title: `Product — ${BRAND.name}` }],
  }),
  component: ProductDetail,
});

function ProductDetail() {
  const params = Route.useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<AppwriteProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    // Find product by ID in mock data
    const { products } = getMockProducts({ page: 1, limit: 100 });
    const found = products.find((p) => p.product_id === params.id);
    if (found) {
      setProduct(found);
      setQty(found.moq);
    }
    setLoading(false);
  }, [params.id]);

  // Fetch related items using React Query
  const { data: relatedItems = [], isLoading: relatedLoading } = useQuery({
    queryKey: ["relatedItems", product?.category, product?.product_id],
    queryFn: () => product ? getRelatedItems(product.category, product.product_id) : Promise.resolve([]),
    enabled: !!product,
  });

  // Convert AppwriteProduct to Product1688 for cart
  const convertToProduct1688 = (p: AppwriteProduct): Product1688 => ({
    id: p.product_id,
    title: p.title_english,
    image: p.image_url,
    vendor: "1688 Supplier",
    pricePerUnitCNY: p.price_yuan,
    moq: p.moq,
    freightClass: "Normal Goods",
    unit: "piece",
    category: p.category,
  });

  function handleAdd() {
    if (!product) return;
    const session = getSession();
    if (!session) {
      toast.message("Sign in required", {
        description: "Create an account to add items to your cart.",
      });
      navigate({ to: "/login" });
      return;
    }
    try {
      cartStore.add(convertToProduct1688(product), qty);
      toast.success("Added to cart", { description: `${qty} × ${product.title_english}` });
    } catch (e: unknown) {
      toast.error((e as Error).message);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-slate-400">Product not found</div>
        <Link to="/">
          <Button>Back to products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft className="size-4" />
          <span>Back to products</span>
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div>
            <Card>
              <CardContent className="p-0">
                <img
                  src={product.image_url}
                  alt={product.title_english}
                  className="w-full aspect-square object-cover rounded-lg"
                />
              </CardContent>
            </Card>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {product.title_english}
              </h1>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-[#ff5000]">
                  {formatNGN(product.price_naira)}
                </div>
                <div className="text-lg text-slate-500">
                  {formatCNY(product.price_yuan)}
                </div>
              </div>
            </div>

            <Badge variant="outline" className={[
              "text-xs",
              FREIGHT_CLASS_COLOR["Normal Goods"],
            ].join(" ")}>
              Normal Goods
            </Badge>
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              {product.category}
            </Badge>

            <div className="space-y-2">
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 flex gap-2">
                <AlertCircle className="size-5 shrink-0" />
                <span>
                  Minimum order quantity (M.O.Q): <b>{product.moq} piece(s)</b>
                </span>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={product.moq}
                  value={qty}
                  onChange={(e) => setQty(parseInt(e.target.value) || 0)}
                  className="w-32"
                />
                <div className="text-sm text-slate-500">
                  Total: <span className="font-semibold text-[#ff5000]">
                    {formatNGN(product.price_naira * qty)}
                  </span>
                </div>
              </div>
            </div>

            {/* Add to Cart Button */}
            <Button
              className="w-full h-12 text-base gap-2"
              style={{ backgroundColor: "#ff5000", color: "white" }}
              onClick={handleAdd}
              disabled={qty < product.moq}
            >
              <ShoppingCart className="size-5" />
              Add to Cart
            </Button>

            {/* Original Link */}
            <div className="pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-500 mb-2">
                Original 1688 link:
              </p>
              <a
                href={product.original_1688_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#ff5000] hover:underline text-sm break-all"
              >
                {product.original_1688_link}
              </a>
            </div>
          </div>
        </div>

        {/* Related Items */}
        {relatedItems.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Related Items</h2>
            {relatedLoading ? (
              <div className="text-slate-400">Loading related items...</div>
            ) : (
              <ProductGrid products={relatedItems} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
