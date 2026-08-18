'use client';

import Header from '../../../components/Header';
import Sidebar from '../../../components/Sidebar';
import Link from 'next/link';
import RecentLessonsWidget from '../../../components/RecentLessonsWidget';
import AttendanceWidget from '../../../components/AttendanceWidget';

export default function ClerkDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      <Sidebar role="clerk" />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header title="Clerk Data Entry & Verification Portal" />

        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Link
              href="/dashboard/admin/attendance-master"
              className="p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all group shadow-lg space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors">Attendance Master</h3>
                <p className="text-xs text-slate-400 mt-1">Batch-wise daily attendance marking & biometric roster imports.</p>
              </div>
            </Link>

            <Link
              href="/dashboard/admin/assessment-marks"
              className="p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition-all group shadow-lg space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white group-hover:text-purple-400 transition-colors">Assessment Marks Entry</h3>
                <p className="text-xs text-slate-400 mt-1">Input internal assessments, formative test marks, and practical scores.</p>
              </div>
            </Link>

            <Link
              href="/dashboard/admin/student-master"
              className="p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all group shadow-lg space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white group-hover:text-emerald-400 transition-colors">Student Roster Master</h3>
                <p className="text-xs text-slate-400 mt-1">View student registration records, roll numbers, and contact info.</p>
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AttendanceWidget role="CLERK" />
            <RecentLessonsWidget role="CLERK" />
          </div>
        </div>
      </main>
    </div>
  );
}
