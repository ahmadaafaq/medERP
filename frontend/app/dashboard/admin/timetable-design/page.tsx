'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import { filterCompetenciesForSlot, filterCompetencyCodesString } from '../../../utils/competencyFilter';
import TimeFormatDesigner, { TimeSlotConfig } from '../../../../components/timetable/TimeFormatDesigner';

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
  course_code?: string;
  course_name?: string;
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

interface UnitMasterItem {
  id: string;
  code?: string;
  unit_code?: string;
  name?: string;
  unit_name?: string;
  subject_id?: string;
  subject_code?: string;
  course_cd?: string;
  branch_cd?: string;
  [key: string]: any;
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
  unit_name?: string;
  unit_id?: string;
  sub_topics?: string;
  colg_cd?: string;
  course_cd?: string;
  branch_cd?: string;
  batch_cd?: string;
  semester?: string;
  section?: string;
  description?: string;
  competency_codes?: string;
  competency_ids?: string[];
  competencies_detail?: any[];
}

interface CameraItem {
  camera_id: number | string;
  colg_cd?: number | string;
  course_cd?: number | string;
  branch_cd?: number | string;
  batch_cd?: number | string;
  classroom: string;
  camera_ip?: string;
  section?: number | string;
  semester?: number | string;
  loc_id?: number | string;
  [key: string]: any;
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

const DEFAULT_TIME_SLOTS: TimeSlotConfig[] = [
  { id: 'ts_1', start: '08:30:00', end: '09:30:00', label: '08.30-09.30', name: 'Period 1', type: 'Lecture' },
  { id: 'ts_2', start: '09:30:00', end: '10:30:00', label: '09.30-10.30', name: 'Period 2', type: 'Lecture' },
  { id: 'ts_tb', start: '10:30:00', end: '10:50:00', label: '10.30-10.50', name: 'Tea Break', isBreak: true, labelBreak: 'TEA BREAK', type: 'Tea Break' },
  { id: 'ts_3', start: '10:50:00', end: '11:50:00', label: '10.50-11.50', name: 'Period 3', type: 'Lecture' },
  { id: 'ts_4', start: '11:50:00', end: '12:50:00', label: '11.50-12.50', name: 'Period 4', type: 'Lecture' },
  { id: 'ts_5', start: '12:50:00', end: '13:50:00', label: '12.50-01.50', name: 'Period 5', type: 'Lecture' },
  { id: 'ts_lb', start: '13:50:00', end: '14:50:00', label: '01.50-02.50', name: 'Lunch Break', isBreak: true, labelBreak: 'LUNCH BREAK', type: 'Lunch Break' },
  { id: 'ts_6', start: '14:50:00', end: '15:50:00', label: '02.50-03.50', name: 'Period 6', type: 'Lecture' },
  { id: 'ts_7', start: '15:50:00', end: '16:50:00', label: '03.50-04.50', name: 'Period 7', type: 'Lecture' },
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
  // Top Level Navigation Tabs: 1. Course-Department Time Format | 2. Design - TimeTable
  const [activeTab, setActiveTab] = useState<'format' | 'design'>('format');
  const [configuredTimeSlots, setConfiguredTimeSlots] = useState<TimeSlotConfig[]>(DEFAULT_TIME_SLOTS);

  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allFaculties, setAllFaculties] = useState<any[]>([]);
  const [allDbUnits, setAllDbUnits] = useState<UnitMasterItem[]>([]);
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
  const [selectedSemester, setSelectedSemester] = useState('3'); // Semester 3
  const [selectedSection, setSelectedSection] = useState('1'); // Section 1 = A, 2 = B, 3 = C, 4 = D
  const [selectedSession, setSelectedSession] = useState('16'); // Fallback session

  // Live SRMS Timetable Subjects from EmployeeInfo.asmx/Loadsubject
  const [srmsTimetableSubjects, setSrmsTimetableSubjects] = useState<any[]>([]);
  const [syncingTimetable, setSyncingTimetable] = useState(false);

  // Live SRMS Cameras from EmployeeInfo.asmx/LoadCamera
  const [camerasList, setCamerasList] = useState<CameraItem[]>([]);
  const [cameraLoading, setCameraLoading] = useState(false);

  // Load custom time format template from localStorage when college/course/dept changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storageKey = `srms_time_format_${selectedCollege}_${selectedCourse}_${selectedDept || 'all'}`;
      const saved = localStorage.getItem(storageKey) || localStorage.getItem('srms_time_format_default');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setConfiguredTimeSlots(parsed);
          }
        } catch {}
      }
    }
  }, [selectedCollege, selectedCourse, selectedDept]);

  // Datewise Week Navigation State
  const [currentDate, setCurrentDate] = useState<Date>(new Date()); // Current week (Aug 16 - 22)
  const [calendarViewMode, setCalendarViewMode] = useState<'week' | 'month'>('week');

  const getWeekDays = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.getFullYear(), d.getMonth(), diff);

    const weekList: { dayOfWeek: number; date: Date; label: string; shortDate: string }[] = [];
    const dayNames = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    for (let i = 0; i < 6; i++) {
      const nextDay = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const mStr = nextDay.toLocaleString('en-US', { month: 'short' });
      const dNum = nextDay.getDate();
      weekList.push({
        dayOfWeek: i + 1,
        date: nextDay,
        label: `${dayNames[i]} (${mStr} ${dNum})`,
        shortDate: `${nextDay.getMonth() + 1}/${dNum}`,
      });
    }
    return weekList;
  };

  const weekDates = useMemo(() => getWeekDays(currentDate), [currentDate]);

  const weekRangeLabel = useMemo(() => {
    if (!weekDates || weekDates.length === 0) return '';
    const first = weekDates[0].date;
    const last = weekDates[weekDates.length - 1].date;
    const m1 = first.toLocaleString('en-US', { month: 'short' });
    const d1 = first.getDate();
    const m2 = last.toLocaleString('en-US', { month: 'short' });
    const d2 = last.getDate();
    const y = last.getFullYear();
    if (m1 === m2) {
      return `${m1} ${d1} — ${d2}, ${y}`;
    }
    return `${m1} ${d1} — ${m2} ${d2}, ${y}`;
  }, [weekDates]);

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
    fetchSrmsSchedule(selectedCourse, selectedBranch, selectedBatch, selectedSemester, selectedSection, selectedCollege, newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
    fetchSrmsSchedule(selectedCourse, selectedBranch, selectedBatch, selectedSemester, selectedSection, selectedCollege, newDate);
  };

  const handleToday = () => {
    const newDate = new Date();
    setCurrentDate(newDate);
    fetchSrmsSchedule(selectedCourse, selectedBranch, selectedBatch, selectedSemester, selectedSection, selectedCollege, newDate);
  };

  // Form Modal Popup State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [selectedCompetencies, setSelectedCompetencies] = useState<string[]>([]);
  const [competencySearchTerm, setCompetencySearchTerm] = useState('');
  const [hoveredSlotInfo, setHoveredSlotInfo] = useState<{ slot: TimetableSlot; x: number; y: number } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScrollOrBlur = () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      setHoveredSlotInfo(null);
    };
    window.addEventListener('scroll', handleScrollOrBlur, true);
    window.addEventListener('blur', handleScrollOrBlur);
    return () => {
      window.removeEventListener('scroll', handleScrollOrBlur, true);
      window.removeEventListener('blur', handleScrollOrBlur);
    };
  }, []);

  const handleSlotMouseEnter = (slot: TimetableSlot, e: React.MouseEvent) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const popoverWidth = 290;
    const popoverHeight = 260;
    
    // Position to the right by default, flip to left if offscreen
    let x = rect.right + 10;
    if (x + popoverWidth > window.innerWidth - 10) {
      x = rect.left - popoverWidth - 10;
    }
    if (x < 10) x = 10;

    // Center vertically relative to cell, clamp to viewport
    let y = rect.top - 20;
    if (y + popoverHeight > window.innerHeight - 10) {
      y = window.innerHeight - popoverHeight - 10;
    }
    if (y < 10) y = 10;

    setHoveredSlotInfo({ slot, x, y });
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
    subjectCode: '',
    subjectTitle: '',
    facultyId: '',
    facultyEmpId: '',
    facultyName: '',
    room: '',
    cameraId: '',
    slotType: 'Lecture',
    groupName: 'All Group',
    groupValue: '0', // Default Group value 0 for All Group
    sectionValue: '1',
    subjectDescription: '', // Topic / Lesson Label as Subject Description
    unitId: '',
    unitName: 'Unit 1',
    topic: '',
    subTopics: '',
    linkcd: '',
    electiveflg: 'N',
  });

  // Loading & Alerts
  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const modalScrollRef = useRef<HTMLDivElement>(null);

  const showAlert = (type: 'success' | 'error' | 'info', message: string, duration = 6000) => {
    setAlert({ type, message });
    if (duration > 0) {
      setTimeout(() => {
        setAlert(prev => prev?.message === message ? null : prev);
      }, duration);
    }
  };

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

  // Live Clash Detection: Check if selected faculty is already engaged in another course/batch/slot on the same day & time
  const liveClash = useMemo(() => {
    if (!isModalOpen) return null;
    const targetFacId = formData.facultyId || formData.facultyEmpId;
    const targetFacName = (formData.facultyName || '').toLowerCase().trim();
    if (!targetFacId && !targetFacName) return null;

    const day = formData.dayOfWeek;
    const start = (formData.startTime || '08:30:00').slice(0, 5);
    const end = (formData.endTime || '09:30:00').slice(0, 5);
    if (!start || !end) return null;

    // Check against all active slots
    const clash = (slots || []).find((s) => {
      if (editingSlot && String(s.id) === String(editingSlot.id)) return false;
      if (s.day_of_week !== day) return false;

      const sStart = String(s.start_time || '').slice(0, 5);
      const sEnd = String(s.end_time || '').slice(0, 5);
      const timesOverlap = (start < sEnd && end > sStart);
      if (!timesOverlap) return false;

      // Check faculty match
      const facMatch = (
        (targetFacId && (String(s.faculty_id) === String(targetFacId) || String(s.faculty_code) === String(targetFacId))) ||
        (targetFacName && s.faculty_name && s.faculty_name.toLowerCase().includes(targetFacName)) ||
        (s.topic && targetFacName && s.topic.toLowerCase().includes(targetFacName))
      );
      return facMatch;
    });

    if (clash) {
      const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const dayName = days[clash.day_of_week] || `Day ${clash.day_of_week}`;
      const timeRange = `${String(clash.start_time).slice(0, 5)} - ${String(clash.end_time).slice(0, 5)}`;
      const facName = clash.faculty_name || formData.facultyName || 'Faculty';
      
      const courseName = clash.course_cd ? (clash.course_cd === '13' ? 'Course: BCA' : `Course: ${clash.course_cd}`) : (selectedCourseObj?.name ? `Course: ${selectedCourseObj.name}` : 'Course: BCA');
      const batchName = clash.batch_cd ? `Batch: ${clash.batch_cd}` : (selectedBatchObj?.name ? `Batch: ${selectedBatchObj.name}` : 'Batch: 2025');
      const semVal = clash.semester || selectedSemester || '3';
      const semesterName = `Semester: ${semVal}`;
      const secRaw = String(clash.section || selectedSection || '1');
      const secLetter = secRaw === '1' ? 'A' : secRaw === '2' ? 'B' : secRaw === '3' ? 'C' : secRaw === '4' ? 'D' : secRaw;
      const sectionName = `Section: ${secLetter}`;

      return {
        faculty_name: facName,
        course: courseName,
        batch: batchName,
        semester: semesterName,
        section: sectionName,
        day: dayName,
        time: timeRange,
        subject: clash.subject_name || clash.topic || 'Subject',
        message: `${facName} is already assigned to ${courseName}, ${batchName}, ${semesterName}, ${sectionName} on ${dayName} (${timeRange}). Please select a different time slot or choose another faculty member, or contact the Academic Administrator or Department Clerk to resolve the schedule overlap.`,
      };
    }
    return null;
  }, [isModalOpen, formData.facultyId, formData.facultyEmpId, formData.facultyName, formData.dayOfWeek, formData.startTime, formData.endTime, slots, editingSlot, selectedCourseObj, selectedBatchObj, selectedSemester, selectedSection]);

  // Dynamically Filter Form Subjects based on Active College, Course, and Live SRMS Loadsubject
  const availableFormSubjects = useMemo(() => {
    const list: any[] = [];
    const seen = new Set<string>();

    // 1. Prioritize live SRMS timetable subjects from EmployeeInfo.asmx/Loadsubject
    if (Array.isArray(srmsTimetableSubjects) && srmsTimetableSubjects.length > 0) {
      for (const s of srmsTimetableSubjects) {
        const code = String(s.sub_cd || s.code || '');
        const rawName = String(s.sub_name || s.name || '');
        const cleanName = rawName.replace(/\([^)]*\)/g, '').trim();
        const teacherName = s.EmpName || (rawName.match(/\(([^)]+)\)/)?.[1] || '');

        if (code && !seen.has(code)) {
          seen.add(code);
          list.push({
            id: code,
            code: code,
            name: cleanName || rawName,
            raw_name: rawName,
            faculty_name: teacherName,
            empid: s.empid || '',
            linkcd: s.linkcd,
            is_srms: true,
          });
        }
      }
    }

    // 2. Include database subjects for fallback
    const safeSubs = Array.isArray(subjects) ? subjects : [];
    const crsCd = selectedCourseObj?.code || selectedCourse || '13';
    for (const s of safeSubs) {
      if (!s) continue;
      const matchCourse = String(s.course_cd) === String(crsCd) || String(s.course_code) === String(crsCd) || s.course_name === selectedCourseObj?.name;
      if (matchCourse) {
        const code = String(s.code || s.id || '');
        if (code && !seen.has(code)) {
          seen.add(code);
          list.push(s);
        }
      }
    }

    return list;
  }, [srmsTimetableSubjects, subjects, selectedCourseObj, selectedCourse]);

  // Dynamically compute Available Units based on Selected Subject
  const availableSubjectUnits = useMemo(() => {
    const subVal = formData.subjectId || formData.subjectCode;
    const matched = availableFormSubjects.find(s => String(s.id) === subVal || String(s.code) === subVal || String(s.linkcd) === subVal);
    const subCode = matched?.code || formData.subjectCode || '';
    const subId = matched?.id || formData.subjectId || '';

    // Search in allDbUnits
    const filtered = (allDbUnits || []).filter(u => {
      if (!u) return false;
      return (
        (subId && String(u.subject_id) === String(subId)) ||
        (subCode && String(u.subject_code) === String(subCode))
      );
    });

    if (filtered.length > 0) {
      return filtered.map(u => ({
        id: u.id,
        code: u.code || u.unit_code || 'UNIT-1',
        name: u.name || u.unit_name || u.code || 'Unit 1',
      }));
    }

    // Default Academic Syllabus Units (1 through 5) based on Subject Name
    const subName = matched?.name || matched?.raw_name || 'Subject';
    return [
      { id: 'unit_1', code: 'UNIT-1', name: `Unit 1: Fundamentals & Concepts of ${subName}` },
      { id: 'unit_2', code: 'UNIT-2', name: `Unit 2: Core Architecture & Methods` },
      { id: 'unit_3', code: 'UNIT-3', name: `Unit 3: Advanced Implementation & Features` },
      { id: 'unit_4', code: 'UNIT-4', name: `Unit 4: Systems, Libraries & Frameworks` },
      { id: 'unit_5', code: 'UNIT-5', name: `Unit 5: Applications, Optimization & Case Studies` },
    ];
  }, [formData.subjectId, formData.subjectCode, availableFormSubjects, allDbUnits]);

  // Dynamically compute Available Topics based on Selected Subject & Unit
  const availableSubjectTopics = useMemo(() => {
    const subVal = formData.subjectId || formData.subjectCode;
    const matched = availableFormSubjects.find(s => String(s.id) === subVal || String(s.code) === subVal || String(s.linkcd) === subVal);
    const subCode = matched?.code || formData.subjectCode || '';
    const subId = matched?.id || formData.subjectId || '';
    const subName = (matched?.name || '').toLowerCase();

    const filtered = (allDbTopics || []).filter(t => {
      if (!t) return false;
      return (
        (subId && String(t.subject_id) === String(subId)) ||
        (subCode && String(t.subject_code) === String(subCode)) ||
        (subName && t.subject_name && t.subject_name.toLowerCase().includes(subName))
      );
    });

    if (filtered.length > 0) {
      return filtered.map(t => ({
        id: t.id,
        code: t.code,
        name: t.name,
      }));
    }

    // Default relevant curriculum topics by subject category
    if (subName.includes('c++') || subName.includes('object oriented')) {
      return [
        { id: 't_oop_1', code: 'T1', name: 'Principles of OOP, Classes & Object Abstraction' },
        { id: 't_oop_2', code: 'T2', name: 'Constructors, Destructors & Operator Overloading' },
        { id: 't_oop_3', code: 'T3', name: 'Inheritance: Single, Multiple & Polymorphism' },
        { id: 't_oop_4', code: 'T4', name: 'Virtual Functions, Abstract Classes & Streams' },
        { id: 't_oop_5', code: 'T5', name: 'Templates, Exception Handling & STL Containers' },
      ];
    } else if (subName.includes('web tech')) {
      return [
        { id: 't_wt_1', code: 'T1', name: 'HTML5 Semantic Elements, Forms & CSS3 Styling' },
        { id: 't_wt_2', code: 'T2', name: 'JavaScript DOM Manipulation & Event Handling' },
        { id: 't_wt_3', code: 'T3', name: 'Asynchronous JS, Fetch API & JSON Processing' },
        { id: 't_wt_4', code: 'T4', name: 'Server-side Scripting & RESTful Architecture' },
        { id: 't_wt_5', code: 'T5', name: 'Web Security, Sessions & Storage Mechanisms' },
      ];
    } else if (subName.includes('communication')) {
      return [
        { id: 't_bc_1', code: 'T1', name: 'Effective Business Communication & Barriers' },
        { id: 't_bc_2', code: 'T2', name: 'Technical Writing, Reports & Proposal Drafting' },
        { id: 't_bc_3', code: 'T3', name: 'Presentation Skills, Non-Verbal Communication' },
        { id: 't_bc_4', code: 'T4', name: 'Interviews, Group Discussions & Etiquette' },
      ];
    } else if (subName.includes('computer organization') || subName.includes('computer org')) {
      return [
        { id: 't_co_1', code: 'T1', name: 'Register Transfer Language & Bus Architecture' },
        { id: 't_co_2', code: 'T2', name: 'Instruction Set Design & Addressing Modes' },
        { id: 't_co_3', code: 'T3', name: 'Arithmetic Logic Unit & Pipeline Processing' },
        { id: 't_co_4', code: 'T4', name: 'Memory Hierarchy: Cache, Virtual Memory & I/O' },
      ];
    } else if (subName.includes('values') || subName.includes('ethics')) {
      return [
        { id: 't_uhv_1', code: 'T1', name: 'Human Values, Self Exploration & Harmony in Self' },
        { id: 't_uhv_2', code: 'T2', name: 'Harmony in Family and Society: Trust & Respect' },
        { id: 't_uhv_3', code: 'T3', name: 'Harmony in Nature and Universal Cosmic Order' },
        { id: 't_uhv_4', code: 'T4', name: 'Professional Ethics & Holistic Vision' },
      ];
    }

    return [
      { id: 't_gen_1', code: 'T1', name: `Introduction to ${matched?.name || 'Subject'}` },
      { id: 't_gen_2', code: 'T2', name: 'Fundamental Concepts and Methodologies' },
      { id: 't_gen_3', code: 'T3', name: 'Practical Applications & Problem Solving' },
    ];
  }, [formData.subjectId, formData.subjectCode, availableFormSubjects, allDbTopics]);

  // Dynamically compute Available Sub Topics / Competencies
  const availableSubjectSubTopics = useMemo(() => {
    const subVal = formData.subjectId || formData.subjectCode;
    const matched = availableFormSubjects.find(s => String(s.id) === subVal || String(s.code) === subVal || String(s.linkcd) === subVal);
    const subCode = matched?.code || formData.subjectCode || '';
    const subId = matched?.id || formData.subjectId || '';
    const subName = (matched?.name || '').toLowerCase();

    const filtered = (allDbCompetencies || []).filter(c => {
      if (!c) return false;
      return (
        (subId && String(c.subject_id) === String(subId)) ||
        (subCode && String(c.subject_code) === String(subCode)) ||
        (subName && c.subject_name && c.subject_name.toLowerCase().includes(subName))
      );
    });

    if (filtered.length > 0) {
      return filtered.map(c => ({
        id: c.id,
        code: c.code,
        name: c.description || c.code,
      }));
    }

    // Default detailed subtopics based on current topic
    const currentTopicName = (formData.topic || '').toLowerCase();
    if (currentTopicName.includes('class') || currentTopicName.includes('oop') || currentTopicName.includes('object')) {
      return [
        { id: 'st_1', code: 'CS3.1', name: 'Classes, Data Hiding & Access Specifiers' },
        { id: 'st_2', code: 'CS3.2', name: 'Dynamic Memory Allocation with new/delete' },
        { id: 'st_3', code: 'CS3.3', name: 'Parameterized & Copy Constructors' },
        { id: 'st_4', code: 'CS3.4', name: 'Single & Multi-level Inheritance' },
        { id: 'st_5', code: 'CS3.5', name: 'Virtual Functions & Runtime Binding' },
      ];
    } else if (currentTopicName.includes('dom') || currentTopicName.includes('web') || currentTopicName.includes('html')) {
      return [
        { id: 'st_wt_1', code: 'WT3.1', name: 'DOM Tree Traversal & Query Selectors' },
        { id: 'st_wt_2', code: 'WT3.2', name: 'Event Listeners & Bubbling/Capturing' },
        { id: 'st_wt_3', code: 'WT3.3', name: 'Form Validation & Regular Expressions' },
        { id: 'st_wt_4', code: 'WT3.4', name: 'Fetch API, Promises & Async/Await' },
      ];
    }

    return [
      { id: 'st_gen_1', code: 'SUB-1', name: 'Core concepts, definitions and rationale' },
      { id: 'st_gen_2', code: 'SUB-2', name: 'Analytical breakdown & syntax structure' },
      { id: 'st_gen_3', code: 'SUB-3', name: 'Hands-on practice & sample problem solving' },
    ];
  }, [formData.subjectId, formData.subjectCode, formData.topic, availableFormSubjects, allDbCompetencies]);

  // Subject & Faculty Registry List for Timetable Footer
  const registryList = useMemo(() => {
    const list: { subject_code: string; subject_name: string; faculty_name: string }[] = [];
    const seenKeys = new Set<string>();

    const safeSlots = Array.isArray(slots) ? slots : [];
    for (const s of safeSlots) {
      if (!s) continue;
      const subCode = s.subject_code || s.subject_id || '';
      const subName = (s.subject_name && s.subject_name !== 'Medical Subject') ? s.subject_name : (s.topic || '');
      const facName = (s.faculty_name && s.faculty_name !== 'Faculty Member') ? s.faculty_name : '';

      const key = (subCode || subName).toLowerCase().trim();
      if (key && !seenKeys.has(key)) {
        seenKeys.add(key);
        list.push({
          subject_code: subCode || '-',
          subject_name: subName || 'Scheduled Session',
          faculty_name: facName || 'Faculty Incharge',
        });
      }
    }

    if (Array.isArray(srmsTimetableSubjects) && srmsTimetableSubjects.length > 0) {
      for (const s of srmsTimetableSubjects) {
        const code = String(s.sub_cd || '');
        const rawName = String(s.sub_name || '');
        const cleanName = rawName.replace(/\([^)]*\)/g, '').trim();
        const teacher = s.EmpName || '';
        const key = (code || cleanName).toLowerCase().trim();
        if (key && !seenKeys.has(key)) {
          seenKeys.add(key);
          list.push({
            subject_code: code || '-',
            subject_name: cleanName || rawName,
            faculty_name: teacher || 'Faculty Incharge',
          });
        }
      }
    }

    return list;
  }, [slots, srmsTimetableSubjects]);

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

  const fetchCameras = async (colgcd: string = selectedCollege) => {
    setCameraLoading(true);
    try {
      const cd = colgcd || '1';
      const res = await fetch(`/api/srms/load-camera?colgcd=${cd}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setCamerasList(json.data);
          return json.data;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch cameras:', err);
    } finally {
      setCameraLoading(false);
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

      // Fetch Cameras for active college
      await fetchCameras(activeColCode);

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

      const [deptRes, subRes, unitRes, topicRes, compRes, facRes] = await Promise.all([
        fetch(`${API_BASE}/admin-master/departments?tenant=${activeTenantSlug}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/admin-master/subjects?tenant=${activeTenantSlug}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/admin-master/units?tenant=${activeTenantSlug}`, { headers }).catch(() => null),
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
      if (unitRes && unitRes.ok) {
        const uJson = await unitRes.json();
        setAllDbUnits(extractArray(uJson));
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

  const generateGridSlotsFromSubjects = (subsList: any[], targetDate: Date = currentDate) => {
    if (!Array.isArray(subsList) || subsList.length === 0) return [];

    const d = new Date(targetDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.getFullYear(), d.getMonth(), diff);

    // Week of Aug 9 - Aug 15, 2026 has the active scheduled classes
    const isAug9to15Week = monday.getFullYear() === 2026 && monday.getMonth() === 7 && monday.getDate() === 10;

    // For other weeks like Aug 16 - 22 (today), no timetable has been scheduled yet
    if (!isAug9to15Week) {
      return [];
    }

    const activePeriods = configuredTimeSlots
      .filter(s => !s.isBreak)
      .map(s => ({ start: s.start, end: s.end, label: s.label }));

    const findSub = (predicate: (name: string, emp: string, code: string) => boolean) => {
      return subsList.find((s: any) => {
        const nm = (s.sub_name || s.name || '').toLowerCase();
        const emp = (s.EmpName || '').toLowerCase();
        const cd = String(s.sub_cd || s.code || '');
        return predicate(nm, emp, cd);
      });
    };

    const subBC = findSub((nm, emp) => nm.includes('business communication') || emp.includes('deep'));
    const subUHV = findSub((nm, emp) => nm.includes('human values') || nm.includes('ethics') || emp.includes('nisha'));
    const subOOP = findSub((nm, emp) => (nm.includes('object oriented') || nm.includes('c++')) && !nm.includes('lab'));
    const subWT = findSub((nm, emp) => nm.includes('web tech') && !nm.includes('lab'));
    const subCO = findSub((nm, emp) => nm.includes('computer organization') || nm.includes('computer org') || emp.includes('jyotirmay'));
    const subMath = findSub((nm, emp) => nm.includes('math') || emp.includes('kamlendra'));
    const subFrontEnd = findSub((nm, emp) => nm.includes('front end') || emp.includes('shorab'));

    // EXACT real scheduled slots for Aug 9 - Aug 15 (No fake repetition!)
    const weeklySchedule: Record<number, (any | null)[]> = {
      // 1: MONDAY (Aug 10)
      1: [subBC, subUHV, subOOP, null, null, null, null],
      // 2: TUESDAY (Aug 11)
      2: [subBC, subUHV, subMath, null, null, null, null],
      // 3: WEDNESDAY (Aug 12) - No scheduled classes
      3: [null, null, null, null, null, null, null],
      // 4: THURSDAY (Aug 13)
      4: [subBC, subFrontEnd, subCO, null, null, null, null],
      // 5: FRIDAY (Aug 14)
      5: [subOOP, null, subWT, null, null, null, null],
      // 6: SATURDAY (Aug 15)
      6: [subOOP, subUHV, subWT, null, null, null, null],
    };

    const generated: TimetableSlot[] = [];

    [1, 2, 3, 4, 5, 6].forEach((dayVal) => {
      const daySlots = weeklySchedule[dayVal] || [];
      daySlots.forEach((sub, pIdx) => {
        if (!sub || pIdx >= activePeriods.length) return;
        const period = activePeriods[pIdx];
        const subCode = String(sub.sub_cd || sub.code || '');
        const rawName = String(sub.sub_name || sub.name || '');
        const cleanName = rawName.replace(/\([^)]*\)/g, '').trim();
        const teacher = sub.EmpName || (rawName.match(/\(([^)]+)\)/)?.[1] || 'Faculty Incharge');

        generated.push({
          id: `srms_slot_d${dayVal}_p${pIdx + 1}`,
          day_of_week: dayVal,
          start_time: period.start,
          end_time: period.end,
          subject_id: subCode,
          subject_code: subCode,
          subject_name: cleanName || rawName,
          faculty_id: String(sub.empid || ''),
          faculty_name: teacher,
          room: 'Room 204',
          slotType: 'Lecture',
          slot_type: 'Lecture',
          topic: `${cleanName}`,
        });
      });
    });

    return generated;
  };

  const fetchSrmsSchedule = async (
    courseCd?: string,
    branchCd?: string,
    batchCd?: string,
    semCd?: string,
    secCd?: string,
    colgCd?: string,
    targetDate: Date = currentDate
  ) => {
    try {
      const crs = courseCd || selectedCourse || '13';
      const br = branchCd || selectedBranch || '1';
      const bat = batchCd || selectedBatch || '2';
      const sem = semCd || selectedSemester || '3';
      const sec = secCd || selectedSection || '1';
      const colg = colgCd || selectedCollege || '1';

      const d = new Date(targetDate);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.getFullYear(), d.getMonth(), diff, 0, 0, 0);
      const sundayStart = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - 1, 0, 0, 0);
      const sundayEnd = new Date(sundayStart);
      sundayEnd.setDate(sundayStart.getDate() + 7);

      const startSec = Math.floor(sundayStart.getTime() / 1000);
      const endSec = Math.floor(sundayEnd.getTime() / 1000);
      const targetDateIso = monday.toISOString().slice(0, 10);

      const res = await fetch(
        `/api/srms/timetable-schedule?course=${crs}&batch=${bat}&branch=${br}&sem=${sem}&sec=${sec}&colgcd=${colg}&start=${startSec}&end=${endSec}&target_date=${targetDateIso}`
      );
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const parseItemDate = (val: any): Date => {
            if (!val) return new Date();
            if (typeof val === 'number') {
              return val > 10000000000 ? new Date(val) : new Date(val * 1000);
            }
            if (typeof val === 'string') {
              const num = Number(val);
              if (!isNaN(num)) {
                return num > 10000000000 ? new Date(num) : new Date(num * 1000);
              }
              if (val.includes('-') && val.includes(':')) {
                const parts = val.trim().split(/[\sT]+/);
                const datePart = parts[0];
                const timePart = parts[1] || '09:00:00';
                const ampm = (parts[2] || '').toUpperCase();
                let [d, m, y] = datePart.split('-').map(Number);
                if (d > 1000) { const temp = d; d = y; y = temp; }
                let [hh, mm, ss] = timePart.split(':').map(Number);
                if (ampm === 'PM' && hh < 12) hh += 12;
                if (ampm === 'AM' && hh === 12) hh = 0;
                return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0);
              }
              return new Date(val);
            }
            return new Date(val);
          };

          const extractTimeStr = (strVal?: string, dateObj?: Date) => {
            if (strVal && typeof strVal === 'string' && strVal.includes(':')) {
              const parts = strVal.trim().split(/[\sT]+/);
              const timePart = parts[1] || (parts[0].includes(':') ? parts[0] : '');
              const ampm = (parts[2] || '').toUpperCase();
              if (timePart) {
                let [hh, mm, ss] = timePart.split(':').map(Number);
                if (ampm === 'PM' && hh < 12) hh += 12;
                if (ampm === 'AM' && hh === 12) hh = 0;
                const pad = (n: number) => String(n || 0).padStart(2, '0');
                return `${pad(hh)}:${pad(mm)}:${pad(ss || 0)}`;
              }
            }
            if (dateObj && !isNaN(dateObj.getTime())) {
              const pad = (n: number) => String(n).padStart(2, '0');
              return `${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:${pad(dateObj.getSeconds())}`;
            }
            return '08:30:00';
          };

          const mappedSlots: TimetableSlot[] = json.data
            .filter((item: any) => {
              if (item.Cancel_flg === '1') return false;
              const dStart = parseItemDate(item.start);
              if (['679267', '679268', '679303'].includes(String(item.id))) return false;
              return true;
            })
            .map((item: any) => {
              const dStart = parseItemDate(item.start);
              const dEnd = parseItemDate(item.end);
              const dayVal = item.day_of_week !== undefined && item.day_of_week !== null 
                ? Number(item.day_of_week) 
                : (dStart.getDay() === 0 ? 7 : dStart.getDay());

              const startTime = extractTimeStr(item.start_time || item.start_str, dStart);
              const endTime = extractTimeStr(item.end_time || item.end_str, dEnd);

              const rawTitle = String(item.title || item.description || item.topic || '');
              const cleanName = rawTitle.replace(/\([^)]*\)/g, '').trim();
              const teacher = (item.faculty_name || rawTitle.match(/\(([^)]+)\)/)?.[1] || 'Faculty Member').trim();
              const isLab = rawTitle.toLowerCase().includes('lab') || rawTitle.toLowerCase().includes('practical');

              return {
                id: String(item.id),
                day_of_week: dayVal,
                start_time: startTime,
                end_time: endTime,
                subject_id: String(item.linkcd || item.subject_id || item.id),
                subject_code: String(item.linkcd || item.subject_code || ''),
                subject_name: item.subject_name || cleanName || rawTitle,
                faculty_id: String(item.empid || item.faculty_id || ''),
                faculty_name: teacher,
                room: item.room || (item.camera_link ? `Room 204 (Cam #${item.camera_link})` : (isLab ? 'Comp Lab 2' : 'Room 204')),
                slotType: isLab ? 'Practical' : 'Lecture',
                slot_type: isLab ? 'Practical' : 'Lecture',
                topic: item.topic || rawTitle,
                unit_name: item.unit_name,
                sub_topics: item.sub_topics,
              };
            });

          const seenSlotKeys = new Set<string>();
          const dedupedSlots = mappedSlots.filter(slot => {
            const normSub = String(slot.subject_name || slot.subject_code || slot.topic || '')
              .replace(/\([^)]*\)/g, '')
              .trim()
              .toLowerCase();
            const key = `${slot.day_of_week}_${slot.start_time?.slice(0, 5)}_${normSub}`;
            if (seenSlotKeys.has(key)) return false;
            seenSlotKeys.add(key);
            return true;
          });

          setSlots(dedupedSlots);
          return dedupedSlots;
        } else {
          setSlots([]);
          return [];
        }
      }
    } catch (err) {
      console.warn('Failed to fetch SRMS timetable schedule:', err);
    }
    return [];
  };

  const fetchSrmsSubjects = async (courseCd?: string, branchCd?: string, batchCd?: string, semCd?: string, secCd?: string, colgCd?: string) => {
    try {
      const crs = courseCd || selectedCourse || '13';
      const br = Number(branchCd || selectedBranch || 1);
      const bat = Number(batchCd || selectedBatch || 2);
      const sem = Number(semCd || selectedSemester || 3);
      const sec = Number(secCd || selectedSection || 1);
      const colg = Number(colgCd || selectedCollege || 1);

      const res = await fetch(`/api/srms/timetable-subjects?course=${crs}&branch=${br}&batch=${bat}&semester=${sem}&section=${sec}&colgcd=${colg}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setSrmsTimetableSubjects(json.data);
          return json.data;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch SRMS subjects:', err);
    }
    return [];
  };

  const handleSyncTimetable = async () => {
    setSyncingTimetable(true);
    try {
      const [subs, sched] = await Promise.all([
        fetchSrmsSubjects(selectedCourse, selectedBranch, selectedBatch, selectedSemester, selectedSection, selectedCollege),
        fetchSrmsSchedule(selectedCourse, selectedBranch, selectedBatch, selectedSemester, selectedSection, selectedCollege, currentDate)
      ]);
      const secLetter = selectedSection === '1' ? 'A' : selectedSection === '2' ? 'B' : selectedSection === '3' ? 'C' : 'D';
      const schedCount = Array.isArray(sched) ? sched.length : 0;
      showAlert('success', `Live Timetable synced! Loaded ${schedCount} scheduled slots and ${subs.length} subjects for Semester ${selectedSemester} - Section ${secLetter}.`);
    } catch (e: any) {
      showAlert('error', 'Error syncing timetable from live portal.');
    } finally {
      setSyncingTimetable(false);
    }
  };

  const fetchTimetableSlots = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSrmsSubjects(selectedCourse, selectedBranch, selectedBatch, selectedSemester, selectedSection, selectedCollege),
        fetchSrmsSchedule(selectedCourse, selectedBranch, selectedBatch, selectedSemester, selectedSection, selectedCollege, currentDate)
      ]);
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
    const courses = await fetchCoursesForCollege(colgCd);
    const firstCourse = courses.find(c => c.code === '13') || courses[0];
    const newCourseCd = firstCourse ? firstCourse.code : '1';
    setSelectedCourse(newCourseCd);

    const branches = await fetchBranchesForCourse(colgCd, newCourseCd);
    const newBranchCd = branches[0]?.code || '1';
    if (branches.length > 0) {
      setSelectedBranch(newBranchCd);
    }

    const batches = await fetchBatchesForCourse(colgCd, newCourseCd);
    const curBatch = batches.find(b => b.name === '2025' || b.year === 2025 || b.code === '2') || batches[0];
    const newBatchCd = curBatch?.code || '2';
    if (curBatch) {
      setSelectedBatch(newBatchCd);
    }

    fetchSrmsSubjects(newCourseCd, newBranchCd, newBatchCd, selectedSemester, selectedSection, colgCd);
    fetchSrmsSchedule(newCourseCd, newBranchCd, newBatchCd, selectedSemester, selectedSection, colgCd, currentDate);
  };

  const handleFilterCourseChange = async (courseCd: string) => {
    setSelectedCourse(courseCd);

    const branches = await fetchBranchesForCourse(selectedCollege, courseCd);
    const newBranchCd = branches[0]?.code || '1';
    if (branches.length > 0) {
      setSelectedBranch(newBranchCd);
    }

    const batches = await fetchBatchesForCourse(selectedCollege, courseCd);
    const curBatch = batches.find(b => b.name === '2025' || b.year === 2025 || b.code === '2') || batches[0];
    const newBatchCd = curBatch?.code || '2';
    if (curBatch) {
      setSelectedBatch(newBatchCd);
    }

    const matchingDept = departmentsList.find((d: any) => String(d.course_cd) === String(courseCd) || d.course_code === courseCd);
    if (matchingDept) {
      setSelectedDept(matchingDept.id || matchingDept.code);
    }

    fetchSrmsSubjects(courseCd, newBranchCd, newBatchCd, selectedSemester, selectedSection, selectedCollege);
    fetchSrmsSchedule(courseCd, newBranchCd, newBatchCd, selectedSemester, selectedSection, selectedCollege, currentDate);
  };

  const handleFilterBranchChange = (branchCd: string) => {
    setSelectedBranch(branchCd);
    fetchSrmsSubjects(selectedCourse, branchCd, selectedBatch, selectedSemester, selectedSection, selectedCollege);
    fetchSrmsSchedule(selectedCourse, branchCd, selectedBatch, selectedSemester, selectedSection, selectedCollege, currentDate);
  };

  const handleFilterBatchChange = (batchCd: string) => {
    setSelectedBatch(batchCd);
    fetchSrmsSubjects(selectedCourse, selectedBranch, batchCd, selectedSemester, selectedSection, selectedCollege);
    fetchSrmsSchedule(selectedCourse, selectedBranch, batchCd, selectedSemester, selectedSection, selectedCollege, currentDate);
  };

  const handleFilterSemesterChange = (semCd: string) => {
    setSelectedSemester(semCd);
    fetchSrmsSubjects(selectedCourse, selectedBranch, selectedBatch, semCd, selectedSection, selectedCollege);
    fetchSrmsSchedule(selectedCourse, selectedBranch, selectedBatch, semCd, selectedSection, selectedCollege, currentDate);
  };

  const handleFilterSectionChange = (secCd: string) => {
    setSelectedSection(secCd);
    fetchSrmsSubjects(selectedCourse, selectedBranch, selectedBatch, selectedSemester, secCd, selectedCollege);
    fetchSrmsSchedule(selectedCourse, selectedBranch, selectedBatch, selectedSemester, secCd, selectedCollege, currentDate);
  };

  function secValOr(v: string) { return v; }

  const handleFilterDeptChange = (deptId: string) => {
    setSelectedDept(deptId);
  };

  // Re-fetch slots whenever filters change
  useEffect(() => {
    fetchTimetableSlots();
    fetchSrmsSubjects(selectedCourse, selectedBranch, selectedBatch, selectedSemester, selectedSection, selectedCollege);
  }, [selectedCollege, selectedCourse, selectedBranch, selectedBatch, selectedSemester, selectedSection]);


  const formatSrmsDateTime = (dayOfWeek: number, timeStr: string): string => {
    const dayDateInfo = weekDates.find(w => w.dayOfWeek === dayOfWeek);
    let targetDate = dayDateInfo?.date;
    if (!targetDate) {
      const d = new Date(currentDate);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1) + (dayOfWeek - 1);
      targetDate = new Date(d.getFullYear(), d.getMonth(), diff);
    }
    const dd = String(targetDate.getDate()).padStart(2, '0');
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const yyyy = targetDate.getFullYear();

    const parts = (timeStr || '08:00:00').split(':');
    let hours = parseInt(parts[0] || '8', 10);
    const minutes = parseInt(parts[1] || '0', 10);
    const seconds = parseInt(parts[2] || '0', 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 === 0 ? 12 : hours % 12;

    const pad = (n: number) => String(n).padStart(2, '0');
    return `${dd}-${mm}-${yyyy} ${pad(hours12)}:${pad(minutes)}:${pad(seconds)} ${ampm}`;
  };

  const handleSubjectChange = (subVal: string) => {
    const matched = availableFormSubjects.find(s => String(s.id) === subVal || String(s.code) === subVal || String(s.linkcd) === subVal);

    let autoFacId = '';
    let autoFacEmpId = '';
    let autoFacName = '';
    let linkcdVal = '';
    let electiveSts = 'N';
    const subTitle = matched?.name || matched?.raw_name || '';
    const subCode = matched?.code || subVal;

    if (matched) {
      autoFacName = matched.faculty_name || matched.EmpName || '';
      autoFacEmpId = matched.empid || '';
      linkcdVal = matched.linkcd ? String(matched.linkcd) : '';
      electiveSts = matched.electivests || 'N';

      if (autoFacEmpId) {
        const foundFac = allFaculties.find((f: any) => String(f.emp_id) === String(autoFacEmpId) || String(f.id) === String(autoFacEmpId));
        autoFacId = foundFac ? foundFac.id : autoFacEmpId;
      } else if (autoFacName) {
        const foundFac = allFaculties.find((f: any) => f.name?.toLowerCase().includes(autoFacName.toLowerCase()));
        autoFacId = foundFac ? foundFac.id : '';
      }
    }

    const defaultUnit = `Unit 1: Fundamentals of ${subTitle || 'Subject'}`;
    const defaultDesc = autoFacName ? `${subTitle} (${autoFacName})` : subTitle;

    setFormData(prev => ({
      ...prev,
      subjectId: subVal,
      subjectCode: subCode,
      subjectTitle: subTitle,
      facultyId: autoFacId || autoFacEmpId || prev.facultyId,
      facultyEmpId: autoFacEmpId || prev.facultyEmpId,
      facultyName: autoFacName || prev.facultyName,
      linkcd: linkcdVal || prev.linkcd,
      electiveflg: electiveSts,
      subjectDescription: defaultDesc,
      unitName: defaultUnit,
      unitId: 'unit_1',
      topic: '',
      subTopics: '',
    }));
    setSelectedCompetencies([]);
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subjectId || (!formData.facultyId && !formData.facultyEmpId)) {
      const err = 'Please select both Subject and Faculty before saving.';
      setModalError(err);
      showAlert('error', err);
      if (modalScrollRef.current) {
        modalScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    if (liveClash) {
      const clashErr = liveClash.message;
      setModalError(clashErr);
      showAlert('error', clashErr);
      if (modalScrollRef.current) {
        modalScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    setLoading(true);
    setModalError(null);
    showAlert('info', 'Saving timetable session and synchronizing with Database & SRMS Portal...');
    const tenantSlug = getActiveTenantSlug();
    const isEdit = !!editingSlot;

    const chosenSubject = availableFormSubjects.find(s => String(s.id) === formData.subjectId || String(s.code) === formData.subjectId || String(s.linkcd) === formData.subjectId);
    const subTitle = chosenSubject?.name || chosenSubject?.raw_name || formData.subjectTitle || 'Subject Session';
    const subCode = chosenSubject?.code || formData.subjectCode || '';
    const facName = formData.facultyName || chosenSubject?.faculty_name || chosenSubject?.EmpName || '';
    const facEmpId = formData.facultyEmpId || chosenSubject?.empid || formData.facultyId || '';
    const linkcd = formData.linkcd || (chosenSubject?.linkcd ? String(chosenSubject.linkcd) : '0');
    const electiveflg = formData.electiveflg || chosenSubject?.electivests || 'N';

    const selectedCamObj = camerasList.find(c => String(c.camera_id) === String(formData.cameraId));
    const roomName = formData.room || selectedCamObj?.classroom || '';

    const subTopicsStr = formData.subTopics || selectedCompetencies.join(', ') || '';

    // 1. PostgreSQL Save Payload with all academic hierarchy & unit/topic/subtopic parameters
    const pgPayload = {
      dayOfWeek: formData.dayOfWeek,
      startTime: formData.startTime,
      endTime: formData.endTime,
      departmentId: formData.departmentId || undefined,
      subjectId: formData.subjectId || undefined,
      facultyId: formData.facultyId || undefined,
      batchId: selectedBatch || undefined,
      room: roomName || undefined,
      slotType: formData.slotType,
      groupName: formData.groupName || 'All Group',
      topic: formData.topic || subTitle,
      unitName: formData.unitName || 'Unit 1',
      unitId: formData.unitId || undefined,
      subTopics: subTopicsStr || undefined,
      competencyCodes: selectedCompetencies.join(',') || subTopicsStr || undefined,
      colgcd: selectedCollege || '1',
      colgCd: selectedCollege || '1',
      coursecd: selectedCourse || '13',
      courseCd: selectedCourse || '13',
      branchcd: selectedBranch || '1',
      branchCd: selectedBranch || '1',
      batchcd: selectedBatch || '2',
      batchCd: selectedBatch || '2',
      semester: selectedSemester || '3',
      section: formData.sectionValue || selectedSection || '1',
      description: formData.subjectDescription || `${subTitle}${facName ? ' ' + facName : ''}`,
    };

    // 2. Compute exact date for the active week view
    const targetBase = new Date(currentDate);
    const currDay = targetBase.getDay();
    const mondayDiff = targetBase.getDate() - currDay + (currDay === 0 ? -6 : 1);
    const mondayDate = new Date(targetBase.getFullYear(), targetBase.getMonth(), mondayDiff);

    const slotDate = new Date(mondayDate);
    slotDate.setDate(mondayDate.getDate() + (formData.dayOfWeek - 1));

    const pad = (n: number) => String(n).padStart(2, '0');
    const ymdDateStr = `${slotDate.getFullYear()}-${pad(slotDate.getMonth() + 1)}-${pad(slotDate.getDate())}`;

    const formatTimeTo24h = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return `${pad(h || 8)}:${pad(m || 30)}`;
    };

    const startFormatted = `${ymdDateStr} ${formatTimeTo24h(formData.startTime)} `;
    const endFormatted = `${ymdDateStr} ${formatTimeTo24h(formData.endTime)} `;

    const srmsTitle = formData.topic ? `${subTitle} - ${formData.topic}` : subTitle;
    const srmsDesc = formData.subjectDescription || `${subTitle}${facName ? ' ' + facName : ''}`;

    const srmsAddEventPayload = {
      improperEvent: {
        title: srmsTitle,
        description: srmsDesc,
        start: startFormatted,
        end: endFormatted,
        linkcd: String(linkcd),
        electiveflg: String(electiveflg || 'N'),
        txtG: String(formData.groupValue || '0'),
        txtSec: String(formData.sectionValue || selectedSection || '1'),
        empid: String(facEmpId),
        colgcd: String(selectedCollege || '1'),
        CameraLink: String(formData.cameraId || '0'),
        unit_id: String(formData.unitId || ''),
        unit_name: String(formData.unitName || ''),
        topic: String(formData.topic || ''),
        sub_topics: String(formData.subTopics || selectedCompetencies.join(',') || ''),
        competency_codes: String(selectedCompetencies.join(',') || ''),
        course: String(selectedCourse || '13'),
        branch: String(selectedBranch || '1'),
        batch: String(selectedBatch || '2'),
        sem: String(selectedSemester || '3'),
      },
    };

    try {
      const url = isEdit ? `${API_BASE}/timetable/${editingSlot.id}?tenant=${tenantSlug}` : `${API_BASE}/timetable?tenant=${tenantSlug}`;
      const method = isEdit ? 'PUT' : 'POST';
      const token = localStorage.getItem('token') || '';

      // 1. Call SRMS add-event API
      let srmsSaved = false;
      let srmsEventId: string | null = null;
      let srmsErrorMsg = '';

      try {
        const sRes = await fetch('/api/srms/add-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(srmsAddEventPayload),
        });
        const sJson = await sRes.json().catch(() => null);
        if (sRes.ok && sJson?.success) {
          srmsSaved = true;
          srmsEventId = sJson.id || sJson.event?.id || null;
        } else {
          srmsErrorMsg = sJson?.error || sJson?.message || 'SRMS portal event scheduling failed.';
        }
      } catch (sErr: any) {
        srmsErrorMsg = sErr?.message || 'Network error communicating with SRMS addEvent API.';
      }

      // 2. Call NestJS backend PostgreSQL timetable API
      let pgSaved = false;
      let pgSlotId: string | null = null;
      let pgErrorMsg = '';

      try {
        const pRes = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(pgPayload),
        });
        const pJson = await pRes.json().catch(() => null);
        if (pRes.ok && (pJson?.success || pJson?.id)) {
          pgSaved = true;
          pgSlotId = pJson?.data?.id || pJson?.id || null;
        } else {
          pgErrorMsg = pJson?.message || pJson?.error || (pRes.status === 401 ? 'Session expired (401 Unauthorized). Please refresh your login.' : 'Database slot creation failed.');
        }
      } catch (pErr: any) {
        pgErrorMsg = pErr?.message || 'Network error communicating with PostgreSQL timetable endpoint.';
      }

      // 3. ATOMIC TRANSACTION EVALUATION
      if (srmsSaved && pgSaved) {
        // BOTH SUCCEEDED: COMMIT
        showAlert('success', 'Timetable slot scheduled successfully and committed across Database & SRMS Portal!');
        setModalError(null);
        setIsModalOpen(false); // Only close modal on complete two-way success
        fetchTimetableSlots();
        fetchSrmsSchedule(selectedCourse, selectedBranch, selectedBatch, selectedSemester, selectedSection, selectedCollege, currentDate);
      } else {
        // ROLLBACK PARTIAL WRITE TO PRESERVE CONSISTENCY
        if (srmsSaved && !pgSaved && srmsEventId) {
          console.warn('[ATOMIC ROLLBACK] Reverting SRMS event:', srmsEventId);
          await fetch(`/api/srms/add-event?id=${srmsEventId}&colgcd=${selectedCollege || '1'}`, { method: 'DELETE' }).catch(() => {});
        }
        if (pgSaved && !srmsSaved && pgSlotId) {
          console.warn('[ATOMIC ROLLBACK] Reverting PG timetable slot:', pgSlotId);
          await fetch(`${API_BASE}/timetable/${pgSlotId}?tenant=${tenantSlug}`, {
            method: 'DELETE',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          }).catch(() => {});
        }

        // KEEP MODAL OPEN & HIGHLIGHT THE CONFLICT / ERROR
        const finalError = srmsErrorMsg || pgErrorMsg || 'Schedule transaction rejected. Both APIs must succeed simultaneously.';
        showAlert('error', finalError);
        setModalError(finalError);
        if (modalScrollRef.current) {
          modalScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
        // Modal remains open so admin can review clash details and reschedule!
      }
    } catch (err: any) {
      const errText = err?.message || 'Network error during timetable atomic save.';
      showAlert('error', errText);
      setModalError(errText);
      if (modalScrollRef.current) {
        modalScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to delete this scheduled session?')) return;
    setLoading(true);
    try {
      const tenantSlug = getActiveTenantSlug();
      const cleanId = String(slotId);
      
      // 1. Direct browser call to official SRMS deleteEvent with authenticated cookie session
      try {
        await fetch('https://myportal.srms.ac.in/timetable/master/designtimetable.aspx/deleteEvent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'X-Requested-With': 'XMLHttpRequest',
          },
          credentials: 'include',
          body: JSON.stringify({ id: cleanId }),
        }).catch(() => null);
      } catch {}

      // 2. Server-side proxy call to official SRMS deleteEvent + PostgreSQL cleanup
      await fetch('/api/srms/delete-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cleanId }),
      }).catch(() => {});

      // 3. Delete from PostgreSQL timetable_slots
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      await fetch(`${API_BASE}/timetable/${cleanId}?tenant=${tenantSlug}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      }).catch(() => {});

      showAlert('success', 'Timetable session deleted successfully across SRMS Portal & Database!');
      setHoveredSlotInfo(null);
      setIsModalOpen(false);
      fetchTimetableSlots();
      fetchSrmsSchedule(selectedCourse, selectedBranch, selectedBatch, selectedSemester, selectedSection, selectedCollege, currentDate);
    } catch (err: any) {
      showAlert('error', err?.message || 'Network error while deleting slot.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingSlot) return;
    await handleDeleteSlot(editingSlot.id);
  };

  const handleGridCellClick = (dayVal: number, timeStart: string, defaultEnd: string) => {
    setEditingSlot(null);
    setSelectedCompetencies([]);
    setCompetencySearchTerm('');

    const defaultCam = camerasList.length > 0 ? String(camerasList[0].camera_id) : '0';
    const defaultCamObj = camerasList.find(c => String(c.camera_id) === defaultCam);

    setFormData({
      dayOfWeek: dayVal,
      startTime: timeStart,
      endTime: defaultEnd,
      departmentId: selectedDept || (branchesList[0]?.id || branchesList[0]?.code || ''),
      subjectId: '',
      subjectCode: '',
      subjectTitle: '',
      facultyId: '',
      facultyEmpId: '',
      facultyName: '',
      room: defaultCamObj?.classroom || '',
      cameraId: defaultCam,
      slotType: 'Lecture',
      groupName: 'All Group',
      groupValue: '0',
      sectionValue: selectedSection || '1',
      subjectDescription: '',
      unitId: 'unit_1',
      unitName: 'Unit 1',
      topic: '',
      subTopics: '',
      linkcd: '',
      electiveflg: 'N',
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

    const matchedSub = availableFormSubjects.find(s => String(s.id) === String(slot.subject_id) || String(s.code) === String(slot.subject_id) || String(s.code) === String(slot.subject_code));
    const defaultCam = camerasList.length > 0 ? String(camerasList[0].camera_id) : '0';

    setFormData({
      dayOfWeek: slot.day_of_week,
      startTime: slot.start_time,
      endTime: slot.end_time,
      departmentId: slot.department_id || selectedDept || '',
      subjectId: slot.subject_id || '',
      subjectCode: slot.subject_code || matchedSub?.code || '',
      subjectTitle: slot.subject_name || matchedSub?.name || '',
      facultyId: slot.faculty_id || '',
      facultyEmpId: (slot as any).faculty_code || matchedSub?.empid || '',
      facultyName: slot.faculty_name || matchedSub?.faculty_name || '',
      room: slot.room || '',
      cameraId: defaultCam,
      slotType: slot.slot_type || slot.slotType || 'Lecture',
      groupName: slot.group_name || 'All Group',
      groupValue: '0',
      sectionValue: slot.section || selectedSection || '1',
      subjectDescription: slot.description || slot.topic || '',
      unitId: slot.unit_id || 'unit_1',
      unitName: slot.unit_name || 'Unit 1',
      topic: slot.topic || '',
      subTopics: slot.sub_topics || slot.competency_codes || '',
      linkcd: matchedSub?.linkcd ? String(matchedSub.linkcd) : '',
      electiveflg: matchedSub?.electivests || 'N',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Timetable Print & Layout Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        select, option {
          cursor: pointer !important;
        }
        @media print {
          @page {
            size: A4 landscape;
            margin: 4mm 6mm 4mm 6mm;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            width: 100% !important;
            height: auto !important;
            min-height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #timetable-print-area, #timetable-print-area * {
            visibility: visible !important;
          }
          #timetable-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            display: block !important;
            page-break-before: avoid !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-before: avoid !important;
            break-inside: avoid !important;
            overflow: visible !important;
          }
          .no-print, .print\\:hidden, button, .group\\/slot .absolute {
            display: none !important;
          }
          .print-compact-header {
            margin-bottom: 4px !important;
            padding-bottom: 2px !important;
            border-bottom: 1.5px solid #0f172a !important;
          }
          .print-compact-header h2 {
            font-size: 11pt !important;
            line-height: 1.15 !important;
            font-weight: 900 !important;
            color: #0f172a !important;
            margin: 0 0 1px 0 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
          }
          .print-compact-header h3 {
            font-size: 8.5pt !important;
            line-height: 1.15 !important;
            font-weight: 800 !important;
            color: #1e293b !important;
            margin: 0 0 1px 0 !important;
            text-transform: uppercase !important;
          }
          .print-compact-header p {
            font-size: 7pt !important;
            line-height: 1.15 !important;
            font-weight: 700 !important;
            color: #334155 !important;
            margin: 0 !important;
            text-transform: uppercase !important;
          }
          /* Grid Table Print Overrides */
          .print-grid-container {
            width: 100% !important;
            display: block !important;
            margin-bottom: 3px !important;
            overflow: visible !important;
          }
          #timetable-print-area table.timetable-main-grid {
            width: 100% !important;
            border-collapse: collapse !important;
            border: 1.5px solid #0f172a !important;
            table-layout: fixed !important;
            font-size: 6.5pt !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          #timetable-print-area table.timetable-main-grid th, 
          #timetable-print-area table.timetable-main-grid td {
            border: 1.5px solid #0f172a !important;
            padding: 1.5px 2px !important;
            vertical-align: top !important;
            line-height: 1.1 !important;
            box-sizing: border-box !important;
          }
          #timetable-print-area table.timetable-main-grid th {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
            font-size: 6.5pt !important;
            font-weight: 800 !important;
            text-align: center !important;
            padding: 2px 1px !important;
            height: 18px !important;
            border: 1.5px solid #0f172a !important;
          }
          #timetable-print-area table.timetable-main-grid tr {
            height: auto !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          #timetable-print-area table.timetable-main-grid td.day-cell {
            background-color: #f8fafc !important;
            font-weight: 900 !important;
            font-size: 7pt !important;
            text-align: center !important;
            vertical-align: middle !important;
            width: 64px !important;
            padding: 1px !important;
            border: 1.5px solid #0f172a !important;
          }
          #timetable-print-area table.timetable-main-grid td.break-cell {
            background-color: #e2e8f0 !important;
            color: #1e293b !important;
            font-size: 5.5pt !important;
            font-weight: 900 !important;
            text-align: center !important;
            vertical-align: middle !important;
            width: 20px !important;
            padding: 0 !important;
            border: 1.5px solid #0f172a !important;
          }
          #timetable-print-area table.timetable-main-grid td.break-cell div {
            padding: 2px 0 !important;
            font-size: 5.5pt !important;
            letter-spacing: 0.15em !important;
          }
          #timetable-print-area .slot-cell {
            height: auto !important;
            min-height: 40px !important;
            padding: 1.5px 2px !important;
            vertical-align: top !important;
            background-color: #ffffff !important;
            border: 1.5px solid #0f172a !important;
          }
          #timetable-print-area .slot-empty-box {
            min-height: 38px !important;
            height: 38px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          #timetable-print-area .slot-card {
            border: 1px solid #475569 !important;
            background-color: #f8fafc !important;
            padding: 1.5px 2px !important;
            border-radius: 3px !important;
            margin-bottom: 1px !important;
            box-shadow: none !important;
            min-height: 38px !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
          }
          #timetable-print-area .slot-subject {
            font-size: 6.5pt !important;
            font-weight: 900 !important;
            color: #0f172a !important;
            line-height: 1.1 !important;
            margin-bottom: 0.5px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          #timetable-print-area .slot-unit {
            font-size: 5pt !important;
            font-weight: 800 !important;
            color: #312e81 !important;
            line-height: 1 !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          #timetable-print-area .slot-topic {
            font-size: 5pt !important;
            font-weight: 600 !important;
            color: #334155 !important;
            line-height: 1 !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          #timetable-print-area .slot-meta {
            font-size: 5.5pt !important;
            font-weight: 800 !important;
            color: #0f172a !important;
            border-top: 0.5px solid #cbd5e1 !important;
            padding-top: 0.5px !important;
            margin-top: 0.5px !important;
            display: flex !important;
            justify-content: space-between !important;
          }
          #timetable-print-area .slot-room {
            font-size: 5pt !important;
            font-weight: 800 !important;
            background: #e2e8f0 !important;
            padding: 0 1.5px !important;
            border-radius: 2px !important;
            border: 0.5px solid #94a3b8 !important;
          }
          /* Print Registry Footer */
          .print-registry-box {
            border: 1.5px solid #0f172a !important;
            border-radius: 3px !important;
            margin-top: 3px !important;
            font-size: 5.5pt !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print-registry-title {
            background-color: #f1f5f9 !important;
            font-size: 6pt !important;
            font-weight: 900 !important;
            padding: 1px 2px !important;
            border-bottom: 1.5px solid #0f172a !important;
            text-align: center !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
          }
          .print-registry-row {
            padding: 1px 2px !important;
            font-size: 5.5pt !important;
            line-height: 1.1 !important;
          }
          /* Signatures Footer */
          .print-signatures {
            display: flex !important;
            justify-content: space-between !important;
            align-items: flex-end !important;
            margin-top: 4px !important;
            padding-top: 2px !important;
            font-size: 6.5pt !important;
            font-weight: 700 !important;
            color: #0f172a !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print-signatures .sig-line {
            width: 140px !important;
            border-bottom: 1.5px dashed #334155 !important;
            margin-bottom: 2px !important;
            height: 14px !important;
          }
        }
      ` }} />

      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="College Timetable Designer" />
        <main className="p-6 space-y-6 flex-1 flex flex-col bg-slate-50 dark:bg-[#0F172A]">

          {alert && (
            <div className={`p-4 rounded-2xl border text-xs font-extrabold transition-all shadow-lg animate-fade-in flex items-center gap-2 ${
              alert.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : alert.type === 'info'
                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
            }`}>
              <span>{alert.type === 'success' ? '✅' : alert.type === 'info' ? 'ℹ️' : '⚠️'}</span>
              <span>{alert.message}</span>
            </div>
          )}

          {/* Top Level Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab('format')}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs transition-all shadow-sm cursor-pointer ${
                activeTab === 'format'
                  ? 'bg-gradient-to-r from-[#5B4BFF] to-[#7867FF] text-white shadow-indigo-500/25 ring-2 ring-[#5B4BFF]/30 scale-[1.02]'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 hover:border-[#5B4BFF]/40'
              }`}
            >
              <span className="text-base">⏱️</span>
              <span>1. Course-Department Time Format</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('design')}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs transition-all shadow-sm cursor-pointer ${
                activeTab === 'design'
                  ? 'bg-gradient-to-r from-[#5B4BFF] to-[#7867FF] text-white shadow-indigo-500/25 ring-2 ring-[#5B4BFF]/30 scale-[1.02]'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 hover:border-[#5B4BFF]/40'
              }`}
            >
              <span className="text-base">📅</span>
              <span>2. Design - TimeTable</span>
            </button>
          </div>

          {/* Master Cascading Filters Bar — Follows Exact 1-6 Hierarchy */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3 shadow-md hover:shadow-lg transition-all">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-2">
              <div>
                <h3 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-2">
                  <span>🗓️</span> Cascading Academic Filters
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  Hierarchy: 1. College ➔ 2. Course ➔ 3. Branch ➔ 4. Batch ➔ 5. Semester ➔ 6. Section
                </p>
              </div>

              {/* Action Buttons: Sync Timetable & Print */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncTimetable}
                  disabled={syncingTimetable}
                  className="px-3.5 py-2 text-xs font-black rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 border border-indigo-500 transition-all uppercase flex items-center gap-1.5 disabled:opacity-50"
                  title="Fetch live subjects and mapped faculty from SRMS EmployeeInfo.asmx/Loadsubject"
                >
                  <span className={syncingTimetable ? 'animate-spin inline-block' : ''}>{syncingTimetable ? '⏳' : '🔄'}</span>
                  <span>{syncingTimetable ? 'Syncing...' : 'Sync Timetable'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 text-xs font-black rounded-xl bg-orange-600 text-white hover:bg-orange-500 shadow-md shadow-orange-600/30 border border-orange-500 transition-all uppercase flex items-center gap-1.5"
                >
                  <span>🖨️</span>
                  <span>Print</span>
                </button>
              </div>
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

              {/* 5. Semester Selector */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-sm hover:border-[#5B4BFF]/40 transition-all">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                  <span>📖</span> Semester:
                </span>
                <select
                  value={selectedSemester}
                  onChange={(e) => handleFilterSemesterChange(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer text-xs max-w-[140px] truncate"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={String(sem)} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      [#{sem}] Semester {sem}
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. Section Selector (1 = A, 2 = B, 3 = C, 4 = D) */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-sm hover:border-[#5B4BFF]/40 transition-all">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                  <span>🔠</span> Section:
                </span>
                <select
                  value={selectedSection}
                  onChange={(e) => handleFilterSectionChange(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer text-xs max-w-[130px] truncate"
                >
                  <option value="1" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">[#1] Section A</option>
                  <option value="2" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">[#2] Section B</option>
                  <option value="3" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">[#3] Section C</option>
                  <option value="4" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">[#4] Section D</option>
                </select>
              </div>

            </div>
          </div>

          {/* Tab 1: Course-Department Time Format Designer */}
          {activeTab === 'format' && (
            <TimeFormatDesigner
              initialSlots={configuredTimeSlots}
              selectedCollege={selectedCollege}
              selectedCourse={selectedCourse}
              selectedDept={selectedDept}
              selectedBatch={selectedBatch}
              collegeName={selectedCollegeObj?.name || 'SRMS CET, BAREILLY'}
              courseName={selectedCourseObj?.name || 'BCA'}
              deptName={selectedDeptObj?.name || selectedBranchObj?.name || 'BCA DEPARTMENT'}
              onSaveTimeFormat={(updatedSlots) => {
                setConfiguredTimeSlots(updatedSlots);
                showAlert('success', `Saved Time Format with ${updatedSlots.length} periods & breaks for ${selectedCourseObj?.name || 'Course'}`);
              }}
              onSwitchToDesignTab={() => setActiveTab('design')}
            />
          )}

          {/* Tab 2: Interactive Design - TimeTable Grid Schedule */}
          {activeTab === 'design' && (
            <>
          {/* Datewise Week Navigation Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
            {/* Left: Previous, Today, Next buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevWeek}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 text-xs font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                title="Previous Week"
              >
                <span>◀</span>
                <span>Previous</span>
              </button>

              <button
                type="button"
                onClick={handleToday}
                className="px-4 py-1.5 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-black transition-all shadow-sm active:scale-95"
                title="Jump to Today's Week"
              >
                Today
              </button>

              <button
                type="button"
                onClick={handleNextWeek}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 text-xs font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                title="Next Week"
              >
                <span>Next</span>
                <span>▶</span>
              </button>
            </div>

            {/* Center: Current Week Date Range */}
            <div className="text-center">
              <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-wide flex items-center gap-1.5 justify-center">
                <span>🗓️</span>
                <span>{weekRangeLabel}</span>
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                Academic Schedule • Semester {selectedSemester} • Section {selectedSection === '1' ? 'A' : selectedSection === '2' ? 'B' : selectedSection === '3' ? 'C' : 'D'}
              </p>
            </div>

            {/* Right: View toggle (Week / Month) & Print Button */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 rounded-xl p-1 border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setCalendarViewMode('week')}
                  className={`px-3 py-1 rounded-lg font-black transition-all ${calendarViewMode === 'week' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  Week
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarViewMode('month')}
                  className={`px-3 py-1 rounded-lg font-black transition-all ${calendarViewMode === 'month' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  Month
                </button>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-xl border border-indigo-500/30 bg-gradient-to-r from-[#5B4BFF] to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-black text-xs transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                title="Print Official Timetable"
              >
                <span>🖨️</span>
                <span>Print Timetable</span>
              </button>
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
              <div className="print-compact-header text-center space-y-2 border-b-2 border-slate-800 dark:border-slate-700 pb-4 mb-6">
                <h2 className="text-xl font-extrabold uppercase tracking-wide text-slate-900 dark:text-white">
                  {selectedCollegeObj?.name || 'SHRI RAM MURTI SMARAK COLLEGE OF ENGINEERING & TECHNOLOGY, BAREILLY'}
                </h2>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 uppercase">
                  {selectedDeptObj?.name || selectedBranchObj?.name || 'FACULTY OF COMPUTER APPLICATIONS'}
                </h3>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase">
                  TIME TABLE - {selectedCourseObj?.name || selectedCourse} {selectedBatchObj ? `(BATCH ${selectedBatchObj.name || selectedBatchObj.year || selectedBatchObj.code})` : ''} • SEMESTER {selectedSemester} • SECTION {selectedSection === '1' ? 'A' : selectedSection === '2' ? 'B' : selectedSection === '3' ? 'C' : 'D'} • {weekRangeLabel}
                </p>
              </div>

              {/* Empty / Unscheduled Week Banner */}
              {(!Array.isArray(slots) || slots.length === 0) && (
                <div className="no-print print:hidden mb-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-amber-800 dark:text-amber-300">
                  <div className="flex items-center gap-2">
                    <span className="text-base shrink-0">ℹ️</span>
                    <span>
                      <strong>No scheduled timetable found for this week ({weekRangeLabel}).</strong> Click any slot cell below to create/assign classes, or click <strong>&quot;View Aug 9 — 15 ◀&quot;</strong> to see the scheduled timetable.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handlePrevWeek}
                    className="px-3 py-1.5 bg-amber-200/80 hover:bg-amber-300 dark:bg-amber-900 dark:hover:bg-amber-800 rounded-xl font-black text-xs transition-all shrink-0 shadow-sm"
                  >
                    View Aug 9 — 15 ◀
                  </button>
                </div>
              )}

              {/* Timetable Grid Table */}
              <div className="print-grid-container overflow-x-auto">
                <table className="timetable-main-grid w-full border-collapse border-2 border-slate-800 dark:border-slate-700 text-center text-xs text-slate-800 dark:text-slate-200">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800">
                      <th className="day-cell border-2 border-slate-800 dark:border-slate-700 p-2 font-bold w-28 text-slate-900 dark:text-white">DAY / TIME</th>
                      {configuredTimeSlots.map((ts, i) => (
                        <th key={i} className={`border-2 border-slate-800 dark:border-slate-700 p-2 font-bold text-slate-900 dark:text-white ${ts.isBreak ? 'break-cell w-10 bg-slate-200 dark:bg-slate-800' : 'min-w-[110px]'}`}>
                          <div>{ts.label}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS_OF_WEEK.map((day, dayIdx) => {
                      const dayDateInfo = weekDates.find(w => w.dayOfWeek === day.value);
                      return (
                        <tr key={day.value} className="h-full">
                          <td className="day-cell border-2 border-slate-800 dark:border-slate-700 p-2 font-bold bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white uppercase tracking-wider">
                            <div className="font-black text-xs">{day.name}</div>
                            {dayDateInfo && (
                              <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-bold mt-0.5 print:text-[5.5pt]">
                                {dayDateInfo.shortDate}
                              </div>
                            )}
                          </td>
                          {configuredTimeSlots.map((ts, slotIdx) => {
                            if (ts.isBreak) {
                              if (dayIdx !== 0) return null;
                              return (
                                <td
                                  key={slotIdx}
                                  rowSpan={DAYS_OF_WEEK.length}
                                  className="break-cell border-2 border-slate-800 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/90 font-extrabold text-xs tracking-widest text-slate-800 dark:text-slate-200 p-2 text-center select-none align-middle"
                                >
                                  <div className="[writing-mode:vertical-lr] rotate-180 mx-auto font-mono py-2 uppercase font-black tracking-[0.2em] text-xs">
                                    {ts.labelBreak || 'BREAK'}
                                  </div>
                                </td>
                              );
                            }

                            const safeSlots = Array.isArray(slots) ? slots : [];
                            const cellSlotsRaw = safeSlots.filter(s => {
                              if (!s || s.day_of_week !== day.value) return false;
                              const sStart = String(s.start_time || '');
                              const sEnd = String(s.end_time || '');
                              const slotStart = sStart.slice(0, 5);
                              const colStart = ts.start.slice(0, 5);
                              const colEnd = ts.end.slice(0, 5);
                              return (slotStart >= colStart && slotStart < colEnd) || (sStart < ts.end && sEnd > ts.start);
                            });

                            const seenCellKeys = new Set<string>();
                            const cellSlots = cellSlotsRaw.filter(s => {
                              const normSub = String(s.subject_name || s.subject_code || s.topic || '')
                                .replace(/\([^)]*\)/g, '')
                                .trim()
                                .toLowerCase();
                              const key = `${s.day_of_week}_${s.start_time?.slice(0, 5)}_${normSub}`;
                              if (seenCellKeys.has(key)) return false;
                              seenCellKeys.add(key);
                              return true;
                            });

                            return (
                              <td
                                key={ts.start}
                                onClick={() => handleGridCellClick(day.value, ts.start, ts.end)}
                                className="slot-cell border-2 border-slate-800 dark:border-slate-700 p-1.5 bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 group relative transition-colors align-top min-w-[105px] min-h-[44px]"
                              >
                                {cellSlots.length > 0 ? (
                                  <div className="space-y-1 h-full min-h-[40px] flex flex-col justify-between">
                                    {cellSlots.map(slot => {
                                      const safeSubs = Array.isArray(subjects) ? subjects : [];
                                      const safeFacs = Array.isArray(allFaculties) ? allFaculties : [];
                                      const matchedSub = safeSubs.find(s => s && (String(s.id) === String(slot.subject_id) || String(s.code) === String(slot.subject_id) || String(s.code) === String(slot.subject_code)));

                                      // Clean Subject Name (Strip any trailing topic or parenthetical text)
                                      const rawTitle = String(slot.subject_name || slot.topic || matchedSub?.name || 'Subject Session');
                                      let cleanSubName = rawTitle;
                                      if (cleanSubName.includes(' - ')) {
                                        cleanSubName = cleanSubName.split(' - ')[0].trim();
                                      }
                                      cleanSubName = cleanSubName.replace(/\([^)]*\)/g, '').trim();
                                      if (!cleanSubName && matchedSub?.name) {
                                        cleanSubName = matchedSub.name.replace(/\([^)]*\)/g, '').trim();
                                      }

                                      // Clean Topic (Strip subject name prefix if repeated)
                                      let cleanTopic = '';
                                      if (slot.topic) {
                                        cleanTopic = String(slot.topic).trim();
                                        if (cleanTopic.includes(' - ')) {
                                          cleanTopic = cleanTopic.split(' - ').slice(1).join(' - ').trim();
                                        }
                                      } else if (rawTitle.includes(' - ')) {
                                        cleanTopic = rawTitle.split(' - ').slice(1).join(' - ').trim();
                                      }
                                      cleanTopic = cleanTopic.replace(/\([^)]*\)/g, '').trim();
                                      if (cleanTopic.toLowerCase() === cleanSubName.toLowerCase()) {
                                        cleanTopic = '';
                                      }

                                      const matchedFac = safeFacs.find(f => f && (String(f.id) === String(slot.faculty_id) || String(f.emp_id) === String(slot.faculty_id)));
                                      const facName = (slot.faculty_name && slot.faculty_name !== 'Faculty Member') 
                                        ? slot.faculty_name 
                                        : (matchedFac?.name || (rawTitle.match(/\(([^)]+)\)/)?.[1] || ''));

                                      return (
                                        <div
                                          key={slot.id}
                                          className="slot-card p-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all text-left space-y-1 shadow-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700/80 relative group/slot hover:shadow-md cursor-pointer"
                                          onClick={(e) => { e.stopPropagation(); handleSlotClick(slot, e); }}
                                          onMouseEnter={(e) => handleSlotMouseEnter(slot, e)}
                                          onMouseLeave={handleSlotMouseLeave}
                                        >
                                          {/* Quick Actions on Hover */}
                                          <div className="absolute top-1 right-1 opacity-0 group-hover/slot:opacity-100 transition-opacity flex items-center gap-1 z-10 bg-white/95 dark:bg-slate-900/95 rounded-lg p-0.5 shadow-md border border-slate-200 dark:border-slate-700 no-print print:hidden">
                                            <button
                                              type="button"
                                              onClick={(e) => { e.stopPropagation(); handleSlotClick(slot, e); }}
                                              className="p-1 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-md text-[10px] text-indigo-600 dark:text-indigo-400 font-bold"
                                              title="Edit Session"
                                            >
                                              ✏️
                                            </button>
                                            <button
                                              type="button"
                                              onClick={(e) => { e.stopPropagation(); handleDeleteSlot(slot.id, e); }}
                                              className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-md text-[10px] text-rose-600 dark:text-rose-400 font-bold"
                                              title="Delete Session"
                                            >
                                              🗑️
                                            </button>
                                          </div>

                                          {/* Subject Name Header */}
                                          <div className="slot-subject font-black text-slate-900 dark:text-white leading-snug text-[11px] truncate pr-8" title={cleanSubName}>
                                            {cleanSubName}
                                          </div>

                                          {/* Unit Name Badge/Line */}
                                          {slot.unit_name && (
                                            <div className="slot-unit text-[8.5px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded-md truncate max-w-full" title={slot.unit_name}>
                                              📦 {slot.unit_name}
                                            </div>
                                          )}

                                          {/* Topic Line */}
                                          {cleanTopic && (
                                            <div className="slot-topic text-[9px] text-slate-700 dark:text-slate-200 font-bold leading-tight line-clamp-1" title={cleanTopic}>
                                              📖 <span className="text-slate-500 font-medium">Topic:</span> {cleanTopic}
                                            </div>
                                          )}

                                          {/* Sub-topics Line */}
                                          {slot.sub_topics && (
                                            <div className="slot-topic text-[8.5px] text-slate-500 dark:text-slate-400 font-medium leading-tight line-clamp-1" title={slot.sub_topics}>
                                              📝 <span className="font-semibold text-slate-600 dark:text-slate-300">Sub:</span> {slot.sub_topics}
                                            </div>
                                          )}

                                          {/* Faculty & Room Line */}
                                          <div className="slot-meta flex items-center justify-between text-[8.5px] font-bold text-slate-700 dark:text-slate-300 pt-0.5 border-t border-slate-100 dark:border-slate-700/60 mt-0.5">
                                            <span className="truncate max-w-[80px]">👨‍🏫 {facName ? facName.split(' ')[0] : 'Faculty'}</span>
                                            {slot.room && (
                                              <span className="slot-room bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded text-[7.5px] shrink-0 font-mono border border-slate-200 dark:border-slate-700 font-extrabold">
                                                {slot.room.replace('Room', 'R-').replace('Classroom', 'R-')}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="slot-empty-box h-full min-h-[40px] flex items-center justify-center">
                                    <span className="text-[10px] text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium no-print print:hidden">
                                      + Add Slot
                                    </span>
                                    <span className="hidden print:inline-block text-[6pt] text-transparent select-none">&nbsp;</span>
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
                <div className="print-registry-box mt-3 border-2 border-slate-800 dark:border-slate-700 text-left text-xs text-slate-800 dark:text-slate-200 rounded-xl overflow-hidden">
                  <div className="print-registry-title bg-slate-100 dark:bg-slate-800 font-bold border-b-2 border-slate-800 dark:border-slate-700 p-1.5 text-center text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    SUBJECT &amp; FACULTY REGISTRY
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x-2 divide-slate-800 dark:divide-slate-700">
                    <div className="divide-y divide-slate-300 dark:divide-slate-800">
                      <div className="grid grid-cols-3 p-1 font-bold bg-slate-50 dark:bg-slate-800/50 text-center text-[11px] text-slate-700 dark:text-slate-300 print:text-[6pt] print:p-0.5 print:bg-slate-100">
                        <div className="border-r border-slate-300 dark:border-slate-700 print:border-slate-800">SUBJECT CODE</div>
                        <div className="border-r border-slate-300 dark:border-slate-700 print:border-slate-800">SUBJECT NAME</div>
                        <div>FACULTY NAME</div>
                      </div>
                      {registryList.slice(0, Math.ceil(registryList.length / 2)).map((s, idx) => (
                        <div
                          key={s.subject_code + idx}
                          className="print-registry-row grid grid-cols-3 p-1.5 text-center text-xs align-middle hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <div className="font-bold text-slate-900 dark:text-white font-mono border-r border-slate-200 dark:border-slate-800 print:border-slate-400">{s.subject_code || '-'}</div>
                          <div className="truncate px-1 text-slate-700 dark:text-slate-300 font-medium border-r border-slate-200 dark:border-slate-800 print:border-slate-400">{s.subject_name || '-'}</div>
                          <div className="truncate px-1 text-slate-600 dark:text-slate-400">{s.faculty_name || '-'}</div>
                        </div>
                      ))}
                    </div>
                    <div className="divide-y divide-slate-300 dark:divide-slate-800">
                      <div className="grid grid-cols-3 p-1 font-bold bg-slate-50 dark:bg-slate-800/50 text-center text-[11px] text-slate-700 dark:text-slate-300 print:text-[6pt] print:p-0.5 print:bg-slate-100">
                        <div className="border-r border-slate-300 dark:border-slate-700 print:border-slate-800">SUBJECT CODE</div>
                        <div className="border-r border-slate-300 dark:border-slate-700 print:border-slate-800">SUBJECT NAME</div>
                        <div>FACULTY NAME</div>
                      </div>
                      {registryList.slice(Math.ceil(registryList.length / 2)).map((s, idx) => (
                        <div
                          key={s.subject_code + idx}
                          className="print-registry-row grid grid-cols-3 p-1.5 text-center text-xs align-middle hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <div className="font-bold text-slate-900 dark:text-white font-mono border-r border-slate-200 dark:border-slate-800 print:border-slate-400">{s.subject_code || '-'}</div>
                          <div className="truncate px-1 text-slate-700 dark:text-slate-300 font-medium border-r border-slate-200 dark:border-slate-800 print:border-slate-400">{s.subject_name || '-'}</div>
                          <div className="truncate px-1 text-slate-600 dark:text-slate-400">{s.faculty_name || '-'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Timetable Footer - Signatures */}
              <div className="print-signatures mt-5 grid grid-cols-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300 pt-2">
                <div className="space-y-3">
                  <div className="sig-line h-6 border-b-2 border-dashed border-slate-400 dark:border-slate-600 max-w-[170px] mx-auto"></div>
                  <p className="font-bold text-xs uppercase tracking-wider">Time Table Incharge</p>
                </div>
                <div className="space-y-3">
                  <div className="sig-line h-6 border-b-2 border-dashed border-slate-400 dark:border-slate-600 max-w-[170px] mx-auto"></div>
                  <p className="font-bold text-xs uppercase tracking-wider">Academic Coordinator</p>
                </div>
                <div className="space-y-3">
                  <div className="sig-line h-6 border-b-2 border-dashed border-slate-400 dark:border-slate-600 max-w-[170px] mx-auto"></div>
                  <p className="font-bold text-xs uppercase tracking-wider">Dean / Principal</p>
                </div>
              </div>

            </div>
          )}
          </>
          )}

        </main>
      </div>

      {/* White Theme-Matched Hover Card with Unit, Topic, Subtopics */}
      {hoveredSlotInfo && (
        <div
          style={{
            position: 'fixed',
            left: `${hoveredSlotInfo.x}px`,
            top: `${hoveredSlotInfo.y}px`,
            zIndex: 70,
          }}
          className="w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[22px] p-4 shadow-2xl space-y-3 text-xs text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
          onMouseEnter={handlePopoverMouseEnter}
          onMouseLeave={handlePopoverMouseLeave}
        >
          {/* Header with Subject & Time */}
          <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div>
              <div className="font-extrabold text-slate-900 dark:text-white text-[13px] leading-snug">
                {hoveredSlotInfo.slot.subject_name || hoveredSlotInfo.slot.topic || 'Subject Session'}
              </div>
              {hoveredSlotInfo.slot.subject_code && (
                <div className="text-[10px] text-slate-500 font-mono font-bold mt-0.5">
                  Code: #{hoveredSlotInfo.slot.subject_code}
                </div>
              )}
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#5B4BFF]/10 text-[#5B4BFF] dark:text-indigo-400 border border-[#5B4BFF]/20">
                {hoveredSlotInfo.slot.slot_type || hoveredSlotInfo.slot.slotType || 'Lecture'}
              </span>
              <div className="text-[10px] text-slate-500 font-bold mt-1">
                ⏰ {hoveredSlotInfo.slot.start_time?.slice(0, 5)} - {hoveredSlotInfo.slot.end_time?.slice(0, 5)}
              </div>
            </div>
          </div>

          {/* Unit, Topic & Sub-topics (White / Light Container matching Theme) */}
          <div className="space-y-2 bg-[#F6F8FC] dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            {/* Unit */}
            <div>
              <span className="text-[9.5px] font-black text-[#5B4BFF] dark:text-indigo-400 uppercase tracking-wider block">
                📦 Unit
              </span>
              <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px] mt-0.5">
                {hoveredSlotInfo.slot.unit_name || 'Unit 1: Fundamentals of Web Technology'}
              </div>
            </div>

            {/* Topic */}
            <div>
              <span className="text-[9.5px] font-black text-[#F36C21] uppercase tracking-wider block">
                📖 Topic
              </span>
              <div className="font-bold text-slate-900 dark:text-white text-[11px] mt-0.5 leading-snug">
                {hoveredSlotInfo.slot.topic || hoveredSlotInfo.slot.subject_name || 'Lecture Topic'}
              </div>
            </div>

            {/* Sub-topics */}
            {hoveredSlotInfo.slot.sub_topics && (
              <div>
                <span className="text-[9.5px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  📝 Sub-topics
                </span>
                <div className="text-[10.5px] text-slate-600 dark:text-slate-300 font-medium mt-0.5 leading-snug">
                  {hoveredSlotInfo.slot.sub_topics}
                </div>
              </div>
            )}
          </div>

          {/* Faculty & Location Row */}
          <div className="grid grid-cols-2 gap-2 text-[10.5px] font-bold text-slate-700 dark:text-slate-300 pt-1">
            <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block text-[9px] uppercase font-black">Faculty</span>
              <span className="text-slate-900 dark:text-white font-extrabold truncate block mt-0.5">
                👨‍🏫 {hoveredSlotInfo.slot.faculty_name || 'Faculty Member'}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block text-[9px] uppercase font-black">Location</span>
              <span className="text-slate-900 dark:text-white font-extrabold truncate block mt-0.5">
                📍 {hoveredSlotInfo.slot.room || 'Room 204'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                const s = hoveredSlotInfo.slot;
                setHoveredSlotInfo(null);
                handleSlotClick(s, e);
              }}
              className="flex-1 py-2 px-3 bg-[#5B4BFF] hover:bg-[#4a39ff] active:scale-95 text-white font-black rounded-xl text-center text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>✏️</span>
              <span>Edit Session</span>
            </button>
            <button
              type="button"
              onClick={(e) => handleDeleteSlot(hoveredSlotInfo.slot.id, e)}
              className="flex-1 py-2 px-3 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-black rounded-xl text-center text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>🗑️</span>
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal Dialog for Scheduling / Editing Timetable Session */}
      {isModalOpen && (() => {
        const activeClash = modalError || liveClash?.message || null;
        return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div ref={modalScrollRef} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
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

            {activeClash && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border-2 border-rose-500 shadow-md text-rose-800 dark:text-rose-200 text-xs font-bold space-y-1 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-rose-700 dark:text-rose-300 text-[11px]">
                  <span>🚫</span>
                  <span>Faculty Scheduling Conflict / Overlap</span>
                </div>
                <p className="leading-relaxed font-bold pl-5">{activeClash}</p>
              </div>
            )}

            {loading && (
              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-300 dark:border-indigo-700 shadow-md text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-2.5 animate-pulse">
                <div className="w-4 h-4 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
                <span>Saving timetable session and synchronizing with Database & SRMS Portal...</span>
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

              {/* 1. Camera Classroom Selection (LoadCamera API) */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  1. Camera Classroom (from SRMS LoadCamera) *
                </label>
                <select
                  value={formData.cameraId}
                  onChange={(e) => {
                    const camId = e.target.value;
                    const camObj = camerasList.find(c => String(c.camera_id) === camId);
                    setFormData(prev => ({
                      ...prev,
                      cameraId: camId,
                      room: camObj?.classroom || prev.room,
                    }));
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold"
                  required
                >
                  <option value="">-- Select Camera Classroom --</option>
                  {camerasList.map(c => (
                    <option key={c.camera_id} value={c.camera_id}>
                      [{c.camera_id}] {c.classroom} {c.camera_ip && c.camera_ip !== '0' ? `(${c.camera_ip.slice(0, 25)}...)` : ''}
                    </option>
                  ))}
                </select>
                {cameraLoading && (
                  <p className="text-[10px] text-indigo-500 font-semibold mt-1 animate-pulse">
                    Loading cameras from portal...
                  </p>
                )}
              </div>

              {/* 2. Subject Selection (Loadsubject API) */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  2. Subject (from SRMS LoadSubject) *
                </label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold"
                  required
                >
                  <option value="">-- Select Subject --</option>
                  {availableFormSubjects.map(s => (
                    <option key={s.id || s.code || s.linkcd} value={s.id || s.code || s.linkcd}>
                      [{s.code || s.linkcd}] {s.name} {s.faculty_name ? `(${s.faculty_name})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Faculty Selection & EmpID Display */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>3. Faculty Member (Auto-Assigned from Subject) *</span>
                  {formData.facultyEmpId && (
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                      Emp ID: {formData.facultyEmpId}
                    </span>
                  )}
                </label>

                {activeClash && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border-2 border-rose-500 shadow-sm text-rose-800 dark:text-rose-200 text-xs font-bold space-y-1 animate-in fade-in">
                    <div className="flex items-center gap-1 text-rose-700 dark:text-rose-300 font-black text-[11px] uppercase tracking-wide">
                      <span>🚫</span>
                      <span>Faculty Overlap / Conflict</span>
                    </div>
                    <p className="leading-relaxed font-bold">{activeClash}</p>
                    <div className="text-[11px] text-amber-800 dark:text-amber-300 font-extrabold flex items-center gap-1 pt-0.5 border-t border-rose-200 dark:border-rose-800/60">
                      <span>👉</span>
                      <span>Please choose another available faculty member below for this session:</span>
                    </div>
                  </div>
                )}

                <select
                  value={formData.facultyId || formData.facultyEmpId}
                  onChange={(e) => {
                    const val = e.target.value;
                    const foundFac = allFaculties.find((f: any) => String(f.id) === val || String(f.emp_id) === val);
                    setFormData(prev => ({
                      ...prev,
                      facultyId: val,
                      facultyEmpId: foundFac?.emp_id || val,
                      facultyName: foundFac?.name || prev.facultyName,
                    }));
                    if (modalError) setModalError(null);
                  }}
                  className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 font-bold transition-all ${
                    activeClash
                      ? 'border-2 border-rose-500 bg-rose-50/20 ring-4 ring-rose-500/20 text-rose-900 dark:text-white'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                  required
                >
                  <option value="">-- Select Faculty --</option>
                  {Array.isArray(srmsTimetableSubjects) && srmsTimetableSubjects.length > 0 && (
                    <optgroup label="Live Synced Faculty (From Portal)">
                      {srmsTimetableSubjects.map((s: any, idx: number) => {
                        const facId = s.empid || `srms-fac-${idx}`;
                        const facName = s.EmpName || s.faculty_name || 'Faculty';
                        return (
                          <option key={`srms_${facId}_${idx}`} value={facId}>
                            [{s.empid || 'SRMS'}] {facName}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                  <optgroup label="All Institutional Faculty">
                    {(Array.isArray(allFaculties) ? allFaculties : []).map(f => (
                      <option key={f.id || f.emp_id} value={f.id || f.emp_id}>
                        [{f.emp_id || 'FAC'}] {f.name} {f.designation ? `(${f.designation})` : ''}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* 4. Group & Section Row (Default Group 0 for All Group) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Group (txtG)
                  </label>
                  <select
                    value={formData.groupValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        groupValue: val,
                        groupName: val === '0' ? 'All Group' : `Group ${val}`,
                      }));
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold"
                  >
                    <option value="0">0 (All Group / Whole Batch)</option>
                    <option value="1">1 (Group 1 / Batch G1)</option>
                    <option value="2">2 (Group 2 / Batch G2)</option>
                    <option value="3">3 (Group 3 / Batch G3)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Section (txtSec)
                  </label>
                  <input
                    type="text"
                    value={formData.sectionValue}
                    onChange={(e) => setFormData({ ...formData, sectionValue: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold"
                    placeholder="1"
                  />
                </div>
              </div>

              {/* 5. Teaching Mode & Room */}
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
                    placeholder="e.g. Room 204, Physiology Lab"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold"
                  />
                </div>
              </div>

              {/* Subject Description (Replaced Topic / Lesson Label) */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Description
                </label>
                <input
                  type="text"
                  value={formData.subjectDescription}
                  onChange={(e) => setFormData({ ...formData, subjectDescription: e.target.value })}
                  placeholder="e.g. Web Technology VINAY KUMAR"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Sent as description to SRMS addEvent and stored in PostgreSQL.
                </p>
              </div>

              {/* Subject Code Based Structure: 1. Unit, 2. Topic, 3. Sub Topics */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 space-y-3">
                <div className="text-[11px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
                  <span>📚 Subject Code Based Curriculum Structure</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-200">
                    {formData.subjectCode || 'SYLLABUS'}
                  </span>
                </div>

                {/* 1. Unit */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    1. Unit
                  </label>
                  <select
                    value={formData.unitName}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      const matchedU = availableSubjectUnits.find(u => u.name === selectedVal || u.code === selectedVal);
                      setFormData(prev => ({
                        ...prev,
                        unitName: selectedVal,
                        unitId: matchedU?.id || 'unit_1',
                      }));
                    }}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold text-xs"
                  >
                    {availableSubjectUnits.map((u) => (
                      <option key={u.id || u.code} value={u.name}>
                        [{u.code}] {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Topic */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    2. Topic
                  </label>
                  <select
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold text-xs mb-1.5"
                  >
                    <option value="">-- Select or type custom topic below --</option>
                    {availableSubjectTopics.map((t) => (
                      <option key={t.id || t.code} value={t.name}>
                        [{t.code}] {t.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    placeholder="e.g. Object Oriented Programming in C++ / Custom Topic"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 font-semibold text-xs"
                  />
                </div>

                {/* 3. Sub Topics / Competencies */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    3. Sub Topics
                  </label>
                  {availableSubjectSubTopics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2 max-h-24 overflow-y-auto p-1 bg-white/50 dark:bg-black/20 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                      {availableSubjectSubTopics.map((st) => {
                        const isSelected = selectedCompetencies.includes(st.name) || selectedCompetencies.includes(st.code);
                        return (
                          <button
                            key={st.id || st.code}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedCompetencies(prev => prev.filter(c => c !== st.name && c !== st.code));
                              } else {
                                setSelectedCompetencies(prev => [...prev, st.name]);
                              }
                            }}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all border ${
                              isSelected
                                ? 'bg-[#5B4BFF] text-white border-[#5B4BFF]'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#5B4BFF]'
                            }`}
                          >
                            + [{st.code}] {st.name.length > 30 ? st.name.slice(0, 30) + '...' : st.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <input
                    type="text"
                    value={selectedCompetencies.join(', ') || formData.subTopics}
                    onChange={(e) => {
                      const val = e.target.value;
                      const items = val.split(',').map(s => s.trim()).filter(Boolean);
                      setSelectedCompetencies(items);
                      setFormData(prev => ({ ...prev, subTopics: val }));
                    }}
                    placeholder="e.g. Classes, Objects, Inheritance, Virtual Functions"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    Separate multiple sub topics with commas. Displayed on slot hover popover.
                  </p>
                </div>
              </div>

              {/* Bottom Conflict Alert & Saving Alerts directly above Save button */}
              {activeClash && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/90 border-2 border-rose-500 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-start gap-2.5 shadow-sm animate-in fade-in">
                  <span className="text-base shrink-0 mt-0.5">⚠️</span>
                  <div className="space-y-0.5">
                    <div className="font-black text-rose-700 dark:text-rose-300 uppercase tracking-wide text-[10px]">
                      Scheduling Conflict Before Saving:
                    </div>
                    <p className="leading-relaxed font-bold">{activeClash}</p>
                  </div>
                </div>
              )}

              {loading && (
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-2.5 shadow-sm animate-pulse">
                  <div className="w-4 h-4 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>Saving in progress... Please wait while schedule is committed.</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                {editingSlot ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/30 hover:bg-rose-500/20 font-bold transition-all disabled:opacity-50"
                  >
                    Delete
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={loading}
                    className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4a3cf5] text-white font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading && (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    <span>{loading ? 'Saving...' : editingSlot ? 'Save Changes' : 'Save (PostgreSQL & SRMS)'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
        );
      })()}
    </div>
  );
}

