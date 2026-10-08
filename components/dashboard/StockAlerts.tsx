"use client";

import Link from "next/link";
import { PackageX } from "lucide-react";
import { Num } from "@/components/ui/Num";
import { useProductStore } from "@/lib/store/useProductStore";
import { useStock } from "@/lib/hooks/useStock";
import { usePurchaseOrders } from "@/lib/hooks/usePurchaseOrders";

const cardClass = "bg-white/70 backdrop-blur-xl rounded-2xl shadow-card border border-white/60 p-4 sm:p-6";

/** Products below their min buffer (worst first) plus what's already on order. Links through to Procurement. */
export function StockAlerts() {
  const products = useProductStore((s) => s.products);
  const { byProduct, isLoading } = useStock();
  const { data: pos = [] } = usePurchaseOrders();

  const low = products
    .map((p) => ({ p, s: byProduct.get(p.id) }))
    .filter((x) => x.s?.low)
    .sort((a, b) => (b.s!.suggested - a.s!.suggested) || (a.s!.available - b.s!.available));
  const open = pos.filter((po) => po.status === "Issued" || po.status === "Partially Received");
  const incomingUnits = open.reduce((n, po) => n + po.items.reduce((m, i) => m + Math.max(0, i.qtyOrdered - i.qtyReceived), 0), 0);
  const drafts = pos.filter((po) => po.status === "Draft").length;

  return (
    <div className={cardClass}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <h2 className="text-lg text-text-primary">Stock alerts</h2>
        <Link href="/procurement" className="text-xs text-brand-blue hover:underline">Open procurement →</Link>
      </div>
      <div className="flex gap-4 mt-1 text-xs text-text-muted flex-wrap">
        <span><Num className="text-text-secondary">{low.length}</Num> low</span>
        <span><Num className="text-text-secondary">{open.length}</Num> PO(s) on order · <Num className="text-text-secondary">{incomingUnits}</Num> unit(s) incoming</span>
        {drafts > 0 && <span><Num className="text-text-secondary">{drafts}</Num> draft PO(s)</span>}
      </div>

      {isLoading ? (
        <div className="text-center text-text-muted text-sm py-8">Loading…</div>
      ) : low.length === 0 ? (
        <div className="text-center text-text-muted text-sm py-8">Every product is above its min buffer</div>
      ) : (
        <div className="mt-4 space-y-1">
          {low.slice(0, 6).map(({ p, s }) => (
            <Link key={p.id} href="/procurement" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-alt transition-colors">
              <PackageX size={16} className={`shrink-0 ${s!.available < 0 ? "text-danger" : "text-warning"}`} />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-text-primary truncate">{p.name}</div>
                <div className="text-xs text-text-muted">{p.brand}</div>
              </div>
              <div className="text-xs text-right shrink-0">
                <div><Num className={s!.available < 0 ? "text-danger" : "text-text-primary"}>{s!.available}</Num><span className="text-text-muted"> / </span><Num className="text-text-secondary">{s!.minBuffer}</Num></div>
                <div className="text-text-muted">order <Num>{s!.suggested}</Num></div>
              </div>
            </Link>
          ))}
          {low.length > 6 && <div className="text-xs text-text-muted text-center pt-2">+<Num>{low.length - 6}</Num> more in Procurement</div>}
        </div>
      )}
    </div>
  );
}
