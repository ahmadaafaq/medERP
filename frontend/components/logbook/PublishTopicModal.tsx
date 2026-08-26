'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, BookOpen, Calendar, Award, Users, Layers, Sparkles, AlertCircle } from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  code: string;
}

interface PublishTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const API_BASE = 'http://localhost:3001/api/v1';

export default function PublishTopicModal({ isOpen, onClose, onSuccess }: PublishTopicModalProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [categoryId, setCategoryId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [maxMarks, setMaxMarks] = useState<number>(100);
  const [submissionDeadline, setSubmissionDeadline] = useState<string>('');
  const [courseId, setCourseId] = useState<string>('13'); // Default BCA
  const [branchId, setBranchId] = useState<string>('1');
  const [batchId, setBatchId] = useState<string>('2'); // Default Batch 2025
  const [semesterId, setSemesterId] = useState<string>('3'); // Default Sem 3
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      // Set default deadline to 7 days from now
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setSubmissionDeadline(d.toISOString().slice(0, 16));
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const slug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly';
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${API_BASE}/logbook/categories?tenant=${slug}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
      });
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
        setCategories(list);
        if (list.length > 0) setCategoryId(list[0].id);
      }
    } catch (e) {
      console.error('Failed to fetch categories:', e);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please enter a topic title.');
      return;
    }
    if (!categoryId) {
      setError('Please select an activity category.');
      return;
    }

    setLoading(true);
    try {
      const slug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly';
      const token = localStorage.getItem('token') || '';

      const res = await fetch(`${API_BASE}/logbook/topics?tenant=${slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
        body: JSON.stringify({
          categoryId,
          title: title.trim(),
          description: description.trim() || undefined,
          maxMarks: Number(maxMarks) || 100,
          submissionDeadline: submissionDeadline ? new Date(submissionDeadline).toISOString() : undefined,
          courseId: courseId || undefined,
          branchId: branchId || undefined,
          batchId: batchId || undefined,
          semesterId: semesterId || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        setError(json.message || 'Failed to publish topic');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while publishing topic');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between bg-[#F8FAFC] dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#5B4BFF] text-white flex items-center justify-center shadow-md shadow-[#5B4BFF]/20">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#1B1E28] dark:text-white">
                Publish Academic Activity Topic
              </h3>
              <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium">
                Create a seminar, tutorial, assignment or practical activity for students to submit work.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Activity Category Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-[#1B1E28] dark:text-white tracking-wider block">
              Activity Category *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900 text-[#1B1E28] dark:text-white text-xs font-bold focus:outline-none focus:border-[#5B4BFF]"
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Topic Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-[#1B1E28] dark:text-white tracking-wider block">
              Topic Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Microservices Architecture & AWS Lambda Deployment Case Study"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900 text-[#1B1E28] dark:text-white text-xs font-medium focus:outline-none focus:border-[#5B4BFF]"
              required
            />
          </div>

          {/* Instructions & Guidelines */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-[#1B1E28] dark:text-white tracking-wider block">
              Instructions &amp; Requirements (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Specify formatting requirements, key questions to cover, expected presentation slides or lab observation steps..."
              className="w-full px-4 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900 text-[#1B1E28] dark:text-white text-xs font-medium focus:outline-none focus:border-[#5B4BFF] resize-none"
            />
          </div>

          {/* Max Marks & Deadline Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-[#1B1E28] dark:text-white tracking-wider block">
                Max Evaluation Marks
              </label>
              <input
                type="number"
                min="10"
                max="500"
                value={maxMarks}
                onChange={(e) => setMaxMarks(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900 text-[#1B1E28] dark:text-white text-xs font-bold focus:outline-none focus:border-[#5B4BFF]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-[#1B1E28] dark:text-white tracking-wider block">
                Submission Deadline
              </label>
              <input
                type="datetime-local"
                value={submissionDeadline}
                onChange={(e) => setSubmissionDeadline(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900 text-[#1B1E28] dark:text-white text-xs font-bold focus:outline-none focus:border-[#5B4BFF]"
              />
            </div>
          </div>

          {/* Target Student Cohort Scoping */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-[#E7EAF3] dark:border-slate-800 space-y-3">
            <span className="text-[11px] font-black uppercase text-[#5B4BFF] tracking-wider block">
              🎯 Target Student Cohort Scope
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-extrabold text-[#7B8794] uppercase block mb-1">
                  Course
                </label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#E7EAF3] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                >
                  <option value="13">BCA</option>
                  <option value="1">B.Tech</option>
                  <option value="3">MCA</option>
                  <option value="2">B.Pharm</option>
                  <option value="4">MBA</option>
                  <option value="11">MBBS</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-extrabold text-[#7B8794] uppercase block mb-1">
                  Branch
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#E7EAF3] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                >
                  <option value="1">Core Branch</option>
                  <option value="all">All Branches</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-extrabold text-[#7B8794] uppercase block mb-1">
                  Batch
                </label>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#E7EAF3] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                >
                  <option value="2">Batch 2025</option>
                  <option value="1">Batch 2024</option>
                  <option value="all">Entire Department</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-extrabold text-[#7B8794] uppercase block mb-1">
                  Semester
                </label>
                <select
                  value={semesterId}
                  onChange={(e) => setSemesterId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#E7EAF3] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                >
                  <option value="3">Semester 3</option>
                  <option value="1">Semester 1</option>
                  <option value="5">Semester 5</option>
                  <option value="all">All Semesters</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-800 text-xs font-black text-[#4E5969] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4B3BFF] text-white text-xs font-black shadow-md shadow-[#5B4BFF]/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Publishing Activity...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Publish Activity to Cohort</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
