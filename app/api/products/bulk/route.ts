import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { can } from "@/lib/utils/permissions";
import { logAction } from "@/lib/api/audit";
import type { Product } from "@/types";
import type { CurrencyCode } from "@/lib/utils/currency";

export async function POST(req: Request) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!can(me.role, "excelImport")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as { items: (Omit<Product, "id"> & { prices?: Partial<Record<CurrencyCode, number>> })[]; filename?: string };
  const items = body.items;
  let count = 0;
  for (const p of items) {
    const rows = await sql`
      INSERT INTO products (name, sku, brand, category, hsn, description, price, status)
      VALUES (${p.name}, ${p.sku}, ${p.brand}, ${p.category}, ${p.hsn}, ${p.description}, ${p.prices?.INR ?? p.price}, ${p.status})
      RETURNING id
    `;
    const productId = rows[0].id as number;
    const prices = p.prices ?? {};
    if (p.price != null && !prices.INR) prices.INR = p.price;
    for (const [currency, price] of Object.entries(prices)) {
      if (price != null) {
        await sql`INSERT INTO product_prices (product_id, currency, price) VALUES (${productId}, ${currency}, ${price}) ON CONFLICT (product_id, currency) DO UPDATE SET price = ${price}`;
      }
    }
    count++;
  }

  const brandBreakdown: Record<string, number> = {};
  for (const p of items) {
    brandBreakdown[p.brand] = (brandBreakdown[p.brand] ?? 0) + 1;
  }

  await logAction({
    module: "Master",
    action: "import",
    entityType: "product",
    entityId: null,
    summary: `Imported ${count} products from Excel file ${body.filename ?? "unknown"}`,
    metadata: { filename: body.filename ?? null, rowCount: count, brandBreakdown },
  });

  return NextResponse.json({ imported: count }, { status: 201 });
}
