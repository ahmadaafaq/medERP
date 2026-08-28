'use client';

import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Sparkles, FileCheck, Clock } from 'lucide-react';

interface TopicItem {
  id: string;
  title: string;
  description?: string;
  max_marks: number;
  submission_deadline?: string;
  category_name?: string;
  faculty_name?: string;
  student_submission?: any;
}

interface LogbookSubmitWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: TopicItem | null;
  existingSubmission?: any;
  onSuccess: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api/v1';

export default function LogbookSubmitWorkModal({
  isOpen,
  onClose,
  topic,
  existingSubmission,
  onSuccess,
}: LogbookSubmitWorkModalProps) {
  const currentSub = existingSubmission || topic?.student_submission;
  const isEvaluated = currentSub?.status === 'EVALUATED';
  const isSubmitted = currentSub?.status === 'SUBMITTED' || currentSub?.status === 'LATE';

  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string>(currentSub?.file_url || '');
  const [fileName, setFileName] = useState<string>(currentSub?.file_name || '');
  const [fileSize, setFileSize] = useState<string>(currentSub?.file_size || '');
  const [explanationText, setExplanationText] = useState<string>(currentSub?.explanation_text || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen && topic) {
      const s = existingSubmission || topic.student_submission;
      setFileUrl(s?.file_url || '');
      setFileName(s?.file_name || '');
      setFileSize(s?.file_size || '');
      setExplanationText(s?.explanation_text || '');
      setError(null);
    }
  }, [isOpen, topic, existingSubmission]);

  if (!isOpen || !topic) return null;

  const isLate = topic.submission_deadline && new Date() > new Date(topic.submission_deadline);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setFileSize(`${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`);

      // Read as Data URL for in-browser preview & backend storage
      const reader = new FileReader();
      reader.onload = () => {
        setFileUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isEvaluated) {
      setError('This submission has already been evaluated and locked.');
      return;
    }

    if (!fileUrl && !explanationText.trim()) {
      setError('Please attach a document/file or write an explanation to submit your work.');
      return;
    }

    setLoading(true);
    try {
      const slug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly';
      const token = localStorage.getItem('token') || '';

      const rawUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      let studentId = '';
      if (rawUser) {
        try {
          const parsed = JSON.parse(rawUser);
          studentId = parsed.student_id || parsed.id || parsed.userId || '';
        } catch (e) {}
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-tenant-slug': slug,
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/logbook/submissions?tenant=${slug}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          topicId: topic.id,
          studentId: studentId || undefined,
          fileUrl: fileUrl || undefined,
          fileName: fileName || undefined,
          fileSize: fileSize || undefined,
          explanationText: explanationText.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        setError(json.message || 'Failed to submit work');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting work');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between bg-[#F8FAFC] dark:bg-slate-850">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#5B4BFF]/10 text-[#5B4BFF] text-[10px] font-mono font-black uppercase">
                {topic.category_name || 'Academic Activity'}
              </span>
              {isEvaluated ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>🔒 Evaluated &amp; Locked</span>
                </span>
              ) : isLate ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Late Submission Window</span>
                </span>
              ) : null}
            </div>
            <h3 className="text-lg font-black text-[#1B1E28] dark:text-white truncate max-w-lg">
              {topic.title}
            </h3>
            <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium">
              Max Marks: <strong className="text-[#5B4BFF]">{topic.max_marks}</strong> • Faculty: <strong>{topic.faculty_name || 'Faculty Member'}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Evaluated Score Banner */}
          {isEvaluated && currentSub && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Evaluation Score Awarded
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-mono font-black text-xs">
                  {currentSub.marks_obtained} / {topic.max_marks} Marks
                </span>
              </div>
              {currentSub.remarks && (
                <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60">
                  <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 block mb-0.5">
                    Faculty Remarks:
                  </span>
                  <p className="text-xs font-medium italic">
                    "{currentSub.remarks}"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Editable Mode Info Banner */}
          {!isEvaluated && isSubmitted && (
            <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-[#5B4BFF] text-xs font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>✏️ Edit Mode: You can modify and re-submit your work before faculty evaluates it.</span>
            </div>
          )}

          {/* Topic Instructions */}
          {topic.description && (
            <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs text-[#1B1E28] dark:text-slate-300 space-y-1">
              <span className="text-[10px] font-black uppercase text-[#5B4BFF] tracking-wider block">
                📋 Activity Instructions:
              </span>
              <p className="whitespace-pre-line leading-relaxed font-medium">
                {topic.description}
              </p>
            </div>
          )}

          {/* File Upload Section */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-[#1B1E28] dark:text-white tracking-wider block">
              1. Attach Document / Report / Presentation (PDF, Images, DOCX)
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isEvaluated}
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.ppt,.pptx"
              className="hidden"
            />

            {fileUrl ? (
              <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/40 dark:bg-emerald-950/30 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                      {fileName || 'Attached Document'}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      {fileSize || 'Attached for evaluation'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {fileUrl.startsWith('data:') || fileUrl.startsWith('http') ? (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#5B4BFF] hover:bg-[#EEECFF] dark:hover:bg-slate-800 transition-all"
                    >
                      View File
                    </a>
                  ) : null}
                  {!isEvaluated && (
                    <>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#5B4BFF] hover:bg-[#EEECFF] dark:hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        Change File
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          setFileUrl('');
                          setFileName('');
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div
                onClick={() => !isEvaluated && fileInputRef.current?.click()}
                className={`border-2 border-dashed border-[#E7EAF3] dark:border-slate-800 rounded-2xl p-6 text-center transition-all bg-[#F6F8FC]/50 dark:bg-slate-850/50 space-y-2 group ${
                  isEvaluated ? 'opacity-60 cursor-not-allowed' : 'hover:border-[#5B4BFF] dark:hover:border-[#5B4BFF] hover:bg-[#EEECFF]/30 cursor-pointer'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-slate-800 text-[#5B4BFF] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-black text-[#1B1E28] dark:text-white">
                    {isEvaluated ? 'No file attached' : 'Click to browse or drag & drop document'}
                  </p>
                  <p className="text-[10px] text-[#7B8794] mt-0.5 font-medium">
                    Supports PDF, Word (.docx), PowerPoint (.pptx), PNG/JPG up to 25MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Explanation Textarea */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-[#1B1E28] dark:text-white tracking-wider block">
              2. Student Summary / Work Explanation
            </label>
            <textarea
              rows={4}
              value={explanationText}
              disabled={isEvaluated}
              onChange={(e) => setExplanationText(e.target.value)}
              placeholder="Provide a concise summary, procedure steps, analysis findings, or key takeaways for faculty review..."
              className={`w-full px-4 py-3 rounded-xl border border-[#E7EAF3] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900 text-[#1B1E28] dark:text-white text-xs font-medium focus:outline-none focus:border-[#5B4BFF] transition-all resize-none ${
                isEvaluated ? 'opacity-75 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''
              }`}
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-800 text-xs font-black text-[#4E5969] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              {isEvaluated ? 'Close' : 'Cancel'}
            </button>
            {!isEvaluated && (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4B3BFF] text-white text-xs font-black shadow-md shadow-[#5B4BFF]/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Work...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{isSubmitted ? 'Update & Resubmit Work' : 'Confirm & Submit Work'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
