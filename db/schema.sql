-- Infinite Automation Dashboard — Phase 6 schema (Neon Postgres)

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL DEFAULT '',
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  hsn TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive'))
);

CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  segment TEXT NOT NULL CHECK (segment IN ('Residential', 'Commercial', 'Short Term Rentals', 'Agriculture')),
  stage TEXT NOT NULL CHECK (stage IN ('New', 'Qualified', 'Quoted', 'Won', 'Lost')),
  value NUMERIC NOT NULL DEFAULT 0,
  assigned TEXT NOT NULL DEFAULT '',
  last_contact DATE
);

CREATE TABLE IF NOT EXISTS quotes (
  id SERIAL PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  client_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
  client TEXT NOT NULL,
  date DATE NOT NULL,
  valid_until DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Accepted', 'Rejected'))
);

CREATE TABLE IF NOT EXISTS quote_sections (
  id TEXT PRIMARY KEY,
  quote_id INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS quote_items (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL REFERENCES quote_sections(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  brand TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  qty INTEGER NOT NULL DEFAULT 1,
  price NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  clerk_user_id TEXT UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('Super Admin', 'Admin', 'Staff')),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive'))
);

CREATE INDEX IF NOT EXISTS idx_quote_sections_quote_id ON quote_sections(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_section_id ON quote_items(section_id);
CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON quotes(client_id);
