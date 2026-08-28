'use client';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useState } from 'react';

export default function FacultyBiometricAttendancePage() {
  const [logs] = useState([
    { id: 1, device: 'CCTV-Gate-01', type: 'CCTV Facial AI', student: 'Rahul Verma (2024106259)', time: '08:52 AM', status: 'VERIFIED', confidence: '98.6%' },
    { id: 2, device: 'BIO-Lab-03', type: 'Fingerprint Biometric', student: 'Priya Sharma (2024106260)', time: '09:01 AM', status: 'VERIFIED', confidence: '100%' },
    { id: 3, device: 'CCTV-LH-102', type: 'CCTV Facial AI', student: 'Kabir Deshmukh (20260008)', time: '09:05 AM', status: 'FLAGGED', confidence: '74.2%' },
  ]);

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-[#0F172A] text-[#1B1E28] dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar role="faculty" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Faculty View — Bio-Metric & CCTV Attendance Logs" />
        <main className="p-6 space-y-6 flex-1 flex flex-col">

          <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-[#1B1E28] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>📹</span>
                <span>Bio-Metric & CCTV Facial Recognition Log Ledger</span>
              </h2>
              <p className="text-xs text-[#7B8794] font-medium mt-1">
                Hardware-captured real-time entry logs from IoT Biometric scanners and CCTV facial recognition streams for your department.
              </p>
            </div>

            <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono font-black text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>LIVE DEVICE STREAM</span>
            </span>
          </div>

          <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F6F8FC] dark:bg-slate-800/80 text-[#7B8794] uppercase tracking-wider border-b border-[#E7EAF3] dark:border-slate-700">
                    <th className="p-3 font-extrabold">Device ID & Location</th>
                    <th className="p-3 font-extrabold">Ingestion Type</th>
                    <th className="p-3 font-extrabold">Student Record</th>
                    <th className="p-3 font-extrabold text-center">Timestamp</th>
                    <th className="p-3 font-extrabold text-center">Confidence</th>
                    <th className="p-3 font-extrabold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F6F8FC]/50 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3 font-extrabold text-[#1B1E28] dark:text-white">
                        📟 {log.device}
                      </td>
                      <td className="p-3 font-semibold text-[#5B4BFF] dark:text-indigo-400">
                        {log.type}
                      </td>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                        {log.student}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-[#7B8794]">
                        ⏰ {log.time}
                      </td>
                      <td className="p-3 text-center font-mono font-extrabold text-slate-700 dark:text-slate-300">
                        {log.confidence}
                      </td>
                      <td className="p-3 text-right">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${
                          log.status === 'VERIFIED'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
