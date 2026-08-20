'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import NoticeCard from '../../../components/notices/NoticeCard';
import NoticeDetailModal from '../../../components/notices/NoticeDetailModal';
import { useNotices, NoticeItem } from '../../../hooks/useNotices';

export default function SharedNoticesPage() {
  const pathname = usePathname();
  const { notices, loading, unreadCount, markAsRead, acknowledgeNotice, fetchNotices } = useNotices();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedTab, setSelectedTab] = useState<'all' | 'unread' | 'urgent' | 'ack_pending'>('all');

  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Detect role from URL
  const currentRole: 'admin' | 'faculty' | 'student' | 'clerk' | 'warden' = useMemo(() => {
    if (pathname?.includes('/dashboard/admin')) return 'admin';
    if (pathname?.includes('/dashboard/faculty')) return 'faculty';
    if (pathname?.includes('/dashboard/clerk')) return 'clerk';
    if (pathname?.includes('/dashboard/warden')) return 'warden';
    return 'student';
  }, [pathname]);

  const handleOpenNotice = async (notice: NoticeItem) => {
    setSelectedNotice(notice);
    setIsModalOpen(true);
    if (!notice.is_read) {
      await markAsRead(notice.id);
    }
  };

  // Client-side filtering
  const filteredNotices = useMemo(() => {
    return notices.filter((n) => {
      // Tab filter
      if (selectedTab === 'unread' && n.is_read) return false;
      if (selectedTab === 'urgent' && n.priority !== 'urgent') return false;
      if (selectedTab === 'ack_pending' && (!n.requires_acknowledgement || n.acknowledged)) return false;

      // Category filter
      if (selectedCategory !== 'all' && n.category !== selectedCategory) return false;

      // Priority filter
      if (selectedPriority !== 'all' && n.priority !== selectedPriority) return false;

      // Search filter
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = n.title?.toLowerCase().includes(query);
        const matchesBody = n.body?.toLowerCase().includes(query);
        const matchesCreator = n.creator_name?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesBody && !matchesCreator) return false;
      }

      return true;
    });
  }, [notices, selectedTab, selectedCategory, selectedPriority, search]);

  const urgentCount = notices.filter((n) => n.priority === 'urgent' && !n.is_read).length;
  const ackPendingCount = notices.filter((n) => n.requires_acknowledgement && !n.acknowledged).length;

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role={currentRole} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Notices & Circulars" />

        <main className="p-6 space-y-6 flex-1">
          {/* Breadcrumb Navigation & Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#4E5969] dark:text-slate-400">
              <Link href={`/dashboard/${currentRole}`} className="hover:text-[#5B4BFF] uppercase">
                {currentRole} Dashboard
              </Link>
              <span>/</span>
              <span className="text-[#1B1E28] dark:text-white">Official Bulletins & Circulars</span>
            </div>

            <div className="flex items-center gap-2">
              {(currentRole === 'admin' || currentRole === 'clerk') && (
                <>
                  <Link
                    href="/dashboard/admin/notices/sent"
                    className="px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 text-xs font-extrabold text-[#1B1E28] dark:text-white shadow-soft hover:border-[#5B4BFF] transition-all"
                  >
                    📋 Sent History
                  </Link>
                  <Link
                    href="/dashboard/admin/notices/compose"
                    className="px-5 py-2 rounded-full bg-gradient-to-r from-[#5B4BFF] to-[#7867FF] text-white text-xs font-black shadow-lg shadow-indigo-500/20 hover:scale-102 transition-all flex items-center gap-1.5"
                  >
                    <span>+</span> Compose Notice
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Quick KPI Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => setSelectedTab('all')}
              className={`p-5 rounded-[22px] border cursor-pointer transition-all shadow-soft space-y-1 ${
                selectedTab === 'all'
                  ? 'bg-white dark:bg-slate-900 border-[#5B4BFF] ring-2 ring-[#5B4BFF]/20'
                  : 'bg-white dark:bg-slate-900 border-[#E7EAF3] dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <span className="text-[11px] font-black uppercase text-[#4E5969] dark:text-slate-400 tracking-wider">
                Total Bulletins
              </span>
              <p className="text-2xl font-black text-[#1B1E28] dark:text-white">{notices.length}</p>
              <span className="text-xs text-[#5B4BFF] font-bold">All active notices</span>
            </div>

            <div
              onClick={() => setSelectedTab('unread')}
              className={`p-5 rounded-[22px] border cursor-pointer transition-all shadow-soft space-y-1 ${
                selectedTab === 'unread'
                  ? 'bg-white dark:bg-slate-900 border-[#5B4BFF] ring-2 ring-[#5B4BFF]/20'
                  : 'bg-white dark:bg-slate-900 border-[#E7EAF3] dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <span className="text-[11px] font-black uppercase text-[#4E5969] dark:text-slate-400 tracking-wider">
                Unread Circulars
              </span>
              <p className="text-2xl font-black text-[#5B4BFF]">{unreadCount.totalUnread}</p>
              <span className="text-xs text-[#4E5969] dark:text-slate-400 font-medium">Pending your review</span>
            </div>

            <div
              onClick={() => setSelectedTab('urgent')}
              className={`p-5 rounded-[22px] border cursor-pointer transition-all shadow-soft space-y-1 ${
                selectedTab === 'urgent'
                  ? 'bg-white dark:bg-slate-900 border-[#F04438] ring-2 ring-[#F04438]/20'
                  : 'bg-white dark:bg-slate-900 border-[#E7EAF3] dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <span className="text-[11px] font-black uppercase text-[#4E5969] dark:text-slate-400 tracking-wider">
                Urgent Alerts
              </span>
              <p className="text-2xl font-black text-[#F04438]">{urgentCount}</p>
              <span className="text-xs text-[#F04438] font-bold">Immediate attention</span>
            </div>

            <div
              onClick={() => setSelectedTab('ack_pending')}
              className={`p-5 rounded-[22px] border cursor-pointer transition-all shadow-soft space-y-1 ${
                selectedTab === 'ack_pending'
                  ? 'bg-white dark:bg-slate-900 border-[#F36C21] ring-2 ring-[#F36C21]/20'
                  : 'bg-white dark:bg-slate-900 border-[#E7EAF3] dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <span className="text-[11px] font-black uppercase text-[#4E5969] dark:text-slate-400 tracking-wider">
                Requires Ack
              </span>
              <p className="text-2xl font-black text-[#F36C21]">{ackPendingCount}</p>
              <span className="text-xs text-[#00C48C] font-semibold">Receipt verification</span>
            </div>
          </div>

          {/* Filters Card */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-4 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex-1 flex flex-col sm:flex-row items-center gap-2">
              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search circulars by keyword..."
                  className="w-full text-xs font-semibold py-2.5 pl-8 pr-3 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                />
                <span className="absolute left-2.5 top-3 text-[#4E5969] dark:text-slate-400 text-xs">🔍</span>
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-auto text-xs font-bold py-2.5 px-3 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
              >
                <option value="all">All Categories</option>
                <option value="announcement">Announcements</option>
                <option value="deadline">Deadlines</option>
                <option value="exam">Examinations</option>
                <option value="event">Events & Postings</option>
                <option value="general">General</option>
              </select>

              {/* Priority Filter */}
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full sm:w-auto text-xs font-bold py-2.5 px-3 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
              >
                <option value="all">All Priorities</option>
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <button
              onClick={() => fetchNotices()}
              className="px-3.5 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 hover:bg-slate-200 text-[#4E5969] dark:text-slate-300 text-xs font-bold transition-all shrink-0"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Notices Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, idx) => (
                <div
                  key={idx}
                  className="animate-pulse bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 space-y-4 shadow-soft"
                >
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                  <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-dashed border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-12 text-center space-y-3">
              <span className="text-4xl">📢</span>
              <h4 className="text-sm font-black text-[#1B1E28] dark:text-white">No notices found matching criteria</h4>
              <p className="text-xs text-[#4E5969] dark:text-slate-400 max-w-sm mx-auto">
                Try adjusting your search query or selecting "All Categories" to view available circulars.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredNotices.map((notice) => (
                <NoticeCard
                  key={notice.id}
                  notice={notice}
                  onClick={handleOpenNotice}
                  onAcknowledge={acknowledgeNotice}
                />
              ))}
            </div>
          )}

          {/* Detail Reader Modal */}
          <NoticeDetailModal
            notice={selectedNotice}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedNotice(null);
            }}
            onAcknowledge={acknowledgeNotice}
          />
        </main>
      </div>
    </div>
  );
}
