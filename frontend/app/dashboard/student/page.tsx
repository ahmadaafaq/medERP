'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import LogbookSubmitModal from '../../../components/LogbookSubmitModal';
import FeeReceiptModal from '../../../components/FeeReceiptModal';
import RecentLessonsWidget from '../../../components/RecentLessonsWidget';
import AttendanceWidget from '../../../components/AttendanceWidget';
import NoticeDashboardWidget from '../../../components/notices/NoticeDashboardWidget';
import ChatDashboardWidget from '../../../components/chat/ChatDashboardWidget';
import IncubationCarousel from '../../../components/incubation/IncubationCarousel';

import {
  Sparkles,
  Rocket,
  Award,
  CheckCircle2,
  ArrowRight,
  FolderGit2,
  Building2,
  Briefcase,
  Calendar,
  Clock
} from 'lucide-react';

interface StudentInfo {
  name: string;
  rollno: string;
  registration_no: string;
  batch: string;
  course: string;
  department?: string;
}

interface ExamResult {
  id: string;
  paper_name?: string;
  paper_code?: string;
  subject_name?: string;
  marks_obtained: number;
  max_marks?: number;
  is_pass: boolean;
  paper_type?: string;
}

interface IncubatedProjectAlert {
  id: number;
  title: string;
  incubationStatus: string;
  score: number;
  grade: string;
  fundingAmount?: number;
  mentorAssigned?: string;
  incubationNotes?: string;
  techStack?: string[];
  screenshots?: string[];
}

const API_BASE = 'http://localhost:3001/api/v1';

const getTenantSlug = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly';
  }
  return 'srms-cet-bareilly';
};

export default function StudentDashboard() {
  const [isLogbookModalOpen, setIsLogbookModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [attendanceStats, setAttendanceStats] = useState({
    percentage: 0,
    totalClasses: 0,
    totalPresent: 0,
    theoryPct: 0,
    practicalPct: 0,
  });
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [upcomingExamsCount, setUpcomingExamsCount] = useState<number>(0);
  const [logbookVerifiedCount, setLogbookVerifiedCount] = useState<number>(0);
  const [logbookTotalCount, setLogbookTotalCount] = useState<number>(0);
  const [internshipSummary, setInternshipSummary] = useState({
    totalAvailable: 0,
    appliedCount: 0,
    completedCount: 0,
    latestStatus: 'Available',
    progressPct: 0,
  });
  const [timetableSummary, setTimetableSummary] = useState({
    totalClasses: 0,
    distinctSubjects: [] as string[],
    activeSession: null as any,
    todaysSlots: [] as any[],
    weeklySlots: [] as any[],
    loading: true,
  });
  const [incubatedProjects, setIncubatedProjects] = useState<IncubatedProjectAlert[]>([]);
  const [placementAlertDrives, setPlacementAlertDrives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentDashboardData();
  }, []);

  const fetchStudentDashboardData = async () => {
    setLoading(true);
    const slug = getTenantSlug();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const headers = { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': slug };

    let cachedReg = '';
    let cachedName = '';
    let cachedRoll = '';

    if (typeof window !== 'undefined') {
      try {
        const cachedUserStr = localStorage.getItem('user');
        if (cachedUserStr) {
          const cached = JSON.parse(cachedUserStr);
          const p = cached?.profile || cached || {};
          cachedReg =
            p.registration_no ||
            cached?.registrationNo ||
            cached?.registration_no ||
            p.reg_no ||
            p.rollno ||
            cached?.rollno ||
            '';
          cachedName = cached?.name || p.name || cached?.student_name || '';
          cachedRoll = p.rollno || cached?.rollno || '';
        }
      } catch (e) {
        console.warn('Error reading localStorage user:', e);
      }
    }

    try {
      // 1. Fetch Logged-In Student Profile
      const isMed = slug.includes('ims') || slug.includes('med');
      let regNo = cachedReg || (isMed ? '2023MBBS045' : '2025107990');
      let studentNameVal = cachedName || (isMed ? 'Rahul Verma' : 'AAFREEN KHAN');
      let studentRollVal = cachedRoll || (isMed ? 'MBBS2023045' : '2500141790001');
      let courseCd = isMed ? '1' : '13';
      let branchCd = '1';
      let batchCd = '2';
      let batchId = '';
      let semester = '3';
      let section = '1';
      let colgCd = '1';

      const meRes = await fetch(`${API_BASE}/auth/me`, { headers }).catch(() => null);

      if (meRes && meRes.ok) {
        const json = await meRes.json();
        const meData = json.data || json;
        const p = meData.profile || meData || {};
        regNo =
          p.registration_no ||
          meData.registrationNo ||
          meData.registration_no ||
          p.rollno ||
          meData.rollno ||
          regNo;
        studentNameVal = meData.name || p.name || meData.student_name || studentNameVal;
        studentRollVal = p.rollno || meData.rollno || studentRollVal;

        courseCd = p.course_cd || meData.course_cd || meData.courseCd || (p.course_name?.includes('BCA') ? '13' : courseCd);
        branchCd = p.branch_cd || meData.branch_cd || meData.branchCd || '1';
        batchCd = p.batch_cd || meData.batch_cd || meData.batchCd || '2';
        batchId = p.batch_id || meData.batch_id || meData.batchId || '';
        semester = p.semester || p.current_semester || meData.semester || '3';
        section = p.section || meData.section || '1';
        colgCd = p.colg_cd || meData.colg_cd || meData.colgcd || '1';

        const courseStr = meData.courseName || p.course_name || (courseCd === '13' ? 'BCA' : courseCd === '1' ? 'B.Tech' : courseCd);
        const deptStr = meData.departmentName || p.department_name || (isMed ? 'Phase 2 MBBS' : 'Computer Applications (BCA)');

        setStudentInfo({
          name: studentNameVal,
          rollno: studentRollVal,
          registration_no: regNo,
          batch: p.batch_name || p.batch_cd || (isMed ? '2023-MBBS Batch' : 'Batch 2025'),
          course: courseStr,
          department: deptStr,
        });
      } else {
        setStudentInfo({
          name: studentNameVal,
          rollno: studentRollVal,
          registration_no: regNo,
          batch: isMed ? '2023-MBBS Batch' : 'Batch 2025',
          course: isMed ? 'MBBS' : 'BCA',
          department: isMed ? 'Phase 2 MBBS' : 'Computer Applications (BCA)',
        });
      }

      // 2. Fetch all real data in PARALLEL to load in one shot accurately
      const targetReg = regNo || '2025107990';

      let ttUrl = `${API_BASE}/timetable/student-schedule?tenant=${slug}`;
      if (batchId) ttUrl += `&batchId=${encodeURIComponent(batchId)}`;
      if (courseCd) ttUrl += `&courseCd=${encodeURIComponent(courseCd)}`;
      if (branchCd) ttUrl += `&branchCd=${encodeURIComponent(branchCd)}`;
      if (batchCd) ttUrl += `&batchCd=${encodeURIComponent(batchCd)}`;
      if (semester) ttUrl += `&semester=${encodeURIComponent(semester)}`;
      if (section) ttUrl += `&section=${encodeURIComponent(section)}`;
      if (colgCd) ttUrl += `&colgCd=${encodeURIComponent(colgCd)}`;

      const [
        attendanceResult,
        papersResult,
        examResultsResult,
        timetableResult,
        internshipsResult,
        incubationResult,
        placementResult,
      ] = await Promise.allSettled([
        // 2a. Live Attendance
        fetch('/api/srms/student-individual-attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            colg_cd: Number(colgCd) || 1,
            course_cd: Number(courseCd) || 13,
            branch_cd: Number(branchCd) || 1,
            batch_cd: Number(batchCd) || 2,
            stud_reg_no: targetReg,
          }),
        }).then((res) => (res.ok ? res.json() : null)),

        // 2b. Scheduled Papers Count
        fetch(`${API_BASE}/exams/papers?tenant=${slug}`, { headers })
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null),

        // 2c. Student Results Ledger
        fetch(`${API_BASE}/exams/student/${encodeURIComponent(targetReg)}?tenant=${slug}`, { headers })
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null),

        // 2d. Timetable Schedule
        fetch(ttUrl, { headers })
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null),

        // 2e. Internships
        fetch(`/api/internships/list`, {
          headers: {
            'x-tenant-id': `tenant_${slug}`,
            'x-tenant': slug,
            'x-user-reg-no': targetReg,
          },
        })
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null),

        // 2f. Incubation Projects
        fetch(`/api/incubation-cell/projects?tenant=${slug}`, {
          headers: {
            'x-tenant-id': `tenant_${slug}`,
            'x-tenant': slug,
            'x-tenant-slug': slug,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null),

        // 2g. Placement Drives
        fetch(`/api/placement-drive/list?status=Open&tenant=${slug}`, {
          headers: {
            'x-tenant-slug': slug,
            'x-tenant': slug,
            'x-user-reg-no': targetReg,
            'x-user-role': 'STUDENT',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null),
      ]);

      // Apply Attendance
      if (attendanceResult.status === 'fulfilled' && attendanceResult.value?.success && attendanceResult.value.data) {
        const pct =
          typeof attendanceResult.value.data.percentage === 'number'
            ? attendanceResult.value.data.percentage
            : parseFloat(String(attendanceResult.value.data.percentage || '24.84'));
        setAttendanceStats((prev) => ({
          ...prev,
          percentage: isNaN(pct) ? 24.84 : pct,
        }));
      } else {
        setAttendanceStats((prev) => ({ ...prev, percentage: 24.84 }));
      }

      // Apply Papers Count
      if (papersResult.status === 'fulfilled' && papersResult.value) {
        const pData = papersResult.value.data !== undefined ? papersResult.value.data : papersResult.value;
        setUpcomingExamsCount(Array.isArray(pData) ? pData.length : 0);
      } else {
        setUpcomingExamsCount(0);
      }

      // Apply Exam Results Ledger
      if (examResultsResult.status === 'fulfilled' && examResultsResult.value) {
        const list = examResultsResult.value.data !== undefined ? examResultsResult.value.data : examResultsResult.value;
        setExamResults(Array.isArray(list) ? list : []);
      } else {
        setExamResults([]);
      }

      // Apply Timetable Schedule
      let rawSlots: any[] = [];
      let activeLecture: any = null;
      if (timetableResult.status === 'fulfilled' && timetableResult.value?.data) {
        rawSlots = Array.isArray(timetableResult.value.data.weeklySlots)
          ? timetableResult.value.data.weeklySlots
          : Array.isArray(timetableResult.value.data.todaysSlots)
            ? timetableResult.value.data.todaysSlots
            : Array.isArray(timetableResult.value.data)
              ? timetableResult.value.data
              : [];
        activeLecture = timetableResult.value.data.currentLecture || null;
      }

      const seenSlots = new Set<string>();
      const uniqueWeeklySlots = rawSlots.filter((s: any) => {
        const normSub = (s.subject_name || s.subject_code || s.topic || '').replace(/\([^)]*\)/g, '').trim().toLowerCase();
        const key = `${s.day_of_week}_${String(s.start_time || '').slice(0, 5)}_${normSub}`;
        if (seenSlots.has(key)) return false;
        seenSlots.add(key);
        return true;
      });

      const subjectNames = Array.from(
        new Set(
          uniqueWeeklySlots
            .map((s: any) => (s.subject_name || s.subject_code || s.topic || '').replace(/\([^)]*\)/g, '').trim())
            .filter(Boolean)
        )
      );

      const jsDay = new Date().getDay();
      const currentDayOfWeek = jsDay === 0 ? 7 : jsDay;
      const filteredTodaysSlots = uniqueWeeklySlots.filter((s: any) => Number(s.day_of_week) === currentDayOfWeek);

      setTimetableSummary({
        totalClasses: uniqueWeeklySlots.length,
        distinctSubjects: subjectNames,
        activeSession: activeLecture || (filteredTodaysSlots.length > 0 ? filteredTodaysSlots[0] : uniqueWeeklySlots.length > 0 ? uniqueWeeklySlots[0] : null),
        todaysSlots: filteredTodaysSlots,
        weeklySlots: uniqueWeeklySlots,
        loading: false,
      });

      // Apply Internships
      if (internshipsResult.status === 'fulfilled' && internshipsResult.value) {
        const list = Array.isArray(internshipsResult.value.data)
          ? internshipsResult.value.data
          : Array.isArray(internshipsResult.value)
            ? internshipsResult.value
            : [];
        const totalAvailable = list.length;
        const applied = list.filter((p: any) => p.my_application);
        const completed = list.filter((p: any) => p.my_application?.status === 'completed');

        let statusStr = 'Explore Tracks';
        let pct = 0;
        if (completed.length > 0) {
          statusStr = 'Certified 🎓';
          pct = 100;
        } else if (applied.length > 0) {
          const latest = applied[0]?.my_application?.status;
          statusStr = latest ? latest.toUpperCase() : 'In Progress';
          pct = latest === 'selected' ? 75 : 40;
        }

        setInternshipSummary({
          totalAvailable,
          appliedCount: applied.length,
          completedCount: completed.length,
          latestStatus: statusStr,
          progressPct: pct,
        });
      }

      // Apply Incubation Projects
      if (incubationResult.status === 'fulfilled' && incubationResult.value) {
        const list = Array.isArray(incubationResult.value.data)
          ? incubationResult.value.data
          : Array.isArray(incubationResult.value)
            ? incubationResult.value
            : [];
        const myIncubated = list.filter(
          (p: any) =>
            p.studentRegNo === targetReg ||
            p.rollNo === studentRollVal ||
            (p.studentName && studentNameVal && p.studentName.toLowerCase().trim() === studentNameVal.toLowerCase().trim()) ||
            ['Selected', 'Funded', 'Incubated'].includes(p.incubationStatus)
        );
        setIncubatedProjects(myIncubated);
      }

      // Apply Placement Drives
      if (placementResult.status === 'fulfilled' && placementResult.value) {
        const list = Array.isArray(placementResult.value.data?.data)
          ? placementResult.value.data.data
          : Array.isArray(placementResult.value.data)
            ? placementResult.value.data
            : Array.isArray(placementResult.value)
              ? placementResult.value
              : [];
        setPlacementAlertDrives(list);
      }
    } catch {
      setExamResults([]);
      setUpcomingExamsCount(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-[#0F172A] text-[#4E5969] dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar role="student" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Student Academic Portal Dashboard" />

        <main className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 flex-1 max-w-[1600px] w-full mx-auto overflow-x-hidden">
          {loading ? (
            <StudentDashboardSkeleton />
          ) : (
            <>
              {/* PROFILE WELCOME CARD */}
              <div className="p-6 rounded-[22px] bg-gradient-to-r from-[#2D2575] via-[#3E3498] to-[#2D2575] text-white shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-2 z-10">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#F36C21] text-white font-extrabold text-[10px] tracking-widest uppercase">
                  ACTIVE STUDENT PORTAL
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/20 text-xs font-mono font-bold">
                  {studentInfo?.course || 'BCA'}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                Welcome back, {studentInfo?.name || 'Tanish Pandey'}! 👋
              </h1>
              <p className="text-xs text-white/80 max-w-2xl leading-relaxed">
                Official College Student Ledger. Track subject-wise attendance across Theory & Practical Lectures, examine published test results, and manage your academic syllabus.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                <span className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium">
                  🆔 <strong>Reg No:</strong> {studentInfo?.registration_no || '2025107715'}
                </span>
                <span className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium">
                  🎓 <strong>Batch:</strong> {studentInfo?.batch || 'Batch 2025'}
                </span>
                <span className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium">
                  🏛️ <strong>Department:</strong> {studentInfo?.department || 'Computer Science & Engineering'}
                </span>
              </div>
            </div>

            {/* Quick Refresh / Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 z-10 w-full md:w-auto">
              <Link
                href="/dashboard/student/logbook"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md text-center transition-all flex items-center justify-center gap-1.5"
              >
                <span>📖</span>
                <span>LogBook &amp; Tasks</span>
              </Link>
              <Link
                href="/dashboard/student/library"
                className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-md text-center transition-all flex items-center justify-center gap-1.5"
              >
                <span>📚</span>
                <span>E-Library</span>
              </Link>
              <Link
                href="/dashboard/student/attendance"
                className="px-4 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4E3FE3] text-white text-xs font-bold shadow-md text-center transition-all"
              >
                📊 View Attendance
              </Link>
              <button
                onClick={() => setIsReceiptModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-[#F36C21] hover:bg-[#E25C10] text-white text-xs font-bold shadow-md text-center transition-all cursor-pointer"
              >
                🖨️ Fee Receipt
              </button>
            </div>
          </div>

          {/* Real-time Notification / Digital Certificate Available Banner */}
          {internshipSummary.completedCount > 0 && (
            <div className="p-4 sm:p-5 rounded-[22px] bg-gradient-to-r from-amber-500/15 via-indigo-500/10 to-transparent border border-amber-300/40 dark:border-amber-700/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-lg shrink-0 shadow-md">
                  🏆
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold text-[10px] uppercase tracking-wider">
                      Official E-Certificate Alert
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 font-bold">
                      Verified
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-0.5">
                    Congratulations! Your Digital Certificate of Excellence is Available
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Official e-certificate signed by Dean Academics ready to view, print, and download.
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/student/internships"
                className="px-4 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-all shrink-0 active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>View & Download Certificate</span>
                <span>→</span>
              </Link>
            </div>
          )}

          {/* 🚀 GOLDEN OPPORTUNITY INCUBATION CELL SELECTION ALERT BANNER CAROUSEL */}
          {incubatedProjects.length > 0 && (
            <IncubationCarousel projects={incubatedProjects} />
          )}

          {/* 🏢 IMMEDIATE HIGHLIGHT ALERT: ADMIN POSTED NEW PLACEMENT DRIVES */}
          {placementAlertDrives.length > 0 && (
            <div className="p-5 sm:p-6 rounded-[22px] bg-gradient-to-r from-[#2D2575] via-[#3d328c] to-[#1E1757] text-white shadow-xl relative overflow-hidden border border-[#5B4BFF]/40 animate-in fade-in slide-in-from-top-3 duration-300 space-y-4">
              {/* Background ambient lighting */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#5B4BFF]/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-[#F36C21]/20 rounded-full blur-2xl pointer-events-none" />

              {/* Alert Header */}
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F36C21] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#F36C21]"></span>
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F36C21] text-white font-extrabold text-[10px] tracking-wider uppercase">
                      T&amp;P CELL NOTICE
                    </span>
                    <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                      🏢 New Campus Placement Drives Announced ({placementAlertDrives.length} Visiting Corporate Partners)
                    </h2>
                  </div>
                </div>

                <Link
                  href="/dashboard/student/placement"
                  className="px-4 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs backdrop-blur-md border border-white/20 transition-all text-center flex items-center justify-center gap-1.5 self-start sm:self-auto"
                >
                  <span>Explore All Drives</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Drives Grid */}
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {placementAlertDrives.slice(0, 3).map((d: any) => {
                  const isApplied = !!d.has_applied || !!d.my_application || !!d.application_status;
                  const statusText = d.application_status || d.my_application?.status || 'Applied';

                  return (
                    <div
                      key={d.drive_id}
                      className="p-4 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 transition-all flex flex-col justify-between space-y-3 group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-black text-white group-hover:text-indigo-200 transition-colors line-clamp-1">
                            {d.company_name}
                          </h3>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#5B4BFF] text-white shrink-0">
                            {d.package_ctc || '₹4.5 - ₹8.0 LPA'}
                          </span>
                        </div>

                        <p className="text-xs text-indigo-200 font-semibold line-clamp-1">
                          {d.role || 'Associate Engineer'}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-white/80 pt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#F36C21]" />
                            <span>{d.drive_date ? new Date(d.drive_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'TBA'}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-300" />
                            <span>Deadline: {d.deadline_date ? new Date(d.deadline_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Open'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Footer: Applied status vs Apply button */}
                      <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                        {isApplied ? (
                          <span className="px-3 py-1 rounded-xl text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1.5 shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Applied ({statusText})</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                            <span>⚡ Application Open</span>
                          </span>
                        )}

                        <Link
                          href="/dashboard/student/placement"
                          className={`px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${isApplied
                              ? 'bg-white/10 hover:bg-white/20 text-white'
                              : 'bg-[#5B4BFF] hover:bg-[#4a3ae0] text-white shadow-md'
                            }`}
                        >
                          <span>{isApplied ? 'View Status' : 'Apply Now'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5 MAIN KPI CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-5">

            {/* Card 1: Live Current Semester Attendance (Circular Graph) */}
            <Link
              href="/dashboard/student/attendance"
              className="p-4 sm:p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft hover:shadow-md transition-all duration-200 block group relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">
                  Current Sem Attendance
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase ${attendanceStats.percentage >= 75
                      ? 'bg-[#00C48C]/15 text-[#00C48C]'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                    }`}
                >
                  {attendanceStats.percentage >= 75 ? '✅ Regular' : '⚠️ < 75%'}
                </span>
              </div>

              {/* Circular Gauge & Metric */}
              <div className="flex items-center gap-3 mt-3">
                <div className="relative shrink-0 flex items-center justify-center">
                  <svg width="64" height="64" className="-rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="26"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="5"
                      className="text-slate-100 dark:text-slate-800"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="26"
                      fill="none"
                      stroke={attendanceStats.percentage >= 75 ? '#00C48C' : '#F04438'}
                      strokeWidth="5"
                      strokeDasharray={2 * Math.PI * 26}
                      strokeDashoffset={2 * Math.PI * 26 * (1 - Math.min(100, Math.max(0, attendanceStats.percentage)) / 100)}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-black text-slate-800 dark:text-white">
                      {Math.round(attendanceStats.percentage)}%
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-2xl font-black text-[#1B1E28] dark:text-white group-hover:text-[#5B4BFF] transition-colors leading-none">
                    {attendanceStats.percentage.toFixed(2)}%
                  </p>
                  <span className="text-[10.5px] font-bold text-slate-500 block mt-1">
                    Sem 3 • Live SRMS
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#5B4BFF] group-hover:translate-x-1 inline-flex items-center gap-1 transition-transform">
                  <span>View Full Ledger</span>
                  <span>→</span>
                </span>
                <span className="text-[9.5px] font-mono text-slate-400 font-bold">
                  {studentInfo?.registration_no}
                </span>
              </div>
            </Link>

            {/* Card 2: Question Papers & Assessments */}
            <Link
              href="/dashboard/student/assessment"
              className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft hover:shadow-md transition-all duration-200 block group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">
                  Question Papers & Tests
                </span>
                <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase ${
                  upcomingExamsCount > 0
                    ? 'bg-[#5B4BFF]/15 text-[#5B4BFF] dark:text-indigo-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {upcomingExamsCount > 0 ? `${upcomingExamsCount} Active` : '0 Active'}
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <p className="text-3xl font-black text-[#1B1E28] dark:text-white group-hover:text-[#5B4BFF] transition-colors">
                  {upcomingExamsCount}
                </p>
                <span className="text-xs font-medium text-[#4E5969] dark:text-slate-400">
                  {upcomingExamsCount === 1 ? 'Scheduled Paper' : 'Scheduled Assessments'}
                </span>
              </div>
              <p className="mt-3 text-xs text-[#4E5969] dark:text-slate-400 font-medium truncate">
                {upcomingExamsCount > 0
                  ? 'Internal Theory & MCQ Papers Published'
                  : 'No open exam papers currently published'}
              </p>
              <span className="mt-3 text-[11px] font-bold text-[#5B4BFF] group-hover:translate-x-1 inline-block transition-transform">
                Attempt / View Papers →
              </span>
            </Link>

            {/* Card 3: Exam Marks & Score Ledger (With Dynamic Performance Graph) */}
            {(() => {
              const totalObtained = examResults.reduce((acc, r) => acc + Number(r.marks_obtained || 0), 0);
              const totalMax = examResults.reduce((acc, r) => acc + Number(r.max_marks || 100), 0);
              const avgPct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
              const highestPct = examResults.length > 0
                ? Math.max(...examResults.map(r => ((Number(r.marks_obtained || 0) / (Number(r.max_marks) || 100)) * 100)))
                : 0;
              const allPassed = examResults.length > 0 && examResults.every(r => r.is_pass);
              const passRate = examResults.length > 0 ? Math.round((examResults.filter(r => r.is_pass).length / examResults.length) * 100) : 0;

              return (
                <Link
                  href="/dashboard/student/reports/theory-result"
                  className="p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft hover:shadow-md transition-all duration-200 block group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">
                      Marks & Results
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-black text-[10px] uppercase ${
                      examResults.length === 0
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        : allPassed
                          ? 'bg-[#00C48C]/15 text-[#00C48C]'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}>
                      {examResults.length === 0 ? 'No Marks' : allPassed ? '100% Pass' : `${passRate}% Pass`}
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <p className="text-2xl font-black text-[#1B1E28] dark:text-white group-hover:text-[#F36C21] transition-colors">
                      {examResults.length > 0 ? `${avgPct.toFixed(1)}%` : '0.0%'}
                    </p>
                    <span className="text-[10.5px] font-bold text-[#00C48C]">
                      {examResults.length > 0 ? `Highest: ${highestPct.toFixed(0)}%` : 'Pending'}
                    </span>
                  </div>

                  {/* Dynamic Subject Score Mini Bars Graph */}
                  {examResults.length > 0 ? (
                    <div className="mt-2.5 grid grid-cols-4 gap-1.5 items-end h-8 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                      {examResults.slice(0, 4).map((r, idx) => {
                        const pct = Math.min(100, Math.max(12, Math.round((Number(r.marks_obtained || 0) / (Number(r.max_marks) || 100)) * 100)));
                        const subName = (r.subject_name || r.paper_name || `S${idx + 1}`).trim();
                        const words = subName.split(' ');
                        const label = words.length > 1
                          ? words.map(w => w[0]).join('').slice(0, 3).toUpperCase()
                          : subName.slice(0, 3).toUpperCase();
                        const barColor = pct >= 75 ? '#00C48C' : pct >= 50 ? '#5B4BFF' : '#F36C21';

                        return (
                          <div key={r.id || idx} className="flex flex-col items-center gap-0.5 h-full justify-end" title={`${subName}: ${r.marks_obtained}/${r.max_marks || 100} (${pct}%)`}>
                            <div
                              className="w-full rounded-t-sm transition-all duration-500"
                              style={{ height: `${pct}%`, backgroundColor: barColor }}
                            />
                            <span className="text-[7.5px] font-bold text-slate-400 font-mono truncate max-w-[28px]">{label}</span>
                          </div>
                        );
                      })}
                      {Array.from({ length: Math.max(0, 4 - examResults.length) }).map((_, idx) => (
                        <div key={`empty-${idx}`} className="flex flex-col items-center gap-0.5 h-full justify-end opacity-25">
                          <div className="w-full bg-slate-300 dark:bg-slate-700 rounded-t-sm h-1" />
                          <span className="text-[7.5px] font-mono text-slate-400">-</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2.5 h-8 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center">
                      <span className="text-[10px] text-slate-400 font-medium">0 evaluations recorded</span>
                    </div>
                  )}

                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#F36C21] group-hover:translate-x-1 inline-block transition-transform">
                      View Theory Results →
                    </span>
                    <span className="text-[9.5px] font-mono text-slate-400 font-bold">
                      {examResults.length} {examResults.length === 1 ? 'Subject' : 'Subjects'}
                    </span>
                  </div>
                </Link>
              );
            })()}

            {/* Card 4: Academic Timetable & Schedule */}
            <Link
              href="/dashboard/student/timetable"
              className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft hover:shadow-md transition-all duration-200 block group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">
                  Timetable Schedule
                </span>
                <span className="p-2 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 font-black text-xs">
                  {timetableSummary.distinctSubjects.length > 0
                    ? `${timetableSummary.distinctSubjects.length} Subject${timetableSummary.distinctSubjects.length === 1 ? '' : 's'}`
                    : 'Active'}
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <p className="text-3xl font-black text-[#1B1E28] dark:text-white group-hover:text-purple-600 transition-colors">
                  {timetableSummary.loading
                    ? '...'
                    : `${timetableSummary.totalClasses} ${timetableSummary.totalClasses === 1 ? 'Class' : 'Classes'}`}
                </p>
              </div>
              <p className="mt-3 text-xs text-[#4E5969] dark:text-slate-400 font-medium truncate">
                {timetableSummary.distinctSubjects.length > 0
                  ? `Scheduled: ${timetableSummary.distinctSubjects.slice(0, 2).join(', ')}${timetableSummary.distinctSubjects.length > 2 ? ` +${timetableSummary.distinctSubjects.length - 2} more` : ''}`
                  : 'Scheduled Weekly Sessions'}
              </p>
              <span className="mt-3 text-[11px] font-bold text-purple-600 dark:text-purple-400 group-hover:translate-x-1 inline-block transition-transform">
                View Weekly Timetable →
              </span>
            </Link>

            {/* Card 5: Skill Internships & Certification Tracks */}
            <Link
              href="/dashboard/student/internships"
              className="p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft hover:shadow-md hover:border-[#5B4BFF] transition-all duration-200 block group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">
                  Internships & Certs
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#5B4BFF]/15 text-[#5B4BFF] dark:text-[#7867FF] font-black text-[10px] uppercase">
                  {internshipSummary.latestStatus}
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-2xl font-black text-[#1B1E28] dark:text-white group-hover:text-[#5B4BFF] transition-colors">
                  {internshipSummary.totalAvailable} Tracks
                </p>
                <span className="text-[11px] font-bold text-slate-500">
                  {internshipSummary.appliedCount > 0 ? `${internshipSummary.appliedCount} Applied` : 'Available'}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mt-2 space-y-1">
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#5B4BFF] via-[#7867FF] to-[#00C48C] transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(internshipSummary.appliedCount > 0 ? 30 : 0, internshipSummary.progressPct))}%`
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span className="font-bold text-[#00C48C]">{internshipSummary.completedCount > 0 ? 'Certified' : 'Skill Portal'}</span>
                  <span className="text-[#5B4BFF] font-bold group-hover:underline">Apply & Learn ➔</span>
                </div>
              </div>
            </Link>

          </div>

          {/* Chat & Communications + Notices & Key Highlights Row (IN ONE ROW) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChatDashboardWidget role="STUDENT" chatUrl="/dashboard/student/chat" />
            <NoticeDashboardWidget role="student" />
          </div>

          {/* Lessons & Materials */}
          <div className="grid grid-cols-1 gap-6">
            <RecentLessonsWidget role="STUDENT" />
          </div>

          <div className="grid grid-cols-1 gap-6">
            <AttendanceWidget role="STUDENT" />
          </div>

          {/* TWO COLUMN CONTENT SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Column 1 & 2: Recent Examination Results */}
            <div className="lg:col-span-2 p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft space-y-4">
              <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-black text-[#1B1E28] dark:text-white tracking-tight">
                    🏆 Recent Examination & Assessment Results
                  </h3>
                  <p className="text-xs text-[#4E5969] dark:text-slate-400">
                    Official internal assessment scores registered for Registration No: <strong className="font-mono text-[#5B4BFF]">{studentInfo?.registration_no || '2023MBBS045'}</strong>
                  </p>
                </div>
                <Link
                  href="/dashboard/student/marks"
                  className="px-3.5 py-1.5 rounded-xl bg-[#5B4BFF]/10 text-[#5B4BFF] hover:bg-[#5B4BFF] hover:text-white font-bold text-xs transition-all"
                >
                  View All Marks
                </Link>
              </div>

              {loading ? (
                <div className="py-8 text-center text-xs text-[#4E5969] dark:text-slate-400 animate-pulse">
                  Loading examination results...
                </div>
              ) : examResults.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#4E5969] dark:text-slate-400 border border-dashed border-[#E7EAF3] dark:border-slate-800 rounded-xl">
                  No examination results recorded yet for this student.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E7EAF3] dark:border-slate-800 text-[#4E5969] dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                        <th className="py-3 px-4">Paper Code</th>
                        <th className="py-3 px-4">Assessment Title</th>
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-4">Marks Obtained</th>
                        <th className="py-3 px-4">Max Marks</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800 font-medium">
                      {examResults.map((r) => {
                        const maxM = r.max_marks || 100;
                        return (
                          <tr key={r.id} className="hover:bg-[#F1F4F9]/60 dark:hover:bg-slate-800/40 transition">
                            <td className="py-3.5 px-4 font-mono font-black text-[#5B4BFF]">{r.paper_code || 'EXAM_RES'}</td>
                            <td className="py-3.5 px-4 font-bold text-[#1B1E28] dark:text-white">{r.paper_name || 'Assessment'}</td>
                            <td className="py-3.5 px-4 text-[#4E5969] dark:text-slate-300">{r.subject_name || 'Physiology'}</td>
                            <td className="py-3.5 px-4 font-black text-[#1B1E28] dark:text-white text-sm">{r.marks_obtained}</td>
                            <td className="py-3.5 px-4 text-[#4E5969] dark:text-slate-400">{maxM}</td>
                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${r.is_pass
                                    ? 'bg-[#00C48C]/15 text-[#00C48C] border-[#00C48C]/30'
                                    : 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                                  }`}
                              >
                                {r.is_pass ? 'PASSED' : 'FAILED'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Column 3: Quick Shortcuts & Today's Schedule */}
            <div className="space-y-6">

              {/* Today's Timetable Snippet */}
              <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft space-y-4">
                <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-[#1B1E28] dark:text-white uppercase tracking-tight">
                      📅 Today&apos;s Live Schedule
                    </h3>
                    {timetableSummary.todaysSlots.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px]">
                        {timetableSummary.todaysSlots.length} {timetableSummary.todaysSlots.length === 1 ? 'Slot' : 'Slots'}
                      </span>
                    )}
                  </div>
                  <Link href="/dashboard/student/timetable" className="text-xs font-bold text-[#5B4BFF] hover:underline">
                    View Timetable →
                  </Link>
                </div>

                {timetableSummary.loading ? (
                  <div className="py-6 text-center space-y-2">
                    <div className="w-5 h-5 border-2 border-[#5B4BFF] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium">Loading live schedule...</p>
                  </div>
                ) : timetableSummary.todaysSlots.length > 0 ? (
                  <div className="space-y-3 text-xs">
                    {timetableSummary.todaysSlots.map((slot: any, idx: number) => {
                      const startTime = (slot.start_time || '').slice(0, 5) || '09:00';
                      const endTime = (slot.end_time || '').slice(0, 5) || '10:00';
                      const isLab = String(slot.slot_type || slot.subject_name || '').toLowerCase().includes('lab') || String(slot.room || '').toLowerCase().includes('lab');

                      return (
                        <div
                          key={slot.id || idx}
                          className="p-3.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800/80 border border-[#E7EAF3] dark:border-slate-700/60 space-y-1 hover:border-[#5B4BFF]/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-bold ${isLab ? 'text-purple-600 dark:text-purple-400' : 'text-[#5B4BFF]'}`}>
                              {slot.subject_name || slot.slot_type || 'Lecture'}
                            </span>
                            <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                              isLab
                                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                : 'bg-[#5B4BFF]/10 text-[#5B4BFF]'
                            }`}>
                              {startTime} - {endTime}
                            </span>
                          </div>
                          <p className="text-[#1B1E28] dark:text-white font-semibold line-clamp-1">
                            {slot.topic || slot.unit_name || slot.sub_topics || slot.subject_name || 'Regular Academic Session'}
                          </p>
                          <p className="text-[11px] text-[#4E5969] dark:text-slate-400">
                            Faculty: {slot.faculty_name || 'Faculty Incharge'} | Room: {slot.room || 'Classroom'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : timetableSummary.weeklySlots.length > 0 ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs">
                      <p className="font-bold flex items-center gap-1.5">
                        <span>☀️</span>
                        <span>No classes scheduled for today</span>
                      </p>
                      <p className="text-[11px] text-[#4E5969] dark:text-slate-300 mt-1">
                        Upcoming cohort sessions:
                      </p>
                    </div>
                    <div className="space-y-2.5 text-xs">
                      {timetableSummary.weeklySlots.slice(0, 2).map((slot: any, idx: number) => {
                        const dayNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                        const dayStr = dayNames[Number(slot.day_of_week)] || 'Upcoming';
                        const startTime = (slot.start_time || '').slice(0, 5) || '09:00';
                        const endTime = (slot.end_time || '').slice(0, 5) || '10:00';

                        return (
                          <div
                            key={slot.id || idx}
                            className="p-3 rounded-xl bg-[#F6F8FC] dark:bg-slate-800/80 border border-[#E7EAF3] dark:border-slate-700/60 space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#5B4BFF]">
                                {slot.subject_name || 'Lecture'}
                              </span>
                              <span className="font-mono text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded">
                                {dayStr} {startTime} - {endTime}
                              </span>
                            </div>
                            <p className="text-[#1B1E28] dark:text-white font-semibold text-[11px] line-clamp-1">
                              {slot.topic || slot.unit_name || slot.subject_name}
                            </p>
                            <p className="text-[10px] text-[#4E5969] dark:text-slate-400">
                              Faculty: {slot.faculty_name || 'Faculty Incharge'} | Room: {slot.room || 'Classroom'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-center space-y-1">
                    <p className="text-sm">📅</p>
                    <p className="text-xs font-bold text-[#1B1E28] dark:text-white">
                      0 Scheduled Classes
                    </p>
                    <p className="text-[11px] text-[#4E5969] dark:text-slate-400">
                      No active timetable slots published for your cohort yet.
                    </p>
                  </div>
                )}
              </div>

              {/* Schedule Quick View Button */}
              <div className="p-6 rounded-[22px] bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-500/20 shadow-soft space-y-3">
                <h3 className="text-sm font-black text-[#1B1E28] dark:text-white tracking-tight">
                  📅 Academic Schedule & Timetable
                </h3>
                <p className="text-xs text-[#4E5969] dark:text-slate-300">
                  Review your daily class slots, assigned faculty, and laboratory rooms.
                </p>
                <Link
                  href="/dashboard/student/timetable"
                  className="w-full py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4E3FE3] text-white font-bold text-xs shadow-md transition-all inline-block text-center cursor-pointer"
                >
                  View Weekly Schedule →
                </Link>
              </div>

            </div>

          </div>
            </>
          )}

        </main>
      </div>

      <LogbookSubmitModal
        isOpen={isLogbookModalOpen}
        onClose={() => {
          setIsLogbookModalOpen(false);
          fetchStudentDashboardData();
        }}
      />

      <FeeReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
      />
    </div>
  );
}

function StudentDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero Welcome Banner Skeleton */}
      <div className="p-6 rounded-[22px] bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft flex flex-col md:flex-row justify-between items-start md:items-center gap-6 min-h-[160px]">
        <div className="space-y-3 flex-1">
          <div className="flex gap-2">
            <div className="w-28 h-5 bg-slate-300 dark:bg-slate-700 rounded-full" />
            <div className="w-16 h-5 bg-slate-300 dark:bg-slate-700 rounded-full" />
          </div>
          <div className="w-3/4 max-w-md h-8 bg-slate-300 dark:bg-slate-700 rounded-xl" />
          <div className="w-full max-w-lg h-4 bg-slate-300 dark:bg-slate-700 rounded-lg" />
          <div className="flex flex-wrap gap-3 pt-1">
            <div className="w-32 h-6 bg-slate-300 dark:bg-slate-700 rounded-xl" />
            <div className="w-28 h-6 bg-slate-300 dark:bg-slate-700 rounded-xl" />
            <div className="w-40 h-6 bg-slate-300 dark:bg-slate-700 rounded-xl" />
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="w-28 h-10 bg-slate-300 dark:bg-slate-700 rounded-xl" />
          <div className="w-28 h-10 bg-slate-300 dark:bg-slate-700 rounded-xl" />
        </div>
      </div>

      {/* 5 KPI Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft space-y-4 h-48"
          >
            <div className="flex justify-between items-center">
              <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="w-14 h-4 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="w-16 h-6 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="w-20 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            </div>
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded pt-2" />
          </div>
        ))}
      </div>

      {/* 3 Main Columns Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1 */}
        <div className="space-y-6">
          <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft h-64 space-y-4">
            <div className="w-40 h-5 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="space-y-2">
              <div className="w-full h-12 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div className="w-full h-12 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
          </div>
          <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft h-64 space-y-3">
            <div className="w-36 h-5 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="w-full h-44 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
        </div>

        {/* Col 2 */}
        <div className="space-y-6">
          <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft h-72 space-y-3">
            <div className="w-48 h-5 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="w-full h-44 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
          <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft h-64 space-y-3">
            <div className="w-44 h-5 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="space-y-2">
              <div className="w-full h-10 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="w-full h-10 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Col 3 */}
        <div className="space-y-6">
          <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft h-80 space-y-3">
            <div className="w-44 h-5 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="space-y-2.5">
              <div className="w-full h-16 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div className="w-full h-16 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
          </div>
          <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft h-36 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

