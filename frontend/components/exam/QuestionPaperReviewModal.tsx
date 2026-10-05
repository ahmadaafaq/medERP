'use client';

import React, { useState, useRef } from 'react';
import {
  Printer, CheckCircle2, XCircle, AlertCircle, RotateCcw,
  Edit3, Trash2, X, ChevronDown, ChevronUp, FileText, Check
} from 'lucide-react';
import { formatCourseName, formatSemester } from '../../lib/exam-formatters';

export interface QuestionRemarkItem {
  action: 'ok' | 'replace' | 'remove' | 'adjust_marks';
  remark: string;
  suggestedMarks?: number;
}

export interface PaperReviewModalProps {
  paper: any;
  isOpen: boolean;
  onClose: () => void;
  mode: 'review' | 'preview' | 'print' | 'clerk_view';
  onApprove?: (paperId: string, remarks: string, version: number) => Promise<void>;
  onRequestChanges?: (paperId: string, generalRemarks: string, questionRemarks: Record<string, QuestionRemarkItem>, version: number) => Promise<void>;
  userRole?: string;
}

export default function QuestionPaperReviewModal({
  paper,
  isOpen,
  onClose,
  mode = 'preview',
  onApprove,
  onRequestChanges,
  userRole = 'HOD',
}: PaperReviewModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generalRemarks, setGeneralRemarks] = useState(paper?.hod_remarks || '');

  // Parse sections
  const sections: any[] = React.useMemo(() => {
    if (!paper?.sections) return [];
    if (typeof paper.sections === 'string') {
      try { return JSON.parse(paper.sections); } catch { return []; }
    }
    return Array.isArray(paper.sections) ? paper.sections : [];
  }, [paper]);

  // Initial question remarks from paper.question_remarks
  const initialQRemarks: Record<string, QuestionRemarkItem> = React.useMemo(() => {
    if (!paper?.question_remarks) return {};
    if (typeof paper.question_remarks === 'string') {
      try { return JSON.parse(paper.question_remarks); } catch { return {}; }
    }
    return paper.question_remarks || {};
  }, [paper]);

  const [questionRemarks, setQuestionRemarks] = useState<Record<string, QuestionRemarkItem>>(initialQRemarks);

  // Sync state when paper changes
  React.useEffect(() => {
    setGeneralRemarks(paper?.hod_remarks || '');
    if (paper?.question_remarks) {
      const qRem = typeof paper.question_remarks === 'string'
        ? JSON.parse(paper.question_remarks || '{}')
        : (paper.question_remarks || {});
      setQuestionRemarks(qRem);
    } else {
      setQuestionRemarks({});
    }
  }, [paper]);

  if (!isOpen || !paper) return null;

  const currentVersion = Number(paper.version || 1);

  const handleSetQuestionAction = (qId: string, action: 'ok' | 'replace' | 'remove' | 'adjust_marks') => {
    setQuestionRemarks(prev => {
      const current = prev[qId] || { action: 'ok', remark: '' };
      return {
        ...prev,
        [qId]: {
          ...current,
          action,
        },
      };
    });
  };

  const handleSetQuestionRemark = (qId: string, remark: string) => {
    setQuestionRemarks(prev => {
      const current = prev[qId] || { action: 'ok', remark: '' };
      return {
        ...prev,
        [qId]: {
          ...current,
          remark,
        },
      };
    });
  };

  const handleSetQuestionSuggestedMarks = (qId: string, suggestedMarks: number) => {
    setQuestionRemarks(prev => {
      const current = prev[qId] || { action: 'adjust_marks', remark: '' };
      return {
        ...prev,
        [qId]: {
          ...current,
          suggestedMarks,
        },
      };
    });
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const w = window.open('', '_blank', 'width=900,height=750');
    if (!w) return;
    w.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Question Paper — ${paper.name || paper.code}</title>
          <style>
            @page { margin: 15mm 20mm; size: A4 portrait; }
            body { font-family: 'Times New Roman', Times, serif; color: #000; font-size: 11pt; line-height: 1.4; margin: 0; padding: 10px; }
            .paper-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
            .inst-name { font-size: 15pt; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; }
            .paper-title { font-size: 13pt; font-weight: bold; margin-bottom: 4px; }
            .paper-meta-grid { display: flex; justify-content: space-between; font-size: 10pt; font-weight: 600; border-bottom: 1px solid #000; padding: 6px 0; margin-bottom: 12px; }
            .section-heading { font-size: 11pt; font-weight: bold; text-transform: uppercase; margin: 16px 0 6px 0; border-bottom: 1px dashed #666; padding-bottom: 4px; }
            .section-instructions { font-size: 9.5pt; font-style: italic; margin-bottom: 8px; color: #333; }
            .q-row { display: flex; justify-content: space-between; margin-bottom: 8px; page-break-inside: avoid; }
            .q-text { flex: 1; padding-right: 12px; }
            .q-marks { font-weight: bold; white-space: nowrap; font-size: 10pt; }
            .mcq-options { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; margin: 4px 0 6px 18px; font-size: 10pt; }
            .sub-questions { margin: 6px 0 6px 18px; }
            .sub-q-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .practical-row { display: flex; justify-content: space-between; margin-bottom: 4px; border-bottom: 1px dotted #ccc; padding-bottom: 2px; }
            .no-print { display: none !important; }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
      w.close();
    }, 400);
  };

  const handleApproveSubmit = async () => {
    if (!onApprove) return;
    setSubmitting(true);
    try {
      await onApprove(paper.id, generalRemarks, currentVersion);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangesSubmit = async () => {
    if (!onRequestChanges) return;
    setSubmitting(true);
    try {
      await onRequestChanges(paper.id, generalRemarks, questionRemarks, currentVersion);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  // Flagged questions count
  const flaggedCount = Object.values(questionRemarks).filter(r => r.action && r.action !== 'ok').length;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800 shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto">
        
        {/* Top Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5B4BFF]/10 text-[#5B4BFF] flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-extrabold text-base sm:text-lg text-[#1B1E28] dark:text-white leading-tight">
                  {paper.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#5B4BFF]/10 text-[#5B4BFF] border border-[#5B4BFF]/20">
                  Version {currentVersion}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  paper.status === 'HOD_APPROVED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                  paper.status === 'CHANGES_REQUESTED' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' :
                  paper.status === 'PENDING_HOD_APPROVAL' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  {paper.status === 'PENDING_HOD_APPROVAL' ? 'Pending HOD Approval' :
                   paper.status === 'CHANGES_REQUESTED' ? 'Changes Requested' :
                   paper.status === 'HOD_APPROVED' ? 'HOD Approved' : (paper.status || 'Draft')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>Code: <b className="font-mono text-slate-700 dark:text-slate-300">{paper.code}</b></span>
                {paper.subject_name && (
                  <>
                    <span>·</span>
                    <span>Subject: <b className="text-slate-700 dark:text-slate-200">{paper.subject_name}</b></span>
                  </>
                )}
                {paper.course_cd && (
                  <>
                    <span>·</span>
                    <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold border border-purple-200/60 dark:border-purple-800 text-[11px]">
                      {formatCourseName(paper.course_cd, paper.course_name)}
                    </span>
                  </>
                )}
                {(paper.semester || paper.section) && (
                  <>
                    <span>·</span>
                    <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200/60 dark:border-blue-800 text-[11px]">
                      {formatSemester(paper.semester, paper.section)}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
              title="Print Examination Paper"
            >
              <Printer className="w-4 h-4 text-orange-500" />
              <span className="hidden sm:inline">Print Paper</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notice for HOD Review Mode */}
        {mode === 'review' && (
          <div className="px-5 py-2.5 bg-indigo-50/80 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 bg-indigo-200 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-100 rounded">
                HOD REVIEW MODE
              </span>
              <span>Review individual questions below. You can approve questions or mark them for <b>Replace</b>, <b>Remove</b>, or <b>Adjust Marks</b>.</span>
            </div>
            {flaggedCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-extrabold text-[11px] whitespace-nowrap">
                {flaggedCount} Question{flaggedCount > 1 ? 's' : ''} Flagged for Changes
              </span>
            )}
          </div>
        )}

        {/* Notice for Clerk View with Changes Requested */}
        {mode === 'clerk_view' && paper.status === 'CHANGES_REQUESTED' && (
          <div className="px-5 py-3 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/60 text-xs text-rose-900 dark:text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-300 mb-0.5">
                <AlertCircle className="w-4 h-4" />
                <span>HOD Changes Requested (v{currentVersion})</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                {paper.hod_remarks || 'HOD has reviewed the paper and requested changes on the flagged questions below.'}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 font-extrabold text-xs shrink-0">
              {flaggedCount} Questions Need Attention
            </span>
          </div>
        )}

        {/* Scrollable Paper Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
          
          {/* Printable Document Box */}
          <div
            ref={printRef}
            className="bg-white dark:bg-slate-900 text-black dark:text-slate-100 p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm font-serif"
          >
            {/* Examination Official Paper Header */}
            <div className="text-center border-b-2 border-black dark:border-slate-300 pb-3 mb-4 paper-header">
              <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wider inst-name">
                {paper.college_name || 'SRMS COLLEGE OF ENGINEERING & TECHNOLOGY, BAREILLY'}
              </h1>
              <p className="text-xs sm:text-sm font-bold uppercase text-slate-700 dark:text-slate-300">
                Department of {paper.department_name || 'Computer Applications'}
              </p>
              <h2 className="text-base sm:text-lg font-bold mt-1 text-[#1B1E28] dark:text-white paper-title">
                {paper.name}
              </h2>
            </div>

            {/* Paper Metadata Table / Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-semibold border-b border-black dark:border-slate-400 pb-2 mb-6 paper-meta-grid">
              <span><b>Course/Branch:</b> {formatCourseName(paper.course_cd, paper.course_name) || 'BCA'} {paper.branch_cd ? `· Branch ${paper.branch_cd}` : ''}</span>
              <span><b>Semester:</b> {formatSemester(paper.semester, paper.section) || 'Semester 3'}</span>
              <span><b>Paper Code:</b> {paper.code}</span>
              <span><b>Duration:</b> {paper.duration_minutes || 60} mins</span>
              <span><b>Max Marks:</b> {paper.max_marks || 100}</span>
              <span><b>Pass Marks:</b> {paper.passing_marks || 40}</span>
            </div>

            {/* General Instructions */}
            <div className="text-[11px] italic text-slate-600 dark:text-slate-400 mb-6 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded border border-dashed border-slate-300 dark:border-slate-700">
              <b>General Instructions:</b> All sections are compulsory unless stated otherwise. Answer questions clearly and write question numbers correctly. Draw neat diagrams wherever applicable.
            </div>

            {/* Sections & Questions */}
            {(() => {
              const isTheoryPaper = (paper?.type || '').toUpperCase() === 'THEORY';
              const displaySections = sections.filter((section: any) => {
                if (isTheoryPaper && (section.type === 'PRACTICAL' || String(section.title || '').toLowerCase().includes('practical'))) {
                  return false;
                }
                return true;
              });

              if (displaySections.length === 0) {
                return (
                  <div className="py-12 text-center text-slate-400 italic font-sans border border-dashed border-slate-300 dark:border-slate-700 rounded-xl my-4">
                    {isTheoryPaper
                      ? 'No theory sections or questions configured in this paper draft.'
                      : 'No sections or questions configured in this paper draft.'}
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  {displaySections.map((section: any, sIdx: number) => {
                    const sQuestions: any[] = (section.questions || section.selectedQuestions || [])
                      .filter((q: any) => !isTheoryPaper || (q.mode !== 'PRACTICAL' && !q.is_practical && q.type !== 'PRACTICAL'));
                    const sPracticals: any[] = isTheoryPaper ? [] : (section.practicalComponents || []);

                  return (
                    <div key={section.id || sIdx} className="space-y-3">
                      {/* Section Title */}
                      <div className="border-b border-black/40 dark:border-slate-500 pb-1 section-heading">
                        <h3 className="font-bold text-sm sm:text-base uppercase tracking-wide">
                          {section.title || `Section ${String.fromCharCode(65 + sIdx)}`}
                        </h3>
                        {section.instructions && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 italic font-sans font-normal section-instructions">
                            {section.instructions}
                          </p>
                        )}
                      </div>

                      {/* Section Questions List */}
                      <div className="space-y-4">
                        {sQuestions.map((q: any, qIdx: number) => {
                          const qId = q.questionId || q.id || `q_${sIdx}_${qIdx}`;
                          const rem = questionRemarks[qId] || { action: 'ok', remark: '' };
                          const isFlagged = rem.action && rem.action !== 'ok';

                          return (
                            <div
                              key={qId}
                              className={`p-3 rounded-lg transition-all ${
                                isFlagged
                                  ? 'bg-rose-50/70 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3 q-row">
                                <div className="flex-1 q-text">
                                  <div className="flex items-baseline gap-2">
                                    <span className="font-bold font-sans text-xs">Q{qIdx + 1}.</span>
                                    <p className="text-sm font-medium leading-relaxed font-serif">
                                      {q.questionText || q.question_text}
                                    </p>
                                  </div>

                                  {/* Sub-questions if any */}
                                  {q.sub_questions && Array.isArray(q.sub_questions) && q.sub_questions.length > 0 && (
                                    <div className="ml-5 mt-2 space-y-1 sub-questions font-sans text-xs">
                                      {q.sub_questions.map((sq: any, sqIdx: number) => (
                                        <div key={sq.id || sqIdx} className="flex items-baseline justify-between gap-2 sub-q-row">
                                          <span><b>{sq.label || `${String.fromCharCode(97 + sqIdx)})`}</b> {sq.questionText}</span>
                                          <span className="text-slate-500 font-mono font-bold shrink-0">[{sq.marks}M]</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Options for MCQ */}
                                  {(q.mode === 'MCQ' || section.type === 'MCQ') && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 ml-5 mt-2 mcq-options font-sans text-xs">
                                      {['A', 'B', 'C', 'D'].map(opt => {
                                        const optKey = `option_${opt.toLowerCase()}`;
                                        const val = q[optKey] || q[opt];
                                        if (!val) return null;
                                        return (
                                          <div key={opt} className="flex items-center gap-1.5">
                                            <span className="w-4 h-4 rounded-full border border-slate-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                                              {opt}
                                            </span>
                                            <span>{val}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>

                                <div className="text-right shrink-0 q-marks">
                                  <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                    [{q.marks || 1} M]
                                  </span>
                                </div>
                              </div>

                              {/* HOD Review Controls (Active only in review mode) */}
                              {mode === 'review' && (
                                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 no-print font-sans space-y-2">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-[11px] font-extrabold uppercase text-slate-500">
                                      HOD Review for Q{qIdx + 1}:
                                    </span>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <button
                                        type="button"
                                        onClick={() => handleSetQuestionAction(qId, 'ok')}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                          rem.action === 'ok' || !rem.action
                                            ? 'bg-emerald-600 text-white shadow-sm'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                        }`}
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>OK</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleSetQuestionAction(qId, 'replace')}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                          rem.action === 'replace'
                                            ? 'bg-amber-500 text-white shadow-sm'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                        }`}
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>Replace</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleSetQuestionAction(qId, 'remove')}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                          rem.action === 'remove'
                                            ? 'bg-rose-600 text-white shadow-sm'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                        }`}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Remove</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleSetQuestionAction(qId, 'adjust_marks')}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                          rem.action === 'adjust_marks'
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                        }`}
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                        <span>Adjust Marks</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Inputs if flagged */}
                                  {rem.action && rem.action !== 'ok' && (
                                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                      <input
                                        type="text"
                                        placeholder={`Reason for ${rem.action} (e.g. out of syllabus, too lengthy, etc.)...`}
                                        value={rem.remark || ''}
                                        onChange={(e) => handleSetQuestionRemark(qId, e.target.value)}
                                        className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                                      />
                                      {rem.action === 'adjust_marks' && (
                                        <div className="flex items-center gap-1">
                                          <span className="text-xs text-slate-500 whitespace-nowrap">Suggested Marks:</span>
                                          <input
                                            type="number"
                                            value={rem.suggestedMarks || q.marks || 1}
                                            onChange={(e) => handleSetQuestionSuggestedMarks(qId, Number(e.target.value))}
                                            className="w-16 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-center"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Clerk View of Existing HOD Flags */}
                              {(mode === 'clerk_view' || mode === 'preview') && isFlagged && (
                                <div className="mt-2.5 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs no-print font-sans">
                                  <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-300">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    <span className="uppercase tracking-wider text-[10px]">
                                      HOD Request: {rem.action.replace('_', ' ')}
                                    </span>
                                    {rem.suggestedMarks && (
                                      <span className="text-[10px] bg-rose-200 dark:bg-rose-900 px-1.5 py-0.2 rounded font-mono">
                                        → Suggest {rem.suggestedMarks} Marks
                                      </span>
                                    )}
                                  </div>
                                  {rem.remark && (
                                    <p className="text-slate-600 dark:text-slate-300 mt-1 italic pl-5">
                                      &ldquo;{rem.remark}&rdquo;
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Practical section & components */}
                        {(section.type === 'PRACTICAL' || sPracticals.length > 0) && (
                          <div className="space-y-2 mt-2 p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                            <div className="flex justify-between items-center text-xs font-bold text-purple-900 dark:text-purple-200 pb-1 border-b border-purple-200 dark:border-purple-800">
                              <span>🧪 Practical Spotting, OSPE Stations &amp; Viva Assessment</span>
                              <span className="font-mono">[{section.practicalMarks || 20} Marks]</span>
                            </div>
                            {sPracticals.length > 0 ? (
                              <div className="space-y-1.5 pt-1">
                                {sPracticals.map((pComp: any, pIdx: number) => (
                                  <div key={pComp.id || pIdx} className="flex justify-between items-center text-xs py-1 border-b border-dashed border-purple-200 dark:border-purple-900 practical-row">
                                    <span>#{pIdx + 1}. {pComp.name}</span>
                                    <span className="font-mono font-bold text-purple-700 dark:text-purple-300">[{pComp.marks} Marks]</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-500 italic pt-1">
                                Lab experiment execution, continuous assessment, and viva voce evaluation by faculty.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
          </div>

          {/* HOD General Feedback Box (in Review Mode) */}
          {mode === 'review' && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                General HOD Feedback / Directives to Clerk:
              </label>
              <textarea
                rows={3}
                value={generalRemarks}
                onChange={(e) => setGeneralRemarks(e.target.value)}
                placeholder="Enter general remarks for the clerk regarding this question paper..."
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] resize-none"
              />
            </div>
          )}
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {mode === 'review' ? (
              <span>Paper Version: <b>v{currentVersion}</b> · Total flagged questions: <b>{flaggedCount}</b></span>
            ) : (
              <span>Status: <b>{paper.status}</b></span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
            >
              Close
            </button>

            {mode === 'review' && (
              <>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleChangesSubmit}
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-rose-500/20"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Submit Back to Clerk (Request Changes)</span>
                </button>

                <button
                  type="button"
                  disabled={submitting || flaggedCount > 0}
                  onClick={handleApproveSubmit}
                  className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                    flaggedCount > 0
                      ? 'bg-slate-400 cursor-not-allowed opacity-60'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                  }`}
                  title={flaggedCount > 0 ? 'Resolve flagged questions or submit changes to clerk' : 'Approve paper for live examination print'}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve & Authorize Live Print</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
