import { sql } from "@/lib/db";
import { customerCodeBase } from "@/lib/utils/customer";
import type { Customer } from "@/types";

export function toCustomer(row: Record<string, unknown>): Customer {
  return {
    id: row.id as number,
    name: row.name as string,
    prefix: (row.prefix as string) ?? "",
    firstName: ((row.first_name as string) || (row.name as string)) ?? "",
    surname: (row.surname as string) ?? "",
    customerCode: (row.customer_code as string) ?? "",
    segment: row.segment as Customer["segment"],
    contactName: row.contact_name as string,
    email: row.email as string,
    phone: row.phone as string,
    architect: (row.architect as string) ?? "",
    gstNo: (row.gst_no as string) ?? "",
    address: row.address as string,
    city: (row.city as string) ?? "",
    state: (row.state as string) ?? "",
    postcode: (row.postcode as string) ?? "",
    birthday: (row.birthday as string) ?? "",
    notes: row.notes as string,
    createdAt: row.created_at as string,
  };
}

/** First free code for this name: RAVE, then RAVE2, RAVE3… */
export async function nextCustomerCode(firstName: string, surname: string): Promise<string> {
  const base = customerCodeBase(firstName, surname);
  const rows = await sql`SELECT customer_code FROM customers WHERE customer_code LIKE ${base + "%"}`;
  const taken = new Set(rows.map((r) => r.customer_code as string));
  let code = base;
  for (let n = 2; taken.has(code); n++) code = `${base}${n}`;
  return code;
}
