import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { logAction } from "@/lib/api/audit";

export async function POST() {
  const me = await getCurrentAppUser();
  if (me) {
    await logAction({
      module: "Auth",
      action: "logout",
      entityType: "session",
      entityName: me.fullName,
      summary: `User ${me.fullName} logged out`,
      actor: me,
    });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
