'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import FacultyReportsNav from '../../../../components/FacultyReportsNav';

interface College {
  id: string;
  name: string;
  slug: string;
  code: string;
}

interface Batch {
  id: string;
  code: string;
  year?: number;
  name?: string;
}

interface Subject {
  id: string;
  code: string;
  name: string;
}

interface StudentMatrixRow {
  student_id: string;
  rollno: string;
  name: string;
  subjects: Record<string, { total: number; present: number; absent?: number; late?: number; excused?: number; pct: number }>;
  totalClasses: number;
  totalPresent: number;
  overallPct: number;
}

interface RosterRow {
  student_id: string;
  rollno: string;
  name: string;
  total_classes: number;
  present: number;
  absent: number;
  late?: number;
  excused?: number;
  attendance_pct: number | string;
}

interface DailySessionLog {
  id: string;
  session_date: string;
  session_type: string;
  topic_covered?: string;
  subject_name?: string;
  subject_code?: string;
  present_count: number;
  total_records: number;
  faculty_name?: string;
}

const API_BASE = 'http://localhost:3001/api/v1';

const getTenantSlug = (): string => {
  if (typeof window !== 'undefined') {
    return (
      localStorage.getItem('tenantSlug') ||
      localStorage.getItem('selectedTenant') ||
      localStorage.getItem('institutionSlug') ||
      localStorage.getItem('tenant') ||
      'srms-ims'
    );
  }
  return 'srms-ims';
};

type TabType = 'daily' | 'subject_wise' | 'cumulative' | 'shortage';

export default function FacultyMISReportsPage() {
  const [deptName, setDeptName] = useState('Department of Physiology');
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedTenantSlug, setSelectedTenantSlug] = useState<string>(getTenantSlug());
  const [batches, setBatches] = useState<Batch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  // Selection Controls
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('2026-08-01');
  const [toDate, setToDate] = useState<string>('2026-08-31');
  const [shortageFilter, setShortageFilter] = useState<'all' | 'warning' | 'critical' | 'eligible'>('all');

  // Top Tabs Concept State
  const [activeTab, setActiveTab] = useState<TabType>('daily');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Search State
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data States (Compiled live from PostgreSQL)
  const [matrixData, setMatrixData] = useState<{ subjects: Subject[]; students: StudentMatrixRow[] }>({ subjects: [], students: [] });
  const [rosterData, setRosterData] = useState<RosterRow[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailySessionLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchMetadataAndUserContext();
  }, [selectedTenantSlug]);

  useEffect(() => {
    if (selectedBatchId) {
      fetchCompiledReports();
    }
  }, [selectedBatchId, selectedSubjectId, fromDate, toDate, selectedTenantSlug]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedBatchId, selectedSubjectId, shortageFilter, searchQuery]);

  const fetchMetadataAndUserContext = async () => {
    const slug = selectedTenantSlug || getTenantSlug();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const h = { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': slug };

    try {
      // 1. Fetch Colleges
      const colRes = await fetch(`${API_BASE}/college-master/colleges`, { headers: h }).catch(() => null);
      if (colRes && colRes.ok) {
        const colJson = await colRes.json();
        const colList = Array.isArray(colJson?.data) ? colJson.data : Array.isArray(colJson) ? colJson : [];
        setColleges(colList);
      }

      // 2. Fetch User Profile
      const meRes = await fetch(`${API_BASE}/auth/me`, { headers: h }).catch(() => null);
      if (meRes && meRes.ok) {
        const json = await meRes.json();
        const meData = json.data || json;
        const profile = meData.profile || {};
        const dName = profile.department_name || meData.departmentName || 'Academic Department';
        setDeptName(dName);
      }

      // 3. Fetch Batches and Subjects for active tenant
      const [bRes, sRes] = await Promise.all([
        fetch(`${API_BASE}/college-master/batches?tenant=${slug}`, { headers: h }).catch(() => null),
        fetch(`${API_BASE}/admin-master/subjects?tenant=${slug}`, { headers: h }).catch(() => null),
      ]);

      const parse = (j: any) => Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : [];

      if (bRes && bRes.ok) {
        const bList: Batch[] = parse(await bRes.json());
        setBatches(bList);
        if (bList.length > 0) {
          const currentBatchExists = bList.some(b => b.id === selectedBatchId);
          if (!currentBatchExists) {
            setSelectedBatchId(bList[0].id);
          }
        }
      }

      if (sRes && sRes.ok) {
        setSubjects(parse(await sRes.json()));
      }
    } catch (e) {
      console.error('Failed to load MIS metadata', e);
    }
  };


  const fetchCompiledReports = async () => {
    if (!selectedBatchId) return;
    setLoading(true);
    const slug = selectedTenantSlug || getTenantSlug();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const h = { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': slug };

    try {
      let mUrl = `${API_BASE}/attendance/batches/${selectedBatchId}/matrix-report`;
      const mParams = new URLSearchParams();
      mParams.set('tenant', slug);
      if (fromDate) mParams.set('fromDate', fromDate);
      if (toDate) mParams.set('toDate', toDate);
      mUrl += `?${mParams.toString()}`;

      let rUrl = `${API_BASE}/attendance/batches/${selectedBatchId}/report`;
      const rParams = new URLSearchParams();
      rParams.set('tenant', slug);
      if (selectedSubjectId !== 'all') rParams.set('subjectId', selectedSubjectId);
      if (fromDate) rParams.set('fromDate', fromDate);
      if (toDate) rParams.set('toDate', toDate);
      rUrl += `?${rParams.toString()}`;

      let wUrl = `${API_BASE}/attendance/weekly-sessions?batchId=${selectedBatchId}&fromDate=${fromDate || '2026-08-01'}&toDate=${toDate || '2026-08-31'}&tenant=${encodeURIComponent(slug)}`;
      if (selectedSubjectId !== 'all') wUrl += `&subjectId=${selectedSubjectId}`;

      const [mRes, rRes, wRes] = await Promise.all([
        fetch(mUrl, { headers: h }).catch(() => null),
        fetch(rUrl, { headers: h }).catch(() => null),
        fetch(wUrl, { headers: h }).catch(() => null),
      ]);

      if (mRes && mRes.ok) {
        const json = await mRes.json();
        const data = json.data !== undefined ? json.data : json;
        setMatrixData({
          subjects: Array.isArray(data?.subjects) ? data.subjects : subjects,
          students: Array.isArray(data?.students) ? data.students : [],
        });
      }

      if (rRes && rRes.ok) {
        const json = await rRes.json();
        const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        setRosterData(list);
      }

      if (wRes && wRes.ok) {
        const json = await wRes.json();
        const wData = json.data || json;
        const sList = Array.isArray(wData?.sessions) ? wData.sessions : Array.isArray(wData) ? wData : [];
        setDailyLogs(sList);
      }
    } catch (e) {
      console.error('Failed to fetch compiled PostgreSQL attendance report:', e);
    } finally {
      setLoading(false);
    }
  };

  const activeSubjects = useMemo(() => {
    if (!matrixData.subjects || !matrixData.students) return [];
    return matrixData.subjects.filter(sub => {
      return matrixData.students.some(st => {
        const info = st.subjects[sub.id];
        return info && info.total > 0;
      });
    });
  }, [matrixData.subjects, matrixData.students]);

  const stats = useMemo(() => {
    const totalStudents = matrixData.students.length || rosterData.length;
    if (totalStudents === 0) {
      return { avgPct: 0, totalClasses: 0, eligibleCount: 0, shortageCount: 0 };
    }

    let sumPct = 0;
    let eligible = 0;
    let shortage = 0;
    let totalCls = 0;

    if (matrixData.students.length > 0) {
      matrixData.students.forEach(st => {
        sumPct += st.overallPct;
        totalCls = Math.max(totalCls, st.totalClasses);
        if (st.overallPct >= 75) eligible++;
        else shortage++;
      });
      return {
        avgPct: Math.round(sumPct / matrixData.students.length),
        totalClasses: totalCls,
        eligibleCount: eligible,
        shortageCount: shortage,
      };
    }

    rosterData.forEach(r => {
      const p = parseFloat(String(r.attendance_pct || 0));
      sumPct += p;
      totalCls = Math.max(totalCls, r.total_classes);
      if (p >= 75) eligible++;
      else shortage++;
    });

    return {
      avgPct: Math.round(sumPct / rosterData.length),
      totalClasses: totalCls,
      eligibleCount: eligible,
      shortageCount: shortage,
    };
  }, [matrixData, rosterData]);

  const filteredMatrixStudents = useMemo(() => {
    return matrixData.students.filter(st => {
      const matchesSearch = !searchQuery.trim() || st.name.toLowerCase().includes(searchQuery.toLowerCase()) || st.rollno.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (shortageFilter === 'eligible') return st.overallPct >= 75;
      if (shortageFilter === 'warning') return st.overallPct >= 60 && st.overallPct < 75;
      if (shortageFilter === 'critical') return st.overallPct < 60;
      return true;
    });
  }, [matrixData.students, shortageFilter, searchQuery]);

  const filteredRoster = useMemo(() => {
    return rosterData.filter(r => {
      return !searchQuery.trim() || r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.rollno.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [rosterData, searchQuery]);

  const filteredDailyLogs = useMemo(() => {
    return dailyLogs.filter(l => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (l.subject_name || '').toLowerCase().includes(q) || (l.topic_covered || '').toLowerCase().includes(q) || (l.faculty_name || '').toLowerCase().includes(q);
    });
  }, [dailyLogs, searchQuery]);

  const shortageStudents = useMemo(() => {
    return matrixData.students.filter(st => {
      const isShortage = st.overallPct < 75;
      const matchesSearch = !searchQuery.trim() || st.name.toLowerCase().includes(searchQuery.toLowerCase()) || st.rollno.toLowerCase().includes(searchQuery.toLowerCase());
      return isShortage && matchesSearch;
    });
  }, [matrixData.students, searchQuery]);

  const exportCurrentTabToCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    const batchName = batches.find(b => b.id === selectedBatchId)?.code || 'Batch_2025';

    if (activeTab === 'daily') {
      headers = ['Session Date', 'Subject', 'Session Type', 'Topic Covered', 'Faculty Marker', 'Present Count', 'Total Records', 'Attendance Pct'];
      rows = filteredDailyLogs.map(l => [
        `"${typeof l.session_date === 'string' ? l.session_date.split('T')[0] : ''}"`,
        `"${l.subject_name || l.subject_code || 'PHYSIOLOGY'}"`,
        `"${l.session_type || 'LECTURE'}"`,
        `"${l.topic_covered || '—'}"`,
        `"${l.faculty_name || 'Faculty Marker'}"`,
        `"${l.present_count}"`,
        `"${l.total_records}"`,
        `"${l.total_records > 0 ? Math.round((l.present_count / l.total_records) * 100) : 0}%"`,
      ]);
    } else if (activeTab === 'subject_wise') {
      headers = ['Roll No', 'Student Name', ...activeSubjects.map(s => `${s.name} (${s.code})`), 'Cumulative %'];
      rows = filteredMatrixStudents.map(st => [
        `"${st.rollno}"`,
        `"${st.name}"`,
        ...activeSubjects.map(sub => {
          const info = st.subjects[sub.id];
          return info && info.total > 0 ? `"${info.present}/${info.total} (${info.pct}%)"` : `"—"`;
        }),
        `"${st.overallPct}%"`,
      ]);
    } else if (activeTab === 'cumulative') {
      headers = ['Roll No', 'Student Name', 'Total Conducted', 'Present', 'Absent', 'Attendance Pct', 'NMC Status'];
      rows = filteredRoster.map(r => [
        `"${r.rollno}"`,
        `"${r.name}"`,
        `"${r.total_classes}"`,
        `"${r.present}"`,
        `"${r.absent}"`,
        `"${r.attendance_pct}%"`,
        `"${Number(r.attendance_pct) >= 75 ? 'Eligible' : 'Shortage'}"`,
      ]);
    } else {
      headers = ['Roll No', 'Student Name', 'Total Conducted', 'Present', 'Shortage Pct', 'Classes Needed for 75%'];
      rows = shortageStudents.map(st => {
        const needed = Math.max(0, Math.ceil((0.75 * st.totalClasses - st.totalPresent) / 0.25));
        return [
          `"${st.rollno}"`,
          `"${st.name}"`,
          `"${st.totalClasses}"`,
          `"${st.totalPresent}"`,
          `"${st.overallPct}%"`,
          `"+${needed} Classes"`,
        ];
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MIS_Attendance_Report_${activeTab}_${batchName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="faculty" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Faculty MIS Reports — Attendance Ledger" />
        
        <main className="p-6 space-y-6 flex-1">
          {/* Top Reports Suite Navigation Tabs */}
          <FacultyReportsNav
            activeReport="attendance"
            stats={{
              attendanceCount: stats.totalClasses > 0 ? `${stats.totalClasses} Sessions` : 'Active',
              logbookCount: 'Ledger',
              theoryCount: 'Assessment',
            }}
          />

          {/* Header Bar */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-extrabold text-[#5B4BFF] uppercase tracking-widest">
                  📊 MIS ATTENDANCE REPORT CONSOLE
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-[#E6F9F3] text-[#00C48C] border border-[#00C48C]/30">
                  🏛️ {deptName}
                </span>
              </div>
              <h2 className="text-xl font-black text-[#1B1E28] dark:text-white tracking-tight uppercase mt-1.5">
                Subject-Wise &amp; Cumulative Monthly Attendance Ledger
              </h2>
              <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-0.5 font-medium">
                Live multi-subject attendance compiled dynamically from PostgreSQL database (<code className="text-[#5B4BFF] font-mono font-bold">attendance_sessions</code> &amp; <code className="text-[#5B4BFF] font-mono font-bold">attendance_records</code>)
              </p>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={exportCurrentTabToCSV}
                className="px-4 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4B3BFF] text-white text-xs font-black shadow-md shadow-[#5B4BFF]/20 transition flex items-center gap-1.5"
              >
                📥 Export CSV
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 hover:bg-[#EEECFF] border border-[#E7EAF3] dark:border-slate-700 text-xs font-black text-[#1B1E28] dark:text-white transition shadow-sm flex items-center gap-1.5"
              >
                🖨️ Print Report
              </button>
            </div>
          </div>

          {/* Master Filters Bar */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
              <span className="text-xs font-black uppercase text-[#5B4BFF] tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#5B4BFF] text-white flex items-center justify-center text-[10px] font-black">1</span>
                ⚙️ Master Report Context &amp; Date Range Filters
              </span>
              {loading && <span className="text-xs font-black text-[#F36C21] animate-pulse">⏳ Compiling PostgreSQL Data...</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              {/* Institution / College */}
              {colleges.length > 1 && (
                <div>
                  <label className="block text-[11px] font-extrabold text-[#5B4BFF] uppercase mb-1">Target College *</label>
                  <select
                    value={selectedTenantSlug}
                    onChange={(e) => setSelectedTenantSlug(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#5B4BFF] font-black text-xs focus:ring-2 focus:ring-[#5B4BFF]"
                  >
                    {colleges.map(c => (
                      <option key={c.id} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Target Batch */}
              <div>
                <label className="block text-[11px] font-extrabold text-[#4E5969] dark:text-slate-400 uppercase mb-1">Target Batch *</label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-black text-xs focus:ring-2 focus:ring-[#5B4BFF]"
                >
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.code} ({b.name || 'Batch'})</option>
                  ))}
                </select>
              </div>

              {/* Subject Filter */}
              <div>
                <label className="block text-[11px] font-extrabold text-[#00C48C] uppercase mb-1">Subject Filter *</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#00C48C] font-black text-xs focus:ring-2 focus:ring-[#00C48C]"
                >
                  <option value="all">🌐 All Subjects (Multi-Subject Matrix)</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              {/* From Date */}
              <div>
                <label className="block text-[11px] font-extrabold text-[#F36C21] uppercase mb-1">From Date *</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#F36C21] font-mono font-black text-xs"
                />
              </div>

              {/* To Date */}
              <div>
                <label className="block text-[11px] font-extrabold text-[#F36C21] uppercase mb-1">To Date *</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#F36C21] font-mono font-black text-xs"
                />
              </div>

              {/* Shortage Risk Filter */}
              <div>
                <label className="block text-[11px] font-extrabold text-[#F04438] uppercase mb-1">Attendance Threshold</label>
                <select
                  value={shortageFilter}
                  onChange={(e) => setShortageFilter(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#F04438] font-black text-xs"
                >
                  <option value="all">All Students ({matrixData.students.length})</option>
                  <option value="eligible">🟢 Eligible (&gt;= 75%)</option>
                  <option value="warning">🟡 Shortage Warning (60-74%)</option>
                  <option value="critical">🔴 Critical Shortage (&lt; 60%)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-5 shadow-soft space-y-1">
              <span className="text-[11px] font-black text-[#4E5969] dark:text-slate-400 uppercase tracking-wider">Avg Batch Attendance %</span>
              <p className="text-3xl font-black text-[#00C48C]">{stats.avgPct}%</p>
              <span className="text-[11px] text-[#00C48C] font-bold">Compiled across all sessions</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-5 shadow-soft space-y-1">
              <span className="text-[11px] font-black text-[#4E5969] dark:text-slate-400 uppercase tracking-wider">Total Conducted Sessions</span>
              <p className="text-3xl font-black text-[#5B4BFF]">{stats.totalClasses} <span className="text-xs font-bold text-[#4E5969]">Classes</span></p>
              <span className="text-[11px] text-[#4E5969] font-medium">Recorded in PostgreSQL</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-5 shadow-soft space-y-1">
              <span className="text-[11px] font-black text-[#4E5969] dark:text-slate-400 uppercase tracking-wider">NMC Eligible (&gt;=75%)</span>
              <p className="text-3xl font-black text-[#00C48C]">{stats.eligibleCount} <span className="text-xs font-bold text-[#4E5969]">Students</span></p>
              <span className="text-[11px] text-[#00C48C] font-bold">Permitted for Examinations</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-5 shadow-soft space-y-1">
              <span className="text-[11px] font-black text-[#4E5969] dark:text-slate-400 uppercase tracking-wider">Shortage Warning (&lt;75%)</span>
              <p className="text-3xl font-black text-[#F04438]">{stats.shortageCount} <span className="text-xs font-bold text-[#4E5969]">Students</span></p>
              <span className="text-[11px] text-[#F04438] font-bold">Parent Intimation Queued</span>
            </div>
          </div>

          {/* TOP TABS NAVIGATION CONCEPT */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto p-1.5 bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] shadow-soft">
              {[
                { id: 'daily', label: '📅 1. Daily Attendance Log', count: filteredDailyLogs.length },
                { id: 'subject_wise', label: '📚 2. Subject-Wise Attendance', count: activeSubjects.length > 0 ? `${activeSubjects.length} Active` : '0' },
                { id: 'cumulative', label: '📊 3. Cumulative / Combined', count: filteredRoster.length },
                { id: 'shortage', label: '⚠️ 4. Shortage (<75%)', count: shortageStudents.length, isDanger: shortageStudents.length > 0 },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 whitespace-nowrap ${
                      isActive
                        ? 'bg-[#5B4BFF] text-white shadow-md shadow-[#5B4BFF]/20'
                        : 'bg-[#F8FAFC] dark:bg-slate-800 text-[#4E5969] dark:text-slate-300 hover:bg-[#EEECFF] border border-[#E7EAF3] dark:border-slate-700'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : tab.isDanger
                        ? 'bg-[#FEECEB] text-[#F04438] border border-[#F04438]/30'
                        : 'bg-[#EEECFF] text-[#5B4BFF] border border-[#5B4BFF]/30'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search & Pagination Bar */}
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-4 shadow-soft flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Search by student name, roll no, topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs text-[#1B1E28] dark:text-slate-200 placeholder-[#7B8794] focus:outline-none focus:border-[#5B4BFF] font-medium"
                />
                <span className="absolute left-3 top-2.5 text-xs text-[#7B8794]">🔍</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-[#4E5969] dark:text-slate-400 font-bold">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="px-2.5 py-1 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-slate-200 focus:outline-none focus:border-[#5B4BFF] font-black"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* TAB CONTENT CARDS */}
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] shadow-soft overflow-hidden p-6 space-y-4">
              
              {/* TAB 1: Daily Attendance Log */}
              {activeTab === 'daily' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
                    <h3 className="text-xs font-black text-[#1B1E28] dark:text-white uppercase tracking-wider flex items-center gap-2">
                      📅 Daily &amp; Weekly Conducted Attendance Register Log
                    </h3>
                    <span className="text-xs font-mono font-bold text-[#5B4BFF]">{filteredDailyLogs.length} Sessions Logged</span>
                  </div>

                  {filteredDailyLogs.length === 0 ? (
                    <div className="py-12 text-center text-[#4E5969] dark:text-slate-400 text-xs font-medium">
                      No conducted attendance sessions found for the selected filter keywords.
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-[#E7EAF3] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-800/60 text-[#1B1E28] dark:text-slate-300 uppercase font-black">
                              <th className="py-3.5 px-4 w-32 rounded-l-xl">Session Date</th>
                              <th className="py-3.5 px-4 w-32">Subject</th>
                              <th className="py-3.5 px-4 w-28">Type</th>
                              <th className="py-3.5 px-4">Topic Covered</th>
                              <th className="py-3.5 px-4 w-44">Faculty Marker</th>
                              <th className="py-3.5 px-4 text-center w-36">Present / Total</th>
                              <th className="py-3.5 px-4 text-center w-28 rounded-r-xl">Attendance %</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800 font-medium">
                            {filteredDailyLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((log) => {
                              const parseDateStr = (d: any): string => {
                                if (!d) return '—';
                                if (typeof d === 'string') {
                                  const trimmed = d.trim();
                                  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
                                  if (trimmed.includes('T')) {
                                    try {
                                      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(trimmed));
                                    } catch (e) {
                                      return trimmed.split('T')[0];
                                    }
                                  }
                                  return trimmed.split(' ')[0];
                                }
                                try {
                                  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(d));
                                } catch (e) {
                                  return String(d).split('T')[0];
                                }
                              };
                              const dStr = parseDateStr(log.session_date);
                              const pct = log.total_records > 0 ? Math.round((log.present_count / log.total_records) * 100) : 0;
                              return (
                                <tr key={log.id} className="hover:bg-[#F1F4F9]/60 dark:hover:bg-slate-800/40 transition">
                                  <td className="py-3.5 px-4 font-mono font-black text-[#F36C21]">{dStr}</td>
                                  <td className="py-3.5 px-4 font-black text-[#5B4BFF]">{log.subject_name || log.subject_code || 'PHYSIOLOGY'}</td>
                                  <td className="py-3.5 px-4">
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase bg-[#FFF4EC] text-[#F36C21] border border-[#F36C21]/30">
                                      {log.session_type || 'LECTURE'}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 text-[#4E5969] dark:text-slate-300 font-medium">{log.topic_covered || '—'}</td>
                                  <td className="py-3.5 px-4 font-black text-[#1B1E28] dark:text-white">{log.faculty_name || 'Faculty Marker'}</td>
                                  <td className="py-3.5 px-4 text-center font-mono font-black text-[#00C48C]">
                                    {log.present_count} / {log.total_records}
                                  </td>
                                  <td className="py-3.5 px-4 text-center">
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-[#E6F9F3] text-[#00C48C] border border-[#00C48C]/30">
                                      {pct}%
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-[#E7EAF3] dark:border-slate-800 text-xs font-bold text-[#4E5969] dark:text-slate-400">
                        <span>Showing {Math.min((currentPage - 1) * pageSize + 1, filteredDailyLogs.length)} to {Math.min(currentPage * pageSize, filteredDailyLogs.length)} of {filteredDailyLogs.length} sessions</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 hover:bg-[#EEECFF] disabled:opacity-40 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-slate-200 font-black transition"
                          >
                            Previous
                          </button>
                          <span className="font-mono text-[#5B4BFF]">{currentPage} / {Math.ceil(filteredDailyLogs.length / pageSize) || 1}</span>
                          <button
                            onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredDailyLogs.length / pageSize), p + 1))}
                            disabled={currentPage >= Math.ceil(filteredDailyLogs.length / pageSize)}
                            className="px-3 py-1.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 hover:bg-[#EEECFF] disabled:opacity-40 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-slate-200 font-black transition"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 2: Subject Wise Attendance Matrix with Dynamic Subject Block Headers */}
              {activeTab === 'subject_wise' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
                    <div>
                      <h3 className="text-xs font-black text-[#1B1E28] dark:text-white uppercase tracking-wider flex items-center gap-2">
                        📊 Multi-Subject Matrix Roster (Dynamic Subject Blocks)
                      </h3>
                      <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium mt-0.5">
                        Only active subjects with marked attendance are displayed (<code className="text-[#5B4BFF] font-mono font-bold">Conducted / Present / Absent / Late / Pct%</code>). Schedule updates automatically accumulate into column totals.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#00C48C]">{activeSubjects.length} Active Subjects</span>
                  </div>

                  {filteredMatrixStudents.length === 0 ? (
                    <div className="py-12 text-center text-[#4E5969] dark:text-slate-400 text-xs font-medium">
                      No student attendance matrix data compiled for this query filter.
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            {/* Header Row 1: Dynamic Subject Blocks */}
                            <tr className="border-b border-[#E7EAF3] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-800/60 text-[#1B1E28] dark:text-slate-300 uppercase font-black text-[11px]">
                              <th rowSpan={2} className="py-3 px-3 w-10 text-center border-r border-[#E7EAF3] dark:border-slate-800 rounded-tl-xl">#</th>
                              <th rowSpan={2} className="py-3 px-4 w-28 border-r border-[#E7EAF3] dark:border-slate-800">Roll / Reg No</th>
                              <th rowSpan={2} className="py-3 px-4 border-r border-[#E7EAF3] dark:border-slate-800">Student Name</th>
                              
                              {activeSubjects.map(sub => (
                                <th key={sub.id} colSpan={5} className="py-2 px-3 text-center border-r border-[#E7EAF3] dark:border-slate-800 bg-[#5B4BFF]/10 text-[#5B4BFF] font-black tracking-wider">
                                  {sub.name} Block ({sub.code})
                                </th>
                              ))}
                              
                              <th colSpan={2} className="py-2 px-3 text-center bg-[#EEECFF] text-[#5B4BFF] rounded-tr-xl font-black tracking-wider">
                                Cumulative Summary
                              </th>
                            </tr>

                            {/* Header Row 2: Sub-columns under each Block */}
                            <tr className="border-b border-[#E7EAF3] dark:border-slate-800 bg-[#F1F4F9] dark:bg-slate-800 text-[10px] text-[#4E5969] dark:text-slate-300 uppercase font-black">
                              {activeSubjects.map(sub => (
                                <React.Fragment key={sub.id}>
                                  <th className="py-2 px-2 text-center border-r border-[#E7EAF3] dark:border-slate-800">Conducted</th>
                                  <th className="py-2 px-2 text-center text-[#00C48C] border-r border-[#E7EAF3] dark:border-slate-800">Present</th>
                                  <th className="py-2 px-2 text-center text-[#F04438] border-r border-[#E7EAF3] dark:border-slate-800">Absent</th>
                                  <th className="py-2 px-2 text-center text-[#FFB020] border-r border-[#E7EAF3] dark:border-slate-800">Late</th>
                                  <th className="py-2 px-2 text-center text-[#5B4BFF] border-r border-[#E7EAF3] dark:border-slate-800">Attendance %</th>
                                </React.Fragment>
                              ))}
                              <th className="py-2 px-2 text-center border-r border-[#E7EAF3] dark:border-slate-800">Total (P/T)</th>
                              <th className="py-2 px-2 text-center text-[#5B4BFF]">Overall %</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800 font-medium text-xs">
                            {filteredMatrixStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((st, idx) => (
                              <tr key={st.student_id} className="hover:bg-[#F1F4F9]/60 dark:hover:bg-slate-800/40 transition">
                                <td className="py-3.5 px-3 text-center text-[#7B8794] font-mono text-[11px] border-r border-[#E7EAF3] dark:border-slate-800">{(currentPage - 1) * pageSize + idx + 1}</td>
                                <td className="py-3.5 px-4 font-mono font-black text-[#5B4BFF] border-r border-[#E7EAF3] dark:border-slate-800">{st.rollno}</td>
                                <td className="py-3.5 px-4 font-black text-[#1B1E28] dark:text-white border-r border-[#E7EAF3] dark:border-slate-800">{st.name}</td>

                                {/* Active Subject Block Breakdown Cells */}
                                {activeSubjects.map(sub => {
                                  const subInfo = st.subjects[sub.id];
                                  if (!subInfo || subInfo.total === 0) {
                                    return (
                                      <React.Fragment key={sub.id}>
                                        <td colSpan={5} className="py-3.5 px-2 text-center text-[#7B8794] font-mono text-[11px] border-r border-[#E7EAF3] dark:border-slate-800">
                                          —
                                        </td>
                                      </React.Fragment>
                                    );
                                  }

                                  const pct = subInfo.pct;
                                  return (
                                    <React.Fragment key={sub.id}>
                                      <td className="py-3.5 px-2 text-center font-bold text-[#1B1E28] dark:text-slate-200 border-r border-[#E7EAF3] dark:border-slate-800">{subInfo.total}</td>
                                      <td className="py-3.5 px-2 text-center font-mono font-black text-[#00C48C] border-r border-[#E7EAF3] dark:border-slate-800">{subInfo.present}</td>
                                      <td className="py-3.5 px-2 text-center font-mono font-black text-[#F04438] border-r border-[#E7EAF3] dark:border-slate-800">{subInfo.absent || 0}</td>
                                      <td className="py-3.5 px-2 text-center font-mono font-black text-[#FFB020] border-r border-[#E7EAF3] dark:border-slate-800">{subInfo.late || 0}</td>
                                      <td className="py-3.5 px-2 text-center border-r border-[#E7EAF3] dark:border-slate-800">
                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black border ${
                                          pct >= 75 ? 'bg-[#E6F9F3] text-[#00C48C] border-[#00C48C]/30' : 'bg-[#FEECEB] text-[#F04438] border-[#F04438]/30'
                                        }`}>
                                          {pct}%
                                        </span>
                                      </td>
                                    </React.Fragment>
                                  );
                                })}

                                {/* Cumulative Summary */}
                                <td className="py-3.5 px-3 text-center border-r border-[#E7EAF3] dark:border-slate-800 bg-[#EEECFF]/30 font-mono font-black text-[#1B1E28] dark:text-white">
                                  {st.totalPresent} / {st.totalClasses}
                                </td>
                                <td className="py-3.5 px-3 text-center bg-[#EEECFF]/30">
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-black border ${
                                    st.overallPct >= 75 ? 'bg-[#E6F9F3] text-[#00C48C] border-[#00C48C]/30' : 'bg-[#FEECEB] text-[#F04438] border-[#F04438]/30'
                                  }`}>
                                    {st.overallPct}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-[#E7EAF3] dark:border-slate-800 text-xs font-bold text-[#4E5969] dark:text-slate-400">
                        <span>Showing {Math.min((currentPage - 1) * pageSize + 1, filteredMatrixStudents.length)} to {Math.min(currentPage * pageSize, filteredMatrixStudents.length)} of {filteredMatrixStudents.length} students</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 hover:bg-[#EEECFF] disabled:opacity-40 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-slate-200 font-black transition"
                          >
                            Previous
                          </button>
                          <span className="font-mono text-[#5B4BFF]">{currentPage} / {Math.ceil(filteredMatrixStudents.length / pageSize) || 1}</span>
                          <button
                            onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredMatrixStudents.length / pageSize), p + 1))}
                            disabled={currentPage >= Math.ceil(filteredMatrixStudents.length / pageSize)}
                            className="px-3 py-1.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 hover:bg-[#EEECFF] disabled:opacity-40 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-slate-200 font-black transition"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 3: Cumulative Roster Attendance with Dynamic Subject Block Header */}
              {activeTab === 'cumulative' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
                    <h3 className="text-xs font-black text-[#1B1E28] dark:text-white uppercase tracking-wider flex items-center gap-2">
                      📊 Cumulative &amp; Monthly Student Attendance Roster
                    </h3>
                    <span className="text-xs font-mono font-bold text-[#5B4BFF]">{filteredRoster.length} Student Records</span>
                  </div>

                  {filteredRoster.length === 0 ? (
                    <div className="py-12 text-center text-[#4E5969] dark:text-slate-400 text-xs font-medium">
                      No roster records found for the selected query filters.
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            {/* Header Row 1: Active Subject Block Title */}
                            <tr className="border-b border-[#E7EAF3] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-800/60 text-[#1B1E28] dark:text-slate-300 uppercase font-black text-[11px]">
                              <th rowSpan={2} className="py-3 px-3 w-10 text-center border-r border-[#E7EAF3] dark:border-slate-800 rounded-tl-xl">#</th>
                              <th rowSpan={2} className="py-3 px-4 w-28 border-r border-[#E7EAF3] dark:border-slate-800">Roll / Reg No</th>
                              <th rowSpan={2} className="py-3 px-4 border-r border-[#E7EAF3] dark:border-slate-800">Student Name</th>
                              <th colSpan={5} className="py-2 px-3 text-center bg-[#5B4BFF]/10 text-[#5B4BFF] font-black tracking-wider border-r border-[#E7EAF3] dark:border-slate-800 rounded-tr-xl">
                                {selectedSubjectId === 'all'
                                  ? 'ALL SUBJECTS CUMULATIVE BLOCK'
                                  : `${subjects.find(s => s.id === selectedSubjectId)?.name || 'SUBJECT'} BLOCK`}
                              </th>
                            </tr>

                            {/* Header Row 2: Conducted, Present, Absent, Late, Attendance % */}
                            <tr className="border-b border-[#E7EAF3] dark:border-slate-800 bg-[#F1F4F9] dark:bg-slate-800 text-[10px] text-[#4E5969] dark:text-slate-300 uppercase font-black">
                              <th className="py-2 px-3 text-center border-r border-[#E7EAF3] dark:border-slate-800">Conducted</th>
                              <th className="py-2 px-3 text-center text-[#00C48C] border-r border-[#E7EAF3] dark:border-slate-800">Present</th>
                              <th className="py-2 px-3 text-center text-[#F04438] border-r border-[#E7EAF3] dark:border-slate-800">Absent</th>
                              <th className="py-2 px-3 text-center text-[#FFB020] border-r border-[#E7EAF3] dark:border-slate-800">Late</th>
                              <th className="py-2 px-3 text-center text-[#5B4BFF]">Attendance %</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800 font-medium">
                            {filteredRoster.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((r, idx) => {
                              const pct = parseFloat(String(r.attendance_pct || 0));
                              return (
                                <tr key={r.student_id} className="hover:bg-[#F1F4F9]/60 dark:hover:bg-slate-800/40 transition">
                                  <td className="py-3.5 px-3 text-center text-[#7B8794] font-mono text-[11px] border-r border-[#E7EAF3] dark:border-slate-800">{(currentPage - 1) * pageSize + idx + 1}</td>
                                  <td className="py-3.5 px-4 font-mono font-black text-[#5B4BFF] border-r border-[#E7EAF3] dark:border-slate-800">{r.rollno}</td>
                                  <td className="py-3.5 px-4 font-black text-[#1B1E28] dark:text-white border-r border-[#E7EAF3] dark:border-slate-800">{r.name}</td>
                                  <td className="py-3.5 px-3 text-center font-bold text-[#1B1E28] dark:text-slate-200 border-r border-[#E7EAF3] dark:border-slate-800">{r.total_classes}</td>
                                  <td className="py-3.5 px-3 text-center font-mono font-black text-[#00C48C] border-r border-[#E7EAF3] dark:border-slate-800">{r.present}</td>
                                  <td className="py-3.5 px-3 text-center font-mono font-black text-[#F04438] border-r border-[#E7EAF3] dark:border-slate-800">{r.absent}</td>
                                  <td className="py-3.5 px-3 text-center font-mono font-black text-[#FFB020] border-r border-[#E7EAF3] dark:border-slate-800">{r.late || 0}</td>
                                  <td className="py-3.5 px-3 text-center">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-black border ${
                                      pct >= 75 ? 'bg-[#E6F9F3] text-[#00C48C] border-[#00C48C]/30' : 'bg-[#FEECEB] text-[#F04438] border-[#F04438]/30'
                                    }`}>
                                      {pct}%
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-[#E7EAF3] dark:border-slate-800 text-xs font-bold text-[#4E5969] dark:text-slate-400">
                        <span>Showing {Math.min((currentPage - 1) * pageSize + 1, filteredRoster.length)} to {Math.min(currentPage * pageSize, filteredRoster.length)} of {filteredRoster.length} students</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 hover:bg-[#EEECFF] disabled:opacity-40 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-slate-200 font-black transition"
                          >
                            Previous
                          </button>
                          <span className="font-mono text-[#5B4BFF]">{currentPage} / {Math.ceil(filteredRoster.length / pageSize) || 1}</span>
                          <button
                            onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredRoster.length / pageSize), p + 1))}
                            disabled={currentPage >= Math.ceil(filteredRoster.length / pageSize)}
                            className="px-3 py-1.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 hover:bg-[#EEECFF] disabled:opacity-40 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-slate-200 font-black transition"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 4: Attendance Shortage (<75%) */}
              {activeTab === 'shortage' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
                    <div>
                      <h3 className="text-xs font-black text-[#F04438] uppercase tracking-wider flex items-center gap-2">
                        ⚠️ Attendance Shortage Roster (&lt; 75% Threshold)
                      </h3>
                      <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium mt-0.5">
                        NMC mandated warning list for students failing to meet the mandatory 75% attendance threshold.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-black text-[#F04438] bg-[#FEECEB] border border-[#F04438]/30 px-3 py-1 rounded-full">{shortageStudents.length} Students Shortage</span>
                  </div>

                  {shortageStudents.length === 0 ? (
                    <div className="py-12 text-center text-[#00C48C] font-black text-xs bg-[#E6F9F3] rounded-2xl border border-[#00C48C]/30">
                      🎉 Great Job! All students in this query selection currently meet the 75% attendance threshold.
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-[#E7EAF3] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-800/60 text-[#1B1E28] dark:text-slate-300 uppercase font-black">
                              <th className="py-3.5 px-4 w-32 rounded-l-xl">Roll No</th>
                              <th className="py-3.5 px-4">Student Name</th>
                              <th className="py-3.5 px-4 text-center">Total Conducted</th>
                              <th className="py-3.5 px-4 text-center text-[#00C48C]">Present</th>
                              <th className="py-3.5 px-4 text-center text-[#F04438]">Shortage %</th>
                              <th className="py-3.5 px-4 text-center w-40">Classes Needed for 75%</th>
                              <th className="py-3.5 px-4 text-center w-36 rounded-r-xl">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800 font-medium">
                            {shortageStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(st => {
                              const needed = Math.max(0, Math.ceil((0.75 * st.totalClasses - st.totalPresent) / 0.25));
                              return (
                                <tr key={st.student_id} className="hover:bg-[#FEECEB]/40 transition">
                                  <td className="py-3.5 px-4 font-mono font-black text-[#F04438]">{st.rollno}</td>
                                  <td className="py-3.5 px-4 font-black text-[#1B1E28] dark:text-white">{st.name}</td>
                                  <td className="py-3.5 px-4 text-center font-bold text-[#1B1E28] dark:text-slate-200">{st.totalClasses}</td>
                                  <td className="py-3.5 px-4 text-center font-mono font-black text-[#00C48C]">{st.totalPresent}</td>
                                  <td className="py-3.5 px-4 text-center font-mono font-black text-[#F04438] text-sm">{st.overallPct}%</td>
                                  <td className="py-3.5 px-4 text-center font-mono font-black text-[#FFB020]">+{needed} Classes</td>
                                  <td className="py-3.5 px-4 text-center">
                                    <button
                                      onClick={() => alert(`Warning notification queued for parent of ${st.name}`)}
                                      className="px-3 py-1.5 rounded-xl bg-[#FEECEB] hover:bg-[#F04438] text-[#F04438] hover:text-white font-black text-[11px] border border-[#F04438]/30 transition shadow-sm"
                                    >
                                      📩 Notify Parent
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-[#E7EAF3] dark:border-slate-800 text-xs font-bold text-[#4E5969] dark:text-slate-400">
                        <span>Showing {Math.min((currentPage - 1) * pageSize + 1, shortageStudents.length)} to {Math.min(currentPage * pageSize, shortageStudents.length)} of {shortageStudents.length} students</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 hover:bg-[#EEECFF] disabled:opacity-40 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-slate-200 font-black transition"
                          >
                            Previous
                          </button>
                          <span className="font-mono text-[#5B4BFF]">{currentPage} / {Math.ceil(shortageStudents.length / pageSize) || 1}</span>
                          <button
                            onClick={() => setCurrentPage(p => Math.min(Math.ceil(shortageStudents.length / pageSize), p + 1))}
                            disabled={currentPage >= Math.ceil(shortageStudents.length / pageSize)}
                            className="px-3 py-1.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 hover:bg-[#EEECFF] disabled:opacity-40 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-slate-200 font-black transition"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
