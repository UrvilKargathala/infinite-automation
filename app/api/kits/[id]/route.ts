import { NextResponse } from "next/server";
import { sql, withTransaction, HttpError } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { can } from "@/lib/utils/permissions";
import { logAction, diffFields } from "@/lib/api/audit";
import { kitInputError, listKits, writeKitItems } from "@/lib/kitsDb";
import type { KitInput } from "@/types";

/** Replace a kit's details and components. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!can(me.role, "editProducts")) return NextResponse.json({ error: "Only Super Admins and Admins can manage kits" }, { status: 403 });
  const id = Number(params.id);
  const [before] = await listKits(id);
  if (!before) return NextResponse.json({ error: "Kit not found" }, { status: 404 });
  const body = (await req.json()) as KitInput;
  const invalid = await kitInputError(body);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  try {
    await withTransaction(async (db) => {
      const clash = (await db.query(`SELECT 1 FROM kits WHERE lower(sku) = lower($1) AND id <> $2`, [body.sku.trim(), id])).rows;
      if (clash.length) throw new HttpError(409, `Kit SKU "${body.sku.trim()}" is already used`);
      await db.query(
        `UPDATE kits SET sku = $1, name = $2, description = $3, status = $4, discount_pct = $5 WHERE id = $6`,
        [body.sku.trim(), body.name.trim(), body.description?.trim() ?? "", body.status ?? "Active", Number(body.discountPct ?? 0), id],
      );
      await writeKitItems(db, id, body.items);
    });
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }

  const [kit] = await listKits(id);
  const describe = (k: typeof kit) => ({ sku: k.sku, name: k.name, status: k.status, discountPct: k.discountPct, components: k.items.map((i) => `${i.qty}×#${i.productId}`).join(", ") });
  const changes = diffFields(describe(before), describe(kit));
  if (changes) {
    await logAction({ module: "Master", action: "update", entityType: "kit", entityId: id, entityName: kit.name, summary: `Updated kit ${kit.name} (${kit.sku})`, changes, actor: me });
  }
  return NextResponse.json(kit);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!can(me.role, "editProducts")) return NextResponse.json({ error: "Only Super Admins and Admins can manage kits" }, { status: 403 });
  const id = Number(params.id);
  const [kit] = await listKits(id);
  if (!kit) return NextResponse.json({ error: "Kit not found" }, { status: 404 });
  await sql`DELETE FROM kits WHERE id = ${id}`;
  await logAction({
    module: "Master", action: "delete", entityType: "kit", entityId: id, entityName: kit.name,
    summary: `Deleted kit ${kit.name} (${kit.sku})`, changes: { before: { sku: kit.sku, name: kit.name, components: kit.items.length } }, actor: me,
  });
  return NextResponse.json({ ok: true });
}
