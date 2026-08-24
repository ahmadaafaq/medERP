'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  CalendarDays, 
  Users, 
  Clock, 
  MapPin, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Download, 
  Building2, 
  Briefcase,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  X,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info
} from 'lucide-react';

interface RawLeaveRecord {
  EMPID: string;
  EMPNAME: string;
  Designation: string;
  Department: string;
  Categary: string;
  MNTH: number;
  YR: number;
  WD: number;
  PP: number;
  CL: number;
  SL: number;
  EL: number;
  CO: number;
  SPALL: number;
  LWP: number;
  totalPaidLeave: number;
  totalLeaves: number;
  attendancePct: number;
}

interface AggregatedStaffLeave {
  EMPID: string;
  EMPNAME: string;
  Designation: string;
  Department: string;
  Categary: string;
  YR: number;
  totalWD: number;
  totalPP: number;
  totalCL: number;
  totalSL: number;
  totalEL: number;
  totalCO: number;
  totalSPALL: number;
  totalLWP: number;
  totalLeaves: number;
  avgAttendancePct: number;
  monthsCount: number;
  monthRecords: RawLeaveRecord[];
}

const MONTH_NAMES = [
  'All Months',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const LOCATION_OPTIONS = [
  { id: '1', label: 'Loc 1 — SRMS IMS Bareilly' },
  { id: '2', label: 'Loc 2 — SRMS Hospital Bareilly' },
  { id: '3', label: 'Loc 3 — SRMS IPS Bareilly' },
  { id: '4', label: 'Loc 4 — SRMS Nursing Bareilly' },
  { id: '5', label: 'Loc 5 — SRMS Trust Office' },
  { id: '6', label: 'Loc 6 — SRMS IBS Lucknow' },
  { id: '7', label: 'Loc 7 — SRMS CET Bareilly (Default)' },
  { id: '8', label: 'Loc 8 — SRMS CETR Bareilly' },
  { id: '9', label: 'Loc 9 — SRMS Law Bareilly' },
  { id: '10', label: 'Loc 10 — SRMS Pharmacy' },
  { id: '11', label: 'Loc 11 — SRMS City Campus' },
];

export default function FacultyLeaveLedgerWidget() {
  const currentYear = new Date().getFullYear();
  const currentMonthNum = new Date().getMonth() + 1; // 1-12

  const [selectedLocId, setSelectedLocId] = useState<string>('7');
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [selectedMonth, setSelectedMonth] = useState<number>(0); // 0 = All Months
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'ALL' | 'ON_LEAVE' | 'FULL_PRESENT' | 'LWP'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [rawRecords, setRawRecords] = useState<RawLeaveRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Expandable row for staff month-by-month history
  const [expandedEmpId, setExpandedEmpId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Fetch Leave Data
  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/srms/leave-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          LocId: selectedLocId,
          frmyr: selectedYear,
          toyr: selectedYear,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setRawRecords(json.data);
      } else {
        setRawRecords([]);
      }
      setCurrentPage(1);
    } catch (err: any) {
      console.error('Error fetching SRMS leave view:', err);
      setError(err.message || 'Error loading leave records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveData();
  }, [selectedLocId, selectedYear]);

  // Extract dynamic filters (Departments, Categories, Available Months)
  const { departmentList, categoryList, availableMonths } = useMemo(() => {
    const depts = new Set<string>();
    const cats = new Set<string>();
    const months = new Set<number>();

    rawRecords.forEach((r) => {
      if (r.Department && r.Department.trim()) depts.add(r.Department.trim());
      if (r.Categary && r.Categary.trim()) cats.add(r.Categary.trim());
      if (r.MNTH > 0) months.add(r.MNTH);
    });

    return {
      departmentList: Array.from(depts).sort(),
      categoryList: Array.from(cats).sort(),
      availableMonths: Array.from(months).sort((a, b) => a - b),
    };
  }, [rawRecords]);

  // Aggregate or Filter by Selected Month
  const aggregatedStaffList = useMemo(() => {
    // If a specific month is selected (1-12)
    if (selectedMonth > 0) {
      const monthFiltered = rawRecords.filter((r) => r.MNTH === selectedMonth);
      return monthFiltered.map((r) => ({
        EMPID: r.EMPID,
        EMPNAME: r.EMPNAME,
        Designation: r.Designation,
        Department: r.Department,
        Categary: r.Categary,
        YR: r.YR,
        totalWD: r.WD,
        totalPP: r.PP,
        totalCL: r.CL,
        totalSL: r.SL,
        totalEL: r.EL,
        totalCO: r.CO,
        totalSPALL: r.SPALL,
        totalLWP: r.LWP,
        totalLeaves: r.totalLeaves,
        avgAttendancePct: r.attendancePct,
        monthsCount: 1,
        monthRecords: [r],
      }));
    }

    // Else: Group & aggregate all months for each employee
    const map = new Map<string, AggregatedStaffLeave>();

    rawRecords.forEach((r) => {
      const key = r.EMPID || r.EMPNAME;
      if (!map.has(key)) {
        map.set(key, {
          EMPID: r.EMPID,
          EMPNAME: r.EMPNAME,
          Designation: r.Designation,
          Department: r.Department,
          Categary: r.Categary,
          YR: r.YR,
          totalWD: 0,
          totalPP: 0,
          totalCL: 0,
          totalSL: 0,
          totalEL: 0,
          totalCO: 0,
          totalSPALL: 0,
          totalLWP: 0,
          totalLeaves: 0,
          avgAttendancePct: 0,
          monthsCount: 0,
          monthRecords: [],
        });
      }

      const item = map.get(key)!;
      item.totalWD += r.WD;
      item.totalPP += r.PP;
      item.totalCL += r.CL;
      item.totalSL += r.SL;
      item.totalEL += r.EL;
      item.totalCO += r.CO;
      item.totalSPALL += r.SPALL;
      item.totalLWP += r.LWP;
      item.totalLeaves += r.totalLeaves;
      item.monthsCount += 1;
      item.monthRecords.push(r);
    });

    // Compute average attendance percentage
    const list = Array.from(map.values()).map((item) => {
      item.avgAttendancePct =
        item.totalWD > 0 ? Math.min(100, Math.round((item.totalPP / item.totalWD) * 100)) : 0;
      // Sort months inside records
      item.monthRecords.sort((a, b) => a.MNTH - b.MNTH);
      return item;
    });

    return list;
  }, [rawRecords, selectedMonth]);

  // Filtered Roster by Department, Category, Tab, Search
  const filteredStaffList = useMemo(() => {
    let result = [...aggregatedStaffList];

    // 1. Tab filter
    if (activeTab === 'ON_LEAVE') {
      result = result.filter((r) => r.totalLeaves > 0);
    } else if (activeTab === 'FULL_PRESENT') {
      result = result.filter((r) => r.totalLeaves === 0 && r.totalPP >= r.totalWD);
    } else if (activeTab === 'LWP') {
      result = result.filter((r) => r.totalLWP > 0);
    }

    // 2. Department filter
    if (selectedDepartment !== 'ALL') {
      result = result.filter((r) => r.Department.toLowerCase() === selectedDepartment.toLowerCase());
    }

    // 3. Category filter
    if (selectedCategory !== 'ALL') {
      result = result.filter((r) => r.Categary.toLowerCase() === selectedCategory.toLowerCase());
    }

    // 4. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.EMPNAME.toLowerCase().includes(q) ||
          r.EMPID.toLowerCase().includes(q) ||
          r.Department.toLowerCase().includes(q) ||
          r.Designation.toLowerCase().includes(q)
      );
    }

    // Sort: Staff with leaves or LWP on top, then alphabetical
    result.sort((a, b) => {
      if (a.totalLWP > 0 && b.totalLWP === 0) return -1;
      if (a.totalLWP === 0 && b.totalLWP > 0) return 1;
      if (a.totalLeaves > 0 && b.totalLeaves === 0) return -1;
      if (a.totalLeaves === 0 && b.totalLeaves > 0) return 1;
      return a.EMPNAME.localeCompare(b.EMPNAME);
    });

    return result;
  }, [aggregatedStaffList, activeTab, selectedDepartment, selectedCategory, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalStaff = aggregatedStaffList.length;
    const totalLeaves = aggregatedStaffList.reduce((acc, s) => acc + s.totalLeaves, 0);
    const totalLWP = aggregatedStaffList.reduce((acc, s) => acc + s.totalLWP, 0);
    const totalCL = aggregatedStaffList.reduce((acc, s) => acc + s.totalCL, 0);
    const totalEL = aggregatedStaffList.reduce((acc, s) => acc + s.totalEL, 0);
    const totalSL = aggregatedStaffList.reduce((acc, s) => acc + s.totalSL, 0);

    const onLeaveStaffCount = aggregatedStaffList.filter((s) => s.totalLeaves > 0).length;
    const lwpStaffCount = aggregatedStaffList.filter((s) => s.totalLWP > 0).length;
    const fullPresentStaffCount = aggregatedStaffList.filter((s) => s.totalLeaves === 0 && s.totalPP >= s.totalWD).length;

    const totalWorkingDaysAll = aggregatedStaffList.reduce((acc, s) => acc + s.totalWD, 0);
    const totalPresentDaysAll = aggregatedStaffList.reduce((acc, s) => acc + s.totalPP, 0);
    const overallAttendanceRate =
      totalWorkingDaysAll > 0 ? Math.min(100, Math.round((totalPresentDaysAll / totalWorkingDaysAll) * 100)) : 0;

    return {
      totalStaff,
      totalLeaves,
      totalLWP,
      totalCL,
      totalEL,
      totalSL,
      onLeaveStaffCount,
      lwpStaffCount,
      fullPresentStaffCount,
      overallAttendanceRate,
    };
  }, [aggregatedStaffList]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredStaffList.length / pageSize) || 1;
  const paginatedStaffList = useMemo(() => {
    if (pageSize === -1) return filteredStaffList;
    const start = (currentPage - 1) * pageSize;
    return filteredStaffList.slice(start, start + pageSize);
  }, [filteredStaffList, currentPage, pageSize]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredStaffList.length === 0) return;
    const headers = [
      'Emp ID',
      'Emp Name',
      'Department',
      'Designation',
      'Category',
      'Period',
      'Working Days (WD)',
      'Present Days (PP)',
      'Attendance %',
      'Casual Leave (CL)',
      'Earned Leave (EL)',
      'Sick Leave (SL)',
      'Comp Off (CO)',
      'Leave Without Pay (LWP)',
      'Total Leaves',
    ];

    const rows = filteredStaffList.map((r) => [
      `"${r.EMPID}"`,
      `"${r.EMPNAME}"`,
      `"${r.Department}"`,
      `"${r.Designation}"`,
      `"${r.Categary}"`,
      `"${selectedMonth > 0 ? MONTH_NAMES[selectedMonth] : 'Jan - Jul Annual'}"`,
      r.totalWD,
      r.totalPP,
      `"${r.avgAttendancePct}%"`,
      r.totalCL,
      r.totalEL,
      r.totalSL,
      r.totalCO,
      r.totalLWP,
      r.totalLeaves,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `SRMS_Leave_Ledger_Loc${selectedLocId}_${selectedYear}_${selectedMonth > 0 ? MONTH_NAMES[selectedMonth] : 'Annual'}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft hover:shadow-md transition-all space-y-6">
      {/* Header Bar with Intelligent Month/Year/Location Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#E7EAF3] dark:border-slate-800">
        {/* Left: Title & Badge */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5B4BFF] to-[#00C48C] text-white flex items-center justify-center font-black text-xl shadow-md shadow-[#5B4BFF]/20 flex-shrink-0">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base font-black text-[#1B1E28] dark:text-white uppercase tracking-tight">
                Faculty & Staff Leave Intelligence Ledger
              </h2>
              <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-[#5B4BFF]/10 text-[#5B4BFF] dark:text-indigo-400 border border-[#5B4BFF]/20">
                {rawRecords.length.toLocaleString()} Ledger Records
              </span>
            </div>
            <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium mt-0.5">
              Monthly working days (WD), present days (PP), CL, SL, EL, CO & Leave Without Pay (LWP)
            </p>
          </div>
        </div>

        {/* Right Controls: Month Selector, Year Selector, Location Dropdown, Refresh & Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Filter Dropdown */}
          <div className="relative flex items-center">
            <CalendarDays className="w-4 h-4 absolute left-3 text-[#5B4BFF] pointer-events-none" />
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="pl-9 pr-8 py-2 text-xs font-black rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] shadow-sm cursor-pointer"
            >
              <option value={0}>📅 All Months (Consolidated)</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {MONTH_NAMES[m]} (Month {m})
                </option>
              ))}
            </select>
          </div>

          {/* Year Dropdown */}
          <div className="relative flex items-center">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 text-xs font-black rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] shadow-sm cursor-pointer"
            >
              <option value="2026">Year 2026</option>
              <option value="2025">Year 2025</option>
              <option value="2024">Year 2024</option>
            </select>
          </div>

          {/* Location Dropdown */}
          <div className="relative flex items-center">
            <MapPin className="w-4 h-4 absolute left-3 text-[#F36C21] pointer-events-none" />
            <select
              value={selectedLocId}
              onChange={(e) => setSelectedLocId(e.target.value)}
              className="pl-9 pr-8 py-2 text-xs font-black rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] shadow-sm cursor-pointer max-w-[220px]"
            >
              {LOCATION_OPTIONS.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.label}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchLeaveData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#4E5969] dark:text-slate-300 transition-all disabled:opacity-50 shadow-sm cursor-pointer hover:scale-105 active:scale-95"
            title="Refresh Leave Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#5B4BFF]' : ''}`} />
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            disabled={filteredStaffList.length === 0 || loading}
            className="p-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#4E5969] dark:text-slate-300 transition-all disabled:opacity-50 shadow-sm cursor-pointer hover:scale-105 active:scale-95"
            title="Export Leave Report to CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Staff */}
        <div className="p-5 rounded-2xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-[#E7EAF3] dark:border-slate-700 shadow-sm space-y-2 hover:border-[#5B4BFF]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-[#4E5969] dark:text-slate-400 tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#5B4BFF]" />
              Staff on Record
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#5B4BFF]/10 text-[#5B4BFF] text-[10px] font-black">
              Loc {selectedLocId}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-[#1B1E28] dark:text-white">{metrics.totalStaff}</p>
            <span className="text-xs font-bold text-slate-400">Total Employees</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {departmentList.length} Departments • {categoryList.length} Categories
          </p>
        </div>

        {/* Card 2: Total Leaves Taken */}
        <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-800/50 shadow-sm space-y-2 hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-indigo-700 dark:text-indigo-300 tracking-wider flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-[#5B4BFF]" />
              Total Leaves Availed
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#5B4BFF]/15 text-[#5B4BFF] dark:text-indigo-300 text-[10px] font-black">
              {metrics.onLeaveStaffCount} Staff Took Leave
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-[#5B4BFF] dark:text-indigo-400">{metrics.totalLeaves}</p>
            <span className="text-xs font-bold text-indigo-700/70 dark:text-indigo-400/70">Days (CL+EL+SL)</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-700/80 dark:text-indigo-300/80">
            <span>CL: {metrics.totalCL}</span>
            <span>•</span>
            <span>EL: {metrics.totalEL}</span>
            <span>•</span>
            <span>SL: {metrics.totalSL}</span>
          </div>
        </div>

        {/* Card 3: Leave Without Pay (LWP) */}
        <div className="p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200/50 dark:border-rose-800/50 shadow-sm space-y-2 hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-rose-700 dark:text-rose-400 tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              Leave Without Pay (LWP)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[10px] font-black">
              {metrics.lwpStaffCount} Staff Affected
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{metrics.totalLWP}</p>
            <span className="text-xs font-bold text-rose-700/70 dark:text-rose-400/70">Unpaid Days</span>
          </div>
          <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 font-medium">
            Salary deduction / non-compensated leaves
          </p>
        </div>

        {/* Card 4: Overall Monthly Attendance Rate */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#2D2575] to-[#1E184F] text-white shadow-md space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-indigo-200 tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#00C48C]" />
              Average Present Ratio
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-white/10 text-white font-mono">
              {selectedMonth > 0 ? MONTH_NAMES[selectedMonth].substring(0, 3) : 'YTD'}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-black text-white">{metrics.overallAttendanceRate}%</p>
            <span className="text-xs font-bold text-indigo-200">PP / WD Factor</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-2.5 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#00C48C] to-[#5B4BFF] transition-all duration-700"
              style={{ width: `${Math.max(5, metrics.overallAttendanceRate)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        {/* Status Tabs */}
        <div className="inline-flex p-1 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 shadow-inner w-fit flex-wrap">
          <button
            type="button"
            onClick={() => {
              setActiveTab('ALL');
              setCurrentPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-[#5B4BFF] shadow-sm scale-[1.02]'
                : 'text-[#4E5969] dark:text-slate-400 hover:text-[#1B1E28]'
            }`}
          >
            All Staff ({aggregatedStaffList.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('ON_LEAVE');
              setCurrentPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ON_LEAVE'
                ? 'bg-[#5B4BFF] text-white shadow-md shadow-[#5B4BFF]/30 scale-[1.02]'
                : 'text-[#5B4BFF] dark:text-indigo-400 hover:bg-[#5B4BFF]/10'
            }`}
          >
            <span>● On Leave</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'ON_LEAVE' ? 'bg-white/20 text-white' : 'bg-[#5B4BFF]/20 text-[#5B4BFF] dark:text-indigo-300'
            }`}>
              {metrics.onLeaveStaffCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('FULL_PRESENT');
              setCurrentPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'FULL_PRESENT'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-[1.02]'
                : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            <span>✨ 100% Present</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'FULL_PRESENT' ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
            }`}>
              {metrics.fullPresentStaffCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('LWP');
              setCurrentPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'LWP'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 scale-[1.02]'
                : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
            }`}
          >
            <span>⚠️ LWP / Unpaid</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'LWP' ? 'bg-white/20 text-white' : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
            }`}>
              {metrics.lwpStaffCount}
            </span>
          </button>
        </div>

        {/* Department, Category & Search Bar */}
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
              className="pl-9 pr-8 py-2 text-xs font-bold rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] max-w-[180px] truncate cursor-pointer shadow-sm"
            >
              <option value="ALL">All Departments ({departmentList.length})</option>
              {departmentList.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="relative flex items-center">
            <Briefcase className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-8 py-2 text-xs font-bold rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] max-w-[170px] truncate cursor-pointer shadow-sm"
            >
              <option value="ALL">All Categories ({categoryList.length})</option>
              {categoryList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex items-center min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search Staff Name, EmpID..."
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

      {/* Staff Leave Ledger Table with Shimmer Skeletal Loading */}
      <div className="rounded-2xl border border-[#E7EAF3] dark:border-slate-800 overflow-hidden shadow-sm bg-white dark:bg-slate-900">
        {loading ? (
          /* Shimmer Skeletal Loader */
          <div className="p-6 space-y-4 animate-pulse">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-48"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between gap-4 py-3">
                <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 flex-shrink-0"></div>
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-40"></div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800/60 rounded w-24"></div>
                </div>
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-28 hidden sm:block"></div>
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-32 hidden md:block"></div>
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-20"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <p className="text-sm font-black text-rose-600 dark:text-rose-400">Failed to load leave records</p>
            <p className="text-xs text-slate-400">{error}</p>
            <button
              onClick={fetchLeaveData}
              className="mt-2 px-5 py-2 rounded-xl bg-[#5B4BFF] text-white text-xs font-black hover:bg-[#4838DF] shadow-md shadow-[#5B4BFF]/25 cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        ) : filteredStaffList.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-black text-[#1B1E28] dark:text-white uppercase tracking-wider">
              No Staff Leave Records Found
            </p>
            <p className="text-xs text-[#4E5969] dark:text-slate-400 max-w-md mx-auto">
              No records match your selected month, department, category, or search filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F6F8FC] dark:bg-slate-800/80 text-[10px] font-black uppercase text-[#4E5969] dark:text-slate-300 tracking-wider border-b border-[#E7EAF3] dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-4">Employee / ID</th>
                  <th className="py-3.5 px-4">Department & Category</th>
                  <th className="py-3.5 px-4 text-center">Period / Months</th>
                  <th className="py-3.5 px-4 text-center">Working (WD) vs Present (PP)</th>
                  <th className="py-3.5 px-4 text-center">Leave Breakdown (CL / EL / SL / CO)</th>
                  <th className="py-3.5 px-4 text-center">Unpaid (LWP)</th>
                  <th className="py-3.5 px-4 text-right">Total Leaves</th>
                  <th className="py-3.5 px-4 w-10 text-center">History</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800 font-medium">
                {paginatedStaffList.map((staff, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const isExpanded = expandedEmpId === staff.EMPID;

                  return (
                    <>
                      <tr
                        key={staff.EMPID + idx}
                        className={`hover:bg-[#F8FAFC] dark:hover:bg-slate-800/60 transition-colors ${
                          staff.totalLWP > 0
                            ? 'bg-rose-500/[0.02] dark:bg-rose-500/[0.04]'
                            : staff.totalLeaves > 0
                            ? 'bg-[#5B4BFF]/[0.02] dark:bg-[#5B4BFF]/[0.04]'
                            : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center text-[11px] text-slate-400 font-mono">
                          {globalIdx}
                        </td>

                        {/* Staff Name & ID */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shadow-sm flex-shrink-0 ${
                                staff.totalLWP > 0
                                  ? 'bg-gradient-to-tr from-rose-500 to-amber-500 text-white'
                                  : staff.totalLeaves > 0
                                  ? 'bg-gradient-to-tr from-[#5B4BFF] to-[#7867FF] text-white'
                                  : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              }`}
                            >
                              {staff.EMPNAME.charAt(0) || 'S'}
                            </div>
                            <div>
                              <p className="font-black text-[#1B1E28] dark:text-white text-xs leading-tight line-clamp-1">
                                {staff.EMPNAME}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-mono text-slate-400 font-bold">
                                  {staff.EMPID}
                                </span>
                                <span className="text-[10px] text-[#4E5969] dark:text-slate-400 font-medium truncate max-w-[140px]">
                                  • {staff.Designation}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Department & Category */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <span className="px-2.5 py-0.5 rounded-lg bg-[#5B4BFF]/10 dark:bg-[#5B4BFF]/20 text-[#5B4BFF] dark:text-indigo-300 text-[10px] font-black border border-[#5B4BFF]/20 inline-block max-w-[180px] truncate">
                              {staff.Department}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-medium">
                              {staff.Categary}
                            </span>
                          </div>
                        </td>

                        {/* Period / Months */}
                        <td className="py-3.5 px-4 text-center">
                          {selectedMonth > 0 ? (
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-xs text-[#1B1E28] dark:text-white">
                              {MONTH_NAMES[selectedMonth]} {staff.YR}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-[#5B4BFF] dark:text-indigo-300 font-extrabold text-[11px] border border-indigo-100 dark:border-indigo-900/50">
                              {staff.monthsCount} Months (YTD)
                            </span>
                          )}
                        </td>

                        {/* Working Days (WD) vs Present (PP) */}
                        <td className="py-3.5 px-4 text-center font-mono">
                          <div className="space-y-1 inline-block text-center">
                            <span className="font-extrabold text-xs text-[#1B1E28] dark:text-white">
                              {staff.totalPP} <span className="text-slate-400 font-normal">/ {staff.totalWD} Days</span>
                            </span>
                            <div className="flex items-center gap-1.5">
                              <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#5B4BFF]"
                                  style={{ width: `${staff.avgAttendancePct}%` }}
                                ></div>
                              </div>
                              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                                {staff.avgAttendancePct}%
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Leave Breakdown */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                                staff.totalCL > 0
                                  ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/20'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                              }`}
                              title="Casual Leave (CL)"
                            >
                              CL: {staff.totalCL}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                                staff.totalEL > 0
                                  ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/20'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                              }`}
                              title="Earned Leave (EL)"
                            >
                              EL: {staff.totalEL}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                                staff.totalSL > 0
                                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                              }`}
                              title="Sick Leave (SL)"
                            >
                              SL: {staff.totalSL}
                            </span>
                          </div>
                        </td>

                        {/* Leave Without Pay (LWP) */}
                        <td className="py-3.5 px-4 text-center font-mono">
                          {staff.totalLWP > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-500/15 text-rose-700 dark:text-rose-300 text-xs font-black border border-rose-500/30">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              {staff.totalLWP} Days
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 text-xs">0</span>
                          )}
                        </td>

                        {/* Total Leaves */}
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`px-3 py-1 rounded-xl text-xs font-black shadow-sm ${
                              staff.totalLeaves > 0
                                ? 'bg-[#5B4BFF]/10 text-[#5B4BFF] dark:text-indigo-300 border border-[#5B4BFF]/20'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {staff.totalLeaves > 0 ? `${staff.totalLeaves} Days` : '0 (None)'}
                          </span>
                        </td>

                        {/* Expand Month Breakdown Button */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => setExpandedEmpId(isExpanded ? null : staff.EMPID)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-[#5B4BFF] transition-all cursor-pointer"
                            title="Toggle Monthly Breakdown"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Monthly History Sub-Table */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80 dark:bg-slate-800/40">
                          <td colSpan={9} className="p-4 pl-14">
                            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 space-y-3 shadow-inner">
                              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                <span className="text-xs font-black text-[#1B1E28] dark:text-white uppercase tracking-wider flex items-center gap-2">
                                  <span>📅</span>
                                  <span>Monthly Attendance & Leave History for {staff.EMPNAME}</span>
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  ID: {staff.EMPID} • Year {staff.YR}
                                </span>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                      <th className="p-2">Month</th>
                                      <th className="p-2 text-center">Working (WD)</th>
                                      <th className="p-2 text-center">Present (PP)</th>
                                      <th className="p-2 text-center">CL</th>
                                      <th className="p-2 text-center">SL</th>
                                      <th className="p-2 text-center">EL</th>
                                      <th className="p-2 text-center">CO</th>
                                      <th className="p-2 text-center">LWP</th>
                                      <th className="p-2 text-right">Attendance %</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                                    {staff.monthRecords.map((mRec) => (
                                      <tr key={mRec.MNTH} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                        <td className="p-2 font-sans font-extrabold text-[#1B1E28] dark:text-white">
                                          {MONTH_NAMES[mRec.MNTH]} ({mRec.MNTH})
                                        </td>
                                        <td className="p-2 text-center">{mRec.WD}</td>
                                        <td className="p-2 text-center text-emerald-600 font-black">{mRec.PP}</td>
                                        <td className="p-2 text-center text-blue-600">{mRec.CL}</td>
                                        <td className="p-2 text-center text-amber-600">{mRec.SL}</td>
                                        <td className="p-2 text-center text-purple-600">{mRec.EL}</td>
                                        <td className="p-2 text-center text-teal-600">{mRec.CO}</td>
                                        <td className="p-2 text-center text-rose-600 font-black">{mRec.LWP}</td>
                                        <td className="p-2 text-right font-sans font-black text-emerald-600">
                                          {mRec.attendancePct}%
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer Controls */}
        {!loading && filteredStaffList.length > 0 && (
          <div className="p-4 bg-[#F6F8FC] dark:bg-slate-800/80 border-t border-[#E7EAF3] dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 text-[#4E5969] dark:text-slate-400 font-medium">
              <span>
                Showing <strong className="text-[#1B1E28] dark:text-white">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
                <strong className="text-[#1B1E28] dark:text-white">
                  {Math.min(currentPage * pageSize, filteredStaffList.length)}
                </strong>{' '}
                of <strong className="text-[#1B1E28] dark:text-white">{filteredStaffList.length}</strong> staff entries
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
                  <option value={-1}>All ({filteredStaffList.length})</option>
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
          <span>Live SRMS HR API: <code className="font-mono text-[#5B4BFF]">GetLeaveView</code></span>
          <span>•</span>
          <span>Location: <strong className="text-[#1B1E28] dark:text-white">Loc {selectedLocId}</strong></span>
          <span>•</span>
          <span>Period: <strong className="text-[#1B1E28] dark:text-white">{selectedMonth > 0 ? MONTH_NAMES[selectedMonth] : 'All Months'} {selectedYear}</strong></span>
        </div>
        <div className="font-black text-[#5B4BFF] dark:text-indigo-400">
          MedERP Leave & Attendance Intelligence
        </div>
      </div>
    </div>
  );
}
