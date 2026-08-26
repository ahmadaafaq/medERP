'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Clock, 
  Calendar, 
  MapPin, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Download, 
  Phone, 
  Building2, 
  Briefcase,
  ArrowUpDown,
  LogIn,
  LogOut,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  X
} from 'lucide-react';

interface StaffPunchRecord {
  EmpID: string;
  EmpName: string;
  Department: string;
  Designation: string;
  PermanentTelNo: string;
  PUNCHTIME: string;
  isPunched: boolean;
}

const LOCATION_OPTIONS = [
  { id: '7', label: 'Loc 7 — SRMS CET Bareilly (Default)' },
  { id: '1', label: 'Loc 1 — SRMS IMS & Central Campus' },
  { id: '8', label: 'Loc 8 — SRMS CETR Bareilly' },
  { id: '6', label: 'Loc 6 — SRMS IBS Lucknow' },
  { id: '4', label: 'Loc 4 — SRMS Nursing Bareilly' },
  { id: '10', label: 'Loc 10 — SRMS Pharmacy' },
  { id: '2', label: 'Loc 2 — SRMS Hospital Bareilly' },
  { id: '5', label: 'Loc 5 — SRMS Trust Office' },
  { id: '9', label: 'Loc 9 — SRMS Law Bareilly' },
  { id: '12', label: 'Loc 12 — SRMS Unnao Campus' },
  { id: '14', label: 'Loc 14 — SRMS Allied Health Sciences' },
  { id: 'ALL', label: 'All Campus Locations Combined' },
];

export default function FacultyDailyPunchWidget() {
  // Today's date YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedLocId, setSelectedLocId] = useState<string>('7');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [punchType, setPunchType] = useState<'1' | '2'>('1'); // '1' = Punch In, '2' = Punch Out
  const [activeTab, setActiveTab] = useState<'ALL' | 'PUNCHED' | 'NO_PUNCH'>('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [records, setRecords] = useState<StaffPunchRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Fetch Live Daily Punch Report (Triggers on punchType, selectedLocId, selectedDate change)
  const fetchPunchReport = async (loc = selectedLocId, dt = selectedDate, pType = punchType) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/srms/daily-punch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          LocId: loc,
          date: dt,
          punch_typ: pType,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed with status ${res.status}`);
      }

      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setRecords(json.data);
      } else {
        setRecords([]);
      }
      setCurrentPage(1);
    } catch (err: any) {
      console.error('Failed to load daily punch report:', err);
      setError(err.message || 'Error fetching punch report');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch on any filter state change
  useEffect(() => {
    fetchPunchReport(selectedLocId, selectedDate, punchType);
  }, [selectedLocId, selectedDate, punchType]);

  // Handle direct click on Punch In / Punch Out buttons
  const handlePunchTypeChange = (newType: '1' | '2') => {
    if (newType === punchType) return;
    setPunchType(newType);
    // useEffect will auto-trigger fetch with new punch_typ
  };

  // Extract unique departments dynamically
  const departmentList = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.Department && r.Department.trim()) {
        set.add(r.Department.trim());
      }
    });
    return Array.from(set).sort();
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    let result = [...records];

    // 1. Tab Filter
    if (activeTab === 'PUNCHED') {
      result = result.filter((r) => r.isPunched);
    } else if (activeTab === 'NO_PUNCH') {
      result = result.filter((r) => !r.isPunched);
    }

    // 2. Department Filter
    if (selectedDepartment !== 'ALL') {
      result = result.filter((r) => r.Department.toLowerCase() === selectedDepartment.toLowerCase());
    }

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.EmpName.toLowerCase().includes(q) ||
          r.EmpID.toLowerCase().includes(q) ||
          r.Department.toLowerCase().includes(q) ||
          r.Designation.toLowerCase().includes(q) ||
          r.PermanentTelNo.includes(q)
      );
    }

    // Punched entries on top in 'ALL'
    if (activeTab === 'ALL') {
      result.sort((a, b) => {
        if (a.isPunched && !b.isPunched) return -1;
        if (!a.isPunched && b.isPunched) return 1;
        return a.EmpName.localeCompare(b.EmpName);
      });
    }

    return result;
  }, [records, activeTab, selectedDepartment, searchQuery]);

  // Counts
  const punchedCount = useMemo(() => records.filter((r) => r.isPunched).length, [records]);
  const noPunchCount = useMemo(() => records.length - punchedCount, [records, punchedCount]);
  const punchPercentage = records.length > 0 ? Math.round((punchedCount / records.length) * 100) : 0;

  // Pagination calculation
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    if (pageSize === -1) return filteredRecords;
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;
    const headers = ['Emp ID', 'Emp Name', 'Department', 'Designation', 'Mobile', 'Punch Time', 'Status', 'Punch Type'];
    const rows = filteredRecords.map((r) => [
      `"${r.EmpID}"`,
      `"${r.EmpName}"`,
      `"${r.Department}"`,
      `"${r.Designation}"`,
      `"${r.PermanentTelNo}"`,
      `"${r.PUNCHTIME || 'N/A'}"`,
      `"${r.isPunched ? 'Punched' : 'Pending'}"`,
      `"${punchType === '1' ? 'Punch In' : 'Punch Out'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SRMS_DailyPunches_Loc${selectedLocId}_${selectedDate}_${punchType === '1' ? 'PunchIn' : 'PunchOut'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft hover:shadow-md transition-all space-y-6">
      {/* Top Header & Interactive Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#E7EAF3] dark:border-slate-800">
        {/* Left: Title & Badge */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5B4BFF] to-[#7867FF] text-white flex items-center justify-center font-black text-xl shadow-md shadow-[#5B4BFF]/25 flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base font-black text-[#1B1E28] dark:text-white uppercase tracking-tight">
                Faculties & Staff Biometric Punches
              </h2>
              <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                LIVE SYNC
              </span>
            </div>
            <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium mt-0.5">
              Real-time biometric attendance records & machine timestamps from SRMS ERP portal
            </p>
          </div>
        </div>

        {/* Right: Punch In/Out Toggle, Date Picker, Location Dropdown, Action Icons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Segmented Punch Type Toggle */}
          <div className="inline-flex p-1 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 shadow-inner">
            <button
              type="button"
              onClick={() => handlePunchTypeChange('1')}
              disabled={loading}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                punchType === '1'
                  ? 'bg-[#5B4BFF] text-white shadow-md shadow-[#5B4BFF]/30 scale-[1.02]'
                  : 'text-[#4E5969] dark:text-slate-300 hover:text-[#1B1E28] hover:bg-white/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Punch In (1)</span>
              {punchType === '1' && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                  {punchedCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handlePunchTypeChange('2')}
              disabled={loading}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                punchType === '2'
                  ? 'bg-[#F36C21] text-white shadow-md shadow-[#F36C21]/30 scale-[1.02]'
                  : 'text-[#4E5969] dark:text-slate-300 hover:text-[#1B1E28] hover:bg-white/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Punch Out (2)</span>
              {punchType === '2' && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                  {punchedCount}
                </span>
              )}
            </button>
          </div>

          {/* Date Picker (Current date by default) */}
          <div className="relative flex items-center">
            <Calendar className="w-4 h-4 absolute left-3 text-[#5B4BFF] pointer-events-none" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs font-bold rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] shadow-sm cursor-pointer"
            />
          </div>

          {/* Location Dropdown {1..11} default 7 */}
          <div className="relative flex items-center">
            <MapPin className="w-4 h-4 absolute left-3 text-[#F36C21] pointer-events-none" />
            <select
              value={selectedLocId}
              onChange={(e) => setSelectedLocId(e.target.value)}
              className="pl-9 pr-8 py-2 text-xs font-black rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] shadow-sm cursor-pointer max-w-[240px]"
            >
              {LOCATION_OPTIONS.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reload Button */}
          <button
            onClick={() => fetchPunchReport(selectedLocId, selectedDate, punchType)}
            disabled={loading}
            className="p-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#4E5969] dark:text-slate-300 transition-all disabled:opacity-50 shadow-sm cursor-pointer hover:scale-105 active:scale-95"
            title="Refresh Biometric Punches"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#5B4BFF]' : ''}`} />
          </button>

          {/* Export to CSV */}
          <button
            onClick={handleExportCSV}
            disabled={filteredRecords.length === 0 || loading}
            className="p-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#4E5969] dark:text-slate-300 transition-all disabled:opacity-50 shadow-sm cursor-pointer hover:scale-105 active:scale-95"
            title="Export Records to CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Staff */}
        <div className="p-5 rounded-2xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-[#E7EAF3] dark:border-slate-700 shadow-sm space-y-2 hover:border-[#5B4BFF]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-[#4E5969] dark:text-slate-400 tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#5B4BFF]" />
              Total Staff Listed
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#5B4BFF]/10 text-[#5B4BFF] text-[10px] font-black">
              Loc {selectedLocId}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-[#1B1E28] dark:text-white">{records.length}</p>
            <span className="text-xs font-bold text-slate-400">Total Members</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
            {departmentList.length} Active Departments
          </p>
        </div>

        {/* Verified Punches */}
        <div className="p-5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/30 border border-emerald-500/20 shadow-sm space-y-2 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {punchType === '1' ? 'Punched In (Present)' : 'Punched Out (Exit)'}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
              {punchPercentage}% Ratio
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{punchedCount}</p>
            <span className="text-xs font-bold text-emerald-700/70 dark:text-emerald-400/70">Verified Logged</span>
          </div>
          <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">
            Active punches recorded on {selectedDate}
          </p>
        </div>

        {/* Pending / No Punch */}
        <div className="p-5 rounded-2xl bg-amber-500/5 dark:bg-amber-950/30 border border-amber-500/20 shadow-sm space-y-2 hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-amber-600" />
              Pending / No Punch
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-black">
              {100 - punchPercentage}% Unpunched
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{noPunchCount}</p>
            <span className="text-xs font-bold text-amber-700/70 dark:text-amber-400/70">Pending Log</span>
          </div>
          <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 font-medium">
            No machine punch recorded yet
          </p>
        </div>

        {/* Punch Rate & Visual Progress */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#2D2575] to-[#1E184F] text-white shadow-md space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-indigo-200 tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#F36C21]" />
              Punch Attendance Rate
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-white/10 text-white font-mono">
              {punchType === '1' ? 'IN' : 'OUT'}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-black text-white">{punchPercentage}%</p>
            <span className="text-xs font-bold text-indigo-200">{punchedCount} of {records.length}</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-2.5 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#00C48C] via-[#5B4BFF] to-[#F36C21] transition-all duration-700"
              style={{ width: `${Math.max(2, punchPercentage)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Tabs & Filtration Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        {/* Status Tabs */}
        <div className="inline-flex p-1 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 shadow-inner w-fit flex-wrap">
          <button
            type="button"
            onClick={() => {
              setActiveTab('ALL');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-[#5B4BFF] shadow-sm scale-[1.02]'
                : 'text-[#4E5969] dark:text-slate-400 hover:text-[#1B1E28]'
            }`}
          >
            All Staff ({records.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('PUNCHED');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'PUNCHED'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-[1.02]'
                : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            <span>● Punch List</span>
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'PUNCHED' ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
            }`}>
              {punchedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('NO_PUNCH');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'NO_PUNCH'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 scale-[1.02]'
                : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
            }`}
          >
            <span>○ No Punch List</span>
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'NO_PUNCH' ? 'bg-white/20 text-white' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
            }`}>
              {noPunchCount}
            </span>
          </button>
        </div>

        {/* Department Filter & Search Input */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Department Filter */}
          <div className="relative flex items-center">
            <Building2 className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-8 py-2 text-xs font-bold rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] max-w-[220px] truncate cursor-pointer shadow-sm"
            >
              <option value="ALL">All Departments ({departmentList.length})</option>
              {departmentList.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex items-center min-w-[220px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search Name, EmpID, Dept..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-8 py-2 text-xs font-medium rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] w-full shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Staff Biometric Punches Table */}
      <div className="rounded-2xl border border-[#E7EAF3] dark:border-slate-800 overflow-hidden shadow-sm bg-white dark:bg-slate-900">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <RefreshCw className="w-9 h-9 text-[#5B4BFF] animate-spin mx-auto" />
            <p className="text-sm font-black text-[#1B1E28] dark:text-white uppercase tracking-wider">
              Fetching {punchType === '1' ? 'Punch In' : 'Punch Out'} Records...
            </p>
            <p className="text-xs text-[#4E5969] dark:text-slate-400">
              Connecting to SRMS HR punch server for Loc {selectedLocId} on {selectedDate}
            </p>
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-3">
            <XCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <p className="text-sm font-black text-rose-600 dark:text-rose-400">Failed to load biometric data</p>
            <p className="text-xs text-slate-400">{error}</p>
            <button
              onClick={() => fetchPunchReport(selectedLocId, selectedDate, punchType)}
              className="mt-2 px-5 py-2 rounded-xl bg-[#5B4BFF] text-white text-xs font-black hover:bg-[#4838DF] shadow-md shadow-[#5B4BFF]/25 cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-black text-[#1B1E28] dark:text-white uppercase tracking-wider">
              No Staff Punch Records Found
            </p>
            <p className="text-xs text-[#4E5969] dark:text-slate-400 max-w-md mx-auto">
              No records match the current filter ({activeTab === 'PUNCHED' ? 'Punched List' : activeTab === 'NO_PUNCH' ? 'No Punch List' : 'All Staff'}).
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F6F8FC] dark:bg-slate-800/80 text-[10px] font-black uppercase text-[#4E5969] dark:text-slate-300 tracking-wider border-b border-[#E7EAF3] dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-4">Staff Member / Emp ID</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Designation</th>
                  <th className="py-3.5 px-4">Contact No</th>
                  <th className="py-3.5 px-4 text-center">
                    {punchType === '1' ? 'Punch In Time' : 'Punch Out Time'}
                  </th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800 font-medium">
                {paginatedRecords.map((staff, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr
                      key={staff.EmpID + idx}
                      className={`hover:bg-[#F8FAFC] dark:hover:bg-slate-800/60 transition-colors ${
                        staff.isPunched
                          ? 'bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05]'
                          : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center text-[11px] text-slate-400 font-mono">
                        {globalIdx}
                      </td>

                      {/* Emp Name & ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shadow-sm flex-shrink-0 ${
                              staff.isPunched
                                ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-[#4E5969] dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {staff.EmpName.charAt(0) || 'S'}
                          </div>
                          <div>
                            <p className="font-black text-[#1B1E28] dark:text-white text-xs leading-tight line-clamp-1">
                              {staff.EmpName}
                            </p>
                            <span className="text-[10px] font-mono text-slate-400 font-bold block mt-0.5">
                              ID: {staff.EmpID}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-[#5B4BFF]/10 dark:bg-[#5B4BFF]/20 text-[#5B4BFF] dark:text-indigo-300 text-[11px] font-extrabold border border-[#5B4BFF]/20 inline-block max-w-[210px] truncate">
                          {staff.Department}
                        </span>
                      </td>

                      {/* Designation */}
                      <td className="py-3.5 px-4 text-[11px] text-[#4E5969] dark:text-slate-300 font-semibold">
                        {staff.Designation}
                      </td>

                      {/* Contact Number */}
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {staff.PermanentTelNo && staff.PermanentTelNo !== '0000000000' && staff.PermanentTelNo !== '0' && staff.PermanentTelNo.trim() !== '' ? (
                          <a
                            href={`tel:${staff.PermanentTelNo}`}
                            className="text-[#4E5969] dark:text-slate-400 hover:text-[#5B4BFF] dark:hover:text-indigo-400 hover:underline inline-flex items-center gap-1.5 font-bold"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{staff.PermanentTelNo}</span>
                          </a>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 font-sans">—</span>
                        )}
                      </td>

                      {/* Punch Time */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        {staff.isPunched ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black text-xs border border-emerald-200 dark:border-emerald-800 shadow-sm">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            {staff.PUNCHTIME}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 text-xs font-sans font-bold">
                            Not Recorded
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-right">
                        {staff.isPunched ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/20 shadow-sm">
                            ● PUNCHED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/20">
                            ○ PENDING
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer Controls */}
        {!loading && filteredRecords.length > 0 && (
          <div className="p-4 bg-[#F6F8FC] dark:bg-slate-800/80 border-t border-[#E7EAF3] dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 text-[#4E5969] dark:text-slate-400 font-medium">
              <span>
                Showing <strong className="text-[#1B1E28] dark:text-white">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
                <strong className="text-[#1B1E28] dark:text-white">
                  {Math.min(currentPage * pageSize, filteredRecords.length)}
                </strong>{' '}
                of <strong className="text-[#1B1E28] dark:text-white">{filteredRecords.length}</strong> staff entries
              </span>

              {/* Page size selector */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-300 dark:border-slate-600">
                <span className="text-[11px]">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 rounded-lg border border-[#E7EAF3] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={-1}>All ({filteredRecords.length})</option>
                </select>
              </div>
            </div>

            {/* Prev / Next Buttons */}
            {pageSize !== -1 && totalPages > 1 && (
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#4E5969] dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-3 py-1 font-bold text-[#1B1E28] dark:text-white text-xs">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#4E5969] dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* System Footer Metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#4E5969] dark:text-slate-400 font-medium pt-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span>Live SRMS HR API: <code className="font-mono text-[#5B4BFF]">GetDailyPunchRpt</code></span>
          <span>•</span>
          <span>Location: <strong className="text-[#1B1E28] dark:text-white">Loc {selectedLocId}</strong></span>
          <span>•</span>
          <span>Punch Mode: <strong className="text-[#1B1E28] dark:text-white">{punchType === '1' ? 'Punch In (1)' : 'Punch Out (2)'}</strong></span>
          <span>•</span>
          <span>Date: <strong className="text-[#1B1E28] dark:text-white">{selectedDate}</strong></span>
        </div>
        <div className="font-black text-[#5B4BFF] dark:text-indigo-400">
          MedERP Biometric Intelligence Console
        </div>
      </div>
    </div>
  );
}
