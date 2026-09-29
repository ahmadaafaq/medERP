'use client';
import { useState, useEffect } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
function getH() {
  if (typeof window === 'undefined') return { slug: '', headers: {} as any };
  const slug = (localStorage.getItem('tenantSlug') || '').replace(/^tenant_/, '') || 'default';
  const token = localStorage.getItem('token') || '';
  return { slug, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'x-tenant-slug': slug, 'Content-Type': 'application/json' } };
}

const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  DRAFT: { cls: 'bg-slate-100 text-slate-600', label: 'Draft' },
  PENDING_HOD_APPROVAL: { cls: 'bg-amber-100 text-amber-700', label: '⏳ Pending HOD Approval' },
  HOD_APPROVED: { cls: 'bg-emerald-100 text-emerald-700', label: '✅ HOD Approved' },
  HOD_REJECTED: { cls: 'bg-rose-100 text-rose-700', label: '❌ Rejected by HOD' },
};

export default function ClerkQPDesignerPage() {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', subjectId: '', batchId: '', maxMarks: '100', passingMarks: '40', type: 'THEORY', durationMinutes: '180', sections: '' });

  const load = async () => {
    setLoading(true);
    try {
      const { slug, headers } = getH();
      const r = await fetch(`${API_BASE}/exams/papers?tenant=${slug}`, { headers });
      const d = await r.json();
      setPapers(Array.isArray(d) ? d : (d.data || []));
    } catch { setPapers([]); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { slug, headers } = getH();
      let sections: any = [];
      try { sections = JSON.parse(form.sections || '[]'); } catch {}
      await fetch(`${API_BASE}/exams/papers?tenant=${slug}`, {
        method: 'POST', headers,
        body: JSON.stringify({ ...form, maxMarks: +form.maxMarks, passingMarks: +form.passingMarks, durationMinutes: +form.durationMinutes, sections }),
      });
      setForm({ code: '', name: '', subjectId: '', batchId: '', maxMarks: '100', passingMarks: '40', type: 'THEORY', durationMinutes: '180', sections: '' });
      setShowForm(false);
      await load();
    } catch { } finally { setSubmitting(false); }
  };

  const submitForApproval = async (paperId: string) => {
    setSending(paperId);
    try {
      const { slug, headers } = getH();
      await fetch(`${API_BASE}/exams/papers/submit-for-approval?tenant=${slug}`, {
        method: 'POST', headers,
        body: JSON.stringify({ paperId }),
      });
      await load();
    } catch { } finally { setSending(null); }
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 font-sans">
      <Sidebar role="clerk" />
      <div className="flex-1 flex flex-col">
        <Header title="Question Paper Designer" />
        <main className="p-6 space-y-6 max-w-6xl mx-auto w-full">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-[#1B1E28] dark:text-white">Question Paper Designer</h1>
              <p className="text-sm text-slate-500">Create question papers and submit them to HOD for approval</p>
            </div>
            <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#7867FF] text-white text-sm font-extrabold transition-all shadow-sm shadow-[#5B4BFF]/30">
              {showForm ? '✕ Cancel' : '+ New Question Paper'}
            </button>
          </div>

          {/* Create Form */}
          {showForm && (
            <form onSubmit={submit} className="p-6 bg-white dark:bg-slate-900 rounded-[22px] border border-[#5B4BFF]/30 shadow-lg space-y-4">
              <h2 className="font-extrabold text-base text-[#1B1E28] dark:text-white">Design New Question Paper</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'code', label: 'Paper Code *', placeholder: 'e.g. EXAM-CS-2024-01' },
                  { key: 'name', label: 'Paper Name *', placeholder: 'e.g. Computer Networks Mid-Term' },
                  { key: 'subjectId', label: 'Subject ID (UUID)', placeholder: 'Subject UUID from system' },
                  { key: 'batchId', label: 'Batch ID (UUID)', placeholder: 'Batch UUID from system' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">{label}</label>
                    <input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-sm font-medium text-[#1B1E28] dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#5B4BFF]" />
                  </div>
                ))}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Max Marks *</label>
                  <input type="number" value={form.maxMarks} onChange={e => setForm(f => ({ ...f, maxMarks: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-sm font-medium text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Passing Marks *</label>
                  <input type="number" value={form.passingMarks} onChange={e => setForm(f => ({ ...f, passingMarks: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-sm font-medium text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Duration (minutes)</label>
                  <input type="number" value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-sm font-medium text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Paper Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-sm font-medium text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]">
                    <option value="THEORY">Theory</option>
                    <option value="PRACTICAL">Practical</option>
                    <option value="MCQ">MCQ</option>
                    <option value="MIXED">Mixed</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Sections / Questions (JSON format) <span className="font-normal text-slate-400">optional</span></label>
                <textarea value={form.sections} onChange={e => setForm(f => ({ ...f, sections: e.target.value }))} rows={5}
                  placeholder={'[{"title":"Section A","questions":[{"questionText":"Define OSI Model?","marks":10}]}]'}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-sm font-mono text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] resize-none" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={submitting || !form.code || !form.name} className="px-5 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#7867FF] text-white text-sm font-extrabold disabled:opacity-50 transition-all">
                  {submitting ? 'Saving...' : '💾 Save as Draft'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-extrabold">Cancel</button>
              </div>
            </form>
          )}

          {/* Papers List */}
          {loading ? (
            <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-[#5B4BFF] border-t-transparent rounded-full animate-spin" /></div>
          ) : papers.length === 0 ? (
            <div className="py-20 text-center space-y-3 bg-white dark:bg-slate-900 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800">
              <span className="text-5xl">📋</span>
              <p className="text-lg font-extrabold text-slate-600 dark:text-slate-300">No question papers yet</p>
              <p className="text-sm text-slate-400">Click &quot;+ New Question Paper&quot; to create one</p>
            </div>
          ) : (
            <div className="space-y-4">
              {papers.map((p) => {
                const badge = STATUS_BADGE[p.status] || STATUS_BADGE.DRAFT;
                return (
                  <div key={p.id} className="p-5 bg-white dark:bg-slate-900 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-sm text-[#1B1E28] dark:text-white">{p.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${badge.cls}`}>{badge.label}</span>
                      </div>
                      <p className="text-xs text-slate-500">{p.subject_name || '—'} · Code: {p.code} · {p.type || 'THEORY'} · {p.max_marks}M</p>
                    </div>
                    {(!p.status || p.status === 'DRAFT') && (
                      <button onClick={() => submitForApproval(p.id)} disabled={sending === p.id}
                        className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold transition-all shadow-sm disabled:opacity-50 whitespace-nowrap">
                        {sending === p.id ? 'Sending...' : '📤 Submit to HOD'}
                      </button>
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
