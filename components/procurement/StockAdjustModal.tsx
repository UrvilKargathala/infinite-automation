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

const inputClass =
  "w-full bg-white border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary font-numeric focus:border-brand-blue focus:outline-none";

/**
 * Set one product's stock: type how many are on the shelf now and the app works out the change. Also edits the
 * min buffer. Every change is logged. (Deliveries and shipments go through POs and projects, not here.)
 */
export function StockAdjustModal({ product, stock, onClose }: { product: Product | null; stock: StockStatus | undefined; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [count, setCount] = useState("");
  const [minBuffer, setMinBuffer] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset only when a different product opens, so a background refresh never wipes what the user is typing.
  useEffect(() => {
    if (!product) return;
    setCount(String(stock?.physical ?? 0));
    setNote("");
    setMinBuffer(String(stock?.minBuffer ?? 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  if (!product) return null;
  const physical = stock?.physical ?? 0;
  const reserved = stock?.allocated ?? 0;
  const n = Number(count);
  const countInvalid = count.trim() === "" || !Number.isInteger(n) || n < 0;
  const buffer = Number(minBuffer);
  const bufferInvalid = minBuffer.trim() === "" || !Number.isInteger(buffer) || buffer < 0;
  const diff = countInvalid ? 0 : n - physical;
  const changed = (!countInvalid && diff !== 0) || (!bufferInvalid && buffer !== (stock?.minBuffer ?? 0));

  async function handleSave() {
    if (!product) return;
    setSaving(true);
    const body: Record<string, unknown> = { note, minBuffer: buffer };
    if (diff !== 0) body.setTo = n;
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
          <Button onClick={handleSave} disabled={saving || countInvalid || bufferInvalid || !changed}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      <label className="block text-sm text-text-primary mb-1">How many do you have in stock now?</label>
      <input type="number" min={0} step={1} className={inputClass} value={count} onChange={(e) => setCount(e.target.value)} autoFocus />
      <div className={`text-xs mt-1 ${countInvalid ? "text-danger" : "text-text-muted"}`}>
        {countInvalid
          ? "Enter a whole number, 0 or more"
          : diff === 0
            ? "No change"
            : <>Changes <Num>{physical}</Num> → <Num>{n}</Num> ({diff > 0 ? "+" : "−"}<Num>{Math.abs(diff)}</Num>)</>}
      </div>
      <div className="mt-2 text-xs text-text-muted">
        <Num>{reserved}</Num> already promised to customers, so <Num className={n - reserved < 0 ? "text-danger" : ""}>{countInvalid ? physical - reserved : n - reserved}</Num> would be free to sell.
      </div>

      <label className="block text-sm text-text-primary mb-1 mt-4">Reason (optional)</label>
      <input className={`${inputClass} font-sans`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. opening stock, damaged, found in store" />

      <label className="block text-sm text-text-primary mb-1 mt-4">Keep at least (min buffer)</label>
      <input type="number" min={0} step={1} className={inputClass} value={minBuffer} onChange={(e) => setMinBuffer(e.target.value)} />
      <div className={`text-xs mt-1 ${bufferInvalid ? "text-danger" : "text-text-muted"}`}>
        {bufferInvalid ? "Enter a whole number, 0 or more" : "Shows as Low stock when free units drop below this."}
      </div>
    </Modal>
  );
}
