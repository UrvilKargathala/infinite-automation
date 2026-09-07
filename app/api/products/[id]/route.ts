import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { can } from "@/lib/utils/permissions";
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
  const merged = { ...toProduct(existing[0]), ...body };
  const rows = await sql`
    UPDATE products SET name = ${merged.name}, sku = ${merged.sku}, brand = ${merged.brand},
      category = ${merged.category}, hsn = ${merged.hsn}, description = ${merged.description},
      price = ${merged.price}, status = ${merged.status}
    WHERE id = ${id}
    RETURNING *
  `;
  return NextResponse.json(toProduct(rows[0]));
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!can(me.role, "editProducts")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  await sql`DELETE FROM products WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
