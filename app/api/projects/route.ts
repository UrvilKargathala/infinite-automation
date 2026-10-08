import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { logAction } from "@/lib/api/audit";
import { toProject } from "@/lib/inventoryDb";
import type { Project } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await sql`
    SELECT id, customer_id, customer_name, site_address, assigned, architect, quote_id, notes, stage,
           created_at::text, last_stage_change::text, confirmed_at::text
    FROM projects ORDER BY id
  `;
  return NextResponse.json(rows.map(toProject));
}

export async function POST(req: Request) {
  const me = await getCurrentAppUser();
  const body = (await req.json()) as Omit<Project, "id" | "quoteId" | "notes" | "createdAt" | "lastStageChange" | "confirmedAt">;
  if (!body.customerId) return NextResponse.json({ error: "Customer is required" }, { status: 400 });
  const rows = await sql`
    INSERT INTO projects (customer_id, customer_name, site_address, assigned, architect, stage)
    VALUES (${body.customerId}, ${body.customerName}, ${body.siteAddress}, ${body.assigned}, ${body.architect}, ${body.stage})
    RETURNING id, customer_id, customer_name, site_address, assigned, architect, quote_id, notes, stage,
              created_at::text, last_stage_change::text, confirmed_at::text
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
