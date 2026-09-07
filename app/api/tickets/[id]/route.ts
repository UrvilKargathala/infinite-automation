import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { logAction, diffFields } from "@/lib/api/audit";
import type { Ticket } from "@/types";

function toTicket(row: Record<string, unknown>): Ticket {
  return {
    id: row.id as number,
    subject: row.subject as string,
    name: row.name as string,
    company: row.company as string,
    email: row.email as string,
    phone: row.phone as string,
    category: row.category as Ticket["category"],
    priority: row.priority as Ticket["priority"],
    status: row.status as Ticket["status"],
    assigned: row.assigned as string,
    lastContact: (row.last_contact as string) ?? "",
  };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentAppUser();
  const id = Number(params.id);
  const body = (await req.json()) as Partial<Omit<Ticket, "id">>;
  const existing = await sql`SELECT id, subject, name, company, email, phone, category, priority, status, assigned, last_contact::text FROM tickets WHERE id = ${id}`;
  if (existing.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const before = toTicket(existing[0]);
  const merged = { ...before, ...body };
  const rows = await sql`
    UPDATE tickets SET subject = ${merged.subject}, name = ${merged.name}, company = ${merged.company}, email = ${merged.email},
      phone = ${merged.phone}, category = ${merged.category}, priority = ${merged.priority}, status = ${merged.status},
      assigned = ${merged.assigned}, last_contact = ${merged.lastContact}
    WHERE id = ${id}
    RETURNING id, subject, name, company, email, phone, category, priority, status, assigned, last_contact::text
  `;
  const updated = toTicket(rows[0]);

  if (me) {
    const { id: _bid, ...beforeFields } = before;
    const { id: _aid, ...afterFields } = updated;
    const changes = diffFields(beforeFields, afterFields);
    if (changes) {
      const changedKeys = Object.keys(changes.after ?? {});
      const isStatusOnly = changedKeys.length === 1 && changedKeys[0] === "status";
      await logAction({
        module: "CRM",
        action: isStatusOnly ? "status_change" : "update",
        entityType: "ticket",
        entityId: updated.id,
        entityName: updated.subject,
        summary: isStatusOnly
          ? `Moved ticket ${updated.subject} from ${before.status} to ${updated.status}`
          : `Updated ticket ${updated.subject}`,
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
  const existing = await sql`SELECT id, subject, name, company, email, phone, category, priority, status, assigned, last_contact::text FROM tickets WHERE id = ${id}`;
  await sql`DELETE FROM tickets WHERE id = ${id}`;

  if (me && existing.length > 0) {
    const deleted = toTicket(existing[0]);
    await logAction({
      module: "CRM",
      action: "delete",
      entityType: "ticket",
      entityId: deleted.id,
      entityName: deleted.subject,
      summary: `Deleted ticket ${deleted.subject} (${deleted.company})`,
      changes: { before: { ...deleted } },
      actor: me,
    });
  }

  return NextResponse.json({ ok: true });
}
