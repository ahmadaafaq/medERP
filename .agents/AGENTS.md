# MedERP Workspace Rules for Antigravity AI Agents

- Read [`PROJECT_HANDOVER.md`](file:///Users/apple/Documents/projects/unicampus-erp/PROJECT_HANDOVER.md) for full context on MedERP multi-tenancy architecture, 18 NestJS modules, Next.js 14 Web ERP frontend, and database schema setup.
- Maintain schema-per-tenant isolation (`tenant_{slug}`).
- **Theme Design System (`Theme.md`)**: Always apply the official MedERP design system defined in [`Theme.md`](file:///f:/AI_DOCKER/AAFAQ_SIR_PROJECTS/UNICAMPDIR/ERP/medERP/.agents/Theme.md) for all new pages, UI components, and layouts.
  - **Default Theme Mode**: **Light Mode is ACTIVE BY DEFAULT** (`bg-page-light: #F6F8FC`, `card-bg: #FFFFFF`, `heading: #1B1E28`, `body: #4E5969`, `border: #E7EAF3`).
  - **Sidebar & Header**: Deep purple `#2D2575` with white icons/text and `#F36C21` active accent.
  - **Action Palette**: Primary `#5B4BFF`, Secondary `#7867FF`, Accent `#F36C21`, Success `#00C48C`, Warning `#FFB020`, Danger `#F04438`.
  - **Dual Mode**: Support both Light & Dark modes seamlessly, keeping Light Mode active by default.
  - **Cards & Spacing**: `rounded-[22px]` (22px radius), 24px padding, soft shadow (`shadow-soft`), smooth hover state.
  - **No Mock/Placeholder UI**: Never generate fake data or hardcoded mock records; consume backend APIs or display Skeletons / Empty States.
- Verify backend build using `npm run build` in `backend/` before declaring completing work.
- Never store in local storage but store in postgres.

