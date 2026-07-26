'use client';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';

export default function StudentDashboard() {
  return (
    <div className="flex min-h-screen bg-[#0F172A]">
      <Sidebar role="student" />
      <div className="flex-1 flex flex-col">
        <Header title="Student Academic Portal" />
        <main className="p-6 space-y-6 flex-1">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-card p-4 space-y-1">
              <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">Attendance Rate</span>
              <p className="text-2xl font-extrabold text-emerald-400">92.4%</p>
              <span className="text-xs text-slate-500">Above required threshold</span>
            </div>
            <div className="glass-card p-4 space-y-1">
              <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">Logbook Verified</span>
              <p className="text-2xl font-extrabold text-indigo-400">28 / 30</p>
              <span className="text-xs text-slate-500">2 Pending verification</span>
            </div>
            <div className="glass-card p-4 space-y-1">
              <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">Cumulative GPA</span>
              <p className="text-2xl font-extrabold text-white">8.65 / 10</p>
              <span className="text-xs text-slate-500">Semester 6</span>
            </div>
            <div className="glass-card p-4 space-y-1">
              <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">Fee Balance</span>
              <p className="text-2xl font-extrabold text-amber-400">₹0.00</p>
              <span className="text-xs text-emerald-400">All receipts cleared</span>
            </div>
          </div>

          {/* Logbook Activity Tracker */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-white tracking-tight uppercase">Recent Clinical Logbook Submissions</h3>
            <div className="divide-y divide-slate-800 text-xs">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">General Surgery Case Presentation</p>
                  <p className="text-slate-400">Date: 2026-07-24 | Category: Ward Rounds</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                  VERIFIED
                </span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">Pediatrics Immunization Clinic Log</p>
                  <p className="text-slate-400">Date: 2026-07-25 | Category: Outpatient OPD</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20">
                  PENDING FACULTY SIGN-OFF
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
