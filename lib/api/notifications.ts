import { sql } from "@/lib/db";

/** Inserts one notification row per recipient. Never throws — a notification failure must not block the action that triggered it. */
export async function createNotifications(userIds: number[], text: string, color: string, href = ""): Promise<void> {
  if (userIds.length === 0) return;
  try {
    await Promise.all(userIds.map((id) => sql`INSERT INTO notifications (user_id, text, color, href) VALUES (${id}, ${text}, ${color}, ${href})`));
  } catch (err) {
    console.error("Failed to create notifications", err);
  }
}

/** Active users whose full name matches (CRM records and tickets store their assignee as a name). */
export async function userIdsByName(name: string | null | undefined): Promise<number[]> {
  const n = (name ?? "").trim().toLowerCase();
  if (!n) return [];
  try {
    const rows = await sql`SELECT id FROM users WHERE lower(trim(full_name)) = ${n} AND status = 'Active'`;
    return rows.map((r) => r.id as number);
  } catch (err) {
    console.error("Failed to look up assignee", err);
    return [];
  }
}

/** Tells the person a record is assigned to about it — never the person who just did it. */
export async function notifyAssignee(assignedName: string | null | undefined, actorId: number | undefined, text: string, color: string, href: string): Promise<void> {
  const ids = (await userIdsByName(assignedName)).filter((id) => id !== actorId);
  await createNotifications(ids, text, color, href);
}

/** "Quote N accepted / rejected" for everyone who turned on quote alerts (except whoever changed it). */
export async function notifyQuoteStatus(quote: { id: number; number: string }, status: "Accepted" | "Rejected", actorId: number): Promise<void> {
  try {
    const recipients = await sql`SELECT id FROM users WHERE id != ${actorId} AND status = 'Active' AND quote_alerts = true`;
    await createNotifications(recipients.map((r) => r.id as number), `Quote ${quote.number} ${status.toLowerCase()}`, status === "Accepted" ? "#10B981" : "#EF4444", `/quote?open=${quote.id}`);
  } catch (err) {
    console.error("Failed to notify quote status", err);
  }
}
