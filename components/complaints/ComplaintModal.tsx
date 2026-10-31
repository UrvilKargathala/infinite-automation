"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useCustomerStore } from "@/lib/store/useCustomerStore";
import { useUserStore } from "@/lib/store/useUserStore";
import { customerSiteAddress } from "@/lib/utils/customer";
import { useComplaintActions } from "@/lib/hooks/useComplaints";
import type { Complaint } from "@/types";

/** Raise a complaint (Name, Phone Number, Site address, Remarks, Engineer), or edit / reassign an existing one. Linking a customer fills the first three. */
export function ComplaintModal({ open, onClose, complaint }: { open: boolean; onClose: () => void; complaint?: Complaint | null }) {
  // Select the stable array, then filter — a selector that returns a new array every render loops forever.
  const users = useUserStore((s) => s.users);
  const engineers = useMemo(() => users.filter((u) => u.status === "Active"), [users]);
  const { customers, fetchAll: loadCustomers } = useCustomerStore();
  const { create, edit } = useComplaintActions();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [engineerId, setEngineerId] = useState("");

  useEffect(() => { if (open) loadCustomers(); }, [open, loadCustomers]);

  useEffect(() => {
    if (!open) return;
    setName(complaint?.customerName ?? "");
    setPhone(complaint?.phone ?? "");
    setSiteAddress(complaint?.siteAddress ?? "");
    setCustomerId(complaint?.customerId ? String(complaint.customerId) : "");
    setRemarks(complaint?.remarks ?? "");
    setEngineerId(complaint?.engineerId ? String(complaint.engineerId) : "");
  }, [open, complaint]);

  const valid = name.trim() && remarks.trim() && engineerId;
  const saving = create.isPending || edit.isPending;

  /** Picking a customer fills name, phone and site address (still editable); clearing it keeps what's typed. */
  function pickCustomer(id: string) {
    setCustomerId(id);
    const c = customers.find((x) => String(x.id) === id);
    if (!c) return;
    setName(c.name);
    setPhone(c.phone);
    setSiteAddress(customerSiteAddress(c));
  }

  function save() {
    if (!valid) return;
    const draft = {
      customerName: name.trim(), phone: phone.trim(), siteAddress: siteAddress.trim(), customerId: customerId ? Number(customerId) : null,
      remarks: remarks.trim(), engineerId: Number(engineerId),
    };
    const done = { onSuccess: () => onClose() };
    if (complaint) edit.mutate({ id: complaint.id, ...draft }, done);
    else create.mutate(draft, done);
  }

  const inputClass =
    "w-full bg-white border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none transition-colors";
  const labelClass = "block text-sm text-text-primary mb-1";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={complaint ? `Edit ${complaint.number}` : "New complaint"}
      maxWidth="max-w-lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={!valid || saving}>{saving ? "Saving…" : complaint ? "Save" : "Raise complaint"}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Customer</label>
          <Select className={inputClass} value={customerId} onChange={(e) => pickCustomer(e.target.value)}>
            <option value="">Not linked — type the details below</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <p className="text-xs text-text-muted mt-1.5">Pick an existing customer to fill in their name, phone and site address.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Name *</label>
            <input className={inputClass} value={name} autoFocus placeholder="Customer name" onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Phone Number</label>
            <input className={inputClass} value={phone} type="tel" placeholder="+91 98765 43210" onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Site address</label>
          <input className={inputClass} value={siteAddress} placeholder="Where the engineer needs to go" onChange={(e) => setSiteAddress(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Remarks *</label>
          <textarea
            className={`${inputClass} resize-none`}
            rows={4}
            value={remarks}
            placeholder="What's the problem? e.g. Living room dimmer not responding since Monday"
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Engineer *</label>
          <Select className={inputClass} value={engineerId} onChange={(e) => setEngineerId(e.target.value)}>
            <option value="">Assign an engineer</option>
            {engineers.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
          </Select>
          <p className="text-xs text-text-muted mt-1.5">
            {complaint && complaint.engineerId && String(complaint.engineerId) !== engineerId
              ? "The new engineer will be notified."
              : "The engineer gets a notification as soon as you save."}
          </p>
        </div>
      </div>
    </Modal>
  );
}
