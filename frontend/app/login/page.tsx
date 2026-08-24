'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface College {
  id?: string;
  colg_cd?: number | string;
  code: string;
  name: string;
  slug: string;
  domain?: string;
  plan?: string;
  primary_color?: string;
  theme_config?: {
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
    sidebar_bg?: string;
    header_bg?: string;
    page_bg?: string;
    card_bg?: string;
    card_radius?: string;
    table_header_bg?: string;
    table_zebra?: boolean;
    theme_mode?: string;
  };
}

const API_BASE = 'http://localhost:3001/api/v1';

const DEFAULT_COLLEGES: College[] = [
  {
    code: '1',
    colg_cd: '1',
    name: 'SRMS College of Engineering & Technology, Bareilly',
    slug: 'srms-cet-bareilly',
    domain: 'srms-cet.mederp.app',
    plan: 'enterprise',
    primary_color: '#5B4BFF',
    theme_config: {
      primary_color: '#5B4BFF',
      secondary_color: '#7867FF',
      accent_color: '#F36C21',
      sidebar_bg: '#2D2575',
      header_bg: '#2D2575',
      page_bg: '#F6F8FC',
      card_bg: '#FFFFFF',
      card_radius: '22px',
    },
  },
  {
    code: '2',
    colg_cd: '2',
    name: 'SRMS Institute of Medical Sciences (IMS), Bareilly',
    slug: 'srms-ims',
    domain: 'srms-ims.mederp.app',
    plan: 'enterprise',
    primary_color: '#00C48C',
    theme_config: {
      primary_color: '#00C48C',
      secondary_color: '#059669',
      accent_color: '#F36C21',
      sidebar_bg: '#064E3B',
      header_bg: '#064E3B',
      page_bg: '#F0FDF4',
      card_bg: '#FFFFFF',
      card_radius: '22px',
    },
  },
  {
    code: '3',
    colg_cd: '3',
    name: 'SRMS International Business School (IBS), Lucknow',
    slug: 'srms-ibs-lucknow',
    domain: 'srms-ibs.mederp.app',
    plan: 'enterprise',
    primary_color: '#F36C21',
    theme_config: {
      primary_color: '#F36C21',
      secondary_color: '#D97706',
      accent_color: '#5B4BFF',
      sidebar_bg: '#1C1917',
      header_bg: '#1C1917',
      page_bg: '#FFFBEB',
      card_bg: '#FFFFFF',
      card_radius: '20px',
    },
  },
  {
    code: '4',
    colg_cd: '4',
    name: 'SRMS College of Law, Bareilly',
    slug: 'srms-college-of-law',
    domain: 'srms-law.mederp.app',
    plan: 'enterprise',
    primary_color: '#E11D48',
    theme_config: {
      primary_color: '#E11D48',
      secondary_color: '#FB7185',
      accent_color: '#F59E0B',
      sidebar_bg: '#4C0519',
      header_bg: '#4C0519',
      page_bg: '#FFF1F2',
      card_bg: '#FFFFFF',
      card_radius: '16px',
    },
  },
  {
    code: '5',
    colg_cd: '5',
    name: 'SRMS College of Nursing, Bareilly',
    slug: 'srms-nursing-college',
    domain: 'srms-nursing.mederp.app',
    plan: 'enterprise',
    primary_color: '#EC4899',
    theme_config: {
      primary_color: '#EC4899',
      secondary_color: '#F472B6',
      accent_color: '#00C48C',
      sidebar_bg: '#500724',
      header_bg: '#500724',
      page_bg: '#FDF2F8',
      card_bg: '#FFFFFF',
      card_radius: '18px',
    },
  },
  {
    code: '6',
    colg_cd: '6',
    name: 'SRMS Institute of Allied Health Sciences (IAHS), Bareilly',
    slug: 'srms-iahs-bareilly',
    domain: 'srms-iahs.mederp.app',
    plan: 'enterprise',
    primary_color: '#3B82F6',
    theme_config: {
      primary_color: '#0284C7',
      secondary_color: '#38BDF8',
      accent_color: '#F59E0B',
      sidebar_bg: '#0F172A',
      header_bg: '#0F172A',
      page_bg: '#F8FAFC',
      card_bg: '#FFFFFF',
      card_radius: '16px',
    },
  },
  {
    code: '7',
    colg_cd: '7',
    name: 'SRMS College of Nursing & Paramedical Sciences, Unnao',
    slug: 'srms-college-of-nursing-paramedical-sciences-unnao',
    domain: 'srms-unnao.mederp.app',
    plan: 'enterprise',
    primary_color: '#10B981',
    theme_config: {
      primary_color: '#059669',
      secondary_color: '#10B981',
      accent_color: '#F36C21',
      sidebar_bg: '#064E3B',
      header_bg: '#064E3B',
      page_bg: '#F0FDF4',
      card_bg: '#FFFFFF',
      card_radius: '22px',
    },
  },
  {
    code: '8',
    colg_cd: '8',
    name: 'SRMS Riddhima Centre for Performing Arts, Bareilly',
    slug: 'srms-riddhima-bareilly',
    domain: 'srms-riddhima.mederp.app',
    plan: 'enterprise',
    primary_color: '#F59E0B',
    theme_config: {
      primary_color: '#D97706',
      secondary_color: '#F59E0B',
      accent_color: '#5B4BFF',
      sidebar_bg: '#1C1917',
      header_bg: '#1C1917',
      page_bg: '#FFFBEB',
      card_bg: '#FFFFFF',
      card_radius: '20px',
    },
  },
];

export default function LoginPage() {
  const router = useRouter();

  // ─── 1. College Selection State ────────────────────────────────────────────
  const [colleges, setColleges] = useState<College[]>(DEFAULT_COLLEGES);
  const [selectedCollege, setSelectedCollege] = useState<College>(DEFAULT_COLLEGES[0]);
  const [isCollegePickerOpen, setIsCollegePickerOpen] = useState<boolean>(false);
  const [collegeSearchQuery, setCollegeSearchQuery] = useState<string>('');

  // ─── 2. Auth Credentials & Role State ──────────────────────────────────────
  const [role, setRole] = useState<'STUDENT' | 'FACULTY' | 'ADMIN' | 'CLERK' | 'WARDEN'>('STUDENT');
  const [email, setEmail] = useState('2500141790009');
  const [password, setPassword] = useState('2500141790009');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Dynamic theme derived from selected college or Owner custom overrides
  const [ownerThemeOverride, setOwnerThemeOverride] = useState<any>(null);

  const currentTheme = useMemo(() => {
    const cfg = ownerThemeOverride || selectedCollege?.theme_config || {};
    return {
      primary: cfg.primary_color || selectedCollege?.primary_color || '#5B4BFF',
      secondary: cfg.secondary_color || '#7867FF',
      accent: cfg.accent_color || '#F36C21',
      sidebarBg: cfg.sidebar_bg || '#2D2575',
      headerBg: cfg.header_bg || cfg.sidebar_bg || '#2D2575',
      pageBg: cfg.page_bg || '#0E0A24',
      cardBg: cfg.card_bg || '#1E1945',
      cardRadius: cfg.card_radius || '24px',
    };
  }, [selectedCollege, ownerThemeOverride]);

  // Apply theme variables live on document root & listen to Owner real-time theme updates
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--color-brand-primary', currentTheme.primary);
      root.style.setProperty('--color-brand-secondary', currentTheme.secondary);
      root.style.setProperty('--color-brand-accent', currentTheme.accent);
      root.style.setProperty('--sidebar-bg', currentTheme.sidebarBg);
      root.style.setProperty('--header-bg', currentTheme.headerBg);
      try {
        localStorage.setItem('tenant_primary_color', currentTheme.primary);
        localStorage.setItem('tenant_sidebar_bg', currentTheme.sidebarBg);
        localStorage.setItem('tenant_card_radius', currentTheme.cardRadius);
      } catch {}
    }

    const handleThemeUpdate = (e: any) => {
      if (e.detail?.theme_config) {
        setOwnerThemeOverride(e.detail.theme_config);
      } else if (typeof window !== 'undefined') {
        const savedPrimary = localStorage.getItem('tenant_primary_color');
        const savedSidebar = localStorage.getItem('tenant_sidebar_bg');
        const savedRadius = localStorage.getItem('tenant_card_radius');
        if (savedPrimary || savedSidebar) {
          setOwnerThemeOverride((prev: any) => ({
            ...prev,
            primary_color: savedPrimary || prev?.primary_color,
            sidebar_bg: savedSidebar || prev?.sidebar_bg,
            card_radius: savedRadius || prev?.card_radius,
          }));
        }
      }
    };

    window.addEventListener('themeUpdated', handleThemeUpdate);
    window.addEventListener('storage', handleThemeUpdate);
    return () => {
      window.removeEventListener('themeUpdated', handleThemeUpdate);
      window.removeEventListener('storage', handleThemeUpdate);
    };
  }, [currentTheme]);

  // ─── 3. Fetch Colleges & Check URL / Session on Mount ───────────────────────
  useEffect(() => {
    fetchCollegesList();
    checkExistingCollegeSession();
  }, []);

  const checkExistingCollegeSession = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlRole = urlParams.get('role');
      const urlCollege = urlParams.get('college');

      if (urlRole && ['STUDENT', 'FACULTY', 'ADMIN', 'CLERK', 'WARDEN'].includes(urlRole.toUpperCase())) {
        applyRolePreset(urlRole.toUpperCase() as any);
      }

      if (urlCollege) {
        const found = DEFAULT_COLLEGES.find((c) => c.slug === urlCollege || String(c.code) === urlCollege);
        if (found) {
          setSelectedCollege(found);
          localStorage.setItem('colg_cd', String(found.colg_cd || found.code));
          localStorage.setItem('tenantSlug', found.slug);
          localStorage.setItem('selectedTenant', found.slug);
          return;
        }
      }

      const savedColgCd = localStorage.getItem('colg_cd');
      const savedSlug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant');
      if (savedColgCd || savedSlug) {
        const found = DEFAULT_COLLEGES.find(
          (c) => String(c.colg_cd || c.code) === savedColgCd || c.slug === savedSlug
        );
        if (found) setSelectedCollege(found);
      } else {
        setSelectedCollege(DEFAULT_COLLEGES[0]);
        localStorage.setItem('colg_cd', '1');
        localStorage.setItem('tenantSlug', 'srms-cet-bareilly');
        localStorage.setItem('selectedTenant', 'srms-cet-bareilly');
      }
    }
  };

  const fetchCollegesList = async () => {
    try {
      const map = new Map<string, College>();

      // 1. Insert built-in default institutions
      DEFAULT_COLLEGES.forEach((c) => {
        map.set(c.slug, c);
      });

      // 2. Fetch newly registered SaaS firms from /api/firms
      try {
        const firmsRes = await fetch('/api/firms');
        if (firmsRes.ok) {
          const firmsJson = await firmsRes.json();
          const firmsList: any[] = Array.isArray(firmsJson.data)
            ? firmsJson.data
            : Array.isArray(firmsJson)
            ? firmsJson
            : [];
          firmsList.forEach((f) => {
            if (f.slug && f.title) {
              const primaryColor = (f.theme_config && f.theme_config.primary_color) || f.theme_color || '#5B4BFF';
              map.set(f.slug, {
                id: f.id,
                code: f.slug,
                colg_cd: f.slug,
                name: f.title,
                slug: f.slug,
                domain: f.domain || `${f.slug}.mederp.app`,
                plan: f.level_type || 'standard',
                primary_color: primaryColor,
                theme_config: f.theme_config || {
                  primary_color: primaryColor,
                  sidebar_bg: '#2D2575',
                  header_bg: '#2D2575',
                },
              });
            }
          });
        }
      } catch (e) {
        console.warn('Could not load firms for login autocomplete:', e);
      }

      // 3. Fetch college-master sync roster
      try {
        const res = await fetch(`${API_BASE}/college-master/colleges`);
        if (res.ok) {
          const json = await res.json();
          const list: any[] = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
          list.forEach((item) => {
            const slug = item.slug || `srms-${item.code || item.colg_cd}`;
            const code = String(item.code || item.colg_cd || '1');
            if (slug && item.name) {
              map.set(slug, {
                id: item.id,
                code,
                colg_cd: code,
                name: item.name,
                slug,
                domain: item.domain || `${slug}.mederp.app`,
                plan: item.plan || 'enterprise',
                primary_color: item.primary_color || '#5B4BFF',
              });
            }
          });
        }
      } catch {
        // Keep merged roster
      }

      const combined = Array.from(map.values());
      if (combined.length > 0) {
        setColleges(combined);
      }
    } catch {
      // Keep default roster fallback
    }
  };

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

  const handleSelectCollege = (college: College) => {
    setSelectedCollege(college);
    setIsCollegePickerOpen(false);
    setCollegeSearchQuery('');
    setErrorMsg('');
    const code = String(college.colg_cd || college.code);
    const slug = college.slug || 'srms-cet-bareilly';

    if (typeof window !== 'undefined') {
      localStorage.setItem('colg_cd', code);
      localStorage.setItem('tenantSlug', slug);
      localStorage.setItem('selectedTenant', slug);
      localStorage.setItem('institutionSlug', slug);
      localStorage.setItem('tenant', slug);
      localStorage.setItem('collegeName', college.name);
      localStorage.setItem('colg_name', college.name);
      document.cookie = `auth_tenant=${slug}; path=/; max-age=604800; SameSite=Lax`;
    }

    // Adjust demo presets based on college type
    if (role === 'STUDENT') {
      setEmail(code === '1' ? '2500141790009' : '2023MBBS045');
      setPassword(code === '1' ? '2500141790009' : '2023MBBS045');
    }
  };

  const applyRolePreset = (newRole: 'STUDENT' | 'FACULTY' | 'ADMIN' | 'CLERK' | 'WARDEN') => {
    setRole(newRole);
    setErrorMsg('');
    const code = String(selectedCollege.colg_cd || selectedCollege.code || '1');

    if (newRole === 'STUDENT') {
      setEmail(code === '1' ? '2500141790009' : '2023MBBS045');
      setPassword(code === '1' ? '2500141790009' : '2023MBBS045');
    } else if (newRole === 'FACULTY') {
      setEmail(code === '1' ? 'CET-FAC-001' : 'EMP1001');
      setPassword('Password@123');
    } else if (newRole === 'ADMIN') {
      setEmail('admin');
      setPassword('admin@123');
    } else if (newRole === 'CLERK') {
      setEmail('1234');
      setPassword('1234');
    } else if (newRole === 'WARDEN') {
      setEmail('warden');
      setPassword('warden123');
    }
  };

  // ─── 4. Handle Login Submission ────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const targetSlug = selectedCollege.slug || '';
    const targetColgCd = String(selectedCollege.colg_cd || selectedCollege.code || '1');

    try {
      const res = await fetch(`${API_BASE}/auth/login${targetSlug ? `?tenant=${targetSlug}` : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(targetSlug ? { 'x-tenant-slug': targetSlug } : {}),
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
          const verifiedSlug = authData.user?.tenantSlug || authData.tenantSlug || targetSlug || 'srms-cet-bareilly';
          localStorage.setItem('token', authData.accessToken);
          localStorage.setItem('refreshToken', authData.refreshToken || '');
          localStorage.setItem('tenantSlug', verifiedSlug);
          localStorage.setItem('selectedTenant', verifiedSlug);
          localStorage.setItem('tenant', verifiedSlug);
          localStorage.setItem('colg_cd', targetColgCd);
          localStorage.setItem('role', role);

          const institutionName =
            authData.user?.collegeName ||
            authData.user?.tenantName ||
            selectedCollege?.name ||
            (verifiedSlug === 'srms-cet-bareilly' ? 'SRMS CET, BAREILLY' : verifiedSlug.toUpperCase());

          localStorage.setItem('collegeName', institutionName);
          localStorage.setItem('college_name', institutionName);
          localStorage.setItem('colg_name', institutionName);
          localStorage.setItem('tenantName', institutionName);

          // Set cookie for Next.js Middleware route guard
          document.cookie = `auth_token=${authData.accessToken}; path=/; max-age=604800; SameSite=Lax`;
          document.cookie = `auth_tenant=${verifiedSlug}; path=/; max-age=604800; SameSite=Lax`;
          document.cookie = `auth_role=${(authData.user?.role || role).toLowerCase()}; path=/; max-age=604800; SameSite=Lax`;

          if (authData.user) {
            localStorage.setItem('user', JSON.stringify(authData.user));

            if (authData.user.usr_id) {
              localStorage.setItem('usr_id', authData.user.usr_id);
              document.cookie = `usr_id=${authData.user.usr_id}; path=/; max-age=604800; SameSite=Lax`;
            }
            if (authData.user.devicecd) {
              localStorage.setItem('devicecd', String(authData.user.devicecd));
              document.cookie = `devicecd=${authData.user.devicecd}; path=/; max-age=604800; SameSite=Lax`;
            }
            if (authData.user.emp_id || authData.user.empId || authData.user.empid) {
              const emp = authData.user.emp_id || authData.user.empId || authData.user.empid;
              localStorage.setItem('emp_id', emp);
              localStorage.setItem('empid', emp);
              localStorage.setItem('employeeId', emp);
              document.cookie = `emp_id=${emp}; path=/; max-age=604800; SameSite=Lax`;
              document.cookie = `empid=${emp}; path=/; max-age=604800; SameSite=Lax`;
            }
            if (authData.user.loc_cd) {
              localStorage.setItem('loc_cd', String(authData.user.loc_cd));
              document.cookie = `loc_cd=${authData.user.loc_cd}; path=/; max-age=604800; SameSite=Lax`;
            }
            if (authData.user.department) {
              localStorage.setItem('department', authData.user.department);
            }
          }

          const effectiveRole = (authData.user?.role || role).toUpperCase();
          if (effectiveRole === 'ADMIN' || effectiveRole === 'COLLEGE_ADMIN' || effectiveRole === 'SUPER_ADMIN') {
            router.push('/dashboard/admin');
          } else if (effectiveRole === 'FACULTY' || effectiveRole === 'HOD' || effectiveRole === 'STAFF') {
            router.push('/dashboard/faculty');
          } else if (effectiveRole === 'STUDENT') {
            router.push('/dashboard/student');
          } else if (effectiveRole === 'CLERK') {
            router.push('/dashboard/clerk');
          } else if (effectiveRole === 'WARDEN') {
            router.push('/dashboard/warden');
          } else {
            router.push('/dashboard');
          }
          return;
        }
      }

      const errData = await res.json().catch(() => ({}));
      setErrorMsg(errData.message || 'Invalid username or password for this institution');
    } catch {
      setErrorMsg('Cannot connect to backend server. Please verify network or credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen relative flex flex-col justify-center items-center p-3 sm:p-4 text-white font-sans overflow-hidden transition-colors duration-500"
      style={{ backgroundColor: currentTheme.pageBg || '#0E0A24' }}
    >
      
      {/* ─── BLURRED CAMPUS BACKGROUND OVERLAY ──────────────────────────────── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/images/srms_campus.png"
          alt="SRMS Campus"
          fill
          priority
          className="object-cover object-center opacity-25 filter blur-sm scale-105"
        />
        <div 
          className="absolute inset-0 opacity-90 transition-all duration-500"
          style={{
            background: `linear-gradient(to bottom, ${currentTheme.sidebarBg}E6, ${currentTheme.pageBg}F2, ${currentTheme.pageBg})`
          }}
        />
      </div>

      {/* Floating Accent Glows */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-30 transition-all duration-500"
        style={{ backgroundColor: currentTheme.primary }}
      />
      <div 
        className="absolute bottom-10 right-10 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-20 transition-all duration-500"
        style={{ backgroundColor: currentTheme.accent }}
      />

      {/* ─── TOP HEADER BAR ─────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-[440px] flex items-center justify-between mb-3 px-1">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white font-bold transition-all py-1 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 cursor-pointer shadow-sm"
        >
          <span>←</span>
          <span>Campus Home</span>
        </Link>

        <span className="text-[11px] text-white/80 font-mono flex items-center gap-1.5 bg-black/20 px-2 py-0.5 rounded-full border border-white/10">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: currentTheme.accent }} />
          ERP Secure v2.4
        </span>
      </div>

      {/* ─── COMPACT PREMIUM LOGIN CARD (SMALL FORM, SMALL PADDING) ─────────── */}
      <div 
        className="relative z-10 w-full max-w-[440px] backdrop-blur-xl border border-white/20 p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-4 transition-all duration-500"
        style={{ 
          backgroundColor: `${currentTheme.sidebarBg}D9`,
          borderRadius: currentTheme.cardRadius || '24px'
        }}
      >
        
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div 
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white font-black text-lg shadow-md mb-1 transition-colors"
            style={{ color: currentTheme.primary }}
          >
            M
          </div>
          <h1 className="text-xl font-black tracking-tight text-white">
            Institutional Access Portal
          </h1>
          <p className="text-[11px] text-white/70 font-medium">
            Enterprise Medical & Engineering ERP Platform
          </p>
        </div>

        {/* ─── COMPACT COLLEGE SELECTOR BAR ─────────────────────────────────── */}
        <div className="relative">
          <div
            onClick={() => setIsCollegePickerOpen(!isCollegePickerOpen)}
            className="p-2.5 rounded-xl bg-black/25 hover:bg-black/35 border border-white/15 cursor-pointer transition-all flex items-center justify-between gap-2 text-xs group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span 
                className="w-6 h-6 rounded-lg text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-sm"
                style={{ backgroundColor: currentTheme.primary }}
              >
                {selectedCollege.code || '1'}
              </span>
              <div className="min-w-0">
                <p className="font-bold text-white text-xs truncate leading-tight">
                  {selectedCollege.name}
                </p>
                <p className="text-[10px] font-mono font-semibold" style={{ color: currentTheme.accent }}>
                  tenant: {selectedCollege.slug}
                </p>
              </div>
            </div>
            <span className="text-xs text-white/60 group-hover:text-white shrink-0">
              {isCollegePickerOpen ? '▲' : '▼'}
            </span>
          </div>

          {/* Autocomplete Dropdown */}
          {isCollegePickerOpen && (
            <div 
              className="absolute left-0 right-0 top-full mt-1.5 p-2 border border-white/20 rounded-2xl shadow-2xl z-50 space-y-2 animate-fadeIn max-h-56 overflow-hidden flex flex-col"
              style={{ backgroundColor: `${currentTheme.sidebarBg}FA` }}
            >
              <input
                type="text"
                value={collegeSearchQuery}
                onChange={(e) => setCollegeSearchQuery(e.target.value)}
                placeholder="🔍 Search college..."
                className="w-full px-3 py-1.5 rounded-xl bg-black/30 border border-white/20 text-white text-xs font-semibold focus:outline-none"
                style={{ borderColor: currentTheme.primary }}
                autoFocus
              />
              <div className="overflow-y-auto space-y-1 pr-1 flex-1">
                {filteredColleges.map((colg) => (
                  <div
                    key={colg.slug || colg.code}
                    onClick={() => handleSelectCollege(colg)}
                    className="p-2 rounded-lg hover:bg-white/10 cursor-pointer text-xs flex items-center justify-between gap-2 transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-4 h-4 rounded-md flex items-center justify-center font-black text-[9px] text-white shrink-0"
                        style={{ backgroundColor: colg.primary_color || '#5B4BFF' }}
                      >
                        {colg.name.charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <span className="truncate block font-semibold text-white/95">{colg.name}</span>
                        <span className="text-[9px] font-mono opacity-80" style={{ color: currentTheme.accent }}>{colg.slug}</span>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-mono text-white/70 shrink-0">
                      {colg.plan || 'standard'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── ROLE SELECTOR PILLS ───────────────────────────────────────────── */}
        <div>
          <div className="grid grid-cols-5 gap-1 p-1 rounded-xl bg-black/25 border border-white/15 text-[11px] font-bold">
            {(['STUDENT', 'FACULTY', 'ADMIN', 'CLERK', 'WARDEN'] as const).map((r) => {
              const isActive = role === r;
              const labelMap: Record<string, string> = {
                STUDENT: 'Student',
                FACULTY: 'Faculty',
                ADMIN: 'Admin',
                CLERK: 'Clerk',
                WARDEN: 'Warden',
              };
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => applyRolePreset(r)}
                  className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                    isActive
                      ? 'text-white font-extrabold shadow-sm'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                  style={isActive ? { backgroundColor: currentTheme.primary, boxShadow: `0 2px 8px ${currentTheme.primary}60` } : {}}
                >
                  {labelMap[r]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Alert Message */}
        {errorMsg && (
          <div className={`p-3.5 rounded-2xl border text-xs font-bold text-center animate-shake ${
            errorMsg.toLowerCase().includes('expired') || errorMsg.toLowerCase().includes('renewal')
              ? 'bg-gradient-to-br from-rose-950/90 to-red-900/90 border-rose-500 text-rose-100 shadow-xl shadow-rose-950/60'
              : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-base">⚠️</span>
              <span className="font-black text-white text-xs uppercase tracking-wide">
                {errorMsg.toLowerCase().includes('expired') || errorMsg.toLowerCase().includes('renewal')
                  ? 'Licence Key is expired • Renewal Now'
                  : 'Authentication Failed'}
              </span>
            </div>
            <p className="text-[11px] font-medium leading-relaxed text-rose-200">{errorMsg}</p>
          </div>
        )}

        {/* ─── COMPACT LOGIN INPUT FORM ──────────────────────────────────────── */}
        <form onSubmit={handleLogin} className="space-y-3">
          
          {/* User ID / Registration No Input */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-wider text-white/70">
              {role === 'STUDENT' ? 'Student Registration / Roll No' : role === 'FACULTY' ? 'Faculty Emp ID / Email' : 'Admin Username / Email'}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-white/50 text-xs">👤</span>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === 'STUDENT' ? 'e.g. 2500141790009' : 'e.g. CET-FAC-001'}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/25 border border-white/20 text-white font-bold text-xs focus:outline-none focus:bg-black/40 transition placeholder-white/40"
                style={{ outlineColor: currentTheme.primary }}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-black uppercase tracking-wider text-white/70">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[10px] text-white/60 hover:text-white font-semibold cursor-pointer"
              >
                {showPassword ? 'Hide 👁️' : 'Show 👁️'}
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-white/50 text-xs">🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/25 border border-white/20 text-white font-bold text-xs focus:outline-none focus:bg-black/40 transition placeholder-white/40"
                style={{ outlineColor: currentTheme.primary }}
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-white font-black text-xs transition-all transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2 shadow-lg hover:brightness-110"
            style={{
              background: `linear-gradient(to right, ${currentTheme.primary}, ${currentTheme.secondary})`,
              boxShadow: `0 8px 24px ${currentTheme.primary}45`
            }}
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In to {role === 'ADMIN' ? 'Admin Console' : `${role.charAt(0) + role.slice(1).toLowerCase()} Portal`}</span>
                <span className="font-mono">➔</span>
              </>
            )}
          </button>
        </form>

        {/* ─── QUICK PRESET CHIPS FOR ZERO-FRICTION TESTING ───────────────────── */}
        <div className="pt-2 border-t border-white/10 space-y-1.5">
          <span className="block text-[9px] font-black uppercase text-white/50 tracking-wider text-center">
            Quick 1-Click Demo Credentials
          </span>
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px]">
            <button
              type="button"
              onClick={() => applyRolePreset('STUDENT')}
              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 border border-white/15 transition cursor-pointer"
            >
              🎓 Student: 2500141790009
            </button>
            <button
              type="button"
              onClick={() => applyRolePreset('FACULTY')}
              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 border border-white/15 transition cursor-pointer"
            >
              👨‍🏫 Faculty: CET-FAC-001
            </button>
            <button
              type="button"
              onClick={() => applyRolePreset('ADMIN')}
              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 border border-white/15 transition cursor-pointer"
            >
              🏛️ Admin: admin
            </button>
          </div>
        </div>

      </div>

      {/* ─── BOTTOM COPYRIGHT ──────────────────────────────────────────────── */}
      <div className="relative z-10 mt-4 text-center text-[10px] text-white/50 font-medium">
        © {new Date().getFullYear()} Shri Ram Murti Smarak Institutions • UniCampus MedERP v2.4
      </div>

    </div>
  );
}
