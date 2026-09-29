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
  id?: string;
  year: number | string;
  code?: string;
  batch_cd?: number | string;
  batch_name?: string;
  name?: string;
  course_cd?: string;
  department_id?: string;
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
    tenant?: string;
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

  // All options from DB — used for cascading in-memory filters
  const [allDepartments, setAllDepartments] = useState<DepartmentOption[]>([]);
  const [allBatches, setAllBatches] = useState<BatchOption[]>([]);

  const [selectedCourseCd, setSelectedCourseCd] = useState<string>('');
  const [selectedCourseName, setSelectedCourseName] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedDeptName, setSelectedDeptName] = useState<string>('');
  const [selectedBatchCode, setSelectedBatchCode] = useState<string>('');
  const [selectedBatchYear, setSelectedBatchYear] = useState<string>('');
  const [selectedBatchName, setSelectedBatchName] = useState<string>('');

  const [loadingOptions, setLoadingOptions] = useState<boolean>(true);
  const [loadingBatches, setLoadingBatches] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const getActiveTenant = () => {
    if (typeof window === 'undefined') return '';
    let slug = (
      localStorage.getItem('tenantSlug') ||
      localStorage.getItem('selectedTenant') ||
      localStorage.getItem('tenant') ||
      localStorage.getItem('institutionSlug') ||
      ''
    ).replace(/^tenant_/, '').replace(/^tenant-/, '');

    if (!slug) {
      try {
        const rawUser = localStorage.getItem('user') || localStorage.getItem('auth_user');
        if (rawUser) {
          const u = JSON.parse(rawUser);
          slug = (u.tenantSlug || u.tenant || u.firmSlug || u.college_slug || '').replace(/^tenant_/, '').replace(/^tenant-/, '');
        }
      } catch {}
    }

    if (!slug && typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)auth_tenant=([^;]+)/);
      if (match && match[1]) {
        slug = decodeURIComponent(match[1]).replace(/^tenant_/, '').replace(/^tenant-/, '');
      }
    }

    if (!slug && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      slug = (params.get('tenant') || params.get('tenantSlug') || '').replace(/^tenant_/, '').replace(/^tenant-/, '');
    }

    return slug;
  };

  useEffect(() => {
    if (isOpen) {
      loadDropdownOptions();
    }
  }, [isOpen]);

  /**
   * Load all courses, departments, and batches from the chat selection-options endpoint.
   * This uses PostgreSQL data for ALL tenants (including non-SRMS like rimt-bareilly).
   */
  const loadDropdownOptions = async () => {
    try {
      setLoadingOptions(true);
      setErrorMsg('');

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const tenant = getActiveTenant();

      // Load all data in one call from DB-backed selection-options endpoint
      const res = await fetch(`/api/v1/chat/selection-options?tenant=${encodeURIComponent(tenant)}`, {
        headers: { Authorization: `Bearer ${token}`, 'x-tenant-slug': tenant },
      }).catch(() => null);

      let courseList: CourseOption[] = [];
      let deptList: DepartmentOption[] = [];
      let batchList: BatchOption[] = [];

      if (res && res.ok) {
        const json = await res.json();
        const data = json.data || {};

        courseList = (data.courses || []).map((c: any) => ({
          course_cd: String(c.course_cd || c.code || c.id || ''),
          course_name: String(c.course_name || c.name || 'Course'),
        })).filter((c: CourseOption) => c.course_cd);

        deptList = (data.departments || []).map((d: any) => ({
          id: String(d.id || d.branch_cd || d.code || ''),
          name: String(d.name || d.department_name || 'Department'),
          code: String(d.code || d.branch_cd || ''),
          branch_cd: String(d.branch_cd || d.code || ''),
          course_cd: String(d.course_cd || ''),
        }));

        batchList = (data.batches || []).map((b: any) => {
          const rawYear = String(b.year || b.batch_cd || '').replace(/[^0-9]/g, '');
          const displayName = b.name || (rawYear ? `Batch ${rawYear}` : `Batch ${b.code || ''}`);
          return {
            id: String(b.id || b.code || rawYear),
            code: String(b.code || b.batch_cd || rawYear),
            batch_cd: b.batch_cd || b.code,
            year: rawYear,
            batch_name: displayName,
            name: displayName,
            course_cd: b.course_cd ? String(b.course_cd) : '',
            department_id: b.department_id ? String(b.department_id) : '',
          };
        });
      }

      setCourses(courseList);
      setAllDepartments(deptList);
      setAllBatches(batchList);

      // Set initial selection with first course
      const initialCourse = courseList[0];
      if (initialCourse) {
        setSelectedCourseCd(initialCourse.course_cd);
        setSelectedCourseName(initialCourse.course_name);
        applyCourseCascade(initialCourse.course_cd, deptList, batchList);
      } else {
        setDepartments([]);
        setBatches([]);
      }
    } catch (err: any) {
      console.error('Error loading dropdown options:', err);
      setErrorMsg('Failed to load courses or departments.');
    } finally {
      setLoadingOptions(false);
    }
  };

  /**
   * Filter departments and batches by course, then auto-select first department.
   * Cascading is done in-memory — no extra API calls needed.
   */
  const applyCourseCascade = (
    courseCd: string,
    deptSource: DepartmentOption[],
    batchSource: BatchOption[],
  ) => {
    // Filter departments for this course (or show all if course_cd not set)
    const filteredDepts = deptSource.filter((d) =>
      !d.course_cd || d.course_cd === courseCd || d.course_cd === ''
    );
    setDepartments(filteredDepts);

    const firstDept = filteredDepts[0];
    if (firstDept) {
      setSelectedDeptId(firstDept.id);
      setSelectedDeptName(firstDept.name);
      applyDeptCascade(firstDept.id, courseCd, batchSource);
    } else {
      setSelectedDeptId('');
      setSelectedDeptName('');
      setBatches([]);
      setSelectedBatchCode('');
      setSelectedBatchYear('');
      setSelectedBatchName('');
    }
  };

  /**
   * Filter batches by course + department, then auto-select first.
   */
  const applyDeptCascade = (
    deptId: string,
    courseCd: string,
    batchSource: BatchOption[],
  ) => {
    setLoadingBatches(true);
    let filtered = batchSource.filter((b) => {
      const matchesCourse = !b.course_cd || b.course_cd === courseCd || b.course_cd === '';
      const matchesDept = !b.department_id || b.department_id === deptId || b.department_id === '';
      return matchesCourse && matchesDept;
    });

    // If no exact department match, fall back to course-only matching
    if (filtered.length === 0) {
      filtered = batchSource.filter((b) =>
        !b.course_cd || b.course_cd === courseCd || b.course_cd === ''
      );
    }

    setBatches(filtered);
    if (filtered.length > 0) {
      const first = filtered[0];
      setSelectedBatchCode(String(first.code || first.batch_cd || first.year));
      setSelectedBatchYear(String(first.year));
      setSelectedBatchName(first.batch_name || first.name || `Batch ${first.year}`);
    } else {
      setSelectedBatchCode('');
      setSelectedBatchYear('');
      setSelectedBatchName('');
    }
    setLoadingBatches(false);
  };

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cd = e.target.value;
    setSelectedCourseCd(cd);
    const found = courses.find((c) => c.course_cd === cd);
    const cName = found?.course_name || 'Course';
    setSelectedCourseName(cName);
    // Cascading: Course -> Dept -> Batch (in-memory)
    applyCourseCascade(cd, allDepartments, allBatches);
  };

  const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dId = e.target.value;
    setSelectedDeptId(dId);
    const found = departments.find((d) => d.id === dId || d.code === dId);
    setSelectedDeptName(found?.name || dId);
    // Cascading: Dept -> Batch (in-memory)
    applyDeptCascade(dId, selectedCourseCd, allBatches);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchYear && batches.length === 0) {
      setErrorMsg('No feeded batches available for this course and branch.');
      return;
    }

    const cleanDeptName = (!selectedDeptName || selectedDeptName === '-' || selectedDeptName === 'null')
      ? (selectedCourseName || 'General Department')
      : selectedDeptName;

    const currentTenant = getActiveTenant();

    try {
      setSubmitting(true);
      setErrorMsg('');

      const success = await onAddBatch({
        course_cd: selectedCourseCd,
        course_name: selectedCourseName,
        department_id: selectedDeptId,
        department_name: cleanDeptName,
        batch_year: selectedBatchYear,
        batch_code: selectedBatchCode || selectedBatchYear,
        tenant: currentTenant,
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

              {/* Step 3: Batch Selection (Feeded Batches Only) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#1B1E28] dark:text-slate-200 flex items-center gap-1.5">
                    <span>📅</span>
                    <span>Select Feeded Batch</span>
                  </label>
                  {batches.length > 0 && (
                    <span className="text-[10px] font-bold text-[#5B4BFF] bg-[#5B4BFF]/10 px-2 py-0.5 rounded-full">
                      {batches.length} Feeded {batches.length === 1 ? 'Batch' : 'Batches'}
                    </span>
                  )}
                </div>

                {loadingBatches ? (
                  <div className="py-6 text-center space-y-2 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 border border-[#E7EAF3] dark:border-slate-800">
                    <div className="w-5 h-5 border-2 border-[#5B4BFF] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-[11px] text-[#4E5969] dark:text-slate-400 font-medium">
                      Loading feeded batches for selected branch...
                    </p>
                  </div>
                ) : batches.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-amber-300 dark:border-amber-700/50 bg-amber-50/50 dark:bg-amber-950/20 text-center space-y-1">
                    <p className="text-xs text-amber-800 dark:text-amber-300 font-bold">
                      No Feeded Batches Found
                    </p>
                    <p className="text-[11px] text-[#4E5969] dark:text-slate-400">
                      No batches are currently configured for this branch in database.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {batches.map((b) => {
                      const batchIdentifier = String(b.code || b.batch_cd || b.year);
                      const isSelected = selectedBatchCode === batchIdentifier || selectedBatchYear === String(b.year);
                      const displayTitle = b.batch_name || b.name || (b.year ? `Batch ${b.year}` : `Batch ${batchIdentifier}`);
                      return (
                        <button
                          key={batchIdentifier}
                          type="button"
                          onClick={() => {
                            setSelectedBatchCode(batchIdentifier);
                            setSelectedBatchYear(String(b.year));
                            setSelectedBatchName(displayTitle);
                          }}
                          className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center justify-center gap-0.5 ${
                            isSelected
                              ? 'bg-[#5B4BFF] text-white border-[#5B4BFF] shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-800 text-[#4E5969] dark:text-slate-300 border-[#E7EAF3] dark:border-slate-700 hover:border-[#5B4BFF]'
                          }`}
                        >
                          <span>{displayTitle}</span>
                          <span className={`text-[10px] font-normal ${isSelected ? 'text-white/80' : 'text-[#8C98A4] dark:text-slate-400'}`}>
                            Year {b.year}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
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
                  💬 {selectedBatchName || (selectedBatchYear ? `Batch ${selectedBatchYear}` : 'Select Batch')} · {(!selectedDeptName || selectedDeptName === '-' || selectedDeptName === 'null') ? selectedCourseName : selectedDeptName}
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
              disabled={submitting || loadingOptions || loadingBatches || batches.length === 0 || !selectedBatchYear}
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
