import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { assembleQuotes, replaceQuoteSections } from "@/lib/quotesDb";
import type { Quote } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const quoteRows = await sql`SELECT id, number, client_id, client, date::text, valid_until::text, status FROM quotes ORDER BY id`;
  return NextResponse.json(await assembleQuotes(quoteRows));
}

export async function POST(req: Request) {
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
  return NextResponse.json(assembled, { status: 201 });
}
