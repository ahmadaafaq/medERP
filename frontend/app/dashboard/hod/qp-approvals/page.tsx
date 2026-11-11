'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import {
  FileText, CheckCircle2, XCircle, AlertCircle, RotateCcw,
  Printer, Eye, Check, ChevronRight, Clock, Sparkles,
  Calendar, Pause, Layers, ShieldCheck, Filter
} from 'lucide-react';
import QuestionPaperReviewModal, { QuestionRemarkItem } from '../../../../components/exam/QuestionPaperReviewModal';
import { getTenantSlug } from '../../../../hooks/useTenantAcademicData';
import { formatCourseName, formatSemester } from '../../../../lib/exam-formatters';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

function getH() {
  if (typeof window === 'undefined') return { slug: '', empId: '', userId: '', headers: {} as any };
  const slug = getTenantSlug() || 'default';
  const token = localStorage.getItem('token') || '';
  let u: any = {};
  try { u = JSON.parse(localStorage.getItem('user') || '{}'); } catch {}
  const empId = localStorage.getItem('emp_id') || u?.empId || u?.emp_id || localStorage.getItem('username') || '';
  const userId = localStorage.getItem('userId') || u?.id || u?.sub || '';
  return {
    slug,
    empId,
    userId,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'x-tenant-slug': slug,
      'x-user-id': userId,
      'x-emp-id': empId,
      'Content-Type': 'application/json',
    },
  };
}

const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  DRAFT: { cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700', label: '📝 Faculty Draft' },
  PENDING_DQAC_APPROVAL: { cls: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-300 dark:border-purple-800', label: '🔍 In DQAC Audit' },
  DQAC_APPROVED: { cls: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800', label: '⭐ DQAC Approved' },
  PENDING_HOD_APPROVAL: { cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-800', label: '⏳ Ready for HOD Sign-off' },
  CHANGES_REQUESTED: { cls: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-300 dark:border-rose-800', label: '⚠️ Changes Requested' },
  RESUBMITTED: { cls: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800', label: '🚀 Resubmitted' },
  POSTPONED: { cls: 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-300 dark:border-orange-800', label: '⏸️ Postponed' },
  HOD_APPROVED: { cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800', label: '✅ HOD Approved' },
};

export default function HODQPApprovalsPage() {
  const [papers, setPapers] = useState<any[]>([]);
  const [tenantCourses, setTenantCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<string>('ALL');
  const [courseFilter, setCourseFilter] = useState<string>('ALL');
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Review & Print Modal
  const [selectedPaper, setSelectedPaper] = useState<any | null>(null);
  const [modalMode, setModalMode] = useState<'review' | 'preview' | 'print'>('review');
  const [modalOpen, setModalOpen] = useState(false);

  // Postpone & Schedule Modal State
  const [postponeModalOpen, setPostponeModalOpen] = useState(false);
  const [postponePaper, setPostponePaper] = useState<any | null>(null);
  const [postponeMode, setPostponeMode] = useState<'postpone' | 'reschedule'>('postpone');
  const [postponeReason, setPostponeReason] = useState('');
  const [postponeDate, setPostponeDate] = useState('');
  const [postponeSet, setPostponeSet] = useState('Set A');
  const [postponeSectionMode, setPostponeSectionMode] = useState<'all' | 'specific'>('all');
  const [postponeSelectedSections, setPostponeSelectedSections] = useState<string[]>(['Section A', 'Section B']);
  const [postponeLoading, setPostponeLoading] = useState(false);

  const loadPapers = async () => {
    setLoading(true);
    try {
      const { slug, empId, userId, headers } = getH();
      const qp = new URLSearchParams({ tenant: slug, role: 'HOD' });
      if (userId) qp.set('userId', userId);
      if (empId) qp.set('empId', empId);

      if (filterTab === 'PENDING_HOD_APPROVAL') {
        qp.set('status', 'DQAC_APPROVED,PENDING_HOD_APPROVAL');
      } else if (filterTab === 'PENDING_DQAC_APPROVAL') {
        qp.set('status', 'PENDING_DQAC_APPROVAL,RESUBMITTED');
      } else if (filterTab === 'DQAC_APPROVED') {
        qp.set('status', 'DQAC_APPROVED');
      } else if (filterTab === 'HOD_APPROVED') {
        qp.set('status', 'HOD_APPROVED');
      } else if (filterTab === 'CHANGES_REQUESTED') {
        qp.set('status', 'CHANGES_REQUESTED');
      } else if (filterTab === 'POSTPONED') {
        qp.set('status', 'POSTPONED');
      } else if (filterTab === 'DRAFT') {
        qp.set('status', 'DRAFT');
      }

      const primaryUrl = `${API_BASE}/exams/papers?${qp.toString()}`;
      const relUrl = `/api/v1/exams/papers?${qp.toString()}`;

      let list: any[] = [];
      try {
        const r = await fetch(primaryUrl, {
          headers: { ...headers, 'x-tenant-slug': slug, 'x-user-role': 'HOD' },
          cache: 'no-store',
        });
        if (r.ok) {
          const d = await r.json();
          list = Array.isArray(d) ? d : (d.data || []);
        }
      } catch {}

      if (list.length === 0) {
        try {
          const r2 = await fetch(relUrl, {
            headers: { ...headers, 'x-tenant-slug': slug, 'x-user-role': 'HOD' },
            cache: 'no-store',
          });
          if (r2.ok) {
            const d2 = await r2.json();
            list = Array.isArray(d2) ? d2 : (d2.data || []);
          }
        } catch {}
      }

      // Load tenant-specific courses from college-master
      try {
        const cRes = await fetch(`${API_BASE}/college-master/courses?tenant=${slug}`, { headers, cache: 'no-store' });
        if (cRes.ok) {
          const cJson = await cRes.json();
          const cList = Array.isArray(cJson) ? cJson : (cJson.data || []);
          setTenantCourses(cList);
        }
      } catch {}

      // Latest paper ALWAYS on TOP
      list.sort((a: any, b: any) => {
        const tB = b.updated_at || b.created_at ? new Date(b.updated_at || b.created_at).getTime() : 0;
        const tA = a.updated_at || a.created_at ? new Date(a.updated_at || a.created_at).getTime() : 0;
        return tB - tA;
      });

      setPapers(list);
    } catch {
      setPapers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPapers();
  }, [filterTab]);

  // Dynamically compute valid course options strictly scoped to courses where HOD has linked branches/papers
  const courseOptions = useMemo(() => {
    const { slug } = getH();
    const map = new Map<string, string>();

    // 1. Register courses that have papers in active queue for this HOD
    (papers || []).forEach((p: any) => {
      const cCd = String(p.course_cd || '').trim();
      if (cCd && !map.has(cCd)) {
        const pName = p.course_name
          ? (p.course_name.includes('-') ? p.course_name.split('-')[0].trim() : p.course_name)
          : formatCourseName(cCd, p.course_name, slug);
        map.set(cCd, pName || `Course ${cCd}`);
      }
    });

    // 2. Cross-reference tenant courses to adopt clean display titles
    (tenantCourses || []).forEach((c: any) => {
      const code = String(c.course_cd || c.code || c.id || '').trim();
      const rawName = String(c.name || c.course_name || '').trim();
      const shortName = rawName.includes('-') ? rawName.split('-')[0].trim() : rawName;
      if (code && map.has(code) && shortName) {
        map.set(code, shortName);
      }
    });

    const entries = Array.from(map.entries()).map(([key, label]) => ({
      key,
      label,
    }));

    // Prioritize courses with active papers, then sort alphabetically
    entries.sort((a, b) => {
      const countA = papers.filter(p => String(p.course_cd) === a.key).length;
      const countB = papers.filter(p => String(p.course_cd) === b.key).length;
      if (countB !== countA) return countB - countA;
      return a.label.localeCompare(b.label);
    });

    return [{ key: 'ALL', label: 'All Branches & Courses (where HOD is linked)' }, ...entries];
  }, [tenantCourses, papers]);

  // Filtered papers by dynamic course selection
  const displayedPapers = useMemo(() => {
    return papers.filter((paper: any) => {
      if (courseFilter === 'ALL') return true;
      if (String(paper.course_cd) === String(courseFilter)) return true;
      const matchedOpt = courseOptions.find(o => o.key === courseFilter);
      if (matchedOpt && paper.course_name) {
        return paper.course_name.toLowerCase().includes(matchedOpt.label.toLowerCase());
      }
      return false;
    });
  }, [papers, courseFilter, courseOptions]);

  // Open Paper in Review Modal
  const handleOpenReview = (paper: any, mode: 'review' | 'preview' | 'print' = 'review') => {
    setSelectedPaper(paper);
    setModalMode(mode);
    setModalOpen(true);
  };

  const executeHodAction = async (payload: any) => {
    const { slug, headers } = getH();
    try {
      const res = await fetch(`/api/v1/exams/papers/hod-action?tenant=${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-slug': slug },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.success !== false) return d;
      }
    } catch {}

    const res2 = await fetch(`${API_BASE}/exams/papers/hod-action?tenant=${slug}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    return await res2.json();
  };

  // Direct Quick Approve
  const handleQuickApprove = async (paper: any) => {
    if (!confirm(`Are you sure you want to approve "${paper.name}" (v${paper.version || 1}) for live printing?`)) return;
    setActioningId(paper.id);
    try {
      const data = await executeHodAction({
        paperId: paper.id,
        action: 'approve',
        version: Number(paper.version || 1),
      });
      if (data && data.success !== false) {
        await loadPapers();
        alert('✅ Question paper approved! It is now authorized for examination printing on the Admin dashboard.');
      } else {
        alert(data?.message || 'Failed to approve paper.');
      }
    } catch (e: any) {
      alert(`Approval error: ${e.message}`);
    } finally {
      setActioningId(null);
    }
  };

  // Modal Approve Handler
  const handleModalApprove = async (paperId: string, remarks: string, version: number, options?: { paperSet?: string; targetSections?: string[] }) => {
    try {
      const data = await executeHodAction({
        paperId,
        action: 'approve',
        remarks: remarks || 'HOD Approved for Live Print',
        version,
        paperSet: options?.paperSet,
        targetSections: options?.targetSections,
      });
      if (data && data.success !== false) {
        await loadPapers();
        alert('✅ Question paper approved! Authorized for live print.');
      } else {
        alert(data?.message || 'Failed to approve paper.');
      }
    } catch (e: any) {
      alert(`Approval error: ${e.message}`);
    }
  };

  // Modal Request Changes Handler
  const handleModalRequestChanges = async (
    paperId: string,
    generalRemarks: string,
    questionRemarks: Record<string, QuestionRemarkItem>,
    version: number,
  ) => {
    try {
      const data = await executeHodAction({
        paperId,
        action: 'changes_requested',
        remarks: generalRemarks || 'HOD requested revisions on specific questions.',
        questionRemarks,
        version,
      });
      if (data && data.success !== false) {
        await loadPapers();
        alert('↩️ Paper returned to faculty with your question remarks and revision directives.');
      } else {
        alert(data?.message || 'Failed to submit changes to faculty.');
      }
    } catch (e: any) {
      alert(`Submission error: ${e.message}`);
    }
  };

  // Open Postpone Modal
  const handleOpenPostpone = (paper: any, mode: 'postpone' | 'reschedule' = 'postpone') => {
    setPostponePaper(paper);
    setPostponeMode(mode);
    setPostponeReason(paper.hod_remarks || (mode === 'postpone' ? 'Scheduled examination postponed by HOD directive.' : 'Exam date and set distribution updated by HOD.'));
    setPostponeDate(paper.exam_date ? new Date(paper.exam_date).toISOString().slice(0, 10) : '');
    setPostponeSet(paper.paper_set || 'Set A');
    if (paper.target_sections && Array.isArray(paper.target_sections) && !paper.target_sections.includes('All')) {
      setPostponeSectionMode('specific');
      setPostponeSelectedSections(paper.target_sections);
    } else {
      setPostponeSectionMode('all');
      setPostponeSelectedSections(['Section A', 'Section B']);
    }
    setPostponeModalOpen(true);
  };

  // Confirm Postpone or Reschedule
  const handleConfirmPostpone = async () => {
    if (!postponePaper) return;
    setPostponeLoading(true);
    try {
      const targetSecs = postponeSectionMode === 'all'
        ? ['All', 'Section A', 'Section B']
        : (postponeSelectedSections.length > 0 ? postponeSelectedSections : ['Section A']);

      const data = await executeHodAction({
        paperId: postponePaper.id,
        action: postponeMode === 'reschedule' ? 'reschedule' : 'postpone',
        remarks: postponeReason || (postponeMode === 'reschedule' ? 'Examination rescheduled and set allocated by HOD.' : 'Examination postponed by HOD directive.'),
        examDate: postponeDate || undefined,
        paperSet: postponeSet,
        targetSections: targetSecs,
        version: Number(postponePaper.version || 1),
      });
      if (data && data.success !== false) {
        await loadPapers();
        setPostponeModalOpen(false);
        setPostponePaper(null);
        alert(postponeMode === 'reschedule' ? '📅 Examination schedule and set distribution updated successfully!' : '⏸️ Question paper has been marked as Postponed. The submitting faculty has been notified.');
      } else {
        alert(data?.message || 'Failed to update paper status.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setPostponeLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="hod" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Question Paper Approvals" />
        <main className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full flex-1">

          {/* Top Review Queue Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#5B4BFF]/10 text-[#5B4BFF] font-mono font-bold uppercase tracking-wider">
                  HOD APPROVAL QUEUE
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold uppercase tracking-wider">
                  SYSTEM LIVE
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#1B1E28] dark:text-white">
                Question Paper Review &amp; Quality Audit Queue
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Inspect faculty-designed questions, verify DQAC quality audit directives, request revisions, postpone, or authorize for live printing across all your linked branches and courses.
              </p>
            </div>
            <button
              onClick={() => loadPapers()}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2 transition-all cursor-pointer self-start sm:self-center shrink-0"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Queue</span>
            </button>
          </div>

          {/* Dual Filter Bars: Status Tabs + Dynamic Scoped Course Filter */}
          <div className="space-y-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            {/* Status Tabs */}
            <div className="flex gap-2 flex-wrap items-center">
              {[
                { key: 'ALL', label: 'All Linked Branches & Courses' },
                { key: 'PENDING_HOD_APPROVAL', label: '⭐ Ready for HOD Sign-off' },
                { key: 'PENDING_DQAC_APPROVAL', label: '🔍 In DQAC Audit' },
                { key: 'DRAFT', label: '📝 Faculty Drafts' },
                { key: 'POSTPONED', label: '⏸️ Postponed' },
                { key: 'CHANGES_REQUESTED', label: '⚠️ Changes Requested' },
                { key: 'HOD_APPROVED', label: '✅ HOD Approved' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setFilterTab(t.key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    filterTab === t.key
                      ? 'bg-[#5B4BFF] text-white shadow-md shadow-[#5B4BFF]/25'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-[#5B4BFF]/40'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Course Filter Pills: Scoped Strictly to Courses where HOD is Linked */}
            <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                <span>Course:</span>
              </span>
              {courseOptions.map(c => {
                const count = c.key === 'ALL'
                  ? papers.length
                  : papers.filter(p => {
                      if (String(p.course_cd) === c.key) return true;
                      if (c.label && p.course_name && p.course_name.toLowerCase().includes(c.label.toLowerCase())) return true;
                      return false;
                    }).length;
                return (
                  <button
                    key={c.key}
                    onClick={() => setCourseFilter(c.key)}
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      courseFilter === c.key
                        ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                        : 'bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <span>{c.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      courseFilter === c.key ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Papers Ledger List */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-3 border-[#5B4BFF] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : displayedPapers.length === 0 ? (
            <div className="py-24 text-center space-y-3 bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800">
              <span className="text-5xl">📋</span>
              <p className="text-base font-extrabold text-slate-600 dark:text-slate-300">
                No question papers found
              </p>
              <p className="text-xs text-slate-400">
                There are no papers matching the current filter selection in your linked branches or courses.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {displayedPapers.map((paper) => {
                const badge = STATUS_BADGE[paper.status] || STATUS_BADGE.DRAFT;
                const isReadyForHod = paper.status === 'PENDING_HOD_APPROVAL' || paper.status === 'DQAC_APPROVED';
                const isPendingDqac = paper.status === 'PENDING_DQAC_APPROVAL' || paper.status === 'RESUBMITTED';
                const isApproved = paper.status === 'HOD_APPROVED';
                const isChangesRequested = paper.status === 'CHANGES_REQUESTED';
                const isPostponed = paper.status === 'POSTPONED';
                const isDraft = paper.status === 'DRAFT';
                const isRevised = Number(paper.version || 1) > 1;

                // Parse questions count from sections
                let sectionsCount = 0;
                let questionsCount = 0;
                if (paper.sections) {
                  try {
                    const secs = typeof paper.sections === 'string' ? JSON.parse(paper.sections) : paper.sections;
                    if (Array.isArray(secs)) {
                      sectionsCount = secs.length;
                      questionsCount = secs.reduce((acc: number, s: any) => acc + (Array.isArray(s.questions) ? s.questions.length : 0), 0);
                    }
                  } catch {}
                }

                // Question remarks count
                let qRemCount = 0;
                if (paper.question_remarks) {
                  const qR = typeof paper.question_remarks === 'string'
                    ? JSON.parse(paper.question_remarks || '{}')
                    : paper.question_remarks;
                  qRemCount = Object.values(qR).filter((r: any) => r.action && r.action !== 'ok').length;
                }

                return (
                  <div
                    key={paper.id}
                    className={`p-5 bg-white dark:bg-slate-900 rounded-[22px] border transition-all shadow-sm ${
                      isReadyForHod
                        ? 'border-indigo-300 dark:border-indigo-800 shadow-indigo-50 dark:shadow-none'
                        : isPendingDqac
                        ? 'border-purple-300 dark:border-purple-800'
                        : isApproved
                        ? 'border-emerald-300 dark:border-emerald-900/50'
                        : isPostponed
                        ? 'border-orange-300 dark:border-orange-900/40'
                        : isChangesRequested
                        ? 'border-rose-200 dark:border-rose-900/40'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      
                      {/* Left Info */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-extrabold text-base text-[#1B1E28] dark:text-white">
                            {paper.name}
                          </h2>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${badge.cls}`}>
                            {badge.label}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            v{paper.version || 1}
                          </span>
                          {paper.paper_set && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              📑 {paper.paper_set}
                            </span>
                          )}
                          {isRevised && isReadyForHod && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              🔄 Resubmitted
                            </span>
                          )}
                        </div>

                        {/* Subject, Faculty Creator, Course & Branch Scope */}
                        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{paper.subject_name || 'Subject'}</span>
                          <span>·</span>
                          <span>Code: <b className="font-mono text-slate-700 dark:text-slate-300">{paper.code}</b></span>
                          <span>·</span>
                          <span>Faculty Creator: <b className="text-indigo-600 dark:text-indigo-400">{paper.creator_name || 'Department Faculty'}</b></span>
                          {paper.course_cd && (
                            <>
                              <span>·</span>
                              <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold border border-purple-200/70 dark:border-purple-800 text-[11px]">
                                {formatCourseName(paper.course_cd, paper.course_name)}
                              </span>
                            </>
                          )}
                          {paper.department_name && (
                            <>
                              <span>·</span>
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                                {paper.department_name}
                              </span>
                            </>
                          )}
                          {(paper.semester || paper.section) && (
                            <>
                              <span>·</span>
                              <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200/70 dark:border-blue-800 text-[11px]">
                                {formatSemester(paper.semester, paper.section)}
                              </span>
                            </>
                          )}
                          {paper.batch_code && (
                            <>
                              <span>·</span>
                              <span>Batch {paper.batch_code}</span>
                            </>
                          )}
                        </div>

                        {/* Exam specs: Marks, duration, sections */}
                        <div className="flex gap-4 text-xs text-slate-500 pt-0.5 flex-wrap">
                          <span>📊 Max Marks: <b className="text-[#1B1E28] dark:text-white">{paper.max_marks || 20}M</b></span>
                          <span>✅ Pass Marks: <b className="text-[#1B1E28] dark:text-white">{paper.passing_marks || 7}M</b></span>
                          <span>⏱️ Duration: <b className="text-[#1B1E28] dark:text-white">{paper.duration_minutes || 60} mins</b></span>
                          <span>📝 Type: <b className="text-[#1B1E28] dark:text-white">{paper.type || 'THEORY'}</b></span>
                          {sectionsCount > 0 && (
                            <span>📑 Layout: <b className="text-[#5B4BFF]">{sectionsCount} Secs • {questionsCount} Questions</b></span>
                          )}
                          {paper.exam_date && (
                            <span>📅 Exam Date: <b className="text-slate-700 dark:text-slate-200">{new Date(paper.exam_date).toLocaleDateString()}</b></span>
                          )}
                        </div>

                        {/* DQAC Quality Audit Status Callout */}
                        {isPendingDqac && (
                          <div className="mt-2 text-xs text-purple-800 dark:text-purple-300 bg-purple-50/70 dark:bg-purple-950/30 p-2.5 rounded-xl border border-purple-200 dark:border-purple-800 flex items-start gap-2">
                            <span className="font-bold shrink-0">🔍 DQAC Audit Status:</span>
                            <span>Currently undergoing review by the Department Quality Assurance Cell (DQAC). Auditing syllabus coverage, cognitive taxonomy and set distribution before final HOD release.</span>
                          </div>
                        )}

                        {paper.status === 'DQAC_APPROVED' && (
                          <div className="mt-2 text-xs text-indigo-900 dark:text-indigo-200 bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                            <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>⭐ Verified &amp; Endorsed by DQAC Quality Assurance</span>
                            </div>
                            {paper.dqac_remarks ? (
                              <div className="mt-1 text-slate-700 dark:text-slate-300">
                                <span className="font-semibold text-slate-600 dark:text-slate-400">DQAC Quality Directives: </span>
                                <span className="italic">&ldquo;{paper.dqac_remarks}&rdquo;</span>
                              </div>
                            ) : (
                              <div className="mt-0.5 text-slate-500 italic">No revisions requested by DQAC. Ready for HOD live print authorization.</div>
                            )}
                          </div>
                        )}

                        {isChangesRequested && (
                          <div className="mt-2 text-xs text-rose-900 dark:text-rose-200 bg-rose-50/70 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800">
                            <span className="font-bold text-rose-700 dark:text-rose-400">⚠️ Revisions Requested: </span>
                            <span className="italic">&ldquo;{paper.hod_remarks || paper.dqac_remarks || 'Revisions requested on questions.'}&rdquo;</span>
                          </div>
                        )}

                        {isPostponed && (
                          <div className="mt-2 text-xs text-orange-900 dark:text-orange-200 bg-orange-50/70 dark:bg-orange-950/30 p-2.5 rounded-xl border border-orange-200 dark:border-orange-800 flex items-start gap-2">
                            <Pause className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-orange-700 dark:text-orange-400">⏸️ Postponed Examination: </span>
                              <span className="italic">&ldquo;{paper.hod_remarks || paper.dqac_remarks || 'Scheduled examination postponed as per academic directive.'}&rdquo;</span>
                            </div>
                          </div>
                        )}

                        {isDraft && (
                          <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                            <span className="font-bold">📝 Faculty Working Draft: </span>
                            <span>Faculty is currently assembling questions and syllabus blueprint. Not yet submitted for DQAC quality audit.</span>
                          </div>
                        )}

                        {/* HOD Remarks if previously added */}
                        {paper.hod_remarks && paper.status !== 'POSTPONED' && paper.status !== 'CHANGES_REQUESTED' && (
                          <div className="mt-1.5 text-xs italic text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                            <b>HOD Remarks:</b> &ldquo;{paper.hod_remarks}&rdquo;
                            {qRemCount > 0 && <span className="ml-2 font-bold text-rose-600">({qRemCount} question{qRemCount > 1 ? 's' : ''} flagged)</span>}
                          </div>
                        )}
                      </div>

                      {/* Right Action Buttons */}
                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        {/* Review / View Paper & Questions Button */}
                        <button
                          onClick={() => handleOpenReview(paper, isReadyForHod ? 'review' : 'preview')}
                          className="px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#7867FF] text-white text-xs font-extrabold transition-all shadow-sm shadow-[#5B4BFF]/25 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isReadyForHod ? '🔍 Review & Authorize' : '👁️ View Questions & Audit'}</span>
                        </button>

                        {/* Quick Authorize for ready papers */}
                        {isReadyForHod && (
                          <button
                            onClick={() => handleQuickApprove(paper)}
                            disabled={actioningId === paper.id}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-all shadow-sm shadow-emerald-600/30 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{actioningId === paper.id ? 'Authorizing...' : '✓ Quick Authorize'}</span>
                          </button>
                        )}

                        {/* Postpone Button */}
                        {!isPostponed && !isApproved && (
                          <button
                            onClick={() => handleOpenPostpone(paper, 'postpone')}
                            className="px-3 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 text-xs font-bold border border-orange-200 dark:border-orange-800 transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Pause className="w-3.5 h-3.5" />
                            <span>Postpone</span>
                          </button>
                        )}

                        {/* Print for approved */}
                        {isApproved && (
                          <button
                            onClick={() => handleOpenReview(paper, 'print')}
                            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-orange-500" />
                            <span>Print Paper</span>
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </main>
      </div>

      {/* Review & Print Modal */}
      {modalOpen && selectedPaper && (
        <QuestionPaperReviewModal
          paper={selectedPaper}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          mode={modalMode}
          userRole="HOD"
          onApprove={handleModalApprove}
          onRequestChanges={handleModalRequestChanges}
        />
      )}

      {/* Postpone & Reschedule Modal */}
      {postponeModalOpen && postponePaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 flex items-center justify-center font-bold">
                  <Pause className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#1B1E28] dark:text-white">
                    {postponeMode === 'reschedule' ? 'Reschedule Examination & Sets' : 'Postpone Examination'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {postponePaper.name} · Code: {postponePaper.code}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPostponeModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setPostponeMode('postpone')}
                className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  postponeMode === 'postpone'
                    ? 'bg-white dark:bg-slate-900 text-orange-600 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                ⏸️ Postpone Exam
              </button>
              <button
                type="button"
                onClick={() => setPostponeMode('reschedule')}
                className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  postponeMode === 'reschedule'
                    ? 'bg-white dark:bg-slate-900 text-[#5B4BFF] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                📅 Reschedule Date &amp; Sets
              </button>
            </div>

            {/* Date Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#5B4BFF]" />
                <span>{postponeMode === 'reschedule' ? 'New Examination Date:' : 'Postponed Until Date (Optional):'}</span>
              </label>
              <input
                type="date"
                value={postponeDate}
                onChange={(e) => setPostponeDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[#1B1E28] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            {/* Paper Set Allocation */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#5B4BFF]" />
                <span>Assigned Paper Set:</span>
              </label>
              <div className="flex items-center gap-2">
                {['Set A', 'Set B', 'Set C'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setPostponeSet(s)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      postponeSet === s
                        ? 'border-[#5B4BFF] bg-indigo-50 dark:bg-indigo-950/40 text-[#5B4BFF] shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    📑 {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Sections */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Target Sections Allocation:
              </label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="radio"
                    name="modalSecMode"
                    checked={postponeSectionMode === 'all'}
                    onChange={() => {
                      setPostponeSectionMode('all');
                      setPostponeSelectedSections(['Section A', 'Section B']);
                    }}
                    className="text-[#5B4BFF] focus:ring-[#5B4BFF]"
                  />
                  <span>Common Set (Same across all sections: Section A &amp; Section B)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="radio"
                    name="modalSecMode"
                    checked={postponeSectionMode === 'specific'}
                    onChange={() => setPostponeSectionMode('specific')}
                    className="text-[#5B4BFF] focus:ring-[#5B4BFF]"
                  />
                  <span>Specific section for this set:</span>
                </label>

                {postponeSectionMode === 'specific' && (
                  <div className="flex items-center gap-3 pl-5 pt-1">
                    {['Section A', 'Section B', 'Section C'].map((sec) => (
                      <label key={sec} className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={postponeSelectedSections.includes(sec)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPostponeSelectedSections((prev: string[]) => [...prev, sec]);
                            } else {
                              setPostponeSelectedSections((prev: string[]) => prev.filter((s: string) => s !== sec));
                            }
                          }}
                          className="rounded text-[#5B4BFF] focus:ring-[#5B4BFF]"
                        />
                        <span>{sec}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Reason / Directives */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {postponeMode === 'reschedule' ? 'HOD Academic Directive to Faculty:' : 'Reason for Postponement / Directive to Faculty:'}
              </label>
              <textarea
                value={postponeReason}
                onChange={(e) => setPostponeReason(e.target.value)}
                rows={2}
                placeholder={postponeMode === 'reschedule' ? 'e.g. Scheduled for mid-term unit test with assigned set distribution.' : 'e.g. Postponed due to syllabus realignment / internal assessment schedule update.'}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[#1B1E28] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              <p className="text-[11px] text-slate-400">
                The submitting faculty will receive an instant notification with these directives.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPostponeModalOpen(false)}
                disabled={postponeLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPostpone}
                disabled={postponeLoading}
                className={`px-4 py-2 rounded-xl text-xs font-black text-white shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                  postponeMode === 'reschedule'
                    ? 'bg-[#5B4BFF] hover:bg-[#4A3AFF]'
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {postponeLoading ? 'Saving...' : postponeMode === 'reschedule' ? 'Save Schedule & Sets' : 'Confirm Postpone'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
