'use client';

import React, { useState, useEffect, useCallback } from 'react';

export interface LiveCollegeItem {
  colg_cd: string;
  colg_name: string;
}

export interface LiveCourseItem {
  colg_cd: string;
  course_cd: string;
  course_name: string;
  ACTIVESTS?: string;
  active_flg?: string;
}

export interface LiveBranchItem {
  colg_cd: string;
  course_cd: string;
  course_name: string;
  branch_cd: string;
  branch_name: string;
  BRANCHSTS?: string;
  active_flg?: string;
}

export interface Live3LevelCascadingSelection {
  college: LiveCollegeItem | null;
  course: LiveCourseItem | null;
  branch: LiveBranchItem | null;
}

interface Live3LevelDepartmentCascadingDropdownProps {
  selectedCollegeCode?: string;
  selectedCourseCode?: string;
  selectedBranchCode?: string;
  onCollegeSelect?: (college: LiveCollegeItem | null) => void;
  onCourseSelect?: (course: LiveCourseItem | null) => void;
  onBranchSelect?: (branch: LiveBranchItem | null) => void;
  onSelectionChange?: (selection: Live3LevelCascadingSelection) => void;
  compact?: boolean;
}

export default function Live3LevelDepartmentCascadingDropdown({
  selectedCollegeCode,
  selectedCourseCode,
  selectedBranchCode,
  onCollegeSelect,
  onCourseSelect,
  onBranchSelect,
  onSelectionChange,
  compact = false,
}: Live3LevelDepartmentCascadingDropdownProps) {
  // ─── STATE ─────────────────────────────────────────────────────────────────
  const [colleges, setColleges] = useState<LiveCollegeItem[]>([]);
  const [courses, setCourses] = useState<LiveCourseItem[]>([]);
  const [branches, setBranches] = useState<LiveBranchItem[]>([]);

  const [selectedColgCd, setSelectedColgCd] = useState<string>(selectedCollegeCode || '');
  const [selectedCourseCd, setSelectedCourseCd] = useState<string>(selectedCourseCode || '');
  const [selectedBranchCd, setSelectedBranchCd] = useState<string>(selectedBranchCode || '');

  const [selectedCollege, setSelectedCollege] = useState<LiveCollegeItem | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<LiveCourseItem | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<LiveBranchItem | null>(null);

  const [collegesLoading, setCollegesLoading] = useState<boolean>(false);
  const [coursesLoading, setCoursesLoading] = useState<boolean>(false);
  const [branchesLoading, setBranchesLoading] = useState<boolean>(false);

  const [collegesError, setCollegesError] = useState<string | null>(null);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [branchesError, setBranchesError] = useState<string | null>(null);

  // ─── STEP 1: FETCH COLLEGES ON MOUNT ───────────────────────────────────────
  const fetchColleges = useCallback(async () => {
    setCollegesLoading(true);
    setCollegesError(null);
    try {
      // 1. Next.js server proxy route
      let res = await fetch('/api/srms/colleges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }).catch(() => null);

      // Fallback 1: Backend live proxy
      if (!res || !res.ok) {
        res = await fetch('http://127.0.0.1:3001/api/v1/college-master/live/colleges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }).catch(() => null);
      }

      // Fallback 2: Direct SRMS portal
      if (!res || !res.ok) {
        res = await fetch('https://myportal.srms.ac.in/SRMSERP/Home/GetCollege', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to load live colleges`);
      }

      const data = await res.json();
      const list: LiveCollegeItem[] = Array.isArray(data) ? data : data.data || [];
      setColleges(list);
    } catch (err: any) {
      console.error('[Live3LevelCascade] Fetch Colleges Error:', err);
      setCollegesError(err.message || 'Unable to load institutions from SRMS live API');
    } finally {
      setCollegesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchColleges();
  }, [fetchColleges]);

  // ─── STEP 2: FETCH COURSES (DEPENDS ON COLLEGE) ────────────────────────────
  const fetchCoursesForCollege = useCallback(async (colgCd: string) => {
    if (!colgCd) {
      setCourses([]);
      setSelectedCourseCd('');
      setSelectedCourse(null);
      setBranches([]);
      setSelectedBranchCd('');
      setSelectedBranch(null);
      if (onCourseSelect) onCourseSelect(null);
      if (onBranchSelect) onBranchSelect(null);
      return;
    }

    setCoursesLoading(true);
    setCoursesError(null);
    setCourses([]);
    setSelectedCourseCd('');
    setSelectedCourse(null);
    setBranches([]);
    setSelectedBranchCd('');
    setSelectedBranch(null);
    if (onCourseSelect) onCourseSelect(null);
    if (onBranchSelect) onBranchSelect(null);

    try {
      // 1. Next.js server proxy route
      let res = await fetch('/api/srms/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colgcd: colgCd }),
      }).catch(() => null);

      // Fallback 1: Backend live proxy
      if (!res || !res.ok) {
        res = await fetch(`http://127.0.0.1:3001/api/v1/college-master/live/courses?colgcd=${colgCd}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }).catch(() => null);
      }

      // Fallback 2: Direct SRMS portal
      if (!res || !res.ok) {
        res = await fetch('https://myportal.srms.ac.in/SRMSERP/erpadmin/GetCourse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ colgcd: colgCd }),
        });
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to load live courses`);
      }

      const data = await res.json();
      const rawList: LiveCourseItem[] = Array.isArray(data) ? data : data.data || [];

      // Filter: only show active courses where active_flg == "1"
      const activeCourses = rawList.filter(
        (c) => String(c.active_flg) === '1' || c.ACTIVESTS === 'ACTIVE'
      );

      setCourses(activeCourses);
    } catch (err: any) {
      console.error('[Live3LevelCascade] Fetch Courses Error:', err);
      setCoursesError(err.message || 'No active courses found for selected institution');
    } finally {
      setCoursesLoading(false);
    }
  }, [onCourseSelect, onBranchSelect]);

  // ─── STEP 3: FETCH BRANCHES (DEPENDS ON COLLEGE + COURSE) ──────────────────
  const fetchBranchesForCourse = useCallback(async (colgCd: string, courseCd: string) => {
    if (!colgCd || !courseCd) {
      setBranches([]);
      setSelectedBranchCd('');
      setSelectedBranch(null);
      if (onBranchSelect) onBranchSelect(null);
      return;
    }

    setBranchesLoading(true);
    setBranchesError(null);
    setBranches([]);
    setSelectedBranchCd('');
    setSelectedBranch(null);
    if (onBranchSelect) onBranchSelect(null);

    try {
      // 1. Next.js server proxy route
      let res = await fetch('/api/srms/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colgcd: colgCd, coursecd: courseCd }),
      }).catch(() => null);

      // Fallback 1: Backend live proxy
      if (!res || !res.ok) {
        res = await fetch(`http://127.0.0.1:3001/api/v1/college-master/live/branches?colgcd=${colgCd}&coursecd=${courseCd}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }).catch(() => null);
      }

      // Fallback 2: Direct SRMS portal
      if (!res || !res.ok) {
        res = await fetch('https://myportal.srms.ac.in/SRMSERP/erpadmin/GetBranch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ colgcd: colgCd, coursecd: courseCd }),
        });
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to load live branches`);
      }

      const data = await res.json();
      const rawList: LiveBranchItem[] = Array.isArray(data) ? data : data.data || [];

      // Filter: only show branches where active_flg == "1" (BRANCHSTS == "ACTIVE")
      const activeBranches = rawList.filter(
        (b) => String(b.active_flg) === '1' || b.BRANCHSTS === 'ACTIVE'
      );

      setBranches(activeBranches);
    } catch (err: any) {
      console.error('[Live3LevelCascade] Fetch Branches Error:', err);
      setBranchesError(err.message || 'No active departments/branches found for this course');
    } finally {
      setBranchesLoading(false);
    }
  }, [onBranchSelect]);

  // ─── CONTROLLED PROPS SYNCHRONIZATION ──────────────────────────────────────
  useEffect(() => {
    if (selectedCollegeCode !== undefined && selectedCollegeCode !== selectedColgCd) {
      setSelectedColgCd(selectedCollegeCode);
      if (selectedCollegeCode) {
        const matchedCol = colleges.find((c) => c.colg_cd === selectedCollegeCode) || null;
        setSelectedCollege(matchedCol);
        fetchCoursesForCollege(selectedCollegeCode);
      } else {
        setSelectedCollege(null);
        setCourses([]);
        setSelectedCourseCd('');
        setSelectedCourse(null);
        setBranches([]);
        setSelectedBranchCd('');
        setSelectedBranch(null);
      }
    }
  }, [selectedCollegeCode, colleges, fetchCoursesForCollege, selectedColgCd]);

  // ─── EVENT HANDLERS ────────────────────────────────────────────────────────
  const handleCollegeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cd = e.target.value;
    setSelectedColgCd(cd);
    const matchedCol = colleges.find((c) => c.colg_cd === cd) || null;
    setSelectedCollege(matchedCol);

    // Reset dependents
    setSelectedCourseCd('');
    setSelectedCourse(null);
    setSelectedBranchCd('');
    setSelectedBranch(null);

    if (onCollegeSelect) onCollegeSelect(matchedCol);
    if (onCourseSelect) onCourseSelect(null);
    if (onBranchSelect) onBranchSelect(null);
    if (onSelectionChange) {
      onSelectionChange({ college: matchedCol, course: null, branch: null });
    }

    if (cd) {
      fetchCoursesForCollege(cd);
    } else {
      setCourses([]);
      setBranches([]);
    }
  };

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const crsCd = e.target.value;
    setSelectedCourseCd(crsCd);
    const matchedCrs = courses.find((c) => c.course_cd === crsCd) || null;
    setSelectedCourse(matchedCrs);

    // Reset branch
    setSelectedBranchCd('');
    setSelectedBranch(null);

    if (onCourseSelect) onCourseSelect(matchedCrs);
    if (onBranchSelect) onBranchSelect(null);
    if (onSelectionChange) {
      onSelectionChange({ college: selectedCollege, course: matchedCrs, branch: null });
    }

    if (crsCd && selectedColgCd) {
      fetchBranchesForCourse(selectedColgCd, crsCd);
    } else {
      setBranches([]);
    }
  };

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const brCd = e.target.value;
    setSelectedBranchCd(brCd);
    const matchedBr = branches.find((b) => b.branch_cd === brCd) || null;
    setSelectedBranch(matchedBr);

    if (onBranchSelect) onBranchSelect(matchedBr);
    if (onSelectionChange) {
      onSelectionChange({ college: selectedCollege, course: selectedCourse, branch: matchedBr });
    }
  };

  const handleReset = () => {
    setSelectedColgCd('');
    setSelectedCourseCd('');
    setSelectedBranchCd('');
    setSelectedCollege(null);
    setSelectedCourse(null);
    setSelectedBranch(null);
    setCourses([]);
    setBranches([]);
    if (onCollegeSelect) onCollegeSelect(null);
    if (onCourseSelect) onCourseSelect(null);
    if (onBranchSelect) onBranchSelect(null);
    if (onSelectionChange) {
      onSelectionChange({ college: null, course: null, branch: null });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm shadow-md shadow-indigo-500/20">
            ⚡
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span>Live 3-Level Cascading Selector</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                100% Live SRMS API
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Dynamic 3-step hierarchy: 🏛️ College → 🎓 Course → 🌿 Branch / Department (Direct SRMS Portal API)
            </p>
          </div>
        </div>

        {(selectedColgCd || selectedCourseCd || selectedBranchCd) && (
          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] font-bold text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 transition-colors self-start sm:self-auto"
          >
            <span>✕</span> Reset Cascade
          </button>
        )}
      </div>

      {/* 3 Dropdown Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ─── 1. COLLEGE DROPDOWN ─── */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>🏛️</span> 1. Select College *
            </span>
            {collegesLoading && (
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                <span className="animate-spin">🌀</span> Loading...
              </span>
            )}
          </label>

          <div className="relative">
            <select
              value={selectedColgCd}
              onChange={handleCollegeChange}
              disabled={collegesLoading || colleges.length === 0}
              className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border rounded-xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                collegesError
                  ? 'border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300'
                  : selectedColgCd
                  ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 text-slate-900 dark:text-white'
                  : 'border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-indigo-500'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <option value="">
                {collegesLoading ? 'Fetching colleges from SRMS...' : '-- Select College / Institution --'}
              </option>
              {colleges.map((col) => (
                <option key={col.colg_cd} value={col.colg_cd}>
                  {col.colg_name}
                </option>
              ))}
            </select>
          </div>

          {collegesError ? (
            <p className="text-[10px] text-rose-500 font-medium">⚠️ {collegesError}</p>
          ) : (
            <p className="text-[10px] text-slate-400">
              {colleges.length > 0 ? `${colleges.length} institutions loaded live` : 'POST /Home/GetCollege'}
            </p>
          )}
        </div>

        {/* ─── 2. COURSE DROPDOWN (DEPENDS ON COLLEGE) ─── */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>🎓</span> 2. Select Course *
            </span>
            {coursesLoading && (
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                <span className="animate-spin">🌀</span> Loading Courses...
              </span>
            )}
          </label>

          <div className="relative">
            <select
              value={selectedCourseCd}
              onChange={handleCourseChange}
              disabled={!selectedColgCd || coursesLoading || courses.length === 0}
              className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border rounded-xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/20 ${
                coursesError
                  ? 'border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300'
                  : selectedCourseCd
                  ? 'border-purple-500 bg-purple-50/20 dark:bg-purple-950/20 text-slate-900 dark:text-white'
                  : 'border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-purple-500'
              } disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900/60 disabled:cursor-not-allowed`}
            >
              <option value="">
                {!selectedColgCd
                  ? '← Choose a college first'
                  : coursesLoading
                  ? 'Fetching courses...'
                  : courses.length === 0
                  ? 'No active courses found'
                  : '-- Select Active Course --'}
              </option>
              {courses.map((crs) => (
                <option key={crs.course_cd} value={crs.course_cd}>
                  {crs.course_name}
                </option>
              ))}
            </select>
          </div>

          {coursesError ? (
            <p className="text-[10px] text-rose-500 font-medium">⚠️ {coursesError}</p>
          ) : (
            <p className="text-[10px] text-slate-400">
              {selectedColgCd
                ? `${courses.length} active courses (active_flg == 1)`
                : 'Disabled until college chosen'}
            </p>
          )}
        </div>

        {/* ─── 3. BRANCH DROPDOWN (DEPENDS ON COLLEGE + COURSE) ─── */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>🌿</span> 3. Select Branch / Dept *
            </span>
            {branchesLoading && (
              <span className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold flex items-center gap-1">
                <span className="animate-spin">🌀</span> Loading Branches...
              </span>
            )}
          </label>

          <div className="relative">
            <select
              value={selectedBranchCd}
              onChange={handleBranchChange}
              disabled={!selectedCourseCd || branchesLoading || branches.length === 0}
              className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border rounded-xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${
                branchesError
                  ? 'border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300'
                  : selectedBranchCd
                  ? 'border-orange-500 bg-orange-50/20 dark:bg-orange-950/20 text-slate-900 dark:text-white'
                  : 'border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-orange-500'
              } disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900/60 disabled:cursor-not-allowed`}
            >
              <option value="">
                {!selectedCourseCd
                  ? '← Choose a course first'
                  : branchesLoading
                  ? 'Fetching branches from SRMS...'
                  : branches.length === 0
                  ? 'No active branches found for this course'
                  : '-- Select Active Branch / Dept --'}
              </option>
              {branches.map((br) => (
                <option key={br.branch_cd} value={br.branch_cd}>
                  {br.branch_name}
                </option>
              ))}
            </select>
          </div>

          {branchesError ? (
            <p className="text-[10px] text-rose-500 font-medium">⚠️ {branchesError}</p>
          ) : (
            <p className="text-[10px] text-slate-400">
              {selectedCourseCd
                ? `${branches.length} active branches (BRANCHSTS == ACTIVE)`
                : 'Disabled until course chosen'}
            </p>
          )}
        </div>
      </div>

      {/* Selected Dynamic Hierarchy Live Breadcrumb */}
      {selectedCollege && (
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
            Live Selection:
          </span>

          {/* College Badge */}
          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 font-bold flex items-center gap-1.5">
            <span>🏛️</span>
            <span>{selectedCollege.colg_name}</span>
            <span className="font-mono text-[10px] opacity-75">#{selectedCollege.colg_cd}</span>
          </span>

          {/* Arrow */}
          <span className="text-slate-400 font-bold">→</span>

          {/* Course Badge */}
          {selectedCourse ? (
            <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-bold flex items-center gap-1.5">
              <span>🎓</span>
              <span>{selectedCourse.course_name}</span>
              <span className="font-mono text-[10px] opacity-75">#{selectedCourse.course_cd}</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-lg bg-slate-200/60 dark:bg-slate-800 text-slate-500 italic text-[11px]">
              (Select Course)
            </span>
          )}

          {/* Arrow */}
          <span className="text-slate-400 font-bold">→</span>

          {/* Branch Badge */}
          {selectedBranch ? (
            <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-500/20 font-bold flex items-center gap-1.5">
              <span>🌿</span>
              <span>{selectedBranch.branch_name}</span>
              <span className="font-mono text-[10px] opacity-75">#{selectedBranch.branch_cd}</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-lg bg-slate-200/60 dark:bg-slate-800 text-slate-500 italic text-[11px]">
              (Select Branch)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
