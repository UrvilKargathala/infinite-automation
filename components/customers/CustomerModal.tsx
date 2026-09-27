"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { Customer, CustomerSegment } from "@/types";

const segments: CustomerSegment[] = [
  "Residential", "Hospitality", "Government / Council", "Retail", "Healthcare / Aged Care", "Industrial",
];

interface Props {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSave: (data: Omit<Customer, "id" | "createdAt">) => void;
}

export function CustomerModal({ open, onClose, customer, onSave }: Props) {
  const [name, setName] = useState("");
  const [segment, setSegment] = useState<CustomerSegment>("Residential");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    if (customer) {
      setName(customer.name);
      setSegment(customer.segment);
      setContactName(customer.contactName);
      setEmail(customer.email);
      setPhone(customer.phone);
      setAddress(customer.address);
      setNotes(customer.notes);
    } else {
      setName("");
      setSegment("Residential");
      setContactName("");
      setEmail("");
      setPhone("");
      setAddress("");
      setNotes("");
    }
  }, [open, customer]);

  function handleSave() {
    if (!name.trim()) return;
    onSave({ name: name.trim(), segment, contactName: contactName.trim(), email: email.trim(), phone: phone.trim(), address: address.trim(), notes: notes.trim() });
    onClose();
  }

  const inputClass =
    "w-full bg-white border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none transition-colors";
  const labelClass = "block text-sm text-text-primary mb-1";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={customer ? "Edit customer" : "Add customer"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>Save</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={labelClass}>Customer / company name</label>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Segment</label>
          <select className={inputClass} value={segment} onChange={(e) => setSegment(e.target.value as CustomerSegment)}>
            {segments.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Contact name</label>
          <input className={inputClass} value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Address</label>
          <input className={inputClass} value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Notes</label>
          <textarea className={`${inputClass} resize-none`} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
