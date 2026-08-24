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

import { Sparkles, Rocket, Award, CheckCircle2, ArrowRight, FolderGit2 } from 'lucide-react';

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
    percentage: 92.4,
    totalClasses: 77,
    totalPresent: 71,
    theoryPct: 91.5,
    practicalPct: 94.2,
  });
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [upcomingExamsCount, setUpcomingExamsCount] = useState<number>(3);
  const [logbookVerifiedCount, setLogbookVerifiedCount] = useState<number>(28);
  const [logbookTotalCount, setLogbookTotalCount] = useState<number>(30);
  const [internshipSummary, setInternshipSummary] = useState({
    totalAvailable: 0,
    appliedCount: 0,
    completedCount: 0,
    latestStatus: 'Available',
    progressPct: 0,
  });
  const [incubatedProjects, setIncubatedProjects] = useState<IncubatedProjectAlert[]>([]);
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
      const meRes = await fetch(`${API_BASE}/auth/me`, { headers }).catch(() => null);
      const isMed = slug.includes('ims') || slug.includes('med');
      let regNo = cachedReg || (isMed ? '2023MBBS045' : '2025107990');
      let studentNameVal = cachedName || (isMed ? 'Rahul Verma' : 'AAFREEN KHAN');
      let studentRollVal = cachedRoll || (isMed ? 'MBBS2023045' : '2500141790001');

      if (meRes && meRes.ok) {
        const json = await meRes.json();
        const meData = json.data || json;
        const p = meData.profile || meData;
        regNo =
          p.registration_no ||
          meData.registrationNo ||
          meData.registration_no ||
          p.rollno ||
          meData.rollno ||
          regNo;
        studentNameVal = meData.name || p.name || meData.student_name || studentNameVal;
        studentRollVal = p.rollno || meData.rollno || studentRollVal;

        const courseStr = meData.courseName || p.course_name || p.course_cd || (isMed ? 'MBBS' : 'BCA');
        const deptStr = meData.departmentName || p.department_name || (isMed ? 'Phase 2 MBBS' : 'Computer Applications (BCA)');

        setStudentInfo({
          name: studentNameVal,
          rollno: studentRollVal,
          registration_no: regNo,
          batch: p.batch_cd || meData.batchCd || (isMed ? '2023-MBBS Batch' : 'Batch 2025'),
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

      // 2. Fetch Live Individual Student Attendance from SRMS
      try {
        const targetReg = regNo || '2025107990';
        const liveRes = await fetch('/api/srms/student-individual-attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            colg_cd: 1,
            course_cd: 13,
            branch_cd: 1,
            batch_cd: 2,
            stud_reg_no: targetReg,
          }),
        });
        if (liveRes.ok) {
          const liveJson = await liveRes.json();
          if (liveJson.success && liveJson.data) {
            const pct =
              typeof liveJson.data.percentage === 'number'
                ? liveJson.data.percentage
                : parseFloat(String(liveJson.data.percentage || '24.84'));

            setAttendanceStats((prev) => ({
              ...prev,
              percentage: isNaN(pct) ? 24.84 : pct,
            }));
          }
        }
      } catch (e) {
        console.warn('Failed to load individual live attendance:', e);
        setAttendanceStats((prev) => ({ ...prev, percentage: 24.84 }));
      }

      // 3. Fetch Exam Results
      const examRes = await fetch(`${API_BASE}/exams/student/${regNo}?tenant=${slug}`, { headers });
      if (examRes.ok) {
        const examJson = await examRes.json();
        const list = examJson.data !== undefined ? examJson.data : examJson;
        if (Array.isArray(list) && list.length > 0) {
          setExamResults(list.slice(0, 4));
        } else {
          setExamResults(getFallbackExamResults(slug));
        }
      } else {
        setExamResults(getFallbackExamResults(slug));
      }

      // 5. Fetch Live Student Internship & Certification Status
      try {
        const intRes = await fetch(`/api/internships/list`, {
          headers: {
            'x-tenant-id': `tenant_${slug}`,
            'x-tenant': slug,
            'x-user-reg-no': regNo,
          },
        });
        if (intRes.ok) {
          const j = await intRes.json();
          const list = Array.isArray(j.data) ? j.data : Array.isArray(j) ? j : [];
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
      } catch {}

      // 6. Fetch Student Incubation Projects for Golden Alert Banner
      try {
        const incRes = await fetch(`/api/incubation-cell/projects?tenant=${slug}`, {
          headers: {
            'x-tenant-id': `tenant_${slug}`,
            'x-tenant': slug,
            'x-tenant-slug': slug,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (incRes.ok) {
          const incJson = await incRes.json();
          const list = Array.isArray(incJson.data) ? incJson.data : (Array.isArray(incJson) ? incJson : []);
          const myIncubated = list.filter((p: any) => 
            p.studentRegNo === regNo || 
            p.rollNo === studentRollVal || 
            (p.studentName && studentNameVal && p.studentName.toLowerCase().trim() === studentNameVal.toLowerCase().trim()) ||
            ['Selected', 'Funded', 'Incubated'].includes(p.incubationStatus)
          );
          setIncubatedProjects(myIncubated);
        }
      } catch (e) {
        console.warn('Failed to load incubation projects for student:', e);
      }
    } catch {
      setExamResults(getFallbackExamResults(slug));
    } finally {
      setLoading(false);
    }
  };

  const getFallbackExamResults = (slug?: string): ExamResult[] => {
    const isMed = slug && (slug.includes('ims') || slug.includes('med'));
    if (isMed) {
      return [
        {
          id: 'res-1',
          paper_name: 'Physiology 1st Internal Assessment (Theory)',
          paper_code: 'PHY_IA1_2026',
          subject_name: 'Physiology',
          marks_obtained: 85,
          max_marks: 100,
          is_pass: true,
          paper_type: 'THEORY',
        },
        {
          id: 'res-2',
          paper_name: 'Anatomy Histology & Gross Viva',
          paper_code: 'ANA_VIVA_2026',
          subject_name: 'Anatomy',
          marks_obtained: 78,
          max_marks: 100,
          is_pass: true,
          paper_type: 'PRACTICAL_VIVA',
        },
        {
          id: 'res-3',
          paper_name: 'Biochemistry Formative Quiz 1',
          paper_code: 'BIC_FA1_2026',
          subject_name: 'Biochemistry',
          marks_obtained: 42,
          max_marks: 50,
          is_pass: true,
          paper_type: 'MCQ',
        },
      ];
    }
    return [
      {
        id: 'res-1',
        paper_name: 'Database Management Systems Midterm',
        paper_code: 'BCA-301',
        subject_name: 'Database Systems',
        marks_obtained: 88,
        max_marks: 100,
        is_pass: true,
        paper_type: 'THEORY',
      },
      {
        id: 'res-2',
        paper_name: 'Data Structures & Algorithms Practical Viva',
        paper_code: 'KCS-351',
        subject_name: 'Data Structures',
        marks_obtained: 92,
        max_marks: 100,
        is_pass: true,
        paper_type: 'PRACTICAL_VIVA',
      },
      {
        id: 'res-3',
        paper_name: 'Object Oriented Programming with Java',
        paper_code: 'BCA-302',
        subject_name: 'Java Programming',
        marks_obtained: 45,
        max_marks: 50,
        is_pass: true,
        paper_type: 'THEORY',
      },
    ];
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-[#0F172A] text-[#4E5969] dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar role="student" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Student Academic Portal Dashboard" />
        
        <main className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 flex-1 max-w-[1600px] w-full mx-auto overflow-x-hidden">
          
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
                href="/dashboard/student/library"
                className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-md text-center transition-all flex items-center justify-center gap-1.5"
              >
                <span>📚</span>
                <span>E-Library (8,687 Books)</span>
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

          {/* 🚀 GOLDEN OPPORTUNITY INCUBATION CELL SELECTION ALERT BANNER */}
          {incubatedProjects.length > 0 && (
            <div className="space-y-4">
              {incubatedProjects.map((p) => {
                const isFunded = p.incubationStatus === 'Funded';
                const isSelected = p.incubationStatus === 'Selected';
                const isIncubated = p.incubationStatus === 'Incubated';

                return (
                  <div
                    key={p.id}
                    className="p-5 sm:p-6 rounded-[22px] bg-gradient-to-r from-amber-500 via-[#F36C21] to-[#5B4BFF] text-white shadow-xl relative overflow-hidden border-2 border-amber-300 animate-in fade-in slide-in-from-top-3 duration-300"
                  >
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                      <div className="space-y-2 max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-3 py-1 rounded-full bg-white text-slate-900 font-black text-[11px] tracking-wider uppercase flex items-center gap-1.5 shadow-sm">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>🚀 GOLDEN OPPORTUNITY: INCUBATION SHORTLISTED</span>
                          </span>

                          <span className="px-3 py-1 rounded-full bg-black/20 backdrop-blur-md border border-white/30 text-white font-bold text-xs">
                            Status: <strong>{p.incubationStatus}</strong> {isFunded ? '💰' : '🌟'}
                          </span>

                          <span className="px-3 py-1 rounded-full bg-emerald-400 text-slate-950 font-black text-xs">
                            Faculty Score: {p.score}% (Grade {p.grade})
                          </span>
                        </div>

                        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                          <span>🎉 Congratulations! Selected Project: &quot;{p.title}&quot;</span>
                        </h2>

                        <p className="text-xs sm:text-sm text-white/95 leading-relaxed font-medium">
                          🌟 You are a genius! Your repository project <strong>&quot;{p.title}&quot;</strong> has achieved top faculty marks and has been officially selected by the College Administration for the <strong>SRMS Venture Incubation Cell & Corporate Commercialization Pipeline</strong>.
                        </p>

                        {/* Seed Funding / Mentor Tagline */}
                        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                          {(p.fundingAmount || 0) > 0 && (
                            <span className="px-3 py-1 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-black flex items-center gap-1.5">
                              <span>💰 Seed Grant Approved:</span>
                              <span className="text-amber-200">₹{Number(p.fundingAmount).toLocaleString('en-IN')}</span>
                            </span>
                          )}

                          {p.mentorAssigned && (
                            <span className="px-3 py-1 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-medium">
                              👨‍🏫 <strong>Venture Mentor:</strong> {p.mentorAssigned}
                            </span>
                          )}

                          {p.incubationNotes && (
                            <span className="px-3 py-1 rounded-xl bg-white/15 backdrop-blur-md text-white/90 italic text-[11px]">
                              &quot;{p.incubationNotes}&quot;
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action CTA */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                        <Link
                          href="/dashboard/student/repository"
                          className="px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs shadow-lg transition-all text-center flex items-center justify-center gap-2 shrink-0 active:scale-95 cursor-pointer"
                        >
                          <FolderGit2 className="w-4 h-4 text-[#5B4BFF]" />
                          <span>View Project 📂</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 5 MAIN KPI CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            
            {/* Card 1: Live Current Semester Attendance (Circular Graph) */}
            <Link 
              href="/dashboard/student/attendance" 
              className="p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft hover:shadow-md transition-all duration-200 block group relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">
                  Current Sem Attendance
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase ${
                    attendanceStats.percentage >= 75
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
                <span className="p-2 rounded-xl bg-[#5B4BFF]/15 text-[#5B4BFF] font-black text-xs">
                  Active
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <p className="text-3xl font-black text-[#1B1E28] dark:text-white group-hover:text-[#5B4BFF] transition-colors">
                  {upcomingExamsCount}
                </p>
                <span className="text-xs font-medium text-[#4E5969] dark:text-slate-400">
                  Scheduled Assessments
                </span>
              </div>
              <p className="mt-3 text-xs text-[#4E5969] dark:text-slate-400 font-medium">
                Internal Theory & MCQ Papers Published
              </p>
              <span className="mt-3 text-[11px] font-bold text-[#5B4BFF] group-hover:translate-x-1 inline-block transition-transform">
                Attempt / View Papers →
              </span>
            </Link>

            {/* Card 3: Exam Marks & Score Ledger (With Performance Graph) */}
            <Link 
              href="/dashboard/student/reports/theory-result" 
              className="p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft hover:shadow-md transition-all duration-200 block group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#4E5969] dark:text-slate-400">
                  Marks & Results
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#00C48C]/15 text-[#00C48C] font-black text-[10px] uppercase">
                  100% Pass
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-2xl font-black text-[#1B1E28] dark:text-white group-hover:text-[#F36C21] transition-colors">
                  85.6%
                </p>
                <span className="text-[10.5px] font-bold text-[#00C48C]">
                  Highest: 92%
                </span>
              </div>

              {/* Subject Score Mini Bars Graph */}
              <div className="mt-2.5 grid grid-cols-4 gap-1.5 items-end h-8 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex flex-col items-center gap-0.5 h-full justify-end">
                  <div className="w-full bg-[#5B4BFF] rounded-t-sm" style={{ height: '85%' }} title="Web Tech: 85%" />
                  <span className="text-[7.5px] font-bold text-slate-400 font-mono">WT</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 h-full justify-end">
                  <div className="w-full bg-[#00C48C] rounded-t-sm" style={{ height: '78%' }} title="BC: 78%" />
                  <span className="text-[7.5px] font-bold text-slate-400 font-mono">BC</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 h-full justify-end">
                  <div className="w-full bg-[#FFB020] rounded-t-sm" style={{ height: '92%' }} title="CO: 92%" />
                  <span className="text-[7.5px] font-bold text-slate-400 font-mono">CO</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 h-full justify-end">
                  <div className="w-full bg-[#F36C21] rounded-t-sm" style={{ height: '88%' }} title="OOP: 88%" />
                  <span className="text-[7.5px] font-bold text-slate-400 font-mono">OOP</span>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#F36C21] group-hover:translate-x-1 inline-block transition-transform">
                  View Theory Results →
                </span>
                <span className="text-[9.5px] font-mono text-slate-400 font-bold">
                  4 Subjects
                </span>
              </div>
            </Link>

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
                  Active
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <p className="text-3xl font-black text-[#1B1E28] dark:text-white group-hover:text-purple-600 transition-colors">
                  7 Classes
                </p>
              </div>
              <p className="mt-3 text-xs text-[#4E5969] dark:text-slate-400 font-medium">
                Scheduled Weekly Sessions
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
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                  r.is_pass
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
                  <h3 className="text-sm font-black text-[#1B1E28] dark:text-white uppercase tracking-tight">
                    📅 Today's Live Schedule
                  </h3>
                  <Link href="/dashboard/student/timetable" className="text-xs font-bold text-[#5B4BFF] hover:underline">
                    View Timetable →
                  </Link>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800/80 border border-[#E7EAF3] dark:border-slate-700/60 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#5B4BFF]">Data Structures Lecture</span>
                      <span className="font-mono text-[10px] font-bold bg-[#5B4BFF]/10 text-[#5B4BFF] px-2 py-0.5 rounded">09:00 - 10:00</span>
                    </div>
                    <p className="text-[#1B1E28] dark:text-white font-semibold">Binary Search Trees & AVL Balancing</p>
                    <p className="text-[11px] text-[#4E5969] dark:text-slate-400">Faculty: Dr. Anuj Kumar | Room: CS-Lab 102</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800/80 border border-[#E7EAF3] dark:border-slate-700/60 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-600 dark:text-purple-400">DBMS Practical Lab</span>
                      <span className="font-mono text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded">10:00 - 12:00</span>
                    </div>
                    <p className="text-[#1B1E28] dark:text-white font-semibold">SQL Indexing & Complex Joins</p>
                    <p className="text-[11px] text-[#4E5969] dark:text-slate-400">Faculty: Er. Shailesh Saxena | Room: Server Lab 3</p>
                  </div>
                </div>
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

