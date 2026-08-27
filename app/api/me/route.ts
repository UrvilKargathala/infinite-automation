import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
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
  const clerkUser = await currentUser();
  if (!clerkUser) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const email = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase();
  if (!email) return NextResponse.json({ error: "No email on account" }, { status: 400 });

  // Match by clerk_user_id first (already linked), else by email (first login — link it now)
  let rows = await sql`SELECT * FROM users WHERE clerk_user_id = ${clerkUser.id}`;
  if (rows.length === 0) {
    rows = await sql`SELECT * FROM users WHERE lower(email) = ${email}`;
    if (rows.length > 0) {
      rows = await sql`UPDATE users SET clerk_user_id = ${clerkUser.id} WHERE id = ${rows[0].id} RETURNING *`;
    }
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "No account provisioned for this email. Ask a Super Admin to add you in User Management." }, { status: 403 });
  }

  return NextResponse.json(toUser(rows[0]));
}
