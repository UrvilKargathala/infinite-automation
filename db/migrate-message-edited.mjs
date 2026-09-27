import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

await sql`ALTER TABLE ticket_messages ADD COLUMN IF NOT EXISTS edited BOOLEAN NOT NULL DEFAULT false`;
await sql`ALTER TABLE project_messages ADD COLUMN IF NOT EXISTS edited BOOLEAN NOT NULL DEFAULT false`;

console.log("done");
