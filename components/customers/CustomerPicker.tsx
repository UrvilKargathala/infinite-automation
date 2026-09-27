"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useCustomerStore } from "@/lib/store/useCustomerStore";
import type { CustomerSegment } from "@/types";

const segments: CustomerSegment[] = [
  "Residential", "Hospitality", "Government / Council", "Retail", "Healthcare / Aged Care", "Industrial",
];

const inputClass =
  "w-full bg-white border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none transition-colors";

interface Props {
  value: number | null;
  onChange: (customerId: number, customerName: string) => void;
  label?: string;
}

export function CustomerPicker({ value, onChange, label = "Customer" }: Props) {
  const { customers, fetchAll, add } = useCustomerStore();
  const [addingNew, setAddingNew] = useState(false);
  const [name, setName] = useState("");
  const [segment, setSegment] = useState<CustomerSegment>("Residential");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function handleAddNew() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const created = await add({ name: name.trim(), segment, contactName: contactName.trim(), email: email.trim(), phone: phone.trim(), address: "", notes: "" });
      onChange(created.id, created.name);
      setAddingNew(false);
      setName("");
      setContactName("");
      setEmail("");
      setPhone("");
    } catch {
      // error toast already shown by the store
    } finally {
      setSaving(false);
    }
  }

  if (addingNew) {
    return (
      <div className="col-span-full border border-border rounded-lg p-3 space-y-3 bg-white">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-primary">New customer</span>
          <button
            className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1"
            onClick={() => setAddingNew(false)}
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>
        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-3">
          <input className={`${inputClass} min-w-0`} placeholder="Customer / company name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <select className={`${inputClass} min-w-0`} value={segment} onChange={(e) => setSegment(e.target.value as CustomerSegment)}>
            {segments.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input className={`${inputClass} min-w-0`} placeholder="Contact name (optional)" value={contactName} onChange={(e) => setContactName(e.target.value)} />
          <input className={`${inputClass} min-w-0`} placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={`${inputClass} min-w-0`} placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <button
          type="button"
          onClick={handleAddNew}
          disabled={!name.trim() || saving}
          className="text-sm text-white bg-brand-gradient rounded-lg px-4 py-2 disabled:opacity-40"
        >
          Add customer
        </button>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm text-text-primary mb-1">{label}</label>
      <select
        className={inputClass}
        value={value ?? ""}
        onChange={(e) => {
          if (e.target.value === "__new__") {
            setAddingNew(true);
            return;
          }
          const id = Number(e.target.value);
          const customer = customers.find((c) => c.id === id);
          if (customer) onChange(customer.id, customer.name);
        }}
      >
        <option value="">Select customer...</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
        <option value="__new__">+ Add new customer</option>
      </select>
    </div>
  );
}
