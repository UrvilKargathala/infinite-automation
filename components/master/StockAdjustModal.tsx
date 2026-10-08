"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Num } from "@/components/ui/Num";
import { STOCK_QUERY_KEY } from "@/lib/hooks/useStock";
import type { StockStatus } from "@/lib/utils/inventory";
import type { Product, StockRow } from "@/types";

type Mode = "adjust" | "count";

const inputClass =
  "w-full bg-white border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary font-numeric focus:border-brand-blue focus:outline-none";

/** Adjust physical stock (+/- or a stock count) and the min buffer for one product. Every change is logged. */
export function StockAdjustModal({ product, stock, onClose }: { product: Product | null; stock: StockStatus | undefined; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>("adjust");
  const [qty, setQty] = useState("");
  const [minBuffer, setMinBuffer] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!product) return;
    setMode("adjust");
    setQty("");
    setNote("");
    setMinBuffer(String(stock?.minBuffer ?? 0));
  }, [product, stock?.minBuffer]);

  if (!product) return null;
  const physical = stock?.physical ?? 0;
  const n = qty.trim() === "" ? null : Number(qty);
  const buffer = Number(minBuffer);
  const after = n === null ? physical : mode === "count" ? n : physical + n;
  const qtyInvalid = n !== null && (!Number.isInteger(n) || (mode === "adjust" && n === 0) || after < 0);
  const bufferInvalid = !Number.isInteger(buffer) || buffer < 0;
  const changed = (n !== null && after !== physical) || buffer !== (stock?.minBuffer ?? 0);

  async function handleSave() {
    if (!product) return;
    setSaving(true);
    const body: Record<string, unknown> = { note, minBuffer: buffer };
    if (n !== null && after !== physical) body[mode === "count" ? "setTo" : "delta"] = n;
    const res = await fetch(`/api/inventory/stock/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error(result.error ?? "Couldn't update stock");
      return;
    }
    queryClient.setQueryData<StockRow[]>(STOCK_QUERY_KEY, (rows) =>
      rows?.map((r) => (r.productId === product.id ? (result as StockRow) : r)),
    );
    toast.success("Stock updated");
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Stock · ${product.name}`}
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || qtyInvalid || bufferInvalid || !changed}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-3 gap-3 text-center mb-5">
        {[
          { label: "Physical", value: physical },
          { label: "Reserved", value: stock?.allocated ?? 0 },
          { label: "Available", value: stock?.available ?? 0 },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-surface-alt py-3">
            <Num className={`text-xl ${s.label === "Available" && s.value < 0 ? "text-danger" : "text-text-primary"}`}>{s.value}</Num>
            <div className="text-xs text-text-muted mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 p-1 rounded-lg bg-surface-alt mb-3">
        {([["adjust", "Add / remove"], ["count", "Stock count"]] as const).map(([m, label]) => (
          <button
            key={m}
            onClick={() => { setMode(m); setQty(""); }}
            className={`flex-1 rounded-md py-1.5 text-sm transition-colors ${mode === m ? "bg-white shadow-card text-text-primary" : "text-text-secondary"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <label className="block text-sm text-text-primary mb-1">
        {mode === "adjust" ? "Units to add (use − to remove)" : "Counted on the shelf"}
      </label>
      <input type="number" step={1} className={inputClass} value={qty} onChange={(e) => setQty(e.target.value)} placeholder={mode === "adjust" ? "e.g. 10 or -2" : String(physical)} autoFocus />
      <div className={`text-xs mt-1 ${qtyInvalid ? "text-danger" : "text-text-muted"}`}>
        {qtyInvalid ? (after < 0 ? "Stock can't go below 0" : "Enter a whole number") : n === null ? " " : <>Physical becomes <Num>{after}</Num></>}
      </div>

      <label className="block text-sm text-text-primary mb-1 mt-3">Reason / note</label>
      <input className={`${inputClass} font-sans`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional — e.g. damaged, found in store, opening stock" />

      <label className="block text-sm text-text-primary mb-1 mt-4">Min buffer</label>
      <input type="number" min={0} step={1} className={inputClass} value={minBuffer} onChange={(e) => setMinBuffer(e.target.value)} />
      <div className={`text-xs mt-1 ${bufferInvalid ? "text-danger" : "text-text-muted"}`}>
        {bufferInvalid ? "Enter a whole number, 0 or more" : "Shows as Low stock when available falls below this."}
      </div>
    </Modal>
  );
}
