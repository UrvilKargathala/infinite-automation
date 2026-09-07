import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifySession, SESSION_COOKIE } from "@/lib/session";
import type { User } from "@/types";

export const dynamic = "force-dynamic";

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
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const rows = await sql`SELECT * FROM users WHERE id = ${session.userId}`;
  if (rows.length === 0) {
    return NextResponse.json({ error: "No account provisioned for this email. Ask a Super Admin to add you in User Management." }, { status: 403 });
  }

  return NextResponse.json(toUser(rows[0]));
}
