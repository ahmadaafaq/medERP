'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../../../../../components/Sidebar';
import Header from '../../../../../components/Header';
import {
  Trophy,
  Award,
  BookOpen,
  Filter,
  Search,
  Sparkles,
  TrendingUp,
  GraduationCap,
  Users,
  CheckCircle2,
  ChevronRight,
  Medal,
  Star,
  Layers,
} from 'lucide-react';

interface LeaderboardStudent {
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
  categoryBreakdown: {
    category_name: string;
    marks_obtained: number;
    max_marks: number;
    score_pct: number;
  }[];
}

interface CategoryItem {
  id: string;
  name: string;
  code: string;
}

const API_BASE = 'http://localhost:3001/api/v1';

export default function AdminLogbookLeaderboardPage() {
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
    <div className="min-h-screen bg-[#F6F8FC] dark:bg-slate-950 font-sans">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col md:pl-64">
        <Header title="Logbook Merit Leaderboard" />
        <main className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
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

            {/* Quick KPI Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <span className="text-[10px] text-white/70 font-extrabold uppercase tracking-wider block">
                  Top Scorer
                </span>
                <span className="text-base font-black text-amber-300 truncate block">
                  {topStudent ? topStudent.studentName : 'Evaluating...'}
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <span className="text-[10px] text-white/70 font-extrabold uppercase tracking-wider block">
                  Peak Performance
                </span>
                <span className="text-xl font-black text-emerald-300 font-mono">
                  {topStudent ? `${topStudent.performancePct}%` : '0%'}
                </span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <span className="text-[10px] text-white/70 font-extrabold uppercase tracking-wider block">
                  Total Evaluated
                </span>
                <span className="text-xl font-black text-white font-mono">{totalEvaluatedActivities}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <span className="text-[10px] text-white/70 font-extrabold uppercase tracking-wider block">
                  Cohort Average
                </span>
                <span className="text-xl font-black text-[#F36C21] font-mono">{avgCohortPct}%</span>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800 shadow-soft">
            <div className="flex items-center gap-3 overflow-x-auto w-full sm:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-[#E7EAF3] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-850 text-xs font-bold focus:outline-none focus:border-[#5B4BFF]"
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
                className="px-3.5 py-2 rounded-xl border border-[#E7EAF3] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-850 text-xs font-bold focus:outline-none focus:border-[#5B4BFF]"
              >
                <option value="all">All Academic Programs</option>
                <option value="13">BCA</option>
                <option value="1">B.Tech</option>
                <option value="3">MCA</option>
                <option value="2">B.Pharm</option>
                <option value="11">MBBS</option>
              </select>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search student or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E7EAF3] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-850 text-xs font-medium focus:outline-none focus:border-[#5B4BFF]"
              />
            </div>
          </div>

          {/* Leaderboard Table / Cards */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7EAF3] dark:border-slate-800">
              <h3 className="text-base font-black text-[#1B1E28] dark:text-white">
                Best-Performer Merit Standings
              </h3>
              <span className="text-xs font-bold text-slate-500">
                Ranked by overall score percentage
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading standings...</div>
            ) : filteredLeaderboard.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-medium">
                No evaluated student activities found for this filter combination.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E7EAF3] dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Program &amp; Batch</th>
                      <th className="py-3 px-4">Activities</th>
                      <th className="py-3 px-4">Total Score</th>
                      <th className="py-3 px-4">Overall Performance %</th>
                      <th className="py-3 px-4">Peak Activity %</th>
                      <th className="py-3 px-4 text-right">Tier Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800">
                    {filteredLeaderboard.map((st) => {
                      const isGold = st.rank === 1;
                      const isSilver = st.rank === 2;
                      const isBronze = st.rank === 3;

                      return (
                        <tr key={st.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                          {/* Rank */}
                          <td className="py-3.5 px-4 font-black">
                            <div className="flex items-center gap-1.5">
                              {isGold ? (
                                <span className="w-7 h-7 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center font-black text-xs shadow-xs">
                                  👑 1
                                </span>
                              ) : isSilver ? (
                                <span className="w-7 h-7 rounded-full bg-slate-300 text-slate-900 flex items-center justify-center font-black text-xs">
                                  🥈 2
                                </span>
                              ) : isBronze ? (
                                <span className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center font-black text-xs">
                                  🥉 3
                                </span>
                              ) : (
                                <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-mono font-bold text-xs">
                                  #{st.rank}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Student Info */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs">
                                {st.photoUrl ? (
                                  <img src={st.photoUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  <span>{st.studentName.charAt(0)}</span>
                                )}
                              </div>
                              <div>
                                <span className="font-black text-[#1B1E28] dark:text-white block">
                                  {st.studentName}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {st.rollNo || st.regNo}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Course & Batch */}
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-[#1B1E28] dark:text-white block">
                              {st.courseName}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-medium">
                              {st.batchName}
                            </span>
                          </td>

                          {/* Completed Activities */}
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                            {st.totalActivities} Tasks
                          </td>

                          {/* Total Marks */}
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-white">
                            {st.totalMarks} / {st.maxMarks}
                          </td>

                          {/* Overall Performance % with Bar */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between font-mono font-black text-xs">
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  {st.performancePct}%
                                </span>
                              </div>
                              <div className="w-28 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-[#5B4BFF] to-emerald-500 rounded-full"
                                  style={{ width: `${Math.min(st.performancePct, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Peak % */}
                          <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {st.peakPct}%
                          </td>

                          {/* Tier Status */}
                          <td className="py-3.5 px-4 text-right">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isGold
                                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300'
                                : st.rank <= 3
                                ? 'bg-indigo-50 text-[#5B4BFF] dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {st.tier}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
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
