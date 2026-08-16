# UG LogBook Feature — Memory & Restoration Guide

> **Status**: **HIDDEN FROM UI (Menu, Reports & Tabs)**  
> **Retention**: All backend APIs, TypeORM entities, database tables, and Next.js frontend pages are 100% preserved and fully functional. Whenever the user requests to unhide or re-display UG LogBook, follow the instructions in this document.

---

## 1. Preserved Frontend Routes & Pages
The underlying pages and components remain intact in the repository:
1. **Admin UG Logbook Evaluation**: `frontend/app/dashboard/admin/ug-logbook/evaluation/page.tsx`
   - URL: `http://localhost:3000/dashboard/admin/ug-logbook/evaluation`
2. **Admin UG Logbook Activity Master**: `frontend/app/dashboard/admin/ug-logbook/activity-master/page.tsx`
   - URL: `http://localhost:3000/dashboard/admin/ug-logbook/activity-master`
3. **Admin MIS UG Logbook Report**: `frontend/app/dashboard/admin/reports/logbook/page.tsx`
   - URL: `http://localhost:3000/dashboard/admin/reports/logbook`
4. **Faculty UG Logbook Verification**: `frontend/app/dashboard/faculty/logbook/page.tsx`
   - URL: `http://localhost:3000/dashboard/faculty/logbook`
5. **Faculty MIS UG Logbook Report**: `frontend/app/dashboard/faculty/reports/logbook/page.tsx`
   - URL: `http://localhost:3000/dashboard/faculty/reports/logbook`
6. **Student UG Logbook Submission**: `frontend/app/dashboard/student/logbook/page.tsx`
   - URL: `http://localhost:3000/dashboard/student/logbook`
7. **Student Logbook Submission Modal**: `frontend/components/LogbookSubmitModal.tsx`

---

## 2. Preserved Backend APIs & Database Schema
1. **Module**: `backend/src/logbook/`
   - Controller: `backend/src/logbook/logbook.controller.ts`
   - Service: `backend/src/logbook/logbook.service.ts`
2. **Endpoints**:
   - `GET /api/v1/logbook/activity-types` — List configured clinical activity types
   - `POST /api/v1/logbook/activity-types` — Create/Update activity types
   - `GET /api/v1/logbook/entries` — List student clinical logbook entries
   - `POST /api/v1/logbook/entries` — Submit new clinical procedure/logbook entry
   - `POST /api/v1/logbook/verify` — Faculty verification and sign-off
3. **Database Tables**:
   - `logbook_activity_types`
   - `logbook_entries`
   - `logbook_verifications`

---

## 3. How to Unhide / Display in UI (Step-by-Step)

When the user asks to **"unhide UG LogBook"** or **"show UG LogBook Master in UI"**:

### A. Re-enable in `frontend/components/Sidebar.tsx`:
1. In `role === 'admin'`:
   Add the menu links back:
   ```tsx
   <Link href="/dashboard/admin/ug-logbook/evaluation" className={getLinkClass('/dashboard/admin/ug-logbook/evaluation')}>
     <span>UG Logbook Evaluation</span>
   </Link>

   <Link href="/dashboard/admin/ug-logbook/activity-master" className={getLinkClass('/dashboard/admin/ug-logbook/activity-master')}>
     <span>UG Logbook Master</span>
   </Link>
   ```
2. In `role === 'admin'` MIS Reports Accordion:
   Add the report link back:
   ```tsx
   <Link href="/dashboard/admin/reports/logbook" className={...}>
     <span>2. UG LogBook Report</span>
   </Link>
   ```
3. In `role === 'faculty'`:
   Add the menu link back:
   ```tsx
   <Link href="/dashboard/faculty/logbook" className={getLinkClass('/dashboard/faculty/logbook')}>
     <span>UG Logbook Evaluation</span>
   </Link>
   ```
4. In `role === 'faculty'` MIS Reports Accordion:
   Add the report link back:
   ```tsx
   <Link href="/dashboard/faculty/reports/logbook" className={...}>
     <span>2. UG LogBook Report</span>
   </Link>
   ```

### B. Re-enable in `frontend/components/FacultyReportsNav.tsx`:
Include `{ id: 'logbook', href: `${base}/logbook`, title: 'UG LogBook Evaluation', ... }` in the `reports` array and update the grid to `grid-cols-1 md:grid-cols-3`.

---

*Last Updated: 2026-08-16 — Hidden as per user directive.*
