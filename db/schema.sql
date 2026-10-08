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
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  physical_stock INTEGER NOT NULL DEFAULT 0 CHECK (physical_stock >= 0),
  min_buffer INTEGER NOT NULL DEFAULT 0 CHECK (min_buffer >= 0)
);

CREATE TABLE IF NOT EXISTS product_prices (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  price NUMERIC NOT NULL,
  UNIQUE (product_id, currency)
);

CREATE INDEX IF NOT EXISTS idx_product_prices_product_id ON product_prices(product_id);

CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  segment TEXT NOT NULL CHECK (segment IN ('Residential', 'Hospitality', 'Government / Council', 'Retail', 'Healthcare / Aged Care', 'Industrial')),
  contact_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  subject TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('Installation', 'Repair', 'Maintenance', 'General')),
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  status TEXT NOT NULL CHECK (status IN ('Open', 'In Progress', 'On Hold', 'Resolved', 'Closed')),
  assigned TEXT NOT NULL DEFAULT '',
  last_contact DATE
);

CREATE TABLE IF NOT EXISTS quotes (
  id SERIAL PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  client_id INTEGER REFERENCES tickets(id) ON DELETE SET NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  client TEXT NOT NULL,
  date DATE NOT NULL,
  valid_until DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Accepted', 'Rejected')),
  currency TEXT NOT NULL DEFAULT 'INR'
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
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  ticket_alerts BOOLEAN NOT NULL DEFAULT true,
  quote_alerts BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3A90C3',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created ON notifications(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-ticket conversation thread: messages with reply/forward/soft-delete
CREATE TABLE IF NOT EXISTS ticket_messages (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL DEFAULT '',
  attachments JSONB NOT NULL DEFAULT '[]',
  reply_to_id INTEGER REFERENCES ticket_messages(id) ON DELETE SET NULL,
  is_forwarded BOOLEAN NOT NULL DEFAULT false,
  deleted BOOLEAN NOT NULL DEFAULT false,
  edited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  site_address TEXT NOT NULL DEFAULT '',
  assigned TEXT NOT NULL DEFAULT '',
  architect TEXT NOT NULL DEFAULT '',
  quote_id INTEGER REFERENCES quotes(id) ON DELETE SET NULL,
  notes TEXT NOT NULL DEFAULT '',
  stage TEXT NOT NULL DEFAULT 'Inquiry' CHECK (stage IN (
    'Inquiry', 'Design', 'Quotation', 'Measurement', 'Marking', 'Production',
    'Material Requirement', 'Ready to Dispatch', 'Installation', 'Completed', 'Cancelled'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_stage_change TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ
);

-- Timestamped log of every stage transition, for the Projects detail drawer's history list
CREATE TABLE IF NOT EXISTS project_stage_events (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quote_sections_quote_id ON quote_sections(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_section_id ON quote_items(section_id);
CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
-- Per-project conversation thread: messages with reply/forward/soft-delete, same shape as ticket_messages
CREATE TABLE IF NOT EXISTS project_messages (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL DEFAULT '',
  attachments JSONB NOT NULL DEFAULT '[]',
  reply_to_id INTEGER REFERENCES project_messages(id) ON DELETE SET NULL,
  is_forwarded BOOLEAN NOT NULL DEFAULT false,
  deleted BOOLEAN NOT NULL DEFAULT false,
  edited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_stage_events_project_id ON project_stage_events(project_id);
CREATE INDEX IF NOT EXISTS idx_project_messages_project_id ON project_messages(project_id);

-- Append-only activity trail across every module. No UPDATE/DELETE is ever written for this table.
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  module TEXT NOT NULL CHECK (module IN ('Master', 'CRM', 'Quote', 'Projects', 'User Management', 'Auth', 'Inventory')),
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'import', 'export', 'status_change', 'stage_change', 'login', 'logout', 'role_change')),
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  entity_name TEXT,
  summary TEXT NOT NULL,
  changes JSONB,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_module_timestamp ON audit_logs (module, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs (user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp DESC);

-- Inventory & Procurement (see db/migrate-inventory.mjs)
CREATE TABLE IF NOT EXISTS inventory_allocations (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  qty INTEGER NOT NULL CHECK (qty > 0),
  shipped_qty INTEGER NOT NULL DEFAULT 0 CHECK (shipped_qty >= 0 AND shipped_qty <= qty),
  status TEXT NOT NULL DEFAULT 'Reserved' CHECK (status IN ('Reserved', 'Shipped', 'Released')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_inventory_allocations_reserved ON inventory_allocations(product_id) WHERE status = 'Reserved';

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
);

CREATE TABLE IF NOT EXISTS vendor_po_items (
  id SERIAL PRIMARY KEY,
  po_id INTEGER NOT NULL REFERENCES vendor_pos(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  qty_ordered INTEGER NOT NULL CHECK (qty_ordered > 0),
  qty_received INTEGER NOT NULL DEFAULT 0 CHECK (qty_received >= 0),
  unit_cost NUMERIC CHECK (unit_cost >= 0),
  UNIQUE (po_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_vendor_po_items_product_id ON vendor_po_items(product_id);

-- Append-only stock ledger: every change to products.physical_stock writes one row.
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
);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_created ON stock_movements(product_id, created_at DESC);
