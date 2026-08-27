import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import type { User } from "@/types";

function toUser(row: Record<string, unknown>): User {
  return {
    id: row.id as number,
    fullName: row.full_name as string,
    email: row.email as string,
    role: row.role as User["role"],
    status: row.status as User["status"],
  };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const body = (await req.json()) as Partial<Omit<User, "id">>;
  const existing = await sql`SELECT * FROM users WHERE id = ${id}`;
  if (existing.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const merged = { ...toUser(existing[0]), ...body };
  const rows = await sql`
    UPDATE users SET full_name = ${merged.fullName}, email = ${merged.email},
      role = ${merged.role}, status = ${merged.status}
    WHERE id = ${id}
    RETURNING *
  `;
  return NextResponse.json(toUser(rows[0]));
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  await sql`DELETE FROM users WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
