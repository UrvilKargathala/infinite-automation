import * as XLSX from "xlsx";
import type { Customer, Product, Quote, QuoteStatus, Section } from "@/types";
import { CURRENCY_CODES, DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/utils/currency";

const STATUSES: QuoteStatus[] = ["Draft", "Sent", "Accepted", "Rejected"];

/** One row per line item. */
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
        SKU: skuById.get(i.productId) ?? "",
        "Product Name": i.name,
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

/** Rows sharing a "Quote #" become one new quote; the number itself is regenerated. Rows without a matching product are skipped. */
export function parseQuotes(buf: ArrayBuffer, products: Product[], customers: Customer[]): NewQuote[] {
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
    if (!client || !product) continue;
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
        currency: CURRENCY_CODES.includes(currency) ? currency : DEFAULT_CURRENCY,
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
    sec.items.push({
      id: crypto.randomUUID(),
      productId: product.id,
      name: product.name,
      category: product.category,
      brand: product.brand,
      description: product.description || "",
      qty: Number(col(r, "Qty")) || 1,
      price: Number(col(r, "Price")) || 0,
      discount: Number(col(r, "Discount %")) || 0,
    });
  }
  return [...groups.values()];
}
