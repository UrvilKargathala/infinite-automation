import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";

export async function PATCH() {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  await sql`UPDATE notifications SET read = true WHERE user_id = ${me.id} AND read = false`;
  return NextResponse.json({ ok: true });
}
