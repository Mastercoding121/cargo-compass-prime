/* ROUTE_KEY: Smart Order Preview Page */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  fetchProductBy1688Link,
  addToPendingScrapingQueue,
  type AppwriteProduct,
} from "@/lib/appwrite";
import { searchProducts } from "@/lib/api/search.server";
import { getSession } from "@/lib/auth";
import { toast } from "sonner";
import { Link, Package, Search, AlertCircle, Check, Sparkles } from "lucide-react";
import { formatNGN } from "@/lib/fx";

export const Route = createFileRoute("/dashboard/create-order")({
  component: CreateOrder,
});

interface SourcedProduct {
  title_english: string;
  image_url: string;
  original_1688_link: string;
  price_yuan: number;
  price_naira: number;
  moq: number;
}

// Order preview stored in localStorage
interface OrderPreview {
  orderPreviewId: string;
  product?: AppwriteProduct | SourcedProduct;
  manualEntry?: {
    title: string;
    priceNaira: number;
    imageUrl: string;
    url: string;
  };
  createdAt: number;
}

const LOCAL_STORAGE_KEY = "order_previews";

function CreateOrder() {
  const [searchMode, setSearchMode] = useState<"url" | "keyword">("url");
  const [url, setUrl] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<AppwriteProduct | SourcedProduct | null>(null);
  const [sourcedProducts, setSourcedProducts] = useState<SourcedProduct[]>([]);
  const [manualEntryMode, setManualEntryMode] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualPrice, setManualPrice] = useState("");
  const [manualImageUrl, setManualImageUrl] = useState("");

  // Load saved preview from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const previews: OrderPreview[] = JSON.parse(saved);
        if (previews.length > 0) {
          const latest = previews.sort(
            (a, b) => b.createdAt - a.createdAt
          )[0];
          if (latest.product) {
            if ("product_id" in latest.product) {
              setUrl(latest.product.original_1688_link);
              setProduct(latest.product);
            } else {
              setKeyword(latest.product.title_english);
              setProduct(latest.product);
            }
            setManualEntryMode(false);
          } else if (latest.manualEntry) {
            setUrl(latest.manualEntry.url);
            setManualTitle(latest.manualEntry.title);
            setManualPrice(latest.manualEntry.priceNaira.toString());
            setManualImageUrl(latest.manualEntry.imageUrl);
            setManualEntryMode(true);
          }
        }
      } catch (e) {
        console.error("Failed to load saved preview", e);
      }
    }
  }, []);

  // Save preview to localStorage
  const savePreview = useCallback(() => {
    const preview: OrderPreview = {
      orderPreviewId: `preview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      product: product || undefined,
      manualEntry: manualEntryMode
        ? {
            title: manualTitle,
            priceNaira: parseFloat(manualPrice) || 0,
            imageUrl: manualImageUrl,
            url,
          }
        : undefined,
      createdAt: Date.now(),
    };

    let previews: OrderPreview[] = [];
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        previews = JSON.parse(saved);
        // Keep only last 50 previews
        if (previews.length >= 50) {
          previews = previews.slice(0, 49);
        }
      } catch (e) {
        // Ignore errors
      }
    }

    previews.unshift(preview);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(previews));
  }, [product, manualEntryMode, manualTitle, manualPrice, manualImageUrl, url]);

  // Handle keyword search
  const handleKeywordSearch = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setSourcedProducts([]);
    setProduct(null);

    try {
      const data = await searchProducts({ data: { q: keyword.trim() } });

      if (data.type === "cached") {
        if (data.products.length > 0) {
          setProduct(data.products[0]);
        }
      } else if (data.type === "sourced") {
        setSourcedProducts(data.products);
        if (data.products.length > 0) {
          setProduct(data.products[0]);
        }
      } else if (data.type === "error") {
        setManualEntryMode(true);
        toast.info(data.message || "Item not found in catalog, but requested for sourcing.");
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced URL search
  useEffect(() => {
    let timeoutId: number;
    if (searchMode === "url" && url.trim()) {
      setLoading(true);
      timeoutId = window.setTimeout(async () => {
        const found = await fetchProductBy1688Link(url.trim());
        if (found) {
          setProduct(found);
          setManualEntryMode(false);
          setSourcedProducts([]);
          toast.success("Product found!");
        } else {
          setProduct(null);
          setManualEntryMode(true);
          // Auto add to queue
          const session = getSession();
          await addToPendingScrapingQueue(url.trim(), session?.id);
          toast.info("Item not found in catalog, but requested for sourcing.");
        }
        setLoading(false);
      }, 500);
    } else {
      setProduct(null);
      setManualEntryMode(false);
      setLoading(false);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [url, searchMode]);

  const handleAddToQueue = useCallback(async () => {
    const session = getSession();
    await addToPendingScrapingQueue(url, session?.id);
    toast.success("URL added to scraping queue!");
  }, [url]);

  const handleProceed = useCallback(() => {
    savePreview();
    toast.success("Order preview saved!");
  }, [savePreview]);

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Create New Order
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Search for products from 1688 by URL or keyword
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Products
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search mode selector */}
          <div className="flex gap-2">
            <Button
              variant={searchMode === "url" ? "default" : "secondary"}
              onClick={() => setSearchMode("url")}
              className="flex-1"
            >
              <Link className="w-4 h-4 mr-2" />
              By URL
            </Button>
            <Button
              variant={searchMode === "keyword" ? "default" : "secondary"}
              onClick={() => setSearchMode("keyword")}
              className="flex-1"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              By Keyword
            </Button>
          </div>

          {/* Search inputs */}
          {searchMode === "url" ? (
            <div className="space-y-2">
              <Label htmlFor="url">1688 Product Link</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://detail.1688.com/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="keyword">Product Keyword</Label>
              <div className="flex gap-2">
                <Input
                  id="keyword"
                  placeholder="e.g., wireless headphones"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleKeywordSearch()}
                />
                <Button onClick={handleKeywordSearch} disabled={loading}>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="space-y-2">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          )}

          {/* Sourced products list (for keyword search) */}
          {!loading && sourcedProducts.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Found on 1688 (for admin approval)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {sourcedProducts.map((p, i) => (
                  <div
                    key={i}
                    onClick={() => setProduct(p)}
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                      product && "original_1688_link" in product
                        ? product.original_1688_link === p.original_1688_link
                          ? "border-primary bg-primary/5"
                          : ""
                        : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <img
                        src={p.image_url}
                        alt={p.title_english}
                        className="w-16 h-16 rounded object-cover"
                        onError={(e) =>
                          (e.currentTarget.src = "https://placehold.co/64x64")
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">
                          {p.title_english}
                        </p>
                        <p className="text-xs text-orange-600 font-semibold">
                          {formatNGN(p.price_naira)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Product found */}
          {!loading && product && (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-32 h-32 rounded border flex items-center justify-center bg-slate-50 overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.title_english}
                    className="w-full h-full object-cover"
                    onError={(e) =>
                      (e.currentTarget.src = "https://placehold.co/128x128")
                    }
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-lg font-semibold">{product.title_english}</h3>
                  <div className="flex items-center gap-2">
                    {"product_id" in product ? (
                      <Badge variant="default" className="bg-green-500">
                        <Check className="w-3 h-3 mr-1" />
                        In Catalog
                      </Badge>
                    ) : (
                      <Badge variant="default" className="bg-blue-500">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Sourced from 1688
                      </Badge>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatNGN(product.price_naira)}
                  </div>
                  {"price_yuan" in product && (
                    <div className="text-xs text-muted-foreground">
                      Direct: ¥{product.price_yuan.toFixed(2)}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    MOQ: {product.moq} units
                  </div>
                </div>
              </div>
              <Button onClick={handleProceed} className="w-full">
                Proceed with this Product
              </Button>
            </div>
          )}

          {/* Manual entry mode */}
          {!loading && !product && manualEntryMode && (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Product not found in catalog</span>
              </div>
              <p className="text-sm text-muted-foreground">
                We&apos;ll add this URL to our scraping queue for admin review. You
                can proceed with manual entry in the meantime.
              </p>

              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Product Title</Label>
                  <Input
                    id="title"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="Enter product title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (NGN)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Product Image URL</Label>
                  <Input
                    id="image"
                    type="url"
                    value={manualImageUrl}
                    onChange={(e) => setManualImageUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                {manualImageUrl && (
                  <div className="w-32 h-32 rounded border flex items-center justify-center bg-slate-50 overflow-hidden">
                    <img
                      src={manualImageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) =>
                        (e.currentTarget.src = "https://placehold.co/128x128")
                      }
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={handleAddToQueue}
                    className="flex-1"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Add to Scraping Queue
                  </Button>
                  <Button
                    onClick={handleProceed}
                    className="flex-1"
                    disabled={!manualTitle || !manualPrice}
                  >
                    Proceed with Manual Entry
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
