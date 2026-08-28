'use client';

import React, { useState, useEffect } from 'react';

interface CourseOption {
  course_cd: string;
  course_name: string;
}

interface DepartmentOption {
  id: string;
  name: string;
  code?: string;
  course_cd?: string;
  branch_cd?: string;
}

interface BatchOption {
  year: number | string;
  code?: string;
  batch_cd?: number | string;
  batch_name?: string;
}

interface ChatAddBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBatch: (params: {
    course_cd?: string;
    course_name?: string;
    department_id?: string;
    department_name: string;
    batch_year: string;
    batch_code?: string;
  }) => Promise<boolean>;
}

export default function ChatAddBatchModal({
  isOpen,
  onClose,
  onAddBatch,
}: ChatAddBatchModalProps) {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);

  const [selectedCourseCd, setSelectedCourseCd] = useState<string>('');
  const [selectedCourseName, setSelectedCourseName] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedDeptName, setSelectedDeptName] = useState<string>('');
  const [selectedBatchYear, setSelectedBatchYear] = useState<string>('2025');

  const [loadingOptions, setLoadingOptions] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadDropdownOptions();
    }
  }, [isOpen]);

  const loadDropdownOptions = async () => {
    try {
      setLoadingOptions(true);
      setErrorMsg('');

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const tenant = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-cet-bareilly' : 'srms-cet-bareilly';

      // 1. Fetch courses
      let courseList: CourseOption[] = [];
      try {
        const cRes = await fetch(`/api/srms/courses?tenant=${tenant}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cRes.ok) {
          const cJson = await cRes.json();
          if (Array.isArray(cJson) && cJson.length > 0) {
            courseList = cJson.map((c: any) => ({
              course_cd: String(c.course_cd || c.code || c.id),
              course_name: String(c.course_name || c.name || 'Course'),
            }));
          }
        }
      } catch {}

      if (courseList.length === 0) {
        courseList = [
          { course_cd: '13', course_name: 'B.Tech (Bachelor of Technology)' },
          { course_cd: '14', course_name: 'BCA (Bachelor of Computer Applications)' },
          { course_cd: '15', course_name: 'MCA (Master of Computer Applications)' },
          { course_cd: '1', course_name: 'MBBS (Bachelor of Medicine)' },
          { course_cd: '2', course_name: 'B.Pharm (Pharmacy)' },
        ];
      }
      setCourses(courseList);
      if (courseList.length > 0) {
        setSelectedCourseCd(courseList[0].course_cd);
        setSelectedCourseName(courseList[0].course_name);
      }

      // 2. Fetch branches / departments
      const initialCourseCd = courseList[0]?.course_cd || '13';
      const initialCourseName = courseList[0]?.course_name || 'BCA';
      await loadBranchesForCourse(initialCourseCd, initialCourseName, tenant, token);
      await loadBatchesForCourse(initialCourseCd, tenant, token);
    } catch (err: any) {
      console.error('Error loading dropdown options:', err);
      setErrorMsg('Failed to load courses or departments.');
    } finally {
      setLoadingOptions(false);
    }
  };

  const loadBatchesForCourse = async (courseCd: string, tenant: string, token: string) => {
    let batchList: BatchOption[] = [];
    try {
      const isMed = tenant.includes('ims') || tenant.includes('med');
      const defaultColg = isMed ? '11' : '1';
      const btRes = await fetch('/api/srms/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ colgcd: defaultColg, coursecd: courseCd, tenantSlug: tenant }),
      }).catch(() => null);

      if (btRes && btRes.ok) {
        const bJson = await btRes.json();
        const list = Array.isArray(bJson) ? bJson : bJson.data || [];
        batchList = list.map((b: any) => {
          const rawYr = String(b.batch_name || b.year || b.name || b.batch_cd || '2025');
          const cleanYr = rawYr.replace(/[^0-9]/g, '') || rawYr;
          return {
            year: cleanYr,
            batch_name: b.batch_name?.startsWith('Batch') ? b.batch_name : `Batch ${b.batch_name || cleanYr}`,
          };
        });
      }
    } catch {}

    if (batchList.length === 0) {
      batchList = [
        { year: '2025', batch_name: 'Batch 2025' },
        { year: '2024', batch_name: 'Batch 2024' },
        { year: '2023', batch_name: 'Batch 2023' },
        { year: '2026', batch_name: 'Batch 2026' },
      ];
    }
    setBatches(batchList);
    if (batchList.length > 0) {
      setSelectedBatchYear(String(batchList[0].year));
    }
  };

  const loadBranchesForCourse = async (courseCd: string, courseName: string, tenant: string, token: string) => {
    let deptList: DepartmentOption[] = [];
    try {
      const bRes = await fetch(`/api/srms/branches?coursecd=${courseCd}&tenant=${tenant}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (bRes.ok) {
        const bJson = await bRes.json();
        if (Array.isArray(bJson) && bJson.length > 0) {
          deptList = bJson.map((d: any) => {
            const rawName = String(d.name || d.branch_name || d.department_name || '').trim();
            const cleanName = (!rawName || rawName === '-' || rawName === 'null')
              ? `${courseName} (Core / Main)`
              : rawName;
            return {
              id: String(d.id || d.branch_cd || d.code || '1'),
              name: cleanName,
              code: String(d.code || d.branch_cd || ''),
              course_cd: String(d.course_cd || courseCd),
            };
          });
        }
      }
    } catch {}

    if (deptList.length === 0) {
      deptList = [
        { id: `${courseCd}-main`, name: `${courseName} (Department)`, code: courseCd, course_cd: courseCd },
      ];
    }
    setDepartments(deptList);
    if (deptList.length > 0) {
      setSelectedDeptId(deptList[0].id);
      setSelectedDeptName(deptList[0].name);
    }
  };

  const handleCourseChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cd = e.target.value;
    setSelectedCourseCd(cd);
    const found = courses.find((c) => c.course_cd === cd);
    const cName = found?.course_name || 'Course';
    setSelectedCourseName(cName);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const tenant = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-cet-bareilly' : 'srms-cet-bareilly';
    await loadBranchesForCourse(cd, cName, tenant, token);
    await loadBatchesForCourse(cd, tenant, token);
  };

  const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dId = e.target.value;
    setSelectedDeptId(dId);
    const found = departments.find((d) => d.id === dId || d.name === dId);
    if (found) setSelectedDeptName(found.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDeptName = (!selectedDeptName || selectedDeptName === '-' || selectedDeptName === 'null')
      ? (selectedCourseName || 'General Department')
      : selectedDeptName;

    try {
      setSubmitting(true);
      setErrorMsg('');

      const success = await onAddBatch({
        course_cd: selectedCourseCd,
        course_name: selectedCourseName,
        department_id: selectedDeptId,
        department_name: cleanDeptName,
        batch_year: selectedBatchYear,
        batch_code: `${selectedBatchYear}-${cleanDeptName.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '')}`,
      });

      if (success) {
        onClose();
      } else {
        setErrorMsg('Could not add batch group. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to add batch group.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800 shadow-2xl overflow-hidden transition-all transform animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#2D2575] to-[#3E3498] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-xl shadow-inner">
              📚
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">
                Add Batch Discussion Group
              </h2>
              <p className="text-xs text-white/80">
                Select Course, Department, and Batch to add to your discussion sidebar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {loadingOptions ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-[#5B4BFF] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium">
                Loading academic courses & departments...
              </p>
            </div>
          ) : (
            <>
              {/* Step 1: Course Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1B1E28] dark:text-slate-200 flex items-center gap-1.5">
                  <span>🎓</span>
                  <span>Select Course / Degree Program</span>
                </label>
                <select
                  value={selectedCourseCd}
                  onChange={handleCourseChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-800 bg-white dark:bg-slate-800 text-[#1B1E28] dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] transition-all"
                >
                  {courses.map((c) => (
                    <option key={c.course_cd} value={c.course_cd}>
                      {c.course_name} ({c.course_cd})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Department / Branch Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1B1E28] dark:text-slate-200 flex items-center gap-1.5">
                  <span>🏛️</span>
                  <span>Select Branch / Department</span>
                </label>
                <select
                  value={selectedDeptId}
                  onChange={handleDeptChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-800 bg-white dark:bg-slate-800 text-[#1B1E28] dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] transition-all"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.code ? `(${d.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 3: Batch Year Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1B1E28] dark:text-slate-200 flex items-center gap-1.5">
                  <span>📅</span>
                  <span>Select Batch Year</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {batches.map((b) => {
                    const isSelected = selectedBatchYear === String(b.year);
                    return (
                      <button
                        key={String(b.year)}
                        type="button"
                        onClick={() => setSelectedBatchYear(String(b.year))}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          isSelected
                            ? 'bg-[#5B4BFF] text-white border-[#5B4BFF] shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800 text-[#4E5969] dark:text-slate-300 border-[#E7EAF3] dark:border-slate-700 hover:border-[#5B4BFF]'
                        }`}
                      >
                        {b.year} Batch
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50/70 to-purple-50/70 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-[#5B4BFF] tracking-wider">
                    Discussion Group Preview
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#00C48C]/15 text-[#00C48C] text-[10px] font-bold">
                    Active Channel
                  </span>
                </div>
                <p className="text-sm font-black text-[#1B1E28] dark:text-white">
                  💬 {selectedBatchYear} Batch · {(!selectedDeptName || selectedDeptName === '-' || selectedDeptName === 'null') ? selectedCourseName : selectedDeptName}
                </p>
                <p className="text-[11px] text-[#4E5969] dark:text-slate-400">
                  Course: <strong>{selectedCourseName}</strong>. Enrolled students and faculty will be connected. This channel will remain saved in your sidebar list.
                </p>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E7EAF3] dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-800 text-[#4E5969] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loadingOptions}
              className="px-5 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4E3FE3] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Adding to List...</span>
                </>
              ) : (
                <>
                  <span>➕</span>
                  <span>Add to My Discussions</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
