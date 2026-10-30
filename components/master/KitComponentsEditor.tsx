"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { Price } from "@/components/ui/Price";
import { useProductStore } from "@/lib/store/useProductStore";
import { priceIn, type CurrencyCode } from "@/lib/utils/currency";
import type { KitItem } from "@/types";

const control = "w-full bg-white border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary focus:border-brand-blue focus:outline-none transition-colors";

/** Brand → Category → Product picker (like the quote picker) plus the list of components with quantities. */
export function KitComponentsEditor({ items, onChange, currency }: { items: KitItem[]; onChange: (items: KitItem[]) => void; currency: CurrencyCode }) {
  const products = useProductStore((s) => s.products);
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const active = useMemo(() => products.filter((p) => p.status === "Active"), [products]);
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("1");

  const brands = useMemo(() => [...new Set(active.map((p) => p.brand))].sort(), [active]);
  const categories = useMemo(() => [...new Set(active.filter((p) => p.brand === brand).map((p) => p.category))].sort(), [active, brand]);
  const choices = useMemo(() => active.filter((p) => p.brand === brand && p.category === category).sort((a, b) => a.name.localeCompare(b.name)), [active, brand, category]);

  function add() {
    const id = Number(productId);
    const n = Math.max(1, Math.round(Number(qty)) || 1);
    if (!id) return;
    // Adding a product that's already in the kit tops up its quantity instead of listing it twice.
    const existing = items.find((i) => i.productId === id);
    onChange(existing ? items.map((i) => (i.productId === id ? { ...i, qty: i.qty + n } : i)) : [...items, { productId: id, qty: n }]);
    setProductId("");
    setQty("1");
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1.4fr_72px_auto] gap-2 items-end">
        <Select className={control} value={brand} onChange={(e) => { setBrand(e.target.value); setCategory(""); setProductId(""); }}>
          <option value="">Brand</option>
          {brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </Select>
        <Select className={control} value={category} disabled={!brand} onChange={(e) => { setCategory(e.target.value); setProductId(""); }}>
          <option value="">Category</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select className={control} value={productId} disabled={!category} onChange={(e) => setProductId(e.target.value)}>
          <option value="">Product</option>
          {choices.map((p) => <option key={p.id} value={p.id}>{p.name}{p.sku ? ` · ${p.sku}` : ""}</option>)}
        </Select>
        <input className={`${control} text-center`} type="number" min={1} value={qty} aria-label="Quantity" onChange={(e) => setQty(e.target.value)} />
        <button type="button" onClick={add} disabled={!productId}
          className="h-[42px] px-3 rounded-lg bg-brand-gradient text-white text-sm inline-flex items-center gap-1 disabled:opacity-40">
          <Plus size={15} /> Add
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-6 text-center text-sm text-text-muted">No products yet — pick one above to start the kit.</div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          {items.map((it) => {
            const p = byId.get(it.productId);
            const unit = p ? priceIn(p, currency) : null;
            return (
              <div key={it.productId} className="flex items-center gap-3 px-3 py-2.5 border-t border-border first:border-t-0 bg-white">
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-text-primary truncate">{p?.name ?? "Missing product"}{p?.status === "Inactive" && <span className="ml-2 text-xs text-warning">Inactive</span>}</div>
                  <div className="text-xs text-text-muted truncate">{p?.sku || "—"} · {p?.brand} · {unit == null ? <span className="text-warning">no {currency} price</span> : <Price value={unit} currency={currency} className="text-xs" />}</div>
                </div>
                <input
                  type="number" min={1} value={it.qty} aria-label={`Quantity of ${p?.name ?? "product"}`}
                  onChange={(e) => onChange(items.map((i) => (i.productId === it.productId ? { ...i, qty: Math.max(1, Math.round(Number(e.target.value)) || 1) } : i)))}
                  className="w-16 bg-white border border-border rounded-lg py-1.5 px-2 text-sm text-center font-numeric focus:border-brand-blue focus:outline-none"
                />
                <div className="w-24 text-right text-sm shrink-0">{unit == null ? <span className="text-text-muted">—</span> : <Price value={unit * it.qty} currency={currency} />}</div>
                <button type="button" onClick={() => onChange(items.filter((i) => i.productId !== it.productId))} aria-label="Remove component"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-danger hover:bg-[#F9FAFB] shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
