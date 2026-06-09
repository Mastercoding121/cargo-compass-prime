/* ROUTE_KEY: DASHBOARD_PARCELS */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, PackageSearch } from "lucide-react";

export const Route = createFileRoute("/dashboard/parcels")({
  component: Parcels,
});

type Parcel = { id: string; tracking: string; vendor: string; hub: string; status: "Expected" | "Received" | "Matched" };
const SEED: Parcel[] = [
  { id: "P-9912", tracking: "SF1029384756", vendor: "Anker Direct", hub: "Guangzhou", status: "Received" },
  { id: "P-9911", tracking: "YT8827341190", vendor: "Shein Wholesale", hub: "Yiwu", status: "Expected" },
  { id: "P-9908", tracking: "UPS1Z9X88A02", vendor: "Newegg", hub: "New Jersey", status: "Matched" },
];

function Parcels() {
  const [items, setItems] = useState<Parcel[]>(SEED);
  const [open, setOpen] = useState(false);
  const [tracking, setTracking] = useState("");
  const [vendor, setVendor] = useState("");

  function addParcel(e: React.FormEvent) {
    e.preventDefault();
    setItems((p) => [{ id: `P-${Math.floor(9000 + Math.random() * 999)}`, tracking, vendor, hub: "Guangzhou", status: "Expected" }, ...p]);
    setTracking(""); setVendor(""); setOpen(false);
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pre-alerts</h1>
          <p className="text-sm text-muted-foreground">Tell us what's coming so we can match it on arrival.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4" /> New pre-alert</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create pre-alert</DialogTitle></DialogHeader>
            <form onSubmit={addParcel} className="space-y-3">
              <div className="space-y-1.5"><Label>Tracking number</Label><Input value={tracking} onChange={(e) => setTracking(e.target.value)} required /></div>
              <div className="space-y-1.5"><Label>Vendor / store</Label><Input value={vendor} onChange={(e) => setVendor(e.target.value)} required /></div>
              <Button type="submit" className="w-full">Submit</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><PackageSearch className="size-4 text-primary" /> All pre-alerts</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground border-y border-border">
                <tr><th className="text-left p-3">ID</th><th className="text-left p-3">Tracking</th><th className="text-left p-3">Vendor</th><th className="text-left p-3">Hub</th><th className="text-left p-3">Status</th></tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-b border-border/60 hover:bg-accent/30">
                    <td className="p-3 font-mono text-primary">{p.id}</td>
                    <td className="p-3 font-mono">{p.tracking}</td>
                    <td className="p-3">{p.vendor}</td>
                    <td className="p-3">{p.hub}</td>
                    <td className="p-3"><Badge variant={p.status === "Received" ? "default" : p.status === "Matched" ? "secondary" : "outline"}>{p.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
