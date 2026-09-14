'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ProfessionalPhaseSelector from './ProfessionalPhaseSelector';
import CascadingSelector, { CascadingSelection } from './CascadingSelector';

export default function UGLogbookView() {
  // 1. Professional Phase State (Default: 1st Prof)
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [selectedProfId, setSelectedProfId] = useState('');
  const [selectedProfName, setSelectedProfName] = useState('1st Professional MBBS');

  // Sub-tab view: Entry Form vs Status Ledger
  const [activeTab, setActiveTab] = useState<'entry' | 'ledger'>('entry');

  // Cascade State
  const [cascade, setCascade] = useState<Partial<CascadingSelection>>({});

  // Step 2 & 3: Activity Type & Date
  const [activityTypes, setActivityTypes] = useState<any[]>([]);
  const [selectedActivityType, setSelectedActivityType] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);

  // Step 4: Activity List
  const [matchedActivities, setMatchedActivities] = useState<any[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Step 5: Groups & Student Roster
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('grp-a');
  const [students, setStudents] = useState<any[]>([]);
  const [studentRows, setStudentRows] = useState<{
    [studentId: string]: { statusCode: string; remarks: string; score: string; recordStatus: string };
  }>({});
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Rubrics Lookup (F, M, C)
  const [rubrics, setRubrics] = useState<any[]>([]);

  // Bulk Save State
  const [saving, setSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Ledger / Filter Table State
  const [ledgerStatus, setLedgerStatus] = useState<string>('Pending');
  const [ledgerRecords, setLedgerRecords] = useState<any[]>([]);
  const [ledgerCounts, setLedgerCounts] = useState({ pending: 0, verified: 0, absent: 0, total: 0 });
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerTotalPages, setLedgerTotalPages] = useState(1);
  const [searchLedger, setSearchLedger] = useState('');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const getHeaders = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const rawSlug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-ims' : 'srms-ims';
    const slug = rawSlug.toLowerCase().trim().replace(/^tenant_/, '').replace(/^tenant-/, '');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-tenant-slug': slug,
      'tenant': slug,
    };
  }, []);

  // 1. Initial Load: Professionals, Activity Types, Rubrics
  useEffect(() => {
    (async () => {
      try {
        const h = getHeaders();
        const [profRes, actTypesRes, rubricsRes] = await Promise.all([
          fetch(`/api/v1/medical-logbook/lookups/professionals?tenant=${h['x-tenant-slug']}`, { headers: h }),
          fetch(`/api/v1/medical-logbook/lookups/activity-types?tenant=${h['x-tenant-slug']}`, { headers: h }),
          fetch(`/api/v1/medical-logbook/lookups/status-codes?tenant=${h['x-tenant-slug']}`, { headers: h }),
        ]);

        if (profRes.ok) {
          const profJson = await profRes.json();
          const profList = profJson.data !== undefined ? profJson.data : profJson;
          if (Array.isArray(profList) && profList.length > 0) {
            setProfessionals(profList);
            setSelectedProfId(profList[0].id);
            setSelectedProfName(profList[0].name);
          }
        }

        if (actTypesRes.ok) {
          const typesJson = await actTypesRes.json();
          const typesList = typesJson.data !== undefined ? typesJson.data : typesJson;
          if (Array.isArray(typesList) && typesList.length > 0) {
            setActivityTypes(typesList);
            setSelectedActivityType(typesList[0].id || typesList[0].code);
          }
        }

        if (rubricsRes.ok) {
          const rubJson = await rubricsRes.json();
          const rubList = rubJson.data !== undefined ? rubJson.data : rubJson;
          if (Array.isArray(rubList) && rubList.length > 0) {
            setRubrics(rubList);
          }
        }
      } catch (e) {
        console.error('Init error in UGLogbookView', e);
      }
    })();
  }, []);

  // 2. Query matching Activities when Competency or Activity Type changes
  useEffect(() => {
    if (!cascade.competencyId) {
      setMatchedActivities([]);
      return;
    }

    (async () => {
      setLoadingActivities(true);
      try {
        const h = getHeaders();
        const url = `/api/v1/medical-logbook/ug-logbook/activities?tenant=${h['x-tenant-slug']}&competencyId=${cascade.competencyId}&activityTypeId=${selectedActivityType}`;
        const res = await fetch(url, { headers: h });
        if (res.ok) {
          const json = await res.json();
          const acts = json.data !== undefined ? json.data : json;
          setMatchedActivities(Array.isArray(acts) ? acts : []);
          if (acts && acts.length > 0) {
            setSelectedActivityId(acts[0].id);
          } else {
            setSelectedActivityId('');
          }
        }
      } catch (e) {
        console.error('Failed to load activities for logbook', e);
      } finally {
        setLoadingActivities(false);
      }
    })();
  }, [cascade.competencyId, selectedActivityType]);

  // 3. Load Student Roster group-wise
  const loadGroupStudents = useCallback(async (groupId: string) => {
    setLoadingStudents(true);
    try {
      const h = getHeaders();
      const res = await fetch(`/api/v1/medical-logbook/ug-logbook/students?tenant=${h['x-tenant-slug']}&groupId=${groupId}&batchId=${cascade.batchId || ''}`, {
        headers: h,
      });
      if (res.ok) {
        const json = await res.json();
        const data = json.data !== undefined ? json.data : json;
        const studentList = data.students || [];
        setStudents(studentList);
        setGroups(data.groups || []);

        // Pre-fill initial student evaluation rows
        const initialRows: any = {};
        studentList.forEach((st: any) => {
          initialRows[st.id] = {
            statusCode: 'C',
            remarks: '',
            score: '',
            recordStatus: 'Pending',
          };
        });
        setStudentRows(initialRows);
      }
    } catch (e) {
      console.error('Failed to load students for group', e);
    } finally {
      setLoadingStudents(false);
    }
  }, [cascade.batchId, getHeaders]);

  useEffect(() => {
    if (selectedGroupId) {
      loadGroupStudents(selectedGroupId);
    }
  }, [selectedGroupId, loadGroupStudents]);

  // 4. Load Ledger Records (Pending / Verified / Absent)
  const loadLedger = useCallback(async () => {
    setLoadingLedger(true);
    try {
      const h = getHeaders();
      let url = `/api/v1/medical-logbook/ug-logbook?tenant=${h['x-tenant-slug']}&page=${ledgerPage}&limit=12`;
      if (ledgerStatus && ledgerStatus !== 'ALL') url += `&status=${ledgerStatus}`;
      if (selectedProfId) url += `&professionalYearId=${selectedProfId}`;
      if (searchLedger) url += `&search=${encodeURIComponent(searchLedger)}`;

      const res = await fetch(url, { headers: h });
      if (res.ok) {
        const json = await res.json();
        const data = json.data !== undefined ? json.data : json;
        setLedgerRecords(data.items || []);
        setLedgerTotalPages(data.totalPages || 1);
        if (data.counts) {
          setLedgerCounts(data.counts);
        }
      }
    } catch (e) {
      console.error('Failed to load ledger', e);
    } finally {
      setLoadingLedger(false);
    }
  }, [ledgerPage, ledgerStatus, selectedProfId, searchLedger, getHeaders]);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  // Bulk Save Entire Session Table
  const handleBulkSave = async () => {
    if (!selectedActivityId && matchedActivities.length === 0) {
      setSaveFeedback({ type: 'error', message: 'Please select an Activity from the Activity List.' });
      return;
    }

    setSaving(true);
    setSaveFeedback(null);

    try {
      const h = getHeaders();
      const currentGroup = groups.find(g => g.id === selectedGroupId || g.code === selectedGroupId);

      const payload = {
        activity_master_id: selectedActivityId || null,
        activity_type_id: selectedActivityType || null,
        session_date: sessionDate,
        group_id: selectedGroupId,
        group_name: currentGroup?.name || `Group ${selectedGroupId}`,
        professional_year_id: selectedProfId,
        subject_id: cascade.subjectId || null,
        program_level: 'UG',
        students: students.map(st => {
          const row = studentRows[st.id] || { statusCode: 'C', remarks: '', score: '', recordStatus: 'Pending' };
          return {
            student_id: st.id,
            rollno: st.rollno,
            student_name: st.name,
            status_code: row.statusCode || 'C',
            remarks: row.remarks || '',
            score: row.score ? parseFloat(row.score) : undefined,
            record_status: row.recordStatus || 'Pending',
          };
        }),
      };

      const res = await fetch(`/api/v1/medical-logbook/ug-logbook?tenant=${h['x-tenant-slug']}`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to save logbook session');
      }

      setSaveFeedback({
        type: 'success',
        message: `Successfully saved ${students.length} student evaluations for Group ${currentGroup?.code || selectedGroupId}!`,
      });

      // Refresh Ledger
      loadLedger();
    } catch (err: any) {
      setSaveFeedback({ type: 'error', message: err.message || 'Bulk save failed' });
    } finally {
      setSaving(false);
    }
  };

  // Verify Record from Ledger
  const handleVerify = async (recordId: string) => {
    setVerifyingId(recordId);
    try {
      const h = getHeaders();
      const res = await fetch(`/api/v1/medical-logbook/ug-logbook/${recordId}/verify?tenant=${h['x-tenant-slug']}`, {
        method: 'PATCH',
        headers: h,
        body: JSON.stringify({ record_status: 'Verified' }),
      });
      if (res.ok) {
        loadLedger();
      }
    } catch (e) {
      console.error('Verify error', e);
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. PROFESSIONAL PHASE SELECTOR (Top Scope) */}
      <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-5 shadow-sm">
        <ProfessionalPhaseSelector
          professionals={professionals}
          selectedId={selectedProfId}
          onSelect={(id, name) => {
            setSelectedProfId(id);
            setSelectedProfName(name);
            setCascade(prev => ({ ...prev, professionalYearId: id }));
          }}
          countsByProf={{
            [selectedProfId]: { total: ledgerCounts.total, pending: ledgerCounts.pending },
          }}
        />
      </div>

      {/* 2. SUB-NAVIGATION TABS (Entry Form vs Ledger) */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('entry')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'entry'
                ? 'bg-[#5B4BFF] text-white shadow-md shadow-[#5B4BFF]/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-[#E7EAF3] dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <span>📝 Logbook Entry Form</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white">
              {selectedProfName}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'ledger'
                ? 'bg-[#5B4BFF] text-white shadow-md shadow-[#5B4BFF]/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-[#E7EAF3] dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <span>📊 Status Ledger Table</span>
            {ledgerCounts.pending > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F36C21] text-white font-black animate-pulse">
                {ledgerCounts.pending} Pending
              </span>
            )}
          </button>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-[11px] font-bold text-[#5B4BFF] bg-[#5B4BFF]/10 px-3 py-1 rounded-full">
            Scoped to: {selectedProfName}
          </span>
        </div>
      </div>

      {/* ================================================================= */}
      {/* VIEW A: ENTRY FORM & GROUP ASSESSMENT                             */}
      {/* ================================================================= */}
      {activeTab === 'entry' && (
        <div className="space-y-6">
          {/* Step 1: Cascading Selector locked to active Professional */}
          <CascadingSelector
            value={{ ...cascade, professionalYearId: selectedProfId }}
            onChange={setCascade}
            fixedProfessionalYearId={selectedProfId}
            programLevel="UG"
          />

          {/* Steps 2, 3, 4: Activity Type, Date & Activity Picker */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#1B1E28] dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F36C21]" />
              Step 2, 3 & 4: Select Activity Type, Date & Pick Activity
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Step 2: Activity Type */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E5969] dark:text-slate-300 mb-1.5">
                  2. Activity Type *
                </label>
                <select
                  value={selectedActivityType}
                  onChange={e => setSelectedActivityType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 rounded-xl text-xs font-semibold text-[#1B1E28] dark:text-slate-100 focus:ring-2 focus:ring-[#5B4BFF]"
                >
                  {activityTypes.map(t => (
                    <option key={t.id || t.code} value={t.id || t.code}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 3: Date */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E5969] dark:text-slate-300 mb-1.5">
                  3. Session Date *
                </label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={e => setSessionDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 rounded-xl text-xs font-semibold text-[#1B1E28] dark:text-slate-100 focus:ring-2 focus:ring-[#5B4BFF]"
                />
              </div>

              {/* Step 4: Pick Activity from ActivityMaster */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#F36C21] mb-1.5 flex items-center justify-between">
                  <span>4. Pick Activity from Master *</span>
                  {loadingActivities && <span className="animate-spin text-xs">⟳</span>}
                </label>
                <select
                  value={selectedActivityId}
                  onChange={e => setSelectedActivityId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FFF9F5] dark:bg-slate-800 border border-[#F36C21]/30 rounded-xl text-xs font-bold text-[#1B1E28] dark:text-slate-100 focus:ring-2 focus:ring-[#F36C21]"
                >
                  <option value="">— Pick Scheduled Activity —</option>
                  {matchedActivities.map(act => (
                    <option key={act.id} value={act.id}>
                      {act.activity_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Step 5 & 6: Student Roster Group-Wise & Evaluation Table */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-[#1B1E28] dark:text-slate-100">
                  Step 5 & 6: Student Roster & Evaluation Grid
                </h3>
                <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-0.5">
                  Switch groups below to evaluate students batch-wise. Click Save to record all evaluations.
                </p>
              </div>

              {/* Group Tabs */}
              <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800 p-1.5 rounded-2xl border border-[#E7EAF3] dark:border-slate-700">
                {(groups.length > 0 ? groups : [{ id: 'grp-a', code: 'A', name: 'Group A' }, { id: 'grp-b', code: 'B', name: 'Group B' }]).map(g => (
                  <button
                    key={g.id || g.code}
                    type="button"
                    onClick={() => setSelectedGroupId(g.id || g.code)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedGroupId === (g.id || g.code)
                        ? 'bg-[#5B4BFF] text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    Group {g.code || g.name}
                  </button>
                ))}
              </div>
            </div>

            {saveFeedback && (
              <div
                className={`p-3.5 rounded-xl mb-4 text-xs font-semibold flex items-center justify-between ${
                  saveFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                <span>{saveFeedback.message}</span>
                <button onClick={() => setSaveFeedback(null)}>✕</button>
              </div>
            )}

            {/* Evaluation Table */}
            {loadingStudents ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <div className="w-6 h-6 border-2 border-[#5B4BFF] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading group roster from student master...
              </div>
            ) : students.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No students enrolled in this group.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-[#4E5969] dark:text-slate-400 tracking-wider">
                      <th className="py-3 px-3 w-16">Roll No</th>
                      <th className="py-3 px-3">Student Name</th>
                      <th className="py-3 px-3 w-48">Status (F / M / C) *</th>
                      <th className="py-3 px-3 w-32">Number / Marks</th>
                      <th className="py-3 px-3">Remarks</th>
                      <th className="py-3 px-3 w-28">Record State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {students.map(st => {
                      const row = studentRows[st.id] || { statusCode: 'C', remarks: '', score: '', recordStatus: 'Pending' };

                      return (
                        <tr key={st.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                          <td className="py-3 px-3 font-bold text-[#5B4BFF]">
                            {st.rollno || '—'}
                          </td>
                          <td className="py-3 px-3 font-semibold text-[#1B1E28] dark:text-slate-200">
                            {st.name}
                          </td>

                          {/* Status Dropdown (F, M, C) */}
                          <td className="py-2.5 px-3">
                            <select
                              value={row.statusCode}
                              onChange={e => {
                                const val = e.target.value;
                                setStudentRows(prev => ({
                                  ...prev,
                                  [st.id]: {
                                    ...row,
                                    statusCode: val,
                                    recordStatus: val === 'F' ? 'Absent' : row.recordStatus,
                                  },
                                }));
                              }}
                              className="w-full px-2.5 py-1.5 bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 rounded-xl text-xs font-bold text-[#1B1E28] dark:text-slate-100 focus:ring-2 focus:ring-[#5B4BFF]"
                            >
                              {(rubrics.length > 0
                                ? rubrics
                                : [
                                    { code: 'C', label: 'C — Completed / Competent' },
                                    { code: 'M', label: 'M — Meets Expectations' },
                                    { code: 'F', label: 'F — Follow-up Needed' },
                                  ]
                              ).map(r => (
                                <option key={r.code} value={r.code}>
                                  {r.code} — {r.label.replace(/^[A-Z]\s*—\s*/, '')}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Number / Score */}
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="100"
                              value={row.score}
                              onChange={e => {
                                const val = e.target.value;
                                setStudentRows(prev => ({
                                  ...prev,
                                  [st.id]: { ...row, score: val },
                                }));
                              }}
                              placeholder="Score (0-100)"
                              className="w-full px-2.5 py-1.5 bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 rounded-xl text-xs font-bold text-[#1B1E28] dark:text-slate-100 focus:ring-2 focus:ring-[#5B4BFF]"
                            />
                          </td>

                          {/* Remarks */}
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={row.remarks}
                              onChange={e => {
                                const val = e.target.value;
                                setStudentRows(prev => ({
                                  ...prev,
                                  [st.id]: { ...row, remarks: val },
                                }));
                              }}
                              placeholder="Faculty observation / clinical remarks..."
                              className="w-full px-2.5 py-1.5 bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 rounded-xl text-xs text-[#1B1E28] dark:text-slate-100 focus:ring-2 focus:ring-[#5B4BFF]"
                            />
                          </td>

                          {/* Record Status (Pending / Verified / Absent) */}
                          <td className="py-2.5 px-3">
                            <select
                              value={row.recordStatus}
                              onChange={e => {
                                const val = e.target.value;
                                setStudentRows(prev => ({
                                  ...prev,
                                  [st.id]: { ...row, recordStatus: val },
                                }));
                              }}
                              className={`w-full px-2 py-1 rounded-xl text-[10px] font-bold border focus:outline-none ${
                                row.recordStatus === 'Verified'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : row.recordStatus === 'Absent'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Verified">Verified</option>
                              <option value="Absent">Absent</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Step 7: Save Button */}
            <div className="flex items-center justify-between pt-6 mt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500">
                {students.length} students in current group roster ready for bulk save.
              </span>

              <button
                type="button"
                onClick={handleBulkSave}
                disabled={saving || students.length === 0}
                className="px-8 py-3 bg-[#5B4BFF] hover:bg-[#4838EE] text-white font-bold text-xs rounded-2xl shadow-lg shadow-[#5B4BFF]/25 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Save All Evaluations (Bulk Save)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* VIEW B: STATUS LEDGER TABLE (Pending / Verified / Absent)         */}
      {/* ================================================================= */}
      {activeTab === 'ledger' && (
        <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-sm space-y-5">
          {/* Header & Badges */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-[#1B1E28] dark:text-slate-100">
                Medical Logbook Evaluation Ledger — {selectedProfName}
              </h3>
              <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-0.5">
                Review, filter and verify student clinical logbook assessments.
              </p>
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLedgerStatus('Pending')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  ledgerStatus === 'Pending'
                    ? 'bg-[#FFB020] text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <span>Pending</span>
                <span className="bg-white/25 px-1.5 py-0.2 rounded-full text-[10px]">
                  {ledgerCounts.pending}
                </span>
              </button>

              <button
                onClick={() => setLedgerStatus('Verified')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  ledgerStatus === 'Verified'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <span>Verified</span>
                <span className="bg-white/25 px-1.5 py-0.2 rounded-full text-[10px]">
                  {ledgerCounts.verified}
                </span>
              </button>

              <button
                onClick={() => setLedgerStatus('Absent')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  ledgerStatus === 'Absent'
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <span>Absent</span>
                <span className="bg-white/25 px-1.5 py-0.2 rounded-full text-[10px]">
                  {ledgerCounts.absent}
                </span>
              </button>

              <button
                onClick={() => setLedgerStatus('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  ledgerStatus === 'ALL'
                    ? 'bg-[#5B4BFF] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                All ({ledgerCounts.total})
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex items-center justify-between gap-3">
            <input
              type="text"
              value={searchLedger}
              onChange={e => setSearchLedger(e.target.value)}
              placeholder="Filter by student name, roll number, or activity..."
              className="w-full sm:w-80 px-3.5 py-2 bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-[#5B4BFF]"
            />
            <button
              onClick={() => loadLedger()}
              className="px-4 py-2 bg-[#F6F8FC] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              Refresh Table
            </button>
          </div>

          {/* Ledger Table */}
          {loadingLedger ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <div className="w-6 h-6 border-2 border-[#5B4BFF] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading student logbook ledger...
            </div>
          ) : ledgerRecords.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              No evaluation records found under status &apos;{ledgerStatus}&apos; in {selectedProfName}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-[#4E5969] dark:text-slate-400 tracking-wider">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Roll No</th>
                    <th className="py-3 px-3">Student</th>
                    <th className="py-3 px-3">Activity</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Score</th>
                    <th className="py-3 px-3">State</th>
                    <th className="py-3 px-3 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {ledgerRecords.map(rec => {
                    const isVerified = rec.record_status === 'Verified';

                    return (
                      <tr key={rec.record_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {rec.session_date ? rec.session_date.split('T')[0] : '—'}
                        </td>
                        <td className="py-3 px-3 font-bold text-[#5B4BFF]">
                          {rec.rollno || '—'}
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#1B1E28] dark:text-slate-200">
                          {rec.student_name}
                        </td>
                        <td className="py-3 px-3 text-slate-700 dark:text-slate-300 max-w-xs">
                          <div>{rec.activity_name}</div>
                          {rec.competency_code && (
                            <span className="text-[10px] text-[#5B4BFF] font-bold">
                              {rec.competency_code}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#5B4BFF]/10 text-[#5B4BFF]">
                            {rec.status_code}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                          {rec.score !== null && rec.score !== undefined ? rec.score : '—'}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              rec.record_status === 'Verified'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : rec.record_status === 'Absent'
                                ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {rec.record_status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {isVerified ? (
                            <span className="text-[11px] font-bold text-emerald-600 flex items-center justify-end gap-1">
                              <span>✓</span> Locked ({rec.verified_by || 'Faculty'})
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleVerify(rec.record_id)}
                              disabled={verifyingId === rec.record_id}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                            >
                              {verifyingId === rec.record_id ? 'Verifying...' : 'Verify Record'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {ledgerTotalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-400">
                Page {ledgerPage} of {ledgerTotalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={ledgerPage <= 1}
                  onClick={() => setLedgerPage(p => p - 1)}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={ledgerPage >= ledgerTotalPages}
                  onClick={() => setLedgerPage(p => p + 1)}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
