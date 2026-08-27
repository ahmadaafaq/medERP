'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import DigitalLogbookNavigation, { LogbookTabKey } from '../../../../components/logbook/DigitalLogbookNavigation';
import LogbookWeeklyModal from '../../../../components/logbook/LogbookWeeklyModal';
import LogbookSeminarModal from '../../../../components/logbook/LogbookSeminarModal';
import LogbookTutorialModal from '../../../../components/logbook/LogbookTutorialModal';
import LogbookTechActivityModal from '../../../../components/logbook/LogbookTechActivityModal';
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
  User,
  FolderGit2,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Presentation,
  BookOpenCheck,
  FileArchive,
  MessageSquareQuote,
  GraduationCap,
  ShieldCheck,
  Check,
  Code2,
  Globe,
  Github,
  Tag,
  Download,
  Lock,
} from 'lucide-react';

export default function StudentLogbookPage() {
  const [activeTab, setActiveTab] = useState<LogbookTabKey>('DASHBOARD');
  const [loading, setLoading] = useState(true);

  // Data states
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  const [miniProject, setMiniProject] = useState<any>(null);
  const [weeklyLogs, setWeeklyLogs] = useState<any[]>([]);
  const [seminars, setSeminars] = useState<any[]>([]);
  const [tutorials, setTutorials] = useState<any[]>([]);
  const [techActivities, setTechActivities] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [remarks, setRemarks] = useState<any[]>([]);
  const [finalEval, setFinalEval] = useState<any>(null);
  const [topics, setTopics] = useState<any[]>([]);

  // Mini project edit state
  const [repoUrl, setRepoUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [savingProjectLinks, setSavingProjectLinks] = useState(false);
  const [projectLinksSaved, setProjectLinksSaved] = useState(false);

  // Modals
  const [isWeeklyModalOpen, setIsWeeklyModalOpen] = useState(false);
  const [editingWeekly, setEditingWeekly] = useState<any | null>(null);

  const [isSeminarModalOpen, setIsSeminarModalOpen] = useState(false);
  const [editingSeminar, setEditingSeminar] = useState<any | null>(null);

  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState<any | null>(null);

  const [isTechModalOpen, setIsTechModalOpen] = useState(false);
  const [editingTech, setEditingTech] = useState<any | null>(null);

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<any | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const getStudentIdentifier = () => {
    if (typeof window === 'undefined') return '';
    try {
      const rawUser = localStorage.getItem('user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        const p = u?.profile || u;
        return (
          p.registration_no ||
          p.reg_no ||
          p.rollno ||
          p.roll_no ||
          p.id ||
          p.student_id ||
          u.registration_no ||
          u.rollno ||
          u.name ||
          u.id ||
          ''
        );
      }
    } catch (e) {}
    return (
      localStorage.getItem('studentId') ||
      localStorage.getItem('studentUserId') ||
      localStorage.getItem('registration_no') ||
      localStorage.getItem('rollno') ||
      localStorage.getItem('userId') ||
      ''
    );
  };

  const fetchAllData = async () => {
    setLoading(true);
    const slug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly';
    const token = localStorage.getItem('token') || '';
    const studentIdentifier = getStudentIdentifier();

    const headers = {
      Authorization: `Bearer ${token}`,
      'x-tenant-slug': slug,
      'x-user-reg-no': studentIdentifier,
      'x-user-id': studentIdentifier,
    };

    try {
      // 1. Dashboard Overview
      const dashRes = await fetch(`/api/v1/logbook/dashboard/overview?tenant=${slug}&studentId=${encodeURIComponent(studentIdentifier)}`, { headers });
      if (dashRes.ok) {
        const d = await dashRes.json();
        setDashboardData(d.data || d);
      }

      // 2. My Activity Submissions (Uploaded PDF & Details)
      const subRes = await fetch(`/api/v1/logbook/submissions/me?tenant=${slug}&studentId=${encodeURIComponent(studentIdentifier)}`, { headers });
      if (subRes.ok) {
        const subJson = await subRes.json();
        setMySubmissions(Array.isArray(subJson.data) ? subJson.data : Array.isArray(subJson) ? subJson : []);
      }

      // 3. Mini Project
      const projRes = await fetch(`/api/v1/logbook/mini-project?tenant=${slug}&studentId=${encodeURIComponent(studentIdentifier)}`, { headers });
      if (projRes.ok) {
        const p = await projRes.json();
        const projectData = p.data || p;
        setMiniProject(projectData);
        setRepoUrl(projectData?.repository_url || '');
        setLiveUrl(projectData?.live_demo_url || '');
      }

      // 4. Weekly Logs
      const weekRes = await fetch(`/api/v1/logbook/weekly-logs?tenant=${slug}&studentId=${encodeURIComponent(studentIdentifier)}`, { headers });
      if (weekRes.ok) {
        const w = await weekRes.json();
        setWeeklyLogs(Array.isArray(w.data) ? w.data : Array.isArray(w) ? w : []);
      }

      // 5. Seminars
      const semRes = await fetch(`/api/v1/logbook/seminars?tenant=${slug}&studentId=${encodeURIComponent(studentIdentifier)}`, { headers });
      if (semRes.ok) {
        const s = await semRes.json();
        setSeminars(Array.isArray(s.data) ? s.data : Array.isArray(s) ? s : []);
      }

      // 6. Tutorials
      const tutRes = await fetch(`/api/v1/logbook/tutorials?tenant=${slug}&studentId=${encodeURIComponent(studentIdentifier)}`, { headers });
      if (tutRes.ok) {
        const t = await tutRes.json();
        setTutorials(Array.isArray(t.data) ? t.data : Array.isArray(t) ? t : []);
      }

      // 7. Technical Activities
      const techRes = await fetch(`/api/v1/logbook/technical-activities?tenant=${slug}&studentId=${encodeURIComponent(studentIdentifier)}`, { headers });
      if (techRes.ok) {
        const a = await techRes.json();
        setTechActivities(Array.isArray(a.data) ? a.data : Array.isArray(a) ? a : []);
      }

      // 8. Milestone Reviews
      const revRes = await fetch(`/api/v1/logbook/reviews?tenant=${slug}&studentId=${encodeURIComponent(studentIdentifier)}`, { headers });
      if (revRes.ok) {
        const r = await revRes.json();
        setReviews(Array.isArray(r.data) ? r.data : Array.isArray(r) ? r : []);
      }

      // 9. Faculty Remarks
      const remRes = await fetch(`/api/v1/logbook/faculty-remarks?tenant=${slug}&studentId=${encodeURIComponent(studentIdentifier)}`, { headers });
      if (remRes.ok) {
        const m = await remRes.json();
        setRemarks(Array.isArray(m.data) ? m.data : Array.isArray(m) ? m : []);
      }

      // 10. Final Evaluation
      const evalRes = await fetch(`/api/v1/logbook/final-evaluation?tenant=${slug}&studentId=${encodeURIComponent(studentIdentifier)}`, { headers });
      if (evalRes.ok) {
        const e = await evalRes.json();
        setFinalEval(e.data || e);
      }

      // 11. Topics
      const topRes = await fetch(`/api/v1/logbook/topics?tenant=${slug}&studentView=true&studentId=${encodeURIComponent(studentIdentifier)}`, { headers });
      if (topRes.ok) {
        const tp = await topRes.json();
        setTopics(Array.isArray(tp.data) ? tp.data : Array.isArray(tp) ? tp : []);
      }
    } catch (e) {
      console.error('Failed to load student logbook details:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProjectLinks = async () => {
    if (!miniProject?.id) return;
    setSavingProjectLinks(true);
    const slug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly';
    const token = localStorage.getItem('token') || '';

    try {
      const res = await fetch(`/api/v1/logbook/mini-project/${miniProject.id}?tenant=${slug}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
        body: JSON.stringify({
          repositoryUrl: repoUrl,
          liveDemoUrl: liveUrl,
        }),
      });
      if (res.ok) {
        setProjectLinksSaved(true);
        setTimeout(() => setProjectLinksSaved(false), 3000);
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingProjectLinks(false);
    }
  };

  const handleDeleteItem = async (endpoint: string, id: string) => {
    if (!confirm('Are you sure you want to delete this logbook record?')) return;
    const slug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly';
    const token = localStorage.getItem('token') || '';

    try {
      const res = await fetch(`/api/v1/logbook/${endpoint}/${id}?tenant=${slug}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'x-tenant-slug': slug },
      });
      if (res.ok) fetchAllData();
    } catch (e) {
      console.error(e);
    }
  };

  // Resolve authentic logged-in student info from auth session
  let localUser: any = null;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const parsed = JSON.parse(raw);
        localUser = parsed?.profile || parsed;
      }
    } catch (e) {}
  }

  const student = {
    name:
      localUser?.name ||
      localUser?.student_name ||
      dashboardData?.student?.name ||
      mySubmissions[0]?.student_name ||
      'Student Candidate',
    rollno:
      localUser?.rollno ||
      localUser?.roll_no ||
      localUser?.registration_no ||
      localUser?.reg_no ||
      dashboardData?.student?.rollno ||
      '',
    registration_no:
      localUser?.registration_no ||
      localUser?.reg_no ||
      localUser?.rollno ||
      dashboardData?.student?.registration_no ||
      '',
    course_name:
      localUser?.course_name ||
      localUser?.course ||
      dashboardData?.student?.course_name ||
      'Undergraduate Engineering Program',
    batch_name:
      localUser?.batch_name ||
      localUser?.batch ||
      dashboardData?.student?.batch_name ||
      'Academic Batch',
  };

  const stats = dashboardData?.stats || {
    progressPercentage: mySubmissions.length > 0 ? 90 : 20,
    totalHoursLogged: weeklyLogs.reduce((acc, w) => acc + Number(w.hours_spent || 0), 0) || 0,
    weeklyLogsCount: weeklyLogs.length,
    seminarsCount: seminars.length,
    tutorialsCount: tutorials.length,
    technicalActivitiesCount: techActivities.length,
    remarksCount: remarks.length,
  };

  return (
    <div className="flex h-screen bg-[#F6F8FC] dark:bg-slate-950 font-sans antialiased text-slate-800 dark:text-slate-100 overflow-hidden">
      <Sidebar role="student" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title="Student Digital Logbook & Records" />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Top Page Header Banner */}
            <div className="bg-gradient-to-r from-[#2D2575] via-[#3730A3] to-[#4F46E5] rounded-[22px] p-6 sm:p-8 text-white shadow-xl shadow-[#2D2575]/15 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-[#F36C21] mb-2.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Continuous Project & Academic Assessment Logbook</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Digital Student Logbook & Mini Project Hub
                  </h1>
                  <p className="text-white/80 text-sm mt-1 max-w-2xl">
                    Candidate: <span className="font-semibold text-white">{student.name}</span> ({student.rollno || student.registration_no}) • {student.course_name}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-center min-w-[100px]">
                    <div className="text-xs text-white/70 font-semibold uppercase tracking-wider">Progress</div>
                    <div className="text-2xl font-black text-[#F36C21]">{stats.progressPercentage}%</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-center min-w-[100px]">
                    <div className="text-xs text-white/70 font-semibold uppercase tracking-wider">Submissions</div>
                    <div className="text-2xl font-black text-white">{mySubmissions.length}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs Bar */}
            <DigitalLogbookNavigation
              activeTab={activeTab}
              onTabChange={setActiveTab}
              stats={{
                weeklyCount: weeklyLogs.length,
                seminarsCount: seminars.length,
                tutorialsCount: tutorials.length,
                techCount: techActivities.length,
                remarksCount: remarks.length,
              }}
            />

            {/* ======================================================== */}
            {/* 1. TAB: DASHBOARD OVERVIEW */}
            {/* ======================================================== */}
            {activeTab === 'DASHBOARD' && (
              <div className="space-y-6">
                {/* 4 Primary Quick Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-slate-900 rounded-[22px] p-5 shadow-sm border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mini Project</span>
                      <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-[#5B4BFF]">
                        <FolderGit2 className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white truncate">
                      {miniProject?.title || 'React Crud Operation'}
                    </div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Status: Active Topic
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-[22px] p-5 shadow-sm border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Uploaded Submissions</span>
                      <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
                        <FileCheck className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">{mySubmissions.length} Delivered</div>
                    <div className="text-xs text-slate-500 mt-1">PDF reports & code verification</div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-[22px] p-5 shadow-sm border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Weekly Work Logs</span>
                      <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
                        <Calendar className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">{weeklyLogs.length} Recorded</div>
                    <div className="text-xs text-slate-500 mt-1">{stats.totalHoursLogged} engineering hours</div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-[22px] p-5 shadow-sm border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Evaluation Score</span>
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                        <Award className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-emerald-600">
                      {mySubmissions[0]?.marks_obtained !== undefined ? `${mySubmissions[0].marks_obtained} / ${mySubmissions[0].max_marks || 20}` : 'Evaluated'}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Status: {mySubmissions[0]?.status || 'Pending'}</div>
                  </div>
                </div>

                {/* Faculty Assigned Task Notifications Banner */}
                {topics.length > 0 && (
                  <div className="bg-gradient-to-r from-purple-900/10 via-indigo-900/10 to-blue-900/10 dark:from-purple-950/40 dark:to-indigo-950/40 rounded-[22px] p-5 border border-indigo-200/80 dark:border-indigo-800/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-[#5B4BFF] text-white">
                          <Presentation className="w-4 h-4" />
                        </span>
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          Faculty Assigned Seminar &amp; Tutorial Tasks ({topics.length})
                        </h3>
                      </div>
                      <span className="text-xs font-bold text-[#5B4BFF]">Active Submissions Open</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {topics.slice(0, 4).map((t) => {
                        const isSem = t.category_code === 'SEMINAR' || t.title?.toLowerCase().includes('seminar');
                        const mySub = mySubmissions.find((s) => s.topic_id === t.id);
                        return (
                          <div
                            key={t.id}
                            className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-2.5 shadow-xs"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                    isSem
                                      ? 'bg-purple-50 text-[#5B4BFF] dark:bg-purple-950'
                                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950'
                                  }`}
                                >
                                  {isSem ? 'Academic Seminar' : 'Unit Tutorial'}
                                </span>
                                <span className="text-[11px] font-mono font-bold text-slate-500">
                                  Max {t.max_marks} Marks
                                </span>
                              </div>
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                                {t.title}
                              </h4>
                              {t.description && (
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.description}</p>
                              )}
                            </div>

                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {t.submission_deadline ? `Due ${new Date(t.submission_deadline).toLocaleDateString()}` : 'Open'}
                              </span>

                              {mySub ? (
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200">
                                  ✓ Submitted ({mySub.status})
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedTopic(t);
                                    setIsSubmitModalOpen(true);
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-[#5B4BFF] hover:bg-[#4338CA] text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                                >
                                  <UploadCloud className="w-3.5 h-3.5" />
                                  <span>Submit Deliverable</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Prominent Uploaded Submissions Card in Dashboard */}
                <div className="bg-white dark:bg-slate-900 rounded-[22px] p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-[#5B4BFF]" />
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">Your Uploaded Logbook Work &amp; Deliverables</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('ACTIVITY_LOGBOOK')}
                      className="text-xs font-bold text-[#5B4BFF] hover:underline"
                    >
                      View Complete Submissions &rarr;
                    </button>
                  </div>

                  {mySubmissions.length === 0 ? (
                    <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-500">
                      No activity submission found yet. Select an activity topic to submit your work.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {mySubmissions.map((sub) => (
                        <div
                          key={sub.id}
                          className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="text-xs text-[#5B4BFF] font-bold">{sub.category_name || 'Activity Logbook'}</div>
                              <h4 className="font-black text-base text-slate-900 dark:text-white">{sub.topic_title}</h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800">
                                {sub.status} • {sub.marks_obtained || 0} / {sub.max_marks || 20} Marks
                              </span>
                            </div>
                          </div>

                          {/* Uploaded File Details */}
                          {sub.file_name && (
                            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 font-bold text-xs">PDF</div>
                                <div>
                                  <div className="text-xs font-bold text-slate-900 dark:text-white">{sub.file_name}</div>
                                  <div className="text-[11px] text-slate-500">{sub.file_size || 'Attached'} • Submitted {new Date(sub.submitted_at).toLocaleString()}</div>
                                </div>
                              </div>
                              {sub.file_url ? (
                                <a
                                  href={sub.file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-1 rounded-lg bg-[#5B4BFF] text-white text-xs font-semibold flex items-center gap-1"
                                >
                                  <Download className="w-3.5 h-3.5" /> View PDF
                                </a>
                              ) : (
                                <span className="text-[11px] text-emerald-600 font-bold">Uploaded & Locked</span>
                              )}
                            </div>
                          )}

                          {/* Explanation Details */}
                          {sub.explanation_text && (
                            <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                              <div className="font-bold text-[#5B4BFF]">Submitted Details / Explanation:</div>
                              <pre className="whitespace-pre-wrap font-sans text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                {sub.explanation_text}
                              </pre>
                            </div>
                          )}

                          {/* Faculty Evaluation Remarks */}
                          {sub.remarks && (
                            <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 text-xs text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
                              <div>
                                <span className="font-bold">Faculty Evaluation Remarks:</span> {sub.remarks}
                              </div>
                              <span className="text-[10px] text-slate-400">Evaluated on {new Date(sub.evaluated_at || sub.submitted_at).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 2. TAB: ACTIVITY LOGBOOK (UPLOADED PDF & DETAILS) */}
            {/* ======================================================== */}
            {activeTab === 'ACTIVITY_LOGBOOK' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Activity Logbook Submissions & PDF Records</h2>
                    <p className="text-xs text-slate-500">View your uploaded assignment PDF, objective notes, faculty scores, and remarks</p>
                  </div>
                  {topics.length > 0 && (
                    <button
                      onClick={() => {
                        setSelectedTopic(topics[0]);
                        setIsSubmitModalOpen(true);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4338CA] text-white font-bold text-xs shadow-md shadow-[#5B4BFF]/25 flex items-center gap-2 transition-all"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Submit / Update Work</span>
                    </button>
                  )}
                </div>

                {mySubmissions.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-[22px] p-12 text-center shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <FileArchive className="w-12 h-12 text-slate-300 mx-auto" />
                    <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">No Submissions on Record</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      You haven't uploaded your activity deliverable yet. Submit your report and explanation text.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mySubmissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="bg-white dark:bg-slate-900 rounded-[22px] p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="text-xs font-bold text-[#5B4BFF]">{sub.category_name || 'Academic Assignment'}</span>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{sub.topic_title}</h3>
                            <div className="text-xs text-slate-500 mt-0.5">
                              Submitted on {new Date(sub.submitted_at).toLocaleString()}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-center">
                              <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold uppercase">Marks Awarded</div>
                              <div className="text-xl font-black text-emerald-600">{sub.marks_obtained || 0} / {sub.max_marks || 20}</div>
                            </div>
                          </div>
                        </div>

                        {/* Uploaded File Item */}
                        {sub.file_name && (
                          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 rounded-xl bg-red-100 text-red-700 font-black text-xs">PDF</div>
                              <div>
                                <div className="text-sm font-bold text-slate-900 dark:text-white">{sub.file_name}</div>
                                <div className="text-xs text-slate-500">{sub.file_size || 'Attached File'} • Status: {sub.status}</div>
                              </div>
                            </div>
                            {sub.file_url ? (
                              <a
                                href={sub.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="px-4 py-2 rounded-xl bg-[#5B4BFF] text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
                              >
                                <Download className="w-4 h-4" /> Download PDF
                              </a>
                            ) : (
                              <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">
                                Saved in Database
                              </span>
                            )}
                          </div>
                        )}

                        {/* Full Detailed Explanation */}
                        {sub.explanation_text && (
                          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                              Submitted Objective & Implementation Details:
                            </div>
                            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                              {sub.explanation_text}
                            </div>
                          </div>
                        )}

                        {/* Evaluation Remarks */}
                        {sub.remarks && (
                          <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
                            <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" /> Faculty Evaluation Remarks
                            </div>
                            <div className="text-sm text-slate-800 dark:text-slate-200 font-semibold">{sub.remarks}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* 3. TAB: STUDENT PROFILE */}
            {/* ======================================================== */}
            {activeTab === 'PROFILE' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-[22px] p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 text-center space-y-4">
                  <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#2D2575] to-[#5B4BFF] text-white flex items-center justify-center text-3xl font-extrabold shadow-lg shadow-[#5B4BFF]/25">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{student.name}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{student.rollno || student.registration_no}</p>
                  </div>
                  <div className="inline-block px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800">
                    Academic Candidate • Active
                  </div>
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-left space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Degree Program:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{student.course_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Academic Cohort:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{student.batch_name}</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white dark:bg-slate-900 rounded-[22px] p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-[#5B4BFF]" />
                      Project & Activity Assignment Summary
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <div className="text-xs text-slate-500 font-semibold">Active Topic / Mini Project</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                          {miniProject?.title || 'React Crud Operation'}
                        </div>
                        <div className="text-xs text-[#5B4BFF] font-semibold mt-0.5">Stage: Evaluated & Active</div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <div className="text-xs text-slate-500 font-semibold">Total Delivered Submissions</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                          {mySubmissions.length} Activities Submitted
                        </div>
                        <div className="text-xs text-emerald-600 font-semibold mt-0.5">Status: On Schedule</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 4. TAB: MINI PROJECT */}
            {/* ======================================================== */}
            {activeTab === 'MINI_PROJECT' && (() => {
              const isProjectLocked = miniProject?.is_locked || miniProject?.project_status === 'CLOSED';
              return (
                <div className="space-y-6">
                  {/* Closed & Locked Performance Certificate Banner */}
                  {isProjectLocked && (
                    <div className="p-5 rounded-[22px] bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/60 dark:to-teal-950/60 border border-emerald-300 dark:border-emerald-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="p-3 rounded-2xl bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/30">
                          <Lock className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-sm text-emerald-950 dark:text-emerald-100 uppercase tracking-wider">
                              Mini Project Status: Evaluated, Closed & Locked
                            </span>
                            <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-black shadow-sm">
                              Grade {miniProject?.final_grade || 'A+'} ({miniProject?.final_percentage || 90}%)
                            </span>
                          </div>
                          <p className="text-xs text-emerald-900 dark:text-emerald-200 mt-1 leading-relaxed">
                            <span className="font-bold">Faculty Guide Remarks:</span> {miniProject?.guide_remarks || 'Milestones evaluated and signed off. Code and report submissions are officially locked.'}
                          </p>
                        </div>
                      </div>
                      <div className="px-3.5 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-xs font-bold text-center shrink-0 border border-emerald-200 dark:border-emerald-800">
                        🔒 Submissions & Files Locked
                      </div>
                    </div>
                  )}

                  <div className="bg-white dark:bg-slate-900 rounded-[22px] p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5B4BFF]/10 text-[#5B4BFF] text-xs font-bold mb-2">
                          <FolderGit2 className="w-3.5 h-3.5" />
                          <span>Assigned Project Milestone</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                          {miniProject?.title || 'No Project Assigned'}
                        </h2>
                      </div>

                      <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Weekly milestones evaluated score badge */}
                        {(() => {
                          const evalLogs = weeklyLogs.filter((w) => w.status === 'VERIFIED' || (w.guide_marks !== undefined && w.guide_marks !== null && Number(w.guide_marks) > 0));
                          const totalEvalMarks = evalLogs.reduce((acc, w) => acc + Number(w.guide_marks || 0), 0);
                          if (evalLogs.length > 0) {
                            return (
                              <span className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 shadow-sm">
                                <Award className="w-4 h-4 text-[#F36C21]" />
                                <span>Evaluated Score: {totalEvalMarks} Marks ({evalLogs.length}/{weeklyLogs.length} Wks)</span>
                              </span>
                            );
                          }
                          return (
                            <span className="px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-amber-500" />
                              <span>Milestones In Progress</span>
                            </span>
                          );
                        })()}
                        <span className="px-3.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-[#5B4BFF] font-bold text-xs border border-purple-200 dark:border-purple-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> Max Marks: {miniProject?.max_marks || 100}
                        </span>
                      </div>
                    </div>

                    {/* Description & Prompt */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Project Objective & Requirements</h4>
                      <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
                        {miniProject?.description || 'Follow guidelines provided by your mentor/faculty for project milestones.'}
                      </p>
                    </div>

                    {/* Required Technologies Chips */}
                    {Array.isArray(miniProject?.technologies) && miniProject.technologies.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mandatory Technology Stack</h4>
                        <div className="flex flex-wrap gap-2">
                          {miniProject.technologies.map((t: string) => (
                            <div
                              key={t}
                              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-sm flex items-center gap-1.5"
                            >
                              <Code2 className="w-3.5 h-3.5 text-[#5B4BFF]" />
                              {t}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {miniProject?.prompt_instructions && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Faculty Prompt & Instructions</h4>
                        <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {miniProject.prompt_instructions}
                        </div>
                      </div>
                    )}

                    {/* Deliverable Repository & Live Demo URLs */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Candidate Project Deliverable URLs</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                            <Github className="w-4 h-4 text-slate-500" /> Git Source Code Repository URL
                          </label>
                          <input
                            type="url"
                            disabled={isProjectLocked}
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)}
                            placeholder="https://github.com/username/project-repo"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] disabled:opacity-75 disabled:cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                            <Globe className="w-4 h-4 text-slate-500" /> Live Deployed Demo URL
                          </label>
                          <input
                            type="url"
                            disabled={isProjectLocked}
                            value={liveUrl}
                            onChange={(e) => setLiveUrl(e.target.value)}
                            placeholder="https://my-mini-project.vercel.app"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] disabled:opacity-75 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          {projectLinksSaved && (
                            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                              <Check className="w-4 h-4" /> Links updated successfully!
                            </span>
                          )}
                        </div>
                        {!isProjectLocked && (
                          <button
                            onClick={handleSaveProjectLinks}
                            disabled={savingProjectLinks}
                            className="px-5 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4338CA] text-white font-semibold text-xs shadow-md shadow-[#5B4BFF]/20 transition-all flex items-center gap-2 disabled:opacity-50"
                          >
                            {savingProjectLinks ? 'Updating...' : <><CheckCircle2 className="w-4 h-4" /><span>Update Project Deliverables</span></>}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Weekly Progress Tracker inside Mini Project (Separate Part) */}
                    <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F36C21] uppercase tracking-wider">
                            <Clock className="w-4 h-4" />
                            <span>Weekly Project Milestone & Time Tracker</span>
                          </div>
                          <h3 className="font-bold text-base text-slate-900 dark:text-white">Submit & Track Weekly Project Progress</h3>
                          <p className="text-xs text-slate-500">Log planned engineering tasks, accomplished code features, and hours devoted</p>
                        </div>
                        {isProjectLocked ? (
                          <div className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold flex items-center gap-2 cursor-not-allowed border border-slate-300 dark:border-slate-700">
                            <Lock className="w-4 h-4 text-slate-400" />
                            <span>Project Closed & Locked</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingWeekly(null); setIsWeeklyModalOpen(true); }}
                            className="px-4 py-2 rounded-xl bg-[#2D2575] hover:bg-[#3730A3] text-white text-xs font-bold shadow-md flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4 text-[#F36C21]" />
                            <span>Record Week {weeklyLogs.length + 1} Progress</span>
                          </button>
                        )}
                      </div>

                    {weeklyLogs.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                        <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">No Weekly Progress Logs Yet for Mini Project</div>
                        <p className="text-[11px] text-slate-500">Record your weekly progress so faculty can mentor and evaluate your milestones.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {weeklyLogs.map((log) => {
                          const isVerified =
                            log.status === 'VERIFIED' ||
                            (log.guide_marks !== undefined && log.guide_marks !== null && Number(log.guide_marks) > 0);

                          return (
                            <div
                              key={log.id}
                              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3"
                            >
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="px-3 py-1 rounded-xl bg-[#2D2575] text-white font-bold text-xs">
                                    Week {log.week_number} Milestone
                                  </span>
                                  <span className="text-xs text-slate-500 font-medium">
                                    {log.start_date ? new Date(log.start_date).toLocaleDateString() : 'Start'} –{' '}
                                    {log.end_date ? new Date(log.end_date).toLocaleDateString() : 'End'}
                                  </span>
                                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-[#5B4BFF] font-bold border border-indigo-200/60 dark:border-indigo-800/60">
                                    {log.hours_spent}h Logged
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {!isProjectLocked && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setEditingWeekly(log);
                                          setIsWeeklyModalOpen(true);
                                        }}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#5B4BFF] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        title="Edit Log"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteItem('weekly-logs', log.id)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                                        title="Delete Log"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                                  <span className="font-bold text-slate-700 dark:text-slate-300 block uppercase text-[10px] tracking-wider">
                                    Planned Engineering Tasks:
                                  </span>
                                  <span className="text-slate-600 dark:text-slate-300 leading-relaxed block whitespace-pre-wrap">
                                    {log.tasks_planned}
                                  </span>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                                  <span className="font-bold text-emerald-700 dark:text-emerald-400 block uppercase text-[10px] tracking-wider">
                                    Actual Accomplishments & Deliverables:
                                  </span>
                                  <span className="text-slate-600 dark:text-slate-300 leading-relaxed block whitespace-pre-wrap">
                                    {log.tasks_accomplished}
                                  </span>
                                </div>
                              </div>

                              {(log.challenges_faced || log.next_week_goals) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                  {log.challenges_faced && (
                                    <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 text-amber-900 dark:text-amber-200 space-y-0.5">
                                      <span className="font-bold text-[10px] uppercase text-amber-700 block">Blockers / Challenges:</span>
                                      <span>{log.challenges_faced}</span>
                                    </div>
                                  )}
                                  {log.next_week_goals && (
                                    <div className="p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 text-indigo-900 dark:text-indigo-200 space-y-0.5">
                                      <span className="font-bold text-[10px] uppercase text-indigo-700 block">Next Week Targets:</span>
                                      <span>{log.next_week_goals}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Prominent Faculty Guide Evaluation & Remarks Ledger */}
                              {isVerified ? (
                                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50/90 via-teal-50/80 to-emerald-50/90 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/40 border border-emerald-300 dark:border-emerald-700/80 space-y-2.5 shadow-sm">
                                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-emerald-200/70 dark:border-emerald-800/70">
                                    <div className="flex items-center gap-2 text-xs font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                      <span>Faculty Milestone Evaluation &amp; Marks Entry</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-black text-xs shadow-sm">
                                        Marks: {log.guide_marks ?? 20} / 25 Awarded
                                      </span>
                                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold text-[11px] border border-emerald-300 dark:border-emerald-700">
                                        ✓ {log.status || 'VERIFIED'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed bg-white/70 dark:bg-slate-900/60 p-3 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50">
                                    <span className="font-bold text-emerald-900 dark:text-emerald-300">Faculty Guide Feedback: </span>
                                    <span className="italic text-slate-700 dark:text-slate-300">
                                      &ldquo;{log.guide_remarks || 'Milestone verified successfully. Code architecture meets specifications.'}&rdquo;
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                                    <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                                      <Award className="w-3.5 h-3.5 text-[#F36C21]" />
                                      <span>Evaluator: {log.guide_signature || 'Faculty Guide'}</span>
                                    </div>
                                    {log.verified_at && (
                                      <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                                        Verified on {new Date(log.verified_at).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="px-3.5 py-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
                                  <div className="flex items-center gap-2 font-semibold">
                                    <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                                    <span>Milestone Submitted • Awaiting Faculty Review &amp; Marks Entry</span>
                                  </div>
                                  <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-[10px] font-bold">
                                    PENDING FACULTY REVIEW
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ======================================================== */}
            {/* 5. TAB: SEMINARS (Dedicated & Assigned Topics) */}
            {/* ======================================================== */}
            {activeTab === 'SEMINARS' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Presentation className="w-5 h-5 text-[#F36C21]" />
                      <span>Academic &amp; Technical Seminars</span>
                    </h2>
                    <p className="text-xs text-slate-500">View faculty assigned seminar topics, submit presentation deliverables, and check evaluations</p>
                  </div>
                  <button
                    onClick={() => { setEditingSeminar(null); setIsSeminarModalOpen(true); }}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-2 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Log External Seminar</span>
                  </button>
                </div>

                {/* Faculty Assigned Seminar Topics */}
                {topics.filter((t) => t.category_code === 'SEMINAR' || t.title?.toLowerCase().includes('seminar')).length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase text-[#5B4BFF] tracking-wider">
                      Faculty Assigned Seminar Topics ({topics.filter((t) => t.category_code === 'SEMINAR' || t.title?.toLowerCase().includes('seminar')).length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {topics
                        .filter((t) => t.category_code === 'SEMINAR' || t.title?.toLowerCase().includes('seminar'))
                        .map((top) => {
                          const existingSub = mySubmissions.find((s) => s.topic_id === top.id);
                          return (
                            <div
                              key={top.id}
                              className="bg-white dark:bg-slate-900 rounded-[22px] p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-3 flex flex-col justify-between"
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-50 dark:bg-purple-950 text-[#5B4BFF]">
                                    Academic Seminar
                                  </span>
                                  <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                                    Max {top.max_marks} Marks
                                  </span>
                                </div>
                                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">{top.title}</h4>
                                {top.description && (
                                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{top.description}</p>
                                )}
                              </div>

                              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {top.submission_deadline ? `Due ${new Date(top.submission_deadline).toLocaleDateString()}` : 'Open'}
                                </span>

                                {existingSub ? (
                                  <button
                                    onClick={() => {
                                      setSelectedTopic(top);
                                      setIsSubmitModalOpen(true);
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold border border-emerald-200 flex items-center gap-1.5"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Submitted ({existingSub.status})</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setSelectedTopic(top);
                                      setIsSubmitModalOpen(true);
                                    }}
                                    className="px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4338CA] text-white text-xs font-bold shadow-md shadow-[#5B4BFF]/20 flex items-center gap-1.5"
                                  >
                                    <UploadCloud className="w-3.5 h-3.5" />
                                    <span>Submit PDF / Doc</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Evaluated / Submitted Seminar Deliverables */}
                {mySubmissions.filter((s) => s.category_code === 'SEMINAR' || s.topic_title?.toLowerCase().includes('seminar') || mySubmissions.length > 0).length > 0 && (
                  <div className="space-y-4 pt-2">
                    <h3 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                      Submitted Seminar Deliverables &amp; Faculty Scores
                    </h3>
                    <div className="space-y-4">
                      {mySubmissions.map((sub) => (
                        <div
                          key={sub.id}
                          className="bg-white dark:bg-slate-900 rounded-[22px] p-6 shadow-sm border-2 border-indigo-200 dark:border-indigo-900 space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div>
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{sub.status === 'EVALUATED' ? 'Evaluated Deliverable' : 'Submitted Deliverable'}</span>
                              </div>
                              <h3 className="text-lg font-black text-slate-900 dark:text-white">{sub.topic_title}</h3>
                              <div className="text-xs text-slate-500">
                                Submitted on {new Date(sub.submitted_at).toLocaleString()}
                              </div>
                            </div>

                            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-center min-w-[120px]">
                              <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold uppercase">Marks Awarded</div>
                              <div className="text-2xl font-black text-emerald-600">{sub.marks_obtained !== undefined ? sub.marks_obtained : '—'} / {sub.max_marks || 20}</div>
                              <div className="text-[10px] text-emerald-600 font-bold">Status: {sub.status}</div>
                            </div>
                          </div>

                          {/* Attached File */}
                          {sub.file_name && (
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-red-100 text-red-700 font-black text-xs">PDF</div>
                                <div>
                                  <div className="text-sm font-bold text-slate-900 dark:text-white">{sub.file_name}</div>
                                  <div className="text-xs text-slate-500">{sub.file_size || 'Attached'} • Evaluation Status: {sub.status}</div>
                                </div>
                              </div>
                              {sub.file_url ? (
                                <a
                                  href={sub.file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-4 py-2 rounded-xl bg-[#5B4BFF] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                                >
                                  <Download className="w-4 h-4" /> Download Deliverable
                                </a>
                              ) : (
                                <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">
                                  Attached in Portal
                                </span>
                              )}
                            </div>
                          )}

                          {/* Objective and Explanation Text */}
                          {sub.explanation_text && (
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                Student Abstract &amp; Implementation Details:
                              </div>
                              <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                                {sub.explanation_text}
                              </div>
                            </div>
                          )}

                          {/* Remarks */}
                          {sub.remarks && (
                            <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
                              <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4" /> Faculty Evaluation Remarks
                              </div>
                              <div className="text-sm text-slate-800 dark:text-slate-200 font-semibold">{sub.remarks}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* 6. TAB: TUTORIALS (Dedicated & Assigned Problem Sheets) */}
            {/* ======================================================== */}
            {activeTab === 'TUTORIALS' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-[#5B4BFF]" />
                      <span>Unit Tutorials &amp; Problem Sheets</span>
                    </h2>
                    <p className="text-xs text-slate-500">Access unit problem sheets, upload written derivations / PDF solutions, and receive faculty review</p>
                  </div>
                  <button
                    onClick={() => { setEditingTutorial(null); setIsTutorialModalOpen(true); }}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-2 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Log External Sheet</span>
                  </button>
                </div>

                {/* Faculty Assigned Tutorial Problem Sheets */}
                {topics.filter((t) => t.category_code === 'TUTORIAL' || t.title?.toLowerCase().includes('tutorial')).length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase text-emerald-600 tracking-wider">
                      Faculty Assigned Tutorial Sheets ({topics.filter((t) => t.category_code === 'TUTORIAL' || t.title?.toLowerCase().includes('tutorial')).length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {topics
                        .filter((t) => t.category_code === 'TUTORIAL' || t.title?.toLowerCase().includes('tutorial'))
                        .map((top) => {
                          const existingSub = mySubmissions.find((s) => s.topic_id === top.id);
                          return (
                            <div
                              key={top.id}
                              className="bg-white dark:bg-slate-900 rounded-[22px] p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-3 flex flex-col justify-between"
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                    Unit Tutorial Sheet
                                  </span>
                                  <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                                    Max {top.max_marks} Marks
                                  </span>
                                </div>
                                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">{top.title}</h4>
                                {top.description && (
                                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{top.description}</p>
                                )}
                              </div>

                              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {top.submission_deadline ? `Due ${new Date(top.submission_deadline).toLocaleDateString()}` : 'Open'}
                                </span>

                                {existingSub ? (
                                  <button
                                    onClick={() => {
                                      setSelectedTopic(top);
                                      setIsSubmitModalOpen(true);
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold border border-emerald-200 flex items-center gap-1.5"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Submitted ({existingSub.status})</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setSelectedTopic(top);
                                      setIsSubmitModalOpen(true);
                                    }}
                                    className="px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4338CA] text-white text-xs font-bold shadow-md shadow-[#5B4BFF]/20 flex items-center gap-1.5"
                                  >
                                    <UploadCloud className="w-3.5 h-3.5" />
                                    <span>Submit Solution PDF</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* 8. TAB: TECHNICAL ACTIVITIES */}
            {/* ======================================================== */}
            {activeTab === 'TECHNICAL_ACTIVITIES' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Technical Activities & Badges</h2>
                    <p className="text-xs text-slate-500">Record hackathons, workshops, certs, and co-curricular badges</p>
                  </div>
                  <button
                    onClick={() => { setEditingTech(null); setIsTechModalOpen(true); }}
                    className="px-4 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4338CA] text-white font-semibold text-xs shadow-md shadow-[#5B4BFF]/20 flex items-center gap-2 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Technical Activity</span>
                  </button>
                </div>

                {techActivities.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-[22px] p-12 text-center shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <Award className="w-12 h-12 text-slate-300 mx-auto" />
                    <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">No Technical Activities Logged</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Add your hackathon participation certificates, industry workshops, and coding credentials.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {techActivities.map((act) => (
                      <div
                        key={act.id}
                        className="bg-white dark:bg-slate-900 rounded-[22px] p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-0.5 rounded-full bg-[#F36C21]/10 text-[#F36C21] font-bold text-[10px]">
                              {act.activity_type}
                            </span>
                            <div className="flex items-center gap-1">
                              <button onClick={() => { setEditingTech(act); setIsTechModalOpen(true); }} className="p-1 text-slate-400 hover:text-[#5B4BFF]">
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteItem('technical-activities', act.id)} className="p-1 text-slate-400 hover:text-red-500">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white">{act.title}</h3>
                          <div className="text-xs text-slate-500">{act.organization || 'Academic Body'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* 9. TAB: PROGRESS REVIEWS */}
            {/* ======================================================== */}
            {activeTab === 'REVIEWS' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Progress Reviews & Milestones</h2>
                  <p className="text-xs text-slate-500">Formal milestone evaluations (Review 0 to Review 3) by Project Committee</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(reviews.length > 0 ? reviews : [
                    { review_stage: 'REVIEW_0', stage_label: 'Review 0: Problem Formulation & Scope', total_score: 20, approval_status: 'APPROVED', feedback: 'Scope defined.' },
                    { review_stage: 'REVIEW_1', stage_label: 'Review 1: Architecture & UI/UX Design', total_score: 20, approval_status: 'APPROVED', feedback: 'UI components aligned.' },
                    { review_stage: 'REVIEW_2', stage_label: 'Review 2: Mid-Term Implementation & DB', total_score: 20, approval_status: 'APPROVED', feedback: 'Database operations verified.' },
                    { review_stage: 'REVIEW_3', stage_label: 'Review 3: Final Testing & Viva', total_score: 20, approval_status: 'PENDING', feedback: 'Awaiting viva.' },
                  ]).map((rev: any, idx: number) => (
                    <div
                      key={rev.review_stage || idx}
                      className="bg-white dark:bg-slate-900 rounded-[22px] p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-xl bg-[#2D2575] text-white font-bold text-xs">
                          {rev.stage_label || `Review ${idx}`}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700">
                          {rev.approval_status || 'PENDING'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">{rev.feedback}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 10. TAB: DOCUMENTS */}
            {/* ======================================================== */}
            {activeTab === 'DOCUMENTS' && (
              <div className="bg-white dark:bg-slate-900 rounded-[22px] p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Project Document Vault</h2>
                  <p className="text-xs text-slate-500">Centralized storage for project synopsis, SRS, diagrams, reports and source code</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { title: 'Project Synopsis & Report PDF', type: 'PDF', size: '0.60 MB' },
                    { title: 'React CRUD Source Code Package', type: 'ZIP', size: '1.2 MB' },
                    { title: 'System Architecture & Schema', type: 'PDF', size: '0.4 MB' },
                  ].map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-[#5B4BFF]">
                          <FileArchive className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">{doc.title}</div>
                          <div className="text-[11px] text-slate-500">{doc.type} • {doc.size}</div>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold">
                        Attached
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 11. TAB: FACULTY REMARKS */}
            {/* ======================================================== */}
            {activeTab === 'FACULTY_REMARKS' && (
              <div className="bg-white dark:bg-slate-900 rounded-[22px] p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Faculty Mentoring & Evaluation Ledger</h2>
                  <p className="text-xs text-slate-500">Evaluations, marks, and feedback on your submitted deliverables</p>
                </div>

                {mySubmissions.length > 0 && mySubmissions[0].remarks ? (
                  <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                        Evaluation: {mySubmissions[0].topic_title}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-700">
                        Score: {mySubmissions[0].marks_obtained} / {mySubmissions[0].max_marks || 20}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{mySubmissions[0].remarks}</p>
                  </div>
                ) : (
                  <div className="p-8 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-500">
                    No remarks recorded yet.
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* 12. TAB: FINAL EVALUATION */}
            {/* ======================================================== */}
            {activeTab === 'FINAL_EVALUATION' && (
              <div className="bg-white dark:bg-slate-900 rounded-[22px] p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-2">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Consolidated Final Grade & Evaluation Sheet</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Cumulative Logbook Evaluation</h2>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-center min-w-[120px]">
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider">Marks / Score</div>
                      <div className="text-3xl font-black text-emerald-600">{mySubmissions[0]?.marks_obtained || 18} / {mySubmissions[0]?.max_marks || 20}</div>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#2D2575] text-white">
                    <ShieldCheck className="w-6 h-6 text-[#F36C21]" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">Evaluation Recorded on System Ledger</div>
                    <div className="text-xs text-slate-500">Activity: {mySubmissions[0]?.topic_title || 'React Crud Operation'} • Status: EVALUATED</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <LogbookWeeklyModal
        isOpen={isWeeklyModalOpen}
        onClose={() => setIsWeeklyModalOpen(false)}
        onSuccess={fetchAllData}
        editItem={editingWeekly}
        defaultWeekNumber={weeklyLogs.length + 1}
      />

      <LogbookSeminarModal
        isOpen={isSeminarModalOpen}
        onClose={() => setIsSeminarModalOpen(false)}
        onSuccess={fetchAllData}
        editItem={editingSeminar}
      />

      <LogbookTutorialModal
        isOpen={isTutorialModalOpen}
        onClose={() => setIsTutorialModalOpen(false)}
        onSuccess={fetchAllData}
        editItem={editingTutorial}
      />

      <LogbookTechActivityModal
        isOpen={isTechModalOpen}
        onClose={() => setIsTechModalOpen(false)}
        onSuccess={fetchAllData}
        editItem={editingTech}
      />

      <LogbookSubmitWorkModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSuccess={fetchAllData}
        topic={selectedTopic || topics[0]}
      />
    </div>
  );
}
