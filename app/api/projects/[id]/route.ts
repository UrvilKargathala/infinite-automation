import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { logAction, diffFields } from "@/lib/api/audit";
import { toProject } from "@/lib/inventoryDb";
import type { Project } from "@/types";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentAppUser();
  const id = Number(params.id);
  const body = (await req.json()) as Partial<Omit<Project, "id">>;
  const existing = await sql`
    SELECT id, customer_id, customer_name, site_address, assigned, architect, quote_id, notes, stage,
           created_at::text, last_stage_change::text, confirmed_at::text
    FROM projects WHERE id = ${id}
  `;
  if (existing.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const current = toProject(existing[0]);
  if (current.confirmedAt && body.quoteId !== undefined && body.quoteId !== current.quoteId) {
    return NextResponse.json({ error: "This project is confirmed — its stock is reserved against the linked quote, so the quote can't be changed." }, { status: 409 });
  }
  const merged = { ...current, ...body };
  const stageChanged = body.stage !== undefined && body.stage !== current.stage;
  const lastStageChange = stageChanged ? new Date().toISOString() : merged.lastStageChange;

  const rows = await sql`
    UPDATE projects SET customer_id = ${merged.customerId}, customer_name = ${merged.customerName}, site_address = ${merged.siteAddress},
      assigned = ${merged.assigned}, architect = ${merged.architect}, quote_id = ${merged.quoteId},
      notes = ${merged.notes}, stage = ${merged.stage}, last_stage_change = ${lastStageChange}
    WHERE id = ${id}
    RETURNING id, customer_id, customer_name, site_address, assigned, architect, quote_id, notes, stage,
              created_at::text, last_stage_change::text, confirmed_at::text
  `;

  if (stageChanged) {
    await sql`INSERT INTO project_stage_events (project_id, stage) VALUES (${id}, ${merged.stage})`;
  }

  // Cancelling frees whatever is still reserved; units already shipped stay shipped.
  const released = merged.stage === "Cancelled" && stageChanged
    ? await sql`UPDATE inventory_allocations SET status = 'Released' WHERE project_id = ${id} AND status = 'Reserved' RETURNING id`
    : [];

  const updated = toProject(rows[0]);

  if (me) {
    if (stageChanged) {
      await logAction({
        module: "Projects",
        action: "stage_change",
        entityType: "project",
        entityId: updated.id,
        entityName: updated.customerName,
        summary: `Moved project ${updated.customerName} from ${current.stage} to ${updated.stage}` +
          (released.length > 0 ? ` and released ${released.length} reserved item(s) back to stock` : ""),
        changes: { before: { stage: current.stage }, after: { stage: updated.stage } },
        actor: me,
      });
    }

    const otherBefore = { customerName: current.customerName, siteAddress: current.siteAddress, assigned: current.assigned, architect: current.architect, quoteId: current.quoteId, notes: current.notes };
    const otherAfter = { customerName: updated.customerName, siteAddress: updated.siteAddress, assigned: updated.assigned, architect: updated.architect, quoteId: updated.quoteId, notes: updated.notes };
    const otherChanges = diffFields(otherBefore, otherAfter);
    if (otherChanges) {
      await logAction({
        module: "Projects",
        action: "update",
        entityType: "project",
        entityId: updated.id,
        entityName: updated.customerName,
        summary: `Updated project ${updated.customerName}`,
        changes: otherChanges,
        actor: me,
      });
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentAppUser();
  const id = Number(params.id);
  const existing = await sql`
    SELECT id, customer_name, site_address, assigned, architect, quote_id, notes, stage,
           created_at::text, last_stage_change::text, confirmed_at::text
    FROM projects WHERE id = ${id}
  `;
  await sql`DELETE FROM projects WHERE id = ${id}`;

  if (me && existing.length > 0) {
    const deleted = toProject(existing[0]);
    await logAction({
      module: "Projects",
      action: "delete",
      entityType: "project",
      entityId: deleted.id,
      entityName: deleted.customerName,
      summary: `Deleted project ${deleted.customerName} (${deleted.siteAddress})`,
      changes: { before: { ...deleted } },
      actor: me,
    });
  }

  return NextResponse.json({ ok: true });
}
