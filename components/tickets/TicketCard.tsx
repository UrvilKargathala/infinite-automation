"use client";

import { useDraggable } from "@dnd-kit/core";
import { MessageCircle } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useTicketUnread } from "@/lib/hooks/useTicketUnread";
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
  const unread = useTicketUnread()[ticket.id] ?? 0;

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
      className={`glass-tile rounded-2xl p-4 cursor-grab active:cursor-grabbing select-none transition-transform hover:-translate-y-0.5 ${isDragging ? "!shadow-drag" : ""}`}
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
        {unread > 0 && (
          <span
            className="ml-auto inline-flex items-center gap-1 rounded-full bg-brand-gradient text-white text-[11px] px-2 py-0.5 shadow-iconBtn shrink-0"
            title={`${unread} unread message${unread === 1 ? "" : "s"}`}
          >
            <MessageCircle size={11} /> <span className="font-numeric tabular-nums">{unread}</span>
          </span>
        )}
      </div>
    </div>
  );
}
