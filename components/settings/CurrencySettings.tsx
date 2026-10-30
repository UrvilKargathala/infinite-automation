"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Coins, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { IconTile } from "@/components/ui/IconTile";
import { Price } from "@/components/ui/Price";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useCurrency } from "@/lib/hooks/useCurrency";
import { CURRENCIES, CURRENCY_CODES, type CurrencyCode } from "@/lib/utils/currency";

const PREVIEW_AMOUNT = 185000;

function taxText(code: CurrencyCode) {
  const { taxLabel, taxRate } = CURRENCIES[code];
  return taxRate > 0 ? `${taxLabel} ${Math.round(taxRate * 100)}%` : "No tax";
}

/** Settings → Currency. Saved per user; every money screen and new quote/PO follows it. */
export function CurrencySettings() {
  const current = useCurrency();
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const [saving, setSaving] = useState<CurrencyCode | null>(null);
  const cfg = CURRENCIES[current];

  async function choose(code: CurrencyCode) {
    if (code === current || saving) return;
    setSaving(code);
    try {
      await updateProfile({ currency: code });
      toast.success(`Currency set to ${CURRENCIES[code].name}`, { description: "Prices, dashboard and new quotes now use it." });
    } catch {
      // the store already shows an error toast
    } finally {
      setSaving(null);
    }
  }

  return (
    <Card>
      <div className="flex items-start gap-4">
        <IconTile icon={Coins} />
        <div className="min-w-0">
          <h2 className="text-lg text-text-primary">Currency</h2>
          <p className="text-sm text-text-secondary mt-0.5">
            Used for your dashboard, product prices, and every new quote and purchase order you create. Saved quotes and POs keep
            the currency they were created in.
          </p>
        </div>
      </div>

      <div role="radiogroup" aria-label="Currency" className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        {CURRENCY_CODES.map((code) => {
          const c = CURRENCIES[code];
          const active = code === current;
          return (
            <button
              key={code}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={!!saving}
              onClick={() => choose(code)}
              className={`relative text-left rounded-2xl p-3.5 transition-all ${
                active
                  ? "bg-white/85 border border-brand-blue/50 shadow-[0_12px_28px_-14px_rgba(58,144,195,0.6)] ring-1 ring-brand-blue/30"
                  : "glass-tile hover:-translate-y-0.5"
              } ${saving && saving !== code ? "opacity-60" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`min-w-[36px] h-9 px-2 rounded-xl flex items-center justify-center text-sm ${
                    active ? "bg-brand-gradient text-white" : "bg-brand-gradient-tint text-brand-blue"
                  }`}
                >
                  {c.symbol}
                </span>
                {saving === code ? (
                  <Loader2 size={16} className="animate-spin text-brand-blue" />
                ) : active ? (
                  <span className="w-5 h-5 rounded-full bg-brand-blue text-white flex items-center justify-center">
                    <Check size={12} strokeWidth={3} />
                  </span>
                ) : null}
              </div>
              <div className="mt-3 text-sm text-text-primary">{code}</div>
              <div className="text-xs text-text-secondary truncate">{c.name}</div>
              <div className="text-[11px] text-text-muted mt-1.5">{taxText(code)}</div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl bg-white/40 border border-white/70 px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-text-muted">Preview</div>
          <Price value={PREVIEW_AMOUNT} currency={current} className="text-2xl text-text-primary" />
        </div>
        <div className="text-right text-sm text-text-secondary">
          <div>{cfg.name}</div>
          <div className="text-xs text-text-muted">Tax on quotes: {taxText(current)}</div>
        </div>
      </div>
    </Card>
  );
}
