'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

interface Department {
  id: string;
  code: string;
  name: string;
}

interface Subject {
  id: string;
  code: string;
  name: string;
  department_id?: string;
  subject_cd?: string;
}

interface Batch {
  id: string;
  code: string;
  year: number;
  batch_cd?: string;
}

interface Group {
  id: string;
  code: string;
  name: string;
}

interface StudentRosterItem {
  id: string;
  name: string;
  rollno?: string;
  registration_no: string;
  photo_url?: string;
  group_code?: string;
  group_name?: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks?: string;
}

interface AttendanceSessionSummary {
  id: string;
  session_date: string;
  session_type: string;
  topic_covered?: string;
  created_at: string;
  is_cancelled: boolean;
  subject_id?: string;
  subject_name?: string;
  subject_code?: string;
  batch_code?: string;
  faculty_name?: string;
  total_records: number;
  present_count: number;
}

interface BatchReportItem {
  student_id: string;
  rollno?: string;
  name: string;
  total_classes: number;
  present: number;
  absent: number;
  attendance_pct: number | string;
}

interface UserScope {
  role: string;
  isAdmin: boolean;
  departmentId: string | null;
  departmentName: string | null;
  departmentCode: string | null;
  assignedSubjectIds: string[];
}

interface TimetableSlotItem {
  id: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  department_id: string;
  department_name: string;
  batch_id: string;
  batch_code: string;
  faculty_name: string;
  slot_type: string;
  start_time: string;
  end_time: string;
  room?: string;
  group_name?: string;
  topic?: string;
  is_attendance_marked: boolean;
  session_id?: string;
}

const API_BASE = 'http://localhost:3001/api/v1';
const TENANT = 'srms-ims';

const SESSION_TYPES = [
  { value: 'THEORY', label: 'Theory (Lecture)', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
  { value: 'PRACTICAL', label: 'Practical (Lab)', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  { value: 'CLINICAL_POSTING', label: 'Clinical Posting (Ward)', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  { value: 'SGT', label: 'Small Group Teaching (SGT)', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  { value: 'DOAP', label: 'DOAP Session', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { value: 'TUTORIAL', label: 'Tutorial', color: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
  { value: 'SDL', label: 'Self-Directed Learning (SDL)', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
];

export default function AttendanceMasterPage() {
  const [activeTab, setActiveTab] = useState<'mark' | 'roster' | 'history'>('mark');

  // Master Data States
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  // User Role & Department Access Scope
  const [userScope, setUserScope] = useState<UserScope | null>(null);

  // Timetable Scheduled Slots State
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlotItem[]>([]);
  const [loadingTimetableSlots, setLoadingTimetableSlots] = useState<boolean>(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  // Selection States for Attendance Marking
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [sessionType, setSessionType] = useState<string>('THEORY');
  const [sessionDate, setSessionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [topicCovered, setTopicCovered] = useState<string>('');

  // Roster Marking State
  const [studentRoster, setStudentRoster] = useState<StudentRosterItem[]>([]);
  const [loadingRoster, setLoadingRoster] = useState<boolean>(false);
  const [savingAttendance, setSavingAttendance] = useState<boolean>(false);

  // Subject-Wise Attendance Roster Analytics State
  const [reportBatchId, setReportBatchId] = useState<string>('');
  const [reportSubjectId, setReportSubjectId] = useState<string>('');
  const [reportFromDate, setReportFromDate] = useState<string>('');
  const [reportToDate, setReportToDate] = useState<string>('');
  const [reportViewMode, setReportViewMode] = useState<'single' | 'matrix'>('single');
  const [batchReport, setBatchReport] = useState<BatchReportItem[]>([]);
  const [matrixReport, setMatrixReport] = useState<{ subjects: any[]; students: any[] } | null>(null);
  const [onlyShortage, setOnlyShortage] = useState<boolean>(false);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);

  // Weekly Navigation & Conducted Lecture Counters State
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [weeklySessions, setWeeklySessions] = useState<AttendanceSessionSummary[]>([]);
  const [lectureCounters, setLectureCounters] = useState<{
    totalLectures: number;
    totalPracticals: number;
    totalClinical: number;
    totalSgt: number;
    totalSessions: number;
  }>({
    totalLectures: 0,
    totalPracticals: 0,
    totalClinical: 0,
    totalSgt: 0,
    totalSessions: 0,
  });
  const [loadingWeekly, setLoadingWeekly] = useState<boolean>(false);

  // Alert / Toast Banner State
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // History Tab State
  const [pastSessions, setPastSessions] = useState<AttendanceSessionSummary[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Helper to compute start (Monday) & end (Sunday) of week for any offset
  const getStartAndEndOfWeek = (offsetWeeks: number) => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sun, 1 is Mon...
    const distanceToMonday = (dayOfWeek + 6) % 7;

    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday + offsetWeeks * 7);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const displayFormat = (d: Date) => d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

    return {
      fromDate: formatDate(monday),
      toDate: formatDate(sunday),
      displayRange: `${displayFormat(monday)} – ${displayFormat(sunday)}`,
    };
  };

  // Fetch Weekly Sessions & Conducted Counters
  const fetchWeeklySessions = async () => {
    if (!selectedBatchId) return;
    setLoadingWeekly(true);
    try {
      const token = localStorage.getItem('token') || '';
      const { fromDate, toDate } = getStartAndEndOfWeek(weekOffset);

      let url = `${API_BASE}/attendance/weekly-sessions?tenant=${TENANT}&batchId=${selectedBatchId}&fromDate=${fromDate}&toDate=${toDate}`;
      if (selectedSubjectId) url += `&subjectId=${selectedSubjectId}`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        setWeeklySessions(data.sessions || []);
        if (data.counters) setLectureCounters(data.counters);
      }
    } catch (err) {
      console.error('Failed to fetch weekly sessions', err);
    } finally {
      setLoadingWeekly(false);
    }
  };

  // Fetch initial master lists and user scope
  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (activeTab === 'mark' && selectedBatchId) {
      fetchWeeklySessions();
    }
  }, [selectedBatchId, selectedSubjectId, weekOffset, activeTab]);

  useEffect(() => {
    if (activeTab === 'mark' && selectedBatchId && sessionDate) {
      fetchTimetableSlots();
    }
  }, [selectedBatchId, sessionDate, selectedDeptId, activeTab]);

  // Fetch Scheduled Timetable Slots for Date & Batch
  const fetchTimetableSlots = async () => {
    if (!selectedBatchId || !sessionDate) return;
    setLoadingTimetableSlots(true);
    try {
      const token = localStorage.getItem('token') || '';
      let url = `${API_BASE}/attendance/timetable-slots?tenant=${TENANT}&batchId=${selectedBatchId}&sessionDate=${sessionDate}`;
      if (selectedDeptId) url += `&departmentId=${selectedDeptId}`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        setTimetableSlots(Array.isArray(data.slots) ? data.slots : []);
      }
    } catch (err) {
      console.error('Failed to fetch scheduled timetable slots', err);
    } finally {
      setLoadingTimetableSlots(false);
    }
  };

  // Handle selecting a Timetable Slot card
  const handleSelectSlot = (slot: TimetableSlotItem) => {
    setSelectedSlotId(slot.id);
    if (slot.department_id) setSelectedDeptId(slot.department_id);
    if (slot.subject_id) setSelectedSubjectId(slot.subject_id);
    if (slot.slot_type) setSessionType(slot.slot_type);
    if (slot.topic) setTopicCovered(slot.topic);

    if (slot.group_name) {
      const matchedGroup = groups.find(
        g => g.code.toLowerCase() === slot.group_name?.toLowerCase() || g.name.toLowerCase() === slot.group_name?.toLowerCase()
      );
      if (matchedGroup) setSelectedGroupId(matchedGroup.id);
      else setSelectedGroupId('all');
    }
  };

  // Filter subjects based on user scope and selected Department
  const departmentSubjects = allSubjects.filter(sub => {
    if (userScope && !userScope.isAdmin && userScope.departmentId) {
      const belongsToDept = sub.department_id === userScope.departmentId;
      const isAssigned = userScope.assignedSubjectIds.includes(sub.id);
      if (!belongsToDept && !isAssigned) return false;
    }
    if (selectedDeptId) {
      return sub.department_id === selectedDeptId;
    }
    return true;
  });

  const fetchMetadata = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const headers = { 'Authorization': `Bearer ${token}` };

      // 1. Fetch User Scope (Role + Department Access)
      try {
        const scopeRes = await fetch(`${API_BASE}/attendance/user-scope?tenant=${TENANT}`, { headers });
        if (scopeRes.ok) {
          const scopeJson = await scopeRes.json();
          const scope = scopeJson.data || scopeJson;
          setUserScope(scope);
          if (!scope.isAdmin && scope.departmentId) {
            setSelectedDeptId(scope.departmentId);
          }
        }
      } catch (e) {
        console.warn('Failed to load user scope', e);
      }

      // 2. Fetch Master Data
      const [deptRes, subRes, batchRes, grpRes] = await Promise.all([
        fetch(`${API_BASE}/users/departments?tenant=${TENANT}`, { headers }),
        fetch(`${API_BASE}/admin-master/subjects?tenant=${TENANT}`, { headers }),
        fetch(`${API_BASE}/college-master/batches?tenant=${TENANT}`, { headers }),
        fetch(`${API_BASE}/college-master/groups?tenant=${TENANT}`, { headers }),
      ]);

      if (deptRes.ok) {
        const json = await deptRes.json();
        const dList = json.data || json;
        setDepartments(Array.isArray(dList) ? dList : []);
        if (dList.length > 0 && !selectedDeptId) setSelectedDeptId(dList[0].id);
      }

      if (subRes.ok) {
        const json = await subRes.json();
        setAllSubjects(json.data || json);
      }

      if (batchRes.ok) {
        const json = await batchRes.json();
        const bList = json.data || json;
        setBatches(Array.isArray(bList) ? bList : []);
        if (bList.length > 0) {
          setSelectedBatchId(bList[0].id);
          setReportBatchId(bList[0].id);
        }
      }

      if (grpRes.ok) {
        const json = await grpRes.json();
        setGroups(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load attendance metadata', err);
    }
  };

  // Fetch Student Roster and auto-load existing marked attendance if available
  const fetchStudentRoster = async () => {
    if (!selectedBatchId) return;
    setLoadingRoster(true);
    try {
      const token = localStorage.getItem('token') || '';
      const headers = { 'Authorization': `Bearer ${token}` };

      let url = `${API_BASE}/student-master?tenant=${TENANT}&batchId=${selectedBatchId}`;
      if (selectedGroupId !== 'all') url += `&groupId=${selectedGroupId}`;

      const res = await fetch(url, { headers });
      const json = await res.json();
      const rawStudents = json.data || [];

      // Fetch existing session records for active subject + batch + date + sessionType
      let existingRecordMap: Record<string, { status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'; remarks?: string }> = {};
      if (selectedSubjectId) {
        try {
          let activeSessUrl = `${API_BASE}/attendance/active-session?tenant=${TENANT}&subjectId=${selectedSubjectId}&batchId=${selectedBatchId}&sessionDate=${sessionDate}&sessionType=${sessionType}`;
          if (selectedSlotId) activeSessUrl += `&timetableSlotId=${selectedSlotId}`;
          const sessRes = await fetch(activeSessUrl, { headers });
          if (sessRes.ok) {
            const sessJson = await sessRes.json();
            const data = sessJson.data || sessJson;
            if (data?.found && Array.isArray(data.records)) {
              data.records.forEach((r: any) => {
                const stId = r.student_id || r.studentId;
                if (stId) {
                  existingRecordMap[stId] = {
                    status: r.status,
                    remarks: r.remarks || '',
                  };
                }
              });
            }
          }
        } catch (e) {
          console.warn('Failed to fetch existing session records', e);
        }
      }

      const rosterItems: StudentRosterItem[] = rawStudents.map((s: any) => {
        const existing = existingRecordMap[s.id];
        return {
          id: s.id,
          name: s.name,
          rollno: s.rollno,
          registration_no: s.registration_no,
          photo_url: s.photo_url,
          group_code: s.group_code,
          group_name: s.group_name,
          status: existing ? existing.status : 'PRESENT',
          remarks: existing ? existing.remarks || '' : '',
        };
      });

      setStudentRoster(rosterItems);
    } catch (err) {
      console.error('Failed to fetch student roster', err);
    } finally {
      setLoadingRoster(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'mark') {
      fetchStudentRoster();
    } else if (activeTab === 'history') {
      fetchPastSessions();
    }
  }, [selectedBatchId, selectedGroupId, selectedSubjectId, sessionType, sessionDate, activeTab]);

  // Handle Bulk Status Actions
  const handleBulkSetStatus = (status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => {
    setStudentRoster(prev => prev.map(s => ({ ...s, status })));
  };

  const handleInvertStatus = () => {
    setStudentRoster(prev => prev.map(s => ({
      ...s,
      status: s.status === 'PRESENT' ? 'ABSENT' : 'PRESENT',
    })));
  };

  const handleIndividualStatusChange = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => {
    setStudentRoster(prev => prev.map(s => s.id === studentId ? { ...s, status } : s));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setStudentRoster(prev => prev.map(s => s.id === studentId ? { ...s, remarks } : s));
  };

  // Submit Attendance Session
  const handleSubmitAttendance = async () => {
    if (!selectedSubjectId) {
      setAlert({ type: 'error', message: 'Please select a Subject to mark attendance.' });
      return;
    }
    if (!selectedBatchId) {
      setAlert({ type: 'error', message: 'Please select a Batch for attendance marking.' });
      return;
    }
    if (studentRoster.length === 0) {
      setAlert({ type: 'error', message: 'No students found in selected roster.' });
      return;
    }

    setSavingAttendance(true);
    setAlert(null);

    try {
      const token = localStorage.getItem('token') || '';
      const payload = {
        subjectId: selectedSubjectId,
        batchId: selectedBatchId,
        sessionDate: sessionDate,
        sessionType: sessionType,
        topicCovered: topicCovered || undefined,
        timetableSlotId: selectedSlotId || undefined,
        records: studentRoster.map(s => ({
          studentId: s.id,
          status: s.status,
          remarks: s.remarks || undefined,
        })),
      };

      const res = await fetch(`${API_BASE}/attendance/sessions?tenant=${TENANT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok) {
        setAlert({
          type: 'success',
          message: `Attendance marked successfully! Created session ID: ${json.sessionId || json.id || 'Active'} for ${studentRoster.length} students.`,
        });
        fetchTimetableSlots();
        fetchWeeklySessions();
      } else {
        setAlert({
          type: 'error',
          message: json.message || 'Failed to submit attendance session.',
        });
      }
    } catch (err) {
      console.error('Failed to submit attendance', err);
      setAlert({ type: 'error', message: 'Network error while submitting attendance.' });
    } finally {
      setSavingAttendance(false);
    }
  };

  // Fetch Subject-Wise Batch Attendance Report
  const fetchBatchReport = async () => {
    if (!reportBatchId) return;
    setLoadingReport(true);
    try {
      const token = localStorage.getItem('token') || '';
      let url = `${API_BASE}/attendance/batches/${reportBatchId}/report?tenant=${TENANT}`;
      if (reportSubjectId) url += `&subjectId=${reportSubjectId}`;
      if (reportFromDate) url += `&fromDate=${reportFromDate}`;
      if (reportToDate) url += `&toDate=${reportToDate}`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const json = await res.json();
      const reportData = json.data ?? json;
      setBatchReport(Array.isArray(reportData) ? reportData : []);
    } catch (err) {
      console.error('Failed to fetch batch report', err);
    } finally {
      setLoadingReport(false);
    }
  };

  // Fetch Multi-Subject Matrix Report (Per-Subject Columns + Cumulative Overall %)
  const fetchMatrixReport = async () => {
    if (!reportBatchId) return;
    setLoadingReport(true);
    try {
      const token = localStorage.getItem('token') || '';
      let url = `${API_BASE}/attendance/batches/${reportBatchId}/matrix-report?tenant=${TENANT}`;
      if (reportFromDate) url += `&fromDate=${reportFromDate}`;
      if (reportToDate) url += `&toDate=${reportToDate}`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const json = await res.json();
      setMatrixReport(json.data || json || null);
    } catch (err) {
      console.error('Failed to fetch matrix report', err);
    } finally {
      setLoadingReport(false);
    }
  };

  // Fetch Past Sessions History
  const fetchPastSessions = async () => {
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${API_BASE}/attendance/sessions?tenant=${TENANT}&limit=30`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const json = await res.json();
      setPastSessions(json.data || []);
    } catch (err) {
      console.error('Failed to fetch past sessions', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Roster summary counters
  const totalRoster = studentRoster.length;
  const presentCount = studentRoster.filter(s => s.status === 'PRESENT').length;
  const absentCount = studentRoster.filter(s => s.status === 'ABSENT').length;
  const lateCount = studentRoster.filter(s => s.status === 'LATE').length;
  const excusedCount = studentRoster.filter(s => s.status === 'EXCUSED').length;
  const presentPercentage = totalRoster > 0 ? ((presentCount / totalRoster) * 100).toFixed(1) : '0.0';

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Attendance Master & Subject Roster Console" />
        <main className="p-6 space-y-6 flex-1 flex flex-col bg-slate-50 dark:bg-[#0F172A]">

          {/* Navigation Bar & Mode Switcher */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1 shadow-md hover:shadow-lg transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-wide flex items-center gap-2">
                <span className="p-2 bg-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">📋</span>
                Department & Subject Attendance Master
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Mark Theory, Practical &amp; Clinical Posting attendance clerk/faculty-wise, assign Groups, and inspect subject-level analytics.
              </p>
              {userScope && (
                <div className="mt-2 flex items-center gap-2">
                  {userScope.isAdmin ? (
                    <span className="px-3 py-1 text-[11px] font-black rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5">
                      👑 Full Admin Console (All Departments &amp; Subjects)
                    </span>
                  ) : (
                    <span className="px-3 py-1 text-[11px] font-black rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5">
                      🔬 {userScope.departmentName || 'Department'} Console ({userScope.role} Access - Dept Restricted)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Mode Tabs */}
            <div className="bg-slate-900/90 p-1 rounded-xl flex items-center border border-slate-800 shrink-0 gap-1">
              <button
                onClick={() => setActiveTab('mark')}
                className={`px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${activeTab === 'mark'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
              >
                <span>📝</span> Mark Attendance
              </button>

              <button
                onClick={() => { setActiveTab('roster'); fetchBatchReport(); }}
                className={`px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${activeTab === 'roster'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
              >
                <span>📊</span> Subject Roster
              </button>

              <button
                onClick={() => { setActiveTab('history'); fetchPastSessions(); }}
                className={`px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${activeTab === 'history'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
              >
                <span>📜</span> Session Audit Log
              </button>
            </div>
          </div>

          {alert && (
            <div className={`p-4 rounded-2xl border text-xs font-extrabold shadow-lg flex items-center justify-between ${alert.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}>
              <div className="flex items-center gap-2">
                <span>{alert.type === 'success' ? '✅' : '⚠️'}</span>
                <span>{alert.message}</span>
              </div>
              <button onClick={() => setAlert(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>
          )}

          {/* TAB 1: MARK ATTENDANCE (CLERK CONSOLE) */}
          {activeTab === 'mark' && (
            <div className="space-y-6">
              {/* Department ➔ Subject ➔ Session Controls Filter Bar */}
              <div className="bg-[#1E293B]/80 backdrop-blur-xl border border-indigo-500/20 p-5 rounded-2xl space-y-4 shadow-xl">
                <h3 className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2.5">
                  <span>🏢</span> Department &amp; Subject Session Filters
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">

                  {/* 1. Department */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                      Department {userScope && !userScope.isAdmin && '(Locked)'} *
                    </label>
                    <select
                      value={selectedDeptId}
                      onChange={(e) => {
                        setSelectedDeptId(e.target.value);
                        setSelectedSubjectId('');
                      }}
                      disabled={userScope ? !userScope.isAdmin && !!userScope.departmentId : false}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 text-white font-medium disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      <option value="">All Departments</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Subject (Filtered by Dept) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-indigo-400 tracking-wider">Subject *</label>
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900/90 border border-indigo-500/60 focus:outline-none focus:border-indigo-400 text-white font-black"
                    >
                      <option value="" disabled>-- Select Subject --</option>
                      {departmentSubjects.map((s) => {
                        const sCode = s.subject_cd || s.code || s.id;
                        return (
                          <option key={s.id || sCode} value={sCode}>[{s.code || sCode}] {s.name}</option>
                        );
                      })}
                    </select>
                  </div>

                  {/* 3. Session Type (Theory, Practical, Clinical Posting) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Session Type *</label>
                    <select
                      value={sessionType}
                      onChange={(e) => setSessionType(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 text-white font-bold"
                    >
                      {SESSION_TYPES.map((st) => (
                        <option key={st.value} value={st.value}>{st.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* 4. Batch Selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Batch *</label>
                    <select
                      value={selectedBatchId}
                      onChange={(e) => setSelectedBatchId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 text-white font-bold"
                    >
                      {batches.map((b) => {
                        const bCode = b.batch_cd || b.code || String(b.year) || b.id;
                        return (
                          <option key={b.id || bCode} value={bCode}>Batch {b.code} ({b.year})</option>
                        );
                      })}
                    </select>
                  </div>

                  {/* 5. Academic Group Filter */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-purple-400 tracking-wider">Academic Group</label>
                    <select
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900/90 border border-purple-500/40 focus:outline-none focus:border-purple-400 text-white font-bold"
                    >
                      <option value="all">Whole Batch (All Groups)</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>Group {g.code} ({g.name})</option>
                      ))}
                    </select>
                  </div>

                  {/* 6. Session Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Session Date *</label>
                    <input
                      type="date"
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 text-white font-bold"
                    />
                  </div>

                </div>

                {/* Refresh Action Line */}
                <div className="pt-2 border-t border-slate-800/80 flex justify-end">
                  <button
                    onClick={fetchStudentRoster}
                    className="px-4 py-2 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-700 transition-all flex items-center gap-1.5"
                  >
                    <span>🔄</span> Refresh Roster
                  </button>
                </div>
              </div>

              {/* ─── Scheduled Timetable Slots for Selected Date & Batch ───────────── */}
              <div className="bg-[#1E293B]/80 backdrop-blur-xl border border-cyan-500/20 p-5 rounded-2xl space-y-3 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div>
                    <h3 className="text-xs font-black uppercase text-cyan-400 tracking-wider flex items-center gap-2">
                      <span>📅</span> Scheduled Timetable Subjects ({sessionDate})
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                      Click any scheduled timetable slot below to auto-populate subject, session type &amp; roster automatically
                    </p>
                  </div>
                  <button
                    onClick={fetchTimetableSlots}
                    className="px-3 py-1 text-[11px] font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 transition-all shrink-0"
                  >
                    🔄 Reload Schedule
                  </button>
                </div>

                {loadingTimetableSlots ? (
                  <div className="text-center py-4 text-xs text-slate-400 font-medium">Loading scheduled timetable slots...</div>
                ) : timetableSlots.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-400 bg-slate-900/60 rounded-xl border border-slate-800/80">
                    No scheduled timetable slots found for {sessionDate}. Select a subject manually using the filters above.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {timetableSlots.map((slot) => {
                      const isSelected = selectedSlotId === slot.id || (selectedSubjectId === slot.subject_id && sessionType === slot.slot_type);
                      const startTimeDisplay = slot.start_time?.slice(0, 5) || '09:00';
                      const endTimeDisplay = slot.end_time?.slice(0, 5) || '10:00';

                      return (
                        <div
                          key={slot.id}
                          onClick={() => handleSelectSlot(slot)}
                          className={`bg-white dark:bg-slate-900 border rounded-[22px] p-5 cursor-pointer transition-all duration-300 relative overflow-hidden shadow-soft hover:shadow-hover hover:-translate-y-0.5 ${isSelected
                              ? 'ring-2 ring-[#5B4BFF] border-[#5B4BFF] bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/20 dark:from-slate-900 dark:to-indigo-950/40 shadow-xl'
                              : 'border-[#E7EAF3] dark:border-slate-800 hover:border-[#5B4BFF]/60'
                            }`}
                        >
                          {/* Active Ribbon Bar */}
                          {isSelected && (
                            <div className="mb-3 -mx-5 -mt-5 px-5 py-1.5 bg-[#2D2575] border-b border-white/10 text-[10px] font-black text-white uppercase tracking-widest flex items-center justify-between force-text-white">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#00C48C] animate-ping"></span>
                                <span>SELECTED SESSION — MARKING ACTIVE</span>
                              </span>
                              <span className="text-[#F36C21]">✓ ACTIVE</span>
                            </div>
                          )}

                          <div className="flex items-center gap-4">
                            {/* Time & Date Column (Matching Reference Image) */}
                            <div className="text-center shrink-0 min-w-[75px]">
                              <span className="text-base font-black text-[#F36C21] block tracking-tight font-mono">
                                {startTimeDisplay}
                              </span>
                              <span className="text-[10px] font-extrabold text-[#7B8794] uppercase tracking-wider block mt-0.5">
                                {sessionDate ? new Date(sessionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' }).toUpperCase() : 'TODAY'}
                              </span>
                            </div>

                            {/* Vertical Divider */}
                            <div className="w-px bg-[#E7EAF3] dark:bg-slate-800 self-stretch my-0.5 shrink-0"></div>

                            {/* Slot Details Column */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <h4 className="text-sm font-black text-[#1B1E28] dark:text-white truncate">
                                  {slot.subject_name ? `[${slot.subject_code}] ${slot.subject_name.toUpperCase()}` : 'SUBJECT SESSION'}
                                </h4>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFF4EC] text-[#D9530F] dark:text-[#F36C21] border border-[#F36C21]/40 dark:bg-orange-950/50 shadow-2xs">
                                  {slot.slot_type || 'Lecture'} {slot.topic ? `"${slot.topic}"` : ''}
                                </span>
                                <span className="text-[10px] font-bold text-[#7B8794] truncate">
                                  {slot.room ? `Room ${slot.room}` : ''}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-[#4E5969] dark:text-slate-300 font-bold">
                                <span className="flex items-center gap-1 font-mono">
                                  <span>🕒</span>
                                  <span>{startTimeDisplay} - {endTimeDisplay}</span>
                                </span>
                                <span className="text-[#00C48C] font-black">{slot.faculty_name}</span>
                              </div>
                            </div>
                          </div>

                          {/* Status Footer */}
                          <div className="mt-4 pt-3 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between text-xs">
                            {slot.is_attendance_marked ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-[#E6F9F3] text-[#00A876] dark:text-[#00C48C] border border-[#00C48C]/40">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#00C48C]"></span>
                                MARKED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-[#FFF8E6] text-[#D98200] dark:text-[#FFB020] border border-[#FFB020]/40">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#FFB020] animate-pulse"></span>
                                PENDING
                              </span>
                            )}

                            <span className={`font-black text-[11px] flex items-center gap-1 ${isSelected ? 'text-[#5B4BFF] dark:text-indigo-400' : 'text-[#F36C21] dark:text-orange-400'}`}>
                              {isSelected ? '✓ Active Roster' : 'Select Session →'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ─── Weekly Sessions Panel ────────────────────────────────────────── */}
              <div className="bg-[#1E293B]/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl overflow-hidden shadow-xl">

                {/* Weekly Header + Navigation */}
                <div className="p-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <span>📅</span>
                      <span>Weekly Attendance Sessions</span>
                      <span className="text-xs text-purple-300 font-mono">
                        ({getStartAndEndOfWeek(weekOffset).displayRange})
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Click any session to load &amp; mark student attendance below. Previous sessions can be amended.
                    </p>
                  </div>

                  {/* Week Navigation */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setWeekOffset(w => w - 1)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-purple-700 text-white font-black text-xs border border-slate-700 transition-all"
                    >
                      ◀ Prev Week
                    </button>
                    <button
                      onClick={() => setWeekOffset(0)}
                      disabled={weekOffset === 0}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-black text-xs border border-purple-400/30 transition-all"
                    >
                      This Week
                    </button>
                    <button
                      onClick={() => setWeekOffset(w => w + 1)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-purple-700 text-white font-black text-xs border border-slate-700 transition-all"
                    >
                      Next Week ▶
                    </button>
                    <button
                      onClick={fetchWeeklySessions}
                      disabled={loadingWeekly}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-700 transition-all"
                    >
                      🔄
                    </button>
                  </div>
                </div>

                {/* Conducted Session Counters */}
                <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-slate-800/60 border-b border-slate-800/60">
                  {[
                    { label: 'Total Sessions', count: lectureCounters.totalSessions, icon: '📋', color: 'text-white' },
                    { label: 'Theory Lectures', count: lectureCounters.totalLectures, icon: '📖', color: 'text-indigo-400' },
                    { label: 'Practicals', count: lectureCounters.totalPracticals, icon: '🔬', color: 'text-purple-400' },
                    { label: 'Clinical Posting', count: lectureCounters.totalClinical, icon: '🏥', color: 'text-rose-400' },
                    { label: 'SGT / DOAP / SDL', count: lectureCounters.totalSgt, icon: '👥', color: 'text-amber-400' },
                  ].map(counter => (
                    <div key={counter.label} className="p-3 text-center bg-slate-900/40">
                      <div className="text-xl font-black font-mono">{counter.icon} <span className={counter.color}>{counter.count}</span></div>
                      <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5">{counter.label}</div>
                    </div>
                  ))}
                </div>

                {/* Weekly Sessions List */}
                <div className="overflow-x-auto">
                  {loadingWeekly ? (
                    <div className="p-6 text-center text-slate-400 text-xs font-bold">
                      <span className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin inline-block mr-2 align-middle"></span>
                      Loading weekly sessions...
                    </div>
                  ) : weeklySessions.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-xs font-semibold">
                      No attendance sessions recorded for this week and batch. Select a subject and create new sessions using the roster below.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="text-slate-400 bg-slate-900/60 uppercase font-black tracking-wider text-[10px] border-b border-slate-800/60">
                          <th className="py-2 px-4">Date</th>
                          <th className="py-2 px-4">Subject</th>
                          <th className="py-2 px-4">Session Type</th>
                          <th className="py-2 px-4">Topic Covered</th>
                          <th className="py-2 px-4 text-center">Total</th>
                          <th className="py-2 px-4 text-center text-emerald-400">Present</th>
                          <th className="py-2 px-4 text-center">Attendance %</th>
                          <th className="py-2 px-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {weeklySessions.map((sess) => {
                          const pct = sess.total_records > 0
                            ? Math.round((sess.present_count / sess.total_records) * 100)
                            : null;
                          const isSelectedSession = sess.session_date === sessionDate && sess.session_type === sessionType && sess.subject_id === selectedSubjectId;
                          return (
                            <tr
                              key={sess.id}
                              className={`transition-colors ${isSelectedSession ? 'bg-purple-900/30 border-l-2 border-purple-500' : 'hover:bg-slate-800/40'}`}
                            >
                              <td className="py-2.5 px-4 font-mono font-bold text-indigo-400">{sess.session_date}</td>
                              <td className="py-2.5 px-4 font-bold text-white">
                                {sess.subject_name ? `[${sess.subject_code}] ${sess.subject_name}` : '—'}
                              </td>
                              <td className="py-2.5 px-4">
                                {(() => {
                                  const st = SESSION_TYPES.find(t => t.value === sess.session_type);
                                  return (
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${st?.color || 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                                      {sess.session_type}
                                    </span>
                                  );
                                })()}
                              </td>
                              <td className="py-2.5 px-4 text-slate-400 italic max-w-[180px] truncate">{sess.topic_covered || '—'}</td>
                              <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-300">{sess.total_records || 0}</td>
                              <td className="py-2.5 px-4 text-center font-mono font-bold text-emerald-400">{sess.present_count || 0}</td>
                              <td className="py-2.5 px-4 text-center">
                                {pct !== null ? (
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono border ${pct >= 75 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                    }`}>
                                    {pct}%
                                  </span>
                                ) : <span className="text-slate-600">—</span>}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <button
                                  onClick={() => {
                                    // Load this session into the mark attendance controls
                                    setSessionDate(sess.session_date);
                                    setSessionType(sess.session_type || 'THEORY');
                                    if (sess.subject_id) setSelectedSubjectId(sess.subject_id);
                                    // roster will auto-reload via useEffect
                                  }}
                                  className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all border ${isSelectedSession
                                      ? 'bg-purple-600 text-white border-purple-500'
                                      : 'bg-slate-800 hover:bg-purple-700 text-slate-300 hover:text-white border-slate-700 hover:border-purple-500'
                                    }`}
                                >
                                  {isSelectedSession ? '✏️ Editing' : '▶ Load & Mark'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

              </div>

              {/* Student Attendance Marking Roster Card */}
              <div className="bg-[#1E293B]/80 backdrop-blur-xl border border-indigo-500/20 rounded-2xl overflow-hidden shadow-2xl flex flex-col">

                {/* Header & Bulk Quick Action Bar */}
                <div className="p-5 border-b border-indigo-500/20 bg-gradient-to-r from-slate-900/90 via-slate-900 to-indigo-950/80 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">

                  {/* Left: Summary Stats */}
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <span>👥 Student Attendance Roster</span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono">
                        {totalRoster} Students
                      </span>
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5 text-xs font-bold">
                      <span className="text-emerald-400">Present: {presentCount}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-rose-400">Absent: {absentCount}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-amber-400">Late: {lateCount}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-purple-400">Excused: {excusedCount}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-indigo-300 font-black">Present Rate: {presentPercentage}%</span>
                    </div>
                  </div>

                  {/* Right: Bulk Quick Toggles & Submit Button */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleBulkSetStatus('PRESENT')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-black transition-all flex items-center gap-1"
                    >
                      ✅ All Present
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkSetStatus('ABSENT')}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-black transition-all flex items-center gap-1"
                    >
                      ❌ All Absent
                    </button>
                    <button
                      type="button"
                      onClick={handleInvertStatus}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-black transition-all"
                    >
                      🔄 Invert Status
                    </button>

                    <button
                      type="button"
                      onClick={handleSubmitAttendance}
                      disabled={savingAttendance || studentRoster.length === 0}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 font-black text-xs text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 border border-indigo-400/30 ml-2"
                    >
                      {savingAttendance ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <span>💾</span> Save & Submit Attendance
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Roster DataTable */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-indigo-500/20 text-slate-400 bg-slate-900/60 uppercase font-black tracking-wider text-[10px]">
                        <th className="py-3 px-4 w-12 text-center">#</th>
                        <th className="py-3 px-4 w-12">Photo</th>
                        <th className="py-3 px-4">Reg No</th>
                        <th className="py-3 px-4">Roll No</th>
                        <th className="py-3 px-4">Student Name</th>
                        <th className="py-3 px-4">Group</th>
                        <th className="py-3 px-4 text-center">Mark Attendance Status</th>
                        <th className="py-3 px-4">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {loadingRoster ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                            <span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin inline-block mr-2 align-middle"></span>
                            Loading student roster...
                          </td>
                        </tr>
                      ) : studentRoster.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-500 font-semibold">
                            No students found matching active batch and group selection.
                          </td>
                        </tr>
                      ) : (
                        studentRoster.map((s, idx) => (
                          <tr key={s.id} className="hover:bg-indigo-950/20 transition-colors">
                            <td className="py-3 px-4 text-center text-slate-500 font-mono font-bold">{idx + 1}</td>
                            <td className="py-3 px-4">
                              {s.photo_url ? (
                                <img src={s.photo_url} alt={s.name} className="w-7 h-7 rounded-full object-cover border border-slate-700" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-extrabold">
                                  {s.name?.charAt(0) || '?'}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono font-extrabold text-indigo-400">{s.registration_no}</td>
                            <td className="py-3 px-4 font-mono text-slate-300">{s.rollno || '—'}</td>
                            <td className="py-3 px-4 font-extrabold text-white">{s.name}</td>
                            <td className="py-3 px-4">
                              {s.group_code ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  👥 Group {s.group_code}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500">Whole Batch</span>
                              )}
                            </td>

                            {/* Status Buttons */}
                            <td className="py-3 px-4 text-center">
                              <div className="inline-flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                                <button
                                  type="button"
                                  onClick={() => handleIndividualStatusChange(s.id, 'PRESENT')}
                                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${s.status === 'PRESENT'
                                      ? 'bg-emerald-600 text-white shadow-md'
                                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                                >
                                  P
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleIndividualStatusChange(s.id, 'ABSENT')}
                                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${s.status === 'ABSENT'
                                      ? 'bg-rose-600 text-white shadow-md'
                                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                                >
                                  A
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleIndividualStatusChange(s.id, 'LATE')}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${s.status === 'LATE'
                                      ? 'bg-amber-600 text-white shadow-md'
                                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                                >
                                  L
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleIndividualStatusChange(s.id, 'EXCUSED')}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${s.status === 'EXCUSED'
                                      ? 'bg-purple-600 text-white shadow-md'
                                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                                >
                                  E
                                </button>
                              </div>
                            </td>

                            {/* Remarks Input */}
                            <td className="py-3 px-4">
                              <input
                                type="text"
                                placeholder="Note..."
                                value={s.remarks || ''}
                                onChange={(e) => handleRemarksChange(s.id, e.target.value)}
                                className="w-full px-2.5 py-1 text-[11px] rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: SUBJECT-WISE ATTENDANCE ROSTER ANALYTICS & CUMULATIVE MATRIX */}
          {activeTab === 'roster' && (
            <div className="space-y-6">

              {/* Report Controls & Filter Bar */}
              <div className="bg-[#1E293B]/80 backdrop-blur-xl border border-indigo-500/20 p-5 rounded-2xl space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-xs font-black uppercase text-purple-400 tracking-wider flex items-center gap-2">
                      <span>📊</span> Subject-Wise &amp; Cumulative Student Attendance Reports
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Generate detailed subject-by-subject attendance rosters or multi-subject cumulative matrix reports with NMC eligibility threshold flags.
                    </p>
                  </div>

                  {/* Mode Switcher: Single Subject Roster vs Multi-Subject Matrix */}
                  <div className="bg-slate-950 p-1 rounded-xl flex items-center border border-slate-800 shrink-0 gap-1">
                    <button
                      onClick={() => setReportViewMode('single')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${reportViewMode === 'single'
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                        }`}
                    >
                      📚 Subject Roster Report
                    </button>
                    <button
                      onClick={() => { setReportViewMode('matrix'); fetchMatrixReport(); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${reportViewMode === 'matrix'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                        }`}
                    >
                      📐 Cumulative Matrix
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">

                  {/* Phase Select */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Professional Phase *</label>
                    <select
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-700/80 text-white font-bold"
                    >
                      <option value="1st-prof">1st Prof (MBBS Year 1)</option>
                      <option value="2nd-prof">2nd Prof (MBBS Year 2)</option>
                      <option value="3rd-prof-1">3rd Prof Part-1</option>
                      <option value="3rd-prof-2">3rd Prof Part-2 / Final Prof</option>
                    </select>
                  </div>

                  {/* Batch Select */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Batch *</label>
                    <select
                      value={reportBatchId}
                      onChange={(e) => setReportBatchId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-700/80 text-white font-bold"
                    >
                      {batches.map((b) => {
                        const bCode = b.batch_cd || b.code || String(b.year) || b.id;
                        return (
                          <option key={b.id || bCode} value={bCode}>Batch {b.code} ({b.year})</option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Subject Select (if single mode) */}
                  {reportViewMode === 'single' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Subject Filter</label>
                      <select
                        value={reportSubjectId}
                        onChange={(e) => setReportSubjectId(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-700/80 text-white font-medium"
                      >
                        <option value="">All Subjects Combined</option>
                        {allSubjects.map((s) => {
                          const sCode = s.subject_cd || s.code || s.id;
                          return (
                            <option key={s.id || sCode} value={sCode}>[{s.code || sCode}] {s.name}</option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  {/* Start Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">From Date</label>
                    <input
                      type="date"
                      value={reportFromDate}
                      onChange={(e) => setReportFromDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-700/80 text-white font-mono"
                    />
                  </div>

                  {/* End Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">To Date</label>
                    <input
                      type="date"
                      value={reportToDate}
                      onChange={(e) => setReportToDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-700/80 text-white font-mono"
                    />
                  </div>

                  {/* Action Button */}
                  <div className="flex items-end">
                    <button
                      onClick={reportViewMode === 'single' ? fetchBatchReport : fetchMatrixReport}
                      disabled={loadingReport}
                      className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <span>⚡</span> {loadingReport ? 'Fetching Data...' : 'Get Attendance Data'}
                    </button>
                  </div>
                </div>

                {/* Shortage Filter Checkbox */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                    <input
                      type="checkbox"
                      checked={onlyShortage}
                      onChange={(e) => setOnlyShortage(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-rose-400 font-extrabold">🚨 Filter Shortage List Only (&lt; 75% Attendance)</span>
                  </label>
                </div>
              </div>

              {/* SINGLE SUBJECT ROSTER REPORT VIEW */}
              {reportViewMode === 'single' && (
                <div className="bg-[#1E293B]/80 backdrop-blur-xl border border-indigo-500/20 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="p-4 border-b border-indigo-500/20 bg-slate-900/80 flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                      <span>🎯</span> Student-wise Subject Attendance Summary ({batchReport.length} Students)
                    </h3>
                    <button
                      onClick={() => window.print()}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow transition-all flex items-center gap-1.5"
                    >
                      <span>🖨️</span> Print Roster Report
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-indigo-500/20 text-slate-400 bg-slate-900/60 uppercase font-black tracking-wider text-[10px]">
                          <th className="py-3 px-3 text-center w-10">S.No</th>
                          <th className="py-3 px-4">Reg No</th>
                          <th className="py-3 px-4">Student Name</th>
                          <th className="py-3 px-4 text-center">Conducted Classes</th>
                          <th className="py-3 px-4 text-center">Attendance Status (P / A)</th>
                          <th className="py-3 px-4 text-center text-amber-400">Late / Excused</th>
                          <th className="py-3 px-4 text-center">Attendance %</th>
                          <th className="py-3 px-4 text-center">NMC Exam Eligibility</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {loadingReport ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                              Generating batch attendance report...
                            </td>
                          </tr>
                        ) : batchReport.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-slate-500 font-semibold italic">
                              No attendance records found for this batch, subject, and date range.
                            </td>
                          </tr>
                        ) : (
                          batchReport
                            .filter(r => !onlyShortage || parseFloat(String(r.attendance_pct || 0)) < 75)
                            .map((row, idx) => {
                              const pct = parseFloat(String(row.attendance_pct || 0));
                              const isEligible = pct >= 75.0;
                              const presentCount = Number(row.present || 0);
                              const absentCount = Number(row.absent || 0);
                              const isSingleClass = Number(row.total_classes || 0) <= 1;

                              return (
                                <tr key={row.student_id} className="hover:bg-slate-800/40 transition-colors">
                                  <td className="py-3 px-3 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                                  <td className="py-3 px-4 font-mono text-indigo-400 font-bold">{row.rollno || '—'}</td>
                                  <td className="py-3 px-4 font-bold text-white">{row.name}</td>
                                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-300">{row.total_classes || 0}</td>

                                  {/* Attendance Status (P / A or Subject-wise) */}
                                  <td className="py-3 px-4 text-center">
                                    {!reportSubjectId && Array.isArray((row as any).subject_sessions) && (row as any).subject_sessions.length > 0 ? (
                                      <div className="flex flex-wrap items-center justify-center gap-1.5 font-mono text-xs">
                                        {(Array.from(
                                          (row as any).subject_sessions.reduce((acc: Map<string, string>, ss: any) => {
                                            if (ss.subject_code && ss.status) acc.set(ss.subject_code, ss.status);
                                            return acc;
                                          }, new Map<string, string>()).entries()
                                        ) as [string, string][]).map(([code, status]) => {
                                          const isP = ['PRESENT', 'LATE'].includes(status);
                                          return (
                                            <span
                                              key={code}
                                              className={`px-2 py-0.5 rounded font-black border ${isP
                                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                                  : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                                                }`}
                                            >
                                              {code}: {isP ? 'P' : 'A'}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    ) : Number(row.total_classes || 0) <= 1 ? (
                                      Number(row.present || 0) > 0 ? (
                                        <span className="px-3 py-1 rounded-md text-xs font-black font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                          P (Present)
                                        </span>
                                      ) : (
                                        <span className="px-3 py-1 rounded-md text-xs font-black font-mono bg-rose-500/20 text-rose-400 border border-rose-500/40">
                                          A (Absent)
                                        </span>
                                      )
                                    ) : (
                                      <div className="flex items-center justify-center gap-1.5 font-mono font-bold text-xs">
                                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                          P: {Number(row.present || 0)}
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                          A: {Number(row.absent || 0)}
                                        </span>
                                      </div>
                                    )}
                                  </td>

                                  <td className="py-3 px-4 text-center font-mono text-amber-400">
                                    {(Number((row as any).late || 0) + Number((row as any).excused || 0))}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-black font-mono border ${isEligible
                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                      }`}>
                                      {pct.toFixed(1)}%
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${isEligible
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
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

              {/* MULTI-SUBJECT CUMULATIVE MATRIX REPORT VIEW */}
              {reportViewMode === 'matrix' && (
                <div className="bg-[#1E293B]/80 backdrop-blur-xl border border-indigo-500/20 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="p-4 border-b border-indigo-500/20 bg-slate-900/80 flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-2">
                      <span>📐</span> Multi-Subject Cumulative Attendance Matrix ({matrixReport?.students.length || 0} Students)
                    </h3>
                    <button
                      onClick={() => window.print()}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow transition-all flex items-center gap-1.5"
                    >
                      <span>🖨️</span> Print Matrix Report
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-indigo-500/20 text-slate-400 bg-slate-900/60 uppercase font-black tracking-wider text-[10px]">
                          <th className="py-3 px-3 text-center w-10">S.No</th>
                          <th className="py-3 px-4">Reg No</th>
                          <th className="py-3 px-4">Student Name</th>
                          {matrixReport?.subjects.map(s => (
                            <th key={s.id} className="py-3 px-3 text-center font-black" title={s.name}>
                              {s.name}
                            </th>
                          ))}
                          <th className="py-3 px-4 text-center text-purple-300 font-extrabold">Overall %</th>
                          <th className="py-3 px-4 text-center">NMC Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {loadingReport ? (
                          <tr>
                            <td colSpan={(matrixReport?.subjects.length || 0) + 5} className="p-8 text-center text-slate-400 font-bold">
                              Generating cumulative attendance matrix...
                            </td>
                          </tr>
                        ) : !matrixReport || matrixReport.students.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-500 font-semibold italic">
                              No matrix attendance records available for this batch and date range.
                            </td>
                          </tr>
                        ) : (
                          matrixReport.students
                            .filter(st => !onlyShortage || st.overallPct < 75)
                            .map((st, idx) => {
                              const isEligible = st.overallPct >= 75.0;

                              return (
                                <tr key={st.student_id} className="hover:bg-slate-800/40 transition-colors">
                                  <td className="py-3 px-3 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                                  <td className="py-3 px-4 font-mono text-indigo-400 font-bold">{st.rollno || '—'}</td>
                                  <td className="py-3 px-4 font-bold text-white whitespace-nowrap">{st.name}</td>

                                  {/* Subject Columns with Attended / Conducted (Pct%) */}
                                  {matrixReport.subjects.map(s => {
                                    const subData = st.subjects[s.id];
                                    if (!subData || subData.total === 0) {
                                      return <td key={s.id} className="py-3 px-3 text-center text-slate-600 font-mono">—</td>;
                                    }
                                    const { present, total, pct } = subData;
                                    const isPass = pct >= 75.0;
                                    return (
                                      <td key={s.id} className="py-3 px-3 text-center font-mono font-bold">
                                        <span className={`px-2 py-0.5 rounded text-[11px] font-black ${isPass ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                                          }`}>
                                          {present}/{total} ({pct.toFixed(0)}%)
                                        </span>
                                      </td>
                                    );
                                  })}

                                  {/* Overall Cumulative Percentage */}
                                  <td className="py-3 px-4 text-center font-mono font-black text-sm text-white">
                                    <span className={`px-2.5 py-1 rounded-full border ${isEligible ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                      }`}>
                                      {st.overallPct.toFixed(1)}%
                                    </span>
                                  </td>

                                  {/* Status */}
                                  <td className="py-3 px-4 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${isEligible
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
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
          )}

          {/* TAB 3: SESSION HISTORY & AUDIT LOG */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="bg-[#1E293B]/80 backdrop-blur-xl border border-indigo-500/20 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-indigo-500/20 bg-slate-900/80 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-2">
                    <span>📜</span> Recorded Attendance Sessions History Log
                  </h3>
                  <button
                    onClick={fetchPastSessions}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700 transition-all"
                  >
                    🔄 Refresh Log
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-indigo-500/20 text-slate-400 bg-slate-900/60 uppercase font-black tracking-wider text-[10px]">
                        <th className="py-3 px-4">Session Date</th>
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-4">Session Type</th>
                        <th className="py-3 px-4">Batch</th>
                        <th className="py-3 px-4">Topic Covered</th>
                        <th className="py-3 px-4 text-center">Records</th>
                        <th className="py-3 px-4 text-center">Present</th>
                        <th className="py-3 px-4">Marked By</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {loadingHistory ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-400 font-bold">
                            Loading past attendance sessions...
                          </td>
                        </tr>
                      ) : pastSessions.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-500 font-semibold">
                            No attendance sessions recorded yet.
                          </td>
                        </tr>
                      ) : (
                        pastSessions.map((sess) => (
                          <tr key={sess.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-indigo-400">{sess.session_date}</td>
                            <td className="py-3 px-4 font-bold text-white">
                              {sess.subject_name ? `[${sess.subject_code}] ${sess.subject_name}` : 'General Subject'}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                {sess.session_type}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-300">{sess.batch_code || '—'}</td>
                            <td className="py-3 px-4 text-slate-300 italic">{sess.topic_covered || '—'}</td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-slate-300">{sess.total_records || 0}</td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">{sess.present_count || 0}</td>
                            <td className="py-3 px-4 font-semibold text-slate-300">{sess.faculty_name || 'Clerk / Admin'}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${sess.is_cancelled
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                }`}>
                                {sess.is_cancelled ? 'CANCELLED' : 'ACTIVE'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
