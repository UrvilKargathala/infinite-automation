import type { AppNotification } from "@/types";

export type NotificationModule = "Complaints" | "CRM" | "Tickets" | "Quotes" | "Other";

/**
 * Which module a notification belongs to. Notifications don't store a type, so it's read from where they link
 * (/complaints?open=12 → Complaints); older ones with no link fall back to how their text starts.
 */
export function notificationModule(n: Pick<AppNotification, "href" | "text">): NotificationModule {
  if (n.href.startsWith("/complaints")) return "Complaints";
  if (n.href.startsWith("/crm")) return "CRM";
  if (n.href.startsWith("/tickets")) return "Tickets";
  if (n.href.startsWith("/quote")) return "Quotes";
  if (/^New ticket/i.test(n.text)) return "Tickets";
  if (/^Quote /i.test(n.text)) return "Quotes";
  return "Other";
}
