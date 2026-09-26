# MedERP Workspace Rules for Antigravity AI Agents

> **CRITICAL RULE**: Remember to strictly adhere to `AGENTS.md` rules at all times BEFORE proposing or executing any code modifications. Never disturb, delete, or bypass existing business logic, tenant boundary isolation, or portal integrations.

- **Strict Adherence**: Always read and strictly adhere to `AGENTS.md` rules and [`PROJECT_HANDOVER.md`](file:///Users/apple/Documents/projects/unicampus-erp/PROJECT_HANDOVER.md) for full context on MedERP multi-tenancy architecture, 18 NestJS modules, Next.js 14 Web ERP frontend, and database schema setup.
- **Maintain Schema-per-Tenant Isolation**: Switch dynamically via `tenant_{slug}` and never query across tenant boundaries.
- **Dynamic Tenant Branding & Multi-Tenancy Isolation**:
  - The menu top-left corner, sidebar, header, badges, profiles, widgets, and reports must dynamically display the authenticated tenant's real name (`user.collegeName`, `user.tenantName`, `storedName`, or registered firm title) and logo.
  - **Never hardcode static institution names or logos** (e.g. `'SRMS CET'`, `'SRMS CET, BAREILLY'`, `/srms-logo.png`) as global defaults for other institutions.
  - Non-SRMS tenants (e.g. `rajshree`, `rimt-bareilly`, `rmribar`, `rmch-bareilly`, `apex-tech`, or any custom SaaS tenant) must never be hijacked by SRMS defaults or college codes (`colgCd === '1'`).
  - Only associate college codes like `'1'`, `'2'`, `'11'` with SRMS institutions if `slug.toLowerCase().includes('srms')`.
  - Never introduce negative filters that suppress other tenants (e.g. `!storedName.includes('rajshree')`).
- **Theme Design System (`Theme.md`)**: Always apply the official MedERP design system defined in [`Theme.md`](file:///f:/AI_DOCKER/AAFAQ_SIR_PROJECTS/UNICAMPDIR/ERP/medERP/.agents/Theme.md) for all new pages, UI components, and layouts.
  - **Default Theme Mode**: **Light Mode is ACTIVE BY DEFAULT** (`bg-page-light: #F6F8FC`, `card-bg: #FFFFFF`, `heading: #1B1E28`, `body: #4E5969`, `border: #E7EAF3`).
  - **Sidebar & Header**: Deep purple `#2D2575` with white icons/text and `#F36C21` active accent.
  - **Action Palette**: Primary `#5B4BFF`, Secondary `#7867FF`, Accent `#F36C21`, Success `#00C48C`, Warning `#FFB020`, Danger `#F04438`.
  - **Dual Mode**: Support both Light & Dark modes seamlessly, keeping Light Mode active by default.
  - **Cards & Spacing**: `rounded-[22px]` (22px radius), 24px padding, soft shadow (`shadow-soft`), smooth hover state.
  - **No Mock/Placeholder UI**: Never generate fake data or hardcoded mock records; consume backend APIs or display Skeletons / Empty States.
- **Verification**: Always run `npm run build` in `backend/` before declaring completing work.
- **Persistence**: Never store tenant operational state exclusively in local storage; persist to PostgreSQL.
- **Timetable Synchronization & Isolation Rules**:
  - **SRMS Tenants (tenant slug contains keyword `srms`)**:
    - The live SRMS portal API (`https://myportal.srms.ac.in/timetable/master/JsonResponse.ashx`) is the **sole authoritative source of truth** for scheduled slots for any calendar week.
    - If the SRMS API returns 0 records for a week (e.g., from 22 September onwards or upcoming months), the timetable schedule endpoint MUST return 0 records (empty grid). **Never project, repeat, or artificially backfill past timetable slots onto future weeks or upcoming months.**
    - `GET /api/srms/timetable-schedule` is strictly a read operation: **Never auto-insert, background-sync, or duplicate fetched remote SRMS records into PostgreSQL `timetable_slots`.**
    - Saving a slot (`add-event`) calls the official SRMS API (`srmserp/Timetbl/AddEvent`) and stores curriculum topic/unit details in PostgreSQL `srms_timetable_events`.
    - Deleting a slot (`delete-event`) calls the official SRMS API (`designtimetable.aspx/deleteEvent` / `srmserp/Timetbl/DeleteEvent`) and removes the record from PostgreSQL.
  - **Non-SRMS Tenants (tenant slug does NOT contain keyword `srms`)**:
    - **Strict Portal Isolation**: Must **NEVER** call any SRMS portal endpoints (`myportal.srms.ac.in`) under any circumstances (no `JsonResponse.ashx`, no `AddEvent`, no `deleteEvent`, no `Loadsubject`).
    - Save strictly to and fetch strictly from PostgreSQL `timetable_slots` in that tenant's schema (`tenant_${slug}`).
    - All PostgreSQL timetable slots must enforce explicit date bounds (`effective_from` as Monday and `effective_until` as Sunday of the scheduled week) so slots never bleed or duplicate into future months.
  - **Curriculum Topic & Unit Enrichment**:
    - Units, topics, subtopics, and competency codes are managed in PostgreSQL to enrich live calendar slots without mutating live portal dates or creating ghost events.
