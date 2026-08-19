'use client';

import { useEffect } from 'react';
import { NoticeItem, NoticeAttachment } from '../../hooks/useNotices';

interface NoticeDetailModalProps {
  notice: NoticeItem | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkRead?: (id: string) => void;
  onAcknowledge?: (id: string) => void;
}

export default function NoticeDetailModal({
  notice,
  isOpen,
  onClose,
  onMarkRead,
  onAcknowledge,
}: NoticeDetailModalProps) {
  useEffect(() => {
    if (isOpen && notice && !notice.is_read && onMarkRead) {
      onMarkRead(notice.id);
    }
  }, [isOpen, notice, onMarkRead]);

  if (!isOpen || !notice) return null;

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

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'urgent':
        return 'bg-[#F04438] text-white shadow-sm shadow-rose-500/30';
      case 'important':
        return 'bg-[#FFB020] text-slate-950 font-black shadow-sm shadow-amber-500/30';
      default:
        return 'bg-indigo-50 dark:bg-indigo-950/60 text-[#5B4BFF] border border-indigo-200 dark:border-indigo-800';
    }
  };

  const getFileBadge = (type: string) => {
    switch (type) {
      case 'pdf':
        return '📄 PDF Document';
      case 'xlsx':
      case 'xls':
        return '📊 Excel Spreadsheet';
      case 'docx':
      case 'doc':
        return '📝 Word Document';
      case 'image':
        return '🖼️ Image Attachment';
      default:
        return '📎 Attachment';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E7EAF3] dark:border-slate-800 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${getPriorityBadge(notice.priority)}`}>
                {notice.priority}
              </span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[#4E5969] dark:text-slate-400">
                {notice.category || 'Announcement'}
              </span>
              {notice.requires_acknowledgement && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-300 border border-amber-200">
                  Ack Required
                </span>
              )}
            </div>
            <h2 className="text-base font-black text-[#1B1E28] dark:text-white leading-snug">
              {notice.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F6F8FC] dark:bg-slate-800 hover:bg-slate-200 text-[#4E5969] dark:text-slate-300 flex items-center justify-center font-bold text-sm shrink-0 transition-all"
          >
            ✕
          </button>
        </div>

        {/* Sender Info Bar */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#F6F8FC] dark:bg-slate-800/60 border border-[#E7EAF3] dark:border-slate-800 text-xs shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2D2575] text-[#F36C21] font-black flex items-center justify-center text-xs shadow-sm">
              📢
            </div>
            <div>
              <p className="font-extrabold text-[#1B1E28] dark:text-white">{notice.creator_name}</p>
              <p className="text-[10px] text-[#4E5969] dark:text-slate-400 font-medium">
                {notice.creator_role || 'Academic / Admin Office'}
              </p>
            </div>
          </div>

          <span className="text-[11px] font-bold text-[#4E5969] dark:text-slate-400">
            {formatDate(notice.created_at)}
          </span>
        </div>

        {/* Notice Body Content */}
        <div className="overflow-y-auto space-y-4 pr-1 text-xs text-[#1B1E28] dark:text-slate-200 font-medium leading-relaxed flex-1">
          <div className="whitespace-pre-line bg-[#F8FAFC] dark:bg-slate-950/40 p-4 rounded-2xl border border-[#E7EAF3] dark:border-slate-800">
            {notice.body}
          </div>

          {/* Attachments Section */}
          {notice.attachments && notice.attachments.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-black text-[#1B1E28] dark:text-white uppercase tracking-wider">
                Official Attachments ({notice.attachments.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {notice.attachments.map((att, idx) => (
                  <a
                    key={idx}
                    href={att.file_url.startsWith('http') ? att.file_url : `http://localhost:3001${att.file_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 hover:border-[#5B4BFF] dark:hover:border-[#5B4BFF] flex items-center justify-between gap-2 transition-all hover:shadow-sm group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-black px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[#1B1E28] dark:text-white shrink-0">
                        {getFileBadge(att.file_type)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1B1E28] dark:text-white truncate group-hover:text-[#5B4BFF]">
                          {att.file_name}
                        </p>
                        <p className="text-[10px] text-[#4E5969] dark:text-slate-400">
                          {att.file_size_kb || 0} KB
                        </p>
                      </div>
                    </div>

                    <span className="text-[#5B4BFF] font-black text-xs shrink-0 group-hover:translate-x-0.5 transition-transform">
                      ⬇
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E7EAF3] dark:border-slate-800 shrink-0">
          <div>
            {notice.requires_acknowledgement && !notice.acknowledged && onAcknowledge && (
              <button
                type="button"
                onClick={() => onAcknowledge(notice.id)}
                className="px-4 py-2 rounded-full bg-[#00C48C] hover:bg-[#00B37E] text-white text-xs font-black shadow-sm flex items-center gap-1.5 transition-all"
              >
                ✓ I Acknowledge Receipt
              </button>
            )}
            {notice.acknowledged && (
              <span className="text-xs font-extrabold text-[#00C48C] flex items-center gap-1">
                ✓ Acknowledged on {formatDate(notice.acknowledged_at || new Date().toISOString())}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#2D2575] hover:bg-[#231c60] text-white text-xs font-bold shadow-sm transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
