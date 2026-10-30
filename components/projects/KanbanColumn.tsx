"use client";

import { useDroppable } from "@dnd-kit/core";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { ProjectCard } from "./ProjectCard";
import { Num } from "@/components/ui/Num";
import { CANCELLED } from "@/lib/utils/pipeline";
import type { PipelineStage, Project, ProjectStage } from "@/types";

export function KanbanColumn({
  stage,
  color,
  custom,
  projects,
  onAddProject,
  onEditProject,
  onRenameStage,
  onDeleteStage,
}: {
  stage: ProjectStage;
  color: string;
  /** Set for user-added stages — they can be renamed and (when empty) deleted. */
  custom?: PipelineStage;
  projects: Project[];
  onAddProject: (stage: ProjectStage) => void;
  onEditProject: (project: Project) => void;
  onRenameStage: (stage: PipelineStage) => void;
  onDeleteStage: (stage: PipelineStage) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const iconBtn = "w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white transition-colors shrink-0";

  return (
    <div
      ref={setNodeRef}
      className={`group w-[260px] sm:w-72 lg:w-80 shrink-0 min-h-[400px] sm:min-h-[560px] rounded-2xl p-3 transition-colors ${
        isOver
          ? "bg-[#3A90C315] border-2 border-dashed border-brand-blue"
          : "bg-white/40 border border-white/70"
      }`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between gap-1 px-2 py-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-sm text-text-primary truncate">{stage}</span>
          <span className="text-[10px] text-text-muted bg-white rounded-full px-2 py-0.5 ml-1 shrink-0">
            <Num>{projects.length}</Num>
          </span>
        </div>
        <div className="flex items-center shrink-0">
          {custom && (
            <>
              <button onClick={() => onRenameStage(custom)} className={iconBtn} aria-label={`Rename ${stage}`} title="Rename stage">
                <Pencil size={13} />
              </button>
              <button onClick={() => onDeleteStage(custom)} className={`${iconBtn} hover:!text-danger`} aria-label={`Delete ${stage}`} title="Delete stage">
                <Trash2 size={13} />
              </button>
            </>
          )}
          {stage !== CANCELLED && (
            <button onClick={() => onAddProject(stage)} className={iconBtn} aria-label={`Add to ${stage}`} title={`Add to ${stage}`}>
              <Plus size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {projects.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-2xl py-8 text-center text-xs text-text-muted">
            Drop cards here
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
