import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
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
  const id = Number(params.id);
  const body = (await req.json()) as Partial<Omit<Ticket, "id">>;
  const existing = await sql`SELECT id, subject, name, company, email, phone, category, priority, status, assigned, last_contact::text FROM tickets WHERE id = ${id}`;
  if (existing.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const merged = { ...toTicket(existing[0]), ...body };
  const rows = await sql`
    UPDATE tickets SET subject = ${merged.subject}, name = ${merged.name}, company = ${merged.company}, email = ${merged.email},
      phone = ${merged.phone}, category = ${merged.category}, priority = ${merged.priority}, status = ${merged.status},
      assigned = ${merged.assigned}, last_contact = ${merged.lastContact}
    WHERE id = ${id}
    RETURNING id, subject, name, company, email, phone, category, priority, status, assigned, last_contact::text
  `;
  return NextResponse.json(toTicket(rows[0]));
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  await sql`DELETE FROM tickets WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
