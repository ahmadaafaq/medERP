'use client';

import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Rocket, 
  Sparkles, 
  DollarSign, 
  Award, 
  Search, 
  X, 
  ExternalLink, 
  CheckCircle2, 
  Layers, 
  FolderGit2, 
  UserCheck,
  Star,
  Flame,
  ArrowUpRight,
  Filter
} from 'lucide-react';

export interface IncubationItem {
  id: number | string;
  repoId?: number | string;
  isMiniProject?: boolean;
  projectType?: 'MINI_PROJECT' | 'REPOSITORY' | string;
  title: string;
  description: string;
  image?: string;
  screenshots?: string[];
  repoLink?: string;
  techStack?: string[];
  percentage?: number;
  score: number;
  grade: string;
  incubationStatus: 'Under Review' | 'Selected' | 'Funded' | 'Incubated' | 'Rejected' | string;
  incubationNotes?: string;
  fundingAmount?: number;
  mentorAssigned?: string;
  isPlacementEligible?: boolean;
  studentName: string;
  studentRegNo: string;
  studentPhoto?: string;
  rollNo?: string;
  collegeName?: string;
  courseName?: string;
  branchName?: string;
  batchName?: string;
  submittedAt?: string;
  facultyName?: string;
  facultyPhoto?: string;
  facultyDesignation?: string;
  facultyRemarks?: string;
}

interface IncubationHustleBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: IncubationItem[];
}

export default function IncubationHustleBoardModal({
  isOpen,
  onClose,
  projects,
}: IncubationHustleBoardModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'TOP_3' | 'MINI_PROJECTS' | 'FUNDED' | 'INCUBATED' | 'SELECTED'>('ALL');

  // Aggregate by student to calculate total projects and highest score rank
  const rankedStudents = useMemo(() => {
    const studentMap = new Map<string, {
      key: string;
      studentName: string;
      studentRegNo: string;
      rollNo: string;
      courseName: string;
      batchName: string;
      studentPhoto?: string;
      projects: IncubationItem[];
      highestScore: number;
      totalProjects: number;
      miniProjectsCount: number;
      hasMiniProjects: boolean;
      totalFunding: number;
      topStatus: string;
      topGrade: string;
      topTitle: string;
      topDescription: string;
      topIsMiniProject: boolean;
      mentorAssigned?: string;
      techStack: string[];
    }>();

    projects.forEach((p) => {
      const key = p.studentRegNo || p.studentName;
      if (!studentMap.has(key)) {
        studentMap.set(key, {
          key,
          studentName: p.studentName,
          studentRegNo: p.studentRegNo,
          rollNo: p.rollNo || p.studentRegNo,
          courseName: p.courseName || 'B.Tech',
          batchName: p.batchName || '2025',
          studentPhoto: p.studentPhoto,
          projects: [],
          highestScore: p.score || p.percentage || 0,
          totalProjects: 0,
          miniProjectsCount: 0,
          hasMiniProjects: false,
          totalFunding: p.fundingAmount || 0,
          topStatus: p.incubationStatus || 'Selected',
          topGrade: p.grade || 'A',
          topTitle: p.title,
          topDescription: p.description,
          topIsMiniProject: Boolean(p.isMiniProject || p.projectType === 'MINI_PROJECT'),
          mentorAssigned: p.mentorAssigned || p.facultyName,
          techStack: p.techStack || [],
        });
      }

      const entry = studentMap.get(key)!;
      entry.projects.push(p);
      entry.totalProjects += 1;
      if (p.isMiniProject || p.projectType === 'MINI_PROJECT') {
        entry.miniProjectsCount += 1;
        entry.hasMiniProjects = true;
      }
      if (p.fundingAmount) entry.totalFunding += p.fundingAmount;
      if ((p.score || p.percentage || 0) > entry.highestScore) {
        entry.highestScore = p.score || p.percentage || 0;
        entry.topTitle = p.title;
        entry.topDescription = p.description;
        entry.topStatus = p.incubationStatus;
        entry.topGrade = p.grade || 'A';
        entry.topIsMiniProject = Boolean(p.isMiniProject || p.projectType === 'MINI_PROJECT');
      }
      if (p.techStack && p.techStack.length > 0) {
        p.techStack.forEach((t) => {
          if (!entry.techStack.includes(t)) entry.techStack.push(t);
        });
      }
      if (p.studentPhoto && !entry.studentPhoto) {
        entry.studentPhoto = p.studentPhoto;
      }
    });

    const list = Array.from(studentMap.values());
    // Sort descending by highestScore
    list.sort((a, b) => b.highestScore - a.highestScore);

    return list.map((st, idx) => ({
      ...st,
      rank: idx + 1,
    }));
  }, [projects]);

  const filteredStudents = useMemo(() => {
    return rankedStudents.filter((st) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        st.studentName.toLowerCase().includes(q) ||
        st.studentRegNo.toLowerCase().includes(q) ||
        st.rollNo.toLowerCase().includes(q) ||
        st.courseName.toLowerCase().includes(q) ||
        st.topTitle.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (activeFilter === 'TOP_3') return st.rank <= 3;
      if (activeFilter === 'MINI_PROJECTS') return st.hasMiniProjects;
      if (activeFilter === 'FUNDED') return st.topStatus === 'Funded' || st.totalFunding > 0;
      if (activeFilter === 'INCUBATED') return st.topStatus === 'Incubated';
      if (activeFilter === 'SELECTED') return st.topStatus === 'Selected' || st.topStatus === 'Incubated' || st.topStatus === 'Funded';

      return true;
    });
  }, [rankedStudents, searchQuery, activeFilter]);

  if (!isOpen) return null;

  const totalVenturesCount = projects.length;
  const totalFundedCount = rankedStudents.filter((s) => s.totalFunding > 0 || s.topStatus === 'Funded').length;
  const topPointScore = rankedStudents[0]?.highestScore || 96;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn font-sans">
      <div 
        className="w-full max-w-5xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[24px] shadow-2xl overflow-hidden transition-all text-[#1B1E28] dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-[#E7EAF3] dark:border-slate-800 flex items-start justify-between gap-4 bg-gradient-to-r from-purple-900/10 via-indigo-900/5 to-transparent">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5B4BFF] via-[#7867FF] to-[#F36C21] text-white flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/25 shrink-0 border border-white/20">
              🚀
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#5B4BFF]/10 text-[#5B4BFF] dark:text-indigo-400 font-extrabold uppercase tracking-wider border border-[#5B4BFF]/20">
                  Campus Incubation Records
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold uppercase tracking-wider border border-amber-500/20">
                  ⭐ Live Hustle Board
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#1B1E28] dark:text-white mt-0.5 tracking-tight">
                Venture Incubation Cell — Hustle Leaderboard
              </h2>
              <p className="text-xs text-[#4E5969] dark:text-slate-400">
                Top student innovators, evaluated projects count, scored points, and startup venture incubation rankings.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Stats Overview Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:px-6 bg-[#F6F8FC] dark:bg-slate-800/40 border-b border-[#E7EAF3] dark:border-slate-800 text-xs">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700/80">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#4E5969] dark:text-slate-400">Total Incubated</span>
            <p className="text-lg font-black text-[#5B4BFF] dark:text-indigo-400">{totalVenturesCount} Ventures</p>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700/80">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#4E5969] dark:text-slate-400">Student Innovators</span>
            <p className="text-lg font-black text-[#1B1E28] dark:text-white">{rankedStudents.length} Students</p>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700/80">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#4E5969] dark:text-slate-400">Funded / Grants</span>
            <p className="text-lg font-black text-[#00C48C]">{totalFundedCount} Funded</p>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700/80">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#4E5969] dark:text-slate-400">Highest Point Score</span>
            <p className="text-lg font-black text-[#F36C21]">{topPointScore} Points</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E7EAF3] dark:border-slate-800">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeFilter === 'ALL'
                  ? 'bg-[#5B4BFF] text-white shadow-md shadow-[#5B4BFF]/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-[#4E5969] dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              All Innovators ({rankedStudents.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('TOP_3')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeFilter === 'TOP_3'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-[#4E5969] dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              👑 Top 3 Podium
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('MINI_PROJECTS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeFilter === 'MINI_PROJECTS'
                  ? 'bg-[#F36C21] text-white shadow-md shadow-orange-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-[#4E5969] dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              🚀 Mini Projects ({rankedStudents.filter(s => s.hasMiniProjects).length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('FUNDED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeFilter === 'FUNDED'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-[#4E5969] dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              💰 Funded Grants
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('INCUBATED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeFilter === 'INCUBATED'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-[#4E5969] dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              🌟 Commercial Stage
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search student, reg no, course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
            />
          </div>
        </div>

        {/* Scrollable Hustle Board Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <span className="text-3xl">🔍</span>
              <p className="text-sm font-bold text-slate-500">No student innovators match your search or filter.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStudents.map((st) => {
                const isTop1 = st.rank === 1;
                const isTop2 = st.rank === 2;
                const isTop3 = st.rank === 3;

                return (
                  <div
                    key={st.key}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isTop1
                        ? 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-400/50 shadow-md shadow-amber-500/5'
                        : isTop2
                        ? 'bg-gradient-to-r from-slate-400/10 via-slate-400/5 to-transparent border-slate-300 dark:border-slate-700'
                        : isTop3
                        ? 'bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent border-orange-300 dark:border-orange-900/50'
                        : 'bg-white dark:bg-slate-800/60 border-[#E7EAF3] dark:border-slate-800 hover:border-indigo-400/40'
                    }`}
                  >
                    {/* Left Rank & Student Profile Info */}
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                      {/* Rank Medal */}
                      <div className="flex flex-col items-center justify-center shrink-0 w-10">
                        {isTop1 ? (
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-900 font-black text-sm flex items-center justify-center shadow-md shadow-amber-500/30 border border-yellow-200">
                            🥇 #1
                          </div>
                        ) : isTop2 ? (
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-300 to-slate-400 text-slate-900 font-black text-sm flex items-center justify-center shadow-md border border-slate-200">
                            🥈 #2
                          </div>
                        ) : isTop3 ? (
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 to-orange-700 text-white font-black text-sm flex items-center justify-center shadow-md border border-orange-400">
                            🥉 #3
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 font-black text-xs flex items-center justify-center border border-slate-200 dark:border-slate-600">
                            #{st.rank}
                          </div>
                        )}
                        <span className="text-[9px] font-black text-slate-400 uppercase mt-0.5 tracking-tighter">Rank</span>
                      </div>

                      {/* Student Profile Picture */}
                      <div className="relative w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 bg-gradient-to-tr from-[#5B4BFF] to-[#F36C21] text-white flex items-center justify-center font-black text-base shadow-md border-2 border-white dark:border-slate-800">
                        {st.studentPhoto ? (
                          <img
                            src={st.studentPhoto}
                            alt={st.studentName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : null}
                        <span>{st.studentName.charAt(0) || 'S'}</span>
                      </div>

                      {/* Student Name & Academic Metadata */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black text-[#1B1E28] dark:text-white truncate">
                            {st.studentName}
                          </h4>
                          <span className="text-[9px] px-2 py-0.5 rounded-md bg-[#5B4BFF]/10 text-[#5B4BFF] dark:text-indigo-400 font-mono font-bold border border-[#5B4BFF]/20">
                            REG: {st.studentRegNo}
                          </span>
                          <span className="text-[9px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-[#4E5969] dark:text-slate-300 font-bold">
                            {st.courseName} • {st.batchName}
                          </span>
                          {st.hasMiniProjects && (
                            <span className="text-[9px] px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20">
                              🚀 {st.miniProjectsCount} Mini Project{st.miniProjectsCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {/* Top Venture Description */}
                        <div className="mt-1">
                          <p className="text-xs font-black text-indigo-600 dark:text-indigo-300 flex items-center gap-1.5 truncate">
                            <span>{st.topIsMiniProject ? '🚀' : '💻'}</span>
                            <span className="truncate">{st.topTitle}</span>
                            {st.topIsMiniProject && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#F36C21]/15 text-[#F36C21] font-black border border-[#F36C21]/30">
                                Mini Project
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-[#4E5969] dark:text-slate-400 line-clamp-1 mt-0.5">
                            {st.topDescription}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right Stats & Status Badges */}
                    <div className="flex items-center gap-3.5 justify-between md:justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                      {/* Projects Count */}
                      <div className="text-center px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Projects</span>
                        <span className="text-xs font-black text-[#1B1E28] dark:text-white">{st.totalProjects} Submissions</span>
                      </div>

                      {/* Scored Points */}
                      <div className="text-center px-3 py-1.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50">
                        <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase block">Scored Points</span>
                        <span className="text-sm font-black text-amber-600 dark:text-amber-300">{st.highestScore} pts ⭐</span>
                      </div>

                      {/* Status Tag */}
                      <div className="text-right min-w-[90px]">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block ${
                          st.topStatus === 'Funded'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            : st.topStatus === 'Incubated'
                            ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                            : 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
                        }`}>
                          ● {st.topStatus}
                        </span>
                        {st.mentorAssigned && (
                          <span className="block text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[120px]" title={`Mentor: ${st.mentorAssigned}`}>
                            Mentor: {st.mentorAssigned}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-6 bg-[#F6F8FC] dark:bg-slate-800/60 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-[#4E5969] dark:text-slate-400 font-bold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#F36C21]" />
            SRMS Venture Incubation & Commercialization Framework
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4838DF] text-white font-bold transition-all shadow-md shadow-[#5B4BFF]/20 cursor-pointer"
          >
            Close Hustle Board
          </button>
        </div>
      </div>
    </div>
  );
}
