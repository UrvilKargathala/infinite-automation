"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Printer, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Num } from "@/components/ui/Num";
import { Skeleton } from "@/components/ui/Skeleton";
import type { SlipLine } from "@/lib/inventoryDb";
import type { Project } from "@/types";

interface SlipData { project: Project; quoteNumber: string | null; lines: SlipLine[] }

async function fetchSlip(id: number): Promise<SlipData> {
  const res = await fetch(`/api/projects/${id}/order-slip`);
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Couldn't load the order slip");
  return body;
}

const card = "bg-white rounded-2xl shadow-card p-4 sm:p-6 print:shadow-none print:p-0 print:mb-6";
const th = "py-2 pr-4 font-normal text-left";

function ProductCell({ line }: { line: SlipLine }) {
  return (
    <td className="py-3 pr-4">
      <div className="text-text-primary">{line.name}</div>
      <div className="text-xs text-text-muted">{line.brand}{line.sku ? ` · ${line.sku}` : ""}</div>
    </td>
  );
}

/** Internal packing slip for a confirmed project: what can go out now, what is waiting on stock. */
export function OrderSlip({ projectId }: { projectId: number }) {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["order-slip", projectId], queryFn: () => fetchSlip(projectId) });
  const [shipQty, setShipQty] = useState<Record<number, number>>({});
  const [shipping, setShipping] = useState(false);

  // Default every "ship now" box to everything that is ready.
  useEffect(() => {
    if (data) setShipQty(Object.fromEntries(data.lines.map((l) => [l.allocationId, l.ready])));
  }, [data]);

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-48 w-full" /><Skeleton className="h-48 w-full" /></div>;
  if (error || !data) return <div className="text-center text-danger py-16">{error instanceof Error ? error.message : "Couldn't load the order slip"}</div>;

  const { project, quoteNumber, lines } = data;
  const ready = lines.filter((l) => l.ready > 0);
  const backordered = lines.filter((l) => l.backordered > 0);
  const shipped = lines.filter((l) => l.shippedQty > 0);
  const totalReady = ready.reduce((s, l) => s + l.ready, 0);
  const totalBack = backordered.reduce((s, l) => s + l.backordered, 0);
  const toShip = ready.map((l) => ({ allocationId: l.allocationId, qty: shipQty[l.allocationId] ?? 0 })).filter((l) => l.qty > 0);
  const invalid = ready.some((l) => {
    const q = shipQty[l.allocationId] ?? 0;
    return !Number.isInteger(q) || q < 0 || q > l.ready;
  });

  async function handleShip() {
    const units = toShip.reduce((s, l) => s + l.qty, 0);
    if (!window.confirm(`Mark ${units} unit(s) as shipped? They will be taken out of physical stock.`)) return;
    setShipping(true);
    const res = await fetch(`/api/projects/${projectId}/ship`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines: toShip }),
    });
    const body = await res.json();
    setShipping(false);
    if (!res.ok) {
      toast.error(body.error ?? "Couldn't mark as shipped");
      // The slip on screen is probably out of date (shipped or received elsewhere) — reload it.
      queryClient.invalidateQueries({ queryKey: ["order-slip", projectId] });
      return;
    }
    queryClient.setQueryData<SlipData>(["order-slip", projectId], { ...data!, lines: body.lines });
    toast.success(`${units} unit(s) shipped`);
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap print:hidden">
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary">
          <ArrowLeft size={16} /> Projects
        </Link>
        <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Print</Button>
      </div>

      <div className="mt-4 mb-6">
        <h1 className="text-3xl font-light text-text-primary">Order slip</h1>
        <p className="text-sm text-text-secondary mt-1">Internal fulfilment sheet — not for the customer.</p>
      </div>

      <div className={`${card} mb-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm`}>
        <div><div className="text-xs text-text-muted">Customer</div><div className="text-text-primary">{project.customerName}</div></div>
        <div><div className="text-xs text-text-muted">Site</div><div className="text-text-primary">{project.siteAddress || "—"}</div></div>
        <div><div className="text-xs text-text-muted">Quote</div><div className="text-text-primary">{quoteNumber ?? "—"}</div></div>
        <div><div className="text-xs text-text-muted">Confirmed</div><div className="text-text-primary">{project.confirmedAt?.slice(0, 10) ?? "Not yet"}</div></div>
      </div>

      {!project.confirmedAt ? (
        <div className={`${card} text-center text-text-muted text-sm py-12`}>
          This project isn&apos;t confirmed yet. Confirm it from the project panel to reserve stock.
        </div>
      ) : (
        <>
          <div className={`${card} mb-4`}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-lg text-text-primary">Ready to ship <span className="text-sm text-text-muted">· <Num>{totalReady}</Num> unit(s)</span></h2>
              {ready.length > 0 && project.stage !== "Cancelled" && (
                <Button icon={Truck} onClick={handleShip} disabled={shipping || invalid || toShip.length === 0} className="print:hidden">
                  {shipping ? "Shipping…" : "Mark shipped"}
                </Button>
              )}
            </div>
            {ready.length === 0 ? (
              <div className="text-center text-text-muted text-sm py-8">Nothing is ready to ship yet</div>
            ) : (
              <table className="w-full text-sm mt-4">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-text-muted border-b border-border/60">
                    <th className={th}>Product</th><th className={th}>Ordered</th><th className={th}>Ready</th>
                    <th className={`${th} print:hidden`}>Ship now</th><th className={`${th} hidden print:table-cell`}>Packed ✓</th>
                  </tr>
                </thead>
                <tbody>
                  {ready.map((l) => (
                    <tr key={l.allocationId} className="border-b border-border/40 last:border-0">
                      <ProductCell line={l} />
                      <td className="py-3 pr-4"><Num>{l.qty}</Num></td>
                      <td className="py-3 pr-4"><Num className="text-success">{l.ready}</Num></td>
                      <td className="py-3 pr-4 print:hidden">
                        <input
                          type="number"
                          min={0}
                          max={l.ready}
                          step={1}
                          value={shipQty[l.allocationId] ?? 0}
                          onChange={(e) => setShipQty({ ...shipQty, [l.allocationId]: Number(e.target.value) })}
                          aria-label={`Ship now: ${l.name}`}
                          className="w-20 bg-white border border-border rounded-lg py-1.5 px-2 text-sm font-numeric focus:border-brand-blue focus:outline-none"
                        />
                      </td>
                      <td className="py-3 pr-4 hidden print:table-cell">☐</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className={`${card} mb-4`}>
            <h2 className="text-lg text-text-primary">Backordered <span className="text-sm text-text-muted">· <Num>{totalBack}</Num> unit(s)</span></h2>
            {backordered.length === 0 ? (
              <div className="text-center text-text-muted text-sm py-8">Nothing waiting on stock</div>
            ) : (
              <table className="w-full text-sm mt-4">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-text-muted border-b border-border/60">
                    <th className={th}>Product</th><th className={th}>Ordered</th><th className={th}>Waiting on stock</th>
                  </tr>
                </thead>
                <tbody>
                  {backordered.map((l) => (
                    <tr key={l.allocationId} className="border-b border-border/40 last:border-0">
                      <ProductCell line={l} />
                      <td className="py-3 pr-4"><Num>{l.qty}</Num></td>
                      <td className="py-3 pr-4"><Num className="text-warning">{l.backordered}</Num></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {shipped.length > 0 && (
            <div className={card}>
              <h2 className="text-lg text-text-primary">Already shipped</h2>
              <table className="w-full text-sm mt-4">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-text-muted border-b border-border/60">
                    <th className={th}>Product</th><th className={th}>Ordered</th><th className={th}>Shipped</th>
                  </tr>
                </thead>
                <tbody>
                  {shipped.map((l) => (
                    <tr key={l.allocationId} className="border-b border-border/40 last:border-0">
                      <ProductCell line={l} />
                      <td className="py-3 pr-4"><Num>{l.qty}</Num></td>
                      <td className="py-3 pr-4"><Num>{l.shippedQty}</Num></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
