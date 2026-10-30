import type { PoolClient } from "@neondatabase/serverless";
import { sql } from "@/lib/db";
import type { Kit, KitInput } from "@/types";

export function toKit(r: Record<string, unknown>): Kit {
  return {
    id: r.id as number,
    sku: r.sku as string,
    name: r.name as string,
    description: r.description as string,
    status: r.status as Kit["status"],
    discountPct: Number(r.discount_pct),
    items: ((r.items as Kit["items"]) ?? []).map((i) => ({ productId: Number(i.productId), qty: Number(i.qty) })),
    createdAt: r.created_at as string,
  };
}

export async function listKits(id?: number): Promise<Kit[]> {
  const rows = await sql`
    SELECT k.id, k.sku, k.name, k.description, k.status, k.discount_pct, k.created_at::text AS created_at,
           COALESCE(json_agg(json_build_object('productId', ki.product_id, 'qty', ki.qty) ORDER BY ki.position)
                    FILTER (WHERE ki.kit_id IS NOT NULL), '[]') AS items
    FROM kits k LEFT JOIN kit_items ki ON ki.kit_id = k.id
    WHERE ${id ?? null}::int IS NULL OR k.id = ${id ?? null}
    GROUP BY k.id
    ORDER BY k.created_at DESC
  `;
  return rows.map(toKit);
}

/** Validates a kit payload; returns an error message or null. Component ids are checked against products. */
export async function kitInputError(body: Partial<KitInput>): Promise<string | null> {
  if (!body.sku?.trim()) return "Kit SKU is required";
  if (!body.name?.trim()) return "Kit name is required";
  const d = Number(body.discountPct ?? 0);
  if (!(d >= 0 && d <= 100)) return "Discount must be between 0 and 100%";
  const items = body.items ?? [];
  if (items.length === 0) return "Add at least one product to the kit";
  if (items.some((i) => !Number.isInteger(i.qty) || i.qty < 1)) return "Every component needs a quantity of at least 1";
  if (new Set(items.map((i) => i.productId)).size !== items.length) return "A product is listed twice — combine the quantities";
  const ids = items.map((i) => i.productId);
  const found = await sql`SELECT count(*)::int AS n FROM products WHERE id = ANY(${ids})`;
  if (found[0].n !== ids.length) return "One of the components no longer exists in the Master File";
  return null;
}

/** Replaces a kit's components inside the caller's transaction. */
export async function writeKitItems(db: PoolClient, kitId: number, items: KitInput["items"]): Promise<void> {
  await db.query(`DELETE FROM kit_items WHERE kit_id = $1`, [kitId]);
  for (const [i, it] of items.entries()) {
    await db.query(`INSERT INTO kit_items (kit_id, product_id, qty, position) VALUES ($1, $2, $3, $4)`, [kitId, it.productId, it.qty, i]);
  }
}
