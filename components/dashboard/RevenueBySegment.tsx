import { Price } from "@/components/ui/Price";
import type { CustomerSegment } from "@/types";

const segmentColors: Record<CustomerSegment, string> = {
  Residential: "#3A90C3",
  Hospitality: "#8B5CF6",
  "Government / Council": "#64748B",
  Retail: "#F59E0B",
  "Healthcare / Aged Care": "#EF4444",
  Industrial: "#44BE4A",
};

export function RevenueBySegment({ data }: { data: { segment: CustomerSegment; revenue: number }[] }) {
  const total = data.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-card border border-white/60 p-4 sm:p-6">
      <h2 className="text-lg text-text-primary mb-4">Revenue by segment</h2>
      {data.length === 0 ? (
        <div className="text-center text-text-muted text-sm py-8">No accepted quotes linked to a customer yet</div>
      ) : (
        <div className="space-y-4">
          {data.map(({ segment, revenue }) => {
            const pct = total > 0 ? Math.round((revenue / total) * 100) : 0;
            return (
              <div key={segment} className="flex items-center gap-3">
                <span className="text-xs text-text-secondary w-[150px] shrink-0 truncate">{segment}</span>
                <div className="flex-1 h-2.5 rounded-full bg-surface-alt overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.max(2, pct)}%`, backgroundColor: segmentColors[segment] }}
                  />
                </div>
                <span className="text-xs text-text-muted w-24 text-right shrink-0">
                  <Price value={revenue} currency="INR" className="text-xs" />
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
