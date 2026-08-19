'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import { useNotices, NoticeItem } from '../../../hooks/useNotices';
import NoticeDetailModal from '../../../components/notices/NoticeDetailModal';

export default function SharedNoticesPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'important' | 'announcements' | 'deadlines'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [userRole, setUserRole] = useState<'student' | 'faculty' | 'admin' | 'clerk' | 'warden'>('student');

  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRole = (localStorage.getItem('role') || 'student').toLowerCase();
      if (['student', 'faculty', 'admin', 'clerk', 'warden'].includes(storedRole)) {
        setUserRole(storedRole as any);
      }
    }
  }, []);

  const { notices, unreadCounts, loading, markAsRead, acknowledgeNotice, refetch } = useNotices(
    activeTab,
    categoryFilter,
    search,
  );

  const handleOpenNotice = (n: NoticeItem) => {
    setSelectedNotice(n);
    setIsModalOpen(true);
    if (!n.is_read) {
      markAsRead(n.id);
    }
  };

  const handleMarkAllAsRead = async () => {
    for (const n of notices) {
      if (!n.is_read) {
        await markAsRead(n.id);
      }
    }
    refetch();
  };

  const formatDate = (dateStr: string) => {
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

  const getPriorityAccent = (priority: string, isRead?: boolean) => {
    if (isRead) {
      return 'border-[#E7EAF3] dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 opacity-90';
    }
    switch (priority) {
      case 'urgent':
        return 'border-l-4 border-l-[#F04438] border-[#E7EAF3] dark:border-slate-800 bg-[#FFF5F5] dark:bg-slate-900/90 shadow-sm';
      case 'important':
        return 'border-l-4 border-l-[#FFB020] border-[#E7EAF3] dark:border-slate-800 bg-[#FFFDF5] dark:bg-slate-900/90 shadow-sm';
      default:
        return 'border-l-4 border-l-[#5B4BFF] border-[#E7EAF3] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm';
    }
  };

  const getSpeakerColor = (category: string, priority: string) => {
    if (priority === 'urgent') return 'bg-rose-100 text-[#F04438] dark:bg-rose-950/60';
    if (priority === 'important') return 'bg-orange-100 text-[#F36C21] dark:bg-orange-950/60';
    if (category === 'deadline') return 'bg-amber-100 text-amber-600 dark:bg-amber-950/60';
    return 'bg-purple-100 text-[#5B4BFF] dark:bg-purple-950/60';
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role={userRole} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Campus Notices & Official Circulars" />

        <main className="p-6 space-y-6 flex-1 max-w-6xl mx-auto w-full">
          {/* Header Card */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#2D2575] text-[#F36C21] font-black flex items-center justify-center text-2xl shadow-md border border-white/10">
                📢
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-[#1B1E28] dark:text-white uppercase tracking-wider">
                    Campus Alerts & Circulars
                  </h2>
                  {unreadCounts.totalUnread > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F36C21] text-white text-[10px] font-black animate-pulse shadow-sm">
                      {unreadCounts.totalUnread} Unread
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium mt-0.5">
                  Real-time academic announcements, examination datesheets, and department circulars
                </p>
              </div>
            </div>

            {unreadCounts.totalUnread > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 rounded-full bg-[#F6F8FC] dark:bg-slate-800 hover:bg-[#2D2575] hover:text-white text-[#1B1E28] dark:text-slate-200 text-xs font-black transition-all border border-[#E7EAF3] dark:border-slate-700 shadow-xs self-start sm:self-auto"
              >
                ✓ Mark All Read
              </button>
            )}
          </div>

          {/* Filter Tabs matching reference screenshot */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'All Updates', icon: '🌐' },
              { id: 'announcements', label: 'Announcements', icon: '📢' },
              { id: 'deadlines', label: 'Deadlines', icon: '⏳' },
              { id: 'important', label: 'Important / Urgent', icon: '🚨' },
              { id: 'unread', label: `Unread (${unreadCounts.totalUnread})`, icon: '✉️' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-[#F36C21] text-white shadow-md shadow-orange-500/30'
                    : 'bg-white dark:bg-slate-900 text-[#4E5969] dark:text-slate-300 hover:text-[#1B1E28] dark:hover:text-white border border-[#E7EAF3] dark:border-slate-800 shadow-soft'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Search & Category Filter Bar */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-4 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search circulars by title or keyword..."
                className="w-full text-xs font-semibold py-2.5 pl-8 pr-3 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
              />
              <span className="absolute left-2.5 top-3 text-[#4E5969] dark:text-slate-400 text-xs">🔍</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full sm:w-auto text-xs font-bold py-2.5 px-3 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
              >
                <option value="all">All Notice Types</option>
                <option value="announcement">Announcements</option>
                <option value="deadline">Deadlines</option>
                <option value="exam">Examination</option>
                <option value="event">Clinical Rotations</option>
                <option value="general">General</option>
              </select>

              <button
                onClick={() => refetch()}
                className="px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 hover:bg-slate-200 text-[#4E5969] dark:text-slate-300 text-xs font-bold transition-all shrink-0"
                title="Refresh notices"
              >
                🔄
              </button>
            </div>
          </div>

          {/* Notices Feed List */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-5 flex gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-700 shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4/5"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : notices.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-dashed border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-12 text-center space-y-3">
              <span className="text-3xl">✨</span>
              <h4 className="text-sm font-bold text-[#1B1E28] dark:text-white">No Notices Available</h4>
              <p className="text-xs text-[#4E5969] dark:text-slate-400">
                You're completely caught up! New campus circulars will appear here instantly.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  onClick={() => handleOpenNotice(notice)}
                  className={`p-5 rounded-[22px] border transition-all cursor-pointer hover:shadow-md hover:scale-[1.008] flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${getPriorityAccent(
                    notice.priority,
                    notice.is_read,
                  )}`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    {/* Speaker Icon */}
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg shrink-0 shadow-xs ${getSpeakerColor(
                        notice.category,
                        notice.priority,
                      )}`}
                    >
                      📢
                    </div>

                    <div className="min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {!notice.is_read && (
                          <span className="w-2.5 h-2.5 rounded-full bg-[#F36C21] shrink-0" title="Unread"></span>
                        )}

                        <h3
                          className={`text-sm ${
                            notice.is_read
                              ? 'font-bold text-[#4E5969] dark:text-slate-300'
                              : 'font-black text-[#1B1E28] dark:text-white'
                          }`}
                        >
                          {notice.title}
                        </h3>

                        {notice.priority !== 'normal' && (
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                              notice.priority === 'urgent'
                                ? 'bg-rose-100 text-[#F04438] dark:bg-rose-950 font-black'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 font-black'
                            }`}
                          >
                            {notice.priority}
                          </span>
                        )}

                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[#4E5969] dark:text-slate-400">
                          {notice.category}
                        </span>

                        {notice.attachments && notice.attachments.length > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-[#5B4BFF]">
                            📎 {notice.attachments.length} File(s)
                          </span>
                        )}
                      </div>

                      {/* Body snippet */}
                      <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium line-clamp-2 leading-relaxed">
                        {notice.body}
                      </p>

                      {/* Footer info */}
                      <div className="flex items-center gap-3 pt-1">
                        <span className="text-xs font-extrabold text-[#F36C21] hover:underline flex items-center gap-1">
                          👁 Tap to read notice & attachments →
                        </span>
                        <span className="text-[11px] text-[#4E5969] dark:text-slate-500 font-medium">
                          Posted by {notice.creator_name} ({notice.creator_role || 'Admin'})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="text-right shrink-0 self-end sm:self-center">
                    <span className="text-xs font-bold text-[#4E5969] dark:text-slate-400 whitespace-nowrap">
                      {formatDate(notice.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Notice Detail Reader Modal */}
          <NoticeDetailModal
            notice={selectedNotice}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedNotice(null);
            }}
            onMarkRead={markAsRead}
            onAcknowledge={acknowledgeNotice}
          />
        </main>
      </div>
    </div>
  );
}
