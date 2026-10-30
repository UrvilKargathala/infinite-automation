/** Multi-currency config and formatting */

export type CurrencyCode = "INR" | "AED" | "USD" | "AUD" | "GBP" | "EUR" | "SGD" | "CAD";

export interface CurrencyConfig {
  code: CurrencyCode;
  name: string;
  symbol: string;
  locale: string;
  taxLabel: string;
  taxRate: number; // e.g. 0.18 = 18%
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  INR: { code: "INR", name: "Indian Rupee", symbol: "₹", locale: "en-IN", taxLabel: "GST", taxRate: 0.18 },
  AED: { code: "AED", name: "UAE Dirham", symbol: "د.إ", locale: "en-AE", taxLabel: "VAT", taxRate: 0.05 },
  USD: { code: "USD", name: "US Dollar", symbol: "$", locale: "en-US", taxLabel: "Tax", taxRate: 0 },
  AUD: { code: "AUD", name: "Australian Dollar", symbol: "A$", locale: "en-AU", taxLabel: "GST", taxRate: 0.10 },
  GBP: { code: "GBP", name: "British Pound", symbol: "£", locale: "en-GB", taxLabel: "VAT", taxRate: 0.20 },
  EUR: { code: "EUR", name: "Euro", symbol: "€", locale: "en-DE", taxLabel: "VAT", taxRate: 0 },
  SGD: { code: "SGD", name: "Singapore Dollar", symbol: "S$", locale: "en-SG", taxLabel: "GST", taxRate: 0.09 },
  CAD: { code: "CAD", name: "Canadian Dollar", symbol: "C$", locale: "en-CA", taxLabel: "Tax", taxRate: 0 },
};

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

export const DEFAULT_CURRENCY: CurrencyCode = "INR";

export function isCurrencyCode(v: unknown): v is CurrencyCode {
  return typeof v === "string" && v in CURRENCIES;
}

/**
 * A product's price in one currency. The legacy single `price` column is INR-only, so it is a
 * fallback for INR and never shown under another currency's symbol.
 */
export function priceIn(p: { prices?: Partial<Record<CurrencyCode, number>>; price?: number | null }, code: CurrencyCode): number | null {
  return p.prices?.[code] ?? (code === "INR" ? p.price ?? null : null);
}

/** Compact axis label: lakh/crore for INR, k/M elsewhere. */
export function formatCompact(v: number, code: CurrencyCode): string {
  if (code === "INR") {
    if (v >= 10000000) return `${+(v / 10000000).toFixed(1)}Cr`;
    if (v >= 100000) return `${+(v / 100000).toFixed(1)}L`;
  } else if (v >= 1000000) return `${+(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${+(v / 1000).toFixed(0)}k`;
  return `${v}`;
}

export function formatCurrency(n: number | null | undefined, currency: CurrencyCode = "INR"): string {
  if (n == null) return "—";
  const cfg = CURRENCIES[currency];
  return cfg.symbol + n.toLocaleString(cfg.locale);
}

export function getTaxConfig(currency: CurrencyCode) {
  const cfg = CURRENCIES[currency];
  return { label: cfg.taxLabel, rate: cfg.taxRate };
}
