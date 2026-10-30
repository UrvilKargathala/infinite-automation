import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// The "Staff" role is renamed to "Purchase" (same permissions for now). Roles: Super Admin, Admin, Purchase.
await sql`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`;
const moved = await sql`UPDATE users SET role = 'Purchase' WHERE role = 'Staff' RETURNING id`;
await sql`ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('Super Admin', 'Admin', 'Purchase'))`;

console.log(`✓ Staff → Purchase (${moved.length} user(s) moved); role check is now Super Admin / Admin / Purchase`);
