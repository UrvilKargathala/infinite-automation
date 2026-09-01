"use client";

import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { TicketCard } from "./TicketCard";
import { Num } from "@/components/ui/Num";
import type { Ticket, TicketStatus } from "@/types";

const statusColors: Record<TicketStatus, string> = {
  Open: "#3B82F6",
  "In Progress": "#F59E0B",
  "On Hold": "#8B5CF6",
  Resolved: "#10B981",
  Closed: "#64748B",
};

export function KanbanColumn({
  status,
  tickets,
  onAddTicket,
  onEditTicket,
}: {
  status: TicketStatus;
  tickets: Ticket[];
  onAddTicket: (status: TicketStatus) => void;
  onEditTicket: (ticket: Ticket) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const color = statusColors[status];

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
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-sm text-text-primary">{status}</span>
          <span className="text-[10px] text-text-muted bg-white rounded-full px-2 py-0.5 ml-1">
            <Num>{tickets.length}</Num>
          </span>
        </div>
        <button
          onClick={() => onAddTicket(status)}
          className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white transition-colors"
          aria-label={`Add ticket to ${status}`}
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {tickets.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-2xl py-8 text-center text-xs text-text-muted">
            Drop tickets here
          </div>
        ) : (
          tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} onClick={() => onEditTicket(ticket)} />
          ))
        )}
      </div>
    </div>
  );
}
