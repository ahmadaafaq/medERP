'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  User,
  MapPin,
  Layers,
  FileText,
  CheckCircle2,
  RefreshCw,
  Printer,
  Stethoscope,
  GraduationCap,
} from 'lucide-react';
import MedicalHoverPreview from '@/components/timetable/MedicalHoverPreview';

const DAYS = [
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
];

export default function StudentMedicalSchedulePage() {
  const [scheduleEntries, setScheduleEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantSlug, setTenantSlug] = useState('srms-ims');
  const [hoveredEntry, setHoveredEntry] = useState<any>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

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

  const fetchStudentSchedule = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/medical-timetable/schedule/student?tenant=${tenantSlug}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setScheduleEntries(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentSchedule();
  }, [tenantSlug]);

  return (
    <div className="min-h-screen bg-[#F6F8FC] dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Student Medical Schedule
              </span>
              <span className="text-xs font-semibold text-slate-400">
                Department & Professional Year Timetable
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              Class Academic Schedule
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchStudentSchedule}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
            title="Refresh Schedule"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => window.print()}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
            title="Print Schedule"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Days Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DAYS.map((day) => {
          const dayEntries = scheduleEntries.filter((e) => Number(e.day_of_week) === day.id);
          return (
            <div
              key={day.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col space-y-4"
            >
              {/* Day Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="text-base font-extrabold text-slate-900 dark:text-white">
                  {day.name}
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                  {dayEntries.length} Classes
                </span>
              </div>

              {/* Sessions List */}
              <div className="space-y-3 flex-1">
                {dayEntries.length > 0 ? (
                  dayEntries.map((entry) => {
                    const compList = entry.competency_codes
                      ? String(entry.competency_codes).split(',').map((c) => c.trim()).filter(Boolean)
                      : [];

                    return (
                      <div
                        key={entry.id}
                        onMouseEnter={(e) => {
                          setHoveredEntry(entry);
                          setHoverPosition({ x: e.clientX, y: e.clientY });
                        }}
                        onMouseMove={(e) => setHoverPosition({ x: e.clientX, y: e.clientY })}
                        onMouseLeave={() => setHoveredEntry(null)}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 hover:border-indigo-500 transition-all space-y-2 cursor-default"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            {entry.session_type || 'Lecture'}
                          </span>
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                            {entry.start_time} - {entry.end_time}
                          </span>
                        </div>

                        <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {entry.subject_name}
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="truncate">{entry.room || 'LH-1'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="truncate">{entry.faculty_name ? `Dr. ${entry.faculty_name}` : 'TBD'}</span>
                          </div>
                        </div>

                        {(entry.unit_name || entry.topic_name) && (
                          <div className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200/40 dark:border-slate-700/40 space-y-0.5">
                            {entry.unit_name && (
                              <div className="truncate">
                                <strong className="text-indigo-600 dark:text-indigo-400">Unit:</strong>{' '}
                                {entry.unit_name}
                              </div>
                            )}
                            {entry.topic_name && (
                              <div className="truncate">
                                <strong className="text-teal-600 dark:text-teal-400">Topic:</strong>{' '}
                                {entry.topic_name}
                              </div>
                            )}
                          </div>
                        )}

                        {compList.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {compList.map((code, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold border border-emerald-200 dark:border-emerald-800"
                              >
                                {code}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="h-32 flex items-center justify-center text-xs text-slate-400 font-medium">
                    No classes scheduled for this day.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hoveredEntry && <MedicalHoverPreview entry={hoveredEntry} position={hoverPosition} />}
    </div>
  );
}
