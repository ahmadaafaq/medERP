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

    const primary = config?.primary_color || themeColor || '#5B4BFF';
    const secondary = config?.secondary_color || '#7867FF';
    const accent = config?.accent_color || '#F36C21';
    const sidebarBg = config?.sidebar_bg || '#2D2575';
    const headerBg = config?.header_bg || '#FFFFFF';
    const pageBg = config?.page_bg || '#F6F8FC';
    const cardBg = config?.card_bg || '#FFFFFF';
    const cardRadius = config?.card_radius || '22px';
    const tableHeaderBg = config?.table_header_bg || '#F8FAFC';

    // CSS Custom Properties Injection
    root.style.setProperty('--color-brand-primary', primary);
    root.style.setProperty('--color-brand-secondary', secondary);
    root.style.setProperty('--color-brand-accent', accent);
    root.style.setProperty('--sidebar-bg', sidebarBg);
    root.style.setProperty('--header-bg', headerBg);
    root.style.setProperty('--bg-main', pageBg);
    root.style.setProperty('--color-bg-canvas', pageBg);
    root.style.setProperty('--card-bg', cardBg);
    root.style.setProperty('--radius-lg', cardRadius);
    root.style.setProperty('--table-header-bg', tableHeaderBg);

    // Save in localStorage for fast instantaneous paint
    try {
      localStorage.setItem('tenant_primary_color', primary);
      localStorage.setItem('tenant_sidebar_bg', sidebarBg);
      localStorage.setItem('tenant_card_radius', cardRadius);
    } catch {}
  };

  const loadTenantTheme = async () => {
    if (typeof window === 'undefined') return;

    // ISOLATION RULE: Owner dashboard & Theme Studio routes must NEVER be affected by tenant themes
    if (
      pathname?.startsWith('/dashboard/owner') ||
      pathname?.startsWith('/owner') ||
      pathname?.startsWith('/dashboard/superadmin')
    ) {
      applyThemeToDOM('#5B4BFF', {
        primary_color: '#5B4BFF',
        secondary_color: '#7867FF',
        accent_color: '#F36C21',
        sidebar_bg: '#2D2575',
        header_bg: '#2D2575',
        page_bg: '#F6F8FC',
        card_bg: '#FFFFFF',
        card_radius: '22px',
        table_header_bg: '#F8FAFC',
      });
      return;
    }

    const rawSlug =
      localStorage.getItem('tenantSlug') ||
      localStorage.getItem('selectedTenant') ||
      localStorage.getItem('colg_slug') ||
      '';

    const cleanSlug = rawSlug.toLowerCase().trim().replace(/^tenant_/, '').replace(/^tenant-/, '') || 'srms-cet-bareilly';

    // Fast paint from cached values
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
          applyThemeToDOM(firm.theme_color, firm.theme_config);
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
