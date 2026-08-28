'use client';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import DigitalLibraryPortal from '@/components/DigitalLibraryPortal';

export default function ClerkLibraryPage() {
  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 font-sans">
      <Sidebar role="clerk" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Library & Digital E-Resource Center — MedERP" />
        <main className="p-6 flex-1">
          <DigitalLibraryPortal role="clerk" />
        </main>
      </div>
    </div>
  );
}
