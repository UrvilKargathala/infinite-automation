import { NextResponse } from "next/server";
import { withTransaction, HttpError } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { logAction } from "@/lib/api/audit";
import { notifyAssignee, notifyQuoteStatus } from "@/lib/api/notifications";
import { QUOTE_PRODUCT_LINES, toProject } from "@/lib/inventoryDb";

/**
 * confirmInquiryAndAllocate: marks the project confirmed, sets its quote to Accepted and reserves
 * every catalogue product on that quote. The project row is locked first, so two people pressing
 * Confirm at once can't reserve twice — the second one sees confirmed_at and is refused.
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const id = Number(params.id);

  try {
    const result = await withTransaction(async (db) => {
      const [p] = (await db.query(`SELECT id, quote_id, stage, confirmed_at FROM projects WHERE id = $1 FOR UPDATE`, [id])).rows;
      if (!p) throw new HttpError(404, "Project not found");
      if (p.confirmed_at) throw new HttpError(409, "This project is already confirmed");
      if (p.stage === "Cancelled") throw new HttpError(409, "A cancelled project can't be confirmed");
      if (!p.quote_id) throw new HttpError(400, "Link a quote to this project before confirming it");

      const [quote] = (await db.query(`SELECT number FROM quotes WHERE id = $1`, [p.quote_id])).rows;
      // Same product in several sections (or inside several kits) becomes one reservation line.
      const items = (await db.query(
        `SELECT ql.product_id, SUM(ql.qty)::int AS qty
           FROM ${QUOTE_PRODUCT_LINES} ql JOIN quote_sections qs ON qs.id = ql.section_id
          WHERE qs.quote_id = $1
          GROUP BY ql.product_id
         HAVING SUM(ql.qty) > 0`,
        [p.quote_id],
      )).rows as { product_id: number; qty: number }[];
      if (items.length === 0) throw new HttpError(400, `Quote ${quote?.number ?? ""} has no catalogue products to reserve`);

      await db.query(
        `INSERT INTO inventory_allocations (project_id, product_id, qty)
         SELECT $1, unnest($2::int[]), unnest($3::int[])`,
        [id, items.map((i) => i.product_id), items.map((i) => i.qty)],
      );
      await db.query(`UPDATE quotes SET status = 'Accepted' WHERE id = $1`, [p.quote_id]);
      const [row] = (await db.query(
        `UPDATE projects SET confirmed_at = now() WHERE id = $1
         RETURNING id, customer_id, customer_name, site_address, assigned, architect, quote_id, notes, stage,
                   created_at::text, last_stage_change::text, confirmed_at::text`,
        [id],
      )).rows;

      return { project: toProject(row), quoteNumber: quote?.number as string, lines: items.length, units: items.reduce((s, i) => s + i.qty, 0) };
    });

    await logAction({
      module: "Projects",
      action: "status_change",
      entityType: "project",
      entityId: result.project.id,
      entityName: result.project.customerName,
      summary: `Confirmed project ${result.project.customerName} — reserved ${result.units} unit(s) across ${result.lines} product(s) from quote ${result.quoteNumber}`,
      changes: { before: { confirmed: false }, after: { confirmed: true, quote: result.quoteNumber } },
      actor: me,
    });

    // The quote went Accepted here (not on the Quote page), so send the same quote alert, and tell the assignee.
    if (result.project.quoteId) await notifyQuoteStatus({ id: result.project.quoteId, number: result.quoteNumber }, "Accepted", me.id);
    await notifyAssignee(result.project.assigned, me.id, `${me.fullName} confirmed ${result.project.customerName} — ${result.units} unit(s) reserved`, "#10B981", `/crm?open=${result.project.id}`);

    return NextResponse.json(result.project);
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
