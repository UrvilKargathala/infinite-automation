"use client";

import { useState, useMemo, useEffect } from "react";
import { Home, Building2, Hotel, Sprout, Search, Plus, Download, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { useLeadStore } from "@/lib/store/useLeadStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { useNotificationStore } from "@/lib/store/useNotificationStore";
import { INR } from "@/components/ui/INR";
import { Num } from "@/components/ui/Num";
import { IconTile } from "@/components/ui/IconTile";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";
import { AssigneeStack } from "@/components/crm/AssigneeStack";
import { KanbanBoard } from "@/components/crm/KanbanBoard";
import { LeadModal } from "@/components/crm/LeadModal";
import { CrmSkeleton } from "@/components/crm/CrmSkeleton";
import type { Lead, LeadStage, CustomerSegment } from "@/types";
import * as XLSX from "xlsx";

const segmentMeta: { segment: CustomerSegment; icon: typeof Home; bg: string; accent: string }[] = [
  { segment: "Residential", icon: Home, bg: "bg-[#3A90C318]", accent: "#3A90C3" },
  { segment: "Commercial", icon: Building2, bg: "bg-[#44BE4A18]", accent: "#44BE4A" },
  { segment: "Short Term Rentals", icon: Hotel, bg: "bg-[#8B5CF618]", accent: "#8B5CF6" },
  { segment: "Agriculture", icon: Sprout, bg: "bg-[#F59E0B18]", accent: "#F59E0B" },
];

export function CrmPageClient() {
  const { leads, add, update, remove, moveStage } = useLeadStore();
  const leadAlerts = useSettingsStore((s) => s.leadAlerts);
  const notify = useNotificationStore((s) => s.add);

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const [search, setSearch] = useState("");
  const [segFilter, setSegFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [defaultStage, setDefaultStage] = useState<LeadStage>("New");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("new") === "1") {
      setEditLead(null);
      setDefaultStage("New");
      setModalOpen(true);
      window.history.replaceState(null, "", "/crm");
    }
  }, []);

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
      toast.success("Lead updated");
    } else {
      add(data);
      toast.success("Lead added");
      if (leadAlerts) notify(`New lead: ${data.name}`, "#3A90C3");
    }
  }

  function handleExport() {
    const data = filtered.map((l, i) => ({
      "Sr. No": i + 1,
      Name: l.name,
      Company: l.company,
      Email: l.email,
      Phone: l.phone,
      Segment: l.segment,
      Stage: l.stage,
      "Value (INR)": l.value,
      "Assigned To": l.assigned,
      "Last Contact": l.lastContact,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    XLSX.writeFile(wb, "infinite_leads_export.xlsx");
    toast.success("Leads exported");
  }

  function handleDelete(id: number) {
    remove(id);
    toast.success("Lead deleted");
  }

  if (loading) return <CrmSkeleton />;

  return (
    <div>
      <h1 className="text-3xl font-semibold text-text-primary">CRM</h1>
      <p className="text-sm text-text-secondary mt-1">Lead pipeline — drag cards between stages</p>

      {/* Segment summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8 mb-6">
        {segmentMeta.map(({ segment, icon, bg, accent }) => {
          const segLeads = leads.filter((l) => l.segment === segment);
          const totalValue = segLeads.reduce((s, l) => s + l.value, 0);
          return (
            <div key={segment} className={`rounded-2xl shadow-card backdrop-blur-xl border border-white/40 p-5 flex items-center justify-between ${bg}`} style={{ borderLeft: `3px solid ${accent}` }}>
              <div>
                <div className="text-xs uppercase tracking-wider text-text-muted">{segment}</div>
                <div className="text-2xl font-light text-text-primary mt-1"><Num>{segLeads.length}</Num></div>
                <div className="text-xs text-text-secondary mt-1"><INR value={totalValue} /></div>
              </div>
              <IconTile icon={icon} />
            </div>
          );
        })}
      </div>

      {/* Kanban board wrapper card */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-card border border-white/60 p-3 sm:p-6">
        {/* Board header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-lg text-text-primary">Lead Pipeline</div>
            <div className="text-xs text-text-muted"><Num>{leads.length}</Num> leads</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openAdd("New")}
              className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-white shadow-iconBtn"
              aria-label="Add lead"
            >
              <Plus size={18} />
            </button>
            <IconButton icon={Download} ariaLabel="Export" onClick={handleExport} />
            <IconButton icon={SlidersHorizontal} ariaLabel="Filter" />
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative w-full sm:w-auto">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              className="w-full sm:w-64 bg-white border border-border rounded-lg py-2.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none transition-colors"
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
        onDelete={handleDelete}
      />
    </div>
  );
}
