import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { can } from "@/lib/utils/permissions";
import { getAuditStats } from "@/lib/api/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!can(me.role, "viewAuditLog")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const stats = await getAuditStats(me.role);
  return NextResponse.json(stats);
}
