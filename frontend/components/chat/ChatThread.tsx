'use client';

import React, { useEffect, useRef } from 'react';
import { Users, Sparkles, MessageSquare, Clock, CheckCheck, ShieldCheck, ArrowLeft, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { ChatMessage, ChatGroup } from '../../hooks/useChat';
import ChatAttachmentChip from './ChatAttachmentChip';

interface ChatThreadProps {
  group: ChatGroup | null;
  messages: ChatMessage[];
  loading: boolean;
  onOpenMembers: () => void;
  onBack?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  currentUserId?: string;
  currentUserRole?: string;
}

export default function ChatThread({
  group,
  messages,
  loading,
  onOpenMembers,
  onBack,
  onToggleSidebar,
  isSidebarOpen = true,
  currentUserId,
  currentUserRole,
}: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Build a map of known sender names & avatars across thread messages & group members
  const { senderAvatarMap, senderNameMap } = React.useMemo(() => {
    const avatarMap = new Map<string, string>();
    const nameMap = new Map<string, string>();
    const isGeneric = (name?: string) =>
      !name || ['FACULTY USER', 'FACULTY MEMBER', 'USER', 'FACULTY', 'ADMIN USER', 'STUDENT USER'].includes(name.trim().toUpperCase());

    const grpMembers = (group as any)?.members;
    if (grpMembers && Array.isArray(grpMembers)) {
      grpMembers.forEach((m: any) => {
        const avatar = m.avatar_url || m.avatar || m.photo_url || m.photoUrl;
        if (avatar && typeof avatar === 'string' && avatar.trim()) {
          if (m.user_id) avatarMap.set(String(m.user_id).toLowerCase(), avatar);
          if (m.id) avatarMap.set(String(m.id).toLowerCase(), avatar);
          if (m.name) avatarMap.set(String(m.name).toLowerCase().trim(), avatar);
        }
        if (m.name && !isGeneric(m.name)) {
          if (m.user_id) nameMap.set(String(m.user_id).toLowerCase(), m.name);
          if (m.id) nameMap.set(String(m.id).toLowerCase(), m.name);
        }
      });
    }
    messages.forEach((msg) => {
      const avatar = msg.sender_avatar;
      if (avatar && typeof avatar === 'string' && avatar.trim()) {
        if (msg.sender_id) avatarMap.set(String(msg.sender_id).toLowerCase(), avatar);
        if (msg.sender_name) avatarMap.set(String(msg.sender_name).toLowerCase().trim(), avatar);
      }
      if (msg.sender_name && !isGeneric(msg.sender_name)) {
        if (msg.sender_id) nameMap.set(String(msg.sender_id).toLowerCase(), msg.sender_name);
      }
    });
    return { senderAvatarMap: avatarMap, senderNameMap: nameMap };
  }, [messages, group]);

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
      <div className="flex-1 flex flex-col min-h-0 bg-[#F6F8FC]/50 dark:bg-slate-900/40 overflow-hidden">
        {onToggleSidebar && !isSidebarOpen && (
          <div className="h-16 px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-[#E7EAF3] dark:border-slate-800 flex items-center shrink-0">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 text-[#4E5969] dark:text-slate-200 border border-[#E7EAF3] dark:border-slate-700 hover:bg-orange-50 hover:text-[#F36C21] dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-xs"
              title="Show Batches List"
            >
              <PanelLeftOpen className="w-4 h-4 text-[#F36C21]" />
              <span className="text-[11px] font-bold text-[#1B1E28] dark:text-slate-200">Show Batches</span>
            </button>
          </div>
        )}
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
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
      {/* Thread Header Banner */}
      <div className="h-16 px-4 sm:px-6 border-b border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 text-[#4E5969] dark:text-slate-200 border border-[#E7EAF3] dark:border-slate-700 hover:bg-orange-50 hover:text-[#F36C21] dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-xs shrink-0"
              title={isSidebarOpen ? "Hide Batches List" : "Show Batches List"}
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="w-4 h-4 text-[#F36C21]" />
              ) : (
                <PanelLeftOpen className="w-4 h-4 text-[#F36C21]" />
              )}
            </button>
          )}

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="lg:hidden p-2 rounded-xl hover:bg-[#F6F8FC] dark:hover:bg-slate-800 text-[#4E5969] dark:text-slate-400 transition-colors"
              title="Back to Batches"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#F36C21] to-[#FF8C42] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm shadow-orange-500/20">
            {group.batch_year ? group.batch_year.slice(-2) : '25'}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-[#1B1E28] dark:text-white truncate">
                {group.name}
              </h2>
              {group.batch_year && (
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/60 text-[#F36C21] dark:text-orange-400 font-extrabold text-[10px] tracking-wide shrink-0">
                  {group.batch_year} BATCH
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#4E5969] dark:text-slate-400 font-medium truncate">
              {group.department_name || 'Academic Group'} • Group Thread
            </p>
          </div>
        </div>

        {/* Group Info Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenMembers}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-[#4E5969] dark:text-slate-300 hover:text-[#5B4BFF] border border-[#E7EAF3] dark:border-slate-700 font-bold text-xs transition-all cursor-pointer shadow-2xs"
          >
            <Users className="w-3.5 h-3.5" />
            <span>{group.member_count || 0} Members</span>
          </button>
        </div>
      </div>

      {/* Message Stream Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 min-h-0 bg-[#F6F8FC]/30 dark:bg-slate-950/30">
        {loading ? (
          <div className="flex flex-col gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`flex gap-3 max-w-[70%] ${
                  i % 2 === 0 ? 'mr-auto' : 'ml-auto flex-row-reverse'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-24 animate-pulse" />
                  <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-2xl w-48 sm:w-64 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/50 text-[#F36C21] flex items-center justify-center mb-3">
              <Sparkles className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-black text-[#1B1E28] dark:text-white">
              Start of discussion in {group.name}
            </h4>
            <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-1 max-w-sm">
              Be the first to post a study update, announce practical class schedules, or attach learning materials.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn =
              currentUserId && msg.sender_id
                ? String(currentUserId).toLowerCase() === String(msg.sender_id).toLowerCase()
                : false;

            const isFaculty = (msg.sender_role || '').toUpperCase() === 'FACULTY';
            const isAdmin =
              (msg.sender_role || '').toUpperCase() === 'ADMIN' ||
              (msg.sender_role || '').toUpperCase() === 'SUPER_ADMIN' ||
              (msg.sender_role || '').toUpperCase() === 'COLLEGE_ADMIN';

            const prevMsg = messages[index - 1];
            const isDifferentDay = !prevMsg || new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();

            const isGenericName = (name?: string) => {
              if (!name) return true;
              const n = name.toUpperCase().trim();
              return (
                n === 'FACULTY USER' ||
                n === 'FACULTY MEMBER' ||
                n === 'USER' ||
                n === 'FACULTY' ||
                n === 'ADMIN USER' ||
                n === 'ADMIN' ||
                n === 'STUDENT'
              );
            };

            const resolvedName =
              (!isGenericName(msg.sender_name) ? msg.sender_name : null) ||
              (msg.sender_id ? senderNameMap.get(String(msg.sender_id).toLowerCase()) : null) ||
              (isFaculty && group?.members?.find(m => (m.role || '').toUpperCase() === 'FACULTY' && !isGenericName(m.name))?.name) ||
              msg.sender_name ||
              (isFaculty ? 'Faculty Member' : 'User');

            const resolvedAvatar =
              msg.sender_avatar ||
              (msg.sender_id ? senderAvatarMap.get(String(msg.sender_id).toLowerCase()) : null) ||
              (msg.sender_name ? senderAvatarMap.get(String(msg.sender_name).toLowerCase().trim()) : null) ||
              (resolvedName ? senderAvatarMap.get(String(resolvedName).toLowerCase().trim()) : null);

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
                  {resolvedAvatar ? (
                    <img
                      src={resolvedAvatar}
                      alt={resolvedName}
                      className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-500/20 shrink-0 shadow-xs"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                        const fb = (e.target as HTMLElement).parentElement?.querySelector('.avatar-fallback') as HTMLElement;
                        if (fb) fb.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-9 h-9 rounded-xl items-center justify-center font-black text-xs shrink-0 shadow-xs uppercase ring-2 avatar-fallback ${
                      resolvedAvatar ? 'hidden' : 'flex'
                    } ${
                      isFaculty
                        ? 'bg-gradient-to-tr from-[#2D2575] via-[#5B4BFF] to-[#7867FF] text-white ring-[#5B4BFF]/30'
                        : isAdmin
                        ? 'bg-gradient-to-tr from-amber-500 to-[#F36C21] text-white ring-[#F36C21]/30'
                        : 'bg-gradient-to-tr from-[#00C48C] to-emerald-700 text-white ring-[#00C48C]/30'
                    }`}
                    title={`${resolvedName} (${msg.sender_role})`}
                  >
                    {getInitials(resolvedName)}
                  </div>

                  {/* Message Bubble Content */}
                  <div className={`flex flex-col min-w-0 ${isOwn ? 'items-end' : 'items-start'}`}>
                    {/* Sender Header with DP Badge and Full Name */}
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-xs font-black text-[#1B1E28] dark:text-white">
                        {isOwn ? 'You' : resolvedName}
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
