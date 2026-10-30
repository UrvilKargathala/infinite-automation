import Link from "next/link";
import { ArrowUpRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Num } from "@/components/ui/Num";

export interface Kpi {
  label: string;
  value: React.ReactNode;
  /** Counts this month vs last month — shown as plain numbers, never a % (small numbers make wild %s). */
  trend: { cur: number; prev: number };
  /** What the trend counts, e.g. "raised", "new", "created". */
  trendLabel: string;
  /** Is a rise good news? More complaints raised isn't. */
  higherIsGood: boolean;
  href: string;
}

/** KPI row — the first card is the featured one, filled with the brand gradient. */
export function KpiCards({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
      {kpis.map((k, i) => {
        const featured = i === 0;
        return (
          <Link
            key={k.label}
            href={k.href}
            className={`group lift rounded-3xl p-5 ${
              featured ? "bg-brand-gradient-diag text-white shadow-card" : "glass text-text-primary"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-base">{k.label}</span>
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:rotate-45 ${
                  featured ? "bg-white text-brand-blue" : "border border-border text-text-primary"
                }`}
              >
                <ArrowUpRight size={16} />
              </span>
            </div>
            <div className="text-4xl mt-3">{k.value}</div>
            {(() => {
              const { cur, prev } = k.trend;
              const Icon = cur > prev ? TrendingUp : cur < prev ? TrendingDown : Minus;
              const good = cur === prev ? null : (cur > prev) === k.higherIsGood;
              const tone = featured ? "bg-white/20 text-white" : good === null ? "bg-text-primary/[0.06] text-text-secondary" : good ? "bg-success/10 text-success" : "bg-danger/10 text-danger";
              return (
                <div className={`inline-flex items-center gap-1.5 mt-4 px-2 py-0.5 rounded-md text-xs ${tone}`}>
                  <Icon size={12} />
                  <span><Num>{cur}</Num> {k.trendLabel} this month</span>
                  <span className={featured ? "text-white/70" : "text-text-muted"}>· <Num>{prev}</Num> last month</span>
                </div>
              );
            })()}
          </Link>
        );
      })}
    </div>
  );
}
