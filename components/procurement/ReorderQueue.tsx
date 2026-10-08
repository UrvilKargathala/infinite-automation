"use client";

import { useMemo, useState } from "react";
import { FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Num } from "@/components/ui/Num";
import { useProductStore } from "@/lib/store/useProductStore";
import { useStock } from "@/lib/hooks/useStock";
import { usePurchaseOrders } from "@/lib/hooks/usePurchaseOrders";
import { PIPELINE_FACTOR, type StockStatus } from "@/lib/utils/inventory";
import { CreatePOModal, type DraftLine } from "./CreatePOModal";
import type { Product, VendorPO } from "@/types";

interface Row { product: Product; s: StockStatus; drafts: string[] }

const th = "py-2.5 pr-4 text-xs uppercase tracking-wider text-text-muted font-normal text-left whitespace-nowrap";
const td = "py-3 pr-4 text-sm";

/** Every product where available < min buffer, grouped by brand, with the suggested order and its breakdown. */
export function ReorderQueue({ onPOCreated }: { onPOCreated: (po: VendorPO) => void }) {
  const products = useProductStore((s) => s.products);
  const { byProduct, isLoading, isError } = useStock();
  const { data: pos = [] } = usePurchaseOrders();
  const [selBrand, setSelBrand] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<number, string>>({}); // productId → order qty being edited
  const [modalLines, setModalLines] = useState<DraftLine[] | null>(null);

  const groups = useMemo(() => {
    // A product already on a Draft PO is flagged so nobody orders it twice.
    const drafts = new Map<number, string[]>();
    for (const po of pos.filter((p) => p.status === "Draft")) {
      for (const i of po.items) drafts.set(i.productId, [...(drafts.get(i.productId) ?? []), po.number]);
    }
    const byBrand = new Map<string, Row[]>();
    for (const product of products) {
      const s = byProduct.get(product.id);
      if (!s?.low) continue;
      byBrand.set(product.brand, [...(byBrand.get(product.brand) ?? []), { product, s, drafts: drafts.get(product.id) ?? [] }]);
    }
    return [...byBrand.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([brand, rows]) => ({ brand, rows: rows.sort((a, b) => b.s.suggested - a.s.suggested) }));
  }, [products, byProduct, pos]);

  function toggle(brand: string, row: Row) {
    const next = selBrand === brand ? { ...selected } : {};
    if (row.product.id in next) delete next[row.product.id];
    else next[row.product.id] = String(Math.max(1, row.s.suggested));
    setSelected(next);
    setSelBrand(Object.keys(next).length > 0 ? brand : null);
  }

  function openDraft(brand: string) {
    const rows = groups.find((g) => g.brand === brand)?.rows ?? [];
    setModalLines(rows.filter((r) => r.product.id in selected).map((r) => ({ product: r.product, qty: Number(selected[r.product.id]) || 1 })));
  }

  if (isLoading) return <div className="text-center text-text-muted text-sm py-16">Loading stock…</div>;
  if (isError) return <div className="text-center text-danger text-sm py-16">Couldn&apos;t load stock levels</div>;
  if (groups.length === 0) {
    return (
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-card border border-white/60 text-center py-16 px-6">
        <div className="text-text-primary">Nothing to reorder</div>
        <div className="text-sm text-text-muted mt-1">Every product is at or above its min buffer. Set min buffers in Master File to start tracking.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        Suggested order = shortage + buffer gap + <Num>{PIPELINE_FACTOR * 100}</Num>% of open-quote demand − already incoming, rounded up.
        Tick products within one brand to draft a PO.
      </p>

      {groups.map(({ brand, rows }) => {
        const picked = selBrand === brand ? Object.keys(selected).length : 0;
        return (
          <div key={brand} className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-card border border-white/60 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-lg text-text-primary">{brand} <span className="text-sm text-text-muted">· <Num>{rows.length}</Num> low</span></h2>
              <Button icon={FilePlus2} disabled={picked === 0} onClick={() => openDraft(brand)}>
                {picked > 0 ? <>Draft PO (<Num>{picked}</Num>)</> : "Draft PO"}
              </Button>
            </div>

            <div className="overflow-x-auto mt-3">
              <table className="w-full min-w-[960px]">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className={`${th} w-8`} />
                    <th className={th}>Product</th>
                    <th className={th} title="Available / min buffer">Avail / Min</th>
                    <th className={th} title="Confirmed orders with no stock behind them">Shortage</th>
                    <th className={th} title="Units to bring available back up to min buffer">Buffer gap</th>
                    <th className={th} title={`${PIPELINE_FACTOR * 100}% of units on Draft/Sent quotes`}>Pipeline</th>
                    <th className={th} title="Already on issued POs">Incoming</th>
                    <th className={th}>Suggested</th>
                    <th className={th}>Order qty</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const { product, s } = row;
                    const isSel = selBrand === brand && product.id in selected;
                    const otherBrand = selBrand !== null && selBrand !== brand;
                    return (
                      <tr key={product.id} className={`border-b border-border/40 last:border-0 ${isSel ? "bg-brand-gradient-tint" : ""}`}>
                        <td className={td}>
                          <input type="checkbox" checked={isSel} disabled={otherBrand} onChange={() => toggle(brand, row)}
                            title={otherBrand ? "One PO per brand — clear the other selection first" : undefined}
                            aria-label={`Select ${product.name}`} className="accent-brand-blue" />
                        </td>
                        <td className={td}>
                          <div className="text-text-primary">{product.name}</div>
                          <div className="text-xs text-text-muted">{product.sku || "—"} · {product.category}</div>
                          {row.drafts.length > 0 && <div className="text-xs text-warning mt-0.5">On draft {row.drafts.join(", ")}</div>}
                        </td>
                        <td className={td}><Num className={s.available < 0 ? "text-danger" : ""}>{s.available}</Num><span className="text-text-muted"> / </span><Num>{s.minBuffer}</Num></td>
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
        );
      })}

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
