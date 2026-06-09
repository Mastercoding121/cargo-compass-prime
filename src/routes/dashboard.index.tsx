/* ROUTE_KEY: DASHBOARD_HOME */
import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Ship, DollarSign, Clock, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

const STATS = [
  { label: "Inbound parcels", value: "12", icon: Package, delta: "+3 this week" },
  { label: "Active shipments", value: "4", icon: Ship, delta: "2 in transit" },
  { label: "Spend (USD)", value: "$1,284", icon: DollarSign, delta: "30d" },
  { label: "Avg. transit", value: "11d", icon: Clock, delta: "-2d MoM" },
];

const SHIPMENTS = [
  { id: "SH-1042", origin: "🇨🇳 Guangzhou", mode: "Sea", weight: "82kg", status: "In transit", tone: "default" as const },
  { id: "SH-1041", origin: "🇺🇸 New Jersey", mode: "Air", weight: "6.4kg", status: "Customs", tone: "secondary" as const },
  { id: "SH-1039", origin: "🇦🇪 Dubai", mode: "Air", weight: "14kg", status: "Delivered", tone: "outline" as const },
];

function DashboardHome() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Operations overview</h1>
          <p className="text-sm text-muted-foreground">Live snapshot of inbound parcels and active shipments.</p>
        </div>
        <Link to="/dashboard/shipments"><Button>New shipment <ArrowUpRight className="size-4" /></Button></Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS.map((s) => (
          <Card key={s.label} className="shadow-[var(--shadow-card)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</div>
                <s.icon className="size-4 text-primary" />
              </div>
              <div className="mt-2 text-2xl font-semibold">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.delta}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent shipments</CardTitle>
          <Link to="/dashboard/shipments" className="text-xs text-primary hover:underline">View all</Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground border-y border-border">
                <tr><th className="text-left p-3">ID</th><th className="text-left p-3">Origin</th><th className="text-left p-3">Mode</th><th className="text-left p-3">Weight</th><th className="text-left p-3">Status</th></tr>
              </thead>
              <tbody>
                {SHIPMENTS.map((s) => (
                  <tr key={s.id} className="border-b border-border/60 hover:bg-accent/30">
                    <td className="p-3 font-mono text-primary">{s.id}</td>
                    <td className="p-3">{s.origin}</td>
                    <td className="p-3">{s.mode}</td>
                    <td className="p-3">{s.weight}</td>
                    <td className="p-3"><Badge variant={s.tone}>{s.status}</Badge></td>
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
