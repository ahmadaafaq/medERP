# MedERP — AI Agent Instructions & Architectural Constraints

When modifying or expanding code in this repository, follow these rules:

1. **Read `PROJECT_HANDOVER.md`**: Refer to [`PROJECT_HANDOVER.md`](file:///Users/apple/Documents/projects/unicampus-erp/PROJECT_HANDOVER.md) for full context on multi-tenancy, backend modules, and frontend pages.
2. **Schema Isolation**: All tenant queries must include PostgreSQL schema switching (`tenant_{slug}`). Never query across tenant boundaries.
3. **No String Concatenation in SQL**: Always use parameterized queries or TypeORM query builders to prevent SQL injection vulnerabilities.
4. **Theme Parity**: Frontend components MUST use the defined design tokens in `tailwind.config.js` (`primary: #6366F1`, `bg.dark: #0F172A`, `card.dark: #1E293B`) with glassmorphism styling (`backdrop-blur-sm`).
5. **No Automatic Binary Builds**: Never run automatic compilation for binary/APK builds unless explicitly requested by the user.
6. **Verification**: Always run `npm run build` in `backend/` to verify clean TypeScript compilation after adding new services, DTOs, or controllers.
