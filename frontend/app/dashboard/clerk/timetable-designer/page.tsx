'use client';
import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

const API_BASE = '/api/v1';
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getH() {
  if (typeof window === 'undefined') return { slug: '', headers: {} as any };
  const slug = (localStorage.getItem('tenantSlug') || '').replace(/^tenant_/, '') || 'default';
  const token = localStorage.getItem('token') || '';
  return {
    slug,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'x-tenant-slug': slug,
      'Content-Type': 'application/json',
    },
  };
}

function getMondayOfWeek(d: Date) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}
function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(d.getDate() + n);
  return r;
}
function toISO(d: Date) { return d.toISOString().slice(0, 10); }
function fmtDate(s: string) {
  if (!s) return '';
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function genId() { return `slot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`; }

interface SlotDraft {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subjectName?: string;
  subjectCode?: string;
  facultyName?: string;
  facultyId?: string;
  room?: string;
  slotType?: string;
  unitName?: string;
  topic?: string;
  subTopics?: string;
  mappingStatus: 'PENDING' | 'LINKED';
  [k: string]: any;
}

interface Draft {
  id: string;
  title: string;
  status: string;
  week_start?: string;
  week_end?: string;
  slots: SlotDraft[];
  hod_remarks?: string;
}

const SLOT_TYPES = ['Lecture', 'Tutorial', 'Practical', 'DOAP', 'SGT', 'SDL', 'Seminar', 'Clinical Posting'];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
  PENDING_HOD_APPROVAL: 'bg-amber-100 text-amber-700 border-amber-200',
  HOD_APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  HOD_REJECTED: 'bg-rose-100 text-rose-700 border-rose-200',
};
const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING_HOD_APPROVAL: 'Pending HOD Approval',
  HOD_APPROVED: '✓ HOD Approved',
  HOD_REJECTED: '✕ Rejected',
};

const EMPTY_FORM = {
  dayOfWeek: 1, startTime: '09:00', endTime: '10:00',
  subjectName: '', subjectCode: '', facultyName: '', facultyId: '',
  room: '', slotType: 'Lecture', unitName: '', topic: '', subTopics: '',
};

export default function ClerkTimetableDesignerPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [currentDraft, setCurrentDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copying, setCopying] = useState(false);

  const weekStart = getMondayOfWeek(addDays(new Date(), weekOffset * 7));
  const weekEnd = addDays(weekStart, 5);
  const weekLabel = `${fmtDate(toISO(weekStart))} – ${fmtDate(toISO(weekEnd))}`;

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadWeekDraft = useCallback(async () => {
    setLoading(true);
    const { slug, headers } = getH();
    try {
      const url = `${API_BASE}/exams/timetable-drafts?tenant=${slug}&_=${Date.now()}`;
      const res = await fetch(url, { headers, cache: 'no-store' });
      const raw = await res.json();
      const list: Draft[] = (Array.isArray(raw) ? raw : (raw?.data || [])).map((d: any) => ({
        ...d,
        slots: typeof d.slots === 'string' ? JSON.parse(d.slots || '[]') : (d.slots || []),
      }));
      setDrafts(list);
      const ws = toISO(weekStart);
      const matched = list.find((d) => d.week_start === ws);
      setCurrentDraft(matched || null);
    } catch { showToast('Failed to load week data', 'error'); }
    finally { setLoading(false); }
  }, [weekOffset]);

  useEffect(() => { loadWeekDraft(); }, [loadWeekDraft]);

  const saveSlots = async (slots: SlotDraft[], draftToSave?: Draft | null) => {
    setSaving(true);
    const { slug, headers } = getH();
    const ws = toISO(weekStart);
    const we = toISO(weekEnd);
    const target = draftToSave !== undefined ? draftToSave : currentDraft;
    try {
      const body = {
        id: target?.id || undefined,
        title: target?.title || `Week of ${ws} – ${we}`,
        slots,
        weekStart: ws,
        weekEnd: we,
        notes: target?.hod_remarks,
      };
      const res = await fetch(`${API_BASE}/exams/timetable-drafts?tenant=${slug}`, {
        method: 'POST', headers, body: JSON.stringify(body),
      });
      const d = await res.json();
      await loadWeekDraft();
      showToast('Saved successfully');
      return d;
    } catch { showToast('Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const handleAddOrUpdateSlot = async () => {
    if (!form.subjectName.trim() || !form.facultyName.trim()) {
      showToast('Subject and Faculty are required', 'error'); return;
    }
    const slot: SlotDraft = {
      id: editingSlotId || genId(),
      dayOfWeek: Number(form.dayOfWeek),
      startTime: form.startTime + ':00',
      endTime: form.endTime + ':00',
      subjectName: form.subjectName,
      subjectCode: form.subjectCode,
      facultyName: form.facultyName,
      facultyId: form.facultyId,
      room: form.room,
      slotType: form.slotType,
      unitName: form.unitName,
      topic: form.topic,
      subTopics: form.subTopics,
      mappingStatus: (form.unitName && form.topic) ? 'LINKED' : 'PENDING',
    };
    const prevSlots: SlotDraft[] = currentDraft?.slots || [];
    const newSlots = editingSlotId
      ? prevSlots.map((s) => s.id === editingSlotId ? slot : s)
      : [...prevSlots, slot];
    await saveSlots(newSlots);
    setShowForm(false); setEditingSlotId(null); setForm({ ...EMPTY_FORM });
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Delete this slot?')) return;
    const newSlots = (currentDraft?.slots || []).filter((s) => s.id !== slotId);
    await saveSlots(newSlots);
  };

  const handleEditSlot = (slot: SlotDraft) => {
    setForm({
      dayOfWeek: slot.dayOfWeek,
      startTime: (slot.startTime || '09:00:00').slice(0, 5),
      endTime: (slot.endTime || '10:00:00').slice(0, 5),
      subjectName: slot.subjectName || '',
      subjectCode: slot.subjectCode || '',
      facultyName: slot.facultyName || '',
      facultyId: slot.facultyId || '',
      room: slot.room || '',
      slotType: slot.slotType || 'Lecture',
      unitName: slot.unitName || '',
      topic: slot.topic || '',
      subTopics: slot.subTopics || '',
    });
    setEditingSlotId(slot.id);
    setShowForm(true);
  };

  const handleSubmitToHOD = async () => {
    if (!currentDraft?.id) { showToast('Save at least one slot first', 'error'); return; }
    if ((currentDraft.slots?.length || 0) === 0) { showToast('Add at least one slot before submitting', 'error'); return; }
    if (!confirm(`Submit week "${weekLabel}" to HOD for approval?\n\n${currentDraft.slots.length} slot(s) will be sent for review.`)) return;
    setSubmitting(true);
    const { slug, headers } = getH();
    try {
      await fetch(`${API_BASE}/exams/timetable-drafts/submit-for-approval?tenant=${slug}`, {
        method: 'POST', headers, body: JSON.stringify({ draftId: currentDraft.id }),
      });
      await loadWeekDraft();
      showToast('Submitted to HOD for approval!');
    } catch { showToast('Failed to submit', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleCopyToNextWeek = async () => {
    if (!currentDraft?.id) { showToast('No draft to copy from', 'error'); return; }
    const nextWs = fmtDate(toISO(addDays(weekStart, 7)));
    const nextWe = fmtDate(toISO(addDays(weekEnd, 7)));
    if (!confirm(`Copy this week's timetable to ${nextWs} – ${nextWe}?\n\nThis creates a new DRAFT. All slots reset to PENDING status.`)) return;
    setCopying(true);
    const { slug, headers } = getH();
    try {
      await fetch(`${API_BASE}/exams/timetable-drafts/copy-to-next-week?tenant=${slug}`, {
        method: 'POST', headers, body: JSON.stringify({ draftId: currentDraft.id }),
      });
      setWeekOffset(weekOffset + 1);
      showToast('Copied to next week!');
    } catch { showToast('Failed to copy', 'error'); }
    finally { setCopying(false); }
  };

  const pendingCount = (currentDraft?.slots || []).filter((s) => !s.mappingStatus || s.mappingStatus === 'PENDING').length;
  const linkedCount = (currentDraft?.slots || []).filter((s) => s.mappingStatus === 'LINKED').length;
  const canEdit = !currentDraft || currentDraft.status === 'DRAFT' || currentDraft.status === 'HOD_REJECTED';
  const canSubmit = canEdit && (currentDraft?.slots?.length || 0) > 0;

  const slotsByDay: Record<number, SlotDraft[]> = {};
  for (let d = 1; d <= 6; d++) slotsByDay[d] = [];
  (currentDraft?.slots || []).forEach((s) => {
    const day = Number(s.dayOfWeek);
    if (day >= 1 && day <= 6) slotsByDay[day].push(s);
  });
  for (let d = 1; d <= 6; d++) {
    slotsByDay[d].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100">
      <Sidebar role="clerk" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Timetable Designer" />
        <main className="p-4 sm:p-6 space-y-5 max-w-full">

          {/* Toast */}
          {toast && (
            <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm flex items-center gap-2 animate-bounce-once ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
              {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
            </div>
          )}

          {/* Header card */}
          <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/10 text-violet-600 font-mono font-bold uppercase tracking-wider">CLERK · WEEK-BASED DESIGN</span>
                  {currentDraft && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold border ${STATUS_COLORS[currentDraft.status] || 'bg-slate-100 text-slate-600'}`}>
                      {STATUS_LABELS[currentDraft.status] || currentDraft.status}
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-black text-[#1B1E28] dark:text-white">Timetable Designer</h1>
                <p className="text-xs text-slate-500 mt-0.5">Design week-by-week schedules. Submit to HOD after finalising all slots.</p>
              </div>

              {/* Week navigator */}
              <div className="flex items-center gap-2 bg-[#F6F8FC] dark:bg-slate-800 rounded-2xl p-2 border border-[#E7EAF3] dark:border-slate-700">
                <button onClick={() => setWeekOffset(w => w - 1)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 hover:border-[#5B4BFF] hover:text-[#5B4BFF] transition-all cursor-pointer font-bold">‹</button>
                <div className="text-center min-w-[190px]">
                  <div className="text-xs font-extrabold text-[#1B1E28] dark:text-white">{weekLabel}</div>
                  <div className="text-[10px] text-slate-400">
                    {weekOffset === 0 ? 'Current Week' : weekOffset > 0 ? `+${weekOffset} week${weekOffset > 1 ? 's' : ''} ahead` : `${Math.abs(weekOffset)} week${Math.abs(weekOffset) > 1 ? 's' : ''} ago`}
                  </div>
                </div>
                <button onClick={() => setWeekOffset(w => w + 1)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 hover:border-[#5B4BFF] hover:text-[#5B4BFF] transition-all cursor-pointer font-bold">›</button>
              </div>
            </div>

            {/* Mapping stats + Action buttons */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {currentDraft && (
                <>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-700 font-extrabold border border-amber-200">⏳ {pendingCount} PENDING</span>
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-700 font-extrabold border border-emerald-200">✓ {linkedCount} LINKED</span>
                  </div>
                  {currentDraft.status === 'HOD_REJECTED' && currentDraft.hod_remarks && (
                    <div className="text-xs bg-rose-50 dark:bg-rose-950/30 border border-rose-200 px-3 py-1.5 rounded-xl font-bold text-rose-700 dark:text-rose-300">
                      💬 HOD: {currentDraft.hod_remarks}
                    </div>
                  )}
                  <div className="flex-1" />
                </>
              )}
              {!currentDraft && <div className="flex-1" />}
              {canEdit && (
                <button onClick={() => { setForm({ ...EMPTY_FORM }); setEditingSlotId(null); setShowForm(true); }}
                  className="px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4a3dd4] text-white text-xs font-extrabold shadow-md shadow-[#5B4BFF]/25 transition-all cursor-pointer flex items-center gap-1.5">
                  <span>＋</span><span>Add Slot</span>
                </button>
              )}
              {canSubmit && (
                <button onClick={handleSubmitToHOD} disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold shadow-md shadow-emerald-500/25 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60">
                  <span>📤</span><span>{submitting ? 'Submitting…' : 'Submit to HOD'}</span>
                </button>
              )}
              {currentDraft && currentDraft.status === 'HOD_APPROVED' && (
                <button onClick={handleCopyToNextWeek} disabled={copying}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#5B4BFF] to-[#F36C21] hover:opacity-90 text-white text-xs font-extrabold shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60">
                  <span>📋</span><span>{copying ? 'Copying…' : 'Copy to Next Week'}</span>
                </button>
              )}
              {!currentDraft && !loading && (
                <p className="text-sm text-slate-500 dark:text-slate-400">No timetable for this week yet — add a slot to start.</p>
              )}
            </div>
          </div>

          {/* Add / Edit Slot Modal */}
          {showForm && (
            <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-black text-[#1B1E28] dark:text-white">
                      {editingSlotId ? '✏️ Edit Slot' : '＋ New Slot'}
                    </h2>
                    <button onClick={() => { setShowForm(false); setEditingSlotId(null); }}
                      className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 cursor-pointer transition-all">✕</button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase tracking-wide">Day *</label>
                      <select value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: Number(e.target.value) }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:border-[#5B4BFF] transition-colors">
                        {DAY_NAMES.map((n, i) => <option key={i + 1} value={i + 1}>{n}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase tracking-wide">Start Time *</label>
                      <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono focus:outline-none focus:border-[#5B4BFF] transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase tracking-wide">End Time *</label>
                      <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono focus:outline-none focus:border-[#5B4BFF] transition-colors" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase tracking-wide">Subject Name *</label>
                      <input type="text" placeholder="e.g. DBMS, Physics, Anatomy" value={form.subjectName}
                        onChange={e => setForm(f => ({ ...f, subjectName: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:border-[#5B4BFF] transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase tracking-wide">Subject Code</label>
                      <input type="text" placeholder="e.g. CS301" value={form.subjectCode}
                        onChange={e => setForm(f => ({ ...f, subjectCode: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:border-[#5B4BFF] transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase tracking-wide">Session Type</label>
                      <select value={form.slotType} onChange={e => setForm(f => ({ ...f, slotType: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:border-[#5B4BFF] transition-colors">
                        {SLOT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase tracking-wide">Faculty Name *</label>
                      <input type="text" placeholder="e.g. Dr. Rajesh Kumar" value={form.facultyName}
                        onChange={e => setForm(f => ({ ...f, facultyName: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:border-[#5B4BFF] transition-colors" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase tracking-wide">Room / Location</label>
                      <input type="text" placeholder="e.g. LH-1, Room 204" value={form.room}
                        onChange={e => setForm(f => ({ ...f, room: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:border-[#5B4BFF] transition-colors" />
                    </div>

                    {/* Curriculum (optional) */}
                    <div className="col-span-2 border-t border-[#E7EAF3] dark:border-slate-700 pt-4 mt-1">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                        📚 Curriculum Link <span className="normal-case font-normal text-slate-400">(optional — faculty can link later)</span>
                      </p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase tracking-wide">Unit</label>
                      <input type="text" placeholder="e.g. Unit 1: Introduction to DBMS" value={form.unitName}
                        onChange={e => setForm(f => ({ ...f, unitName: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:border-[#5B4BFF] transition-colors" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase tracking-wide">Topic</label>
                      <input type="text" placeholder="e.g. ER Diagrams" value={form.topic}
                        onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:border-[#5B4BFF] transition-colors" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase tracking-wide">Sub-Topics</label>
                      <input type="text" placeholder="Comma-separated subtopics" value={form.subTopics}
                        onChange={e => setForm(f => ({ ...f, subTopics: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:border-[#5B4BFF] transition-colors" />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button onClick={() => { setShowForm(false); setEditingSlotId(null); }}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-extrabold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer">
                      Cancel
                    </button>
                    <button onClick={handleAddOrUpdateSlot} disabled={saving}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4a3dd4] text-white text-sm font-extrabold shadow-md shadow-[#5B4BFF]/25 transition-all cursor-pointer disabled:opacity-60">
                      {saving ? 'Saving…' : editingSlotId ? 'Update Slot' : 'Add Slot'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Week Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-[3px] border-[#5B4BFF] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((day) => {
                const daySlots = slotsByDay[day] || [];
                const dayDate = addDays(weekStart, day - 1);
                return (
                  <div key={day} className="bg-white dark:bg-slate-900 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-gradient-to-r from-[#2D2575] to-[#5B4BFF] text-white flex items-center justify-between">
                      <div>
                        <div className="font-black text-sm">{DAY_NAMES[day - 1]}</div>
                        <div className="text-[10px] text-white/70 font-mono">{fmtDate(toISO(dayDate))}</div>
                      </div>
                      <span className="text-[10px] font-extrabold bg-white/20 px-2 py-0.5 rounded-full">
                        {daySlots.length} slot{daySlots.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="p-3 space-y-2 min-h-[90px]">
                      {daySlots.length === 0 && (
                        <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-600 italic">No classes scheduled</div>
                      )}
                      {daySlots.map((slot) => (
                        <div key={slot.id} className="rounded-xl border border-[#E7EAF3] dark:border-slate-700 p-3 hover:border-[#5B4BFF]/40 transition-all group cursor-default">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="min-w-0 flex-1">
                              <div className="font-extrabold text-xs text-[#1B1E28] dark:text-white truncate">{slot.subjectName || '—'}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{(slot.startTime || '').slice(0, 5)} – {(slot.endTime || '').slice(0, 5)}</div>
                            </div>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full flex-shrink-0 border ${slot.mappingStatus === 'LINKED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                              {slot.mappingStatus === 'LINKED' ? '✓ LINKED' : '⏳ PENDING'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-600 dark:text-slate-400 space-y-0.5">
                            <div className="flex items-center gap-1"><span className="opacity-50">👤</span><span className="font-semibold truncate">{slot.facultyName || '—'}</span></div>
                            {slot.room && <div className="flex items-center gap-1"><span className="opacity-50">📍</span><span className="truncate">{slot.room}</span></div>}
                            {slot.slotType && <div className="flex items-center gap-1"><span className="opacity-50">🏷</span><span>{slot.slotType}</span></div>}
                            {slot.unitName && <div className="flex items-center gap-1"><span className="opacity-50">📖</span><span className="truncate text-[#5B4BFF] font-semibold">{slot.unitName}</span></div>}
                            {slot.topic && <div className="flex items-center gap-1"><span className="opacity-50">💡</span><span className="truncate">{slot.topic}</span></div>}
                          </div>
                          {canEdit && (
                            <div className="flex gap-1.5 mt-2.5 opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={() => handleEditSlot(slot)}
                                className="flex-1 text-[10px] py-1 rounded-lg border border-[#5B4BFF]/30 text-[#5B4BFF] hover:bg-[#5B4BFF]/10 font-bold cursor-pointer transition-all">
                                Edit
                              </button>
                              <button onClick={() => handleDeleteSlot(slot.id)}
                                className="flex-1 text-[10px] py-1 rounded-lg border border-rose-300 text-rose-500 hover:bg-rose-50 font-bold cursor-pointer transition-all">
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* All Drafts List */}
          {drafts.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-[#1B1E28] dark:text-white">All Drafts ({drafts.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#F6F8FC] dark:bg-slate-800/60">
                      {['Week', 'Status', 'Slots', 'Pending / Linked', 'Action'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left font-extrabold text-slate-500 dark:text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {drafts.map((d) => {
                      const dSlots: SlotDraft[] = typeof d.slots === 'string' ? JSON.parse(d.slots || '[]') : (d.slots || []);
                      const dPending = dSlots.filter(s => !s.mappingStatus || s.mappingStatus === 'PENDING').length;
                      const dLinked = dSlots.filter(s => s.mappingStatus === 'LINKED').length;
                      const isCurrent = currentDraft?.id === d.id;
                      return (
                        <tr key={d.id} className={`border-t border-[#E7EAF3] dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 ${isCurrent ? 'bg-violet-50/50 dark:bg-violet-950/20' : ''}`}>
                          <td className="px-4 py-3 font-bold text-[#1B1E28] dark:text-white">
                            <div>{d.title || '—'}</div>
                            {d.week_start && <div className="text-[10px] text-slate-400 font-normal">{fmtDate(d.week_start)} – {fmtDate(d.week_end || '')}</div>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${STATUS_COLORS[d.status] || 'bg-slate-100 text-slate-600'}`}>
                              {STATUS_LABELS[d.status] || d.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{dSlots.length}</td>
                          <td className="px-4 py-3">
                            <span className="text-amber-600 font-bold">{dPending}P</span>
                            <span className="text-slate-400 mx-1">/</span>
                            <span className="text-emerald-600 font-bold">{dLinked}L</span>
                          </td>
                          <td className="px-4 py-3">
                            {!isCurrent && d.week_start && (
                              <button onClick={() => {
                                const dStart = new Date(d.week_start + 'T00:00:00');
                                const curStart = getMondayOfWeek(new Date());
                                const diff = Math.round((dStart.getTime() - curStart.getTime()) / (7 * 86400000));
                                setWeekOffset(diff);
                              }} className="text-[11px] px-2.5 py-1 rounded-lg bg-[#5B4BFF]/10 text-[#5B4BFF] hover:bg-[#5B4BFF]/20 font-bold cursor-pointer transition-all">
                                Go to Week
                              </button>
                            )}
                            {isCurrent && <span className="text-[10px] text-[#5B4BFF] font-extrabold">← Viewing</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
