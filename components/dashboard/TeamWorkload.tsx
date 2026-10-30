import { Avatar } from "@/components/ui/Avatar";
import { Num } from "@/components/ui/Num";
import { inMonth, } from "@/lib/utils/dashboardMetrics";
import { stagePhase } from "@/lib/utils/pipeline";
import type { Complaint, PipelineStage, Project, User } from "@/types";

/** Per person: open CRM records they're assigned + pending complaints, with complaints completed this month. Busiest first. */
export function TeamWorkload({ users, projects, complaints, stages }: { users: User[]; projects: Project[]; complaints: Complaint[]; stages: PipelineStage[] }) {
  const now = new Date();
  const rows = users
    .filter((u) => u.status === "Active")
    .map((u) => {
      const name = u.fullName.trim().toLowerCase();
      const records = projects.filter((p) => p.assigned.trim().toLowerCase() === name && !["done", "cancelled"].includes(stagePhase(stages, p.stage))).length;
      const pending = complaints.filter((c) => c.engineerId === u.id && c.status === "Pending").length;
      const done = complaints.filter((c) => c.engineerId === u.id && c.completedAt && inMonth(c.completedAt, now.getMonth(), now.getFullYear())).length;
      return { user: u, records, pending, done, load: records + pending };
    })
    .filter((r) => r.load > 0 || r.done > 0)
    .sort((a, b) => b.load - a.load);
  const max = Math.max(1, ...rows.map((r) => r.load));

  return (
    <div className="glass lift rounded-3xl p-4 sm:p-6">
      <h2 className="text-lg text-text-primary">Team workload</h2>
      <p className="text-xs text-text-muted mt-0.5 mb-4">Open CRM records + pending complaints per person</p>
      {rows.length === 0 ? (
        <div className="text-center text-text-muted text-sm py-8">Nobody has open work assigned</div>
      ) : (
        <div className="space-y-3.5">
          {rows.map(({ user, records, pending, done, load }) => (
            <div key={user.id} className="flex items-center gap-3">
              <Avatar name={user.fullName} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-text-primary truncate">{user.fullName}</span>
                  <span className="text-xs text-text-muted shrink-0">
                    <Num>{records}</Num> CRM · <Num>{pending}</Num> complaint{pending === 1 ? "" : "s"}{done > 0 && <> · <span className="text-success"><Num>{done}</Num> done</span></>}
                  </span>
                </div>
                <div className="flex h-1.5 rounded-full bg-text-primary/[0.06] overflow-hidden mt-1.5" style={{ width: `${Math.max(8, (load / max) * 100)}%` }}>
                  {records > 0 && <div className="bg-brand-blue" style={{ width: `${(records / Math.max(1, load)) * 100}%` }} />}
                  {pending > 0 && <div className="flex-1 bg-warning" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
