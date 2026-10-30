import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { can } from "@/lib/utils/permissions";
import { getComplaint } from "@/lib/complaintsDb";
import type { ComplaintEvent } from "@/types";

export const dynamic = "force-dynamic";

/** A complaint's history, oldest first. Visible to admins and to its engineer. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const id = Number(params.id);
  const complaint = await getComplaint(id);
  if (!complaint) return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
  if (!can(me.role, "manageComplaints") && complaint.engineerId !== me.id) {
    return NextResponse.json({ error: "Not your complaint" }, { status: 403 });
  }
  const rows = await sql`
    SELECT id, kind, note, user_name, created_at::text AS created_at
    FROM complaint_events WHERE complaint_id = ${id} ORDER BY created_at, id
  `;
  const events: ComplaintEvent[] = rows.map((r) => ({
    id: r.id as number,
    kind: r.kind as ComplaintEvent["kind"],
    note: r.note as string,
    userName: r.user_name as string,
    createdAt: r.created_at as string,
  }));
  return NextResponse.json(events);
}
