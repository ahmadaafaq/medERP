'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

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

  const filteredSlots = weeklySlots.filter(s => Number(s.day_of_week) === selectedDay);

  const getSubjectBadgeColor = (typeStr?: string, codeStr?: string) => {
    if (codeStr?.includes('PHY')) return 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400';
    if (codeStr?.includes('ANA')) return 'border-purple-500/30 bg-purple-500/10 text-purple-400';
    if (codeStr?.includes('BCH')) return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
    if (codeStr?.includes('PATH')) return 'border-amber-500/30 bg-amber-500/10 text-amber-400';
    if (codeStr?.includes('SURG')) return 'border-rose-500/30 bg-rose-500/10 text-rose-400';
    if (typeStr === 'PRACTICAL') return 'border-purple-500/30 bg-purple-500/10 text-purple-400';
    if (typeStr === 'CLINICAL') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
    return 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400';
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-[#0F172A] text-[#4E5969] dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar role="student" />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Student Academic Schedule & Timetable" />

        <main className="p-6 space-y-6 flex-1 max-w-7xl mx-auto w-full">
          {/* Top Banner / Current Lecture */}
          <div className="p-6 rounded-[22px] bg-gradient-to-r from-[#2D2575] via-[#3E3498] to-[#2D2575] text-white shadow-soft space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#00C48C] text-white font-extrabold text-[10px] tracking-wider uppercase flex items-center gap-1.5 shadow">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                  Active / Next Scheduled Session
                </span>
                <span className="text-xs text-white/80 font-mono">
                  Today: {DAY_NAMES[(new Date().getDay() === 0 ? 7 : new Date().getDay()) - 1]}
                </span>
              </div>
              <button 
                type="button"
                onClick={fetchSchedule}
                className="text-xs text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer"
              >
                🔄 Refresh Schedule
              </button>
            </div>

            {currentLecture ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-white/10 text-white border border-white/20">
                      {currentLecture.subject_code || 'MBBS'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-[#F36C21] text-white">
                      {currentLecture.slot_type || 'LECTURE'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    {currentLecture.subject_name || 'Academic Class'}
                  </h2>
                  <p className="text-sm font-semibold text-white/90">
                    📖 Syllabus Topic: <span className="text-[#F36C21] font-bold">{currentLecture.topic || 'Curriculum Module'}</span>
                  </p>
                  {currentLecture.competency_codes && (
                    <p className="text-xs text-white/80">
                      🎯 NMC Competency: <span className="font-mono text-white font-bold">{currentLecture.competency_codes}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-xs text-white">
                  <div className="flex items-center justify-between">
                    <span>⏰ Time Slot:</span>
                    <strong className="font-mono text-white text-sm">
                      {currentLecture.start_time?.slice(0, 5)} - {currentLecture.end_time?.slice(0, 5)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>🏫 Location / Room:</span>
                    <strong className="text-white">{currentLecture.room || 'Lecture Hall 1'}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>👨‍🏫 Faculty:</span>
                    <strong className="text-[#00C48C]">{currentLecture.faculty_name || 'Department Faculty'}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-white/70 text-xs">
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
              <div className="py-16 text-center text-slate-400 text-xs border border-dashed border-slate-800 rounded-2xl space-y-2">
                <p className="text-base">📅 No classes scheduled for {DAY_NAMES[selectedDay - 1]}</p>
                <p className="text-slate-500">Timetable slots created by Administration or Clerks will appear here automatically.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredSlots.map((slot) => {
                  const isHovered = hoveredSlotId === slot.id;
                  const compList = slot.competencies_detail || [];

                  return (
                    <div
                      key={slot.id}
                      onMouseEnter={() => setHoveredSlotId(slot.id)}
                      onMouseLeave={() => setHoveredSlotId(null)}
                      className="relative p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/60 transition-all space-y-3 shadow-lg group cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold font-mono bg-slate-800 text-indigo-300 border border-slate-700">
                          {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase border ${getSubjectBadgeColor(slot.slot_type, slot.subject_code)}`}>
                          {slot.slot_type || 'LECTURE'}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                            {slot.subject_code || 'MBBS'}
                          </span>
                          {slot.group_name && (
                            <span className="text-[9px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-bold border border-purple-500/20">
                              {slot.group_name}
                            </span>
                          )}
                        </div>
                        <h4 className="font-black text-sm text-white group-hover:text-indigo-300 transition-colors">
                          {slot.subject_name || 'Medical Subject'}
                        </h4>
                        <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                          📖 <strong className="text-indigo-400 font-semibold">{slot.topic || 'Curriculum Module'}</strong>
                        </p>
                      </div>

                      {slot.competency_codes && (
                        <div className="text-[10px] text-purple-300 bg-purple-950/40 p-2 rounded-xl border border-purple-900/30 flex items-center justify-between">
                          <span>🎯 NMC Competency:</span>
                          <span className="font-mono font-bold text-white">{slot.competency_codes}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                        <span className="font-semibold text-slate-300">🏫 {slot.room || 'Lecture Hall 1'}</span>
                        <span className="text-emerald-400 font-semibold">👨‍🏫 {slot.faculty_name || 'Faculty Member'}</span>
                      </div>

                      {/* ────────────────────────────────────────────────────────── */}
                      {/* DYNAMIC COMPETENCY & TOPIC HOVER TOOLTIP CARD */}
                      {/* ────────────────────────────────────────────────────────── */}
                      {isHovered && (
                        <div className="absolute bottom-full left-0 mb-3 w-80 p-4 rounded-2xl bg-slate-950/95 border border-indigo-500/50 backdrop-blur-xl shadow-2xl z-50 text-slate-100 space-y-3 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-600/30 text-indigo-300 border border-indigo-500/40">
                              {slot.subject_code || 'MBBS'}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-emerald-400">
                              {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                            </span>
                          </div>

                          <div>
                            <h5 className="font-black text-sm text-white">{slot.subject_name}</h5>
                            <p className="text-xs text-indigo-300 font-semibold mt-1">
                              Topic: {slot.topic || 'Curriculum Session'}
                            </p>
                          </div>

                          {compList.length > 0 ? (
                            <div className="space-y-1.5 pt-1">
                              <p className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400">
                                🎯 NMC Competency Details
                              </p>
                              {compList.map((c, i) => (
                                <div key={i} className="p-2 rounded-xl bg-purple-950/40 border border-purple-800/40 text-[11px]">
                                  <p className="font-mono font-bold text-purple-300">{c.code}</p>
                                  <p className="text-slate-300 text-[10px] leading-tight mt-0.5">{c.description}</p>
                                </div>
                              ))}
                            </div>
                          ) : slot.competency_codes ? (
                            <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-800/40 text-[11px] space-y-0.5">
                              <p className="text-[10px] font-extrabold uppercase text-purple-400">NMC Competencies</p>
                              <p className="font-mono font-bold text-white">{slot.competency_codes}</p>
                            </div>
                          ) : null}

                          <div className="pt-2 border-t border-slate-800 text-[11px] flex justify-between text-slate-400">
                            <span>Hall: <strong className="text-white">{slot.room || 'Lecture Hall'}</strong></span>
                            <span>Faculty: <strong className="text-emerald-400">{slot.faculty_name || 'Faculty'}</strong></span>
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
