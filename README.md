# 🏥 MedERP — Multi-Tenant Medical University ERP Platform (v2.0)

MedERP is a production-grade, multi-tenant Medical University ERP platform built with a high-performance **NestJS 10** backend and a modern **Next.js 14 (App Router)** web portal.

---

## 🏗️ Monorepo Architecture

```
unicampus-erp/
├── backend/                  # NestJS 10 REST API + Socket.IO + TypeORM
│   ├── src/
│   │   ├── auth/             # JWT Auth, Refresh Rotation, RBAC
│   │   ├── onboarding/       # 5-Role Onboarding Wizards & Setup
│   │   ├── tenants/          # Multi-Tenant Schema Provisioning
│   │   ├── users/            # User Management & RBAC
│   │   ├── students/         # Student Profiles & Academic Records
│   │   ├── faculty/          # Faculty Profiles & Teaching Batches
│   │   ├── attendance/       # Session Attendance & Biometric Punches
│   │   ├── logbook/          # UG/PG/Foundation Clinical Logbook
│   │   ├── examination/      # Papers, Competencies & Student Marks
│   │   ├── timetable/        # Slot Scheduling & Schedules
│   │   ├── hr/               # Payslips, Salary & Leave Applications
│   │   ├── library/          # Book Inventory, E-Books & Circulation
│   │   ├── communication/    # Real-Time Group Chat (Socket.IO)
│   │   ├── notifications/    # System & WebSocket Notifications
│   │   ├── fees/             # Fee Structures & Receipt Generation
│   │   ├── analytics/        # Redis-cached Multi-Tenant KPIs
│   │   ├── files/            # AWS S3 Presigned Upload & Download URLs
│   │   └── database/         # PostgreSQL Schema-per-Tenant Service & Entities
│   └── README.md
│
├── frontend/                 # Next.js 14 App Router Web ERP
│   ├── app/                  # Public Auth, Onboarding & Role Portals
│   ├── components/           # Glassmorphism UI Components (Sidebar, Header, StatCard)
│   └── README.md
│
├── shared/                   # Shared TypeScript Interfaces & Envelopes
│   └── README.md
│
├── nginx/                    # Reverse Proxy Configuration
│   └── README.md
│
├── scripts/                  # DB Initialization & Migration Utilities
│   └── README.md
│
└── docker-compose.yml        # Orchestration (PostgreSQL 16, Redis 7, Backend, Frontend, Nginx)
```

---

## 🚀 Quick Start & Local Development

### 1. Start Infrastructure via Docker Compose
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 2. Backend (NestJS 10)
```bash
cd backend
npm install
npm run start:dev
```
API endpoint running at `http://localhost:3000/api/v1`

### 3. Frontend (Next.js 14)
```bash
cd frontend
npm install
npm run dev
```
Web ERP running at `http://localhost:3001` (or proxied via Next.js dev server).

---

## 🔒 Multi-Tenancy Strategy
* **Isolation**: PostgreSQL Schema-per-Tenant (`tenant_{slug}`).
* **Resolution**: Subdomain or `X-Tenant-Id` header resolved via `TenantMiddleware`.
* **File Storage**: AWS S3 with tenant-scoped presigned URLs (`{tenant_slug}/{entity}/{uuid}.{ext}`).
