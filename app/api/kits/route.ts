import { NextResponse } from "next/server";
import { withTransaction, HttpError } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { can } from "@/lib/utils/permissions";
import { logAction } from "@/lib/api/audit";
import { kitInputError, listKits, writeKitItems } from "@/lib/kitsDb";
import type { KitInput } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  return NextResponse.json(await listKits());
}

/** Create a kit (Super Admin / Admin — same as editing products). */
export async function POST(req: Request) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!can(me.role, "editProducts")) return NextResponse.json({ error: "Only Super Admins and Admins can manage kits" }, { status: 403 });
  const body = (await req.json()) as KitInput;
  const invalid = await kitInputError(body);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  try {
    const id = await withTransaction(async (db) => {
      const clash = (await db.query(`SELECT 1 FROM kits WHERE lower(sku) = lower($1)`, [body.sku.trim()])).rows;
      if (clash.length) throw new HttpError(409, `Kit SKU "${body.sku.trim()}" is already used`);
      const [row] = (await db.query(
        `INSERT INTO kits (sku, name, description, status, discount_pct) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [body.sku.trim(), body.name.trim(), body.description?.trim() ?? "", body.status ?? "Active", Number(body.discountPct ?? 0)],
      )).rows;
      await writeKitItems(db, row.id, body.items);
      return row.id as number;
    });
    const [kit] = await listKits(id);
    await logAction({
      module: "Master", action: "create", entityType: "kit", entityId: id, entityName: kit.name,
      summary: `Created kit ${kit.name} (${kit.sku}) with ${kit.items.length} product${kit.items.length === 1 ? "" : "s"}`,
      changes: { after: { sku: kit.sku, name: kit.name, discountPct: kit.discountPct, components: kit.items.length } },
      actor: me,
    });
    return NextResponse.json(kit, { status: 201 });
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
