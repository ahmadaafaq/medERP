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

interface AcademicCourse {
  code: string;
  name: string;
}

interface AcademicBranch {
  code: string;
  name: string;
}

interface AcademicBatch {
  code: string;
  name: string;
  year?: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export default function PublishTopicModal({ isOpen, onClose, onSuccess }: PublishTopicModalProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [categoryId, setCategoryId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [maxMarks, setMaxMarks] = useState<number>(100);
  const [submissionDeadline, setSubmissionDeadline] = useState<string>('');

  // Academic Cohort Structure
  const [coursesList, setCoursesList] = useState<AcademicCourse[]>([]);
  const [branchesList, setBranchesList] = useState<AcademicBranch[]>([]);
  const [batchesList, setBatchesList] = useState<AcademicBatch[]>([]);

  const [courseId, setCourseId] = useState<string>('13'); // Default BCA
  const [branchId, setBranchId] = useState<string>('1');
  const [batchId, setBatchId] = useState<string>('2'); // Default Batch 2025
  const [semesterId, setSemesterId] = useState<string>('3'); // Default Sem 3
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTenantSlug = () => {
    if (typeof window === 'undefined') return 'srms-cet-bareilly';
    const slug =
      localStorage.getItem('tenantSlug') ||
      localStorage.getItem('selectedTenant') ||
      localStorage.getItem('colg_slug') ||
      'srms-cet-bareilly';
    return (slug || 'srms-cet-bareilly').replace(/^tenant_/, '').replace(/^tenant-/, '');
  };

  const getColgCd = () => {
    if (typeof window === 'undefined') return '1';
    return localStorage.getItem('colg_cd') || localStorage.getItem('colgCd') || '1';
  };

  const fetchCourses = async (cd: string, slug: string): Promise<AcademicCourse[]> => {
    try {
      const res = await fetch(`/api/srms/courses?colgcd=${cd}&tenant=${slug}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          return list.map((c: any) => ({
            code: String(c.course_cd || c.code || '1'),
            name: c.course_name || c.name || `Course ${c.course_cd}`,
          }));
        }
      }
    } catch {}
    return [
      { code: '13', name: 'BCA' },
      { code: '1', name: 'B.Tech' },
      { code: '3', name: 'MCA' },
      { code: '2', name: 'B.Pharm' },
      { code: '4', name: 'MBA' },
    ];
  };

  const fetchBranches = async (cd: string, crs: string, slug: string, allCourses: AcademicCourse[]): Promise<AcademicBranch[]> => {
    try {
      const res = await fetch(`/api/srms/branches?colgcd=${cd}&coursecd=${crs}&tenant=${slug}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const courseObj = allCourses.find((c) => String(c.code) === String(crs));
          const courseName = courseObj?.name || 'BCA';
          return list.map((b: any) => {
            const rawName = (b.branch_name || b.name || '').trim();
            const validName =
              rawName && rawName !== '-' && rawName !== 'null' && rawName !== 'NONE'
                ? rawName
                : `${b.course_name || courseName} General`;
            return {
              code: String(b.branch_cd || b.code || '1'),
              name: validName,
            };
          });
        }
      }
    } catch {}
    if (crs === '13') return [{ code: '1', name: 'BCA General' }];
    if (crs === '1') {
      return [
        { code: '1', name: 'Computer Science & Engineering (CSE)' },
        { code: '2', name: 'Information Technology (IT)' },
        { code: '3', name: 'Electronics & Communication (ECE)' },
        { code: '4', name: 'Mechanical Engineering (ME)' },
      ];
    }
    return [{ code: '1', name: 'General Branch' }];
  };

  const fetchBatches = async (cd: string, crs: string, slug: string): Promise<AcademicBatch[]> => {
    try {
      const res = await fetch(`/api/srms/batches?colgcd=${cd}&coursecd=${crs}&tenant=${slug}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          return list.map((b: any) => ({
            code: String(b.batch_cd || b.code || b.batch_name || '1'),
            name: String(b.batch_name || b.name || b.year || b.batch_cd),
            year: Number(b.batch_name || b.year || 2025),
          }));
        }
      }
    } catch {}
    if (crs === '13') {
      return [
        { code: '3', name: '2026', year: 2026 },
        { code: '2', name: '2025', year: 2025 },
        { code: '1', name: '2024', year: 2024 },
      ];
    }
    return [
      { code: '19', name: '2026', year: 2026 },
      { code: '18', name: '2025', year: 2025 },
      { code: '17', name: '2024', year: 2024 },
    ];
  };

  const handleCourseChange = async (newCourseCd: string) => {
    setCourseId(newCourseCd);
    const cd = getColgCd();
    const slug = getTenantSlug();

    const [branches, batches] = await Promise.all([
      fetchBranches(cd, newCourseCd, slug, coursesList),
      fetchBatches(cd, newCourseCd, slug),
    ]);

    setBranchesList(branches);
    setBatchesList(batches);

    const defaultBranch = branches[0]?.code || '1';
    const defaultBatch = batches.find((b) => b.name === '2025' || b.year === 2025)?.code || batches[0]?.code || '2';

    setBranchId(defaultBranch);
    setBatchId(defaultBatch);
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();

      // Set default deadline to 7 days from now
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setSubmissionDeadline(d.toISOString().slice(0, 16));

      // Fetch academic cohort structure for logged-in tenant
      const initAcademicStructure = async () => {
        const cd = getColgCd();
        const slug = getTenantSlug();

        const courses = await fetchCourses(cd, slug);
        setCoursesList(courses);

        const defaultCourse = courses.find((c) => c.code === '13' || c.name.toLowerCase().includes('bca')) || courses[0];
        const initialCourseCd = defaultCourse ? defaultCourse.code : '13';
        setCourseId(initialCourseCd);

        const [branches, batches] = await Promise.all([
          fetchBranches(cd, initialCourseCd, slug, courses),
          fetchBatches(cd, initialCourseCd, slug),
        ]);

        setBranchesList(branches);
        setBatchesList(batches);

        const defaultBranch = branches[0]?.code || '1';
        const defaultBatch = batches.find((b) => b.name === '2025' || b.year === 2025)?.code || batches[0]?.code || '2';

        setBranchId(defaultBranch);
        setBatchId(defaultBatch);
      };

      initAcademicStructure();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const slug = getTenantSlug();
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
      const slug = getTenantSlug();
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
          courseId: courseId === 'all' ? null : (courseId || null),
          branchId: branchId === 'all' ? null : (branchId || null),
          batchId: batchId === 'all' ? null : (batchId || null),
          semesterId: semesterId === 'all' ? null : (semesterId || null),
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

          {/* Target Student Cohort Scoping (Photo 1 exact match styling & dependency) */}
          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/80 p-4 rounded-2xl space-y-3">
            <span className="font-extrabold text-xs text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
              <span>🎯</span> Target Academic Cohorts (Course • Branch • Batch • Semester)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  🎓 Course *
                </label>
                <select
                  value={courseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                >
                  {coursesList.map((crs, idx) => (
                    <option key={crs.code || idx} value={crs.code}>
                      [#{crs.code}] {crs.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  🏢 Branch * <span className="text-[#5B4BFF]">({branchesList.length})</span>
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                >
                  {branchesList.map((br, idx) => (
                    <option key={br.code || idx} value={br.code}>
                      [#{br.code}] {br.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  👥 Batch * <span className="text-[#5B4BFF]">({batchesList.length})</span>
                </label>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                >
                  {batchesList.map((batch, idx) => (
                    <option key={batch.code || idx} value={batch.code}>
                      [#{batch.code}] Batch {batch.name || batch.year} {batch.year && batch.name !== String(batch.year) ? `(${batch.year})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  📅 Semester
                </label>
                <select
                  value={semesterId}
                  onChange={(e) => setSemesterId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                >
                  <option value="all">All Semesters</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                  <option value="3">Semester 3</option>
                  <option value="4">Semester 4</option>
                  <option value="5">Semester 5</option>
                  <option value="6">Semester 6</option>
                  <option value="7">Semester 7</option>
                  <option value="8">Semester 8</option>
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
