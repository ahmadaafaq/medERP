'use client';

import React, { useState, useEffect } from 'react';
import ChatSidebar from './ChatSidebar';
import ChatThread from './ChatThread';
import ChatComposer from './ChatComposer';
import ChatMembersModal from './ChatMembersModal';
import ChatAddBatchModal from './ChatAddBatchModal';
import { useChat } from '../../hooks/useChat';

interface ChatWorkspaceProps {
  role?: 'FACULTY' | 'STUDENT' | 'ADMIN';
}

export default function ChatWorkspace({ role = 'FACULTY' }: ChatWorkspaceProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isAddBatchModalOpen, setIsAddBatchModalOpen] = useState(false);

  const {
    groups,
    selectedGroup,
    setSelectedGroup,
    messages,
    members,
    loadingGroups,
    loadingMessages,
    loadingMembers,
    searchQuery,
    setSearchQuery,
    selectedYearFilter,
    setSelectedYearFilter,
    sendMessage,
    uploadAttachment,
    syncGroups,
    joinBatchGroup,
  } = useChat(role);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) setCurrentUser(JSON.parse(raw));
    } catch {}
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] rounded-[22px] overflow-hidden bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-xl shadow-purple-950/5 font-sans">
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <ChatSidebar
          groups={groups}
          selectedGroup={selectedGroup}
          onSelectGroup={setSelectedGroup}
          loading={loadingGroups}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedYearFilter={selectedYearFilter}
          onYearFilterChange={setSelectedYearFilter}
          role={role}
          onSync={role === 'ADMIN' ? syncGroups : undefined}
          onOpenAddBatch={() => setIsAddBatchModalOpen(true)}
        />

        {/* Right Chat Thread & Composer Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full bg-[#F6F8FC] dark:bg-slate-900/60 overflow-hidden">
          <ChatThread
            group={selectedGroup}
            messages={messages}
            loading={loadingMessages}
            onOpenMembers={() => setIsMembersModalOpen(true)}
            currentUserId={currentUser?.id || currentUser?.sub}
            currentUserRole={currentUser?.role || role}
          />

          {selectedGroup && (
            <ChatComposer
              onSend={sendMessage}
              onUploadAttachment={uploadAttachment}
            />
          )}
        </div>
      </div>

      {/* Members Roster Modal */}
      {selectedGroup && (
        <ChatMembersModal
          isOpen={isMembersModalOpen}
          onClose={() => setIsMembersModalOpen(false)}
          group={selectedGroup}
          members={members}
          loading={loadingMembers}
        />
      )}

      {/* Add / Select Batch Discussion Modal */}
      <ChatAddBatchModal
        isOpen={isAddBatchModalOpen}
        onClose={() => setIsAddBatchModalOpen(false)}
        onAddBatch={joinBatchGroup}
      />
    </div>
  );
}

