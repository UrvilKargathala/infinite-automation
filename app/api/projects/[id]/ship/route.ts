import { NextResponse } from "next/server";
import { withTransaction, HttpError } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { logAction } from "@/lib/api/audit";
import { loadSlipLines, viaTx } from "@/lib/inventoryDb";

/**
 * Mark shipped: takes units out of physical stock and off the project's reservations.
 * Body: { lines: [{ allocationId, qty }] }. Each qty must be a whole number no larger than what is
 * ready right now. The product rows are locked first so "ready" can't change between the check and
 * the deduction (another shipment, a stock adjustment or a delivery).
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const id = Number(params.id);
  const body = (await req.json()) as { lines?: { allocationId: number; qty: number }[] };
  const requested = (body.lines ?? []).filter((l) => l.qty !== 0);

  try {
    const result = await withTransaction(async (db) => {
      const [p] = (await db.query(`SELECT customer_name, stage, confirmed_at FROM projects WHERE id = $1 FOR UPDATE`, [id])).rows;
      if (!p) throw new HttpError(404, "Project not found");
      if (!p.confirmed_at) throw new HttpError(409, "Confirm the project before shipping");
      if (p.stage === "Cancelled") throw new HttpError(409, "A cancelled project can't ship");
      if (requested.length === 0) throw new HttpError(400, "Nothing to ship");

      await db.query(
        `SELECT id FROM products WHERE id IN (SELECT product_id FROM inventory_allocations WHERE project_id = $1)
          ORDER BY id FOR UPDATE`,
        [id],
      );
      const lines = new Map((await loadSlipLines(viaTx(db), id)).map((l) => [l.allocationId, l]));

      let units = 0;
      for (const r of requested) {
        const line = lines.get(r.allocationId);
        if (!line) throw new HttpError(400, "That line isn't on this project");
        if (!Number.isInteger(r.qty) || r.qty < 0) throw new HttpError(400, `Quantity for ${line.name} must be a whole number`);
        if (r.qty > line.ready) throw new HttpError(409, `Only ${line.ready} of ${line.name} can ship right now`);
        line.ready -= r.qty; // the same line listed twice can't ship twice

        await db.query(
          `UPDATE inventory_allocations
              SET shipped_qty = shipped_qty + $2,
                  status = CASE WHEN shipped_qty + $2 = qty THEN 'Shipped' ELSE status END
            WHERE id = $1`,
          [r.allocationId, r.qty],
        );
        await db.query(`UPDATE products SET physical_stock = physical_stock - $2 WHERE id = $1`, [line.productId, r.qty]);
        await db.query(
          `INSERT INTO stock_movements (product_id, delta, reason, note, project_id, user_id)
           VALUES ($1, $2, 'SHIP', $3, $4, $5)`,
          [line.productId, -r.qty, `Shipped for ${p.customer_name}`, id, me.id],
        );
        units += r.qty;
      }

      return { customerName: p.customer_name as string, units, lines: await loadSlipLines(viaTx(db), id) };
    });

    await logAction({
      module: "Inventory",
      action: "update",
      entityType: "project",
      entityId: id,
      entityName: result.customerName,
      summary: `Shipped ${result.units} unit(s) for project ${result.customerName}`,
      metadata: { shipped: requested },
      actor: me,
    });

    return NextResponse.json({ lines: result.lines });
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
