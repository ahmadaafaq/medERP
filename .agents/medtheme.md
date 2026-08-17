# SRMS Medical ERP — Design System & UI Kit

Reference documentation for the branded Next.js ERP frontend. Pairs with `medical-erp-ui-kit.jsx`.

## 1. Brand Tokens

| Token | Value | Usage |
|---|---|---|
| Sidebar background | `#2D2575` → `#221C5C` (gradient) | Sidebar surface |
| Header background | `#2D2575` gradient sheen | Top navigation |
| Primary | `#5B4BFF` | Primary buttons, focus rings, links |
| Secondary | `#7867FF` | Secondary accents, gradients |
| Accent | `#F36C21` | Active nav icon, highlights, CTAs |
| Success | `#00C48C` | Positive states, live indicators |
| Warning | `#FFB020` | Caution states |
| Danger | `#F04438` | Errors, destructive actions |
| Card background | `#FFFFFF` | All cards |
| Page background | `#F6F8FC` | App canvas |
| Border | `#E7EAF3` | Card/input borders |
| Heading text | `#1B1E28` | H1–H6 |
| Body text | `#4E5969` | Paragraphs, labels |
| Muted text | `#7B8794` | Captions, placeholders |

**Font:** Inter — weights 300 / 400 / 500 / 600 / 700.

## 2. Layout Rules

- **Sidebar:** 280px expanded / 88px collapsed, rounded right corners (32px), gradient fill, ambient glow blobs, faint ECG watermark, profile card pinned at the bottom.
- **Header:** 80px tall, rounded bottom corners (24px), gradient sheen, breadcrumb + search + notifications + profile.
- **Cards:** 22px radius, 1px `#E7EAF3` border, soft shadow, 24px padding, hover lift (`-translate-y-1.5`) with shadow bloom.
- **Buttons:** fully rounded (pill), primary uses a purple gradient, secondary is white with a border, outline is transparent with a purple border.
- **Inputs / Selects:** 48px height, 16px radius, floating label, 4px focus ring in primary at 12% opacity.

## 3. Signature Element

A faint **ECG / heartbeat trace** (`<PulseLine />`) appears on purple surfaces (sidebar footer, header, hero banner) at low opacity. It's the one recurring motif that ties the palette back to "medical" without being literal — used once per surface, never decorative clutter.

## 4. Component Inventory

| Component | Purpose |
|---|---|
| `Sidebar` | Grouped navigation (Overview / Academics / Operations / System), collapsible |
| `Header` | Breadcrumb, global search, quick-add, notifications, profile menu |
| `HeroBanner` | Dashboard welcome moment, gradient + ECG trace |
| `SummaryCard` | KPI tile — icon, label, value (skeleton until wired to a metrics API) |
| `TrendCard` | Placeholder chart card — explicit "awaiting API" state, no fabricated data |
| `ActivityCard` | Recent activity feed — skeleton rows until wired |
| `FloatingInput` | Floating-label text input |
| `FloatingSelect` | Floating-label dropdown with loading / error / disabled states |
| `Button` | `primary` / `secondary` / `outline` variants |

## 5. Data Rule (non-negotiable)

> No fabricated business data anywhere in the UI.

- Dashboard KPIs render as **animated skeletons** until a real metrics endpoint is connected.
- The `TrendCard` and `ActivityCard` explicitly label themselves "awaiting API" rather than showing invented numbers.
- The College → Course → Branch flow calls the **real** SRMS endpoints directly — never mock data.

## 6. Live API Integration (College → Course → Branch)

Three-step cascade, each step resets and re-fetches the next:

| Step | Endpoint | Method | Payload |
|---|---|---|---|
| 1. Colleges | `POST /SRMSERP/Home/GetCollege` | POST | `{}` |
| 2. Courses | `POST /SRMSERP/erpadmin/GetCourse` | POST | `{ "colgcd": "<colg_cd>" }` |
| 3. Branches | `POST /SRMSERP/erpadmin/GetBranch` | POST | `{ "colgcd": "<colg_cd>", "coursecd": "<course_cd>" }` |

Rules:
- Only records with `active_flg === "1"` are shown for courses and branches.
- Selecting a college clears and disables Course + Branch until the new list loads.
- Selecting a course clears and disables Branch until the new list loads.
- Fetch failures render an inline error (`Unable to load colleges/courses/branches…`), never a silent fallback to fake data.

## 7. Suggested Next.js File Structure

```
app/
  (dashboard)/
    layout.tsx
    page.tsx
components/
  layout/
    Sidebar.tsx
    Header.tsx
  dashboard/
    HeroBanner.tsx
    SummaryCard.tsx
    TrendCard.tsx
    ActivityCard.tsx
  forms/
    FloatingInput.tsx
    FloatingSelect.tsx
  common/
    Button.tsx
    PulseLine.tsx
lib/
  api/
    college.ts   // GetCollege
    course.ts    // GetCourse
    branch.ts    // GetBranch
  constants/
    tokens.ts    // brand tokens from Section 1
hooks/
  useColleges.ts
  useCourses.ts
  useBranches.ts
```

## 8. Not Yet Implemented

- Real metrics API wiring for `SummaryCard`, `TrendCard`, `ActivityCard`.
- Framer Motion page-transition/skeleton choreography (current build uses CSS transitions as a stand-in).
- Remaining modules from the brief: Students, Faculty, Attendance, Leave, Timetable, Exam, Results, Fees, Hostel, Library, Transport, Inventory, HR, Payroll, Accounts, Reports, Analytics, Settings.