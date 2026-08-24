# Task: Verify College Master Module (Full CRUD Check)

## Module: `college-master`
## Stack: NestJS (backend) + Next.js (frontend)

## Scope
Check ONLY the module and its tabs listed below. Do not modify, refactor, or touch any file outside this module unless it is a directly shared dependency required to fix a confirmed bug in this module.

### Tabs to verify:
1. Colleges
2. Courses
3. Academic Year / Semester
4. Branch / Department
5. Batches
6. Group
7. Session
8. Resident

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
  - Deleting a record that is referenced elsewhere (e.g. a Course tied to a Branch) is handled gracefully (blocked with a clear message, or cascades as intended — confirm which behavior is expected before assuming)

- **General checks per tab**
  - No console errors (frontend) or unhandled exceptions (backend logs)
  - Loading and empty states display correctly
  - Pagination/search/filter (if present) still works after insert/edit/delete
  - Relationships between tabs stay consistent (e.g. a Batch tied to an Academic Year still shows correctly after edits)

## Reporting format
After checking, report back tab-by-tab in this format — do NOT skip any tab:

```
### <Tab Name>
- Insert:  ✅ / ❌ (details if ❌)
- Edit:    ✅ / ❌ (details if ❌)
- Delete:  ✅ / ❌ (details if ❌)
- Notes:   <any edge cases, console errors, or concerns found>
```

## Rules
- If you find a bug, fix it ONLY within the `college-master` module files.
- Do not "improve," rename, or restructure working code while checking — only fix actual confirmed bugs.
- Do not touch any file outside `college-master` unless absolutely required and explain why if you do.
- After completing the check for all 8 tabs, STOP and wait for user confirmation. Do not proceed to any other task automatically.