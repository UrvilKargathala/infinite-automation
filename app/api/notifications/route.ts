import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import type { AppNotification } from "@/types";

export const dynamic = "force-dynamic";

function toNotification(row: Record<string, unknown>): AppNotification {
  return {
    id: row.id as number,
    text: row.text as string,
    color: row.color as string,
    read: row.read as boolean,
    createdAt: row.created_at as string,
  };
}

export async function GET() {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const rows = await sql`
    SELECT id, text, color, read, created_at::text AS created_at
    FROM notifications
    WHERE user_id = ${me.id}
    ORDER BY created_at DESC
    LIMIT 30
  `;
  return NextResponse.json(rows.map(toNotification));
}
