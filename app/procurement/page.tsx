"use client";

import { useEffect, useState } from "react";
import { useProductStore } from "@/lib/store/useProductStore";
import { usePurchaseOrders } from "@/lib/hooks/usePurchaseOrders";
import { ReorderQueue } from "@/components/procurement/ReorderQueue";
import { VendorPOList } from "@/components/procurement/VendorPOList";
import { StockTable } from "@/components/procurement/StockTable";
import { TablePageSkeleton } from "@/components/ui/TablePageSkeleton";
import { Num } from "@/components/ui/Num";

type Tab = "stock" | "reorder" | "pos";

export default function ProcurementPage() {
  const { fetchAll, loaded } = useProductStore();
  const { data: pos = [] } = usePurchaseOrders();
  const [tab, setTab] = useState<Tab>("stock");
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const openCount = pos.filter((p) => p.status === "Draft" || p.status === "Issued" || p.status === "Partially Received").length;

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (!loaded) return <TablePageSkeleton statCards={0} />;

  return (
    <div>
      <h1 className="text-3xl font-light text-text-primary">Procurement</h1>
      <p className="text-sm text-text-secondary mt-1">What to reorder, and what&apos;s on order from vendors</p>

      <div className="inline-flex gap-1 p-1 rounded-full bg-white shadow-card mt-6 mb-4">
        {([["stock", "Stock"], ["reorder", "Reorder queue"], ["pos", "Vendor POs"]] as const).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${tab === t ? "bg-brand-gradient text-white" : "text-text-secondary hover:text-text-primary"}`}
          >
            {label}
            {t === "pos" && openCount > 0 && <Num className={`ml-1.5 text-xs ${tab === t ? "text-white/80" : "text-text-muted"}`}>{openCount}</Num>}
          </button>
        ))}
      </div>

      {tab === "stock" ? (
        <StockTable />
      ) : tab === "reorder" ? (
        <ReorderQueue onPOCreated={(po) => { setHighlightId(po.id); setTab("pos"); }} />
      ) : (
        <VendorPOList highlightId={highlightId} />
      )}
    </div>
  );
}
