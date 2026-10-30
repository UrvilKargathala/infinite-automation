"use client";

import { useMemo } from "react";
import { Price } from "@/components/ui/Price";
import { useKits } from "@/lib/hooks/useKits";
import { useProductStore } from "@/lib/store/useProductStore";
import { kitPricing } from "@/lib/utils/kits";
import type { CurrencyCode } from "@/lib/utils/currency";
import type { Kit } from "@/types";

const qtyInput =
  "bg-white border border-border rounded py-1 px-2 text-sm focus:border-brand-blue focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

/** The "Kits" choice in a quote section's picker: tick kits, set how many, priced in the quote's currency. */
export function KitPickerList({ currency, selected, onChange }: { currency: CurrencyCode; selected: Map<number, number>; onChange: (next: Map<number, number>) => void }) {
  const { kits, isLoading } = useKits();
  const products = useProductStore((s) => s.products);
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const active = useMemo(() => kits.filter((k) => k.status === "Active"), [kits]);

  function toggle(k: Kit) {
    const next = new Map(selected);
    if (next.has(k.id)) next.delete(k.id); else next.set(k.id, 1);
    onChange(next);
  }

  return (
    <div className="mb-4 border border-border rounded-xl p-3 bg-surface-alt max-h-56 overflow-y-auto">
      <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Select kits</div>
      {isLoading ? (
        <div className="text-sm text-text-muted py-4 text-center">Loading kits…</div>
      ) : active.length === 0 ? (
        <div className="text-sm text-text-muted py-4 text-center">No active kits — create one in Master File → Kits.</div>
      ) : (
        <div className="space-y-1">
          {active.map((k) => {
            const { kitPrice } = kitPricing(k, byId, currency);
            return (
              <label key={k.id} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white cursor-pointer transition-colors">
                <input type="checkbox" checked={selected.has(k.id)} onChange={() => toggle(k)}
                  className="w-4 h-4 rounded border-border text-brand-blue focus:ring-brand-blue accent-[#3A90C3]" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-text-primary">{k.name} <span className="text-xs text-text-muted font-numeric">· {k.sku}</span></div>
                  <div className="text-xs text-text-muted truncate">{k.items.map((i) => `${i.qty}× ${byId.get(i.productId)?.name ?? "?"}`).join(", ")}</div>
                </div>
                {selected.has(k.id) && (
                  <input type="number" min={1} value={selected.get(k.id)} aria-label={`How many ${k.name}`}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => onChange(new Map(selected).set(k.id, Math.max(1, Number(e.target.value) || 1)))}
                    className={`${qtyInput} w-14 text-center shrink-0`} />
                )}
                {kitPrice == null ? <span className="text-xs text-warning shrink-0">Not set</span> : <Price value={kitPrice} currency={currency} className="text-xs shrink-0" />}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
