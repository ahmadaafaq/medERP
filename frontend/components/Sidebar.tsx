'use client';
import Link from 'next/link';

interface SidebarProps {
  role: 'student' | 'faculty' | 'admin' | 'warden';
}

export default function Sidebar({ role }: SidebarProps) {
  const linksMap = {
    student: [
      { label: 'Dashboard', href: '/dashboard/student' },
      { label: 'Attendance', href: '/dashboard/student' },
      { label: 'Logbook Tracker', href: '/dashboard/student' },
      { label: 'Exam Results', href: '/dashboard/student' },
      { label: 'Fees & Receipts', href: '/dashboard/student' },
      { label: 'E-Library Catalog', href: '/dashboard/student' },
    ],
    faculty: [
      { label: 'Teaching Overview', href: '/dashboard/faculty' },
      { label: 'Mark Attendance', href: '/dashboard/faculty' },
      { label: 'Logbook Verification Queue', href: '/dashboard/faculty' },
      { label: 'Marks Entry Matrix', href: '/dashboard/faculty' },
      { label: 'Leave & Salary', href: '/dashboard/faculty' },
    ],
    admin: [
      { label: 'College KPIs', href: '/dashboard/admin' },
      { label: 'Student Directory', href: '/dashboard/admin' },
      { label: 'Faculty Directory', href: '/dashboard/admin' },
      { label: 'Fee Structure Builder', href: '/dashboard/admin' },
      { label: 'PG Logbook Audit', href: '/dashboard/admin' },
    ],
    warden: [
      { label: 'Hostel Overview', href: '/dashboard/admin' },
      { label: 'Room Allotments', href: '/dashboard/admin' },
    ],
  };

  const links = linksMap[role] || linksMap.student;

  return (
    <aside className="w-64 glass-card border-r border-slate-800 p-4 min-h-screen flex flex-col justify-between">
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow">
            M
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-white tracking-tight">MedERP Portal</h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{role} Portal</p>
          </div>
        </div>

        <nav className="space-y-1">
          {links.map((link, idx) => (
            <Link
              key={idx}
              href={link.href}
              className="block px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="pt-4 border-t border-slate-800 text-xs text-slate-500">
        Tenant: <span className="text-slate-300 font-semibold">srms</span>
      </div>
    </aside>
  );
}
