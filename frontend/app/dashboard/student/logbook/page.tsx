'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import LogbookSubmitWorkModal from '../../../../components/logbook/LogbookSubmitWorkModal';
import {
  BookOpen,
  Calendar,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  Filter,
  Sparkles,
  ChevronRight,
  UploadCloud,
  FileCheck,
  TrendingUp,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  code: string;
}

interface TopicItem {
  id: string;
  title: string;
  description?: string;
  submission_deadline?: string;
  max_marks: number;
  course_name?: string;
  batch_name?: string;
  category_id?: string;
  category_name?: string;
  category_code?: string;
  faculty_name?: string;
  submission_count: number;
  evaluated_count: number;
  student_submission?: {
    id: string;
    status: string;
    submitted_at: string;
    file_url?: string;
    file_name?: string;
    marks_obtained?: number;
    remarks?: string;
    evaluated_at?: string;
  };
}

interface SubmissionItem {
  id: string;
  topic_title: string;
  topic_description?: string;
  max_marks: number;
  submission_deadline?: string;
  category_name?: string;
  faculty_name?: string;
  file_url?: string;
  file_name?: string;
  file_size?: string;
  explanation_text?: string;
  status: string;
  submitted_at: string;
  marks_obtained?: number;
  remarks?: string;
  evaluated_at?: string;
}

const API_BASE = 'http://localhost:3001/api/v1';

export default function StudentLogbookPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState<'TOPICS' | 'SUBMISSIONS'>('TOPICS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<TopicItem | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
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

      // 2. Fetch topics (with student view)
      const topRes = await fetch(`${API_BASE}/logbook/topics?studentView=true&tenant=${slug}`, {
        headers: { Authorization: `Bearer ${token}`, 'x-tenant-slug': slug },
      });
      if (topRes.ok) {
        const topJson = await topRes.json();
        setTopics(Array.isArray(topJson.data) ? topJson.data : Array.isArray(topJson) ? topJson : []);
      }

      // 3. Fetch student submissions
      const subRes = await fetch(`${API_BASE}/logbook/submissions/me?tenant=${slug}`, {
        headers: { Authorization: `Bearer ${token}`, 'x-tenant-slug': slug },
      });
      if (subRes.ok) {
        const subJson = await subRes.json();
        setSubmissions(Array.isArray(subJson.data) ? subJson.data : Array.isArray(subJson) ? subJson : []);
      }
    } catch (e) {
      console.error('Failed to load logbook data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSubmit = (topic: TopicItem) => {
    setSelectedTopic(topic);
    setIsSubmitModalOpen(true);
  };

  // Stats calculation
  const totalTopics = topics.length;
  const submittedCount = topics.filter((t) => t.student_submission).length;
  const evaluatedSubmissions = submissions.filter((s) => s.status === 'EVALUATED');
  const evaluatedCount = evaluatedSubmissions.length;
  const avgScore = evaluatedCount > 0
    ? Math.round(
        (evaluatedSubmissions.reduce((acc, s) => acc + (Number(s.marks_obtained || 0) / Number(s.max_marks || 100)) * 100, 0) /
          evaluatedCount)
      )
    : null;

  // Filter topics
  const filteredTopics = topics.filter((t) => {
    const matchesCategory = selectedCategory === 'all' || t.category_id === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="student" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Student Logbook & Activity Portal" />
        <main className="p-4 sm:p-6 md:p-8 space-y-6 flex-1 max-w-[1600px] w-full mx-auto overflow-x-hidden">
          {/* Page Banner Header */}
          <div className="bg-gradient-to-r from-[#2D2575] via-[#3B328C] to-[#5B4BFF] rounded-[22px] p-6 md:p-8 text-white shadow-soft relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-black tracking-wider uppercase flex items-center gap-1.5 border border-white/10">
                    <BookOpen className="w-3.5 h-3.5 text-[#F36C21]" />
                    Academic Activity &amp; Logbook
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-400/20">
                    Live Sync
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                  Student Logbook &amp; Activity Portal
                </h1>
                <p className="text-white/80 text-xs md:text-sm max-w-2xl font-medium">
                  Submit required seminars, practical logs, coursework assignments and project reports for faculty evaluation and marks.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedTab('TOPICS')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    selectedTab === 'TOPICS'
                      ? 'bg-white text-[#2D2575] shadow-md'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  Assigned Activities ({totalTopics})
                </button>
                <button
                  onClick={() => setSelectedTab('SUBMISSIONS')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    selectedTab === 'SUBMISSIONS'
                      ? 'bg-white text-[#2D2575] shadow-md'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  My Submissions ({submissions.length})
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <span className="text-[10px] text-white/70 font-extrabold uppercase tracking-wider block">
                  Assigned Tasks
                </span>
                <span className="text-xl font-black text-white font-mono">{totalTopics}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <span className="text-[10px] text-white/70 font-extrabold uppercase tracking-wider block">
                  Work Submitted
                </span>
                <span className="text-xl font-black text-emerald-300 font-mono">{submittedCount}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <span className="text-[10px] text-white/70 font-extrabold uppercase tracking-wider block">
                  Evaluated &amp; Graded
                </span>
                <span className="text-xl font-black text-[#F36C21] font-mono">{evaluatedCount}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <span className="text-[10px] text-white/70 font-extrabold uppercase tracking-wider block">
                  Average Score
                </span>
                <span className="text-xl font-black text-amber-300 font-mono">
                  {avgScore !== null ? `${avgScore}%` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#5B4BFF] text-white shadow-md shadow-[#5B4BFF]/25'
                  : 'bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 text-[#4E5969] dark:text-slate-300 hover:bg-[#EEECFF]'
              }`}
            >
              All Categories ({topics.length})
            </button>
            {categories.map((cat) => {
              const count = topics.filter((t) => t.category_id === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? 'bg-[#5B4BFF] text-white shadow-md shadow-[#5B4BFF]/25'
                      : 'bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 text-[#4E5969] dark:text-slate-300 hover:bg-[#EEECFF]'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800 shadow-soft">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search topics, keywords, instructions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E7EAF3] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-850 text-xs font-medium focus:outline-none focus:border-[#5B4BFF]"
              />
            </div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Showing <strong>{selectedTab === 'TOPICS' ? filteredTopics.length : submissions.length}</strong> records
            </div>
          </div>

          {/* TAB 1: ASSIGNED TOPICS */}
          {selectedTab === 'TOPICS' && (
            <div>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-48 rounded-[22px] bg-white dark:bg-slate-900 animate-pulse border border-[#E7EAF3] dark:border-slate-800 p-6" />
                  ))}
                </div>
              ) : filteredTopics.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800 p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-slate-850 text-[#5B4BFF] flex items-center justify-center mx-auto">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black text-[#1B1E28] dark:text-white">
                    No Logbook Activities Found
                  </h3>
                  <p className="text-xs text-[#4E5969] dark:text-slate-400 max-w-sm mx-auto font-medium">
                    No academic activities are currently published for this category or search filter.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredTopics.map((topic) => {
                    const sub = topic.student_submission;
                    const isEvaluated = sub?.status === 'EVALUATED';
                    const isSubmitted = sub?.status === 'SUBMITTED' || sub?.status === 'LATE';
                    const isLate = topic.submission_deadline && new Date() > new Date(topic.submission_deadline);

                    return (
                      <div
                        key={topic.id}
                        className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                      >
                        <div className="space-y-3">
                          {/* Card Category & Status Badges */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2.5 py-1 rounded-full bg-[#5B4BFF]/10 text-[#5B4BFF] text-[10px] font-mono font-black uppercase tracking-wider">
                              {topic.category_name || 'Activity'}
                            </span>
                            {isEvaluated ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 text-[10px] font-black flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Evaluated: {sub.marks_obtained}/{topic.max_marks}</span>
                              </span>
                            ) : isSubmitted ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-[#5B4BFF] dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 text-[10px] font-black flex items-center gap-1">
                                <FileCheck className="w-3 h-3" />
                                <span>Submitted (Awaiting Review)</span>
                              </span>
                            ) : isLate ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 text-[10px] font-black flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Deadline Passed</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 text-[10px] font-black flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Pending Submission</span>
                              </span>
                            )}
                          </div>

                          {/* Title & Description */}
                          <div>
                            <h3 className="text-base font-black text-[#1B1E28] dark:text-white group-hover:text-[#5B4BFF] transition-colors leading-snug">
                              {topic.title}
                            </h3>
                            {topic.description && (
                              <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium mt-1.5 line-clamp-2">
                                {topic.description}
                              </p>
                            )}
                          </div>

                          {/* Evaluation Remarks if Evaluated */}
                          {isEvaluated && sub?.remarks && (
                            <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 text-xs text-emerald-800 dark:text-emerald-200 space-y-0.5">
                              <span className="text-[10px] font-black uppercase text-emerald-600 block">
                                💬 Faculty Remarks:
                              </span>
                              <p className="font-medium italic">"{sub.remarks}"</p>
                            </div>
                          )}
                        </div>

                        {/* Card Meta & Action Footer */}
                        <div className="pt-4 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <p className="text-[11px] text-[#4E5969] dark:text-slate-400 font-medium">
                              Max Marks: <strong className="text-[#5B4BFF] font-mono">{topic.max_marks}</strong>
                            </p>
                            {topic.submission_deadline && (
                              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>Due: {new Date(topic.submission_deadline).toLocaleDateString()}</span>
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => handleOpenSubmit(topic)}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                              isEvaluated
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                                : isSubmitted
                                ? 'bg-[#EEECFF] text-[#5B4BFF] hover:bg-[#5B4BFF] hover:text-white'
                                : 'bg-[#5B4BFF] hover:bg-[#4B3BFF] text-white shadow-md shadow-[#5B4BFF]/20'
                            }`}
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>{isEvaluated ? 'Review Work' : isSubmitted ? 'Update Work' : 'Submit Work'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MY SUBMISSIONS LEDGER */}
          {selectedTab === 'SUBMISSIONS' && (
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E7EAF3] dark:border-slate-800">
                <div>
                  <h3 className="text-base font-black text-[#1B1E28] dark:text-white">
                    My Submissions &amp; Evaluation Ledger
                  </h3>
                  <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium">
                    Comprehensive log of all submitted academic assignments, evaluation remarks, and scores.
                  </p>
                </div>
              </div>

              {submissions.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 font-medium">
                  No submissions recorded yet. Submit work against assigned topics to populate your ledger.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E7EAF3] dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        <th className="py-3 px-4">Activity / Topic</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Submitted At</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Marks Obtained</th>
                        <th className="py-3 px-4">Faculty Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800">
                      {submissions.map((sub) => {
                        const pct = sub.marks_obtained !== undefined && sub.marks_obtained !== null
                          ? Math.round((Number(sub.marks_obtained) / Number(sub.max_marks || 100)) * 100)
                          : null;

                        return (
                          <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-[#1B1E28] dark:text-white block truncate max-w-xs">
                                {sub.topic_title}
                              </span>
                              {sub.file_name && (
                                <span className="text-[10px] text-[#5B4BFF] font-medium block mt-0.5">
                                  📎 {sub.file_name}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black">
                                {sub.category_name || 'Academic'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                              {new Date(sub.submitted_at).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                sub.status === 'EVALUATED'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200'
                                  : sub.status === 'LATE'
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200'
                                  : 'bg-indigo-50 text-[#5B4BFF] dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200'
                              }`}>
                                {sub.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-black">
                              {sub.marks_obtained !== undefined && sub.marks_obtained !== null ? (
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  {sub.marks_obtained} / {sub.max_marks} ({pct}%)
                                </span>
                              ) : (
                                <span className="text-slate-400">Pending Evaluation</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 italic max-w-xs truncate">
                              {sub.remarks || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Submission Modal */}
      <LogbookSubmitWorkModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        topic={selectedTopic}
        existingSubmission={selectedTopic?.student_submission}
        onSuccess={() => fetchInitialData()}
      />
    </div>
  );
}
