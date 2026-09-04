'use client';

import { useState, useEffect, useMemo } from 'react';

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
  course: string;
  batch: string;
  semester: string;
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

export default function AttendancePortal({ role = 'STUDENT' }: { role?: string }) {
  // Cascading Academic States
  const [collegesList, setCollegesList] = useState<DropdownItem[]>([]);
  const [coursesList, setCoursesList] = useState<DropdownItem[]>([]);
  const [branchesList, setBranchesList] = useState<DropdownItem[]>([]);
  const [batchesList, setBatchesList] = useState<DropdownItem[]>([]);

  // User Auth & Tenant Context State
  const [userRole, setUserRole] = useState<string>(role || 'STUDENT');
  const [userColgCd, setUserColgCd] = useState<string>('1');
  const [userTenantSlug, setUserTenantSlug] = useState<string>('srms-cet-bareilly');

  const [selectedCollege, setSelectedCollege] = useState('1');
  const [selectedCourse, setSelectedCourse] = useState('13'); // BCA
  const [selectedBranch, setSelectedBranch] = useState('1');
  const [selectedBatch, setSelectedBatch] = useState('2'); // 2025
  const [selectedSem, setSelectedSem] = useState('3'); // Sem 3
  const [selectedSection, setSelectedSection] = useState('1'); // Section A = 1

  // Date Range States
  const [fromDate, setFromDate] = useState('2026-07-02');
  const [toDate, setToDate] = useState('2026-08-21');
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

  // Pagination & Quick Filter States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DEFAULTER' | 'GOOD'>('ALL');

  // Student Specific State
  const [selectedStudentUid, setSelectedStudentUid] = useState('');
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [selectedStudentRoll, setSelectedStudentRoll] = useState('');
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
          return;
        }
      }

      if (cachedReg) setSelectedStudentUid(cachedReg);
      if (cachedName) setSelectedStudentName(cachedName);
      if (cachedRoll) setSelectedStudentRoll(cachedRoll);
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
    try {
      const res = await fetch(`/api/srms/courses?colgcd=${colgCode}&tenant=${userTenantSlug}`);
      if (res.ok) {
        const j = await res.json();
        const list = Array.isArray(j) ? j : j.data || [];
        const mapped = list.map((c: any) => ({
          id: String(c.course_cd || c.code || '13'),
          code: String(c.course_cd || c.code || '13'),
          name: c.course_name || c.name || `Course ${c.course_cd || 13}`,
        }));
        setCoursesList(mapped);
        if (mapped.length > 0) {
          const firstCourse = mapped[0].code;
          setSelectedCourse(firstCourse);
          fetchBranchesAndBatches(colgCode, firstCourse, mapped);
        }
      }
    } catch (e) {
      console.warn('Error changing college:', e);
    }
  };

  const handleCourseChange = (courseCode: string) => {
    setSelectedCourse(courseCode);
    fetchBranchesAndBatches(selectedCollege, courseCode);
  };

  const fetchAcademicMetadata = async () => {
    try {
      let roleVal = role || 'STUDENT';
      let userColg = '1';
      let userSlug = 'srms-cet-bareilly';
      if (typeof window !== 'undefined') {
        roleVal = (localStorage.getItem('role') || localStorage.getItem('auth_role') || role || 'STUDENT').toUpperCase();
        userColg = localStorage.getItem('colg_cd') || localStorage.getItem('colgCd') || '1';
        userSlug = (localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly')
          .replace(/^tenant_/, '').replace(/^tenant-/, '').trim();
        if (userSlug === 'srms-cet') userSlug = 'srms-cet-bareilly';
        if (userSlug === 'srms-cetr') userSlug = 'srms-cetr-bareilly';
        setUserRole(roleVal);
        setUserColgCd(userColg);
        setUserTenantSlug(userSlug);
      }

      const [colgRes, crsRes] = await Promise.all([
        fetch('/api/srms/colleges').catch(() => null),
        fetch(`/api/srms/courses?colgcd=${userColg}&tenant=${userSlug}`).catch(() => null),
      ]);

      let loadedColleges: DropdownItem[] = [];
      if (colgRes && colgRes.ok) {
        const j = await colgRes.json();
        const list = Array.isArray(j) ? j : j.data || [];
        const mappedList: DropdownItem[] = list.map((c: any) => ({
          id: String(c.colg_cd || c.code || '1'),
          code: String(c.colg_cd || c.code || '1'),
          name: c.colg_name || c.name || `College ${c.colg_cd || 1}`,
        }));

        if (roleVal !== 'SUPER_ADMIN') {
          const myCol = mappedList.find((c: any) => String(c.code) === String(userColg) || String(c.id) === String(userColg));
          loadedColleges = myCol ? [myCol] : [{ id: userColg, code: userColg, name: 'SRMS CET,BAREILLY' }];
          setSelectedCollege(loadedColleges[0].code || '1');
        } else {
          loadedColleges = mappedList;
        }
        setCollegesList(loadedColleges);
      } else {
        const defaultCol = [{ id: userColg, code: userColg, name: 'SRMS CET,BAREILLY' }];
        setCollegesList(defaultCol);
        setSelectedCollege(userColg);
      }

      if (crsRes && crsRes.ok) {
        const j = await crsRes.json();
        const list = Array.isArray(j) ? j : j.data || [];
        const mappedCourses: DropdownItem[] = list.map((c: any) => ({
          id: String(c.course_cd || c.code || '13'),
          code: String(c.course_cd || c.code || '13'),
          name: c.course_name || c.name || `Course ${c.course_cd || 13}`,
        }));
        setCoursesList(mappedCourses);
        const crsToUse = selectedCourse || (mappedCourses[0] ? mappedCourses[0].code : '13');
        fetchBranchesAndBatches(userColg, crsToUse, mappedCourses, userSlug);
      } else {
        setCoursesList([]);
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
    const effectiveColg = colg || selectedCollege || '1';
    const effectiveCrs = crs || selectedCourse || '13';
    const slug = customSlug || userTenantSlug || 'srms-cet-bareilly';
    const activeCourses = customCourses || coursesList;

    try {
      const [brRes, btRes] = await Promise.all([
        fetch(`/api/srms/branches?colgcd=${effectiveColg}&coursecd=${effectiveCrs}&tenant=${slug}`).catch(() => null),
        fetch(`/api/srms/batches?colgcd=${effectiveColg}&coursecd=${effectiveCrs}&tenant=${slug}`).catch(() => null),
      ]);

      if (brRes && brRes.ok) {
        const j = await brRes.json();
        const list = Array.isArray(j) ? j : j.data || [];
        const courseObj = activeCourses.find(
          (c) => String(c.code) === String(effectiveCrs) || String(c.id) === String(effectiveCrs)
        );
        const courseName = (courseObj?.name || (effectiveCrs === '13' ? 'BCA' : 'Course'))
          .replace(/^\[#\d+\]\s*/, '')
          .trim();

        const mapped: DropdownItem[] = (Array.isArray(list) && list.length > 0 ? list : []).map((b: any) => {
          const rawName = (b.branch_name || b.name || '').trim();
          const validName =
            rawName && rawName !== '-' && rawName !== 'null' && rawName !== 'NONE'
              ? rawName
              : `${(b.course_name || courseName).replace(/^\[#\d+\]\s*/, '').trim()} General`;
          return {
            id: String(b.branch_cd || b.code || '1'),
            code: String(b.branch_cd || b.code || '1'),
            name: validName,
          };
        });

        if (mapped.length > 0) {
          setBranchesList(mapped);
          setSelectedBranch((prev) => {
            const exists = mapped.some((b) => String(b.code) === String(prev));
            return exists ? prev : mapped[0].code;
          });
        } else {
          const fallback = [{ id: '1', code: '1', name: `${courseName} General` }];
          setBranchesList(fallback);
          setSelectedBranch('1');
        }
      } else {
        const courseObj = activeCourses.find(
          (c) => String(c.code) === String(effectiveCrs) || String(c.id) === String(effectiveCrs)
        );
        const courseName = (courseObj?.name || 'BCA').replace(/^\[#\d+\]\s*/, '').trim();
        const fallback = [{ id: '1', code: '1', name: `${courseName} General` }];
        setBranchesList(fallback);
        setSelectedBranch('1');
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
    } catch (err) {
      console.warn('Failed to fetch branches & batches:', err);
    }
  };

  // Fetch Live Attendance Matrix from SRMS with sub_cd
  const fetchLiveAttendanceMatrix = async () => {
    try {
      setLoadingMatrix(true);
      const payload = {
        colg_cd: Number(selectedCollege || 1),
        course_cd: Number(selectedCourse || 13),
        branch_cd: Number(selectedBranch || 1),
        batch_cd: Number(selectedBatch || 2),
        sem_cd: Number(selectedSem || 3),
        section_cd: Number(selectedSection || 1),
        fdt: fromDate,
        tdt: toDate,
      };

      const res = await fetch('/api/srms/student-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
              college: stud.colg_name || 'SRMS CET,BAREILLY',
              rollno: stud.stud_roll_no || stud.stud_reg_no,
              registration_no: stud.stud_reg_no,
              name: stud.stud_name,
              course: stud.course_name || 'BCA',
              batch: stud.batch_name ? `${stud.batch_name} Batch` : '2025 Batch',
              semester: String(selectedSem),
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
      console.warn('Failed to fetch SRMS attendance matrix:', err);
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
      (isStudentRole ? matrixStudents.find((s) => s.registration_no === '2025107990' || s.name.toLowerCase().includes('aafreen')) : null) ||
      matrixStudents[0];

    if (stud) {
      setSelectedStudentName(stud.name);
      setSelectedStudentRoll(stud.rollno);
      setSelectedStudentUid(stud.registration_no);
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

      const res = await fetch('/api/srms/lecture-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ddl_sub: subCd,
          ddl_batch: selectedBatch || '2',
          colgcd: selectedCollege || '1',
          coursecd: selectedCourse || '13',
          ddl_branch: selectedBranch || '1',
          sem_cd: selectedSem || '3',
          section_cd: selectedSection || '1',
          uid: studReg || selectedStudentUid || '2025107990',
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
      list = list.filter((st) => parseFloat(st.TotalPresentPercentage || '0') < 75);
    } else if (statusFilter === 'GOOD') {
      list = list.filter((st) => parseFloat(st.TotalPresentPercentage || '0') >= 75);
    }

    return list;
  }, [matrixStudents, matrixSearchQuery, statusFilter]);

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
    const defaulters = matrixStudents.filter((st) => parseFloat(st.TotalPresentPercentage || '0') < 75).length;
    const regular = total - defaulters;
    const avgPct =
      total > 0
        ? (matrixStudents.reduce((acc, st) => acc + parseFloat(st.TotalPresentPercentage || '0'), 0) / total).toFixed(1)
        : '0.0';
    return { total, defaulters, regular, avgPct };
  }, [matrixStudents]);

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

      {/* ─── 1. GLOBAL FILTER & DATE RANGE BAR ───────── */}
      <div className="p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-black text-[#1B1E28] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span>🏛️</span>
              <span>Attendance Filtering &amp; Date Range</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Select academic criteria, date range, and sync student attendance dynamically from SRMS.
            </p>
          </div>

          <button
            type="button"
            onClick={handleManualSync}
            disabled={syncingLive}
            className="px-3.5 py-1.5 bg-[#5B4BFF] hover:bg-[#4736E6] text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95 shrink-0"
          >
            <span className={syncingLive ? 'animate-spin' : ''}>🔄</span>
            <span>{syncingLive ? 'Syncing...' : 'Sync Live Attendance'}</span>
          </button>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
          {/* 1. College */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px] flex items-center gap-1">
              <span>🏛️</span> 1. College
            </label>
            <div className="relative flex items-center">
              <select
                value={selectedCollege}
                disabled={userRole !== 'SUPER_ADMIN'}
                onChange={(e) => handleCollegeChange(e.target.value)}
                className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-1.5 pr-14 font-bold disabled:cursor-not-allowed appearance-none cursor-pointer truncate text-[11px]"
              >
                {collegesList.map((c) => (
                  <option key={c.id} value={c.code}>
                    [#{c.code}] {c.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-2 pointer-events-none flex items-center gap-1">
                {userRole !== 'SUPER_ADMIN' ? (
                  <span className="text-[9px] bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                    <span>🔒</span>
                    <span>Locked</span>
                  </span>
                ) : (
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                )}
              </div>
            </div>
          </div>

          {/* 2. Course */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px] flex items-center gap-1">
              <span>🎓</span> 2. Course <span className="font-extrabold text-[#5B4BFF] dark:text-indigo-400">({coursesList.length})</span>
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-1.5 font-bold cursor-pointer truncate text-[11px]"
            >
              {coursesList.map((cr) => (
                <option key={cr.id} value={cr.code}>
                  [#{cr.code}] {cr.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Branch */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px] flex items-center gap-1">
              <span>🏢</span> 3. Branch <span className="font-extrabold text-[#5B4BFF] dark:text-indigo-400">({branchesList.length})</span>
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-1.5 font-bold cursor-pointer truncate text-[11px]"
            >
              {branchesList.map((br) => (
                <option key={br.id} value={br.code}>
                  [#{br.code}] {br.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Batch */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px] flex items-center gap-1">
              <span>👥</span> 4. Batch <span className="font-extrabold text-[#5B4BFF] dark:text-indigo-400">({batchesList.length})</span>
            </label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-1.5 font-bold cursor-pointer truncate text-[11px]"
            >
              {batchesList.map((bt) => (
                <option key={bt.id} value={bt.code}>
                  [#{bt.code}] {bt.name}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Semester */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px] flex items-center gap-1">
              <span>📖</span> 5. Semester
            </label>
            <select
              value={selectedSem}
              onChange={(e) => setSelectedSem(e.target.value)}
              className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-1.5 font-bold text-[#5B4BFF] cursor-pointer text-[11px]"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={String(sem)}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>

          {/* 6. Section */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px] flex items-center gap-1">
              <span>🔤</span> 6. Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-1.5 font-bold cursor-pointer text-[11px]"
            >
              <option value="1">Section A (1)</option>
              <option value="2">Section B (2)</option>
              <option value="3">Section C (3)</option>
              <option value="4">Section D (4)</option>
            </select>
          </div>
        </div>

        {/* Date Range & Student Selection Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs pt-2 border-t border-[#E7EAF3] dark:border-slate-800">
          {/* From Date */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">📅 From Date (fdt)</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-1.5 font-bold text-slate-900 dark:text-white cursor-pointer text-[11px]"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">📅 To Date (tdt)</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-1.5 font-bold text-slate-900 dark:text-white cursor-pointer text-[11px]"
            />
          </div>

          {/* Student Selector */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">👤 Select Student</label>
            {isStudentRole ? (
              <div className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-1.5 font-bold text-slate-800 dark:text-white flex items-center justify-between text-[11px]">
                <span className="truncate">
                  {selectedStudentName || 'Myself'} ({selectedStudentUid})
                </span>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded ml-1 shrink-0">
                  Self
                </span>
              </div>
            ) : (
              <select
                value={selectedStudentUid}
                onChange={(e) => {
                  const uid = e.target.value;
                  setSelectedStudentUid(uid);
                  const matched = matrixStudents.find((s) => s.registration_no === uid);
                  if (matched) {
                    setSelectedStudentName(matched.name);
                    setSelectedStudentRoll(matched.rollno);
                  }
                }}
                className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-1.5 font-bold cursor-pointer truncate text-[11px]"
              >
                {matrixStudents.map((st) => (
                  <option key={st.registration_no} value={st.registration_no}>
                    {st.rollno} - {st.name} ({st.registration_no})
                  </option>
                ))}
              </select>
            )}
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
                      {matrixSubjects.map((sub, idx) => (
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
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentUid(st.registration_no);
                              setSelectedStudentName(st.name);
                              setSelectedStudentRoll(st.rollno);
                              setViewMode('STUDENT');
                            }}
                            className="hover:text-[#5B4BFF] hover:underline text-left cursor-pointer transition-colors truncate max-w-[160px] block"
                          >
                            {st.name}
                          </button>
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

                        {/* Subject Attendance Badges */}
                        {matrixSubjects.map((sub) => {
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
                              parseFloat(st.TotalPresentPercentage) >= 75
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : parseFloat(st.TotalPresentPercentage) >= 50
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {st.TotalPresentPercentage}
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
