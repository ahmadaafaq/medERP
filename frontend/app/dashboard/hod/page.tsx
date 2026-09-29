'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import RecentLessonsWidget from '../../../components/RecentLessonsWidget';
import NoticeDashboardWidget from '../../../components/notices/NoticeDashboardWidget';
import ChatDashboardWidget from '../../../components/chat/ChatDashboardWidget';
import LibraryDashboardCard from '../../../components/library/LibraryDashboardCard';
import FacultyBatchAttendanceAnalytics from '../../../components/faculty/FacultyBatchAttendanceAnalytics';
import FacultyTopperHustleBoard from '../../../components/faculty/FacultyTopperHustleBoard';
import StudentAssessmentMarksCard from '../../../components/dashboard/StudentAssessmentMarksCard';
import DepartmentTimetableCard from '../../../components/dashboard/DepartmentTimetableCard';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

function getTenantHeaders() {
  if (typeof window === 'undefined') return { slug: '', headers: {} as Record<string, string> };
  const slug = (localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || '').replace(/^tenant_/, '').replace(/^tenant-/, '') || 'default';
  const token = localStorage.getItem('token') || '';
  return { slug, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'x-tenant-slug': slug, 'x-tenant': slug } };
}

function HodQPApprovalCard() {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { slug, headers } = getTenantHeaders();
      const r = await fetch(`${API_BASE}/exams/papers/pending-hod-approval?tenant=${slug}`, { headers });
      const d = await r.json();
      setPapers(Array.isArray(d) ? d : (d.data || []));
    } catch { setPapers([]); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const act = async (paperId: string, action: 'approve' | 'reject') => {
    setActioning(paperId);
    const remarks = action === 'reject' ? (window.prompt('Rejection reason (optional):') ?? '') : '';
    try {
      const { slug, headers } = getTenantHeaders();
      await fetch(`${API_BASE}/exams/papers/hod-action?tenant=${slug}`, {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId, action, remarks }),
      });
      await load();
    } catch { } finally { setActioning(null); }
  };

  return (
    <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-xl">📋</div>
          <div>
            <h3 className="font-extrabold text-sm text-[#1B1E28] dark:text-white">Question Paper Approvals</h3>
            <p className="text-[11px] text-slate-500">Clerk-submitted papers awaiting HOD review</p>
          </div>
        </div>
        <Link href="/dashboard/hod/qp-approvals" className="text-xs font-bold text-[#5B4BFF] hover:underline">View All →</Link>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 py-4"><div className="w-4 h-4 border-2 border-[#5B4BFF] border-t-transparent rounded-full animate-spin" /><span className="text-xs text-slate-400">Loading...</span></div>
      ) : papers.length === 0 ? (
        <div className="py-8 text-center space-y-2"><span className="text-3xl">✅</span><p className="text-sm font-bold text-slate-500">No pending approvals</p></div>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {papers.map((p) => (
            <div key={p.id} className="p-3 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30 flex gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-[#1B1E28] dark:text-white truncate">{p.name}</p>
                <p className="text-[11px] text-slate-500">{p.subject_name || p.code} · {p.type || 'THEORY'} · {p.max_marks}M</p>
                <span className="text-[10px] text-orange-600 font-bold">⏳ Pending HOD Approval</span>
              </div>
              <div className="flex gap-1.5 flex-shrink-0 items-start mt-1">
                <button onClick={() => act(p.id, 'approve')} disabled={actioning === p.id} className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold disabled:opacity-50">✓ Approve</button>
                <button onClick={() => act(p.id, 'reject')} disabled={actioning === p.id} className="px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/30 hover:bg-rose-500 hover:text-white text-rose-600 text-xs font-extrabold disabled:opacity-50">✕ Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {papers.length > 0 && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 text-[11px] font-extrabold">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />{papers.length} awaiting review
        </span>
      )}
    </div>
  );
}

function HodTimetableApprovalCard() {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { slug, headers } = getTenantHeaders();
      const r = await fetch(`${API_BASE}/exams/timetable-drafts/pending-hod-approval?tenant=${slug}`, { headers });
      const d = await r.json();
      setDrafts(Array.isArray(d) ? d : (d.data || []));
    } catch { setDrafts([]); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const act = async (draftId: string, action: 'approve' | 'reject') => {
    setActioning(draftId);
    const remarks = action === 'reject' ? (window.prompt('Rejection reason:') ?? '') : '';
    try {
      const { slug, headers } = getTenantHeaders();
      await fetch(`${API_BASE}/exams/timetable-drafts/hod-action?tenant=${slug}`, {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId, action, remarks }),
      });
      await load();
    } catch { } finally { setActioning(null); }
  };

  return (
    <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-xl">📅</div>
          <div>
            <h3 className="font-extrabold text-sm text-[#1B1E28] dark:text-white">Timetable Approvals</h3>
            <p className="text-[11px] text-slate-500">Clerk timetable drafts awaiting HOD review</p>
          </div>
        </div>
        <Link href="/dashboard/hod/timetable-approvals" className="text-xs font-bold text-[#5B4BFF] hover:underline">View All →</Link>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 py-4"><div className="w-4 h-4 border-2 border-[#5B4BFF] border-t-transparent rounded-full animate-spin" /><span className="text-xs text-slate-400">Loading...</span></div>
      ) : drafts.length === 0 ? (
        <div className="py-8 text-center space-y-2"><span className="text-3xl">📅</span><p className="text-sm font-bold text-slate-500">No pending timetables</p></div>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {drafts.map((d) => (
            <div key={d.id} className="p-3 rounded-xl bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800/30 flex gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-[#1B1E28] dark:text-white truncate">{d.title}</p>
                <p className="text-[11px] text-slate-500">{d.semester ? `Sem ${d.semester}` : ''} {d.academic_year || ''}</p>
                <span className="text-[10px] text-violet-600 font-bold">⏳ Pending HOD Approval</span>
              </div>
              <div className="flex gap-1.5 flex-shrink-0 items-start mt-1">
                <button onClick={() => act(d.id, 'approve')} disabled={actioning === d.id} className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold disabled:opacity-50">✓ Approve</button>
                <button onClick={() => act(d.id, 'reject')} disabled={actioning === d.id} className="px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/30 hover:bg-rose-500 hover:text-white text-rose-600 text-xs font-extrabold disabled:opacity-50">✕ Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HODDashboard() {
  const [userName, setUserName] = useState('HOD');
  const [deptName, setDeptName] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserName(localStorage.getItem('name') || localStorage.getItem('username') || 'HOD');
      setDeptName(localStorage.getItem('department_name') || localStorage.getItem('departmentName') || '');
    }
  }, []);

  const quickActions = [
    { href: '/dashboard/hod/qp-approvals', icon: '📋', label: 'QP Approvals', desc: 'Review question papers', color: 'orange' },
    { href: '/dashboard/hod/timetable-approvals', icon: '📅', label: 'Timetable Review', desc: 'Approve schedules', color: 'violet' },
    { href: '/dashboard/hod/question-bank', icon: '🗂️', label: 'Question Bank', desc: 'Department questions', color: 'indigo' },
    { href: '/dashboard/faculty/schedule', icon: '🗓️', label: 'My Schedule', desc: 'Teaching timetable', color: 'emerald' },
    { href: '/dashboard/faculty/students', icon: '👥', label: 'Dept. Students', desc: 'Student roster', color: 'blue' },
  ];

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="hod" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={`HOD Portal${deptName ? ` — ${deptName}` : ''}`} />
        <main className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full flex-1 overflow-x-hidden">

          {/* Banner */}
          <div className="p-6 rounded-[22px] bg-gradient-to-r from-[#2D2575] via-[#5B4BFF]/80 to-[#7867FF] shadow-xl flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-white/20 text-white font-mono font-bold uppercase tracking-wider">HOD PORTAL</span>
                <span className="text-xs text-white/70">Head of Department</span>
              </div>
              <h1 className="text-2xl font-black text-white">Welcome, {userName} 👨‍🏫</h1>
              <p className="text-xs text-white/80">Approve question papers, verify timetables, oversee department academics.</p>
            </div>
            <div className="hidden sm:flex gap-3">
              <div className="p-3 rounded-xl bg-white/10 border border-white/20 text-center">
                <p className="text-[10px] text-white/70 font-bold">QP Queue</p>
                <p className="text-lg font-black text-orange-300">Approvals</p>
              </div>
              <div className="p-3 rounded-xl bg-white/10 border border-white/20 text-center">
                <p className="text-[10px] text-white/70 font-bold">Schedule</p>
                <p className="text-lg font-black text-violet-300">Review</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {quickActions.map((a) => (
              <a key={a.href} href={a.href} className="p-4 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 hover:border-[#5B4BFF]/50 hover:shadow-lg transition-all group space-y-2 block">
                <div className="text-2xl">{a.icon}</div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#1B1E28] dark:text-white group-hover:text-[#5B4BFF] transition-colors">{a.label}</h3>
                  <p className="text-[10px] text-slate-500">{a.desc}</p>
                </div>
              </a>
            ))}
          </div>

          {/* HOD Approval Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HodQPApprovalCard />
            <HodTimetableApprovalCard />
          </div>

          {/* Chat + Notices + Lessons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ChatDashboardWidget role="HOD" chatUrl="/dashboard/hod/chat" />
            <NoticeDashboardWidget role="faculty" />
            <RecentLessonsWidget role="HOD" />
          </div>

          {/* Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FacultyBatchAttendanceAnalytics />
            <FacultyTopperHustleBoard />
          </div>

          {/* Marks + Timetable */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5"><StudentAssessmentMarksCard role="faculty" /></div>
            <div className="lg:col-span-7"><DepartmentTimetableCard role="hod" /></div>
          </div>

          <LibraryDashboardCard role="faculty" />
        </main>
      </div>
    </div>
  );
}
