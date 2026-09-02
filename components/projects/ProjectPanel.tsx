"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Trash2, Pencil, Check, Ban } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { INR } from "@/components/ui/INR";
import { useQuoteStore } from "@/lib/store/useQuoteStore";
import { calcQuoteTotal } from "@/lib/utils/quote";
import { PIPELINE_STAGES } from "./KanbanBoard";
import type { Project, ProjectStage, ProjectStageEvent } from "@/types";

const supportTeam = ["Urvil Kargathala", "Henil Patel", "Tirth", "Chirag"];

const stageColors: Record<ProjectStage, string> = {
  Inquiry: "#3B82F6", Design: "#8B5CF6", Quotation: "#F59E0B", Measurement: "#06B6D4",
  Marking: "#0EA5E9", Production: "#EAB308", "Material Requirement": "#F97316",
  "Ready to Dispatch": "#14B8A6", Installation: "#22C55E", Completed: "#10B981", Cancelled: "#EF4444",
};

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " + new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

async function fetchHistory(projectId: number): Promise<ProjectStageEvent[]> {
  const res = await fetch(`/api/projects/${projectId}/history`);
  if (!res.ok) throw new Error("Failed to load history");
  return res.json();
}

interface Props {
  open: boolean;
  onClose: () => void;
  project: Project | null;
  onSave: (id: number, data: Partial<Omit<Project, "id">>) => void | Promise<void>;
  onDelete: (id: number) => void;
}

export function ProjectPanel({ open, onClose, project, onSave, onDelete }: Props) {
  const quotes = useQuoteStore((s) => s.quotes);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<{ siteAddress: string; assigned: string; architect: string; quoteId: number | null; notes: string } | null>(null);

  useEffect(() => {
    if (project) {
      setForm({
        siteAddress: project.siteAddress, assigned: project.assigned,
        architect: project.architect, quoteId: project.quoteId, notes: project.notes,
      });
    }
    setEditing(false);
  }, [project?.id]);

  const { data: history = [] } = useQuery({
    queryKey: ["project-history", project?.id],
    queryFn: () => fetchHistory(project!.id),
    enabled: !!project && open,
  });

  async function handleStageChange(stage: ProjectStage) {
    if (!project) return;
    await onSave(project.id, { stage });
    queryClient.invalidateQueries({ queryKey: ["project-history", project.id] });
  }

  async function handleCancel() {
    if (!project) return;
    if (window.confirm("Cancel this project? It will be removed from the active board.")) {
      await onSave(project.id, { stage: "Cancelled" });
      queryClient.invalidateQueries({ queryKey: ["project-history", project.id] });
    }
  }

  function handleFieldSave() {
    if (!project || !form) return;
    onSave(project.id, form);
    setEditing(false);
  }

  if (!open || !project || !form) return null;

  const inputClass =
    "w-full bg-white border border-border rounded-lg py-2 px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none transition-colors";
  const labelClass = "block text-xs text-text-muted mb-1";
  const linkedQuote = quotes.find((q) => q.id === form.quoteId);
  const isCancelled = project.stage === "Cancelled";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full sm:w-[420px] h-full shadow-modal flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar name={project.assigned} size="sm" />
              <div className="min-w-0">
                <div className="text-sm text-text-primary truncate">{project.customerName}</div>
                <div className="text-xs text-text-muted truncate">{project.siteAddress}</div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setEditing((v) => !v)}
                aria-label="Edit project"
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${editing ? "bg-brand-gradient-tint text-brand-blue" : "text-text-muted hover:bg-[#F9FAFB]"}`}
              >
                <Pencil size={15} />
              </button>
              {!isCancelled && (
                <button
                  onClick={handleCancel}
                  aria-label="Cancel project"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-danger hover:bg-[#F9FAFB] transition-colors"
                >
                  <Ban size={15} />
                </button>
              )}
              <button
                onClick={() => { if (window.confirm("Delete this project?")) { onDelete(project.id); onClose(); } }}
                aria-label="Delete project"
                className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-danger hover:bg-[#F9FAFB] transition-colors"
              >
                <Trash2 size={15} />
              </button>
              <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:bg-[#F9FAFB] transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>

          {isCancelled ? (
            <span className="inline-flex items-center gap-1.5 mt-3 text-xs px-3 py-1.5 rounded-full" style={{ backgroundColor: stageColors.Cancelled + "18", color: stageColors.Cancelled }}>
              Cancelled
            </span>
          ) : (
            <select
              className="mt-3 bg-white border border-border rounded-full py-1.5 px-3 text-xs text-text-primary focus:border-brand-blue focus:outline-none transition-colors"
              value={project.stage}
              onChange={(e) => handleStageChange(e.target.value as ProjectStage)}
            >
              {PIPELINE_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {editing ? (
            /* Edit-fields view */
            <div className="p-5 space-y-4">
              <div>
                <label className={labelClass}>Site address</label>
                <input className={inputClass} value={form.siteAddress} onChange={(e) => setForm({ ...form, siteAddress: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Assigned to</label>
                <select className={inputClass} value={form.assigned} onChange={(e) => setForm({ ...form, assigned: e.target.value })}>
                  {supportTeam.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Architect</label>
                <input className={inputClass} value={form.architect} onChange={(e) => setForm({ ...form, architect: e.target.value })} placeholder="Optional" />
              </div>
              <div>
                <label className={labelClass}>Linked quote</label>
                <select
                  className={inputClass}
                  value={form.quoteId ?? ""}
                  onChange={(e) => setForm({ ...form, quoteId: e.target.value ? Number(e.target.value) : null })}
                >
                  <option value="">No quote linked</option>
                  {quotes.map((q) => <option key={q.id} value={q.id}>{q.number} — {q.client}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Notes</label>
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={5}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
                <Button icon={Check} onClick={handleFieldSave}>Save</Button>
              </div>
            </div>
          ) : (
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-text-muted mb-1">Architect</div>
                  <div className="text-text-primary">{project.architect || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted mb-1">Created</div>
                  <div className="text-text-primary">{project.createdAt.slice(0, 10)}</div>
                </div>
              </div>

              {linkedQuote && (
                <div>
                  <div className="text-xs text-text-muted mb-1">Linked quote</div>
                  <div className="flex items-center justify-between bg-[#F9FAFB] rounded-xl px-3 py-2.5">
                    <span className="text-sm text-text-primary">{linkedQuote.number} — {linkedQuote.client}</span>
                    <INR value={calcQuoteTotal(linkedQuote).grandTotal} className="text-sm text-brand-blue" />
                  </div>
                </div>
              )}

              <div>
                <div className="text-xs text-text-muted mb-1">Notes</div>
                <div className="text-sm text-text-primary whitespace-pre-wrap bg-[#F9FAFB] rounded-xl px-3 py-2.5 min-h-[44px]">
                  {project.notes || <span className="text-text-muted">No notes yet</span>}
                </div>
              </div>

              <div>
                <div className="text-xs text-text-muted mb-2 uppercase tracking-wider">Stage history</div>
                {history.length === 0 ? (
                  <div className="text-sm text-text-muted">No history yet</div>
                ) : (
                  <div className="space-y-3">
                    {history.map((h) => (
                      <div key={h.id} className="flex items-start gap-2.5">
                        <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: stageColors[h.stage] }} />
                        <div>
                          <div className="text-sm text-text-primary">{h.stage}</div>
                          <div className="text-xs text-text-muted">{timeLabel(h.changedAt)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
