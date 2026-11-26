'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export interface PillarStat {
  score: number;
  label: string;
  total: number;
  compliant: number;
}

export interface DepartmentCompliance {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  courseCd: string;
  courseName: string;
  hodName: string;
  hodUserId: string;
  copo: {
    totalSubjects: number;
    mappedSubjects: number;
    percentage: number;
    status: 'COMPLIANT' | 'PARTIAL' | 'PENDING';
    subjectList: Array<{ code: string; name: string; isMapped: boolean }>;
  };
  timetable: {
    activeSlotsCount: number;
    draftsCount: number;
    approvedDraftsCount: number;
    isUpToDate: boolean;
    percentage: number;
    status: 'UP_TO_DATE' | 'PARTIAL' | 'NEEDS_UPDATE';
  };
  questionBank: {
    totalQuestions: number;
    coveragePercentage: number;
    bloomsBreakdown: {
      remembering: number;
      understanding: number;
      applying: number;
      analyzing: number;
      evaluating: number;
      creating: number;
    };
    status: 'EXCELLENT' | 'ADEQUATE' | 'NEEDS_QUESTIONS';
  };
  questionPapers: {
    totalPapers: number;
    draftCount: number;
    submittedCount: number;
    approvedCount: number;
    evaluatedCount?: number;
    percentage: number;
    status: 'READY' | 'IN_PROGRESS' | 'PENDING';
  };
  approvals: {
    approvedQPs: number;
    totalQPs: number;
    approvedTimetables: number;
    totalTimetables: number;
    approvalRate: number;
    status: 'APPROVED' | 'PARTIALLY_APPROVED' | 'PENDING';
  };
  lessons: {
    totalMaterials: number;
    subjectsWithMaterials: number;
    totalSubjects: number;
    percentage: number;
    status: 'UP_TO_DATE' | 'PARTIAL' | 'BEHIND';
  };
  chats: {
    activeGroups: number;
    totalMessages: number;
    status: 'ACTIVE' | 'QUIET' | 'INACTIVE';
  };
  portfolio: {
    seminarsCount: number;
    verifiedSeminars: number;
    tutorialsCount: number;
    verifiedTutorials: number;
    miniProjectsCount: number;
    verifiedMiniProjects: number;
    overallScore: number;
    status: 'ACTIVE' | 'IN_PROGRESS' | 'PENDING';
  };
  attendance: {
    totalSessions: number;
    totalRecords: number;
    presentRecords: number;
    attendanceRate: number;
    status: 'HEALTHY' | 'MODERATE' | 'LOW';
  };
  overallScore: number;
  overallGrade: 'A+' | 'A' | 'B' | 'C' | 'D';
  overallStatus: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION';
}

export interface ComplianceReportData {
  collegeName: string;
  collegeCode: string;
  tenantSlug: string;
  generatedAt: string;
  overallScore: number;
  overallStatus: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION';
  pillars: {
    copoMapping: PillarStat;
    timetable: PillarStat;
    questionBank: PillarStat;
    questionDesign: PillarStat;
    approvals: PillarStat;
    lessonPlan: PillarStat;
    chats: PillarStat;
    portfolio: PillarStat;
    attendance: PillarStat;
  };
  departments: DepartmentCompliance[];
}

interface AcademicComplianceWidgetProps {
  role?: 'admin' | 'hod';
  departmentId?: string;
  courseCd?: string;
  compact?: boolean;
}

export default function AcademicComplianceWidget({
  role = 'admin',
  departmentId,
  courseCd,
  compact = false,
}: AcademicComplianceWidgetProps) {
  const [data, setData] = useState<ComplianceReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chart' | 'pillars' | 'departments'>('chart');
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchComplianceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const slug = (
        (typeof window !== 'undefined'
          ? localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || ''
          : '') || 'mdis'
      ).replace(/^tenant_/, '').replace(/^tenant-/, '');

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const u = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
      const userId = u.id || u.sub || '';

      const qp = new URLSearchParams({ tenant: slug });
      if (departmentId) qp.set('departmentId', departmentId);
      if (courseCd) qp.set('courseCd', courseCd);
      if (role === 'hod' && userId) qp.set('hodUserId', userId);

      const headers: Record<string, string> = {
        'x-tenant-slug': slug,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

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
        throw new Error('Failed to load compliance analytics.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch compliance report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplianceData();
  }, [departmentId, courseCd, role]);

  const reportUrl = role === 'hod' ? '/dashboard/hod/compliance-report' : '/dashboard/admin/compliance-report';

  // SVG Pie / Donut calculation helpers
  const score = data?.overallScore || 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const scoreColor =
    score >= 80 ? '#00C48C' :
    score >= 60 ? '#FFB020' : '#F04438';

  const pillarList = data?.pillars ? [
    { key: 'copo', name: '1. CO-PO Matrix Mapping', stat: data.pillars.copoMapping, color: '#5B4BFF', icon: '🎯' },
    { key: 'timetable', name: '2. Timetable Up-to-date', stat: data.pillars.timetable, color: '#F36C21', icon: '📅' },
    { key: 'qb', name: '3. Question Bank & Bloom\'s', stat: data.pillars.questionBank, color: '#00C48C', icon: '📚' },
    { key: 'qp', name: '4. Question Design Paper', stat: data.pillars.questionDesign, color: '#7867FF', icon: '📝' },
    { key: 'approvals', name: '5. Academic Approvals (QP/TT)', stat: data.pillars.approvals, color: '#10B981', icon: '✅' },
    { key: 'lessons', name: '6. Lesson Plan Materials', stat: data.pillars.lessonPlan, color: '#3B82F6', icon: '📖' },
    { key: 'chats', name: '7. Academic Chats', stat: data.pillars.chats, color: '#8B5CF6', icon: '💬' },
    { key: 'portfolio', name: '8. Portfolio (Seminar/Tutorial/Project)', stat: data.pillars.portfolio, color: '#EC4899', icon: '💼' },
    { key: 'attendance', name: '9. Student Attendance', stat: data.pillars.attendance, color: '#06B6D4', icon: '👥' },
  ] : [];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800 shadow-soft p-5 sm:p-6 transition-all">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/10 to-orange-500/10 text-[#5B4BFF] font-black text-lg">
              📊
            </span>
            <div>
              <h3 className="text-base font-extrabold text-[#1B1E28] dark:text-white flex items-center gap-2">
                <span>Academic Compliance &amp; Operational Monitoring</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-[#5B4BFF] border border-indigo-200 dark:border-indigo-800">
                  {role === 'hod' ? 'HOD Scope' : 'Institution-wide'}
                </span>
              </h3>
              <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-0.5">
                Real-time tracking of CO-PO matrix mapping, timetables, question banks, approvals, lesson materials &amp; attendance.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Quick Tab switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('chart')}
              className={`px-3 py-1 rounded-lg transition-all ${activeTab === 'chart' ? 'bg-white dark:bg-slate-700 text-[#5B4BFF] shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}`}
            >
              Donut View
            </button>
            <button
              onClick={() => setActiveTab('pillars')}
              className={`px-3 py-1 rounded-lg transition-all ${activeTab === 'pillars' ? 'bg-white dark:bg-slate-700 text-[#5B4BFF] shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}`}
            >
              9 Pillars
            </button>
            <button
              onClick={() => setActiveTab('departments')}
              className={`px-3 py-1 rounded-lg transition-all ${activeTab === 'departments' ? 'bg-white dark:bg-slate-700 text-[#5B4BFF] shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}`}
            >
              Departments ({data?.departments?.length || 0})
            </button>
          </div>

          <Link
            href={reportUrl}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#5B4BFF] to-[#7867FF] hover:from-[#4b3be6] hover:to-[#6756eb] text-white text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-all"
          >
            <span>Full Report</span>
            <span>↗</span>
          </Link>
        </div>
      </div>

      {/* Body Content */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#5B4BFF] border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Synthesizing department compliance &amp; academic matrices...
          </p>
        </div>
      ) : error ? (
        <div className="py-8 text-center space-y-2">
          <p className="text-sm font-semibold text-rose-500">{error}</p>
          <button
            onClick={fetchComplianceData}
            className="text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200"
          >
            Retry
          </button>
        </div>
      ) : !data ? null : (
        <div className="pt-4 space-y-4">
          {/* TAB 1: CHART OVERVIEW (Multi-Colored Segmented Donut + Working Courses/Branches) */}
          {activeTab === 'chart' && (() => {
            const activeSlices = pillarList.filter(p => p.stat.score > 0);
            const totalSliceWeight = activeSlices.reduce((acc, p) => acc + p.stat.score, 0) || 1;
            let cumulativeOffset = 0;
            const focusedPillar = hoveredSlice ? pillarList.find(p => p.key === hoveredSlice) : null;
            const totalEvaluations = (data.departments || []).reduce((acc, d) => acc + (d.questionPapers?.evaluatedCount || 0), 0);
            const topWorkingDepts = [...(data.departments || [])]
              .sort((a, b) => b.overallScore - a.overallScore)
              .slice(0, 6);

            return (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                {/* Multi-Colored Graphical Donut View */}
                <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                      {/* Background Track */}
                      <circle
                        cx="70"
                        cy="70"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="16"
                        fill="transparent"
                        className="text-slate-200 dark:text-slate-700"
                      />
                      {/* Distinct Colored Slices for Active Pillars */}
                      {activeSlices.map((p) => {
                        const segLength = (p.stat.score / totalSliceWeight) * circumference;
                        const offset = -cumulativeOffset;
                        cumulativeOffset += segLength;
                        const isHovered = hoveredSlice === p.key;
                        return (
                          <circle
                            key={p.key}
                            cx="70"
                            cy="70"
                            r={radius}
                            stroke={p.color}
                            strokeWidth={isHovered ? 20 : 16}
                            strokeDasharray={`${segLength} ${circumference}`}
                            strokeDashoffset={offset}
                            fill="transparent"
                            className="transition-all duration-300 cursor-pointer"
                            onMouseEnter={() => setHoveredSlice(p.key)}
                            onMouseLeave={() => setHoveredSlice(null)}
                          />
                        );
                      })}
                    </svg>
                    {/* Center Score / Focused Slice Label */}
                    <div className="absolute flex flex-col items-center justify-center text-center px-3 pointer-events-none">
                      <span className="text-2xl font-black text-[#1B1E28] dark:text-white leading-none">
                        {focusedPillar ? `${focusedPillar.stat.score}%` : `${score}%`}
                      </span>
                      <span className="text-[9px] font-extrabold text-slate-600 dark:text-slate-300 mt-1 uppercase tracking-wider leading-tight max-w-[90px] truncate">
                        {focusedPillar ? focusedPillar.name.replace(/^\d+\.\s*/, '') : (data.overallStatus || 'NEEDS_ATTENTION').replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Overall Score Pill + Theory Evaluation Counter */}
                  <div className="mt-3 text-center space-y-1.5">
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${score >= 80 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : score >= 60 ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'}`}>
                        <span>●</span> Overall: {score}/100
                      </span>
                      {totalEvaluations > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-[#5B4BFF]">
                          ✍️ {totalEvaluations} Theory Evaluated
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Working Courses & Branches Compliance Strip */}
                  {topWorkingDepts.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-700/60 w-full">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 text-center">
                        Courses &amp; Branches Working Status
                      </p>
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {topWorkingDepts.map((d) => (
                          <span
                            key={d.departmentId}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${d.overallScore >= 60 ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300' : d.overallScore > 0 ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300' : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
                          >
                            {d.courseName} ({d.departmentName}): <b>{d.overallScore}%</b>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Pillars Quick Summary List with Slice Color Dots */}
                <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {pillarList.map(p => (
                    <div
                      key={p.key}
                      onMouseEnter={() => setHoveredSlice(p.key)}
                      onMouseLeave={() => setHoveredSlice(null)}
                      className={`p-3 rounded-xl border bg-white dark:bg-slate-800/60 flex items-center justify-between gap-3 transition-all cursor-pointer ${hoveredSlice === p.key ? 'border-[#5B4BFF] shadow-md ring-1 ring-[#5B4BFF]/30' : 'border-slate-200/80 dark:border-slate-800 hover:shadow-sm'}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="text-base shrink-0">{p.icon}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#1B1E28] dark:text-white truncate">
                            {p.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {p.key === 'qp' && totalEvaluations > 0
                              ? `${p.stat.compliant} / ${p.stat.total} • ${totalEvaluations} eval`
                              : `${p.stat.compliant} / ${p.stat.total} verified`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="text-xs font-black px-2 py-0.5 rounded-lg text-white"
                          style={{ backgroundColor: p.stat.score >= 80 ? '#00C48C' : p.stat.score >= 50 ? '#FFB020' : p.stat.score > 0 ? p.color : '#F04438' }}
                        >
                          {p.stat.score}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* TAB 2: DETAILED 9 PILLARS PROGRESS */}
          {activeTab === 'pillars' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {pillarList.map(p => (
                  <div key={p.key} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span>{p.icon}</span>
                        <span className="truncate">{p.name}</span>
                      </span>
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {p.stat.score}%
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(0, p.stat.score))}%`,
                          backgroundColor: p.stat.score >= 80 ? '#00C48C' : p.stat.score >= 50 ? '#FFB020' : '#F04438'
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                      <span>Compliant: {p.stat.compliant}</span>
                      <span>Total: {p.stat.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DEPARTMENTS BREAKDOWN TABLE */}
          {activeTab === 'departments' && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2.5 px-3">Department &amp; Branch</th>
                    <th className="py-2.5 px-3">Course</th>
                    <th className="py-2.5 px-3">1. CO-PO Matrix</th>
                    <th className="py-2.5 px-3">2. Timetable</th>
                    <th className="py-2.5 px-3">3. Question Bank</th>
                    <th className="py-2.5 px-3">4. Question Paper</th>
                    <th className="py-2.5 px-3">6. Lesson Materials</th>
                    <th className="py-2.5 px-3">9. Attendance</th>
                    <th className="py-2.5 px-3 text-right">Overall Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.departments.map(d => (
                    <tr key={d.departmentId} className="hover:bg-indigo-50/20 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-extrabold text-slate-900 dark:text-white">
                        <div>{d.departmentName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">#{d.departmentCode} • HOD: {d.hodName}</div>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                        {d.courseName}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${d.copo.percentage >= 80 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : d.copo.percentage >= 40 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                          {d.copo.mappedSubjects}/{d.copo.totalSubjects} ({d.copo.percentage}%)
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${d.timetable.isUpToDate ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}`}>
                          {d.timetable.isUpToDate ? '✓ Active' : `${d.timetable.draftsCount} Drafts`}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {d.questionBank.totalQuestions} questions
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${d.questionPapers.approvedCount > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : d.questionPapers.totalPapers > 0 ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                          {d.questionPapers.approvedCount > 0 ? `Approved (${d.questionPapers.approvedCount})` : `${d.questionPapers.totalPapers} Created`}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {d.lessons.totalMaterials} files
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-extrabold text-cyan-600 dark:text-cyan-400">
                          {d.attendance.attendanceRate}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-black ${d.overallScore >= 80 ? 'bg-[#00C48C]/15 text-[#00C48C]' : d.overallScore >= 60 ? 'bg-[#FFB020]/15 text-[#FFB020]' : 'bg-[#F04438]/15 text-[#F04438]'}`}>
                          {d.overallScore}% ({d.overallGrade})
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Quick Footer */}
          <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Last refreshed: {new Date(data.generatedAt).toLocaleTimeString()}</span>
            <Link
              href={reportUrl}
              className="text-[#5B4BFF] hover:underline font-bold flex items-center gap-1"
            >
              <span>Explore course-wise auto compliance breakdown</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
