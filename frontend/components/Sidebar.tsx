'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  role: 'student' | 'faculty' | 'admin' | 'warden';
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const getLinkClass = (href: string) => {
    const isActive = pathname === href || (href !== '/dashboard/admin' && pathname.startsWith(href));
    return isActive
      ? 'flex items-center gap-2.5 px-3.5 py-2.5 rounded-r-lg font-bold text-indigo-600 dark:text-indigo-400 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-l-[3px] border-indigo-500/90 shadow-[inset_1px_0_0_rgba(99,102,241,0.1)] transition-all group'
      : 'flex items-center gap-2.5 px-3.5 py-2.5 rounded-r-lg font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-slate-800/40 border-l-[3px] border-transparent transition-all group';
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-50 via-slate-100/90 to-slate-50 dark:from-slate-950 dark:via-[#0b0f19]/90 dark:to-slate-950 border-r border-slate-200/50 dark:border-slate-800/50 p-4 sticky top-0 h-screen overflow-y-auto flex flex-col justify-between shrink-0 transition-colors z-20 shadow-[4px_0_24px_rgba(0,0,0,0.01)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.25)]">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-sm shadow-md shadow-indigo-600/35 border border-indigo-400/20">
            M
          </div>
          <div>
            <h1 className="font-black text-xs text-slate-800 dark:text-white tracking-wide uppercase">MedERP Portal</h1>
            <p className="text-[9px] text-indigo-500 dark:text-indigo-400 font-extrabold uppercase tracking-wider">{role} space</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-2 text-xs font-medium pr-1">
          {role === 'admin' ? (
            <>
              <Link href="/dashboard/admin" className={getLinkClass('/dashboard/admin')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>College KPIs</span>
              </Link>

              <Link href="/dashboard/admin/college-master" className={getLinkClass('/dashboard/admin/college-master')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>College Master</span>
              </Link>

              <Link href="/dashboard/admin/admin-master" className={getLinkClass('/dashboard/admin/admin-master')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Admin Master</span>
              </Link>

              <Link href="/dashboard/admin/student-master" className={getLinkClass('/dashboard/admin/student-master')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v7" />
                </svg>
                <span>Student Master</span>
              </Link>

              <Link href="/dashboard/admin/staff-master" className={getLinkClass('/dashboard/admin/staff-master')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Staff Master</span>
              </Link>

              <Link href="/dashboard/admin/subject-linker" className={getLinkClass('/dashboard/admin/subject-linker')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span>Subject Linker</span>
              </Link>

              <Link href="/dashboard/admin/timetable-design" className={getLinkClass('/dashboard/admin/timetable-design')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Design Timetable</span>
              </Link>

              <Link href="/dashboard/admin/attendance-master" className={getLinkClass('/dashboard/admin/attendance-master')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span>Attendance Master</span>
              </Link>

              <Link href="/dashboard/admin/attendance-reports" className={getLinkClass('/dashboard/admin/attendance-reports')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>MIS Attendance Reports</span>
              </Link>

              <Link href="/dashboard/admin" className={getLinkClass('/dashboard/admin/faculty-directory')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Faculty Directory</span>
              </Link>

              <Link href="/dashboard/admin" className={getLinkClass('/dashboard/admin/fees')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>Fee Structure Builder</span>
              </Link>

              <Link href="/dashboard/admin/assessment" className={getLinkClass('/dashboard/admin/assessment')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Assessment & Q-Bank</span>
              </Link>

              <Link href="/dashboard/admin" className={getLinkClass('/dashboard/admin/logbook-audit')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>PG Logbook Audit</span>
              </Link>
            </>
          ) : (
            <>
              <Link href="/dashboard/student" className={getLinkClass('/dashboard/student')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Dashboard</span>
              </Link>

              <Link href="/dashboard/student/timetable" className={getLinkClass('/dashboard/student/timetable')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Time Table</span>
              </Link>

              <Link href="/dashboard/student/schedule" className={getLinkClass('/dashboard/student/schedule')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Schedule</span>
              </Link>

              <Link href="/dashboard/student/logbook" className={getLinkClass('/dashboard/student/logbook')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>UG Logbook</span>
              </Link>

              <Link href="/dashboard/student/attendance" className={getLinkClass('/dashboard/student/attendance')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span>Attendance</span>
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Tenant Footer Badge */}
      <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800/50 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between font-mono">
        <span className="uppercase tracking-wider font-bold">Context</span>
        <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-bold uppercase tracking-widest text-[9px] shadow-sm shadow-indigo-500/5">
          srms
        </span>
      </div>
    </aside>
  );
}

