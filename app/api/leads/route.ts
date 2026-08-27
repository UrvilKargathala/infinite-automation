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

export async function GET() {
  const rows = await sql`SELECT id, name, company, email, phone, segment, stage, value, assigned, last_contact::text FROM leads ORDER BY id`;
  return NextResponse.json(rows.map(toLead));
}

export async function POST(req: Request) {
  const body = (await req.json()) as Omit<Lead, "id">;
  const rows = await sql`
    INSERT INTO leads (name, company, email, phone, segment, stage, value, assigned, last_contact)
    VALUES (${body.name}, ${body.company}, ${body.email}, ${body.phone}, ${body.segment}, ${body.stage}, ${body.value}, ${body.assigned}, ${body.lastContact})
    RETURNING id, name, company, email, phone, segment, stage, value, assigned, last_contact::text
  `;
  return NextResponse.json(toLead(rows[0]), { status: 201 });
}
