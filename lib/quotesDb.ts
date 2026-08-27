import { sql } from "@/lib/db";
import type { Quote, Section, QuoteItem } from "@/types";

export async function assembleQuotes(quoteRows: Record<string, unknown>[]): Promise<Quote[]> {
  if (quoteRows.length === 0) return [];
  const quoteIds = quoteRows.map((q) => q.id as number);
  const sectionRows = await sql`
    SELECT * FROM quote_sections WHERE quote_id = ANY(${quoteIds}) ORDER BY position
  `;
  const sectionIds = sectionRows.map((s) => s.id as string);
  const itemRows = sectionIds.length
    ? await sql`SELECT * FROM quote_items WHERE section_id = ANY(${sectionIds}) ORDER BY position`
    : [];

  const itemsBySection = new Map<string, QuoteItem[]>();
  for (const it of itemRows) {
    const sid = it.section_id as string;
    const list = itemsBySection.get(sid) ?? [];
    list.push({
      id: it.id as string,
      productId: it.product_id as number,
      name: it.name as string,
      category: it.category as string,
      brand: it.brand as string,
      qty: it.qty as number,
      price: Number(it.price),
      discount: Number(it.discount),
    });
    itemsBySection.set(sid, list);
  }

  const sectionsByQuote = new Map<number, Section[]>();
  for (const s of sectionRows) {
    const qid = s.quote_id as number;
    const list = sectionsByQuote.get(qid) ?? [];
    list.push({ id: s.id as string, name: s.name as string, items: itemsBySection.get(s.id as string) ?? [] });
    sectionsByQuote.set(qid, list);
  }

  return quoteRows.map((q) => ({
    id: q.id as number,
    number: q.number as string,
    clientId: q.client_id as number | null,
    client: q.client as string,
    date: q.date as string,
    validUntil: q.valid_until as string,
    status: q.status as Quote["status"],
    sections: sectionsByQuote.get(q.id as number) ?? [],
  }));
}

export async function replaceQuoteSections(quoteId: number, sections: Section[]) {
  await sql`DELETE FROM quote_sections WHERE quote_id = ${quoteId}`;
  for (let si = 0; si < sections.length; si++) {
    const s = sections[si];
    await sql`INSERT INTO quote_sections (id, quote_id, name, position) VALUES (${s.id}, ${quoteId}, ${s.name}, ${si})`;
    for (let ii = 0; ii < s.items.length; ii++) {
      const it = s.items[ii];
      await sql`
        INSERT INTO quote_items (id, section_id, product_id, name, category, brand, qty, price, discount, position)
        VALUES (${it.id}, ${s.id}, ${it.productId}, ${it.name}, ${it.category}, ${it.brand}, ${it.qty}, ${it.price}, ${it.discount}, ${ii})
      `;
    }
  }
}
