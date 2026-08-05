'use client';

import { useState } from 'react';
import Link from 'next/link';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import LogbookSubmitModal from '../../../components/LogbookSubmitModal';
import FeeReceiptModal from '../../../components/FeeReceiptModal';

export default function StudentDashboard() {
  const [isLogbookModalOpen, setIsLogbookModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 transition-colors">
      <Sidebar role="student" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Student Academic Portal" />
        <main className="p-6 space-y-6 flex-1">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link href="/dashboard/student/attendance" className="glass-card p-4 space-y-1 hover:border-indigo-500/50 transition-all block group">
              <span className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Attendance Rate</span>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">92.4%</p>
              <span className="text-xs text-slate-500 dark:text-slate-400">Subjective & Cumulative Ledger →</span>
            </Link>

            <Link href="/dashboard/student/logbook" className="glass-card p-4 space-y-1 hover:border-indigo-500/50 transition-all block group">
              <span className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">UG Logbook</span>
              <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">28 / 30 Verified</p>
              <span className="text-xs text-slate-500 dark:text-slate-400">View UG Logbook Tracker →</span>
            </Link>

            <Link href="/dashboard/student/timetable" className="glass-card p-4 space-y-1 hover:border-indigo-500/50 transition-all block group">
              <span className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Time Table</span>
              <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">Live Schedule</p>
              <span className="text-xs text-slate-500 dark:text-slate-400">Current & Weekly Schedule →</span>
            </Link>

            <div className="glass-card p-4 space-y-1">
              <span className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Fee Receipts</span>
              <button
                onClick={() => setIsReceiptModalOpen(true)}
                className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow cursor-pointer"
              >
                🖨 View Fee Receipt
              </button>
            </div>
          </div>

          {/* Logbook Activity Tracker */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight uppercase">Recent Clinical Logbook Submissions</h3>
              <button
                onClick={() => setIsLogbookModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all"
              >
                + Submit New Entry
              </button>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">General Surgery Case Presentation</p>
                  <p className="text-slate-500 dark:text-slate-400">Date: 2026-07-24 | Category: Ward Rounds</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                  VERIFIED
                </span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Pediatrics Immunization Clinic Log</p>
                  <p className="text-slate-500 dark:text-slate-400">Date: 2026-07-25 | Category: Outpatient OPD</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20">
                  PENDING FACULTY SIGN-OFF
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>

      <LogbookSubmitModal
        isOpen={isLogbookModalOpen}
        onClose={() => setIsLogbookModalOpen(false)}
      />

      <FeeReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
      />
    </div>
  );
}
