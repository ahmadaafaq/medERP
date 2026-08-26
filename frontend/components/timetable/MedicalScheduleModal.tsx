'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Clock,
  BookOpen,
  User,
  MapPin,
  Layers,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Save,
  Search,
  Plus,
  Tag,
} from 'lucide-react';

interface MedicalScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  initialData?: any;
  departments: any[];
  currentDepartmentId: string;
  currentProfessionalYearId: string;
  currentCourseId: string;
  tenantSlug: string;
}

export default function MedicalScheduleModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  departments,
  currentDepartmentId,
  currentProfessionalYearId,
  currentCourseId,
  tenantSlug,
}: MedicalScheduleModalProps) {
  // Form State
  const [departmentId, setDepartmentId] = useState(currentDepartmentId);
  const [subjectId, setSubjectId] = useState(initialData?.subject_id || '');
  const [linkedSubjectId, setLinkedSubjectId] = useState(initialData?.linked_subject_id || '');
  const [facultyId, setFacultyId] = useState(initialData?.faculty_id || '');
  const [facultyName, setFacultyName] = useState(initialData?.faculty_name || '');
  const [facultySearch, setFacultySearch] = useState(initialData?.faculty_name || '');
  const [isFacultyDropdownOpen, setIsFacultyDropdownOpen] = useState(false);
  const [unitId, setUnitId] = useState(initialData?.unit_id || '');
  const [topicId, setTopicId] = useState(initialData?.topic_id || '');
  const [selectedCompetencies, setSelectedCompetencies] = useState<string[]>([]);
  const [dayOfWeek, setDayOfWeek] = useState<number>(initialData?.day_of_week || 1);
  const [startTime, setStartTime] = useState<string>(initialData?.start_time || '08:30');
  const [endTime, setEndTime] = useState<string>(initialData?.end_time || '09:30');
  const [sessionType, setSessionType] = useState<string>(initialData?.session_type || 'Lecture');
  const [room, setRoom] = useState<string>(initialData?.room || 'LH-1');
  const [notes, setNotes] = useState<string>(initialData?.notes || '');

  // Cascading lists
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [unitsList, setUnitsList] = useState<any[]>([]);
  const [topicsList, setTopicsList] = useState<any[]>([]);
  const [competenciesList, setCompetenciesList] = useState<any[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);

  // Status
  const [loading, setLoading] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const scrollBodyRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (conflictError && scrollBodyRef.current) {
      scrollBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [conflictError]);

  // Sync initialData when modal opens
  useEffect(() => {
    if (isOpen) {
      setDepartmentId(initialData?.department_id || currentDepartmentId);
      setSubjectId(initialData?.subject_id || '');
      setLinkedSubjectId(initialData?.linked_subject_id || '');
      setFacultyId(initialData?.faculty_id || '');
      setFacultyName(initialData?.faculty_name || '');
      setFacultySearch(initialData?.faculty_name || '');
      setUnitId(initialData?.unit_id || '');
      setTopicId(initialData?.topic_id || '');
      setDayOfWeek(initialData?.day_of_week || 1);
      setStartTime(initialData?.start_time || '08:30');
      setEndTime(initialData?.end_time || '09:30');
      setSessionType(initialData?.session_type || 'Lecture');
      setRoom(initialData?.room || 'LH-1');
      setNotes(initialData?.notes || '');
      setConflictError(null);
      setShowDeleteConfirm(false);

      if (initialData?.competency_codes) {
        setSelectedCompetencies(
          String(initialData.competency_codes)
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean),
        );
      } else if (Array.isArray(initialData?.competency_ids)) {
        setSelectedCompetencies(initialData.competency_ids);
      } else {
        setSelectedCompetencies([]);
      }
    }
  }, [isOpen, initialData, currentDepartmentId]);

  // 1. Fetch Subjects for Department
  useEffect(() => {
    if (!departmentId || !isOpen) return;
    fetch(`/api/v1/medical-timetable/subjects?tenant=${tenantSlug}&departmentId=${departmentId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSubjectsList(data);
      })
      .catch(() => {});
  }, [departmentId, tenantSlug, isOpen]);

  // 2. Fetch Units when Subject changes
  useEffect(() => {
    if (!subjectId || !isOpen) {
      setUnitsList([]);
      return;
    }
    fetch(`/api/v1/medical-timetable/units?tenant=${tenantSlug}&subjectId=${subjectId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUnitsList(data);
      })
      .catch(() => {});
  }, [subjectId, tenantSlug, isOpen]);

  // 3. Fetch Topics when Unit or Subject changes
  useEffect(() => {
    if (!isOpen) return;
    const url = unitId
      ? `/api/v1/medical-timetable/topics?tenant=${tenantSlug}&unitId=${unitId}`
      : subjectId
      ? `/api/v1/medical-timetable/topics?tenant=${tenantSlug}&subjectId=${subjectId}`
      : null;

    if (!url) {
      setTopicsList([]);
      return;
    }

    fetch(url, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTopicsList(data);
      })
      .catch(() => {});
  }, [unitId, subjectId, tenantSlug, isOpen]);

  // 4. Fetch Competencies when Topic or Subject changes
  useEffect(() => {
    if (!isOpen) return;
    const url = topicId
      ? `/api/v1/medical-timetable/competencies?tenant=${tenantSlug}&topicId=${topicId}`
      : subjectId
      ? `/api/v1/medical-timetable/competencies?tenant=${tenantSlug}&subjectId=${subjectId}`
      : null;

    if (!url) {
      setCompetenciesList([]);
      return;
    }

    fetch(url, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCompetenciesList(data);
      })
      .catch(() => {});
  }, [topicId, subjectId, tenantSlug, isOpen]);

  // 5. Fetch Faculty list for Department
  useEffect(() => {
    if (!departmentId || !isOpen) return;
    fetch(`/api/v1/medical-timetable/faculty?tenant=${tenantSlug}&departmentId=${departmentId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setFacultyList(data);
      })
      .catch(() => {});
  }, [departmentId, tenantSlug, isOpen]);

  // Helper: Live duration calculation
  const durationMinutes = useMemo(() => {
    if (!startTime || !endTime) return 60;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    return diff > 0 ? diff : 60;
  }, [startTime, endTime]);

  const handleDurationChange = (newMinutes: number) => {
    if (!startTime || newMinutes <= 0) return;
    const [sh, sm] = startTime.split(':').map(Number);
    const endTotal = sh * 60 + sm + newMinutes;
    const eh = Math.floor(endTotal / 60) % 24;
    const em = endTotal % 60;
    setEndTime(`${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`);
  };

  // Toggle Competency selection
  const toggleCompetency = (code: string) => {
    if (selectedCompetencies.includes(code)) {
      setSelectedCompetencies(selectedCompetencies.filter((c) => c !== code));
    } else {
      setSelectedCompetencies([...selectedCompetencies, code]);
    }
  };

  // Filtered faculty for autocomplete
  const filteredFaculty = useMemo(() => {
    if (!facultySearch.trim()) return facultyList;
    const q = facultySearch.toLowerCase();
    return facultyList.filter(
      (f) =>
        f.name?.toLowerCase().includes(q) ||
        f.emp_id?.toLowerCase().includes(q) ||
        f.email?.toLowerCase().includes(q),
    );
  }, [facultyList, facultySearch]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) {
      setConflictError('Please select a Subject.');
      return;
    }

    setLoading(true);
    setConflictError(null);

    const payload = {
      courseId: currentCourseId || 'MBBS',
      departmentId,
      professionalYearId: currentProfessionalYearId,
      subjectId,
      linkedSubjectId: linkedSubjectId || null,
      facultyId: facultyId || null,
      facultyName: facultyName || null,
      unitId: unitId || null,
      unitName: unitsList.find((u) => u.id === unitId)?.name || null,
      topicId: topicId || null,
      topicName: topicsList.find((t) => t.id === topicId)?.name || null,
      competencyCodes: selectedCompetencies.join(', '),
      competencyIds: selectedCompetencies,
      dayOfWeek: Number(dayOfWeek),
      startTime,
      endTime,
      sessionType,
      room,
      notes,
    };

    try {
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setConflictError(err.message || 'Failed to save timetable entry.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isEdit = Boolean(initialData?.id);
  const dayNames = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-transparent dark:from-slate-800/50 dark:via-slate-800/20 dark:to-transparent">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                Medical Curriculum (NMC)
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {isEdit ? 'Edit Scheduled Session' : 'Schedule New Medical Session'}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              {isEdit ? 'Update Medical Timetable Slot' : 'Create Timetable Entry'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form ref={scrollBodyRef} onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Conflict Alert Banner */}
          {conflictError && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-3 animate-in shake">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-sm font-medium text-rose-800 dark:text-rose-200">
                <span className="font-bold">Faculty Scheduling Conflict:</span> {conflictError}
              </div>
            </div>
          )}

          {/* Timing & Day Grid */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Schedule Timing & Day</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Day of Week
                </label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {dayNames.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Quick Duration Stepper */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/40">
              <span className="text-slate-500 dark:text-slate-400">
                Duration: <strong className="text-indigo-600 dark:text-indigo-400">{durationMinutes} mins</strong>
              </span>
              <div className="flex items-center gap-1">
                {[45, 60, 90, 120].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleDurationChange(mins)}
                    className={`px-2 py-0.5 rounded-lg font-bold text-[11px] transition-colors ${
                      durationMinutes === mins
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Department & Subject Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Department
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Subject <span className="text-rose-500">*</span>
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Select Medical Subject...</option>
                {subjectsList.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Linked Subject & Session Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Linked Subject <span className="text-xs font-normal text-slate-400">(Optional for Combined Classes)</span>
              </label>
              <select
                value={linkedSubjectId}
                onChange={(e) => setLinkedSubjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">None (Single Subject)</option>
                {subjectsList
                  .filter((s) => s.id !== subjectId)
                  .map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Session Type & Room
              </label>
              <div className="flex gap-2">
                <select
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value)}
                  className="w-2/3 px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Lecture">Lecture (Theory)</option>
                  <option value="Practical">Practical / Lab</option>
                  <option value="SGD">Small Group Discussion (SGD)</option>
                  <option value="DOAP">DOAP Session</option>
                  <option value="Seminar">Integrated Seminar</option>
                  <option value="Clinical Posting">Clinical Posting</option>
                  <option value="Tutorial">Tutorial / Case Study</option>
                </select>
                <input
                  type="text"
                  placeholder="Room (LH-1)"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-1/3 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Faculty Autocomplete Search */}
          <div className="relative">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
              <span>Assigned Faculty (Optional)</span>
              {facultyId && (
                <button
                  type="button"
                  onClick={() => {
                    setFacultyId('');
                    setFacultyName('');
                    setFacultySearch('');
                  }}
                  className="text-xs text-rose-500 hover:underline font-semibold"
                >
                  Clear Faculty
                </button>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search faculty by name or Emp ID..."
                value={facultySearch}
                onFocus={() => setIsFacultyDropdownOpen(true)}
                onChange={(e) => {
                  setFacultySearch(e.target.value);
                  setIsFacultyDropdownOpen(true);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>

            {/* Dropdown list */}
            {isFacultyDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-30 max-h-48 overflow-y-auto p-1.5 space-y-1">
                {filteredFaculty.length > 0 ? (
                  filteredFaculty.map((fac) => (
                    <div
                      key={fac.id}
                      onClick={() => {
                        setFacultyId(fac.id);
                        setFacultyName(fac.name);
                        setFacultySearch(fac.name);
                        setIsFacultyDropdownOpen(false);
                      }}
                      className="px-3 py-2 rounded-xl text-xs hover:bg-indigo-50 dark:hover:bg-slate-700/60 cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-800 dark:text-white">
                          Dr. {fac.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Emp ID: {fac.emp_id || 'N/A'} • {fac.designation || 'Faculty'}
                        </div>
                      </div>
                      {facultyId === fac.id && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-xs text-slate-400 text-center">
                    No faculty found matching search.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Medical Hierarchy: Unit & Topic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/40">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>Unit</span>
              </label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Select Unit...</option>
                {unitsList.map((u) => (
                  <option key={u.id} value={u.id}>
                    Unit {u.unit_number}: {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-teal-500" />
                <span>Topic</span>
              </label>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Select Topic...</option>
                {topicsList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* NMC Competencies Multi-Select Tag Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-emerald-500" />
                <span>NMC Competencies (Sub-topics)</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                {selectedCompetencies.length} selected
              </span>
            </label>

            <div className="min-h-[70px] p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap gap-2">
              {competenciesList.length > 0 ? (
                competenciesList.map((comp) => {
                  const isSelected = selectedCompetencies.includes(comp.code);
                  return (
                    <button
                      key={comp.id || comp.code}
                      type="button"
                      onClick={() => toggleCompetency(comp.code)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500'
                      }`}
                      title={comp.description}
                    >
                      <span className="font-mono">{comp.code}</span>
                      <span className="text-[11px] font-normal opacity-90 max-w-[120px] truncate">
                        {comp.description}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="text-xs text-slate-400 p-1">
                  {subjectId
                    ? 'No explicit competencies loaded for this selection. You can still save the timetable entry.'
                    : 'Select a Subject/Topic above to view NMC competencies.'}
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Bottom Conflict Alert if error */}
        {conflictError && (
          <div className="px-6 py-2.5 bg-rose-50 dark:bg-rose-950/80 border-t border-rose-200 dark:border-rose-800 flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-200 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="truncate">Conflict: {conflictError}</span>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div>
            {isEdit && onDelete && (
              <>
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-rose-600 font-bold">Delete this session?</span>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={async () => {
                        setLoading(true);
                        try {
                          await onDelete(initialData.id);
                          onClose();
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
                    >
                      Yes, Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-2 py-1 text-xs text-slate-500 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3.5 py-2 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={loading || !subjectId}
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-extrabold shadow-lg shadow-indigo-500/25 flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isEdit ? 'Save Changes' : 'Create Session'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
