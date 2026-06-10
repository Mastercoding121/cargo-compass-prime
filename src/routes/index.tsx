/* ROUTE_KEY: PUBLIC_LANDING */
import { createFileRoute, Link } from "@tanstack/react-router";
import { BRAND } from "@/config/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plane,
  Ship,
  Package,
  ShieldCheck,
  Globe2,
  Calculator,
  ShoppingBag,
} from "lucide-react";
import { ProductGrid } from "@/components/product/ProductGrid";
import { FreightModalsRow } from "@/components/freight/FreightModals";
import { fetchProducts } from "@/lib/appwrite";
import { useEffect, useState } from "react";
import { type AppwriteProduct } from "@/lib/appwrite";

export const Route = createFileRoute("/")({
  validateSearch: (search) => ({
    page: search.page ? Number(search.page) : 1,
  }),
  head: () => ({
    meta: [
      { title: `${BRAND.name} — ${BRAND.tagline}` },
      {
        name: "description",
        content:
          "Procure from 1688.com, consolidate parcels and ship cargo from China to Nigeria. Instant ₦ NGN freight quotes.",
      },
      { property: "og:title", content: `${BRAND.name} — ${BRAND.tagline}` },
      {
        property: "og:description",
        content: "Buy from 1688, ship to Lagos. Air, Sea & door delivery.",
      },
    ],
  }),
  component: Landing,
});

const PAGE_SIZE = 20;

function Landing() {
  const search = Route.useSearch();
  const currentPage = search.page || 1;

  const [products, setProducts] = useState<AppwriteProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const result = await fetchProducts({ page: currentPage, limit: PAGE_SIZE });
        setProducts(result.products);
        setTotal(result.total);
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentPage]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" search={{}} className="flex items-center gap-2">
            <div className="size-8 rounded-md bg-primary/15 border border-primary/40 grid place-items-center">
              <ShoppingBag className="size-4 text-primary" />
            </div>
            <span className="font-semibold tracking-tight text-sm sm:text-base">
              {BRAND.name}
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Get address</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-12 sm:pt-16 pb-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
            <ShieldCheck className="size-3.5" /> Trusted by 12,400+ Nigerian
            importers
          </div>
          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05]">
            Buy from 1688, ship to <span className="text-primary">Nigeria</span>{" "}
            — without the friction.
          </h1>
          <p className="mt-5 text-muted-foreground max-w-xl">
            Pick products direct from 1688.com at ₦ NGN converted prices. We
            procure, consolidate and ship by air or sea straight to Lagos.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/register">
              <Button size="lg">Create free account</Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">
                I have an account
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <Globe2 className="size-4 text-primary" /> Direct from China
            </span>
            <span className="flex items-center gap-2">
              <Ship className="size-4 text-primary" /> Sea & air freight
            </span>
            <span className="flex items-center gap-2">
              <Package className="size-4 text-primary" /> Lagos door delivery
            </span>
          </div>
        </div>
      </section>

      {/* Freight calculator triggers */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-12">
        <Card className="border-primary/25 shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="size-4 text-primary" /> Try our freight
              calculators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FreightModalsRow />
          </CardContent>
        </Card>
      </section>

      {/* 1688 PRODUCT FEED */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
        <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Live 1688 product feed
            </h2>
            <p className="text-sm text-muted-foreground">
              Procurement-ready inventory from verified Chinese suppliers.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-400">Loading products...</div>
          </div>
        ) : (
          <ProductGrid
            products={products}
            currentPage={currentPage}
            totalPages={totalPages}
          />
        )}
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            icon: Package,
            title: "Parcel pre-alerts",
            desc: "Notify us before goods arrive our warehouse. Auto-matched on receipt.",
          },
          {
            icon: Ship,
            title: "Consolidation checkout",
            desc: "Combine parcels into one shipment and save up to 60% on freight.",
          },
          {
            icon: Plane,
            title: "Air & sea options",
            desc: "Lagos arrival in 14, 21 or 65 days depending on cargo class.",
          },
        ].map((f) => (
          <Card key={f.title}>
            <CardHeader>
              <div className="size-9 rounded-md bg-primary/15 border border-primary/30 grid place-items-center mb-2">
                <f.icon className="size-4 text-primary" />
              </div>
              <CardTitle className="text-base">{f.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 flex flex-wrap justify-between gap-4 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} {BRAND.name}</span>
          <a
            href={`mailto:${BRAND.supportEmail}`}
            className="hover:text-primary"
          >
            {BRAND.supportEmail}
          </a>
        </div>
      </footer>
    </div>
  );
}
