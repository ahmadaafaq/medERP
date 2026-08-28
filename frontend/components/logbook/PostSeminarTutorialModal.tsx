'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  BookOpen,
  Calendar,
  Award,
  Layers,
  Presentation,
  CheckCircle2,
  GraduationCap,
  GitBranch,
  Users,
  AlertCircle,
} from 'lucide-react';

interface OptionItem {
  id: string;
  code: string;
  name: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const COURSES_STATIC = [
  { id: '13', code: '13', name: 'BCA (Bachelor of Computer Applications)', duration: 6 },
  { id: '1', code: '1', name: 'B.Tech (Bachelor of Technology)', duration: 8 },
  { id: '4', code: '4', name: 'MCA (Master of Computer Applications)', duration: 4 },
  { id: '3', code: '3', name: 'MBA (Master of Business Administration)', duration: 4 },
  { id: '2', code: '2', name: 'B.Pharm (Bachelor of Pharmacy)', duration: 8 },
  { id: '5', code: '5', name: 'M.Tech (Master of Technology)', duration: 4 },
];

const API_BASE = 'http://localhost:8081/api/v1';

export default function PostSeminarTutorialModal({ isOpen, onClose, onSuccess }: Props) {
  const [courses, setCourses] = useState<OptionItem[]>(COURSES_STATIC);
  const [branches, setBranches] = useState<OptionItem[]>([]);
  const [batches, setBatches] = useState<OptionItem[]>([]);
  const [semesters, setSemesters] = useState<OptionItem[]>([]);

  const [type, setType] = useState<'SEMINAR' | 'TUTORIAL'>('SEMINAR');
  const [courseCd, setCourseCd] = useState<string>('13'); // Default BCA
  const [branchCd, setBranchCd] = useState<string>('1');
  const [batchCd, setBatchCd] = useState<string>('2'); // Default Batch 2025
  const [semesterCd, setSemesterCd] = useState<string>('3');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [submissionDeadline, setSubmissionDeadline] = useState<string>('');
  const [maxMarks, setMaxMarks] = useState<number>(20);

  const [loading, setLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic semesters builder based on course code
  const getSemestersForCourse = useCallback((cCode: string) => {
    let maxSem = 6;
    if (cCode === '1' || cCode === '2') maxSem = 8; // B.Tech, B.Pharm
    else if (cCode === '4' || cCode === '3' || cCode === '5') maxSem = 4; // MCA, MBA, M.Tech
    else maxSem = 6; // BCA

    const sems: OptionItem[] = [];
    for (let i = 1; i <= maxSem; i++) {
      sems.push({ id: String(i), code: String(i), name: `Semester ${i}` });
    }
    return sems;
  }, []);

  // Fetch branches for selected course
  const fetchBranchesForCourse = useCallback(async (cCode: string) => {
    setBranchesLoading(true);
    try {
      const slug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly';
      const colCd = '1';

      // 1. Live SRMS / Next.js proxy
      let branchList: OptionItem[] = [];
      const res = await fetch(`/api/srms/branches?colgcd=${colCd}&coursecd=${cCode}&tenant=${slug}`).catch(() => null);
      if (res && res.ok) {
        const json = await res.json().catch(() => []);
        if (Array.isArray(json) && json.length > 0) {
          branchList = json.map((b: any) => ({
            id: String(b.branch_cd || b.code || b.id || '1'),
            code: String(b.branch_cd || b.code || '1'),
            name: String(b.branch_name || b.name || `Branch ${b.branch_cd}`),
          }));
        }
      }

      // Fallback if empty
      if (branchList.length === 0) {
        if (cCode === '13') {
          branchList = [{ id: '1', code: '1', name: 'BCA Core / Computer Applications' }];
        } else if (cCode === '1') {
          branchList = [
            { id: '1', code: '1', name: 'Computer Science & Engineering (CSE)' },
            { id: '2', code: '2', name: 'Information Technology (IT)' },
            { id: '3', code: '3', name: 'Electronics & Communication (ECE)' },
            { id: '4', code: '4', name: 'Mechanical Engineering (ME)' },
            { id: '5', code: '5', name: 'Electrical Engineering (EE)' },
          ];
        } else if (cCode === '4') {
          branchList = [{ id: '1', code: '1', name: 'MCA Core' }];
        } else if (cCode === '3') {
          branchList = [{ id: '1', code: '1', name: 'MBA Core / General Management' }];
        } else {
          branchList = [{ id: '1', code: '1', name: 'General Branch' }];
        }
      }

      setBranches(branchList);
      if (branchList.length > 0) {
        setBranchCd((prev) => (branchList.some((b) => b.code === prev) ? prev : branchList[0].code));
      }
    } catch (e) {
      console.warn('Error fetching branches:', e);
    } finally {
      setBranchesLoading(false);
    }
  }, []);

  // Fetch batches for selected course
  const fetchBatchesForCourse = useCallback(async (cCode: string) => {
    setBatchesLoading(true);
    try {
      const slug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly';
      const colCd = '1';

      // 1. Live SRMS / Next.js proxy
      let batchList: OptionItem[] = [];
      const res = await fetch(`/api/srms/batches?colgcd=${colCd}&coursecd=${cCode}&tenant=${slug}`).catch(() => null);
      if (res && res.ok) {
        const json = await res.json().catch(() => []);
        if (Array.isArray(json) && json.length > 0) {
          batchList = json.map((b: any) => ({
            id: String(b.batch_cd || b.code || b.id),
            code: String(b.batch_cd || b.code),
            name: b.batch_name ? (b.batch_name.toLowerCase().includes('batch') ? b.batch_name : `Batch ${b.batch_name}`) : `Batch ${b.year || b.code}`,
          }));
        }
      }

      // Fallback matching RestrictAPI.md and batch.md
      if (batchList.length === 0) {
        if (cCode === '13') {
          // BCA: Batch 2026 (cd=3), Batch 2025 (cd=2), Batch 2024 (cd=1)
          batchList = [
            { id: '3', code: '3', name: 'Batch 2026' },
            { id: '2', code: '2', name: 'Batch 2025' },
            { id: '1', code: '1', name: 'Batch 2024' },
          ];
        } else if (cCode === '1') {
          // B.Tech: Batch 2026 (19), 2025 (18), 2024 (17), 2023 (16)
          batchList = [
            { id: '19', code: '19', name: 'Batch 2026' },
            { id: '18', code: '18', name: 'Batch 2025' },
            { id: '17', code: '17', name: 'Batch 2024' },
            { id: '16', code: '16', name: 'Batch 2023' },
            { id: '15', code: '15', name: 'Batch 2022' },
          ];
        } else if (cCode === '4') {
          // MCA: Batch 2025 (16), 2024 (15), 2023 (14)
          batchList = [
            { id: '16', code: '16', name: 'Batch 2025' },
            { id: '15', code: '15', name: 'Batch 2024' },
            { id: '14', code: '14', name: 'Batch 2023' },
          ];
        } else if (cCode === '3') {
          // MBA: Batch 2025 (16), 2024 (15)
          batchList = [
            { id: '16', code: '16', name: 'Batch 2025' },
            { id: '15', code: '15', name: 'Batch 2024' },
          ];
        } else {
          batchList = [
            { id: '1', code: '1', name: 'Batch 2025' },
            { id: '2', code: '2', name: 'Batch 2024' },
          ];
        }
      }

      setBatches(batchList);
      if (batchList.length > 0) {
        setBatchCd((prev) => (batchList.some((b) => b.code === prev) ? prev : batchList[0].code));
      }
    } catch (e) {
      console.warn('Error fetching batches:', e);
    } finally {
      setBatchesLoading(false);
    }
  }, []);

  // Initialize and load dependencies whenever courseCd changes or modal opens
  useEffect(() => {
    if (isOpen) {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setSubmissionDeadline(d.toISOString().slice(0, 16));

      // Load courses from backend if available
      fetchCourses();
    }
  }, [isOpen]);

  const fetchCourses = async () => {
    try {
      const slug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly';
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${API_BASE}/logbook/academic-structure?tenant=${slug}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
      });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        if (Array.isArray(data.courses) && data.courses.length > 0) {
          setCourses(
            data.courses.map((c: any) => ({
              id: String(c.course_cd || c.id),
              code: String(c.course_cd || c.code || c.id),
              name: String(c.name || `Course ${c.course_cd}`),
            }))
          );
        }
      }
    } catch (e) {}
  };

  // Re-fetch dependent branches, batches, and semesters whenever courseCd changes
  useEffect(() => {
    if (courseCd) {
      fetchBranchesForCourse(courseCd);
      fetchBatchesForCourse(courseCd);
      const sems = getSemestersForCourse(courseCd);
      setSemesters(sems);
      if (sems.length > 0) {
        setSemesterCd((prev) => (sems.some((s) => s.code === prev) ? prev : sems[0].code));
      }
    }
  }, [courseCd, fetchBranchesForCourse, fetchBatchesForCourse, getSemestersForCourse]);

  if (!isOpen) return null;

  const handleCourseChange = (newCourseCd: string) => {
    setCourseCd(newCourseCd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide a title for the Seminar / Tutorial.');
      return;
    }

    setLoading(true);
    try {
      const slug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly';
      const token = localStorage.getItem('token') || '';

      const payload = {
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        submissionDeadline: submissionDeadline ? new Date(submissionDeadline).toISOString() : undefined,
        maxMarks: Number(maxMarks) || 20,
        courseId: courseCd === 'all' ? null : courseCd,
        branchId: branchCd === 'all' ? null : branchCd,
        batchId: batchCd === 'all' ? null : batchCd,
        semesterId: semesterCd === 'all' ? null : semesterCd,
      };

      const res = await fetch(`${API_BASE}/logbook/seminar-tutorial-topic?tenant=${slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || 'Failed to publish seminar / tutorial');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#2D2575] to-[#4F46E5] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md">
              <Presentation className="w-5 h-5 text-[#F36C21]" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Post Seminar / Tutorial Assignment</h3>
              <p className="text-xs text-white/80">Configure academic cohort target, task guidelines, and deadline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Selector (Seminar vs Tutorial) */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider block">
              1. Assignment Category Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('SEMINAR')}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                  type === 'SEMINAR'
                    ? 'bg-[#2D2575] text-white border-[#2D2575] shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <Presentation className="w-4 h-4 text-[#F36C21]" />
                <span>Academic Seminar</span>
              </button>

              <button
                type="button"
                onClick={() => setType('TUTORIAL')}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                  type === 'TUTORIAL'
                    ? 'bg-[#2D2575] text-white border-[#2D2575] shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-4 h-4 text-[#5B4BFF]" />
                <span>Unit Tutorial / Sheet</span>
              </button>
            </div>
          </div>

          {/* Academic Target Cascading Dropdowns: Course -> Branch -> Batch -> Sem */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider block">
                2. Target Academic Cohort (Course &rarr; Branch &rarr; Batch &rarr; Semester)
              </label>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Live Dynamic Cascading
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Course */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-[#5B4BFF]" /> Course *
                </label>
                <select
                  value={courseCd}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                >
                  <option value="all">All Enrolled Courses</option>
                  {courses.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <GitBranch className="w-3.5 h-3.5 text-[#F36C21]" /> Branch *
                  </span>
                  {branchesLoading && <span className="text-[10px] text-purple-600 animate-pulse">Loading...</span>}
                </label>
                <select
                  value={branchCd}
                  onChange={(e) => setBranchCd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                >
                  <option value="all">All Branches / Disciplines</option>
                  {branches.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name} [#{b.code}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#5B4BFF]" /> Academic Batch *
                  </span>
                  {batchesLoading && <span className="text-[10px] text-sky-600 animate-pulse">Loading...</span>}
                </label>
                <select
                  value={batchCd}
                  onChange={(e) => setBatchCd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                >
                  <option value="all">All Cohorts / Batches</option>
                  {batches.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name} [Code {b.code}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Semester */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-[#F36C21]" /> Semester *
                </label>
                <select
                  value={semesterCd}
                  onChange={(e) => setSemesterCd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                >
                  <option value="all">All Semesters</option>
                  {semesters.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider block">
              3. Topic / Assignment Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === 'SEMINAR'
                  ? 'e.g. Distributed Database Management Architecture'
                  : 'e.g. Tutorial Sheet 3 - Normalization & Indexing'
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider block">
              4. Problem Statement / Presentation Guidelines
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline required slides, mathematical derivations, software requirements, or problem sheet questions for students..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] resize-none"
            />
          </div>

          {/* Max Marks & Submission End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-[#5B4BFF]" /> Max Marks *
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={maxMarks}
                onChange={(e) => setMaxMarks(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#F36C21]" /> Submission End Date *
              </label>
              <input
                type="datetime-local"
                value={submissionDeadline}
                onChange={(e) => setSubmissionDeadline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                required
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4338CA] text-white font-bold shadow-md shadow-[#5B4BFF]/25 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save &amp; Publish Task</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
