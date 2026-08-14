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

export interface LiveBatchItem {
  colg_cd: string;
  course_cd: string;
  batch_cd: number | string;
  batch_name: string;
  active_flg: string;
  curr_bat_Cd?: number | string;
  startdt?: string | null;
  enddt?: string | null;
}

export interface Live3LevelBatchCascadingSelection {
  college: LiveCollegeItem | null;
  course: LiveCourseItem | null;
  batch: LiveBatchItem | null;
}

interface LiveCollegeCourseBatchCascadingDropdownProps {
  selectedCollegeCode?: string;
  selectedCourseCode?: string;
  selectedBatchCode?: string;
  onCollegeSelect?: (college: LiveCollegeItem | null) => void;
  onCourseSelect?: (course: LiveCourseItem | null) => void;
  onBatchSelect?: (batch: LiveBatchItem | null) => void;
  onSelectionChange?: (selection: Live3LevelBatchCascadingSelection) => void;
}

function parseDotNetDate(dateStr: any): string | null {
  if (!dateStr) return null;
  if (typeof dateStr === 'string') {
    const match = dateStr.match(/\/Date\((\-?\d+)\)\//);
    if (match) {
      const timestamp = parseInt(match[1], 10);
      if (timestamp < 0) return null;
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
  }
  return null;
}

export default function LiveCollegeCourseBatchCascadingDropdown({
  selectedCollegeCode,
  selectedCourseCode,
  selectedBatchCode,
  onCollegeSelect,
  onCourseSelect,
  onBatchSelect,
  onSelectionChange,
}: LiveCollegeCourseBatchCascadingDropdownProps) {
  // ─── STATE ─────────────────────────────────────────────────────────────────
  const [colleges, setColleges] = useState<LiveCollegeItem[]>([]);
  const [courses, setCourses] = useState<LiveCourseItem[]>([]);
  const [batches, setBatches] = useState<LiveBatchItem[]>([]);

  const [selectedColgCd, setSelectedColgCd] = useState<string>(selectedCollegeCode || '');
  const [selectedCourseCd, setSelectedCourseCd] = useState<string>(selectedCourseCode || '');
  const [selectedBatchCd, setSelectedBatchCd] = useState<string>(selectedBatchCode || '');

  const [selectedCollege, setSelectedCollege] = useState<LiveCollegeItem | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<LiveCourseItem | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<LiveBatchItem | null>(null);

  const [collegesLoading, setCollegesLoading] = useState<boolean>(false);
  const [coursesLoading, setCoursesLoading] = useState<boolean>(false);
  const [batchesLoading, setBatchesLoading] = useState<boolean>(false);

  const [collegesError, setCollegesError] = useState<string | null>(null);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [batchesError, setBatchesError] = useState<string | null>(null);

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
      console.error('[LiveBatchCascade] Fetch Colleges Error:', err);
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
      setBatches([]);
      setSelectedBatchCd('');
      setSelectedBatch(null);
      if (onCourseSelect) onCourseSelect(null);
      if (onBatchSelect) onBatchSelect(null);
      return;
    }

    setCoursesLoading(true);
    setCoursesError(null);
    setCourses([]);
    setSelectedCourseCd('');
    setSelectedCourse(null);
    setBatches([]);
    setSelectedBatchCd('');
    setSelectedBatch(null);
    if (onCourseSelect) onCourseSelect(null);
    if (onBatchSelect) onBatchSelect(null);

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

      // Filter: only show active courses
      const activeCourses = rawList.filter(
        (c) => String(c.active_flg) === '1' || c.ACTIVESTS === 'ACTIVE'
      );

      setCourses(activeCourses);
    } catch (err: any) {
      console.error('[LiveBatchCascade] Fetch Courses Error:', err);
      setCoursesError(err.message || 'No active courses found for selected institution');
    } finally {
      setCoursesLoading(false);
    }
  }, [onCourseSelect, onBatchSelect]);

  // ─── STEP 3: FETCH BATCHES (DEPENDS ON COLLEGE + COURSE) ───────────────────
  const fetchBatchesForCourse = useCallback(async (colgCd: string, courseCd: string) => {
    if (!colgCd || !courseCd) {
      setBatches([]);
      setSelectedBatchCd('');
      setSelectedBatch(null);
      if (onBatchSelect) onBatchSelect(null);
      return;
    }

    setBatchesLoading(true);
    setBatchesError(null);
    setBatches([]);
    setSelectedBatchCd('');
    setSelectedBatch(null);
    if (onBatchSelect) onBatchSelect(null);

    try {
      // 1. Next.js server proxy route
      let res = await fetch('/api/srms/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colgcd: colgCd, coursecd: courseCd }),
      }).catch(() => null);

      // Fallback 1: Backend live proxy
      if (!res || !res.ok) {
        res = await fetch(`http://127.0.0.1:3001/api/v1/college-master/live/batches?colgcd=${colgCd}&coursecd=${courseCd}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }).catch(() => null);
      }

      // Fallback 2: Direct SRMS portal
      if (!res || !res.ok) {
        res = await fetch('https://myportal.srms.ac.in/SRMSERP/OnlineAttend/GetBatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ colgcd: colgCd, coursecd: courseCd }),
        });
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to load live batches`);
      }

      const data = await res.json();
      const rawList: LiveBatchItem[] = Array.isArray(data) ? data : data.data || [];

      // Filter: only show active batches where active_flg == "1"
      const activeBatches = rawList.filter((b) => String(b.active_flg) === '1');

      // Sort batches descending by batch_name (year)
      activeBatches.sort((a, b) => (Number(b.batch_name) || 0) - (Number(a.batch_name) || 0));

      setBatches(activeBatches);
    } catch (err: any) {
      console.error('[LiveBatchCascade] Fetch Batches Error:', err);
      setBatchesError(err.message || 'No active batches found for this course');
    } finally {
      setBatchesLoading(false);
    }
  }, [onBatchSelect]);

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
        setBatches([]);
        setSelectedBatchCd('');
        setSelectedBatch(null);
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
    setSelectedBatchCd('');
    setSelectedBatch(null);

    if (onCollegeSelect) onCollegeSelect(matchedCol);
    if (onCourseSelect) onCourseSelect(null);
    if (onBatchSelect) onBatchSelect(null);
    if (onSelectionChange) {
      onSelectionChange({ college: matchedCol, course: null, batch: null });
    }

    if (cd) {
      fetchCoursesForCollege(cd);
    } else {
      setCourses([]);
      setBatches([]);
    }
  };

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const crsCd = e.target.value;
    setSelectedCourseCd(crsCd);
    const matchedCrs = courses.find((c) => c.course_cd === crsCd) || null;
    setSelectedCourse(matchedCrs);

    // Reset batch
    setSelectedBatchCd('');
    setSelectedBatch(null);

    if (onCourseSelect) onCourseSelect(matchedCrs);
    if (onBatchSelect) onBatchSelect(null);
    if (onSelectionChange) {
      onSelectionChange({ college: selectedCollege, course: matchedCrs, batch: null });
    }

    if (crsCd && selectedColgCd) {
      fetchBatchesForCourse(selectedColgCd, crsCd);
    } else {
      setBatches([]);
    }
  };

  const handleBatchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const bCd = e.target.value;
    setSelectedBatchCd(bCd);
    const matchedBatch = batches.find((b) => String(b.batch_cd) === bCd) || null;
    setSelectedBatch(matchedBatch);

    if (onBatchSelect) onBatchSelect(matchedBatch);
    if (onSelectionChange) {
      onSelectionChange({ college: selectedCollege, course: selectedCourse, batch: matchedBatch });
    }
  };

  const handleReset = () => {
    setSelectedColgCd('');
    setSelectedCourseCd('');
    setSelectedBatchCd('');
    setSelectedCollege(null);
    setSelectedCourse(null);
    setSelectedBatch(null);
    setCourses([]);
    setBatches([]);
    if (onCollegeSelect) onCollegeSelect(null);
    if (onCourseSelect) onCourseSelect(null);
    if (onBatchSelect) onBatchSelect(null);
    if (onSelectionChange) {
      onSelectionChange({ college: null, course: null, batch: null });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-600 flex items-center justify-center text-white text-sm shadow-md shadow-indigo-500/20">
            ⚡
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span>Live 3-Level Batch Cascading Selector</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                100% Live SRMS GetBatch API
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Dynamic 3-step hierarchy: 🏛️ College → 🎓 Course → 📅 Batch Year (Direct SRMS OnlineAttend API)
            </p>
          </div>
        </div>

        {(selectedColgCd || selectedCourseCd || selectedBatchCd) && (
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

        {/* ─── 3. BATCH DROPDOWN (DEPENDS ON COLLEGE + COURSE) ─── */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>📅</span> 3. Select Batch Year *
            </span>
            {batchesLoading && (
              <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-1">
                <span className="animate-spin">🌀</span> Loading Batches...
              </span>
            )}
          </label>

          <div className="relative">
            <select
              value={selectedBatchCd}
              onChange={handleBatchChange}
              disabled={!selectedCourseCd || batchesLoading || batches.length === 0}
              className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border rounded-xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-sky-500/20 ${
                batchesError
                  ? 'border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300'
                  : selectedBatchCd
                  ? 'border-sky-500 bg-sky-50/20 dark:bg-sky-950/20 text-slate-900 dark:text-white'
                  : 'border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-sky-500'
              } disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900/60 disabled:cursor-not-allowed`}
            >
              <option value="">
                {!selectedCourseCd
                  ? '← Choose a course first'
                  : batchesLoading
                  ? 'Fetching batches from SRMS GetBatch...'
                  : batches.length === 0
                  ? 'No active batches found for this course'
                  : '-- Select Batch Year --'}
              </option>
              {batches.map((b) => (
                <option key={b.batch_cd} value={b.batch_cd}>
                  Batch {b.batch_name} [Code {b.batch_cd}]
                  {parseDotNetDate(b.startdt) ? ` (${parseDotNetDate(b.startdt)} - ${parseDotNetDate(b.enddt)})` : ''}
                </option>
              ))}
            </select>
          </div>

          {batchesError ? (
            <p className="text-[10px] text-rose-500 font-medium">⚠️ {batchesError}</p>
          ) : (
            <p className="text-[10px] text-slate-400">
              {selectedCourseCd
                ? `${batches.length} active batches (POST /OnlineAttend/GetBatch)`
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

          {/* Batch Badge */}
          {selectedBatch ? (
            <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20 font-bold flex items-center gap-1.5">
              <span>📅</span>
              <span>Batch {selectedBatch.batch_name}</span>
              <span className="font-mono text-[10px] opacity-75">#{selectedBatch.batch_cd}</span>
              {parseDotNetDate(selectedBatch.startdt) && (
                <span className="text-[10px] opacity-80">
                  ({parseDotNetDate(selectedBatch.startdt)} → {parseDotNetDate(selectedBatch.enddt)})
                </span>
              )}
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-lg bg-slate-200/60 dark:bg-slate-800 text-slate-500 italic text-[11px]">
              (Select Batch)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
