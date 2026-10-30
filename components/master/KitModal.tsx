"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Price } from "@/components/ui/Price";
import { KitComponentsEditor } from "./KitComponentsEditor";
import { useProductStore } from "@/lib/store/useProductStore";
import { useCurrency } from "@/lib/hooks/useCurrency";
import { useKitActions } from "@/lib/hooks/useKits";
import { kitPricing } from "@/lib/utils/kits";
import type { Kit, KitInput } from "@/types";

const EMPTY: KitInput = { sku: "", name: "", description: "", status: "Active", discountPct: 0, items: [] };

/** Create / edit a kit: details, components, and the price it works out to in the user's currency. */
export function KitModal({ open, onClose, kit }: { open: boolean; onClose: () => void; kit: Kit | null }) {
  const currency = useCurrency();
  const products = useProductStore((s) => s.products);
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const { create, update } = useKitActions();
  const [f, setF] = useState<KitInput>(EMPTY);
  const set = <K extends keyof KitInput>(k: K, v: KitInput[K]) => setF((prev) => ({ ...prev, [k]: v }));

  useEffect(() => {
    if (!open) return;
    setF(kit ? { sku: kit.sku, name: kit.name, description: kit.description, status: kit.status, discountPct: kit.discountPct, items: kit.items } : EMPTY);
  }, [open, kit]);

  const pricing = kitPricing(f, byId, currency);
  const valid = f.sku.trim() && f.name.trim() && f.items.length > 0 && f.discountPct >= 0 && f.discountPct <= 100;
  const saving = create.isPending || update.isPending;

  function save() {
    if (!valid) return;
    const done = { onSuccess: () => onClose() };
    if (kit) update.mutate({ id: kit.id, ...f }, done);
    else create.mutate(f, done);
  }

  const control = "w-full bg-white border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none transition-colors";
  const label = "block text-sm text-text-primary mb-1";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={kit ? `Edit kit · ${kit.sku}` : "New kit"}
      maxWidth="max-w-3xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={!valid || saving}>{saving ? "Saving…" : kit ? "Save kit" : "Create kit"}</Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={label}>Kit SKU *</label>
            <input className={`${control} uppercase`} value={f.sku} placeholder="KIT-001" autoFocus={!kit} onChange={(e) => set("sku", e.target.value.toUpperCase())} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Kit name *</label>
            <input className={control} value={f.name} placeholder="Smart Living Room Kit" onChange={(e) => set("name", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className={label}>Description</label>
            <input className={control} value={f.description} placeholder="What the kit is for" onChange={(e) => set("description", e.target.value)} />
          </div>
          <div>
            <label className={label}>Status</label>
            <Select className={control} value={f.status} onChange={(e) => set("status", e.target.value as KitInput["status"])}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </Select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-text-primary">Products in this kit *</label>
            <span className="text-xs text-text-muted">{f.items.length} product{f.items.length === 1 ? "" : "s"} · {f.items.reduce((n, i) => n + i.qty, 0)} units</span>
          </div>
          <KitComponentsEditor items={f.items} onChange={(items) => set("items", items)} currency={currency} />
        </div>

        <div className="rounded-2xl bg-[#F9FAFB] border border-border p-4 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-center">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-6 text-text-secondary"><span>Components total</span><Price value={pricing.componentsTotal} currency={currency} /></div>
            <div className="flex items-center justify-between gap-6 text-text-secondary">
              <span>Kit discount</span>
              <span className="inline-flex items-center gap-1">
                <input type="number" min={0} max={100} step="0.5" value={f.discountPct} aria-label="Kit discount percent"
                  onChange={(e) => set("discountPct", Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  className="w-16 bg-white border border-border rounded-lg py-1 px-2 text-sm text-right font-numeric focus:border-brand-blue focus:outline-none" />%
              </span>
            </div>
          </div>
          <div className="sm:text-right sm:border-l sm:border-border sm:pl-5">
            <div className="text-xs text-text-muted">Kit price ({currency})</div>
            {pricing.kitPrice == null
              ? <div className="text-sm text-warning mt-1">{pricing.missingPrice.length ? `${pricing.missingPrice.length} product${pricing.missingPrice.length === 1 ? "" : "s"} without a ${currency} price` : "Add products"}</div>
              : <Price value={pricing.kitPrice} currency={currency} className="text-2xl text-text-primary" />}
          </div>
        </div>
      </div>
    </Modal>
  );
}
