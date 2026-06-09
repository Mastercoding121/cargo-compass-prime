/* ROUTE_KEY: DASHBOARD_ADDRESSES */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, MapPin } from "lucide-react";
import { getSession } from "@/lib/auth";

export const Route = createFileRoute("/dashboard/addresses")({
  component: Addresses,
});

const HUBS = [
  { code: "CN", flag: "🇨🇳", city: "Guangzhou, China", line1: "Building 7, NextGen Cargo Park", line2: "Baiyun District, Guangzhou 510000" },
  { code: "US", flag: "🇺🇸", city: "New Jersey, USA", line1: "112 Industrial Ave, Suite 4B", line2: "Edison, NJ 08817" },
  { code: "UK", flag: "🇬🇧", city: "London, UK", line1: "Unit 14 Stratford Logistics Park", line2: "London E15 2GW" },
  { code: "AE", flag: "🇦🇪", city: "Dubai, UAE", line1: "Warehouse 22, JAFZA South", line2: "Jebel Ali, Dubai" },
];

function Addresses() {
  const [handle, setHandle] = useState("NG-XXXX-CN");
  useEffect(() => { setHandle(getSession()?.handleId ?? "NG-XXXX-CN"); }, []);

  function copy(text: string) { navigator.clipboard.writeText(text); }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Warehouse addresses</h1>
        <p className="text-sm text-muted-foreground">Always include your handle <code className="text-primary">{handle}</code> on the recipient line.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {HUBS.map((h) => {
          const full = `${handle} — ${h.line1}, ${h.line2}`;
          return (
            <Card key={h.code} className="shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-xl">{h.flag}</span> {h.city}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-md border border-border bg-secondary/40 p-3 text-sm space-y-0.5">
                  <div className="font-mono text-primary">{handle}</div>
                  <div>{h.line1}</div>
                  <div>{h.line2}</div>
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => copy(full)}>
                  <Copy className="size-3.5" /> Copy address
                </Button>
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="size-3.5" /> Hub code {h.code}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
