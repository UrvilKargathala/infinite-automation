import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { logAction, diffFields } from "@/lib/api/audit";
import { toCustomer } from "@/lib/customersDb";
import { customerFullName } from "@/lib/utils/customer";
import type { Customer, CustomerInput } from "@/types";

const pickAudited = (c: Customer) => ({
  name: c.name, prefix: c.prefix, segment: c.segment, email: c.email, phone: c.phone, architect: c.architect, gstNo: c.gstNo,
  address: c.address, city: c.city, state: c.state, postcode: c.postcode, birthday: c.birthday, notes: c.notes,
});

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
  const body = (await req.json()) as Partial<CustomerInput>;

  const existing = await sql`SELECT * FROM customers WHERE id = ${id}`;
  if (existing.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const current = toCustomer(existing[0]);
  const merged = { ...current, ...body };
  // The display name follows first name + surname; a bare `name` patch (older callers) sets the first name.
  if (body.firstName === undefined && body.surname === undefined && body.name !== undefined) {
    merged.firstName = body.name;
    merged.surname = "";
  }
  merged.name = customerFullName(merged.firstName, merged.surname);
  if (!merged.name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const rows = await sql`
    UPDATE customers SET name = ${merged.name}, prefix = ${merged.prefix}, first_name = ${merged.firstName.trim()},
      surname = ${merged.surname.trim()}, segment = ${merged.segment}, contact_name = ${merged.contactName},
      email = ${merged.email}, phone = ${merged.phone}, architect = ${merged.architect}, gst_no = ${merged.gstNo},
      address = ${merged.address}, city = ${merged.city}, state = ${merged.state}, postcode = ${merged.postcode},
      birthday = ${merged.birthday}, notes = ${merged.notes}
    WHERE id = ${id}
    RETURNING *
  `;
  const updated = toCustomer(rows[0]);

  if (me) {
    const changes = diffFields(
      pickAudited(current),
      pickAudited(updated)
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
