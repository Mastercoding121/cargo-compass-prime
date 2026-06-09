/* FREIGHT_MODALS: High-contrast white & orange freight calculators */
import { useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plane, Ship, AlertTriangle, ArrowLeft, Calculator } from "lucide-react";
import { formatNGN, formatUSD, usdToNgn, FX } from "@/lib/fx";

type Mode = "air-normal" | "air-haz" | "sea";

const MODES = {
  "air-normal": {
    title: "Air Cargo — Normal Goods",
    icon: Plane,
    destination: "LOS (Lagos)",
    eta: "14 Days",
    rate: 10.70,
    rateUnit: "KG",
    minUnit: 1,
    minUnitLabel: "1kg",
    inputLabel: "Total Weight (KG)",
    warning:
      "ATTENTION: Any package weighing less than 1kg will be automatically rounded up and billed as a 1kg minimum shipment, unless consolidated with subsequent inbound orders.",
  },
  "air-haz": {
    title: "Air Cargo — Battery / Powder / Liquid Goods",
    icon: Plane,
    destination: "LOS (Lagos)",
    eta: "21 Days",
    rate: 11.70,
    rateUnit: "KG",
    minUnit: 1,
    minUnitLabel: "1kg",
    inputLabel: "Total Weight (KG)",
    warning:
      "ATTENTION: Any package weighing less than 1kg will be automatically rounded up and billed as a 1kg minimum shipment, unless consolidated with subsequent inbound orders.",
  },
  sea: {
    title: "Sea Cargo — All Cargo Classifications",
    icon: Ship,
    destination: "LOS (Lagos)",
    eta: "65 Days",
    rate: 385.00,
    rateUnit: "CBM",
    minUnit: 0.01,
    minUnitLabel: "0.01 CBM",
    inputLabel: "Total Volume (CBM)",
    warning:
      "ATTENTION: Any cargo volume measuring less than 0.01 CBM will be automatically rounded up and billed at a 0.01 CBM baseline minimum.",
  },
} as const;

export function FreightModalTrigger({ mode, children }: { mode: Mode; children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <FreightModalBody mode={mode} />
    </Dialog>
  );
}

function FreightModalBody({ mode }: { mode: Mode }) {
  const cfg = MODES[mode];
  const [input, setInput] = useState<number>(cfg.minUnit);

  const calc = useMemo(() => {
    const billable = Math.max(cfg.minUnit, input || 0);
    const usd = billable * cfg.rate;
    const ngn = usdToNgn(usd);
    return { billable, usd, ngn, wasRoundedUp: (input || 0) < cfg.minUnit };
  }, [input, cfg.minUnit, cfg.rate]);

  return (
    <DialogContent className="max-w-lg bg-white text-slate-900 p-0 overflow-hidden border-orange-200">
      {/* Header with Back */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-5">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <DialogTrigger asChild>
              <button
                className="inline-flex items-center gap-1.5 rounded-md bg-white/15 hover:bg-white/25 px-2.5 py-1 text-xs font-medium border border-white/30 transition"
              >
                <ArrowLeft className="size-3.5" /> Back to dashboard
              </button>
            </DialogTrigger>
            <Badge className="bg-white text-orange-600 hover:bg-white border-0">TRIAL CALC</Badge>
          </div>
          <DialogTitle className="text-white text-xl flex items-center gap-2">
            <cfg.icon className="size-5" /> {cfg.title}
          </DialogTitle>
        </DialogHeader>
      </div>

      <div className="p-5 space-y-4">
        {/* Rule strip */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Destination" value={cfg.destination} />
          <Stat label="Arrival ETA" value={cfg.eta} />
          <Stat label="Base Rate" value={`${formatUSD(cfg.rate)}/${cfg.rateUnit}`} />
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2 rounded-md border-2 border-orange-300 bg-orange-50 p-3 text-xs text-orange-900">
          <AlertTriangle className="size-4 shrink-0 mt-0.5 text-orange-600" />
          <span>{cfg.warning}</span>
        </div>

        {/* Input */}
        <div className="space-y-1.5">
          <Label className="text-slate-700">{cfg.inputLabel}</Label>
          <Input
            type="number"
            min={0}
            step={cfg.minUnit}
            value={input}
            onChange={(e) => setInput(parseFloat(e.target.value) || 0)}
            className="bg-white border-slate-300 text-slate-900"
          />
          {calc.wasRoundedUp && (
            <p className="text-[11px] text-orange-700">Rounded up to billable minimum of {cfg.minUnitLabel}.</p>
          )}
        </div>

        {/* Quote panel */}
        <div className="rounded-lg border-2 border-orange-400 bg-gradient-to-br from-orange-50 to-white p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-orange-700 font-semibold">
            <Calculator className="size-3.5" /> Estimated quote
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-extrabold text-orange-600 leading-none">{formatNGN(calc.ngn)}</div>
              <div className="text-xs text-slate-500 mt-1">≈ {formatUSD(calc.usd)} • billed at {calc.billable.toFixed(2)} {cfg.rateUnit}</div>
            </div>
            <Badge variant="outline" className="border-orange-300 text-orange-700">FX ${1} = ₦{FX.USD_TO_NGN.toLocaleString()}</Badge>
          </div>
        </div>

        <DialogTrigger asChild>
          <Button variant="outline" className="w-full border-orange-300 text-orange-700 hover:bg-orange-50 gap-2">
            <ArrowLeft className="size-4" /> Back to dashboard
          </Button>
        </DialogTrigger>
      </div>
    </DialogContent>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

export function FreightModalsRow() {
  return (
    <div className="grid sm:grid-cols-3 gap-3">
      <FreightModalTrigger mode="air-normal">
        <Button variant="outline" className="h-auto p-4 flex-col items-start gap-1 border-orange-200 hover:bg-orange-50 hover:border-orange-400">
          <div className="flex items-center gap-2 text-orange-600"><Plane className="size-4" /> <span className="text-xs font-bold">AIR · NORMAL</span></div>
          <div className="text-sm font-semibold">$10.70 / KG · 14 days</div>
          <div className="text-[11px] text-muted-foreground">Lagos (LOS) · Trial calc</div>
        </Button>
      </FreightModalTrigger>
      <FreightModalTrigger mode="air-haz">
        <Button variant="outline" className="h-auto p-4 flex-col items-start gap-1 border-orange-200 hover:bg-orange-50 hover:border-orange-400">
          <div className="flex items-center gap-2 text-orange-600"><Plane className="size-4" /> <span className="text-xs font-bold">AIR · BAT/LIQ</span></div>
          <div className="text-sm font-semibold">$11.70 / KG · 21 days</div>
          <div className="text-[11px] text-muted-foreground">Lagos (LOS) · Trial calc</div>
        </Button>
      </FreightModalTrigger>
      <FreightModalTrigger mode="sea">
        <Button variant="outline" className="h-auto p-4 flex-col items-start gap-1 border-orange-200 hover:bg-orange-50 hover:border-orange-400">
          <div className="flex items-center gap-2 text-orange-600"><Ship className="size-4" /> <span className="text-xs font-bold">SEA · ALL</span></div>
          <div className="text-sm font-semibold">$385 / CBM · 65 days</div>
          <div className="text-[11px] text-muted-foreground">Lagos (LOS) · Trial calc</div>
        </Button>
      </FreightModalTrigger>
    </div>
  );
}
