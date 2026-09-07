import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { signSession, SESSION_COOKIE } from "@/lib/session";
import { logAction } from "@/lib/api/audit";
import type { Role } from "@/types";

export const dynamic = "force-dynamic";

const LOGIN_PASSWORD = "IA@2026";

export async function POST(req: Request) {
  const { email, password } = (await req.json()) as { email?: string; password?: string };
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }
  if (password !== LOGIN_PASSWORD) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const rows = await sql`SELECT * FROM users WHERE lower(email) = ${email.toLowerCase().trim()}`;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  const user = rows[0];
  if (user.status !== "Active") {
    return NextResponse.json({ error: "This account is inactive. Ask a Super Admin to reactivate it." }, { status: 403 });
  }

  const role = user.role as Role;
  const token = await signSession(user.id as number, role);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  await logAction({
    module: "Auth",
    action: "login",
    entityType: "session",
    entityName: user.full_name as string,
    summary: `User ${user.full_name} logged in`,
    metadata: { method: "email_password" },
    actor: { id: user.id as number, fullName: user.full_name as string, role },
  });

  return res;
}
