'use client';

import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import AttendanceMarkerGrid from '../../../components/AttendanceMarkerGrid';

export default function FacultyDashboard() {
  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 transition-colors">
      <Sidebar role="faculty" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Faculty Teaching Portal" />
        <main className="p-6 space-y-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card p-4 space-y-1">
              <span className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Today's Lectures</span>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">3 Sessions</p>
              <span className="text-xs text-indigo-600 dark:text-indigo-400">Next: 02:00 PM (Batch 2023)</span>
            </div>
            <div className="glass-card p-4 space-y-1">
              <span className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Pending Verifications</span>
              <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">14 Entries</p>
              <span className="text-xs text-slate-500 dark:text-slate-400">UG Logbook submissions</span>
            </div>
            <div className="glass-card p-4 space-y-1">
              <span className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Leave Entitlement</span>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">18 Days Available</p>
              <span className="text-xs text-slate-500 dark:text-slate-400">Casual / Earned Leave</span>
            </div>
          </div>

          <AttendanceMarkerGrid />

          <div className="glass-card p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight uppercase">Logbook Verification Queue</h3>
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs shadow-sm">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Rahul Verma (Roll: MBBS2023045)</p>
                  <p className="text-slate-500 dark:text-slate-400">Activity: Pathology Clinical Procedure | Date: 2026-07-26</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow">Verify</button>
                  <button className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow">Reject</button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
