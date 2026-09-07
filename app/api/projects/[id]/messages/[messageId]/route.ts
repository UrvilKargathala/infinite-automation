import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";

export async function DELETE(_req: Request, { params }: { params: { id: string; messageId: string } }) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const messageId = Number(params.messageId);
  const existing = await sql`SELECT user_id FROM project_messages WHERE id = ${messageId}`;
  if (existing.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing[0].user_id !== me.id) {
    return NextResponse.json({ error: "You can only delete your own messages" }, { status: 403 });
  }

  await sql`UPDATE project_messages SET deleted = true WHERE id = ${messageId}`;
  return NextResponse.json({ ok: true });
}
