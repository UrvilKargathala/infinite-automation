import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS ticket_alerts BOOLEAN NOT NULL DEFAULT true`;
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS quote_alerts BOOLEAN NOT NULL DEFAULT false`;

await sql`
  CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#3A90C3',
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;
await sql`CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created ON notifications(user_id, created_at DESC)`;

console.log("done");
