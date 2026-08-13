"use client";

import { useState, useEffect, useId } from "react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { KanbanColumn } from "./KanbanColumn";
import type { Lead, LeadStage } from "@/types";

const stages: LeadStage[] = ["New", "Qualified", "Quoted", "Won", "Lost"];

export function KanbanBoard({
  leads,
  onMoveStage,
  onAddLead,
  onEditLead,
}: {
  leads: Lead[];
  onMoveStage: (id: number, stage: LeadStage) => void;
  onAddLead: (stage: LeadStage) => void;
  onEditLead: (lead: Lead) => void;
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
    const leadId = active.id as number;
    const targetStage = over.id as LeadStage;
    if (stages.includes(targetStage)) {
      onMoveStage(leadId, targetStage);
    }
  }

  if (!mounted) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {stages.map((stage) => (
          <div key={stage} className="w-80 shrink-0 min-h-[560px] rounded-2xl p-3 bg-surface-alt" />
        ))}
      </div>
    );
  }

  return (
    <DndContext id={dndId} sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            leads={leads.filter((l) => l.stage === stage)}
            onAddLead={onAddLead}
            onEditLead={onEditLead}
          />
        ))}
      </div>
    </DndContext>
  );
}
