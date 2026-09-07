import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { can } from "@/lib/utils/permissions";
import { exportAuditLogs } from "@/lib/api/audit";
import type { AuditAction, AuditModule } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!can(me.role, "exportAuditLog")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const filters = {
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
    module: (searchParams.get("module") as AuditModule) || undefined,
    action: (searchParams.get("action") as AuditAction) || undefined,
    userId: searchParams.get("userId") ? Number(searchParams.get("userId")) : undefined,
    search: searchParams.get("search") || undefined,
  };
  const rows = await exportAuditLogs(me.role, filters);
  return NextResponse.json(rows);
}
