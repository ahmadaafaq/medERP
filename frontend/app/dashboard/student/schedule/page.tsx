'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

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

export default function StudentSchedulePage() {
  const [scheduleSlots, setScheduleSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() === 0 ? 7 : new Date().getDay());
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
          setScheduleSlots(slots);
          if (json.data.currentDayOfWeek) {
            setSelectedDay(json.data.currentDayOfWeek);
          }
        } else {
          setScheduleSlots([]);
        }
      } else {
        setScheduleSlots([]);
      }
    } catch {
      setScheduleSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSchedule = scheduleSlots.filter(item => {
    if (Number(item.day_of_week) !== selectedDay) return false;
    if (filterType === 'ALL') return true;
    return item.slot_type === filterType;
  });

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar role="student" />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Student Daily Academic Schedule" />

        <main className="p-6 space-y-6 flex-1 max-w-7xl mx-auto w-full">
          {/* Header Controls */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div>
              <h2 className="text-lg font-black text-white tracking-tight uppercase">Daily Timeline & Class Schedule</h2>
              <p className="text-xs text-slate-400">Authentic timetable timeline created by college administration</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Day selector */}
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(parseInt(e.target.value, 10))}
                className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
              >
                {DAY_NAMES.slice(0, 6).map((d, i) => (
                  <option key={d} value={i + 1}>{d}</option>
                ))}
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Session Types</option>
                <option value="LECTURE">Lectures</option>
                <option value="PRACTICAL">Practicals</option>
                <option value="CLINICAL">Clinical Rotations</option>
                <option value="SGD">Small Group Discussions</option>
              </select>

              <button
                type="button"
                onClick={fetchSchedule}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {/* Timeline View */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Schedule Timeline for {DAY_NAMES[selectedDay - 1]}
            </h3>

            {loading ? (
              <div className="py-16 text-center text-slate-400 text-xs animate-pulse">
                Loading authentic schedule timeline from database...
              </div>
            ) : filteredSchedule.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs border border-dashed border-slate-800 rounded-2xl space-y-2">
                <p className="text-base font-semibold">No classes scheduled for {DAY_NAMES[selectedDay - 1]}</p>
                <p className="text-slate-500">Scheduled classes created by College Admin or Clerks will appear here automatically.</p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 border-l-2 border-slate-800">
                {filteredSchedule.map((item) => {
                  const isHovered = hoveredSlotId === item.id;
                  const compList = item.competencies_detail || [];

                  return (
                    <div
                      key={item.id}
                      onMouseEnter={() => setHoveredSlotId(item.id)}
                      onMouseLeave={() => setHoveredSlotId(null)}
                      className="relative group cursor-pointer"
                    >
                      {/* Timeline Dot */}
                      <div className="absolute -left-[31px] top-2 w-4 h-4 rounded-full border-2 border-slate-950 bg-indigo-500 group-hover:bg-indigo-400 transition-all shadow-md shadow-indigo-500/50" />

                      <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/90 hover:border-indigo-500/60 transition-all space-y-3 shadow-lg">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-indigo-400 font-extrabold text-sm">
                            {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                            {item.slot_type || 'LECTURE'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                            {item.subject_code || 'MBBS'}
                          </span>
                          <h4 className="font-extrabold text-base text-white group-hover:text-indigo-300 transition-colors">
                            {item.subject_name || 'Medical Subject'}
                          </h4>
                          <p className="text-xs text-slate-300 mt-1">
                            📖 Topic: <span className="text-indigo-400 font-semibold">{item.topic || 'Curriculum Module'}</span>
                          </p>
                        </div>

                        {item.competency_codes && (
                          <div className="text-[10px] text-purple-300 bg-purple-950/40 p-2 rounded-xl border border-purple-900/30 font-mono font-bold">
                            🎯 NMC Competency: {item.competency_codes}
                          </div>
                        )}

                        <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800">
                          <span className="font-semibold text-slate-300">🏫 {item.room || 'Lecture Hall 1'}</span>
                          <span className="text-emerald-400 font-semibold">👨‍🏫 {item.faculty_name || 'Faculty Member'}</span>
                        </div>

                        {/* HOVER TOOLTIP CARD */}
                        {isHovered && (
                          <div className="absolute left-0 bottom-full mb-3 w-80 p-4 rounded-2xl bg-slate-950 border border-indigo-500/50 backdrop-blur-xl shadow-2xl z-50 text-slate-100 space-y-3 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                              <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-600/30 text-indigo-300 border border-indigo-500/40">
                                {item.subject_code || 'MBBS'}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-emerald-400">
                                {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}
                              </span>
                            </div>

                            <div>
                              <h5 className="font-black text-sm text-white">{item.subject_name}</h5>
                              <p className="text-xs text-indigo-300 font-semibold mt-1">
                                Topic: {item.topic || 'Curriculum Session'}
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
                            ) : item.competency_codes ? (
                              <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-800/40 text-[11px] space-y-0.5">
                                <p className="text-[10px] font-extrabold uppercase text-purple-400">NMC Competencies</p>
                                <p className="font-mono font-bold text-white">{item.competency_codes}</p>
                              </div>
                            ) : null}

                            <div className="pt-2 border-t border-slate-800 text-[11px] flex justify-between text-slate-400">
                              <span>Hall: <strong className="text-white">{item.room || 'Lecture Hall'}</strong></span>
                              <span>Faculty: <strong className="text-emerald-400">{item.faculty_name || 'Faculty'}</strong></span>
                            </div>
                          </div>
                        )}
                      </div>
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
