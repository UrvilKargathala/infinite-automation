import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { logAction, diffFields } from "@/lib/api/audit";
import type { Project } from "@/types";

function toProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as number,
    customerName: row.customer_name as string,
    siteAddress: row.site_address as string,
    assigned: row.assigned as string,
    architect: row.architect as string,
    quoteId: (row.quote_id as number) ?? null,
    notes: row.notes as string,
    stage: row.stage as Project["stage"],
    createdAt: row.created_at as string,
    lastStageChange: row.last_stage_change as string,
  };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentAppUser();
  const id = Number(params.id);
  const body = (await req.json()) as Partial<Omit<Project, "id">>;
  const existing = await sql`
    SELECT id, customer_name, site_address, assigned, architect, quote_id, notes, stage,
           created_at::text, last_stage_change::text
    FROM projects WHERE id = ${id}
  `;
  if (existing.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const current = toProject(existing[0]);
  const merged = { ...current, ...body };
  const stageChanged = body.stage !== undefined && body.stage !== current.stage;
  const lastStageChange = stageChanged ? new Date().toISOString() : merged.lastStageChange;

  const rows = await sql`
    UPDATE projects SET customer_name = ${merged.customerName}, site_address = ${merged.siteAddress},
      assigned = ${merged.assigned}, architect = ${merged.architect}, quote_id = ${merged.quoteId},
      notes = ${merged.notes}, stage = ${merged.stage}, last_stage_change = ${lastStageChange}
    WHERE id = ${id}
    RETURNING id, customer_name, site_address, assigned, architect, quote_id, notes, stage,
              created_at::text, last_stage_change::text
  `;

  if (stageChanged) {
    await sql`INSERT INTO project_stage_events (project_id, stage) VALUES (${id}, ${merged.stage})`;
  }

  const updated = toProject(rows[0]);

  if (me) {
    if (stageChanged) {
      await logAction({
        module: "Projects",
        action: "stage_change",
        entityType: "project",
        entityId: updated.id,
        entityName: updated.customerName,
        summary: `Moved project ${updated.customerName} from ${current.stage} to ${updated.stage}`,
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
           created_at::text, last_stage_change::text
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
