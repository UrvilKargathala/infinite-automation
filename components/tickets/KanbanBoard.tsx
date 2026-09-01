"use client";

import { useState, useEffect, useId } from "react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { KanbanColumn } from "./KanbanColumn";
import type { Ticket, TicketStatus } from "@/types";

const statuses: TicketStatus[] = ["Open", "In Progress", "On Hold", "Resolved", "Closed"];

export function KanbanBoard({
  tickets,
  onMoveStatus,
  onAddTicket,
  onEditTicket,
}: {
  tickets: Ticket[];
  onMoveStatus: (id: number, status: TicketStatus) => void;
  onAddTicket: (status: TicketStatus) => void;
  onEditTicket: (ticket: Ticket) => void;
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
    const ticketId = active.id as number;
    const targetStatus = over.id as TicketStatus;
    if (statuses.includes(targetStatus)) {
      onMoveStatus(ticketId, targetStatus);
    }
  }

  if (!mounted) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2 scroll-hover">
        {statuses.map((status) => (
          <div key={status} className="w-[260px] sm:w-72 lg:w-80 shrink-0 min-h-[400px] sm:min-h-[560px] rounded-2xl p-3 bg-surface-alt" />
        ))}
      </div>
    );
  }

  return (
    <DndContext id={dndId} sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-2 scroll-hover">
        {statuses.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tickets={tickets.filter((t) => t.status === status)}
            onAddTicket={onAddTicket}
            onEditTicket={onEditTicket}
          />
        ))}
      </div>
    </DndContext>
  );
}
