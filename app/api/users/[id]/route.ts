import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { can } from "@/lib/utils/permissions";
import { logAction, diffFields } from "@/lib/api/audit";
import type { User } from "@/types";

function toUser(row: Record<string, unknown>): User {
  return {
    id: row.id as number,
    fullName: row.full_name as string,
    email: row.email as string,
    role: row.role as User["role"],
    status: row.status as User["status"],
  };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const id = Number(params.id);
  const body = (await req.json()) as Partial<Omit<User, "id">>;
  const existing = await sql`SELECT * FROM users WHERE id = ${id}`;
  if (existing.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const current = toUser(existing[0]);
  const isSelf = id === me.id;

  if (isSelf) {
    // Everyone may edit their own name/email, but never self-promote role/status
    body.role = current.role;
    body.status = current.status;
  } else {
    if (!can(me.role, "editUser")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // Admin may only edit/deactivate Staff users, and can't grant Admin/Super Admin
    if (me.role === "Admin") {
      if (current.role !== "Staff") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      if (body.role && body.role !== "Staff") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const merged = { ...current, ...body };
  const rows = await sql`
    UPDATE users SET full_name = ${merged.fullName}, email = ${merged.email},
      role = ${merged.role}, status = ${merged.status}
    WHERE id = ${id}
    RETURNING *
  `;
  const updated = toUser(rows[0]);

  if (updated.role !== current.role) {
    await logAction({
      module: "User Management",
      action: "role_change",
      entityType: "user",
      entityId: updated.id,
      entityName: updated.fullName,
      summary: `Changed ${updated.fullName} role from ${current.role} to ${updated.role}`,
      changes: { before: { role: current.role }, after: { role: updated.role } },
      actor: me,
    });
  }

  if (updated.status !== current.status) {
    await logAction({
      module: "User Management",
      action: "status_change",
      entityType: "user",
      entityId: updated.id,
      entityName: updated.fullName,
      summary: updated.status === "Inactive" ? `Deactivated user ${updated.fullName}` : `Reactivated user ${updated.fullName}`,
      changes: { before: { status: current.status }, after: { status: updated.status } },
      actor: me,
    });
  }

  const otherChanges = diffFields(
    { fullName: current.fullName, email: current.email },
    { fullName: updated.fullName, email: updated.email }
  );
  if (otherChanges) {
    await logAction({
      module: "User Management",
      action: "update",
      entityType: "user",
      entityId: updated.id,
      entityName: updated.fullName,
      summary: `Updated user ${updated.fullName}`,
      changes: otherChanges,
      actor: me,
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!can(me.role, "deleteUser")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  await sql`DELETE FROM users WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
