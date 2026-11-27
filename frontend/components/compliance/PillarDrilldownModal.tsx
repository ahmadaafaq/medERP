'use client';

import React, { useState, useMemo } from 'react';
import { DepartmentCompliance } from './AcademicComplianceWidget';

export type PillarKey =
  | 'copo'
  | 'timetable'
  | 'qb'
  | 'qp'
  | 'approvals'
  | 'lessons'
  | 'chats'
  | 'portfolio'
  | 'attendance';

interface PillarDrilldownModalProps {
  pillarKey: PillarKey | null;
  collegeName: string;
  departments: DepartmentCompliance[];
  onClose: () => void;
}

const SLICE_COLORS = [
  '#5B4BFF',
  '#00C48C',
  '#F36C21',
  '#3B82F6',
  '#EC4899',
  '#10B981',
  '#8B5CF6',
  '#06B6D4',
  '#FFB020',
];

const PILLAR_META: Record<PillarKey, { title: string; icon: string; subtitle: string }> = {
  copo: {
    title: '1. CO-PO Matrix Mapping Compliance',
    icon: '🎯',
    subtitle: 'Course, Branch, Batch, Semester, Section & Subject-wise CO-PO mapping & pending audit',
  },
  timetable: {
    title: '2. Timetable Up-to-date Status',
    icon: '📅',
    subtitle: 'Active timetable slots & HOD-approved drafts across all courses and branches',
  },
  qb: {
    title: "3. Question Bank & Bloom's Coverage",
    icon: '📚',
    subtitle: 'Question bank repository coverage and difficulty/Bloom distribution per course & branch',
  },
  qp: {
    title: '4. Question Design Paper & Theory Evaluation',
    icon: '📝',
    subtitle: 'Designed examination papers, approval status, and evaluated student answer sheets',
  },
  approvals: {
    title: '5. Academic Approvals (QP & Timetable)',
    icon: '✅',
    subtitle: 'HOD / DQAC approval workflow status across courses and branches',
  },
  lessons: {
    title: '6. Lesson Plan Material Updating',
    icon: '📖',
    subtitle: 'Uploaded curriculum materials and subject coverage across courses',
  },
  chats: {
    title: '7. Academic Chats & Engagement',
    icon: '💬',
    subtitle: 'Active academic discussion groups and messaging activity',
  },
  portfolio: {
    title: '8. Academic Portfolio (Seminar / Tutorial / Mini Project)',
    icon: '💼',
    subtitle: 'Student seminars, tutorials, and mini-project verification status',
  },
  attendance: {
    title: '9. Student Attendance Compliance',
    icon: '👥',
    subtitle: 'Conducted attendance sessions and student presence compliance per course & branch',
  },
};

export default function PillarDrilldownModal({
  pillarKey,
  collegeName,
  departments,
  onClose,
}: PillarDrilldownModalProps) {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FEEDED' | 'PENDING'>('ALL');
  const [selectedCourseCd, setSelectedCourseCd] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'courses' | 'records'>(
    pillarKey === 'copo' || pillarKey === 'qp' || pillarKey === 'timetable' ? 'records' : 'courses'
  );

  // Extract metric for a department for the active pillar
  const getDeptMetric = (d: DepartmentCompliance, key: PillarKey) => {
    switch (key) {
      case 'copo':
        return {
          feeded: d.copo.mappedSubjects,
          total: d.copo.totalSubjects,
          pending: Math.max(0, d.copo.totalSubjects - d.copo.mappedSubjects),
          pct: d.copo.percentage,
          status: d.copo.status,
          feededLabel: `${d.copo.mappedSubjects} Mapped`,
          pendingLabel: `${Math.max(0, d.copo.totalSubjects - d.copo.mappedSubjects)} Pending`,
        };
      case 'timetable':
        return {
          feeded: d.timetable.activeSlotsCount + d.timetable.approvedDraftsCount,
          total: Math.max(1, d.timetable.draftsCount + (d.timetable.activeSlotsCount > 0 ? 1 : 0)),
          pending: d.timetable.isUpToDate ? 0 : 1,
          pct: d.timetable.percentage,
          status: d.timetable.status,
          feededLabel: d.timetable.activeSlotsCount > 0
            ? `${d.timetable.activeSlotsCount} Slots`
            : `${d.timetable.approvedDraftsCount} Approved`,
          pendingLabel: d.timetable.isUpToDate ? '0 Pending' : 'Needs Update',
        };
      case 'qb':
        return {
          feeded: d.questionBank.totalQuestions,
          total: Math.max(10, d.questionBank.totalQuestions),
          pending: d.questionBank.totalQuestions >= 10 ? 0 : 10 - d.questionBank.totalQuestions,
          pct: d.questionBank.coveragePercentage,
          status: d.questionBank.status,
          feededLabel: `${d.questionBank.totalQuestions} Qs`,
          pendingLabel: d.questionBank.totalQuestions > 0 ? 'Active' : '0 Qs (Pending)',
        };
      case 'qp':
        return {
          feeded: d.questionPapers.totalPapers,
          total: Math.max(d.questionPapers.totalPapers, 1),
          pending: d.questionPapers.totalPapers === 0 ? 1 : d.questionPapers.draftCount,
          pct: d.questionPapers.percentage,
          status: d.questionPapers.status,
          feededLabel: `${d.questionPapers.totalPapers} Papers (${d.questionPapers.evaluatedCount || 0} Eval)`,
          pendingLabel: d.questionPapers.totalPapers === 0 ? 'No Papers' : `${d.questionPapers.draftCount} Draft`,
        };
      case 'approvals':
        return {
          feeded: d.approvals.approvedQPs + d.approvals.approvedTimetables,
          total: d.approvals.totalQPs + d.approvals.totalTimetables,
          pending: Math.max(0, (d.approvals.totalQPs + d.approvals.totalTimetables) - (d.approvals.approvedQPs + d.approvals.approvedTimetables)),
          pct: d.approvals.approvalRate,
          status: d.approvals.status,
          feededLabel: `${d.approvals.approvedQPs + d.approvals.approvedTimetables} Approved`,
          pendingLabel: `${Math.max(0, (d.approvals.totalQPs + d.approvals.totalTimetables) - (d.approvals.approvedQPs + d.approvals.approvedTimetables))} Pending`,
        };
      case 'lessons':
        return {
          feeded: d.lessons.totalMaterials,
          total: d.lessons.totalSubjects || d.lessons.totalMaterials,
          pending: Math.max(0, (d.lessons.totalSubjects || 0) - d.lessons.subjectsWithMaterials),
          pct: d.lessons.percentage,
          status: d.lessons.status,
          feededLabel: `${d.lessons.totalMaterials} Files`,
          pendingLabel: d.lessons.totalMaterials > 0 ? `${Math.max(0, (d.lessons.totalSubjects || 0) - d.lessons.subjectsWithMaterials)} Subj Pending` : 'No Files',
        };
      case 'chats':
        return {
          feeded: d.chats.activeGroups,
          total: d.chats.activeGroups,
          pending: 0,
          pct: d.chats.activeGroups > 0 ? 100 : 0,
          status: d.chats.status,
          feededLabel: `${d.chats.activeGroups} Groups (${d.chats.totalMessages} Msgs)`,
          pendingLabel: '0 Pending',
        };
      case 'portfolio': {
        const tot = d.portfolio.seminarsCount + d.portfolio.tutorialsCount + d.portfolio.miniProjectsCount;
        const ver = d.portfolio.verifiedSeminars + d.portfolio.verifiedTutorials + d.portfolio.verifiedMiniProjects;
        return {
          feeded: tot,
          total: tot,
          pending: Math.max(0, tot - ver),
          pct: d.portfolio.overallScore,
          status: d.portfolio.status,
          feededLabel: `${tot} Items (${ver} Verified)`,
          pendingLabel: tot === 0 ? 'No Submissions' : `${Math.max(0, tot - ver)} Unverified`,
        };
      }
      case 'attendance':
        return {
          feeded: d.attendance.presentRecords,
          total: d.attendance.totalRecords,
          pending: d.attendance.totalSessions === 0 ? 1 : 0,
          pct: d.attendance.attendanceRate,
          status: d.attendance.status,
          feededLabel: `${d.attendance.totalSessions} Sessions (${d.attendance.attendanceRate}%)`,
          pendingLabel: d.attendance.totalSessions === 0 ? 'No Sessions' : `${d.attendance.totalRecords - d.attendance.presentRecords} Absent`,
        };
    }
  };

  // Unique courses for dropdown filter inside modal
  const courseOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of departments) {
      if (d.courseCd) map.set(d.courseCd, d.courseName || d.courseCd);
    }
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [departments]);

  // Course/Branch-wise summary rows
  const courseBranchRows = useMemo(() => {
    if (!pillarKey) return [];
    const q = searchQuery.trim().toLowerCase();
    return departments
      .map((d) => ({
        dept: d,
        metric: getDeptMetric(d, pillarKey),
      }))
      .filter(({ dept, metric }) => {
        if (selectedCourseCd !== 'ALL' && dept.courseCd !== selectedCourseCd) return false;
        if (statusFilter === 'FEEDED' && metric.feeded === 0) return false;
        if (statusFilter === 'PENDING' && metric.feeded > 0 && metric.pending === 0) return false;
        if (!q) return true;
        return (
          dept.courseName.toLowerCase().includes(q) ||
          dept.departmentName.toLowerCase().includes(q) ||
          dept.hodName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.metric.pct - a.metric.pct || b.metric.feeded - a.metric.feeded);
  }, [departments, pillarKey, selectedCourseCd, statusFilter, searchQuery]);

  // Granular subject/record rows (Course -> Branch -> Batch -> Semester -> Section -> Subject)
  const granularRows = useMemo(() => {
    if (!pillarKey) return [];
    const rows: Array<{
      courseCd: string;
      courseName: string;
      branchName: string;
      batch: string;
      semester: string;
      section: string;
      subjectOrTitle: string;
      isDone: boolean;
      statusText: string;
    }> = [];

    for (const d of departments) {
      if (selectedCourseCd !== 'ALL' && d.courseCd !== selectedCourseCd) continue;

      if (pillarKey === 'copo') {
        for (const s of d.copo.subjectList || []) {
          rows.push({
            courseCd: d.courseCd,
            courseName: d.courseName,
            branchName: d.departmentName,
            batch: (s as any).batchYear || '-',
            semester: (s as any).semester || '-',
            section: (s as any).section || '-',
            subjectOrTitle: `[${s.code}] ${s.name}`,
            isDone: s.isMapped,
            statusText: s.isMapped ? 'Linked / Mapped' : 'Pending',
          });
        }
        // If course has 0 subjects loaded, still list the course branch as Pending
        if ((d.copo.subjectList || []).length === 0) {
          rows.push({
            courseCd: d.courseCd,
            courseName: d.courseName,
            branchName: d.departmentName,
            batch: '-',
            semester: '-',
            section: '-',
            subjectOrTitle: 'No subjects mapped yet',
            isDone: false,
            statusText: 'Pending',
          });
        }
      } else if (pillarKey === 'qp') {
        const recs = (d.questionPapers as any).records || [];
        for (const r of recs) {
          const isDone = r.status === 'APPROVED' || r.status === 'HOD_APPROVED' || r.status === 'DQAC_APPROVED' || r.status === 'PUBLISHED';
          rows.push({
            courseCd: d.courseCd,
            courseName: d.courseName,
            branchName: d.departmentName,
            batch: r.batch || '-',
            semester: r.semester || '-',
            section: r.section || '-',
            subjectOrTitle: `[${r.code}] ${r.name}`,
            isDone,
            statusText: r.status || 'DRAFT',
          });
        }
        if (recs.length === 0) {
          rows.push({
            courseCd: d.courseCd,
            courseName: d.courseName,
            branchName: d.departmentName,
            batch: '-',
            semester: '-',
            section: '-',
            subjectOrTitle: 'No question papers created',
            isDone: false,
            statusText: 'Pending',
          });
        }
      } else if (pillarKey === 'timetable') {
        const recs = (d.timetable as any).records || [];
        for (const r of recs) {
          const isDone = r.status === 'HOD_APPROVED';
          rows.push({
            courseCd: d.courseCd,
            courseName: d.courseName,
            branchName: d.departmentName,
            batch: r.batch || '-',
            semester: r.semester || '-',
            section: r.section || '-',
            subjectOrTitle: `Timetable Draft (${d.timetable.activeSlotsCount} active slots)`,
            isDone,
            statusText: r.status || 'DRAFT',
          });
        }
        if (recs.length === 0) {
          rows.push({
            courseCd: d.courseCd,
            courseName: d.courseName,
            branchName: d.departmentName,
            batch: '-',
            semester: '-',
            section: '-',
            subjectOrTitle: d.timetable.activeSlotsCount > 0 ? `${d.timetable.activeSlotsCount} Active Timetable Slots` : 'No timetable feeded',
            isDone: d.timetable.isUpToDate,
            statusText: d.timetable.isUpToDate ? 'Active' : 'Pending',
          });
        }
      }
    }

    const q = searchQuery.trim().toLowerCase();
    return rows.filter(r => {
      if (statusFilter === 'FEEDED' && !r.isDone) return false;
      if (statusFilter === 'PENDING' && r.isDone) return false;
      if (!q) return true;
      return (
        r.courseName.toLowerCase().includes(q) ||
        r.branchName.toLowerCase().includes(q) ||
        r.subjectOrTitle.toLowerCase().includes(q) ||
        r.semester.toLowerCase().includes(q)
      );
    });
  }, [departments, pillarKey, selectedCourseCd, statusFilter, searchQuery]);

  if (!pillarKey) return null;

  const meta = PILLAR_META[pillarKey];

  // Macro totals for Donut Chart
  const totalFeededBranches = departments.filter(d => getDeptMetric(d, pillarKey).feeded > 0).length;
  const totalPendingBranches = departments.length - totalFeededBranches;
  const totalFeededCount = departments.reduce((acc, d) => acc + getDeptMetric(d, pillarKey).feeded, 0);
  const totalPendingCount = departments.reduce((acc, d) => acc + getDeptMetric(d, pillarKey).pending, 0);
  const avgPct = departments.length > 0
    ? Math.round(departments.reduce((acc, d) => acc + getDeptMetric(d, pillarKey).pct, 0) / departments.length)
    : 0;

  // Multi-slice Donut: each active/feeded course-branch gets a distinct slice + 1 Pending slice
  const activeSlices = departments
    .map((d, idx) => ({
      id: d.departmentId,
      label: `${d.courseName} (${d.departmentName})`,
      val: getDeptMetric(d, pillarKey).feeded,
      pct: getDeptMetric(d, pillarKey).pct,
      color: SLICE_COLORS[idx % SLICE_COLORS.length],
    }))
    .filter(s => s.val > 0);

  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const totalSliceUnits = activeSlices.reduce((acc, s) => acc + s.val, 0) + (totalPendingCount > 0 ? totalPendingCount : 0) || 1;
  let cumOffset = 0;
  const focusedSlice = hoveredSlice === '__PENDING__'
    ? { label: 'Pending Across Courses', pct: 100 - avgPct, val: totalPendingCount }
    : activeSlices.find(s => s.id === hoveredSlice) || null;

  const supportsGranularRecords = pillarKey === 'copo' || pillarKey === 'qp' || pillarKey === 'timetable';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-gradient-to-r from-[#2D2575] to-[#5B4BFF] text-white">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 rounded-xl bg-white/15">{meta.icon}</span>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">{meta.title}</h3>
              <p className="text-xs text-white/80">
                {collegeName} • {meta.subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 text-white font-black flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Top Visual Row: Donut Chart Pointing + 4 Summary KPIs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800">
            {/* Donut Chart */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="16"
                    fill="transparent"
                    className="text-rose-200 dark:text-rose-950/60"
                  />
                  {activeSlices.map((s) => {
                    const segLen = (s.val / totalSliceUnits) * circumference;
                    const offset = -cumOffset;
                    cumOffset += segLen;
                    const isHov = hoveredSlice === s.id;
                    return (
                      <circle
                        key={s.id}
                        cx="70"
                        cy="70"
                        r={radius}
                        stroke={s.color}
                        strokeWidth={isHov ? 20 : 16}
                        strokeDasharray={`${segLen} ${circumference}`}
                        strokeDashoffset={offset}
                        fill="transparent"
                        className="transition-all duration-300 cursor-pointer"
                        onMouseEnter={() => setHoveredSlice(s.id)}
                        onMouseLeave={() => setHoveredSlice(null)}
                      />
                    );
                  })}
                  {totalPendingCount > 0 && (
                    <circle
                      cx="70"
                      cy="70"
                      r={radius}
                      stroke="#F04438"
                      strokeWidth={hoveredSlice === '__PENDING__' ? 20 : 16}
                      strokeDasharray={`${(totalPendingCount / totalSliceUnits) * circumference} ${circumference}`}
                      strokeDashoffset={-cumOffset}
                      fill="transparent"
                      className="transition-all duration-300 cursor-pointer opacity-75"
                      onMouseEnter={() => setHoveredSlice('__PENDING__')}
                      onMouseLeave={() => setHoveredSlice(null)}
                    />
                  )}
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center px-3 pointer-events-none">
                  <span className="text-2xl font-black text-[#1B1E28] dark:text-white leading-none">
                    {focusedSlice ? `${focusedSlice.pct}%` : `${avgPct}%`}
                  </span>
                  <span className="text-[9px] font-bold text-slate-500 dark:text-slate-300 mt-1 max-w-[90px] truncate">
                    {focusedSlice ? focusedSlice.label : 'Overall Rate'}
                  </span>
                </div>
              </div>

              {/* Slice Legend */}
              <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                {activeSlices.slice(0, 6).map(s => (
                  <span
                    key={s.id}
                    onMouseEnter={() => setHoveredSlice(s.id)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="truncate max-w-[120px]">{s.label}</span>
                  </span>
                ))}
                {totalPendingCount > 0 && (
                  <span
                    onMouseEnter={() => setHoveredSlice('__PENDING__')}
                    onMouseLeave={() => setHoveredSlice(null)}
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#F04438]" />
                    <span>Pending ({totalPendingCount})</span>
                  </span>
                )}
              </div>
            </div>

            {/* 4 KPI Summary Cards */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Total Branches</p>
                <p className="text-2xl font-black text-[#1B1E28] dark:text-white mt-1">{departments.length}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Across {courseOptions.length} courses</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">Active / Feeded</p>
                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{totalFeededCount}</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">In {totalFeededBranches} branches</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                <p className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase">Pending Items</p>
                <p className="text-2xl font-black text-rose-700 dark:text-rose-400 mt-1">{totalPendingCount}</p>
                <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">{totalPendingBranches} branches at 0</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
                <p className="text-[10px] font-bold text-[#5B4BFF] uppercase">Compliance Rate</p>
                <p className="text-2xl font-black text-[#5B4BFF] mt-1">{avgPct}%</p>
                <p className="text-[10px] text-indigo-500 mt-0.5">Institution average</p>
              </div>
            </div>
          </div>

          {/* Filter & Tab Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {supportsGranularRecords && (
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('records')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${activeSubTab === 'records' ? 'bg-white dark:bg-slate-700 text-[#5B4BFF] shadow-sm' : 'text-slate-500'}`}
                  >
                    Subject / Record Details ({granularRows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('courses')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${activeSubTab === 'courses' ? 'bg-white dark:bg-slate-700 text-[#5B4BFF] shadow-sm' : 'text-slate-500'}`}
                  >
                    All Courses &amp; Branches Status ({courseBranchRows.length})
                  </button>
                </div>
              )}

              {/* Feeded / Pending Pills */}
              <div className="flex items-center gap-1 text-xs font-bold">
                {(['ALL', 'FEEDED', 'PENDING'] as const).map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      statusFilter === st
                        ? 'bg-[#5B4BFF] text-white border-[#5B4BFF]'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {st === 'ALL' ? 'All' : st === 'FEEDED' ? '✓ Feeded / Linked' : '⏳ Pending Only'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedCourseCd}
                onChange={e => setSelectedCourseCd(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold"
              >
                <option value="ALL">All Courses ({courseOptions.length})</option>
                {courseOptions.map(c => (
                  <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                ))}
              </select>

              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search course, branch, subject..."
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold w-48"
              />
            </div>
          </div>

          {/* Tabular Data View */}
          {(!supportsGranularRecords || activeSubTab === 'courses') ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Course</th>
                    <th className="py-2.5 px-3">Branch / Department</th>
                    <th className="py-2.5 px-3">HOD</th>
                    <th className="py-2.5 px-3">Feeded / Linked</th>
                    <th className="py-2.5 px-3">Pending</th>
                    <th className="py-2.5 px-3 text-right">Status &amp; %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {courseBranchRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-bold">
                        No course / branch records match this filter.
                      </td>
                    </tr>
                  ) : (
                    courseBranchRows.map(({ dept, metric }, idx) => (
                      <tr
                        key={dept.departmentId || idx}
                        onClick={() => {
                          if (supportsGranularRecords) {
                            setSelectedCourseCd(dept.courseCd);
                            setActiveSubTab('records');
                          }
                        }}
                        className={`${supportsGranularRecords ? 'cursor-pointer hover:bg-indigo-50/30 dark:hover:bg-slate-800/50' : ''} transition-colors`}
                      >
                        <td className="py-2.5 px-3 font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-extrabold text-slate-900 dark:text-white">
                          {dept.courseName} <span className="text-[10px] font-mono text-slate-400">({dept.courseCd})</span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300">
                          {dept.departmentName}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{dept.hodName}</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                          {metric.feededLabel}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-rose-600 dark:text-rose-400">
                          {metric.pendingLabel}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${metric.pct >= 80 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : metric.pct >= 40 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                            {metric.pct}% ({metric.status.replace(/_/g, ' ')})
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Course</th>
                    <th className="py-2.5 px-3">Branch</th>
                    <th className="py-2.5 px-3">Batch</th>
                    <th className="py-2.5 px-3">Semester</th>
                    <th className="py-2.5 px-3">Section</th>
                    <th className="py-2.5 px-3">Subject / Record</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {granularRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 font-bold">
                        No detailed records match this filter.
                      </td>
                    </tr>
                  ) : (
                    granularRows.slice(0, 150).map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-extrabold text-slate-900 dark:text-white">{r.courseName}</td>
                        <td className="py-2 px-3 font-bold text-slate-700 dark:text-slate-300">{r.branchName}</td>
                        <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">{r.batch}</td>
                        <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">{r.semester}</td>
                        <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">{r.section}</td>
                        <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">{r.subjectOrTitle}</td>
                        <td className="py-2 px-3 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${r.isDone ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                            {r.isDone ? `✓ ${r.statusText}` : `⏳ ${r.statusText}`}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
