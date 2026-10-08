"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Price } from "@/components/ui/Price";
import { PO_QUERY_KEY } from "@/lib/hooks/usePurchaseOrders";
import { CURRENCY_CODES, type CurrencyCode } from "@/lib/utils/currency";
import type { Product, VendorPO } from "@/types";

export interface DraftLine { product: Product; qty: number }

const input = "w-full bg-white border border-border rounded-lg py-2 px-3 text-sm text-text-primary focus:border-brand-blue focus:outline-none";

/** Review the selected reorder lines, add vendor / unit costs, and save as a Draft PO. Mount it only while open. */
export function CreatePOModal({ brand, lines, onClose, onCreated }: {
  brand: string;
  lines: DraftLine[];
  onClose: () => void;
  onCreated: (po: VendorPO) => void;
}) {
  const queryClient = useQueryClient();
  const [vendorName, setVendorName] = useState(brand);
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const [notes, setNotes] = useState("");
  const [qty, setQty] = useState<Record<number, string>>(() => Object.fromEntries(lines.map((l) => [l.product.id, String(l.qty)])));
  const [cost, setCost] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);

  const parsed = lines.map((l) => {
    const q = Number(qty[l.product.id]);
    const c = cost[l.product.id]?.trim() ? Number(cost[l.product.id]) : null;
    return { product: l.product, qty: q, unitCost: c, ok: Number.isInteger(q) && q > 0 && (c === null || c >= 0) };
  });
  const valid = parsed.every((l) => l.ok);
  const total = parsed.reduce((s, l) => s + (l.unitCost ?? 0) * (l.ok ? l.qty : 0), 0);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/procurement/pos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand, vendorName, currency, notes,
        items: parsed.map((l) => ({ productId: l.product.id, qty: l.qty, unitCost: l.unitCost })),
      }),
    });
    const body = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error(body.error ?? "Couldn't create the PO");
      return;
    }
    queryClient.invalidateQueries({ queryKey: PO_QUERY_KEY });
    toast.success(`Draft ${body.number} created`);
    onCreated(body as VendorPO);
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`New vendor PO · ${brand}`}
      maxWidth="max-w-3xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !valid}>{saving ? "Saving…" : "Save as draft"}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-sm text-text-primary mb-1">Vendor</label>
          <input className={input} value={vendorName} onChange={(e) => setVendorName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-text-primary mb-1">Currency</label>
          <select className={input} value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}>
            {CURRENCY_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto mt-5">
        <table className="w-full text-sm min-w-[520px]">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-text-muted border-b border-border/60 text-left">
              <th className="py-2 pr-3 font-normal">Product</th>
              <th className="py-2 pr-3 font-normal w-28">Qty</th>
              <th className="py-2 pr-3 font-normal w-36">Unit cost (optional)</th>
            </tr>
          </thead>
          <tbody>
            {parsed.map((l) => (
              <tr key={l.product.id} className="border-b border-border/40 last:border-0">
                <td className="py-2.5 pr-3">
                  <div className="text-text-primary">{l.product.name}</div>
                  <div className="text-xs text-text-muted">{l.product.sku || l.product.category}</div>
                </td>
                <td className="py-2.5 pr-3">
                  <input type="number" min={1} step={1} className={`${input} font-numeric ${Number.isInteger(l.qty) && l.qty > 0 ? "" : "border-danger"}`}
                    value={qty[l.product.id] ?? ""} onChange={(e) => setQty({ ...qty, [l.product.id]: e.target.value })} aria-label={`Quantity for ${l.product.name}`} />
                </td>
                <td className="py-2.5 pr-3">
                  <input type="number" min={0} step="any" className={`${input} font-numeric`} placeholder="—"
                    value={cost[l.product.id] ?? ""} onChange={(e) => setCost({ ...cost, [l.product.id]: e.target.value })} aria-label={`Unit cost for ${l.product.name}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > 0 && (
        <div className="text-right text-sm text-text-secondary mt-3">Total cost <Price value={Math.round(total * 100) / 100} currency={currency} className="text-text-primary" /></div>
      )}

      <label className="block text-sm text-text-primary mb-1 mt-4">Notes</label>
      <textarea className={`${input} resize-none`} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional — delivery address, terms…" />
      <p className="text-xs text-text-muted mt-3">Saved as a draft. It counts as incoming stock once it&apos;s issued to the vendor.</p>
    </Modal>
  );
}
