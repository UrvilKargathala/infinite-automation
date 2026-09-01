import { Sparkles } from "lucide-react";
import { inMonth, daysUntil } from "@/lib/utils/dashboardMetrics";
import type { Ticket, Quote, Product } from "@/types";

export function AiSummary({ tickets, quotes, products }: { tickets: Ticket[]; quotes: Quote[]; products: Product[] }) {
  const now = new Date();
  const curMonth = now.getMonth();
  const curYear = now.getFullYear();
  const prevDate = new Date(curYear, curMonth - 1, 1);
  const prevMonth = prevDate.getMonth();
  const prevYear = prevDate.getFullYear();

  const quotesThisMonth = quotes.filter((q) => inMonth(q.date, curMonth, curYear));
  const quotesLastMonth = quotes.filter((q) => inMonth(q.date, prevMonth, prevYear));
  const acceptedThisMonth = quotesThisMonth.filter((q) => q.status === "Accepted").length;

  const resolvedThisMonth = tickets.filter((t) => (t.status === "Resolved" || t.status === "Closed") && inMonth(t.lastContact, curMonth, curYear));

  const openTickets = tickets.filter((t) => t.status !== "Resolved" && t.status !== "Closed");
  const urgentOpen = openTickets.filter((t) => t.priority === "Urgent").length;

  const categoryTotals = new Map<string, number>();
  openTickets.forEach((t) => categoryTotals.set(t.category, (categoryTotals.get(t.category) ?? 0) + 1));
  const topCategory = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1])[0];

  const expiring = quotes
    .filter((q) => q.status === "Draft" || q.status === "Sent")
    .map((q) => ({ q, days: daysUntil(q.validUntil) }))
    .filter((x) => x.days <= 7)
    .sort((a, b) => a.days - b.days);

  const missingPrice = products.filter((p) => p.price == null).length;

  const sentences: string[] = [];

  sentences.push(
    `${openTickets.length} open ticket${openTickets.length === 1 ? "" : "s"}${urgentOpen > 0 ? `, ${urgentOpen} urgent` : ""}${topCategory ? `, most common category is ${topCategory[0]}` : ""}.`
  );

  if (resolvedThisMonth.length > 0) {
    sentences.push(`${resolvedThisMonth.length} ticket${resolvedThisMonth.length === 1 ? "" : "s"} resolved this month.`);
  }

  if (quotesThisMonth.length > 0 || quotesLastMonth.length > 0) {
    const diff = quotesThisMonth.length - quotesLastMonth.length;
    const trend = diff > 0 ? `up from ${quotesLastMonth.length} last month` : diff < 0 ? `down from ${quotesLastMonth.length} last month` : `same as last month`;
    sentences.push(`${quotesThisMonth.length} quote${quotesThisMonth.length === 1 ? "" : "s"} created this month (${trend}), ${acceptedThisMonth} accepted.`);
  }

  if (expiring.length > 0) {
    const nearest = expiring[0];
    const dayLabel = nearest.days < 0 ? `${Math.abs(nearest.days)}d overdue` : nearest.days === 0 ? "today" : `in ${nearest.days}d`;
    sentences.push(`${expiring.length} quote${expiring.length === 1 ? "" : "s"} expiring soon — ${nearest.q.client} (${nearest.q.number}) ${dayLabel}.`);
  }

  if (missingPrice > 0) {
    sentences.push(`${missingPrice} product${missingPrice === 1 ? "" : "s"} in Master File still missing a price.`);
  }

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-card border border-white/60 p-4 sm:p-6 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-brand-gradient grid place-items-center shrink-0">
          <Sparkles size={15} className="text-white" />
        </div>
        <h2 className="text-lg text-text-primary">Weekly summary</h2>
      </div>
      <p className="text-sm text-text-secondary leading-relaxed">{sentences.join(" ")}</p>
    </div>
  );
}
