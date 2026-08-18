'use client';

import { useState, useEffect, useMemo } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

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

interface MatrixStudent {
  s_no: number;
  college: string;
  rollno: string;
  registration_no: string;
  name: string;
  course: string;
  batch: string;
  semester: string;
  attendance: Record<string, { present: number; total: number; percentage: number } | null>;
}

interface DropdownItem {
  id: string;
  code: string;
  name: string;
}

export default function AttendancePortal({ role = 'STUDENT' }: { role?: string }) {
  // Cascading Academic States
  const [collegesList, setCollegesList] = useState<DropdownItem[]>([]);
  const [coursesList, setCoursesList] = useState<DropdownItem[]>([]);
  const [branchesList, setBranchesList] = useState<DropdownItem[]>([]);
  const [batchesList, setBatchesList] = useState<DropdownItem[]>([]);

  const [selectedCollege, setSelectedCollege] = useState('1');
  const [selectedCourse, setSelectedCourse] = useState('13'); // BCA / B.Tech
  const [selectedBranch, setSelectedBranch] = useState('1');
  const [selectedBatch, setSelectedBatch] = useState('18');

  // Academic Year Tab State
  const [activeYearTab, setActiveYearTab] = useState<'Y1' | 'Y2' | 'Y3' | 'Y4'>('Y2');

  // Semester & Section States
  const [semestersList, setSemestersList] = useState<{ sem_cd: number; SemName: string }[]>([]);
  const [selectedSem, setSelectedSem] = useState('3');
  const [selectedSection, setSelectedSection] = useState('1'); // Section A = 1

  // View Mode: 'MATRIX' (Multi-Subject Grid as in reference screenshot) vs 'STUDENT' (Single Student Card Breakdown)
  const [viewMode, setViewMode] = useState<'MATRIX' | 'STUDENT'>('MATRIX');

  // Matrix Data States
  const [matrixSubjects, setMatrixSubjects] = useState<{ sub_cd: string; sub_name: string }[]>([]);
  const [matrixStudents, setMatrixStudents] = useState<MatrixStudent[]>([]);
  const [matrixSearchQuery, setMatrixSearchQuery] = useState('');
  const [loadingMatrix, setLoadingMatrix] = useState(false);

  // Student Resolution (dynamic list for selector)
  const [selectedStudentUid, setSelectedStudentUid] = useState('2024106259');
  const [selectedStudentName, setSelectedStudentName] = useState('SAMRIDDHI YADAV');
  const [selectedStudentRoll, setSelectedStudentRoll] = useState('2500141790001');

  // Individual Student Attendance Data
  const [summaryData, setSummaryData] = useState<SubjectSummary[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Drill-Down Lecture Modal States
  const [activeSubjectForDrilldown, setActiveSubjectForDrilldown] = useState<{
    sub_cd: string;
    sub_name: string;
    student_name: string;
    student_reg: string;
  } | null>(null);
  const [lectureDetails, setLectureDetails] = useState<LectureDetail[]>([]);
  const [loadingLectures, setLoadingLectures] = useState(false);

  // Initial Metadata
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedColg = localStorage.getItem('colg_cd');
      if (storedColg) setSelectedCollege(storedColg);
    }
    fetchAcademicMetadata();
  }, []);

  useEffect(() => {
    if (selectedCollege && selectedCourse) {
      fetchBranchesAndBatches(selectedCollege, selectedCourse);
    }
  }, [selectedCollege, selectedCourse]);

  useEffect(() => {
    fetchPortalSemesters();
  }, [selectedCollege, selectedCourse, selectedBranch, selectedBatch]);

  // When Section / Semester / Batch changes, load the Section Matrix & Student Summary
  useEffect(() => {
    fetchSectionAttendanceMatrix();
    if (viewMode === 'STUDENT' || role === 'STUDENT') {
      fetchSubjectSummary();
    }
  }, [selectedCollege, selectedCourse, selectedBranch, selectedBatch, selectedSem, selectedSection]);

  useEffect(() => {
    if (selectedStudentUid) {
      fetchSubjectSummary();
    }
  }, [selectedStudentUid, selectedSem, selectedSection]);

  const parseDotNetDate = (dateStr: any) => {
    if (!dateStr) return '—';
    if (typeof dateStr === 'string' && dateStr.includes('/Date(')) {
      const matches = dateStr.match(/\/Date\((\d+)\)\//);
      if (matches && matches[1]) {
        return new Date(parseInt(matches[1], 10)).toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric'
        });
      }
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? String(dateStr) : d.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const fetchAcademicMetadata = async () => {
    try {
      const [colgRes, crsRes] = await Promise.all([
        fetch('/api/srms/colleges').catch(() => null),
        fetch('/api/srms/courses?colgcd=1').catch(() => null),
      ]);

      if (colgRes && colgRes.ok) {
        const j = await colgRes.json();
        const list = Array.isArray(j) ? j : j.data || [];
        setCollegesList(list.map((c: any) => ({
          id: String(c.colg_cd || c.code || '1'),
          code: String(c.colg_cd || c.code || '1'),
          name: c.colg_name || c.name || `College ${c.colg_cd || 1}`,
        })));
      } else {
        setCollegesList([
          { id: '1', code: '1', name: 'SRMS College of Engineering & Technology, Bareilly' },
          { id: '2', code: '2', name: 'SRMS College of Engineering, Technology & Research, Bareilly' },
        ]);
      }

      if (crsRes && crsRes.ok) {
        const j = await crsRes.json();
        const list = Array.isArray(j) ? j : j.data || [];
        setCoursesList(list.map((c: any) => ({
          id: String(c.course_cd || c.code || '13'),
          code: String(c.course_cd || c.code || '13'),
          name: c.course_name || c.name || `Course ${c.course_cd || 13}`,
        })));
      } else {
        setCoursesList([
          { id: '13', code: '13', name: 'BCA - Bachelor of Computer Applications' },
          { id: '1', code: '1', name: 'B.Tech - Computer Science & Engineering' },
          { id: '2', code: '2', name: 'MCA - Master of Computer Applications' },
        ]);
      }
    } catch (err) {
      console.warn('Failed to fetch academic metadata:', err);
    }
  };

  const fetchBranchesAndBatches = async (colg: string, crs: string) => {
    try {
      const [brRes, btRes] = await Promise.all([
        fetch(`/api/srms/branches?colgcd=${colg}&coursecd=${crs}`).catch(() => null),
        fetch(`/api/srms/batches?colgcd=${colg}&coursecd=${crs}`).catch(() => null),
      ]);

      if (brRes && brRes.ok) {
        const j = await brRes.json();
        const list = Array.isArray(j) ? j : j.data || [];
        setBranchesList(list.map((b: any) => ({
          id: String(b.branch_cd || b.code || '1'),
          code: String(b.branch_cd || b.code || '1'),
          name: b.branch_name || b.name || `Branch ${b.branch_cd || 1}`,
        })));
      } else {
        setBranchesList([{ id: '1', code: '1', name: 'Computer Science & Engineering' }]);
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
          if (!mapped.some((b: any) => b.code === selectedBatch)) {
            setSelectedBatch(mapped[0].code);
          }
        }
      } else {
        setBatchesList([
          { id: '2', code: '2', name: '2025' },
          { id: '18', code: '18', name: '2024-2025 (Batch 18)' },
          { id: '17', code: '17', name: '2023-2024 (Batch 17)' },
        ]);
      }
    } catch (err) {
      console.warn('Failed to fetch branches & batches:', err);
    }
  };

  const fetchPortalSemesters = async () => {
    try {
      const tenant = typeof window !== 'undefined' ? (localStorage.getItem('tenantSlug') || 'srms-cet-bareilly') : 'srms-cet-bareilly';
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || '') : '';

      const res = await fetch(
        `${API_BASE}/attendance/portal/semesters?tenant=${tenant}&colgcd=${selectedCollege}&coursecd=${selectedCourse}&ddl_branch=${selectedBranch}&ddl_batch=${selectedBatch}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      ).catch(() => null);

      if (res && res.ok) {
        const json = await res.json();
        const list = Array.isArray(json) ? json : json.data || [];
        if (list.length > 0) {
          setSemestersList(list);
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch portal semesters:', err);
    }

    setSemestersList([
      { sem_cd: 1, SemName: '1st Semester' },
      { sem_cd: 2, SemName: '2nd Semester' },
      { sem_cd: 3, SemName: '3rd Semester' },
      { sem_cd: 4, SemName: '4th Semester' },
      { sem_cd: 5, SemName: '5th Semester' },
      { sem_cd: 6, SemName: '6th Semester' },
      { sem_cd: 7, SemName: '7th Semester' },
      { sem_cd: 8, SemName: '8th Semester' },
    ]);
  };

  const filteredSemestersForYearTab = useMemo(() => {
    if (activeYearTab === 'Y1') return semestersList.filter(s => s.sem_cd === 1 || s.sem_cd === 2);
    if (activeYearTab === 'Y2') return semestersList.filter(s => s.sem_cd === 3 || s.sem_cd === 4);
    if (activeYearTab === 'Y3') return semestersList.filter(s => s.sem_cd === 5 || s.sem_cd === 6);
    return semestersList.filter(s => s.sem_cd === 7 || s.sem_cd === 8);
  }, [semestersList, activeYearTab]);

  // Fetch Section-Wise Attendance Matrix
  const fetchSectionAttendanceMatrix = async () => {
    try {
      setLoadingMatrix(true);
      const tenant = typeof window !== 'undefined' ? (localStorage.getItem('tenantSlug') || 'srms-cet-bareilly') : 'srms-cet-bareilly';
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || '') : '';

      const queryParams = new URLSearchParams({
        tenant,
        colgcd: selectedCollege,
        coursecd: selectedCourse,
        ddl_branch: selectedBranch,
        ddl_batch: selectedBatch,
        sem_cd: selectedSem,
        section_cd: selectedSection,
      });

      const res = await fetch(`${API_BASE}/attendance/portal/section-matrix?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const json = await res.json();
        if (json.subjects) setMatrixSubjects(json.subjects);
        if (json.students && Array.isArray(json.students)) {
          setMatrixStudents(json.students);
          if (json.students.length > 0 && !selectedStudentUid) {
            setSelectedStudentUid(json.students[0].registration_no);
            setSelectedStudentName(json.students[0].name);
            setSelectedStudentRoll(json.students[0].rollno);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch section matrix:', err);
    } finally {
      setLoadingMatrix(false);
    }
  };

  // Fetch Single Student Subject Summary
  const fetchSubjectSummary = async () => {
    try {
      setLoadingSummary(true);
      const tenant = typeof window !== 'undefined' ? (localStorage.getItem('tenantSlug') || 'srms-cet-bareilly') : 'srms-cet-bareilly';
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || '') : '';

      const queryParams = new URLSearchParams({
        tenant,
        colgcd: selectedCollege,
        coursecd: selectedCourse,
        ddl_branch: selectedBranch,
        ddl_batch: selectedBatch,
        sem_cd: selectedSem,
        section_cd: selectedSection,
        uid: selectedStudentUid || '2024106259',
      });

      const res = await fetch(`${API_BASE}/attendance/portal/subject-summary?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json) ? json : json.data || [];
        setSummaryData(list);
        if (list.length > 0 && list[0].stud_name) {
          setSelectedStudentName(list[0].stud_name);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch subject summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  // Handle Drilldown to Lecture-Wise Status
  const handleOpenLectureDrilldown = async (subCd: string, subName: string, studName: string, studReg: string) => {
    try {
      setActiveSubjectForDrilldown({
        sub_cd: subCd,
        sub_name: subName,
        student_name: studName,
        student_reg: studReg,
      });
      setLoadingLectures(true);
      const tenant = typeof window !== 'undefined' ? (localStorage.getItem('tenantSlug') || 'srms-cet-bareilly') : 'srms-cet-bareilly';
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || '') : '';

      const queryParams = new URLSearchParams({
        tenant,
        ddl_sub: subCd,
        colgcd: selectedCollege,
        coursecd: selectedCourse,
        ddl_branch: selectedBranch,
        ddl_batch: selectedBatch,
        sem_cd: selectedSem,
        section_cd: selectedSection,
        uid: studReg || selectedStudentUid || '2024106259',
      });

      const res = await fetch(`${API_BASE}/attendance/portal/lecture-details?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json) ? json : json.data || [];
        setLectureDetails(list);
      }
    } catch (err) {
      console.warn('Failed to fetch lecture details:', err);
    } finally {
      setLoadingLectures(false);
    }
  };

  // Filter matrix students by search query
  const filteredMatrixStudents = useMemo(() => {
    if (!matrixSearchQuery.trim()) return matrixStudents;
    const q = matrixSearchQuery.toLowerCase();
    return matrixStudents.filter(st =>
      st.name.toLowerCase().includes(q) ||
      st.rollno.toLowerCase().includes(q) ||
      st.registration_no.toLowerCase().includes(q) ||
      st.college.toLowerCase().includes(q)
    );
  }, [matrixStudents, matrixSearchQuery]);

  // Subject Header Color Palettes for the reference grid styling
  const subjectHeaderColors = [
    'bg-emerald-700 text-white',
    'bg-sky-700 text-white',
    'bg-teal-700 text-white',
    'bg-indigo-700 text-white',
    'bg-emerald-600 text-white',
    'bg-blue-700 text-white',
    'bg-violet-700 text-white',
    'bg-cyan-700 text-white',
  ];

  return (
    <div className="space-y-6">
      {/* ─── 1. Cascading Academic Selector ────────────────────────────── */}
      <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
          <h3 className="text-sm font-black text-[#1B1E28] dark:text-white uppercase tracking-wider flex items-center gap-2">
            <span>🎓</span>
            <span>Academic Attendance Selector</span>
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-extrabold bg-[#5B4BFF]/10 text-[#5B4BFF] dark:text-indigo-400 px-3 py-1 rounded-full border border-[#5B4BFF]/20">
              Live SRMS Portal Sync
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {/* 1. College */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">1. College</label>
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              disabled={role !== 'SUPER_ADMIN'}
              className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold text-[#5B4BFF] dark:text-indigo-300 disabled:opacity-80 cursor-pointer"
            >
              {collegesList.map((c) => (
                <option key={c.id} value={c.code}>
                  [{c.code}] {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Course */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">2. Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold cursor-pointer"
            >
              {coursesList.map((cr) => (
                <option key={cr.id} value={cr.code}>
                  [{cr.code}] {cr.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Branch */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">3. Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold cursor-pointer"
            >
              {branchesList.map((br) => (
                <option key={br.id} value={br.code}>
                  [{br.code}] {br.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Batch */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">4. Batch</label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold cursor-pointer"
            >
              {batchesList.map((bt) => (
                <option key={bt.id} value={bt.code}>
                  [{bt.code}] {bt.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Academic Year Tabs (Year 1 - Year 4) */}
        <div className="pt-2">
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2 text-xs">5. Academic Year</label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'Y1', label: 'Year 1 (Sem 1 & 2)' },
              { id: 'Y2', label: 'Year 2 (Sem 3 & 4)' },
              { id: 'Y3', label: 'Year 3 (Sem 5 & 6)' },
              { id: 'Y4', label: 'Year 4 (Sem 7 & 8)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveYearTab(tab.id as any);
                  const firstSem = tab.id === 'Y1' ? '1' : tab.id === 'Y2' ? '3' : tab.id === 'Y3' ? '5' : '7';
                  setSelectedSem(firstSem);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  activeYearTab === tab.id
                    ? 'bg-[#5B4BFF] text-white shadow-md shadow-indigo-500/20'
                    : 'bg-[#F6F8FC] dark:bg-slate-800 text-[#7B8794] hover:text-[#1B1E28] dark:hover:text-white border border-[#E7EAF3] dark:border-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Semester, Section & Dynamic Student Dropdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2 border-t border-[#E7EAF3] dark:border-slate-800">
          {/* Semester Selector */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">6. Semester</label>
            <select
              value={selectedSem}
              onChange={(e) => setSelectedSem(e.target.value)}
              className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold text-[#5B4BFF] dark:text-indigo-300 cursor-pointer"
            >
              {filteredSemestersForYearTab.map((s) => (
                <option key={s.sem_cd} value={String(s.sem_cd)}>
                  {s.SemName} (Semester {s.sem_cd})
                </option>
              ))}
            </select>
          </div>

          {/* Section Selector */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">7. Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold cursor-pointer"
            >
              <option value="1">Section A (1)</option>
              <option value="2">Section B (2)</option>
              <option value="3">Section C (3)</option>
              <option value="4">Section D (4)</option>
            </select>
          </div>

          {/* Dynamic Student Dropdown Selector */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              8. Choose Student (from Section Roster)
            </label>
            {role === 'STUDENT' ? (
              <div className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>{selectedStudentName} ({selectedStudentUid})</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold">Self</span>
              </div>
            ) : (
              <select
                value={selectedStudentUid}
                onChange={(e) => {
                  const uid = e.target.value;
                  setSelectedStudentUid(uid);
                  const matched = matrixStudents.find(s => s.registration_no === uid);
                  if (matched) {
                    setSelectedStudentName(matched.name);
                    setSelectedStudentRoll(matched.rollno);
                  }
                }}
                className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold cursor-pointer"
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

        {/* View Mode Toggle Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-[#E7EAF3] dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('MATRIX')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                viewMode === 'MATRIX'
                  ? 'bg-[#2D2575] text-white shadow-md'
                  : 'bg-[#F6F8FC] dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <span>📊</span>
              <span>Section Attendance Matrix (Grid)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('STUDENT')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                viewMode === 'STUDENT'
                  ? 'bg-[#5B4BFF] text-white shadow-md'
                  : 'bg-[#F6F8FC] dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <span>👤</span>
              <span>Individual Student Breakdown</span>
            </button>
          </div>

          {viewMode === 'MATRIX' && (
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search student by name / roll..."
                value={matrixSearchQuery}
                onChange={(e) => setMatrixSearchQuery(e.target.value)}
                className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs font-bold"
              />
              <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── 2. SECTION ATTENDANCE MATRIX (Exact Layout as Reference Screenshot) ───────── */}
      {viewMode === 'MATRIX' && (
        <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-[#1B1E28] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>📋</span>
                <span>Section Attendance Register (Multi-Subject Matrix)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time subject-wise lecture counts & attendance percentages. Click any cell to inspect lecture drill-downs.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-[#DEF7EC] border border-[#BCF0DA]"></span>
                <span className="text-slate-600 dark:text-slate-300">≥ 75%</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-[#FEF08A]/60 border border-[#FDE047]"></span>
                <span className="text-slate-600 dark:text-slate-300">50% - 74%</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-[#FDE8E8] border border-[#F8B4B4]"></span>
                <span className="text-slate-600 dark:text-slate-300">&lt; 50%</span>
              </span>
            </div>
          </div>

          {loadingMatrix ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <div className="animate-spin text-3xl">🔄</div>
              <p className="text-xs font-bold">Syncing Section Attendance from SRMS Portal...</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-300 dark:border-slate-700">
                    <th className="p-2.5 font-black uppercase text-center bg-[#2D2575] text-white border-r border-indigo-900 w-12">
                      S.No
                    </th>
                    <th className="p-2.5 font-black uppercase bg-[#2D2575] text-white border-r border-indigo-900 min-w-[130px]">
                      College
                    </th>
                    <th className="p-2.5 font-black uppercase bg-[#2D2575] text-white border-r border-indigo-900 min-w-[120px]">
                      Roll No
                    </th>
                    <th className="p-2.5 font-black uppercase bg-[#00C48C] text-white border-r border-emerald-600 min-w-[160px]">
                      Student Name
                    </th>
                    <th className="p-2.5 font-black uppercase bg-[#2D2575] text-white border-r border-indigo-900 text-center w-16">
                      Course
                    </th>
                    <th className="p-2.5 font-black uppercase bg-[#2D2575] text-white border-r border-indigo-900 text-center w-16">
                      Batch
                    </th>
                    <th className="p-2.5 font-black uppercase bg-[#2D2575] text-white border-r border-indigo-900 text-center w-16">
                      Semester
                    </th>
                    {matrixSubjects.map((sub, idx) => (
                      <th
                        key={sub.sub_cd}
                        className={`p-2.5 font-black uppercase text-center border-r border-slate-300 dark:border-slate-700 min-w-[140px] text-[11px] leading-snug ${
                          subjectHeaderColors[idx % subjectHeaderColors.length]
                        }`}
                      >
                        {sub.sub_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                  {filteredMatrixStudents.map((st) => (
                    <tr
                      key={st.registration_no}
                      className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="p-2.5 text-center font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                        {st.s_no}
                      </td>
                      <td className="p-2.5 text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 text-[11px] leading-tight">
                        {st.college}
                      </td>
                      <td className="p-2.5 font-mono font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800">
                        {st.rollno}
                      </td>
                      <td className="p-2.5 font-black text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentUid(st.registration_no);
                            setSelectedStudentName(st.name);
                            setSelectedStudentRoll(st.rollno);
                            setViewMode('STUDENT');
                          }}
                          className="hover:text-[#5B4BFF] hover:underline text-left cursor-pointer transition-colors"
                        >
                          {st.name}
                        </button>
                      </td>
                      <td className="p-2.5 text-center text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                        {st.course}
                      </td>
                      <td className="p-2.5 text-center text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                        {st.batch}
                      </td>
                      <td className="p-2.5 text-center text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                        {st.semester}
                      </td>

                      {/* Subject Attendance Badges */}
                      {matrixSubjects.map((sub) => {
                        const att = st.attendance[sub.sub_cd];
                        if (!att) {
                          return (
                            <td
                              key={sub.sub_cd}
                              className="p-2 text-center text-slate-400 border-r border-slate-200 dark:border-slate-800"
                            >
                              -
                            </td>
                          );
                        }

                        const pct = att.percentage;
                        const badgeStyle =
                          pct >= 75
                            ? 'bg-[#DEF7EC] text-[#03543F] border border-[#BCF0DA]'
                            : pct >= 50
                            ? 'bg-[#FEF08A]/60 text-[#854D0E] border border-[#FDE047]'
                            : 'bg-[#FDE8E8] text-[#9B1C1C] border border-[#F8B4B4]';

                        return (
                          <td
                            key={sub.sub_cd}
                            className="p-2 text-center border-r border-slate-200 dark:border-slate-800"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenLectureDrilldown(
                                  sub.sub_cd,
                                  sub.sub_name,
                                  st.name,
                                  st.registration_no
                                )
                              }
                              className={`w-full py-1 px-2 rounded font-bold text-[11px] cursor-pointer hover:shadow transition-all ${badgeStyle}`}
                            >
                              {att.present}/{att.total} ({pct.toFixed(2)}%)
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── 3. INDIVIDUAL STUDENT SUMMARY CARDS & LEDGER ──────────────── */}
      {viewMode === 'STUDENT' && (
        <div className="space-y-6">
          {/* Student Profile Card */}
          <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase text-[#4E5969] tracking-wider">
                Viewing Enrolled Student
              </span>
              <h2 className="text-xl font-black text-[#1B1E28] dark:text-white">
                {selectedStudentName}
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-semibold">
                <span>Roll No: <strong className="text-slate-800 dark:text-slate-200">{selectedStudentRoll}</strong></span>
                <span>•</span>
                <span>Registration No (UID): <strong className="text-slate-800 dark:text-slate-200">{selectedStudentUid}</strong></span>
                <span>•</span>
                <span>Semester: <strong className="text-[#5B4BFF]">{selectedSem}</strong></span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setViewMode('MATRIX')}
              className="px-4 py-2 bg-[#2D2575] hover:bg-[#3D3399] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <span>← Back to Section Matrix Grid</span>
            </button>
          </div>

          {/* Subject Cards Grid */}
          <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft space-y-4">
            <h3 className="text-sm font-black text-[#1B1E28] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span>📚</span>
              <span>Subject-Wise Attendance Breakdown (SRMS Portal Synced)</span>
            </h3>

            {loadingSummary ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <div className="animate-spin text-3xl">🔄</div>
                <p className="text-xs font-bold">Fetching Subject Records...</p>
              </div>
            ) : summaryData.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-bold">
                No attendance sessions found for the selected criteria.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {summaryData.map((subj) => {
                  const pct = subj.AttendancePercentage || 0;
                  const isDefaulter = pct < 75;

                  return (
                    <div
                      key={subj.sub_cd}
                      className="p-5 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800/80 border border-[#E7EAF3] dark:border-slate-700 shadow-sm space-y-3 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            CODE: {subj.sub_cd}
                          </span>
                          <h4 className="text-sm font-black text-[#1B1E28] dark:text-white leading-tight">
                            {subj.sub_name}
                          </h4>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase shrink-0 ${
                            isDefaulter
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                          }`}
                        >
                          {isDefaulter ? '⚠️ < 75%' : '✅ Good'}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between pt-1">
                        <div>
                          <span className="text-2xl font-black text-[#1B1E28] dark:text-white">
                            {pct.toFixed(2)}%
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                            {subj.PresentCount} Attended / {subj.TotalLectures} Total
                          </p>
                        </div>
                        <span className="text-xs text-rose-600 font-bold">
                          {subj.AbsentCount} Absent
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            pct >= 75 ? 'bg-[#00C48C]' : pct >= 50 ? 'bg-[#FFB020]' : 'bg-[#F04438]'
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleOpenLectureDrilldown(
                            subj.sub_cd,
                            subj.sub_name,
                            selectedStudentName,
                            selectedStudentUid
                          )
                        }
                        className="w-full py-2 bg-white dark:bg-slate-900 hover:bg-[#5B4BFF] hover:text-white border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm"
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

      {/* ─── 4. DRILL-DOWN LECTURE MODAL (GetEngSemSubwiseStatus) ───────── */}
      {activeSubjectForDrilldown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[24px] max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-[#2D2575] to-[#4338CA] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase bg-white/20 px-2 py-0.5 rounded font-extrabold">
                  SRMS Lecture-by-Lecture History
                </span>
                <h3 className="text-base font-black mt-1">
                  {activeSubjectForDrilldown.sub_name} ({activeSubjectForDrilldown.sub_cd})
                </h3>
                <p className="text-xs text-indigo-200">
                  Student: <strong>{activeSubjectForDrilldown.student_name}</strong> • UID: {activeSubjectForDrilldown.student_reg}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubjectForDrilldown(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-black text-sm transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {loadingLectures ? (
                <div className="p-12 text-center text-slate-400 space-y-3">
                  <div className="animate-spin text-3xl">🔄</div>
                  <p className="text-xs font-bold">Loading lecture records from SRMS API...</p>
                </div>
              ) : lectureDetails.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-bold">
                  No individual lecture logs captured yet for this subject.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#F6F8FC] dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase font-black border-b border-slate-200 dark:border-slate-700">
                        <th className="p-3 text-center w-12">#</th>
                        <th className="p-3">Lecture Date</th>
                        <th className="p-3 text-center">Time Slot</th>
                        <th className="p-3 text-right">Attendance Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {lectureDetails.map((lec, idx) => {
                        const isPresent =
                          lec.IsPresent === 'Present' ||
                          lec.IsPresent === true ||
                          String(lec.IsPresent).toLowerCase() === 'present';

                        return (
                          <tr
                            key={idx}
                            className="hover:bg-[#F6F8FC]/60 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="p-3 text-center font-bold text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                              📅 {parseDotNetDate(lec.lecturedt)}
                            </td>
                            <td className="p-3 text-center font-mono font-semibold text-slate-600 dark:text-slate-400">
                              ⏰ {lec.starttm || '10:20'} - {lec.endtm || '11:20'}
                            </td>
                            <td className="p-3 text-right">
                              <span
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                                  isPresent
                                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300'
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
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveSubjectForDrilldown(null)}
                className="px-5 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close Modal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
