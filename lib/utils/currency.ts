/** Multi-currency config and formatting */

export type CurrencyCode = "INR" | "AED" | "USD" | "AUD" | "GBP" | "EUR" | "SGD" | "CAD";

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  locale: string;
  taxLabel: string;
  taxRate: number; // e.g. 0.18 = 18%
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  INR: { code: "INR", symbol: "₹", locale: "en-IN", taxLabel: "GST", taxRate: 0.18 },
  AED: { code: "AED", symbol: "د.إ", locale: "en-AE", taxLabel: "VAT", taxRate: 0.05 },
  USD: { code: "USD", symbol: "$", locale: "en-US", taxLabel: "Tax", taxRate: 0 },
  AUD: { code: "AUD", symbol: "A$", locale: "en-AU", taxLabel: "GST", taxRate: 0.10 },
  GBP: { code: "GBP", symbol: "£", locale: "en-GB", taxLabel: "VAT", taxRate: 0.20 },
  EUR: { code: "EUR", symbol: "€", locale: "en-DE", taxLabel: "VAT", taxRate: 0 },
  SGD: { code: "SGD", symbol: "S$", locale: "en-SG", taxLabel: "GST", taxRate: 0.09 },
  CAD: { code: "CAD", symbol: "C$", locale: "en-CA", taxLabel: "Tax", taxRate: 0 },
};

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

export const DEFAULT_CURRENCY: CurrencyCode = "INR";

export function formatCurrency(n: number | null | undefined, currency: CurrencyCode = "INR"): string {
  if (n == null) return "—";
  const cfg = CURRENCIES[currency];
  return cfg.symbol + n.toLocaleString(cfg.locale);
}

export function getTaxConfig(currency: CurrencyCode) {
  const cfg = CURRENCIES[currency];
  return { label: cfg.taxLabel, rate: cfg.taxRate };
}
