'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import {
  Trash2,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Database,
  Building2,
  Users,
  GraduationCap,
  Calendar,
  Rocket,
  FolderGit2,
  BookOpen,
  FileSpreadsheet,
  MessageSquare,
  Clock,
  Layers,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface TenantFirm {
  id: string;
  name?: string;
  title?: string;
  slug: string;
  firm_mode?: string;
  status?: string;
}

interface TenantStats {
  students: number;
  faculty: number;
  departments: number;
  courses: number;
  batches: number;
  timetables: number;
  notices: number;
  projects: number;
  incubation: number;
  logbooks: number;
  exams: number;
  chats: number;
  attendances: number;
}

const CLEANABLE_MODULES = [
  {
    id: 'STUDENTS',
    name: 'Student Master & Admissions',
    desc: 'Purges student profiles, admissions, academic records, parents, documents, fees, hostel/transport allocations, and student login accounts.',
    icon: GraduationCap,
    category: 'Core Master',
  },
  {
    id: 'FACULTY',
    name: 'Faculty & Staff Master',
    desc: 'Purges faculty roster, staff records, and staff login accounts (keeps main College Admin intact).',
    icon: Users,
    category: 'Core Master',
  },
  {
    id: 'COLLEGE_MASTER',
    name: 'College Master Structures',
    desc: 'Purges courses, batches, semesters, sections, subjects, classrooms, shifts, and degree types.',
    icon: Building2,
    category: 'Academic Core',
  },
  {
    id: 'ADMIN_MASTER',
    name: 'Admin Master Configurations',
    desc: 'Purges fee heads, salary structures, leave types, designations, hostel blocks, and transport routes.',
    icon: Layers,
    category: 'Academic Core',
  },
  {
    id: 'TIMETABLE',
    name: 'Timetables & Slots (Medical + Engineering)',
    desc: 'Purges all engineering and medical CBME master timetables, schedule slots, and clinical postings.',
    icon: Calendar,
    category: 'Schedules & Clinical',
  },
  {
    id: 'INCUBATION',
    name: 'Incubation & Ventures',
    desc: 'Purges startup applications, incubation grants, milestones, and innovation venture records.',
    icon: Rocket,
    category: 'Innovation',
  },
  {
    id: 'PROJECTS',
    name: 'Projects, Capstone & Mini-Projects',
    desc: 'Purges major projects, capstone submissions, mentor reviews, and mini-project uploads.',
    icon: FolderGit2,
    category: 'Innovation',
  },
  {
    id: 'LOGBOOK',
    name: 'Medical & Competency Logbooks',
    desc: 'Purges CBME competencies, logbook submissions, procedural skills logs, and student portfolios.',
    icon: BookOpen,
    category: 'Schedules & Clinical',
  },
  {
    id: 'EXAMS_PAPERS',
    name: 'Theory Exams, Marks & Question Bank',
    desc: 'Purges examinations, schedules, marks entries, hall tickets, and question papers.',
    icon: FileSpreadsheet,
    category: 'Evaluation',
  },
  {
    id: 'REPOSITORIES',
    name: 'Repositories & Study Files',
    desc: 'Purges uploaded study materials, digital library assets, and departmental repository files.',
    icon: Database,
    category: 'Resources',
  },
  {
    id: 'CHATS_NOTICES',
    name: 'Chats, Notifications & Notices',
    desc: 'Purges campus notices, circulars, read receipts, alerts, and batch/faculty chat messages.',
    icon: MessageSquare,
    category: 'Communication',
  },
  {
    id: 'ATTENDANCE',
    name: 'Attendance & Biometric Punches',
    desc: 'Purges daily attendance sessions, subject-wise attendance logs, and biometric in/out punches.',
    icon: Clock,
    category: 'Operational',
  },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api/v1';

export default function SuperAdminCleanDataPage() {
  const [firms, setFirms] = useState<TenantFirm[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>('srms-cet-bareilly');
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);

  // Selected Modules for Purging
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [preserveAdmin, setPreserveAdmin] = useState<boolean>(true);

  // Modal & Execution State
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [confirmInput, setConfirmInput] = useState<string>('');
  const [purging, setPurging] = useState<boolean>(false);
  const [purgeResult, setPurgeResult] = useState<{
    success: boolean;
    message: string;
    clearedBreakdown?: Record<string, number>;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // 1. Fetch available firms/tenants
  useEffect(() => {
    const fetchFirms = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(`${API_BASE}/tenants`, { headers }).catch(() => null);
        if (res && res.ok) {
          const json = await res.json();
          const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
          if (list.length > 0) {
            setFirms(list);
            if (!selectedSlug && list[0]?.slug) {
              setSelectedSlug(list[0].slug);
            }
          }
        } else {
          // Fallback tenant roster
          setFirms([
            { id: '1', title: 'SRMS CET, Bareilly', slug: 'srms-cet-bareilly', firm_mode: 'NONMED', status: 'ACTIVE' },
            { id: '2', title: 'SRMS IMS (Medical College)', slug: 'srms-ims', firm_mode: 'MED', status: 'ACTIVE' },
            { id: '3', title: 'SRMS CETR, Bareilly', slug: 'srms-cetr-bareilly', firm_mode: 'NONMED', status: 'ACTIVE' },
            { id: '4', title: 'Rajshree Medical Institute (RMRI)', slug: 'rmribar', firm_mode: 'MED', status: 'ACTIVE' },
            { id: '5', title: 'Rohilkhand Medical College', slug: 'rmch-bareilly', firm_mode: 'MED', status: 'ACTIVE' },
          ]);
        }
      } catch {
        // Fallback default
        setFirms([
          { id: '1', title: 'SRMS CET, Bareilly', slug: 'srms-cet-bareilly', firm_mode: 'NONMED', status: 'ACTIVE' },
          { id: '2', title: 'SRMS IMS (Medical College)', slug: 'srms-ims', firm_mode: 'MED', status: 'ACTIVE' },
        ]);
      }
    };
    fetchFirms();
  }, []);

  // 2. Fetch live stats for selected tenant
  const fetchTenantStats = async (slug: string) => {
    if (!slug) return;
    setStatsLoading(true);
    setErrorMsg('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const headers: Record<string, string> = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'x-tenant-slug': slug,
      };

      const res = await fetch(`${API_BASE}/tenants/${slug}/stats`, { headers }).catch(() => null);
      if (res && res.ok) {
        const json = await res.json();
        if (json.stats) {
          setStats(json.stats);
        }
      } else {
        setStats(null);
      }
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSlug) {
      fetchTenantStats(selectedSlug);
      setPurgeResult(null);
    }
  }, [selectedSlug]);

  // Handle select all toggle
  const handleToggleSelectAll = () => {
    if (selectAll) {
      setSelectedModules([]);
      setSelectAll(false);
    } else {
      setSelectedModules(CLEANABLE_MODULES.map((m) => m.id));
      setSelectAll(true);
    }
  };

  const handleToggleModule = (id: string) => {
    let next: string[];
    if (selectedModules.includes(id)) {
      next = selectedModules.filter((m) => m !== id);
    } else {
      next = [...selectedModules, id];
    }
    setSelectedModules(next);
    setSelectAll(next.length === CLEANABLE_MODULES.length);
  };

  // Execute Data Clean
  const handleExecutePurge = async () => {
    if (confirmInput.trim().toUpperCase() !== 'CLEAN DATA') {
      setErrorMsg('Please type "CLEAN DATA" exactly into the confirmation box to proceed.');
      return;
    }

    setPurging(true);
    setErrorMsg('');
    setPurgeResult(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'x-tenant-slug': selectedSlug,
      };

      const payload = {
        tenantSlug: selectedSlug,
        modules: selectAll ? ['ALL'] : selectedModules,
        preserveAdminAccount: preserveAdmin,
      };

      const res = await fetch(`${API_BASE}/tenants/clean-data`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setPurgeResult({
          success: true,
          message: json.message || 'Tenant data purged successfully.',
          clearedBreakdown: json.clearedBreakdown,
        });
        setShowConfirmModal(false);
        setConfirmInput('');
        // Refresh live stats
        fetchTenantStats(selectedSlug);
      } else {
        setErrorMsg(json.message || 'Failed to purge tenant data. Please check logs.');
      }
    } catch {
      setErrorMsg('Network error while connecting to server. Please try again.');
    } finally {
      setPurging(false);
    }
  };

  const selectedFirmObj = firms.find((f) => f.slug === selectedSlug);

  return (
    <div className="flex h-screen bg-[#F6F8FC] dark:bg-[#0B1120] text-[#1B1E28] dark:text-slate-100 overflow-hidden font-sans">
      <Sidebar role="owner" />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header title="Tenant College Data Cleaner & Fresh Reset Manager" />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-[26px] p-6 shadow-xl border border-indigo-900/50 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-2 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-black uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5" /> Super Admin / Platform Owner Console
              </div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight">
                Tenant College Data Cleaner & Reset Manager
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
                Purge dummy testing records, reset test accounts, or completely clean a college workspace so that College Administrators and Faculty receive a neat and fresh portal for original live entry.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-3 relative z-10">
              <button
                type="button"
                onClick={() => fetchTenantStats(selectedSlug)}
                disabled={statsLoading}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-xs transition-all flex items-center gap-2 border border-white/10 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Counts</span>
              </button>
            </div>
          </div>

          {/* Success Banner if Purged */}
          {purgeResult && (
            <div className="p-5 rounded-[22px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 shadow-md space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    ✓
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-emerald-950 dark:text-emerald-200">
                      College Workspace Cleaned & Prepared!
                    </h3>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      {purgeResult.message}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPurgeResult(null)}
                  className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  Dismiss
                </button>
              </div>

              {purgeResult.clearedBreakdown && Object.keys(purgeResult.clearedBreakdown).length > 0 && (
                <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {Object.entries(purgeResult.clearedBreakdown).map(([mod, count]) => (
                    <div key={mod} className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-emerald-100 dark:border-emerald-800">
                      <span className="text-[10px] text-slate-500 block truncate">{mod}</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">{count} cleared</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 1: Select Institution / College */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  1. Select College / Institution Workspace
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Choose which college tenant database you want to inspect or purge.
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Active Schema: tenant_{selectedSlug}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {firms.map((firm) => {
                const isSelected = firm.slug === selectedSlug;
                return (
                  <button
                    key={firm.id || firm.slug}
                    type="button"
                    onClick={() => setSelectedSlug(firm.slug)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#5B4BFF]/5 dark:bg-[#5B4BFF]/20 border-[#5B4BFF] shadow-sm ring-2 ring-[#5B4BFF]/30'
                        : 'bg-[#F8FAFC] dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {firm.title || firm.name || firm.slug}
                      </span>
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          firm.firm_mode === 'MED'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                            : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300'
                        }`}
                      >
                        {firm.firm_mode === 'MED' ? 'Medical' : 'Engineering / Regular'}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                      slug: {firm.slug}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Live Database Counters */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  2. Current Data Presence in "{selectedFirmObj?.title || selectedSlug}"
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Live row counts across all 12 institutional modules.
                </p>
              </div>
            </div>

            {statsLoading ? (
              <div className="py-8 flex items-center justify-center gap-2 text-slate-400 text-xs font-bold">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Reading live database tables...</span>
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-center">
                  <span className="block text-[10px] uppercase font-bold text-slate-500">Students</span>
                  <span className="text-xl font-black text-[#5B4BFF]">{stats.students}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-center">
                  <span className="block text-[10px] uppercase font-bold text-slate-500">Faculty & Staff</span>
                  <span className="text-xl font-black text-emerald-600">{stats.faculty}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-center">
                  <span className="block text-[10px] uppercase font-bold text-slate-500">Courses & Batches</span>
                  <span className="text-xl font-black text-blue-600">{(stats.courses || 0) + (stats.batches || 0)}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 text-center">
                  <span className="block text-[10px] uppercase font-bold text-slate-500">Timetable Slots</span>
                  <span className="text-xl font-black text-amber-600">{stats.timetables}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-center">
                  <span className="block text-[10px] uppercase font-bold text-slate-500">Notices & Alerts</span>
                  <span className="text-xl font-black text-rose-600">{stats.notices}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 text-center">
                  <span className="block text-[10px] uppercase font-bold text-slate-500">Projects & Incubation</span>
                  <span className="text-xl font-black text-purple-600">{(stats.projects || 0) + (stats.incubation || 0)}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500 font-medium">
                No active metrics found or schema is completely empty.
              </div>
            )}
          </div>

          {/* Step 3: Module Purge Selector */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  3. Select Modules to Clean / Delete
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Select specific modules or choose "Select All" to provide a 100% fresh, clean college workspace.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    selectAll
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {selectAll ? 'Deselect All' : 'Select All (Full Reset)'}
                </button>
              </div>
            </div>

            {/* Module Checklist Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {CLEANABLE_MODULES.map((mod) => {
                const isChecked = selectedModules.includes(mod.id);
                const Icon = mod.icon;
                return (
                  <div
                    key={mod.id}
                    onClick={() => handleToggleModule(mod.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isChecked
                        ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/80 shadow-xs'
                        : 'bg-[#F8FAFC] dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isChecked
                            ? 'bg-rose-500 text-white shadow-xs'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {mod.name}
                          </h4>
                          <span
                            className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] font-bold ${
                              isChecked
                                ? 'bg-rose-500 border-rose-500 text-white'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {isChecked ? '✓' : ''}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-1">
                          {mod.desc}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-t border-slate-200/60 dark:border-slate-800 pt-2">
                      Category: {mod.category}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Preserve Admin Checkbox */}
            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-black text-amber-950 dark:text-amber-200">
                    Preserve Institutional Admin Account
                  </h4>
                  <p className="text-[11px] text-amber-800 dark:text-amber-400 font-medium">
                    Ensures <code className="font-mono">admin@{selectedSlug}.mederp.app</code> (or existing college admin) remains active so the college team can log in immediately after reset.
                  </p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={preserveAdmin}
                onChange={(e) => setPreserveAdmin(e.target.checked)}
                className="w-5 h-5 rounded-md accent-[#5B4BFF] cursor-pointer shrink-0"
              />
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {selectedModules.length === 0
                  ? 'No modules selected'
                  : `${selectedModules.length} module(s) selected for purging`}
              </span>

              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={selectedModules.length === 0}
                className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-black text-xs transition-all shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                <span>Execute Purge on "{selectedSlug}"</span>
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* ─── CONFIRMATION MODAL ─────────────────────────────────────────── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center font-bold text-lg">
                ⚠️
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Confirm Data Deletion / College Reset
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  This action is irreversible and will delete selected records.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs space-y-2 text-rose-900 dark:text-rose-200 font-medium">
              <p>
                <strong>Target Tenant:</strong> <span className="font-mono">{selectedSlug}</span> (Schema: <span className="font-mono">tenant_{selectedSlug}</span>)
              </p>
              <p>
                <strong>Modules to Purge:</strong> {selectAll ? 'ALL (Full Reset)' : selectedModules.join(', ')}
              </p>
              <p>
                <strong>Admin Login Preservation:</strong> {preserveAdmin ? 'Enabled (Active)' : 'Disabled'}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                To confirm, type <strong className="text-rose-600 font-black">CLEAN DATA</strong> below:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="CLEAN DATA"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-black focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmInput('');
                  setErrorMsg('');
                }}
                disabled={purging}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecutePurge}
                disabled={purging || confirmInput.trim().toUpperCase() !== 'CLEAN DATA'}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition-all disabled:opacity-40 cursor-pointer shadow-md flex items-center gap-2"
              >
                {purging ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Purging Schema...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirm & Purge Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
