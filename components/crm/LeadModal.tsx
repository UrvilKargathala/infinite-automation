"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { Lead, CustomerSegment, LeadStage } from "@/types";

const segments: CustomerSegment[] = ["Residential", "Commercial", "Short Term Rentals", "Agriculture"];
const stages: LeadStage[] = ["New", "Qualified", "Quoted", "Won", "Lost"];
const salesTeam = ["Urvil", "Henil", "Chirag"];

interface Props {
  open: boolean;
  onClose: () => void;
  lead: Lead | null;
  defaultStage?: LeadStage;
  onSave: (data: Omit<Lead, "id">) => void;
  onDelete?: (id: number) => void;
}

export function LeadModal({ open, onClose, lead, defaultStage, onSave, onDelete }: Props) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [segment, setSegment] = useState<CustomerSegment>("Residential");
  const [stage, setStage] = useState<LeadStage>("New");
  const [value, setValue] = useState("");
  const [assigned, setAssigned] = useState(salesTeam[0]);
  const [lastContact, setLastContact] = useState("");

  useEffect(() => {
    if (!open) return;
    if (lead) {
      setName(lead.name);
      setCompany(lead.company);
      setEmail(lead.email);
      setPhone(lead.phone);
      setSegment(lead.segment);
      setStage(lead.stage);
      setValue(String(lead.value));
      setAssigned(lead.assigned);
      setLastContact(lead.lastContact);
    } else {
      setName("");
      setCompany("");
      setEmail("");
      setPhone("");
      setSegment("Residential");
      setStage(defaultStage ?? "New");
      setValue("");
      setAssigned(salesTeam[0]);
      setLastContact(new Date().toISOString().slice(0, 10));
    }
  }, [open, lead, defaultStage]);

  function handleSave() {
    onSave({
      name: name.trim(),
      company: company.trim(),
      email: email.trim(),
      phone: phone.trim(),
      segment,
      stage,
      value: Number(value) || 0,
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
        lead ? (
          <div className="flex items-center gap-3">
            <span>Edit lead</span>
            {onDelete && (
              <button
                onClick={() => {
                  if (window.confirm("Delete this lead?")) {
                    onDelete(lead.id);
                    onClose();
                  }
                }}
                className="text-text-muted hover:text-danger transition-colors"
                aria-label="Delete lead"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ) : "New lead"
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>Save</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Name</label>
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
          <label className={labelClass}>Segment</label>
          <select className={inputClass} value={segment} onChange={(e) => setSegment(e.target.value as CustomerSegment)}>
            {segments.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Stage</label>
          <select className={inputClass} value={stage} onChange={(e) => setStage(e.target.value as LeadStage)}>
            {stages.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Value (INR)</label>
          <input className={inputClass} type="number" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Assigned to</label>
          <select className={inputClass} value={assigned} onChange={(e) => setAssigned(e.target.value)}>
            {salesTeam.map((s) => <option key={s} value={s}>{s}</option>)}
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
