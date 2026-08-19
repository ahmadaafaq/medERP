'use client';

import Link from 'next/link';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import NoticeListWidget from '../../../components/notices/NoticeListWidget';
import NoticeLoginAlertModal from '../../../components/notices/NoticeLoginAlertModal';

export default function AdminDashboard() {
  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="College Administration & Analytics KPI" />
        <main className="p-6 space-y-6 flex-1 max-w-7xl mx-auto w-full">
          {/* Top Quick Actions Bar */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-4 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F36C21]"></span>
              <h2 className="text-xs font-black uppercase text-[#1B1E28] dark:text-white tracking-wider">
                Admin Control Center
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/admin/notices/compose"
                className="px-4 py-2 rounded-full bg-[#5B4BFF] hover:bg-[#4F46E5] text-white text-xs font-black shadow-sm flex items-center gap-1.5 transition-all"
              >
                <span>+</span> Compose Notice & Circular
              </Link>
              <Link
                href="/dashboard/admin/notices/sent"
                className="px-4 py-2 rounded-full bg-[#F6F8FC] dark:bg-slate-800 hover:bg-slate-200 text-[#1B1E28] dark:text-white text-xs font-bold transition-all border border-[#E7EAF3] dark:border-slate-700"
              >
                📊 Sent Notices & Read Reports
              </Link>
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-5 shadow-soft space-y-1">
              <span className="text-[11px] font-black uppercase text-[#4E5969] dark:text-slate-400 tracking-wider">
                Total Enrolled Students
              </span>
              <p className="text-2xl font-black text-[#1B1E28] dark:text-white">1,240</p>
              <span className="text-xs text-[#00C48C] font-extrabold">98.2% Active Status</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-5 shadow-soft space-y-1">
              <span className="text-[11px] font-black uppercase text-[#4E5969] dark:text-slate-400 tracking-wider">
                Total Faculty
              </span>
              <p className="text-2xl font-black text-[#5B4BFF]">185</p>
              <span className="text-xs text-[#4E5969] dark:text-slate-400 font-medium">14 Clinical Departments</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-5 shadow-soft space-y-1">
              <span className="text-[11px] font-black uppercase text-[#4E5969] dark:text-slate-400 tracking-wider">
                Overall Attendance
              </span>
              <p className="text-2xl font-black text-[#00C48C]">89.1%</p>
              <span className="text-xs text-[#4E5969] dark:text-slate-400 font-medium">Across all batches</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-5 shadow-soft space-y-1">
              <span className="text-[11px] font-black uppercase text-[#4E5969] dark:text-slate-400 tracking-wider">
                Monthly Fee Revenue
              </span>
              <p className="text-2xl font-black text-[#F36C21]">₹14.5L</p>
              <span className="text-xs text-[#00C48C] font-extrabold">+12% vs last month</span>
            </div>
          </div>

          {/* Campus Alerts & Circulars Widget */}
          <NoticeListWidget limit={4} title="Institutional Notices & Broadcasts" role="admin" />

          {/* System Health Card */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-4">
            <h3 className="text-xs font-black text-[#1B1E28] dark:text-white tracking-tight uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00C48C]"></span>
              College System Health & Multi-Tenant Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800/60 border border-[#E7EAF3] dark:border-slate-700 space-y-2 shadow-xs">
                <span className="font-extrabold text-[#1B1E28] dark:text-white">Database Isolation Status</span>
                <p className="text-[#4E5969] dark:text-slate-400">
                  PostgreSQL Schema: <code className="text-[#5B4BFF] font-mono font-bold">tenant_srms</code>
                </p>
                <p className="text-[#00C48C] font-bold">✔ Schema Isolation & Notices Tables Provisioned</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800/60 border border-[#E7EAF3] dark:border-slate-700 space-y-2 shadow-xs">
                <span className="font-extrabold text-[#1B1E28] dark:text-white">Multi-File Storage & Attachments</span>
                <p className="text-[#4E5969] dark:text-slate-400">
                  Local / S3 Disk Storage: <code className="text-[#5B4BFF] font-mono font-bold">./uploads/notices/</code>
                </p>
                <p className="text-[#00C48C] font-bold">✔ PDF, Excel, Word & Image Attachments Active</p>
              </div>
            </div>
          </div>
        </main>
      </div>

      <NoticeLoginAlertModal />
    </div>
  );
}
