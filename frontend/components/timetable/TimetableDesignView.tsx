'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from '../Sidebar';
import Header from '../Header';
import { filterCompetenciesForSlot, filterCompetencyCodesString } from '@/app/utils/competencyFilter';
import TimeFormatDesigner, { TimeSlotConfig } from './TimeFormatDesigner';

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
  unit_id?: string;
  unit_code?: string;
  unit_name?: string;
  description?: string;
  [key: string]: any;
}

interface CompetencyMasterItem {
  id: string;
  subject_id?: string;
  topic_id?: string;
  code: string;
  description: string;
  name?: string;
  subject_name?: string;
  subject_code?: string;
  topic_name?: string;
  topic_code?: string;
  unit_id?: string;
  unit_code?: string;
  [key: string]: any;
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
  postgres_id?: string;
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
  [key: string]: any;
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

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

const DEFAULT_CAMERAS: CameraItem[] = [
  { camera_id: 1, classroom: 'Web Cam', camera_ip: '0' },
  { camera_id: 2, classroom: 'Lecture Hall 1', camera_ip: '0' },
  { camera_id: 3, classroom: 'Lecture Hall 2', camera_ip: '0' },
  { camera_id: 4, classroom: 'Computer Lab 1', camera_ip: '0' },
  { camera_id: 5, classroom: 'Computer Lab 2', camera_ip: '0' },
  { camera_id: 6, classroom: 'Seminar Hall', camera_ip: '0' },
];

const DAYS_OF_WEEK = [
  { value: 1, name: 'MONDAY' },
  { value: 2, name: 'TUESDAY' },
  { value: 3, name: 'WEDNESDAY' },
  { value: 4, name: 'THURSDAY' },
  { value: 5, name: 'FRIDAY' },
  { value: 6, name: 'SATURDAY' },
];

interface SearchableDropdownOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  altValues?: string[];
}

interface SearchableDropdownProps {
  options: SearchableDropdownOption[];
  value: string;
  onChange: (val: string, opt?: SearchableDropdownOption) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  allowCustom?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  error?: boolean;
  displayValueFallback?: string;
}

function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder = '-- Select --',
  searchPlaceholder = 'Type to search...',
  allowCustom = false,
  disabled = false,
  required = false,
  className = '',
  error = false,
  displayValueFallback = '',
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const selectedOption = useMemo(() => {
    const valStr = String(value || '').trim().toLowerCase();
    if (!valStr) return undefined;
    return options.find(o => 
      String(o.value || '').trim().toLowerCase() === valStr || 
      String(o.label || '').trim().toLowerCase() === valStr ||
      (o.badge && String(o.badge).trim().toLowerCase() === valStr) ||
      (o.altValues && o.altValues.some(av => String(av || '').trim().toLowerCase() === valStr))
    );
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const term = searchTerm.toLowerCase();
    return options.filter(o =>
      (o.label && o.label.toLowerCase().includes(term)) ||
      (o.sublabel && o.sublabel.toLowerCase().includes(term)) ||
      (o.badge && o.badge.toLowerCase().includes(term)) ||
      (o.value && String(o.value).toLowerCase().includes(term)) ||
      (o.altValues && o.altValues.some(av => String(av).toLowerCase().includes(term)))
    );
  }, [options, searchTerm]);

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 p-2.5 rounded-xl border text-left font-bold text-xs transition-all outline-none ${
          error
            ? 'border-2 border-rose-500 bg-rose-50/20 text-rose-900 dark:text-rose-100 ring-4 ring-rose-500/10'
            : isOpen
            ? 'border-[#5B4BFF] ring-2 ring-[#5B4BFF]/20 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:border-slate-400'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className="truncate flex items-center gap-1.5 flex-1">
          {selectedOption ? (
            <>
              {selectedOption.badge && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 shrink-0 font-bold">
                  {selectedOption.badge}
                </span>
              )}
              <span className="truncate">{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal truncate">
                  {selectedOption.sublabel}
                </span>
              )}
            </>
          ) : (displayValueFallback || value) ? (
            <span className="truncate text-slate-800 dark:text-slate-200">
              {displayValueFallback || value}
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 font-normal">{placeholder}</span>
          )}
        </span>
        <span className="text-slate-400 shrink-0 text-[10px] transition-transform duration-200">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {required && (
        <input
          tabIndex={-1}
          autoComplete="off"
          style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
          value={value || ''}
          onChange={() => {}}
          required={required}
        />
      )}

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-60 flex flex-col animate-in fade-in-50 zoom-in-95 duration-150">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 sticky top-0 flex items-center gap-1.5">
            <span className="text-slate-400 text-xs pl-1">🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400 placeholder:font-normal"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-slate-400 hover:text-slate-600 text-xs pr-1"
              >
                ✕
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value) || opt.label === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value, opt);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2.5 text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-[#5B4BFF] font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate flex-1">
                      {opt.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0 font-bold">
                          {opt.badge}
                        </span>
                      )}
                      <span className="truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal truncate">
                          {opt.sublabel}
                        </span>
                      )}
                    </div>
                    {isSelected && <span className="text-[#5B4BFF] text-sm shrink-0 font-black">✓</span>}
                  </button>
                );
              })
            ) : allowCustom && searchTerm.trim() ? (
              <button
                type="button"
                onClick={() => {
                  onChange(searchTerm.trim());
                  setIsOpen(false);
                }}
                className="w-full text-left p-3 text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold hover:bg-indigo-100 cursor-pointer flex items-center gap-2"
              >
                <span>➕</span>
                <span>Use custom: &ldquo;{searchTerm.trim()}&rdquo;</span>
              </button>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function extractArray<T = any>(json: any): T[] {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  if (Array.isArray(json.data?.data)) return json.data.data;
  if (Array.isArray(json.data)) return json.data;
  if (Array.isArray(json.items)) return json.items;
  if (Array.isArray(json.data?.items)) return json.data.items;
  return [];
}

const CLERK_STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  DRAFT: { cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', label: 'Draft' },
  PENDING_HOD_APPROVAL: { cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-300 dark:border-amber-700', label: '⏳ Pending HOD Approval' },
  HOD_APPROVED: { cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700', label: '✅ Live — HOD Approved' },
  HOD_REJECTED: { cls: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-300 dark:border-rose-700', label: '⚠️ HOD Requested Revisions (Reschedule Required)' },
};

interface ClerkSlot {
  id?: string;
  dayOfWeek: number;
  day_of_week?: number;
  startTime: string;
  start_time?: string;
  endTime: string;
  end_time?: string;
  subjectId?: string;
  subject_id?: string;
  subjectName: string;
  subject_name?: string;
  subjectCode?: string;
  subject_code?: string;
  linkcd?: string;
  electiveflg?: string;
  facultyId?: string;
  faculty_id?: string;
  facultyName: string;
  faculty_name?: string;
  facultyEmpId?: string;
  faculty_code?: string;
  unitName?: string;
  unit_name?: string;
  unitId?: string;
  unit_id?: string;
  topic?: string;
  subTopics?: string;
  sub_topics?: string;
  competencyCodes?: string;
  competency_codes?: string;
  room?: string;
  cameraId?: string;
  slotType?: string;
  slot_type?: string;
  groupValue?: string;
  group_value?: string;
  groupName?: string;
  section?: string;
  status?: string;
  srmsPayload?: any;
  pgPayload?: any;
  colgCd?: string;
  colg_cd?: string;
  courseCd?: string;
  course_cd?: string;
  branchCd?: string;
  branch_cd?: string;
  batchCd?: string;
  batch_cd?: string;
  semester?: string;
  effectiveFrom?: string;
  effectiveUntil?: string;
  [key: string]: any;
}
const EMPTY_CLERK_SLOT: ClerkSlot = {
  dayOfWeek: 1,
  startTime: '09:00',
  endTime: '10:00',
  subjectName: '',
  facultyName: '',
  room: '',
};

export default function TimetableDesignView({
  sidebarRole = 'admin',
  mode = 'admin',
}: {
  sidebarRole?: 'admin' | 'clerk';
  mode?: 'admin' | 'clerk';
} = {}) {
  // Top Level Navigation Tabs: 1. Course-Department Time Format | 2. Design - TimeTable (or Timetable Designer for Clerk)
  const [activeTab, setActiveTab] = useState<'format' | 'design' | 'copy'>(mode === 'clerk' ? 'design' : 'format');

  // Strict 6-Level Hierarchy Selected Codes (Numeric codes only per RestrictAPI.md!)
  const [selectedCollege, setSelectedCollege] = useState('1');
  const [selectedCourse, setSelectedCourse] = useState('0'); // 0 = unselected on load
  const [selectedBranch, setSelectedBranch] = useState('0'); // 0 = unselected on load
  const [selectedBatch, setSelectedBatch] = useState('0'); // 0 = unselected on load
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('0'); // 0 = unselected on load
  const [selectedSection, setSelectedSection] = useState('0'); // 0 = unselected on load
  const [selectedSession, setSelectedSession] = useState('16'); // Fallback session
  const [slots, setSlots] = useState<TimetableSlot[]>([]);

  // ── Clerk Timetable Drafts State ──────────────────────────────────────────
  const [clerkDrafts, setClerkDrafts] = useState<any[]>([]);
  const [activeDraft, setActiveDraft] = useState<any | null>(null);
  const activeDraftRef = useRef<any>(null);
  const [loadingClerkDrafts, setLoadingClerkDrafts] = useState(false);
  const [submittingClerkDraft, setSubmittingClerkDraft] = useState(false);
  const [sendingClerkDraftId, setSendingClerkDraftId] = useState<string | null>(null);
  const [showClerkDraftForm, setShowClerkDraftForm] = useState(false);
  const [clerkDraftForm, setClerkDraftForm] = useState({
    title: '',
    departmentId: '',
    semester: '',
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    notes: '',
  });

  const loadDraftIntoGrid = (draft: any) => {
    if (!draft) return;
    setActiveDraft(draft);
    activeDraftRef.current = draft;
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeClerkDraftId', draft.id);
    }
    const rawSlots: any[] = typeof draft.slots === 'string' ? JSON.parse(draft.slots || '[]') : (draft.slots || []);
    if (rawSlots.length === 0) {
      if (mode === 'clerk') {
        setSlots([]);
      }
      return;
    }
    const mappedSlots: TimetableSlot[] = rawSlots.map((item: any, idx: number) => ({
      id: item.id || `draft_slot_${idx}`,
      day_of_week: Number(item.dayOfWeek ?? item.day_of_week ?? 1),
      start_time: item.startTime || item.start_time || '09:00:00',
      end_time: item.endTime || item.end_time || '10:00:00',
      subject_id: String(item.subjectId || item.subject_id || ''),
      subject_code: String(item.subjectCode || item.subject_code || ''),
      subject_name: item.subjectName || item.subject_name || item.topic || 'Subject',
      faculty_id: String(item.facultyId || item.faculty_id || item.facultyEmpId || ''),
      faculty_name: item.facultyName || item.faculty_name || 'Faculty',
      faculty_code: item.facultyEmpId || item.faculty_code || '',
      room: item.room || 'Room 204',
      slotType: item.slotType || item.slot_type || 'Lecture',
      slot_type: item.slotType || item.slot_type || 'Lecture',
      topic: item.topic || '',
      unit_name: item.unitName || item.unit_name || '',
      unit_id: item.unitId || item.unit_id || '',
      sub_topics: item.subTopics || item.sub_topics || '',
      competency_codes: item.competencyCodes || item.competency_codes || '',
      hodRemark: item.hodRemark || item.hod_remark || item.remark || (draft.hod_remarks && rawSlots.length === 1 ? draft.hod_remarks : ''),
      hod_remark: item.hodRemark || item.hod_remark || item.remark || (draft.hod_remarks && rawSlots.length === 1 ? draft.hod_remarks : ''),
      status: draft.status || 'DRAFT',
      isDraft: true,
    }));
    setSlots(mappedSlots);
  };

  const loadClerkDrafts = async (
    forceTargetId?: string,
    isSilent: boolean = false,
    filterOverrides?: { course?: string; branch?: string; batch?: string; semester?: string; section?: string },
  ) => {
    if (!isSilent && clerkDrafts.length === 0) {
      setLoadingClerkDrafts(true);
    }
    try {
      const slug = (typeof window !== 'undefined' ? (localStorage.getItem('tenantSlug') || '').replace(/^tenant_/, '') : '') || 'srms-cet-bareilly';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const headers: any = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'x-tenant-slug': slug,
        'Content-Type': 'application/json',
      };
      const r = await fetch(`/api/v1/exams/timetable-drafts?tenant=${slug}`, { headers, cache: 'no-store' });
      const d = await r.json();
      const rawList = Array.isArray(d) ? d : (d.data || []);
      setClerkDrafts(rawList);

      // Resolve the active filters: explicit overrides take priority, then state
      const targetCourse   = filterOverrides?.course   ?? selectedCourse;
      const targetBranch   = filterOverrides?.branch   ?? selectedBranch;
      const targetBatch    = filterOverrides?.batch    ?? selectedBatch;
      const targetSemester = filterOverrides?.semester ?? selectedSemester;
      const targetSection  = filterOverrides?.section  ?? selectedSection;

      let target: any = null;

      // Priority 1: explicit draft ID
      if (forceTargetId) {
        target = rawList.find((x: any) => String(x.id) === String(forceTargetId)) || null;
      }

      // Priority 2: match by full academic hierarchy (only in clerk mode when filters are complete)
      if (!target && mode === 'clerk' &&
          targetCourse && targetCourse !== '0' &&
          targetBranch && targetBranch !== '0' &&
          targetBatch  && targetBatch  !== '0' &&
          targetSemester && targetSemester !== '0' &&
          targetSection  && targetSection  !== '0') {

        const matchingDrafts = rawList.filter((x: any) => {
          return (
            String(x.course_cd  || '') === String(targetCourse) &&
            String(x.branch_cd  || '') === String(targetBranch) &&
            String(x.batch_cd   || '') === String(targetBatch) &&
            String(x.semester   || '') === String(targetSemester) &&
            (!x.section || String(x.section) === String(targetSection))
          );
        });

        target = matchingDrafts.find((x: any) => !x.status || x.status === 'DRAFT') ||
                 matchingDrafts.find((x: any) => x.status === 'HOD_REJECTED') ||
                 matchingDrafts.find((x: any) => x.status === 'PENDING_HOD_APPROVAL') ||
                 matchingDrafts.find((x: any) => x.status === 'HOD_APPROVED') ||
                 matchingDrafts[0] || null;

        // If NO matching draft found for this specific course/branch/batch/sem/sec: clear the grid
        if (!target) {
          setActiveDraft(null);
          activeDraftRef.current = null;
          setSlots([]);
          if (typeof window !== 'undefined') localStorage.removeItem('activeClerkDraftId');
          return;
        }
      }

      // Priority 3 (non-clerk or partial filters): fall back to cached active draft
      if (!target && !filterOverrides) {
        const cachedId = activeDraftRef.current?.id || activeDraft?.id || (typeof window !== 'undefined' ? localStorage.getItem('activeClerkDraftId') : null);
        if (cachedId) {
          target = rawList.find((x: any) => String(x.id) === String(cachedId)) || null;
        }
      }

      // Priority 4: course-level fallback for admin
      if (!target && mode === 'admin' && targetCourse && targetCourse !== '0') {
        const courseDrafts = rawList.filter((x: any) => String(x.course_cd || '') === String(targetCourse));
        target = courseDrafts.find((x: any) => x.status === 'HOD_APPROVED') || null;
      }

      if (target) {
        const isCurrentActive = activeDraftRef.current?.id === target.id;
        setActiveDraft(target);
        activeDraftRef.current = target;
        if (typeof window !== 'undefined') localStorage.setItem('activeClerkDraftId', target.id);
        if (!isCurrentActive) {
          loadDraftIntoGrid(target);
        }
      } else {
        setActiveDraft(null);
        activeDraftRef.current = null;
        if (typeof window !== 'undefined') localStorage.removeItem('activeClerkDraftId');
      }
    } catch {
      // Keep clerk drafts intact on network error
    } finally {
      setLoadingClerkDrafts(false);
    }
  };

  useEffect(() => {
    loadClerkDrafts();
    const interval = setInterval(() => {
      loadClerkDrafts(undefined, true);
    }, 30000);
    return () => clearInterval(interval);
  }, [mode]);

  const handleSelectDraft = async (d: any) => {
    setActiveDraft(d);
    activeDraftRef.current = d;
    if (typeof window !== 'undefined') localStorage.setItem('activeClerkDraftId', d.id);
    const colgVal = d.colg_cd || selectedCollege || '1';
    const courseVal = d.course_cd || selectedCourse;
    const branchVal = d.branch_cd || selectedBranch;
    const batchVal = d.batch_cd || selectedBatch;
    const semVal = d.semester || selectedSemester;
    const secVal = d.section || selectedSection;

    if (d.colg_cd) setSelectedCollege(d.colg_cd);
    if (d.course_cd) setSelectedCourse(d.course_cd);
    if (d.branch_cd) setSelectedBranch(d.branch_cd);
    if (d.batch_cd) setSelectedBatch(d.batch_cd);
    if (d.semester) setSelectedSemester(d.semester);
    if (d.section) setSelectedSection(d.section);

    // Pre-populate cascading dropdowns so the header selectors match the draft
    if (colgVal && courseVal && courseVal !== '0') {
      try {
        const branches = await fetchBranchesForCourse(colgVal, courseVal, departmentsList);
        setBranchesList(branches);
        if (branchVal && branchVal !== '0') {
          const batches = await fetchBatchesForCourse(colgVal, courseVal, branchVal);
          setBatchesList(batches);
          if (batchVal && batchVal !== '0') {
            const semesters = await fetchSemestersForCourse(colgVal, courseVal, branchVal, batchVal);
            setSemestersList(semesters);
            if (semVal && semVal !== '0') {
              await fetchSectionsForCourse(colgVal, courseVal, branchVal, batchVal, semVal);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to pre-populate draft dropdown options:', err);
      }
    }

    loadDraftIntoGrid(d);
    showAlert('info', `Loaded timetable draft: ${d.title}`);
  };


  const handleAddNewLectureModal = () => {
    handleGridCellClick(1, '09:00:00', '10:00:00');
  };

  const saveNewClerkDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingClerkDraft(true);
    try {
      const slug = (typeof window !== 'undefined' ? (localStorage.getItem('tenantSlug') || '').replace(/^tenant_/, '') : '') || 'srms-cet-bareilly';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const headers: any = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'x-tenant-slug': slug,
        'Content-Type': 'application/json',
      };
      const res = await fetch(`/api/v1/exams/timetable-drafts?tenant=${slug}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: clerkDraftForm.title,
          colgCd: selectedCollege || '1',
          courseCd: selectedCourse || '13',
          branchCd: selectedBranch || '1',
          batchCd: selectedBatch || '2',
          departmentId: clerkDraftForm.departmentId || selectedDept || '',
          semester: clerkDraftForm.semester || selectedSemester || '3',
          section: selectedSection || '1',
          academicYear: clerkDraftForm.academicYear,
          notes: clerkDraftForm.notes,
          slots: [],
        }),
      });
      const data = await res.json();
      const created = data?.data || data;
      setShowClerkDraftForm(false);
      setClerkDraftForm({
        title: '',
        departmentId: '',
        semester: '',
        academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        notes: '',
      });
      if (created?.id) {
        setActiveDraft(created);
        activeDraftRef.current = created;
        if (typeof window !== 'undefined') {
          localStorage.setItem('activeClerkDraftId', created.id);
        }
        loadDraftIntoGrid(created);
      }
      await loadClerkDrafts(created?.id);

      showAlert('success', 'New timetable draft created! You can now add lectures to it.');
    } catch {
      showAlert('error', 'Failed to create timetable draft');
    } finally {
      setSubmittingClerkDraft(false);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (!confirm('Are you sure you want to delete this timetable draft?')) return;
    try {
      const slug = (typeof window !== 'undefined' ? (localStorage.getItem('tenantSlug') || '').replace(/^tenant_/, '') : '') || 'srms-cet-bareilly';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const res = await fetch(`/api/v1/exams/timetable-drafts?id=${draftId}&tenant=${slug}`, {
        method: 'DELETE',
        headers: {
          'x-tenant-slug': slug,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        showAlert('success', 'Timetable draft deleted successfully');
        if (activeDraft?.id === draftId) {
          setActiveDraft(null);
          setSlots([]);
        }
        await loadClerkDrafts();
      } else {
        showAlert('error', 'Failed to delete timetable draft');
      }
    } catch {
      showAlert('error', 'Failed to delete timetable draft');
    }
  };

  const submitDraftToHod = async (draftId: string) => {
    setSendingClerkDraftId(draftId);
    try {
      const slug = (typeof window !== 'undefined' ? (localStorage.getItem('tenantSlug') || '').replace(/^tenant_/, '') : '') || 'srms-cet-bareilly';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const headers: any = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'x-tenant-slug': slug,
        'Content-Type': 'application/json',
      };
      await fetch(`/api/v1/exams/timetable-drafts/submit-for-approval?tenant=${slug}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ draftId }),
      });
      await loadClerkDrafts();
      showAlert('success', 'Timetable submitted to HOD for approval');
    } catch {
      showAlert('error', 'Failed to submit timetable to HOD');
    } finally {
      setSendingClerkDraftId(null);
    }
  };

  // ── Copy TimeTable Tab State ──────────────────────────────────────────────
  const getCopyWeekDefault = (offsetDays = 0) => {
    const d = new Date();
    const day = d.getDay();
    const mon = new Date(d);
    mon.setDate(d.getDate() - day + (day === 0 ? -6 : 1) + offsetDays);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6); // Monday + 6 = Sunday (7 days total, as required by SRMS)
    const fmt = (dd: Date) => `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, '0')}-${String(dd.getDate()).padStart(2, '0')}`;
    return { from: fmt(mon), to: fmt(sun) };
  };
  const [copyFromDate, setCopyFromDate] = useState(() => getCopyWeekDefault(0).from);
  const [copyToDate, setCopyToDate] = useState(() => getCopyWeekDefault(0).to);
  const [copyFromDate1new, setCopyFromDate1new] = useState(() => getCopyWeekDefault(7).from);
  const [copyToDate1new, setCopyToDate1new] = useState(() => getCopyWeekDefault(7).to);
  const [copyLoading, setCopyLoading] = useState(false);
  const [copyResult, setCopyResult] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [configuredTimeSlots, setConfiguredTimeSlots] = useState<TimeSlotConfig[]>(DEFAULT_TIME_SLOTS);


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
  const [semestersList, setSemestersList] = useState<DropdownItem[]>([]);
  const [sectionsList, setSectionsList] = useState<DropdownItem[]>([
    { id: '1', code: '1', name: 'Section A' },
    { id: '2', code: '2', name: 'Section B' },
    { id: '3', code: '3', name: 'Section C' },
    { id: '4', code: '4', name: 'Section D' },
  ]);
  const [departmentsList, setDepartmentsList] = useState<DropdownItem[]>([]);
  const [sessionsList, setSessionsList] = useState<DropdownItem[]>([]);


  // Live SRMS Timetable Subjects from EmployeeInfo.asmx/Loadsubject
  const [srmsTimetableSubjects, setSrmsTimetableSubjects] = useState<any[]>([]);
  const [syncingTimetable, setSyncingTimetable] = useState(false);

  // Live SRMS Cameras from EmployeeInfo.asmx/LoadCamera
  const [camerasList, setCamerasList] = useState<CameraItem[]>(DEFAULT_CAMERAS);
  const [cameraLoading, setCameraLoading] = useState(false);

  // Load custom time format template from Database (with localStorage fallback) when college/course/dept changes
  useEffect(() => {
    let isCancelled = false;
    if (!selectedCourse || selectedCourse === '0') {
      return;
    }
    const fetchFormat = async () => {
      try {
        const slug = getActiveTenantSlug();
        const c = selectedCollege || '1';
        const cr = selectedCourse;
        const b = (selectedBranch && selectedBranch !== '0' && !selectedBranch.includes('-') && !isNaN(Number(selectedBranch))) ? selectedBranch : '1';
        const dept = selectedDept || '';
        const res = await fetch(`/api/v1/exams/timetable-format?colgcd=${c}&course=${cr}&branch=${b}&dept=${dept}&tenant=${slug}`, {
          headers: { 'x-tenant-slug': slug },
          cache: 'no-store',
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0 && !isCancelled) {
          setConfiguredTimeSlots(json.data);
          return;
        }
      } catch (err) {
        console.warn('Failed to load format from database:', err);
      }

      if (activeDraft?.format_slots && Array.isArray(activeDraft.format_slots) && !isCancelled) {
        setConfiguredTimeSlots(activeDraft.format_slots);
        return;
      }

      if (typeof window !== 'undefined' && !isCancelled) {
        const storageKey = `srms_time_format_${selectedCollege}_${selectedCourse}_${selectedBranch !== '0' ? selectedBranch : 'all'}`;
        const saved = localStorage.getItem(storageKey) || localStorage.getItem('srms_time_format_default');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setConfiguredTimeSlots(parsed);
              return;
            }
          } catch { }
        }
      }
    };

    fetchFormat();
    return () => { isCancelled = true; };
  }, [selectedCollege, selectedCourse, selectedBranch, selectedDept, activeDraft]);

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
    if (mode !== 'clerk') {
      fetchTimetableSlots(newDate);
    }
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
    if (mode !== 'clerk') {
      fetchTimetableSlots(newDate);
    }
  };

  const handleToday = () => {
    const newDate = new Date();
    setCurrentDate(newDate);
    if (mode !== 'clerk') {
      fetchTimetableSlots(newDate);
    }
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
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [facultyCrossSlots, setFacultyCrossSlots] = useState<any[]>([]);
  const modalScrollRef = useRef<HTMLDivElement>(null);

  const showAlert = (type: 'success' | 'error' | 'info' | 'warning', message: string, duration = 6000) => {
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

  const SRMS_COLLEGE_SLUG_MAP: Record<string, string> = {
    '1': 'srms-cet-bareilly',
    '2': 'srms-cetr-bareilly',
    '3': 'srms-cet-unnao',
    '4': 'srms-college-of-law',
    '5': 'srms-ibs-lucknow',
    '6': 'srms-iahs-bareilly',
    '7': 'srms-trust-bareilly',
    '8': 'srms-nursing-school',
    '9': 'srms-nursing-college',
    '10': 'srms-riddhima-bareilly',
    '11': 'srms-ims',
    '12': 'srms-college-of-nursing-paramedical-sciences-unnao',
    '13': 'srms-quiz-panel',
    '14': 'srms-cricket-academy',
  };

  const getActiveTenantSlug = (colgOverride?: string): string => {
    const targetCol = String(colgOverride || selectedCollege || '').trim();
    if (SRMS_COLLEGE_SLUG_MAP[targetCol]) {
      return SRMS_COLLEGE_SLUG_MAP[targetCol];
    }
    const col = findMatchingCollege(targetCol);
    if (col?.slug) return col.slug;

    if (typeof window !== 'undefined') {
      const savedSlug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant');
      if (savedSlug && savedSlug !== 'all') {
        const matchingCol = collegesList.find(c => c.slug === savedSlug || c.id === savedSlug || c.code === savedSlug);
        if (matchingCol?.slug) return matchingCol.slug;
        return savedSlug;
      }
    }
    return userTenantSlug || 'srms-cet-bareilly';
  };

  // Helper Memoized Selected Objects
  const selectedCollegeObj = useMemo(() => {
    return findMatchingCollege(selectedCollege);
  }, [collegesList, selectedCollege]);

  const selectedCourseObj = useMemo(() => {
    if (!coursesList || coursesList.length === 0 || !selectedCourse || selectedCourse === '0') return null;
    return coursesList.find(c => String(c.code) === String(selectedCourse) || String(c.course_cd) === String(selectedCourse) || c.name === selectedCourse) || null;
  }, [coursesList, selectedCourse]);

  const selectedBranchObj = useMemo(() => {
    if (!branchesList || branchesList.length === 0 || !selectedBranch || selectedBranch === '0') return null;
    return branchesList.find(b => String(b.code) === String(selectedBranch) || String(b.branch_cd) === String(selectedBranch) || String(b.id) === String(selectedBranch) || b.name === selectedBranch) || null;
  }, [branchesList, selectedBranch]);

  const selectedBatchObj = useMemo(() => {
    if (!batchesList || batchesList.length === 0 || !selectedBatch || selectedBatch === '0') return null;
    return batchesList.find(b => String(b.code) === String(selectedBatch) || String(b.batch_cd) === String(selectedBatch) || String(b.year) === String(selectedBatch) || String(b.id) === String(selectedBatch)) || null;
  }, [batchesList, selectedBatch]);

  const availableDepartments = useMemo(() => {
    if (!departmentsList || departmentsList.length === 0) return [];
    if (!selectedCourse || selectedCourse === '0') return departmentsList;
    const crsCd = selectedCourseObj?.code || selectedCourse;
    const filtered = departmentsList.filter((d: any) => {
      if (!d) return false;
      if (!d.course_cd) return true;
      return String(d.course_cd) === String(crsCd) || d.course_name === selectedCourseObj?.name;
    });
    return filtered.length > 0 ? filtered : departmentsList;
  }, [departmentsList, selectedCourseObj, selectedCourse]);

  const selectedDeptObj = useMemo(() => {
    if (!availableDepartments || availableDepartments.length === 0 || !selectedDept) return null;
    return availableDepartments.find(d => String(d.id) === String(selectedDept) || String(d.code) === String(selectedDept) || d.name === selectedDept) || null;
  }, [availableDepartments, selectedDept]);

  // When modal is open and a faculty is selected, fetch all slots assigned to this faculty across all courses/branches/batches
  useEffect(() => {
    if (!isModalOpen) {
      setFacultyCrossSlots([]);
      return;
    }
    const targetFacId = formData.facultyId || formData.facultyEmpId;
    if (!targetFacId) {
      setFacultyCrossSlots([]);
      return;
    }

    let isSubscribed = true;
    const loadFacultySlots = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
        const activeSlug = getActiveTenantSlug();
        const res = await fetch(`${API_BASE}/timetable?tenant=${activeSlug}&facultyId=${encodeURIComponent(targetFacId)}`, {
          headers: {
            'x-tenant-slug': activeSlug,
            'x-tenant-id': activeSlug,
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          cache: 'no-store',
        });
        if (res.ok && isSubscribed) {
          const json = await res.json();
          if (Array.isArray(json?.data)) {
            setFacultyCrossSlots(json.data);
          }
        }
      } catch (e) {
        // Continue gracefully
      }
    };

    loadFacultySlots();
    return () => { isSubscribed = false; };
  }, [isModalOpen, formData.facultyId, formData.facultyEmpId]);

  // Live Clash Detection: Check if selected faculty is already engaged in another course/batch/slot on the same day & time
  const liveClash = useMemo(() => {
    if (!isModalOpen || loading) return null;
    const targetFacId = formData.facultyId || formData.facultyEmpId;
    const targetFacName = (formData.facultyName || '').toLowerCase().trim();
    if (!targetFacId && !targetFacName) return null;

    const day = formData.dayOfWeek;
    const start = (formData.startTime || '08:30:00').slice(0, 5);
    const end = (formData.endTime || '09:30:00').slice(0, 5);
    if (!start || !end) return null;

    // Merge active course slots + cross-course DB slots + all OTHER clerk draft slots
    const candidateSlotsMap = new Map<string, any>();
    for (const s of (slots || [])) {
      if (s?.id) candidateSlotsMap.set(String(s.id), s);
    }
    for (const s of (facultyCrossSlots || [])) {
      if (s?.id && !candidateSlotsMap.has(String(s.id))) {
        candidateSlotsMap.set(String(s.id), s);
      }
    }
    // Also check clerk drafts for other courses (pending/draft) that haven't been pushed to DB yet
    for (const draft of (clerkDrafts || [])) {
      // Skip the currently active draft — we already have those slots in `slots`
      if (activeDraft && String(draft.id) === String(activeDraft.id)) continue;
      const draftSlotList: any[] = typeof draft.slots === 'string'
        ? JSON.parse(draft.slots || '[]')
        : (Array.isArray(draft.slots) ? draft.slots : []);
      for (const s of draftSlotList) {
        const sid = String(s.id || `${draft.id}_${s.dayOfWeek || s.day_of_week}_${s.startTime || s.start_time}`);
        if (!candidateSlotsMap.has(sid)) {
          // Normalise field names for consistent clash comparison
          candidateSlotsMap.set(sid, {
            ...s,
            id: sid,
            day_of_week: Number(s.dayOfWeek ?? s.day_of_week ?? 0),
            start_time:  s.startTime  || s.start_time  || '',
            end_time:    s.endTime    || s.end_time    || '',
            faculty_id:  s.facultyId  || s.faculty_id  || '',
            faculty_name: s.facultyName || s.faculty_name || '',
            faculty_code: s.facultyEmpId || s.faculty_code || '',
            course_cd:   s.courseCd   || s.course_cd   || draft.course_cd || '',
            branch_cd:   s.branchCd   || s.branch_cd   || draft.branch_cd || '',
            batch_cd:    s.batchCd    || s.batch_cd    || draft.batch_cd  || '',
            semester:    s.semester   || draft.semester || '',
            section:     s.section    || draft.section  || '',
            subject_name: s.subjectName || s.subject_name || s.topic || '',
            _fromDraft: draft.id,
          });
        }
      }
    }
    const candidateSlots = Array.from(candidateSlotsMap.values());

    const editingSlotId = editingSlot?.id ? String(editingSlot.id) : null;
    const editingPgId = editingSlot?.postgres_id ? String(editingSlot.postgres_id) : null;

    // Check against all candidate slots
    const clash = candidateSlots.find((s) => {
      const sId = String(s.id || '');
      const sPgId = s.postgres_id ? String(s.postgres_id) : '';
      if (editingSlotId && (sId === editingSlotId || (sPgId && sPgId === editingSlotId))) return false;
      if (editingPgId && (sId === editingPgId || (sPgId && sPgId === editingPgId))) return false;
      if (Number(s.day_of_week) !== Number(day)) return false;

      const sStart = String(s.start_time || '').slice(0, 5);
      const sEnd = String(s.end_time || '').slice(0, 5);
      const timesOverlap = (start < sEnd && end > sStart);
      if (!timesOverlap) return false;

      // Check faculty match (must not match generic empty or default values)
      const validFacId = targetFacId && targetFacId !== '0' && targetFacId !== 'undefined';
      const validFacName = targetFacName && targetFacName.length > 2 && targetFacName !== 'faculty' && targetFacName !== 'faculty member';

      const facMatch = (
        (validFacId && (
          (s.faculty_id && String(s.faculty_id) === String(targetFacId)) || 
          (s.faculty_code && String(s.faculty_code) === String(targetFacId)) ||
          (s.faculty_uuid && String(s.faculty_uuid) === String(targetFacId))
        )) ||
        (validFacName && s.faculty_name && s.faculty_name.toLowerCase().includes(validFacName))
      );
      return facMatch;
    });

    if (clash) {
      const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const dayName = days[clash.day_of_week] || `Day ${clash.day_of_week}`;
      const timeRange = `${String(clash.start_time).slice(0, 5)} - ${String(clash.end_time).slice(0, 5)}`;
      const facName = clash.faculty_name || formData.facultyName || 'Faculty';

      // Dynamic course name — look up from coursesList state, fall back to raw code only
      const matchedCourse = Array.isArray(coursesList)
        ? coursesList.find((c: any) => String(c.code) === String(clash.course_cd) || String(c.id) === String(clash.course_cd) || String(c.course_cd) === String(clash.course_cd))
        : null;
      const courseName = matchedCourse?.name
        ? `Course: ${matchedCourse.name}`
        : (clash.course_cd ? `Course: ${clash.course_cd}` : (clash.department_name ? `Course: ${clash.department_name}` : (selectedCourseObj?.name ? `Course: ${selectedCourseObj.name}` : 'Course: Academic')));

      const deptBranch = clash.department_name ? ` (${clash.department_name})` : (clash.branch_cd ? ` (Branch ${clash.branch_cd})` : '');

      // Dynamic batch name — look up from batchesList state
      const matchedBatch = Array.isArray(batchesList)
        ? batchesList.find((b: any) => String(b.code) === String(clash.batch_cd) || String(b.id) === String(clash.batch_cd) || String(b.batch_cd) === String(clash.batch_cd))
        : null;
      const batchName = matchedBatch?.name
        ? `Batch: ${matchedBatch.name}`
        : (clash.batch_name ? `Batch: ${clash.batch_name}` : (clash.batch_cd ? `Batch: ${clash.batch_cd}` : (selectedBatchObj?.name ? `Batch: ${selectedBatchObj.name}` : 'Batch: Current')));

      const semVal = clash.semester || selectedSemester || '3';
      const semesterName = `Semester: ${semVal}`;
      const secRaw = String(clash.section || selectedSection || '1');
      const secLetter = secRaw === '1' ? 'A' : secRaw === '2' ? 'B' : secRaw === '3' ? 'C' : secRaw === '4' ? 'D' : secRaw;
      const sectionName = `Section: ${secLetter}`;
      const subjectLabel = clash.subject_name || clash.topic || clash.description || 'Subject Session';

      return {
        faculty_name: facName,
        course: `${courseName}${deptBranch}`,
        batch: batchName,
        semester: semesterName,
        section: sectionName,
        day: dayName,
        time: timeRange,
        subject: subjectLabel,
        message: `${facName} is already assigned to ${courseName}${deptBranch}, ${batchName}, ${semesterName}, ${sectionName} for "${subjectLabel}" on ${dayName} (${timeRange}). Please select a different time slot or choose another faculty member, or contact the Academic Administrator to resolve the schedule overlap.`,
      };
    }
    return null;
  }, [isModalOpen, formData.facultyId, formData.facultyEmpId, formData.facultyName, formData.dayOfWeek, formData.startTime, formData.endTime, slots, facultyCrossSlots, clerkDrafts, activeDraft, editingSlot, selectedCourseObj, selectedBatchObj, selectedSemester, selectedSection, coursesList, batchesList]);

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
  // Dynamically compute Available Units based strictly on Selected Subject from Admin Master
  const availableSubjectUnits = useMemo(() => {
    const subVal = formData.subjectId || formData.subjectCode;
    const matched = availableFormSubjects.find(s => String(s.id) === subVal || String(s.code) === subVal || String(s.linkcd) === subVal);
    const subCode = matched?.code || formData.subjectCode || '';
    const subId = matched?.id || formData.subjectId || '';
    const subName = (matched?.name || matched?.raw_name || '').toLowerCase().trim();

    // 1. Search in allDbUnits by subject_id or subject_code or subject_name
    const filtered = (allDbUnits || []).filter(u => {
      if (!u) return false;
      const uSubName = (u.subject_name || '').toLowerCase().trim();
      return (
        (subId && String(u.subject_id) === String(subId)) ||
        (subCode && String(u.subject_code || u.code) === String(subCode)) ||
        (subName && uSubName && (uSubName.includes(subName) || subName.includes(uSubName)))
      );
    });

    if (filtered.length > 0) {
      return filtered.map((u, i) => ({
        id: String(u.id || u.code || `unit_${i + 1}`),
        code: u.code || u.unit_code || `UNIT-${i + 1}`,
        name: u.name || u.unit_name || u.code || `Unit ${i + 1}`,
        description: u.description || '',
      }));
    }

    // Return empty list if Admin has not added units for this subject yet
    return [];
  }, [formData.subjectId, formData.subjectCode, availableFormSubjects, allDbUnits]);

  // Dynamically compute Available Topics based strictly on Selected Subject & Unit from Admin Master
  const availableSubjectTopics = useMemo(() => {
    const subVal = formData.subjectId || formData.subjectCode;
    const matchedSub = availableFormSubjects.find(s => String(s.id) === subVal || String(s.code) === subVal || String(s.linkcd) === subVal);
    const subCode = matchedSub?.code || formData.subjectCode || '';
    const subId = matchedSub?.id || formData.subjectId || '';
    const subName = (matchedSub?.name || matchedSub?.raw_name || '').toLowerCase().trim();

    const selectedUnitObj = availableSubjectUnits.find(u =>
      String(u.id) === String(formData.unitId) ||
      u.name === formData.unitName ||
      u.code === formData.unitName
    );
    const unitId = selectedUnitObj?.id || formData.unitId || '';
    const unitCode = selectedUnitObj?.code || '';
    const unitName = (selectedUnitObj?.name || formData.unitName || '').toLowerCase().trim();

    // 1. Filter allDbTopics by subject AND unit
    const filteredByUnit = (allDbTopics || []).filter(t => {
      if (!t) return false;
      const tSubName = (t.subject_name || '').toLowerCase().trim();
      const matchSub = (subId && String(t.subject_id) === String(subId)) ||
                       (subCode && String(t.subject_code) === String(subCode)) ||
                       (subName && tSubName && (tSubName.includes(subName) || subName.includes(tSubName)));
      if (!matchSub) return false;

      // Check unit match
      const tUnitName = (t.unit_name || '').toLowerCase().trim();
      const matchUnit = (unitId && (String(t.unit_id) === String(unitId) || String(t.unit_id) === String(unitCode))) ||
                        (unitCode && (t.unit_code === unitCode || t.code?.includes(unitCode))) ||
                        (unitName && tUnitName && (tUnitName.includes(unitName) || unitName.includes(tUnitName)));
      return matchUnit;
    });

    if (filteredByUnit.length > 0) {
      return filteredByUnit.map(t => ({
        id: String(t.id || t.code),
        code: t.code || 'TOPIC',
        name: t.name || t.code,
        description: t.description || '',
      }));
    }

    // 2. If no unit-specific filter, match all topics for this subject
    const filteredBySub = (allDbTopics || []).filter(t => {
      if (!t) return false;
      const tSubName = (t.subject_name || '').toLowerCase().trim();
      return (
        (subId && String(t.subject_id) === String(subId)) ||
        (subCode && String(t.subject_code) === String(subCode)) ||
        (subName && tSubName && (tSubName.includes(subName) || subName.includes(tSubName)))
      );
    });

    if (filteredBySub.length > 0) {
      return filteredBySub.map(t => ({
        id: String(t.id || t.code),
        code: t.code || 'TOPIC',
        name: t.name || t.code,
        description: t.description || '',
      }));
    }

    // Return empty list if Admin has not added topics for this subject/unit yet
    return [];
  }, [formData.subjectId, formData.subjectCode, formData.unitId, formData.unitName, availableFormSubjects, availableSubjectUnits, allDbTopics]);

  // Dynamically compute Available Sub Topics / Competencies based strictly on Admin Master
  const availableSubjectSubTopics = useMemo(() => {
    const subVal = formData.subjectId || formData.subjectCode;
    const matchedSub = availableFormSubjects.find(s => String(s.id) === subVal || String(s.code) === subVal || String(s.linkcd) === subVal);
    const subCode = matchedSub?.code || formData.subjectCode || '';
    const subId = matchedSub?.id || formData.subjectId || '';

    const currentTopic = (formData.topic || '').trim();
    const currentTopicLower = currentTopic.toLowerCase();

    // 1. Search in allDbCompetencies by subject and topic match
    const filteredByTopic = (allDbCompetencies || []).filter(c => {
      if (!c) return false;
      const matchSub = (subId && String(c.subject_id) === String(subId)) ||
                       (subCode && String(c.subject_code) === String(subCode));
      if (!matchSub) return false;

      if (!currentTopic) return true;

      const matchTopic = (
        (c.topic_code && currentTopic.includes(c.topic_code)) ||
        (c.topic_name && currentTopicLower.includes(c.topic_name.toLowerCase())) ||
        (c.topic_id && currentTopic.includes(String(c.topic_id))) ||
        (c.name && currentTopicLower.includes(c.name.toLowerCase()))
      );
      return matchTopic;
    });

    if (filteredByTopic.length > 0) {
      return filteredByTopic.map(c => ({
        id: String(c.id || c.code),
        code: c.code || 'ST',
        name: c.description || c.name || c.code,
      }));
    }

    // Return empty list if Admin has not added subtopics/competencies yet
    return [];
  }, [formData.subjectId, formData.subjectCode, formData.topic, availableFormSubjects, allDbCompetencies]);

  // Clean, deduplicated faculty options for Autocomplete dropdown
  const facultyDropdownOptions: SearchableDropdownOption[] = useMemo(() => {
    const list: SearchableDropdownOption[] = [];
    const seenEmp = new Set<string>();

    if (Array.isArray(srmsTimetableSubjects)) {
      for (const s of srmsTimetableSubjects) {
        const emp = String(s.empid || '');
        const name = s.EmpName || s.faculty_name || '';
        if (emp && name && !seenEmp.has(emp)) {
          seenEmp.add(emp);
          list.push({
            value: emp,
            altValues: [emp],
            label: name,
            badge: emp,
            sublabel: '(Live Synced from Portal)',
          });
        }
      }
    }

    if (Array.isArray(allFaculties)) {
      for (const f of allFaculties) {
        const emp = String(f.emp_id || f.id || '');
        const idVal = f.id ? String(f.id) : '';
        const name = f.name || '';
        if (emp && name && !seenEmp.has(emp)) {
          seenEmp.add(emp);
          list.push({
            value: emp,
            altValues: idVal ? [idVal, emp] : [emp],
            label: name,
            badge: f.emp_id || 'FAC',
            sublabel: f.designation || undefined,
          });
        }
      }
    }
    return list;
  }, [srmsTimetableSubjects, allFaculties]);

  // Subject & Faculty Registry List for Timetable Footer
  const registryList = useMemo(() => {
    const list: { subject_code: string; subject_name: string; faculty_name: string }[] = [];
    const seenKeys = new Set<string>();

    // Normalize subject name for dedup: lowercase, strip faculty name in parens, collapse spaces
    const normName = (n: string) => String(n || '').replace(/\([^)]*\)/g, '').trim().toLowerCase().replace(/\s+/g, ' ');

    const safeSlots = Array.isArray(slots) ? slots : [];

    // 1. Process official SRMS timetable subjects first (they contain authentic numeric sub_cd)
    if (Array.isArray(srmsTimetableSubjects) && srmsTimetableSubjects.length > 0) {
      for (const s of srmsTimetableSubjects) {
        const code = String(s.sub_cd || s.code || '').trim();
        const rawName = String(s.sub_name || s.name || '').trim();
        let cleanName = rawName.replace(/\([^)]*\)/g, '').trim();
        let teacher = s.EmpName || (rawName.match(/\(([^)]+)\)/)?.[1] || '').trim();

        // If subject name is missing or purely faculty name, look up in availableFormSubjects or safeSlots
        if (!cleanName || cleanName.length < 2) {
          const matchedSub = (availableFormSubjects || []).find((af: any) => String(af.code) === code || String(af.linkcd) === code || String(af.id) === code);
          if (matchedSub?.name) {
            cleanName = matchedSub.name;
          } else {
            const matchedSlot = safeSlots.find((sl: any) => String(sl.subject_code) === code || String(sl.subject_id) === code);
            if (matchedSlot?.subject_name) {
              cleanName = matchedSlot.subject_name;
            }
          }
        }

        // Check if a scheduled slot has an assigned faculty for this subject
        const slotForSubject = safeSlots.find((sl: any) => {
          const slName = normName(sl.subject_name || sl.topic || '');
          const curName = normName(cleanName || rawName);
          return (curName && slName === curName) || (code && (String(sl.subject_code) === code || String(sl.subject_id) === code));
        });
        if (slotForSubject?.faculty_name && slotForSubject.faculty_name !== 'Faculty Member') {
          teacher = slotForSubject.faculty_name;
        }

        const nameKey = normName(cleanName || rawName);
        const codeKey = code.toLowerCase().trim();
        const key = nameKey.length > 3 ? nameKey : codeKey;

        if (key && !seenKeys.has(key) && !seenKeys.has(codeKey)) {
          seenKeys.add(key);
          if (codeKey) seenKeys.add(codeKey);
          list.push({
            subject_code: (!isUUID(code) && code) ? code : '-',
            subject_name: cleanName || rawName || 'Academic Subject',
            faculty_name: teacher || 'Faculty Incharge',
          });
        } else if (seenKeys.has(key) && teacher) {
          const existingIdx = list.findIndex(l => normName(l.subject_name) === key);
          if (existingIdx !== -1) {
            if (!list[existingIdx].faculty_name || list[existingIdx].faculty_name === 'Faculty Incharge') {
              list[existingIdx].faculty_name = teacher;
            }
            if ((!list[existingIdx].subject_code || list[existingIdx].subject_code === '-' || isUUID(list[existingIdx].subject_code)) && code && !isUUID(code)) {
              list[existingIdx].subject_code = code;
            }
          }
        }
      }
    }

    // 2. Include any scheduled slots not already in the official SRMS subject list
    for (const s of safeSlots) {
      if (!s) continue;
      const subName = (s.subject_name && s.subject_name !== 'Medical Subject') ? s.subject_name : (s.topic || '');
      const facName = (s.faculty_name && s.faculty_name !== 'Faculty Member') ? s.faculty_name : '';
      let subCode = String(s.subject_code || s.subject_id || '').trim();

      // If subCode is a UUID, look up the authentic numeric code from SRMS subjects or availableFormSubjects
      if (isUUID(subCode) || !subCode) {
        const matched = (srmsTimetableSubjects || []).find((st: any) => {
          const stName = normName(st.sub_name || st.name || '');
          return stName && stName === normName(subName);
        }) || (availableFormSubjects || []).find((af: any) => {
          const afName = normName(af.name || af.raw_name || '');
          return afName && afName === normName(subName);
        });
        subCode = (!isUUID(matched?.sub_cd) && matched?.sub_cd) || (!isUUID(matched?.code) && matched?.code) || (!isUUID(matched?.linkcd) && matched?.linkcd) || '-';
      }

      const nameKey = normName(subName);
      const codeKey = subCode.toLowerCase().trim();
      const key = nameKey.length > 3 ? nameKey : codeKey;

      if (key && !seenKeys.has(key)) {
        seenKeys.add(key);
        if (codeKey && codeKey !== '-') seenKeys.add(codeKey);
        list.push({
          subject_code: (!isUUID(subCode) && subCode) ? subCode : '-',
          subject_name: subName || 'Scheduled Session',
          faculty_name: facName || 'Faculty Incharge',
        });
      } else if (seenKeys.has(key)) {
        const existingIdx = list.findIndex(l => normName(l.subject_name) === key);
        if (existingIdx !== -1) {
          if (facName && (!list[existingIdx].faculty_name || list[existingIdx].faculty_name === 'Faculty Incharge')) {
            list[existingIdx].faculty_name = facName;
          }
          if ((!list[existingIdx].subject_code || list[existingIdx].subject_code === '-' || isUUID(list[existingIdx].subject_code)) && subCode && !isUUID(subCode)) {
            list[existingIdx].subject_code = subCode;
          }
        }
      }
    }

    return list;
  }, [slots, srmsTimetableSubjects, availableFormSubjects]);

  // ─── API FETCHING HELPERS ──────────────────────────────────────────────────
  const fetchColleges = async () => {
    try {
      const activeTenant = getActiveTenantSlug();
      const res = await fetch(`/api/srms/colleges?tenant=${encodeURIComponent(activeTenant)}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const mapped = list.map((c: any) => ({
            id: String(c.colg_cd || c.code || c.id || '1'),
            code: String(c.colg_cd || c.code || c.id || '1'),
            colg_cd: String(c.colg_cd || c.code || c.id || '1'),
            name: c.colg_name || c.name || `College ${c.colg_cd}`,
            slug: c.slug || activeTenant,
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
      const activeTenant = getActiveTenantSlug();
      const res = await fetch(`/api/srms/sessions?colgcd=${encodeURIComponent(cd)}&tenant=${encodeURIComponent(activeTenant)}`);
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
      const activeTenant = getActiveTenantSlug(cd);
      const res = await fetch(`/api/srms/courses?colgcd=${encodeURIComponent(cd)}&tenant=${encodeURIComponent(activeTenant)}`);
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
    setCoursesList([]);
    return [];
  };

  const fetchBranchesForCourse = async (colgcd: string, coursecd: string, knownDepts?: DropdownItem[]) => {
    const cd = colgcd || '1';
    const crs = coursecd || '';
    const activeDepts = (knownDepts && knownDepts.length > 0) ? knownDepts : departmentsList;
    try {
      const activeTenant = getActiveTenantSlug(cd);
      const res = await fetch(`/api/srms/branches?colgcd=${encodeURIComponent(cd)}&coursecd=${encodeURIComponent(crs)}&tenant=${encodeURIComponent(activeTenant)}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const mapped = list.map((b: any) => {
            const rawName = (b.branch_name || b.name || '').trim();
            let validName = (rawName && rawName !== '-' && rawName !== 'null' && !rawName.toLowerCase().includes('general')) ? rawName : '';
            if (!validName) {
              const matchingDept = (activeDepts || []).find((d: any) =>
                (String(d.course_cd) === String(crs) && (String(d.branch_cd) === String(b.branch_cd || b.code) || String(d.code) === String(b.branch_cd || b.code))) ||
                (String(d.course_cd) === String(crs))
              );
              if (matchingDept) {
                validName = matchingDept.name;
              } else {
                validName = b.course_name ? `${b.course_name} Department` : `Branch ${b.branch_cd || '1'}`;
              }
            }
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

    // Direct fallback to PostgreSQL departments matching the course
    const dbBranches = (activeDepts || [])
      .filter((d: any) => !crs || String(d.course_cd) === String(crs))
      .map((d: any, idx: number) => {
        const rawCode = d.branch_cd || d.code;
        const numCode = (rawCode && !String(rawCode).includes('-') && !isNaN(Number(rawCode))) ? String(rawCode) : String(idx + 1);
        return {
          id: numCode,
          code: numCode,
          branch_cd: numCode,
          name: d.name || `Department ${numCode}`,
          course_cd: String(d.course_cd || crs),
          course_name: d.course_name,
          colg_cd: String(d.colg_cd || cd),
        };
      });

    if (dbBranches.length > 0) {
      setBranchesList(dbBranches);
      return dbBranches;
    }

    setBranchesList([]);
    return [];
  };

  const fetchBatchesForCourse = async (colgcd: string, coursecd: string, branchcd?: string) => {
    const cd = colgcd || '1';
    const crs = coursecd || '';
    const br = branchcd || '';
    try {
      const activeTenant = getActiveTenantSlug(cd);
      const res = await fetch(`/api/srms/batches?colgcd=${encodeURIComponent(cd)}&coursecd=${encodeURIComponent(crs)}${br ? `&branchcd=${encodeURIComponent(br)}` : ''}&tenant=${encodeURIComponent(activeTenant)}`);
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
    setBatchesList([]);
    return [];
  };

  const fetchSemestersForCourse = async (colgcd: string, coursecd: string, branchcd?: string, batchcd?: string) => {
    const cd = colgcd || '1';
    const crs = coursecd || '1';
    const br = branchcd || '1';
    const bat = batchcd || '18';
    try {
      const activeTenant = getActiveTenantSlug(cd);
      const res = await fetch(`/api/srms/semesters?colgcd=${encodeURIComponent(cd)}&coursecd=${encodeURIComponent(crs)}&branchcd=${encodeURIComponent(br)}&batchcd=${encodeURIComponent(bat)}&tenant=${encodeURIComponent(activeTenant)}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const mapped: DropdownItem[] = list.map((s: any) => ({
            id: String(s.sem_cd || s.code || s.id),
            code: String(s.sem_cd || s.code || s.id),
            name: s.SemName || s.name || `Semester ${s.sem_cd || s.code}`,
          }));
          setSemestersList(mapped);
          return mapped;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch semesters:', err);
    }
    const fallbackList: DropdownItem[] = [1, 2, 3, 4, 5, 6, 7, 8].map(sem => ({
      id: String(sem),
      code: String(sem),
      name: `Semester ${sem}`,
    }));
    setSemestersList(fallbackList);
    return fallbackList;
  };

  const fetchSectionsForCourse = async (colgcd?: string, coursecd?: string, branchcd?: string, batchcd?: string, semcd?: string) => {
    const sections: DropdownItem[] = [
      { id: '1', code: '1', name: 'Section A' },
      { id: '2', code: '2', name: 'Section B' },
      { id: '3', code: '3', name: 'Section C' },
      { id: '4', code: '4', name: 'Section D' },
    ];
    setSectionsList(sections);
    return sections;
  };

  const fetchCameras = async (colgcd: string = selectedCollege) => {
    setCameraLoading(true);
    try {
      const cd = colgcd || '1';
      const res = await fetch(`/api/srms/load-camera?colgcd=${cd}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setCamerasList(json.data);
          return json.data;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch cameras:', err);
    } finally {
      setCameraLoading(false);
    }
    setCamerasList(DEFAULT_CAMERAS);
    return DEFAULT_CAMERAS;
  };

  const fetchMasterData = async () => {
    setMetadataLoading(true);
    try {
      let role = 'ADMIN';
      let userColg = '1';
      let userSlug = 'srms-cet-bareilly';
      let savedCollegeName = '';
      if (typeof window !== 'undefined') {
        role = (localStorage.getItem('role') || 'ADMIN').toUpperCase();
        userColg = localStorage.getItem('colg_cd') || localStorage.getItem('colgCd') || '1';
        userSlug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly';
        savedCollegeName = localStorage.getItem('collegeName') || localStorage.getItem('college_name') || '';
        setUserRole(role);
        setUserColgCd(userColg);
        setUserTenantSlug(userSlug);
      }

      // 1. Fetch Colleges
      const allColleges = await fetchColleges();

      let filteredColleges = allColleges;
      if (filteredColleges.length === 0) {
        filteredColleges = [{
          id: userColg,
          code: userColg,
          colg_cd: userColg,
          name: savedCollegeName || userSlug.toUpperCase(),
          slug: userSlug
        }];
      }
      setCollegesList(filteredColleges);

      const myCol = filteredColleges.find(c => String(c.colg_cd) === String(userColg) || String(c.code) === String(userColg) || c.slug === userSlug);
      const activeColCode = myCol ? (myCol.code || myCol.colg_cd) : (filteredColleges[0]?.code || '1');
      setSelectedCollege(activeColCode);

      // Fetch Cameras for active college
      await fetchCameras(activeColCode);

      // 2. Fetch Sessions for the active college
      const sessions = await fetchSessionsForCollege(activeColCode);
      const curSess = sessions.find(s => s.code === '16') || sessions.find(s => s.is_current) || sessions[0];
      if (curSess) setSelectedSession(curSess.code);

      // 3. Fetch Departments, Subjects, Faculty for Timetable modal strictly scoped by tenant
      const activeTenantSlug = role === 'SUPER_ADMIN' ? (filteredColleges[0]?.slug || 'srms-cet-bareilly') : userSlug;
      const token = localStorage.getItem('token') || '';
      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

      const [deptRes, subRes, unitRes, topicRes, compRes, facRes] = await Promise.all([
        fetch(`${API_BASE}/admin-master/departments?tenant=${encodeURIComponent(activeTenantSlug)}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/admin-master/subjects?tenant=${encodeURIComponent(activeTenantSlug)}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/admin-master/units?tenant=${encodeURIComponent(activeTenantSlug)}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/admin-master/topics?tenant=${encodeURIComponent(activeTenantSlug)}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/admin-master/competencies?tenant=${encodeURIComponent(activeTenantSlug)}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/users/faculty?tenant=${encodeURIComponent(activeTenantSlug)}&limit=500`, { headers }).catch(() => null),
      ]);

      let loadedDepts: DropdownItem[] = [];
      if (deptRes && deptRes.ok) {
        const dJson = await deptRes.json();
        const dList = extractArray(dJson);
        if (dList.length > 0) {
          loadedDepts = dList;
          setDepartmentsList(dList);
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

      // 4. Cascade Level 2: Fetch Courses for active college
      const courses = await fetchCoursesForCollege(activeColCode);
      // On initial load, set all cascading filters to 0 per user requirement
      setSelectedCourse('0');
      setSelectedBranch('0');
      setSelectedBatch('0');
      setSelectedSemester('0');
      setSelectedSection('0');
      setBranchesList([]);
      setBatchesList([]);
      setSemestersList([]);
      if (mode !== 'clerk') {
        setSlots([]);
        setActiveDraft(null);
      }
    } catch (err) {
      console.error('Failed to load master metadata:', err);
    } finally {
      setMetadataLoading(false);
    }
  };


  const fetchPostgresSlots = async (
    courseCd?: string,
    branchCd?: string,
    batchCd?: string,
    semCd?: string,
    secCd?: string,
    colgCd?: string,
    targetDate: Date = currentDate
  ) => {
    if (mode === 'clerk') return [];
    try {
      const crs = courseCd !== undefined ? courseCd : selectedCourse;
      const br = branchCd !== undefined ? branchCd : selectedBranch;
      const bat = batchCd !== undefined ? batchCd : selectedBatch;
      const sem = semCd !== undefined ? semCd : selectedSemester;
      const sec = secCd !== undefined ? secCd : selectedSection;
      const colg = colgCd !== undefined ? colgCd : selectedCollege;

      if (!crs || crs === '0' || !br || br === '0' || !bat || bat === '0' || !sem || sem === '0' || !sec || sec === '0') {
        setSlots([]);
        return [];
      }
      const tenantSlug = getActiveTenantSlug(colg);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

      const res = await fetch(
        `${API_BASE}/timetable?tenant=${tenantSlug}&courseCd=${crs}&branchCd=${br}&batchCd=${bat}&semester=${sem}&section=${sec}&colgCd=${colg}`,
        {
          headers: {
            'x-tenant-slug': tenantSlug,
            'x-tenant-id': tenantSlug,
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          cache: 'no-store',
        }
      );

      if (res.ok) {
        const json = await res.json();
        const rawSlots = json.data || [];
        if (Array.isArray(rawSlots)) {
          const mapped: TimetableSlot[] = rawSlots.map((item: any) => {
            const rawSubName = item.subject_name || item.topic || 'Subject Session';
            const cleanSubName = String(rawSubName).replace(/\([^)]*\)/g, '').trim();
            const fac = item.faculty_name || (String(rawSubName).match(/\(([^)]+)\)/)?.[1] || 'Faculty Member').trim();
            const isLab = String(rawSubName).toLowerCase().includes('lab') || (item.slot_type || '').toLowerCase().includes('practical');

            return {
              id: String(item.id),
              postgres_id: String(item.id),
              faculty_id: item.faculty_id || '',
              faculty_name: fac,
              faculty_code: item.faculty_code || '',
              subject_id: item.subject_id || String(item.id),
              subject_name: cleanSubName || rawSubName,
              subject_code: item.subject_code || '',
              department_id: item.department_id || '',
              batch_id: item.batch_id || '',
              day_of_week: Number(item.day_of_week) || 1,
              start_time: String(item.start_time || '08:30:00').slice(0, 8),
              end_time: String(item.end_time || '09:30:00').slice(0, 8),
              room: item.room || (isLab ? 'Comp Lab 2' : 'Room 204'),
              slotType: item.slot_type || (isLab ? 'Practical' : 'Lecture'),
              slot_type: item.slot_type || (isLab ? 'Practical' : 'Lecture'),
              topic: item.topic || cleanSubName || rawSubName,
              unit_name: item.unit_name || null,
              unit_id: item.unit_id || null,
              sub_topics: item.sub_topics || null,
              competency_codes: item.competency_codes || null,
            };
          });

          setSlots(mapped);
          return mapped;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch PostgreSQL slots:', err);
    }
    const currentDraft = activeDraftRef.current || activeDraft;
    const draftSlotsCount = currentDraft && (typeof currentDraft.slots === 'string' ? JSON.parse(currentDraft.slots || '[]').length : (currentDraft.slots || []).length);
    if (draftSlotsCount > 0) return [];
    setSlots([]);
    return [];
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
    if (mode === 'clerk') return [];
    try {
      const crs = courseCd !== undefined ? courseCd : selectedCourse;
      const br = branchCd !== undefined ? branchCd : selectedBranch;
      const bat = batchCd !== undefined ? batchCd : selectedBatch;
      const sem = semCd !== undefined ? semCd : selectedSemester;
      const sec = secCd !== undefined ? secCd : selectedSection;
      const colg = colgCd !== undefined ? colgCd : selectedCollege;

      if (!crs || crs === '0' || !br || br === '0' || !bat || bat === '0' || !sem || sem === '0' || !sec || sec === '0') {
        setSlots([]);
        return [];
      }
      const tenantSlug = getActiveTenantSlug(colg);

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
        `/api/srms/timetable-schedule?course=${crs}&batch=${bat}&branch=${br}&sem=${sem}&sec=${sec}&colgcd=${colg}&start=${startSec}&end=${endSec}&target_date=${targetDateIso}&tenant=${tenantSlug}`,
        {
          headers: {
            'x-tenant-slug': tenantSlug,
            'x-tenant-id': tenantSlug,
          },
        }
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
              if (['679267', '679268', '679303'].includes(String(item.id))) return false;

              // Only remote single-day events are strictly bounded; recurring weekly slots persist across all upcoming months
              if (item.source !== 'POSTGRESQL_SLOT' && item.source !== 'POSTGRESQL' && !item.postgres_id && item.start) {
                const dStart = parseItemDate(item.start);
                const startTimeMs = dStart.getTime();
                if (!isNaN(startTimeMs)) {
                  if (startTimeMs < sundayStart.getTime() || startTimeMs >= sundayEnd.getTime()) {
                    return false;
                  }
                }
              }
              return true;
            })
            .map((item: any) => {
              const dStart = parseItemDate(item.start);
              const dEnd = parseItemDate(item.end);
              const dayVal = item.day_of_week !== undefined && item.day_of_week !== null
                ? Number(item.day_of_week)
                : (dStart.getDay() === 0 ? 7 : dStart.getDay());

              const startTime = item.start_time || extractTimeStr(item.start_str, dStart);
              const endTime = item.end_time || extractTimeStr(item.end_str, dEnd);

              const rawTitle = String(item.title || item.description || item.topic || '');
              const cleanName = rawTitle.replace(/\([^)]*\)/g, '').trim();
              const teacher = (item.faculty_name || item.EmpName || item.emp_name || rawTitle.match(/\(([^)]+)\)/)?.[1] || 'Faculty Member').trim();
              const isLab = rawTitle.toLowerCase().includes('lab') || rawTitle.toLowerCase().includes('practical');

              return {
                id: String(item.id),
                postgres_id: item.postgres_id ? String(item.postgres_id) : (isUUID(item.id) ? String(item.id) : undefined),
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
                unit_name: item.unit_name || null,
                unit_id: item.unit_id || null,
                sub_topics: item.sub_topics || null,
                competency_codes: item.competency_codes || null,
              };
            });

          const seenSlotKeys = new Set<string>();
          const dedupedSlots = mappedSlots.filter(slot => {
            const key = `${slot.day_of_week}_${slot.start_time?.slice(0, 5)}`;
            if (seenSlotKeys.has(key)) return false;
            seenSlotKeys.add(key);
            return true;
          });

          setSlots(dedupedSlots);
          return dedupedSlots;
        } else {
          const currentDraft = activeDraftRef.current || activeDraft;
          const draftSlotsCount = currentDraft && (typeof currentDraft.slots === 'string' ? JSON.parse(currentDraft.slots || '[]').length : (currentDraft.slots || []).length);
          if (draftSlotsCount > 0) return [];
          setSlots([]);
          return [];
        }
      }
    } catch (err) {
      console.warn('Failed to fetch SRMS timetable schedule:', err);
    }
    const currentDraft = activeDraftRef.current || activeDraft;
    const draftSlotsCount = currentDraft && (typeof currentDraft.slots === 'string' ? JSON.parse(currentDraft.slots || '[]').length : (currentDraft.slots || []).length);
    if (draftSlotsCount > 0) return [];
    setSlots([]);
    return [];
  };


  const fetchSrmsSubjects = async (courseCd?: string, branchCd?: string, batchCd?: string, semCd?: string, secCd?: string, colgCd?: string) => {
    try {
      const crs = courseCd !== undefined ? courseCd : selectedCourse;
      const br = branchCd !== undefined ? branchCd : selectedBranch;
      const bat = batchCd !== undefined ? batchCd : selectedBatch;
      const sem = semCd !== undefined ? semCd : selectedSemester;
      const sec = secCd !== undefined ? secCd : selectedSection;
      const colg = colgCd !== undefined ? colgCd : selectedCollege;

      if (!crs || crs === '0' || !br || br === '0' || !bat || bat === '0' || !sem || sem === '0' || !sec || sec === '0') {
        setSrmsTimetableSubjects([]);
        return [];
      }
      const tenantSlug = getActiveTenantSlug(String(colg));

      const res = await fetch(`/api/srms/timetable-subjects?course=${crs}&branch=${br}&batch=${bat}&semester=${sem}&section=${sec}&colgcd=${colg}&tenant=${tenantSlug}`);
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
        fetchTimetableSlots(currentDate, selectedCourse, selectedBranch, selectedBatch, selectedSemester, selectedSection, selectedCollege)
      ]);
      const secLetter = selectedSection === '1' ? 'A' : selectedSection === '2' ? 'B' : selectedSection === '3' ? 'C' : 'D';
      const schedCount = Array.isArray(sched) ? sched.length : (Array.isArray(slots) ? slots.length : 0);
      showAlert('success', `Live Timetable synced! Loaded ${schedCount} scheduled slots and ${Array.isArray(subs) ? subs.length : 0} subjects for Semester ${selectedSemester} - Section ${secLetter}.`);
    } catch (e: any) {
      showAlert('error', 'Error syncing timetable from database/portal.');
    } finally {
      setSyncingTimetable(false);
    }
  };

  const fetchTimetableSlots = async (
    targetDate: Date = currentDate,
    courseCd?: string,
    branchCd?: string,
    batchCd?: string,
    semCd?: string,
    secCd?: string,
    colgCd?: string
  ) => {
    if (mode === 'clerk') return;
    const crs = courseCd !== undefined ? courseCd : selectedCourse;
    const br = branchCd !== undefined ? branchCd : selectedBranch;
    const bat = batchCd !== undefined ? batchCd : selectedBatch;
    const sem = semCd !== undefined ? semCd : selectedSemester;
    const sec = secCd !== undefined ? secCd : selectedSection;
    const colg = colgCd !== undefined ? colgCd : selectedCollege;

    if (!crs || crs === '0' || !br || br === '0' || !bat || bat === '0' || !sem || sem === '0' || !sec || sec === '0') {
      setSlots([]);
      return;
    }

    setLoading(true);
    try {
      const tenantSlug = getActiveTenantSlug(colg);
      const isSrms = Boolean(tenantSlug && tenantSlug.toLowerCase().includes('srms'));

      // 1. Fetch subjects (for non-SRMS, queries PostgreSQL subjects table; for SRMS, queries SRMS ASMX)
      await fetchSrmsSubjects(crs, br, bat, sem, sec, colg);

      // 2. Fetch timetable schedule:
      // /api/srms/timetable-schedule automatically checks tenant slug:
      // - If SRMS tenant: queries SRMS portal + PostgreSQL and combines with topics/units
      // - If non-SRMS tenant: queries strictly PostgreSQL timetable_slots and projects into calendar week
      const scheduleSlots = await fetchSrmsSchedule(crs, br, bat, sem, sec, colg, targetDate);

      // 3. Fallback: if non-SRMS and scheduleSlots is empty, attempt direct backend timetable query
      if (!isSrms && (!scheduleSlots || scheduleSlots.length === 0)) {
        await fetchPostgresSlots(crs, br, bat, sem, sec, colg, targetDate);
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
    setSelectedCollege(colgCd);
    const newSlug = getActiveTenantSlug(colgCd);
    if (typeof window !== 'undefined') {
      localStorage.setItem('colg_cd', colgCd);
      localStorage.setItem('colgCd', colgCd);
      localStorage.setItem('tenantSlug', newSlug);
      localStorage.setItem('selectedTenant', newSlug);
    }

    // 1. Refresh peripheral camera and sessions
    fetchCameras(colgCd);
    fetchSessionsForCollege(colgCd);

    // 2. Cascade Level 2: Fetch Courses for this college
    await fetchCoursesForCollege(colgCd);
    setSelectedCourse('0');
    setSelectedBranch('0');
    setSelectedBatch('0');
    setSelectedSemester('0');
    setSelectedSection('0');
    setBranchesList([]);
    setBatchesList([]);
    setSemestersList([]);
    // Always clear stale grid state when college changes
    setSlots([]);
    setActiveDraft(null);
    activeDraftRef.current = null;
    if (typeof window !== 'undefined') localStorage.removeItem('activeClerkDraftId');
  };

  const handleFilterCourseChange = async (courseCd: string) => {
    setSelectedCourse(courseCd);
    setSelectedBranch('0');
    setSelectedBatch('0');
    setSelectedSemester('0');
    setSelectedSection('0');
    setBatchesList([]);
    setSemestersList([]);
    // Always clear stale grid state when course changes
    setSlots([]);
    setActiveDraft(null);
    activeDraftRef.current = null;
    if (typeof window !== 'undefined') localStorage.removeItem('activeClerkDraftId');

    if (!courseCd || courseCd === '0') {
      setBranchesList([]);
      return;
    }

    // Cascade Level 3: Fetch Branches for selected college + new course
    const branches = await fetchBranchesForCourse(selectedCollege, courseCd, departmentsList);
    setBranchesList(branches);

    const matchingDept = departmentsList.find((d: any) => String(d.course_cd) === String(courseCd) || d.course_code === courseCd);
    if (matchingDept) {
      setSelectedDept(matchingDept.id || matchingDept.code);
    }
  };

  const handleFilterBranchChange = async (branchCd: string) => {
    setSelectedBranch(branchCd);
    setSelectedBatch('0');
    setSelectedSemester('0');
    setSelectedSection('0');
    setSemestersList([]);
    // Always clear stale grid state when branch changes
    setSlots([]);
    setActiveDraft(null);
    activeDraftRef.current = null;
    if (typeof window !== 'undefined') localStorage.removeItem('activeClerkDraftId');

    if (!branchCd || branchCd === '0') {
      setBatchesList([]);
      return;
    }

    // Cascade Level 4: Fetch Batches for selected college + course + branch
    const batches = await fetchBatchesForCourse(selectedCollege, selectedCourse, branchCd);
    setBatchesList(batches);
  };

  const handleFilterBatchChange = async (batchCd: string) => {
    setSelectedBatch(batchCd);
    setSelectedSemester('0');
    setSelectedSection('0');
    // Always clear stale grid state when batch changes
    setSlots([]);
    setActiveDraft(null);
    activeDraftRef.current = null;
    if (typeof window !== 'undefined') localStorage.removeItem('activeClerkDraftId');

    if (!batchCd || batchCd === '0') {
      setSemestersList([]);
      return;
    }

    // Cascade Level 5: Fetch Semesters for selected college + course + branch + batch
    const semesters = await fetchSemestersForCourse(selectedCollege, selectedCourse, selectedBranch, batchCd);
    setSemestersList(semesters);
  };

  const handleFilterSemesterChange = async (semCd: string) => {
    setSelectedSemester(semCd);
    setSelectedSection('0');
    // Always clear stale grid state when semester changes
    setSlots([]);
    setActiveDraft(null);
    activeDraftRef.current = null;
    if (typeof window !== 'undefined') localStorage.removeItem('activeClerkDraftId');

    if (!semCd || semCd === '0') {
      return;
    }

    await fetchSectionsForCourse(selectedCollege, selectedCourse, selectedBranch, selectedBatch, semCd);
  };

  const handleFilterSectionChange = (secCd: string) => {
    setSelectedSection(secCd);
    // Always clear stale grid state when section changes
    setSlots([]);
    setActiveDraft(null);
    activeDraftRef.current = null;
    if (typeof window !== 'undefined') localStorage.removeItem('activeClerkDraftId');

    if (!secCd || secCd === '0') return;

    if (selectedCourse !== '0' && selectedBranch !== '0' && selectedBatch !== '0' && selectedSemester !== '0' && secCd !== '0') {
      fetchSrmsSubjects(selectedCourse, selectedBranch, selectedBatch, selectedSemester, secCd, selectedCollege);
      if (mode !== 'clerk') {
        fetchSrmsSchedule(selectedCourse, selectedBranch, selectedBatch, selectedSemester, secCd, selectedCollege, currentDate);
      }
      if (mode === 'clerk') {
        // Pass explicit filter overrides so loadClerkDrafts doesn't fall back to stale activeDraftRef
        loadClerkDrafts(undefined, false, {
          course:   selectedCourse,
          branch:   selectedBranch,
          batch:    selectedBatch,
          semester: selectedSemester,
          section:  secCd,
        });
      } else {
        loadClerkDrafts();
      }
    }
  };

  function secValOr(v: string) { return v; }

  const handleFilterDeptChange = (deptId: string) => {
    setSelectedDept(deptId);
  };

  // Re-fetch slots whenever filters change
  useEffect(() => {
    const allFiltersSet = (
      selectedCollege &&
      selectedCourse && selectedCourse !== '0' &&
      selectedBranch && selectedBranch !== '0' &&
      selectedBatch  && selectedBatch  !== '0' &&
      selectedSemester && selectedSemester !== '0' &&
      selectedSection  && selectedSection  !== '0'
    );

    if (allFiltersSet) {
      if (mode === 'clerk') {
        // For clerk: load the matching draft (or clear grid if none found)
        loadClerkDrafts(undefined, false, {
          course:   selectedCourse,
          branch:   selectedBranch,
          batch:    selectedBatch,
          semester: selectedSemester,
          section:  selectedSection,
        });
      } else {
        fetchTimetableSlots(currentDate, selectedCourse, selectedBranch, selectedBatch, selectedSemester, selectedSection, selectedCollege);
      }
      fetchSrmsSubjects(selectedCourse, selectedBranch, selectedBatch, selectedSemester, selectedSection, selectedCollege);
    } else {
      setSlots([]);
      if (mode === 'clerk') {
        setActiveDraft(null);
        activeDraftRef.current = null;
      }
    }
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
      autoFacEmpId = matched.empid ? String(matched.empid) : '';
      linkcdVal = matched.linkcd ? String(matched.linkcd) : '';
      electiveSts = matched.electivests || 'N';

      if (!autoFacName) {
        const parenMatch = subTitle.match(/\(([^)]+)\)/);
        if (parenMatch && parenMatch[1]) {
          autoFacName = parenMatch[1].trim();
        }
      }

      if (autoFacEmpId) {
        const foundFac = allFaculties.find((f: any) => String(f.emp_id) === String(autoFacEmpId) || String(f.id) === String(autoFacEmpId));
        autoFacId = foundFac ? foundFac.id : autoFacEmpId;
        if (foundFac?.name && !autoFacName) autoFacName = foundFac.name;
      } else if (autoFacName) {
        const foundFac = allFaculties.find((f: any) => f.name?.toLowerCase().includes(autoFacName.toLowerCase()));
        autoFacId = foundFac ? foundFac.id : '';
        if (foundFac?.emp_id && !autoFacEmpId) autoFacEmpId = String(foundFac.emp_id);
      }
    }

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
      unitName: '',
      unitId: '',
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
    const srmsSubMatch = Array.isArray(srmsTimetableSubjects) ? srmsTimetableSubjects.find((s: any) => String(s.sub_cd) === String(subCode) || String(s.code) === String(subCode) || (subTitle && s.sub_name && s.sub_name.toLowerCase().includes(subTitle.toLowerCase()))) : null;
    const linkcd = formData.linkcd || (chosenSubject?.linkcd ? String(chosenSubject.linkcd) : (srmsSubMatch?.linkcd ? String(srmsSubMatch.linkcd) : '0'));
    const electiveflg = formData.electiveflg || chosenSubject?.electivests || srmsSubMatch?.electivests || 'N';

    const selectedCamObj = camerasList.find(c => String(c.camera_id) === String(formData.cameraId));
    const roomName = formData.room || selectedCamObj?.classroom || '';

    const subTopicsStr = formData.subTopics || selectedCompetencies.join(', ') || '';

    // Compute exact week range and date for the active week view
    const targetBase = new Date(currentDate);
    const currDay = targetBase.getDay();
    const mondayDiff = targetBase.getDate() - currDay + (currDay === 0 ? -6 : 1);
    const mondayDate = new Date(targetBase.getFullYear(), targetBase.getMonth(), mondayDiff);
    const sundayDate = new Date(mondayDate);
    sundayDate.setDate(mondayDate.getDate() + 6);

    const slotDate = new Date(mondayDate);
    slotDate.setDate(mondayDate.getDate() + (formData.dayOfWeek - 1));

    const pad = (n: number) => String(n).padStart(2, '0');
    const ymdDateStr = `${slotDate.getFullYear()}-${pad(slotDate.getMonth() + 1)}-${pad(slotDate.getDate())}`;
    const effFromStr = `${mondayDate.getFullYear()}-${pad(mondayDate.getMonth() + 1)}-${pad(mondayDate.getDate())}`;
    const oneYearLater = new Date(mondayDate);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    const effUntilStr = `${oneYearLater.getFullYear()}-${pad(oneYearLater.getMonth() + 1)}-${pad(oneYearLater.getDate())}`;

    // 1. PostgreSQL Save Payload with all academic hierarchy, effective duration & unit/topic/subtopic parameters
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
      effectiveFrom: effFromStr,
      effectiveUntil: effUntilStr,
    };

    const formatTimeTo24h = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return `${pad(h || 8)}:${pad(m || 30)}`;
    };

    const startFormatted = `${ymdDateStr} ${formatTimeTo24h(formData.startTime)}`.trim();
    const endFormatted = `${ymdDateStr} ${formatTimeTo24h(formData.endTime)}`.trim();

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
        excludeId: String(editingSlot?.id || editingSlot?.postgres_id || ''),
        editingSlotId: String(editingSlot?.id || editingSlot?.postgres_id || ''),
      },
    };

    if (mode === 'clerk') {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
        const headers: any = {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const slotId = editingSlot?.id || `draft_slot_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const draftSlotItem: ClerkSlot = {
          id: slotId,
          dayOfWeek: formData.dayOfWeek,
          day_of_week: formData.dayOfWeek,
          startTime: formData.startTime,
          start_time: formData.startTime,
          endTime: formData.endTime,
          end_time: formData.endTime,
          colgCd: selectedCollege || '1',
          colg_cd: selectedCollege || '1',
          courseCd: selectedCourse || '13',
          course_cd: selectedCourse || '13',
          branchCd: selectedBranch || '1',
          branch_cd: selectedBranch || '1',
          batchCd: selectedBatch || '2',
          batch_cd: selectedBatch || '2',
          semester: selectedSemester || '3',
          section: formData.sectionValue || selectedSection || '1',
          effectiveFrom: effFromStr,
          effectiveUntil: effUntilStr,
          subjectId: formData.subjectId,
          subject_id: formData.subjectId,
          subjectName: subTitle,
          subject_name: subTitle,
          subjectCode: subCode,
          subject_code: subCode,
          linkcd: linkcd,
          electiveflg: electiveflg,
          facultyId: formData.facultyId,
          faculty_id: formData.facultyId,
          facultyName: facName,
          faculty_name: facName,
          facultyEmpId: facEmpId,
          faculty_code: facEmpId,
          unitName: formData.unitName || 'Unit 1',
          unit_name: formData.unitName || 'Unit 1',
          unitId: formData.unitId || 'unit_1',
          unit_id: formData.unitId || 'unit_1',
          topic: formData.topic || subTitle,
          subTopics: subTopicsStr,
          sub_topics: subTopicsStr,
          competencyCodes: selectedCompetencies.join(','),
          competency_codes: selectedCompetencies.join(','),
          room: roomName,
          cameraId: formData.cameraId,
          slotType: formData.slotType,
          slot_type: formData.slotType,
          groupValue: formData.groupValue || '0',
          group_value: formData.groupValue || '0',
          groupName: formData.groupName || 'All Group',
          status: 'DRAFT',
          srmsPayload: srmsAddEventPayload,
          pgPayload,
        };

        let currentDraft = activeDraft;
        let draftIdToUse = currentDraft?.id;
        if (currentDraft?.status === 'HOD_APPROVED') {
          draftIdToUse = undefined;
        }

        let existingSlots: any[] = [];
        if (currentDraft) {
          existingSlots = typeof currentDraft.slots === 'string'
            ? JSON.parse(currentDraft.slots || '[]')
            : (Array.isArray(currentDraft.slots) ? currentDraft.slots : []);
        }

        let updatedSlots: any[];
        if (isEdit) {
          updatedSlots = existingSlots.map(s => String(s.id) === String(editingSlot.id) ? draftSlotItem : s);
        } else {
          updatedSlots = [...existingSlots, draftSlotItem];
        }

        const draftPayload = {
          ...(currentDraft || {}),
          id: draftIdToUse,
          status: 'DRAFT',
          title: currentDraft?.title && currentDraft.title !== 'Untitled Draft'
            ? currentDraft.title
            : `${selectedCourseObj?.name || 'Academic'} Sem ${selectedSemester} Sec ${selectedSection === '1' ? 'A' : selectedSection === '2' ? 'B' : selectedSection === '3' ? 'C' : 'D'} Timetable Draft`,
          colgCd: selectedCollege || currentDraft?.colg_cd || '1',
          courseCd: selectedCourse || currentDraft?.course_cd || '13',
          branchCd: selectedBranch || currentDraft?.branch_cd || '1',
          batchCd: selectedBatch || currentDraft?.batch_cd || '2',
          departmentId: selectedDept || currentDraft?.department_id || (branchesList[0]?.id || branchesList[0]?.code || ''),
          semester: selectedSemester || currentDraft?.semester || '3',
          section: selectedSection || currentDraft?.section || '1',
          academicYear: currentDraft?.academic_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
          notes: currentDraft?.notes || 'Created via Timetable Designer',
          slots: updatedSlots,
        };

        const res = await fetch(`/api/v1/exams/timetable-drafts?tenant=${tenantSlug}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(draftPayload),
        });
        const savedJson = await res.json();
        const savedDraft = savedJson?.data || savedJson;

        // Close modal and clear editing state first to prevent clash calculation against newly saved slot
        setIsModalOpen(false);
        setEditingSlot(null);
        setModalError(null);

        setActiveDraft(savedDraft);
        activeDraftRef.current = savedDraft;
        if (typeof window !== 'undefined') {
          localStorage.setItem('activeClerkDraftId', savedDraft.id);
        }
        loadDraftIntoGrid(savedDraft);
        await loadClerkDrafts(savedDraft.id);

        showAlert('success', isEdit ? 'Draft lecture updated successfully!' : 'Draft lecture added to timetable draft!');
      } catch (err: any) {
        showAlert('error', err?.message || 'Failed to save draft lecture');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const targetPgId = editingSlot?.postgres_id && isUUID(editingSlot.postgres_id)
        ? editingSlot.postgres_id
        : (editingSlot?.id && isUUID(editingSlot.id) ? editingSlot.id : null);
      const isSlotUuid = isEdit && !!targetPgId;
      const url = isSlotUuid ? `${API_BASE}/timetable/${targetPgId}?tenant=${tenantSlug}` : `${API_BASE}/timetable?tenant=${tenantSlug}`;
      const method = isSlotUuid ? 'PUT' : 'POST';
      const token = localStorage.getItem('token') || '';

      const isSrmsTenant = Boolean(tenantSlug && tenantSlug.toLowerCase().includes('srms'));

      // 1. Call SRMS add-event API (Only if tenant is SRMS)
      let srmsSaved = false;
      let srmsEventId: string | null = null;
      let srmsErrorMsg = '';

      if (isSrmsTenant) {
        try {
          if (isEdit && editingSlot?.id) {
            // Delete old slot from SRMS portal & DB first so new subject/faculty is cleanly scheduled
            await fetch('/api/srms/delete-event', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-tenant-slug': tenantSlug,
                'x-tenant-id': tenantSlug,
              },
              body: JSON.stringify({
                id: String(editingSlot.id),
                postgres_id: editingSlot.postgres_id || undefined,
                colgcd: selectedCollege || '1',
                tenant: tenantSlug,
                tenantSlug,
                day_of_week: editingSlot.day_of_week,
                start_time: editingSlot.start_time,
                end_time: editingSlot.end_time,
                course: selectedCourse,
                branch: selectedBranch,
                batch: selectedBatch,
                sem: selectedSemester,
                sec: selectedSection,
              }),
            }).catch(() => null);

            if (editingSlot.postgres_id && editingSlot.postgres_id !== editingSlot.id) {
              await fetch('/api/srms/delete-event', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-tenant-slug': tenantSlug,
                  'x-tenant-id': tenantSlug,
                },
                body: JSON.stringify({
                  id: String(editingSlot.postgres_id),
                  colgcd: selectedCollege || '1',
                  tenant: tenantSlug,
                  tenantSlug,
                  day_of_week: editingSlot.day_of_week,
                  start_time: editingSlot.start_time,
                }),
              }).catch(() => null);
            }
          }

          const sRes = await fetch('/api/srms/add-event', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-tenant-slug': tenantSlug,
              'x-tenant-id': tenantSlug,
            },
            body: JSON.stringify({ ...srmsAddEventPayload, tenant: tenantSlug, tenantSlug }),
          });
          const sJson = await sRes.json().catch(() => null);
          if (sRes.ok && sJson?.success) {
            srmsSaved = true;
            // Prefer the Postgres UUID (event.id) over the SRMS numeric id for rollback DELETE
            srmsEventId = sJson.event?.id || sJson.id || null;
          } else {
            srmsErrorMsg = sJson?.error || sJson?.message || 'SRMS portal event scheduling failed.';
          }
        } catch (sErr: any) {
          srmsErrorMsg = sErr?.message || 'Network error communicating with SRMS API.';
        }
      } else if (isEdit && !isSlotUuid && editingSlot?.id) {
        // For non-SRMS tenants, clean up old non-UUID slot before creating replacement
        await fetch('/api/srms/delete-event', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-slug': tenantSlug,
            'x-tenant-id': tenantSlug,
          },
          body: JSON.stringify({
            id: String(editingSlot.id),
            postgres_id: editingSlot.postgres_id || undefined,
            colgcd: selectedCollege || '1',
            tenant: tenantSlug,
            tenantSlug,
            day_of_week: editingSlot.day_of_week,
            start_time: editingSlot.start_time,
          }),
        }).catch(() => null);
      }

      // 2. Call NestJS backend PostgreSQL timetable API
      let pgSaved = false;
      let pgSlotId: string | null = null;
      let pgErrorMsg = '';

      // For SRMS tenants, proceed to save PG if SRMS save succeeded; for non-SRMS tenants, always save to PG!
      if (!isSrmsTenant || srmsSaved) {
        try {
          const pRes = await fetch(url, {
            method,
            headers: {
              'Content-Type': 'application/json',
              'x-tenant-slug': tenantSlug,
              'x-tenant-id': tenantSlug,
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
      }

      // 3. TRANSACTION EVALUATION
      const transactionSuccessful = isSrmsTenant ? (srmsSaved && pgSaved) : pgSaved;

      if (transactionSuccessful) {
        // Synchronize active draft if loaded so draft state in DB and UI stays in sync
        if (activeDraft) {
          try {
            const currentSlots: any[] = typeof activeDraft.slots === 'string'
              ? JSON.parse(activeDraft.slots || '[]')
              : (Array.isArray(activeDraft.slots) ? activeDraft.slots : []);
            
            const updatedSlotItem = {
              id: pgSlotId || srmsEventId || editingSlot?.id || `slot_${Date.now()}`,
              postgres_id: pgSlotId || editingSlot?.postgres_id || undefined,
              dayOfWeek: formData.dayOfWeek,
              day_of_week: formData.dayOfWeek,
              startTime: formData.startTime,
              start_time: formData.startTime,
              endTime: formData.endTime,
              end_time: formData.endTime,
              colgCd: selectedCollege || '1',
              colg_cd: selectedCollege || '1',
              courseCd: selectedCourse || '13',
              course_cd: selectedCourse || '13',
              branchCd: selectedBranch || '1',
              branch_cd: selectedBranch || '1',
              batchCd: selectedBatch || '2',
              batch_cd: selectedBatch || '2',
              semester: selectedSemester || '3',
              section: formData.sectionValue || selectedSection || '1',
              subjectId: formData.subjectId,
              subject_id: formData.subjectId,
              subjectName: subTitle,
              subject_name: subTitle,
              subjectCode: subCode,
              subject_code: subCode,
              facultyId: formData.facultyId,
              faculty_id: formData.facultyId,
              facultyName: facName,
              faculty_name: facName,
              facultyEmpId: facEmpId,
              unitName: formData.unitName || 'Unit 1',
              unit_name: formData.unitName || 'Unit 1',
              unitId: formData.unitId || 'unit_1',
              topic: formData.topic || subTitle,
              subTopics: subTopicsStr,
              competencyCodes: selectedCompetencies.join(','),
              room: roomName,
              cameraId: formData.cameraId,
              slotType: formData.slotType,
              groupValue: formData.groupValue || '0',
            };

            let newDraftSlots: any[];
            if (isEdit && editingSlot) {
              const editId = String(editingSlot.id);
              const editPgId = editingSlot.postgres_id ? String(editingSlot.postgres_id) : '';
              newDraftSlots = currentSlots.map((s: any) => {
                if (String(s.id) === editId || (editPgId && String(s.id) === editPgId) || (s.postgres_id && (String(s.postgres_id) === editId || String(s.postgres_id) === editPgId))) {
                  return { ...s, ...updatedSlotItem };
                }
                return s;
              });
            } else {
              newDraftSlots = [...currentSlots, updatedSlotItem];
            }

            const updatedDraftObj = { ...activeDraft, slots: newDraftSlots };
            setActiveDraft(updatedDraftObj);
            activeDraftRef.current = updatedDraftObj;

            const tkn = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
            await fetch(`/api/v1/exams/timetable-drafts?tenant=${tenantSlug}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-tenant-slug': tenantSlug,
                ...(tkn ? { Authorization: `Bearer ${tkn}` } : {}),
              },
              body: JSON.stringify(updatedDraftObj),
            }).catch(() => null);
          } catch (e: any) {
            console.warn('[handleSaveSlot draft sync error]:', e?.message);
          }
        }

        showAlert('success', isSrmsTenant
          ? (isEdit ? 'Timetable slot updated successfully across Database & SRMS Portal!' : 'Timetable slot scheduled successfully and committed across Database & SRMS Portal!')
          : (isEdit ? 'Timetable slot updated successfully and saved to PostgreSQL!' : 'Timetable slot scheduled successfully and saved to PostgreSQL!'));
        setModalError(null);
        setIsModalOpen(false);
        setEditingSlot(null);
        fetchTimetableSlots(currentDate);
      } else {
        // ROLLBACK PARTIAL WRITE TO PRESERVE CONSISTENCY
        if (srmsSaved && !pgSaved && srmsEventId) {
          console.warn('[ATOMIC ROLLBACK] Reverting SRMS event:', srmsEventId);
          await fetch(`/api/srms/add-event?id=${srmsEventId}&colgcd=${selectedCollege || '1'}`, { method: 'DELETE' }).catch(() => { });
        }
        if (pgSaved && !srmsSaved && pgSlotId && isSrmsTenant) {
          console.warn('[ATOMIC ROLLBACK] Reverting PG timetable slot:', pgSlotId);
          await fetch(`${API_BASE}/timetable/${pgSlotId}?tenant=${tenantSlug}`, {
            method: 'DELETE',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          }).catch(() => { });
        }

        // KEEP MODAL OPEN & HIGHLIGHT THE CONFLICT / ERROR
        const finalError = srmsErrorMsg || pgErrorMsg || 'Schedule transaction rejected. Please check fields and try again.';
        showAlert('error', finalError);
        setModalError(finalError);
        if (modalScrollRef.current) {
          modalScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
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

  const handleDeleteSlot = async (slotId: string, e?: React.MouseEvent, slotObj?: TimetableSlot) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to delete this scheduled session?')) return;
    setLoading(true);

    if (mode === 'clerk') {
      const targetDraft = activeDraftRef.current || activeDraft;
      if (targetDraft?.status === 'HOD_APPROVED') {
        showAlert('error', 'This timetable has already been approved by HOD and is locked for edits.');
        setLoading(false);
        return;
      }
      try {
        const tenantSlug = getActiveTenantSlug();
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
        const headers: any = {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const currentSlots: any[] = typeof targetDraft?.slots === 'string'
          ? JSON.parse(targetDraft.slots || '[]')
          : (Array.isArray(targetDraft?.slots) ? targetDraft.slots : []);

        const cleanSlotId = String(slotId || '');
        const targetDay = Number(slotObj?.day_of_week ?? slotObj?.dayOfWeek ?? editingSlot?.day_of_week ?? editingSlot?.dayOfWeek ?? -1);
        const targetStart = String(slotObj?.start_time || slotObj?.startTime || editingSlot?.start_time || editingSlot?.startTime || '').slice(0, 5);

        // Robust multi-strategy filter: match by ID, draft index, or Day of Week + Start Time
        const remaining = currentSlots.filter((s: any, idx: number) => {
          const sId = String(s.id || s.postgres_id || '');
          if (cleanSlotId && (sId === cleanSlotId || cleanSlotId === `draft_slot_${idx}`)) {
            return false;
          }
          if (targetDay !== -1 && targetStart) {
            const sDay = Number(s.dayOfWeek ?? s.day_of_week ?? -1);
            const sStart = String(s.startTime || s.start_time || '').slice(0, 5);
            if (sDay === targetDay && sStart === targetStart) {
              return false;
            }
          }
          return true;
        });

        const updatedDraft = {
          ...(targetDraft || {}),
          slots: remaining,
        };

        // 1. Immediate optimistic UI update
        setActiveDraft(updatedDraft);
        activeDraftRef.current = updatedDraft;
        if (typeof window !== 'undefined' && updatedDraft.id) {
          localStorage.setItem('activeClerkDraftId', updatedDraft.id);
        }

        setSlots((prev) =>
          prev.filter((sl: any) => {
            const slId = String(sl.id || sl.postgres_id || '');
            if (cleanSlotId && slId === cleanSlotId) return false;
            if (targetDay !== -1 && targetStart) {
              const slDay = Number(sl.day_of_week ?? sl.dayOfWeek ?? -1);
              const slStart = String(sl.start_time || sl.startTime || '').slice(0, 5);
              if (slDay === targetDay && slStart === targetStart) return false;
            }
            return true;
          })
        );

        if (remaining.length === 0) {
          setSlots([]);
        }

        // 2. Persist updated draft to database (maintains the draft with remaining slots)
        if (targetDraft?.id) {
          await fetch(`/api/v1/exams/timetable-drafts?tenant=${tenantSlug}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(updatedDraft),
          });
        }

        // 3. Purge from PostgreSQL and SRMS if event was previously registered
        fetch('/api/srms/delete-event', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-slug': tenantSlug,
            'x-tenant-id': tenantSlug,
          },
          body: JSON.stringify({
            id: cleanSlotId,
            postgres_id: (slotObj as any)?.postgres_id || (editingSlot as any)?.postgres_id || null,
            colgcd: selectedCollege || '1',
            tenant: tenantSlug,
            tenantSlug,
            day_of_week: targetDay !== -1 ? targetDay : undefined,
            start_time: targetStart || undefined,
            course: selectedCourse,
            branch: selectedBranch,
            batch: selectedBatch,
            sem: selectedSemester,
            sec: selectedSection,
          }),
        }).catch(() => null);

        if (targetDraft?.id) {
          await loadClerkDrafts(targetDraft.id, true);
        }

        showAlert('success', 'Scheduled lecture removed from timetable draft!');
        setIsModalOpen(false);
        setEditingSlot(null);
        setHoveredSlotInfo(null);
      } catch (err: any) {
        showAlert('error', err?.message || 'Failed to delete draft lecture');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const tenantSlug = getActiveTenantSlug();
      const isSrmsTenant = Boolean(tenantSlug && tenantSlug.toLowerCase().includes('srms'));
      const cleanId = String(slotId);
      const pgId = (slotObj as any)?.postgres_id || (editingSlot as any)?.postgres_id || null;

      // 1. Server-side proxy call to delete-event:
      const srmsDelRes = await fetch('/api/srms/delete-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug,
          'x-tenant-id': tenantSlug,
        },
        body: JSON.stringify({
          id: cleanId,
          postgres_id: pgId,
          colgcd: selectedCollege || '1',
          tenant: tenantSlug,
          tenantSlug,
          day_of_week: slotObj?.day_of_week ?? editingSlot?.day_of_week,
          start_time: slotObj?.start_time || editingSlot?.start_time,
          end_time: slotObj?.end_time || editingSlot?.end_time,
          course: selectedCourse,
          branch: selectedBranch,
          batch: selectedBatch,
          sem: selectedSemester,
          sec: selectedSection,
        }),
      });
      const srmsDelJson = await srmsDelRes.json().catch(() => null);

      // 2. Delete from PostgreSQL timetable_slots via NestJS TypeORM
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const idsToDelete = [cleanId, pgId, ...(srmsDelJson?.deleted_ids || [])].filter(Boolean);
      for (const tid of Array.from(new Set(idsToDelete))) {
        await fetch(`${API_BASE}/timetable/${tid}?tenant=${tenantSlug}`, {
          method: 'DELETE',
          headers: {
            'x-tenant-slug': tenantSlug,
            'x-tenant-id': tenantSlug,
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        }).catch(() => { });
      }

      // 3. Synchronize active draft if loaded in memory and database
      const curDraft = activeDraftRef.current || activeDraft;
      if (curDraft) {
        try {
          const currentSlots: any[] = typeof curDraft.slots === 'string'
            ? JSON.parse(curDraft.slots || '[]')
            : (Array.isArray(curDraft.slots) ? curDraft.slots : []);
          const targetDay = Number(slotObj?.day_of_week ?? slotObj?.dayOfWeek ?? editingSlot?.day_of_week ?? editingSlot?.dayOfWeek ?? -1);
          const targetStart = String(slotObj?.start_time || slotObj?.startTime || editingSlot?.start_time || editingSlot?.startTime || '').slice(0, 5);

          const remaining = currentSlots.filter((s: any) => {
            const sId = String(s.id || s.postgres_id || '');
            if (idsToDelete.includes(sId)) return false;
            if (targetDay !== -1 && targetStart) {
              const sDay = Number(s.dayOfWeek ?? s.day_of_week ?? -1);
              const sStart = String(s.startTime || s.start_time || '').slice(0, 5);
              if (sDay === targetDay && sStart === targetStart) return false;
            }
            return true;
          });

          const updatedDraft = { ...curDraft, slots: remaining };
          setActiveDraft(updatedDraft);
          activeDraftRef.current = updatedDraft;
          if (typeof window !== 'undefined' && updatedDraft.id) {
            localStorage.setItem('activeClerkDraftId', updatedDraft.id);
          }
          if (remaining.length === 0) {
            setSlots([]);
          }

          const tkn = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
          await fetch(`/api/v1/exams/timetable-drafts?tenant=${tenantSlug}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-tenant-slug': tenantSlug,
              ...(tkn ? { Authorization: `Bearer ${tkn}` } : {}),
            },
            body: JSON.stringify(updatedDraft),
          }).catch(() => null);
        } catch (draftErr: any) {
          console.warn('[handleDeleteSlot draft sync error]:', draftErr?.message);
        }
      }

      const successMsg = isSrmsTenant
        ? (srmsDelJson?.message || 'Timetable session deleted from SRMS portal and database!')
        : 'Timetable session deleted successfully from database!';
      showAlert('success', successMsg);
      setHoveredSlotInfo(null);
      setIsModalOpen(false);
      setEditingSlot(null);
      setSlots(prev => prev.filter(s => !idsToDelete.includes(String(s.id)) && !idsToDelete.includes(String((s as any).postgres_id))));
      fetchTimetableSlots(currentDate);
    } catch (err: any) {
      showAlert('error', err?.message || 'Network error while deleting slot.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingSlot) return;
    await handleDeleteSlot(editingSlot.id, undefined, editingSlot);
  };

  const handleGridCellClick = (dayVal: number, timeStart: string, defaultEnd: string) => {
    setEditingSlot(null);
    setSelectedCompetencies([]);
    setCompetencySearchTerm('');

    const activeList = camerasList && camerasList.length > 0 ? camerasList : DEFAULT_CAMERAS;
    const defaultCam = activeList.length > 0 ? String(activeList[0].camera_id) : '1';
    const defaultCamObj = activeList.find(c => String(c.camera_id) === defaultCam) || activeList[0] || DEFAULT_CAMERAS[0];

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
      room: defaultCamObj?.classroom || 'Web Cam',
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

    const matchedSub = availableFormSubjects.find(s => 
      (s.id && String(s.id) === String(slot.subject_id)) || 
      (s.linkcd && String(s.linkcd) === String(slot.subject_id)) || 
      (s.sub_cd && String(s.sub_cd) === String(slot.subject_id)) || 
      (s.code && String(s.code) === String(slot.subject_id)) || 
      (s.code && String(s.code) === String(slot.subject_code)) ||
      (s.name && slot.subject_name && s.name.trim().toLowerCase() === slot.subject_name.trim().toLowerCase())
    );
    const resolvedSubjectId = matchedSub 
      ? String(matchedSub.id || matchedSub.code || matchedSub.linkcd || matchedSub.sub_cd || '') 
      : String(slot.subject_id || '');
    
    const activeList = camerasList && camerasList.length > 0 ? camerasList : DEFAULT_CAMERAS;
    const rawCamId = (slot.camera_id || slot.cameraId || (slot as any).CameraLink);
    const defaultCam = (rawCamId && String(rawCamId) !== '0') ? String(rawCamId) : (activeList[0] ? String(activeList[0].camera_id) : '1');
    const defaultCamObj = activeList.find(c => String(c.camera_id) === String(defaultCam)) || activeList[0] || DEFAULT_CAMERAS[0];

    setFormData({
      dayOfWeek: slot.day_of_week,
      startTime: slot.start_time,
      endTime: slot.end_time,
      departmentId: slot.department_id || selectedDept || '',
      subjectId: resolvedSubjectId,
      subjectCode: slot.subject_code || matchedSub?.code || matchedSub?.sub_cd || '',
      subjectTitle: slot.subject_name || matchedSub?.name || matchedSub?.sub_name || '',
      facultyId: slot.faculty_id || matchedSub?.empid || '',
      facultyEmpId: (slot as any).faculty_code || matchedSub?.empid || slot.faculty_id || '',
      facultyName: (slot.faculty_name && slot.faculty_name !== 'Faculty Member') ? slot.faculty_name : (matchedSub?.faculty_name || matchedSub?.EmpName || ''),
      room: slot.room || defaultCamObj?.classroom || 'Web Cam',
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

  const rawActiveSlots: any[] = activeDraft
    ? (typeof activeDraft.slots === 'string' ? JSON.parse(activeDraft.slots || '[]') : (Array.isArray(activeDraft.slots) ? activeDraft.slots : []))
    : [];
  const activeDraftSlots: any[] = rawActiveSlots.map((s: any) => ({
    ...s,
    hodRemark: s.hodRemark || s.hod_remark || s.remark || (activeDraft?.hod_remarks && rawActiveSlots.length === 1 ? activeDraft.hod_remarks : ''),
    hod_remark: s.hodRemark || s.hod_remark || s.remark || (activeDraft?.hod_remarks && rawActiveSlots.length === 1 ? activeDraft.hod_remarks : ''),
  }));

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
            border: 1.5px solid #000000 !important;
            table-layout: fixed !important;
            font-size: 6.5pt !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            empty-cells: show !important;
          }
          #timetable-print-area table.timetable-main-grid th, 
          #timetable-print-area table.timetable-main-grid td {
            border: 1.5px solid #000000 !important;
            border-color: #000000 !important;
            padding: 1.5px 2px !important;
            vertical-align: top !important;
            line-height: 1.1 !important;
            box-sizing: border-box !important;
            empty-cells: show !important;
          }
          #timetable-print-area table.timetable-main-grid th {
            background-color: #f1f5f9 !important;
            color: #000000 !important;
            font-size: 6.5pt !important;
            font-weight: 800 !important;
            text-align: center !important;
            padding: 2px 1px !important;
            height: 18px !important;
            border: 1.5px solid #000000 !important;
          }
          #timetable-print-area table.timetable-main-grid tr {
            height: auto !important;
            min-height: 42px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          #timetable-print-area table.timetable-main-grid td.day-cell {
            background-color: #f8fafc !important;
            color: #000000 !important;
            font-weight: 900 !important;
            font-size: 7pt !important;
            text-align: center !important;
            vertical-align: middle !important;
            width: 64px !important;
            padding: 1px !important;
            border: 1.5px solid #000000 !important;
          }
          #timetable-print-area table.timetable-main-grid td.break-cell {
            background-color: #e2e8f0 !important;
            color: #000000 !important;
            font-size: 5.5pt !important;
            font-weight: 900 !important;
            text-align: center !important;
            vertical-align: middle !important;
            width: 20px !important;
            padding: 0 !important;
            height: auto !important;
            border: 1.5px solid #000000 !important;
          }
          #timetable-print-area table.timetable-main-grid td.break-cell div {
            padding: 2px 0 !important;
            font-size: 5.5pt !important;
            letter-spacing: 0.15em !important;
          }
          #timetable-print-area .slot-cell,
          #timetable-print-area td.slot-cell {
            height: 42px !important;
            min-height: 42px !important;
            padding: 1.5px 2px !important;
            vertical-align: top !important;
            background-color: #ffffff !important;
            border: 1.5px solid #000000 !important;
            border-color: #000000 !important;
            box-sizing: border-box !important;
            empty-cells: show !important;
          }
          #timetable-print-area .slot-empty-box {
            min-height: 38px !important;
            height: 38px !important;
            width: 100% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            box-sizing: border-box !important;
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

      <Sidebar role={sidebarRole} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={mode === 'clerk' ? "Timetable Designer" : "College Timetable Designer"} />
        <main className="p-6 space-y-6 flex-1 flex flex-col bg-slate-50 dark:bg-[#0F172A]">

          {alert && (
            <div className={`p-4 rounded-2xl border text-xs font-extrabold transition-all shadow-lg animate-fade-in flex items-center gap-2 ${alert.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : alert.type === 'info'
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                  : alert.type === 'warning'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
              }`}>
              <span>{alert.type === 'success' ? '✅' : alert.type === 'info' ? 'ℹ️' : alert.type === 'warning' ? '⚠️' : '❌'}</span>
              <span>{alert.message}</span>
            </div>
          )}

          {/* Top Level Navigation Tabs */}
          {mode === 'clerk' ? (
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => setActiveTab('format')}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs transition-all shadow-sm cursor-pointer ${activeTab === 'format'
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
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs transition-all shadow-sm cursor-pointer ${activeTab === 'design'
                    ? 'bg-gradient-to-r from-[#5B4BFF] to-[#7867FF] text-white shadow-indigo-500/25 ring-2 ring-[#5B4BFF]/30 scale-[1.02]'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 hover:border-[#5B4BFF]/40'
                  }`}
              >
                <span className="text-base">📅</span>
                <span>2. Timetable Designer</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => setActiveTab('format')}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs transition-all shadow-sm cursor-pointer ${activeTab === 'format'
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
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs transition-all shadow-sm cursor-pointer ${activeTab === 'design'
                    ? 'bg-gradient-to-r from-[#5B4BFF] to-[#7867FF] text-white shadow-indigo-500/25 ring-2 ring-[#5B4BFF]/30 scale-[1.02]'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 hover:border-[#5B4BFF]/40'
                  }`}
              >
                <span className="text-base">📅</span>
                <span>2. Design - TimeTable</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('copy')}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs transition-all shadow-sm cursor-pointer ${activeTab === 'copy'
                    ? 'bg-gradient-to-r from-[#F36C21] to-[#FF9248] text-white shadow-orange-500/25 ring-2 ring-[#F36C21]/30 scale-[1.02]'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 hover:border-[#F36C21]/40'
                  }`}
              >
                <span className="text-base">📋</span>
                <span>3. Copy TimeTable</span>
              </button>
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
                  Hierarchy: 1. College ➔ 2. Course ➔ 3. Branch ➔ 4. Batch ➔ 5. Semester ➔ 6. Section
                </p>
              </div>

              {/* Action Buttons: Sync Timetable & Print */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncTimetable}
                  disabled={syncingTimetable}
                  className="px-3.5 py-2 text-xs font-black rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 border border-indigo-500 transition-all uppercase flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  title="Fetch live subjects and mapped faculty from SRMS EmployeeInfo.asmx/Loadsubject"
                >
                  <span className={syncingTimetable ? 'animate-spin inline-block' : ''}>{syncingTimetable ? '⏳' : '🔄'}</span>
                  <span>{syncingTimetable ? 'Syncing...' : 'Sync Timetable'}</span>
                </button>

                {activeTab === 'design' && (
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 text-xs font-black rounded-xl bg-[#F36C21] hover:bg-[#E05B10] text-white shadow-md shadow-orange-600/30 border border-orange-500 transition-all uppercase flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>🖨️</span>
                    <span>Print</span>
                  </button>
                )}
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
                  disabled={collegesList.length === 0}
                  onChange={(e) => handleFilterCollegeChange(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer disabled:cursor-not-allowed text-xs max-w-[240px] truncate"
                >
                  {collegesList.map((colg, idx) => (
                    <option key={colg.code || idx} value={colg.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      [#{colg.code}] {colg.name}
                    </option>
                  ))}
                </select>
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
                  <option value="0" className="bg-white dark:bg-slate-900 text-slate-500">
                    -- Select Course --
                  </option>
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
                  disabled={selectedCourse === '0' || branchesList.length === 0}
                  onChange={(e) => handleFilterBranchChange(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 text-xs max-w-[180px] truncate"
                >
                  <option value="0" className="bg-white dark:bg-slate-900 text-slate-500">
                    -- Select Branch --
                  </option>
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
                  disabled={selectedBranch === '0' || batchesList.length === 0}
                  onChange={(e) => handleFilterBatchChange(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-white font-black focus:outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 text-xs max-w-[180px] truncate"
                >
                  <option value="0" className="bg-white dark:bg-slate-900 text-slate-500">
                    -- Select Batch --
                  </option>
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
                  <span>📖</span> Semester <span className="font-extrabold text-[#5B4BFF] dark:text-indigo-400">({semestersList.length})</span>:
                </span>
                <select
                  value={selectedSemester}
                  disabled={selectedBatch === '0' || semestersList.length === 0}
                  onChange={(e) => handleFilterSemesterChange(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 text-xs max-w-[150px] truncate"
                >
                  <option value="0" className="bg-white dark:bg-slate-900 text-slate-500">
                    -- Select Semester --
                  </option>
                  {semestersList.map((sem, idx) => (
                    <option key={sem.code || idx} value={sem.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      [#{sem.code}] {sem.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. Section Selector (1 = A, 2 = B, 3 = C, 4 = D) */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-sm hover:border-[#5B4BFF]/40 transition-all">
                <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                  <span>🔠</span> Section <span className="font-extrabold text-[#5B4BFF] dark:text-indigo-400">({sectionsList.length})</span>:
                </span>
                <select
                  value={selectedSection}
                  disabled={selectedSemester === '0'}
                  onChange={(e) => handleFilterSectionChange(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 text-xs max-w-[140px] truncate"
                >
                  <option value="0" className="bg-white dark:bg-slate-900 text-slate-500">
                    -- Select Section --
                  </option>
                  {sectionsList.map((sec, idx) => (
                    <option key={sec.code || idx} value={sec.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      [#{sec.code}] {sec.name}
                    </option>
                  ))}
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
              selectedBranch={selectedBranch}
              selectedDept={selectedDept}
              selectedBatch={selectedBatch}
              collegeName={selectedCollegeObj?.name || 'SRMS CET, BAREILLY'}
              courseName={selectedCourseObj?.name || 'BCA'}
              deptName={selectedDeptObj?.name || selectedBranchObj?.name || 'BCA DEPARTMENT'}
              tenantSlug={getActiveTenantSlug()}
              onSaveTimeFormat={async (updatedSlots) => {
                setConfiguredTimeSlots(updatedSlots);
                try {
                  const slug = getActiveTenantSlug();
                  const numBranch = (selectedBranch && selectedBranch !== '0' && !selectedBranch.includes('-') && !isNaN(Number(selectedBranch))) ? selectedBranch : '1';
                  await fetch(`/api/v1/exams/timetable-format?tenant=${slug}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-tenant-slug': slug },
                    body: JSON.stringify({
                      colgCd: selectedCollege || '1',
                      courseCd: selectedCourse || '13',
                      branchCd: numBranch,
                      departmentId: selectedDept || '',
                      slots: updatedSlots,
                    }),
                  });

                  if (activeDraft) {
                    const updatedDraft = { ...activeDraft, format_slots: updatedSlots };
                    setActiveDraft(updatedDraft);
                    activeDraftRef.current = updatedDraft;
                    await fetch(`/api/v1/exams/timetable-drafts?tenant=${slug}`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'x-tenant-slug': slug },
                      body: JSON.stringify({
                        id: activeDraft.id,
                        formatSlots: updatedSlots,
                        slots: typeof activeDraft.slots === 'string' ? JSON.parse(activeDraft.slots || '[]') : (activeDraft.slots || []),
                      }),
                    }).catch(() => {});
                  }
                } catch (err) {
                  console.warn('Failed to sync time format to DB:', err);
                }
                showAlert('success', `Saved Time Format with ${updatedSlots.length} periods & breaks for ${selectedCourseObj?.name || 'Course'}`);
              }}
              onSwitchToDesignTab={() => setActiveTab('design')}
            />
          )}

          {/* Tab 2: Interactive Design - TimeTable Schedule Grid (Admin & Clerk) */}
          {activeTab === 'design' && (
            <>
              {/* Timetable Draft & Approvals Workspace Control Bar (Clerk Only) */}
              {mode === 'clerk' && (
                <div className="p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#5B4BFF]/20 shadow-md space-y-4">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-xl">📝</span>
                        <h2 className="text-base font-black text-[#1B1E28] dark:text-white">
                          Timetable Designer — Clerk Draft Workspace
                        </h2>
                        {activeDraft && (() => {
                          const badge = CLERK_STATUS_BADGE[activeDraft.status] || CLERK_STATUS_BADGE.DRAFT;
                          return (
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${badge.cls}`}>
                              {badge.label}
                            </span>
                          );
                        })()}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {activeDraft
                          ? `Draft: "${activeDraft.title}" (${(typeof activeDraft.slots === 'string' ? JSON.parse(activeDraft.slots || '[]') : (activeDraft.slots || [])).length} lectures). Click "+ Add Lecture" or click any cell in the weekly grid.`
                          : 'No draft selected for this course/branch. Create a new draft or select an existing draft below.'}
                      </p>
                      {activeDraft?.status === 'HOD_APPROVED' && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold mt-1">
                          <span>🔒</span>
                          <span>Official Schedule Approved by HOD — This timetable is live and locked against modifications.</span>
                        </div>
                      )}
                      {activeDraft?.hod_remarks && (
                        <div className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1">
                          ⚠️ HOD Note: {activeDraft.hod_remarks}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Draft Switcher Dropdown */}
                      {clerkDrafts.filter((d: any) => selectedCourse === '0' || String(d.course_cd || '') === String(selectedCourse)).length > 0 && (
                        <select
                          value={activeDraft?.id || ''}
                          onChange={(e) => {
                            const found = clerkDrafts.find(d => String(d.id) === e.target.value);
                            if (found) {
                              handleSelectDraft(found);
                            }
                          }}
                          className="px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer max-w-[220px] truncate"
                          title="Switch active draft"
                        >
                          {clerkDrafts
                            .filter((d: any) => selectedCourse === '0' || String(d.course_cd || '') === String(selectedCourse))
                            .map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.title} ({d.status || 'DRAFT'})
                              </option>
                            ))}
                        </select>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowClerkDraftForm(true)}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-extrabold transition-all border border-slate-300 dark:border-slate-700 cursor-pointer flex items-center gap-1.5"
                      >
                        <span>➕</span>
                        <span>New Draft</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleAddNewLectureModal}
                        className="px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4a3cf5] text-white text-xs font-extrabold transition-all shadow-md shadow-indigo-500/25 cursor-pointer flex items-center gap-1.5"
                        title="Add lecture to draft"
                      >
                        <span>➕</span>
                        <span>Add Lecture</span>
                      </button>

                      {activeDraft && (!activeDraft.status || activeDraft.status === 'DRAFT' || activeDraft.status === 'HOD_REJECTED') && (
                        <button
                          type="button"
                          onClick={() => submitDraftToHod(activeDraft.id)}
                          disabled={sendingClerkDraftId === activeDraft.id || (typeof activeDraft.slots === 'string' ? JSON.parse(activeDraft.slots || '[]') : (activeDraft.slots || [])).length === 0}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#F36C21] to-[#FF9248] hover:from-[#e05b10] hover:to-[#f36c21] text-white text-xs font-black transition-all shadow-md shadow-orange-500/25 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                          title={(typeof activeDraft.slots === 'string' ? JSON.parse(activeDraft.slots || '[]') : (activeDraft.slots || [])).length === 0 ? 'Add at least one lecture before submitting' : 'Submit draft to HOD for approval'}
                        >
                          <span>{sendingClerkDraftId === activeDraft.id ? '⏳' : '📤'}</span>
                          <span>{sendingClerkDraftId === activeDraft.id ? 'Submitting...' : 'Submit to HOD'}</span>
                        </button>
                      )}

                      {activeDraft && activeDraft.status !== 'HOD_APPROVED' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteDraft(activeDraft.id)}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-300 transition-all cursor-pointer"
                          title="Delete active draft"
                        >
                          <span>🗑️</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Clerk Draft Banners: Staging / Rejection / Pending */}
              {mode === 'clerk' && activeDraft && (
                <div className="space-y-3">
                  {(!activeDraft.status || activeDraft.status === 'DRAFT') && (
                    <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-orange-50 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-orange-950/30 border-2 border-indigo-200 dark:border-indigo-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#5B4BFF]/10 text-[#5B4BFF] flex items-center justify-center text-lg font-black shrink-0">
                          📝
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                              Draft Staging: &ldquo;{activeDraft.title}&rdquo;
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#5B4BFF]/10 text-[#5B4BFF] dark:text-indigo-400 border border-[#5B4BFF]/20">
                              {activeDraftSlots.length} Lecture{activeDraftSlots.length === 1 ? '' : 's'} Staged
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Lectures saved here are staged in your timetable draft. Once your draft is ready, click <strong>&quot;Submit to HOD for Approval&quot;</strong>. Only HOD can approve live publishing.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => submitDraftToHod(activeDraft.id)}
                        disabled={sendingClerkDraftId === activeDraft.id || activeDraftSlots.length === 0}
                        className="shrink-0 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F36C21] to-[#FF9248] hover:from-[#e05b10] hover:to-[#f36c21] text-white text-xs font-black transition-all shadow-lg shadow-orange-500/25 disabled:opacity-50 cursor-pointer flex items-center gap-2 active:scale-95"
                        title={activeDraftSlots.length === 0 ? 'Add at least one lecture before submitting draft' : 'Submit draft to HOD for approval'}
                      >
                        <span>{sendingClerkDraftId === activeDraft.id ? '⏳' : '📤'}</span>
                        <span>{sendingClerkDraftId === activeDraft.id ? 'Submitting to HOD...' : 'Submit to HOD for Approval'}</span>
                      </button>
                    </div>
                  )}

                  {activeDraft.status === 'HOD_REJECTED' && (
                    <div className="bg-gradient-to-br from-rose-50 via-white to-orange-50 dark:from-rose-950/50 dark:via-slate-900 dark:to-orange-950/30 border-2 border-rose-500 dark:border-rose-700 rounded-2xl p-5 shadow-lg space-y-4">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center text-2xl font-black shrink-0 shadow-md shadow-rose-600/30">
                            ⚠️
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h4 className="font-black text-base text-rose-950 dark:text-rose-100">
                                HOD Action Required: Timetable Revisions Requested
                              </h4>
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-200 dark:bg-rose-900 text-rose-950 dark:text-rose-100 border border-rose-400">
                                🔴 Reschedule Required
                              </span>
                            </div>
                            <div className="text-xs text-rose-900 dark:text-rose-200 font-semibold">
                              Reviewing Authority: <strong>Dr. Anuj Kumar (Head of Department)</strong>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => submitDraftToHod(activeDraft.id)}
                          disabled={sendingClerkDraftId === activeDraft.id || activeDraftSlots.length === 0}
                          className="shrink-0 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F36C21] to-[#FF9248] hover:from-[#e05b10] hover:to-[#f36c21] text-white text-xs font-black transition-all shadow-lg shadow-orange-500/25 disabled:opacity-50 cursor-pointer flex items-center gap-2 active:scale-95"
                          title="Re-submit timetable draft to HOD once revisions are completed"
                        >
                          <span>{sendingClerkDraftId === activeDraft.id ? '⏳' : '🔄'}</span>
                          <span>{sendingClerkDraftId === activeDraft.id ? 'Re-submitting to HOD...' : 'Re-submit Timetable Draft to HOD'}</span>
                        </button>
                      </div>

                      {/* Official HOD Directive Box */}
                      {activeDraft.hod_remarks && (
                        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border-2 border-rose-300 dark:border-rose-800 shadow-sm flex items-start gap-3">
                          <span className="text-xl">💬</span>
                          <div className="space-y-0.5">
                            <div className="text-[11px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-300">
                              Official HOD Directive &amp; Remarks:
                            </div>
                            <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                              &ldquo;{activeDraft.hod_remarks}&rdquo;
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 3-Step Action Guide for Clerk */}
                      <div className="p-3.5 rounded-xl bg-rose-100/80 dark:bg-rose-900/40 border border-rose-300 dark:border-rose-700 space-y-2">
                        <div className="text-xs font-black text-rose-950 dark:text-rose-100 uppercase tracking-wider flex items-center gap-1.5">
                          <span>📋</span>
                          <span>What Clerk Needs to Do as per HOD Instruction:</span>
                        </div>
                        <ol className="text-xs font-bold text-rose-900 dark:text-rose-200 space-y-1.5 pl-4 list-decimal">
                          <li>
                            <strong>Find the marked slot:</strong> Locate the lecture slot highlighted in <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-black text-[10.5px]">RED</span> on the weekly timetable grid or Draft Lectures list below.
                          </li>
                          <li>
                            <strong>Reschedule the slot:</strong> Click the red slot on the grid (or click <em>&ldquo;✏️ Reschedule&rdquo;</em> in the table below). In the modal, change the Start Time &amp; End Time as directed by HOD ({activeDraft.hod_remarks ? `&ldquo;${activeDraft.hod_remarks}&rdquo;` : 'update time'}), and click <em>&ldquo;Save Lecture&rdquo;</em>.
                          </li>
                          <li>
                            <strong>Re-submit for approval:</strong> Once adjusted, click the orange <em>&ldquo;Re-submit Timetable Draft to HOD&rdquo;</em> button above so HOD Dr. Anuj Kumar can approve and publish it live.
                          </li>
                        </ol>
                      </div>
                    </div>
                  )}

                  {activeDraft.status === 'PENDING_HOD_APPROVAL' && (
                    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-lg font-black shrink-0">
                          ⏳
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-sm text-amber-900 dark:text-amber-100">
                              Timetable Draft Submitted — Awaiting HOD Approval
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                              Read-Only Status
                            </span>
                          </div>
                          <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                            This draft is currently in HOD review queue (Dr. Anuj Kumar). Clerks cannot approve or modify lectures while under HOD review.
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1.5 rounded-xl bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-xs font-black shrink-0 flex items-center gap-1.5">
                        <span>⏳</span>
                        <span>Awaiting HOD Decision</span>
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Official HOD Approved Banner (Visible to Admin Only) */}
              {mode === 'admin' && activeDraft?.status === 'HOD_APPROVED' && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-lg font-black shrink-0">
                      🟢
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-sm text-emerald-900 dark:text-emerald-100">
                          Timetable Approved by HOD (Official &amp; Live)
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
                          Official Schedule
                        </span>
                      </div>
                      <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                        This timetable was reviewed and approved by HOD ({activeDraft.hod_approved_by || 'Dr. Anuj Kumar'}). It is live for Students and Faculty. Edits are locked.
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-xs font-black shrink-0 flex items-center gap-1.5">
                    <span>🔒</span>
                    <span>Approved by HOD (Locked)</span>
                  </span>
                </div>
              )}

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
              ) : (selectedCourse === '0' || selectedBranch === '0' || selectedBatch === '0' || selectedSemester === '0' || selectedSection === '0') ? (
                <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 my-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-[#5B4BFF] flex items-center justify-center text-3xl mx-auto shadow-inner">
                    📅
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
                      Select Academic Parameters to View Timetable
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                      Please select <strong>Course</strong>, <strong>Branch</strong>, <strong>Batch</strong>, <strong>Semester</strong>, and <strong>Section</strong> from the dropdown filters above to load the academic timetable schedule.
                    </p>
                  </div>
                </div>
              ) : (
                <div id="timetable-print-area" className="bg-white dark:bg-slate-900 p-8 border-2 border-slate-800 dark:border-slate-700 rounded-3xl shadow-sm w-full mx-auto print:border-0 print:shadow-none print:p-0 text-slate-800 dark:text-slate-100">

                  {/* College Header */}
                  <div className="print-compact-header text-center space-y-2 border-b-2 border-slate-800 dark:border-slate-700 pb-4 mb-6">
                    <h2 className="text-xl font-extrabold uppercase tracking-wide text-slate-900 dark:text-white">
                      {selectedCollegeObj?.name || (typeof window !== 'undefined' ? localStorage.getItem('collegeName') || localStorage.getItem('college_name') : '') || userTenantSlug.toUpperCase()}
                    </h2>
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 uppercase">
                      {selectedDeptObj?.name || selectedBranchObj?.name || 'ACADEMIC DEPARTMENT'}
                    </h3>
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase">
                      TIME TABLE - {selectedCourseObj?.name || selectedCourse} {selectedBatchObj ? `(BATCH ${selectedBatchObj.name || selectedBatchObj.year || selectedBatchObj.code})` : ''} • SEMESTER {selectedSemester} • SECTION {selectedSection === '1' ? 'A' : selectedSection === '2' ? 'B' : selectedSection === '3' ? 'C' : 'D'} • {weekRangeLabel}
                    </p>
                  </div>

                  {/* Active Draft or Empty Week Banner */}
                  {(activeDraft && (mode === 'clerk' || activeDraft.status === 'HOD_APPROVED') && activeDraftSlots.length > 0) ? (
                    <div className="no-print print:hidden mb-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                      <div className="flex items-center gap-2">
                        <span className="text-base shrink-0">✅</span>
                        <span>
                          <strong>{activeDraft.status === 'HOD_APPROVED' ? 'HOD Approved Live Timetable Active:' : 'Draft Timetable Active:'}</strong> Showing {activeDraftSlots.length} lecture{activeDraftSlots.length === 1 ? '' : 's'} for &quot;{activeDraft.title}&quot;.
                        </span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                        activeDraft.status === 'HOD_APPROVED'
                          ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                          : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                      }`}>
                        {activeDraft.status === 'HOD_APPROVED' ? 'LIVE • HOD APPROVED' : activeDraft.status || 'DRAFT'}
                      </span>
                    </div>
                  ) : (!Array.isArray(slots) || slots.length === 0) ? (
                    <div className="no-print print:hidden mb-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-amber-800 dark:text-amber-300">
                      <div className="flex items-center gap-2">
                        <span className="text-base shrink-0">ℹ️</span>
                        <span>
                          <strong>No scheduled timetable found for {selectedCourseObj?.name || 'this course'} ({selectedBranchObj?.name || 'selected branch'}) Semester {selectedSemester} Section {selectedSection === '1' ? 'A' : selectedSection === '2' ? 'B' : selectedSection === '3' ? 'C' : 'D'} for this week ({weekRangeLabel}).</strong> {mode === 'clerk' ? 'Click any slot cell below to create/assign classes, or use the week navigation above.' : 'No approved timetable is currently active for this week.'}
                        </span>
                      </div>
                    </div>
                  ) : null}

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

                                const draftMapped = activeDraftSlots.map((item: any, idx: number) => ({
                                  id: item.id || `draft_slot_${idx}`,
                                  day_of_week: Number(item.dayOfWeek ?? item.day_of_week ?? 1),
                                  start_time: item.startTime || item.start_time || '09:00:00',
                                  end_time: item.endTime || item.end_time || '10:00:00',
                                  subject_id: String(item.subjectId || item.subject_id || ''),
                                  subject_code: String(item.subjectCode || item.subject_code || ''),
                                  subject_name: item.subjectName || item.subject_name || item.topic || 'Subject',
                                  faculty_id: String(item.facultyId || item.faculty_id || item.facultyEmpId || ''),
                                  faculty_name: item.facultyName || item.faculty_name || 'Faculty',
                                  faculty_code: item.facultyEmpId || item.faculty_code || '',
                                  room: item.room || 'Room 204',
                                  slotType: item.slotType || item.slot_type || 'Lecture',
                                  slot_type: item.slotType || item.slot_type || 'Lecture',
                                  topic: item.topic || '',
                                  unit_name: item.unitName || item.unit_name || '',
                                  unit_id: item.unitId || item.unit_id || '',
                                  sub_topics: item.subTopics || item.sub_topics || '',
                                  competency_codes: item.competencyCodes || item.competency_codes || '',
                                  hodRemark: item.hodRemark || item.hod_remark || item.remark || (activeDraft?.hod_remarks && activeDraftSlots.length === 1 ? activeDraft.hod_remarks : ''),
                                  hod_remark: item.hodRemark || item.hod_remark || item.remark || (activeDraft?.hod_remarks && activeDraftSlots.length === 1 ? activeDraft.hod_remarks : ''),
                                  status: activeDraft?.status || 'DRAFT',
                                  isDraft: true,
                                }));

                                const safeSlots = (mode === 'clerk' && activeDraft)
                                  ? draftMapped
                                  : (activeDraftSlots.length > 0
                                      ? [
                                          ...draftMapped,
                                          ...(Array.isArray(slots) ? slots.filter(sl => !draftMapped.some(dm => Number(dm.day_of_week) === Number(sl.day_of_week) && dm.start_time?.slice(0, 5) === sl.start_time?.slice(0, 5))) : [])
                                        ]
                                      : (Array.isArray(slots) ? slots : []));

                                const cellSlotsRaw = safeSlots.filter(s => {
                                  if (!s || Number(s.day_of_week) !== Number(day.value)) return false;
                                  const slotStart = String(s.start_time || '').slice(0, 5);
                                  const slotEnd = String(s.end_time || '').slice(0, 5);
                                  const colStart = ts.start.slice(0, 5);
                                  const colEnd = ts.end.slice(0, 5);
                                  if (!slotStart) return false;
                                  // 1. Direct match: slot starts at or within this column interval
                                  if ((slotStart >= colStart && slotStart < colEnd) || slotStart === colStart) return true;
                                  // 2. Overlap match: slot started during a preceding break or spans into this column
                                  if (slotStart < colStart && slotEnd > colStart) return true;
                                  return false;
                                });

                                const seenCellKeys = new Set<string>();
                                const cellSlots = cellSlotsRaw.filter(s => {
                                  const normSub = String(s.subject_name || s.subject_code || s.topic || '')
                                    .replace(/\([^)]*\)/g, '')
                                    .trim()
                                    .toLowerCase();
                                  const key = `${s.id || ''}_${s.day_of_week}_${s.start_time?.slice(0, 5)}_${normSub}`;
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
                                              className={`slot-card p-2 rounded-xl transition-all text-left space-y-1.5 shadow-sm text-slate-900 dark:text-white relative group/slot cursor-pointer ${
                                                ((slot as any).hodRemark || (slot as any).hod_remark || (slot as any).remark)
                                                  ? 'bg-rose-50 dark:bg-rose-950/85 border-2 border-rose-500 shadow-md shadow-rose-500/25 ring-2 ring-rose-400/80 animate-pulse hover:border-rose-600'
                                                  : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700/80 hover:shadow-md'
                                              }`}
                                              onClick={(e) => { e.stopPropagation(); handleSlotClick(slot, e); }}
                                              onMouseEnter={(e) => handleSlotMouseEnter(slot, e)}
                                              onMouseLeave={handleSlotMouseLeave}
                                            >
                                              {/* Quick Delete Slot Button */}
                                              <button
                                                type="button"
                                                title="Delete this session"
                                                aria-label="Delete session"
                                                className="absolute -top-1.5 -right-1.5 z-20 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 active:scale-90 text-white flex items-center justify-center text-[10px] font-black shadow-md transition-all duration-150 opacity-0 group-hover/slot:opacity-100 hover:scale-110 no-print print:hidden cursor-pointer"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  e.preventDefault();
                                                  handleDeleteSlot(slot.id, e, slot);
                                                }}
                                              >
                                                ✕
                                              </button>

                                              {/* Subject Name Header */}
                                              <div className="slot-subject font-black text-slate-900 dark:text-white leading-snug text-[11px] truncate pr-3" title={cleanSubName}>
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
                                        <span className="hidden print:block text-[10pt] text-transparent leading-[38px] select-none font-mono">&nbsp;</span>
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

              {/* Draft Lectures Table & Timetable Drafts Management Queue (Clerk Only) */}
              {mode === 'clerk' && (
                <div className="space-y-6 pt-4">
                  {/* 1. Draft Lectures List */}
                  <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <h3 className="font-extrabold text-sm text-[#1B1E28] dark:text-white flex items-center gap-2">
                          <span>📋</span>
                          <span>Draft Lectures List {activeDraft ? `("${activeDraft.title}")` : ''}</span>
                        </h3>
                        <p className="text-xs text-slate-500">
                          Lectures staged in this timetable draft. Click &quot;+ Add Lecture&quot; or click any cell in the grid to schedule new sessions.
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-[#5B4BFF]/10 text-[#5B4BFF] dark:text-indigo-400">
                        {activeDraftSlots.length} lecture{activeDraftSlots.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    {activeDraftSlots.length === 0 ? (
                      <div className="py-12 text-center space-y-2 bg-[#F6F8FC] dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                        <span className="text-3xl">📅</span>
                        <p className="font-bold text-sm text-slate-600 dark:text-slate-300">No lectures added to this draft yet</p>
                        <p className="text-xs text-slate-400">
                          Click &quot;+ Add Lecture&quot; above or click any period in the weekly schedule grid to add a lecture.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[11px] font-black uppercase tracking-wider">
                              <th className="py-2.5 px-3">Day</th>
                              <th className="py-2.5 px-3">Time</th>
                              <th className="py-2.5 px-3">Subject</th>
                              <th className="py-2.5 px-3">Faculty</th>
                              <th className="py-2.5 px-3">Unit</th>
                              <th className="py-2.5 px-3">Topic</th>
                              <th className="py-2.5 px-3">SubTopic</th>
                              <th className="py-2.5 px-3">Room</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {activeDraftSlots.map((s: any, idx: number) => {
                              const dayName = DAYS_OF_WEEK.find(d => d.value === Number(s.dayOfWeek || s.day_of_week))?.name || 'MONDAY';
                              const subName = s.subjectName || s.subject_name || s.topic || '-';
                              const subCode = s.subjectCode || s.subject_code || '';
                              const facName = s.facultyName || s.faculty_name || '-';
                              const facEmp = s.facultyEmpId || s.faculty_code || '';
                              const unitName = s.unitName || s.unit_name || '-';
                              const topicName = s.topic || '-';
                              const subTopicName = s.subTopics || s.sub_topics || s.competencyCodes || s.competency_codes || '-';
                              const roomVal = s.room || '-';
                              const slotStatus = s.status || activeDraft?.status || 'DRAFT';
                              const isApproved = activeDraft?.status === 'HOD_APPROVED';
                              const hodRemark = s.hodRemark || s.hod_remark || s.remark || '';

                              return (
                                <tr key={s.id || idx} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${hodRemark ? 'bg-rose-50/70 dark:bg-rose-950/30 border-l-4 border-l-rose-500' : ''}`}>
                                  <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                                    {dayName}
                                  </td>
                                  <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300 font-bold whitespace-nowrap">
                                    {(s.startTime || s.start_time || '').slice(0, 5)} - {(s.endTime || s.end_time || '').slice(0, 5)}
                                  </td>
                                  <td className="py-3 px-3 font-extrabold text-slate-900 dark:text-white">
                                    <div>{subName}</div>
                                    {subCode && <span className="text-[10px] text-slate-500 font-mono font-normal">#{subCode}</span>}
                                    {hodRemark && (
                                      <div className="mt-1 px-2 py-0.5 rounded-lg bg-rose-100/90 dark:bg-rose-900/50 border border-rose-300 dark:border-rose-700 text-[10.5px] font-extrabold text-rose-800 dark:text-rose-200 flex items-center gap-1.5 animate-pulse">
                                        <span>💬 HOD Remark:</span>
                                        <span>{hodRemark}</span>
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                                    <div>{facName}</div>
                                    {facEmp && <span className="text-[10px] text-indigo-500 font-mono">ID: {facEmp}</span>}
                                  </td>
                                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-medium max-w-[150px] truncate" title={unitName}>
                                    {unitName}
                                  </td>
                                  <td className="py-3 px-3 text-slate-800 dark:text-slate-200 font-semibold max-w-[180px] truncate" title={topicName}>
                                    {topicName}
                                  </td>
                                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-[11px] max-w-[180px] truncate" title={subTopicName}>
                                    {subTopicName}
                                  </td>
                                  <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300 text-[11px] whitespace-nowrap">
                                    {roomVal}
                                  </td>
                                  <td className="py-3 px-3">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-300 dark:border-amber-700">
                                      {slotStatus}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-right whitespace-nowrap">
                                    {isApproved ? (
                                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                        🔒 Locked
                                      </span>
                                    ) : (
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            const matchedSlot: TimetableSlot = {
                                              id: s.id,
                                              day_of_week: Number(s.dayOfWeek || s.day_of_week || 1),
                                              start_time: s.startTime || s.start_time || '09:00:00',
                                              end_time: s.endTime || s.end_time || '10:00:00',
                                              subject_id: s.subjectId || s.subject_id,
                                              subject_name: subName,
                                              subject_code: subCode,
                                              faculty_id: s.facultyId || s.faculty_id,
                                              faculty_name: facName,
                                              faculty_code: facEmp,
                                              room: s.room,
                                              slot_type: s.slotType || s.slot_type || 'Lecture',
                                              topic: s.topic,
                                              unit_name: s.unitName || s.unit_name,
                                              unit_id: s.unitId || s.unit_id,
                                              sub_topics: s.subTopics || s.sub_topics,
                                              competency_codes: s.competencyCodes || s.competency_codes,
                                              section: s.section,
                                            };
                                            handleSlotClick(matchedSlot, e);
                                          }}
                                          className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-xs font-bold transition-all cursor-pointer"
                                          title="Edit draft lecture"
                                        >
                                          ✏️ Edit
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => handleDeleteSlot(s.id, e, s)}
                                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-bold transition-all cursor-pointer"
                                          title="Delete draft lecture"
                                        >
                                          🗑️ Delete
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* 2. Timetable Drafts Management & HOD Approval Queue */}
                  <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <h3 className="font-extrabold text-sm text-[#1B1E28] dark:text-white flex items-center gap-2">
                          <span>📁</span>
                          <span>Timetable Drafts &amp; HOD Approval Queue</span>
                        </h3>
                        <p className="text-xs text-slate-500">
                          Track draft status, preview schedules in the weekly grid format, or submit to HOD for approval.
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {clerkDrafts.length} draft{clerkDrafts.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    {loadingClerkDrafts && clerkDrafts.length === 0 ? (
                      <div className="py-12 flex justify-center">
                        <div className="w-8 h-8 border-3 border-[#5B4BFF] border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : clerkDrafts.length === 0 ? (
                      <div className="py-12 text-center space-y-2 bg-[#F6F8FC] dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                        <span className="text-3xl">📂</span>
                        <p className="font-bold text-sm text-slate-600 dark:text-slate-300">No timetable drafts created yet</p>
                        <p className="text-xs text-slate-400">
                          Click &quot;+ New Draft&quot; above to create your first timetable draft.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {clerkDrafts.map((d) => {
                          const badge = CLERK_STATUS_BADGE[d.status] || CLERK_STATUS_BADGE.DRAFT;
                          const dSlots: any[] = typeof d.slots === 'string' ? JSON.parse(d.slots || '[]') : (d.slots || []);
                          const isActive = activeDraft?.id === d.id;

                          return (
                            <div
                              key={d.id}
                              className={`p-5 rounded-2xl border transition-all space-y-3 ${
                                isActive
                                  ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-[#5B4BFF] shadow-sm'
                                  : 'bg-[#F6F8FC] dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-[#5B4BFF]/50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-extrabold text-sm text-[#1B1E28] dark:text-white">
                                      {d.title}
                                    </h4>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${badge.cls}`}>
                                      {badge.label}
                                    </span>
                                    {isActive && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#5B4BFF] text-white">
                                        Active
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    {d.semester ? `Semester ${d.semester}` : ''} {d.section ? `• Sec ${d.section}` : ''} {d.academic_year ? `• ${d.academic_year}` : ''} • {dSlots.length} lecture{dSlots.length === 1 ? '' : 's'}
                                  </p>
                                </div>
                              </div>

                              {d.notes && (
                                <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                                  &ldquo;{d.notes}&rdquo;
                                </p>
                              )}

                              {d.hod_remarks && (
                                <div className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-xl border border-rose-200 dark:border-rose-800">
                                  HOD Remarks: {d.hod_remarks}
                                </div>
                              )}

                              {/* Action Buttons on Draft Card */}
                              <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-700/80 gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSelectDraft(d)}
                                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-[#5B4BFF] dark:text-indigo-400 border border-slate-200 dark:border-slate-600 text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                                >
                                  <span>👁️</span>
                                  <span>View Weekly Schedule</span>
                                </button>

                                <div className="flex items-center gap-2">
                                  {(!d.status || d.status === 'DRAFT' || d.status === 'HOD_REJECTED') && (
                                    <button
                                      type="button"
                                      onClick={() => submitDraftToHod(d.id)}
                                      disabled={sendingClerkDraftId === d.id || dSlots.length === 0}
                                      className="px-3 py-1.5 rounded-xl bg-[#F36C21] hover:bg-[#e05b10] text-white text-xs font-extrabold transition-all shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-1"
                                      title={dSlots.length === 0 ? 'Add lectures before submitting' : 'Submit to HOD'}
                                    >
                                      <span>📤</span>
                                      <span>{sendingClerkDraftId === d.id ? 'Sending...' : 'Submit to HOD'}</span>
                                    </button>
                                  )}

                                  {d.status !== 'HOD_APPROVED' && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteDraft(d.id)}
                                      className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-300 transition-all cursor-pointer"
                                      title="Delete draft"
                                    >
                                      <span>🗑️</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              Tab 3: Copy TimeTable
              Same layout as SRMS portal: Copy From Date + Copy To sections
          ────────────────────────────────────────────────────────────────── */}
          {activeTab === 'copy' && (() => {
            const isSrmsTenantCopy = Boolean(getActiveTenantSlug()?.toLowerCase().includes('srms'));

            const handleCopyLecture = async () => {
              if (!copyFromDate || !copyToDate || !copyFromDate1new || !copyToDate1new) {
                setCopyResult({ type: 'error', message: 'Please fill all date fields before copying.' });
                return;
              }
              setCopyLoading(true);
              setCopyResult({ type: 'info', message: 'Copying timetable, please wait...' });
              const tenantSlug = getActiveTenantSlug();
              try {
                const res = await fetch('/api/srms/copy-lecture', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-tenant-id': tenantSlug,
                    'x-tenant-slug': tenantSlug,
                  },
                  body: JSON.stringify({
                    colgcd: selectedCollege || '',
                    course: selectedCourse || '',
                    ddl_batch: selectedBatch || '',
                    branch: selectedBranch || '',
                    sem: selectedSemester || '',
                    sec: selectedSection || '',
                    FromDate: copyFromDate,
                    ToDate: copyToDate,
                    FromDate1new: copyFromDate1new,
                    ToDate1new: copyToDate1new,
                    tenant: tenantSlug,
                    tenantSlug,
                  }),
                });
                const json = await res.json().catch(() => ({}));
                if (res.ok && json.success) {
                  const synced = json.synced ?? 0;
                  const copied = json.count ?? 0;
                  const msg = json.message || `Copied ${copied} lecture(s) successfully.`;
                  setCopyResult({ type: synced > 0 ? 'success' : 'info', message: msg });
                  // Navigate to Design tab showing the target week immediately
                  const targetDate = new Date(copyFromDate1new + 'T12:00:00');
                  setCurrentDate(targetDate);
                  fetchTimetableSlots(targetDate);
                  if (synced > 0) {
                    // Short delay so result banner is visible, then switch tab
                    setTimeout(() => setActiveTab('design'), 800);
                  }
                } else {
                  setCopyResult({ type: 'error', message: json.message || 'Copy failed. Please try again.' });
                }
              } catch (err: any) {
                setCopyResult({ type: 'error', message: err.message || 'Network error.' });
              } finally {
                setCopyLoading(false);
              }
            };

            const handleViewCopied = () => {
              const targetDate = new Date(copyFromDate1new + 'T12:00:00');
              setCurrentDate(targetDate);
              fetchTimetableSlots(targetDate);
              setActiveTab('design');
            };



            return (
              <div className="space-y-5 max-w-3xl">

                {/* Result banner */}
                {copyResult && (
                  <div className={`flex items-start gap-3 px-4 py-3 rounded-2xl border text-xs font-semibold ${
                    copyResult.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                      : copyResult.type === 'error'
                      ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700 text-rose-700 dark:text-rose-300'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                  }`}>
                    <span className="text-sm mt-0.5">
                      {copyResult.type === 'success' ? '✅' : copyResult.type === 'error' ? '❌' : 'ℹ️'}
                    </span>
                    <div className="flex-1">
                      <p>{copyResult.message}</p>
                      {copyResult.type === 'success' && (
                        <button
                          type="button"
                          onClick={handleViewCopied}
                          className="mt-2 text-[11px] font-black underline underline-offset-2 text-emerald-700 dark:text-emerald-300 hover:opacity-80 transition-opacity"
                        >
                          → View copied week in Design tab
                        </button>
                      )}
                    </div>
                    <button type="button" onClick={() => setCopyResult(null)} className="text-xs opacity-60 hover:opacity-100">✕</button>
                  </div>
                )}

                {/* ── Section 1: Copy From Date ── */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-md">
                  {/* Header */}
                  <div className="flex items-center gap-2 px-5 py-3.5 bg-[#2D2575] text-white">
                    <span className="text-base">📅</span>
                    <h3 className="font-black text-sm tracking-wide">Copy From Date</h3>
                  </div>

                  <div className="p-5 space-y-4">


                    {/* Row 2: From Date / To Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-black text-[#F36C21] uppercase tracking-wider">
                          From Date
                        </label>
                        <input
                          type="date"
                          value={copyFromDate}
                          onChange={e => {
                            const v = e.target.value;
                            setCopyFromDate(v);
                            // Auto-set ToDate to 6 days after selected date (7-day span for SRMS)
                            if (v) {
                              const d = new Date(v + 'T12:00:00');
                              const sun = new Date(d);
                              sun.setDate(d.getDate() + 6);
                              const fmt = (dd: Date) => `${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,'0')}-${String(dd.getDate()).padStart(2,'0')}`;
                              setCopyToDate(fmt(sun));
                            }
                          }}
                          className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#F36C21]/40 transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-black text-[#F36C21] uppercase tracking-wider">
                          To Date
                        </label>
                        <input
                          type="date"
                          value={copyToDate}
                          onChange={e => setCopyToDate(e.target.value)}
                          className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#F36C21]/40 transition-all"
                        />
                      </div>
                    </div>

                    {/* Note */}
                    <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                      Note: One Week Time Table Will Be Carried Forward. The Day Of The Copy From Date And The From Date Should Be The Same.
                    </p>

                    {/* Quick select buttons */}
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider self-center">Quick:</span>
                      {[-7, 0, 7, 14].map(offset => {
                        const wk = getCopyWeekDefault(offset);
                        const d = new Date(wk.from + 'T12:00:00');
                        const label = offset === 0 ? 'This Week' : offset === -7 ? 'Last Week' : offset === 7 ? 'Next Week' : '+2 Weeks';
                        return (
                          <button
                            key={offset}
                            type="button"
                            onClick={() => { setCopyFromDate(wk.from); setCopyToDate(wk.to); }}
                            className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-300 hover:border-[#F36C21] hover:text-[#F36C21] transition-all"
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ── Section 2: Copy To ── */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-md">
                  {/* Header */}
                  <div className="flex items-center gap-2 px-5 py-3.5 bg-[#2D2575] text-white">
                    <span className="text-base">📋</span>
                    <h3 className="font-black text-sm tracking-wide">Copy To</h3>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Row: From Date / To Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-black text-[#00C48C] uppercase tracking-wider">
                          From Date
                        </label>
                        <input
                          type="date"
                          value={copyFromDate1new}
                          onChange={e => {
                            const v = e.target.value;
                            setCopyFromDate1new(v);
                            // Auto-set ToDate to 6 days after selected date (7-day span for SRMS)
                            if (v) {
                              const d = new Date(v + 'T12:00:00');
                              const sun = new Date(d);
                              sun.setDate(d.getDate() + 6);
                              const fmt = (dd: Date) => `${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,'0')}-${String(dd.getDate()).padStart(2,'0')}`;
                              setCopyToDate1new(fmt(sun));
                            } else {
                              setCopyFromDate1new(v);
                            }
                          }}
                          className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00C48C]/40 transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-black text-[#00C48C] uppercase tracking-wider">
                          To Date
                        </label>
                        <input
                          type="date"
                          value={copyToDate1new}
                          onChange={e => setCopyToDate1new(e.target.value)}
                          className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00C48C]/40 transition-all"
                        />
                      </div>
                    </div>

                    {/* Quick select for target week */}
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider self-center">Quick:</span>
                      {[7, 14, 21].map(offset => {
                        const wk = getCopyWeekDefault(offset);
                        const label = offset === 7 ? 'Next Week' : offset === 14 ? '+2 Weeks' : '+3 Weeks';
                        return (
                          <button
                            key={offset}
                            type="button"
                            onClick={() => { setCopyFromDate1new(wk.from); setCopyToDate1new(wk.to); }}
                            className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-300 hover:border-[#00C48C] hover:text-[#00C48C] transition-all"
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Summary preview */}
                    {copyFromDate && copyToDate && copyFromDate1new && copyToDate1new && (
                      <div className="p-3 rounded-xl bg-[#F6F8FC] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                        <p className="font-black text-slate-800 dark:text-white text-xs">📋 Copy Summary</p>
                        <p>College: <span className="font-bold text-slate-900 dark:text-white">{selectedCollegeObj?.name || `#${selectedCollege}`}</span></p>
                        <p>Course: <span className="font-bold text-slate-900 dark:text-white">{selectedCourseObj?.name || `#${selectedCourse}`}</span> &nbsp;|&nbsp; Batch: <span className="font-bold text-slate-900 dark:text-white">{selectedBatch}</span></p>
                        <p>From: <span className="font-bold text-[#F36C21]">{copyFromDate} → {copyToDate}</span></p>
                        <p>To: <span className="font-bold text-[#00C48C]">{copyFromDate1new} → {copyToDate1new}</span></p>
                        {isSrmsTenantCopy && (
                          <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-semibold">🔒 SRMS Portal will be called. Copied slots will also be synced to database for topic enrichment.</p>
                        )}
                      </div>
                    )}

                    {/* Copy Lecture button */}
                    <button
                      type="button"
                      disabled={copyLoading}
                      onClick={handleCopyLecture}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#7867FF] active:scale-95 text-white text-xs font-black shadow-md shadow-[#5B4BFF]/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {copyLoading ? (
                        <><span className="animate-spin">⏳</span><span>Copying...</span></>
                      ) : (
                        <><span>📋</span><span>Copy Lecture</span></>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            );
          })()}

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
                👨‍🏫 {
                  (hoveredSlotInfo.slot.faculty_name && 
                   hoveredSlotInfo.slot.faculty_name !== 'Faculty Member' && 
                   hoveredSlotInfo.slot.faculty_name !== 'Faculty')
                    ? hoveredSlotInfo.slot.faculty_name
                    : (
                      (Array.isArray(allFaculties) ? allFaculties : []).find(f => f && (
                        String(f.id) === String(hoveredSlotInfo.slot.faculty_id) || 
                        String(f.emp_id) === String(hoveredSlotInfo.slot.faculty_id) || 
                        String(f.emp_id) === String(hoveredSlotInfo.slot.faculty_code)
                      ))?.name || 
                      (hoveredSlotInfo.slot.topic?.match(/\(([^)]+)\)/)?.[1] || 'Faculty Member')
                    )
                }
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
              onClick={(e) => handleDeleteSlot(hoveredSlotInfo.slot.id, e, hoveredSlotInfo.slot)}
              className="flex-1 py-2 px-3 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-black rounded-xl text-center text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>🗑️</span>
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Clerk Modal Dialog for Creating New Timetable Draft */}
      {showClerkDraftForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>➕</span>
                <span>Create New Timetable Draft</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowClerkDraftForm(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-black text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={saveNewClerkDraft} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Draft Title *</label>
                <input
                  value={clerkDraftForm.title}
                  onChange={e => setClerkDraftForm(f => ({ ...f, title: e.target.value }))}
                  placeholder={`e.g. ${selectedCourseObj?.name || 'Academic'} Sem ${selectedSemester} Timetable Draft`}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Academic Year</label>
                  <input
                    value={clerkDraftForm.academicYear}
                    onChange={e => setClerkDraftForm(f => ({ ...f, academicYear: e.target.value }))}
                    placeholder="2026-2027"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Semester</label>
                  <input
                    value={clerkDraftForm.semester || selectedSemester}
                    onChange={e => setClerkDraftForm(f => ({ ...f, semester: e.target.value }))}
                    placeholder="e.g. 3"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5">
                <div className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>📌</span>
                  <span>Scope (Inherited from active cascading filters):</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10.5px]">
                  <div>College: <span className="font-bold text-[#5B4BFF] dark:text-indigo-400">{selectedCollegeObj?.name || `#${selectedCollege}`}</span></div>
                  <div>Course: <span className="font-bold text-[#5B4BFF] dark:text-indigo-400">{selectedCourseObj?.name || `#${selectedCourse}`}</span></div>
                  <div>Branch: <span className="font-bold text-[#5B4BFF] dark:text-indigo-400">{selectedBranchObj?.name || `#${selectedBranch}`}</span></div>
                  <div>Batch: <span className="font-bold text-[#5B4BFF] dark:text-indigo-400">{selectedBatchObj?.name || `#${selectedBatch}`}</span></div>
                  <div>Section: <span className="font-bold text-[#5B4BFF] dark:text-indigo-400">Sec {selectedSection === '1' ? 'A' : selectedSection === '2' ? 'B' : selectedSection === '3' ? 'C' : 'D'}</span></div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Notes for HOD (Optional)</label>
                <textarea
                  value={clerkDraftForm.notes}
                  onChange={e => setClerkDraftForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="e.g. Prepared for semester commencement, all lab slots assigned..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#5B4BFF] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowClerkDraftForm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingClerkDraft || !clerkDraftForm.title}
                  className="px-5 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4a3cf5] text-white font-bold transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {submittingClerkDraft ? 'Creating Draft...' : 'Create Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog for Scheduling / Editing Timetable Session */}
      {isModalOpen && (() => {
        const activeClash = modalError || liveClash?.message || null;
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5">
            <div ref={modalScrollRef} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-5xl xl:max-w-6xl w-full p-6 sm:p-7 space-y-4 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{editingSlot ? '✏️' : '➕'}</span>
                  <span>{editingSlot ? (mode === 'clerk' ? 'Edit Draft Lecture' : 'Edit Scheduled Session') : (mode === 'clerk' ? 'Add Draft Lecture' : 'Schedule Timetable Session')}</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-[#5B4BFF] font-bold border border-indigo-200 dark:border-indigo-800">
                    {selectedCourseObj?.name || 'Academic'} › Sem {selectedSemester} › Sec {selectedSection === '1' ? 'A' : selectedSection === '2' ? 'B' : selectedSection === '3' ? 'C' : 'D'}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-black text-lg p-1"
                >
                  ✕
                </button>
              </div>

              {activeClash && (() => {
                // Parse structured conflict data from API response if available
                const isStructured = activeClash.includes('•') || activeClash.includes('\n');
                const lines = activeClash.split('\n').map((l: string) => l.trim()).filter(Boolean);
                const headerLine = lines[0] || activeClash;
                // Deduplicate bullet lines using Set to never repeat lines in alert
                const bulletLines = Array.from(new Set(
                  lines.filter((l: string) => l.startsWith('•')).map((l: string) => l.replace(/^•\s*/, ''))
                ));
                const footerLine = lines.find((l: string) => !l.startsWith('•') && l !== headerLine);
                return (
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border-2 border-rose-500 shadow-lg text-rose-800 dark:text-rose-200 text-xs space-y-2 animate-in fade-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="flex items-center gap-2 font-black uppercase tracking-wider text-rose-700 dark:text-rose-300 text-[11px]">
                      <span className="text-base">🚫</span>
                      <span>Faculty Scheduling Conflict / Overlap</span>
                    </div>
                    {/* Main message */}
                    <p className="font-bold leading-snug pl-1 text-rose-900 dark:text-rose-100">
                      {isStructured ? headerLine.replace(/^⚠\s*/, '') : activeClash}
                    </p>
                    {/* Unique Engagement bullet list */}
                    {bulletLines.length > 0 && (
                      <ul className="pl-2 space-y-1.5">
                        {bulletLines.map((eng: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5 font-semibold text-rose-800 dark:text-rose-200">
                            <span className="text-rose-500 mt-0.5 shrink-0">📌</span>
                            <span>{eng}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {/* Footer hint */}
                    {footerLine && (
                      <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 pl-1 border-t border-rose-200 dark:border-rose-800 pt-1.5">
                        👉 {footerLine}
                      </p>
                    )}
                  </div>
                );
              })()}

              {loading && (
                <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-300 dark:border-indigo-700 shadow-md text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-2.5 animate-pulse">
                  <div className="w-4 h-4 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>{mode === 'clerk' ? 'Saving draft lecture...' : 'Saving timetable session and synchronizing with Database & SRMS Portal...'}</span>
                </div>
              )}

              <form onSubmit={handleSaveSlot} className="space-y-5 text-xs">
                {/* Responsive 2-Column Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* LEFT COLUMN: Timing, Classroom, Subject, Faculty, Group/Section, Mode */}
                  <div className="lg:col-span-6 space-y-4">
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

                    {/* 1. Camera Classroom Selection (Autocomplete) */}
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>1. Camera Classroom (from SRMS LoadCamera) *</span>
                        {cameraLoading && (
                          <span className="text-[10px] text-indigo-500 font-semibold animate-pulse">
                            Loading cameras...
                          </span>
                        )}
                      </label>
                      <SearchableDropdown
                        options={(camerasList && camerasList.length > 0 ? camerasList : DEFAULT_CAMERAS).map(c => ({
                          value: String(c.camera_id),
                          label: c.classroom,
                          badge: `ID ${c.camera_id}`,
                          sublabel: c.camera_ip && c.camera_ip !== '0' ? c.camera_ip : undefined,
                        }))}
                        value={formData.cameraId && formData.cameraId !== '0' ? formData.cameraId : ((camerasList && camerasList[0]) ? String(camerasList[0].camera_id) : '1')}
                        onChange={(val) => {
                          const activeList = camerasList && camerasList.length > 0 ? camerasList : DEFAULT_CAMERAS;
                          const camObj = activeList.find(c => String(c.camera_id) === val);
                          setFormData(prev => ({
                            ...prev,
                            cameraId: val,
                            room: camObj?.classroom || prev.room,
                          }));
                        }}
                        placeholder="-- Search & Select Camera Classroom --"
                        searchPlaceholder="Type classroom name or camera ID..."
                        required
                      />
                    </div>

                    {/* 2. Subject Selection (Autocomplete) */}
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>2. Subject (from SRMS LoadSubject) *</span>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                          {availableFormSubjects.length} subjects available
                        </span>
                      </label>
                      <SearchableDropdown
                        options={availableFormSubjects.map(s => {
                          const valKey = String(s.id || s.code || s.linkcd || s.sub_cd || '');
                          return {
                            value: valKey,
                            label: s.name || s.sub_name || 'Subject',
                            badge: s.code || s.sub_cd || s.linkcd,
                            sublabel: s.faculty_name || s.EmpName ? `(${s.faculty_name || s.EmpName})` : undefined,
                          };
                        })}
                        value={formData.subjectId}
                        onChange={(val) => handleSubjectChange(val)}
                        placeholder="-- Search & Select Subject --"
                        searchPlaceholder="Search subject by code or name..."
                        required
                      />
                    </div>

                    {/* 3. Faculty Selection & EmpID Display (Autocomplete) */}
                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>3. Faculty Member (Auto-Assigned from Subject) *</span>
                        {formData.facultyEmpId && (
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                            Emp ID: {formData.facultyEmpId}
                          </span>
                        )}
                      </label>
                      <SearchableDropdown
                        options={facultyDropdownOptions}
                        value={formData.facultyEmpId || formData.facultyId}
                        displayValueFallback={formData.facultyName}
                        onChange={(val, opt) => {
                          const foundFac = allFaculties.find((f: any) => String(f.id) === val || String(f.emp_id) === val);
                          setFormData(prev => ({
                            ...prev,
                            facultyId: foundFac?.id || val,
                            facultyEmpId: foundFac?.emp_id || opt?.badge || val,
                            facultyName: opt?.label || foundFac?.name || prev.facultyName,
                          }));
                          if (modalError) setModalError(null);
                        }}
                        placeholder="-- Search & Select Faculty --"
                        searchPlaceholder="Search faculty by name or Emp ID..."
                        error={Boolean(activeClash)}
                        required
                      />
                    </div>

                    {/* 4. Group & Section Row */}
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
                          placeholder="e.g. Room 204, Computer Lab 1"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Description & Cascading Curriculum (Unit -> Topic -> Sub Topic) */}
                  <div className="lg:col-span-6 space-y-4">
                    {/* Subject Description */}
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Subject Description
                      </label>
                      <input
                        type="text"
                        value={formData.subjectDescription}
                        onChange={(e) => setFormData({ ...formData, subjectDescription: e.target.value })}
                        placeholder="e.g. Computer Organization and Architecture UPENDRA KUMAR"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold"
                      />
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                        Sent as description to SRMS addEvent and stored in PostgreSQL.
                      </p>
                    </div>

                    {/* Cascading Curriculum Structure Card */}
                    <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 space-y-3.5">
                      <div className="text-[11px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
                        <span>📚 Subject Code Based Curriculum Structure</span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-200 font-bold">
                          {formData.subjectCode || 'SYLLABUS'}
                        </span>
                      </div>

                      {/* 1. Unit (Searchable Autocomplete with subject-based dynamic units) */}
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                          <span>1. Unit *</span>
                          <span className={`text-[10px] font-semibold ${availableSubjectUnits.length > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {availableSubjectUnits.length > 0 ? `${availableSubjectUnits.length} units from Admin Master` : 'No units in Admin Master'}
                          </span>
                        </label>
                        <SearchableDropdown
                          options={availableSubjectUnits.map(u => ({
                            value: u.name,
                            label: u.name,
                            badge: u.code,
                            sublabel: u.description || undefined,
                          }))}
                          value={formData.unitName}
                          onChange={(val) => {
                            const matchedU = availableSubjectUnits.find(u => u.name === val || u.code === val || u.id === val);
                            setFormData(prev => ({
                              ...prev,
                              unitName: matchedU?.name || val,
                              unitId: matchedU?.id || '',
                              topic: '', // Reset topic when unit changes
                              subTopics: '', // Reset subtopic when unit changes
                            }));
                            setSelectedCompetencies([]);
                          }}
                          placeholder={availableSubjectUnits.length > 0 ? "-- Search or select Unit from Admin Master --" : "-- No units defined in Admin Master (type or select) --"}
                          searchPlaceholder="Search unit by code or title..."
                          allowCustom={true}
                          required
                        />
                      </div>

                      {/* 2. Topic (Cascaded by Unit Selection with Searchable Autocomplete + custom input) */}
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                          <span>2. Topic (Filtered by Unit) *</span>
                          <span className={`text-[10px] font-semibold ${availableSubjectTopics.length > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {availableSubjectTopics.length > 0 ? `${availableSubjectTopics.length} topics from Admin Master` : 'No topics in Admin Master'}
                          </span>
                        </label>
                        <SearchableDropdown
                          options={availableSubjectTopics.map(t => ({
                            value: t.name,
                            label: t.name,
                            badge: t.code,
                          }))}
                          value={formData.topic}
                          onChange={(val) => {
                            setFormData(prev => ({
                              ...prev,
                              topic: val,
                              subTopics: '', // Reset subtopic when topic changes
                            }));
                            setSelectedCompetencies([]);
                          }}
                          placeholder={availableSubjectTopics.length > 0 ? "-- Search or select Topic from Admin Master --" : "-- No topics defined in Admin Master (type below) --"}
                          searchPlaceholder="Search topic for this unit..."
                          allowCustom={true}
                        />
                        <input
                          type="text"
                          value={formData.topic}
                          onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                          placeholder="Or type custom topic directly..."
                          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 font-semibold text-xs mt-1.5"
                        />
                      </div>

                      {/* 3. Sub Topics (Cascaded by Topic Selection with Clickable Badges + Custom Text Input) */}
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                          <span>3. Sub Topics / Learning Objectives</span>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                            Click tags to add / remove
                          </span>
                        </label>
                        {availableSubjectSubTopics.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2 max-h-28 overflow-y-auto p-2 bg-white/70 dark:bg-black/20 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                            {availableSubjectSubTopics.map((st) => {
                              const isSelected = selectedCompetencies.includes(st.name) || selectedCompetencies.includes(st.code);
                              return (
                                <button
                                  key={st.id || st.code}
                                  type="button"
                                  onClick={() => {
                                    let newComps: string[];
                                    if (isSelected) {
                                      newComps = selectedCompetencies.filter(c => c !== st.name && c !== st.code);
                                    } else {
                                      newComps = [...selectedCompetencies, st.name];
                                    }
                                    setSelectedCompetencies(newComps);
                                    setFormData(prev => ({ ...prev, subTopics: newComps.join(', ') }));
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#5B4BFF] text-white border-[#5B4BFF] shadow-sm scale-105'
                                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#5B4BFF]'
                                  }`}
                                >
                                  <span className="opacity-70 font-mono">[{st.code}]</span>
                                  <span>{st.name}</span>
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
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                  {editingSlot ? (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={loading}
                      className="px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/30 hover:bg-rose-500/20 font-bold transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {mode === 'clerk' ? 'Delete Draft Lecture' : 'Delete Session'}
                    </button>
                  ) : <div />}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      disabled={loading}
                      className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || Boolean(liveClash)}
                      className={`px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 ${
                        liveClash
                          ? 'bg-rose-500/20 text-rose-600 border border-rose-500/40 cursor-not-allowed opacity-60'
                          : loading
                          ? 'bg-orange-400 text-white opacity-75 cursor-wait'
                          : mode === 'clerk'
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/25 cursor-pointer active:scale-[0.98]'
                          : 'bg-[#5B4BFF] hover:bg-[#4a3cf5] text-white shadow-indigo-500/20 cursor-pointer active:scale-[0.98]'
                      }`}
                    >
                      {loading && (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      <span>
                        {liveClash
                          ? '⚠️ Faculty Conflict — Cannot Save'
                          : loading
                          ? (mode === 'clerk' ? 'Saving Draft...' : 'Saving...')
                          : editingSlot
                          ? (mode === 'clerk' ? 'Update Draft Lecture' : 'Save Changes')
                          : (mode === 'clerk' ? '💾 Save as Draft Lecture' : 'Save (PostgreSQL & SRMS)')}
                      </span>
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



