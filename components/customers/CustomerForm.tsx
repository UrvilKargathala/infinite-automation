"use client";

import { useEffect, useState } from "react";
import { Select } from "@/components/ui/Select";
import { ArchitectField, BirthdayField } from "./CustomerFields";
import { customerCodeBase, customerFullName, formatSrNo, joinBirthday, splitBirthday } from "@/lib/utils/customer";
import type { Customer, CustomerInput, CustomerSegment } from "@/types";

const SEGMENTS: CustomerSegment[] = ["Residential", "Hospitality", "Government / Council", "Retail", "Healthcare / Aged Care", "Industrial"];

type Fields = Pick<Customer, "prefix" | "firstName" | "surname" | "segment" | "email" | "phone" | "architect" | "gstNo" | "address" | "city" | "state" | "postcode" | "notes">;

const EMPTY: Fields = {
  prefix: "", firstName: "", surname: "", segment: "Residential", email: "", phone: "", architect: "",
  gstNo: "", address: "", city: "", state: "", postcode: "", notes: "",
};

function fieldsOf(c: Customer): Fields {
  const { prefix, firstName, surname, segment, email, phone, architect, gstNo, address, city, state, postcode, notes } = c;
  return { prefix, firstName, surname, segment, email, phone, architect, gstNo, address, city, state, postcode, notes };
}

/**
 * State for the customer form (Add/Edit Customer modal and the CRM panel's edit view).
 * Resets from `customer` whenever `active` turns on.
 */
export function useCustomerForm(customer: Customer | null, active: boolean) {
  const [f, setF] = useState<Fields>(EMPTY);
  const [bday, setBday] = useState({ day: "", month: "", year: "" });

  useEffect(() => {
    if (!active) return;
    setF(customer ? fieldsOf(customer) : EMPTY);
    setBday(customer ? splitBirthday(customer.birthday) : { day: "", month: "", year: "" });
  }, [active, customer]);

  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => setF((prev) => ({ ...prev, [k]: v }));

  /** Trimmed payload for the customers API. `name` is recomputed server-side; contactName is carried over untouched. */
  function toInput(): CustomerInput {
    const t = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v])) as Fields;
    return { ...t, gstNo: t.gstNo.toUpperCase(), name: customerFullName(t.firstName, t.surname), contactName: customer?.contactName ?? "", birthday: joinBirthday(bday.day, bday.month, bday.year) };
  }

  /** True when the form differs from the saved customer (so the CRM panel only PATCHes real changes). */
  function isDirty(): boolean {
    if (!customer) return true;
    const a = toInput();
    return (Object.keys(EMPTY) as (keyof Fields)[]).some((k) => (a[k] ?? "") !== (customer[k] ?? "")) || a.birthday !== customer.birthday;
  }

  return { f, set, bday, setBday, valid: !!f.firstName.trim(), toInput, isDirty };
}

export type CustomerFormState = ReturnType<typeof useCustomerForm>;

/** The customer fields, laid out like the reference Add Customer form. */
export function CustomerFormFields({ form, customer, notesLabel = "Notes", autoFocus = false }: {
  form: CustomerFormState;
  customer: Customer | null;
  notesLabel?: string;
  autoFocus?: boolean;
}) {
  const { f, set, bday, setBday } = form;
  const inputClass =
    "w-full bg-white border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none transition-colors";
  const readOnlyClass = "w-full rounded-lg py-2.5 px-3 text-sm text-center bg-surface-alt border border-border text-text-secondary font-numeric tabular-nums";
  const labelClass = "block text-sm text-text-primary mb-1";
  const codePreview = customer?.customerCode || (f.firstName.trim() ? customerCodeBase(f.firstName, f.surname) : "—");
  const field = (label: string, key: keyof Fields, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className={labelClass}>{label}</label>
      <input className={inputClass} value={f[key] ?? ""} onChange={(e) => set(key, e.target.value as Fields[typeof key])} {...props} />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>SR No</label>
          <div className={readOnlyClass}>{customer ? formatSrNo(customer.id) : "Auto"}</div>
        </div>
        <div>
          <label className={labelClass}>Customer Code</label>
          <div className={readOnlyClass}>{codePreview}</div>
        </div>
        {field("Prefix", "prefix", { placeholder: "e.g. Mr" })}
      </div>

      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {field("Name *", "firstName", { placeholder: "Rahul", autoFocus })}
          {field("Surname", "surname", { placeholder: "Verma" })}
        </div>
        {!customer && <p className="text-xs text-text-muted mt-1.5">Customer Code is auto-generated from the first two letters of Name and Surname.</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {field("Mobile Number", "phone", { placeholder: "+91 98765 43210", type: "tel" })}
        {field("Email", "email", { placeholder: "name@email.com", type: "email" })}
      </div>

      <ArchitectField value={f.architect} onChange={(v) => set("architect", v)} inputClass={inputClass} labelClass={labelClass} />
      {field("GST No", "gstNo", { placeholder: "22AAAAA0000A1Z5", className: `${inputClass} uppercase` })}
      {field("Address", "address", { placeholder: "Street, area" })}

      <div className="grid grid-cols-3 gap-3">
        {field("City", "city")}
        {field("State", "state")}
        {field("Postcode", "postcode", { inputMode: "numeric" })}
      </div>

      <BirthdayField {...bday} onChange={setBday} inputClass={inputClass} labelClass={labelClass} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Segment</label>
          <Select className={inputClass} value={f.segment} onChange={(e) => set("segment", e.target.value as CustomerSegment)}>
            {SEGMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
        {field(notesLabel, "notes")}
      </div>
    </div>
  );
}
