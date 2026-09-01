import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import type { Attachment, TicketMessage } from "@/types";

function toMessage(r: Record<string, unknown>): TicketMessage {
  return {
    id: r.id as number,
    ticketId: r.ticket_id as number,
    userId: r.user_id as number,
    fullName: r.full_name as string,
    text: r.deleted ? "" : (r.text as string),
    attachments: r.deleted ? [] : ((r.attachments as Attachment[]) ?? []),
    createdAt: r.created_at as string,
    replyToId: (r.reply_to_id as number) ?? null,
    replyToText: (r.reply_to_text as string) ?? null,
    replyToFullName: (r.reply_to_full_name as string) ?? null,
    isForwarded: r.is_forwarded as boolean,
    deleted: r.deleted as boolean,
  };
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const ticketId = Number(params.id);

  const messageRows = await sql`
    SELECT m.id, m.ticket_id, m.text, m.attachments, m.created_at::text AS created_at,
           m.reply_to_id, m.is_forwarded, m.deleted,
           u.id AS user_id, u.full_name,
           rt.text AS reply_to_text, ru.full_name AS reply_to_full_name
    FROM ticket_messages m
    JOIN users u ON u.id = m.user_id
    LEFT JOIN ticket_messages rt ON rt.id = m.reply_to_id
    LEFT JOIN users ru ON ru.id = rt.user_id
    WHERE m.ticket_id = ${ticketId}
    ORDER BY m.created_at ASC
  `;

  return NextResponse.json(messageRows.map(toMessage));
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ticketId = Number(params.id);
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = (await req.json()) as {
    text?: string;
    attachments?: Attachment[];
    replyToId?: number | null;
    isForwarded?: boolean;
  };
  const text = (body.text ?? "").trim();
  const attachments = body.attachments ?? [];
  const replyToId = body.replyToId ?? null;
  const isForwarded = body.isForwarded ?? false;
  if (!text && attachments.length === 0) {
    return NextResponse.json({ error: "Message text or attachment required" }, { status: 400 });
  }

  const rows = await sql`
    INSERT INTO ticket_messages (ticket_id, user_id, text, attachments, reply_to_id, is_forwarded)
    VALUES (${ticketId}, ${me.id}, ${text}, ${JSON.stringify(attachments)}, ${replyToId}, ${isForwarded})
    RETURNING id, created_at::text AS created_at
  `;
  const messageId = rows[0].id as number;

  let replyToText: string | null = null;
  let replyToFullName: string | null = null;
  if (replyToId) {
    const rt = await sql`
      SELECT m.text, u.full_name FROM ticket_messages m JOIN users u ON u.id = m.user_id WHERE m.id = ${replyToId}
    `;
    if (rt.length > 0) {
      replyToText = rt[0].text as string;
      replyToFullName = rt[0].full_name as string;
    }
  }

  const message: TicketMessage = {
    id: messageId,
    ticketId,
    userId: me.id,
    fullName: me.fullName,
    text,
    attachments,
    createdAt: rows[0].created_at as string,
    replyToId,
    replyToText,
    replyToFullName,
    isForwarded,
    deleted: false,
  };

  return NextResponse.json(message, { status: 201 });
}
