import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// Add Customer form fields. customers.name stays the full display name (first name + surname)
// so quotes, CRM and search keep working unchanged.
for (const col of ["prefix", "first_name", "surname", "customer_code", "gst_no", "architect", "city", "state", "postcode", "birthday"]) {
  await sql.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS ${col} TEXT NOT NULL DEFAULT ''`);
}
console.log("✓ customer columns added");

// Existing customers: their whole name becomes the first name, and each gets a code.
await sql`UPDATE customers SET first_name = name WHERE first_name = ''`;

const letters = (s) => s.replace(/[^A-Za-z]/g, "").toUpperCase();
const base = (first, surname) => {
  const a = letters(first), b = letters(surname);
  return (b ? a.slice(0, 2) + b.slice(0, 2) : a.slice(0, 4)) || "CUST";
};
const rows = await sql`SELECT id, first_name, surname, customer_code FROM customers ORDER BY id`;
const taken = new Set(rows.map((r) => r.customer_code).filter(Boolean));
let coded = 0;
for (const r of rows) {
  if (r.customer_code) continue;
  const b = base(r.first_name, r.surname);
  let code = b;
  for (let n = 2; taken.has(code); n++) code = `${b}${n}`;
  taken.add(code);
  await sql`UPDATE customers SET customer_code = ${code} WHERE id = ${r.id}`;
  coded++;
}
console.log(`✓ ${coded} existing customer(s) given a code`);
