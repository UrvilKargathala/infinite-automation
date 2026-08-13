"use client";

import { useState, useMemo, useRef } from "react";
import { Search, Package, CheckCircle, Layers, AlertCircle, Upload, Download, Plus } from "lucide-react";
import { useProductStore } from "@/lib/store/useProductStore";
import { IconTile } from "@/components/ui/IconTile";
import { Button } from "@/components/ui/Button";
import { ProductTable } from "@/components/master/ProductTable";
import { ProductModal } from "@/components/master/ProductModal";
import { Num } from "@/components/ui/Num";
import type { Product } from "@/types";
import * as XLSX from "xlsx";

function normalizeBrand(raw: string): string {
  let v = raw.trim();
  if (v.toLowerCase().startsWith("unifi ")) v = v.slice(6).trim();
  v = v.replace(/Alarams/g, "Alarms");
  return v;
}

export default function MasterPage() {
  const { products, brands, categoriesByBrand, remove, bulkAdd } = useProductStore();
  const allBrands = brands();

  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filteredCategories = brandFilter ? categoriesByBrand(brandFilter) : [];

  const filtered = useMemo(() => {
    let list = products;
    if (brandFilter) list = list.filter((p) => p.brand === brandFilter);
    if (catFilter) list = list.filter((p) => p.category === catFilter);
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
  }, [products, brandFilter, catFilter, search]);

  const totalActive = products.filter((p) => p.status === "Active").length;
  const totalBrands = new Set(products.map((p) => p.brand)).size;
  const missingPrice = products.filter((p) => p.price == null).length;

  function handleEdit(p: Product) {
    setEditProduct(p);
    setModalOpen(true);
  }

  function handleDelete(id: number) {
    if (window.confirm("Delete this product?")) remove(id);
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
          const brandRaw = col(row, "Product Group/Brand");
          if (!name || !brandRaw) return null;
          const priceStr = col(row, "Price ( INR )", "Price (INR)", "Price");
          const priceNum = priceStr ? Number(priceStr) : null;
          return {
            name,
            sku: col(row, "SKU"),
            brand: normalizeBrand(brandRaw),
            category: col(row, "Product Category"),
            hsn: col(row, "Hsn Code", "HSN Code"),
            price: priceNum != null && !isNaN(priceNum) ? priceNum : null,
            status: "Active" as const,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);

      bulkAdd(items);
      alert(`${items.length} products imported.`);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }

  function handleExport() {
    const data = products.map((p, i) => ({
      "Sr. No": i + 1,
      "Product Name": p.name,
      SKU: p.sku,
      Brand: p.brand,
      "Product Category": p.category,
      "HSN Code": p.hsn,
      "Price (INR)": p.price ?? "",
      Status: p.status,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "infinite_products_export.xlsx");
  }

  const stats = [
    { label: "Total products", value: products.length, icon: Package, bg: "bg-[#3A90C318]", accent: "#3A90C3" },
    { label: "Active", value: totalActive, icon: CheckCircle, valueClass: "text-success", bg: "bg-[#10B98118]", accent: "#10B981" },
    { label: "Brands", value: totalBrands, icon: Layers, bg: "bg-[#8B5CF618]", accent: "#8B5CF6" },
    { label: "Missing price", value: missingPrice, icon: AlertCircle, valueClass: "text-warning", bg: "bg-[#F59E0B18]", accent: "#F59E0B" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-semibold text-text-primary">Master File</h1>
      <p className="text-sm text-text-secondary mt-1">Product catalog and master data</p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-2xl shadow-card p-5 flex items-center justify-between ${s.bg}`} style={{ borderLeft: `3px solid ${s.accent}` }}>
            <div>
              <div className="text-xs text-text-muted">{s.label}</div>
              <div className={`text-2xl font-light mt-1 ${s.valueClass ?? "text-text-primary"}`}>
                <Num>{s.value}</Num>
              </div>
            </div>
            <IconTile icon={s.icon} />
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden mt-6">
        {/* Toolbar */}
        <div className="p-3 sm:p-4 border-b border-border flex items-center gap-3 flex-wrap">
          <div className="relative w-full sm:w-auto">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              className="w-full sm:w-64 bg-white border border-border rounded-lg py-2.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none transition-colors"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="bg-white border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary focus:border-brand-blue focus:outline-none transition-colors"
            value={brandFilter}
            onChange={(e) => { setBrandFilter(e.target.value); setCatFilter(""); }}
          >
            <option value="">All brands</option>
            {allBrands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <select
            className="bg-white border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary focus:border-brand-blue focus:outline-none transition-colors disabled:opacity-50"
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            disabled={!brandFilter}
          >
            <option value="">All categories</option>
            {filteredCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <div className="ml-auto flex items-center gap-2">
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
            <Button variant="secondary" icon={Upload} onClick={() => fileRef.current?.click()}>
              Import Excel
            </Button>
            <Button variant="secondary" icon={Download} onClick={handleExport}>
              Export
            </Button>
            <Button icon={Plus} onClick={() => { setEditProduct(null); setModalOpen(true); }}>
              Add product
            </Button>
          </div>
        </div>

        <ProductTable
          products={filtered}
          total={products.length}
          onEdit={handleEdit}
          onDelete={handleDelete}
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
