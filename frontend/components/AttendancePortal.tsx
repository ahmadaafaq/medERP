'use client';

import { useState, useEffect, useMemo } from 'react';
import FacultyAcademicCascadingDropdown, {
  AcademicCascadingState,
} from '@/components/faculty/FacultyAcademicCascadingDropdown';
import {
  getTenantSlug,
  isSrmsTenant,
  fetchColleges,
  fetchCourses,
  fetchBranches,
  fetchBatches,
} from '@/hooks/useTenantAcademicData';

interface SubjectSummary {
  sub_cd: string;
  sub_name: string;
  stud_reg_no: string;
  stud_name: string;
  TotalLectures: number;
  PresentCount: number;
  AbsentCount: number;
  AttendancePercentage: number;
}

interface MatrixStudent {
  s_no: number;
  college: string;
  rollno: string;
  registration_no: string;
  name: string;
  photo_url?: string | null;
  course: string;
  batch: string;
  semester: string;
  section?: string;
  TotalPresentPercentage: string;
  attendance: Record<
    string,
    { sub_cd?: string; present: number; total: number; percentage: number; raw?: string } | null
  >;
}

interface DropdownItem {
  id: string;
  code: string;
  name: string;
}

interface LectureDetail {
  sub_cd: string;
  sub_name: string;
  lecturedt: string;
  starttm: string;
  endtm: string;
  stud_reg_no: string;
  stud_name: string;
  IsPresent: string | boolean;
}

interface ActiveDrilldown {
  sub_cd: string;
  sub_name: string;
  student_name: string;
  student_reg: string;
  student_roll?: string;
}

const subjectHeaderColors = [
  'bg-[#00C48C] text-white',
  'bg-[#0284C7] text-white',
  'bg-[#0D9488] text-white',
  'bg-[#6366F1] text-white',
  'bg-[#8B5CF6] text-white',
  'bg-[#EC4899] text-white',
  'bg-[#F59E0B] text-white',
  'bg-[#3B82F6] text-white',
  'bg-[#10B981] text-white',
  'bg-[#7C3AED] text-white',
];

const CET_COURSE_BRANCHES: Record<string, DropdownItem[]> = {
  '1': [
    { id: '1', code: '1', name: '(CSE)' },
    { id: '2', code: '2', name: '(IT)' },
    { id: '3', code: '3', name: '(ME)' },
    { id: '4', code: '4', name: 'CSE(DATA SCIENCE)' },
    { id: '5', code: '5', name: '(ECE)' },
    { id: '6', code: '6', name: 'B.TECH.' },
    { id: '7', code: '7', name: '(EN)' },
    { id: '8', code: '8', name: 'CSE(AI & ML)' },
  ],
  '2': [{ id: '1', code: '1', name: 'B.PHARM. Department' }],
  '3': [{ id: '1', code: '1', name: 'MCA Department' }],
  '4': [{ id: '1', code: '1', name: 'MBA Department' }],
  '5': [
    { id: '1', code: '1', name: 'CAD/CAM' },
    { id: '2', code: '2', name: 'SOFTWARE ENGG' },
    { id: '3', code: '3', name: 'MICROWAVE ENGG' },
    { id: '4', code: '4', name: 'ELECTRIC DRIVES' },
    { id: '5', code: '5', name: 'COMPUTER SCIENCE & ENGINEERING' },
    { id: '6', code: '6', name: 'ELECTRONICS & COMMUNICATION ENGINEERING' },
    { id: '7', code: '7', name: 'ELECTRICAL ENGINEERING' },
  ],
  '6': [{ id: '1', code: '1', name: 'PHARMACEUTICS' }],
  '7': [
    { id: '1', code: '1', name: '(CS)' },
    { id: '2', code: '2', name: '(IT)' },
    { id: '3', code: '3', name: '(ME)' },
    { id: '4', code: '4', name: '(EE)' },
    { id: '5', code: '5', name: '(EC)' },
    { id: '6', code: '6', name: '(EL)' },
    { id: '7', code: '7', name: '(EN)' },
  ],
  '8': [{ id: '1', code: '1', name: 'B.Pharma (Lateral Entry) Department' }],
  '9': [{ id: '1', code: '1', name: 'MCA (Lateral Entry) Department' }],
  '11': [{ id: '1', code: '1', name: 'BA.LL.B Department' }],
  '12': [{ id: '1', code: '1', name: 'BBA Department' }],
  '13': [{ id: '1', code: '1', name: 'BCA Department' }],
};

export default function AttendancePortal({ role = 'STUDENT' }: { role?: string }) {
  // Cascading Academic States
  const [collegesList, setCollegesList] = useState<DropdownItem[]>([]);
  const [coursesList, setCoursesList] = useState<DropdownItem[]>([]);
  const [branchesList, setBranchesList] = useState<DropdownItem[]>([]);
  const [batchesList, setBatchesList] = useState<DropdownItem[]>([]);

  // User Auth & Tenant Context State
  const [userRole, setUserRole] = useState<string>(role || 'STUDENT');
  const [userColgCd, setUserColgCd] = useState<string>('1');
  const [userTenantSlug, setUserTenantSlug] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const slug = getTenantSlug();
      if (slug) return slug;
    }
    return 'team-university';
  });

  const [selectedCollege, setSelectedCollege] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = JSON.parse(localStorage.getItem('user') || '{}');
        const p = cached?.profile || cached || {};
        return String(p.colg_cd || cached?.colgcd || '1');
      } catch {}
    }
    return '1';
  });
  const [selectedCourse, setSelectedCourse] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = JSON.parse(localStorage.getItem('user') || '{}');
        const p = cached?.profile || cached || {};
        return String(p.course_cd || cached?.courseCd || cached?.course_cd || '1');
      } catch {}
    }
    return '1';
  });
  const [selectedBranch, setSelectedBranch] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = JSON.parse(localStorage.getItem('user') || '{}');
        const p = cached?.profile || cached || {};
        return String(p.branch_cd || cached?.branchCd || cached?.branch_cd || '1');
      } catch {}
    }
    return '1';
  });
  const [selectedBatch, setSelectedBatch] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = JSON.parse(localStorage.getItem('user') || '{}');
        const p = cached?.profile || cached || {};
        return String(p.batch_cd || cached?.batchCd || cached?.batch_cd || '16');
      } catch {}
    }
    return '16';
  });
  const [selectedSem, setSelectedSem] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = JSON.parse(localStorage.getItem('user') || '{}');
        const p = cached?.profile || cached || {};
        return String(p.semester || p.current_semester || cached?.semester || '3');
      } catch {}
    }
    return '3';
  });
  const [selectedSection, setSelectedSection] = useState('1'); // Default auto-selected Section 1 (Section A)

  // Date Range States: default from start of semester through current month end
  const [fromDate, setFromDate] = useState('2026-07-01');
  const [toDate, setToDate] = useState(() => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const lastDay = new Date(year, month, 0).getDate();
      return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    } catch {
      return '2026-09-30';
    }
  });
  const [syncingLive, setSyncingLive] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // View Mode: 'MATRIX' (Section Grid) vs 'STUDENT' (Single Student Card Breakdown)
  const isStudentRole = role === 'STUDENT' || role?.toUpperCase() === 'STUDENT';
  const [viewMode, setViewMode] = useState<'MATRIX' | 'STUDENT'>(isStudentRole ? 'STUDENT' : 'MATRIX');

  // Matrix Data States
  const [matrixSubjects, setMatrixSubjects] = useState<{ sub_cd: string; sub_name: string }[]>([]);
  const [matrixStudents, setMatrixStudents] = useState<MatrixStudent[]>([]);
  const [matrixSearchQuery, setMatrixSearchQuery] = useState('');
  const [loadingMatrix, setLoadingMatrix] = useState(false);

  // Cascading Academic Linker & Role Scoping States
  const [cascadeState, setCascadeState] = useState<AcademicCascadingState | null>(null);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [hodFacultyId, setHodFacultyId] = useState<string>('ALL');
  const [departmentFacultyList, setDepartmentFacultyList] = useState<{ id: string; name: string; emp_id?: string }[]>([]);

  // Dynamic Role Scoping (Faculty vs HOD vs Admin)
  const storedRole = typeof window !== 'undefined' ? (localStorage.getItem('role') || '').toUpperCase() : '';
  const effectiveRole = (role || storedRole || 'STUDENT').toUpperCase();
  const isHodUser =
    effectiveRole === 'HOD' ||
    effectiveRole.includes('HOD') ||
    (typeof window !== 'undefined' && (
      (localStorage.getItem('designation') || '').toUpperCase().includes('HOD') ||
      (localStorage.getItem('assigned_roles') || '').toUpperCase().includes('HOD')
    ));
  const isAdminUser =
    effectiveRole === 'ADMIN' ||
    effectiveRole === 'SUPER_ADMIN' ||
    effectiveRole === 'TENANT_ADMIN' ||
    role === 'ADMIN' ||
    role === 'SUPER_ADMIN';
  const isFacultyUser = !isAdminUser && !isStudentRole && (effectiveRole === 'FACULTY' || !isHodUser);
  const isSrms = isSrmsTenant(userTenantSlug);

  // Pagination & Quick Filter States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DEFAULTER' | 'GOOD'>('ALL');

  // Student Specific State
  const [selectedStudentUid, setSelectedStudentUid] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = JSON.parse(localStorage.getItem('user') || '{}');
        const p = cached?.profile || cached || {};
        return String(p.registration_no || cached?.registrationNo || cached?.registration_no || p.reg_no || '');
      } catch {}
    }
    return '';
  });
  const [selectedStudentName, setSelectedStudentName] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = JSON.parse(localStorage.getItem('user') || '{}');
        const p = cached?.profile || cached || {};
        return String(cached?.name || p.name || cached?.student_name || '');
      } catch {}
    }
    return '';
  });
  const [selectedStudentRoll, setSelectedStudentRoll] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = JSON.parse(localStorage.getItem('user') || '{}');
        const p = cached?.profile || cached || {};
        return String(p.rollno || cached?.rollno || '');
      } catch {}
    }
    return '';
  });
  const [summaryData, setSummaryData] = useState<SubjectSummary[]>([]);
  const [studentTotalPct, setStudentTotalPct] = useState('0.00%');
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Drilldown Modal State
  const [activeDrilldown, setActiveDrilldown] = useState<ActiveDrilldown | null>(null);
  const [lectureDetails, setLectureDetails] = useState<LectureDetail[]>([]);
  const [loadingLectures, setLoadingLectures] = useState(false);

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlertMessage({ type, text });
    setTimeout(() => setAlertMessage(null), 5000);
  };

  // Initial Metadata & Logged-In Student Profile
  useEffect(() => {
    fetchAcademicMetadata();
    fetchLoggedInStudentProfile();
  }, [role, isStudentRole]);

  const fetchLoggedInStudentProfile = async () => {
    try {
      let cachedReg = '';
      let cachedName = '';
      let cachedRoll = '';
      let cachedCourseCd = '';
      let cachedBatchCd = '';
      let cachedBranchCd = '';
      let cachedSemCd = '';
      let cachedColgCd = '';

      if (typeof window !== 'undefined') {
        const cachedUserStr = localStorage.getItem('user');
        if (cachedUserStr) {
          const cached = JSON.parse(cachedUserStr);
          const p = cached?.profile || cached || {};
          cachedReg =
            p.registration_no ||
            cached?.registrationNo ||
            cached?.registration_no ||
            p.reg_no ||
            p.rollno ||
            cached?.rollno ||
            '';
          cachedName = cached?.name || p.name || cached?.student_name || '';
          cachedRoll = p.rollno || cached?.rollno || '';
          cachedCourseCd = p.course_cd || cached?.courseCd || cached?.course_cd || '';
          cachedBatchCd = p.batch_cd || cached?.batchCd || cached?.batch_cd || '';
          cachedBranchCd = p.branch_cd || cached?.branchCd || cached?.branch_cd || '';
          cachedSemCd = p.semester || p.current_semester || cached?.semester || '';
          cachedColgCd = p.colg_cd || cached?.colgcd || '';
        }
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const tenant =
        typeof window !== 'undefined'
          ? localStorage.getItem('tenantSlug') || 'srms-cet-bareilly'
          : 'srms-cet-bareilly';

      if (token) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-tenant-slug': tenant,
          },
        }).catch(() => null);

        if (res && res.ok) {
          const json = await res.json();
          const meData = json.data || json;
          const p = meData.profile || meData;
          const reg =
            p.registration_no ||
            meData.registrationNo ||
            meData.registration_no ||
            p.rollno ||
            meData.rollno ||
            cachedReg;
          const name = meData.name || p.name || meData.student_name || cachedName;
          const roll = p.rollno || meData.rollno || cachedRoll;

          if (reg) setSelectedStudentUid(reg);
          if (name) setSelectedStudentName(name);
          if (roll) setSelectedStudentRoll(roll);

          // Dynamically scope student's department, course, and batch
          const courseCode = p.course_cd || meData.course_cd || meData.courseCd || cachedCourseCd;
          const batchCode = p.batch_cd || meData.batch_cd || meData.batchCd || cachedBatchCd;
          const branchCode = p.branch_cd || meData.branch_cd || meData.branchCd || cachedBranchCd;
          const semCode = p.semester || p.current_semester || meData.semester || cachedSemCd;
          const colgCode = p.colg_cd || meData.colg_cd || meData.colgcd || cachedColgCd;

          if (courseCode) setSelectedCourse(String(courseCode));
          if (batchCode) setSelectedBatch(String(batchCode));
          if (branchCode) setSelectedBranch(String(branchCode));
          if (semCode) setSelectedSem(String(semCode));
          if (colgCode) setSelectedCollege(String(colgCode));
          return;
        }
      }

      if (cachedReg) setSelectedStudentUid(cachedReg);
      if (cachedName) setSelectedStudentName(cachedName);
      if (cachedRoll) setSelectedStudentRoll(cachedRoll);
      if (cachedCourseCd) setSelectedCourse(String(cachedCourseCd));
      if (cachedBatchCd) setSelectedBatch(String(cachedBatchCd));
      if (cachedBranchCd) setSelectedBranch(String(cachedBranchCd));
      if (cachedSemCd) setSelectedSem(String(cachedSemCd));
      if (cachedColgCd) setSelectedCollege(String(cachedColgCd));
    } catch (err) {
      console.warn('Failed to resolve logged in student profile:', err);
    }
  };

  useEffect(() => {
    if (selectedCollege && selectedCourse) {
      fetchBranchesAndBatches(selectedCollege, selectedCourse);
    }
  }, [selectedCollege, selectedCourse]);

  // Load Attendance data whenever filters, dates, or selection change
  useEffect(() => {
    fetchLiveAttendanceMatrix();
    setCurrentPage(1);
  }, [selectedCollege, selectedCourse, selectedBranch, selectedBatch, selectedSem, selectedSection, fromDate, toDate]);

  useEffect(() => {
    if (selectedStudentUid || matrixStudents.length > 0) {
      deriveStudentSummary();
    }
  }, [selectedStudentUid, matrixStudents, matrixSubjects]);

  const handleCollegeChange = async (colgCode: string) => {
    setSelectedCollege(colgCode);
    const slug = userTenantSlug || getTenantSlug();
    try {
      let mapped: DropdownItem[] = [];
      if (isSrmsTenant(slug)) {
        const res = await fetch(`/api/srms/courses?colgcd=${colgCode}&tenant=${slug}`);
        if (res.ok) {
          const j = await res.json();
          const list = Array.isArray(j) ? j : j.data || [];
          mapped = list.map((c: any) => ({
            id: String(c.course_cd || c.code || '13'),
            code: String(c.course_cd || c.code || '13'),
            name: c.course_name || c.name || `Course ${c.course_cd || 13}`,
          }));
        }
      } else {
        const crsList = await fetchCourses(slug, colgCode);
        mapped = crsList.map((c) => ({
          id: String(c.course_cd),
          code: String(c.course_cd),
          name: c.course_name,
        }));
      }

      setCoursesList(mapped);
      if (mapped.length > 0) {
        const firstCourse = mapped[0].code;
        setSelectedCourse(firstCourse);
        fetchBranchesAndBatches(colgCode, firstCourse, mapped, slug);
      }
    } catch (e) {
      console.warn('Error changing college:', e);
    }
  };

  const handleCourseChange = async (courseCode: string) => {
    setSelectedCourse(courseCode);
    const slug = userTenantSlug || getTenantSlug();
    if (isSrmsTenant(slug)) {
      const instantBranches = CET_COURSE_BRANCHES[courseCode];
      if (instantBranches && instantBranches.length > 0) {
        setBranchesList(instantBranches);
        setSelectedBranch(instantBranches[0].code);
      }
    }
    await fetchBranchesAndBatches(selectedCollege, courseCode, coursesList, slug);
  };

  const fetchAcademicMetadata = async () => {
    try {
      let roleVal = role || 'STUDENT';
      const userSlug = getTenantSlug();
      const isSrms = isSrmsTenant(userSlug);
      let userColg = typeof window !== 'undefined'
        ? localStorage.getItem('colg_cd') || localStorage.getItem('colgCd') || (isSrms ? '1' : userSlug)
        : (isSrms ? '1' : userSlug);

      if (typeof window !== 'undefined') {
        roleVal = (localStorage.getItem('role') || localStorage.getItem('auth_role') || role || 'STUDENT').toUpperCase();
        setUserRole(roleVal);
        setUserColgCd(userColg);
        setUserTenantSlug(userSlug);
      }

      let loadedColleges: DropdownItem[] = [];
      let mappedCourses: DropdownItem[] = [];

      if (isSrms) {
        const [colgRes, crsRes] = await Promise.all([
          fetch('/api/srms/colleges').catch(() => null),
          fetch(`/api/srms/courses?colgcd=${userColg}&tenant=${userSlug}`).catch(() => null),
        ]);

        if (colgRes && colgRes.ok) {
          const j = await colgRes.json();
          const list = Array.isArray(j) ? j : j.data || [];
          loadedColleges = list.map((c: any) => ({
            id: String(c.colg_cd || c.code || '1'),
            code: String(c.colg_cd || c.code || '1'),
            name: c.colg_name || c.name || `College ${c.colg_cd || 1}`,
          }));
        }

        if (crsRes && crsRes.ok) {
          const j = await crsRes.json();
          const list = Array.isArray(j) ? j : j.data || [];
          mappedCourses = list.map((c: any) => ({
            id: String(c.course_cd || c.code || '1'),
            code: String(c.course_cd || c.code || '1'),
            name: c.course_name || c.name || `Course ${c.course_cd || 1}`,
          }));
        }
      } else {
        const [colgs, crss] = await Promise.all([
          fetchColleges(userSlug),
          fetchCourses(userSlug, userColg),
        ]);
        loadedColleges = colgs.map((c) => ({
          id: c.colg_cd,
          code: c.colg_cd,
          name: c.colg_name || (c as any).name || 'College',
        }));
        mappedCourses = crss.map((c) => ({
          id: String(c.course_cd),
          code: String(c.course_cd),
          name: c.course_name,
        }));
      }

      if (loadedColleges.length > 0) {
        setCollegesList(loadedColleges);
        const myCol = loadedColleges.find((c) => c.code === userColg || c.id === userColg) || loadedColleges[0];
        setSelectedCollege(myCol.code);
      } else {
        const storedColgName =
          typeof window !== 'undefined'
            ? localStorage.getItem('college_name') ||
              localStorage.getItem('tenantName') ||
              localStorage.getItem('collegeName') ||
              'Institution'
            : 'Institution';
        const defaultCol = [{ id: userColg, code: userColg, name: storedColgName }];
        setCollegesList(defaultCol);
        setSelectedCollege(userColg);
      }

      setCoursesList(mappedCourses);
      const crsToUse = selectedCourse || (mappedCourses[0] ? mappedCourses[0].code : '');
      if (crsToUse) {
        fetchBranchesAndBatches(userColg, crsToUse, mappedCourses, userSlug);
      }
    } catch (err) {
      console.warn('Failed to fetch academic metadata:', err);
    }
  };

  const fetchBranchesAndBatches = async (
    colg: string,
    crs: string,
    customCourses?: DropdownItem[],
    customSlug?: string
  ) => {
    const slug = customSlug || userTenantSlug || getTenantSlug();
    const isSrms = isSrmsTenant(slug);
    const effectiveColg = colg || selectedCollege || (isSrms ? '1' : '');
    const effectiveCrs = crs || selectedCourse || '';
    const activeCourses = (customCourses && customCourses.length > 0) ? customCourses : coursesList;

    try {
      if (isSrms) {
        const [brRes, btRes] = await Promise.all([
          fetch(`/api/srms/branches?colgcd=${effectiveColg}&coursecd=${effectiveCrs}&tenant=${slug}`).catch(() => null),
          fetch(`/api/srms/batches?colgcd=${effectiveColg}&coursecd=${effectiveCrs}&tenant=${slug}`).catch(() => null),
        ]);

        const courseObj = activeCourses.find(
          (c) => String(c.code) === String(effectiveCrs) || String(c.id) === String(effectiveCrs)
        );
        const defaultCourseName = effectiveCrs === '1' ? 'B.TECH.' : effectiveCrs === '4' ? 'MBA' : effectiveCrs === '13' ? 'BCA' : effectiveCrs === '3' ? 'MCA' : 'Department';
        const courseName = (courseObj?.name || defaultCourseName)
          .replace(/^\[#\d+\]\s*/, '')
          .trim();

        const fallbackBranches = CET_COURSE_BRANCHES[effectiveCrs] || [
          { id: '1', code: '1', name: `${courseName} Department` }
        ];

        if (brRes && brRes.ok) {
          const j = await brRes.json();
          const list = Array.isArray(j) ? j : j.data || [];

          const mapped: DropdownItem[] = (Array.isArray(list) && list.length > 0 ? list : fallbackBranches).map((b: any) => {
            const rawName = (b.branch_name || b.name || '').trim();
            const validName =
              rawName && rawName !== '-' && rawName !== 'null' && rawName !== 'NONE' && !rawName.toLowerCase().includes('general')
                ? rawName
                : (CET_COURSE_BRANCHES[effectiveCrs]?.[0]?.name || `${courseName} Department`);
            return {
              id: String(b.branch_cd || b.code || '1'),
              code: String(b.branch_cd || b.code || '1'),
              name: validName,
            };
          });

          if (mapped.length > 0) {
            setBranchesList(mapped);
            setSelectedBranch((prev) => {
              const match = mapped.find((b) => String(b.code) === String(prev));
              return match ? match.code : mapped[0].code;
            });
          } else {
            setBranchesList(fallbackBranches);
            setSelectedBranch(fallbackBranches[0].code);
          }
        } else {
          setBranchesList(fallbackBranches);
          setSelectedBranch(fallbackBranches[0].code);
        }

        if (btRes && btRes.ok) {
          const j = await btRes.json();
          const list = Array.isArray(j) ? j : j.data || [];
          const mapped = list.map((b: any) => ({
            id: String(b.batch_cd || b.code || b.batch_id || '2'),
            code: String(b.batch_cd || b.code || b.batch_id || '2'),
            name: String(b.batch_name || b.name || b.year || b.batch_cd || '2025'),
          }));
          if (mapped.length > 0) {
            setBatchesList(mapped);
            setSelectedBatch((prev) => {
              const exists = mapped.some((b: any) => String(b.code) === String(prev));
              return exists ? prev : mapped[0].code;
            });
          }
        }
      } else {
        const [brList, btList] = await Promise.all([
          fetchBranches(slug, effectiveCrs, effectiveColg),
          fetchBatches(slug, effectiveCrs),
        ]);
        const mappedBranches = brList.map((b) => ({ id: b.branch_cd, code: b.branch_cd, name: b.branch_name }));
        const mappedBatches = btList.map((b) => ({ id: String(b.batch_cd), code: String(b.batch_cd), name: b.batch_name }));
        setBranchesList(mappedBranches);
        setBatchesList(mappedBatches);
        if (mappedBranches.length > 0) setSelectedBranch(mappedBranches[0].code);
        if (mappedBatches.length > 0) setSelectedBatch(mappedBatches[0].code);
      }
    } catch (err) {
      console.warn('Failed to fetch branches & batches:', err);
    }
  };

  // Fetch Live Attendance Matrix (Unified for SRMS and non-SRMS tenants via /api/srms/student-attendance)
  const fetchLiveAttendanceMatrix = async (customParams?: {
    college?: string;
    course?: string;
    branch?: string;
    batch?: string;
    sem?: string;
    section?: string;
    subject?: string;
    fdt?: string;
    tdt?: string;
  }) => {
    const slug = userTenantSlug || getTenantSlug();
    try {
      setLoadingMatrix(true);
      const effectiveColg = customParams?.college || selectedCollege || 1;
      const effectiveCourse = customParams?.course || selectedCourse || 1;
      const effectiveBranch = customParams?.branch || selectedBranch || 1;
      const effectiveBatch = customParams?.batch || selectedBatch || 1;
      const effectiveSem = customParams?.sem || selectedSem || 1;
      const effectiveSec = customParams?.section !== undefined ? customParams.section : selectedSection;
      const effectiveSub = customParams?.subject !== undefined ? customParams.subject : selectedSubjectFilter;
      const effectiveFdt = customParams?.fdt || fromDate;
      const effectiveTdt = customParams?.tdt || toDate;

      const payload = {
        colg_cd: effectiveColg,
        course_cd: effectiveCourse,
        branch_cd: effectiveBranch,
        batch_cd: effectiveBatch,
        sem_cd: effectiveSem,
        section_cd: effectiveSec === 'all' ? null : effectiveSec,
        subject_cd: effectiveSub === 'all' || !effectiveSub ? null : effectiveSub,
        fdt: effectiveFdt,
        tdt: effectiveTdt,
        tenantSlug: slug,
      };

      const res = await fetch('/api/srms/student-attendance', {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': slug,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const subList: { sub_cd: string; sub_name: string }[] = json.subjectList || [];

          setMatrixSubjects(subList);

          const studentsList: MatrixStudent[] = json.data.map((stud: any, idx: number) => {
            const attRecord: Record<string, any> = {};
            subList.forEach((sub) => {
              const val = stud[sub.sub_name];
              const subCd = stud[`sub_cd_${sub.sub_name}`] || sub.sub_cd;

              if (val && typeof val === 'string') {
                const match = val.match(/(\d+)\/(\d+)\s*\(([\d.]+)%\)/);
                if (match) {
                  attRecord[sub.sub_name] = {
                    sub_cd: subCd,
                    present: parseInt(match[1], 10),
                    total: parseInt(match[2], 10),
                    percentage: parseFloat(match[3]),
                    raw: val,
                  };
                } else {
                  attRecord[sub.sub_name] = { sub_cd: subCd, present: 0, total: 0, percentage: 0, raw: val };
                }
              } else {
                attRecord[sub.sub_name] = null;
              }
            });

            return {
              s_no: idx + 1,
              college: stud.colg_name || (typeof window !== 'undefined' ? (localStorage.getItem('college_name') || localStorage.getItem('tenantName')) : '') || 'Institution',
              rollno: stud.stud_roll_no || stud.stud_reg_no,
              registration_no: stud.stud_reg_no,
              name: stud.stud_name,
              photo_url: stud.photo_url || null,
              course: stud.course_name || (coursesList.find((c) => c.code === selectedCourse)?.name) || 'Course',
              batch: stud.batch_name ? (stud.batch_name.startsWith('Batch') ? stud.batch_name : `Batch ${stud.batch_name}`) : 'Batch',
              semester: String(selectedSem),
              section: (() => {
                const code = Number(stud.sec_cd || stud.section_cd);
                if (code === 1) return 'A (1)';
                if (code === 2) return 'B (2)';
                if (code === 3) return 'C (3)';
                if (code === 4) return 'D (4)';
                return stud.sec_cd ? `Sec ${stud.sec_cd}` : 'A (1)';
              })(),
              TotalPresentPercentage: stud.TotalPresentPercentage || '0.00%',
              attendance: attRecord,
            };
          });

          setMatrixStudents(studentsList);
          if (isStudentRole) {
            const target = String(selectedStudentUid || '').trim().toLowerCase();
            const targetName = String(selectedStudentName || '').trim().toLowerCase();
            const matched = studentsList.find(
              (s) =>
                (target && String(s.registration_no).trim().toLowerCase() === target) ||
                (target && String(s.rollno).trim().toLowerCase() === target) ||
                (targetName && s.name.toLowerCase().includes(targetName))
            );
            if (matched) {
              setSelectedStudentUid(matched.registration_no);
              setSelectedStudentName(matched.name);
              setSelectedStudentRoll(matched.rollno);
            }
          } else if (studentsList.length > 0 && !selectedStudentUid) {
            setSelectedStudentUid(studentsList[0].registration_no);
            setSelectedStudentName(studentsList[0].name);
            setSelectedStudentRoll(studentsList[0].rollno);
          }
          return studentsList;
        }
      }
      setMatrixStudents([]);
      setMatrixSubjects([]);
    } catch (err) {
      console.warn('Failed to fetch attendance matrix:', err);
      setMatrixStudents([]);
    } finally {
      setLoadingMatrix(false);
    }
  };

  // Derive Single Student Summary from Matrix State
  const deriveStudentSummary = () => {
    if (matrixStudents.length === 0 || matrixSubjects.length === 0) return;
    setLoadingSummary(true);

    const targetUid = String(selectedStudentUid || '').trim().toLowerCase();
    const targetName = String(selectedStudentName || '').trim().toLowerCase();

    const stud =
      matrixStudents.find(
        (s) =>
          (targetUid && String(s.registration_no).trim().toLowerCase() === targetUid) ||
          (targetUid && String(s.rollno).trim().toLowerCase() === targetUid) ||
          (targetName && s.name.toLowerCase() === targetName) ||
          (targetName && s.name.toLowerCase().includes(targetName))
      ) ||
      (isStudentRole ? null : matrixStudents[0]);

    if (stud) {
      if (!isStudentRole) {
        setSelectedStudentName(stud.name);
        setSelectedStudentRoll(stud.rollno);
        setSelectedStudentUid(stud.registration_no);
      }
      setStudentTotalPct(stud.TotalPresentPercentage || '0.00%');

      const summaries: SubjectSummary[] = matrixSubjects.map((sub) => {
        const att = stud.attendance[sub.sub_name];
        return {
          sub_cd: att?.sub_cd || sub.sub_cd,
          sub_name: sub.sub_name,
          stud_reg_no: stud.registration_no,
          stud_name: stud.name,
          TotalLectures: att ? att.total : 0,
          PresentCount: att ? att.present : 0,
          AbsentCount: att ? Math.max(0, att.total - att.present) : 0,
          AttendancePercentage: att ? att.percentage : 0,
        };
      });

      setSummaryData(summaries);
    } else if (isStudentRole) {
      // If student is not in matrix section list, keep subject list cards cleanly rendered with 0/pending
      const summaries: SubjectSummary[] = matrixSubjects.map((sub) => ({
        sub_cd: sub.sub_cd,
        sub_name: sub.sub_name,
        stud_reg_no: selectedStudentUid,
        stud_name: selectedStudentName,
        TotalLectures: 0,
        PresentCount: 0,
        AbsentCount: 0,
        AttendancePercentage: 0,
      }));
      if (summaries.length > 0) {
        setSummaryData(summaries);
      }
    }
    setLoadingSummary(false);
  };

  const handleManualSync = async () => {
    setSyncingLive(true);
    try {
      const list = await fetchLiveAttendanceMatrix();
      const count = Array.isArray(list) ? list.length : 0;
      showAlert('success', `Live attendance synchronized! Loaded ${count} student records from ${fromDate} to ${toDate}.`);
    } catch {
      showAlert('error', 'Failed to synchronize live attendance from SRMS.');
    } finally {
      setSyncingLive(false);
    }
  };

  // Open Drilldown Lecture Modal on Click
  const handleOpenLectureDrilldown = async (
    subCd: string,
    subName: string,
    studName: string,
    studReg: string,
    studRoll?: string
  ) => {
    try {
      setActiveDrilldown({
        sub_cd: subCd,
        sub_name: subName,
        student_name: studName,
        student_reg: studReg,
        student_roll: studRoll,
      });
      setLectureDetails([]);
      setLoadingLectures(true);

      const slug = userTenantSlug || getTenantSlug();
      const res = await fetch('/api/srms/lecture-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': slug,
        },
        body: JSON.stringify({
          ddl_sub: subCd,
          ddl_batch: selectedBatch || '16',
          colgcd: selectedCollege || '1',
          coursecd: selectedCourse || '4',
          ddl_branch: selectedBranch || '1',
          sem_cd: selectedSem || '3',
          section_cd: selectedSection || '1',
          uid: studReg || selectedStudentUid || '',
          tenantSlug: slug,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : [];
        setLectureDetails(list);
      }
    } catch (err) {
      console.warn('Failed to load lecture timeline:', err);
    } finally {
      setLoadingLectures(false);
    }
  };

  // Format Lecture Date cleanly
  const formatLectureDate = (rawDt: string) => {
    if (!rawDt) return '—';
    if (typeof rawDt === 'string' && rawDt.includes('/Date(')) {
      const matches = rawDt.match(/\/Date\((\d+)\)\//);
      if (matches && matches[1]) {
        return new Date(parseInt(matches[1], 10)).toLocaleDateString('en-IN', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      }
    }
    const d = new Date(rawDt);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
    return String(rawDt);
  };

  // Filtered student list for matrix search and status filters
  const filteredMatrixStudents = useMemo(() => {
    let list = matrixStudents;
    if (matrixSearchQuery.trim()) {
      const q = matrixSearchQuery.toLowerCase();
      list = list.filter(
        (st) =>
          st.name.toLowerCase().includes(q) ||
          st.rollno.toLowerCase().includes(q) ||
          st.registration_no.toLowerCase().includes(q) ||
          st.college.toLowerCase().includes(q)
      );
    }

    if (statusFilter === 'DEFAULTER') {
      list = matrixSubjects.length === 0 ? [] : list.filter((st) => parseFloat(st.TotalPresentPercentage || '0') < 75);
    } else if (statusFilter === 'GOOD') {
      list = matrixSubjects.length === 0 ? [] : list.filter((st) => parseFloat(st.TotalPresentPercentage || '0') >= 75);
    }

    return list;
  }, [matrixStudents, matrixSubjects, matrixSearchQuery, statusFilter]);

  // Pagination Computations
  const totalPages = useMemo(() => {
    if (pageSize === -1 || filteredMatrixStudents.length === 0) return 1;
    return Math.ceil(filteredMatrixStudents.length / pageSize) || 1;
  }, [filteredMatrixStudents.length, pageSize]);

  const paginatedStudents = useMemo(() => {
    if (pageSize === -1) return filteredMatrixStudents;
    const start = (currentPage - 1) * pageSize;
    return filteredMatrixStudents.slice(start, start + pageSize);
  }, [filteredMatrixStudents, currentPage, pageSize]);

  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = pageSize === -1 ? filteredMatrixStudents.length : Math.min(currentPage * pageSize, filteredMatrixStudents.length);

  // Quick Counter Metrics
  const summaryMetrics = useMemo(() => {
    const total = matrixStudents.length;
    if (matrixSubjects.length === 0) {
      return { total, defaulters: 0, regular: 0, avgPct: '0.0' };
    }
    const defaulters = matrixStudents.filter((st) => parseFloat(st.TotalPresentPercentage || '0') < 75).length;
    const regular = total - defaulters;
    const avgPct =
      total > 0
        ? (matrixStudents.reduce((acc, st) => acc + (parseFloat(st.TotalPresentPercentage || '0') || 0), 0) / total).toFixed(1)
        : '0.0';
    return { total, defaulters, regular, avgPct };
  }, [matrixStudents, matrixSubjects]);

  // Modal Metrics calculation
  const modalMetrics = useMemo(() => {
    if (!lectureDetails || lectureDetails.length === 0) {
      return { total: 0, present: 0, absent: 0, pct: '0.00%' };
    }
    const total = lectureDetails.length;
    const present = lectureDetails.filter(
      (l) => l.IsPresent === 'Present' || l.IsPresent === true || String(l.IsPresent).toLowerCase() === 'present'
    ).length;
    const absent = total - present;
    const pct = ((present / total) * 100).toFixed(2) + '%';
    return { total, present, absent, pct };
  }, [lectureDetails]);

  // Load Department Faculty List for HOD oversight
  useEffect(() => {
    if (!isHodUser) return;
    let active = true;
    async function loadDeptFaculty() {
      try {
        const slug = userTenantSlug || getTenantSlug();
        const res = await fetch(`/api/srms/timetable-subjects?slug=${slug}&course=all&colgcd=1&branch=1&batch=1&semester=1&section=1`).catch(() => null);
        if (res && res.ok) {
          const json = await res.json();
          const list = Array.isArray(json) ? json : json.data || [];
          const facultyMap = new Map<string, { id: string; name: string; emp_id?: string }>();
          list.forEach((item: any) => {
            const fid = item.faculty_id || item.empid;
            const fname = item.faculty_name || item.EmpName;
            if (fid && fname && !facultyMap.has(String(fid))) {
              facultyMap.set(String(fid), { id: String(fid), name: String(fname), emp_id: String(item.empid || '') });
            }
          });
          if (active && facultyMap.size > 0) {
            setDepartmentFacultyList(Array.from(facultyMap.values()));
          }
        }
      } catch (err) {
        console.warn('Failed to load department faculty for HOD:', err);
      }
    }
    loadDeptFaculty();
    return () => { active = false; };
  }, [isHodUser, userTenantSlug]);

  // Dynamic Course and Subject Linker Cascade Handler (course_subject_link_Faculty.md)
  const handleAcademicCascadeChange = (state: AcademicCascadingState) => {
    setCascadeState(state);
    const colg = state.college?.colg_cd ? String(state.college.colg_cd) : '';
    const crs = state.course?.course_cd ? String(state.course.course_cd) : '';
    const br = state.branch?.branch_cd ? String(state.branch.branch_cd) : '';
    const bat = state.batch?.batch_cd ? String(state.batch.batch_cd) : '';
    const sem = state.semester?.sem_cd ? String(state.semester.sem_cd) : '';
    const sec = state.section !== undefined && state.section !== null ? String(state.section) : 'all';
    const sub = state.subject?.code || state.subject?.sub_cd || '';

    if (colg) setSelectedCollege(colg);
    if (crs) setSelectedCourse(crs);
    if (br) setSelectedBranch(br);
    if (bat) setSelectedBatch(bat);
    if (sem) setSelectedSem(sem);
    setSelectedSection(sec);
    if (sub) setSelectedSubjectFilter(sub);

    // Live Downstream Synchronization: immediately refresh student attendance matrix
    fetchLiveAttendanceMatrix({
      college: colg || undefined,
      course: crs || undefined,
      branch: br || undefined,
      batch: bat || undefined,
      sem: sem || undefined,
      section: sec,
      subject: sub || undefined,
    });
  };

  // Subject Filter Change (Subject Wise or All)
  const handleSubjectFilterChange = (subVal: string) => {
    setSelectedSubjectFilter(subVal);
    fetchLiveAttendanceMatrix({
      subject: subVal === 'all' ? undefined : subVal,
    });
  };

  // Quick Date Preset Helper
  const setQuickDatePreset = (preset: 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'SEMESTER') => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    if (preset === 'TODAY') {
      setFromDate(todayStr);
      setToDate(todayStr);
      fetchLiveAttendanceMatrix({ fdt: todayStr, tdt: todayStr });
    } else if (preset === 'THIS_WEEK') {
      const day = now.getDay();
      const diffToMon = now.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(now.setDate(diffToMon));
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      const fdt = `${mon.getFullYear()}-${pad(mon.getMonth() + 1)}-${pad(mon.getDate())}`;
      const tdt = `${sun.getFullYear()}-${pad(sun.getMonth() + 1)}-${pad(sun.getDate())}`;
      setFromDate(fdt);
      setToDate(tdt);
      fetchLiveAttendanceMatrix({ fdt, tdt });
    } else if (preset === 'THIS_MONTH') {
      const firstDay = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
      const lastDayNum = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const lastDay = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(lastDayNum)}`;
      setFromDate(firstDay);
      setToDate(lastDay);
      fetchLiveAttendanceMatrix({ fdt: firstDay, tdt: lastDay });
    } else if (preset === 'SEMESTER') {
      const firstDay = '2026-07-01';
      const lastDayNum = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const lastDay = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(lastDayNum)}`;
      setFromDate(firstDay);
      setToDate(lastDay);
      fetchLiveAttendanceMatrix({ fdt: firstDay, tdt: lastDay });
    }
  };

  // Filtered Subject Columns: Subject Wise vs All
  const displayedSubjects = useMemo(() => {
    if (selectedSubjectFilter === 'all') return matrixSubjects;
    const filtered = matrixSubjects.filter(
      (s) =>
        s.sub_cd === selectedSubjectFilter ||
        s.sub_name.toLowerCase().trim() === selectedSubjectFilter.toLowerCase().trim() ||
        s.sub_name.toLowerCase().includes(selectedSubjectFilter.toLowerCase())
    );
    return filtered.length > 0 ? filtered : matrixSubjects;
  }, [matrixSubjects, selectedSubjectFilter]);

  // Combined Unique Subject List for Dropdown
  const allAvailableSubjects = useMemo(() => {
    const map = new Map<string, { sub_cd: string; sub_name: string }>();
    matrixSubjects.forEach((s) => map.set(s.sub_cd || s.sub_name, s));
    if (cascadeState?.allSubjects) {
      cascadeState.allSubjects.forEach((s) => {
        const cd = s.code || s.sub_cd || s.id;
        if (!map.has(cd)) {
          map.set(cd, { sub_cd: cd, sub_name: s.name || s.sub_name || cd });
        }
      });
    }
    return Array.from(map.values());
  }, [matrixSubjects, cascadeState]);

  return (
    <div className="space-y-5">
      {/* Alert Banner */}
      {alertMessage && (
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between shadow-lg text-xs font-bold animate-fadeIn ${
            alertMessage.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
          }`}
        >
          <span>{alertMessage.text}</span>
          <button
            type="button"
            onClick={() => setAlertMessage(null)}
            className="text-white/80 hover:text-white ml-4 font-black"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── 1. DYNAMIC COURSE & SUBJECT LINKER CASCADE & DATE RANGE BAR ───────── */}
      <div className="space-y-4">
        {/* HOD Faculty Selector (when user is HOD, allows viewing any faculty of same department) */}
        {isHodUser && (
          <div className="bg-gradient-to-r from-indigo-900/10 via-purple-900/10 to-transparent dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-slate-900 rounded-[22px] p-4 border border-indigo-200/60 dark:border-indigo-800/40 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">👨‍🏫</span>
              <div>
                <h4 className="text-xs font-black text-[#1B1E28] dark:text-white uppercase tracking-wider">
                  HOD Department Oversight
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Select any faculty in your department to inspect their scheduled subjects, or choose All Department.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Faculty Member:
              </label>
              <select
                value={hodFacultyId}
                onChange={(e) => {
                  setHodFacultyId(e.target.value);
                }}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white cursor-pointer shadow-2xs"
              >
                <option value="ALL">🏛️ All Department Faculty / Subjects</option>
                {departmentFacultyList.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} {f.emp_id ? `(${f.emp_id})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Dynamic Course & Subject Linker (FacultyAcademicCascadingDropdown) */}
        <FacultyAcademicCascadingDropdown
          onlyLinkedSubjects={isFacultyUser || (isHodUser && hodFacultyId !== 'ALL')}
          showSection={true}
          showSubject={true}
          facultyId={isHodUser && hodFacultyId !== 'ALL' ? hodFacultyId : undefined}
          onSelectionChange={handleAcademicCascadeChange}
          selectedCollegeCd={selectedCollege}
          selectedCourseCd={selectedCourse}
          selectedBranchCd={selectedBranch}
          selectedBatchCd={selectedBatch}
          selectedSemCd={selectedSem}
          selectedSecCd={selectedSection}
          selectedSubjectCd={selectedSubjectFilter !== 'all' ? selectedSubjectFilter : undefined}
          title={
            isAdminUser
              ? '🏛️ Academic Hierarchy & Subject Filter (Admin All-Access)'
              : isHodUser
              ? '🏛️ Department Academic Hierarchy & Faculty Scheduler Linker'
              : '🏛️ Faculty Academic Hierarchy & Linked Subjects'
          }
          subtitle={
            isAdminUser
              ? 'College → Course → Branch → Batch → Semester → Section → Subject (All Permissions Enabled)'
              : isHodUser
              ? 'Department Scope: Inspect department courses, batches, sections, and linked faculty subjects'
              : 'Course & Subject Linker: Strictly scoped to your assigned academic timetable allocations'
          }
        />

        {/* Subject-Wise vs All Filter & Date Range Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-[22px] p-4 md:p-5 shadow-soft border border-[#E7EAF3] dark:border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Subject Selector: All Subjects vs Specific Subject */}
            <div className="flex-1 min-w-[280px]">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px] flex items-center gap-1.5">
                <span>📚</span>
                <span>Subject View:</span>
                <span className="text-[10px] font-normal text-slate-400">
                  (Choose "All Subjects" or a specific subject)
                </span>
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedSubjectFilter}
                  onChange={(e) => handleSubjectFilterChange(e.target.value)}
                  className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs font-bold text-slate-800 dark:text-white cursor-pointer"
                >
                  <option value="all">
                    📚 All Subjects ({matrixSubjects.length || cascadeState?.allSubjects?.length || 0})
                  </option>
                  {allAvailableSubjects.map((sub) => (
                    <option key={sub.sub_cd || sub.sub_name} value={sub.sub_cd || sub.sub_name}>
                      {sub.sub_name} (#{sub.sub_cd})
                    </option>
                  ))}
                </select>
                {selectedSubjectFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => handleSubjectFilterChange('all')}
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-[#5B4BFF] dark:bg-slate-800 dark:text-indigo-300 rounded-xl text-xs font-bold whitespace-nowrap border border-indigo-200 dark:border-slate-700 cursor-pointer"
                    title="Reset to All Subjects"
                  >
                    View All
                  </button>
                )}
              </div>
            </div>

            {/* Date Range Inputs & Quick Presets */}
            <div className="flex flex-wrap items-end gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                  📅 From Date (fdt)
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    fetchLiveAttendanceMatrix({ fdt: e.target.value });
                  }}
                  className="bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-1.5 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                  📅 To Date (tdt)
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    fetchLiveAttendanceMatrix({ tdt: e.target.value });
                  }}
                  className="bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-1.5 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                />
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1 bg-[#F6F8FC] dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setQuickDatePreset('TODAY')}
                  className="px-2 py-1 text-[11px] font-bold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDatePreset('THIS_WEEK')}
                  className="px-2 py-1 text-[11px] font-bold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                >
                  This Week
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDatePreset('THIS_MONTH')}
                  className="px-2 py-1 text-[11px] font-bold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDatePreset('SEMESTER')}
                  className="px-2 py-1 text-[11px] font-bold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                >
                  Full Sem
                </button>
              </div>

              {/* Live Sync Button (Visible ONLY if tenant slug contains 'srms') */}
              {isSrms && (
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={syncingLive}
                  className="px-3.5 py-1.5 bg-[#F36C21] hover:bg-[#e05e16] text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 shrink-0 h-[34px]"
                >
                  <span className={syncingLive ? 'animate-spin' : ''}>🔄</span>
                  <span>{syncingLive ? 'Syncing...' : 'Sync Live'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

        {/* View Mode Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-[#E7EAF3] dark:border-slate-800">
          <div className="flex items-center gap-2">
            {!isStudentRole && (
              <button
                type="button"
                onClick={() => setViewMode('MATRIX')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'MATRIX'
                    ? 'bg-[#2D2575] text-white shadow-md'
                    : 'bg-[#F6F8FC] dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>📊</span>
                <span>Section Attendance Matrix</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setViewMode('STUDENT')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'STUDENT'
                  ? 'bg-[#F36C21] text-white shadow-md'
                  : 'bg-[#F6F8FC] dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <span>👤</span>
              <span>{isStudentRole ? 'My Attendance Ledger' : 'Student Detail Breakdown'}</span>
            </button>
          </div>

          {/* Quick Metrics Bar in Header */}
          {viewMode === 'MATRIX' && !isStudentRole && (
            <div className="flex items-center gap-2 text-[11px] font-bold">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-[#5B4BFF] border border-indigo-200 dark:border-indigo-800">
                Total: <strong>{summaryMetrics.total}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 border border-emerald-200 dark:border-emerald-800">
                Regular: <strong>{summaryMetrics.regular}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 border border-rose-200 dark:border-rose-800">
                Defaulters: <strong>{summaryMetrics.defaulters}</strong>
              </span>
            </div>
          )}
        </div>

      {/* ─── 2. SECTION ATTENDANCE MATRIX (High-Density Premium DataTable) ───────── */}
      {viewMode === 'MATRIX' && !isStudentRole && (
        <div className="p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft space-y-3.5">
          {/* DataTable Controls Bar (Search + Quick Filter Pills + Rows per page) */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search student by name, roll, reg no..."
                value={matrixSearchQuery}
                onChange={(e) => {
                  setMatrixSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-8 pr-7 py-1.5 text-xs font-bold text-slate-800 dark:text-white"
              />
              <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
              {matrixSearchQuery && (
                <button
                  type="button"
                  onClick={() => setMatrixSearchQuery('')}
                  className="absolute right-2.5 top-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-black"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Status Pills & Page Size Selector */}
            <div className="flex flex-wrap items-center gap-2 justify-between lg:justify-end text-xs font-bold">
              <div className="flex items-center gap-1 bg-[#F6F8FC] dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('ALL');
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-white dark:bg-slate-700 text-[#1B1E28] dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  All ({matrixStudents.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('GOOD');
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    statusFilter === 'GOOD'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                  }`}
                >
                  ≥ 75% ({summaryMetrics.regular})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('DEFAULTER');
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    statusFilter === 'DEFAULTER'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                  }`}
                >
                  &lt; 75% ({summaryMetrics.defaulters})
                </button>
              </div>

              {/* Rows Per Page */}
              <div className="flex items-center gap-1.5 pl-2">
                <span className="text-[11px] text-slate-500 font-semibold">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-black cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={-1}>All ({filteredMatrixStudents.length})</option>
                </select>
              </div>
            </div>
          </div>

          {/* Loading State / Empty / Table */}
          {loadingMatrix ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <div className="animate-spin text-2xl">🔄</div>
              <p className="text-xs font-bold">Syncing live attendance data from SRMS portal...</p>
            </div>
          ) : filteredMatrixStudents.length === 0 ? (
            <div className="p-10 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <span className="text-2xl block mb-1">📋</span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No matching student attendance records</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Try modifying your search term or filter parameters above.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto max-h-[620px] scrollbar-thin">
                <table className="w-full text-left text-xs border-collapse min-w-[950px]">
                  <thead className="sticky top-0 z-10 shadow-xs">
                    <tr className="border-b border-indigo-950">
                      <th className="py-1.5 px-2 font-black uppercase text-center bg-[#2D2575] text-white border-r border-indigo-900 w-10 text-[10px] tracking-wider">
                        S.No
                      </th>
                      <th className="py-1.5 px-2 font-black uppercase bg-[#2D2575] text-white border-r border-indigo-900 min-w-[120px] text-[10px] tracking-wider">
                        College
                      </th>
                      <th className="py-1.5 px-2 font-black uppercase bg-[#2D2575] text-white border-r border-indigo-900 min-w-[105px] text-[10px] tracking-wider">
                        Roll No
                      </th>
                      <th className="py-1.5 px-2.5 font-black uppercase bg-[#00C48C] text-white border-r border-emerald-600 min-w-[150px] text-[10px] tracking-wider">
                        Student Name
                      </th>
                      <th className="py-1.5 px-1.5 font-black uppercase bg-[#2D2575] text-white border-r border-indigo-900 text-center w-14 text-[10px] tracking-wider">
                        Course
                      </th>
                      <th className="py-1.5 px-1.5 font-black uppercase bg-[#2D2575] text-white border-r border-indigo-900 text-center w-16 text-[10px] tracking-wider">
                        Batch
                      </th>
                      <th className="py-1.5 px-1.5 font-black uppercase bg-[#2D2575] text-white border-r border-indigo-900 text-center w-12 text-[10px] tracking-wider">
                        Sem
                      </th>
                      <th className="py-1.5 px-1.5 font-black uppercase bg-[#2D2575] text-white border-r border-indigo-900 text-center w-12 text-[10px] tracking-wider">
                        Sec
                      </th>
                      {displayedSubjects.map((sub, idx) => (
                        <th
                          key={sub.sub_cd}
                          className={`py-1.5 px-2 font-black uppercase text-center border-r border-slate-300 dark:border-slate-700 min-w-[110px] text-[10px] leading-tight ${
                            subjectHeaderColors[idx % subjectHeaderColors.length]
                          }`}
                        >
                          <div className="truncate max-w-[130px] font-extrabold">{sub.sub_name}</div>
                          <div className="text-[8.5px] opacity-90 font-mono">#{sub.sub_cd}</div>
                        </th>
                      ))}
                      <th className="py-1.5 px-2 font-black uppercase text-center bg-[#2D2575] text-white border-r border-indigo-900 min-w-[95px] text-[10px] tracking-wider">
                        Total Att %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-[11px]">
                    {paginatedStudents.map((st) => (
                      <tr
                        key={st.registration_no}
                        className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <td className="py-1 px-1.5 text-center font-bold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800 text-[10px]">
                          {st.s_no}
                        </td>
                        <td className="py-1 px-2 text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 text-[10.5px] leading-tight font-bold truncate max-w-[130px]">
                          {st.college}
                        </td>
                        <td className="py-1 px-2 font-mono font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800 text-[10.5px]">
                          {st.rollno}
                        </td>
                        <td className="py-1 px-2.5 font-black text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">
                          <div className="flex items-center gap-2 min-w-[170px]">
                            {st.photo_url ? (
                              <img
                                src={st.photo_url}
                                alt={st.name}
                                className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : null}
                            <div
                              className={`w-7 h-7 rounded-full bg-[#5B4BFF]/10 text-[#5B4BFF] dark:bg-indigo-900/40 dark:text-indigo-300 font-extrabold flex items-center justify-center text-[10px] shrink-0 border border-[#5B4BFF]/20 ${
                                st.photo_url ? 'hidden' : ''
                              }`}
                            >
                              {st.name?.slice(0, 2)?.toUpperCase() || 'ST'}
                            </div>
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStudentUid(st.registration_no);
                                  setSelectedStudentName(st.name);
                                  setSelectedStudentRoll(st.rollno);
                                  setViewMode('STUDENT');
                                }}
                                className="hover:text-[#5B4BFF] hover:underline text-left cursor-pointer transition-colors truncate max-w-[140px] font-bold block text-[11px]"
                              >
                                {st.name}
                              </button>
                              <div className="text-[9px] font-mono text-slate-400 dark:text-slate-500 truncate">
                                {st.registration_no || st.rollno}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-1 px-1.5 text-center font-bold text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800 text-[10.5px]">
                          {st.course}
                        </td>
                        <td className="py-1 px-1.5 text-center font-bold text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800 text-[10px] whitespace-nowrap">
                          {st.batch}
                        </td>
                        <td className="py-1 px-1.5 text-center font-bold text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800 text-[10.5px]">
                          {st.semester}
                        </td>
                        <td className="py-1 px-1.5 text-center font-bold text-indigo-700 dark:text-indigo-400 border-r border-slate-200 dark:border-slate-800 text-[10px] whitespace-nowrap">
                          {st.section || 'A (1)'}
                        </td>

                        {/* Subject Attendance Badges */}
                        {displayedSubjects.map((sub) => {
                          const att = st.attendance[sub.sub_name];
                          if (!att) {
                            return (
                              <td
                                key={sub.sub_cd}
                                className="py-1 px-1 text-center text-slate-400 border-r border-slate-200 dark:border-slate-800 text-[10px]"
                              >
                                -
                              </td>
                            );
                          }

                          const pct = att.percentage;
                          const badgeStyle =
                            pct >= 75
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300'
                              : pct >= 50
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300';

                          return (
                            <td
                              key={sub.sub_cd}
                              className="py-0.5 px-1 text-center border-r border-slate-200 dark:border-slate-800"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenLectureDrilldown(
                                    att.sub_cd || sub.sub_cd,
                                    sub.sub_name,
                                    st.name,
                                    st.registration_no,
                                    st.rollno
                                  )
                                }
                                title="Click to view lecture-by-lecture history"
                                className={`inline-block px-1.5 py-0.5 rounded font-black text-[10px] shadow-2xs cursor-pointer active:scale-95 transition-transform ${badgeStyle}`}
                              >
                                {att.raw || `${att.present}/${att.total} (${pct.toFixed(1)}%)`}
                              </button>
                            </td>
                          );
                        })}

                        {/* Total Attendance Percentage */}
                        <td className="py-0.5 px-1.5 text-center border-r border-slate-200 dark:border-slate-800">
                          <span
                            className={`inline-block px-2 py-0.5 rounded font-black text-[10.5px] shadow-2xs ${
                              selectedSubjectFilter !== 'all' && displayedSubjects.length === 1 && st.attendance[displayedSubjects[0].sub_name]
                                ? (st.attendance[displayedSubjects[0].sub_name]!.percentage >= 75
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : st.attendance[displayedSubjects[0].sub_name]!.percentage >= 50
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-rose-100 text-rose-800 border border-rose-300')
                                : (st.TotalPresentPercentage === '—' || displayedSubjects.length === 0
                                    ? 'bg-slate-100 text-slate-600 border border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                    : parseFloat(st.TotalPresentPercentage) >= 75
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : parseFloat(st.TotalPresentPercentage) >= 50
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-rose-100 text-rose-800 border border-rose-300')
                            }`}
                          >
                            {selectedSubjectFilter !== 'all' && displayedSubjects.length === 1 && st.attendance[displayedSubjects[0].sub_name]
                              ? `${st.attendance[displayedSubjects[0].sub_name]!.percentage.toFixed(1)}%`
                              : displayedSubjects.length === 0 ? '—' : st.TotalPresentPercentage}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* DataTable Pagination Footer Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 bg-[#F6F8FC] dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 text-xs">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                  Showing <strong>{filteredMatrixStudents.length === 0 ? 0 : startIndex}</strong> to{' '}
                  <strong>{endIndex}</strong> of <strong>{filteredMatrixStudents.length}</strong> students
                  {matrixSearchQuery && (
                    <span className="text-[#5B4BFF] ml-1.5 font-semibold">
                      (filtered from {matrixStudents.length} total)
                    </span>
                  )}
                </div>

                {/* Page Buttons */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 text-[11px] font-bold cursor-pointer hover:bg-slate-100"
                    >
                      ⏮ First
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 text-[11px] font-bold cursor-pointer hover:bg-slate-100"
                    >
                      ◀ Prev
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .map((p, idx, arr) => {
                        const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                        return (
                          <div key={p} className="flex items-center">
                            {showEllipsis && <span className="px-1 text-slate-400 font-bold">…</span>}
                            <button
                              type="button"
                              onClick={() => setCurrentPage(p)}
                              className={`w-7 h-7 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                currentPage === p
                                  ? 'bg-[#5B4BFF] text-white shadow-xs'
                                  : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {p}
                            </button>
                          </div>
                        );
                      })}

                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 text-[11px] font-bold cursor-pointer hover:bg-slate-100"
                    >
                      Next ▶
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 text-[11px] font-bold cursor-pointer hover:bg-slate-100"
                    >
                      Last ⏭
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── 3. SINGLE STUDENT ATTENDANCE LEDGER ───────── */}
      {(viewMode === 'STUDENT' || isStudentRole) && (
        <div className="space-y-5">
          {/* Student Header Card */}
          <div className="p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-[#5B4BFF] bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-lg">
                Student Attendance Ledger
              </span>
              <h2 className="text-lg font-black text-[#1B1E28] dark:text-white mt-1">
                {selectedStudentName || 'Student Attendance Profile'}
              </h2>
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 mt-1 font-semibold">
                <span>
                  Roll No: <strong className="text-slate-800 dark:text-slate-200">{selectedStudentRoll}</strong>
                </span>
                <span>•</span>
                <span>
                  Reg No (UID): <strong className="text-slate-800 dark:text-slate-200">{selectedStudentUid}</strong>
                </span>
                <span>•</span>
                <span>
                  Semester: <strong className="text-[#5B4BFF]">{selectedSem}</strong>
                </span>
                <span>•</span>
                <span>
                  Period: <strong>{fromDate}</strong> to <strong>{toDate}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[9px] uppercase font-bold text-slate-400">Total Attendance</span>
                <div className="text-xl font-black text-slate-900 dark:text-white">{studentTotalPct}</div>
              </div>
              {!isStudentRole && (
                <button
                  type="button"
                  onClick={() => setViewMode('MATRIX')}
                  className="px-3.5 py-1.5 bg-[#2D2575] hover:bg-[#3D3399] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer ml-2"
                >
                  <span>← Back to Section Matrix</span>
                </button>
              )}
            </div>
          </div>

          {/* Subject Cards Grid */}
          <div className="p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-[#1B1E28] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>📚</span>
                <span>Subject-Wise Attendance Breakdown (SRMS Portal Live)</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-bold">Click any subject card to view lecture history</span>
            </div>

            {loadingSummary ? (
              <div className="p-10 text-center text-slate-400 space-y-2">
                <div className="animate-spin text-2xl">🔄</div>
                <p className="text-xs font-bold">Fetching Student Attendance...</p>
              </div>
            ) : summaryData.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-bold">
                No attendance sessions found for the selected student and date range.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {summaryData.map((subj) => {
                  const pct = subj.AttendancePercentage || 0;
                  const isDefaulter = pct < 75;

                  return (
                    <div
                      key={subj.sub_name}
                      className="p-4 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800/80 border border-[#E7EAF3] dark:border-slate-700 shadow-2xs space-y-2.5 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[9.5px] font-mono font-bold text-slate-400 uppercase">
                              CODE: #{subj.sub_cd}
                            </span>
                            <h4 className="text-xs font-black text-[#1B1E28] dark:text-white leading-tight">
                              {subj.sub_name}
                            </h4>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[9.5px] font-extrabold uppercase shrink-0 ${
                              isDefaulter
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300'
                                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                            }`}
                          >
                            {isDefaulter ? '⚠️ < 75%' : '✅ Good'}
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between pt-0.5">
                          <div>
                            <span className="text-xl font-black text-[#1B1E28] dark:text-white">
                              {pct.toFixed(2)}%
                            </span>
                            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-semibold">
                              {subj.PresentCount} Attended / {subj.TotalLectures} Total
                            </p>
                          </div>
                          <span className="text-[11px] text-rose-600 font-bold">{subj.AbsentCount} Absent</span>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pct >= 75 ? 'bg-[#00C48C]' : pct >= 50 ? 'bg-[#FFB020]' : 'bg-[#F04438]'
                            }`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleOpenLectureDrilldown(
                            subj.sub_cd,
                            subj.sub_name,
                            selectedStudentName,
                            selectedStudentUid,
                            selectedStudentRoll
                          )
                        }
                        className="w-full mt-2 py-1.5 bg-white dark:bg-slate-900 hover:bg-[#F36C21] hover:border-[#F36C21] hover:text-white border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs"
                      >
                        Inspect Lecture Timeline ➔
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── 4. DRILL-DOWN POPUP MODAL (GetEngSemSubwiseStatus) ───────── */}
      {activeDrilldown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[28px] max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-[#2D2575] to-[#4338CA] text-white flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase bg-white/20 px-2.5 py-0.5 rounded font-extrabold">
                    CODE: #{activeDrilldown.sub_cd}
                  </span>
                  <span className="text-[10px] uppercase bg-emerald-400/30 text-emerald-200 px-2 py-0.5 rounded font-bold">
                    SRMS Verified Record
                  </span>
                </div>
                <h3 className="text-base font-black mt-1.5">{activeDrilldown.sub_name}</h3>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Student: <strong>{activeDrilldown.student_name}</strong> • Reg No:{' '}
                  <strong>{activeDrilldown.student_reg}</strong>
                  {activeDrilldown.student_roll && (
                    <>
                      {' '}
                      • Roll No: <strong>{activeDrilldown.student_roll}</strong>
                    </>
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveDrilldown(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center font-black text-sm transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Metrics Bar */}
            <div className="grid grid-cols-4 gap-2 p-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-center text-xs">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[9.5px] text-slate-400 uppercase font-bold block">Total Lectures</span>
                <span className="text-sm font-black text-slate-800 dark:text-white">{modalMetrics.total}</span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <span className="text-[9.5px] text-emerald-600 dark:text-emerald-400 uppercase font-bold block">
                  Present
                </span>
                <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                  {modalMetrics.present}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                <span className="text-[9.5px] text-rose-600 dark:text-rose-400 uppercase font-bold block">Absent</span>
                <span className="text-sm font-black text-rose-700 dark:text-rose-300">{modalMetrics.absent}</span>
              </div>
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                <span className="text-[9.5px] text-indigo-600 dark:text-indigo-400 uppercase font-bold block">
                  Attendance %
                </span>
                <span className="text-sm font-black text-indigo-700 dark:text-indigo-300">{modalMetrics.pct}</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {loadingLectures ? (
                <div className="p-10 text-center text-slate-400 space-y-2">
                  <div className="animate-spin text-2xl">🔄</div>
                  <p className="text-xs font-bold">Loading lecture timeline from SRMS GetEngSemSubwiseStatus...</p>
                </div>
              ) : lectureDetails.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-bold">
                  No individual lecture status logs captured yet for this subject.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#2D2575] text-white uppercase font-black text-[10.5px]">
                        <th className="py-2 px-3 text-center w-12 border-r border-indigo-900">#</th>
                        <th className="py-2 px-3 border-r border-indigo-900">Lecture Date</th>
                        <th className="py-2 px-3 text-center border-r border-indigo-900">Time Slot</th>
                        <th className="py-2 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-[11px]">
                      {lectureDetails.map((lec, idx) => {
                        const isPresent =
                          lec.IsPresent === 'Present' ||
                          lec.IsPresent === true ||
                          String(lec.IsPresent).toLowerCase() === 'present';

                        return (
                          <tr
                            key={idx}
                            className="hover:bg-[#F6F8FC] dark:hover:bg-slate-800/50 transition-colors"
                          >
                            <td className="py-1.5 px-3 text-center font-bold text-slate-400 border-r border-slate-100 dark:border-slate-800">
                              {idx + 1}
                            </td>
                            <td className="py-1.5 px-3 font-bold text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800">
                              📅 {formatLectureDate(lec.lecturedt)}
                            </td>
                            <td className="py-1.5 px-3 text-center font-mono font-semibold text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800">
                              ⏰ {lec.starttm || '08:30'} - {lec.endtm || '09:30'}
                            </td>
                            <td className="py-1.5 px-3 text-right">
                              <span
                                className={`px-2.5 py-0.5 rounded-lg text-[10.5px] font-black uppercase inline-flex items-center gap-1 shadow-2xs ${
                                  isPresent
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300'
                                }`}
                              >
                                <span>{isPresent ? '✓' : '✕'}</span>
                                <span>{isPresent ? 'Present' : 'Absent'}</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <span className="text-[11px] text-slate-400 font-semibold">
                Synced from SRMS Student Attendance Master
              </span>
              <button
                type="button"
                onClick={() => setActiveDrilldown(null)}
                className="px-4 py-1.5 bg-[#2D2575] hover:bg-[#3D3399] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Close Timeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
