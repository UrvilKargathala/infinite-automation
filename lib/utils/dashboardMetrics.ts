import type { Lead, Quote } from "@/types";
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
export function computeMonthlyMetrics(leads: Lead[], quotes: Quote[]) {
  const now = new Date();
  const curMonth = now.getMonth();
  const curYear = now.getFullYear();
  const prevDate = new Date(curYear, curMonth - 1, 1);
  const prevMonth = prevDate.getMonth();
  const prevYear = prevDate.getFullYear();

  const activeLeads = leads.filter((l) => l.stage !== "Won" && l.stage !== "Lost");
  const pipelineValue = activeLeads.reduce((s, l) => s + l.value, 0);
  const pipelineThisMonth = activeLeads.filter((l) => inMonth(l.lastContact, curMonth, curYear)).reduce((s, l) => s + l.value, 0);
  const pipelineLastMonth = activeLeads.filter((l) => inMonth(l.lastContact, prevMonth, prevYear)).reduce((s, l) => s + l.value, 0);

  const activeLeadsThisMonth = activeLeads.filter((l) => inMonth(l.lastContact, curMonth, curYear)).length;
  const activeLeadsLastMonth = activeLeads.filter((l) => inMonth(l.lastContact, prevMonth, prevYear)).length;

  const quotesThisMonth = quotes.filter((q) => inMonth(q.date, curMonth, curYear));
  const quotesLastMonth = quotes.filter((q) => inMonth(q.date, prevMonth, prevYear));

  const wonThisMonth = leads.filter((l) => l.stage === "Won" && inMonth(l.lastContact, curMonth, curYear));
  const wonLastMonth = leads.filter((l) => l.stage === "Won" && inMonth(l.lastContact, prevMonth, prevYear));
  const wonValueThisMonth = wonThisMonth.reduce((s, l) => s + l.value, 0);
  const wonValueLastMonth = wonLastMonth.reduce((s, l) => s + l.value, 0);

  const activeQuotes = quotes.filter((q) => q.status === "Draft" || q.status === "Sent");
  const activeQuotesThisMonth = activeQuotes.filter((q) => inMonth(q.date, curMonth, curYear)).length;
  const activeQuotesLastMonth = activeQuotes.filter((q) => inMonth(q.date, prevMonth, prevYear)).length;

  return {
    curMonth, curYear, prevMonth, prevYear,
    activeLeads, pipelineValue,
    pipelineDeltaPct: pctChange(pipelineThisMonth, pipelineLastMonth),
    activeLeadsThisMonth, activeLeadsLastMonth,
    activeLeadsDeltaCount: activeLeadsThisMonth - activeLeadsLastMonth,
    quotesThisMonth, quotesLastMonth,
    activeQuotesThisMonth, activeQuotesLastMonth,
    activeQuotesDeltaCount: activeQuotesThisMonth - activeQuotesLastMonth,
    wonThisMonth, wonValueThisMonth, wonValueLastMonth,
    wonDeltaPct: pctChange(wonValueThisMonth, wonValueLastMonth),
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
