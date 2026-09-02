import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
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

  return NextResponse.json(toProject(rows[0]));
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  await sql`DELETE FROM projects WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
