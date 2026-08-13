'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import { filterCompetenciesForSlot, filterCompetencyCodesString, matchSlotDay } from '../../../utils/competencyFilter';

interface CompetencyDetail {
  id?: string;
  code: string;
  description: string;
  domain?: string;
  level?: string;
  is_core?: boolean;
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

const API_BASE = 'http://localhost:3001/api/v1';

const getStorageItem = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function StudentTimetablePage() {
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() === 0 ? 7 : new Date().getDay());
  const [currentLecture, setCurrentLecture] = useState<TimetableSlot | null>(null);
  const [weeklySlots, setWeeklySlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hoveredSlotId, setHoveredSlotId] = useState<string | null>(null);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    setLoading(true);
    const slug = getStorageItem('tenantSlug') || 'srms-ims';
    try {
      const token = getStorageItem('token') || '';
      const res = await fetch(`${API_BASE}/timetable/student-schedule?tenant=${slug}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
      });

      if (res.ok) {
        const json = await res.json();
        if (json && json.data) {
          const slots: TimetableSlot[] = Array.isArray(json.data.weeklySlots) 
            ? json.data.weeklySlots 
            : Array.isArray(json.data.todaysSlots) 
            ? json.data.todaysSlots 
            : Array.isArray(json.data) 
            ? json.data 
            : [];
          setWeeklySlots(slots);
          setCurrentLecture(json.data.currentLecture || (slots.length > 0 ? slots[0] : null));
          if (json.data.currentDayOfWeek) {
            setSelectedDay(json.data.currentDayOfWeek);
          }
        } else {
          setWeeklySlots([]);
          setCurrentLecture(null);
        }
      } else {
        setWeeklySlots([]);
        setCurrentLecture(null);
      }
    } catch {
      setWeeklySlots([]);
      setCurrentLecture(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredSlots = weeklySlots.filter(s => matchSlotDay(s.day_of_week, selectedDay));

  const getSubjectBadgeColor = (typeStr?: string, codeStr?: string) => {
    if (codeStr?.includes('PHY') || codeStr === 'PY') return 'border-[#5B4BFF]/30 bg-[#5B4BFF]/10 text-[#5B4BFF] dark:text-indigo-400';
    if (codeStr?.includes('ANA') || codeStr === 'AN') return 'border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400';
    if (codeStr?.includes('BCH') || codeStr === 'BC') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    if (codeStr?.includes('PATH')) return 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400';
    if (codeStr?.includes('SURG')) return 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400';
    if (typeStr === 'PRACTICAL') return 'border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400';
    if (typeStr === 'CLINICAL') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    return 'border-[#5B4BFF]/30 bg-[#5B4BFF]/10 text-[#5B4BFF] dark:text-indigo-400';
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-[#0F172A] text-[#4E5969] dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar role="student" />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Student Academic Schedule & Timetable" />

        <main className="p-6 space-y-6 flex-1 max-w-7xl mx-auto w-full">
          {/* Top Banner / Current Lecture */}
          <div className="p-6 rounded-[22px] bg-gradient-to-r from-[#2D2575] via-[#3E3498] to-[#2D2575] text-white shadow-soft space-y-4 relative overflow-hidden force-text-white" data-dark-banner="true">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#00C48C] text-white font-extrabold text-[10px] tracking-wider uppercase flex items-center gap-1.5 shadow">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                  Active / Next Scheduled Session
                </span>
                <span className="text-xs text-white/90 font-mono">
                  Today: {DAY_NAMES[(new Date().getDay() === 0 ? 7 : new Date().getDay()) - 1]}
                </span>
              </div>
              <button 
                type="button"
                onClick={fetchSchedule}
                className="text-xs text-white bg-white/15 hover:bg-white/25 border border-white/20 px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
              >
                🔄 Refresh Schedule
              </button>
            </div>

            {currentLecture ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-extrabold uppercase bg-white/20 text-white border border-white/30">
                      {currentLecture.subject_code || 'MBBS'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-[#F36C21] text-white shadow-sm">
                      {currentLecture.slot_type || 'LECTURE'}
                    </span>
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tight !text-white drop-shadow-sm">
                    {currentLecture.subject_name || 'Academic Class'}
                  </h2>
                  <p className="text-sm font-semibold text-white/95 !text-white/95">
                    📖 Syllabus Topic: <span className="text-[#F36C21] font-extrabold bg-black/20 px-2 py-0.5 rounded-md border border-[#F36C21]/40">{currentLecture.topic || 'Curriculum Module'}</span>
                  </p>
                  {currentLecture.competency_codes && (
                    <p className="text-xs text-white/90 !text-white/90">
                      🎯 NMC Competency: <span className="font-mono text-white font-black bg-white/10 px-2 py-0.5 rounded border border-white/20">{currentLecture.competency_codes}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2.5 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/25 text-xs text-white force-text-white shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 font-medium">⏰ Time Slot:</span>
                    <strong className="font-mono text-white text-sm font-black">
                      {currentLecture.start_time?.slice(0, 5)} - {currentLecture.end_time?.slice(0, 5)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 font-medium">🏫 Location / Room:</span>
                    <strong className="text-white font-bold">{currentLecture.room || 'Lecture Hall 1'}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 font-medium">👨‍🏫 Faculty:</span>
                    <strong className="text-[#00C48C] font-black text-sm drop-shadow">{currentLecture.faculty_name || 'Department Faculty'}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-white/80 text-xs">
                No active lectures scheduled for right now. Check the weekly matrix below.
              </div>
            )}
          </div>

          {/* Weekly Schedule Grid */}
          <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 space-y-6 shadow-soft">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-[#1B1E28] dark:text-white tracking-tight uppercase">
                  📅 Student Weekly Academic Schedule
                </h3>
                <p className="text-xs text-[#4E5969] dark:text-slate-400">
                  Select day of week to view all scheduled subject classes across Anatomy, Physiology, Biochemistry & Clinicals.
                </p>
              </div>

              {/* Day Selector Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto p-1 bg-[#F6F8FC] dark:bg-slate-950 rounded-xl border border-[#E7EAF3] dark:border-slate-800 text-xs font-semibold">
                {DAY_NAMES.slice(0, 6).map((dayName, idx) => {
                  const dayNum = idx + 1;
                  const isSelected = selectedDay === dayNum;
                  return (
                    <button
                      key={dayName}
                      type="button"
                      onClick={() => setSelectedDay(dayNum)}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-[#5B4BFF] text-white shadow-md font-bold' 
                          : 'text-[#4E5969] dark:text-slate-400 hover:text-[#1B1E28] hover:bg-white dark:hover:bg-slate-800'
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
              <div className="py-16 text-center text-slate-400 text-xs animate-pulse">
                Loading authentic timetable schedule from database...
              </div>
            ) : filteredSlots.length === 0 ? (
              <div className="py-16 text-center text-[#4E5969] dark:text-slate-400 text-xs border border-dashed border-[#E7EAF3] dark:border-slate-800 rounded-2xl space-y-2">
                <p className="text-base font-semibold">📅 No classes scheduled for {DAY_NAMES[selectedDay - 1]}</p>
                <p className="text-[#7B8794]">Authentic timetable slots scheduled by Faculty, Administration, or Clerks will appear here automatically.</p>
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
                      onMouseEnter={() => setHoveredSlotId(slot.id)}
                      onMouseLeave={() => setHoveredSlotId(null)}
                      className="relative p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 hover:border-[#5B4BFF]/60 transition-all space-y-3 shadow-soft group cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-[#F6F8FC] dark:bg-slate-800 text-[#5B4BFF] dark:text-indigo-300 border border-[#E7EAF3] dark:border-slate-700">
                          {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-black font-mono bg-[#FFF4EC] text-[#D9530F] dark:bg-orange-950/70 dark:text-[#F36C21] border border-[#F36C21]/50 shadow-2xs">
                          {slot.subject_code || 'MBBS'} • {slot.slot_type || 'LECTURE'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-black text-[#5B4BFF] dark:text-indigo-300 uppercase">
                            {slot.subject_code || 'MBBS'}
                          </span>
                          {slot.group_name && (
                            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/20">
                              {slot.group_name}
                            </span>
                          )}
                        </div>
                        <h4 className="font-black text-lg text-[#1B1E28] dark:text-white group-hover:text-[#5B4BFF] transition-colors tracking-tight">
                          {slot.subject_name || 'Medical Subject'}
                        </h4>
                        <p className="text-xs text-[#5B4BFF] dark:text-indigo-400 font-semibold flex items-center gap-1.5 pt-0.5">
                          <span>📖</span>
                          <span>{slot.topic || 'Curriculum Module'}</span>
                        </p>
                      </div>

                      {displayCompCodes && (
                        <div className="text-xs text-purple-700 dark:text-purple-300 bg-purple-50/80 dark:bg-purple-950/40 p-2.5 rounded-2xl border border-purple-200/80 dark:border-purple-900/30 flex items-center justify-between font-semibold">
                          <span className="flex items-center gap-1.5">
                            <span>🎯</span> NMC Competency:
                          </span>
                          <span className="font-mono font-black text-[#1B1E28] dark:text-white">{displayCompCodes}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between text-xs text-[#4E5969] dark:text-slate-400">
                        <span className="font-bold text-[#1B1E28] dark:text-slate-200">🏫 {slot.room || 'Lecture Hall 1'}</span>
                        <span className="text-[#00C48C] font-black text-xs">👨‍🏫 {slot.faculty_name || 'Faculty Member'}</span>
                      </div>

                      {/* ────────────────────────────────────────────────────────── */}
                      {/* DYNAMIC COMPETENCY & TOPIC HOVER TOOLTIP CARD */}
                      {/* ────────────────────────────────────────────────────────── */}
                      {isHovered && (
                        <div
                          onMouseEnter={() => setHoveredSlotId(slot.id)}
                          onMouseLeave={() => setHoveredSlotId(null)}
                          className="absolute bottom-full left-0 mb-3 w-80 sm:w-96 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-2xl backdrop-blur-xl z-50 text-[#1B1E28] dark:text-slate-100 overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-150 before:absolute before:-bottom-4 before:left-0 before:right-0 before:h-4"
                        >
                          {/* Top Deep Purple Ribbon Header */}
                          <div className="p-3.5 bg-gradient-to-r from-[#2D2575] to-[#3E3498] text-white flex items-center justify-between text-xs font-black force-text-white border-b border-white/10">
                            <span className="px-3 py-1 rounded-full text-xs font-black font-mono bg-[#FFF4EC] text-[#D9530F] dark:bg-orange-950/80 dark:text-[#F36C21] border border-[#F36C21]/50 shadow-2xs">
                              {slot.subject_code || 'MBBS'} • {slot.slot_type || 'LECTURE'}
                            </span>
                            <span className="font-mono text-white text-xs font-bold">
                              🕒 {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                            </span>
                          </div>

                          <div className="p-4 space-y-3">
                            <div>
                              <h5 className="font-black text-sm text-[#1B1E28] dark:text-white">{slot.subject_name}</h5>
                              <p className="text-xs text-[#5B4BFF] dark:text-indigo-400 font-bold mt-1 flex items-center gap-1.5">
                                <span>📖 Topic:</span>
                                <span>{slot.topic || 'Curriculum Session'}</span>
                              </p>
                            </div>

                            {compList.length > 0 ? (
                              <div className="space-y-2 pt-1">
                                <p className="text-[10px] font-black uppercase tracking-wider text-[#F36C21] flex items-center gap-1.5">
                                  <span>🎯 {slot.subject_code || ''} Topic Competencies</span>
                                  <span className="px-1.5 py-0.2 rounded-full bg-purple-50 text-purple-700 text-[9px] font-mono font-bold">
                                    {compList.length}
                                  </span>
                                </p>
                                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                  {compList.map((c, i) => (
                                    <div key={i} className="p-2.5 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800/80 border border-[#E7EAF3] dark:border-slate-700 text-xs flex items-start gap-2">
                                      <span className="shrink-0 px-2 py-0.5 rounded-md bg-[#5B4BFF]/10 text-[#5B4BFF] dark:text-purple-300 font-mono font-black text-[10px] border border-[#5B4BFF]/20">
                                        {c.code}
                                      </span>
                                      <p className="text-[#4E5969] dark:text-slate-300 text-[11px] leading-snug font-medium">{c.description}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : displayCompCodes ? (
                              <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/30 text-xs space-y-0.5">
                                <p className="text-[10px] font-black uppercase text-[#F36C21]">🎯 {slot.subject_code || ''} Competencies</p>
                                <p className="font-mono font-black text-[#5B4BFF] dark:text-purple-300">{displayCompCodes}</p>
                              </div>
                            ) : null}
                          </div>

                          <div className="px-4 py-2.5 bg-[#F6F8FC] dark:bg-slate-800/50 border-t border-[#E7EAF3] dark:border-slate-800 flex justify-between text-[11px]">
                            <span className="font-bold text-[#1B1E28] dark:text-slate-200">🏫 Hall: {slot.room || 'Lecture Hall'}</span>
                            <span className="font-black text-[#00C48C]">👨‍🏫 {slot.faculty_name || 'Faculty'}</span>
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
