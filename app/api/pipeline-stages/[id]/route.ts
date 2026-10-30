import { NextResponse } from "next/server";
import { withTransaction, HttpError } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { logAction } from "@/lib/api/audit";
import { stageNameError, toStage } from "@/lib/pipelineDb";

/** Rename a custom stage. Records in it move with it; default stages are fixed. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const id = Number(params.id);
  const body = (await req.json()) as { name?: string };
  const invalid = stageNameError(body.name);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
  const name = body.name!.trim();

  try {
    const { stage, oldName } = await withTransaction(async (db) => {
      const [cur] = (await db.query(`SELECT id, name, is_default FROM pipeline_stages WHERE id = $1 FOR UPDATE`, [id])).rows;
      if (!cur) throw new HttpError(404, "Stage not found");
      if (cur.is_default) throw new HttpError(403, "Default stages can't be renamed");
      const clash = (await db.query(`SELECT 1 FROM pipeline_stages WHERE lower(name) = lower($1) AND id <> $2`, [name, id])).rows;
      if (clash.length) throw new HttpError(409, `There's already a "${name}" stage`);
      const [row] = (await db.query(
        `UPDATE pipeline_stages SET name = $1 WHERE id = $2 RETURNING id, name, position, is_default, color`,
        [name, id],
      )).rows;
      // projects.stage stores the name, so carry the records across. Stage history keeps the old name as it was.
      await db.query(`UPDATE projects SET stage = $1 WHERE stage = $2`, [name, cur.name]);
      return { stage: toStage(row), oldName: cur.name as string };
    });

    if (oldName !== stage.name) {
      await logAction({
        module: "Projects",
        action: "update",
        entityType: "pipeline_stage",
        entityId: stage.id,
        entityName: stage.name,
        summary: `Renamed CRM stage "${oldName}" to "${stage.name}"`,
        changes: { before: { name: oldName }, after: { name: stage.name } },
        actor: me,
      });
    }
    return NextResponse.json(stage);
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

/** Delete an empty custom stage and close the gap in the ordering. */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const id = Number(params.id);

  try {
    const removed = await withTransaction(async (db) => {
      const [cur] = (await db.query(`SELECT id, name, position, is_default FROM pipeline_stages WHERE id = $1 FOR UPDATE`, [id])).rows;
      if (!cur) throw new HttpError(404, "Stage not found");
      if (cur.is_default) throw new HttpError(403, "Default stages can't be deleted");
      const [{ n }] = (await db.query(`SELECT count(*)::int AS n FROM projects WHERE stage = $1`, [cur.name])).rows;
      if (n > 0) throw new HttpError(409, `Move the ${n} record${n === 1 ? "" : "s"} out of "${cur.name}" first`);
      await db.query(`DELETE FROM pipeline_stages WHERE id = $1`, [id]);
      await db.query(`UPDATE pipeline_stages SET position = position - 1 WHERE position > $1`, [cur.position]);
      return cur.name as string;
    });

    await logAction({
      module: "Projects",
      action: "delete",
      entityType: "pipeline_stage",
      entityId: id,
      entityName: removed,
      summary: `Deleted CRM stage "${removed}"`,
      changes: { before: { name: removed } },
      actor: me,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
