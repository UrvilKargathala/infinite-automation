import { NextResponse } from "next/server";
import { sql, withTransaction } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { can } from "@/lib/utils/permissions";
import { logAction } from "@/lib/api/audit";
import { writeKitItems } from "@/lib/kitsDb";

type ImportKit = { sku: string; name: string; description?: string; discountPct?: number; items: { sku: string; qty: number }[] };

/**
 * Excel import (append-only, like products): kits whose SKU already exists are skipped; components are matched to
 * Master File products by SKU (case-insensitive). Kits with an unknown component SKU are skipped and reported.
 */
export async function POST(req: Request) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!can(me.role, "excelImport")) return NextResponse.json({ error: "Only Super Admins and Admins can import" }, { status: 403 });
  const { kits } = (await req.json()) as { kits: ImportKit[] };

  const products = await sql`SELECT id, lower(sku) AS sku FROM products WHERE sku <> ''`;
  const bySku = new Map(products.map((p) => [p.sku as string, p.id as number]));
  const existing = new Set((await sql`SELECT lower(sku) AS sku FROM kits`).map((r) => r.sku as string));

  const skipped: { sku: string; reason: string }[] = [];
  let imported = 0;
  for (const k of kits) {
    const sku = k.sku?.trim();
    if (!sku || !k.name?.trim()) { skipped.push({ sku: sku || "(blank)", reason: "missing Kit SKU or Kit Name" }); continue; }
    if (existing.has(sku.toLowerCase())) { skipped.push({ sku, reason: "kit SKU already exists" }); continue; }
    const unknown = k.items.filter((i) => !bySku.has(i.sku.trim().toLowerCase())).map((i) => i.sku);
    if (unknown.length) { skipped.push({ sku, reason: `unknown product SKU${unknown.length === 1 ? "" : "s"}: ${unknown.join(", ")}` }); continue; }
    const merged = new Map<number, number>();
    k.items.forEach((i) => { const pid = bySku.get(i.sku.trim().toLowerCase())!; merged.set(pid, (merged.get(pid) ?? 0) + Math.max(1, Math.round(i.qty) || 1)); });
    if (merged.size === 0) { skipped.push({ sku, reason: "no components" }); continue; }
    await withTransaction(async (db) => {
      const [row] = (await db.query(
        `INSERT INTO kits (sku, name, description, discount_pct) VALUES ($1, $2, $3, $4) RETURNING id`,
        [sku, k.name.trim(), k.description?.trim() ?? "", Math.min(100, Math.max(0, Number(k.discountPct) || 0))],
      )).rows;
      await writeKitItems(db, row.id, [...merged].map(([productId, qty]) => ({ productId, qty })));
    });
    existing.add(sku.toLowerCase());
    imported++;
  }

  if (imported > 0) {
    await logAction({
      module: "Master", action: "import", entityType: "kit", entityName: "Kits",
      summary: `Imported ${imported} kit${imported === 1 ? "" : "s"} from Excel${skipped.length ? ` (${skipped.length} skipped)` : ""}`,
      metadata: { imported, skipped }, actor: me,
    });
  }
  return NextResponse.json({ imported, skipped });
}
