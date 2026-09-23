import { formatCurrency, type CurrencyCode } from "./currency";

/** @deprecated Use formatCurrency(n, code) instead */
export function formatINR(n: number | null | undefined): string {
  return formatCurrency(n, "INR");
}

export { formatCurrency, type CurrencyCode };
