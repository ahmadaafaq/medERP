# CRITICAL FIX: Tenant Data Isolation Bug

> **Severity: High (Data Leak).** Any logged-in user (Admin/Faculty/Student/Clerk) is currently able to see data belonging to OTHER colleges instead of only their own tenant. This is a security and data-integrity issue, not a cosmetic one. Drag this file into the agent chat before making any fix — it must be resolved before this ERP goes anywhere near production.

---

## Problem Statement

After logging in with a specific `tenant_id` / `colg_cd`, the following modules are incorrectly showing data across **all** colleges instead of scoping to the logged-in user's own college:

1. All colleges + all courses of different colleges are visible
2. All batches across different colleges are visible
3. Batches are not filtered college-wise
4. Students from other colleges/courses are visible (not scoped to the logged-in college)
5. Staff registration list shows staff from all colleges
6. The top header still shows generic "MedERP" branding instead of the **logged-in user's own college name**
7. A faculty member from SRMS CET should only ever see SRMS CET's data — currently this isolation is broken

---

## Root Cause Checklist (agent must verify each of these)

Before writing any fix, the agent must check and report which of these is actually happening in the codebase:

- [ ] Is `tenant_id` / `colg_cd` actually being embedded in the JWT/session at login time?
- [ ] Is there a NestJS Guard/Middleware that extracts `tenant_id`/`colg_cd` from the JWT on every request and attaches it to `request.tenant`?
- [ ] Are backend service methods (colleges, courses, batches, students, staff) actually using `request.tenant` to scope their DB queries — or are they querying without any `WHERE colg_cd = ...` / schema restriction at all?
- [ ] Is the frontend calling the **same "All Colleges" admin endpoint** (built earlier for the Admin-Master superadmin view) for regular logins too, instead of a tenant-scoped endpoint?
- [ ] Is any part of the code trusting a `collegeId`/`tenantId` sent from the **frontend request body/query params** instead of only trusting the value from the verified JWT?

The last point is the most likely root cause of a bug like this — if the backend ever reads the "current college" from something the frontend sends (rather than from the authenticated token), any user can manipulate it to see other colleges' data.

---

## Fix Rules (Mandatory)

### Rule 1: Tenant context must come from the JWT only — never from the request body/query
Every protected endpoint must resolve the acting user's `colg_cd`/`tenant_slug` from the **decoded JWT**, via a NestJS Guard or Interceptor that runs on every request and sets it on `request.tenant`. Service/controller code must NEVER accept a `collegeId`/`tenantId` param from the frontend and use it directly to scope a query — that param must be ignored (or used only for validation) for any role below SuperAdmin.

### Rule 2: Role-based scoping — two distinct behaviors
- **SuperAdmin / Central Admin** (the role used in Admin-Master's "All Colleges" selector): allowed to see all colleges — this is intentional, per the Admin-Master feature built earlier. This role may pass an explicit `collegeId` to view a specific college's data.
- **College Admin, Faculty, Student, Clerk**: MUST be hard-locked to their own tenant. No college selector should even render in their UI. Every query for these roles must be forcibly scoped using `request.tenant.colg_cd` from the JWT — regardless of what the frontend sends.

### Rule 3: Apply this scoping to every listed module
Each of the following service methods must filter/scope by the authenticated user's tenant (unless the caller is SuperAdmin):
- Colleges list → for non-SuperAdmin, only return their own college record (or omit the endpoint from their UI entirely)
- Courses list → filter to `colg_cd = request.tenant.colg_cd`
- Batches list → filter to `colg_cd = request.tenant.colg_cd`
- Students list → filter to `colg_cd = request.tenant.colg_cd` AND, if the module also supports course-level filtering, apply that as a secondary filter — not a replacement for tenant scoping
- Staff registration/list → filter to `colg_cd = request.tenant.colg_cd`

### Rule 4: Top header must reflect the logged-in tenant
Replace any hardcoded "MedERP" (or generic) branding text in the top navigation/header component with the **logged-in user's own college name**, pulled from the JWT/session (`college_name` field), not from any global app-name constant. SuperAdmin's header may still show "MedERP" (or a neutral admin label) since they aren't tied to one college.

### Rule 5: Faculty-specific scoping
A faculty member's dashboard (subjects, students, attendance, assessments) must be filtered by their own `colg_cd`, resolved from their JWT — never from a dropdown or frontend-supplied value. If SRMS CET faculty logs in, every list/query they trigger must only return SRMS CET data, full stop.

### Rule 6: Do not break the SuperAdmin Admin-Master flow
The "All Colleges" cascading view built earlier in Admin-Master (College → Department, College → Course → Subject) is intentional and must continue to work for SuperAdmin. These fixes apply to **all other roles** — do not accidentally lock SuperAdmin out of the multi-college view while fixing this.

---

## Verification Plan (must be run after the fix)

1. Log in as Faculty from SRMS CET → confirm only SRMS CET's courses, batches, students, and staff are visible anywhere in the app.
2. Log in as Faculty from a different college (e.g., SRMS IMS) → confirm they see only their own college's data, and confirm SRMS CET's data is NOT visible to them.
3. Log in as Student, Clerk, and College Admin roles → repeat the same check for each.
4. Confirm the top header dynamically shows the correct college name per login, not a generic label.
5. Log in as SuperAdmin → confirm the "All Colleges" view in Admin-Master still works correctly and is unaffected.
6. Attempt to manually manipulate a request (e.g., via browser dev tools) to pass a different `collegeId` while logged in as Faculty → confirm the backend ignores it and still returns only their own college's data. This is the real test of whether Rule 1 was implemented correctly.

---

## Note to Agent

This is a **security bug**, not a UI/display issue. Do not fix this by hiding data in the frontend only (e.g., filtering the list after it's already been fetched) — the backend API itself must never return cross-tenant data to a non-SuperAdmin role in the first place. A frontend-only fix leaves the underlying data exposed to anyone who inspects network requests.