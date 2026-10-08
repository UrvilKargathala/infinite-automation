import Link from "next/link";
import { ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";
import { Num } from "@/components/ui/Num";

export interface Kpi {
  label: string;
  value: React.ReactNode;
  delta: string;
  up: boolean;
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
            className={`group rounded-2xl p-5 shadow-card hover:shadow-cardHover transition-shadow ${
              featured ? "bg-brand-gradient-diag text-white" : "bg-white text-text-primary"
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
            <div
              className={`inline-flex items-center gap-1 mt-4 px-2 py-0.5 rounded-md text-xs ${
                featured ? "bg-white/20 text-white" : k.up ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
              }`}
            >
              {k.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <Num>{k.delta}</Num>
              <span className={featured ? "text-white/80" : "text-text-muted"}>vs last month</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
