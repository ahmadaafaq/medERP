'use client';

import React from 'react';
import Link from 'next/link';

interface FacultyReportsNavProps {
  activeReport: 'attendance' | 'logbook' | 'theory';
  stats?: {
    attendanceCount?: number | string;
    logbookCount?: number | string;
    theoryCount?: number | string;
  };
}

export default function FacultyReportsNav({ activeReport, stats }: FacultyReportsNavProps) {
  const reports = [
    {
      id: 'attendance',
      href: '/dashboard/faculty/reports/attendance',
      title: 'MIS Attendance Ledger',
      subtitle: 'Daily logs, multi-subject matrix, cumulative & shortage analysis',
      icon: '📊',
      badge: stats?.attendanceCount !== undefined ? `${stats.attendanceCount} Records` : 'Attendance',
      accent: 'border-[#5B4BFF] text-[#5B4BFF]',
    },
    {
      id: 'logbook',
      href: '/dashboard/faculty/reports/logbook',
      title: 'UG LogBook Evaluation',
      subtitle: 'Clinical procedures, practical competencies & faculty sign-offs',
      icon: '📚',
      badge: stats?.logbookCount !== undefined ? `${stats.logbookCount} Verified` : 'LogBook',
      accent: 'border-[#00C48C] text-[#00C48C]',
    },
    {
      id: 'theory',
      href: '/dashboard/faculty/reports/theory-result',
      title: 'Theory & Assessment',
      subtitle: 'Exam papers, question-level analysis & competency scores',
      icon: '📝',
      badge: stats?.theoryCount !== undefined ? `${stats.theoryCount} Evaluated` : 'Assessment',
      accent: 'border-[#F36C21] text-[#F36C21]',
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-2 shadow-soft">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {reports.map((r) => {
          const isActive = activeReport === r.id;
          return (
            <Link
              key={r.id}
              href={r.href}
              className={`p-4 rounded-[18px] transition-all flex items-start justify-between gap-3 border ${
                isActive
                  ? 'bg-gradient-to-r from-[#5B4BFF]/10 via-[#7867FF]/5 to-transparent border-[#5B4BFF] shadow-sm'
                  : 'bg-[#F8FAFC] dark:bg-slate-800/60 border-transparent hover:border-[#E7EAF3] dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <span className="text-2xl p-2 rounded-xl bg-white dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 shadow-sm flex-shrink-0">
                  {r.icon}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-black tracking-tight truncate ${isActive ? 'text-[#5B4BFF]' : 'text-[#1B1E28] dark:text-white'}`}>
                      {r.title}
                    </h3>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-[#5B4BFF] animate-pulse flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#4E5969] dark:text-slate-400 font-medium line-clamp-1 mt-0.5">
                    {r.subtitle}
                  </p>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-black flex-shrink-0 border ${
                  isActive
                    ? 'bg-[#5B4BFF] text-white border-[#5B4BFF]'
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
