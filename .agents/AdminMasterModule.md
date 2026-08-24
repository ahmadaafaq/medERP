# Task: Verify Admin Master Module (Full CRUD Check)

## Module: `admin-master`
## Stack: NestJS (backend) + Next.js (frontend)

## Scope
Check ONLY the module and its tabs listed below. Do not modify, refactor, or touch any file outside this module unless it is a directly shared dependency required to fix a confirmed bug in this module.

### Tabs to verify:
1. Department Master
2. Subject Master
3. Guidelines
4. Subject Offerings
5. Delivery Types
6. Unit Master
7. Topic Master
8. Sub Topics

## What to do for EACH tab above:
For every tab, verify all four operations work correctly end-to-end (frontend → API call → NestJS controller/service → DB → response → UI update):

- **Insert (Create)**
  - Form validation works (required fields, correct data types)
  - API call fires correctly with correct payload
  - Record is saved in DB
  - UI reflects the new record (list/table updates) without a manual refresh
  - Duplicate/invalid entries are rejected with a clear error message

- **Edit / Update**
  - Existing record loads correctly into the edit form
  - Updated fields are sent correctly to the backend
  - Backend updates the correct record (check by ID, not by array index)
  - UI reflects the updated data immediately
  - Partial/invalid updates are rejected with a clear error

- **Delete**
  - Confirmation step exists before delete (if applicable)
  - Correct record is deleted (verify by ID)
  - UI removes the record from the list immediately
  - Deleting a record referenced elsewhere in the hierarchy (e.g. a Subject tied to a Department, a Unit tied to a Subject, a Topic tied to a Unit, a Sub Topic tied to a Topic) is handled gracefully (blocked with a clear message, or cascades as intended — confirm which behavior is expected before assuming)

- **Hierarchy / parent-child integrity**
  - This module has nested relationships (Department → Subject → Subject Offerings/Unit → Topic → Sub Topic). For each tab, verify that:
    - The correct parent record's ID is attached on insert (e.g. a new Topic is correctly linked to the right Unit, not just the first/last one in a list)
    - Editing a parent record's name/status does not silently break or orphan its children
    - Deleting a parent correctly handles its children (blocked, or cascade-deleted as intended — confirm expected behavior, don't assume)
    - Counts shown on each tab (e.g. record counts) update correctly after insert/edit/delete

- **General checks per tab**
  - No console errors (frontend) or unhandled exceptions (backend logs)
  - Loading and empty states display correctly
  - Pagination/search/filter (if present) still works after insert/edit/delete

## Tenant Isolation (Multi-College) Checks — CRITICAL
This system is multi-tenant — multiple colleges use the same module with separate data (e.g. `srms-cet-bareilly`, `raj-shree-mri`). For EVERY tab and EVERY operation above, additionally verify:

- All list/fetch queries are filtered by the logged-in tenant/college ID on the **backend** (never trust a frontend-only filter)
- Insert always attaches the correct tenant ID to the new record — it should never be possible to create a record without one, or with a wrong one
- Edit/Update only allows modifying records that belong to the logged-in tenant (attempting to edit another tenant's record by guessing/changing an ID in the request should fail with an authorization error, not succeed)
- Delete only allows deleting records belonging to the logged-in tenant (same ID-guessing check as above)
- Switching the logged-in tenant/college (or logging in as a different college) shows ONLY that tenant's data — no leftover or mixed data from another college
- Parent-child dropdowns (e.g. selecting a Department while creating a Subject, or a Unit while creating a Topic) only show options belonging to the current tenant, not all tenants' data
- Record counts shown per tab reflect ONLY the current tenant's data
- Double-check this explicitly for `srms-cet-bareilly` vs `raj-shree-mri` (or any two existing tenants with real data) — create/edit/delete a test record under one and confirm it never appears, and cannot be affected, under the other, at every level of the hierarchy

Report any tenant-isolation issue as a **critical** bug regardless of tab — this is a data-leak risk, not just a UI bug.

## Reporting format
After checking, report back tab-by-tab in this format — do NOT skip any tab:

```
### <Tab Name>
- Insert:          ✅ / ❌ (details if ❌)
- Edit:             ✅ / ❌ (details if ❌)
- Delete:           ✅ / ❌ (details if ❌)
- Hierarchy check:  ✅ / ❌ (details if ❌)
- Tenant isolation: ✅ / ❌ (details if ❌ — mark CRITICAL)
- Notes:            <any edge cases, console errors, or concerns found>
```

## Rules
- If you find a bug, fix it ONLY within the `admin-master` module files.
- Do not "improve," rename, or restructure working code while checking — only fix actual confirmed bugs.
- Do not touch any file outside `admin-master` unless absolutely required and explain why if you do.
- After completing the check for all 8 tabs, STOP and wait for user confirmation. Do not proceed to any other task automatically.