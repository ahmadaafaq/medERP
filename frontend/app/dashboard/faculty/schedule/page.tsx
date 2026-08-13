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

export default function FacultySchedulePage() {
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() === 0 ? 7 : new Date().getDay());
  const [weeklySlots, setWeeklySlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hoveredSlotId, setHoveredSlotId] = useState<string | null>(null);
  const [facultyDeptName, setFacultyDeptName] = useState<string>('');

  useEffect(() => {
    fetchFacultySchedule();
  }, []);

  const fetchFacultySchedule = async () => {
    setLoading(true);
    const slug = getStorageItem('tenantSlug') || 'srms-ims';
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
      });

      if (meRes.ok) {
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
      });

      if (res.ok) {
        const json = await res.json();
        setWeeklySlots(Array.isArray(json.data) ? json.data : []);
      } else {
        setWeeklySlots([]);
      }
    } catch (err) {
      console.error('Failed to fetch faculty schedule:', err);
      setWeeklySlots([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSlots = weeklySlots.filter(s => {
    if (Number(s.day_of_week) !== selectedDay) return false;
    if (facultyDeptName && facultyDeptName !== 'Department') {
      const dName = (s.department_name || '').toLowerCase();
      const sName = (s.subject_name || '').toLowerCase();
      const fDept = facultyDeptName.toLowerCase().replace('department of ', '').replace(' department', '').trim();
      if (fDept && !dName.includes(fDept) && !sName.includes(fDept)) {
        return false;
      }
    }
    return true;
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
                  const compList = slot.competencies_detail || [];

                  return (
                    <div
                      key={slot.id}
                      onMouseEnter={() => setHoveredSlotId(slot.id)}
                      onMouseLeave={() => setHoveredSlotId(null)}
                      className="relative p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 hover:border-[#5B4BFF]/50 transition-all duration-300 space-y-3.5 shadow-soft hover:shadow-xl transform hover:-translate-y-1 group cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-xl text-xs font-mono font-black bg-[#EEECFF] text-[#5B4BFF] border border-[#5B4BFF]/30">
                          {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                        </span>
                        <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-[#FFF4EC] text-[#F36C21] border border-[#F36C21]/30">
                          {slot.slot_type || 'LECTURE'}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-black text-[#5B4BFF] uppercase">
                            {slot.subject_code || 'MBBS'}
                          </span>
                          {slot.batch_code && (
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#F8FAFC] dark:bg-slate-800 text-[#1B1E28] dark:text-slate-200 font-mono font-extrabold border border-[#E7EAF3] dark:border-slate-700">
                              Batch: {slot.batch_code}
                            </span>
                          )}
                        </div>
                        <h4 className="font-black text-sm text-[#1B1E28] dark:text-white group-hover:text-[#5B4BFF] transition-colors">
                          {slot.subject_name || 'Department Subject'}
                        </h4>
                        <p className="text-xs text-[#4E5969] dark:text-slate-300 mt-1 line-clamp-2 font-medium">
                          📖 <strong className="text-[#5B4BFF] font-black">{slot.topic || 'Curriculum Module'}</strong>
                        </p>
                      </div>

                      {slot.competency_codes && (
                        <div className="text-xs text-[#5B4BFF] dark:text-indigo-300 bg-[#EEECFF] dark:bg-slate-800/80 p-2.5 rounded-xl border border-[#5B4BFF]/30 flex items-center justify-between font-black shadow-sm">
                          <span>🎯 NMC Competency:</span>
                          <span className="font-mono font-black text-[#5B4BFF] dark:text-indigo-300">{slot.competency_codes}</span>
                        </div>
                      )}

                      <div className="pt-2.5 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between text-xs">
                        <span className="font-bold text-[#4E5969] dark:text-slate-400">🏫 {slot.room || 'Lecture Hall 1'}</span>
                        <span className="text-[#00C48C] font-black bg-[#E6F9F3] border border-[#00C48C]/30 px-2.5 py-0.5 rounded-full">👨‍🏫 {slot.faculty_name || 'Faculty Member'}</span>
                      </div>

                      {/* HOVER TOOLTIP CARD */}
                      {isHovered && (
                        <div className="absolute bottom-full left-0 mb-3 w-80 p-4 rounded-[22px] bg-white dark:bg-slate-900 border-2 border-[#5B4BFF] shadow-2xl z-50 text-[#1B1E28] dark:text-white space-y-3 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                          <div className="flex items-center justify-between pb-2 border-b border-[#E7EAF3] dark:border-slate-800">
                            <span className="text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full bg-[#EEECFF] text-[#5B4BFF] border border-[#5B4BFF]/30">
                              {slot.subject_code || 'MBBS'}
                            </span>
                            <span className="text-xs font-mono font-black text-[#00C48C]">
                              {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                            </span>
                          </div>

                          <div>
                            <h5 className="font-black text-sm text-[#1B1E28] dark:text-white">{slot.subject_name}</h5>
                            <p className="text-xs text-[#5B4BFF] font-black mt-1">
                              Topic: {slot.topic || 'Curriculum Session'}
                            </p>
                          </div>

                          {compList.length > 0 ? (
                            <div className="space-y-1.5 pt-1">
                              <p className="text-[10px] font-black uppercase tracking-wider text-[#F36C21]">
                                🎯 NMC Competency Details
                              </p>
                              {compList.map((c, i) => (
                                <div key={i} className="p-2.5 rounded-xl bg-[#EEECFF] dark:bg-slate-800 border border-[#5B4BFF]/30 text-[11px]">
                                  <p className="font-mono font-black text-[#5B4BFF] dark:text-indigo-300">{c.code}</p>
                                  <p className="text-[#4E5969] dark:text-slate-300 text-[11px] leading-snug mt-0.5 font-medium">{c.description}</p>
                                </div>
                              ))}
                            </div>
                          ) : slot.competency_codes ? (
                            <div className="p-2.5 rounded-xl bg-[#EEECFF] dark:bg-slate-800 border border-[#5B4BFF]/30 text-[11px] space-y-0.5">
                              <p className="text-[10px] font-black uppercase text-[#F36C21]">NMC Competencies</p>
                              <p className="font-mono font-black text-[#5B4BFF] dark:text-indigo-300">{slot.competency_codes}</p>
                            </div>
                          ) : null}

                          <div className="pt-2 border-t border-[#E7EAF3] dark:border-slate-800 text-[11px] flex justify-between text-[#4E5969] dark:text-slate-400 font-bold">
                            <span>Hall: <strong className="text-[#1B1E28] dark:text-white">{slot.room || 'Lecture Hall'}</strong></span>
                            <span>Faculty: <strong className="text-[#00C48C]">{slot.faculty_name || 'Faculty'}</strong></span>
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
