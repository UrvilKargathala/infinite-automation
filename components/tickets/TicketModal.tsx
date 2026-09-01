"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { Ticket, TicketCategory, TicketPriority, TicketStatus } from "@/types";

const categories: TicketCategory[] = ["Installation", "Repair", "Maintenance", "General"];
const priorities: TicketPriority[] = ["Low", "Medium", "High", "Urgent"];
const statuses: TicketStatus[] = ["Open", "In Progress", "On Hold", "Resolved", "Closed"];
const supportTeam = ["Urvil", "Henil", "Chirag"];

interface Props {
  open: boolean;
  onClose: () => void;
  ticket: Ticket | null;
  defaultStatus?: TicketStatus;
  onSave: (data: Omit<Ticket, "id">) => void;
  onDelete?: (id: number) => void;
}

export function TicketModal({ open, onClose, ticket, defaultStatus, onSave, onDelete }: Props) {
  const [subject, setSubject] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState<TicketCategory>("General");
  const [priority, setPriority] = useState<TicketPriority>("Medium");
  const [status, setStatus] = useState<TicketStatus>("Open");
  const [assigned, setAssigned] = useState(supportTeam[0]);
  const [lastContact, setLastContact] = useState("");

  useEffect(() => {
    if (!open) return;
    if (ticket) {
      setSubject(ticket.subject);
      setName(ticket.name);
      setCompany(ticket.company);
      setEmail(ticket.email);
      setPhone(ticket.phone);
      setCategory(ticket.category);
      setPriority(ticket.priority);
      setStatus(ticket.status);
      setAssigned(ticket.assigned);
      setLastContact(ticket.lastContact);
    } else {
      setSubject("");
      setName("");
      setCompany("");
      setEmail("");
      setPhone("");
      setCategory("General");
      setPriority("Medium");
      setStatus(defaultStatus ?? "Open");
      setAssigned(supportTeam[0]);
      setLastContact(new Date().toISOString().slice(0, 10));
    }
  }, [open, ticket, defaultStatus]);

  function handleSave() {
    onSave({
      subject: subject.trim(),
      name: name.trim(),
      company: company.trim(),
      email: email.trim(),
      phone: phone.trim(),
      category,
      priority,
      status,
      assigned,
      lastContact,
    });
    onClose();
  }

  const inputClass =
    "w-full bg-white border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none transition-colors";
  const labelClass = "block text-sm text-text-primary mb-1";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        ticket ? (
          <div className="flex items-center gap-3">
            <span>Edit ticket</span>
            {onDelete && (
              <button
                onClick={() => {
                  if (window.confirm("Delete this ticket?")) {
                    onDelete(ticket.id);
                    onClose();
                  }
                }}
                className="text-text-muted hover:text-danger transition-colors"
                aria-label="Delete ticket"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ) : "New ticket"
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!subject.trim() || !name.trim()}>Save</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={labelClass}>Subject</label>
          <input className={inputClass} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Dimmer switch not responding" />
        </div>
        <div>
          <label className={labelClass}>Contact name</label>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Company</label>
          <input className={inputClass} value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Category</label>
          <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value as TicketCategory)}>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Priority</label>
          <select className={inputClass} value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)}>
            {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as TicketStatus)}>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Assigned to</label>
          <select className={inputClass} value={assigned} onChange={(e) => setAssigned(e.target.value)}>
            {supportTeam.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Last contact</label>
          <input className={inputClass} type="date" value={lastContact} onChange={(e) => setLastContact(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
