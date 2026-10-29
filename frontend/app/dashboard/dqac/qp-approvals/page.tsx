'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import {
  FileText, CheckCircle2, XCircle, AlertCircle, RotateCcw,
  Printer, Eye, Check, ChevronRight, Clock, Sparkles, ShieldCheck, Filter
} from 'lucide-react';
import QuestionPaperReviewModal, { QuestionRemarkItem } from '../../../../components/exam/QuestionPaperReviewModal';
import { getTenantSlug } from '../../../../hooks/useTenantAcademicData';
import { formatCourseName, formatSemester } from '../../../../lib/exam-formatters';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

function getH() {
  if (typeof window === 'undefined') return { slug: '', headers: {} as any };
  const slug = getTenantSlug() || 'default';
  const token = localStorage.getItem('token') || '';
  return {
    slug,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'x-tenant-slug': slug,
      'Content-Type': 'application/json',
    },
  };
}

const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  DRAFT: { cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', label: 'Draft' },
  PENDING_DQAC_APPROVAL: { cls: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300', label: '🔍 Pending DQAC Audit' },
  PENDING_HOD_APPROVAL: { cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300', label: '⏳ Pending HOD Approval' },
  CHANGES_REQUESTED: { cls: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300', label: '⚠️ Changes Requested' },
  RESUBMITTED: { cls: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300', label: '🚀 Resubmitted' },
  DQAC_APPROVED: { cls: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300', label: '⭐ DQAC Approved' },
  HOD_APPROVED: { cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300', label: '✅ HOD Approved' },
  POSTPONED: { cls: 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300', label: '⏸️ Postponed' },
};

export default function DQACQPApprovalsPage() {
  const [papers, setPapers] = useState<any[]>([]);
  const [tenantCourses, setTenantCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<string>('PENDING_AUDIT');
  const [courseFilter, setCourseFilter] = useState<string>('ALL');
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Review & Print Modal
  const [selectedPaper, setSelectedPaper] = useState<any | null>(null);
  const [modalMode, setModalMode] = useState<'review' | 'preview' | 'print'>('review');
  const [modalOpen, setModalOpen] = useState(false);

  // Postpone Modal State
  const [postponeModalOpen, setPostponeModalOpen] = useState(false);
  const [postponePaper, setPostponePaper] = useState<any | null>(null);
  const [postponeReason, setPostponeReason] = useState('');
  const [postponeLoading, setPostponeLoading] = useState(false);

  const loadPapers = async () => {
    setLoading(true);
    try {
      const { slug, headers } = getH();
      let routePath = `/api/v1/exams/papers?tenant=${slug}&role=DQAC`;
      let fallbackPath = `${API_BASE}/exams/papers?tenant=${slug}&role=DQAC`;

      if (filterTab === 'PENDING_AUDIT') {
        routePath = `/api/v1/exams/papers/pending-dqac-approval?tenant=${slug}`;
        fallbackPath = `${API_BASE}/exams/papers?tenant=${slug}&status=PENDING_HOD_APPROVAL&role=DQAC`;
      } else if (filterTab === 'DQAC_APPROVED') {
        routePath = `/api/v1/exams/papers?tenant=${slug}&status=DQAC_APPROVED&role=DQAC`;
        fallbackPath = `${API_BASE}/exams/papers?tenant=${slug}&status=DQAC_APPROVED&role=DQAC`;
      } else if (filterTab === 'HOD_APPROVED') {
        routePath = `/api/v1/exams/papers/approved?tenant=${slug}`;
        fallbackPath = `${API_BASE}/exams/papers?tenant=${slug}&status=HOD_APPROVED`;
      } else if (filterTab !== 'ALL') {
        routePath = `/api/v1/exams/papers?tenant=${slug}&status=${filterTab}&role=DQAC`;
        fallbackPath = `${API_BASE}/exams/papers?tenant=${slug}&status=${filterTab}&role=DQAC`;
      }

      let list: any[] = [];
      try {
        const r = await fetch(routePath, { headers: { ...headers, 'x-tenant-slug': slug, 'x-user-role': 'DQAC' }, cache: 'no-store' });
        if (r.ok) {
          const d = await r.json();
          list = Array.isArray(d) ? d : (d.data || []);
        } else {
          throw new Error('Local route error');
        }
      } catch {
        const r2 = await fetch(fallbackPath, { headers, cache: 'no-store' });
        const d2 = await r2.json();
        list = Array.isArray(d2) ? d2 : (d2.data || []);
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

  // Dynamically compute valid course options strictly scoped to active college tenant
  const courseOptions = useMemo(() => {
    const { slug } = getH();
    const map = new Map<string, string>();

    // 1. Map registered courses for active tenant
    (tenantCourses || []).forEach((c: any) => {
      const code = String(c.course_cd || c.code || c.id || '').trim();
      const rawName = String(c.name || c.course_name || '').trim();
      const shortName = rawName.includes('-') ? rawName.split('-')[0].trim() : rawName;
      if (code) {
        map.set(code, shortName || `Course ${code}`);
      }
    });

    // 2. Also register any courses that already have papers in active queue
    (papers || []).forEach((p: any) => {
      const cCd = String(p.course_cd || '').trim();
      if (cCd && !map.has(cCd)) {
        const pName = p.course_name
          ? (p.course_name.includes('-') ? p.course_name.split('-')[0].trim() : p.course_name)
          : formatCourseName(cCd, p.course_name, slug);
        map.set(cCd, pName || `Course ${cCd}`);
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

    return [{ key: 'ALL', label: 'All Courses' }, ...entries];
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

  const handleOpenReview = (paper: any, mode: 'review' | 'preview' | 'print' = 'review') => {
    setSelectedPaper(paper);
    setModalMode(mode);
    setModalOpen(true);
  };

  const executeDqacAction = async (payload: any) => {
    const { slug, headers } = getH();
    try {
      const res = await fetch(`/api/v1/exams/papers/dqac-action?tenant=${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-slug': slug, 'x-user-role': 'DQAC' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.success !== false) return d;
      }
    } catch {}

    const res2 = await fetch(`${API_BASE}/exams/papers/dqac-action?tenant=${slug}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    return await res2.json();
  };

  // Quick DQAC Approve
  const handleQuickApprove = async (paper: any) => {
    if (!confirm(`Are you sure you want to approve "${paper.name}" as DQAC quality-verified?`)) return;
    setActioningId(paper.id);
    try {
      const data = await executeDqacAction({
        paperId: paper.id,
        action: 'dqac_approve',
        version: Number(paper.version || 1),
      });
      if (data && data.success !== false) {
        await loadPapers();
        alert('⭐ Question paper approved by DQAC! It is now certified for HOD final sign-off.');
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
  const handleModalApprove = async (
    paperId: string,
    remarks: string,
    version: number,
    options?: { paperSet?: string; targetSections?: string[] }
  ) => {
    try {
      const data = await executeDqacAction({
        paperId,
        action: 'dqac_approve',
        remarks: remarks || 'DQAC Quality Approved',
        dqacRemarks: remarks || 'DQAC Quality Approved',
        version,
        paperSet: options?.paperSet,
        targetSections: options?.targetSections,
      });
      if (data && data.success !== false) {
        await loadPapers();
        alert('⭐ Question paper approved by DQAC with section allocation!');
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
      const data = await executeDqacAction({
        paperId,
        action: 'changes_requested',
        remarks: generalRemarks || 'DQAC requested revisions on specific questions.',
        questionRemarks,
        version,
      });
      if (data && data.success !== false) {
        await loadPapers();
        alert('↩️ Question paper returned to faculty with DQAC quality directives.');
      } else {
        alert(data?.message || 'Failed to submit changes.');
      }
    } catch (e: any) {
      alert(`Submission error: ${e.message}`);
    }
  };

  const handleOpenPostpone = (paper: any) => {
    setPostponePaper(paper);
    setPostponeReason(paper.dqac_remarks || 'Scheduled examination postponed by DQAC quality assurance.');
    setPostponeModalOpen(true);
  };

  const handleConfirmPostpone = async () => {
    if (!postponePaper) return;
    setPostponeLoading(true);
    try {
      const data = await executeDqacAction({
        paperId: postponePaper.id,
        action: 'postpone',
        remarks: postponeReason || 'Examination postponed by DQAC quality assurance.',
        version: Number(postponePaper.version || 1),
      });
      if (data && data.success !== false) {
        await loadPapers();
        setPostponeModalOpen(false);
        setPostponePaper(null);
        alert('⏸️ Question paper has been marked as Postponed. The submitting faculty has been notified.');
      } else {
        alert(data?.message || 'Failed to postpone paper.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setPostponeLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="dqac" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="DQAC Question Paper Quality Approvals" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#5B4BFF]/10 text-[#5B4BFF] flex items-center justify-center font-black">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black text-[#1B1E28] dark:text-white">
                  Department Quality Assurance Review Portal
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Audit curriculum coverage, verify question taxonomy, and allocate set distribution across sections.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={loadPapers}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1.5 self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh Queue</span>
            </button>
          </div>

          {/* Dual Filter Bars: Status Tabs + Course Filter */}
          <div className="space-y-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            {/* Status Tabs */}
            <div className="flex gap-2 flex-wrap items-center">
              {[
                { key: 'PENDING_AUDIT', label: '🔍 Pending Quality Audit' },
                { key: 'DQAC_APPROVED', label: '⭐ DQAC Approved' },
                { key: 'HOD_APPROVED', label: '✅ HOD Approved' },
                { key: 'CHANGES_REQUESTED', label: '⚠️ Changes Requested' },
                { key: 'POSTPONED', label: '⏸️ Postponed' },
                { key: 'DRAFT', label: '📝 Drafts' },
                { key: 'ALL', label: 'All Statuses' },
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

            {/* Course Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] mr-1">
                Course:
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
                    type="button"
                    onClick={() => setCourseFilter(c.key)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all text-xs flex items-center gap-1.5 cursor-pointer ${
                      courseFilter === c.key
                        ? 'bg-[#F36C21] text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{c.label}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/20 text-white">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Papers Table */}
          {loading ? (
            <div className="py-20 text-center text-xs text-slate-400 animate-pulse bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800">
              Loading quality audit records...
            </div>
          ) : displayedPapers.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800 space-y-2">
              <ShieldCheck className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-bold text-sm text-slate-600 dark:text-slate-300">No question papers found</p>
              <p className="text-slate-400">There are no papers matching the current filter selection.</p>
            </div>
          ) : (
            <div className="rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Paper Details</th>
                      <th className="py-3 px-4">Course &amp; Semester</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Set &amp; Section Allocation</th>
                      <th className="py-3 px-4">Total Marks</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Quality Review Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {displayedPapers.map((paper: any) => {
                      const badge = STATUS_BADGE[paper.status] || { cls: 'bg-slate-100 text-slate-700', label: paper.status };
                      const targetSecs = Array.isArray(paper.target_sections) ? paper.target_sections.join(', ') : (paper.target_sections || 'All');

                      return (
                        <tr key={paper.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-[#1B1E28] dark:text-white">
                            <div>{paper.name}</div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                              <span>{paper.code}</span>
                              <span>·</span>
                              <span>v{paper.version || 1}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                            <div className="font-semibold">{formatCourseName(paper.course_cd, paper.course_name)}</div>
                            <span className="text-[10px] text-slate-400">{formatSemester(paper.semester)}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                            <div>{paper.subject_name || paper.subject_code || '—'}</div>
                            {paper.subject_code && (
                              <span className="text-[10px] font-mono text-slate-400">{paper.subject_code}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold border border-indigo-200 dark:border-indigo-800 inline-block">
                                📑 {paper.paper_set || 'Set A'}
                              </span>
                              <div className="text-[10px] text-slate-500 font-medium">
                                Target: <b className="text-slate-700 dark:text-slate-300">{targetSecs}</b>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-[#00C48C]">
                              {paper.max_marks || 0} Marks
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenReview(paper, 'review')}
                                className="px-3 py-1.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4A3AFF] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Quality Audit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenPostpone(paper)}
                                className="px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/40 text-orange-700 dark:text-orange-300 text-xs font-bold transition-all border border-orange-200 dark:border-orange-800 flex items-center gap-1 cursor-pointer"
                                title="Postpone this Examination Paper"
                              >
                                <Clock className="w-3.5 h-3.5 text-orange-600" />
                                <span>Postpone</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenReview(paper, 'print')}
                                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs transition-all cursor-pointer"
                                title="Print Preview"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Review & Quality Audit Modal */}
      {modalOpen && selectedPaper && (
        <QuestionPaperReviewModal
          paper={selectedPaper}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          mode={modalMode}
          userRole="DQAC"
          onApprove={handleModalApprove}
          onRequestChanges={handleModalRequestChanges}
        />
      )}

      {/* Postpone Examination Paper Confirmation Modal */}
      {postponeModalOpen && postponePaper && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-orange-200 dark:border-orange-800/60 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-fadeIn">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center font-bold text-lg">
                  ⏸️
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#1B1E28] dark:text-white">
                    Postpone Examination Paper
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {postponePaper.name} ({postponePaper.code})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPostponeModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Reason for Postponement / Directive to Faculty:
              </label>
              <textarea
                value={postponeReason}
                onChange={(e) => setPostponeReason(e.target.value)}
                rows={3}
                placeholder="e.g. Incomplete syllabus coverage in sections, rescheduled as per DQAC academic audit."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[#1B1E28] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
              />
              <p className="text-[11px] text-slate-400">
                The submitting faculty will receive an instant notification with these postponement directives.
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
                className="px-4 py-2 rounded-xl text-xs font-black bg-orange-600 hover:bg-orange-700 text-white shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {postponeLoading ? 'Postponing...' : 'Confirm Postpone'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
