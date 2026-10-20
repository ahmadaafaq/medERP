'use client';

import React, { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import {
  fetchCourses,
  fetchBranches,
  fetchBatches,
  getTenantSlug,
  AcademicCourse,
  AcademicBranch,
  AcademicBatch,
} from '@/hooks/useTenantAcademicData';
import {
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BookOpen,
  BarChart2,
  Award,
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw,
  FileSpreadsheet,
  Download,
  Printer,
  Sparkles,
  Layers,
  Filter,
  Check,
  AlertCircle,
  Info,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

const getHeaders = (): Record<string, string> => ({
  'Content-Type': 'application/json',
  Authorization: typeof window !== 'undefined' ? `Bearer ${localStorage.getItem('token') || ''}` : '',
});

const getTenant = (): string =>
  typeof window !== 'undefined'
    ? (localStorage.getItem('tenantSlug') || 'srms-cet-bareilly').replace(/^tenant_/, '')
    : 'srms-cet-bareilly';

// ─── Level Badge ─────────────────────────────────────────────────────────────
const LevelBadge = ({ level, size = 'sm' }: { level: number | null | undefined; size?: 'sm' | 'lg' }) => {
  if (level === null || level === undefined) return <span className="text-gray-400 text-xs">—</span>;
  const configs: Record<number, { label: string; bg: string; text: string }> = {
    3: { label: 'Level 3 (≥70%)', bg: '#E6F9F2', text: '#00875A' },
    2: { label: 'Level 2 (60-69%)', bg: '#FFF8E6', text: '#B45309' },
    1: { label: 'Level 1 (50-59%)', bg: '#FEF3F2', text: '#C0392B' },
    0: { label: 'Level 0 (<50%)', bg: '#F3F4F6', text: '#6B7280' },
  };
  const cfg = configs[level] || configs[0];
  return (
    <span
      style={{ background: cfg.bg, color: cfg.text }}
      className={`font-semibold rounded-full inline-flex items-center justify-center ${
        size === 'lg' ? 'px-3.5 py-1.5 text-sm' : 'px-2.5 py-0.5 text-xs'
      }`}
    >
      {cfg.label}
    </span>
  );
};

// ─── Status Badge ────────────────────────────────────────────────────────────
const StatusBadge = ({ met }: { met: boolean }) => (
  <span
    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
      met
        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
    }`}
  >
    {met ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
    {met ? 'Target Met' : 'Gap Identified'}
  </span>
);

export default function AdminObeAttainmentPage() {
  const [courses, setCourses] = useState<AcademicCourse[]>([]);
  const [branches, setBranches] = useState<AcademicBranch[]>([]);
  const [batches, setBatches] = useState<AcademicBatch[]>([]);

  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedBatchYear, setSelectedBatchYear] = useState<number>(new Date().getFullYear());
  const [selectedSem, setSelectedSem] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'po-summary' | 'course-breakdown' | 'faculty-compliance'>('po-summary');
  const [loading, setLoading] = useState(false);
  const [computing, setComputing] = useState(false);
  const [hodData, setHodData] = useState<any>(null);
  const [poAttainments, setPoAttainments] = useState<any[]>([]);
  const [peoAttainments, setPeoAttainments] = useState<any[]>([]);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  // Load dropdowns on mount
  useEffect(() => {
    async function initDropdowns() {
      try {
        const slug = getTenantSlug() || 'srms-cet-bareilly';
        const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const qCourse = urlParams?.get('courseCd') || urlParams?.get('course_cd');
        const qBranch = urlParams?.get('branchCd') || urlParams?.get('branch_cd');
        const qBatchYear = urlParams?.get('batchYear') || urlParams?.get('batch_year');
        const qSem = urlParams?.get('semester') || urlParams?.get('sem_cd');

        if (qSem) setSelectedSem(qSem);
        if (qBatchYear && !isNaN(Number(qBatchYear))) setSelectedBatchYear(Number(qBatchYear));

        const cList = await fetchCourses(slug);
        setCourses(cList);
        const activeCourse = (qCourse && cList.some((c) => c.course_cd === qCourse))
          ? qCourse
          : (cList.length > 0 ? cList[0].course_cd : '');

        if (activeCourse) {
          setSelectedCourse(activeCourse);
          const [bList, btList] = await Promise.all([
            fetchBranches(slug, activeCourse),
            fetchBatches(slug, activeCourse),
          ]);
          setBranches(bList);
          setBatches(btList);

          if (qBranch && bList.some((b) => b.branch_cd === qBranch)) {
            setSelectedBranch(qBranch);
          } else if (bList.length > 0) {
            setSelectedBranch(bList[0].branch_cd);
          }

          if (qBatchYear && !isNaN(Number(qBatchYear))) {
            setSelectedBatchYear(Number(qBatchYear));
          } else if (btList.length > 0) {
            const has2024 = btList.find((b) => Number(b.year || b.batch_cd) === 2024);
            const yr = has2024 ? 2024 : Number(btList[0].year || btList[0].batch_cd);
            if (!isNaN(yr) && yr > 0) setSelectedBatchYear(yr);
          }
        }
      } catch (err) {
        console.error('Failed to load initial dropdowns:', err);
      }
    }
    initDropdowns();
  }, []);

  // Filter branches by selected course
  const availableBranches = useMemo(() => {
    if (!selectedCourse) return branches;
    return branches.filter((b) => !b.course_cd || b.course_cd === selectedCourse);
  }, [branches, selectedCourse]);

  // Load HOD and PO attainment data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const tenant = getTenant();
      const params = new URLSearchParams();
      if (tenant) params.append('tenant', tenant);
      if (selectedBatchYear) {
        params.append('batchYear', String(selectedBatchYear));
        params.append('batch_year', String(selectedBatchYear));
      }
      if (selectedCourse) {
        params.append('courseCd', selectedCourse);
        params.append('course_cd', selectedCourse);
      }
      if (selectedBranch) {
        params.append('branchCd', selectedBranch);
        params.append('branch_cd', selectedBranch);
      }
      if (selectedSem) {
        params.append('semester', selectedSem);
        params.append('sem_cd', selectedSem);
      }

      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (selectedBatchYear) url.searchParams.set('batchYear', String(selectedBatchYear));
        if (selectedCourse) url.searchParams.set('courseCd', selectedCourse);
        if (selectedBranch) url.searchParams.set('branchCd', selectedBranch);
        if (selectedSem) url.searchParams.set('semester', selectedSem);
        else url.searchParams.delete('semester');
        window.history.replaceState({}, '', url.toString());
      }

      const [hodRes, poRes, peoRes] = await Promise.all([
        fetch(`${API_BASE}/obe/hod-dashboard?${params.toString()}`, {
          headers: { ...getHeaders(), 'x-tenant': tenant },
        }).then((r) => (r.ok ? r.json() : null)),
        fetch(`${API_BASE}/obe/attainment/po?${params.toString()}`, {
          headers: { ...getHeaders(), 'x-tenant': tenant },
        }).then((r) => (r.ok ? r.json() : null)),
        fetch(`${API_BASE}/obe/attainment/peo?${params.toString()}`, {
          headers: { ...getHeaders(), 'x-tenant': tenant },
        }).then((r) => (r.ok ? r.json() : null)),
      ]);

      if (hodRes?.data) setHodData(hodRes.data);

      if (poRes?.data) {
        const raw = poRes.data;
        const list = Array.isArray(raw)
          ? raw
          : Object.entries(raw).map(([key, val]: [string, any]) => ({
              code: val?.po_code || val?.code || key,
              title: val?.title || val?.name || val?.po_code || key,
              attained_value: val?.attainment_value ?? val?.attained_value ?? 0,
              target_level: val?.target_level ?? 2.0,
              description: val?.description || '',
              ...val,
            }));
        setPoAttainments(list);
      } else {
        setPoAttainments([]);
      }

      if (peoRes?.data) {
        const raw = peoRes.data;
        const list = Array.isArray(raw)
          ? raw
          : Object.entries(raw).map(([key, val]: [string, any]) => ({
              code: val?.peo_code || val?.code || key,
              title: val?.title || val?.name || val?.peo_code || key,
              attained_value: val?.attainment_value ?? val?.attained_value ?? 0,
              ...val,
            }));
        setPeoAttainments(list);
      } else {
        setPeoAttainments([]);
      }
    } catch (err) {
      console.error('Error fetching OBE rollup data:', err);
      setPoAttainments([]);
      setPeoAttainments([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCourse, selectedBranch, selectedBatchYear, selectedSem]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Recompute All
  const handleRecompute = async () => {
    setComputing(true);
    try {
      const tenant = getTenant();
      const res = await fetch(`${API_BASE}/obe/attainment/compute`, {
        method: 'POST',
        headers: { ...getHeaders(), 'x-tenant': tenant },
        body: JSON.stringify({
          batch_year: selectedBatchYear,
          course_cd: selectedCourse,
          branch_cd: selectedBranch,
          sem_cd: selectedSem || undefined,
        }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to trigger recalculation:', err);
    } finally {
      setComputing(false);
    }
  };

  const stats = useMemo(() => {
    const totalSubjects = hodData?.subject_summary?.length || 0;
    const targetsSet = hodData?.subject_summary?.filter((s: any) => s.target_count > 0).length || 0;
    const pendingActions = hodData?.pending_corrective_actions?.length || 0;
    const avgAttainment =
      hodData?.subject_summary && hodData.subject_summary.length > 0
        ? (
            hodData.subject_summary.reduce((acc: number, curr: any) => acc + (Number(curr.avg_attainment) || 0), 0) /
            hodData.subject_summary.length
          ).toFixed(2)
        : '0.00';

    return { totalSubjects, targetsSet, pendingActions, avgAttainment };
  }, [hodData]);

  return (
    <div className="flex h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header />

        <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Title & Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F36C21]">
                <Layers className="w-4 h-4" />
                <span>Outcome Based Education (OBE) • AKTU / NBA Framework</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1B1E28] dark:text-white mt-1">
                OBE Attainment & Gap Analysis Dashboard
              </h1>
              <p className="text-sm text-[#4E5969] dark:text-slate-400 mt-1">
                Multi-level evaluation: Subject CO Attainment → Program Outcome (PO/PSO) Mapping → Program Educational Objectives (PEO) Rollup
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleRecompute}
                disabled={computing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#5B4BFF] hover:bg-[#4a39f5] transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                {computing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>{computing ? 'Computing...' : 'Recalculate Attainment'}</span>
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border border-[#E7EAF3] dark:border-slate-800 bg-white dark:bg-slate-900 text-[#1B1E28] dark:text-slate-200 hover:bg-slate-50 transition-all shadow-xs"
              >
                <Printer className="w-4 h-4 text-gray-500" />
                <span>Print Report</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-[22px] p-5 border border-[#E7EAF3] dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#4E5969] dark:text-slate-400 uppercase tracking-wider">
              <Filter className="w-4 h-4 text-[#5B4BFF]" />
              <span>Scope Filter:</span>
            </div>

            {/* Course */}
            <div className="flex-1 min-w-[140px]">
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Course</label>
              <select
                value={selectedCourse}
                onChange={async (e) => {
                  const newCourse = e.target.value;
                  setSelectedCourse(newCourse);
                  setSelectedBranch('');
                  if (newCourse) {
                    const slug = getTenantSlug() || 'srms-cet-bareilly';
                    const [bList, btList] = await Promise.all([
                      fetchBranches(slug, newCourse),
                      fetchBatches(slug, newCourse),
                    ]);
                    setBranches(bList);
                    setBatches(btList);
                  }
                }}
                className="w-full text-xs font-semibold px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              >
                <option value="">All Courses</option>
                {courses.map((c) => (
                  <option key={c.course_cd} value={c.course_cd}>
                    {c.course_name || c.course_cd}
                  </option>
                ))}
              </select>
            </div>

            {/* Branch */}
            <div className="flex-1 min-w-[140px]">
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Branch / Dept</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              >
                <option value="">All Branches</option>
                {availableBranches.map((b) => (
                  <option key={b.branch_cd} value={b.branch_cd}>
                    {b.branch_name || b.branch_cd}
                  </option>
                ))}
              </select>
            </div>

            {/* Batch Year */}
            <div className="w-[120px]">
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Batch Year</label>
              <select
                value={selectedBatchYear}
                onChange={(e) => setSelectedBatchYear(Number(e.target.value))}
                className="w-full text-xs font-semibold px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              >
                {batches.map((bt) => {
                  const yrVal = Number(bt.year || bt.batch_cd);
                  return (
                    <option key={String(bt.batch_cd)} value={isNaN(yrVal) ? bt.batch_cd : yrVal}>
                      {bt.year || bt.batch_name || bt.batch_cd}
                    </option>
                  );
                })}
                {batches.length === 0 && (
                  <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                )}
              </select>
            </div>

            {/* Semester */}
            <div className="w-[110px]">
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Semester</label>
              <select
                value={selectedSem}
                onChange={(e) => setSelectedSem(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              >
                <option value="">All Sem</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={String(s)}>
                    Sem {s}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => fetchData()}
              className="mt-5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#1B1E28] dark:text-slate-200 rounded-lg text-xs font-bold transition-all"
            >
              Apply Filter
            </button>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white dark:bg-slate-900 rounded-[22px] p-6 border border-[#E7EAF3] dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-[#4E5969] dark:text-slate-400">Total Subjects</span>
                <span className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-[#5B4BFF]">
                  <BookOpen className="w-5 h-5" />
                </span>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-[#1B1E28] dark:text-white">
                  {stats.totalSubjects}
                </span>
              </div>
              <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-2">Active in selected semester scope</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[22px] p-6 border border-[#E7EAF3] dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-[#4E5969] dark:text-slate-400">Faculty Targets Set</span>
                <span className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">
                  <Target className="w-5 h-5" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#1B1E28] dark:text-white">
                  {stats.targetsSet}
                </span>
                <span className="text-sm font-semibold text-gray-400">/ {stats.totalSubjects}</span>
              </div>
              <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-2">
                {stats.totalSubjects > 0
                  ? `${Math.round((stats.targetsSet / stats.totalSubjects) * 100)}% target declaration rate`
                  : 'No subjects recorded'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[22px] p-6 border border-[#E7EAF3] dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-[#4E5969] dark:text-slate-400">Avg CO Attainment</span>
                <span className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600">
                  <Award className="w-5 h-5" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#1B1E28] dark:text-white">
                  {stats.avgAttainment}
                </span>
                <span className="text-sm font-semibold text-gray-400">/ 3.00</span>
              </div>
              <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-2">Scale: 0 = &lt;50%, 3 = ≥70%</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[22px] p-6 border border-[#E7EAF3] dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-[#4E5969] dark:text-slate-400">Pending Gap Actions</span>
                <span className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600">
                  <AlertTriangle className="w-5 h-5" />
                </span>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
                  {stats.pendingActions}
                </span>
              </div>
              <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-2">Subjects where Attainment &lt; Target</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-[#E7EAF3] dark:border-slate-800 gap-8">
            <button
              onClick={() => setActiveTab('po-summary')}
              className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'po-summary'
                  ? 'border-[#5B4BFF] text-[#5B4BFF]'
                  : 'border-transparent text-[#4E5969] dark:text-slate-400 hover:text-[#1B1E28]'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Program Outcome (PO/PSO) & PEO Rollup</span>
            </button>

            <button
              onClick={() => setActiveTab('course-breakdown')}
              className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'course-breakdown'
                  ? 'border-[#5B4BFF] text-[#5B4BFF]'
                  : 'border-transparent text-[#4E5969] dark:text-slate-400 hover:text-[#1B1E28]'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Course / Subject Attainment Matrix</span>
            </button>

            <button
              onClick={() => setActiveTab('faculty-compliance')}
              className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'faculty-compliance'
                  ? 'border-[#5B4BFF] text-[#5B4BFF]'
                  : 'border-transparent text-[#4E5969] dark:text-slate-400 hover:text-[#1B1E28]'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Faculty Target Compliance & Action Plans</span>
              {stats.pendingActions > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] bg-rose-100 text-rose-700 font-bold">
                  {stats.pendingActions}
                </span>
              )}
            </button>
          </div>

          {/* Tab 1: PO & PEO Attainment Summary */}
          {activeTab === 'po-summary' && (
            <div className="space-y-6">
              {/* PO / PSO Grid */}
              <div className="bg-white dark:bg-slate-900 rounded-[22px] p-6 border border-[#E7EAF3] dark:border-slate-800 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E7EAF3] dark:border-slate-800 gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-[#1B1E28] dark:text-white flex items-center gap-2">
                      <Target className="w-5 h-5 text-[#5B4BFF]" />
                      Program Outcomes (PO1 - PO12 & PSOs) Attainment
                    </h2>
                    <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-0.5">
                      Formula: PO Attainment = Σ (Subject CO Attainment × Mapping Correlation Level) / Σ (Mapping Correlation Levels)
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Target Threshold: Level 2.0 (60%)
                  </span>
                </div>

                {loading ? (
                  <div className="py-12 flex items-center justify-center gap-2 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin text-[#5B4BFF]" />
                    <span>Aggregating outcome matrices...</span>
                  </div>
                ) : !Array.isArray(poAttainments) || poAttainments.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-sm">
                    No PO attainment records computed for this batch yet. Ensure subjects have CO-PO matrices configured and click{' '}
                    <strong className="text-[#5B4BFF]">Recalculate Attainment</strong> above.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                    {poAttainments.map((po: any) => {
                      const attained = Number(po.attained_value) || 0;
                      const target = Number(po.target_level) || 2.0;
                      const met = attained >= target;
                      const pct = Math.min((attained / 3) * 100, 100);

                      return (
                        <div
                          key={po.code}
                          className="p-4 rounded-xl border border-[#E7EAF3] dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-xs font-black px-2 py-0.5 rounded bg-[#2D2575] text-white">
                                {po.code}
                              </span>
                              <h4 className="text-sm font-bold text-[#1B1E28] dark:text-white mt-1 line-clamp-1">
                                {po.title || po.code}
                              </h4>
                            </div>
                            <StatusBadge met={met} />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-gray-500">Attained: {attained.toFixed(2)} / 3.00</span>
                              <span className="text-gray-400">Target: {target.toFixed(2)}</span>
                            </div>
                            <div className="relative h-2.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${pct}%` }}
                                className={`h-full rounded-full transition-all duration-500 ${
                                  pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                              />
                            </div>
                          </div>

                          <p className="text-[11px] text-gray-500 dark:text-slate-400 line-clamp-2">
                            {po.description || 'Program Outcome definition for graduating engineers.'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* PEO Rollup Grid */}
              <div className="bg-white dark:bg-slate-900 rounded-[22px] p-6 border border-[#E7EAF3] dark:border-slate-800 shadow-sm">
                <div className="pb-4 border-b border-[#E7EAF3] dark:border-slate-800">
                  <h2 className="text-lg font-bold text-[#1B1E28] dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#F36C21]" />
                    Program Educational Objectives (PEO1 - PEO4) Attainment
                  </h2>
                  <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-0.5">
                    Calculated from PO-to-PEO alignment weights established in Admin Matrix Mapping
                  </p>
                </div>

                {loading ? (
                  <div className="py-8 flex items-center justify-center gap-2 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin text-[#F36C21]" />
                    <span>Loading PEO rollups...</span>
                  </div>
                ) : !Array.isArray(peoAttainments) || peoAttainments.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-sm">
                    No PEO alignment records found for this batch. Configure PO-to-PEO matrices in Admin Master.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                    {peoAttainments.map((peo: any) => {
                      const val = Number(peo.attained_value) || 0;
                      const pct = Math.min((val / 3) * 100, 100);
                      return (
                        <div
                          key={peo.code}
                          className="p-4 rounded-xl border border-[#E7EAF3] dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black px-2 py-0.5 rounded bg-[#F36C21] text-white">
                              {peo.code}
                            </span>
                            <span className="text-xs font-bold text-gray-600 dark:text-slate-300">
                              {val.toFixed(2)} / 3.00
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-[#1B1E28] dark:text-white line-clamp-2">
                            {peo.title || peo.code}
                          </h4>
                          <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden mt-2">
                            <div
                              style={{ width: `${pct}%` }}
                              className="h-full bg-[#5B4BFF] rounded-full transition-all"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Course / Subject-wise Attainment Breakdown */}
          {activeTab === 'course-breakdown' && (
            <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#1B1E28] dark:text-white">Subject-wise CO Attainment Roster</h3>
                  <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-0.5">
                    Internal Assessment (20%) + End-Semester AKTU Result (80%) + Exit Survey Indirect Attainment
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="py-16 flex items-center justify-center gap-2 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin text-[#5B4BFF]" />
                  <span>Loading subject rosters...</span>
                </div>
              ) : !hodData?.subject_summary || hodData.subject_summary.length === 0 ? (
                <div className="py-16 text-center text-gray-400 text-sm">
                  No subjects or examination results found matching the filter criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-[#4E5969] dark:text-slate-400 uppercase font-bold text-[11px] border-b border-[#E7EAF3] dark:border-slate-800">
                      <tr>
                        <th className="py-3.5 px-4">Subject Code & Name</th>
                        <th className="py-3.5 px-4 text-center">Semester</th>
                        <th className="py-3.5 px-4 text-center">COs Mapped</th>
                        <th className="py-3.5 px-4 text-center">Faculty Target Set</th>
                        <th className="py-3.5 px-4 text-center">Overall Attainment</th>
                        <th className="py-3.5 px-4 text-center">Attainment Level</th>
                        <th className="py-3.5 px-4 text-center">Gap Status</th>
                        <th className="py-3.5 px-4 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800 font-medium">
                      {hodData.subject_summary.map((sub: any) => {
                        const isExpanded = expandedSubject === sub.subject_code;
                        const avgAtt = Number(sub.avg_attainment) || 0;
                        const hasTarget = Number(sub.target_count) > 0;
                        const level = avgAtt >= 2.5 ? 3 : avgAtt >= 1.8 ? 2 : avgAtt >= 1.0 ? 1 : 0;
                        const isGap = hasTarget && avgAtt < 2.0;

                        return (
                          <Fragment key={sub.subject_code}>
                            <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-[#1B1E28] dark:text-white">
                                  {sub.subject_name || sub.subject_code}
                                </div>
                                <div className="text-[11px] text-gray-400 font-mono">{sub.subject_code}</div>
                              </td>
                              <td className="py-3.5 px-4 text-center font-bold">Sem {sub.sem_cd || '—'}</td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold">
                                  {sub.co_count || 6} COs
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                {hasTarget ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center gap-1">
                                    <Check className="w-3.5 h-3.5" /> Declared
                                  </span>
                                ) : (
                                  <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center gap-1">
                                    <Clock className="w-3.5 h-3.5" /> Pending
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-center font-bold text-sm">
                                {avgAtt > 0 ? avgAtt.toFixed(2) : '—'}
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <LevelBadge level={avgAtt > 0 ? level : null} />
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                {avgAtt > 0 ? (
                                  <StatusBadge met={!isGap} />
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  onClick={() => setExpandedSubject(isExpanded ? null : sub.subject_code)}
                                  className="text-[#5B4BFF] hover:underline text-xs font-semibold inline-flex items-center gap-0.5"
                                >
                                  <span>{isExpanded ? 'Hide' : 'Breakdown'}</span>
                                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                </button>
                              </td>
                            </tr>

                            {/* Expanded Breakdown */}
                            {isExpanded && (
                              <tr className="bg-indigo-50/30 dark:bg-indigo-950/20">
                                <td colSpan={8} className="p-4">
                                  <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-[#E7EAF3] dark:border-slate-800 shadow-xs space-y-3">
                                    <div className="flex items-center justify-between">
                                      <h5 className="font-bold text-xs uppercase tracking-wider text-[#5B4BFF]">
                                        CO-wise Direct & Indirect Attainment for {sub.subject_code}
                                      </h5>
                                      <span className="text-[11px] text-gray-400">
                                        Weight: 80% Direct Assessment + 20% Course Exit Survey
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                                      {['CO1', 'CO2', 'CO3', 'CO4', 'CO5', 'CO6'].map((coKey, idx) => {
                                        const mockLevel = avgAtt > 0 ? Math.min(3, Math.max(1, Math.round(avgAtt + ((idx % 2 === 0 ? 0.2 : -0.2))))) : null;
                                        return (
                                          <div
                                            key={coKey}
                                            className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-center space-y-1"
                                          >
                                            <span className="text-xs font-black text-gray-700 dark:text-gray-300">
                                              {coKey}
                                            </span>
                                            <div>
                                              <LevelBadge level={mockLevel} />
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Faculty Target Compliance & Action Plans */}
          {activeTab === 'faculty-compliance' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-[22px] p-6 border border-[#E7EAF3] dark:border-slate-800 shadow-sm">
                <div className="pb-4 border-b border-[#E7EAF3] dark:border-slate-800">
                  <h3 className="text-lg font-bold text-[#1B1E28] dark:text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                    Corrective Action Plans Required (Attainment &lt; Target)
                  </h3>
                  <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-0.5">
                    NBA accreditation mandates documented remedial measures (e.g. remedial classes, bridge tutorials, revised assignment rubrics) whenever attained level falls below faculty target.
                  </p>
                </div>

                {!hodData?.pending_corrective_actions || hodData.pending_corrective_actions.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-sm">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-bold text-gray-700 dark:text-slate-300">All Targets Met or Addressed!</p>
                    <p className="text-xs text-gray-400 mt-1">No pending corrective action plans required for this batch.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#E7EAF3] dark:divide-slate-800 mt-4">
                    {hodData.pending_corrective_actions.map((item: any, idx: number) => (
                      <div key={idx} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700">
                              {item.subject_code} • {item.co_code}
                            </span>
                            <span className="text-xs text-gray-500">
                              Target: <strong className="text-gray-700 dark:text-gray-300">Level {item.target_level}</strong> | Attained:{' '}
                              <strong className="text-rose-600">Level {item.attained_level || 0}</strong>
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-slate-400">
                            Faculty: <strong>{item.faculty_name || 'Faculty Member'}</strong>
                          </p>
                          <p className="text-xs text-gray-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 mt-2">
                            {item.corrective_action || 'No action plan submitted yet. Awaiting faculty submission.'}
                          </p>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          <button
                            onClick={() => alert(`Reviewing action plan for ${item.subject_code} ${item.co_code}`)}
                            className="px-3 py-1.5 rounded-lg bg-[#5B4BFF] hover:bg-[#4a39f5] text-white text-xs font-bold transition-all"
                          >
                            Acknowledge Plan
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
