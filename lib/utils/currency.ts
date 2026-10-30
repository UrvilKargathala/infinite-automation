/** Multi-currency config and formatting */

export type CurrencyCode = "INR" | "AED" | "USD" | "AUD" | "GBP" | "EUR" | "SGD" | "CAD";

export interface CurrencyConfig {
  code: CurrencyCode;
  name: string;
  symbol: string;
  locale: string;
  taxLabel: string;
  taxRate: number; // e.g. 0.18 = 18%
  /** IANA zone for the header clock — the user's currency stands in for where they work. */
  timeZone: string;
  city: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  INR: { code: "INR", name: "Indian Rupee", symbol: "₹", locale: "en-IN", taxLabel: "GST", taxRate: 0.18, timeZone: "Asia/Kolkata", city: "India" },
  AED: { code: "AED", name: "UAE Dirham", symbol: "د.إ", locale: "en-AE", taxLabel: "VAT", taxRate: 0.05, timeZone: "Asia/Dubai", city: "Dubai" },
  USD: { code: "USD", name: "US Dollar", symbol: "$", locale: "en-US", taxLabel: "Tax", taxRate: 0, timeZone: "America/New_York", city: "New York" },
  AUD: { code: "AUD", name: "Australian Dollar", symbol: "A$", locale: "en-AU", taxLabel: "GST", taxRate: 0.10, timeZone: "Australia/Melbourne", city: "Melbourne" },
  GBP: { code: "GBP", name: "British Pound", symbol: "£", locale: "en-GB", taxLabel: "VAT", taxRate: 0.20, timeZone: "Europe/London", city: "London" },
  EUR: { code: "EUR", name: "Euro", symbol: "€", locale: "en-DE", taxLabel: "VAT", taxRate: 0, timeZone: "Europe/Berlin", city: "Berlin" },
  SGD: { code: "SGD", name: "Singapore Dollar", symbol: "S$", locale: "en-SG", taxLabel: "GST", taxRate: 0.09, timeZone: "Asia/Singapore", city: "Singapore" },
  CAD: { code: "CAD", name: "Canadian Dollar", symbol: "C$", locale: "en-CA", taxLabel: "Tax", taxRate: 0, timeZone: "America/Toronto", city: "Toronto" },
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
