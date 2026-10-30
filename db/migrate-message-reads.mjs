import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// When each user last read each CRM record's chat — drives the unread badges on CRM cards.
await sql`
  CREATE TABLE IF NOT EXISTS project_message_reads (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, project_id)
  )
`;
console.log("✓ project_message_reads ready");
