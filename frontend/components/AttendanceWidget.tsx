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

export interface AttendanceWidgetProps {
  role?: string;
  studentInfo?: {
    name?: string;
    rollno?: string;
    registration_no?: string;
    batch?: string;
    course?: string;
    department?: string;
    course_cd?: string;
    branch_cd?: string;
    batch_cd?: string;
    semester?: string;
    section?: string;
  } | null;
  courseCd?: string;
  courseName?: string;
  branchCd?: string;
  batchCd?: string;
  batchName?: string;
  semester?: string;
  section?: string;
  regNo?: string;
}

export default function AttendanceWidget({
  role = 'STUDENT',
  studentInfo = null,
  courseCd: propCourseCd,
  courseName: propCourseName,
  branchCd: propBranchCd,
  batchCd: propBatchCd,
  batchName: propBatchName,
  semester: propSemester,
  section: propSection,
  regNo: propRegNo,
}: AttendanceWidgetProps) {
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallAvg, setOverallAvg] = useState<string>('0.00');
  const [totalLectures, setTotalLectures] = useState<number>(0);
  const [totalPresent, setTotalPresent] = useState<number>(0);
  const [resolvedMeta, setResolvedMeta] = useState({
    courseTitle: '',
    batchTitle: '',
    semCd: '3',
  });

  const getOrdinal = (n: string | number) => {
    const s = String(n || '3');
    if (s === '1') return '1st';
    if (s === '2') return '2nd';
    if (s === '3') return '3rd';
    return `${s}th`;
  };

  const getStudentIdentity = () => {
    let regNo = propRegNo || studentInfo?.registration_no || studentInfo?.rollno || '';
    let batchCd = propBatchCd || studentInfo?.batch_cd || '';
    let courseCd = propCourseCd || studentInfo?.course_cd || '';
    let branchCd = propBranchCd || studentInfo?.branch_cd || '1';
    let semCd = propSemester || studentInfo?.semester || '3';
    let courseTitle = propCourseName || studentInfo?.course || '';
    let batchTitle = propBatchName || studentInfo?.batch || '';

    if (typeof window !== 'undefined') {
      try {
        const cachedUserStr = localStorage.getItem('user');
        if (cachedUserStr) {
          const cached = JSON.parse(cachedUserStr);
          const p = cached?.profile || cached || {};
          if (!regNo) {
            regNo =
              p.registration_no ||
              cached?.registrationNo ||
              cached?.registration_no ||
              p.reg_no ||
              p.rollno ||
              cached?.rollno ||
              '';
          }
          if (!courseCd && (p.course_cd || cached?.courseCd || cached?.course_cd)) {
            courseCd = String(p.course_cd || cached?.courseCd || cached?.course_cd);
          }
          if (!batchCd && (p.batch_cd || cached?.batchCd || cached?.batch_cd)) {
            batchCd = String(p.batch_cd || cached?.batchCd || cached?.batch_cd);
          }
          if (!semCd && (p.sem_cd || cached?.semester || p.semester)) {
            semCd = String(p.sem_cd || cached?.semester || p.semester);
          }
          if (!courseTitle) {
            courseTitle = p.course_name || cached?.courseName || '';
          }
          if (!batchTitle) {
            batchTitle = p.batch_name || cached?.batchName || '';
          }
        }
      } catch {}
    }

    if (!courseTitle) {
      if (courseCd === '4') courseTitle = 'MBA';
      else if (courseCd === '13') courseTitle = 'BCA';
      else if (courseCd === '1') courseTitle = 'B.Tech';
      else if (courseCd === '2') courseTitle = 'B.Pharm';
      else if (courseCd === '3') courseTitle = 'MCA';
      else if (courseCd) courseTitle = `Course ${courseCd}`;
      else courseTitle = 'General';
    }

    if (!batchTitle && batchCd) {
      if (batchCd === '15') batchTitle = 'Batch 2024';
      else if (batchCd === '2' || batchCd === '2025') batchTitle = 'Batch 2025';
      else if (batchCd === '18') batchTitle = 'Batch 2024';
      else batchTitle = `Batch ${batchCd}`;
    }

    return { regNo, batchCd, courseCd, branchCd, semCd, courseTitle, batchTitle };
  };

  const fetchWidgetAttendance = async () => {
    try {
      setLoading(true);
      const tenant = typeof window !== 'undefined' ? (localStorage.getItem('tenantSlug') || 'srms-cet-bareilly') : 'srms-cet-bareilly';
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || '') : '';
      const { regNo, batchCd, courseCd, branchCd, semCd, courseTitle, batchTitle } = getStudentIdentity();

      setResolvedMeta({
        courseTitle: courseTitle || (courseCd === '13' ? 'BCA' : courseCd === '4' ? 'MBA' : 'Department'),
        batchTitle: batchTitle || (batchCd === '2' || batchCd === '2025' ? 'Batch 2025' : 'Batch 2024'),
        semCd: semCd || '3',
      });

      const params = new URLSearchParams({
        tenant,
        colgcd: '1',
        section_cd: '1',
      });
      if (regNo) params.set('uid', regNo);
      if (courseCd) params.set('coursecd', courseCd);
      if (batchCd) params.set('ddl_batch', batchCd);
      if (branchCd) params.set('ddl_branch', branchCd);
      if (semCd) params.set('sem_cd', semCd);

      const res = await fetch(`${API_BASE}/attendance/portal/subject-summary?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': tenant,
          'x-user-reg-no': regNo,
        },
      });

      if (res.ok) {
        const json = await res.json();
        let list: SubjectSummary[] = [];
        if (Array.isArray(json.data)) {
          list = json.data;
        } else if (Array.isArray(json)) {
          list = json;
        }

        setSubjects(list);

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
          setOverallAvg('0.00');
        }
      } else {
        setSubjects([]);
        setOverallAvg('0.00');
      }
    } catch (err) {
      console.warn('Failed to fetch attendance summary for widget:', err);
      setSubjects([]);
      setOverallAvg('0.00');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWidgetAttendance();
  }, [
    studentInfo?.registration_no,
    studentInfo?.course_cd,
    studentInfo?.batch_cd,
    studentInfo?.semester,
    propCourseCd,
    propBatchCd,
    propSemester,
    propRegNo,
  ]);

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
            Current {getOrdinal(resolvedMeta.semCd)} Semester • {resolvedMeta.courseTitle || 'Dynamic'} ({resolvedMeta.batchTitle || 'Batch'})
          </p>
        </div>

        <div className="flex items-center gap-2">
          {totalLectures > 0 && (
            <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 hidden sm:inline-block">
              {totalPresent}/{totalLectures} Lectures
            </span>
          )}
          {totalLectures > 0 ? (
            <span
              className={`text-xs font-mono font-black px-3 py-1 rounded-full border shadow-sm ${
                avgNum < 75
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              }`}
            >
              Avg: {overallAvg}%
            </span>
          ) : (
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full border bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700">
              0.00%
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-[#7B8794] font-medium animate-pulse">
          Loading {resolvedMeta.courseTitle || 'live'} attendance records...
        </div>
      ) : subjects.length === 0 ? (
        <div className="py-8 px-4 text-center border border-dashed border-[#E7EAF3] dark:border-slate-800 rounded-[18px] bg-[#F6F8FC]/60 dark:bg-slate-800/30 space-y-2">
          <div className="w-10 h-10 mx-auto rounded-full bg-[#5B4BFF]/10 text-[#5B4BFF] flex items-center justify-center font-bold text-base">
            📊
          </div>
          <p className="font-bold text-sm text-[#1B1E28] dark:text-white">
            No Attendance Records Published for {resolvedMeta.courseTitle || 'Current Course'}
          </p>
          <p className="text-xs text-[#7B8794] max-w-md mx-auto">
            Lecture attendance records and biometric logs for {resolvedMeta.courseTitle || 'your department'} ({resolvedMeta.batchTitle || 'Batch'}) will appear here in real-time once recorded by faculty in the ERP.
          </p>
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
