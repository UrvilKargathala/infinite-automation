import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import type { Ticket } from "@/types";

export const dynamic = "force-dynamic";

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

export async function GET() {
  const rows = await sql`SELECT id, subject, name, company, email, phone, category, priority, status, assigned, last_contact::text FROM tickets ORDER BY id`;
  return NextResponse.json(rows.map(toTicket));
}

export async function POST(req: Request) {
  const body = (await req.json()) as Omit<Ticket, "id">;
  const rows = await sql`
    INSERT INTO tickets (subject, name, company, email, phone, category, priority, status, assigned, last_contact)
    VALUES (${body.subject}, ${body.name}, ${body.company}, ${body.email}, ${body.phone}, ${body.category}, ${body.priority}, ${body.status}, ${body.assigned}, ${body.lastContact})
    RETURNING id, subject, name, company, email, phone, category, priority, status, assigned, last_contact::text
  `;
  return NextResponse.json(toTicket(rows[0]), { status: 201 });
}
