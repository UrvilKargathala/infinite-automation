import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// Complaints: a Cancelled status (with the reason), an optional link to a Customers record, and a site address.
await sql`ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_status_check`;
await sql`ALTER TABLE complaints ADD CONSTRAINT complaints_status_check CHECK (status IN ('Pending', 'Completed', 'Cancelled'))`;
await sql`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS cancel_reason TEXT NOT NULL DEFAULT ''`;
await sql`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ`;
await sql`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL`;
await sql`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS site_address TEXT NOT NULL DEFAULT ''`;

await sql`ALTER TABLE complaint_events DROP CONSTRAINT IF EXISTS complaint_events_kind_check`;
await sql`ALTER TABLE complaint_events ADD CONSTRAINT complaint_events_kind_check CHECK (kind IN ('created', 'assigned', 'edited', 'completed', 'reopened', 'cancelled'))`;

console.log("✓ complaints: Cancelled status, cancel_reason, cancelled_at, customer_id, site_address ready");
