import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { can } from "@/lib/utils/permissions";
import { countAuditLogsSince } from "@/lib/api/audit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!can(me.role, "viewAuditLog")) return NextResponse.json({ count: 0 });

  const { searchParams } = new URL(req.url);
  const since = searchParams.get("since");
  if (!since) return NextResponse.json({ count: 0 });

  const count = await countAuditLogsSince(since);
  return NextResponse.json({ count });
}
