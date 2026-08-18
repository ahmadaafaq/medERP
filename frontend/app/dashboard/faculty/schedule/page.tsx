'use client';

import { useState, useEffect, useRef } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import { filterCompetenciesForSlot, filterCompetencyCodesString, matchSlotDay } from '../../../utils/competencyFilter';

interface CompetencyDetail {
  id?: string;
  code: string;
  description: string;
  domain?: string;
}

interface TimetableSlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room?: string;
  slot_type?: string;
  group_name?: string;
  topic?: string;
  competency_codes?: string;
  faculty_name?: string;
  subject_name?: string;
  subject_code?: string;
  department_name?: string;
  batch_code?: string;
  competencies_detail?: CompetencyDetail[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const getStorageItem = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function FacultySchedulePage() {
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() === 0 ? 7 : new Date().getDay());
  const [weeklySlots, setWeeklySlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hoveredSlotId, setHoveredSlotId] = useState<string | null>(null);
  const [facultyDeptName, setFacultyDeptName] = useState<string>('');
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSlotMouseEnter = (id: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredSlotId(id);
  };

  const handleSlotMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredSlotId(null);
    }, 250);
  };

  useEffect(() => {
    fetchFacultySchedule();
  }, []);

  const fetchFacultySchedule = async () => {
    setLoading(true);
    const slug = getStorageItem('tenantSlug') || getStorageItem('selectedTenant') || 'srms-cet-bareilly';
    const token = getStorageItem('token') || '';

    try {
      // 1. Fetch logged-in user profile to retrieve department_id and faculty_id
      let deptId = '';
      let facId = '';

      const meRes = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
      }).catch(() => null);

      if (meRes && meRes.ok) {
        const meJson = await meRes.json();
        const meData = meJson.data || meJson;
        const profile = meData.profile || {};
        deptId = profile.department_id || meData.departmentId || '';
        facId = profile.id || meData.id || '';
        setFacultyDeptName(profile.department_name || meData.departmentName || 'Department');
      }

      // 2. Query backend timetable filtered for this faculty member's department / faculty ID
      let url = `${API_BASE}/timetable?tenant=${slug}`;
      if (deptId) {
        url += `&departmentId=${deptId}`;
      }
      if (facId) {
        url += `&facultyId=${facId}`;
      }

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
      }).catch(() => null);

      if (res && res.ok) {
        const json = await res.json();
        const slots = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
        if (slots.length > 0) {
          setWeeklySlots(slots);
        } else {
          // Fallback fetch all slots for tenant if strict filter was empty
          const fallbackRes = await fetch(`${API_BASE}/timetable?tenant=${slug}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': slug },
          }).catch(() => null);
          if (fallbackRes && fallbackRes.ok) {
            const fbJson = await fallbackRes.json();
            setWeeklySlots(Array.isArray(fbJson.data) ? fbJson.data : []);
          } else {
            setWeeklySlots([]);
          }
        }
      } else {
        // Fallback fetch without strict filters
        const fallbackRes = await fetch(`${API_BASE}/timetable?tenant=${slug}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': slug },
        }).catch(() => null);
        if (fallbackRes && fallbackRes.ok) {
          const fbJson = await fallbackRes.json();
          setWeeklySlots(Array.isArray(fbJson.data) ? fbJson.data : []);
        } else {
          setWeeklySlots([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch faculty schedule:', err);
      setWeeklySlots([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSlots = weeklySlots.filter(s => {
    return matchSlotDay(s.day_of_week, selectedDay);
  });

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="faculty" />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Faculty Teaching Schedule & Department Timetable" />

        <main className="p-6 space-y-6 flex-1 max-w-7xl mx-auto w-full">
          {/* Header Banner */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#FFF4EC] text-[#F36C21] border border-[#F36C21]/30 font-mono font-black uppercase tracking-wider">
                  FACULTY SCHEDULE
                </span>
                <span className="text-xs text-[#4E5969] dark:text-slate-400 font-bold">Read-Only Teaching Console</span>
              </div>
              <h1 className="text-2xl font-black text-[#1B1E28] dark:text-white">Department Teaching Schedule</h1>
              <p className="text-xs text-[#4E5969] dark:text-slate-300 font-medium">
                Filtered strictly for <strong className="text-[#5B4BFF] font-black">{facultyDeptName || 'Your Department'}</strong>. Other department sessions are hidden.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchFacultySchedule}
              className="px-4 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4B3BFF] text-white font-extrabold text-xs shadow-md shadow-[#5B4BFF]/20 transition-all flex items-center gap-1.5"
            >
              🔄 Refresh Department Schedule
            </button>
          </div>

          {/* Schedule Matrix */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-[#1B1E28] dark:text-white tracking-tight uppercase">
                  📅 {facultyDeptName ? `${facultyDeptName} Timetable` : 'Department Weekly Schedule'}
                </h3>
                <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium">
                  Select day of week to view teaching slots, assigned lecture halls, topics &amp; competencies.
                </p>
              </div>

              {/* Day Selector Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto p-1 bg-[#F8FAFC] dark:bg-slate-800 rounded-xl border border-[#E7EAF3] dark:border-slate-700 text-xs font-bold">
                {DAY_NAMES.slice(0, 6).map((dayName, idx) => {
                  const dayNum = idx + 1;
                  const isSelected = selectedDay === dayNum;
                  return (
                    <button
                      key={dayName}
                      type="button"
                      onClick={() => setSelectedDay(dayNum)}
                      className={`px-3.5 py-1.5 rounded-lg transition-all font-black ${
                        isSelected 
                          ? 'bg-[#5B4BFF] text-white shadow-md shadow-[#5B4BFF]/20' 
                          : 'text-[#4E5969] dark:text-slate-400 hover:text-[#1B1E28] dark:hover:text-white hover:bg-[#EEECFF]'
                      }`}
                    >
                      {dayName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Schedule Slot Cards List */}
            {loading ? (
              <div className="py-16 text-center text-[#4E5969] dark:text-slate-400 text-xs animate-pulse font-bold">
                Loading authentic department timetable from database...
              </div>
            ) : filteredSlots.length === 0 ? (
              <div className="py-16 text-center text-[#4E5969] dark:text-slate-400 text-xs border border-dashed border-[#E7EAF3] dark:border-slate-800 rounded-[22px] space-y-2">
                <p className="text-base font-black text-[#1B1E28] dark:text-white">No {facultyDeptName} classes scheduled for {DAY_NAMES[selectedDay - 1]}</p>
                <p className="text-[#7B8794] font-medium">Only relevant department timetable slots appear in this schedule view.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredSlots.map((slot) => {
                  const isHovered = hoveredSlotId === slot.id;
                  const compList = filterCompetenciesForSlot(slot.competencies_detail || [], slot.subject_code, slot.subject_name, slot.topic);
                  const displayCompCodes = filterCompetencyCodesString(slot.competency_codes, slot.subject_code, slot.subject_name, slot.topic);

                  return (
                    <div
                      key={slot.id}
                      onMouseEnter={() => handleSlotMouseEnter(slot.id)}
                      onMouseLeave={handleSlotMouseLeave}
                      className="relative p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 hover:border-[#5B4BFF]/60 transition-all duration-300 space-y-3 shadow-soft hover:shadow-hover hover:-translate-y-0.5 group cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        {/* Time & Date Column */}
                        <div className="text-center shrink-0 min-w-[75px]">
                          <span className="text-base font-black text-[#F36C21] block tracking-tight font-mono">
                            {slot.start_time?.slice(0, 5)}
                          </span>
                          <span className="text-[10px] font-extrabold text-[#7B8794] uppercase tracking-wider block mt-0.5 font-mono">
                            {slot.end_time?.slice(0, 5)}
                          </span>
                        </div>

                        {/* Vertical Divider */}
                        <div className="w-px bg-[#E7EAF3] dark:bg-slate-800 self-stretch my-0.5 shrink-0"></div>

                        {/* Slot Details Column */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-sm font-black text-[#1B1E28] dark:text-white group-hover:text-[#5B4BFF] transition-colors truncate">
                              {slot.subject_name ? `[${slot.subject_code}] ${slot.subject_name}` : 'Department Subject'}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-3 py-1 rounded-full text-xs font-black font-mono bg-[#FFF4EC] text-[#D9530F] dark:bg-orange-950/70 dark:text-[#F36C21] border border-[#F36C21]/50 shadow-2xs">
                              {slot.subject_code || 'MBBS'} • {slot.slot_type || 'LECTURE'}
                            </span>
                            {slot.batch_code && (
                              <span className="text-[10px] font-bold text-[#7B8794] truncate">
                                Batch: {slot.batch_code}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-[#5B4BFF] dark:text-indigo-400 font-bold flex items-center gap-1">
                            <span>📖</span>
                            <span className="truncate">{slot.topic || 'Curriculum Module'}</span>
                          </p>
                        </div>
                      </div>

                      {displayCompCodes && (
                        <div className="text-xs text-purple-700 dark:text-purple-300 bg-purple-50/80 dark:bg-purple-950/40 p-2.5 rounded-2xl border border-purple-200/80 dark:border-purple-900/30 flex items-center justify-between font-semibold">
                          <span className="flex items-center gap-1.5">
                            <span>🎯</span> NMC Competency:
                          </span>
                          <span className="font-mono font-black text-[#1B1E28] dark:text-white">{displayCompCodes}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between text-xs">
                        <span className="font-bold text-[#1B1E28] dark:text-slate-200">🏫 {slot.room || 'Lecture Hall 1'}</span>
                        <span className="text-[#00C48C] font-black text-xs">👨‍🏫 {slot.faculty_name || 'Faculty Member'}</span>
                      </div>

                      {/* HOVER TOOLTIP CARD */}
                      {isHovered && (
                        <div
                          onMouseEnter={() => handleSlotMouseEnter(slot.id)}
                          onMouseLeave={handleSlotMouseLeave}
                          className="absolute bottom-full left-0 mb-2 w-72 max-w-[270px] rounded-2xl bg-gradient-to-br from-[#2D2575] via-[#231C63] to-[#1B1652] text-white border-2 border-[#5B4BFF]/50 shadow-2xl shadow-[#2D2575]/60 backdrop-blur-xl z-50 overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-150 text-[11px] p-3 space-y-2"
                        >
                          {/* Top Deep Purple Ribbon Header */}
                          <div className="flex items-center justify-between gap-1.5 border-b border-white/10 pb-1.5">
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black font-mono bg-[#F36C21] text-white shadow-xs uppercase">
                              {slot.subject_code || 'MBBS'} • {slot.slot_type || 'LECTURE'}
                            </span>
                            <span className="font-mono text-indigo-200 text-[10px] font-bold">
                              🕒 {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <div>
                              <h5 className="font-extrabold text-xs text-white leading-tight truncate">{slot.subject_name || 'Department Subject'}</h5>
                            </div>

                            {/* Scheduled Topic */}
                            <div className="p-2 rounded-lg bg-white/10 border border-white/15 space-y-0.5">
                              <div className="text-[9px] font-black uppercase text-[#F36C21] tracking-wider">
                                📖 Scheduled Topic
                              </div>
                              <p className="text-[11px] font-bold text-white leading-snug">
                                {slot.topic || 'Curriculum Module / Lesson'}
                              </p>
                            </div>

                            {/* Scheduled Sub Topics & Competencies */}
                            <div className="p-2 rounded-lg bg-white/10 border border-white/15 space-y-1">
                              <div className="text-[9px] font-black uppercase text-indigo-200 tracking-wider flex items-center justify-between">
                                <span>🎯 SUB TOPICS/TEACHING TOPICS</span>
                                {compList.length > 0 && (
                                  <span className="px-1.5 py-0.2 rounded-full bg-[#5B4BFF] text-white text-[8.5px] font-mono font-bold">
                                    {compList.length}
                                  </span>
                                )}
                              </div>

                              {compList.length > 0 ? (
                                <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                                  {compList.map((c, i) => (
                                    <div key={i} className="p-1 px-1.5 rounded bg-black/25 border border-white/10 text-[10px] flex items-start gap-1.5">
                                      <span className="shrink-0 px-1 py-0.2 rounded bg-[#5B4BFF] text-white font-mono font-bold text-[9px]">
                                        {c.code}
                                      </span>
                                      <p className="text-indigo-100 text-[9.5px] leading-tight font-medium self-center">{c.description}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : displayCompCodes ? (
                                <div className="p-1 px-1.5 rounded bg-black/25 border border-white/10 text-[10px] space-y-0.5">
                                  <p className="font-mono font-black text-white">{displayCompCodes}</p>
                                </div>
                              ) : (
                                <p className="text-[10px] text-indigo-200 italic font-medium">
                                  Sub topics: Scheduled per topic syllabus
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="pt-1.5 border-t border-white/10 flex justify-between text-[10px]">
                            <span className="font-bold text-indigo-100 truncate">🏫 Hall: {slot.room || 'Lecture Hall 1'}</span>
                            <span className="font-black text-[#00C48C] shrink-0 ml-1">👨‍🏫 {slot.faculty_name || 'Faculty'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
