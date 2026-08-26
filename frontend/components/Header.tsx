'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useNotices, NoticeItem } from '../hooks/useNotices';
import CampusAlertsDropdown from './notices/CampusAlertsDropdown';
import NoticeDetailModal from './notices/NoticeDetailModal';

interface HeaderProps {
  title: string;
}

interface UserProfileData {
  id?: string;
  email?: string;
  role?: string;
  name?: string;
  photoUrl?: string;
  registrationNo?: string;
  rollno?: string;
  empId?: string;
  designation?: string;
  specialization?: string;
  departmentName?: string;
  subjectName?: string;
  courseCd?: string;
  batchCd?: string;
  phone?: string;
  gender?: string;
  staffType?: string;
  tenantSlug?: string;
  tenantName?: string;
  collegeName?: string;
  colgCd?: string;
  created_at?: string;
}

export default function Header({ title }: HeaderProps) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Modals state
  const [activeModal, setActiveModal] = useState<'NONE' | 'PROFILE' | 'SETTINGS' | 'PASSWORD'>('NONE');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const handleSidebarChange = (e: any) => {
      if (typeof e.detail?.isOpen === 'boolean') {
        setIsMobileSidebarOpen(e.detail.isOpen);
      }
    };
    window.addEventListener('mobileSidebarStateChange', handleSidebarChange);
    return () => window.removeEventListener('mobileSidebarStateChange', handleSidebarChange);
  }, []);

  const toggleMobileSidebar = () => {
    window.dispatchEvent(new CustomEvent('toggleMobileSidebar'));
  };

  // Change password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  // Settings preferences state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Chat Unread Count State
  const [chatUnreadCount, setChatUnreadCount] = useState<number>(0);

  // Campus Alerts & Notices State
  const { notices, loading: noticesLoading, unreadCount, markAsRead, acknowledgeNotice } = useNotices();
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [selectedAlertNotice, setSelectedAlertNotice] = useState<NoticeItem | null>(null);
  const [isNoticeDetailOpen, setIsNoticeDetailOpen] = useState(false);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const alertsRef = useRef<HTMLDivElement>(null);

  const fetchChatUnread = async () => {
    try {
      const token = getStorageItem('token');
      const tenantSlug = getStorageItem('tenantSlug') || 'srms-cet-bareilly';
      if (!token) return;

      const res = await fetch(`http://localhost:3001/api/v1/chat/unread-count?tenant=${tenantSlug}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-tenant-slug': tenantSlug,
        },
      });
      if (res.ok) {
        const json = await res.json();
        setChatUnreadCount(json.data?.unread_count || 0);
      }
    } catch {}
  };

  useEffect(() => {
    setMounted(true);
    fetchChatUnread();
    const interval = setInterval(fetchChatUnread, 30000);

    // 1. Theme initialization — Light mode active by default
    const savedTheme = localStorage.getItem('mederp_theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }

    // 2. Load stored user context initially
    const cachedUserStr = localStorage.getItem('user');
    if (cachedUserStr) {
      try {
        const parsed = JSON.parse(cachedUserStr);
        setUser(extractUserInfo(parsed));
      } catch (err) {
        console.error('Failed to parse cached user:', err);
      }
    }

    // 3. Fetch fresh user profile details from DB via /api/v1/auth/me
    fetchUserProfile();

    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (alertsRef.current && !alertsRef.current.contains(e.target as Node)) {
        setAlertsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStorageItem = (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const extractUserInfo = (data: any): UserProfileData => {
    const p = data.profile || {};
    const role = data.role || getStorageItem('role') || 'USER';
    const isStudentRole = role.toUpperCase() === 'STUDENT';
    const email = data.email || p.email || '';
    const tenantSlug = data.tenantSlug || getStorageItem('tenantSlug') || 'srms';

    const name =
      p.name ||
      data.name ||
      data.student_name ||
      data.faculty_name ||
      (email ? email.split('@')[0] : 'User Profile');

    const empId = isStudentRole ? '' : (p.emp_id || p.empId || data.emp_id || data.empId || '');

    const nameStr = String(name || '');
    const photoUrl =
      p.photo_url ||
      p.photoUrl ||
      data.photo_url ||
      data.photoUrl ||
      (!isStudentRole && (nameStr.toLowerCase().includes('sanjay') || empId.includes('DR/07/026'))
        ? '/avatars/dr_sanjay_singh.png'
        : !isStudentRole && (nameStr.toLowerCase().includes('sarah') || nameStr.toLowerCase().includes('aparna'))
          ? '/avatars/dr_sarah_sharma.png'
          : '');

    const registrationNo =
      p.registration_no ||
      p.registrationNo ||
      data.registration_no ||
      data.registrationNo ||
      '';

    const rollno = p.rollno || data.rollno || '';

    const designation = isStudentRole ? 'Student' : (p.designation || data.designation || '');
    const specialization = isStudentRole ? '' : (p.specialization || data.specialization || '');
    const departmentName = p.department_name || data.departmentName || '';
    const subjectName = p.primary_subject_name || data.subjectName || '';
    const courseCd = p.course_cd || data.courseCd || '';
    const batchCd = p.batch_cd || data.batchCd || '';
    const phone = p.phone || data.phone || '';
    const gender = p.gender || data.gender || '';
    const staffType = p.staff_type || data.staffType || '';

    return {
      id: data.id || p.id || '',
      email,
      role: role.toUpperCase(),
      name,
      photoUrl,
      registrationNo,
      rollno,
      empId,
      designation,
      specialization,
      departmentName,
      subjectName,
      courseCd,
      batchCd,
      phone,
      gender,
      staffType,
      tenantSlug,
      tenantName: data.tenantName || p.tenantName || data.collegeName || p.collegeName || '',
      collegeName: data.collegeName || p.collegeName || data.tenantName || p.tenantName || '',
      colgCd: data.colgCd || p.colgCd || data.colg_cd || p.colg_cd || '',
      created_at: data.created_at || p.created_at || '',
    };
  };

  const fetchUserProfile = async () => {
    try {
      const token = getStorageItem('token');
      const tenantSlug = getStorageItem('tenantSlug') || 'srms';
      if (!token) return;

      const res = await fetch('http://localhost:3001/api/v1/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-tenant-slug': tenantSlug,
        },
      });

      if (res.ok) {
        const json = await res.json();
        const meData = json.data || json;
        const formatted = extractUserInfo(meData);
        setImgError(false);
        setUser(formatted);
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(meData));
        }
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mederp_theme', newTheme);
    }
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      localStorage.removeItem('isOwner');
      localStorage.removeItem('tenantSlug');
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      document.cookie = 'auth_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      window.location.href = '/login';
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!currentPassword) {
      setPassError('Please enter your current password');
      return;
    }
    if (newPassword.length < 8) {
      setPassError('New password must be at least 8 characters long');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setPassError('New password must contain at least one uppercase letter');
      return;
    }
    if (!/\d/.test(newPassword)) {
      setPassError('New password must contain at least one number');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('New password and confirmation do not match');
      return;
    }

    setPassLoading(true);
    try {
      const token = getStorageItem('token');
      const tenantSlug = getStorageItem('tenantSlug') || 'srms';

      const res = await fetch('http://localhost:3001/api/v1/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-tenant-slug': tenantSlug,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setPassSuccess('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setActiveModal('NONE'), 1800);
      } else {
        setPassError(json.message || 'Failed to change password. Please check your current password.');
      }
    } catch (err) {
      setPassError('Unable to connect to backend server');
    } finally {
      setPassLoading(false);
    }
  };

  const getRoleBadgeStyle = (roleStr?: string) => {
    switch (roleStr) {
      case 'STUDENT':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'FACULTY':
      case 'HOD':
        return 'bg-[#F36C21]/10 text-[#F36C21] border-[#F36C21]/20';
      case 'ADMIN':
      case 'COLLEGE_ADMIN':
      case 'SUPER_ADMIN':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'CLERK':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'WARDEN':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getUserInitials = (nameStr?: string) => {
    if (!nameStr) return 'U';
    const parts = nameStr.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nameStr.substring(0, 2).toUpperCase();
  };

  const userName = user?.name || (mounted ? (getStorageItem('name') || getStorageItem('role') || 'Admin') : 'Admin');
  const userRole = (user?.role || (mounted ? (getStorageItem('role') || 'ADMIN') : 'ADMIN')).toUpperCase();
  const userDisplayId = userRole === 'STUDENT'
    ? (user?.registrationNo ? `REG: ${user.registrationNo}` : user?.rollno ? `ROLL: ${user.rollno}` : 'STUDENT')
    : user?.registrationNo
      ? `REG: ${user.registrationNo}`
      : user?.empId
        ? `EMP: ${user.empId}`
        : user?.id
          ? `ID: ${user.id.slice(0, 8)}...`
          : 'ID: Active';

  const rawSlug = (user?.tenantSlug || (mounted ? (getStorageItem('tenantSlug') || getStorageItem('selectedTenant')) : '') || 'srms-cet-bareilly').toLowerCase().trim().replace(/^tenant_/, '').replace(/^tenant-/, '');
  const activeColgCd = user?.colgCd || (mounted ? getStorageItem('colg_cd') : '1');

  const getResolvedCollegeName = () => {
    if (userRole === 'SUPER_ADMIN') {
      return 'UniCampus Central University Administration';
    }
    if (rawSlug === 'srms-cet-bareilly' || rawSlug.includes('cet-bareilly') || activeColgCd === '1') {
      return 'SRMS College of Engineering & Technology, Bareilly';
    }
    if (rawSlug === 'srms-cetr-bareilly' || rawSlug.includes('cetr-bareilly') || activeColgCd === '2') {
      return 'SRMS College of Engineering, Technology & Research, Bareilly';
    }
    if (rawSlug === 'srms-ims' || rawSlug.includes('ims') || activeColgCd === '11') {
      return 'SRMS Institute of Medical Sciences, Bareilly';
    }
    if (rawSlug === 'rmribar' || rawSlug.includes('rajshree')) {
      return 'Rajshree Medical Research Institute & Hospital Bareilly';
    }
    if (rawSlug === 'rmch-bareilly') {
      return 'Rohilkhand Medical College & Hospital';
    }
    if (rawSlug === 'apex-tech') {
      return 'Apex Institute of Technology & Management';
    }
    if (rawSlug === 'srms-ibs-lucknow') return 'SRMS IBS, Lucknow';
    if (rawSlug === 'srms-iahs-bareilly') return 'SRMS IAHS, Bareilly';
    if (rawSlug === 'srms-trust-bareilly') return 'SRMS Trust, Bareilly';
    if (rawSlug === 'srms-nursing-school') return 'SRMS Nursing School';
    if (rawSlug === 'srms-nursing-college') return 'SRMS Nursing College';
    if (rawSlug === 'srms-riddhima-bareilly') return 'SRMS Riddhima, Bareilly';
    if (rawSlug === 'srms-college-of-nursing-paramedical-sciences-unnao') return 'SRMS College of Nursing & Paramedical Sciences, Unnao';
    if (rawSlug === 'srms-quiz-panel') return 'SRMS Quiz Panel';
    if (rawSlug === 'srms-cricket-academy') return 'SRMS Cricket Academy';
    if (rawSlug === 'srms-cet-unnao') return 'SRMS CET, Unnao';
    if (rawSlug === 'srms-college-of-law') return 'SRMS College of Law';

    const fallbackStored = mounted ? (getStorageItem('collegeName') || getStorageItem('tenantName') || getStorageItem('colg_name')) : '';
    if (fallbackStored && !fallbackStored.toLowerCase().includes('rajshree')) {
      return fallbackStored;
    }
    return user?.collegeName || user?.tenantName || 'SRMS College of Engineering & Technology, Bareilly';
  };

  const collegeDisplayName = getResolvedCollegeName();

  return (
    <>
      <header 
        className="h-16 md:h-20 bg-white dark:bg-[#0B1120] text-[#11141A] dark:text-white px-3.5 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-all shadow-xs rounded-b-[18px] md:rounded-b-[22px] border-b border-[#E5E8ED] dark:border-slate-800"
      >
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1 mr-2">
          {/* Mobile Hamburger Drawer Trigger */}
          <button
            type="button"
            onClick={toggleMobileSidebar}
            className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white min-h-[44px] min-w-[44px] flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer shrink-0"
            aria-label={isMobileSidebarOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
          >
            {isMobileSidebarOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          <span className="w-1.5 h-6 rounded-full bg-[#F36C21] shadow-[0_0_12px_rgba(243,108,33,0.6)] shrink-0 hidden xs:block"></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-xs sm:text-sm font-black text-[#11141A] dark:text-white tracking-wider uppercase font-sans truncate">
              {title}
            </h2>
            <p className="text-[9px] sm:text-[10px] text-[#6F7887] dark:text-gray-400 font-bold truncate max-w-[170px] xs:max-w-[240px] sm:max-w-[320px] md:max-w-[420px]" title={collegeDisplayName}>
              {collegeDisplayName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Live Badge */}
          <span className="text-[10px] px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-extrabold uppercase tracking-wider hidden lg:flex items-center gap-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#00C48C] animate-pulse"></span>
            System Live
          </span>

          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-9 h-9 sm:w-9 sm:h-9 min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 border border-slate-200 dark:border-white/15 text-slate-700 dark:text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
          </button>

          {/* Batch & Dept Chat Header Button */}
          <Link
            href={
              userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'COLLEGE_ADMIN'
                ? '/dashboard/admin/chat'
                : userRole === 'STUDENT'
                ? '/dashboard/student/chat'
                : '/dashboard/faculty/chat'
            }
            className="relative w-9 h-9 sm:w-9 sm:h-9 min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 border border-slate-200 dark:border-white/15 text-slate-700 dark:text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-xs"
            title="Batch & Department Discussions"
          >
            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {chatUnreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#0E9F6E] text-white text-[10px] font-black flex items-center justify-center border-2 border-white dark:border-[#1e293b] animate-pulse shadow-md">
                {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
              </span>
            )}
          </Link>

          {/* Campus Alerts Notification Bell */}
          <div className="relative" ref={alertsRef}>
            <button
              type="button"
              onClick={() => setAlertsOpen(!alertsOpen)}
              className="relative w-9 h-9 sm:w-9 sm:h-9 min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 border border-slate-200 dark:border-white/15 text-slate-700 dark:text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer"
              title="Campus Alerts & Notifications"
            >
              <svg className="w-4 h-4 text-slate-600 dark:text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              {unreadCount.totalUnread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F36C21] text-white text-[10px] font-black flex items-center justify-center border-2 border-white dark:border-[#14171F] animate-pulse shadow-md">
                  {unreadCount.totalUnread > 99 ? '99+' : unreadCount.totalUnread}
                </span>
              )}
            </button>

            {/* Render Dropdown Content */}
            <CampusAlertsDropdown
              isOpen={alertsOpen}
              onClose={() => setAlertsOpen(false)}
              notices={notices}
              loading={noticesLoading}
              onSelectNotice={(notice) => {
                setSelectedAlertNotice(notice);
                setIsNoticeDetailOpen(true);
                if (!notice.is_read) {
                  markAsRead(notice.id);
                }
              }}
              onMarkAllRead={async () => {
                for (const n of notices.filter((item) => !item.is_read)) {
                  await markAsRead(n.id);
                }
              }}
            />
          </div>

          {/* User Profile Avatar Dropdown Trigger */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 sm:gap-3 p-1 sm:px-2.5 sm:py-1.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 border border-slate-200 dark:border-white/15 transition-all text-slate-800 dark:text-white cursor-pointer shadow-xs min-h-[44px] min-w-[44px]"
              aria-label="User profile and account settings"
            >
              <div className="relative shrink-0">
                {user?.photoUrl && !imgError ? (
                  <img
                    src={user.photoUrl}
                    alt={userName}
                    className="w-8 h-8 rounded-xl object-cover border border-[#F36C21]/40"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#F36C21] to-[#E05B10] text-white font-black flex items-center justify-center text-xs shadow-sm border border-[#F36C21]/30" suppressHydrationWarning>
                    {getUserInitials(userName)}
                  </div>
                )}
                {/* Active Indicator Ring */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#00C48C] border-2 border-white dark:border-[#14171F] rounded-full"></span>
              </div>

              <div className="hidden sm:block text-left" suppressHydrationWarning>
                <span className="block text-xs font-bold text-[#11141A] dark:text-white truncate max-w-[120px]" suppressHydrationWarning>{userName}</span>
                <span className="block text-[10px] text-[#6F7887] dark:text-gray-400 font-bold uppercase" suppressHydrationWarning>{userRole}</span>
              </div>
            </button>

            {/* Profile Dropdown Card */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-slate-900/95 border border-slate-800 backdrop-blur-xl shadow-2xl rounded-2xl p-4 text-slate-100 font-sans z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* User Info Header */}
                <div className="flex items-center gap-3.5 pb-3 border-b border-slate-800">
                  {user?.photoUrl && !imgError ? (
                    <img
                      src={user.photoUrl}
                      alt={userName}
                      className="w-12 h-12 rounded-xl object-cover border border-[#F36C21]/40 shadow-lg shadow-orange-500/10"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F36C21] to-[#E05B10] text-white font-black flex items-center justify-center text-base shadow-lg shadow-orange-600/25 border border-[#F36C21]/30" suppressHydrationWarning>
                      {getUserInitials(userName)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-sm text-white truncate" suppressHydrationWarning>{userName}</h3>
                    <p className="text-[11px] text-slate-400 truncate" suppressHydrationWarning>{user?.email || 'Registered User'}</p>

                    <div className="flex items-center gap-2 mt-1.5" suppressHydrationWarning>
                      <span className={`text-[9px] px-2 py-0.5 rounded-md border font-extrabold tracking-wider ${getRoleBadgeStyle(userRole)}`} suppressHydrationWarning>
                        {userRole}
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-mono font-bold" suppressHydrationWarning>
                        {userDisplayId}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional Metadata Subtitle */}
                {(user?.designation || user?.departmentName || user?.courseCd) && (
                  <div className="py-2.5 px-3 my-2 rounded-xl bg-slate-800/50 border border-slate-800 text-xs space-y-1">
                    {user.designation && (
                      <p className="text-slate-300 font-medium flex justify-between">
                        <span className="text-slate-500">Designation:</span>
                        <span className="font-bold">{user.designation}</span>
                      </p>
                    )}
                    {user.departmentName && (
                      <p className="text-slate-300 font-medium flex justify-between">
                        <span className="text-slate-500">Department:</span>
                        <span className="font-bold">{user.departmentName}</span>
                      </p>
                    )}
                    {user.courseCd && (
                      <p className="text-slate-300 font-medium flex justify-between">
                        <span className="text-slate-500">Course / Batch:</span>
                        <span className="font-bold">{user.courseCd} ({user.batchCd || 'Current'})</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Action Items List */}
                <div className="space-y-1 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      if (userRole === 'STUDENT') {
                        window.location.href = '/dashboard/student/profile';
                      } else if (userRole === 'FACULTY' || userRole === 'HOD') {
                        window.location.href = '/dashboard/faculty/profile';
                      } else {
                        setActiveModal('PROFILE');
                      }
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-xs font-semibold text-left group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#F36C21]/10 text-[#F36C21] group-hover:bg-[#F36C21] group-hover:text-white flex items-center justify-center transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span>My Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      setActiveModal('SETTINGS');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-xs font-semibold text-left group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-700/50 text-slate-300 group-hover:bg-slate-600 group-hover:text-white flex items-center justify-center transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span>Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      setPassError('');
                      setPassSuccess('');
                      setActiveModal('PASSWORD');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-xs font-semibold text-left group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-600 group-hover:text-white flex items-center justify-center transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <span>Change Password</span>
                  </button>

                  <div className="pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white transition-all text-xs font-semibold text-left group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 group-hover:bg-white/20 group-hover:text-white flex items-center justify-center transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* LIVE ADMIN ANNOUNCEMENT ALERT BANNER */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {(() => {
        const topAnnouncement = notices.find(
          (n) => !n.is_read && (n.priority === 'urgent' || n.priority === 'important' || n.category === 'announcement'),
        );
        if (!topAnnouncement || dismissedAlertIds.includes(topAnnouncement.id) || !notificationsEnabled) {
          return null;
        }

        const isUrgent = topAnnouncement.priority === 'urgent';

        return (
          <div
            className={`mt-2 mx-6 p-3.5 rounded-2xl shadow-md border flex items-center justify-between gap-4 text-xs animate-in slide-in-from-top-2 duration-200 ${
              isUrgent
                ? 'bg-[#FFF1F2] dark:bg-rose-950/70 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100'
                : 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-slate-900 dark:to-amber-950/30 border-orange-200 dark:border-amber-900/60 text-[#11141A] dark:text-white'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 ${
                  isUrgent
                    ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
                    : 'bg-[#F36C21] text-white shadow-sm shadow-orange-500/30'
                }`}
              >
                📢
              </div>
              <div className="min-w-0 flex items-center gap-2 truncate">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                    isUrgent
                      ? 'bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                      : 'bg-orange-100 text-[#F36C21] dark:bg-orange-950 dark:text-orange-300'
                  }`}
                >
                  {isUrgent ? 'URGENT CIRCULAR' : 'NEW ANNOUNCEMENT'}
                </span>
                <span className="font-extrabold text-[#1B1E28] dark:text-white truncate">
                  {topAnnouncement.title}
                </span>
                <span className="hidden lg:inline text-[#4E5969] dark:text-slate-300 text-[11px] truncate">
                  — {topAnnouncement.body}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedAlertNotice(topAnnouncement);
                  setIsNoticeDetailOpen(true);
                  if (!topAnnouncement.is_read) {
                    markAsRead(topAnnouncement.id);
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#F36C21] hover:bg-[#E25C10] text-white font-black text-xs shadow-sm transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Read Notice</span>
                <span>➔</span>
              </button>

              <button
                type="button"
                onClick={() => setDismissedAlertIds((prev) => [...prev, topAnnouncement.id])}
                className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-[#4E5969] dark:text-slate-300 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        );
      })()}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 1. PROFILE MODAL */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeModal === 'PROFILE' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F36C21]/15 border border-[#F36C21]/30 text-[#F36C21] flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-black text-white">Database Registration Profile</h2>
                  <p className="text-xs text-slate-400">Authenticated user details stored in system schema</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModal('NONE')}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>

            {/* Profile Content Card */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              {user?.photoUrl && !imgError ? (
                <img
                  src={user.photoUrl}
                  alt={userName}
                  className="w-20 h-20 rounded-2xl object-cover border border-indigo-500/40 shadow-md shadow-indigo-600/20"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#F36C21] to-[#E05B10] text-white font-black flex items-center justify-center text-2xl shadow-md border border-[#F36C21]/30 shrink-0">
                  {getUserInitials(userName)}
                </div>
              )}

              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-white">{userName}</h3>
                <p className="text-xs text-[#F36C21] font-mono">{user?.email || 'N/A'}</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-md border font-extrabold uppercase tracking-wider ${getRoleBadgeStyle(userRole)}`}>
                    {userRole}
                  </span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-mono font-bold">
                    {userDisplayId}
                  </span>
                </div>
              </div>
            </div>

            {/* Registration Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800/80 space-y-1">
                <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Full Name</p>
                <p className="text-slate-200 font-semibold">{userName}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800/80 space-y-1">
                <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Registration / Emp ID</p>
                <p className="text-[#F36C21] font-mono font-semibold">{user?.registrationNo || user?.empId || user?.id || 'N/A'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800/80 space-y-1">
                <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">System Role</p>
                <p className="text-slate-200 font-semibold">{userRole}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800/80 space-y-1">
                <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">College Tenant</p>
                <p className="text-[#F36C21] font-mono font-semibold uppercase">{user?.tenantSlug || 'srms'}</p>
              </div>

              {user?.departmentName && (
                <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800/80 space-y-1">
                  <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Department</p>
                  <p className="text-slate-200 font-semibold">{user.departmentName}</p>
                </div>
              )}

              {user?.designation && (
                <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800/80 space-y-1">
                  <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Designation</p>
                  <p className="text-slate-200 font-semibold">{user.designation}</p>
                </div>
              )}

              {user?.specialization && (
                <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800/80 space-y-1">
                  <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Specialization</p>
                  <p className="text-slate-200 font-semibold">{user.specialization}</p>
                </div>
              )}

              {user?.courseCd && (
                <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800/80 space-y-1">
                  <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Course / Batch</p>
                  <p className="text-slate-200 font-semibold">{user.courseCd} ({user.batchCd || 'Active'})</p>
                </div>
              )}

              {user?.phone && (
                <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800/80 space-y-1">
                  <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Contact Phone</p>
                  <p className="text-slate-200 font-semibold">{user.phone}</p>
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800/80 space-y-1">
                <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Account Status</p>
                <p className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active & Verified
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveModal('NONE')}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 2. SETTINGS MODAL */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeModal === 'SETTINGS' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-black text-white">Portal & System Settings</h2>
                  <p className="text-xs text-slate-400">Configure theme, notifications & portal context</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModal('NONE')}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Theme Settings */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
                <div>
                  <p className="font-bold text-white">Appearance Theme</p>
                  <p className="text-slate-400 text-[11px]">Toggle between Slate Dark and Light mode</p>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold shadow-sm hover:bg-indigo-500 transition-all"
                >
                  {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                </button>
              </div>

              {/* Notification Preference */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
                <div>
                  <p className="font-bold text-white">System Broadcasts & Alerts</p>
                  <p className="text-slate-400 text-[11px]">Receive live WebSocket notifications</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${notificationsEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
                    }`}
                >
                  {notificationsEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {/* Active Tenant Information */}
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
                <p className="font-bold text-white">Active Tenant Schema Context</p>
                <div className="flex items-center justify-between text-slate-300 text-[11px]">
                  <span>Tenant Slug:</span>
                  <span className="font-mono font-bold text-indigo-400 uppercase">{user?.tenantSlug || 'srms'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300 text-[11px]">
                  <span>Isolation Strategy:</span>
                  <span className="font-mono font-semibold text-emerald-400">PostgreSQL tenant_{user?.tenantSlug || 'srms'}</span>
                </div>
              </div>

              {/* Platform Info */}
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 space-y-1 text-slate-400 text-[11px]">
                <p className="font-bold text-slate-300">MedERP Enterprise Core</p>
                <p>Version 2.0.4 — Multi-Tenant Medical University ERP</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveModal('NONE')}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-500/20"
              >
                Save & Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 3. CHANGE PASSWORD MODAL */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeModal === 'PASSWORD' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-black text-white">Change Account Password</h2>
                  <p className="text-xs text-slate-400">Update current password securely in database</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModal('NONE')}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>

            {passError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 font-medium text-center">
                {passError}
              </div>
            )}

            {passSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-medium text-center">
                {passSuccess}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 text-sm transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 text-sm transition-all"
                  placeholder="At least 8 chars, 1 uppercase & 1 number"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 text-sm transition-all"
                  placeholder="Re-enter new password"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal('NONE')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={passLoading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2"
                >
                  {passLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {passLoading ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notice Detail Reader Modal for Alerts */}
      <NoticeDetailModal
        notice={selectedAlertNotice}
        isOpen={isNoticeDetailOpen}
        onClose={() => {
          setIsNoticeDetailOpen(false);
          setSelectedAlertNotice(null);
        }}
        onAcknowledge={acknowledgeNotice}
      />
    </>
  );
}
