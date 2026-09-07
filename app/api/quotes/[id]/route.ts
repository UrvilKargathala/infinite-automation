import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { assembleQuotes, replaceQuoteSections } from "@/lib/quotesDb";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { can } from "@/lib/utils/permissions";
import { logAction, diffFields } from "@/lib/api/audit";
import { calcQuoteTotal } from "@/lib/utils/quote";
import type { Quote, Section } from "@/types";

/** Human-readable per-section item add/remove lines, e.g. "Section 1 (Ground Floor): added item Smart Locks x 4". */
function describeSectionChanges(before: Section[], after: Section[]): string[] {
  const lines: string[] = [];
  const beforeByName = new Map(before.map((s) => [s.name, s]));
  const afterByName = new Map(after.map((s) => [s.name, s]));

  after.forEach((sec, i) => {
    const prev = beforeByName.get(sec.name);
    if (!prev) {
      lines.push(`Section ${i + 1} (${sec.name || "Untitled"}): new section with ${sec.items.length} item(s)`);
      return;
    }
    const prevIds = new Set(prev.items.map((it) => it.id));
    const nextIds = new Set(sec.items.map((it) => it.id));
    const added = sec.items.filter((it) => !prevIds.has(it.id));
    const removed = prev.items.filter((it) => !nextIds.has(it.id));
    for (const it of added) lines.push(`Section ${i + 1} (${sec.name || "Untitled"}): added item ${it.name} x ${it.qty}`);
    for (const it of removed) lines.push(`Section ${i + 1} (${sec.name || "Untitled"}): removed item ${it.name} x ${it.qty}`);
  });
  before.forEach((sec) => {
    if (!afterByName.has(sec.name)) lines.push(`Removed section ${sec.name || "Untitled"} (${sec.items.length} item(s))`);
  });

  return lines;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentAppUser();
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

  if (me) {
    const headerBefore = { client: current.client, date: current.date, validUntil: current.validUntil, status: current.status };
    const headerAfter = { client: assembled.client, date: assembled.date, validUntil: assembled.validUntil, status: assembled.status };
    const headerChanges = diffFields(headerBefore, headerAfter);
    const sectionLines = body.sections ? describeSectionChanges(current.sections, assembled.sections) : [];

    if (headerChanges || sectionLines.length > 0) {
      const changedKeys = Object.keys(headerChanges?.after ?? {});
      const isStatusOnly = sectionLines.length === 0 && changedKeys.length === 1 && changedKeys[0] === "status";
      let summary = `Updated quote ${assembled.number}`;
      if (isStatusOnly) {
        summary = `Changed quote ${assembled.number} status from ${current.status} to ${assembled.status}`;
      } else if (sectionLines.length > 0) {
        summary = `Updated quote ${assembled.number} — ${sectionLines.join(", ")}`;
      }
      await logAction({
        module: "Quote",
        action: isStatusOnly ? "status_change" : "update",
        entityType: "quote",
        entityId: assembled.id,
        entityName: assembled.number,
        summary,
        changes: headerChanges,
        metadata: sectionLines.length > 0 ? { sectionChanges: sectionLines } : undefined,
        actor: me,
      });
    }
  }

  return NextResponse.json(assembled);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!can(me.role, "deleteQuote")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  const existing = await sql`SELECT id, number, client_id, client, date::text, valid_until::text, status FROM quotes WHERE id = ${id}`;
  const [toDelete] = existing.length > 0 ? await assembleQuotes(existing) : [null];
  await sql`DELETE FROM quotes WHERE id = ${id}`;

  if (toDelete) {
    const { grandTotal } = calcQuoteTotal(toDelete);
    await logAction({
      module: "Quote",
      action: "delete",
      entityType: "quote",
      entityId: toDelete.id,
      entityName: toDelete.number,
      summary: `Deleted quote ${toDelete.number} (client: ${toDelete.client}, total: ₹${grandTotal.toLocaleString("en-IN")})`,
      changes: { before: { number: toDelete.number, client: toDelete.client, status: toDelete.status, grandTotal } },
      actor: me,
    });
  }

  return NextResponse.json({ ok: true });
}
