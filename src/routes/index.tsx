/* ROUTE_KEY: PUBLIC_LANDING */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BRAND } from "@/config/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, Ship, Package, Calculator, ShieldCheck, Globe2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${BRAND.name} — ${BRAND.tagline}` },
      { name: "description", content: "Procure, consolidate and ship cargo from China, US, UK & UAE to Nigeria. Real-time freight quotes, parcel pre-alerts, warehouse addresses." },
      { property: "og:title", content: `${BRAND.name} — ${BRAND.tagline}` },
      { property: "og:description", content: "Instant freight quotes & door-to-door cargo procurement." },
    ],
  }),
  component: Landing,
});

const RATES: Record<string, { air: number; sea: number }> = {
  CN: { air: 14, sea: 5.5 },
  US: { air: 22, sea: 7 },
  UK: { air: 19, sea: 6.5 },
  AE: { air: 12, sea: 4.5 },
};

function Landing() {
  const [origin, setOrigin] = useState("CN");
  const [mode, setMode] = useState<"air" | "sea">("air");
  const [weight, setWeight] = useState(5);

  const quote = useMemo(() => {
    const rate = RATES[origin][mode];
    const usd = Math.max(15, weight * rate);
    const ngn = usd * 1600;
    return { usd: usd.toFixed(2), ngn: ngn.toLocaleString("en-NG", { maximumFractionDigits: 0 }) };
  }, [origin, mode, weight]);

  return (
    <div className="min-h-screen">
      {/* nav */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-8 rounded-md bg-primary/15 border border-primary/40 grid place-items-center">
              <Plane className="size-4 text-primary" />
            </div>
            <span className="font-semibold tracking-tight text-sm sm:text-base">{BRAND.name}</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link to="/register"><Button size="sm">Get address</Button></Link>
          </nav>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-12 sm:pt-20 pb-12 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
            <ShieldCheck className="size-3.5" /> Trusted by 12,400+ Nigerian importers
          </div>
          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05]">
            Freight forwarding & <span className="text-primary">cargo procurement</span> — without the friction.
          </h1>
          <p className="mt-5 text-muted-foreground max-w-xl">
            Get a personal warehouse address in China, US, UK and UAE. Consolidate parcels, pre-alert shipments, and ship door-to-door at wholesale rates.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/register"><Button size="lg">Create free account</Button></Link>
            <Link to="/login"><Button size="lg" variant="outline">I have an account</Button></Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-2"><Globe2 className="size-4 text-primary" /> 4 origin hubs</span>
            <span className="flex items-center gap-2"><Ship className="size-4 text-primary" /> Sea & air freight</span>
            <span className="flex items-center gap-2"><Package className="size-4 text-primary" /> Door delivery NG-wide</span>
          </div>
        </div>

        {/* calculator card */}
        <Card className="border-primary/25 shadow-[var(--shadow-glow)]">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-primary text-sm">
              <Calculator className="size-4" /> Instant freight calculator
            </div>
            <CardTitle className="text-2xl">Quote your shipment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Origin</Label>
                <Select value={origin} onValueChange={setOrigin}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CN">🇨🇳 China</SelectItem>
                    <SelectItem value="US">🇺🇸 United States</SelectItem>
                    <SelectItem value="UK">🇬🇧 United Kingdom</SelectItem>
                    <SelectItem value="AE">🇦🇪 UAE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Mode</Label>
                <Select value={mode} onValueChange={(v) => setMode(v as "air" | "sea")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="air">Air freight</SelectItem>
                    <SelectItem value="sea">Sea freight</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Weight (kg)</Label>
              <Input type="number" min={0.1} step={0.1} value={weight} onChange={(e) => setWeight(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex items-end justify-between">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Estimated</div>
                <div className="text-3xl font-semibold text-primary">${quote.usd}</div>
                <div className="text-xs text-muted-foreground">≈ ₦{quote.ngn}</div>
              </div>
              <Link to="/register"><Button>Book shipment</Button></Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* features */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Package, title: "Parcel pre-alerts", desc: "Notify us before goods arrive our warehouse. Auto-matched on receipt." },
          { icon: Ship, title: "Consolidation checkout", desc: "Combine parcels into one shipment and save up to 60% on freight." },
          { icon: Globe2, title: "Deep warehouse network", desc: "Verified addresses in Guangzhou, Yiwu, New Jersey, London & Dubai." },
        ].map((f) => (
          <Card key={f.title}>
            <CardHeader>
              <div className="size-9 rounded-md bg-primary/15 border border-primary/30 grid place-items-center mb-2">
                <f.icon className="size-4 text-primary" />
              </div>
              <CardTitle className="text-base">{f.title}</CardTitle>
            </CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">{f.desc}</p></CardContent>
          </Card>
        ))}
      </section>

      <footer className="border-t border-border mt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 flex flex-wrap justify-between gap-4 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} {BRAND.name}</span>
          <a href={`mailto:${BRAND.supportEmail}`} className="hover:text-primary">{BRAND.supportEmail}</a>
        </div>
      </footer>
    </div>
  );
}
