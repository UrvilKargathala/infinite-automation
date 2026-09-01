import { currentUser } from "@clerk/nextjs/server";
import { sql } from "@/lib/db";

/** Resolves the signed-in Clerk user to their linked `users` row (id + full_name), or null. */
export async function getCurrentAppUser(): Promise<{ id: number; fullName: string } | null> {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;
  const email = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase();

  let rows = await sql`SELECT id, full_name FROM users WHERE clerk_user_id = ${clerkUser.id}`;
  if (rows.length === 0 && email) {
    rows = await sql`SELECT id, full_name FROM users WHERE lower(email) = ${email}`;
  }
  if (rows.length === 0) return null;
  return { id: rows[0].id as number, fullName: rows[0].full_name as string };
}
