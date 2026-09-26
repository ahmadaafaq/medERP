# MedERP — AI Agent Instructions & Architectural Constraints

> **CRITICAL RULE**: Remember to strictly adhere to `AGENTS.md` rules at all times BEFORE proposing or executing any code modifications. Never disturb, delete, or bypass existing business logic, tenant boundary isolation, or portal integrations.

When modifying or expanding code in this repository, follow these rules:

1. **Strict Adherence to `AGENTS.md` & `PROJECT_HANDOVER.md`**:
   - Always read and strictly comply with the architectural rules and constraints specified in this file (`AGENTS.md`) and [`PROJECT_HANDOVER.md`](file:///Users/apple/Documents/projects/unicampus-erp/PROJECT_HANDOVER.md) before writing code.
   - Never overwrite, mutate, or loosen existing features and rules.
2. **Schema Isolation**: All tenant queries must include PostgreSQL schema switching (`tenant_{slug}`). Never query across tenant boundaries.
3. **No String Concatenation in SQL**: Always use parameterized queries or TypeORM query builders to prevent SQL injection vulnerabilities.
4. **Theme Design System (`Theme.md`)**: All frontend pages, layouts, and components MUST adhere to the design system in [Theme.md](file:///f:/AI_DOCKER/AAFAQ_SIR_PROJECTS/UNICAMPDIR/ERP/medERP/.agents/Theme.md). **Light Mode is active by default** (`#F6F8FC` page background, `#FFFFFF` cards, `#1B1E28` headings, `#4E5969` body text, `#2D2575` sidebar/header, `#5B4BFF` primary buttons, `#F36C21` orange accents), with full dual Dark/Light mode compatibility.
5. **Dynamic Tenant Branding & Multi-Tenancy Isolation**:
   - **Never Hardcode Static Institution Data**: The menu top-left corner, sidebar, header, badges, profiles, widgets, and reports must dynamically display the authenticated tenant's real name (`user.collegeName`, `user.tenantName`, `storedName`, or registered firm title) and logo.
   - **No Global SRMS Overrides**: Never default non-SRMS tenants (e.g. `rajshree`, `rimt-bareilly`, `rmribar`, `rmch-bareilly`, `apex-tech`, or custom SaaS firms) to `'SRMS CET'` or `/srms-logo.png`.
   - **College Code Scoping**: College codes like `'1'`, `'2'`, `'11'` must strictly be scoped to tenants whose identifier contains `srms` (`slug.toLowerCase().includes('srms')`). Never use `colgCd === '1'` as a universal fallback for non-SRMS colleges.
   - **No Exclusion Filters**: Never introduce negative filters that suppress other tenants (e.g. `!storedName.includes('rajshree')`).
6. **No Automatic Binary Builds**: Never run automatic compilation for binary/APK builds unless explicitly requested by the user.
7. **Verification**: Always run `npm run build` in `backend/` to verify clean TypeScript compilation after adding new services, DTOs, or controllers.
8. **Timetable Synchronization & Live Schedule Integrity**:
   - **SRMS Tenants (`slug.includes('srms')`)**: Live SRMS portal API (`JsonResponse.ashx`) is the **sole authoritative source of truth** for any week's schedule. If SRMS API returns 0 records for a week (e.g. from 22 September onwards or upcoming months), the timetable schedule MUST return 0 records (empty grid). **Never project, repeat, or artificially backfill past timetable slots onto future weeks or upcoming months.**
   - **Never Auto-Insert into `timetable_slots`**: `GET /api/srms/timetable-schedule` must strictly be a read operation; it must never auto-insert or copy remote SRMS records into PostgreSQL `timetable_slots`.
   - **Tenant Keyword Isolation (`srms`)**: Only call SRMS API (`AddEvent`, `deleteEvent`, `JsonResponse.ashx`) if the tenant identifier contains keyword `srms`.
   - **Non-SRMS Tenants (`!slug.includes('srms')`)**: Strictly bypass all SRMS endpoints. Save only to and fetch only from PostgreSQL `timetable_slots` with strict date bounds (`effective_from` and `effective_until`).
