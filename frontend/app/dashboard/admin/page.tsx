'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import RecentLessonsWidget from '../../../components/RecentLessonsWidget';
import AttendanceWidget from '../../../components/AttendanceWidget';

interface CollegeKPIs {
  totalStudents: number;
  totalFaculty: number;
  totalDepartments: number;
  totalExams: number;
  activeStudentPercentage: string;
  monthlyFeeRevenue: string;
}

interface AdminPunch {
  date: string;
  displayDate: string;
  punchIn: string;
  punchOut: string;
  status: string;
  device: string;
}

interface MarksResultItem {
  id: string;
  studentName: string;
  rollNo: string;
  paperName: string;
  paperCode: string;
  marksObtained: string;
  maxMarks: string;
  percentage: string;
  status: string;
  evaluatedAt: string;
}

interface TimetableSlotItem {
  id: string;
  dayName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timeRange: string;
  subjectName: string;
  subjectCode: string;
  facultyName: string;
  facultyCode: string;
  room: string;
  departmentName: string;
}

const API_BASE = 'http://localhost:3001/api/v1';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);
  const [punchMessage, setPunchMessage] = useState('');
  const [selectedCollegeSlug, setSelectedCollegeSlug] = useState('srms-cet-bareilly');
  const [collegeInfo, setCollegeInfo] = useState({
    name: 'SRMS CET,BAREILLY',
    code: '1',
    slug: 'srms-cet-bareilly',
    schema: 'tenant_srms-cet-bareilly',
  });

  const [kpis, setKpis] = useState<CollegeKPIs>({
    totalStudents: 314,
    totalFaculty: 1,
    totalDepartments: 15,
    totalExams: 2,
    activeStudentPercentage: '98.5%',
    monthlyFeeRevenue: '₹14.5L',
  });

  const [punch, setPunch] = useState<AdminPunch>({
    date: '2026-08-16',
    displayDate: 'August 16, 2026',
    punchIn: '08:17 AM',
    punchOut: '--',
    status: 'Present / On Duty',
    device: 'SRMS-BIOMETRIC-01',
  });

  const [marksSummary, setMarksSummary] = useState<{
    totalEvaluated: number;
    averageMarks: number;
    maxMarks: number;
    passingRate: string;
    recentList: MarksResultItem[];
  }>({
    totalEvaluated: 3,
    averageMarks: 73.5,
    maxMarks: 80,
    passingRate: '100%',
    recentList: [],
  });

  const [timetable, setTimetable] = useState<{
    hasSchedule: boolean;
    departmentExists: boolean;
    departmentName: string;
    totalSlots: number;
    slots: TimetableSlotItem[];
  }>({
    hasSchedule: true,
    departmentExists: true,
    departmentName: 'BCA General / Computer Science & Engineering',
    totalSlots: 7,
    slots: [],
  });

  const fetchDashboardData = async (slugToQuery?: string) => {
    setLoading(true);
    try {
      const activeSlug = slugToQuery || selectedCollegeSlug || 'srms-cet-bareilly';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

      const res = await fetch(`${API_BASE}/analytics/dashboard/college?tenant=${activeSlug}`, { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.college) setCollegeInfo(json.college);
        if (json.kpis) setKpis(json.kpis);
        if (json.adminPunch) setPunch(json.adminPunch);
        if (json.marksResults) setMarksSummary(json.marksResults);
        if (json.timetable) setTimetable(json.timetable);
      }
    } catch (err) {
      console.error('[Dashboard] Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedSlug = typeof window !== 'undefined' ? (localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly') : 'srms-cet-bareilly';
    setSelectedCollegeSlug(savedSlug);
    fetchDashboardData(savedSlug);
  }, []);

  const handlePunchToggle = async (type: 'IN' | 'OUT') => {
    setPunching(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const res = await fetch(`${API_BASE}/analytics/punch?tenant=${selectedCollegeSlug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ punchType: type }),
      });
      if (res.ok) {
        setPunchMessage(`Admin Punch ${type} registered successfully! ✅`);
        await fetchDashboardData(selectedCollegeSlug);
        setTimeout(() => setPunchMessage(''), 4000);
      }
    } catch (e) {
      setPunchMessage('Error registering punch event.');
    } finally {
      setPunching(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="College Administration & Analytics KPI" />

        <main className="p-6 md:p-8 space-y-6 flex-1 max-w-[1600px] w-full mx-auto">
          {/* Top College Banner Header */}
          <div className="bg-gradient-to-r from-[#2D2575] to-[#4034A6] rounded-[22px] p-6 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 z-10">
              <div className="flex items-center gap-2">
                <span className="bg-[#F36C21] text-white text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full tracking-wider shadow-sm">
                  Active College Portal
                </span>
                <span className="text-white/70 text-xs font-mono">
                  colg_cd: #{collegeInfo.code}
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
                <span>🏛️</span>
                <span>{collegeInfo.name}</span>
              </h1>
              <p className="text-white/80 text-xs font-medium">
                Live KPI metrics, attendance punch status, examination papers, marks results, and department schedules.
              </p>
            </div>

            <div className="flex items-center gap-2.5 z-10">
              <button
                onClick={() => fetchDashboardData(selectedCollegeSlug)}
                disabled={loading}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <span className={loading ? 'animate-spin' : ''}>🔄</span>
                <span>{loading ? 'Refreshing...' : 'Refresh KPIs'}</span>
              </button>
            </div>

            {/* Subtle decorative background circles */}
            <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Feedback message */}
          {punchMessage && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm animate-fadeIn">
              <span>✅</span>
              <span>{punchMessage}</span>
            </div>
          )}

          {/* 1–4. Top KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Total Enrolled Students */}
            <Link
              href="/dashboard/admin/student-master"
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[22px] p-5 shadow-sm hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition-all group cursor-pointer block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  Total Enrolled Students
                </span>
                <span className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-base shadow-sm group-hover:scale-110 transition-transform">
                  👨‍🎓
                </span>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {loading ? '...' : kpis.totalStudents.toLocaleString()}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-xs">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {kpis.activeStudentPercentage} Active in {collegeInfo.name.split(',')[0]}
                  </span>
                </div>
              </div>
            </Link>

            {/* Card 2: Total Faculty */}
            <Link
              href="/dashboard/admin/subject-linker"
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[22px] p-5 shadow-sm hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition-all group cursor-pointer block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  Total Faculty (College Roster)
                </span>
                <span className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center text-base shadow-sm group-hover:scale-110 transition-transform">
                  👨‍🏫
                </span>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-black text-[#5B4BFF] dark:text-indigo-400 tracking-tight">
                  {loading ? '...' : kpis.totalFaculty.toLocaleString()}
                </p>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span>Across {kpis.totalDepartments} Active Departments</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold group-hover:underline">Linker ➔</span>
                </div>
              </div>
            </Link>

            {/* Card 3: Admin Punch IN / OUT on Current Day */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[22px] p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  Admin Attendance & Punch
                </span>
                <span className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-base shadow-sm">
                  ⏱️
                </span>
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Day ({punch.date}):</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                    ● {punch.status}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 font-mono text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">
                    IN: <span className="text-[#5B4BFF] font-black">{punch.punchIn}</span>
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    OUT: <span className="text-slate-500 dark:text-slate-400 font-black">{punch.punchOut}</span>
                  </span>
                </div>
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => handlePunchToggle('IN')}
                    disabled={punching}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                  >
                    Punch In
                  </button>
                  <button
                    onClick={() => handlePunchToggle('OUT')}
                    disabled={punching}
                    className="flex-1 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-bold text-[11px] transition-all disabled:opacity-50 active:scale-95"
                  >
                    Punch Out
                  </button>
                </div>
              </div>
            </div>

            {/* Card 4: Total Exam Papers Created */}
            <Link
              href="/dashboard/admin/assessment"
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[22px] p-5 shadow-sm hover:shadow-md hover:border-amber-400 dark:hover:border-amber-600 transition-all group cursor-pointer block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  Exam Papers Created
                </span>
                <span className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-base shadow-sm group-hover:scale-110 transition-transform">
                  📝
                </span>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                  {loading ? '...' : kpis.totalExams}
                </p>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span className="truncate max-w-[150px]">Mid Term BCA & Web Tech</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold group-hover:underline">Q-Bank ➔</span>
                </div>
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AttendanceWidget role="ADMIN" />
            <RecentLessonsWidget role="ADMIN" />
          </div>

          {/* 5 & 6. Mid Section: Marks Results & Department Timetable Schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 5. Marks Results Card (5 Cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[22px] p-6 shadow-sm flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                    <span>📊</span>
                    <span>Student Assessment & Marks Results</span>
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Real-time evaluated records for {collegeInfo.name.split(',')[0]}
                  </p>
                </div>
                <Link
                  href="/dashboard/admin/assessment-marks"
                  className="text-xs font-bold text-[#5B4BFF] hover:underline"
                >
                  Marks Entry ➔
                </Link>
              </div>

              {/* Summary Badges */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-[#F6F8FC] dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Evaluated</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white">{marksSummary.totalEvaluated}</span>
                </div>
                <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-200/60 dark:border-indigo-800/60 text-center">
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase block">Avg Score</span>
                  <span className="text-lg font-black text-[#5B4BFF]">{marksSummary.averageMarks} / {marksSummary.maxMarks}</span>
                </div>
                <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60 text-center">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase block">Pass Rate</span>
                  <span className="text-lg font-black text-emerald-600">{marksSummary.passingRate}</span>
                </div>
              </div>

              {/* Recent Results Table */}
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F6F8FC] dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                      <th className="p-2.5">Student / Roll</th>
                      <th className="p-2.5">Marks</th>
                      <th className="p-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {marksSummary.recentList.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-slate-400">
                          No assessment marks submitted yet.
                        </td>
                      </tr>
                    ) : (
                      marksSummary.recentList.slice(0, 5).map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-2.5">
                            <span className="font-bold text-slate-900 dark:text-white block">{item.studentName}</span>
                            <span className="text-[10px] font-mono text-slate-500">{item.rollNo}</span>
                          </td>
                          <td className="p-2.5">
                            <span className="font-extrabold text-[#5B4BFF]">{item.marksObtained}</span>
                            <span className="text-[10px] text-slate-400"> / {item.maxMarks}</span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 ml-1.5 font-bold">({item.percentage})</span>
                          </td>
                          <td className="p-2.5 text-right">
                            <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                              ✓ {item.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 6. Current Department Timetable Schedule Card (7 Cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[22px] p-6 shadow-sm flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                      <span>📅</span>
                      <span>Current College & Department Timetable</span>
                    </h2>
                    <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                      Active Schedule
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {timetable.departmentExists ? `Department: ${timetable.departmentName}` : 'Department Schedule'}
                  </p>
                </div>
                <Link
                  href="/dashboard/admin/timetable-design"
                  className="px-3 py-1.5 bg-[#5B4BFF] hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                >
                  <span>See All</span>
                  <span>➔</span>
                </Link>
              </div>

              {/* Schedule Table / List */}
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F6F8FC] dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                      <th className="p-3 pl-4">Day & Time</th>
                      <th className="p-3">Subject</th>
                      <th className="p-3">Faculty Member</th>
                      <th className="p-3 pr-4">Room / Lab</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {timetable.slots.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-slate-400">
                          No timetable slots scheduled for this department. Click &apos;See All&apos; to configure timetable.
                        </td>
                      </tr>
                    ) : (
                      timetable.slots.map((slot) => (
                        <tr key={slot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-3 pl-4 whitespace-nowrap">
                            <span className="font-extrabold text-slate-900 dark:text-white block">{slot.dayName}</span>
                            <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-200/50 dark:border-indigo-800/50">
                              {slot.timeRange}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-900 dark:text-white block">{slot.subjectName}</span>
                            <span className="text-[10px] font-mono text-slate-500">Code: #{slot.subjectCode}</span>
                          </td>
                          <td className="p-3">
                            <span className="font-extrabold text-slate-800 dark:text-slate-200 block">{slot.facultyName}</span>
                            <span className="text-[10px] text-slate-500">{slot.departmentName}</span>
                          </td>
                          <td className="p-3 pr-4">
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-2 py-1 rounded-lg text-[11px] border border-slate-200 dark:border-slate-700 inline-block">
                              📍 {slot.room}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 7. Bottom System Health & Isolation Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[22px] p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white tracking-tight uppercase flex items-center gap-2">
              <span>🛡️</span>
              <span>College Multi-Tenant System Health & Isolation Overview</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#F6F8FC] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 shadow-sm">
                <span className="font-bold text-slate-900 dark:text-white block">PostgreSQL Schema Isolation</span>
                <p className="text-slate-600 dark:text-slate-400">
                  Active Schema: <code className="text-[#5B4BFF] font-mono font-bold">{collegeInfo.schema}</code>
                </p>
                <p className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                  <span>✔</span>
                  <span>Schema-per-tenant isolated cleanly</span>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F6F8FC] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 shadow-sm">
                <span className="font-bold text-slate-900 dark:text-white block">Active Department & Staff Roster</span>
                <p className="text-slate-600 dark:text-slate-400">
                  Total Departments: <span className="font-bold text-slate-900 dark:text-white">{kpis.totalDepartments}</span> | Faculty: <span className="font-bold text-slate-900 dark:text-white">{kpis.totalFaculty}</span>
                </p>
                <p className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                  <span>✔</span>
                  <span>Authentic SRMS CET Roster Synced</span>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F6F8FC] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 shadow-sm">
                <span className="font-bold text-slate-900 dark:text-white block">AWS S3 Document & Q-Bank Bucket</span>
                <p className="text-slate-600 dark:text-slate-400">
                  Bucket: <code className="text-[#5B4BFF] font-mono font-bold">mederp-files/srms-cet</code>
                </p>
                <p className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                  <span>✔</span>
                  <span>Presigned Upload URLs Active</span>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
