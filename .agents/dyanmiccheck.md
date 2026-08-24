# ERP Full Dynamic Data Migration — Agent Instructions

## Priority Level: CRITICAL — Zero Tolerance for Static Data

You are working on a production multi-tenant college ERP (NestJS backend, Next.js
frontend) used by five roles: **Admin, Student, Faculty, Clerk, Warden**. Your task
is to audit the **entire codebase** and eliminate every instance of static,
hardcoded, mock, dummy, or placeholder data currently being rendered on any
dashboard, page, card, table, chart, or widget — and replace it with real data
fetched from the database through proper API calls.

This is a **data-source migration only**. It is explicitly **not** a redesign.

---

## 1. Hard Rule — Do Not Touch Design

- Do **NOT** change any component's JSX structure, CSS, Tailwind classes, inline
  styles, layout, spacing, colors, fonts, border radius, animations, or theme
  tokens.
- Do **NOT** rename, restructure, remove, or add new UI components, cards, or
  sections.
- Do **NOT** change prop names on presentational components unless strictly
  required to pass real data through (and if so, keep the shape/interface
  identical to what the component already expects).
- The visual output before and after this migration must be **pixel-identical**
  when real data happens to match the old static data in shape and length.
- If a component currently renders a fixed array of 3 items and the real data
  has 7, the layout must still render correctly (list/grid must be dynamic in
  *length*, never in *style*) — this is a data fix, not a style fix.

If achieving "no static data" ever seems to require changing a card's structure
(e.g. because static data was propping up a layout assumption), flag it in your
summary instead of silently redesigning it.

---

## 2. What Counts as "Static Data" (must be removed)

Search for and eliminate all of the following, everywhere in the frontend:

- Hardcoded arrays/objects of sample records (students, faculty, notices,
  projects, attendance, fees, exam results, batches, hostel/warden data, clerk
  transaction logs, etc.) defined directly in component files.
- Placeholder strings like `"Ananya Sharma"`, `"REG-2022-CS-0417"`, `"Lorem
  ipsum"`, `"Sample College"`, `"John Doe"`, `"Test Faculty"`, or any obviously
  fake/demo name, ID, date, grade, or percentage baked into JSX or a constants
  file.
- Fake KPI numbers on dashboard stat cards (e.g. `"1,240 Students"`, `"98%
  Attendance"`) not sourced from a query.
- Static chart data (`[{month: 'Jan', value: 40}, ...]`) instead of data
  computed from real records.
- Static dropdown options for anything that should come from the DB (College →
  Course → Branch → Batch cascades, subject lists, faculty lists, hostel/room
  lists, fee heads, etc.) — generic truly-fixed enums (e.g. days of week, grade
  letter scale A–F if fixed by policy) may remain static if they are genuinely
  system constants, not entity data.
- Mock API responses / `setTimeout`-simulated fetches left in from prototyping.
- `useState` initialized with fake seed data instead of `[]`/`null` + a real
  fetch on mount.
- Commented-out fetch calls sitting next to active static arrays (the static
  array is dead code left behind after a fetch was stubbed out — remove the
  static array, restore/implement the real fetch).

## 3. What Is Allowed to Remain Static

- Genuine UI copy: labels, section headings, button text, placeholder/hint
  text inside empty inputs, tooltips, static legal/footer text.
- True system constants with no DB backing (e.g. `['Monday', ..., 'Sunday']`,
  fixed role enum lists used only for a role-selector where roles are not
  DB-managed).
- Icon sets, color tokens, theme values — untouched per Section 1.

---

## 4. Required Pattern Per Page/Component

For every component currently using static data:

1. **Identify the real entity** it represents (Student, Attendance Record,
   Notice, Project, Fee Transaction, Exam Result, Hostel Allocation, etc.) and
   locate (or create, if missing) the corresponding NestJS endpoint that
   returns it, scoped correctly:
   - Scoped to `tenantId` (college) always.
   - Scoped to the logged-in user's role and identity where applicable — a
     Student must only ever receive their own records; a Faculty only their
     assigned sections/subjects; a Warden only their assigned
     hostel/block; a Clerk only their assigned desk/department scope; Admin
     sees tenant-wide data.
2. **Replace the static array/object** with a data-fetching hook
   (`useEffect` + fetch, or your existing data layer — React Query / SWR if
   already in use elsewhere in the codebase; match whatever pattern the rest
   of the app already uses for consistency, don't introduce a second fetching
   paradigm).
3. **Preserve the exact prop shape** the presentational component expects. If
   the API response shape differs, map/transform it in the page/container
   component — never change the child component's expected props.
4. **Add the three required UI states**, using the existing design system's
   existing loading/empty/error patterns if the project already has them
   (skeletons, spinners, empty-state illustrations, toast/error banners) — do
   not invent new visual styles for these states:
   - **Loading** — skeleton or spinner matching existing card/table dimensions
     so there's no layout shift when data arrives.
   - **Empty** — "No records found" type state, not a blank card and not
     leftover static data.
   - **Error** — a clear failure state with a retry action, never a silent
     fallback to fake data.
5. **Never fall back to static/mock data on fetch failure.** If a fetch fails,
   show the error state — do not silently render placeholder data to "keep the
   UI looking good." This includes removing any `|| fallbackMockData` patterns.

---

## 5. Role-by-Role Data Boundaries (enforce on backend, not just hidden in UI)

| Role    | Can fetch |
|---------|-----------|
| Admin   | All tenant data: all students, faculty, clerks, wardens, all departments, all reports |
| Faculty | Their assigned subjects/sections, their students' attendance & marks, their own schedule/profile |
| Student | Only their own profile, attendance, fees, exam results, project records, notices addressed to them/their batch |
| Clerk   | Records within their assigned administrative scope (e.g. fee desk, admissions desk) — not full student academic records unless explicitly permitted |
| Warden  | Hostel/block residents assigned to them, attendance/punch status for their block, hostel-specific notices |

Every endpoint must enforce this server-side via guards/decorators reading the
authenticated user's role + tenantId + assigned scope from the JWT/session —
never trust a frontend filter alone to restrict data access.

---

## 6. Audit & Execution Process

1. **Search pass**: grep the frontend codebase for tell-tale static-data
   signals before writing any fix:
   - Common fake names/IDs already known to exist in this codebase (list the
     specific ones you find as you go).
   - Arrays defined at module scope in `.tsx`/`.jsx` files inside `pages/`,
     `components/`, `app/` directories that look like entity records.
   - `// TODO`, `// mock`, `// dummy`, `// placeholder`, `// temp data`
     comments.
2. **Inventory**: produce a checklist of every page/component found with
   static data, grouped by role dashboard (Admin / Student / Faculty / Clerk /
   Warden) plus shared pages (Notices, Incubation Cell, Theme Studio if it has
   any demo data, Project Records).
3. **Fix one page at a time**, verifying after each:
   - Real data renders correctly in the untouched UI.
   - Loading/empty/error states work.
   - No console errors, no leftover unused static constants (delete dead
     code, don't just stop referencing it).
4. **Final verification pass**: re-run the search from step 1 across the
   whole repo and confirm zero matches remain outside the allowed list in
   Section 3.
5. **Summary report**: at the end, output a list of:
   - Every file changed.
   - Every new/reused API endpoint per page.
   - Any page where static data could not be cleanly replaced without a
     structural change (flagged, not silently redesigned) — for my review.

---

## 7. Definition of Done

- Zero hardcoded entity data remains anywhere in the frontend (per Section 2).
- Every dashboard page, across all five roles, renders exclusively from live
  API calls scoped correctly per Section 5.
- All existing card/table/form/sidebar/header CSS and layout is untouched and
  visually identical.
- Loading, empty, and error states exist for every data-driven section using
  the app's existing state-pattern conventions.
- No fetch failure ever silently falls back to fake data.
- A summary report (per Section 6, step 5) is provided at the end for review.