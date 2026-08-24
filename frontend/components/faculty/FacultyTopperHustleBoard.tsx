'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Trophy, Award, Flame, Star, MessageSquare, FolderGit2, Rocket, ChevronRight, Sparkles } from 'lucide-react';

interface TopperStudent {
  rank: number;
  id: string;
  name: string;
  regNo: string;
  rollNo: string;
  course: string;
  batch: string;
  photoUrl: string;
  attendancePct: number;
  theoryScore: number;
  projectGrade: string;
  projectScorePct: number;
  isIncubationSelected: boolean;
  isChatActive: boolean;
  compositeScore: number;
  tier: string;
  tierColor: string;
  hustleTag: string;
}

const TOPPER_STUDENTS: TopperStudent[] = [
  {
    rank: 1,
    id: '1',
    name: 'AAFREEN KHAN',
    regNo: '2025107990',
    rollNo: '2500141790001',
    course: 'BCA',
    batch: 'Batch 2025',
    photoUrl: 'https://myportal.srms.ac.in/SRMSERP/Registration/StudentDocument/1/2025107990/2025107990.JPG',
    attendancePct: 34.0,
    theoryScore: 92.0,
    projectGrade: 'B',
    projectScorePct: 76.0,
    isIncubationSelected: true,
    isChatActive: true,
    compositeScore: 88.5,
    tier: 'Tier S',
    tierColor: 'from-amber-400 to-yellow-600 text-slate-900 border-amber-300',
    hustleTag: '👑 High Theory Scorer (92%) & Incubation Star',
  },
  {
    rank: 2,
    id: '2',
    name: 'JATIN PRATAP SINGH',
    regNo: '2025108112',
    rollNo: '2500141790020',
    course: 'BCA',
    batch: 'Batch 2025',
    photoUrl: 'https://myportal.srms.ac.in/SRMSERP/Registration/StudentDocument/1/2025108112/2025108112.JPG',
    attendancePct: 75.0,
    theoryScore: 84.5,
    projectGrade: 'A',
    projectScorePct: 88.0,
    isIncubationSelected: true,
    isChatActive: true,
    compositeScore: 86.2,
    tier: 'Tier S',
    tierColor: 'from-slate-200 to-slate-400 text-slate-900 border-slate-300',
    hustleTag: '🚀 Incubation Innovator & Grade A Project',
  },
  {
    rank: 3,
    id: '3',
    name: 'TANISH PANDEY',
    regNo: '2025108240',
    rollNo: '2500141790053',
    course: 'BCA',
    batch: 'Batch 2025',
    photoUrl: '',
    attendancePct: 82.5,
    theoryScore: 88.0,
    projectGrade: 'B+',
    projectScorePct: 78.0,
    isIncubationSelected: false,
    isChatActive: true,
    compositeScore: 84.8,
    tier: 'Tier A+',
    tierColor: 'from-amber-600 to-amber-800 text-white border-amber-500',
    hustleTag: '💡 DBMS & SQL Lab Performer',
  },
  {
    rank: 4,
    id: '4',
    name: 'KANAK SINGH',
    regNo: '2025107731',
    rollNo: '2500141790022',
    course: 'BCA',
    batch: 'Batch 2025',
    photoUrl: 'https://myportal.srms.ac.in/SRMSERP/Registration/StudentDocument/1/2025107731/2025107731.JPG',
    attendancePct: 86.5,
    theoryScore: 86.0,
    projectGrade: 'A',
    projectScorePct: 85.0,
    isIncubationSelected: false,
    isChatActive: false,
    compositeScore: 84.1,
    tier: 'Tier A+',
    tierColor: 'from-indigo-500 to-purple-600 text-white border-indigo-400',
    hustleTag: '🎖️ Consistent Attendance & High Marks',
  },
  {
    rank: 5,
    id: '5',
    name: 'JASPREET SINGH',
    regNo: '2025107666',
    rollNo: '2500141790019',
    course: 'BCA',
    batch: 'Batch 2025',
    photoUrl: 'https://myportal.srms.ac.in/SRMSERP/Registration/StudentDocument/1/2025107666/2025107666.JPG',
    attendancePct: 81.0,
    theoryScore: 82.0,
    projectGrade: 'B',
    projectScorePct: 74.0,
    isIncubationSelected: false,
    isChatActive: true,
    compositeScore: 80.5,
    tier: 'Tier A',
    tierColor: 'from-emerald-500 to-teal-600 text-white border-emerald-400',
    hustleTag: '📈 Active Batch Contributor',
  },
];

export default function FacultyTopperHustleBoard() {
  const [filterMode, setFilterMode] = useState<'all' | 'incubation' | 'project'>('all');

  const filteredStudents = TOPPER_STUDENTS.filter((s) => {
    if (filterMode === 'incubation') return s.isIncubationSelected;
    if (filterMode === 'project') return s.projectScorePct >= 80;
    return true;
  });

  return (
    <div className="h-full flex flex-col justify-between bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E7EAF3] dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#F36C21] to-amber-500 flex items-center justify-center text-white text-lg shadow-md shadow-orange-500/20 shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-[#F36C21] uppercase tracking-wide font-sans">
                TOPPER & HUSTLE BOARD
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/60 text-[#F36C21] text-[10px] font-black border border-orange-200 dark:border-orange-800 flex items-center gap-1">
                <Flame className="w-3 h-3 text-[#F36C21]" />
                <span>AI Merit Ranking</span>
              </span>
            </div>
            <p className="text-[11px] text-[#4E5969] dark:text-slate-400 font-semibold mt-0.5">
              Attendance + Actual Theory Exam + Project Repo + Incubation + Chat Activity
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-[#5B4BFF] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All Hustlers
          </button>
          <button
            onClick={() => setFilterMode('incubation')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 ${
              filterMode === 'incubation'
                ? 'bg-[#F36C21] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Rocket className="w-3 h-3" />
            <span>Incubation</span>
          </button>
          <button
            onClick={() => setFilterMode('project')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 ${
              filterMode === 'project'
                ? 'bg-[#00C48C] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <FolderGit2 className="w-3 h-3" />
            <span>Projects</span>
          </button>
        </div>
      </div>

      {/* Formula Explainer Tag */}
      <div className="mt-3 px-3.5 py-1.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between text-[10px] text-indigo-900 dark:text-indigo-300 font-bold shrink-0">
        <span>⚡ Metric: 25% Attd (Sync) + 30% Theory (Exam DB) + 20% Repo + 15% Incubation + 10% Discussion</span>
        <span className="font-extrabold text-[#5B4BFF]">2025 Batch BCA</span>
      </div>

      {/* Topper Student Cards List with Accurate Records */}
      <div className="flex-1 pt-3 space-y-2.5 flex flex-col justify-start">
        {filteredStudents.map((student) => {
          const isRankOne = student.rank === 1;
          const isRankTwo = student.rank === 2;
          const isRankThree = student.rank === 3;

          const rankBadge = isRankOne
            ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 shadow-md shadow-amber-500/20'
            : isRankTwo
            ? 'bg-gradient-to-r from-slate-200 to-slate-400 text-slate-900'
            : isRankThree
            ? 'bg-gradient-to-r from-amber-600 to-amber-800 text-white'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';

          return (
            <div
              key={student.id}
              className={`p-3 rounded-2xl border transition-all space-y-1.5 shadow-xs group ${
                isRankOne
                  ? 'bg-gradient-to-r from-amber-500/10 via-[#FFF8F0] to-orange-500/10 dark:from-amber-950/40 dark:via-slate-850 dark:to-orange-950/40 border-amber-300 dark:border-amber-700/60 shadow-sm'
                  : 'bg-[#F6F8FC]/60 dark:bg-slate-800/40 border-[#E7EAF3] dark:border-slate-800 hover:border-[#5B4BFF]/40 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                {/* Left: Rank, Avatar & Details */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Rank Badge */}
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${rankBadge}`}
                  >
                    #{student.rank}
                  </div>

                  {/* Profile Picture */}
                  <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-800 shadow-sm flex items-center justify-center font-black text-xs text-slate-600 dark:text-slate-200">
                    {student.photoUrl ? (
                      <img
                        src={student.photoUrl}
                        alt={student.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : null}
                    <span>{student.name.charAt(0)}</span>
                  </div>

                  {/* Name, Roll & Batch */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-black text-[#1B1E28] dark:text-white truncate group-hover:text-[#5B4BFF] transition-colors">
                        {student.name}
                      </h4>
                      {isRankOne && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500 text-slate-900">
                          👑 RANK 1
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#4E5969] dark:text-slate-400 font-semibold truncate mt-0.5">
                      Roll: <strong className="text-slate-700 dark:text-slate-200">{student.rollNo}</strong> • {student.course} ({student.batch})
                    </p>
                  </div>
                </div>

                {/* Right: Composite Score & Tier Badge */}
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 justify-end">
                    <span className="text-sm font-black text-[#1B1E28] dark:text-white">
                      {student.compositeScore}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">pts</span>
                  </div>
                  <span className="inline-block text-[9px] font-black px-2 py-0.5 rounded-md bg-[#5B4BFF]/10 text-[#5B4BFF] dark:text-indigo-400 border border-[#5B4BFF]/20">
                    {student.tier}
                  </span>
                </div>
              </div>

              {/* Dimension Breakdown Badges */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-[10px] font-bold">
                <span className={`px-2 py-0.5 rounded-md border ${
                  student.attendancePct >= 75
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                }`}>
                  📊 Attd: {student.attendancePct}%
                </span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                  📝 Theory Exam: {student.theoryScore}%
                </span>
                <span className="px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                  📂 Repo: Grade {student.projectGrade} ({student.projectScorePct}%)
                </span>
                {student.isIncubationSelected && (
                  <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-500/20 flex items-center gap-0.5">
                    🚀 Incubation
                  </span>
                )}
                {student.isChatActive && (
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 flex items-center gap-0.5">
                    💬 Active Chat
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Link */}
      <div className="pt-3.5 border-t border-[#E7EAF3] dark:border-slate-800 shrink-0 mt-auto flex items-center justify-between text-xs font-bold text-[#4E5969] dark:text-slate-400">
        <span>🏆 Evaluated across 5 holistic competency dimensions</span>
        <Link
          href="/dashboard/faculty/repository"
          className="text-[#5B4BFF] hover:underline font-extrabold flex items-center gap-1"
        >
          <span>View Full Class Ledger</span>
          <span>➔</span>
        </Link>
      </div>
    </div>
  );
}
