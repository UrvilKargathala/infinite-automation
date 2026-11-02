"use client";

import { exportSheet } from "@/lib/utils/tableExport";
import { useMemo, useState } from "react";
import { Download, FilePlus2, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Num } from "@/components/ui/Num";
import { useProductStore } from "@/lib/store/useProductStore";
import { useStock } from "@/lib/hooks/useStock";
import { usePurchaseOrders } from "@/lib/hooks/usePurchaseOrders";
import { PIPELINE_FACTOR, type StockStatus } from "@/lib/utils/inventory";
import { CreatePOModal, type DraftLine } from "./CreatePOModal";
import type { Product, VendorPO } from "@/types";
import { SkeletonTableRows } from "@/components/ui/Skeleton";
import { Select } from "@/components/ui/Select";

interface Row { product: Product; s: StockStatus; drafts: string[] }

const th = "px-4 py-3 text-xs uppercase tracking-wider text-text-muted font-normal text-left whitespace-nowrap";
const td = "px-4 py-3 text-sm";
const control = "glass-control border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary focus:border-brand-blue focus:outline-none";

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

  function handleExport() {
    exportSheet(
      rows.map(({ product, s }) => ({
        Product: product.name, SKU: product.sku, Brand: product.brand, "Free to sell": s.available, "In stock": s.physical,
        "Keep at least": s.minBuffer, Owed: s.shortage, Refill: s.bufferGap, "For open quotes": Math.round(s.pipelineShare * 10) / 10,
        "On order": s.incoming, "Suggested order": s.suggested,
      })),
      "Reorder queue", "infinite_reorder_queue_export.xlsx", "low-stock products",
    );
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

      <div className="glass rounded-3xl overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-border flex items-center gap-3 flex-wrap">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 z-10 -translate-y-1/2 pointer-events-none text-text-secondary" />
            <input className={`${control} w-full pl-9`} placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select className={control} value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
            <option value="">All brands</option>
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </Select>
          <span className="text-sm text-text-muted"><Num>{allRows.length}</Num> low</span>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="secondary" icon={Download} onClick={handleExport}>Export</Button>
            <Button icon={FilePlus2} disabled={picked === 0} onClick={openDraft}>
              {picked > 0 ? <>Draft PO · {selBrand} (<Num>{picked}</Num>)</> : "Draft PO"}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="bg-white/35">
                <th className={`${th} w-10`} />
                <th className={th}>Product</th>
                <th className={th}>Brand</th>
                <th className={th} title="Free to sell (in stock minus promised) / what you have in stock">Free / Stock</th>
                <th className={th} title="Keep at least: the lowest Free to sell you want to hold">Keep</th>
                <th className={th} title="Owed to customers: units confirmed deals need that you do not have">Owed</th>
                <th className={th} title="Units needed to get Free to sell back up to Keep">Refill</th>
                <th className={th} title={`Quotes: ${PIPELINE_FACTOR * 100}% of units on Draft/Sent quotes`}>Quotes</th>
                <th className={th} title="Already on issued vendor orders">On order</th>
                <th className={th} title="Owed + Refill + Quotes − On order">Suggest</th>
                <th className={th} title="How many you will order. Starts at the suggested number; you can change it.">Order</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonTableRows cols={11} />
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
                  <tr key={product.id} className={`border-t border-border ${isSel ? "bg-brand-gradient-tint" : "hover:bg-white/50"}`}>
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
                          className="w-20 glass-control border border-border rounded-lg py-1.5 px-2 text-sm font-numeric focus:border-brand-blue focus:outline-none" />
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
