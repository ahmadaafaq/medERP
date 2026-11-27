'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Sidebar from '../Sidebar';
import Header from '../Header';
import { ComplianceReportData, DepartmentCompliance } from './AcademicComplianceWidget';
import PillarDrilldownModal, { PillarKey } from './PillarDrilldownModal';

interface ComplianceReportViewProps {
  role?: 'admin' | 'hod';
}

interface MasterOption {
  id: string;
  code: string;
  name: string;
  raw?: any;
}

const extractArr = (json: any): any[] => {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.data?.data)) return json.data.data;
  return [];
};

export default function ComplianceReportView({ role = 'admin' }: ComplianceReportViewProps) {
  const [data, setData] = useState<ComplianceReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cascading Master Filter States: College -> Course -> Branch -> Batch -> Semester -> Section
  const [collegesList, setCollegesList] = useState<MasterOption[]>([]);
  const [coursesList, setCoursesList] = useState<MasterOption[]>([]);
  const [branchesList, setBranchesList] = useState<MasterOption[]>([]);
  const [batchesList, setBatchesList] = useState<MasterOption[]>([]);
  const [semestersList, setSemestersList] = useState<MasterOption[]>([]);
  const [sectionsList, setSectionsList] = useState<MasterOption[]>([]);

  const [selectedCollege, setSelectedCollege] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('ALL');
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [selectedBatch, setSelectedBatch] = useState<string>('ALL');
  const [selectedSemester, setSelectedSemester] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDeptId, setExpandedDeptId] = useState<string | null>(null);
  const [drilldownPillar, setDrilldownPillar] = useState<PillarKey | null>(null);

  const getAuthContext = useCallback((overrideSlug?: string) => {
    const defaultSlug = (
      (typeof window !== 'undefined'
        ? localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || ''
        : '') || 'mdis'
    ).replace(/^tenant_/, '').replace(/^tenant-/, '');
    const slug = (overrideSlug || selectedCollege || defaultSlug).replace(/^tenant_/, '').replace(/^tenant-/, '');
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const u = typeof window !== 'undefined' ? (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })() : {};
    const userId = u.id || u.sub || '';
    const headers: Record<string, string> = {
      'x-tenant-slug': slug,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    return { slug, userId, headers };
  }, [selectedCollege]);

  // 1. Fetch Colleges & Initialize Active College
  useEffect(() => {
    const initColleges = async () => {
      const { slug, headers } = getAuthContext();
      try {
        const res = await fetch(`/api/v1/college-master/colleges?tenant=${encodeURIComponent(slug)}`, { headers, cache: 'no-store' }).catch(() => null);
        if (res && res.ok) {
          const rows = extractArr(await res.json());
          if (rows.length > 0) {
            const mapped: MasterOption[] = rows.map((c: any) => ({
              id: String(c.slug || c.code || c.id),
              code: String(c.code || c.slug || c.id),
              name: String(c.name || c.college_name || c.slug || 'College'),
              raw: c,
            }));
            setCollegesList(mapped);
            const match = mapped.find(c => c.id.toLowerCase() === slug.toLowerCase() || c.code.toLowerCase() === slug.toLowerCase()) || mapped[0];
            setSelectedCollege(match.id);
            return;
          }
        }
      } catch {}
      setCollegesList([{ id: slug, code: slug, name: slug.toUpperCase() }]);
      setSelectedCollege(slug);
    };
    initColleges();
  }, []);

  // 2. Fetch Courses when College changes
  useEffect(() => {
    if (!selectedCollege) return;
    const loadCourses = async () => {
      const { slug, headers } = getAuthContext(selectedCollege);
      try {
        const res = await fetch(`/api/v1/college-master/courses?tenant=${encodeURIComponent(slug)}`, { headers, cache: 'no-store' }).catch(() => null);
        if (res && res.ok) {
          const rows = extractArr(await res.json());
          setCoursesList(rows.map((c: any) => ({
            id: String(c.course_cd || c.code || c.id),
            code: String(c.course_cd || c.code || c.id),
            name: String(c.name || c.course_name || c.code),
            raw: c,
          })));
        }
      } catch {
        setCoursesList([]);
      }
    };
    loadCourses();
  }, [selectedCollege, getAuthContext]);

  // 3. Fetch Branches when College or Course changes
  useEffect(() => {
    if (!selectedCollege) return;
    const loadBranches = async () => {
      const { slug, headers } = getAuthContext(selectedCollege);
      const qp = new URLSearchParams({ tenant: slug });
      if (selectedCourse !== 'ALL') qp.set('course_cd', selectedCourse);
      try {
        const res = await fetch(`/api/v1/college-master/branches?${qp.toString()}`, { headers, cache: 'no-store' }).catch(() => null);
        if (res && res.ok) {
          let rows = extractArr(await res.json());
          // Filter out non-academic admin cells (e.g. SPORTS, SECURITY) that have no course_cd/branch_cd
          rows = rows.filter((b: any) => Boolean(b.course_cd || b.course_code || b.branch_cd));
          if (selectedCourse !== 'ALL') {
            const targetCrs = selectedCourse.trim().toLowerCase();
            rows = rows.filter((b: any) =>
              String(b.course_cd || b.course_code || '').trim().toLowerCase() === targetCrs
            );
          }
          setBranchesList(rows.map((b: any) => ({
            id: String(b.id || b.branch_cd || b.code),
            code: String(b.branch_cd || b.code || b.id),
            name: String(b.name || b.department_name || b.code),
            raw: b,
          })));
        }
      } catch {
        setBranchesList([]);
      }
    };
    loadBranches();
  }, [selectedCollege, selectedCourse, getAuthContext]);

  // 4. Fetch Batches when College, Course, or Branch changes
  useEffect(() => {
    if (!selectedCollege) return;
    const loadBatches = async () => {
      const { slug, headers } = getAuthContext(selectedCollege);
      const qp = new URLSearchParams({ tenant: slug });
      if (selectedCourse !== 'ALL') qp.set('course_cd', selectedCourse);
      if (selectedBranch !== 'ALL') {
        const brObj = branchesList.find(b => b.id === selectedBranch || b.code === selectedBranch);
        qp.set('branch_cd', brObj?.code || selectedBranch);
      }
      try {
        const res = await fetch(`/api/v1/college-master/batches?${qp.toString()}`, { headers, cache: 'no-store' }).catch(() => null);
        if (res && res.ok) {
          const rows = extractArr(await res.json());
          setBatchesList(rows.map((b: any) => ({
            id: String(b.id || b.batch_cd || b.code),
            code: String(b.batch_cd || b.year || b.code || b.id),
            name: String(b.name || `Batch ${b.year || b.code || b.id}`),
            raw: b,
          })));
        }
      } catch {
        setBatchesList([]);
      }
    };
    loadBatches();
  }, [selectedCollege, selectedCourse, selectedBranch, branchesList, getAuthContext]);

  // 5. Fetch Semesters / Phases when College, Course, Branch, or Batch changes
  useEffect(() => {
    if (!selectedCollege) return;
    const loadSemesters = async () => {
      const { slug, headers } = getAuthContext(selectedCollege);
      try {
        const res = await fetch(`/api/v1/college-master/professionals?tenant=${encodeURIComponent(slug)}`, { headers, cache: 'no-store' }).catch(() => null);
        if (res && res.ok) {
          let rows = extractArr(await res.json());
          if (selectedCourse !== 'ALL') {
            const byCourse = rows.filter((p: any) => !p.course_cd || String(p.course_cd).toLowerCase() === selectedCourse.toLowerCase());
            if (byCourse.length > 0) rows = byCourse;
          }
          if (rows.length > 0) {
            const seen = new Set<string>();
            const mapped: MasterOption[] = [];
            for (const p of rows) {
              const code = String(p.phase_order || p.code || p.id);
              if (!seen.has(code)) {
                seen.add(code);
                mapped.push({
                  id: code,
                  code,
                  name: String(p.name || `Semester ${code}`),
                  raw: p,
                });
              }
            }
            setSemestersList(mapped);
            return;
          }
        }
      } catch {}
      setSemestersList([1, 2, 3, 4, 5, 6, 7, 8].map(n => ({
        id: String(n),
        code: String(n),
        name: `Semester ${n}`,
      })));
    };
    loadSemesters();
  }, [selectedCollege, selectedCourse, selectedBranch, selectedBatch, getAuthContext]);

  // 6. Fetch Sections when College, Course, Branch, Batch, or Semester changes
  useEffect(() => {
    if (!selectedCollege) return;
    const loadSections = async () => {
      const { slug, headers } = getAuthContext(selectedCollege);
      const qp = new URLSearchParams({ tenant: slug });
      if (selectedCourse !== 'ALL') qp.set('courseId', selectedCourse);
      if (selectedBranch !== 'ALL') qp.set('departmentId', selectedBranch);
      if (selectedBatch !== 'ALL') qp.set('batchId', selectedBatch);
      if (selectedSemester !== 'ALL') qp.set('semester', selectedSemester);
      try {
        const res = await fetch(`/api/v1/college-master/sections?${qp.toString()}`, { headers, cache: 'no-store' }).catch(() => null);
        if (res && res.ok) {
          const rows = extractArr(await res.json());
          const seen = new Set<string>();
          const mapped: MasterOption[] = [];
          for (const s of rows) {
            const code = String(s.code || s.name || s.id);
            if (!seen.has(code)) {
              seen.add(code);
              mapped.push({
                id: code,
                code,
                name: String(s.name || `Section ${code}`),
                raw: s,
              });
            }
          }
          setSectionsList(mapped);
        }
      } catch {
        setSectionsList([]);
      }
    };
    loadSections();
  }, [selectedCollege, selectedCourse, selectedBranch, selectedBatch, selectedSemester, getAuthContext]);

  // Fetch Compliance Report whenever cascading filters change
  const fetchReport = useCallback(async () => {
    if (!selectedCollege) return;
    setLoading(true);
    setError(null);
    try {
      const { slug, userId, headers } = getAuthContext(selectedCollege);
      const qp = new URLSearchParams({ tenant: slug });
      if (role === 'hod' && userId) qp.set('hodUserId', userId);
      if (selectedCourse !== 'ALL') qp.set('courseCd', selectedCourse);
      if (selectedBranch !== 'ALL') qp.set('departmentId', selectedBranch);
      if (selectedBatch !== 'ALL') qp.set('batchId', selectedBatch);
      if (selectedSemester !== 'ALL') qp.set('semester', selectedSemester);
      if (selectedSection !== 'ALL') qp.set('section', selectedSection);

      let res = await fetch(`/api/v1/analytics/compliance-report?${qp.toString()}`, {
        headers,
        cache: 'no-store',
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch(`/analytics/compliance-report?${qp.toString()}`, {
          headers,
          cache: 'no-store',
        }).catch(() => null);
      }

      if (res && res.ok) {
        const json = await res.json();
        const payload = json?.data ?? json;
        if (payload && typeof payload === 'object' && payload.pillars) {
          setData(payload);
        } else {
          throw new Error('Invalid compliance report format.');
        }
      } else {
        throw new Error('Failed to retrieve academic compliance report.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch compliance report');
    } finally {
      setLoading(false);
    }
  }, [selectedCollege, selectedCourse, selectedBranch, selectedBatch, selectedSemester, selectedSection, role, getAuthContext]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Filtered department rows (client-side synced with selectedCourse, selectedBranch & searchQuery)
  const filteredDepartments: DepartmentCompliance[] = useMemo(() => {
    if (!data?.departments) return [];
    const q = searchQuery.trim().toLowerCase();
    const crsTarget = selectedCourse !== 'ALL' ? selectedCourse.trim().toLowerCase() : '';
    const brTarget = selectedBranch !== 'ALL' ? selectedBranch.trim().toLowerCase() : '';
    const brObj = branchesList.find(b => b.id.toLowerCase() === brTarget || b.code.toLowerCase() === brTarget);
    const brCode = brObj ? brObj.code.toLowerCase() : brTarget;

    return data.departments.filter(d => {
      if (crsTarget && String(d.courseCd || '').trim().toLowerCase() !== crsTarget) return false;
      if (brTarget) {
        const dId = String(d.departmentId || '').trim().toLowerCase();
        const dCd = String(d.departmentCode || '').trim().toLowerCase();
        if (dId !== brTarget && dCd !== brTarget && dCd !== brCode) return false;
      }
      if (!q) return true;
      return (
        d.departmentName.toLowerCase().includes(q) ||
        d.departmentCode.toLowerCase().includes(q) ||
        d.courseName.toLowerCase().includes(q) ||
        d.hodName.toLowerCase().includes(q)
      );
    });
  }, [data, selectedCourse, selectedBranch, branchesList, searchQuery]);

  // Dynamically recompute Pie Chart & Right-Side 9 Pillars from filteredDepartments!
  const dynamicStats = useMemo(() => {
    const active = filteredDepartments;
    const total = active.length;
    const compliant = active.filter(d => d.overallScore >= 80).length;
    const partial = active.filter(d => d.overallScore >= 60 && d.overallScore < 80).length;
    const attention = active.filter(d => d.overallScore < 60).length;

    if (total === 0) {
      return {
        totalDepts: 0,
        compliantCount: 0,
        partialCount: 0,
        attentionCount: 0,
        overallScore: 0,
        overallStatus: 'NEEDS_ATTENTION' as const,
        pillars: {
          copoMapping: { score: 0, label: '1. CO-PO Matrix Mapping', total: 0, compliant: 0 },
          timetable: { score: 0, label: '2. Timetable Up-to-date', total: 0, compliant: 0 },
          questionBank: { score: 0, label: '3. Question Bank', total: 0, compliant: 0 },
          questionDesign: { score: 0, label: '4. Question Design Papers', total: 0, compliant: 0 },
          approvals: { score: 0, label: '5. Academic Approvals', total: 0, compliant: 0 },
          lessonPlan: { score: 0, label: '6. Lesson Plan Materials', total: 0, compliant: 0 },
          chats: { score: 0, label: '7. Academic Chats', total: 0, compliant: 0 },
          portfolio: { score: 0, label: '8. Academic Portfolio', total: 0, compliant: 0 },
          attendance: { score: 0, label: '9. Attendance Compliance', total: 0, compliant: 0 },
        },
      };
    }

    const avg = (fn: (d: DepartmentCompliance) => number) =>
      Math.round(active.reduce((acc, d) => acc + fn(d), 0) / total);

    const pillars = {
      copoMapping: {
        score: avg(d => d.copo.percentage),
        label: '1. CO-PO Matrix Mapping',
        total: active.reduce((acc, d) => acc + d.copo.totalSubjects, 0),
        compliant: active.reduce((acc, d) => acc + d.copo.mappedSubjects, 0),
      },
      timetable: {
        score: avg(d => d.timetable.percentage),
        label: '2. Timetable Up-to-date',
        total,
        compliant: active.filter(d => d.timetable.isUpToDate).length,
      },
      questionBank: {
        score: avg(d => d.questionBank.coveragePercentage),
        label: '3. Question Bank',
        total: active.reduce((acc, d) => acc + d.questionBank.totalQuestions, 0),
        compliant: active.filter(d => d.questionBank.coveragePercentage >= 60).length,
      },
      questionDesign: {
        score: avg(d => d.questionPapers.percentage),
        label: '4. Question Design Papers',
        total: active.reduce((acc, d) => acc + d.questionPapers.totalPapers, 0),
        compliant: active.reduce((acc, d) => acc + d.questionPapers.approvedCount, 0),
      },
      approvals: {
        score: avg(d => d.approvals.approvalRate),
        label: '5. Academic Approvals',
        total: active.reduce((acc, d) => acc + d.approvals.totalQPs + d.approvals.totalTimetables, 0),
        compliant: active.reduce((acc, d) => acc + d.approvals.approvedQPs + d.approvals.approvedTimetables, 0),
      },
      lessonPlan: {
        score: avg(d => d.lessons.percentage),
        label: '6. Lesson Plan Materials',
        total: active.reduce((acc, d) => acc + d.lessons.totalMaterials, 0),
        compliant: active.reduce((acc, d) => acc + d.lessons.subjectsWithMaterials, 0),
      },
      chats: data?.pillars?.chats || {
        score: 0,
        label: '7. Academic Chats',
        total: 0,
        compliant: 0,
      },
      portfolio: {
        score: avg(d => d.portfolio.overallScore),
        label: '8. Academic Portfolio',
        total: active.reduce((acc, d) => acc + d.portfolio.seminarsCount + d.portfolio.tutorialsCount + d.portfolio.miniProjectsCount, 0),
        compliant: active.reduce((acc, d) => acc + d.portfolio.verifiedSeminars + d.portfolio.verifiedTutorials + d.portfolio.verifiedMiniProjects, 0),
      },
      attendance: {
        score: avg(d => d.attendance.attendanceRate),
        label: '9. Attendance Compliance',
        total: active.reduce((acc, d) => acc + d.attendance.totalRecords, 0),
        compliant: active.reduce((acc, d) => acc + d.attendance.presentRecords, 0),
      },
    };

    const overallScore = avg(d => d.overallScore);
    const overallStatus = overallScore >= 80 ? 'EXCELLENT' : overallScore >= 60 ? 'GOOD' : 'NEEDS_ATTENTION';

    return {
      totalDepts: total,
      compliantCount: compliant,
      partialCount: partial,
      attentionCount: attention,
      overallScore,
      overallStatus,
      pillars,
    };
  }, [filteredDepartments, data]);

  // Multi-segment Donut SVG geometry
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const denom = dynamicStats.totalDepts || 1;
  const pctCompliant = (dynamicStats.compliantCount / denom) * 100;
  const pctPartial = (dynamicStats.partialCount / denom) * 100;
  const pctAttention = (dynamicStats.attentionCount / denom) * 100;

  const dashCompliant = (pctCompliant / 100) * circumference;
  const dashPartial = (pctPartial / 100) * circumference;
  const dashAttention = (pctAttention / 100) * circumference;

  const score = dynamicStats.overallScore;

  return (
    <div className="flex h-screen bg-[#F6F8FC] dark:bg-slate-950 overflow-hidden font-sans">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header title="Academic & Operational Compliance Report" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* Top Title & Actions Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800 shadow-soft p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5B4BFF] to-[#F36C21] text-white flex items-center justify-center text-2xl font-black shadow-md shadow-indigo-500/20">
                📊
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-[#1B1E28] dark:text-white tracking-tight">
                    Academic &amp; Operational Compliance Report
                  </h1>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-[#5B4BFF] border border-indigo-200 dark:border-indigo-800">
                    {role === 'hod' ? 'HOD Scoped View' : 'Institution Executive View'}
                  </span>
                </div>
                <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-0.5">
                  Automated department &amp; course-wise auditing across CO-PO mapping, timetable, question bank, lesson plans &amp; attendance.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={fetchReport}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className={loading ? 'animate-spin' : ''}>🔄</span>
                <span>Refresh Data</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#5B4BFF] to-[#7867FF] hover:from-[#4a3be6] hover:to-[#6756eb] text-white text-xs font-extrabold shadow-md shadow-indigo-500/25 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>🖨️</span>
                <span>Print / Export PDF</span>
              </button>
            </div>
          </div>

          {/* Cascading Master Filtering Bar: College -> Course -> Branch -> Batch -> Semester -> Section */}
          <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800 shadow-soft p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#F36C21]">
                Cascading Academic Filters (College → Course → Branch → Batch → Semester → Section)
              </span>
              {(selectedCourse !== 'ALL' || selectedBranch !== 'ALL' || selectedBatch !== 'ALL' || selectedSemester !== 'ALL' || selectedSection !== 'ALL' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCourse('ALL');
                    setSelectedBranch('ALL');
                    setSelectedBatch('ALL');
                    setSelectedSemester('ALL');
                    setSelectedSection('ALL');
                    setSearchQuery('');
                  }}
                  className="text-[11px] font-bold text-[#5B4BFF] hover:underline cursor-pointer"
                >
                  ↺ Reset Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5 items-end">
              {/* 1. College */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">1. College</label>
                <select
                  value={selectedCollege}
                  onChange={e => {
                    setSelectedCollege(e.target.value);
                    setSelectedCourse('ALL');
                    setSelectedBranch('ALL');
                    setSelectedBatch('ALL');
                    setSelectedSemester('ALL');
                    setSelectedSection('ALL');
                  }}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-xs focus:outline-none focus:border-[#5B4BFF]"
                >
                  {collegesList.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* 2. Course */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">2. Course ({coursesList.length})</label>
                <select
                  value={selectedCourse}
                  onChange={e => {
                    setSelectedCourse(e.target.value);
                    setSelectedBranch('ALL');
                    setSelectedBatch('ALL');
                    setSelectedSemester('ALL');
                    setSelectedSection('ALL');
                  }}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-xs focus:outline-none focus:border-[#5B4BFF]"
                >
                  <option value="ALL">All Courses ({coursesList.length})</option>
                  {coursesList.map(c => (
                    <option key={c.id} value={c.code}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              {/* 3. Branch / Department */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">3. Branch ({branchesList.length})</label>
                <select
                  value={selectedBranch}
                  onChange={e => {
                    setSelectedBranch(e.target.value);
                    setSelectedBatch('ALL');
                    setSelectedSemester('ALL');
                    setSelectedSection('ALL');
                  }}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-xs focus:outline-none focus:border-[#5B4BFF]"
                >
                  <option value="ALL">All Branches ({branchesList.length})</option>
                  {branchesList.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* 4. Batch */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">4. Batch ({batchesList.length})</label>
                <select
                  value={selectedBatch}
                  onChange={e => {
                    setSelectedBatch(e.target.value);
                    setSelectedSemester('ALL');
                    setSelectedSection('ALL');
                  }}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-xs focus:outline-none focus:border-[#5B4BFF]"
                >
                  <option value="ALL">All Batches ({batchesList.length})</option>
                  {batchesList.map(b => (
                    <option key={b.id} value={b.code}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* 5. Semester */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">5. Semester ({semestersList.length})</label>
                <select
                  value={selectedSemester}
                  onChange={e => {
                    setSelectedSemester(e.target.value);
                    setSelectedSection('ALL');
                  }}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-xs focus:outline-none focus:border-[#5B4BFF]"
                >
                  <option value="ALL">All Semesters ({semestersList.length})</option>
                  {semestersList.map(s => (
                    <option key={s.id} value={s.code}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* 6. Section */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">6. Section ({sectionsList.length})</label>
                <select
                  value={selectedSection}
                  onChange={e => setSelectedSection(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-xs focus:outline-none focus:border-[#5B4BFF]"
                >
                  <option value="ALL">All Sections ({sectionsList.length})</option>
                  {sectionsList.map(sec => (
                    <option key={sec.id} value={sec.code}>{sec.name}</option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Quick Search</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Department, course, HOD..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:border-[#5B4BFF]"
                />
              </div>
            </div>
          </div>

          {/* Graphical Executive Overview: Pie Chart + 9 Macro Pillars */}
          {loading ? (
            <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800 p-12 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full border-3 border-[#5B4BFF] border-t-transparent animate-spin" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                Generating Department Academic Compliance Matrix...
              </p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl p-6 text-center space-y-2">
              <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{error}</p>
              <button
                onClick={fetchReport}
                className="px-4 py-1.5 rounded-xl bg-[#5B4BFF] text-white text-xs font-bold"
              >
                Retry
              </button>
            </div>
          ) : !data || !dynamicStats.pillars ? null : (
            <>
              {/* Graphical Overview Card */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Visual Chart Card */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800 shadow-soft p-6 flex flex-col items-center justify-between">
                  <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-extrabold text-[#1B1E28] dark:text-white">
                      Department Compliance Distribution
                    </h3>
                    <span className="text-[11px] font-bold text-slate-400">
                      {dynamicStats.totalDepts} Department{dynamicStats.totalDepts === 1 ? '' : 's'}
                    </span>
                  </div>

                  {/* Pure React SVG Multi-Segment Pie / Donut Chart */}
                  <div className="py-6 flex flex-col items-center justify-center w-full">
                    <div className="relative w-44 h-44 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                        {/* Outer base track */}
                        <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="18" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                        {/* Attention Needed Slice (Rose) */}
                        {dashAttention > 0 && (
                          <circle
                            cx="80"
                            cy="80"
                            r={radius}
                            stroke="#F04438"
                            strokeWidth="18"
                            strokeDasharray={`${dashAttention} ${circumference}`}
                            strokeDashoffset={-(dashCompliant + dashPartial)}
                            fill="transparent"
                            className="transition-all duration-700"
                          />
                        )}
                        {/* Moderate Slice (Amber) */}
                        {dashPartial > 0 && (
                          <circle
                            cx="80"
                            cy="80"
                            r={radius}
                            stroke="#FFB020"
                            strokeWidth="18"
                            strokeDasharray={`${dashPartial} ${circumference}`}
                            strokeDashoffset={-dashCompliant}
                            fill="transparent"
                            className="transition-all duration-700"
                          />
                        )}
                        {/* Compliant Slice (Green) */}
                        {dashCompliant > 0 && (
                          <circle
                            cx="80"
                            cy="80"
                            r={radius}
                            stroke="#00C48C"
                            strokeWidth="18"
                            strokeDasharray={`${dashCompliant} ${circumference}`}
                            strokeDashoffset={0}
                            fill="transparent"
                            className="transition-all duration-700"
                          />
                        )}
                      </svg>
                      {/* Center Score */}
                      <div className="absolute flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-black text-[#1B1E28] dark:text-white">
                          {score}%
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 ${score >= 80 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : score >= 60 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                          {(dynamicStats.overallStatus || 'NEEDS_ATTENTION').replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Chart Legend */}
                    <div className="grid grid-cols-3 gap-2 mt-4 w-full text-center">
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                        <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">Compliant (80%+)</p>
                        <p className="text-base font-black text-emerald-700 dark:text-emerald-400">{dynamicStats.compliantCount}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                        <p className="text-[10px] font-bold text-amber-800 dark:text-amber-300">Moderate (60-79%)</p>
                        <p className="text-base font-black text-amber-700 dark:text-amber-400">{dynamicStats.partialCount}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                        <p className="text-[10px] font-bold text-rose-800 dark:text-rose-300">Attention (&lt;60%)</p>
                        <p className="text-base font-black text-rose-700 dark:text-rose-400">{dynamicStats.attentionCount}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 9 Macro Pillars Cards Grid */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800 shadow-soft p-6 space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-extrabold text-[#1B1E28] dark:text-white">
                      The 9 Institutional Academic Compliance Pillars
                    </h3>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {selectedCourse !== 'ALL' ? `Filtered: ${selectedCourse}` : 'Standardized Quality Scorecard'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      { key: 'copo' as PillarKey, icon: '🎯', label: '1. CO-PO Matrix Mapping', stat: dynamicStats.pillars.copoMapping },
                      { key: 'timetable' as PillarKey, icon: '📅', label: '2. Timetable Up-to-date', stat: dynamicStats.pillars.timetable },
                      { key: 'qb' as PillarKey, icon: '📚', label: '3. Question Bank & Bloom\'s', stat: dynamicStats.pillars.questionBank },
                      { key: 'qp' as PillarKey, icon: '📝', label: '4. Question Design Paper', stat: dynamicStats.pillars.questionDesign },
                      { key: 'approvals' as PillarKey, icon: '✅', label: '5. Academic Approvals', stat: dynamicStats.pillars.approvals },
                      { key: 'lessons' as PillarKey, icon: '📖', label: '6. Lesson Plan Materials', stat: dynamicStats.pillars.lessonPlan },
                      { key: 'chats' as PillarKey, icon: '💬', label: '7. Academic Chats', stat: dynamicStats.pillars.chats },
                      { key: 'portfolio' as PillarKey, icon: '💼', label: '8. Portfolio (Seminar/MiniProj)', stat: dynamicStats.pillars.portfolio },
                      { key: 'attendance' as PillarKey, icon: '👥', label: '9. Student Attendance', stat: dynamicStats.pillars.attendance },
                    ].map(p => (
                      <div
                        key={p.label}
                        onClick={() => setDrilldownPillar(p.key)}
                        title="Click to open detailed Donut & Tabular breakdown"
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-[#5B4BFF] hover:shadow-sm transition-all cursor-pointer space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate">
                            <span>{p.icon}</span>
                            <span className="truncate">{p.label}</span>
                          </span>
                          <span className={`text-xs font-black px-1.5 py-0.5 rounded ${p.stat.score >= 80 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : p.stat.score >= 50 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                            {p.stat.score}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.max(0, p.stat.score))}%`,
                              backgroundColor: p.stat.score >= 80 ? '#00C48C' : p.stat.score >= 50 ? '#FFB020' : '#F04438'
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                          <span>Verified: {p.stat.compliant}</span>
                          <span>Total: {p.stat.total}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Department & Course Comprehensive Compliance Table */}
              <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800 shadow-soft p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-black text-[#1B1E28] dark:text-white">
                      Department, Course &amp; Branch Compliance Matrix
                    </h3>
                    <p className="text-xs text-[#4E5969] dark:text-slate-400">
                      Showing {filteredDepartments.length} department branch{filteredDepartments.length === 1 ? '' : 'es'}. Click any row to view subject-level CO-PO mapping checklist.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-800">
                        <th className="py-3 px-3">#</th>
                        <th className="py-3 px-3">Department &amp; HOD</th>
                        <th className="py-3 px-3">Course</th>
                        <th className="py-3 px-3">1. CO-PO Matrix</th>
                        <th className="py-3 px-3">2. Timetable</th>
                        <th className="py-3 px-3">3. Question Bank</th>
                        <th className="py-3 px-3">4. Question Paper</th>
                        <th className="py-3 px-3">5. Approvals</th>
                        <th className="py-3 px-3">6. Lessons</th>
                        <th className="py-3 px-3">8. Portfolio</th>
                        <th className="py-3 px-3">9. Attendance</th>
                        <th className="py-3 px-3 text-right">Overall Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredDepartments.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="py-8 text-center text-slate-400 font-bold">
                            No departments found matching the selected filters.
                          </td>
                        </tr>
                      ) : (
                        filteredDepartments.map((dept, idx) => {
                          const isExpanded = expandedDeptId === dept.departmentId;
                          return (
                            <React.Fragment key={dept.departmentId || idx}>
                              <tr
                                onClick={() => setExpandedDeptId(isExpanded ? null : dept.departmentId)}
                                className={`cursor-pointer transition-colors ${isExpanded ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                              >
                                <td className="py-3 px-3 font-bold text-slate-400">
                                  {idx + 1}
                                </td>
                                <td className="py-3 px-3">
                                  <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <span>{dept.departmentName}</span>
                                    <span className="text-[10px] text-indigo-500 font-mono">[{dept.departmentCode}]</span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                    HOD: <span className="font-bold text-slate-700 dark:text-slate-300">{dept.hodName}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                                  <div>{dept.courseName}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">#{dept.courseCd}</div>
                                </td>
                                <td className="py-3 px-3">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${dept.copo.percentage >= 80 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : dept.copo.percentage >= 40 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                                    <span>{dept.copo.mappedSubjects}/{dept.copo.totalSubjects}</span>
                                    <span>({dept.copo.percentage}%)</span>
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${dept.timetable.isUpToDate ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}`}>
                                    <span>{dept.timetable.isUpToDate ? '✓ Active Slots' : `${dept.timetable.draftsCount} Draft`}</span>
                                  </span>
                                </td>
                                <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                                  <span>{dept.questionBank.totalQuestions} Qs</span>
                                </td>
                                <td className="py-3 px-3">
                                  <span className="font-bold text-slate-700 dark:text-slate-300">
                                    {dept.questionPapers.totalPapers} Papers
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${dept.approvals.approvalRate >= 70 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}`}>
                                    {dept.approvals.approvalRate}%
                                  </span>
                                </td>
                                <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                                  {dept.lessons.totalMaterials} Files
                                </td>
                                <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                                  {dept.portfolio.overallScore}%
                                </td>
                                <td className="py-3 px-3 font-extrabold text-cyan-600 dark:text-cyan-400">
                                  {dept.attendance.attendanceRate}%
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <span className={`inline-block px-2.5 py-1 rounded-xl text-xs font-black shadow-sm ${dept.overallScore >= 80 ? 'bg-[#00C48C] text-white' : dept.overallScore >= 60 ? 'bg-[#FFB020] text-white' : 'bg-[#F04438] text-white'}`}>
                                    {dept.overallScore}% ({dept.overallGrade})
                                  </span>
                                </td>
                              </tr>

                              {/* Accordion Row Details: Subject-wise checklist */}
                              {isExpanded && (
                                <tr className="bg-slate-50/80 dark:bg-slate-800/60">
                                  <td colSpan={12} className="p-4 sm:p-5">
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                        <h4 className="text-xs font-black text-[#5B4BFF] uppercase tracking-wider flex items-center gap-1.5">
                                          <span>🎯</span>
                                          <span>Subject-wise CO-PO Matrix Mapping Checklist for {dept.departmentName}</span>
                                        </h4>
                                        <span className="text-[11px] font-bold text-slate-500">
                                          {dept.copo.mappedSubjects} of {dept.copo.totalSubjects} subjects fully mapped
                                        </span>
                                      </div>

                                      {/* Subject Checklist */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                        {dept.copo.subjectList.length === 0 ? (
                                          <p className="text-xs text-slate-400">No subjects currently active under this department.</p>
                                        ) : (
                                          dept.copo.subjectList.map(s => (
                                            <div
                                              key={s.code}
                                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${s.isMapped ? 'border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20' : 'border-rose-200 dark:border-rose-800/80 bg-rose-50/40 dark:bg-rose-950/20'}`}
                                            >
                                              <div className="min-w-0">
                                                <p className="font-extrabold text-slate-900 dark:text-white truncate">
                                                  [{s.code}] {s.name}
                                                </p>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                                  Course: {dept.courseCd}
                                                </p>
                                              </div>
                                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${s.isMapped ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                                                {s.isMapped ? '✓ Mapped' : 'Pending'}
                                              </span>
                                            </div>
                                          ))
                                        )}
                                      </div>

                                      {/* Additional Pillar Details (Blooms Levels & Academic Portfolio) */}
                                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                        <div>
                                          <p className="font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                                            <span>📚</span> Bloom&apos;s Taxonomy Question Coverage
                                          </p>
                                          <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold">L1 Rem: {dept.questionBank.bloomsBreakdown.remembering}</span>
                                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold">L2 Und: {dept.questionBank.bloomsBreakdown.understanding}</span>
                                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold">L3 App: {dept.questionBank.bloomsBreakdown.applying}</span>
                                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold">L4 Ana: {dept.questionBank.bloomsBreakdown.analyzing}</span>
                                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold">L5/6 Eva/Cre: {dept.questionBank.bloomsBreakdown.evaluating + dept.questionBank.bloomsBreakdown.creating}</span>
                                          </div>
                                        </div>

                                        <div>
                                          <p className="font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                                            <span>💼</span> Portfolio (Seminars / Tutorials / Projects)
                                          </p>
                                          <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                                            Seminars: {dept.portfolio.seminarsCount} ({dept.portfolio.verifiedSeminars} verified) • Tutorials: {dept.portfolio.tutorialsCount} • Projects: {dept.portfolio.miniProjectsCount}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Interactive Pillar Drill-Down Popup Modal */}
      <PillarDrilldownModal
        pillarKey={drilldownPillar}
        collegeName={data?.collegeName || 'Institution'}
        departments={filteredDepartments}
        onClose={() => setDrilldownPillar(null)}
      />
    </div>
  );
}
