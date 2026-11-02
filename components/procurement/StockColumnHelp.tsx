"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";
import { useAnchoredPopover } from "@/components/ui/useAnchoredPopover";

/** Plain-language meaning of each Stock column — shown from the (i) next to its heading. */
export const STOCK_COLUMN_HELP = {
  physical: {
    title: "In stock",
    body: "How many you physically have right now. It goes up when you receive a delivery and down when an order ships. Fix it with Adjust stock.",
    example: "You counted 5 in hand = 5.",
  },
  reserved: {
    title: "Promised",
    body: "Units already promised to customers: their deals are confirmed but not shipped yet. Draft and Sent quotes do not count.",
    example: "10 = confirmed deals are waiting for 10.",
  },
  free: {
    title: "Free to sell",
    body: "In stock minus promised. Red means you have promised more than you have, so you are short by that amount.",
    example: "In stock 5, promised 10 = −5 (short by 5).",
  },
  incoming: {
    title: "On order",
    body: "Units still to arrive from vendor orders you have issued. A draft order does not count until it is issued.",
    example: "0 = nothing ordered yet.",
  },
  buffer: {
    title: "Keep at least",
    body: "The lowest Free to sell you want to hold. Below it, the product is flagged Low stock and joins the Reorder queue.",
    example: "Change it with Adjust stock.",
  },
  status: {
    title: "Status",
    body: "Low stock means Free to sell is below Keep at least. OK means you are at or above it.",
    example: "Low stock products appear in the Reorder queue.",
  },
} as const;

export type StockColumn = keyof typeof STOCK_COLUMN_HELP;

/** A column heading with a small (i) that opens a short explanation. */
export function StockColumnHeading({ column, children }: { column: StockColumn; children: React.ReactNode }) {
  const help = STOCK_COLUMN_HELP[column];
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const pos = useAnchoredPopover(open, () => setOpen(false), triggerRef, popRef, { minWidth: 260, needHeight: 160, maxHeight: 220 });

  return (
    <span className="inline-flex items-center gap-1.5">
      {children}
      <button
        ref={triggerRef}
        type="button"
        aria-label={`What does ${help.title} mean?`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="text-text-muted hover:text-brand-blue transition-colors"
      >
        <Info size={13} />
      </button>
      {open && pos && createPortal(
        <div
          ref={popRef}
          role="dialog"
          style={{ left: pos.left, top: pos.top, width: pos.width }}
          className={`fixed z-[100] rounded-xl glass-pop p-3 text-sm normal-case tracking-normal ${pos.up ? "-translate-y-full" : ""}`}
        >
          <div className="text-text-primary">{help.title}</div>
          <p className="mt-1 text-text-secondary leading-relaxed">{help.body}</p>
          <p className="mt-2 text-xs text-text-muted">{help.example}</p>
        </div>,
        document.body
      )}
    </span>
  );
}
