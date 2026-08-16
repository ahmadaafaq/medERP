'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface College {
  id?: string;
  colg_cd?: number | string;
  code: string;
  name: string;
  slug: string;
  domain?: string;
  plan?: string;
  primary_color?: string;
}

const API_BASE = 'http://localhost:3001/api/v1';

// Default standard list of SRMS group institutions for instant zero-latency loading
const DEFAULT_COLLEGES: College[] = [
  {
    code: '1',
    colg_cd: '1',
    name: 'SRMS College of Engineering & Technology, Bareilly',
    slug: 'srms-cet-bareilly',
    domain: 'srms-cet.mederp.app',
    plan: 'enterprise',
    primary_color: '#5B4BFF',
  },
  {
    code: '2',
    colg_cd: '2',
    name: 'SRMS Institute of Medical Sciences (IMS), Bareilly',
    slug: 'srms-ims',
    domain: 'srms-ims.mederp.app',
    plan: 'enterprise',
    primary_color: '#00C48C',
  },
  {
    code: '3',
    colg_cd: '3',
    name: 'SRMS International Business School (IBS), Lucknow',
    slug: 'srms-ibs-lucknow',
    domain: 'srms-ibs.mederp.app',
    plan: 'enterprise',
    primary_color: '#F36C21',
  },
  {
    code: '4',
    colg_cd: '4',
    name: 'SRMS College of Law, Bareilly',
    slug: 'srms-college-of-law',
    domain: 'srms-law.mederp.app',
    plan: 'enterprise',
    primary_color: '#8B5CF6',
  },
  {
    code: '5',
    colg_cd: '5',
    name: 'SRMS College of Nursing, Bareilly',
    slug: 'srms-nursing-college',
    domain: 'srms-nursing.mederp.app',
    plan: 'enterprise',
    primary_color: '#EC4899',
  },
  {
    code: '6',
    colg_cd: '6',
    name: 'SRMS Institute of Allied Health Sciences (IAHS), Bareilly',
    slug: 'srms-iahs-bareilly',
    domain: 'srms-iahs.mederp.app',
    plan: 'enterprise',
    primary_color: '#3B82F6',
  },
  {
    code: '7',
    colg_cd: '7',
    name: 'SRMS College of Nursing & Paramedical Sciences, Unnao',
    slug: 'srms-college-of-nursing-paramedical-sciences-unnao',
    domain: 'srms-unnao.mederp.app',
    plan: 'enterprise',
    primary_color: '#10B981',
  },
  {
    code: '8',
    colg_cd: '8',
    name: 'SRMS Riddhima Centre for Performing Arts, Bareilly',
    slug: 'srms-riddhima-bareilly',
    domain: 'srms-riddhima.mederp.app',
    plan: 'enterprise',
    primary_color: '#F59E0B',
  },
];

export default function LoginPage() {
  const router = useRouter();

  // ─── 1. College Selection State ────────────────────────────────────────────
  const [colleges, setColleges] = useState<College[]>(DEFAULT_COLLEGES);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [collegeSearchQuery, setCollegeSearchQuery] = useState<string>('');
  const [isSearchingColleges, setIsSearchingColleges] = useState<boolean>(false);

  // ─── 2. Auth Credentials & Role State ──────────────────────────────────────
  const [role, setRole] = useState<'STUDENT' | 'FACULTY' | 'ADMIN' | 'CLERK' | 'WARDEN'>('STUDENT');
  const [email, setEmail] = useState('2023MBBS045');
  const [password, setPassword] = useState('2023MBBS045');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ─── 3. Fetch Colleges from Backend on Mount ───────────────────────────────
  useEffect(() => {
    fetchCollegesList();
    checkExistingCollegeSession();
  }, []);

  const checkExistingCollegeSession = () => {
    if (typeof window !== 'undefined') {
      const savedColgCd = localStorage.getItem('colg_cd');
      const savedSlug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant');
      if (savedColgCd || savedSlug) {
        const found = DEFAULT_COLLEGES.find(
          (c) => String(c.colg_cd || c.code) === savedColgCd || c.slug === savedSlug
        );
        if (found) {
          // Pre-populate if saved
          setSelectedCollege(found);
        }
      }
    }
  };

  const fetchCollegesList = async () => {
    try {
      const res = await fetch(`${API_BASE}/college-master/colleges`);
      if (res.ok) {
        const json = await res.json();
        const list: any[] = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
        if (list.length > 0) {
          // Deduplicate and normalize
          const map = new Map<string, College>();
          list.forEach((item) => {
            const code = String(item.code || item.colg_cd || '1');
            if (!map.has(code) && item.name) {
              map.set(code, {
                id: item.id,
                code,
                colg_cd: code,
                name: item.name,
                slug: item.slug || `srms-${code}`,
                domain: item.domain || `${item.slug || 'srms'}.mederp.app`,
                plan: item.plan || 'enterprise',
                primary_color: item.primary_color || '#5B4BFF',
              });
            }
          });
          const combined = Array.from(map.values());
          setColleges(combined.length > 0 ? combined : DEFAULT_COLLEGES);
        }
      }
    } catch (e) {
      console.warn('Using default college master roster fallback');
    }
  };

  // ─── 4. Filtered Search Roster for Autocomplete ────────────────────────────
  const filteredColleges = useMemo(() => {
    if (!collegeSearchQuery.trim()) return colleges;
    const q = collegeSearchQuery.toLowerCase();
    return colleges.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.code && String(c.code).toLowerCase().includes(q)) ||
        (c.slug && c.slug.toLowerCase().includes(q)) ||
        (c.domain && c.domain.toLowerCase().includes(q))
    );
  }, [colleges, collegeSearchQuery]);

  // ─── 5. Handle College Selection ───────────────────────────────────────────
  const handleSelectCollege = (college: College) => {
    setSelectedCollege(college);
    setErrorMsg('');
    const code = String(college.colg_cd || college.code);
    const slug = college.slug || 'srms-cet-bareilly';

    // Store in localStorage across the whole ERP
    if (typeof window !== 'undefined') {
      localStorage.setItem('colg_cd', code);
      localStorage.setItem('tenantSlug', slug);
      localStorage.setItem('selectedTenant', slug);
      localStorage.setItem('institutionSlug', slug);
      localStorage.setItem('tenant', slug);
      localStorage.setItem('collegeName', college.name);
      localStorage.setItem('colg_name', college.name);
    }

    // Role preset values adjustment
    if (role === 'STUDENT') {
      setEmail(code === '1' ? '2500141790009' : '2023MBBS045');
      setPassword(code === '1' ? '2500141790009' : '2023MBBS045');
    }
  };

  const handleResetCollege = () => {
    setSelectedCollege(null);
    setCollegeSearchQuery('');
    setErrorMsg('');
  };

  // ─── 6. Handle Login Submission ────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollege) {
      setErrorMsg('Please select a college institution first');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const targetSlug = selectedCollege.slug || 'srms-cet-bareilly';
    const targetColgCd = String(selectedCollege.colg_cd || selectedCollege.code || '1');

    try {
      const res = await fetch(`${API_BASE}/auth/login?tenant=${targetSlug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': targetSlug,
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          role: role === 'ADMIN' ? 'COLLEGE_ADMIN' : role,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const authData = json.data || json;
        if (authData.accessToken) {
          localStorage.setItem('token', authData.accessToken);
          localStorage.setItem('refreshToken', authData.refreshToken || '');
          localStorage.setItem('tenantSlug', targetSlug);
          localStorage.setItem('selectedTenant', targetSlug);
          localStorage.setItem('colg_cd', targetColgCd);
          localStorage.setItem('role', role);

          if (authData.user) {
            localStorage.setItem('user', JSON.stringify(authData.user));
            const uDeptId = authData.user.departmentId || authData.user.department_id || authData.user.profile?.department_id || '';
            const uDeptName = authData.user.departmentName || authData.user.department_name || authData.user.profile?.department_name || '';
            const uSubjId = authData.user.subjectId || authData.user.subject_id || authData.user.profile?.subject_id || '';
            const uSubjName = authData.user.subjectName || authData.user.subject_name || authData.user.profile?.primary_subject_name || '';

            if (uDeptId) localStorage.setItem('departmentId', uDeptId);
            if (uDeptName) localStorage.setItem('departmentName', uDeptName);
            if (uSubjId) localStorage.setItem('subjectId', uSubjId);
            if (uSubjName) localStorage.setItem('subjectName', uSubjName);
          }

          // Direct route navigation
          window.location.href = `/dashboard/${role.toLowerCase()}`;
          return;
        }
      }

      const errData = await res.json().catch(() => ({}));
      const msg = errData.message || 'Invalid credentials for this institution';
      setErrorMsg(msg);
    } catch (err) {
      setErrorMsg('Failed to connect to backend authentication service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-[#F6F8FC] dark:bg-[#0B1120] text-[#1B1E28] dark:text-white font-sans transition-colors">
      
      {/* Brand Header */}
      <div className="text-center mb-6 space-y-2">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#2D2575] text-white shadow-md">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00C48C] animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider">UniCampus MedERP Core Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#1B1E28] dark:text-white">
          Institutional Access Portal
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Single sign-on gateway for Engineering, Medical, Business, and Law colleges.
        </p>
      </div>

      {/* Main Container Card */}
      <div className="w-full max-w-xl bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 rounded-[28px] p-6 sm:p-8 shadow-[0_12px_40px_rgba(45,37,117,0.08)] space-y-6">

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* STAGE 1: COLLEGE AUTOCOMPLETE SEARCH SELECTOR (When Form is Hidden) */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {!selectedCollege ? (
          <div className="space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-[#5B4BFF] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#5B4BFF] text-white flex items-center justify-center text-xs font-bold">1</span>
                  Select Your College Institution
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Search by College Name, Code (e.g. 1, 2), or Campus
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-[#5B4BFF] border border-indigo-100 dark:border-indigo-900">
                {colleges.length} Institutions
              </span>
            </div>

            {/* Auto Complete Search Input */}
            <div className="relative">
              <input
                type="text"
                value={collegeSearchQuery}
                onChange={(e) => {
                  setCollegeSearchQuery(e.target.value);
                  setIsSearchingColleges(true);
                }}
                onFocus={() => setIsSearchingColleges(true)}
                placeholder="🔍 Type college name, 'CET', 'IMS', 'Law', '1', '2'..."
                className="w-full px-4 py-3.5 rounded-2xl bg-[#F6F8FC] dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:border-[#5B4BFF] transition shadow-inner placeholder-slate-400"
                autoFocus
              />
              {collegeSearchQuery && (
                <button
                  type="button"
                  onClick={() => setCollegeSearchQuery('')}
                  className="absolute right-3.5 top-3.5 w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold hover:bg-slate-400"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Colleges List / Autocomplete Results */}
            <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1">
              {filteredColleges.length === 0 ? (
                <div className="p-8 text-center bg-[#F6F8FC] dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-400">
                  No institution found matching &quot;{collegeSearchQuery}&quot;
                </div>
              ) : (
                filteredColleges.map((colg) => {
                  const colgCode = String(colg.colg_cd || colg.code);
                  return (
                    <div
                      key={colg.code || colg.slug}
                      onClick={() => handleSelectCollege(colg)}
                      className="p-4 rounded-2xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#5B4BFF] hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 cursor-pointer transition-all duration-200 shadow-xs flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-sm text-[#5B4BFF] shadow-xs group-hover:scale-105 transition-transform flex-shrink-0">
                          🏛️
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate group-hover:text-[#5B4BFF] transition-colors">
                            {colg.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="px-2 py-0.5 rounded font-mono font-black text-[10px] bg-[#F36C21]/10 text-[#F36C21] border border-[#F36C21]/20">
                              colg_cd: {colgCode}
                            </span>
                            <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              tenant: {colg.slug}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-white dark:bg-slate-800 text-[#5B4BFF] border border-slate-200 dark:border-slate-700 group-hover:bg-[#5B4BFF] group-hover:text-white transition-all shadow-xs">
                          Select →
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* ═══════════════════════════════════════════════════════════════════ */
          /* STAGE 2: LOGIN FORM WITH SELECTED TENANT DISPLAY AT TOP             */
          /* ═══════════════════════════════════════════════════════════════════ */
          <div className="space-y-6 animate-fadeIn">
            
            {/* Top Selected College Tenant Display Header */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#2D2575] via-[#372E8E] to-[#2D2575] text-white flex items-center justify-between gap-3 shadow-md border border-indigo-400/20">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-lg flex-shrink-0">
                  🏛️
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-[#F36C21] text-white uppercase shadow-xs">
                      colg_cd: {selectedCollege.colg_cd || selectedCollege.code}
                    </span>
                    <span className="text-[10px] font-mono text-indigo-200">
                      tenant: {selectedCollege.slug}
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-black text-white truncate mt-0.5">
                    {selectedCollege.name}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetCollege}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 transition flex-shrink-0 flex items-center gap-1 shadow-xs"
                title="Choose different college"
              >
                <span>🔄</span>
                <span className="hidden sm:inline">Change</span>
              </button>
            </div>

            {/* Portal Role Selector Tabs */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Portal Access Role
              </label>
              <div className="grid grid-cols-5 gap-1.5 p-1.5 bg-[#F6F8FC] dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-black">
                {(['STUDENT', 'FACULTY', 'ADMIN', 'CLERK', 'WARDEN'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRole(r);
                      setErrorMsg('');
                      const code = String(selectedCollege.colg_cd || selectedCollege.code);
                      if (r === 'ADMIN') {
                        setEmail('admin');
                        setPassword('admin@123');
                      } else if (r === 'CLERK') {
                        setEmail('1234');
                        setPassword('1234');
                      } else if (r === 'STUDENT') {
                        setEmail(code === '1' ? '2500141790009' : '2023MBBS045');
                        setPassword(code === '1' ? '2500141790009' : '2023MBBS045');
                      } else if (r === 'FACULTY') {
                        setEmail('EMP1001');
                        setPassword('Password@123');
                      } else if (r === 'WARDEN') {
                        setEmail('warden');
                        setPassword('warden123');
                      }
                    }}
                    className={`py-2 rounded-xl transition-all text-center text-[11px] ${
                      role === r
                        ? 'bg-[#5B4BFF] text-white shadow-md shadow-[#5B4BFF]/25'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {r === 'ADMIN' ? 'Admin' : r === 'CLERK' ? 'Clerk' : r.charAt(0) + r.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Role Banner Hint */}
            {role === 'STUDENT' && (
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/40 text-xs text-[#5B4BFF] flex items-center gap-2">
                <span>🎓</span>
                <span>Student Login: Use <strong>Registration No / Roll No</strong> as Username &amp; Password.</span>
              </div>
            )}
            {role === 'FACULTY' && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 text-xs text-[#00C48C] flex items-center gap-2">
                <span>👨‍🏫</span>
                <span>Faculty Login: Use registered <strong>Emp ID</strong> (e.g. <code>EMP1001</code>) and Password.</span>
              </div>
            )}
            {role === 'ADMIN' && (
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/40 text-xs text-purple-700 dark:text-purple-300 flex items-center gap-2">
                <span>⚡</span>
                <span>Admin Login: Username <code>admin</code> and Password <code>admin@123</code>.</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/40 text-xs text-[#F04438] text-center font-bold">
                {errorMsg}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                  {role === 'STUDENT' ? 'Registration No / Roll No' : role === 'FACULTY' ? 'Emp ID / Email' : 'Username / Email'} *
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF] text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF] text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4938DF] text-white font-black text-sm shadow-lg shadow-[#5B4BFF]/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {loading ? 'Authenticating & Synchronizing...' : `Sign In as ${role === 'ADMIN' ? 'Admin' : role.charAt(0) + role.slice(1).toLowerCase()}`}
              </button>
            </form>
          </div>
        )}

      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-xs text-slate-400 font-medium">
        © 2026 UniCampus ERP Platform • Schema-per-Tenant Multi-Tenancy Architecture
      </div>

    </div>
  );
}
