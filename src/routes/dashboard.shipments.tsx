/* ROUTE_KEY: DASHBOARD_CONSOLIDATION */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Ship } from "lucide-react";

export const Route = createFileRoute("/dashboard/shipments")({
  component: Consolidation,
});

const READY = [
  { id: "P-9912", desc: "Anker chargers x12", weight: 4.2, hub: "Guangzhou" },
  { id: "P-9908", desc: "GPU mining rig", weight: 18.5, hub: "Guangzhou" },
  { id: "P-9905", desc: "Apparel bundle", weight: 7.8, hub: "Guangzhou" },
  { id: "P-9902", desc: "Phone cases x40", weight: 2.1, hub: "Guangzhou" },
];

function Consolidation() {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const stats = useMemo(() => {
    const items = READY.filter((r) => selected[r.id]);
    const weight = items.reduce((s, i) => s + i.weight, 0);
    const usd = Math.max(15, weight * 5.5);
    return { count: items.length, weight: weight.toFixed(1), usd: usd.toFixed(2) };
  }, [selected]);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Consolidation checkout</h1>
        <p className="text-sm text-muted-foreground">Combine ready parcels into a single shipment.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Ready to ship</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {READY.map((p) => (
                <li key={p.id} className="p-4 flex items-center gap-3 hover:bg-accent/30">
                  <Checkbox checked={!!selected[p.id]} onCheckedChange={(c) => setSelected((s) => ({ ...s, [p.id]: !!c }))} />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-primary text-sm">{p.id}</div>
                    <div className="text-sm truncate">{p.desc}</div>
                  </div>
                  <Badge variant="outline">{p.hub}</Badge>
                  <div className="text-sm tabular-nums w-16 text-right">{p.weight}kg</div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-primary/30 shadow-[var(--shadow-glow)] h-fit">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Ship className="size-4 text-primary" /> Shipment summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Row label="Parcels selected" value={`${stats.count}`} />
            <Row label="Total weight" value={`${stats.weight} kg`} />
            <Row label="Freight mode" value="Sea (FCL)" />
            <Row label="Destination" value="Lagos, NG" />
            <div className="h-px bg-border my-2" />
            <Row label="Estimated cost" value={`$${stats.usd}`} accent />
            <Button className="w-full" size="lg" disabled={stats.count === 0}>Confirm & ship</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={accent ? "text-primary font-semibold text-base" : "font-medium"}>{value}</span>
    </div>
  );
}
