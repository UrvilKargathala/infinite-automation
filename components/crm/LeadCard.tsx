"use client";

import { useDraggable } from "@dnd-kit/core";
import { Avatar } from "@/components/ui/Avatar";
import { INR } from "@/components/ui/INR";
import type { Lead, CustomerSegment } from "@/types";

const segmentColors: Record<CustomerSegment, string> = {
  Residential: "#3A90C3",
  Commercial: "#8B5CF6",
  "Short Term Rentals": "#F59E0B",
  Agriculture: "#10B981",
};

export function LeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });

  const style = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${isDragging ? 1.02 : 1})`,
        opacity: isDragging ? 0.95 : 1,
        zIndex: isDragging ? 50 : undefined,
      }
    : undefined;

  const segColor = segmentColors[lead.segment];

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
      {/* Row 1: name + segment badge */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm text-text-primary">{lead.name}</span>
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs shrink-0"
          style={{ backgroundColor: segColor + "18", color: segColor }}
        >
          {lead.segment}
        </span>
      </div>

      {/* Row 2: company */}
      <div className="mt-1 text-xs text-text-secondary">{lead.company}</div>

      {/* Row 3: value + date */}
      <div className="mt-3 flex items-center justify-between">
        <INR value={lead.value} className="text-sm text-text-primary" />
        <span className="text-[10px] text-text-muted bg-[#F9FAFB] rounded-full px-2 py-0.5">
          {lead.lastContact}
        </span>
      </div>

      {/* Row 4: assignee */}
      <div className="mt-3 pt-3 border-t border-border flex items-center">
        <Avatar name={lead.assigned} size="xs" />
        <span className="ml-2 text-xs text-text-secondary">{lead.assigned}</span>
      </div>
    </div>
  );
}
