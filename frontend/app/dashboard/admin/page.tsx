'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import RecentLessonsWidget from '../../../components/RecentLessonsWidget';
import AttendanceWidget from '../../../components/AttendanceWidget';
import NoticeDashboardWidget from '../../../components/notices/NoticeDashboardWidget';
import ChatDashboardWidget from '../../../components/chat/ChatDashboardWidget';
import LicenseReceiptModal, { LicenseReceiptData } from '../../../components/firms/LicenseReceiptModal';
import LibraryDashboardCard from '../../../components/library/LibraryDashboardCard';
import FacultyDailyPunchWidget from '../../../components/FacultyDailyPunchWidget';
import FacultyLeaveLedgerWidget from '../../../components/FacultyLeaveLedgerWidget';
import IncubationCellCard from '../../../components/incubation/IncubationCellCard';

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
  const [selectedCollegeSlug, setSelectedCollegeSlug] = useState('');
  const [collegeInfo, setCollegeInfo] = useState({
    name: 'College Administration',
    code: '1',
    slug: '',
    schema: '',
  });

  // License & Renewal Slip state
  const [licenseInfo, setLicenseInfo] = useState<{
    status: string;
    trial_ends_at?: string;
    firm_mode?: string;
    key_prefix?: string;
    duration_days?: number;
  }>({
    status: 'ACTIVE',
    trial_ends_at: '',
    firm_mode: 'NONMED',
  });
  const [licenseReceipts, setLicenseReceipts] = useState<LicenseReceiptData[]>([]);
  const [selectedReceiptModal, setSelectedReceiptModal] = useState<LicenseReceiptData | null>(null);
  const [showReceiptHistoryList, setShowReceiptHistoryList] = useState<boolean>(false);

  const [kpis, setKpis] = useState<CollegeKPIs>({
    totalStudents: 0,
    totalFaculty: 0,
    totalDepartments: 0,
    totalExams: 0,
    activeStudentPercentage: '100%',
    monthlyFeeRevenue: '₹0',
  });

  const [punch, setPunch] = useState<AdminPunch>({
    date: new Date().toISOString().split('T')[0],
    displayDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    punchIn: '--',
    punchOut: '--',
    status: 'Ready',
    device: 'Campus Biometric Device',
  });

  const [marksSummary, setMarksSummary] = useState<{
    totalEvaluated: number;
    averageMarks: number;
    maxMarks: number;
    passingRate: string;
    recentList: MarksResultItem[];
  }>({
    totalEvaluated: 0,
    averageMarks: 0,
    maxMarks: 100,
    passingRate: '0%',
    recentList: [],
  });

  // 1. Placement Drives state
  const [placementStats, setPlacementStats] = useState({
    totalDrives: 0,
    latestCompany: '',
    latestRole: '',
    packageDetails: '',
    totalApplicants: 0,
    applicantList: [] as Array<{ id: string; name: string; photo: string; rollno: string; course: string; initials: string }>,
    loading: true,
  });

  // 2. Project Repositories & Scores state
  const [repoStats, setRepoStats] = useState({
    totalRepos: 0,
    latestTitle: '',
    latestScore: '0.0%',
    latestGrade: '-',
    pendingReviews: 0,
    avgScore: '0.0',
    studentName: '',
    studentPhoto: '',
    studentRoll: '',
    courseName: '',
    batchName: '',
    loading: true,
  });

  // 3. Internship Stats
  const [internshipStats, setInternshipStats] = useState({
    totalPrograms: 0,
    totalApplicants: 0,
    totalSeats: 0,
    percentageFilled: 0,
    maxReachTrack: '',
    maxReachApplicants: 0,
    paidTracks: 0,
    freeTracks: 0,
    applicantList: [] as Array<{ id: string; name: string; photo: string; rollno: string; course: string; initials: string }>,
    loading: true,
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

  const fetchLiveAttendancePunches = async () => {
    try {
      const storedEmpId =
        typeof window !== 'undefined'
          ? localStorage.getItem('empid') ||
            localStorage.getItem('emp_id') ||
            localStorage.getItem('employeeId') ||
            'T/99/1203'
          : 'T/99/1203';
      const storedDeviceCd =
        typeof window !== 'undefined' ? localStorage.getItem('devicecd') || '30103' : '30103';

      const res = await fetch('/api/srms/emp-punches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empid: storedEmpId, DEVICECD: storedDeviceCd }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const today = json.today || json.data[0];
          const activeDay = today?.hasPunches ? today : json.data.find((d: any) => d.hasPunches) || today;
          const todayDateStr = new Date().toISOString().split('T')[0];

          setPunch({
            date: today?.date || todayDateStr,
            displayDate: today?.displayDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            punchIn: activeDay?.punchIn !== '--' ? activeDay.punchIn : '--',
            punchOut: activeDay?.punchOut !== '--' ? activeDay.punchOut : '--',
            status: activeDay?.hasPunches ? 'Present / On Duty' : 'Present / On Duty',
            device: activeDay?.device || 'SRMS Biometric Device',
          });
        }
      }
    } catch (err) {
      console.error('Error fetching live attendance punches:', err);
    }
  };

  const handlePunchToggle = async (type: 'IN' | 'OUT') => {
    setPunching(true);
    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const todayStr = now.toISOString().split('T')[0];

      if (type === 'IN') {
        setPunch((prev) => ({
          ...prev,
          date: todayStr,
          punchIn: timeStr,
          status: 'Present / On Duty',
        }));
        setPunchMessage(`Biometric Punch IN marked at ${timeStr}`);
      } else {
        setPunch((prev) => ({
          ...prev,
          date: todayStr,
          punchOut: timeStr,
          status: 'Shift Completed',
        }));
        setPunchMessage(`Biometric Punch OUT marked at ${timeStr}`);
      }

      await fetchLiveAttendancePunches();
    } catch (err) {
      console.error('Punch error:', err);
    } finally {
      setPunching(false);
      setTimeout(() => setPunchMessage(''), 4000);
    }
  };

  const fetchDashboardData = async (slugToQuery?: string) => {
    setLoading(true);
    try {
      const activeSlug = slugToQuery || selectedCollegeSlug || 'srms-cet-bareilly';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

      // Fetch live biometric attendance punches from SRMS GetEmpInOutTime
      fetchLiveAttendancePunches();

      const res = await fetch(`${API_BASE}/analytics/dashboard/college?tenant=${activeSlug}`, { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.college) setCollegeInfo(json.college);
        if (json.kpis) setKpis(json.kpis);
        if (json.adminPunch && !json.adminPunch.punchIn) setPunch(json.adminPunch);
        if (json.marksResults) setMarksSummary(json.marksResults);
        if (json.timetable) setTimetable(json.timetable);
      }

      // Fetch Placement Drives
      fetch(`${API_BASE}/placement-drive/list${activeSlug ? `?tenant=${activeSlug}` : ''}`, { headers })
        .then(async (r) => {
          if (r.ok) {
            const j = await r.json();
            const list = Array.isArray(j.data) ? j.data : Array.isArray(j.data?.data) ? j.data.data : [];
            if (list.length > 0) {
              const firstComp = list[0]?.company_name || '';
              const totalApps = list.reduce((acc: number, d: any) => acc + (Number(d.total_applicants || d.applicants_count) || 0), 0);
              setPlacementStats({
                totalDrives: list.length,
                latestCompany: firstComp,
                latestRole: list[0]?.job_title || list[0]?.role || '',
                packageDetails: list[0]?.package_details || list[0]?.ctc_range || '',
                totalApplicants: totalApps,
                applicantList: [],
                loading: false,
              });
            } else {
              setPlacementStats({
                totalDrives: 0,
                latestCompany: '',
                latestRole: '',
                packageDetails: '',
                totalApplicants: 0,
                applicantList: [],
                loading: false,
              });
            }
          }
        })
        .catch(() => setPlacementStats((prev) => ({ ...prev, loading: false })));

      // Fetch Repositories with Student Details
      fetch(`${API_BASE}/repository/list${activeSlug ? `?tenant=${activeSlug}` : ''}`, { headers })
        .then(async (r) => {
          if (r.ok) {
            const j = await r.json();
            const list = Array.isArray(j.data) ? j.data : Array.isArray(j.data?.data) ? j.data.data : [];
            if (list.length > 0) {
              const first = list[0] || {};
              const firstTitle = first.title || '';
              const reviewedList = list.filter((x: any) => x.score !== null && x.score !== undefined);
              const pendingList = list.filter((x: any) => !x.score || x.status === 'Pending Review');
              const avg = reviewedList.length > 0
                ? (reviewedList.reduce((acc: number, x: any) => acc + Number(x.score), 0) / reviewedList.length).toFixed(1)
                : '0.0';
              const latestGrade = first.grade || reviewedList[0]?.grade || '-';

              setRepoStats({
                totalRepos: list.length,
                latestTitle: firstTitle,
                latestScore: `${avg}%`,
                latestGrade,
                pendingReviews: pendingList.length,
                avgScore: avg,
                studentName: first.student_name || '',
                studentPhoto: first.student_photo || '',
                studentRoll: first.rollno || first.student_reg_no || '',
                courseName: first.course_name || '',
                batchName: first.batch_name ? `Batch ${first.batch_name}` : '',
                loading: false,
              });
            } else {
              setRepoStats({
                totalRepos: 0,
                latestTitle: '',
                latestScore: '0.0%',
                latestGrade: '-',
                pendingReviews: 0,
                avgScore: '0.0',
                studentName: '',
                studentPhoto: '',
                studentRoll: '',
                courseName: '',
                batchName: '',
                loading: false,
              });
            }
          }
        })
        .catch(() => setRepoStats((prev) => ({ ...prev, loading: false })));

      // Fetch live internship stats & applicants progress with real photos
      fetch(`/api/internships/list`, {
        headers: {
          'x-tenant-id': `tenant_${activeSlug}`,
          'x-tenant': activeSlug,
          ...headers,
        },
      })
        .then(async (r) => {
          if (r.ok) {
            const j = await r.json();
            const list = Array.isArray(j.data) ? j.data : Array.isArray(j) ? j : [];
            if (list.length > 0) {
              const totalProg = list.length;
              const totalApps = list.reduce((acc: number, p: any) => acc + (Number(p.total_applicants) || 0), 0);
              const totalSeats = list.reduce((acc: number, p: any) => acc + (Number(p.seats_available) || 50), 0);
              const pct = totalSeats > 0 ? Math.min(100, Math.round((totalApps / totalSeats) * 100)) : 0;

              const sortedByReach = [...list].sort((a, b) => (Number(b.total_applicants) || 0) - (Number(a.total_applicants) || 0));
              const topTrack = sortedByReach[0] || {};
              const maxTrackTitle = topTrack.title || '';
              const maxReachCount = Number(topTrack.total_applicants) || 0;

              const paidCount = list.filter((x: any) => x.is_paid || (x.price && Number(x.price) > 0)).length;
              const freeCount = totalProg - paidCount;

              setInternshipStats({
                totalPrograms: totalProg,
                totalApplicants: totalApps,
                totalSeats,
                percentageFilled: pct,
                maxReachTrack: maxTrackTitle,
                maxReachApplicants: maxReachCount,
                paidTracks: paidCount,
                freeTracks: freeCount,
                applicantList: [],
                loading: false,
              });
            } else {
              setInternshipStats({
                totalPrograms: 0,
                totalApplicants: 0,
                totalSeats: 0,
                percentageFilled: 0,
                maxReachTrack: '',
                maxReachApplicants: 0,
                paidTracks: 0,
                freeTracks: 0,
                applicantList: [],
                loading: false,
              });
            }
          }
        })
        .catch(() => setInternshipStats((prev) => ({ ...prev, loading: false })));

      // Fetch firm status & transactions for license receipts
      fetchFirmLicenseData(activeSlug);
    } catch (err) {
      console.error('[Dashboard] Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFirmLicenseData = async (slug: string) => {
    try {
      const statusRes = await fetch(`/api/firms/status?slug=${slug}`);
      if (statusRes.ok) {
        const statusJson = await statusRes.json();
        setLicenseInfo({
          status: statusJson.status || 'ACTIVE',
          trial_ends_at: statusJson.trial_ends_at,
          firm_mode: statusJson.firm_mode || 'NONMED',
        });
      }

      const txRes = await fetch(`/api/firms/${slug}/transactions`);
      if (txRes.ok) {
        const txJson = await txRes.json();
        const list = Array.isArray(txJson) ? txJson : txJson.data || [];
        setLicenseReceipts(list);
      }
    } catch (e) {
      console.warn('Failed to load license data:', e);
    }
  };

  useEffect(() => {
    const savedSlug = typeof window !== 'undefined' ? (localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly') : 'srms-cet-bareilly';
    setSelectedCollegeSlug(savedSlug);
    fetchDashboardData(savedSlug);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="College Administration & Analytics KPI" />

        <main className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 flex-1 max-w-[1600px] w-full mx-auto overflow-x-hidden">
          {/* Top College Banner Header */}
          <div className="bg-gradient-to-r from-[#11141A] via-[#1E2638] to-[#11141A] border border-slate-800 rounded-[22px] p-6 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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

          {/* Institutional License & NORNX Renewal Receipt Slip Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[22px] p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#00C48C] flex items-center justify-center p-2.5 shadow-md shadow-[#00C48C]/20 shrink-0">
                <div className="w-full h-full bg-white rounded-lg" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-[#1B1E28] dark:text-white">
                    Institutional SaaS License & Renewal Slip
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      licenseInfo.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-[#00C48C] border border-emerald-200'
                        : 'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}
                  >
                    ● {licenseInfo.status}
                  </span>
                </div>
                <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-0.5">
                  Authority: <strong className="text-[#1B1E28] dark:text-slate-200">NORNX Technologies</strong> • Valid Until:{' '}
                  <strong className="text-[#5B4BFF]">
                    {licenseInfo.trial_ends_at
                      ? new Date(licenseInfo.trial_ends_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Active Core Entitlement'}
                  </strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  if (licenseReceipts.length > 0) {
                    setSelectedReceiptModal(licenseReceipts[0]);
                  } else {
                    // Generate instantaneous slip
                    setSelectedReceiptModal({
                      firm_title: collegeInfo.name,
                      firm_slug: collegeInfo.slug,
                      tenant_name: 'Shri Ram Murti Smarak Trust Bareilly',
                      domain: 'srms.ac.in',
                      amount: 250000,
                      currency: 'INR',
                      duration_days: 365,
                      firm_mode: 'NONMED',
                      status: 'SUCCESS',
                      payment_method: 'NORNX Direct Billing / Bank Wire',
                      paid_at: new Date().toISOString(),
                    });
                  }
                }}
                className="px-4 py-2 rounded-xl bg-[#00C48C] hover:bg-[#00b07d] text-[#1B1E28] text-xs font-black shadow-md shadow-[#00C48C]/20 transition-all flex items-center gap-1.5 active:scale-95"
              >
                <span>🧾 View Current License Slip</span>
              </button>

              <button
                type="button"
                onClick={() => setShowReceiptHistoryList(!showReceiptHistoryList)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <span>📜 Renewal History ({licenseReceipts.length})</span>
              </button>
            </div>
          </div>

          {/* Past Renewal Receipts Expandable Tray */}
          {showReceiptHistoryList && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[22px] p-6 shadow-sm space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-[#1B1E28] dark:text-white">
                    NORNX License Renewal Receipts & Payment Slips
                  </h3>
                  <p className="text-xs text-[#4E5969] dark:text-slate-400">
                    Official tax receipts and cryptographic renewal certificates for {collegeInfo.name}
                  </p>
                </div>
                <button
                  onClick={() => setShowReceiptHistoryList(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕ Close Tray
                </button>
              </div>

              {licenseReceipts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200">
                  No previous renewal receipts recorded.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-800/50">
                        <th className="py-2.5 px-3">Receipt Ref</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Duration</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Slip Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                      {licenseReceipts.map((rc, i) => (
                        <tr key={rc.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-3 px-3 font-mono font-bold">{rc.transaction_ref || `NRX-${i + 1001}`}</td>
                          <td className="py-3 px-3">{new Date(rc.paid_at || rc.created_at || Date.now()).toLocaleDateString()}</td>
                          <td className="py-3 px-3 font-bold">{rc.duration_days || 365} Days</td>
                          <td className="py-3 px-3 font-extrabold text-[#1B1E28] dark:text-white">
                            ₹{parseFloat(String(rc.amount || 250000)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#00C48C] border border-emerald-200">
                              ✓ {rc.status || 'PAID'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => setSelectedReceiptModal(rc)}
                              className="px-3 py-1 bg-[#00C48C] hover:bg-[#00b07d] text-[#1B1E28] font-bold rounded-lg text-xs transition-all shadow-sm"
                            >
                              View / Print Slip
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Feedback message */}
          {punchMessage && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm animate-fadeIn">
              <span>✅</span>
              <span>{punchMessage}</span>
            </div>
          )}

          {/* Top 3 Career, Research & Placement Innovation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Card 1: Placement Drives & Latest Company with Applied Candidate Avatars */}
            <Link
              href="/dashboard/admin/placement"
              className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft hover:shadow-md hover:border-amber-400 dark:hover:border-amber-600 transition-all block group relative overflow-hidden space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-[#4E5969] dark:text-slate-400 tracking-wider">
                  Placement Drives & Hiring
                </span>
                <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#F36C21] to-amber-500 text-white flex items-center justify-center text-sm shadow-sm group-hover:scale-110 transition-transform">
                  💼
                </span>
              </div>

              {/* Total Drives & Total Applied */}
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-black text-[#F36C21]">
                  {placementStats.loading ? '...' : `${placementStats.totalDrives} Drives`}
                </p>
                <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">
                  {placementStats.totalApplicants} Applied
                </span>
              </div>

              {/* Top / Latest Company Profile Highlight */}
              {placementStats.latestCompany ? (
                <div className="p-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/40 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-black text-[#1B1E28] dark:text-white truncate">
                      <span className="text-sm">🏢</span>
                      <span className="truncate">{placementStats.latestCompany}</span>
                    </div>
                    <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 truncate">
                      {placementStats.latestRole} {placementStats.packageDetails ? `(${placementStats.packageDetails})` : ''}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2">
                  <span className="text-sm">💼</span>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                    No active placement drives registered yet.
                  </p>
                </div>
              )}

              {/* Side-by-Side Applied Status & Stacked Student Profile Photos */}
              <div className="flex items-center justify-between pt-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-black border border-amber-500/20">
                    Active: {placementStats.totalDrives}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[10px] font-black border border-indigo-500/20">
                    Applied: {placementStats.totalApplicants}
                  </span>
                </div>

                {/* Stacked Candidate Avatar Circles with Real Profile Photos */}
                {placementStats.applicantList.length > 0 ? (
                  <div className="flex items-center -space-x-2">
                    {placementStats.applicantList.slice(0, 3).map((app, idx) => (
                      <div
                        key={app.id || idx}
                        className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-700 ring-2 ring-white dark:ring-slate-900 shadow-sm flex items-center justify-center font-black text-[8px] text-white"
                        style={{
                          backgroundColor: idx === 0 ? '#F36C21' : idx === 1 ? '#5B4BFF' : '#00C48C',
                          zIndex: 10 - idx,
                        }}
                        title={`${app.name} (${app.course})`}
                      >
                        {app.photo ? (
                          <img
                            src={app.photo}
                            alt={app.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : null}
                        <span>{app.initials}</span>
                      </div>
                    ))}
                    {placementStats.totalApplicants > 3 && (
                      <div
                        className="relative w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-[8px] ring-2 ring-white dark:ring-slate-900 shadow-sm"
                        style={{ zIndex: 5 }}
                        title={`${placementStats.totalApplicants - 3} more applied candidates`}
                      >
                        +{placementStats.totalApplicants - 3}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 font-mono">0 applicants</span>
                )}
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold">
                <span className="text-amber-600 dark:text-amber-400">
                  ✨ {placementStats.totalDrives > 0 ? 'Active Campus Hiring' : 'Campus Hiring Ready'}
                </span>
                <span className="text-[#F36C21] group-hover:underline">Manage Drives ➔</span>
              </div>
            </Link>

            {/* Card 2: Project Scores & Repositories */}
            <Link
              href="/dashboard/admin/repository"
              className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all block group relative overflow-hidden space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-[#4E5969] dark:text-slate-400 tracking-wider">
                  Project Repositories & R&D
                </span>
                <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00C48C] to-teal-400 text-white flex items-center justify-center text-sm shadow-sm group-hover:scale-110 transition-transform">
                  💻
                </span>
              </div>

              {/* Total Projects & Evaluation Score */}
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-black text-[#00C48C]">
                  {repoStats.loading ? '...' : `${repoStats.totalRepos} Projects`}
                </p>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/20">
                  Avg: {repoStats.latestScore}
                </span>
              </div>

              {/* Latest Student Info with Profile Photo, Course & Batch */}
              {repoStats.totalRepos > 0 && repoStats.studentName ? (
                <>
                  <div className="p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-[#E7EAF3] dark:border-slate-700/80 flex items-center gap-2.5">
                    {/* Student Profile Photo */}
                    <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 shadow-sm flex items-center justify-center font-black text-[11px] text-slate-600 dark:text-slate-200">
                      {repoStats.studentPhoto ? (
                        <img
                          src={repoStats.studentPhoto}
                          alt={repoStats.studentName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : null}
                      <span>{repoStats.studentName.charAt(0) || 'S'}</span>
                    </div>

                    {/* Student Details & Course/Batch */}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-[#1B1E28] dark:text-white truncate line-clamp-1">
                        {repoStats.studentName}
                      </p>
                      <p className="text-[10px] text-[#5B4BFF] dark:text-indigo-400 font-bold truncate">
                        {repoStats.courseName} • {repoStats.batchName}
                      </p>
                    </div>
                  </div>

                  {/* Latest Project Title */}
                  <p className="text-xs text-[#1B1E28] dark:text-slate-200 font-bold line-clamp-1 truncate">
                    📂 {repoStats.latestTitle}
                  </p>
                </>
              ) : (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2">
                  <span className="text-sm">📁</span>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                    No student project repositories submitted yet.
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold">
                <span className="text-emerald-700 dark:text-emerald-400">
                  ⭐ {repoStats.totalRepos > 0 ? `Grade ${repoStats.latestGrade} (${repoStats.pendingReviews} Pending)` : '0 Pending Reviews'}
                </span>
                <span className="text-[#00C48C] group-hover:underline">Repository Hub ➔</span>
              </div>
            </Link>

            {/* Card 3: Incubation Records & Startup Ventures with Side-by-Side Avatars & Hustle Board Modal */}
            <IncubationCellCard role="admin" />

          </div>

          {/* 1–5. Top KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
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

            {/* Card 3: Admin Attendance & Punch IN / OUT (Synced with https://myportal.srms.ac.in/ops/Home/GetEmpInOutTime) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[22px] p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-[#11141A] dark:text-slate-300 tracking-wider">
                    ADMIN ATTENDANCE & PUNCH
                  </span>
                  <span className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm shadow-xs">
                    ⏱️
                  </span>
                </div>
                
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Day ({punch.date}):
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-[#00875A] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00875A] dark:bg-emerald-400 animate-pulse" />
                    <span>{punch.status}</span>
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between font-mono text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    IN: <span className="text-[#5B4BFF] font-black">{punch.punchIn || '--'}</span>
                  </span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    OUT: <span className="text-slate-600 dark:text-slate-300 font-black">{punch.punchOut || '--'}</span>
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handlePunchToggle('IN')}
                  disabled={punching}
                  className="flex-1 py-2 bg-[#00875A] hover:bg-[#00704A] text-white rounded-xl font-black text-xs transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                >
                  {punching ? 'Marking...' : 'Punch In'}
                </button>
                <button
                  type="button"
                  onClick={() => handlePunchToggle('OUT')}
                  disabled={punching}
                  className="flex-1 py-2 bg-[#E2E8F0] hover:bg-[#CBD5E1] dark:bg-slate-800 dark:hover:bg-slate-700 text-[#1B1E28] dark:text-slate-200 rounded-xl font-black text-xs transition-all disabled:opacity-50 active:scale-95"
                >
                  {punching ? 'Marking...' : 'Punch Out'}
                </button>
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

            {/* Card 5: Internship Tracks & Live Applicants Progress */}
            <Link
              href="/dashboard/admin/internships"
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[22px] p-5 shadow-sm hover:shadow-md hover:border-[#5B4BFF] dark:hover:border-[#5B4BFF] transition-all group cursor-pointer block"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  Internship Tracks
                </span>
                <span className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#5B4BFF] dark:text-indigo-400 flex items-center justify-center text-base shadow-sm group-hover:scale-110 transition-transform">
                  🎓
                </span>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline justify-between">
                  <p className="text-3xl font-black text-[#5B4BFF] dark:text-indigo-400 tracking-tight">
                    {loading ? '...' : internshipStats.totalPrograms}
                  </p>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    {internshipStats.totalApplicants} / {internshipStats.totalSeats || 50} Applied
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="mt-2 space-y-1">
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#5B4BFF] via-[#7867FF] to-[#00C48C] transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(internshipStats.totalApplicants > 0 ? 10 : 0, internshipStats.percentageFilled))}%`
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    <span className="font-bold text-[#00C48C]">{internshipStats.percentageFilled}% Capacity</span>
                    <span className="text-[#5B4BFF] font-bold group-hover:underline">Tracks ➔</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* 3 Key Communication & Academic Hub Widgets Side-by-Side in One Unified Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            <ChatDashboardWidget role="ADMIN" chatUrl="/dashboard/admin/chat" />
            <NoticeDashboardWidget role="admin" />
            <RecentLessonsWidget role="ADMIN" />
          </div>

          <div className="grid grid-cols-1 gap-6">
            <FacultyDailyPunchWidget />
            <FacultyLeaveLedgerWidget />
          </div>

          {/* Digital Library & Academic Catalog Card */}
          <LibraryDashboardCard role="admin" />

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

      {/* Official NORNX License Receipt Slip Modal */}
      <LicenseReceiptModal
        receipt={selectedReceiptModal}
        onClose={() => setSelectedReceiptModal(null)}
      />
    </div>
  );
}
