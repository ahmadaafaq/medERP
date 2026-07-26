# 🏥 MedERP — Project Architecture & AI Agent Handover Guide

> **Notice for AI Agents (Antigravity & Coding Assistants)**:
> This document provides complete architectural context, database schema design, design system tokens, module locations, and coding conventions for **MedERP v2.0**.
> Read this file first to understand the system structure before making edits or expanding features.

---

## 📌 1. Executive Summary & Tech Stack

MedERP is an enterprise-grade multi-tenant Medical University ERP platform built to serve multiple colleges as isolated tenants with high-performance APIs and role-based web portals.

### **Technology Stack**:
- **Monorepo**: Single repository containing `backend/`, `frontend/`, `shared/`, `nginx/`, and `scripts/`.
- **Backend**: Node.js 20 LTS + NestJS 10 + TypeScript (Strict mode).
- **ORM & DB**: TypeORM + PostgreSQL 16 (Schema-per-tenant isolation `tenant_{slug}`).
- **Cache & Rate Limiting**: Redis 7 (`ioredis` + `@nestjs/throttler`).
- **Authentication**: Passport.js + JWT (Access token + Redis refresh token rotation).
- **File Storage**: AWS S3 (`@aws-sdk/client-s3`) using presigned URLs with 15-minute expiration.
- **WebSockets**: Socket.IO (`ChatGateway` & `NotificationsGateway`).
- **Frontend**: Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS v3 + shadcn/ui.
- **Design System**: Dark-mode glassmorphism matching mobile design tokens (`primary: #6366F1`, `bg.dark: #0F172A`, `card.dark: #1E293B`).

---

## 🗂️ 2. Repository Layout

```
unicampus-erp/
├── PROJECT_HANDOVER.md        # Main AI Agent & Developer Handover Guide
├── AGENTS.md                  # Strict Coding Rules for AI Agents
├── README.md                  # Monorepo setup & local quickstart guide
│
├── backend/                   # NestJS 10 REST API + Socket.IO + TypeORM
│   ├── src/
│   │   ├── auth/              # JWT Login, Refresh, Password Reset, RBAC
│   │   ├── onboarding/        # Status check, College Setup & DB Provisioning
│   │   ├── tenants/           # Multi-Tenant lifecycle management
│   │   ├── users/             # User CRUD, Roles & Audit Logging
│   │   ├── students/          # Student Profiles & Academic Summaries
│   │   ├── faculty/           # Faculty Profiles & Teaching Batches
│   │   ├── attendance/        # Session Attendance & Biometric Punches
│   │   ├── logbook/           # UG/PG/Foundation Logbooks & Monthly PG Audits
│   │   ├── examination/       # Papers, Competency Weightages & Student Marks
│   │   ├── timetable/         # Schedule Slot Builder & Timetables
│   │   ├── hr/                # Payslips, Salary Records & Leave Applications
│   │   ├── library/           # Book Inventory, E-Books & Issue/Return Circulation
│   │   ├── communication/     # Socket.IO Chat Gateway & Group Messaging
│   │   ├── notifications/     # Socket.IO Notifications Gateway & Broadcasts
│   │   ├── fees/              # Fee Structure Builder & Payment Receipt Generator
│   │   ├── analytics/         # Redis-cached Multi-Tenant KPIs
│   │   ├── files/             # AWS S3 Presigned Upload/Download URL Generator
│   │   ├── hostel/            # Hostel Blocks, Rooms & Allotments
│   │   ├── common/            # Guards, Decorators, Filters, Interceptors & Middleware
│   │   └── database/          # TypeORM Entities & TenantSchemaService
│   ├── main.ts                # NestJS Entrypoint (Global Pipes, Filters & Helmet)
│   └── package.json
│
├── frontend/                  # Next.js 14 Web ERP Portal
│   ├── app/
│   │   ├── login/             # Multi-role Login Portal (Student, Faculty, Admin, Warden)
│   │   ├── onboarding/        # Step-by-Step Role Wizards (Student, Faculty, Admin, College)
│   │   ├── dashboard/
│   │   │   ├── student/       # Student Academic Dashboard & Modals
│   │   │   ├── faculty/       # Faculty Attendance Marker & Verification Queue
│   │   │   └── admin/         # College Administration KPIs & System Status
│   │   ├── layout.tsx         # Global Layout (Inter font & dark mode provider)
│   │   └── page.tsx           # Platform Landing Page
│   ├── components/            # Reusable UI (Sidebar, Header, LogbookModal, FeeReceiptModal, AttendanceGrid)
│   └── tailwind.config.js     # Exact MedERP Theme Color Tokens
│
├── shared/                    # Shared TypeScript Interfaces & Data Contracts
│   ├── types/                 # roles.types.ts, api.types.ts, user.types.ts, student.types.ts
│   └── index.ts
│
├── scripts/                   # DB Scripts & Tenant Data Seeder
│   └── seed-tenant-data.ts    # Populates tenant_srms with rich sample data
│
└── docker-compose.dev.yml     # PostgreSQL 16 + Redis 7 + Nginx
```

---

## 🔒 3. Multi-Tenancy Architecture

- **Strategy**: PostgreSQL Schema-per-Tenant (`tenant_{slug}`).
- **Public Schema**:
  - `public.tenants`: Stores tenant metadata (`id`, `name`, `slug`, `domain`, `plan`, `logo_url`, `primary_color`, `schema_provisioned`).
  - `public.audit_logs`: Immutable INSERT-only audit log for all POST/PUT/DELETE mutations across tenants.
- **Tenant Isolation**:
  - `TenantMiddleware` extracts subdomain or `X-Tenant-Id` header from incoming request and attaches `req.tenant = { slug }`.
  - Service queries set `SET search_path TO "tenant_{slug}", public` for full data isolation.
- **File Storage Key Pattern**: `{tenant_slug}/{entity_type}/{uuid}.{ext}`.

---

## 🎨 4. Design System & Frontend Theme Tokens

When adding or modifying web pages in `frontend/`, **always adhere strictly** to the defined design system:

```javascript
// tailwind.config.js
colors: {
  primary: { DEFAULT: '#6366F1', dark: '#4F46E5' }, // Indigo
  success: '#10B981',                               // Emerald
  warning: '#F59E0B',                               // Amber
  danger: '#EF4444',                                // Rose
  bg: { light: '#F8FAFC', dark: '#0F172A' },         // Slate-900 Dark BG
  card: { light: '#FFFFFF', dark: '#1E293B' },       // Slate-800 Card BG
  text: {
    primary: { light: '#0F172A', dark: '#F8FAFC' },
    muted: { light: '#64748B', dark: '#94A3B8' },
  },
  border: { light: '#E2E8F0', dark: '#334155' },
}
```

### Styling Guidelines:
- **Dark Mode First**: All pages default to class `.dark` with background `#0F172A`.
- **Glassmorphism**: Use `.glass-card` class (`bg-slate-800/70`, `backdrop-blur-sm`, `border border-slate-800`).
- **Typography**: Inter font (`font-sans`). Section headings: `font-extrabold tracking-tight text-white`. Badges: `text-[10px] font-semibold uppercase tracking-wider`.

---

## 🚀 5. How to Run & Expand the Project

### Running Locally
1. **Start Database & Redis**:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```
2. **Seed Sample Tenant Data**:
   ```bash
   npx ts-node scripts/seed-tenant-data.ts
   ```
3. **Start Backend**:
   ```bash
   cd backend && npm run start:dev
   ```
4. **Start Frontend**:
   ```bash
   cd frontend && npm run dev
   ```

### Verification Commands
```bash
# Verify backend TypeScript compilation:
cd backend && npm run build

# Verify frontend Next.js compilation:
cd frontend && npm run build
```

---

## 📋 6. Guidelines for AI Agents & Developers

1. **Parameterize All Database Queries**: Zero SQL string concatenation. Always use TypeORM or parameterized `$1, $2` parameters.
2. **Enforce Tenant Context**: Ensure all new backend controllers use `@Tenant() tenantSlug: string` or `@TenantId()`.
3. **Response Envelope**: Maintain standard API response envelope `{ success: boolean, data: T, message?: string }`.
4. **Preserve Documentation**: Keep README files updated when adding new modules or frontend routes.
