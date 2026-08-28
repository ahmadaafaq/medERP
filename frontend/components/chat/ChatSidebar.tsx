'use client';

import React from 'react';
import { Search, Users, RefreshCw, MessageSquare, Plus, Filter } from 'lucide-react';
import { ChatGroup } from '../../hooks/useChat';

interface ChatSidebarProps {
  groups: ChatGroup[];
  selectedGroup: ChatGroup | null;
  onSelectGroup: (group: ChatGroup) => void;
  loading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedYearFilter: string;
  onYearFilterChange: (year: string) => void;
  role: 'FACULTY' | 'STUDENT' | 'ADMIN';
  onSync?: () => void;
  onOpenAddBatch?: () => void;
}

export default function ChatSidebar({
  groups,
  selectedGroup,
  onSelectGroup,
  loading,
  searchQuery,
  onSearchChange,
  selectedYearFilter,
  onYearFilterChange,
  role,
  onSync,
  onOpenAddBatch,
}: ChatSidebarProps) {
  // Extract distinct batch years from groups
  const batchYears = Array.from(new Set(groups.map((g) => g.batch_year))).sort().reverse();

  const formatMessageTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      }
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="w-full sm:w-80 md:w-96 bg-white dark:bg-slate-900 border-r border-[#E7EAF3] dark:border-slate-800 flex flex-col h-full shrink-0">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-[#E7EAF3] dark:border-slate-800 bg-[#F6F8FC] dark:bg-slate-900 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-black text-[#1B1E28] dark:text-white uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#F36C21] shrink-0" />
            <span className="truncate">Batch Chat Groups</span>
          </h2>
          <p className="text-[11px] text-[#4E5969] dark:text-slate-400 font-medium truncate">
            {role === 'ADMIN' ? 'All College Channels' : role === 'FACULTY' ? 'My Department Batches' : 'Enrolled Batch Discussions'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenAddBatch && (
            <button
              type="button"
              onClick={onOpenAddBatch}
              className="px-2.5 py-1.5 rounded-xl bg-[#F36C21] hover:bg-[#E05B10] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
              title="Add a course/department batch discussion"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Batch</span>
            </button>
          )}

          {role === 'ADMIN' && onSync && (
            <button
              type="button"
              onClick={onSync}
              className="p-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-[#F36C21]/10 text-[#F36C21] border border-[#E7EAF3] dark:border-slate-700 transition-all shadow-xs cursor-pointer"
              title="Sync & provision latest batch groups"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Search & Batch Year Filter */}
      <div className="p-3 border-b border-[#E7EAF3] dark:border-slate-800 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search department or batch..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs text-[#1B1E28] dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F36C21]"
          />
        </div>

        {/* Year Filter Chips */}
        {batchYears.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => onYearFilterChange('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                selectedYearFilter === 'ALL'
                  ? 'bg-[#F36C21] text-white shadow-xs'
                  : 'bg-[#F6F8FC] dark:bg-slate-800 text-[#4E5969] dark:text-slate-300 border border-[#E7EAF3] dark:border-slate-700'
              }`}
            >
              All Years
            </button>
            {batchYears.map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => onYearFilterChange(year)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                  selectedYearFilter === year
                    ? 'bg-[#F36C21] text-white shadow-xs'
                    : 'bg-[#F6F8FC] dark:bg-slate-800 text-[#4E5969] dark:text-slate-300 border border-[#E7EAF3] dark:border-slate-700'
                }`}
              >
                {year} Batch
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/40 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
            </div>
          ))
        ) : groups.length === 0 ? (
          <div className="p-6 text-center text-[#4E5969] dark:text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#F36C21] flex items-center justify-center mx-auto text-xl shadow-inner">
              💬
            </div>
            <div>
              <p className="text-xs font-black text-[#1B1E28] dark:text-white">No Batch Groups in List</p>
              <p className="text-[11px] mt-1 text-[#4E5969] dark:text-slate-400">
                {searchQuery
                  ? 'No discussions match your filter.'
                  : 'Select your course, branch/department, and batch to add to your list.'}
              </p>
            </div>
            {onOpenAddBatch && (
              <button
                type="button"
                onClick={onOpenAddBatch}
                className="w-full py-2.5 px-3 rounded-xl bg-[#F36C21] hover:bg-[#E05B10] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Select & Add Batch Discussion</span>
              </button>
            )}
          </div>
        ) : (
          groups.map((group) => {
            const isSelected = selectedGroup?.id === group.id;
            const hasUnread = (group.unread_count || 0) > 0;

            return (
              <div
                key={group.id}
                onClick={() => onSelectGroup(group)}
                className={`p-3 rounded-2xl cursor-pointer transition-all border text-left relative group ${
                  isSelected
                    ? 'bg-[#F36C21] text-white border-[#F36C21] shadow-lg shadow-orange-500/20'
                    : 'bg-white dark:bg-slate-800/80 border-[#E7EAF3] dark:border-slate-800 hover:bg-[#F6F8FC] dark:hover:bg-slate-700/80 hover:border-[#F36C21]/40'
                }`}
              >
                {/* Active Indicator Bar */}
                {isSelected && (
                  <span className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r-md bg-white"></span>
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-orange-50 dark:bg-orange-950/60 text-[#F36C21] border border-[#F36C21]/20'
                      }`}
                    >
                      {group.batch_year}
                    </span>
                    <h4
                      className={`text-xs font-black truncate ${
                        isSelected ? 'text-white' : 'text-[#1B1E28] dark:text-white'
                      }`}
                    >
                      {group.department_name || group.name}
                    </h4>
                  </div>

                  {group.last_message?.created_at && (
                    <span
                      className={`text-[10px] font-semibold shrink-0 ${
                        isSelected ? 'text-white/80' : 'text-[#4E5969] dark:text-slate-400'
                      }`}
                    >
                      {formatMessageTime(group.last_message.created_at)}
                    </span>
                  )}
                </div>

                {/* Subtitle / Last message preview */}
                <div className="flex items-center justify-between gap-2 mt-1.5 pl-0.5">
                  <p
                    className={`text-[11px] truncate flex-1 font-medium ${
                      isSelected
                        ? 'text-white/90'
                        : hasUnread
                        ? 'text-[#1B1E28] dark:text-slate-100 font-bold'
                        : 'text-[#4E5969] dark:text-slate-400'
                    }`}
                  >
                    {group.last_message?.body ? (
                      <span>
                        <span className="opacity-80 font-bold">
                          {group.last_message.sender_name?.split(' ')[0]}:{' '}
                        </span>
                        {group.last_message.body}
                      </span>
                    ) : (
                      <span className="italic opacity-70">No messages yet</span>
                    )}
                  </p>

                  {hasUnread && (
                    <span className="px-2 py-0.5 rounded-full bg-[#F36C21] text-white text-[10px] font-black shrink-0 shadow-sm animate-pulse">
                      {group.unread_count}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Footer Info */}
      <div className="p-3 bg-[#F6F8FC] dark:bg-slate-900 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between text-[11px] text-[#4E5969] dark:text-slate-400 font-medium">
        <span>{groups.length} active groups</span>
        <span className="font-bold text-[#F36C21] uppercase tracking-wider text-[10px]">
          {role} VIEW
        </span>
      </div>
    </div>
  );
}
