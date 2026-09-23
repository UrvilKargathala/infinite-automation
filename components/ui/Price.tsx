import { formatCurrency, type CurrencyCode } from "@/lib/utils/currency";

export function Price({ value, currency = "INR", className = "" }: { value: number | null | undefined; currency?: CurrencyCode; className?: string }) {
  if (value == null) return <span className="text-text-secondary">—</span>;
  return <span className={`font-numeric font-medium tabular-nums ${className}`}>{formatCurrency(value, currency)}</span>;
}
