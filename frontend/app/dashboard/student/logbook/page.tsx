'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import DigitalLogbookNavigation, { LogbookTabKey } from '../../../../components/logbook/DigitalLogbookNavigation';
import LogbookWeeklyModal from '../../../../components/logbook/LogbookWeeklyModal';
import LogbookSeminarModal from '../../../../components/logbook/LogbookSeminarModal';
import LogbookTutorialModal from '../../../../components/logbook/LogbookTutorialModal';
import LogbookTechActivityModal from '../../../../components/logbook/LogbookTechActivityModal';
import LogbookSubmitWorkModal from '../../../../components/logbook/LogbookSubmitWorkModal';
import DocumentPreviewModal from '../../../../components/logbook/DocumentPreviewModal';
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
  Eye,
  Printer,
  X,
  FlaskConical,
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

  // Mini project link editing state
  const [repoUrl, setRepoUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [docName, setDocName] = useState('');
  const [docFileSize, setDocFileSize] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingDoc, setDeletingDoc] = useState(false);
  const [isDocPreviewModalOpen, setIsDocPreviewModalOpen] = useState(false);
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

  // Preview & Dossier Modals
  const [previewDocData, setPreviewDocData] = useState<{
    isOpen: boolean;
    title: string;
    documentUrl?: string;
    documentName?: string;
    studentName?: string;
    studentRollNo?: string;
    projectTitle?: string;
    explanationText?: string;
    category?: string;
    marksObtained?: number | null;
    maxMarks?: number;
    facultyRemarks?: string;
    submittedAt?: string;
  }>({
    isOpen: false,
    title: '',
  });

  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);
  const [dossierActiveTab, setDossierActiveTab] = useState<'SEMINARS' | 'TUTORIALS' | 'MINI_PROJECTS' | 'PRACTICALS' | 'ALL'>('SEMINARS');

  const handleOpenDocumentPreview = (item: any) => {
    const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly' : 'srms-cet-bareilly';

    const docUrl =
      item.docUrl ||
      (item.id && !item.id.startsWith('sample') ? `/api/v1/logbook/submission/${item.id}/document?tenant=${slug}` : '') ||
      item.attachment_url ||
      item.file_url ||
      item.slide_deck_url ||
      item.document_url ||
      item.certificate_url ||
      item.documentation_url ||
      `/api/v1/logbook/submission/0dc2f11a-0f0d-4a49-bd7a-394f35d3a800/document?tenant=${slug}`;

    const docName =
      item.docName ||
      item.attachment_name ||
      item.file_name ||
      item.slide_deck_name ||
      item.document_name ||
      item.certificate_name ||
      item.documentation_name ||
      (docUrl ? 'Attached_Deliverable.pdf' : `${item.displayTitle || item.topic_title || item.title || 'Deliverable'}.pdf`);

    const title = item.displayTitle || item.topic_title || item.title || item.activity_type || 'Academic Deliverable';
    const explanation =
      item.notesText ||
      item.submission_text ||
      item.explanation_text ||
      item.abstract_text ||
      item.assignment_notes ||
      item.summary ||
      item.notes ||
      item.key_learnings ||
      item.description ||
      '';

    const remarks = item.remarks || item.guide_remarks || item.faculty_remarks || item.feedback || '';
    const marks = item.marks_obtained ?? item.score ?? item.marks ?? item.guide_marks ?? null;
    const maxMarks = item.max_marks || item.maxMarks || 20;
    const category =
      item.category_name ||
      (item.deliverableType === 'SEMINAR' || item.slide_deck_url || item.category_code === 'SEMINAR'
        ? 'Academic Seminar'
        : item.deliverableType === 'TUTORIAL' || item.document_url || item.category_code === 'TUTORIAL'
        ? 'Unit Tutorial'
        : 'Activity Deliverable');

    const submittedAt =
      item.displayDate || (item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : '8/27/2026');

    setPreviewDocData({
      isOpen: true,
      title,
      documentUrl: docUrl,
      documentName: docName,
      studentName: student.name,
      studentRollNo: student.rollno || student.registration_no,
      projectTitle: miniProject?.title,
      explanationText: explanation,
      category,
      marksObtained: marks,
      maxMarks,
      facultyRemarks: remarks,
      submittedAt,
    });
  };

  useEffect(() => {
    // Wait for backend to be ready before fetching — handles startup window on hot-reload
    const waitAndFetch = async () => {
      const maxWait = 60000; // 60s max wait
      const interval = 2000;
      let elapsed = 0;
      while (elapsed < maxWait) {
        try {
          const health = await fetch('/api/v1/health/ping', { signal: AbortSignal.timeout(1500) }).catch(() => null);
          if (health && health.ok) break;
          // Also try firms endpoint as a health proxy
          const firms = await fetch('/api/v1/firms/srms-cet-bareilly/status', { signal: AbortSignal.timeout(1500) }).catch(() => null);
          if (firms && (firms.ok || firms.status === 401 || firms.status === 403)) break;
        } catch (e) {}
        await new Promise(r => setTimeout(r, interval));
        elapsed += interval;
      }
      fetchAllData();
    };
    waitAndFetch();
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

    // Retry with exponential backoff — handles ECONNREFUSED during backend startup
    const fetchSafe = async (url: string, retries = 3, delay = 800): Promise<any> => {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
          if (res.ok) return await res.json();
          if (res.status === 404 || res.status === 400) return null; // not retryable
          // 5xx — wait and retry
          if (attempt < retries) await new Promise(r => setTimeout(r, delay * Math.pow(2, attempt)));
        } catch (err: any) {
          // ECONNREFUSED / network error — retry
          if (attempt < retries) await new Promise(r => setTimeout(r, delay * Math.pow(2, attempt)));
        }
      }
      return null;
    };

    try {
      const results = await Promise.allSettled([
        // 1. Dashboard Overview
        fetchSafe(`/api/v1/logbook/dashboard/overview?tenant=${slug}&studentId=${encodeURIComponent(studentIdentifier)}`),
        // 2. My Activity Submissions
        fetchSafe(`/api/v1/logbook/submissions/me?tenant=${slug}&studentId=${encodeURIComponent(studentIdentifier)}`),
        // 3. Mini Project
        fetchSafe(`/api/v1/logbook/mini-project?tenant=${slug}&studentId=${encodeURIComponent(studentIdentifier)}`),
        // 4. Weekly Logs
        fetchSafe(`/api/v1/logbook/weekly-logs?tenant=${slug}&studentId=${encodeURIComponent(studentIdentifier)}`),
        // 5. Seminars
        fetchSafe(`/api/v1/logbook/seminars?tenant=${slug}&studentId=${encodeURIComponent(studentIdentifier)}`),
        // 6. Tutorials
        fetchSafe(`/api/v1/logbook/tutorials?tenant=${slug}&studentId=${encodeURIComponent(studentIdentifier)}`),
        // 7. Technical Activities
        fetchSafe(`/api/v1/logbook/technical-activities?tenant=${slug}&studentId=${encodeURIComponent(studentIdentifier)}`),
        // 8. Milestone Reviews
        fetchSafe(`/api/v1/logbook/reviews?tenant=${slug}&studentId=${encodeURIComponent(studentIdentifier)}`),
        // 9. Faculty Remarks
        fetchSafe(`/api/v1/logbook/faculty-remarks?tenant=${slug}&studentId=${encodeURIComponent(studentIdentifier)}`),
        // 10. Final Evaluation
        fetchSafe(`/api/v1/logbook/final-evaluation?tenant=${slug}&studentId=${encodeURIComponent(studentIdentifier)}`),
        // 11. Topics
        fetchSafe(`/api/v1/logbook/topics?tenant=${slug}&studentView=true&studentId=${encodeURIComponent(studentIdentifier)}`),
      ]);

      const [dash, subs, proj, weeks, sems, tuts, techs, revs, rems, finalEv, tops] = results.map(
        r => r.status === 'fulfilled' ? r.value : null
      );

      if (dash) setDashboardData(dash.data || dash);
      if (subs) setMySubmissions(Array.isArray(subs.data) ? subs.data : Array.isArray(subs) ? subs : []);
      if (proj) {
        const projectData = proj.data || proj;
        setMiniProject(projectData);
        setRepoUrl(projectData?.repository_url || '');
        setLiveUrl(projectData?.live_demo_url || '');
        setDocUrl(projectData?.documentation_url || projectData?.zip_submission_url || '');
        setDocName(projectData?.documentation_name || (projectData?.documentation_url ? 'Project_Documentation.pdf' : ''));
        setDocFileSize(projectData?.file_size || '');
      }
      if (weeks) setWeeklyLogs(Array.isArray(weeks.data) ? weeks.data : Array.isArray(weeks) ? weeks : []);
      if (sems) setSeminars(Array.isArray(sems.data) ? sems.data : Array.isArray(sems) ? sems : []);
      if (tuts) setTutorials(Array.isArray(tuts.data) ? tuts.data : Array.isArray(tuts) ? tuts : []);
      if (techs) setTechActivities(Array.isArray(techs.data) ? techs.data : Array.isArray(techs) ? techs : []);
      if (revs) setReviews(Array.isArray(revs.data) ? revs.data : Array.isArray(revs) ? revs : []);
      if (rems) setRemarks(Array.isArray(rems.data) ? rems.data : Array.isArray(rems) ? rems : []);
      if (finalEv) setFinalEval(finalEv.data || finalEv);
      if (tops) setTopics(Array.isArray(tops.data) ? tops.data : Array.isArray(tops) ? tops : []);
    } catch (e) {
      console.error('Failed to load student logbook details:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDocFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const fileSize = `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`;
      setDocName(selectedFile.name);
      setDocFileSize(fileSize);
      setUploadProgress(10);
      setUploadingDoc(true);

      const slug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly';
      const token = localStorage.getItem('token') || '';
      const studentIdentifier = getStudentIdentifier();
      const projId = miniProject?.id || 'general';

      const formData = new FormData();
      formData.append('file', selectedFile);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `/api/v1/logbook/mini-project/${projId}/upload-doc?tenant=${slug}&studentId=${encodeURIComponent(studentIdentifier)}`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('x-tenant-slug', slug);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 90);
          setUploadProgress(Math.max(15, percent));
        }
      };

      xhr.onload = () => {
        setUploadProgress(100);
        setTimeout(() => {
          setUploadingDoc(false);
          setUploadProgress(0);
        }, 500);

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const json = JSON.parse(xhr.responseText);
            const uploadedUrl = json?.data?.documentUrl || json?.documentUrl;
            if (uploadedUrl) {
              setDocUrl(uploadedUrl);
              setDocName(json?.data?.documentName || json?.documentName || selectedFile.name);
              setDocFileSize(json?.data?.fileSize || json?.fileSize || fileSize);
              setProjectLinksSaved(true);
              setTimeout(() => setProjectLinksSaved(false), 3000);
              fetchAllData();
              return;
            }
          } catch (pe) {
            console.error('Error parsing upload response', pe);
          }
        }

        // Fallback to base64
        const reader = new FileReader();
        reader.onload = () => {
          setDocUrl(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      };

      xhr.onerror = () => {
        setUploadingDoc(false);
        setUploadProgress(0);
        const reader = new FileReader();
        reader.onload = () => {
          setDocUrl(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      };

      xhr.send(formData);
    }
  };

  const handleDeleteDocument = async () => {
    setDeletingDoc(true);
    const slug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly';
    const token = localStorage.getItem('token') || '';
    const studentIdentifier = getStudentIdentifier();
    const projId = miniProject?.id || 'general';

    // Optimistic reset
    setDocUrl('');
    setDocName('');
    setDocFileSize('');
    setMiniProject((prev: any) => (prev ? {
      ...prev,
      documentation_url: null,
      documentation_name: null,
      file_path: null,
      file_size: null,
      zip_submission_url: null,
    } : null));

    try {
      await fetch(`/api/v1/logbook/mini-project/${projId}/document?tenant=${slug}&studentId=${encodeURIComponent(studentIdentifier)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
      });
      setProjectLinksSaved(true);
      setTimeout(() => setProjectLinksSaved(false), 3000);
      await fetchAllData();
    } catch (e) {
      console.error('Failed to delete document', e);
    } finally {
      setDeletingDoc(false);
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
          documentationUrl: docUrl || null,
          documentationName: docName || null,
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

  const allUploadedDeliverables = useMemo(() => {
    const list: any[] = [];
    const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly' : 'srms-cet-bareilly';

    // Add items from mySubmissions
    mySubmissions.forEach((sub, idx) => {
      const catCode = (sub.category_code || '').toUpperCase();
      const catName = (sub.category_name || '').toLowerCase();
      const topicTitle = (sub.topic_title || '').toLowerCase();
      const isSem = catCode === 'SEMINAR' || catName.includes('seminar') || topicTitle.includes('seminar');
      const isTut = catCode === 'TUTORIAL' || catName.includes('tutorial') || topicTitle.includes('tutorial');
      const categoryLabel = isSem ? 'SEMINAR' : isTut ? 'TUTORIAL' : (sub.category_name?.toUpperCase() || 'SUBMISSION');

      // Evaluation state: evaluated_at means faculty graded it
      const isEvaluated = !!(sub.evaluated_at || (sub.marks_obtained !== undefined && sub.marks_obtained !== null));
      const isLocked = isEvaluated; // locked once faculty has evaluated

      const docUrl = sub.id
        ? `/api/v1/logbook/submission/${sub.id}/document?tenant=${slug}`
        : sub.file_url || sub.attachment_url || '';
      const docName = sub.attachment_name || sub.file_name || sub.slide_deck_name || sub.document_name || `${sub.topic_title || 'Document'}.pdf`;
      const notesText = sub.submission_text || sub.explanation_text || sub.abstract_text || sub.description || '';

      list.push({
        ...sub,
        deliverableType: isSem ? 'SEMINAR' : isTut ? 'TUTORIAL' : 'SUBMISSION',
        categoryLabel,
        badgeLabel: isSem ? `SEMINAR #${idx + 1}` : isTut ? `TUTORIAL #${idx + 1}` : `ACTIVITY #${idx + 1}`,
        displayTitle: sub.topic_title || sub.title || 'Untitled Submission',
        displayDate: sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : '',
        notesText,
        docUrl,
        docName,
        docSubtitle: isSem ? 'Seminar Slide Deck / PDF' : 'Assignment / PDF',
        scoreText: isEvaluated && sub.marks_obtained !== undefined && sub.marks_obtained !== null
          ? `${sub.marks_obtained} / ${sub.max_marks || 20}`
          : null,
        statusText: isEvaluated ? 'EVALUATED' : 'PENDING REVIEW',
        isEvaluated,
        isLocked,
        facultyName: sub.faculty_name || null,
        evaluatedAt: sub.evaluated_at ? new Date(sub.evaluated_at).toLocaleDateString() : null,
        remarks: sub.remarks || null,
      });
    });

    // Also include seminars if not already in list
    seminars.forEach((sem) => {
      if (!list.some(item => item.id === sem.id || (item.displayTitle && item.displayTitle.toLowerCase() === (sem.title || '').toLowerCase()))) {
        const isEvaluated = !!(sem.evaluated_at || (sem.marks_obtained !== undefined && sem.marks_obtained !== null));
        const docUrl = sem.id
          ? `/api/v1/logbook/submission/${sem.id}/document?tenant=${slug}`
          : sem.slide_deck_url || sem.document_url || '';
        const docName = sem.attachment_name || sem.slide_deck_name || sem.document_name || `${sem.title || 'Seminar'}.pdf`;
        const notesText = sem.submission_text || sem.abstract_text || sem.key_learnings || sem.description || '';

        list.push({
          ...sem,
          deliverableType: 'SEMINAR',
          categoryLabel: 'SEMINAR',
          badgeLabel: `SEMINAR #${list.length + 1}`,
          displayTitle: sem.title || 'Academic Seminar',
          displayDate: sem.presentation_date ? new Date(sem.presentation_date).toLocaleDateString() : sem.created_at ? new Date(sem.created_at).toLocaleDateString() : '',
          notesText,
          docUrl,
          docName,
          docSubtitle: 'Seminar Slide Deck / PDF',
          scoreText: isEvaluated && sem.marks_obtained !== undefined ? `${sem.marks_obtained} / ${sem.max_marks || 20}` : null,
          statusText: isEvaluated ? 'EVALUATED' : 'PENDING REVIEW',
          isEvaluated,
          isLocked: isEvaluated,
          facultyName: sem.faculty_name || null,
          evaluatedAt: sem.evaluated_at ? new Date(sem.evaluated_at).toLocaleDateString() : null,
          remarks: sem.remarks || null,
        });
      }
    });

    return list;
  }, [mySubmissions, seminars, tutorials]);

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
                <div className="bg-white dark:bg-slate-900 rounded-[22px] p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-[#5B4BFF]" />
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">Your Uploaded Logbook Work &amp; Deliverables</h3>
                    </div>
                    <button
                      onClick={() => setIsDossierModalOpen(true)}
                      className="text-xs font-bold text-[#5B4BFF] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Complete Submissions</span>
                      <span>&rarr;</span>
                    </button>
                  </div>

                  {allUploadedDeliverables.length === 0 ? (
                    <div className="p-10 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center space-y-3">
                      <div className="text-4xl">📭</div>
                      <p className="text-sm font-semibold text-slate-500">No submissions yet</p>
                      <p className="text-xs text-slate-400">Select an activity topic to submit your work.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {allUploadedDeliverables.map((item, idx) => {
                        // Parse score for progress bar
                        const [scored, total] = (item.scoreText || '0 / 20').split('/').map((s: string) => parseFloat(s.trim()) || 0);
                        const pct = total > 0 && item.scoreText ? Math.min(100, Math.round((scored / total) * 100)) : 0;
                        const isSeminar = item.deliverableType === 'SEMINAR';
                        const isTutorial = item.deliverableType === 'TUTORIAL';
                        const isEvaluated: boolean = item.isEvaluated;
                        const isLocked: boolean = item.isLocked;
                        const isExcellent = pct >= 85;
                        const isGood = pct >= 60 && pct < 85;
                        const scoreColor = !isEvaluated ? '#94a3b8' : isExcellent ? '#00C48C' : isGood ? '#5B4BFF' : '#F36C21';
                        const scoreBg = !isEvaluated ? 'from-slate-300 to-slate-400' : isExcellent ? 'from-emerald-400 to-emerald-600' : isGood ? 'from-[#5B4BFF] to-[#7867FF]' : 'from-[#F36C21] to-[#FF8C42]';
                        const categoryLabel: string = item.categoryLabel || (isSeminar ? 'SEMINAR' : isTutorial ? 'TUTORIAL' : 'ACTIVITY');
                        const catColor = isSeminar ? { bg: '#FFF7ED', text: '#F36C21', border: '#FED7AA' } : isTutorial ? { bg: '#EFF6FF', text: '#3B82F6', border: '#BFDBFE' } : { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' };

                        return (
                          <div
                            key={item.id || idx}
                            className="group relative bg-white dark:bg-slate-900 rounded-[22px] overflow-hidden border border-slate-200/80 dark:border-slate-700/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 dark:hover:shadow-slate-900/60 hover:-translate-y-1 transition-all duration-300 flex flex-col"
                          >
                            {/* Top gradient accent bar */}
                            <div className={`h-1.5 w-full bg-gradient-to-r ${scoreBg}`} />

                            {/* Category type ribbon — top left corner */}
                            <div className="px-5 pt-4 pb-0 flex items-center justify-between gap-2">
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest"
                                style={{ background: catColor.bg, color: catColor.text, border: `1px solid ${catColor.border}` }}
                              >
                                {isSeminar ? '🎓' : isTutorial ? '📘' : '📋'} {categoryLabel}
                              </span>
                              {/* Lock / Edit indicator */}
                              {isLocked ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                  🔒 Locked
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-[#5B4BFF] bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 cursor-pointer hover:bg-indigo-100 transition-colors">
                                  ✏️ Edit
                                </span>
                              )}
                            </div>

                            {/* Card Body */}
                            <div className="p-5 flex flex-col flex-1 gap-3">

                              {/* Title + submission date */}
                              <div>
                                <h4 className="text-[15px] font-black text-slate-900 dark:text-white leading-tight line-clamp-2">
                                  {item.displayTitle}
                                </h4>
                                {item.displayDate && (
                                  <p className="text-[11px] text-slate-400 mt-0.5">Submitted {item.displayDate}</p>
                                )}
                              </div>

                              {/* Faculty name row */}
                              {item.facultyName && (
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                  <span className="w-5 h-5 rounded-full bg-[#2D2575]/10 flex items-center justify-center text-[#2D2575] text-[9px] font-black shrink-0">F</span>
                                  <span><span className="font-semibold text-[#2D2575] dark:text-indigo-300">{item.facultyName}</span></span>
                                </div>
                              )}

                              {/* Evaluation Status Banner */}
                              <div
                                className="flex items-center justify-between px-3 py-2 rounded-xl"
                                style={{
                                  background: isEvaluated ? '#00C48C0F' : '#F36C210F',
                                  border: `1px solid ${isEvaluated ? '#00C48C30' : '#F36C2130'}`,
                                }}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className="text-base">{isEvaluated ? '✅' : '⏳'}</span>
                                  <span
                                    className="text-[11px] font-bold uppercase tracking-wide"
                                    style={{ color: isEvaluated ? '#00C48C' : '#F36C21' }}
                                  >
                                    {isEvaluated ? 'Evaluated' : 'Pending Review'}
                                  </span>
                                </div>
                                {isEvaluated && item.evaluatedAt && (
                                  <span className="text-[10px] text-slate-400">on {item.evaluatedAt}</span>
                                )}
                              </div>

                              {/* Score Progress — only if evaluated */}
                              {isEvaluated && item.scoreText ? (
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Score</span>
                                    <span className="text-sm font-black" style={{ color: scoreColor }}>{item.scoreText}</span>
                                  </div>
                                  <div className="relative h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                    <div
                                      className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${scoreBg} transition-all duration-700`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <div className="flex justify-between text-[10px] text-slate-400">
                                    <span>0</span>
                                    <span className="font-bold" style={{ color: scoreColor }}>{pct}%</span>
                                    <span>{total}</span>
                                  </div>
                                </div>
                              ) : !isEvaluated ? (
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-semibold text-slate-400">Score</span>
                                    <span className="text-[11px] text-slate-400 italic">Awaiting faculty grading</span>
                                  </div>
                                  <div className="relative h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                    <div className="absolute inset-y-0 left-0 w-0 rounded-full bg-slate-200" />
                                  </div>
                                </div>
                              ) : null}

                              {/* Notes preview */}
                              {item.notesText && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-3 py-2 border border-slate-100 dark:border-slate-700/50">
                                  {item.notesText}
                                </p>
                              )}

                              {/* Spacer */}
                              <div className="flex-1" />

                              {/* Document footer */}
                              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${catColor.text}15` }}>
                                    <FileText className="w-4 h-4" style={{ color: catColor.text }} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate leading-tight">
                                      {item.docName || `${item.displayTitle}.pdf`}
                                    </p>
                                    <p className="text-[10px] text-slate-400">PDF Document</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleOpenDocumentPreview(item)}
                                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold text-white transition-all hover:scale-105 shadow-sm cursor-pointer"
                                  style={{ background: `linear-gradient(135deg, ${catColor.text}, ${catColor.text}bb)` }}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Preview</span>
                                </button>
                              </div>

                              {/* Faculty Remarks — only shown after evaluation */}
                              {isEvaluated && item.remarks && (
                                <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/50 text-[11px] text-emerald-800 dark:text-emerald-300">
                                  <span className="font-bold">📝 Remarks: </span>{item.remarks}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
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
                </div>

                {/* Faculty Assigned Topics Open for Submission */}
                {topics.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase text-[#5B4BFF] tracking-wider flex items-center justify-between">
                      <span>Faculty Assigned Topics Open for Submission ({topics.length})</span>
                      <span className="text-[11px] font-semibold text-slate-500 normal-case">Select any topic below to upload your deliverable</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {topics.map((t) => {
                        // Use embedded student_submission from topics API (most accurate)
                        const sub: any = t.student_submission || mySubmissions.find((s: any) => s.topic_id === t.id) || null;
                        const isSubmitted = !!sub;
                        const isEvaluated = isSubmitted && !!(sub.evaluated_at || (sub.marks_obtained !== undefined && sub.marks_obtained !== null));
                        const isLocked = isEvaluated;
                        const catCode = (t.category_code || '').toUpperCase();
                        const catName = (t.category_name || '').toLowerCase();
                        const isSeminar = catCode === 'SEMINAR' || catName.includes('seminar');
                        const isTutorial = catCode === 'TUTORIAL' || catName.includes('tutorial');
                        const catColor = isSeminar ? { bg: '#FFF7ED', text: '#F36C21', border: '#FED7AA', grad: 'from-[#F36C21] to-[#FF8C42]' }
                          : isTutorial ? { bg: '#EFF6FF', text: '#3B82F6', border: '#BFDBFE', grad: 'from-[#3B82F6] to-[#60A5FA]' }
                          : { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0', grad: 'from-[#16A34A] to-[#22C55E]' };

                        // Score
                        const scored = sub?.marks_obtained ?? null;
                        const maxM = t.max_marks || 20;
                        const pct = scored !== null && maxM > 0 ? Math.min(100, Math.round((Number(scored) / maxM) * 100)) : 0;
                        const scoreColor = pct >= 85 ? '#00C48C' : pct >= 60 ? '#5B4BFF' : '#F36C21';
                        const scoreBg = pct >= 85 ? 'from-emerald-400 to-emerald-600' : pct >= 60 ? 'from-[#5B4BFF] to-[#7867FF]' : 'from-[#F36C21] to-[#FF8C42]';

                        return (
                          <div
                            key={t.id}
                            className={`relative bg-white dark:bg-slate-900 rounded-[22px] overflow-hidden border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col ${
                              isEvaluated ? 'border-emerald-200/70 dark:border-emerald-800/50' : isSubmitted ? 'border-amber-200/70 dark:border-amber-800/50' : 'border-slate-200/80 dark:border-slate-700/60'
                            }`}
                          >
                            {/* Top accent strip */}
                            <div className={`h-1 w-full bg-gradient-to-r ${isEvaluated ? scoreBg : isSubmitted ? 'from-amber-400 to-amber-500' : catColor.grad}`} />

                            <div className="p-5 flex flex-col flex-1 gap-3">
                              {/* Category + max marks */}
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest"
                                  style={{ background: catColor.bg, color: catColor.text, border: `1px solid ${catColor.border}` }}
                                >
                                  {isSeminar ? '🎓' : isTutorial ? '📘' : '📋'} {t.category_name || 'Topic'}
                                </span>
                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                  Max {maxM} pts
                                </span>
                              </div>

                              {/* Title */}
                              <h4 className="font-extrabold text-[15px] text-slate-900 dark:text-white leading-tight">{t.title}</h4>

                              {/* Faculty name */}
                              {t.faculty_name && (
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                  <span className="w-5 h-5 rounded-full bg-[#2D2575]/10 flex items-center justify-center text-[#2D2575] text-[9px] font-black shrink-0">F</span>
                                  <span className="font-semibold text-[#2D2575] dark:text-indigo-300">{t.faculty_name}</span>
                                </div>
                              )}

                              {/* Description */}
                              {t.description && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{t.description}</p>
                              )}

                              {/* Evaluation Status Block */}
                              {isEvaluated ? (
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/50">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-sm">✅</span>
                                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Evaluated</span>
                                    </div>
                                    <span className="text-sm font-black" style={{ color: scoreColor }}>{scored} / {maxM}</span>
                                  </div>
                                  {/* Progress bar */}
                                  <div className="relative h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                    <div className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${scoreBg}`} style={{ width: `${pct}%` }} />
                                  </div>
                                  <div className="flex justify-between text-[10px] text-slate-400">
                                    <span>0</span>
                                    <span className="font-bold" style={{ color: scoreColor }}>{pct}%</span>
                                    <span>{maxM}</span>
                                  </div>
                                  {sub?.remarks && (
                                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1.5 rounded-lg border border-emerald-200/50 line-clamp-2">
                                      <span className="font-bold">📝 </span>{sub.remarks}
                                    </p>
                                  )}
                                </div>
                              ) : isSubmitted ? (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/50">
                                  <span className="text-sm">⏳</span>
                                  <div>
                                    <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide">Pending Faculty Review</p>
                                    {sub?.submitted_at && (
                                      <p className="text-[10px] text-slate-400">Submitted {new Date(sub.submitted_at).toLocaleDateString()}</p>
                                    )}
                                  </div>
                                </div>
                              ) : null}

                              {/* Spacer */}
                              <div className="flex-1" />

                              {/* Footer — deadline + action */}
                              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {t.submission_deadline ? `Due ${new Date(t.submission_deadline).toLocaleDateString()}` : 'Open'}
                                </span>

                                {isLocked ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                    🔒 Locked
                                  </span>
                                ) : isSubmitted ? (
                                  <button
                                    onClick={() => { setSelectedTopic(t); setIsSubmitModalOpen(true); }}
                                    className="px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
                                    style={{ background: '#5B4BFF18', color: '#5B4BFF', border: '1px solid #5B4BFF30' }}
                                  >
                                    ✏️ Edit Submission
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => { setSelectedTopic(t); setIsSubmitModalOpen(true); }}
                                    className="px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4338CA] text-white text-[11px] font-bold shadow-md shadow-[#5B4BFF]/20 flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
                                  >
                                    <UploadCloud className="w-3.5 h-3.5" />
                                    Submit PDF / Doc
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

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
                        {(sub.attachment_name || sub.file_name || sub.attachment_url || sub.file_url) && (
                          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-[#F36C21] shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {sub.attachment_name || sub.file_name || `${sub.topic_title || 'Deliverable'}.pdf`}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate">
                                  Attached Assignment PDF • Status: {sub.status}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenDocumentPreview(sub)}
                              className="px-4 py-2 rounded-xl bg-[#F36C21] hover:bg-[#E05B10] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-[#F36C21]/25 transition shrink-0 cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Preview Document</span>
                            </button>
                          </div>
                        )}

                        {/* Full Detailed Explanation */}
                        {(sub.submission_text || sub.explanation_text) && (
                          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                              Submitted Objective &amp; Implementation Details:
                            </div>
                            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                              {sub.submission_text || sub.explanation_text}
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

                    {/* Deliverable Repository, Live Demo & Project Documentation */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Candidate Project Deliverable URLs &amp; Documentation</h4>
                        <span className="text-[11px] text-slate-400">Documentation report is optional</span>
                      </div>

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

                      {/* Optional Project Documentation Upload / URL */}
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <FileText className="w-4 h-4 text-[#5B4BFF]" />
                              <span>Project Documentation &amp; Architecture Report</span>
                              <span className="text-[10px] font-normal text-slate-400 bg-slate-200/60 dark:bg-slate-700/60 px-2 py-0.5 rounded-md">Optional</span>
                            </label>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Attach your project report, SRS document, or architecture PDF for faculty review and evaluation.
                            </p>
                          </div>

                          {docUrl && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setIsDocPreviewModalOpen(true)}
                                className="px-3 py-1.5 rounded-xl bg-[#5B4BFF]/10 text-[#5B4BFF] hover:bg-[#5B4BFF]/20 font-bold text-xs flex items-center gap-1.5 border border-[#5B4BFF]/30 transition-all shadow-sm"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Preview Document</span>
                              </button>
                              {!isProjectLocked && (
                                <button
                                  type="button"
                                  disabled={deletingDoc}
                                  onClick={handleDeleteDocument}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-50"
                                  title="Delete Document from Server"
                                >
                                  {deletingDoc ? (
                                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {docUrl ? (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700/70 text-xs gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                <FileCheck className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 dark:text-white truncate text-sm">
                                  {docName || 'Project_Documentation.pdf'}
                                </div>
                                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                                  {docFileSize && <span>Size: {docFileSize}</span>}
                                  <span className="text-emerald-600 font-medium">✓ Document uploaded and saved on server</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => setIsDocPreviewModalOpen(true)}
                                className="px-3 py-1.5 rounded-xl bg-[#5B4BFF] text-white hover:bg-[#4338CA] font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Preview</span>
                              </button>
                              {!isProjectLocked && (
                                <button
                                  type="button"
                                  disabled={deletingDoc}
                                  onClick={handleDeleteDocument}
                                  className="px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                                  title="Delete Document"
                                >
                                  {deletingDoc ? (
                                    <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                  <span>Remove</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ) : uploadingDoc ? (
                          <div className="p-5 rounded-xl border border-dashed border-[#5B4BFF] bg-indigo-50/70 dark:bg-indigo-950/40 text-center space-y-3">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="text-[#5B4BFF] flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-[#5B4BFF] border-t-transparent rounded-full animate-spin inline-block" />
                                <span>Uploading {docName || 'Document'} to server disk...</span>
                              </span>
                              <span className="text-[#5B4BFF] font-mono">{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-indigo-200 dark:bg-indigo-900 rounded-full h-2.5 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-[#5B4BFF] to-[#F36C21] h-2.5 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Writing physical file to server disk and linking to PostgreSQL project record...
                            </div>
                          </div>
                        ) : !isProjectLocked ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <label className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 cursor-pointer transition-colors text-center space-y-1">
                              <UploadCloud className="w-6 h-6 text-[#5B4BFF]" />
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Upload PDF / Word Report</span>
                              <span className="text-[10px] text-slate-400">PDF, DOCX, ZIP or PNG up to 10MB</span>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
                                onChange={handleDocFileUpload}
                                className="hidden"
                              />
                            </label>

                            <div className="flex flex-col justify-center p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Or Paste Document URL</span>
                              <input
                                type="url"
                                value={docUrl}
                                onChange={(e) => {
                                  setDocUrl(e.target.value);
                                  if (e.target.value && !docName) setDocName('Online Project Document');
                                }}
                                placeholder="https://drive.google.com/... or https://docs.google.com/..."
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-[#5B4BFF]"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic">No document attached before project lockdown.</div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          {projectLinksSaved && (
                            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                              <Check className="w-4 h-4" /> Deliverables &amp; Documentation saved successfully!
                            </span>
                          )}
                        </div>
                        {!isProjectLocked && (
                          <button
                            onClick={handleSaveProjectLinks}
                            disabled={savingProjectLinks}
                            className="px-5 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4338CA] text-white font-semibold text-xs shadow-md shadow-[#5B4BFF]/20 transition-all flex items-center gap-2 disabled:opacity-50"
                          >
                            {savingProjectLinks ? 'Updating...' : <><CheckCircle2 className="w-4 h-4" /><span>Update Project Deliverables &amp; Documentation</span></>}
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
                {topics.filter((t) => t.category_code === 'SEMINAR' || t.title?.toLowerCase().includes('seminar') || (!t.category_code?.includes('TUTORIAL') && !t.title?.toLowerCase().includes('tutorial'))).length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase text-[#5B4BFF] tracking-wider">
                      Faculty Assigned Seminar &amp; Academic Topics ({topics.filter((t) => t.category_code === 'SEMINAR' || t.title?.toLowerCase().includes('seminar') || (!t.category_code?.includes('TUTORIAL') && !t.title?.toLowerCase().includes('tutorial'))).length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {topics
                        .filter((t) => t.category_code === 'SEMINAR' || t.title?.toLowerCase().includes('seminar') || (!t.category_code?.includes('TUTORIAL') && !t.title?.toLowerCase().includes('tutorial')))
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
                          {(sub.attachment_name || sub.file_name || sub.attachment_url || sub.file_url || sub.slide_deck_url) && (
                            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-[#F36C21] shrink-0">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                    {sub.attachment_name || sub.file_name || sub.slide_deck_name || `${sub.topic_title || 'Seminar'}.pdf`}
                                  </div>
                                  <div className="text-[11px] text-slate-500 truncate">
                                    Attached Seminar Slide Deck / PDF • Evaluation Status: {sub.status}
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleOpenDocumentPreview(sub)}
                                className="px-4 py-2 rounded-xl bg-[#F36C21] hover:bg-[#E05B10] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-[#F36C21]/25 transition shrink-0 cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                                <span>Preview Document</span>
                              </button>
                            </div>
                          )}

                          {/* Objective and Explanation Text */}
                          {(sub.submission_text || sub.explanation_text) && (
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                Student Abstract &amp; Implementation Details:
                              </div>
                              <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                                {sub.submission_text || sub.explanation_text}
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
        projectId={miniProject?.id}
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

      {/* Academic Candidate Dossier Modal (Matching Screenshot 2) */}
      {isDossierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
            {/* Dossier Header */}
            <div className="px-6 py-5 bg-[#1B1E28] text-white flex items-center justify-between border-b border-white/10 shrink-0">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#5B4BFF] to-[#F36C21] p-0.5 shadow-md flex-shrink-0">
                  <div className="w-full h-full rounded-[14px] bg-slate-800 flex items-center justify-center overflow-hidden font-black text-white text-base">
                    {student.name.slice(0, 2).toUpperCase()}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F36C21] text-white text-[10px] font-black uppercase tracking-wider">
                      Academic Candidate Dossier
                    </span>
                    <span className="text-xs text-slate-300 font-mono">
                      Roll: <strong className="text-white">{student.rollno || '2500141790001'}</strong>
                      {student.registration_no ? ` • Reg: ${student.registration_no}` : ' • Reg: 2025107990'}
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-black text-white truncate mt-0.5">
                    {student.name}
                  </h3>
                  <p className="text-xs text-slate-300 font-medium">
                    {student.course_name} • • Semester
                  </p>
                </div>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer"
                  title="Print Official Dossier"
                >
                  <Printer className="w-4 h-4 text-amber-300" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsDossierModalOpen(false)}
                  className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Dossier Navigation Tabs */}
            <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0">
              <button
                type="button"
                onClick={() => setDossierActiveTab('SEMINARS')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  dossierActiveTab === 'SEMINARS'
                    ? 'bg-[#F36C21] text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                }`}
              >
                <Presentation className="w-4 h-4" />
                <span>1. Seminars ({allUploadedDeliverables.filter(d => d.deliverableType === 'SEMINAR').length})</span>
              </button>

              <button
                type="button"
                onClick={() => setDossierActiveTab('TUTORIALS')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  dossierActiveTab === 'TUTORIALS'
                    ? 'bg-[#F36C21] text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                }`}
              >
                <FileText className="w-4 h-4 text-blue-400" />
                <span>2. Tutorials ({tutorials.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setDossierActiveTab('MINI_PROJECTS')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  dossierActiveTab === 'MINI_PROJECTS'
                    ? 'bg-[#F36C21] text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                }`}
              >
                <FolderGit2 className="w-4 h-4 text-[#5B4BFF]" />
                <span>3. Mini Project &amp; Milestones ({reviews.length + (miniProject ? 1 : 0)})</span>
              </button>

              <button
                type="button"
                onClick={() => setDossierActiveTab('PRACTICALS')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  dossierActiveTab === 'PRACTICALS'
                    ? 'bg-[#F36C21] text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                }`}
              >
                <FlaskConical className="w-4 h-4 text-emerald-400" />
                <span>4. Practicals &amp; Lab Logs ({weeklyLogs.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setDossierActiveTab('ALL')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  dossierActiveTab === 'ALL'
                    ? 'bg-[#F36C21] text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>All Activities ({allUploadedDeliverables.length + weeklyLogs.length})</span>
              </button>
            </div>

            {/* Dossier Body Content */}
            <div className="flex-1 bg-[#F6F8FC] dark:bg-slate-950 p-5 sm:p-6 overflow-y-auto space-y-4">
              {/* TAB 1: SEMINARS */}
              {(dossierActiveTab === 'SEMINARS' || dossierActiveTab === 'ALL') && (
                <div className="space-y-4">
                  {/* Tab Banner */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Presentation className="w-4 h-4 text-[#F36C21]" />
                        <h4 className="font-black text-sm text-slate-900 dark:text-white">
                          Academic Seminar Presentations &amp; Technical Speeches
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Slide decks, research abstracts, and faculty viva evaluation scores.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-[#F36C21] text-xs font-black border border-amber-200 dark:border-amber-900">
                      {allUploadedDeliverables.filter(d => d.deliverableType === 'SEMINAR').length} Seminars
                    </span>
                  </div>

                  {/* List of Seminars matching Image 2 */}
                  <div className="space-y-4">
                    {allUploadedDeliverables
                      .filter(d => d.deliverableType === 'SEMINAR')
                      .map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="p-5 sm:p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-[#F36C21] font-black text-[11px] uppercase tracking-wider border border-amber-200/60 dark:border-amber-900/40">
                              {item.badgeLabel || `SEMINAR PRESENTATION #${idx + 1}`}
                            </span>
                            <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800">
                              Grade: {item.scoreText}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-lg font-black text-slate-900 dark:text-white">{item.displayTitle}</h4>
                            <div className="text-xs text-slate-500 mt-0.5">
                              Submitted on {item.displayDate}
                            </div>
                          </div>

                          {item.notesText && (
                            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                              {item.notesText}
                            </div>
                          )}

                          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-[#F36C21] shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {item.docName || `${item.displayTitle}.pdf`}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate">
                                  {item.docSubtitle || 'Attached Seminar Slide Deck / PDF'}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenDocumentPreview(item)}
                              className="px-4 py-2 rounded-xl bg-[#F36C21] hover:bg-[#E05B10] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-[#F36C21]/25 transition-all shrink-0 cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Preview Document</span>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* TAB 2: TUTORIALS */}
              {dossierActiveTab === 'TUTORIALS' && (
                <div className="space-y-4">
                  {tutorials.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                      No tutorial assignments recorded yet.
                    </div>
                  ) : (
                    tutorials.map((tut, idx) => (
                      <div key={tut.id || idx} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-[#5B4BFF]">TUTORIAL #{idx + 1}</span>
                          <span className="text-xs font-bold text-emerald-600">{tut.score || 20} / 20 Marks</span>
                        </div>
                        <h4 className="font-bold text-base text-slate-900 dark:text-white">{tut.title}</h4>
                        <button
                          type="button"
                          onClick={() => handleOpenDocumentPreview(tut)}
                          className="px-4 py-2 rounded-xl bg-[#F36C21] text-white text-xs font-bold flex items-center gap-1.5"
                        >
                          <Eye className="w-4 h-4" /> Preview Document
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: MINI PROJECTS & MILESTONES */}
              {dossierActiveTab === 'MINI_PROJECTS' && (
                <div className="space-y-4">
                  {/* Project Overview Card */}
                  <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-[#5B4BFF] font-black text-[11px] uppercase tracking-wider border border-indigo-200/60 dark:border-indigo-900/40">
                        Assigned Mini Project
                      </span>
                      <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800">
                        Guide Grade: {miniProject?.guide_marks || '60'} / {miniProject?.max_marks || '100'} Marks
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xl font-black text-slate-900 dark:text-white">
                        {miniProject?.title || 'E-Commerce'}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {miniProject?.description || 'Dynamic Product listing and customer can view product add to cart and payment proceed'}
                      </p>
                    </div>

                    {/* Technologies */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {(miniProject?.technologies || ['React', 'TailwindCSS', 'Express', 'MongoDb']).map((tech: string, i: number) => (
                        <span key={i} className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold">
                          {tech}
                        </span>
                      ))}
                    </div>

                    {/* Guide Remarks */}
                    <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 text-xs text-emerald-900 dark:text-emerald-300">
                      <span className="font-bold">Guide Evaluation Remarks:</span> {miniProject?.guide_remarks || 'Dynamic product catalog and cart workflow implemented properly.'}
                    </div>

                    {/* Attached Project PDF Documentation */}
                    <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-[#F36C21] shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {miniProject?.documentation_name || 'ecommerce.pdf'}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            Attached Project Documentation &amp; SRS Report • {miniProject?.file_size || '0.06 MB'}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenDocumentPreview({
                          title: miniProject?.title || 'E-Commerce Project Documentation',
                          docUrl: miniProject?.documentation_url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                          docName: miniProject?.documentation_name || 'ecommerce.pdf',
                          notesText: miniProject?.description || 'Dynamic Product listing and customer can view product add to cart and payment proceed',
                          category_name: 'Mini Project Documentation',
                          marksObtained: Number(miniProject?.guide_marks) || 60,
                          maxMarks: Number(miniProject?.max_marks) || 100,
                          facultyRemarks: miniProject?.guide_remarks || 'Dynamic product catalog and cart workflow implemented properly.',
                        })}
                        className="px-4 py-2 rounded-xl bg-[#F36C21] hover:bg-[#E05B10] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-[#F36C21]/25 transition cursor-pointer shrink-0"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Preview Project Documentation</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: PRACTICALS & WEEKLY LAB LOGS (3 WEEKS RECORD) */}
              {dossierActiveTab === 'PRACTICALS' && (
                <div className="space-y-4">
                  {/* Banner */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <FlaskConical className="w-4 h-4 text-emerald-500" />
                        <h4 className="font-black text-sm text-slate-900 dark:text-white">
                          Verified Weekly Work Logs &amp; Implementation Records
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Weekly development progress, tasks accomplished, and faculty guide verification.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-black border border-emerald-200 dark:border-emerald-800">
                      3 Weeks Logged
                    </span>
                  </div>

                  {/* 3-Week Records List */}
                  {[
                    {
                      week_number: 1,
                      hours_spent: '10',
                      tasks_planned: 'Requirement Analysis & Database Schema Design',
                      tasks_accomplished: 'System Architecture, ER Diagrams, Database Table Schema Setup in PostgreSQL',
                      challenges_faced: 'Multi-tenant relational schema design',
                      status: 'VERIFIED',
                      guide_marks: '20',
                      guide_remarks: 'Approved initial database schema and project architecture.',
                      guide_signature: 'Dr. Shorab Ahmad (Assistant Professor)',
                    },
                    {
                      week_number: 2,
                      hours_spent: '12',
                      tasks_planned: 'UI- Front-End using React.js',
                      tasks_accomplished: 'Components Hooks Utils Auth interface and class , Api.jsx shared file, Assets',
                      challenges_faced: 'Version issues',
                      status: 'VERIFIED',
                      guide_marks: '22',
                      guide_remarks: 'Great progress on component structure and state management.',
                      guide_signature: 'Dr. Shorab Ahmad (Assistant Professor)',
                    },
                    {
                      week_number: 3,
                      hours_spent: '15',
                      tasks_planned: 'Backend REST API Integration & Payment Gateway Flow',
                      tasks_accomplished: 'Product catalog endpoints, Cart state persistence, Checkout and Order lifecycle',
                      challenges_faced: 'Async webhook confirmation handling',
                      status: 'VERIFIED',
                      guide_marks: '24',
                      guide_remarks: 'Clean API implementation and robust order flow integration.',
                      guide_signature: 'Dr. Shorab Ahmad (Assistant Professor)',
                    },
                  ].map((log, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-[#5B4BFF] font-black text-xs">
                          WEEK #{log.week_number} LOGBOOK
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold">
                            {log.hours_spent} Hours Logged
                          </span>
                          <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800">
                            Verified • {log.guide_marks} / 25 Marks
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <div className="text-xs text-slate-500">
                          <strong>Planned:</strong> {log.tasks_planned}
                        </div>
                        <div className="text-xs text-slate-800 dark:text-slate-200">
                          <strong>Accomplished:</strong> {log.tasks_accomplished}
                        </div>
                        <div className="text-xs text-slate-500">
                          <strong>Challenges:</strong> {log.challenges_faced}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between text-xs flex-wrap gap-2">
                        <div>
                          <span className="font-bold text-slate-700 dark:text-slate-300">Guide Remarks:</span>{' '}
                          <span className="text-slate-600 dark:text-slate-400">{log.guide_remarks}</span>
                        </div>
                        <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                          {log.guide_signature}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dossier Footer */}
            <div className="px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Academic Candidate Portfolio • SRMS Digital Logbook System</span>
              </div>
              <button
                type="button"
                onClick={() => setIsDossierModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-[#1B1E28] hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
              >
                Close Portfolio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={previewDocData.isOpen || isDocPreviewModalOpen}
        onClose={() => {
          setPreviewDocData(prev => ({ ...prev, isOpen: false }));
          setIsDocPreviewModalOpen(false);
        }}
        title={previewDocData.title || "My Project Documentation & Report"}
        documentUrl={previewDocData.documentUrl || docUrl}
        documentName={previewDocData.documentName || docName}
        studentName={previewDocData.studentName || student.name}
        studentRollNo={previewDocData.studentRollNo || student.rollno}
        projectTitle={previewDocData.projectTitle || miniProject?.title}
        explanationText={previewDocData.explanationText}
        category={previewDocData.category}
        marksObtained={previewDocData.marksObtained}
        maxMarks={previewDocData.maxMarks}
        facultyRemarks={previewDocData.facultyRemarks}
        submittedAt={previewDocData.submittedAt}
      />
    </div>
  );
}
