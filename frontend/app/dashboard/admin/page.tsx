'use client';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';

export default function AdminDashboard() {
  return (
    <div className="flex min-h-screen bg-[#0F172A]">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col">
        <Header title="College Administration & Analytics KPI" />
        <main className="p-6 space-y-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-card p-4 space-y-1">
              <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">Total Enrolled Students</span>
              <p className="text-2xl font-extrabold text-white">1,240</p>
              <span className="text-xs text-emerald-400">98.2% Active Status</span>
            </div>
            <div className="glass-card p-4 space-y-1">
              <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">Total Faculty</span>
              <p className="text-2xl font-extrabold text-indigo-400">185</p>
              <span className="text-xs text-slate-400">14 Departments</span>
            </div>
            <div className="glass-card p-4 space-y-1">
              <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">Overall Attendance</span>
              <p className="text-2xl font-extrabold text-emerald-400">89.1%</p>
              <span className="text-xs text-slate-500">Across all batches</span>
            </div>
            <div className="glass-card p-4 space-y-1">
              <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">Monthly Fee Revenue</span>
              <p className="text-2xl font-extrabold text-amber-400">₹14.5L</p>
              <span className="text-xs text-emerald-400">+12% vs last month</span>
            </div>
          </div>

          <div className="glass-card p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-white tracking-tight uppercase">College System Health & Tenant Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="font-bold text-white">Database Isolation Status</span>
                <p className="text-slate-400">PostgreSQL Schema: <code className="text-indigo-400 font-mono">tenant_srms</code></p>
                <p className="text-emerald-400 font-semibold">✔ Schema Provisioned & Tables Synced</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="font-bold text-white">AWS S3 Storage Status</span>
                <p className="text-slate-400">Bucket: <code className="text-indigo-400 font-mono">mederp-files</code></p>
                <p className="text-emerald-400 font-semibold">✔ Presigned Upload URLs Active</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
