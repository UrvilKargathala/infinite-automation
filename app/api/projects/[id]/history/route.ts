import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import type { ProjectStageEvent } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const projectId = Number(params.id);
  const rows = await sql`
    SELECT id, project_id, stage, changed_at::text
    FROM project_stage_events
    WHERE project_id = ${projectId}
    ORDER BY changed_at DESC
  `;
  const events: ProjectStageEvent[] = rows.map((r) => ({
    id: r.id as number,
    projectId: r.project_id as number,
    stage: r.stage as ProjectStageEvent["stage"],
    changedAt: r.changed_at as string,
  }));
  return NextResponse.json(events);
}
