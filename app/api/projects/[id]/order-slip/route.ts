import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { loadSlipLines, toProject, viaSql } from "@/lib/inventoryDb";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const rows = await sql`
    SELECT p.id, p.customer_id, p.customer_name, p.site_address, p.assigned, p.architect, p.quote_id, p.notes, p.stage,
           p.created_at::text, p.last_stage_change::text, p.confirmed_at::text, q.number AS quote_number
    FROM projects p LEFT JOIN quotes q ON q.id = p.quote_id
    WHERE p.id = ${id}
  `;
  if (rows.length === 0) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  return NextResponse.json({
    project: toProject(rows[0]),
    quoteNumber: (rows[0].quote_number as string) ?? null,
    lines: await loadSlipLines(viaSql, id),
  });
}
