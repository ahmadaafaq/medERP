# 🏥 MedERP — Next.js 14 Web ERP Frontend

The Web ERP Portal for **MedERP** is built using Next.js 14 (App Router), TypeScript, Tailwind CSS, and shadcn/ui.

---

## 🎨 Design System & Theme
- **Color Palette**: Tailored HSL dark mode palette (`primary: #6366F1`, `bg.dark: #0F172A`, `card.dark: #1E293B`).
- **Glassmorphism**: Glass-like backdrop blur cards (`backdrop-blur-sm`, `bg-slate-800/70`, `border-slate-800`).
- **Typography**: Inter font via Google Fonts.

---

## 👥 Role Portals & Routes
* `/login`: Multi-role login tabbed portal (Student, Faculty, Admin, Warden).
* `/onboarding`: Step-by-step role onboarding wizard.
* `/dashboard/student`: Student attendance breakdown, logbook tracker, exam marks, fee receipts.
* `/dashboard/faculty`: Teaching schedule, logbook verification queue, marks entry matrix, leave requests.
* `/dashboard/admin`: College KPIs, student/faculty directories, fee structure manager, PG audit reports.

---

## 🛠️ Commands
```bash
# Run local dev server
npm run dev

# Build for production
npm run build
```
