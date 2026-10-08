"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Printer, Send, PackageCheck, XCircle, CheckCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Num } from "@/components/ui/Num";
import { Price } from "@/components/ui/Price";
import { useProductStore } from "@/lib/store/useProductStore";
import { usePurchaseOrders, PO_QUERY_KEY } from "@/lib/hooks/usePurchaseOrders";
import { STOCK_QUERY_KEY } from "@/lib/hooks/useStock";
import { printPO } from "@/lib/utils/poPdf";
import { ReceiveDeliveryModal } from "./ReceiveDeliveryModal";
import type { VendorPO, VendorPOStatus } from "@/types";

export const poStatusColor: Record<VendorPOStatus, string> = {
  Draft: "#64748B",
  Issued: "#3B82F6",
  "Partially Received": "#F59E0B",
  Received: "#10B981",
  Cancelled: "#EF4444",
};

const th = "py-2.5 pr-4 text-xs uppercase tracking-wider text-text-muted font-normal text-left whitespace-nowrap";
const td = "py-3 pr-4 text-sm align-top";

function poTotal(po: VendorPO): number | null {
  if (po.items.every((i) => i.unitCost == null)) return null;
  return Math.round(po.items.reduce((s, i) => s + (i.unitCost ?? 0) * i.qtyOrdered, 0) * 100) / 100;
}

/** All vendor POs, newest first, with issue / receive / print / cancel / close-short actions. */
export function VendorPOList({ highlightId }: { highlightId?: number | null }) {
  const { data: pos, isLoading, isError } = usePurchaseOrders();
  const products = useProductStore((s) => s.products);
  const nameOf = new Map(products.map((p) => [p.id, p.name]));
  const queryClient = useQueryClient();
  const [receiving, setReceiving] = useState<VendorPO | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function act(po: VendorPO, action: "issue" | "cancel" | "close", confirmText: string, done: string) {
    if (!window.confirm(confirmText)) return;
    setBusyId(po.id);
    const res = await fetch(`/api/procurement/pos/${po.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const body = await res.json();
    setBusyId(null);
    if (!res.ok) {
      toast.error(body.error ?? "Couldn't update the PO");
      return;
    }
    queryClient.invalidateQueries({ queryKey: PO_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEY });
    toast.success(done);
  }

  if (isLoading) return <div className="text-center text-text-muted text-sm py-16">Loading purchase orders…</div>;
  if (isError || !pos) return <div className="text-center text-danger text-sm py-16">Couldn&apos;t load purchase orders</div>;

  // Dialogs sit outside the card: backdrop-blur makes the card the containing block for position:fixed.
  return (
    <>
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-card border border-white/60 p-4 sm:p-6">
      {pos.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-text-primary">No purchase orders yet</div>
          <div className="text-sm text-text-muted mt-1">Draft one from the Reorder queue.</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b border-border/60">
                <th className={th}>PO</th><th className={th}>Vendor</th><th className={th}>Items</th>
                <th className={th}>Received</th><th className={th}>Total</th><th className={th}>Status</th><th className={th}>Created</th><th className={`${th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pos.map((po) => {
                const ordered = po.items.reduce((s, i) => s + i.qtyOrdered, 0);
                const received = po.items.reduce((s, i) => s + i.qtyReceived, 0);
                return (
                  <tr key={po.id} className={`border-b border-border/40 last:border-0 ${po.id === highlightId ? "bg-brand-gradient-tint" : ""}`}>
                    <td className={`${td} font-numeric text-brand-blue whitespace-nowrap`}>{po.number}</td>
                    <td className={td}>
                      <div className="text-text-primary">{po.vendorName}</div>
                      {po.vendorName !== po.brand && <div className="text-xs text-text-muted">{po.brand}</div>}
                    </td>
                    <td className={`${td} max-w-[320px]`}>
                      <div className="text-text-primary"><Num>{po.items.length}</Num> product(s) · <Num>{ordered}</Num> unit(s)</div>
                      <div className="text-xs text-text-muted truncate">
                        {po.items.map((i) => `${nameOf.get(i.productId) ?? "#" + i.productId} ×${i.qtyOrdered}`).join(", ")}
                      </div>
                    </td>
                    <td className={td}><Num>{received}</Num><span className="text-text-muted"> / </span><Num>{ordered}</Num></td>
                    <td className={td}><Price value={poTotal(po)} currency={po.currency} /></td>
                    <td className={td}><Badge color={poStatusColor[po.status]}>{po.status}</Badge></td>
                    <td className={`${td} text-text-muted whitespace-nowrap`}>{po.createdAt.slice(0, 10)}</td>
                    <td className={`${td} text-right`}>
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {po.status === "Draft" && (
                          <Button size="sm" icon={Send} disabled={busyId === po.id}
                            onClick={() => act(po, "issue", `Issue ${po.number} to ${po.vendorName}? It will count as incoming stock.`, `${po.number} issued`)}>Issue</Button>
                        )}
                        {(po.status === "Issued" || po.status === "Partially Received") && (
                          <Button size="sm" icon={PackageCheck} onClick={() => setReceiving(po)}>Receive</Button>
                        )}
                        {po.status === "Partially Received" && (
                          <Button size="sm" variant="secondary" icon={CheckCheck} disabled={busyId === po.id}
                            onClick={() => act(po, "close", `Close ${po.number} short? Anything still outstanding stops counting as incoming.`, `${po.number} closed`)}>Close short</Button>
                        )}
                        <Button size="sm" variant="secondary" icon={Printer} onClick={() => printPO(po, products)}>PDF</Button>
                        {(po.status === "Draft" || po.status === "Issued") && (
                          <Button size="sm" variant="ghost" icon={XCircle} disabled={busyId === po.id}
                            onClick={() => act(po, "cancel", `Cancel ${po.number}?`, `${po.number} cancelled`)}>Cancel</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
      {receiving && <ReceiveDeliveryModal po={receiving} products={products} onClose={() => setReceiving(null)} />}
    </>
  );
}
