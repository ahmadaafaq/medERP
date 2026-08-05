'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

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
}

const API_BASE = 'http://localhost:3001/api/v1';

const getTenantSlug = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('tenantSlug') || 'srms-ims';
  }
  return 'srms-ims';
};

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function StudentTimetablePage() {
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() === 0 ? 7 : new Date().getDay());
  const [currentLecture, setCurrentLecture] = useState<TimetableSlot | null>(null);
  const [weeklySlots, setWeeklySlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    setLoading(true);
    const slug = getTenantSlug();
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${API_BASE}/timetable/student-schedule?tenant=${slug}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setWeeklySlots(json.data.weeklySlots || []);
          setCurrentLecture(json.data.currentLecture || null);
          if (json.data.currentDayOfWeek) {
            setSelectedDay(json.data.currentDayOfWeek);
          }
        }
      } else {
        setFallbackSchedule();
      }
    } catch {
      setFallbackSchedule();
    } finally {
      setLoading(false);
    }
  };

  const setFallbackSchedule = () => {
    const sampleSlots: TimetableSlot[] = [
      {
        id: '1', day_of_week: 1, start_time: '09:00:00', end_time: '10:00:00', room: 'Lecture Hall 1',
        slot_type: 'LECTURE', topic: 'Hematopathology & Anemia Types', competency_codes: 'PA-2.1, PA-2.2',
        faculty_name: 'Dr. Sarah Sharma', subject_name: 'Systemic Pathology & Microbiology', subject_code: 'PATH301', batch_code: '2023-MBBS'
      },
      {
        id: '2', day_of_week: 1, start_time: '10:00:00', end_time: '12:00:00', room: 'Skills Lab A',
        slot_type: 'PRACTICAL', topic: 'Surgical Knotting & Asepsis', competency_codes: 'SU-4.1',
        faculty_name: 'Dr. Sarah Sharma', subject_name: 'General Surgery & Skills Lab', subject_code: 'SURG302', batch_code: '2023-MBBS'
      },
      {
        id: '3', day_of_week: 2, start_time: '09:00:00', end_time: '10:00:00', room: 'Lecture Hall 2',
        slot_type: 'LECTURE', topic: 'Neonatal Jaundice & Management', competency_codes: 'PE-1.3',
        faculty_name: 'Dr. Rajesh Gupta', subject_name: 'Pediatrics & Neonatal Care', subject_code: 'PED303', batch_code: '2023-MBBS'
      },
      {
        id: '4', day_of_week: 2, start_time: '11:00:00', end_time: '13:00:00', room: 'Ward 4B',
        slot_type: 'CLINICAL', topic: 'Internal Medicine Ward Rounds', competency_codes: 'IM-3.5',
        faculty_name: 'Dr. Anita Desai', subject_name: 'General Medicine & Clinical Rotation', subject_code: 'MED304', batch_code: '2023-MBBS'
      },
      {
        id: '5', day_of_week: 3, start_time: '09:00:00', end_time: '10:00:00', room: 'Lecture Hall 1',
        slot_type: 'LECTURE', topic: 'Immune System Pathology', competency_codes: 'PA-3.1',
        faculty_name: 'Dr. Sarah Sharma', subject_name: 'Systemic Pathology & Microbiology', subject_code: 'PATH301', batch_code: '2023-MBBS'
      },
      {
        id: '6', day_of_week: 4, start_time: '09:00:00', end_time: '10:00:00', room: 'Lecture Hall 1',
        slot_type: 'LECTURE', topic: 'Acute Abdomen Diagnosis', competency_codes: 'SU-5.2',
        faculty_name: 'Dr. Sarah Sharma', subject_name: 'General Surgery & Skills Lab', subject_code: 'SURG302', batch_code: '2023-MBBS'
      },
      {
        id: '7', day_of_week: 5, start_time: '10:00:00', end_time: '12:00:00', room: 'Pathology Lab B',
        slot_type: 'PRACTICAL', topic: 'Histopathology Slide Examination', competency_codes: 'PA-5.1',
        faculty_name: 'Dr. Sarah Sharma', subject_name: 'Systemic Pathology & Microbiology', subject_code: 'PATH301', batch_code: '2023-MBBS'
      }
    ];
    setWeeklySlots(sampleSlots);
    setCurrentLecture(sampleSlots[0]);
  };

  const filteredSlots = weeklySlots.filter(s => Number(s.day_of_week) === selectedDay);

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 transition-colors">
      <Sidebar role="student" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Student Academic Portal — Time Table" />
        <main className="p-6 space-y-6 flex-1">

          {/* 1. CURRENT / NEXT LECTURE HIGHLIGHT BANNER */}
          <div className="glass-card p-6 space-y-4 border-l-4 border-indigo-500 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] tracking-wider uppercase border border-emerald-500/30 animate-pulse">
                  🔴 CURRENT / NEXT UPCOMING LECTURE
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Today: {DAY_NAMES[(new Date().getDay() === 0 ? 7 : new Date().getDay()) - 1]}
                </span>
              </div>
              <button 
                onClick={fetchSchedule}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
              >
                🔄 Refresh Schedule
              </button>
            </div>

            {currentLecture ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {currentLecture.subject_code || 'MBBS'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {currentLecture.slot_type || 'LECTURE'}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white tracking-tight">
                    {currentLecture.subject_name || 'Academic Lecture'}
                  </h2>
                  <p className="text-sm font-semibold text-slate-300">
                    📖 Topic: <span className="text-indigo-400">{currentLecture.topic || 'Curriculum Module'}</span>
                  </p>
                  {currentLecture.competency_codes && (
                    <p className="text-xs text-slate-400">
                      🎯 Competencies: <span className="font-mono text-purple-300 font-semibold">{currentLecture.competency_codes}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>⏰ Time Slot:</span>
                    <strong className="font-mono text-indigo-400 text-sm">
                      {currentLecture.start_time?.slice(0, 5)} - {currentLecture.end_time?.slice(0, 5)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>🏫 Location / Room:</span>
                    <strong className="text-white">{currentLecture.room || 'Lecture Hall'}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>👨‍🏫 Faculty:</span>
                    <strong className="text-emerald-400">{currentLecture.faculty_name || 'Department Faculty'}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                No active lectures scheduled for right now. Check the weekly schedule below.
              </div>
            )}
          </div>

          {/* 2. UPCOMING WEEKLY SCHEDULE MATRIX */}
          <div className="glass-card p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-white tracking-tight uppercase">
                  📅 Upcoming Weekly Schedule
                </h3>
                <p className="text-xs text-slate-400">Select day of week to view full scheduled classes, halls & competencies</p>
              </div>

              {/* Day Selector Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-900/80 rounded-xl border border-slate-800 text-xs font-semibold">
                {DAY_NAMES.slice(0, 6).map((dayName, idx) => {
                  const dayNum = idx + 1;
                  const isSelected = selectedDay === dayNum;
                  return (
                    <button
                      key={dayName}
                      onClick={() => setSelectedDay(dayNum)}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        isSelected 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      {dayName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Schedule Cards List */}
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs animate-pulse">
                Loading timetable schedule...
              </div>
            ) : filteredSlots.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-800 rounded-xl">
                No classes scheduled for {DAY_NAMES[selectedDay - 1]}. Enjoy your clinical study day!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSlots.map((slot) => (
                  <div key={slot.id} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-3 hover:border-indigo-500/50 transition-all group">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-indigo-400 font-mono border border-slate-700">
                        {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                        slot.slot_type === 'PRACTICAL' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        slot.slot_type === 'CLINICAL' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}>
                        {slot.slot_type || 'LECTURE'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm text-white group-hover:text-indigo-300 transition-colors">
                        {slot.subject_name || 'Medical Subject'}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        📖 <strong className="text-slate-200">{slot.topic || 'Topic not specified'}</strong>
                      </p>
                    </div>

                    {slot.competency_codes && (
                      <div className="text-[10px] text-purple-300 bg-purple-950/40 p-2 rounded-lg border border-purple-900/30">
                        🎯 NMC Competency: <span className="font-mono font-bold">{slot.competency_codes}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>🏫 {slot.room || 'Lecture Hall'}</span>
                      <span className="text-slate-300 font-medium">👨‍🏫 {slot.faculty_name || 'Faculty'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
