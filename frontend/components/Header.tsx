'use client';

import { useState, useEffect, useRef } from 'react';

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

  // Change password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  // Settings preferences state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

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
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
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
    const email = data.email || p.email || '';
    const tenantSlug = data.tenantSlug || getStorageItem('tenantSlug') || 'srms';

    const name =
      p.name ||
      data.name ||
      data.student_name ||
      data.faculty_name ||
      (email ? email.split('@')[0] : 'User Profile');

    const empId = p.emp_id || p.empId || data.emp_id || data.empId || '';

    const nameStr = String(name || '');
    const photoUrl =
      p.photo_url ||
      p.photoUrl ||
      data.photo_url ||
      data.photoUrl ||
      (nameStr.toLowerCase().includes('sanjay') || empId.includes('DR/07/026')
        ? '/avatars/dr_sanjay_singh.png'
        : nameStr.toLowerCase().includes('sarah') || nameStr.toLowerCase().includes('aparna')
          ? '/avatars/dr_sarah_sharma.png'
          : '');

    const registrationNo =
      p.registration_no ||
      p.registrationNo ||
      data.registration_no ||
      data.registrationNo ||
      '';

    const rollno = p.rollno || data.rollno || '';

    const designation = p.designation || data.designation || '';
    const specialization = p.specialization || data.specialization || '';
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
      localStorage.removeItem('tenantSlug');
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
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'ADMIN':
      case 'COLLEGE_ADMIN':
      case 'SUPER_ADMIN':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'CLERK':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'WARDEN':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
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
  const userDisplayId = user?.registrationNo
    ? `REG: ${user.registrationNo}`
    : user?.empId
      ? `EMP: ${user.empId}`
      : user?.id
        ? `ID: ${user.id.slice(0, 8)}...`
        : 'ID: Active';

  return (
    <>
      <header className="h-20 bg-[#2D2575] text-white px-6 flex items-center justify-between sticky top-0 z-30 transition-all shadow-xl shadow-purple-950/20 rounded-b-[22px] border-b border-white/10">
        <div className="flex items-center gap-3.5">
          <span className="w-1.5 h-6 rounded-full bg-[#F36C21] shadow-[0_0_12px_rgba(243,108,33,0.6)]"></span>
          <div>
            <h2 className="text-sm font-black text-white tracking-wider uppercase font-sans">
              {title}
            </h2>
            <p className="text-[10px] text-purple-200/80 font-medium">Engineering College Management System</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Live Badge */}
          <span className="text-[10px] px-3 py-1 rounded-full bg-white/10 text-emerald-300 border border-white/15 font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#00C48C] animate-pulse"></span>
            System Live
          </span>

          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-indigo-200" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
          </button>

          {/* User Profile Avatar Container */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="group flex items-center gap-3 focus:outline-none"
              title="Click to view profile menu"
            >
              <div className="relative">
                {user?.photoUrl && !imgError ? (
                  <img
                    src={user.photoUrl}
                    alt={userName}
                    onError={() => setImgError(true)}
                    className="w-10 h-10 rounded-xl object-cover border-2 border-[#F36C21] shadow-lg shadow-orange-500/30 group-hover:scale-105 transition-all"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-[#F36C21] text-white font-black flex items-center justify-center text-sm shadow-lg shadow-orange-500/30 group-hover:scale-105 transition-all border border-white/30" suppressHydrationWarning>
                    {getUserInitials(userName)}
                  </div>
                )}
                {/* Active Indicator Ring */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#00C48C] border-2 border-[#2D2575] rounded-full"></span>
              </div>

              <div className="hidden sm:block text-left" suppressHydrationWarning>
                <span className="block text-xs font-black text-white truncate max-w-[130px]" suppressHydrationWarning>{userName}</span>
                <span className="block text-[10px] text-purple-200/80 font-bold uppercase" suppressHydrationWarning>{userRole}</span>
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
                      className="w-12 h-12 rounded-xl object-cover border border-indigo-500/40 shadow-lg shadow-indigo-500/10"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white font-black flex items-center justify-center text-base shadow-lg shadow-indigo-600/25 border border-indigo-400/30" suppressHydrationWarning>
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
                      setActiveModal('PROFILE');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-xs font-semibold text-left group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all">
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
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center transition-all">
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
      {/* 1. PROFILE MODAL */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeModal === 'PROFILE' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
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
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white font-black flex items-center justify-center text-2xl shadow-md border border-indigo-400/30 shrink-0">
                  {getUserInitials(userName)}
                </div>
              )}

              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-white">{userName}</h3>
                <p className="text-xs text-indigo-400 font-mono">{user?.email || 'N/A'}</p>
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
                <p className="text-indigo-400 font-mono font-semibold">{user?.registrationNo || user?.empId || user?.id || 'N/A'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800/80 space-y-1">
                <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">System Role</p>
                <p className="text-slate-200 font-semibold">{userRole}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800/80 space-y-1">
                <p className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">College Tenant</p>
                <p className="text-indigo-400 font-mono font-semibold uppercase">{user?.tenantSlug || 'srms'}</p>
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
    </>
  );
}
