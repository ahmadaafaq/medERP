# MedERP — AI Agent Instructions & Architectural Constraints

When modifying or expanding code in this repository, follow these rules:

1. **Read `PROJECT_HANDOVER.md`**: Refer to [`PROJECT_HANDOVER.md`](file:///Users/apple/Documents/projects/unicampus-erp/PROJECT_HANDOVER.md) for full context on multi-tenancy, backend modules, and frontend pages.
2. **Schema Isolation**: All tenant queries must include PostgreSQL schema switching (`tenant_{slug}`). Never query across tenant boundaries.
3. **No String Concatenation in SQL**: Always use parameterized queries or TypeORM query builders to prevent SQL injection vulnerabilities.
4. **Theme Design System (`Theme.md`)**: All frontend pages, layouts, and components MUST adhere to the design system in [Theme.md](file:///f:/AI_DOCKER/AAFAQ_SIR_PROJECTS/UNICAMPDIR/ERP/medERP/.agents/Theme.md). **Light Mode is active by default** (`#F6F8FC` page background, `#FFFFFF` cards, `#1B1E28` headings, `#4E5969` body text, `#2D2575` sidebar/header, `#5B4BFF` primary buttons, `#F36C21` orange accents), with full dual Dark/Light mode compatibility.
5. **No Automatic Binary Builds**: Never run automatic compilation for binary/APK builds unless explicitly requested by the user.
6. **Verification**: Always run `npm run build` in `backend/` to verify clean TypeScript compilation after adding new services, DTOs, or controllers.
