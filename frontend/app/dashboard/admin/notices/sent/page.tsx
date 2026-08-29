'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Sidebar from '../../../../../components/Sidebar';
import Header from '../../../../../components/Header';
import NoticeDetailModal from '../../../../../components/notices/NoticeDetailModal';
import { NoticeItem } from '../../../../../hooks/useNotices';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export default function AdminSentNoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

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

  const fetchAdminNotices = useCallback(async () => {
    try {
      setLoading(true);
      const slug = getTenantSlug();
      const params = new URLSearchParams();
      params.append('tenant', slug);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await fetch(`${API_BASE}/admin/notices?${params.toString()}`, {
        headers: getHeaders(),
      });

      if (res.ok) {
        const json = await res.json();
        const list = json.data || json || [];
        setNotices(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error('Failed to fetch admin notices:', err);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, search, getHeaders, getTenantSlug]);

  useEffect(() => {
    fetchAdminNotices();
  }, [fetchAdminNotices]);

  const handleDeleteNotice = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete notice: "${title}"?`)) return;
    try {
      const slug = getTenantSlug();
      const res = await fetch(`${API_BASE}/admin/notices/${id}?tenant=${slug}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        setNotices((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete notice');
    }
  };

  const filteredNotices = notices.filter((n) => {
    if (priorityFilter !== 'all' && n.priority !== priorityFilter) return false;
    return true;
  });

  // Calculate Summary KPI Stats
  const totalSent = notices.length;
  const totalRecipients = notices.reduce((acc, n) => acc + (n.total_recipients || 0), 0);
  const totalRead = notices.reduce((acc, n) => acc + (n.read_count || 0), 0);
  const avgReadRate = totalRecipients > 0 ? Math.round((totalRead * 100) / totalRecipients) : 0;
  const urgentCount = notices.filter((n) => n.priority === 'urgent').length;

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
        <Header title="Notices & Circulars — Sent History" />

        <main className="p-6 space-y-6 flex-1">
          {/* Breadcrumb Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#4E5969] dark:text-slate-400">
              <Link href="/dashboard/admin" className="hover:text-[#5B4BFF]">
                Admin Dashboard
              </Link>
              <span>/</span>
              <span className="text-[#1B1E28] dark:text-white">Sent Notices & Read Analytics</span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/admin/notices/groups"
                className="px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 text-xs font-extrabold text-[#1B1E28] dark:text-white shadow-soft hover:border-[#5B4BFF] transition-all"
              >
                👥 Manage Target Groups
              </Link>
              <Link
                href="/dashboard/admin/notices/compose"
                className="px-5 py-2 rounded-full bg-gradient-to-r from-[#5B4BFF] to-[#7867FF] text-white text-xs font-black shadow-lg shadow-indigo-500/20 hover:scale-102 active:scale-98 transition-all flex items-center gap-1.5"
              >
                <span>+</span> Compose Notice
              </Link>
            </div>
          </div>

          {/* KPI Analytics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-5 shadow-soft space-y-1">
              <span className="text-[11px] font-black uppercase text-[#4E5969] dark:text-slate-400 tracking-wider">
                Total Notices Sent
              </span>
              <p className="text-2xl font-black text-[#1B1E28] dark:text-white">{totalSent}</p>
              <span className="text-xs text-[#5B4BFF] font-bold">Active in Tenant Schema</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-5 shadow-soft space-y-1">
              <span className="text-[11px] font-black uppercase text-[#4E5969] dark:text-slate-400 tracking-wider">
                Total Audience Reached
              </span>
              <p className="text-2xl font-black text-[#00C48C]">{totalRecipients.toLocaleString()}</p>
              <span className="text-xs text-[#4E5969] dark:text-slate-400 font-medium">Students & Faculty recipients</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-5 shadow-soft space-y-1">
              <span className="text-[11px] font-black uppercase text-[#4E5969] dark:text-slate-400 tracking-wider">
                Average Read Rate
              </span>
              <p className="text-2xl font-black text-[#F36C21]">{avgReadRate}%</p>
              <span className="text-xs text-[#00C48C] font-semibold">{totalRead} reads recorded</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-5 shadow-soft space-y-1">
              <span className="text-[11px] font-black uppercase text-[#4E5969] dark:text-slate-400 tracking-wider">
                Urgent Active Notices
              </span>
              <p className="text-2xl font-black text-[#F04438]">{urgentCount}</p>
              <span className="text-xs text-[#F04438] font-bold">Triggers login alert modal</span>
            </div>
          </div>

          {/* Filters & Search Card */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-4 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex-1 flex flex-col sm:flex-row items-center gap-2">
              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search notices by title or content..."
                  className="w-full text-xs font-semibold py-2.5 pl-8 pr-3 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                />
                <span className="absolute left-2.5 top-3 text-[#4E5969] dark:text-slate-400 text-xs">🔍</span>
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full sm:w-auto text-xs font-bold py-2.5 px-3 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
              >
                <option value="all">All Categories</option>
                <option value="announcement">Announcements</option>
                <option value="deadline">Deadlines</option>
                <option value="exam">Examination</option>
                <option value="event">Clinical Postings</option>
                <option value="general">General</option>
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full sm:w-auto text-xs font-bold py-2.5 px-3 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
              >
                <option value="all">All Priorities</option>
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <button
              onClick={fetchAdminNotices}
              className="px-3.5 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 hover:bg-slate-200 text-[#4E5969] dark:text-slate-300 text-xs font-bold transition-all shrink-0 self-end md:self-auto"
            >
              🔄 Refresh List
            </button>
          </div>

          {/* Sent Notices Table */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] dark:bg-slate-800/80 text-[#4E5969] dark:text-slate-400 font-extrabold uppercase tracking-wider border-b border-[#E7EAF3] dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-5">Notice Details</th>
                    <th className="py-3.5 px-4">Priority & Category</th>
                    <th className="py-3.5 px-4">Target Scope</th>
                    <th className="py-3.5 px-4">Published</th>
                    <th className="py-3.5 px-4">Read Reach</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800 font-medium">
                  {loading ? (
                    [...Array(4)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-4 px-5">
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-48 mb-1"></div>
                          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-32"></div>
                        </td>
                        <td className="py-4 px-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16"></div></td>
                        <td className="py-4 px-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div></td>
                        <td className="py-4 px-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20"></div></td>
                        <td className="py-4 px-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-28"></div></td>
                        <td className="py-4 px-5 text-right"><div className="h-7 bg-slate-200 dark:bg-slate-800 rounded w-20 ml-auto"></div></td>
                      </tr>
                    ))
                  ) : filteredNotices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#4E5969] dark:text-slate-400">
                        <p className="text-base font-bold text-[#1B1E28] dark:text-white">No notices found</p>
                        <p className="text-xs mt-1">Compose your first targeted notice using the button above.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredNotices.map((n) => {
                      const totalRec = n.total_recipients || 0;
                      const readCount = n.read_count || 0;
                      const pct = n.read_percentage || 0;

                      return (
                        <tr key={n.id} className="hover:bg-[#F6F8FC] dark:hover:bg-slate-800/50 transition-colors">
                          {/* Title & Preview */}
                          <td className="py-4 px-5 max-w-xs">
                            <div className="space-y-0.5">
                              <p className="font-extrabold text-[#1B1E28] dark:text-white truncate">
                                {n.title}
                              </p>
                              <p className="text-[11px] text-[#4E5969] dark:text-slate-400 truncate">
                                {n.body}
                              </p>
                              {n.attachments_count > 0 && (
                                <span className="text-[10px] font-bold text-[#5B4BFF] flex items-center gap-1">
                                  📎 {n.attachments_count} attachment(s)
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Priority & Category */}
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md inline-block ${
                                  n.priority === 'urgent'
                                    ? 'bg-rose-100 text-[#F04438] dark:bg-rose-950'
                                    : n.priority === 'important'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 font-black'
                                    : 'bg-indigo-50 text-[#5B4BFF] dark:bg-indigo-950'
                                }`}
                              >
                                {n.priority}
                              </span>
                              <p className="text-[10px] text-[#4E5969] dark:text-slate-400 uppercase font-bold">
                                {n.category}
                              </p>
                            </div>
                          </td>

                          {/* Target Scope */}
                          <td className="py-4 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {n.targets && Array.isArray(n.targets) && n.targets.length > 0 ? (
                                n.targets.map((t: any, idx: number) => (
                                  <span
                                    key={idx}
                                    className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[#1B1E28] dark:text-slate-300"
                                  >
                                    {t.target_label || t.target_value}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[11px] text-[#4E5969]">General</span>
                              )}
                            </div>
                          </td>

                          {/* Published */}
                          <td className="py-4 px-4 text-[11px] text-[#4E5969] dark:text-slate-400 whitespace-nowrap">
                            {formatDate(n.created_at)}
                          </td>

                          {/* Read Reach Progress */}
                          <td className="py-4 px-4 min-w-[140px]">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-bold">
                                <span className="text-[#1B1E28] dark:text-white">
                                  {readCount} / {totalRec} read
                                </span>
                                <span className="text-[#00C48C] font-black">{pct}%</span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-[#5B4BFF] to-[#00C48C] rounded-full transition-all"
                                  style={{ width: `${Math.min(100, pct)}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>

                          {/* Action Buttons */}
                          <td className="py-4 px-5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Quick View Button */}
                              <button
                                onClick={() => {
                                  setSelectedNotice(n);
                                  setIsModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-[#5B4BFF] hover:bg-indigo-100 font-bold transition-all"
                                title="View Notice"
                              >
                                👁
                              </button>

                              {/* Read Report Link */}
                              <Link
                                href={`/dashboard/admin/notices/reports/${n.id}`}
                                className="px-2.5 py-1.5 rounded-lg bg-[#2D2575] hover:bg-[#231c60] text-white text-[11px] font-black transition-all shadow-sm flex items-center gap-1"
                                title="Detailed Read Report"
                              >
                                📊 Read Report
                              </Link>

                              {/* Delete Button */}
                              <button
                                onClick={() => handleDeleteNotice(n.id, n.title)}
                                className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-[#F04438] hover:bg-rose-100 font-bold transition-all"
                                title="Delete Notice"
                              >
                                🗑
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notice Detail Reader Modal */}
          <NoticeDetailModal
            notice={selectedNotice}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedNotice(null);
            }}
          />
        </main>
      </div>
    </div>
  );
}
