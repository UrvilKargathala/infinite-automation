import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const id = Number(params.id);
  await sql`UPDATE notifications SET read = true WHERE id = ${id} AND user_id = ${me.id}`;
  return NextResponse.json({ ok: true });
}
