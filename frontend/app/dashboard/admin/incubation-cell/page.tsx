'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import { 
  Rocket, 
  Search, 
  Filter, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Award, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Building2, 
  GraduationCap, 
  Layers, 
  Calendar, 
  User, 
  DollarSign, 
  Sparkles,
  Github,
  Loader2,
  XCircle,
  Share2
} from 'lucide-react';

interface IncubationProject {
  id: number;
  repoId: number;
  title: string;
  description: string;
  image: string;
  screenshots: string[];
  repoLink: string;
  techStack: string[];
  percentage: number;
  score: number;
  grade: string;
  incubationStatus: 'Under Review' | 'Selected' | 'Funded' | 'Incubated' | 'Rejected' | string;
  incubationNotes?: string;
  fundingAmount?: number;
  mentorAssigned?: string;
  isPlacementEligible?: boolean;
  studentName: string;
  studentRegNo: string;
  studentPhoto?: string;
  rollNo: string;
  collegeName: string;
  courseName: string;
  branchName: string;
  batchName: string;
  submittedAt: string;
  facultyName?: string;
  facultyPhoto?: string;
  facultyDesignation?: string;
  facultyRemarks?: string;
  facultyReviewedAt?: string;
}

interface DropdownItem {
  id: string;
  code: string;
  name: string;
  colg_cd?: string;
  course_cd?: string;
  batch_cd?: string;
}

export default function IncubationCellPage() {
  const [userRole, setUserRole] = useState<string>('ADMIN');

  // Filters State
  const [selectedCollege, setSelectedCollege] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Metadata for cascading filters
  const [metaColleges, setMetaColleges] = useState<DropdownItem[]>([]);
  const [metaCourses, setMetaCourses] = useState<DropdownItem[]>([]);
  const [metaBranches, setMetaBranches] = useState<DropdownItem[]>([]);
  const [metaBatches, setMetaBatches] = useState<DropdownItem[]>([]);
  const [metaLoading, setMetaLoading] = useState<boolean>(true);

  // Projects State
  const [projects, setProjects] = useState<IncubationProject[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [expandedRowIds, setExpandedRowIds] = useState<number[]>([]);

  // Update Status Modal State
  const [editingProject, setEditingProject] = useState<IncubationProject | null>(null);
  const [newStatus, setNewStatus] = useState<string>('Selected');
  const [newNotes, setNewNotes] = useState<string>('');
  const [newFunding, setNewFunding] = useState<string>('');
  const [newMentor, setNewMentor] = useState<string>('');
  const [updating, setUpdating] = useState<boolean>(false);
  const [modalMsg, setModalMsg] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Fetch Metadata on Load
  useEffect(() => {
    fetchMeta();
  }, []);

  const getTenantSlug = () => {
    return typeof window !== 'undefined'
      ? (localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly').replace(/^tenant_/, '').replace(/^tenant-/, '')
      : 'srms-cet-bareilly';
  };

  const getHeaders = () => {
    const slug = getTenantSlug();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'x-tenant-id': `tenant_${slug}`,
      'x-tenant': slug,
      'x-tenant-slug': slug,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // Fetch Courses for College
  const fetchCourses = async (colgcd: string) => {
    const cd = colgcd || '1';
    const slug = getTenantSlug();
    try {
      const res = await fetch(`/api/srms/courses?colgcd=${cd}&tenant=${slug}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const mapped = list.map((c: any) => ({
            id: String(c.course_cd || c.code || '1'),
            code: String(c.course_cd || c.code || '1'),
            name: c.course_name || c.name || `Course ${c.course_cd}`,
            colg_cd: String(c.colg_cd || cd),
          }));
          setMetaCourses(mapped);
          return mapped;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch courses:', err);
    }
    return [];
  };

  // Fetch Branches for Course
  const fetchBranches = async (colgcd: string, coursecd: string) => {
    const cd = colgcd || '1';
    const crs = coursecd || '';
    const slug = getTenantSlug();
    if (!crs) {
      setMetaBranches([]);
      return [];
    }
    try {
      const res = await fetch(`/api/srms/branches?colgcd=${cd}&coursecd=${crs}&tenant=${slug}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const mapped = list.map((b: any) => ({
            id: String(b.branch_cd || b.code || '1'),
            code: String(b.branch_cd || b.code || '1'),
            name: b.branch_name || b.name || `Branch ${b.branch_cd}`,
            course_cd: String(b.course_cd || crs),
            colg_cd: String(b.colg_cd || cd),
          }));
          setMetaBranches(mapped);
          return mapped;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch branches:', err);
    }
    setMetaBranches([]);
    return [];
  };

  // Fetch Batches for Course & Branch
  const fetchBatches = async (colgcd: string, coursecd: string, branchcd: string = '') => {
    const cd = colgcd || '1';
    const crs = coursecd || '';
    const slug = getTenantSlug();
    if (!crs) {
      setMetaBatches([]);
      return [];
    }
    try {
      const brParam = branchcd ? `&branchcd=${branchcd}` : '';
      const res = await fetch(`/api/srms/batches?colgcd=${cd}&coursecd=${crs}${brParam}&tenant=${slug}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const mapped = list.map((b: any) => ({
            id: String(b.batch_cd || b.code || b.batch_name || '1'),
            code: String(b.batch_cd || b.code || b.batch_name || '1'),
            name: String(b.batch_name || b.name || b.year || b.batch_cd),
            course_cd: String(b.course_cd || crs),
            colg_cd: String(b.colg_cd || cd),
          }));
          setMetaBatches(mapped);
          return mapped;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch batches:', err);
    }
    setMetaBatches([]);
    return [];
  };

  const fetchMeta = async () => {
    setMetaLoading(true);
    try {
      const slug = getTenantSlug();
      const role = (typeof window !== 'undefined' ? (localStorage.getItem('role') || 'ADMIN') : 'ADMIN').toUpperCase();
      const userColg = typeof window !== 'undefined' ? (localStorage.getItem('colg_cd') || localStorage.getItem('colgCd') || '1') : '1';
      const tenantName = typeof window !== 'undefined' 
        ? (localStorage.getItem('tenantName') || localStorage.getItem('selectedTenantName') || localStorage.getItem('college_name') || localStorage.getItem('collegeName') || '')
        : '';
      setUserRole(role);

      const activeColCode = userColg || '1';
      const defaultCollege = {
        id: activeColCode,
        code: activeColCode,
        name: tenantName || 'SRMS College of Engineering & Technology, Bareilly',
        slug: slug,
      };

      setMetaColleges([defaultCollege]);
      setSelectedCollege(activeColCode);

      // Load initial courses for this college
      await fetchCourses(activeColCode);
    } catch (e) {
      console.error('Failed to load incubation metadata:', e);
    } finally {
      setMetaLoading(false);
    }
  };

  // Handle Cascading Filter Changes
  const handleCollegeChange = async (colgId: string) => {
    setSelectedCollege(colgId);
    setSelectedCourse('');
    setSelectedBranch('');
    setSelectedBatch('');
    await fetchCourses(colgId);
  };

  const handleCourseChange = async (courseId: string) => {
    setSelectedCourse(courseId);
    setSelectedBranch('');
    setSelectedBatch('');
    if (courseId) {
      await Promise.all([
        fetchBranches(selectedCollege, courseId),
        fetchBatches(selectedCollege, courseId),
      ]);
    } else {
      setMetaBranches([]);
      setMetaBatches([]);
    }
  };

  const handleBranchChange = async (branchId: string) => {
    setSelectedBranch(branchId);
    setSelectedBatch('');
    if (selectedCourse) {
      await fetchBatches(selectedCollege, selectedCourse, branchId);
    }
  };

  const handleBatchChange = (batchId: string) => {
    setSelectedBatch(batchId);
  };

  const handleResetFilters = () => {
    if (userRole === 'SUPER_ADMIN') {
      setSelectedCollege('');
    }
    setSelectedCourse('');
    setSelectedBranch('');
    setSelectedBatch('');
    setStatusFilter('');
    setSearchQuery('');
    setMetaBranches([]);
    setMetaBatches([]);
  };

  // Fetch Projects when filters change or on initial mount
  useEffect(() => {
    fetchProjects();
  }, [selectedCollege, selectedCourse, selectedBranch, selectedBatch, statusFilter]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const slug = getTenantSlug();
      const params = new URLSearchParams();
      params.append('tenant', slug);
      if (selectedCollege && selectedCollege !== 'all') params.append('collegeId', selectedCollege);
      if (selectedCourse && selectedCourse !== 'all') params.append('courseId', selectedCourse);
      if (selectedBranch && selectedBranch !== 'all') params.append('branchId', selectedBranch);
      if (selectedBatch && selectedBatch !== 'all') params.append('batchId', selectedBatch);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      params.append('minScore', '70'); // Strict 70%+ threshold for Incubation Cell

      const res = await fetch(`/api/incubation-cell/projects?${params.toString()}`, {
        headers: getHeaders(),
      });

      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
        setProjects(list);
      }
    } catch (e) {
      console.error('Failed to fetch incubation projects:', e);
    } finally {
      setLoading(false);
    }
  };

  // Toggle row expansion (multiple rows can be open independently)
  const toggleRow = (id: number) => {
    setExpandedRowIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const isExpanded = (id: number) => expandedRowIds.includes(id);

  // Status Badge Styling Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Funded':
        return {
          label: 'Funded 💰',
          class: 'bg-emerald-50 text-[#00C48C] border-[#00C48C]/30 dark:bg-emerald-950/40 dark:text-emerald-300 font-extrabold',
        };
      case 'Incubated':
        return {
          label: 'Incubated 🚀',
          class: 'bg-orange-50 text-[#F36C21] border-[#F36C21]/30 dark:bg-orange-950/40 dark:text-orange-300 font-black',
        };
      case 'Selected':
        return {
          label: 'Selected 🌟',
          class: 'bg-amber-50 text-[#F36C21] border-[#F36C21]/30 dark:bg-orange-950/40 dark:text-orange-300 font-extrabold',
        };
      case 'Rejected':
        return {
          label: 'Rejected',
          class: 'bg-rose-50 text-[#E4483A] border-[#E4483A]/30 dark:bg-rose-950/40 dark:text-rose-300',
        };
      case 'Under Review':
      default:
        return {
          label: 'Under Review',
          class: 'bg-slate-100 text-[#4E5969] border-slate-200 dark:bg-slate-800 dark:text-slate-300',
        };
    }
  };

  // Open Status Edit Modal
  const openEditModal = (proj: IncubationProject) => {
    setEditingProject(proj);
    setNewStatus(proj.incubationStatus || 'Selected');
    setNewNotes(proj.incubationNotes || '');
    setNewFunding(proj.fundingAmount && proj.fundingAmount > 0 ? String(proj.fundingAmount) : '');
    setNewMentor(proj.mentorAssigned || '');
    setModalMsg('');
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    setUpdating(true);
    setModalMsg('');
    try {
      const slug = getTenantSlug();
      const res = await fetch(`/api/incubation-cell/projects/${editingProject.id}/status?tenant=${slug}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(),
        },
        body: JSON.stringify({
          status: newStatus,
          incubation_notes: newNotes,
          funding_amount: newFunding ? Number(newFunding) : 0,
          mentor_assigned: newMentor,
          tenant: slug,
        }),
      });

      if (res.ok) {
        setEditingProject(null);
        fetchProjects();
      } else {
        const errJson = await res.json();
        setModalMsg(errJson.message || 'Failed to update incubation status.');
      }
    } catch (e) {
      setModalMsg('Network error while updating incubation status.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <Header title="Incubation Cell & Venture Accelerator — MedERP" />
        <main className="p-5 sm:p-7 space-y-6 flex-1 w-full max-w-full">

          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#11141A] via-[#1E2638] to-[#11141A] border border-slate-800 rounded-[22px] p-6 text-white shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-black uppercase tracking-wider text-orange-300">
                <Rocket className="w-3.5 h-3.5 text-[#F0742C]" />
                <span>Institutional Startup & Incubation Pipeline</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight">
                Student Venture Incubation Cell
              </h1>
              <p className="text-xs text-indigo-100 font-medium max-w-2xl">
                Repository projects graded <span className="font-black text-amber-300">70%+</span> by faculty are automatically screened here for University Seed Funding, Venture Incubation, and Corporate Industry Partnerships.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-center px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
                <div className="text-xl font-black text-white">{projects.length}</div>
                <div className="text-[10px] text-indigo-200 uppercase font-bold tracking-wider">Filtered Projects</div>
              </div>
            </div>
          </div>

          {/* Horizontal Cascading Filter Bar */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-5 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#F36C21]" />
                <h2 className="text-xs font-black text-[#1B1E28] dark:text-white uppercase tracking-wider">
                  Academic Hierarchy Filters
                </h2>
              </div>

              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-bold text-[#F36C21] hover:text-orange-600 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset filters</span>
              </button>
            </div>

            {/* 4 Cascading Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              
              {/* 1. College Dropdown — Locked for Non-SuperAdmins */}
              <div>
                <label className="block text-[11px] font-bold text-[#4E5969] dark:text-slate-400 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#F36C21]" />
                    <span>1. College / Institute *</span>
                  </span>
                  {userRole !== 'SUPER_ADMIN' && (
                    <span className="text-[10px] bg-orange-50 dark:bg-orange-950/60 text-[#F36C21] font-black px-1.5 py-0.5 rounded border border-orange-200 dark:border-orange-800/60 shrink-0 inline-flex items-center gap-1">
                      🔒 Locked
                    </span>
                  )}
                </label>
                <select
                  value={selectedCollege}
                  disabled={userRole !== 'SUPER_ADMIN'}
                  onChange={(e) => handleCollegeChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F36C21] disabled:opacity-90 disabled:cursor-not-allowed cursor-pointer"
                >
                  {userRole === 'SUPER_ADMIN' && <option value="">Select College</option>}
                  {metaColleges.map((c) => (
                    <option key={c.id || c.code} value={c.code || c.id}>
                      {c.code && !isNaN(Number(c.code)) ? `[#${c.code}] ${c.name}` : c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Course Dropdown (Cascading) */}
              <div>
                <label className="block text-[11px] font-bold text-[#4E5969] dark:text-slate-400 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-[#F36C21]" />
                    <span>2. Course</span>
                  </span>
                  {metaCourses.length > 0 && (
                    <span className="text-[10px] font-extrabold text-[#F36C21]">
                      ({metaCourses.length})
                    </span>
                  )}
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F36C21] cursor-pointer"
                >
                  <option value="">All Courses</option>
                  {metaCourses.map((c) => (
                    <option key={c.id || c.code} value={c.code || c.id}>
                      {c.code && !isNaN(Number(c.code)) ? `[#${c.code}] ${c.name}` : c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Branch Dropdown (Cascading) */}
              <div>
                <label className="block text-[11px] font-bold text-[#4E5969] dark:text-slate-400 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-[#F36C21]" />
                    <span>3. Branch / Department</span>
                  </span>
                  {metaBranches.length > 0 && (
                    <span className="text-[10px] font-extrabold text-[#F36C21]">
                      ({metaBranches.length})
                    </span>
                  )}
                </label>
                <select
                  value={selectedBranch}
                  disabled={!selectedCourse}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F36C21] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  <option value="">{selectedCourse ? 'All Branches' : 'Select Course first'}</option>
                  {metaBranches.map((b) => (
                    <option key={b.id || b.code} value={b.code || b.id}>
                      {b.code && !isNaN(Number(b.code)) ? `[#${b.code}] ${b.name}` : b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Batch Dropdown (Cascading) */}
              <div>
                <label className="block text-[11px] font-bold text-[#4E5969] dark:text-slate-400 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#F36C21]" />
                    <span>4. Batch</span>
                  </span>
                  {metaBatches.length > 0 && (
                    <span className="text-[10px] font-extrabold text-[#F36C21]">
                      ({metaBatches.length})
                    </span>
                  )}
                </label>
                <select
                  value={selectedBatch}
                  disabled={!selectedCourse}
                  onChange={(e) => handleBatchChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F36C21] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  <option value="">{selectedCourse ? 'All Batches' : 'Select Course first'}</option>
                  {metaBatches.map((b) => (
                    <option key={b.id || b.code} value={b.code || b.id}>
                      {b.code && !isNaN(Number(b.code)) ? `[#${b.code}] ` : ''}Batch {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Secondary Search & Incubation Status Quick Filter */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchProjects()}
                  placeholder="Search project title, tech stack, or student..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#F36C21]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <span className="text-[11px] font-bold text-[#4E5969] dark:text-slate-400 shrink-0">
                  Status:
                </span>
                {['', 'Under Review', 'Selected', 'Funded', 'Incubated', 'Rejected'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      statusFilter === st
                        ? 'bg-[#F36C21] text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-[#4E5969] dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {st === '' ? 'All' : st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Area */}
          {!selectedCollege ? (
            /* Disabled Empty State */
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-16 text-center space-y-3 shadow-soft">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#F36C21] flex items-center justify-center mx-auto shadow-inner">
                <Filter className="w-8 h-8 opacity-60" />
              </div>
              <h3 className="text-lg font-black text-[#1B1E28] dark:text-white">
                Select filters to view incubated projects
              </h3>
              <p className="text-xs text-[#4E5969] dark:text-slate-400 max-w-md mx-auto font-medium">
                Choose at least a College from the top filter bar to populate available courses, branches, and screened incubation projects.
              </p>
            </div>
          ) : loading ? (
            /* Loading Skeleton */
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-8 shadow-soft space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 text-[#F36C21] animate-spin" />
                <span className="text-xs font-bold text-[#4E5969]">Loading incubation candidate projects...</span>
              </div>
              <div className="space-y-3 pt-2">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
                ))}
              </div>
            </div>
          ) : projects.length === 0 ? (
            /* Empty State */
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-16 text-center space-y-3 shadow-soft">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#F36C21] flex items-center justify-center mx-auto">
                <Rocket className="w-8 h-8 opacity-60" />
              </div>
              <h3 className="text-lg font-black text-[#1B1E28] dark:text-white">
                No projects match these filters
              </h3>
              <p className="text-xs text-[#4E5969] dark:text-slate-400 max-w-md mx-auto">
                No repository projects reached the 70% threshold under the chosen college, course, or branch criteria. Try resetting filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#F36C21] text-white hover:bg-[#E05B10] transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            </div>
          ) : (
            /* Results Table */
            <div className="space-y-3">
              {/* Result Count Banner */}
              <div className="flex items-center justify-between px-1">
                <div className="text-xs font-extrabold text-[#1B1E28] dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#F0742C]" />
                  <span>{projects.length} {projects.length === 1 ? 'project' : 'projects'} found in Incubation Cell</span>
                </div>
                <div className="text-[11px] font-bold text-slate-400">
                  Multiple rows can be expanded independently
                </div>
              </div>

              {/* Table */}
              <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#F6F8FC] dark:bg-slate-800/80 border-b border-[#E7EAF3] dark:border-slate-800 text-[#4E5969] dark:text-slate-400 font-black uppercase tracking-wider text-[11px]">
                        <th className="py-4 px-4 w-20 text-center">Thumbnail</th>
                        <th className="py-4 px-4">Student & Project</th>
                        <th className="py-4 px-4">Hierarchy</th>
                        <th className="py-4 px-4">Faculty Score</th>
                        <th className="py-4 px-4">Incubation Status</th>
                        <th className="py-4 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800 font-medium">
                      {projects.map((proj) => {
                        const expanded = isExpanded(proj.id);
                        const statusMeta = getStatusBadge(proj.incubationStatus);

                        return (
                          <React.Fragment key={proj.id}>
                            <tr
                              className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                                expanded ? 'bg-orange-50/30 dark:bg-orange-950/20' : ''
                              }`}
                            >
                              {/* 1. Thumbnail Image */}
                              <td className="py-3.5 px-4 text-center">
                                <div 
                                  onClick={() => setPreviewImage({ url: proj.image, title: proj.title })}
                                  className="w-16 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mx-auto shadow-xs shrink-0 cursor-pointer hover:opacity-90 relative group/thumb"
                                >
                                  <img
                                    src={proj.image}
                                    alt={proj.title}
                                    className="w-full h-full object-cover"
                                    onError={(e: any) => {
                                      e.target.src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80';
                                    }}
                                  />
                                </div>
                              </td>

                              {/* 2. Student & Project Title */}
                              <td className="py-3.5 px-4 max-w-sm">
                                <div className="flex items-start gap-3">
                                  <img
                                    src={proj.studentPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(proj.studentName || 'Student')}&background=F36C21&color=fff&bold=true`}
                                    alt={proj.studentName}
                                    className="w-10 h-10 rounded-xl object-cover border border-orange-200 shrink-0 mt-0.5 shadow-sm"
                                    onError={(e: any) => {
                                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(proj.studentName)}&background=F36C21&color=fff&bold=true`;
                                    }}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="font-extrabold text-[#1B1E28] dark:text-white text-[13px] line-clamp-1">
                                      {proj.title}
                                    </div>
                                    <div className="text-[11px] font-bold text-[#F36C21] truncate mt-0.5">
                                      {proj.studentName}
                                      <span className="font-mono text-slate-400 font-medium text-[10px] ml-1">
                                        ({proj.studentRegNo})
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5 truncate">
                                      <span className="font-bold text-[#F36C21]">{proj.courseName}</span>
                                      <span>•</span>
                                      <span className="text-slate-400">{proj.batchName}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* 3. Hierarchy */}
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-[#1B1E28] dark:text-slate-200 text-xs">
                                  {proj.branchName}
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium line-clamp-1">
                                  {proj.collegeName}
                                </div>
                              </td>

                              {/* 4. Score & Faculty Evaluator */}
                              <td className="py-3.5 px-4">
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <div className="text-sm font-black text-[#F36C21]">
                                      {proj.percentage}%
                                    </div>
                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-orange-50 dark:bg-orange-950/40 text-[#F36C21] border border-[#F36C21]/30">
                                      Grade {proj.grade}
                                    </span>
                                  </div>

                                  {/* Faculty Evaluator Profile */}
                                  <div className="flex items-center gap-2 pt-0.5">
                                    <img
                                      src={proj.facultyPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(proj.facultyName || 'Faculty')}&background=F36C21&color=fff&bold=true`}
                                      alt={proj.facultyName || 'Faculty'}
                                      className="w-6 h-6 rounded-full object-cover border border-orange-200 shrink-0"
                                      onError={(e: any) => {
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(proj.facultyName || 'Faculty')}&background=F36C21&color=fff&bold=true`;
                                      }}
                                    />
                                    <div className="min-w-0">
                                      <div className="text-[11px] font-bold text-[#1B1E28] dark:text-slate-200 truncate">
                                        {proj.facultyName || 'Faculty Evaluator'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* 5. Incubation Status Badge */}
                              <td className="py-3.5 px-4">
                                <span className={`px-2.5 py-1 rounded-full text-[11px] border flex items-center gap-1 w-fit ${statusMeta.class}`}>
                                  {statusMeta.label}
                                </span>
                                {proj.fundingAmount ? (
                                  <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
                                    Grant: ₹{proj.fundingAmount.toLocaleString('en-IN')}
                                  </span>
                                ) : null}
                              </td>

                              {/* 6. Actions */}
                              <td className="py-3.5 px-4 text-right space-x-2">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(proj)}
                                  className="px-3 py-1.5 rounded-xl font-bold text-xs bg-[#F36C21] hover:bg-[#E05A12] text-white shadow-xs shadow-orange-500/20 transition-all cursor-pointer inline-flex items-center gap-1 active:scale-95"
                                >
                                  <span>Transfer / Update 🚀</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => toggleRow(proj.id)}
                                  className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer inline-flex items-center justify-center align-middle"
                                  title={expanded ? 'Collapse Details' : 'Expand Details'}
                                >
                                  {expanded ? (
                                    <ChevronUp className="w-4 h-4 text-[#F36C21]" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </button>
                              </td>
                            </tr>

                            {/* Expandable Row Content */}
                            {expanded && (
                              <tr className="bg-slate-50/80 dark:bg-slate-800/30 border-b border-[#E7EAF3] dark:border-slate-800">
                                <td colSpan={6} className="p-5 sm:p-6 space-y-4 animate-in fade-in duration-150">
                                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                    
                                    {/* Left: Screenshots / Thumbnail Preview Gallery */}
                                    <div className="space-y-2">
                                      <div className="text-xs font-black text-[#1B1E28] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                        <span>Project Media & Screenshots</span>
                                      </div>
                                      <div className="rounded-2xl overflow-hidden border border-[#E7EAF3] dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm aspect-video">
                                        <img
                                          src={proj.screenshots[0] || proj.image}
                                          alt={proj.title}
                                          className="w-full h-full object-cover"
                                          onError={(e: any) => {
                                            e.target.src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80';
                                          }}
                                        />
                                      </div>
                                      {proj.screenshots.length > 1 && (
                                        <div className="flex gap-2 overflow-x-auto pb-1">
                                          {proj.screenshots.map((s, idx) => (
                                            <img
                                              key={idx}
                                              src={s}
                                              alt={`Screenshot ${idx + 1}`}
                                              className="w-16 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                                            />
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    {/* Middle: Problem Statement, Description & Tech Stack */}
                                    <div className="space-y-3 lg:col-span-2">
                                      <div>
                                        <div className="text-xs font-black text-[#1B1E28] dark:text-white uppercase tracking-wider mb-1">
                                          Problem Statement & Architecture Description
                                        </div>
                                        <p className="text-xs text-[#4E5969] dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-[#E7EAF3] dark:border-slate-700">
                                          {proj.description || 'No description provided by candidate.'}
                                        </p>
                                      </div>

                                      {/* Tech Stack Chips */}
                                      <div>
                                        <div className="text-xs font-black text-[#1B1E28] dark:text-white uppercase tracking-wider mb-1.5">
                                          Technology Stack
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                          {proj.techStack.map((tech, idx) => (
                                            <span
                                              key={idx}
                                              className="px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold bg-orange-50/50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/40 text-[#F36C21]"
                                            >
                                              {tech}
                                            </span>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Repository Link & Faculty Notes */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 space-y-1">
                                          <div className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                            <Github className="w-3.5 h-3.5" />
                                            <span>Repository Link</span>
                                          </div>
                                          <a
                                            href={proj.repoLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs font-bold text-[#F36C21] hover:underline flex items-center gap-1 truncate"
                                          >
                                            <span className="truncate">{proj.repoLink}</span>
                                            <ExternalLink className="w-3 h-3 shrink-0" />
                                          </a>
                                        </div>

                                        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 space-y-1">
                                          <div className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                            <Award className="w-3.5 h-3.5 text-[#F36C21]" />
                                            <span>Faculty Evaluator Feedback</span>
                                          </div>
                                          <p className="text-xs text-[#4E5969] dark:text-slate-300 font-medium italic">
                                            "{proj.facultyRemarks}"
                                          </p>
                                          {proj.facultyName && (
                                            <div className="text-[10px] text-slate-400 font-semibold">
                                              — {proj.facultyName}
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Incubation Notes / Funding Info */}
                                      {(proj.incubationNotes || proj.mentorAssigned) && (
                                        <div className="p-3.5 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-[#F36C21]/30 text-[#F36C21] space-y-1">
                                          <div className="font-black flex items-center gap-1.5 text-orange-950 dark:text-orange-200">
                                            <Rocket className="w-3.5 h-3.5 text-[#F36C21]" />
                                            <span>Incubation Cell Directive & Future Plan</span>
                                          </div>
                                          {proj.incubationNotes && (
                                            <p className="text-orange-900 dark:text-orange-300 font-medium">
                                              {proj.incubationNotes}
                                            </p>
                                          )}
                                          {proj.mentorAssigned && (
                                            <div className="text-[11px] font-bold text-orange-950 dark:text-orange-200">
                                              Assigned Innovation Mentor: {proj.mentorAssigned}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Transfer & Update Incubation Status Modal */}
          {editingProject && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#F36C21]">
                      <Rocket className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-[#1B1E28] dark:text-white">
                        Incubation Cell Evaluation
                      </h3>
                      <p className="text-xs text-[#F36C21] font-bold">
                        {editingProject.title} ({editingProject.studentName})
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingProject(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                {modalMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-[#E4483A] font-bold">
                    {modalMsg}
                  </div>
                )}

                <form onSubmit={handleSaveStatus} className="space-y-4">
                  {/* Status Selection */}
                  <div>
                    <label className="block text-xs font-bold text-[#1B1E28] dark:text-slate-200 mb-1.5">
                      Incubation Status *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { val: 'Under Review', label: 'Under Review', color: 'border-slate-300' },
                        { val: 'Selected', label: '🌟 Selected', color: 'border-[#F36C21]' },
                        { val: 'Funded', label: '💰 Funded', color: 'border-emerald-500' },
                        { val: 'Incubated', label: '🚀 Incubated', color: 'border-[#F36C21]' },
                        { val: 'Rejected', label: '🔴 Rejected', color: 'border-[#E4483A]' },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setNewStatus(item.val)}
                          className={`py-2 px-3 rounded-xl text-xs font-black border transition-all cursor-pointer text-center ${
                            newStatus === item.val
                              ? 'bg-[#F36C21] text-white border-[#F36C21] shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-800 text-[#4E5969] dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Seed Funding / Grant Amount */}
                  <div>
                    <label className="block text-xs font-bold text-[#1B1E28] dark:text-slate-200 mb-1">
                      Seed Grant / Innovation Fund Amount (₹ INR)
                    </label>
                    <div className="relative">
                      <span className="text-slate-500 dark:text-slate-400 font-extrabold absolute left-3.5 top-1/2 -translate-y-1/2 text-sm select-none">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="5000"
                        value={newFunding}
                        onChange={(e) => setNewFunding(e.target.value)}
                        placeholder="0"
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-bold text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F36C21]"
                      />
                    </div>
                  </div>

                  {/* Assigned Mentor */}
                  <div>
                    <label className="block text-xs font-bold text-[#1B1E28] dark:text-slate-200 mb-1">
                      Assigned Innovation Mentor / Industry Lead
                    </label>
                    <input
                      type="text"
                      value={newMentor}
                      onChange={(e) => setNewMentor(e.target.value)}
                      placeholder="e.g. Dr. R. K. Sharma (Innovation Cell Head)"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-medium text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F36C21]"
                    />
                  </div>

                  {/* Incubation Notes */}
                  <div>
                    <label className="block text-xs font-bold text-[#1B1E28] dark:text-slate-200 mb-1">
                      Incubation Directives, Future Roadmap & Notes
                    </label>
                    <textarea
                      rows={3}
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="Specify next milestones, angel investor demo dates, patent filing guidance..."
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-medium text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F36C21]"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E7EAF3] dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditingProject(null)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-[#4E5969] hover:bg-slate-100 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="px-5 py-2 rounded-xl text-xs font-black bg-[#F36C21] hover:bg-[#E05A12] text-white shadow-md shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                    >
                      {updating ? 'Saving...' : 'Save & Publish Directives 🚀'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {/* Screenshot Lightbox Modal */}
          {previewImage && (
            <div 
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setPreviewImage(null)}
            >
              <div 
                className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl space-y-3 p-4 border border-slate-200 dark:border-slate-800"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="text-sm font-black text-[#1B1E28] dark:text-white">{previewImage.title}</h4>
                  <button
                    type="button"
                    onClick={() => setPreviewImage(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-[75vh] overflow-auto rounded-xl">
                  <img
                    src={previewImage.url}
                    alt={previewImage.title}
                    className="w-full h-auto object-contain rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
