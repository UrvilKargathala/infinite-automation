/**
 * Inventory maths — pure, no DB. Every screen (Master, order slip, reorder queue) and every
 * API route computes stock through these two functions so the numbers never disagree.
 */

/** Share of open-quote (Draft/Sent) demand that is pre-ordered when a reorder triggers. */
export const PIPELINE_FACTOR = 0.5;

export interface StockInputs {
  physical: number;  // units on the shelf
  allocated: number; // outstanding units reserved for confirmed projects
  minBuffer: number; // safety floor from Master
  quoted: number;    // units on open (Draft/Sent) quotes
  incoming: number;  // units ordered on Issued / Partially Received POs, not yet received
}

export interface StockStatus extends StockInputs {
  available: number;     // physical - allocated; negative means confirmed orders exceed stock
  low: boolean;          // reorder trigger: available < minBuffer
  shortage: number;      // confirmed demand with no stock behind it
  bufferGap: number;     // units needed to bring available (floored at 0) back up to minBuffer
  pipelineShare: number; // quoted * PIPELINE_FACTOR
  suggested: number;     // whole units to order; 0 unless low
}

/**
 * Order Qty = (min - available) + quoted * 0.5 - incoming, rounded up, only when available < min.
 * (min - available) is split into shortage + bufferGap so the reorder queue can show the breakdown.
 */
export function stockStatus(i: StockInputs): StockStatus {
  const available = i.physical - i.allocated;
  const low = available < i.minBuffer;
  const shortage = Math.max(0, -available);
  const bufferGap = low ? i.minBuffer - Math.max(0, available) : 0;
  const pipelineShare = i.quoted * PIPELINE_FACTOR;
  const suggested = low ? Math.max(0, Math.ceil(shortage + bufferGap + pipelineShare - i.incoming)) : 0;
  return { ...i, available, low, shortage, bufferGap, pipelineShare, suggested };
}

export interface OutstandingLine {
  id: number;          // allocation id
  productId: number;
  outstanding: number; // qty - shippedQty
  createdAt: string;   // confirmation time; earlier confirmations are served first
}

export interface LineFulfilment {
  ready: number;       // can ship now
  backordered: number; // waiting on stock
}

/**
 * First-confirmed, first-served: each product's physical stock is handed to its outstanding
 * reservations in confirmation order. Receiving stock therefore clears backorders on its own —
 * there is no backorder flag to maintain.
 */
export function splitReadyBackordered(
  lines: OutstandingLine[],
  physicalByProduct: Map<number, number>,
): Map<number, LineFulfilment> {
  const remaining = new Map(physicalByProduct);
  const result = new Map<number, LineFulfilment>();
  const ordered = [...lines].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id);
  for (const line of ordered) {
    const left = Math.max(0, remaining.get(line.productId) ?? 0);
    const ready = Math.min(line.outstanding, left);
    remaining.set(line.productId, left - ready);
    result.set(line.id, { ready, backordered: line.outstanding - ready });
  }
  return result;
}
