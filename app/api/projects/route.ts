import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { logAction } from "@/lib/api/audit";
import type { Project } from "@/types";

export const dynamic = "force-dynamic";

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

export async function GET() {
  const rows = await sql`
    SELECT id, customer_name, site_address, assigned, architect, quote_id, notes, stage,
           created_at::text, last_stage_change::text
    FROM projects ORDER BY id
  `;
  return NextResponse.json(rows.map(toProject));
}

export async function POST(req: Request) {
  const me = await getCurrentAppUser();
  const body = (await req.json()) as Omit<Project, "id" | "quoteId" | "notes" | "createdAt" | "lastStageChange">;
  const rows = await sql`
    INSERT INTO projects (customer_name, site_address, assigned, architect, stage)
    VALUES (${body.customerName}, ${body.siteAddress}, ${body.assigned}, ${body.architect}, ${body.stage})
    RETURNING id, customer_name, site_address, assigned, architect, quote_id, notes, stage,
              created_at::text, last_stage_change::text
  `;
  await sql`INSERT INTO project_stage_events (project_id, stage) VALUES (${rows[0].id}, ${body.stage})`;
  const created = toProject(rows[0]);

  if (me) {
    await logAction({
      module: "Projects",
      action: "create",
      entityType: "project",
      entityId: created.id,
      entityName: created.customerName,
      summary: `Created project ${created.customerName} at ${created.siteAddress} in ${created.stage} stage`,
      changes: { after: { customerName: created.customerName, siteAddress: created.siteAddress, assigned: created.assigned, architect: created.architect, stage: created.stage } },
      actor: me,
    });
  }

  return NextResponse.json(created, { status: 201 });
}
