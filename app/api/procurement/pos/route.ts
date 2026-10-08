import { NextResponse } from "next/server";
import { withTransaction, HttpError } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { can } from "@/lib/utils/permissions";
import { logAction } from "@/lib/api/audit";
import { loadPurchaseOrders, viaSql, viaTx } from "@/lib/inventoryDb";
import { CURRENCY_CODES, type CurrencyCode } from "@/lib/utils/currency";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await loadPurchaseOrders(viaSql));
}

interface Body {
  brand?: string;
  vendorName?: string;
  currency?: CurrencyCode;
  notes?: string;
  items?: { productId: number; qty: number; unitCost?: number | null }[];
}

/** createVendorPO: one Draft PO for one brand. It only counts as incoming stock once issued (Stage 5). */
export async function POST(req: Request) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!can(me.role, "editStock")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = (await req.json()) as Body;
  const brand = (body.brand ?? "").trim();
  const items = body.items ?? [];
  const currency = body.currency ?? "INR";

  try {
    const po = await withTransaction(async (db) => {
      if (!brand) throw new HttpError(400, "Brand is required");
      if (!CURRENCY_CODES.includes(currency)) throw new HttpError(400, "Unknown currency");
      if (items.length === 0) throw new HttpError(400, "Add at least one product");
      if (new Set(items.map((i) => i.productId)).size !== items.length) throw new HttpError(400, "Each product can only appear once");
      for (const i of items) {
        if (!Number.isInteger(i.qty) || i.qty <= 0) throw new HttpError(400, "Quantities must be whole numbers above 0");
        if (i.unitCost != null && (typeof i.unitCost !== "number" || !(i.unitCost >= 0))) throw new HttpError(400, "Unit cost must be 0 or more");
      }

      const products = (await db.query(`SELECT id, name, brand FROM products WHERE id = ANY($1::int[])`, [items.map((i) => i.productId)])).rows;
      if (products.length !== items.length) throw new HttpError(400, "One of the products no longer exists");
      const wrongBrand = products.find((p) => p.brand !== brand);
      if (wrongBrand) throw new HttpError(400, `${wrongBrand.name} belongs to ${wrongBrand.brand}, not ${brand} — one PO per brand`);

      // ponytail: table lock serialises PO numbering; fine at a few POs a day, use a sequence if that ever changes
      await db.query(`LOCK TABLE vendor_pos IN SHARE ROW EXCLUSIVE MODE`);
      const year = new Date().getFullYear();
      const [{ next }] = (await db.query(
        `SELECT COALESCE(MAX(split_part(number, '-', 4)::int), 0) + 1 AS next FROM vendor_pos WHERE number LIKE $1`,
        [`IA-PO-${year}-%`],
      )).rows;
      const number = `IA-PO-${year}-${String(next).padStart(3, "0")}`;

      const [row] = (await db.query(
        `INSERT INTO vendor_pos (number, brand, vendor_name, currency, notes, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [number, brand, (body.vendorName ?? "").trim() || brand, currency, (body.notes ?? "").trim(), me.id],
      )).rows;
      await db.query(
        `INSERT INTO vendor_po_items (po_id, product_id, qty_ordered, unit_cost)
         SELECT $1, unnest($2::int[]), unnest($3::int[]), unnest($4::numeric[])`,
        [row.id, items.map((i) => i.productId), items.map((i) => i.qty), items.map((i) => i.unitCost ?? null)],
      );
      const [po] = await loadPurchaseOrders(viaTx(db), [row.id]);
      return po;
    });

    const units = po.items.reduce((s, i) => s + i.qtyOrdered, 0);
    await logAction({
      module: "Inventory",
      action: "create",
      entityType: "vendor_po",
      entityId: po.id,
      entityName: po.number,
      summary: `Drafted vendor PO ${po.number} for ${po.brand} — ${po.items.length} product(s), ${units} unit(s)`,
      changes: { after: { brand: po.brand, vendor: po.vendorName, items: po.items } },
      actor: me,
    });

    return NextResponse.json(po, { status: 201 });
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
