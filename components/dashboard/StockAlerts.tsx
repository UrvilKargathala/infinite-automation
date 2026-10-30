"use client";

import Link from "next/link";
import { PackageX } from "lucide-react";
import { Num } from "@/components/ui/Num";
import { useProductStore } from "@/lib/store/useProductStore";
import { useStock } from "@/lib/hooks/useStock";
import { usePurchaseOrders } from "@/lib/hooks/usePurchaseOrders";
import { SkeletonList } from "@/components/ui/Skeleton";

const cardClass = "glass lift rounded-3xl p-4 sm:p-6";

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
    <div className={`${cardClass} flex flex-col`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg text-text-primary">Stock alerts</h2>
            {low.length > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-danger/10 text-danger"><Num>{low.length}</Num> low</span>}
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            <Num>{open.length}</Num> PO{open.length === 1 ? "" : "s"} on order · <Num>{incomingUnits}</Num> unit{incomingUnits === 1 ? "" : "s"} incoming
            {drafts > 0 && <> · <Num>{drafts}</Num> draft</>}
          </p>
        </div>
        <Link href="/procurement" className="text-xs text-brand-blue hover:underline shrink-0">View all →</Link>
      </div>

      {isLoading ? (
        <SkeletonList rows={4} className="mt-4" />
      ) : low.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center text-text-muted text-sm py-8">Every product is above its min buffer</div>
      ) : (
        <div className="mt-3 space-y-0.5 flex-1">
          {low.slice(0, 5).map(({ p, s }) => (
            <Link key={p.id} href="/procurement" className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-white/50 transition-colors">
              <PackageX size={16} className={`shrink-0 ${s!.available < 0 ? "text-danger" : "text-warning"}`} />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-text-primary truncate">{p.name}</div>
                <div className="text-xs text-text-muted truncate">
                  <Num className={s!.available < 0 ? "text-danger" : "text-text-secondary"}>{s!.available}</Num> available · min <Num>{s!.minBuffer}</Num>
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-brand-gradient-tint text-brand-blue shrink-0 whitespace-nowrap">
                Order <Num>{s!.suggested}</Num>
              </span>
            </Link>
          ))}
          {low.length > 5 && (
            <Link href="/procurement" className="block text-xs text-brand-blue hover:underline text-center pt-2">+<Num>{low.length - 5}</Num> more in Procurement</Link>
          )}
        </div>
      )}
    </div>
  );
}
