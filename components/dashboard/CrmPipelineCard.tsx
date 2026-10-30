import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Num } from "@/components/ui/Num";
import { CANCELLED, stagePhase } from "@/lib/utils/pipeline";
import type { PipelineStage, Project } from "@/types";

/** One CRM card: % done (records at the last stage) and a bar per stage. Replaces "CRM progress" + "CRM by stage". */
export function CrmPipelineCard({ projects, stages }: { projects: Project[]; stages: PipelineStage[] }) {
  const live = projects.filter((p) => p.stage !== CANCELLED);
  const done = live.filter((p) => stagePhase(stages, p.stage) === "done").length;
  const pct = live.length ? Math.round((done / live.length) * 100) : 0;
  const ordered = [...stages].sort((a, b) => a.position - b.position);
  const max = Math.max(1, ...ordered.map((s) => live.filter((p) => p.stage === s.name).length));

  return (
    <div className="glass lift rounded-3xl p-4 sm:p-6 flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg text-text-primary">CRM pipeline</h2>
          <p className="text-xs text-text-muted mt-0.5"><Num>{live.length}</Num> active records, cancelled excluded</p>
        </div>
        <Link href="/crm" className="inline-flex items-center gap-1 text-xs text-brand-blue hover:underline">Open <ArrowRight size={12} /></Link>
      </div>

      <div className="mt-4 flex items-end gap-3">
        <Num className="text-4xl text-text-primary">{pct}%</Num>
        <span className="text-xs text-text-muted pb-1.5">reached {ordered.at(-1)?.name ?? "the last stage"} (<Num>{done}</Num> of <Num>{live.length}</Num>)</span>
      </div>

      <div className="mt-5 space-y-3 flex-1">
        {ordered.map((s) => {
          const count = live.filter((p) => p.stage === s.name).length;
          return (
            <div key={s.id} className="flex items-center gap-3">
              <span className="text-xs text-text-secondary w-[120px] shrink-0 truncate">{s.name}</span>
              <div className="flex-1 h-2.5 rounded-full bg-text-primary/[0.06] overflow-hidden">
                {count > 0 && <div className="h-full rounded-full" style={{ width: `${Math.max(4, (count / max) * 100)}%`, backgroundColor: s.color }} />}
              </div>
              <Num className="text-xs text-text-muted w-6 text-right shrink-0">{count}</Num>
            </div>
          );
        })}
      </div>
    </div>
  );
}
