'use client';

import { useState, useEffect } from 'react';
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
  slot_type: string;
  group_name?: string;
  topic?: string;
  competency_codes?: string;
}

const API_BASE = 'http://localhost:3001/api/v1';
const getActiveTenantSlug = () => (typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') : null) || 'srms-ims';

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
  { start: '08:00:00', end: '09:00:00', label: '08:00 AM' },
  { start: '09:00:00', end: '10:00:00', label: '09:00 AM' },
  { start: '10:00:00', end: '11:00:00', label: '10:00 AM' },
  { start: '11:00:00', end: '12:00:00', label: '11:00 AM' },
  { start: '12:00:00', end: '13:00:00', label: '12:00 PM' },
  { start: '13:00:00', end: '14:00:00', label: '01:00 PM' },
  { start: '14:00:00', end: '15:00:00', label: '02:00 PM' },
  { start: '15:00:00', end: '16:00:00', label: '03:00 PM' },
  { start: '16:00:00', end: '17:00:00', label: '04:00 PM' },
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

const FixedSlotHoverCard = ({
  info,
  allDbCompetencies,
  allDbTopics,
}: {
  info: { slot: TimetableSlot; x: number; y: number } | null;
  allDbCompetencies: CompetencyMasterItem[];
  allDbTopics: TopicMasterItem[];
}) => {
  if (!info) return null;

  const { slot, x, y } = info;
  const { compList, topicFullName } = getCompetenciesForSlot(slot, allDbCompetencies, allDbTopics);

  // Position calculation to stay floating on screen
  const popoverWidth = 380;
  const popoverHeight = 280;
  const leftPos = Math.min(Math.max(16, x - 10), window.innerWidth - popoverWidth - 24);
  const topPos = y - popoverHeight - 12 > 10 ? y - popoverHeight - 12 : y + 90;

  return (
    <div
      style={{ top: `${topPos}px`, left: `${leftPos}px` }}
      className="fixed w-80 sm:w-96 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-2xl backdrop-blur-2xl text-[#1B1E28] dark:text-slate-100 z-[9999] pointer-events-auto transition-all duration-150 animate-fade-in font-sans overflow-hidden"
    >
      {/* Top Deep Purple Ribbon Header */}
      <div className="p-3.5 bg-gradient-to-r from-[#2D2575] to-[#3E3498] text-white flex items-center justify-between text-xs font-black force-text-white border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFF4EC] text-[#D9530F] border border-[#F36C21]/40 font-mono">
            {slot.subject_code || 'SUB'} • {slot.slot_type}
          </span>
          {slot.group_name && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30 truncate">
              👥 {slot.group_name}
            </span>
          )}
        </div>
        <span className="font-mono text-white text-xs font-bold shrink-0">
          🕒 {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Topic Name Section */}
        <div>
          <h4 className="text-sm font-black text-[#1B1E28] dark:text-white leading-snug">
            {slot.subject_name || 'Subject Session'}
          </h4>
          <p className="text-xs font-bold text-[#5B4BFF] dark:text-indigo-400 mt-1 flex items-center gap-1.5">
            <span>📘 Topic:</span>
            <span>{topicFullName || slot.topic || 'General Class Session'}</span>
          </p>
        </div>

        {/* Competency List & Description */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-[#F36C21] uppercase tracking-wider flex items-center gap-1.5">
              <span>🎯 NMC Competencies & Descriptions</span>
              <span className="px-1.5 py-0.2 rounded-full bg-purple-50 text-purple-700 text-[9px] font-mono font-bold">
                {compList.length}
              </span>
            </span>
          </div>

          {compList.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {compList.map((comp, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800/80 border border-[#E7EAF3] dark:border-slate-700 text-xs flex items-start gap-2"
                >
                  <span className="shrink-0 px-2 py-0.5 rounded-md bg-[#5B4BFF]/10 text-[#5B4BFF] dark:text-purple-300 font-mono font-black text-[10px] border border-[#5B4BFF]/20">
                    {comp.code}
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-[#4E5969] dark:text-slate-300 font-medium leading-snug text-[11px]">
                      {comp.description}
                    </p>
                    {comp.topicName && (
                      <span className="text-[9px] text-[#7B8794] block font-mono">
                        Topic: {comp.topicName}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-2.5 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800/40 border border-[#E7EAF3] dark:border-slate-700 text-[11px] text-[#7B8794] italic">
              No explicit NMC competency descriptions linked to this session.
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2.5 bg-[#F6F8FC] dark:bg-slate-800/50 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between text-[11px]">
        <span className="font-black text-[#00C48C]">👨‍🏫 {slot.faculty_name || 'No Lecturer Assigned'}</span>
        <span className="font-bold text-[#1B1E28] dark:text-slate-200">🏫 {slot.room ? `Room ${slot.room}` : 'Main Hall'}</span>
      </div>
    </div>
  );
};

export default function TimetableDesignPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [relevantFaculties, setRelevantFaculties] = useState<Faculty[]>([]);
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

  // Cascading Filter Selection Controls
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedSession, setSelectedSession] = useState('2024-2025');
  const [selectedCourse, setSelectedCourse] = useState('MBBS');
  const [selectedBranch, setSelectedBranch] = useState('General Medicine');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('collegeName');
      if (storedName) setSelectedCollege(storedName);
    }
  }, []);

  // Loading & Alerts
  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form Modal Popup State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  
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
      const slug = getActiveTenantSlug();
      const [deptRes, batchUserRes, batchCollegeRes, subRes, topicRes, compRes] = await Promise.all([
        fetch(`${API_BASE}/users/departments?tenant=${slug}`, { headers }),
        fetch(`${API_BASE}/users/batches?tenant=${slug}`, { headers }),
        fetch(`${API_BASE}/college-master/batches?tenant=${slug}`, { headers }),
        fetch(`${API_BASE}/admin-master/subjects?tenant=${slug}`, { headers }),
        fetch(`${API_BASE}/admin-master/topics?tenant=${slug}`, { headers }),
        fetch(`${API_BASE}/admin-master/competencies?tenant=${slug}`, { headers }),
      ]);

      if (deptRes.ok) {
        const dJson = await deptRes.json();
        const dList = dJson.data || dJson;
        setDepartments(Array.isArray(dList) ? dList : []);
        if (dList.length > 0) setSelectedDept(dList[0].id);
      }

      // Combine Batches from both users/batches and college-master/batches endpoints
      let combinedBatches: Batch[] = [];
      if (batchUserRes.ok) {
        const buJson = await batchUserRes.json();
        const buList = buJson.data || buJson;
        if (Array.isArray(buList)) combinedBatches = [...combinedBatches, ...buList];
      }
      if (batchCollegeRes.ok) {
        const bcJson = await batchCollegeRes.json();
        const bcList = bcJson.data || bcJson;
        if (Array.isArray(bcList)) combinedBatches = [...combinedBatches, ...bcList];
      }

      // Deduplicate by ID
      const uniqueBatches = Array.from(new Map(combinedBatches.map(b => [b.id || b.code, b])).values());

      const finalBatches = uniqueBatches.length > 0 ? uniqueBatches : FALLBACK_BATCHES;
      setBatches(finalBatches);
      if (finalBatches.length > 0) {
        setSelectedBatch(finalBatches[0].id);
      }

      if (subRes.ok) {
        const sJson = await subRes.json();
        setSubjects(sJson.data || sJson);
      }
      if (topicRes.ok) {
        const tJson = await topicRes.json();
        setAllDbTopics(tJson.data || tJson);
      }
      if (compRes.ok) {
        const cJson = await compRes.json();
        setAllDbCompetencies(cJson.data || cJson);
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
      const slug = getActiveTenantSlug();
      const res = await fetch(`${API_BASE}/timetable?tenant=${slug}&batchId=${selectedBatch}`, {
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
      setRelevantFaculties([]);
      return;
    }
    try {
      const slug = getActiveTenantSlug();
      const res = await fetch(`${API_BASE}/timetable/relevant-faculties?tenant=${slug}&subjectId=${subjectId}&departmentId=${deptId || selectedDept}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (res.ok) {
        const json = await res.json();
        setRelevantFaculties(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load relevant faculties', err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDropdowns();
  }, []);

  // Refetch slots when selected batch changes
  useEffect(() => {
    fetchTimetableSlots();
  }, [selectedBatch]);

  // Fetch relevant faculties when subject or department changes in form
  useEffect(() => {
    fetchRelevantFaculties(formData.subjectId, formData.departmentId);
  }, [formData.subjectId, formData.departmentId]);

  // Dynamically Filter Topics and Competencies from Admin Master DB when Subject changes!
  useEffect(() => {
    if (!formData.subjectId) {
      setSubjectTopics([]);
      setSubjectCompetencies([]);
      return;
    }

    const subObj = subjects.find(s => s.id === formData.subjectId);
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
    const [h, m, s] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, s || 0);
    date.setMinutes(date.getMinutes() + Math.round(hoursToAdd * 60));
    const finalH = String(date.getHours()).padStart(2, '0');
    const finalM = String(date.getMinutes()).padStart(2, '0');
    return `${finalH}:${finalM}:00`;
  };

  const handleDurationPreset = (hours: number) => {
    const newEnd = addHoursToTime(formData.startTime, hours);
    setFormData(prev => ({ ...prev, endTime: newEnd }));
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
    setFormData({
      dayOfWeek: dayVal,
      startTime: timeStart,
      endTime: defaultEnd,
      departmentId: selectedDept || (departments[0]?.id || ''),
      subjectId: '',
      facultyId: '',
      room: '',
      slotType: 'Lecture',
      groupName: 'Whole Batch (All Students)',
      topic: '',
    });
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
    setIsModalOpen(true);
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
    const slug = getActiveTenantSlug();
    const url = isEdit ? `${API_BASE}/timetable/${editingSlot.id}?tenant=${slug}` : `${API_BASE}/timetable?tenant=${slug}`;
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

    // Whitelisted body payload with sanitized UUIDs
    const validDeptId = isUUID(formData.departmentId) ? formData.departmentId : (isUUID(selectedDept) ? selectedDept : undefined);
    const validSubId = isUUID(formData.subjectId) ? formData.subjectId : undefined;
    const validFacId = isUUID(formData.facultyId) ? formData.facultyId : undefined;
    const validBatchId = isUUID(selectedBatch) ? selectedBatch : (isUUID(batches[0]?.id) ? batches[0]?.id : undefined);

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
      }
    } catch (err) {
      showAlert('error', 'Network error while saving timetable slot.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingSlot) return;
    if (!confirm('Are you sure you want to delete this scheduled session from PostgreSQL?')) return;
    setLoading(true);
    try {
      const slug = getActiveTenantSlug();
      const res = await fetch(`${API_BASE}/timetable/${editingSlot.id}?tenant=${slug}`, {
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

  // Filtered subjects based on selected department in form
  const availableFormSubjects = subjects.filter(s => {
    if (!formData.departmentId) return true;
    return s.department_id === formData.departmentId;
  });

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
    c.code.toLowerCase().includes(competencySearchTerm.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(competencySearchTerm.toLowerCase())
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] text-[#1B1E28] font-sans">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 8mm 10mm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { background: #fff !important; }

          /* Hide all screen-only elements */
          .no-print { display: none !important; }
          nav, aside, header { display: none !important; }

          /* Show print section */
          .print-only { display: block !important; }
          #timetable-print-root { display: block !important; }

          /* Expand print root to full page */
          body, html { margin: 0; padding: 0; }
          #timetable-print-root {
            position: fixed;
            top: 0; left: 0;
            width: 100%;
            font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
          }

          .print-grid {
            border-collapse: collapse;
            width: 100%;
            font-size: 8pt;
          }
          .print-grid th, .print-grid td {
            border: 1px solid #d1d5db;
            padding: 4px 5px;
            vertical-align: top;
            min-width: 0;
          }
          .print-grid th {
            background: #2D2575 !important;
            color: #fff !important;
            text-align: center;
            font-weight: 800;
            font-size: 8pt;
            white-space: nowrap;
          }
          .print-grid td.time-col {
            background: #f3f0ff !important;
            color: #2D2575 !important;
            font-weight: 700;
            text-align: center;
            white-space: nowrap;
            font-size: 7.5pt;
          }
          .print-slot {
            border-radius: 3px;
            padding: 3px 4px;
            margin-bottom: 2px;
            font-size: 7.5pt;
          }
          .print-header-logo { background: linear-gradient(135deg, #2D2575, #5B4BFF) !important; }
          .print-footer { border-top: 2px solid #2D2575; margin-top: 4mm; padding-top: 3mm; }
        }
        @media screen {
          .print-only { display: none !important; }
        }
      `}</style>
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Medical College Timetable Designer" />
        <main className="p-6 space-y-5 flex-1 flex flex-col bg-[#F6F8FC]">
          
          {alert && (
            <div className={`p-4 rounded-2xl border text-xs font-extrabold transition-all shadow-lg animate-fade-in flex items-center gap-2 ${
              alert.type === 'success' 
                ? 'bg-[#EDFFF8] text-[#00C48C] border-[#00C48C]/30' 
                : 'bg-[#FFF2F2] text-[#F04438] border-[#F04438]/30'
            }`}>
              <span>{alert.type === 'success' ? '✅' : '⚠️'}</span>
              <span>{alert.message}</span>
            </div>
          )}

          {/* Master Cascading Filters Bar */}
          <div className="rounded-[22px] bg-white border border-[#E7EAF3] shadow-sm hover:shadow-md transition-all overflow-hidden">
            {/* Bar Title */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-3 border-b border-[#E7EAF3] bg-gradient-to-r from-[#F6F8FC] to-white gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-sm">🗓️</div>
                <div>
                  <h3 className="text-xs font-black uppercase text-[#2D2575] tracking-wider">Cascading Academic Filters</h3>
                  <p className="text-[11px] text-[#4E5969] font-medium mt-0.5">Select College ➔ Course ➔ Branch ➔ Batch</p>
                </div>
              </div>
              {/* Week Navigation */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] p-1 rounded-xl border border-[#E7EAF3]">
                <button onClick={() => setWeekOffset(prev => prev - 1)}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white border border-[#E7EAF3] hover:bg-[#EEF2FF] hover:text-[#5B4BFF] hover:border-[#5B4BFF]/30 text-[#4E5969] transition-all shadow-sm">
                  ◀ Prev
                </button>
                <button onClick={() => setWeekOffset(0)}
                  className="px-4 py-1.5 text-xs font-black rounded-lg bg-gradient-to-r from-[#2D2575] to-[#5B4BFF] text-white shadow-md">
                  Current Week
                </button>
                <button onClick={() => setWeekOffset(prev => prev + 1)}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white border border-[#E7EAF3] hover:bg-[#EEF2FF] hover:text-[#5B4BFF] hover:border-[#5B4BFF]/30 text-[#4E5969] transition-all shadow-sm">
                  Next ▶
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-4">
              {/* 1. College */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-[#4E5969] tracking-wider">Active College</label>
                <div className="w-full px-3 py-2 text-xs rounded-xl bg-[#EEF2FF] border border-[#5B4BFF]/20 text-[#2D2575] font-bold truncate">
                  {selectedCollege || (typeof window !== 'undefined' ? localStorage.getItem('collegeName') : null) || 'Current Institution'}
                </div>
              </div>

              {/* 2. Session */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-[#4E5969] tracking-wider">Session</label>
                <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#F6F8FC] border border-[#E7EAF3] focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-[#5B4BFF]/10 text-[#1B1E28] font-medium transition-all">
                  <option value="2024-2025">2024 – 2025</option>
                  <option value="2025-2026">2025 – 2026</option>
                </select>
              </div>

              {/* 3. Course */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-[#4E5969] tracking-wider">Course</label>
                <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#F6F8FC] border border-[#E7EAF3] focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-[#5B4BFF]/10 text-[#1B1E28] font-medium transition-all">
                  <option value="MBBS">MBBS (Undergraduate)</option>
                  <option value="MD/MS">MD / MS (Postgraduate)</option>
                  <option value="BDS">BDS (Dental)</option>
                </select>
              </div>

              {/* 4. Branch Track */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-[#4E5969] tracking-wider">Branch Track</label>
                <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#F6F8FC] border border-[#E7EAF3] focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-[#5B4BFF]/10 text-[#1B1E28] font-medium transition-all">
                  <option value="General Medicine">General Track</option>
                  <option value="Clinical Rotation">Clinical Rotation</option>
                </select>
              </div>

              {/* 5. Batch */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-[#5B4BFF] tracking-wider">Batch *</label>
                <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#F6F8FC] border-2 border-[#5B4BFF]/40 focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-[#5B4BFF]/10 text-[#2D2575] font-black transition-all">
                  {batches.map((batch) => (
                    <option key={batch.id || batch.code} value={batch.id || batch.code}>
                      Batch {batch.code} {batch.year ? `(${batch.year})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Print Button Bar */}
          <div className="flex items-center justify-between no-print">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-[#5B4BFF] to-[#F36C21]" />
              <h3 className="text-sm font-black text-[#1B1E28] dark:text-white uppercase tracking-wide">Weekly Teaching Schedule</h3>
            </div>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#2D2575] to-[#5B4BFF] text-white shadow-lg hover:shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all duration-200 border border-white/10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Landscape Timetable (A4)
            </button>
          </div>

          {/* ═══ PRINT-ONLY PREMIUM LANDSCAPE TIMETABLE ═══ */}
          <div id="timetable-print-root" className="hidden print-only" style={{display:'none'}}>
            {/* Institutional Header */}
            <div className="print-header-logo" style={{background:'linear-gradient(135deg,#2D2575,#5B4BFF)',color:'#fff',padding:'8px 14px',borderRadius:'6px 6px 0 0',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div>
                <div style={{fontSize:'13pt',fontWeight:900,letterSpacing:'0.03em'}}>
                  {selectedCollege || (typeof window !== 'undefined' ? localStorage.getItem('collegeName') : null) || 'Medical Research Institute'}
                </div>
                <div style={{fontSize:'8pt',fontWeight:600,opacity:0.85,marginTop:'2px'}}>
                  Weekly Academic Timetable &nbsp;|&nbsp; {selectedCourse} — {selectedBranch} &nbsp;|&nbsp; Session: {selectedSession}
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:'8pt',fontWeight:700,opacity:0.9}}>MedERP — CBME Timetable System</div>
                <div style={{fontSize:'7pt',opacity:0.7,marginTop:'2px'}}>Batch: {batches.find(b => b.id === selectedBatch)?.code || selectedBatch} &nbsp;|&nbsp; Generated: {new Date().toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'})}</div>
              </div>
            </div>

            {/* Print Table */}
            <table className="print-grid" style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr>
                  <th style={{width:'9%',padding:'5px',background:'#2D2575',color:'#fff',fontSize:'8pt',textAlign:'center',border:'1px solid #d1d5db'}}>TIME</th>
                  {currentWeek.weekDays.map(day => (
                    <th key={day.value} style={{background:'#2D2575',color:'#fff',fontSize:'8pt',textAlign:'center',border:'1px solid #d1d5db',padding:'5px'}}>
                      <div style={{fontWeight:900}}>{day.dayName.toUpperCase()}</div>
                      <div style={{fontSize:'7pt',fontWeight:600,opacity:0.85}}>{day.displayDate}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((tSlot, rowIdx) => (
                  <tr key={tSlot.start} style={{background: rowIdx % 2 === 0 ? '#fafafa' : '#ffffff'}}>
                    <td className="time-col" style={{background:'#f3f0ff',color:'#2D2575',textAlign:'center',fontWeight:700,fontSize:'7.5pt',border:'1px solid #d1d5db',padding:'4px 3px',whiteSpace:'nowrap'}}>
                      <div style={{fontWeight:900}}>{tSlot.start.slice(0,5)}</div>
                      <div style={{fontSize:'6.5pt',opacity:0.7}}>–{tSlot.end.slice(0,5)}</div>
                    </td>
                    {currentWeek.weekDays.map(day => {
                      const cellSlots = slots.filter(s =>
                        s.day_of_week === day.value &&
                        s.start_time.slice(0,5) === tSlot.start.slice(0,5)
                      );
                      return (
                        <td key={day.value} style={{border:'1px solid #d1d5db',padding:'3px',verticalAlign:'top',minWidth:0}}>
                          {cellSlots.length === 0 ? (
                            <div style={{color:'#d1d5db',textAlign:'center',fontSize:'7pt'}}>—</div>
                          ) : cellSlots.map(cell => {
                            const modeClass = `print-slot-type-${cell.slot_type}`;
                            const slotBg = cell.slot_type === 'Practical' ? '#F3EEFF' :
                              cell.slot_type === 'DOAP' ? '#ECFDF5' :
                              cell.slot_type === 'SGT' ? '#FFFBEB' :
                              cell.slot_type === 'Tutorial' ? '#FFF7ED' :
                              cell.slot_type === 'SDL' ? '#ECFEFF' :
                              cell.slot_type === 'Seminar' ? '#FDF2F8' :
                              cell.slot_type === 'Lunch Break' ? '#f8fafc' :
                              cell.slot_type === 'Clinical Posting' ? '#FFF1F2' : '#EEF2FF';
                            const slotBorder = cell.slot_type === 'Practical' ? '#7C3AED' :
                              cell.slot_type === 'DOAP' ? '#059669' :
                              cell.slot_type === 'SGT' ? '#D97706' :
                              cell.slot_type === 'Tutorial' ? '#EA580C' :
                              cell.slot_type === 'SDL' ? '#0891B2' :
                              cell.slot_type === 'Seminar' ? '#DB2777' :
                              cell.slot_type === 'Lunch Break' ? '#94a3b8' :
                              cell.slot_type === 'Clinical Posting' ? '#E11D48' : '#5B4BFF';
                            return (
                              <div key={cell.id} className={`print-slot ${modeClass}`}
                                style={{background:slotBg,borderLeft:`3px solid ${slotBorder}`,borderRadius:'3px',padding:'3px 4px',marginBottom:'2px'}}>
                                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                                  <span style={{fontWeight:900,fontSize:'7.5pt',color:'#2D2575'}}>{cell.subject_code || 'SUB'}</span>
                                  <span style={{fontSize:'6.5pt',color:'#D9530F',fontWeight:700,textTransform:'uppercase',marginLeft:'2px'}}>{cell.slot_type}</span>
                                </div>
                                {cell.subject_name && <div style={{fontWeight:700,fontSize:'7pt',color:'#1B1E28',lineHeight:'1.2',marginTop:'1px'}}>{cell.subject_name}</div>}
                                {cell.topic && <div style={{fontSize:'6pt',color:'#5B4BFF',fontWeight:600,marginTop:'1px',fontStyle:'italic'}}>📖 {cell.topic}</div>}
                                {cell.faculty_name && <div style={{fontSize:'6.5pt',color:'#00C48C',fontWeight:700,marginTop:'2px'}}>👤 {cell.faculty_name}</div>}
                                {cell.room && <div style={{fontSize:'6pt',color:'#64748b',marginTop:'1px'}}>🏫 Room {cell.room}</div>}
                                {cell.group_name && cell.group_name !== 'Whole Batch (All Students)' && <div style={{fontSize:'6pt',color:'#7C3AED',marginTop:'1px'}}>👥 {cell.group_name}</div>}
                                {cell.competency_codes && <div style={{fontSize:'5.5pt',color:'#7C3AED',fontWeight:700,marginTop:'2px'}}>🎯 {cell.competency_codes}</div>}
                              </div>
                            );
                          })}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Print Footer */}
            <div className="print-footer" style={{borderTop:'2px solid #2D2575',marginTop:'4mm',paddingTop:'3mm',display:'flex',justifyContent:'space-between',fontSize:'7pt',color:'#4E5969'}}>
              <div>
                <strong style={{color:'#2D2575'}}>Legend:</strong>&nbsp;
                <span style={{background:'#EEF2FF',borderLeft:'3px solid #5B4BFF',padding:'1px 5px',marginRight:'4px',fontSize:'6.5pt'}}>Lecture</span>
                <span style={{background:'#F3EEFF',borderLeft:'3px solid #7C3AED',padding:'1px 5px',marginRight:'4px',fontSize:'6.5pt'}}>Practical</span>
                <span style={{background:'#ECFDF5',borderLeft:'3px solid #059669',padding:'1px 5px',marginRight:'4px',fontSize:'6.5pt'}}>DOAP</span>
                <span style={{background:'#FFFBEB',borderLeft:'3px solid #D97706',padding:'1px 5px',marginRight:'4px',fontSize:'6.5pt'}}>SGT</span>
                <span style={{background:'#ECFEFF',borderLeft:'3px solid #0891B2',padding:'1px 5px',marginRight:'4px',fontSize:'6.5pt'}}>SDL</span>
                <span style={{background:'#FDF2F8',borderLeft:'3px solid #DB2777',padding:'1px 5px',fontSize:'6.5pt'}}>Seminar</span>
              </div>
              <div style={{textAlign:'right',opacity:0.7}}>MedERP CBME Platform &nbsp;·&nbsp; Confidential — For Internal Academic Use Only</div>
            </div>
          </div>

          {/* Timetable Weekly Grid (Screen Only) */}
          <div className="bg-white border border-[#E7EAF3] rounded-[22px] flex-1 min-h-[540px] overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-all no-print">

            {/* Header Days with Dates */}
            <div className="grid grid-cols-7 border-b border-[#E7EAF3] text-center bg-gradient-to-r from-[#2D2575] via-[#3A2F8A] to-[#5B4BFF]">
              <div className="border-r border-white/20 px-2 py-3 flex flex-col items-center justify-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Time</span>
                <span className="text-[8px] text-white/50 font-mono mt-0.5">Slot</span>
              </div>
              {currentWeek.weekDays.map(day => (
                <div key={day.value} className={`py-3 px-1 ${day.value !== 6 ? 'border-r border-white/20' : ''}`}>
                  <p className="text-white font-black text-xs uppercase tracking-wide">{day.dayName}</p>
                  <p className="text-[10px] text-white/60 font-mono mt-0.5">{day.displayDate}</p>
                </div>
              ))}
            </div>

            {/* Time Rows */}
            <div className="flex-1 divide-y divide-[#E7EAF3] overflow-y-auto">
              {TIME_SLOTS.map((slot, rowIdx) => (
                <div key={slot.start} className={`grid grid-cols-7 min-h-[90px] ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-[#FAFBFF]'}`}>

                  {/* Time Duration Label */}
                  <div className="border-r border-[#E7EAF3] flex flex-col justify-center items-center px-2 py-3 text-center bg-[#F6F8FC] select-none">
                    <span className="font-mono font-black text-[11px] text-[#2D2575]">{slot.start.slice(0, 5)}</span>
                    <span className="text-[9px] text-[#9BA5B5] font-mono mt-0.5">–{slot.end.slice(0, 5)}</span>
                  </div>

                  {/* Day Columns */}
                  {currentWeek.weekDays.map((day) => {
                    const cellSlots = slots.filter(s =>
                      s.day_of_week === day.value &&
                      s.start_time.slice(0, 5) === slot.start.slice(0, 5)
                    );
                    const slotBg = (type: string) => (
                      type === 'Practical' ? {bg:'#F3EEFF', border:'#7C3AED', badge:'bg-purple-100 text-purple-700'} :
                      type === 'DOAP' ? {bg:'#ECFDF5', border:'#059669', badge:'bg-emerald-100 text-emerald-700'} :
                      type === 'SGT' ? {bg:'#FFFBEB', border:'#D97706', badge:'bg-amber-100 text-amber-700'} :
                      type === 'Tutorial' ? {bg:'#FFF7ED', border:'#EA580C', badge:'bg-orange-100 text-orange-700'} :
                      type === 'SDL' ? {bg:'#ECFEFF', border:'#0891B2', badge:'bg-cyan-100 text-cyan-700'} :
                      type === 'Seminar' ? {bg:'#FDF2F8', border:'#DB2777', badge:'bg-pink-100 text-pink-700'} :
                      type === 'Clinical Posting' ? {bg:'#FFF1F2', border:'#E11D48', badge:'bg-rose-100 text-rose-700'} :
                      type === 'Lunch Break' ? {bg:'#F8FAFC', border:'#94a3b8', badge:'bg-slate-100 text-slate-500'} :
                      {bg:'#EEF2FF', border:'#5B4BFF', badge:'bg-indigo-100 text-indigo-700'}
                    );

                    return (
                      <div
                        key={day.value}
                        onClick={() => handleGridCellClick(day.value, slot.start, slot.end)}
                        className="p-1.5 border-r border-[#E7EAF3] flex flex-col gap-1.5 transition-all hover:bg-[#EEF2FF]/50 cursor-pointer group"
                      >
                        {cellSlots.length === 0 && (
                          <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] text-[#5B4BFF] font-bold">+ Add</span>
                          </div>
                        )}
                        {cellSlots.map(cell => {
                          const style = slotBg(cell.slot_type);
                          return (
                            <div
                              key={cell.id}
                              onClick={(e) => handleSlotClick(cell, e)}
                              onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setHoveredSlotInfo({ slot: cell, x: rect.left, y: rect.top });
                              }}
                              onMouseLeave={() => setHoveredSlotInfo(null)}
                              style={{background: style.bg, borderLeft: `3px solid ${style.border}`}}
                              className="rounded-xl text-xs flex flex-col gap-0.5 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all border border-transparent hover:border-[#5B4BFF]/20 p-2"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-black text-[11px] text-[#1B1E28]">{cell.subject_code || 'SUB'}</span>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${style.badge}`}>
                                  {cell.slot_type}
                                </span>
                              </div>

                              <p className="font-bold text-[10px] leading-tight text-[#1B1E28] line-clamp-2">
                                {cell.subject_name || cell.topic || cell.slot_type}
                              </p>

                              {cell.topic && (
                                <p className="text-[9px] text-[#5B4BFF] font-semibold truncate">📖 {cell.topic}</p>
                              )}

                              {cell.competency_codes && (
                                <div className="flex flex-wrap gap-0.5 mt-0.5">
                                  {cell.competency_codes.split(',').slice(0,3).map(cCode => (
                                    <span key={cCode.trim()} className="text-[7px] font-black uppercase px-1 py-0.5 rounded bg-white/80 text-purple-700 border border-purple-200">
                                      {cCode.trim()}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <div className="mt-1 pt-1 border-t border-black/5 flex flex-col gap-0.5">
                                <p className="truncate font-bold text-[9px] text-[#00C48C] flex items-center gap-0.5">
                                  <span>👤</span>
                                  <span>{cell.faculty_name || 'No Lecturer'}</span>
                                </p>
                                {cell.room && <span className="text-[8px] text-[#9BA5B5]">🏫 {cell.room}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Floating Hover Popover for Timetable Slot Cards */}
      <FixedSlotHoverCard
        info={hoveredSlotInfo}
        allDbCompetencies={allDbCompetencies}
        allDbTopics={allDbTopics}
      />

      {/* CREATE / EDIT TIMETABLE SLOT MODAL POPUP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B1E28]/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl overflow-hidden shadow-2xl rounded-[22px] bg-white border border-[#E7EAF3] text-[#1B1E28] flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#2D2575] via-[#3A2F8A] to-[#5B4BFF] px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black tracking-wide text-white uppercase flex items-center gap-2">
                  <span>⏰</span>
                  <span>{editingSlot ? 'Edit Scheduled Session' : 'Assign Timetable Session'}</span>
                </h2>
                <p className="text-[11px] text-white/60 font-medium mt-0.5">Configure teaching mode, topic, NMC competencies, and faculty.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-white/10 text-white/70 hover:text-white hover:bg-white/20 border border-white/20 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 flex-1 bg-white">
              
              {/* Day of Week */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase text-[#4E5969] tracking-wider">Day of Week *</label>
                <select
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value, 10) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] border border-[#E7EAF3] focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-[#5B4BFF]/10 text-xs text-[#1B1E28] transition-all font-medium"
                >
                  {currentWeek.weekDays.map(day => (
                    <option key={day.value} value={day.value}>
                      {day.dayName} ({day.displayDate})
                    </option>
                  ))}
                </select>
              </div>

              {/* Start & End Times + Quick Duration Presets */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-extrabold uppercase text-[#5B4BFF] tracking-wider">
                    Session Duration & Time Range *
                  </label>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => handleDurationPreset(1)}
                      className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-[#EEF2FF] text-[#5B4BFF] border border-[#5B4BFF]/20 hover:bg-[#5B4BFF] hover:text-white transition-all">
                      1 Hour
                    </button>
                    <button type="button" onClick={() => handleDurationPreset(1.5)}
                      className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-[#EEF2FF] text-[#5B4BFF] border border-[#5B4BFF]/20 hover:bg-[#5B4BFF] hover:text-white transition-all">
                      1.5 Hours
                    </button>
                    <button type="button" onClick={() => handleDurationPreset(2)}
                      className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-[#F3EEFF] text-[#7C3AED] border border-[#7C3AED]/20 hover:bg-[#7C3AED] hover:text-white transition-all">
                      2 Hours
                    </button>
                    <button type="button" onClick={() => handleDurationPreset(3)}
                      className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-[#ECFDF5] text-[#059669] border border-[#059669]/20 hover:bg-[#059669] hover:text-white transition-all">
                      3 Hours
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#4E5969] uppercase">Start Time</span>
                    <input type="text" required value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      placeholder="e.g. 08:00:00"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] border border-[#E7EAF3] focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-[#5B4BFF]/10 text-xs text-[#1B1E28] font-mono font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#4E5969] uppercase">End Time</span>
                    <input type="text" required value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      placeholder="e.g. 09:30:00"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] border border-[#E7EAF3] focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-[#5B4BFF]/10 text-xs text-[#1B1E28] font-mono font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Mode of Teaching */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase text-[#4E5969] tracking-wider">Mode of Teaching / Session Type *</label>
                <select value={formData.slotType} onChange={(e) => setFormData({ ...formData, slotType: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F6F8FC] border border-[#E7EAF3] focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-[#5B4BFF]/10 text-xs text-[#1B1E28] transition-all font-medium">
                  {TEACHING_MODES.map(mode => (
                    <option key={mode.value} value={mode.value}>{mode.label}</option>
                  ))}
                </select>
              </div>

              {/* Department & Subject Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Department */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase text-[#4E5969] tracking-wider">Department</label>
                  <select value={formData.departmentId} onChange={(e) => handleFormDeptChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] border border-[#E7EAF3] focus:outline-none focus:border-[#5B4BFF] text-xs text-[#1B1E28] transition-all font-medium">
                    <option value="">-- Select Department --</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase text-[#4E5969] tracking-wider">Subject</label>
                  <select value={formData.subjectId} onChange={(e) => handleFormSubjectChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] border border-[#E7EAF3] focus:outline-none focus:border-[#5B4BFF] text-xs text-[#1B1E28] transition-all font-medium">
                    <option value="">-- Select Subject --</option>
                    {availableFormSubjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* TOPIC AUTO-COMPLETE INPUT (Fetched from Topic Master DB) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-extrabold uppercase text-[#5B4BFF] tracking-wider">Session Topic (Topic Master DB)</label>
                  {subjectTopics.length > 0 && (
                    <span className="text-[9px] font-extrabold text-[#5B4BFF] uppercase tracking-wide">{subjectTopics.length} DB Topic(s)</span>
                  )}
                </div>
                <select value={formData.topic} onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  disabled={!formData.subjectId}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F6F8FC] border border-[#E7EAF3] focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-[#5B4BFF]/10 text-xs text-[#1B1E28] transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                  <option value="">-- Select Topic from Topic Master --</option>
                  {subjectTopics.map((top) => (
                    <option key={top.id || top.code} value={top.code || top.name}>{top.code} : {top.name}</option>
                  ))}
                </select>
              </div>

              {/* TOPIC-WISE NMC CBME COMPETENCIES MULTI-SELECT CHECKLIST */}
              {formData.subjectId && (
                <div className="space-y-2 p-4 rounded-[18px] bg-[#F3F0FF] border border-[#5B4BFF]/20">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-black uppercase text-[#5B4BFF] tracking-wider flex items-center gap-1.5">
                      <span>🏷️</span> Topic-Wise Competencies ({topicWiseCompetenciesList.length} DB Records)
                    </label>
                    <span className="text-[9px] font-bold text-[#4E5969]">{selectedCompetencies.length} Selected</span>
                  </div>

                  {/* Selected Competency Badges */}
                  {selectedCompetencies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-white border border-[#E7EAF3]">
                      {selectedCompetencies.map(code => {
                        const compObj = subjectCompetencies.find(c => c.code === code);
                        return (
                          <span key={code} onClick={() => toggleCompetency(code)}
                            className="px-2 py-1 text-[10px] font-black rounded-lg bg-[#5B4BFF] text-white border border-[#5B4BFF]/20 flex items-center gap-1 cursor-pointer hover:bg-[#F04438] transition-all shadow-sm"
                            title="Click to remove">
                            <span>[{code}]</span>
                            <span className="max-w-[140px] truncate">{compObj?.description || ''}</span>
                            <span>✕</span>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Search Filter */}
                  <input type="text" value={competencySearchTerm}
                    onChange={(e) => setCompetencySearchTerm(e.target.value)}
                    placeholder="Search competency code or statement (e.g. PY2.1)..."
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-white border border-[#E7EAF3] focus:outline-none focus:border-[#5B4BFF] text-[#1B1E28] placeholder:text-[#9BA5B5] font-medium"
                  />

                  {/* Checklist Items */}
                  <div className="max-h-40 overflow-y-auto space-y-0.5 pr-1">
                    {filteredCompetenciesList.length === 0 ? (
                      <p className="text-[10px] text-[#9BA5B5] p-2 italic">
                        {formData.topic
                          ? `No competencies found for "${formData.topic}" in Competency Master.`
                          : 'Select a Topic above to view topic-specific competencies.'}
                      </p>
                    ) : (
                      filteredCompetenciesList.map(comp => {
                        const isChecked = selectedCompetencies.includes(comp.code);
                        return (
                          <label key={comp.id || comp.code}
                            className={`flex items-start gap-2.5 p-1.5 rounded-lg cursor-pointer transition-all text-xs border ${
                              isChecked
                                ? 'bg-[#EEF2FF] border-[#5B4BFF]/30 text-[#2D2575]'
                                : 'border-transparent hover:bg-white hover:border-[#E7EAF3] text-[#4E5969]'
                            }`}>
                            <input type="checkbox" checked={isChecked} onChange={() => toggleCompetency(comp.code)}
                              className="mt-0.5 rounded border-[#E7EAF3] text-[#5B4BFF] focus:ring-[#5B4BFF]"
                            />
                            <div>
                              <span className="font-black text-[#5B4BFF] mr-1 font-mono">[{comp.code}]</span>
                              <span className="text-[11px] font-medium">{comp.description}</span>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Faculty Selection */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-extrabold uppercase text-[#5B4BFF] tracking-wider">Assign Faculty Member</label>
                  {relevantFaculties.length > 0 && (
                    <span className="text-[9px] font-extrabold text-[#00C48C] uppercase tracking-wide">{relevantFaculties.length} Eligible</span>
                  )}
                </div>
                <select value={formData.facultyId} onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F6F8FC] border border-[#E7EAF3] focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-[#5B4BFF]/10 text-xs text-[#1B1E28] transition-all font-medium">
                  <option value="">-- Choose Assigned Faculty (None) --</option>
                  {relevantFaculties.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name} ({fac.emp_id}) {fac.priority === 1 ? '⭐ Primary' : '👥 Dept'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch Group & Room Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase text-[#4E5969] tracking-wider">Batch Sub-Group</label>
                  <select value={formData.groupName} onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] border border-[#E7EAF3] focus:outline-none focus:border-[#5B4BFF] text-xs text-[#1B1E28] transition-all font-medium">
                    {BATCH_GROUPS.map((grp) => (
                      <option key={grp} value={grp}>{grp}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase text-[#4E5969] tracking-wider">Room / Location</label>
                  <input type="text" value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    placeholder="e.g. 209, Lecture Theater 1"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F6F8FC] border border-[#E7EAF3] focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-[#5B4BFF]/10 text-xs text-[#1B1E28] placeholder:text-[#9BA5B5] transition-all font-medium"
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-between pt-5 border-t border-[#E7EAF3]">
                {editingSlot ? (
                  <button type="button" onClick={handleDelete}
                    className="px-4 py-2.5 rounded-xl bg-[#FFF2F2] hover:bg-[#F04438] text-[#F04438] hover:text-white font-extrabold text-xs border border-[#F04438]/30 transition-all shadow-sm">
                    Delete Session
                  </button>
                ) : <div />}
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-[#F6F8FC] hover:bg-[#E7EAF3] text-[#4E5969] font-bold text-xs border border-[#E7EAF3] transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#2D2575] to-[#5B4BFF] hover:from-[#3A2F8A] hover:to-[#7867FF] text-white font-extrabold text-xs shadow-lg shadow-[#5B4BFF]/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2">
                    <span>💾</span>
                    <span>{editingSlot ? 'Save Update' : 'Schedule Session'}</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
