import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function run() {
  // 1. Create product_prices table
  await sql`
    CREATE TABLE IF NOT EXISTS product_prices (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      currency TEXT NOT NULL,
      price NUMERIC NOT NULL,
      UNIQUE (product_id, currency)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_product_prices_product_id ON product_prices(product_id)`;
  console.log("✓ product_prices table created");

  // 2. Migrate existing products.price → product_prices as INR
  const migrated = await sql`
    INSERT INTO product_prices (product_id, currency, price)
    SELECT id, 'INR', price FROM products WHERE price IS NOT NULL
    ON CONFLICT (product_id, currency) DO NOTHING
  `;
  console.log(`✓ Migrated ${migrated.length ?? "existing"} product prices to product_prices`);

  // 3. Add currency column to quotes (with default INR for existing rows)
  await sql`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'INR'`;
  console.log("✓ Added currency column to quotes");

  console.log("\nDone!");
}

run().catch((e) => { console.error(e); process.exit(1); });
