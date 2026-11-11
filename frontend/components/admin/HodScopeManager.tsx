'use client';

import React, { useState, useEffect, useMemo } from 'react';

export interface HodCollege {
  id: string;
  name: string;
  code: string;
  colg_cd?: string;
  slug?: string;
  domain?: string;
  is_active?: boolean;
}

export interface HodCourse {
  id: string;
  name: string;
  code: string;
  course_cd?: string;
  colg_cd?: string;
}

export interface HodDepartment {
  id: string;
  name: string;
  code: string;
  branch_cd?: string;
  course_cd?: string;
  course_name?: string;
  colg_cd?: string;
  hod_user_id?: string;
  hod_name?: string;
  hod_email?: string;
  isPendingAdd?: boolean;
}

export interface HodUser {
  id: string;
  name: string;
  email: string;
  role?: string;
  assigned_roles?: string;
  emp_id?: string;
  designation?: string;
  colg_cd?: string;
  college_id?: string;
  college_code?: string;
  is_appointed_hod?: boolean;
  linkedDepartmentCount?: number;
  linkedDepartments?: Array<{
    id: string;
    name: string;
    code: string;
    branch_cd?: string;
    course_cd?: string;
    course_name?: string;
    colg_cd?: string;
  }>;
}

interface HodScopeManagerProps {
  role?: 'admin' | 'clerk';
  initialHodUserId?: string;
  isModal?: boolean;
  onClose?: () => void;
  onScopeSaved?: (updatedHodId: string, linkedCount: number) => void;
}

export default function HodScopeManager({
  role = 'admin',
  initialHodUserId,
  isModal = false,
  onClose,
  onScopeSaved,
}: HodScopeManagerProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Core Data Lists
  const [colleges, setColleges] = useState<HodCollege[]>([]);
  const [hods, setHods] = useState<HodUser[]>([]);
  const [courses, setCourses] = useState<HodCourse[]>([]);
  const [departments, setDepartments] = useState<HodDepartment[]>([]);

  // Selections
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('');
  const [selectedHodId, setSelectedHodId] = useState<string>(initialHodUserId || '');
  const [showAllStaff, setShowAllStaff] = useState<boolean>(false);

  // Right-side Add Form Selections
  const [selectedCourseCd, setSelectedCourseCd] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  // Right-side Staged Table of Linked Branches for active HOD
  const [stagedBranches, setStagedBranches] = useState<HodDepartment[]>([]);
  const [originalBranchIds, setOriginalBranchIds] = useState<Set<string>>(new Set());

  // Search & Filter Inputs
  const [searchHod, setSearchHod] = useState('');
  const [tableSearch, setTableSearch] = useState('');

  // Resolve active tenant
  const activeTenant = useMemo(() => {
    if (typeof window === 'undefined') return 'srms-cet-bareilly';
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.tenantSlug) return u.tenantSlug;
      } catch {}
    }
    return localStorage.getItem('tenant') || 'srms-cet-bareilly';
  }, []);

  // Fetch HOD Scope data
  const fetchData = async (targetCollegeSlug?: string, targetColgCd?: string) => {
    setLoading(true);
    setError(null);
    try {
      const effectiveSlug = targetCollegeSlug || activeTenant;
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const queryParams = new URLSearchParams({
        tenant: effectiveSlug,
        ...(targetColgCd ? { colg_cd: targetColgCd } : {}),
        ...(showAllStaff ? { all_faculty: 'true' } : {}),
      });

      const res = await fetch(`/api/v1/college-master/hod-scope?${queryParams.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': effectiveSlug,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load HOD scopes (HTTP ${res.status})`);
      }

      const json = await res.json();
      const rawColleges: HodCollege[] = json.colleges || [];
      const rawHods: HodUser[] = json.hods || [];
      const rawCourses: HodCourse[] = json.courses || [];
      const rawDepts: HodDepartment[] = json.departments || [];

      // If colleges table was empty in response, fetch from /api/v1/college-master/colleges as fallback
      let finalColleges = rawColleges;
      if (finalColleges.length === 0) {
        try {
          const colRes = await fetch(`/api/v1/college-master/colleges?tenant=${effectiveSlug}`, {
            headers: {
              'Content-Type': 'application/json',
              'x-tenant-slug': effectiveSlug,
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          if (colRes.ok) {
            const colJson = await colRes.json();
            finalColleges = colJson.data || [];
          }
        } catch {}
      }

      // If still empty, provide fallback entry based on active tenant
      if (finalColleges.length === 0) {
        finalColleges = [
          {
            id: '1',
            code: '1',
            colg_cd: '1',
            name: typeof window !== 'undefined' ? (localStorage.getItem('college_name') || localStorage.getItem('tenantName') || 'Main Campus College') : 'Main Campus College',
            slug: effectiveSlug,
            is_active: true,
          },
        ];
      }

      setColleges(finalColleges);
      setHods(rawHods);
      setCourses(rawCourses);
      setDepartments(rawDepts);

      // Determine active college
      let currentCol = finalColleges.find(
        (c) => String(c.code) === String(selectedCollegeId) || c.id === selectedCollegeId || c.slug === selectedCollegeId
      );
      if (!currentCol) {
        currentCol = finalColleges[0];
        setSelectedCollegeId(currentCol.code || currentCol.id);
      }

      // Filter HODs for this college
      const colHods = filterHodsByCollege(rawHods, currentCol);

      // Pick selected HOD
      const targetHod = colHods.find((h) => h.id === selectedHodId) || colHods[0] || null;
      if (targetHod) {
        setSelectedHodId(targetHod.id);
        initStagedBranchesForHod(targetHod.id, rawDepts);
      } else {
        setSelectedHodId('');
        setStagedBranches([]);
        setOriginalBranchIds(new Set());
      }

      // Setup default course & branch for the right panel Add form
      initAddFormDefaults(rawCourses, rawDepts, currentCol);
    } catch (err: any) {
      setError(err?.message || 'Failed to communicate with server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTenant, showAllStaff]);

  // Helper to filter HODs by selected college
  const filterHodsByCollege = (hodList: HodUser[], col?: HodCollege | null): HodUser[] => {
    if (!col) return hodList;
    const colCode = String(col.code || col.colg_cd || '').trim();
    const colSlug = (col.slug || '').toLowerCase().trim();

    return hodList.filter((h) => {
      // If HOD has explicit college code
      const hColCode = String(h.colg_cd || h.college_code || '').trim();
      if (hColCode && colCode && hColCode === colCode) return true;

      // If HOD has linked departments that belong to this college
      if (h.linkedDepartments && h.linkedDepartments.length > 0) {
        const matchesLinked = h.linkedDepartments.some(
          (ld) => !ld.colg_cd || String(ld.colg_cd) === colCode
        );
        if (matchesLinked) return true;
      }

      // If no explicit college tag, allow in college if there are no other colleges or single tenant
      if (!hColCode && (!colCode || colCode === '1')) return true;

      return false;
    });
  };

  // Helper to populate staged branches for a selected HOD
  const initStagedBranchesForHod = (hodId: string, allDepts: HodDepartment[]) => {
    const linked = allDepts
      .filter((d) => String(d.hod_user_id) === String(hodId))
      .map((d) => ({ ...d, isPendingAdd: false }));

    setStagedBranches(linked);
    setOriginalBranchIds(new Set(linked.map((d) => d.id)));
  };

  // Helper to set default course & branch in the Add Form
  const initAddFormDefaults = (
    allCourses: HodCourse[],
    allDepts: HodDepartment[],
    currentCol?: HodCollege | null
  ) => {
    const colCode = currentCol ? String(currentCol.code || currentCol.colg_cd || '') : '';
    // Filter courses for this college
    const availableCourses = allCourses.filter(
      (c) => !colCode || !c.colg_cd || String(c.colg_cd) === colCode
    );

    const firstCourse = availableCourses[0] || allCourses[0];
    if (firstCourse) {
      const crsCd = firstCourse.course_cd || firstCourse.code;
      setSelectedCourseCd(crsCd);

      const branchList = allDepts.filter(
        (d) => String(d.course_cd) === String(crsCd)
      );
      if (branchList.length > 0) {
        setSelectedBranchId(branchList[0].id);
      } else {
        setSelectedBranchId('');
      }
    }
  };

  // Current selected college object
  const currentCollege = useMemo(() => {
    return (
      colleges.find(
        (c) => String(c.code) === String(selectedCollegeId) || c.id === selectedCollegeId || c.slug === selectedCollegeId
      ) || colleges[0] || null
    );
  }, [colleges, selectedCollegeId]);

  // Filtered HOD list for the selected college + search query
  const collegeHods = useMemo(() => {
    return filterHodsByCollege(hods, currentCollege);
  }, [hods, currentCollege]);

  const displayHods = useMemo(() => {
    let list = collegeHods;
    if (searchHod.trim()) {
      const q = searchHod.toLowerCase();
      list = list.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          (h.email && h.email.toLowerCase().includes(q)) ||
          (h.emp_id && h.emp_id.toLowerCase().includes(q)) ||
          (h.designation && h.designation.toLowerCase().includes(q))
      );
    }
    return list;
  }, [collegeHods, searchHod]);

  // Selected HOD object
  const currentHod = useMemo(() => {
    return hods.find((h) => h.id === selectedHodId) || null;
  }, [hods, selectedHodId]);

  // Courses filtered for selected college
  const collegeCourses = useMemo(() => {
    if (!currentCollege) return courses;
    const colCode = String(currentCollege.code || currentCollege.colg_cd || '').trim();
    if (!colCode) return courses;
    const filtered = courses.filter((c) => !c.colg_cd || String(c.colg_cd) === colCode);
    return filtered.length > 0 ? filtered : courses;
  }, [courses, currentCollege]);

  // Branches filtered for selected course
  const availableBranchesForCourse = useMemo(() => {
    if (!selectedCourseCd) return [];
    return departments.filter(
      (d) => String(d.course_cd) === String(selectedCourseCd)
    );
  }, [departments, selectedCourseCd]);

  // Dirty state checker: has the user added or removed branches?
  const isDirty = useMemo(() => {
    if (stagedBranches.length !== originalBranchIds.size) return true;
    for (const b of stagedBranches) {
      if (!originalBranchIds.has(b.id)) return true;
    }
    return false;
  }, [stagedBranches, originalBranchIds]);

  // Handler: When user switches college on the left
  const handleCollegeChange = (newCollegeVal: string) => {
    setSelectedCollegeId(newCollegeVal);
    setSuccessMsg(null);
    setInfoMsg(null);

    const targetCol = colleges.find(
      (c) => String(c.code) === String(newCollegeVal) || c.id === newCollegeVal || c.slug === newCollegeVal
    );

    // If target college has a different tenant slug, trigger fetch for that slug
    if (targetCol && targetCol.slug && targetCol.slug !== activeTenant) {
      fetchData(targetCol.slug, targetCol.code);
      return;
    }

    // Otherwise filter in-place
    const colHods = filterHodsByCollege(hods, targetCol);
    if (colHods.length > 0) {
      setSelectedHodId(colHods[0].id);
      initStagedBranchesForHod(colHods[0].id, departments);
    } else {
      setSelectedHodId('');
      setStagedBranches([]);
      setOriginalBranchIds(new Set());
    }

    initAddFormDefaults(courses, departments, targetCol);
  };

  // Handler: When user selects an HOD card on the left
  const handleSelectHod = (hodId: string) => {
    if (selectedHodId === hodId) return;

    if (isDirty) {
      const confirmDiscard = window.confirm(
        'You have unsaved branch scope modifications. Switching HOD will discard unsaved changes. Proceed?'
      );
      if (!confirmDiscard) return;
    }

    setSelectedHodId(hodId);
    setSuccessMsg(null);
    setInfoMsg(null);
    initStagedBranchesForHod(hodId, departments);
  };

  // Handler: Course changed in Right Add Form -> updates available branches
  const handleCourseChange = (crsCd: string) => {
    setSelectedCourseCd(crsCd);
    setInfoMsg(null);

    const branchList = departments.filter(
      (d) => String(d.course_cd) === String(crsCd)
    );
    if (branchList.length > 0) {
      // Pick first branch that is not yet added, or first branch
      const unadded = branchList.find(
        (b) => !stagedBranches.some((sb) => sb.id === b.id)
      );
      setSelectedBranchId(unadded ? unadded.id : branchList[0].id);
    } else {
      setSelectedBranchId('');
    }
  };

  // Handler: "Add to List" button clicked on the right
  const handleAddBranchToList = () => {
    if (!selectedBranchId) {
      setError('Please select a branch to add.');
      return;
    }

    const branchObj = departments.find((d) => d.id === selectedBranchId);
    if (!branchObj) {
      setError('Selected branch could not be resolved.');
      return;
    }

    // Check duplicate
    if (stagedBranches.some((b) => b.id === branchObj.id)) {
      setInfoMsg(`"${branchObj.name}" is already in the HOD's scope list.`);
      return;
    }

    const courseObj = courses.find(
      (c) => String(c.course_cd) === String(branchObj.course_cd) || String(c.code) === String(branchObj.course_cd)
    );

    const enrichedBranch: HodDepartment = {
      ...branchObj,
      course_name: branchObj.course_name || courseObj?.name || `Course ${branchObj.course_cd || ''}`,
      isPendingAdd: true,
    };

    setStagedBranches((prev) => [enrichedBranch, ...prev]);
    setError(null);
    setInfoMsg(`Added "${branchObj.name}" to scope list. Click "Save Academic Scope" to persist.`);

    // Auto-advance branch selection to next unadded branch if available
    const nextUnadded = availableBranchesForCourse.find(
      (b) => b.id !== branchObj.id && !stagedBranches.some((sb) => sb.id === b.id)
    );
    if (nextUnadded) {
      setSelectedBranchId(nextUnadded.id);
    }
  };

  // Handler: "Add All Branches of this Course" convenience button
  const handleAddAllCourseBranches = () => {
    if (availableBranchesForCourse.length === 0) return;

    const unadded = availableBranchesForCourse.filter(
      (b) => !stagedBranches.some((sb) => sb.id === b.id)
    );

    if (unadded.length === 0) {
      setInfoMsg('All branches for this course are already in the list.');
      return;
    }

    const enriched = unadded.map((b) => ({
      ...b,
      isPendingAdd: true,
    }));

    setStagedBranches((prev) => [...enriched, ...prev]);
    setError(null);
    setInfoMsg(`Added ${unadded.length} branch(es) to scope list.`);
  };

  // Handler: Remove branch from staged table
  const handleRemoveBranch = (deptId: string) => {
    setStagedBranches((prev) => prev.filter((b) => b.id !== deptId));
    setInfoMsg('Branch removed from staged list. Click "Save Academic Scope" to persist.');
  };

  // Handler: Clear All staged branches
  const handleClearAll = () => {
    if (stagedBranches.length === 0) return;
    if (window.confirm('Remove all linked branches from this HOD? You will still need to click "Save Academic Scope" to confirm.')) {
      setStagedBranches([]);
      setInfoMsg('All branches cleared from staged list. Click "Save Academic Scope" to persist.');
    }
  };

  // Handler: Reset to original saved state
  const handleReset = () => {
    if (!currentHod) return;
    initStagedBranchesForHod(currentHod.id, departments);
    setError(null);
    setInfoMsg('Reverted all unsaved changes.');
  };

  // Handler: Save Academic Scope to backend
  const handleSaveScope = async () => {
    if (!selectedHodId) {
      setError('Please select an HOD before saving.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    setInfoMsg(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const effectiveSlug = currentCollege?.slug || activeTenant;
      const deptIds = stagedBranches.map((b) => b.id);

      const res = await fetch(`/api/v1/college-master/hod-scope?tenant=${effectiveSlug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': effectiveSlug,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          hodUserId: selectedHodId,
          departmentIds: deptIds,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || `Failed to update HOD scope (HTTP ${res.status})`);
      }

      setSuccessMsg(
        json.message || `Academic scope successfully updated! ${deptIds.length} branch(es) linked to ${currentHod?.name}.`
      );

      // Update original IDs and staged branches state
      setOriginalBranchIds(new Set(deptIds));
      setStagedBranches((prev) => prev.map((b) => ({ ...b, isPendingAdd: false })));

      // Optimistically update HOD in left panel list
      setHods((prev) =>
        prev.map((h) =>
          h.id === selectedHodId
            ? {
                ...h,
                linkedDepartmentCount: deptIds.length,
                linkedDepartments: stagedBranches.map((b) => ({
                  id: b.id,
                  name: b.name,
                  code: b.code,
                  branch_cd: b.branch_cd,
                  course_cd: b.course_cd,
                  course_name: b.course_name,
                  colg_cd: b.colg_cd,
                })),
              }
            : h
        )
      );

      if (onScopeSaved) {
        onScopeSaved(selectedHodId, deptIds.length);
      }
    } catch (err: any) {
      setError(err?.message || 'Error saving HOD scope');
    } finally {
      setSaving(false);
    }
  };

  // Filter table search
  const filteredTableBranches = useMemo(() => {
    if (!tableSearch.trim()) return stagedBranches;
    const q = tableSearch.toLowerCase();
    return stagedBranches.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        (b.course_name && b.course_name.toLowerCase().includes(q)) ||
        (b.course_cd && b.course_cd.toLowerCase().includes(q)) ||
        (b.branch_cd && b.branch_cd.toLowerCase().includes(q))
    );
  }, [stagedBranches, tableSearch]);

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/3" />
        <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-5 h-[500px] bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="xl:col-span-7 h-[500px] bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Context Card */}
      {!isModal && (
        <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 text-xs font-black uppercase tracking-wider mb-2 border border-indigo-200/60 dark:border-indigo-800/40">
                <span>🏛️</span>
                <span>Academic Scope & Multi-Branch Linker</span>
              </div>
              <h1 className="text-2xl font-black text-[#1B1E28] dark:text-white tracking-tight">
                {role === 'clerk' ? 'HOD Department Scope Manager' : 'HOD Course & Branch Linker'}
              </h1>
              <p className="text-sm font-medium text-[#4E5969] dark:text-slate-400 mt-1 max-w-2xl">
                Select an institution college on the left, choose the Head of Department (HOD), then link college-wise Courses and Branches on the right. An HOD can be linked to multiple branches across courses.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-4 py-2.5 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800/80 border border-[#E7EAF3] dark:border-slate-700/80">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Colleges</div>
                <div className="text-xl font-black text-[#1B1E28] dark:text-white">{colleges.length}</div>
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800/80 border border-[#E7EAF3] dark:border-slate-700/80">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">HOD Appointees</div>
                <div className="text-xl font-black text-[#5B4BFF]">{collegeHods.length}</div>
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800/80 border border-[#E7EAF3] dark:border-slate-700/80">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">College Courses</div>
                <div className="text-xl font-black text-[#7867FF]">{collegeCourses.length}</div>
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800/80 border border-[#E7EAF3] dark:border-slate-700/80">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Branches</div>
                <div className="text-xl font-black text-emerald-600">{departments.length}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center justify-between text-sm font-semibold text-red-700 dark:text-red-300">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between text-sm font-semibold text-emerald-700 dark:text-emerald-300 animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-800 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {infoMsg && (
        <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-between text-xs font-semibold text-indigo-700 dark:text-indigo-300 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span>ℹ️</span>
            <span>{infoMsg}</span>
          </div>
          <button onClick={() => setInfoMsg(null)} className="text-indigo-500 hover:text-indigo-800 text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {/* TWO SECTIONS: LEFT AND RIGHT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* LEFT SECTION: 1. Select College -> 2. Fetch & Select HOD                   */}
        {/* ========================================================================= */}
        <div className="xl:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-5 shadow-sm space-y-4">
            {/* Step 1: Select College */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black uppercase text-[#1B1E28] dark:text-white flex items-center gap-1.5 tracking-wider">
                  <span>🏛️</span>
                  <span>1. Select College / Institution</span>
                </label>
                <span className="text-[11px] font-bold text-[#5B4BFF]">
                  {colleges.length} {colleges.length === 1 ? 'College' : 'Colleges'}
                </span>
              </div>
              <div className="relative">
                <select
                  value={selectedCollegeId}
                  onChange={(e) => handleCollegeChange(e.target.value)}
                  className="w-full px-3.5 pr-8 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30 text-xs text-[#1B1E28] dark:text-white font-bold transition-all appearance-none cursor-pointer"
                >
                  {colleges.map((c) => (
                    <option key={c.id || c.code} value={c.code || c.id}>
                      🏛️ [{c.code || c.colg_cd || c.id}] {c.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-3 pointer-events-none text-slate-400 text-xs">
                  ▼
                </div>
              </div>
              {currentCollege && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                  <span>Active College:</span>
                  <span className="font-extrabold text-[#5B4BFF] truncate">{currentCollege.name}</span>
                  {currentCollege.code && (
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Code: {currentCollege.code}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-[#E7EAF3] dark:border-slate-800" />

            {/* Step 2: Fetch HODs on behalf of selected College */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black uppercase text-[#1B1E28] dark:text-white flex items-center gap-1.5 tracking-wider">
                  <span>👨‍🏫</span>
                  <span>2. Select Head of Department (HOD)</span>
                </label>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                  {displayHods.length} Available
                </span>
              </div>

              {/* Search HOD Input */}
              <div className="relative mb-2.5">
                <input
                  type="text"
                  value={searchHod}
                  onChange={(e) => setSearchHod(e.target.value)}
                  placeholder="Search HOD name, code, email, emp id..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30 transition-all"
                />
                <span className="absolute left-3 top-3 text-slate-400 text-xs">🔍</span>
              </div>

              {/* Option to show all staff/faculty */}
              <div className="flex items-center justify-between mb-3 px-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={showAllStaff}
                    onChange={(e) => setShowAllStaff(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-[#5B4BFF] border-slate-300 focus:ring-[#5B4BFF] cursor-pointer"
                  />
                  <span>Show all Faculty / Staff to appoint new HOD</span>
                </label>
                <span className="text-[10px] font-semibold text-[#7867FF]">
                  {collegeHods.filter((h) => (h.linkedDepartmentCount || 0) > 0).length} Linked
                </span>
              </div>

              {/* HOD Roster List Cards */}
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {displayHods.length === 0 ? (
                  <div className="p-8 text-center bg-[#F6F8FC] dark:bg-slate-800/40 rounded-2xl border border-dashed border-[#E7EAF3] dark:border-slate-800">
                    <div className="text-2xl mb-1.5">👨‍🏫</div>
                    <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      No HOD records found for this college.
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Check "Show all Faculty / Staff" above to assign any faculty member as HOD.
                    </p>
                  </div>
                ) : (
                  displayHods.map((hod) => {
                    const isSelected = hod.id === selectedHodId;
                    const linkedCount = isSelected
                      ? stagedBranches.length
                      : (hod.linkedDepartmentCount || 0);

                    return (
                      <button
                        key={hod.id}
                        type="button"
                        onClick={() => handleSelectHod(hod.id)}
                        className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#5B4BFF]/5 dark:bg-[#5B4BFF]/15 border-[#5B4BFF] shadow-sm ring-2 ring-[#5B4BFF]/30'
                            : 'bg-white dark:bg-slate-800/50 border-[#E7EAF3] dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-start gap-2.5 min-w-0">
                            {/* Avatar */}
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                isSelected
                                  ? 'bg-[#5B4BFF] text-white'
                                  : 'bg-indigo-50 dark:bg-indigo-950 text-[#5B4BFF]'
                              }`}
                            >
                              {hod.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-extrabold text-xs text-[#1B1E28] dark:text-white truncate flex items-center gap-1.5">
                                <span>{hod.name}</span>
                                {isSelected && (
                                  <span className="px-1.5 py-0.2 rounded bg-[#5B4BFF] text-white text-[9px] font-black">
                                    Active
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                                {hod.email || 'No email registered'}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] font-bold text-slate-400">
                                {hod.emp_id && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                    ID: {hod.emp_id}
                                  </span>
                                )}
                                <span className="truncate">{hod.designation || 'Faculty'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Linked Branches Badge */}
                          <div className="shrink-0 text-right">
                            <span
                              className={`px-2 py-1 rounded-lg text-[10px] font-black inline-flex items-center gap-1 ${
                                linkedCount > 0
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                              }`}
                            >
                              <span>🔗</span>
                              <span>{linkedCount} {linkedCount === 1 ? 'Branch' : 'Branches'}</span>
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT SECTION: College-wise Courses -> Branches -> Add to List below Table */}
        {/* ========================================================================= */}
        <div className="xl:col-span-7 space-y-4">
          {/* Active Appointee Header Card */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🎯</span>
                  <span>Active HOD Appointee</span>
                </div>
                <div className="text-lg font-black text-[#1B1E28] dark:text-white flex items-center gap-2 mt-0.5">
                  <span>{currentHod ? currentHod.name : 'No HOD Selected'}</span>
                  {currentHod?.emp_id && (
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-200">
                      ID: {currentHod.emp_id}
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold text-slate-500 mt-0.5">
                  {currentHod ? (
                    <>
                      Assigned to <strong className="text-[#5B4BFF] font-black">{stagedBranches.length}</strong> branch jurisdiction(s) under{' '}
                      <strong>{currentCollege?.name || 'College'}</strong>.
                      {isDirty && (
                        <span className="ml-2 text-amber-600 dark:text-amber-400 font-extrabold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200">
                          ⚠️ Unsaved changes
                        </span>
                      )}
                    </>
                  ) : (
                    'Please select an HOD from the left panel to configure course and branch linkages.'
                  )}
                </div>
              </div>

              {/* Action Buttons: Reset & Save */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!isDirty || saving}
                  onClick={handleReset}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-40 transition-all cursor-pointer"
                >
                  Reset
                </button>
                <button
                  type="button"
                  disabled={saving || !currentHod}
                  onClick={handleSaveScope}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-[#5B4BFF] to-[#7867FF] hover:from-[#4A39EF] hover:to-[#6756EF] disabled:opacity-50 shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Scope...</span>
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      <span>Save Academic Scope</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 1. LOAD COLLEGE WISE COURSES -> BRANCHES THEN ADD TO LIST */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-5 shadow-sm space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-[#1B1E28] dark:text-white flex items-center gap-2 uppercase tracking-wide">
                  <span>➕</span>
                  <span>1. Load College-Wise Courses → Branches & Add to List</span>
                </h3>
                <span className="text-[11px] font-bold text-slate-400">
                  {collegeCourses.length} Courses in College
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                Pick a course for <strong>{currentCollege?.name || 'this college'}</strong>, then select a branch and click <strong>"Add to List"</strong>. You can add multiple branches across multiple courses.
              </p>
            </div>

            {/* Course & Branch Cascade Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
              {/* Select Course */}
              <div className="md:col-span-5 space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase text-[#5B4BFF] tracking-wider flex items-center justify-between">
                  <span>Course ({collegeCourses.length}) *</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedCourseCd}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    disabled={collegeCourses.length === 0 || !currentHod}
                    className="w-full px-3.5 pr-8 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30 text-xs text-[#1B1E28] dark:text-white font-bold transition-all appearance-none cursor-pointer disabled:opacity-50"
                  >
                    {collegeCourses.map((c) => (
                      <option key={c.id || c.code} value={c.course_cd || c.code}>
                        📚 [{c.course_cd || c.code}] {c.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-3 pointer-events-none text-slate-400 text-xs">
                    ▼
                  </div>
                </div>
              </div>

              {/* Select Branch */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase text-[#5B4BFF] tracking-wider flex items-center justify-between">
                  <span>Branch / Department ({availableBranchesForCourse.length}) *</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    disabled={availableBranchesForCourse.length === 0 || !currentHod}
                    className="w-full px-3.5 pr-8 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]/30 text-xs text-[#1B1E28] dark:text-white font-bold transition-all appearance-none cursor-pointer disabled:opacity-50"
                  >
                    {availableBranchesForCourse.length === 0 ? (
                      <option value="">No branches under this course</option>
                    ) : (
                      availableBranchesForCourse.map((b) => {
                        const isAlreadyInList = stagedBranches.some((sb) => sb.id === b.id);
                        return (
                          <option key={b.id} value={b.id}>
                            🏛️ [{b.branch_cd || b.code}] {b.name} {isAlreadyInList ? '✓ (In List)' : ''}
                          </option>
                        );
                      })
                    )}
                  </select>
                  <div className="absolute right-3 top-3 pointer-events-none text-slate-400 text-xs">
                    ▼
                  </div>
                </div>
              </div>

              {/* Add to List Button */}
              <div className="md:col-span-3">
                <button
                  type="button"
                  disabled={!selectedBranchId || !currentHod}
                  onClick={handleAddBranchToList}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-black text-white bg-[#5B4BFF] hover:bg-[#4A39EF] disabled:opacity-50 shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>➕</span>
                  <span>Add to List</span>
                </button>
              </div>
            </div>

            {/* Quick Helper: Add All Branches of this Course */}
            {availableBranchesForCourse.length > 1 && currentHod && (
              <div className="flex items-center justify-between pt-2 border-t border-[#E7EAF3] dark:border-slate-800 text-[11px]">
                <span className="text-slate-400 font-semibold">
                  Course has <strong>{availableBranchesForCourse.length}</strong> branches.
                </span>
                <button
                  type="button"
                  onClick={handleAddAllCourseBranches}
                  className="font-bold text-[#5B4BFF] hover:text-[#4A39EF] flex items-center gap-1 cursor-pointer"
                >
                  <span>✓</span>
                  <span>Add All Branches of this Course</span>
                </button>
              </div>
            )}
          </div>

          {/* TABLE BELOW: LINKED COURSES & BRANCHES (IT MIGHT MULTIPLE) */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-[#1B1E28] dark:text-white flex items-center gap-2">
                  <span>📋</span>
                  <span>Linked Courses & Branches Table</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-[#5B4BFF] text-xs font-extrabold border border-indigo-200/50">
                    {stagedBranches.length} {stagedBranches.length === 1 ? 'Entry' : 'Entries'}
                  </span>
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Academic scope assigned to{' '}
                  <strong className="text-[#1B1E28] dark:text-white">
                    {currentHod ? currentHod.name : 'Selected HOD'}
                  </strong>
                  .
                </p>
              </div>

              {/* Table search & Clear All */}
              <div className="flex items-center gap-2">
                {stagedBranches.length > 3 && (
                  <div className="relative w-44">
                    <input
                      type="text"
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      placeholder="Filter list..."
                      className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#5B4BFF]"
                    />
                    <span className="absolute left-2 top-2 text-slate-400 text-xs">🔍</span>
                  </div>
                )}
                {stagedBranches.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-[#E7EAF3] dark:border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F6F8FC] dark:bg-slate-800 text-[11px] font-black text-slate-500 uppercase tracking-wider border-b border-[#E7EAF3] dark:border-slate-700">
                    <th className="py-3 px-3.5 w-12 text-center">#</th>
                    <th className="py-3 px-4">Course</th>
                    <th className="py-3 px-4">Branch / Department</th>
                    <th className="py-3 px-4">College</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-3.5 text-right w-20">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800 text-xs">
                  {filteredTableBranches.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <div className="text-3xl mb-2">📚</div>
                        <div className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                          {currentHod
                            ? 'No courses or branches linked to this HOD yet.'
                            : 'Select an HOD from the left to view their linked branches.'}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                          Use the Course and Branch dropdowns above and click <strong>"Add to List"</strong> to assign academic scope.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTableBranches.map((item, idx) => {
                      const isNewlyAdded = !originalBranchIds.has(item.id);
                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            isNewlyAdded
                              ? 'bg-amber-50/40 dark:bg-amber-950/20'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-3 px-3.5 text-center font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-extrabold text-[#1B1E28] dark:text-white flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-[#5B4BFF] text-[10px] font-black border border-indigo-200/50">
                                {item.course_cd || 'CRS'}
                              </span>
                              <span className="truncate">{item.course_name || 'Academic Course'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-extrabold text-slate-800 dark:text-slate-200">
                              {item.name}
                            </div>
                            <div className="text-[10px] font-semibold text-slate-400">
                              Branch Code: {item.branch_cd || item.code}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">
                            <span className="truncate">{currentCollege?.name || 'Institution'}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isNewlyAdded ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-black border border-amber-200">
                                ⏳ Pending Save
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-black border border-emerald-200">
                                ✓ Saved in DB
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveBranch(item.id)}
                              className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all cursor-pointer font-bold text-xs"
                              title="Remove branch from HOD scope"
                            >
                              ✕ Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Footer Save Bar */}
            {isDirty && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <span>⚠️</span>
                  <span>
                    You have modified {currentHod?.name}'s branch scope ({stagedBranches.length} total branches). Click Save to commit changes to database.
                  </span>
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveScope}
                  className="px-4 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-[#5B4BFF] to-[#7867FF] hover:from-[#4A39EF] hover:to-[#6756EF] disabled:opacity-50 shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  {saving ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      <span>Save Changes Now</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
