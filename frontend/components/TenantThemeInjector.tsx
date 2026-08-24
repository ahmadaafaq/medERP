'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export interface FirmThemeConfig {
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  sidebar_bg?: string;
  sidebar_text_color?: string;
  header_bg?: string;
  header_border_color?: string;
  page_bg?: string;
  card_bg?: string;
  card_radius?: string;
  card_shadow?: string;
  table_header_bg?: string;
  table_zebra?: boolean;
  theme_mode?: 'LIGHT' | 'DARK' | 'AUTO';
  font_family?: string;
}

export default function TenantThemeInjector() {
  const pathname = usePathname();

  const applyThemeToDOM = (themeColor?: string, config?: FirmThemeConfig | null) => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    const primary   = config?.primary_color   || themeColor || '#F36C21';
    const secondary = config?.secondary_color  || '#E05B10';
    const accent    = config?.accent_color     || '#F36C21';
    const sidebarBg = config?.sidebar_bg       || '#FFFFFF';
    const headerBg  = config?.header_bg        || '#FFFFFF';
    const pageBg    = config?.page_bg          || '#F7F8FA';
    const cardBg    = config?.card_bg          || '#FFFFFF';
    const cardRadius      = config?.card_radius      || '20px';
    const tableHeaderBg   = config?.table_header_bg  || '#F9FAFB';

    const isDark = (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) || (typeof window !== 'undefined' && localStorage.getItem('mederp_theme') === 'dark');
    const effectiveSidebarBg = isDark ? '#0B1120' : sidebarBg;
    const effectiveHeaderBg  = isDark ? '#0B1120' : headerBg;
    const effectivePageBg    = isDark ? '#0A0D14' : pageBg;

    // CSS Custom Properties Injection
    root.style.setProperty('--color-brand-primary', primary);
    root.style.setProperty('--color-brand-secondary', secondary);
    root.style.setProperty('--color-brand-accent', accent);
    root.style.setProperty('--sidebar-bg', effectiveSidebarBg);
    root.style.setProperty('--header-bg', effectiveHeaderBg);
    root.style.setProperty('--bg-main', effectivePageBg);
    root.style.setProperty('--color-bg-canvas', effectivePageBg);
    root.style.setProperty('--card-bg', isDark ? '#111827' : cardBg);
    root.style.setProperty('--radius-lg', cardRadius);
    root.style.setProperty('--table-header-bg', isDark ? '#0F172A' : tableHeaderBg);

    // Save in localStorage for fast instantaneous paint
    try {
      localStorage.setItem('tenant_primary_color', primary);
      localStorage.setItem('tenant_sidebar_bg', sidebarBg);
      localStorage.setItem('tenant_card_radius', cardRadius);
    } catch {}
  };

  // ── Intercept old purple DB values and map them to new brand tokens ──────
  const sanitizeConfig = (themeColor?: string, config?: FirmThemeConfig | null): [string | undefined, FirmThemeConfig | null] => {
    const OLD_PURPLES = ['#2D2575', '#5B4BFF', '#7867FF', '#4F46E5', '#6366F1'];
    const isOld = (v?: string) => !!v && OLD_PURPLES.some(p => p.toUpperCase() === v.toUpperCase());

    const safeColor = isOld(themeColor) ? '#F36C21' : themeColor;
    if (!config) return [safeColor, null];

    return [safeColor, {
      ...config,
      primary_color:   isOld(config.primary_color)  ? '#F36C21'  : config.primary_color,
      secondary_color: isOld(config.secondary_color) ? '#E05B10'  : config.secondary_color,
      sidebar_bg:      isOld(config.sidebar_bg)      ? '#FFFFFF'  : config.sidebar_bg,
      header_bg:       isOld(config.header_bg)       ? '#FFFFFF'  : config.header_bg,
    }];
  };

  const loadTenantTheme = async () => {
    if (typeof window === 'undefined') return;

    // ── One-time purge of stale purple localStorage cache ─────────────────
    try {
      const OLD_PURPLES = ['#2D2575', '#5B4BFF', '#7867FF', '#4F46E5'];
      const cp = localStorage.getItem('tenant_primary_color') || '';
      const cs = localStorage.getItem('tenant_sidebar_bg') || '';
      if (OLD_PURPLES.some(p => cp.toUpperCase() === p.toUpperCase() || cs.toUpperCase() === p.toUpperCase())) {
        Object.keys(localStorage)
          .filter(k => k.startsWith('mederp_theme_') || k === 'tenant_primary_color' || k === 'tenant_sidebar_bg' || k === 'tenant_card_radius')
          .forEach(k => localStorage.removeItem(k));
      }
    } catch {}
    // ──────────────────────────────────────────────────────────────────────

    // ISOLATION RULE: Owner dashboard & Theme Studio routes must NEVER be affected by tenant themes
    if (
      pathname?.startsWith('/dashboard/owner') ||
      pathname?.startsWith('/owner') ||
      pathname?.startsWith('/dashboard/superadmin')
    ) {
      applyThemeToDOM('#F36C21', {
        primary_color:   '#F36C21',
        secondary_color: '#E05B10',
        accent_color:    '#F36C21',
        sidebar_bg:      '#14171F',
        header_bg:       '#14171F',
        page_bg:         '#F7F8FA',
        card_bg:         '#FFFFFF',
        card_radius:     '20px',
        table_header_bg: '#F9FAFB',
      });
      return;
    }

    const rawSlug =
      localStorage.getItem('tenantSlug') ||
      localStorage.getItem('selectedTenant') ||
      localStorage.getItem('colg_slug') ||
      '';

    const cleanSlug = rawSlug.toLowerCase().trim().replace(/^tenant_/, '').replace(/^tenant-/, '') || 'srms-cet-bareilly';

    // Fast paint from cached values (already sanitized)
    const cachedPrimary = localStorage.getItem('tenant_primary_color');
    const cachedSidebar = localStorage.getItem('tenant_sidebar_bg');
    if (cachedPrimary || cachedSidebar) {
      applyThemeToDOM(cachedPrimary || undefined, {
        sidebar_bg: cachedSidebar || undefined,
        primary_color: cachedPrimary || undefined,
      });
    }

    try {
      const res = await fetch(`/api/firms/${cleanSlug}/status`);
      if (res.ok) {
        const json = await res.json();
        const firm = json.firm || json;
        if (firm) {
          // ← SANITIZE before applying — intercept any purple from DB
          const [safeColor, safeConfig] = sanitizeConfig(firm.theme_color, firm.theme_config);
          applyThemeToDOM(safeColor, safeConfig);
        }
      }
    } catch {
      // Fallback to default
    }
  };

  useEffect(() => {
    loadTenantTheme();

    const handleThemeUpdate = (e: any) => {
      if (e?.detail) {
        applyThemeToDOM(e.detail.theme_color, e.detail.theme_config);
      } else {
        loadTenantTheme();
      }
    };

    window.addEventListener('themeUpdated', handleThemeUpdate);
    window.addEventListener('tenantChange', loadTenantTheme);
    window.addEventListener('storage', loadTenantTheme);

    return () => {
      window.removeEventListener('themeUpdated', handleThemeUpdate);
      window.removeEventListener('tenantChange', loadTenantTheme);
      window.removeEventListener('storage', loadTenantTheme);
    };
  }, [pathname]);

  return null;
}
