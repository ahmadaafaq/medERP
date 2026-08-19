'use client';

import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import AttendanceMarkerGrid from '../../../components/AttendanceMarkerGrid';
import NoticeListWidget from '../../../components/notices/NoticeListWidget';
import NoticeLoginAlertModal from '../../../components/notices/NoticeLoginAlertModal';

export default function FacultyDashboard() {
  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="faculty" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Faculty Teaching Portal" />
        <main className="p-6 space-y-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-1 hover:shadow-md transition-all">
              <span className="text-[11px] font-black uppercase text-[#4E5969] dark:text-slate-400 tracking-wider">Today's Lectures</span>
              <p className="text-2xl font-black text-[#1B1E28] dark:text-white">3 Sessions</p>
              <span className="text-xs text-[#5B4BFF] font-bold">Next: 02:00 PM (Batch 2023)</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-1 hover:shadow-md transition-all">
              <span className="text-[11px] font-black uppercase text-[#4E5969] dark:text-slate-400 tracking-wider">Pending Verifications</span>
              <p className="text-2xl font-black text-[#F36C21]">14 Entries</p>
              <span className="text-xs text-[#4E5969] dark:text-slate-400 font-medium">UG Logbook submissions</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-1 hover:shadow-md transition-all">
              <span className="text-[11px] font-black uppercase text-[#4E5969] dark:text-slate-400 tracking-wider">Leave Entitlement</span>
              <p className="text-2xl font-black text-[#00C48C]">18 Days Available</p>
              <span className="text-xs text-[#4E5969] dark:text-slate-400 font-medium">Casual / Earned Leave</span>
            </div>
          </div>

          {/* Department Notices & Circulars */}
          <NoticeListWidget limit={3} title="Faculty Circulars & Institutional Notices" role="faculty" />

          <AttendanceMarkerGrid />

          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-4">
            <h3 className="text-xs font-black text-[#1B1E28] dark:text-white tracking-tight uppercase">Logbook Verification Queue</h3>
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-[#E7EAF3] dark:border-slate-700 flex justify-between items-center text-xs shadow-sm">
                <div>
                  <p className="font-black text-[#1B1E28] dark:text-white">Rahul Verma (Roll: MBBS2023045)</p>
                  <p className="text-[#4E5969] dark:text-slate-400 font-medium">Activity: Pathology Clinical Procedure | Date: 2026-07-26</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-3.5 py-1.5 rounded-xl bg-[#00C48C] hover:bg-[#00B37E] text-white font-extrabold shadow-sm transition-all">Verify</button>
                  <button className="px-3.5 py-1.5 rounded-xl bg-[#F04438] hover:bg-[#D9382E] text-white font-extrabold shadow-sm transition-all">Reject</button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <NoticeLoginAlertModal />
    </div>
  );
}
