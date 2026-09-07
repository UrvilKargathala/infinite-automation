import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifySession, SESSION_COOKIE } from "@/lib/session";
import type { Role } from "@/types";

/** Resolves the signed-in session cookie to its `users` row (id + full_name + role), or null. */
export async function getCurrentAppUser(): Promise<{ id: number; fullName: string; role: Role } | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return null;

  const rows = await sql`SELECT id, full_name, role FROM users WHERE id = ${session.userId}`;
  if (rows.length === 0) return null;
  return { id: rows[0].id as number, fullName: rows[0].full_name as string, role: rows[0].role as Role };
}
