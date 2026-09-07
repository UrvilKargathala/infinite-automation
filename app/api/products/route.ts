import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { can } from "@/lib/utils/permissions";
import { logAction } from "@/lib/api/audit";
import type { Product } from "@/types";

export const dynamic = "force-dynamic";

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

export async function GET() {
  const rows = await sql`SELECT * FROM products ORDER BY id`;
  return NextResponse.json(rows.map(toProduct));
}

export async function POST(req: Request) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!can(me.role, "editProducts")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as Omit<Product, "id">;
  const rows = await sql`
    INSERT INTO products (name, sku, brand, category, hsn, description, price, status)
    VALUES (${body.name}, ${body.sku}, ${body.brand}, ${body.category}, ${body.hsn}, ${body.description}, ${body.price}, ${body.status})
    RETURNING *
  `;
  const created = toProduct(rows[0]);

  await logAction({
    module: "Master",
    action: "create",
    entityType: "product",
    entityId: created.id,
    entityName: created.name,
    summary: `Created product ${created.name} (SKU: ${created.sku}) under ${created.brand} > ${created.category}`,
    changes: { after: { name: created.name, sku: created.sku, brand: created.brand, category: created.category, hsn: created.hsn, price: created.price, status: created.status } },
  });

  return NextResponse.json(created, { status: 201 });
}
