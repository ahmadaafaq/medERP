# 🏥 MedERP — NestJS Backend API

The backend API for **MedERP** is built on NestJS 10 with TypeORM, PostgreSQL schema-per-tenant multi-tenancy, Redis caching, AWS S3 file management, and Socket.IO real-time gateways.

---

## 📦 Domain Modules & API Routes

| Module | Base Route | Key Features |
|---|---|---|
| **AuthModule** | `/api/v1/auth` | JWT Access/Refresh tokens, bcrypt password hashing, account lockout. |
| **OnboardingModule** | `/api/v1/onboarding` | 5-role onboarding wizards, college setup & DB provisioning. |
| **TenantsModule** | `/api/v1/tenants` | Super-admin tenant lifecycle and schema creation. |
| **UsersModule** | `/api/v1/users` | User CRUD, role management, audit logging. |
| **StudentsModule** | `/api/v1/students` | Student profiles, academic stats, roll number queries. |
| **FacultyModule** | `/api/v1/faculty` | Faculty profiles, teaching batch assignments. |
| **AttendanceModule**| `/api/v1/attendance` | Attendance sessions, student status marking, biometric punch logs. |
| **LogbookModule** | `/api/v1/logbook` | UG/PG/Foundation logbook submission, verifications, monthly PG audits. |
| **ExaminationModule**| `/api/v1/exams` | Exam papers, competency weightages, student marks entry. |
| **FeesModule** | `/api/v1/fees` | Fee structures, student payments, tax-compliant receipt generation. |
| **LibraryModule** | `/api/v1/library` | Book catalog, digital E-Books, issue/return circulation. |
| **FilesModule** | `/api/v1/files` | AWS S3 presigned PUT/GET URLs with MIME validation. |
| **AnalyticsModule** | `/api/v1/analytics` | Multi-tenant KPI dashboards and operational metrics. |

---

## 🛠️ Commands

```bash
# Development mode
npm run start:dev

# Build for production
npm run build

# TypeORM Migration CLI
npm run migration:run
```
