Summary of Dynamic Course & Batch Integration
All course and batch selections (including B.Tech, BCA, MCA, MBA, B.Pharm, and M.Tech) across the application have been audited, made 100% dynamic, and connected to live PostgreSQL records and SRMS API routes per 

RestrictAPI.md
 and 

dyanmiccheck.md
.

Key Courses & Batches Mapped from Database
Course	course_cd	Dynamic Batches in Database	batch_cd Values
B.Tech	1	Batch 2026, 2025, 2024, 2023, 2022, 2021, 2020...	19, 18, 17, 16, 15, 14, 13...
BCA	13	Batch 2026, 2025, 2024	3, 2, 1
MCA	4	Batch 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018...	16, 15, 14, 13, 12, 11, 10, 9...
MBA	3	Batch 2025, 2024, 2023, 2022, 2021, 2020...	16, 15, 14, 13, 12, 11...
B.Pharm	2	Batch 2025, 2024, 2023, 2022, 2021, 2020...	18, 17, 16, 15, 14, 13...
M.Tech	5	Batch 2026, 2025, 2024, 2023, 2022...	17, 16, 15, 14, 13...
Files Updated for Full Dynamic Migration


FacultyBatchAttendanceAnalytics.tsx
:

Eliminated the hardcoded BATCH_DATA dictionary.
Dynamically loads all active courses (B.Tech, BCA, MCA, MBA, B.Pharm) and their live cohorts from /api/srms/courses & /api/srms/batches.
Fetches live subject ledger and attendance statistics per selected cohort.


NoticeGroupBuilder.tsx
:

Replaced static course/batch <option> tags with live API-driven dropdown lists populated from /api/srms/courses, /college-master/batches, and /college-master/departments.


ChatAddBatchModal.tsx
:

Connected loadBatchesForCourse directly to /api/srms/batches to fetch the real batches for whatever course is chosen (B.Tech, BCA, MCA, etc.).


AttendancePortal.tsx
:

Removed static fallback mock courses and branches; streams live academic hierarchies.


lessons/page.tsx
 & 

students/page.tsx
:

Removed static fallback arrays (2024-BTECH, 2025-BCA, 2025-MBBS) and replaced them with live database batch mappings.


┌─────────────────────────────────────────────────────────────┐
│ 1. Student Logs In (e.g., BCA, B.Tech, MCA, or MBBS)        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Backend `/auth/me` Resolves Student Profile from DB      │
│    • course_cd (e.g., 13 for BCA, 1 for B.Tech, 4 for MCA)   │
│    • branch_cd (e.g., 1 for CSE / General)                  │
│    • batch_cd  (e.g., 2 for BCA Batch 2025, 18 for B.Tech)  │
│    • semester  (e.g., 3) & section (e.g., 1)                │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Frontend queries `/timetable/student-schedule`           │
│    `?courseCd=...&branchCd=...&batchCd=...&semester=...`    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. PostgreSQL Filters Timetable Slots strictly for that     │
│    Cohort (Isolated per Course, Branch, Batch & Section)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Rendered on Dashboard Card & `/student/timetable`:       │
│    • Exact class count                                      │
│    • Distinct registered subjects                           │
│    • Real active / next session for that specific cohort    │
└─────────────────────────────────────────────────────────────┘
Key Guarantees
Dynamic Database Sourcing: If an Admin creates a new class slot or edits room/time in the Admin Master, the change reflects immediately on that student's dashboard upon page refresh.
Schema & Tenant Isolation: All queries execute strictly within the active college tenant (tenant_{slug}). Students from SRMS CET never see data from other colleges or unrelated batches.
No Fallback Placeholders: If a newly registered student has no scheduled classes for that week, it dynamically displays 0 Classes and an empty timetable state rather than fake sample sessions.