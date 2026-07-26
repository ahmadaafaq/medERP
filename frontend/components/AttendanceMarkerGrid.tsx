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
    { id: '1', rollno: 'MBBS2023045', name: 'Rahul Verma', status: 'PRESENT' },
    { id: '2', rollno: 'MBBS2023012', name: 'Ananya Roy', status: 'PRESENT' },
    { id: '3', rollno: 'MBBS2023088', name: 'Vikram Singh', status: 'ABSENT' },
    { id: '4', rollno: 'MBBS2023091', name: 'Priya Sharma', status: 'PRESENT' },
    { id: '5', rollno: 'MBBS2023104', name: 'Aman Patel', status: 'LATE' },
  ]);

  const toggleStatus = (id: string, nextStatus: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status: nextStatus } : s));
  };

  const markAll = (status: 'PRESENT' | 'ABSENT') => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-white uppercase tracking-tight">Interactive Attendance Marker</h3>
          <p className="text-xs text-slate-400">Subject: Systemic Pathology (PATH301) | Batch: 2023-MBBS</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => markAll('PRESENT')}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/30"
          >
            Mark All Present
          </button>
          <button
            onClick={() => markAll('ABSENT')}
            className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold hover:bg-rose-500/30"
          >
            Mark All Absent
          </button>
        </div>
      </div>

      <div className="divide-y divide-slate-800 text-xs">
        {students.map((student) => (
          <div key={student.id} className="py-3 flex items-center justify-between">
            <div>
              <p className="font-bold text-white">{student.name}</p>
              <p className="text-slate-400">Roll: {student.rollno}</p>
            </div>
            <div className="flex gap-1.5">
              {(['PRESENT', 'ABSENT', 'LATE'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => toggleStatus(student.id, st)}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    student.status === st
                      ? st === 'PRESENT'
                        ? 'bg-emerald-600 text-white shadow'
                        : st === 'ABSENT'
                        ? 'bg-rose-600 text-white shadow'
                        : 'bg-amber-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
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
