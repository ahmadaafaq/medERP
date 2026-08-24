'use client';

import React, { useEffect, useRef } from 'react';
import { Users, Sparkles, MessageSquare, Clock, CheckCheck, ShieldCheck } from 'lucide-react';
import { ChatMessage, ChatGroup } from '../../hooks/useChat';
import ChatAttachmentChip from './ChatAttachmentChip';

interface ChatThreadProps {
  group: ChatGroup | null;
  messages: ChatMessage[];
  loading: boolean;
  onOpenMembers: () => void;
  currentUserId?: string;
  currentUserRole?: string;
}

export default function ChatThread({
  group,
  messages,
  loading,
  onOpenMembers,
  currentUserId,
  currentUserRole,
}: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateDivider = (dateStr?: string) => {
    if (!dateStr) return 'Today';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Today';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (!group) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#F6F8FC] dark:bg-slate-900/60 text-center">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-[#5B4BFF] flex items-center justify-center mb-4 shadow-sm">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h3 className="text-base font-black text-[#1B1E28] dark:text-white">
          No Batch Group Selected
        </h3>
        <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-1 max-w-sm">
          Pick a department batch from the sidebar to view discussions, share lecture updates, or ask questions.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F6F8FC]/50 dark:bg-slate-900/40 overflow-hidden">
      {/* Thread Header */}
      <div className="h-16 px-6 bg-white dark:bg-slate-900 border-b border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between shrink-0 shadow-xs z-10">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2D2575] via-[#5B4BFF] to-[#7867FF] text-white flex items-center justify-center font-black text-sm shadow-md shadow-indigo-500/20 shrink-0">
            {group.batch_year ? group.batch_year.slice(-2) : '25'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-[#1B1E28] dark:text-white truncate">
                {group.name}
              </h2>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/60 text-[#F36C21] border border-[#F36C21]/20 uppercase tracking-wider">
                {group.batch_year} Batch
              </span>
            </div>
            <p className="text-[11px] text-[#4E5969] dark:text-slate-400 truncate">
              {group.department_name || 'Academic Department'} · Group Thread
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenMembers}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-850 hover:bg-[#5B4BFF]/10 text-[#2D2575] dark:text-indigo-300 border border-[#E7EAF3] dark:border-slate-700 text-xs font-bold transition-all hover:scale-105 shadow-xs"
            title="View Group Roster"
          >
            <Users className="w-3.5 h-3.5 text-[#5B4BFF]" />
            <span>{group.member_count || 0} Members</span>
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 max-w-[70%] animate-pulse ${
                i % 2 === 0 ? 'mr-auto' : 'ml-auto flex-row-reverse'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0"></div>
              <div className="space-y-1.5 flex-1">
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
                <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full"></div>
              </div>
            </div>
          ))
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[#4E5969] dark:text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-[#E7EAF3] dark:border-slate-700 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-[#F36C21]" />
            </div>
            <h4 className="text-sm font-black text-[#1B1E28] dark:text-white">
              No Messages in this Batch Group Yet
            </h4>
            <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-1 max-w-sm">
              Start the discussion! Faculty can post lecture announcements, syllabus notes, or file attachments for {group.name}.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = msg.sender_id === currentUserId || (currentUserRole && msg.sender_role === currentUserRole && msg.sender_id === currentUserId);
            const isFaculty = msg.sender_role === 'FACULTY' || msg.sender_role === 'HOD';
            const isAdmin = msg.sender_role === 'ADMIN' || msg.sender_role === 'SUPER_ADMIN';

            // Show date divider if first message or different day
            const prevMsg = messages[index - 1];
            const isDifferentDay = !prevMsg || new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();

            return (
              <React.Fragment key={msg.id}>
                {isDifferentDay && (
                  <div className="flex items-center justify-center my-4">
                    <span className="px-3 py-1 rounded-full bg-[#E7EAF3]/70 dark:bg-slate-800 text-[10px] font-black text-[#4E5969] dark:text-slate-400 uppercase tracking-wider">
                      {formatDateDivider(msg.created_at)}
                    </span>
                  </div>
                )}

                <div
                  className={`flex items-end gap-2.5 max-w-[85%] sm:max-w-[70%] group ${
                    isOwn ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  {/* Sender Profile Photo / DP */}
                  {msg.sender_avatar ? (
                    <img
                      src={msg.sender_avatar}
                      alt={msg.sender_name}
                      className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-500/20 shrink-0 shadow-xs"
                    />
                  ) : (
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-xs uppercase ring-2 ${
                        isFaculty
                          ? 'bg-gradient-to-tr from-[#2D2575] via-[#5B4BFF] to-[#7867FF] text-white ring-[#5B4BFF]/30'
                          : isAdmin
                          ? 'bg-gradient-to-tr from-amber-500 to-[#F36C21] text-white ring-[#F36C21]/30'
                          : 'bg-gradient-to-tr from-[#00C48C] to-emerald-700 text-white ring-[#00C48C]/30'
                      }`}
                      title={`${msg.sender_name} (${msg.sender_role})`}
                    >
                      {getInitials(msg.sender_name)}
                    </div>
                  )}

                  {/* Message Bubble Content */}
                  <div className={`flex flex-col min-w-0 ${isOwn ? 'items-end' : 'items-start'}`}>
                    {/* Sender Header with DP Badge and Full Name */}
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-xs font-black text-[#1B1E28] dark:text-white">
                        {isOwn ? 'You' : msg.sender_name}
                      </span>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.2 rounded-md uppercase tracking-wider ${
                          isFaculty
                            ? 'bg-indigo-50 dark:bg-indigo-950 text-[#5B4BFF]'
                            : isAdmin
                            ? 'bg-amber-50 dark:bg-amber-950 text-amber-600'
                            : 'bg-emerald-50 dark:bg-emerald-950 text-[#00C48C]'
                        }`}
                      >
                        {msg.sender_role}
                      </span>
                    </div>

                    {/* Bubble */}
                    <div
                      className={`p-3.5 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed break-words shadow-sm transition-all ${
                        isOwn
                          ? 'bg-[#2D2575] text-white rounded-br-none'
                          : 'bg-white dark:bg-slate-800 text-[#1B1E28] dark:text-slate-100 border border-[#E7EAF3] dark:border-slate-700/80 rounded-bl-none'
                      }`}
                    >
                      {/* Body text */}
                      {msg.body && (
                        <p className="whitespace-pre-wrap">{msg.body}</p>
                      )}

                      {/* Attachments inside bubble */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className={`space-y-2 ${msg.body ? 'mt-2.5 pt-2.5 border-t ' + (isOwn ? 'border-white/20' : 'border-slate-100 dark:border-slate-700') : ''}`}>
                          {msg.attachments.map((att, attIdx) => (
                            <ChatAttachmentChip
                              key={attIdx}
                              attachment={att}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-[#4E5969] dark:text-slate-400 font-semibold">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{formatTimestamp(msg.created_at)}</span>
                      {isOwn && <CheckCheck className="w-3 h-3 text-[#00C48C] ml-0.5" />}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
