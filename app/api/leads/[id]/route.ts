import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import type { Lead } from "@/types";

function toLead(row: Record<string, unknown>): Lead {
  return {
    id: row.id as number,
    name: row.name as string,
    company: row.company as string,
    email: row.email as string,
    phone: row.phone as string,
    segment: row.segment as Lead["segment"],
    stage: row.stage as Lead["stage"],
    value: Number(row.value),
    assigned: row.assigned as string,
    lastContact: (row.last_contact as string) ?? "",
  };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const body = (await req.json()) as Partial<Omit<Lead, "id">>;
  const existing = await sql`SELECT id, name, company, email, phone, segment, stage, value, assigned, last_contact::text FROM leads WHERE id = ${id}`;
  if (existing.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const merged = { ...toLead(existing[0]), ...body };
  const rows = await sql`
    UPDATE leads SET name = ${merged.name}, company = ${merged.company}, email = ${merged.email},
      phone = ${merged.phone}, segment = ${merged.segment}, stage = ${merged.stage},
      value = ${merged.value}, assigned = ${merged.assigned}, last_contact = ${merged.lastContact}
    WHERE id = ${id}
    RETURNING id, name, company, email, phone, segment, stage, value, assigned, last_contact::text
  `;
  return NextResponse.json(toLead(rows[0]));
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  await sql`DELETE FROM leads WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
