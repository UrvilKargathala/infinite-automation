"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Num } from "@/components/ui/Num";
import { PO_QUERY_KEY } from "@/lib/hooks/usePurchaseOrders";
import { STOCK_QUERY_KEY } from "@/lib/hooks/useStock";
import type { Product, VendorPO } from "@/types";

const input = "w-24 bg-white border border-border rounded-lg py-1.5 px-2 text-sm font-numeric focus:border-brand-blue focus:outline-none";

/** Goods-received dialog: enter what actually arrived per line (defaults to everything still outstanding). Mount only while open. */
export function ReceiveDeliveryModal({ po, products, onClose }: { po: VendorPO; products: Product[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const nameOf = new Map(products.map((p) => [p.id, p.name]));
  const [qty, setQty] = useState<Record<number, string>>(() =>
    Object.fromEntries(po.items.map((i) => [i.id, String(Math.max(0, i.qtyOrdered - i.qtyReceived))])),
  );
  const [saving, setSaving] = useState(false);

  const rows = po.items.map((i) => {
    const n = Number(qty[i.id]);
    const outstanding = Math.max(0, i.qtyOrdered - i.qtyReceived);
    return { item: i, n, outstanding, ok: Number.isInteger(n) && n >= 0, over: n > outstanding };
  });
  const valid = rows.every((r) => r.ok);
  const units = rows.reduce((s, r) => s + (r.ok ? r.n : 0), 0);
  const anyOver = rows.some((r) => r.ok && r.over);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/procurement/pos/${po.id}/receive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines: rows.filter((r) => r.n > 0).map((r) => ({ itemId: r.item.id, qty: r.n })) }),
    });
    const body = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error(body.error ?? "Couldn't record the delivery");
      return;
    }
    queryClient.invalidateQueries({ queryKey: PO_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEY });
    toast.success(`${units} unit(s) received — ${(body as VendorPO).status}`);
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Receive delivery · ${po.number}`}
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !valid || units === 0}>{saving ? "Saving…" : <>Receive <Num className="mx-0.5">{units}</Num> unit(s)</>}</Button>
        </>
      }
    >
      <p className="text-sm text-text-secondary mb-4">{po.vendorName} · enter what actually arrived. It&apos;s added to physical stock straight away.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-text-muted border-b border-border/60 text-left">
              <th className="py-2 pr-3 font-normal">Product</th>
              <th className="py-2 pr-3 font-normal">Ordered</th>
              <th className="py-2 pr-3 font-normal">Already received</th>
              <th className="py-2 pr-3 font-normal">Receiving now</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.item.id} className="border-b border-border/40 last:border-0">
                <td className="py-2.5 pr-3 text-text-primary">{nameOf.get(r.item.productId) ?? `#${r.item.productId}`}</td>
                <td className="py-2.5 pr-3"><Num>{r.item.qtyOrdered}</Num></td>
                <td className="py-2.5 pr-3"><Num>{r.item.qtyReceived}</Num></td>
                <td className="py-2.5 pr-3">
                  <input type="number" min={0} step={1} className={`${input} ${r.ok ? "" : "border-danger"} ${r.over ? "border-warning" : ""}`}
                    value={qty[r.item.id] ?? ""} onChange={(e) => setQty({ ...qty, [r.item.id]: e.target.value })}
                    aria-label={`Receiving now: ${nameOf.get(r.item.productId) ?? r.item.productId}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {anyOver && <p className="text-xs text-warning mt-3">Some lines are more than were ordered. That&apos;s allowed — it will be noted in the audit log.</p>}
      <p className="text-xs text-text-muted mt-3">Anything not received keeps the PO open as Partially Received.</p>
    </Modal>
  );
}
