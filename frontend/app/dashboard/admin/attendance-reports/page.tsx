'use client';

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

interface College {
  id?: string;
  colg_cd?: number | string;
  code: string;
  name: string;
  slug?: string;
}

interface CourseItem {
  id?: string;
  code: string;
  name: string;
  colg_cd?: string;
}

interface BranchItem {
  id?: string;
  code: string;
  name: string;
  course_cd?: string;
  colg_cd?: string;
}

interface BatchItem {
  id?: string;
  code: string;
  name?: string;
  year?: number;
  course_cd?: string;
  colg_cd?: string;
}

interface Subject {
  id: string;
  code: string;
  name: string;
  subject_cd?: string;
}

interface StudentReportRow {
  student_id: string;
  rollno?: string;
  registration_no?: string;
  name: string;
  total_classes: number;
  present: number;
  absent: number;
  late?: number;
  excused?: number;
  attendance_pct: number | string;
  subject_sessions?: any[];
}

interface MatrixReportData {
  subjects: Subject[];
  students: {
    student_id: string;
    rollno?: string;
    registration_no?: string;
    name: string;
    subjects: Record<string, { total: number; present: number; pct: number; raw?: string }>;
    totalClasses: number;
    totalPresent: number;
    overallPct: number;
  }[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

const getInitialColgCd = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('colg_cd') || localStorage.getItem('colgCd') || '1';
  }
  return '1';
};

const getTenantSlug = (): string => {
  if (typeof window !== 'undefined') {
    const raw = (
      localStorage.getItem('tenantSlug') ||
      localStorage.getItem('selectedTenant') ||
      localStorage.getItem('institutionSlug') ||
      localStorage.getItem('tenant') ||
      'srms-cet-bareilly'
    ).replace(/^tenant_/, '').replace(/^tenant-/, '').trim();
    if (raw === 'srms-cet') return 'srms-cet-bareilly';
    if (raw === 'srms-cetr') return 'srms-cetr-bareilly';
    return raw || 'srms-cet-bareilly';
  }
  return 'srms-cet-bareilly';
};

export default function MISAttendanceReportsPage() {
  // Cascading Academic Hierarchy States
  const [colleges, setColleges] = useState<College[]>([]);
  const [userRole, setUserRole] = useState<string>('ADMIN');
  const [selectedCollege, setSelectedCollege] = useState<string>(getInitialColgCd);
  const [selectedTenantSlug, setSelectedTenantSlug] = useState<string>(getTenantSlug);

  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('13'); // Default BCA

  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('1'); // Default BCA General

  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('2'); // Default 2025

  const [selectedSem, setSelectedSem] = useState<string>('3'); // Default Semester 3
  const [selectedSection, setSelectedSection] = useState<string>('1');

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');

  // Date Range States
  const [fromDate, setFromDate] = useState<string>('2026-07-02');
  const [toDate, setToDate] = useState<string>('2026-08-21');
  const [reportMode, setReportMode] = useState<'roster' | 'matrix' | 'shortage'>('roster');
  const [thresholdFilter, setThresholdFilter] = useState<'all' | 'shortage' | 'critical' | 'eligible'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Report Data
  const [rosterReport, setRosterReport] = useState<StudentReportRow[]>([]);
  const [matrixReport, setMatrixReport] = useState<MatrixReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Initial Load & Auth Role Resolution
  useEffect(() => {
    fetchCollegesAndInitialHierarchy();
  }, []);

  const dedupeBy = <T,>(arr: T[], keyFn: (item: T) => string): T[] => {
    const seen = new Set<string>();
    return (arr || []).filter((item) => {
      if (!item) return false;
      const key = keyFn(item);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const fetchCollegesAndInitialHierarchy = async () => {
    let roleVal = 'ADMIN';
    let userColg = getInitialColgCd();
    let slug = getTenantSlug();

    if (typeof window !== 'undefined') {
      roleVal = (
        localStorage.getItem('role') ||
        localStorage.getItem('auth_role') ||
        localStorage.getItem('user_role') ||
        'ADMIN'
      ).toUpperCase();
      userColg = localStorage.getItem('colg_cd') || localStorage.getItem('colgCd') || '1';
      slug = getTenantSlug();
      setUserRole(roleVal);
      setSelectedCollege(userColg);
      setSelectedTenantSlug(slug);
    }

    try {
      const colRes = await fetch('/api/srms/colleges').catch(() => null);
      let loadedColleges: College[] = [];

      if (colRes && colRes.ok) {
        const j = await colRes.json();
        const list = Array.isArray(j) ? j : j.data || [];
        const mappedList: College[] = list.map((c: any) => ({
          id: String(c.colg_cd || c.code || '1'),
          code: String(c.colg_cd || c.code || '1'),
          name: c.colg_name || c.name || `College ${c.colg_cd || 1}`,
          slug: c.slug || slug,
        }));

        if (roleVal !== 'SUPER_ADMIN') {
          const myCol = mappedList.find(
            (c: any) => String(c.code) === String(userColg) || String(c.id) === String(userColg)
          );
          loadedColleges = myCol
            ? [myCol]
            : [{ id: userColg, code: userColg, name: 'SRMS CET, BAREILLY', slug }];
          setSelectedCollege(loadedColleges[0].code || '1');
        } else {
          loadedColleges = mappedList;
        }
        setColleges(loadedColleges);
      } else {
        const defaultCol: College[] = [{ id: userColg, code: userColg, name: 'SRMS CET, BAREILLY', slug }];
        setColleges(defaultCol);
        setSelectedCollege(userColg);
      }

      // Fetch Courses for active college
      await fetchCoursesForCollege(userColg, slug);
    } catch (e) {
      console.error('Failed to initialize colleges and metadata:', e);
    }
  };

  const fetchCoursesForCollege = async (colgCd: string, slug?: string) => {
    const tenant = slug || selectedTenantSlug || getTenantSlug();
    try {
      const res = await fetch(`/api/srms/courses?colgcd=${colgCd}&tenant=${tenant}`).catch(() => null);
      if (res && res.ok) {
        const j = await res.json();
        const list = Array.isArray(j) ? j : j.data || [];
        const mappedCourses: CourseItem[] = list.map((c: any) => ({
          id: String(c.course_cd || c.code || '13'),
          code: String(c.course_cd || c.code || '13'),
          name: c.course_name || c.name || `Course ${c.course_cd || 13}`,
          colg_cd: String(c.colg_cd || colgCd),
        }));

        setCourses(mappedCourses);
        if (mappedCourses.length > 0) {
          const crsToUse = selectedCourse && mappedCourses.some((c) => c.code === selectedCourse)
            ? selectedCourse
            : mappedCourses[0].code;
          setSelectedCourse(crsToUse);
          await fetchBranchesAndBatches(colgCd, crsToUse, mappedCourses, tenant);
        }
        return mappedCourses;
      }
    } catch (e) {
      console.warn('Failed to fetch courses:', e);
    }
    setCourses([]);
    return [];
  };

  const fetchBranchesAndBatches = async (
    colgCd: string,
    courseCd: string,
    customCourses?: CourseItem[],
    slug?: string
  ) => {
    const tenant = slug || selectedTenantSlug || getTenantSlug();
    const effectiveColg = colgCd || selectedCollege || '1';
    const effectiveCrs = courseCd || selectedCourse || '13';
    const activeCourses = customCourses || courses;

    try {
      const [brRes, btRes, subRes] = await Promise.all([
        fetch(`/api/srms/branches?colgcd=${effectiveColg}&coursecd=${effectiveCrs}&tenant=${tenant}`).catch(() => null),
        fetch(`/api/srms/batches?colgcd=${effectiveColg}&coursecd=${effectiveCrs}&tenant=${tenant}`).catch(() => null),
        fetch(`${API_BASE}/admin-master/subjects?tenant=${tenant}`).catch(() => null),
      ]);

      // 1. Branches Mapping with fallback for BCA and '-'
      if (brRes && brRes.ok) {
        const j = await brRes.json();
        const list = Array.isArray(j) ? j : j.data || [];
        const courseObj = activeCourses.find(
          (c) => String(c.code) === String(effectiveCrs) || String(c.id) === String(effectiveCrs)
        );
        const courseName = (courseObj?.name || (effectiveCrs === '13' ? 'BCA' : 'Course'))
          .replace(/^\[#\d+\]\s*/, '')
          .trim();

        const mappedBranches: BranchItem[] = (Array.isArray(list) && list.length > 0 ? list : []).map((b: any) => {
          const rawName = (b.branch_name || b.name || '').trim();
          const validName =
            rawName && rawName !== '-' && rawName !== 'null' && rawName !== 'NONE'
              ? rawName
              : `${(b.course_name || courseName).replace(/^\[#\d+\]\s*/, '').trim()} General`;
          return {
            id: String(b.branch_cd || b.code || '1'),
            code: String(b.branch_cd || b.code || '1'),
            name: validName,
            course_cd: String(b.course_cd || effectiveCrs),
            colg_cd: String(b.colg_cd || effectiveColg),
          };
        });

        if (mappedBranches.length > 0) {
          setBranches(mappedBranches);
          setSelectedBranch((prev) => {
            const exists = mappedBranches.some((b) => String(b.code) === String(prev));
            return exists ? prev : mappedBranches[0].code;
          });
        } else {
          const fallback = [{ id: '1', code: '1', name: `${courseName} General`, course_cd: effectiveCrs, colg_cd: effectiveColg }];
          setBranches(fallback);
          setSelectedBranch('1');
        }
      } else {
        const courseObj = activeCourses.find(
          (c) => String(c.code) === String(effectiveCrs) || String(c.id) === String(effectiveCrs)
        );
        const courseName = (courseObj?.name || 'BCA').replace(/^\[#\d+\]\s*/, '').trim();
        const fallback = [{ id: '1', code: '1', name: `${courseName} General`, course_cd: effectiveCrs, colg_cd: effectiveColg }];
        setBranches(fallback);
        setSelectedBranch('1');
      }

      // 2. Batches Mapping
      if (btRes && btRes.ok) {
        const j = await btRes.json();
        const list = Array.isArray(j) ? j : j.data || [];
        const mappedBatches: BatchItem[] = list.map((b: any) => ({
          id: String(b.batch_cd || b.code || b.batch_id || '2'),
          code: String(b.batch_cd || b.code || b.batch_id || '2'),
          name: String(b.batch_name || b.name || b.year || b.batch_cd || '2025'),
          year: Number(b.batch_name || b.year || 2025),
          course_cd: String(b.course_cd || effectiveCrs),
          colg_cd: String(b.colg_cd || effectiveColg),
        }));

        if (mappedBatches.length > 0) {
          setBatches(mappedBatches);
          setSelectedBatch((prev) => {
            const exists = mappedBatches.some((b) => String(b.code) === String(prev));
            return exists ? prev : mappedBatches[0].code;
          });
        }
      }

      // 3. Subjects Mapping
      if (subRes && subRes.ok) {
        const j = await subRes.json();
        const list = Array.isArray(j) ? j : j.data || [];
        const mappedSubs = list.map((s: any) => ({
          id: String(s.subject_cd || s.id || s.code),
          code: String(s.code || s.subject_cd || s.id),
          name: s.name || s.subject_name || `Subject ${s.code}`,
        }));
        setSubjects(mappedSubs);
      }
    } catch (err) {
      console.warn('Failed to fetch branches & batches:', err);
    }
  };

  // Change Handlers
  const handleCollegeChange = async (colgCode: string) => {
    setSelectedCollege(colgCode);
    const foundCol = colleges.find((c) => c.code === colgCode);
    const slug = foundCol?.slug || selectedTenantSlug;
    await fetchCoursesForCollege(colgCode, slug);
  };

  const handleCourseChange = async (courseCode: string) => {
    setSelectedCourse(courseCode);
    await fetchBranchesAndBatches(selectedCollege, courseCode);
  };

  // Fetch Report Data from Live SRMS + PostgreSQL Fallback
  const fetchReport = async () => {
    setLoading(true);
    const slug = selectedTenantSlug || getTenantSlug();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const headers = { Authorization: `Bearer ${token}`, 'x-tenant-slug': slug };

    try {
      // 1. Attempt Live SRMS Attendance POST
      const srmsPayload = {
        colg_cd: Number(selectedCollege || 1),
        course_cd: Number(selectedCourse || 13),
        branch_cd: Number(selectedBranch || 1),
        batch_cd: Number(selectedBatch || 2),
        sem_cd: Number(selectedSem || 3),
        section_cd: Number(selectedSection || 1),
        fdt: fromDate,
        tdt: toDate,
      };

      const srmsRes = await fetch('/api/srms/student-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(srmsPayload),
      }).catch(() => null);

      if (srmsRes && srmsRes.ok) {
        const json = await srmsRes.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const subList: Subject[] = (json.subjectList || []).map((s: any) => ({
            id: String(s.sub_cd || s.id || s.code),
            code: String(s.sub_cd || s.code || s.id),
            name: s.sub_name || s.name || `Subject ${s.sub_cd}`,
          }));

          if (subList.length > 0) {
            setSubjects(subList);
          }

          const rawStudents = json.data;
          const matrixStudents = rawStudents.map((stud: any) => {
            const attRecord: Record<string, any> = {};
            let totalPresent = 0;
            let totalConducted = 0;

            subList.forEach((sub) => {
              const val = stud[sub.name] || stud[sub.code];
              if (val && typeof val === 'string') {
                const match = val.match(/(\d+)\/(\d+)\s*\(([\d.]+)%\)/);
                if (match) {
                  const p = parseInt(match[1], 10);
                  const t = parseInt(match[2], 10);
                  totalPresent += p;
                  totalConducted += t;
                  attRecord[sub.id] = {
                    total: t,
                    present: p,
                    pct: parseFloat(match[3]),
                    raw: val,
                  };
                } else {
                  attRecord[sub.id] = { total: 0, present: 0, pct: 0, raw: val };
                }
              } else {
                attRecord[sub.id] = { total: 0, present: 0, pct: 0, raw: '—' };
              }
            });

            const overallPct = totalConducted > 0
              ? parseFloat(((totalPresent / totalConducted) * 100).toFixed(1))
              : parseFloat(String(stud.TotalPresentPercentage || '0').replace('%', ''));

            return {
              student_id: String(stud.stud_reg_no || stud.stud_roll_no || Math.random()),
              rollno: stud.stud_roll_no || stud.stud_reg_no,
              registration_no: stud.stud_reg_no,
              name: stud.stud_name || 'Student',
              subjects: attRecord,
              totalClasses: totalConducted,
              totalPresent: totalPresent,
              overallPct: overallPct,
            };
          });

          // Set Matrix Report
          setMatrixReport({
            subjects: subList,
            students: matrixStudents,
          });

          // Set Roster Report
          const rosterStudents: StudentReportRow[] = rawStudents.map((stud: any) => {
            let pCount = 0;
            let tCount = 0;
            if (selectedSubjectId !== 'all') {
              const subObj = subList.find((s) => s.id === selectedSubjectId || s.code === selectedSubjectId);
              const val = subObj ? stud[subObj.name] : null;
              if (val && typeof val === 'string') {
                const match = val.match(/(\d+)\/(\d+)\s*\(([\d.]+)%\)/);
                if (match) {
                  pCount = parseInt(match[1], 10);
                  tCount = parseInt(match[2], 10);
                }
              }
            } else {
              subList.forEach((sub) => {
                const val = stud[sub.name];
                if (val && typeof val === 'string') {
                  const match = val.match(/(\d+)\/(\d+)/);
                  if (match) {
                    pCount += parseInt(match[1], 10);
                    tCount += parseInt(match[2], 10);
                  }
                }
              });
            }

            const pct = tCount > 0
              ? ((pCount / tCount) * 100).toFixed(1)
              : String(stud.TotalPresentPercentage || '0').replace('%', '');

            return {
              student_id: String(stud.stud_reg_no || stud.stud_roll_no || Math.random()),
              rollno: stud.stud_roll_no || stud.stud_reg_no,
              registration_no: stud.stud_reg_no,
              name: stud.stud_name || 'Student',
              total_classes: tCount,
              present: pCount,
              absent: Math.max(0, tCount - pCount),
              attendance_pct: pct,
            };
          });

          setRosterReport(rosterStudents);
          setLoading(false);
          return;
        }
      }

      // 2. PostgreSQL Fallback
      if (selectedBatch) {
        let mUrl = `${API_BASE}/attendance/batches/${selectedBatch}/matrix-report?tenant=${slug}`;
        if (fromDate) mUrl += `&fromDate=${fromDate}`;
        if (toDate) mUrl += `&toDate=${toDate}`;

        let rUrl = `${API_BASE}/attendance/batches/${selectedBatch}/report?tenant=${slug}`;
        if (selectedSubjectId !== 'all') rUrl += `&subjectId=${selectedSubjectId}`;
        if (fromDate) rUrl += `&fromDate=${fromDate}`;
        if (toDate) rUrl += `&toDate=${toDate}`;

        const [mRes, rRes] = await Promise.all([
          fetch(mUrl, { headers }).catch(() => null),
          fetch(rUrl, { headers }).catch(() => null),
        ]);

        if (mRes && mRes.ok) {
          const json = await mRes.json();
          const extractedData = json.data !== undefined ? json.data : json;
          setMatrixReport(extractedData || null);
        }

        if (rRes && rRes.ok) {
          const json = await rRes.json();
          const extractedData = json.data !== undefined ? json.data : json;
          setRosterReport(Array.isArray(extractedData) ? extractedData : []);
        }
      }
    } catch (e) {
      console.error('Failed to fetch attendance reports:', e);
    } finally {
      setLoading(false);
    }
  };

  // Trigger report fetch on criteria changes
  useEffect(() => {
    if (selectedCollege && selectedCourse && selectedBranch && selectedBatch) {
      fetchReport();
    }
  }, [selectedCollege, selectedCourse, selectedBranch, selectedBatch, selectedSem, selectedSubjectId, fromDate, toDate]);

  // Preset Date Periods
  const applyPreset = (preset: 'month' | 'last30' | 'term') => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setFromDate(firstDay.toISOString().split('T')[0]);
      setToDate(lastDay.toISOString().split('T')[0]);
    } else if (preset === 'last30') {
      const past30 = new Date(today);
      past30.setDate(today.getDate() - 30);
      setFromDate(past30.toISOString().split('T')[0]);
      setToDate(todayStr);
    } else if (preset === 'term') {
      setFromDate('2026-07-02');
      setToDate('2026-08-21');
    }
  };

  // Filtered Roster Rows based on Threshold & Search
  const filteredRoster = useMemo(() => {
    return rosterReport.filter((row) => {
      const pct = parseFloat(String(row.attendance_pct || 0));
      const matchThreshold =
        thresholdFilter === 'all' ||
        (thresholdFilter === 'shortage' && pct < 75) ||
        (thresholdFilter === 'critical' && pct < 70) ||
        (thresholdFilter === 'eligible' && pct >= 75);

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (row.name || '').toLowerCase().includes(q) ||
        (row.rollno || '').toLowerCase().includes(q) ||
        (row.registration_no || '').toLowerCase().includes(q);

      return matchThreshold && matchSearch;
    });
  }, [rosterReport, thresholdFilter, searchQuery]);

  // Filtered Matrix Students based on Threshold & Search
  const filteredMatrixStudents = useMemo(() => {
    if (!matrixReport || !Array.isArray(matrixReport.students)) return [];
    return matrixReport.students.filter((st) => {
      const pct = st.overallPct;
      const matchThreshold =
        thresholdFilter === 'all' ||
        (thresholdFilter === 'shortage' && pct < 75) ||
        (thresholdFilter === 'critical' && pct < 70) ||
        (thresholdFilter === 'eligible' && pct >= 75);

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (st.name || '').toLowerCase().includes(q) ||
        (st.rollno || '').toLowerCase().includes(q) ||
        (st.registration_no || '').toLowerCase().includes(q);

      return matchThreshold && matchSearch;
    });
  }, [matrixReport, thresholdFilter, searchQuery]);

  // Computed KPI Metrics
  const totalEnrolled = rosterReport.length || (matrixReport?.students?.length ?? 0);
  const shortageCount = rosterReport.filter((r) => parseFloat(String(r.attendance_pct || 0)) < 75).length;
  const avgAttendance = totalEnrolled > 0
    ? (
        rosterReport.reduce((acc, r) => acc + parseFloat(String(r.attendance_pct || 0)), 0) / totalEnrolled
      ).toFixed(1)
    : '0.0';

  // Export CSV
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (reportMode === 'matrix' && matrixReport) {
      headers = ['S.No', 'Reg No / Roll No', 'Student Name', ...matrixReport.subjects.map((s) => `${s.name} (${s.code})`), 'Cumulative %'];
      rows = filteredMatrixStudents.map((st, idx) => [
        `"${idx + 1}"`,
        `"${st.rollno || st.registration_no || ''}"`,
        `"${st.name}"`,
        ...matrixReport.subjects.map((sub) => {
          const info = st.subjects[sub.id] || st.subjects[sub.code];
          return info && info.total > 0 ? `"${info.present}/${info.total} (${info.pct}%)"` : `"—"`;
        }),
        `"${st.overallPct}%"`,
      ]);
    } else {
      headers = ['S.No', 'Reg No / Roll No', 'Student Name', 'Conducted Classes', 'Present', 'Absent', 'Attendance %', 'NMC Compliance Status'];
      rows = filteredRoster.map((r, idx) => [
        `"${idx + 1}"`,
        `"${r.rollno || r.registration_no || ''}"`,
        `"${r.name}"`,
        `"${r.total_classes}"`,
        `"${r.present}"`,
        `"${r.absent}"`,
        `"${r.attendance_pct}%"`,
        `"${Number(r.attendance_pct) >= 75 ? 'ELIGIBLE (≥ 75%)' : 'SHORTAGE (< 75%)'}"`,
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MIS_Attendance_Report_${selectedCourse}_Batch_${selectedBatch}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedColgName = colleges.find((c) => c.code === selectedCollege)?.name || 'SRMS CET, BAREILLY';
  const selectedCourseName = courses.find((c) => c.code === selectedCourse)?.name || 'BCA';
  const selectedBranchName = branches.find((b) => b.code === selectedBranch)?.name || 'BCA General';
  const selectedBatchName = batches.find((b) => b.code === selectedBatch)?.name || selectedBatch;

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="MIS ATTENDANCE & ACADEMIC COMPLIANCE PORTAL" />

        <main className="p-6 space-y-6 flex-1 flex flex-col">
          {/* Main Top Header Banner */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-slate-900/90 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 text-xl font-bold">
                  📈
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      MIS Student Attendance Reports
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      EXECUTIVE DASHBOARD
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Multi-subject cumulative matrixes, subject rosters, date-range analytics, and NMC 75% shortage detention tracking.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-all shadow-sm flex items-center gap-1.5"
              >
                <span>📥</span> Export CSV Roster
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-black text-white shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-1.5"
              >
                <span>🖨️</span> Print MIS Report
              </button>
            </div>
          </div>

          {/* KPI Analytics Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1 shadow-md hover:shadow-lg transition-all">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Students Enrolled</span>
              <p className="text-3xl font-black text-slate-900 dark:text-white font-mono">{totalEnrolled}</p>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Active Batch Roster</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1 shadow-md hover:shadow-lg transition-all">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Batch Average Attendance</span>
              <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono">{avgAttendance}%</p>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-bold">Overall Academic Average</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1 shadow-md hover:shadow-lg transition-all">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Shortage List (&lt; 75%)</span>
              <p className="text-3xl font-black text-rose-600 dark:text-rose-400 font-mono">{shortageCount}</p>
              <span className="text-[10px] text-rose-600 dark:text-rose-400 block font-bold">Ineligible for University Exams</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1 shadow-md hover:shadow-lg transition-all">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Exam Compliant (≥ 75%)</span>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{Math.max(0, totalEnrolled - shortageCount)}</p>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-bold">Eligible Students</span>
            </div>
          </div>

          {/* ─── CASCADING FILTER CONTROLS BAR (Photo 1 & Placement Design) ─── */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
              {/* Report Mode Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setReportMode('roster')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    reportMode === 'roster' && thresholdFilter !== 'shortage'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  📚 Subject Roster Report
                </button>
                <button
                  onClick={() => setReportMode('matrix')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    reportMode === 'matrix'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  📐 Cumulative Subject Matrix
                </button>
                <button
                  onClick={() => {
                    setReportMode('roster');
                    setThresholdFilter('shortage');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    thresholdFilter === 'shortage'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400'
                  }`}
                >
                  🚨 Detention Shortage List
                </button>
              </div>

              {/* Date Presets */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Quick Range:</span>
                <button
                  onClick={() => applyPreset('month')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-all"
                >
                  This Month
                </button>
                <button
                  onClick={() => applyPreset('last30')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-all"
                >
                  Last 30 Days
                </button>
                <button
                  onClick={() => applyPreset('term')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-all"
                >
                  Full Term
                </button>
              </div>
            </div>

            {/* Cascading Hierarchy 6-Column Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              {/* 1. College (Locked for non-SuperAdmin) */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                  <span>🏛️</span> 1. College
                </label>
                <div className="relative flex items-center">
                  <select
                    value={selectedCollege}
                    disabled={userRole !== 'SUPER_ADMIN'}
                    onChange={(e) => handleCollegeChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold disabled:cursor-not-allowed appearance-none cursor-pointer truncate pr-14 focus:ring-2 focus:ring-indigo-500"
                  >
                    {colleges.map((c) => (
                      <option key={c.id || c.code} value={c.code}>
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
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                  <span>🎓</span> 2. Course <span className="text-indigo-600 dark:text-indigo-400">({courses.length})</span>
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold cursor-pointer truncate focus:ring-2 focus:ring-indigo-500"
                >
                  {courses.map((cr) => (
                    <option key={cr.id || cr.code} value={cr.code}>
                      [#{cr.code}] {cr.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Branch */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                  <span>🏢</span> 3. Branch <span className="text-indigo-600 dark:text-indigo-400">({branches.length})</span>
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold cursor-pointer truncate focus:ring-2 focus:ring-indigo-500"
                >
                  {branches.map((br) => (
                    <option key={br.id || br.code} value={br.code}>
                      [#{br.code}] {br.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Batch */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                  <span>👥</span> 4. Batch <span className="text-indigo-600 dark:text-indigo-400">({batches.length})</span>
                </label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold cursor-pointer truncate focus:ring-2 focus:ring-indigo-500"
                >
                  {batches.map((b) => (
                    <option key={b.id || b.code} value={b.code}>
                      [#{b.code}] {b.name || b.year || `Batch ${b.code}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Semester */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                  <span>📖</span> 5. Semester
                </label>
                <select
                  value={selectedSem}
                  onChange={(e) => setSelectedSem(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 font-bold cursor-pointer focus:ring-2 focus:ring-indigo-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={String(sem)}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. Subject Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                  <span>🌐</span> 6. Subject Filter
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold cursor-pointer truncate focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Subjects Combined</option>
                  {subjects.map((s) => (
                    <option key={s.id || s.code} value={s.id || s.code}>
                      [{s.code}] {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Secondary Controls: Date Range, Search & Compliance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-3 border-t border-slate-200 dark:border-slate-800">
              {/* From Date */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">📅 From Date (fdt)</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {/* To Date */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">📅 To Date (tdt)</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {/* Search Student Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">🔍 Search Student</label>
                <input
                  type="text"
                  placeholder="Filter name, rollno, reg..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Threshold Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">⚠️ Compliance Threshold</label>
                <select
                  value={thresholdFilter}
                  onChange={(e) => setThresholdFilter(e.target.value as any)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">All Students (100% Roster)</option>
                  <option value="shortage">🚨 Shortage List (&lt; 75% Attendance)</option>
                  <option value="critical">🔴 Critical Shortage (&lt; 70% Attendance)</option>
                  <option value="eligible">✅ Fully Eligible (≥ 75% Attendance)</option>
                </select>
              </div>
            </div>

            {/* Fetch Action Button Bar */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                <span>Filter context:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedCourseName}</span>
                <span>•</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedBranchName}</span>
                <span>•</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Batch {selectedBatchName}</span>
                <span>•</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">Semester {selectedSem}</span>
              </div>

              <button
                onClick={fetchReport}
                disabled={loading}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 shrink-0 disabled:opacity-50 cursor-pointer active:scale-95"
              >
                <span>⚡</span> {loading ? 'Fetching Attendance Data...' : 'Get Attendance Data'}
              </button>
            </div>
          </div>

          {/* ─── PRINTABLE ATTENDANCE REPORT SECTION ─── */}
          <div id="attendance-report-print-area" className="space-y-4">
            {/* Printable Official Institutional Header */}
            <div className="hidden print:block mb-4 text-center border-b-2 border-slate-900 pb-3">
              <h1 className="text-base font-black uppercase text-slate-900 tracking-wider">
                {selectedColgName}
              </h1>
              <h2 className="text-xs font-extrabold uppercase text-slate-700 tracking-tight mt-0.5">
                MIS STUDENT ATTENDANCE & ACADEMIC COMPLIANCE REPORT
              </h2>
              <div className="grid grid-cols-3 text-[10px] text-slate-700 font-semibold mt-2 pt-1.5 border-t border-slate-300 text-left gap-1">
                <div><strong>Course &amp; Branch:</strong> {selectedCourseName} ({selectedBranchName})</div>
                <div><strong>Batch:</strong> Batch {selectedBatchName} (Sem {selectedSem})</div>
                <div><strong>Duration:</strong> {fromDate} to {toDate}</div>
                <div><strong>Report Type:</strong> {reportMode === 'roster' ? 'Subject Roster Report' : 'Cumulative Subject Matrix'}</div>
                <div><strong>Compliance Status:</strong> {thresholdFilter === 'all' ? 'All Students' : thresholdFilter === 'shortage' ? 'Shortage (< 75%)' : thresholdFilter === 'critical' ? 'Critical (< 70%)' : 'Eligible (≥ 75%)'}</div>
                <div><strong>Generated On:</strong> {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>

            {/* REPORT VIEW 1: SUBJECT ROSTER REPORT */}
            {reportMode === 'roster' && (
              <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl print:border-none print:shadow-none print:rounded-none">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between print:hidden">
                  <h3 className="text-xs font-black uppercase text-purple-700 dark:text-purple-400 tracking-wider flex items-center gap-2">
                    <span>📚</span> Subject Roster Attendance Report ({filteredRoster.length} Records)
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    NMC / UGC Standard: 75% Attendance Requirement
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs text-slate-800 dark:text-slate-300">
                    <thead className="bg-slate-100/80 dark:bg-slate-950/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 print:bg-slate-100 print:text-slate-900">
                      <tr>
                        <th className="p-3.5 text-center w-12">S.No</th>
                        <th className="p-3.5">Reg No / Roll No</th>
                        <th className="p-3.5">Student Name</th>
                        <th className="p-3.5 text-center">Conducted Classes</th>
                        <th className="p-3.5 text-center">Present / Absent</th>
                        <th className="p-3.5 text-center">Attendance %</th>
                        <th className="p-3.5 text-center">Compliance Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60 font-medium print:divide-slate-300">
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400 font-bold animate-pulse">
                            Generating MIS subject attendance report...
                          </td>
                        </tr>
                      ) : filteredRoster.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                            No student attendance records match the selected filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredRoster.map((r, idx) => {
                          const pct = parseFloat(String(r.attendance_pct || 0));
                          const isEligible = pct >= 75.0;

                          return (
                            <tr key={r.student_id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-3.5 text-center font-mono text-slate-500 dark:text-slate-400 font-bold print:text-slate-900">{idx + 1}</td>
                              <td className="p-3.5 font-mono text-indigo-600 dark:text-indigo-400 font-bold print:text-slate-900">
                                {r.registration_no || r.rollno || '—'}
                              </td>
                              <td className="p-3.5 font-bold text-slate-900 dark:text-white print:text-black">{r.name}</td>
                              <td className="p-3.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300 print:text-slate-900">{r.total_classes || 0}</td>
                              <td className="p-3.5 text-center">
                                <div className="flex items-center justify-center gap-1.5 font-mono font-bold text-xs">
                                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 print:bg-transparent print:text-slate-900">
                                    P: {Number(r.present || 0)}
                                  </span>
                                  <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30 print:bg-transparent print:text-slate-900">
                                    A: {Number(r.absent || 0)}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3.5 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-black font-mono border ${
                                  isEligible
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 print:bg-transparent print:text-slate-900'
                                    : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40 print:bg-transparent print:text-slate-900'
                                }`}>
                                  {pct.toFixed(1)}%
                                </span>
                              </td>
                              <td className="p-3.5 text-center">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${
                                  isEligible
                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 print:bg-transparent print:text-slate-900'
                                    : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 print:bg-transparent print:text-slate-900'
                                }`}>
                                  {isEligible ? 'ELIGIBLE (≥ 75%)' : 'SHORTAGE (< 75%)'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REPORT VIEW 2: CUMULATIVE MULTI-SUBJECT MATRIX REPORT */}
            {reportMode === 'matrix' && (
              <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl print:border-none print:shadow-none print:rounded-none">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between print:hidden">
                  <h3 className="text-xs font-black uppercase text-indigo-700 dark:text-indigo-400 tracking-wider flex items-center gap-2">
                    <span>📐</span> Multi-Subject Cumulative Attendance Matrix ({filteredMatrixStudents.length} Students)
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    Per-subject breakdown + Cumulative %
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs text-slate-800 dark:text-slate-300">
                    <thead className="bg-slate-100/80 dark:bg-slate-950/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 print:bg-slate-100 print:text-slate-900">
                      <tr>
                        <th className="p-3.5 text-center w-12">S.No</th>
                        <th className="p-3.5">Reg No / Roll No</th>
                        <th className="p-3.5">Student Name</th>
                        {(matrixReport?.subjects || []).map((sub) => (
                          <th key={sub.id || sub.code} className="p-3.5 text-center">
                            {sub.name} <br />
                            <span className="text-[9px] text-slate-500 font-normal">({sub.code})</span>
                          </th>
                        ))}
                        <th className="p-3.5 text-center">Cumulative Attendance %</th>
                        <th className="p-3.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60 font-medium print:divide-slate-300">
                      {loading ? (
                        <tr>
                          <td colSpan={5 + (matrixReport?.subjects?.length || 0)} className="p-8 text-center text-slate-500 dark:text-slate-400 font-bold animate-pulse">
                            Generating Multi-Subject Cumulative Attendance Matrix...
                          </td>
                        </tr>
                      ) : filteredMatrixStudents.length === 0 ? (
                        <tr>
                          <td colSpan={5 + (matrixReport?.subjects?.length || 0)} className="p-8 text-center text-slate-500 italic">
                            No student matrix attendance records found.
                          </td>
                        </tr>
                      ) : (
                        filteredMatrixStudents.map((st, idx) => {
                          const isEligible = st.overallPct >= 75.0;
                          return (
                            <tr key={st.student_id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-3.5 text-center font-mono text-slate-500 dark:text-slate-400 font-bold print:text-slate-900">{idx + 1}</td>
                              <td className="p-3.5 font-mono text-indigo-600 dark:text-indigo-400 font-bold print:text-slate-900">
                                {st.registration_no || st.rollno || '—'}
                              </td>
                              <td className="p-3.5 font-bold text-slate-900 dark:text-white print:text-black">{st.name}</td>
                              {(matrixReport?.subjects || []).map((sub) => {
                                const info = st.subjects[sub.id] || st.subjects[sub.code] || st.subjects[sub.name];
                                if (!info || info.total === 0) {
                                  return (
                                    <td key={sub.id || sub.code} className="p-3.5 text-center font-mono text-slate-400">
                                      —
                                    </td>
                                  );
                                }
                                return (
                                  <td key={sub.id || sub.code} className="p-3.5 text-center font-mono">
                                    <span className="font-bold text-slate-900 dark:text-white">{info.present}/{info.total}</span>
                                    <span className={`block text-[10px] font-black ${info.pct >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                      ({info.pct}%)
                                    </span>
                                  </td>
                                );
                              })}
                              <td className="p-3.5 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-black font-mono border ${
                                  isEligible
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 print:bg-transparent print:text-slate-900'
                                    : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40 print:bg-transparent print:text-slate-900'
                                }`}>
                                  {st.overallPct}%
                                </span>
                              </td>
                              <td className="p-3.5 text-center">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${
                                  isEligible
                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 print:bg-transparent print:text-slate-900'
                                    : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 print:bg-transparent print:text-slate-900'
                                }`}>
                                  {isEligible ? 'ELIGIBLE' : 'SHORTAGE'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
