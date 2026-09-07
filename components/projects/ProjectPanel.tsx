"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  X, Trash2, Pencil, Check, Ban, Paperclip, Send, Reply, Forward, Copy, MoreVertical,
  ChevronLeft, ChevronRight, Search, MessageSquare, History,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { INR } from "@/components/ui/INR";
import { useQuoteStore } from "@/lib/store/useQuoteStore";
import { useUserStore } from "@/lib/store/useUserStore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { calcQuoteTotal } from "@/lib/utils/quote";
import { PIPELINE_STAGES } from "./KanbanBoard";
import type { Project, ProjectStage, ProjectStageEvent, ProjectMessage, Attachment } from "@/types";

const supportTeam = ["Urvil Kargathala", "Henil Patel", "Tirth", "Chirag"];

const stageColors: Record<ProjectStage, string> = {
  Inquiry: "#3B82F6", Design: "#8B5CF6", Quotation: "#F59E0B", Measurement: "#06B6D4",
  Marking: "#0EA5E9", Production: "#EAB308", "Material Requirement": "#F97316",
  "Ready to Dispatch": "#14B8A6", Installation: "#22C55E", Completed: "#10B981", Cancelled: "#EF4444",
};

function historyTimeLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " + new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function dateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yest)) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function msgTimeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function highlight(text: string, query: string) {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.trim().toLowerCase() ? (
      <mark key={i} className="bg-brand-gradient-tint text-text-primary rounded-sm">{part}</mark>
    ) : (
      part
    )
  );
}

async function fetchHistory(projectId: number): Promise<ProjectStageEvent[]> {
  const res = await fetch(`/api/projects/${projectId}/history`);
  if (!res.ok) throw new Error("Failed to load history");
  return res.json();
}

async function fetchMessages(projectId: number): Promise<ProjectMessage[]> {
  const res = await fetch(`/api/projects/${projectId}/messages`);
  if (!res.ok) throw new Error("Failed to load messages");
  return res.json();
}

interface Props {
  open: boolean;
  onClose: () => void;
  project: Project | null;
  projects: Project[];
  onSave: (id: number, data: Partial<Omit<Project, "id">>) => void | Promise<void>;
  onDelete: (id: number) => void;
}

export function ProjectPanel({ open, onClose, project, projects, onSave, onDelete }: Props) {
  const quotes = useQuoteStore((s) => s.quotes);
  const queryClient = useQueryClient();
  const { users, fetchAll: fetchUsers } = useUserStore();
  const myId = useAuthStore((s) => s.user?.id);
  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<{ siteAddress: string; assigned: string; architect: string; quoteId: number | null; notes: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "chat">("details");

  const [text, setText] = useState("");
  const [pendingFiles, setPendingFiles] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ProjectMessage | null>(null);
  const [forwardingMsg, setForwardingMsg] = useState<ProjectMessage | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [preview, setPreview] = useState<{ images: Attachment[]; index: number } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (project) {
      setForm({
        siteAddress: project.siteAddress, assigned: project.assigned,
        architect: project.architect, quoteId: project.quoteId, notes: project.notes,
      });
    }
    setEditing(false);
    setActiveTab("details");
    setText("");
    setPendingFiles([]);
    setReplyingTo(null);
    setSearchOpen(false);
    setSearchQuery("");
  }, [project?.id]);

  const { data: history = [] } = useQuery({
    queryKey: ["project-history", project?.id],
    queryFn: () => fetchHistory(project!.id),
    enabled: !!project && open,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["project-messages", project?.id],
    queryFn: () => fetchMessages(project!.id),
    enabled: !!project && open,
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${project!.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), attachments: pendingFiles, replyToId: replyingTo?.id ?? null }),
      });
      if (!res.ok) throw new Error("Failed to send");
      return res.json() as Promise<ProjectMessage>;
    },
    onSuccess: (msg) => {
      queryClient.setQueryData<ProjectMessage[]>(["project-messages", project?.id], (prev = []) => [...prev, msg]);
      setText("");
      setPendingFiles([]);
      setReplyingTo(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await fetch(`/api/projects/${project!.id}/messages/${messageId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: (_void, messageId) => {
      queryClient.setQueryData<ProjectMessage[]>(["project-messages", project?.id], (prev = []) =>
        prev.map((m) => (m.id === messageId ? { ...m, deleted: true, text: "", attachments: [] } : m))
      );
    },
    onError: () => toast.error("You can only delete your own messages"),
  });

  const forwardMutation = useMutation({
    mutationFn: async ({ targetProjectId, msg }: { targetProjectId: number; msg: ProjectMessage }) => {
      const res = await fetch(`/api/projects/${targetProjectId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: msg.text, attachments: msg.attachments, isForwarded: true }),
      });
      if (!res.ok) throw new Error("Failed to forward");
      return targetProjectId;
    },
    onSuccess: (targetProjectId) => {
      queryClient.invalidateQueries({ queryKey: ["project-messages", targetProjectId] });
      toast.success("Message forwarded");
      setForwardingMsg(null);
    },
    onError: () => toast.error("Failed to forward message"),
  });

  useEffect(() => {
    if (activeTab === "chat") listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, activeTab]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (preview) setPreview(null);
        else if (searchOpen) { setSearchOpen(false); setSearchQuery(""); }
        else onClose();
      } else if (preview && e.key === "ArrowLeft") {
        setPreview((p) => (p ? { ...p, index: (p.index - 1 + p.images.length) % p.images.length } : p));
      } else if (preview && e.key === "ArrowRight") {
        setPreview((p) => (p ? { ...p, index: (p.index + 1) % p.images.length } : p));
      }
    }
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose, preview, searchOpen]);

  useEffect(() => {
    if (menuOpenId === null) return;
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpenId(null);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [menuOpenId]);

  const grouped = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? messages.filter((m) => !m.deleted && m.text.toLowerCase().includes(q))
      : messages;
    const map = new Map<string, ProjectMessage[]>();
    for (const m of filtered) {
      const key = dateLabel(m.createdAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return [...map.entries()];
  }, [messages, searchQuery]);

  const mentionMatches = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return users.filter((u) => u.status === "Active" && u.fullName.toLowerCase().includes(q)).slice(0, 6);
  }, [mentionQuery, users]);

  function handleTextChange(value: string) {
    setText(value);
    const caretMention = value.match(/@([^\s@]*)$/);
    setMentionQuery(caretMention ? caretMention[1] : null);
  }

  function insertMention(fullName: string) {
    setText((t) => t.replace(/@([^\s@]*)$/, `@${fullName} `));
    setMentionQuery(null);
  }

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0 || !project) return;
    setUploading(true);
    try {
      for (const file of files) {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch(`/api/projects/${project.id}/messages/upload`, { method: "POST", body });
        if (!res.ok) throw new Error("Upload failed");
        const attachment: Attachment = await res.json();
        setPendingFiles((prev) => [...prev, attachment]);
      }
    } catch {
      toast.error("File upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleSend() {
    if (!text.trim() && pendingFiles.length === 0) return;
    sendMutation.mutate();
  }

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
              {!editing && activeTab === "chat" && (
                <button
                  onClick={() => setSearchOpen((v) => { if (v) setSearchQuery(""); return !v; })}
                  aria-label="Search chat"
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${searchOpen ? "bg-brand-gradient-tint text-brand-blue" : "text-text-muted hover:bg-[#F9FAFB]"}`}
                >
                  <Search size={15} />
                </button>
              )}
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

          {!editing && (
            <div className="inline-flex items-center gap-1 bg-surface-alt rounded-full p-1 mt-3">
              <button
                onClick={() => setActiveTab("details")}
                className={`px-3 py-1 rounded-full text-xs flex items-center gap-1.5 transition-colors ${
                  activeTab === "details" ? "bg-white shadow-card text-text-primary" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <History size={12} /> Details
              </button>
              <button
                onClick={() => setActiveTab("chat")}
                className={`px-3 py-1 rounded-full text-xs flex items-center gap-1.5 transition-colors ${
                  activeTab === "chat" ? "bg-white shadow-card text-text-primary" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <MessageSquare size={12} /> Chat
              </button>
            </div>
          )}

          {searchOpen && !editing && activeTab === "chat" && (
            <div className="relative mt-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search this chat..."
                className="w-full bg-white border border-border rounded-full py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none transition-colors"
              />
            </div>
          )}
        </div>

        {editing ? (
          /* Edit-fields view */
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
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
        ) : activeTab === "details" ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
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
                        <div className="text-xs text-text-muted">{historyTimeLabel(h.changedAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Chat feed */}
            <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {grouped.length === 0 ? (
                <div className="text-center text-text-muted text-sm py-10">
                  {searchQuery.trim() ? "No messages match your search" : "No activity yet — start the conversation"}
                </div>
              ) : (
                grouped.map(([label, msgs]) => (
                  <div key={label}>
                    <div className="text-center text-[11px] text-text-muted mb-3">{label}</div>
                    <div className="space-y-3">
                      {msgs.map((m) => (
                        <div key={m.id} className="group flex items-start gap-2">
                          <Avatar name={m.fullName} size="xs" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs text-text-primary">{m.fullName}</span>
                              <span className="text-[10px] text-text-muted">{msgTimeLabel(m.createdAt)}</span>
                              {m.isForwarded && !m.deleted && (
                                <span className="text-[10px] text-text-muted italic flex items-center gap-0.5">
                                  <Forward size={10} /> Forwarded
                                </span>
                              )}
                              {!m.deleted && (
                                <div ref={menuOpenId === m.id ? menuRef : undefined} className="relative ml-auto">
                                  <button
                                    onClick={() => setMenuOpenId((id) => (id === m.id ? null : m.id))}
                                    aria-label="Message options"
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-text-muted hover:bg-[#F9FAFB] transition-opacity ${
                                      menuOpenId === m.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                    }`}
                                  >
                                    <MoreVertical size={14} />
                                  </button>
                                  {menuOpenId === m.id && (
                                    <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-dropdown border border-border overflow-hidden z-10 text-left">
                                      <button
                                        onClick={() => { setReplyingTo(m); setMenuOpenId(null); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-[#F9FAFB] transition-colors"
                                      >
                                        <Reply size={14} /> Reply
                                      </button>
                                      {m.text && (
                                        <button
                                          onClick={() => { navigator.clipboard.writeText(m.text); toast.success("Copied"); setMenuOpenId(null); }}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-[#F9FAFB] transition-colors"
                                        >
                                          <Copy size={14} /> Copy
                                        </button>
                                      )}
                                      <button
                                        onClick={() => { setForwardingMsg(m); setMenuOpenId(null); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-[#F9FAFB] transition-colors"
                                      >
                                        <Forward size={14} /> Forward
                                      </button>
                                      {m.userId === myId && (
                                        <button
                                          onClick={() => { setMenuOpenId(null); if (window.confirm("Delete this message?")) deleteMutation.mutate(m.id); }}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-[#F9FAFB] transition-colors"
                                        >
                                          <Trash2 size={14} /> Delete for me
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {m.deleted ? (
                              <div className="mt-1 text-sm text-text-muted italic bg-[#F9FAFB] rounded-xl px-3 py-2 inline-block">
                                This message was deleted
                              </div>
                            ) : (
                              <>
                                {m.replyToId && (
                                  <div className="mt-1 mb-1 border-l-2 border-brand-blue bg-[#F9FAFB] rounded px-2 py-1 max-w-full">
                                    <div className="text-[10px] text-brand-blue">{m.replyToFullName ?? "Unknown"}</div>
                                    <div className="text-xs text-text-muted truncate">{m.replyToText || "Attachment"}</div>
                                  </div>
                                )}
                                {m.text && (
                                  <div className="mt-1 text-sm text-text-primary bg-[#F9FAFB] rounded-xl px-3 py-2 inline-block max-w-full whitespace-pre-wrap break-words">
                                    {highlight(m.text, searchQuery)}
                                  </div>
                                )}
                                {m.attachments.length > 0 && (() => {
                                  const images = m.attachments.filter((a) => a.type.startsWith("image/"));
                                  return (
                                    <div className="mt-2 grid grid-cols-2 gap-2 max-w-[280px]">
                                      {m.attachments.map((a, i) =>
                                        a.type.startsWith("image/") ? (
                                          <button
                                            key={i}
                                            onClick={() => setPreview({ images, index: images.indexOf(a) })}
                                            className="rounded-lg overflow-hidden border border-border"
                                          >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={a.url} alt={a.name} className="w-full h-24 object-cover" />
                                          </button>
                                        ) : (
                                          <a key={i} href={a.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-brand-blue bg-[#F9FAFB] rounded-lg px-2 py-1.5 border border-border">
                                            <Paperclip size={12} /> {a.name}
                                          </a>
                                        )
                                      )}
                                    </div>
                                  );
                                })()}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-border p-3 shrink-0 relative">
              {mentionQuery !== null && mentionMatches.length > 0 && (
                <div className="absolute bottom-full left-3 mb-1 w-56 bg-white rounded-xl shadow-dropdown border border-border overflow-hidden">
                  {mentionMatches.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => insertMention(u.fullName)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-[#F9FAFB] transition-colors"
                    >
                      <Avatar name={u.fullName} size="xs" />
                      {u.fullName}
                    </button>
                  ))}
                </div>
              )}

              {replyingTo && (
                <div className="flex items-center gap-2 mb-2 bg-[#F9FAFB] border-l-2 border-brand-blue rounded px-2 py-1.5">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-brand-blue">Replying to {replyingTo.fullName}</div>
                    <div className="text-xs text-text-muted truncate">{replyingTo.text || "Attachment"}</div>
                  </div>
                  <button onClick={() => setReplyingTo(null)} aria-label="Cancel reply" className="text-text-muted hover:text-danger shrink-0">
                    <X size={14} />
                  </button>
                </div>
              )}

              {pendingFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {pendingFiles.map((f, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs bg-[#F9FAFB] border border-border rounded-full px-2.5 py-1 text-text-secondary">
                      <Paperclip size={11} /> {f.name}
                      <button onClick={() => setPendingFiles((p) => p.filter((_, idx) => idx !== i))} className="text-text-muted hover:text-danger ml-1">×</button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-end gap-2">
                <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFilePick} />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  aria-label="Attach file"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:bg-[#F9FAFB] shrink-0 transition-colors disabled:opacity-40"
                >
                  <Paperclip size={16} />
                </button>
                <textarea
                  className="flex-1 bg-white border border-border rounded-lg py-2 px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none transition-colors resize-none"
                  placeholder="Message... use @ to mention"
                  rows={1}
                  value={text}
                  onChange={(e) => handleTextChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={(!text.trim() && pendingFiles.length === 0) || sendMutation.isPending}
                  className="w-9 h-9 rounded-full bg-brand-gradient flex items-center justify-center text-white shrink-0 disabled:opacity-40"
                  aria-label="Send"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {forwardingMsg && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); setForwardingMsg(null); }}>
          <div className="bg-white w-[320px] max-h-[70vh] rounded-2xl shadow-modal flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
              <span className="text-sm text-text-primary">Forward to...</span>
              <button onClick={() => setForwardingMsg(null)} aria-label="Close" className="text-text-muted hover:bg-[#F9FAFB] w-7 h-7 rounded-full flex items-center justify-center">
                <X size={15} />
              </button>
            </div>
            <div className="overflow-y-auto p-2">
              {projects.filter((p) => p.id !== project.id).length === 0 ? (
                <div className="text-center text-text-muted text-sm py-8">No other projects to forward to</div>
              ) : (
                projects
                  .filter((p) => p.id !== project.id)
                  .map((p) => (
                    <button
                      key={p.id}
                      onClick={() => forwardMutation.mutate({ targetProjectId: p.id, msg: forwardingMsg })}
                      disabled={forwardMutation.isPending}
                      className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-[#F9FAFB] transition-colors text-left disabled:opacity-50"
                    >
                      <Avatar name={p.assigned} size="xs" />
                      <div className="min-w-0">
                        <div className="text-sm text-text-primary truncate">{p.customerName}</div>
                        <div className="text-xs text-text-muted truncate">{p.siteAddress}</div>
                      </div>
                    </button>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-6" onClick={(e) => { e.stopPropagation(); setPreview(null); }}>
          <button
            onClick={() => setPreview(null)}
            aria-label="Close preview"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X size={18} />
          </button>

          {preview.images.length > 1 && (
            <div className="absolute top-4 left-4 text-white text-sm bg-white/10 rounded-full px-3 py-1">
              {preview.index + 1} / {preview.images.length}
            </div>
          )}

          {preview.images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setPreview((p) => (p ? { ...p, index: (p.index - 1 + p.images.length) % p.images.length } : p)); }}
              aria-label="Previous image"
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview.images[preview.index].url}
            alt={preview.images[preview.index].name}
            className="max-w-[420px] max-h-[65vh] w-auto h-auto rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {preview.images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setPreview((p) => (p ? { ...p, index: (p.index + 1) % p.images.length } : p)); }}
              aria-label="Next image"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
            >
              <ChevronRight size={22} />
            </button>
          )}

          {preview.images.length > 1 && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 max-w-[90vw] overflow-x-auto px-2"
              onClick={(e) => e.stopPropagation()}
            >
              {preview.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setPreview((p) => (p ? { ...p, index: i } : p))}
                  className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                    i === preview.index ? "border-white" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
