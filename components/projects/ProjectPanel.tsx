"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  X, Trash2, Pencil, Check, Ban, Paperclip, Send, Reply, Forward, Copy, MoreVertical,
  ChevronLeft, ChevronRight, Search, MessageCircle, Phone, Mail, Star, Info, Mic, ArrowLeft,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Price } from "@/components/ui/Price";
import { useQuoteStore } from "@/lib/store/useQuoteStore";
import { useUserStore } from "@/lib/store/useUserStore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useCustomerStore } from "@/lib/store/useCustomerStore";
import { useDictation } from "@/lib/hooks/useDictation";
import { useChatAttachments } from "@/lib/hooks/useChatAttachments";
import { AttachmentList } from "@/components/chat/AttachmentList";
import { PendingAttachments } from "@/components/chat/PendingAttachments";
import { ChatBackdrop } from "@/components/chat/ChatBackdrop";
import { UNREAD_QUERY_KEY } from "@/lib/hooks/useProjectUnread";
import { CustomerFormFields, useCustomerForm } from "@/components/customers/CustomerForm";
import { calcQuoteTotal } from "@/lib/utils/quote";
import { usePipelineStages } from "@/lib/hooks/usePipelineStages";
import { CANCELLED, CANCELLED_COLOR, stageColor } from "@/lib/utils/pipeline";
import { ProjectFulfilment } from "./ProjectFulfilment";
import type { Project, ProjectStage, ProjectStageEvent, ProjectMessage, Attachment } from "@/types";
import { Select } from "@/components/ui/Select";

const supportTeam = ["Urvil Kargathala", "Henil Patel", "Tirth", "Chirag"];


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
  const { stages } = usePipelineStages();
  const { users, fetchAll: fetchUsers } = useUserStore();
  const myId = useAuthStore((s) => s.user?.id);
  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<{ siteAddress: string; assigned: string; architect: string; quoteId: number | null; notes: string } | null>(null);
  // Chat is the main view (CRM conversation); Details is one tap away via the info button.
  const [activeTab, setActiveTab] = useState<"details" | "chat">("chat");
  const [starredOnly, setStarredOnly] = useState(false);

  const [text, setText] = useState("");
  const files = useChatAttachments(project ? `project-${project.id}` : null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ProjectMessage | null>(null);
  const [forwardingMsg, setForwardingMsg] = useState<ProjectMessage | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [preview, setPreview] = useState<{ images: Attachment[]; index: number } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingMsgId, setEditingMsgId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

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
    setActiveTab("chat");
    setStarredOnly(false);
    setText("");
    files.clear();
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
        body: JSON.stringify({ text: text.trim(), attachments: files.pending, replyToId: replyingTo?.id ?? null }),
      });
      if (!res.ok) throw new Error("Failed to send");
      return res.json() as Promise<ProjectMessage>;
    },
    onSuccess: (msg) => {
      queryClient.setQueryData<ProjectMessage[]>(["project-messages", project?.id], (prev = []) => [...prev, msg]);
      setText("");
      files.clear();
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

  const editMutation = useMutation({
    mutationFn: async ({ messageId, text: newText }: { messageId: number; text: string }) => {
      const res = await fetch(`/api/projects/${project!.id}/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newText }),
      });
      if (!res.ok) throw new Error("Failed to edit");
      return { messageId, text: newText };
    },
    onSuccess: ({ messageId, text: newText }) => {
      queryClient.setQueryData<ProjectMessage[]>(["project-messages", project?.id], (prev = []) =>
        prev.map((m) => (m.id === messageId ? { ...m, text: newText, edited: true } : m))
      );
      setEditingMsgId(null);
    },
    onError: () => toast.error("Failed to edit message"),
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

  const starMutation = useMutation({
    mutationFn: async ({ messageId, starred }: { messageId: number; starred: boolean }) => {
      const res = await fetch(`/api/projects/${project?.id}/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starred }),
      });
      if (!res.ok) throw new Error("Couldn't update the star");
    },
    onMutate: ({ messageId, starred }) => {
      queryClient.setQueryData<ProjectMessage[]>(["project-messages", project?.id], (prev = []) =>
        prev.map((m) => (m.id === messageId ? { ...m, starred } : m))
      );
    },
    onError: () => {
      toast.error("Couldn't update the star");
      queryClient.invalidateQueries({ queryKey: ["project-messages", project?.id] });
    },
  });

  // Reading the chat clears this record's unread badge — re-marked as messages arrive while it's open.
  useEffect(() => {
    if (!open || !project || activeTab !== "chat") return;
    fetch(`/api/projects/${project.id}/messages/read`, { method: "POST" })
      .then(() => queryClient.invalidateQueries({ queryKey: UNREAD_QUERY_KEY }))
      .catch(() => {});
  }, [open, project?.id, activeTab, messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const customer = useCustomerStore((s) => s.customers.find((c) => c.id === project?.customerId));
  const updateCustomer = useCustomerStore((s) => s.update);
  // The edit view edits the linked customer too, so details can be fixed without leaving the CRM.
  const customerForm = useCustomerForm(customer ?? null, editing);
  const [savingEdit, setSavingEdit] = useState(false);
  const dictation = useDictation((spoken) => setText((t) => (t.trim() ? `${t.trimEnd()} ${spoken}` : spoken)));

  const grouped = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let filtered = q
      ? messages.filter((m) => !m.deleted && m.text.toLowerCase().includes(q))
      : messages;
    if (starredOnly) filtered = filtered.filter((m) => m.starred && !m.deleted);
    const map = new Map<string, ProjectMessage[]>();
    for (const m of filtered) {
      const key = dateLabel(m.createdAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return [...map.entries()];
  }, [messages, searchQuery, starredOnly]);

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

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (picked.length > 0) files.addFiles(picked);
  }

  /** Pasting a screenshot or copied file into the message box attaches it. */
  function handlePaste(e: React.ClipboardEvent) {
    const pasted = Array.from(e.clipboardData.files);
    if (pasted.length === 0) return;
    e.preventDefault();
    files.addFiles(pasted);
  }

  function handleSend() {
    if ((!text.trim() && files.pending.length === 0) || files.busy) return;
    sendMutation.mutate();
  }

  async function handleStageChange(stage: ProjectStage) {
    if (!project) return;
    await onSave(project.id, { stage });
    queryClient.invalidateQueries({ queryKey: ["project-history", project.id] });
  }

  async function handleCancel() {
    if (!project) return;
    if (window.confirm("Cancel this record? It will be removed from the active CRM board.")) {
      await onSave(project.id, { stage: CANCELLED });
      queryClient.invalidateQueries({ queryKey: ["project-history", project.id] });
    }
  }

  async function handleFieldSave() {
    if (!project || !form) return;
    if (customer && !customerForm.valid) return toast.error("Customer name is required");
    setSavingEdit(true);
    try {
      let customerName = project.customerName;
      if (customer && customerForm.isDirty()) {
        const input = customerForm.toInput();
        await updateCustomer(customer.id, input);
        customerName = input.name;
      }
      // Keep the card's name in step with the customer's.
      await onSave(project.id, customerName !== project.customerName ? { ...form, customerName } : form);
      setEditing(false);
    } catch {
      // the stores already showed an error toast
    } finally {
      setSavingEdit(false);
    }
  }

  if (!open || !project || !form) return null;

  const inputClass =
    "w-full bg-white border border-border rounded-lg py-2 px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none transition-colors";
  const labelClass = "block text-xs text-text-muted mb-1";
  const linkedQuote = quotes.find((q) => q.id === form.quoteId);
  const isCancelled = project.stage === CANCELLED;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full sm:w-[460px] h-full shadow-modal flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header — name, quick actions, stage pill */}
        <div className="px-5 pt-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl text-text-primary uppercase tracking-wide truncate">{project.customerName}</h2>
              {project.siteAddress && <div className="text-xs text-text-muted truncate mt-0.5">{project.siteAddress}</div>}
            </div>
            <div className="flex items-center shrink-0 -mr-1.5">
              <a
                href={customer?.phone ? `tel:${customer.phone.replace(/\s+/g, "")}` : undefined}
                aria-label="Call customer"
                title={customer?.phone || "No phone number on this customer"}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:bg-[#F3F5F7] hover:text-text-primary transition-colors ${customer?.phone ? "" : "opacity-40 pointer-events-none"}`}
              >
                <Phone size={17} />
              </a>
              <a
                href={customer?.email ? `mailto:${customer.email}` : undefined}
                aria-label="Email customer"
                title={customer?.email || "No email on this customer"}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:bg-[#F3F5F7] hover:text-text-primary transition-colors ${customer?.email ? "" : "opacity-40 pointer-events-none"}`}
              >
                <Mail size={17} />
              </a>
              <button
                onClick={() => setEditing((v) => !v)}
                aria-label="Edit details"
                title="Edit details"
                className={`w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:bg-[#F3F5F7] hover:text-text-primary transition-colors ${editing ? "!bg-brand-gradient-tint !text-brand-blue" : ""}`}
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => { if (window.confirm("Delete this CRM record?")) { onDelete(project.id); onClose(); } }}
                aria-label="Delete"
                title="Delete"
                className="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:bg-[#F3F5F7] hover:text-text-primary transition-colors hover:!text-danger"
              >
                <Trash2 size={16} />
              </button>
              <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:bg-[#F3F5F7] hover:text-text-primary transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          {isCancelled ? (
            <span className="inline-flex items-center gap-1.5 mt-2 text-sm px-3 py-1.5 rounded-full" style={{ backgroundColor: CANCELLED_COLOR + "18", color: CANCELLED_COLOR }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CANCELLED_COLOR }} /> Cancelled
            </span>
          ) : (
            <div className="relative inline-flex mt-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full pointer-events-none z-10" style={{ backgroundColor: stageColor(stages, project.stage) }} />
              <Select
                className="bg-white/70 border border-border/70 rounded-full py-1.5 pl-6 pr-3 text-sm text-text-secondary hover:text-text-primary focus:border-brand-blue focus:outline-none transition-colors"
                value={project.stage}
                onChange={(e) => handleStageChange(e.target.value as ProjectStage)}
              >
                {stages.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
              </Select>
            </div>
          )}
        </div>

        {editing ? (
          /* Edit view: the linked customer's full details, then this CRM record's fields */
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            <div className="text-xs uppercase tracking-wider text-text-muted">Customer</div>
            {customer ? (
              <CustomerFormFields form={customerForm} customer={customer} notesLabel="Customer notes" />
            ) : (
              <div className="text-sm text-text-muted bg-[#F9FAFB] rounded-xl px-3 py-2.5">No customer is linked to this record.</div>
            )}
            <div className="pt-3 border-t border-border text-xs uppercase tracking-wider text-text-muted">CRM record</div>
            <div>
              <label className={labelClass}>Site address</label>
              <input className={inputClass} value={form.siteAddress} onChange={(e) => setForm({ ...form, siteAddress: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Assigned to</label>
                <Select className={inputClass} value={form.assigned} onChange={(e) => setForm({ ...form, assigned: e.target.value })}>
                  {supportTeam.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </div>
              <div>
                <label className={labelClass}>Site architect</label>
                <input className={inputClass} value={form.architect} onChange={(e) => setForm({ ...form, architect: e.target.value })} placeholder="Optional" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Linked quote</label>
              <Select
                className={inputClass}
                value={form.quoteId ?? ""}
                onChange={(e) => setForm({ ...form, quoteId: e.target.value ? Number(e.target.value) : null })}
                disabled={!!project.confirmedAt}
                title={project.confirmedAt ? "Locked — stock is reserved against this quote" : undefined}
              >
                <option value="">No quote linked</option>
                {quotes.map((q) => <option key={q.id} value={q.id}>{q.number} — {q.client}</option>)}
              </Select>
            </div>
            <div>
              <label className={labelClass}>Notes</label>
              <textarea
                className={`${inputClass} resize-none`}
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            {/* Pinned to the bottom of the scrolling form so Save is always in reach. */}
            <div className="sticky -bottom-5 -mx-5 -mb-5 mt-1 px-5 py-3 flex items-center gap-2 bg-white/95 backdrop-blur border-t border-border">
              {!isCancelled && (
                <Button variant="ghost" icon={Ban} onClick={handleCancel} className="text-danger hover:!text-danger mr-auto">Cancel record</Button>
              )}
              <div className="ml-auto flex gap-2">
                <Button variant="secondary" onClick={() => setEditing(false)}>Close</Button>
                <Button icon={Check} onClick={handleFieldSave} disabled={savingEdit}>{savingEdit ? "Saving…" : "Save"}</Button>
              </div>
            </div>
          </div>
        ) : activeTab === "details" ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <button onClick={() => setActiveTab("chat")} className="flex items-center gap-1.5 text-sm text-brand-blue hover:underline">
              <ArrowLeft size={15} /> Back to chat
            </button>
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
                  <Price value={calcQuoteTotal(linkedQuote).grandTotal} currency={linkedQuote.currency} className="text-sm text-brand-blue" />
                </div>
              </div>
            )}

            <ProjectFulfilment project={project} />

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
                      <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: stageColor(stages, h.stage) }} />
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
            {/* Chat feed on a patterned backdrop, with floating info / star / search controls */}
            <div className="relative flex-1 min-h-0">
              <ChatBackdrop />
              <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                {[
                  { label: "Details", icon: Info, active: false, onClick: () => setActiveTab("details") },
                  { label: starredOnly ? "Show all messages" : "Starred messages", icon: Star, active: starredOnly, onClick: () => setStarredOnly((v) => !v) },
                  { label: "Search chat", icon: Search, active: searchOpen, onClick: () => setSearchOpen((v) => { if (v) setSearchQuery(""); return !v; }) },
                ].map(({ label, icon: Icon, active, onClick }) => (
                  <button
                    key={label}
                    onClick={onClick}
                    aria-label={label}
                    title={label}
                    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-iconBtn border transition-colors ${
                      active ? "bg-brand-blue text-white border-brand-blue" : "bg-white text-text-secondary border-white hover:text-text-primary"
                    }`}
                  >
                    <Icon size={17} className={active && Icon === Star ? "fill-current" : ""} />
                  </button>
                ))}
              </div>
              {searchOpen && (
                <div className="absolute top-3 left-3 right-[150px] z-10">
                  <Search size={14} className="absolute left-3 top-1/2 z-10 -translate-y-1/2 pointer-events-none text-text-secondary" />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search this chat..."
                    className="w-full h-10 bg-white border border-border rounded-full pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted shadow-iconBtn focus:border-brand-blue focus:outline-none"
                  />
                </div>
              )}
            <div ref={listRef} className="absolute inset-0 overflow-y-auto px-4 pt-16 pb-4 space-y-4">
              {grouped.length === 0 ? (
                <div className="mx-2 mt-2 rounded-2xl border border-dashed border-text-primary/10 bg-white/30 py-16 flex flex-col items-center text-center px-6">
                  <span className="w-14 h-14 rounded-full bg-white shadow-iconBtn flex items-center justify-center text-brand-blue">
                    <MessageCircle size={24} />
                  </span>
                  <p className="mt-4 text-text-secondary">
                    {searchQuery.trim()
                      ? "No messages match your search."
                      : starredOnly
                        ? "No starred messages yet — star one from its menu."
                        : "No messages yet — start the conversation."}
                  </p>
                </div>
              ) : (
                grouped.map(([label, msgs]) => (
                  <div key={label}>
                    <div className="text-center mb-3"><span className="inline-block px-2.5 py-0.5 rounded-full bg-white/70 text-[11px] text-text-secondary">{label}</span></div>
                    <div className="space-y-3">
                      {msgs.map((m) => (
                        <div key={m.id} className="group flex items-start gap-2">
                          <Avatar name={m.fullName} size="xs" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs text-text-primary">{m.fullName}</span>
                              <span className="text-[10px] text-text-muted">{msgTimeLabel(m.createdAt)}</span>
                              {m.edited && !m.deleted && (
                                <span className="text-[10px] text-text-muted italic">(edited)</span>
                              )}
                              {m.starred && !m.deleted && <Star size={11} className="text-warning fill-current self-center" aria-label="Starred" />}
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
                                        onClick={() => { starMutation.mutate({ messageId: m.id, starred: !m.starred }); setMenuOpenId(null); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-[#F9FAFB] transition-colors"
                                      >
                                        <Star size={14} className={m.starred ? "fill-current text-warning" : ""} /> {m.starred ? "Unstar" : "Star"}
                                      </button>
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
                                          onClick={() => { setEditingMsgId(m.id); setEditText(m.text); setMenuOpenId(null); }}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-[#F9FAFB] transition-colors"
                                        >
                                          <Pencil size={14} /> Edit
                                        </button>
                                      )}
                                      {m.userId === myId && (
                                        <button
                                          onClick={() => { setMenuOpenId(null); if (window.confirm("Delete this message?")) deleteMutation.mutate(m.id); }}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-[#F9FAFB] transition-colors"
                                        >
                                          <Trash2 size={14} /> Delete
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
                                {editingMsgId === m.id ? (
                                  <div className="mt-1 flex flex-col gap-1.5 max-w-full">
                                    <textarea
                                      autoFocus
                                      className="w-full bg-white border border-brand-blue rounded-lg py-1.5 px-2.5 text-sm text-text-primary focus:outline-none resize-none"
                                      rows={2}
                                      value={editText}
                                      onChange={(e) => setEditText(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                          e.preventDefault();
                                          if (editText.trim() || m.attachments.length > 0) {
                                            editMutation.mutate({ messageId: m.id, text: editText.trim() });
                                          }
                                        } else if (e.key === "Escape") {
                                          setEditingMsgId(null);
                                        }
                                      }}
                                    />
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => editMutation.mutate({ messageId: m.id, text: editText.trim() })}
                                        disabled={(!editText.trim() && m.attachments.length === 0) || editMutation.isPending}
                                        className="text-xs text-white bg-brand-gradient rounded-full px-3 py-1 disabled:opacity-40"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => setEditingMsgId(null)}
                                        className="text-xs text-text-muted hover:text-text-primary"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  m.text && (
                                    <div className="mt-1 text-sm text-text-primary bg-white shadow-iconBtn rounded-2xl rounded-tl-md px-3 py-2 inline-block max-w-full whitespace-pre-wrap break-words">
                                      {highlight(m.text, searchQuery)}
                                    </div>
                                  )
                                )}
                                {m.attachments.length > 0 && (
                                  <AttachmentList attachments={m.attachments} onPreviewImage={(images, index) => setPreview({ images, index })} />
                                )}
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
            </div>

            {/* Composer */}
            <div className="border-t border-border px-4 py-3 shrink-0 relative bg-white">
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

              <PendingAttachments pending={files.pending} uploading={files.uploading} onRemove={files.remove} />

              <div className="flex items-center gap-2">
                <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFilePick} />
                <button
                  onClick={() => fileRef.current?.click()}
                  aria-label="Attach file"
                  title="Attach file"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-text-secondary hover:bg-[#F3F5F7] shrink-0 transition-colors disabled:opacity-40"
                >
                  <Paperclip size={18} />
                </button>
                <textarea
                  className="flex-1 bg-white border border-border rounded-full py-2.5 px-4 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none transition-colors resize-none max-h-32"
                  placeholder="Message... use @ to mention"
                  rows={1}
                  value={text}
                  onChange={(e) => handleTextChange(e.target.value)}
                  onPaste={handlePaste}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                {dictation.supported && (
                  <button
                    onClick={dictation.toggle}
                    aria-label={dictation.listening ? "Stop voice typing" : "Voice typing"}
                    title={dictation.listening ? "Listening… tap to stop" : "Voice typing"}
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      dictation.listening ? "bg-danger/10 text-danger animate-pulse" : "text-text-secondary hover:bg-[#F3F5F7]"
                    }`}
                  >
                    <Mic size={18} />
                  </button>
                )}
                <button
                  onClick={handleSend}
                  disabled={(!text.trim() && files.pending.length === 0) || files.busy || sendMutation.isPending}
                  className="w-11 h-11 rounded-full bg-brand-gradient flex items-center justify-center text-white shrink-0 shadow-iconBtn disabled:opacity-40 disabled:bg-none disabled:bg-text-primary/10 disabled:text-text-muted"
                  aria-label="Send"
                >
                  <Send size={17} />
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
