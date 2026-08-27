'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface FacultyReportsNavProps {
  activeReport: 'attendance' | 'logbook' | 'theory';
  role?: 'admin' | 'faculty';
  stats?: {
    attendanceCount?: number | string;
    logbookCount?: number | string;
    theoryCount?: number | string;
  };
}

export default function FacultyReportsNav({ activeReport, role, stats }: FacultyReportsNavProps) {
  const pathname = usePathname();
  const isAdmin = role === 'admin' || (pathname && pathname.includes('/dashboard/admin/'));
  const base = isAdmin ? '/dashboard/admin/reports' : '/dashboard/faculty/reports';

  const reports = [
    {
      id: 'attendance',
      href: `${base}/attendance`,
      title: 'MIS Attendance Ledger',
      subtitle: 'Daily logs, multi-subject matrix, cumulative & shortage analysis',
      icon: '📊',
      badge: stats?.attendanceCount !== undefined ? `${stats.attendanceCount} Records` : 'Attendance',
      accent: 'border-[#5B4BFF] text-[#5B4BFF]',
    },
    {
      id: 'theory',
      href: `${base}/theory-result`,
      title: 'Theory & Assessment',
      subtitle: 'Exam papers, question-level analysis & competency scores',
      icon: '📝',
      badge: stats?.theoryCount !== undefined ? `${stats.theoryCount} Evaluated` : 'Assessment',
      accent: 'border-[#F36C21] text-[#F36C21]',
    },
  ];


  return (
    <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-2 shadow-soft">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {reports.map((r) => {
          const isActive = activeReport === r.id;
          return (
            <Link
              key={r.id}
              href={r.href}
              className={`p-4 rounded-[18px] transition-all flex items-start justify-between gap-3 border ${
                isActive
                  ? 'bg-gradient-to-r from-[#F36C21] to-[#E05B10] text-white border-[#F36C21] shadow-md'
                  : 'bg-[#F8FAFC] dark:bg-slate-800/60 border-transparent hover:border-[#E7EAF3] dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <span
                  className={`text-2xl p-2 rounded-xl border flex-shrink-0 shadow-sm transition-colors ${
                    isActive
                      ? 'bg-white text-[#F36C21] border-white'
                      : 'bg-white dark:bg-slate-800 border-[#E7EAF3] dark:border-slate-700'
                  }`}
                >
                  {r.icon}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-sm font-black tracking-tight truncate ${
                        isActive ? 'text-white' : 'text-[#1B1E28] dark:text-white'
                      }`}
                    >
                      {r.title}
                    </h3>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse flex-shrink-0" />
                    )}
                  </div>
                  <p
                    className={`text-[11px] font-semibold line-clamp-1 mt-0.5 ${
                      isActive ? 'text-white/95' : 'text-[#4E5969] dark:text-slate-400'
                    }`}
                  >
                    {r.subtitle}
                  </p>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-black flex-shrink-0 border transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white border-white/40 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-[#4E5969] dark:text-slate-300 border-[#E7EAF3] dark:border-slate-700'
                }`}
              >
                {r.badge}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
