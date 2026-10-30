import { Sparkles } from "lucide-react";
import { inMonth, daysUntil } from "@/lib/utils/dashboardMetrics";
import { priceIn, type CurrencyCode } from "@/lib/utils/currency";
import { CANCELLED, stagePhase } from "@/lib/utils/pipeline";
import type { Complaint, PipelineStage, Product, Project, Quote } from "@/types";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** "a USD price" but "an INR price" — the article follows how the code's first letter is said. */
const article = (code: string) => ("AEFHILMNORSX".includes(code[0]) ? "an" : "a");

/** Plain-language snapshot of CRM, complaints, quotes and catalogue gaps. */
export function AiSummary({ projects, stages, complaints, quotes, products, currency }: {
  projects: Project[];
  stages: PipelineStage[];
  complaints: Complaint[];
  quotes: Quote[];
  products: Product[];
  currency: CurrencyCode;
}) {
  const now = new Date();
  const m = now.getMonth();
  const y = now.getFullYear();
  const prev = new Date(y, m - 1, 1);
  const sentences: string[] = [];

  // CRM
  const live = projects.filter((p) => p.stage !== CANCELLED);
  const newThisMonth = live.filter((p) => inMonth(p.createdAt, m, y)).length;
  const atLast = live.filter((p) => stagePhase(stages, p.stage) === "done").length;
  const lastName = [...stages].sort((a, b) => a.position - b.position).at(-1)?.name ?? "Install";
  sentences.push(`${plural(live.length, "active CRM record")} — ${newThisMonth} new this month, ${atLast} at ${lastName}.`);

  // Complaints
  const pending = complaints.filter((c) => c.status === "Pending").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  if (pending.length === 0) sentences.push("No pending complaints.");
  else {
    const oldest = pending[0];
    const age = Math.max(0, Math.floor((now.getTime() - new Date(oldest.createdAt).getTime()) / 86400000));
    sentences.push(`${plural(pending.length, "pending complaint")}; oldest is ${oldest.customerName} (${oldest.number}, ${age === 0 ? "today" : `${age}d`}${oldest.engineerName ? `, ${oldest.engineerName}` : ""}).`);
  }

  // Quotes
  const qThis = quotes.filter((q) => inMonth(q.date, m, y));
  const qPrev = quotes.filter((q) => inMonth(q.date, prev.getMonth(), prev.getFullYear()));
  if (qThis.length || qPrev.length) {
    const diff = qThis.length - qPrev.length;
    const trend = diff > 0 ? `up from ${qPrev.length}` : diff < 0 ? `down from ${qPrev.length}` : "same as last month";
    sentences.push(`${plural(qThis.length, "quote")} created this month (${trend}), ${qThis.filter((q) => q.status === "Accepted").length} accepted.`);
  }

  // Expired vs expiring — different actions, so counted separately
  const open = quotes.filter((q) => q.status === "Draft" || q.status === "Sent").map((q) => ({ q, d: daysUntil(q.validUntil) }));
  const expired = open.filter((x) => x.d < 0).sort((a, b) => a.d - b.d);
  const soon = open.filter((x) => x.d >= 0 && x.d <= 7).sort((a, b) => a.d - b.d);
  if (expired.length) {
    const o = expired[0];
    sentences.push(`${plural(expired.length, "quote")} expired without an answer — oldest ${o.q.client} (${o.q.number}), ${Math.abs(o.d)}d ago.`);
  }
  if (soon.length) {
    const n = soon[0];
    sentences.push(`${soon.length} expiring this week — next is ${n.q.client} (${n.q.number}) ${n.d === 0 ? "today" : `in ${n.d}d`}.`);
  }

  // Catalogue
  const missing = products.filter((p) => priceIn(p, currency) == null).length;
  if (missing > 0) sentences.push(`${plural(missing, "product")} in Master File still missing ${article(currency)} ${currency} price.`);

  return (
    <div className="glass lift rounded-3xl p-4 sm:p-6 mb-6">
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
