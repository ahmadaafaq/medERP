'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import { filterCompetenciesForSlot, filterCompetencyCodesString } from '../../../utils/competencyFilter';

interface Department {
  id: string;
  code: string;
  name: string;
}

interface Batch {
  id: string;
  code: string;
  batch_cd?: string | number;
  name: string;
  year?: number;
  batch_year?: number | string;
  course_cd?: string;
  course_code?: string;
  course_name?: string;
  colg_cd?: string;
}

interface Subject {
  id: string;
  code: string;
  name: string;
  department_id?: string;
  course_cd?: string;
}

interface Faculty {
  id: string;
  emp_id: string;
  name: string;
  designation?: string;
  priority?: number;
  department_name?: string;
  colg_cd?: string;
  college_id?: string;
}

interface TopicMasterItem {
  id: string;
  subject_id?: string;
  code: string;
  name: string;
  subject_name?: string;
  subject_code?: string;
}

interface CompetencyMasterItem {
  id: string;
  subject_id?: string;
  topic_id?: string;
  code: string;
  description: string;
  subject_name?: string;
  subject_code?: string;
  topic_name?: string;
  topic_code?: string;
}

interface TimetableSlot {
  id: string;
  faculty_id?: string;
  faculty_name?: string;
  faculty_code?: string;
  subject_id?: string;
  subject_name?: string;
  subject_code?: string;
  department_id?: string;
  department_name?: string;
  batch_id?: string;
  batch_code?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room?: string;
  slotType?: string;
  slot_type?: string;
  group_name?: string;
  topic?: string;
  competency_codes?: string;
  competency_ids?: string[];
  competencies_detail?: any[];
}

interface DropdownItem {
  id: string;
  code: string;
  name: string;
  slug?: string;
  colg_cd?: string;
  course_cd?: string;
  branch_cd?: string;
  session_cd?: string;
  [key: string]: any;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const isUUID = (str?: string) => str ? /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str) : false;

// Standard Teaching Modes & Session Types
const TEACHING_MODES = [
  { value: 'Lecture', label: 'Lecture (L)', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
  { value: 'DOAP', label: 'DOAP (Demonstration/Observation/Assistance/Performance)', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { value: 'Practical', label: 'Practical (P)', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  { value: 'SGT', label: 'Small Group Teaching (SGT)', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  { value: 'Tutorial', label: 'Tutorial (T)', color: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
  { value: 'SDL', label: 'Self-Directed Learning (SDL)', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
  { value: 'Clinical Posting', label: 'Clinical Posting (CP)', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  { value: 'Seminar', label: 'Seminar / Journal Club (S)', color: 'bg-pink-500/20 text-pink-300 border-pink-500/40' },
  { value: 'Lunch Break', label: 'Lunch Break / Recess', color: 'bg-slate-800/90 text-slate-300 border-slate-700/80' },
];

const TIME_SLOTS = [
  { start: '08:30:00', end: '09:30:00', label: '08.30-09.30' },
  { start: '09:30:00', end: '10:30:00', label: '09.30-10.30' },
  { start: '10:30:00', end: '10:50:00', label: '10.30-10.50', isBreak: true, labelBreak: 'TEA BREAK' },
  { start: '10:50:00', end: '11:50:00', label: '10.50-11.50' },
  { start: '11:50:00', end: '12:50:00', label: '11.50-12.50' },
  { start: '12:50:00', end: '13:50:00', label: '12.50-01.50' },
  { start: '13:50:00', end: '14:50:00', label: '01.50-02.50', isBreak: true, labelBreak: 'LUNCH BREAK' },
  { start: '14:50:00', end: '15:50:00', label: '02.50-03.50' },
  { start: '15:50:00', end: '16:50:00', label: '03.50-04.50' },
];

const DAYS_OF_WEEK = [
  { value: 1, name: 'MONDAY' },
  { value: 2, name: 'TUESDAY' },
  { value: 3, name: 'WEDNESDAY' },
  { value: 4, name: 'THURSDAY' },
  { value: 5, name: 'FRIDAY' },
  { value: 6, name: 'SATURDAY' },
];

function extractArray<T = any>(json: any): T[] {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  if (Array.isArray(json.data?.data)) return json.data.data;
  if (Array.isArray(json.data)) return json.data;
  if (Array.isArray(json.items)) return json.items;
  if (Array.isArray(json.data?.items)) return json.data.items;
  return [];
}

export default function TimetableDesignPage() {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allFaculties, setAllFaculties] = useState<any[]>([]);
  const [allDbTopics, setAllDbTopics] = useState<TopicMasterItem[]>([]);
  const [allDbCompetencies, setAllDbCompetencies] = useState<CompetencyMasterItem[]>([]);

  // User Auth & Tenant Context State
  const [userRole, setUserRole] = useState<string>('ADMIN');
  const [userColgCd, setUserColgCd] = useState<string>('1');
  const [userTenantSlug, setUserTenantSlug] = useState<string>('srms-cet-bareilly');

  // Filter Lists loaded from /api/srms/
  const [collegesList, setCollegesList] = useState<DropdownItem[]>([]);
  const [coursesList, setCoursesList] = useState<DropdownItem[]>([]);
  const [branchesList, setBranchesList] = useState<DropdownItem[]>([]);
  const [batchesList, setBatchesList] = useState<Batch[]>([]);
  const [departmentsList, setDepartmentsList] = useState<DropdownItem[]>([]);
  const [sessionsList, setSessionsList] = useState<DropdownItem[]>([]);

  // Strict 6-Level Hierarchy Selected Codes (Numeric codes only per RestrictAPI.md!)
  const [selectedCollege, setSelectedCollege] = useState('1');
  const [selectedCourse, setSelectedCourse] = useState('13'); // BCA: 13
  const [selectedBranch, setSelectedBranch] = useState('1'); // BCA General: 1
  const [selectedBatch, setSelectedBatch] = useState('2'); // 2025: code 2
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSession, setSelectedSession] = useState('16'); // 2026-2027: code 16

  // Form Modal Popup State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [selectedCompetencies, setSelectedCompetencies] = useState<string[]>([]);
  const [competencySearchTerm, setCompetencySearchTerm] = useState('');
  const [hoveredSlotInfo, setHoveredSlotInfo] = useState<{ slot: TimetableSlot; x: number; y: number } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSlotMouseEnter = (slot: TimetableSlot, e: React.MouseEvent) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredSlotInfo({ slot, x: rect.left, y: rect.top });
  };

  const handleSlotMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredSlotInfo(null);
    }, 250);
  };

  const handlePopoverMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handlePopoverMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredSlotInfo(null);
    }, 200);
  };

  const [formData, setFormData] = useState({
    dayOfWeek: 1,
    startTime: '08:30:00',
    endTime: '09:30:00',
    departmentId: '',
    subjectId: '',
    facultyId: '',
    room: '',
    slotType: 'Lecture',
    groupName: 'Whole Batch (All Students)',
    topic: '',
  });

  // Loading & Alerts
  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const findMatchingCollege = (colVal: string) => {
    if (!colVal || !collegesList || collegesList.length === 0) return null;
    const match = collegesList.find(c => {
      if (!c) return false;
      return (
        String(c.code) === String(colVal) ||
        String(c.colg_cd) === String(colVal) ||
        String(c.id) === String(colVal) ||
        c.slug === colVal ||
        c.name === colVal
      );
    });
    return match || collegesList[0] || null;
  };

  const getActiveTenantSlug = (): string => {
    if (typeof window !== 'undefined') {
      const savedSlug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant');
      if (savedSlug && savedSlug !== 'all') {
        const matchingCol = collegesList.find(c => c.slug === savedSlug || c.id === savedSlug || c.code === savedSlug);
        if (matchingCol?.slug) return matchingCol.slug;
        return savedSlug;
      }
    }
    const col = findMatchingCollege(selectedCollege);
    return col?.slug || userTenantSlug || 'srms-cet-bareilly';
  };

  // Helper Memoized Selected Objects
  const selectedCollegeObj = useMemo(() => {
    return findMatchingCollege(selectedCollege);
  }, [collegesList, selectedCollege]);

  const selectedCourseObj = useMemo(() => {
    if (!coursesList || coursesList.length === 0) return null;
    return coursesList.find(c => String(c.code) === String(selectedCourse) || String(c.course_cd) === String(selectedCourse) || c.name === selectedCourse) || coursesList[0];
  }, [coursesList, selectedCourse]);

  const selectedBranchObj = useMemo(() => {
    if (!branchesList || branchesList.length === 0) return null;
    return branchesList.find(b => String(b.code) === String(selectedBranch) || String(b.branch_cd) === String(selectedBranch) || String(b.id) === String(selectedBranch) || b.name === selectedBranch) || branchesList[0];
  }, [branchesList, selectedBranch]);

  const selectedBatchObj = useMemo(() => {
    if (!batchesList || batchesList.length === 0) return null;
    return batchesList.find(b => String(b.code) === String(selectedBatch) || String(b.batch_cd) === String(selectedBatch) || String(b.year) === String(selectedBatch) || String(b.id) === String(selectedBatch)) || batchesList[0];
  }, [batchesList, selectedBatch]);

  const availableDepartments = useMemo(() => {
    if (!departmentsList || departmentsList.length === 0) return [];
    const crsCd = selectedCourseObj?.code || selectedCourse || '13';
    const filtered = departmentsList.filter((d: any) => {
      if (!d) return false;
      if (!d.course_cd) return true;
      return String(d.course_cd) === String(crsCd) || d.course_name === selectedCourseObj?.name;
    });
    return filtered.length > 0 ? filtered : departmentsList;
  }, [departmentsList, selectedCourseObj, selectedCourse]);

  const selectedDeptObj = useMemo(() => {
    if (!availableDepartments || availableDepartments.length === 0) return null;
    return availableDepartments.find(d => String(d.id) === String(selectedDept) || String(d.code) === String(selectedDept) || d.name === selectedDept) || availableDepartments[0];
  }, [availableDepartments, selectedDept]);

  const selectedSessionObj = useMemo(() => {
    if (!sessionsList || sessionsList.length === 0) return null;
    return sessionsList.find(s => String(s.code) === String(selectedSession) || String(s.session_cd) === String(selectedSession) || String(s.id) === String(selectedSession) || s.name === selectedSession) || sessionsList[0];
  }, [sessionsList, selectedSession]);

  // Dynamically Filter Form Subjects based on Active College and Course
  const availableFormSubjects = useMemo(() => {
    const safeSubs = Array.isArray(subjects) ? subjects : [];
    if (safeSubs.length === 0) return [];
    const crsCd = selectedCourseObj?.code || selectedCourse || '13';
    return safeSubs.filter((s: any) => {
      if (!s) return false;
      const matchCourse = String(s.course_cd) === String(crsCd) || String(s.course_code) === String(crsCd) || s.course_name === selectedCourseObj?.name;
      return matchCourse;
    });
  }, [subjects, selectedCourseObj, selectedCourse]);

  // Subject & Faculty Registry List for Timetable Footer
  const registryList = useMemo(() => {
    const list: { subject_code: string; subject_name: string; faculty_name: string }[] = [];
    const seenKeys = new Set<string>();

    const safeSlots = Array.isArray(slots) ? slots : [];
    const safeSubs = Array.isArray(subjects) ? subjects : [];
    const safeFacs = Array.isArray(allFaculties) ? allFaculties : [];

    for (const s of safeSlots) {
      if (!s) continue;
      const matchedSub = safeSubs.find(sub => sub && (String(sub.id) === String(s.subject_id) || String(sub.code) === String(s.subject_id) || String(sub.code) === String(s.subject_code)));
      const subCode = (s.subject_code && s.subject_code !== 'MBBS') ? s.subject_code : (matchedSub?.code || '');
      const subName = (s.subject_name && s.subject_name !== 'Medical Subject') ? s.subject_name : (matchedSub?.name || s.topic || '');

      const matchedFac = safeFacs.find(fac => fac && (String(fac.id) === String(s.faculty_id) || String(fac.emp_id) === String(s.faculty_id)));
      const facName = (s.faculty_name && s.faculty_name !== 'Faculty Member') ? s.faculty_name : (matchedFac?.name || '');

      const key = (subCode || subName).toLowerCase();
      if (key && !seenKeys.has(key)) {
        seenKeys.add(key);
        list.push({
          subject_code: subCode || '-',
          subject_name: subName || 'Scheduled Session',
          faculty_name: facName || 'Unassigned',
        });
      }
    }

    return list;
  }, [slots, subjects, allFaculties]);

  // ─── API FETCHING HELPERS ──────────────────────────────────────────────────
  const fetchColleges = async () => {
    try {
      const res = await fetch(`/api/srms/colleges`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const mapped = list.map((c: any) => ({
            id: String(c.colg_cd || c.code || c.id || '1'),
            code: String(c.colg_cd || c.code || c.id || '1'),
            colg_cd: String(c.colg_cd || c.code || c.id || '1'),
            name: c.colg_name || c.name || `College ${c.colg_cd}`,
            slug: c.slug || (c.colg_cd === '1' ? 'srms-cet-bareilly' : c.slug),
          }));
          return mapped;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch colleges:', err);
    }
    return [];
  };

  const fetchSessionsForCollege = async (colgcd: string) => {
    const cd = colgcd || '1';
    try {
      const res = await fetch(`/api/srms/sessions?colgcd=${cd}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const mapped = list.map((s: any) => ({
            id: String(s.session_cd || s.code || s.name),
            code: String(s.session_cd || s.code || s.name),
            session_cd: String(s.session_cd || s.code || s.name),
            name: s.session_name || s.name || s.code,
            is_current: s.current_flg === '1' || s.is_current,
            active_flg: s.active_flg || (s.is_active ? '1' : '0'),
          }));
          setSessionsList(mapped);
          return mapped;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch sessions:', err);
    }
    return [];
  };

  const fetchCoursesForCollege = async (colgcd: string) => {
    const cd = colgcd || '1';
    try {
      const res = await fetch(`/api/srms/courses?colgcd=${cd}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const mapped = list.map((c: any) => ({
            id: String(c.course_cd || c.code || '1'),
            code: String(c.course_cd || c.code || '1'),
            course_cd: String(c.course_cd || c.code || '1'),
            name: c.course_name || c.name || `Course ${c.course_cd}`,
            colg_cd: String(c.colg_cd || cd),
            active_flg: c.active_flg || (c.ACTIVESTS === 'ACTIVE' ? '1' : '0'),
          }));
          setCoursesList(mapped);
          return mapped;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch courses:', err);
    }
    return [];
  };

  const fetchBranchesForCourse = async (colgcd: string, coursecd: string) => {
    const cd = colgcd || '1';
    const crs = coursecd || '13';
    try {
      const res = await fetch(`/api/srms/branches?colgcd=${cd}&coursecd=${crs}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const mapped = list.map((b: any) => {
            const rawName = b.branch_name || b.name;
            const validName = (rawName && rawName !== '-' && rawName !== 'null') ? rawName : `${b.course_name || 'Course'} General`;
            return {
              id: String(b.branch_cd || b.code || '1'),
              code: String(b.branch_cd || b.code || '1'),
              branch_cd: String(b.branch_cd || b.code || '1'),
              name: validName,
              course_cd: String(b.course_cd || crs),
              course_name: b.course_name,
              colg_cd: String(b.colg_cd || cd),
            };
          });
          setBranchesList(mapped);
          return mapped;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch branches:', err);
    }
    return [];
  };

  const fetchBatchesForCourse = async (colgcd: string, coursecd: string) => {
    const cd = colgcd || '1';
    const crs = coursecd || '13';
    try {
      const res = await fetch(`/api/srms/batches?colgcd=${cd}&coursecd=${crs}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const mapped = list.map((b: any) => ({
            id: String(b.batch_cd || b.code || b.batch_name || '1'),
            code: String(b.batch_cd || b.code || b.batch_name || '1'),
            batch_cd: String(b.batch_cd || b.code || b.batch_name || '1'),
            name: String(b.batch_name || b.name || b.year || b.batch_cd),
            year: Number(b.batch_name || b.year || b.code || 2025),
            course_cd: String(b.course_cd || crs),
            course_name: b.course_name,
            colg_cd: String(b.colg_cd || cd),
          }));
          setBatchesList(mapped);
          return mapped;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch batches:', err);
    }
    return [];
  };

  const fetchMasterData = async () => {
    setMetadataLoading(true);
    try {
      let role = 'ADMIN';
      let userColg = '1';
      let userSlug = 'srms-cet-bareilly';
      if (typeof window !== 'undefined') {
        role = (localStorage.getItem('role') || 'ADMIN').toUpperCase();
        userColg = localStorage.getItem('colg_cd') || localStorage.getItem('colgCd') || '1';
        userSlug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly';
        setUserRole(role);
        setUserColgCd(userColg);
        setUserTenantSlug(userSlug);
      }

      // 1. Fetch Colleges
      const allColleges = await fetchColleges();

      // Strict Tenant Isolation: Non-SuperAdmins are hard-locked to their assigned college!
      let filteredColleges = allColleges;
      if (role !== 'SUPER_ADMIN') {
        const myCol = allColleges.find(c => String(c.colg_cd) === String(userColg) || String(c.code) === String(userColg) || c.slug === userSlug);
        if (myCol) {
          filteredColleges = [myCol];
        } else {
          filteredColleges = [{
            id: userColg,
            code: userColg,
            colg_cd: userColg,
            name: 'SHRI RAM MURTI SMARAK COLLEGE OF ENGINEERING & TECHNOLOGY, BAREILLY',
            slug: userSlug
          }];
        }
      }
      setCollegesList(filteredColleges);

      const activeColCode = role === 'SUPER_ADMIN' ? (filteredColleges[0]?.code || '1') : userColg;
      setSelectedCollege(activeColCode);

      // 2. Fetch Sessions for the active college
      const sessions = await fetchSessionsForCollege(activeColCode);
      const curSess = sessions.find(s => s.code === '16') || sessions.find(s => s.is_current) || sessions[0];
      if (curSess) setSelectedSession(curSess.code);

      // 3. Fetch Courses for active college
      const courses = await fetchCoursesForCollege(activeColCode);
      const bca = courses.find(c => c.code === '13' || c.name === 'BCA') || courses[0];
      const initialCourseCd = bca ? bca.code : '13';
      setSelectedCourse(initialCourseCd);

      // 4. Fetch Branches for active college + course
      const branches = await fetchBranchesForCourse(activeColCode, initialCourseCd);
      if (branches.length > 0) {
        setSelectedBranch(branches[0].code);
      }

      // 5. Fetch Batches for active college + course
      const batches = await fetchBatchesForCourse(activeColCode, initialCourseCd);
      const curBatch = batches.find(b => b.name === '2025' || b.year === 2025 || b.code === '2') || batches[0];
      if (curBatch) {
        setSelectedBatch(curBatch.code);
      }

      // 6. Fetch Departments, Subjects, Faculty for Timetable modal strictly scoped by tenant
      const activeTenantSlug = role === 'SUPER_ADMIN' ? (filteredColleges[0]?.slug || 'srms-cet-bareilly') : userSlug;
      const token = localStorage.getItem('token') || '';
      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

      const [deptRes, subRes, topicRes, compRes, facRes] = await Promise.all([
        fetch(`${API_BASE}/admin-master/departments?tenant=${activeTenantSlug}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/admin-master/subjects?tenant=${activeTenantSlug}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/admin-master/topics?tenant=${activeTenantSlug}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/admin-master/competencies?tenant=${activeTenantSlug}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/users/faculty?tenant=${activeTenantSlug}&limit=500`, { headers }).catch(() => null),
      ]);

      if (deptRes && deptRes.ok) {
        const dJson = await deptRes.json();
        const dList = extractArray(dJson);
        if (dList.length > 0) {
          setDepartmentsList(dList);
          const bcaDept = dList.find((d: any) => String(d.course_cd) === String(initialCourseCd) || d.name?.includes('BCA')) || dList[0];
          if (bcaDept) setSelectedDept(bcaDept.id || bcaDept.code);
        }
      }
      if (subRes && subRes.ok) {
        const sJson = await subRes.json();
        setSubjects(extractArray(sJson));
      }
      if (topicRes && topicRes.ok) {
        const tJson = await topicRes.json();
        setAllDbTopics(extractArray(tJson));
      }
      if (compRes && compRes.ok) {
        const cJson = await compRes.json();
        setAllDbCompetencies(extractArray(cJson));
      }
      if (facRes && facRes.ok) {
        const fJson = await facRes.json();
        setAllFaculties(extractArray(fJson));
      }
    } catch (err) {
      console.error('Failed to load master metadata:', err);
    } finally {
      setMetadataLoading(false);
    }
  };

  const fetchTimetableSlots = async () => {
    setLoading(true);
    try {
      const tenantSlug = getActiveTenantSlug() || 'srms-cet-bareilly';
      const qs = new URLSearchParams({ tenant: tenantSlug });
      if (selectedBatch && selectedBatch !== 'all') {
        const batchObj = batchesList.find(b => b.code === selectedBatch);
        qs.append('batchId', batchObj?.year ? String(batchObj.year) : selectedBatch);
      }
      if (selectedBranch && selectedBranch !== 'all' && selectedBranch !== 'General Track') {
        qs.append('departmentId', selectedBranch);
      }
      if (selectedCourse && selectedCourse !== 'all') {
        qs.append('courseId', selectedCourse);
      }
      if (selectedSession && selectedSession !== 'all') {
        qs.append('sessionId', selectedSession);
      }

      const res = await fetch(`${API_BASE}/timetable?${qs.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (res.ok) {
        const json = await res.json();
        setSlots(extractArray(json));
      }
    } catch (err) {
      console.error('Failed to fetch timetable slots', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchMasterData();
  }, []);

  // Cascading Handlers
  const handleFilterCollegeChange = async (colgCd: string) => {
    if (userRole !== 'SUPER_ADMIN') return;
    setSelectedCollege(colgCd);
    await fetchSessionsForCollege(colgCd);
    const courses = await fetchCoursesForCollege(colgCd);
    const firstCourse = courses.find(c => c.code === '13') || courses[0];
    const newCourseCd = firstCourse ? firstCourse.code : '1';
    setSelectedCourse(newCourseCd);

    const branches = await fetchBranchesForCourse(colgCd, newCourseCd);
    if (branches.length > 0) {
      setSelectedBranch(branches[0].code);
    }

    const batches = await fetchBatchesForCourse(colgCd, newCourseCd);
    const curBatch = batches.find(b => b.name === '2025' || b.year === 2025 || b.code === '2') || batches[0];
    if (curBatch) {
      setSelectedBatch(curBatch.code);
    }
  };

  const handleFilterCourseChange = async (courseCd: string) => {
    setSelectedCourse(courseCd);

    const branches = await fetchBranchesForCourse(selectedCollege, courseCd);
    if (branches.length > 0) {
      setSelectedBranch(branches[0].code);
    }

    const batches = await fetchBatchesForCourse(selectedCollege, courseCd);
    const curBatch = batches.find(b => b.name === '2025' || b.year === 2025 || b.code === '2') || batches[0];
    if (curBatch) {
      setSelectedBatch(curBatch.code);
    }

    const matchingDept = departmentsList.find((d: any) => String(d.course_cd) === String(courseCd) || d.course_code === courseCd);
    if (matchingDept) {
      setSelectedDept(matchingDept.id || matchingDept.code);
    }
  };

  const handleFilterBranchChange = (branchCd: string) => {
    setSelectedBranch(branchCd);
  };

  const handleFilterBatchChange = (batchCd: string) => {
    setSelectedBatch(batchCd);
  };

  const handleFilterDeptChange = (deptId: string) => {
    setSelectedDept(deptId);
  };

  const handleFilterSessionChange = (sessionCd: string) => {
    setSelectedSession(sessionCd);
  };

  // Re-fetch slots whenever filters change
  useEffect(() => {
    fetchTimetableSlots();
  }, [selectedCollege, selectedCourse, selectedBranch, selectedBatch, selectedSession]);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subjectId || !formData.facultyId) {
      setModalError('Subject and Faculty are required.');
      return;
    }

    setLoading(true);
    const tenantSlug = getActiveTenantSlug();
    const isEdit = !!editingSlot;
    const url = isEdit ? `${API_BASE}/timetable/${editingSlot.id}?tenant=${tenantSlug}` : `${API_BASE}/timetable?tenant=${tenantSlug}`;
    const method = isEdit ? 'PUT' : 'POST';

    const payload = {
      dayOfWeek: formData.dayOfWeek,
      startTime: formData.startTime,
      endTime: formData.endTime,
      departmentId: formData.departmentId || undefined,
      subjectId: formData.subjectId || undefined,
      facultyId: formData.facultyId || undefined,
      batchId: selectedBatch || undefined,
      room: formData.room || undefined,
      slotType: formData.slotType,
      groupName: formData.groupName || undefined,
      topic: formData.topic || undefined,
      competencyCodes: selectedCompetencies.join(',') || undefined,
    };

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showAlert('success', `Timetable session ${isEdit ? 'updated' : 'scheduled'} successfully in PostgreSQL!`);
        setIsModalOpen(false);
        fetchTimetableSlots();
      } else {
        const json = await res.json();
        const errorMsg = Array.isArray(json.message) ? json.message.join(', ') : json.message;
        showAlert('error', errorMsg || 'Schedule overlap or validation conflict detected.');
        setModalError(errorMsg || 'Schedule overlap or validation conflict detected.');
      }
    } catch (err) {
      showAlert('error', 'Network error while saving timetable slot.');
      setModalError('Network error while saving timetable slot.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingSlot) return;
    if (!confirm('Are you sure you want to delete this scheduled session?')) return;
    setLoading(true);
    try {
      const tenantSlug = getActiveTenantSlug();
      const res = await fetch(`${API_BASE}/timetable/${editingSlot.id}?tenant=${tenantSlug}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (res.ok) {
        showAlert('success', 'Timetable session deleted successfully!');
        setIsModalOpen(false);
        fetchTimetableSlots();
      } else {
        const json = await res.json();
        showAlert('error', json.message || 'Failed to delete slot.');
      }
    } catch (err) {
      showAlert('error', 'Network error while deleting slot.');
    } finally {
      setLoading(false);
    }
  };

  const handleGridCellClick = (dayVal: number, timeStart: string, defaultEnd: string) => {
    setEditingSlot(null);
    setSelectedCompetencies([]);
    setCompetencySearchTerm('');

    setFormData({
      dayOfWeek: dayVal,
      startTime: timeStart,
      endTime: defaultEnd,
      departmentId: selectedDept || (branchesList[0]?.id || branchesList[0]?.code || ''),
      subjectId: '',
      facultyId: '',
      room: '',
      slotType: 'Lecture',
      groupName: 'Whole Batch (All Students)',
      topic: '',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSlotClick = (slot: TimetableSlot, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSlot(slot);

    const existingCompCodes = slot.competency_codes
      ? slot.competency_codes.split(',').map(c => c.trim()).filter(Boolean)
      : [];
    setSelectedCompetencies(existingCompCodes);
    setCompetencySearchTerm('');

    setFormData({
      dayOfWeek: slot.day_of_week,
      startTime: slot.start_time,
      endTime: slot.end_time,
      departmentId: slot.department_id || selectedDept || '',
      subjectId: slot.subject_id || '',
      facultyId: slot.faculty_id || '',
      room: slot.room || '',
      slotType: slot.slot_type || slot.slotType || 'Lecture',
      groupName: slot.group_name || 'Whole Batch (All Students)',
      topic: slot.topic || '',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      <style dangerouslySetInnerHTML={{
        __html: `
        select, option {
          cursor: pointer !important;
        }
        @media print {
          @page {
            size: landscape;
            margin: 0.5cm;
          }
          body * {
            visibility: hidden;
          }
          #timetable-print-area, #timetable-print-area * {
            visibility: visible;
          }
          #timetable-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      ` }} />

      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="College Timetable Designer" />
        <main className="p-6 space-y-6 flex-1 flex flex-col bg-slate-50 dark:bg-[#0F172A]">

          {alert && (
            <div className={`p-4 rounded-2xl border text-xs font-extrabold transition-all shadow-lg animate-fade-in flex items-center gap-2 ${alert.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
              }`}>
              <span>{alert.type === 'success' ? '✅' : '⚠️'}</span>
              <span>{alert.message}</span>
            </div>
          )}

          {/* Master Cascading Filters Bar — Follows Exact 1-6 Hierarchy */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3 shadow-md hover:shadow-lg transition-all">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-2">
              <div>
                <h3 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-2">
                  <span>🗓️</span> Cascading Academic Filters
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  Hierarchy: 1. College ➔ 2. Course ➔ 3. Branch ➔ 4. Batch ➔ 5. Department ➔ 6. Session
                </p>
              </div>

              {/* Print Button */}
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-black rounded-xl bg-orange-600 text-white hover:bg-orange-500 shadow-md shadow-orange-600/30 border border-orange-500 transition-all uppercase flex items-center gap-1.5"
              >
                <span>🖨️</span>
                <span>Print</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">

              {/* 1. College Selector — Locked for Non-SuperAdmins */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-sm hover:border-[#5B4BFF]/40 transition-all">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                  <span>🏛️</span> College:
                </span>
                <select
                  value={selectedCollege}
                  disabled={userRole !== 'SUPER_ADMIN'}
                  onChange={(e) => handleFilterCollegeChange(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer disabled:cursor-not-allowed text-xs max-w-[240px] truncate"
                >
                  {collegesList.map((colg, idx) => (
                    <option key={colg.code || idx} value={colg.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      [#{colg.code}] {colg.name}
                    </option>
                  ))}
                </select>
                {userRole !== 'SUPER_ADMIN' && (
                  <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-black px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 shrink-0">
                    🔒 Locked
                  </span>
                )}
              </div>

              {/* 2. Course Selector */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-sm hover:border-[#5B4BFF]/40 transition-all">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                  <span>🎓</span> Course <span className="font-extrabold text-[#5B4BFF] dark:text-indigo-400">({coursesList.length})</span>:
                </span>
                <select
                  value={selectedCourse}
                  onChange={(e) => handleFilterCourseChange(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer text-xs max-w-[180px] truncate"
                >
                  {coursesList.map((crs, idx) => (
                    <option key={crs.code || idx} value={crs.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      [#{crs.code}] {crs.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Branch Selector */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-sm hover:border-[#5B4BFF]/40 transition-all">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                  <span>🏢</span> Branch <span className="font-extrabold text-[#5B4BFF] dark:text-indigo-400">({branchesList.length})</span>:
                </span>
                <select
                  value={selectedBranch}
                  onChange={(e) => handleFilterBranchChange(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer text-xs max-w-[180px] truncate"
                >
                  {branchesList.map((br: any, idx: number) => {
                    return (
                      <option key={br.code || idx} value={br.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        [#{br.code}] {br.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* 4. Batch Selector (Strictly Scoped to Selected Course) */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800/80 border border-indigo-400/60 dark:border-indigo-700 rounded-xl px-3 py-2 text-xs shadow-sm hover:border-[#5B4BFF] transition-all">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                  <span>👥</span> Batch <span className="font-extrabold text-[#5B4BFF] dark:text-indigo-400">({batchesList.length})</span> *:
                </span>
                <select
                  value={selectedBatch}
                  onChange={(e) => handleFilterBatchChange(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-white font-black focus:outline-none cursor-pointer text-xs max-w-[180px] truncate"
                >
                  {batchesList.map((batch, idx) => (
                    <option key={batch.code || idx} value={batch.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      [#{batch.code}] Batch {batch.name || batch.year} {batch.year && batch.name !== String(batch.year) ? `(${batch.year})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. Session Selector */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-sm hover:border-[#5B4BFF]/40 transition-all">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                  <span>🗓️</span> Session:
                </span>
                <select
                  id="ddl_session"
                  value={selectedSession}
                  onChange={(e) => handleFilterSessionChange(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer text-xs max-w-[160px] truncate"
                >
                  <option value="0" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">--Select  Session---</option>
                  {sessionsList.map((sess, idx) => (
                    <option key={sess.code || idx} value={sess.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      [#{sess.code}] {sess.name}
                    </option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          {/* Timetable Section */}
          {loading ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#5B4BFF] mx-auto"></div>
              <p className="text-slate-500 dark:text-slate-400 mt-3 text-sm font-medium">Fetching timetable slots from database...</p>
            </div>
          ) : (
            <div id="timetable-print-area" className="bg-white dark:bg-slate-900 p-8 border-2 border-slate-800 dark:border-slate-700 rounded-3xl shadow-sm w-full mx-auto print:border-0 print:shadow-none print:p-0 text-slate-800 dark:text-slate-100">

              {/* College Header */}
              <div className="text-center space-y-2 border-b-2 border-slate-800 dark:border-slate-700 pb-4 mb-6">
                <h2 className="text-xl font-extrabold uppercase tracking-wide text-slate-900 dark:text-white">
                  {selectedCollegeObj?.name || 'SHRI RAM MURTI SMARAK COLLEGE OF ENGINEERING & TECHNOLOGY, BAREILLY'}
                </h2>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 uppercase">
                  {selectedDeptObj?.name || selectedBranchObj?.name || 'FACULTY OF COMPUTER APPLICATIONS'}
                </h3>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase">
                  TIME TABLE - {selectedCourseObj?.name || selectedCourse} {selectedBatchObj ? `(BATCH ${selectedBatchObj.name || selectedBatchObj.year || selectedBatchObj.code})` : ''} {selectedSessionObj ? `(SESSION ${selectedSessionObj.name || selectedSessionObj.code})` : ''}
                </p>
              </div>

              {/* Timetable Grid Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border-2 border-slate-800 dark:border-slate-700 text-center text-xs text-slate-800 dark:text-slate-200">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800">
                      <th className="border-2 border-slate-800 dark:border-slate-700 p-2 font-bold w-28 text-slate-900 dark:text-white">DAY / TIME</th>
                      {TIME_SLOTS.map((ts, i) => (
                        <th key={i} className={`border-2 border-slate-800 dark:border-slate-700 p-2 font-bold text-slate-900 dark:text-white ${ts.isBreak ? 'w-10 bg-slate-200 dark:bg-slate-800' : 'min-w-[110px]'}`}>
                          <div>{ts.label}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS_OF_WEEK.map((day, dayIdx) => {
                      return (
                        <tr key={day.value}>
                          <td className="border-2 border-slate-800 dark:border-slate-700 p-2 font-bold bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white uppercase tracking-wider">
                            {day.name}
                          </td>
                          {TIME_SLOTS.map((ts, slotIdx) => {
                            if (ts.isBreak) {
                              if (dayIdx !== 0) return null;
                              return (
                                <td
                                  key={slotIdx}
                                  rowSpan={DAYS_OF_WEEK.length}
                                  className="border-2 border-slate-800 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/90 font-extrabold text-xs tracking-widest text-slate-800 dark:text-slate-200 p-2 text-center select-none align-middle"
                                >
                                  <div className="[writing-mode:vertical-lr] rotate-180 mx-auto font-mono py-4 uppercase font-black tracking-[0.25em] text-xs">
                                    {ts.labelBreak}
                                  </div>
                                </td>
                              );
                            }

                            const safeSlots = Array.isArray(slots) ? slots : [];
                            const cellSlots = safeSlots.filter(s => {
                              if (!s || s.day_of_week !== day.value) return false;
                              const sStart = String(s.start_time || '');
                              const sEnd = String(s.end_time || '');
                              const slotStart = sStart.slice(0, 5);
                              const colStart = ts.start.slice(0, 5);
                              const colEnd = ts.end.slice(0, 5);
                              return (slotStart >= colStart && slotStart < colEnd) || (sStart < ts.end && sEnd > ts.start);
                            });

                            return (
                              <td
                                key={ts.start}
                                onClick={() => handleGridCellClick(day.value, ts.start, ts.end)}
                                className="border-2 border-slate-800 dark:border-slate-700 p-1.5 bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 group relative transition-colors h-24 align-top min-w-[110px]"
                              >
                                {cellSlots.length > 0 ? (
                                  <div className="space-y-1 h-full flex flex-col justify-between">
                                    {cellSlots.map(slot => {
                                      const safeSubs = Array.isArray(subjects) ? subjects : [];
                                      const safeFacs = Array.isArray(allFaculties) ? allFaculties : [];
                                      const matchedSub = safeSubs.find(s => s && (String(s.id) === String(slot.subject_id) || String(s.code) === String(slot.subject_id) || String(s.code) === String(slot.subject_code)));
                                      const subName = (slot.subject_name && slot.subject_name !== 'Medical Subject') ? slot.subject_name : (matchedSub?.name || slot.topic || 'Subject Session');

                                      const matchedFac = safeFacs.find(f => f && (String(f.id) === String(slot.faculty_id) || String(f.emp_id) === String(slot.faculty_id)));
                                      const facName = (slot.faculty_name && slot.faculty_name !== 'Faculty Member') ? slot.faculty_name : (matchedFac?.name || '');

                                      return (
                                        <div
                                          key={slot.id}
                                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-left space-y-1 shadow-sm text-slate-900 dark:text-white"
                                          onClick={(e) => { e.stopPropagation(); handleSlotClick(slot, e); }}
                                          onMouseEnter={(e) => handleSlotMouseEnter(slot, e)}
                                          onMouseLeave={handleSlotMouseLeave}
                                        >
                                          <div className="font-extrabold text-slate-900 dark:text-white leading-tight text-[11px] truncate">
                                            {subName}
                                          </div>
                                          <div className="text-[10px] text-slate-700 dark:text-slate-300 font-bold truncate">
                                            {selectedCourseObj?.name || 'BCA'} • {slot.slot_type || slot.slotType || 'Lecture'}
                                          </div>
                                          {slot.topic && (
                                            <div className="text-[9px] text-slate-800 dark:text-slate-200 font-semibold truncate">
                                              📖 {slot.topic}
                                            </div>
                                          )}
                                          <div className="flex items-center justify-between text-[9px] font-bold text-slate-800 dark:text-slate-200 pt-1 border-t border-slate-300 dark:border-slate-700">
                                            <span className="truncate">👨‍🏫 {facName || 'Unassigned'}</span>
                                            {slot.room && (
                                              <span className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-1.5 py-0.5 rounded text-[8px] shrink-0 font-mono ml-1 border border-slate-300 dark:border-slate-700 font-bold">
                                                R-{slot.room}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="h-full flex items-center justify-center">
                                    <span className="text-[10px] text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                                      + Add Slot
                                    </span>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Dynamic Subject & Faculty Registry Footer List */}
              {registryList.length > 0 && (
                <div className="mt-8 border-2 border-slate-800 dark:border-slate-700 text-left text-xs text-slate-800 dark:text-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 dark:bg-slate-800 font-bold border-b-2 border-slate-800 dark:border-slate-700 p-2 text-center text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    SUBJECT & FACULTY REGISTRY
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x-2 divide-slate-800 dark:divide-slate-700">
                    <div className="divide-y divide-slate-300 dark:divide-slate-800">
                      <div className="grid grid-cols-3 p-1.5 font-bold bg-slate-50 dark:bg-slate-800/50 text-center text-[11px] text-slate-700 dark:text-slate-300">
                        <div>SUBJECT CODE</div>
                        <div>SUBJECT NAME</div>
                        <div>FACULTY NAME</div>
                      </div>
                      {registryList.slice(0, Math.ceil(registryList.length / 2)).map((s, idx) => (
                        <div
                          key={s.subject_code + idx}
                          className="grid grid-cols-3 p-2 text-center text-xs align-middle hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <div className="font-bold text-slate-900 dark:text-white font-mono">{s.subject_code || '-'}</div>
                          <div className="truncate px-1 text-slate-700 dark:text-slate-300 font-medium">{s.subject_name || '-'}</div>
                          <div className="truncate px-1 text-slate-600 dark:text-slate-400">{s.faculty_name || '-'}</div>
                        </div>
                      ))}
                    </div>
                    <div className="divide-y divide-slate-300 dark:divide-slate-800">
                      <div className="grid grid-cols-3 p-1.5 font-bold bg-slate-50 dark:bg-slate-800/50 text-center text-[11px] text-slate-700 dark:text-slate-300">
                        <div>SUBJECT CODE</div>
                        <div>SUBJECT NAME</div>
                        <div>FACULTY NAME</div>
                      </div>
                      {registryList.slice(Math.ceil(registryList.length / 2)).map((s, idx) => (
                        <div
                          key={s.subject_code + idx}
                          className="grid grid-cols-3 p-2 text-center text-xs align-middle hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <div className="font-bold text-slate-900 dark:text-white font-mono">{s.subject_code || '-'}</div>
                          <div className="truncate px-1 text-slate-700 dark:text-slate-300 font-medium">{s.subject_name || '-'}</div>
                          <div className="truncate px-1 text-slate-600 dark:text-slate-400">{s.faculty_name || '-'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Timetable Footer - Signatures */}
              <div className="mt-12 grid grid-cols-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300 pt-6">
                <div className="space-y-12">
                  <div className="h-8 border-b-2 border-dashed border-slate-400 dark:border-slate-600 max-w-[180px] mx-auto"></div>
                  <p className="font-bold">Time Table Incharge</p>
                </div>
                <div className="space-y-12">
                  <div className="h-8 border-b-2 border-dashed border-slate-400 dark:border-slate-600 max-w-[180px] mx-auto"></div>
                  <p className="font-bold">Academic Coordinator</p>
                </div>
                <div className="space-y-12">
                  <div className="h-8 border-b-2 border-dashed border-slate-400 dark:border-slate-600 max-w-[180px] mx-auto"></div>
                  <p className="font-bold">Dean / Principal</p>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* Modal Dialog for Scheduling / Editing Timetable Session */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{editingSlot ? '✏️' : '➕'}</span>
                <span>{editingSlot ? 'Edit Scheduled Session' : 'Schedule Timetable Session'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-black text-lg p-1"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold">
                ⚠️ {modalError}
              </div>
            )}

            <form onSubmit={handleSaveSlot} className="space-y-4 text-xs">
              {/* Day & Time Row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Day of Week</label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold"
                  >
                    {DAYS_OF_WEEK.map(d => (
                      <option key={d.value} value={d.value}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime.slice(0, 5)}
                    onChange={(e) => setFormData({ ...formData, startTime: `${e.target.value}:00` })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">End Time</label>
                  <input
                    type="time"
                    value={formData.endTime.slice(0, 5)}
                    onChange={(e) => setFormData({ ...formData, endTime: `${e.target.value}:00` })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold"
                    required
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Subject *</label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold"
                  required
                >
                  <option value="">-- Select Subject --</option>
                  {availableFormSubjects.map(s => (
                    <option key={s.id || s.code} value={s.id || s.code}>
                      [{s.code}] {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Faculty */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Faculty Member *</label>
                <select
                  value={formData.facultyId}
                  onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold"
                  required
                >
                  <option value="">-- Select Faculty --</option>
                  {(Array.isArray(allFaculties) ? allFaculties : []).map(f => (
                    <option key={f.id || f.emp_id} value={f.id || f.emp_id}>
                      [{f.emp_id || 'FAC'}] {f.name} {f.designation ? `(${f.designation})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Teaching Mode & Room */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Teaching Mode</label>
                  <select
                    value={formData.slotType}
                    onChange={(e) => setFormData({ ...formData, slotType: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold"
                  >
                    {TEACHING_MODES.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Room / Lab</label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    placeholder="e.g. Room 204, Lab 3"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold"
                  />
                </div>
              </div>

              {/* Topic */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Topic / Lesson</label>
                <input
                  type="text"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="e.g. Database Normalization & Indexing"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold"
                />
              </div>

              {/* Sub Topics / Scheduled Competencies */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Sub Topics / Competencies</label>
                <input
                  type="text"
                  value={selectedCompetencies.join(', ')}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedCompetencies(val.split(',').map(s => s.trim()).filter(Boolean));
                  }}
                  placeholder="e.g. 1NF, 2NF, 3NF, BCNF (or CS3.1, CS3.2)"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Separate multiple sub topics or competency codes with commas.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                {editingSlot ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/30 hover:bg-rose-500/20 font-bold transition-all"
                  >
                    Delete
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#5B4BFF] text-white font-bold hover:bg-[#4a3cf5] shadow-lg shadow-indigo-500/20 transition-all"
                  >
                    {editingSlot ? 'Save Changes' : 'Schedule Session'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slot Hover Details Popover — Theme Color & Scheduled Topics & Sub Topics */}
      {hoveredSlotInfo && (() => {
        const slot = hoveredSlotInfo.slot;

        // Resolve subject & faculty details
        const safeSubs = Array.isArray(subjects) ? subjects : [];
        const safeFacs = Array.isArray(allFaculties) ? allFaculties : [];
        const matchedSub = safeSubs.find(s => s && (String(s.id) === String(slot.subject_id) || String(s.code) === String(slot.subject_id) || String(s.code) === String(slot.subject_code)));
        const subName = (slot.subject_name && slot.subject_name !== 'Medical Subject') ? slot.subject_name : (matchedSub?.name || slot.topic || 'Subject');
        const subCode = (slot.subject_code && slot.subject_code !== 'MBBS') ? slot.subject_code : (matchedSub?.code || '');

        const matchedFac = safeFacs.find(f => f && (String(f.id) === String(slot.faculty_id) || String(f.emp_id) === String(slot.faculty_id)));
        const facName = (slot.faculty_name && slot.faculty_name !== 'Faculty Member') ? slot.faculty_name : (matchedFac?.name || 'Faculty Member');

        // Extract Main Topic
        const mainTopic = slot.topic || 'Curriculum Module / Lesson';

        // Extract Sub Topics / Competencies
        const rawCompCodes = slot.competency_codes ? slot.competency_codes.split(',').map(c => c.trim()).filter(Boolean) : [];
        const compList = filterCompetenciesForSlot(slot.competencies_detail || [], slot.subject_code, slot.subject_name, slot.topic);

        // Map subtopics to detailed objects (with code & description)
        const subTopics: { code: string; description?: string }[] = [];

        if (compList.length > 0) {
          compList.forEach(c => {
            subTopics.push({ code: c.code, description: c.description });
          });
        } else if (rawCompCodes.length > 0) {
          rawCompCodes.forEach(code => {
            const matchInMaster = (Array.isArray(allDbCompetencies) ? allDbCompetencies : []).find(
              c => c && c.code && (c.code.toLowerCase() === code.toLowerCase() || c.id === code)
            );
            subTopics.push({
              code: matchInMaster?.code || code,
              description: matchInMaster?.description || undefined
            });
          });
        }

        return (
          <div
            style={{
              top: `${Math.min(hoveredSlotInfo.y + 20, typeof window !== 'undefined' ? window.innerHeight - 280 : hoveredSlotInfo.y)}px`,
              left: `${Math.min(hoveredSlotInfo.x, typeof window !== 'undefined' ? window.innerWidth - 290 : hoveredSlotInfo.x)}px`
            }}
            onMouseEnter={handlePopoverMouseEnter}
            onMouseLeave={handlePopoverMouseLeave}
            className="fixed z-50 p-3 rounded-2xl bg-gradient-to-br from-[#2D2575] via-[#231C63] to-[#1B1652] text-white shadow-2xl shadow-[#2D2575]/60 border-2 border-[#5B4BFF]/50 text-[11px] space-y-2 w-72 max-w-[270px] pointer-events-auto animate-fade-in backdrop-blur-xl"
          >
            {/* Header: Subject & Session Type Badge */}
            <div className="flex items-center justify-between gap-1.5 border-b border-white/10 pb-1.5">
              <span className="px-2 py-0.5 rounded-md text-[9px] font-black font-mono bg-[#F36C21] text-white shadow-xs uppercase tracking-wider">
                {subCode ? `${subCode} • ` : ''}{slot.slot_type || slot.slotType || 'LECTURE'}
              </span>
              <span className="text-[10px] font-mono font-bold text-indigo-200">
                ⏰ {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
              </span>
            </div>

            {/* Subject Title & Faculty Info */}
            <div className="space-y-0.5">
              <h4 className="font-extrabold text-xs text-white leading-tight truncate">
                {subName}
              </h4>
              <div className="flex items-center justify-between text-[10px] text-indigo-200 font-medium pt-0.5">
                <span className="truncate">👨‍🏫 {facName}</span>
                {slot.room && (
                  <span className="bg-white/15 px-1.5 py-0.2 rounded font-mono text-[9px] text-indigo-100 border border-white/20 font-bold shrink-0 ml-1">
                    R-{slot.room}
                  </span>
                )}
              </div>
            </div>

            {/* Scheduled Topic Card */}
            <div className="p-2 rounded-lg bg-white/10 border border-white/15 space-y-0.5">
              <div className="text-[9px] font-black uppercase text-[#F36C21] tracking-wider flex items-center gap-1">
                <span>📖 Scheduled Topic</span>
              </div>
              <p className="text-[11px] font-bold text-white leading-snug">
                {mainTopic}
              </p>
            </div>

            {/* Scheduled Sub Topics Card */}
            <div className="p-2 rounded-lg bg-white/10 border border-white/15 space-y-1">
              <div className="text-[9px] font-black uppercase text-indigo-200 tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <span>🎯 SUB TOPICS/TEACHING TOPICS</span>
                </span>
                {subTopics.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#5B4BFF] text-white text-[8.5px] font-mono font-bold">
                    {subTopics.length}
                  </span>
                )}
              </div>

              {subTopics.length > 0 ? (
                <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                  {subTopics.map((st, i) => (
                    <div key={i} className="p-1 px-1.5 rounded bg-black/25 border border-white/10 text-[10px] flex items-start gap-1.5">
                      <span className="shrink-0 px-1 py-0.2 rounded bg-[#5B4BFF] text-white font-mono font-bold text-[9px]">
                        {st.code}
                      </span>
                      {st.description ? (
                        <p className="text-indigo-100 text-[9.5px] leading-tight font-medium self-center">
                          {st.description}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-indigo-200 italic font-medium">
                  Sub topics: Scheduled per topic syllabus
                </p>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

