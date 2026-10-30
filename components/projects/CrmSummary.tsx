import { Briefcase, FileEdit, Truck, CheckCircle2 } from "lucide-react";
import { Num } from "@/components/ui/Num";
import { IconTile } from "@/components/ui/IconTile";
import { inMonth } from "@/lib/utils/dashboardMetrics";
import { CANCELLED, stagePhase } from "@/lib/utils/pipeline";
import type { PipelineStage, Project } from "@/types";

/**
 * CRM summary cards, grouped by where each stage sits (so custom stages count automatically):
 * pre-sale = before Confirm Order, in delivery = Confirm Order up to the last stage, done = the last stage (Install).
 */
export function CrmSummary({ projects, stages }: { projects: Project[]; stages: PipelineStage[] }) {
  const now = new Date();
  const lastStage = [...stages].sort((a, b) => a.position - b.position).at(-1)?.name ?? "Install";
  const count = (phase: ReturnType<typeof stagePhase>) => projects.filter((p) => stagePhase(stages, p.stage) === phase).length;

  const tiles = [
    { label: "Total Active", value: projects.filter((p) => p.stage !== CANCELLED).length, icon: Briefcase, bg: "bg-[#3A90C318]", accent: "#3A90C3" },
    { label: "Pre-Sale", value: count("preSale"), icon: FileEdit, bg: "bg-[#8B5CF618]", accent: "#8B5CF6" },
    { label: "In Delivery", value: count("delivery"), icon: Truck, bg: "bg-[#F59E0B18]", accent: "#F59E0B" },
    {
      label: lastStage === "Install" ? "Installed This Month" : `${lastStage} This Month`,
      value: projects.filter((p) => p.stage === lastStage && inMonth(p.lastStageChange.slice(0, 10), now.getMonth(), now.getFullYear())).length,
      icon: CheckCircle2,
      bg: "bg-[#44BE4A18]",
      accent: "#44BE4A",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8 mb-6">
      {tiles.map(({ label, value, icon, bg, accent }) => (
        <div key={label} className={`rounded-2xl shadow-card backdrop-blur-xl border border-white/40 p-5 flex items-center justify-between ${bg}`} style={{ borderLeft: `3px solid ${accent}` }}>
          <div>
            <div className="text-xs uppercase tracking-wider text-text-muted">{label}</div>
            <div className="text-2xl font-light text-text-primary mt-1"><Num>{value}</Num></div>
          </div>
          <IconTile icon={icon} />
        </div>
      ))}
    </div>
  );
}
