'use client';

import Header from '../../../components/Header';
import Sidebar from '../../../components/Sidebar';
import Link from 'next/link';
import NoticeListWidget from '../../../components/notices/NoticeListWidget';
import NoticeLoginAlertModal from '../../../components/notices/NoticeLoginAlertModal';

export default function ClerkDashboardPage() {
  return (
    <div className="min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 flex font-sans">
      <Sidebar role="clerk" />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header title="Clerk Data Entry & Verification Portal" />

        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Welcome Banner */}
          <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-[#5B4BFF] font-mono font-bold uppercase tracking-wider">
                  CLERK WORKSPACE
                </span>
                <span className="text-xs text-[#4E5969] dark:text-slate-400">Data Entry & Records Space</span>
              </div>
              <h1 className="text-xl font-black text-[#1B1E28] dark:text-white">Clerk Administration Console</h1>
              <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium">
                Manage batch attendance feeds, candidate examination marks entry, and student records verification.
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-center">
                <p className="text-[10px] text-[#4E5969] dark:text-slate-400 font-bold uppercase">Pending Batches</p>
                <p className="text-lg font-black text-[#F36C21]">12 Batches</p>
              </div>
            </div>
          </div>

          {/* Campus Alerts & Circulars Widget */}
          <NoticeListWidget limit={3} title="Administrative Notices & Circulars" role="clerk" />

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Link
              href="/dashboard/admin/attendance-master"
              className="p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 hover:border-[#5B4BFF] transition-all group shadow-soft space-y-3"
            >
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-[#5B4BFF] group-hover:bg-[#5B4BFF] group-hover:text-white flex items-center justify-center transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#1B1E28] dark:text-white group-hover:text-[#5B4BFF] transition-colors">Attendance Master</h3>
                <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-1">Batch-wise daily attendance marking & biometric roster imports.</p>
              </div>
            </Link>

            <Link
              href="/dashboard/admin/assessment-marks"
              className="p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 hover:border-[#5B4BFF] transition-all group shadow-soft space-y-3"
            >
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#1B1E28] dark:text-white group-hover:text-purple-600 transition-colors">Assessment Marks Entry</h3>
                <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-1">Input internal assessments, formative test marks, and practical scores.</p>
              </div>
            </Link>

            <Link
              href="/dashboard/admin/student-master"
              className="p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 hover:border-[#00C48C] transition-all group shadow-soft space-y-3"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#00C48C] group-hover:bg-[#00C48C] group-hover:text-white flex items-center justify-center transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#1B1E28] dark:text-white group-hover:text-[#00C48C] transition-colors">Student Roster Master</h3>
                <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-1">View student registration records, roll numbers, and contact info.</p>
              </div>
            </Link>
          </div>
        </div>
      </main>

      <NoticeLoginAlertModal />
    </div>
  );
}
