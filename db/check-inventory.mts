// Self-check for lib/utils/inventory.ts. Run: node db/check-inventory.mts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

// The app is CommonJS, so Node won't import the .ts module directly; strip its types and load it as ESM.
const src = stripTypeScriptTypes(readFileSync(new URL("../lib/utils/inventory.ts", import.meta.url), "utf8"));
const { stockStatus, splitReadyBackordered } = await import("data:text/javascript," + encodeURIComponent(src));

// Spec formula: (min - available) + quoted*0.5 - incoming → (5 - -4) + 3 - 2 = 10
let s = stockStatus({ physical: 10, allocated: 14, minBuffer: 5, quoted: 6, incoming: 2 });
assert.equal(s.available, -4);
assert.equal(s.low, true);
assert.equal(s.shortage, 4);
assert.equal(s.bufferGap, 5);
assert.equal(s.shortage + s.bufferGap, s.minBuffer - s.available); // breakdown adds up
assert.equal(s.suggested, 10);

// Available exactly at the buffer is not low, so nothing is ordered even with pipeline demand
s = stockStatus({ physical: 15, allocated: 5, minBuffer: 10, quoted: 40, incoming: 0 });
assert.equal(s.low, false);
assert.equal(s.suggested, 0);

// Fractions round up to whole units: 1 + 0.5 → 2
assert.equal(stockStatus({ physical: 0, allocated: 0, minBuffer: 1, quoted: 1, incoming: 0 }).suggested, 2);

// Incoming POs already cover it: still low, but nothing more to order (never negative)
s = stockStatus({ physical: 3, allocated: 0, minBuffer: 5, quoted: 0, incoming: 10 });
assert.equal(s.low, true);
assert.equal(s.suggested, 0);

// Brand-new product: no stock, no buffer, no demand → not low
assert.equal(stockStatus({ physical: 0, allocated: 0, minBuffer: 0, quoted: 0, incoming: 0 }).low, false);

// First-confirmed, first-served; input order must not matter
const split = splitReadyBackordered(
  [
    { id: 2, productId: 1, outstanding: 4, createdAt: "2026-10-02T00:00:00Z" },
    { id: 1, productId: 1, outstanding: 3, createdAt: "2026-10-01T00:00:00Z" },
    { id: 3, productId: 2, outstanding: 2, createdAt: "2026-09-01T00:00:00Z" },
  ],
  new Map([[1, 5]]), // product 2 has no stock row at all
);
assert.deepEqual(split.get(1), { ready: 3, backordered: 0 });
assert.deepEqual(split.get(2), { ready: 2, backordered: 2 });
assert.deepEqual(split.get(3), { ready: 0, backordered: 2 });

console.log("inventory maths OK");
