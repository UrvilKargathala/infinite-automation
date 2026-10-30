import { NextResponse } from "next/server";
import { withTransaction, HttpError } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { logAction } from "@/lib/api/audit";
import { listStages, stageNameError, toStage } from "@/lib/pipelineDb";
import { CUSTOM_STAGE_COLORS } from "@/lib/utils/pipeline";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  return NextResponse.json(await listStages());
}

/** Add a custom stage right after `afterId` (or at the end). Anyone may add stages. */
export async function POST(req: Request) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const body = (await req.json()) as { name?: string; afterId?: number | null };
  const invalid = stageNameError(body.name);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
  const name = body.name!.trim();

  try {
    const { stage, afterName } = await withTransaction(async (db) => {
      // Lock the ordering so two people adding stages at once can't collide on a position.
      const all = (await db.query(`SELECT id, name, position, is_default FROM pipeline_stages ORDER BY position FOR UPDATE`)).rows;
      if (all.some((s) => (s.name as string).toLowerCase() === name.toLowerCase())) {
        throw new HttpError(409, `There's already a "${name}" stage`);
      }
      const after = body.afterId != null ? all.find((s) => s.id === body.afterId) : all[all.length - 1];
      if (!after) throw new HttpError(400, "Pick where the stage goes");
      const position = (after.position as number) + 1;
      const customCount = all.filter((s) => !s.is_default).length;
      await db.query(`UPDATE pipeline_stages SET position = position + 1 WHERE position >= $1`, [position]);
      const [row] = (await db.query(
        `INSERT INTO pipeline_stages (name, position, is_default, color) VALUES ($1, $2, false, $3)
         RETURNING id, name, position, is_default, color`,
        [name, position, CUSTOM_STAGE_COLORS[customCount % CUSTOM_STAGE_COLORS.length]],
      )).rows;
      return { stage: toStage(row), afterName: after.name as string };
    });

    await logAction({
      module: "Projects",
      action: "create",
      entityType: "pipeline_stage",
      entityId: stage.id,
      entityName: stage.name,
      summary: `Added CRM stage "${stage.name}" after "${afterName}"`,
      changes: { after: { name: stage.name, after: afterName } },
      actor: me,
    });
    return NextResponse.json(stage, { status: 201 });
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
