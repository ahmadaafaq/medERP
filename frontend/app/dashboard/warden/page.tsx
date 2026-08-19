'use client';

import Header from '../../../components/Header';
import Sidebar from '../../../components/Sidebar';
import Link from 'next/link';
import NoticeListWidget from '../../../components/notices/NoticeListWidget';
import NoticeLoginAlertModal from '../../../components/notices/NoticeLoginAlertModal';

export default function WardenDashboardPage() {
  return (
    <div className="min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 flex font-sans">
      <Sidebar role="warden" />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header title="Hostel Warden Administration & Allotment Console" />

        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Welcome Banner */}
          <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-[#5B4BFF] font-mono font-bold uppercase tracking-wider">
                  WARDEN WORKSPACE
                </span>
                <span className="text-xs text-[#4E5969] dark:text-slate-400">Hostel Residence Space</span>
              </div>
              <h1 className="text-xl font-black text-[#1B1E28] dark:text-white">Hostel Warden Portal</h1>
              <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium">
                Manage hostel blocks, room allotments, resident occupancy, and student attendance registers.
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-center">
                <p className="text-[10px] text-[#4E5969] dark:text-slate-400 font-bold uppercase">Total Resident Rooms</p>
                <p className="text-lg font-black text-[#5B4BFF]">240 Rooms</p>
              </div>
            </div>
          </div>

          {/* Campus Alerts & Circulars Widget */}
          <NoticeListWidget limit={3} title="Hostel & Campus Alerts" role="warden" />

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Link
              href="/dashboard/admin/student-master"
              className="p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 hover:border-[#5B4BFF] transition-all group shadow-soft space-y-3"
            >
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 group-hover:bg-[#5B4BFF] group-hover:text-white flex items-center justify-center transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#1B1E28] dark:text-white group-hover:text-[#5B4BFF] transition-colors">Resident Allotments & Roster</h3>
                <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-1">Review hostel block allocations, room numbers, and resident directory.</p>
              </div>
            </Link>

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
                <h3 className="font-extrabold text-sm text-[#1B1E28] dark:text-white group-hover:text-[#5B4BFF] transition-colors">Hostel Night Attendance</h3>
                <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-1">Mark night roll-calls, curfew adherence, and gate entry logs.</p>
              </div>
            </Link>
          </div>
        </div>
      </main>

      <NoticeLoginAlertModal />
    </div>
  );
}
