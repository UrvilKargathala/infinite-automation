import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { logAction, diffFields } from "@/lib/api/audit";
import type { Customer } from "@/types";

function toCustomer(row: Record<string, unknown>): Customer {
  return {
    id: row.id as number,
    name: row.name as string,
    segment: row.segment as Customer["segment"],
    contactName: row.contact_name as string,
    email: row.email as string,
    phone: row.phone as string,
    address: row.address as string,
    notes: row.notes as string,
    createdAt: row.created_at as string,
  };
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const rows = await sql`SELECT * FROM customers WHERE id = ${id}`;
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [tickets, projects, quotes] = await Promise.all([
    sql`SELECT id, subject, status, priority FROM tickets WHERE customer_id = ${id} ORDER BY id DESC`,
    sql`SELECT id, site_address, stage FROM projects WHERE customer_id = ${id} ORDER BY id DESC`,
    sql`SELECT id, number, status, currency FROM quotes WHERE customer_id = ${id} ORDER BY id DESC`,
  ]);

  return NextResponse.json({
    ...toCustomer(rows[0]),
    tickets: tickets.map((t) => ({ id: t.id, subject: t.subject, status: t.status, priority: t.priority })),
    projects: projects.map((p) => ({ id: p.id, siteAddress: p.site_address, stage: p.stage })),
    quotes: quotes.map((q) => ({ id: q.id, number: q.number, status: q.status, currency: q.currency })),
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentAppUser();
  const id = Number(params.id);
  const body = (await req.json()) as Partial<Omit<Customer, "id" | "createdAt">>;

  const existing = await sql`SELECT * FROM customers WHERE id = ${id}`;
  if (existing.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const current = toCustomer(existing[0]);
  const merged = { ...current, ...body };

  const rows = await sql`
    UPDATE customers SET name = ${merged.name}, segment = ${merged.segment}, contact_name = ${merged.contactName},
      email = ${merged.email}, phone = ${merged.phone}, address = ${merged.address}, notes = ${merged.notes}
    WHERE id = ${id}
    RETURNING *
  `;
  const updated = toCustomer(rows[0]);

  if (me) {
    const changes = diffFields(
      { name: current.name, segment: current.segment, email: current.email, phone: current.phone, contactName: current.contactName, address: current.address, notes: current.notes },
      { name: updated.name, segment: updated.segment, email: updated.email, phone: updated.phone, contactName: updated.contactName, address: updated.address, notes: updated.notes }
    );
    if (changes) {
      await logAction({
        module: "CRM",
        action: "update",
        entityType: "customer",
        entityId: updated.id,
        entityName: updated.name,
        summary: `Updated customer ${updated.name}`,
        changes,
        actor: me,
      });
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentAppUser();
  const id = Number(params.id);
  const existing = await sql`SELECT * FROM customers WHERE id = ${id}`;
  if (existing.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const toDelete = toCustomer(existing[0]);

  await sql`DELETE FROM customers WHERE id = ${id}`;

  if (me) {
    await logAction({
      module: "CRM",
      action: "delete",
      entityType: "customer",
      entityId: toDelete.id,
      entityName: toDelete.name,
      summary: `Deleted customer ${toDelete.name}`,
      changes: { before: { name: toDelete.name, segment: toDelete.segment } },
      actor: me,
    });
  }

  return NextResponse.json({ ok: true });
}
