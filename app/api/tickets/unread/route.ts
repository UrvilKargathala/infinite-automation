import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";

export const dynamic = "force-dynamic";

/**
 * Unread chat messages per ticket for the signed-in user: { [ticketId]: count }.
 * Counts other people's messages since the user last opened that chat, but only on tickets they follow —
 * they're the assignee, have posted or opened the chat before, or were @mentioned — so admins aren't buried.
 */
export async function GET() {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const rows = await sql`
    SELECT m.ticket_id, count(*)::int AS n
    FROM ticket_messages m
    JOIN tickets t ON t.id = m.ticket_id
    LEFT JOIN ticket_message_reads r ON r.ticket_id = m.ticket_id AND r.user_id = ${me.id}
    WHERE m.user_id <> ${me.id}
      AND m.deleted = false
      AND m.created_at > COALESCE(r.last_read_at, '-infinity'::timestamptz)
      AND (
        lower(trim(t.assigned)) = lower(${me.fullName})
        OR r.user_id IS NOT NULL
        OR EXISTS (SELECT 1 FROM ticket_messages mine WHERE mine.ticket_id = m.ticket_id AND mine.user_id = ${me.id})
        OR m.text ILIKE ${"%@" + me.fullName + "%"}
      )
    GROUP BY m.ticket_id
  `;
  return NextResponse.json(Object.fromEntries(rows.map((r) => [r.ticket_id as number, r.n as number])));
}
