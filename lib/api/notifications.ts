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
