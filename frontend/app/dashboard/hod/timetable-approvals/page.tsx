'use client';
import { useState, useEffect } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
function getH() {
  if (typeof window === 'undefined') return { slug: '', headers: {} as any };
  const slug = (localStorage.getItem('tenantSlug') || '').replace(/^tenant_/, '') || 'default';
  const token = localStorage.getItem('token') || '';
  return { slug, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'x-tenant-slug': slug } };
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  PENDING_HOD_APPROVAL: 'bg-amber-100 text-amber-700',
  HOD_APPROVED: 'bg-emerald-100 text-emerald-700',
  HOD_REJECTED: 'bg-rose-100 text-rose-700',
};
const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft', PENDING_HOD_APPROVAL: 'Pending Approval', HOD_APPROVED: 'HOD Approved', HOD_REJECTED: 'Rejected',
};

export default function HODTimetableApprovalsPage() {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING_HOD_APPROVAL');
  const [actioning, setActioning] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { slug, headers } = getH();
      const url = filter === 'PENDING_HOD_APPROVAL'
        ? `${API_BASE}/exams/timetable-drafts/pending-hod-approval?tenant=${slug}`
        : filter === 'HOD_APPROVED'
        ? `${API_BASE}/exams/timetable-drafts/approved?tenant=${slug}`
        : `${API_BASE}/exams/timetable-drafts?tenant=${slug}&status=${filter}`;
      const r = await fetch(url, { headers });
      const d = await r.json();
      setDrafts(Array.isArray(d) ? d : (d.data || []));
    } catch { setDrafts([]); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const act = async (draftId: string, action: 'approve' | 'reject') => {
    setActioning(draftId);
    const remarks = action === 'reject' ? (window.prompt('Enter rejection reason:') ?? '') : '';
    try {
      const { slug, headers } = getH();
      await fetch(`${API_BASE}/exams/timetable-drafts/hod-action?tenant=${slug}`, {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId, action, remarks }),
      });
      await load();
    } catch { } finally { setActioning(null); }
  };

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 font-sans">
      <Sidebar role="hod" />
      <div className="flex-1 flex flex-col">
        <Header title="Timetable Approvals" />
        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-black text-[#1B1E28] dark:text-white">Timetable Review Queue</h1>
              <p className="text-sm text-slate-500">Review and approve timetable drafts submitted by department clerk</p>
            </div>
            <div className="flex gap-2">
              {['PENDING_HOD_APPROVAL', 'HOD_APPROVED', 'HOD_REJECTED', 'DRAFT'].map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${filter === f ? 'bg-[#5B4BFF] text-white' : 'bg-white dark:bg-slate-900 text-slate-500 border border-[#E7EAF3] dark:border-slate-800'}`}>
                  {STATUS_LABEL[f]}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-3 border-[#5B4BFF] border-t-transparent rounded-full animate-spin" /></div>
          ) : drafts.length === 0 ? (
            <div className="py-24 text-center space-y-3 bg-white dark:bg-slate-900 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800">
              <span className="text-5xl">📅</span>
              <p className="text-lg font-extrabold text-slate-600 dark:text-slate-300">No timetable drafts in this category</p>
            </div>
          ) : (
            <div className="space-y-5">
              {drafts.map((d) => {
                const slots: any[] = typeof d.slots === 'string' ? JSON.parse(d.slots || '[]') : (d.slots || []);
                return (
                  <div key={d.id} className="bg-white dark:bg-slate-900 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-5 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-extrabold text-base text-[#1B1E28] dark:text-white">{d.title}</h2>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${STATUS_BADGE[d.status] || STATUS_BADGE.DRAFT}`}>{STATUS_LABEL[d.status]}</span>
                        </div>
                        <p className="text-sm text-slate-500">
                          {d.semester ? `Semester ${d.semester}` : ''} {d.academic_year ? `· ${d.academic_year}` : ''} {d.notes ? `· ${d.notes}` : ''}
                        </p>
                        <p className="text-xs text-slate-400">{slots.length} slot(s) defined</p>
                      </div>
                      {filter === 'PENDING_HOD_APPROVAL' && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => act(d.id, 'approve')} disabled={actioning === d.id}
                            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-extrabold disabled:opacity-50 shadow-sm shadow-emerald-500/30">
                            ✓ Approve & Go Live
                          </button>
                          <button onClick={() => act(d.id, 'reject')} disabled={actioning === d.id}
                            className="px-4 py-2 rounded-xl bg-rose-100 hover:bg-rose-500 hover:text-white text-rose-600 text-sm font-extrabold disabled:opacity-50">
                            ✕ Reject
                          </button>
                        </div>
                      )}
                      {d.status === 'HOD_APPROVED' && (
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-extrabold flex items-center gap-1">
                          🟢 Live — Faculty &amp; Students can see this
                        </span>
                      )}
                    </div>
                    {slots.length > 0 && (
                      <div className="px-5 pb-5">
                        <div className="overflow-x-auto rounded-xl border border-[#E7EAF3] dark:border-slate-800">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-[#F6F8FC] dark:bg-slate-800/60">
                                <th className="px-3 py-2 text-left font-extrabold text-[#1B1E28] dark:text-white">Day</th>
                                <th className="px-3 py-2 text-left font-extrabold text-[#1B1E28] dark:text-white">Time</th>
                                <th className="px-3 py-2 text-left font-extrabold text-[#1B1E28] dark:text-white">Subject</th>
                                <th className="px-3 py-2 text-left font-extrabold text-[#1B1E28] dark:text-white">Faculty</th>
                                <th className="px-3 py-2 text-left font-extrabold text-[#1B1E28] dark:text-white">Room</th>
                              </tr>
                            </thead>
                            <tbody>
                              {slots.map((s: any, i: number) => (
                                <tr key={i} className="border-t border-[#E7EAF3] dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                  <td className="px-3 py-2 font-bold text-[#2D2575] dark:text-indigo-300">{dayNames[s.dayOfWeek - 1] || s.dayOfWeek || '—'}</td>
                                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{s.startTime} – {s.endTime}</td>
                                  <td className="px-3 py-2 font-semibold text-[#1B1E28] dark:text-white">{s.subjectName || s.subject || '—'}</td>
                                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{s.facultyName || s.faculty || '—'}</td>
                                  <td className="px-3 py-2 text-slate-500">{s.room || s.location || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
