# CLAUDE.md

Persistent project context, rules, and workflow for the Infinite Automation Dashboard. Claude Code reads this before every task and follows it as project-wide law.

For all visual, color, typography, and component-styling rules see the companion file **DESIGN_SYSTEM.md** at the project root. Read both files together.

---

## Project overview

**Name:** Infinite Automation Dashboard
**Purpose:** Internal operations dashboard for Infinite Automation (infiniteautomation.com.au), a Melbourne-based smart home and building automation company.
**Users:** Internal team — Super Admin, Admin, Staff.
**Modules:** 5 modules — Dashboard, CRM (Kanban), Quote, Master File, User Management.
**Navigation style:** Top horizontal nav bar with pill-style active state. No left sidebar. See DESIGN_SYSTEM.md.

The company sells hardware (smart switches, controllers, cameras, sensors, Unifi networking gear) and installation services across 4 customer segments: Residential, Commercial, Short Term Rentals, Agriculture.

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
- **Fonts:** Barlow (loaded via next/font/google — weights 300 Light and 400 Regular only)

Do NOT introduce: Material UI, Chakra, Ant Design, Redux, styled-components, emotion, DaisyUI, shadcn (unless asked), or any other UI/component library.

---

## Data conventions

### Currency
- All prices and values are in **INR**.
- Display format: rupee symbol + Indian number formatting (e.g., 1,85,000 — not 185,000).
- Utility: `formatINR(n)` in `/lib/utils/format.ts`. Null / undefined / empty renders as em dash in secondary color; missing product price renders as "Not set" in warning color.

### Dates
- Store as `YYYY-MM-DD` strings.
- Display as-is in tables for now; use native `<input type="date">` in forms.

### GST
- Standard rate: 18%. Applied on quote subtotals only.

### IDs
- Auto-increment integer IDs client-side in Phase 1-5.
- Supabase bigserial in Phase 6.

### Enums (use exactly these strings, case-sensitive)
- **Customer segments:** `Residential`, `Commercial`, `Short Term Rentals`, `Agriculture`
- **Lead stages:** `New`, `Qualified`, `Quoted`, `Won`, `Lost`
- **Quote status:** `Draft`, `Sent`, `Accepted`, `Rejected`
- **Product status:** `Active`, `Inactive`
- **User roles:** `Super Admin`, `Admin`, `Staff` (final — do not add or rename)
- **User status:** `Active`, `Inactive`

### Product hierarchy (Brand -> Category -> Product)
Every product belongs to one **Brand** (e.g., Infinite AUS, Unifi Wifi, Unifi Camera, Electrical Product) and one **Category** (e.g., Light Controller, Curtain Controller, AP, Turret Camera). A category always lives under one brand — no cross-brand categories.

When adding a product to a quote, the picker cascades: user picks **Brand** first, which narrows **Category** options, which narrows **Product** options. Never let the user pick a category that has no products under the chosen brand.

### Quote hierarchy
- Every quote is broken into user-defined Sections (e.g., "Ground Floor", "First Floor", "Basement", "Outdoor Area").
- Sections auto-number 1, 2, 3 in order.
- Items inside a section auto-number as `sectionNumber.itemIndex` (1.1, 1.2, 2.1, 2.2).
- PDF renders a two-column table (Sr. No. and Description) with dark blue section header rows spanning both columns and item rows below each header.
- Item description in PDF: `Product Name - SKU (Qty PCS)`.

### Role permissions (final matrix)

| Capability | Super Admin | Admin | Staff |
|---|---|---|---|
| View Dashboard | Yes | Yes | Yes |
| View CRM Kanban | Yes | Yes | Yes |
| Create / edit / move / delete Leads | Yes | Yes | Yes |
| View Quote | Yes | Yes | Yes |
| Create / edit Quote | Yes | Yes | Yes |
| Delete Quote | Yes | Yes | No |
| View Master File | Yes | Yes | Yes |
| Create / edit / delete Products | Yes | Yes | No |
| Excel import in Master | Yes | Yes | No |
| View User Management | Yes | Yes | No |
| Create Staff | Yes | Yes | — |
| Create Admin | Yes | No | — |
| Create Super Admin | Yes | No | — |
| Edit / deactivate any user | Yes | Only Staff | — |
| Delete user | Yes | No | — |

Enforce this in the UI (hide/disable actions via `can(role, action)`) and again in Supabase RLS in Phase 6.

---

## File / folder structure

```
/app
  /dashboard/page.tsx
  /crm/page.tsx
  /quote/page.tsx
  /master/page.tsx
  /users/page.tsx           (Phase 7)
  /login/page.tsx           (Phase 6)
  layout.tsx
  globals.css
/components
  /ui                       (Button, IconButton, Input, Select, Modal, Card, Badge, Table, IconTile, ConfirmDialog, Avatar)
  /layout                   (TopNav, UserMenu)
  /dashboard                (KpiCard, RevenueChart, SegmentPie, StageBar, ActivityFeed)
  /crm                      (KanbanBoard, KanbanColumn, LeadCard, LeadModal, SegmentCards, AssigneeStack)
  /quote                    (QuoteTable, QuoteModal, SectionBlock, ProductPicker, QuotePrintView)
  /master                   (ProductTable, ProductModal, BrandFilter)
  /users                    (UserTable, UserModal, RoleBadge)
/lib
  /utils                    (formatINR, calcQuoteTotal, generateQuoteNumber, uuid, permissions, initials)
  /store                    (useProductStore, useLeadStore, useQuoteStore, useUserStore, useAuthStore)
  /supabase                 (Phase 6: client.ts, server.ts, middleware.ts)
  /api                      (Phase 6: products.ts, leads.ts, quotes.ts, users.ts)
/types
  index.ts                  (Product, Lead, Quote, Section, QuoteItem, User, Role)
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
- **Kanban drag:** dropping a card into a new column updates the lead's stage optimistically; revert on error.

---

## Phase discipline (7 phases)

- **Phase 1:** Layout shell with top nav. Empty routes.
- **Phase 2:** Master module (products with Brand, Excel import/export).
- **Phase 3:** CRM Kanban board (drag leads between stage columns, assignee stack at top).
- **Phase 4:** Quote module with Section hierarchy + cascading Brand -> Category -> Product picker + PDF export.
- **Phase 5:** Dashboard KPIs + charts.
- **Phase 6:** Supabase (auth, real persistence, React Query, RLS with role checks).
- **Phase 7:** User Management module.

Do not build features from a later phase during an earlier one. If a prompt asks for something out of phase, flag it back to the user.

---

## Business context (for realistic seed data and copy)

- Company is Melbourne-based, Australian Made certified.
- Products are Australian-manufactured hardware (own brand "Infinite AUS") plus resold Unifi network gear.
- Customer segments: Residential (homes), Commercial (offices, warehouses, education), Short Term Rentals (Airbnb-style properties), Agriculture (irrigation, sprinklers, pumps).
- Typical products: dimmers, HVAC controllers, garage door controllers, curtain motors, smart locks, cameras, access control, WiFi access points, VoIP phones, sensors.
- Typical deal sizes (INR): Residential 1L-3L, Commercial 5L-25L, STR 2L-5L, Agriculture 1L-3L.
- Sales team names for seed data: Priya, Arjun, Neha, Rohan, Sam.
- Contact names in seed leads: mix Indian and Australian names for realism.
- Brand naming rule: drop the "Unifi " prefix from imported brand names. The clean brand list is: Infinite AUS, Automation Products, Electrical Product, Wifi, Camera, Video Door Phone, Sensors & Alarms, Advance Hosting, Managed VoIP.
- Excel import in Master must auto-normalize brand names: strip a leading "Unifi " prefix, trim trailing/leading whitespace, and correct known source typos ("Alarams" -> "Alarms"). This applies to every Excel import going forward, not just the initial seed.

---

## When in doubt

- Ask before installing a new npm package.
- Ask before deviating from DESIGN_SYSTEM.md.
- Ask before changing the folder structure or the role matrix above.
- Ask before adding authentication or backend logic outside Phase 6.
- Keep the UI light, calm, and premium.
