'use client';

import { NoticeItem } from '../../hooks/useNotices';

interface NoticeDetailModalProps {
  notice: NoticeItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge?: (noticeId: string) => Promise<void>;
}

export default function NoticeDetailModal({
  notice,
  isOpen,
  onClose,
  onAcknowledge,
}: NoticeDetailModalProps) {
  if (!isOpen || !notice) return null;

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

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-rose-100 dark:bg-rose-950 text-[#F04438] border border-rose-200 dark:border-rose-800';
      case 'important':
        return 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
      default:
        return 'bg-indigo-50 dark:bg-indigo-950 text-[#5B4BFF] border border-indigo-200 dark:border-indigo-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 max-w-2xl w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E7EAF3] dark:border-slate-800">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md ${getPriorityBadgeClass(
                  notice.priority,
                )}`}
              >
                {notice.priority}
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[#4E5969] dark:text-slate-300">
                {notice.category}
              </span>
              {notice.requires_acknowledgement && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950 text-[#F36C21]">
                  Acknowledgement Required
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-black text-[#1B1E28] dark:text-white leading-snug">
              {notice.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F6F8FC] dark:bg-slate-800 hover:bg-slate-200 text-[#4E5969] dark:text-slate-300 flex items-center justify-center font-black text-sm shrink-0 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Publisher & Date Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-850 border border-[#E7EAF3] dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#5B4BFF]/10 text-[#5B4BFF] flex items-center justify-center font-black text-xs">
              🏛️
            </div>
            <div>
              <p className="font-extrabold text-[#1B1E28] dark:text-white">
                {notice.creator_name || 'Academic Administration'}
              </p>
              <p className="text-[10px] text-[#4E5969] dark:text-slate-400 font-semibold">
                {notice.creator_role || 'College Authority'}
              </p>
            </div>
          </div>

          <div className="text-right text-[11px] text-[#4E5969] dark:text-slate-400 font-semibold">
            <p>Published: {formatDate(notice.created_at)}</p>
            {notice.expires_at && <p className="text-[#F36C21]">Expires: {formatDate(notice.expires_at)}</p>}
          </div>
        </div>

        {/* Notice Body */}
        <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-[#1B1E28] dark:text-slate-200 font-normal leading-relaxed whitespace-pre-line bg-[#FDFDFE] dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80">
          {notice.body}
        </div>

        {/* Attachments Section */}
        {notice.attachments && notice.attachments.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-black uppercase text-[#1B1E28] dark:text-white tracking-wider flex items-center gap-1.5">
              <span>📎</span> Official Attachments ({notice.attachments.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {notice.attachments.map((att, idx) => (
                <a
                  key={idx}
                  href={att.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 hover:border-[#5B4BFF] transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base">
                      {att.file_type === 'pdf' ? '📄' : att.file_type === 'image' ? '🖼️' : '📁'}
                    </span>
                    <div className="min-w-0">
                      <p className="font-extrabold text-xs text-[#1B1E28] dark:text-white truncate group-hover:text-[#5B4BFF]">
                        {att.file_name}
                      </p>
                      {att.file_size_kb && (
                        <p className="text-[10px] text-[#4E5969] dark:text-slate-400 font-medium">
                          {att.file_size_kb} KB
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#5B4BFF] shrink-0">Download ↗</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#E7EAF3] dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-[#4E5969] dark:text-slate-400 font-medium">
            {notice.acknowledged ? (
              <span className="text-[#00C48C] font-bold flex items-center gap-1">
                ✓ Acknowledged on {formatDate(notice.acknowledged_at)}
              </span>
            ) : notice.is_read ? (
              <span className="text-[#5B4BFF] font-medium flex items-center gap-1">
                ✓ Marked as read
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {notice.requires_acknowledgement && !notice.acknowledged && onAcknowledge && (
              <button
                type="button"
                onClick={async () => {
                  await onAcknowledge(notice.id);
                  onClose();
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00C48C] to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
              >
                <span>✓</span> Confirm & Acknowledge Receipt
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 hover:bg-slate-200 text-[#1B1E28] dark:text-white text-xs font-bold transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
