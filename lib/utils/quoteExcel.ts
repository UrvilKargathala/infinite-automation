import * as XLSX from "xlsx";
import type { Customer, Kit, Product, Quote, QuoteItem, QuoteStatus, Section } from "@/types";
import { CURRENCY_CODES, DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/utils/currency";
import { kitContents, kitQuoteLine } from "@/lib/utils/kits";

const STATUSES: QuoteStatus[] = ["Draft", "Sent", "Accepted", "Rejected"];

/** One row per line item; a kit is one row (its Kit SKU in the SKU column, its contents alongside). */
export function exportQuotes(quotes: Quote[], products: Product[]) {
  const skuById = new Map(products.map((p) => [p.id, p.sku]));
  const rows = quotes.flatMap((q) =>
    q.sections.flatMap((s) =>
      s.items.map((i) => ({
        "Quote #": q.number,
        Client: q.client,
        Date: q.date,
        "Valid Until": q.validUntil,
        Status: q.status,
        Currency: q.currency,
        Section: s.name,
        SKU: i.components ? i.kitSku ?? "" : (i.productId != null && skuById.get(i.productId)) || "",
        "Product Name": i.name,
        "Kit Contents": i.components ? kitContents(i.components) : "",
        Qty: i.qty,
        Price: i.price,
        "Discount %": i.discount,
      }))
    )
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Quotes");
  XLSX.writeFile(wb, "infinite_quotes_export.xlsx");
  return rows.length;
}

type NewQuote = Omit<Quote, "id" | "number">;

/** Rows sharing a "Quote #" become one new quote; the number itself is regenerated. Rows matching neither a product nor a kit SKU are skipped. */
/** Rows without a valid Currency column are imported in `fallbackCurrency` (the importer's Settings currency). */
/** A kit row takes the kit's components as they are today (the sheet's "Kit Contents" column is informational). */
export function parseQuotes(buf: ArrayBuffer, products: Product[], customers: Customer[], fallbackCurrency: CurrencyCode = DEFAULT_CURRENCY, kits: Kit[] = []): NewQuote[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  const wb = XLSX.read(buf, { type: "array" });
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]]);
  const col = (r: Record<string, unknown>, k: string) => {
    const key = Object.keys(r).find((x) => x.trim().toLowerCase() === k.toLowerCase());
    return key ? String(r[key] ?? "").trim() : "";
  };
  const groups = new Map<string, NewQuote>();
  for (const r of rows) {
    const client = col(r, "Client");
    const product = products.find((p) => p.sku && p.sku === col(r, "SKU")) ?? products.find((p) => p.name === col(r, "Product Name"));
    const kit = product ? undefined : kits.find((k) => k.sku === col(r, "SKU").toUpperCase());
    if (!client || (!product && !kit)) continue;
    const key = col(r, "Quote #") || `${client}|${col(r, "Date")}`;
    let q = groups.get(key);
    if (!q) {
      const status = col(r, "Status") as QuoteStatus;
      const currency = col(r, "Currency") as CurrencyCode;
      const customerId = customers.find((c) => c.name.toLowerCase() === client.toLowerCase())?.id ?? null;
      const today = new Date().toISOString().slice(0, 10);
      q = {
        clientId: null,
        customerId,
        client,
        date: col(r, "Date") || today,
        validUntil: col(r, "Valid Until") || today,
        status: STATUSES.includes(status) ? status : "Draft",
        currency: CURRENCY_CODES.includes(currency) ? currency : fallbackCurrency,
        sections: [],
      };
      groups.set(key, q);
    }
    const name = col(r, "Section") || "Items";
    let sec = q.sections.find((s) => s.name === name);
    if (!sec) {
      sec = { id: crypto.randomUUID(), name, items: [] } satisfies Section;
      q.sections.push(sec);
    }
    const qty = Number(col(r, "Qty")) || 1;
    const line: QuoteItem = product
      ? { id: crypto.randomUUID(), productId: product.id, name: product.name, category: product.category, brand: product.brand, description: product.description || "", qty, price: 0, discount: 0 }
      : kitQuoteLine(kit!, qty, byId, q.currency, crypto.randomUUID());
    sec.items.push({ ...line, price: Number(col(r, "Price")) || line.price, discount: Number(col(r, "Discount %")) || 0 });
  }
  return [...groups.values()];
}
