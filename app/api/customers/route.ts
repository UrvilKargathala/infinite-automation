import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentAppUser } from "@/lib/currentAppUser";
import { logAction } from "@/lib/api/audit";
import { toCustomer, nextCustomerCode } from "@/lib/customersDb";
import { customerFullName } from "@/lib/utils/customer";
import type { CustomerInput } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await sql`SELECT * FROM customers ORDER BY name`;
  return NextResponse.json(rows.map(toCustomer));
}

export async function POST(req: Request) {
  const me = await getCurrentAppUser();
  const body = (await req.json()) as CustomerInput;
  // Quick-add callers send only `name`; the full form sends firstName + surname.
  const firstName = (body.firstName ?? body.name ?? "").trim();
  const surname = (body.surname ?? "").trim();
  if (!firstName) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const name = customerFullName(firstName, surname);
  const code = await nextCustomerCode(firstName, surname);

  const rows = await sql`
    INSERT INTO customers (name, prefix, first_name, surname, customer_code, segment, contact_name, email, phone,
      architect, gst_no, address, city, state, postcode, birthday, notes)
    VALUES (${name}, ${body.prefix ?? ""}, ${firstName}, ${surname}, ${code}, ${body.segment}, ${body.contactName ?? ""},
      ${body.email ?? ""}, ${body.phone ?? ""}, ${body.architect ?? ""}, ${body.gstNo ?? ""}, ${body.address ?? ""},
      ${body.city ?? ""}, ${body.state ?? ""}, ${body.postcode ?? ""}, ${body.birthday ?? ""}, ${body.notes ?? ""})
    RETURNING *
  `;
  const created = toCustomer(rows[0]);

  if (me) {
    await logAction({
      module: "CRM",
      action: "create",
      entityType: "customer",
      entityId: created.id,
      entityName: created.name,
      summary: `Added customer ${created.name} (${created.customerCode}, ${created.segment})`,
      changes: { after: { name: created.name, code: created.customerCode, segment: created.segment, email: created.email, phone: created.phone, gstNo: created.gstNo, city: created.city } },
      actor: me,
    });
  }

  return NextResponse.json(created, { status: 201 });
}
