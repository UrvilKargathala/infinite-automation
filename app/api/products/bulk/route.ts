import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import type { Product } from "@/types";

export async function POST(req: Request) {
  const items = (await req.json()) as Omit<Product, "id">[];
  let count = 0;
  for (const p of items) {
    await sql`
      INSERT INTO products (name, sku, brand, category, hsn, description, price, status)
      VALUES (${p.name}, ${p.sku}, ${p.brand}, ${p.category}, ${p.hsn}, ${p.description}, ${p.price}, ${p.status})
    `;
    count++;
  }
  return NextResponse.json({ imported: count }, { status: 201 });
}
