'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

interface ScheduleItem {
  id: string;
  time: string;
  subject: string;
  type: string;
  room: string;
  faculty: string;
  topic: string;
  status: 'UPCOMING' | 'COMPLETED' | 'LIVE';
}

export default function StudentSchedulePage() {
  const [scheduleDate, setScheduleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState<string>('ALL');

  const sampleSchedule: ScheduleItem[] = [
    {
      id: '1',
      time: '09:00 AM - 10:00 AM',
      subject: 'Systemic Pathology (PATH301)',
      type: 'LECTURE',
      room: 'Lecture Hall 1',
      faculty: 'Dr. Sarah Sharma',
      topic: 'Hematopathology & Anemia Classification',
      status: 'COMPLETED',
    },
    {
      id: '2',
      time: '10:00 AM - 12:00 PM',
      subject: 'General Surgery & Skills (SURG302)',
      type: 'PRACTICAL',
      room: 'Surgical Skills Lab A',
      faculty: 'Dr. Sarah Sharma',
      topic: 'Surgical Knotting & Basic Aseptic Technique',
      status: 'LIVE',
    },
    {
      id: '3',
      time: '01:00 PM - 02:30 PM',
      subject: 'Pediatrics OPD Rotation (PED303)',
      type: 'CLINICAL',
      room: 'Pediatric OPD Ward 2B',
      faculty: 'Dr. Rajesh Gupta',
      topic: 'Growth Monitoring & Milestone Assessment',
      status: 'UPCOMING',
    },
    {
      id: '4',
      time: '03:00 PM - 04:00 PM',
      subject: 'General Medicine Case Discussion (MED304)',
      type: 'SEMINAR',
      room: 'Seminar Hall 3',
      faculty: 'Dr. Anita Desai',
      topic: 'Hypertension Management Guidelines',
      status: 'UPCOMING',
    },
  ];

  const filteredSchedule = sampleSchedule.filter(item => {
    if (filterType === 'ALL') return true;
    return item.type === filterType;
  });

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 transition-colors">
      <Sidebar role="student" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Student Academic Portal — Schedule" />
        <main className="p-6 space-y-6 flex-1">
          {/* Header Controls */}
          <div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-white tracking-tight uppercase">Daily Academic Schedule</h2>
              <p className="text-xs text-slate-400">View timeline of scheduled lectures, clinical rotations & practicals</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Session Types</option>
                <option value="LECTURE">Lectures</option>
                <option value="PRACTICAL">Practicals</option>
                <option value="CLINICAL">Clinical Rotations</option>
                <option value="SEMINAR">Seminars</option>
              </select>
            </div>
          </div>

          {/* Timeline View */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Schedule Timeline ({scheduleDate})
            </h3>

            <div className="relative pl-6 space-y-6 border-l-2 border-slate-800">
              {filteredSchedule.map((item) => (
                <div key={item.id} className="relative group">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-[#0F172A] ${
                    item.status === 'LIVE' ? 'bg-emerald-400 animate-ping' :
                    item.status === 'COMPLETED' ? 'bg-slate-600' : 'bg-indigo-500'
                  }`} />
                  <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-[#0F172A] ${
                    item.status === 'LIVE' ? 'bg-emerald-500' :
                    item.status === 'COMPLETED' ? 'bg-slate-600' : 'bg-indigo-500'
                  }`} />

                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-indigo-400 font-bold">{item.time}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                        item.status === 'LIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        item.status === 'COMPLETED' ? 'bg-slate-800 text-slate-400 border-slate-700' :
                        'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}>
                        {item.status === 'LIVE' ? '🔴 LIVE NOW' : item.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-white">{item.subject}</h4>
                    <p className="text-xs text-slate-300">📖 Topic: <span className="text-indigo-300 font-medium">{item.topic}</span></p>

                    <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80">
                      <span>🏫 {item.room}</span>
                      <span>👨‍🏫 {item.faculty}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
