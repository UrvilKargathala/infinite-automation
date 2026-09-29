"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Price } from "@/components/ui/Price";
import { DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/utils/currency";

export function PriceCell({ prices }: { prices: Partial<Record<CurrencyCode, number>> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);

  const entries = Object.entries(prices) as [CurrencyCode, number][];
  const main = entries.find(([c]) => c === DEFAULT_CURRENCY) ?? entries[0];
  const extra = entries.length - 1;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => extra > 0 && setOpen((o) => !o)}
        className={`flex items-center gap-1.5 ${extra > 0 ? "cursor-pointer" : "cursor-default"}`}
      >
        <Price value={main[1]} currency={main[0]} className="text-sm" />
        {extra > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] text-brand-blue bg-surface-alt border border-border rounded-full px-1.5 py-0.5">
            +{extra}<ChevronDown size={10} />
          </span>
        )}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 min-w-[150px] bg-white border border-border rounded-lg shadow-lg p-2 space-y-1.5">
          {entries.map(([c, v]) => (
            <div key={c} className="flex items-center justify-between gap-4">
              <span className="text-[10px] text-text-secondary bg-surface-alt border border-border rounded px-1.5 py-0.5">{c}</span>
              <Price value={v} currency={c} className="text-xs" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
