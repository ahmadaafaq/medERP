# ERP Agent Rules — ID & Data Convention Standard

> **Purpose:** This file defines mandatory rules for any AI agent (Gemini Flash or otherwise) working on this College ERP codebase. Drag this file into any chat/session before making changes to backend, frontend, or database code. These rules apply **project-wide** — every module, every API, every table.

---

## Core Principle

**Never use GUIDs/UUIDs as the primary identifier exposed to the application layer, APIs, dropdowns, or business logic.** Always use short, human-readable **numeric or alphanumeric codes** as the working identifier. GUIDs may exist internally in the database as a surrogate primary key, but they must **never** be the value used in:
- Dropdown `value` attributes
- API request/response payloads (as the reference key)
- Frontend state (selected college/course/etc.)
- Business logic / conditional checks
- Logs, debugging output, or reports shown to users

---

## Rule 1: College Data — Use Numeric Code Only

- Every college is referenced by `colg_cd` (numeric), never by GUID.
- Example: `colg_cd=1` → SRMS CET, `colg_cd=2` → SRMS IMS, etc.
- All API responses for colleges must return `colg_cd` and `colg_name` — no `id` (GUID) field should be relied upon anywhere in frontend logic.

```json
// Correct
{ "colg_cd": 1, "colg_name": "SRMS CET" }

// Incorrect — never expose or use this as the working key
{ "id": "550e8400-e29b-41d4-a716-446655440000", "colg_name": "SRMS CET" }
```

---

## Rule 2: Course Data — Numeric Code + DB Fallback on API Failure

- Every course is referenced by `course_cd` (numeric), never by GUID.
- Example: `course_cd=13` → BCA.
- **Fallback behavior:** When a college is selected and `GetCourse` API call fails (timeout, 500 error, network issue), the agent must **fetch course data directly from PostgreSQL** (via backend query) instead of leaving the dropdown empty or blocking the UI.
  - This fallback must be implemented server-side (a resilient service method), not as a silent frontend failure.
  - Log the API failure, but still return valid `course_cd` + `course_name` data to the frontend so the user experience is uninterrupted.

```json
// Correct
{ "course_cd": 13, "course_name": "BCA" }
```

---

## Rule 3: All Course-Related Entities — Same Convention Applies

Once a course is selected, **every dependent entity** listed below must follow the same numeric/code-based convention — no GUIDs anywhere in these flows:

| Entity | Identifier Field | Example |
|---|---|---|
| Batches | `batch_cd` | `batch_cd=2024` |
| Branches | `branch_cd` | `branch_cd=5` |
| Department | `dept_cd` | `dept_cd=3` |
| Semesters | `sem_cd` | `sem_cd=1` to `sem_cd=10` |
| Subjects | `subject_cd` | `subject_cd=101` |
| Students | `student_cd` / `enrollment_no` | as per existing enrollment numbering |
| **Staff** | **`empid` (Staff Code)** | `empid="202516224"` → Sohrab Ahmad |

### Staff-specific note
Staff must **always** be referenced and displayed by their **Employee ID / Staff Code** (e.g., `"202516224"`), never by an internal GUID. This applies to HOD assignment, faculty attendance marking, subject-faculty mapping, and every other module that references a staff member.

---

## Rule 4: Consistency Across the Entire Application

These rules are not module-specific — they apply to:
- Admin-Master (Department, Subject, College tabs)
- College-Master
- Attendance module
- Assessment / Marks module
- Question Bank
- Reports (any report referencing college/course/branch/dept/semester/subject/student/staff must display and filter by the numeric/human-readable code, not GUID)

If a new module or table is created, the same `_cd` / code-based convention must be followed by default, unless explicitly told otherwise.

---

## Rule 5: When Writing or Modifying Code

Before generating any code (API endpoint, dropdown component, database query, DTO, etc.), the agent must:
1. Check whether the entity involved is one listed above.
2. Use the correct `_cd` field name and numeric/code type — never introduce a GUID field into request/response contracts or frontend state for these entities.
3. If a GUID exists in the underlying table as a system-level primary key, it may remain in the database schema for internal joins, but must be excluded from any API response or frontend-facing payload.
4. If unsure whether a new entity should follow this convention, default to **yes** — ask only if there's a clear technical reason it can't (e.g., a required third-party integration that mandates GUIDs).

---

## Quick Reference Table

| Field | Format | Example |
|---|---|---|
| `colg_cd` | Numeric | `1` |
| `course_cd` | Numeric | `13` |
| `batch_cd` | Numeric | `2024` |
| `branch_cd` | Numeric | `5` |
| `dept_cd` | Numeric | `3` |
| `sem_cd` | Numeric (1–10) | `4` |
| `subject_cd` | Numeric | `101` |
| `empid` | Alphanumeric (Staff Code) | `"202516224"` |

**No GUIDs in any of the above, anywhere in the application, ever.**