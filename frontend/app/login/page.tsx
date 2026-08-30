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
  logo_url?: string;
  theme_config?: {
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
    sidebar_bg?: string;
    header_bg?: string;
    page_bg?: string;
    card_bg?: string;
    card_radius?: string;
    logo_url?: string;
    table_header_bg?: string;
    table_zebra?: boolean;
    theme_mode?: string;
  };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

const DEFAULT_COLLEGES: College[] = [
  {
    code: '1',
    colg_cd: '1',
    name: 'SRMS College of Engineering & Technology, Bareilly',
    slug: 'srms-cet-bareilly',
    domain: 'srms-cet.mederp.app',
    plan: 'enterprise',
    primary_color: '#F36C21',
    logo_url: '/srms-logo.png',
    theme_config: {
      primary_color: '#F36C21',
      secondary_color: '#E05A10',
      accent_color: '#F36C21',
      sidebar_bg: '#1A1D2D',
      header_bg: '#1A1D2D',
      page_bg: '#0F121C',
      card_bg: '#161926',
      card_radius: '22px',
      logo_url: '/srms-logo.png',
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
    logo_url: '/srms-logo.png',
    theme_config: {
      primary_color: '#00C48C',
      secondary_color: '#059669',
      accent_color: '#F36C21',
      sidebar_bg: '#064E3B',
      header_bg: '#064E3B',
      page_bg: '#F0FDF4',
      card_bg: '#FFFFFF',
      card_radius: '22px',
      logo_url: '/srms-logo.png',
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Dynamic theme derived from selected college or Owner custom overrides
  const [ownerThemeOverride, setOwnerThemeOverride] = useState<any>(null);

  const currentTheme = useMemo(() => {
    const cfg = ownerThemeOverride || selectedCollege?.theme_config || {};
    return {
      primary: cfg.primary_color || selectedCollege?.primary_color || '#F36C21',
      secondary: cfg.secondary_color || '#E05A10',
      accent: cfg.accent_color || '#F36C21',
      sidebarBg: cfg.sidebar_bg || '#1A1D2D',
      headerBg: cfg.header_bg || cfg.sidebar_bg || '#1A1D2D',
      pageBg: cfg.page_bg || '#0F121C',
      cardBg: cfg.card_bg || '#161926',
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

      // 1. Fetch active institutions from /api/college-master/colleges
      try {
        const res = await fetch(`/api/college-master/colleges`);
        if (res.ok) {
          const json = await res.json();
          const list: any[] = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
          list.forEach((item) => {
            if (item.is_active === false) return; // Skip deactivated
            const slug = item.slug || `srms-${item.code || item.colg_cd}`;
            const code = String(item.code || item.colg_cd || '1');
            const logoUrl = item.logo_url || (slug.startsWith('srms') ? '/srms-logo.png' : undefined);
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
                logo_url: logoUrl,
                theme_config: {
                  logo_url: logoUrl,
                  primary_color: item.primary_color || '#5B4BFF',
                },
              });
            }
          });
        }
      } catch (e) {
        console.warn('Could not load college-master colleges:', e);
      }

      // 2. Fetch newly registered SaaS firms from /api/firms?public=true
      try {
        const firmsRes = await fetch('/api/firms?public=true');
        if (firmsRes.ok) {
          const firmsJson = await firmsRes.json();
          const firmsList: any[] = Array.isArray(firmsJson.data)
            ? firmsJson.data
            : Array.isArray(firmsJson)
            ? firmsJson
            : [];
          firmsList.forEach((f) => {
            if (f.status === 'SUSPENDED' || f.status === 'INACTIVE' || f.is_active === false) {
              map.delete(f.slug);
              return;
            }
            if (f.slug && f.title) {
              const primaryColor = (f.theme_config && f.theme_config.primary_color) || f.theme_color || '#5B4BFF';
              const logoUrl = f.logo_url || (f.theme_config && f.theme_config.logo_url) || (f.slug.startsWith('srms') ? '/srms-logo.png' : undefined);
              map.set(f.slug, {
                id: f.id,
                code: f.slug,
                colg_cd: f.slug,
                name: f.title,
                slug: f.slug,
                domain: f.domain || `${f.slug}.mederp.app`,
                plan: f.level_type || 'standard',
                primary_color: primaryColor,
                logo_url: logoUrl,
                theme_config: f.theme_config || {
                  logo_url: logoUrl,
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

      // 3. Fallback to DEFAULT_COLLEGES only if map is completely empty (e.g. initial offline)
      if (map.size === 0) {
        DEFAULT_COLLEGES.forEach((c) => {
          map.set(c.slug, c);
        });
      }

      const combined = Array.from(map.values());
      if (combined.length > 0) {
        setColleges(combined);
        // If current selected college is no longer in active list, switch to first active
        setSelectedCollege((prev) => {
          if (!prev || !map.has(prev.slug)) {
            const first = combined[0];
            if (typeof window !== 'undefined') {
              localStorage.setItem('colg_cd', String(first.colg_cd || first.code));
              localStorage.setItem('tenantSlug', first.slug);
              localStorage.setItem('selectedTenant', first.slug);
            }
            return first;
          }
          return prev;
        });
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
  };

  const applyRolePreset = (newRole: 'STUDENT' | 'FACULTY' | 'ADMIN' | 'CLERK' | 'WARDEN') => {
    setRole(newRole);
    setErrorMsg('');
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
    /* ═══════════════════════════════════════════════════════════════════════
       PREMIUM SPLIT-SCREEN SAAS LOGIN:
       - Strict no-scroll 100vh viewport on desktop (overflow-hidden)
       - Left: Luxurious vibrant brand gradient canvas (hidden on mobile)
       - Right: Ultra-clean, modern high-contrast login card (mobile shows ONLY this)
    ═══════════════════════════════════════════════════════════════════════ */
    <div className="h-screen max-h-screen w-screen overflow-hidden flex flex-col md:flex-row font-sans bg-[#F8FAFC] selection:bg-[#F36C21] selection:text-white">

      {/* ═══════════════════════════════════════════════════════════════════
          LEFT PANEL — LUXURIOUS BRAND CANVAS (ALWAYS VISIBLE ON WEB, HIDDEN ONLY ON MOBILE)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="max-md:hidden flex flex-1 h-full flex-col justify-between p-6 lg:p-8 xl:p-10 relative overflow-hidden bg-gradient-to-br from-[#EA580C] via-[#F36C21] to-[#C2410C] text-white">
        
        {/* Subtle geometric lighting overlay */}
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,1) 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-black/25 blur-3xl pointer-events-none" />

        {/* ── TOP: Brand Bar */}
        <div className="relative z-10 flex items-center justify-between">
          <a
            href="https://nornx.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 text-white text-[11px] font-extrabold transition-all backdrop-blur-md shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>Powered by <strong className="font-black">Nornx Technologies</strong></span>
            <span className="text-white/80 text-[10px]">↗</span>
          </a>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/15 border border-white/20 text-[10px] font-mono font-bold text-white/90 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            <span>CorteX AI Active</span>
          </div>
        </div>

        {/* ── MIDDLE: Headline & Feature Highlights */}
        <div className="relative z-10 space-y-4 my-auto py-1">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 border border-white/30 text-white text-[10px] font-black uppercase tracking-wider">
              UniCampus AI Cloud
            </div>
            <h1 className="text-2xl lg:text-3xl xl:text-4xl font-black tracking-tight text-white leading-[1.15] drop-shadow-sm">
              The Operating System for{' '}
              <span className="underline underline-offset-4 decoration-white/40 decoration-2">
                Modern Higher Education
              </span>
            </h1>
            <p className="text-xs lg:text-sm text-white/85 font-medium leading-relaxed max-w-lg">
              Empowering medical colleges, engineering institutes, and university hospitals with autonomous AI operations, conflict-free scheduling & mobile apps.
            </p>
          </div>

          {/* 4 Feature Cards */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '⚡', title: 'CorteX.io Autonomous AI', desc: 'Conflict-free timetables & automated duty rosters.' },
              { icon: '🛡️', title: 'Enterprise Data Isolation', desc: 'Bank-grade multi-campus PostgreSQL schemas.' },
              { icon: '🏥', title: 'NMC & AICTE Framework', desc: 'Clinical bed rotations & automated compliance.' },
              { icon: '📱', title: 'Intelligent Mobile Apps', desc: 'Biometric attendance, digital ID wallet & alerts.' },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="p-2.5 lg:p-3 rounded-xl lg:rounded-2xl bg-white/12 border border-white/20 hover:bg-white/20 transition-all space-y-1 backdrop-blur-sm shadow-xs"
              >
                <div className="flex items-center gap-1.5 text-xs font-black text-white">
                  <span className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center text-xs shrink-0">{icon}</span>
                  <span className="truncate">{title}</span>
                </div>
                <p className="text-[10px] text-white/75 leading-snug font-medium line-clamp-2">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── BOTTOM: Metrics strip */}
        <div className="relative z-10 flex items-center justify-between pt-2.5 border-t border-white/20">
          <div className="flex items-center gap-4 lg:gap-6 text-white">
            <div>
              <span className="font-black text-lg lg:text-xl leading-none">50K+</span>
              <p className="text-[9px] text-white/70 uppercase tracking-wider font-bold mt-0.5">Active Users</p>
            </div>
            <div className="w-px h-5 lg:h-6 bg-white/25" />
            <div>
              <span className="font-black text-lg lg:text-xl leading-none">99.99%</span>
              <p className="text-[9px] text-white/70 uppercase tracking-wider font-bold mt-0.5">Uptime SLA</p>
            </div>
            <div className="w-px h-5 lg:h-6 bg-white/25" />
            <div>
              <span className="font-black text-lg lg:text-xl leading-none">100%</span>
              <p className="text-[9px] text-white/70 uppercase tracking-wider font-bold mt-0.5">AI-Powered</p>
            </div>
          </div>

          <a
            href="https://nornx.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-white/90 text-[#EA580C] font-extrabold text-[11px] lg:text-xs shadow-md transition-all group"
          >
            <span>Explore Nornx</span>
            <span className="group-hover:translate-x-0.5 transition-transform font-mono text-[10px]">➔</span>
          </a>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          RIGHT PANEL — MODERN HIGH-CONTRAST LOGIN PANEL (FULL WIDTH ON MOBILE)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="w-full md:w-[440px] lg:w-[470px] xl:w-[500px] h-full flex flex-col justify-between items-center bg-white px-5 sm:px-8 lg:px-8 xl:px-12 py-4 lg:py-6 overflow-y-auto md:overflow-hidden relative shrink-0">

        {/* Subtle warm gradient ambient */}
        <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-[#FFF7ED]/50 to-transparent pointer-events-none hidden lg:block" />

        {/* ── TOP NAV BAR ── */}
        <div className="w-full flex items-center justify-between shrink-0 mb-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#475569] hover:text-[#0F172A] font-bold transition-all py-1 px-2.5 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] shadow-xs"
          >
            <span>←</span>
            <span>Campus Home</span>
          </Link>
          <span className="text-[10px] text-[#64748B] font-mono font-bold flex items-center gap-1.5 bg-[#F8FAFC] px-2.5 py-1 rounded-full border border-[#E2E8F0] shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00C48C] animate-pulse" />
            <span>ERP Secure v2.4</span>
          </span>
        </div>

        {/* ── CENTER LOGIN FORM CARD ── */}
        <div className="w-full max-w-[370px] my-auto space-y-3.5 shrink-0 py-1">

          {/* College Logo & Institution Name */}
          <div className="text-center space-y-1.5">
            <div className="flex justify-center">
              {selectedCollege.logo_url || selectedCollege.theme_config?.logo_url ? (
                <div className="w-14 h-14 rounded-2xl bg-white p-1 shadow-[0_4px_20px_rgba(243,108,33,0.15)] border-2 border-[#F36C21]/20 flex items-center justify-center overflow-hidden">
                  <img
                    src={selectedCollege.logo_url || selectedCollege.theme_config?.logo_url}
                    alt={selectedCollege.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : selectedCollege.slug && selectedCollege.slug.startsWith('srms') ? (
                <div className="w-14 h-14 rounded-2xl bg-white p-1 shadow-[0_4px_20px_rgba(243,108,33,0.15)] border-2 border-[#F36C21]/20 flex items-center justify-center overflow-hidden">
                  <img src="/srms-logo.png" alt={selectedCollege.name} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div
                  className="w-14 h-14 rounded-2xl text-white font-black text-xl shadow-[0_4px_20px_rgba(0,0,0,0.12)] flex items-center justify-center"
                  style={{ backgroundColor: currentTheme.primary || '#F36C21' }}
                >
                  {selectedCollege.name ? selectedCollege.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-[#0F172A] leading-snug">
                {selectedCollege.name ? selectedCollege.name.split(',')[0] : 'Institutional Access Portal'}
              </h2>
              <p className="text-[11px] text-[#64748B] font-semibold">
                {selectedCollege.name && selectedCollege.name.includes(',')
                  ? selectedCollege.name.split(',').slice(1).join(',').trim()
                  : 'Enterprise University ERP Platform'}
              </p>
            </div>
          </div>

          {/* College Selector Dropdown */}
          <div className="relative">
            <div
              onClick={() => setIsCollegePickerOpen(!isCollegePickerOpen)}
              className="p-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] hover:border-[#F36C21]/40 cursor-pointer transition-all flex items-center justify-between gap-2 text-xs group shadow-2xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                {selectedCollege.logo_url || selectedCollege.theme_config?.logo_url ? (
                  <div className="w-6 h-6 rounded-md bg-white p-0.5 shrink-0 flex items-center justify-center overflow-hidden shadow-xs border border-[#E2E8F0]">
                    <img src={selectedCollege.logo_url || selectedCollege.theme_config?.logo_url} alt={selectedCollege.name} className="w-full h-full object-contain" />
                  </div>
                ) : selectedCollege.slug && selectedCollege.slug.startsWith('srms') ? (
                  <div className="w-6 h-6 rounded-md bg-white p-0.5 shrink-0 flex items-center justify-center overflow-hidden shadow-xs border border-[#E2E8F0]">
                    <img src="/srms-logo.png" alt={selectedCollege.name} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <span
                    className="w-6 h-6 rounded-md text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs"
                    style={{ backgroundColor: currentTheme.primary || '#F36C21' }}
                  >
                    {selectedCollege.code || '1'}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="font-bold text-[#0F172A] text-xs truncate leading-tight">{selectedCollege.name}</p>
                  <p className="text-[9px] font-mono font-semibold text-[#F36C21]">tenant: {selectedCollege.slug}</p>
                </div>
              </div>
              <span className="text-[#94A3B8] group-hover:text-[#0F172A] shrink-0 font-bold text-[10px]">
                {isCollegePickerOpen ? '▲' : '▼'}
              </span>
            </div>

            {isCollegePickerOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 p-2 bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl z-50 space-y-1.5 max-h-52 overflow-hidden flex flex-col">
                <input
                  type="text"
                  value={collegeSearchQuery}
                  onChange={(e) => setCollegeSearchQuery(e.target.value)}
                  placeholder="🔍 Search campus tenant..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-xs font-semibold focus:outline-none focus:border-[#F36C21]"
                  autoFocus
                />
                <div className="overflow-y-auto space-y-1 pr-1 flex-1 divide-y divide-[#F8FAFC]">
                  {filteredColleges.map((colg) => {
                    const colgLogo = colg.logo_url || colg.theme_config?.logo_url || (colg.slug.startsWith('srms') ? '/srms-logo.png' : null);
                    return (
                      <div
                        key={colg.slug || colg.code}
                        onClick={() => handleSelectCollege(colg)}
                        className={`p-2 rounded-xl cursor-pointer text-xs flex items-center justify-between gap-2 transition ${
                          selectedCollege.slug === colg.slug
                            ? 'bg-[#FFF5ED] text-[#F36C21] font-bold border border-[#FBE0D0]'
                            : 'text-[#334155] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {colgLogo ? (
                            <div className="w-5 h-5 rounded bg-white p-0.5 shrink-0 flex items-center justify-center overflow-hidden border border-[#E2E8F0]">
                              <img src={colgLogo} alt={colg.name} className="w-full h-full object-contain" />
                            </div>
                          ) : (
                            <span
                              className="w-5 h-5 rounded flex items-center justify-center font-bold text-[8px] text-white shrink-0"
                              style={{ backgroundColor: colg.primary_color || '#5B4BFF' }}
                            >
                              {colg.code || '1'}
                            </span>
                          )}
                          <div className="min-w-0">
                            <span className="truncate block font-bold text-[#0F172A] text-xs">{colg.name}</span>
                            <span className="text-[9px] font-mono text-[#F36C21]">{colg.slug}</span>
                          </div>
                        </div>
                        <span className="px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[9px] font-mono text-[#64748B] shrink-0 font-bold">
                          {colg.plan || 'standard'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Role Tabs */}
          <div className="grid grid-cols-5 gap-1 p-1 rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] text-[11px] font-bold">
            {(['STUDENT', 'FACULTY', 'ADMIN', 'CLERK', 'WARDEN'] as const).map((r) => {
              const isActive = role === r;
              const labelMap: Record<string, string> = {
                STUDENT: 'Student', FACULTY: 'Faculty', ADMIN: 'Admin', CLERK: 'Clerk', WARDEN: 'Warden',
              };
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => applyRolePreset(r)}
                  className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#0F172A] text-white font-extrabold shadow-sm shadow-slate-900/30'
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white/80'
                  }`}
                >
                  {labelMap[r]}
                </button>
              );
            })}
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="p-2.5 rounded-xl border bg-rose-50 border-rose-200 text-rose-700 text-xs font-bold text-center">
              <p className="text-[11px] leading-tight text-rose-700">{errorMsg}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-wider text-[#475569]">
                {role === 'STUDENT' ? 'Student Registration / Roll No' : role === 'FACULTY' ? 'Faculty Emp ID / Email' : 'Admin Username / Email'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-[#94A3B8] text-xs">👤</span>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'STUDENT' ? 'Enter Registration / Roll No' : role === 'FACULTY' ? 'Enter Faculty ID / Email' : 'Enter Username / Email'}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] font-bold text-xs focus:bg-white focus:outline-none focus:border-[#F36C21] focus:ring-2 focus:ring-[#F36C21]/15 transition placeholder-[#94A3B8]"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-black uppercase tracking-wider text-[#475569]">Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] text-[#64748B] hover:text-[#0F172A] font-bold cursor-pointer"
                >
                  {showPassword ? 'Hide 👁️' : 'Show 👁️'}
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-[#94A3B8] text-xs">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] font-bold text-xs focus:bg-white focus:outline-none focus:border-[#F36C21] focus:ring-2 focus:ring-[#F36C21]/15 transition placeholder-[#94A3B8]"
                  required
                />
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-1 rounded-xl font-extrabold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 bg-[#0F172A] hover:bg-[#1E293B] text-white shadow-md shadow-slate-900/20"
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

        </div>

        {/* ── FOOTER SIGNATURE ── */}
        <div className="text-center space-y-0.5 pt-2 border-t border-[#F1F5F9] w-full shrink-0">
          <p className="text-[10px] text-[#94A3B8] font-semibold">
            © {new Date().getFullYear()} Shri Ram Murti Smarak Institutions • UniCampus
          </p>
          <p className="text-[10px] text-[#94A3B8] font-medium">
            Systems by{' '}
            <a
              href="https://nornx.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#F36C21] hover:text-[#EA580C] font-bold transition-colors"
            >
              Nornx Technologies Pvt Ltd
            </a>
          </p>
        </div>

      </div>

    </div>
  );
}

