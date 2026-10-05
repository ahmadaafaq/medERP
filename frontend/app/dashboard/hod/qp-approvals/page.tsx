'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import {
  FileText, CheckCircle2, XCircle, AlertCircle, RotateCcw,
  Printer, Eye, Check, ChevronRight, Clock, Sparkles
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
  PENDING_HOD_APPROVAL: { cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300', label: '⏳ Pending HOD Approval' },
  CHANGES_REQUESTED: { cls: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300', label: '⚠️ Changes Requested' },
  RESUBMITTED: { cls: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300', label: '🚀 Clerk Resubmitted' },
  HOD_APPROVED: { cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300', label: '✅ HOD Approved' },
};

export default function HODQPApprovalsPage() {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<string>('PENDING_HOD_APPROVAL');
  const [courseFilter, setCourseFilter] = useState<string>('ALL');
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Review & Print Modal
  const [selectedPaper, setSelectedPaper] = useState<any | null>(null);
  const [modalMode, setModalMode] = useState<'review' | 'preview' | 'print'>('review');
  const [modalOpen, setModalOpen] = useState(false);

  const loadPapers = async () => {
    setLoading(true);
    try {
      const { slug, headers } = getH();
      let routePath = `/api/v1/exams/papers?tenant=${slug}`;
      let fallbackPath = `${API_BASE}/exams/papers?tenant=${slug}`;

      if (filterTab === 'PENDING_HOD_APPROVAL') {
        routePath = `/api/v1/exams/papers/pending-hod-approval?tenant=${slug}`;
        fallbackPath = `${API_BASE}/exams/papers?tenant=${slug}&status=PENDING_HOD_APPROVAL`;
      } else if (filterTab === 'HOD_APPROVED') {
        routePath = `/api/v1/exams/papers/approved?tenant=${slug}`;
        fallbackPath = `${API_BASE}/exams/papers?tenant=${slug}&status=HOD_APPROVED`;
      } else if (filterTab !== 'ALL') {
        routePath = `/api/v1/exams/papers?tenant=${slug}&status=${filterTab}`;
        fallbackPath = `${API_BASE}/exams/papers?tenant=${slug}&status=${filterTab}`;
      }

      let list: any[] = [];
      try {
        const r = await fetch(routePath, { headers: { ...headers, 'x-tenant-slug': slug }, cache: 'no-store' });
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

  // Filtered papers by course (e.g. BCA / Course 13, MCA, MBA, B.Tech)
  const displayedPapers = useMemo(() => {
    return papers.filter((paper: any) => {
      if (courseFilter === 'ALL') return true;
      if (String(paper.course_cd) === String(courseFilter)) return true;
      const formatted = formatCourseName(paper.course_cd, paper.course_name).toLowerCase();
      if (courseFilter === '13' && (formatted === 'bca' || String(paper.course_cd) === '13')) return true;
      if (courseFilter === '3' && (formatted === 'mca' || String(paper.course_cd) === '3')) return true;
      if (courseFilter === '4' && (formatted === 'mba' || String(paper.course_cd) === '4')) return true;
      if (courseFilter === '1' && (formatted.includes('b.tech') || formatted.includes('btech') || String(paper.course_cd) === '1')) return true;
      return formatted === courseFilter.toLowerCase();
    });
  }, [papers, courseFilter]);

  // Open Paper in Review Modal
  const handleOpenReview = (paper: any, mode: 'review' | 'preview' | 'print' = 'review') => {
    setSelectedPaper(paper);
    setModalMode(mode);
    setModalOpen(true);
  };

  const executeHodAction = async (payload: any) => {
    const { slug, headers } = getH();
    try {
      // 1. Try local route handler
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

    // 2. Try primary API_BASE
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
  const handleModalApprove = async (paperId: string, remarks: string, version: number) => {
    try {
      const data = await executeHodAction({
        paperId,
        action: 'approve',
        remarks: remarks || 'HOD Approved',
        version,
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
        alert('↩️ Paper returned to clerk with your question remarks and revision directives.');
      } else {
        alert(data?.message || 'Failed to submit changes to clerk.');
      }
    } catch (e: any) {
      alert(`Submission error: ${e.message}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="hod" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Question Paper Approvals" />
        <main className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full flex-1">

          {/* Top Review Queue Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#5B4BFF]/10 text-[#5B4BFF] font-mono font-bold uppercase tracking-wider">
                  HOD APPROVAL QUEUE
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#1B1E28] dark:text-white">
                Question Paper Review Queue
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Review question papers submitted by department clerks, add question-level remarks, request fixes, or authorize for live printing
              </p>
            </div>
          </div>

          {/* Dual Filter Bars: Status Tabs + Course Filter */}
          <div className="space-y-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            {/* Status Tabs */}
            <div className="flex gap-2 flex-wrap items-center">
              {[
                { key: 'PENDING_HOD_APPROVAL', label: '⏳ Pending Approval' },
                { key: 'HOD_APPROVED', label: '✅ HOD Approved' },
                { key: 'CHANGES_REQUESTED', label: '⚠️ Changes Requested' },
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

            {/* Course Filter Pills: easily focus on BCA (Course 13), MCA, MBA, B.Tech */}
            <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] mr-1">
                Course:
              </span>
              {[
                { key: 'ALL', label: 'All Courses' },
                { key: '13', label: 'BCA (Course 13)' },
                { key: '3', label: 'MCA (Course 3)' },
                { key: '4', label: 'MBA (Course 4)' },
                { key: '1', label: 'B.Tech (Course 1)' },
              ].map(c => {
                const count = c.key === 'ALL'
                  ? papers.length
                  : papers.filter(p => {
                      if (String(p.course_cd) === c.key) return true;
                      const formatted = formatCourseName(p.course_cd, p.course_name).toLowerCase();
                      if (c.key === '13' && (formatted === 'bca' || String(p.course_cd) === '13')) return true;
                      if (c.key === '3' && (formatted === 'mca' || String(p.course_cd) === '3')) return true;
                      if (c.key === '4' && (formatted === 'mba' || String(p.course_cd) === '4')) return true;
                      if (c.key === '1' && (formatted.includes('b.tech') || formatted.includes('btech') || String(p.course_cd) === '1')) return true;
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
                No papers found
              </p>
              <p className="text-xs text-slate-400">
                Try switching the course or status filter above
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {displayedPapers.map((paper) => {
                const badge = STATUS_BADGE[paper.status] || STATUS_BADGE.DRAFT;
                const isPending = paper.status === 'PENDING_HOD_APPROVAL';
                const isApproved = paper.status === 'HOD_APPROVED';
                const isChangesRequested = paper.status === 'CHANGES_REQUESTED';
                const isRevised = Number(paper.version || 1) > 1;

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
                      isPending
                        ? 'border-[#5B4BFF]/40 shadow-indigo-50 dark:shadow-none'
                        : isApproved
                        ? 'border-emerald-300 dark:border-emerald-900/50'
                        : isChangesRequested
                        ? 'border-rose-200 dark:border-rose-900/40'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      
                      {/* Left Info */}
                      <div className="space-y-1.5 flex-1 min-w-0">
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
                          {isRevised && isPending && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              🔄 Clerk Resubmission
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{paper.subject_name || 'Subject'}</span>
                          <span>·</span>
                          <span>Code: <b className="font-mono text-slate-700 dark:text-slate-300">{paper.code}</b></span>
                          {paper.course_cd && (
                            <>
                              <span>·</span>
                              <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold border border-purple-200/70 dark:border-purple-800 text-[11px]">
                                {formatCourseName(paper.course_cd, paper.course_name)}
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

                        <div className="flex gap-4 text-xs text-slate-500 pt-1">
                          <span>📊 Max Marks: <b className="text-[#1B1E28] dark:text-white">{paper.max_marks || 40}M</b></span>
                          <span>✅ Pass Marks: <b className="text-[#1B1E28] dark:text-white">{paper.passing_marks || 20}M</b></span>
                          <span>⏱️ Duration: <b className="text-[#1B1E28] dark:text-white">{paper.duration_minutes || 60} mins</b></span>
                          <span>📝 Type: <b className="text-[#1B1E28] dark:text-white">{paper.type || 'THEORY'}</b></span>
                        </div>

                        {/* If remarks exist */}
                        {paper.hod_remarks && (
                          <div className="mt-2 text-xs italic text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                            <b>HOD Remarks:</b> &ldquo;{paper.hod_remarks}&rdquo;
                            {qRemCount > 0 && <span className="ml-2 font-bold text-rose-600">({qRemCount} question{qRemCount > 1 ? 's' : ''} flagged)</span>}
                          </div>
                        )}
                      </div>

                      {/* Right Action Buttons */}
                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        {/* Review Button */}
                        <button
                          onClick={() => handleOpenReview(paper, isPending ? 'review' : 'preview')}
                          className="px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#7867FF] text-white text-xs font-extrabold transition-all shadow-sm shadow-[#5B4BFF]/25 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isPending ? '🔍 Review & Mark Questions' : 'View Full Paper'}</span>
                        </button>

                        {/* Quick Approve for pending */}
                        {isPending && (
                          <button
                            onClick={() => handleQuickApprove(paper)}
                            disabled={actioningId === paper.id}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-all shadow-sm shadow-emerald-600/30 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{actioningId === paper.id ? 'Approving...' : '✓ Quick Approve'}</span>
                          </button>
                        )}

                        {/* Print for approved */}
                        {isApproved && (
                          <button
                            onClick={() => handleOpenReview(paper, 'print')}
                            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
                          >
                            <Printer className="w-3.5 h-3.5 text-orange-500" />
                            <span>Print</span>
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

    </div>
  );
}
