import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { logAction } from "@/lib/api/audit";
import type { Customer } from "@/types";

export const dynamic = "force-dynamic";

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

export async function GET() {
  const rows = await sql`SELECT * FROM customers ORDER BY name`;
  return NextResponse.json(rows.map(toCustomer));
}

export async function POST(req: Request) {
  const me = await getCurrentAppUser();
  const body = (await req.json()) as Omit<Customer, "id" | "createdAt">;

  const rows = await sql`
    INSERT INTO customers (name, segment, contact_name, email, phone, address, notes)
    VALUES (${body.name}, ${body.segment}, ${body.contactName}, ${body.email}, ${body.phone}, ${body.address}, ${body.notes})
    RETURNING *
  `;
  const created = toCustomer(rows[0]);

  if (me) {
    await logAction({
      module: "CRM",
      action: "create",
      entityType: "customer",
      entityId: created.id,
      entityName: created.name,
      summary: `Added customer ${created.name} (${created.segment})`,
      changes: { after: { name: created.name, segment: created.segment, email: created.email, phone: created.phone } },
      actor: me,
    });
  }

  return NextResponse.json(created, { status: 201 });
}
