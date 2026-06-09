/* ROUTE_KEY: ADMIN_ROOT */
/* Smokescreen manager: admin manually drives the customer-facing status progression. */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAuthGuards } from "@/routes/AppRoutes";
import { BRAND } from "@/config/brand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { clearSession } from "@/lib/auth";
import { useCart, cartStore, type CartItem, type OrderStatus } from "@/lib/cart";
import { cnyToNgn, formatNGN } from "@/lib/fx";
import { Shield, LogOut, Users, Boxes, Truck, Check, ArrowRight, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: `Admin — ${BRAND.name}` }] }),
  component: AdminConsole,
});

const STATUS_FLOW: { from: OrderStatus; to: OrderStatus; label: string }[] = [
  { from: "Pending Payment",                        to: "Pending Purchase",                       label: "Verify payment" },
  { from: "Pending Purchase",                       to: "Purchased / Pending China Warehouse",    label: "Mark purchased on 1688" },
  { from: "Purchased / Pending China Warehouse",    to: "NextGen Hub China Warehouse",            label: "Arrived at China hub" },
];

function AdminConsole() {
  useAuthGuards();
  const navigate = useNavigate();
  const items = useCart();
  const [tab, setTab] = useState<"queue" | "all">("queue");

  function logout() { clearSession(); navigate({ to: "/login", replace: true }); }

  const queue = useMemo(
    () => items.filter((i) => i.status !== "In Cart"),
    [items],
  );
  const view = tab === "queue" ? queue : items;

  const kpis = useMemo(() => ({
    pendingPay: items.filter((i) => i.status === "Pending Payment").length,
    pendingBuy: items.filter((i) => i.status === "Pending Purchase").length,
    inHub:      items.filter((i) => i.status === "NextGen Hub China Warehouse").length,
    revenue:    queue.reduce((s, i) => s + cnyToNgn(i.product.pricePerUnitCNY) * i.quantity, 0),
  }), [items, queue]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/95 backdrop-blur flex items-center px-4 sm:px-6 gap-3">
        <Shield className="size-5 text-primary" />
        <div className="font-semibold">Admin Smokescreen Console</div>
        <Badge variant="outline" className="border-primary/40 text-primary">RESTRICTED</Badge>
        <div className="ml-auto flex gap-2">
          <Link to="/dashboard"><Button variant="ghost" size="sm">Customer view</Button></Link>
          <Button variant="outline" size="sm" onClick={logout} className="gap-2"><LogOut className="size-4" /> Log out</Button>
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Order progression matrix</h1>
          <p className="text-sm text-muted-foreground">
            Flip customer-visible status manually. Real 1688 logistics happen off-platform — the user only ever sees what you advance here.
          </p>
        </div>

        <div className="grid sm:grid-cols-4 gap-3">
          <KPI icon={ShoppingBag} label="Pending payment"     value={`${kpis.pendingPay}`} />
          <KPI icon={Users}       label="Pending purchase"    value={`${kpis.pendingBuy}`} />
          <KPI icon={Boxes}       label="Arrived NH-China"    value={`${kpis.inHub}`} />
          <KPI icon={Truck}       label="Order book"          value={formatNGN(kpis.revenue)} />
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Live order queue</CardTitle>
            <div className="flex gap-1 rounded-md border border-border p-0.5 text-xs">
              <button onClick={() => setTab("queue")} className={["px-3 py-1 rounded", tab === "queue" ? "bg-primary text-primary-foreground" : "text-muted-foreground"].join(" ")}>Queue ({queue.length})</button>
              <button onClick={() => setTab("all")} className={["px-3 py-1 rounded", tab === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground"].join(" ")}>All ({items.length})</button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {view.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">No orders in this view.</div>
            ) : (
              <ul className="divide-y divide-border">
                {view.map((it) => <AdminRow key={it.uid} item={it} />)}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function AdminRow({ item }: { item: CartItem }) {
  const next = STATUS_FLOW.find((s) => s.from === item.status);
  return (
    <li className="p-4 flex flex-wrap items-center gap-3">
      <img src={item.product.image} alt="" className="size-14 rounded-md object-cover border border-border shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{item.product.title}</div>
        <div className="text-[11px] text-muted-foreground">
          Qty {item.quantity} · {formatNGN(cnyToNgn(item.product.pricePerUnitCNY) * item.quantity)} · {item.product.freightClass}
        </div>
      </div>
      <Badge variant="outline" className="text-[10px]">{item.status}</Badge>
      {next && (
        <Button
          size="sm"
          onClick={() => {
            cartStore.adminAdvance(item.uid, next.to);
            toast.success("Status advanced", { description: `→ ${next.to}` });
          }}
          className="gap-1.5"
        >
          <Check className="size-3.5" /> {next.label} <ArrowRight className="size-3.5" />
        </Button>
      )}
    </li>
  );
}

function KPI({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <Icon className="size-4 text-primary" />
        </div>
        <div className="mt-2 text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}
