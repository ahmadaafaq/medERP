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
  year: number;
  department_id?: string;
}

interface Subject {
  id: string;
  code: string;
  name: string;
  department_id?: string;
}

interface Faculty {
  id: string;
  emp_id: string;
  name: string;
  designation?: string;
  priority?: number;
  department_name?: string;
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
  slotType: string;
  group_name?: string;
  topic?: string;
  competency_codes?: string;
}

const API_BASE = 'http://localhost:3001/api/v1';
const TENANT = 'srms-ims';

const isUUID = (str?: string) => str ? /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str) : false;

// Fallback Medical Batches if DB has 0 batch records
const FALLBACK_BATCHES: Batch[] = [
  { id: 'batch-2024-25', code: '2024-25', year: 2024 },
  { id: 'batch-2025-26', code: '2025-26', year: 2025 },
  { id: 'batch-2023-24', code: '2023-24', year: 2023 },
];

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

const BATCH_GROUPS = [
  'Whole Batch (All Students)',
  'Group A (Batch 1)',
  'Group B (Batch 2)',
  'Group C (Batch 3)',
  'Group D (Batch 4)',
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

const formatDateStr = (date: Date) => date.toISOString().split('T')[0];

const getCompetenciesForSlot = (
  slot: TimetableSlot,
  allDbCompetencies: CompetencyMasterItem[],
  allDbTopics: TopicMasterItem[]
) => {
  const rawResult: { code: string; description: string; topicName?: string }[] = [];
  const addedCodes = new Set<string>();

  // Resolve full Topic Name from allDbTopics or slot.topic
  let topicFullName = slot.topic || '';
  if (slot.topic) {
    const matchedTopic = allDbTopics.find(t =>
      t.name?.toLowerCase().trim() === slot.topic?.toLowerCase().trim() ||
      t.code?.toLowerCase().trim() === slot.topic?.toLowerCase().trim() ||
      t.id?.toLowerCase().trim() === slot.topic?.toLowerCase().trim() ||
      `[${t.code}] ${t.name}`.toLowerCase() === slot.topic?.toLowerCase().trim()
    );
    if (matchedTopic) {
      topicFullName = matchedTopic.code ? `[${matchedTopic.code}] ${matchedTopic.name}` : matchedTopic.name;
    }
  }

  // 1. Explicitly assigned competency codes on slot (Selected competencies)
  if (slot.competency_codes !== undefined && slot.competency_codes !== null) {
    const rawCodesStr = filterCompetencyCodesString(slot.competency_codes, slot.subject_code, slot.subject_name, slot.topic);
    const rawCodes = rawCodesStr.split(',').map(c => c.trim()).filter(Boolean);
    for (const rawCode of rawCodes) {
      // Clean code e.g. "PY2.1(2024)" -> "PY2.1"
      const cleanCode = rawCode.replace(/\(\d+\)/g, '').trim();
      const dbComp = allDbCompetencies.find(c =>
        c.code.toLowerCase() === cleanCode.toLowerCase()
      );
      if (dbComp) {
        rawResult.push({
          code: dbComp.code,
          description: dbComp.description || 'NMC Medical Curriculum Competency',
          topicName: dbComp.topic_name || dbComp.topic_code,
        });
        addedCodes.add(dbComp.code.toLowerCase());
      } else {
        rawResult.push({
          code: cleanCode,
          description: 'NMC Medical Curriculum Competency',
        });
        addedCodes.add(cleanCode.toLowerCase());
      }
    }
    const filteredCompList = filterCompetenciesForSlot(rawResult, slot.subject_code, slot.subject_name, slot.topic);
    return { compList: filteredCompList, topicFullName };
  }

  // 2. Fallback only if competency_codes property was undefined/null (legacy slot)
  if (slot.topic) {
    const topicSearch = slot.topic.toLowerCase().trim();
    const topicComps = allDbCompetencies.filter(c =>
      (c.topic_name && c.topic_name.toLowerCase().trim().includes(topicSearch)) ||
      (c.topic_code && c.topic_code.toLowerCase().trim() === topicSearch) ||
      (c.topic_id && c.topic_id.toLowerCase().trim() === topicSearch)
    );

    for (const comp of topicComps) {
      if (!addedCodes.has(comp.code.toLowerCase())) {
        rawResult.push({
          code: comp.code,
          description: comp.description || 'NMC Medical Curriculum Competency',
          topicName: comp.topic_name || comp.topic_code,
        });
        addedCodes.add(comp.code.toLowerCase());
      }
    }
  }

  const filteredCompList = filterCompetenciesForSlot(rawResult, slot.subject_code, slot.subject_name, slot.topic);
  return { compList: filteredCompList, topicFullName };
};



export default function TimetableDesignPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allFaculties, setAllFaculties] = useState<any[]>([]);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);

  // Master Data State for Topic Master & Competency Master
  const [allDbTopics, setAllDbTopics] = useState<TopicMasterItem[]>([]);
  const [allDbCompetencies, setAllDbCompetencies] = useState<CompetencyMasterItem[]>([]);

  // Filtered Topic & Competency Lists for active Subject
  const [subjectTopics, setSubjectTopics] = useState<TopicMasterItem[]>([]);
  const [subjectCompetencies, setSubjectCompetencies] = useState<CompetencyMasterItem[]>([]);
  const [competencySearchTerm, setCompetencySearchTerm] = useState('');
  const [selectedCompetencies, setSelectedCompetencies] = useState<string[]>([]);

  // Hover Popover State for Timetable Slot Cards
  const [hoveredSlotInfo, setHoveredSlotInfo] = useState<{ slot: TimetableSlot; x: number; y: number } | null>(null);

  // Week Navigation State
  const [weekOffset, setWeekOffset] = useState(0);

  // Cascading Filter Selection Controls & Dynamic API Lists
  const [collegesList, setCollegesList] = useState<{ id: string; code: string; name: string }[]>([]);
  const [sessionsList, setSessionsList] = useState<{ id: string; code: string; name: string }[]>([]);
  const [coursesList, setCoursesList] = useState<{ id: string; code: string; name: string }[]>([]);
  const [branchesList, setBranchesList] = useState<{ id: string; code: string; name: string }[]>([]);

  const [selectedCollege, setSelectedCollege] = useState('SHRI RAM MURTI SMARAK COLLEGE OF ENGINEERING & TECHNOLOGY, BAREILLY');
  const [selectedSession, setSelectedSession] = useState('2024-2025');
  const [selectedCourse, setSelectedCourse] = useState('MCA');
  const [selectedBranch, setSelectedBranch] = useState('General Track');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  // Form Modal Popup State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);

  // --- Modal-local cascade state (FULLY INDEPENDENT from outer view filters) ---
  // The outer filters (College → Course → Branch → Batch) control the GRID VIEW only.
  // The modal has its own Course → Department → Subject cascade for CREATING/EDITING slots.
  // These NEVER mutate the outer selectedCourse / availableBranches / availableFormSubjects.
  // lastModalCourseRef persists the user's last selection across modal opens — completely
  // decoupled from the outer course dropdown.
  const lastModalCourseRef = useRef<string>('');  // persists between modal opens
  const [modalCourse, setModalCourse] = useState('');
  const [modalBranches, setModalBranches] = useState<any[]>([]);
  const [modalSubjects, setModalSubjects] = useState<any[]>([]);
  const [modalFaculties, setModalFaculties] = useState<any[]>([]);
  const [apiRelevantFaculties, setApiRelevantFaculties] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    dayOfWeek: 1,
    startTime: '08:00:00',
    endTime: '09:00:00',
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
    if (!colVal || collegesList.length === 0) return collegesList[0];
    const match = collegesList.find(c => {
      if (!c) return false;
      const colNorm = (c.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const selNorm = (colVal || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return (
        c.name === colVal ||
        c.code === colVal ||
        c.id === colVal ||
        (c.slug && c.slug === colVal) ||
        colNorm === selNorm ||
        (colNorm.length > 3 && selNorm.includes(colNorm)) ||
        (selNorm.length > 3 && colNorm.includes(selNorm))
      );
    });
    return match || collegesList[0];
  };

  const getActiveTenantSlug = () => {
    const col = findMatchingCollege(selectedCollege);
    return col?.slug || 'srms-ims';
  };

  const getCoursesForCollegeVal = (colVal: string) => {
    if (coursesList.length === 0) return coursesList;
    const targetCol = findMatchingCollege(colVal);
    if (!targetCol) return coursesList;

    const targetId = String(targetCol.id);
    const targetCode = String(targetCol.code);
    const targetSlug = String(targetCol.slug);
    const targetName = String(targetCol.name);

    const filtered = coursesList.filter((cr: any) => {
      const matchId = targetId && (String(cr.college_id) === targetId || String(cr.colg_cd) === targetId);
      const matchCode = targetCode && (String(cr.college_id) === targetCode || String(cr.colg_cd) === targetCode || String(cr.college_code) === targetCode);
      const matchSlug = targetSlug && (cr.college_slug === targetSlug || cr.slug === targetSlug);
      const matchName = targetName && (cr.college_name === targetName);
      return matchId || matchCode || matchSlug || matchName;
    });

    return filtered.length > 0 ? filtered : coursesList;
  };

  const getBranchesForCollegeAndCourseVal = (colVal: string, crsVal?: string) => {
    if (branchesList.length === 0) return branchesList;
    const targetCol = findMatchingCollege(colVal);
    if (!targetCol) return branchesList;

    const targetId = String(targetCol.id);
    const targetCode = String(targetCol.code);
    const targetSlug = String(targetCol.slug);
    const targetName = String(targetCol.name);

    let filtered = branchesList.filter((br: any) => {
      const matchId = targetId && (String(br.college_id) === targetId || String(br.colg_cd) === targetId);
      const matchCode = targetCode && (String(br.college_id) === targetCode || String(br.colg_cd) === targetCode || String(br.college_code) === targetCode);
      const matchSlug = targetSlug && (br.college_slug === targetSlug || br.slug === targetSlug);
      const matchName = targetName && (br.college_name === targetName);
      return matchId || matchCode || matchSlug || matchName;
    });

    if (crsVal && crsVal !== 'all') {
      const targetCrs = coursesList.find(c => c.name === crsVal || c.code === crsVal || c.id === crsVal);
      const crsCd = targetCrs ? String(targetCrs.code || targetCrs.id) : String(crsVal);

      const courseFiltered = filtered.filter((br: any) =>
        String(br.course_cd) === crsCd ||
        String(br.course_code) === crsCd ||
        String(br.course_cd) === String(crsVal) ||
        String(br.course_code) === String(crsVal) ||
        br.course_name === crsVal ||
        (br.name && crsVal.includes(br.name))
      );
      if (courseFiltered.length > 0) {
        filtered = courseFiltered;
      }
    }

    return filtered.length > 0 ? filtered : branchesList;
  };

  const availableCourses = useMemo(() => {
    return getCoursesForCollegeVal(selectedCollege);
  }, [selectedCollege, collegesList, coursesList]);

  const availableBranches = useMemo(() => {
    return getBranchesForCollegeAndCourseVal(selectedCollege, selectedCourse);
  }, [selectedCollege, selectedCourse, collegesList, coursesList, branchesList]);

  // Dynamically Filter Form Subjects based on Active College, Course, and Department
  const availableFormSubjects = useMemo(() => {
    if (subjects.length === 0) return [];

    const targetCol = findMatchingCollege(selectedCollege);
    const targetId = targetCol ? String(targetCol.id) : '';
    const targetCode = targetCol ? String(targetCol.code) : '';
    const targetSlug = targetCol ? String(targetCol.slug) : '';
    const targetName = targetCol ? String(targetCol.name) : '';

    const targetCrs = coursesList.find(c => c.name === selectedCourse || c.code === selectedCourse || c.id === selectedCourse);
    const selectedCourseCd = targetCrs ? String(targetCrs.code || targetCrs.id) : String(selectedCourse);

    return subjects.filter((s: any) => {
      // 1. College Match
      const sColId = s.college_id !== undefined ? String(s.college_id) : undefined;
      const sColCd = s.colg_cd !== undefined ? String(s.colg_cd) : undefined;
      const sColSlug = s.college_slug || s.slug;
      const sColName = s.college_name || s.colg_name;

      if (sColId || sColCd || sColSlug || sColName) {
        const matchCol =
          (targetId && (sColId === targetId || sColCd === targetId)) ||
          (targetCode && (sColId === targetCode || sColCd === targetCode || String(s.college_code) === targetCode)) ||
          (targetSlug && sColSlug === targetSlug) ||
          (targetName && sColName === targetName);
        if (!matchCol) return false;
      }

      // 2. Course Match (if selectedCourse is set)
      if (selectedCourse && selectedCourse !== 'all') {
        const matchCourse =
          String(s.course_cd) === selectedCourseCd ||
          String(s.course_code) === selectedCourseCd ||
          String(s.course_cd) === String(selectedCourse) ||
          String(s.course_code) === String(selectedCourse) ||
          s.course_name === selectedCourse;
        if (!matchCourse) return false;
      }

      // 3. Department/Branch Match — driven by the OUTER branch filter bar,
      // never by formData.departmentId (that belongs to the create/edit modal only).
      if (selectedBranch && selectedBranch !== 'all') {
        const selectedBranchObj = availableBranches.find(b => String(b.id) === String(selectedBranch) || String(b.code) === String(selectedBranch));
        const targetBranchCd = selectedBranchObj ? String(selectedBranchObj.code || selectedBranchObj.id) : String(selectedBranch);

        const matchBranch =
          String(s.department_id) === String(selectedBranch) ||
          String(s.branch_cd) === String(selectedBranch) ||
          String(s.branch_code) === String(selectedBranch) ||
          String(s.department_id) === targetBranchCd ||
          String(s.branch_cd) === targetBranchCd ||
          String(s.branch_code) === targetBranchCd;
        if (!matchBranch) return false;
      }

      return true;
    });
  }, [selectedCollege, selectedCourse, selectedBranch, subjects, availableBranches, collegesList, coursesList]);

  // Dynamically Filter Faculties based on Active College and Selected Department
  const relevantFaculties = useMemo(() => {
    if (allFaculties.length === 0) return [];

    const targetCol = findMatchingCollege(selectedCollege);
    const targetId = targetCol ? String(targetCol.id) : '';
    const targetCode = targetCol ? String(targetCol.code) : '';
    const targetSlug = targetCol ? String(targetCol.slug) : '';
    const targetName = targetCol ? String(targetCol.name) : '';

    const matchedColFaculties = allFaculties.filter((f: any) => {
      if (!targetCol) return true;
      const fColId = f.college_id !== undefined ? String(f.college_id) : undefined;
      const fColCd = f.colg_cd !== undefined ? String(f.colg_cd) : (f.college_code !== undefined ? String(f.college_code) : undefined);
      const fColSlug = f.college_slug || f.slug;
      const fColName = f.college_name || f.colg_name;

      if (!fColId && !fColCd && !fColSlug && !fColName) return true;

      return (
        (targetId && (fColId === targetId || fColCd === targetId)) ||
        (targetCode && (fColId === targetCode || fColCd === targetCode || String(f.college_code) === targetCode)) ||
        (targetSlug && fColSlug === targetSlug) ||
        (targetName && fColName === targetName)
      );
    });

    let result = matchedColFaculties.length > 0 ? matchedColFaculties : allFaculties;

    // Filter by selected Department if present
    if (formData.departmentId && formData.departmentId !== 'all') {
      const selectedBranchObj = availableBranches.find(b => String(b.id) === String(formData.departmentId) || String(b.code) === String(formData.departmentId));
      const targetBranchCd = selectedBranchObj ? String(selectedBranchObj.code || selectedBranchObj.id) : String(formData.departmentId);
      const targetBranchName = selectedBranchObj ? selectedBranchObj.name : '';

      const deptFiltered = result.filter((f: any) => {
        const fDeptId = f.department_id !== undefined ? String(f.department_id) : undefined;
        const fBranchCd = f.branch_cd !== undefined ? String(f.branch_cd) : undefined;
        const fDeptName = f.department_name;

        return (
          String(formData.departmentId) === fDeptId ||
          String(formData.departmentId) === fBranchCd ||
          targetBranchCd === fDeptId ||
          targetBranchCd === fBranchCd ||
          (targetBranchName && fDeptName && fDeptName === targetBranchName)
        );
      });

      if (deptFiltered.length > 0) {
        result = deptFiltered;
      }
    }

    return result;
  }, [allFaculties, selectedCollege, formData.departmentId, availableBranches, collegesList]);

  // Compute Subject & Faculty Registry list with mapped subject codes, names, and faculty
  const registryList = useMemo(() => {
    const list: { subject_code: string; subject_name: string; faculty_name: string }[] = [];
    const seenKeys = new Set<string>();

    for (const s of slots) {
      // Ensure slot belongs to active Course & Branch subjects
      if (availableFormSubjects.length > 0) {
        const isSubjectInCourse = availableFormSubjects.some(sub =>
          String(sub.id) === String(s.subject_id) ||
          String(sub.code) === String(s.subject_id) ||
          String(sub.code) === String(s.subject_code) ||
          (sub.name && s.subject_name && sub.name.toLowerCase().trim() === s.subject_name.toLowerCase().trim())
        );
        if (!isSubjectInCourse) continue;
      }

      const matchedSub = subjects.find(sub => String(sub.id) === String(s.subject_id) || String(sub.code) === String(s.subject_id) || String(sub.code) === String(s.subject_code));
      const subCode = (s.subject_code && s.subject_code !== 'MBBS') ? s.subject_code : (matchedSub?.code || '');
      const subName = (s.subject_name && s.subject_name !== 'Medical Subject') ? s.subject_name : (matchedSub?.name || s.topic || '');

      const matchedFac = allFaculties.find(fac => String(fac.id) === String(s.faculty_id) || String(fac.emp_id) === String(s.faculty_id));
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
  }, [slots, subjects, allFaculties, availableFormSubjects]);

  // Calculate dates for current active week
  const getWeekDates = (offset: number) => {
    const today = new Date();
    const currentDay = today.getDay();
    const distanceToMon = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMon + offset * 7);

    const weekDays = [];
    for (let i = 0; i < 6; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      weekDays.push({
        value: i + 1,
        dateStr: formatDateStr(dayDate),
        displayDate: dayDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        dayName: dayDate.toLocaleDateString(undefined, { weekday: 'short' }),
      });
    }
    return { monday, saturday: weekDays[5], weekDays };
  };

  const currentWeek = getWeekDates(weekOffset);

  const fetchDropdowns = async () => {
    setMetadataLoading(true);
    const token = localStorage.getItem('token') || '';
    const headers = { 'Authorization': `Bearer ${token}` };

    try {
      // 1. Fetch colleges list first if not loaded yet
      let collegesListLoaded = collegesList;
      if (collegesList.length === 0) {
        const collegesRes = await fetch(`${API_BASE}/college-master/colleges`, { headers }).catch(() => null);
        if (collegesRes && collegesRes.ok) {
          const cJson = await collegesRes.json();
          const list = cJson.data || cJson || [];
          if (Array.isArray(list) && list.length > 0) {
            const rawColleges = list.map((c: any) => ({
              id: String(c.id || c.colg_cd || c.code || c.name),
              code: String(c.code || c.colg_cd || c.id),
              slug: String(c.slug || c.college_slug || c.code || c.id),
              name: String(c.name || c.colg_name || c.code),
            }));
            collegesListLoaded = Array.from(
              new Map(rawColleges.map((c: any) => [c.name.toUpperCase().trim(), c])).values()
            );
            setCollegesList(collegesListLoaded);
            if (collegesListLoaded.length > 0) {
              setSelectedCollege(collegesListLoaded[0].name);
            }
          }
        }
      }

      // Determine active tenant slug for college metadata call
      const activeCol = collegesListLoaded.find(c => {
        if (!c) return false;
        const colNorm = (c.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const selNorm = (selectedCollege || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return (
          c.name === selectedCollege ||
          c.code === selectedCollege ||
          c.id === selectedCollege ||
          (c.slug && c.slug === selectedCollege) ||
          colNorm === selNorm
        );
      }) || collegesListLoaded[0];

      const tenantSlug = activeCol?.slug || 'srms-ims';

      const [
        coursesRes,
        branchesRes,
        sessionsRes,
        deptRes,
        batchCollegeRes,
        subRes,
        topicRes,
        compRes,
        facRes,
        adminDeptRes,
      ] = await Promise.all([
        fetch(`${API_BASE}/college-master/courses?tenant=${tenantSlug}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/college-master/branches?tenant=${tenantSlug}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/college-master/sessions?tenant=${tenantSlug}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/users/departments?tenant=${tenantSlug}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/college-master/batches?tenant=${tenantSlug}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/admin-master/subjects?tenant=${tenantSlug}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/admin-master/topics?tenant=${tenantSlug}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/admin-master/competencies?tenant=${tenantSlug}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/users/faculty?tenant=${tenantSlug}&limit=500`, { headers }).catch(() => null),
        fetch(`${API_BASE}/admin-master/departments?tenant=${tenantSlug}`, { headers }).catch(() => null),
      ]);

      // 2. Process Courses (Single API call with deduplication)
      if (coursesRes && coursesRes.ok) {
        const crJson = await coursesRes.json();
        const list = crJson.data || crJson || [];
        if (Array.isArray(list) && list.length > 0) {
          const rawCourses = list.map((cr: any) => ({
            id: String(cr.id || cr.course_cd || cr.code || cr.name),
            code: String(cr.code || cr.course_cd || cr.id),
            name: String(cr.name || cr.course_name || cr.code),
            college_id: cr.college_id !== undefined ? String(cr.college_id) : (cr.colg_cd !== undefined ? String(cr.colg_cd) : undefined),
            colg_cd: cr.colg_cd !== undefined ? String(cr.colg_cd) : (cr.college_id !== undefined ? String(cr.college_id) : undefined),
            college_slug: cr.college_slug || cr.slug,
            college_name: cr.college_name || cr.colg_name,
            college_code: cr.college_code || cr.colg_cd,
          }));
          const uniqueCourses = Array.from(
            new Map(rawCourses.map((cr: any) => [`${cr.college_id || cr.colg_cd || ''}-${cr.name.toUpperCase().trim()}`, cr])).values()
          );
          setCoursesList(uniqueCourses);
        }
      }

      // 3. Process Branches — merge college-master/branches + admin-master/departments
      //    admin-master/departments is the source of truth with all 31 branches (same as admin-master page)
      const normalizeBranch = (br: any) => ({
        id: String(br.id || br.branch_cd || br.code || br.name),
        code: String(br.branch_cd || br.code || br.id),
        name: String(br.name || br.branch_name || br.code),
        course_cd: br.course_cd || br.course_code,
        course_code: br.course_code || br.course_cd,
        course_name: br.course_name,
        college_id: br.college_id !== undefined ? String(br.college_id) : (br.colg_cd !== undefined ? String(br.colg_cd) : undefined),
        colg_cd: br.colg_cd !== undefined ? String(br.colg_cd) : (br.college_id !== undefined ? String(br.college_id) : undefined),
        college_slug: br.college_slug || br.slug,
        college_name: br.college_name || br.colg_name,
        college_code: br.college_code || br.colg_cd,
      });

      let rawBranchesMerged: any[] = [];
      if (branchesRes && branchesRes.ok) {
        const bJson = await branchesRes.json();
        const list = bJson.data || bJson || [];
        if (Array.isArray(list)) rawBranchesMerged.push(...list.map(normalizeBranch));
      }
      // Merge admin-master/departments which has ALL 31 departments
      if (adminDeptRes && adminDeptRes.ok) {
        const adJson = await adminDeptRes.json();
        const adList = adJson.data || adJson || [];
        if (Array.isArray(adList)) rawBranchesMerged.push(...adList.map(normalizeBranch));
      }
      if (rawBranchesMerged.length > 0) {
        const uniqueBranches = Array.from(
          new Map(rawBranchesMerged.map((br: any) => [
            `${br.college_id || br.colg_cd || ''}-${br.course_cd || ''}-${br.name.toUpperCase().trim()}`
            , br])).values()
        );
        setBranchesList(uniqueBranches);
      }

      // 4. Process Sessions (Single API call with deduplication)
      if (sessionsRes && sessionsRes.ok) {
        const sJson = await sessionsRes.json();
        const list = sJson.data || sJson || [];
        if (Array.isArray(list) && list.length > 0) {
          const rawSessions = list.map((s: any) => ({
            id: s.id || s.code || s.name,
            code: s.code || s.name || s.id,
            name: s.name || s.session_name || s.code,
          }));
          const uniqueSessions = Array.from(
            new Map(rawSessions.map((s: any) => [s.name.toUpperCase().trim(), s])).values()
          );
          setSessionsList(uniqueSessions);
        }
      }

      // 5. Process Departments
      if (deptRes && deptRes.ok) {
        const dJson = await deptRes.json();
        const dList = dJson.data || dJson;
        setDepartments(Array.isArray(dList) ? dList : []);
        if (dList.length > 0) setSelectedDept(dList[0].id);
      }

      // 6. Process Batches (Single API call with deduplication)
      if (batchCollegeRes && batchCollegeRes.ok) {
        const bcJson = await batchCollegeRes.json();
        const bcList = bcJson.data || bcJson;
        if (Array.isArray(bcList) && bcList.length > 0) {
          const uniqueBatches = Array.from(
            new Map(bcList.map((b: any) => [b.id || b.code, b])).values()
          );
          setBatches(uniqueBatches);
          if (uniqueBatches.length > 0) {
            setSelectedBatch(uniqueBatches[0].id);
          }
        } else {
          setBatches(FALLBACK_BATCHES);
          setSelectedBatch(FALLBACK_BATCHES[0].id);
        }
      } else {
        setBatches(FALLBACK_BATCHES);
        setSelectedBatch(FALLBACK_BATCHES[0].id);
      }

      if (subRes && subRes.ok) {
        const sJson = await subRes.json();
        setSubjects(sJson.data || sJson);
      }
      if (topicRes && topicRes.ok) {
        const tJson = await topicRes.json();
        setAllDbTopics(tJson.data || tJson);
      }
      if (compRes && compRes.ok) {
        const cJson = await compRes.json();
        setAllDbCompetencies(cJson.data || cJson);
      }
      if (facRes && facRes.ok) {
        const fJson = await facRes.json();
        let dataList: any[] = [];
        if (Array.isArray(fJson)) {
          dataList = fJson;
        } else if (Array.isArray(fJson?.data?.data)) {
          dataList = fJson.data.data;
        } else if (Array.isArray(fJson?.data)) {
          dataList = fJson.data;
        } else if (Array.isArray(fJson?.items)) {
          dataList = fJson.items;
        }
        setAllFaculties(dataList);
      }
    } catch (err) {
      console.error('Failed to load filters metadata', err);
      setBatches(FALLBACK_BATCHES);
      setSelectedBatch(FALLBACK_BATCHES[0].id);
    } finally {
      setMetadataLoading(false);
    }
  };

  const fetchTimetableSlots = async () => {
    if (!selectedBatch) return;
    setLoading(true);
    try {
      const tenantSlug = getActiveTenantSlug();
      const qs = new URLSearchParams({ tenant: tenantSlug, batchId: selectedBatch });
      if (selectedBranch && selectedBranch !== 'all') qs.append('departmentId', selectedBranch);
      const res = await fetch(`${API_BASE}/timetable?${qs.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (res.ok) {
        const json = await res.json();
        setSlots(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch timetable slots', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelevantFaculties = async (subjectId: string, deptId: string) => {
    if (!subjectId) {
      setApiRelevantFaculties([]);
      return;
    }
    try {
      const tenantSlug = getActiveTenantSlug();
      const res = await fetch(`${API_BASE}/timetable/relevant-faculties?tenant=${tenantSlug}&subjectId=${subjectId}&departmentId=${deptId || selectedDept}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (res.ok) {
        const json = await res.json();
        setApiRelevantFaculties(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load relevant faculties', err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDropdowns();
  }, []);

  // Refetch dropdowns metadata when selected college changes
  useEffect(() => {
    if (selectedCollege) {
      fetchDropdowns();
    }
  }, [selectedCollege]);

  // Sync selectedBranch with availableBranches if not matching any option
  useEffect(() => {
    if (availableBranches.length > 0) {
      const match = availableBranches.find(
        (b: any) => String(b.code) === String(selectedBranch) || String(b.id) === String(selectedBranch)
      );
      if (!match) {
        setSelectedBranch(availableBranches[0].code || availableBranches[0].id || '');
      }
    } else {
      if (selectedBranch !== 'General Track' && selectedBranch !== 'Computer Science') {
        setSelectedBranch('General Track');
      }
    }
  }, [availableBranches, selectedBranch]);

  // Refetch slots when selected batch or branch changes
  useEffect(() => {
    fetchTimetableSlots();
  }, [selectedBatch, selectedBranch]);

  // Fetch relevant faculties when subject or department changes in form
  useEffect(() => {
    fetchRelevantFaculties(formData.subjectId, formData.departmentId);
  }, [formData.subjectId, formData.departmentId]);

  // Clear modalError when key form fields change
  useEffect(() => {
    setModalError(null);
  }, [formData.facultyId, formData.startTime, formData.endTime, formData.dayOfWeek, formData.subjectId]);

  // Once the backend returns subject/department-linked faculty, prioritize them
  // in the modal's Faculty dropdown over the plain college-filtered list.
  useEffect(() => {
    if (isModalOpen && formData.subjectId && apiRelevantFaculties.length > 0) {
      setModalFaculties(apiRelevantFaculties);
    }
  }, [apiRelevantFaculties, isModalOpen, formData.subjectId]);

  // Dynamically Filter Topics and Competencies from Admin Master DB when Subject changes!
  useEffect(() => {
    if (!formData.subjectId) {
      setSubjectTopics([]);
      setSubjectCompetencies([]);
      return;
    }

    // subjectId now stores subject CODE (not UUID) — match by code first, then id as fallback
    const subObj = subjects.find(s =>
      s.code === formData.subjectId ||
      s.id === formData.subjectId
    );
    if (!subObj) {
      setSubjectTopics([]);
      setSubjectCompetencies([]);
      return;
    }

    const subId = subObj.id;
    const subCode = (subObj.code || '').toUpperCase().trim();
    const subName = (subObj.name || '').toUpperCase().trim();

    // Extract 2-letter prefix for CBME code matching (e.g. AN for ANATOMY, PY for PHYSIOLOGY, BI for BIOCHEMISTRY)
    const codePrefix = subCode.length >= 2 ? subCode.slice(0, 2) : subCode;

    // 1. Filter Topics from Topic Master DB strictly for selected Subject
    const matchingTopics = allDbTopics.filter(t => {
      if (t.subject_id && t.subject_id === subId) return true;
      if (t.subject_code && t.subject_code.toUpperCase().trim() === subCode) return true;
      if (t.subject_name && subName && t.subject_name.toUpperCase().trim().includes(subName)) return true;
      if (t.code && codePrefix && t.code.toUpperCase().startsWith(codePrefix)) return true;
      return false;
    });

    // 2. Filter Competencies from Competency Master DB strictly for selected Subject
    const matchingCompetencies = allDbCompetencies.filter(c => {
      if (c.subject_id && c.subject_id === subId) return true;
      if (c.subject_code && c.subject_code.toUpperCase().trim() === subCode) return true;
      if (c.subject_name && subName && c.subject_name.toUpperCase().trim().includes(subName)) return true;
      if (c.code && codePrefix && c.code.toUpperCase().startsWith(codePrefix)) return true;
      return false;
    });

    setSubjectTopics(matchingTopics);
    setSubjectCompetencies(matchingCompetencies);

  }, [formData.subjectId, subjects, allDbTopics, allDbCompetencies]);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  // Helper to add hours to time string 'HH:MM:SS'
  const addHoursToTime = (timeStr: string, hoursToAdd: number) => {
    if (!timeStr) return '09:00:00';
    const parts = timeStr.split(':').map(Number);
    const h = parts[0] || 0;
    const m = parts[1] || 0;
    const s = parts[2] || 0;
    const date = new Date();
    date.setHours(h, m, s);
    date.setMinutes(date.getMinutes() + Math.round(hoursToAdd * 60));
    const finalH = String(date.getHours()).padStart(2, '0');
    const finalM = String(date.getMinutes()).padStart(2, '0');
    return `${finalH}:${finalM}:00`;
  };

  // Calculate difference in hours between two time strings ('HH:MM:SS' or 'HH:MM')
  const getTimeDifferenceHours = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return 0;
    const p1 = startStr.split(':').map(Number);
    const p2 = endStr.split(':').map(Number);
    const h1 = p1[0] || 0;
    const m1 = p1[1] || 0;
    const h2 = p2[0] || 0;
    const m2 = p2[1] || 0;
    const startMins = h1 * 60 + m1;
    const endMins = h2 * 60 + m2;
    const diffMins = endMins - startMins;
    return diffMins > 0 ? diffMins / 60 : 0;
  };

  const handleDurationPreset = (hours: number) => {
    const newEnd = addHoursToTime(formData.startTime, hours);
    setFormData(prev => ({ ...prev, endTime: newEnd }));
  };

  const handleStartTimeChange = (newStart: string) => {
    const currentDiff = getTimeDifferenceHours(formData.startTime, formData.endTime);
    const durationToAdd = currentDiff > 0 ? currentDiff : 1;
    const newEnd = addHoursToTime(newStart, durationToAdd);
    setFormData(prev => ({
      ...prev,
      startTime: newStart,
      endTime: newEnd,
    }));
  };

  // Toggle Competency selection
  const toggleCompetency = (code: string) => {
    setSelectedCompetencies(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  // Grid Cell Click - Auto-fill Day & Time & Open Modal
  const handleGridCellClick = (dayVal: number, timeStart: string, defaultEnd: string) => {
    let activeBatch = selectedBatch;
    if (!activeBatch && batches.length > 0) {
      activeBatch = batches[0].id;
      setSelectedBatch(activeBatch);
    }

    if (!activeBatch) {
      showAlert('error', 'No batch records available. Please create a Batch first.');
      return;
    }

    setEditingSlot(null);
    setSelectedCompetencies([]);
    setCompetencySearchTerm('');
    // Use the last course the user selected inside the modal (persisted via ref).
    // Falls back to selectedCourse ONLY on the very first ever open (ref is empty).
    // After that, changing the outer course has NO effect on the modal's course.
    const initCourse = lastModalCourseRef.current || availableCourses[0]?.name || selectedCourse;
    const initBranches = getBranchesForCollegeAndCourseVal(selectedCollege, initCourse);
    const initDeptId = selectedDept || (initBranches[0]?.id || initBranches[0]?.code || '');
    const initSubjects = subjects.filter((s: any) => {
      const targetCrs = coursesList.find(c => c.name === initCourse || c.code === initCourse || c.id === initCourse);
      const crsCd = targetCrs ? String(targetCrs.code || targetCrs.id) : String(initCourse);
      return (
        String(s.course_cd) === crsCd ||
        String(s.course_code) === crsCd ||
        String(s.course_cd) === String(initCourse) ||
        s.course_name === initCourse
      );
    });
    // Filter faculty by selected college — same approach as staff-master fetchFaculties
    const activeCol = findMatchingCollege(selectedCollege);
    const colFilteredFaculties = allFaculties.filter((f: any) => {
      if (!activeCol) return true;
      const colId = String(activeCol.id);
      const colCode = String(activeCol.code);
      const colSlug = String(activeCol.slug);
      const colName = String(activeCol.name);
      return (
        String(f.college_id) === colId || String(f.colg_cd) === colId ||
        String(f.college_id) === colCode || String(f.colg_cd) === colCode ||
        (f.college_slug && f.college_slug === colSlug) ||
        (f.college_name && f.college_name === colName)
      );
    });
    setModalCourse(initCourse);
    setModalBranches(initBranches);
    setModalSubjects(initSubjects);
    setModalFaculties(colFilteredFaculties);

    setFormData({
      dayOfWeek: dayVal,
      startTime: timeStart,
      endTime: defaultEnd,
      departmentId: initDeptId,
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

  // Click Existing Slot - Edit/Delete Modal
  const handleSlotClick = (slot: TimetableSlot, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSlot(slot);

    // Parse competency codes
    const existingCompCodes = slot.competency_codes
      ? slot.competency_codes.split(',').map(c => c.trim()).filter(Boolean)
      : [];
    setSelectedCompetencies(existingCompCodes);
    setCompetencySearchTerm('');

    // Initialize modal-local cascade from the slot's own course (independent from outer view)
    const slotCourse = (slot as any).course_name || (slot as any).course_cd || selectedCourse;
    const slotBranches = getBranchesForCollegeAndCourseVal(selectedCollege, slotCourse);
    const slotSubjects = subjects.filter((s: any) => {
      const targetCrs = coursesList.find(c => c.name === slotCourse || c.code === slotCourse || c.id === slotCourse);
      const crsCd = targetCrs ? String(targetCrs.code || targetCrs.id) : String(slotCourse);
      return (
        String(s.course_cd) === crsCd ||
        String(s.course_code) === crsCd ||
        String(s.course_cd) === String(slotCourse) ||
        s.course_name === slotCourse
      );
    });
    // Filter faculty by selected college — never show all colleges' staff
    const activeCol2 = findMatchingCollege(selectedCollege);
    const colFilteredFaculties2 = allFaculties.filter((f: any) => {
      if (!activeCol2) return true;
      const colId = String(activeCol2.id);
      const colCode = String(activeCol2.code);
      const colSlug = String(activeCol2.slug);
      const colName = String(activeCol2.name);
      return (
        String(f.college_id) === colId || String(f.colg_cd) === colId ||
        String(f.college_id) === colCode || String(f.colg_cd) === colCode ||
        (f.college_slug && f.college_slug === colSlug) ||
        (f.college_name && f.college_name === colName)
      );
    });
    setModalCourse(slotCourse);
    setModalBranches(slotBranches);
    setModalSubjects(slotSubjects.length > 0 ? slotSubjects : subjects);
    setModalFaculties(colFilteredFaculties2);

    setFormData({
      dayOfWeek: slot.day_of_week,
      startTime: slot.start_time,
      endTime: slot.end_time,
      departmentId: slot.department_id || selectedDept || '',
      subjectId: slot.subject_id || '',
      facultyId: slot.faculty_id || '',
      room: slot.room || '',
      slotType: slot.slot_type || 'Lecture',
      groupName: slot.group_name || 'Whole Batch (All Students)',
      topic: slot.topic || '',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  // Modal-local course change — NEVER touches outer selectedCourse or selectedBranch
  const handleModalCourseChange = (crsVal: string) => {
    const newBranches = getBranchesForCollegeAndCourseVal(selectedCollege, crsVal);
    const newDeptId = newBranches[0]?.id || newBranches[0]?.code || '';
    const newSubjects = subjects.filter((s: any) => {
      const targetCrs = coursesList.find(c => c.name === crsVal || c.code === crsVal || c.id === crsVal);
      const crsCd = targetCrs ? String(targetCrs.code || targetCrs.id) : String(crsVal);
      return (
        String(s.course_cd) === crsCd ||
        String(s.course_code) === crsCd ||
        String(s.course_cd) === String(crsVal) ||
        s.course_name === crsVal
      );
    });
    // Persist in ref so next modal open remembers this selection — NOT driven by outer selectedCourse
    lastModalCourseRef.current = crsVal;
    setModalCourse(crsVal);
    setModalBranches(newBranches);
    setModalSubjects(newSubjects);
    setFormData(prev => ({
      ...prev,
      departmentId: newDeptId,
      subjectId: '',
      facultyId: '',
      topic: '',
    }));
    setSelectedCompetencies([]);
  };

  const handleFormDeptChange = (deptId: string) => {
    setFormData(prev => ({
      ...prev,
      departmentId: deptId,
      subjectId: '',
      facultyId: '',
      topic: '',
    }));
    setSelectedCompetencies([]);
  };

  const handleFormSubjectChange = (subId: string) => {
    setFormData(prev => ({
      ...prev,
      subjectId: subId,
      facultyId: '',
      topic: '',
    }));
    setSelectedCompetencies([]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const isEdit = !!editingSlot;
    const tenantSlug = getActiveTenantSlug();
    const url = isEdit ? `${API_BASE}/timetable/${editingSlot.id}?tenant=${tenantSlug}` : `${API_BASE}/timetable?tenant=${tenantSlug}`;
    const method = isEdit ? 'PUT' : 'POST';

    // Concatenate selected competency codes
    const compCodesStr = selectedCompetencies.join(', ');

    // Extract TOPIC CODE if matched from Topic Master DB (e.g. "Topic 02(2024)" or "Topic 02")
    let topicCodePayload = formData.topic;
    const matchedTop = subjectTopics.find(t =>
      t.name === formData.topic ||
      t.code === formData.topic ||
      `[${t.code}] ${t.name}` === formData.topic ||
      formData.topic.includes(t.code) ||
      formData.topic.includes(t.name)
    );
    if (matchedTop && matchedTop.code) {
      topicCodePayload = matchedTop.code; // Send topic code in payload as requested!
    }

    // Resolve domain codes for payload — backend expects codes, NOT PostgreSQL UUIDs
    // departmentId → branch_cd or code (the value already comes from dropdown via branch_cd)
    const validDeptId = formData.departmentId || undefined;
    // subjectId → subject code (comes from dropdown via sub.code)
    const validSubId = formData.subjectId || undefined;
    // facultyId → emp_id (comes from dropdown via fac.emp_id)
    const validFacId = formData.facultyId || undefined;
    // batchId → batch code or year (resolve from batches array)
    const activeBatchObj = batches.find((b: any) => b.id === selectedBatch || String(b.id) === String(selectedBatch));
    const validBatchId = activeBatchObj?.code || activeBatchObj?.batch_year || activeBatchObj?.id || selectedBatch || undefined;

    const payload = {
      dayOfWeek: formData.dayOfWeek,
      startTime: formData.startTime,
      endTime: formData.endTime,
      departmentId: validDeptId,
      subjectId: validSubId,
      facultyId: validFacId,
      batchId: validBatchId,
      room: formData.room || undefined,
      slotType: formData.slotType,
      groupName: formData.groupName || undefined,
      topic: topicCodePayload || undefined,
      competencyCodes: compCodesStr || undefined,
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
    if (!confirm('Are you sure you want to delete this scheduled session from PostgreSQL?')) return;
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

  // Color mapping based on Teaching Mode
  const getTeachingModeStyle = (type: string) => {
    const mode = TEACHING_MODES.find(m => m.value.toLowerCase() === (type || '').toLowerCase());
    if (mode) return mode.color;
    return 'bg-[#1E293B] text-slate-200 border-indigo-500/30';
  };



  // TOPIC-WISE COMPETENCY FILTERING (If a Topic is selected, show ONLY competencies for that Topic!)
  const topicWiseCompetenciesList = subjectCompetencies.filter(c => {
    if (!formData.topic) return true; // Show all subject competencies if no topic selected yet

    const matchedTopObj = subjectTopics.find(t =>
      t.name === formData.topic ||
      t.code === formData.topic ||
      `[${t.code}] ${t.name}` === formData.topic ||
      formData.topic.includes(t.code) ||
      formData.topic.includes(t.name)
    );

    if (matchedTopObj) {
      if (c.topic_id && matchedTopObj.id && c.topic_id === matchedTopObj.id) return true;
      if (c.topic_code && matchedTopObj.code && c.topic_code.toUpperCase() === matchedTopObj.code.toUpperCase()) return true;
      if (c.topic_name && matchedTopObj.name && c.topic_name.toUpperCase() === matchedTopObj.name.toUpperCase()) return true;
    }

    // Match topic number in string e.g. Topic 02 -> PY2.1
    const normTopic = formData.topic.toUpperCase();
    if (c.topic_code && normTopic.includes(c.topic_code.toUpperCase())) return true;
    if (c.topic_name && normTopic.includes(c.topic_name.toUpperCase())) return true;

    const topicNumMatch = normTopic.match(/TOPIC\s*0?(\d+)/i);
    if (topicNumMatch && c.code) {
      const topicNum = topicNumMatch[1]; // e.g. "2"
      const compNumMatch = c.code.match(/^[A-Z]+(\d+)\./i);
      if (compNumMatch && compNumMatch[1] === topicNum) return true;
    }

    return false;
  });

  // Further filter by search term input
  const filteredCompetenciesList = topicWiseCompetenciesList.filter(c =>
    (c.code || '').toLowerCase().includes(competencySearchTerm.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(competencySearchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">

      {/* Print-specific style rules to isolate the timetable layout */}
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

          {/* Master Cascading Filters Bar */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1 shadow-md hover:shadow-lg transition-all">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-2">
              <div>
                <h3 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-2">
                  <span>🗓️</span> Cascading Academic Filters
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  Select College ➔ Course ➔ Branch ➔ Batch to load specific timetables.
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

              {/* 1. College Selector */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-sm hover:border-[#5B4BFF]/40 transition-all">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                  <span>🏛️</span> College:
                </span>
                <select
                  value={selectedCollege}
                  onChange={(e) => {
                    const newCol = e.target.value;
                    setSelectedCollege(newCol);
                    const newCourses = getCoursesForCollegeVal(newCol);
                    const firstCourse = newCourses[0]?.name || '';
                    setSelectedCourse(firstCourse);
                    const newBranches = getBranchesForCollegeAndCourseVal(newCol);
                    setSelectedBranch(newBranches[0]?.name || '');
                  }}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer text-xs max-w-[240px] truncate"
                >
                  {collegesList.length > 0 ? (
                    collegesList.map((colg, idx) => (
                      <option key={colg.id || colg.code} value={colg.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        [#{colg.code || idx + 1}] {colg.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="SHRI RAM MURTI SMARAK COLLEGE OF ENGINEERING & TECHNOLOGY, BAREILLY" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">[#1] SHRI RAM MURTI SMARAK COLLEGE OF ENGINEERING & TECHNOLOGY, BAREILLY</option>
                      <option value="SRMS CET, BAREILLY" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">[#1] SRMS CET, BAREILLY</option>
                      <option value="SRMS IMS (Bareilly)" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">[#11] SRMS IMS, BAREILLY</option>
                    </>
                  )}
                </select>
              </div>

              {/* 2. Session Selector */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-sm hover:border-[#5B4BFF]/40 transition-all">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                  <span>🗓️</span> Session:
                </span>
                <select
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer text-xs max-w-[130px] truncate"
                >
                  {sessionsList.length > 0 ? (
                    sessionsList.map((sess) => (
                      <option key={sess.id || sess.code} value={sess.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        {sess.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="2026-2027" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">2026-2027</option>
                      <option value="2025-2026" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">2025-2026</option>
                      <option value="2024-2025" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">2024-2025</option>
                    </>
                  )}
                </select>
              </div>

              {/* 3. Course Selector */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-sm hover:border-[#5B4BFF]/40 transition-all">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                  <span>🎓</span> Course <span className="font-extrabold text-[#5B4BFF] dark:text-indigo-400">({availableCourses.length})</span>:
                </span>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer text-xs max-w-[180px] truncate"
                >
                  {availableCourses.length > 0 ? (
                    availableCourses.map((crs, idx) => (
                      <option key={crs.id || crs.code} value={crs.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        [#{crs.code || idx + 1}] {crs.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="MCA" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">[#3] MCA</option>
                      <option value="B.PHARM" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">[#2] B.PHARM.</option>
                      <option value="B.TECH" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">[#1] B.TECH.</option>
                      <option value="MBA" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">[#4] MBA</option>
                    </>
                  )}
                </select>
              </div>

              {/* 4. Branch Track Selector */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-sm hover:border-[#5B4BFF]/40 transition-all">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                  <span>🏢</span> Branch <span className="font-extrabold text-[#5B4BFF] dark:text-indigo-400">({availableBranches.length})</span>:
                </span>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer text-xs max-w-[180px] truncate"
                >
                  {availableBranches.length > 0 ? (
                    availableBranches.map((br: any, idx: number) => {
                      const courseLabel = br.course_name || br.course_cd || br.course_code;
                      const courseSuffix = courseLabel ? ` - ${courseLabel}` : '';
                      return (
                        <option key={br.id} value={br.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                          [#{br.code || idx + 1}] {br.name}{courseSuffix}
                        </option>
                      );
                    })
                  ) : (
                    <>
                      <option value="General Track" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">[#1] General Track</option>
                      <option value="Computer Science" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">[#2] Computer Science (CSE)</option>
                    </>
                  )}
                </select>
              </div>

              {/* 5. Batch Selector */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800/80 border border-indigo-400/60 dark:border-indigo-700 rounded-xl px-3 py-2 text-xs shadow-sm hover:border-[#5B4BFF] transition-all">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                  <span>👥</span> Batch <span className="font-extrabold text-[#5B4BFF] dark:text-indigo-400">({batches.length})</span> *:
                </span>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-white font-black focus:outline-none cursor-pointer text-xs max-w-[180px] truncate"
                >
                  {batches.map((batch) => (
                    <option key={batch.id || batch.code} value={batch.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      Batch {batch.code} {batch.year ? `(${batch.year})` : ''}
                    </option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          {/* Timetable Section (SRMS College Design System) */}
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
                  SHRI RAM MURTI SMARAK COLLEGE OF ENGINEERING & TECHNOLOGY, BAREILLY
                </h2>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
                  FACULTY OF COMPUTER APPLICATIONS
                </h3>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  TIME TABLE - {selectedCourse.toUpperCase()} (SESSION {selectedSession})
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

                            const cellSlots = slots.filter(s => {
                              if (s.day_of_week !== day.value) return false;
                              const overlaps = (s.start_time.slice(0, 5) === ts.start.slice(0, 5) || (s.start_time < ts.end && s.end_time > ts.start));
                              if (!overlaps) return false;

                              // Ensure slot subject belongs to the active selected Course & Branch!
                              if (availableFormSubjects.length > 0) {
                                const isSubjectInCourse = availableFormSubjects.some(sub =>
                                  String(sub.id) === String(s.subject_id) ||
                                  String(sub.code) === String(s.subject_id) ||
                                  String(sub.code) === String(s.subject_code) ||
                                  (sub.name && s.subject_name && sub.name.toLowerCase().trim() === s.subject_name.toLowerCase().trim())
                                );
                                if (!isSubjectInCourse) return false;
                              }

                              return true;
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
                                      const matchedSub = subjects.find(s => String(s.id) === String(slot.subject_id) || String(s.code) === String(slot.subject_id) || String(s.code) === String(slot.subject_code));
                                      const subName = (slot.subject_name && slot.subject_name !== 'Medical Subject') ? slot.subject_name : (matchedSub?.name || slot.topic || 'Subject Session');
                                      const subCode = (slot.subject_code && slot.subject_code !== 'MBBS') ? slot.subject_code : (matchedSub?.code || '');

                                      const matchedFac = allFaculties.find(f => String(f.id) === String(slot.faculty_id) || String(f.emp_id) === String(slot.faculty_id));
                                      const facName = (slot.faculty_name && slot.faculty_name !== 'Faculty Member') ? slot.faculty_name : (matchedFac?.name || '');

                                      return (
                                        <div
                                          key={slot.id}
                                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-left space-y-1 shadow-sm text-slate-900 dark:text-white"
                                          onClick={(e) => { e.stopPropagation(); handleSlotClick(slot, e); }}
                                          onMouseEnter={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setHoveredSlotInfo({ slot, x: rect.left, y: rect.top });
                                          }}
                                          onMouseLeave={() => setHoveredSlotInfo(null)}
                                        >
                                          <div className="font-extrabold text-slate-900 dark:text-white leading-tight text-[11px] truncate">
                                            {subName}
                                          </div>
                                          <div className="text-[10px] text-slate-700 dark:text-slate-300 font-bold truncate">
                                            {selectedCourse} • {slot.slot_type || 'Lecture'}
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
                    {/* Left Column */}
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
                    {/* Right Column */}
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
        {/* CREATE / EDIT TIMETABLE SLOT MODAL POPUP */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fade-in">
            <div className="relative w-full max-w-xl overflow-hidden shadow-2xl rounded-3xl bg-[#0F172A] border border-indigo-500/30 text-slate-100 flex flex-col max-h-[92vh]">

              {/* Modal Header */}
              <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 px-6 py-4 border-b border-indigo-500/20 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-purple-300 uppercase flex items-center gap-2">
                    <span>⏰</span>
                    <span>{editingSlot ? 'Edit Scheduled Session' : 'Assign Timetable Session'}</span>
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">Configure teaching mode, topic auto-complete, competencies, and assigned faculty.</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl bg-slate-800/60 text-slate-400 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/40 border border-slate-700/60 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-900/40">

                {/* Day of Week */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase text-slate-300 tracking-wider">Day of Week *</label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value, 10) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 text-xs text-white transition-all font-medium"
                  >
                    {currentWeek.weekDays.map(day => (
                      <option key={day.value} value={day.value} className="bg-slate-900 text-white">
                        {day.dayName} ({day.displayDate})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start & End Times + Quick Duration Presets */}
                {(() => {
                  const calculatedDuration = getTimeDifferenceHours(formData.startTime, formData.endTime);
                  const getDurationDisplayBadge = () => {
                    if (calculatedDuration <= 0) return null;
                    if (Math.abs(calculatedDuration - 1) < 0.05) return '1 Hour';
                    if (Math.abs(calculatedDuration - 1.5) < 0.05) return '1.5 Hours';
                    if (Math.abs(calculatedDuration - 2) < 0.05) return '2 Hours';
                    if (Math.abs(calculatedDuration - 3) < 0.05) return '3 Hours';
                    const hours = Math.floor(calculatedDuration);
                    const mins = Math.round((calculatedDuration - hours) * 60);
                    if (hours > 0 && mins > 0) return `${hours} hr ${mins} mins`;
                    if (hours > 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
                    return `${mins} mins`;
                  };

                  return (
                    <div className="space-y-2">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <label className="text-[11px] font-extrabold uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                          <span>⏱️</span> SESSION DURATION & TIME RANGE *
                          {calculatedDuration > 0 && (
                            <span className="ml-1 px-2 py-0.5 text-[10px] font-black rounded-md bg-indigo-500/30 text-indigo-300 border border-indigo-400/40">
                              {getDurationDisplayBadge()}
                            </span>
                          )}
                        </label>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDurationPreset(1)}
                            className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${Math.abs(calculatedDuration - 1) < 0.05
                              ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 shadow-md shadow-indigo-500/30 scale-105'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white'
                              }`}
                          >
                            1 Hour
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDurationPreset(1.5)}
                            className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${Math.abs(calculatedDuration - 1.5) < 0.05
                              ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 shadow-md shadow-indigo-500/30 scale-105'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white'
                              }`}
                          >
                            1.5 Hours
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDurationPreset(2)}
                            className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${Math.abs(calculatedDuration - 2) < 0.05
                              ? 'bg-purple-600 text-white ring-2 ring-purple-400 shadow-md shadow-purple-500/30 scale-105'
                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600 hover:text-white'
                              }`}
                          >
                            2 Hours
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDurationPreset(3)}
                            className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${Math.abs(calculatedDuration - 3) < 0.05
                              ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-md shadow-emerald-500/30 scale-105'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white'
                              }`}
                          >
                            3 Hours
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Start Time</span>
                          <input
                            type="text"
                            required
                            value={formData.startTime}
                            onChange={(e) => handleStartTimeChange(e.target.value)}
                            placeholder="e.g. 08:30:00"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 text-xs text-white font-mono font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">End Time</span>
                          <input
                            type="text"
                            required
                            value={formData.endTime}
                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                            placeholder="e.g. 09:30:00"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 text-xs text-white font-mono font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Mode of Teaching / Session Type */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase text-slate-300 tracking-wider">Mode of Teaching / Session Type *</label>
                  <select
                    value={formData.slotType}
                    onChange={(e) => setFormData({ ...formData, slotType: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-xs text-white transition-all font-medium"
                  >
                    {TEACHING_MODES.map(mode => (
                      <option key={mode.value} value={mode.value} className="bg-slate-900 text-white">{mode.label}</option>
                    ))}
                  </select>
                </div>

                {/* Course, Department & Subject Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                  {/* Course — modal-local, NEVER linked to outer view filters */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase text-indigo-400 tracking-wider">Course *</label>
                    <select
                      value={modalCourse}
                      onChange={(e) => handleModalCourseChange(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 text-xs text-white transition-all font-bold"
                    >
                      {availableCourses.map((crs: any) => (
                        <option key={crs.id || crs.code} value={crs.course_cd || crs.code} className="bg-slate-900 text-white">[#{crs.course_cd || crs.code}] {crs.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Department — driven by modal-local modalBranches, NOT outer availableBranches */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase text-slate-300 tracking-wider">Department</label>
                    <select
                      value={formData.departmentId}
                      onChange={(e) => handleFormDeptChange(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 text-xs text-white transition-all font-medium"
                    >
                      <option value="" className="bg-slate-900 text-white">-- Select Department --</option>
                      {modalBranches.map((br: any, idx: number) => (
                        <option key={br.id} value={br.branch_cd || br.code} className="bg-slate-900 text-white">
                          [#{br.branch_cd || br.code || idx + 1}] {br.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subject — driven by modal-local modalSubjects, NOT outer availableFormSubjects */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase text-slate-300 tracking-wider">Subject</label>
                    <select
                      value={formData.subjectId}
                      onChange={(e) => handleFormSubjectChange(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 text-xs text-white transition-all font-medium"
                    >
                      <option value="" className="bg-slate-900 text-white">-- Select Subject --</option>
                      {modalSubjects.map((sub: any) => (
                        <option key={sub.id} value={sub.code || sub.id} className="bg-slate-900 text-white">
                          {sub.name} ({sub.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* TOPIC AUTO-COMPLETE INPUT (Fetched from Topic Master DB) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-extrabold uppercase text-indigo-400 tracking-wider">
                      Session Topic (Topic Master DB)
                    </label>
                    {subjectTopics.length > 0 && (
                      <span className="text-[9px] font-extrabold text-indigo-300 uppercase tracking-wide">
                        {subjectTopics.length} DB Topic(s)
                      </span>
                    )}
                  </div>

                  <select
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    disabled={!formData.subjectId}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-xs text-white transition-all font-medium disabled:opacity-50"
                  >
                    <option value="" className="bg-slate-900 text-white">-- Select Topic from Topic Master --</option>
                    {subjectTopics.map((top) => (
                      <option key={top.id || top.code} value={top.code || top.name} className="bg-slate-900 text-white">
                        {top.code} : {top.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* TOPIC-WISE NMC CBME COMPETENCIES MULTI-SELECT CHECKLIST */}
                {formData.subjectId && (
                  <div className="space-y-2 p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-black uppercase text-purple-300 tracking-wider flex items-center gap-1.5">
                        <span>🏷️</span> Topic-Wise Competencies ({topicWiseCompetenciesList.length} DB Records)
                      </label>
                      <span className="text-[9px] font-bold text-slate-400">
                        {selectedCompetencies.length} Selected
                      </span>
                    </div>

                    {/* Selected Competencies Badges */}
                    {selectedCompetencies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                        {selectedCompetencies.map(code => {
                          const compObj = subjectCompetencies.find(c => c.code === code);
                          return (
                            <span
                              key={code}
                              onClick={() => toggleCompetency(code)}
                              className="px-2 py-1 text-[10px] font-black rounded-lg bg-purple-600 text-white border border-purple-400/40 flex items-center gap-1 cursor-pointer hover:bg-rose-600 transition-all shadow-sm"
                              title="Click to remove"
                            >
                              <span>[{code}]</span>
                              <span className="max-w-[160px] truncate">{compObj?.description || ''}</span>
                              <span>✕</span>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Search Filter for Competencies */}
                    <input
                      type="text"
                      value={competencySearchTerm}
                      onChange={(e) => setCompetencySearchTerm(e.target.value)}
                      placeholder="Search competency code or statement (e.g. PY2.1)..."
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-700/80 focus:outline-none focus:border-purple-500 text-white placeholder:text-slate-500 font-medium"
                    />

                    {/* Checklist Items */}
                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-800/40">
                      {filteredCompetenciesList.length === 0 ? (
                        <p className="text-[10px] text-slate-400 p-2 italic">
                          {formData.topic
                            ? `No competencies feeded for "${formData.topic}" in Competency Master.`
                            : 'Select a Topic above to view topic-specific competencies.'}
                        </p>
                      ) : (
                        filteredCompetenciesList.map(comp => {
                          const isChecked = selectedCompetencies.includes(comp.code);
                          return (
                            <label
                              key={comp.id || comp.code}
                              className={`flex items-start gap-2.5 p-1.5 rounded-lg cursor-pointer transition-all text-xs ${isChecked ? 'bg-purple-950/60 text-purple-200' : 'hover:bg-slate-800/60 text-slate-300'
                                }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleCompetency(comp.code)}
                                className="mt-0.5 rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-purple-500"
                              />
                              <div>
                                <span className="font-black text-purple-400 mr-1 font-mono">[{comp.code}]</span>
                                <span className="text-[11px] font-medium">{comp.description}</span>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Faculty Selection — driven by modal-local modalFaculties */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-extrabold uppercase text-indigo-400 tracking-wider">
                      Assign Faculty Member
                    </label>
                    {modalFaculties.length > 0 && (
                      <span className="text-[9px] font-extrabold text-emerald-400 uppercase tracking-wide">
                        {modalFaculties.length} Eligible Lecturer(s)
                      </span>
                    )}
                  </div>

                  <select
                    value={formData.facultyId}
                    onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-xs text-white transition-all font-medium"
                  >
                    <option value="" className="bg-slate-900 text-white">-- Choose Assigned Faculty (None) --</option>
                    {modalFaculties.map((fac) => (
                      <option key={fac.id} value={fac.emp_id || fac.staff_code} className="bg-slate-900 text-white">
                        {fac.name} {fac.designation ? `- ${fac.designation}` : ''} ({fac.emp_id || fac.staff_code || fac.id})
                      </option>
                    ))}
                  </select>
                  {modalError && (
                    <div className="text-[11px] font-semibold text-red-400 mt-1 bg-red-950/20 border border-red-800/30 rounded-lg p-2">
                      ⚠️ {modalError}
                    </div>
                  )}
                </div>

                {/* Batch Group & Room Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Batch Group */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase text-slate-300 tracking-wider">Batch Sub-Group</label>
                    <select
                      value={formData.groupName}
                      onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 text-xs text-white transition-all font-medium"
                    >
                      {BATCH_GROUPS.map((grp) => (
                        <option key={grp} value={grp} className="bg-slate-900 text-white">{grp}</option>
                      ))}
                    </select>
                  </div>

                  {/* Room / Location */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold uppercase text-slate-300 tracking-wider">Room / Location</label>
                    <input
                      type="text"
                      value={formData.room}
                      onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                      placeholder="e.g. 209, Lecture Theater 1"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-xs text-white placeholder:text-slate-500 transition-all font-medium"
                    />
                  </div>

                </div>

                {/* Form Action Buttons */}
                <div className="flex items-center justify-between pt-6 border-t border-indigo-500/20">
                  {editingSlot ? (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white font-extrabold text-xs border border-rose-500/30 transition-all shadow-sm"
                    >
                      Delete Session
                    </button>
                  ) : <div />}

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all shadow-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs border border-indigo-400/30 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                    >
                      <span>💾</span>
                      <span>{editingSlot ? 'Save Update' : 'Schedule Session'}</span>
                    </button>
                  </div>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* Clean Black & White Slot Hover Popover */}
        {hoveredSlotInfo && (() => {
          const slot = hoveredSlotInfo.slot;
          const matchedSub = subjects.find(s => String(s.id) === String(slot.subject_id) || String(s.code) === String(slot.subject_id) || String(s.code) === String(slot.subject_code));
          const subName = (slot.subject_name && slot.subject_name !== 'Medical Subject') ? slot.subject_name : (matchedSub?.name || slot.topic || 'Session');
          const subCode = (slot.subject_code && slot.subject_code !== 'MBBS') ? slot.subject_name : (matchedSub?.code || '');

          const matchedFac = allFaculties.find(f => String(f.id) === String(slot.faculty_id) || String(f.emp_id) === String(slot.faculty_id));
          const facName = (slot.faculty_name && slot.faculty_name !== 'Faculty Member') ? slot.faculty_name : (matchedFac?.name || '');

          const competencyList = slot.competency_codes ? slot.competency_codes.split(',').map(c => c.trim()).filter(Boolean) : [];

          return (
            <div
              style={{ top: Math.max(10, hoveredSlotInfo.y - 120), left: Math.min(typeof window !== 'undefined' ? window.innerWidth - 340 : 500, hoveredSlotInfo.x + 10) }}
              className="fixed z-50 w-80 bg-white dark:bg-slate-900 border-2 border-slate-800 dark:border-slate-700 rounded-2xl shadow-2xl p-4 text-slate-900 dark:text-white space-y-3 pointer-events-none"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                  {selectedCourse} • {slot.slot_type || 'Lecture'}
                </span>
                <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                  ⏱️ {slot.start_time} - {slot.end_time}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                  {subName} {subCode ? `(${subCode})` : ''}
                </h4>
                {slot.topic && (
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                    📖 Topic: {slot.topic}
                  </p>
                )}
              </div>

              {competencyList.length > 0 && (
                <div className="space-y-1 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Competencies ({competencyList.length})
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {competencyList.map(code => (
                      <span key={code} className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white rounded border border-slate-300 dark:border-slate-600">
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span>👨‍🏫 {facName || 'Unassigned Faculty'}</span>
                {slot.room && (
                  <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-[10px] border border-slate-300 dark:border-slate-700">
                    Room {slot.room}
                  </span>
                )}
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}
