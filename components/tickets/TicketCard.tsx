"use client";

import { useDraggable } from "@dnd-kit/core";
import { Avatar } from "@/components/ui/Avatar";
import type { Ticket, TicketPriority } from "@/types";

const priorityColors: Record<TicketPriority, string> = {
  Low: "#64748B",
  Medium: "#3A90C3",
  High: "#F59E0B",
  Urgent: "#EF4444",
};

export function TicketCard({ ticket, onClick }: { ticket: Ticket; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
  });

  const style = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${isDragging ? 1.02 : 1})`,
        opacity: isDragging ? 0.95 : 1,
        zIndex: isDragging ? 50 : undefined,
      }
    : undefined;

  const priorityColor = priorityColors[ticket.priority];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (!isDragging) {
          e.stopPropagation();
          onClick();
        }
      }}
      className={`bg-white rounded-2xl p-4 cursor-grab active:cursor-grabbing select-none ${isDragging ? "shadow-drag" : "shadow-card hover:shadow-cardHover"}`}
    >
      {/* Row 1: subject + priority badge */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm text-text-primary line-clamp-2">{ticket.subject}</span>
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs shrink-0"
          style={{ backgroundColor: priorityColor + "18", color: priorityColor }}
        >
          {ticket.priority}
        </span>
      </div>

      {/* Row 2: contact + company */}
      <div className="mt-1 text-xs text-text-secondary truncate">{ticket.name} · {ticket.company}</div>

      {/* Row 3: category + date */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-text-secondary bg-surface-alt rounded-full px-2.5 py-1">{ticket.category}</span>
        <span className="text-[10px] text-text-muted bg-[#F9FAFB] rounded-full px-2 py-0.5">
          {ticket.lastContact}
        </span>
      </div>

      {/* Row 4: assignee */}
      <div className="mt-3 pt-3 border-t border-border flex items-center">
        <Avatar name={ticket.assigned} size="xs" />
        <span className="ml-2 text-xs text-text-secondary">{ticket.assigned}</span>
      </div>
    </div>
  );
}
