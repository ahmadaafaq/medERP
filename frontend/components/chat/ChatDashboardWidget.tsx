'use client';

import React from 'react';
import Link from 'next/link';
import { MessageSquare, ArrowRight, Clock, Sparkles } from 'lucide-react';
import { useChat } from '../../hooks/useChat';

interface ChatDashboardWidgetProps {
  role?: 'FACULTY' | 'STUDENT' | 'ADMIN';
  chatUrl?: string;
}

export default function ChatDashboardWidget({
  role = 'FACULTY',
  chatUrl = '/dashboard/faculty/chat',
}: ChatDashboardWidgetProps) {
  const { groups, loadingGroups, unreadTotal } = useChat(role);

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return '';
    }
  };

  // Filter out legacy dummy batches like 2013, 2014; prioritize active 2025+ batches and active channels
  const topGroups = groups
    .filter((g) => {
      const by = String(g.batch_year || g.batch_code || '').trim();
      const num = parseInt(by, 10);
      if (!isNaN(num) && num < 2024) return false;
      if (g.name?.includes('2013') || g.name?.includes('2014')) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.last_message && !b.last_message) return -1;
      if (!a.last_message && b.last_message) return 1;
      return 0;
    })
    .slice(0, 3);

  return (
    <div className="h-full flex flex-col justify-between bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft hover:shadow-md transition-all">
      {/* Widget Header - Standardized Height & Alignment */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#E7EAF3] dark:border-slate-800 shrink-0 min-h-[48px]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-[#5B4BFF] flex items-center justify-center font-bold shadow-xs shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-[#F36C21] uppercase tracking-wide font-sans truncate">
              BATCH & DEPT DISCUSSIONS
            </h3>
            <p className="text-[11px] text-[#4E5969] dark:text-slate-400 font-semibold truncate">
              Faculty & student group communications
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 pl-2">
          {unreadTotal > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-[#F36C21] text-white text-[10px] font-black animate-pulse shadow-xs">
              {unreadTotal} Unread
            </span>
          )}
          <Link
            href={chatUrl}
            className="px-3 py-1.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4838e6] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm hover:scale-105"
          >
            <span>Open Chat</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Widget Content List - Starts from Top without Empty Gaps */}
      <div className="flex-1 pt-3.5 space-y-2.5 flex flex-col justify-start">
        {loadingGroups ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-1/2"></div>
              </div>
            </div>
          ))
        ) : topGroups.length === 0 ? (
          <div className="py-8 text-center text-[#4E5969] dark:text-slate-400 my-auto">
            <Sparkles className="w-6 h-6 mx-auto mb-1 text-[#F36C21]" />
            <p className="text-xs font-bold text-[#1B1E28] dark:text-white">No active batch groups</p>
            <p className="text-[11px] mt-0.5">2025 batch discussions will appear when channels are active.</p>
          </div>
        ) : (
          topGroups.map((group) => (
            <Link
              key={group.id}
              href={chatUrl}
              className="flex items-center justify-between p-3 rounded-2xl border border-[#E7EAF3] dark:border-slate-800/80 bg-[#F6F8FC]/60 dark:bg-slate-850/40 hover:bg-white dark:hover:bg-slate-800 hover:border-[#5B4BFF]/40 transition-all group shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2D2575] to-[#5B4BFF] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                  {group.batch_year ? group.batch_year.slice(-2) : '25'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-[#1B1E28] dark:text-white truncate group-hover:text-[#5B4BFF] transition-colors">
                      {group.name}
                    </h4>
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-orange-50 dark:bg-orange-950/60 text-[#F36C21] uppercase">
                      {group.batch_year || '2025'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#4E5969] dark:text-slate-400 truncate mt-0.5 font-medium">
                    {group.last_message?.body ? (
                      <span>
                        <span className="font-bold text-[#1B1E28] dark:text-slate-200">
                          {group.last_message.sender_name?.split(' ')[0]}:{' '}
                        </span>
                        {group.last_message.body}
                      </span>
                    ) : (
                      <span className="italic text-slate-400">Active discussion channel</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pl-2 shrink-0">
                {group.last_message?.created_at && (
                  <span className="text-[10px] font-semibold text-[#4E5969] dark:text-slate-400 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {formatTime(group.last_message.created_at)}
                  </span>
                )}
                {(group.unread_count || 0) > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#F36C21] text-white text-[10px] font-black animate-pulse shadow-xs">
                    {group.unread_count}
                  </span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Widget Footer - Anchored Cleanly */}
      <div className="pt-3 border-t border-[#E7EAF3] dark:border-slate-800 shrink-0 mt-auto flex items-center justify-between text-xs font-bold text-[#4E5969] dark:text-slate-400">
        <span>Active Batch Channels</span>
        <Link
          href={chatUrl}
          className="text-[#5B4BFF] hover:underline font-extrabold flex items-center gap-1"
        >
          <span>Open All Chats</span>
          <span>➔</span>
        </Link>
      </div>
    </div>
  );
}
