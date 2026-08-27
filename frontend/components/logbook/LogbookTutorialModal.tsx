'use client';

import React, { useState, useEffect } from 'react';
import { X, BookOpenCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface TutorialItem {
  id?: string;
  unit_title: string;
  subject_code?: string;
  problem_statement: string;
  solution_text?: string;
  file_url?: string;
  file_name?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem?: TutorialItem | null;
}

export default function LogbookTutorialModal({ isOpen, onClose, onSuccess, editItem }: Props) {
  const [unitTitle, setUnitTitle] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [solutionText, setSolutionText] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editItem) {
      setUnitTitle(editItem.unit_title || '');
      setSubjectCode(editItem.subject_code || '');
      setProblemStatement(editItem.problem_statement || '');
      setSolutionText(editItem.solution_text || '');
      setFileUrl(editItem.file_url || '');
    } else {
      setUnitTitle('');
      setSubjectCode('CS-302');
      setProblemStatement('');
      setSolutionText('');
      setFileUrl('');
    }
    setError(null);
  }, [editItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitTitle.trim() || !problemStatement.trim()) {
      setError('Please provide unit title and problem statement.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const slug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly';
    const token = localStorage.getItem('token') || '';
    const studentId = localStorage.getItem('studentId') || localStorage.getItem('studentUserId') || '';

    const payload = {
      studentId: studentId || undefined,
      unitTitle,
      subjectCode,
      problemStatement,
      solutionText,
      fileUrl: fileUrl || null,
      fileName: fileUrl ? 'Tutorial_Solution.pdf' : null,
    };

    try {
      const url = editItem?.id
        ? `/api/v1/logbook/tutorials/${editItem.id}?tenant=${slug}`
        : `/api/v1/logbook/tutorials?tenant=${slug}`;

      const res = await fetch(url, {
        method: editItem?.id ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to save tutorial');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[24px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-gradient-to-r from-[#2D2575] to-[#4338CA] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
              <BookOpenCheck className="w-5 h-5 text-[#F36C21]" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{editItem ? 'Edit Tutorial Sheet' : 'Add Unit Tutorial Solution'}</h3>
              <p className="text-xs text-white/80">Submit guided problem sheets and lab assignments</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unit / Tutorial Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={unitTitle}
                onChange={(e) => setUnitTitle(e.target.value)}
                placeholder="e.g. Unit 3: Normalization & Query Execution Cost"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subject Code
              </label>
              <input
                type="text"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                placeholder="e.g. CS-302"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Problem Statement <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              placeholder="State the core mathematical / algorithmic problem to be solved..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Detailed Solution / Derivation
            </label>
            <textarea
              rows={4}
              value={solutionText}
              onChange={(e) => setSolutionText(e.target.value)}
              placeholder="Step-by-step solution, proof or algorithm implementation..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Solution Sheet / PDF Link
            </label>
            <input
              type="url"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4338CA] text-white text-sm font-semibold shadow-md shadow-[#5B4BFF]/25 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : <><CheckCircle2 className="w-4 h-4" /><span>Save Tutorial</span></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
