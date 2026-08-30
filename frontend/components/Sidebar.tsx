'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  role?: 'student' | 'faculty' | 'admin' | 'warden' | 'clerk' | 'superadmin' | 'owner';
}

export default function Sidebar({ role: propRole }: SidebarProps) {
  const pathname = usePathname();
  const role =
    propRole ||
    (pathname?.includes('/faculty')
      ? 'faculty'
      : pathname?.includes('/admin')
      ? 'admin'
      : pathname?.includes('/warden')
      ? 'warden'
      : pathname?.includes('/owner') || pathname?.includes('/superadmin')
      ? 'owner'
      : 'student');
  const [misReportsOpen, setMisReportsOpen] = useState(true);
  const [collegeDisplayName, setCollegeDisplayName] = useState<string>('SRMS CET, BAREILLY');
  const [collegeLogoUrl, setCollegeLogoUrl] = useState<string | null>(null);
  const [enabledKeys, setEnabledKeys] = useState<string[] | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [isMedicalModule, setIsMedicalModule] = useState<boolean>(false);

  const loadPermissionsAndBranding = () => {
    if (typeof window === 'undefined') return;

    // 1. Check user profile object from localStorage
    let userBrandName = '';
    let userFirmMode = '';
    let userTimetableModule = '';
    try {
      const rawUser = localStorage.getItem('user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        const userName = (u.name || '').toLowerCase();
        const userEmail = (u.email || '').toLowerCase();
        const userFirm = u.firm_name || u.firmName || u.organization || u.company || u.institution;
        userFirmMode = u.firm_mode || u.firmMode || '';
        userTimetableModule = u.timetable_module_type || u.timetableModuleType || '';

        if (userFirm) {
          userBrandName = userFirm;
        } else if (userName.includes('nornx') || userEmail.includes('nornx')) {
          userBrandName = 'NORNX PLATFORM';
        }
      }
    } catch {}

    const storedFirmName = localStorage.getItem('firm_name') || localStorage.getItem('company_name');
    const rawSlug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || '';
    const slug = rawSlug.toLowerCase().trim().replace(/^tenant_/, '').replace(/^tenant-/, '');
    const colgCd = localStorage.getItem('colg_cd');
    const storedName = localStorage.getItem('college_name') || localStorage.getItem('colg_name') || localStorage.getItem('tenantName');
    const storedModuleType = localStorage.getItem('timetable_module_type') || userTimetableModule;
    const storedFirmMode = localStorage.getItem('firm_mode') || userFirmMode;

    const isMed =
      storedModuleType === 'MEDICAL' ||
      storedFirmMode === 'MED' ||
      slug.includes('ims') ||
      slug.includes('med') ||
      slug.includes('iahs') ||
      slug.includes('nursing') ||
      slug.includes('ayush') ||
      slug === 'rmribar' ||
      slug === 'rmch-bareilly';

    setIsMedicalModule(isMed);
    
    if (role === 'owner' || role === 'superadmin') {
      if (userBrandName) {
        setCollegeDisplayName(userBrandName.toUpperCase());
      } else if (storedFirmName) {
        setCollegeDisplayName(storedFirmName.toUpperCase());
      } else if (slug && !slug.includes('srms-cet')) {
        setCollegeDisplayName(slug.toUpperCase().replace('TENANT_', '').replace('TENANT-', ''));
      } else {
        setCollegeDisplayName(storedName || 'NORNX PLATFORM');
      }
    } else {
      if (slug === 'srms-cet-bareilly' || slug.includes('cet-bareilly') || colgCd === '1' || slug === '1') {
        setCollegeDisplayName('SRMS CET, BAREILLY');
      } else if (slug === 'srms-cetr-bareilly' || slug.includes('cetr-bareilly') || colgCd === '2' || slug === '2') {
        setCollegeDisplayName('SRMS CETR, BAREILLY');
      } else if (slug === 'srms-ims' || slug.includes('ims') || colgCd === '11') {
        setCollegeDisplayName('SRMS IMS, BAREILLY');
      } else if (slug === 'rmribar' || slug.includes('rajshree')) {
        setCollegeDisplayName('RAJSHREE MEDICAL RESEARCH INSTITUTE');
      } else if (slug === 'rmch-bareilly') {
        setCollegeDisplayName('ROHILKHAND MEDICAL COLLEGE');
      } else if (slug === 'apex-tech') {
        setCollegeDisplayName('APEX INSTITUTE OF TECHNOLOGY');
      } else if (slug === 'srms-ibs-lucknow') {
        setCollegeDisplayName('SRMS IBS, LUCKNOW');
      } else if (slug === 'srms-iahs-bareilly') {
        setCollegeDisplayName('SRMS IAHS, BAREILLY');
      } else if (slug === 'srms-trust-bareilly') {
        setCollegeDisplayName('SRMS TRUST, BAREILLY');
      } else if (slug === 'srms-nursing-school') {
        setCollegeDisplayName('SRMS NURSING SCHOOL');
      } else if (slug === 'srms-nursing-college') {
        setCollegeDisplayName('SRMS NURSING COLLEGE');
      } else if (slug === 'srms-riddhima-bareilly') {
        setCollegeDisplayName('SRMS RIDDHIMA, BAREILLY');
      } else if (slug === 'srms-college-of-nursing-paramedical-sciences-unnao') {
        setCollegeDisplayName('SRMS COLLEGE OF NURSING & PARAMEDICAL');
      } else if (slug === 'srms-quiz-panel') {
        setCollegeDisplayName('SRMS QUIZ PANEL');
      } else if (slug === 'srms-cricket-academy') {
        setCollegeDisplayName('SRMS CRICKET ACADEMY');
      } else if (slug === 'srms-cet-unnao') {
        setCollegeDisplayName('SRMS CET, UNNAO');
      } else if (slug === 'srms-college-of-law') {
        setCollegeDisplayName('SRMS COLLEGE OF LAW');
      } else if (storedName && !storedName.toLowerCase().includes('rajshree')) {
        setCollegeDisplayName(storedName.toUpperCase());
      } else if (slug) {
        setCollegeDisplayName(slug.toUpperCase().replace('TENANT_', '').replace('TENANT-', ''));
      } else {
        setCollegeDisplayName('SRMS CET, BAREILLY');
      }
    }

    // Dynamic College Logo resolution (from direct keys, tenant object, or institution presets)
    let logoUrl: string | null = null;
    const directLogo =
      localStorage.getItem('college_logo') ||
      localStorage.getItem('collegeLogo') ||
      localStorage.getItem('colg_logo') ||
      localStorage.getItem('logo_url') ||
      localStorage.getItem('tenant_logo');
    if (directLogo) {
      logoUrl = directLogo;
    } else {
      try {
        const rawColg = localStorage.getItem('college') || localStorage.getItem('selectedTenantData');
        if (rawColg) {
          const colgObj = JSON.parse(rawColg);
          if (colgObj.logo_url) logoUrl = colgObj.logo_url;
          else if (colgObj.theme_config?.logo_url) logoUrl = colgObj.theme_config.logo_url;
        }
      } catch {}
    }

    // Default SRMS institutional logo for all SRMS institutions
    if (!logoUrl && (slug.startsWith('srms') || slug === '1' || slug === '2' || slug === '11' || !slug)) {
      logoUrl = '/srms-logo.png';
    }

    setCollegeLogoUrl(logoUrl);

    if (role !== 'owner') {
      const rawSlug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || '';
      const cleanSlug = rawSlug.toLowerCase().trim().replace(/^tenant_/, '').replace(/^tenant-/, '');
      const tenantSlug = cleanSlug || 'srms-cet-bareilly';

      // Fetch enabled keys for this firm + role
      fetch(`/api/firms/${tenantSlug}/role-permissions?role=${(role || 'student').toUpperCase()}`)
        .then(async (res) => {
          if (res.ok) {
            const json = await res.json();
            const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
            const keys = list.map((item: any) => (typeof item === 'string' ? item : item.menu_key));
            setEnabledKeys(keys);
          }
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    loadPermissionsAndBranding();

    const handleStorage = () => loadPermissionsAndBranding();
    const handleToggleMobile = () => {
      setIsMobileOpen((prev) => {
        const next = !prev;
        if (typeof document !== 'undefined') {
          if (next) {
            document.body.style.overflow = 'hidden';
          } else {
            document.body.style.overflow = '';
          }
        }
        window.dispatchEvent(new CustomEvent('mobileSidebarStateChange', { detail: { isOpen: next } }));
        return next;
      });
    };

    const handleCloseMobile = () => {
      setIsMobileOpen(false);
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
      window.dispatchEvent(new CustomEvent('mobileSidebarStateChange', { detail: { isOpen: false } }));
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('tenantChange', handleStorage);
    window.addEventListener('permissionsUpdated', handleStorage);
    window.addEventListener('toggleMobileSidebar', handleToggleMobile);
    window.addEventListener('closeMobileSidebar', handleCloseMobile);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('tenantChange', handleStorage);
      window.removeEventListener('permissionsUpdated', handleStorage);
      window.removeEventListener('toggleMobileSidebar', handleToggleMobile);
      window.removeEventListener('closeMobileSidebar', handleCloseMobile);
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, [role, pathname]);

  // Auto-close mobile sidebar drawer when navigating to a new path
  useEffect(() => {
    setIsMobileOpen(false);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
    window.dispatchEvent(new CustomEvent('mobileSidebarStateChange', { detail: { isOpen: false } }));
  }, [pathname]);

  const isAllowed = (menuKey: string, routePath?: string) => {
    if (role === 'owner' || !enabledKeys || enabledKeys.length === 0) return true;
    
    // Always allow core logbook modules by default
    if (menuKey.includes('logbook') || (routePath && routePath.includes('logbook'))) return true;
    
    // Normalize target menuKey
    const norm = menuKey.toLowerCase().trim().replace(/[\/\-\.]+/g, '_');
    
    return enabledKeys.some((k) => {
      if (!k) return false;
      const ek = String(k).toLowerCase().trim().replace(/[\/\-\.]+/g, '_');
      if (ek === norm) return true;
      if (routePath) {
        const nrp = routePath.toLowerCase().trim().replace(/^\//, '').replace(/[\/\-\.]+/g, '_');
        if (ek === nrp || ek === `${role}_${nrp}` || ek === `admin_${nrp}` || ek === `faculty_${nrp}` || ek === `student_${nrp}`) return true;
      }
      return false;
    });
  };

  const isValidStaticRoute = (path?: string) => {
    if (!path || typeof path !== 'string') return false;
    if (path.includes('[') || path.includes(']') || path.includes(':')) return false;
    return true;
  };

  useEffect(() => {
    if (pathname?.startsWith('/dashboard/faculty/reports') || pathname?.startsWith('/dashboard/admin/reports')) {
      setMisReportsOpen(true);
    }
  }, [pathname]);

  const asideRef = useRef<HTMLElement | null>(null);

  // Auto-scroll sidebar container so the active route stays comfortably in view
  useEffect(() => {
    const timer = setTimeout(() => {
      if (asideRef.current) {
        const activeLink = asideRef.current.querySelector('a.border-\\[\\#F36C21\\], a[data-active="true"]');
        if (activeLink) {
          activeLink.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [pathname, misReportsOpen]);

  const isLinkActive = (href: string) => {
    const isRootTab = href === '/dashboard/faculty' || href === '/dashboard/student' || href === '/dashboard/admin' || href === '/dashboard/clerk' || href === '/dashboard/warden' || href === '/dashboard/owner' || href === '/dashboard/superadmin';
    return isRootTab ? pathname === href : (pathname === href || (!!pathname && pathname.startsWith(href + '/')));
  };

  const getLinkClass = (href: string) => {
    const isActive = isLinkActive(href);
    return isActive
      ? 'flex items-center gap-2.5 px-3.5 py-2.5 rounded-r-xl font-bold text-[#F36C21] bg-[#F36C21]/10 border-l-4 border-[#F36C21] shadow-xs transition-all group min-h-[44px]'
      : 'flex items-center gap-2.5 px-3.5 py-2.5 rounded-r-xl font-medium text-[#475467] dark:text-slate-300 hover:text-[#11141A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border-l-4 border-transparent transition-all group min-h-[44px]';
  };

  const handleNavClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('a') || target.closest('button')) {
      setIsMobileOpen(false);
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
      window.dispatchEvent(new CustomEvent('mobileSidebarStateChange', { detail: { isOpen: false } }));
    }
  };

  return (
    <>
      {/* ─── MOBILE BACKDROP OVERLAY ───────────────────────────────────────── */}
      {isMobileOpen && (
        <div
          onClick={() => {
            setIsMobileOpen(false);
            if (typeof document !== 'undefined') {
              document.body.style.overflow = '';
            }
            window.dispatchEvent(new CustomEvent('mobileSidebarStateChange', { detail: { isOpen: false } }));
          }}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300 animate-fadeIn"
          aria-hidden="true"
        />
      )}

      {/* ─── SIDEBAR COMPONENT (DESKTOP FIXED + MOBILE OFF-CANVAS DRAWER) ──── */}
      <aside 
        ref={asideRef}
        className={`
          fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white dark:bg-[#0B1120] text-[#11141A] dark:text-slate-100 p-4 h-screen overflow-y-auto flex flex-col justify-between shrink-0 transition-transform duration-300 ease-in-out shadow-2xl border-r border-[#E5E8ED] dark:border-slate-800
          pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))] pl-[calc(1rem+env(safe-area-inset-left))]
          md:translate-x-0 md:w-64 md:h-screen md:sticky md:top-0 md:z-30 md:shadow-sm md:rounded-r-none md:p-4 md:shrink-0
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="space-y-6">
          {/* Brand Header & Mobile Close Button */}
          <div className="flex items-center justify-between gap-3 px-2 pt-1 pb-3 border-b border-slate-200 dark:border-white/10 min-w-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {collegeLogoUrl ? (
                <div className="w-9 h-9 shrink-0 rounded-xl bg-white p-1 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden">
                  <img
                    src={collegeLogoUrl}
                    alt={collegeDisplayName}
                    className="w-full h-full object-contain"
                    onError={() => setCollegeLogoUrl(null)}
                  />
                </div>
              ) : (
                <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-tr from-[#F36C21] via-orange-500 to-amber-500 flex items-center justify-center font-black text-white text-base shadow-md shadow-orange-500/20 border border-orange-400/30">
                  {collegeDisplayName ? collegeDisplayName.trim().charAt(0).toUpperCase() : 'N'}
                </div>
              )}
              <div className="min-w-0 flex-1 overflow-hidden">
                <h1 
                  className="font-black text-sm text-[#11141A] dark:text-white tracking-wide uppercase truncate block" 
                  title={collegeDisplayName}
                >
                  {collegeDisplayName}
                </h1>
                <p className="text-[10px] text-[#F36C21] font-extrabold uppercase tracking-wider truncate">
                  {role} space
                </p>
              </div>
            </div>

            {/* Mobile Close Button (×) */}
            <button
              type="button"
              onClick={() => {
                setIsMobileOpen(false);
                if (typeof document !== 'undefined') {
                  document.body.style.overflow = '';
                }
                window.dispatchEvent(new CustomEvent('mobileSidebarStateChange', { detail: { isOpen: false } }));
              }}
              className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white/80 transition-all shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Close sidebar menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Menu */}
          <nav onClick={handleNavClick} className="space-y-2 text-xs font-medium pr-1">
          {role === 'owner' ? (
            <>
              <div className="px-2 py-1 text-[10px] font-black text-[#F36C21] uppercase tracking-wider">
                SaaS Control Center
              </div>

              <Link href="/dashboard/owner" data-active={isLinkActive('/dashboard/owner') ? 'true' : undefined} className={getLinkClass('/dashboard/owner')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Owner Dashboard</span>
              </Link>

              <Link href="/dashboard/superadmin/firms/register" data-active={isLinkActive('/dashboard/superadmin/firms/register') ? 'true' : undefined} className={getLinkClass('/dashboard/superadmin/firms/register')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>⚡ Firm Register</span>
              </Link>

              <Link href="/dashboard/superadmin/firms" data-active={isLinkActive('/dashboard/superadmin/firms') ? 'true' : undefined} className={getLinkClass('/dashboard/superadmin/firms')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>Firm Display List</span>
              </Link>

              <Link href="/dashboard/owner?tab=admins" data-active={isLinkActive('/dashboard/owner?tab=admins') ? 'true' : undefined} className={getLinkClass('/dashboard/owner?tab=admins')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span>Make Firm Admin</span>
              </Link>

              <Link href="/dashboard/owner?tab=licenses" data-active={isLinkActive('/dashboard/owner?tab=licenses') ? 'true' : undefined} className={getLinkClass('/dashboard/owner?tab=licenses')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <span>License Tracker</span>
              </Link>

              <Link href="/dashboard/owner?tab=rights" data-active={isLinkActive('/dashboard/owner?tab=rights') ? 'true' : undefined} className={getLinkClass('/dashboard/owner?tab=rights')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Firm Module Rights</span>
              </Link>

              <Link href="/dashboard/superadmin/clean-data" data-active={isLinkActive('/dashboard/superadmin/clean-data') ? 'true' : undefined} className={getLinkClass('/dashboard/superadmin/clean-data')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>🧹 Tenant Data Cleaner</span>
              </Link>

              <Link href="/owner/theme-studio" data-active={isLinkActive('/owner/theme-studio') ? 'true' : undefined} className={getLinkClass('/owner/theme-studio')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4 4 4 0 014-4h4a4 4 0 014 4 4 4 0 01-4 4H7zm0 0v-4m0 4h10a4 4 0 004-4 4 4 0 00-4-4h-4m-6 4v-4m0 0V5a2 2 0 012-2h4a2 2 0 012 2v8" />
                </svg>
                <span>🎨 Enterprise Theme Studio</span>
              </Link>

              <Link href="/dashboard/owner?tab=theme" data-active={isLinkActive('/dashboard/owner?tab=theme') ? 'true' : undefined} className={getLinkClass('/dashboard/owner?tab=theme')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4 4 4 0 014-4h4a4 4 0 014 4 4 4 0 01-4 4H7zm0 0v-4m0 4h10a4 4 0 004-4 4 4 0 00-4-4h-4m-6 4v-4m0 0V5a2 2 0 012-2h4a2 2 0 012 2v8" />
                </svg>
                <span>Firm Theme Quick Edit</span>
              </Link>

              <Link href="/dashboard/owner?tab=security" data-active={isLinkActive('/dashboard/owner?tab=security') ? 'true' : undefined} className={getLinkClass('/dashboard/owner?tab=security')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Owner Password</span>
              </Link>
            </>
          ) : role === 'superadmin' ? (
            <>
              <Link href="/dashboard/owner" data-active={isLinkActive('/dashboard/owner') ? 'true' : undefined} className={getLinkClass('/dashboard/owner')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Owner Portal</span>
              </Link>
            </>          ) : role === 'admin' ? (
            <>
              {isAllowed('admin_overview') && (
                <Link href="/dashboard/admin" className={getLinkClass('/dashboard/admin')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>College KPIs</span>
                </Link>
              )}

              {isAllowed('admin_college_master') && (
                <Link href="/dashboard/admin/college-master" data-active={isLinkActive('/dashboard/admin/college-master') ? 'true' : undefined} className={getLinkClass('/dashboard/admin/college-master')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>Campus & Academic Setup</span>
                </Link>
              )}

              {isAllowed('admin_admin_master') && (
                <Link href="/dashboard/admin/admin-master" data-active={isLinkActive('/dashboard/admin/admin-master') ? 'true' : undefined} className={getLinkClass('/dashboard/admin/admin-master')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Curriculum & Subjects</span>
                </Link>
              )}

              {isAllowed('admin_student_master') && (
                <Link href="/dashboard/admin/student-master" data-active={isLinkActive('/dashboard/admin/student-master') ? 'true' : undefined} className={getLinkClass('/dashboard/admin/student-master')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v7" />
                  </svg>
                  <span>Student Directory</span>
                </Link>
              )}

              {isAllowed('admin_staff_master') && (
                <Link href="/dashboard/admin/staff-master" data-active={isLinkActive('/dashboard/admin/staff-master') ? 'true' : undefined} className={getLinkClass('/dashboard/admin/staff-master')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Faculty & Staff Directory</span>
                </Link>
              )}

              {isAllowed('admin_staff_admin') && (
                <Link href="/dashboard/admin/staff-admin" data-active={isLinkActive('/dashboard/admin/staff-admin') ? 'true' : undefined} className={getLinkClass('/dashboard/admin/staff-admin')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  <span>Make Staff as Admin</span>
                </Link>
              )}

              {isAllowed('admin_subject_linker') && (
                <Link href="/dashboard/admin/subject-linker" data-active={isLinkActive('/dashboard/admin/subject-linker') ? 'true' : undefined} className={getLinkClass('/dashboard/admin/subject-linker')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span>Subject Linker</span>
                </Link>
              )}

              {isAllowed('admin_timetable_design') && (
                isMedicalModule ? (
                  <Link href="/dashboard/admin/medical-timetable" data-active={isLinkActive('/dashboard/admin/medical-timetable') ? 'true' : undefined} className={getLinkClass('/dashboard/admin/medical-timetable')}>
                    <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Medical Timetable</span>
                  </Link>
                ) : (
                  <Link href="/dashboard/admin/timetable-design" data-active={isLinkActive('/dashboard/admin/timetable-design') ? 'true' : undefined} className={getLinkClass('/dashboard/admin/timetable-design')}>
                    <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Design Timetable</span>
                  </Link>
                )
              )}

              {isAllowed('admin_attendance_master') && (
                <Link href="/dashboard/admin/attendance-master" data-active={isLinkActive('/dashboard/admin/attendance-master') ? 'true' : undefined} className={getLinkClass('/dashboard/admin/attendance-master')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span>Attendance Portal Sync</span>
                </Link>
              )}

              {isAllowed('admin_biometric') && (
                <Link href="/dashboard/admin/attendance-biometric" data-active={isLinkActive('/dashboard/admin/attendance-biometric') ? 'true' : undefined} className={getLinkClass('/dashboard/admin/attendance-biometric')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Attendance — Bio-Metric/CCTV</span>
                </Link>
              )}

              {isAllowed('admin_attendance_reports') && (
                <Link href="/dashboard/admin/attendance-reports" data-active={isLinkActive('/dashboard/admin/attendance-reports') ? 'true' : undefined} className={getLinkClass('/dashboard/admin/attendance-reports')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Attendance Reports</span>
                </Link>
              )}

              {isAllowed('admin_assessment') && (
                <Link href="/dashboard/admin/assessment" data-active={isLinkActive('/dashboard/admin/assessment') ? 'true' : undefined} className={getLinkClass('/dashboard/admin/assessment')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Assessment & Q-Bank</span>
                </Link>
              )}

              {isAllowed('admin_marks') && (
                <Link href="/dashboard/admin/assessment-marks" data-active={isLinkActive('/dashboard/admin/assessment-marks') ? 'true' : undefined} className={getLinkClass('/dashboard/admin/assessment-marks')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span>Gradebook & Scores</span>
                </Link>
              )}

              {(isAllowed('admin_logbook', '/dashboard/admin/reports/logbook') || isAllowed('logbook')) && (
                <Link href="/dashboard/admin/reports/logbook" data-active={isLinkActive('/dashboard/admin/reports/logbook') ? 'true' : undefined} className={getLinkClass('/dashboard/admin/reports/logbook')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span>LogBook & Merit Leaderboard</span>
                </Link>
              )}

              {(isAllowed('admin_placement', '/dashboard/admin/placement') || isAllowed('placement') || isAllowed('placement_drive')) && (
                <Link href="/dashboard/admin/placement" data-active={isLinkActive('/dashboard/admin/placement') ? 'true' : undefined} className={getLinkClass('/dashboard/admin/placement')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Placement Drive 💼</span>
                </Link>
              )}

              {isAllowed('admin_internships') && (
                <Link href="/dashboard/admin/internships" data-active={isLinkActive('/dashboard/admin/internships') ? 'true' : undefined} className={getLinkClass('/dashboard/admin/internships')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                  <span>Internships & Certs</span>
                </Link>
              )}

              {(isAllowed('admin_repository', '/dashboard/admin/repository') || isAllowed('repository') || isAllowed('admin_academic_repository')) && (
                <Link href="/dashboard/admin/repository" data-active={isLinkActive('/dashboard/admin/repository') ? 'true' : undefined} className={getLinkClass('/dashboard/admin/repository')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110 text-indigo-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span>Academic Repository 📂</span>
                </Link>
              )}

              {(isAllowed('admin_incubation', '/dashboard/admin/incubation-cell') || isAllowed('incubation_cell') || isAllowed('admin_incubation_cell') || isAllowed('incubation')) && (
                <Link href="/dashboard/admin/incubation-cell" data-active={isLinkActive('/dashboard/admin/incubation-cell') ? 'true' : undefined} className={getLinkClass('/dashboard/admin/incubation-cell')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110 text-purple-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Incubation Cell 🚀</span>
                </Link>
              )}

              {isAllowed('admin_notices') && (
                <Link href="/dashboard/admin/notices/sent" data-active={isLinkActive('/dashboard/admin/notices') || isLinkActive('/dashboard/admin/notices/sent') ? 'true' : undefined} className={getLinkClass('/dashboard/admin/notices')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                  <span>Notices & Circulars</span>
                </Link>
              )}

              {isAllowed('admin_library') && (
                <Link href="/dashboard/admin/library" data-active={isLinkActive('/dashboard/admin/library') ? 'true' : undefined} className={getLinkClass('/dashboard/admin/library')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span>Digital Library</span>
                </Link>
              )}

              {isAllowed('admin_chat') && (
                <Link href="/dashboard/admin/chat" data-active={isLinkActive('/dashboard/admin/chat') ? 'true' : undefined} className={getLinkClass('/dashboard/admin/chat')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Batch & Dept Chat</span>
                </Link>
              )}

              {(isAllowed('admin_reports', '/dashboard/admin/reports') || 
                isAllowed('admin_reports_attendance', '/dashboard/admin/reports/attendance') || 
                isAllowed('admin_reports_theory_result', '/dashboard/admin/reports/theory-result') ||
                isAllowed('admin_reports_logbook', '/dashboard/admin/reports/logbook')) && (
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setMisReportsOpen(!misReportsOpen)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-r-xl font-bold transition-all group ${
                      pathname?.startsWith('/dashboard/admin/reports')
                        ? 'text-[#F36C21] bg-[#F36C21]/10 border-l-4 border-[#F36C21] shadow-xs'
                        : 'text-[#475467] dark:text-slate-300 hover:text-[#11141A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>MIS Reports</span>
                    </div>
                    <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-[#11141A] dark:text-white font-black flex items-center justify-center text-xs">
                      {misReportsOpen ? '−' : '+'}
                    </span>
                  </button>

                  {misReportsOpen && (
                    <div className="pl-6 pr-1 space-y-1 pt-1 border-l-2 border-slate-200 dark:border-slate-800 ml-3">
                      {isAllowed('admin_reports_attendance', '/dashboard/admin/reports/attendance') && (
                        <Link
                          href="/dashboard/admin/reports/attendance"
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                            pathname === '/dashboard/admin/reports' || pathname === '/dashboard/admin/reports/attendance'
                              ? 'font-black text-[#F36C21] bg-[#F36C21]/12 shadow-sm'
                              : 'font-medium text-[#475467] dark:text-slate-300 hover:text-[#11141A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F36C21]"></span>
                          <span>1. Attendance Report</span>
                        </Link>
                      )}

                      {isAllowed('admin_reports_theory_result', '/dashboard/admin/reports/theory-result') && (
                        <Link
                          href="/dashboard/admin/reports/theory-result"
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                            pathname === '/dashboard/admin/reports/theory-result' || pathname === '/dashboard/admin/reports/theory'
                              ? 'font-black text-[#F36C21] bg-[#F36C21]/12 shadow-sm'
                              : 'font-medium text-[#475467] dark:text-slate-300 hover:text-[#11141A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FFB020]"></span>
                          <span>2. Theory Result</span>
                        </Link>
                      )}

                      {isAllowed('admin_reports_logbook', '/dashboard/admin/reports/logbook') && (
                        <Link
                          href="/dashboard/admin/reports/logbook"
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                            pathname === '/dashboard/admin/reports/logbook'
                              ? 'font-black text-[#F36C21] bg-[#F36C21]/12 shadow-sm'
                              : 'font-medium text-[#475467] dark:text-slate-300 hover:text-[#11141A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0E9F6E]"></span>
                          <span>3. Logbook</span>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : role === 'faculty' ? (
            <>
              {isAllowed('faculty_overview') && (
                <Link href="/dashboard/faculty" className={getLinkClass('/dashboard/faculty')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Teaching Dashboard</span>
                </Link>
              )}

              {isAllowed('faculty_profile') && (
                <Link href="/dashboard/faculty/profile" className={getLinkClass('/dashboard/faculty/profile')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Faculty Profile</span>
                </Link>
              )}

              {isAllowed('faculty_students') && (
                <Link href="/dashboard/faculty/students" className={getLinkClass('/dashboard/faculty/students')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                  <span>Student Info</span>
                </Link>
              )}

              {isAllowed('faculty_dept') && (
                <Link href="/dashboard/faculty/department-faculty" className={getLinkClass('/dashboard/faculty/department-faculty')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Department Faculty</span>
                </Link>
              )}

              {isAllowed('faculty_schedule') && (
                isMedicalModule ? (
                  <Link href="/dashboard/faculty/medical-schedule" className={getLinkClass('/dashboard/faculty/medical-schedule')}>
                    <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Medical Schedule</span>
                  </Link>
                ) : (
                  <Link href="/dashboard/faculty/schedule" className={getLinkClass('/dashboard/faculty/schedule')}>
                    <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Schedule</span>
                  </Link>
                )
              )}

              {isAllowed('faculty_attendance') && (
                <Link href="/dashboard/faculty/attendance" className={getLinkClass('/dashboard/faculty/attendance')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span>Attendance Portal Sync</span>
                </Link>
              )}

              {isAllowed('faculty_biometric') && (
                <Link href="/dashboard/faculty/attendance-biometric" className={getLinkClass('/dashboard/faculty/attendance-biometric')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Attendance — Bio-Metric/CCTV</span>
                </Link>
              )}

              {isAllowed('faculty_assessment') && (
                <Link href="/dashboard/faculty/assessment" className={getLinkClass('/dashboard/faculty/assessment')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Assessment & Q-Bank</span>
                </Link>
              )}

              <Link href="/dashboard/faculty/logbook" data-active={isLinkActive('/dashboard/faculty/logbook') ? 'true' : undefined} className={getLinkClass('/dashboard/faculty/logbook')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110 text-[#F36C21]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>LogBook Entry &amp; Evaluation</span>
              </Link>

              {isAllowed('faculty_lessons') && (
                <Link href="/dashboard/faculty/lessons" className={getLinkClass('/dashboard/faculty/lessons')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span>Lesson Uploads</span>
                </Link>
              )}

              {isAllowed('faculty_placement') && (
                <Link href="/dashboard/faculty/placement" data-active={isLinkActive('/dashboard/faculty/placement') ? 'true' : undefined} className={getLinkClass('/dashboard/faculty/placement')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Placement Drive</span>
                </Link>
              )}

              {isAllowed('faculty_internships') && (
                <Link href="/dashboard/faculty/internships" data-active={isLinkActive('/dashboard/faculty/internships') ? 'true' : undefined} className={getLinkClass('/dashboard/faculty/internships')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                  <span>Internships & Certs</span>
                </Link>
              )}

              {(isAllowed('faculty_repository', '/dashboard/faculty/repository') || isAllowed('repository')) && (
                <Link href="/dashboard/faculty/repository" data-active={isLinkActive('/dashboard/faculty/repository') ? 'true' : undefined} className={getLinkClass('/dashboard/faculty/repository')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110 text-indigo-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 13l2 2 4-4" />
                  </svg>
                  <span>Project Score & Repo</span>
                </Link>
              )}

              {(isAllowed('faculty_incubation', '/dashboard/faculty/incubation-cell') || isAllowed('incubation_cell') || isAllowed('faculty_incubation_cell') || isAllowed('incubation')) && (
                <Link href="/dashboard/faculty/incubation-cell" className={getLinkClass('/dashboard/faculty/incubation-cell')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110 text-purple-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="font-bold text-purple-200">Incubation Cell 🚀</span>
                </Link>
              )}

              {isAllowed('faculty_notices') && (
                <Link href="/dashboard/faculty/notices" data-active={isLinkActive('/dashboard/faculty/notices') ? 'true' : undefined} className={getLinkClass('/dashboard/faculty/notices')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                  <span>Notices & Circulars</span>
                </Link>
              )}

              {isAllowed('faculty_library') && (
                <Link href="/dashboard/faculty/library" data-active={isLinkActive('/dashboard/faculty/library') ? 'true' : undefined} className={getLinkClass('/dashboard/faculty/library')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span>Digital Library</span>
                </Link>
              )}

              {isAllowed('faculty_chat') && (
                <Link href="/dashboard/faculty/chat" data-active={isLinkActive('/dashboard/faculty/chat') ? 'true' : undefined} className={getLinkClass('/dashboard/faculty/chat')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Batch & Dept Chat</span>
                </Link>
              )}

              {/* Expandable MIS Reports Accordion */}
              {(isAllowed('faculty_reports', '/dashboard/faculty/reports') || 
                isAllowed('faculty_reports_attendance', '/dashboard/faculty/reports/attendance') || 
                isAllowed('faculty_reports_theory_result', '/dashboard/faculty/reports/theory-result') ||
                isAllowed('faculty_reports_logbook', '/dashboard/faculty/reports/logbook')) && (
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setMisReportsOpen(!misReportsOpen)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-r-xl font-bold transition-all group ${
                      pathname?.startsWith('/dashboard/faculty/reports')
                        ? 'text-[#F36C21] bg-[#F36C21]/10 border-l-4 border-[#F36C21] shadow-xs'
                        : 'text-[#475467] dark:text-slate-300 hover:text-[#11141A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>MIS Reports</span>
                    </div>
                    <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-[#11141A] dark:text-white font-black flex items-center justify-center text-xs">
                      {misReportsOpen ? '−' : '+'}
                    </span>
                  </button>

                  {misReportsOpen && (
                    <div className="pl-6 pr-1 space-y-1 pt-1 border-l-2 border-slate-200 dark:border-slate-800 ml-3">
                      {isAllowed('faculty_reports_attendance', '/dashboard/faculty/reports/attendance') && (
                        <Link
                          href="/dashboard/faculty/reports"
                          data-active={isLinkActive('/dashboard/faculty/reports') ? 'true' : undefined}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                            pathname === '/dashboard/faculty/reports' || pathname === '/dashboard/faculty/reports/attendance'
                              ? 'font-black text-[#F36C21] bg-[#F36C21]/12 shadow-sm'
                              : 'font-medium text-[#475467] dark:text-slate-300 hover:text-[#11141A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F36C21]"></span>
                          <span>1. Attendance Report</span>
                        </Link>
                      )}

                      {isAllowed('faculty_reports_theory_result', '/dashboard/faculty/reports/theory-result') && (
                        <Link
                          href="/dashboard/faculty/reports/theory-result"
                          data-active={isLinkActive('/dashboard/faculty/reports/theory-result') ? 'true' : undefined}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                            pathname === '/dashboard/faculty/reports/theory-result' || pathname === '/dashboard/faculty/reports/theory'
                              ? 'font-black text-[#F36C21] bg-[#F36C21]/12 shadow-sm'
                              : 'font-medium text-[#475467] dark:text-slate-300 hover:text-[#11141A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FFB020]"></span>
                          <span>2. Theory Result</span>
                        </Link>
                      )}

                      {isAllowed('faculty_reports_logbook', '/dashboard/faculty/reports/logbook') && (
                        <Link
                          href="/dashboard/faculty/reports/logbook"
                          data-active={isLinkActive('/dashboard/faculty/reports/logbook') ? 'true' : undefined}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                            pathname === '/dashboard/faculty/reports/logbook'
                              ? 'font-black text-[#F36C21] bg-[#F36C21]/12 shadow-sm'
                              : 'font-medium text-[#475467] dark:text-slate-300 hover:text-[#11141A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0E9F6E]"></span>
                          <span>3. Logbook</span>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : role === 'warden' ? (
            <>
              {isAllowed('warden_overview') && (
                <>
                  <Link href="/dashboard/warden" data-active={isLinkActive('/dashboard/warden') ? 'true' : undefined} className={getLinkClass('/dashboard/warden')}>
                    <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>Hostel Warden Console</span>
                  </Link>

                  <Link href="/dashboard/warden" data-active={isLinkActive('/dashboard/warden#mess-menu') ? 'true' : undefined} className={getLinkClass('/dashboard/warden#mess-menu')}>
                    <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span>Hostel Mess & Food Menu</span>
                  </Link>

                  <Link href="/dashboard/admin/student-master" data-active={isLinkActive('/dashboard/admin/student-master') ? 'true' : undefined} className={getLinkClass('/dashboard/admin/student-master')}>
                    <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                    <span>Resident Roster</span>
                  </Link>

                  <Link href="/dashboard/chat" data-active={isLinkActive('/dashboard/chat') ? 'true' : undefined} className={getLinkClass('/dashboard/chat')}>
                    <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>Hostel & Staff Chat</span>
                  </Link>
                </>
              )}
            </>
          ) : role === 'clerk' ? (
            <>
              {isAllowed('clerk_overview') && (
                <Link href="/dashboard/clerk" data-active={isLinkActive('/dashboard/clerk') ? 'true' : undefined} className={getLinkClass('/dashboard/clerk')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Clerk Data Entry</span>
                </Link>
              )}

              <Link href="/dashboard/admin/staff-master" data-active={isLinkActive('/dashboard/admin/staff-master') ? 'true' : undefined} className={getLinkClass('/dashboard/admin/staff-master')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                <span>Staff & Faculty Master</span>
              </Link>

              <Link href="/dashboard/admin/student-master" data-active={isLinkActive('/dashboard/admin/student-master') ? 'true' : undefined} className={getLinkClass('/dashboard/admin/student-master')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                </svg>
                <span>Student Roster Master</span>
              </Link>

              {isAllowed('clerk_attendance') && (
                <Link href="/dashboard/clerk/attendance" data-active={isLinkActive('/dashboard/clerk/attendance') ? 'true' : undefined} className={getLinkClass('/dashboard/clerk/attendance')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span>Attendance Portal Sync</span>
                </Link>
              )}

              {isAllowed('clerk_biometric') && (
                <Link href="/dashboard/clerk/attendance-biometric" data-active={isLinkActive('/dashboard/clerk/attendance-biometric') ? 'true' : undefined} className={getLinkClass('/dashboard/clerk/attendance-biometric')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Attendance — Bio-Metric/CCTV</span>
                </Link>
              )}

              {isAllowed('clerk_assessment') && (
                <Link href="/dashboard/clerk/assessment" data-active={isLinkActive('/dashboard/clerk/assessment') ? 'true' : undefined} className={getLinkClass('/dashboard/clerk/assessment')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Assessment & Q-Bank</span>
                </Link>
              )}

              {isAllowed('clerk_placement') && (
                <Link href="/dashboard/clerk/placement" data-active={isLinkActive('/dashboard/clerk/placement') ? 'true' : undefined} className={getLinkClass('/dashboard/clerk/placement')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Placement Drive</span>
                </Link>
              )}

              {isAllowed('clerk_internships') && (
                <Link href="/dashboard/clerk/internships" data-active={isLinkActive('/dashboard/clerk/internships') ? 'true' : undefined} className={getLinkClass('/dashboard/clerk/internships')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                  <span>Internships & Certs</span>
                </Link>
              )}

              {isAllowed('clerk_notices') && (
                <Link href="/dashboard/clerk/notices" data-active={isLinkActive('/dashboard/clerk/notices') ? 'true' : undefined} className={getLinkClass('/dashboard/clerk/notices')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                  <span>Notices & Circulars</span>
                </Link>
              )}

              <Link href="/dashboard/chat" data-active={isLinkActive('/dashboard/chat') ? 'true' : undefined} className={getLinkClass('/dashboard/chat')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Batch & Dept Chat</span>
              </Link>
            </>
          ) : (
            <>
              {isAllowed('student_overview') && (
                <Link href="/dashboard/student" data-active={isLinkActive('/dashboard/student') ? 'true' : undefined} className={getLinkClass('/dashboard/student')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Dashboard</span>
                </Link>
              )}

              {isAllowed('student_profile') && (
                <Link href="/dashboard/student/profile" data-active={isLinkActive('/dashboard/student/profile') ? 'true' : undefined} className={getLinkClass('/dashboard/student/profile')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Student Profile</span>
                </Link>
              )}

              {isAllowed('student_timetable') && (
                isMedicalModule ? (
                  <Link href="/dashboard/student/medical-schedule" data-active={isLinkActive('/dashboard/student/medical-schedule') ? 'true' : undefined} className={getLinkClass('/dashboard/student/medical-schedule')}>
                    <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Medical Schedule</span>
                  </Link>
                ) : (
                  <Link href="/dashboard/student/timetable" data-active={isLinkActive('/dashboard/student/timetable') ? 'true' : undefined} className={getLinkClass('/dashboard/student/timetable')}>
                    <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Schedule</span>
                  </Link>
                )
              )}

              {isAllowed('student_attendance') && (
                <Link href="/dashboard/student/attendance" data-active={isLinkActive('/dashboard/student/attendance') ? 'true' : undefined} className={getLinkClass('/dashboard/student/attendance')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span>Attendance Portal Sync</span>
                </Link>
              )}

              {isAllowed('student_biometric') && (
                <Link href="/dashboard/student/attendance-biometric" data-active={isLinkActive('/dashboard/student/attendance-biometric') ? 'true' : undefined} className={getLinkClass('/dashboard/student/attendance-biometric')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Attendance — Bio-Metric/CCTV</span>
                </Link>
              )}

              {isAllowed('student_assessment') && (
                <Link href="/dashboard/student/assessment" data-active={isLinkActive('/dashboard/student/assessment') ? 'true' : undefined} className={getLinkClass('/dashboard/student/assessment')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Assessment & Tests</span>
                </Link>
              )}

              <Link href="/dashboard/student/logbook" data-active={isLinkActive('/dashboard/student/logbook') ? 'true' : undefined} className={getLinkClass('/dashboard/student/logbook')}>
                <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110 text-[#F36C21]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>LogBook &amp; Submissions</span>
              </Link>

              {isAllowed('student_lessons') && (
                <Link href="/dashboard/student/lessons" data-active={isLinkActive('/dashboard/student/lessons') ? 'true' : undefined} className={getLinkClass('/dashboard/student/lessons')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span>Lessons & Materials</span>
                </Link>
              )}

              {(isAllowed('student_repository', '/dashboard/student/repository') || isAllowed('repository')) && (
                <Link href="/dashboard/student/repository" data-active={isLinkActive('/dashboard/student/repository') ? 'true' : undefined} className={getLinkClass('/dashboard/student/repository')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110 text-indigo-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span>My Repository</span>
                </Link>
              )}

              {(isAllowed('student_incubation', '/dashboard/student') || isAllowed('incubation_cell') || isAllowed('student_repository')) && (
                <Link href="/dashboard/student#incubation-cell" className={getLinkClass('/dashboard/student#incubation-cell')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110 text-purple-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="font-bold text-purple-200">Incubation Hub 🚀</span>
                </Link>
              )}

              {isAllowed('student_placement') && (
                <Link href="/dashboard/student/placement" data-active={isLinkActive('/dashboard/student/placement') ? 'true' : undefined} className={getLinkClass('/dashboard/student/placement')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Placement Drive</span>
                </Link>
              )}

              {isAllowed('student_internships') && (
                <Link href="/dashboard/student/internships" data-active={isLinkActive('/dashboard/student/internships') ? 'true' : undefined} className={getLinkClass('/dashboard/student/internships')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                  <span>Internships & Certs</span>
                </Link>
              )}

              {isAllowed('student_notices') && (
                <Link href="/dashboard/student/notices" data-active={isLinkActive('/dashboard/student/notices') ? 'true' : undefined} className={getLinkClass('/dashboard/student/notices')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                  <span>Notices & Circulars</span>
                </Link>
              )}

              {isAllowed('student_library') && (
                <Link href="/dashboard/student/library" data-active={isLinkActive('/dashboard/student/library') ? 'true' : undefined} className={getLinkClass('/dashboard/student/library')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span>Digital Library</span>
                </Link>
              )}

              {isAllowed('student_chat') && (
                <Link href="/dashboard/student/chat" data-active={isLinkActive('/dashboard/student/chat') ? 'true' : undefined} className={getLinkClass('/dashboard/student/chat')}>
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Batch & Dept Chat</span>
                </Link>
              )}
            </>
          )}
        </nav>
      </div>

      {/* Tenant Footer Badge */}
      <div className="pt-3 border-t border-slate-200 dark:border-white/10 text-[10px] text-[#6F7887] dark:text-gray-500 flex items-center justify-between font-mono">
        <span className="uppercase tracking-wider font-bold">Context</span>
        <span className="px-2 py-0.5 rounded-md bg-[#F36C21]/10 text-[#F36C21] border border-[#F36C21]/20 font-bold uppercase tracking-widest text-[9px]">
          srms
        </span>
      </div>
    </aside>
    </>
  );
}

