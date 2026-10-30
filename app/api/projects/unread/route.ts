import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";

export const dynamic = "force-dynamic";

/**
 * Unread chat messages per CRM record for the signed-in user: { [projectId]: count }.
 * Counts other people's messages since the user last opened that chat, but only on records they follow —
 * they're the assignee, have posted or opened the chat before, or were @mentioned — so admins aren't buried.
 */
export async function GET() {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const rows = await sql`
    SELECT m.project_id, count(*)::int AS n
    FROM project_messages m
    JOIN projects p ON p.id = m.project_id
    LEFT JOIN project_message_reads r ON r.project_id = m.project_id AND r.user_id = ${me.id}
    WHERE m.user_id <> ${me.id}
      AND m.deleted = false
      AND m.created_at > COALESCE(r.last_read_at, '-infinity'::timestamptz)
      AND (
        lower(trim(p.assigned)) = lower(${me.fullName})
        OR r.user_id IS NOT NULL
        OR EXISTS (SELECT 1 FROM project_messages mine WHERE mine.project_id = m.project_id AND mine.user_id = ${me.id})
        OR m.text ILIKE ${"%@" + me.fullName + "%"}
      )
    GROUP BY m.project_id
  `;
  return NextResponse.json(Object.fromEntries(rows.map((r) => [r.project_id as number, r.n as number])));
}
