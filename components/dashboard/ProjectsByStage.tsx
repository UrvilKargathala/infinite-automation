import { Num } from "@/components/ui/Num";
import { PIPELINE_STAGES } from "@/components/projects/KanbanBoard";
import type { Project } from "@/types";

const stageColors: Record<string, string> = {
  Inquiry: "#3B82F6", Design: "#8B5CF6", Quotation: "#F59E0B", Measurement: "#06B6D4",
  Marking: "#0EA5E9", Production: "#EAB308", "Material Requirement": "#F97316",
  "Ready to Dispatch": "#14B8A6", Installation: "#22C55E", Completed: "#10B981",
};

export function ProjectsByStage({ projects }: { projects: Project[] }) {
  const counts = PIPELINE_STAGES.map((stage) => ({
    stage,
    count: projects.filter((p) => p.stage === stage).length,
  }));
  const maxCount = Math.max(1, ...counts.map((c) => c.count));

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-card border border-white/60 p-4 sm:p-6">
      <h2 className="text-lg text-text-primary mb-4">Projects by stage</h2>
      {projects.length === 0 ? (
        <div className="text-center text-text-muted text-sm py-8">No projects yet</div>
      ) : (
        <div className="space-y-3">
          {counts.map(({ stage, count }) => (
            <div key={stage} className="flex items-center gap-3">
              <span className="text-xs text-text-secondary w-[130px] shrink-0 truncate">{stage}</span>
              <div className="flex-1 h-1.5 rounded-full bg-surface-alt overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(count > 0 ? 4 : 0, (count / maxCount) * 100)}%`, backgroundColor: stageColors[stage] }}
                />
              </div>
              <Num className="text-xs text-text-muted w-4 text-right shrink-0">{count}</Num>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
