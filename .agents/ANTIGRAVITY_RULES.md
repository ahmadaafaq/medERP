# PROJECT ARCHITECTURE RULES — MULTI-TENANT ERP (NestJS + Next.js)
These rules are MANDATORY for every code change, fix, or feature addition.
Never violate them even if the user's request seems unrelated to isolation.

## 1. TENANT ISOLATION (Non-negotiable)
- Every database table storing tenant-specific data MUST have a `tenantId` column.
- EVERY database query (find, findOne, update, delete, aggregate) MUST filter by `tenantId`.
- Never write a raw query or repository call without `tenantId` in the WHERE clause.
- `tenantId` must come from the authenticated request context (JWT/session), 
  NEVER from client-supplied body/query params.
- If you touch any service/repository method, verify it still filters by tenantId 
  after your change — do not remove or bypass this filter.q

## 2. ROLE ISOLATION (Non-negotiable)
- Each role (ADMIN, FACULTY, STUDENT, CLERK) must have its OWN dedicated service 
  method and controller endpoint. NEVER let two roles share the same method 
  when their data visibility differs.
  Example pattern to follow:
    - getSeminarsForAdmin(tenantId)
    - getSeminarsForStudent(tenantId, studentId)
    - getSeminarsForFaculty(tenantId, facultyId)
- Shared logic (query building, DTO mapping) can live in a PRIVATE helper method, 
  but the PUBLIC method per role must define its own access/filter rules explicitly.
- Never modify a shared/common method to fix a bug for one role — instead, 
  create/fix the role-specific method that wraps it.

## 3. SCOPE OF CHANGES — DO NOT TOUCH UNRELATED CODE
- When fixing or adding a feature for one role or one tenant, modify ONLY the 
  files/methods directly responsible for that role/tenant behavior.
- Do NOT refactor, rename, or "clean up" unrelated methods, controllers, or 
  DTOs as a side effect, even if they look improvable.
- Before finalizing a change, list every file you modified and confirm each one 
  is required for the specific fix requested. Remove any incidental edits.

## 4. TENANT-SPECIFIC CUSTOMIZATION (for future colleges, e.g. DEF)
- Never hardcode a college-specific behavior directly inside core logic.
- All per-tenant differences MUST go through a `tenant_config` table/service:
    tenantConfigService.get(tenantId, featureKey) → returns config object
- Core modules (Placement, Seminar, Attendance, etc.) read this config to 
  conditionally enable/disable fields or behavior — the underlying core logic 
  file itself remains identical for all tenants.
- If a new college needs a new field/behavior, ADD a config flag — 
  do not fork or branch the core module code.

## 5. FRONTEND (Next.js) RULES
- Each role must have its own route group/layout: /admin/*, /student/*, /faculty/*.
- API calls from one role's pages must hit only that role's dedicated backend 
  endpoints (see Rule 2) — never a shared generic endpoint that mixes response 
  shapes across roles.
- Do not share a single React hook/context for data-fetching across admin and 
  student views if their data visibility differs. Create separate hooks: 
  useAdminSeminars(), useStudentSeminars(), etc.
- tenantId/college context must be derived from the logged-in user's session — 
  never from a URL param or local state that a user could tamper with.

## 6. MANDATORY REGRESSION CHECK BEFORE COMPLETING ANY TASK
Before marking a task/fix as done, explicitly verify and state:
  ✅ Does ADMIN still see full data as before?
  ✅ Does STUDENT still see only their own data as before?
  ✅ Does FACULTY still see only assigned data as before?
  ✅ Does this change affect any OTHER tenant besides the one being worked on?
If any answer is uncertain, re-check the relevant service method's filters 
before finalizing.

## 7. TESTING REQUIREMENT
- For any new/changed feature, add or update a test case covering:
  - tenant isolation (data from Tenant A never appears for Tenant B)
  - role isolation (Student cannot access Admin/Faculty-only data)
- Do not consider a task complete until these tests pass.

## 8. WHEN UNSURE
If a requested fix would require touching a shared/common method used by 
multiple roles or tenants, STOP and explain the tradeoff instead of directly 
editing it. Propose splitting the method into role-specific versions first.