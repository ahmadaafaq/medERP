'use client';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import DigitalLibraryPortal from '@/components/DigitalLibraryPortal';

export default function FacultyLibraryPage() {
  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="faculty" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Faculty Research & Digital E-Library — MedERP" />
        <main className="p-6 space-y-6 flex-1 flex flex-col">
          <DigitalLibraryPortal role="faculty" />
        </main>
      </div>
    </div>
  );
}
