"use client";

import { useDraggable } from "@dnd-kit/core";
import { Avatar } from "@/components/ui/Avatar";
import { INR } from "@/components/ui/INR";
import { useQuoteStore } from "@/lib/store/useQuoteStore";
import { calcQuoteTotal } from "@/lib/utils/quote";
import type { Project } from "@/types";

export function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: project.id,
    disabled: project.stage === "Cancelled",
  });
  const quote = useQuoteStore((s) => s.quotes.find((q) => q.id === project.quoteId));

  const style = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${isDragging ? 1.02 : 1})`,
        opacity: isDragging ? 0.95 : 1,
        zIndex: isDragging ? 50 : undefined,
      }
    : undefined;

  const lastChangeDate = project.lastStageChange ? project.lastStageChange.slice(0, 10) : "";

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
      className={`bg-white rounded-2xl p-4 select-none ${project.stage === "Cancelled" ? "cursor-pointer opacity-70" : "cursor-grab active:cursor-grabbing"} ${isDragging ? "shadow-drag" : "shadow-card hover:shadow-cardHover"}`}
    >
      {/* Row 1: customer name */}
      <div className="text-sm text-text-primary line-clamp-2">{project.customerName}</div>

      {/* Row 2: site address */}
      <div className="mt-1 text-xs text-text-secondary truncate">{project.siteAddress}</div>

      {/* Row 3: linked quote + last stage-change date */}
      <div className="mt-3 flex items-center justify-between gap-2">
        {quote ? (
          <span className="text-xs text-brand-blue bg-brand-gradient-tint rounded-full px-2.5 py-1 truncate">
            {quote.number} · <INR value={calcQuoteTotal(quote).grandTotal} />
          </span>
        ) : (
          <span />
        )}
        <span className="text-[10px] text-text-muted bg-[#F9FAFB] rounded-full px-2 py-0.5 shrink-0">
          {lastChangeDate}
        </span>
      </div>

      {/* Row 4: assignee */}
      <div className="mt-3 pt-3 border-t border-border flex items-center">
        <Avatar name={project.assigned} size="xs" />
        <span className="ml-2 text-xs text-text-secondary">{project.assigned}</span>
      </div>
    </div>
  );
}
