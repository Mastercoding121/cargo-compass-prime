/* ROUTE_KEY: DASHBOARD_CONSOLIDATION */
/* Procurement cart with M.O.Q enforcement, 48h Pending Payment timer, and admin smokescreen status. */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  useCart, cartStore, useCountdown, type CartItem,
} from "@/lib/cart";
import { FREIGHT_CLASS_COLOR } from "@/lib/products";
import { cnyToNgn, formatNGN, formatCNY } from "@/lib/fx";
import { ShoppingCart, Trash2, CreditCard, XCircle, Clock, Truck, Boxes } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/shipments")({
  component: ConsolidationCart,
});

function ConsolidationCart() {
  const items = useCart();
  const active = items.filter((i) => i.status === "In Cart");
  const pending = items.filter((i) => i.status === "Pending Payment");
  const inProgress = items.filter(
    (i) =>
      i.status === "Pending Purchase" ||
      i.status === "Purchased / Pending China Warehouse" ||
      i.status === "NextGen Hub China Warehouse",
  );

  const totals = useMemo(() => {
    const sum = (arr: CartItem[]) =>
      arr.reduce((s, i) => s + cnyToNgn(i.product.pricePerUnitCNY) * i.quantity, 0);
    return { cart: sum(active), pending: sum(pending), live: sum(inProgress) };
  }, [active, pending, inProgress]);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Procurement cart</h1>
        <p className="text-sm text-muted-foreground">
          Your saved 1688 selections are persisted permanently — items only leave the cart when you delete them or an admin advances the order.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={ShoppingCart} label="Active cart" value={`${active.length}`} sub={formatNGN(totals.cart)} />
        <Stat icon={Clock} label="Pending payment" value={`${pending.length}`} sub={formatNGN(totals.pending)} tone="amber" />
        <Stat icon={Truck} label="In transit / warehouse" value={`${inProgress.length}`} sub={formatNGN(totals.live)} tone="emerald" />
        <Stat icon={Boxes} label="Total saved items" value={`${items.length}`} sub="permanent record" />
      </div>

      {/* ACTIVE CART */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingCart className="size-4 text-primary" /> Active cart ({active.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {active.length === 0 ? (
            <Empty label="Your cart is empty. Browse 1688 products from the dashboard." />
          ) : (
            <ul className="divide-y divide-border">
              {active.map((it) => <ActiveRow key={it.uid} item={it} />)}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* PENDING PAYMENT */}
      {pending.length > 0 && (
        <Card className="border-amber-300">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-amber-700">
              <Clock className="size-4" /> Pending payment ({pending.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {pending.map((it) => <PendingRow key={it.uid} item={it} />)}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* LIVE ORDERS (admin smokescreen) */}
      {inProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="size-4 text-primary" /> In progress ({inProgress.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {inProgress.map((it) => <ProgressRow key={it.uid} item={it} />)}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ActiveRow({ item }: { item: CartItem }) {
  const unitNgn = cnyToNgn(item.product.pricePerUnitCNY);
  const lineTotal = unitNgn * item.quantity;
  return (
    <li className="p-4 flex flex-wrap items-center gap-3 hover:bg-accent/30">
      <img src={item.product.image} alt="" className="size-16 rounded-md object-cover border border-border shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{item.product.title}</div>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className={["text-[10px]", FREIGHT_CLASS_COLOR[item.product.freightClass]].join(" ")}>
            {item.product.freightClass}
          </Badge>
          <span className="text-[11px] text-muted-foreground">
            {formatCNY(item.product.pricePerUnitCNY)} / {item.product.unit} · MOQ {item.product.moq}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={item.product.moq}
          value={item.quantity}
          onChange={(e) => cartStore.setQuantity(item.uid, parseInt(e.target.value) || item.product.moq)}
          className="w-20 h-9"
        />
        <div className="text-right w-28">
          <div className="text-sm font-semibold text-primary">{formatNGN(lineTotal)}</div>
          <div className="text-[10px] text-muted-foreground">{formatNGN(unitNgn)} × {item.quantity}</div>
        </div>
        <Button
          size="sm"
          onClick={() => {
            cartStore.pay(item.uid);
            toast.success("Payment initiated", { description: "You have 48 hours to complete payment." });
          }}
          className="gap-1.5"
        >
          <CreditCard className="size-4" /> Pay
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => {
            cartStore.remove(item.uid);
            toast.message("Removed from cart");
          }}
          aria-label="Remove"
        >
          <Trash2 className="size-4 text-muted-foreground" />
        </Button>
      </div>
    </li>
  );
}

function PendingRow({ item }: { item: CartItem }) {
  const countdown = useCountdown(item.payDeadline);
  const unitNgn = cnyToNgn(item.product.pricePerUnitCNY);
  return (
    <li className="p-4 flex flex-wrap items-center gap-3 bg-amber-50/40">
      <img src={item.product.image} alt="" className="size-16 rounded-md object-cover border border-amber-200 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{item.product.title}</div>
        <div className="flex items-center gap-2 mt-1">
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 border text-[10px]">PENDING PAYMENT</Badge>
          <span className="text-[11px] text-muted-foreground">Qty {item.quantity} · {formatNGN(unitNgn * item.quantity)}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="font-mono text-sm tabular-nums px-3 py-1.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
          {countdown}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            cartStore.cancelPay(item.uid);
            toast.message("Order cancelled", { description: "Item moved back to active cart." });
          }}
          className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-100"
        >
          <XCircle className="size-4" /> Cancel order
        </Button>
      </div>
    </li>
  );
}

function ProgressRow({ item }: { item: CartItem }) {
  const tone =
    item.status === "Pending Purchase"
      ? "bg-sky-100 text-sky-800 border-sky-300"
      : item.status === "Purchased / Pending China Warehouse"
      ? "bg-indigo-100 text-indigo-800 border-indigo-300"
      : "bg-emerald-100 text-emerald-800 border-emerald-300";
  return (
    <li className="p-4 flex items-center gap-3">
      <img src={item.product.image} alt="" className="size-16 rounded-md object-cover border border-border shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{item.product.title}</div>
        <div className="text-[11px] text-muted-foreground">Qty {item.quantity}</div>
      </div>
      <Badge className={["border text-[10px]", tone].join(" ")}>{item.status.toUpperCase()}</Badge>
    </li>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="p-10 text-center text-sm text-muted-foreground">{label}</div>;
}

function Stat({
  icon: Icon, label, value, sub, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; sub?: string;
  tone?: "amber" | "emerald";
}) {
  const toneClass =
    tone === "amber" ? "text-amber-600" : tone === "emerald" ? "text-emerald-600" : "text-primary";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <Icon className={["size-4", toneClass].join(" ")} />
        </div>
        <div className="mt-2 text-2xl font-semibold">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}
