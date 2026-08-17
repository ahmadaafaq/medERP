# Role-Based Dashboards — Student / Faculty / Admin Clerk

Defines how the SRMS ERP shows **each logged-in user only their own data**, how the
sidebar menus/submenus change per role, and how an update by one role
**auto-reflects** for the others without a manual refresh.

---

## 1. Core Principle

> One login → one identity → one scoped view.

Every user authenticates once. Their **role** and **identity keys** (student roll no,
faculty ID, `colg_cd`, `course_cd`, `branch_cd`, department) are embedded in their
session/JWT. Every API call is filtered server-side by those keys — the frontend never
decides what data to show; it only renders what the backend already scoped.

```
Login → JWT { role, user_id, colg_cd, course_cd?, branch_cd?, dept_cd? }
        → Every API call sends this token
        → Backend filters query by these claims, always
        → Frontend renders whatever comes back — no client-side filtering of sensitive data
```

This is what makes it "smart" — the same `/api/attendance` endpoint returns different
rows for a student, a faculty member, and a clerk, because the backend applies a
different `WHERE` clause per role, not because the frontend hides columns.

---

## 2. Roles & What They See

| Role | Scope of data | Can edit | Cannot see |
|---|---|---|---|
| **Student** | Their own profile, attendance, results, fee ledger, timetable, notices for their college/course/branch | Own profile fields (address, phone), fee payment, leave application | Other students' records, faculty performance data, admin financials |
| **Faculty** | Students enrolled in the subjects/sections they teach; their own timetable, leave balance, logbook entries they've signed off | Attendance for their sessions, marks/grades for their subjects, CBME logbook sign-off | Other faculty's classes, admin-level fee/HR data |
| **Admin Clerk** | All students/faculty within their assigned `colg_cd` (or all colleges, if super-admin) | Student master data, fee entries, admission records, document verification | Nothing within their college scope; cross-college data only if role = super-admin |

---

## 3. Dashboard Widgets Per Role

### Student Dashboard
| Widget | Data source | Notes |
|---|---|---|
| Attendance % (this month) | `GET /api/attendance?student_id=self` | Updates the moment faculty marks a session |
| Upcoming classes | `GET /api/timetable?student_id=self` | Filtered by their `branch_cd` |
| Fee due / paid | `GET /api/fees?student_id=self` | Reflects instantly after clerk posts a payment |
| Recent results | `GET /api/results?student_id=self` | Appears once faculty/exam cell publishes |
| Notices | `GET /api/notices?colg_cd&course_cd&branch_cd` | Scoped to their institution + branch |

### Faculty Dashboard
| Widget | Data source | Notes |
|---|---|---|
| Today's classes | `GET /api/timetable?faculty_id=self` | |
| Attendance pending | `GET /api/attendance/pending?faculty_id=self` | Sessions not yet marked |
| My students (by subject) | `GET /api/students?subject_cd&section` | Read-only roster |
| Leave balance | `GET /api/leave?faculty_id=self` | |
| Logbook / CBME sign-offs pending | `GET /api/logbook/pending?faculty_id=self` | |

### Admin Clerk Dashboard
| Widget | Data source | Notes |
|---|---|---|
| New admissions today | `GET /api/admissions?colg_cd&date=today` | |
| Fee collection today | `GET /api/fees/collection?colg_cd&date=today` | |
| Pending document verifications | `GET /api/documents/pending?colg_cd` | |
| Attendance shortage alerts | `GET /api/attendance/shortage?colg_cd` | Cross-checks faculty-marked data |
| Staff on leave today | `GET /api/leave/today?colg_cd` | |

---

## 4. Sidebar Menu / Submenu Per Role

```
STUDENT                     FACULTY                      ADMIN CLERK
├─ Dashboard                ├─ Dashboard                  ├─ Dashboard
├─ My Attendance             ├─ My Timetable                ├─ Admissions
├─ My Timetable              ├─ Mark Attendance             ├─ Students
├─ My Results                │   ├─ By Section              │   ├─ Add Student
├─ Fee Payment                │   └─ Attendance History      │   ├─ Verify Documents
│   ├─ Pay Online             ├─ Marks & Results             │   └─ Student Ledger
│   └─ Payment History        │   ├─ Enter Marks             ├─ Fees
├─ Leave Application          │   └─ Publish Results          │   ├─ Collect Fee
├─ Documents                  ├─ Logbook / CBME              │   └─ Fee Reports
├─ Notices                    ├─ Leave                        ├─ Attendance Reports
└─ Profile                    ├─ Notices                      ├─ Staff Management
                              └─ Profile                      ├─ Notices (Publish)
                                                              └─ Settings
```

- Menu items are driven by a **role → menu map**, not hardcoded per page — adding a
  new role means adding one config entry, not new pages.
- Submenus that require permissions (e.g. "Publish Results") are hidden entirely for
  roles that lack that permission, rather than shown-and-disabled.

---

## 5. "Auto-Reflect Vice-Versa" — How Updates Propagate

This is the part that makes it feel alive rather than static. Three layers make it work:

### a) Single source of truth
Every entity (attendance, fee, result, leave) has exactly **one** table/API — there is
no separate "student view" copy of the data. Faculty writes to the same row a student
reads.

### b) Cache invalidation on write
Whichever role performs the write (faculty marks attendance, clerk posts a fee
payment) triggers an invalidation of the related query keys, so every dashboard
currently open — regardless of role — refetches automatically:

```ts
// Faculty marks attendance
await markAttendance(sectionId, date, records);
queryClient.invalidateQueries(["attendance", "student", studentId]);
queryClient.invalidateQueries(["attendance", "shortage", collegeCode]);
```

| Action | Who performs it | Who sees it update automatically |
|---|---|---|
| Mark attendance | Faculty | Student's attendance widget, Admin's shortage report |
| Post fee payment | Admin Clerk | Student's fee widget, Admin's collection report |
| Publish result | Faculty / Exam Cell | Student's results widget |
| Apply for leave | Student or Faculty | Admin's leave approval queue |
| Approve/reject leave | Admin / HOD | Applicant's leave status widget |
| Verify document | Admin Clerk | Student's document checklist |

### c) Live refresh (optional, for near-real-time)
For genuinely live updates without a manual reload, add either:
- **Polling** — React Query `refetchInterval` on high-value widgets (attendance,
  fee status) every 30–60s, or
- **WebSocket / Server-Sent Events** — backend pushes an event
  (`attendance:updated`, `fee:posted`) and the frontend invalidates the matching
  query key on receipt — no polling cost, truly instant.

Recommended: start with cache invalidation (b) for correctness, add SSE (c) only for
the 2–3 widgets where real-time actually matters (attendance, fee status).

---

## 6. Suggested Implementation Structure (Next.js)

```
lib/
  auth/
    session.ts        // decode JWT → { role, user_id, colg_cd, ... }
  rbac/
    menu-map.ts        // role → sidebar menu/submenu config
    permissions.ts      // role → allowed actions (canMarkAttendance, canPublishResults…)
  api/
    attendance.ts       // scoped fetchers, same endpoint, server filters by token
    fees.ts
    results.ts
hooks/
  useRole.ts            // reads session, exposes role + identity keys
  useScopedQuery.ts      // wraps React Query, auto-attaches identity to query key
middleware.ts            // redirects to correct dashboard route per role after login
app/
  dashboard/
    student/page.tsx
    faculty/page.tsx
    admin/page.tsx
```

- **One codebase, three dashboard routes** — each imports shared widgets
  (`AttendanceCard`, `FeeCard`) but passes a different scope; this keeps the design
  system (from `medical-erp-design-system.md`) identical across roles.
- **Never trust the frontend for authorization** — `menu-map.ts` and hidden buttons
  are UX conveniences only; the backend must independently reject any request outside
  a user's scope, even if the frontend never renders the button.

---

## 7. Not Yet Implemented

- Actual backend RBAC middleware / row-level security queries.
- WebSocket or SSE event layer for true real-time widgets.
- Notification/toast layer for cross-role updates ("Your attendance was marked").
- Audit log of who changed what, for admin oversight.