import Link from "next/link";
import { Price } from "@/components/ui/Price";
import { Num } from "@/components/ui/Num";
import { calcQuoteTotal } from "@/lib/utils/quote";
import { CURRENCIES, type CurrencyCode } from "@/lib/utils/currency";
import { LegendSwatch } from "./chartBits";
import type { Quote } from "@/types";

interface Bucket { sentValue: number; draftValue: number; sent: number; draft: number }

const GRID_COLS = ["", "grid-cols-1", "sm:grid-cols-2", "sm:grid-cols-2 xl:grid-cols-3"];

/** Open (Draft/Sent) quote value per currency — never summed across currencies. */
export function CurrencyPipeline({ quotes }: { quotes: Quote[] }) {
  const byCurrency = new Map<CurrencyCode, Bucket>();
  quotes
    .filter((q) => q.status === "Draft" || q.status === "Sent")
    .forEach((q) => {
      const code = q.currency ?? "INR";
      const b = byCurrency.get(code) ?? { sentValue: 0, draftValue: 0, sent: 0, draft: 0 };
      const total = calcQuoteTotal(q).grandTotal;
      if (q.status === "Sent") { b.sentValue += total; b.sent += 1; } else { b.draftValue += total; b.draft += 1; }
      byCurrency.set(code, b);
    });
  const rows = [...byCurrency.entries()].sort((a, b) => b[1].sent + b[1].draft - (a[1].sent + a[1].draft));

  return (
    <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl rounded-2xl shadow-card border border-white/60 p-4 sm:p-6 flex flex-col">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <h2 className="text-lg text-text-primary">Open pipeline</h2>
          <span className="text-xs text-text-muted">| by currency · <Num>{rows.length}</Num> in use</span>
        </div>
        <div className="flex items-center gap-3">
          <LegendSwatch kind="solid" label="Sent" />
          <LegendSwatch kind="hatch" label="Draft" />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-text-muted text-sm py-8">No open quotes right now</div>
      ) : (
        <div className={`grid gap-3 mt-4 flex-1 ${GRID_COLS[Math.min(rows.length, 3)]}`}>
          {rows.map(([code, b]) => {
            const total = b.sentValue + b.draftValue;
            const sentPct = total > 0 ? (b.sentValue / total) * 100 : 0;
            return (
              <Link
                key={code}
                href="/quote"
                className="rounded-xl border border-border/70 bg-white p-4 hover:shadow-cardHover transition-shadow flex flex-col"
              >
                <div className="flex items-center gap-2">
                  <span className="min-w-[28px] h-7 px-1.5 rounded-full bg-brand-gradient-tint text-brand-blue text-sm flex items-center justify-center">
                    {CURRENCIES[code].symbol}
                  </span>
                  <span className="text-sm text-text-primary">{code}</span>
                  <span className="ml-auto text-xs text-text-muted">
                    <Num>{b.sent + b.draft}</Num> open quote{b.sent + b.draft === 1 ? "" : "s"}
                  </span>
                </div>
                <Price value={Math.round(total)} currency={code} className="block text-2xl text-text-primary mt-3" />

                <div className="mt-auto pt-4">
                  <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
                    {b.sentValue > 0 && <div className="bg-brand-gradient rounded-full" style={{ width: `${sentPct}%` }} />}
                    {b.draftValue > 0 && (
                      <div
                        className="flex-1 rounded-full"
                        style={{ background: "repeating-linear-gradient(45deg, #CBD5E1 0 3px, #F1F5F9 3px 6px)" }}
                      />
                    )}
                  </div>
                  <div className="flex justify-between text-xs text-text-muted mt-2">
                    <span><Num>{b.sent}</Num> sent · <Price value={Math.round(b.sentValue)} currency={code} className="text-xs" /></span>
                    <span><Num>{b.draft}</Num> draft · <Price value={Math.round(b.draftValue)} currency={code} className="text-xs" /></span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
