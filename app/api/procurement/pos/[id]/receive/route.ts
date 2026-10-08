import { NextResponse } from "next/server";
import { withTransaction, HttpError } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { can } from "@/lib/utils/permissions";
import { logAction } from "@/lib/api/audit";
import { loadPurchaseOrders, viaTx } from "@/lib/inventoryDb";

/**
 * receiveVendorPODelivery (goods-received note). Body: { lines: [{ itemId, qty }] }.
 * Adds each qty to physical stock and to the PO line's received count, writes a GRN row per product to the
 * stock history, then sets the PO to Received (every line in full) or Partially Received.
 * Receiving more than was ordered is allowed — suppliers over-ship — and noted in the audit log.
 * Backordered projects clear on their own: ready/backordered is computed from physical stock.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!can(me.role, "editStock")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = Number(params.id);
  const body = (await req.json()) as { lines?: { itemId: number; qty: number }[] };
  const lines = (body.lines ?? []).filter((l) => l.qty !== 0);

  try {
    const result = await withTransaction(async (db) => {
      const [po] = (await db.query(`SELECT number, status FROM vendor_pos WHERE id = $1 FOR UPDATE`, [id])).rows;
      if (!po) throw new HttpError(404, "Purchase order not found");
      if (po.status !== "Issued" && po.status !== "Partially Received") {
        throw new HttpError(409, po.status === "Draft" ? `${po.number} hasn't been issued yet — issue it first` : `${po.number} is ${po.status} and can't take a delivery`);
      }
      if (lines.length === 0) throw new HttpError(400, "Enter a quantity for at least one product");
      if (new Set(lines.map((l) => l.itemId)).size !== lines.length) throw new HttpError(400, "Each product can only appear once");

      const items = new Map((await db.query(
        `SELECT i.id, i.product_id, i.qty_ordered, i.qty_received, p.name
           FROM vendor_po_items i JOIN products p ON p.id = i.product_id WHERE i.po_id = $1`,
        [id],
      )).rows.map((r) => [r.id as number, r]));

      for (const l of lines) {
        if (!items.has(l.itemId)) throw new HttpError(400, "That line isn't on this PO");
        if (!Number.isInteger(l.qty) || l.qty < 0) throw new HttpError(400, `Quantity for ${items.get(l.itemId)!.name} must be a whole number`);
      }

      await db.query(`SELECT id FROM products WHERE id = ANY($1::int[]) ORDER BY id FOR UPDATE`, [lines.map((l) => items.get(l.itemId)!.product_id)]);

      let units = 0;
      const over: string[] = [];
      for (const l of lines) {
        const item = items.get(l.itemId)!;
        await db.query(`UPDATE vendor_po_items SET qty_received = qty_received + $2 WHERE id = $1`, [l.itemId, l.qty]);
        await db.query(`UPDATE products SET physical_stock = physical_stock + $2 WHERE id = $1`, [item.product_id, l.qty]);
        await db.query(
          `INSERT INTO stock_movements (product_id, delta, reason, note, po_id, user_id) VALUES ($1, $2, 'GRN', $3, $4, $5)`,
          [item.product_id, l.qty, `Received on ${po.number}`, id, me.id],
        );
        units += l.qty;
        if (item.qty_received + l.qty > item.qty_ordered) over.push(item.name as string);
      }

      const [{ complete }] = (await db.query(`SELECT bool_and(qty_received >= qty_ordered) AS complete FROM vendor_po_items WHERE po_id = $1`, [id])).rows;
      const status = complete ? "Received" : "Partially Received";
      await db.query(`UPDATE vendor_pos SET status = $2 WHERE id = $1`, [id, status]);

      const [updated] = await loadPurchaseOrders(viaTx(db), [id]);
      return { updated, units, over, from: po.status as string };
    });

    await logAction({
      module: "Inventory",
      action: "update",
      entityType: "vendor_po",
      entityId: id,
      entityName: result.updated.number,
      summary: `Received ${result.units} unit(s) on vendor PO ${result.updated.number} (${result.from} → ${result.updated.status})` +
        (result.over.length > 0 ? ` — over-received: ${result.over.join(", ")}` : ""),
      changes: { before: { status: result.from }, after: { status: result.updated.status } },
      metadata: { received: lines },
      actor: me,
    });
    return NextResponse.json(result.updated);
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
