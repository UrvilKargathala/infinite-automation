import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// Each user's working currency (Settings → Currency). Drives their dashboard, product prices,
// and the currency of new quotes / vendor POs they create. Existing records keep their own currency.
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'INR'`;

console.log("✓ users.currency added (default INR)");
