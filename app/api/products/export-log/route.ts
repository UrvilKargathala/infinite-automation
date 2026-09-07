import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { logAction } from "@/lib/api/audit";

export async function POST(req: Request) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = (await req.json()) as { rowCount: number; brand?: string; category?: string; search?: string };
  await logAction({
    module: "Master",
    action: "export",
    entityType: "product",
    entityId: null,
    summary: `Exported ${body.rowCount} products to Excel`,
    metadata: { rowCount: body.rowCount, filters: { brand: body.brand || null, category: body.category || null, search: body.search || null } },
  });

  return NextResponse.json({ ok: true });
}
