"use client";

import { useEffect, useState } from "react";
import { Ban, CheckCircle2, MapPin, Pencil, Phone, RotateCcw, Trash2, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useComplaintActions, useComplaintEvents } from "@/lib/hooks/useComplaints";
import { AGE_TONE_CLASS, COMPLAINT_STATUS_COLOR, complaintAge } from "@/lib/utils/complaints";
import { can } from "@/lib/utils/permissions";
import type { Complaint, ComplaintEvent } from "@/types";

const EVENT_LABEL: Record<ComplaintEvent["kind"], string> = {
  created: "Raised", assigned: "Reassigned", edited: "Details edited", completed: "Completed", reopened: "Reopened", cancelled: "Cancelled",
};
const EVENT_COLOR: Record<ComplaintEvent["kind"], string> = {
  created: "#3A90C3", assigned: "#8B5CF6", edited: "#94A3B8", completed: "#44BE4A", reopened: "#EF4444", cancelled: "#94A3B8",
};

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

/** Complaint side panel: details, the one next step (complete / cancel, or reopen), and the full history. */
export function ComplaintPanel({ complaint, onClose, onEdit }: { complaint: Complaint | null; onClose: () => void; onEdit: (c: Complaint) => void }) {
  const me = useAuthStore((s) => s.user);
  const { complete, cancel, reopen, remove } = useComplaintActions();
  const { data: events = [] } = useComplaintEvents(complaint?.id ?? null);
  const [note, setNote] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => { setNote(""); setReason(""); setCancelling(false); }, [complaint?.id, complaint?.status]);
  useEffect(() => {
    if (!complaint) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [complaint, onClose]);

  if (!complaint || !me) return null;
  const isAdmin = can(me.role, "manageComplaints");
  const canComplete = complaint.status === "Pending" && (isAdmin || complaint.engineerId === me.id);
  const age = complaintAge(complaint);
  const mapsUrl = complaint.siteAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(complaint.siteAddress)}` : "";
  const iconBtn = "w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:bg-[#F3F5F7] hover:text-text-primary transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full sm:w-[460px] h-full shadow-modal flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 pt-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs text-text-muted font-numeric tabular-nums">{complaint.number}</div>
              <h2 className="text-xl text-text-primary uppercase tracking-wide truncate">{complaint.customerName}</h2>
            </div>
            <div className="flex items-center shrink-0 -mr-1.5">
              <a href={complaint.phone ? `tel:${complaint.phone.replace(/\s+/g, "")}` : undefined} aria-label="Call" title={complaint.phone || "No phone number"}
                className={`${iconBtn} ${complaint.phone ? "" : "opacity-40 pointer-events-none"}`}>
                <Phone size={17} />
              </a>
              {isAdmin && (
                <>
                  <button onClick={() => onEdit(complaint)} aria-label="Edit" title="Edit / reassign" className={iconBtn}><Pencil size={16} /></button>
                  <button
                    onClick={() => { if (window.confirm(`Delete ${complaint.number}? This can't be undone.`)) remove.mutate(complaint.id, { onSuccess: onClose }); }}
                    aria-label="Delete" title="Delete" className={`${iconBtn} hover:!text-danger`}
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
              <button onClick={onClose} aria-label="Close" className={iconBtn}><X size={18} /></button>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Badge color={COMPLAINT_STATUS_COLOR[complaint.status]}>● {complaint.status}</Badge>
            {age && <span className={`text-xs ${AGE_TONE_CLASS[age.tone]}`}>{age.label}</span>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-text-muted mb-1">Phone Number</div>
              <div className="text-text-primary font-numeric tabular-nums">{complaint.phone || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-text-muted mb-1">Engineer</div>
              <div className="flex items-center gap-2 text-text-primary">
                {complaint.engineerName ? <><Avatar name={complaint.engineerName} size="xs" /> {complaint.engineerName}</> : "Unassigned"}
              </div>
            </div>
            <div>
              <div className="text-xs text-text-muted mb-1">Raised by</div>
              <div className="text-text-primary">{complaint.createdByName ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-text-muted mb-1">Raised on</div>
              <div className="text-text-primary">{when(complaint.createdAt)}</div>
            </div>
          </div>

          <div>
            <div className="text-xs text-text-muted mb-1">Site address</div>
            {complaint.siteAddress ? (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1.5 text-sm text-brand-blue hover:underline">
                <MapPin size={15} className="mt-0.5 shrink-0" /> {complaint.siteAddress}
              </a>
            ) : <div className="text-sm text-text-muted">—</div>}
          </div>

          <div>
            <div className="text-xs text-text-muted mb-1">Remarks</div>
            <div className="text-sm text-text-primary whitespace-pre-wrap bg-[#F9FAFB] rounded-xl px-3 py-2.5">{complaint.remarks}</div>
          </div>

          {complaint.status === "Completed" && (
            <div>
              <div className="text-xs text-text-muted mb-1">What was done</div>
              <div className="text-sm text-text-primary whitespace-pre-wrap bg-success/5 border border-success/20 rounded-xl px-3 py-2.5">{complaint.resolution}</div>
            </div>
          )}

          {complaint.status === "Cancelled" && (
            <div>
              <div className="text-xs text-text-muted mb-1">Why it was cancelled</div>
              <div className="text-sm text-text-primary whitespace-pre-wrap bg-text-primary/[0.04] border border-border rounded-xl px-3 py-2.5">{complaint.cancelReason}</div>
            </div>
          )}

          {/* The one next step for this person */}
          {canComplete && (
            <div className="rounded-2xl border border-border p-4 space-y-3">
              <div className="text-sm text-text-primary">Mark as completed</div>
              <textarea
                className="w-full bg-white border border-border rounded-lg py-2 px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none resize-none"
                rows={3}
                value={note}
                placeholder="What was done? e.g. Replaced the dimmer module and tested all scenes"
                onChange={(e) => setNote(e.target.value)}
              />
              <Button icon={CheckCircle2} disabled={!note.trim() || complete.isPending} className="w-full justify-center"
                onClick={() => complete.mutate({ id: complaint.id, resolution: note.trim() })}>
                {complete.isPending ? "Saving…" : "Mark completed"}
              </Button>
              <p className="text-xs text-text-muted">{complaint.createdByName ?? "The person who raised it"} will be notified.</p>
            </div>
          )}
          {complaint.status === "Pending" && isAdmin && (
            cancelling ? (
              <div className="rounded-2xl border border-border p-4 space-y-3">
                <div className="text-sm text-text-primary">Cancel this complaint</div>
                <input
                  className="w-full bg-white border border-border rounded-lg py-2 px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none"
                  value={reason}
                  autoFocus
                  placeholder="Reason — e.g. raised by mistake, customer withdrew, duplicate"
                  onChange={(e) => setReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1 justify-center" onClick={() => setCancelling(false)}>Keep it</Button>
                  <Button icon={Ban} disabled={!reason.trim() || cancel.isPending} className="flex-1 justify-center"
                    onClick={() => cancel.mutate({ id: complaint.id, reason: reason.trim() })}>
                    {cancel.isPending ? "Cancelling…" : "Cancel complaint"}
                  </Button>
                </div>
                <p className="text-xs text-text-muted">{complaint.engineerName ?? "The engineer"} will be notified. You can reopen it later.</p>
              </div>
            ) : (
              <button onClick={() => setCancelling(true)} className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-danger transition-colors">
                <Ban size={15} /> Cancel this complaint
              </button>
            )
          )}
          {(complaint.status === "Completed" || complaint.status === "Cancelled") && isAdmin && (
            <div className="rounded-2xl border border-border p-4 space-y-3">
              <div className="text-sm text-text-primary">{complaint.status === "Completed" ? "Not fixed? Reopen it" : "Needed after all? Reopen it"}</div>
              <input
                className="w-full bg-white border border-border rounded-lg py-2 px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none"
                value={note}
                placeholder="Reason (optional) — sent to the engineer"
                onChange={(e) => setNote(e.target.value)}
              />
              <Button variant="secondary" icon={RotateCcw} disabled={reopen.isPending} className="w-full justify-center"
                onClick={() => reopen.mutate({ id: complaint.id, note: note.trim() })}>
                Reopen as Pending
              </Button>
            </div>
          )}

          <div>
            <div className="text-xs text-text-muted mb-2 uppercase tracking-wider">History</div>
            <div className="space-y-3">
              {events.map((ev) => (
                <div key={ev.id} className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: EVENT_COLOR[ev.kind] }} />
                  <div className="min-w-0">
                    <div className="text-sm text-text-primary">{EVENT_LABEL[ev.kind]} <span className="text-text-muted">by {ev.userName}</span></div>
                    {ev.note && <div className="text-xs text-text-secondary mt-0.5 whitespace-pre-wrap">{ev.note}</div>}
                    <div className="text-xs text-text-muted">{when(ev.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
