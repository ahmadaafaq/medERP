'use client';

import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import ChatWorkspace from '../../../../components/chat/ChatWorkspace';

export default function StudentChatPage() {
  return (
    <div className="flex h-screen bg-[#F6F8FC] dark:bg-slate-950 font-sans overflow-hidden">
      <Sidebar role="student" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title="Class & Batch Discussions" />
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-hidden flex flex-col min-h-0">
          <ChatWorkspace role="STUDENT" />
        </main>
      </div>
    </div>
  );
}
