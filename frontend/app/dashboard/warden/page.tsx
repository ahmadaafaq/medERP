'use client';

import Header from '../../../components/Header';
import Sidebar from '../../../components/Sidebar';
import Link from 'next/link';

export default function WardenDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      <Sidebar role="warden" />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header title="Hostel Warden Administration & Allotment Console" />

        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Welcome Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-900/40 via-indigo-900/20 to-slate-900 border border-purple-500/20 shadow-xl flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-mono font-bold uppercase tracking-wider">
                  WARDEN PORTAL
                </span>
                <span className="text-xs text-slate-400">Hostel Residence Space</span>
              </div>
              <h1 className="text-2xl font-black text-white">Hostel Warden Portal</h1>
              <p className="text-xs text-slate-300">
                Manage hostel blocks, room allotments, resident occupancy, and student attendance registers.
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Total Resident Rooms</p>
                <p className="text-lg font-black text-purple-400">240 Rooms</p>
              </div>
            </div>
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Link
              href="/dashboard/admin/student-master"
              className="p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition-all group shadow-lg space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white group-hover:text-purple-400 transition-colors">Resident Allotments & Roster</h3>
                <p className="text-xs text-slate-400 mt-1">Review hostel block allocations, room numbers, and resident directory.</p>
              </div>
            </Link>

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
                <h3 className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors">Hostel Attendance Audit</h3>
                <p className="text-xs text-slate-400 mt-1">Verify evening hostel curfew attendance and leave logs.</p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
