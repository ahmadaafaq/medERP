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
    if (!matchSlotDay(item.day_of_week, selectedDay)) return false;
    if (filterType === 'ALL') return true;
    return item.slot_type === filterType;
  });

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#4E5969] dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar role="student" />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Student Daily Academic Schedule" />

        <main className="p-6 space-y-6 flex-1 max-w-7xl mx-auto w-full">
          {/* Header Controls */}
          <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-soft">
            <div>
              <h2 className="text-lg font-black text-[#1B1E28] dark:text-white tracking-tight uppercase">Daily Timeline & Class Schedule</h2>
              <p className="text-xs text-[#7B8794] dark:text-slate-400">Authentic timetable timeline created by college administration</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Day selector */}
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(parseInt(e.target.value, 10))}
                className="px-3.5 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
              >
                {DAY_NAMES.slice(0, 6).map((d, i) => (
                  <option key={d} value={i + 1}>{d}</option>
                ))}
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
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
                className="px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4E3EEA] text-white text-xs font-black shadow-md shadow-[#5B4BFF]/25 transition-all cursor-pointer"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {/* Timeline View */}
          <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 space-y-6 shadow-soft">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#7B8794] dark:text-slate-400">
              Schedule Timeline for {DAY_NAMES[selectedDay - 1]}
            </h3>

            {loading ? (
              <div className="py-16 text-center text-[#7B8794] text-xs animate-pulse">
                Loading authentic schedule timeline from database...
              </div>
            ) : filteredSchedule.length === 0 ? (
              <div className="py-16 text-center text-[#4E5969] dark:text-slate-400 text-xs border border-dashed border-[#E7EAF3] dark:border-slate-800 rounded-2xl space-y-2">
                <p className="text-base font-bold text-[#1B1E28] dark:text-slate-200">No classes scheduled for {DAY_NAMES[selectedDay - 1]}</p>
                <p className="text-[#7B8794]">Scheduled classes created by College Admin or Clerks will appear here automatically.</p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 border-l-2 border-[#E7EAF3] dark:border-slate-800">
                {filteredSchedule.map((item) => {
                  const isHovered = hoveredSlotId === item.id;
                  const compList = filterCompetenciesForSlot(item.competencies_detail || [], item.subject_code, item.subject_name, item.topic);
                  const displayCompCodes = filterCompetencyCodesString(item.competency_codes, item.subject_code, item.subject_name, item.topic);

                  return (
                    <div
                      key={item.id}
                      onMouseEnter={() => setHoveredSlotId(item.id)}
                      onMouseLeave={() => setHoveredSlotId(null)}
                      className="relative group cursor-pointer"
                    >
                      {/* Timeline Dot */}
                      <div className="absolute -left-[31px] top-2 w-4 h-4 rounded-full border-2 border-white dark:border-slate-950 bg-[#5B4BFF] group-hover:bg-[#F36C21] transition-all shadow-md shadow-[#5B4BFF]/40" />

                      <div className="p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 hover:border-[#5B4BFF]/60 transition-all space-y-3 shadow-soft">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-[#5B4BFF] dark:text-indigo-400 font-extrabold text-sm">
                            {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-black font-mono bg-[#FFF4EC] text-[#D9530F] dark:bg-orange-950/70 dark:text-[#F36C21] border border-[#F36C21]/50 shadow-2xs">
                            {item.subject_code || 'MBBS'} • {item.slot_type || 'LECTURE'}
                          </span>
                        </div>

                        <div>
                          <span className="text-xs font-mono font-black text-[#5B4BFF] dark:text-indigo-300 uppercase">
                            {item.subject_code || 'MBBS'}
                          </span>
                          <h4 className="font-black text-base text-[#1B1E28] dark:text-white group-hover:text-[#5B4BFF] transition-colors">
                            {item.subject_name || 'Medical Subject'}
                          </h4>
                          <p className="text-xs text-[#4E5969] dark:text-slate-300 mt-1">
                            📖 Topic: <span className="text-[#F36C21] font-extrabold">{item.topic || 'Curriculum Module'}</span>
                          </p>
                        </div>

                        {displayCompCodes && (
                          <div className="text-[10px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 p-2 rounded-xl border border-purple-200 dark:border-purple-900/30 font-mono font-bold">
                            🎯 NMC Competency: {displayCompCodes}
                          </div>
                        )}

                        <div className="pt-2 flex items-center justify-between text-xs text-[#4E5969] dark:text-slate-400 border-t border-[#E7EAF3] dark:border-slate-800">
                          <span className="font-bold text-[#1B1E28] dark:text-slate-300">🏫 {item.room || 'Lecture Hall 1'}</span>
                          <span className="text-[#00C48C] font-extrabold">👨‍🏫 {item.faculty_name || 'Faculty Member'}</span>
                        </div>

                        {/* HOVER TOOLTIP CARD */}
                        {isHovered && (
                          <div
                            onMouseEnter={() => setHoveredSlotId(item.id)}
                            onMouseLeave={() => setHoveredSlotId(null)}
                            className="absolute left-0 bottom-full mb-3 w-80 sm:w-96 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-2xl backdrop-blur-xl z-50 text-[#1B1E28] dark:text-slate-100 overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-150 before:absolute before:-bottom-4 before:left-0 before:right-0 before:h-4"
                          >
                            {/* Top Deep Purple Ribbon Header */}
                            <div className="p-3.5 bg-gradient-to-r from-[#2D2575] to-[#3E3498] text-white flex items-center justify-between text-xs font-black force-text-white border-b border-white/10">
                              <span className="px-3 py-1 rounded-full text-xs font-black font-mono bg-[#FFF4EC] text-[#D9530F] dark:bg-orange-950/80 dark:text-[#F36C21] border border-[#F36C21]/50 shadow-2xs">
                                {item.subject_code || 'MBBS'} • {item.slot_type || 'LECTURE'}
                              </span>
                              <span className="font-mono text-white text-xs font-bold">
                                🕒 {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}
                              </span>
                            </div>

                            <div className="p-4 space-y-3">
                              <div>
                                <h5 className="font-black text-sm text-[#1B1E28] dark:text-white">{item.subject_name}</h5>
                                <p className="text-xs text-[#5B4BFF] dark:text-indigo-400 font-bold mt-1 flex items-center gap-1.5">
                                  <span>📖 Topic:</span>
                                  <span>{item.topic || 'Curriculum Session'}</span>
                                </p>
                              </div>

                              {compList.length > 0 ? (
                                <div className="space-y-2 pt-1">
                                  <p className="text-[10px] font-black uppercase tracking-wider text-[#F36C21] flex items-center gap-1.5">
                                    <span>🎯 {item.subject_code || ''} Topic Competencies</span>
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
                                  <p className="text-[10px] font-black uppercase text-[#F36C21]">🎯 {item.subject_code || ''} Competencies</p>
                                  <p className="font-mono font-black text-[#5B4BFF] dark:text-purple-300">{displayCompCodes}</p>
                                </div>
                              ) : null}
                            </div>

                            <div className="px-4 py-2.5 bg-[#F6F8FC] dark:bg-slate-800/50 border-t border-[#E7EAF3] dark:border-slate-800 flex justify-between text-[11px]">
                              <span className="font-bold text-[#1B1E28] dark:text-slate-200">🏫 Hall: {item.room || 'Lecture Hall'}</span>
                              <span className="font-black text-[#00C48C]">👨‍🏫 {item.faculty_name || 'Faculty'}</span>
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
