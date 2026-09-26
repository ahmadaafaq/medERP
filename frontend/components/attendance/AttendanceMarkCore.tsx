'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

interface DropdownItem {
  id: string;
  code: string;
  name: string;
}

interface TimetableSlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject_id?: string;
  subject_name?: string;
  subject_code?: string;
  faculty_id?: string;
  faculty_name?: string;
  room?: string;
  slot_type?: string;
  batch_id?: string;
  batch_code?: string;
  topic?: string;
  unit_name?: string;
  section?: string;
  semester?: string;
  course_cd?: string;
  branch_cd?: string;
  batch_cd?: string;
  description?: string;
  // Dynamic attendance metadata
  is_attendance_marked?: boolean;
  session_id?: string;
  present_count?: number;
  absent_count?: number;
  late_count?: number;
  total_students_marked?: number;
  computed_date?: string;
}

interface StudentItem {
  id: string;
  stud_name: string;
  stud_reg_no: string;
  rollno: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  remarks?: string;
  record_id?: string;
  is_saved_in_db?: boolean;
  original_status?: 'PRESENT' | 'ABSENT' | 'LATE';
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

const DAYS_OF_WEEK = [
  { day: 1, name: 'Monday', short: 'Mon' },
  { day: 2, name: 'Tuesday', short: 'Tue' },
  { day: 3, name: 'Wednesday', short: 'Wed' },
  { day: 4, name: 'Thursday', short: 'Thu' },
  { day: 5, name: 'Friday', short: 'Fri' },
  { day: 6, name: 'Saturday', short: 'Sat' },
  { day: 7, name: 'Sunday', short: 'Sun' },
];

export default function AttendanceMarkCore({ role = 'FACULTY' }: { role?: string }) {
  // Cascading Academic States
  const [collegesList, setCollegesList] = useState<DropdownItem[]>([]);
  const [coursesList, setCoursesList] = useState<DropdownItem[]>([]);
  const [branchesList, setBranchesList] = useState<DropdownItem[]>([]);
  const [batchesList, setBatchesList] = useState<DropdownItem[]>([]);
  const [semestersList, setSemestersList] = useState<DropdownItem[]>([]);
  const [sectionsList, setSectionsList] = useState<DropdownItem[]>([]);

  // Loading states per dropdown step
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);

  // Selected Filters
  const [selectedCollege, setSelectedCollege] = useState('1');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSem, setSelectedSem] = useState('1');
  const [selectedSection, setSelectedSection] = useState('all');

  // Filter Modes: 'DATE_WISE' | 'DAY_WISE' | 'MONTH_WISE'
  const [filterMode, setFilterMode] = useState<'DATE_WISE' | 'DAY_WISE' | 'MONTH_WISE'>('DATE_WISE');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 6);
    return d.toISOString().split('T')[0];
  });
  const [selectedDayFilter, setSelectedDayFilter] = useState<number>(() => {
    const cur = new Date().getDay();
    return cur === 0 ? 7 : cur;
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Scheduled Slots & Students
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(null);
  const [selectedSlotDate, setSelectedSlotDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [committing, setCommitting] = useState(false);

  // Search & Sort for Left Panel
  const [studentSearch, setStudentSearch] = useState('');
  const [sortBy, setSortBy] = useState<'ROLL' | 'NAME'>('ROLL');
  const [sortAsc, setSortAsc] = useState(true);

  // Attendance Session Details for Right Panel
  const [topicCovered, setTopicCovered] = useState('');
  const [sessionRemarks, setSessionRemarks] = useState('');
  const [sessionType, setSessionType] = useState('THEORY');

  // Tenant / Role context
  const [userRole, setUserRole] = useState(role);
  const [tenantSlug, setTenantSlug] = useState('srms-cet-bareilly');
  const [facultyId, setFacultyId] = useState<string>('');
  const [facultyEmpId, setFacultyEmpId] = useState<string>('');
  const [facultyName, setFacultyName] = useState<string>('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showAlert = (type: 'success' | 'error' | 'info', text: string) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 5000);
  };

  const getEffectiveToken = (): string => {
    if (typeof window === 'undefined') return '';
    let t = localStorage.getItem('token') || '';
    if (!t && typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)auth_token=([^;]+)/);
      if (match) t = decodeURIComponent(match[1]);
    }
    return t;
  };

  const refreshAuthToken = async (): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (!storedRefreshToken) return null;
    try {
      const rRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });
      if (rRes.ok) {
        const rData = await rRes.json();
        const authData = rData?.data || rData;
        const newAccess = authData?.accessToken;
        const newRefresh = authData?.refreshToken;
        if (newAccess) {
          localStorage.setItem('token', newAccess);
          if (newRefresh) localStorage.setItem('refreshToken', newRefresh);
          document.cookie = `auth_token=${newAccess}; path=/; max-age=604800; SameSite=Lax`;
          return newAccess;
        }
      }
    } catch {}
    return null;
  };

  // Initialize context and metadata
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('role') || role || 'FACULTY';
      const storedSlug = (localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly')
        .replace(/^tenant_/, '').replace(/^tenant-/, '').trim();
      const storedColg = localStorage.getItem('colg_cd') || localStorage.getItem('colgCd') || '1';
      setUserRole(storedRole.toUpperCase());
      setTenantSlug(storedSlug);
      setSelectedCollege(storedColg);

      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          const fid = u.faculty_id || u.profile?.id || u.id || '';
          const empid = u.emp_id || u.profile?.emp_id || '';
          const fname = u.name || u.profile?.name || '';
          if (fid) setFacultyId(fid);
          if (empid) setFacultyEmpId(empid);
          if (fname) setFacultyName(fname);
        } catch {}
      }

      const token = localStorage.getItem('token') || '';
      fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}`, 'x-tenant-slug': storedSlug },
      })
        .then((r) => r.json())
        .then((meJson) => {
          const meData = meJson.data || meJson;
          const profile = meData.profile || {};
          const fid = profile.id || meData.id;
          const empid = profile.emp_id || meData.emp_id;
          const fname = profile.name || meData.name;
          if (fid) setFacultyId(fid);
          if (empid) setFacultyEmpId(empid);
          if (fname) setFacultyName(fname);
        })
        .catch(() => {});
    }
    fetchAcademicMetadata();
  }, [role]);

  // Helper: get semester count from course_cd
  const getSemCountForCourse = (courseCd: string): number => {
    const c = String(courseCd);
    // MCA (3,9), MBA (4,10) = 4 sems; BCA (13) = 6 sems; B.Tech/B.Pharm = 8 sems; default 8
    if (['3', '9'].includes(c)) return 4;  // MCA
    if (['4', '10'].includes(c)) return 4; // MBA
    if (c === '13') return 6;              // BCA
    if (['2', '6', '8'].includes(c)) return 8; // B.Pharm
    return 8; // B.Tech and others
  };

  // Rebuild semesters list whenever course changes
  const buildSemestersList = (courseCd: string) => {
    const count = getSemCountForCourse(courseCd);
    const list: DropdownItem[] = Array.from({ length: count }, (_, i) => ({
      id: String(i + 1),
      code: String(i + 1),
      name: `Semester ${i + 1}`,
    }));
    setSemestersList(list);
    // Reset sem to 1 when course changes
    setSelectedSem('1');
  };

  // Build static sections list (can be extended to fetch dynamically later)
  const buildSectionsList = () => {
    const list: DropdownItem[] = [
      { id: 'all', code: 'all', name: 'All Sections' },
      ...['A', 'B', 'C', '1', '2', '3'].map(s => ({ id: s, code: s, name: `Section ${s}` })),
    ];
    setSectionsList(list);
  };

  const fetchAcademicMetadata = async () => {
    try {
      const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-cet-bareilly' : 'srms-cet-bareilly';
      const colgCd = typeof window !== 'undefined' ? localStorage.getItem('colg_cd') || '1' : '1';

      buildSectionsList();

      const [colgRes, crsRes] = await Promise.all([
        fetch('/api/srms/colleges').catch(() => null),
        fetch(`/api/srms/courses?colgcd=${colgCd}&tenant=${slug}`).catch(() => null),
      ]);

      if (colgRes && colgRes.ok) {
        const j = await colgRes.json();
        const list = Array.isArray(j) ? j : j.data || [];
        setCollegesList(list.map((c: any) => ({
          id: String(c.colg_cd || c.code || '1'),
          code: String(c.colg_cd || c.code || '1'),
          name: c.colg_name || c.name || `College ${c.colg_cd || 1}`,
        })));
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
        if (mappedCourses.length > 0) {
          const firstCrs = mappedCourses[0].code;
          setSelectedCourse(firstCrs);
          buildSemestersList(firstCrs);
          // Step 1: Fetch branches for first course
          await fetchBranches(colgCd, firstCrs, slug);
        }
      } else {
        // Fallback if courses API fails
        buildSemestersList('13');
      }
    } catch (err) {
      console.warn('Error fetching academic metadata:', err);
    }
  };

  // STEP 1: Fetch branches for a course — resets branch, batch, slots
  const fetchBranches = async (colg: string, crs: string, customSlug?: string) => {
    const slug = customSlug || tenantSlug || 'srms-cet-bareilly';
    setLoadingBranches(true);
    setBranchesList([]);
    setSelectedBranch('');
    setBatchesList([]);
    setSelectedBatch('');
    setSlots([]);
    setSelectedSlot(null);
    setStudents([]);
    try {
      const res = await fetch(`/api/srms/branches?colgcd=${colg}&coursecd=${crs}&tenant=${slug}`).catch(() => null);
      if (res && res.ok) {
        const j = await res.json();
        const list = Array.isArray(j) ? j : j.data || [];
        const mapped: DropdownItem[] = list.map((b: any) => ({
          id: String(b.branch_cd || b.code || '1'),
          code: String(b.branch_cd || b.code || '1'),
          name: b.branch_name || b.name || `Branch ${b.branch_cd || 1}`,
        }));
        setBranchesList(mapped);
        if (mapped.length > 0) {
          // Always reset to first branch of the new course
          setSelectedBranch(mapped[0].code);
          // Step 2: Auto-fetch batches for the first branch
          await fetchBatches(colg, crs, mapped[0].code, slug);
        }
      }
    } catch (e) {
      console.warn('Error fetching branches:', e);
    } finally {
      setLoadingBranches(false);
    }
  };

  // STEP 2: Fetch batches for a branch — resets batch and slots
  const fetchBatches = async (colg: string, crs: string, branchCd: string, customSlug?: string) => {
    const slug = customSlug || tenantSlug || 'srms-cet-bareilly';
    setLoadingBatches(true);
    setBatchesList([]);
    setSelectedBatch('');
    setSlots([]);
    setSelectedSlot(null);
    setStudents([]);
    try {
      const res = await fetch(
        `/api/srms/batches?colgcd=${colg}&coursecd=${crs}&branchcd=${branchCd}&tenant=${slug}`
      ).catch(() => null);
      if (res && res.ok) {
        const j = await res.json();
        const list = Array.isArray(j) ? j : j.data || [];
        const mapped: DropdownItem[] = list.map((b: any) => {
          const rawName = String(b.batch_name || b.name || b.year || b.batch_cd || '');
          const year = rawName.match(/20\d{2}/)?.[0] || rawName;
          return {
            id: String(b.batch_cd || b.code || b.curr_bat_Cd || ''),
            code: String(b.batch_cd || b.code || b.curr_bat_Cd || ''),
            name: `Batch ${year}`,
          };
        }).filter((b: any) => b.code);
        // Deduplicate by code
        const seen = new Set<string>();
        const deduped = mapped.filter(b => { if (seen.has(b.code)) return false; seen.add(b.code); return true; });
        setBatchesList(deduped);
        if (deduped.length > 0) {
          // Prefer 2025 batch if available
          const match2025 = deduped.find(b => b.name.includes('2025'));
          setSelectedBatch(match2025 ? match2025.code : deduped[0].code);
        }
      }
    } catch (e) {
      console.warn('Error fetching batches:', e);
    } finally {
      setLoadingBatches(false);
    }
  };

  // ── 1. GET SCHEDULED TIMETABLE LECTURES ─────────────────────────────────────
  // Helper to determine slot date based on active filter mode
  const getSlotDate = (slot: TimetableSlot): string => {
    const dayOfWeek = Number(slot.day_of_week);
    if (filterMode === 'DAY_WISE') {
      const now = new Date();
      const currDay = now.getDay() === 0 ? 7 : now.getDay();
      const diff = dayOfWeek - currDay;
      const target = new Date(now);
      target.setDate(now.getDate() + diff);
      return target.toISOString().split('T')[0];
    } else {
      const start = new Date(fromDate);
      const end = new Date(toDate);
      const cur = new Date(start);
      while (cur <= end) {
        const d = cur.getDay() === 0 ? 7 : cur.getDay();
        if (d === dayOfWeek) {
          return cur.toISOString().split('T')[0];
        }
        cur.setDate(cur.getDate() + 1);
      }
      return fromDate;
    }
  };

  const formatDisplayDate = (dateStr: string): string => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${dayNames[d.getDay()]}, ${parts[2]} ${months[d.getMonth()]} ${parts[0]}`;
      }
    } catch {}
    return dateStr;
  };

  // ── 1. GET SCHEDULED TIMETABLE LECTURES ─────────────────────────────────────
  const handleGetScheduled = async (customCourse?: string, customFacId?: string) => {
    // Guard: ensure cascading selection is complete
    const targetCourse = customCourse !== undefined ? customCourse : selectedCourse;
    if (!targetCourse) { showAlert('error', 'Please select a Course first.'); return; }
    if (!selectedBranch) { showAlert('error', 'Please select a Branch / Department first.'); return; }
    if (!selectedBatch) { showAlert('error', 'Please select a Batch first.'); return; }

    setLoadingSchedule(true);
    setSelectedSlot(null);
    setStudents([]);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const params = new URLSearchParams();
      params.append('tenant', tenantSlug);

      if (targetCourse && targetCourse !== 'all') params.append('courseCd', targetCourse);
      if (selectedBranch && selectedBranch !== 'all') params.append('branchCd', selectedBranch);
      if (selectedBatch && selectedBatch !== 'all') params.append('batchCd', selectedBatch);
      if (selectedSem && selectedSem !== 'all') params.append('semester', selectedSem);
      if (selectedSection && selectedSection !== 'all') params.append('section', selectedSection);

      if (userRole === 'FACULTY') {
        const fid = customFacId || facultyId || facultyEmpId || facultyName;
        if (fid) {
          params.append('facultyId', fid);
        }
      }

      const res = await fetch(`${API_BASE}/timetable?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': tenantSlug,
        },
      });

      if (res.ok) {
        const json = await res.json();
        const rawSlots: TimetableSlot[] = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];

        // Check attendance status for these slots
        const enrichedSlots = await enrichSlotsWithAttendanceStatus(rawSlots);
        setSlots(enrichedSlots);

        if (enrichedSlots.length === 0) {
          showAlert('info', 'No scheduled lectures found for this selection.');
        } else {
          showAlert('success', `Found ${enrichedSlots.length} scheduled lecture session(s).`);
          handleSelectSlot(enrichedSlots[0]);
        }
      } else {
        showAlert('error', 'Failed to retrieve timetable schedule from server.');
        setSlots([]);
      }
    } catch (err: any) {
      showAlert('error', err?.message || 'Network error fetching scheduled timetable.');
      setSlots([]);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const isUUID = (val?: string | null) => !!val && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);
  const isCourseName = (val?: string | null) => {
    if (!val) return false;
    const v = val.trim().toLowerCase();
    return ['b.tech', 'btech', 'b.tech.', 'bca', 'mca', 'mba', 'bba', 'b.pharm', 'bpharm', 'm.tech', 'mtech'].includes(v) || v.startsWith('course');
  };

  const enrichSlotsWithAttendanceStatus = async (rawSlots: TimetableSlot[]): Promise<TimetableSlot[]> => {
    const token = getEffectiveToken();

    const enriched = await Promise.all(
      rawSlots.map(async (s) => {
        try {
          const slotDate = getSlotDate(s);
          // Per RestrictAPI.md: send subject_cd (numeric code) AND UUID fallback
          const params = new URLSearchParams({
            tenant: tenantSlug,
            sessionDate: slotDate,
            timetableSlotId: s.id,
          });
          // subject_cd (numeric code like "88535" or "85717") — never course title
          const validSubCd = s.subject_code && !isCourseName(s.subject_code) ? s.subject_code : ((s as any).subject_cd && !isCourseName((s as any).subject_cd) ? (s as any).subject_cd : '');
          if (validSubCd) params.append('subjectCd', validSubCd);
          // UUID fallback
          if (s.subject_id && isUUID(s.subject_id)) params.append('subjectId', s.subject_id);
          // batch_id UUID
          if (s.batch_id) params.append('batchId', s.batch_id);

          const cRes = await fetch(`${API_BASE}/attendance/active-session?${params.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': tenantSlug },
          }).catch(() => null);

          if (cRes && cRes.ok) {
            const cJson = await cRes.json();
            const sessionData = cJson?.data || cJson;
            const sessionId = sessionData?.id || sessionData?.sessionId;
            if (sessionId || sessionData?.found) {
              const records = sessionData.records || [];
              const present = records.filter((r: any) => r.status === 'PRESENT').length;
              const absent = records.filter((r: any) => r.status === 'ABSENT').length;
              const late = records.filter((r: any) => r.status === 'LATE').length;
              return {
                ...s,
                is_attendance_marked: true,
                session_id: sessionId || s.session_id,
                topic: sessionData.topic_covered || sessionData.topicCovered || s.topic,
                present_count: present,
                absent_count: absent,
                late_count: late,
                total_students_marked: records.length,
              };
            }
          }
        } catch {}
        return s;
      })
    );

    return enriched;
  };

  // ── 2. CLICK LECTURE CARD: LOAD STUDENTS AND ATTENDANCE STATUS ────────────
  const handleSelectSlot = async (slot: TimetableSlot) => {
    setSelectedSlot(slot);
    setLoadingStudents(true);
    setTopicCovered(slot.topic || (slot.description ? slot.description.replace(/\([^)]*\)/g, '').trim() : ''));
    setSessionType(slot.slot_type?.toUpperCase() || 'THEORY');

    const targetDateStr = getSlotDate(slot);
    setSelectedSlotDate(targetDateStr);

    try {
      const token = getEffectiveToken();

      // 1. Fetch Students using the slot's batch_id UUID from PostgreSQL
      //    Priority: slot.batch_id (UUID) → then filter by course/semester/section
      let fetchedStudents: any[] = [];

      const studentParams = new URLSearchParams();
      studentParams.append('tenant', tenantSlug);
      if (slot.batch_id) studentParams.append('batchId', slot.batch_id);
      if (slot.id) studentParams.append('timetableSlotId', slot.id);
      if (slot.course_cd) studentParams.append('courseCd', slot.course_cd);
      if (slot.branch_cd) studentParams.append('branchCd', slot.branch_cd);
      if (slot.semester) studentParams.append('semester', slot.semester);
      if (slot.section) studentParams.append('section', slot.section);

      const studRes = await fetch(`${API_BASE}/attendance/students-for-slot?${studentParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': tenantSlug },
      }).catch(() => null);

      if (studRes && studRes.ok) {
        const sJson = await studRes.json();
        fetchedStudents = Array.isArray(sJson.students) ? sJson.students : [];
      }

      // Fallback: try student-master with batchId UUID if slot.batch_id exists
      if (fetchedStudents.length === 0 && slot.batch_id) {
        const altRes = await fetch(
          `${API_BASE}/student-master?tenant=${tenantSlug}&batchId=${slot.batch_id}&limit=200`,
          { headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': tenantSlug } }
        ).catch(() => null);
        if (altRes && altRes.ok) {
          const aJson = await altRes.json();
          fetchedStudents = Array.isArray(aJson.data) ? aJson.data : Array.isArray(aJson) ? aJson : [];
        }
      }

      // Last resort fallback: fetch by course only (if batch info completely unavailable)
      if (fetchedStudents.length === 0) {
        const courseParam = (slot as any).course_cd || selectedCourse;
        if (courseParam) {
          const lastRes = await fetch(
            `${API_BASE}/student-master?tenant=${tenantSlug}&courseId=${courseParam}&limit=100`,
            { headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': tenantSlug } }
          ).catch(() => null);
          if (lastRes && lastRes.ok) {
            const lJson = await lastRes.json();
            fetchedStudents = Array.isArray(lJson.data) ? lJson.data : [];
          }
        }
      }

      // 2. Fetch existing session & marks for this slot & date
      let existingRecordsMap = new Map<string, { status: 'PRESENT' | 'ABSENT' | 'LATE'; remarks?: string; record_id?: string }>();

      // Per RestrictAPI.md: send subjectCd (numeric) + subjectId UUID + timetableSlotId
      const activeParams = new URLSearchParams({
        tenant: tenantSlug,
        sessionDate: targetDateStr,
        timetableSlotId: slot.id,
      });
      const validSubCd = slot.subject_code && !isCourseName(slot.subject_code) ? slot.subject_code : ((slot as any).subject_cd && !isCourseName((slot as any).subject_cd) ? (slot as any).subject_cd : '');
      if (validSubCd) activeParams.append('subjectCd', validSubCd);
      if (slot.subject_id && isUUID(slot.subject_id)) activeParams.append('subjectId', slot.subject_id);
      if (slot.batch_id) activeParams.append('batchId', slot.batch_id);

      const activeRes = await fetch(`${API_BASE}/attendance/active-session?${activeParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': tenantSlug },
      }).catch(() => null);


      if (activeRes && activeRes.ok) {
        const aJson = await activeRes.json();
        const sessionData = aJson?.data || aJson;
        const sessionId = sessionData?.id || sessionData?.sessionId;

        if (sessionData && (sessionId || sessionData.found)) {
          if (sessionData.topicCovered || sessionData.topic_covered) {
            setTopicCovered(sessionData.topicCovered || sessionData.topic_covered);
          }
          if (sessionData.sessionType || sessionData.session_type) {
            setSessionType(sessionData.sessionType || sessionData.session_type);
          }

          const records = sessionData.records || [];
          records.forEach((r: any) => {
            const sid = String(r.student_id || r.studentId || '').trim();
            const reg = String(r.registration_no || '').trim();
            const roll = String(r.rollno || '').trim();
            const entry = {
              status: r.status as 'PRESENT' | 'ABSENT' | 'LATE',
              remarks: r.remarks || '',
              record_id: r.id,
            };
            if (sid) existingRecordsMap.set(sid, entry);
            if (reg) existingRecordsMap.set(reg, entry);
            if (roll) existingRecordsMap.set(roll, entry);
          });

          // Mark slot as attended
          setSelectedSlot((prev) => (prev ? {
            ...prev,
            is_attendance_marked: true,
            session_id: sessionId || prev.session_id,
            present_count: records.filter((r: any) => r.status === 'PRESENT').length,
            absent_count: records.filter((r: any) => r.status === 'ABSENT').length,
            late_count: records.filter((r: any) => r.status === 'LATE').length,
            total_students_marked: records.length,
          } : null));
        }
      }

      // 3. Map students into unified roster
      const mapped: StudentItem[] = fetchedStudents.map((s: any) => {
        const sid = String(s.id);
        const reg = String(s.registration_no || s.registrationNo || s.reg_no || '').trim();
        const roll = String(s.rollno || s.roll_no || '').trim();

        // Check if student has saved attendance in DB
        const existing = existingRecordsMap.get(sid) 
          || (reg ? existingRecordsMap.get(reg) : undefined) 
          || (roll ? existingRecordsMap.get(roll) : undefined);

        return {
          id: sid,
          stud_name: s.name || s.stud_name || 'Student',
          stud_reg_no: reg,
          rollno: roll,
          status: existing ? existing.status : 'PRESENT',
          remarks: existing?.remarks || '',
          record_id: existing?.record_id,
          is_saved_in_db: !!existing,
          original_status: existing ? existing.status : undefined,
        };
      });

      setStudents(mapped);

      if (mapped.length === 0) {
        showAlert('info', `No students found for batch "${slot.batch_code || slot.batch_cd || slot.batch_id || 'unknown'}". Check batch assignment in timetable.`);
      }
    } catch (err: any) {
      console.error('Error loading students for slot:', err);
      showAlert('error', 'Error loading student roster for this lecture.');
    } finally {
      setLoadingStudents(false);
    }
  };

  // ── 3. STUDENT MARKING ACTIONS ──────────────────────────────────────────────
  const handleToggleStatus = (studentId: string, newStatus: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status: newStatus } : s))
    );
  };

  const handleUpdateRemarks = (studentId: string, remarks: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, remarks } : s))
    );
  };

  const handleMarkAll = (status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setStudents((prev) => prev.map((s) => ({ ...s, status })));
    showAlert('info', `Marked all ${students.length} students as ${status}.`);
  };

  // ── 4. COMMIT ATTENDANCE SESSION TO POSTGRESQL ─────────────────────────────
  const handleCommitAttendance = async () => {
    if (!selectedSlot) {
      showAlert('error', 'Please select a scheduled lecture card first.');
      return;
    }
    if (students.length === 0) {
      showAlert('error', 'No students in roster. Load students before committing.');
      return;
    }

    // Read token with multi-source fallback (localStorage + cookie)
    let token = getEffectiveToken();
    if (!token) {
      showAlert('error', 'Authentication token missing. Please log in again.');
      return;
    }

    setCommitting(true);
    try {
      // batchId: prefer UUID from slot, fallback to batch_cd from selected batch
      const batchIdToSend = selectedSlot.batch_id || selectedBatch || '';

      const payload: any = {
        batchId: batchIdToSend,
        sessionDate: selectedSlotDate,
        sessionType: sessionType || 'THEORY',
        topicCovered: topicCovered || selectedSlot.topic || selectedSlot.description || 'Regular Lecture',
        timetableSlotId: selectedSlot.id,
        records: students.map((s) => ({
          studentId: s.id,
          status: s.status,
          ...(s.remarks ? { remarks: s.remarks } : {}),
        })),
      };

      // Extract clean numeric/lecture subject code (e.g., "85717", "KCS-302", "88535")
      const rawSubCd = selectedSlot.subject_code || (selectedSlot as any).subject_cd || (selectedSlot as any).sub_cd || (selectedSlot as any).linkcd || (selectedSlot as any).subject_paper_code;
      const cleanSubjectCd = rawSubCd && !isCourseName(rawSubCd) ? String(rawSubCd).trim() : '';

      // Only pass subjectId if it is a valid UUID — never send course title strings like "B.Tech"
      if (selectedSlot.subject_id && isUUID(selectedSlot.subject_id)) {
        payload.subjectId = selectedSlot.subject_id;
      }
      if (cleanSubjectCd) {
        payload.subjectCd = cleanSubjectCd;
      }
      if (selectedSlot.batch_cd) {
        payload.batchCd = selectedSlot.batch_cd;
      }

      let activeToken = token;
      let res = await fetch(`${API_BASE}/attendance/sessions?tenant=${tenantSlug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`,
          'x-tenant-slug': tenantSlug,
        },
        body: JSON.stringify(payload),
      });

      // Seamless Auto-Refresh on 401 Token Expiration
      if (res.status === 401) {
        const refreshed = await refreshAuthToken();
        if (refreshed) {
          activeToken = refreshed;
          res = await fetch(`${API_BASE}/attendance/sessions?tenant=${tenantSlug}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${activeToken}`,
              'x-tenant-slug': tenantSlug,
            },
            body: JSON.stringify(payload),
          });
        }
      }

      let json: any = null;
      try { json = await res.json(); } catch { json = null; }

      if (res.ok) {
        const presCount = students.filter((s) => s.status === 'PRESENT').length;
        const absCount = students.filter((s) => s.status === 'ABSENT').length;
        const lateCount = students.filter((s) => s.status === 'LATE').length;
        const isUpdate = json?.updated === true;

        showAlert(
          'success',
          isUpdate
            ? `✅ Attendance updated! ${presCount}P ${absCount}A ${lateCount}L — saved to PostgreSQL.`
            : `✅ Attendance committed! ${presCount} Present · ${absCount} Absent · ${lateCount} Late — saved to database.`
        );

        const sessionId = json?.data?.id || json?.sessionId || json?.data?.sessionId || selectedSlot.session_id;

        // Mark slot as completed in both selectedSlot and slots list
        const updatedSlot: TimetableSlot = {
          ...selectedSlot,
          is_attendance_marked: true,
          session_id: sessionId,
          present_count: presCount,
          absent_count: absCount,
          late_count: lateCount,
          total_students_marked: students.length,
        };
        setSelectedSlot(updatedSlot);

        setSlots((prev) =>
          prev.map((s) =>
            s.id === selectedSlot.id ? updatedSlot : s
          )
        );

        // Update all students so their baseline is updated to the newly committed status
        setStudents((prev) =>
          prev.map((s) => ({
            ...s,
            is_saved_in_db: true,
            original_status: s.status,
          }))
        );
      } else {
        // Surface the real backend error message with clear recovery prompt if 401
        const isAuthError = res.status === 401;
        const errMsg = isAuthError
          ? 'Your login session has expired. Please open a new tab to log in, then click "Commit Attendance" again to save without losing student marks.'
          : (json?.message
            || (Array.isArray(json?.message) ? json.message.join('; ') : null)
            || json?.error
            || `Server error ${res.status}`);
        showAlert('error', `❌ Failed to save attendance: ${errMsg}`);
        console.error('[AttendanceMark] commit error:', json);
      }
    } catch (err: any) {
      showAlert('error', `❌ Network error: ${err?.message || 'Could not reach server'}`);
      console.error('[AttendanceMark] commit exception:', err);
    } finally {
      setCommitting(false);
    }
  };

  // Filter slots based on active filter mode & deduplicate repeated lectures
  const filteredSlots = useMemo(() => {
    let list = [...slots];
    if (filterMode === 'DAY_WISE') {
      list = list.filter((s) => Number(s.day_of_week) === Number(selectedDayFilter));
    }
    // Deduplicate slots with identical day, start time, end time, and subject
    const seen = new Set<string>();
    return list.filter((s) => {
      const sTime = String(s.start_time || '').slice(0, 5);
      const eTime = String(s.end_time || '').slice(0, 5);
      const cleanSubj = String(s.subject_code || s.subject_name || s.topic || s.description || '')
        .replace(/\([^)]*\)/g, '')
        .toLowerCase()
        .trim();
      const key = `${s.day_of_week}_${sTime}_${eTime}_${cleanSubj}_${s.course_cd || ''}_${s.semester || ''}_${s.section || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [slots, filterMode, selectedDayFilter]);

  // Filter and order students in left panel
  const displayedStudents = useMemo(() => {
    let list = [...students];
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.stud_name.toLowerCase().includes(q) ||
          s.rollno.toLowerCase().includes(q) ||
          s.stud_reg_no.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (sortBy === 'ROLL') {
        const rA = parseInt(a.rollno, 10) || 0;
        const rB = parseInt(b.rollno, 10) || 0;
        return sortAsc ? rA - rB : rB - rA;
      } else {
        return sortAsc ? a.stud_name.localeCompare(b.stud_name) : b.stud_name.localeCompare(a.stud_name);
      }
    });
    return list;
  }, [students, studentSearch, sortBy, sortAsc]);

  // Metrics computation
  const metrics = useMemo(() => {
    const total = students.length;
    const present = students.filter((s) => s.status === 'PRESENT').length;
    const absent = students.filter((s) => s.status === 'ABSENT').length;
    const late = students.filter((s) => s.status === 'LATE').length;
    const savedInDb = students.filter((s) => s.is_saved_in_db).length;
    const modified = students.filter((s) => s.is_saved_in_db && s.status !== s.original_status).length;
    const presentPct = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';
    const absentPct = total > 0 ? ((absent / total) * 100).toFixed(1) : '0.0';
    const latePct = total > 0 ? ((late / total) * 100).toFixed(1) : '0.0';
    return { total, present, absent, late, savedInDb, modified, presentPct, absentPct, latePct };
  }, [students]);

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* ─── TOAST NOTIFICATION ────────────────────────────────────────── */}
          {alert && (
            <div
              className={`p-4 rounded-2xl flex items-center justify-between shadow-lg transition-all animate-fadeIn border ${
                alert.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : alert.type === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                  : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">
                  {alert.type === 'success' ? '✓' : alert.type === 'error' ? '✕' : 'ℹ'}
                </span>
                <p className="text-sm font-semibold">{alert.text}</p>
              </div>
              <button
                onClick={() => setAlert(null)}
                className="text-xs font-bold opacity-60 hover:opacity-100 px-2 py-1 rounded"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* ─── PAGE HEADER & BREADCRUMB ─────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-[#5B4BFF] uppercase">
                <span>Academic Operations</span>
                <span>•</span>
                <span>Live Lecture Scheduling</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-[#1B1E28] dark:text-white mt-1 flex items-center gap-3">
                <span>✍️ Attendance Mark</span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#5B4BFF]/10 text-[#5B4BFF] border border-[#5B4BFF]/20">
                  {userRole} Mode
                </span>
              </h1>
              <p className="text-xs md:text-sm text-[#4E5969] dark:text-slate-400 mt-1">
                Mark, edit, and synchronize live student attendance according to scheduled timetable sessions.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00C48C] animate-pulse"></span>
                <span>{tenantSlug.toUpperCase()}</span>
              </span>
            </div>
          </div>

          {/* ─── SECTION 1: ACADEMIC HIERARCHY SELECTOR & GET SCHEDULED ───── */}
          <div className="bg-white dark:bg-[#111827] rounded-[22px] p-5 md:p-6 shadow-soft border border-[#E7EAF3] dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#5B4BFF]/10 text-[#5B4BFF] flex items-center justify-center font-bold text-sm">
                  1
                </span>
                <h2 className="text-base font-bold text-[#1B1E28] dark:text-white">
                  Academic Scope &amp; Schedule Filter
                </h2>
              </div>

              {/* Filter View Selector */}
              <div className="flex items-center gap-1 bg-[#F6F8FC] dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setFilterMode('DATE_WISE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterMode === 'DATE_WISE'
                      ? 'bg-[#5B4BFF] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  📅 Date Wise
                </button>
                <button
                  onClick={() => setFilterMode('DAY_WISE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterMode === 'DAY_WISE'
                      ? 'bg-[#5B4BFF] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  🗓️ Day Wise
                </button>
                <button
                  onClick={() => setFilterMode('MONTH_WISE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterMode === 'MONTH_WISE'
                      ? 'bg-[#5B4BFF] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  📆 Month Wise
                </button>
              </div>
            </div>

            {/* Cascading Controls: Course → Branch → Batch → Semester → Section */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
              {/* STEP 1 ── Course */}
              <div>
                <label className="block text-[11px] font-bold text-[#4E5969] dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  1. Course
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => {
                    const newCrs = e.target.value;
                    setSelectedCourse(newCrs);
                    buildSemestersList(newCrs);
                    fetchBranches(selectedCollege, newCrs);
                  }}
                  className="w-full bg-[#F6F8FC] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                >
                  {coursesList.length === 0 && <option value="">Loading...</option>}
                  {coursesList.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* STEP 2 ── Branch */}
              <div>
                <label className="block text-[11px] font-bold text-[#4E5969] dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  2. Branch / Dept
                  {loadingBranches && <span className="inline-block w-3 h-3 border-2 border-[#5B4BFF] border-t-transparent rounded-full animate-spin" />}
                </label>
                <select
                  value={selectedBranch}
                  disabled={loadingBranches || branchesList.length === 0}
                  onChange={(e) => {
                    const br = e.target.value;
                    setSelectedBranch(br);
                    fetchBatches(selectedCollege, selectedCourse, br);
                  }}
                  className="w-full bg-[#F6F8FC] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] disabled:opacity-50"
                >
                  {loadingBranches && <option value="">Loading branches...</option>}
                  {!loadingBranches && branchesList.length === 0 && <option value="">— Select Course first —</option>}
                  {branchesList.map((b) => (
                    <option key={b.code} value={b.code}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* STEP 3 ── Batch */}
              <div>
                <label className="block text-[11px] font-bold text-[#4E5969] dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  3. Batch
                  {loadingBatches && <span className="inline-block w-3 h-3 border-2 border-[#5B4BFF] border-t-transparent rounded-full animate-spin" />}
                </label>
                <select
                  value={selectedBatch}
                  disabled={loadingBatches || batchesList.length === 0}
                  onChange={(e) => {
                    setSelectedBatch(e.target.value);
                    setSlots([]);
                    setSelectedSlot(null);
                    setStudents([]);
                  }}
                  className="w-full bg-[#F6F8FC] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] disabled:opacity-50"
                >
                  {loadingBatches && <option value="">Loading batches...</option>}
                  {!loadingBatches && batchesList.length === 0 && <option value="">— Select Branch first —</option>}
                  {batchesList.map((b) => (
                    <option key={b.code} value={b.code}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* STEP 4 ── Semester */}
              <div>
                <label className="block text-[11px] font-bold text-[#4E5969] dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  4. Semester
                </label>
                <select
                  value={selectedSem}
                  onChange={(e) => {
                    setSelectedSem(e.target.value);
                    setSlots([]);
                    setSelectedSlot(null);
                    setStudents([]);
                  }}
                  className="w-full bg-[#F6F8FC] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                >
                  {semestersList.map((s) => (
                    <option key={s.code} value={s.code}>{s.name}</option>
                  ))}
                  {semestersList.length === 0 && [1,2,3,4,5,6].map(s => (
                    <option key={s} value={String(s)}>Semester {s}</option>
                  ))}
                </select>
              </div>

              {/* STEP 5 ── Section */}
              <div>
                <label className="block text-[11px] font-bold text-[#4E5969] dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  5. Section
                </label>
                <select
                  value={selectedSection}
                  onChange={(e) => {
                    setSelectedSection(e.target.value);
                    setSlots([]);
                    setSelectedSlot(null);
                    setStudents([]);
                  }}
                  className="w-full bg-[#F6F8FC] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                >
                  {sectionsList.map((s) => (
                    <option key={s.code} value={s.code}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date / Day / Month Dynamic Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              {filterMode === 'DATE_WISE' && (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#4E5969] dark:text-slate-400">From Date:</span>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="bg-[#F6F8FC] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#1B1E28] dark:text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#4E5969] dark:text-slate-400">To Date:</span>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="bg-[#F6F8FC] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#1B1E28] dark:text-white"
                    />
                  </div>
                </div>
              )}

              {filterMode === 'DAY_WISE' && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  {DAYS_OF_WEEK.map((d) => (
                    <button
                      key={d.day}
                      onClick={() => setSelectedDayFilter(d.day)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        selectedDayFilter === d.day
                          ? 'bg-[#5B4BFF] text-white shadow-xs'
                          : 'bg-[#F6F8FC] dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              )}

              {filterMode === 'MONTH_WISE' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#4E5969] dark:text-slate-400">Select Month:</span>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-[#F6F8FC] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#1B1E28] dark:text-white"
                  />
                </div>
              )}

              {/* ⚡ GET SCHEDULED BUTTON */}
              <button
                type="button"
                onClick={() => handleGetScheduled()}
                disabled={loadingSchedule}
                className="bg-[#5B4BFF] hover:bg-[#4838DF] disabled:opacity-50 text-white font-black px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-xs md:text-sm uppercase tracking-wider ml-auto"
              >
                {loadingSchedule ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Loading Schedule...</span>
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    <span>Get Scheduled</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ─── SECTION 2: SCHEDULED LECTURES CARDS DISPLAY ──────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#F36C21]/10 text-[#F36C21] flex items-center justify-center font-bold text-sm">
                  2
                </span>
                <h2 className="text-base font-bold text-[#1B1E28] dark:text-white">
                  Scheduled Lectures &amp; Time Slots ({filteredSlots.length})
                </h2>
              </div>
              <p className="text-xs text-[#4E5969] dark:text-slate-400">
                Click any lecture card below to view &amp; mark student attendance
              </p>
            </div>

            {loadingSchedule ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200 dark:border-slate-800 p-4"></div>
                ))}
              </div>
            ) : filteredSlots.length === 0 ? (
              <div className="bg-white dark:bg-slate-900/60 rounded-[22px] p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-3xl">📅</span>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Scheduled Lectures Loaded</h3>
                <p className="text-xs text-[#4E5969] dark:text-slate-400 max-w-md mx-auto">
                  Select your Course, Branch, Batch, Semester &amp; Section above and click{' '}
                  <strong className="text-[#5B4BFF]">"⚡ Get Scheduled"</strong> to fetch scheduled lecture sessions.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {filteredSlots.map((slot) => {
                  const isSelected = selectedSlot?.id === slot.id;
                  const isMarked = slot.is_attendance_marked;
                  const dayObj = DAYS_OF_WEEK.find((d) => d.day === Number(slot.day_of_week));
                  const dayName = dayObj?.name || `Day ${slot.day_of_week}`;
                  const slotDateStr = getSlotDate(slot);
                  const formattedDate = formatDisplayDate(slotDateStr);
                  const facultyDisplay =
                    slot.faculty_name ||
                    (slot.description?.match(/\(([^)]+)\)/)?.[1]) ||
                    facultyName ||
                    'Faculty';
                  const courseTitle =
                    slot.course_cd === '13'
                      ? 'BCA'
                      : slot.course_cd === '1'
                      ? 'B.Tech CSE'
                      : slot.course_cd
                      ? `Course ${slot.course_cd}`
                      : 'Course';

                  return (
                    <div
                      key={slot.id}
                      onClick={() => handleSelectSlot(slot)}
                      className={`cursor-pointer rounded-[20px] p-4 transition-all duration-200 border text-left relative overflow-hidden group ${
                        isSelected
                          ? 'bg-white dark:bg-slate-900 border-[#5B4BFF] ring-2 ring-[#5B4BFF]/30 shadow-md scale-[1.01]'
                          : 'bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-800 hover:border-[#5B4BFF]/50 hover:shadow-sm'
                      }`}
                    >
                      {/* Top Accent Bar */}
                      <div
                        className={`absolute top-0 left-0 right-0 h-1.5 ${
                          isMarked ? 'bg-[#00C48C]' : 'bg-[#FFB020]'
                        }`}
                      ></div>

                      {/* 1. Date & Day Header */}
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#5B4BFF] dark:text-[#7867FF] mb-1.5 pt-1">
                        <span className="flex items-center gap-1 font-extrabold">
                          <span>📅</span>
                          <span>{formattedDate}</span>
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                          {dayName}
                        </span>
                      </div>

                      {/* 2. Slot Type & Attendance Status Badge */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {slot.slot_type || 'THEORY'}
                        </span>

                        {isMarked ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <span>✓</span>
                            <span>Attendance Completed</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                            <span>⏱</span>
                            <span>Pending Attendance</span>
                          </span>
                        )}
                      </div>

                      {/* 3. Subject Name & Academic Scope */}
                      <h4 className="text-xs md:text-sm font-black text-[#1B1E28] dark:text-white line-clamp-1 group-hover:text-[#5B4BFF] transition-colors">
                        {slot.subject_name || slot.topic || (slot.description ? slot.description.replace(/\([^)]*\)/g, '').trim() : 'Scheduled Lecture')}
                      </h4>
                      <p className="text-[11px] text-[#4E5969] dark:text-slate-400 font-mono mt-0.5">
                        {slot.subject_code && !isCourseName(slot.subject_code) ? `[${slot.subject_code}] ` : ''}
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {courseTitle} • Sem {slot.semester || '3'} • Sec {slot.section || '1'}
                        </span>
                      </p>

                      {/* 4. Time & Room Details */}
                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-[#4E5969] dark:text-slate-400">
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <span>⏰</span>
                          <span>{slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}</span>
                        </span>
                        <span>
                          📍 {slot.room ? (slot.room.toLowerCase().startsWith('room') ? slot.room : `Room ${slot.room}`) : 'Web Cam / Room'}
                        </span>
                      </div>

                      {/* 5. Faculty Name (Prominent & Unambiguous) */}
                      <div className="mt-2.5 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <span className="w-5 h-5 rounded-full bg-[#5B4BFF]/10 text-[#5B4BFF] flex items-center justify-center text-[10px]">
                          👨‍🏫
                        </span>
                        <span className="truncate">{facultyDisplay}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ─── SECTION 3: TWO-PANEL LAYOUT (STUDENT ROSTER & MARKED LIST) ─── */}
          {selectedSlot && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-[#00C48C]/10 text-[#00C48C] flex items-center justify-center font-bold text-sm">
                    3
                  </span>
                  <h2 className="text-base font-bold text-[#1B1E28] dark:text-white flex items-center gap-2">
                    <span>Attendance Session Workspace</span>
                    <span className="text-xs font-normal text-[#4E5969] dark:text-slate-400">
                      ({selectedSlot.subject_name || 'Subject'} on {selectedSlotDate})
                    </span>
                  </h2>
                </div>

                {/* Session Type Pill */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Session Type:</span>
                  <select
                    value={sessionType}
                    onChange={(e) => setSessionType(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-white"
                  >
                    <option value="THEORY">Theory Lecture</option>
                    <option value="PRACTICAL">Practical Lab</option>
                    <option value="TUTORIAL">Tutorial Session</option>
                    <option value="SDL">Self Directed Learning (SDL)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* ─── LEFT PANEL: SEARCHABLE STUDENT ROSTER WITH QUICK MARKS (5 Cols) ─── */}
                <div className="lg:col-span-5 bg-white dark:bg-[#111827] rounded-[22px] p-5 shadow-soft border border-[#E7EAF3] dark:border-slate-800 flex flex-col h-[650px]">
                  {/* Left Panel Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-[#1B1E28] dark:text-white">
                        Student Roster
                      </h3>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {students.length}
                      </span>
                      {metrics.savedInDb > 0 && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            metrics.modified > 0
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                          }`}
                          title={`${metrics.savedInDb} students saved in database (${metrics.modified} modified locally)`}
                        >
                          {metrics.savedInDb} saved in DB{metrics.modified > 0 ? ` (${metrics.modified} modified)` : ''}
                        </span>
                      )}
                    </div>

                    {/* Sort controls */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (sortBy === 'ROLL') setSortAsc(!sortAsc);
                          else { setSortBy('ROLL'); setSortAsc(true); }
                        }}
                        className={`text-[10px] font-bold px-2 py-1 rounded-md border ${
                          sortBy === 'ROLL'
                            ? 'bg-[#5B4BFF]/10 text-[#5B4BFF] border-[#5B4BFF]/30'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent'
                        }`}
                      >
                        Roll {sortBy === 'ROLL' ? (sortAsc ? '↑' : '↓') : ''}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (sortBy === 'NAME') setSortAsc(!sortAsc);
                          else { setSortBy('NAME'); setSortAsc(true); }
                        }}
                        className={`text-[10px] font-bold px-2 py-1 rounded-md border ${
                          sortBy === 'NAME'
                            ? 'bg-[#5B4BFF]/10 text-[#5B4BFF] border-[#5B4BFF]/30'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent'
                        }`}
                      >
                        Name {sortBy === 'NAME' ? (sortAsc ? 'A-Z' : 'Z-A') : ''}
                      </button>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="py-2.5">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search student by Name, Roll No or Reg No..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="w-full bg-[#F6F8FC] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-[#1B1E28] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                      />
                      <span className="absolute left-2.5 top-2.5 text-slate-400 text-xs">🔍</span>
                    </div>
                  </div>

                  {/* Quick Action Bulk Bar */}
                  <div className="flex items-center justify-between gap-1.5 py-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold">
                    <span className="text-[11px] text-[#4E5969] dark:text-slate-400">Quick Mark:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleMarkAll('PRESENT')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 text-[11px] transition-all"
                      >
                        All Present
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMarkAll('ABSENT')}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 text-[11px] transition-all"
                      >
                        All Absent
                      </button>
                    </div>
                  </div>

                  {/* Student Scrollable List */}
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 pr-1 space-y-1 mt-2">
                    {loadingStudents ? (
                      <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
                        Loading student roster...
                      </div>
                    ) : displayedStudents.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400">
                        No students matching "{studentSearch}"
                      </div>
                    ) : (
                      displayedStudents.map((s) => (
                        <div
                          key={s.id}
                          className="py-2.5 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                                {s.rollno || '#'}
                              </span>
                              <h5 className="text-xs font-bold text-[#1B1E28] dark:text-white truncate">
                                {s.stud_name}
                              </h5>
                              {s.is_saved_in_db && s.status !== s.original_status && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                                  ✎ Modified
                                </span>
                              )}
                              {s.is_saved_in_db && s.status === s.original_status && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                  ✓ Saved
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono pl-7 truncate">
                              {s.stud_reg_no || `ID: ${s.id.slice(0, 8)}`}
                            </p>
                          </div>

                          {/* Quick P / A / L Action Pills */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(s.id, 'PRESENT')}
                              className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${
                                s.status === 'PRESENT'
                                  ? 'bg-[#00C48C] text-white shadow-xs'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'
                              }`}
                              title="Mark Present"
                            >
                              P
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(s.id, 'ABSENT')}
                              className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${
                                s.status === 'ABSENT'
                                  ? 'bg-[#F04438] text-white shadow-xs'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-rose-50 hover:text-rose-600'
                              }`}
                              title="Mark Absent"
                            >
                              A
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(s.id, 'LATE')}
                              className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${
                                s.status === 'LATE'
                                  ? 'bg-[#FFB020] text-white shadow-xs'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-amber-50 hover:text-amber-600'
                              }`}
                              title="Mark Late"
                            >
                              L
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* ─── RIGHT PANEL: MARKED STUDENTS & COMMIT ATTENDANCE (7 Cols) ─── */}
                <div className="lg:col-span-7 bg-white dark:bg-[#111827] rounded-[22px] p-5 shadow-soft border border-[#E7EAF3] dark:border-slate-800 flex flex-col h-[650px] justify-between">
                  <div>
                    {/* Right Panel Header: Slot Summary & Live Attempted/Pending Banner */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-[#5B4BFF]">
                            {selectedSlot.subject_code && !isCourseName(selectedSlot.subject_code) ? selectedSlot.subject_code : (selectedSlot.subject_name || 'LECTURE')}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <h3 className="text-sm font-black text-[#1B1E28] dark:text-white">
                            {selectedSlot.subject_name || 'Subject Session'}
                          </h3>
                        </div>
                        <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-0.5">
                          📅 {selectedSlotDate} • ⏰ {selectedSlot.start_time?.slice(0, 5)} - {selectedSlot.end_time?.slice(0, 5)}
                          {selectedSlot.faculty_name ? ` • 👨‍🏫 ${selectedSlot.faculty_name}` : ''}
                        </p>
                      </div>

                      {/* Status Indicator Pill */}
                      {selectedSlot.is_attendance_marked ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-200 text-xs font-black">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Attempted (Editable)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-200 text-xs font-black">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span>Pending Attendance</span>
                        </div>
                      )}
                    </div>

                    {/* Summary Metrics Chips */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 my-3.5">
                      <div className="bg-[#F6F8FC] dark:bg-slate-900/60 rounded-xl p-2.5 text-center border border-slate-200/60 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Total</span>
                        <p className="text-base font-black text-[#1B1E28] dark:text-white">{metrics.total}</p>
                      </div>

                      <div className="bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl p-2.5 text-center border border-emerald-200/60 dark:border-emerald-900/40">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">Present</span>
                        <p className="text-base font-black text-emerald-700 dark:text-emerald-300">
                          {metrics.present}{' '}
                          <span className="text-[10px] font-normal">({metrics.presentPct}%)</span>
                        </p>
                      </div>

                      <div className="bg-rose-50/60 dark:bg-rose-950/30 rounded-xl p-2.5 text-center border border-rose-200/60 dark:border-rose-900/40">
                        <span className="text-[10px] font-bold text-rose-600 uppercase">Absent</span>
                        <p className="text-base font-black text-rose-700 dark:text-rose-300">
                          {metrics.absent}{' '}
                          <span className="text-[10px] font-normal">({metrics.absentPct}%)</span>
                        </p>
                      </div>

                      <div className="bg-amber-50/60 dark:bg-amber-950/30 rounded-xl p-2.5 text-center border border-amber-200/60 dark:border-amber-900/40">
                        <span className="text-[10px] font-bold text-amber-600 uppercase">Late</span>
                        <p className="text-base font-black text-amber-700 dark:text-amber-300">
                          {metrics.late}{' '}
                          <span className="text-[10px] font-normal">({metrics.latePct}%)</span>
                        </p>
                      </div>

                      <div className="bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl p-2.5 text-center border border-indigo-200/60 dark:border-indigo-900/40 col-span-2 sm:col-span-1">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase">Track in DB</span>
                        <p className="text-base font-black text-indigo-700 dark:text-indigo-300">
                          {metrics.savedInDb}
                          <span className="text-xs text-slate-500 font-normal">/{metrics.total}</span>
                        </p>
                        <span className={`text-[9px] font-bold block ${metrics.modified > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {metrics.savedInDb === 0
                            ? 'Unsaved'
                            : metrics.modified > 0
                            ? `✎ ${metrics.modified} modified`
                            : '✓ All in sync'}
                        </span>
                      </div>
                    </div>

                    {/* Topic Covered & Remarks Input */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#4E5969] dark:text-slate-400 uppercase mb-1">
                          Topic Covered
                        </label>
                        <input
                          type="text"
                          value={topicCovered}
                          onChange={(e) => setTopicCovered(e.target.value)}
                          placeholder="e.g. Unit 2: Data Structures & Binary Search"
                          className="w-full bg-[#F6F8FC] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#4E5969] dark:text-slate-400 uppercase mb-1">
                          Session Remarks (Optional)
                        </label>
                        <input
                          type="text"
                          value={sessionRemarks}
                          onChange={(e) => setSessionRemarks(e.target.value)}
                          placeholder="e.g. Class conducted smoothly"
                          className="w-full bg-[#F6F8FC] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                        />
                      </div>
                    </div>

                    {/* Marked Students Detailed Table */}
                    <div className="h-[280px] overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-[#F6F8FC] dark:bg-slate-900 sticky top-0 z-10 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <tr>
                            <th className="py-2.5 px-3">Roll</th>
                            <th className="py-2.5 px-3">Student Name</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Database Track</th>
                            <th className="py-2.5 px-3">Student Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                          {displayedStudents.map((s) => (
                            <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                              <td className="py-2 px-3 font-bold text-slate-600 dark:text-slate-400">
                                {s.rollno || '-'}
                              </td>
                              <td className="py-2 px-3 font-semibold text-[#1B1E28] dark:text-white">
                                {s.stud_name}
                              </td>
                              <td className="py-2 px-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = s.status === 'PRESENT' ? 'ABSENT' : s.status === 'ABSENT' ? 'LATE' : 'PRESENT';
                                    handleToggleStatus(s.id, next);
                                  }}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                                    s.status === 'PRESENT'
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                      : s.status === 'ABSENT'
                                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                  }`}
                                  title="Click to toggle status (Present -> Absent -> Late)"
                                >
                                  {s.status} ↻
                                </button>
                              </td>
                              <td className="py-2 px-3">
                                {s.is_saved_in_db ? (
                                  s.status !== s.original_status ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                      ✎ {s.original_status} → {s.status}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                      ✓ Saved in DB
                                    </span>
                                  )
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                    ○ Pending Save
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={s.remarks || ''}
                                  onChange={(e) => handleUpdateRemarks(s.id, e.target.value)}
                                  placeholder="Note..."
                                  className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#5B4BFF] focus:outline-none text-[11px] text-slate-600 dark:text-slate-300"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ─── COMMIT / SAVE BUTTON BAR ─── */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="text-xs text-[#4E5969] dark:text-slate-400">
                      <span>{selectedSlot.is_attendance_marked ? 'Ready to update: ' : 'Ready to commit: '}</span>
                      <strong className="text-emerald-600 font-bold">{metrics.present} Present</strong>,{' '}
                      <strong className="text-rose-600 font-bold">{metrics.absent} Absent</strong>
                      {metrics.late > 0 && <>, <strong className="text-amber-600 font-bold">{metrics.late} Late</strong></>}
                      {metrics.modified > 0 && (
                        <span className="ml-2 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 font-black text-[11px] border border-amber-300">
                          ✎ {metrics.modified} modified
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleCommitAttendance}
                      disabled={committing || students.length === 0}
                      className="bg-[#00C48C] hover:bg-[#00A876] disabled:opacity-50 text-white font-black px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-xs md:text-sm uppercase tracking-wider cursor-pointer"
                    >
                      {committing ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                          </svg>
                          <span>{selectedSlot.is_attendance_marked ? 'Updating Attendance...' : 'Saving Attendance...'}</span>
                        </>
                      ) : (
                        <>
                          <span>{selectedSlot.is_attendance_marked ? '🔄' : '💾'}</span>
                          <span>{selectedSlot.is_attendance_marked ? 'Update & Save Attendance' : 'Save & Commit Attendance'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
