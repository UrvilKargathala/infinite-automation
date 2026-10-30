import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// Master File → Kits: a named group of Master File products with quantities. Kits hold no stock of their own;
// price = sum of component prices (per currency) minus the kit's discount %.
await sql`
  CREATE TABLE IF NOT EXISTS kits (
    id SERIAL PRIMARY KEY,
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    discount_pct NUMERIC NOT NULL DEFAULT 0 CHECK (discount_pct >= 0 AND discount_pct <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;
// RESTRICT: a product can't be deleted while a kit uses it (the API names the kit).
await sql`
  CREATE TABLE IF NOT EXISTS kit_items (
    kit_id INTEGER NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    qty INTEGER NOT NULL CHECK (qty > 0),
    position INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (kit_id, product_id)
  )
`;
await sql`CREATE INDEX IF NOT EXISTS idx_kit_items_product ON kit_items(product_id)`;
console.log("✓ kits + kit_items ready");
