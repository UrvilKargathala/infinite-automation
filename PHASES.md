# Claude Code phase prompts — Infinite Automation Dashboard

Seven standalone prompts. Save `CLAUDE.md` and `DESIGN_SYSTEM.md` at the project root first, then paste each phase into Claude Code one at a time. Wait for one phase to finish and run cleanly before moving to the next.

---

## PHASE 1 — Project setup + Top nav layout shell

```
Create a new Next.js 14 project (App Router) with TypeScript and Tailwind CSS for an internal dashboard called "Infinite Automation Dashboard".

Read CLAUDE.md and DESIGN_SYSTEM.md at the project root before doing anything else. Every design decision, color, font weight, radius, shadow, and spacing rule comes from those two files. Do not invent your own tokens.

Setup work:
1. Initialize Next.js 14 with TypeScript, Tailwind, App Router, ESLint. Routes under /app directly.
2. Load Barlow font via next/font/google with weights 300 and 400 only. Wire the CSS variable --font-barlow through the html tag and set it as the default sans font in tailwind.config.ts.
3. Extend tailwind.config.ts EXACTLY as specified in DESIGN_SYSTEM.md — brand colors, surface, border, text, semantic colors, brand-gradient backgroundImage entries, AND the custom boxShadow tokens (card, cardHover, modal, dropdown, iconBtn, drag). The custom shadow tokens are critical because cards have no borders and rely on shadows to separate from the white background.
4. Set globals.css exactly as shown in DESIGN_SYSTEM.md (Barlow font-family, weight 400, white background, primary text color).
5. Install: lucide-react.
6. Set /dashboard as the default landing route via a redirect from /.

Build ONLY the layout shell in this phase. The visual target is premium, airy SaaS — think Linear or a polished CRM. Pure white page background, borderless cards floating with soft shadows, generous whitespace, top horizontal nav (NO left sidebar).

1. TopNav component in /components/layout/TopNav.tsx:
   - Sticky top, 72px tall, white background, shadow-card (subtle bottom lift), full-width.
   - Inner container: `max-w-[1600px] mx-auto px-8 h-full flex items-center justify-between`.
   - LEFT — Logo group:
       - 36x36 rounded-xl square with diagonal brand gradient bg (bg-brand-gradient-diag), white "IA" centered (Barlow, weight 400, ~18px).
       - Beside it: wordmark "Infinite Automation" text-base weight 400 text-primary, single line.
   - CENTER — Nav items in a horizontal row (flex items-center gap-1):
       - Five items in order: Dashboard, CRM, Quote, Master File, Users.
       - Each item is a Link: `px-4 py-2 rounded-full text-sm` weight 400.
       - Inactive: text-secondary, hover bg #F9FAFB, hover text text-primary.
       - Active: `bg-gradient-to-r from-brand-blue to-brand-green text-white`. The pill is the brand accent.
       - Use Next.js usePathname to determine active state.
   - RIGHT — Action strip (flex items-center gap-2):
       - Search circular icon button (Search icon).
       - Notifications circular icon button (Bell icon) with a small solid brand-blue dot indicator top-right (8x8 rounded-full with 1px white ring).
       - User avatar button — 36x36 rounded-full, solid brand blue bg, white initials "UR", text-xs weight 400. Clicking toggles the UserMenu.

2. IconButton primitive in /components/ui/IconButton.tsx:
   - 40x40 rounded-full, bg-white, border border-border, shadow-iconBtn.
   - Icon centered, 18px, text-secondary.
   - Hover: bg #F9FAFB, icon text-primary.
   - Active/pressed state: bg-brand-gradient-tint, icon brand-blue.
   - Props: icon (lucide component), onClick, ariaLabel, indicator (boolean for the notification dot).

3. UserMenu component in /components/layout/UserMenu.tsx:
   - Positioned absolute below the avatar (mt-2 right-0), width 260px, rounded-2xl bg-white shadow-dropdown p-2 z-50.
   - Top block (px-3 py-3, border-b border-border, mb-2):
       - 40px Avatar + name "Urvil" (text-sm weight 400) with email "urvil@infiniteautomation.com" (text-xs text-muted) below.
       - Below the name row (mt-2): a RoleBadge showing "Super Admin" (purple, rounded-full pill style).
   - Menu items (each: px-3 py-2 rounded-lg text-sm text-primary hover:bg-[#F9FAFB] flex items-center gap-2):
       - "Profile" (User icon)
       - "Settings" (Settings icon)
       - Divider (my-2 border-t border-border)
       - "Sign out" (LogOut icon, text-danger)
   - Close on outside click and Escape.

4. Avatar primitive in /components/ui/Avatar.tsx:
   - Sizes: xs (24), sm (32), md (40), lg (48), xl (64). All rounded-full.
   - Solid brand-blue bg by default with white initials derived from a name string via /lib/utils/initials.ts (max 2 chars, uppercase).

5. RoleBadge primitive in /components/users/RoleBadge.tsx:
   - Small rounded-full pill: `inline-flex items-center px-2.5 py-1 rounded-full text-xs`.
   - Colors per DESIGN_SYSTEM.md: Super Admin purple (#8B5CF6), Admin brand blue (#3A90C3), Staff slate (#64748B).
   - Style: bg = color + "18" (opacity ~10%), text = solid color.

6. Root layout (app/layout.tsx):
   - Renders TopNav at the top, then main content: `<main class="max-w-[1600px] mx-auto px-8 py-8">{children}</main>`.
   - Body has font-family Barlow (via the CSS variable), font-weight 400, bg white, text-primary color.

7. Five route pages, each rendering a page-title block (text-3xl font-light text-primary + text-sm text-secondary subtitle underneath) and one centered "Coming soon" placeholder card (bg-white rounded-2xl shadow-card p-12 text-center text-text-secondary):
   - /dashboard  — title "Dashboard", subtitle "Overview of operations, pipeline and performance"
   - /crm        — title "CRM", subtitle "Lead pipeline — drag cards between stages"
   - /quote      — title "Quotes", subtitle "Create, send and track pricing quotes"
   - /master     — title "Master File", subtitle "Product catalog and master data"
   - /users      — title "User Management", subtitle "Manage users and role-based access"

Extract additional ui primitives now, though they'll be filled in later phases: Button, Input, Select, Modal, Card, Badge. Keep them minimal.

Deliverable: working project via `npm run dev`, showing the top nav with brand-gradient pill active state, five routes navigable, no left sidebar, cards floating with soft shadows on a pure white background, Barlow font loading correctly. No console errors.
```

---

## PHASE 2 — Master File module (products with Brand)

```
Extend the existing Infinite Automation Dashboard by building the /master route.

Re-read CLAUDE.md and DESIGN_SYSTEM.md before starting. Follow every token exactly. All new components go under /components/master or /components/ui.

Additionally install: xlsx, zustand, uuid, @types/uuid.

Create the products Zustand store at /lib/store/useProductStore.ts:
- State: products (array of Product).
- Actions: add(product), update(id, patch), remove(id), bulkAdd(products), setAll(products).
- Derived selectors: brands() -> unique sorted brand list; categoriesByBrand(brand) -> unique sorted category list under that brand; productsByBrandCategory(brand, category) -> active products.
- Seed with 30 sample products spread across these brands (invent realistic names / SKUs / prices; leave some prices null to show the "Not set" state). NOTE the brand naming rule in CLAUDE.md — no "Unifi " prefix anywhere:
    Infinite AUS         -> categories: Light Controller, Garage Door Controller, AC Controller, Curtain Controller, Infrared Controller
    Automation Products  -> categories: Cables, Relays, Connectors
    Electrical Product   -> categories: Locks, Light, Driver
    Wifi                 -> categories: Access Point
    Camera               -> categories: Turret, Dome, Bullet, AI Camera
    Video Door Phone     -> categories: Reader, Intercom, Access Control
    Sensors & Alarms     -> categories: Sensor, Alarm Hub
    Advance Hosting      -> categories: Gateway, Cloud Key
    Managed VoIP         -> categories: Handset, Touch Phone

Add the Product type to /types/index.ts:
- id: number
- name: string
- sku: string
- brand: string
- category: string
- hsn: string
- price: number | null
- status: "Active" | "Inactive"

Build the /master page:

1. Four stat cards in a 4-column grid at the top (each card: bg-white rounded-2xl shadow-card p-5, NO border):
   - "Total products" — total count, text-3xl font-light.
   - "Active" — count of Active, number in success green.
   - "Brands" — count of unique brands.
   - "Missing price" — count with null price, number in warning amber.
   Each card has an IconTile on the right (Package, CheckCircle, Layers, AlertCircle icons respectively) with the default gradient-tint bg and brand-blue icon.

2. Main table card (bg-white rounded-2xl shadow-card, overflow-hidden, no border):
   - Toolbar row inside the card (p-4 border-b border-border flex items-center gap-3 flex-wrap):
       - Search input with leading Search icon (w-64, rounded-lg).
       - Brand select (All + unique brands).
       - Category select (All + categories filtered by chosen brand; disabled when brand is All; resets when brand changes).
       - Spacer (ml-auto).
       - "Import Excel" secondary button (Upload icon).
       - "Export" secondary button (Download icon).
       - "Add product" primary gradient button (Plus icon).
   - Table columns: Sr., Product name, SKU (mono font, brand-blue, text-xs), Brand, Category, HSN Code (mono text-xs text-secondary), Price (INR) (formatINR, "Not set" in warning when null), Status badge (rounded-full pill), Actions (Edit + Delete IconButton-style small buttons, right-aligned).
   - Empty state row (colspan all): centered "No products found" in text-muted, py-12.
   - Footer strip (px-4 py-3 border-t border-border): "Showing X of Y products" in text-xs text-muted.

3. Add/Edit product modal (max-w-2xl):
   - Header: title "Add product" or "Edit product", close IconButton on right.
   - Body: 2-column grid gap-4:
       Product name (full width)
       SKU
       Brand (select — must be picked before Category; lists all existing brands + "+ Add new brand" option that swaps the select for a text input with a small "back to list" affordance)
       Category (select — options filtered by chosen brand; supports the same "+ Add new category" pattern)
       HSN Code
       Price INR (number input, blank allowed, placeholder "Leave blank if unknown")
       Status (Active/Inactive select, full width)
   - Save button disabled until Brand and Category are set (visual: opacity 50, cursor-not-allowed).
   - Footer: Cancel (secondary) + Save (primary gradient), right-aligned.

4. Excel import (button triggers hidden file input, accept .xlsx,.xls,.csv):
   - Parse with xlsx.
   - Column mapping from source columns (case- and trailing-space-tolerant):
       "Product Name" -> name
       "SKU" -> sku
       "Product Group/Brand" -> brand (normalized, see below)
       "Product Category" (with/without trailing space) -> category
       "Hsn Code" or "HSN Code" -> hsn
       "Price ( INR )" / "Price (INR)" / "Price" -> price (parse to number, null if empty)
   - Brand normalization (apply to every row on import — this is the brand naming rule in CLAUDE.md):
       1. Trim leading/trailing whitespace.
       2. If the value starts with "Unifi " (case-insensitive), strip that prefix.
       3. Fix known source typos: "Alarams" -> "Alarms".
       Example: "Unifi Wifi" -> "Wifi", "Unifi Sensors & Alarams" -> "Sensors & Alarms", "Unifi Video Door Phone " -> "Video Door Phone".
   - Default status "Active".
   - Skip rows with no name or no brand.
   - Append via store.bulkAdd; alert user with count imported.

5. Excel export: workbook with headers "Sr. No", "Product Name", "SKU", "Brand", "Product Category", "HSN Code", "Price (INR)", "Status". Download as `infinite_products_export.xlsx`.

6. Delete: browser confirm before removing.

Add /lib/utils/format.ts exporting formatINR(n) and /lib/utils/initials.ts (created in Phase 1).
```

---

## PHASE 3 — CRM Kanban module

```
Extend the existing Infinite Automation Dashboard by building the /crm route as a KANBAN BOARD (not a table).

Re-read CLAUDE.md and DESIGN_SYSTEM.md before starting. Special attention to "Kanban board", "Avatar stack", and "LeadCard" specs in DESIGN_SYSTEM.md.

Additionally install: @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities.

Create the leads Zustand store at /lib/store/useLeadStore.ts:
- State: leads (array of Lead).
- Actions: add(lead), update(id, patch), remove(id), setAll(leads), moveStage(id, newStage).
- Seed with 14 realistic leads mixing Indian and Australian names, distributed across all 4 segments and all 5 stages. Realistic INR deal sizes per the CLAUDE.md business context. Sales team names from the pool: Priya, Arjun, Neha, Rohan, Sam. Ensure each salesperson has at least 2 leads so the AssigneeStack looks populated.

Add Lead type to /types/index.ts:
- id: number
- name: string
- company: string
- segment: "Residential" | "Commercial" | "Short Term Rentals" | "Agriculture"
- stage: "New" | "Qualified" | "Quoted" | "Won" | "Lost"
- value: number (INR)
- assigned: string
- email: string
- phone: string
- lastContact: string (YYYY-MM-DD)

Stage colors (for column-header dot and card badges):
- New: #3B82F6 (info)
- Qualified: #F59E0B (warning)
- Quoted: #8B5CF6 (purple)
- Won: #10B981 (success)
- Lost: #EF4444 (danger)

Build /crm:

1. FOUR segment summary cards at the very top (grid-cols-4 gap-4, mb-6). Each card is bg-white rounded-2xl shadow-card p-5, NO border. Content:
   - Segment name (text-xs uppercase tracking-wider text-muted)
   - Lead count (text-3xl font-light mt-1)
   - Total pipeline value (text-xs text-secondary mt-1, formatINR)
   - IconTile on the right (44x44 rounded-xl):
       Residential: Home
       Commercial: Building2
       Short Term Rentals: Hotel
       Agriculture: Sprout

2. KANBAN BOARD wrapper card (bg-white rounded-2xl shadow-card p-6):

   Board header row (flex justify-between mb-6):
   - LEFT: "Lead Pipeline" title (text-lg weight 400) with total lead count in text-xs text-muted underneath.
   - CENTER: AssigneeStack component (see below).
   - RIGHT: three circular buttons in a row:
       - Add (Plus icon) — this one is styled as a "primary circular" — bg-gradient-to-r from-brand-blue to-brand-green, icon white, shadow-iconBtn.
       - Export (Download icon) — standard IconButton.
       - Filter (SlidersHorizontal icon) — standard IconButton.

   AssigneeStack component (/components/crm/AssigneeStack.tsx):
   - Horizontal row of overlapping Avatars (sm size, 32px), each with ring-2 ring-white for the overlap and -ml-2 from the second onward.
   - Below each avatar (or as a small badge overlapping the bottom-right of the avatar): a rounded-full count pill (min-width 20px, text-[10px] weight 400, white text, colored bg — use brand-blue #3A90C3 for the badge color).
   - Clicking an avatar filters the board to that assignee (toggle). Selected avatar gets ring-2 ring-brand-blue and stays highlighted; others dim to opacity 60.
   - If more than 6 salespeople, collapse extras into a final "+N" tile with bg-surface-alt text-secondary.
   - Above the stack: tiny label "Team" (text-[10px] uppercase tracking-wider text-muted).

   Toolbar row above the columns (flex items-center gap-3 mb-4):
   - Search input (w-64) that filters leads across all columns by name / company / email.
   - Segment select (All + 4 segments).
   - "New lead" primary gradient button on the right (ml-auto).

   Columns row (flex gap-4 overflow-x-auto pb-2):
   - Five columns in order: New, Qualified, Quoted, Won, Lost. Follow the "Kanban board" column spec in DESIGN_SYSTEM.md exactly (w-80, min-h-[560px], bg #F9FAFB, rounded-2xl, p-3).
   - Column header per spec (dot + name + count pill on left; ghost Plus button on right that opens the New Lead modal with this column's stage preselected).
   - Cards follow the LeadCard spec in DESIGN_SYSTEM.md exactly.
   - Empty column state: dashed border placeholder inside the column body, "Drop leads here" text-xs text-muted, py-8 text-center.

3. Drag and drop with @dnd-kit:
   - Cards draggable across columns using DndContext + useDroppable per column + useDraggable per card.
   - Drop over a column: highlight per spec (bg brand.blueTint + inset dashed border-brand-blue).
   - On drop: call useLeadStore.moveStage(leadId, targetStage).
   - Card being dragged: shadow-drag, scale-[1.02], opacity 95%.
   - No intra-column reordering.

4. Add/Edit lead modal (max-w-2xl, 2-column grid inside):
   - Fields: Name, Company, Email, Phone, Segment select, Stage select, Value INR (number), Assigned to select (populated from the seed list of salespeople + "Add new" option), Last contact (date input, full width).
   - Cancel + Save (primary gradient) footer.

5. Clicking anywhere on a LeadCard (except during a drag) opens it in the Edit modal. Delete lives inside the Edit modal via a small danger ghost button in the header row (browser confirm before delete).
```

---

## PHASE 4 — Quote module (sections + Brand->Category->Product cascade + PDF)

```
Extend the existing Infinite Automation Dashboard by building the /quote route.

Re-read CLAUDE.md and DESIGN_SYSTEM.md before starting. Special attention to:
- "Quote section blocks" spec in DESIGN_SYSTEM.md
- "Cascading product picker" spec in DESIGN_SYSTEM.md
- "PDF (print view)" spec in DESIGN_SYSTEM.md
- "Quote hierarchy" and "Product hierarchy" specs in CLAUDE.md

@dnd-kit is already installed from Phase 3.

Create the quotes Zustand store at /lib/store/useQuoteStore.ts:
- State: quotes (array of Quote).
- Actions: add(quote), update(id, patch), remove(id), setAll(quotes).
- Seed with 5 realistic quotes spanning all statuses. At least 3 seeds have MULTIPLE sections (e.g., "Ground Floor", "First Floor", "Outdoor"). Items reference products by id from the product store, mixing multiple brands so the cascading picker is meaningful.
- Quote numbers via generateQuoteNumber() in /lib/utils/format.ts, format "IA-Q-YYYY-NNN".

Add types to /types/index.ts:

Quote:
- id: number
- number: string
- clientId: number | null
- client: string (snapshot of company name)
- date: string
- validUntil: string
- status: "Draft" | "Sent" | "Accepted" | "Rejected"
- sections: Section[]

Section:
- id: string (uuid)
- name: string
- items: QuoteItem[]

QuoteItem:
- id: string (uuid)
- productId: number
- name: string   (snapshot)
- brand: string  (snapshot)
- qty: number
- price: number
- discount: number (percent)

Add /lib/utils/quote.ts with:
- calcQuoteTotal(quote) -> { subtotal, gst, grandTotal } (GST 18%)
- calcSectionSubtotal(section) -> number

Status badge colors (rounded-full pill style):
- Draft: text-secondary (#64748B)
- Sent: info blue
- Accepted: success green
- Rejected: danger red

Build /quote:

1. Five stat cards at top (grid-cols-5 gap-4, mb-6, each bg-white rounded-2xl shadow-card p-5 no border):
   - Total quotes
   - Draft (number in text-secondary)
   - Sent (number in info blue)
   - Accepted (number in success)
   - Total value (INR sum, text-3xl font-light)

2. Main table (bg-white rounded-2xl shadow-card overflow-hidden no border):
   - Toolbar inside the card (p-4 border-b border-border flex items-center gap-3):
       - Search input.
       - Status select.
       - Spacer (ml-auto).
       - "New quote" primary gradient button.
   - Columns: Quote # (brand blue), Client, Date, Valid until, Sections count, Items count, Total INR, Status badge (rounded-full pill), Actions (View eye, Edit, Delete IconButton-style, right-aligned).

3. Quote editor modal — max-w-6xl, scrollable body max-h-[85vh]:

   Header row inside the modal body (grid-cols-4 gap-4 mb-6):
   - Client select (populated from useLeadStore leads — value=clientId, label=company; on change snapshot company into quote.client).
   - Date, Valid until, Status select.

   Sections area — uses @dnd-kit/sortable so entire sections can be dragged to reorder.
   Each Section renders per the "Quote section blocks" spec in DESIGN_SYSTEM.md. Inside each section, ABOVE the items table, render the CASCADING PRODUCT PICKER per its spec:
      Brand select -> Category select (filtered by brand) -> Product select (filtered by brand+category, active products, labelled "Name — ₹Price") -> Add primary gradient button.
   On Add: append the product to this section's items (qty 1, price copied from product, discount 0, brand snapshot copied) and reset the three selects to their default "Choose ..." labels.

   Items table columns inside each section: Sr. No (auto sectionNo.itemIdx), Description (product name), Qty (number input w-16), Unit price (number input w-24, formatted on blur), Discount % (number input w-20), Line total (formatted), Remove (X icon).

   Below all sections: "Add new section" secondary button (Plus icon, centered, max-w-xs mx-auto). Clicking appends a Section named "New section" (user edits inline).

   Empty state when no sections exist: centered dashed-border card in the sections area (border-2 border-dashed border-border rounded-2xl p-12 text-center text-text-secondary) prompting "Add your first section to start — e.g. Ground Floor, First Floor, Outdoor".

   Totals block bottom-right (w-72 mt-6, inside its own subtle card: bg-surface-alt rounded-2xl p-5):
   - Subtotal
   - GST (18%)
   - Grand total — text-lg weight 400 brand-green with a top border above it.

   Modal footer actions (right-aligned, gap-2): Close (secondary), Download PDF (secondary Printer icon), Save quote (primary gradient Check icon).

4. View mode: same modal but every editable element rendered as read-only text (no inputs, no borders). Footer shows only Close and Download PDF.

5. PDF export via window.print(). Open a new window with self-contained HTML per the "PDF (print view)" spec in DESIGN_SYSTEM.md:
   - Font stack Barlow (link Google Fonts weight 300 and 400).
   - Header: brand-blue "Infinite Automation" wordmark left; tagline "Innovate. Automate. Elevate." underneath; right-aligned "Melbourne, Australia / info@infiniteautomation.com.au / 03 9069 2089" address block. Bottom border 3px solid #3A90C3.
   - "Quotation IA-Q-YYYY-NNN" h2.
   - Two info blocks side-by-side (grid-cols-2 gap 20px, each bg #F9FAFB p 15px radius 6px): "Bill to" and "Quote details".
   - Main items table with two columns: "Sr. No." (width 80px) and "Description" (remaining).
       Section header rows: solid #3A90C3 bg, white text, Sr No = "1", Description = section name (weight 400).
       Item rows: white bg, border-bottom 1px solid #E5E7EB, Sr No = "1.1"/"1.2", Description = `Product Name - SKU (Qty PCS)`.
   - Totals block right-aligned (width 300px): Subtotal, GST 18%, Grand total (top border 2px solid #0F172A, weight 400, size 16, color #44BE4A).
   - Footer: "Prices in INR, valid for 30 days from date of issue. Payment terms: 50% advance, 50% on delivery. Delivery: 2-3 weeks from confirmed order."
   - Auto-trigger window.print() 300ms after load.

6. Delete: browser confirm before removing.

7. Only section-level drag reordering. No item reordering within a section.
```

---

## PHASE 5 — Dashboard module (KPIs + charts)

```
Extend the existing Infinite Automation Dashboard by building the /dashboard route.

Re-read CLAUDE.md and DESIGN_SYSTEM.md before starting. Chart colors and styling come from the Chart palette and Charts sections in DESIGN_SYSTEM.md — apply them exactly.

Additionally install: recharts.

Dashboard reads live data from all three Zustand stores (useProductStore, useLeadStore, useQuoteStore). No new store, no seed data.

Build /dashboard as stacked rows. Every card is bg-white rounded-2xl shadow-card no border.

1. Row 1 — Four KPI cards (grid-cols-4 gap-4 mb-6):
   Layout per card (p-5):
   - Label top-left: text-xs uppercase tracking-wider text-muted.
   - Value below: text-3xl font-light text-primary.
   - Delta row underneath (text-xs, flex items-center gap-1): up/down icon + percentage in success/danger + "vs last month" in text-muted.
   - Top-right of each card: IconTile (44x44 rounded-xl) with default gradient-tint bg and brand-blue icon.

   a) Revenue Pipeline — sum of value from leads NOT in Won or Lost, formatINR. Delta "+18.2%" success + TrendingUp icon. IconTile: DollarSign.
   b) Active Leads — count of leads not in Won/Lost. Delta "+3" success. IconTile: Users.
   c) Active Quotes — count of quotes in Draft or Sent. Delta "+2" success. IconTile: FileText.
   d) Won This Month — sum of value from Won leads, formatINR. Delta "-4.1%" danger + TrendingDown icon. IconTile: TrendingUp.

2. Row 2 — 2/3 + 1/3 split (grid-cols-3 gap-4 mb-6):

   LEFT (col-span-2) — "Quotes and revenue (last 6 months)" card (p-6):
   - Card header: title text-lg weight 400 + small text-xs text-muted "Last 6 months" on the right.
   - Recharts LineChart (h-64) with hardcoded 6-month data trending upward.
   - Left Y-axis: quote count, line #3A90C3 brand blue.
   - Right Y-axis: revenue INR, line #44BE4A brand green.
   - Grid dashed #E5E7EB, axis text #94A3B8 size 12, tooltip white bg with rounded-xl shadow-dropdown no border, legend at top wrapper text-xs.

   RIGHT (col-span-1) — "Pipeline by segment" donut PieChart card (p-6):
   - Card header title.
   - Recharts PieChart, one slice per segment showing sum of value from leads (excluding Won/Lost).
   - Colors follow palette: #3A90C3, #44BE4A, #8B5CF6, #F59E0B.
   - innerRadius 50, outerRadius 85, paddingAngle 3.
   - Below chart: legend list — colored dot + segment (text-secondary text-xs) left, INR value (text-primary text-xs) right.

3. Row 3 — 2/3 + 1/3 split (grid-cols-3 gap-4):

   LEFT (col-span-2) — "Leads by stage" BarChart card (p-6):
   - Card header title.
   - One bar per stage (New, Qualified, Quoted, Won, Lost). Fill #3A90C3 brand blue. Radius [8,8,0,0].
   - Axes and grid as above.

   RIGHT (col-span-1) — "Recent activity" card (p-6):
   - Card header title.
   - Vertical list of 4 items (space-y-4). Each: colored dot (w-2 h-2 rounded-full mt-1.5) + activity text (text-sm text-primary) with relative time underneath (text-xs text-muted mt-0.5).
   - Samples:
     - "New quote sent to Chen Holdings" — dot brand green — "2h ago"
     - "Kapoor Villas quote accepted" — dot success — "5h ago"
     - "New lead: Wilson Farms" — dot brand blue — "1d ago"
     - "Product catalog updated" — dot muted — "2d ago"

All tooltips use the tooltip spec from DESIGN_SYSTEM.md: white bg, rounded-xl, shadow-dropdown, no border, text-primary text-xs. Monetary values in tooltips use formatINR.
```

---

## PHASE 6 — Supabase integration (real backend + role foundation)

```
Replace the in-memory Zustand state used across Master, CRM, Quote, and Dashboard modules with real data persistence in Supabase. Establish the auth + role foundation that Phase 7 will build the User Management UI on top of.

Re-read CLAUDE.md and DESIGN_SYSTEM.md before starting. UI must look identical after this phase — only the data source changes. Wire real auth into the TopNav's UserMenu (previously placeholder).

Install: @supabase/supabase-js, @supabase/ssr, @tanstack/react-query, sonner.

Setup:
1. /lib/supabase/client.ts (browser) and /lib/supabase/server.ts (server) using @supabase/ssr.
2. Env vars in .env.local and .env.example: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY.
3. Wrap the app in QueryClientProvider in the root layout. Add <Toaster position="top-right" /> from sonner near the root.
4. Build /lib/utils/permissions.ts exporting Role type and can(role, action) — one central function encoding the full role matrix from CLAUDE.md. Every guarded UI element uses this function.

Database schema — generate SQL migrations under /supabase/migrations/. Enable RLS on every table with policies aligned to the role matrix in CLAUDE.md.

products
- id            bigserial primary key
- name          text not null
- sku           text
- brand         text not null
- category      text not null
- hsn           text
- price         numeric
- status        text not null default 'Active' check (status in ('Active','Inactive'))
- created_at    timestamptz not null default now()
- updated_at    timestamptz not null default now()

leads
- id            bigserial primary key
- name          text not null
- company       text
- segment       text check (segment in ('Residential','Commercial','Short Term Rentals','Agriculture'))
- stage         text not null default 'New' check (stage in ('New','Qualified','Quoted','Won','Lost'))
- value         numeric not null default 0
- assigned      text
- email         text
- phone         text
- last_contact  date
- created_at    timestamptz not null default now()

quotes
- id            bigserial primary key
- number        text unique not null
- client_id     bigint references leads(id) on delete set null
- client        text
- date          date not null
- valid_until   date
- status        text not null default 'Draft' check (status in ('Draft','Sent','Accepted','Rejected'))
- created_at    timestamptz not null default now()

sections
- id            uuid primary key
- quote_id      bigint not null references quotes(id) on delete cascade
- name          text not null
- position      integer not null default 0

quote_items
- id            uuid primary key
- section_id    uuid not null references sections(id) on delete cascade
- product_id    bigint references products(id) on delete set null
- name          text not null
- brand         text
- qty           integer not null default 1
- price         numeric not null default 0
- discount      numeric not null default 0
- position      integer not null default 0

profiles
- id            uuid primary key references auth.users(id) on delete cascade
- full_name     text
- email         text
- role          text not null default 'Staff' check (role in ('Super Admin','Admin','Staff'))
- status        text not null default 'Active' check (status in ('Active','Inactive'))
- created_at    timestamptz not null default now()

Data-access modules under /lib/api/: products.ts, leads.ts, quotes.ts, users.ts. Each exports list, get(id), create, update(id, patch), remove(id).
- quotes.list() and get() must return the nested shape used by the UI (quote with sections; each section with items — ordered by position). create/update must upsert nested children atomically. Document your approach at the top of the file.
- users.ts wraps Supabase auth operations for create (via signUp or admin.createUser), update role/status via profiles, deactivate. Do NOT hard-delete auth users in Phase 6 — flip status to Inactive instead.

Replace Zustand data with React Query in every module:
- useQuery for lists/detail. Keys: ['products'], ['leads'], ['quotes'], ['quotes', id], ['users'].
- useMutation for create/update/delete. Invalidate correct key on success.
- Loading state: skeleton rows for tables (5 rows animate-pulse), skeleton KPI card shapes, and for the Kanban board — skeleton cards inside each column (3 per column).
- toast.success("Saved") on mutation success, toast.error(err.message) on error.

Zustand can stay for transient UI state only (open modals, active filters).

Auth wiring in the TopNav (built as placeholders in Phase 1):
- /login page with email+password sign-in via supabase.auth.signInWithPassword. Follow DESIGN_SYSTEM.md — centered card, brand gradient primary button, Barlow font.
- TopNav's avatar reads live profile: initials from full_name.
- UserMenu displays live full_name, email, and RoleBadge from the profile.
- UserMenu's "Sign out" now calls supabase.auth.signOut() then redirects to /login.
- Root middleware.ts checks the session; unauthenticated requests to /dashboard, /crm, /quote, /master, /users redirect to /login.
- After sign-in, fetch the profiles row and store role in a small useAuthStore Zustand slice for synchronous permission checks. Refresh whenever auth state changes.

Route-level role gating using can():
- /users route: only Super Admin and Admin. Staff hitting it get redirected to /dashboard.
- Users nav item in the TopNav is hidden for Staff (use can() in the TopNav render).
- Delete-quote button hidden for Staff.
- Add / edit / delete / import in Master hidden for Staff.

Excel behavior in Master:
- Import now bulk-inserts into products via /lib/api/products.ts, invalidates ['products'].
- Export queries the live products table before generating the workbook.

README.md at project root:
- How to create a Supabase project.
- How to set env vars.
- How to run the SQL migrations (Studio SQL editor or supabase CLI).
- How to create the first Super Admin user (create via Supabase auth dashboard, then update their profiles.role to 'Super Admin').
- How to run the app locally.

Deliverable: identical UI to Phase 5, but every create / update / delete now persists in Supabase, survives refresh, is protected by authentication, and respects the role matrix in the UI.
```

---

## PHASE 7 — User Management module

```
Build the /users route — a full User Management module with role assignment. Final phase.

Re-read CLAUDE.md and DESIGN_SYSTEM.md before starting. Special attention to the "Role permissions" matrix in CLAUDE.md and "RoleBadge" spec in DESIGN_SYSTEM.md.

Auth, permissions helper (can()), profiles table, and users data-access module already exist from Phase 6. The RoleBadge and Avatar primitives already exist from Phase 1. Reuse everything.

Route access:
- /users is Super Admin and Admin only. Enforced in middleware (from Phase 6). The Users nav item in TopNav is already hidden for Staff via can().

Build /users:

1. Three stat cards at top (grid-cols-3 gap-4 mb-6, each bg-white rounded-2xl shadow-card p-5 no border):
   - "Total users" — count from profiles, text-3xl font-light.
   - "Active" — count with status Active, number in success green.
   - "Super Admins" — count with role Super Admin, number in purple (#8B5CF6).

2. Main table card (bg-white rounded-2xl shadow-card overflow-hidden no border):
   - Toolbar (p-4 border-b border-border flex items-center gap-3):
       - Search input (name / email).
       - Role select (All + 3 roles).
       - Status select (All + Active + Inactive).
       - Spacer (ml-auto).
       - "Invite user" primary gradient button (UserPlus icon).
   - Columns:
       - Name — Avatar (sm 32px) + name text-sm weight 400 text-primary. If this is the currently-signed-in user, append a small "You" pill (text-[10px] text-muted bg-surface-alt rounded-full px-2 py-0.5 ml-2).
       - Email.
       - Role — RoleBadge (rounded-full pill).
       - Status — badge (rounded-full pill) — success for Active, muted for Inactive.
       - Created — date.
       - Actions — IconButton-style small buttons, right-aligned: Edit (Edit2 icon) and Deactivate/Reactivate (Power icon; danger color when Active, success color when Inactive).
   - Permission-gated action visibility using can():
       - Admin: Edit/Deactivate visible only on Staff rows; hidden on Admin/Super Admin rows.
       - Super Admin: all actions visible on all rows.
       - No user can Deactivate themselves — button hidden on own row.

3. Invite user modal (max-w-2xl):
   - Header: "Invite user".
   - Fields (2-col grid gap-4):
       - Full name (full width)
       - Email (full width)
       - Role select (gated by current user's role: Super Admin sees Super Admin / Admin / Staff; Admin sees only Staff)
       - Initial password (with "Generate" button that fills a strong random string; show/hide toggle icon inside input)
   - On Save: users.create() creates the auth user via Supabase and inserts the profile row with the chosen role and status Active. On success: toast, invalidate ['users']. On error: toast.
   - Footer: Cancel (secondary) + Create user (primary gradient).

4. Edit user modal (max-w-md):
   - Fields: Full name (editable), Email (read-only, greyed), Role select (same role-gating), Status (Active / Inactive).
   - Never allow editing your own role or your own status — both fields disabled with a small helper text below: "You cannot change your own role or status".
   - Footer: Cancel + Save.

5. Deactivate action (from the row):
   - Opens a ConfirmDialog primitive at /components/ui/ConfirmDialog.tsx (create it in this phase — a proper modal replacing window.confirm()): title "Deactivate <name>?", body "They will lose access immediately.", Cancel + confirm-danger button.
   - On confirm: users.update(id, { status: 'Inactive' }), invalidate ['users'], toast.
   - Reactivate mirrors this flow.
   - No hard delete in the UI. Document in README that hard deletes are done via Supabase dashboard.

6. Empty state: "No users found" centered per table spec (py-12 text-muted).

Supabase RLS policies for profiles must match UI gating:
- Any authenticated user can select their own row.
- Super Admin can select/insert/update/delete any row.
- Admin can select any row; insert only rows with role='Staff'; update only rows with role='Staff'; no delete.
- Staff can only select their own row; no insert/update/delete.

After building /users, sweep the rest of the app to replace window.confirm() calls with ConfirmDialog (Master delete, Quote delete, Lead delete inside the Edit modal).

Deliverable: working User Management module respecting the exact role matrix from CLAUDE.md, both in UI and in the database.
```

---

## How to work through these

1. Save `CLAUDE.md` and `DESIGN_SYSTEM.md` at the project root — do this first.
2. Phase 1: verify the top nav renders with the brand-gradient pill active state, all five routes navigate, the user avatar opens the UserMenu dropdown, cards float with soft shadows on pure white, Barlow font loads correctly.
3. Phase 2: test Excel import against your real `infinite_Product_List.xlsx`. Confirm Brand column populates and the Brand->Category filter chain works.
4. Phase 3: verify Kanban drag reassigns stage, AssigneeStack filters by salesperson when clicked, cards look premium (borderless, shadow, rounded-2xl).
5. Phase 4: test section add / rename / reorder, add products using Brand->Category->Product cascade, generate a PDF, verify blue section headers match the reference layout.
6. Phase 5: verify all charts pull live data from stores and use the brand-blue / brand-green palette.
7. Phase 6: only after 1-5 all work. Create Supabase project, set env vars, run migrations, create your first Super Admin user, then run this phase.
8. Phase 7: with auth in place, build user management. Test all role combinations by signing in as Super Admin, Admin, and Staff separately.

If any phase produces something off-spec, quote the DESIGN_SYSTEM.md rule it violated and ask Claude Code to fix that specific piece rather than rebuilding the whole phase.
