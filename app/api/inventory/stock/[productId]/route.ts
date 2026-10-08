import { NextResponse } from "next/server";
import { withTransaction, HttpError } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { can } from "@/lib/utils/permissions";
import { logAction } from "@/lib/api/audit";
import { loadStockRows, viaTx } from "@/lib/inventoryDb";

interface Body {
  delta?: number;     // add (+) or remove (-) units
  setTo?: number;     // stock count: set physical to exactly this
  note?: string;
  minBuffer?: number;
}

const isWhole = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n);

/**
 * Adjust one product's physical stock (by delta, or to a counted figure) and/or its min buffer.
 * The product row is locked so a count lands on the true current figure, not a stale one.
 */
export async function PATCH(req: Request, { params }: { params: { productId: string } }) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!can(me.role, "editStock")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = Number(params.productId);
  const body = (await req.json()) as Body;
  const note = (body.note ?? "").trim();

  try {
    const result = await withTransaction(async (db) => {
      if (body.delta !== undefined && body.setTo !== undefined) throw new HttpError(400, "Send either an adjustment or a count, not both");
      if (body.delta !== undefined && (!isWhole(body.delta) || body.delta === 0)) throw new HttpError(400, "Adjustment must be a whole number other than 0");
      if (body.setTo !== undefined && (!isWhole(body.setTo) || body.setTo < 0)) throw new HttpError(400, "Counted stock must be a whole number, 0 or more");
      if (body.minBuffer !== undefined && (!isWhole(body.minBuffer) || body.minBuffer < 0)) throw new HttpError(400, "Min buffer must be a whole number, 0 or more");

      const [p] = (await db.query(`SELECT name, physical_stock, min_buffer FROM products WHERE id = $1 FOR UPDATE`, [id])).rows;
      if (!p) throw new HttpError(404, "Product not found");

      const before = { physical: p.physical_stock as number, minBuffer: p.min_buffer as number };
      const delta = body.setTo !== undefined ? body.setTo - before.physical : body.delta ?? 0;
      if (before.physical + delta < 0) throw new HttpError(409, `Only ${before.physical} in stock — can't remove ${-delta}`);

      if (delta !== 0) {
        await db.query(`UPDATE products SET physical_stock = physical_stock + $2 WHERE id = $1`, [id, delta]);
        await db.query(
          `INSERT INTO stock_movements (product_id, delta, reason, note, user_id) VALUES ($1, $2, 'ADJUST', $3, $4)`,
          [id, delta, note || (body.setTo !== undefined ? "Stock count" : "Manual adjustment"), me.id],
        );
      }
      if (body.minBuffer !== undefined && body.minBuffer !== before.minBuffer) {
        await db.query(`UPDATE products SET min_buffer = $2 WHERE id = $1`, [id, body.minBuffer]);
      }

      const [row] = await loadStockRows(viaTx(db), [id]);
      return { name: p.name as string, before, row, delta };
    });

    const after = { physical: result.row.physical, minBuffer: result.row.minBuffer };
    if (result.delta !== 0 || after.minBuffer !== result.before.minBuffer) {
      const parts = [];
      if (result.delta !== 0) parts.push(`stock ${result.before.physical} → ${after.physical} (${result.delta > 0 ? "+" : ""}${result.delta})`);
      if (after.minBuffer !== result.before.minBuffer) parts.push(`min buffer ${result.before.minBuffer} → ${after.minBuffer}`);
      await logAction({
        module: "Inventory",
        action: "update",
        entityType: "product",
        entityId: id,
        entityName: result.name,
        summary: `Adjusted ${result.name}: ${parts.join(", ")}${note ? ` — ${note}` : ""}`,
        changes: { before: result.before, after },
        actor: me,
      });
    }

    return NextResponse.json(result.row);
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
