/* ROUTE_KEY: ADMIN_ROOT */
import { createFileRoute } from "@tanstack/react-router";
import { useAuthGuards } from "@/routes/AppRoutes";
import { BRAND } from "@/config/brand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { clearSession } from "@/lib/auth";
import { Shield, Users, Boxes, Truck, LogOut } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: `Admin — ${BRAND.name}` }] }),
  component: AdminConsole,
});

const KPIS = [
  { label: "Active customers", value: "1,284", icon: Users },
  { label: "Parcels in hubs", value: "3,902", icon: Boxes },
  { label: "Shipments today", value: "47", icon: Truck },
];

function AdminConsole() {
  useAuthGuards();
  const navigate = useNavigate();
  function logout() { clearSession(); navigate({ to: "/login", replace: true }); }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur flex items-center px-4 sm:px-6 gap-3">
        <Shield className="size-5 text-primary" />
        <div className="font-semibold">Admin Console</div>
        <Badge variant="outline" className="border-primary/40 text-primary">RESTRICTED</Badge>
        <div className="ml-auto flex gap-2">
          <Link to="/dashboard"><Button variant="ghost" size="sm">Customer view</Button></Link>
          <Button variant="outline" size="sm" onClick={logout} className="gap-2"><LogOut className="size-4" /> Log out</Button>
        </div>
      </header>
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Operations control</h1>
          <p className="text-sm text-muted-foreground">Network-wide metrics for {BRAND.name}.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {KPIS.map((k) => (
            <Card key={k.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{k.label}</div>
                  <k.icon className="size-4 text-primary" />
                </div>
                <div className="mt-2 text-3xl font-semibold">{k.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base">Recent admin activity</CardTitle></CardHeader>
          <CardContent>
            <ul className="text-sm divide-y divide-border">
              <li className="py-2 flex justify-between"><span>Approved shipment SH-1042</span><span className="text-muted-foreground">2m ago</span></li>
              <li className="py-2 flex justify-between"><span>Onboarded customer NG-LIZAA-UK</span><span className="text-muted-foreground">12m ago</span></li>
              <li className="py-2 flex justify-between"><span>Adjusted air rate CN → +0.5/kg</span><span className="text-muted-foreground">1h ago</span></li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
