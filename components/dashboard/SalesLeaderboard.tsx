import { Avatar } from "@/components/ui/Avatar";
import { INR } from "@/components/ui/INR";
import { Num } from "@/components/ui/Num";
import type { Lead } from "@/types";

export function SalesLeaderboard({ leads }: { leads: Lead[] }) {
  const byRep = new Map<string, { count: number; value: number; won: number }>();
  leads.forEach((l) => {
    const entry = byRep.get(l.assigned) ?? { count: 0, value: 0, won: 0 };
    entry.count += 1;
    entry.value += l.value;
    if (l.stage === "Won") entry.won += 1;
    byRep.set(l.assigned, entry);
  });
  const ranked = [...byRep.entries()]
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.value - a.value);
  const maxValue = ranked[0]?.value ?? 1;

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-card border border-white/60 p-4 sm:p-6">
      <h2 className="text-lg text-text-primary mb-4">Sales rep leaderboard</h2>
      {ranked.length === 0 ? (
        <div className="text-center text-text-muted text-sm py-8">No leads assigned yet</div>
      ) : (
        <div className="space-y-4">
          {ranked.map((rep, i) => (
            <div key={rep.name} className="flex items-center gap-3">
              <span className="text-xs text-text-muted w-4 shrink-0"><Num>{i + 1}</Num></span>
              <Avatar name={rep.name} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-text-primary truncate">{rep.name}</span>
                  <INR value={rep.value} className="text-xs text-text-secondary shrink-0" />
                </div>
                <div className="h-1.5 rounded-full bg-surface-alt mt-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand-gradient"
                    style={{ width: `${Math.max(6, (rep.value / maxValue) * 100)}%` }}
                  />
                </div>
                <div className="text-xs text-text-muted mt-1">
                  <Num>{rep.count}</Num> leads · <Num>{rep.won}</Num> won
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
