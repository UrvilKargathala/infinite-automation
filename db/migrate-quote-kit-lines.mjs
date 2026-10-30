import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// Kits in quotes: a kit is one quote line (product_id NULL) carrying a snapshot of its components, so later
// edits to the kit never change a quote that was already sent. Stock reservation and reorder demand expand
// kit lines into components × line qty.
await sql`ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS kit_id INTEGER REFERENCES kits(id) ON DELETE SET NULL`;
await sql`ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS kit_sku TEXT`;
await sql`ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS kit_components JSONB`;
console.log("✓ quote_items kit columns ready");
