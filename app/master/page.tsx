"use client";

import { useOpenParam } from "@/lib/hooks/useOpenParam";
import { confirmDialog } from "@/components/ui/ConfirmDialog";
import { useState, useMemo, useRef, useEffect } from "react";
import { Search, Package, CheckCircle, Layers, AlertCircle, Upload, Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { useProductStore } from "@/lib/store/useProductStore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { can } from "@/lib/utils/permissions";
import { Button } from "@/components/ui/Button";
import { ProductTable } from "@/components/master/ProductTable";
import { ProductModal } from "@/components/master/ProductModal";
import { useStock } from "@/lib/hooks/useStock";
import { TablePageSkeleton } from "@/components/ui/TablePageSkeleton";
import type { Product } from "@/types";
import { CURRENCY_CODES, priceIn, type CurrencyCode } from "@/lib/utils/currency";
import { useCurrency } from "@/lib/hooks/useCurrency";
import * as XLSX from "xlsx";
import { Select } from "@/components/ui/Select";
import { MasterTabs } from "@/components/master/MasterTabs";
import { StatCard } from "@/components/ui/StatCard";

function normalizeBrand(raw: string): string {
  let v = raw.trim();
  if (v.toLowerCase().startsWith("unifi ")) v = v.slice(6).trim();
  v = v.replace(/Alarams/g, "Alarms");
  return v;
}

function normalizeCategory(raw: string): string {
  let v = raw.trim();
  v = v.replace(/Garrage/g, "Garage");
  v = v.replace(/Contoller/g, "Controller");
  v = v.replace(/Conroller/g, "Controller");
  v = v.replace(/Alarams/g, "Alarms");
  return v;
}

export default function MasterPage() {
  const { products, brands, categoriesByBrand, remove, bulkAdd, fetchAll, loaded } = useProductStore();
  const role = useAuthStore((s) => s.user?.role ?? "Purchase");
  const canManage = can(role, "editProducts");
  const canImport = can(role, "excelImport");
  const { byProduct: stock } = useStock();
  const allBrands = brands();

  const loading = !loaded;
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const currency = useCurrency();
  const [priceFilter, setPriceFilter] = useState<"" | "set" | "missing">("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filteredCategories = brandFilter ? categoriesByBrand(brandFilter) : [];

  const filtered = useMemo(() => {
    let list = [...products].sort((a, b) => b.id - a.id); // newest first, so a just-added product shows on page 1
    if (brandFilter) list = list.filter((p) => p.brand === brandFilter);
    if (catFilter) list = list.filter((p) => p.category === catFilter);
    if (priceFilter) list = list.filter((p) => (priceIn(p, currency) != null) === (priceFilter === "set"));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, brandFilter, catFilter, priceFilter, currency, search]);

  const totalActive = products.filter((p) => p.status === "Active").length;
  const totalBrands = new Set(products.map((p) => p.brand)).size;
  // Missing = no price in the user's Settings currency (a product may still be priced in others).
  const missingPrice = products.filter((p) => priceIn(p, currency) == null).length;

  // ?open=<id> (search, links) opens that product.
  useOpenParam(!loading, (id) => { const p = products.find((x) => x.id === id); if (p && canManage) handleEdit(p); });

  function handleEdit(p: Product) {
    setEditProduct(p);
    setModalOpen(true);
  }

  async function handleDelete(id: number) {
    if (await confirmDialog({ title: "Delete this product?", message: "This can't be undone.", confirmLabel: "Delete", tone: "danger" })) {
      remove(id).then(() => toast.success("Product deleted")).catch(() => {
        // error toast already shown by the store
      });
    }
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

      function col(row: Record<string, unknown>, ...keys: string[]): string {
        for (const k of keys) {
          for (const rk of Object.keys(row)) {
            if (rk.trim().toLowerCase() === k.toLowerCase()) return String(row[rk] ?? "").trim();
          }
        }
        return "";
      }

      const items = rows
        .map((row) => {
          const name = col(row, "Product Name");
          const brandRaw = col(row, "Product Group/Brand", "Brand");
          if (!name || !brandRaw) return null;
          const category = normalizeCategory(col(row, "Product Category", "Product Category "));
          const prices: Partial<Record<CurrencyCode, number>> = {};
          for (const c of CURRENCY_CODES) {
            const v = col(row, `Price (${c})`, `Price ( ${c} )`);
            const n = v ? Number(v) : NaN;
            if (!isNaN(n) && v) prices[c] = n;
          }
          const wholeOrZero = (v: string) => (/^\d+$/.test(v) ? Number(v) : 0);
          const legacyPrice = col(row, "Price ( INR )", "Price (INR)", "Price");
          const legacyNum = legacyPrice ? Number(legacyPrice) : NaN;
          if (!isNaN(legacyNum) && legacyPrice && !prices.INR) prices.INR = legacyNum;
          return {
            name,
            sku: col(row, "SKU"),
            brand: normalizeBrand(brandRaw),
            category,
            hsn: col(row, "Hsn Code", "HSN Code"),
            description: col(row, "Description"),
            price: prices.INR ?? null,
            prices,
            status: "Active" as const,
            physicalStock: wholeOrZero(col(row, "Physical Stock", "Stock")),
            minBuffer: wholeOrZero(col(row, "Min Buffer")),
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);

      if (items.length === 0) {
        toast.error("No valid products found in file");
      } else {
        bulkAdd(items, file.name).then(() => toast.success(`${items.length} products imported`)).catch(() => {
          // error toast already shown by the store
        });
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }

  function handleExport() {
    const data = products.map((p, i) => {
      const row: Record<string, unknown> = {
        "Sr. No": i + 1,
        "Product Name": p.name,
        SKU: p.sku,
        Brand: p.brand,
        "Product Category": p.category,
        "HSN Code": p.hsn,
        Description: p.description || "",
      };
      for (const c of CURRENCY_CODES) {
        row[`Price (${c})`] = p.prices?.[c] ?? "";
      }
      const st = stock.get(p.id);
      row["Physical Stock"] = st?.physical ?? 0;
      row["Reserved"] = st?.allocated ?? 0;
      row["Available"] = st?.available ?? 0;
      row["Min Buffer"] = st?.minBuffer ?? 0;
      row.Status = p.status;
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "infinite_products_export.xlsx");
    toast.success("Products exported");
    fetch("/api/products/export-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rowCount: products.length, brand: brandFilter, category: catFilter, search }),
    }).catch(() => {});
  }

  const stats = [
    { label: "Total products", value: products.length, icon: Package },
    { label: "Active", value: totalActive, icon: CheckCircle, valueClass: "text-success" },
    { label: "Brands", value: totalBrands, icon: Layers },
    { label: "Missing price", value: missingPrice, icon: AlertCircle, valueClass: "text-warning" },
  ];

  if (loading) return <TablePageSkeleton statCards={4} />;

  return (
    <div>
      <MasterTabs />
      <h1 className="text-3xl font-normal text-text-primary">Master File</h1>
      <p className="text-sm text-text-secondary mt-1">Product catalog and master data</p>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} valueClass={s.valueClass} />
        ))}
      </div>

      {/* Table card */}
      <div className="glass rounded-3xl overflow-hidden mt-6">
        {/* Toolbar */}
        <div className="p-3 sm:p-4 border-b border-border flex items-center gap-3 flex-wrap">
          {/* Filters grow to fill their row; the buttons are a separate group so a wrap never strands them mid-gap. */}
          <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 z-10 -translate-y-1/2 pointer-events-none text-text-secondary" />
            <input
              className="w-full glass-control border border-border rounded-lg py-2.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none transition-colors"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            className="glass-control border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary focus:border-brand-blue focus:outline-none transition-colors"
            value={brandFilter}
            onChange={(e) => { setBrandFilter(e.target.value); setCatFilter(""); }}
          >
            <option value="">All brands</option>
            {allBrands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </Select>
          <Select
            className="glass-control border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary focus:border-brand-blue focus:outline-none transition-colors disabled:opacity-50"
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            disabled={!brandFilter}
          >
            <option value="">All categories</option>
            {filteredCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
          <Select
            className="glass-control border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary focus:border-brand-blue focus:outline-none transition-colors"
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value as "" | "set" | "missing")}
          >
            <option value="">All prices</option>
            <option value="set">Priced in {currency}</option>
            <option value="missing">Missing {currency} price</option>
          </Select>
          </div>

          <div className="flex items-center gap-2 flex-wrap ml-auto">
            {canImport && (
              <>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
                <Button variant="secondary" icon={Upload} onClick={() => fileRef.current?.click()}>
                  Import Excel
                </Button>
              </>
            )}
            <Button variant="secondary" icon={Download} onClick={handleExport}>
              Export
            </Button>
            {canManage && (
              <Button icon={Plus} onClick={() => { setEditProduct(null); setModalOpen(true); }}>
                Add product
              </Button>
            )}
          </div>
        </div>

        <ProductTable
          products={filtered}
          currency={currency}
          total={products.length}
          onEdit={handleEdit}
          onDelete={handleDelete}
          canManage={canManage}
        />
      </div>

      <ProductModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditProduct(null); }}
        product={editProduct}
      />
    </div>
  );
}
