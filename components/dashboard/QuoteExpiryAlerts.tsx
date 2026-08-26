import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Num } from "@/components/ui/Num";
import type { Quote } from "@/types";

function daysUntil(dateStr: string): number {
  const ms = new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.round(ms / 86400000);
}

export function QuoteExpiryAlerts({ quotes }: { quotes: Quote[] }) {
  const upcoming = quotes
    .filter((q) => q.status === "Draft" || q.status === "Sent")
    .map((q) => ({ quote: q, daysLeft: daysUntil(q.validUntil) }))
    .filter((q) => q.daysLeft <= 7)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-card border border-white/60 p-4 sm:p-6">
      <h2 className="text-lg text-text-primary mb-4">Quote expiry alerts</h2>
      {upcoming.length === 0 ? (
        <div className="text-center text-text-muted text-sm py-8">No quotes expiring soon</div>
      ) : (
        <div className="space-y-3">
          {upcoming.map(({ quote, daysLeft }) => {
            const overdue = daysLeft < 0;
            const color = overdue ? "#EF4444" : daysLeft <= 2 ? "#F59E0B" : "#64748B";
            return (
              <Link
                key={quote.id}
                href="/quote"
                className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-[#F9FAFB] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <AlertTriangle size={16} className="shrink-0" style={{ color }} />
                  <div className="min-w-0">
                    <div className="text-sm text-text-primary truncate">{quote.client}</div>
                    <div className="text-xs text-text-muted font-mono">{quote.number}</div>
                  </div>
                </div>
                <div className="text-xs font-normal shrink-0" style={{ color }}>
                  {overdue ? <><Num>{Math.abs(daysLeft)}</Num>d overdue</> : daysLeft === 0 ? "Due today" : <><Num>{daysLeft}</Num>d left</>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
