import { Briefcase, FileEdit, Truck, CheckCircle2 } from "lucide-react";
import { inMonth } from "@/lib/utils/dashboardMetrics";
import { CANCELLED, stagePhase } from "@/lib/utils/pipeline";
import type { PipelineStage, Project } from "@/types";
import { StatCard } from "@/components/ui/StatCard";

/**
 * CRM summary cards, grouped by where each stage sits (so custom stages count automatically):
 * pre-sale = Inquiry and everything before Confirm Order, in delivery = Confirm Order up to just before Install,
 * done = Install and any stage after it. Every active record is in exactly one of pre-sale / in delivery / done.
 */
export function CrmSummary({ projects, stages }: { projects: Project[]; stages: PipelineStage[] }) {
  const now = new Date();
  const count = (phase: ReturnType<typeof stagePhase>) => projects.filter((p) => stagePhase(stages, p.stage) === phase).length;

  const tiles = [
    { label: "Total Active", value: projects.filter((p) => p.stage !== CANCELLED).length, icon: Briefcase },
    { label: "Pre-Sale", value: count("inquiry") + count("preSale"), icon: FileEdit },
    { label: "In Delivery", value: count("delivery"), icon: Truck },
    {
      label: "Installed This Month",
      value: projects.filter((p) => stagePhase(stages, p.stage) === "done" && inMonth(p.lastStageChange.slice(0, 10), now.getMonth(), now.getFullYear())).length,
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8 mb-6">
      {tiles.map(({ label, value, icon }) => (
        <StatCard key={label} label={label} value={value} icon={icon} />
      ))}
    </div>
  );
}
