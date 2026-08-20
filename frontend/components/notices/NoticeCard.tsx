'use client';

import { NoticeItem } from '../../hooks/useNotices';

interface NoticeCardProps {
  notice: NoticeItem;
  onClick: (notice: NoticeItem) => void;
  onAcknowledge?: (noticeId: string) => Promise<void>;
}

export default function NoticeCard({ notice, onClick, onAcknowledge }: NoticeCardProps) {
  const isUrgent = notice.priority === 'urgent';
  const isImportant = notice.priority === 'important';
  const isUnread = !notice.is_read;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'exam':
        return '📝';
      case 'deadline':
        return '⏳';
      case 'event':
        return '📅';
      default:
        return '📢';
    }
  };

  return (
    <div
      onClick={() => onClick(notice)}
      className={`group relative border rounded-[22px] p-5 shadow-soft hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3.5 ${
        isUnread
          ? 'bg-[#FFF8F2] dark:bg-slate-850 border-[#F36C21]/40'
          : isUrgent
          ? 'bg-rose-50/20 dark:bg-rose-950/10 border-rose-300 dark:border-rose-900/60'
          : isImportant
          ? 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900/40'
          : 'bg-white dark:bg-slate-900 border-[#E7EAF3] dark:border-slate-800 hover:border-[#5B4BFF]'
      }`}
    >
      {/* Top Badges & Meta */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Priority Pill */}
          <span
            className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md flex items-center gap-1.5 ${
              isUrgent
                ? 'bg-rose-100 text-[#F04438] dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800'
                : isImportant
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 font-bold'
                : 'bg-[#5B4BFF] text-white dark:bg-indigo-600 font-bold'
            }`}
          >
            {isUrgent && <span className="w-1.5 h-1.5 rounded-full bg-[#F04438] animate-ping" />}
            {notice.priority}
          </span>

          {/* Category Tag */}
          <span className="text-[10px] font-extrabold text-[#4E5969] dark:text-slate-300 uppercase bg-[#F6F8FC] dark:bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1">
            <span>{getCategoryIcon(notice.category)}</span>
            <span>{notice.category}</span>
          </span>

          {/* Unread Status Tag */}
          {isUnread && (
            <span className="text-[10px] font-black text-[#F36C21] bg-orange-50 dark:bg-orange-950 px-2 py-0.5 rounded-full border border-[#F36C21]/30">
              NEW
            </span>
          )}
        </div>

        {/* Date */}
        <span className="text-[11px] text-[#4E5969] dark:text-slate-400 font-bold shrink-0">
          {formatDate(notice.created_at)}
        </span>
      </div>

      {/* Main Content Preview */}
      <div className="space-y-1">
        <h3 className="text-sm font-black text-[#F36C21] dark:text-orange-400 group-hover:text-[#5B4BFF] dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
          {notice.title}
        </h3>
        <p className="text-xs text-[#4E5969] dark:text-slate-300 line-clamp-2 font-medium leading-relaxed">
          {notice.body}
        </p>
      </div>

      {/* Footer Info & Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-[#E7EAF3] dark:border-slate-800/80 text-[11px]">
        {/* Creator Info */}
        <div className="flex items-center gap-1.5 text-[#4E5969] dark:text-slate-400 font-bold truncate max-w-[220px]">
          <span className="text-xs">🏛️</span>
          <span className="truncate">{notice.creator_name ? `[ERP] ${notice.creator_name}` : '[ERP] Administration'}</span>
        </div>

        {/* Attachments & Actions */}
        <div className="flex items-center gap-2">
          {notice.attachments && notice.attachments.length > 0 && (
            <span className="text-[10px] font-bold text-[#5B4BFF] bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded flex items-center gap-1">
              📎 {notice.attachments.length} file(s)
            </span>
          )}

          {notice.requires_acknowledgement && !notice.acknowledged && onAcknowledge ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAcknowledge(notice.id);
              }}
              className="px-2.5 py-1 rounded-lg bg-[#00C48C] hover:bg-[#00B37E] text-white font-black text-[10px] shadow-sm transition-all"
            >
              ✓ Acknowledge
            </button>
          ) : (
            <span className="text-xs font-black text-[#F36C21] group-hover:text-[#5B4BFF] group-hover:translate-x-0.5 transition-all flex items-center gap-1">
              <span>View Notice</span>
              <span>➔</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
