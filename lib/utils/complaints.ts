import type { Complaint, ComplaintStatus } from "@/types";

export const COMPLAINT_STATUS_COLOR: Record<ComplaintStatus, string> = { Pending: "#F59E0B", Completed: "#44BE4A", Cancelled: "#94A3B8" };

/** Days a pending complaint can sit before it turns orange, then red. */
export const COMPLAINT_WARN_DAYS = 3;
export const COMPLAINT_OVERDUE_DAYS = 7;

const DAY = 86400000;
const days = (from: string, to: number | string) => Math.max(0, Math.floor((new Date(to).getTime() - new Date(from).getTime()) / DAY));

/** "Today" / "3d" — how long a duration of `n` days reads. */
export const daysLabel = (n: number) => (n === 0 ? "today" : `${n}d`);

/**
 * How old a complaint is, for the list and panel: pending ones count up to now and go orange / red when they're
 * slow; completed ones show how long the fix took; cancelled ones have no age.
 */
export function complaintAge(c: Complaint, now = Date.now()): { label: string; tone: "warn" | "danger" | "muted" } | null {
  if (c.status === "Cancelled") return null;
  if (c.status === "Completed") return c.completedAt ? { label: `fixed in ${daysLabel(days(c.createdAt, c.completedAt))}`, tone: "muted" } : null;
  const n = days(c.createdAt, now);
  return { label: n === 0 ? "opened today" : `${n}d open`, tone: n >= COMPLAINT_OVERDUE_DAYS ? "danger" : n >= COMPLAINT_WARN_DAYS ? "warn" : "muted" };
}

export const AGE_TONE_CLASS = { warn: "text-warning", danger: "text-danger", muted: "text-text-muted" } as const;
