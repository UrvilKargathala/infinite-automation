import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { can } from "@/lib/utils/permissions";
import { logAction } from "@/lib/api/audit";
import { createNotifications } from "@/lib/api/notifications";
import { addComplaintEvent, complaintHref, getComplaint } from "@/lib/complaintsDb";

type Body =
  | { action: "complete"; resolution?: string }
  | { action: "cancel"; reason?: string }
  | { action: "reopen"; note?: string }
  | { action: "edit"; customerName?: string; phone?: string; siteAddress?: string; customerId?: number | null; remarks?: string; engineerId?: number };

/**
 * The complaint flow:
 *  - complete: the assigned engineer (or an admin) closes a Pending complaint with a note → the raiser is notified.
 *  - cancel:   an admin withdraws a Pending complaint (raised by mistake, customer withdrew, duplicate…) with a reason → the engineer is notified.
 *  - reopen:   an admin sends a Completed or Cancelled complaint back to Pending → the engineer is notified.
 *  - edit:     an admin changes the details or reassigns the engineer → a new engineer is notified.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const id = Number(params.id);
  const current = await getComplaint(id);
  if (!current) return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
  const isAdmin = can(me.role, "manageComplaints");
  const body = (await req.json()) as Body;

  if (body.action === "complete") {
    if (!isAdmin && current.engineerId !== me.id) return NextResponse.json({ error: "Only the assigned engineer or an admin can complete this" }, { status: 403 });
    if (current.status === "Completed") return NextResponse.json({ error: "Already completed" }, { status: 409 });
    if (current.status === "Cancelled") return NextResponse.json({ error: "This complaint was cancelled — reopen it first" }, { status: 409 });
    const resolution = body.resolution?.trim() ?? "";
    if (!resolution) return NextResponse.json({ error: "Add a note on what was done" }, { status: 400 });
    await sql`UPDATE complaints SET status = 'Completed', resolution = ${resolution}, completed_at = now() WHERE id = ${id}`;
    await addComplaintEvent(id, "completed", me.fullName, resolution);
    const notify = [current.createdById, current.engineerId].filter((u): u is number => u != null && u !== me.id);
    await createNotifications([...new Set(notify)], `Complaint ${current.number} (${current.customerName}) completed by ${me.fullName}`, "#44BE4A", complaintHref(id));
    await logAction({
      module: "CRM", action: "status_change", entityType: "complaint", entityId: id, entityName: current.number,
      summary: `Completed complaint ${current.number} for ${current.customerName}`,
      changes: { before: { status: "Pending" }, after: { status: "Completed", resolution } }, actor: me,
    });
  } else if (body.action === "cancel") {
    if (!isAdmin) return NextResponse.json({ error: "Only Super Admins and Admins can cancel complaints" }, { status: 403 });
    if (current.status !== "Pending") return NextResponse.json({ error: `Only pending complaints can be cancelled (this one is ${current.status.toLowerCase()})` }, { status: 409 });
    const reason = body.reason?.trim() ?? "";
    if (!reason) return NextResponse.json({ error: "Add a reason for cancelling" }, { status: 400 });
    await sql`UPDATE complaints SET status = 'Cancelled', cancel_reason = ${reason}, cancelled_at = now() WHERE id = ${id}`;
    await addComplaintEvent(id, "cancelled", me.fullName, reason);
    if (current.engineerId && current.engineerId !== me.id) {
      await createNotifications([current.engineerId], `Complaint ${current.number} (${current.customerName}) was cancelled — ${reason}`, "#94A3B8", complaintHref(id));
    }
    await logAction({
      module: "CRM", action: "status_change", entityType: "complaint", entityId: id, entityName: current.number,
      summary: `Cancelled complaint ${current.number} for ${current.customerName}`,
      changes: { before: { status: "Pending" }, after: { status: "Cancelled", reason } }, actor: me,
    });
  } else if (body.action === "reopen") {
    if (!isAdmin) return NextResponse.json({ error: "Only Super Admins and Admins can reopen" }, { status: 403 });
    if (current.status === "Pending") return NextResponse.json({ error: "Already pending" }, { status: 409 });
    const note = body.note?.trim() ?? "";
    await sql`UPDATE complaints SET status = 'Pending', completed_at = NULL, cancel_reason = '', cancelled_at = NULL WHERE id = ${id}`;
    await addComplaintEvent(id, "reopened", me.fullName, note);
    if (current.engineerId && current.engineerId !== me.id) {
      await createNotifications([current.engineerId], `Complaint ${current.number} (${current.customerName}) was reopened${note ? ` — ${note}` : ""}`, "#EF4444", complaintHref(id));
    }
    await logAction({
      module: "CRM", action: "status_change", entityType: "complaint", entityId: id, entityName: current.number,
      summary: `Reopened complaint ${current.number} for ${current.customerName}`,
      changes: { before: { status: current.status }, after: { status: "Pending", note } }, actor: me,
    });
  } else if (body.action === "edit") {
    if (!isAdmin) return NextResponse.json({ error: "Only Super Admins and Admins can edit complaints" }, { status: 403 });
    const customerName = body.customerName?.trim() ?? current.customerName;
    const remarks = body.remarks?.trim() ?? current.remarks;
    const phone = body.phone?.trim() ?? current.phone;
    const siteAddress = body.siteAddress?.trim() ?? current.siteAddress;
    let customerId = current.customerId;
    if (body.customerId !== undefined && body.customerId !== current.customerId) {
      if (body.customerId === null) customerId = null;
      else {
        const [customer] = await sql`SELECT id FROM customers WHERE id = ${body.customerId}`;
        if (!customer) return NextResponse.json({ error: "That customer no longer exists" }, { status: 400 });
        customerId = customer.id as number;
      }
    }
    if (!customerName || !remarks) return NextResponse.json({ error: "Name and remarks are required" }, { status: 400 });
    let engineer: { id: number; full_name: string } | null = null;
    if (body.engineerId !== undefined && body.engineerId !== current.engineerId) {
      const [row] = await sql`SELECT id, full_name FROM users WHERE id = ${body.engineerId} AND status = 'Active'`;
      if (!row) return NextResponse.json({ error: "Pick an active engineer" }, { status: 400 });
      engineer = { id: row.id as number, full_name: row.full_name as string };
    }
    await sql`
      UPDATE complaints SET customer_name = ${customerName}, phone = ${phone}, site_address = ${siteAddress}, customer_id = ${customerId}, remarks = ${remarks},
        engineer_id = ${engineer?.id ?? current.engineerId}
      WHERE id = ${id}
    `;
    if (engineer) {
      await addComplaintEvent(id, "assigned", me.fullName, `Reassigned from ${current.engineerName ?? "nobody"} to ${engineer.full_name}`);
      if (engineer.id !== me.id) {
        await createNotifications([engineer.id], `Complaint ${current.number} (${customerName}) assigned to you`, "#F59E0B", complaintHref(id));
      }
    }
    if (customerName !== current.customerName || phone !== current.phone || siteAddress !== current.siteAddress || customerId !== current.customerId || remarks !== current.remarks) {
      await addComplaintEvent(id, "edited", me.fullName);
    }
    await logAction({
      module: "CRM", action: "update", entityType: "complaint", entityId: id, entityName: current.number,
      summary: `Updated complaint ${current.number}${engineer ? ` — reassigned to ${engineer.full_name}` : ""}`,
      changes: {
        before: { name: current.customerName, phone: current.phone, siteAddress: current.siteAddress, remarks: current.remarks, engineer: current.engineerName },
        after: { name: customerName, phone, siteAddress, remarks, engineer: engineer?.full_name ?? current.engineerName },
      },
      actor: me,
    });
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  return NextResponse.json(await getComplaint(id));
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentAppUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!can(me.role, "manageComplaints")) return NextResponse.json({ error: "Only Super Admins and Admins can delete complaints" }, { status: 403 });
  const id = Number(params.id);
  const current = await getComplaint(id);
  if (!current) return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
  await sql`DELETE FROM complaints WHERE id = ${id}`;
  await logAction({
    module: "CRM", action: "delete", entityType: "complaint", entityId: id, entityName: current.number,
    summary: `Deleted complaint ${current.number} for ${current.customerName}`,
    changes: { before: { name: current.customerName, status: current.status, engineer: current.engineerName } }, actor: me,
  });
  return NextResponse.json({ ok: true });
}
