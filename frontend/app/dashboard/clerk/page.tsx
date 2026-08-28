'use client';

import Header from '../../../components/Header';
import Sidebar from '../../../components/Sidebar';
import Link from 'next/link';
import RecentLessonsWidget from '../../../components/RecentLessonsWidget';
import AttendanceWidget from '../../../components/AttendanceWidget';
import NoticeDashboardWidget from '../../../components/notices/NoticeDashboardWidget';
import LibraryDashboardCard from '../../../components/library/LibraryDashboardCard';
import ChatDashboardWidget from '../../../components/chat/ChatDashboardWidget';

export default function ClerkDashboardPage() {
  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar role="clerk" />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Clerk Data Entry & Verification Portal" />

        <main className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full flex-1 overflow-x-hidden">
          {/* Welcome Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-900/40 via-purple-900/20 to-slate-900 border border-rose-500/20 shadow-xl flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-mono font-bold uppercase tracking-wider">
                  CLERK PORTAL
                </span>
                <span className="text-xs text-slate-400">Data Entry Operator Space</span>
              </div>
              <h1 className="text-2xl font-black text-white">Clerk Administration Console</h1>
              <p className="text-xs text-slate-300">
                Manage batch attendance feeds, candidate examination marks entry, and student records verification.
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Pending Entries</p>
                <p className="text-lg font-black text-rose-400">12 Batches</p>
              </div>
            </div>
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
            <Link
              href="/dashboard/admin/staff-master"
              className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 hover:border-[#5B4BFF]/50 transition-all group shadow-sm hover:shadow-lg space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-[#5B4BFF]/10 text-[#5B4BFF] group-hover:bg-[#5B4BFF] group-hover:text-white flex items-center justify-center transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#1B1E28] dark:text-white group-hover:text-[#5B4BFF] transition-colors">Staff & Faculty Master</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage staff records, update profiles & bulk excel import.</p>
              </div>
            </Link>

            <Link
              href="/dashboard/admin/student-master"
              className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 hover:border-emerald-500/50 transition-all group shadow-sm hover:shadow-lg space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#1B1E28] dark:text-white group-hover:text-emerald-500 transition-colors">Student Roster Master</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">View student registration records, roll numbers, and contact info.</p>
              </div>
            </Link>

            <Link
              href="/dashboard/clerk/attendance"
              className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 hover:border-indigo-500/50 transition-all group shadow-sm hover:shadow-lg space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#1B1E28] dark:text-white group-hover:text-indigo-500 transition-colors">Attendance Master</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Batch-wise daily attendance marking & biometric roster imports.</p>
              </div>
            </Link>

            <Link
              href="/dashboard/clerk/assessment"
              className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 hover:border-sky-500/50 transition-all group shadow-sm hover:shadow-lg space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 group-hover:bg-sky-600 group-hover:text-white flex items-center justify-center transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#1B1E28] dark:text-white group-hover:text-sky-500 transition-colors">Assessment & Q-Bank</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Question bank creation, test blueprinting, and paper publishing.</p>
              </div>
            </Link>

            <Link
              href="/dashboard/admin/assessment-marks"
              className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 hover:border-purple-500/50 transition-all group shadow-sm hover:shadow-lg space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#1B1E28] dark:text-white group-hover:text-purple-500 transition-colors">Assessment Marks Entry</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Input internal assessments, formative test marks, and scores.</p>
              </div>
            </Link>
          </div>

          {/* Communications, Notices & Recent Materials Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            <ChatDashboardWidget role="FACULTY" chatUrl="/dashboard/clerk/chat" />
            <NoticeDashboardWidget role="clerk" />
            <RecentLessonsWidget role="CLERK" />
          </div>

          {/* Digital Library & Academic Catalog Card */}
          <LibraryDashboardCard role="clerk" />

          <div className="grid grid-cols-1 gap-6">
            <AttendanceWidget role="CLERK" />
          </div>
        </main>
      </div>
    </div>
  );
}
