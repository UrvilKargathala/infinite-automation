import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Num } from "@/components/ui/Num";
import { inMonth } from "@/lib/utils/dashboardMetrics";
import { COMPLAINT_OVERDUE_DAYS, COMPLAINT_WARN_DAYS } from "@/lib/utils/complaints";
import type { Complaint } from "@/types";

const ageDays = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));

/** Pending vs completed, then the oldest pending complaints — the ones to chase first. */
export function ComplaintsCard({ complaints }: { complaints: Complaint[] }) {
  const pending = complaints.filter((c) => c.status === "Pending").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  // Cancelled complaints are withdrawn, so they count towards neither side.
  const live = complaints.filter((c) => c.status !== "Cancelled");
  const completed = live.length - pending.length;
  const now = new Date();
  const doneThisMonth = complaints.filter((c) => c.completedAt && inMonth(c.completedAt, now.getMonth(), now.getFullYear())).length;
  const pendingPct = live.length ? Math.round((pending.length / live.length) * 100) : 0;

  return (
    <div className="glass lift rounded-3xl p-4 sm:p-6 flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg text-text-primary">Complaints</h2>
          <p className="text-xs text-text-muted mt-0.5"><Num>{doneThisMonth}</Num> completed this month</p>
        </div>
        <Link href="/complaints" className="inline-flex items-center gap-1 text-xs text-brand-blue hover:underline">Open <ArrowRight size={12} /></Link>
      </div>

      <div className="mt-4">
        <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5 bg-text-primary/[0.06]">
          {pending.length > 0 && <div className="bg-warning rounded-full" style={{ width: `${pendingPct}%` }} />}
          {completed > 0 && <div className="flex-1 bg-success rounded-full" />}
        </div>
        <div className="flex items-center justify-between text-xs mt-2">
          <span className="text-warning"><Num>{pending.length}</Num> pending</span>
          <span className="text-success"><Num>{completed}</Num> completed</span>
        </div>
      </div>

      <div className="mt-4 flex-1">
        <div className="text-[11px] uppercase tracking-wider text-text-muted mb-2">Oldest pending</div>
        {pending.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-text-muted py-4"><CheckCircle2 size={16} className="text-success" /> Nothing pending</div>
        ) : (
          <div className="space-y-1">
            {pending.slice(0, 4).map((c) => {
              const age = ageDays(c.createdAt);
              return (
                <Link key={c.id} href={`/complaints?open=${c.id}`} className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-white/50 transition-colors">
                  {c.engineerName ? <Avatar name={c.engineerName} size="xs" /> : <span className="w-6 h-6 rounded-full bg-text-primary/10 shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-text-primary truncate">{c.customerName}</div>
                    <div className="text-xs text-text-muted truncate">{c.number} · {c.engineerName ?? "Unassigned"}</div>
                  </div>
                  <span className={`text-xs shrink-0 ${age >= COMPLAINT_OVERDUE_DAYS ? "text-danger" : age >= COMPLAINT_WARN_DAYS ? "text-warning" : "text-text-muted"}`}>
                    {age === 0 ? "today" : <><Num>{age}</Num>d</>}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
