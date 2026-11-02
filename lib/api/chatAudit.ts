import { sql } from "@/lib/db";
import { logAction } from "@/lib/api/audit";
import type { Attachment, Role } from "@/types";

type Kind = "project" | "ticket";

// Project chats are logged under Projects, ticket chats under CRM (the same modules their records use).
const KINDS = {
  project: { module: "Projects" as const, label: "SELECT customer_name AS label FROM projects WHERE id = $1", noun: "CRM record" },
  ticket: { module: "CRM" as const, label: "SELECT subject AS label FROM tickets WHERE id = $1", noun: "ticket" },
};

/**
 * Audit-log a chat message being sent (with its files, if any), edited or deleted. Files are listed by name and size
 * so "who uploaded what, where" can be answered from the audit log. Never throws — logging mustn't block the chat.
 */
export async function auditChat(opts: {
  kind: Kind;
  recordId: number;
  messageId: number;
  action: "create" | "update" | "delete";
  actor: { id: number; fullName: string; role: Role };
  text?: string;
  attachments?: Attachment[];
}): Promise<void> {
  try {
    const k = KINDS[opts.kind];
    const [row] = await sql.query(k.label, [opts.recordId]);
    const label = (row?.label as string) ?? `#${opts.recordId}`;
    const files = opts.attachments ?? [];
    const verb = opts.action === "create" ? "Sent a message" : opts.action === "update" ? "Edited a message" : "Deleted a message";
    await logAction({
      module: k.module,
      action: opts.action,
      entityType: "message",
      entityId: opts.messageId,
      entityName: label,
      summary: `${verb} on ${k.noun} ${label}${files.length > 0 ? ` with ${files.length} file${files.length === 1 ? "" : "s"}` : ""}`,
      metadata: {
        ...(opts.text ? { preview: opts.text.slice(0, 120) } : {}),
        ...(files.length > 0 ? { files: files.map((f) => ({ name: f.name, size: f.size ?? null, type: f.type })) } : {}),
      },
      actor: opts.actor,
    });
  } catch (err) {
    console.error("Failed to audit chat message", err);
  }
}
