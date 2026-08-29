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
  unit_name?: string;
  unit_id?: string;
  sub_topics?: string;
  faculty_name?: string;
  subject_name?: string;
  subject_code?: string;
  department_name?: string;
  batch_code?: string;
  competencies_detail?: CompetencyDetail[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

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
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [tenantSlug, setTenantSlug] = useState<string>('srms-cet-bareilly');
  const [currentLecture, setCurrentLecture] = useState<TimetableSlot | null>(null);
  const [weeklySlots, setWeeklySlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hoveredSlotId, setHoveredSlotId] = useState<string | null>(null);
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
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    setLoading(true);
    const slug = getStorageItem('tenantSlug') || getStorageItem('selectedTenant') || 'srms-cet-bareilly';
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
      let currentActive: TimetableSlot | null = null;

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
          currentActive = json.data.currentLecture || null;
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

      setWeeklySlots(slots);
      setCurrentLecture(currentActive || (slots.length > 0 ? slots[0] : null));
    } catch {
      setWeeklySlots([]);
      setCurrentLecture(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredSlots = weeklySlots.filter(s => matchSlotDay(s.day_of_week, selectedDay));

  const getSubjectBadgeColor = (typeStr?: string, codeStr?: string) => {
    if (codeStr?.includes('KCS') || codeStr?.includes('BCA') || codeStr?.includes('CS') || codeStr?.includes('IT')) return 'border-[#5B4BFF]/30 bg-[#5B4BFF]/10 text-[#5B4BFF] dark:text-indigo-400';
    if (codeStr?.includes('ECE') || codeStr?.includes('EE')) return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400';
    if (codeStr?.includes('ME')) return 'border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400';
    if (codeStr?.includes('PHY') || codeStr === 'PY') return 'border-[#5B4BFF]/30 bg-[#5B4BFF]/10 text-[#5B4BFF] dark:text-indigo-400';
    if (codeStr?.includes('ANA') || codeStr === 'AN') return 'border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400';
    if (codeStr?.includes('BCH') || codeStr === 'BC') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    if (typeStr === 'PRACTICAL') return 'border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400';
    if (typeStr === 'LAB') return 'border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400';
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
                      {currentLecture.subject_code || 'BCA-301'}
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
                      🎯 Learning Unit: <span className="font-mono text-white font-black bg-white/10 px-2 py-0.5 rounded border border-white/20">{currentLecture.competency_codes}</span>
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
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${isSelected
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
                {filteredSlots.map((slot, sIdx) => {
                  const isHovered = hoveredSlotId === slot.id;
                  const isTopOrMiddle = sIdx < Math.max(1, filteredSlots.length - 1);
                  const popoverPosClass = isTopOrMiddle ? "top-full mt-2 left-0 z-50" : "bottom-full mb-2 left-0 z-50";
                  const compList = filterCompetenciesForSlot(slot.competencies_detail || [], slot.subject_code, slot.subject_name, slot.topic);
                  const displayCompCodes = filterCompetencyCodesString(slot.competency_codes, slot.subject_code, slot.subject_name, slot.topic);

                  return (
                    <div
                      key={slot.id}
                      onMouseEnter={() => setHoveredSlotId(slot.id)}
                      onMouseLeave={() => setHoveredSlotId(null)}
                      className={`relative p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 hover:border-[#F36C21]/60 transition-all space-y-3 shadow-soft group cursor-pointer ${isHovered ? 'z-[60]' : 'z-10'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-[#F6F8FC] dark:bg-slate-800 text-[#5B4BFF] dark:text-indigo-300 border border-[#E7EAF3] dark:border-slate-700">
                          {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-black font-mono bg-[#FFF4EC] text-[#D9530F] dark:bg-orange-950/70 dark:text-[#F36C21] border border-[#F36C21]/50 shadow-2xs uppercase">
                          {slot.subject_code || (tenantSlug.includes('ims') ? 'MBBS' : 'BCA')} • {slot.slot_type || 'LECTURE'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-black text-[#5B4BFF] dark:text-indigo-300 uppercase">
                            {slot.subject_code || (tenantSlug.includes('ims') ? 'MBBS' : 'BCA')}
                          </span>
                          {slot.group_name && (
                            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/20">
                              {slot.group_name}
                            </span>
                          )}
                        </div>
                        <h4 className="font-black text-lg text-[#1B1E28] dark:text-white group-hover:text-[#5B4BFF] transition-colors tracking-tight">
                          {slot.subject_name || slot.topic || 'Academic Subject'}
                        </h4>
                        <p className="text-xs text-[#5B4BFF] dark:text-indigo-400 font-semibold flex items-center gap-1.5 pt-0.5">
                          <span>📖</span>
                          <span>{slot.topic || 'Curriculum Module'}</span>
                        </p>
                      </div>

                      {displayCompCodes && (
                        <div className="text-xs text-purple-700 dark:text-purple-300 bg-purple-50/80 dark:bg-purple-950/40 p-2.5 rounded-2xl border border-purple-200/80 dark:border-purple-900/30 flex items-center justify-between font-semibold">
                          <span className="flex items-center gap-1.5">
                            <span>🎯</span> {tenantSlug.includes('ims') ? 'NMC Competency:' : 'Curriculum Unit / Topic:'}
                          </span>
                          <span className="font-mono font-black text-[#1B1E28] dark:text-white">{displayCompCodes}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between text-xs text-[#4E5969] dark:text-slate-400">
                        <span className="font-bold text-[#1B1E28] dark:text-slate-200">🏫 {slot.room || 'Room 204'}</span>
                        <span className="text-[#00C48C] font-black text-xs">👨‍🏫 {slot.faculty_name || 'Faculty Member'}</span>
                      </div>

                      {/* ────────────────────────────────────────────────────────── */}
                      {/* DYNAMIC TOPIC & SUB TOPICS HOVER TOOLTIP CARD */}
                      {/* ────────────────────────────────────────────────────────── */}
                      {isHovered && (
                        <div
                          onMouseEnter={() => handleSlotMouseEnter(slot.id)}
                          onMouseLeave={handleSlotMouseLeave}
                          className="absolute top-10 -left-2 sm:-left-3 w-[calc(100%+16px)] sm:w-[340px] rounded-[22px] bg-white dark:bg-[#0B1120] text-[#11141A] dark:text-slate-100 border-2 border-[#F36C21]/60 dark:border-[#F36C21]/60 shadow-2xl shadow-slate-900/25 dark:shadow-slate-950/90 backdrop-blur-xl z-50 overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-150 text-[11px] p-3.5 space-y-2.5"
                        >
                          {/* Top Header Ribbon */}
                          <div className="flex items-center justify-between gap-1.5 border-b border-[#E5E8ED] dark:border-slate-800 pb-1.5">
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black font-mono bg-[#FFF4EC] text-[#F36C21] dark:bg-orange-950/70 dark:text-[#F36C21] border border-[#F36C21]/40 shadow-xs uppercase">
                              {slot.subject_code || (tenantSlug.includes('ims') ? 'MBBS' : 'BCA')} • {slot.slot_type || 'LECTURE'}
                            </span>
                            <span className="font-mono text-[#475467] dark:text-indigo-200 text-[10px] font-bold">
                              ⏰ {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <h5 className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight truncate">
                              {slot.subject_name || slot.topic || 'Subject'}
                            </h5>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                              <span>👨‍🏫 {slot.faculty_name || 'Faculty Member'}</span>
                              <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono font-bold text-slate-700 dark:text-slate-300">
                                {slot.room || 'Room 204'}
                              </span>
                            </div>
                          </div>

                          {/* 1. Unit Badge */}
                          <div className="p-2 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 space-y-0.5">
                            <div className="text-[9px] font-black uppercase text-[#5B4BFF] dark:text-indigo-400 tracking-wider">
                              🏷️ 1. Unit
                            </div>
                            <p className="text-[11px] font-bold text-slate-900 dark:text-white leading-snug">
                              {slot.unit_name || 'Unit 1: Fundamentals'}
                            </p>
                          </div>

                          {/* 2. Scheduled Topic */}
                          <div className="p-2 rounded-xl bg-[#F7F8FA] dark:bg-slate-800/70 border border-[#E5E8ED] dark:border-slate-700 space-y-0.5">
                            <div className="text-[9px] font-black uppercase text-[#F36C21] tracking-wider">
                              📖2. Scheduled Topic
                            </div>
                            <p className="text-[11px] font-bold text-[#11141A] dark:text-white leading-snug">
                              {slot.topic || 'Curriculum Module / Lesson'}
                            </p>
                          </div>

                          {/* Scheduled Sub Topics & Competencies */}
                          <div className="p-2 rounded-xl bg-[#F7F8FA] dark:bg-slate-800/70 border border-[#E5E8ED] dark:border-slate-700 space-y-1">
                            <div className="text-[9px] font-black uppercase text-[#475467] dark:text-indigo-200 tracking-wider flex items-center justify-between">
                              <span>🎯3. SUB TOPICS</span>
                              {compList.length > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full bg-[#F36C21] text-white text-[8.5px] font-mono font-bold">
                                  {compList.length}
                                </span>
                              )}
                            </div>

                            {compList.length > 0 ? (
                              <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                                {compList.map((c, i) => (
                                  <div key={i} className="p-1 px-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] flex items-start gap-1.5">
                                    <span className="shrink-0 px-1 py-0.2 rounded bg-[#5B4BFF] text-white font-mono font-bold text-[9px]">
                                      {c.code}
                                    </span>
                                    <p className="text-slate-700 dark:text-slate-300 text-[9.5px] leading-tight font-medium self-center">{c.description}</p>
                                  </div>
                                ))}
                              </div>
                            ) : slot.sub_topics ? (
                              <p className="text-[10px] text-slate-700 dark:text-slate-300 font-medium">
                                {slot.sub_topics}
                              </p>
                            ) : displayCompCodes ? (
                              <p className="font-mono font-black text-slate-800 dark:text-slate-200 text-[10px]">{displayCompCodes}</p>
                            ) : (
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 italic font-medium">
                                Sub topics: Scheduled per curriculum syllabus
                              </p>
                            )}
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
