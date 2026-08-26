'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import PublishTopicModal from '../../../../components/logbook/PublishTopicModal';
import EvaluateSubmissionModal from '../../../../components/logbook/EvaluateSubmissionModal';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Award,
  AlertCircle,
  FileText,
  Users,
  Layers,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Edit,
  Trash2,
} from 'lucide-react';

interface TopicItem {
  id: string;
  title: string;
  description?: string;
  submission_deadline?: string;
  max_marks: number;
  course_id?: string;
  course_name?: string;
  batch_name?: string;
  category_id?: string;
  category_name?: string;
  category_code?: string;
  submission_count: number;
  evaluated_count: number;
}

interface SubmissionItem {
  id: string;
  student_id: string;
  student_name: string;
  rollno?: string;
  registration_no?: string;
  photo_url?: string;
  course_name?: string;
  batch_name?: string;
  topic_title: string;
  topic_description?: string;
  max_marks: number;
  category_name?: string;
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

export default function FacultyLogbookPage() {
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [activeTab, setActiveTab] = useState<'SUBMISSIONS' | 'TOPICS'>('SUBMISSIONS');
  const [submissionFilter, setSubmissionFilter] = useState<'ALL' | 'SUBMITTED' | 'EVALUATED' | 'LATE'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isEvaluateModalOpen, setIsEvaluateModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionItem | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const slug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly';
    const token = localStorage.getItem('token') || '';

    try {
      // 1. Fetch faculty topics
      const topRes = await fetch(`${API_BASE}/logbook/topics?tenant=${slug}`, {
        headers: { Authorization: `Bearer ${token}`, 'x-tenant-slug': slug },
      });
      if (topRes.ok) {
        const topJson = await topRes.json();
        setTopics(Array.isArray(topJson.data) ? topJson.data : Array.isArray(topJson) ? topJson : []);
      }

      // 2. Fetch all submissions
      const subRes = await fetch(`${API_BASE}/logbook/submissions?tenant=${slug}`, {
        headers: { Authorization: `Bearer ${token}`, 'x-tenant-slug': slug },
      });
      if (subRes.ok) {
        const subJson = await subRes.json();
        setSubmissions(Array.isArray(subJson.data) ? subJson.data : Array.isArray(subJson) ? subJson : []);
      }
    } catch (e) {
      console.error('Failed to load faculty logbook data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEvaluate = (sub: SubmissionItem) => {
    setSelectedSubmission(sub);
    setIsEvaluateModalOpen(true);
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('Are you sure you want to delete this activity topic?')) return;
    const slug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly';
    const token = localStorage.getItem('token') || '';

    try {
      const res = await fetch(`${API_BASE}/logbook/topics/${topicId}?tenant=${slug}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'x-tenant-slug': slug },
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error('Failed to delete topic:', e);
    }
  };

  // Stats calculation
  const totalTopics = topics.length;
  const totalSubmissions = submissions.length;
  const pendingEvaluation = submissions.filter((s) => s.status === 'SUBMITTED' || s.status === 'LATE').length;
  const evaluatedCount = submissions.filter((s) => s.status === 'EVALUATED').length;

  // Filter submissions
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesStatus =
      submissionFilter === 'ALL' ||
      (submissionFilter === 'SUBMITTED' && (sub.status === 'SUBMITTED' || sub.status === 'PENDING')) ||
      (submissionFilter === 'LATE' && sub.status === 'LATE') ||
      (submissionFilter === 'EVALUATED' && sub.status === 'EVALUATED');

    const matchesSearch =
      !searchQuery ||
      sub.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.rollno?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.registration_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.topic_title.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="faculty" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Faculty Logbook & Activity Evaluation" />
        <main className="p-4 sm:p-6 md:p-8 space-y-6 flex-1 max-w-[1600px] w-full mx-auto overflow-x-hidden">
          {/* Top Banner Header */}
          <div className="bg-gradient-to-r from-[#2D2575] via-[#3B328C] to-[#5B4BFF] rounded-[22px] p-6 md:p-8 text-white shadow-soft relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-black tracking-wider uppercase flex items-center gap-1.5 border border-white/10">
                    <BookOpen className="w-3.5 h-3.5 text-[#F36C21]" />
                    Faculty Activity Console
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-400/20">
                    Logbook Manager
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                  Academic Logbook &amp; Activity Evaluation
                </h1>
                <p className="text-white/80 text-xs md:text-sm max-w-2xl font-medium">
                  Publish seminars, tutorials, assignments and practical logs. Review student submissions with file previews and assign authentic marks.
                </p>
              </div>

              <button
                onClick={() => setIsPublishModalOpen(true)}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#F36C21] to-amber-600 hover:opacity-95 text-white text-xs font-black shadow-lg shadow-[#F36C21]/30 transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>+ Publish New Activity Topic</span>
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <span className="text-[10px] text-white/70 font-extrabold uppercase tracking-wider block">
                  Published Topics
                </span>
                <span className="text-xl font-black text-white font-mono">{totalTopics}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <span className="text-[10px] text-white/70 font-extrabold uppercase tracking-wider block">
                  Total Submissions
                </span>
                <span className="text-xl font-black text-emerald-300 font-mono">{totalSubmissions}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <span className="text-[10px] text-white/70 font-extrabold uppercase tracking-wider block">
                  Pending Evaluation
                </span>
                <span className="text-xl font-black text-amber-300 font-mono">{pendingEvaluation}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <span className="text-[10px] text-white/70 font-extrabold uppercase tracking-wider block">
                  Evaluated &amp; Graded
                </span>
                <span className="text-xl font-black text-[#F36C21] font-mono">{evaluatedCount}</span>
              </div>
            </div>
          </div>

          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-[#E7EAF3] dark:border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('SUBMISSIONS')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'SUBMISSIONS'
                  ? 'bg-[#5B4BFF] text-white shadow-md shadow-[#5B4BFF]/25'
                  : 'bg-white dark:bg-slate-900 text-[#4E5969] dark:text-slate-300 border border-[#E7EAF3] dark:border-slate-800 hover:bg-[#EEECFF]'
              }`}
            >
              <span>Incoming Submissions Queue</span>
              {pendingEvaluation > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-mono font-black">
                  {pendingEvaluation}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('TOPICS')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'TOPICS'
                  ? 'bg-[#5B4BFF] text-white shadow-md shadow-[#5B4BFF]/25'
                  : 'bg-white dark:bg-slate-900 text-[#4E5969] dark:text-slate-300 border border-[#E7EAF3] dark:border-slate-800 hover:bg-[#EEECFF]'
              }`}
            >
              <span>Published Activity Topics ({topics.length})</span>
            </button>
          </div>

          {/* TAB 1: INCOMING SUBMISSIONS QUEUE */}
          {activeTab === 'SUBMISSIONS' && (
            <div className="space-y-4">
              {/* Filter Pills & Search */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800 shadow-soft">
                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                  <button
                    onClick={() => setSubmissionFilter('ALL')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      submissionFilter === 'ALL'
                        ? 'bg-[#5B4BFF] text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    All Submissions ({submissions.length})
                  </button>
                  <button
                    onClick={() => setSubmissionFilter('SUBMITTED')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      submissionFilter === 'SUBMITTED'
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Pending Evaluation ({pendingEvaluation})
                  </button>
                  <button
                    onClick={() => setSubmissionFilter('EVALUATED')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      submissionFilter === 'EVALUATED'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Evaluated ({evaluatedCount})
                  </button>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search student or roll no..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E7EAF3] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-850 text-xs font-medium focus:outline-none focus:border-[#5B4BFF]"
                  />
                </div>
              </div>

              {/* Submissions Table */}
              <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft">
                {loading ? (
                  <div className="py-12 text-center text-xs text-slate-400">Loading submissions...</div>
                ) : filteredSubmissions.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 font-medium">
                    No submissions matching this filter.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#E7EAF3] dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          <th className="py-3 px-4">Student</th>
                          <th className="py-3 px-4">Activity Topic</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Submitted Date</th>
                          <th className="py-3 px-4">Attachment</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Score</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800">
                        {filteredSubmissions.map((sub) => {
                          const isEvaluated = sub.status === 'EVALUATED';
                          const pct = isEvaluated && sub.marks_obtained !== undefined
                            ? Math.round((Number(sub.marks_obtained) / Number(sub.max_marks || 100)) * 100)
                            : null;

                          return (
                            <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                              {/* Student Info */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs">
                                    {sub.photo_url ? (
                                      <img src={sub.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                      <span>{sub.student_name.charAt(0)}</span>
                                    )}
                                  </div>
                                  <div>
                                    <span className="font-bold text-[#1B1E28] dark:text-white block">
                                      {sub.student_name}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {sub.rollno || sub.registration_no} • {sub.course_name}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Topic Title */}
                              <td className="py-3.5 px-4 font-bold text-[#1B1E28] dark:text-white max-w-xs truncate">
                                {sub.topic_title}
                              </td>

                              {/* Category */}
                              <td className="py-3.5 px-4">
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black">
                                  {sub.category_name || 'Academic'}
                                </span>
                              </td>

                              {/* Submitted Date */}
                              <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                                {new Date(sub.submitted_at).toLocaleDateString()}
                              </td>

                              {/* Attachment */}
                              <td className="py-3.5 px-4">
                                {sub.file_name ? (
                                  <span className="text-[11px] font-bold text-[#5B4BFF] flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    <span className="truncate max-w-[100px]">{sub.file_name}</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[10px]">Text only</span>
                                )}
                              </td>

                              {/* Status */}
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

                              {/* Score */}
                              <td className="py-3.5 px-4 font-mono font-black">
                                {isEvaluated ? (
                                  <span className="text-emerald-600 dark:text-emerald-400">
                                    {sub.marks_obtained}/{sub.max_marks} ({pct}%)
                                  </span>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>

                              {/* Action */}
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  onClick={() => handleOpenEvaluate(sub)}
                                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs ${
                                    isEvaluated
                                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                                      : 'bg-[#5B4BFF] hover:bg-[#4B3BFF] text-white shadow-md shadow-[#5B4BFF]/20'
                                  }`}
                                >
                                  {isEvaluated ? 'Review / Edit' : 'Evaluate Work'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PUBLISHED TOPICS LEDGER */}
          {activeTab === 'TOPICS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#5B4BFF]/10 text-[#5B4BFF] text-[10px] font-mono font-black uppercase">
                        {topic.category_name || 'Activity'}
                      </span>
                      <button
                        onClick={() => handleDeleteTopic(topic.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                        title="Delete topic"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="text-base font-black text-[#1B1E28] dark:text-white">
                      {topic.title}
                    </h3>
                    {topic.description && (
                      <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium line-clamp-2">
                        {topic.description}
                      </p>
                    )}
                  </div>

                  {/* Stats & Cohort Scope */}
                  <div className="pt-4 border-t border-[#E7EAF3] dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#4E5969] dark:text-slate-400 font-medium">
                      <span>Max Marks: <strong className="text-[#5B4BFF] font-mono">{topic.max_marks}</strong></span>
                      <span>Target: <strong>{topic.course_name || 'BCA'}</strong> ({topic.batch_name || 'Batch 2025'})</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-500">
                        Submissions: {topic.submission_count} • Evaluated: {topic.evaluated_count}
                      </span>
                      {topic.submission_deadline && (
                        <span className="text-slate-400">
                          Due: {new Date(topic.submission_deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <PublishTopicModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onSuccess={() => fetchData()}
      />
      <EvaluateSubmissionModal
        isOpen={isEvaluateModalOpen}
        onClose={() => setIsEvaluateModalOpen(false)}
        submission={selectedSubmission}
        onSuccess={() => fetchData()}
      />
    </div>
  );
}
