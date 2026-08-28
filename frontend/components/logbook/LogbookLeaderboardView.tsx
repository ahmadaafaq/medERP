'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Award, Search, Filter, Sparkles, BookOpen, User, Star, CheckCircle, ChevronRight } from 'lucide-react';
import Sidebar from '../Sidebar';
import Header from '../Header';

export interface CategoryBreakdown {
  category_name: string;
  marks_obtained: number;
  max_marks: number;
  score_pct: number;
}

export interface LeaderboardStudent {
  rank: number;
  studentId: string;
  studentName: string;
  rollNo: string;
  regNo: string;
  photoUrl?: string;
  courseName: string;
  batchName: string;
  totalActivities: number;
  totalMarks: number;
  maxMarks: number;
  performancePct: number;
  peakPct: number;
  tier: string;
  categoryBreakdown: CategoryBreakdown[];
}

export interface CategoryItem {
  id: string;
  name: string;
  type: string;
}

const API_BASE = 'http://localhost:8081/api/v1';

export default function LogbookLeaderboardView({ role = 'admin' }: { role?: 'admin' | 'faculty' }) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardStudent[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedCategory, selectedCourse]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    const slug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly';
    const token = localStorage.getItem('token') || '';

    try {
      // 1. Fetch categories
      const catRes = await fetch(`${API_BASE}/logbook/categories?tenant=${slug}`, {
        headers: { Authorization: `Bearer ${token}`, 'x-tenant-slug': slug },
      });
      if (catRes.ok) {
        const catJson = await catRes.json();
        setCategories(Array.isArray(catJson.data) ? catJson.data : Array.isArray(catJson) ? catJson : []);
      }

      // 2. Fetch leaderboard
      let url = `${API_BASE}/logbook/leaderboard?tenant=${slug}`;
      if (selectedCategory !== 'all') url += `&categoryId=${selectedCategory}`;
      if (selectedCourse !== 'all') url += `&courseId=${selectedCourse}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, 'x-tenant-slug': slug },
      });

      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : [];
        setLeaderboard(list);
      }
    } catch (e) {
      console.error('Failed to load logbook leaderboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeaderboard = leaderboard.filter((st) => {
    if (!searchQuery) return true;
    return (
      st.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.courseName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const topStudent = leaderboard[0];
  const avgCohortPct = leaderboard.length > 0
    ? Math.round(leaderboard.reduce((acc, s) => acc + s.performancePct, 0) / leaderboard.length)
    : 0;
  const totalEvaluatedActivities = leaderboard.reduce((acc, s) => acc + s.totalActivities, 0);

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Logbook Merit Leaderboard" />
        <main className="p-4 sm:p-6 md:p-8 space-y-6 flex-1 max-w-[1600px] w-full mx-auto overflow-x-hidden">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-[#2D2575] via-[#3B328C] to-[#5B4BFF] rounded-[22px] p-6 md:p-8 text-white shadow-soft relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-black tracking-wider uppercase flex items-center gap-1.5 border border-white/10">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    Academic Performance Leaderboard
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black border border-amber-400/20">
                    Merit Ranking
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                  Academic Logbook &amp; Best-Performer Analytics
                </h1>
                <p className="text-white/80 text-xs md:text-sm max-w-2xl font-medium">
                  Aggregated evaluation performance across all seminars, tutorials, assignments, practical logs, and capstone project submissions.
                </p>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6 pt-6 border-t border-white/10">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <p className="text-[10px] uppercase font-bold text-purple-200">Top Scorer</p>
                <p className="text-base md:text-lg font-black text-amber-300 truncate">
                  {topStudent ? topStudent.studentName : 'Evaluating...'}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <p className="text-[10px] uppercase font-bold text-purple-200">Peak Performance</p>
                <p className="text-base md:text-lg font-black text-emerald-300">
                  {topStudent ? `${topStudent.performancePct}%` : '0%'}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <p className="text-[10px] uppercase font-bold text-purple-200">Total Evaluated</p>
                <p className="text-base md:text-lg font-black text-white">{totalEvaluatedActivities}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <p className="text-[10px] uppercase font-bold text-purple-200">Cohort Average</p>
                <p className="text-base md:text-lg font-black text-orange-300">{avgCohortPct}%</p>
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-4 shadow-soft flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-10 px-3.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              >
                <option value="all">All Activity Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="h-10 px-3.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              >
                <option value="all">All Academic Programs</option>
                <option value="B.Tech CS">B.Tech Computer Science</option>
                <option value="B.Tech ME">B.Tech Mechanical</option>
                <option value="MBBS">MBBS (Clinical / Medical)</option>
              </select>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[#1B1E28] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              />
            </div>
          </div>

          {/* Leaderboard Table Card */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] shadow-soft overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-[#1B1E28] dark:text-white">
                  Best-Performer Merit Standings
                </h2>
                <p className="text-xs text-[#4E5969] dark:text-slate-400">
                  Ranked by overall score percentage across evaluated logbook tasks
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-black border border-emerald-200 dark:border-emerald-800">
                {filteredLeaderboard.length} Top Scholars
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <div className="w-8 h-8 border-3 border-[#5B4BFF] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold">Computing real-time merit standings...</p>
              </div>
            ) : filteredLeaderboard.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  No evaluated student activities found for this filter combination.
                </p>
                <p className="text-xs text-slate-400">
                  Faculty evaluations will automatically rank scholars on this leaderboard.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-[#4E5969] dark:text-slate-400 tracking-wider">
                      <th className="py-3.5 px-4 text-center w-16">Rank</th>
                      <th className="py-3.5 px-4">Scholar Details</th>
                      <th className="py-3.5 px-4">Program &amp; Batch</th>
                      <th className="py-3.5 px-4 text-center">Evaluated Tasks</th>
                      <th className="py-3.5 px-4 text-center">Total Marks</th>
                      <th className="py-3.5 px-4 text-center">Overall Score %</th>
                      <th className="py-3.5 px-4">Category Highlights</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {filteredLeaderboard.map((student) => (
                      <tr
                        key={student.studentId}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* Rank Column with Badges */}
                        <td className="py-4 px-4 text-center">
                          {student.rank === 1 ? (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 text-white font-black text-xs shadow-md shadow-amber-500/20">
                              👑 1
                            </span>
                          ) : student.rank === 2 ? (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-slate-300 to-slate-400 text-slate-800 font-black text-xs shadow-sm">
                              🥈 2
                            </span>
                          ) : student.rank === 3 ? (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-700 text-white font-black text-xs shadow-sm">
                              🥉 3
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-xs">
                              #{student.rank}
                            </span>
                          )}
                        </td>

                        {/* Scholar Avatar & Name */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5B4BFF]/20 to-[#7867FF]/20 border border-[#5B4BFF]/30 flex items-center justify-center overflow-hidden shrink-0">
                              {student.photoUrl ? (
                                <img
                                  src={student.photoUrl}
                                  alt={student.studentName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <span className="font-black text-sm text-[#5B4BFF]">
                                  {student.studentName.charAt(0)}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-black text-[#1B1E28] dark:text-white group-hover:text-[#5B4BFF] transition-colors">
                                {student.studentName}
                              </p>
                              <p className="text-[11px] text-[#4E5969] dark:text-slate-400 font-mono">
                                Roll: {student.rollNo}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Program & Batch */}
                        <td className="py-4 px-4">
                          <p className="font-bold text-[#1B1E28] dark:text-slate-200">
                            {student.courseName}
                          </p>
                          <p className="text-[11px] text-[#4E5969] dark:text-slate-400">
                            {student.batchName}
                          </p>
                        </td>

                        {/* Evaluated Tasks Count */}
                        <td className="py-4 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 font-black text-xs border border-purple-200 dark:border-purple-800">
                            {student.totalActivities} Tasks
                          </span>
                        </td>

                        {/* Marks */}
                        <td className="py-4 px-4 text-center font-mono">
                          <span className="font-black text-[#1B1E28] dark:text-white">
                            {student.totalMarks}
                          </span>
                          <span className="text-slate-400"> / {student.maxMarks}</span>
                        </td>

                        {/* Overall Score % */}
                        <td className="py-4 px-4 text-center">
                          <div className="inline-flex flex-col items-center gap-1">
                            <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                              {student.performancePct}%
                            </span>
                            <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                                style={{ width: `${Math.min(student.performancePct, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Category Highlights Pills */}
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            {student.categoryBreakdown?.slice(0, 3).map((cb, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                              >
                                {cb.category_name}: <b className="text-emerald-600">{cb.score_pct}%</b>
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
