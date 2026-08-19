'use client';

import { useState, useEffect } from 'react';
import { useNotices, NoticeItem } from '../../hooks/useNotices';
import NoticeDetailModal from './NoticeDetailModal';

export default function NoticeLoginAlertModal() {
  const { notices, markAsRead, acknowledgeNotice } = useNotices('unread');
  const [activeAlert, setActiveAlert] = useState<NoticeItem | null>(null);
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem('mederp_login_alert_dismissed');
    if (isDismissed) {
      setDismissed(true);
      return;
    }

    // Find first unread urgent or important notice
    const urgentOrImportant = notices.find(
      (n) => !n.is_read && (n.priority === 'urgent' || n.priority === 'important'),
    );

    if (urgentOrImportant) {
      setActiveAlert(urgentOrImportant);
    }
  }, [notices]);

  if (dismissed || !activeAlert) return null;

  const handleDismiss = () => {
    sessionStorage.setItem('mederp_login_alert_dismissed', 'true');
    setDismissed(true);
    setActiveAlert(null);
  };

  const handleView = () => {
    setSelectedNotice(activeAlert);
    setIsDetailModalOpen(true);
    markAsRead(activeAlert.id);
    handleDismiss();
  };

  return (
    <>
      {/* Floating Pop-up Card */}
      <div className="fixed bottom-6 right-6 z-40 max-w-md w-full animate-in slide-in-from-bottom-5 duration-300">
        <div
          className={`p-5 rounded-[22px] shadow-2xl border ${
            activeAlert.priority === 'urgent'
              ? 'bg-white dark:bg-slate-900 border-[#F04438] shadow-rose-950/20'
              : 'bg-white dark:bg-slate-900 border-[#FFB020] shadow-amber-950/20'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 pb-2 border-b border-[#E7EAF3] dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                  activeAlert.priority === 'urgent'
                    ? 'bg-[#F04438] text-white animate-pulse'
                    : 'bg-[#FFB020] text-slate-950 font-extrabold'
                }`}
              >
                🚨 {activeAlert.priority} Notice
              </span>
              <span className="text-xs font-bold text-[#4E5969] dark:text-slate-400">
                Action Required
              </span>
            </div>

            <button
              onClick={handleDismiss}
              className="text-[#4E5969] hover:text-[#1B1E28] dark:hover:text-white font-bold text-xs p-1"
            >
              ✕
            </button>
          </div>

          {/* Content Preview */}
          <div className="py-3 space-y-1">
            <h4 className="text-xs font-black text-[#1B1E28] dark:text-white line-clamp-1">
              {activeAlert.title}
            </h4>
            <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium line-clamp-2">
              {activeAlert.body}
            </p>
            {activeAlert.attachments && activeAlert.attachments.length > 0 && (
              <span className="text-[10px] font-bold text-[#5B4BFF] inline-block pt-1">
                📎 {activeAlert.attachments.length} attachment(s) available
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E7EAF3] dark:border-slate-800">
            <button
              type="button"
              onClick={handleDismiss}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold text-[#4E5969] dark:text-slate-300 hover:bg-[#F6F8FC] dark:hover:bg-slate-800 transition-all"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={handleView}
              className="px-4 py-1.5 rounded-full bg-[#5B4BFF] hover:bg-[#4F46E5] text-white text-xs font-black shadow-sm transition-all"
            >
              View Notice
            </button>
          </div>
        </div>
      </div>

      {/* Full Modal Reader */}
      <NoticeDetailModal
        notice={selectedNotice}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedNotice(null);
        }}
        onMarkRead={markAsRead}
        onAcknowledge={acknowledgeNotice}
      />
    </>
  );
}
