# CLAUDE.md

Persistent project context, rules, and workflow for the Infinite Automation Dashboard. Claude Code reads this before every task and follows it as project-wide law.

For all visual, color, typography, and component-styling rules see the companion file **DESIGN_SYSTEM.md** at the project root. Read both files together.

---

## Project overview

**Name:** Infinite Automation Dashboard
**Purpose:** Internal operations dashboard for Infinite Automation (infiniteautomation.com.au), a Melbourne-based smart home and building automation company.
**Users:** Internal team — Super Admin, Admin, Purchase.
**Modules:** Dashboard, CRM (CRM | Complaints tabs — the CRM tab is the Kanban pipeline, internally the `projects` table/routes), Tickets (Kanban, reached from the Dashboard), Customers, Quote, Master File, Procurement, User Management, Audit Log.
**Navigation style:** Dark glass left sidebar (grouped nav with count badges) plus a light header strip; frosted-glass cards on a soft gradient background. Modals stay solid white. See DESIGN_SYSTEM.md.

The company sells hardware (smart switches, controllers, cameras, sensors, Unifi networking gear) and installation services across 6 customer segments: Residential, Hospitality, Government / Council, Retail, Healthcare / Aged Care, Industrial.

---

## Tech stack (locked — do not change without asking)

- **Framework:** Next.js 14 (App Router) with TypeScript
- **Styling:** Tailwind CSS only (no CSS-in-JS, no styled-components, no emotion)
- **Icons:** lucide-react
- **Charts:** recharts
- **Excel handling:** xlsx (sheetjs)
- **Shared state (Phase 1-5):** Zustand
- **Drag & drop (Phase 3 Kanban, Phase 4 Quote sections):** @dnd-kit/core, @dnd-kit/sortable
- **Backend (Phase 6):** Supabase (auth, Postgres, RLS)
- **Data fetching (Phase 6):** @tanstack/react-query
- **Toasts:** sonner
- **Fonts:** Urbanist (all text and numbers — single weight, 400 Regular), loaded via next/font/google. See DESIGN_SYSTEM.md.

Do NOT introduce: Material UI, Chakra, Ant Design, Redux, styled-components, emotion, DaisyUI, shadcn (unless asked), or any other UI/component library.

---

## Data conventions

### Currency
- **Each user picks a working currency in Settings** (`users.currency`, default `INR`; codes and tax rates in `/lib/utils/currency.ts`). Read it with `useCurrency()` (`/lib/hooks/useCurrency.ts`) — never hard-code `"INR"` in UI.
- It also sets the header clock's time zone (`timeZone`/`city` on each currency in `currency.ts`: INR → India, AED → Dubai, AUD → Melbourne, …) — `components/layout/HeaderClock.tsx`.
- It applies to: new quotes and vendor POs (no currency picker in those forms), the product picker and Master File price column, Excel-imported quotes without a Currency column, and every money figure on the Dashboard.
- A saved quote / PO keeps the currency it was created in (its own tax rate too), so lists, PDFs and project cards show each record in its own currency.
- Never add amounts in different currencies together — the Dashboard counts only quotes in the user's currency; the Open pipeline card lists each currency separately.
- Products are priced per currency (`product_prices`). Read a price with `priceIn(product, code)` — the legacy single `price` column is an INR-only fallback. Missing price = no price in the user's currency → "Not set" in warning color.
- Display: `<Price value currency />` (symbol + locale grouping, e.g. ₹1,85,000 / A$185,000). Null renders as em dash in secondary color.

### Complaints (CRM → Complaints tab, `/complaints`)
- Fields: Name, Phone Number, Site address, Remarks, Engineer (one active user), optional linked Customer (`complaints.customer_id`; picking one fills Name, Phone and Site address, still editable — `customerSiteAddress()` in `lib/utils/customer.ts`). Numbered `CMP-0001`. Statuses: `Pending`, `Completed`, `Cancelled`.
- Flow: Super Admin/Admin raises it and assigns an engineer → engineer is notified → engineer (or an admin) marks it **Completed** with a required "what was done" note → the raiser is notified. An admin can instead **Cancel** a Pending complaint with a required reason (raised by mistake, customer withdrew, duplicate…) → the engineer is notified. An admin can **Reopen** a Completed or Cancelled complaint (back to Pending, engineer notified) or edit/reassign (new engineer notified). A cancelled complaint can't be completed until reopened. Every step writes a `complaint_events` row (shown as History) and an audit entry (module `CRM`, entity `complaint`).
- Cancelled complaints are withdrawn: the page's Total card and "All" tab, and the Dashboard's Complaints card, leave them out; they have their own card and tab. The four stat cards on the page double as tab shortcuts.
- Age: a pending complaint shows "Nd open", orange from 3 days, red from 7 (`complaintAge()` and the thresholds in `lib/utils/complaints.ts`); a completed one shows "fixed in Nd".
- Gate with `can(role, "manageComplaints")`; non-admins only ever see complaints where they are the engineer (enforced in the API).
- Notifications carry an `href`; complaint notifications link to `/complaints?open=<id>`, which opens that complaint's panel.

### Customers
- Add/Edit Customer fields: SR No (the id, shown as `0017`), Customer Code, Prefix, Name*, Surname, Mobile Number, Email, Architect Name, GST No, Address, City, State, Postcode, Birthday, plus Segment and Notes.
- `customers.name` is the **full display name** (first name + surname) that quotes, CRM and search use — the API recomputes it on every save; never edit it directly.
- Customer Code is generated by the API on create (first two letters of Name + Surname, e.g. RAVE; RAVE2 if taken) and never changes. Helpers in `lib/utils/customer.ts`, server mapping in `lib/customersDb.ts`.
- Birthday is stored as `YYYY-MM-DD`, or `--MM-DD` when the year is unknown. Architect is free text, picked from names already used on customers/CRM records or typed via "+ Add Architect".

### Dates
- Store as `YYYY-MM-DD` strings.
- Display as-is in tables for now. In forms and filters use `<DatePicker>` (`components/ui/DatePicker.tsx`) — never a native `<input type="date">`; it reads and writes the same `YYYY-MM-DD` string.

### GST
- Standard rate: 18%. Applied on quote subtotals only.

### IDs
- Auto-increment integer IDs client-side in Phase 1-5.
- Supabase bigserial in Phase 6.

### Enums (use exactly these strings, case-sensitive)
- **Ticket statuses:** `Open`, `In Progress`, `On Hold`, `Resolved`, `Closed`
- **Ticket priority:** `Low`, `Medium`, `High`, `Urgent`
- **Ticket category:** `Installation`, `Repair`, `Maintenance`, `General`
- **CRM pipeline stages:** stored in `pipeline_stages` (ordered by `position`), not hard-coded. Six fixed defaults: `Inquiry`, `Quote`, `Confirm Order`, `Site Instruction`, `Material Requirement`, `Install` — **Install is the last stage and counts as done**. Any user can add custom stages (placed after a chosen stage), rename them, or delete them once empty; defaults can't be renamed or deleted. `Cancelled` is a separate status reachable from any stage (not a column, not in the table). `projects.stage` stores the stage *name* (validated against the table in the API; renaming a custom stage moves its records). Group stages by position with `stagePhase()` in `lib/utils/pipeline.ts`: inquiry (first) → pre-sale (before Confirm Order) → delivery (Confirm Order up to the last) → done (last). Moving into Confirm Order is only a label — the Confirm button still does the stock reservation.
- **Quote status:** `Draft`, `Sent`, `Accepted`, `Rejected`
- **Product status:** `Active`, `Inactive`
- **User roles:** `Super Admin`, `Admin`, `Purchase` (`Purchase` replaced the old `Staff` role — do not add or rename without asking)
- **User status:** `Active`, `Inactive`

### Product hierarchy (Brand -> Category -> Product)
Every product belongs to one **Brand** (e.g., Infinite AUS, Unifi Wifi, Unifi Camera, Electrical Product) and one **Category** (e.g., Light Controller, Curtain Controller, AP, Turret Camera). A category always lives under one brand — no cross-brand categories.

When adding a product to a quote, the picker cascades: user picks **Brand** first, which narrows **Category** options, which narrows **Product** options. Never let the user pick a category that has no products under the chosen brand.

### Kits (Master File → Kits tab, `/master/kits`)
- A kit is a named group of Master File products with quantities (`kits` + `kit_items`). Fields: Kit SKU (unique), Kit name, Description, Status, Discount %, components.
- **Kits hold no stock.** "Can build" = the scarcest component's available ÷ its qty. **Price** = sum of component prices in the viewer's currency minus the kit's discount %; "Not set" if any component has no price in that currency. All of this lives in `lib/utils/kits.ts` — never recompute in a component.
- Manage with `editProducts` (Super Admin/Admin); Excel import with `excelImport`. Import is append-only: one row per component (`Kit SKU | Kit Name | Description | Discount % | Product SKU | Product Name | Qty`), components matched by Product SKU (case-insensitive); existing kit SKUs and kits with unknown SKUs are skipped and reported.
- A product inside a kit can't be deleted (API names the kit; `kit_items.product_id` is ON DELETE RESTRICT).
- **Kits in quotes = one line.** The quote picker's category dropdown has "Kits (product groups)"; a kit is added as one quote line (`product_id` NULL, `kit_id`, `kit_sku`, `kit_components` JSONB snapshot `[{productId, name, sku, qty}]`) priced at the kit price in the quote's currency (`kitQuoteLine()`). The snapshot is frozen — editing or deleting the kit later never changes an existing quote.
- PDF prints `Kit Name - KIT-SKU (n PCS)` with an "Includes: 2× X, 1× Y" line; Excel puts the Kit SKU in the SKU column plus a "Kit Contents" column, and import matches an unknown SKU against kit SKUs.
- **Stock goes through components.** Confirming a project reserves, and reorder demand counts, each kit line as component qty × line qty. Both queries use `QUOTE_PRODUCT_LINES` in `lib/inventoryDb.ts` — any new query over quote lines for stock must use it instead of `quote_items`.

### Quote hierarchy
- Every quote is broken into user-defined Sections (e.g., "Ground Floor", "First Floor", "Basement", "Outdoor Area").
- Sections auto-number 1, 2, 3 in order.
- Items inside a section auto-number as `sectionNumber.itemIndex` (1.1, 1.2, 2.1, 2.2).
- PDF renders a two-column table (Sr. No. and Description) with dark blue section header rows spanning both columns and item rows below each header.
- Item description in PDF: `Product Name - SKU (Qty PCS)`.

### Role permissions (final matrix)

> **Purchase is provisional:** it currently has exactly the permissions the old Staff role had. The owner will decide Purchase's final permissions later — change the Purchase column here and the matching cases in `lib/utils/permissions.ts` (and the Admin/Purchase checks in `app/api/users/*`) together.

| Capability | Super Admin | Admin | Purchase |
|---|---|---|---|
| View Dashboard | Yes | Yes | Yes |
| View Tickets | Yes | Yes | Yes |
| Create / edit / move / delete Tickets | Yes | Yes | Yes |
| View Projects | Yes | Yes | Yes |
| Create / edit / advance / cancel / delete Projects | Yes | Yes | Yes |
| View Quote | Yes | Yes | Yes |
| Create / edit Quote | Yes | Yes | Yes |
| Delete Quote | Yes | Yes | No |
| View Master File | Yes | Yes | Yes |
| Create / edit / delete Products | Yes | Yes | No |
| Excel import in Master | Yes | Yes | No |
| Confirm a project / ship stock / adjust stock & min buffer / draft, issue & receive vendor POs | Yes | Yes | Yes |
| Raise / edit / reassign / cancel / reopen / delete complaints | Yes | Yes | No |
| Complete a complaint assigned to you | Yes | Yes | Yes |
| See complaints | All | All | Only assigned to them |
| View User Management | Yes | Yes | No |
| Create Purchase user | Yes | Yes | — |
| Create Admin | Yes | No | — |
| Create Super Admin | Yes | No | — |
| Edit / deactivate any user | Yes | Only Purchase | — |
| Delete user | Yes | No | — |
| View Audit Log | Yes | Yes | No |
| Export Audit Log (CSV) | Yes | No | No |

Enforce this in the UI (hide/disable actions via `can(role, action)`) and again in Supabase RLS in Phase 6.

---

## File / folder structure

```
/app
  /dashboard/page.tsx
  /tickets/page.tsx
  /crm/page.tsx             (CRM board — old /projects links redirect here)
  /quote/page.tsx
  /master/page.tsx
  /procurement/page.tsx     (Additive — Inventory & Procurement)
  /crm/[id]/order-slip/page.tsx
  /users/page.tsx           (Phase 7)
  /audit/page.tsx           (Additive — Audit Log)
  /login/page.tsx           (Phase 6)
  layout.tsx
  globals.css
/components
  /ui                       (Button, IconButton, Input, Select, DatePicker, Modal, Card, Badge, Table, IconTile, ConfirmDialog, Avatar)
  /layout                   (Sidebar, NavLinks, TopNav, UserMenu)
  /dashboard                (KpiCard, RevenueChart, SegmentPie, StageBar, ActivityFeed)
  /tickets                  (KanbanBoard, KanbanColumn, TicketCard, TicketModal, TicketPanel, AssigneeStack)
  /projects                 (KanbanBoard, KanbanColumn, ProjectCard, ProjectModal, ProjectPanel, StageModal, CrmSummary — the CRM page; reuses AssigneeStack from /tickets)
  /quote                    (QuoteTable, QuoteModal, SectionBlock, ProductPicker, KitPickerList, QuotePrintView)
  /master                   (ProductTable, ProductModal, BrandFilter, MasterTabs, KitsPageClient, KitModal, KitComponentsEditor)
  /users                    (UserTable, UserModal, RoleBadge)
  /settings                 (CurrencySettings)
  /procurement              (ReorderQueue, CreatePOModal, VendorPOList, ReceiveDeliveryModal)
  /audit                    (AuditPageClient, AuditDetailModal, AuditPageSkeleton, auditMeta — module colors/action icons)
/lib
  /utils                    (formatINR, calcQuoteTotal, generateQuoteNumber, uuid, permissions, initials, timeAgo, relativeTime, pipeline — CRM stage helpers)
  /store                    (useProductStore, useTicketStore, useProjectStore, useQuoteStore, useUserStore, useAuthStore, useSidebarStore)
  /hooks                    (useAuditUnreadCount — shared by TopNav bell dot and NotificationPanel; useCurrency — the user's Settings currency; usePipelineStages — CRM stage columns)
  /api                      (audit.ts — logAction/listAuditLogs/exportAuditLogs/getAuditStats; the app has no other data-access layer, every other route calls the Neon `sql` client directly in app/api/*/route.ts)
/types
  index.ts                  (Product, Ticket, TicketMessage, Project, ProjectStageEvent, ProjectMessage, Quote, Section, QuoteItem, QuoteKitComponent, User, Role, AuditLog, AuditModule, AuditAction, AuditChanges)
CLAUDE.md
DESIGN_SYSTEM.md
```

---

## Coding conventions

- **TypeScript everywhere.** No `any` — use `unknown` or proper types.
- Define all shared types in `/types/index.ts`.
- Use **named exports** for components. Default export only for Next.js pages.
- Prefer **function components** with hooks. No class components.
- Server components by default; use `"use client"` only when needed.
- Keep components under 200 lines. Extract sub-components when they grow.
- Colocate small helpers with their component; move to `/lib/utils` when reused.
- Tailwind class order: layout, spacing, sizing, typography, color, state.
- No inline hex colors in JSX. Use tokens defined in `tailwind.config.ts`.
- Always handle empty, loading, and error states.
- Permission gating: `/lib/utils/permissions.ts` exports `can(role, action)`. Every guarded button, menu item, and page checks through this.

---

## Behavior rules

- **Confirm before destructive actions.** Use `window.confirm()` for delete in Phase 1-5, replace with a proper ConfirmDialog component in Phase 6/7.
- **Modals close on:** Escape key, backdrop click, explicit Cancel/Close button. Never auto-close except after a successful save.
- **Search inputs:** debounce 250ms if hitting an API; instant filter for local state.
- **Tables / boards:** always show a friendly empty state instead of a blank body.
- **Forms:** minimal validation — required fields only. Trim strings on save.
- **Excel import:** never overwrite; always append. Show a summary alert with count imported.
- **PDF export:** use `window.open()` + printable HTML + `window.print()`. No jsPDF, no external PDF libraries.
- **Kanban drag:** dropping a card into a new column updates the ticket's status optimistically; revert on error.

---

## Phase discipline (7 phases)

- **Phase 1:** Layout shell with top nav. Empty routes.
- **Phase 2:** Master module (products with Brand, Excel import/export).
- **Phase 3:** Tickets Kanban board (drag tickets between status columns, assignee stack at top).
- **Phase 4:** Quote module with Section hierarchy + cascading Brand -> Category -> Product picker + PDF export.
- **Phase 5:** Dashboard KPIs + charts.
- **Phase 6:** Supabase (auth, real persistence, React Query, RLS with role checks).
- **Phase 7:** User Management module.
- **Additive (post-Phase 7):** Projects Kanban board (sales-to-delivery pipeline, drag projects between stage columns, stage-change history log, optional linked Quote). Modeled directly on the Phase 3 Tickets board's components/patterns; not part of the original 7-phase sequence, added as its own sibling module.
- **Additive (post-Phase 7):** Per-record chat on both Tickets (`TicketPanel`) and Projects (`ProjectPanel`, under a Details/Chat tab switcher) — reply, forward-to-another-record-of-the-same-type, delete-for-me (soft delete), attachments of any type (photos, video, audio, PDF, Excel/Word/PowerPoint, zip…, up to 100 MB each, several at once, paste-to-attach) uploaded **straight from the browser to Cloudflare R2** via a presigned PUT link from `/api/chat/upload` (`lib/chatUpload.ts`, `lib/r2.ts` — SigV4 signed by hand, no SDK; env `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`; the bucket needs a CORS rule allowing PUT from the app's origins; `useChatAttachments`) — never through our own route, which Vercel caps at ~4.5 MB; they render as a photo grid with lightbox, inline video/audio players and typed file cards (`components/chat/AttachmentList.tsx`, `lib/utils/attachments.ts`); the feed sits on the live fluid gradient backdrop `ChatBackdrop`, @mention autocomplete, in-panel search with highlighting, avatar + sender name per message. Backed by `ticket_messages` / `project_messages` tables (same shape) and `/api/{tickets,projects}/[id]/messages*` routes. Forwarding does not cross module boundaries (a ticket message can only forward to another ticket, a project message only to another project). **Who hears about a message** (`lib/api/chatNotify.ts`, called from both message POST routes): everyone `@Full Name`-mentioned gets a "mentioned you" notification; the record's assignee (matched by name — `assigned` stores a name) plus everyone who has posted in that chat gets a "new message" notification; never the sender, never twice. Notifications link to `/crm?open=<id>` / `/tickets?open=<id>`, which open that record's chat. **Unread badges** on CRM cards come from `project_message_reads` (per user, per record): `GET /api/projects/unread` counts others' messages since your last read, only on records you follow (assignee, posted, opened before, or mentioned); the open chat marks itself read via `POST /api/projects/[id]/messages/read`. Message delete is "Delete" (soft delete for everyone).
- **Additive (post-Phase 7):** Inventory & Procurement — stock tracking, deal confirmation, vendor POs. Rules:
  - Products carry `physical_stock` and `min_buffer`. **Allocated is never stored**: it is the sum of outstanding `inventory_allocations` (status `Reserved`, qty − shipped_qty). Available = physical − allocated (can go negative = confirmed shortage).
  - **All stock maths lives in `lib/utils/inventory.ts`** (`stockStatus`, `splitReadyBackordered`); loaders in `lib/inventoryDb.ts`. Never recompute stock in a component. Self-check: `node db/check-inventory.mts`.
  - Reorder: triggered when available < min buffer. Suggested = ceil(shortage + buffer gap + 0.5 × units on Draft/Sent quotes − incoming), never below 0. Incoming = outstanding units on `Issued`/`Partially Received` POs only (a Draft PO is not incoming).
  - "Inquiry" = a **Project with a linked quote**. `POST /api/projects/[id]/confirm` locks the project, sets the quote Accepted and reserves its products; the quote is then locked on that project. Cancelling the project releases unshipped reservations. Ready-to-ship vs backordered is first-confirmed-first-served across projects, so receiving stock clears backorders with no flag to maintain.
  - Stock changes happen only inside `withTransaction()` (`lib/db.ts`, Pool + `SELECT … FOR UPDATE`; the Neon HTTP `sql` client cannot lock) and each writes a `stock_movements` row (GRN / SHIP / ADJUST). Audit module: `Inventory`.
  - One PO per brand (brand = vendor). Receiving over the ordered quantity is allowed and noted in the audit log; a partially received PO can be closed short.
  - A PO that never moved stock — a **Draft**, or a **Cancelled** one with nothing received — can be deleted from the Vendor POs tab (`DELETE /api/procurement/pos/[id]`, audited). Issued and received POs are kept as the record. A product can't be deleted while a PO, reservation or kit still references it (the DB reports ON DELETE RESTRICT as `23001`; the products API turns it into a plain message).
- **Additive (post-Phase 7):** Notification bell panel — two parts. **Needs attention** (`useAttention()` in `lib/hooks/useAttention.ts`) is live counts of work waiting on the signed-in user, one row per module (pending complaints, unread CRM chats, open tickets, quotes to follow up, items to reorder, and new audit entries for admins), each a shortcut to its page; counts are derived from data the app already holds or polls, never stored, and the headline total leaves out audit entries. Below it, the **notification feed** has filter chips (All, Unread, then only the modules present). A notification's module is read from its `href` (`notificationModule()` in `lib/utils/notifications.ts`), so any new notification should pass an `href` to its module's page.
- **Additive (post-Phase 7):** Audit Log — an append-only `audit_logs` table records every meaningful create/update/delete/import/export/status-change/stage-change/login/logout/role-change across Master, CRM (Tickets), Quote, Projects, User Management, and Auth. Logged via `logAction()` in `/lib/api/audit.ts`, called directly from each mutating API route right after its DB write (no separate data-access layer — this app has none, so the logger is the one new shared piece, not a new architectural layer). The `/audit` page (Super Admin/Admin only, gated in middleware via the session cookie's embedded role, and again server-side via `can(role, "viewAuditLog")` on every read route) supports filtering, search, cursor-paginated infinite scroll, a detail modal with before/after diffs, and CSV export (`can(role, "exportAuditLog")`, Super Admin only). The Dashboard's "Recent activity" card and the notification panel's unread-count row both read live from this table for Super Admin/Admin; Purchase users see the original ticket/quote-derived activity feed instead, since Purchase users cannot access the audit log itself.

Do not build features from a later phase during an earlier one. If a prompt asks for something out of phase, flag it back to the user.

---

## Business context (for realistic seed data and copy)

- Company is Melbourne-based, Australian Made certified.
- Products are Australian-manufactured hardware (own brand "Infinite AUS") plus resold Unifi network gear.
- Customer types served (not a tracked field — tickets are classified by `category` instead): Residential (homes), Hospitality (hotels/resorts/serviced apartments), Government / Council (public buildings, council infrastructure), Retail (shopfronts, shopping centers), Healthcare / Aged Care (sensors, access control, emergency call systems), Industrial (factories, warehousing, offices).
- Typical products: dimmers, HVAC controllers, garage door controllers, curtain motors, smart locks, cameras, access control, WiFi access points, VoIP phones, sensors.
- Support team names for seed data: Priya, Arjun, Neha, Rohan, Sam.
- Contact names in seed tickets: mix Indian and Australian names for realism.
- Brand naming rule: the clean brand list is: Infinite AUS, Automation Products, Electrical Product, Unifi. Products imported under the Unifi brand keep `brand: "Unifi"` — their sub-line (Wifi, Camera, Video Door Phone, Sensors & Alarms, Advance Hosting, Managed VoIP) is the **category**, not the brand. If the source brand column has a "Unifi " prefix followed by more text (e.g. "Unifi Wifi"), strip the prefix down to "Unifi".
- Excel import in Master must auto-normalize brand names: strip a leading "Unifi " prefix down to "Unifi", trim trailing/leading whitespace, and correct known source typos ("Alarams" -> "Alarms"). This applies to every Excel import going forward, not just the initial seed.

---

## When in doubt

- Ask before installing a new npm package.
- Ask before deviating from DESIGN_SYSTEM.md.
- Ask before changing the folder structure or the role matrix above.
- Ask before adding authentication or backend logic outside Phase 6.
- Keep the UI light, calm, and premium.
