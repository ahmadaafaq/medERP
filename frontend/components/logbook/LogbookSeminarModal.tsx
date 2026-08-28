'use client';

import React, { useState, useEffect } from 'react';
import { X, Presentation, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface SeminarItem {
  id?: string;
  title: string;
  presentation_date?: string;
  abstract_text?: string;
  slide_deck_url?: string;
  slide_deck_name?: string;
  key_learnings?: string;
  faculty_advisor?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem?: SeminarItem | null;
}

export default function LogbookSeminarModal({ isOpen, onClose, onSuccess, editItem }: Props) {
  const [title, setTitle] = useState('');
  const [presentationDate, setPresentationDate] = useState('');
  const [abstractText, setAbstractText] = useState('');
  const [slideDeckUrl, setSlideDeckUrl] = useState('');
  const [keyLearnings, setKeyLearnings] = useState('');
  const [facultyAdvisor, setFacultyAdvisor] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editItem) {
      setTitle(editItem.title || '');
      setPresentationDate(editItem.presentation_date ? editItem.presentation_date.slice(0, 10) : '');
      setAbstractText(editItem.abstract_text || '');
      setSlideDeckUrl(editItem.slide_deck_url || '');
      setKeyLearnings(editItem.key_learnings || '');
      setFacultyAdvisor(editItem.faculty_advisor || '');
    } else {
      setTitle('');
      setPresentationDate(new Date().toISOString().slice(0, 10));
      setAbstractText('');
      setSlideDeckUrl('');
      setKeyLearnings('');
      setFacultyAdvisor('');
    }
    setError(null);
  }, [editItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a seminar title.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const slug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly';
    const token = localStorage.getItem('token') || '';
    const studentId = localStorage.getItem('studentId') || localStorage.getItem('studentUserId') || '';

    const payload = {
      studentId: studentId || undefined,
      title,
      presentationDate: presentationDate || null,
      abstractText,
      slideDeckUrl: slideDeckUrl || null,
      slideDeckName: slideDeckUrl ? 'Seminar_Slide_Deck.pdf' : null,
      keyLearnings,
      facultyAdvisor,
    };

    try {
      const url = editItem?.id
        ? `/api/v1/logbook/seminars/${editItem.id}?tenant=${slug}`
        : `/api/v1/logbook/seminars?tenant=${slug}`;

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
        throw new Error(data.message || 'Failed to save seminar');
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
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#2D2575] to-[#4338CA] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
              <Presentation className="w-5 h-5 text-[#F36C21]" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{editItem ? 'Edit Seminar Presentation' : 'Add Seminar Presentation'}</h3>
              <p className="text-xs text-white/80">Log technical talk, slide deck, abstract and faculty evaluation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Seminar Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Distributed Consensus in Cloud-Native Raft & Paxos Systems"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Presentation Date
              </label>
              <input
                type="date"
                value={presentationDate}
                onChange={(e) => setPresentationDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Faculty Advisor / Guide Name
              </label>
              <input
                type="text"
                value={facultyAdvisor}
                onChange={(e) => setFacultyAdvisor(e.target.value)}
                placeholder="e.g. Dr. Aafaq Ahmad"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Abstract / Technical Summary
            </label>
            <textarea
              rows={3}
              value={abstractText}
              onChange={(e) => setAbstractText(e.target.value)}
              placeholder="Detailed technical abstract explaining key principles covered in this seminar..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Key Technical Takeaways & Learnings
            </label>
            <textarea
              rows={2}
              value={keyLearnings}
              onChange={(e) => setKeyLearnings(e.target.value)}
              placeholder="e.g. Understood leader election algorithms and log replication latency trade-offs..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Slide Deck / Presentation URL (Drive / Slides / PDF)
            </label>
            <input
              type="url"
              value={slideDeckUrl}
              onChange={(e) => setSlideDeckUrl(e.target.value)}
              placeholder="https://speakerdeck.com/... or https://drive.google.com/..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
            />
          </div>

          {/* Footer */}
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
              {submitting ? 'Saving...' : <><CheckCircle2 className="w-4 h-4" /><span>Save Seminar</span></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
