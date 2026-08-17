'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import PulseLine from './common/PulseLine';

interface SidebarProps {
  role: 'student' | 'faculty' | 'admin' | 'warden' | 'clerk';
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

interface NavGroup {
  groupTitle?: string;
  items: NavItem[];
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [misReportsOpen, setMisReportsOpen] = useState(true);
  const [userName, setUserName] = useState('User');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [collegeName, setCollegeName] = useState('UNICAMPUS PLUS');

  useEffect(() => {
    if (pathname?.startsWith('/dashboard/faculty/reports')) {
      setMisReportsOpen(true);
    }
  }, [pathname]);

  useEffect(() => {
    try {
      const storedCollege = localStorage.getItem('collegeName');
      if (storedCollege) setCollegeName(storedCollege);

      const cached = localStorage.getItem('user');
      if (cached) {
        const u = JSON.parse(cached);
        const name = u.profile?.name || u.name || u.student_name || u.faculty_name || u.email?.split('@')[0] || 'User';
        const photo = u.profile?.photo_url || u.photoUrl || u.photo_url || null;
        setUserName(name);
        setUserAvatar(photo);
      }
    } catch (e) {}
  }, []);

  const isLinkActive = (href: string) => {
    const isRootTab =
      href === '/dashboard/faculty' ||
      href === '/dashboard/student' ||
      href === '/dashboard/admin' ||
      href === '/dashboard/clerk' ||
      href === '/dashboard/warden';
    return isRootTab
      ? pathname === href
      : pathname === href || (!!pathname && pathname.startsWith(href));
  };

  const getLinkClasses = (href: string) => {
    const active = isLinkActive(href);
    return `group flex items-center ${
      collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3.5 py-2.5'
    } rounded-2xl transition-all duration-200 select-none ${
      active
        ? 'bg-white/[0.14] text-white font-bold shadow-lg shadow-black/10 border-l-4 border-[#F36C21]'
        : 'text-white/80 hover:text-white hover:bg-white/[0.08] font-medium border-l-4 border-transparent'
    }`;
  };

  const getIconClasses = (href: string) => {
    const active = isLinkActive(href);
    return `w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
      active ? 'text-[#F36C21]' : 'text-white group-hover:text-[#F36C21]'
    }`;
  };

  // ── Navigation groups for each role ──
  const adminGroups: NavGroup[] = [
    {
      groupTitle: 'Overview',
      items: [
        {
          name: 'College KPIs',
          href: '/dashboard/admin',
          icon: (
            <svg className={getIconClasses('/dashboard/admin')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
        },
      ],
    },
    {
      groupTitle: 'Academics & Hierarchy',
      items: [
        {
          name: 'College Master',
          href: '/dashboard/admin/college-master',
          icon: (
            <svg className={getIconClasses('/dashboard/admin/college-master')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          ),
        },
        {
          name: 'Student Master',
          href: '/dashboard/admin/student-master',
          icon: (
            <svg className={getIconClasses('/dashboard/admin/student-master')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v7" />
            </svg>
          ),
        },
        {
          name: 'Staff Master',
          href: '/dashboard/admin/staff-master',
          icon: (
            <svg className={getIconClasses('/dashboard/admin/staff-master')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
        },
        {
          name: 'Subject Linker',
          href: '/dashboard/admin/subject-linker',
          icon: (
            <svg className={getIconClasses('/dashboard/admin/subject-linker')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          ),
        },
        {
          name: 'Design Timetable',
          href: '/dashboard/admin/timetable-design',
          icon: (
            <svg className={getIconClasses('/dashboard/admin/timetable-design')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
        },
        {
          name: 'Attendance Master',
          href: '/dashboard/admin/attendance-master',
          icon: (
            <svg className={getIconClasses('/dashboard/admin/attendance-master')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          ),
        },
        {
          name: 'MIS Attendance Reports',
          href: '/dashboard/admin/attendance-reports',
          icon: (
            <svg className={getIconClasses('/dashboard/admin/attendance-reports')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
        },
      ],
    },
    {
      groupTitle: 'Assessments & Logbook',
      items: [
        {
          name: 'Assessment & Q-Bank',
          href: '/dashboard/admin/assessment',
          icon: (
            <svg className={getIconClasses('/dashboard/admin/assessment')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
        },
        {
          name: 'Assessment Marks Entry',
          href: '/dashboard/admin/assessment-marks',
          icon: (
            <svg className={getIconClasses('/dashboard/admin/assessment-marks')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
        },
        {
          name: 'UG Logbook Evaluation',
          href: '/dashboard/admin/ug-logbook/evaluation',
          icon: (
            <svg className={getIconClasses('/dashboard/admin/ug-logbook/evaluation')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          ),
        },
        {
          name: 'UG Logbook Master',
          href: '/dashboard/admin/ug-logbook/activity-master',
          icon: (
            <svg className={getIconClasses('/dashboard/admin/ug-logbook/activity-master')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          ),
        },
      ],
    },
    {
      groupTitle: 'System & Admin',
      items: [
        {
          name: 'Admin Master',
          href: '/dashboard/admin/admin-master',
          icon: (
            <svg className={getIconClasses('/dashboard/admin/admin-master')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        },
      ],
    },
  ];

  const facultyGroups: NavGroup[] = [
    {
      groupTitle: 'Overview',
      items: [
        {
          name: 'Teaching Dashboard',
          href: '/dashboard/faculty',
          icon: (
            <svg className={getIconClasses('/dashboard/faculty')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          ),
        },
        {
          name: 'Faculty Profile',
          href: '/dashboard/faculty/profile',
          icon: (
            <svg className={getIconClasses('/dashboard/faculty/profile')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ),
        },
      ],
    },
    {
      groupTitle: 'Academics & Teaching',
      items: [
        {
          name: 'Student Info',
          href: '/dashboard/faculty/students',
          icon: (
            <svg className={getIconClasses('/dashboard/faculty/students')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          ),
        },
        {
          name: 'Department Faculty',
          href: '/dashboard/faculty/department-faculty',
          icon: (
            <svg className={getIconClasses('/dashboard/faculty/department-faculty')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
        },
        {
          name: 'Schedule',
          href: '/dashboard/faculty/schedule',
          icon: (
            <svg className={getIconClasses('/dashboard/faculty/schedule')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
        },
        {
          name: 'Attendance Marking',
          href: '/dashboard/faculty/attendance',
          icon: (
            <svg className={getIconClasses('/dashboard/faculty/attendance')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          ),
        },
      ],
    },
    {
      groupTitle: 'Assessments & Evaluation',
      items: [
        {
          name: 'Assessment & Q-Bank',
          href: '/dashboard/faculty/assessment',
          icon: (
            <svg className={getIconClasses('/dashboard/faculty/assessment')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
        },
        {
          name: 'Assessment Marks',
          href: '/dashboard/faculty/marks',
          icon: (
            <svg className={getIconClasses('/dashboard/faculty/marks')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
        },
        {
          name: 'UG Logbook Evaluation',
          href: '/dashboard/faculty/logbook',
          icon: (
            <svg className={getIconClasses('/dashboard/faculty/logbook')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          ),
        },
      ],
    },
  ];

  const studentGroups: NavGroup[] = [
    {
      groupTitle: 'Overview',
      items: [
        {
          name: 'Dashboard',
          href: '/dashboard/student',
          icon: (
            <svg className={getIconClasses('/dashboard/student')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          ),
        },
      ],
    },
    {
      groupTitle: 'Academics & Schedule',
      items: [
        {
          name: 'Timetable',
          href: '/dashboard/student/timetable',
          icon: (
            <svg className={getIconClasses('/dashboard/student/timetable')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
        },
        {
          name: 'Class Schedule',
          href: '/dashboard/student/schedule',
          icon: (
            <svg className={getIconClasses('/dashboard/student/schedule')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
        {
          name: 'Attendance',
          href: '/dashboard/student/attendance',
          icon: (
            <svg className={getIconClasses('/dashboard/student/attendance')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          ),
        },
      ],
    },
    {
      groupTitle: 'Clinical & Assessment',
      items: [
        {
          name: 'UG Logbook',
          href: '/dashboard/student/logbook',
          icon: (
            <svg className={getIconClasses('/dashboard/student/logbook')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          ),
        },
        {
          name: 'Assessment & Tests',
          href: '/dashboard/student/assessment',
          icon: (
            <svg className={getIconClasses('/dashboard/student/assessment')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
        },
        {
          name: 'Exam Marks',
          href: '/dashboard/student/marks',
          icon: (
            <svg className={getIconClasses('/dashboard/student/marks')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
        },
      ],
    },
  ];

  const wardenGroups: NavGroup[] = [
    {
      groupTitle: 'Overview',
      items: [
        {
          name: 'Hostel Console',
          href: '/dashboard/warden',
          icon: (
            <svg className={getIconClasses('/dashboard/warden')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          ),
        },
        {
          name: 'Resident Roster',
          href: '/dashboard/admin/student-master',
          icon: (
            <svg className={getIconClasses('/dashboard/admin/student-master')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          ),
        },
      ],
    },
  ];

  const clerkGroups: NavGroup[] = [
    {
      groupTitle: 'Overview',
      items: [
        {
          name: 'Clerk Console',
          href: '/dashboard/clerk',
          icon: (
            <svg className={getIconClasses('/dashboard/clerk')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
        },
      ],
    },
    {
      groupTitle: 'Operations',
      items: [
        {
          name: 'Attendance Entry',
          href: '/dashboard/admin/attendance-master',
          icon: (
            <svg className={getIconClasses('/dashboard/admin/attendance-master')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          ),
        },
        {
          name: 'Marks Entry',
          href: '/dashboard/admin/assessment-marks',
          icon: (
            <svg className={getIconClasses('/dashboard/admin/assessment-marks')} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
        },
      ],
    },
  ];

  const currentGroups =
    role === 'admin'
      ? adminGroups
      : role === 'faculty'
      ? facultyGroups
      : role === 'warden'
      ? wardenGroups
      : role === 'clerk'
      ? clerkGroups
      : studentGroups;

  return (
    <aside
      className={`relative bg-gradient-to-b from-[#2D2575] via-[#261E63] to-[#221C5C] text-white sticky top-0 h-screen overflow-hidden flex flex-col justify-between shrink-0 transition-all duration-300 z-20 shadow-2xl shadow-purple-950/40 rounded-r-[32px] border-r border-white/10 ${
        collapsed ? 'w-[88px] p-3' : 'w-[280px] p-4'
      }`}
    >
      {/* Ambient Glow Blob */}
      <div className="absolute -top-24 -left-24 w-56 h-56 bg-[#5B4BFF]/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-24 w-48 h-48 bg-[#F36C21]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & Brand */}
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between px-2 pt-1 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#F36C21] via-orange-500 to-amber-500 flex items-center justify-center font-black text-white text-base shadow-lg shadow-orange-500/30 border border-white/20 shrink-0">
              M
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="font-black text-xs text-white tracking-wide uppercase truncate max-w-[170px]" title={collegeName}>
                  {collegeName}
                </h1>
                <p className="text-[9px] text-[#F36C21] font-extrabold uppercase tracking-wider truncate">
                  {role} Portal • UNICAMPUS PLUS
                </p>
              </div>
            )}
          </div>

          {/* Collapse Toggle Button */}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <div className="overflow-y-auto max-h-[calc(100vh-210px)] pr-1 space-y-5 custom-scrollbar">
          {currentGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1.5">
              {!collapsed && group.groupTitle && (
                <span className="block px-3 text-[10px] font-extrabold uppercase tracking-wider text-purple-200/50 select-none">
                  {group.groupTitle}
                </span>
              )}
              <nav className="space-y-1 text-xs">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.name : undefined}
                    className={getLinkClasses(item.href)}
                  >
                    {item.icon}
                    {!collapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                ))}
              </nav>
            </div>
          ))}

          {/* Faculty MIS Reports Accordion */}
          {role === 'faculty' && (
            <div className="space-y-1.5 pt-1">
              {!collapsed && (
                <span className="block px-3 text-[10px] font-extrabold uppercase tracking-wider text-purple-200/50 select-none">
                  Analytics & Reports
                </span>
              )}
              <button
                type="button"
                onClick={() => setMisReportsOpen(!misReportsOpen)}
                className={`w-full flex items-center ${
                  collapsed ? 'justify-center p-2.5' : 'justify-between px-3.5 py-2.5'
                } rounded-2xl font-bold transition-all group ${
                  pathname?.startsWith('/dashboard/faculty/reports') || misReportsOpen
                    ? 'text-white bg-white/[0.14] border-l-4 border-[#F36C21] shadow-lg shadow-black/10'
                    : 'text-white/80 hover:text-white hover:bg-white/[0.08] border-l-4 border-transparent'
                }`}
                title="MIS Reports"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 shrink-0 text-white group-hover:text-[#F36C21] transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {!collapsed && <span>MIS Reports</span>}
                </div>
                {!collapsed && (
                  <span className="w-5 h-5 rounded-lg bg-white/15 text-white font-black flex items-center justify-center text-xs">
                    {misReportsOpen ? '−' : '+'}
                  </span>
                )}
              </button>

              {!collapsed && misReportsOpen && (
                <div className="pl-6 pr-1 space-y-1 pt-1 border-l-2 border-white/10 ml-3">
                  <Link
                    href="/dashboard/faculty/reports"
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all ${
                      pathname === '/dashboard/faculty/reports' || pathname === '/dashboard/faculty/reports/attendance'
                        ? 'font-black text-white bg-[#5B4BFF] shadow-sm shadow-[#5B4BFF]/30'
                        : 'font-medium text-purple-200/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F36C21]"></span>
                    <span>1. Attendance Report</span>
                  </Link>

                  <Link
                    href="/dashboard/faculty/reports/logbook"
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all ${
                      pathname === '/dashboard/faculty/reports/logbook'
                        ? 'font-black text-white bg-[#5B4BFF] shadow-sm shadow-[#5B4BFF]/30'
                        : 'font-medium text-purple-200/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C48C]"></span>
                    <span>2. UG LogBook Report</span>
                  </Link>

                  <Link
                    href="/dashboard/faculty/reports/theory-result"
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all ${
                      pathname === '/dashboard/faculty/reports/theory-result' || pathname === '/dashboard/faculty/reports/theory'
                        ? 'font-black text-white bg-[#5B4BFF] shadow-sm shadow-[#5B4BFF]/30'
                        : 'font-medium text-purple-200/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FFB020]"></span>
                    <span>3. Theory Result</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Signature ECG Pulse & Pinned Bottom Profile Card */}
      <div className="relative z-10 pt-2 space-y-2 border-t border-white/10">
        <PulseLine className="w-full h-6 opacity-25" />

        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-2 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/10 shadow-inner`}>
          <div className="flex items-center gap-2.5 min-w-0">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="w-8 h-8 rounded-xl object-cover border border-[#F36C21] shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5B4BFF] to-[#7867FF] text-white font-black flex items-center justify-center text-xs shrink-0 shadow-md">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{userName}</p>
                <p className="text-[9px] text-[#00C48C] font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00C48C] animate-pulse"></span>
                  Active
                </p>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
              }}
              title="Sign Out"
              className="p-1.5 rounded-lg text-purple-200/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
