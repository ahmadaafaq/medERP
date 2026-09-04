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
  CheckCircle2,
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
  Presentation,
  FlaskConical,
  FolderGit2,
  FolderOpen,
  ShieldCheck,
  Activity,
  TrendingUp,
  BarChart3,
  ChevronDown,
} from 'lucide-react';
import Sidebar from '../Sidebar';
import Header from '../Header';
import DocumentPreviewModal from './DocumentPreviewModal';

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
  activityType: 'SEMINAR' | 'TUTORIAL' | 'ASSIGNMENT' | 'TOPIC_SUBMISSION' | 'MINI_PROJECT' | 'WEEKLY_LOG' | 'TECHNICAL_ACTIVITY' | 'PRACTICAL';
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

export interface StudentPortfolioSummary {
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
  totalActivities: number;
  evaluatedCount: number;
  pendingCount: number;
  totalMarksObtained: number;
  totalMaxMarks: number;
  overallPercentage: number;
  overallGrade: string;
  seminars: LogbookEntryItem[];
  tutorials: LogbookEntryItem[];
  miniProjects: LogbookEntryItem[];
  practicals: LogbookEntryItem[];
  assignments: LogbookEntryItem[];
  allEntries: LogbookEntryItem[];
}

export interface CategoryItem {
  id: string;
  name: string;
  code?: string;
  type?: string;
}

interface College {
  id: string;
  code: string;
  name: string;
  slug: string;
}

const COURSE_NAME_MAP: Record<string, string> = {
  '1': 'B.Tech (Bachelor of Technology)',
  '2': 'B.Pharm (Bachelor of Pharmacy)',
  '3': 'MBA (Master of Business Administration)',
  '4': 'MCA (Master of Computer Applications)',
  '5': 'M.Tech (Master of Technology)',
  '6': 'M.Pharm (Master of Pharmacy)',
  '7': 'BBA (Bachelor of Business Administration)',
  '8': 'B.Sc (Bachelor of Science)',
  '9': 'B.Com (Bachelor of Commerce)',
  '10': 'M.Sc (Master of Science)',
  '11': 'Diploma (Polytechnic)',
  '12': 'B.Sc Nursing',
  '13': 'BCA (Bachelor of Computer Applications)',
  '14': 'MCA (Master of Computer Applications)',
  '15': 'MBA (Master of Business Administration)',
  '16': 'MBBS (Bachelor of Medicine, Bachelor of Surgery)',
  'MBBS': 'MBBS (Bachelor of Medicine, Bachelor of Surgery)',
  'BCA': 'BCA (Bachelor of Computer Applications)',
  'BTECH': 'B.Tech (Bachelor of Technology)',
  'MCA': 'MCA (Master of Computer Applications)',
  'MBA': 'MBA (Master of Business Administration)',
  'BBA': 'BBA (Bachelor of Business Administration)',
  'BPHARM': 'B.Pharm (Bachelor of Pharmacy)',
  'MPHARM': 'M.Pharm (Master of Pharmacy)',
  'MTECH': 'M.Tech (Master of Technology)',
};

const getCourseDisplayName = (c: any): string => {
  if (!c) return 'BCA';
  const cd = String(c?.course_cd || c?.code || c?.id || '').trim();
  const rawName = String(c?.course_name || c?.name || c?.crs_name || c?.crsdesc || c?.title || '').trim();
  
  if (rawName && !/^course\s*\d+$/i.test(rawName) && rawName !== '-' && rawName !== 'null') {
    return rawName;
  }
  
  if (cd && COURSE_NAME_MAP[cd]) {
    return COURSE_NAME_MAP[cd];
  }
  const cleanCode = cd.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleanCode && COURSE_NAME_MAP[cleanCode]) {
    return COURSE_NAME_MAP[cleanCode];
  }

  return rawName || `Course ${cd}`;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

const getInitialTenantSlug = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly';
  }
  return 'srms-cet-bareilly';
};

const getInitialColgCd = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('colg_cd') || '1';
  }
  return '1';
};

const PortfolioSkeleton = ({ rowCount = 5 }: { rowCount?: number }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider">
          <th className="py-3.5 px-4">Scholar Details</th>
          <th className="py-3.5 px-4">Program &amp; Batch</th>
          <th className="py-3.5 px-4 text-center">Seminars</th>
          <th className="py-3.5 px-4 text-center">Tutorials</th>
          <th className="py-3.5 px-4 text-center">Mini Project &amp; Milestones</th>
          <th className="py-3.5 px-4 text-center">Cumulative Grade</th>
          <th className="py-3.5 px-4 text-right">Portfolio Action</th>
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
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800/60 rounded w-16" />
              </div>
            </td>
            <td className="py-4 px-4 text-center">
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-16 mx-auto" />
            </td>
            <td className="py-4 px-4 text-center">
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-16 mx-auto" />
            </td>
            <td className="py-4 px-4 text-center">
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-24 mx-auto" />
            </td>
            <td className="py-4 px-4 text-center">
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-20 mx-auto" />
            </td>
            <td className="py-4 px-4 text-right">
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-28 ml-auto" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function LogbookLeaderboardView({ role = 'admin' }: { role?: 'admin' | 'faculty' }) {
  // Navigation tab
  const [activeTab, setActiveTab] = useState<'portfolios' | 'submissions' | 'leaderboard'>('portfolios');

  // Role & Tenant Locking
  const [userRole, setUserRole] = useState<string>('ADMIN');
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<string>(getInitialColgCd);
  const [selectedCollegeSlug, setSelectedCollegeSlug] = useState<string>(getInitialTenantSlug);

  // Data states from live backend/database
  const [entries, setEntries] = useState<LogbookEntryItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardStudent[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([
    { id: 'SEMINAR', name: 'Academic Seminar', code: 'SEMINAR' },
    { id: 'TUTORIAL', name: 'Tutorial & Problem Sheet', code: 'TUTORIAL' },
    { id: 'TOPIC', name: 'Assignment / Topic', code: 'TOPIC' },
    { id: 'MINI_PROJECT', name: 'Mini Project', code: 'MINI_PROJECT' },
    { id: 'PRACTICAL', name: 'Practical & Lab Log', code: 'PRACTICAL' },
  ]);
  const [courses, setCourses] = useState<any[]>([
    { id: '13', course_cd: '13', code: '13', name: 'BCA (Bachelor of Computer Applications)' },
    { id: '1', course_cd: '1', code: '1', name: 'B.Tech (Bachelor of Technology)' },
    { id: '4', course_cd: '4', code: '4', name: 'MCA (Master of Computer Applications)' },
    { id: '3', course_cd: '3', code: '3', name: 'MBA (Master of Business Administration)' },
    { id: '2', course_cd: '2', code: '2', name: 'B.Pharm (Bachelor of Pharmacy)' },
  ]);
  const [branches, setBranches] = useState<any[]>([
    { id: '1', branch_cd: '1', code: '1', name: 'BCA General', course_cd: '13' },
    { id: 'CSE', branch_cd: 'CSE', code: 'CSE', name: 'Computer Science & Engineering', course_cd: '1' },
    { id: 'IT', branch_cd: 'IT', code: 'IT', name: 'Information Technology', course_cd: '1' },
    { id: 'ECE', branch_cd: 'ECE', code: 'ECE', name: 'Electronics & Communication Engineering', course_cd: '1' },
    { id: 'ME', branch_cd: 'ME', code: 'ME', name: 'Mechanical Engineering', course_cd: '1' },
    { id: 'EEE', branch_cd: 'EEE', code: 'EEE', name: 'Electrical & Electronics Engineering', course_cd: '1' },
    { id: 'CE', branch_cd: 'CE', code: 'CE', name: 'Civil Engineering', course_cd: '1' },
    { id: 'PHARM', branch_cd: 'PHARM', code: 'PHARM', name: 'Faculty of Pharmacy', course_cd: '2' },
    { id: 'CA', branch_cd: 'CA', code: 'CA', name: 'Computer Applications', course_cd: '4' },
    { id: 'MGMT', branch_cd: 'MGMT', code: 'MGMT', name: 'Management Studies', course_cd: '3' },
  ]);
  const [batches, setBatches] = useState<any[]>([
    { id: '2', batch_cd: '2', code: '2', name: '2025', year: 2025, course_cd: '13' },
    { id: '1', batch_cd: '1', code: '1', name: '2026', year: 2026, course_cd: '13' },
    { id: 'B2025', batch_cd: 'B2025', code: 'B2025', name: 'Batch 2025', year: 2025, course_cd: '1' },
    { id: 'B2024', batch_cd: 'B2024', code: 'B2024', name: 'Batch 2024', year: 2024, course_cd: '1' },
    { id: 'B2023', batch_cd: 'B2023', code: 'B2023', name: 'Batch 2023', year: 2023, course_cd: '1' },
    { id: 'B2022', batch_cd: 'B2022', code: 'B2022', name: 'Batch 2022', year: 2022, course_cd: '1' },
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

  // Student Portfolio Modal state
  const [selectedPortfolioStudent, setSelectedPortfolioStudent] = useState<StudentPortfolioSummary | null>(null);
  const [portfolioActiveTab, setPortfolioActiveTab] = useState<'SEMINARS' | 'TUTORIALS' | 'MINI_PROJECTS' | 'PRACTICALS' | 'ALL'>('MINI_PROJECTS');

  // Document Popup Viewer state
  const [docPreviewTarget, setDocPreviewTarget] = useState<{
    url: string;
    name?: string;
    studentName?: string;
    studentRollNo?: string;
    projectTitle?: string;
    explanationText?: string;
    category?: string;
    marksObtained?: number | null;
    maxMarks?: number;
    facultyRemarks?: string;
    submittedAt?: string;
  } | null>(null);
  const [isDocPreviewOpen, setIsDocPreviewOpen] = useState(false);

  // Escape key handler for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isDocPreviewOpen) {
          setIsDocPreviewOpen(false);
        } else if (selectedPortfolioStudent) {
          setSelectedPortfolioStudent(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDocPreviewOpen, selectedPortfolioStudent]);

  // Fetch initial colleges and lock to logged in tenant for non-superadmin
  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      const roleVal = (typeof window !== 'undefined'
        ? (localStorage.getItem('role') || localStorage.getItem('auth_role') || localStorage.getItem('user_role') || (role === 'faculty' ? 'FACULTY' : 'ADMIN'))
        : 'ADMIN').toUpperCase();
      setUserRole(roleVal);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE}/college-master/colleges`, { headers }).catch(() => null);
      let list: College[] = [];
      if (res && res.ok) {
        const json = await res.json();
        const rawList = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
        const seen = new Set<string>();
        list = rawList.filter((c: any) => {
          const k = String(c.code || c.slug || c.id);
          if (!k || seen.has(k)) return false;
          seen.add(k);
          return true;
        });
      }

      const currentSlug = getInitialTenantSlug();
      const savedColgCd = getInitialColgCd();
      const found = list.find((c: College) => String(c.code || c.id) === savedColgCd || c.slug === currentSlug || c.code === currentSlug);

      let filteredList = list;
      if (roleVal !== 'SUPER_ADMIN') {
        if (found) {
          filteredList = [found];
        } else {
          filteredList = [{
            id: '1',
            code: savedColgCd || '1',
            name: 'SRMS College of Engineering & Technology, Bareilly',
            slug: currentSlug,
          }];
        }
      } else if (filteredList.length === 0) {
        filteredList = [{
          id: '1',
          code: savedColgCd || '1',
          name: 'SRMS College of Engineering & Technology, Bareilly',
          slug: currentSlug,
        }];
      }
      setColleges(filteredList);

      if (found) {
        setSelectedCollegeSlug(found.slug);
        setSelectedCollege(String(found.code || found.id || '1'));
      } else if (filteredList.length > 0) {
        setSelectedCollegeSlug(filteredList[0].slug);
        setSelectedCollege(String(filteredList[0].code || filteredList[0].id || '1'));
      }
    } catch (e) {
      console.error('Failed to fetch colleges', e);
    }
  };

  const handleCollegeChange = (colgVal: string) => {
    setSelectedCollege(colgVal);
    const found = colleges.find(c => String(c.code || c.id) === colgVal || c.slug === colgVal);
    if (found) {
      setSelectedCollegeSlug(found.slug);
      if (typeof window !== 'undefined') {
        localStorage.setItem('colg_cd', colgVal);
        localStorage.setItem('tenantSlug', found.slug);
        localStorage.setItem('selectedTenant', found.slug);
      }
    }
    setSelectedCourse('all');
    setSelectedBranch('all');
    setSelectedBatch('all');
    setSelectedSemester('all');
  };

  const handleCourseChange = (newCourse: string) => {
    setSelectedCourse(newCourse);
    setSelectedBranch('all');
    setSelectedBatch('all');
    setSelectedSemester('all');
  };

  const handleBranchChange = (newBranch: string) => {
    setSelectedBranch(newBranch);
  };

  const handleBatchChange = (newBatch: string) => {
    setSelectedBatch(newBatch);
  };

  const handleSemesterChange = (newSemester: string) => {
    setSelectedSemester(newSemester);
  };

  const fetchMetadata = async (slug?: string, colgCd?: string) => {
    const targetSlug = slug || selectedCollegeSlug || getInitialTenantSlug();
    const targetColgCd = colgCd || selectedCollege || getInitialColgCd();
    const token = localStorage.getItem('token') || '';
    const headers = { Authorization: `Bearer ${token}`, 'x-tenant-slug': targetSlug };

    try {
      // 1. Categories
      const catRes = await fetch(`${API_BASE}/logbook/categories?tenant=${targetSlug}`, { headers }).catch(() => null);
      if (catRes && catRes.ok) {
        const catJson = await catRes.json();
        const catList = Array.isArray(catJson.data) ? catJson.data : Array.isArray(catJson) ? catJson : [];
        if (catList.length > 0) setCategories(catList);
      }

      // 2. Courses, Branches, Batches from master endpoints + SRMS endpoints
      const [cRes, brRes, bchRes, srmsCoursesRes, srmsBranchesRes, srmsBatchesRes, structRes] = await Promise.all([
        fetch(`${API_BASE}/college-master/courses?tenant=${targetSlug}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/college-master/branches?tenant=${targetSlug}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/college-master/batches?tenant=${targetSlug}`, { headers }).catch(() => null),
        fetch(`/api/srms/courses?colgcd=${targetColgCd}&tenant=${targetSlug}`).catch(() => null),
        fetch(`/api/srms/branches?colgcd=${targetColgCd}&tenant=${targetSlug}`).catch(() => null),
        fetch(`/api/srms/batches?colgcd=${targetColgCd}&tenant=${targetSlug}`).catch(() => null),
        fetch(`${API_BASE}/logbook/academic-structure?tenant=${targetSlug}`, { headers }).catch(() => null),
      ]);

      let cList: any[] = [];
      if (srmsCoursesRes && srmsCoursesRes.ok) {
        const j = await srmsCoursesRes.json();
        if (Array.isArray(j) && j.length > 0) cList = j;
      }
      if (cList.length === 0 && cRes && cRes.ok) {
        const cJson = await cRes.json();
        cList = Array.isArray(cJson.data) ? cJson.data : Array.isArray(cJson) ? cJson : [];
      }
      if (cList.length > 0) {
        const mappedCourses = cList.map((c: any) => ({
          ...c,
          name: getCourseDisplayName(c),
          course_name: getCourseDisplayName(c),
        }));
        setCourses(mappedCourses);
      }

      let brList: any[] = [];
      if (srmsBranchesRes && srmsBranchesRes.ok) {
        const j = await srmsBranchesRes.json();
        if (Array.isArray(j) && j.length > 0) brList = j;
      }
      if (brList.length === 0 && brRes && brRes.ok) {
        const brJson = await brRes.json();
        brList = Array.isArray(brJson.data) ? brJson.data : Array.isArray(brJson) ? brJson : [];
      }
      if (brList.length > 0) setBranches(brList);

      let bchList: any[] = [];
      if (srmsBatchesRes && srmsBatchesRes.ok) {
        const j = await srmsBatchesRes.json();
        if (Array.isArray(j) && j.length > 0) bchList = j;
      }
      if (bchList.length === 0 && bchRes && bchRes.ok) {
        const bchJson = await bchRes.json();
        bchList = Array.isArray(bchJson.data) ? bchJson.data : Array.isArray(bchJson) ? bchJson : [];
      }
      if (bchList.length > 0) setBatches(bchList);

      if (structRes && structRes.ok) {
        const sJson = await structRes.json();
        const data = sJson.data || sJson;
        if (data.courses && data.courses.length > 0 && cList.length === 0) setCourses(data.courses);
        if (data.branches && data.branches.length > 0 && brList.length === 0) setBranches(data.branches);
        if (data.batches && data.batches.length > 0 && bchList.length === 0) setBatches(data.batches);
      }
    } catch (e) {
      console.error('Failed to load logbook metadata:', e);
    }
  };

  useEffect(() => {
    if (selectedCollegeSlug) {
      fetchMetadata(selectedCollegeSlug, selectedCollege);
    }
  }, [selectedCollegeSlug, selectedCollege]);

  // Filter Branches by Selected Course with clean BCA General fallback
  const mappedBranches = useMemo(() => {
    const curCourse = courses.find((c) => String(c.course_cd || c.code || c.id) === String(selectedCourse));
    const courseName = curCourse?.name?.replace(/^\[#\d+\]\s*/, '').trim() || (selectedCourse === '13' ? 'BCA' : 'General');

    const courseFiltered = branches.filter((b) => {
      if (!selectedCourse || selectedCourse === 'all') return true;
      const bCourse = String(b.course_cd || b.course_id || '').toLowerCase();
      const sel = String(selectedCourse).toLowerCase();
      return bCourse === sel;
    });

    const list = courseFiltered.length > 0 ? courseFiltered : branches;
    const mapped = list.map((b) => {
      const rawName = (b.branch_name || b.name || '').trim();
      const validName = (rawName && rawName !== '-' && rawName !== 'null' && rawName !== 'NONE')
        ? rawName
        : `${b.course_name || courseName} General`;
      return {
        ...b,
        id: String(b.branch_cd || b.code || b.id || '1'),
        branch_cd: String(b.branch_cd || b.code || b.id || '1'),
        name: validName,
      };
    });

    const seen = new Set<string>();
    return mapped.filter((b) => {
      const k = `${b.branch_cd}|${b.name}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [branches, selectedCourse, courses]);

  // Filter Batches by Selected Course
  const mappedBatches = useMemo(() => {
    const list = batches.filter((b) => {
      if (!selectedCourse || selectedCourse === 'all') return true;
      const bCourse = String(b.course_cd || b.course_id || '').toLowerCase();
      const sel = String(selectedCourse).toLowerCase();
      return bCourse === sel || b.code?.toLowerCase().includes(sel);
    });

    const targetList = list.length > 0 ? list : batches;
    const mapped = targetList.map((b) => ({
      ...b,
      code: String(b.batch_cd || b.code || b.name || b.id || '1'),
      batch_cd: String(b.batch_cd || b.code || b.name || b.id || '1'),
      name: String(b.batch_name || b.name || b.year || b.batch_cd || ''),
      year: Number(b.year || b.batch_name || 2025),
    }));

    const seen = new Set<string>();
    return mapped.filter((b) => {
      const k = String(b.batch_cd || b.code || b.name);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [batches, selectedCourse]);

  // Fetch entries & leaderboard
  useEffect(() => {
    fetchData();
  }, [selectedCollegeSlug, selectedCategory, selectedCourse, selectedBranch, selectedBatch, selectedSemester, selectedStatus]);

  const fetchData = async () => {
    setLoading(true);
    const slug = selectedCollegeSlug || localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly';
    const token = localStorage.getItem('token') || '';
    const headers = { Authorization: `Bearer ${token}`, 'x-tenant-slug': slug };

    try {
      // 1. Fetch All Logbook Entries
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

  // Filtered Submissions Ledger
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

      // 1b. Branch Match
      if (selectedBranch !== 'all') {
        const brVal = selectedBranch.toLowerCase();
        const itemBr = (item.branchId || item.branchName || '').toLowerCase();
        if (itemBr && !itemBr.includes(brVal) && item.branchId !== selectedBranch && itemBr !== 'bca general') {
          return false;
        }
      }

      // 2. Batch Match
      if (selectedBatch !== 'all') {
        const bVal = selectedBatch.toLowerCase().replace(/[^0-9]/g, '');
        const itemB = item.batchName?.toLowerCase().replace(/[^0-9]/g, '') || item.batchCd?.toLowerCase().replace(/[^0-9]/g, '');
        if (bVal && itemB && !itemB.includes(bVal) && !bVal.includes(itemB)) return false;
      }

      // 3. Semester Match
      if (selectedSemester !== 'all') {
        if (String(item.semesterCd) !== String(selectedSemester)) return false;
      }

      // 4. Category Match
      if (selectedCategory !== 'all') {
        const cat = selectedCategory.toUpperCase();
        if (item.categoryCode !== cat && item.activityType !== cat) return false;
      }

      // 5. Status Match
      if (selectedStatus !== 'all') {
        const st = selectedStatus.toUpperCase();
        if (st === 'EVALUATED' && item.status !== 'EVALUATED' && item.status !== 'GRADED') return false;
        if (st === 'SUBMITTED' && item.status !== 'SUBMITTED' && item.status !== 'PENDING') return false;
      }

      // 6. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          item.studentName?.toLowerCase().includes(q) ||
          item.studentRollNo?.toLowerCase().includes(q) ||
          item.studentRegNo?.toLowerCase().includes(q) ||
          item.title?.toLowerCase().includes(q) ||
          item.facultyName?.toLowerCase().includes(q) ||
          item.categoryName?.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [entries, selectedCourse, selectedBranch, selectedBatch, selectedSemester, selectedCategory, selectedStatus, searchQuery]);

  // ════════════════════════════════════════════════════════════════════════════════
  // CONSOLIDATE INTO SINGLE ROW PER STUDENT (Student Portfolio Summaries)
  // ════════════════════════════════════════════════════════════════════════════════
  const studentPortfolios = useMemo(() => {
    const studentMap = new Map<string, StudentPortfolioSummary>();

    // Deduplicate entries by ID
    const seenItemKeys = new Set<string>();
    const deduplicatedEntries: LogbookEntryItem[] = [];
    for (const item of filteredEntries) {
      const itemKey = `${item.id}-${item.studentRollNo || item.studentId || item.studentName}`;
      if (!seenItemKeys.has(itemKey)) {
        seenItemKeys.add(itemKey);
        deduplicatedEntries.push(item);
      }
    }

    for (const item of deduplicatedEntries) {
      const key = (item.studentRollNo || item.studentRegNo || item.studentName || item.studentId || 'unknown').trim();
      if (!studentMap.has(key)) {
        studentMap.set(key, {
          studentId: item.studentId || key,
          studentName: item.studentName,
          studentRollNo: item.studentRollNo,
          studentRegNo: item.studentRegNo,
          studentPhoto: item.studentPhoto,
          courseCd: item.courseCd,
          courseName: item.courseName,
          branchId: item.branchId,
          branchName: item.branchName,
          batchCd: item.batchCd,
          batchName: item.batchName,
          semesterCd: item.semesterCd,
          totalActivities: 0,
          evaluatedCount: 0,
          pendingCount: 0,
          totalMarksObtained: 0,
          totalMaxMarks: 0,
          overallPercentage: 0,
          overallGrade: 'A',
          seminars: [],
          tutorials: [],
          miniProjects: [],
          practicals: [],
          assignments: [],
          allEntries: [],
        });
      }

      const summary = studentMap.get(key)!;
      summary.totalActivities += 1;
      summary.allEntries.push(item);

      const isEval = item.status === 'EVALUATED' || item.status === 'GRADED' || (item.status as string) === 'VERIFIED';
      if (isEval) {
        summary.evaluatedCount += 1;
        if (item.marksObtained !== null && item.marksObtained !== undefined) {
          summary.totalMarksObtained += Number(item.marksObtained);
          summary.totalMaxMarks += Number(item.maxMarks || 20);
        }
      } else {
        summary.pendingCount += 1;
      }

      // Group into specific tabs accurately
      const catCode = (item.categoryCode || item.activityType || '').toUpperCase();
      const catName = (item.categoryName || '').toUpperCase();
      const title = (item.title || '').toLowerCase();

      if (
        catCode === 'SEMINAR' ||
        catName.includes('SEMINAR') ||
        title.includes('gen ai') ||
        title.includes('topology') ||
        title.includes('presentation')
      ) {
        summary.seminars.push(item);
      } else if (
        catCode === 'TUTORIAL' ||
        catName.includes('TUTORIAL') ||
        catName.includes('PROBLEM') ||
        title.includes('tutorial') ||
        title.includes('problem sheet')
      ) {
        summary.tutorials.push(item);
      } else if (
        catCode === 'PRACTICAL' ||
        catName.includes('PRACTICAL') ||
        catName.includes('LAB') ||
        title.includes('lab') ||
        title.includes('practical')
      ) {
        summary.practicals.push(item);
      } else if (
        catCode === 'MINI_PROJECT' ||
        catCode === 'WEEKLY_LOG' ||
        catName.includes('PROJECT') ||
        catName.includes('MILESTONE') ||
        title.includes('milestone') ||
        title.includes('project') ||
        title.includes('e-commerce')
      ) {
        summary.miniProjects.push(item);
      } else {
        summary.seminars.push(item);
      }
    }

    // Calculate percentages & final letter grades
    const result: StudentPortfolioSummary[] = [];
    studentMap.forEach((summary) => {
      if (summary.totalMaxMarks > 0) {
        summary.overallPercentage = Math.round((summary.totalMarksObtained / summary.totalMaxMarks) * 100);
      } else if (summary.evaluatedCount > 0) {
        summary.overallPercentage = 90;
      } else {
        summary.overallPercentage = 0;
      }

      if (summary.overallPercentage >= 90) summary.overallGrade = 'O (Outstanding)';
      else if (summary.overallPercentage >= 80) summary.overallGrade = 'A+ (Excellent)';
      else if (summary.overallPercentage >= 70) summary.overallGrade = 'A (Very Good)';
      else if (summary.overallPercentage >= 60) summary.overallGrade = 'B+ (Good)';
      else summary.overallGrade = 'B (Above Average)';

      result.push(summary);
    });

    // Sort by overallPercentage descending
    return result.sort((a, b) => b.overallPercentage - a.overallPercentage || b.totalActivities - a.totalActivities);
  }, [filteredEntries]);

  // Filtered Leaderboard
  const filteredLeaderboard = useMemo(() => {
    if (!searchQuery.trim()) return leaderboard;
    const q = searchQuery.toLowerCase();
    return leaderboard.filter((st) => {
      return (
        st.studentName.toLowerCase().includes(q) ||
        st.rollNo.toLowerCase().includes(q) ||
        st.courseName.toLowerCase().includes(q)
      );
    });
  }, [leaderboard, searchQuery]);

  const topStudent = studentPortfolios[0] || (leaderboard[0] ? { studentName: leaderboard[0].studentName } : null);
  const avgCohortPct = studentPortfolios.length > 0
    ? Math.round(studentPortfolios.reduce((acc, s) => acc + s.overallPercentage, 0) / studentPortfolios.length)
    : 90;
  const totalEvaluatedActivities = entries.filter(e => e.status === 'EVALUATED' || e.status === 'GRADED').length;

  const handleOpenStudentPortfolio = (student: StudentPortfolioSummary) => {
    setSelectedPortfolioStudent(student);
    if (student.seminars && student.seminars.length > 0) {
      setPortfolioActiveTab('SEMINARS');
    } else if (student.tutorials && student.tutorials.length > 0) {
      setPortfolioActiveTab('TUTORIALS');
    } else if (student.miniProjects && student.miniProjects.length > 0) {
      setPortfolioActiveTab('MINI_PROJECTS');
    } else if (student.practicals && student.practicals.length > 0) {
      setPortfolioActiveTab('PRACTICALS');
    } else {
      setPortfolioActiveTab('ALL');
    }
  };

  const handleOpenDocViewer = (item: LogbookEntryItem) => {
    setDocPreviewTarget({
      url: item.fileUrl || '',
      name: item.fileName || `${item.title || 'Deliverable'}.pdf`,
      studentName: item.studentName,
      studentRollNo: item.studentRollNo,
      projectTitle: item.title,
      explanationText: item.explanationText || item.description,
      category: item.categoryName,
      marksObtained: item.marksObtained,
      maxMarks: item.maxMarks,
      facultyRemarks: item.facultyRemarks || undefined,
      submittedAt: item.submittedAt,
    });
    setIsDocPreviewOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Academic Logbook Reports & Portfolio Ledger" />

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
                    NAAC / NBA Accreditation Dossier
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                  Student Logbook Portfolios &amp; Academic Dossier
                </h1>
                <p className="text-white/80 text-xs md:text-sm max-w-2xl font-medium">
                  Single-row candidate portfolios consolidating Seminars, Tutorials, Mini Project Milestones, and Lab Practicals with high-resolution document previews.
                </p>
              </div>

              {/* Tab Switcher */}
              <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 self-start md:self-auto flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveTab('portfolios')}
                  className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'portfolios'
                      ? 'bg-white text-[#2D2575] shadow-md'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-[#F36C21]" />
                  <span>Student Portfolios ({studentPortfolios.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('submissions')}
                  className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'submissions'
                      ? 'bg-white text-[#2D2575] shadow-md'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Submissions Ledger ({entries.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('leaderboard')}
                  className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'leaderboard'
                      ? 'bg-white text-[#2D2575] shadow-md'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Merit Standings</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mt-6 pt-6 border-t border-white/10">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <p className="text-[10px] uppercase font-bold text-purple-200">Enrolled Candidates</p>
                <p className="text-base md:text-lg font-black text-white">{studentPortfolios.length} Scholars</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <p className="text-[10px] uppercase font-bold text-purple-200">Total Evaluated Tasks</p>
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
                {activeTab === 'portfolios' ? `${studentPortfolios.length} Scholar Portfolios` : `${filteredEntries.length} Records Found`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 text-xs">
              {/* 1. College (colg_cd) - Locked for non-SuperAdmin */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1 flex items-center gap-1">
                  <span>🏛️</span> 1. College *
                </label>
                <div className="relative flex items-center">
                  <select
                    value={selectedCollege}
                    disabled={userRole !== 'SUPER_ADMIN'}
                    onChange={(e) => handleCollegeChange(e.target.value)}
                    className="w-full h-9 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#5B4BFF] disabled:cursor-not-allowed appearance-none cursor-pointer truncate pr-14"
                  >
                    {colleges.map((c) => (
                      <option key={c.code || c.slug || c.id} value={String(c.code || c.id || '1')}>
                        [{c.code || '1'}] {c.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-2 pointer-events-none flex items-center gap-1">
                    {userRole !== 'SUPER_ADMIN' ? (
                      <span className="text-[9px] bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                        <span>🔒</span>
                        <span>Locked</span>
                      </span>
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Course */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1 flex items-center gap-1">
                  <span>🎓</span> 2. Course ({courses.length})
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full h-9 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#5B4BFF] cursor-pointer truncate"
                >
                  <option value="all">All Courses</option>
                  {courses.map((c, idx) => {
                    const code = c.course_cd || c.code || c.id || idx;
                    const displayName = getCourseDisplayName(c);
                    return (
                      <option key={code} value={String(code)}>
                        [#{code}] {displayName}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* 3. Branch */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1 flex items-center gap-1">
                  <span>🏢</span> 3. Branch ({mappedBranches.length})
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  className="w-full h-9 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#5B4BFF] cursor-pointer truncate"
                >
                  <option value="all">All Branches</option>
                  {mappedBranches.map((b, idx) => (
                    <option key={b.id || b.branch_cd || b.code || idx} value={String(b.branch_cd || b.code || b.id)}>
                      [#{b.branch_cd || b.code || idx + 1}] {b.name || b.branch_cd || b.code}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Batch */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1 flex items-center gap-1">
                  <span>👥</span> 4. Batch ({mappedBatches.length})
                </label>
                <select
                  value={selectedBatch}
                  onChange={(e) => handleBatchChange(e.target.value)}
                  className="w-full h-9 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#5B4BFF] cursor-pointer truncate"
                >
                  <option value="all">All Batches</option>
                  {mappedBatches.map((b, idx) => {
                    const rawName = String(b.name || b.batch_name || b.year || b.batch_cd || '').trim();
                    const batchLabel = rawName.toLowerCase().startsWith('batch') ? rawName : `Batch ${rawName}`;
                    return (
                      <option key={b.id || b.batch_cd || b.code || idx} value={String(b.batch_cd || b.code || b.name || b.id)}>
                        [#{b.batch_cd || b.code || b.id}] {batchLabel}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* 5. Semester */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1 flex items-center gap-1">
                  <span>📖</span> 5. Semester
                </label>
                <select
                  value={selectedSemester}
                  onChange={(e) => handleSemesterChange(e.target.value)}
                  className="w-full h-9 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-[#5B4BFF] dark:text-indigo-400 font-bold focus:outline-none focus:border-[#5B4BFF] cursor-pointer"
                >
                  <option value="all">All Semesters</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={String(sem)}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. Activity Category */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1 flex items-center gap-1">
                  <span>📋</span> 6. Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-9 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#5B4BFF] cursor-pointer truncate"
                >
                  <option value="all">All Categories</option>
                  <option value="SEMINAR">Seminars &amp; Presentations</option>
                  <option value="TUTORIAL">Tutorials &amp; Problem Sheets</option>
                  <option value="MINI_PROJECT">Mini Projects &amp; Milestones</option>
                  <option value="PRACTICAL">Practicals &amp; Lab Logs</option>
                </select>
              </div>

              {/* 7. Faculty Status */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1 flex items-center gap-1">
                  <span>⚡</span> 7. Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full h-9 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#5B4BFF] cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="EVALUATED">Evaluated / Graded</option>
                  <option value="SUBMITTED">Submitted / Pending</option>
                </select>
              </div>
            </div>

            {/* Search Input & Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by student candidate name, roll number, registration ID, or project topic..."
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
                  <span>Refresh Records</span>
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
          {/* TAB 1: SINGLE-ROW STUDENT PORTFOLIOS DIRECTORY (User Core Request) */}
          {/* ═════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'portfolios' && (
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] shadow-soft overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-[#5B4BFF]" />
                    <span>Candidate Academic Portfolios Directory</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#5B4BFF]/10 text-[#5B4BFF] text-[10px] font-black">
                      Single-Row Scholar View
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Click any student row or &ldquo;View Full Portfolio&rdquo; to explore complete Seminars, Tutorials, Weekly Milestones, and Lab Logs in full detail.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-black border border-emerald-200 dark:border-emerald-800">
                    {studentPortfolios.length} Candidate Portfolios
                  </span>
                </div>
              </div>

              {loading ? (
                <PortfolioSkeleton rowCount={5} />
              ) : studentPortfolios.length === 0 ? (
                <div className="p-16 text-center text-slate-400 space-y-2">
                  <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                    No student portfolios found for the selected filter combination.
                  </p>
                  <p className="text-xs text-slate-400">
                    Adjust your course, branch, batch, or semester filters above.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                        <th className="py-3.5 px-4">Scholar Details</th>
                        <th className="py-3.5 px-4">Program &amp; Batch</th>
                        <th className="py-3.5 px-4 text-center">Seminars</th>
                        <th className="py-3.5 px-4 text-center">Tutorials</th>
                        <th className="py-3.5 px-4 text-center">Mini Project &amp; Milestones</th>
                        <th className="py-3.5 px-4 text-center">Overall Standing</th>
                        <th className="py-3.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {studentPortfolios.map((student) => {
                        return (
                          <tr
                            key={student.studentRollNo || student.studentId}
                            onClick={() => handleOpenStudentPortfolio(student)}
                            className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer"
                          >
                            {/* Scholar Details */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#2D2575] to-[#5B4BFF] border border-[#5B4BFF]/30 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                  {student.studentPhoto ? (
                                    <img
                                      src={student.studentPhoto}
                                      alt={student.studentName}
                                      className="w-full h-full object-cover"
                                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                    />
                                  ) : (
                                    <span className="font-black text-sm text-white">
                                      {student.studentName.slice(0, 2).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <p className="font-black text-slate-900 dark:text-white group-hover:text-[#5B4BFF] transition-colors text-sm">
                                    {student.studentName}
                                  </p>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                    Roll: <span className="font-bold text-slate-800 dark:text-slate-200">{student.studentRollNo}</span>
                                    {student.studentRegNo ? ` • Reg: ${student.studentRegNo}` : ''}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Program & Batch */}
                            <td className="py-4 px-4">
                              <p className="font-bold text-slate-900 dark:text-slate-200">
                                {student.courseName} {student.branchName ? `(${student.branchName})` : ''}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <span>{student.batchName}</span>
                                <span>•</span>
                                <span className="font-semibold text-[#5B4BFF]">Sem {student.semesterCd}</span>
                              </p>
                            </td>

                            {/* Seminars Count */}
                            <td className="py-4 px-4 text-center">
                              {student.seminars.length > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-200 dark:border-purple-800">
                                  <Presentation className="w-3.5 h-3.5 text-purple-500" />
                                  <span>{student.seminars.length} Done</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px] italic">0 Submitted</span>
                              )}
                            </td>

                            {/* Tutorials Count */}
                            <td className="py-4 px-4 text-center">
                              {student.tutorials.length > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800">
                                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                                  <span>{student.tutorials.length} Sheets</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px] italic">0 Submitted</span>
                              )}
                            </td>

                            {/* Mini Project & Milestones */}
                            <td className="py-4 px-4 text-center">
                              {student.miniProjects.length > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800">
                                  <FolderGit2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>{student.miniProjects.length} Milestones</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px] italic">0 Milestones</span>
                              )}
                            </td>

                            {/* Overall Grade & Progress */}
                            <td className="py-4 px-4 text-center">
                              <div className="inline-flex flex-col items-center gap-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                                    {student.overallPercentage}%
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black text-[10px]">
                                    {student.overallGrade.split(' ')[0]}
                                  </span>
                                </div>
                                <div className="w-20 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-[#5B4BFF] to-[#00C48C] rounded-full"
                                    style={{ width: `${Math.min(student.overallPercentage, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Portfolio Action Button */}
                            <td className="py-4 px-4 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenStudentPortfolio(student);
                                }}
                                className="px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4338CA] text-white font-bold text-xs shadow-md shadow-[#5B4BFF]/20 inline-flex items-center gap-1.5 transition cursor-pointer scale-100 hover:scale-[1.02]"
                              >
                                <FolderOpen className="w-3.5 h-3.5 text-amber-300" />
                                <span>View Full Portfolio</span>
                                <ChevronRight className="w-3.5 h-3.5" />
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
          {/* TAB 2: DETAILED SUBMISSIONS LEDGER (Raw Stream) */}
          {/* ═════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'submissions' && (
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] shadow-soft overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#5B4BFF]" />
                    All Granular Deliverables, Seminars &amp; Tutorial Logbooks
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Itemized stream of submitted documentation, faculty marks, letter grades, and mentor remarks
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-black border border-emerald-200 dark:border-emerald-800">
                    {filteredEntries.length} Items
                  </span>
                </div>
              </div>

              {loading ? (
                <PortfolioSkeleton rowCount={6} />
              ) : filteredEntries.length === 0 ? (
                <div className="p-16 text-center text-slate-400 space-y-2">
                  <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                    No logbook submissions found for the selected filter combination.
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
                        <th className="py-3.5 px-4">Faculty Grade &amp; Remarks</th>
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

                            <td className="py-4 px-4">
                              <p className="font-bold text-slate-900 dark:text-slate-200">{item.courseName}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.batchName} • Sem {item.semesterCd}</p>
                            </td>

                            <td className="py-4 px-4 max-w-md">
                              <div className="space-y-1">
                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                                  {item.categoryName}
                                </span>
                                <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{item.title}</p>
                              </div>
                            </td>

                            <td className="py-4 px-4 text-center">
                              {item.fileUrl || item.fileName ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenDocViewer(item)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#F36C21] hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                                  title="Read in popup document viewer"
                                >
                                  <FileText className="w-3.5 h-3.5 text-[#F36C21] group-hover:text-white" />
                                  <span className="truncate max-w-[110px]">{item.fileName || 'View Document'}</span>
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">No file</span>
                              )}
                            </td>

                            <td className="py-4 px-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                    isEval ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}>
                                    {isEval ? 'Graded' : 'Pending'}
                                  </span>
                                  {isEval && item.marksObtained !== null && (
                                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                                      {item.marksObtained} / {item.maxMarks}
                                    </span>
                                  )}
                                </div>
                                {item.facultyRemarks && (
                                  <p className="text-[11px] text-slate-500 truncate max-w-xs">{item.facultyRemarks}</p>
                                )}
                              </div>
                            </td>

                            <td className="py-4 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleOpenDocViewer(item)}
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
          {/* TAB 3: ACADEMIC MERIT STANDINGS & LEADERBOARD */}
          {/* ═════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'leaderboard' && (
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] shadow-soft overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <span>Academic Merit Standings &amp; Rank Distribution</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Highest scoring candidates ranked by cumulative deliverable evaluations and faculty sign-offs.
                  </p>
                </div>
              </div>

              {loading ? (
                <PortfolioSkeleton rowCount={6} />
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
                          <td className="py-4 px-4 text-center">
                            {student.rank === 1 ? (
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 text-white font-black text-xs shadow-md">
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

                          <td className="py-4 px-4">
                            <p className="font-bold text-slate-900 dark:text-slate-200">{student.courseName}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{student.batchName}</p>
                          </td>

                          <td className="py-4 px-4 text-center">
                            <span className="px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 font-black text-xs border border-purple-200">
                              {student.totalActivities} Tasks
                            </span>
                          </td>

                          <td className="py-4 px-4 text-center font-mono">
                            <span className="font-black text-slate-900 dark:text-white">{student.totalMarks}</span>
                            <span className="text-slate-400"> / {student.maxMarks}</span>
                          </td>

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

                          <td className="py-4 px-4">
                            <div className="flex gap-1.5 flex-wrap">
                              {student.categoryBreakdown?.map((cb, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold"
                                >
                                  {cb.category_name}: <strong>{cb.score_pct}%</strong>
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
        </main>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════════ */}
      {/* FULL STUDENT PORTFOLIO DOSSIER MODAL (Tabs: Seminars, Tutorials, Mini Projects, Practicals) */}
      {/* ═════════════════════════════════════════════════════════════════════════════ */}
      {selectedPortfolioStudent && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedPortfolioStudent(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-fadeIn"
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 w-full max-w-6xl h-[92vh] max-h-[950px] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Hero Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-[#2D2575] via-[#3B328C] to-[#5B4BFF] text-white flex items-center justify-between border-b border-indigo-950 flex-shrink-0 flex-wrap gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                  {selectedPortfolioStudent.studentPhoto ? (
                    <img
                      src={selectedPortfolioStudent.studentPhoto}
                      alt={selectedPortfolioStudent.studentName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-black text-xl text-white">
                      {selectedPortfolioStudent.studentName.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F36C21] text-white text-[10px] font-black uppercase tracking-wider">
                      Academic Candidate Dossier
                    </span>
                    <span className="text-xs text-purple-200 font-mono">
                      Roll: <strong className="text-white">{selectedPortfolioStudent.studentRollNo}</strong>
                      {selectedPortfolioStudent.studentRegNo ? ` • Reg: ${selectedPortfolioStudent.studentRegNo}` : ''}
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-black text-white truncate mt-0.5">
                    {selectedPortfolioStudent.studentName}
                  </h3>
                  <p className="text-xs text-purple-200 font-medium">
                    {selectedPortfolioStudent.courseName} {selectedPortfolioStudent.branchName ? `(${selectedPortfolioStudent.branchName})` : ''} • {selectedPortfolioStudent.batchName} • Semester {selectedPortfolioStudent.semesterCd}
                  </p>
                </div>
              </div>

              {/* Header Right Badges & Controls */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right hidden sm:block bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-purple-200 block">Overall Performance</span>
                  <span className="text-base font-black text-white">
                    {selectedPortfolioStudent.overallPercentage}% • <span className="text-emerald-300">{selectedPortfolioStudent.overallGrade}</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 border border-white/20 transition cursor-pointer"
                  title="Print Official Dossier"
                >
                  <Printer className="w-4 h-4 text-amber-300" />
                  <span className="hidden md:inline">Print Dossier</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPortfolioStudent(null)}
                  className="p-2 rounded-xl text-purple-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Close (ESC)"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Dossier Navigation Tabs */}
            <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto flex-shrink-0">
              <button
                type="button"
                onClick={() => setPortfolioActiveTab('SEMINARS')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  portfolioActiveTab === 'SEMINARS'
                    ? 'bg-[#5B4BFF] text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                }`}
              >
                <Presentation className="w-4 h-4 text-purple-400" />
                <span>1. Seminars ({selectedPortfolioStudent.seminars.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setPortfolioActiveTab('TUTORIALS')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  portfolioActiveTab === 'TUTORIALS'
                    ? 'bg-[#5B4BFF] text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                }`}
              >
                <FileText className="w-4 h-4 text-blue-400" />
                <span>2. Tutorials ({selectedPortfolioStudent.tutorials.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setPortfolioActiveTab('MINI_PROJECTS')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  portfolioActiveTab === 'MINI_PROJECTS'
                    ? 'bg-[#5B4BFF] text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                }`}
              >
                <FolderGit2 className="w-4 h-4 text-[#F36C21]" />
                <span>3. Mini Project &amp; Milestones ({selectedPortfolioStudent.miniProjects.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setPortfolioActiveTab('PRACTICALS')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  portfolioActiveTab === 'PRACTICALS'
                    ? 'bg-[#5B4BFF] text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                }`}
              >
                <FlaskConical className="w-4 h-4 text-emerald-400" />
                <span>4. Practicals &amp; Lab Logs ({selectedPortfolioStudent.practicals.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setPortfolioActiveTab('ALL')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  portfolioActiveTab === 'ALL'
                    ? 'bg-[#5B4BFF] text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>All Activities ({selectedPortfolioStudent.allEntries.length})</span>
              </button>
            </div>

            {/* Dossier Content Body */}
            <div className="flex-1 bg-[#F6F8FC] dark:bg-slate-950 p-4 sm:p-6 overflow-y-auto space-y-4">
              {/* TAB CONTENT: MINI PROJECTS (Weekly / Daily Wise Progress Report) */}
              {portfolioActiveTab === 'MINI_PROJECTS' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <FolderGit2 className="w-4 h-4 text-[#F36C21]" />
                        <span>Mini Project Weekly Milestone Tracker &amp; Technical Ledger</span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Chronological progression of student weekly accomplishment logs, source code deliverables, and faculty sign-offs.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                      {selectedPortfolioStudent.miniProjects.length} Milestones Registered
                    </span>
                  </div>

                  {selectedPortfolioStudent.miniProjects.length === 0 ? (
                    <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                      <FolderGit2 className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No Mini Project Milestones Uploaded Yet</p>
                      <p className="text-xs text-slate-400">Weekly progress submissions will dynamically populate here.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedPortfolioStudent.miniProjects.map((entry, idx) => (
                        <div
                          key={entry.id || idx}
                          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-[#5B4BFF] transition-all space-y-3"
                        >
                          <div className="flex items-start justify-between flex-wrap gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-black text-[10px] uppercase border border-amber-200">
                                  Milestone #{idx + 1}
                                </span>
                                <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {entry.submittedAt ? new Date(entry.submittedAt).toLocaleString() : 'Recent'}
                                </span>
                              </div>
                              <h5 className="text-sm font-black text-slate-900 dark:text-white">
                                {entry.title}
                              </h5>
                            </div>

                            <div className="flex items-center gap-2">
                              {entry.status === 'EVALUATED' || entry.status === 'GRADED' ? (
                                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                                  ✓ Graded: {entry.marksObtained} / {entry.maxMarks || 100}
                                </span>
                              ) : (
                                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 font-bold text-xs border border-amber-200">
                                  Pending Review
                                </span>
                              )}

                              {(entry.fileUrl || entry.fileName) && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenDocViewer(entry)}
                                  className="px-3 py-1 rounded-xl bg-[#5B4BFF] hover:bg-[#4338CA] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                                  title="Open PDF deliverable in popup previewer"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Preview PDF / Doc</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Student Written Explanation / Derivation */}
                          {(entry.explanationText || entry.description) && (
                            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                              <span className="font-bold text-slate-900 dark:text-white block mb-0.5 uppercase text-[10px] text-[#5B4BFF]">
                                Accomplishments &amp; Technical Scope:
                              </span>
                              {entry.explanationText || entry.description}
                            </div>
                          )}

                          {/* Faculty Feedback */}
                          {entry.facultyRemarks && (
                            <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 text-xs text-slate-700 dark:text-slate-300">
                              <span className="font-bold text-emerald-800 dark:text-emerald-300 text-[10px] uppercase block">
                                Faculty Mentor Remarks ({entry.facultyName}):
                              </span>
                              &ldquo;{entry.facultyRemarks}&rdquo;
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: SEMINARS */}
              {portfolioActiveTab === 'SEMINARS' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Presentation className="w-4 h-4 text-purple-500" />
                        <span>Academic Seminar Presentations &amp; Technical Speeches</span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Slide decks, research abstracts, and faculty viva evaluation scores.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 font-bold text-xs border border-purple-200">
                      {selectedPortfolioStudent.seminars.length} Seminars
                    </span>
                  </div>

                  {selectedPortfolioStudent.seminars.length === 0 ? (
                    <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                      <Presentation className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No Seminar Presentations Logged</p>
                      <p className="text-xs text-slate-400">Student seminar presentations will display here upon submission.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedPortfolioStudent.seminars.map((entry, idx) => (
                        <div
                          key={entry.id || idx}
                          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 hover:border-[#5B4BFF]/50 transition-all"
                        >
                          <div className="flex items-start justify-between flex-wrap gap-2">
                            <div>
                              <span className="px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-[#5B4BFF] font-black text-[10px] uppercase border border-purple-200 dark:border-purple-800">
                                Seminar Presentation #{idx + 1}
                              </span>
                              <h5 className="text-sm font-black text-slate-900 dark:text-white mt-1">
                                {entry.title}
                              </h5>
                              <p className="text-xs text-slate-400 font-mono mt-0.5">
                                Submitted on {entry.submittedAt ? new Date(entry.submittedAt).toLocaleDateString() : 'Active'}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              {entry.marksObtained !== null && (
                                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                                  Grade: {entry.marksObtained} / {entry.maxMarks || 20}
                                </span>
                              )}
                            </div>
                          </div>

                          {entry.description && (
                            <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                              {entry.description}
                            </p>
                          )}

                          {/* Dedicated Attachment Document Preview Card */}
                          {(entry.fileUrl || entry.fileName) && (
                            <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center shrink-0">
                                  <FileText className="w-4 h-4 text-[#F36C21]" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                    {entry.fileName || `${entry.title}.pdf`}
                                  </p>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                    Attached Seminar Slide Deck / PDF
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleOpenDocViewer(entry)}
                                className="px-3.5 py-1.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4338CA] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition shrink-0 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Preview Document</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: TUTORIALS */}
              {portfolioActiveTab === 'TUTORIALS' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span>Tutorial &amp; Problem Sheet Workbooks</span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Handwritten derivations, problem sets, and graded tutorial submissions.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
                      {selectedPortfolioStudent.tutorials.length} Tutorials
                    </span>
                  </div>

                  {selectedPortfolioStudent.tutorials.length === 0 ? (
                    <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                      <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No Tutorial Problem Sheets Logged</p>
                      <p className="text-xs text-slate-400">Tutorial workbooks will appear here upon submission.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedPortfolioStudent.tutorials.map((entry, idx) => (
                        <div
                          key={entry.id || idx}
                          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                        >
                          <div className="flex items-start justify-between flex-wrap gap-2">
                            <div>
                              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-black text-[10px] uppercase border border-blue-200">
                                Problem Sheet #{idx + 1}
                              </span>
                              <h5 className="text-sm font-black text-slate-900 dark:text-white mt-1">
                                {entry.title}
                              </h5>
                            </div>

                            <div className="flex items-center gap-2">
                              {entry.marksObtained !== null && (
                                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                                  Grade: {entry.marksObtained} / {entry.maxMarks}
                                </span>
                              )}
                              {(entry.fileUrl || entry.fileName) && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenDocViewer(entry)}
                                  className="px-3 py-1 rounded-xl bg-[#5B4BFF] hover:bg-[#4338CA] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Preview Solution PDF</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: PRACTICALS & LAB LOGS */}
              {portfolioActiveTab === 'PRACTICALS' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <FlaskConical className="w-4 h-4 text-emerald-500" />
                        <span>Laboratory Experiments &amp; Practical Hands-on Logs</span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Dynamic laboratory logbooks, experiment records, code executions, and viva assessment ratings.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                      {selectedPortfolioStudent.practicals.length} Experiments
                    </span>
                  </div>

                  {selectedPortfolioStudent.practicals.length === 0 ? (
                    <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                      <FlaskConical className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No Practical Lab Logs Logged</p>
                      <p className="text-xs text-slate-400">Experiment performance records will dynamically appear here when submitted.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedPortfolioStudent.practicals.map((entry, idx) => (
                        <div
                          key={entry.id || idx}
                          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                        >
                          <div className="flex items-start justify-between flex-wrap gap-2">
                            <div>
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-black text-[10px] uppercase border border-emerald-200">
                                Lab Practical #{idx + 1}
                              </span>
                              <h5 className="text-sm font-black text-slate-900 dark:text-white mt-1">
                                {entry.title}
                              </h5>
                            </div>
                            {(entry.fileUrl || entry.fileName) && (
                              <button
                                type="button"
                                onClick={() => handleOpenDocViewer(entry)}
                                className="px-3 py-1 rounded-xl bg-[#5B4BFF] hover:bg-[#4338CA] text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>View Lab Sheet</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: ALL ACTIVITIES */}
              {portfolioActiveTab === 'ALL' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                          <th className="py-3 px-4">Activity Category</th>
                          <th className="py-3 px-4">Deliverable Title</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4 text-center">Score / Grade</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {selectedPortfolioStudent.allEntries.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded font-black text-[10px] uppercase bg-purple-50 text-purple-700 border border-purple-200">
                                {item.categoryName}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                              {item.title}
                            </td>
                            <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                              {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-emerald-600">
                              {item.marksObtained !== null ? `${item.marksObtained} / ${item.maxMarks}` : 'Pending'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {(item.fileUrl || item.fileName) && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenDocViewer(item)}
                                  className="px-2.5 py-1 rounded-lg bg-[#5B4BFF] text-white font-bold text-[11px] hover:bg-[#4338CA] transition cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Preview</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Verified Academic Candidate Portfolio • SRMS Digital Logbook System</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPortfolioStudent(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer shadow-sm"
              >
                Close Portfolio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════════ */}
      {/* POPUP DOCUMENT PREVIEW MODAL */}
      {/* ═════════════════════════════════════════════════════════════════════════════ */}
      <DocumentPreviewModal
        isOpen={isDocPreviewOpen}
        onClose={() => setIsDocPreviewOpen(false)}
        title="Candidate Academic Deliverable Visualizer"
        documentUrl={docPreviewTarget?.url}
        documentName={docPreviewTarget?.name}
        studentName={docPreviewTarget?.studentName}
        studentRollNo={docPreviewTarget?.studentRollNo}
        projectTitle={docPreviewTarget?.projectTitle}
        explanationText={docPreviewTarget?.explanationText}
        category={docPreviewTarget?.category}
        marksObtained={docPreviewTarget?.marksObtained}
        maxMarks={docPreviewTarget?.maxMarks}
        facultyRemarks={docPreviewTarget?.facultyRemarks}
        submittedAt={docPreviewTarget?.submittedAt}
      />
    </div>
  );
}
