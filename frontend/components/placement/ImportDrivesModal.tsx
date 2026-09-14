'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  Loader2,
  Download,
  Plus,
  Trash2,
  Table as TableIcon
} from 'lucide-react';

export interface TargetCohort {
  id: string;
  course_cd: string;
  course_name: string;
  branch_cd: string;
  branch_name: string;
  batch_cd: string;
  batch_name: string;
  semester: string;
}

interface ImportDrivesModalProps {
  onClose: () => void;
  onSuccess: () => void;
  selectedCollege?: string;
  coursesList?: any[];
}

export default function ImportDrivesModal({ 
  onClose, 
  onSuccess,
  selectedCollege = '1',
  coursesList = []
}: ImportDrivesModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [batchTitle, setBatchTitle] = useState('Campus Placement Drive 2026-27');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Target Academic Cohorts State
  const [localCoursesList, setLocalCoursesList] = useState<any[]>(coursesList);
  const [queuedCohorts, setQueuedCohorts] = useState<TargetCohort[]>([]);
  const [modalCourse, setModalCourse] = useState<string>('13');
  const [modalBranch, setModalBranch] = useState<string>('1');
  const [modalBatch, setModalBatch] = useState<string>('2');
  const [modalSemester, setModalSemester] = useState<string>('All Semesters');
  const [modalBranchesList, setModalBranchesList] = useState<any[]>([]);
  const [modalBatchesList, setModalBatchesList] = useState<any[]>([]);
  const [cohortError, setCohortError] = useState<string | null>(null);
  const [loadingCohorts, setLoadingCohorts] = useState(false);

  const cohortListEndRef = useRef<HTMLDivElement | null>(null);

  const getTenantSlug = () => {
    if (typeof window === 'undefined') return 'srms-cet-bareilly';
    const slug =
      localStorage.getItem('tenantSlug') ||
      localStorage.getItem('selectedTenant') ||
      localStorage.getItem('colg_slug') ||
      'srms-cet-bareilly';
    return (slug || 'srms-cet-bareilly').replace(/^tenant_/, '').replace(/^tenant-/, '');
  };

  const getAuthHeaders = () => {
    if (typeof window === 'undefined') return {};
    const tenant = getTenantSlug();
    const token = localStorage.getItem('token') || localStorage.getItem('access_token') || localStorage.getItem('accessToken');
    const headers: Record<string, string> = {
      'x-tenant-id': tenant,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchBranches = async (courseCd: string) => {
    const slug = getTenantSlug();
    try {
      const res = await fetch(`/api/srms/branches?colgcd=${selectedCollege}&coursecd=${courseCd}&tenant=${slug}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const courseObj = localCoursesList.find(c => String(c.code) === String(courseCd));
          const courseName = courseObj?.name || 'BCA';
          return list.map((b: any) => {
            const rawName = (b.branch_name || b.name || '').trim();
            const validName = (rawName && rawName !== '-' && rawName !== 'null' && rawName !== 'NONE')
              ? rawName
              : `${b.course_name || courseName} General`;
            return {
              code: String(b.branch_cd || b.code || '1'),
              name: validName,
              course_cd: String(b.course_cd || courseCd),
            };
          });
        }
      }
    } catch {}
    return [{ code: '1', name: 'Computer Science & Engineering', course_cd: courseCd }];
  };

  const fetchBatches = async (courseCd: string) => {
    const slug = getTenantSlug();
    try {
      const res = await fetch(`/api/srms/batches?colgcd=${selectedCollege}&coursecd=${courseCd}&tenant=${slug}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          return list.map((b: any) => ({
            code: String(b.batch_cd || b.code || b.batch_name || '1'),
            name: String(b.batch_name || b.name || b.year || b.batch_cd),
            year: Number(b.batch_name || b.year || 2025),
            course_cd: String(b.course_cd || courseCd),
          }));
        }
      }
    } catch {}
    return [{ code: '2', name: '2025', year: 2025, course_cd: courseCd }];
  };

  // Initialize Courses, Branches & Batches on Mount
  useEffect(() => {
    const initCohorts = async () => {
      setLoadingCohorts(true);
      let courses = localCoursesList;
      if (!courses || courses.length === 0) {
        const slug = getTenantSlug();
        try {
          const res = await fetch(`/api/srms/courses?colgcd=${selectedCollege}&tenant=${slug}`);
          if (res.ok) {
            const list = await res.json();
            if (Array.isArray(list) && list.length > 0) {
              courses = list.map((c: any) => ({
                code: String(c.course_cd || c.code || '1'),
                name: c.course_name || c.name || `Course ${c.course_cd}`,
                colg_cd: String(c.colg_cd || selectedCollege),
              }));
              setLocalCoursesList(courses);
            }
          }
        } catch {}
      }

      const initialCourseCd = courses.find(c => String(c.code) === '13' || c.name === 'BCA')?.code || courses[0]?.code || '13';
      setModalCourse(initialCourseCd);

      const [branches, batches] = await Promise.all([
        fetchBranches(initialCourseCd),
        fetchBatches(initialCourseCd)
      ]);

      setModalBranchesList(branches);
      setModalBatchesList(batches);
      if (branches.length > 0) setModalBranch(branches[0].code);
      const defaultBatch = batches.find(b => b.name === '2025' || b.year === 2025)?.code || batches[0]?.code || '2';
      setModalBatch(defaultBatch);
      setLoadingCohorts(false);
    };

    initCohorts();
  }, [selectedCollege]);

  const handleModalCourseChange = async (newCourseCd: string) => {
    setModalCourse(newCourseCd);
    setCohortError(null);
    const [branches, batches] = await Promise.all([
      fetchBranches(newCourseCd),
      fetchBatches(newCourseCd)
    ]);
    setModalBranchesList(branches);
    setModalBatchesList(batches);
    if (branches.length > 0) setModalBranch(branches[0].code);
    const defaultBatch = batches.find(b => b.name === '2025' || b.year === 2025)?.code || batches[0]?.code || '2';
    setModalBatch(defaultBatch);
  };

  const handleAddCohortToQueue = () => {
    const courseObj = localCoursesList.find(c => String(c.code) === String(modalCourse));
    const courseLabel = courseObj?.name || (modalCourse === '13' ? 'BCA' : `Course #${modalCourse}`);

    const branchObj = modalBranchesList.find(b => String(b.code) === String(modalBranch));
    const branchLabel = branchObj?.name || `Branch #${modalBranch}`;

    const batchObj = modalBatchesList.find(b => String(b.code) === String(modalBatch));
    const batchLabel = batchObj?.name || (batchObj?.year ? `Batch ${batchObj.year}` : `Batch #${modalBatch}`);

    const isDuplicate = queuedCohorts.some(
      (c) =>
        String(c.course_cd) === String(modalCourse) &&
        String(c.branch_cd) === String(modalBranch) &&
        String(c.batch_cd) === String(modalBatch) &&
        String(c.semester) === String(modalSemester)
    );

    if (isDuplicate) {
      setCohortError(`Cohort "[#${modalCourse}] ${courseLabel} • ${branchLabel} • ${batchLabel} • ${modalSemester}" is already added.`);
      return;
    }

    setCohortError(null);
    setQueuedCohorts((prev) => [
      ...prev,
      {
        id: `${modalCourse}-${modalBranch}-${modalBatch}-${modalSemester}-${Date.now()}`,
        course_cd: modalCourse,
        course_name: courseLabel,
        branch_cd: modalBranch,
        branch_name: branchLabel,
        batch_cd: modalBatch,
        batch_name: batchLabel,
        semester: modalSemester,
      },
    ]);

    setTimeout(() => {
      cohortListEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 60);
  };

  const handleRemoveCohort = (index: number) => {
    setQueuedCohorts(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setError(null);
    setLoadingPreview(true);

    try {
      const tenant = getTenantSlug();
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('access_token') || localStorage.getItem('accessToken') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'multipart/form-data',
        'x-tenant-id': tenant,
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const formData = new FormData();
      formData.append('file', selected);

      const res = await axios.post(`/api/placement-drive/import-preview?tenant=${tenant}`, formData, {
        headers,
      }).catch(async () => {
        return axios.post(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/placement-drive/import-preview?tenant=${tenant}`, formData, {
          headers,
        });
      });

      setPreviewData(res.data?.data || res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to parse the Excel file.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData?.preview_rows || previewData.preview_rows.length === 0) return;

    setLoadingConfirm(true);
    setError(null);

    try {
      const tenant = getTenantSlug();
      const headers = getAuthHeaders();

      // Determine cohorts to associate with the imported companies
      let cohorts = [...queuedCohorts];
      if (cohorts.length === 0 && modalCourse) {
        const courseObj = localCoursesList.find(c => String(c.code) === String(modalCourse));
        const courseLabel = courseObj?.name || (modalCourse === '13' ? 'BCA' : `Course #${modalCourse}`);
        const branchObj = modalBranchesList.find(b => String(b.code) === String(modalBranch));
        const branchLabel = branchObj?.name || `Branch #${modalBranch}`;
        const batchObj = modalBatchesList.find(b => String(b.code) === String(modalBatch));
        const batchLabel = batchObj?.name || (batchObj?.year ? `Batch ${batchObj.year}` : `Batch #${modalBatch}`);

        cohorts = [{
          id: `${modalCourse}-${modalBranch}-${modalBatch}-${modalSemester}`,
          course_cd: modalCourse,
          course_name: courseLabel,
          branch_cd: modalBranch,
          branch_name: branchLabel,
          batch_cd: modalBatch,
          batch_name: batchLabel,
          semester: modalSemester,
        }];
      }

      const uniqueCourseCodes = Array.from(new Set(cohorts.map((c) => c.course_cd))).filter(Boolean);
      const uniqueCourseNames = Array.from(
        new Set(cohorts.map((c) => c.course_name ? String(c.course_name).replace(/^\[#\d+\]\s*/, '') : (c.course_cd === '13' ? 'BCA' : c.course_cd === '1' ? 'B.Tech' : `Course ${c.course_cd}`)))
      ).filter(Boolean);
      const uniqueBranchNames = Array.from(new Set(cohorts.map((c) => c.branch_name || c.branch_cd))).filter(Boolean);
      const uniqueBatchNames = Array.from(new Set(cohorts.map((c) => c.batch_name || c.batch_cd))).filter(Boolean);

      const payload = {
        batch_title: batchTitle,
        source_file_name: file?.name || 'placement_companies.xlsx',
        companies: previewData.preview_rows,
        target_cohorts: cohorts,
        eligibility_course_cd: uniqueCourseCodes.join(', ') || '13',
        eligible_courses: uniqueCourseNames,
        eligible_branches: uniqueBranchNames,
        eligible_batches: uniqueBatchNames,
      };

      await axios.post(`/api/placement-drive/import-confirm?tenant=${tenant}`, payload, { headers }).catch(async () => {
        return axios.post(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/placement-drive/import-confirm?tenant=${tenant}`, payload, { headers });
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save companies.');
    } finally {
      setLoadingConfirm(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const directUrl = '/templates/placement-drive-import-template.xlsx';
      const a = document.createElement('a');
      a.href = directUrl;
      a.download = 'placement-drive-import-template.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      try {
        const tenant = getTenantSlug();
        const res = await axios.get(`/api/placement-drive/template?tenant=${tenant}`).catch(async () => {
          return axios.get(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/placement-drive/template?tenant=${tenant}`);
        });
        if (res.data?.base64) {
          const link = document.createElement('a');
          link.href = `data:${res.data.contentType};base64,${res.data.base64}`;
          link.download = res.data.filename || 'placement-drive-import-template.xlsx';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } catch (err) {
        console.error('Failed to download template:', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 sm:p-7 sm:pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#5B4BFF]/10 text-[#5B4BFF] dark:bg-[#5B4BFF]/20 dark:text-[#7867FF]">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Import Placement Drives via Excel
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Server-side SheetJS parser with automatic column mapping & target academic cohorts filtering.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 sm:p-7 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Batch Title & Template Format */}
          <div className="space-y-3">
            {/* Download Template Format Card */}
            <div className="p-4 rounded-[22px] bg-gradient-to-r from-[#5B4BFF]/10 via-[#7867FF]/10 to-[#00C48C]/10 border border-[#5B4BFF]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-[#5B4BFF] shadow-xs shrink-0">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Download Excel Template Format</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#00C48C]/15 text-[#00C48C]">
                      Standard Format
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    Download the pre-formatted template with column headers, instructions, and sample rows.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[#5B4BFF] dark:text-[#7867FF] text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95 cursor-pointer hover:border-[#5B4BFF]"
              >
                <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Download Template (.xlsx)</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Drive Batch Title *
              </label>
              <input
                type="text"
                value={batchTitle}
                onChange={(e) => setBatchTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                placeholder="e.g. Campus Drive — August 2026"
              />
            </div>
          </div>

          {/* Section 2: Target Academic Cohorts (Course • Branch • Batch • Semester) */}
          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/80 p-4 rounded-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <span>🎯</span> 2. Target Academic Cohorts (Course • Branch • Batch • Semester)
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#5B4BFF]/10 text-[#5B4BFF] border border-[#5B4BFF]/20">
                {queuedCohorts.length} Target Cohort{queuedCohorts.length !== 1 ? 's' : ''} Added
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Only students enrolled in the selected academic cohorts will see these imported drives on their placement portal.
            </p>

            {cohortError && (
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                ⚠️ {cohortError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  🎓 Course *
                </label>
                <select
                  value={modalCourse}
                  onChange={(e) => handleModalCourseChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                >
                  {localCoursesList.map((crs, idx) => (
                    <option key={crs.code || idx} value={crs.code}>
                      [#{crs.code}] {crs.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  🏢 Branch * <span className="text-[#5B4BFF]">({modalBranchesList.length})</span>
                </label>
                <select
                  value={modalBranch}
                  onChange={(e) => {
                    setModalBranch(e.target.value);
                    setCohortError(null);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                >
                  {modalBranchesList.map((br: any, idx: number) => (
                    <option key={br.code || idx} value={br.code}>
                      [#{br.code}] {br.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  👥 Batch * <span className="text-[#5B4BFF]">({modalBatchesList.length})</span>
                </label>
                <select
                  value={modalBatch}
                  onChange={(e) => {
                    setModalBatch(e.target.value);
                    setCohortError(null);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                >
                  {modalBatchesList.map((batch: any, idx: number) => (
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
                  value={modalSemester}
                  onChange={(e) => {
                    setModalSemester(e.target.value);
                    setCohortError(null);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                >
                  <option value="All Semesters">All Semesters</option>
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                  <option value="Semester 3">Semester 3</option>
                  <option value="Semester 4">Semester 4</option>
                  <option value="Semester 5">Semester 5</option>
                  <option value="Semester 6">Semester 6</option>
                  <option value="Semester 7">Semester 7</option>
                  <option value="Semester 8">Semester 8</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleAddCohortToQueue}
                className="py-1.5 px-4 text-xs font-bold text-white bg-[#5B4BFF] hover:bg-indigo-600 rounded-lg shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Cohort to Drive
              </button>
            </div>

            {/* Added Queued Cohorts List */}
            {queuedCohorts.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-2 mt-2">
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-900 dark:text-white">
                  <span className="flex items-center gap-1.5">
                    <span>📋</span> Target Cohorts for Imported Companies ({queuedCohorts.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setQueuedCohorts([])}
                    className="text-[11px] text-rose-500 hover:underline font-bold cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <div className="max-h-36 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-700">
                  {queuedCohorts.map((cohort, idx) => (
                    <div key={cohort.id || idx} className="py-2 flex items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                        <span className="font-mono font-extrabold text-[#5B4BFF] bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded text-[11px] border border-indigo-200 dark:border-indigo-800">
                          [#{cohort.course_cd}] {cohort.course_name}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                          {cohort.branch_name}
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                          {cohort.batch_name}
                        </span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded text-[11px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                          {cohort.semester}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCohort(idx)}
                        className="text-rose-500 hover:text-rose-700 font-bold text-sm px-2 py-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Remove Cohort"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div ref={cohortListEndRef} />
          </div>

          {/* Section 3: File Upload Dropzone (Step 1) */}
          {!previewData && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                3. Choose Spreadsheet File
              </label>
              <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-[22px] p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#5B4BFF] hover:bg-[#5B4BFF]/5 transition-all group">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={loadingPreview}
                />
                {loadingPreview ? (
                  <div className="space-y-2 flex flex-col items-center">
                    <Loader2 className="w-8 h-8 text-[#5B4BFF] animate-spin" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      Parsing Excel spreadsheet and detecting column mappings...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 flex flex-col items-center">
                    <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-[#5B4BFF] group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white block">
                        Click to choose Excel sheet (.xlsx, .xls)
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Supports company name, package, branches, dates, and arbitrary extra columns.
                      </span>
                    </div>
                  </div>
                )}
              </label>
            </div>
          )}

          {/* Live Preview Confirmation (Step 2) */}
          {previewData && (
            <div className="space-y-4">
              {/* Detection Summary Banner */}
              <div className="p-4 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    {previewData.total_rows} Companies detected in {previewData.file_name}
                  </span>
                  <span className="text-slate-500 font-mono">
                    {previewData.recognized_columns.length} core fields mapped
                  </span>
                </div>

                {previewData.unrecognized_columns.length > 0 && (
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                    <Sparkles className="w-3.5 h-3.5 text-[#F36C21]" />
                    <span>Extra columns (stored in JSONB):</span>
                    {previewData.unrecognized_columns.map((col: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Table Preview */}
              <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold sticky top-0">
                    <tr>
                      <th className="p-3">Company</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Package (CTC)</th>
                      <th className="p-3">Branches</th>
                      <th className="p-3">Drive Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {previewData.preview_rows.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-extrabold text-slate-900 dark:text-white">
                          {row.company_name}
                        </td>
                        <td className="p-3 text-[#5B4BFF] font-semibold">{row.role}</td>
                        <td className="p-3 font-bold">{row.package_ctc}</td>
                        <td className="p-3">
                          {Array.isArray(row.eligible_branches) ? row.eligible_branches.join(', ') : row.eligible_branches}
                        </td>
                        <td className="p-3">{row.drive_date || 'TBA'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-[28px]">
          {previewData ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setPreviewData(null);
                  setFile(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                ← Choose Another File
              </button>

              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={loadingConfirm}
                className="px-6 py-2.5 rounded-xl text-xs font-black bg-[#5B4BFF] hover:bg-[#4a3ae0] text-white shadow-md transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95 cursor-pointer"
              >
                {loadingConfirm ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Committing to Placement Board...
                  </>
                ) : (
                  <>
                    Confirm & Publish {previewData.total_rows} Companies
                    {queuedCohorts.length > 0 && ` (${queuedCohorts.length} Cohorts)`}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="flex items-center justify-end w-full">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
