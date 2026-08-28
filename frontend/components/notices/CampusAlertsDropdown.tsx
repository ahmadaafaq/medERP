'use client';

import { useState } from 'react';
import { NoticeItem } from '../../hooks/useNotices';

interface CampusAlertsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notices: NoticeItem[];
  loading: boolean;
  onSelectNotice: (notice: NoticeItem) => void;
  onMarkAllRead: () => void;
}

export default function CampusAlertsDropdown({
  isOpen,
  onClose,
  notices,
  loading,
  onSelectNotice,
  onMarkAllRead,
}: CampusAlertsDropdownProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'announcements' | 'deadlines'>('all');

  if (!isOpen) return null;

  const filteredNotices = notices.filter((n) => {
    if (activeTab === 'announcements') return n.category === 'announcement';
    if (activeTab === 'deadlines') return n.category === 'deadline' || n.category === 'exam';
    return true;
  });

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return 'Recent';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
      }) + ', ' + d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="absolute right-0 mt-3 w-96 sm:w-[420px] bg-[#F6F8FC] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden font-sans z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100">
      {/* Top Header matching Image 2 */}
      <div className="bg-[#2D2575] text-white px-5 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm transition-all"
            title="Close"
          >
            ‹
          </button>
          <h2 className="text-base font-black tracking-tight text-white font-sans">
            Campus Alerts
          </h2>
        </div>

        <button
          type="button"
          onClick={onMarkAllRead}
          className="px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all border border-white/20"
        >
          Mark Read
        </button>
      </div>

      {/* Filter Tabs matching Image 2 */}
      <div className="p-3.5 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${
            activeTab === 'all'
              ? 'bg-[#F36C21] text-white shadow-sm shadow-orange-500/30'
              : 'bg-white dark:bg-slate-800 text-[#4E5969] dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-[#F36C21]'
          }`}
        >
          All Updates
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('announcements')}
          className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${
            activeTab === 'announcements'
              ? 'bg-[#F36C21] text-white shadow-sm shadow-orange-500/30'
              : 'bg-white dark:bg-slate-800 text-[#4E5969] dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-[#F36C21]'
          }`}
        >
          Announcements
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('deadlines')}
          className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${
            activeTab === 'deadlines'
              ? 'bg-[#F36C21] text-white shadow-sm shadow-orange-500/30'
              : 'bg-white dark:bg-slate-800 text-[#4E5969] dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-[#F36C21]'
          }`}
        >
          Deadlines
        </button>
      </div>

      {/* Notifications List */}
      <div className="p-3.5 space-y-3 max-h-[440px] overflow-y-auto">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse p-4 rounded-2xl bg-white dark:bg-slate-800/50 space-y-2 border border-slate-100 dark:border-slate-800">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
            </div>
          ))
        ) : filteredNotices.length === 0 ? (
          <div className="p-8 text-center text-[#4E5969] dark:text-slate-400 space-y-1">
            <div className="text-3xl mb-1">🔔</div>
            <p className="text-xs font-bold text-[#1B1E28] dark:text-white">No active alerts</p>
            <p className="text-[11px]">You're all caught up with campus notifications.</p>
          </div>
        ) : (
          filteredNotices.map((notice) => {
            const isUnread = !notice.is_read;
            const isConnectionOrSystem = notice.category === 'general';

            return (
              <div
                key={notice.id}
                onClick={() => {
                  onSelectNotice(notice);
                  onClose();
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 hover:shadow-md ${
                  isUnread
                    ? 'bg-[#FFF8F2] dark:bg-slate-850 border-[#F36C21]/40 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-[#E7EAF3] dark:border-slate-800'
                }`}
              >
                {/* Header with Icon, Sender, Time */}
                <div className="flex items-start gap-3">
                  {/* Left Avatar with Unread Dot */}
                  <div className="relative shrink-0 mt-0.5">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg ${
                        isConnectionOrSystem
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-[#5B4BFF]'
                          : 'bg-[#FFEFE5] dark:bg-orange-950/60 text-[#F36C21]'
                      }`}
                    >
                      {isConnectionOrSystem ? '🔔' : '📢'}
                    </div>
                    {isUnread && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#F36C21] ring-2 ring-white dark:ring-slate-900" />
                    )}
                  </div>

                  {/* Sender & Timestamp */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="text-xs font-black text-[#1B1E28] dark:text-white truncate">
                        {notice.creator_name ? `[ERP] ${notice.creator_name.toUpperCase()}` : `[ERP] ADMIN ANNOUNCEMENT`}
                      </h4>
                      <span className="text-[10px] font-semibold text-[#4E5969] dark:text-slate-400 shrink-0">
                        {formatTimestamp(notice.created_at)}
                      </span>
                    </div>

                    {/* Message Preview */}
                    <p className="text-xs text-[#4E5969] dark:text-slate-300 font-medium line-clamp-2 mt-0.5 leading-relaxed">
                      {notice.title}: {notice.body}
                    </p>
                  </div>
                </div>

                {/* Bottom Action Link */}
                <div className="pl-13 flex items-center justify-between text-[11px] pt-1">
                  <span className="text-xs font-bold text-[#F36C21] hover:text-[#D95A13] flex items-center gap-1">
                    <span>👁 Tap to read notice</span>
                    <span>→</span>
                  </span>

                  {notice.attachments && notice.attachments.length > 0 && (
                    <span className="text-[10px] font-bold text-[#5B4BFF] bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                      📎 {notice.attachments.length} file
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-slate-100/70 dark:bg-slate-850/80 border-t border-slate-200 dark:border-slate-800 text-center">
        <span className="text-xs text-[#4E5969] dark:text-slate-400 font-bold">
          {notices.length} total broadcast notices
        </span>
      </div>
    </div>
  );
}
