'use client';

import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import ChatWorkspace from '../../../../components/chat/ChatWorkspace';

export default function FacultyChatPage() {
  return (
    <div className="flex h-screen bg-[#F6F8FC] dark:bg-slate-950 font-sans overflow-hidden">
      <Sidebar role="faculty" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title="Faculty Batch Discussions" />
        <main className="flex-1 p-6 overflow-hidden">
          <ChatWorkspace role="FACULTY" />
        </main>
      </div>
    </div>
  );
}
