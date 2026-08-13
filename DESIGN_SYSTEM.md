# DESIGN_SYSTEM.md

The single source of truth for all visual design in the Infinite Automation Dashboard. Every component, page, and phase must follow this file.

Do NOT deviate from these tokens. If a screen calls for something not covered here, ask before inventing new tokens.

The overall feel to aim for: **premium, airy, modern SaaS**. Think Linear or a polished CRM. Lots of whitespace, borderless cards floating on white with soft shadows, generous radius, calm typography.

---

## Typography

**Primary font family:** Fredoka — loaded via `next/font/google`. Used for all text (headings, body, labels, buttons, nav, everything).

**Numeric font family:** Montserrat — loaded via `next/font/google`, weight **500 (Medium) only**. Used exclusively for numbers where numeric precision reads better in a crisp neutral face: KPI values, currency amounts, quote totals, table numeric cells, chart axes and tooltips, badge counts, stat card numbers. Never use Montserrat for prose or labels.

Fredoka weights used: **300 (Light)** and **400 (Regular)**.
Montserrat weight used: **500 (Medium)** only.

No other weights of either font (no 500/600/700 of Fredoka, no 300/400/600 of Montserrat).

Fallback stacks:
- Fredoka: `Fredoka, system-ui, -apple-system, sans-serif`
- Montserrat: `Montserrat, ui-monospace, system-ui, sans-serif`

Fredoka has slightly rounded, friendly geometry. Because of its softness, avoid packing it too tight — use the default line-height and letter-spacing everywhere unless a spec below says otherwise. Montserrat Medium sits well next to Fredoka because its neutrality lets the numbers do the work without competing.

### When to use Montserrat (rules — not preferences)
Use Montserrat Medium for:
- Dashboard KPI values (the big `text-3xl` numbers)
- Any monetary amount rendered by `formatINR` (in tables, cards, modals, quote totals, PDF totals)
- Stat card numeric values (Total products, Active count, etc.)
- Quote subtotal, GST, grand total lines
- Table cells that are purely numeric: Sr No, Qty, Discount %, Line total, HSN Code, Value, Count columns
- Chart axis tick labels and tooltip numeric values
- Badge count numbers (e.g., column count pill on Kanban, "+3" avatar overflow, notification indicator when it shows a number)
- Section number pill in quote sections (the "1", "2", "3" pills)
- Auto-generated Sr. No (1.1, 1.2, 2.1) inside quote sections

Do NOT use Montserrat for:
- Product names, category names, brand names (Fredoka)
- Labels above numbers like "Revenue Pipeline", "Total value" (Fredoka)
- Any prose, sentence, or descriptive text (Fredoka)
- Buttons, nav items, badges' text portion (Fredoka)
- Dates rendered as text like "2 hours ago", "Mar", "Aug" chart axis month labels — these are text, use Fredoka. (Pure date columns like "2026-08-13" can go either way; default to Fredoka unless it reads clumsily beside Montserrat numbers nearby, in which case use Montserrat for date consistency in that column.)

### How to apply Montserrat in code
Expose Montserrat as a Tailwind font family alias `font-numeric`:

```ts
// tailwind.config.ts
fontFamily: {
  sans: ['var(--font-fredoka)', 'system-ui', 'sans-serif'],
  numeric: ['var(--font-montserrat)', 'ui-monospace', 'system-ui', 'sans-serif'],
}
```

Then wherever a number belongs, add the class `font-numeric font-medium` (Tailwind `font-medium` maps to weight 500).

Prefer a small `<Num>` component at `/components/ui/Num.tsx` that renders `<span className="font-numeric font-medium tabular-nums">{children}</span>` so number columns line up nicely (tabular-nums keeps digit widths equal — important for tables and totals). Update `formatINR` callers to wrap their output in `<Num>`, or better — have `formatINR` return a React element rather than a string (rename to `<INR value={n} />` component if a refactor is easy). Either approach is acceptable; pick one and be consistent.

### Typographic scale (Tailwind)
| Use | Class | Font & weight |
|---|---|---|
| Page title (big, bold-looking) | `text-3xl` | Fredoka 300 (light) — reads as friendly premium heading |
| KPI value / large number | `text-3xl` | **Montserrat 500 (font-numeric font-medium)** |
| Section title (inside cards) | `text-lg` | Fredoka 400 (regular) |
| Card title | `text-base` | Fredoka 400 (regular) |
| Body | `text-sm` | Fredoka 400 (regular) |
| Small / meta / footnote | `text-xs` | Fredoka 400 (regular) |
| Table header | `text-xs uppercase tracking-wider` | Fredoka 400 (regular) |
| Table numeric cell | `text-sm` | **Montserrat 500 tabular-nums** |
| Nav item | `text-sm` | Fredoka 400 (regular) |
| Chart axis label | 12px | **Montserrat 500** |

Letter spacing default. Line height default.

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
| Staff | `#64748B` (slate) |

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

## Layout

- **Page background:** `#FFFFFF` (pure white — everywhere).
- **Top nav:** `72px` tall, white background, no bottom border, `shadow-card` (subtle bottom shadow to lift off page).
- **Content padding:** `p-8` (32px). On larger screens, cap main content width at `max-w-[1600px] mx-auto`.
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
- Cards: **NO border**. Rely on shadow.
- Inputs, selects: 1px border in `#E5E7EB`; on focus, transition to `#3A90C3`.
- Table dividers (row-to-row): 1px `#E5E7EB` — kept because tables need row separation.
- Circular icon buttons: 1px `#E5E7EB` — very subtle to define the shape on white background.
- Modals: no border (shadow is enough).

---

## Component specs

### Top navigation bar (replaces sidebar)
- 72px tall, sticky top, white background, `shadow-card`. Full width. Inner padding `px-8`.
- Three horizontal zones inside a `max-w-[1600px] mx-auto flex items-center justify-between`:
  - **LEFT** — Logo group:
    - Logo mark: 36x36 `rounded-xl` square with diagonal brand gradient, white "IA" centered (Barlow 400, ~18px).
    - Wordmark to the right: "Infinite Automation" in one line, `text-base` weight 400 `text-primary`. No tagline underneath in the nav (saves vertical space).
  - **CENTER** — Nav items in a horizontal row (`flex items-center gap-1`):
    - Five items: Dashboard, CRM, Quote, Master File, Users. Icon-less in the nav (labels only) — icons already on the pages.
    - Each item: `px-4 py-2 rounded-full text-sm` weight 400. Cursor pointer.
    - **Inactive:** `text-secondary` (#64748B), hover background `#F9FAFB`, hover text `text-primary`.
    - **Active:** background `bg-brand-gradient` (horizontal blue-green gradient), text white, no shadow. The pill visually pops as the brand accent.
  - **RIGHT** — Action strip (`flex items-center gap-2`):
    - Search circular icon button (Search icon)
    - Notifications circular icon button (Bell icon) with a small solid brand-blue dot indicator top-right
    - User avatar button (36x36 rounded-full) — solid brand blue background, white initials from user's full name (e.g., "UR"), `text-xs` weight 400. Clicking opens the UserMenu dropdown.

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

### Cards
- `bg-white`, **no border**, `rounded-2xl`, `shadow-card`, `p-6` default. Compact stat cards may use `p-5`.
- Hover on interactive cards (e.g., LeadCard, KpiCard when clickable): `shadow-cardHover`, no border change.
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

### Sidebar (deprecated)
There is no left sidebar in this design. All navigation lives in the top nav. Do not create a Sidebar component.

### Kanban board (Phase 3)
- Board wrapper: white card (`bg-white rounded-2xl shadow-card p-6`). Inside:
  - Board header row (flex justify-between, mb-6):
    - Left: "Lead Pipeline" title (`text-lg` weight 400) with lead count in `text-xs text-muted` underneath.
    - Center: **AssigneeStack** — horizontal avatar stack of all salespeople assigned to any lead, each with a count badge showing how many leads that person owns. Clicking an avatar filters the board to that assignee (toggle). Selected avatar gets a `ring-2 ring-brand-blue`.
    - Right: circular icon buttons — Add (Plus, primary style: gradient background instead of white, icon white), Export (Download), Filter (SlidersHorizontal). The Add button is the eye-catcher.
  - Columns row (`flex gap-4 overflow-x-auto pb-2`).
- **Column**:
  - Fixed width `w-80`, min-height `min-h-[560px]`, background `#F9FAFB`, `rounded-2xl`, `p-3`.
  - Column header (flex row, `px-2 py-2 mb-2`):
    - Left: colored dot (`w-2 h-2 rounded-full` in stage color) + stage name (`text-sm` weight 400 text-primary) + count in a small pill (`ml-2 text-[10px] text-muted bg-white rounded-full px-2 py-0.5`).
    - Right: ghost Plus icon button (opens new-lead modal with this stage preselected).
  - Card list: `space-y-2`.
  - Drop zone when a card is dragged over: background changes to `brand.blueTint`, and an inset dashed border `border-2 border-dashed border-brand-blue rounded-2xl` appears around the column.
- **LeadCard**:
  - `bg-white rounded-2xl shadow-card p-4 cursor-grab`, no border.
  - Row 1: lead name (`text-sm` weight 400 text-primary) on the left, segment badge on the right.
  - Row 2 (`mt-1`): company (`text-xs text-secondary`).
  - Row 3 (`mt-3`): value in INR (`text-sm` weight 400 text-primary) on the left, tiny date pill on the right (`text-[10px] text-muted bg-[#F9FAFB] rounded-full px-2 py-0.5`).
  - Row 4 (`mt-3 pt-3 border-t border-[#E5E7EB]`): small Avatar (xs, 24px) + assignee name (`text-xs text-secondary`) on the left; three-dot menu icon button on the right (ghost circular).
  - Hover: `shadow-cardHover`.
  - Dragging: `shadow-drag`, `scale-[1.02]`, opacity 95%, no rotation.
- Cross-column drag with @dnd-kit updates the lead's stage. No intra-column reordering.

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
- Axis text `#94A3B8` size 12, Barlow.
- Tooltip: white bg, `rounded-xl`, `shadow-dropdown`, no border, `text-primary text-xs`, `p-3`.
- Legend text `text-secondary text-xs`.
- Lines: `strokeWidth={2.5}`, dots `r={4}`.
- Bars: `radius={[8, 8, 0, 0]}` (slightly rounder for the premium feel).
- Pie/donut: `innerRadius={50} outerRadius={85} paddingAngle={3}`.

### PDF (print view)
- Fonts: `'Fredoka', Arial, sans-serif` for prose; `'Montserrat', ui-monospace, sans-serif` for all numeric content (Subtotal, GST, Grand total, Qty, Rate, Discount, Line total, Sr. No). Include a Google Fonts link tag loading Fredoka weights 300 and 400, and Montserrat weight 500. Wrap numeric cells and totals in a `<span class="num">` and style `.num { font-family: 'Montserrat', ui-monospace, sans-serif; font-weight: 500; font-variant-numeric: tabular-nums; }`.
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
import { Fredoka, Montserrat } from 'next/font/google';

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['300', '400'],
  variable: '--font-fredoka',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['500'],
  variable: '--font-montserrat',
});

// on <html>: className={`${fredoka.variable} ${montserrat.variable}`}
```

`globals.css`:
```css
body {
  font-family: var(--font-fredoka), system-ui, sans-serif;
  font-weight: 400;
  background: #FFFFFF;
  color: #0F172A;
}
```

---

## What NOT to do

- Do NOT add a left sidebar. All navigation is top nav.
- Do NOT use borders on cards. Shadows only.
- Do NOT use Tailwind's `shadow-lg`, `shadow-xl`, `shadow-2xl` presets. Use the custom `shadow.card`, `shadow.cardHover`, `shadow.modal`, `shadow.dropdown` tokens.
- Do NOT use dark backgrounds anywhere.
- Do NOT use orange, red, or any color outside this file's tokens (except semantic colors for their intended purpose).
- Do NOT use font weights other than 300 and 400.
- Do NOT use any font other than Fredoka (prose) and Montserrat (numbers).
- Do NOT use Montserrat for labels, prose, or any non-numeric text.
- Do NOT use Fredoka for KPI values, totals, or table numeric cells — those are Montserrat 500.
- Do NOT apply gradients to full page or full card backgrounds. Gradients are reserved for: logo mark, primary buttons, active nav pill, section number pills, print-header accent.
- Do NOT use emojis in UI copy.
- Do NOT use rounded-full on rectangular content containers (only on avatars, badges-when-specified, and pill buttons/inputs).
- Do NOT use borders thicker than 1px except the 3px print-header brand line.
- Do NOT use zebra striping in tables.
- Do NOT apply gradients to text.
- Do NOT allow a category in the quote picker that has no products under the selected brand.
