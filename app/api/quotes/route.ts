import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { assembleQuotes, replaceQuoteSections } from "@/lib/quotesDb";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { logAction } from "@/lib/api/audit";
import { calcQuoteTotal } from "@/lib/utils/quote";
import type { Quote } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const quoteRows = await sql`SELECT id, number, client_id, client, date::text, valid_until::text, status FROM quotes ORDER BY id`;
  return NextResponse.json(await assembleQuotes(quoteRows));
}

export async function POST(req: Request) {
  const me = await getCurrentAppUser();
  const body = (await req.json()) as Omit<Quote, "id" | "number">;

  const yearRows = await sql`
    SELECT count(*) AS n FROM quotes WHERE number LIKE ${`IA-Q-${new Date().getFullYear()}-%`}
  `;
  const seq = Number(yearRows[0].n) + 1;
  const number = `IA-Q-${new Date().getFullYear()}-${String(seq).padStart(3, "0")}`;

  const quoteRows = await sql`
    INSERT INTO quotes (number, client_id, client, date, valid_until, status)
    VALUES (${number}, ${body.clientId}, ${body.client}, ${body.date}, ${body.validUntil}, ${body.status})
    RETURNING id, number, client_id, client, date::text, valid_until::text, status
  `;
  const quoteId = quoteRows[0].id as number;
  await replaceQuoteSections(quoteId, body.sections);

  const [assembled] = await assembleQuotes(quoteRows);

  if (me) {
    const itemCount = assembled.sections.reduce((n, s) => n + s.items.length, 0);
    const { grandTotal } = calcQuoteTotal(assembled);
    await logAction({
      module: "Quote",
      action: "create",
      entityType: "quote",
      entityId: assembled.id,
      entityName: assembled.number,
      summary: `Created quote ${assembled.number} for ${assembled.client} — ${assembled.sections.length} sections, ${itemCount} items, total ₹${grandTotal.toLocaleString("en-IN")}`,
      changes: { after: { number: assembled.number, client: assembled.client, date: assembled.date, validUntil: assembled.validUntil, status: assembled.status, sectionCount: assembled.sections.length, itemCount, grandTotal } },
      actor: me,
    });
  }

  return NextResponse.json(assembled, { status: 201 });
}
