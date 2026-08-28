'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Sidebar from '../../../../../../components/Sidebar';
import Header from '../../../../../../components/Header';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api/v1';

export default function AdminNoticeReadReportPage() {
  const params = useParams();
  const noticeId = params?.noticeId as string;

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'read' | 'unread'>('all');

  const getTenantSlug = useCallback(() => {
    if (typeof window === 'undefined') return 'srms-cet-bareilly';
    return (
      localStorage.getItem('tenantSlug') ||
      localStorage.getItem('selectedTenant') ||
      localStorage.getItem('tenant') ||
      localStorage.getItem('institutionSlug') ||
      'srms-cet-bareilly'
    );
  }, []);

  const getHeaders = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const tenantSlug = getTenantSlug();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-tenant-slug': tenantSlug,
    };
  }, [getTenantSlug]);

  const fetchReadReport = useCallback(async () => {
    if (!noticeId) return;
    try {
      setLoading(true);
      const slug = getTenantSlug();
      const queryParams = new URLSearchParams();
      queryParams.append('tenant', slug);
      if (roleFilter !== 'all') queryParams.append('role', roleFilter);
      if (search.trim()) queryParams.append('search', search.trim());

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
  }, [noticeId, roleFilter, search, getHeaders, getTenantSlug]);

  useEffect(() => {
    fetchReadReport();
  }, [fetchReadReport]);

  const notice = reportData?.notice;
  const rawRecipients: any[] = reportData?.recipients || [];

  const filteredRecipients = rawRecipients.filter((r) => {
    if (statusFilter === 'read' && !r.is_read) return false;
    if (statusFilter === 'unread' && r.is_read) return false;
    return true;
  });

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

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Notices & Circulars — Read Receipts Report" />

        <main className="p-6 space-y-6 flex-1">
          {/* Breadcrumbs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#4E5969] dark:text-slate-400">
              <Link href="/dashboard/admin" className="hover:text-[#5B4BFF]">
                Admin Dashboard
              </Link>
              <span>/</span>
              <Link href="/dashboard/admin/notices/sent" className="hover:text-[#5B4BFF]">
                Notices
              </Link>
              <span>/</span>
              <span className="text-[#1B1E28] dark:text-white">Read Receipts Report</span>
            </div>

            <Link
              href="/dashboard/admin/notices/sent"
              className="px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 text-xs font-extrabold text-[#1B1E28] dark:text-white shadow-soft hover:border-[#5B4BFF] transition-all self-start sm:self-auto"
            >
              ← Back to Sent Notices
            </Link>
          </div>

          {/* Notice Header Summary Card */}
          {notice && (
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#E7EAF3] dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        notice.priority === 'urgent'
                          ? 'bg-[#F04438] text-white'
                          : notice.priority === 'important'
                          ? 'bg-[#FFB020] text-slate-950 font-black'
                          : 'bg-indigo-50 text-[#5B4BFF] dark:bg-indigo-950'
                      }`}
                    >
                      {notice.priority}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[#4E5969] dark:text-slate-400">
                      {notice.category}
                    </span>
                    <span className="text-xs text-[#4E5969] dark:text-slate-400 font-medium">
                      Published {formatDate(notice.created_at)} by <strong>{notice.creator_name}</strong>
                    </span>
                  </div>

                  <h2 className="text-base font-black text-[#1B1E28] dark:text-white">{notice.title}</h2>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] font-black uppercase text-[#4E5969] dark:text-slate-400">
                    Target Reach
                  </span>
                  <p className="text-2xl font-black text-[#5B4BFF]">{notice.total_recipients} Users</p>
                </div>
              </div>

              {/* KPI Breakdown Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800/60 border border-[#E7EAF3] dark:border-slate-800 space-y-0.5">
                  <span className="text-[10px] font-black uppercase text-[#4E5969] dark:text-slate-400">
                    Total Targeted
                  </span>
                  <p className="text-xl font-black text-[#1B1E28] dark:text-white">{notice.total_recipients}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 space-y-0.5">
                  <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300">
                    Confirmed Read
                  </span>
                  <p className="text-xl font-black text-[#00C48C]">{notice.read_count}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 space-y-0.5">
                  <span className="text-[10px] font-black uppercase text-rose-800 dark:text-rose-300">
                    Unopened / Pending
                  </span>
                  <p className="text-xl font-black text-[#F04438]">{notice.unread_count}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 space-y-0.5">
                  <span className="text-[10px] font-black uppercase text-indigo-800 dark:text-indigo-300">
                    Read Rate %
                  </span>
                  <p className="text-xl font-black text-[#5B4BFF]">{notice.read_rate}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Filter & Search Bar */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-4 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex-1 flex flex-col sm:flex-row items-center gap-2">
              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search recipient name, roll no, emp ID..."
                  className="w-full text-xs font-semibold py-2.5 pl-8 pr-3 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                />
                <span className="absolute left-2.5 top-3 text-[#4E5969] dark:text-slate-400 text-xs">🔍</span>
              </div>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full sm:w-auto text-xs font-bold py-2.5 px-3 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
              >
                <option value="all">All Roles</option>
                <option value="STUDENT">Students Only</option>
                <option value="FACULTY">Faculty Only</option>
                <option value="CLERK">Clerks Only</option>
                <option value="WARDEN">Wardens Only</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full sm:w-auto text-xs font-bold py-2.5 px-3 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
              >
                <option value="all">All Read Statuses</option>
                <option value="read">Read Only (Opened)</option>
                <option value="unread">Unread Only (Pending)</option>
              </select>
            </div>

            <span className="text-xs font-bold text-[#4E5969] dark:text-slate-400 shrink-0">
              Showing {filteredRecipients.length} of {rawRecipients.length} recipients
            </span>
          </div>

          {/* Per-Recipient Breakdown Table */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] dark:bg-slate-800/80 text-[#4E5969] dark:text-slate-400 font-extrabold uppercase tracking-wider border-b border-[#E7EAF3] dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-5">Recipient</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Identifier / Roll No</th>
                    <th className="py-3.5 px-4">Group / Batch</th>
                    <th className="py-3.5 px-4">Read Status</th>
                    <th className="py-3.5 px-5 text-right">Read Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800 font-medium">
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
                      <td colSpan={6} className="py-10 text-center text-[#4E5969] dark:text-slate-400 font-bold">
                        No matching recipients found for current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRecipients.map((r) => (
                      <tr key={r.recipient_id} className="hover:bg-[#F6F8FC] dark:hover:bg-slate-800/50 transition-colors">
                        {/* Recipient Name & Avatar */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5B4BFF] to-indigo-600 text-white font-black flex items-center justify-center text-xs shadow-xs">
                              {r.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="font-extrabold text-[#1B1E28] dark:text-white">{r.name}</p>
                              <p className="text-[10px] text-[#4E5969] dark:text-slate-400">{r.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                              r.role === 'STUDENT'
                                ? 'bg-indigo-50 text-[#5B4BFF] dark:bg-indigo-950'
                                : r.role === 'FACULTY'
                                ? 'bg-amber-50 text-amber-800 dark:bg-amber-950'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {r.role}
                          </span>
                        </td>

                        {/* Identifier */}
                        <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#1B1E28] dark:text-white">
                          {r.identifier}
                        </td>

                        {/* Group / Department */}
                        <td className="py-3.5 px-4 text-[#4E5969] dark:text-slate-300 font-medium">
                          {r.group_info}
                        </td>

                        {/* Read Status */}
                        <td className="py-3.5 px-4">
                          {r.is_read ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#00C48C] border border-emerald-200 dark:border-emerald-800 text-[10px] font-black flex items-center gap-1 w-max">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#00C48C]"></span>
                              Read
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[#4E5969] dark:text-slate-400 text-[10px] font-bold flex items-center gap-1 w-max">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              Unread
                            </span>
                          )}
                        </td>

                        {/* Read Timestamp */}
                        <td className="py-3.5 px-5 text-right font-medium text-[11px] text-[#4E5969] dark:text-slate-400">
                          {r.is_read ? formatDate(r.read_at) : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
