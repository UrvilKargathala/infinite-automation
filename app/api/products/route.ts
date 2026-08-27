import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
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

export async function GET() {
  const rows = await sql`SELECT * FROM products ORDER BY id`;
  return NextResponse.json(rows.map(toProduct));
}

export async function POST(req: Request) {
  const body = (await req.json()) as Omit<Product, "id">;
  const rows = await sql`
    INSERT INTO products (name, sku, brand, category, hsn, description, price, status)
    VALUES (${body.name}, ${body.sku}, ${body.brand}, ${body.category}, ${body.hsn}, ${body.description}, ${body.price}, ${body.status})
    RETURNING *
  `;
  return NextResponse.json(toProduct(rows[0]), { status: 201 });
}
