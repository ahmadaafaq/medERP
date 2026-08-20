'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useNotices, NoticeItem } from '../../hooks/useNotices';
import NoticeDetailModal from './NoticeDetailModal';

interface NoticeDashboardWidgetProps {
  role: 'student' | 'faculty' | 'admin' | 'clerk' | 'warden';
}

export default function NoticeDashboardWidget({ role }: NoticeDashboardWidgetProps) {
  const { notices, loading, unreadCount, markAsRead, acknowledgeNotice } = useNotices();
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getNoticesLink = () => {
    switch (role) {
      case 'admin':
        return '/dashboard/admin/notices/sent';
      case 'faculty':
        return '/dashboard/faculty/notices';
      case 'clerk':
        return '/dashboard/clerk/notices';
      default:
        return '/dashboard/student/notices';
    }
  };

  const handleOpenNotice = async (notice: NoticeItem) => {
    setSelectedNotice(notice);
    setIsModalOpen(true);
    if (!notice.is_read) {
      await markAsRead(notice.id);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Find latest urgent unread notice for the top banner
  const urgentUnread = notices.find((n) => n.priority === 'urgent' && !n.is_read);

  // Sort notices so latest / urgent unread is at the top
  const sortedNotices = [...notices].sort((a, b) => {
    // 1. Unread urgent first
    const aUrgentUnread = a.priority === 'urgent' && !a.is_read ? 1 : 0;
    const bUrgentUnread = b.priority === 'urgent' && !b.is_read ? 1 : 0;
    if (aUrgentUnread !== bUrgentUnread) return bUrgentUnread - aUrgentUnread;

    // 2. Unread important next
    const aImpUnread = a.priority === 'important' && !a.is_read ? 1 : 0;
    const bImpUnread = b.priority === 'important' && !b.is_read ? 1 : 0;
    if (aImpUnread !== bImpUnread) return bImpUnread - aImpUnread;

    // 3. Newest first
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <>
      <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-4 hover:shadow-md transition-all flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5B4BFF] to-[#7867FF] flex items-center justify-center text-white text-lg shadow-md shadow-indigo-500/25 shrink-0">
              📢
            </div>
            <div>
              <h3 className="text-sm font-black text-[#F36C21] uppercase tracking-wider font-sans">
                NOTICES & CIRCULARS
              </h3>
              <p className="text-[11px] text-[#4E5969] dark:text-slate-400 font-bold">
                Official College Bulletins & Updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount.totalUnread > 0 ? (
              <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/80 text-[#F04438] text-[11px] font-black tracking-wider border border-rose-200/80 dark:border-rose-800 animate-pulse">
                {unreadCount.totalUnread} NEW
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#00C48C] text-[10px] font-black border border-emerald-200 dark:border-emerald-800">
                UP TO DATE
              </span>
            )}
          </div>
        </div>

        {/* Top Urgent Notice Alert Banner */}
        {urgentUnread && (
          <div
            onClick={() => handleOpenNotice(urgentUnread)}
            className="p-3.5 rounded-2xl bg-[#FFF1F2] dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 flex items-center justify-between gap-3 cursor-pointer hover:bg-rose-100/70 dark:hover:bg-rose-950/60 transition-all group shadow-sm"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-3.5 h-3.5 rounded-full bg-[#F04438]/20 flex items-center justify-center shrink-0">
                <span className="w-2 h-2 rounded-full bg-[#F04438] animate-ping" />
              </span>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase text-[#F04438] tracking-wider block">
                  URGENT CIRCULAR
                </span>
                <p className="text-xs font-black text-[#F36C21] dark:text-orange-400 truncate group-hover:underline transition-colors">
                  {urgentUnread.title}
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-[#F04438] shrink-0 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              <span>Read</span>
              <span>➔</span>
            </span>
          </div>
        )}

        {/* Notice List */}
        <div className="space-y-3 flex-1 min-h-[160px]">
          {loading ? (
            [...Array(3)].map((_, idx) => (
              <div key={idx} className="animate-pulse p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2"></div>
              </div>
            ))
          ) : sortedNotices.length === 0 ? (
            <div className="p-8 text-center text-[#4E5969] dark:text-slate-400 space-y-1">
              <div className="text-2xl mb-1">📭</div>
              <p className="text-xs font-bold text-[#1B1E28] dark:text-white">No active circulars</p>
              <p className="text-[11px]">All announcements and bulletins from administration will appear here.</p>
            </div>
          ) : (
            sortedNotices.slice(0, 3).map((notice, index) => {
              // Highlight the first card if urgent or index === 0 with gradient background
              const isFirstHighlighted = index === 0 && (notice.priority === 'urgent' || !notice.is_read);

              if (isFirstHighlighted) {
                return (
                  <div
                    key={notice.id}
                    onClick={() => handleOpenNotice(notice)}
                    className="p-4 rounded-2xl bg-gradient-to-r from-[#5B4BFF] to-[#6E5CF6] text-white shadow-md shadow-indigo-500/20 cursor-pointer hover:scale-[1.01] hover:shadow-lg transition-all group border border-indigo-400/40 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {notice.priority === 'urgent' ? (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-white text-[#F04438] shadow-sm">
                            URGENT
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-white/20 text-white backdrop-blur-sm">
                            {notice.priority.toUpperCase()}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-white/90 uppercase tracking-wider">
                          {notice.category}
                        </span>
                        {!notice.is_read && (
                          <span className="w-2 h-2 rounded-full bg-white animate-pulse" title="Unread" />
                        )}
                      </div>
                      <p className="text-xs font-black text-amber-300 group-hover:text-amber-200 transition-colors truncate">
                        {notice.title}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-bold text-white/80 block">
                        {formatDate(notice.created_at)}
                      </span>
                      {notice.attachments && notice.attachments.length > 0 && (
                        <span className="text-[10px] text-white/90 font-bold flex items-center gap-0.5 justify-end">
                          📎 file
                        </span>
                      )}
                    </div>
                  </div>
                );
              }

              // Standard Item Card
              return (
                <div
                  key={notice.id}
                  onClick={() => handleOpenNotice(notice)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                    !notice.is_read
                      ? 'bg-[#FFF8F2] dark:bg-slate-800/90 border-[#F36C21]/40 shadow-xs'
                      : 'bg-[#F8FAFC] dark:bg-slate-850 border-[#E7EAF3] dark:border-slate-800 hover:border-[#5B4BFF]'
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          notice.priority === 'urgent'
                            ? 'bg-rose-100 text-[#F04438] dark:bg-rose-950'
                            : notice.priority === 'important'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 font-black'
                            : 'bg-[#5B4BFF] text-white dark:bg-indigo-600 font-bold'
                        }`}
                      >
                        {notice.priority.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-[#4E5969] dark:text-slate-400 font-extrabold uppercase tracking-wide">
                        {notice.category}
                      </span>
                      {!notice.is_read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F36C21]" title="Unread" />
                      )}
                    </div>
                    <p className="text-xs font-bold text-[#F36C21] dark:text-orange-400 group-hover:text-[#5B4BFF] dark:group-hover:text-indigo-400 transition-colors truncate">
                      {notice.title}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-bold text-[#4E5969] dark:text-slate-400 block">
                      {formatDate(notice.created_at)}
                    </span>
                    {notice.attachments && notice.attachments.length > 0 && (
                      <span className="text-[10px] text-[#5B4BFF] font-bold flex items-center gap-0.5 justify-end">
                        📎 file
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Link */}
        <div className="pt-3 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-[#4E5969] dark:text-slate-400 font-bold">
            {notices.length} total circulars
          </span>

          <Link
            href={getNoticesLink()}
            className="text-xs font-black text-[#5B4BFF] dark:text-indigo-400 hover:text-[#4E3FE3] flex items-center gap-1 group"
          >
            <span>View All Notices</span>
            <span className="group-hover:translate-x-1 transition-transform">➔</span>
          </Link>
        </div>
      </div>

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
    </>
  );
}
