'use client';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import AttendancePortal from '@/components/AttendancePortal';

export default function FacultyAttendancePage() {
  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-[#0F172A] text-[#1B1E28] dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar role="faculty" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Faculty Attendance Management Portal" />
        <main className="p-6 space-y-6 flex-1 flex flex-col">
          <AttendancePortal role="FACULTY" />
        </main>
      </div>
    </div>
  );
}
