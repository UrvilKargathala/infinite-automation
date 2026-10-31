# DESIGN_SYSTEM.md

The single source of truth for all visual design in the Infinite Automation Dashboard. Every component, page, and phase must follow this file.

Do NOT deviate from these tokens. If a screen calls for something not covered here, ask before inventing new tokens.

The overall feel to aim for: **premium, airy, modern SaaS**. Think Linear or a polished CRM. Lots of whitespace, borderless cards floating on white with soft shadows, generous radius, calm typography.

---

## Typography

**Font family:** Urbanist — loaded via `next/font/google` (`app/layout.tsx`, CSS variable `--font-urbanist`). Used for everything: headings, body, labels, buttons, nav, numbers, chart axes, toasts, and the quote / PO PDFs.

Urbanist is a variable font, but we load **only weight 400 (Regular)** so the whole UI stays one even weight. Do not load or request other weights:
- `font-light` / `font-normal` / `font-medium` all render at 400.
- Avoid `font-semibold` / `font-bold` on new UI — the browser fakes bold by smearing the 400 glyphs. Create hierarchy with size and colour (`text-text-primary` vs `text-text-secondary` / `text-text-muted`) instead.

Fallback stack: `Urbanist, system-ui, sans-serif`.

Urbanist is a clean, modern geometric sans with open, round letterforms — keep the default line-height and letter-spacing unless a spec below says otherwise.

### Numbers
`font-numeric` (Tailwind alias) and the `<Num>` / `<INR>` components still exist and still add `tabular-nums`, but they now point at Urbanist too, so numbers and text share one face. Keep wrapping KPI values, currency, table numeric cells and badge counts in `<Num>` / `<INR>` — it keeps column alignment intact and lets a dedicated numeric face be reintroduced later in one place (`tailwind.config.js` → `fontFamily.numeric`).

### Typographic scale (Tailwind)
| Use | Size | Notes |
|---|---|---|
| Page title | `text-3xl` | Urbanist 400 |
| KPI value / large number | `text-3xl`–`text-4xl` | `<Num>` (tabular) |
| Section title (inside cards) | `text-lg` | |
| Card title | `text-base` | |
| Body | `text-sm` | |
| Small / meta / footnote | `text-xs` | `text-text-muted` |
| Table header | `text-xs uppercase tracking-wider` | |
| Table numeric cell | `text-sm` | `<Num>` (tabular) |
| Nav item | `text-sm` | |
| Chart axis label | 12px | `AXIS_TEXT` / `AXIS_NUM` in `components/dashboard/chartBits.tsx` |

---

## Color tokens

### Brand — the gradient
The brand identity is the **blue-to-green gradient** from `#3A90C3` (brand blue) to `#44BE4A` (brand green). It appears on the logo mark, primary buttons, active nav pill, primary chart series, and key emphasis moments.

**Gradient definitions:**
```css
/* Horizontal — buttons, nav pill, badges */
background: linear-gradient(90deg, #3A90C3 0%, #44BE4A 100%);

/* Diagonal — logo mark, hero KPI accents */
background: linear-gradient(135deg, #3A90C3 0%, #44BE4A 100%);
```

**Solid brand colors:**
- `brand.blue` = **#3A90C3**
- `brand.green` = **#44BE4A**

**Tinted backgrounds:**
- `brand.blueTint` = **#3A90C315**
- `brand.greenTint` = **#44BE4A15**
- `brand.gradientTint` = `linear-gradient(90deg, #3A90C310 0%, #44BE4A10 100%)`

### Neutral scale
| Token | Hex | Use |
|---|---|---|
| `bg` | `#FFFFFF` | Page background — pure white everywhere |
| `surface` | `#FFFFFF` | Cards, modals, table rows, kanban cards |
| `surface.alt` | `#F9FAFB` | Table header row, kanban column background, subtle hover fills, secondary surfaces |
| `border` | `#E5E7EB` | Only used on inputs, table dividers, table header borders. NOT on cards. |
| `border.strong` | `#D1D5DB` | Input focus border (when not brand-colored) |
| `text.primary` | `#0F172A` | Headings, body copy |
| `text.secondary` | `#64748B` | Subtitles, secondary content, inactive nav |
| `text.muted` | `#94A3B8` | Placeholders, footnotes, table headers |

### Semantic colors
| Token | Hex | Use |
|---|---|---|
| `success` | `#10B981` | Won stage, Active status, positive delta, Accepted quote |
| `warning` | `#F59E0B` | Missing price, Qualified stage |
| `danger` | `#EF4444` | Lost stage, delete buttons, negative delta, Rejected quote |
| `info` | `#3B82F6` | New stage, Sent quote status |
| `purple` | `#8B5CF6` | Quoted stage, Super Admin role |

### Role colors (Phase 7)
| Role | Color |
|---|---|
| Super Admin | `#8B5CF6` (purple) |
| Admin | `#3A90C3` (brand blue) |
| Purchase | `#64748B` (slate) |

### Chart palette
Use this exact order for chart series:
1. `#3A90C3` (brand blue)
2. `#44BE4A` (brand green)
3. `#8B5CF6` (purple)
4. `#F59E0B` (amber)
5. `#EF4444` (red)
6. `#64748B` (slate)

---

## Shadows (critical — this is how cards separate from the page)

Since cards are borderless on a white background, shadows do all the visual separation. Use these exact tokens:

```css
/* Standard card — soft, low-hanging shadow */
--shadow-card: 0 2px 8px -2px rgba(15, 23, 42, 0.06),
               0 4px 16px -4px rgba(15, 23, 42, 0.04);

/* Elevated / hovered card */
--shadow-card-hover: 0 4px 16px -4px rgba(15, 23, 42, 0.10),
                     0 8px 32px -8px rgba(15, 23, 42, 0.06);

/* Modal */
--shadow-modal: 0 24px 48px -12px rgba(15, 23, 42, 0.18);

/* Dropdown / popover / product picker results */
--shadow-dropdown: 0 8px 24px -8px rgba(15, 23, 42, 0.12);

/* Circular icon button */
--shadow-icon-btn: 0 1px 3px 0 rgba(15, 23, 42, 0.05);

/* Kanban card being dragged */
--shadow-drag: 0 12px 32px -8px rgba(58, 144, 195, 0.25);
```

Expose these in `tailwind.config.ts` as `boxShadow.card`, `boxShadow.cardHover`, `boxShadow.modal`, `boxShadow.dropdown`, `boxShadow.iconBtn`, `boxShadow.drag`.

Never use `shadow-lg` / `shadow-xl` presets from Tailwind — they are too harsh for this design language. Always use the tokens above.

---

## Glassmorphism (cards)

Content cards use a frosted-glass treatment instead of flat opaque white. This applies to: the generic `Card` component, KPI/stat cards (dashboard, Tickets, Master File, Quote, Users), table/board wrapper cards, and dashboard widget cards (charts, Quote expiry alerts, Team workload).

```
glass rounded-3xl            (dashboard widgets add `lift` for a 3px hover rise)
```

`.glass` and `.lift` are defined in `app/globals.css` under `@layer components`: a white 60%→32% diagonal gradient, `blur(24px) saturate(170%)`, a 1px white/65 border, an inset white top highlight, and a soft teal-tinted drop shadow. `rounded-3xl` is 20px. Keep it this translucent — at 85%+ white the cards read as plain white and the glass effect disappears.

Tinted stat cards (which already use a translucent hex background like `bg-[#3A90C318]`) keep their tint color and layer `backdrop-blur-xl border border-white/40` on top — the blur is what reads as "glass," the tint stays the accent color.

**Glass variants (all in `app/globals.css`, `@layer components`):**
- `.glass` — page cards, stat tiles, table/board wrappers, tab pills, skeleton cards, login card.
- `.glass-pop` — floating overlays that are *not* modals: UserMenu, NotificationPanel, SearchPanel, filter popovers, PriceCell popover, chart tooltips, toasts. More opaque (94%→80%) so text stays crisp over busy content.
- `.glass-tile` — cards nested inside a glass surface: kanban ticket/project cards, pipeline tiles. Kanban lanes (CRM stage columns, ticket status columns) use `.glass-lane` — a firmer cool-tinted lane so it reads against the board and the white cards read against it.
- `.glass-control` — inputs, selects, secondary buttons, icon buttons (`bg-white/70` + 8px blur). On a white modal they render identically to solid white.

**Do NOT apply glass to:** modals (`components/ui/Modal.tsx` and every `*Modal`) or the slide-over detail panels (TicketPanel, ProjectPanel, CustomerDetailPanel) — these stay solid `bg-white`.

**Toasts:** sonner `<Toaster richColors>` in `app/layout.tsx`; its `--normal-*`, `--success-*`, `--error-*`, `--warning-*`, `--info-*` variables are set to translucent tints and each toast gets `.glass-pop` for the blur. Every mutation shows a success or error toast; optimistic updates (kanban moves, deletes) revert and toast on failure.

**Skeletons:** never show plain "Loading…" text. Use `Skeleton`, `SkeletonTableRows` (table bodies) or `SkeletonList` (lists/panels) from `components/ui/Skeleton.tsx`, or a page skeleton (`TablePageSkeleton`, `DashboardSkeleton`, `TicketsSkeleton`, `ProjectsSkeleton`, `AuditPageSkeleton`). Skeleton bars are `bg-text-primary/[0.07]` so they read on glass.

For the blur to actually read as glass there must be real colour behind the cards. `.app-aurora` (in `globals.css`, rendered once by `LayoutShell` and by the login page) is a fixed full-screen field: a pale blue-green base gradient plus five large radial glows — brand blue top-right and bottom-right, brand green bottom-left, teal centre, soft periwinkle top-left — drifting slowly (28s, disabled under `prefers-reduced-motion`). Do not remove or mute it; without it the glass cards look identical to flat white. Inside glass cards avoid solid fills: table header rows are `bg-white/35`, row hover `bg-white/50`.

---

## Layout

- **Page background:** the `.app-aurora` colour field (see Glassmorphism above).
- **Sidebar:** fixed dark glass panel on the left at `lg` and up; content is offset with `lg:pl-[272px]`. See Component specs.
- **Header:** floats top-right on desktop, level with the page title (no extra row); a glass bar with hamburger on mobile.
- **Content padding (side gaps are always equal):** `px-4` (16px) on phones, `sm:px-6` (24px) on tablets, and on desktop the content starts at the sidebar's right edge (`lg:pl-[260px]` expanded / `lg:pl-[88px]` collapsed) then pads `lg:px-6` — 24px from the sidebar and 24px from the window edge. The header uses the exact same offsets so its right edge lines up with the cards. Pages must not add their own horizontal padding on their outer wrapper. Content is capped at `max-w-[1860px] mx-auto`.
- **Grid gap:** `gap-4` (16px) between cards, `gap-3` (12px) for tight rows, `gap-6` (24px) between major sections.

### Border radius
- Cards, modals, kanban cards: **`rounded-2xl`** (16px) — premium feel.
- Bigger feature containers (e.g., the whole Kanban board wrapper, dashboard hero card if any): `rounded-[20px]`.
- Buttons (rectangular): `rounded-lg` (8px). Buttons in nav / pill-style: `rounded-full`.
- Inputs, selects: `rounded-lg` (8px). Search-style inputs in top nav: `rounded-full`.
- Badges, pills, small chips: `rounded-md` (6px). Role badges and status badges: `rounded-full` for extra premium look.
- IconTiles: `rounded-xl` (12px).
- Avatars, circular icon buttons: `rounded-full`.
- Logo mark: `rounded-xl` (12px).

### Borders (used sparingly)
- Cards: `border-white/60` (or `/40` for tinted stat cards) as part of the glass treatment — see Glassmorphism above. Non-card surfaces (nav, dropdowns, modals) stay borderless, relying on shadow.
- Inputs, selects: 1px border in `#E5E7EB`; on focus, transition to `#3A90C3`.
- Table dividers (row-to-row): 1px `#E5E7EB` — kept because tables need row separation.
- Circular icon buttons: 1px `#E5E7EB` — very subtle to define the shape on white background.
- Modals: no border (shadow is enough).

---

## Component specs

### Sidebar + header (`components/layout/Sidebar.tsx`, `TopNav.tsx`)
- **Sidebar (lg+):** `fixed left-3 top-3 bottom-3 w-[248px] rounded-[28px] bg-sidebar-gradient backdrop-blur-2xl border-white/10 shadow-sidebar text-white` — dark teal smoked glass (80–88% opaque) with a brand-blue glow top-left and brand-green glow at the bottom; the aurora tints through it.
  - Top: logo in a 40px white `rounded-xl` tile, "Infinite" / "Automation workspace" (`text-white/55`).
  - Nav grouped under `text-[11px] uppercase tracking-[0.12em] text-white/40` labels: **Workspace** (Dashboard, CRM, Customers, Quote), **Catalogue** (Master File, Procurement), **Admin** (Users, Audit Log — gated by `can()`).
  - Item: `h-10 px-3 rounded-xl text-sm`, 28px icon tile + label + optional count pill (`font-numeric`). Inactive `text-white/75 hover:bg-white/10`; active `bg-white text-[#0E2533]` with a soft drop shadow and a `bg-brand-gradient` icon tile.
  - Footer: "New quote" card (`bg-white/10 border-white/15 rounded-2xl`) linking to `/quote?new=1`, then the signed-in user card linking to `/profile`.
  - **Collapse:** a toggle next to the logo shrinks the sidebar to a 76px icon rail (group labels become thin dividers, counts become a green dot, labels move to tooltips). State lives in `useSidebarStore` (persisted to localStorage); content offset switches between `lg:pl-[260px]` and `lg:pl-[88px]` (the sidebar's right edge).
- **Header:** on desktop it takes no row of its own — the action strip (date pill in `glass`, Search, Bell, gradient avatar → UserMenu) floats top-right, level with the page title, so page content starts right at the top (`lg:pt-5`). Page title rows therefore must not put buttons on the right; put page actions below the subtitle or in the card toolbar. On mobile it is a `glass rounded-2xl` bar with hamburger + logo; the hamburger opens the same nav (`NavLinks`) in a `bg-sidebar-gradient` panel.

### UserMenu (dropdown from top-right avatar)
- Positioned absolute below the avatar, `mt-2 right-0`, width 260px, `rounded-2xl bg-white shadow-dropdown p-2 z-50`.
- Top block (padding 3, border-b `#E5E7EB`, `pb-3 mb-2`):
  - Small row: 40px avatar + name (`text-sm` weight 400) and email (`text-xs text-muted`) on the right of it.
  - Below: RoleBadge showing the user's role.
- Menu items (`px-3 py-2 rounded-lg text-sm text-primary hover:bg-[#F9FAFB] flex items-center gap-2`):
  - "Profile" (User icon) — placeholder in Phase 1, wire up in Phase 6
  - "Settings" (Settings icon) — placeholder
  - Divider (`my-2 border-t border-[#E5E7EB]`)
  - "Sign out" (LogOut icon, text `text-danger`) — placeholder in Phase 1, real logout in Phase 6

### Circular icon button
- 40x40 `rounded-full`, `bg-white`, `border border-border`, `shadow-iconBtn`.
- Icon centered, 18px, `text-secondary`.
- Hover: background `#F9FAFB`, icon `text-primary`.
- Active/pressed: background `brand.gradientTint`, icon `#3A90C3`.
- Notification indicator dot: 8x8 rounded-full solid brand-blue, absolute top-1 right-1, with 1px white ring.

### Buttons (rectangular)
- **Primary:** `bg-gradient-to-r from-brand-blue to-brand-green` white text, `rounded-lg`, `px-4 py-2`, `text-sm`, weight 400. Hover: opacity 90%. Optional lucide icon on the left (16px).
- **Secondary:** white background, `border border-border`, text `text-primary`. Hover: background `#F9FAFB`.
- **Danger:** solid `#EF4444`, white text.
- **Ghost:** transparent, text `text-secondary`. Hover background `#F9FAFB`.
- **Sizes:** sm (`px-3 py-1.5 text-xs`), md (`px-4 py-2 text-sm`), lg (`px-5 py-2.5 text-sm`).
- **Disabled:** opacity 50%, `cursor-not-allowed`.
- **Rounded variant:** for pill-shaped CTAs (e.g., inside cards), use `rounded-full` instead of `rounded-lg`.

### Inputs / Selects
- White background, `border border-border`, `rounded-lg`, `py-2.5 px-3`, `text-sm`.
- On focus: border color `#3A90C3`, no ring.
- Placeholder: `text-muted`.
- Leading icon: absolute lucide icon at 16px in `text-muted`, input gets `pl-9`.
- Search input in top nav uses `rounded-full` and slightly larger padding.
- **Never use a native `<select>`** — the browser draws its own OS menu that ignores the design system. Use `<Select>` from `components/ui/Select.tsx` everywhere (pages, modals, panels). It takes the same `<option value>` children and `onChange={(e) => …e.target.value}` handler as a native select, plus optional `label`, `disabled`, `title`, `className` (styles the trigger; defaults to the standard control).
  - Trigger: the control styles above + a `ChevronDown` that rotates when open; width stays fixed at the longest option, like a native select.
  - List: `glass-pop rounded-xl p-1`, portalled to `<body>` at `z-[100]` so modals and panels never clip it; opens upward when there's no room below. Selected option is `text-brand-blue` with a check; hovered/keyboard row is `bg-brand-blue/10`.
  - Options whose value starts with `__` or label starts with `+` (e.g. "+ Add new brand") render as blue actions below a divider.
  - Keyboard: ↑/↓, Home/End, Enter/Space, type-ahead, Escape closes the list without closing the surrounding modal.
- **Never use a native `<input type="date">`** — use `<DatePicker>` from `components/ui/DatePicker.tsx`. Same contract: `value` is a `YYYY-MM-DD` string (or `""`), `onChange={(e) => …e.target.value}`; optional `label`, `disabled`, `placeholder`, `className`, `aria-label`.
  - Trigger: standard control showing the date as "30 Oct 2026" (or a muted placeholder) with a `CalendarDays` icon.
  - Calendar: 288px `glass-pop rounded-2xl` popover (same portal/flip behaviour as `<Select>`, via `useAnchoredPopover`), month header with ‹ › arrows, Monday-first week, selected day `bg-brand-gradient text-white`, today ringed in brand blue, other-month days muted. Footer: **Clear** and **Today**.
  - Keyboard: arrows move by day/week, PageUp/PageDown by month (Shift = year), Home/End to week start/end, Enter/Space picks, Escape closes without closing the modal.

### Cards
- Glass treatment (`bg-white/70 backdrop-blur-xl border border-white/60`), `rounded-2xl`, `shadow-card`, `p-6` default. Compact stat cards may use `p-5`. See Glassmorphism section above.
- Hover on interactive cards (e.g., TicketCard, KpiCard when clickable): `shadow-cardHover`, no border change.
- **KPI / stat cards everywhere use `<StatCard>` (`components/ui/StatCard.tsx`)** — Dashboard, CRM, Complaints, Tickets, Quote, Master File, Kits, Customers, Users, Audit. All start as plain glass with no tint or coloured left border; hover (or keyboard focus on linked cards) fades in the diagonal brand gradient (a separate layer, since gradients can't transition) and turns the label, number and footer white; the icon tile turns white too. No card is pre-highlighted. Don't hand-build stat cards. Each card has a gradient icon tile beside its title (`icon` prop);
  - A card can also be a button: pass `onClick` (and `active` for the current one, which gets a thin brand ring) when it doubles as a filter shortcut — the Complaints cards switch the table tab.
- **Depth, not flat:** surfaces are layered — `.glass` has a top-left sheen, a three-step shadow (contact, mid, far) and an inner bottom shade; `.glass-tile`/`.glass-control` are raised with their own shadows; `.glass-lane` is recessed (inset shadow); primary buttons use `shadow-btn` and lift on hover; modals use the heavier `shadow-modal`. The aurora behind is deliberately saturated so the glass has colour to refract. Don't add flat white boxes — use one of these surfaces.
- **Chat backdrop:** the CRM and Ticket chat feeds sit on `<ChatBackdrop />` (`components/chat/ChatBackdrop.tsx`) — a live, looping liquid gradient (brand blue / green / teal / violet) drawn by a tiny WebGL shader at half resolution, ~30fps, paused while the tab is hidden and frozen under `prefers-reduced-motion`. It looks like a gradient video but is rendered live, so there's no file to load. The `.chat-fluid` CSS blobs in `globals.css` stay underneath as the fallback if WebGL isn't available. Never call `loseContext()` in its cleanup (React strict mode re-runs the effect on the same canvas). Date labels sit on a small white pill so they stay readable over it. Keep new colours inside the brand family and soft (pastel, blended ≥ 38% toward the light base).
- **Sidebar:** when collapsed, hovering or focusing the logo opens it over the page (content doesn't shift) and leaving the sidebar closes it; clicking the logo pins it open (there is no expand button while collapsed). When open, a collapse button sits next to the logo and the logo links to the dashboard.
- Non-interactive cards stay static on hover.

### Modals
- Centered, `bg-white`, no border, `rounded-2xl`, `shadow-modal`.
- Max widths: sm `max-w-md`, md `max-w-2xl`, lg `max-w-4xl`, xl `max-w-6xl`.
- Header `px-6 py-5`, bottom border 1px `#E5E7EB`, close (X) circular icon button on the right.
- Body `p-6`, scrollable, `max-h-[85vh]`.
- Footer `px-6 py-4`, top border 1px `#E5E7EB`, buttons right-aligned, `gap-2`.
- Backdrop: `bg-slate-900/40 backdrop-blur-sm`.

### Tables
- Full-width. Header row `bg-surface.alt`, no top/side border. Header text `text-xs uppercase tracking-wider text-muted`, `px-4 py-3`.
- Row divider `border-t border-border`. Hover row `bg-[#F9FAFB]/60`.
- Cell padding `px-4 py-3`, `text-sm`.
- No zebra striping.
- Wrap the table in a card (`bg-white rounded-2xl shadow-card overflow-hidden`) — the toolbar sits above the table but inside the card.
- Empty state: centered "No X found" in muted color, `py-12`.

### Badges
- Standard: `inline-flex items-center px-2.5 py-1 rounded-full text-xs`. Yes — `rounded-full` on badges to match the premium pill style.
- Colored badge: background = colorHex + `18` (opacity ~10%), border = none (badges are borderless in this system), text = solid colorHex.
- Status Active/Inactive uses success/muted respectively.

### IconTiles
- 44x44 `rounded-xl` square (slightly larger than before to match the airier design).
- **Default:** background `brand.gradientTint`, icon color `#3A90C3`, icon size 22.
- **Semantic:** if tile represents a semantic value (success/warning/danger), use that color's `+18` opacity for bg and solid for icon.

### Avatar (component)
- Sizes: xs 24, sm 32, md 40, lg 48, xl 64. All `rounded-full`.
- If a photo URL is provided, use it. Otherwise: solid brand blue background, white initials from `full_name` via `initials(name)` util (max 2 chars, uppercase), font weight 400 sized proportionally.
- Optional right-bottom status dot: 8x8 rounded-full, green for online / gray for offline. Skip in Phase 1.

### Avatar stack (Phase 3)
- Horizontal row of overlapping Avatars, each with `ring-2 ring-white` for the overlap effect and negative left margin (`-ml-2` from the second onward).
- Under each avatar: a small `rounded-full` count badge (18px min-width, `text-[10px]` weight 400, white text, colored background using the semantic palette based on load — green for light, amber medium, red heavy, or just brand-blue if using a single accent).
- If more than N (e.g., 6) avatars, collapse extras into a final "+X" avatar tile with `bg-surface.alt text-secondary`.

### Kanban board (Phase 3 — Tickets)
- Board wrapper: white card (`bg-white rounded-2xl shadow-card p-6`). Inside:
  - Board header row (flex justify-between, mb-6):
    - Left: "Ticket Pipeline" title (`text-lg` weight 400) with ticket count in `text-xs text-muted` underneath.
    - Center: **AssigneeStack** — horizontal avatar stack of all support staff assigned to any ticket, each with a count badge showing how many tickets that person owns. Clicking an avatar filters the board to that assignee (toggle). Selected avatar gets a `ring-2 ring-brand-blue`.
    - Right: circular icon buttons — Add (Plus, primary style: gradient background instead of white, icon white), Export (Download), Filter (SlidersHorizontal). The Add button is the eye-catcher.
  - Columns row (`flex gap-4 overflow-x-auto pb-2`).
- **Column**:
  - Fixed width `w-80`, min-height `min-h-[560px]`, background `#F9FAFB`, `rounded-2xl`, `p-3`.
  - Column header (flex row, `px-2 py-2 mb-2`):
    - Left: colored dot (`w-2 h-2 rounded-full` in status color) + status name (`text-sm` weight 400 text-primary) + count in a small pill (`ml-2 text-[10px] text-muted bg-white rounded-full px-2 py-0.5`).
    - Right: ghost Plus icon button (opens new-ticket modal with this status preselected).
  - Card list: `space-y-2`.
  - Drop zone when a card is dragged over: background changes to `brand.blueTint`, and an inset dashed border `border-2 border-dashed border-brand-blue rounded-2xl` appears around the column.
- **TicketCard**:
  - `bg-white rounded-2xl shadow-card p-4 cursor-grab`, no border.
  - Row 1: ticket subject (`text-sm` weight 400 text-primary) on the left, priority badge on the right.
  - Row 2 (`mt-1`): contact name + company (`text-xs text-secondary`).
  - Row 3 (`mt-3`): category pill on the left, tiny date pill on the right (`text-[10px] text-muted bg-[#F9FAFB] rounded-full px-2 py-0.5`).
  - Row 4 (`mt-3 pt-3 border-t border-[#E5E7EB]`): small Avatar (xs, 24px) + assignee name (`text-xs text-secondary`) on the left; three-dot menu icon button on the right (ghost circular).
  - Hover: `shadow-cardHover`.
  - Dragging: `shadow-drag`, `scale-[1.02]`, opacity 95%, no rotation.
- Cross-column drag with @dnd-kit updates the ticket's status. No intra-column reordering.

### Cascading product picker (Phase 4)
A single row of three linked selects with an Add button. All elements share the same height (`py-2.5`) and align in a row (`flex gap-2 items-end`).
- **Brand select** — options: unique brands with at least one active product. Default label "Choose brand".
- **Category select** — disabled until Brand chosen. Options: categories under the chosen brand only. Default label "Choose category".
- **Product select** — disabled until Category chosen. Options: active products in that brand+category, each labelled `Name — ₹Price`. Default label "Choose product".
- **Add button** — primary gradient, Plus icon, disabled until Product chosen. On click: append the product to the current section (qty 1, price copied, discount 0), then reset the three selects.
- Sits above the section's items table, inside the section card.

### Quote section blocks (Phase 4)
- Each section is a `bg-white rounded-2xl shadow-card p-5` container. No border.
- Header row (flex justify-between mb-4): drag handle (GripVertical, text-muted) + section number pill (`w-8 h-8 rounded-full bg-gradient-to-r from-brand-blue to-brand-green grid place-items-center text-white text-sm` weight 400) + editable section-name input (borderless, transparent bg, `text-lg` weight 400). Right: section subtotal (INR, weight 400) + delete section ghost circular button (Trash icon, danger color on hover).
- Cascading picker row (see above) sits below the header.
- Items table below the picker (standard table styles). Sr. No column shows `sectionNo.itemIdx` (1.1, 1.2, etc).

### RoleBadge (Phase 7)
Standard Badge component with the role color from the table above. Rounded-full pill style.

### Charts (recharts)
- Grid `strokeDasharray="3 3"` `#E5E7EB`.
- Axis text `#94A3B8` size 12, Urbanist.
- Tooltip: white bg, `rounded-xl`, `shadow-dropdown`, no border, `text-primary text-xs`, `p-3`.
- Legend text `text-secondary text-xs`.
- Lines: `strokeWidth={2.5}`, dots `r={4}`.
- Bars: `radius={[8, 8, 0, 0]}` (slightly rounder for the premium feel).
- Pie/donut: `innerRadius={50} outerRadius={85} paddingAngle={3}`.

### PDF (print view)
- Fonts: `'Urbanist', Arial, sans-serif` for everything, loaded with a Google Fonts link (`family=Urbanist`). Wrap numeric cells and totals in a `<span class="num">` styled `.num { font-family: 'Urbanist', system-ui, sans-serif; font-weight: 400; font-variant-numeric: tabular-nums; }` so columns line up.
- Header bottom border: **solid `#3A90C3` 3px** (no gradient — print engines unreliable).
- Section header rows in items table: solid `#3A90C3`, white text.
- Grand total: solid `#44BE4A`, weight 400, larger size.
- Otherwise black on white typography.

---

## Tailwind config additions

Under `theme.extend`:

```ts
theme: {
  extend: {
    fontFamily: {
      sans: ['var(--font-fredoka)', 'system-ui', 'sans-serif'],
      numeric: ['var(--font-montserrat)', 'ui-monospace', 'system-ui', 'sans-serif'],
    },
    fontWeight: {
      light: '300',
      normal: '400',
    },
    colors: {
      brand: {
        blue: '#3A90C3',
        green: '#44BE4A',
      },
      surface: {
        DEFAULT: '#FFFFFF',
        alt: '#F9FAFB',
      },
      border: {
        DEFAULT: '#E5E7EB',
        strong: '#D1D5DB',
      },
      text: {
        primary: '#0F172A',
        secondary: '#64748B',
        muted: '#94A3B8',
      },
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      info: '#3B82F6',
      purple: '#8B5CF6',
    },
    backgroundImage: {
      'brand-gradient': 'linear-gradient(90deg, #3A90C3 0%, #44BE4A 100%)',
      'brand-gradient-diag': 'linear-gradient(135deg, #3A90C3 0%, #44BE4A 100%)',
      'brand-gradient-tint': 'linear-gradient(90deg, #3A90C310 0%, #44BE4A10 100%)',
    },
    boxShadow: {
      card: '0 2px 8px -2px rgba(15, 23, 42, 0.06), 0 4px 16px -4px rgba(15, 23, 42, 0.04)',
      cardHover: '0 4px 16px -4px rgba(15, 23, 42, 0.10), 0 8px 32px -8px rgba(15, 23, 42, 0.06)',
      modal: '0 24px 48px -12px rgba(15, 23, 42, 0.18)',
      dropdown: '0 8px 24px -8px rgba(15, 23, 42, 0.12)',
      iconBtn: '0 1px 3px 0 rgba(15, 23, 42, 0.05)',
      drag: '0 12px 32px -8px rgba(58, 144, 195, 0.25)',
    },
    borderRadius: {
      '2xl': '16px',
    },
  },
}
```

Font loading (`app/layout.tsx`):
```ts
import { Urbanist } from 'next/font/google';

const urbanist = Urbanist({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-urbanist',
});

// on <html>: className={urbanist.variable}
```

`globals.css`:
```css
body {
  font-family: var(--font-urbanist), system-ui, sans-serif;
  font-weight: 400;
  background: linear-gradient(180deg, #F7FAFB 0%, #EEF5F7 100%) fixed;
  color: #0F172A;
}
```

---

## What NOT to do

- Do NOT use borders on cards. Shadows only.
- Do NOT use Tailwind's `shadow-lg`, `shadow-xl`, `shadow-2xl` presets. Use the custom `shadow.card`, `shadow.cardHover`, `shadow.modal`, `shadow.dropdown` tokens.
- Do NOT use dark backgrounds anywhere.
- Do NOT use orange, red, or any color outside this file's tokens (except semantic colors for their intended purpose).
- Do NOT use font weights other than 300 and 400.
- Do NOT use any font other than Urbanist, and do not load weights other than 400.
- Do NOT use `font-semibold` / `font-bold` for hierarchy — only 400 is loaded, so the browser fakes bold. Use size and colour.
- Do NOT apply gradients to full page or full card backgrounds. Gradients are reserved for: logo mark, primary buttons, active nav pill, section number pills, print-header accent.
- Do NOT use emojis in UI copy.
- Do NOT use rounded-full on rectangular content containers (only on avatars, badges-when-specified, and pill buttons/inputs).
- Do NOT use borders thicker than 1px except the 3px print-header brand line.
- Do NOT use zebra striping in tables.
- Do NOT apply gradients to text.
- Do NOT allow a category in the quote picker that has no products under the selected brand.
