"use client";

import { useState, useMemo, useEffect } from "react";
import { Briefcase, FileEdit, Truck, CheckCircle2, Search, Plus, Download, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { useProjectStore } from "@/lib/store/useProjectStore";
import { Num } from "@/components/ui/Num";
import { IconTile } from "@/components/ui/IconTile";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";
import { CrmTabs } from "@/components/layout/CrmTabs";
import { AssigneeStack } from "@/components/tickets/AssigneeStack";
import { KanbanBoard, PIPELINE_STAGES } from "@/components/projects/KanbanBoard";
import { ProjectModal, type NewProjectData } from "@/components/projects/ProjectModal";
import { ProjectPanel } from "@/components/projects/ProjectPanel";
import { ProjectsSkeleton } from "@/components/projects/ProjectsSkeleton";
import { inMonth } from "@/lib/utils/dashboardMetrics";
import type { Project, ProjectStage } from "@/types";
import * as XLSX from "xlsx";

export function ProjectsPageClient() {
  const { projects, add, update, remove, updateStage, loaded } = useProjectStore();

  const loading = !loaded;
  const [filterOpen, setFilterOpen] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultStage, setDefaultStage] = useState<ProjectStage>("Inquiry");
  const [panelProject, setPanelProject] = useState<Project | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("new") === "1") {
      setDefaultStage("Inquiry");
      setModalOpen(true);
      window.history.replaceState(null, "", "/projects");
    }
  }, []);

  const assignees = useMemo(() => {
    const map = new Map<string, number>();
    projects.forEach((p) => map.set(p.assigned, (map.get(p.assigned) ?? 0) + 1));
    return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
  }, [projects]);

  const filtered = useMemo(() => {
    let list = projects;
    if (!showCancelled) list = list.filter((p) => p.stage !== "Cancelled");
    if (assigneeFilter) list = list.filter((p) => p.assigned === assigneeFilter);
    if (stageFilter) list = list.filter((p) => p.stage === stageFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) => p.customerName.toLowerCase().includes(q) || p.siteAddress.toLowerCase().includes(q)
      );
    }
    return list;
  }, [projects, showCancelled, assigneeFilter, stageFilter, search]);

  const boardStages = useMemo(
    () => (showCancelled ? [...PIPELINE_STAGES, "Cancelled" as ProjectStage] : PIPELINE_STAGES),
    [showCancelled]
  );

  const totalActive = projects.filter((p) => p.stage !== "Cancelled").length;
  const preSale = projects.filter((p) => p.stage === "Design" || p.stage === "Quotation").length;
  const inDelivery = projects.filter((p) => p.stage === "Production" || p.stage === "Ready to Dispatch" || p.stage === "Installation").length;
  const now = new Date();
  const completedThisMonth = projects.filter((p) => p.stage === "Completed" && inMonth(p.lastStageChange.slice(0, 10), now.getMonth(), now.getFullYear())).length;

  const tiles = [
    { label: "Total Active", value: totalActive, icon: Briefcase, bg: "bg-[#3A90C318]", accent: "#3A90C3" },
    { label: "Pre-Sale", value: preSale, icon: FileEdit, bg: "bg-[#8B5CF618]", accent: "#8B5CF6" },
    { label: "In Delivery", value: inDelivery, icon: Truck, bg: "bg-[#F59E0B18]", accent: "#F59E0B" },
    { label: "Completed This Month", value: completedThisMonth, icon: CheckCircle2, bg: "bg-[#44BE4A18]", accent: "#44BE4A" },
  ];

  function openAdd(stage: ProjectStage) {
    setDefaultStage(stage);
    setModalOpen(true);
  }

  function openEdit(project: Project) {
    setPanelProject(project);
    setPanelOpen(true);
  }

  function handleCreate(data: NewProjectData) {
    add(data);
    toast.success("Project added");
  }

  async function handlePanelSave(id: number, patch: Partial<Omit<Project, "id">>) {
    await update(id, patch);
    setPanelProject((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
    toast.success("Project updated");
  }

  function handleExport() {
    const data = filtered.map((p, i) => ({
      "Sr. No": i + 1,
      Customer: p.customerName,
      "Site Address": p.siteAddress,
      Architect: p.architect,
      Stage: p.stage,
      "Assigned To": p.assigned,
      "Last Stage Change": p.lastStageChange.slice(0, 10),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Projects");
    XLSX.writeFile(wb, "infinite_projects_export.xlsx");
    toast.success("Projects exported");
  }

  function handleDelete(id: number) {
    remove(id);
    toast.success("Project deleted");
  }

  if (loading) return <ProjectsSkeleton />;

  return (
    <div>
      <CrmTabs />
      <h1 className="text-3xl font-semibold text-text-primary">Projects</h1>
      <p className="text-sm text-text-secondary mt-1">Sales-to-delivery pipeline — drag cards between stages</p>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8 mb-6">
        {tiles.map(({ label, value, icon, bg, accent }) => (
          <div key={label} className={`rounded-2xl shadow-card backdrop-blur-xl border border-white/40 p-5 flex items-center justify-between ${bg}`} style={{ borderLeft: `3px solid ${accent}` }}>
            <div>
              <div className="text-xs uppercase tracking-wider text-text-muted">{label}</div>
              <div className="text-2xl font-light text-text-primary mt-1"><Num>{value}</Num></div>
            </div>
            <IconTile icon={icon} />
          </div>
        ))}
      </div>

      {/* Kanban board wrapper card */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-card border border-white/60 p-3 sm:p-6">
        {/* Board header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-lg text-text-primary">Project Pipeline</div>
            <div className="text-xs text-text-muted"><Num>{projects.length}</Num> projects</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openAdd("Inquiry")}
              className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-white shadow-iconBtn"
              aria-label="Add project"
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
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="bg-white border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary focus:border-brand-blue focus:outline-none transition-colors"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
          >
            <option value="">All stages</option>
            {PIPELINE_STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
            <option value="Cancelled">Cancelled</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showCancelled}
              onChange={(e) => setShowCancelled(e.target.checked)}
              className="w-4 h-4 rounded border-border text-brand-blue focus:ring-brand-blue accent-[#3A90C3]"
            />
            Show cancelled
          </label>
          <div className="ml-auto">
            <Button icon={Plus} onClick={() => openAdd("Inquiry")}>New Project</Button>
          </div>
        </div>

        {/* Columns */}
        <KanbanBoard
          projects={filtered}
          stages={boardStages}
          onMoveStage={updateStage}
          onAddProject={openAdd}
          onEditProject={openEdit}
        />
      </div>

      <ProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultStage={defaultStage}
        onSave={handleCreate}
      />

      <ProjectPanel
        open={panelOpen}
        onClose={() => { setPanelOpen(false); setPanelProject(null); }}
        project={panelProject}
        onSave={handlePanelSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
