import type { Ticket, Quote } from "@/types";
import { calcQuoteTotal } from "@/lib/utils/quote";

export function inMonth(dateStr: string, month: number, year: number): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d.getMonth() === month && d.getFullYear() === year;
}

export function daysUntil(dateStr: string): number {
  const ms = new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.round(ms / 86400000);
}

/** % change from `prev` to `cur`, null when there's nothing to compare against. */
export function pctChange(cur: number, prev: number): number | null {
  if (prev === 0) return cur === 0 ? null : 100;
  return ((cur - prev) / prev) * 100;
}

/** Shared month-over-month numbers used by the dashboard KPI cards and the AI summary. */
export function computeMonthlyMetrics(tickets: Ticket[], quotes: Quote[]) {
  const now = new Date();
  const curMonth = now.getMonth();
  const curYear = now.getFullYear();
  const prevDate = new Date(curYear, curMonth - 1, 1);
  const prevMonth = prevDate.getMonth();
  const prevYear = prevDate.getFullYear();

  const openTickets = tickets.filter((t) => t.status !== "Resolved" && t.status !== "Closed");
  const openThisMonth = openTickets.filter((t) => inMonth(t.lastContact, curMonth, curYear)).length;
  const openLastMonth = openTickets.filter((t) => inMonth(t.lastContact, prevMonth, prevYear)).length;

  const urgentTickets = openTickets.filter((t) => t.priority === "Urgent");
  const urgentThisMonth = urgentTickets.filter((t) => inMonth(t.lastContact, curMonth, curYear)).length;
  const urgentLastMonth = urgentTickets.filter((t) => inMonth(t.lastContact, prevMonth, prevYear)).length;

  const quotesThisMonth = quotes.filter((q) => inMonth(q.date, curMonth, curYear));
  const quotesLastMonth = quotes.filter((q) => inMonth(q.date, prevMonth, prevYear));

  const resolvedThisMonth = tickets.filter((t) => (t.status === "Resolved" || t.status === "Closed") && inMonth(t.lastContact, curMonth, curYear));
  const resolvedLastMonth = tickets.filter((t) => (t.status === "Resolved" || t.status === "Closed") && inMonth(t.lastContact, prevMonth, prevYear));

  const activeQuotes = quotes.filter((q) => q.status === "Draft" || q.status === "Sent");
  const activeQuotesThisMonth = activeQuotes.filter((q) => inMonth(q.date, curMonth, curYear)).length;
  const activeQuotesLastMonth = activeQuotes.filter((q) => inMonth(q.date, prevMonth, prevYear)).length;

  return {
    curMonth, curYear, prevMonth, prevYear,
    openTickets, urgentTickets,
    openDeltaCount: openThisMonth - openLastMonth,
    urgentDeltaCount: urgentThisMonth - urgentLastMonth,
    quotesThisMonth, quotesLastMonth,
    activeQuotesThisMonth, activeQuotesLastMonth,
    activeQuotesDeltaCount: activeQuotesThisMonth - activeQuotesLastMonth,
    resolvedThisMonth, resolvedLastMonth,
    resolvedDeltaPct: pctChange(resolvedThisMonth.length, resolvedLastMonth.length),
  };
}

/** Last 6 months (oldest first) of quote counts + accepted revenue, for the dashboard line chart. */
export function computeMonthlySeries(quotes: Quote[]) {
  const now = new Date();
  const months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { month: d.toLocaleString("en-US", { month: "short" }), m: d.getMonth(), y: d.getFullYear() };
  });
  return months.map(({ month, m, y }) => {
    const inThisMonth = quotes.filter((q) => inMonth(q.date, m, y));
    const revenue = inThisMonth
      .filter((q) => q.status === "Accepted")
      .reduce((s, q) => s + calcQuoteTotal(q).grandTotal, 0);
    return { month, quotes: inThisMonth.length, revenue };
  });
}
