import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { Num } from "@/components/ui/Num";
import { StatCard } from "@/components/ui/StatCard";

export interface Kpi {
  label: string;
  icon: LucideIcon;
  value: React.ReactNode;
  /** Counts this month vs last month — shown as plain numbers, never a % (small numbers make wild %s). */
  trend: { cur: number; prev: number };
  /** What the trend counts, e.g. "raised", "new", "created". */
  trendLabel: string;
  /** Is a rise good news? More complaints raised isn't. */
  higherIsGood: boolean;
  href: string;
}

/** Dashboard KPI row: shared StatCards with a this-month vs last-month pill. */
export function KpiCards({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
      {kpis.map((k) => {
        const { cur, prev } = k.trend;
        const Icon = cur > prev ? TrendingUp : cur < prev ? TrendingDown : Minus;
        const good = cur === prev ? null : (cur > prev) === k.higherIsGood;
        // Dark text on a tinted pill (coloured text on a pale tint was too faint); only the trend icon carries the good/bad colour.
        const tone = good === null ? "bg-text-primary/10" : good ? "bg-success/20" : "bg-danger/20";
        const iconTone = good === null ? "text-text-secondary" : good ? "text-success" : "text-danger";
        return (
          <StatCard
            key={k.label}
            label={k.label}
            value={k.value}
            icon={k.icon}
            href={k.href}
            footer={
              <div className={`inline-flex items-center gap-1.5 mt-4 px-2 py-0.5 rounded-md text-xs text-text-primary transition-colors ${tone} group-hover:bg-white/20 group-hover:text-white group-focus-visible:bg-white/20 group-focus-visible:text-white`}>
                <Icon size={12} className={`${iconTone} group-hover:text-white group-focus-visible:text-white`} />
                <span><Num>{cur}</Num> {k.trendLabel} this month</span>
                <span className="text-text-secondary group-hover:text-white/80 group-focus-visible:text-white/80">· <Num>{prev}</Num> last month</span>
              </div>
            }
          />
        );
      })}
    </div>
  );
}
