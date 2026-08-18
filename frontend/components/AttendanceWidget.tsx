'use client';

import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface SubjectSummary {
  sub_cd: string;
  sub_name: string;
  TotalLectures: number;
  PresentCount: number;
  AbsentCount: number;
  AttendancePercentage: number;
}

export default function AttendanceWidget({ role = 'STUDENT' }: { role?: string }) {
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWidgetAttendance();
  }, []);

  const fetchWidgetAttendance = async () => {
    try {
      setLoading(true);
      const tenant = typeof window !== 'undefined' ? (localStorage.getItem('tenantSlug') || 'srms-cet-bareilly') : 'srms-cet-bareilly';
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || '') : '';

      const res = await fetch(`${API_BASE}/attendance/portal/subject-summary?tenant=${tenant}&colgcd=1&coursecd=13&ddl_branch=1&ddl_batch=18&sem_cd=4&section_cd=1&uid=2024106259`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json) ? json : json.data || [];
        setSubjects(list.slice(0, 4));
      }
    } catch (err) {
      console.warn('Failed to fetch attendance summary for widget:', err);
    } finally {
      setLoading(false);
    }
  };

  const overallAvg = subjects.length > 0
    ? parseFloat((subjects.reduce((a, b) => a + (b.AttendancePercentage || 0), 0) / subjects.length).toFixed(1))
    : 85.0;

  return (
    <div className="p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft space-y-4">
      <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
        <h3 className="text-sm font-black text-[#1B1E28] dark:text-white flex items-center gap-2">
          <span>📊</span>
          <span>Attendance Overview (SRMS Portal)</span>
        </h3>
        <span className={`text-[11px] font-mono font-black px-2.5 py-0.5 rounded-full ${
          overallAvg < 75 ? 'bg-rose-500/10 text-rose-600 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
        }`}>
          Avg: {overallAvg}%
        </span>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-[#7B8794] font-medium animate-pulse">
          Loading portal attendance statistics...
        </div>
      ) : subjects.length === 0 ? (
        <div className="py-6 text-center text-xs text-[#7B8794] border border-dashed border-[#E7EAF3] dark:border-slate-800 rounded-xl space-y-1">
          <p className="font-semibold text-slate-700 dark:text-slate-300">No attendance data available</p>
          <p className="text-[11px]">Synced portal attendance records will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {subjects.map((s) => {
            const isLow = s.AttendancePercentage < 75;
            return (
              <div
                key={s.sub_cd}
                className="p-3 rounded-xl bg-[#F6F8FC] dark:bg-slate-800/60 border border-[#E7EAF3] dark:border-slate-700/80 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="font-extrabold text-[#1B1E28] dark:text-white truncate">{s.sub_name}</p>
                  <p className="text-[10px] text-[#7B8794] font-mono font-semibold">
                    Lectures: {s.PresentCount}/{s.TotalLectures} Present
                  </p>
                </div>

                <span className={`px-2.5 py-1 rounded-xl font-mono font-black text-[11px] ${
                  isLow ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                }`}>
                  {s.AttendancePercentage}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
