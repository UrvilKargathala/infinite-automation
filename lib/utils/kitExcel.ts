import * as XLSX from "xlsx";
import type { Kit, Product } from "@/types";

// One row per component: a kit with 3 products is 3 rows sharing its Kit SKU.
const HEADERS = ["Kit SKU", "Kit Name", "Description", "Discount %", "Product SKU", "Product Name", "Qty"];

/** Download kits as Excel. With no kits it's a blank template with the right columns. */
export function exportKits(kits: Kit[], productsById: Map<number, Product>): void {
  const rows: (string | number)[][] = [HEADERS];
  for (const k of kits) {
    for (const it of k.items) {
      const p = productsById.get(it.productId);
      rows.push([k.sku, k.name, k.description, k.discountPct, p?.sku ?? "", p?.name ?? "", it.qty]);
    }
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Kits");
  XLSX.writeFile(wb, kits.length ? "infinite_kits_export.xlsx" : "infinite_kits_template.xlsx");
}

export type ParsedKit = { sku: string; name: string; description: string; discountPct: number; items: { sku: string; qty: number }[] };

/** Read the Kits sheet back into kits grouped by Kit SKU (the API matches Product SKUs to the Master File). */
export function parseKits(buf: ArrayBuffer): ParsedKit[] {
  const wb = XLSX.read(buf, { type: "array" });
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]]);
  const col = (r: Record<string, unknown>, k: string) => {
    const key = Object.keys(r).find((x) => x.trim().toLowerCase() === k.toLowerCase());
    return key ? String(r[key] ?? "").trim() : "";
  };
  const kits = new Map<string, ParsedKit>();
  for (const r of rows) {
    const sku = col(r, "Kit SKU").toUpperCase();
    const productSku = col(r, "Product SKU");
    if (!sku || !productSku) continue;
    if (!kits.has(sku)) {
      kits.set(sku, { sku, name: col(r, "Kit Name"), description: col(r, "Description"), discountPct: Number(col(r, "Discount %")) || 0, items: [] });
    }
    kits.get(sku)!.items.push({ sku: productSku, qty: Number(col(r, "Qty")) || 1 });
  }
  return [...kits.values()];
}
