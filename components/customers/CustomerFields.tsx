"use client";

import { useMemo, useState } from "react";
import { Select } from "@/components/ui/Select";
import { useCustomerStore } from "@/lib/store/useCustomerStore";
import { useProjectStore } from "@/lib/store/useProjectStore";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Architect picker: names already used on customers or CRM records, plus "+ Add Architect" to type a new one. */
export function ArchitectField({ value, onChange, inputClass, labelClass }: {
  value: string;
  onChange: (v: string) => void;
  inputClass: string;
  labelClass: string;
}) {
  const customers = useCustomerStore((s) => s.customers);
  const projects = useProjectStore((s) => s.projects);
  const known = useMemo(() => {
    const names = new Set<string>();
    [...customers.map((c) => c.architect), ...projects.map((p) => p.architect)].forEach((a) => a?.trim() && names.add(a.trim()));
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [customers, projects]);
  const [typing, setTyping] = useState(false);
  const isNew = typing || (!!value && !known.includes(value));

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className={labelClass.replace("mb-1", "")}>Architect Name</label>
        <button
          type="button"
          className="text-xs text-brand-blue hover:underline"
          onClick={() => { setTyping(!isNew); if (isNew) onChange(""); }}
        >
          {isNew ? "Choose from list" : "+ Add Architect"}
        </button>
      </div>
      {isNew ? (
        <input className={inputClass} value={value} placeholder="Architect or studio name" autoFocus={typing} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <Select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select an architect</option>
          {known.map((a) => <option key={a} value={a}>{a}</option>)}
        </Select>
      )}
    </div>
  );
}

/** Birthday as Day / Month / Year pickers. Year is optional. */
export function BirthdayField({ day, month, year, onChange, inputClass, labelClass }: {
  day: string;
  month: string;
  year: string;
  onChange: (next: { day: string; month: string; year: string }) => void;
  inputClass: string;
  labelClass: string;
}) {
  const thisYear = new Date().getFullYear();
  return (
    <div>
      <label className={labelClass}>Birthday</label>
      <div className="grid grid-cols-3 gap-3">
        <Select className={inputClass} value={day} onChange={(e) => onChange({ day: e.target.value, month, year })}>
          <option value="">Day</option>
          {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={String(i + 1)}>{i + 1}</option>)}
        </Select>
        <Select className={inputClass} value={month} onChange={(e) => onChange({ day, month: e.target.value, year })}>
          <option value="">Month</option>
          {MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
        </Select>
        <Select className={inputClass} value={year} onChange={(e) => onChange({ day, month, year: e.target.value })}>
          <option value="">Year</option>
          {Array.from({ length: thisYear - 1919 }, (_, i) => String(thisYear - i)).map((y) => <option key={y} value={y}>{y}</option>)}
        </Select>
      </div>
    </div>
  );
}
