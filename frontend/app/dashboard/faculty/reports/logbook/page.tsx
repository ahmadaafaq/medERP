'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '../../../../../components/Sidebar';
import Header from '../../../../../components/Header';
import FacultyReportsNav from '../../../../../components/FacultyReportsNav';

// ─── Interfaces conforming strictly to RestrictAPI.md (Zero GUID Standard) ──
interface College {
  id?: string;
  colg_cd?: number | string;
  code: string;
  name: string;
  slug: string;
}

interface CourseItem {
  id?: string;
  course_cd: string;
  code: string;
  name: string;
  degree_level?: string;
  colg_cd?: string;
}

interface BranchItem {
  id?: string;
  branch_cd: string;
  code: string;
  name: string;
  course_cd?: string;
  course_name?: string;
  colg_cd?: string;
}

interface BatchItem {
  id?: string;
  batch_cd: string;
  code: string;
  name?: string;
  year?: number;
  course_cd?: string;
  course_name?: string;
  colg_cd?: string;
}

interface Department {
  id?: string;
  dept_cd?: number | string;
  name: string;
  code: string;
  course_cd?: string;
  course_name?: string;
  branch_cd?: string;
  colg_cd?: string;
  college_slug?: string;
}

interface Subject {
  id?: string;
  subject_cd?: number | string;
  name: string;
  code: string;
  department_id?: string;
  department_name?: string;
  department_code?: string;
  course_cd?: string;
  branch_cd?: string;
  semester?: number | string;
  colg_cd?: string;
  college_slug?: string;
}

interface LogbookRow {
  id: string;
  rollno: string;
  studentName: string;
  competencyCode: string;
  activityTitle: string;
  clinicalDomain: string;
  submissionDate: string;
  verifiedBy?: string;
  verificationDate?: string;
  rating: number; // 1 - 5 stars
  status: 'VERIFIED' | 'PENDING' | 'REJECTED';
}

const API_BASE = 'http://localhost:3001/api/v1';

const getInitialColgCd = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('colg_cd') || '1';
  }
  return '1';
};

const getInitialTenantSlug = (): string => {
  if (typeof window !== 'undefined') {
    return (
      localStorage.getItem('tenantSlug') ||
      localStorage.getItem('selectedTenant') ||
      localStorage.getItem('institutionSlug') ||
      localStorage.getItem('tenant') ||
      'srms-cet-bareilly'
    );
  }
  return 'srms-cet-bareilly';
};

const sampleLogbookData: LogbookRow[] = [
  {
    id: 'log-1',
    rollno: '2500141790009',
    studentName: 'ARSHAD NAIM',
    competencyCode: 'PYTH1.1',
    activityTitle: 'Implementation of Binary Search Tree and AVL Balancing Algorithms',
    clinicalDomain: 'Data Structures Lab (Lab-2)',
    submissionDate: '2026-08-10',
    verifiedBy: 'Prof. Er. Amit Sharma',
    verificationDate: '2026-08-11',
    rating: 5,
    status: 'VERIFIED',
  },
  {
    id: 'log-2',
    rollno: '2500141790011',
    studentName: 'AYUSH AGARWAL',
    competencyCode: 'PYTH1.2',
    activityTitle: 'Full-Stack REST API Integration with PostgreSQL & Prisma Engine',
    clinicalDomain: 'Web Architecture Lab (Lab-4)',
    submissionDate: '2026-08-12',
    verifiedBy: 'Prof. Er. Amit Sharma',
    verificationDate: '2026-08-13',
    rating: 4,
    status: 'VERIFIED',
  },
  {
    id: 'log-3',
    rollno: '2500141790015',
    studentName: 'DEV RATHORE',
    competencyCode: 'PYTH1.3',
    activityTitle: 'Asynchronous Event-Driven Microservices with Redis Queue',
    clinicalDomain: 'Distributed Systems Lab',
    submissionDate: '2026-08-14',
    rating: 3,
    status: 'PENDING',
  },
  {
    id: 'log-4',
    rollno: '2023MBBS045',
    studentName: 'Rahul Verma',
    competencyCode: 'PY1.1(2024)',
    activityTitle: 'Spirometry Practical — Forced Vital Capacity (FVC) Determination',
    clinicalDomain: 'Physiology Lab',
    submissionDate: '2026-08-02',
    verifiedBy: 'Prof. Dr. A. K. Sharma',
    verificationDate: '2026-08-03',
    rating: 5,
    status: 'VERIFIED',
  },
  {
    id: 'log-5',
    rollno: '2023MBBS012',
    studentName: 'Ananya Roy',
    competencyCode: 'AN10.11(2024)',
    activityTitle: 'Upper Limb Osteology Demonstration — Clavicle Attachments',
    clinicalDomain: 'Anatomy Dissection Hall',
    submissionDate: '2026-08-01',
    verifiedBy: 'Dr. R. K. Gupta',
    verificationDate: '2026-08-02',
    rating: 5,
    status: 'VERIFIED',
  },
];

export default function FacultyUGLogbookReportPage() {
  const pathname = usePathname();
  const currentRole: 'admin' | 'faculty' = (pathname && pathname.includes('/dashboard/admin/')) ? 'admin' : 'faculty';

  // ─── 1. Colleges State (Rule 1: colg_cd) ───────────────────────────────────
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedColgCd, setSelectedColgCd] = useState<string>(getInitialColgCd);
  const [selectedCollegeSlug, setSelectedCollegeSlug] = useState<string>(getInitialTenantSlug);

  // ─── Step 1: 7-Level Cascading Hierarchy (RestrictAPI.md Standard) ─────────
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [selectedCourseCd, setSelectedCourseCd] = useState<string>('13'); // default BCA

  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranchCd, setSelectedBranchCd] = useState<string>('1');

  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [selectedBatchCd, setSelectedBatchCd] = useState<string>('B2026-C13-1');

  const [selectedSemCd, setSelectedSemCd] = useState<string>('1'); // Sem 1 to 8

  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptCd, setSelectedDeptCd] = useState<string>('13'); // BCA Dept

  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [selectedSubjectCd, setSelectedSubjectCd] = useState<string>('88534'); // Web Technology

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [logbookEntries, setLogbookEntries] = useState<LogbookRow[]>(sampleLogbookData);
  const [loading, setLoading] = useState<boolean>(false);

  // Utility for foolproof array deduplication by key
  const dedupeBy = <T,>(arr: T[], keyFn: (item: T) => string): T[] => {
    const seen = new Set<string>();
    return (arr || []).filter(item => {
      if (!item) return false;
      const key = keyFn(item);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // ─── 1. Fetch Colleges on Mount ────────────────────────────────────────────
  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE}/college-master/colleges`, { headers });
      if (res.ok) {
        const json = await res.json();
        const rawList: College[] = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
        const list = dedupeBy(rawList, (c: College) => String(c.colg_cd || c.code || c.slug || c.id));
        setColleges(list);

        const currentSlug = getInitialTenantSlug();
        const savedColgCd = typeof window !== 'undefined' ? localStorage.getItem('colg_cd') : null;
        const found = list.find((c: College) => 
          (savedColgCd && String(c.colg_cd || c.code) === savedColgCd) ||
          c.slug === currentSlug || String(c.code) === currentSlug || String(c.colg_cd) === currentSlug
        );
        if (found) {
          setSelectedCollegeSlug(found.slug);
          setSelectedColgCd(String(found.colg_cd || found.code || '1'));
        } else if (list.length > 0) {
          setSelectedCollegeSlug(list[0].slug);
          setSelectedColgCd(String(list[0].colg_cd || list[0].code || '1'));
        }
      }
    } catch (e) {
      console.error('Failed to fetch colleges', e);
    }
  };

  // ─── 2. Fetch Master Hierarchy Data (Strict Schema-per-Tenant) ─────────────
  const fetchMetadata = async (slug: string) => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const headers: Record<string, string> = {
        'x-tenant-slug': slug,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      };
      const parse = (j: any) => {
        const raw = Array.isArray(j?.data?.data) ? j.data.data : Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : [];
        return dedupeBy(raw, (item: any) => String(item.code || item.id || item.name));
      };

      const [cRes, brRes, bRes, dRes, sRes] = await Promise.all([
        fetch(`${API_BASE}/college-master/courses?tenant=${slug}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/college-master/branches?tenant=${slug}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/college-master/batches?tenant=${slug}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/admin-master/departments?tenant=${slug}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/admin-master/subjects?tenant=${slug}`, { headers }).catch(() => null),
      ]);

      if (cRes && cRes.ok) setCourses(parse(await cRes.json()));
      if (brRes && brRes.ok) setBranches(parse(await brRes.json()));
      if (bRes && bRes.ok) setBatches(parse(await bRes.json()));
      if (dRes && dRes.ok) setDepartments(parse(await dRes.json()));
      if (sRes && sRes.ok) setAllSubjects(parse(await sRes.json()));
    } catch (e) {
      console.error('fetchMetadata error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCollegeSlug) {
      fetchMetadata(selectedCollegeSlug);
    }
  }, [selectedCollegeSlug]);

  // ─── Filter Courses by Selected College (Medical Exclusion for CET) ─────────
  const isMedicalCollege = selectedColgCd === '2' || selectedCollegeSlug.includes('ims');

  const filteredCourses = useMemo(() => {
    const list = courses.filter(c => {
      const cName = (c.name || '').toLowerCase();
      const cCode = (c.code || '').toLowerCase();
      const isMedCourse = cName.includes('mbbs') || cCode === 'mbbs' || cName.includes('medicine');
      if (isMedicalCollege) return isMedCourse || c.colg_cd === '2';
      return !isMedCourse;
    });
    return dedupeBy(list, c => String(c.course_cd || c.code || c.id));
  }, [courses, isMedicalCollege]);

  useEffect(() => {
    if (filteredCourses.length > 0) {
      const exists = filteredCourses.some(c => String(c.course_cd) === selectedCourseCd || c.code === selectedCourseCd);
      if (!exists) {
        setSelectedCourseCd(String(filteredCourses[0].course_cd || filteredCourses[0].code));
      }
    }
  }, [filteredCourses, selectedCourseCd]);

  // ─── Filter Branches by Selected Course ────────────────────────────────────
  const filteredBranches = useMemo(() => {
    const list = branches.filter(b => {
      if (isMedicalCollege) return (b.name && b.name.includes('Department of')) || b.code === 'ANA' || b.code === 'PHY';
      const isMed = b.code === 'ANA' || b.code === 'PHY' || (b.name && (b.name.toLowerCase().includes('anatomy') || b.name.toLowerCase().includes('physiology')));
      if (isMed) return false;
      if (!selectedCourseCd) return true;
      return String(b.course_cd) === String(selectedCourseCd);
    });
    const base = list.length > 0 ? list : [{ branch_cd: '1', code: '1', name: 'General Branch (1)' }];
    return dedupeBy(base, b => String(b.branch_cd || b.code || b.id));
  }, [branches, selectedCourseCd, isMedicalCollege]);

  // ─── Filter Batches by Selected Course ─────────────────────────────────────
  const filteredBatches = useMemo(() => {
    const list = batches.filter(b => {
      if (!selectedCourseCd) return true;
      return String(b.course_cd) === String(selectedCourseCd) || (b.code && b.code.includes(`C${selectedCourseCd}`));
    });
    return dedupeBy(list, b => String(b.code || b.batch_cd || b.id));
  }, [batches, selectedCourseCd]);

  // ─── Filter Departments (CET Engineering vs IMS Medical) ───────────────────
  const filteredDepartments = useMemo(() => {
    return departments.filter(d => {
      const dName = (d.name || '').toLowerCase();
      const isMed = dName.includes('anatomy') || dName.includes('physiology') || d.code === 'ANA' || d.code === 'PHY';
      if (isMedicalCollege) return isMed;
      if (isMed) return false;
      if (!selectedCourseCd) return true;
      return String(d.course_cd) === String(selectedCourseCd) || dName.includes(selectedCourseCd.toLowerCase());
    });
  }, [departments, selectedCourseCd, isMedicalCollege]);

  // ─── Filter Subjects ───────────────────────────────────────────────────────
  const filteredSubjects = useMemo(() => {
    const matched = allSubjects.filter(s => {
      const sName = (s.name || '').toLowerCase();
      const sCode = (s.code || '').toLowerCase();
      const isMed = sCode.startsWith('ana') || sCode.startsWith('phy') || sName.includes('anatomy') || sName.includes('physiology');
      if (!isMedicalCollege && isMed) return false;
      if (selectedCourseCd && s.course_cd && String(s.course_cd) !== String(selectedCourseCd)) return false;
      return true;
    });
    return matched.length > 0 ? matched : allSubjects;
  }, [allSubjects, selectedCourseCd, isMedicalCollege]);

  // Filter Logbook Entries based on College
  const filteredEntries = useMemo(() => {
    return logbookEntries.filter(entry => {
      if (!isMedicalCollege) {
        if (entry.rollno.includes('MBBS')) return false;
      } else {
        if (!entry.rollno.includes('MBBS')) return false;
      }

      const matchStatus = statusFilter === 'ALL' || entry.status === statusFilter;
      const matchQuery = !searchQuery.trim() ||
        entry.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.rollno.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.activityTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.competencyCode.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchQuery;
    });
  }, [logbookEntries, statusFilter, searchQuery, isMedicalCollege]);

  const stats = useMemo(() => {
    const total = filteredEntries.length;
    const verified = filteredEntries.filter(e => e.status === 'VERIFIED').length;
    const pending = filteredEntries.filter(e => e.status === 'PENDING').length;
    const rejected = filteredEntries.filter(e => e.status === 'REJECTED').length;
    return { total, verified, pending, rejected };
  }, [filteredEntries]);

  const curCourseObj = courses.find(c => String(c.course_cd) === selectedCourseCd);

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-[#0B1120] text-[#1B1E28] dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar role={currentRole} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={currentRole === 'admin' ? 'Admin MIS Reports — Practical & LogBook Ledger' : 'Faculty MIS Reports — Practical & LogBook Ledger'} />
        
        <main className="p-6 space-y-6 flex-1 bg-[#F6F8FC] dark:bg-[#0B1120]">
          {/* Top Reports Suite Navigation Tabs */}
          <FacultyReportsNav
            activeReport="logbook"
            role={currentRole}
            stats={{
              attendanceCount: 'Sessions',
              logbookCount: `${stats.total} Entries`,
              theoryCount: 'Assessment',
            }}
          />

          {/* Title Banner */}
          <div className="bg-gradient-to-r from-[#2D2575] via-[#3B3299] to-[#2D2575] text-white p-6 rounded-[22px] shadow-[0_8px_30px_rgba(45,37,117,0.2)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase tracking-wider bg-[#00C48C] text-white px-3 py-1 rounded-full shadow-sm">
                  📖 MIS REPORT 2: LOGBOOK &amp; PRACTICAL LEDGER
                </span>
                <span className="text-white/40">•</span>
                <span className="text-xs text-indigo-200 font-semibold">
                  Course: {curCourseObj?.name || 'BCA (13)'}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white mt-2">
                Practical Competency &amp; Clinical Procedure Verification Ledger
              </h2>
              <p className="text-xs text-indigo-100/80 mt-1">
                Real-time tracking of practical logbook submissions, faculty sign-offs, clinical skill ratings, and competency verifications.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm border border-white/20"
              >
                🖨️ Print Ledger
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* STEP 1: 7-STEP HIERARCHICAL CASCADING BAR */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <div className="p-6 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
              <h3 className="text-xs font-black text-[#5B4BFF] uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#5B4BFF] text-white flex items-center justify-center text-[10px] font-bold">1</span>
                STEP 1: SELECT HIERARCHY (1. COLLEGE → 2. COURSE → 3. BRANCH → 4. BATCH → 5. SEMESTER → 6. DEPARTMENT → 7. SUBJECT)
              </h3>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#00C48C]/10 text-[#00C48C] border border-[#00C48C]/20">
                Rule 1–5 Strict Standard
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 text-xs">
              {/* 1. College (colg_cd) */}
              <div>
                <label className="block text-[10px] font-bold text-[#F36C21] uppercase mb-1">1. College *</label>
                <select
                  value={selectedColgCd}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedColgCd(val);
                    const found = colleges.find(c => String(c.colg_cd || c.code) === val);
                    if (found) {
                      setSelectedCollegeSlug(found.slug);
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('colg_cd', val);
                        localStorage.setItem('tenantSlug', found.slug);
                        localStorage.setItem('selectedTenant', found.slug);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                >
                  {colleges.map(c => (
                    <option key={c.code || c.slug} value={String(c.colg_cd || c.code)}>
                      [{c.colg_cd || c.code}] {(c.name || '').split(',')[0]}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Course (course_cd) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">2. Course *</label>
                <select
                  value={selectedCourseCd}
                  onChange={(e) => setSelectedCourseCd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                >
                  {filteredCourses.map(c => (
                    <option key={c.course_cd || c.code} value={String(c.course_cd || c.code)}>
                      {c.name} ({c.course_cd || c.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Branch (branch_cd) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">3. Branch *</label>
                <select
                  value={selectedBranchCd}
                  onChange={(e) => setSelectedBranchCd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                >
                  {filteredBranches.map(b => (
                    <option key={b.branch_cd || b.code} value={b.branch_cd || b.code}>
                      {b.name} ({b.branch_cd || b.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Batch */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">4. Batch *</label>
                <select
                  value={selectedBatchCd}
                  onChange={(e) => setSelectedBatchCd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                >
                  {filteredBatches.map(b => (
                    <option key={b.code || b.batch_cd} value={b.code || b.batch_cd}>
                      {b.name || `Batch ${b.year}`} ({b.code || b.batch_cd})
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Semester */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">5. Semester *</label>
                <select
                  value={selectedSemCd}
                  onChange={(e) => setSelectedSemCd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={String(s)}>Semester {s}</option>
                  ))}
                </select>
              </div>

              {/* 6. Department */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">6. Department *</label>
                <select
                  value={selectedDeptCd}
                  onChange={(e) => setSelectedDeptCd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                >
                  {filteredDepartments.map(d => (
                    <option key={d.name || d.code} value={d.name || d.code}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* 7. Subject */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">7. Subject *</label>
                <select
                  value={selectedSubjectCd}
                  onChange={(e) => setSelectedSubjectCd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                >
                  {filteredSubjects.map(s => (
                    <option key={s.code || s.name} value={s.code || String(s.subject_cd || '')}>
                      {s.name} ({s.code || s.subject_cd})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Total Submissions</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 shadow-xs space-y-1">
              <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Verified Sign-Offs</span>
              <p className="text-2xl font-black text-[#00C48C]">{stats.verified}</p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/40 shadow-xs space-y-1">
              <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">Pending Signatures</span>
              <p className="text-2xl font-black text-[#FFB020]">{stats.pending}</p>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/40 shadow-xs space-y-1">
              <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-wider">Revisions Required</span>
              <p className="text-2xl font-black text-[#F04438]">{stats.rejected}</p>
            </div>
          </div>

          {/* LogBook Table */}
          <div className="p-6 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                {(['ALL', 'VERIFIED', 'PENDING', 'REJECTED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition ${
                      statusFilter === st
                        ? 'bg-[#5B4BFF] text-white shadow-sm'
                        : 'bg-[#F6F8FC] dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="🔍 Search Student, Roll No, Competency..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3.5 py-2 text-xs rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-[#5B4BFF] placeholder-slate-400"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider bg-[#F6F8FC] dark:bg-slate-900/50">
                    <th className="py-3 px-3 rounded-l-xl">Roll No</th>
                    <th className="py-3 px-3">Student Name</th>
                    <th className="py-3 px-3">Competency Code</th>
                    <th className="py-3 px-3">Activity / Procedure</th>
                    <th className="py-3 px-3">Domain / Lab</th>
                    <th className="py-3 px-3 text-center">Rating</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right rounded-r-xl">Verified By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filteredEntries.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition">
                      <td className="py-3 px-3 font-mono font-bold text-[#5B4BFF]">{log.rollno}</td>
                      <td className="py-3 px-3 font-extrabold text-slate-900 dark:text-white">{log.studentName}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-indigo-50 dark:bg-indigo-950 text-[#5B4BFF] border border-indigo-200 dark:border-indigo-800/40">
                          {log.competencyCode}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200 max-w-xs">{log.activityTitle}</td>
                      <td className="py-3 px-3 text-slate-500">{log.clinicalDomain}</td>
                      <td className="py-3 px-3 text-center text-amber-500 font-bold">
                        {'★'.repeat(log.rating || 0)}{'☆'.repeat(Math.max(0, 5 - (log.rating || 0)))}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          log.status === 'VERIFIED'
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                            : log.status === 'PENDING'
                            ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                            : 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                        {log.verifiedBy || 'Pending Sign-off'}
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
