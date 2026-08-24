'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BarChart3, Users, AlertTriangle, CheckCircle2, ChevronDown, Download, Sparkles } from 'lucide-react';

interface SubjectAttendance {
  id: string;
  name: string;
  code: string;
  lecturesConducted: number;
  avgAttendance: number;
  facultyName: string;
  facultyDesignation: string;
  facultyEmpId: string;
  trend: 'up' | 'down' | 'stable';
}

const BATCH_DATA: Record<string, {
  batchName: string;
  courseName: string;
  semester: string;
  totalStudents: number;
  classAverage: number;
  goodAttendanceCount: number;
  moderateCount: number;
  defaulterCount: number;
  subjects: SubjectAttendance[];
}> = {
  'bca-2025': {
    batchName: 'Batch 2025',
    courseName: 'BCA (Bachelor of Computer Applications)',
    semester: 'Semester 3',
    totalStudents: 64,
    classAverage: 74.2,
    goodAttendanceCount: 46,
    moderateCount: 12,
    defaulterCount: 6,
    subjects: [
      {
        id: '1',
        name: 'Web Technology & Front End Development',
        code: '88534',
        lecturesConducted: 24,
        avgAttendance: 85.0,
        facultyName: 'Vinay Kumar',
        facultyDesignation: 'Assistant Professor',
        facultyEmpId: '202616658',
        trend: 'up',
      },
      {
        id: '2',
        name: 'Computer Organization & Architecture',
        code: '88535',
        lecturesConducted: 21,
        avgAttendance: 78.1,
        facultyName: 'Dr. Anuj Kumar',
        facultyDesignation: 'Professor & HOD',
        facultyEmpId: 'CET-FAC-002',
        trend: 'stable',
      },
      {
        id: '3',
        name: 'Database Management Systems',
        code: 'BCA-301',
        lecturesConducted: 22,
        avgAttendance: 81.2,
        facultyName: 'Dr. Shobhit Kumar',
        facultyDesignation: 'Associate Professor',
        facultyEmpId: '202112189',
        trend: 'up',
      },
      {
        id: '4',
        name: 'Object Oriented Programming in C++',
        code: '88532',
        lecturesConducted: 20,
        avgAttendance: 76.5,
        facultyName: 'Deepak Batra',
        facultyDesignation: 'Assistant Professor',
        facultyEmpId: '202112380',
        trend: 'stable',
      },
      {
        id: '5',
        name: 'Business Communication & Soft Skills',
        code: '88533',
        lecturesConducted: 18,
        avgAttendance: 72.8,
        facultyName: 'Shaista Qamar Zaidi',
        facultyDesignation: 'TDP In-Charge',
        facultyEmpId: '202414767',
        trend: 'down',
      },
      {
        id: '6',
        name: 'Operating System Internals',
        code: '88537',
        lecturesConducted: 19,
        avgAttendance: 69.4,
        facultyName: 'Ahsan Ahmad',
        facultyDesignation: 'Assistant Professor',
        facultyEmpId: '202111769',
        trend: 'down',
      },
      {
        id: '7',
        name: 'Python Programming',
        code: '88550',
        lecturesConducted: 22,
        avgAttendance: 82.0,
        facultyName: 'Mohd Danish Chishti',
        facultyDesignation: 'Associate Professor',
        facultyEmpId: '201910026',
        trend: 'up',
      },
      {
        id: '8',
        name: 'Universal Human Values and Professional Ethics',
        code: '88536',
        lecturesConducted: 16,
        avgAttendance: 74.0,
        facultyName: 'Uma Pachauri',
        facultyDesignation: 'Assistant Professor',
        facultyEmpId: '202112271',
        trend: 'stable',
      },
    ],
  },
  'btech-cse-2025': {
    batchName: 'Batch 2025',
    courseName: 'B.Tech CSE (Computer Science & Engg)',
    semester: 'Semester 3',
    totalStudents: 120,
    classAverage: 82.1,
    goodAttendanceCount: 96,
    moderateCount: 18,
    defaulterCount: 6,
    subjects: [
      {
        id: '1',
        name: 'Computer Organization & Architecture',
        code: 'KCS-302',
        lecturesConducted: 26,
        avgAttendance: 84.5,
        facultyName: 'Dr. Prabhakar Gupta',
        facultyDesignation: 'Professor & Dean Academics',
        facultyEmpId: 'CET-FAC-001',
        trend: 'up',
      },
      {
        id: '2',
        name: 'Data Structures & Algorithms',
        code: 'KCS-301',
        lecturesConducted: 28,
        avgAttendance: 88.2,
        facultyName: 'Dr. Anuj Kumar',
        facultyDesignation: 'Professor & HOD',
        facultyEmpId: 'CET-FAC-002',
        trend: 'up',
      },
      {
        id: '3',
        name: 'Discrete Structures & Theory of Logic',
        code: 'KCS-303',
        lecturesConducted: 24,
        avgAttendance: 78.0,
        facultyName: 'Rajesh Kumar',
        facultyDesignation: 'Associate Professor',
        facultyEmpId: '202112146',
        trend: 'stable',
      },
      {
        id: '4',
        name: 'Universal Human Values and Professional Ethics',
        code: 'KVE-301',
        lecturesConducted: 18,
        avgAttendance: 76.5,
        facultyName: 'Uma Pachauri',
        facultyDesignation: 'Assistant Professor',
        facultyEmpId: '202112271',
        trend: 'stable',
      },
    ],
  },
};

export default function FacultyBatchAttendanceAnalytics() {
  const [selectedBatchKey, setSelectedBatchKey] = useState<string>('bca-2025');
  const [filterView, setFilterView] = useState<'all' | 'critical'>('all');

  const activeBatch = BATCH_DATA[selectedBatchKey] || BATCH_DATA['bca-2025'];
  const subjectsToDisplay = filterView === 'critical'
    ? activeBatch.subjects.filter((s) => s.avgAttendance < 75)
    : activeBatch.subjects;

  return (
    <div className="h-full flex flex-col justify-between bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft hover:shadow-md transition-all">
      {/* Header & Batch Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E7EAF3] dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#5B4BFF] to-[#7867FF] flex items-center justify-center text-white text-lg shadow-md shadow-indigo-500/20 shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-[#F36C21] uppercase tracking-wide font-sans">
                CLASS ATTENDANCE ANALYTICS
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#00C48C] text-[10px] font-black border border-emerald-200 dark:border-emerald-800">
                ● Live Database Sync
              </span>
            </div>
            <p className="text-[11px] text-[#4E5969] dark:text-slate-400 font-semibold mt-0.5">
              Current cohort attendance trends & faculty subject lecture ledger
            </p>
          </div>
        </div>

        {/* Batch Picker Dropdown */}
        <div className="relative shrink-0">
          <select
            value={selectedBatchKey}
            onChange={(e) => setSelectedBatchKey(e.target.value)}
            aria-label="Select Batch and Course for Attendance Analytics"
            className="w-full sm:w-auto appearance-none bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-slate-800 dark:text-slate-100 font-extrabold text-xs py-2 pl-3.5 pr-8 rounded-xl cursor-pointer hover:border-[#5B4BFF] transition-all shadow-xs focus:outline-hidden focus:ring-2 focus:ring-[#5B4BFF]/20"
          >
            <option value="bca-2025">2025 Batch • BCA (Sem 3)</option>
            <option value="btech-cse-2025">2025 Batch • B.Tech CSE (Sem 3)</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Cohort KPI Health Strip */}
      <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
        <div className="p-3 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800/60 border border-[#E7EAF3] dark:border-slate-700/80">
          <p className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400">Class Average</p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-black text-[#5B4BFF] dark:text-indigo-400">
              {activeBatch.classAverage}%
            </span>
            <span className="text-[10px] font-bold text-emerald-600">▲ Active</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/40">
          <p className="text-[10px] font-extrabold uppercase text-emerald-700 dark:text-emerald-300">≥ 75% Criteria</p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-black text-[#00C48C]">
              {activeBatch.goodAttendanceCount}
            </span>
            <span className="text-[10px] font-bold text-slate-500">/ {activeBatch.totalStudents}</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/40">
          <p className="text-[10px] font-extrabold uppercase text-amber-700 dark:text-amber-300">60-74% Moderate</p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-black text-[#FFB020]">
              {activeBatch.moderateCount}
            </span>
            <span className="text-[10px] font-bold text-amber-700">Notice sent</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/50 dark:border-rose-800/40">
          <p className="text-[10px] font-extrabold uppercase text-rose-700 dark:text-rose-300">&lt; 60% Defaulters</p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-black text-[#F04438]">
              {activeBatch.defaulterCount}
            </span>
            <span className="text-[10px] font-bold text-rose-600">Urgent action</span>
          </div>
        </div>
      </div>

      {/* Target Benchmark Reference Indicator */}
      <div className="mt-3.5 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00C48C]" />
          <span className="font-bold text-slate-700 dark:text-slate-300">
            University Exam Eligibility Threshold: <strong className="text-[#5B4BFF]">75.0%</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterView(filterView === 'all' ? 'critical' : 'all')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-black transition-all cursor-pointer ${
              filterView === 'critical'
                ? 'bg-rose-500 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300'
            }`}
          >
            {filterView === 'critical' ? 'Show All Subjects' : 'Filter Below 75%'}
          </button>
        </div>
      </div>

      {/* Subject-Wise Attendance Visual Bars with Subjective Faculty Names */}
      <div className="flex-1 pt-3.5 space-y-2.5 flex flex-col justify-start">
        {subjectsToDisplay.map((sub) => {
          const isBelowThreshold = sub.avgAttendance < 75;
          const isCritical = sub.avgAttendance < 65;

          return (
            <div
              key={sub.id}
              className="p-3 rounded-2xl bg-[#F6F8FC]/60 dark:bg-slate-800/40 border border-[#E7EAF3] dark:border-slate-800 hover:border-[#5B4BFF]/40 hover:bg-white dark:hover:bg-slate-800 transition-all space-y-1.5 shadow-xs group"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs text-[#1B1E28] dark:text-white truncate group-hover:text-[#5B4BFF] transition-colors">
                      {sub.name}
                    </span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      Code: #{sub.code}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#4E5969] dark:text-slate-400 font-semibold mt-0.5">
                    👨‍🏫 <strong className="text-slate-700 dark:text-slate-200">{sub.facultyName}</strong> ({sub.facultyDesignation} • #{sub.facultyEmpId}) • {sub.lecturesConducted} Sessions
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-sm font-black ${
                      isCritical
                        ? 'text-[#F04438]'
                        : isBelowThreshold
                        ? 'text-[#FFB020]'
                        : 'text-[#00C48C]'
                    }`}
                  >
                    {sub.avgAttendance}%
                  </span>
                  <span className="text-[9px] block font-bold text-slate-400">
                    {isBelowThreshold ? 'Below Target' : 'Compliant'}
                  </span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="relative w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700/60 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isCritical
                      ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                      : isBelowThreshold
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                      : 'bg-gradient-to-r from-[#5B4BFF] via-[#7867FF] to-[#00C48C]'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(10, sub.avgAttendance))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="pt-3.5 border-t border-[#E7EAF3] dark:border-slate-800 shrink-0 mt-auto flex items-center justify-between text-xs font-bold text-[#4E5969] dark:text-slate-400">
        <div className="flex items-center gap-1.5 text-[11px]">
          <span>📊 {activeBatch.totalStudents} Registered Students in {activeBatch.batchName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/faculty/attendance"
            className="text-[#5B4BFF] hover:underline font-extrabold flex items-center gap-1"
          >
            <span>Mark Daily Attendance</span>
            <span>➔</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
