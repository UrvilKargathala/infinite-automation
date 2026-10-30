import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// CRM → Complaints: raised by Super Admin / Admin, assigned to one engineer, Pending → Completed (and reopen).
await sql`
  CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    number TEXT UNIQUE,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    remarks TEXT NOT NULL DEFAULT '',
    engineer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed')),
    resolution TEXT NOT NULL DEFAULT '',
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
  )
`;
await sql`CREATE INDEX IF NOT EXISTS idx_complaints_engineer ON complaints(engineer_id, status)`;

// Every step of a complaint's life, shown as its history.
await sql`
  CREATE TABLE IF NOT EXISTS complaint_events (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('created', 'assigned', 'edited', 'completed', 'reopened')),
    note TEXT NOT NULL DEFAULT '',
    user_name TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;
await sql`CREATE INDEX IF NOT EXISTS idx_complaint_events_complaint ON complaint_events(complaint_id, created_at)`;

// Notifications can now link to the thing they're about (e.g. /complaints?open=12).
await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS href TEXT NOT NULL DEFAULT ''`;

console.log("✓ complaints, complaint_events, notifications.href ready");
