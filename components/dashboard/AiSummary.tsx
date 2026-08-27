import { Sparkles } from "lucide-react";
import { formatINR } from "@/lib/utils/format";
import type { Lead, Quote, Product } from "@/types";

function inMonth(dateStr: string, month: number, year: number): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d.getMonth() === month && d.getFullYear() === year;
}

function daysUntil(dateStr: string): number {
  const ms = new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.round(ms / 86400000);
}

export function AiSummary({ leads, quotes, products }: { leads: Lead[]; quotes: Quote[]; products: Product[] }) {
  const now = new Date();
  const curMonth = now.getMonth();
  const curYear = now.getFullYear();
  const prevDate = new Date(curYear, curMonth - 1, 1);
  const prevMonth = prevDate.getMonth();
  const prevYear = prevDate.getFullYear();

  const quotesThisMonth = quotes.filter((q) => inMonth(q.date, curMonth, curYear));
  const quotesLastMonth = quotes.filter((q) => inMonth(q.date, prevMonth, prevYear));
  const acceptedThisMonth = quotesThisMonth.filter((q) => q.status === "Accepted").length;

  const wonThisMonth = leads.filter((l) => l.stage === "Won" && inMonth(l.lastContact, curMonth, curYear));
  const wonValueThisMonth = wonThisMonth.reduce((s, l) => s + l.value, 0);

  const activeLeads = leads.filter((l) => l.stage !== "Won" && l.stage !== "Lost");
  const pipelineValue = activeLeads.reduce((s, l) => s + l.value, 0);

  const segmentTotals = new Map<string, number>();
  activeLeads.forEach((l) => segmentTotals.set(l.segment, (segmentTotals.get(l.segment) ?? 0) + l.value));
  const topSegment = [...segmentTotals.entries()].sort((a, b) => b[1] - a[1])[0];

  const expiring = quotes
    .filter((q) => q.status === "Draft" || q.status === "Sent")
    .map((q) => ({ q, days: daysUntil(q.validUntil) }))
    .filter((x) => x.days <= 7)
    .sort((a, b) => a.days - b.days);

  const missingPrice = products.filter((p) => p.price == null).length;

  const sentences: string[] = [];

  sentences.push(
    `Active pipeline is ${formatINR(pipelineValue)} across ${activeLeads.length} lead${activeLeads.length === 1 ? "" : "s"}${topSegment ? `, led by ${topSegment[0]} at ${formatINR(topSegment[1])}` : ""}.`
  );

  if (wonThisMonth.length > 0) {
    sentences.push(`${wonThisMonth.length} deal${wonThisMonth.length === 1 ? "" : "s"} won this month worth ${formatINR(wonValueThisMonth)}.`);
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
