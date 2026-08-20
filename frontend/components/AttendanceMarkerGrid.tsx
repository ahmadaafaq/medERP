'use client';
import { useState } from 'react';

interface StudentItem {
  id: string;
  rollno: string;
  name: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
}

export default function AttendanceMarkerGrid() {
  const [students, setStudents] = useState<StudentItem[]>([
    { id: '1', rollno: '2500141790053', name: 'Tanish Pandey', status: 'PRESENT' },
    { id: '2', rollno: '2500141790009', name: 'Aafreen Khan', status: 'PRESENT' },
    { id: '3', rollno: '2500141790050', name: 'Shivansh Mishra', status: 'ABSENT' },
    { id: '4', rollno: '2500141790022', name: 'Divyansh Patel', status: 'PRESENT' },
    { id: '5', rollno: '2500141790040', name: 'Prashant Sharma', status: 'LATE' },
  ]);

  const toggleStatus = (id: string, nextStatus: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status: nextStatus } : s));
  };

  const markAll = (status: 'PRESENT' | 'ABSENT') => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-black text-[#1B1E28] dark:text-white uppercase tracking-tight">
            Interactive Classroom Attendance Marker
          </h3>
          <p className="text-xs text-[#4E5969] dark:text-slate-400">
            Subject: Database Management Systems (BCA-301) | Batch: BCA 2025 (Section A)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => markAll('PRESENT')}
            className="px-3.5 py-1.5 rounded-xl bg-[#00C48C]/15 text-[#00C48C] hover:bg-[#00C48C] hover:text-white text-xs font-bold transition-all cursor-pointer"
          >
            Mark All Present
          </button>
          <button
            onClick={() => markAll('ABSENT')}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 text-rose-500 hover:bg-rose-500 hover:text-white text-xs font-bold transition-all cursor-pointer"
          >
            Mark All Absent
          </button>
        </div>
      </div>

      <div className="divide-y divide-[#E7EAF3] dark:divide-slate-800 text-xs">
        {students.map((student) => (
          <div key={student.id} className="py-3 flex items-center justify-between hover:bg-[#F6F8FC] dark:hover:bg-slate-800/40 px-2 rounded-xl transition">
            <div>
              <p className="font-bold text-[#1B1E28] dark:text-white">{student.name}</p>
              <p className="text-[#4E5969] dark:text-slate-400 font-mono text-[11px]">Roll: {student.rollno}</p>
            </div>
            <div className="flex gap-1.5">
              {(['PRESENT', 'ABSENT', 'LATE'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => toggleStatus(student.id, st)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    student.status === st
                      ? st === 'PRESENT'
                        ? 'bg-[#00C48C] text-white shadow-sm'
                        : st === 'ABSENT'
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'bg-amber-500 text-white shadow-sm'
                      : 'bg-[#F1F4F9] dark:bg-slate-800 text-[#4E5969] dark:text-slate-400 hover:text-[#1B1E28] dark:hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
