'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { CreditCard, Download, CheckCircle, Clock, FileText } from 'lucide-react';

export default function StudentFeesPage() {
  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="student" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Student Fee Portal" />
        <main className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full flex-1">
          {/* Header Banner */}
          <div className="p-6 rounded-[22px] bg-gradient-to-r from-[#2D2575] via-[#5B4BFF]/80 to-[#7867FF] text-white shadow-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-white/20 font-mono font-bold uppercase tracking-wider">ACCOUNTS CELL</span>
              <h1 className="text-2xl font-black mt-1">Fee Summary &amp; Receipts</h1>
              <p className="text-xs text-white/80">Track institutional semester fees, payment receipts, and balance dues.</p>
            </div>
            <div className="hidden sm:flex gap-3">
              <div className="p-3 rounded-xl bg-white/10 border border-white/20 text-center">
                <p className="text-[10px] text-white/70 font-bold">Status</p>
                <p className="text-sm font-black text-emerald-300">CLEARED</p>
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-sm space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase">Current Academic Session</p>
              <p className="text-2xl font-black text-[#1B1E28] dark:text-white">2026 - 2027</p>
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> No Overdue Balance
              </p>
            </div>
            <div className="p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-sm space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase">Payment Mode</p>
              <p className="text-2xl font-black text-[#5B4BFF]">ERP Online / Portal</p>
              <p className="text-xs text-slate-400">Integrated Accounts Gateway</p>
            </div>
            <div className="p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-sm space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase">Receipts</p>
              <p className="text-2xl font-black text-[#F36C21]">All Available</p>
              <p className="text-xs text-slate-400">Download Official Vouchers</p>
            </div>
          </div>

          {/* Transaction Ledger Table */}
          <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-black text-sm text-[#1B1E28] dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#5B4BFF]" />
              Fee Receipts Ledger
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Receipt No</th>
                    <th className="py-2.5 px-3">Semester</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  <tr>
                    <td className="py-3 px-3 font-mono font-bold text-[#5B4BFF]">REC-2026-0814</td>
                    <td className="py-3 px-3">Semester V</td>
                    <td className="py-3 px-3">14 Aug 2026</td>
                    <td className="py-3 px-3 font-bold text-[#1B1E28] dark:text-white">₹68,500</td>
                    <td className="py-3 px-3"><span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-[10px]">PAID</span></td>
                    <td className="py-3 px-3">
                      <button onClick={() => alert('Official receipt downloaded.')} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#5B4BFF] hover:text-white text-slate-600 dark:text-slate-300 font-bold text-[11px] flex items-center gap-1 transition-all">
                        <Download className="w-3 h-3" /> Voucher
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
