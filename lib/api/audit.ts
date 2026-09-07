import { sql } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { can } from "@/lib/utils/permissions";
import type { AuditAction, AuditChanges, AuditLog, AuditModule, Role } from "@/types";

interface Actor {
  id: number;
  fullName: string;
  role: Role;
}

interface LogActionInput {
  module: AuditModule;
  action: AuditAction;
  entityType: string;
  entityId?: string | number | null;
  entityName?: string | null;
  summary: string;
  changes?: AuditChanges;
  metadata?: Record<string, unknown>;
  /** Pass explicitly when the session cookie isn't readable yet (e.g. right after login). */
  actor?: Actor;
}

/** Fire-and-forget: never throws, never blocks the caller. */
export async function logAction(entry: LogActionInput): Promise<void> {
  try {
    const actor = entry.actor ?? (await getCurrentAppUser());
    if (!actor) return;
    const entityId = entry.entityId != null ? String(entry.entityId) : null;
    await sql`
      INSERT INTO audit_logs (user_id, user_name, user_role, module, action, entity_type, entity_id, entity_name, summary, changes, metadata)
      VALUES (
        ${actor.id}, ${actor.fullName}, ${actor.role}, ${entry.module}, ${entry.action},
        ${entry.entityType}, ${entityId}, ${entry.entityName ?? null}, ${entry.summary},
        ${entry.changes ? JSON.stringify(entry.changes) : null},
        ${entry.metadata ? JSON.stringify(entry.metadata) : null}
      )
    `;
  } catch (err) {
    console.error("[audit] failed to log action", err);
  }
}

/** Returns only the fields that differ, or undefined if nothing changed. */
export function diffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): AuditChanges | undefined {
  const beforeChanged: Record<string, unknown> = {};
  const afterChanged: Record<string, unknown> = {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      beforeChanged[key] = before[key];
      afterChanged[key] = after[key];
    }
  }
  if (Object.keys(beforeChanged).length === 0) return undefined;
  return { before: beforeChanged, after: afterChanged };
}

function toAuditLog(row: Record<string, unknown>): AuditLog {
  return {
    id: row.id as number,
    timestamp: row.timestamp as string,
    userId: (row.user_id as number) ?? null,
    userName: row.user_name as string,
    userRole: row.user_role as Role,
    module: row.module as AuditModule,
    action: row.action as AuditAction,
    entityType: row.entity_type as string,
    entityId: (row.entity_id as string) ?? null,
    entityName: (row.entity_name as string) ?? null,
    summary: row.summary as string,
    changes: (row.changes as AuditChanges) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? null,
  };
}

export interface AuditFilters {
  from?: string;
  to?: string;
  module?: AuditModule | "";
  action?: AuditAction | "";
  userId?: number | null;
  search?: string;
}

function buildWhere(filters: AuditFilters, extra?: { cursor?: string | null }) {
  const conditions: string[] = [];
  const params: unknown[] = [];

  function add(build: (i: number) => string, value: unknown) {
    params.push(value);
    conditions.push(build(params.length));
  }

  if (filters.from) add((i) => `timestamp >= $${i}::date`, filters.from);
  if (filters.to) add((i) => `timestamp < ($${i}::date + INTERVAL '1 day')`, filters.to);
  if (filters.module) add((i) => `module = $${i}`, filters.module);
  if (filters.action) add((i) => `action = $${i}`, filters.action);
  if (filters.userId) add((i) => `user_id = $${i}`, filters.userId);
  if (filters.search?.trim()) {
    params.push(`%${filters.search.trim()}%`);
    const i = params.length;
    conditions.push(`(summary ILIKE $${i} OR entity_name ILIKE $${i} OR user_name ILIKE $${i})`);
  }
  if (extra?.cursor) add((i) => `timestamp < $${i}::timestamptz`, extra.cursor);

  return {
    where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}

export async function listAuditLogs(
  role: Role,
  filters: AuditFilters & { cursor?: string | null; limit?: number }
): Promise<{ rows: AuditLog[]; nextCursor: string | null }> {
  if (!can(role, "viewAuditLog")) throw new Error("Forbidden");
  const limit = filters.limit ?? 25;
  const { where, params } = buildWhere(filters, { cursor: filters.cursor });
  params.push(limit);
  const text = `SELECT * FROM audit_logs ${where} ORDER BY timestamp DESC LIMIT $${params.length}`;
  const rows = (await sql.query(text, params)) as Record<string, unknown>[];
  const mapped = rows.map(toAuditLog);
  const nextCursor = mapped.length === limit ? mapped[mapped.length - 1].timestamp : null;
  return { rows: mapped, nextCursor };
}

export async function exportAuditLogs(role: Role, filters: AuditFilters): Promise<AuditLog[]> {
  if (!can(role, "exportAuditLog")) throw new Error("Forbidden");
  const { where, params } = buildWhere(filters);
  const text = `SELECT * FROM audit_logs ${where} ORDER BY timestamp DESC`;
  const rows = (await sql.query(text, params)) as Record<string, unknown>[];
  return rows.map(toAuditLog);
}

export async function countAuditLogsSince(timestamp: string): Promise<number> {
  const rows = await sql`SELECT count(*) AS n FROM audit_logs WHERE timestamp > ${timestamp}`;
  return Number(rows[0].n);
}

export interface AuditStats {
  total: number;
  today: number;
  thisWeek: number;
  modulesActiveToday: number;
}

export async function getAuditStats(role: Role): Promise<AuditStats> {
  if (!can(role, "viewAuditLog")) throw new Error("Forbidden");
  const [totalRow] = await sql`SELECT count(*) AS n FROM audit_logs`;
  const [todayRow] = await sql`SELECT count(*) AS n FROM audit_logs WHERE timestamp >= date_trunc('day', now())`;
  const [weekRow] = await sql`SELECT count(*) AS n FROM audit_logs WHERE timestamp >= now() - INTERVAL '7 days'`;
  const [modulesRow] = await sql`SELECT count(DISTINCT module) AS n FROM audit_logs WHERE timestamp >= date_trunc('day', now())`;
  return {
    total: Number(totalRow.n),
    today: Number(todayRow.n),
    thisWeek: Number(weekRow.n),
    modulesActiveToday: Number(modulesRow.n),
  };
}

export async function getLatestAuditLogs(limit: number): Promise<AuditLog[]> {
  const rows = await sql`SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ${limit}`;
  return rows.map(toAuditLog);
}
