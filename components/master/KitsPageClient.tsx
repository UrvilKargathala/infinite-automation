"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Boxes, CheckCircle, Download, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import { MasterTabs } from "./MasterTabs";
import { KitModal } from "./KitModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Num } from "@/components/ui/Num";
import { Price } from "@/components/ui/Price";
import { Select } from "@/components/ui/Select";
import { TablePageSkeleton } from "@/components/ui/TablePageSkeleton";
import { useKitActions, useKits } from "@/lib/hooks/useKits";
import { useStock } from "@/lib/hooks/useStock";
import { useCurrency } from "@/lib/hooks/useCurrency";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useProductStore } from "@/lib/store/useProductStore";
import { can } from "@/lib/utils/permissions";
import { kitCanBuild, kitPricing, kitWarnings } from "@/lib/utils/kits";
import { exportKits, parseKits } from "@/lib/utils/kitExcel";
import type { Kit } from "@/types";
import { StatCard } from "@/components/ui/StatCard";

export function KitsPageClient() {
  const role = useAuthStore((s) => s.user?.role ?? "Purchase");
  const canManage = can(role, "editProducts");
  const canImport = can(role, "excelImport");
  const currency = useCurrency();
  const products = useProductStore((s) => s.products);
  const productsLoaded = useProductStore((s) => s.loaded);
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const { kits, isLoading } = useKits();
  const { byProduct } = useStock();
  const { remove, importKits } = useKitActions();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [modal, setModal] = useState<{ open: boolean; kit: Kit | null }>({ open: false, kit: null });
  const fileRef = useRef<HTMLInputElement>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return kits
      .filter((k) => !status || k.status === status)
      .filter((k) => !q || k.sku.toLowerCase().includes(q) || k.name.toLowerCase().includes(q) || k.items.some((i) => byId.get(i.productId)?.name.toLowerCase().includes(q)))
      .map((k) => ({ kit: k, pricing: kitPricing(k, byId, currency), warnings: kitWarnings(k, byId, currency), canBuild: kitCanBuild(k, (id) => byProduct.get(id)?.available) }));
  }, [kits, status, search, byId, currency, byProduct]);

  if (isLoading || !productsLoaded) return <TablePageSkeleton statCards={3} />;

  const needAttention = kits.filter((k) => kitWarnings(k, byId, currency).length > 0).length;
  const stats = [
    { label: "Total kits", value: kits.length, icon: Boxes },
    { label: "Active", value: kits.filter((k) => k.status === "Active").length, icon: CheckCircle },
    { label: "Need attention", value: needAttention, icon: AlertTriangle },
  ];

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const parsed = parseKits(await file.arrayBuffer());
    if (parsed.length === 0) return toast.error("No kits found — the sheet needs Kit SKU, Kit Name, Product SKU and Qty columns");
    importKits.mutate(parsed, {
      onSuccess: ({ imported, skipped }) => {
        if (imported) toast.success(`${imported} kit${imported === 1 ? "" : "s"} imported`, { description: skipped.length ? `${skipped.length} skipped: ${skipped.slice(0, 3).map((s) => `${s.sku} (${s.reason})`).join("; ")}` : undefined });
        else toast.error(`No kits imported${skipped.length ? ` — ${skipped.slice(0, 3).map((s) => `${s.sku}: ${s.reason}`).join("; ")}` : ""}`);
      },
    });
  }

  const control = "glass-control border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary focus:border-brand-blue focus:outline-none transition-colors";

  return (
    <div>
      <MasterTabs />
      <h1 className="text-3xl font-normal text-text-primary">Kits</h1>
      <p className="text-sm text-text-secondary mt-1">Groups of Master File products — priced from their components, built from their stock</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-8">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} />
        ))}
      </div>

      <div className="glass rounded-3xl overflow-hidden mt-6">
        <div className="p-3 sm:p-4 border-b border-border flex items-center gap-3 flex-wrap">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input className={`${control} w-full pl-9`} placeholder="Search kits or products…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select className={control} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </Select>
          <div className="ml-auto flex items-center gap-2">
            {canImport && (
              <>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
                <Button variant="secondary" icon={Upload} onClick={() => fileRef.current?.click()} disabled={importKits.isPending}>Import Excel</Button>
              </>
            )}
            <Button variant="secondary" icon={Download} onClick={() => exportKits(kits, byId)}>{kits.length ? "Export" : "Template"}</Button>
            {canManage && <Button icon={Plus} onClick={() => setModal({ open: true, kit: null })}>New kit</Button>}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="bg-white/35 text-left text-xs uppercase tracking-wider text-text-muted">
                {["SKU", "Kit", "Products", `Price (${currency})`, "Can build", "Status", ""].map((h) => <th key={h} className="px-4 py-3 font-normal">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-text-muted py-14 text-sm">
                  {kits.length === 0 ? (canManage ? "No kits yet — create one with “New kit”, or import a sheet." : "No kits yet.") : "No kits match these filters."}
                </td></tr>
              ) : rows.map(({ kit, pricing, warnings, canBuild }) => (
                <tr key={kit.id} className={`border-t border-border/60 text-sm transition-colors ${canManage ? "hover:bg-white/50 cursor-pointer" : ""}`} onClick={() => canManage && setModal({ open: true, kit })}>
                  <td className="px-4 py-3 font-numeric tabular-nums text-xs text-brand-blue">{kit.sku}</td>
                  <td className="px-4 py-3">
                    <div className="text-text-primary">{kit.name}</div>
                    {warnings.length > 0 && <div className="text-xs text-warning flex items-center gap-1 mt-0.5"><AlertTriangle size={11} /> {warnings.join(" · ")}</div>}
                  </td>
                  <td className="px-4 py-3 text-text-secondary max-w-[300px]">
                    <div className="truncate" title={kit.items.map((i) => `${i.qty} × ${byId.get(i.productId)?.name ?? "?"}`).join(", ")}>
                      {kit.items.map((i) => `${i.qty}× ${byId.get(i.productId)?.name ?? "?"}`).join(", ")}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {pricing.kitPrice == null ? <span className="text-warning">Not set</span> : (
                      <div>
                        <Price value={pricing.kitPrice} currency={currency} />
                        {kit.discountPct > 0 && <div className="text-xs text-text-muted">−{kit.discountPct}% of <Price value={pricing.componentsTotal} currency={currency} className="text-xs" /></div>}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3"><Num className={canBuild === 0 ? "text-danger" : "text-text-primary"}>{canBuild ?? "—"}</Num></td>
                  <td className="px-4 py-3"><Badge color={kit.status === "Active" ? "#10B981" : "#94A3B8"}>{kit.status}</Badge></td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    {canManage && (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setModal({ open: true, kit })} aria-label="Edit kit" className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:bg-white"><Pencil size={14} /></button>
                        <button onClick={() => window.confirm(`Delete kit ${kit.name}? Its products stay in the Master File.`) && remove.mutate(kit.id)} aria-label="Delete kit"
                          className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:text-danger hover:bg-white"><Trash2 size={14} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <KitModal open={modal.open} kit={modal.kit} onClose={() => setModal({ open: false, kit: null })} />
    </div>
  );
}
