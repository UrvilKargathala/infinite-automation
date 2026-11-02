"use client";

import { confirmDialog } from "@/components/ui/ConfirmDialog";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, Clock, XCircle } from "lucide-react";
import { Num } from "@/components/ui/Num";
import { useQuoteStore } from "@/lib/store/useQuoteStore";
import { daysUntil } from "@/lib/utils/dashboardMetrics";
import type { Quote } from "@/types";

/**
 * Open (Draft/Sent) quotes past or near their Valid Until date — kept apart, because they need different action:
 * expired → follow up or close as Rejected; expiring → chase before the date.
 */
export function QuoteExpiryAlerts({ quotes }: { quotes: Quote[] }) {
  const update = useQuoteStore((s) => s.update);
  const open = quotes.filter((q) => q.status === "Draft" || q.status === "Sent").map((q) => ({ q, days: daysUntil(q.validUntil) }));
  const expired = open.filter((x) => x.days < 0).sort((a, b) => a.days - b.days);
  const soon = open.filter((x) => x.days >= 0 && x.days <= 7).sort((a, b) => a.days - b.days);

  async function reject(q: Quote) {
    if (!(await confirmDialog({ title: `Mark ${q.number} as Rejected?`, message: q.client, confirmLabel: "Mark rejected", tone: "danger" }))) return;
    try {
      await update(q.id, { status: "Rejected" });
      toast.success(`${q.number} marked Rejected`);
    } catch {
      toast.error("Couldn't update the quote");
    }
  }

  const row = (q: Quote, right: React.ReactNode, color: string, Icon: typeof Clock) => (
    <div key={q.id} className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-white/50 transition-colors">
      <Icon size={16} className="shrink-0" style={{ color }} />
      <Link href="/quote" className="min-w-0 flex-1">
        <div className="text-sm text-text-primary truncate">{q.client}</div>
        <div className="text-xs text-text-muted font-numeric tabular-nums">{q.number}</div>
      </Link>
      {right}
    </div>
  );

  return (
    <div className="glass lift rounded-3xl p-4 sm:p-6">
      <h2 className="text-lg text-text-primary">Quote follow-ups</h2>
      <p className="text-xs text-text-muted mt-0.5 mb-4">Open quotes past or near their valid-until date</p>

      {expired.length === 0 && soon.length === 0 ? (
        <div className="text-center text-text-muted text-sm py-8">Nothing expired or expiring this week</div>
      ) : (
        <div className="space-y-4">
          {expired.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-danger mb-1">Expired — follow up or close</div>
              {expired.slice(0, 4).map(({ q, days }) =>
                row(q, (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-danger"><Num>{Math.abs(days)}</Num>d ago</span>
                    <button onClick={() => reject(q)} title="Mark as Rejected" aria-label={`Mark ${q.number} rejected`}
                      className="text-xs px-2 py-1 rounded-full border border-border text-text-secondary hover:text-danger hover:border-danger/40 transition-colors">
                      Reject
                    </button>
                  </div>
                ), "#EF4444", XCircle)
              )}
              {expired.length > 4 && <Link href="/quote" className="text-xs text-brand-blue hover:underline">+{expired.length - 4} more expired</Link>}
            </div>
          )}
          {soon.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-warning mb-1">Expiring this week</div>
              {soon.slice(0, 4).map(({ q, days }) =>
                row(q, <span className="text-xs text-warning shrink-0">{days === 0 ? "today" : <>in <Num>{days}</Num>d</>}</span>, days <= 2 ? "#F59E0B" : "#64748B", days <= 2 ? AlertTriangle : Clock)
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
