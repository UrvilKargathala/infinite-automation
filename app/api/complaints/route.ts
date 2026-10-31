import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { can } from "@/lib/utils/permissions";
import { logAction } from "@/lib/api/audit";
import { createNotifications } from "@/lib/api/notifications";
import { addComplaintEvent, complaintHref, getComplaint, toComplaint } from "@/lib/complaintsDb";

export const dynamic = "force-dynamic";

/** Admins see every complaint; everyone else sees the ones assigned to them. */
export async function GET() {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const all = can(me.role, "manageComplaints");
  const rows = await sql`
    SELECT c.*, c.created_at::text AS created_at, c.completed_at::text AS completed_at, c.cancelled_at::text AS cancelled_at,
           e.full_name AS engineer_name, cb.full_name AS created_by_name
    FROM complaints c
    LEFT JOIN users e ON e.id = c.engineer_id
    LEFT JOIN users cb ON cb.id = c.created_by
    WHERE ${all} OR c.engineer_id = ${me.id}
    ORDER BY (c.status = 'Pending') DESC, c.created_at DESC
  `;
  return NextResponse.json(rows.map(toComplaint));
}

/** Raise a complaint and assign it to an engineer (Super Admin / Admin). */
export async function POST(req: Request) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!can(me.role, "manageComplaints")) return NextResponse.json({ error: "Only Super Admins and Admins can raise complaints" }, { status: 403 });

  const body = (await req.json()) as { customerName?: string; phone?: string; siteAddress?: string; customerId?: number | null; remarks?: string; engineerId?: number };
  const customerName = body.customerName?.trim() ?? "";
  const remarks = body.remarks?.trim() ?? "";
  if (!customerName) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!remarks) return NextResponse.json({ error: "Remarks are required" }, { status: 400 });
  const [engineer] = await sql`SELECT id, full_name FROM users WHERE id = ${body.engineerId ?? 0} AND status = 'Active'`;
  if (!engineer) return NextResponse.json({ error: "Pick an active engineer" }, { status: 400 });

  let customerId: number | null = null;
  if (body.customerId) {
    const [customer] = await sql`SELECT id FROM customers WHERE id = ${body.customerId}`;
    if (!customer) return NextResponse.json({ error: "That customer no longer exists" }, { status: 400 });
    customerId = customer.id as number;
  }

  const [row] = await sql`
    INSERT INTO complaints (customer_name, phone, site_address, customer_id, remarks, engineer_id, created_by)
    VALUES (${customerName}, ${body.phone?.trim() ?? ""}, ${body.siteAddress?.trim() ?? ""}, ${customerId}, ${remarks}, ${engineer.id}, ${me.id})
    RETURNING id
  `;
  const id = row.id as number;
  await sql`UPDATE complaints SET number = ${"CMP-" + String(id).padStart(4, "0")} WHERE id = ${id}`;
  await addComplaintEvent(id, "created", me.fullName, `Assigned to ${engineer.full_name}`);
  const complaint = (await getComplaint(id))!;

  if (engineer.id !== me.id) {
    await createNotifications([engineer.id as number], `New complaint ${complaint.number} assigned to you — ${customerName}`, "#F59E0B", complaintHref(id));
  }
  await logAction({
    module: "CRM",
    action: "create",
    entityType: "complaint",
    entityId: id,
    entityName: complaint.number,
    summary: `Raised complaint ${complaint.number} for ${customerName}, assigned to ${engineer.full_name}`,
    changes: { after: { name: customerName, phone: complaint.phone, siteAddress: complaint.siteAddress, remarks, engineer: engineer.full_name, status: "Pending" } },
    actor: me,
  });
  return NextResponse.json(complaint, { status: 201 });
}
