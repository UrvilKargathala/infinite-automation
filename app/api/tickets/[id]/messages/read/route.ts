import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";

/** Mark this ticket's chat as read up to now for the signed-in user (clears its unread badge). */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  await sql`
    INSERT INTO ticket_message_reads (user_id, ticket_id, last_read_at) VALUES (${me.id}, ${Number(params.id)}, now())
    ON CONFLICT (user_id, ticket_id) DO UPDATE SET last_read_at = now()
  `;
  return NextResponse.json({ ok: true });
}
