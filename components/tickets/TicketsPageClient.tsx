"use client";

import { useState, useMemo, useEffect } from "react";
import { ArrowDown, Minus, ArrowUp, AlertTriangle, Search, Plus, Download, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { useTicketStore } from "@/lib/store/useTicketStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { useNotificationStore } from "@/lib/store/useNotificationStore";
import { Num } from "@/components/ui/Num";
import { IconTile } from "@/components/ui/IconTile";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";
import { AssigneeStack } from "@/components/tickets/AssigneeStack";
import { KanbanBoard } from "@/components/tickets/KanbanBoard";
import { TicketModal } from "@/components/tickets/TicketModal";
import { TicketPanel } from "@/components/tickets/TicketPanel";
import { TicketsSkeleton } from "@/components/tickets/TicketsSkeleton";
import type { Ticket, TicketStatus, TicketPriority } from "@/types";
import * as XLSX from "xlsx";

const priorityMeta: { priority: TicketPriority; icon: typeof ArrowDown; bg: string; accent: string }[] = [
  { priority: "Low", icon: ArrowDown, bg: "bg-[#64748B18]", accent: "#64748B" },
  { priority: "Medium", icon: Minus, bg: "bg-[#3A90C318]", accent: "#3A90C3" },
  { priority: "High", icon: ArrowUp, bg: "bg-[#F59E0B18]", accent: "#F59E0B" },
  { priority: "Urgent", icon: AlertTriangle, bg: "bg-[#EF444418]", accent: "#EF4444" },
];

const statuses: TicketStatus[] = ["Open", "In Progress", "On Hold", "Resolved", "Closed"];

export function TicketsPageClient() {
  const { tickets, add, update, remove, updateStatus, loaded } = useTicketStore();
  const ticketAlerts = useSettingsStore((s) => s.ticketAlerts);
  const notify = useNotificationStore((s) => s.add);

  const loading = !loaded;
  const [filterOpen, setFilterOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<TicketStatus>("Open");
  const [panelTicket, setPanelTicket] = useState<Ticket | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("new") === "1") {
      setDefaultStatus("Open");
      setModalOpen(true);
      window.history.replaceState(null, "", "/tickets");
    }
  }, []);

  const assignees = useMemo(() => {
    const map = new Map<string, number>();
    tickets.forEach((t) => map.set(t.assigned, (map.get(t.assigned) ?? 0) + 1));
    return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
  }, [tickets]);

  const filtered = useMemo(() => {
    let list = tickets;
    if (assigneeFilter) list = list.filter((t) => t.assigned === assigneeFilter);
    if (statusFilter) list = list.filter((t) => t.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) => t.subject.toLowerCase().includes(q) || t.name.toLowerCase().includes(q) || t.company.toLowerCase().includes(q) || t.email.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tickets, assigneeFilter, statusFilter, search]);

  function openAdd(status: TicketStatus) {
    setDefaultStatus(status);
    setModalOpen(true);
  }

  function openEdit(ticket: Ticket) {
    setPanelTicket(ticket);
    setPanelOpen(true);
  }

  function handleCreate(data: Omit<Ticket, "id">) {
    add(data);
    toast.success("Ticket added");
    if (ticketAlerts) notify(`New ticket: ${data.subject}`, "#3A90C3");
  }

  function handlePanelSave(id: number, patch: Partial<Omit<Ticket, "id">>) {
    update(id, patch);
    setPanelTicket((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
    toast.success("Ticket updated");
  }

  function handleExport() {
    const data = filtered.map((t, i) => ({
      "Sr. No": i + 1,
      Subject: t.subject,
      Name: t.name,
      Company: t.company,
      Email: t.email,
      Phone: t.phone,
      Category: t.category,
      Priority: t.priority,
      Status: t.status,
      "Assigned To": t.assigned,
      "Last Contact": t.lastContact,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tickets");
    XLSX.writeFile(wb, "infinite_tickets_export.xlsx");
    toast.success("Tickets exported");
  }

  function handleDelete(id: number) {
    remove(id);
    toast.success("Ticket deleted");
  }

  if (loading) return <TicketsSkeleton />;

  return (
    <div>
      <h1 className="text-3xl font-semibold text-text-primary">CRM Tickets</h1>
      <p className="text-sm text-text-secondary mt-1">Support ticket pipeline — drag cards between statuses</p>

      {/* Priority summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8 mb-6">
        {priorityMeta.map(({ priority, icon, bg, accent }) => {
          const priorityTickets = tickets.filter((t) => t.priority === priority);
          return (
            <div key={priority} className={`rounded-2xl shadow-card backdrop-blur-xl border border-white/40 p-5 flex items-center justify-between ${bg}`} style={{ borderLeft: `3px solid ${accent}` }}>
              <div>
                <div className="text-xs uppercase tracking-wider text-text-muted">{priority}</div>
                <div className="text-2xl font-light text-text-primary mt-1"><Num>{priorityTickets.length}</Num></div>
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
            <div className="text-lg text-text-primary">Ticket Pipeline</div>
            <div className="text-xs text-text-muted"><Num>{tickets.length}</Num> tickets</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openAdd("Open")}
              className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-white shadow-iconBtn"
              aria-label="Add ticket"
            >
              <Plus size={18} />
            </button>
            <IconButton icon={Download} ariaLabel="Export" onClick={handleExport} />
            <div className="relative">
              <IconButton icon={SlidersHorizontal} ariaLabel="Filter by assignee" onClick={() => setFilterOpen((o) => !o)} />
              {filterOpen && (
                <div className="absolute mt-2 right-0 bg-white shadow-dropdown rounded-2xl p-3 z-50">
                  <AssigneeStack
                    assignees={assignees}
                    selected={assigneeFilter}
                    onToggle={(name) => setAssigneeFilter((prev) => (prev === name ? null : name))}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative w-full sm:w-auto">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              className="w-full sm:w-64 bg-white border border-border rounded-lg py-2.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none transition-colors"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="bg-white border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary focus:border-brand-blue focus:outline-none transition-colors"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div className="ml-auto">
            <Button icon={Plus} onClick={() => openAdd("Open")}>New ticket</Button>
          </div>
        </div>

        {/* Columns */}
        <KanbanBoard
          tickets={filtered}
          onMoveStatus={updateStatus}
          onAddTicket={openAdd}
          onEditTicket={openEdit}
        />
      </div>

      <TicketModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        ticket={null}
        defaultStatus={defaultStatus}
        onSave={handleCreate}
      />

      <TicketPanel
        open={panelOpen}
        onClose={() => { setPanelOpen(false); setPanelTicket(null); }}
        ticket={panelTicket}
        tickets={tickets}
        onSave={handlePanelSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
