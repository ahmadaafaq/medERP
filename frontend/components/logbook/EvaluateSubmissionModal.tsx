'use client';

import React, { useState } from 'react';
import {
  X,
  Award,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  ExternalLink,
  Sparkles,
  Clock,
  User,
  GraduationCap,
  Maximize2,
  Eye,
  FileCheck2,
  ShieldCheck,
} from 'lucide-react';

interface SubmissionDetail {
  id: string;
  student_id: string;
  student_name: string;
  rollno?: string;
  registration_no?: string;
  photo_url?: string;
  course_name?: string;
  batch_name?: string;
  topic_title: string;
  topic_description?: string;
  max_marks: number;
  file_url?: string;
  file_name?: string;
  file_size?: string;
  explanation_text?: string;
  status: string;
  submitted_at: string;
  marks_obtained?: number;
  remarks?: string;
  evaluated_at?: string;
}

interface EvaluateSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: SubmissionDetail | null;
  onSuccess: () => void;
}

const API_BASE = 'http://localhost:8081/api/v1';

export default function EvaluateSubmissionModal({
  isOpen,
  onClose,
  submission,
  onSuccess,
}: EvaluateSubmissionModalProps) {
  const [marks, setMarks] = useState<number | string>(
    submission?.marks_obtained !== undefined && submission?.marks_obtained !== null
      ? submission.marks_obtained
      : 18
  );
  const [remarks, setRemarks] = useState<string>(
    submission?.remarks || 'Overall performance was satisfactory and satisfactory progress was observed.'
  );
  const [activeView, setActiveView] = useState<'PDF' | 'TEXT' | 'BOTH'>('PDF');
  const [digitalStamp, setDigitalStamp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (submission) {
      setMarks(
        submission.marks_obtained !== undefined && submission.marks_obtained !== null
          ? submission.marks_obtained
          : 18
      );
      setRemarks(
        submission.remarks || 'Overall performance was satisfactory and satisfactory progress was observed.'
      );
      setActiveView(submission.file_url ? 'PDF' : 'TEXT');
      setError(null);
    }
  }, [submission]);

  if (!isOpen || !submission) return null;

  const maxMarks = Number(submission.max_marks || 20);
  const numericMarks = Number(marks);
  const pct = marks !== '' && !isNaN(numericMarks) ? Math.round((numericMarks / maxMarks) * 100) : null;

  const isPdf =
    submission.file_name?.toLowerCase().endsWith('.pdf') ||
    submission.file_url?.startsWith('data:application/pdf') ||
    submission.file_url?.includes('.pdf');
  const isImage =
    submission.file_name?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
    submission.file_url?.startsWith('data:image/');

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (marks === '' || isNaN(numericMarks)) {
      setError('Please enter valid marks obtained.');
      return;
    }
    if (numericMarks < 0 || numericMarks > maxMarks) {
      setError(`Marks obtained must be between 0 and ${maxMarks}.`);
      return;
    }

    setLoading(true);
    try {
      const slug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly';
      const token = localStorage.getItem('token') || '';

      const res = await fetch(`${API_BASE}/logbook/submissions/${submission.id}/evaluate?tenant=${slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
        body: JSON.stringify({
          marksObtained: numericMarks,
          remarks: remarks.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        setError(json.message || 'Failed to submit evaluation');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while evaluating');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] shadow-2xl max-w-6xl w-[96vw] h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-[#2D2575] via-[#3730A3] to-[#4F46E5] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center font-black text-white shadow-md">
              <Award className="w-5 h-5 text-[#F36C21]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Detailed PDF Deliverable Visualizer & Evaluation Studio
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white">
                  {submission.status || 'SUBMITTED'}
                </span>
              </div>
              <p className="text-xs text-white/80 font-medium">
                Topic: <strong className="text-white">{submission.topic_title}</strong> (Max Marks: {maxMarks})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {submission.file_url && (
              <a
                href={submission.file_url}
                target="_blank"
                rel="noreferrer"
                download={submission.file_name || 'deliverable.pdf'}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Document</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Layout: Left = Full-featured PDF Visualizer, Right = Evaluation Rubric */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          {/* Left Column: Detailed Visualizer */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full bg-slate-900/5 dark:bg-slate-950/40 overflow-hidden">
            {/* Visualizer Toolbar */}
            <div className="px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#5B4BFF]" />
                  <span>{submission.file_name || 'Document Deliverable'}</span>
                </span>
                {submission.file_size && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                    {submission.file_size}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {submission.explanation_text && submission.file_url && (
                  <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-[11px] font-bold">
                    <button
                      onClick={() => setActiveView('PDF')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        activeView === 'PDF' ? 'bg-white dark:bg-slate-700 text-[#5B4BFF] shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      PDF Visualizer
                    </button>
                    <button
                      onClick={() => setActiveView('TEXT')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        activeView === 'TEXT' ? 'bg-white dark:bg-slate-700 text-[#5B4BFF] shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Written Summary
                    </button>
                  </div>
                )}

                {submission.file_url && (
                  <a
                    href={submission.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-[#5B4BFF] hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Open in new window"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Visualizer Body */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col">
              {activeView === 'TEXT' && submission.explanation_text ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 h-full overflow-y-auto space-y-3">
                  <h4 className="text-xs font-bold uppercase text-[#5B4BFF] tracking-wider">
                    Student Written Scope & Technical Explanation:
                  </h4>
                  <div className="text-sm text-slate-800 dark:text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">
                    {submission.explanation_text}
                  </div>
                </div>
              ) : submission.file_url ? (
                <div className="w-full h-full min-h-[480px] bg-slate-900 rounded-2xl overflow-hidden shadow-inner flex flex-col border border-slate-700">
                  {isPdf ? (
                    <iframe
                      src={submission.file_url}
                      title="PDF Visualizer"
                      className="w-full h-full min-h-[500px] flex-1 border-0 bg-slate-800"
                    />
                  ) : isImage ? (
                    <div className="w-full h-full flex items-center justify-center p-4">
                      <img
                        src={submission.file_url}
                        alt="Submission deliverable"
                        className="max-h-[520px] max-w-full rounded-xl object-contain shadow-md"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-white space-y-4">
                      <FileText className="w-16 h-16 text-[#5B4BFF]" />
                      <div>
                        <div className="font-bold text-lg">{submission.file_name || 'Uploaded Deliverable'}</div>
                        <div className="text-xs text-slate-400 mt-1">{submission.file_size || 'Attached file'}</div>
                      </div>
                      <a
                        href={submission.file_url}
                        download={submission.file_name || 'document'}
                        className="px-5 py-2.5 rounded-xl bg-[#5B4BFF] text-white font-bold text-xs shadow-lg"
                      >
                        Download & Open Document
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center h-full space-y-3">
                  <FileText className="w-12 h-12 text-slate-300" />
                  <div className="font-bold text-slate-700 dark:text-slate-300">No PDF File Attached</div>
                  <p className="text-xs text-slate-500 max-w-sm">
                    {submission.explanation_text ? 'Student submitted text-only narrative.' : 'No deliverable attached.'}
                  </p>
                  {submission.explanation_text && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-left text-xs text-slate-700 dark:text-slate-200 max-w-lg mt-2">
                      {submission.explanation_text}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Faculty Evaluation Form */}
          <div className="lg:col-span-5 xl:col-span-4 p-6 bg-white dark:bg-slate-900 flex flex-col justify-between overflow-y-auto">
            <form onSubmit={handleEvaluate} className="space-y-4">
              {/* Student Candidate Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#5B4BFF]">Candidate Details</div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">{submission.student_name}</h4>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Roll: {submission.rollno || submission.registration_no || 'Reg N/A'}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Submitted</span>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Marks Obtained Input & Gauge */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider block">
                    Marks Awarded (Out of {maxMarks}) *
                  </label>
                  {pct !== null && (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-black border ${
                        pct >= 75
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                          : pct >= 50
                          ? 'bg-indigo-50 text-[#5B4BFF] border-indigo-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {pct}% Score
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max={maxMarks}
                    step="0.5"
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    placeholder={`0 - ${maxMarks}`}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-base font-black focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] font-mono"
                    required
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-mono font-bold text-slate-400">
                    / {maxMarks} Marks
                  </span>
                </div>
              </div>

              {/* Remarks Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider block">
                  Faculty Evaluation Remarks &amp; Feedback
                </label>
                <textarea
                  rows={4}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Provide feedback on technical methodology, implementation quality, and project deliverable..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] resize-none"
                />
              </div>

              {/* Digital Guide Signature Seal */}
              <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#5B4BFF]" />
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-white">Apply Digital Guide Seal</div>
                    <div className="text-[10px] text-slate-500">Official faculty verification stamp</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={digitalStamp}
                  onChange={(e) => setDigitalStamp(e.target.checked)}
                  className="w-4 h-4 text-[#5B4BFF] rounded cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4338CA] text-white text-xs font-black shadow-lg shadow-[#5B4BFF]/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Evaluation...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Sign Off &amp; Award Marks</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
