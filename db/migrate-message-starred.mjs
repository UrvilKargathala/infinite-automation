import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// CRM chat: star important messages; the star button in the chat filters to them. Shared by everyone on the record.
await sql`ALTER TABLE project_messages ADD COLUMN IF NOT EXISTS starred BOOLEAN NOT NULL DEFAULT false`;
console.log("✓ project_messages.starred added");
