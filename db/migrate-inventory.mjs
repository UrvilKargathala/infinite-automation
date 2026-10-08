// Inventory & Procurement: stock columns, reservations, vendor POs, stock ledger.
// Run:      node --env-file=.env.local db/migrate-inventory.mjs
// Dry run:  DRY_RUN=1 node --env-file=.env.local db/migrate-inventory.mjs   (applies, then rolls back)
import { Pool } from "@neondatabase/serverless";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

try {
  await client.query("BEGIN");

  await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS physical_stock INTEGER NOT NULL DEFAULT 0 CHECK (physical_stock >= 0)`);
  await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS min_buffer INTEGER NOT NULL DEFAULT 0 CHECK (min_buffer >= 0)`);
  await client.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ`);

  // One row per (confirmed project, product). Outstanding reserved units = qty - shipped_qty while status = 'Reserved'.
  await client.query(`
    CREATE TABLE IF NOT EXISTS inventory_allocations (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      qty INTEGER NOT NULL CHECK (qty > 0),
      shipped_qty INTEGER NOT NULL DEFAULT 0 CHECK (shipped_qty >= 0 AND shipped_qty <= qty),
      status TEXT NOT NULL DEFAULT 'Reserved' CHECK (status IN ('Reserved', 'Shipped', 'Released')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (project_id, product_id)
    )
  `);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_inventory_allocations_reserved ON inventory_allocations(product_id) WHERE status = 'Reserved'`);

  await client.query(`
    CREATE TABLE IF NOT EXISTS vendor_pos (
      id SERIAL PRIMARY KEY,
      number TEXT NOT NULL UNIQUE,
      brand TEXT NOT NULL,
      vendor_name TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Issued', 'Partially Received', 'Received', 'Cancelled')),
      currency TEXT NOT NULL DEFAULT 'INR',
      notes TEXT NOT NULL DEFAULT '',
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      issued_at TIMESTAMPTZ
    )
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS vendor_po_items (
      id SERIAL PRIMARY KEY,
      po_id INTEGER NOT NULL REFERENCES vendor_pos(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      qty_ordered INTEGER NOT NULL CHECK (qty_ordered > 0),
      qty_received INTEGER NOT NULL DEFAULT 0 CHECK (qty_received >= 0),
      unit_cost NUMERIC CHECK (unit_cost >= 0),
      UNIQUE (po_id, product_id)
    )
  `);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_vendor_po_items_product_id ON vendor_po_items(product_id)`);

  // Append-only ledger: every change to physical_stock writes one row here.
  await client.query(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      delta INTEGER NOT NULL CHECK (delta <> 0),
      reason TEXT NOT NULL CHECK (reason IN ('GRN', 'SHIP', 'ADJUST')),
      note TEXT NOT NULL DEFAULT '',
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      po_id INTEGER REFERENCES vendor_pos(id) ON DELETE SET NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_stock_movements_product_created ON stock_movements(product_id, created_at DESC)`);

  // Audit log gains the "Inventory" module.
  await client.query(`ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_module_check`);
  await client.query(`ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_module_check CHECK (module IN ('Master', 'CRM', 'Quote', 'Projects', 'User Management', 'Auth', 'Inventory'))`);

  if (process.env.DRY_RUN) {
    await client.query("ROLLBACK");
    console.log("dry run OK — rolled back, nothing changed");
  } else {
    await client.query("COMMIT");
    console.log("done");
  }
} catch (err) {
  await client.query("ROLLBACK");
  throw err;
} finally {
  client.release();
  await pool.end();
}
