"use client";

import { useState, useEffect, useId } from "react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { KanbanColumn } from "./KanbanColumn";
import type { Project, ProjectStage } from "@/types";

export const PIPELINE_STAGES: ProjectStage[] = [
  "Inquiry", "Design", "Quotation", "Measurement", "Marking",
  "Production", "Material Requirement", "Ready to Dispatch", "Installation", "Completed",
];

export function KanbanBoard({
  projects,
  stages,
  onMoveStage,
  onAddProject,
  onEditProject,
}: {
  projects: Project[];
  stages: ProjectStage[];
  onMoveStage: (id: number, stage: ProjectStage) => void;
  onAddProject: (stage: ProjectStage) => void;
  onEditProject: (project: Project) => void;
}) {
  const dndId = useId();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const projectId = active.id as number;
    const targetStage = over.id as ProjectStage;
    if (stages.includes(targetStage)) {
      onMoveStage(projectId, targetStage);
    }
  }

  if (!mounted) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2 scroll-hover">
        {stages.map((stage) => (
          <div key={stage} className="w-[260px] sm:w-72 lg:w-80 shrink-0 min-h-[400px] sm:min-h-[560px] rounded-2xl p-3 bg-surface-alt" />
        ))}
      </div>
    );
  }

  return (
    <DndContext id={dndId} sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-2 scroll-hover">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            projects={projects.filter((p) => p.stage === stage)}
            onAddProject={onAddProject}
            onEditProject={onEditProject}
          />
        ))}
      </div>
    </DndContext>
  );
}
