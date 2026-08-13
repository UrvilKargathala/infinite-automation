"use client";

import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { LeadCard } from "./LeadCard";
import type { Lead, LeadStage } from "@/types";

const stageColors: Record<LeadStage, string> = {
  New: "#3B82F6",
  Qualified: "#F59E0B",
  Quoted: "#8B5CF6",
  Won: "#10B981",
  Lost: "#EF4444",
};

export function KanbanColumn({
  stage,
  leads,
  onAddLead,
  onEditLead,
}: {
  stage: LeadStage;
  leads: Lead[];
  onAddLead: (stage: LeadStage) => void;
  onEditLead: (lead: Lead) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const color = stageColors[stage];

  return (
    <div
      ref={setNodeRef}
      className={`w-80 shrink-0 min-h-[560px] rounded-2xl p-3 transition-colors ${
        isOver
          ? "bg-[#3A90C315] border-2 border-dashed border-brand-blue"
          : "bg-surface-alt"
      }`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-2 py-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-sm text-text-primary">{stage}</span>
          <span className="text-[10px] text-text-muted bg-white rounded-full px-2 py-0.5 ml-1">
            {leads.length}
          </span>
        </div>
        <button
          onClick={() => onAddLead(stage)}
          className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white transition-colors"
          aria-label={`Add lead to ${stage}`}
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {leads.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-2xl py-8 text-center text-xs text-text-muted">
            Drop leads here
          </div>
        ) : (
          leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onClick={() => onEditLead(lead)} />
          ))
        )}
      </div>
    </div>
  );
}
