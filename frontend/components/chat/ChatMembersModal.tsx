'use client';

import React, { useState } from 'react';
import { X, Users, Search, GraduationCap, Award, Shield } from 'lucide-react';
import { ChatMember, ChatGroup } from '../../hooks/useChat';

interface ChatMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: ChatGroup;
  members: ChatMember[];
  loading: boolean;
}

export default function ChatMembersModal({
  isOpen,
  onClose,
  group,
  members,
  loading,
}: ChatMembersModalProps) {
  const [filterRole, setFilterRole] = useState<'ALL' | 'FACULTY' | 'STUDENT'>('ALL');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredMembers = members.filter((m) => {
    if (filterRole !== 'ALL' && m.role !== filterRole) return false;
    if (search.trim() && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const facultyCount = members.filter((m) => m.role === 'FACULTY').length;
  const studentCount = members.filter((m) => m.role === 'STUDENT').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-[#2D2575] text-white p-5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white border border-white/20">
              <Users className="w-5 h-5 text-[#F36C21]" />
            </div>
            <div>
              <h3 className="font-black text-base tracking-wide text-white">
                Group Roster & Members
              </h3>
              <p className="text-xs text-purple-200/90 font-medium">
                {group.name} · {members.length} members
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 bg-[#F6F8FC] dark:bg-slate-850/60 border-b border-[#E7EAF3] dark:border-slate-800 flex flex-col gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search member by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs text-[#1B1E28] dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterRole('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterRole === 'ALL'
                  ? 'bg-[#2D2575] text-white'
                  : 'bg-white dark:bg-slate-800 text-[#4E5969] dark:text-slate-300 border border-[#E7EAF3] dark:border-slate-700'
              }`}
            >
              All ({members.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterRole('FACULTY')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                filterRole === 'FACULTY'
                  ? 'bg-[#5B4BFF] text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-[#4E5969] dark:text-slate-300 border border-[#E7EAF3] dark:border-slate-700'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-[#F36C21]" />
              Faculty ({facultyCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterRole('STUDENT')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                filterRole === 'STUDENT'
                  ? 'bg-[#00C48C] text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-[#4E5969] dark:text-slate-300 border border-[#E7EAF3] dark:border-slate-700'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Students ({studentCount})
            </button>
          </div>
        </div>

        {/* Members List */}
        <div className="p-4 space-y-2 overflow-y-auto flex-1 max-h-[400px]">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/40">
                <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-1/4"></div>
                </div>
              </div>
            ))
          ) : filteredMembers.length === 0 ? (
            <div className="p-8 text-center text-[#4E5969] dark:text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-bold text-[#1B1E28] dark:text-white">No members found</p>
              <p className="text-[11px]">Try adjusting your search query or filter.</p>
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-xl border border-[#E7EAF3] dark:border-slate-800/80 bg-white dark:bg-slate-850/40 hover:bg-[#F6F8FC] dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.name}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/20 shrink-0 shadow-xs"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2D2575] to-[#5B4BFF] text-white font-black text-xs flex items-center justify-center uppercase shrink-0 shadow-xs ring-2 ring-[#5B4BFF]/20">
                      {member.name ? member.name.slice(0, 2) : 'U'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-black text-xs text-[#1B1E28] dark:text-white truncate">
                      {member.name}
                    </h4>
                    <p className="text-[10px] text-[#4E5969] dark:text-slate-400 truncate">
                      {member.email || `Member ID: ${member.user_id?.slice(0, 8)}`}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                    member.role === 'FACULTY'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-[#5B4BFF] border-[#5B4BFF]/20'
                      : member.role === 'ADMIN'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-[#FFB020] border-[#FFB020]/20'
                      : 'bg-emerald-50 dark:bg-emerald-950/60 text-[#00C48C] border-[#00C48C]/20'
                  }`}
                >
                  {member.role}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#F6F8FC] dark:bg-slate-900 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-[#4E5969] dark:text-slate-400 font-medium">
            Active department & batch participants
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#2D2575] text-white text-xs font-bold hover:bg-[#231c5e] transition-all shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
