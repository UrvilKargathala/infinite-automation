// Local-date helpers for the DatePicker. Dates are kept as YYYY-MM-DD strings (CLAUDE.md) and built with
// new Date(y, m, d) so no UTC conversion can shift a day.

export const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export function parseISODate(s: string | null | undefined): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? "");
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toISODate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function today(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

/** Same day-of-month n months away, clamped to the target month's length (31 Jan + 1 → 28/29 Feb). */
export function addMonths(d: Date, n: number): Date {
  const last = new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate();
  return new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), last));
}

export function sameDay(a: Date | null, b: Date | null): boolean {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Monday on or before the given date. */
export function startOfWeek(d: Date): Date {
  return addDays(d, -((d.getDay() + 6) % 7));
}

/** 6 weeks × 7 days, Monday-first, covering the month that `view` falls in. */
export function monthGrid(view: Date): Date[] {
  const first = startOfWeek(new Date(view.getFullYear(), view.getMonth(), 1));
  return Array.from({ length: 42 }, (_, i) => addDays(first, i));
}

export function formatDisplayDate(iso: string): string {
  const d = parseISODate(iso);
  return d ? d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : "";
}

export function formatMonth(d: Date): string {
  return d.toLocaleDateString("en-AU", { month: "long", year: "numeric" });
}
