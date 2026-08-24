'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import ChatWorkspace from '../../../components/chat/ChatWorkspace';

export default function GenericChatPage() {
  const [role, setRole] = useState<'student' | 'faculty' | 'admin' | 'clerk' | 'warden'>('faculty');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRole = (localStorage.getItem('role') || 'FACULTY').toLowerCase() as any;
      if (['student', 'faculty', 'admin', 'clerk', 'warden'].includes(storedRole)) {
        setRole(storedRole);
      }
    }
  }, []);

  const chatRole = (role === 'admin' ? 'ADMIN' : role === 'student' ? 'STUDENT' : 'FACULTY') as 'FACULTY' | 'STUDENT' | 'ADMIN';

  return (
    <div className="flex h-screen bg-[#F6F8FC] dark:bg-slate-950 font-sans overflow-hidden">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title="Department & Batch Chat" />
        <main className="flex-1 p-6 overflow-hidden">
          <ChatWorkspace role={chatRole} />
        </main>
      </div>
    </div>
  );
}
