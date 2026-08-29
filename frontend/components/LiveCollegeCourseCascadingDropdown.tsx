'use client';

import React, { useState, useEffect, useCallback } from 'react';

export interface LiveCollege {
  colg_cd: string;
  colg_name: string;
}

export interface LiveCourse {
  colg_cd: string;
  course_cd: string;
  course_name: string;
  ACTIVESTS?: string;
  active_flg?: string;
}

interface LiveCollegeCourseCascadingDropdownProps {
  onCollegeSelect?: (college: LiveCollege | null) => void;
  onCourseSelect?: (course: LiveCourse | null) => void;
  className?: string;
  showLiveApiBadge?: boolean;
  selectedCollegeCode?: string;
}

export default function LiveCollegeCourseCascadingDropdown({
  onCollegeSelect,
  onCourseSelect,
  className = '',
  showLiveApiBadge = true,
  selectedCollegeCode = '',
}: LiveCollegeCourseCascadingDropdownProps) {
  // State for Colleges
  const [colleges, setColleges] = useState<LiveCollege[]>([]);
  const [selectedColgCd, setSelectedColgCd] = useState<string>(selectedCollegeCode);
  const [selectedCollege, setSelectedCollege] = useState<LiveCollege | null>(null);
  const [collegesLoading, setCollegesLoading] = useState<boolean>(false);
  const [collegesError, setCollegesError] = useState<string | null>(null);

  // State for Courses
  const [courses, setCourses] = useState<LiveCourse[]>([]);
  const [selectedCourseCd, setSelectedCourseCd] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<LiveCourse | null>(null);
  const [coursesLoading, setCoursesLoading] = useState<boolean>(false);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  const [userRole, setUserRole] = useState<string>('ADMIN');
  const [userColgCd, setUserColgCd] = useState<string>('1');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = (localStorage.getItem('role') || 'ADMIN').toUpperCase();
      const colg = localStorage.getItem('colg_cd') || localStorage.getItem('colgCd') || '1';
      setUserRole(role);
      setUserColgCd(colg);
    }
  }, []);

  const onCollegeSelectRef = React.useRef(onCollegeSelect);
  useEffect(() => {
    onCollegeSelectRef.current = onCollegeSelect;
  }, [onCollegeSelect]);

  const onCourseSelectRef = React.useRef(onCourseSelect);
  useEffect(() => {
    onCourseSelectRef.current = onCourseSelect;
  }, [onCourseSelect]);

  // 2. Fetch Courses when College Selection changes
  const fetchCoursesForCollege = useCallback(async (colgCd: string) => {
    if (!colgCd) {
      setCourses([]);
      setSelectedCourseCd('');
      setSelectedCourse(null);
      if (onCourseSelectRef.current) onCourseSelectRef.current(null);
      return;
    }

    setCoursesLoading(true);
    setCoursesError(null);
    setCourses([]);
    setSelectedCourseCd('');
    setSelectedCourse(null);
    if (onCourseSelectRef.current) onCourseSelectRef.current(null);

    try {
      // 1. Next.js server proxy route
      let res = await fetch('/api/srms/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colgcd: colgCd }),
      }).catch(() => null);

      // Fallback: Backend live proxy
      if (!res || !res.ok) {
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/college-master/live/courses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ colgcd: colgCd }),
        }).catch(() => null);
      }

      if (!res || !res.ok) {
        throw new Error(`Failed to load courses`);
      }

      const data = await res.json();
      const list: LiveCourse[] = Array.isArray(data) ? data : data.data || [];
      setCourses(list);
    } catch (err: any) {
      console.error('[CascadingDropdown] Fetch Courses Error:', err);
      setCoursesError(err.message || 'Unable to load courses from live API');
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  // 1. Fetch Colleges on Initial Component Mount
  const fetchColleges = useCallback(async () => {
    setCollegesLoading(true);
    setCollegesError(null);
    try {
      // 1. Next.js server proxy route (handles SSL and bypass)
      let res = await fetch('/api/srms/colleges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }).catch(() => null);

      // Fallback: Backend live endpoint
      if (!res || !res.ok) {
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/college-master/live/colleges`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }).catch(() => null);
      }

      if (!res || !res.ok) {
        throw new Error(`Failed to load colleges`);
      }

      const data = await res.json();
      const list: LiveCollege[] = Array.isArray(data) ? data : data.data || [];
      const role = typeof window !== 'undefined' ? (localStorage.getItem('role') || 'ADMIN').toUpperCase() : 'ADMIN';
      const colg = typeof window !== 'undefined' ? (localStorage.getItem('colg_cd') || localStorage.getItem('colgCd') || '1') : '1';

      if (role !== 'SUPER_ADMIN') {
        const myCol = list.filter((c: any) => String(c.colg_cd) === String(colg) || String(c.code) === String(colg));
        const finalCols = myCol.length > 0 ? myCol : list;
        setColleges(finalCols);
        setSelectedColgCd(colg);
        const activeCol = finalCols[0];
        if (activeCol) {
          setSelectedCollege(activeCol);
          if (onCollegeSelectRef.current) onCollegeSelectRef.current(activeCol);
          fetchCoursesForCollege(colg);
        }
      } else {
        setColleges(list);
      }
    } catch (err: any) {
      console.error('[CascadingDropdown] Fetch Colleges Error:', err);
      setCollegesError(err.message || 'Unable to load colleges from live API');
    } finally {
      setCollegesLoading(false);
    }
  }, [fetchCoursesForCollege]);

  useEffect(() => {
    fetchColleges();
  }, [fetchColleges]);

  // Synchronize when external selectedCollegeCode changes
  useEffect(() => {
    if (selectedCollegeCode !== undefined && selectedCollegeCode !== selectedColgCd) {
      setSelectedColgCd(selectedCollegeCode);
      if (selectedCollegeCode) {
        const matched = colleges.find((c) => c.colg_cd === selectedCollegeCode) || null;
        setSelectedCollege(matched);
        fetchCoursesForCollege(selectedCollegeCode);
      } else {
        setSelectedCollege(null);
        setCourses([]);
        setSelectedCourseCd('');
        setSelectedCourse(null);
      }
    }
  }, [selectedCollegeCode, colleges, fetchCoursesForCollege, selectedColgCd]);

  // Handle College Dropdown Selection Change
  const handleCollegeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cd = e.target.value;
    setSelectedColgCd(cd);
    const matched = colleges.find((c) => c.colg_cd === cd) || null;
    setSelectedCollege(matched);

    if (onCollegeSelect) {
      onCollegeSelect(matched);
    }

    // Trigger cascading course fetch
    fetchCoursesForCollege(cd);
  };

  // Handle Course Dropdown Selection Change
  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cd = e.target.value;
    setSelectedCourseCd(cd);
    const matched = courses.find((c) => c.course_cd === cd) || null;
    setSelectedCourse(matched);

    if (onCourseSelect) {
      onCourseSelect(matched);
    }
  };

  return (
    <div className={`p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[22px] shadow-sm transition-all ${className}`}>
      {/* Header Info */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
            ⚡
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Live Cascading Selector
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Real-time API (College → Course) with <span className="font-semibold text-emerald-600 dark:text-emerald-400">active_flg == 1</span> filtering
            </p>
          </div>
        </div>

        {showLiveApiBadge && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>100% Live SRMS API</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. College Dropdown */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>🏛️</span> 1. Select College / Institution *
            </span>
            {collegesLoading && (
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                <span className="animate-spin">🌀</span> Fetching...
              </span>
            )}
          </label>

          <div className="relative">
            <select
              value={selectedColgCd}
              onChange={handleCollegeChange}
              disabled={collegesLoading || userRole !== 'SUPER_ADMIN'}
              className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border rounded-xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                collegesError
                  ? 'border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300'
                  : 'border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-indigo-500'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {userRole === 'SUPER_ADMIN' && (
                <option value="">
                  {collegesLoading
                    ? 'Loading colleges from live API...'
                    : collegesError
                    ? 'Failed to load colleges'
                    : '-- Choose a College Institution --'}
                </option>
              )}
              {colleges.map((col) => (
                <option key={col.colg_cd} value={col.colg_cd}>
                  [#{col.colg_cd}] {col.colg_name}
                </option>
              ))}
            </select>
          </div>

          {collegesError ? (
            <div className="text-[10px] font-medium text-rose-500 flex items-center justify-between pt-1">
              <span>⚠️ {collegesError}</span>
              <button
                type="button"
                onClick={fetchColleges}
                className="underline hover:text-rose-700 font-bold"
              >
                Retry
              </button>
            </div>
          ) : (
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {colleges.length > 0
                ? `${colleges.length} institutions loaded live from SRMS ERP`
                : 'Calling https://myportal.srms.ac.in/SRMSERP/Home/GetCollege'}
            </p>
          )}
        </div>

        {/* 2. Course Dropdown (Cascading) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>🎓</span> 2. Select Course (Cascading) *
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
                  : 'border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-purple-500'
              } disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed`}
            >
              <option value="">
                {!selectedColgCd
                  ? '← Select a college first'
                  : coursesLoading
                  ? 'Fetching courses for selected college...'
                  : courses.length === 0
                  ? 'No courses found for this college'
                  : '--Select  Branch / Course----'}
              </option>
              {courses.map((crs) => (
                <option key={crs.course_cd} value={crs.course_cd}>
                  {crs.course_name}
                </option>
              ))}
            </select>
          </div>

          {coursesError ? (
            <div className="text-[10px] font-medium text-rose-500 flex items-center justify-between pt-1">
              <span>⚠️ {coursesError}</span>
              <button
                type="button"
                onClick={() => fetchCoursesForCollege(selectedColgCd)}
                className="underline hover:text-rose-700 font-bold"
              >
                Retry
              </button>
            </div>
          ) : (
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {selectedColgCd
                ? `${courses.length} active courses (filtered active_flg == 1) from GetCourse`
                : 'Disabled until college is selected'}
            </p>
          )}
        </div>
      </div>

      {/* Selected Item Summary Pill */}
      {(selectedCollege || selectedCourse) && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-semibold text-[11px]">Selected:</span>
          {selectedCollege && (
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-500/20 text-[11px] flex items-center gap-1">
              <span>🏛️</span> {selectedCollege.colg_name} <span className="opacity-70 font-mono">(#{selectedCollege.colg_cd})</span>
            </span>
          )}
          {selectedCourse ? (
            <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold border border-purple-500/20 text-[11px] flex items-center gap-1">
              <span>🎓</span> {selectedCourse.course_name} <span className="opacity-70 font-mono">(CD: {selectedCourse.course_cd})</span>
              <span className="ml-1 px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 text-[9px] uppercase font-extrabold">Active</span>
            </span>
          ) : selectedColgCd ? (
            <span className="text-slate-400 italic text-[11px]">Please select a course</span>
          ) : null}
        </div>
      )}
    </div>
  );
}
