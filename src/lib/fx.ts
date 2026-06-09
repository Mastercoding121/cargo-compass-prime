/* FX_SERVICE: Multi-currency conversion layer (mock live rates) */
export const FX = {
  /* Anchor rates — replace with live API later */
  CNY_TO_NGN: 230,   // 1 ¥ ≈ ₦230
  USD_TO_NGN: 1650,  // $1 ≈ ₦1,650
  CNY_TO_USD: 1 / 7.18,
} as const;

export function cnyToNgn(cny: number): number {
  return cny * FX.CNY_TO_NGN;
}
export function usdToNgn(usd: number): number {
  return usd * FX.USD_TO_NGN;
}
export function formatNGN(n: number): string {
  return "₦" + Math.round(n).toLocaleString("en-NG");
}
export function formatCNY(n: number): string {
  return "¥" + n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}
export function formatUSD(n: number): string {
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}
