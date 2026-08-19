'use client';

import Sidebar from '../../../../../components/Sidebar';
import Header from '../../../../../components/Header';
import NoticeComposer from '../../../../../components/notices/NoticeComposer';
import Link from 'next/link';

export default function AdminNoticeComposePage() {
  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Notices & Circulars — Compose" />

        <main className="p-6 space-y-6 flex-1">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#4E5969] dark:text-slate-400">
              <Link href="/dashboard/admin" className="hover:text-[#5B4BFF]">
                Admin Dashboard
              </Link>
              <span>/</span>
              <Link href="/dashboard/admin/notices/sent" className="hover:text-[#5B4BFF]">
                Notices
              </Link>
              <span>/</span>
              <span className="text-[#1B1E28] dark:text-white">Compose Notice</span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/admin/notices/sent"
                className="px-4 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 text-xs font-extrabold text-[#1B1E28] dark:text-white shadow-soft hover:border-[#5B4BFF] transition-all"
              >
                📋 View Sent Notices
              </Link>
              <Link
                href="/dashboard/admin/notices/groups"
                className="px-4 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 text-xs font-extrabold text-[#1B1E28] dark:text-white shadow-soft hover:border-[#5B4BFF] transition-all"
              >
                👥 Notice Groups
              </Link>
            </div>
          </div>

          {/* Main Notice Composer */}
          <NoticeComposer />
        </main>
      </div>
    </div>
  );
}
