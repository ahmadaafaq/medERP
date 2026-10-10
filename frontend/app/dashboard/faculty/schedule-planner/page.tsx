'use client';
import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

const API_BASE = '/api/v1';
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getH() {
  if (typeof window === 'undefined') return { slug: '', headers: {} as any, facultyId: '', facultyEmpId: '', facultyName: '' };
  const slug = (localStorage.getItem('tenantSlug') || '').replace(/^tenant_/, '') || 'default';
  const token = localStorage.getItem('token') || '';
  const facultyId = localStorage.getItem('userId') || localStorage.getItem('facultyId') || '';
  const facultyEmpId = localStorage.getItem('empId') || localStorage.getItem('facultyEmpId') || '';
  const facultyName = localStorage.getItem('name') || localStorage.getItem('facultyName') || '';
  return {
    slug,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'x-tenant-slug': slug,
      'Content-Type': 'application/json',
    },
    facultyId,
    facultyEmpId,
    facultyName,
  };
}

function fmtDate(s: string) {
  if (!s) return '';
  return new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface SlotDraft {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subjectName?: string;
  subjectCode?: string;
  facultyName?: string;
  room?: string;
  slotType?: string;
  unitId?: string;
  unitName?: string;
  topic?: string;
  subTopics?: string;
  competencyCodes?: string;
  mappingStatus: 'PENDING' | 'LINKED';
  [k: string]: any;
}

interface WeekDraft {
  id: string;
  title: string;
  status: string;
  week_start?: string;
  week_end?: string;
  slots: SlotDraft[];
}

const EMPTY_LINK = { unitId: '', unitName: '', topic: '', subTopics: '', competencyCodes: '' };

export default function FacultySchedulePlannerPage() {
  const [weeks, setWeeks] = useState<WeekDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<{ draft: WeekDraft; slot: SlotDraft } | null>(null);
  const [linkForm, setLinkForm] = useState({ ...EMPTY_LINK });
  const [linking, setLinking] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadMySchedule = useCallback(async () => {
    setLoading(true);
    const { slug, headers, facultyId, facultyEmpId } = getH();
    try {
      const ts = Date.now();
      const url = `${API_BASE}/exams/timetable-drafts/faculty-schedule?tenant=${slug}&facultyId=${encodeURIComponent(facultyId)}&facultyEmpId=${encodeURIComponent(facultyEmpId)}&_=${ts}`;
      const res = await fetch(url, { headers, cache: 'no-store' });
      const raw = await res.json();
      const list: WeekDraft[] = (Array.isArray(raw) ? raw : (raw?.data || [])).map((d: any) => ({
        ...d,
        slots: typeof d.slots === 'string' ? JSON.parse(d.slots || '[]') : (d.slots || []),
      }));
      setWeeks(list);
      if (list.length > 0 && !expandedWeek) setExpandedWeek(list[0].id);
    } catch { showToast('Failed to load your schedule', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadMySchedule(); }, [loadMySchedule]);

  const openLinkModal = (draft: WeekDraft, slot: SlotDraft) => {
    setSelectedSlot({ draft, slot });
    setLinkForm({
      unitId: slot.unitId || '',
      unitName: slot.unitName || '',
      topic: slot.topic || '',
      subTopics: slot.subTopics || '',
      competencyCodes: slot.competencyCodes || '',
    });
  };

  const handleLink = async () => {
    if (!selectedSlot) return;
    if (!linkForm.unitName.trim() || !linkForm.topic.trim()) {
      showToast('Unit and Topic are required to link a slot', 'error'); return;
    }
    setLinking(true);
    const { slug, headers } = getH();
    try {
      const res = await fetch(`${API_BASE}/exams/timetable-drafts/link-slot?tenant=${slug}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          draftId: selectedSlot.draft.id,
          slotId: selectedSlot.slot.id,
          unitId: linkForm.unitId,
          unitName: linkForm.unitName,
          topic: linkForm.topic,
          subTopics: linkForm.subTopics,
          competencyCodes: linkForm.competencyCodes,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.message || 'Failed to link slot');
      showToast('Slot linked successfully! Status → LINKED ✓');
      setSelectedSlot(null);
      await loadMySchedule();
    } catch (err: any) {
      showToast(err.message || 'Failed to link slot', 'error');
    } finally { setLinking(false); }
  };

  const totalSlots = weeks.reduce((acc, w) => acc + (w.slots?.length || 0), 0);
  const pendingSlots = weeks.reduce((acc, w) => acc + (w.slots || []).filter(s => !s.mappingStatus || s.mappingStatus === 'PENDING').length, 0);
  const linkedSlots = weeks.reduce((acc, w) => acc + (w.slots || []).filter(s => s.mappingStatus === 'LINKED').length, 0);

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100">
      <Sidebar role="faculty" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Schedule Planner" />
        <main className="p-4 sm:p-6 space-y-5 max-w-5xl">

          {/* Toast */}
          {toast && (
            <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm flex items-center gap-2 ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
              {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
            </div>
          )}

          {/* Page header */}
          <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#F36C21]/10 text-[#F36C21] font-mono font-bold uppercase tracking-wider">FACULTY · SCHEDULE PLANNER</span>
                </div>
                <h1 className="text-xl font-black text-[#1B1E28] dark:text-white">Schedule Planner (Mapping)</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Link Unit → Topic → SubTopics to each of your slots. HOD cannot approve until all your slots are LINKED.
                </p>
              </div>
              <button onClick={loadMySchedule}
                className="px-4 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-extrabold hover:border-[#5B4BFF] hover:text-[#5B4BFF] transition-all cursor-pointer">
                ↻ Refresh
              </button>
            </div>

            {/* Stats row */}
            {!loading && (
              <div className="mt-4 flex flex-wrap gap-3">
                <div className="flex-1 min-w-[100px] bg-[#F6F8FC] dark:bg-slate-800 rounded-2xl p-3 text-center border border-[#E7EAF3] dark:border-slate-700">
                  <div className="text-2xl font-black text-[#1B1E28] dark:text-white">{weeks.length}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Weeks</div>
                </div>
                <div className="flex-1 min-w-[100px] bg-[#F6F8FC] dark:bg-slate-800 rounded-2xl p-3 text-center border border-[#E7EAF3] dark:border-slate-700">
                  <div className="text-2xl font-black text-[#1B1E28] dark:text-white">{totalSlots}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Total Slots</div>
                </div>
                <div className="flex-1 min-w-[100px] bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-3 text-center border border-amber-200 dark:border-amber-800">
                  <div className="text-2xl font-black text-amber-700 dark:text-amber-400">{pendingSlots}</div>
                  <div className="text-[10px] text-amber-600 font-bold uppercase tracking-wide">⏳ Pending</div>
                </div>
                <div className="flex-1 min-w-[100px] bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-3 text-center border border-emerald-200 dark:border-emerald-800">
                  <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{linkedSlots}</div>
                  <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wide">✓ Linked</div>
                </div>
              </div>
            )}
          </div>

          {/* Weeks list */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-[3px] border-[#5B4BFF] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : weeks.length === 0 ? (
            <div className="py-24 text-center space-y-3 bg-white dark:bg-slate-900 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800">
              <span className="text-5xl">📅</span>
              <p className="text-lg font-extrabold text-slate-600 dark:text-slate-300">No submitted weeks found</p>
              <p className="text-sm text-slate-500">The Clerk must design and submit a week's timetable before you see slots here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {weeks.map((week) => {
                const wPending = (week.slots || []).filter(s => !s.mappingStatus || s.mappingStatus === 'PENDING').length;
                const wLinked = (week.slots || []).filter(s => s.mappingStatus === 'LINKED').length;
                const isExpanded = expandedWeek === week.id;
                const allLinked = wPending === 0 && week.slots.length > 0;

                return (
                  <div key={week.id} className="bg-white dark:bg-slate-900 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800 shadow-sm overflow-hidden">
                    {/* Week header */}
                    <button
                      className="w-full px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all cursor-pointer text-left"
                      onClick={() => setExpandedWeek(isExpanded ? null : week.id)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${allLinked ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                        <div className="min-w-0">
                          <div className="font-extrabold text-sm text-[#1B1E28] dark:text-white">{week.title || 'Untitled Week'}</div>
                          {week.week_start && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              {fmtDate(week.week_start)} – {fmtDate(week.week_end || '')}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border bg-amber-100 text-amber-700 border-amber-200">⏳ {wPending}</span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border bg-emerald-100 text-emerald-700 border-emerald-200">✓ {wLinked}</span>
                        <span className={`w-5 h-5 flex items-center justify-center rounded-full text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>▾</span>
                      </div>
                    </button>

                    {/* Slots table */}
                    {isExpanded && (
                      <div className="border-t border-[#E7EAF3] dark:border-slate-800">
                        {week.slots.length === 0 ? (
                          <div className="py-8 text-center text-sm text-slate-400">No slots assigned to you this week.</div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-[#F6F8FC] dark:bg-slate-800/60">
                                  {['Day', 'Time', 'Subject', 'Type', 'Room', 'Unit', 'Topic', 'Status', 'Action'].map(h => (
                                    <th key={h} className="px-4 py-2.5 text-left font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {[...week.slots].sort((a, b) => {
                                  const dayDiff = (a.dayOfWeek || 0) - (b.dayOfWeek || 0);
                                  if (dayDiff !== 0) return dayDiff;
                                  return (a.startTime || '').localeCompare(b.startTime || '');
                                }).map((slot) => (
                                  <tr key={slot.id} className={`border-t border-[#E7EAF3] dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 ${slot.mappingStatus === 'LINKED' ? 'bg-emerald-50/30 dark:bg-emerald-950/10' : ''}`}>
                                    <td className="px-4 py-2.5 font-bold text-[#2D2575] dark:text-indigo-300 whitespace-nowrap">
                                      {DAY_NAMES[(slot.dayOfWeek || 1) - 1] || '—'}
                                    </td>
                                    <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                      {(slot.startTime || '').slice(0, 5)} – {(slot.endTime || '').slice(0, 5)}
                                    </td>
                                    <td className="px-4 py-2.5 font-semibold text-[#1B1E28] dark:text-white max-w-[120px]">
                                      <div className="truncate">{slot.subjectName || '—'}</div>
                                      {slot.subjectCode && <div className="text-[10px] text-slate-400 font-mono">{slot.subjectCode}</div>}
                                    </td>
                                    <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{slot.slotType || '—'}</td>
                                    <td className="px-4 py-2.5 text-slate-500 font-mono">{slot.room || '—'}</td>
                                    <td className="px-4 py-2.5 text-indigo-600 dark:text-indigo-400 max-w-[120px]">
                                      <div className="truncate font-medium">{slot.unitName || <span className="text-slate-400 italic">—</span>}</div>
                                    </td>
                                    <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 max-w-[140px]">
                                      <div className="truncate">{slot.topic || <span className="text-slate-400 italic">—</span>}</div>
                                    </td>
                                    <td className="px-4 py-2.5">
                                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border whitespace-nowrap ${slot.mappingStatus === 'LINKED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                        {slot.mappingStatus === 'LINKED' ? '✓ LINKED' : '⏳ PENDING'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2.5 whitespace-nowrap">
                                      {slot.mappingStatus !== 'LINKED' ? (
                                        <button onClick={() => openLinkModal(week, slot)}
                                          className="text-[11px] px-3 py-1 rounded-lg bg-[#5B4BFF] hover:bg-[#4a3dd4] text-white font-extrabold cursor-pointer transition-all shadow-sm shadow-[#5B4BFF]/20">
                                          Link →
                                        </button>
                                      ) : (
                                        <button onClick={() => openLinkModal(week, slot)}
                                          className="text-[11px] px-3 py-1 rounded-lg border border-emerald-300 text-emerald-600 hover:bg-emerald-50 font-extrabold cursor-pointer transition-all">
                                          Edit Link
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Link Slot Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800 shadow-2xl w-full max-w-lg">
            <div className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-lg font-black text-[#1B1E28] dark:text-white">
                    {selectedSlot.slot.mappingStatus === 'LINKED' ? '✏️ Edit Link' : '🔗 Link Schedule'}
                  </h2>
                  <div className="mt-1 text-xs text-slate-500 space-y-0.5">
                    <div><span className="font-bold text-[#1B1E28] dark:text-white">{selectedSlot.slot.subjectName}</span> — {DAY_NAMES[(selectedSlot.slot.dayOfWeek || 1) - 1]}</div>
                    <div className="font-mono">{(selectedSlot.slot.startTime || '').slice(0, 5)} – {(selectedSlot.slot.endTime || '').slice(0, 5)} {selectedSlot.slot.room && `· ${selectedSlot.slot.room}`}</div>
                    <div className="text-[10px] text-slate-400">{selectedSlot.draft.title}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedSlot(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 cursor-pointer transition-all">✕</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase tracking-wide">Unit Name *</label>
                  <input type="text" placeholder="e.g. Unit 1: Introduction" value={linkForm.unitName}
                    onChange={e => setLinkForm(f => ({ ...f, unitName: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:border-[#5B4BFF] transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase tracking-wide">Topic *</label>
                  <input type="text" placeholder="e.g. Action Potential" value={linkForm.topic}
                    onChange={e => setLinkForm(f => ({ ...f, topic: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:border-[#5B4BFF] transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase tracking-wide">Sub-Topics</label>
                  <input type="text" placeholder="Resting membrane potential, Depolarisation, Repolarisation" value={linkForm.subTopics}
                    onChange={e => setLinkForm(f => ({ ...f, subTopics: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:border-[#5B4BFF] transition-colors" />
                  <p className="text-[10px] text-slate-400 mt-1">Separate multiple sub-topics with commas</p>
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase tracking-wide">Competency Codes</label>
                  <input type="text" placeholder="PY1.2, PY1.3, PY1.4" value={linkForm.competencyCodes}
                    onChange={e => setLinkForm(f => ({ ...f, competencyCodes: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:border-[#5B4BFF] transition-colors" />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setSelectedSlot(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-extrabold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer">
                  Cancel
                </button>
                <button onClick={handleLink} disabled={linking}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4a3dd4] text-white text-sm font-extrabold shadow-md shadow-[#5B4BFF]/25 transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2">
                  {linking ? (
                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /><span>Linking…</span></>
                  ) : (
                    <><span>🔗</span><span>Save Link</span></>
                  )}
                </button>
              </div>

              <p className="text-[10px] text-slate-400 text-center mt-3">
                Saving will mark this slot as <strong>LINKED</strong>. HOD can approve the timetable once all slots are linked.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
