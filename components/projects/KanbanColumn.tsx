"use client";

import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { ProjectCard } from "./ProjectCard";
import { Num } from "@/components/ui/Num";
import type { Project, ProjectStage } from "@/types";

const stageColors: Record<ProjectStage, string> = {
  Inquiry: "#3B82F6",
  Design: "#8B5CF6",
  Quotation: "#F59E0B",
  Measurement: "#06B6D4",
  Marking: "#0EA5E9",
  Production: "#EAB308",
  "Material Requirement": "#F97316",
  "Ready to Dispatch": "#14B8A6",
  Installation: "#22C55E",
  Completed: "#10B981",
  Cancelled: "#EF4444",
};

export function KanbanColumn({
  stage,
  projects,
  onAddProject,
  onEditProject,
}: {
  stage: ProjectStage;
  projects: Project[];
  onAddProject: (stage: ProjectStage) => void;
  onEditProject: (project: Project) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const color = stageColors[stage];

  return (
    <div
      ref={setNodeRef}
      className={`w-[260px] sm:w-72 lg:w-80 shrink-0 min-h-[400px] sm:min-h-[560px] rounded-2xl p-3 transition-colors ${
        isOver
          ? "bg-[#3A90C315] border-2 border-dashed border-brand-blue"
          : "bg-surface-alt"
      }`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-2 py-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-sm text-text-primary">{stage}</span>
          <span className="text-[10px] text-text-muted bg-white rounded-full px-2 py-0.5 ml-1">
            <Num>{projects.length}</Num>
          </span>
        </div>
        {stage !== "Cancelled" && (
          <button
            onClick={() => onAddProject(stage)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white transition-colors shrink-0"
            aria-label={`Add project to ${stage}`}
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {projects.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-2xl py-8 text-center text-xs text-text-muted">
            Drop projects here
          </div>
        ) : (
          projects.map((project) => (
            <ProjectCard key={project.id} project={project} onClick={() => onEditProject(project)} />
          ))
        )}
      </div>
    </div>
  );
}
