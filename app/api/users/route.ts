import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { can } from "@/lib/utils/permissions";
import { logAction } from "@/lib/api/audit";
import type { User } from "@/types";

export const dynamic = "force-dynamic";

function toUser(row: Record<string, unknown>): User {
  return {
    id: row.id as number,
    fullName: row.full_name as string,
    email: row.email as string,
    role: row.role as User["role"],
    status: row.status as User["status"],
  };
}

export async function GET() {
  const rows = await sql`SELECT * FROM users ORDER BY id`;
  return NextResponse.json(rows.map(toUser));
}

export async function POST(req: Request) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!can(me.role, "createStaff")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as Omit<User, "id">;
  if (body.role !== "Staff" && me.role !== "Super Admin") {
    return NextResponse.json({ error: "Only Super Admin can create Admin or Super Admin users" }, { status: 403 });
  }

  const rows = await sql`
    INSERT INTO users (full_name, email, role, status)
    VALUES (${body.fullName}, ${body.email}, ${body.role}, ${body.status})
    RETURNING *
  `;
  const created = toUser(rows[0]);

  await logAction({
    module: "User Management",
    action: "create",
    entityType: "user",
    entityId: created.id,
    entityName: created.fullName,
    summary: `Invited user ${created.fullName} (${created.email}) with role ${created.role}`,
    changes: { after: { fullName: created.fullName, email: created.email, role: created.role, status: created.status } },
    actor: me,
  });

  return NextResponse.json(created, { status: 201 });
}
