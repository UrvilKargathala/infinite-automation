"use client";

import { useState, useEffect, useId } from "react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { KanbanColumn } from "./KanbanColumn";
import { CANCELLED, CANCELLED_COLOR } from "@/lib/utils/pipeline";
import type { PipelineStage, Project, ProjectStage } from "@/types";

const COLUMN = "w-[260px] sm:w-72 lg:w-80 shrink-0 min-h-[400px] sm:min-h-[560px] rounded-2xl";

export function KanbanBoard({
  projects,
  stages,
  stageFilter,
  hideEmpty,
  showCancelled,
  onMoveStage,
  onAddProject,
  onEditProject,
  onAddStage,
  onRenameStage,
  onDeleteStage,
}: {
  projects: Project[];
  /** CRM pipeline columns in order (defaults + custom). */
  stages: PipelineStage[];
  /** When set, only this stage's column is shown. */
  stageFilter: string;
  /** A team / search filter is active: hide stages that have no matching records. */
  hideEmpty: boolean;
  showCancelled: boolean;
  onMoveStage: (id: number, stage: ProjectStage) => void;
  onAddProject: (stage: ProjectStage) => void;
  onEditProject: (project: Project) => void;
  onAddStage: () => void;
  onRenameStage: (stage: PipelineStage) => void;
  onDeleteStage: (stage: PipelineStage) => void;
}) {
  const dndId = useId();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const allColumns: { name: ProjectStage; color: string; custom?: PipelineStage }[] = [
    ...stages.map((s) => ({ name: s.name, color: s.color, custom: s.isDefault ? undefined : s })),
    ...(showCancelled ? [{ name: CANCELLED, color: CANCELLED_COLOR }] : []),
  ];
  // A filter naming a stage that no longer exists (renamed/deleted) falls back to the full board.
  const byStage = stageFilter ? allColumns.filter((c) => c.name === stageFilter) : allColumns;
  const base = byStage.length > 0 ? byStage : allColumns;
  const columns = hideEmpty ? base.filter((c) => projects.some((p) => p.stage === c.name)) : base;
  const filtering = hideEmpty || Boolean(stageFilter);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const projectId = active.id as number;
    const targetStage = over.id as ProjectStage;
    if (columns.some((c) => c.name === targetStage)) {
      onMoveStage(projectId, targetStage);
    }
  }

  if (!mounted) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2 scroll-hover">
        {columns.map((c) => (
          <div key={c.name} className={`${COLUMN} p-3 bg-white/40 border border-white/70`} />
        ))}
      </div>
    );
  }

  if (columns.length === 0) {
    return <div className="glass-lane rounded-2xl py-16 text-center text-sm text-text-secondary">No records match these filters.</div>;
  }

  return (
    <DndContext id={dndId} sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-2 scroll-hover">
        {columns.map((c) => (
          <KanbanColumn
            key={c.name}
            stage={c.name}
            color={c.color}
            custom={c.custom}
            projects={projects.filter((p) => p.stage === c.name)}
            onAddProject={onAddProject}
            onEditProject={onEditProject}
            onRenameStage={onRenameStage}
            onDeleteStage={onDeleteStage}
          />
        ))}
        {!filtering && <button
          onClick={onAddStage}
          className={`w-[200px] sm:w-56 shrink-0 min-h-[400px] sm:min-h-[560px] rounded-2xl border-2 border-dashed border-white/80 bg-white/20 hover:bg-white/40 text-text-secondary hover:text-brand-blue transition-colors flex flex-col items-center justify-center gap-2`}
        >
          <span className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center">
            <Plus size={18} />
          </span>
          <span className="text-sm">Add stage</span>
          <span className="text-xs text-text-muted px-6 text-center">Add your own column to the pipeline</span>
        </button>}
      </div>
    </DndContext>
  );
}
