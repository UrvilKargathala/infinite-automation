"use client";

import { useMemo, useState } from "react";
import { Search, PackagePlus } from "lucide-react";
import { Num } from "@/components/ui/Num";
import { Pagination } from "@/components/ui/Pagination";
import { useProductStore } from "@/lib/store/useProductStore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useStock } from "@/lib/hooks/useStock";
import { can } from "@/lib/utils/permissions";
import { StockAdjustModal } from "./StockAdjustModal";
import type { Product } from "@/types";

const PAGE_SIZE = 15;
const th = "px-4 py-3 text-xs uppercase tracking-wider text-text-muted font-normal text-left whitespace-nowrap";
const td = "px-4 py-3 text-sm";
const control = "bg-white border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary focus:border-brand-blue focus:outline-none";

/** Every product's stock: available / physical, reserved, incoming, min buffer, with Adjust stock. */
export function StockTable() {
  const products = useProductStore((s) => s.products);
  const role = useAuthStore((s) => s.user?.role ?? "Staff");
  const canAdjust = can(role, "editStock");
  const { byProduct, isLoading, isError } = useStock();
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [adjusting, setAdjusting] = useState<Product | null>(null);

  const brands = useMemo(() => [...new Set(products.map((p) => p.brand))].sort(), [products]);
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .filter((p) => !brand || p.brand === brand)
      .filter((p) => !lowOnly || byProduct.get(p.id)?.low)
      .filter((p) => !q || `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(q))
      .sort((a, b) => Number(!!byProduct.get(b.id)?.low) - Number(!!byProduct.get(a.id)?.low) || a.name.localeCompare(b.name));
  }, [products, byProduct, search, brand, lowOnly]);

  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const safePage = Math.min(page, totalPages || 1);
  const paged = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const lowCount = products.filter((p) => byProduct.get(p.id)?.low).length;

  if (isError) return <div className="text-center text-danger text-sm py-16">Couldn&apos;t load stock levels</div>;

  // Dialogs sit outside the card: backdrop-blur makes the card the containing block for position:fixed.
  return (
    <>
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-card border border-white/60 overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-border flex items-center gap-3 flex-wrap">
        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input className={`${control} w-full pl-9`} placeholder="Search products..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className={control} value={brand} onChange={(e) => { setBrand(e.target.value); setPage(1); }}>
          <option value="">All brands</option>
          {brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <label className="inline-flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none">
          <input type="checkbox" checked={lowOnly} onChange={(e) => { setLowOnly(e.target.checked); setPage(1); }} className="accent-brand-blue" />
          Low stock only <span className="text-text-muted">(<Num>{lowCount}</Num>)</span>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="bg-surface-alt">
              <th className={th}>Product</th><th className={th}>SKU</th><th className={th}>Brand</th><th className={th}>Category</th>
              <th className={th} title="Available (physical minus reserved) / physical">Avail / Phys</th>
              <th className={th}>Reserved</th><th className={th}>Incoming</th><th className={th}>Min buffer</th><th className={th}>Status</th>
              {canAdjust && <th className={`${th} text-right`}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={10} className="text-center text-text-muted py-12">Loading stock…</td></tr>
            ) : paged.length === 0 ? (
              <tr><td colSpan={10} className="text-center text-text-muted py-12">No products found</td></tr>
            ) : paged.map((p) => {
              const s = byProduct.get(p.id);
              return (
                <tr key={p.id} className="border-t border-border hover:bg-[#F9FAFB]/60">
                  <td className={`${td} text-text-primary`}>{p.name}</td>
                  <td className={`${td} font-mono text-xs text-brand-blue`}>{p.sku || "—"}</td>
                  <td className={td}>{p.brand}</td>
                  <td className={td}>{p.category}</td>
                  <td className={`${td} whitespace-nowrap`}>
                    <Num className={(s?.available ?? 0) < 0 ? "text-danger" : "text-text-primary"}>{s?.available ?? 0}</Num>
                    <span className="text-text-muted"> / </span><Num className="text-text-secondary">{s?.physical ?? 0}</Num>
                  </td>
                  <td className={td}><Num className="text-text-secondary">{s?.allocated ?? 0}</Num></td>
                  <td className={td}><Num className={s?.incoming ? "text-brand-blue" : "text-text-muted"}>{s?.incoming ?? 0}</Num></td>
                  <td className={td}><Num className="text-text-secondary">{s?.minBuffer ?? 0}</Num></td>
                  <td className={td}>
                    {s?.low
                      ? <span className="inline-flex px-2.5 py-1 rounded-full text-xs bg-danger/10 text-danger">Low stock</span>
                      : <span className="inline-flex px-2.5 py-1 rounded-full text-xs bg-success/10 text-success">OK</span>}
                  </td>
                  {canAdjust && (
                    <td className={`${td} text-right`}>
                      <button onClick={() => setAdjusting(p)} aria-label="Adjust stock" title="Adjust stock"
                        className="w-8 h-8 rounded-full inline-flex items-center justify-center text-text-secondary hover:text-brand-blue hover:bg-[#F9FAFB] transition-colors">
                        <PackagePlus size={15} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={safePage} totalPages={totalPages} totalItems={rows.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
      <StockAdjustModal product={adjusting} stock={adjusting ? byProduct.get(adjusting.id) : undefined} onClose={() => setAdjusting(null)} />
    </>
  );
}
