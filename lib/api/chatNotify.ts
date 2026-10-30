import { sql } from "@/lib/db";
import { createNotifications } from "@/lib/api/notifications";

type ChatKind = "project" | "ticket";

const SOURCE = {
  project: { table: "project_messages", key: "project_id", href: (id: number) => `/crm?open=${id}` },
  ticket: { table: "ticket_messages", key: "ticket_id", href: (id: number) => `/tickets?open=${id}` },
} as const;

function snippet(text: string, attachments: number): string {
  if (!text) return attachments ? "sent an attachment" : "";
  const flat = text.replace(/\s+/g, " ").trim();
  return `“${flat.length > 70 ? flat.slice(0, 70) + "…" : flat}”`;
}

/**
 * After a chat message is saved, tell the people who need to know:
 *  - everyone @mentioned (by their full name) → "mentioned you"
 *  - the record's assignee + anyone who already posted in this chat → "new message"
 * The sender is never notified, and a person only ever gets one of the two.
 * "Assigned to" stores a name, so it is matched to an active user by full name.
 * Never throws — a notification failure must not fail the message.
 */
export async function notifyChatMessage(opts: {
  kind: ChatKind;
  recordId: number;
  recordLabel: string;
  assignedName: string;
  sender: { id: number; fullName: string };
  text: string;
  attachments: number;
}): Promise<void> {
  try {
    const src = SOURCE[opts.kind];
    const users = (await sql`SELECT id, full_name FROM users WHERE status = 'Active'`) as { id: number; full_name: string }[];
    const lower = opts.text.toLowerCase();

    const mentioned = new Set(
      users.filter((u) => u.id !== opts.sender.id && lower.includes(`@${u.full_name.toLowerCase()}`)).map((u) => u.id)
    );

    const participants = (await sql.query(
      `SELECT DISTINCT user_id FROM ${src.table} WHERE ${src.key} = $1 AND user_id <> $2`,
      [opts.recordId, opts.sender.id]
    )) as { user_id: number }[];
    const assignee = users.find((u) => u.full_name.trim().toLowerCase() === opts.assignedName.trim().toLowerCase());
    const followers = new Set<number>(participants.map((p) => p.user_id));
    if (assignee && assignee.id !== opts.sender.id) followers.add(assignee.id);
    mentioned.forEach((id) => followers.delete(id));

    const quote = snippet(opts.text, opts.attachments);
    const href = src.href(opts.recordId);
    await createNotifications([...mentioned], `${opts.sender.fullName} mentioned you in ${opts.recordLabel}${quote ? `: ${quote}` : ""}`, "#8B5CF6", href);
    await createNotifications([...followers], `${opts.sender.fullName} in ${opts.recordLabel}${quote ? `: ${quote}` : ""}`, "#3A90C3", href);
  } catch (err) {
    console.error("[chat] failed to notify", err);
  }
}
