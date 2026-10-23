'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  fetchColleges,
  fetchCourses,
  fetchBranches,
  fetchBatches,
  fetchSemesters,
  fetchSubjects,
  fetchFacultyLinkedSubjects,
  getTenantSlug,
  AcademicCollege,
  AcademicCourse,
  AcademicBranch,
  AcademicBatch,
  AcademicSemester,
  AcademicSubject,
  FacultySubjectLink,
} from '@/hooks/useTenantAcademicData';

export interface AcademicSection {
  sec_cd: string;
  sec_name: string;
}

export interface AcademicCascadingState {
  college: AcademicCollege | null;
  course: AcademicCourse | null;
  branch: AcademicBranch | null;
  batch: AcademicBatch | null;
  semester: AcademicSemester | null;
  section?: string | null;
  allSections?: string[];
  subject: AcademicSubject | null;
  allSubjects: AcademicSubject[];
  isLinkedOnly?: boolean;
}

export interface FacultyAcademicCascadingDropdownProps {
  onSelectionChange?: (state: AcademicCascadingState) => void;
  selectedCollegeCd?: string;
  selectedCourseCd?: string;
  selectedBranchCd?: string;
  selectedBatchCd?: string;
  selectedSemCd?: string | number;
  selectedSecCd?: string;
  selectedSubjectCd?: string;
  showSection?: boolean;
  showSubject?: boolean;
  onlyLinkedSubjects?: boolean;
  facultyId?: string;
  className?: string;
  title?: string;
  subtitle?: string;
}

export default function FacultyAcademicCascadingDropdown({
  onSelectionChange,
  selectedCollegeCd,
  selectedCourseCd,
  selectedBranchCd,
  selectedBatchCd,
  selectedSemCd,
  selectedSecCd,
  selectedSubjectCd,
  showSection = true,
  showSubject = true,
  onlyLinkedSubjects = true,
  facultyId,
  className = '',
  title = '🏛️ Faculty Academic Hierarchy Cascading',
  subtitle = 'College → Course → Branch → Batch → Semester → Section → Subject',
}: FacultyAcademicCascadingDropdownProps) {
  const onSelectionChangeRef = useRef(onSelectionChange);
  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  // Master lists from API
  const [colleges, setColleges] = useState<AcademicCollege[]>([]);
  const [courses, setCourses] = useState<AcademicCourse[]>([]);
  const [branches, setBranches] = useState<AcademicBranch[]>([]);
  const [batches, setBatches] = useState<AcademicBatch[]>([]);
  const [semesters, setSemesters] = useState<AcademicSemester[]>([]);
  const [subjects, setSubjects] = useState<AcademicSubject[]>([]);

  // Linked Subjects (from Subject Linker / faculty_subjects)
  const [linkedSubjects, setLinkedSubjects] = useState<FacultySubjectLink[]>([]);
  const [loadingLinked, setLoadingLinked] = useState<boolean>(true);
  const onlyLinked = onlyLinkedSubjects;

  // Selected values
  const [colgCd, setColgCd] = useState<string>(selectedCollegeCd || '');
  const [courseCd, setCourseCd] = useState<string>(selectedCourseCd || '');
  const [branchCd, setBranchCd] = useState<string>(selectedBranchCd || '');
  const [batchCd, setBatchCd] = useState<string>(selectedBatchCd || '');
  const [semCd, setSemCd] = useState<string>(selectedSemCd ? String(selectedSemCd) : '');
  const [secCd, setSecCd] = useState<string>(selectedSecCd || 'all');
  const [subjectCd, setSubjectCd] = useState<string>(selectedSubjectCd || '');

  // Loading flags
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [loadingSemesters, setLoadingSemesters] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const tenantSlug = getTenantSlug() || 'srms-cet-bareilly';

  // 0. Fetch Faculty's Linked Subjects on Mount (Course and Subject Linker concept)
  useEffect(() => {
    let active = true;
    async function loadLinked() {
      setLoadingLinked(true);
      try {
        const links = await fetchFacultyLinkedSubjects(tenantSlug, facultyId);
        if (!active) return;
        if (links && links.length > 0) {
          setLinkedSubjects(links);
          const first = links[0];
          // Pre-seed initial state from first linked assignment if not explicitly provided
          if (!selectedCollegeCd && first.college_code) setColgCd(String(first.college_code));
          if (!selectedCourseCd && first.course_cd) setCourseCd(String(first.course_cd));
          if (!selectedBranchCd && first.branch_cd) setBranchCd(String(first.branch_cd));
          if (!selectedBatchCd && first.batch_cd) setBatchCd(String(first.batch_cd));
          if (!selectedSemCd && first.sem_cd) setSemCd(String(first.sem_cd));
          if (!selectedSubjectCd && first.subject_code) setSubjectCd(String(first.subject_code));
          // Default section to first subject's section or all
          if (!selectedSecCd) {
            setSecCd(first.section ? String(first.section) : 'all');
          }
        }
      } catch (err) {
        console.warn('Failed to load linked faculty subjects:', err);
      } finally {
        if (active) setLoadingLinked(false);
      }
    }
    loadLinked();
    return () => {
      active = false;
    };
  }, [
    tenantSlug,
    facultyId,
    selectedCollegeCd,
    selectedCourseCd,
    selectedBranchCd,
    selectedBatchCd,
    selectedSemCd,
    selectedSecCd,
    selectedSubjectCd,
  ]);

  // 1. Initial Load: Fetch Colleges
  useEffect(() => {
    let active = true;
    async function loadColleges() {
      setLoadingColleges(true);
      try {
        const list = await fetchColleges(tenantSlug);
        if (!active) return;
        setColleges(list);

        let initialColg = selectedCollegeCd || colgCd || '';
        if (!initialColg && typeof window !== 'undefined') {
          initialColg = localStorage.getItem('colg_cd') || localStorage.getItem('colgCd') || '';
        }
        if (!initialColg && list.length > 0) {
          initialColg = list[0].colg_cd;
        }
        setColgCd(initialColg || '1');
      } catch (err) {
        console.warn('Failed to load colleges:', err);
      } finally {
        if (active) setLoadingColleges(false);
      }
    }
    loadColleges();
    return () => {
      active = false;
    };
  }, [tenantSlug, selectedCollegeCd]);

  // 2. Load Courses for College
  useEffect(() => {
    if (!colgCd) return;
    let active = true;
    async function loadCourses() {
      setLoadingCourses(true);
      try {
        const list = await fetchCourses(tenantSlug, colgCd);
        if (!active) return;
        setCourses(list);
      } catch (err) {
        console.warn('Failed to load courses:', err);
      } finally {
        if (active) setLoadingCourses(false);
      }
    }
    loadCourses();
    return () => {
      active = false;
    };
  }, [colgCd, tenantSlug]);

  // 3. Load Branches & Batches for Course
  useEffect(() => {
    if (!colgCd || !courseCd) return;
    let active = true;
    async function loadBranchesAndBatches() {
      setLoadingBranches(true);
      setLoadingBatches(true);
      try {
        const [brList, btList] = await Promise.all([
          fetchBranches(tenantSlug, courseCd, colgCd),
          fetchBatches(tenantSlug, courseCd, colgCd),
        ]);
        if (!active) return;
        setBranches(brList);
        setBatches(btList);
      } catch (err) {
        console.warn('Failed to load branches and batches:', err);
      } finally {
        if (active) {
          setLoadingBranches(false);
          setLoadingBatches(false);
        }
      }
    }
    loadBranchesAndBatches();
    return () => {
      active = false;
    };
  }, [colgCd, courseCd, tenantSlug]);

  // 4. Load Semesters
  useEffect(() => {
    if (!colgCd || !courseCd || !branchCd || !batchCd) return;
    let active = true;
    async function loadSemesters() {
      setLoadingSemesters(true);
      try {
        const list = await fetchSemesters(tenantSlug, colgCd, courseCd, branchCd, batchCd);
        if (!active) return;
        setSemesters(list);
      } catch (err) {
        console.warn('Failed to load semesters:', err);
      } finally {
        if (active) setLoadingSemesters(false);
      }
    }
    loadSemesters();
    return () => {
      active = false;
    };
  }, [colgCd, courseCd, branchCd, batchCd, tenantSlug]);

  // ─── LINKED DATA FILTERING (Course & Subject Linker Concept) ─────────

  // 1. FILTERED COURSES: Only courses linked to this faculty (e.g. B.Tech)
  const visibleCourses = useMemo<AcademicCourse[]>(() => {
    if (!onlyLinked || linkedSubjects.length === 0) return courses;
    const map = new Map<string, AcademicCourse>();
    linkedSubjects.forEach((l) => {
      const code = String(l.course_cd || '').trim();
      if (!code) return;
      if (!map.has(code)) {
        const found = courses.find((c) => c.course_cd === code);
        map.set(code, {
          course_cd: code,
          course_name: l.course_name || found?.course_name || `Course ${code}`,
          colg_cd: String(l.college_code || colgCd || '1'),
        });
      }
    });
    return Array.from(map.values());
  }, [onlyLinked, linkedSubjects, courses, colgCd]);

  // Auto-sync Course if selected course is not in visibleCourses
  useEffect(() => {
    if (visibleCourses.length > 0) {
      if (!courseCd || !visibleCourses.some((c) => c.course_cd === courseCd)) {
        setCourseCd(visibleCourses[0].course_cd);
      }
    }
  }, [visibleCourses, courseCd]);

  // 2. FILTERED BRANCHES: Only branches linked to this faculty for selected course (e.g. CSE)
  const visibleBranches = useMemo<AcademicBranch[]>(() => {
    if (!onlyLinked || linkedSubjects.length === 0) return branches;
    const map = new Map<string, AcademicBranch>();
    linkedSubjects
      .filter((l) => !courseCd || !l.course_cd || String(l.course_cd) === String(courseCd))
      .forEach((l) => {
        const code = String(l.branch_cd || '').trim();
        if (!code) return;
        const found = branches.find((b) => b.branch_cd === code);
        const canonicalName =
          found?.branch_name ||
          (l as any).subject_department_name ||
          (l as any).faculty_department_name ||
          l.branch_name ||
          `Branch ${code}`;

        if (!map.has(code)) {
          map.set(code, {
            branch_cd: code,
            branch_name: canonicalName,
            course_cd: String(l.course_cd || courseCd || '1'),
          });
        } else {
          // If existing name was generic, upgrade to Computer Science / CSE if available
          const existing = map.get(code)!;
          if (
            (canonicalName.toLowerCase().includes('computer') || canonicalName.toLowerCase().includes('cse')) &&
            !existing.branch_name.toLowerCase().includes('computer')
          ) {
            existing.branch_name = canonicalName;
          }
        }
      });
    return Array.from(map.values());
  }, [onlyLinked, linkedSubjects, branches, courseCd]);

  // Auto-sync Branch if selected branch is not in visibleBranches
  useEffect(() => {
    if (visibleBranches.length > 0) {
      if (!branchCd || !visibleBranches.some((b) => b.branch_cd === branchCd)) {
        setBranchCd(visibleBranches[0].branch_cd);
      }
    }
  }, [visibleBranches, branchCd]);

  // 3. FILTERED BATCHES: Only batches linked to this faculty for selected course & branch
  const visibleBatches = useMemo<AcademicBatch[]>(() => {
    if (!onlyLinked || linkedSubjects.length === 0) return batches;
    const map = new Map<string, AcademicBatch>();
    linkedSubjects
      .filter(
        (l) =>
          (!courseCd || !l.course_cd || String(l.course_cd) === String(courseCd)) &&
          (!branchCd || !l.branch_cd || String(l.branch_cd) === String(branchCd))
      )
      .forEach((l) => {
        const code = String(l.batch_cd || '').trim();
        if (!code) return;
        if (!map.has(code)) {
          const found = batches.find((b) => String(b.batch_cd) === code);
          map.set(code, {
            batch_cd: code,
            batch_name: found?.batch_name || `Batch ${code}`,
            course_cd: String(l.course_cd || courseCd || '1'),
            year: found?.year || code,
          });
        }
      });
    return Array.from(map.values());
  }, [onlyLinked, linkedSubjects, batches, courseCd, branchCd]);

  // Auto-sync Batch if selected batch is not in visibleBatches
  useEffect(() => {
    if (visibleBatches.length > 0) {
      if (!batchCd || !visibleBatches.some((b) => String(b.batch_cd) === String(batchCd))) {
        setBatchCd(String(visibleBatches[0].batch_cd));
      }
    }
  }, [visibleBatches, batchCd]);

  // 4. FILTERED SEMESTERS: Only semesters linked to this faculty for selected course, branch & batch
  const visibleSemesters = useMemo<AcademicSemester[]>(() => {
    if (!onlyLinked || linkedSubjects.length === 0) return semesters;
    const map = new Map<string, AcademicSemester>();
    linkedSubjects
      .filter(
        (l) =>
          (!courseCd || !l.course_cd || String(l.course_cd) === String(courseCd)) &&
          (!branchCd || !l.branch_cd || String(l.branch_cd) === String(branchCd)) &&
          (!batchCd || !l.batch_cd || String(l.batch_cd) === String(batchCd))
      )
      .forEach((l) => {
        const code = String(l.sem_cd || '').trim();
        if (!code) return;
        if (!map.has(code)) {
          const found = semesters.find((s) => String(s.sem_cd || s.code) === code);
          const ord = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'][Number(code) - 1] || `${code}th`;
          map.set(code, {
            id: code,
            sem_cd: Number(code) || 1,
            code: code,
            name: found?.name || `${ord} Semester`,
            SemName: found?.SemName || `${ord} Semester`,
          });
        }
      });
    return Array.from(map.values());
  }, [onlyLinked, linkedSubjects, semesters, courseCd, branchCd, batchCd]);

  // Auto-sync Semester if selected semester is not in visibleSemesters
  useEffect(() => {
    if (visibleSemesters.length > 0) {
      if (!semCd || !visibleSemesters.some((s) => String(s.sem_cd || s.code) === String(semCd))) {
        setSemCd(String(visibleSemesters[0].sem_cd || visibleSemesters[0].code));
      }
    }
  }, [visibleSemesters, semCd]);

  // 5. FILTERED SUBJECTS: ALL subjects linked to this faculty for the selected Course, Branch, Batch & Semester!
  // CRITICAL: We do NOT filter subjects by section here so that ALL linked subjects (e.g. DA and MINI PROJECT LAB)
  // are simultaneously displayed and selectable regardless of whether they have different section tags (Sec A vs Sec 1).
  const visibleSubjects = useMemo<AcademicSubject[]>(() => {
    if (!onlyLinked) return subjects;
    if (linkedSubjects.length === 0) return [];

    const map = new Map<string, AcademicSubject>();
    linkedSubjects
      .filter((l) => {
        if (courseCd && l.course_cd && String(l.course_cd) !== String(courseCd)) return false;
        if (branchCd && l.branch_cd && String(l.branch_cd) !== String(branchCd)) return false;
        if (batchCd && l.batch_cd && String(l.batch_cd) !== String(batchCd)) return false;
        if (semCd && l.sem_cd && String(l.sem_cd) !== String(semCd)) return false;
        return true;
      })
      .forEach((l) => {
        const code = String(l.subject_code || l.subject_id || '').trim();
        if (!code) return;
        const key = code.toLowerCase();
        if (!map.has(key)) {
          const name = l.subject_name || code;
          map.set(key, {
            id: l.subject_id || code,
            code: l.subject_code || code,
            name: `[${code}] ${name}`,
            sub_cd: l.subject_code || code,
            sub_name: name,
            mst_sub_name: name,
            course_cd: l.course_cd,
            branch_cd: l.branch_cd,
            batch_cd: l.batch_cd,
            sem_cd: l.sem_cd,
            sub_addinfo: l.section ? `Sec: ${l.section}` : undefined,
          });
        } else {
          const existing = map.get(key)!;
          if (l.section && !existing.sub_addinfo?.includes(l.section)) {
            existing.sub_addinfo = existing.sub_addinfo
              ? `${existing.sub_addinfo}, ${l.section}`
              : `Sec: ${l.section}`;
          }
        }
      });
    return Array.from(map.values());
  }, [onlyLinked, linkedSubjects, subjects, courseCd, branchCd, batchCd, semCd]);

  // 6. FILTERED SECTIONS: All sections linked to this faculty for the selected Course, Branch, Batch & Semester
  const visibleSections = useMemo<string[]>(() => {
    if (!onlyLinked || linkedSubjects.length === 0) return [];
    const secSet = new Set<string>();

    linkedSubjects
      .filter((l) => {
        if (courseCd && l.course_cd && String(l.course_cd) !== String(courseCd)) return false;
        if (branchCd && l.branch_cd && String(l.branch_cd) !== String(branchCd)) return false;
        if (batchCd && l.batch_cd && String(l.batch_cd) !== String(batchCd)) return false;
        if (semCd && l.sem_cd && String(l.sem_cd) !== String(semCd)) return false;
        return true;
      })
      .forEach((l) => {
        const sec = String(l.section || '').trim();
        if (sec) secSet.add(sec);
      });

    return Array.from(secSet);
  }, [onlyLinked, linkedSubjects, courseCd, branchCd, batchCd, semCd]);

  // Handler for section dropdown change: auto-syncs to a subject belonging to this section
  const handleSectionChange = (newSec: string) => {
    setSecCd(newSec);
    if (newSec !== 'all') {
      const match = linkedSubjects.find((l) => {
        if (courseCd && l.course_cd && String(l.course_cd) !== String(courseCd)) return false;
        if (branchCd && l.branch_cd && String(l.branch_cd) !== String(branchCd)) return false;
        if (batchCd && l.batch_cd && String(l.batch_cd) !== String(batchCd)) return false;
        if (semCd && l.sem_cd && String(l.sem_cd) !== String(semCd)) return false;
        return String(l.section || '').trim().toLowerCase() === newSec.toLowerCase();
      });
      if (match?.subject_code) {
        setSubjectCd(match.subject_code);
      }
    }
  };

  // Handler for subject dropdown change: auto-syncs the section for the chosen subject
  const handleSubjectChange = (val: string) => {
    setSubjectCd(val);
    const targetLink = linkedSubjects.find((l) => {
      if (courseCd && l.course_cd && String(l.course_cd) !== String(courseCd)) return false;
      if (branchCd && l.branch_cd && String(l.branch_cd) !== String(branchCd)) return false;
      if (batchCd && l.batch_cd && String(l.batch_cd) !== String(batchCd)) return false;
      if (semCd && l.sem_cd && String(l.sem_cd) !== String(semCd)) return false;
      return String(l.subject_code) === val || String(l.subject_id) === val;
    });
    if (targetLink?.section) {
      setSecCd(targetLink.section);
    }
  };

  // Auto-sync Subject & notify parent
  useEffect(() => {
    if (loadingLinked) return;

    let nextSub = subjectCd;
    if (visibleSubjects.length > 0) {
      if (!nextSub || !visibleSubjects.some((s) => s.code === nextSub || s.id === nextSub || s.sub_cd === nextSub)) {
        nextSub = visibleSubjects[0].code || visibleSubjects[0].id || '';
        setSubjectCd(nextSub);
      }
    } else {
      nextSub = '';
      setSubjectCd('');
    }

    if (onSelectionChangeRef.current) {
      const colObj = colleges.find((c) => c.colg_cd === colgCd) || null;
      const crsObj = visibleCourses.find((c) => c.course_cd === courseCd) || null;
      const brObj = visibleBranches.find((b) => b.branch_cd === branchCd) || null;
      const batObj = visibleBatches.find((b) => String(b.batch_cd) === String(batchCd)) || null;
      const semObj = visibleSemesters.find((s) => String(s.sem_cd) === String(semCd) || s.code === semCd) || null;
      const subObj = visibleSubjects.find((s) => s.code === nextSub || s.id === nextSub || s.sub_cd === nextSub) || null;

      onSelectionChangeRef.current({
        college: colObj,
        course: crsObj,
        branch: brObj,
        batch: batObj,
        semester: semObj,
        section: secCd !== 'all' ? secCd : null,
        allSections: visibleSections,
        subject: subObj,
        allSubjects: visibleSubjects,
        isLinkedOnly: onlyLinked,
      });
    }
  }, [
    loadingLinked,
    colgCd,
    courseCd,
    branchCd,
    batchCd,
    semCd,
    secCd,
    subjectCd,
    visibleCourses,
    visibleBranches,
    visibleBatches,
    visibleSemesters,
    visibleSections,
    visibleSubjects,
    colleges,
    onlyLinked,
  ]);

  // Active label objects for header badges
  const activeCollegeObj = colleges.find((c) => c.colg_cd === colgCd);
  const activeCourseObj = visibleCourses.find((c) => c.course_cd === courseCd);
  const activeBranchObj = visibleBranches.find((b) => b.branch_cd === branchCd);
  const activeBatchObj = visibleBatches.find((b) => String(b.batch_cd) === String(batchCd));
  const activeSemObj = visibleSemesters.find((s) => String(s.sem_cd) === semCd || s.code === semCd);
  const activeSubjectObj = visibleSubjects.find((s) => s.code === subjectCd || s.id === subjectCd || s.sub_cd === subjectCd);

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-5 sm:p-6 shadow-soft space-y-4 ${className}`}
    >
      {/* Header bar with badges */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-[#5B4BFF] flex items-center gap-2">
            <span>{title}</span>
          </h3>
          <p className="text-[11px] text-[#4E5969] dark:text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        {/* Current Active Badges */}
        <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-extrabold">
          <span className="px-2.5 py-1 rounded-full bg-[#EEF2FF] text-[#5B4BFF] border border-[#5B4BFF]/20">
            {activeCollegeObj?.colg_name || 'College'}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-[#E6F9F3] text-[#00C48C] border border-[#00C48C]/20">
            {activeCourseObj?.course_name || 'Course'}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-[#FFF4EC] text-[#F36C21] border border-[#F36C21]/20">
            {activeBranchObj?.branch_name ? activeBranchObj.branch_name.replace(/Department/i, '').trim() : 'Branch'}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200">
            {activeBatchObj?.batch_name || 'Batch'}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200">
            {activeSemObj?.SemName || activeSemObj?.name || 'Semester'}
          </span>
          {activeSubjectObj && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
              ✓ {activeSubjectObj.code || activeSubjectObj.name}
            </span>
          )}
          {showSection && secCd && secCd !== 'all' && (
            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200">
              Sec: {secCd}
            </span>
          )}
        </div>
      </div>

      {/* Grid of Dropdowns: Row 1 (College, Course, Branch, Batch) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. College */}
        <div>
          <label className="block text-xs font-black uppercase text-[#1B1E28] dark:text-white mb-1.5 flex items-center justify-between">
            <span>1. College *</span>
            {loadingColleges && <span className="text-[10px] font-normal text-[#5B4BFF] animate-pulse">Loading...</span>}
          </label>
          <select
            value={colgCd}
            onChange={(e) => setColgCd(e.target.value)}
            disabled={loadingColleges || colleges.length === 0}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white text-xs font-bold focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-[#5B4BFF]/20 disabled:opacity-50 shadow-sm transition-all"
          >
            {colleges.length === 0 ? (
              <option value="">{loadingColleges ? 'Loading Colleges...' : 'Default College'}</option>
            ) : (
              colleges.map((col) => (
                <option key={col.colg_cd} value={col.colg_cd}>
                  {col.colg_name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* 2. Course (STRICTLY LINKED) */}
        <div>
          <label className="block text-xs font-black uppercase text-[#5B4BFF] dark:text-indigo-400 mb-1.5 flex items-center justify-between">
            <span>2. Course *</span>
            {(loadingCourses || loadingLinked) && (
              <span className="text-[10px] font-normal text-[#5B4BFF] animate-pulse">Loading...</span>
            )}
          </label>
          <select
            value={courseCd}
            onChange={(e) => setCourseCd(e.target.value)}
            disabled={loadingCourses || loadingLinked || visibleCourses.length === 0}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#5B4BFF]/40 text-[#1B1E28] dark:text-white text-xs font-bold focus:outline-none focus:border-[#F36C21] focus:ring-2 focus:ring-[#F36C21]/20 disabled:opacity-50 shadow-sm transition-all"
          >
            {visibleCourses.length === 0 ? (
              <option value="">
                {loadingCourses || loadingLinked ? 'Loading Linked Courses...' : 'No Linked Courses'}
              </option>
            ) : (
              visibleCourses.map((crs) => (
                <option key={crs.course_cd} value={crs.course_cd}>
                  {crs.course_name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* 3. Branch / Department (STRICTLY LINKED) */}
        <div>
          <label className="block text-xs font-black uppercase text-[#F36C21] dark:text-orange-400 mb-1.5 flex items-center justify-between">
            <span>3. Branch / Dept *</span>
            {(loadingBranches || loadingLinked) && (
              <span className="text-[10px] font-normal text-[#F36C21] animate-pulse">Loading...</span>
            )}
          </label>
          <select
            value={branchCd}
            onChange={(e) => setBranchCd(e.target.value)}
            disabled={loadingBranches || loadingLinked || visibleBranches.length === 0}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#F36C21]/40 text-[#1B1E28] dark:text-white text-xs font-bold focus:outline-none focus:border-[#F36C21] focus:ring-2 focus:ring-[#F36C21]/20 disabled:opacity-50 shadow-sm transition-all"
          >
            {visibleBranches.length === 0 ? (
              <option value="">
                {loadingBranches || loadingLinked ? 'Loading Linked Branches...' : 'No Linked Branches'}
              </option>
            ) : (
              visibleBranches.map((b) => (
                <option key={b.branch_cd} value={b.branch_cd}>
                  {b.branch_name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* 4. Batch (STRICTLY LINKED) */}
        <div>
          <label className="block text-xs font-black uppercase text-purple-600 dark:text-purple-400 mb-1.5 flex items-center justify-between">
            <span>4. Batch *</span>
            {(loadingBatches || loadingLinked) && (
              <span className="text-[10px] font-normal text-purple-600 animate-pulse">Loading...</span>
            )}
          </label>
          <select
            value={batchCd}
            onChange={(e) => setBatchCd(e.target.value)}
            disabled={loadingBatches || loadingLinked || visibleBatches.length === 0}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800 text-[#1B1E28] dark:text-white text-xs font-bold focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-[#5B4BFF]/20 disabled:opacity-50 shadow-sm transition-all"
          >
            {visibleBatches.length === 0 ? (
              <option value="">
                {loadingBatches || loadingLinked ? 'Loading Linked Batches...' : 'No Linked Batches'}
              </option>
            ) : (
              visibleBatches.map((bt) => (
                <option key={String(bt.batch_cd)} value={String(bt.batch_cd)}>
                  {bt.batch_name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Grid of Dropdowns: Row 2 (5. Semester, 6. Section, 7. Subjects Linked) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
        {/* 5. Semester (STRICTLY LINKED) */}
        <div>
          <label className="block text-xs font-black uppercase text-blue-600 dark:text-blue-400 mb-1.5 flex items-center justify-between">
            <span>5. Semester *</span>
            {(loadingSemesters || loadingLinked) && (
              <span className="text-[10px] font-normal text-blue-600 animate-pulse">Loading...</span>
            )}
          </label>
          <select
            value={semCd}
            onChange={(e) => setSemCd(e.target.value)}
            disabled={loadingSemesters || loadingLinked || visibleSemesters.length === 0}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 text-[#1B1E28] dark:text-white text-xs font-bold focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-[#5B4BFF]/20 disabled:opacity-50 shadow-sm transition-all"
          >
            {visibleSemesters.length === 0 ? (
              <option value="">
                {loadingSemesters || loadingLinked ? 'Loading Linked Semesters...' : 'No Linked Semesters'}
              </option>
            ) : (
              visibleSemesters.map((s) => (
                <option key={String(s.sem_cd || s.code)} value={String(s.sem_cd || s.code)}>
                  {s.SemName || s.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* 6. Section (SECTION & SECTION-BASED FETCH) */}
        {showSection && (
          <div>
            <label className="block text-xs font-black uppercase text-amber-600 dark:text-amber-400 mb-1.5 flex items-center justify-between">
              <span>6. Section *</span>
              {loadingLinked && <span className="text-[10px] font-normal text-amber-600 animate-pulse">Loading...</span>}
            </label>
            <select
              value={secCd}
              onChange={(e) => handleSectionChange(e.target.value)}
              disabled={loadingLinked || visibleSections.length === 0}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 text-[#1B1E28] dark:text-white text-xs font-bold focus:outline-none focus:border-[#F36C21] focus:ring-2 focus:ring-[#F36C21]/20 disabled:opacity-50 shadow-sm transition-all"
            >
              {visibleSections.length > 1 && (
                <option value="all">All Linked Sections ({visibleSections.length})</option>
              )}
              {visibleSections.length === 0 ? (
                <option value="all">Default Section</option>
              ) : (
                visibleSections.map((sec) => (
                  <option key={sec} value={sec}>
                    Section: {sec}
                  </option>
                ))
              )}
            </select>
          </div>
        )}

        {/* 7. Subjects Linked (STRICTLY LINKED & BIDIRECTIONALLY SYNCHRONIZED) */}
        {showSubject && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-black uppercase text-[#00C48C] dark:text-emerald-400 flex items-center gap-1.5">
                <span>7. Subjects Linked *</span>
                {loadingLinked && (
                  <span className="text-[10px] font-normal text-[#00C48C] animate-pulse">Loading...</span>
                )}
              </label>

              {/* Linked-Only Badge */}
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black border bg-[#E6F9F3] text-[#00C48C] border-[#00C48C]/30 flex items-center gap-1">
                  <span>✓</span>
                  <span>Linked ({visibleSubjects.length})</span>
                </span>
              </div>
            </div>

            <select
              value={subjectCd}
              onChange={(e) => handleSubjectChange(e.target.value)}
              disabled={loadingLinked || visibleSubjects.length === 0}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#00C48C]/40 text-[#1B1E28] dark:text-emerald-300 font-bold text-xs focus:outline-none focus:border-[#F36C21] focus:ring-2 focus:ring-[#F36C21]/20 disabled:opacity-50 shadow-sm transition-all"
            >
              {visibleSubjects.length === 0 ? (
                <option value="">
                  {loadingLinked
                    ? 'Loading Linked Subjects...'
                    : linkedSubjects.length > 0
                    ? `No linked subjects for Sem ${semCd}`
                    : 'No linked subjects assigned'}
                </option>
              ) : (
                visibleSubjects.map((sub) => (
                  <option key={sub.code || sub.id} value={sub.code || sub.id}>
                    {sub.sub_addinfo ? `${sub.name} (${sub.sub_addinfo})` : sub.name}
                  </option>
                ))
              )}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
