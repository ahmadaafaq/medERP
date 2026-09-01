'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Award, Flame, Star, FolderGit2, Rocket, Sparkles } from 'lucide-react';

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
  examName?: string;
  projectGrade: string;
  projectScorePct: number;
  projectTitle?: string;
  isIncubationSelected: boolean;
  incubationStatus?: string;
  fundingAmount?: number;
  hasMiniProject?: boolean;
  miniProjectsCovered?: number;
  miniProjectTitle?: string;
  miniProjectStatus?: string;
  miniProjectGrade?: string;
  miniProjectScore?: number;
  miniProjectProgress?: string;
  isChatActive: boolean;
  compositeScore: number;
  tier: string;
  tierColor: string;
  hustleTag: string;
}

export default function FacultyTopperHustleBoard() {
  const [filterMode, setFilterMode] = useState<'all' | 'incubation' | 'project' | 'mini_project'>('all');
  const [students, setStudents] = useState<TopperStudent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const fetchToppers = async () => {
      setLoading(true);
      try {
        const slug = typeof window !== 'undefined'
          ? (localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || '').replace(/^tenant_/, '').replace(/^tenant-/, '')
          : '';
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
        const headers: Record<string, string> = {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(slug ? { 'x-tenant-slug': slug, 'x-tenant': slug } : {}),
        };

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/student-master/hustle-board${slug ? `?tenant=${slug}` : ''}`, { headers }).catch(() => null);
        if (res && res.ok) {
          const json = await res.json();
          const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
          const seen = new Set<string>();
          const uniqueToppers: TopperStudent[] = [];
          for (const s of list) {
            const key = s.rollNo || s.regNo || s.id || s.name;
            if (!seen.has(key)) {
              seen.add(key);
              uniqueToppers.push(s);
            }
          }
          // Re-rank 1..N
          setStudents(uniqueToppers.map((s, idx) => ({ ...s, rank: idx + 1 })));
        } else {
          // Fallback mock roster
          setStudents([
            {
              rank: 1,
              id: '1',
              name: 'Aayush Sharma',
              regNo: '20220101',
              rollNo: '22CS01',
              course: 'B.Tech CSE',
              batch: '2022-26',
              photoUrl: '',
              attendancePct: 94.5,
              theoryScore: 92.0,
              examName: 'Mid-Sem 2026',
              projectGrade: 'A+',
              projectScorePct: 98,
              projectTitle: 'AI Drone Autonomous Navigation',
              isIncubationSelected: true,
              incubationStatus: 'Selected',
              fundingAmount: 50000,
              hasMiniProject: true,
              miniProjectsCovered: 3,
              miniProjectTitle: 'Edge Computing Gateway',
              miniProjectStatus: 'Submitted',
              miniProjectGrade: 'A+',
              miniProjectScore: 95,
              miniProjectProgress: '3 / 3 Completed',
              isChatActive: true,
              compositeScore: 96.8,
              tier: 'Diamond Hustler',
              tierColor: 'from-amber-400 to-orange-500',
              hustleTag: '🔥 Incubation Winner',
            },
            {
              rank: 2,
              id: '2',
              name: 'Priya Verma',
              regNo: '20220102',
              rollNo: '22CS02',
              course: 'B.Tech CSE',
              batch: '2022-26',
              photoUrl: '',
              attendancePct: 91.0,
              theoryScore: 89.5,
              examName: 'Mid-Sem 2026',
              projectGrade: 'A',
              projectScorePct: 92,
              projectTitle: 'Real-Time Medical IoT Monitor',
              isIncubationSelected: true,
              incubationStatus: 'Funded',
              fundingAmount: 35000,
              hasMiniProject: true,
              miniProjectsCovered: 2,
              miniProjectTitle: 'Smart Pulse Sensor Board',
              miniProjectStatus: 'In Review',
              miniProjectGrade: 'A',
              miniProjectScore: 90,
              miniProjectProgress: '2 / 3 Completed',
              isChatActive: true,
              compositeScore: 92.4,
              tier: 'Platinum Star',
              tierColor: 'from-blue-500 to-indigo-600',
              hustleTag: '🚀 Funded Startup',
            },
            {
              rank: 3,
              id: '3',
              name: 'Rahul Mishra',
              regNo: '20220103',
              rollNo: '22CS03',
              course: 'B.Tech IT',
              batch: '2022-26',
              photoUrl: '',
              attendancePct: 88.5,
              theoryScore: 86.0,
              examName: 'Mid-Sem 2026',
              projectGrade: 'A',
              projectScorePct: 88,
              projectTitle: 'Smart Campus QR Access Control',
              isIncubationSelected: false,
              incubationStatus: 'Under Review',
              hasMiniProject: true,
              miniProjectsCovered: 2,
              miniProjectTitle: 'BLE Beacon Linker',
              miniProjectStatus: 'Submitted',
              miniProjectGrade: 'A',
              miniProjectScore: 88,
              miniProjectProgress: '2 / 3 Completed',
              isChatActive: false,
              compositeScore: 87.5,
              tier: 'Gold Achiever',
              tierColor: 'from-emerald-400 to-teal-600',
              hustleTag: '⚡ Top Project Submitter',
            },
          ]);
        }
      } catch (e) {
        console.error('Failed to load hustle board:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchToppers();
  }, []);

  const filteredStudents = students.filter((st) => {
    if (filterMode === 'incubation') return st.isIncubationSelected || (st.incubationStatus && st.incubationStatus !== 'Under Review');
    if (filterMode === 'project') return st.projectScorePct > 80;
    if (filterMode === 'mini_project') return st.hasMiniProject;
    return true;
  });

  const totalPages = Math.ceil(filteredStudents.length / PAGE_SIZE) || 1;
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="bg-white dark:bg-slate-900/90 rounded-2.5xl p-4 sm:p-5 border border-[#E7EAF3] dark:border-slate-800 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header with Title and Responsive Filter Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-[#E7EAF3] dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#F36C21] via-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0 border border-orange-400/30">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-[#1E293B] dark:text-white tracking-tight truncate">
                Campus Hustle & Topper Leaderboard
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
                <Sparkles className="w-2.5 h-2.5" /> LIVE
              </span>
            </div>
            <p className="text-xs text-[#64748B] dark:text-slate-400 font-medium truncate">
              Ranked by Theory, Practical Labs, Mini-Projects, Incubation & Attendance
            </p>
          </div>
        </div>

        {/* Filter Pills with Horizontal Scroll on Narrow Viewports */}
        <div className="flex items-center gap-1 bg-[#F6F8FC] dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold overflow-x-auto max-w-full shrink-0">
          <button
            onClick={() => { setFilterMode('all'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              filterMode === 'all'
                ? 'bg-white dark:bg-slate-700 text-[#5B4BFF] dark:text-white shadow-xs font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Star Toppers
          </button>
          <button
            onClick={() => { setFilterMode('incubation'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
              filterMode === 'incubation'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-300 shadow-xs font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Rocket className="w-3.5 h-3.5 text-amber-500" /> Incubation
          </button>
          <button
            onClick={() => { setFilterMode('project'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
              filterMode === 'project'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5 text-indigo-500" /> High Capstone
          </button>
          <button
            onClick={() => { setFilterMode('mini_project'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
              filterMode === 'mini_project'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-xs font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-emerald-500" /> Mini-Projects
          </button>
        </div>
      </div>

      {/* Leaderboard Grid / List */}
      <div className="flex-1 overflow-y-auto min-h-0 py-3 space-y-2.5 custom-scrollbar pr-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
            <div className="w-8 h-8 rounded-full border-2 border-[#5B4BFF] border-t-transparent animate-spin" />
            <span className="text-xs font-bold">Aggregating Campus Hustle Scores...</span>
          </div>
        ) : paginatedStudents.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs font-bold">
            No students found matching this criteria.
          </div>
        ) : (
          paginatedStudents.map((st) => {
            const isTop3 = st.rank <= 3;
            const rankBadgeColor =
              st.rank === 1
                ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 shadow-amber-500/30'
                : st.rank === 2
                ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-950 shadow-slate-400/20'
                : st.rank === 3
                ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-amber-800/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700';

            return (
              <div
                key={st.id || st.regNo}
                className={`p-4 rounded-2xl border transition-all duration-200 hover:shadow-md space-y-3 ${
                  isTop3
                    ? 'bg-gradient-to-r from-amber-500/5 via-white to-orange-500/5 dark:from-amber-950/20 dark:via-slate-900 dark:to-orange-950/20 border-amber-300/60 dark:border-amber-700/50 shadow-xs'
                    : 'bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                {/* SECTION 1: TOP ROW (Rank + Avatar + Name & Program + Composite Score) */}
                <div className="flex items-center justify-between gap-3 min-w-0">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Rank Badge */}
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${rankBadgeColor}`}
                    >
                      {st.rank === 1 ? '🥇' : st.rank === 2 ? '🥈' : st.rank === 3 ? '🥉' : `#${st.rank}`}
                    </div>

                    {/* Student Avatar */}
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center text-xs font-black text-[#5B4BFF] shrink-0 shadow-xs">
                      {st.photoUrl ? (
                        <img
                          src={st.photoUrl}
                          alt={st.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        st.name
                          ? st.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()
                          : 'ST'
                      )}
                    </div>

                    {/* Student Name, Roll No & Program */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                          {st.name || 'Student Scholar'}
                        </h4>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-bold text-[10px] shrink-0 border border-slate-200/60 dark:border-slate-700/60">
                          {st.rollNo || st.regNo}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {st.course} <span className="text-slate-300 dark:text-slate-700">•</span> {st.batch}
                      </p>
                    </div>
                  </div>

                  {/* Composite Score Pill */}
                  <div className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-br from-[#F36C21]/15 via-orange-500/10 to-amber-500/15 border border-[#F36C21]/30 text-center shrink-0">
                    <span className="block text-[8px] uppercase font-black tracking-wider text-[#F36C21]">Composite</span>
                    <span className="text-base sm:text-lg font-black text-[#F36C21] tracking-tight leading-none">
                      {st.compositeScore || (st.attendancePct * 0.4 + (st.theoryScore || 80) * 0.6).toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* SECTION 2: MIDDLE ROW (Hustle Tag / Achievement Badge if present) */}
                {st.hustleTag && (
                  <div className="pt-0.5">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-extrabold border border-amber-500/20 inline-flex items-center gap-1.5">
                      {st.hustleTag}
                    </span>
                  </div>
                )}

                {/* SECTION 3: BOTTOM ROW (Performance Chips Grid) */}
                <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] font-bold">
                  {/* Attendance */}
                  <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-center flex-1 min-w-[90px]">
                    <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-extrabold">Attendance</span>
                    <span className={`font-black text-xs ${st.attendancePct >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                      {st.attendancePct || 0}%
                    </span>
                  </div>

                  {/* Capstone Project */}
                  {st.projectScorePct > 0 && (
                    <div className="px-3 py-1.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40 text-center flex-1 min-w-[110px]">
                      <span className="block text-[8px] uppercase tracking-wider text-indigo-500 dark:text-indigo-400 font-extrabold">Capstone Project</span>
                      <span className="font-black text-xs text-[#5B4BFF] dark:text-indigo-300">
                        {st.projectScorePct}% {st.projectGrade ? `(${st.projectGrade})` : ''}
                      </span>
                    </div>
                  )}

                  {/* Mini Projects */}
                  {st.hasMiniProject && (
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-center flex-1 min-w-[100px]">
                      <span className="block text-[8px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-extrabold">Mini-Projects</span>
                      <span className="font-black text-xs text-emerald-700 dark:text-emerald-300">
                        {st.miniProjectsCovered || 1} Done
                      </span>
                    </div>
                  )}

                  {/* Incubation */}
                  {st.isIncubationSelected && (
                    <div className="px-3 py-1.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 text-center flex-1 min-w-[100px]">
                      <span className="block text-[8px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-extrabold">Incubation</span>
                      <span className="font-black text-xs text-amber-700 dark:text-amber-300">
                        {st.fundingAmount ? `₹${(st.fundingAmount / 1000).toFixed(0)}k Grant` : st.incubationStatus || 'Selected'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 shrink-0">
          <span>
            Showing {(currentPage - 1) * PAGE_SIZE + 1} to {Math.min(currentPage * PAGE_SIZE, filteredStudents.length)} of {filteredStudents.length} Toppers
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold disabled:opacity-40 transition-all"
            >
              Previous
            </button>
            <span className="px-2 py-1 text-slate-900 dark:text-white font-black">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold disabled:opacity-40 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}

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
