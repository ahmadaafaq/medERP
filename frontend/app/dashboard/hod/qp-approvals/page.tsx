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

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  PENDING_HOD_APPROVAL: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  HOD_APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  HOD_REJECTED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};
const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft', PENDING_HOD_APPROVAL: 'Pending Approval', HOD_APPROVED: 'HOD Approved', HOD_REJECTED: 'Rejected',
};

export default function HODQPApprovalsPage() {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('PENDING_HOD_APPROVAL');
  const [actioning, setActioning] = useState<string | null>(null);
  const [selected, setSelected] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { slug, headers } = getH();
      const url = filter === 'PENDING_HOD_APPROVAL'
        ? `${API_BASE}/exams/papers/pending-hod-approval?tenant=${slug}`
        : filter === 'HOD_APPROVED'
        ? `${API_BASE}/exams/papers/approved?tenant=${slug}`
        : `${API_BASE}/exams/papers?tenant=${slug}&status=${filter}`;
      const r = await fetch(url, { headers });
      const d = await r.json();
      setPapers(Array.isArray(d) ? d : (d.data || []));
    } catch { setPapers([]); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const act = async (paperId: string, action: 'approve' | 'reject') => {
    setActioning(paperId);
    const remarks = action === 'reject' ? (window.prompt('Enter rejection reason:') ?? '') : '';
    try {
      const { slug, headers } = getH();
      await fetch(`${API_BASE}/exams/papers/hod-action?tenant=${slug}`, {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId, action, remarks }),
      });
      setSelected(null);
      await load();
    } catch { } finally { setActioning(null); }
  };

  const filters = ['PENDING_HOD_APPROVAL', 'HOD_APPROVED', 'HOD_REJECTED', 'DRAFT'];

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 font-sans">
      <Sidebar role="hod" />
      <div className="flex-1 flex flex-col">
        <Header title="Question Paper Approvals" />
        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-[#1B1E28] dark:text-white">Question Paper Review Queue</h1>
              <p className="text-sm text-slate-500">Approve or reject papers submitted by department clerk</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {filters.map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${filter === f ? 'bg-[#5B4BFF] text-white' : 'bg-white dark:bg-slate-900 text-slate-500 border border-[#E7EAF3] dark:border-slate-800 hover:border-[#5B4BFF]/50'}`}>
                  {STATUS_LABEL[f] || f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-3 border-[#5B4BFF] border-t-transparent rounded-full animate-spin" /></div>
          ) : papers.length === 0 ? (
            <div className="py-24 text-center space-y-3 bg-white dark:bg-slate-900 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800">
              <span className="text-5xl">📋</span>
              <p className="text-lg font-extrabold text-slate-600 dark:text-slate-300">No papers in this category</p>
              <p className="text-sm text-slate-400">Check a different status filter above</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {papers.map((paper) => (
                <div key={paper.id} className="p-5 bg-white dark:bg-slate-900 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-extrabold text-base text-[#1B1E28] dark:text-white">{paper.name}</h2>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${STATUS_COLORS[paper.status] || STATUS_COLORS.DRAFT}`}>
                          {STATUS_LABEL[paper.status] || paper.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{paper.subject_name || '—'} · Code: {paper.code} · {paper.type || 'THEORY'}</p>
                      <div className="flex gap-4 text-xs text-slate-400">
                        <span>📊 Max: <b className="text-[#1B1E28] dark:text-white">{paper.max_marks}M</b></span>
                        <span>✅ Pass: <b className="text-[#1B1E28] dark:text-white">{paper.passing_marks}M</b></span>
                        <span>⏱️ Duration: <b className="text-[#1B1E28] dark:text-white">{paper.duration_minutes || 60}min</b></span>
                      </div>
                    </div>
                    {filter === 'PENDING_HOD_APPROVAL' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => act(paper.id, 'approve')} disabled={actioning === paper.id}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-extrabold transition-all disabled:opacity-50 shadow-sm shadow-emerald-500/30">
                          ✓ Approve & Publish
                        </button>
                        <button onClick={() => act(paper.id, 'reject')} disabled={actioning === paper.id}
                          className="px-4 py-2 rounded-xl bg-rose-100 hover:bg-rose-500 hover:text-white text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 text-sm font-extrabold transition-all disabled:opacity-50">
                          ✕ Reject
                        </button>
                      </div>
                    )}
                  </div>
                  {paper.sections && (
                    <details className="mt-3">
                      <summary className="text-xs font-bold text-[#5B4BFF] cursor-pointer hover:underline">View Sections & Questions</summary>
                      <pre className="mt-2 text-[11px] bg-slate-50 dark:bg-slate-800 rounded-xl p-3 overflow-x-auto text-slate-600 dark:text-slate-300 max-h-48">
                        {typeof paper.sections === 'string' ? paper.sections : JSON.stringify(paper.sections, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
