import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { can } from "@/lib/utils/permissions";
import { logAction } from "@/lib/api/audit";
import type { Product } from "@/types";
import type { CurrencyCode } from "@/lib/utils/currency";

export const dynamic = "force-dynamic";

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

export async function GET() {
  const [rows, priceRows] = await Promise.all([
    sql`SELECT * FROM products ORDER BY id`,
    sql`SELECT * FROM product_prices ORDER BY product_id`,
  ]);
  const pricesByProduct = new Map<number, Record<string, unknown>[]>();
  for (const pr of priceRows) {
    const pid = pr.product_id as number;
    const list = pricesByProduct.get(pid) ?? [];
    list.push(pr);
    pricesByProduct.set(pid, list);
  }
  return NextResponse.json(rows.map((r) => toProduct(r, pricesByProduct.get(r.id as number) ?? [])));
}

export async function POST(req: Request) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!can(me.role, "editProducts")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as Omit<Product, "id"> & { prices?: Partial<Record<CurrencyCode, number>> };
  const rows = await sql`
    INSERT INTO products (name, sku, brand, category, hsn, description, price, status)
    VALUES (${body.name}, ${body.sku}, ${body.brand}, ${body.category}, ${body.hsn}, ${body.description}, ${body.prices?.INR ?? body.price}, ${body.status})
    RETURNING *
  `;
  const productId = rows[0].id as number;

  const prices = body.prices ?? {};
  if (body.price != null && !prices.INR) prices.INR = body.price;
  for (const [currency, price] of Object.entries(prices)) {
    if (price != null) {
      await sql`INSERT INTO product_prices (product_id, currency, price) VALUES (${productId}, ${currency}, ${price}) ON CONFLICT (product_id, currency) DO UPDATE SET price = ${price}`;
    }
  }

  const priceRows = await sql`SELECT * FROM product_prices WHERE product_id = ${productId}`;
  const created = toProduct(rows[0], priceRows);

  await logAction({
    module: "Master",
    action: "create",
    entityType: "product",
    entityId: created.id,
    entityName: created.name,
    summary: `Created product ${created.name} (SKU: ${created.sku}) under ${created.brand} > ${created.category}`,
    changes: { after: { name: created.name, sku: created.sku, brand: created.brand, category: created.category, hsn: created.hsn, prices: created.prices, status: created.status } },
  });

  return NextResponse.json(created, { status: 201 });
}
