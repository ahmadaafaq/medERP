'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface MasterOption {
  id: string;
  code: string;
  name: string;
  raw?: any;
}

interface ExcelPreviewData {
  codes: {
    colg_cd: string;
    course_cd: string;
    branch_cd: string;
    batch_cd: string;
    sem_cd: string;
    sec_cd: string;
  };
  subjects: Array<{ id: string; code: string; name: string }>;
  students: Array<{
    sl_no: number;
    id: string;
    roll_no: string;
    registration_no: string;
    student_name: string;
    colg_cd: string;
    course_cd: string;
    branch_cd: string;
    batch_cd: string;
    sem_cd: string;
    sec_cd: string;
    attendance?: Record<string, { lh: number; la: number }>;
    total_lh?: number;
    total_la?: number;
    total_att?: number | null;
  }>;
}

interface AttendanceExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: (summary: any) => void;
}

const extractArr = (json: any): any[] => {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.data?.data)) return json.data.data;
  return [];
};

export default function AttendanceExcelModal({
  isOpen,
  onClose,
  onUploadSuccess,
}: AttendanceExcelModalProps) {
  const [collegesList, setCollegesList] = useState<MasterOption[]>([]);
  const [coursesList, setCoursesList] = useState<MasterOption[]>([]);
  const [branchesList, setBranchesList] = useState<MasterOption[]>([]);
  const [batchesList, setBatchesList] = useState<MasterOption[]>([]);
  const [semestersList, setSemestersList] = useState<MasterOption[]>([]);
  const [sectionsList, setSectionsList] = useState<MasterOption[]>([]);

  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('1');
  const [selectedSection, setSelectedSection] = useState('1');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [toDate, setToDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const [preview, setPreview] = useState<ExcelPreviewData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const getAuth = useCallback((overrideSlug?: string) => {
    const defSlug = (
      (typeof window !== 'undefined'
        ? localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || ''
        : '') || 'mdis'
    ).replace(/^tenant_/, '').replace(/^tenant-/, '');
    const slug = (overrideSlug || selectedCollege || defSlug).replace(/^tenant_/, '').replace(/^tenant-/, '');
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const headers: Record<string, string> = {
      'x-tenant-slug': slug,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    return { slug, headers };
  }, [selectedCollege]);

  // 1. Load Colleges on open
  useEffect(() => {
    if (!isOpen) return;
    const init = async () => {
      const { slug, headers } = getAuth();
      try {
        const res = await fetch(`/api/v1/college-master/colleges?tenant=${encodeURIComponent(slug)}`, { headers, cache: 'no-store' }).catch(() => null);
        if (res && res.ok) {
          const rows = extractArr(await res.json());
          if (rows.length > 0) {
            const mapped: MasterOption[] = rows.map((c: any) => ({
              id: String(c.slug || c.code || c.id),
              code: String(c.code || c.slug || c.id),
              name: String(c.name || c.college_name || c.slug),
              raw: c,
            }));
            setCollegesList(mapped);
            const match = mapped.find(c => c.id.toLowerCase() === slug.toLowerCase() || c.code.toLowerCase() === slug.toLowerCase()) || mapped[0];
            setSelectedCollege(match.id);
            return;
          }
        }
      } catch {}
      setCollegesList([{ id: slug, code: slug, name: slug.toUpperCase() }]);
      setSelectedCollege(slug);
    };
    init();
  }, [isOpen]);

  // 2. Load Courses
  useEffect(() => {
    if (!isOpen || !selectedCollege) return;
    const load = async () => {
      const { slug, headers } = getAuth(selectedCollege);
      const res = await fetch(`/api/v1/college-master/courses?tenant=${encodeURIComponent(slug)}`, { headers, cache: 'no-store' }).catch(() => null);
      if (res && res.ok) {
        const rows = extractArr(await res.json());
        const mapped = rows.map((c: any) => ({
          id: String(c.course_cd || c.code || c.id),
          code: String(c.course_cd || c.code || c.id),
          name: String(c.name || c.course_name || c.code),
          raw: c,
        }));
        setCoursesList(mapped);
        if (mapped.length > 0 && !mapped.some(m => m.code === selectedCourse)) {
          setSelectedCourse(mapped[0].code);
        }
      }
    };
    load();
  }, [isOpen, selectedCollege]);

  // 3. Load Branches
  useEffect(() => {
    if (!isOpen || !selectedCollege || !selectedCourse) return;
    const load = async () => {
      const { slug, headers } = getAuth(selectedCollege);
      const qp = new URLSearchParams({ tenant: slug, course_cd: selectedCourse });
      const res = await fetch(`/api/v1/college-master/branches?${qp.toString()}`, { headers, cache: 'no-store' }).catch(() => null);
      if (res && res.ok) {
        let rows = extractArr(await res.json()).filter((b: any) => Boolean(b.course_cd || b.course_code || b.branch_cd));
        const target = selectedCourse.toLowerCase();
        const byCourse = rows.filter((b: any) => String(b.course_cd || b.course_code || '').toLowerCase() === target);
        if (byCourse.length > 0) rows = byCourse;
        const mapped = rows.map((b: any) => ({
          id: String(b.id || b.branch_cd || b.code),
          code: String(b.branch_cd || b.code || b.id),
          name: String(b.name || b.department_name || b.code),
          raw: b,
        }));
        setBranchesList(mapped);
        if (mapped.length > 0) setSelectedBranch(mapped[0].id);
        else setSelectedBranch('');
      }
    };
    load();
  }, [isOpen, selectedCollege, selectedCourse]);

  // 4. Load Batches
  useEffect(() => {
    if (!isOpen || !selectedCollege || !selectedCourse) return;
    const load = async () => {
      const { slug, headers } = getAuth(selectedCollege);
      const qp = new URLSearchParams({ tenant: slug, course_cd: selectedCourse });
      if (selectedBranch) qp.set('branch_cd', selectedBranch);
      const res = await fetch(`/api/v1/college-master/batches?${qp.toString()}`, { headers, cache: 'no-store' }).catch(() => null);
      if (res && res.ok) {
        const rows = extractArr(await res.json());
        const mapped = rows.map((b: any) => ({
          id: String(b.id || b.batch_cd || b.code),
          code: String(b.batch_cd || b.code || b.year || b.id),
          name: String(b.name || `Batch ${b.year || b.code || b.id}`),
          raw: b,
        }));
        setBatchesList(mapped);
        if (mapped.length > 0) setSelectedBatch(mapped[0].code);
        else setSelectedBatch('');
      }
    };
    load();
  }, [isOpen, selectedCollege, selectedCourse, selectedBranch]);

  // 5. Load Semesters
  useEffect(() => {
    if (!isOpen || !selectedCollege) return;
    const load = async () => {
      const { slug, headers } = getAuth(selectedCollege);
      const res = await fetch(`/api/v1/college-master/professionals?tenant=${encodeURIComponent(slug)}`, { headers, cache: 'no-store' }).catch(() => null);
      if (res && res.ok) {
        let rows = extractArr(await res.json());
        if (selectedCourse) {
          const byC = rows.filter((p: any) => !p.course_cd || String(p.course_cd).toLowerCase() === selectedCourse.toLowerCase());
          if (byC.length > 0) rows = byC;
        }
        if (rows.length > 0) {
          const seen = new Set<string>();
          const mapped: MasterOption[] = [];
          for (const p of rows) {
            const code = String(p.phase_order || p.code || p.id).replace(/\D/g, '') || String(p.phase_order || p.code);
            if (!seen.has(code)) {
              seen.add(code);
              mapped.push({ id: code, code, name: String(p.name || `Semester ${code}`) });
            }
          }
          setSemestersList(mapped);
          if (mapped.length > 0 && !mapped.some(m => m.code === selectedSemester)) {
            setSelectedSemester(mapped[0].code);
          }
          return;
        }
      }
      setSemestersList([1, 2, 3, 4, 5, 6, 7, 8].map(n => ({ id: String(n), code: String(n), name: `Semester ${n}` })));
    };
    load();
  }, [isOpen, selectedCollege, selectedCourse]);

  // 6. Load Sections
  useEffect(() => {
    if (!isOpen || !selectedCollege) return;
    const load = async () => {
      const { slug, headers } = getAuth(selectedCollege);
      const qp = new URLSearchParams({ tenant: slug });
      if (selectedCourse) qp.set('courseId', selectedCourse);
      if (selectedBranch) qp.set('departmentId', selectedBranch);
      if (selectedBatch) qp.set('batchId', selectedBatch);
      if (selectedSemester) qp.set('semester', selectedSemester);
      const res = await fetch(`/api/v1/college-master/sections?${qp.toString()}`, { headers, cache: 'no-store' }).catch(() => null);
      if (res && res.ok) {
        const rows = extractArr(await res.json());
        if (rows.length > 0) {
          const seen = new Set<string>();
          const mapped: MasterOption[] = [];
          for (const s of rows) {
            const code = String(s.code || s.name || s.id);
            if (!seen.has(code)) {
              seen.add(code);
              mapped.push({ id: code, code, name: String(s.name || `Section ${code}`) });
            }
          }
          setSectionsList(mapped);
          if (!mapped.some(m => m.code === selectedSection)) {
            setSelectedSection(mapped[0].code);
          }
          return;
        }
      }
      setSectionsList([{ id: '1', code: '1', name: 'Section 1' }]);
      setSelectedSection('1');
    };
    load();
  }, [isOpen, selectedCollege, selectedCourse, selectedBranch, selectedBatch, selectedSemester]);

  // 7. Fetch Live Excel Format Preview
  const fetchPreview = useCallback(async () => {
    if (!isOpen || !selectedCollege || !selectedCourse) return;
    setLoadingPreview(true);
    setFeedback(null);
    try {
      const { slug, headers } = getAuth(selectedCollege);
      const colObj = collegesList.find(c => c.id === selectedCollege);
      const qp = new URLSearchParams({
        tenant: slug,
        collegeCode: colObj?.code || slug,
        courseCd: selectedCourse,
        branchCd: selectedBranch,
        batchId: selectedBatch,
        semester: selectedSemester,
        section: selectedSection,
        fromDate,
        toDate,
      });
      const res = await fetch(`/api/v1/attendance/excel-preview?${qp.toString()}`, { headers, cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setPreview(json?.data ?? json);
      }
    } catch {
      setPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  }, [isOpen, selectedCollege, selectedCourse, selectedBranch, selectedBatch, selectedSemester, selectedSection, fromDate, toDate, collegesList, getAuth]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  // Download .xlsx Template
  const handleDownloadTemplate = async () => {
    setDownloading(true);
    setFeedback(null);
    try {
      const { slug, headers } = getAuth(selectedCollege);
      const colObj = collegesList.find(c => c.id === selectedCollege);
      const qp = new URLSearchParams({
        tenant: slug,
        collegeCode: colObj?.code || slug,
        courseCd: selectedCourse,
        branchCd: selectedBranch,
        batchId: selectedBatch,
        semester: selectedSemester,
        section: selectedSection,
      });
      const res = await fetch(`/api/v1/attendance/excel-template?${qp.toString()}`, { headers });
      if (!res.ok) throw new Error('Failed to generate Excel format.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FORMAT_ATTENDANCE_${selectedCourse || 'COURSE'}_SEM${selectedSemester}_SEC${selectedSection}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setFeedback({ type: 'info', text: 'Excel format downloaded! Fill only LH (Lecture Held) and LA (Lecture Attended) columns, then upload below.' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Failed to download Excel format.' });
    } finally {
      setDownloading(false);
    }
  };

  // Upload Filled Excel
  const handleUploadExcel = async () => {
    if (!selectedFile) {
      setFeedback({ type: 'error', text: 'Please select a filled .xlsx file to upload.' });
      return;
    }
    if (!fromDate || !toDate) {
      setFeedback({ type: 'error', text: 'Please select both From Date and To Date for the attendance period.' });
      return;
    }
    if (fromDate > toDate) {
      setFeedback({ type: 'error', text: 'From Date cannot be later than To Date.' });
      return;
    }
    setUploading(true);
    setFeedback(null);
    try {
      const base64: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read selected file.'));
        reader.readAsDataURL(selectedFile);
      });

      const { slug, headers } = getAuth(selectedCollege);
      const res = await fetch('/api/v1/attendance/excel-upload', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant: slug,
          fileName: selectedFile.name,
          fileBase64: base64,
          courseCd: selectedCourse,
          branchCd: selectedBranch,
          batchId: selectedBatch,
          semester: selectedSemester,
          section: selectedSection,
          fromDate,
          toDate,
        }),
      });
      const json = await res.json();
      const payload = json?.data ?? json;
      if (!res.ok || payload?.success === false) {
        throw new Error(payload?.message || json?.message || 'Upload failed.');
      }
      const sum = payload?.summary || {};
      await fetchPreview();
      const unchangedNote = sum.subjectsUnchanged ? ` (${sum.subjectsUnchanged} subject(s) unchanged & kept as-is)` : '';
      setFeedback({
        type: sum.subjectsProcessed === 0 && sum.subjectsUnchanged > 0 ? 'info' : 'success',
        text:
          sum.subjectsProcessed === 0 && sum.subjectsUnchanged > 0
            ? payload?.message || `No changes detected (${sum.fromDate || fromDate} to ${sum.toDate || toDate}) — existing attendance kept as-is.`
            : `Attendance updated (${sum.fromDate || fromDate} to ${sum.toDate || toDate})! ${sum.subjectsProcessed || 0} subject(s) updated${unchangedNote}, ${sum.recordsSaved || 0} record(s) saved.`,
      });
      setSelectedFile(null);
      if (onUploadSuccess) onUploadSuccess(sum);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Failed to upload Excel attendance.' });
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#2D2575] to-[#5B4BFF] text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 rounded-xl bg-white/15">📊</span>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                Excel Bulk Attendance — Download Format &amp; Upload
              </h3>
              <p className="text-xs text-white/80">
                Select College → Course → Branch → Batch → Semester → Section, download template, fill only LH &amp; LA, and upload.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 text-white font-black flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Feedback */}
          {feedback && (
            <div className={`p-3.5 rounded-xl text-xs font-bold border flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
                : feedback.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200'
                : 'bg-indigo-50 border-indigo-200 text-indigo-800 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-200'
            }`}>
              <span>{feedback.text}</span>
              <button onClick={() => setFeedback(null)} className="opacity-60 hover:opacity-100 ml-3">✕</button>
            </div>
          )}

          {/* Step 1: Cascading Selectors */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
            <p className="text-[11px] font-black uppercase tracking-wider text-[#F36C21]">
              1. Select Academic Hierarchy (College → Course → Branch → Batch → Semester → Section)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">College</label>
                <select
                  value={selectedCollege}
                  onChange={e => setSelectedCollege(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                >
                  {collegesList.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Course</label>
                <select
                  value={selectedCourse}
                  onChange={e => setSelectedCourse(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                >
                  {coursesList.map(c => (
                    <option key={c.id} value={c.code}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Branch</label>
                <select
                  value={selectedBranch}
                  onChange={e => setSelectedBranch(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                >
                  {branchesList.length === 0 && <option value="">Default Branch</option>}
                  {branchesList.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Batch</label>
                <select
                  value={selectedBatch}
                  onChange={e => setSelectedBatch(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                >
                  {batchesList.length === 0 && <option value="">All Batches</option>}
                  {batchesList.map(b => (
                    <option key={b.id} value={b.code}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Semester</label>
                <select
                  value={selectedSemester}
                  onChange={e => setSelectedSemester(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                >
                  {semestersList.map(s => (
                    <option key={s.id} value={s.code}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Section</label>
                <select
                  value={selectedSection}
                  onChange={e => setSelectedSection(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                >
                  {sectionsList.map(sec => (
                    <option key={sec.id} value={sec.code}>{sec.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Range for Excel Attendance Upload */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 items-end">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">From Date (Attendance Period)</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">To Date (Attendance Period)</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                />
              </div>
              <div className="sm:col-span-2 text-[11px] text-slate-500 dark:text-slate-400 pb-1">
                Uploaded LH / LA lectures will be distributed across <span className="font-bold text-slate-700 dark:text-slate-200">{fromDate || '—'}</span> to <span className="font-bold text-slate-700 dark:text-slate-200">{toDate || '—'}</span>.
              </div>
            </div>
          </div>

          {/* Step 2: Action Bar (Download Format + Upload Filled Excel) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black text-emerald-800 dark:text-emerald-300">
                  2. Download Pre-Filled Excel Format
                </p>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400">
                  Includes {preview?.students?.length || 0} students &amp; {preview?.subjects?.length || 0} subject(s) with LH / LA columns.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                disabled={downloading || !preview || preview.students.length === 0}
                className="px-4 py-2.5 rounded-xl bg-[#00C48C] hover:bg-[#00b07d] text-white text-xs font-black shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer shrink-0"
              >
                {downloading ? 'Generating...' : '⬇ Download Excel'}
              </button>
            </div>

            <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-[#5B4BFF]">
                  3. Upload Filled Excel (LH &amp; LA)
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                  className="mt-1.5 block w-full text-[11px] text-slate-600 dark:text-slate-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-[#5B4BFF]/10 file:text-[#5B4BFF] hover:file:bg-[#5B4BFF]/20"
                />
              </div>
              <button
                type="button"
                onClick={handleUploadExcel}
                disabled={uploading || !selectedFile}
                className="px-4 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4a3be6] text-white text-xs font-black shadow-md shadow-indigo-500/20 disabled:opacity-50 cursor-pointer shrink-0"
              >
                {uploading ? 'Uploading...' : '⬆ Upload & Save'}
              </button>
            </div>
          </div>

          {/* Step 3: Visible Excel Format Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Live Excel Format Preview ({preview?.students?.length || 0} Students • {preview?.subjects?.length || 0} Subjects)
              </h4>
              {preview?.codes && (
                <span className="text-[11px] font-mono text-slate-500">
                  colg: {preview.codes.colg_cd} | course: {preview.codes.course_cd} | branch: {preview.codes.branch_cd} | batch: {preview.codes.batch_cd} | sem: {preview.codes.sem_cd} | sec: {preview.codes.sec_cd}
                </span>
              )}
            </div>

            {loadingPreview ? (
              <div className="py-10 text-center text-xs font-bold text-slate-400">
                Loading students and subjects from Master...
              </div>
            ) : !preview || preview.students.length === 0 ? (
              <div className="py-10 text-center text-xs font-bold text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
                No active students found for this selection. Try selecting a different Course / Branch / Batch / Section.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 max-h-80">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="sticky top-0 z-10 bg-[#2D2575] text-white">
                    <tr>
                      <th rowSpan={2} className="py-2 px-2.5 border border-white/15">sl_no</th>
                      <th rowSpan={2} className="py-2 px-2.5 border border-white/15">roll_no</th>
                      <th rowSpan={2} className="py-2 px-2.5 border border-white/15 min-w-[160px]">student_name</th>
                      <th rowSpan={2} className="py-2 px-2 border border-white/15">colg_cd</th>
                      <th rowSpan={2} className="py-2 px-2 border border-white/15">course_cd</th>
                      <th rowSpan={2} className="py-2 px-2 border border-white/15">branch_cd</th>
                      <th rowSpan={2} className="py-2 px-2 border border-white/15">batch_cd</th>
                      <th rowSpan={2} className="py-2 px-2 border border-white/15">sem_cd</th>
                      <th rowSpan={2} className="py-2 px-2 border border-white/15">sec_cd</th>
                      {preview.subjects.map((subj, idx) => {
                        const headerColors = ['bg-[#F36C21]', 'bg-[#5B4BFF]', 'bg-teal-600', 'bg-sky-600', 'bg-violet-600', 'bg-pink-600'];
                        const bgCls = headerColors[idx % headerColors.length];
                        const lowerName = String(subj.name || '').trim().toLowerCase();
                        return (
                          <th key={subj.id} colSpan={2} className={`py-1.5 px-2.5 border border-white/15 text-center align-middle ${bgCls}`} title={subj.name}>
                            {lowerName && lowerName !== String(subj.code || '').toLowerCase() && (
                              <div className="text-[9px] font-normal lowercase text-white/90 leading-tight max-w-[130px] mx-auto truncate">
                                {lowerName}
                              </div>
                            )}
                            <div className="text-[11px] font-black tracking-wide leading-tight">
                              {subj.code}
                            </div>
                          </th>
                        );
                      })}
                      <th rowSpan={2} className="py-2 px-2.5 border border-white/15 text-center bg-emerald-700 whitespace-nowrap">
                        Total_ATT (%)
                      </th>
                    </tr>
                    <tr className="bg-[#231c5c]">
                      {preview.subjects.map(subj => (
                        <React.Fragment key={subj.id}>
                          <th className="py-1 px-2 border border-white/15 text-center">LH</th>
                          <th className="py-1 px-2 border border-white/15 text-center">LA</th>
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {preview.students.map(st => {
                      const pct = st.total_att;
                      const pctClass =
                        pct === null || pct === undefined
                          ? 'text-slate-400'
                          : pct >= 75
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : pct >= 60
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300';
                      return (
                        <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-1.5 px-2.5 font-mono text-slate-400">{st.sl_no}</td>
                          <td className="py-1.5 px-2.5 font-mono font-bold text-slate-800 dark:text-slate-200">{st.roll_no || '-'}</td>
                          <td className="py-1.5 px-2.5 font-bold text-slate-900 dark:text-white">{st.student_name}</td>
                          <td className="py-1.5 px-2 font-mono text-slate-500">{st.colg_cd}</td>
                          <td className="py-1.5 px-2 font-mono text-slate-500">{st.course_cd}</td>
                          <td className="py-1.5 px-2 font-mono text-slate-500">{st.branch_cd}</td>
                          <td className="py-1.5 px-2 font-mono text-slate-500">{st.batch_cd}</td>
                          <td className="py-1.5 px-2 font-mono text-slate-500">{st.sem_cd}</td>
                          <td className="py-1.5 px-2 font-mono text-slate-500">{st.sec_cd}</td>
                          {preview.subjects.map(subj => {
                            const att = st.attendance?.[subj.id];
                            const hasData = att && att.lh > 0;
                            return (
                              <React.Fragment key={subj.id}>
                                <td className={`py-1.5 px-2 text-center border-l border-slate-100 dark:border-slate-800 font-mono ${hasData ? 'font-bold text-slate-800 dark:text-slate-100' : 'text-slate-400'}`}>
                                  {hasData ? att.lh : '-'}
                                </td>
                                <td className={`py-1.5 px-2 text-center font-mono ${hasData ? 'font-bold text-[#5B4BFF] dark:text-indigo-300' : 'text-slate-400'}`}>
                                  {hasData ? att.la : '-'}
                                </td>
                              </React.Fragment>
                            );
                          })}
                          <td className="py-1.5 px-2.5 text-center border-l border-slate-100 dark:border-slate-800" title={st.total_lh ? `${st.total_la || 0} / ${st.total_lh}` : 'No lectures recorded'}>
                            {pct !== null && pct !== undefined ? (
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black font-mono ${pctClass}`}>
                                {pct.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
