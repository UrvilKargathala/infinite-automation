"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Plus, Download, SlidersHorizontal } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useProjectStore } from "@/lib/store/useProjectStore";
import { Num } from "@/components/ui/Num";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";
import { AssigneeStack } from "@/components/tickets/AssigneeStack";
import { KanbanBoard } from "@/components/projects/KanbanBoard";
import { CrmSummary } from "@/components/projects/CrmSummary";
import { CrmTabs } from "@/components/layout/CrmTabs";
import { StageModal } from "@/components/projects/StageModal";
import { ProjectModal, type NewProjectData } from "@/components/projects/ProjectModal";
import { ProjectPanel } from "@/components/projects/ProjectPanel";
import { ProjectsSkeleton } from "@/components/projects/ProjectsSkeleton";
import { usePipelineStages, STAGES_QUERY_KEY } from "@/lib/hooks/usePipelineStages";
import { CANCELLED, STAGE_INQUIRY } from "@/lib/utils/pipeline";
import type { PipelineStage, Project, ProjectStage } from "@/types";
import * as XLSX from "xlsx";
import { Select } from "@/components/ui/Select";

export function ProjectsPageClient() {
  const { projects, add, update, remove, updateStage, loaded } = useProjectStore();
  const { stages, isLoading: stagesLoading } = usePipelineStages();
  const queryClient = useQueryClient();
  const [stageModal, setStageModal] = useState<{ open: boolean; editing: PipelineStage | null }>({ open: false, editing: null });

  const loading = !loaded || stagesLoading;
  const [filterOpen, setFilterOpen] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultStage, setDefaultStage] = useState<ProjectStage>(STAGE_INQUIRY);
  const [panelProjectId, setPanelProjectId] = useState<number | null>(null);
  const panelProject = projects.find((p) => p.id === panelProjectId) ?? null;
  const [panelOpen, setPanelOpen] = useState(false);

  // ?new=1 opens the New Inquiry form; ?open=<id> (from a chat notification) opens that record's chat.
  // Watches the query so a notification clicked while already on /crm still opens the right record.
  const searchParams = useSearchParams();
  useEffect(() => {
    const openId = Number(searchParams.get("open"));
    if (searchParams.get("new") === "1") {
      setDefaultStage(STAGE_INQUIRY);
      setModalOpen(true);
    } else if (openId) {
      setPanelProjectId(openId);
      setPanelOpen(true);
    } else return;
    window.history.replaceState(null, "", "/crm");
  }, [searchParams]);

  const assignees = useMemo(() => {
    const map = new Map<string, number>();
    projects.forEach((p) => map.set(p.assigned, (map.get(p.assigned) ?? 0) + 1));
    return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
  }, [projects]);

  const filtered = useMemo(() => {
    let list = projects;
    if (!showCancelled) list = list.filter((p) => p.stage !== CANCELLED);
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

  async function deleteStage(stage: PipelineStage) {
    if (!window.confirm(`Delete the "${stage.name}" stage? This can't be undone.`)) return;
    const res = await fetch(`/api/pipeline-stages/${stage.id}`, { method: "DELETE" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(body.error ?? "Couldn't delete the stage");
    await queryClient.invalidateQueries({ queryKey: STAGES_QUERY_KEY });
    toast.success(`Deleted "${stage.name}" stage`);
  }

  function openAdd(stage: ProjectStage) {
    setDefaultStage(stage);
    setModalOpen(true);
  }

  function openEdit(project: Project) {
    setPanelProjectId(project.id);
    setPanelOpen(true);
  }

  function handleCreate(data: NewProjectData) {
    add(data);
    toast.success("Added to CRM");
  }

  async function handlePanelSave(id: number, patch: Partial<Omit<Project, "id">>) {
    try {
      await update(id, patch);
      toast.success("Saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update the project");
    }
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
    XLSX.utils.book_append_sheet(wb, ws, "CRM");
    XLSX.writeFile(wb, "infinite_crm_export.xlsx");
    toast.success("CRM exported");
  }

  function handleDelete(id: number) {
    remove(id)
      .then(() => toast.success("Removed from CRM"))
      .catch(() => toast.error("Couldn't delete it. Try again."));
  }

  if (loading) return <ProjectsSkeleton />;

  return (
    <div>
      <CrmTabs />
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-normal text-text-primary">CRM</h1>
          <p className="text-sm text-text-secondary mt-1">Inquiry to install — drag cards between stages</p>
        </div>
        <Button icon={Plus} onClick={() => openAdd(STAGE_INQUIRY)}>New Inquiry</Button>
      </div>

      <CrmSummary projects={projects} stages={stages} />

      {/* Kanban board wrapper card */}
      <div className="glass rounded-3xl p-3 sm:p-6">
        {/* Board header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-lg text-text-primary">CRM Pipeline</div>
            <div className="text-xs text-text-muted"><Num>{projects.length}</Num> records</div>
          </div>

          <div className="flex items-center gap-2">
            <IconButton icon={Download} ariaLabel="Export" onClick={handleExport} />
            <div className="relative">
              <IconButton icon={SlidersHorizontal} ariaLabel="Filter by assignee" onClick={() => setFilterOpen((o) => !o)} />
              {filterOpen && (
                <div className="absolute mt-2 right-0 glass-pop rounded-2xl p-3 z-50">
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
              className="w-full sm:w-64 glass-control border border-border rounded-lg py-2.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none transition-colors"
              placeholder="Search CRM..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            className="glass-control border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary focus:border-brand-blue focus:outline-none transition-colors"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
          >
            <option value="">All stages</option>
            {stages.map((s) => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
            <option value={CANCELLED}>{CANCELLED}</option>
          </Select>
          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showCancelled}
              onChange={(e) => setShowCancelled(e.target.checked)}
              className="w-4 h-4 rounded border-border text-brand-blue focus:ring-brand-blue accent-[#3A90C3]"
            />
            Show cancelled
          </label>
        </div>

        {/* Columns */}
        <KanbanBoard
          projects={filtered}
          stages={stages}
          showCancelled={showCancelled}
          onMoveStage={updateStage}
          onAddProject={openAdd}
          onEditProject={openEdit}
          onAddStage={() => setStageModal({ open: true, editing: null })}
          onRenameStage={(stage) => setStageModal({ open: true, editing: stage })}
          onDeleteStage={deleteStage}
        />
      </div>

      <StageModal
        open={stageModal.open}
        editing={stageModal.editing}
        stages={stages}
        onClose={() => setStageModal({ open: false, editing: null })}
      />

      <ProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultStage={defaultStage}
        onSave={handleCreate}
      />

      <ProjectPanel
        open={panelOpen}
        onClose={() => { setPanelOpen(false); setPanelProjectId(null); }}
        project={panelProject}
        projects={projects}
        onSave={handlePanelSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
