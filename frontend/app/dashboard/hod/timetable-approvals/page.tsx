'use client';
import { useState, useEffect } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

const API_BASE = '/api/v1';
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
  const [slotRemarks, setSlotRemarks] = useState<Record<string, string>>({});
  const [editingSlotKey, setEditingSlotKey] = useState<string | null>(null);
  const [tempSlotRemark, setTempSlotRemark] = useState('');

  const load = async (targetFilter?: string) => {
    const activeFilter = targetFilter || filter;
    setLoading(true);
    setDrafts([]);
    try {
      const { slug, headers } = getH();
      const ts = Date.now();
      const url = activeFilter === 'PENDING_HOD_APPROVAL'
        ? `${API_BASE}/exams/timetable-drafts/pending-hod-approval?tenant=${slug}&_=${ts}`
        : activeFilter === 'HOD_APPROVED'
        ? `${API_BASE}/exams/timetable-drafts/approved?tenant=${slug}&_=${ts}`
        : `${API_BASE}/exams/timetable-drafts?tenant=${slug}&status=${activeFilter}&_=${ts}`;
      const r = await fetch(url, { 
        headers: {
          ...headers,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        }, 
        cache: 'no-store' 
      });
      const d = await r.json();
      const rawList = Array.isArray(d) ? d : (d.data || []);

      // Filter drafts that have at least 1 defined slot
      const validDrafts = rawList.filter((item: any) => {
        const raw = item?.slots;
        const arr = typeof raw === 'string' ? JSON.parse(raw || '[]') : (raw || []);
        return Array.isArray(arr) && arr.length > 0;
      });

      setDrafts(validDrafts);
    } catch { 
      setDrafts([]); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(filter); }, [filter]);

  const handleSaveSlotRemark = async (draftId: string, slotIdx: number, slotId: string) => {
    const key = `${draftId}_${slotId || slotIdx}`;
    const remarkValue = tempSlotRemark.trim();
    setSlotRemarks(prev => ({ ...prev, [key]: remarkValue }));
    setEditingSlotKey(null);
    setTempSlotRemark('');

    // Immediately persist this remark to the database so Clerk sees it and HOD doesn't lose it
    try {
      const { slug, headers } = getH();
      const targetDraft = drafts.find(d => String(d.id) === String(draftId));
      if (targetDraft) {
        const rawSlots = targetDraft.slots;
        let slots: any[] = typeof rawSlots === 'string' ? JSON.parse(rawSlots || '[]') : (rawSlots || []);
        slots = slots.map((sl, idx) => {
          if (String(sl.id) === String(slotId) || idx === slotIdx) {
            return { ...sl, hodRemark: remarkValue, hod_remark: remarkValue };
          }
          return sl;
        });
        await fetch(`${API_BASE}/exams/timetable-drafts/hod-action?tenant=${slug}`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            draftId,
            action: 'reject',
            remarks: remarkValue || targetDraft.hod_remarks || 'HOD requested revisions on lecture slot(s).',
            slots,
          }),
        });
        await load();
      }
    } catch (err) {
      console.error('Failed to auto-save slot remark:', err);
    }
  };

  const act = async (draftId: string, action: 'approve' | 'reject') => {
    setActioning(draftId);
    const targetDraft = drafts.find(d => String(d.id) === String(draftId));
    const rawSlots = targetDraft?.slots;
    let slots: any[] = typeof rawSlots === 'string' ? JSON.parse(rawSlots || '[]') : (rawSlots || []);

    if (slots.length === 0) {
      alert('This timetable draft has no lectures defined. Empty drafts cannot be approved and will be removed.');
      try {
        const { slug, headers } = getH();
        await fetch(`${API_BASE}/exams/timetable-drafts/${draftId}?tenant=${slug}`, {
          method: 'DELETE',
          headers,
        });
      } catch {}
      setActioning(null);
      await load();
      return;
    }

    // Enrich slots with any staged per-slot remarks
    slots = slots.map((sl, idx) => {
      const key = `${draftId}_${sl.id || idx}`;
      const rem = slotRemarks[key] || sl.hodRemark || sl.hod_remark || sl.remark;
      return rem ? { ...sl, hodRemark: rem, hod_remark: rem } : sl;
    });

    let remarks = '';
    if (action === 'reject') {
      const markedSlots = slots.filter(s => s.hodRemark || s.hod_remark);
      const defaultText = markedSlots.length > 0 
        ? markedSlots.map(s => `${s.subject_name || s.subjectName || 'Lecture'}: ${s.hodRemark || s.hod_remark}`).join('; ')
        : 'Please review remarks on marked lectures and reschedule.';
      
      const promptVal = window.prompt(
        `${markedSlots.length} lecture slot(s) have remarks.\nEnter / confirm overall instructions for the clerk:`,
        defaultText
      );
      if (promptVal === null) {
        setActioning(null);
        return;
      }
      remarks = promptVal;
    } else {

      const confirmApprove = window.confirm(
        'Are you sure you want to approve this timetable draft?\n\n' +
        'Once approved, lectures will be published live to Database & SRMS (for SRMS tenants), making the schedule visible to Students, Faculty, and Admin.'
      );
      if (!confirmApprove) {
        setActioning(null);
        return;
      }
    }

    try {
      const { slug, headers } = getH();
      const isSrmsTenant = Boolean(slug && slug.toLowerCase().includes('srms'));

      if (action === 'approve') {
        // If SRMS tenant, synchronize each lecture to SRMS using the existing /api/srms/add-event endpoint!
        if (isSrmsTenant && slots.length > 0) {
          const srmsErrors: string[] = [];

          // Pre-fetch live subjects mapping from Loadsubject for this draft to ensure authentic linkcd
          const draftCourse = String(targetDraft?.course_cd || slots[0]?.courseCd || slots[0]?.course_cd || '13');
          const draftBranch = String(targetDraft?.branch_cd || slots[0]?.branchCd || slots[0]?.branch_cd || '1');
          const draftBatch = String(targetDraft?.batch_cd || slots[0]?.batchCd || slots[0]?.batch_cd || '2');
          const draftSem = String(targetDraft?.semester || slots[0]?.semester || '3');
          const draftSec = String(targetDraft?.section || slots[0]?.section || '1');
          const draftColg = String(targetDraft?.colg_cd || slots[0]?.colgCd || slots[0]?.colgcd || '1');

          let liveSubjects: any[] = [];
          try {
            const subRes = await fetch(`/api/srms/timetable-subjects?course=${draftCourse}&branch=${draftBranch}&batch=${draftBatch}&semester=${draftSem}&section=${draftSec}&colgcd=${draftColg}&tenant=${slug}`, {
              headers: { 'x-tenant-slug': slug, 'x-tenant-id': slug }
            });
            const subData = await subRes.json().catch(() => null);
            liveSubjects = Array.isArray(subData?.data) ? subData.data : [];
          } catch {}

          for (let i = 0; i < slots.length; i++) {
            const sl = slots[i];
            const now = new Date();
            const effBase = sl.effectiveFrom ? new Date(sl.effectiveFrom) : now;
            const effDay = effBase.getDay();
            const effDiff = effBase.getDate() - effDay + (effDay === 0 ? -6 : 1);
            const monday = new Date(effBase.getFullYear(), effBase.getMonth(), effDiff);
            const dow = Number(sl.dayOfWeek || sl.day_of_week || 1);
            const targetDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + (dow - 1));
            const pad = (n: number) => String(n).padStart(2, '0');
            const ymd = `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(targetDate.getDate())}`;

            const subCode = String(sl.subjectCode || sl.subject_code || '');
            const subName = String(sl.subject_name || sl.subjectName || sl.topic || '');
            const facEmpId = String(sl.facultyEmpId || sl.faculty_code || sl.facultyId || sl.srmsPayload?.improperEvent?.empid || '');
            const facName = String(sl.faculty_name || sl.facultyName || '');

            let authenticLinkcd = String(sl.linkcd || sl.srmsPayload?.improperEvent?.linkcd || '0');
            if ((!authenticLinkcd || authenticLinkcd === '0' || authenticLinkcd === subCode) && liveSubjects.length > 0) {
              const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
              const matched = liveSubjects.find((s: any) =>
                (subCode && String(s.sub_cd || s.code).trim() === subCode.trim()) ||
                (facEmpId && String(s.empid).trim() === facEmpId.trim()) ||
                (subName && s.sub_name && (norm(s.sub_name).includes(norm(subName)) || norm(subName).includes(norm(s.sub_name))))
              );
              if (matched?.linkcd) {
                authenticLinkcd = String(matched.linkcd);
                sl.linkcd = authenticLinkcd;
              }
            }

            const cleanSubTitle = sl.subject_name || sl.subjectName || subName || 'Subject';
            const srmsPayload = sl.srmsPayload || {
              improperEvent: {
                title: cleanSubTitle,
                description: sl.description || sl.subjectDescription || `${cleanSubTitle}${facName ? ' ' + facName : ''}`.trim(),
                start: `${ymd} ${(sl.startTime || sl.start_time || '09:00').slice(0, 5)} `,
                end: `${ymd} ${(sl.endTime || sl.end_time || '10:00').slice(0, 5)} `,
                linkcd: authenticLinkcd,
                subjectCode: subCode,
                subject_code: subCode,
                subjectName: cleanSubTitle,
                facultyName: facName,
                electiveflg: String(sl.srmsPayload?.improperEvent?.electiveflg || sl.electiveflg || 'N'),
                txtG: String(sl.srmsPayload?.improperEvent?.txtG || sl.groupValue || '0'),
                txtSec: String(sl.srmsPayload?.improperEvent?.txtSec || sl.sectionValue || sl.section || targetDraft?.section || '1'),
                empid: facEmpId,
                colgcd: String(sl.srmsPayload?.improperEvent?.colgcd || sl.colgCd || sl.colgcd || targetDraft?.colg_cd || '1'),
                CameraLink: String(sl.srmsPayload?.improperEvent?.CameraLink || sl.cameraId || '0'),
                unit_id: String(sl.unitId || sl.unit_id || ''),
                unit_name: String(sl.unitName || sl.unit_name || ''),
                topic: String(sl.topic || ''),
                sub_topics: String(sl.subTopics || sl.sub_topics || ''),
                competency_codes: String(sl.competencyCodes || sl.competency_codes || ''),
                course: String(sl.courseCd || sl.coursecd || targetDraft?.course_cd || draftCourse),
                branch: String(sl.branchCd || sl.branchcd || targetDraft?.branch_cd || draftBranch),
                batch: String(sl.batchCd || sl.batchcd || targetDraft?.batch_cd || draftBatch),
                sem: String(sl.semester || targetDraft?.semester || draftSem),
              }
            };
            if (srmsPayload.improperEvent) {
              srmsPayload.improperEvent.linkcd = authenticLinkcd;
              srmsPayload.improperEvent.subjectCode = subCode;
              srmsPayload.improperEvent.subject_code = subCode;
              srmsPayload.improperEvent.subjectName = subName;
              srmsPayload.improperEvent.facultyName = facName;
              srmsPayload.improperEvent.draftId = String(draftId);
              srmsPayload.improperEvent.excludeDraftId = String(draftId);
              srmsPayload.improperEvent.isApproval = true;
              srmsPayload.improperEvent.isDraftApproval = true;
              srmsPayload.improperEvent.excludeId = String(sl.id || '');
            }

            try {
              const sRes = await fetch('/api/srms/add-event', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-tenant-slug': slug,
                  'x-tenant-id': slug,
                },
                body: JSON.stringify({
                  ...srmsPayload,
                  draftId: String(draftId),
                  excludeDraftId: String(draftId),
                  isApproval: true,
                  isDraftApproval: true,
                  tenant: slug,
                  tenantSlug: slug,
                }),
              });
              const sJson = await sRes.json().catch(() => null);
              if (!sRes.ok || !sJson?.success) {
                const errMsg = sJson?.error || sJson?.message || 'SRMS portal rejected event scheduling';
                srmsErrors.push(`Slot ${i + 1} (${sl.subject_name || sl.subjectName || 'Slot'}): ${errMsg}`);
              }
            } catch (netErr: any) {
              srmsErrors.push(`Slot ${i + 1} (${sl.subject_name || sl.subjectName || 'Slot'}): Network error - ${netErr.message}`);
            }
          }

          if (srmsErrors.length > 0) {
            const proceed = window.confirm(
              `SRMS Integration Warning:\n${srmsErrors.join('\n')}\n\n` +
              `Would you like to approve and save this timetable draft to the PostgreSQL database anyway?\n` +
              `(Click OK to save and publish to PostgreSQL Database, or Cancel to abort and review).`
            );
            if (!proceed) {
              setActioning(null);
              return;
            }
          }
        }
      }

      const res = await fetch(`${API_BASE}/exams/timetable-drafts/hod-action?tenant=${slug}`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId, action, remarks, slots }),
      });
      if (res.ok) {
        alert(action === 'approve'
          ? (isSrmsTenant
            ? 'Timetable draft successfully approved and synchronized with SRMS Portal & Database!'
            : 'Timetable draft successfully approved and published to PostgreSQL!')
          : 'Timetable draft rejected and returned to Clerk with remarks.');
      }
      await load();
    } catch (err: any) {
      alert(`Approval error: ${err?.message || 'Network error'}`);
    } finally {
      setActioning(null);
    }
  };

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="hod" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Timetable Approvals" />
        <main className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/10 text-violet-600 font-mono font-bold uppercase tracking-wider">TIMETABLE APPROVAL QUEUE</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#1B1E28] dark:text-white">Timetable Review Queue</h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Review timetable drafts, add remarks on specific slots to request clerk fixes, and approve for live publishing</p>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              {['PENDING_HOD_APPROVAL', 'HOD_APPROVED', 'HOD_REJECTED', 'DRAFT'].map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${filter === f ? 'bg-[#5B4BFF] text-white shadow-md shadow-[#5B4BFF]/25' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-[#E7EAF3] dark:border-slate-800 hover:border-[#5B4BFF]/50'}`}>
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
                        {d.hod_remarks && (
                          <div className="mt-2 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800">
                            💬 Previous HOD Remarks: {d.hod_remarks}
                          </div>
                        )}
                      </div>
                      {filter === 'PENDING_HOD_APPROVAL' && (() => {
                          const rawSlotsForCheck = typeof d.slots === 'string' ? JSON.parse(d.slots || '[]') : (d.slots || []);
                          const pendingCnt = rawSlotsForCheck.filter((s: any) => !s.mappingStatus || s.mappingStatus === 'PENDING').length;
                          const linkedCnt = rawSlotsForCheck.filter((s: any) => s.mappingStatus === 'LINKED').length;
                          const totalCnt = rawSlotsForCheck.length;
                          const allLinked = pendingCnt === 0 && totalCnt > 0;
                          return (
                            <div className="flex flex-col gap-2 flex-shrink-0">
                              {/* Mapping progress */}
                              <div className="flex items-center gap-2 text-[10px]">
                                <span className="text-amber-600 font-bold">⏳ {pendingCnt} pending</span>
                                <span className="text-emerald-600 font-bold">✓ {linkedCnt} linked</span>
                                {totalCnt > 0 && (
                                  <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.round((linkedCnt / totalCnt) * 100)}%` }} />
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <div className="relative group/approve">
                                  <button
                                    onClick={() => allLinked ? act(d.id, 'approve') : undefined}
                                    disabled={actioning === d.id || !allLinked}
                                    title={!allLinked ? `All faculties must link their Schedule Planner before approval (${pendingCnt} slot${pendingCnt !== 1 ? 's' : ''} still PENDING)` : 'Approve & Go Live'}
                                    className={`px-4 py-2 rounded-xl text-white text-sm font-extrabold shadow-sm flex items-center gap-1.5 transition-all ${
                                      allLinked
                                        ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30 cursor-pointer'
                                        : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-70'
                                    }`}
                                  >
                                    <span>{allLinked ? '✓' : '🔒'}</span>
                                    <span>{actioning === d.id ? 'Approving...' : allLinked ? 'Approve & Go Live' : 'Approve (Blocked)'}</span>
                                  </button>
                                  {!allLinked && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 z-10 hidden group-hover/approve:flex">
                                      <div className="bg-slate-900 text-white text-[10px] font-bold px-3 py-2 rounded-xl shadow-xl text-center leading-relaxed">
                                        🔒 All faculties must link their Schedule Planner before approval.<br />
                                        <span className="text-amber-400">{pendingCnt} slot{pendingCnt !== 1 ? 's' : ''} still PENDING</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <button onClick={() => act(d.id, 'reject')} disabled={actioning === d.id}
                                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-600 hover:to-amber-700 text-white text-sm font-extrabold disabled:opacity-50 shadow-sm cursor-pointer flex items-center gap-1.5"
                                  title="Send remarks & reschedule instructions to Clerk">
                                  <span>📤</span>
                                  <span>{actioning === d.id ? 'Sending...' : 'Request Changes'}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })()}

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
                                <th className="px-3 py-2 text-left font-extrabold text-[#1B1E28] dark:text-white">Unit</th>
                                <th className="px-3 py-2 text-left font-extrabold text-[#1B1E28] dark:text-white">Topic</th>
                                <th className="px-3 py-2 text-left font-extrabold text-[#1B1E28] dark:text-white">SubTopic</th>
                                <th className="px-3 py-2 text-left font-extrabold text-[#1B1E28] dark:text-white">Room</th>
                                <th className="px-3 py-2 text-left font-extrabold text-[#1B1E28] dark:text-white">HOD Slot Review &amp; Remarks</th>
                              </tr>
                            </thead>
                            <tbody>
                              {slots.map((s: any, i: number) => {
                                const slotKey = `${d.id}_${s.id || i}`;
                                const activeRemark = slotRemarks[slotKey] !== undefined ? slotRemarks[slotKey] : (s.hodRemark || s.hod_remark || s.remark || '');
                                const isEditingThis = editingSlotKey === slotKey;

                                return (
                                  <tr key={i} className={`border-t border-[#E7EAF3] dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/30 ${activeRemark ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}`}>
                                    <td className="px-3 py-2 font-bold text-[#2D2575] dark:text-indigo-300">{dayNames[(s.dayOfWeek || s.day_of_week) - 1] || s.dayOfWeek || s.day_of_week || '—'}</td>
                                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">{(s.startTime || s.start_time || '').slice(0, 5)} – {(s.endTime || s.end_time || '').slice(0, 5)}</td>
                                    <td className="px-3 py-2 font-semibold text-[#1B1E28] dark:text-white">{s.subjectName || s.subject_name || s.subject || '—'}</td>
                                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400 font-semibold">{s.facultyName || s.faculty_name || s.faculty || '—'}</td>
                                    <td className="px-3 py-2 text-indigo-600 dark:text-indigo-400 font-medium">{s.unitName || s.unit_name || '—'}</td>
                                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{s.topic || '—'}</td>
                                    <td className="px-3 py-2 text-slate-500 max-w-[150px] truncate" title={s.subTopics || s.sub_topics || ''}>{s.subTopics || s.sub_topics || '—'}</td>
                                    <td className="px-3 py-2 text-slate-500 font-mono">{s.room || s.location || '—'}</td>
                                    <td className="px-3 py-2 min-w-[200px]">
                                      {isEditingThis ? (
                                        <div className="flex items-center gap-1.5">
                                          <input
                                            type="text"
                                            value={tempSlotRemark}
                                            onChange={(e) => setTempSlotRemark(e.target.value)}
                                            placeholder="e.g. Reschedule to 11:00 AM, swap faculty..."
                                            className="px-2 py-1 text-xs border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#5B4BFF] w-full"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveSlotRemark(d.id, i, s.id);
                                              if (e.key === 'Escape') setEditingSlotKey(null);
                                            }}
                                          />
                                          <button
                                            type="button"
                                            onClick={() => handleSaveSlotRemark(d.id, i, s.id)}
                                            className="px-2 py-1 bg-[#5B4BFF] text-white rounded-lg text-[10px] font-bold cursor-pointer"
                                          >
                                            Save
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setEditingSlotKey(null)}
                                            className="px-1.5 py-1 text-slate-400 hover:text-slate-600 text-xs"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      ) : activeRemark ? (
                                        <div className="flex items-center justify-between gap-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-2 py-1 rounded-lg">
                                          <span className="text-[11px] font-extrabold text-rose-700 dark:text-rose-300">
                                            💬 {activeRemark}
                                          </span>
                                          {filter === 'PENDING_HOD_APPROVAL' && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingSlotKey(slotKey);
                                                setTempSlotRemark(activeRemark);
                                              }}
                                              className="text-[10px] text-rose-500 underline font-bold hover:text-rose-700 cursor-pointer"
                                            >
                                              Edit
                                            </button>
                                          )}
                                        </div>
                                      ) : filter === 'PENDING_HOD_APPROVAL' ? (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingSlotKey(slotKey);
                                            setTempSlotRemark('');
                                          }}
                                          className="px-2.5 py-1 text-[11px] rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-[#5B4BFF] hover:border-[#5B4BFF] transition-all cursor-pointer font-bold"
                                        >
                                          + Add Remark
                                        </button>
                                      ) : (
                                        <span className="text-[11px] text-slate-400 italic">No remarks</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
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
