'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Filter,
  Layers,
  Sparkles,
  BookOpen,
  User,
  MapPin,
  ChevronDown,
  RefreshCw,
  Eye,
  CheckCircle2,
  Printer,
  FileSpreadsheet,
  AlertCircle,
  Stethoscope,
  GraduationCap,
} from 'lucide-react';
import MedicalScheduleModal from '@/components/timetable/MedicalScheduleModal';
import MedicalHoverPreview from '@/components/timetable/MedicalHoverPreview';

const DAYS = [
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
];

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00',
];

const START_MINUTES = 8 * 60; // 08:00 = 480 mins
const END_MINUTES = 18 * 60; // 18:00 = 1080 mins
const TOTAL_MINUTES = END_MINUTES - START_MINUTES; // 600 mins

export default function MedicalTimetableAdminPage() {
  const [tenantSlug, setTenantSlug] = useState('srms-ims');

  // Filter Cascade State
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('MBBS');
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [professionalYears, setProfessionalYears] = useState<any[]>([]);
  const [selectedProfYear, setSelectedProfYear] = useState('');

  // Schedule Entries
  const [scheduleEntries, setScheduleEntries] = useState<any[]>([]);
  const [allDepartmentsSchedule, setAllDepartmentsSchedule] = useState<any[]>([]);
  const [isMonitorAllDepartments, setIsMonitorAllDepartments] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModalData, setActiveModalData] = useState<any>(null);

  // Hover Preview State
  const [hoveredEntry, setHoveredEntry] = useState<any>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  // Drag-to-Select State
  const [isDragging, setIsDragging] = useState(false);
  const [dragDay, setDragDay] = useState<number | null>(null);
  const [dragStartMin, setDragStartMin] = useState<number | null>(null);
  const [dragCurrentMin, setDragCurrentMin] = useState<number | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);

  // Read tenant from token/localStorage
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload?.tenant_slug) setTenantSlug(payload.tenant_slug);
        else if (payload?.tenantId) setTenantSlug(payload.tenantId);
      }
    } catch {}
  }, []);

  // 1. Fetch Courses
  useEffect(() => {
    fetch(`/api/v1/medical-timetable/courses?tenant=${tenantSlug}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCourses(data);
          if (!selectedCourse) setSelectedCourse(data[0].code);
        }
      })
      .catch(() => {});
  }, [tenantSlug]);

  // 2. Fetch Departments when Course changes
  useEffect(() => {
    if (!selectedCourse) return;
    fetch(`/api/v1/medical-timetable/departments?tenant=${tenantSlug}&courseId=${selectedCourse}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setDepartments(data);
          setSelectedDepartment(data[0].id);
        }
      })
      .catch(() => {});
  }, [selectedCourse, tenantSlug]);

  // 3. Fetch Professional Years when Course or Department changes
  useEffect(() => {
    if (!selectedCourse) return;
    fetch(`/api/v1/medical-timetable/professional-years?tenant=${tenantSlug}&courseCode=${selectedCourse}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProfessionalYears(data);
          setSelectedProfYear(data[0].id);
        }
      })
      .catch(() => {});
  }, [selectedCourse, tenantSlug]);

  // 4. Fetch Schedule Entries
  const fetchSchedule = useCallback(async () => {
    if (!selectedDepartment || !selectedProfYear) return;
    setLoading(true);
    try {
      if (isMonitorAllDepartments) {
        const res = await fetch(`/api/v1/medical-timetable/all-departments-schedule?tenant=${tenantSlug}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        });
        const data = await res.json();
        if (Array.isArray(data)) setAllDepartmentsSchedule(data);
      } else {
        const res = await fetch(
          `/api/v1/medical-timetable/schedule?tenant=${tenantSlug}&departmentId=${selectedDepartment}&professionalYearId=${selectedProfYear}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
          },
        );
        const data = await res.json();
        if (Array.isArray(data)) setScheduleEntries(data);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedDepartment, selectedProfYear, isMonitorAllDepartments, tenantSlug]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // Convert time "08:30" to minutes
  const timeToMinutes = (t: string): number => {
    if (!t) return 480;
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // Convert minutes to "08:30"
  const minutesToTime = (min: number): string => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Snap to 15-min interval
  const snapTo15 = (min: number): number => {
    return Math.round(min / 15) * 15;
  };

  // Handle Drag Selection
  const handleDayMouseDown = (dayId: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only primary mouse button
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const ratio = Math.max(0, Math.min(1, clickY / rect.height));
    const rawMin = START_MINUTES + ratio * TOTAL_MINUTES;
    const startMin = snapTo15(rawMin);

    setIsDragging(true);
    setDragDay(dayId);
    setDragStartMin(startMin);
    setDragCurrentMin(startMin + 60);
  };

  const handleDayMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || dragStartMin === null) return;
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const currentY = e.clientY - rect.top;
    const ratio = Math.max(0, Math.min(1, currentY / rect.height));
    const rawMin = START_MINUTES + ratio * TOTAL_MINUTES;
    const currentMin = snapTo15(rawMin);

    setDragCurrentMin(currentMin);
  };

  const handleMouseUp = () => {
    if (isDragging && dragDay !== null && dragStartMin !== null && dragCurrentMin !== null) {
      const minStart = Math.min(dragStartMin, dragCurrentMin);
      let minEnd = Math.max(dragStartMin, dragCurrentMin);
      if (minEnd - minStart < 30) minEnd = minStart + 60;

      // Open creation modal with dragged range
      setActiveModalData({
        day_of_week: dragDay,
        start_time: minutesToTime(minStart),
        end_time: minutesToTime(minEnd),
        department_id: selectedDepartment,
        professional_year_id: selectedProfYear,
      });
      setIsModalOpen(true);
    }
    setIsDragging(false);
    setDragDay(null);
    setDragStartMin(null);
    setDragCurrentMin(null);
  };

  // Save entry handler
  const handleSaveEntry = async (payload: any) => {
    const isEdit = Boolean(activeModalData?.id);
    const url = isEdit
      ? `/api/v1/medical-timetable/schedule/${activeModalData.id}?tenant=${tenantSlug}`
      : `/api/v1/medical-timetable/schedule?tenant=${tenantSlug}`;
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to save timetable session.');
    }

    await fetchSchedule();
  };

  // Delete entry handler
  const handleDeleteEntry = async (id: string) => {
    const res = await fetch(`/api/v1/medical-timetable/schedule/${id}?tenant=${tenantSlug}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to delete session.');
    }

    await fetchSchedule();
  };

  // Active items to render
  const displayedEntries = isMonitorAllDepartments ? allDepartmentsSchedule : scheduleEntries;

  return (
    <div
      className="min-h-screen bg-[#F6F8FC] dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6 select-none"
      onMouseUp={handleMouseUp}
    >
      {/* Top Banner & Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Medical Curriculum (NMC / BAMS / MBBS)
              </span>
              <span className="text-xs font-semibold text-slate-400">
                Units • Topics • Competencies
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              Medical Academic Timetable
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setIsMonitorAllDepartments(!isMonitorAllDepartments)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all ${
              isMonitorAllDepartments
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>{isMonitorAllDepartments ? 'Monitoring All Departments' : 'Monitor All Departments'}</span>
          </button>

          <button
            onClick={() => {
              setActiveModalData({
                day_of_week: 1,
                start_time: '09:00',
                end_time: '10:00',
                department_id: selectedDepartment,
                professional_year_id: selectedProfYear,
              });
              setIsModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-black shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Slot</span>
          </button>

          <button
            onClick={() => window.print()}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
            title="Print Timetable"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cascading Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0">
          <Filter className="w-4 h-4 text-indigo-500" />
          <span>Hierarchy:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          {/* Course */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              Course / Program
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {courses.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              Medical Department
            </label>
            <select
              value={selectedDepartment}
              disabled={isMonitorAllDepartments}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Professional Year */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              Professional Year / Phase
            </label>
            <select
              value={selectedProfYear}
              disabled={isMonitorAllDepartments}
              onChange={(e) => setSelectedProfYear(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
            >
              {professionalYears.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={fetchSchedule}
          className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 self-end md:self-center transition-colors"
          title="Refresh Schedule"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Timetable Grid Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Header Row: Days */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-2">
              Time
            </div>
            {DAYS.map((d) => (
              <div key={d.id} className="text-center">
                <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {d.name}
                </div>
                <div className="text-[11px] font-semibold text-indigo-500">
                  {displayedEntries.filter((e) => Number(e.day_of_week) === d.id).length} Sessions
                </div>
              </div>
            ))}
          </div>

          {/* Grid Body */}
          <div ref={gridRef} className="relative mt-2 flex">
            {/* Time labels column */}
            <div className="w-1/7 shrink-0 pr-3 relative h-[600px] border-r border-slate-100 dark:border-slate-800">
              {TIME_SLOTS.map((t, idx) => {
                const topPct = (idx / (TIME_SLOTS.length - 1)) * 100;
                return (
                  <div
                    key={t}
                    className="absolute text-[11px] font-mono font-bold text-slate-400 -translate-y-1/2 right-3"
                    style={{ top: `${topPct}%` }}
                  >
                    {t}
                  </div>
                );
              })}
            </div>

            {/* 6 Day Columns */}
            <div className="grid grid-cols-6 flex-1 h-[600px] relative">
              {/* Horizontal Background Grid Lines */}
              {TIME_SLOTS.map((_, idx) => {
                const topPct = (idx / (TIME_SLOTS.length - 1)) * 100;
                return (
                  <div
                    key={idx}
                    className="absolute left-0 right-0 border-t border-slate-100 dark:border-slate-800/60 pointer-events-none"
                    style={{ top: `${topPct}%` }}
                  />
                );
              })}

              {DAYS.map((day) => {
                const dayEntries = displayedEntries.filter(
                  (e) => Number(e.day_of_week) === day.id,
                );

                // Drag preview inside this day
                const isCurrentDragDay = isDragging && dragDay === day.id;
                let ghostTop = 0;
                let ghostHeight = 0;
                if (isCurrentDragDay && dragStartMin !== null && dragCurrentMin !== null) {
                  const s = Math.min(dragStartMin, dragCurrentMin);
                  const e = Math.max(dragStartMin, dragCurrentMin);
                  ghostTop = ((s - START_MINUTES) / TOTAL_MINUTES) * 100;
                  ghostHeight = (Math.max(30, e - s) / TOTAL_MINUTES) * 100;
                }

                return (
                  <div
                    key={day.id}
                    className="relative border-r last:border-r-0 border-slate-100 dark:border-slate-800/80 h-full hover:bg-indigo-50/20 dark:hover:bg-slate-800/20 transition-colors cursor-crosshair group"
                    onMouseDown={(e) => handleDayMouseDown(day.id, e)}
                    onMouseMove={handleDayMouseMove}
                  >
                    {/* Live Drag Ghost Box */}
                    {isCurrentDragDay && (
                      <div
                        className="absolute left-1 right-1 rounded-2xl bg-indigo-500/20 border-2 border-dashed border-indigo-600 dark:border-indigo-400 z-20 pointer-events-none flex items-center justify-center shadow-lg"
                        style={{
                          top: `${ghostTop}%`,
                          height: `${ghostHeight}%`,
                        }}
                      >
                        <span className="text-[11px] font-extrabold text-indigo-700 dark:text-indigo-300 bg-white/90 dark:bg-slate-900/90 px-2 py-0.5 rounded-full shadow-sm">
                          {minutesToTime(Math.min(dragStartMin!, dragCurrentMin!))} -{' '}
                          {minutesToTime(Math.max(dragStartMin!, dragCurrentMin!))}
                        </span>
                      </div>
                    )}

                    {/* Scheduled Entry Blocks */}
                    {dayEntries.map((entry) => {
                      const sMin = timeToMinutes(entry.start_time);
                      const eMin = timeToMinutes(entry.end_time);
                      const duration = Math.max(30, eMin - sMin);

                      const topPct = ((sMin - START_MINUTES) / TOTAL_MINUTES) * 100;
                      const heightPct = (duration / TOTAL_MINUTES) * 100;

                      let compBadges: string[] = [];
                      if (entry.competency_codes) {
                        compBadges = String(entry.competency_codes)
                          .split(',')
                          .map((c) => c.trim())
                          .filter(Boolean);
                      }

                      return (
                        <div
                          key={entry.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveModalData(entry);
                            setIsModalOpen(true);
                          }}
                          onMouseEnter={(e) => {
                            setHoveredEntry(entry);
                            setHoverPosition({ x: e.clientX, y: e.clientY });
                          }}
                          onMouseMove={(e) => {
                            setHoverPosition({ x: e.clientX, y: e.clientY });
                          }}
                          onMouseLeave={() => setHoveredEntry(null)}
                          className="absolute left-1.5 right-1.5 rounded-2xl p-2.5 z-10 cursor-pointer shadow-md transition-all duration-150 hover:scale-[1.02] hover:shadow-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white border border-indigo-400/40 overflow-hidden flex flex-col justify-between"
                          style={{
                            top: `${topPct}%`,
                            height: `${heightPct}%`,
                          }}
                        >
                          {/* Block Header */}
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-200 truncate">
                                {entry.session_type || 'Lecture'}
                              </span>
                              <span className="text-[10px] font-mono font-bold bg-black/20 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                                {entry.start_time} - {entry.end_time}
                              </span>
                            </div>

                            <div className="text-xs font-black leading-tight mt-0.5 truncate text-white drop-shadow-sm">
                              {entry.subject_name}
                            </div>
                          </div>

                          {/* Block Footer with Faculty & Competencies */}
                          <div className="space-y-1 mt-1">
                            <div className="flex items-center gap-1 text-[11px] text-indigo-100 truncate">
                              <User className="w-3 h-3 shrink-0" />
                              <span className="truncate">
                                {entry.faculty_name ? `Dr. ${entry.faculty_name}` : 'TBD'}
                              </span>
                            </div>

                            {compBadges.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {compBadges.slice(0, 2).map((c, i) => (
                                  <span
                                    key={i}
                                    className="px-1.5 py-0.2 rounded bg-emerald-400/30 text-emerald-100 font-mono text-[9px] font-bold"
                                  >
                                    {c}
                                  </span>
                                ))}
                                {compBadges.length > 2 && (
                                  <span className="text-[9px] font-bold text-indigo-200">
                                    +{compBadges.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Lightweight Hover Preview */}
      {hoveredEntry && <MedicalHoverPreview entry={hoveredEntry} position={hoverPosition} />}

      {/* Schedule Entry Create / Edit Modal */}
      <MedicalScheduleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setActiveModalData(null);
        }}
        onSave={handleSaveEntry}
        onDelete={handleDeleteEntry}
        initialData={activeModalData}
        departments={departments}
        currentDepartmentId={selectedDepartment}
        currentProfessionalYearId={selectedProfYear}
        currentCourseId={selectedCourse}
        tenantSlug={tenantSlug}
      />
    </div>
  );
}
