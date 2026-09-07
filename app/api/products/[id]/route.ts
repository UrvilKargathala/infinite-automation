import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { can } from "@/lib/utils/permissions";
import { logAction, diffFields } from "@/lib/api/audit";
import { formatINR } from "@/lib/utils/format";
import type { Product } from "@/types";

function toProduct(row: Record<string, unknown>): Product {
  return {
    id: row.id as number,
    name: row.name as string,
    sku: row.sku as string,
    brand: row.brand as string,
    category: row.category as string,
    hsn: row.hsn as string,
    description: row.description as string,
    price: row.price != null ? Number(row.price) : null,
    status: row.status as Product["status"],
  };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!can(me.role, "editProducts")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  const body = (await req.json()) as Partial<Omit<Product, "id">>;
  const existing = await sql`SELECT * FROM products WHERE id = ${id}`;
  if (existing.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const before = toProduct(existing[0]);
  const merged = { ...before, ...body };
  const rows = await sql`
    UPDATE products SET name = ${merged.name}, sku = ${merged.sku}, brand = ${merged.brand},
      category = ${merged.category}, hsn = ${merged.hsn}, description = ${merged.description},
      price = ${merged.price}, status = ${merged.status}
    WHERE id = ${id}
    RETURNING *
  `;
  const updated = toProduct(rows[0]);

  const { id: _bid, ...beforeFields } = before;
  const { id: _aid, ...afterFields } = updated;
  const changes = diffFields(beforeFields, afterFields);
  if (changes) {
    const changedKeys = Object.keys(changes.after ?? {});
    let summary = `Updated product ${updated.name}`;
    if (changedKeys.length === 1 && changedKeys[0] === "price") {
      summary = `Updated price of ${updated.name} from ${formatINR(before.price)} to ${formatINR(updated.price)}`;
    } else if (changedKeys.length === 1 && changedKeys[0] === "status") {
      summary = `Changed ${updated.name} status from ${before.status} to ${updated.status}`;
    }
    await logAction({
      module: "Master",
      action: "update",
      entityType: "product",
      entityId: updated.id,
      entityName: updated.name,
      summary,
      changes,
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!can(me.role, "editProducts")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  const existing = await sql`SELECT * FROM products WHERE id = ${id}`;
  await sql`DELETE FROM products WHERE id = ${id}`;

  if (existing.length > 0) {
    const deleted = toProduct(existing[0]);
    await logAction({
      module: "Master",
      action: "delete",
      entityType: "product",
      entityId: deleted.id,
      entityName: deleted.name,
      summary: `Deleted product ${deleted.name} (SKU: ${deleted.sku})`,
      changes: { before: { ...deleted } },
    });
  }

  return NextResponse.json({ ok: true });
}
