'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface CollegeTenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  plan?: string;
  primary_color?: string;
  is_active?: boolean;
}

const DEFAULT_COLLEGES: CollegeTenant[] = [
  {
    id: 'srms-ims-default',
    name: 'SRMS Institute of Medical Sciences Bareilly',
    slug: 'srms-ims',
    domain: 'https://srms.ac.in/ims',
    plan: 'Enterprise',
    primary_color: '#2D2575',
    is_active: true,
  },
  {
    id: '74a62646-86cf-42a8-849f-7b74773232e2',
    name: 'Rajshree Medical Research Institute Bareilly',
    slug: 'rajshreemri',
    domain: 'https://rajshreemri.in/',
    plan: 'Enterprise',
    primary_color: '#5B4BFF',
    is_active: true,
  },
];

export default function LoginPage() {
  // Step 1: College Selection & Auto-complete state
  const [colleges, setColleges] = useState<CollegeTenant[]>(DEFAULT_COLLEGES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollege, setSelectedCollege] = useState<CollegeTenant | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Step 2: Login Form State (Hidden until college is selected)
  const [role, setRole] = useState<'STUDENT' | 'FACULTY' | 'ADMIN' | 'CLERK' | 'WARDEN'>('STUDENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch real colleges from backend
  useEffect(() => {
    async function loadColleges() {
      try {
        const res = await fetch('http://localhost:3001/api/v1/college-master/colleges');
        if (res.ok) {
          const json = await res.json();
          const list: CollegeTenant[] = json.data || (Array.isArray(json) ? json : []);
          const map = new Map<string, CollegeTenant>();
          DEFAULT_COLLEGES.forEach(c => map.set(c.slug, c));
          list.forEach(c => map.set(c.slug, c));
          const allColleges = Array.from(map.values());
          setColleges(allColleges);

          const savedSlug = localStorage.getItem('tenantSlug');
          if (savedSlug) {
            const match = allColleges.find(c => c.slug === savedSlug);
            if (match) setSelectedCollege(match);
          }
        }
      } catch (err) {
        console.warn('Could not fetch colleges from API, using fallback defaults', err);
        const savedSlug = localStorage.getItem('tenantSlug');
        if (savedSlug) {
          const match = DEFAULT_COLLEGES.find(c => c.slug === savedSlug);
          if (match) setSelectedCollege(match);
        }
      }
    }
    loadColleges();
  }, []);

  // Handle outside clicks to close auto-complete dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter colleges based on auto-complete query
  const filteredColleges = colleges.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      (c.domain && c.domain.toLowerCase().includes(q))
    );
  });

  // Select college handler
  const handleSelectCollege = (college: CollegeTenant) => {
    setSelectedCollege(college);
    setSearchQuery('');
    setIsDropdownOpen(false);
    setErrorMsg('');
    localStorage.setItem('tenantSlug', college.slug);
    applyRolePreset(role);
  };

  // Switch / Change College
  const handleResetCollege = () => {
    setSelectedCollege(null);
    setSearchQuery('');
    setIsDropdownOpen(true);
    setErrorMsg('');
  };

  // Apply Role Presets
  const applyRolePreset = (r: 'STUDENT' | 'FACULTY' | 'ADMIN' | 'CLERK' | 'WARDEN') => {
    setRole(r);
    setErrorMsg('');
    if (r === 'ADMIN') {
      setEmail('admin');
      setPassword('admin@123');
    } else if (r === 'CLERK') {
      setEmail('1234');
      setPassword('1234');
    } else if (r === 'STUDENT') {
      setEmail('2023MBBS045');
      setPassword('2023MBBS045');
    } else if (r === 'FACULTY') {
      setEmail('EMP1001');
      setPassword('Password@123');
    } else if (r === 'WARDEN') {
      setEmail('warden');
      setPassword('warden123');
    }
  };

  // Submit Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollege) {
      setErrorMsg('Please select your institution first.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const targetSlug = selectedCollege.slug;

    try {
      const res = await fetch(`http://localhost:3001/api/v1/auth/login?tenant=${targetSlug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': targetSlug,
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          role: role === 'ADMIN' ? 'COLLEGE_ADMIN' : role,
          tenantSlug: targetSlug,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success) {
        const authData = json.data || json;
        const accessToken = authData.accessToken || authData.access_token;
        const refreshToken = authData.refreshToken || authData.refresh_token;

        if (accessToken) {
          const collegeName = authData.user?.tenantName || selectedCollege?.name || (targetSlug === 'rajshreemri' ? 'Rajshree Medical Research Institute Bareilly' : 'SRMS Institute of Medical Sciences Bareilly');
          localStorage.setItem('token', accessToken);
          localStorage.setItem('refreshToken', refreshToken || '');
          localStorage.setItem('tenantSlug', targetSlug);
          localStorage.setItem('collegeName', collegeName);
          localStorage.setItem('role', role);

          if (authData.user) {
            localStorage.setItem('user', JSON.stringify(authData.user));
            const uDeptId =
              authData.user.departmentId ||
              authData.user.department_id ||
              authData.user.profile?.department_id ||
              '';
            const uDeptName =
              authData.user.departmentName ||
              authData.user.department_name ||
              authData.user.profile?.department_name ||
              '';
            const uSubjId =
              authData.user.subjectId ||
              authData.user.subject_id ||
              authData.user.profile?.subject_id ||
              '';
            const uSubjName =
              authData.user.subjectName ||
              authData.user.subject_name ||
              authData.user.profile?.primary_subject_name ||
              '';

            if (uDeptId) localStorage.setItem('departmentId', uDeptId);
            if (uDeptName) localStorage.setItem('departmentName', uDeptName);
            if (uSubjId) localStorage.setItem('subjectId', uSubjId);
            if (uSubjName) localStorage.setItem('subjectName', uSubjName);
          }

          window.location.href = `/dashboard/${role.toLowerCase()}`;
          return;
        }
      }

      const msg = json.message || 'Invalid credentials or inactive account for this college.';
      setErrorMsg(Array.isArray(msg) ? msg.join(', ') : msg);
    } catch (err) {
      setErrorMsg('Failed to connect to MedERP authentication server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 md:p-8 bg-[#F6F8FC] text-[#1B1E28] relative overflow-hidden font-sans selection:bg-[#5B4BFF] selection:text-white">
      {/* Background Decorative Ambient Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#5B4BFF]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#F36C21]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card Container */}
      <div className="w-full max-w-xl bg-white rounded-[26px] border border-[#E7EAF3] shadow-[0_12px_40px_-8px_rgba(45,37,117,0.12)] overflow-hidden relative z-10 transition-all duration-300">
        {/* Top Purple Branding Banner */}
        <div className="bg-gradient-to-r from-[#2D2575] via-[#221C5C] to-[#3B2F96] p-6 md:p-8 text-white relative">
          {/* Subtle ECG Heartbeat Pulse Line */}
          <div className="absolute top-3 right-6 opacity-20 pointer-events-none">
            <svg width="140" height="40" viewBox="0 0 140 40" fill="none">
              <path
                d="M0 20 H30 L35 10 L42 32 L48 5 L55 28 L60 20 H140"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl shadow-inner">
              🏥
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#F36C21] bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                  UNICAMPUS PLUS
                </span>
                <span className="text-xs text-white/60 font-mono">v2.4.0</span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white mt-0.5">
                UNICAMPUS PLUS Portal Access
              </h1>
            </div>
          </div>
          <p className="text-xs md:text-sm text-white/75 font-normal max-w-md">
            A Platform of Medical College • Schema-isolated academic and hospital management system.
          </p>
        </div>

        {/* Card Body */}
        <div className="p-6 md:p-8 space-y-6">
          {/* ══════════════════════════════════════════════════════════════════
              STAGE 1: AUTO-COMPLETE COLLEGE SEARCH (WHEN NO COLLEGE SELECTED)
              ══════════════════════════════════════════════════════════════════ */}
          {!selectedCollege ? (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#2D2575] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#5B4BFF] text-white flex items-center justify-center text-[11px] font-bold">
                      1
                    </span>
                    Select Your Medical College / Campus
                  </label>
                  <span className="text-[11px] font-semibold text-[#5B4BFF]">
                    {colleges.length} Verified Tenants
                  </span>
                </div>
                <p className="text-xs text-[#7B8794] mb-3">
                  Type your institution name, city, or campus code to access your college&apos;s dedicated portal.
                </p>

                {/* Search Auto-complete Box */}
                <div className="relative" ref={searchContainerRef}>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-[#7B8794] text-base pointer-events-none">
                      🔍
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      placeholder="Search college (e.g. SRMS, Rajshree, Bareilly)..."
                      className="w-full pl-11 pr-10 py-3.5 rounded-[16px] bg-[#F6F8FC] border border-[#E7EAF3] text-sm text-[#1B1E28] font-medium placeholder-[#7B8794] focus:outline-none focus:border-[#5B4BFF] focus:ring-4 focus:ring-[#5B4BFF]/15 transition-all shadow-sm"
                      autoFocus
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 text-[#7B8794] hover:text-[#1B1E28] text-xs px-2 py-1 rounded-md bg-white border border-[#E7EAF3]"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Auto-Complete Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute top-[105%] left-0 right-0 max-h-72 overflow-y-auto bg-white rounded-[18px] border border-[#E7EAF3] shadow-[0_16px_36px_-8px_rgba(45,37,117,0.2)] z-50 p-2 space-y-1">
                      {filteredColleges.length === 0 ? (
                        <div className="p-4 text-center text-xs text-[#7B8794]">
                          No college found matching &ldquo;<span className="text-[#1B1E28] font-semibold">{searchQuery}</span>&rdquo;.
                        </div>
                      ) : (
                        filteredColleges.map((college) => (
                          <button
                            key={college.slug}
                            type="button"
                            onClick={() => handleSelectCollege(college)}
                            className="w-full text-left p-3 rounded-[12px] hover:bg-[#F6F8FC] transition-all flex items-center justify-between group border border-transparent hover:border-[#E7EAF3]"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2D2575] to-[#5B4BFF] text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                                🎓
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-[#1B1E28] group-hover:text-[#5B4BFF] transition-colors leading-snug">
                                  {college.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] font-mono font-medium text-[#7B8794] bg-[#F6F8FC] px-1.5 py-0.5 rounded border border-[#E7EAF3]">
                                    tenant: {college.slug}
                                  </span>
                                  {college.plan && (
                                    <span className="text-[10px] text-[#00C48C] font-semibold">
                                      • {college.plan} Tier
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs text-[#5B4BFF] opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                              Select ➔
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Popular Colleges Quick Select Cards */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7B8794] block mb-2.5">
                  Recommended Campus Hubs:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {colleges.slice(0, 4).map((college) => (
                    <button
                      key={college.slug}
                      type="button"
                      onClick={() => handleSelectCollege(college)}
                      className="p-3 rounded-[16px] bg-[#F6F8FC] hover:bg-white border border-[#E7EAF3] hover:border-[#5B4BFF] hover:shadow-[0_4px_16px_rgba(91,75,255,0.1)] text-left transition-all flex items-start gap-2.5 group"
                    >
                      <span className="text-lg mt-0.5">🏛️</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#1B1E28] group-hover:text-[#5B4BFF] truncate">
                          {college.name}
                        </p>
                        <p className="text-[10px] font-mono text-[#7B8794] mt-0.5">
                          slug: {college.slug}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Security Banner Footer */}
              <div className="p-3.5 rounded-[16px] bg-[#2D2575]/5 border border-[#2D2575]/10 flex items-center gap-3">
                <span className="text-xl">🔒</span>
                <p className="text-xs text-[#4E5969] leading-relaxed">
                  <strong>Zero Cross-Tenant Leakage:</strong> Database schema isolation is dynamically switched based on your verified medical college choice.
                </p>
              </div>

              {/* Back to Home Link */}
              <div className="pt-2">
                <Link
                  href="/"
                  className="text-xs font-semibold text-[#5B4BFF] hover:underline flex items-center gap-1"
                >
                  ← Return to Home
                </Link>
              </div>
            </div>
          ) : (
            /* ══════════════════════════════════════════════════════════════════
               STAGE 2: TENANT-BASED LOGIN PANEL (REVEALED AFTER COLLEGE PICKED)
               ══════════════════════════════════════════════════════════════════ */
            <div className="space-y-6 animate-fadeIn">
              {/* Selected College Header Banner */}
              <div className="p-4 rounded-[18px] bg-gradient-to-r from-[#2D2575]/5 via-[#5B4BFF]/5 to-transparent border border-[#5B4BFF]/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2D2575] to-[#5B4BFF] text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                    🏛️
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B4BFF] bg-[#5B4BFF]/10 px-2 py-0.5 rounded-full">
                      Active Tenant
                    </span>
                    <h3 className="text-sm font-extrabold text-[#1B1E28] truncate mt-0.5">
                      {selectedCollege.name}
                    </h3>
                    <p className="text-[11px] font-mono text-[#7B8794]">
                      tenant_{selectedCollege.slug}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetCollege}
                  className="px-3 py-1.5 rounded-full bg-white hover:bg-[#F6F8FC] border border-[#E7EAF3] text-xs font-semibold text-[#5B4BFF] hover:border-[#5B4BFF] shadow-sm transition-all flex items-center gap-1.5 shrink-0"
                  title="Switch to another college"
                >
                  <span>🔄</span>
                  <span>Change</span>
                </button>
              </div>

              {/* Role Selection Tabs */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4E5969] mb-2">
                  Select Portal Role
                </label>
                <div className="grid grid-cols-5 gap-1.5 p-1.5 bg-[#F6F8FC] rounded-[16px] border border-[#E7EAF3]">
                  {(['STUDENT', 'FACULTY', 'ADMIN', 'CLERK', 'WARDEN'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => applyRolePreset(r)}
                      className={`py-2 px-1 rounded-[12px] text-xs font-bold transition-all text-center ${
                        role === r
                          ? 'bg-[#5B4BFF] text-white shadow-[0_4px_12px_rgba(91,75,255,0.3)] scale-[1.02]'
                          : 'text-[#7B8794] hover:text-[#1B1E28] hover:bg-white/50'
                      }`}
                    >
                      {r === 'ADMIN' ? 'Admin' : r === 'CLERK' ? 'Clerk' : r.charAt(0) + r.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Quick Demo Credential Hints */}
              <div className="p-3.5 rounded-[16px] bg-[#5B4BFF]/5 border border-[#5B4BFF]/15 text-xs text-[#2D2575] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span>💡</span>
                  <span>
                    {role === 'STUDENT' && <>Student ID: <strong>2023MBBS045</strong></>}
                    {role === 'FACULTY' && <>Faculty ID: <strong>EMP1001</strong></>}
                    {role === 'ADMIN' && <>Admin User: <strong>admin</strong></>}
                    {role === 'CLERK' && <>Clerk ID: <strong>1234</strong></>}
                    {role === 'WARDEN' && <>Warden User: <strong>warden</strong></>}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => applyRolePreset(role)}
                  className="px-2.5 py-1 rounded-full bg-[#5B4BFF] text-white text-[11px] font-bold hover:bg-[#4638DE] transition-all shrink-0"
                >
                  Quick Fill ⚡
                </button>
              </div>

              {/* Error Message Alert */}
              {errorMsg && (
                <div className="p-3 rounded-[14px] bg-[#F04438]/10 border border-[#F04438]/20 text-xs text-[#F04438] font-semibold text-center animate-shake">
                  {errorMsg}
                </div>
              )}

              {/* Active Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4E5969] mb-1.5">
                    {role === 'STUDENT'
                      ? 'Registration No / Username'
                      : role === 'FACULTY'
                      ? 'Faculty Emp ID / Email'
                      : 'Username / Email'}
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-[#7B8794] text-base">
                      👤
                    </span>
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={
                        role === 'STUDENT'
                          ? 'e.g. 2023MBBS045'
                          : role === 'FACULTY'
                          ? 'e.g. EMP1001'
                          : role === 'CLERK'
                          ? '1234'
                          : role === 'ADMIN'
                          ? 'admin'
                          : 'warden'
                      }
                      className="w-full pl-11 pr-4 py-3 rounded-[16px] bg-[#F6F8FC] border border-[#E7EAF3] text-sm text-[#1B1E28] font-medium placeholder-[#7B8794] focus:outline-none focus:border-[#5B4BFF] focus:ring-4 focus:ring-[#5B4BFF]/15 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4E5969] mb-1.5">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-[#7B8794] text-base">
                      🔑
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-11 py-3 rounded-[16px] bg-[#F6F8FC] border border-[#E7EAF3] text-sm text-[#1B1E28] font-medium placeholder-[#7B8794] focus:outline-none focus:border-[#5B4BFF] focus:ring-4 focus:ring-[#5B4BFF]/15 transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-[#7B8794] hover:text-[#1B1E28] text-xs p-1"
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[#7B8794] pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded text-[#5B4BFF] focus:ring-[#5B4BFF] w-4 h-4"
                    />
                    <span>Remember this College</span>
                  </label>
                  <span className="text-[#5B4BFF] font-semibold cursor-pointer hover:underline">
                    Forgot Password?
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#2D2575] via-[#5B4BFF] to-[#7867FF] hover:opacity-95 text-white font-bold text-sm shadow-[0_8px_24px_rgba(91,75,255,0.35)] hover:shadow-[0_12px_28px_rgba(91,75,255,0.45)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>
                    {loading
                      ? 'Authenticating Tenant...'
                      : `Sign In to ${selectedCollege.slug.toUpperCase()} (${role === 'ADMIN' ? 'Admin' : role.charAt(0) + role.slice(1).toLowerCase()})`}
                  </span>
                </button>
              </form>

              {/* Back to Change College */}
              <div className="pt-2 flex items-center justify-between text-xs font-semibold text-[#5B4BFF]">
                <button
                  type="button"
                  onClick={handleResetCollege}
                  className="hover:underline flex items-center gap-1"
                >
                  ← Select Different Institution
                </button>
                <Link href="/" className="text-[#7B8794] hover:text-[#1B1E28]">
                  Return to Home
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-[#F6F8FC] border-t border-[#E7EAF3] px-6 py-4 flex flex-col md:flex-row items-center justify-between text-xs text-[#7B8794] gap-2">
          <span>© 2026 UNICAMPUS PLUS — A Platform of Medical College.</span>
          <Link href="/" className="text-[#5B4BFF] font-semibold hover:underline">
            ← Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}