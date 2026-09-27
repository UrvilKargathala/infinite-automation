import type { Ticket, Quote, Customer, CustomerSegment } from "@/types";
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

/** Accepted-quote revenue grouped by the linked customer's segment. Quotes with no linked customer are excluded. */
export function computeRevenueBySegment(quotes: Quote[], customers: Customer[]): { segment: CustomerSegment; revenue: number }[] {
  const customerById = new Map(customers.map((c) => [c.id, c]));
  const bySegment = new Map<CustomerSegment, number>();
  quotes
    .filter((q) => q.status === "Accepted" && q.customerId != null)
    .forEach((q) => {
      const customer = customerById.get(q.customerId!);
      if (!customer) return;
      const revenue = calcQuoteTotal(q).grandTotal;
      bySegment.set(customer.segment, (bySegment.get(customer.segment) ?? 0) + revenue);
    });
  return Array.from(bySegment.entries())
    .map(([segment, revenue]) => ({ segment, revenue }))
    .sort((a, b) => b.revenue - a.revenue);
}

/** Customers ranked by accepted-quote revenue, with their linked ticket count. Customers with zero revenue are excluded. */
export function computeTopCustomers(quotes: Quote[], tickets: Ticket[], customers: Customer[], limit = 5) {
  const revenueByCustomer = new Map<number, number>();
  quotes
    .filter((q) => q.status === "Accepted" && q.customerId != null)
    .forEach((q) => {
      revenueByCustomer.set(q.customerId!, (revenueByCustomer.get(q.customerId!) ?? 0) + calcQuoteTotal(q).grandTotal);
    });
  const ticketCountByCustomer = new Map<number, number>();
  tickets
    .filter((t) => t.customerId != null)
    .forEach((t) => {
      ticketCountByCustomer.set(t.customerId!, (ticketCountByCustomer.get(t.customerId!) ?? 0) + 1);
    });
  return customers
    .map((c) => ({ customer: c, revenue: revenueByCustomer.get(c.id) ?? 0, ticketCount: ticketCountByCustomer.get(c.id) ?? 0 }))
    .filter((c) => c.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

/** Customers with no linked ticket, project, or quote at all. */
export function countInactiveCustomers(customers: Customer[], tickets: Ticket[], projects: { customerId: number | null }[], quotes: Quote[]): number {
  const linked = new Set<number>();
  tickets.forEach((t) => t.customerId != null && linked.add(t.customerId));
  projects.forEach((p) => p.customerId != null && linked.add(p.customerId));
  quotes.forEach((q) => q.customerId != null && linked.add(q.customerId));
  return customers.filter((c) => !linked.has(c.id)).length;
}
