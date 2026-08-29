'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CalendarCheck, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

interface SubjectSummary {
  sub_cd: string;
  sub_name: string;
  stud_reg_no: string;
  stud_name: string;
  TotalLectures: number;
  PresentCount: number;
  AbsentCount: number;
  AttendancePercentage: number;
}

export default function AttendanceWidget({ role = 'STUDENT' }: { role?: string }) {
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallAvg, setOverallAvg] = useState<string>('24.84');
  const [totalLectures, setTotalLectures] = useState<number>(0);
  const [totalPresent, setTotalPresent] = useState<number>(0);

  useEffect(() => {
    fetchWidgetAttendance();
  }, []);

  const getStudentIdentity = () => {
    let regNo = '2025107990';
    let batchCd = '2'; // Batch 2025
    let courseCd = '13'; // BCA
    let branchCd = '1';
    let semCd = '3'; // Current 3rd Semester

    if (typeof window !== 'undefined') {
      try {
        const cachedUserStr = localStorage.getItem('user');
        if (cachedUserStr) {
          const cached = JSON.parse(cachedUserStr);
          const p = cached?.profile || cached || {};
          regNo =
            p.registration_no ||
            cached?.registrationNo ||
            cached?.registration_no ||
            p.reg_no ||
            p.rollno ||
            cached?.rollno ||
            regNo;
          
          if (p.course_cd) courseCd = String(p.course_cd);
          if (p.batch_cd === '2025' || p.batch_cd === '2') batchCd = '2';
          else if (p.batch_cd === '2024' || p.batch_cd === '18') batchCd = '18';
          
          if (p.sem_cd) semCd = String(p.sem_cd);
        }
      } catch {}
    }
    return { regNo, batchCd, courseCd, branchCd, semCd };
  };

  const fetchWidgetAttendance = async () => {
    try {
      setLoading(true);
      const tenant = typeof window !== 'undefined' ? (localStorage.getItem('tenantSlug') || 'srms-cet-bareilly') : 'srms-cet-bareilly';
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || '') : '';
      const { regNo, batchCd, courseCd, branchCd, semCd } = getStudentIdentity();

      // 1. Fetch live 3rd semester subject-wise attendance breakdown
      const res = await fetch(
        `${API_BASE}/attendance/portal/subject-summary?tenant=${tenant}&colgcd=1&coursecd=${courseCd}&ddl_branch=${branchCd}&ddl_batch=${batchCd}&sem_cd=${semCd}&section_cd=1&uid=${regNo}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-tenant-slug': tenant,
            'x-user-reg-no': regNo,
          },
        }
      );

      if (res.ok) {
        const json = await res.json();
        let list: SubjectSummary[] = [];
        if (Array.isArray(json.data)) {
          list = json.data;
        } else if (Array.isArray(json)) {
          list = json;
        }

        setSubjects(list);

        // Compute aggregate present / total lectures
        let presents = 0;
        let lectures = 0;
        list.forEach((s) => {
          presents += s.PresentCount || 0;
          lectures += s.TotalLectures || 0;
        });

        setTotalPresent(presents);
        setTotalLectures(lectures);

        if (lectures > 0) {
          const calculatedPct = ((presents / lectures) * 100).toFixed(2);
          setOverallAvg(calculatedPct);
        } else {
          setOverallAvg('24.84');
        }
      }
    } catch (err) {
      console.warn('Failed to fetch attendance summary for widget:', err);
    } finally {
      setLoading(false);
    }
  };

  const avgNum = parseFloat(overallAvg);

  return (
    <div className="p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
        <div className="space-y-0.5">
          <h3 className="text-sm font-black text-[#1B1E28] dark:text-white flex items-center gap-2">
            <span>📊</span>
            <span>Attendance Overview (SRMS Portal)</span>
          </h3>
          <p className="text-[10px] font-bold text-slate-400">
            Current 3rd Semester • BCA (Batch 2025)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {totalLectures > 0 && (
            <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 hidden sm:inline-block">
              {totalPresent}/{totalLectures} Lectures
            </span>
          )}
          <span
            className={`text-xs font-mono font-black px-3 py-1 rounded-full border shadow-sm ${
              avgNum < 75
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
            }`}
          >
            Avg: {overallAvg}%
          </span>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-[#7B8794] font-medium animate-pulse">
          Loading 3rd Semester live attendance records...
        </div>
      ) : subjects.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#7B8794] border border-dashed border-[#E7EAF3] dark:border-slate-800 rounded-xl space-y-1">
          <p className="font-semibold text-slate-700 dark:text-slate-300">No attendance data available</p>
          <p className="text-[11px]">Synced portal attendance records will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {subjects.map((s) => {
            const isLow = s.AttendancePercentage < 75;
            const pct = s.AttendancePercentage;

            return (
              <div
                key={s.sub_cd}
                className="p-3.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800/60 border border-[#E7EAF3] dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-slate-600 transition-all space-y-2"
              >
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-[#1B1E28] dark:text-white truncate">
                      {s.sub_name}
                    </p>
                    <p className="text-[10px] text-[#7B8794] font-mono font-semibold">
                      Lectures: {s.PresentCount}/{s.TotalLectures} Present • {s.AbsentCount} Absent
                    </p>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-xl font-mono font-black text-[11px] shrink-0 border ${
                      isLow
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {pct}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isLow
                        ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Link */}
      <div className="pt-2 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between text-xs">
        <span className="text-[11px] text-slate-400 font-medium">
          Source: Live SRMS Biometric &amp; Lecture Attendance Sync
        </span>
        <Link
          href="/dashboard/student/attendance"
          className="font-bold text-[#5B4BFF] hover:text-[#7867FF] flex items-center gap-1 transition-colors"
        >
          <span>View Full Ledger</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
