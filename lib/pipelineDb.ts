import { sql } from "@/lib/db";
import { CANCELLED } from "@/lib/utils/pipeline";
import type { PipelineStage } from "@/types";

export function toStage(row: Record<string, unknown>): PipelineStage {
  return {
    id: row.id as number,
    name: row.name as string,
    position: row.position as number,
    isDefault: row.is_default as boolean,
    color: row.color as string,
  };
}

export async function listStages(): Promise<PipelineStage[]> {
  const rows = await sql`SELECT id, name, position, is_default, color FROM pipeline_stages ORDER BY position`;
  return rows.map(toStage);
}

/** A project may only sit in an existing pipeline stage, or be Cancelled. */
export async function isValidProjectStage(name: unknown): Promise<boolean> {
  if (typeof name !== "string" || !name) return false;
  if (name === CANCELLED) return true;
  const rows = await sql`SELECT 1 FROM pipeline_stages WHERE name = ${name}`;
  return rows.length > 0;
}

/** Trimmed, 1–40 chars, not "Cancelled". Returns an error message, or null when fine. */
export function stageNameError(name: unknown): string | null {
  if (typeof name !== "string" || !name.trim()) return "Give the stage a name";
  if (name.trim().length > 40) return "Keep stage names under 40 characters";
  if (name.trim().toLowerCase() === CANCELLED.toLowerCase()) return `"${CANCELLED}" is reserved`;
  return null;
}
