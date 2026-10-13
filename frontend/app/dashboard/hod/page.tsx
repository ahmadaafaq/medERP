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
        <Link href="/dashboard/hod/timetable-approvals" className="text-xs font-bold text-[#5B4BFF] hover:underline">Full Review &amp; Matrix →</Link>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 py-4"><div className="w-4 h-4 border-2 border-[#5B4BFF] border-t-transparent rounded-full animate-spin" /><span className="text-xs text-slate-400">Loading...</span></div>
      ) : drafts.length === 0 ? (
        <div className="py-8 text-center space-y-2"><span className="text-3xl">📅</span><p className="text-sm font-bold text-slate-500">No pending timetables</p></div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {drafts.map((d) => {
            const rawSlots = typeof d.slots === 'string' ? JSON.parse(d.slots || '[]') : (d.slots || []);
            const pendingCnt = rawSlots.filter((s: any) => !s.mappingStatus || s.mappingStatus === 'PENDING').length;
            const linkedCnt = rawSlots.filter((s: any) => s.mappingStatus === 'LINKED').length;
            const totalCnt = rawSlots.length;
            const allLinked = pendingCnt === 0 && totalCnt > 0;

            return (
              <div key={d.id} className="p-3.5 rounded-xl bg-violet-50/70 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-[#1B1E28] dark:text-white truncate">{d.title}</p>
                    <p className="text-[11px] text-slate-500">{d.semester ? `Sem ${d.semester}` : ''} {d.section ? `· Sec ${d.section}` : ''} {d.academic_year || ''}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                    allLinked ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {allLinked ? '✓ Ready to Approve' : `🔒 ${pendingCnt} Pending`}
                  </span>
                </div>

                {/* Mapping Progress Indicator */}
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 dark:text-slate-400">
                  <span>Planning Progress:</span>
                  <span className={allLinked ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                    {linkedCnt} / {totalCnt} Lectures Linked ({totalCnt > 0 ? Math.round((linkedCnt / totalCnt) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all rounded-full ${allLinked ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${totalCnt > 0 ? Math.round((linkedCnt / totalCnt) * 100) : 0}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400">
                    {allLinked ? 'All faculties completed planning' : `Waiting for faculties to link syllabus`}
                  </span>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => allLinked ? act(d.id, 'approve') : undefined}
                      disabled={actioning === d.id || !allLinked}
                      title={!allLinked ? `Approval blocked: ${pendingCnt} slot(s) still require faculty curriculum linking` : 'Approve & Go Live'}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all ${
                        allLinked
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer shadow-sm'
                          : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-75'
                      }`}
                    >
                      <span>{allLinked ? '✓' : '🔒'}</span>
                      <span>{allLinked ? 'Approve' : 'Blocked'}</span>
                    </button>
                    <button
                      onClick={() => act(d.id, 'reject')}
                      disabled={actioning === d.id}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/30 hover:bg-rose-500 hover:text-white text-rose-600 text-xs font-extrabold disabled:opacity-50"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HodFacultyComplianceTrackerCard() {
  const [data, setData] = useState<any>({ facultyCompliance: [], totalPendingFaculties: 0 });
  const [loading, setLoading] = useState(true);
  const [reminding, setReminding] = useState<string | null>(null);
  const [remindedMap, setRemindedMap] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    try {
      const { slug, headers } = getTenantHeaders();
      const r = await fetch(`${API_BASE}/exams/timetable-drafts/faculty-compliance?tenant=${slug}`, { headers });
      const d = await r.json();
      setData(d || { facultyCompliance: [], totalPendingFaculties: 0 });
    } catch {
      setData({ facultyCompliance: [], totalPendingFaculties: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const sendReminder = async (fac: any) => {
    const key = fac.facultyEmpId || fac.facultyId || fac.facultyName;
    setReminding(key);
    try {
      const { slug, headers } = getTenantHeaders();
      const draftId = fac.drafts?.[0]?.id || '';
      await fetch(`${API_BASE}/exams/timetable-drafts/remind-faculty?tenant=${slug}`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId,
          facultyId: fac.facultyId,
          facultyEmpId: fac.facultyEmpId,
          facultyName: fac.facultyName,
        }),
      });
      setRemindedMap((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setRemindedMap((prev) => ({ ...prev, [key]: false }));
      }, 5000);
    } catch (e: any) {
      alert('Failed to send reminder alert: ' + (e?.message || 'Error'));
    } finally {
      setReminding(null);
    }
  };

  const list: any[] = data?.facultyCompliance || [];

  return (
    <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-xl">👥</div>
          <div>
            <h3 className="font-extrabold text-sm text-[#1B1E28] dark:text-white">Faculty Schedule Planning Tracker</h3>
            <p className="text-[11px] text-slate-500">Track faculties scheduled by Clerk who haven't linked syllabus</p>
          </div>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
          data.totalPendingFaculties > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800'
        }`}>
          {data.totalPendingFaculties > 0 ? `${data.totalPendingFaculties} Pending Action` : 'All Faculties Ready'}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-4"><div className="w-4 h-4 border-2 border-[#5B4BFF] border-t-transparent rounded-full animate-spin" /><span className="text-xs text-slate-400">Loading tracker...</span></div>
      ) : list.length === 0 ? (
        <div className="py-8 text-center space-y-2"><span className="text-3xl">✅</span><p className="text-sm font-bold text-slate-500">No scheduled faculty slots in draft queues</p></div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {list.map((f: any, idx: number) => {
            const key = f.facultyEmpId || f.facultyId || f.facultyName || String(idx);
            const isCompleted = f.pendingSlots === 0;
            const wasReminded = Boolean(remindedMap[key]);

            return (
              <div key={key} className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all ${
                isCompleted
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-800/40'
                  : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40'
              }`}>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-extrabold text-[#1B1E28] dark:text-white truncate">
                      {f.facultyName}
                    </p>
                    {f.facultyEmpId && (
                      <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        ID: {f.facultyEmpId}
                      </span>
                    )}
                    <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-full ${
                      isCompleted ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200' : 'bg-[#F36C21] text-white'
                    }`}>
                      {isCompleted ? '✓ Completed' : `${f.pendingSlots} Unlinked`}
                    </span>
                  </div>

                  <p className="text-[10.5px] text-slate-500 truncate">
                    Subjects: <span className="font-semibold text-slate-700 dark:text-slate-300">{f.subjects?.join(', ') || 'General'}</span>
                  </p>

                  {/* Micro Progress Bar */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full transition-all ${isCompleted ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${f.compliancePct}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{f.linkedSlots}/{f.totalSlots} slots ({f.compliancePct}%)</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                  {!isCompleted ? (
                    <button
                      onClick={() => sendReminder(f)}
                      disabled={reminding === key || wasReminded}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black shadow-sm flex items-center gap-1 transition-all ${
                        wasReminded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gradient-to-r from-amber-500 to-[#F36C21] hover:from-amber-600 hover:to-orange-600 text-white cursor-pointer'
                      } disabled:opacity-60`}
                    >
                      <span>{wasReminded ? '✓' : '🔔'}</span>
                      <span>{reminding === key ? 'Alerting...' : wasReminded ? 'Alert Sent!' : 'Remind'}</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span>✓</span>
                      <span>Ready</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
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

          {/* Dedicated Faculty Schedule Planning Compliance Tracker */}
          <HodFacultyComplianceTrackerCard />

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
