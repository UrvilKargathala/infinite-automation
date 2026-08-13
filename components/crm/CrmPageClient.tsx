"use client";

import { useState, useMemo } from "react";
import { Home, Building2, Hotel, Sprout, Search, Plus, Download, SlidersHorizontal } from "lucide-react";
import { useLeadStore } from "@/lib/store/useLeadStore";
import { formatINR } from "@/lib/utils/format";
import { IconTile } from "@/components/ui/IconTile";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";
import { AssigneeStack } from "@/components/crm/AssigneeStack";
import { KanbanBoard } from "@/components/crm/KanbanBoard";
import { LeadModal } from "@/components/crm/LeadModal";
import type { Lead, LeadStage, CustomerSegment } from "@/types";

const segmentMeta: { segment: CustomerSegment; icon: typeof Home }[] = [
  { segment: "Residential", icon: Home },
  { segment: "Commercial", icon: Building2 },
  { segment: "Short Term Rentals", icon: Hotel },
  { segment: "Agriculture", icon: Sprout },
];

export function CrmPageClient() {
  const { leads, add, update, remove, moveStage } = useLeadStore();

  const [search, setSearch] = useState("");
  const [segFilter, setSegFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [defaultStage, setDefaultStage] = useState<LeadStage>("New");

  const assignees = useMemo(() => {
    const map = new Map<string, number>();
    leads.forEach((l) => map.set(l.assigned, (map.get(l.assigned) ?? 0) + 1));
    return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
  }, [leads]);

  const filtered = useMemo(() => {
    let list = leads;
    if (assigneeFilter) list = list.filter((l) => l.assigned === assigneeFilter);
    if (segFilter) list = list.filter((l) => l.segment === segFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (l) => l.name.toLowerCase().includes(q) || l.company.toLowerCase().includes(q) || l.email.toLowerCase().includes(q)
      );
    }
    return list;
  }, [leads, assigneeFilter, segFilter, search]);

  function openAdd(stage: LeadStage) {
    setEditLead(null);
    setDefaultStage(stage);
    setModalOpen(true);
  }

  function openEdit(lead: Lead) {
    setEditLead(lead);
    setModalOpen(true);
  }

  function handleSave(data: Omit<Lead, "id">) {
    if (editLead) {
      update(editLead.id, data);
    } else {
      add(data);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-light text-text-primary">CRM</h1>
      <p className="text-sm text-text-secondary mt-1">Lead pipeline — drag cards between stages</p>

      {/* Segment summary cards */}
      <div className="grid grid-cols-4 gap-4 mt-8 mb-6">
        {segmentMeta.map(({ segment, icon }) => {
          const segLeads = leads.filter((l) => l.segment === segment);
          const totalValue = segLeads.reduce((s, l) => s + l.value, 0);
          return (
            <div key={segment} className="bg-white rounded-2xl shadow-card p-5 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-text-muted">{segment}</div>
                <div className="text-3xl font-light text-text-primary mt-1">{segLeads.length}</div>
                <div className="text-xs text-text-secondary mt-1">{formatINR(totalValue)}</div>
              </div>
              <IconTile icon={icon} />
            </div>
          );
        })}
      </div>

      {/* Kanban board wrapper card */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        {/* Board header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-lg text-text-primary">Lead Pipeline</div>
            <div className="text-xs text-text-muted">{leads.length} leads</div>
          </div>

          <AssigneeStack
            assignees={assignees}
            selected={assigneeFilter}
            onToggle={(name) => setAssigneeFilter(assigneeFilter === name ? null : name)}
          />

          <div className="flex items-center gap-2">
            <button
              onClick={() => openAdd("New")}
              className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-white shadow-iconBtn"
              aria-label="Add lead"
            >
              <Plus size={18} />
            </button>
            <IconButton icon={Download} ariaLabel="Export" />
            <IconButton icon={SlidersHorizontal} ariaLabel="Filter" />
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              className="w-64 bg-white border border-border rounded-lg py-2.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none transition-colors"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="bg-white border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary focus:border-brand-blue focus:outline-none transition-colors"
            value={segFilter}
            onChange={(e) => setSegFilter(e.target.value)}
          >
            <option value="">All segments</option>
            {segmentMeta.map(({ segment }) => (
              <option key={segment} value={segment}>{segment}</option>
            ))}
          </select>
          <div className="ml-auto">
            <Button icon={Plus} onClick={() => openAdd("New")}>New lead</Button>
          </div>
        </div>

        {/* Columns */}
        <KanbanBoard
          leads={filtered}
          onMoveStage={moveStage}
          onAddLead={openAdd}
          onEditLead={openEdit}
        />
      </div>

      <LeadModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditLead(null); }}
        lead={editLead}
        defaultStage={defaultStage}
        onSave={handleSave}
        onDelete={remove}
      />
    </div>
  );
}
