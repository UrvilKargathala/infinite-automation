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

export async function GET() {
  const rows = await sql`SELECT * FROM users ORDER BY id`;
  return NextResponse.json(rows.map(toUser));
}

export async function POST(req: Request) {
  const body = (await req.json()) as Omit<User, "id">;
  const rows = await sql`
    INSERT INTO users (full_name, email, role, status)
    VALUES (${body.fullName}, ${body.email}, ${body.role}, ${body.status})
    RETURNING *
  `;
  return NextResponse.json(toUser(rows[0]), { status: 201 });
}
