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

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  DRAFT: { cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', label: 'Draft' },
  PENDING_HOD_APPROVAL: { cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', label: '⏳ Pending HOD Approval' },
  HOD_APPROVED: { cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', label: '✅ Live — HOD Approved' },
  HOD_REJECTED: { cls: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400', label: '❌ Rejected by HOD' },
};

interface Slot { dayOfWeek: number; startTime: string; endTime: string; subjectName: string; facultyName: string; room: string; }
const EMPTY_SLOT: Slot = { dayOfWeek: 1, startTime: '09:00', endTime: '10:00', subjectName: '', facultyName: '', room: '' };

export default function ClerkTimetableDesignerPage() {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', departmentId: '', semester: '', academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1), notes: '' });
  const [slots, setSlots] = useState<Slot[]>([{ ...EMPTY_SLOT }]);

  const load = async () => {
    setLoading(true);
    try {
      const { slug, headers } = getH();
      const r = await fetch(`${API_BASE}/exams/timetable-drafts?tenant=${slug}`, { headers });
      const d = await r.json();
      setDrafts(Array.isArray(d) ? d : (d.data || []));
    } catch { setDrafts([]); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const addSlot = () => setSlots(s => [...s, { ...EMPTY_SLOT }]);
  const removeSlot = (i: number) => setSlots(s => s.filter((_, idx) => idx !== i));
  const updateSlot = (i: number, field: keyof Slot, val: any) => setSlots(s => s.map((sl, idx) => idx === i ? { ...sl, [field]: val } : sl));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { slug, headers } = getH();
      await fetch(`${API_BASE}/exams/timetable-drafts?tenant=${slug}`, {
        method: 'POST', headers,
        body: JSON.stringify({ ...form, slots }),
      });
      setForm({ title: '', departmentId: '', semester: '', academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1), notes: '' });
      setSlots([{ ...EMPTY_SLOT }]);
      setShowForm(false);
      await load();
    } catch { } finally { setSubmitting(false); }
  };

  const submitToHod = async (draftId: string) => {
    setSending(draftId);
    try {
      const { slug, headers } = getH();
      await fetch(`${API_BASE}/exams/timetable-drafts/submit-for-approval?tenant=${slug}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ draftId }),
      });
      await load();
    } catch { } finally { setSending(null); }
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="clerk" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Timetable Designer" />
        <main className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full flex-1">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-[#1B1E28] dark:text-white">Timetable Designer</h1>
              <p className="text-sm text-slate-500">Design weekly timetables and submit to HOD for approval. Once approved, they go live for faculty and students.</p>
            </div>
            <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#7867FF] text-white text-sm font-extrabold transition-all shadow-sm shadow-[#5B4BFF]/30">
              {showForm ? '✕ Cancel' : '+ New Timetable Draft'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={save} className="p-6 bg-white dark:bg-slate-900 rounded-[22px] border border-[#5B4BFF]/30 shadow-lg space-y-5">
              <h2 className="font-extrabold text-base text-[#1B1E28] dark:text-white">Create Timetable Draft</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'title', label: 'Title *', placeholder: 'e.g. CSE Sem 3 Timetable 2024' },
                  { key: 'departmentId', label: 'Department ID (UUID)', placeholder: 'Department UUID' },
                  { key: 'semester', label: 'Semester', placeholder: 'e.g. 3' },
                  { key: 'academicYear', label: 'Academic Year', placeholder: '2024-2025' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">{label}</label>
                    <input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                      className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-sm text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]" />
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Notes (optional)</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Any notes for HOD..."
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-sm text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] resize-none" />
              </div>

              {/* Slots */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-[#1B1E28] dark:text-white">Weekly Slots</h3>
                  <button type="button" onClick={addSlot} className="text-xs font-extrabold text-[#5B4BFF] hover:underline">+ Add Slot</button>
                </div>
                {slots.map((sl, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[#F6F8FC] dark:bg-slate-800/60 border border-[#E7EAF3] dark:border-slate-700 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 items-end">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">Day</label>
                      <select value={sl.dayOfWeek} onChange={e => updateSlot(i, 'dayOfWeek', +e.target.value)} className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-[#E7EAF3] dark:border-slate-600 text-xs font-medium text-[#1B1E28] dark:text-white">
                        {DAYS.map((d, di) => <option key={di} value={di + 1}>{d}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">Start</label>
                      <input type="time" value={sl.startTime} onChange={e => updateSlot(i, 'startTime', e.target.value)} className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-[#E7EAF3] dark:border-slate-600 text-xs text-[#1B1E28] dark:text-white" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">End</label>
                      <input type="time" value={sl.endTime} onChange={e => updateSlot(i, 'endTime', e.target.value)} className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-[#E7EAF3] dark:border-slate-600 text-xs text-[#1B1E28] dark:text-white" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">Subject</label>
                      <input value={sl.subjectName} onChange={e => updateSlot(i, 'subjectName', e.target.value)} placeholder="Subject" className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-[#E7EAF3] dark:border-slate-600 text-xs text-[#1B1E28] dark:text-white" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">Faculty</label>
                      <input value={sl.facultyName} onChange={e => updateSlot(i, 'facultyName', e.target.value)} placeholder="Faculty" className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-[#E7EAF3] dark:border-slate-600 text-xs text-[#1B1E28] dark:text-white" />
                    </div>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">Room</label>
                        <input value={sl.room} onChange={e => updateSlot(i, 'room', e.target.value)} placeholder="Room" className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-[#E7EAF3] dark:border-slate-600 text-xs text-[#1B1E28] dark:text-white" />
                      </div>
                      {slots.length > 1 && <button type="button" onClick={() => removeSlot(i)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-sm">✕</button>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={submitting || !form.title} className="px-5 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#7867FF] text-white text-sm font-extrabold disabled:opacity-50">
                  {submitting ? 'Saving...' : '💾 Save Draft'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-extrabold">Cancel</button>
              </div>
            </form>
          )}

          {/* Drafts List */}
          {loading ? (
            <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-[#5B4BFF] border-t-transparent rounded-full animate-spin" /></div>
          ) : drafts.length === 0 ? (
            <div className="py-20 text-center space-y-3 bg-white dark:bg-slate-900 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800">
              <span className="text-5xl">📅</span>
              <p className="text-lg font-extrabold text-slate-600 dark:text-slate-300">No timetable drafts yet</p>
              <p className="text-sm text-slate-400">Create a new timetable draft above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {drafts.map((d) => {
                const badge = STATUS_BADGE[d.status] || STATUS_BADGE.DRAFT;
                const slots: any[] = typeof d.slots === 'string' ? JSON.parse(d.slots || '[]') : (d.slots || []);
                return (
                  <div key={d.id} className="p-5 bg-white dark:bg-slate-900 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-sm text-[#1B1E28] dark:text-white">{d.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${badge.cls}`}>{badge.label}</span>
                        </div>
                        <p className="text-xs text-slate-500">{d.semester ? `Sem ${d.semester}` : ''} {d.academic_year || ''} · {slots.length} slots</p>
                        {d.hod_remarks && <p className="text-xs text-rose-600 font-semibold">HOD Note: {d.hod_remarks}</p>}
                      </div>
                      {(!d.status || d.status === 'DRAFT' || d.status === 'HOD_REJECTED') && (
                        <button onClick={() => submitToHod(d.id)} disabled={sending === d.id}
                          className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold transition-all shadow-sm disabled:opacity-50 whitespace-nowrap">
                          {sending === d.id ? 'Sending...' : '📤 Submit to HOD'}
                        </button>
                      )}
                    </div>
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
