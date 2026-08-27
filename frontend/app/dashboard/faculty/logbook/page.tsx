'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import PublishTopicModal from '../../../../components/logbook/PublishTopicModal';
import EvaluateSubmissionModal from '../../../../components/logbook/EvaluateSubmissionModal';
import LogbookAssignProjectModal from '../../../../components/logbook/LogbookAssignProjectModal';
import LogbookFacultyReviewModal from '../../../../components/logbook/LogbookFacultyReviewModal';
import PostSeminarTutorialModal from '../../../../components/logbook/PostSeminarTutorialModal';
import MiniProjectTrackingModal, { ApplicantStudent } from '../../../../components/logbook/MiniProjectTrackingModal';
import DocumentPreviewModal from '../../../../components/logbook/DocumentPreviewModal';
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
  FolderPlus,
  FolderGit2,
  CalendarDays,
  Presentation,
  BookOpenCheck,
  ShieldCheck,
  Tag,
  Code2,
  Lock,
  Eye,
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
  created_at: string;
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
  topic_type?: string;
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

export default function FacultyLogbookPage() {
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [miniProject, setMiniProject] = useState<any | null>(null);
  const [miniProjectsList, setMiniProjectsList] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [weeklyLogs, setWeeklyLogs] = useState<any[]>([]);
  const [applicants, setApplicants] = useState<ApplicantStudent[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantStudent | null>(null);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'SEMINARS_TUTORIALS' | 'MINI_PROJECTS' | 'TOPICS'>('QUEUE');
  const [applicantFilter, setApplicantFilter] = useState<'ALL' | 'PENDING' | 'EVALUATED'>('ALL');
  const [topicTypeFilter, setTopicTypeFilter] = useState<'ALL' | 'SEMINAR' | 'TUTORIAL'>('ALL');
  const [submissionFilter, setSubmissionFilter] = useState<'ALL' | 'SUBMITTED' | 'EVALUATED' | 'LATE'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Document preview state
  const [isDocPreviewOpen, setIsDocPreviewOpen] = useState(false);
  const [docPreviewTarget, setDocPreviewTarget] = useState<{ url: string; name?: string; studentName?: string; projectTitle?: string } | null>(null);

  // Modals
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isPostSeminarTutorialOpen, setIsPostSeminarTutorialOpen] = useState(false);
  const [isAssignProjectModalOpen, setIsAssignProjectModalOpen] = useState(false);
  const [isEvaluateModalOpen, setIsEvaluateModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionItem | null>(null);

  const [isUniversalReviewModalOpen, setIsUniversalReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (targetProjId?: string) => {
    setLoading(true);
    const slug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly';
    const token = localStorage.getItem('token') || '';

    const headers = {
      Authorization: `Bearer ${token}`,
      'x-tenant-slug': slug,
    };

    try {
      // 1. Fetch faculty topics
      const topRes = await fetch(`/api/v1/logbook/topics?tenant=${slug}`, { headers });
      if (topRes.ok) {
        const topJson = await topRes.json();
        setTopics(Array.isArray(topJson.data) ? topJson.data : Array.isArray(topJson) ? topJson : []);
      }

      // 2. Fetch submissions queue
      const subRes = await fetch(`/api/v1/logbook/submissions?tenant=${slug}`, { headers });
      if (subRes.ok) {
        const subJson = await subRes.json();
        setSubmissions(Array.isArray(subJson.data) ? subJson.data : Array.isArray(subJson) ? subJson : []);
      }

      // 3. Fetch mini project & all mini projects
      let activeProjId = targetProjId || selectedProjectId;
      let projectsArray: any[] = [];

      const allProjRes = await fetch(`/api/v1/logbook/mini-projects/all?tenant=${slug}`, { headers });
      if (allProjRes.ok) {
        const allProjJson = await allProjRes.json();
        const rawList = Array.isArray(allProjJson.data) ? allProjJson.data : Array.isArray(allProjJson) ? allProjJson : [];
        projectsArray = rawList;
        setMiniProjectsList(rawList);
      }

      const projRes = await fetch(`/api/v1/logbook/mini-project?tenant=${slug}`, { headers });
      if (projRes.ok) {
        const projJson = await projRes.json();
        const rawProj = projJson?.data !== undefined ? projJson.data : projJson;
        if (rawProj && rawProj.title) {
          if (projectsArray.length === 0 || !projectsArray.some((p) => String(p.id) === String(rawProj.id))) {
            projectsArray = [rawProj, ...projectsArray];
            setMiniProjectsList(projectsArray);
          }
        }
      }

      const currentProj = activeProjId
        ? projectsArray.find((p) => String(p.id) === String(activeProjId) || p.title === activeProjId) || projectsArray[0] || null
        : projectsArray[0] || null;

      setMiniProject(currentProj);
      if (currentProj?.id && !activeProjId) {
        setSelectedProjectId(currentProj.id);
      }

      // 4. Fetch all weekly logs
      const weekRes = await fetch(`/api/v1/logbook/weekly-logs/all?tenant=${slug}`, { headers });
      if (weekRes.ok) {
        const weekJson = await weekRes.json();
        const rawWeek = weekJson?.data !== undefined ? weekJson.data : weekJson;
        setWeeklyLogs(Array.isArray(rawWeek) ? rawWeek : []);
      }

      // 5. Fetch enrolled applicants & tracking for selected project
      const projFilterParam = currentProj?.id ? `&projectId=${encodeURIComponent(currentProj.id)}` : '';
      const appRes = await fetch(`/api/v1/logbook/mini-projects/applicants?tenant=${slug}${projFilterParam}`, { headers });
      if (appRes.ok) {
        const appJson = await appRes.json();
        const rawApp = appJson?.data !== undefined ? appJson.data : appJson;
        const list: ApplicantStudent[] = Array.isArray(rawApp) ? rawApp : [];
        setApplicants(list);
        setSelectedApplicant((prev) => {
          if (!prev) return null;
          const fresh = list.find((a) => String(a.student_id) === String(prev.student_id));
          return fresh || prev;
        });
      }
    } catch (e) {
      console.error('Failed to load faculty logbook data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = (proj: any) => {
    setSelectedProjectId(proj.id);
    setMiniProject(proj);
    fetchData(proj.id);
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
      const res = await fetch(`/api/v1/logbook/topics/${topicId}?tenant=${slug}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'x-tenant-slug': slug },
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error('Failed to delete topic:', e);
    }
  };

  // Stats calculation
  const totalTopics = topics.length;
  const totalSubmissions = submissions.length;
  const pendingEvaluation = submissions.filter((s) => s.status === 'SUBMITTED' || s.status === 'LATE').length;
  const evaluatedCount = submissions.filter((s) => s.status === 'EVALUATED').length;

  // Applicant status & filter calculation
  const isApplicantEvaluated = (app: ApplicantStudent) => {
    const isLocked = app.is_locked || app.project_status === 'CLOSED';
    if (isLocked) return true;
    const verifiedLogs = app.weekly_logs?.filter(
      (w) => w.status === 'VERIFIED' || (w.guide_marks !== undefined && w.guide_marks !== null && Number(w.guide_marks) > 0)
    ) || [];
    const totalLogs = app.weekly_logs?.length || 0;
    return totalLogs > 0 && verifiedLogs.length === totalLogs;
  };

  const pendingApplicantsCount = applicants.filter((a) => !isApplicantEvaluated(a)).length;
  const evaluatedApplicantsCount = applicants.filter((a) => isApplicantEvaluated(a)).length;

  const filteredApplicants = applicants.filter((app) => {
    if (applicantFilter === 'PENDING') return !isApplicantEvaluated(app);
    if (applicantFilter === 'EVALUATED') return isApplicantEvaluated(app);
    return true;
  });

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
    <div className="flex h-screen bg-[#F6F8FC] dark:bg-slate-950 font-sans antialiased text-slate-800 dark:text-slate-100 overflow-hidden">
      <Sidebar role="faculty" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title="Faculty Logbook & Project Evaluation" />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Top Page Header Banner */}
            <div className="bg-gradient-to-r from-[#2D2575] via-[#3730A3] to-[#4F46E5] rounded-[22px] p-6 sm:p-8 text-white shadow-xl shadow-[#2D2575]/15 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-[#F36C21] mb-2.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Continuous Project & Student Mentoring Command Center</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Faculty Logbook & Project Evaluation Portal
                  </h1>
                  <p className="text-white/80 text-sm mt-1 max-w-2xl">
                    Assign Mini Project topics & mandatory technology stacks, review weekly logs, and grant digital guide sign-offs.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <button
                    onClick={() => setIsAssignProjectModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-[#F36C21] hover:bg-[#E05B10] text-white font-bold text-xs shadow-lg shadow-[#F36C21]/25 flex items-center gap-2 transition-all scale-[1.02]"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>Assign Mini Project</span>
                  </button>

                  <button
                    onClick={() => setIsPublishModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs border border-white/20 backdrop-blur-md flex items-center gap-2 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Post Activity Topic</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 4 Summary Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-[22px] p-5 shadow-sm border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Project</span>
                  <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-[#5B4BFF]">
                    <FolderGit2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white truncate">
                  {miniProject?.title || 'React Crud Operation'}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Stack: {(miniProject?.technologies || ['React', 'PostgreSQL']).slice(0, 3).join(', ')}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-[22px] p-5 shadow-sm border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Submissions</span>
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">{totalSubmissions}</div>
                <div className="text-xs text-slate-500 mt-1">Across all candidate cohorts</div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-[22px] p-5 shadow-sm border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Awaiting Sign-off</span>
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-600">{pendingEvaluation}</div>
                <div className="text-xs text-slate-500 mt-1">Pending review & grading</div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-[22px] p-5 shadow-sm border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Evaluated & Signed</span>
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-600">{evaluatedCount}</div>
                <div className="text-xs text-slate-500 mt-1">Digitally approved by guide</div>
              </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-[22px] p-2 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-thin">
                <button
                  onClick={() => setActiveTab('QUEUE')}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                    activeTab === 'QUEUE'
                      ? 'bg-[#2D2575] text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Incoming Submissions</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F36C21] text-white font-black">
                    {submissions.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('SEMINARS_TUTORIALS')}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                    activeTab === 'SEMINARS_TUTORIALS'
                      ? 'bg-[#2D2575] text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Presentation className="w-4 h-4 text-[#F36C21]" />
                  <span>Seminar / Tutorials</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#5B4BFF] text-white font-bold">
                    {topics.filter((t) => t.category_code === 'SEMINAR' || t.category_code === 'TUTORIAL' || t.title?.toLowerCase().includes('seminar') || t.title?.toLowerCase().includes('tutorial')).length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('MINI_PROJECTS')}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                    activeTab === 'MINI_PROJECTS'
                      ? 'bg-[#2D2575] text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FolderGit2 className="w-4 h-4 text-[#F36C21]" />
                  <span>Assigned Mini Project</span>
                  {miniProjectsList.length > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F36C21] text-white font-black">
                      {miniProjectsList.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('TOPICS')}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                    activeTab === 'TOPICS'
                      ? 'bg-[#2D2575] text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Activity Topics ({topics.length})</span>
                </button>
              </div>

              {activeTab === 'QUEUE' && (
                <div className="flex items-center gap-2">
                  {(['ALL', 'SUBMITTED', 'EVALUATED'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setSubmissionFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        submissionFilter === filter
                          ? 'bg-[#5B4BFF] text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {filter === 'ALL' ? 'All' : filter === 'SUBMITTED' ? 'Pending' : 'Evaluated'}
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'MINI_PROJECTS' && (
                <div className="flex items-center gap-2">
                  {(['ALL', 'PENDING', 'EVALUATED'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setApplicantFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                        applicantFilter === filter
                          ? 'bg-[#5B4BFF] text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      <span>{filter === 'ALL' ? 'All' : filter === 'PENDING' ? 'Pending' : 'Evaluated'}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          applicantFilter === filter
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {filter === 'ALL'
                          ? applicants.length
                          : filter === 'PENDING'
                          ? pendingApplicantsCount
                          : evaluatedApplicantsCount}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* TAB: QUEUE */}
            {activeTab === 'QUEUE' && (
              <div className="bg-white dark:bg-slate-900 rounded-[22px] shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search student by name, roll number, topic..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                    />
                  </div>
                </div>

                {filteredSubmissions.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="font-bold text-sm">No submissions match the current filter</p>
                    <p className="text-xs">Student logbook submissions will appear here for evaluation.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="py-3.5 px-4">Student Candidate</th>
                          <th className="py-3.5 px-4">Topic / Deliverable</th>
                          <th className="py-3.5 px-4">Submitted At</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4">Score / Remarks</th>
                          <th className="py-3.5 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredSubmissions.map((sub) => (
                          <tr key={sub.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900 dark:text-white">{sub.student_name}</div>
                              <div className="text-[11px] text-slate-500 font-mono">{sub.rollno || sub.registration_no || 'Reg N/A'}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-800 dark:text-slate-200">{sub.topic_title}</div>
                              {sub.file_url && (
                                <a
                                  href={sub.file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] text-[#5B4BFF] hover:underline flex items-center gap-1 mt-0.5"
                                >
                                  <span>{sub.file_name || 'View Attachment'}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-slate-500">
                              {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : 'N/A'}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  sub.status === 'EVALUATED'
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                }`}
                              >
                                {sub.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {sub.status === 'EVALUATED' ? (
                                <div>
                                  <div className="font-bold text-emerald-600">{sub.marks_obtained} / {sub.max_marks || 100}</div>
                                  <div className="text-[11px] text-slate-500 truncate max-w-xs">{sub.remarks || 'Approved'}</div>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">Pending Evaluation</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleOpenEvaluate(sub)}
                                className="px-3 py-1.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4338CA] text-white font-bold text-xs shadow-sm transition-all"
                              >
                                {sub.status === 'EVALUATED' ? 'Re-Evaluate' : 'Review & Grade'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB: SEMINARS / TUTORIALS */}
            {activeTab === 'SEMINARS_TUTORIALS' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <Presentation className="w-5 h-5 text-[#F36C21]" />
                      <span>Seminar &amp; Tutorial Assignments Hub</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Publish seminar presentations, problem sheets &amp; tutorial sheets targeting specific courses, branches, batches and semesters.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsPostSeminarTutorialOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-[#F36C21] hover:bg-[#E05B10] text-white font-bold text-xs shadow-lg shadow-[#F36C21]/25 flex items-center gap-2 transition-all scale-[1.02]"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Post Seminar / Tutorial</span>
                    </button>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2">
                  {(['ALL', 'SEMINAR', 'TUTORIAL'] as const).map((tFilter) => (
                    <button
                      key={tFilter}
                      onClick={() => setTopicTypeFilter(tFilter)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        topicTypeFilter === tFilter
                          ? 'bg-[#2D2575] text-white shadow-sm'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {tFilter === 'ALL' ? 'All Assigned Tasks' : tFilter === 'SEMINAR' ? 'Academic Seminars' : 'Unit Tutorials'}
                    </button>
                  ))}
                </div>

                {/* List of Seminar & Tutorial Topics */}
                {topics.filter((t) => {
                  const isSem = t.category_code === 'SEMINAR' || t.title?.toLowerCase().includes('seminar');
                  const isTut = t.category_code === 'TUTORIAL' || t.title?.toLowerCase().includes('tutorial');
                  if (topicTypeFilter === 'SEMINAR') return isSem;
                  if (topicTypeFilter === 'TUTORIAL') return isTut;
                  return true;
                }).length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-[22px] p-12 text-center border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
                    <Presentation className="w-12 h-12 text-slate-300 mx-auto" />
                    <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">No Seminar / Tutorial Topics Assigned Yet</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Click &quot;Post Seminar / Tutorial&quot; to configure your target cohort, guidelines, max marks and submission deadline.
                    </p>
                    <button
                      onClick={() => setIsPostSeminarTutorialOpen(true)}
                      className="px-4 py-2 rounded-xl bg-[#F36C21] text-white text-xs font-bold"
                    >
                      Post First Seminar / Tutorial
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {topics
                      .filter((t) => {
                        const isSem = t.category_code === 'SEMINAR' || t.title?.toLowerCase().includes('seminar');
                        const isTut = t.category_code === 'TUTORIAL' || t.title?.toLowerCase().includes('tutorial');
                        if (topicTypeFilter === 'SEMINAR') return isSem;
                        if (topicTypeFilter === 'TUTORIAL') return isTut;
                        return true;
                      })
                      .map((t) => {
                        const isSem = t.category_code === 'SEMINAR' || t.title?.toLowerCase().includes('seminar');
                        return (
                          <div
                            key={t.id}
                            className="bg-white dark:bg-slate-900 rounded-[22px] p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4 flex flex-col justify-between"
                          >
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span
                                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                                    isSem
                                      ? 'bg-purple-50 dark:bg-purple-950/60 text-[#5B4BFF] border border-purple-200 dark:border-purple-800'
                                      : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  }`}
                                >
                                  {isSem ? <Presentation className="w-3 h-3 text-[#F36C21]" /> : <BookOpen className="w-3 h-3 text-emerald-600" />}
                                  <span>{isSem ? 'Academic Seminar' : 'Unit Tutorial'}</span>
                                </span>

                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-700 dark:text-slate-300">
                                  Max {t.max_marks} Marks
                                </span>
                              </div>

                              <div>
                                <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug">
                                  {t.title}
                                </h3>
                                {t.description && (
                                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                                    {t.description}
                                  </p>
                                )}
                              </div>

                              {/* Target Hierarchy Badges */}
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {t.course_name && (
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                                    🎓 {t.course_name}
                                  </span>
                                )}
                                {t.batch_name && (
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                                    👥 {t.batch_name}
                                  </span>
                                )}
                                {t.submission_deadline && (
                                  <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-[10px] font-semibold flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Due {new Date(t.submission_deadline).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-500">
                                {t.submission_count || 0} Submissions ({t.evaluated_count || 0} Evaluated)
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSearchQuery(t.title);
                                    setActiveTab('QUEUE');
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
                                >
                                  View Submissions
                                </button>
                                <button
                                  onClick={() => handleDeleteTopic(t.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: MINI PROJECTS */}
            {activeTab === 'MINI_PROJECTS' && (
              <div className="bg-white dark:bg-slate-900 rounded-[22px] p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Assigned Mini Project Topic & Instructions</h2>
                    <p className="text-xs text-slate-500">Students view this in their Mini Project tab and follow guidelines</p>
                  </div>
                  <button
                    onClick={() => setIsAssignProjectModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[#F36C21] hover:bg-[#E05B10] text-white font-bold text-xs shadow-md shadow-[#F36C21]/20 flex items-center gap-2"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>Re-assign / Edit Topic</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Available Assigned Mini Projects Cards Grid */}
                  {miniProjectsList.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Assigned Project Topics ({miniProjectsList.length}) — Select Card to View Students &amp; Evaluate Logs
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {miniProjectsList.map((proj) => {
                          const isSelected = miniProject?.id === proj.id || (!miniProject && miniProjectsList[0]?.id === proj.id);
                          return (
                            <div
                              key={proj.id || proj.title}
                              onClick={() => handleSelectProject(proj)}
                              className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                                isSelected
                                  ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-[#5B4BFF] shadow-sm ring-2 ring-[#5B4BFF]/20'
                                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700 hover:border-indigo-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/70'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <FolderGit2 className={`w-4 h-4 ${isSelected ? 'text-[#5B4BFF]' : 'text-slate-400'}`} />
                                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1">
                                    {proj.title}
                                  </h4>
                                </div>
                                {isSelected && (
                                  <span className="px-2 py-0.5 rounded-full bg-[#5B4BFF] text-white text-[10px] font-bold">
                                    Active Card
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-2 mb-3">
                                {proj.description || 'No description provided.'}
                              </p>
                              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                  Max: {proj.max_marks || 100} Marks
                                </span>
                                <span className="font-bold text-[#2D2575] dark:text-indigo-300">
                                  {proj.students_count !== undefined ? `${proj.students_count} Active Candidates` : 'Track Logs →'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {miniProject ? (
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">
                          {miniProject.title}
                        </h3>
                        <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                          Max Marks: {miniProject.max_marks || 100}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {miniProject.description || 'No description provided.'}
                      </p>

                      {Array.isArray(miniProject.technologies) && miniProject.technologies.length > 0 && (
                        <div className="pt-2">
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mandatory Technology Stack:</div>
                          <div className="flex flex-wrap gap-2">
                            {miniProject.technologies.map((t: string) => (
                              <span
                                key={t}
                                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                              >
                                <Code2 className="w-3.5 h-3.5 text-[#5B4BFF]" />
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {miniProject.prompt_instructions && (
                        <div className="pt-2">
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Student Instructions Prompt:</div>
                          <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            {miniProject.prompt_instructions}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                      <FolderGit2 className="w-8 h-8 text-slate-400 mx-auto" />
                      <div className="text-sm font-bold text-slate-700 dark:text-slate-300">No Mini Project Assigned Yet</div>
                      <p className="text-xs text-slate-500">Click &ldquo;Re-assign / Edit Topic&rdquo; above to create a project topic with required tech stack.</p>
                    </div>
                  )}

                  {/* Student Candidate Applicants & Weekly Milestone Tracking */}
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5B4BFF] uppercase tracking-wider">
                          <Clock className="w-4 h-4" />
                          <span>Enrolled Student Candidate Applicants & Milestone Ledger</span>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Project Applicants & Weekly Submissions</h3>
                        <p className="text-xs text-slate-500">Track candidate progress week-by-week, evaluate deliverables, and grant final grade with lock</p>
                      </div>
                      
                      {/* Filter Badges: All, Pending, Evaluated */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setApplicantFilter('ALL')}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            applicantFilter === 'ALL'
                              ? 'bg-[#2D2575] text-white shadow-sm ring-2 ring-[#2D2575]/20'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>All Candidates</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                              applicantFilter === 'ALL'
                                ? 'bg-[#F36C21] text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {applicants.length}
                          </span>
                        </button>

                        <button
                          onClick={() => setApplicantFilter('PENDING')}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            applicantFilter === 'PENDING'
                              ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/20'
                              : 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pending Evaluation</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                              applicantFilter === 'PENDING'
                                ? 'bg-white text-amber-700'
                                : 'bg-amber-200/80 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                            }`}
                          >
                            {pendingApplicantsCount}
                          </span>
                        </button>

                        <button
                          onClick={() => setApplicantFilter('EVALUATED')}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            applicantFilter === 'EVALUATED'
                              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/20'
                              : 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Evaluated & Locked</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                              applicantFilter === 'EVALUATED'
                                ? 'bg-white text-emerald-700'
                                : 'bg-emerald-200/80 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                            }`}
                          >
                            {evaluatedApplicantsCount}
                          </span>
                        </button>
                      </div>
                    </div>

                    {filteredApplicants.length === 0 ? (
                      <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                        <CalendarDays className="w-8 h-8 text-slate-400 mx-auto" />
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          {applicants.length === 0
                            ? 'No Enrolled Candidates Yet'
                            : `No candidates match "${applicantFilter === 'PENDING' ? 'Pending Evaluation' : 'Evaluated & Locked'}"`}
                        </div>
                        <p className="text-xs text-slate-500">
                          {applicants.length === 0
                            ? 'When students work on this mini project and submit weekly logs, their progress tracking ledger will populate here.'
                            : 'Try selecting "All Candidates" to see all enrolled students.'}
                        </p>
                        {applicants.length > 0 && applicantFilter !== 'ALL' && (
                          <button
                            onClick={() => setApplicantFilter('ALL')}
                            className="px-3.5 py-1.5 rounded-xl bg-[#5B4BFF] text-white text-xs font-bold mt-2"
                          >
                            View All Candidates ({applicants.length})
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                            <tr>
                              <th className="py-3 px-4">Student Candidate</th>
                              <th className="py-3 px-4">Degree & Cohort</th>
                              <th className="py-3 px-4">Weeks Logged</th>
                              <th className="py-3 px-4">Total Hours</th>
                              <th className="py-3 px-4">Project Assets</th>
                              <th className="py-3 px-4">Evaluation Status</th>
                              <th className="py-3 px-4 text-right">Faculty Tracking</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredApplicants.map((app) => {
                              const isLocked = app.is_locked || app.project_status === 'CLOSED';
                              const verifiedLogs = app.weekly_logs?.filter(
                                (w) => w.status === 'VERIFIED' || (w.guide_marks !== undefined && w.guide_marks !== null && Number(w.guide_marks) > 0)
                              ) || [];
                              const totalLogs = app.weekly_logs?.length || 0;
                              const verifiedCount = verifiedLogs.length;
                              const totalVerifiedMarks = verifiedLogs.reduce((sum, w) => sum + Number(w.guide_marks || 0), 0);

                              return (
                                <tr key={app.student_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                  <td className="py-3.5 px-4">
                                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#2D2575] to-[#5B4BFF] text-white flex items-center justify-center font-bold text-xs">
                                        {app.student_name.charAt(0)}
                                      </div>
                                      <div>
                                        <div>{app.student_name}</div>
                                        <div className="text-[11px] text-slate-500 font-mono">{app.rollno || app.registration_no || 'Reg N/A'}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <div className="font-semibold text-slate-800 dark:text-slate-200">{app.course_name || 'BCA'}</div>
                                    <div className="text-[10px] text-slate-500">{app.batch_name || 'Batch 2025'}</div>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <span className="px-2.5 py-1 rounded-lg bg-[#2D2575]/10 text-[#2D2575] dark:text-indigo-300 font-bold text-xs">
                                      {app.total_weeks_logged} Weeks Logged
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <div className="text-xs font-black text-[#5B4BFF]">{app.total_hours_spent}h Devoted</div>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <div className="flex items-center gap-1.5">
                                      {app.repository_url ? (
                                        <a
                                          href={app.repository_url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:text-[#5B4BFF] text-slate-600 dark:text-slate-300 transition-colors"
                                          title="Git Repository"
                                        >
                                          <FolderGit2 className="w-3.5 h-3.5" />
                                        </a>
                                      ) : null}
                                      {app.live_demo_url ? (
                                        <a
                                          href={app.live_demo_url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:text-emerald-600 text-emerald-700 dark:text-emerald-400 transition-colors"
                                          title="Live Demo"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                      ) : null}
                                      {app.documentation_url ? (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setDocPreviewTarget({
                                              url: app.documentation_url || '',
                                              name: app.documentation_name || 'Project_Documentation.pdf',
                                              studentName: app.student_name,
                                              projectTitle: app.project_title || miniProject?.title,
                                            });
                                            setIsDocPreviewOpen(true);
                                          }}
                                          className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-[#5B4BFF] transition-colors border border-indigo-200/60 dark:border-indigo-800/60"
                                          title={`Preview Documentation Report (${app.documentation_name || 'Report'})`}
                                        >
                                          <FileText className="w-3.5 h-3.5" />
                                        </button>
                                      ) : null}
                                      {!app.repository_url && !app.live_demo_url && !app.documentation_url && (
                                        <span className="text-slate-400 text-[11px]">Pending Links</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    {isLocked ? (
                                      <div className="inline-flex flex-col">
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1 shadow-sm">
                                          <Lock className="w-3 h-3 text-emerald-600" />
                                          LOCKED • Grade {app.final_grade || 'A+'} ({app.final_percentage || 90}%)
                                        </span>
                                      </div>
                                    ) : totalLogs > 0 && verifiedCount === totalLogs ? (
                                      <div className="inline-flex flex-col">
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 flex items-center gap-1 shadow-sm">
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                          EVALUATED ({totalVerifiedMarks} Mks)
                                        </span>
                                      </div>
                                    ) : totalLogs > 0 && verifiedCount > 0 ? (
                                      <div className="inline-flex flex-col">
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 flex items-center gap-1 shadow-sm">
                                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                          PARTIALLY EVALUATED ({verifiedCount}/{totalLogs} Wks)
                                        </span>
                                      </div>
                                    ) : totalLogs > 0 ? (
                                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                                        AWAITING EVALUATION
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                        NO LOGS YET
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-4 text-right">
                                    <button
                                      onClick={() => {
                                        setSelectedApplicant(app);
                                        setIsTrackingModalOpen(true);
                                      }}
                                      className="px-3.5 py-2 rounded-xl bg-[#2D2575] hover:bg-[#3730A3] text-white font-bold text-xs shadow-md shadow-[#2D2575]/20 flex items-center gap-1.5 ml-auto transition-all"
                                    >
                                      <Award className="w-3.5 h-3.5 text-[#F36C21]" />
                                      <span>View Tracking & Evaluate</span>
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
              </div>
            )}

            {/* TAB: ALL TOPICS */}
            {activeTab === 'TOPICS' && (
              <div className="bg-white dark:bg-slate-900 rounded-[22px] p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Active Activity Topics ({topics.length})</h2>
                  <button
                    onClick={() => setIsPublishModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4338CA] text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New Topic</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {topics.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-bold text-[#5B4BFF]">{t.category_name}</span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{t.title}</h4>
                        <div className="text-xs text-slate-500 mt-1">
                          Max Marks: {t.max_marks} • Due: {t.submission_deadline ? new Date(t.submission_deadline).toLocaleDateString() : 'None'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSearchQuery(t.title);
                            setActiveTab('QUEUE');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-300"
                        >
                          View Submissions
                        </button>
                        <button
                          onClick={() => handleDeleteTopic(t.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <PublishTopicModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onSuccess={fetchData}
      />

      <PostSeminarTutorialModal
        isOpen={isPostSeminarTutorialOpen}
        onClose={() => setIsPostSeminarTutorialOpen(false)}
        onSuccess={fetchData}
      />

      <LogbookAssignProjectModal
        isOpen={isAssignProjectModalOpen}
        onClose={() => setIsAssignProjectModalOpen(false)}
        onSuccess={fetchData}
      />

      <EvaluateSubmissionModal
        isOpen={isEvaluateModalOpen}
        onClose={() => setIsEvaluateModalOpen(false)}
        submission={selectedSubmission}
        onSuccess={fetchData}
      />

      <LogbookFacultyReviewModal
        isOpen={isUniversalReviewModalOpen}
        onClose={() => setIsUniversalReviewModalOpen(false)}
        onSuccess={fetchData}
        target={reviewTarget}
      />

      <MiniProjectTrackingModal
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
        applicant={selectedApplicant}
        projectTitle={miniProject?.title || 'Mini Project'}
        onSuccess={fetchData}
      />

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={isDocPreviewOpen}
        onClose={() => setIsDocPreviewOpen(false)}
        title="Candidate Project Documentation Report"
        documentUrl={docPreviewTarget?.url}
        documentName={docPreviewTarget?.name}
        studentName={docPreviewTarget?.studentName}
        projectTitle={docPreviewTarget?.projectTitle}
      />
    </div>
  );
}
