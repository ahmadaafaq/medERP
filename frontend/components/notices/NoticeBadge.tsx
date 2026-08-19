'use client';

import { useNotices } from '../../hooks/useNotices';

interface NoticeBadgeProps {
  variant?: 'pill' | 'dot' | 'header';
  className?: string;
}

export default function NoticeBadge({ variant = 'pill', className = '' }: NoticeBadgeProps) {
  const { unreadCounts } = useNotices();

  if (unreadCounts.totalUnread <= 0) return null;

  if (variant === 'dot') {
    return (
      <span
        className={`w-2.5 h-2.5 rounded-full bg-[#F36C21] animate-pulse shadow-sm shadow-orange-500/50 ${className}`}
        title={`${unreadCounts.totalUnread} unread notices`}
      />
    );
  }

  if (variant === 'header') {
    return (
      <span
        className={`absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-[#F36C21] text-white text-[9px] font-black leading-none shadow-md shadow-orange-500/30 flex items-center justify-center min-w-[18px] ${className}`}
      >
        {unreadCounts.totalUnread > 99 ? '99+' : unreadCounts.totalUnread}
      </span>
    );
  }

  return (
    <span
      className={`px-2 py-0.5 rounded-full bg-[#F36C21] text-white text-[10px] font-black shadow-xs ${className}`}
    >
      {unreadCounts.totalUnread > 99 ? '99+' : unreadCounts.totalUnread}
    </span>
  );
}
