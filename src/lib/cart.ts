/* CART_STORE: Persistent procurement cart + status workflow + 48h pending-payment timer */
import { useEffect, useState } from "react";
import type { Product1688, FreightClass } from "./products";

export type OrderStatus =
  | "In Cart"
  | "Pending Payment"        // user clicked Pay — 48h timer running
  | "Pending Purchase"       // admin verified payment
  | "Purchased / Pending China Warehouse"
  | "NextGen Hub China Warehouse";

export interface CartItem {
  uid: string;               // unique cart row id
  product: Product1688;
  quantity: number;
  status: OrderStatus;
  payDeadline?: number;      // epoch ms, when status === 'Pending Payment'
  addedAt: number;
}

const KEY = "ngh_cart_v1";
const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;

type Listener = (s: CartItem[]) => void;
const listeners = new Set<Listener>();

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}
function write(items: CartItem[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l(items));
  window.dispatchEvent(new Event("ngh:cart"));
}

export const cartStore = {
  get: read,
  subscribe(l: Listener) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  add(product: Product1688, quantity: number) {
    if (quantity < product.moq) {
      throw new Error(`Minimum order is ${product.moq} ${product.unit}(s)`);
    }
    const items = read();
    const existing = items.find(
      (i) => i.product.id === product.id && i.status === "In Cart",
    );
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.unshift({
        uid: crypto.randomUUID(),
        product,
        quantity,
        status: "In Cart",
        addedAt: Date.now(),
      });
    }
    write(items);
  },
  remove(uid: string) {
    write(read().filter((i) => i.uid !== uid));
  },
  setQuantity(uid: string, qty: number) {
    const items = read();
    const it = items.find((i) => i.uid === uid);
    if (!it) return;
    if (qty < it.product.moq) qty = it.product.moq;
    it.quantity = qty;
    write(items);
  },
  pay(uid: string) {
    const items = read();
    const it = items.find((i) => i.uid === uid);
    if (!it) return;
    it.status = "Pending Payment";
    it.payDeadline = Date.now() + FORTY_EIGHT_HOURS;
    write(items);
  },
  cancelPay(uid: string) {
    const items = read();
    const it = items.find((i) => i.uid === uid);
    if (!it) return;
    it.status = "In Cart";
    it.payDeadline = undefined;
    write(items);
  },
  /* ADMIN_FLOW: Status progression matrix */
  adminAdvance(uid: string, status: OrderStatus) {
    const items = read();
    const it = items.find((i) => i.uid === uid);
    if (!it) return;
    it.status = status;
    if (status !== "Pending Payment") it.payDeadline = undefined;
    write(items);
  },
  /* TIMER_SWEEP: revert expired Pending Payment rows back to cart */
  sweepExpired() {
    const items = read();
    let changed = false;
    const now = Date.now();
    for (const it of items) {
      if (
        it.status === "Pending Payment" &&
        it.payDeadline &&
        it.payDeadline <= now
      ) {
        it.status = "In Cart";
        it.payDeadline = undefined;
        changed = true;
      }
    }
    if (changed) write(items);
  },
};

export function useCart(): CartItem[] {
  const [items, setItems] = useState<CartItem[]>(() => read());
  useEffect(() => {
    const unsub = cartStore.subscribe(setItems);
    const sync = () => setItems(read());
    window.addEventListener("ngh:cart", sync);
    window.addEventListener("storage", sync);
    const sweep = setInterval(() => cartStore.sweepExpired(), 1000);
    return () => {
      unsub();
      window.removeEventListener("ngh:cart", sync);
      window.removeEventListener("storage", sync);
      clearInterval(sweep);
    };
  }, []);
  return items;
}

export function useCountdown(deadline?: number): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!deadline) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [deadline]);
  if (!deadline) return "—";
  const ms = Math.max(0, deadline - now);
  const d = Math.floor(ms / (24 * 3600 * 1000));
  const h = Math.floor((ms % (24 * 3600 * 1000)) / (3600 * 1000));
  const m = Math.floor((ms % (3600 * 1000)) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${d}D:${String(h).padStart(2, "0")}H:${String(m).padStart(2, "0")}M:${String(s).padStart(2, "0")}S`;
}

export function freightClassesOf(items: CartItem[]): FreightClass[] {
  return Array.from(new Set(items.map((i) => i.product.freightClass)));
}
