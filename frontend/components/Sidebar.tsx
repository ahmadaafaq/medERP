'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  role: 'student' | 'faculty' | 'admin' | 'warden' | 'clerk';
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [misReportsOpen, setMisReportsOpen] = useState(true);
  const [collegeDisplayName, setCollegeDisplayName] = useState<string>('SRMS CET, BAREILLY');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('college_name') || localStorage.getItem('tenantName');
      const slug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || '';
      const colgCd = localStorage.getItem('colg_cd');
      
      if (storedName) {
        setCollegeDisplayName(storedName);
      } else if (colgCd === '1' || slug.includes('cet-bareilly') || slug === '1') {
        setCollegeDisplayName('SRMS CET, BAREILLY');
      } else if (colgCd === '2' || slug.includes('cetr-bareilly') || slug === '2') {
        setCollegeDisplayName('SRMS CETR, BAREILLY');
      } else if (slug.includes('ims')) {
        setCollegeDisplayName('SRMS IMS');
      } else if (slug) {
        setCollegeDisplayName(slug.toUpperCase().replace('TENANT_', '').replace('TENANT-', ''));
      }
    }
  }, []);

  useEffect(() => {
    if (pathname?.startsWith('/dashboard/faculty/reports') || pathname?.startsWith('/dashboard/admin/reports')) {
      setMisReportsOpen(true);
    }
  }, [pathname]);

  const getLinkClass = (href: string) => {
    const isRootTab = href === '/dashboard/faculty' || href === '/dashboard/student' || href === '/dashboard/admin' || href === '/dashboard/clerk' || href === '/dashboard/warden';
    const isActive = isRootTab ? pathname === href : (pathname === href || (!!pathname && pathname.startsWith(href + '/')));
    return isActive
      ? 'flex items-center gap-2.5 px-3.5 py-2.5 rounded-r-xl font-bold text-white bg-white/15 border-l-4 border-[#F36C21] shadow-lg shadow-purple-950/20 backdrop-blur-md transition-all group'
      : 'flex items-center gap-2.5 px-3.5 py-2.5 rounded-r-xl font-medium text-purple-200/80 hover:text-white hover:bg-white/10 border-l-4 border-transparent transition-all group';
  };

  return (
    <aside className="w-64 bg-[#2D2575] text-white p-4 sticky top-0 h-screen overflow-y-auto flex flex-col justify-between shrink-0 transition-colors z-20 shadow-2xl shadow-purple-950/40 rounded-r-none">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 pt-1 pb-3 border-b border-white/10 min-w-0">
          <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-tr from-[#F36C21] via-orange-500 to-amber-500 flex items-center justify-center font-black text-white text-base shadow-lg shadow-orange-500/30 border border-white/20">
            M
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <h1 
              className="font-black text-sm text-white tracking-wide uppercase truncate block" 
              title={collegeDisplayName}
            >
              {collegeDisplayName}
            </h1>
            <p className="text-[10px] text-[#F36C21] font-extrabold uppercase tracking-wider truncate">
              {role} space
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-2 text-xs font-medium pr-1">
          {role === 'admin' ? (
            <>
              <Link href="/dashboard/admin" className={getLinkClass('/dashboard/admin')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>College KPIs</span>
              </Link>

              <Link href="/dashboard/admin/college-master" className={getLinkClass('/dashboard/admin/college-master')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>College Master</span>
              </Link>

              <Link href="/dashboard/admin/admin-master" className={getLinkClass('/dashboard/admin/admin-master')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Admin Master</span>
              </Link>

              <Link href="/dashboard/admin/student-master" className={getLinkClass('/dashboard/admin/student-master')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v7" />
                </svg>
                <span>Student Master</span>
              </Link>

              <Link href="/dashboard/admin/staff-master" className={getLinkClass('/dashboard/admin/staff-master')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Staff Master</span>
              </Link>

              <Link href="/dashboard/admin/subject-linker" className={getLinkClass('/dashboard/admin/subject-linker')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span>Subject Linker</span>
              </Link>

              <Link href="/dashboard/admin/timetable-design" className={getLinkClass('/dashboard/admin/timetable-design')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Design Timetable</span>
              </Link>

              <Link href="/dashboard/admin/attendance-master" className={getLinkClass('/dashboard/admin/attendance-master')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span>Attendance Portal Sync</span>
              </Link>

              <Link href="/dashboard/admin/attendance-biometric" className={getLinkClass('/dashboard/admin/attendance-biometric')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Attendance — Bio-Metric/CCTV</span>
              </Link>

              <Link href="/dashboard/admin/assessment" className={getLinkClass('/dashboard/admin/assessment')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Assessment & Q-Bank</span>
              </Link>

              <Link href="/dashboard/admin/assessment-marks" className={getLinkClass('/dashboard/admin/assessment-marks')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Assessment Marks Entry</span>
              </Link>

              {/* Expandable MIS Reports Accordion for Admin */}
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setMisReportsOpen(!misReportsOpen)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-r-xl font-bold transition-all group ${
                    pathname?.startsWith('/dashboard/admin/reports')
                      ? 'text-white bg-white/15 border-l-4 border-[#F36C21] shadow-lg shadow-purple-950/20'
                      : 'text-purple-200/80 hover:text-white hover:bg-white/10 border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>MIS Reports</span>
                  </div>
                  <span className="w-5 h-5 rounded-md bg-white/20 text-white font-black flex items-center justify-center text-xs shadow-inner">
                    {misReportsOpen ? '−' : '+'}
                  </span>
                </button>

                {misReportsOpen && (
                  <div className="pl-6 pr-1 space-y-1 pt-1 border-l-2 border-white/10 ml-3">
                    <Link
                      href="/dashboard/admin/reports/attendance"
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                        pathname === '/dashboard/admin/reports' || pathname === '/dashboard/admin/reports/attendance'
                          ? 'font-black text-white bg-[#5B4BFF] shadow-sm'
                          : 'font-medium text-purple-200/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F36C21]"></span>
                      <span>1. Attendance Report</span>
                    </Link>

                    <Link
                      href="/dashboard/admin/reports/theory-result"
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                        pathname === '/dashboard/admin/reports/theory-result' || pathname === '/dashboard/admin/reports/theory'
                          ? 'font-black text-white bg-[#5B4BFF] shadow-sm'
                          : 'font-medium text-purple-200/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FFB020]"></span>
                      <span>2. Theory Result</span>
                    </Link>
                  </div>
                )}
              </div>
            </>
          ) : role === 'faculty' ? (
            <>
              <Link href="/dashboard/faculty" className={getLinkClass('/dashboard/faculty')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Teaching Dashboard</span>
              </Link>

              <Link href="/dashboard/faculty/profile" className={getLinkClass('/dashboard/faculty/profile')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Faculty Profile</span>
              </Link>

              <Link href="/dashboard/faculty/students" className={getLinkClass('/dashboard/faculty/students')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
                <span>Student Info</span>
              </Link>

              <Link href="/dashboard/faculty/department-faculty" className={getLinkClass('/dashboard/faculty/department-faculty')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Department Faculty</span>
              </Link>

              <Link href="/dashboard/faculty/schedule" className={getLinkClass('/dashboard/faculty/schedule')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Schedule</span>
              </Link>

              <Link href="/dashboard/faculty/attendance" className={getLinkClass('/dashboard/faculty/attendance')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span>Attendance Portal Sync</span>
              </Link>

              <Link href="/dashboard/faculty/attendance-biometric" className={getLinkClass('/dashboard/faculty/attendance-biometric')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Attendance — Bio-Metric/CCTV</span>
              </Link>

              <Link href="/dashboard/faculty/assessment" className={getLinkClass('/dashboard/faculty/assessment')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Assessment & Q-Bank</span>
              </Link>

              <Link href="/dashboard/faculty/marks" className={getLinkClass('/dashboard/faculty/marks')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Assessment Marks</span>
              </Link>

              <Link href="/dashboard/faculty/lessons" className={getLinkClass('/dashboard/faculty/lessons')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>Lesson Uploads</span>
              </Link>

              {/* Expandable MIS Reports Accordion */}
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setMisReportsOpen(!misReportsOpen)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-r-xl font-bold transition-all group ${
                    pathname?.startsWith('/dashboard/faculty/reports')
                      ? 'text-white bg-white/15 border-l-4 border-[#F36C21] shadow-lg shadow-purple-950/20'
                      : 'text-purple-200/80 hover:text-white hover:bg-white/10 border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>MIS Reports</span>
                  </div>
                  <span className="w-5 h-5 rounded-md bg-white/20 text-white font-black flex items-center justify-center text-xs shadow-inner">
                    {misReportsOpen ? '−' : '+'}
                  </span>
                </button>

                {misReportsOpen && (
                  <div className="pl-6 pr-1 space-y-1 pt-1 border-l-2 border-white/10 ml-3">
                    <Link
                      href="/dashboard/faculty/reports"
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                        pathname === '/dashboard/faculty/reports' || pathname === '/dashboard/faculty/reports/attendance'
                          ? 'font-black text-white bg-[#5B4BFF] shadow-sm'
                          : 'font-medium text-purple-200/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F36C21]"></span>
                      <span>1. Attendance Report</span>
                    </Link>

                    <Link
                      href="/dashboard/faculty/reports/theory-result"
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                        pathname === '/dashboard/faculty/reports/theory-result' || pathname === '/dashboard/faculty/reports/theory'
                          ? 'font-black text-white bg-[#5B4BFF] shadow-sm'
                          : 'font-medium text-purple-200/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FFB020]"></span>
                      <span>2. Theory Result</span>
                    </Link>
                  </div>
                )}
              </div>
            </>
          ) : role === 'warden' ? (
            <>
              <Link href="/dashboard/warden" className={getLinkClass('/dashboard/warden')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>Hostel Warden Console</span>
              </Link>
              <Link href="/dashboard/admin/student-master" className={getLinkClass('/dashboard/admin/student-master')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
                <span>Resident Roster</span>
              </Link>
            </>
          ) : role === 'clerk' ? (
            <>
              <Link href="/dashboard/clerk" className={getLinkClass('/dashboard/clerk')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Clerk Data Entry</span>
              </Link>
              <Link href="/dashboard/clerk/attendance" className={getLinkClass('/dashboard/clerk/attendance')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span>Attendance Portal Sync</span>
              </Link>
              <Link href="/dashboard/clerk/attendance-biometric" className={getLinkClass('/dashboard/clerk/attendance-biometric')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Attendance — Bio-Metric/CCTV</span>
              </Link>
              <Link href="/dashboard/admin/assessment-marks" className={getLinkClass('/dashboard/admin/assessment-marks')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Marks Entry</span>
              </Link>
            </>
          ) : (
            <>
              <Link href="/dashboard/student" className={getLinkClass('/dashboard/student')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Dashboard</span>
              </Link>

              <Link href="/dashboard/student/timetable" className={getLinkClass('/dashboard/student/timetable')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Schedule</span>
              </Link>

              <Link href="/dashboard/student/attendance" className={getLinkClass('/dashboard/student/attendance')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span>Attendance Portal Sync</span>
              </Link>

              <Link href="/dashboard/student/attendance-biometric" className={getLinkClass('/dashboard/student/attendance-biometric')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Attendance — Bio-Metric/CCTV</span>
              </Link>

              <Link href="/dashboard/student/assessment" className={getLinkClass('/dashboard/student/assessment')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Assessment & Tests</span>
              </Link>

              <Link href="/dashboard/student/marks" className={getLinkClass('/dashboard/student/marks')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Assessment Marks & Reports</span>
              </Link>

              <Link href="/dashboard/student/lessons" className={getLinkClass('/dashboard/student/lessons')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>Lessons & Materials</span>
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Tenant Footer Badge */}
      <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800/50 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between font-mono">
        <span className="uppercase tracking-wider font-bold">Context</span>
        <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-bold uppercase tracking-widest text-[9px] shadow-sm shadow-indigo-500/5">
          srms
        </span>
      </div>
    </aside>
  );
}

