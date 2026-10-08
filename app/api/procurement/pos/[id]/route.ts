import { NextResponse } from "next/server";
import { withTransaction, HttpError } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { can } from "@/lib/utils/permissions";
import { logAction } from "@/lib/api/audit";
import { loadPurchaseOrders, viaTx } from "@/lib/inventoryDb";

type Action = "issue" | "cancel" | "close";

/**
 * Moves a PO through its life: issue (Draft → Issued, starts counting as incoming stock),
 * cancel (Draft/Issued with nothing received), close (Partially Received → Received, i.e. closed short —
 * whatever hasn't arrived stops counting as incoming).
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!can(me.role, "editStock")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = Number(params.id);
  const { action } = (await req.json()) as { action?: Action };

  try {
    const result = await withTransaction(async (db) => {
      const [po] = (await db.query(`SELECT number, status FROM vendor_pos WHERE id = $1 FOR UPDATE`, [id])).rows;
      if (!po) throw new HttpError(404, "Purchase order not found");
      const from = po.status as string;

      let to: string;
      if (action === "issue") {
        if (from !== "Draft") throw new HttpError(409, `${po.number} is ${from}, only a Draft can be issued`);
        to = "Issued";
        await db.query(`UPDATE vendor_pos SET status = 'Issued', issued_at = now() WHERE id = $1`, [id]);
      } else if (action === "cancel") {
        if (from !== "Draft" && from !== "Issued") throw new HttpError(409, `${po.number} is ${from} and can't be cancelled — close it short instead if part of it arrived`);
        to = "Cancelled";
        await db.query(`UPDATE vendor_pos SET status = 'Cancelled' WHERE id = $1`, [id]);
      } else if (action === "close") {
        if (from !== "Partially Received") throw new HttpError(409, "Only a partially received PO can be closed short");
        to = "Received";
        await db.query(`UPDATE vendor_pos SET status = 'Received' WHERE id = $1`, [id]);
      } else {
        throw new HttpError(400, "Unknown action");
      }

      const [updated] = await loadPurchaseOrders(viaTx(db), [id]);
      return { updated, from, to };
    });

    const verb = { issue: "Issued", cancel: "Cancelled", close: "Closed short" }[action as Action];
    await logAction({
      module: "Inventory",
      action: "status_change",
      entityType: "vendor_po",
      entityId: id,
      entityName: result.updated.number,
      summary: `${verb} vendor PO ${result.updated.number} (${result.from} → ${result.to})`,
      changes: { before: { status: result.from }, after: { status: result.to } },
      actor: me,
    });
    return NextResponse.json(result.updated);
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
