import { sql } from "@/lib/db";
import type { Complaint, ComplaintEvent } from "@/types";

export function toComplaint(r: Record<string, unknown>): Complaint {
  return {
    id: r.id as number,
    number: (r.number as string) ?? "",
    customerName: r.customer_name as string,
    phone: r.phone as string,
    remarks: r.remarks as string,
    engineerId: (r.engineer_id as number) ?? null,
    engineerName: (r.engineer_name as string) ?? null,
    status: r.status as Complaint["status"],
    resolution: r.resolution as string,
    createdById: (r.created_by as number) ?? null,
    createdByName: (r.created_by_name as string) ?? null,
    createdAt: r.created_at as string,
    completedAt: (r.completed_at as string) ?? null,
  };
}

export async function getComplaint(id: number): Promise<Complaint | null> {
  const rows = await sql`
    SELECT c.*, c.created_at::text AS created_at, c.completed_at::text AS completed_at,
           e.full_name AS engineer_name, cb.full_name AS created_by_name
    FROM complaints c
    LEFT JOIN users e ON e.id = c.engineer_id
    LEFT JOIN users cb ON cb.id = c.created_by
    WHERE c.id = ${id}
  `;
  return rows.length ? toComplaint(rows[0]) : null;
}

export async function addComplaintEvent(complaintId: number, kind: ComplaintEvent["kind"], userName: string, note = ""): Promise<void> {
  await sql`INSERT INTO complaint_events (complaint_id, kind, note, user_name) VALUES (${complaintId}, ${kind}, ${note}, ${userName})`;
}

/** Link a notification opens: the Complaints tab with this complaint's panel open. */
export const complaintHref = (id: number) => `/complaints?open=${id}`;
