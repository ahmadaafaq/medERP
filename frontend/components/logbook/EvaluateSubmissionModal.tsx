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

const API_BASE = 'http://localhost:3001/api/v1';

export default function EvaluateSubmissionModal({
  isOpen,
  onClose,
  submission,
  onSuccess,
}: EvaluateSubmissionModalProps) {
  const [marks, setMarks] = useState<number | string>(
    submission?.marks_obtained !== undefined && submission?.marks_obtained !== null
      ? submission.marks_obtained
      : ''
  );
  const [remarks, setRemarks] = useState<string>(submission?.remarks || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !submission) return null;

  const maxMarks = Number(submission.max_marks || 100);
  const numericMarks = Number(marks);
  const pct = marks !== '' && !isNaN(numericMarks) ? Math.round((numericMarks / maxMarks) * 100) : null;

  const isPdf = submission.file_name?.toLowerCase().endsWith('.pdf') || submission.file_url?.startsWith('data:application/pdf');
  const isImage = submission.file_name?.match(/\.(jpg|jpeg|png|gif|webp)$/i) || submission.file_url?.startsWith('data:image/');

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between bg-[#F8FAFC] dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#5B4BFF] to-indigo-700 text-white flex items-center justify-center font-black text-sm shadow-md shadow-[#5B4BFF]/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-[#1B1E28] dark:text-white">
                  Evaluate Student Logbook Submission
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  submission.status === 'EVALUATED'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200'
                    : submission.status === 'LATE'
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200'
                    : 'bg-indigo-50 text-[#5B4BFF] dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200'
                }`}>
                  {submission.status}
                </span>
              </div>
              <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium">
                Topic: <strong className="text-[#1B1E28] dark:text-white">{submission.topic_title}</strong> (Max Marks: {maxMarks})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout: Left = Student Submission Preview, Right = Evaluation Form */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-[#E7EAF3] dark:divide-slate-800">
          {/* Left Column: Student Work & File Preview */}
          <div className="lg:col-span-7 p-6 space-y-4 overflow-y-auto max-h-[550px]">
            {/* Student Info Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-black text-xs text-slate-700 dark:text-slate-200">
                  {submission.photo_url ? (
                    <img src={submission.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span>{submission.student_name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#1B1E28] dark:text-white">
                    {submission.student_name}
                  </h4>
                  <p className="text-[10px] text-[#4E5969] dark:text-slate-400 font-medium">
                    Roll: <strong>{submission.rollno || submission.registration_no}</strong> • {submission.course_name} ({submission.batch_name})
                  </p>
                </div>
              </div>
              <div className="text-right text-[10px] text-slate-400 font-medium">
                <span>Submitted:</span>
                <span className="block font-bold text-slate-600 dark:text-slate-300">
                  {new Date(submission.submitted_at).toLocaleDateString()} {new Date(submission.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Student Explanation Text */}
            {submission.explanation_text && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-black uppercase text-[#5B4BFF] tracking-wider block">
                  📝 Student Explanation / Summary
                </span>
                <div className="p-4 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-xs text-[#1B1E28] dark:text-slate-200 font-medium whitespace-pre-line leading-relaxed">
                  {submission.explanation_text}
                </div>
              </div>
            )}

            {/* File Attachment & In-Browser Viewer */}
            {submission.file_url ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-[#1B1E28] dark:text-white tracking-wider">
                    📎 Attached Work File
                  </span>
                  <a
                    href={submission.file_url}
                    download={submission.file_name || 'submission'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-[#5B4BFF] hover:underline flex items-center gap-1"
                  >
                    <span>Open in New Tab</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {isPdf ? (
                  <div className="border border-[#E7EAF3] dark:border-slate-800 rounded-xl overflow-hidden h-[300px] bg-slate-100 dark:bg-slate-900">
                    <iframe
                      src={submission.file_url}
                      title="PDF Preview"
                      className="w-full h-full border-0"
                    />
                  </div>
                ) : isImage ? (
                  <div className="border border-[#E7EAF3] dark:border-slate-800 rounded-xl overflow-hidden p-2 bg-slate-50 dark:bg-slate-900 text-center">
                    <img
                      src={submission.file_url}
                      alt={submission.file_name || 'Preview'}
                      className="max-h-[280px] mx-auto rounded-lg object-contain"
                    />
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-[#E7EAF3] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-850 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-[#5B4BFF]" />
                      <div>
                        <h5 className="text-xs font-black text-slate-800 dark:text-white">
                          {submission.file_name || 'Document Attachment'}
                        </h5>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {submission.file_size || 'Attached file'}
                        </p>
                      </div>
                    </div>
                    <a
                      href={submission.file_url}
                      download={submission.file_name || 'work-attachment'}
                      className="px-3 py-1.5 rounded-lg bg-[#5B4BFF] text-white text-xs font-bold shadow-xs hover:bg-[#4B3BFF] flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 font-medium">
                No external file attachment submitted (Text-only submission).
              </div>
            )}
          </div>

          {/* Right Column: Faculty Evaluation Form */}
          <div className="lg:col-span-5 p-6 space-y-5 bg-white dark:bg-slate-900 flex flex-col justify-between">
            <form onSubmit={handleEvaluate} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E7EAF3] dark:border-slate-800">
                <h4 className="text-xs font-black uppercase text-[#1B1E28] dark:text-white tracking-wider">
                  Award Score &amp; Feedback
                </h4>
                {pct !== null && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-black border ${
                    pct >= 75
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300'
                      : pct >= 50
                      ? 'bg-indigo-50 text-[#5B4BFF] border-indigo-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {pct}% Score
                  </span>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Marks Obtained Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-[#1B1E28] dark:text-white tracking-wider block">
                  Marks Obtained (Out of {maxMarks}) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max={maxMarks}
                    step="0.5"
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    placeholder={`0 - ${maxMarks}`}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900 text-[#1B1E28] dark:text-white text-sm font-black focus:outline-none focus:border-[#5B4BFF] font-mono"
                    required
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-mono font-bold text-slate-400">
                    / {maxMarks}
                  </span>
                </div>
              </div>

              {/* Remarks Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-[#1B1E28] dark:text-white tracking-wider block">
                  Faculty Evaluation Remarks &amp; Feedback
                </label>
                <textarea
                  rows={5}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Provide constructive feedback on problem-solving approach, technical depth, report quality, or clinical precision..."
                  className="w-full px-4 py-3 rounded-xl border border-[#E7EAF3] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900 text-[#1B1E28] dark:text-white text-xs font-medium focus:outline-none focus:border-[#5B4BFF] resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-800 text-xs font-black text-[#4E5969] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5B4BFF] to-indigo-700 hover:opacity-95 text-white text-xs font-black shadow-md shadow-[#5B4BFF]/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
