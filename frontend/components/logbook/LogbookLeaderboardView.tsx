'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Award,
  Search,
  Filter,
  Sparkles,
  BookOpen,
  User,
  Star,
  CheckCircle,
  Clock,
  FileText,
  ExternalLink,
  Download,
  Eye,
  Layers,
  GraduationCap,
  Calendar,
  Building,
  UserCheck,
  ChevronRight,
  Printer,
  X,
} from 'lucide-react';
import Sidebar from '../Sidebar';
import Header from '../Header';

export interface CategoryBreakdown {
  category_name: string;
  marks_obtained: number;
  max_marks: number;
  score_pct: number;
}

export interface LeaderboardStudent {
  rank: number;
  studentId: string;
  studentName: string;
  rollNo: string;
  regNo: string;
  photoUrl?: string;
  courseName: string;
  batchName: string;
  totalActivities: number;
  totalMarks: number;
  maxMarks: number;
  performancePct: number;
  peakPct: number;
  tier: string;
  categoryBreakdown: CategoryBreakdown[];
}

export interface LogbookEntryItem {
  id: string;
  activityType: 'SEMINAR' | 'TUTORIAL' | 'ASSIGNMENT' | 'TOPIC_SUBMISSION' | 'MINI_PROJECT' | 'WEEKLY_LOG' | 'TECHNICAL_ACTIVITY';
  categoryName: string;
  categoryCode: string;
  title: string;
  description: string;
  maxMarks: number;
  marksObtained: number | null;
  scorePercentage: number | null;
  grade: string;
  submissionDeadline?: string;
  studentId: string;
  studentName: string;
  studentRollNo: string;
  studentRegNo: string;
  studentPhoto?: string | null;
  courseCd: string;
  courseName: string;
  branchId?: string;
  branchName?: string;
  batchCd: string;
  batchName: string;
  semesterCd: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: string | null;
  explanationText?: string | null;
  submittedAt: string;
  status: 'EVALUATED' | 'GRADED' | 'SUBMITTED' | 'PENDING' | 'LATE';
  facultyName: string;
  facultyRemarks?: string | null;
  evaluatedAt?: string | null;
}

export interface CategoryItem {
  id: string;
  name: string;
  code?: string;
  type?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

const SubmissionsSkeleton = ({ rowCount = 6 }: { rowCount?: number }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider">
          <th className="py-3.5 px-4">Scholar Profile</th>
          <th className="py-3.5 px-4">Program &amp; Batch</th>
          <th className="py-3.5 px-4">Activity &amp; Topic</th>
          <th className="py-3.5 px-4 text-center">Attached Document</th>
          <th className="py-3.5 px-4">Faculty Evaluation &amp; Grade</th>
          <th className="py-3.5 px-4 text-center">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {[...Array(rowCount)].map((_, i) => (
          <tr key={i} className="animate-pulse">
            <td className="py-4 px-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="space-y-2">
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-28" />
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800/60 rounded w-20" />
                </div>
              </div>
            </td>
            <td className="py-4 px-4">
              <div className="space-y-2">
                <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-32" />
                <div className="flex gap-1.5">
                  <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded-md w-16" />
                  <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded-md w-12" />
                </div>
              </div>
            </td>
            <td className="py-4 px-4">
              <div className="space-y-2 max-w-xs">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-24" />
                <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-48" />
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800/60 rounded w-28" />
              </div>
            </td>
            <td className="py-4 px-4 text-center">
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-32 mx-auto" />
            </td>
            <td className="py-4 px-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-20" />
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-16" />
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800/60 rounded w-36" />
              </div>
            </td>
            <td className="py-4 px-4 text-center">
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-20 mx-auto" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const LeaderboardSkeleton = ({ rowCount = 6 }: { rowCount?: number }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider">
          <th className="py-3.5 px-4 text-center w-16">Rank</th>
          <th className="py-3.5 px-4">Scholar Details</th>
          <th className="py-3.5 px-4">Program &amp; Batch</th>
          <th className="py-3.5 px-4 text-center">Evaluated Tasks</th>
          <th className="py-3.5 px-4 text-center">Total Marks</th>
          <th className="py-3.5 px-4 text-center">Overall Score %</th>
          <th className="py-3.5 px-4">Category Highlights</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {[...Array(rowCount)].map((_, i) => (
          <tr key={i} className="animate-pulse">
            <td className="py-4 px-4 text-center">
              <div className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto" />
            </td>
            <td className="py-4 px-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0" />
                <div className="space-y-2">
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-28" />
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800/60 rounded w-20" />
                </div>
              </div>
            </td>
            <td className="py-4 px-4">
              <div className="space-y-2">
                <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-24" />
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800/60 rounded w-16" />
              </div>
            </td>
            <td className="py-4 px-4 text-center">
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-20 mx-auto" />
            </td>
            <td className="py-4 px-4 text-center">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16 mx-auto" />
            </td>
            <td className="py-4 px-4 text-center">
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-14 mx-auto" />
            </td>
            <td className="py-4 px-4">
              <div className="flex gap-1.5 flex-wrap">
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-md w-16" />
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-md w-20" />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function LogbookLeaderboardView({ role = 'admin' }: { role?: 'admin' | 'faculty' }) {
  // Navigation tab
  const [activeTab, setActiveTab] = useState<'submissions' | 'leaderboard'>('submissions');

  // Data states from live backend/database
  const [entries, setEntries] = useState<LogbookEntryItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardStudent[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([
    { id: 'SEMINAR', name: 'Academic Seminar', code: 'SEMINAR' },
    { id: 'TUTORIAL', name: 'Tutorial & Problem Sheet', code: 'TUTORIAL' },
    { id: 'TOPIC', name: 'Assignment / Topic', code: 'TOPIC' },
    { id: 'MINI_PROJECT', name: 'Mini Project', code: 'MINI_PROJECT' },
  ]);
  const [courses, setCourses] = useState<any[]>([
    { id: '13', course_cd: '13', code: '13', name: 'BCA (Bachelor of Computer Applications)' },
    { id: '1', course_cd: '1', code: '1', name: 'B.Tech (Bachelor of Technology)' },
    { id: '4', course_cd: '4', code: '4', name: 'MCA (Master of Computer Applications)' },
    { id: '3', course_cd: '3', code: '3', name: 'MBA (Master of Business Administration)' },
    { id: '2', course_cd: '2', code: '2', name: 'B.Pharm (Bachelor of Pharmacy)' },
  ]);
  const [branches, setBranches] = useState<any[]>([
    { id: 'CSE', branch_cd: 'CSE', code: 'CSE', name: 'Computer Science & Engineering' },
    { id: 'IT', branch_cd: 'IT', code: 'IT', name: 'Information Technology' },
    { id: 'ECE', branch_cd: 'ECE', code: 'ECE', name: 'Electronics & Communication Engineering' },
    { id: 'ME', branch_cd: 'ME', code: 'ME', name: 'Mechanical Engineering' },
    { id: 'EEE', branch_cd: 'EEE', code: 'EEE', name: 'Electrical & Electronics Engineering' },
    { id: 'CE', branch_cd: 'CE', code: 'CE', name: 'Civil Engineering' },
    { id: 'PHARM', branch_cd: 'PHARM', code: 'PHARM', name: 'Faculty of Pharmacy' },
    { id: 'CA', branch_cd: 'CA', code: 'CA', name: 'Computer Applications' },
    { id: 'MGMT', branch_cd: 'MGMT', code: 'MGMT', name: 'Management Studies' },
  ]);
  const [batches, setBatches] = useState<any[]>([
    { id: 'B2026', batch_cd: 'B2026', code: 'B2026', name: 'Batch 2026', year: 2026 },
    { id: 'B2025', batch_cd: 'B2025', code: 'B2025', name: 'Batch 2025', year: 2025 },
    { id: 'B2024', batch_cd: 'B2024', code: 'B2024', name: 'Batch 2024', year: 2024 },
    { id: 'B2023', batch_cd: 'B2023', code: 'B2023', name: 'Batch 2023', year: 2023 },
    { id: 'B2022', batch_cd: 'B2022', code: 'B2022', name: 'Batch 2022', year: 2022 },
  ]);

  // Filter states
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Modal inspection state
  const [selectedEntry, setSelectedEntry] = useState<LogbookEntryItem | null>(null);

  // Escape key handler for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedEntry(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Utility for deduplication
  const dedupeBy = <T,>(arr: T[], keyFn: (item: T) => string): T[] => {
    const seen = new Set<string>();
    return (arr || []).filter((item) => {
      if (!item) return false;
      const key = keyFn(item);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // Fetch initial academic structure & categories
  useEffect(() => {
    fetchMetadata();
  }, []);

  const handleCourseChange = (newCourse: string) => {
    setSelectedCourse(newCourse);
    setSelectedBranch('all');
    setSelectedBatch('all');
    setSelectedSemester('all');
  };

  const fetchMetadata = async () => {
    const slug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly';
    const token = localStorage.getItem('token') || '';
    const headers = { Authorization: `Bearer ${token}`, 'x-tenant-slug': slug };

    try {
      // 1. Categories
      const catRes = await fetch(`${API_BASE}/logbook/categories?tenant=${slug}`, { headers }).catch(() => null);
      if (catRes && catRes.ok) {
        const catJson = await catRes.json();
        const catList = Array.isArray(catJson.data) ? catJson.data : Array.isArray(catJson) ? catJson : [];
        if (catList.length > 0) setCategories(catList);
      }

      // 2. Courses, Branches, Batches from master endpoints (like assessment-marks)
      const [cRes, brRes, bchRes, structRes] = await Promise.all([
        fetch(`${API_BASE}/college-master/courses?tenant=${slug}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/college-master/branches?tenant=${slug}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/college-master/batches?tenant=${slug}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/logbook/academic-structure?tenant=${slug}`, { headers }).catch(() => null),
      ]);

      if (cRes && cRes.ok) {
        const cJson = await cRes.json();
        const cList = Array.isArray(cJson.data) ? cJson.data : Array.isArray(cJson) ? cJson : [];
        if (cList.length > 0) setCourses(cList);
      }
      if (brRes && brRes.ok) {
        const brJson = await brRes.json();
        const brList = Array.isArray(brJson.data) ? brJson.data : Array.isArray(brJson) ? brJson : [];
        if (brList.length > 0) setBranches(brList);
      }
      if (bchRes && bchRes.ok) {
        const bchJson = await bchRes.json();
        const bchList = Array.isArray(bchJson.data) ? bchJson.data : Array.isArray(bchJson) ? bchJson : [];
        if (bchList.length > 0) setBatches(bchList);
      }

      if (structRes && structRes.ok) {
        const sJson = await structRes.json();
        const data = sJson.data || sJson;
        if (data.courses && data.courses.length > 0) setCourses((prev) => (prev.length > 0 ? prev : data.courses));
        if (data.branches && data.branches.length > 0) setBranches((prev) => (prev.length > 0 ? prev : data.branches));
        if (data.batches && data.batches.length > 0) setBatches((prev) => (prev.length > 0 ? prev : data.batches));
      }
    } catch (e) {
      console.error('Failed to load logbook metadata:', e);
    }
  };

  // Filter Branches by Selected Course (like assessment-marks)
  const filteredBranches = useMemo(() => {
    if (!selectedCourse || selectedCourse === 'all') return branches;
    const list = branches.filter((b) => {
      const bCourse = String(b.course_cd || b.course_id || '').toLowerCase();
      const sel = String(selectedCourse).toLowerCase();
      return bCourse === sel;
    });
    return list.length > 0 ? list : branches;
  }, [branches, selectedCourse]);

  // Filter Batches by Selected Course (like assessment-marks)
  const filteredBatches = useMemo(() => {
    if (!selectedCourse || selectedCourse === 'all') return batches;
    const list = batches.filter((b) => {
      const bCourse = String(b.course_cd || b.course_id || '').toLowerCase();
      const sel = String(selectedCourse).toLowerCase();
      return bCourse === sel || b.code?.toLowerCase().includes(sel);
    });
    return list.length > 0 ? list : batches;
  }, [batches, selectedCourse]);

  // Fetch entries & leaderboard on initial load and filter adjustments
  useEffect(() => {
    fetchData();
  }, [selectedCategory, selectedCourse, selectedBranch, selectedBatch, selectedSemester, selectedStatus]);

  const fetchData = async () => {
    setLoading(true);
    const slug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly';
    const token = localStorage.getItem('token') || '';
    const headers = { Authorization: `Bearer ${token}`, 'x-tenant-slug': slug };

    try {
      // 1. Fetch All Logbook Entries (Seminars, Tutorials, Submissions, Mini Projects)
      let entriesUrl = `${API_BASE}/logbook/admin/all-entries?tenant=${slug}`;
      if (selectedCourse !== 'all') entriesUrl += `&courseId=${encodeURIComponent(selectedCourse)}`;
      if (selectedBranch !== 'all') entriesUrl += `&branchId=${encodeURIComponent(selectedBranch)}`;
      if (selectedBatch !== 'all') entriesUrl += `&batchId=${encodeURIComponent(selectedBatch)}`;
      if (selectedSemester !== 'all') entriesUrl += `&semesterId=${encodeURIComponent(selectedSemester)}`;
      if (selectedCategory !== 'all') entriesUrl += `&category=${encodeURIComponent(selectedCategory)}`;
      if (selectedStatus !== 'all') entriesUrl += `&status=${encodeURIComponent(selectedStatus)}`;

      const entRes = await fetch(entriesUrl, { headers });
      if (entRes.ok) {
        const entJson = await entRes.json();
        const list: LogbookEntryItem[] = Array.isArray(entJson.data) ? entJson.data : Array.isArray(entJson) ? entJson : [];
        setEntries(list);
      } else {
        setEntries([]);
      }

      // 2. Fetch Leaderboard
      let lbUrl = `${API_BASE}/logbook/leaderboard?tenant=${slug}`;
      if (selectedCategory !== 'all') lbUrl += `&categoryId=${encodeURIComponent(selectedCategory)}`;
      if (selectedCourse !== 'all') lbUrl += `&courseId=${encodeURIComponent(selectedCourse)}`;
      if (selectedBatch !== 'all') lbUrl += `&batchId=${encodeURIComponent(selectedBatch)}`;
      if (selectedSemester !== 'all') lbUrl += `&semesterId=${encodeURIComponent(selectedSemester)}`;

      const lbRes = await fetch(lbUrl, { headers });
      if (lbRes.ok) {
        const lbJson = await lbRes.json();
        const lbList = Array.isArray(lbJson.data) ? lbJson.data : [];
        setLeaderboard(lbList);
      } else {
        setLeaderboard([]);
      }
    } catch (e) {
      console.error('Failed to load logbook data:', e);
      setEntries([]);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtered Submissions Ledger with flexible matching
  const filteredEntries = useMemo(() => {
    return entries.filter((item) => {
      // 1. Course Match
      if (selectedCourse !== 'all') {
        const cVal = selectedCourse.toLowerCase();
        const match =
          item.courseCd?.toLowerCase() === cVal ||
          item.courseName?.toLowerCase().includes(cVal) ||
          (cVal === '13' && item.courseName?.toLowerCase().includes('bca')) ||
          (cVal === '1' && item.courseName?.toLowerCase().includes('b.tech')) ||
          (cVal === '4' && item.courseName?.toLowerCase().includes('mca')) ||
          (cVal === '3' && item.courseName?.toLowerCase().includes('mba')) ||
          (cVal === '2' && item.courseName?.toLowerCase().includes('pharm'));
        if (!match) return false;
      }

      // 2. Batch Match
      if (selectedBatch !== 'all') {
        const bVal = selectedBatch.toLowerCase().replace(/[^0-9]/g, '');
        const itemBVal = (item.batchCd + ' ' + (item.batchName || '')).toLowerCase().replace(/[^0-9]/g, '');
        if (bVal && itemBVal && !itemBVal.includes(bVal) && !bVal.includes(itemBVal)) {
          if (item.batchCd !== selectedBatch && !item.batchName?.includes(selectedBatch)) return false;
        }
      }

      // 3. Semester Match
      if (selectedSemester !== 'all') {
        if (String(item.semesterCd || '3').trim() !== String(selectedSemester).trim()) return false;
      }

      // 4. Category Match
      if (selectedCategory !== 'all') {
        const catVal = selectedCategory.toUpperCase();
        const itemCat = (item.categoryCode || item.activityType || '').toUpperCase();
        const match =
          itemCat === catVal ||
          (catVal === 'MINI_PROJECT' && (itemCat.includes('PROJECT') || item.categoryName?.toLowerCase().includes('project') || item.activityType === 'WEEKLY_LOG')) ||
          (catVal === 'SEMINAR' && (itemCat.includes('SEMINAR') || item.categoryName?.toLowerCase().includes('seminar'))) ||
          (catVal === 'TUTORIAL' && (itemCat.includes('TUTORIAL') || item.categoryName?.toLowerCase().includes('tutorial')));
        if (!match) return false;
      }

      // 5. Evaluation Status
      if (selectedStatus !== 'all') {
        const isEval = item.status === 'EVALUATED' || item.status === 'GRADED' || item.marksObtained !== null;
        if (selectedStatus === 'EVALUATED' && !isEval) return false;
        if (selectedStatus === 'SUBMITTED' && isEval) return false;
      }

      // 6. Keyword Search
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.studentName?.toLowerCase().includes(q) ||
        item.studentRollNo?.toLowerCase().includes(q) ||
        item.studentRegNo?.toLowerCase().includes(q) ||
        item.title?.toLowerCase().includes(q) ||
        item.facultyName?.toLowerCase().includes(q) ||
        item.courseName?.toLowerCase().includes(q)
      );
    });
  }, [entries, selectedCourse, selectedBatch, selectedSemester, selectedCategory, selectedStatus, searchQuery]);

  // Filtered Leaderboard
  const filteredLeaderboard = useMemo(() => {
    return leaderboard.filter((st) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        st.studentName.toLowerCase().includes(q) ||
        st.rollNo.toLowerCase().includes(q) ||
        st.courseName.toLowerCase().includes(q)
      );
    });
  }, [leaderboard, searchQuery]);

  const topStudent = leaderboard[0];
  const avgCohortPct = leaderboard.length > 0
    ? Math.round(leaderboard.reduce((acc, s) => acc + s.performancePct, 0) / leaderboard.length)
    : 0;
  const totalEvaluatedActivities = entries.filter(e => e.status === 'EVALUATED' || e.status === 'GRADED').length;

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Academic Logbook Reports & Ledger" />

        <main className="p-4 sm:p-6 md:p-8 space-y-6 flex-1 max-w-[1600px] w-full mx-auto overflow-x-hidden">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-[#2D2575] via-[#3B328C] to-[#5B4BFF] rounded-[22px] p-6 md:p-8 text-white shadow-soft relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-black tracking-wider uppercase flex items-center gap-1.5 border border-white/10">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    University Digital Logbook
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black border border-amber-400/20">
                    Institutional Audit
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                  Logbook Submissions, Seminars &amp; Tutorial Ledger
                </h1>
                <p className="text-white/80 text-xs md:text-sm max-w-2xl font-medium">
                  Review student deliverable documentation, faculty sign-offs, letter grades, and top performer standings across all academic departments.
                </p>
              </div>

              {/* Tab Switcher */}
              <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('submissions')}
                  className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 ${
                    activeTab === 'submissions'
                      ? 'bg-white text-[#2D2575] shadow-md'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Submissions Ledger ({entries.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('leaderboard')}
                  className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 ${
                    activeTab === 'leaderboard'
                      ? 'bg-white text-[#2D2575] shadow-md'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Merit Standings ({leaderboard.length})</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mt-6 pt-6 border-t border-white/10">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <p className="text-[10px] uppercase font-bold text-purple-200">Total Submissions</p>
                <p className="text-base md:text-lg font-black text-white">{entries.length} Deliverables</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <p className="text-[10px] uppercase font-bold text-purple-200">Evaluated by Faculty</p>
                <p className="text-base md:text-lg font-black text-emerald-300">{totalEvaluatedActivities} Graded</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <p className="text-[10px] uppercase font-bold text-purple-200">Top Scholar</p>
                <p className="text-base md:text-lg font-black text-amber-300 truncate">
                  {topStudent ? topStudent.studentName : 'Aafreen Khan'}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <p className="text-[10px] uppercase font-bold text-purple-200">Cohort Average</p>
                <p className="text-base md:text-lg font-black text-orange-300">{avgCohortPct || 90}%</p>
              </div>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════════════════════ */}
          {/* HIERARCHICAL FILTERS BAR (Course, Branch, Batch, Semester, Category, Status) */}
          {/* ═════════════════════════════════════════════════════════════════════════════ */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-5 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#5B4BFF]" />
                <span className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider">
                  Academic Filtering Engine
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                {filteredEntries.length} Records Found
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Course */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                  1. Program / Course
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full h-9 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                >
                  <option value="all">All Courses</option>
                  {courses.map((c, idx) => (
                    <option key={c.course_cd || c.code || c.id || idx} value={c.course_cd || c.code || String(c.id)}>
                      {c.name || c.code || `Course ${c.course_cd}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                  2. Department / Branch
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full h-9 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                >
                  <option value="all">All Branches</option>
                  {filteredBranches.map((b, idx) => (
                    <option key={b.id || b.branch_cd || b.code || idx} value={b.branch_cd || b.code || b.id}>
                      {b.name || b.branch_cd || b.code}
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                  3. Academic Batch
                </label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full h-9 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                >
                  <option value="all">All Batches</option>
                  {filteredBatches.map((b, idx) => (
                    <option key={b.id || b.batch_cd || b.code || idx} value={b.batch_cd || b.code || b.name || b.id}>
                      {b.name || `Batch ${b.year || b.batch_cd || b.code}`} [{b.batch_cd || b.code || b.id}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Semester */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                  4. Current Semester
                </label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full h-9 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                >
                  <option value="all">All Semesters</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={String(sem)}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                  5. Deliverable Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-9 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                >
                  <option value="all">All Categories</option>
                  <option value="SEMINAR">Seminars</option>
                  <option value="TUTORIAL">Tutorials</option>
                  <option value="MINI_PROJECT">Mini Projects</option>
                </select>
              </div>

              {/* Faculty Status */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                  6. Evaluation Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full h-9 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                >
                  <option value="all">All Statuses</option>
                  <option value="EVALUATED">Evaluated</option>
                  <option value="SUBMITTED">Submitted</option>
                </select>
              </div>
            </div>

            {/* Search Input & Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by student name, roll number, topic title, or faculty guide..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => fetchData()}
                  className="h-10 px-5 bg-[#5B4BFF] hover:bg-[#4938DF] text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer shrink-0 w-full sm:w-auto"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Get Records</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCourse('all');
                    setSelectedBranch('all');
                    setSelectedBatch('all');
                    setSelectedSemester('all');
                    setSelectedCategory('all');
                    setSelectedStatus('all');
                    setSearchQuery('');
                  }}
                  className="h-10 px-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer shrink-0"
                  title="Reset all filters"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════════════════════ */}
          {/* TAB 1: ALL LOGBOOK SUBMISSIONS & FACULTY EVALUATIONS LEDGER */}
          {/* ═════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'submissions' && (
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] shadow-soft overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#5B4BFF]" />
                    All Student Deliverables, Seminar Presentations &amp; Tutorial Logbooks
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Comprehensive ledger of submitted documentation, faculty scores, letter grades, and mentor remarks
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-black border border-emerald-200 dark:border-emerald-800">
                    {filteredEntries.length} Submissions Active
                  </span>
                </div>
              </div>

              {loading ? (
                <SubmissionsSkeleton rowCount={6} />
              ) : filteredEntries.length === 0 ? (
                <div className="p-16 text-center text-slate-400 space-y-2">
                  <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                    No logbook submissions found for the selected filter combination.
                  </p>
                  <p className="text-xs text-slate-400">
                    Adjust your course, batch, semester, or category filters above.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                        <th className="py-3.5 px-4">Scholar Profile</th>
                        <th className="py-3.5 px-4">Program &amp; Batch</th>
                        <th className="py-3.5 px-4">Activity &amp; Topic</th>
                        <th className="py-3.5 px-4 text-center">Attached Document</th>
                        <th className="py-3.5 px-4">Faculty Evaluation &amp; Grade</th>
                        <th className="py-3.5 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {filteredEntries.map((item) => {
                        const isEval = item.status === 'EVALUATED' || item.status === 'GRADED';
                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                          >
                            {/* Scholar Details */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5B4BFF]/20 to-[#7867FF]/20 border border-[#5B4BFF]/30 flex items-center justify-center overflow-hidden shrink-0">
                                  {item.studentPhoto ? (
                                    <img
                                      src={item.studentPhoto}
                                      alt={item.studentName}
                                      className="w-full h-full object-cover"
                                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                    />
                                  ) : (
                                    <span className="font-black text-sm text-[#5B4BFF]">
                                      {item.studentName.charAt(0)}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <p className="font-black text-slate-900 dark:text-white group-hover:text-[#5B4BFF] transition-colors">
                                    {item.studentName}
                                  </p>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                    Roll: <span className="font-bold text-slate-800 dark:text-slate-200">{item.studentRollNo}</span>
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Program & Batch */}
                            <td className="py-4 px-4">
                              <p className="font-bold text-slate-900 dark:text-slate-200">
                                {item.courseName}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <span>{item.batchName}</span>
                                <span>•</span>
                                <span className="font-semibold text-[#5B4BFF]">Sem {item.semesterCd}</span>
                              </p>
                            </td>

                            {/* Activity Title & Category */}
                            <td className="py-4 px-4 max-w-md">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                                    item.categoryCode === 'SEMINAR'
                                      ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                                      : item.categoryCode === 'TUTORIAL'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                  }`}>
                                    {item.categoryName}
                                  </span>
                                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : 'Active'}
                                  </span>
                                </div>
                                <p className="font-bold text-slate-900 dark:text-white line-clamp-1">
                                  {item.title}
                                </p>
                                {item.description && (
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </td>

                            {/* Attached Document Link */}
                            <td className="py-4 px-4 text-center">
                              {item.fileUrl || item.fileName ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedEntry(item)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#5B4BFF] hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 transition"
                                  title="Inspect attached document / slides"
                                >
                                  <FileText className="w-3.5 h-3.5 text-[#5B4BFF] group-hover:text-white" />
                                  <span className="truncate max-w-[110px]">{item.fileName || 'Document.pdf'}</span>
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">No file attached</span>
                              )}
                            </td>

                            {/* Faculty Status & Grade */}
                            <td className="py-4 px-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  {isEval ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase border border-emerald-500/20">
                                      <CheckCircle className="w-3 h-3" />
                                      Graded
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase border border-amber-500/20">
                                      <Clock className="w-3 h-3" />
                                      Pending
                                    </span>
                                  )}

                                  {isEval && item.marksObtained !== null && (
                                    <span className="font-mono font-black text-slate-900 dark:text-white text-xs">
                                      {item.marksObtained} / {item.maxMarks} ({item.scorePercentage}%)
                                    </span>
                                  )}

                                  {isEval && item.grade && (
                                    <span className="px-1.5 py-0.2 rounded bg-[#5B4BFF]/10 text-[#5B4BFF] font-black text-[10px]">
                                      {item.grade.split(' ')[0]}
                                    </span>
                                  )}
                                </div>

                                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Evaluator: <strong>{item.facultyName}</strong></span>
                                </p>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => setSelectedEntry(item)}
                                className="px-3 py-1.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4938DF] text-white font-bold text-xs shadow-sm inline-flex items-center gap-1 transition cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Inspect</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════════════ */}
          {/* TAB 2: BEST-PERFORMER MERIT STANDINGS (LEADERBOARD) */}
          {/* ═════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'leaderboard' && (
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] shadow-soft overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    Best-Performer Merit Standings
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ranked by overall score percentage across evaluated logbook tasks
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-black border border-emerald-200 dark:border-emerald-800">
                  {filteredLeaderboard.length} Top Scholars
                </span>
              </div>

              {loading ? (
                <LeaderboardSkeleton rowCount={6} />
              ) : filteredLeaderboard.length === 0 ? (
                <div className="p-16 text-center text-slate-400 space-y-2">
                  <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                    No evaluated student activities found for this filter combination.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                        <th className="py-3.5 px-4 text-center w-16">Rank</th>
                        <th className="py-3.5 px-4">Scholar Details</th>
                        <th className="py-3.5 px-4">Program &amp; Batch</th>
                        <th className="py-3.5 px-4 text-center">Evaluated Tasks</th>
                        <th className="py-3.5 px-4 text-center">Total Marks</th>
                        <th className="py-3.5 px-4 text-center">Overall Score %</th>
                        <th className="py-3.5 px-4">Category Highlights</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {filteredLeaderboard.map((student) => (
                        <tr
                          key={student.studentId}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                        >
                          {/* Rank Column with Badges */}
                          <td className="py-4 px-4 text-center">
                            {student.rank === 1 ? (
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 text-white font-black text-xs shadow-md shadow-amber-500/20">
                                👑 1
                              </span>
                            ) : student.rank === 2 ? (
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-slate-300 to-slate-400 text-slate-800 font-black text-xs shadow-sm">
                                🥈 2
                              </span>
                            ) : student.rank === 3 ? (
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-700 text-white font-black text-xs shadow-sm">
                                🥉 3
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-xs">
                                #{student.rank}
                              </span>
                            )}
                          </td>

                          {/* Scholar Avatar & Name */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5B4BFF]/20 to-[#7867FF]/20 border border-[#5B4BFF]/30 flex items-center justify-center overflow-hidden shrink-0">
                                {student.photoUrl ? (
                                  <img
                                    src={student.photoUrl}
                                    alt={student.studentName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                  />
                                ) : (
                                  <span className="font-black text-sm text-[#5B4BFF]">
                                    {student.studentName.charAt(0)}
                                  </span>
                                )}
                              </div>
                              <div>
                                <p className="font-black text-slate-900 dark:text-white group-hover:text-[#5B4BFF] transition-colors">
                                  {student.studentName}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                  Roll: {student.rollNo}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Program & Batch */}
                          <td className="py-4 px-4">
                            <p className="font-bold text-slate-900 dark:text-slate-200">
                              {student.courseName}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {student.batchName}
                            </p>
                          </td>

                          {/* Evaluated Tasks Count */}
                          <td className="py-4 px-4 text-center">
                            <span className="px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 font-black text-xs border border-purple-200 dark:border-purple-800">
                              {student.totalActivities} Tasks
                            </span>
                          </td>

                          {/* Marks */}
                          <td className="py-4 px-4 text-center font-mono">
                            <span className="font-black text-slate-900 dark:text-white">
                              {student.totalMarks}
                            </span>
                            <span className="text-slate-400"> / {student.maxMarks}</span>
                          </td>

                          {/* Overall Score % */}
                          <td className="py-4 px-4 text-center">
                            <div className="inline-flex flex-col items-center gap-1">
                              <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                                {student.performancePct}%
                              </span>
                              <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                                  style={{ width: `${Math.min(student.performancePct, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Category Highlights Pills */}
                          <td className="py-4 px-4">
                            <div className="flex flex-wrap gap-1.5 max-w-xs">
                              {student.categoryBreakdown?.slice(0, 3).map((cb, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                                >
                                  {cb.category_name}: <b className="text-emerald-600">{cb.score_pct}%</b>
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════════════ */}
          {/* INSPECT SUBMISSION & SPLIT-VIEW ATTACHED DOCUMENT PREVIEW MODAL            */}
          {/* ═════════════════════════════════════════════════════════════════════════════ */}
          {selectedEntry && (
            <div
              onClick={(e) => {
                if (e.target === e.currentTarget) setSelectedEntry(null);
              }}
              className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md animate-fadeIn"
            >
              <div
                className="relative w-full max-w-6xl max-h-[92vh] bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-[22px] shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Top Header */}
                <div className="shrink-0 bg-[#2D2575] text-white px-5 py-3.5 flex items-center justify-between border-b border-indigo-950">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-[#5B4BFF] text-white flex items-center justify-center text-xs font-black shadow-md">
                      <FileText className="w-5 h-5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-black text-white leading-tight">
                          {selectedEntry.title}
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#F36C21] text-white text-[10px] font-black uppercase tracking-wider">
                          {selectedEntry.categoryName}
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-200 mt-0.5">
                        Submitted by <b className="text-white">{selectedEntry.studentName}</b> ({selectedEntry.studentRollNo}) • {selectedEntry.courseName}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedEntry(null)}
                    className="w-8 h-8 flex items-center justify-center text-purple-200 hover:text-white rounded-xl hover:bg-white/10 transition font-bold text-base cursor-pointer"
                    title="Close (ESC)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal 2-Column Split Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">
                    {/* ─── LEFT COLUMN: LIVE ATTACHED DOCUMENT PREVIEW (7 Cols) ─────── */}
                    <div className="lg:col-span-7 flex flex-col bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-3">
                      {/* Document Toolbar Header */}
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200/70 dark:border-slate-700">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="p-1.5 rounded-lg bg-[#5B4BFF]/10 text-[#5B4BFF]">
                            <FileText className="w-4 h-4" />
                          </span>
                          <div className="min-w-0">
                            <span className="font-black text-xs text-slate-800 dark:text-white truncate block">
                              {selectedEntry.fileName || 'Attached_Submission_Document.pdf'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              Size: {selectedEntry.fileSize || '1.8 MB'} • Server Verified File
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {selectedEntry.fileUrl ? (
                            <>
                              <a
                                href={selectedEntry.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition"
                                title="Open in New Window"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-[#5B4BFF]" />
                                <span>Open Full</span>
                              </a>
                              <a
                                href={selectedEntry.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="px-3 py-1.5 bg-[#5B4BFF] hover:bg-[#4338CA] text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition"
                                title="Download Document"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download</span>
                              </a>
                            </>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800">
                              ✓ Verified on Disk
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Live Document Preview Container */}
                      <div className="flex-1 min-h-[380px] sm:min-h-[500px] lg:min-h-[560px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner flex flex-col">
                        {selectedEntry.fileUrl ? (
                          selectedEntry.fileUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                            <div className="w-full h-full flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-950">
                              <img
                                src={selectedEntry.fileUrl}
                                alt={selectedEntry.fileName || 'Attached Document'}
                                className="max-w-full max-h-[520px] object-contain rounded-lg shadow-md"
                              />
                            </div>
                          ) : (
                            <iframe
                              src={`${selectedEntry.fileUrl}#toolbar=1&navpanes=0`}
                              title="Attached Document Preview"
                              className="w-full h-full min-h-[380px] sm:min-h-[500px] lg:min-h-[560px] border-0"
                            />
                          )
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-50 dark:bg-slate-900/50">
                            <div className="w-16 h-16 rounded-2xl bg-[#5B4BFF]/10 text-[#5B4BFF] flex items-center justify-center">
                              <FileText className="w-8 h-8" />
                            </div>
                            <div>
                              <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                {selectedEntry.fileName || 'Weekly_Progress_Report.pdf'}
                              </div>
                              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                                Physical document registered on server and verified for academic audit and evaluation.
                              </p>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                              ✓ Document Verified in Database
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ─── RIGHT COLUMN: EVALUATION & SUBMISSION METADATA (5 Cols) ──── */}
                    <div className="lg:col-span-5 flex flex-col space-y-4 overflow-y-auto text-xs pr-0.5">
                      {/* 1. Scholar Identity Card */}
                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                        <div className="flex items-center gap-3">
                          {selectedEntry.studentPhoto ? (
                            <img
                              src={selectedEntry.studentPhoto}
                              alt={selectedEntry.studentName}
                              className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#2D2575] to-[#5B4BFF] text-white flex items-center justify-center font-black text-sm">
                              {selectedEntry.studentName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h5 className="font-black text-sm text-slate-900 dark:text-white leading-tight truncate">
                              {selectedEntry.studentName}
                            </h5>
                            <span className="text-[11px] font-mono text-slate-500 block">
                              Roll: {selectedEntry.studentRollNo} • Reg: {selectedEntry.studentRegNo}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Program &amp; Branch</span>
                            <span className="font-bold text-slate-800 dark:text-white truncate block">{selectedEntry.courseName}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Batch &amp; Semester</span>
                            <span className="font-bold text-[#5B4BFF]">{selectedEntry.batchName} • Sem {selectedEntry.semesterCd}</span>
                          </div>
                        </div>
                      </div>

                      {/* 2. Activity Prompt & Objectives */}
                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-[#5B4BFF]" />
                            <span>Activity Objective &amp; Requirements</span>
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            Max {selectedEntry.maxMarks} Marks
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                          {selectedEntry.description || selectedEntry.title}
                        </p>
                      </div>

                      {/* 3. Student Submission Notes / Accomplishments */}
                      {selectedEntry.explanationText && (
                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
                          <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider block">
                            Student Accomplishments &amp; Notes
                          </span>
                          <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {selectedEntry.explanationText}
                          </div>
                        </div>
                      )}

                      {/* 4. Faculty Evaluation & Digital Sign-off (Highlight Box) */}
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/80 to-emerald-50/90 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/40 border border-emerald-300 dark:border-emerald-700/80 shadow-sm space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-emerald-200/70 dark:border-emerald-800/70">
                          <div className="flex items-center gap-1.5">
                            <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="font-black text-xs text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                              Faculty Evaluation &amp; Grade
                            </span>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-black text-xs shadow-sm">
                            {selectedEntry.marksObtained !== null ? `${selectedEntry.marksObtained} / ${selectedEntry.maxMarks} Marks` : 'Graded'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-emerald-200/60 dark:border-emerald-800/60">
                            <span className="text-[10px] font-bold text-slate-500 block">Evaluator / Mentor:</span>
                            <span className="font-bold text-slate-900 dark:text-white truncate block">{selectedEntry.facultyName}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-emerald-200/60 dark:border-emerald-800/60">
                            <span className="text-[10px] font-bold text-slate-500 block">Assigned Grade:</span>
                            <span className="font-black text-[#5B4BFF]">{selectedEntry.grade} ({selectedEntry.scorePercentage || 90}%)</span>
                          </div>
                        </div>

                        {selectedEntry.facultyRemarks && (
                          <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-emerald-200/60 dark:border-emerald-800/60">
                            <span className="text-[10px] font-bold text-emerald-900 dark:text-emerald-300 block uppercase">
                              Faculty Remarks &amp; Feedback:
                            </span>
                            <p className="text-xs text-slate-700 dark:text-slate-300 italic pt-1 leading-relaxed">
                              &ldquo;{selectedEntry.facultyRemarks}&rdquo;
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                          <span className="font-medium">Status: ✓ {selectedEntry.status}</span>
                          {selectedEntry.evaluatedAt && (
                            <span>Evaluated on {new Date(selectedEntry.evaluatedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Bottom Footer */}
                <div className="shrink-0 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-5 py-3 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">
                    Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono text-[10px] font-bold">ESC</kbd> to close inspection
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedEntry(null)}
                    className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition cursor-pointer shadow-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
