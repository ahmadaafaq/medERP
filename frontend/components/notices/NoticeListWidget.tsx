'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useNotices, NoticeItem } from '../../hooks/useNotices';
import NoticeDetailModal from './NoticeDetailModal';

interface NoticeListWidgetProps {
  limit?: number;
  title?: string;
  role?: string;
  className?: string;
}

export default function NoticeListWidget({
  limit = 6,
  title = 'Campus Alerts & Circulars',
  role = 'student',
  className = '',
}: NoticeListWidgetProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'announcements' | 'deadlines'>('all');
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { notices, unreadCounts, loading, markAsRead, acknowledgeNotice, refetch } = useNotices(
    activeTab === 'all' ? 'all' : activeTab,
  );

  const displayNotices = notices.slice(0, limit);

  const handleOpenNotice = (n: NoticeItem) => {
    setSelectedNotice(n);
    setIsModalOpen(true);
    if (!n.is_read) {
      markAsRead(n.id);
    }
  };

  const handleMarkAllRead = async () => {
    for (const n of displayNotices) {
      if (!n.is_read) {
        await markAsRead(n.id);
      }
    }
    refetch();
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
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
    <div
      className={`bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-5 ${className}`}
    >
      {/* Widget Header matching reference screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E7EAF3] dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#2D2575] text-[#F36C21] font-black flex items-center justify-center text-lg shadow-md shadow-purple-950/20 border border-white/10">
            📢
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-[#1B1E28] dark:text-white uppercase tracking-wider">
                {title}
              </h3>
              {unreadCounts.totalUnread > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#F36C21] text-white text-[10px] font-black animate-pulse shadow-sm shadow-orange-500/30">
                  {unreadCounts.totalUnread} new
                </span>
              )}
            </div>
            <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium">
              Official circulars, exam datesheets & academic updates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {unreadCounts.totalUnread > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="px-3.5 py-1.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 hover:bg-[#2D2575] hover:text-white text-[#4E5969] dark:text-slate-300 text-xs font-bold transition-all border border-[#E7EAF3] dark:border-slate-700"
            >
              Mark Read
            </button>
          )}

          <Link
            href="/dashboard/notices"
            className="px-3.5 py-1.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4F46E5] text-white text-xs font-black transition-all shadow-sm flex items-center gap-1"
          >
            View All
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Filter Tabs matching reference screenshot (All Updates, Announcements, Deadlines) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Updates' },
          { id: 'announcements', label: 'Announcements' },
          { id: 'deadlines', label: 'Deadlines' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all shrink-0 ${
              activeTab === tab.id
                ? 'bg-[#F36C21] text-white shadow-sm shadow-orange-500/30'
                : 'bg-[#F6F8FC] dark:bg-slate-800 text-[#4E5969] dark:text-slate-400 hover:text-[#1B1E28] dark:hover:text-white border border-[#E7EAF3] dark:border-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notices List Cards Grid */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse p-4 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800/50 border border-[#E7EAF3] dark:border-slate-800 flex gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-700 shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4/5"></div>
              </div>
            </div>
          ))}
        </div>
      ) : displayNotices.length === 0 ? (
        <div className="p-8 rounded-2xl border border-dashed border-[#E7EAF3] dark:border-slate-800 text-center space-y-2">
          <span className="text-2xl">✨</span>
          <p className="text-xs font-bold text-[#1B1E28] dark:text-white">You're all caught up!</p>
          <p className="text-[11px] text-[#4E5969] dark:text-slate-400">No new notices in this category</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayNotices.map((notice) => (
            <div
              key={notice.id}
              onClick={() => handleOpenNotice(notice)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md hover:scale-[1.01] flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${getPriorityAccent(
                notice.priority,
                notice.is_read,
              )}`}
            >
              <div className="flex items-start gap-3 min-w-0">
                {/* Speaker Icon Badge */}
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center text-base shrink-0 shadow-xs ${getSpeakerColor(
                    notice.category,
                    notice.priority,
                  )}`}
                >
                  📢
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {!notice.is_read && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#F36C21] shrink-0" title="Unread Notice"></span>
                    )}
                    <h4
                      className={`text-xs truncate ${
                        notice.is_read
                          ? 'font-bold text-[#4E5969] dark:text-slate-300'
                          : 'font-black text-[#1B1E28] dark:text-white'
                      }`}
                    >
                      {notice.title}
                    </h4>

                    {notice.priority !== 'normal' && (
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                          notice.priority === 'urgent'
                            ? 'bg-rose-100 text-[#F04438] dark:bg-rose-950'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950'
                        }`}
                      >
                        {notice.priority}
                      </span>
                    )}

                    {notice.attachments && notice.attachments.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[#4E5969] dark:text-slate-400">
                        📎 {notice.attachments.length}
                      </span>
                    )}
                  </div>

                  {/* Body Snippet */}
                  <p className="text-xs text-[#4E5969] dark:text-slate-400 line-clamp-1 font-medium">
                    {notice.body}
                  </p>

                  {/* Tap to read link */}
                  <div className="flex items-center gap-3 pt-0.5">
                    <span className="text-[11px] font-extrabold text-[#F36C21] hover:underline flex items-center gap-1">
                      👁 Tap to read notice →
                    </span>
                    <span className="text-[10px] text-[#4E5969] dark:text-slate-500 font-medium">
                      Posted by {notice.creator_name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timestamp */}
              <div className="text-right shrink-0 self-end sm:self-center">
                <span className="text-[11px] font-bold text-[#4E5969] dark:text-slate-400">
                  {formatRelativeTime(notice.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notice Detail Modal Reader */}
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
    </div>
  );
}
