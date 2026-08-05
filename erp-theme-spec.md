text
# ERP Design System — Premium Clinical Theme


**Purpose of this file:** This is the single source of truth for visual design across the ERP.
Any time a new card, form, modal, table, or page is created, generate it using ONLY the tokens
and component rules defined here. Never introduce a new color, font, spacing value, or border
radius that isn't listed below — if something isn't covered, derive it from the nearest existing
token rather than inventing a new one. This keeps every future screen visually consistent
automatically.


---


## 1. Design Direction


A premium academic-medical ERP (NMC medical college administration). The tone is: trustworthy,
precise, calm — closer to a clinical instrument panel than a consumer app. Avoid generic SaaS
defaults (no cream-background/terracotta, no near-black/neon-accent, no flat Bootstrap-blue).
The signature identity is a deep ink-teal + warm brass accent, paired with a structured grid
and quiet, confident typography.


---


## 2. Color Tokens


### Core palette
--color-bg-canvas: #F6F8F9 /* app background, page canvas */
--color-bg-surface: #FFFFFF /* cards, panels, tables, modals */
--color-bg-sunken: #EEF1F3 /* input backgrounds, table stripe, code blocks */
--color-ink-900: #0E2A32 /* primary text, deep ink-teal */
--color-ink-700: #2E4B52 /* secondary text */
--color-ink-500: #5C7278 /* muted text, placeholders */
--color-ink-300: #A8B6B9 /* disabled text, hint icons */
--color-border: #DCE3E5 /* default borders, dividers */
--color-border-strong: #B9C4C7 /* input borders on focus-adjacent states */

--color-primary-900: #0B3B42 /* sidebar bg, headers, primary buttons (hover) */
--color-primary-700: #124A54 /* primary buttons, active nav, links */
--color-primary-500: #1B6873 /* secondary emphasis, icon accents */
--color-primary-100: #DCEEF0 /* primary tint backgrounds, selected rows */

--color-accent-brass: #B8863B /* premium accent — CTAs, active toggle, key stats */
--color-accent-brass-light: #F1E4C8 /* accent tint background */

--color-success: #2F8A5B
--color-success-tint: #E4F5EC
--color-warning: #C9862B
--color-warning-tint: #FBF0DF
--color-danger: #C7433F
--color-danger-tint: #FBE7E6
--color-info: #2C6E9E
--color-info-tint: #E4F0F9

text


### Usage rules
- `ink-900` for headings and primary body text only. Never pure black (`#000`).
- `primary-700` is the one interactive color for links, active states, primary buttons.
- `accent-brass` is reserved — use only for one emphasis element per screen (a key CTA, an
  active toggle, a highlighted stat card). It loses impact if used everywhere.
- Status colors (success/warning/danger/info) are only for attendance %, exam eligibility,
  fee due, and system alerts — never for decoration.


---


## 3. Typography

--font-display: "Fraunces", Georgia, serif; /* page titles, dashboard headers, report titles */
--font-body: "Inter", -apple-system, sans-serif; /* all UI text, labels, table content */
--font-mono: "IBM Plex Mono", monospace; /* IDs, subject codes, roll numbers, timestamps */

text


### Type scale
--text-display-lg: 32px / 40px / 600 /* module titles: "Attendance Management" */
--text-display-sm: 24px / 32px / 600 /* card/section titles */
--text-h3: 18px / 26px / 600 /* sub-section headers, modal titles */
--text-body-lg: 15px / 22px / 400 /* default body text */
--text-body-sm: 13px / 18px / 400 /* table cells, secondary info */
--text-caption: 12px / 16px / 500 /* labels, table headers, badges — uppercase, 0.03em tracking */
--text-mono-sm: 13px / 18px / 500 /* codes, IDs, dates in mono font */

text

Rule: `font-display` (Fraunces) is used ONLY for page/module titles — never for buttons, labels,
table content, or body copy. This restraint is what makes it read premium rather than decorative.


---


## 4. Spacing & Radius

--space-1: 4px --space-2: 8px --space-3: 12px --space-4: 16px
--space-5: 20px --space-6: 24px --space-8: 32px --space-10: 40px

--radius-sm: 6px /* inputs, buttons, badges */
--radius-md: 10px /* cards, modals */
--radius-lg: 16px /* dashboard hero panels only */
--radius-full: 999px /* toggles, pills, avatars */

--shadow-card: 0 1px 2px rgba(14,42,50,0.04), 0 4px 12px rgba(14,42,50,0.06);
--shadow-modal: 0 8px 24px rgba(14,42,50,0.14), 0 2px 6px rgba(14,42,50,0.08);
--shadow-focus: 0 0 0 3px rgba(27,104,115,0.20);

text


---


## 5. Component Rules


### Sidebar
- Background: `--color-primary-900`. Text: `#CFE3E5` default, `#FFFFFF` on active/hover.
- Active nav item: left 3px `--color-accent-brass` bar + `--color-primary-700` background tint.
- Icons 18px, 12px gap to label, `--text-body-sm` weight 500.
- Width 260px expanded / 72px collapsed (icon-only), collapse toggle at bottom.


### Header / Topbar
- Background `--color-bg-surface`, bottom border `--color-border`, height 64px.
- Page title left in `--text-h3` + `font-body` (not display font — display font is for in-page
  content titles only). Right side: search, notification bell, profile — icons `--color-ink-500`.


### Card
- `--color-bg-surface`, `--radius-md`, `--shadow-card`, padding `--space-6`.
- Card header: title in `--text-h3`, optional caption below in `--color-ink-500 --text-body-sm`.
- Divider between header and body: 1px `--color-border`.


### Table (DataTable)
- Header row: `--color-bg-sunken` background, `--text-caption` (uppercase), `--color-ink-700`,
  bottom border 2px `--color-border-strong`.
- Body rows: `--text-body-sm`, `--color-ink-900`; row height 44px; alternate row
  `--color-bg-sunken` at 50% opacity OR hover-only highlight `--color-primary-100` — pick one
  striping mode per table, don't mix.
- Cell borders: bottom-only 1px `--color-border` (no vertical rules — cleaner, less clutter).
- Sticky header on scroll. Sort icon `--color-ink-300`, turns `--color-primary-700` on active sort.
- Status/attendance % cells use colored badge pills (success/warning/danger tint backgrounds +
  matching text color), not raw colored text.
- Pagination footer: `--text-body-sm`, active page number in `--color-accent-brass` circle.


### Form Label
- `--text-caption` (12px, uppercase, 0.03em tracking, weight 600), `--color-ink-700`.
- 6px margin-bottom to its input. Required fields: append brass asterisk, not red.


### Input Box
- Height 40px, `--color-bg-sunken` background, 1px `--color-border`, `--radius-sm`.
- Padding 10px 12px, `--text-body-lg`, placeholder `--color-ink-300`.
- Focus: border `--color-primary-700`, `--shadow-focus` ring, background becomes `#FFFFFF`.
- Error state: border `--color-danger`, helper text below in `--color-danger --text-body-sm`.
- Disabled: `--color-bg-sunken` at 60% opacity, `--color-ink-300` text, no border.


### Textarea
- Same as input box but min-height 96px, resizable vertical only, line-height 22px.


### Select / Dropdown
- Same shell as input box, chevron icon `--color-ink-500`, 16px right-aligned.
- Open menu: `--shadow-modal`, `--radius-sm`, `--color-bg-surface`, selected item
  `--color-primary-100` background + `--color-primary-700` text.


### Date & Time Picker
- Trigger field styled exactly like Input Box, with calendar/clock icon left-aligned,
  `--color-ink-500`, in `--font-mono` for the displayed date/time value.
- Calendar popover: `--shadow-modal`, `--radius-md`, `--color-bg-surface`.
  Selected date: filled circle `--color-primary-700`, text white.
  Today (if not selected): 1px outline `--color-accent-brass`, no fill.
  Range hover: `--color-primary-100` fill between start/end.


### Toggle Switch
- Track 40x22px, `--radius-full`. Off: `--color-border-strong`. On: `--color-accent-brass`.
- Knob: 18px circle, white, `--shadow-card`. 150ms ease transition on toggle.
- Label to the right, `--text-body-sm`, `--color-ink-700`.


### Buttons
- Primary: `--color-primary-700` bg, white text, `--radius-sm`, hover → `--color-primary-900`.
- Secondary/Outline: transparent bg, 1px `--color-primary-700` border, `--color-primary-700` text.
- Accent/CTA (rare — one per screen max): `--color-accent-brass` bg, `--color-ink-900` text.
- Destructive: `--color-danger` bg, white text — only for delete/deactivate actions.
- Height 40px (36px for compact/table-row actions), `--text-body-sm` weight 600, 16px horizontal padding.


### Modal
- Overlay: `rgba(14,42,50,0.45)`. Panel: `--color-bg-surface`, `--radius-md`, `--shadow-modal`,
  max-width 560px (sm) / 720px (md) / 960px (lg).
- Header: `--text-h3` title + close icon `--color-ink-500`, bottom border `--color-border`.
- Footer: right-aligned actions, top border `--color-border`, secondary button left of primary.


### Badges / Status Pills
- `--radius-full`, `--text-caption`, padding 4px 10px, tinted bg + matching solid text color
  from the status token pairs (e.g., `--color-success-tint` bg + `--color-success` text).


### Sidebar / Card Icons (general)
- Line icons only (not filled), 1.5px stroke, `--color-ink-500` default, `--color-primary-700`
  on active/hover states. Never mix filled and line icon styles in the same view.


---


## 6. Responsive Rules
- Breakpoints: `sm 640px / md 768px / lg 1024px / xl 1280px / 2xl 1536px`.
- Sidebar auto-collapses to icon-only below `lg`; becomes an overlay drawer below `md`.
- Tables below `md`: switch to stacked card-per-row view (label: value pairs) rather than
  horizontal scroll, using the same Card component rules above.
- Forms are single-column below `md`, two-column grid at `md` and above (label-above-input,
  never label-beside-input).
- Maintain minimum 44px tap targets for all interactive elements below `md`.


---


## 7. Accessibility Baseline
- All text/background pairs must meet WCAG AA contrast (4.5:1 body, 3:1 large text) — verify
  `--color-ink-500` on `--color-bg-surface` and adjust opacity rather than skipping this.
- Every focusable element gets the `--shadow-focus` ring — never `outline: none` without a
  replacement.
- Respect `prefers-reduced-motion`: disable transitions/animations beyond simple opacity fades.


---


## 8. Instruction for Future Component Generation


When generating any NEW component (card, form, modal, table, filter bar, dashboard widget,
report view, etc.) not explicitly detailed above:

1. Reuse the closest matching component rule in Section 5 as the base.
2. Pull all colors, spacing, radius, and shadow values only from Sections 2–4 — no new hex
   codes, no arbitrary pixel values.
3. Use `--font-display` only if the new element is a page/module-level title; everything else
   uses `--font-body`.
4. Keep `--color-accent-brass` to one usage per screen — check existing sibling components
   before adding a second brass element.
5. If a genuinely new pattern is needed that isn't covered, propose the addition to this file
   (with matching token names) rather than styling it as a one-off.