import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { can } from "@/lib/utils/permissions";
import { logAction, diffFields } from "@/lib/api/audit";
import { formatCurrency } from "@/lib/utils/currency";
import type { Product } from "@/types";
import type { CurrencyCode } from "@/lib/utils/currency";

function toProduct(row: Record<string, unknown>, priceRows: Record<string, unknown>[] = []): Product {
  const prices: Partial<Record<CurrencyCode, number>> = {};
  for (const pr of priceRows) {
    prices[pr.currency as CurrencyCode] = Number(pr.price);
  }
  return {
    id: row.id as number,
    name: row.name as string,
    sku: row.sku as string,
    brand: row.brand as string,
    category: row.category as string,
    hsn: row.hsn as string,
    description: row.description as string,
    price: prices.INR ?? (row.price != null ? Number(row.price) : null),
    prices,
    status: row.status as Product["status"],
  };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!can(me.role, "editProducts")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  const body = (await req.json()) as Partial<Omit<Product, "id">> & { prices?: Partial<Record<CurrencyCode, number>> };

  const existing = await sql`SELECT * FROM products WHERE id = ${id}`;
  if (existing.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const existingPrices = await sql`SELECT * FROM product_prices WHERE product_id = ${id}`;
  const before = toProduct(existing[0], existingPrices);

  const merged = { ...before, ...body };
  const rows = await sql`
    UPDATE products SET name = ${merged.name}, sku = ${merged.sku}, brand = ${merged.brand},
      category = ${merged.category}, hsn = ${merged.hsn}, description = ${merged.description},
      price = ${merged.prices?.INR ?? merged.price}, status = ${merged.status}
    WHERE id = ${id}
    RETURNING *
  `;

  if (body.prices) {
    for (const [currency, price] of Object.entries(body.prices)) {
      if (price != null) {
        await sql`INSERT INTO product_prices (product_id, currency, price) VALUES (${id}, ${currency}, ${price}) ON CONFLICT (product_id, currency) DO UPDATE SET price = ${price}`;
      } else {
        await sql`DELETE FROM product_prices WHERE product_id = ${id} AND currency = ${currency}`;
      }
    }
  }

  const updatedPrices = await sql`SELECT * FROM product_prices WHERE product_id = ${id}`;
  const updated = toProduct(rows[0], updatedPrices);

  const { id: _bid, ...beforeFields } = before;
  const { id: _aid, ...afterFields } = updated;
  const changes = diffFields(beforeFields, afterFields);
  if (changes) {
    let summary = `Updated product ${updated.name}`;
    const changedKeys = Object.keys(changes.after ?? {});
    if (changedKeys.length === 1 && changedKeys[0] === "status") {
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
  const existingPrices = await sql`SELECT * FROM product_prices WHERE product_id = ${id}`;
  await sql`DELETE FROM products WHERE id = ${id}`;

  if (existing.length > 0) {
    const deleted = toProduct(existing[0], existingPrices);
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
