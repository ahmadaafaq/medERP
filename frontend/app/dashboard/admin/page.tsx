'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import Card from '../../../components/common/Card';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/common/Button';

export default function AdminDashboard() {
  const [collegeName, setCollegeName] = useState('Medical College Portal');
  const [tenantSlug, setTenantSlug] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('collegeName');
      const storedSlug = localStorage.getItem('tenantSlug');
      if (storedName) setCollegeName(storedName);
      if (storedSlug) setTenantSlug(storedSlug);
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-[#0F172A] text-[#1B1E28] dark:text-slate-100 font-sans transition-colors">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="College Administration & Analytics KPI" />
        <main className="p-6 space-y-6 flex-1 max-w-7xl mx-auto w-full">
          {/* Welcome Banner */}
          <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#2D2575] via-[#3B3095] to-[#5B4BFF] p-6 sm:p-8 text-white shadow-xl shadow-purple-950/20">
            <div className="relative z-10 space-y-2 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/15 text-[#F36C21] border border-white/20">
                <span className="w-2 h-2 rounded-full bg-[#F36C21] animate-ping" />
                {tenantSlug ? `Tenant: ${tenantSlug}` : 'Executive Console'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Welcome to {collegeName}
              </h1>
              <p className="text-sm text-purple-100/85 font-normal leading-relaxed">
                Real-time NMC academic monitoring, multi-tier batch schedules, schema-isolated tenant architecture, and clinical workflow evaluation.
              </p>
            </div>
            {/* Ambient Background Wave */}
            <div className="absolute right-0 bottom-0 opacity-20 pointer-events-none transform translate-x-12 translate-y-4">
              <svg width="400" height="160" viewBox="0 0 400 160" fill="none">
                <path
                  d="M0 80 H70 L80 80 L90 40 L100 120 L110 20 L120 100 L130 80 L180 80 L190 80 L200 40 L210 120 L220 20 L230 100 L240 80 L310 80 L320 60 L330 80 H400"
                  stroke="#FFFFFF"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* KPI Summary Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card hover className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-[#7B8794] tracking-wider">
                  Total Enrolled
                </span>
                <span className="w-8 h-8 rounded-xl bg-[#5B4BFF]/10 text-[#5B4BFF] flex items-center justify-center font-bold text-sm">
                  👥
                </span>
              </div>
              <p className="text-3xl font-black text-[#1B1E28] dark:text-white tracking-tight">1,240</p>
              <div className="pt-1 flex items-center justify-between">
                <Badge variant="success" dot>98.2% Active</Badge>
                <span className="text-xs text-[#7B8794]">MBBS & PG</span>
              </div>
            </Card>

            <Card hover className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-[#7B8794] tracking-wider">
                  Total Faculty
                </span>
                <span className="w-8 h-8 rounded-xl bg-[#F36C21]/10 text-[#F36C21] flex items-center justify-center font-bold text-sm">
                  🩺
                </span>
              </div>
              <p className="text-3xl font-black text-[#5B4BFF] dark:text-[#7867FF] tracking-tight">185</p>
              <div className="pt-1 flex items-center justify-between">
                <Badge variant="primary">14 Depts</Badge>
                <span className="text-xs text-[#7B8794]">Full time</span>
              </div>
            </Card>

            <Card hover className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-[#7B8794] tracking-wider">
                  Avg Attendance
                </span>
                <span className="w-8 h-8 rounded-xl bg-[#00C48C]/10 text-[#00C48C] flex items-center justify-center font-bold text-sm">
                  📊
                </span>
              </div>
              <p className="text-3xl font-black text-[#00C48C] tracking-tight">89.1%</p>
              <div className="pt-1 flex items-center justify-between">
                <Badge variant="success">Compliant</Badge>
                <span className="text-xs text-[#7B8794]">NMC &gt; 75%</span>
              </div>
            </Card>

            <Card hover className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-[#7B8794] tracking-wider">
                  Fee Realization
                </span>
                <span className="w-8 h-8 rounded-xl bg-[#FFB020]/10 text-[#FFB020] flex items-center justify-center font-bold text-sm">
                  💳
                </span>
              </div>
              <p className="text-3xl font-black text-[#FFB020] tracking-tight">₹14.5L</p>
              <div className="pt-1 flex items-center justify-between">
                <Badge variant="accent">+12% MoM</Badge>
                <span className="text-xs text-[#7B8794]">Current Cycle</span>
              </div>
            </Card>
          </div>

          {/* System Health Card */}
          <Card hover className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-[#1B1E28] dark:text-white uppercase tracking-wider">
                  College Infrastructure & Schema Isolation
                </h3>
                <p className="text-xs text-[#7B8794]">Multi-tenant database engine status and active microservices</p>
              </div>
              <Badge variant="success" dot>All Systems Operational</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#F6F8FC] dark:bg-slate-900/80 border border-[#E7EAF3] dark:border-slate-800 space-y-2 shadow-sm">
                <p className="text-[#4E5969] dark:text-slate-400">Active Tenant Schema: <code className="text-[#5B4BFF] dark:text-[#7867FF] font-mono font-bold">tenant_{tenantSlug || 'srms-ims'}</code></p>
                <p className="text-[#00A374] dark:text-[#34D399] font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00C48C]" />
                  Schema Auto-Provisioned & Synced
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F6F8FC] dark:bg-slate-900/80 border border-[#E7EAF3] dark:border-slate-800 space-y-2 shadow-sm">
                <span className="font-bold text-[#1B1E28] dark:text-white block">AWS S3 Medical Documents Storage</span>
                <p className="text-[#4E5969] dark:text-slate-400">Target Bucket: <code className="text-[#5B4BFF] dark:text-[#7867FF] font-mono font-bold">mederp-files</code></p>
                <p className="text-[#00A374] dark:text-[#34D399] font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00C48C]" />
                  Presigned Upload URLs Active
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => window.location.href = '/dashboard/admin/college-master'}>
                Manage College Hierarchy
              </Button>
              <Button variant="primary" size="sm" onClick={() => window.location.href = '/dashboard/admin/student-master'}>
                View Student Directory
              </Button>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
