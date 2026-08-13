import { formatINR } from "@/lib/utils/format";

export function INR({ value, className = "" }: { value: number | null | undefined; className?: string }) {
  if (value == null) return <span className="text-text-secondary">—</span>;
  return <span className={`font-numeric font-medium tabular-nums ${className}`}>{formatINR(value)}</span>;
}
