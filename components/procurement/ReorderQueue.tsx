"use client";

import { useMemo, useState } from "react";
import { FilePlus2, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Num } from "@/components/ui/Num";
import { useProductStore } from "@/lib/store/useProductStore";
import { useStock } from "@/lib/hooks/useStock";
import { usePurchaseOrders } from "@/lib/hooks/usePurchaseOrders";
import { PIPELINE_FACTOR, type StockStatus } from "@/lib/utils/inventory";
import { CreatePOModal, type DraftLine } from "./CreatePOModal";
import type { Product, VendorPO } from "@/types";

interface Row { product: Product; s: StockStatus; drafts: string[] }

const th = "px-4 py-3 text-xs uppercase tracking-wider text-text-muted font-normal text-left whitespace-nowrap";
const td = "px-4 py-3 text-sm";
const control = "bg-white border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary focus:border-brand-blue focus:outline-none";

/** Every product where available < min buffer, in one table, with the suggested order and its breakdown. */
export function ReorderQueue({ onPOCreated }: { onPOCreated: (po: VendorPO) => void }) {
  const products = useProductStore((s) => s.products);
  const { byProduct, isLoading, isError } = useStock();
  const { data: pos = [] } = usePurchaseOrders();
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [selBrand, setSelBrand] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<number, string>>({}); // productId → order qty being edited
  const [modalLines, setModalLines] = useState<DraftLine[] | null>(null);

  const allRows = useMemo(() => {
    // A product already on a Draft PO is flagged so nobody orders it twice.
    const drafts = new Map<number, string[]>();
    for (const po of pos.filter((p) => p.status === "Draft")) {
      for (const i of po.items) drafts.set(i.productId, [...(drafts.get(i.productId) ?? []), po.number]);
    }
    const rows: Row[] = [];
    for (const product of products) {
      const s = byProduct.get(product.id);
      if (s?.low) rows.push({ product, s, drafts: drafts.get(product.id) ?? [] });
    }
    return rows.sort((a, b) => a.product.brand.localeCompare(b.product.brand) || b.s.suggested - a.s.suggested);
  }, [products, byProduct, pos]);

  const brands = [...new Set(allRows.map((r) => r.product.brand))];
  const q = search.trim().toLowerCase();
  const rows = allRows
    .filter((r) => !brandFilter || r.product.brand === brandFilter)
    .filter((r) => !q || `${r.product.name} ${r.product.sku} ${r.product.category}`.toLowerCase().includes(q));
  const picked = Object.keys(selected).length;

  function toggle(row: Row) {
    const brand = row.product.brand;
    const next = selBrand === brand ? { ...selected } : {};
    if (row.product.id in next) delete next[row.product.id];
    else next[row.product.id] = String(Math.max(1, row.s.suggested));
    setSelected(next);
    setSelBrand(Object.keys(next).length > 0 ? brand : null);
  }

  function openDraft() {
    setModalLines(allRows.filter((r) => r.product.id in selected).map((r) => ({ product: r.product, qty: Number(selected[r.product.id]) || 1 })));
  }

  if (isError) return <div className="text-center text-danger text-sm py-16">Couldn&apos;t load stock levels</div>;

  return (
    <div className="space-y-3">
      <p className="text-sm text-text-secondary">
        Suggested order = shortage + buffer gap + <Num>{PIPELINE_FACTOR * 100}</Num>% of open-quote demand − already incoming, rounded up.
        Tick products of one brand to draft a PO.
      </p>

      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-card border border-white/60 overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-border flex items-center gap-3 flex-wrap">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input className={`${control} w-full pl-9`} placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className={control} value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
            <option value="">All brands</option>
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <span className="text-sm text-text-muted"><Num>{allRows.length}</Num> low</span>
          <div className="ml-auto">
            <Button icon={FilePlus2} disabled={picked === 0} onClick={openDraft}>
              {picked > 0 ? <>Draft PO · {selBrand} (<Num>{picked}</Num>)</> : "Draft PO"}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="bg-surface-alt">
                <th className={`${th} w-10`} />
                <th className={th}>Product</th>
                <th className={th}>Brand</th>
                <th className={th} title="Available (physical minus reserved) / physical">Avail / Phys</th>
                <th className={th}>Min buffer</th>
                <th className={th} title="Confirmed orders with no stock behind them">Shortage</th>
                <th className={th} title="Units to bring available back up to min buffer">Buffer gap</th>
                <th className={th} title={`${PIPELINE_FACTOR * 100}% of units on Draft/Sent quotes`}>Pipeline</th>
                <th className={th} title="Already on issued POs">Incoming</th>
                <th className={th}>Suggested</th>
                <th className={th}>Order qty</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={11} className="text-center text-text-muted py-12">Loading stock…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-12">
                  <div className="text-text-primary">Nothing to reorder</div>
                  <div className="text-sm text-text-muted mt-1">Every product is at or above its min buffer. Set min buffers in the Stock tab.</div>
                </td></tr>
              ) : rows.map((row) => {
                const { product, s } = row;
                const isSel = product.id in selected;
                const otherBrand = selBrand !== null && selBrand !== product.brand;
                return (
                  <tr key={product.id} className={`border-t border-border ${isSel ? "bg-brand-gradient-tint" : "hover:bg-[#F9FAFB]/60"}`}>
                    <td className={td}>
                      <input type="checkbox" checked={isSel} disabled={otherBrand} onChange={() => toggle(row)}
                        title={otherBrand ? "One PO per brand — clear the other selection first" : undefined}
                        aria-label={`Select ${product.name}`} className="accent-brand-blue" />
                    </td>
                    <td className={td}>
                      <div className="text-text-primary">{product.name}</div>
                      <div className="text-xs text-text-muted">{product.sku || "—"} · {product.category}</div>
                      {row.drafts.length > 0 && <div className="text-xs text-warning mt-0.5">On draft {row.drafts.join(", ")}</div>}
                    </td>
                    <td className={td}>{product.brand}</td>
                    <td className={`${td} whitespace-nowrap`}>
                      <Num className={s.available < 0 ? "text-danger" : "text-text-primary"}>{s.available}</Num>
                      <span className="text-text-muted"> / </span><Num className="text-text-secondary">{s.physical}</Num>
                    </td>
                    <td className={td}><Num>{s.minBuffer}</Num></td>
                    <td className={td}><Num className={s.shortage > 0 ? "text-danger" : "text-text-muted"}>{s.shortage}</Num></td>
                    <td className={td}><Num>{s.bufferGap}</Num></td>
                    <td className={td}>
                      <Num>{+s.pipelineShare.toFixed(1)}</Num>
                      {s.quoted > 0 && <div className="text-xs text-text-muted">of <Num>{s.quoted}</Num> quoted</div>}
                    </td>
                    <td className={td}><Num className={s.incoming > 0 ? "text-brand-blue" : "text-text-muted"}>{s.incoming > 0 ? `−${s.incoming}` : 0}</Num></td>
                    <td className={td}><Num className="text-text-primary">{s.suggested}</Num></td>
                    <td className={td}>
                      {isSel ? (
                        <input type="number" min={1} step={1} value={selected[product.id]}
                          onChange={(e) => setSelected({ ...selected, [product.id]: e.target.value })}
                          aria-label={`Order quantity for ${product.name}`}
                          className="w-20 bg-white border border-border rounded-lg py-1.5 px-2 text-sm font-numeric focus:border-brand-blue focus:outline-none" />
                      ) : <span className="text-text-muted">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalLines && selBrand && (
        <CreatePOModal
          brand={selBrand}
          lines={modalLines}
          onClose={() => setModalLines(null)}
          onCreated={(po) => {
            setModalLines(null);
            setSelected({});
            setSelBrand(null);
            onPOCreated(po);
          }}
        />
      )}
    </div>
  );
}
