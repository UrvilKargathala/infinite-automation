import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// When each user last read each ticket's chat — drives the unread badges on ticket cards (same idea as project_message_reads).
await sql`
  CREATE TABLE IF NOT EXISTS ticket_message_reads (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, ticket_id)
  )
`;
console.log("✓ ticket_message_reads ready");
