'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TargetRule } from '../../hooks/useNoticeGroups';
import { Users, GraduationCap, Sparkles, Plus, X, CheckCircle2 } from 'lucide-react';

interface NoticeGroupBuilderProps {
  rules: TargetRule[];
  onChange: (rules: TargetRule[]) => void;
}

export interface TargetCohortItem {
  id: string;
  course_cd: string;
  course_name: string;
  branch_cd: string;
  branch_name: string;
  batch_cd: string;
  batch_name: string;
  semester: string;
}

export default function NoticeGroupBuilder({ rules, onChange }: NoticeGroupBuilderProps) {
  // Mode selection: 'cohort' | 'role' | 'all'
  const [scopeMode, setScopeMode] = useState<'cohort' | 'role' | 'all'>('cohort');
  const [selectedRole, setSelectedRole] = useState<string>('STUDENT');

  // Academic Dropdown States (Identical to Placement Drive Screen)
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [modalCourse, setModalCourse] = useState<string>('13');

  const [modalBranchesList, setModalBranchesList] = useState<any[]>([]);
  const [modalBranch, setModalBranch] = useState<string>('1');

  const [modalBatchesList, setModalBatchesList] = useState<any[]>([]);
  const [modalBatch, setModalBatch] = useState<string>('2');

  const [modalSemester, setModalSemester] = useState<string>('All Semesters');

  const [queuedCohorts, setQueuedCohorts] = useState<TargetCohortItem[]>([]);
  const [cohortError, setCohortError] = useState<string | null>(null);

  const prevRulesRef = useRef<string>('');
  const isInternalSync = useRef(false);

  const getTenantSlug = useCallback(() => {
    if (typeof window === 'undefined') return 'srms-cet-bareilly';
    const slug =
      localStorage.getItem('tenantSlug') ||
      localStorage.getItem('selectedTenant') ||
      localStorage.getItem('colg_slug') ||
      'srms-cet-bareilly';
    return (slug || 'srms-cet-bareilly').replace(/^tenant_/, '').replace(/^tenant-/, '');
  }, []);

  const getColgCd = useCallback(() => {
    const slug = getTenantSlug();
    const isMed = slug.includes('ims') || slug.includes('med');
    return isMed ? '11' : '1';
  }, [getTenantSlug]);

  const fetchCoursesForCollege = useCallback(
    async (colgcd: string) => {
      const cd = colgcd || '1';
      const slug = getTenantSlug();
      try {
        const res = await fetch(`/api/srms/courses?colgcd=${cd}&tenant=${slug}`);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            const mapped = list.map((c: any) => ({
              code: String(c.course_cd || c.code || '1'),
              name: c.course_name || c.name || `Course ${c.course_cd}`,
              colg_cd: String(c.colg_cd || cd),
            }));
            setCoursesList(mapped);
            return mapped;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch courses for notice compose:', err);
      }
      const fallback = [
        { code: '13', name: 'BCA', colg_cd: cd },
        { code: '1', name: 'B.TECH.', colg_cd: cd },
        { code: '4', name: 'MCA', colg_cd: cd },
        { code: '3', name: 'MBA', colg_cd: cd },
        { code: '2', name: 'B.PHARM.', colg_cd: cd },
      ];
      setCoursesList(fallback);
      return fallback;
    },
    [getTenantSlug]
  );

  const fetchBranchesForCourse = useCallback(
    async (colgcd: string, coursecd: string, allCourses?: any[]) => {
      const cd = colgcd || '1';
      const crs = coursecd || '13';
      const slug = getTenantSlug();
      const currentCourses = allCourses && allCourses.length > 0 ? allCourses : coursesList;
      const courseObj = currentCourses.find((c: any) => String(c.code) === String(crs));
      const courseName = courseObj?.name || (crs === '13' ? 'BCA' : crs === '1' ? 'B.TECH.' : 'Course');

      try {
        const res = await fetch(`/api/srms/branches?colgcd=${cd}&coursecd=${crs}&tenant=${slug}`);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            const seen = new Set<string>();
            const mapped: any[] = [];

            list.forEach((b: any) => {
              const rawName = (b.branch_name || b.name || '').trim();
              const validName =
                rawName && rawName !== '-' && rawName !== 'null' && rawName !== 'NONE'
                  ? rawName
                  : `${b.course_name || courseName} General`;
              const bCode = String(b.branch_cd || b.code || '1');
              const key = `${bCode}:::${validName.toLowerCase()}`;

              if (!seen.has(key)) {
                seen.add(key);
                mapped.push({
                  id: bCode,
                  code: bCode,
                  branch_cd: bCode,
                  name: validName,
                  course_cd: String(b.course_cd || crs),
                  colg_cd: String(b.colg_cd || cd),
                });
              }
            });

            if (mapped.length > 0) {
              setModalBranchesList(mapped);
              return mapped;
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch branches for notice compose:', err);
      }
      const fallback =
        crs === '13'
          ? [{ code: '1', name: 'BCA General', course_cd: '13', colg_cd: cd }]
          : crs === '1'
          ? [
              { code: '1', name: '(CSE)', course_cd: '1', colg_cd: cd },
              { code: '2', name: '(IT)', course_cd: '1', colg_cd: cd },
              { code: '3', name: '(ME)', course_cd: '1', colg_cd: cd },
              { code: '4', name: 'CSE(DATA SCIENCE)', course_cd: '1', colg_cd: cd },
              { code: '5', name: '(ECE)', course_cd: '1', colg_cd: cd },
              { code: '6', name: '(EN)', course_cd: '1', colg_cd: cd },
            ]
          : [{ code: '1', name: `${courseName} General`, course_cd: crs, colg_cd: cd }];
      setModalBranchesList(fallback);
      return fallback;
    },
    [getTenantSlug, coursesList]
  );

  const fetchBatchesForCourse = useCallback(
    async (colgcd: string, coursecd: string) => {
      const cd = colgcd || '1';
      const crs = coursecd || '13';
      const slug = getTenantSlug();
      try {
        const res = await fetch(`/api/srms/batches?colgcd=${cd}&coursecd=${crs}&tenant=${slug}`);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            const seen = new Set<string>();
            const mapped: any[] = [];

            list.forEach((b: any) => {
              const bCode = String(b.batch_cd || b.code || b.batch_name || '1');
              const rawName = String(b.batch_name || b.name || b.year || b.batch_cd).trim();
              const key = `${bCode}:::${rawName.toLowerCase()}`;

              if (!seen.has(key)) {
                seen.add(key);
                mapped.push({
                  code: bCode,
                  name: rawName,
                  year: Number(b.year || b.batch_name || 2025),
                  course_cd: String(b.course_cd || crs),
                  colg_cd: String(b.colg_cd || cd),
                });
              }
            });

            if (mapped.length > 0) {
              setModalBatchesList(mapped);
              return mapped;
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch batches for notice compose:', err);
      }
      const fallback = [
        { code: '2', name: '2025', year: 2025, course_cd: crs, colg_cd: cd },
        { code: '1', name: '2024', year: 2024, course_cd: crs, colg_cd: cd },
      ];
      setModalBatchesList(fallback);
      return fallback;
    },
    [getTenantSlug]
  );

  // Initialize Data on mount (Run once on mount)
  useEffect(() => {
    const init = async () => {
      const colgCd = getColgCd();
      const courses = await fetchCoursesForCollege(colgCd);
      const bca = courses.find((c) => c.code === '13' || c.name === 'BCA') || courses[0];
      const initialCourseCd = bca ? bca.code : '13';
      setModalCourse(initialCourseCd);

      const branches = await fetchBranchesForCourse(colgCd, initialCourseCd, courses);
      const batches = await fetchBatchesForCourse(colgCd, initialCourseCd);

      const defaultBranch = branches[0]?.code || '1';
      const defaultBatch =
        batches.find((b) => b.name === '2025' || b.year === 2025 || String(b.name).includes('2025'))?.code || batches[0]?.code || '2';
      setModalBranch(defaultBranch);
      setModalBatch(defaultBatch);
      setModalSemester('All Semesters');
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Course Change in Dropdown (Cascading update for branches and batches)
  const handleModalCourseChange = async (newCourseCd: string) => {
    setModalCourse(newCourseCd);
    const colgCd = getColgCd();
    const branches = await fetchBranchesForCourse(colgCd, newCourseCd, coursesList);
    const batches = await fetchBatchesForCourse(colgCd, newCourseCd);

    const defaultBranch = branches[0]?.code || '1';
    const defaultBatch =
      batches.find((b) => b.name === '2025' || b.year === 2025 || String(b.name).includes('2025'))?.code || batches[0]?.code || '2';
    setModalBranch(defaultBranch);
    setModalBatch(defaultBatch);
    setCohortError(null);
  };

  // Add Cohort Button Handler (Identical to Placement Screen)
  const handleAddCohortToQueue = () => {
    const courseObj = coursesList.find((c) => String(c.code) === String(modalCourse));
    const courseLabel = courseObj?.name || (modalCourse === '13' ? 'BCA' : `Course #${modalCourse}`);

    const branchObj = modalBranchesList.find((b) => String(b.code) === String(modalBranch));
    const branchLabel = branchObj?.name || `Branch #${modalBranch}`;

    const batchObj = modalBatchesList.find((b) => String(b.code) === String(modalBatch));
    const batchLabel =
      batchObj?.name ? (batchObj.name.toLowerCase().startsWith('batch') ? batchObj.name : `Batch ${batchObj.name}`) : `Batch #${modalBatch}`;

    const isDuplicate = queuedCohorts.some(
      (c) =>
        String(c.course_cd) === String(modalCourse) &&
        String(c.branch_cd) === String(modalBranch) &&
        String(c.batch_cd) === String(modalBatch) &&
        String(c.semester) === String(modalSemester)
    );

    if (isDuplicate) {
      setCohortError(
        `Cohort "[#${modalCourse}] ${courseLabel} • ${branchLabel} • ${batchLabel} • ${modalSemester}" is already added.`
      );
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
  };

  // Synchronize target rules to parent
  useEffect(() => {
    if (isInternalSync.current) {
      isInternalSync.current = false;
      return;
    }

    const generatedRules: TargetRule[] = [];

    if (scopeMode === 'all') {
      generatedRules.push({
        target_type: 'all',
        target_value: 'ALL',
        target_label: 'Entire Institution (All Users)',
      });
    } else if (scopeMode === 'role') {
      const roleLabelMap: Record<string, string> = {
        STUDENT: 'All Students',
        FACULTY: 'All Faculty Members',
        CLERK: 'Office & Clerical Staff',
        WARDEN: 'Hostel Wardens',
        COLLEGE_ADMIN: 'College Administrators',
      };
      generatedRules.push({
        target_type: 'role',
        target_value: selectedRole,
        target_label: roleLabelMap[selectedRole] || `Role: ${selectedRole}`,
      });
    } else {
      // Cohort Mode: generate rules from queued cohorts
      if (queuedCohorts.length > 0) {
        const addedSet = new Set<string>();

        queuedCohorts.forEach((c) => {
          // Course rule
          const crsKey = `course_${c.course_cd}`;
          if (!addedSet.has(crsKey)) {
            addedSet.add(crsKey);
            generatedRules.push({
              target_type: 'course',
              target_value: c.course_cd,
              target_label: `Course: ${c.course_name}`,
            });
          }

          // Branch rule
          const brKey = `branch_${c.branch_cd}`;
          if (!addedSet.has(brKey)) {
            addedSet.add(brKey);
            generatedRules.push({
              target_type: 'branch',
              target_value: c.branch_cd,
              target_label: `Branch: ${c.branch_name}`,
            });
          }

          // Batch rule
          const btKey = `batch_year_${c.batch_cd}`;
          if (!addedSet.has(btKey)) {
            addedSet.add(btKey);
            generatedRules.push({
              target_type: 'batch_year',
              target_value: c.batch_cd,
              target_label: `${c.batch_name}`,
            });
          }

          // Semester rule
          const semLabel = c.semester || 'All Semesters';
          const semVal = semLabel === 'All Semesters' ? 'ALL' : semLabel.replace(/[^0-9]/g, '');
          const semKey = `semester_${semVal}_${c.course_cd}_${c.branch_cd}`;
          if (!addedSet.has(semKey)) {
            addedSet.add(semKey);
            generatedRules.push({
              target_type: 'semester',
              target_value: semVal,
              target_label: semLabel,
            });
          }
        });
      } else {
        // Default target if no cohorts queued
        generatedRules.push({
          target_type: 'role',
          target_value: 'STUDENT',
          target_label: 'All Students',
        });
      }
    }

    const serialized = JSON.stringify(generatedRules);
    if (prevRulesRef.current !== serialized) {
      prevRulesRef.current = serialized;
      onChange(generatedRules);
    }
  }, [scopeMode, selectedRole, queuedCohorts, onChange]);

  return (
    <div className="space-y-4 bg-[#F8FAFC] dark:bg-slate-850 p-5 rounded-2xl border border-[#E7EAF3] dark:border-slate-800">
      {/* Scope Mode Navigation Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E7EAF3] dark:border-slate-800 pb-3.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setScopeMode('cohort')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              scopeMode === 'cohort'
                ? 'bg-[#5B4BFF] text-white shadow-md shadow-indigo-500/25 scale-102'
                : 'bg-white dark:bg-slate-800 text-[#4E5969] dark:text-slate-300 border border-[#E7EAF3] dark:border-slate-700 hover:border-[#5B4BFF]/40'
            }`}
          >
            <GraduationCap size={14} />
            <span>Target Student Cohort</span>
          </button>

          <button
            type="button"
            onClick={() => setScopeMode('role')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              scopeMode === 'role'
                ? 'bg-[#5B4BFF] text-white shadow-md shadow-indigo-500/25 scale-102'
                : 'bg-white dark:bg-slate-800 text-[#4E5969] dark:text-slate-300 border border-[#E7EAF3] dark:border-slate-700 hover:border-[#5B4BFF]/40'
            }`}
          >
            <Users size={14} />
            <span>Target by Role</span>
          </button>

          <button
            type="button"
            onClick={() => setScopeMode('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              scopeMode === 'all'
                ? 'bg-[#5B4BFF] text-white shadow-md shadow-indigo-500/25 scale-102'
                : 'bg-white dark:bg-slate-800 text-[#4E5969] dark:text-slate-300 border border-[#E7EAF3] dark:border-slate-700 hover:border-[#5B4BFF]/40'
            }`}
          >
            <Sparkles size={14} />
            <span>Entire Institution</span>
          </button>
        </div>

        {scopeMode === 'cohort' && queuedCohorts.length > 0 && (
          <button
            type="button"
            onClick={() => setQueuedCohorts([])}
            className="text-[11px] font-bold text-rose-500 hover:text-rose-600 hover:underline transition-colors cursor-pointer"
          >
            Clear All Cohorts
          </button>
        )}
      </div>

      {/* Cohort Selector (Identical to Placement Drive Screen) */}
      {scopeMode === 'cohort' && (
        <div className="space-y-4">
          {/* Target Academic Cohorts Looping Section */}
          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/80 p-4 rounded-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <span>🎯</span> Target Academic Cohorts (Course • Branch • Batch • Semester)
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#5B4BFF]/10 text-[#5B4BFF] border border-[#5B4BFF]/20">
                {queuedCohorts.length} Target Cohort{queuedCohorts.length !== 1 ? 's' : ''} Added
              </span>
            </div>

            {cohortError && (
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                ⚠️ {cohortError}
              </div>
            )}

            {/* 4 Separate Dropdowns Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* 1. Course Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  🎓 Course *
                </label>
                <select
                  value={modalCourse}
                  onChange={(e) => handleModalCourseChange(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                >
                  {coursesList.map((crs, idx) => (
                    <option key={crs.code || idx} value={crs.code}>
                      [#{crs.code}] {crs.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Branch Dropdown */}
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
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                >
                  {modalBranchesList.map((br: any, idx: number) => (
                    <option key={br.code || idx} value={br.code}>
                      [#{br.code}] {br.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Batch Dropdown */}
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
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                >
                  {modalBatchesList.map((batch: any, idx: number) => {
                    const bName = String(batch.name || batch.year || '2025').trim();
                    const display = bName.toLowerCase().startsWith('batch') ? bName : `Batch ${bName}`;
                    return (
                      <option key={batch.code || idx} value={batch.code}>
                        [#{batch.code}] {display}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* 4. Semester Dropdown */}
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
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#5B4BFF]"
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

            {/* Add Cohort to Notice Audience Button */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleAddCohortToQueue}
                className="py-2 px-5 text-xs font-bold text-white bg-[#5B4BFF] hover:bg-indigo-600 rounded-xl shadow-md shadow-indigo-500/25 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Cohort to Audience</span>
              </button>
            </div>
          </div>

          {/* Added Queued Cohorts List Table */}
          {queuedCohorts.length > 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-900 dark:text-white">
                <span className="flex items-center gap-1.5">
                  <span>📋</span> Added Target Cohorts ({queuedCohorts.length} cohorts configured)
                </span>
                <button
                  type="button"
                  onClick={() => setQueuedCohorts([])}
                  className="text-[11px] text-rose-500 hover:underline font-bold cursor-pointer"
                >
                  Clear All
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 custom-scrollbar pr-1">
                {queuedCohorts.map((cohort, idx) => (
                  <div key={cohort.id || idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                      <span className="font-mono font-extrabold text-[#5B4BFF] bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg text-[11px] border border-indigo-200 dark:border-indigo-800">
                        [#{cohort.course_cd}] {cohort.course_name}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-lg text-[11px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {cohort.branch_name}
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg text-[11px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {cohort.batch_name}
                      </span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-lg text-[11px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                        {cohort.semester}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setQueuedCohorts(queuedCohorts.filter((_, i) => i !== idx))}
                      className="text-rose-500 hover:text-rose-700 font-bold text-sm p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Remove Cohort"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
              No specific cohort added yet. Use the dropdowns above and click <strong>&quot;+ Add Cohort to Audience&quot;</strong> to target students by Course, Branch, Batch, and Semester.
            </div>
          )}
        </div>
      )}

      {/* Role Selection Dropdown (When Role Mode active) */}
      {scopeMode === 'role' && (
        <div className="max-w-md space-y-1.5">
          <label className="block text-[11px] font-extrabold uppercase text-[#4E5969] dark:text-slate-400">
            Select User Role
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full text-xs font-bold p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
          >
            <option value="STUDENT">🎓 All Students</option>
            <option value="FACULTY">👨‍🏫 All Faculty Members</option>
            <option value="CLERK">📑 Clerks & Data Entry Staff</option>
            <option value="WARDEN">🏢 Hostel Wardens</option>
            <option value="COLLEGE_ADMIN">⚙️ College Administrators</option>
          </select>
        </div>
      )}

      {/* Entire Institution Message */}
      {scopeMode === 'all' && (
        <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 text-xs font-semibold text-indigo-950 dark:text-indigo-200 flex items-center gap-2.5">
          <span className="text-lg">📢</span>
          <span>
            This circular will be broadcast to <strong>ALL active users</strong> (Students, Faculty, Staff, and Admins) in the logged-in tenant institution.
          </span>
        </div>
      )}
    </div>
  );
}
