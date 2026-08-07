'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

interface Batch {
  id: string;
  code: string;
  year: number;
}

interface Subject {
  id: string;
  code: string;
  name: string;
}

interface StudentReportRow {
  student_id: string;
  rollno?: string;
  name: string;
  total_classes: number;
  present: number;
  absent: number;
  late?: number;
  excused?: number;
  attendance_pct: number | string;
}

interface MatrixReportData {
  subjects: Subject[];
  students: {
    student_id: string;
    rollno?: string;
    name: string;
    subjects: Record<string, { total: number; present: number; pct: number }>;
    totalClasses: number;
    totalPresent: number;
    overallPct: number;
  }[];
}

const API_BASE = 'http://localhost:3001/api/v1';

const getTenantSlug = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('tenantSlug') || 'srms-ims';
  }
  return 'srms-ims';
};

export default function MISAttendanceReportsPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [phases, setPhases] = useState<{ id: string; name: string }[]>([
    { id: '1st-prof', name: '1st Prof (MBBS Year 1)' },
    { id: '2nd-prof', name: '2nd Prof (MBBS Year 2)' },
    { id: '3rd-prof-1', name: '3rd Prof Part-1' },
    { id: '3rd-prof-2', name: '3rd Prof Part-2 / Final Prof' },
  ]);
  
  // Selection Filters
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>('1st-prof');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [reportMode, setReportMode] = useState<'roster' | 'matrix' | 'shortage'>('roster');
  const [thresholdFilter, setThresholdFilter] = useState<'all' | 'shortage' | 'critical' | 'eligible'>('all');

  // Report Data
  const [rosterReport, setRosterReport] = useState<StudentReportRow[]>([]);
  const [matrixReport, setMatrixReport] = useState<MatrixReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Load Metadata (Batches & Subjects)
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const slug = getTenantSlug();
        const headers = { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` };
        
        const [batchRes, subRes, profRes] = await Promise.all([
          fetch(`${API_BASE}/college-master/batches?tenant=${slug}`, { headers }),
          fetch(`${API_BASE}/admin-master/subjects?tenant=${slug}`, { headers }),
          fetch(`${API_BASE}/college-master/professionals?tenant=${slug}`, { headers }),
        ]);

        if (batchRes.ok) {
          const bJson = await batchRes.json();
          const bList = bJson.data || bJson;
          if (Array.isArray(bList) && bList.length > 0) {
            setBatches(bList);
            setSelectedBatchId(bList[0].id);
          }
        }

        if (subRes.ok) {
          const sJson = await subRes.json();
          const sList = sJson.data || sJson;
          if (Array.isArray(sList)) {
            setSubjects(sList);
          }
        }

        if (profRes.ok) {
          const pJson = await profRes.json();
          const pList = pJson.data || pJson;
          if (Array.isArray(pList) && pList.length > 0) {
            setPhases(pList.map((p: any) => ({ id: p.id, name: p.name })));
            setSelectedPhaseId(pList[0].id);
          }
        }
      } catch (e) {
        console.error('Failed to load MIS report metadata', e);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch Report Data
  const fetchReport = async () => {
    if (!selectedBatchId) return;
    setLoading(true);
    try {
      const slug = getTenantSlug();
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` };

      if (reportMode === 'matrix') {
        let url = `${API_BASE}/attendance/batches/${selectedBatchId}/matrix-report?tenant=${slug}`;
        if (fromDate) url += `&fromDate=${fromDate}`;
        if (toDate) url += `&toDate=${toDate}`;

        const res = await fetch(url, { headers });
        if (res.ok) {
          const json = await res.json();
          const extractedData = json.data !== undefined ? json.data : json;
          setMatrixReport(extractedData || null);
        } else {
          setMatrixReport(null);
        }
      } else {
        let url = `${API_BASE}/attendance/batches/${selectedBatchId}/report?tenant=${slug}`;
        if (selectedSubjectId !== 'all') url += `&subjectId=${selectedSubjectId}`;
        if (fromDate) url += `&fromDate=${fromDate}`;
        if (toDate) url += `&toDate=${toDate}`;

        const res = await fetch(url, { headers });
        if (res.ok) {
          const json = await res.json();
          const extractedData = json.data !== undefined ? json.data : json;
          setRosterReport(Array.isArray(extractedData) ? extractedData : []);
        } else {
          setRosterReport([]);
        }
      }
    } catch (e) {
      console.error('Failed to fetch MIS report data', e);
      setRosterReport([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBatchId) {
      fetchReport();
    }
  }, [selectedBatchId, selectedSubjectId, fromDate, toDate, reportMode]);

  // Preset Date Periods
  const applyPreset = (preset: 'month' | 'last30' | 'term') => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setFromDate(firstDay.toISOString().split('T')[0]);
      setToDate(lastDay.toISOString().split('T')[0]);
    } else if (preset === 'last30') {
      const past30 = new Date(today);
      past30.setDate(today.getDate() - 30);
      setFromDate(past30.toISOString().split('T')[0]);
      setToDate(todayStr);
    } else if (preset === 'term') {
      setFromDate('');
      setToDate('');
    }
  };

  // Filtered Roster Rows based on Threshold
  const filteredRoster = rosterReport.filter((row) => {
    const pct = parseFloat(String(row.attendance_pct || 0));
    if (thresholdFilter === 'shortage') return pct < 75;
    if (thresholdFilter === 'critical') return pct < 70;
    if (thresholdFilter === 'eligible') return pct >= 75;
    return true;
  });

  // Analytics Metrics
  const totalEnrolled = rosterReport.length;
  const shortageCount = rosterReport.filter(r => parseFloat(String(r.attendance_pct || 0)) < 75).length;
  const avgAttendance = totalEnrolled > 0
    ? (rosterReport.reduce((acc, r) => acc + parseFloat(String(r.attendance_pct || 0)), 0) / totalEnrolled).toFixed(1)
    : '0.0';

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="MIS Attendance & Academic Compliance Portal" />
        <main className="p-6 space-y-6 flex-1 bg-slate-50 dark:bg-[#0F172A]">

          {/* Top MIS Title Banner Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-white via-indigo-50/50 to-white dark:from-slate-900 dark:via-indigo-950/80 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-500/20 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 text-lg">📈</span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">MIS Student Attendance Reports</h2>
                <span className="px-2.5 py-0.5 rounded-md bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30 font-extrabold text-[10px] uppercase tracking-widest">
                  Executive Dashboard
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Multi-subject cumulative matrixes, subject rosters, date-range analytics, and NMC 75% shortage detention lists.
              </p>
            </div>

            {/* Print Statement Button */}
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <span>🖨️</span> Print MIS Report
            </button>
          </div>

          {/* KPI Analytics Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1 shadow-md hover:shadow-lg transition-all">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Students Enrolled</span>
              <p className="text-3xl font-black text-slate-900 dark:text-white font-mono">{totalEnrolled}</p>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Active Batch Roster</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1 shadow-md hover:shadow-lg transition-all">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Batch Average Attendance</span>
              <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono">{avgAttendance}%</p>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-bold">Overall Academic Average</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1 shadow-md hover:shadow-lg transition-all">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Shortage List (&lt; 75%)</span>
              <p className="text-3xl font-black text-rose-600 dark:text-rose-400 font-mono">{shortageCount}</p>
              <span className="text-[10px] text-rose-600 dark:text-rose-400 block font-bold">Ineligible for University Exams</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1 shadow-md hover:shadow-lg transition-all">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Exam Compliant (≥ 75%)</span>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{totalEnrolled - shortageCount}</p>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-bold">Eligible Students</span>
            </div>
          </div>

          {/* FILTER CONTROLS BAR */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl">
            
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
              
              {/* Report Mode Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setReportMode('roster')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    reportMode === 'roster'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  📚 Subject Roster Report
                </button>
                <button
                  onClick={() => setReportMode('matrix')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    reportMode === 'matrix'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  📐 Cumulative Subject Matrix
                </button>
                <button
                  onClick={() => { setReportMode('roster'); setThresholdFilter('shortage'); }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    thresholdFilter === 'shortage' && reportMode === 'roster'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400'
                  }`}
                >
                  🚨 Detention Shortage List
                </button>
              </div>

              {/* Date Presets */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Quick Range:</span>
                <button
                  onClick={() => applyPreset('month')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-all"
                >
                  This Month
                </button>
                <button
                  onClick={() => applyPreset('last30')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-all"
                >
                  Last 30 Days
                </button>
                <button
                  onClick={() => applyPreset('term')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-all"
                >
                  Full Term
                </button>
              </div>
            </div>

            {/* Filter Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              
              {/* Phase Select */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Professional Phase *</label>
                <select
                  value={selectedPhaseId}
                  onChange={(e) => setSelectedPhaseId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Phase *</option>
                  {phases.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Batch Select */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Batch *</label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>Batch {b.code} ({b.year})</option>
                  ))}
                </select>
              </div>

              {/* Subject Select */}
              {reportMode === 'roster' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Subject Filter</label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all" className="bg-slate-900 text-white font-bold">All Subjects Combined</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id} className="bg-slate-900 text-white font-bold">[{s.code}] {s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Threshold Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">NMC Compliance Status</label>
                <select
                  value={thresholdFilter}
                  onChange={(e) => setThresholdFilter(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Students (100% Roster)</option>
                  <option value="shortage">🚨 Shortage List (&lt; 75% Attendance)</option>
                  <option value="critical">🔴 Critical Shortage (&lt; 70% Attendance)</option>
                  <option value="eligible">✅ Fully Eligible (≥ 75% Attendance)</option>
                </select>
              </div>

              {/* From Date */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* To Date */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Fetch Action Button Bar */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={fetchReport}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 shrink-0 disabled:opacity-50 cursor-pointer"
              >
                <span>⚡</span> {loading ? 'Fetching Attendance Data...' : 'Get Attendance Data'}
              </button>
            </div>
          </div>

          {/* REPORT VIEW 1: SUBJECT ROSTER REPORT */}
          {reportMode === 'roster' && (
            <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-purple-700 dark:text-purple-400 tracking-wider flex items-center gap-2">
                  <span>📚</span> Subject Roster Attendance Report ({filteredRoster.length} Records)
                </h3>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  NMC Standard: 75% Theory / 80% Practical Requirement
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs text-slate-800 dark:text-slate-300">
                  <thead className="bg-slate-100/80 dark:bg-slate-950/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5 text-center w-12">S.No</th>
                      <th className="p-3.5">Reg No</th>
                      <th className="p-3.5">Student Name</th>
                      <th className="p-3.5 text-center">Conducted Classes</th>
                      <th className="p-3.5 text-center">Attendance Status (P / A)</th>
                      <th className="p-3.5 text-center text-amber-600 dark:text-amber-400">Late / Excused</th>
                      <th className="p-3.5 text-center">Attendance %</th>
                      <th className="p-3.5 text-center">NMC Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60 font-medium">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500 dark:text-slate-400 font-bold animate-pulse">
                          Generating MIS subject attendance report...
                        </td>
                      </tr>
                    ) : filteredRoster.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500 italic">
                          No student attendance records match the selected filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredRoster.map((r, idx) => {
                        const pct = parseFloat(String(r.attendance_pct || 0));
                        const isEligible = pct >= 75.0;

                        return (
                          <tr key={r.student_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-3.5 text-center font-mono text-slate-500 dark:text-slate-400 font-bold">{idx + 1}</td>
                            <td className="p-3.5 font-mono text-indigo-600 dark:text-indigo-400 font-bold">{r.rollno || '—'}</td>
                            <td className="p-3.5 font-bold text-slate-900 dark:text-white">{r.name}</td>
                            <td className="p-3.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">{r.total_classes || 0}</td>
                            
                            {/* Attendance Status */}
                            <td className="p-3.5 text-center">
                              {selectedSubjectId === 'all' && Array.isArray((r as any).subject_sessions) && (r as any).subject_sessions.length > 0 ? (
                                <div className="flex flex-wrap items-center justify-center gap-1.5 font-mono text-xs">
                                  {(Array.from(
                                    (r as any).subject_sessions.reduce((acc: Map<string, string>, ss: any) => {
                                      if (ss.subject_code && ss.status) acc.set(ss.subject_code, ss.status);
                                      return acc;
                                    }, new Map<string, string>()).entries()
                                  ) as [string, string][]).map(([code, status]) => {
                                    const isP = ['PRESENT', 'LATE'].includes(status);
                                    return (
                                      <span
                                        key={code}
                                        className={`px-2 py-0.5 rounded font-black border ${
                                          isP
                                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                                            : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
                                        }`}
                                      >
                                        {code}: {isP ? 'P' : 'A'}
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : Number(r.total_classes || 0) <= 1 ? (
                                Number(r.present || 0) > 0 ? (
                                  <span className="px-3 py-1 rounded-md text-xs font-black font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                                    P (Present)
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 rounded-md text-xs font-black font-mono bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                                    A (Absent)
                                  </span>
                                )
                              ) : (
                                <div className="flex items-center justify-center gap-1.5 font-mono font-bold text-xs">
                                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                                    P: {Number(r.present || 0)}
                                  </span>
                                  <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                                    A: {Number(r.absent || 0)}
                                  </span>
                                </div>
                              )}
                            </td>

                            <td className="p-3.5 text-center font-mono text-amber-600 dark:text-amber-400">
                              {(Number(r.late || 0) + Number(r.excused || 0))}
                            </td>
                            <td className="p-3.5 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-black font-mono border ${
                                isEligible
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40'
                              }`}>
                                {pct.toFixed(1)}%
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${
                                isEligible
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
                              }`}>
                                {isEligible ? 'ELIGIBLE (≥ 75%)' : 'SHORTAGE (< 75%)'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REPORT VIEW 2: CUMULATIVE MULTI-SUBJECT MATRIX REPORT */}
          {reportMode === 'matrix' && (
            <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-indigo-700 dark:text-indigo-400 tracking-wider flex items-center gap-2">
                  <span>📐</span> Multi-Subject Cumulative Attendance Matrix ({matrixReport?.students.length || 0} Students)
                </h3>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  Per-subject breakdown + Cumulative %
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs text-slate-800 dark:text-slate-300">
                  <thead className="bg-slate-100/80 dark:bg-slate-950/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5 text-center w-12">S.No</th>
                      <th className="p-3.5">Reg No</th>
                      <th className="p-3.5">Student Name</th>
                      {matrixReport?.subjects.map(s => (
                        <th key={s.id} className="p-3.5 text-center font-black" title={s.name}>
                          {s.name}
                        </th>
                      ))}
                      <th className="p-3.5 text-center text-purple-700 dark:text-purple-300 font-extrabold">Overall %</th>
                      <th className="p-3.5 text-center">NMC Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60 font-medium">
                    {loading ? (
                      <tr>
                        <td colSpan={(matrixReport?.subjects.length || 0) + 5} className="p-8 text-center text-slate-500 dark:text-slate-400 font-bold animate-pulse">
                          Generating cumulative attendance matrix...
                        </td>
                      </tr>
                    ) : !matrixReport || matrixReport.students.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                          No matrix records available for this batch and date range.
                        </td>
                      </tr>
                    ) : (
                      matrixReport.students
                        .filter(st => {
                          if (thresholdFilter === 'shortage') return st.overallPct < 75;
                          if (thresholdFilter === 'critical') return st.overallPct < 70;
                          if (thresholdFilter === 'eligible') return st.overallPct >= 75;
                          return true;
                        })
                        .map((st, idx) => {
                          const isEligible = st.overallPct >= 75.0;

                          return (
                            <tr key={st.student_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-3.5 text-center font-mono text-slate-500 dark:text-slate-400 font-bold">{idx + 1}</td>
                              <td className="p-3.5 font-mono text-indigo-600 dark:text-indigo-400 font-bold">{st.rollno || '—'}</td>
                              <td className="p-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">{st.name}</td>
                              
                              {/* Subject Percentage Columns with Attended / Conducted (Pct%) */}
                              {matrixReport.subjects.map(s => {
                                const subData = st.subjects[s.id];
                                if (!subData || subData.total === 0) {
                                  return <td key={s.id} className="p-3.5 text-center text-slate-400 dark:text-slate-600 font-mono">—</td>;
                                }
                                const { present, total, pct } = subData;
                                const isPass = pct >= 75.0;
                                return (
                                  <td key={s.id} className="p-3.5 text-center font-mono font-bold">
                                    <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                                      isPass ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-rose-700 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20'
                                    }`}>
                                      {present}/{total} ({pct.toFixed(0)}%)
                                    </span>
                                  </td>
                                );
                              })}

                              {/* Overall Cumulative Percentage */}
                              <td className="p-3.5 text-center font-mono font-black text-sm text-slate-900 dark:text-white">
                                <span className={`px-2.5 py-1 rounded-full border ${
                                  isEligible ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40' : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40'
                                }`}>
                                  {st.overallPct.toFixed(1)}%
                                </span>
                              </td>

                              {/* Eligibility Status */}
                              <td className="p-3.5 text-center">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${
                                  isEligible
                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                                    : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
                                }`}>
                                  {isEligible ? 'ELIGIBLE' : 'SHORTAGE'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                    )}
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
