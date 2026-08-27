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

export default function StudentSchedulePage() {
  const [scheduleSlots, setScheduleSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() === 0 ? 7 : new Date().getDay());
  const [hoveredSlotId, setHoveredSlotId] = useState<string | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string>('srms-cet-bareilly');

  const isMedical = tenantSlug.includes('ims') || tenantSlug.includes('medical') || tenantSlug.includes('med');

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    setLoading(true);
    const slug = getStorageItem('tenantSlug') || getStorageItem('selectedTenant') || 'srms-cet-bareilly';
    setTenantSlug(slug);
    try {
      const token = getStorageItem('token') || '';

      // 1. Fetch Logged-In Student Profile for precise Course, Branch, Batch, Semester filtering
      let courseCd = '';
      let branchCd = '';
      let batchCd = '';
      let batchId = '';
      let semester = '';
      let section = '';
      let colgCd = '';

      try {
        const meRes = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-tenant-slug': slug,
          },
        }).catch(() => null);

        if (meRes && meRes.ok) {
          const meJson = await meRes.json();
          const meData = meJson.data || meJson;
          const p = meData.profile || meData;
          courseCd = p.course_cd || meData.course_cd || meData.courseCd || (p.course_name?.includes('BCA') ? '13' : '');
          branchCd = p.branch_cd || meData.branch_cd || meData.branchCd || '1';
          batchCd = p.batch_cd || meData.batch_cd || meData.batchCd || '2';
          batchId = p.batch_id || meData.batch_id || meData.batchId || '';
          semester = p.semester || p.current_semester || meData.semester || '3';
          section = p.section || meData.section || '1';
          colgCd = p.colg_cd || meData.colg_cd || meData.colgcd || '1';
        }
      } catch {
        // Continue with query
      }

      let url = `${API_BASE}/timetable/student-schedule?tenant=${slug}`;
      if (batchId) url += `&batchId=${encodeURIComponent(batchId)}`;
      if (courseCd) url += `&courseCd=${encodeURIComponent(courseCd)}`;
      if (branchCd) url += `&branchCd=${encodeURIComponent(branchCd)}`;
      if (batchCd) url += `&batchCd=${encodeURIComponent(batchCd)}`;
      if (semester) url += `&semester=${encodeURIComponent(semester)}`;
      if (section) url += `&section=${encodeURIComponent(section)}`;
      if (colgCd) url += `&colgCd=${encodeURIComponent(colgCd)}`;

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
      }).catch(() => null);

      let rawSlots: TimetableSlot[] = [];

      if (res && res.ok) {
        const json = await res.json();
        if (json && json.data) {
          rawSlots = Array.isArray(json.data.weeklySlots)
            ? json.data.weeklySlots
            : Array.isArray(json.data.todaysSlots)
              ? json.data.todaysSlots
              : Array.isArray(json.data)
                ? json.data
                : [];
          if (json.data.currentDayOfWeek) {
            setSelectedDay(json.data.currentDayOfWeek);
          }
        }
      }

      // If strict filter had no slots, fallback to tenant timetable
      if (rawSlots.length === 0) {
        const fbRes = await fetch(`${API_BASE}/timetable?tenant=${slug}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-tenant-slug': slug,
          },
        }).catch(() => null);
        if (fbRes && fbRes.ok) {
          const fbJson = await fbRes.json();
          rawSlots = Array.isArray(fbJson.data) ? fbJson.data : [];
        }
      }

      const seen = new Set<string>();
      const slots = rawSlots.filter(s => {
        const normSub = (s.subject_name || s.subject_code || s.topic || '').replace(/\([^)]*\)/g, '').trim().toLowerCase();
        const key = `${s.day_of_week}_${s.start_time?.slice(0, 5)}_${normSub}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setScheduleSlots(slots);
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
                      className={`relative group cursor-pointer ${isHovered ? 'z-[60]' : 'z-10'}`}
                    >
                      {/* Timeline Dot */}
                      <div className="absolute -left-[31px] top-2 w-4 h-4 rounded-full border-2 border-white dark:border-slate-950 bg-[#5B4BFF] group-hover:bg-[#F36C21] transition-all shadow-md shadow-[#5B4BFF]/40" />

                      <div className="p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 hover:border-[#5B4BFF]/60 transition-all space-y-3 shadow-soft relative">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-[#5B4BFF] dark:text-indigo-400 font-extrabold text-sm">
                            {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-black font-mono bg-[#FFF4EC] text-[#D9530F] dark:bg-orange-950/70 dark:text-[#F36C21] border border-[#F36C21]/50 shadow-2xs">
                            {item.subject_code || 'BCA'} • {item.slot_type || 'LECTURE'}
                          </span>
                        </div>

                        <div>
                          <span className="text-xs font-mono font-black text-[#5B4BFF] dark:text-indigo-300 uppercase">
                            {item.subject_code || 'BCA'}
                          </span>
                          <h4 className="font-black text-base text-[#1B1E28] dark:text-white group-hover:text-[#5B4BFF] transition-colors">
                            {item.subject_name || 'Engineering Subject'}
                          </h4>
                          <p className="text-xs text-[#4E5969] dark:text-slate-300 mt-1">
                            📖 Topic: <span className="text-[#F36C21] font-extrabold">{item.topic || 'Curriculum Module'}</span>
                          </p>
                        </div>

                        {displayCompCodes && (
                          <div className="text-[10px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 p-2 rounded-xl border border-purple-200 dark:border-purple-900/30 font-mono font-bold">
                            🎯 {isMedical ? 'NMC Competency:' : 'Sub Topics:'} {displayCompCodes}
                          </div>
                        )}

                        <div className="pt-2 flex items-center justify-between text-xs text-[#4E5969] dark:text-slate-400 border-t border-[#E7EAF3] dark:border-slate-800">
                          <span className="font-bold text-[#1B1E28] dark:text-slate-300">🏫 {item.room || 'Lecture Hall 1'}</span>
                          <span className="text-[#00C48C] font-extrabold">👨‍🏫 {item.faculty_name || 'Faculty Member'}</span>

                          {/* OVERLAY CARD ON HOVER (OFFSET TOP-10 SO HALF CARD REMAINS VISIBLE) */}
                          {isHovered && (
                            <div
                              onMouseEnter={() => setHoveredSlotId(item.id)}
                              onMouseLeave={() => setHoveredSlotId(null)}
                              className="absolute top-10 -left-2 sm:-left-3 w-[calc(100%+16px)] sm:w-[400px] rounded-[22px] bg-white dark:bg-[#0B1120] border-2 border-[#F36C21]/60 dark:border-[#F36C21]/60 shadow-2xl shadow-slate-900/25 dark:shadow-slate-950/90 backdrop-blur-xl z-50 text-[#11141A] dark:text-slate-100 overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-150 p-4 space-y-3"
                            >
                              {/* Top Header Ribbon */}
                              <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E5E8ED] dark:border-slate-800">
                                <span className="px-3 py-1 rounded-full text-xs font-black font-mono bg-[#FFF4EC] text-[#F36C21] dark:bg-orange-950/70 dark:text-[#F36C21] border border-[#F36C21]/40 shadow-xs uppercase">
                                  {item.subject_code || 'BCA'} • {item.slot_type || 'LECTURE'}
                                </span>
                                <span className="font-mono text-[#475467] dark:text-indigo-200 text-xs font-bold">
                                  🕒 {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}
                                </span>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <h5 className="font-black text-sm text-[#11141A] dark:text-white">{item.subject_name}</h5>
                                  <p className="text-xs text-[#F36C21] font-bold mt-1 flex items-center gap-1.5">
                                    <span>📖 Topic:</span>
                                    <span>{item.topic || 'Curriculum Session'}</span>
                                  </p>
                                </div>

                                {compList.length > 0 ? (
                                  <div className="space-y-2 pt-1">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-[#F36C21] flex items-center gap-1.5">
                                      <span>🎯 {item.subject_code || ''} {isMedical ? 'Topic Competencies' : 'Sub Topics'}</span>
                                      <span className="px-1.5 py-0.2 rounded-full bg-[#F36C21] text-white text-[9px] font-mono font-bold">
                                        {compList.length}
                                      </span>
                                    </p>
                                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                                      {compList.map((c, i) => (
                                        <div key={i} className="p-2.5 rounded-xl bg-[#F7F8FA] dark:bg-slate-800/80 border border-[#E5E8ED] dark:border-slate-700 text-xs flex items-start gap-2">
                                          <span className="shrink-0 px-2 py-0.5 rounded-md bg-[#F36C21] text-white font-mono font-black text-[10px]">
                                            {c.code}
                                          </span>
                                          <p className="text-[#344054] dark:text-slate-200 text-[11px] leading-snug font-medium">{c.description}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : displayCompCodes ? (
                                  <div className="p-2.5 rounded-xl bg-[#F7F8FA] dark:bg-slate-800/80 border border-[#E5E8ED] dark:border-slate-700 text-xs space-y-0.5">
                                    <p className="text-[10px] font-black uppercase text-[#F36C21]">🎯 {item.subject_code || ''} {isMedical ? 'Competencies' : 'Sub Topics'}</p>
                                    <p className="font-mono font-black text-[#11141A] dark:text-white">{displayCompCodes}</p>
                                  </div>
                                ) : null}
                              </div>

                              <div className="pt-2.5 border-t border-[#E5E8ED] dark:border-slate-800 flex justify-between text-[11px]">
                                <span className="font-bold text-[#344054] dark:text-slate-200">🏫 Hall: {item.room || 'Lecture Hall'}</span>
                                <span className="font-black text-[#0E9F6E]">👨‍🏫 {item.faculty_name || 'Faculty'}</span>
                              </div>
                            </div>
                          )}
                        </div>
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
