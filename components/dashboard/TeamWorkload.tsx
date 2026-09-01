import { Avatar } from "@/components/ui/Avatar";
import { Num } from "@/components/ui/Num";
import type { Ticket } from "@/types";

export function TeamWorkload({ tickets }: { tickets: Ticket[] }) {
  const byRep = new Map<string, { count: number; resolved: number }>();
  tickets.forEach((t) => {
    const entry = byRep.get(t.assigned) ?? { count: 0, resolved: 0 };
    entry.count += 1;
    if (t.status === "Resolved" || t.status === "Closed") entry.resolved += 1;
    byRep.set(t.assigned, entry);
  });
  const ranked = [...byRep.entries()]
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.count - a.count);
  const maxCount = ranked[0]?.count ?? 1;

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-card border border-white/60 p-4 sm:p-6">
      <h2 className="text-lg text-text-primary mb-4">Team workload</h2>
      {ranked.length === 0 ? (
        <div className="text-center text-text-muted text-sm py-8">No tickets assigned yet</div>
      ) : (
        <div className="space-y-4">
          {ranked.map((rep, i) => (
            <div key={rep.name} className="flex items-center gap-3">
              <span className="text-xs text-text-muted w-4 shrink-0"><Num>{i + 1}</Num></span>
              <Avatar name={rep.name} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-text-primary truncate">{rep.name}</span>
                  <span className="text-xs text-text-secondary shrink-0"><Num>{rep.count}</Num> tickets</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-alt mt-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand-gradient"
                    style={{ width: `${Math.max(6, (rep.count / maxCount) * 100)}%` }}
                  />
                </div>
                <div className="text-xs text-text-muted mt-1">
                  <Num>{rep.resolved}</Num> resolved
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
