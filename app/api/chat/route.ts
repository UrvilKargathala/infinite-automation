import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";

export async function GET() {
  const rows = await sql`
    SELECT m.id, m.text, m.created_at::text AS created_at, u.id AS user_id, u.full_name
    FROM chat_messages m
    JOIN users u ON u.id = m.user_id
    ORDER BY m.created_at DESC
    LIMIT 100
  `;
  const messages = rows.reverse().map((r) => ({
    id: r.id as number,
    text: r.text as string,
    createdAt: r.created_at as string,
    userId: r.user_id as number,
    fullName: r.full_name as string,
  }));
  return NextResponse.json(messages);
}

export async function POST(req: Request) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = (await req.json()) as { text?: string };
  const text = body.text?.trim();
  if (!text) return NextResponse.json({ error: "Message text required" }, { status: 400 });

  const rows = await sql`
    INSERT INTO chat_messages (user_id, text) VALUES (${me.id}, ${text})
    RETURNING id, text, created_at::text AS created_at
  `;
  return NextResponse.json({
    id: rows[0].id as number,
    text: rows[0].text as string,
    createdAt: rows[0].created_at as string,
    userId: me.id,
    fullName: me.fullName,
  });
}
