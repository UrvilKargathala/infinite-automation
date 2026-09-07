import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { assembleQuotes, replaceQuoteSections } from "@/lib/quotesDb";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { can } from "@/lib/utils/permissions";
import type { Quote } from "@/types";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const body = (await req.json()) as Partial<Quote>;

  const existing = await sql`SELECT id, number, client_id, client, date::text, valid_until::text, status FROM quotes WHERE id = ${id}`;
  if (existing.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [current] = await assembleQuotes(existing);
  const merged = { ...current, ...body };

  const quoteRows = await sql`
    UPDATE quotes SET client_id = ${merged.clientId}, client = ${merged.client}, date = ${merged.date},
      valid_until = ${merged.validUntil}, status = ${merged.status}
    WHERE id = ${id}
    RETURNING id, number, client_id, client, date::text, valid_until::text, status
  `;
  if (body.sections) await replaceQuoteSections(id, body.sections);

  const [assembled] = await assembleQuotes(quoteRows);
  return NextResponse.json(assembled);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!can(me.role, "deleteQuote")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  await sql`DELETE FROM quotes WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
