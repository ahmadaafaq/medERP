'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Sidebar from '../../../../../../components/Sidebar';
import Header from '../../../../../../components/Header';
import { Search, Filter } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export default function AdminNoticeReadReportPage() {
  const params = useParams();
  const noticeId = params?.noticeId as string;

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;

  // Academic Course Filter
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('ALL');

  const getTenantSlug = useCallback(() => {
    if (typeof window === 'undefined') return 'srms-cet-bareilly';
    const slug =
      localStorage.getItem('tenantSlug') ||
      localStorage.getItem('selectedTenant') ||
      localStorage.getItem('tenant') ||
      localStorage.getItem('institutionSlug') ||
      'srms-cet-bareilly';
    return (slug || 'srms-cet-bareilly').replace(/^tenant_/, '').replace(/^tenant-/, '');
  }, []);

  const getColgCd = useCallback(() => {
    const slug = getTenantSlug();
    const isMed = slug.includes('ims') || slug.includes('med');
    return isMed ? '11' : '1';
  }, [getTenantSlug]);

  const getHeaders = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const tenantSlug = getTenantSlug();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-tenant-slug': tenantSlug,
    };
  }, [getTenantSlug]);

  // Fetch Academic Courses of logged-in tenant
  const fetchCourses = useCallback(async () => {
    const colgCd = getColgCd();
    const slug = getTenantSlug();
    try {
      const res = await fetch(`/api/srms/courses?colgcd=${colgCd}&tenant=${slug}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const mapped = list.map((c: any) => ({
            code: String(c.course_cd || c.code || '1'),
            name: c.course_name || c.name || `Course ${c.course_cd}`,
            colg_cd: String(c.colg_cd || colgCd),
          }));
          setCoursesList(mapped);
          return mapped;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch courses:', err);
    }
    const fallback = [
      { code: '13', name: 'BCA', colg_cd: colgCd },
      { code: '1', name: 'B.TECH.', colg_cd: colgCd },
      { code: '4', name: 'MCA', colg_cd: colgCd },
      { code: '3', name: 'MBA', colg_cd: colgCd },
      { code: '2', name: 'B.PHARM.', colg_cd: colgCd },
    ];
    setCoursesList(fallback);
    return fallback;
  }, [getColgCd, getTenantSlug]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Fetch Read Report Data from Server
  const fetchReadReport = useCallback(async () => {
    if (!noticeId) return;
    try {
      setLoading(true);
      const slug = getTenantSlug();
      const queryParams = new URLSearchParams();
      queryParams.append('tenant', slug);

      const res = await fetch(`${API_BASE}/admin/notices/${noticeId}/read-report?${queryParams.toString()}`, {
        headers: getHeaders(),
      });

      if (res.ok) {
        const json = await res.json();
        setReportData(json.data || null);
      }
    } catch (err) {
      console.error('Failed to fetch read report:', err);
    } finally {
      setLoading(false);
    }
  }, [noticeId, getHeaders, getTenantSlug]);

  useEffect(() => {
    fetchReadReport();
  }, [fetchReadReport]);

  const notice = reportData?.notice;
  const rawRecipients: any[] = reportData?.recipients || [];

  // Multi-dimensional Student / Recipient Filtering
  const filteredRecipients = useMemo(() => {
    return rawRecipients.filter((r) => {
      // 1. Read Status Filter
      const isRead = r.is_read === true || r.is_read === 'true' || r.is_read === 1;
      if (statusFilter === 'read' && !isRead) return false;
      if (statusFilter === 'unread' && isRead) return false;

      // 2. Role Filter
      const rRole = (r.role || '').toUpperCase();
      if (roleFilter !== 'all' && rRole !== roleFilter.toUpperCase()) {
        return false;
      }

      // If user is not a student (e.g. Faculty/Clerk/Admin), skip student-specific course filter
      const isStudent = rRole === 'STUDENT';

      // 3. Course Filter
      if (selectedCourse !== 'ALL') {
        if (!isStudent) return false;
        const selectedCrsObj = coursesList.find((c) => String(c.code) === String(selectedCourse));
        const crsName = selectedCrsObj?.name ? selectedCrsObj.name.toLowerCase() : '';
        const rCrs = String(r.course_cd || '').trim();
        const rGrp = String(r.group_info || '').toLowerCase();
        const matchesCourse =
          rCrs === String(selectedCourse) ||
          (crsName && (rGrp.includes(crsName) || crsName.includes(rGrp)));
        if (!matchesCourse) return false;
      }

      // 4. Search Filter
      if (search.trim()) {
        const s = search.toLowerCase().trim();
        const matchSearch =
          (r.name || '').toLowerCase().includes(s) ||
          (r.email || '').toLowerCase().includes(s) ||
          (r.identifier || '').toLowerCase().includes(s) ||
          (r.group_info || '').toLowerCase().includes(s);
        if (!matchSearch) return false;
      }

      return true;
    });
  }, [rawRecipients, statusFilter, roleFilter, selectedCourse, search, coursesList]);

  // Computed Filtered Stats & Pagination Calculations
  const totalFiltered = filteredRecipients.length;
  const filteredRead = filteredRecipients.filter((r) => r.is_read).length;
  const filteredUnread = totalFiltered - filteredRead;
  const filteredReadRate = totalFiltered > 0 ? Math.round((filteredRead * 100) / totalFiltered) : 0;

  const totalItems = filteredRecipients.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRecipients = filteredRecipients.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset pagination to page 1 whenever any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCourse, roleFilter, statusFilter, search]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const handleResetFilters = () => {
    setSelectedCourse('ALL');
    setRoleFilter('all');
    setStatusFilter('all');
    setSearch('');
    setCurrentPage(1);
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Notices & Circulars — Read Receipts Report" />

        <main className="p-4 sm:p-6 space-y-5 flex-1">
          {/* Breadcrumbs & Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#4E5969] dark:text-slate-400">
              <Link href="/dashboard/admin" className="hover:text-orange-600 dark:hover:text-orange-400">
                Admin Dashboard
              </Link>
              <span>/</span>
              <Link href="/dashboard/admin/notices/sent" className="hover:text-orange-600 dark:hover:text-orange-400">
                Notices & Circulars
              </Link>
              <span>/</span>
              <span className="text-slate-900 dark:text-white font-black">Recipient Read Report</span>
            </div>

            <Link
              href="/dashboard/admin/notices/sent"
              className="px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 text-xs font-extrabold text-slate-800 dark:text-white shadow-soft hover:border-orange-500 transition-all self-start sm:self-auto"
            >
              ← Back to Sent Notices
            </Link>
          </div>

          {/* Notice Header Summary Card */}
          {notice && (
            <div className="bg-white dark:bg-slate-900 border border-orange-200/80 dark:border-orange-950/40 rounded-[22px] p-6 shadow-soft space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        notice.priority === 'urgent'
                          ? 'bg-rose-600 text-white'
                          : notice.priority === 'important'
                          ? 'bg-amber-400 text-amber-950 font-black'
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 font-extrabold'
                      }`}
                    >
                      {notice.priority}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {notice.category}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Published {formatDate(notice.created_at)} by <strong>{notice.creator_name}</strong> ({notice.creator_role || 'Admin'})
                    </span>
                  </div>

                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white pt-0.5">
                    {notice.title}
                  </h2>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                    Total Audience
                  </span>
                  <p className="text-2xl font-black text-orange-600 dark:text-orange-400">{notice.total_recipients} Users</p>
                </div>
              </div>

              {/* KPI Breakdown Tiles (Reflecting Current Active Filters) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-0.5">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">
                    Filtered Audience
                  </span>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{totalFiltered}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 space-y-0.5">
                  <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300">
                    Confirmed Read
                  </span>
                  <p className="text-xl font-black text-[#00C48C]">{filteredRead}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 space-y-0.5">
                  <span className="text-[10px] font-black uppercase text-rose-800 dark:text-rose-300">
                    Unopened / Pending
                  </span>
                  <p className="text-xl font-black text-[#F04438]">{filteredUnread}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/80 space-y-0.5">
                  <span className="text-[10px] font-black uppercase text-orange-800 dark:text-orange-300">
                    Read Rate %
                  </span>
                  <p className="text-xl font-black text-orange-600 dark:text-orange-400">{filteredReadRate}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Filter Bar (Course Filter, Role Filter, Status Filter & Search) */}
          <div className="bg-white dark:bg-slate-900 border border-orange-200/80 dark:border-slate-800 rounded-[22px] p-4 sm:p-5 shadow-soft space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <span className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-orange-500" />
                Filter Recipients by Course & Status
              </span>

              {(selectedCourse !== 'ALL' || roleFilter !== 'all' || statusFilter !== 'all' || search.trim()) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
                >
                  Reset All Filters
                </button>
              )}
            </div>

            {/* Filter Controls Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex-1 flex flex-wrap items-center gap-2.5">
                {/* 1. Course Selector */}
                <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-xs hover:border-orange-500/60 transition-all min-w-[200px]">
                  <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1 shrink-0">
                    <span>🎓</span> Course <span className="font-extrabold text-orange-600 dark:text-orange-400">({coursesList.length})</span>:
                  </span>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="bg-transparent text-slate-900 dark:text-white font-extrabold focus:outline-none cursor-pointer text-xs w-full truncate"
                  >
                    <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      All Courses
                    </option>
                    {coursesList.map((crs, idx) => (
                      <option key={crs.code || idx} value={crs.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        [#{crs.code}] {crs.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Role Filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="text-xs font-bold py-2 px-3 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="all">All Roles</option>
                  <option value="STUDENT">Students Only</option>
                  <option value="FACULTY">Faculty Only</option>
                  <option value="CLERK">Clerks Only</option>
                  <option value="WARDEN">Wardens Only</option>
                </select>

                {/* 3. Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="text-xs font-bold py-2 px-3 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="all">All Read Statuses</option>
                  <option value="read">Read Only (Opened)</option>
                  <option value="unread">Unread Only (Pending)</option>
                </select>

                {/* 4. Search Bar */}
                <div className="relative flex-1 min-w-[220px]">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search recipient name, roll no, emp ID..."
                    className="w-full text-xs font-semibold py-2 pl-8 pr-3 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                </div>
              </div>

              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                Showing <strong className="text-orange-600 dark:text-orange-400">{filteredRecipients.length}</strong> of {rawRecipients.length} recipients
              </span>
            </div>
          </div>

          {/* Per-Recipient Breakdown Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[22px] shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-5">Recipient</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Identifier / Roll No</th>
                    <th className="py-3.5 px-4">Academic Group / Cohort</th>
                    <th className="py-3.5 px-4">Read Status</th>
                    <th className="py-3.5 px-5 text-right">Read Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-3.5 px-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32"></div></td>
                        <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16"></div></td>
                        <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div></td>
                        <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20"></div></td>
                        <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16"></div></td>
                        <td className="py-3.5 px-5 text-right"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24 ml-auto"></div></td>
                      </tr>
                    ))
                  ) : filteredRecipients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                        <p className="text-base font-bold text-slate-900 dark:text-white">No recipients match current filters</p>
                        <p className="text-xs mt-1">Try selecting &quot;All Courses&quot; or resetting the filters above.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedRecipients.map((r, idx) => (
                      <tr key={`${r.recipient_id || r.user_id || 'rec'}_${startIndex + idx}`} className="hover:bg-orange-50/30 dark:hover:bg-slate-800/50 transition-colors">
                        {/* Recipient Name & Avatar */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-600 text-white font-black flex items-center justify-center text-xs shadow-xs">
                              {r.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900 dark:text-white">{r.name}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">{r.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                              r.role === 'STUDENT'
                                ? 'bg-orange-100 text-orange-900 dark:bg-orange-950/60 dark:text-orange-300'
                                : r.role === 'FACULTY'
                                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {r.role}
                          </span>
                        </td>

                        {/* Identifier */}
                        <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-900 dark:text-white">
                          {r.identifier}
                        </td>

                        {/* Group / Department */}
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                          {r.group_info || 'General'}
                        </td>

                        {/* Read Status */}
                        <td className="py-3.5 px-4">
                          {r.is_read ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#00C48C] border border-emerald-200 dark:border-emerald-800 text-[10px] font-black flex items-center gap-1 w-max">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#00C48C]"></span>
                              Read
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold flex items-center gap-1 w-max">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              Unread
                            </span>
                          )}
                        </td>

                        {/* Read Timestamp */}
                        <td className="py-3.5 px-5 text-right font-medium text-[11px] text-slate-500 dark:text-slate-400">
                          {r.is_read ? formatDate(r.read_at) : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer (Matching Student Master) */}
            {totalItems > 0 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <div>
                  Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} of {totalItems} records
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 disabled:opacity-50 disabled:hover:bg-white dark:disabled:hover:bg-slate-800 transition-all font-bold cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                  >
                    ← Previous
                  </button>
                  <div className="flex items-center gap-1 flex-wrap">
                    {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pg) => {
                      if (
                        totalPages <= 10 ||
                        pg === 1 ||
                        pg === totalPages ||
                        (pg >= currentPage - 2 && pg <= currentPage + 2)
                      ) {
                        return (
                          <button
                            key={pg}
                            type="button"
                            onClick={() => setCurrentPage(pg)}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all text-xs cursor-pointer font-bold ${
                              currentPage === pg
                                ? 'bg-orange-600 text-white shadow-xs'
                                : 'hover:bg-orange-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-orange-600'
                            }`}
                          >
                            {pg}
                          </button>
                        );
                      } else if (pg === currentPage - 3 || pg === currentPage + 3) {
                        return (
                          <span key={pg} className="px-1 text-slate-400">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 disabled:opacity-50 disabled:hover:bg-white dark:disabled:hover:bg-slate-800 transition-all font-bold cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
