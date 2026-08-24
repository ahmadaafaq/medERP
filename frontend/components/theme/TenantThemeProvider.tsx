'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';

export interface TenantThemeConfig {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  danger_color: string;
  success_color: string;
  warning_color: string;
  page_bg: string;
  sidebar_bg: string;
  sidebar_text_color: string;
  header_bg: string;
  card_bg: string;
  font_family: string;
  base_font_size: string;
  card_radius: string;
  border_radius_scale: 'sharp' | 'rounded' | 'pill' | string;
  login_bg_type: 'gradient' | 'image' | string;
  login_bg_url: string;
  table_header_bg: string;
  table_zebra: boolean;
  theme_mode: 'LIGHT' | 'DARK' | 'AUTO' | string;
  version: number;
}

export interface TenantThemeData {
  tenant_id: string | null;
  tenant_slug: string | null;
  title: string;
  logo_url: string | null;
  favicon_url: string | null;
  theme_color: string;
  theme_config: TenantThemeConfig;
  updated_at?: string;
  updated_by?: string;
}

export const DEFAULT_PLATFORM_THEME_CONFIG: TenantThemeConfig = {
  primary_color: '#5B4BFF',
  secondary_color: '#7867FF',
  accent_color: '#F36C21',
  danger_color: '#F04438',
  success_color: '#00C48C',
  warning_color: '#FFB020',
  page_bg: '#F6F8FC',
  sidebar_bg: '#2D2575',
  sidebar_text_color: '#FFFFFF',
  header_bg: '#2D2575',
  card_bg: '#FFFFFF',
  font_family: 'Inter',
  base_font_size: '14px',
  card_radius: '22px',
  border_radius_scale: 'rounded',
  login_bg_type: 'gradient',
  login_bg_url: '',
  table_header_bg: '#F8FAFC',
  table_zebra: true,
  theme_mode: 'LIGHT',
  version: 1,
};

interface TenantThemeContextType {
  theme: TenantThemeData;
  loading: boolean;
  activeSlug: string;
  setTenantTheme: (newTheme: Partial<TenantThemeData>) => void;
  reloadTheme: () => Promise<void>;
  applyThemeToDOM: (themeData: TenantThemeData) => void;
}

const TenantThemeContext = createContext<TenantThemeContextType>({
  theme: {
    tenant_id: null,
    tenant_slug: 'srms-cet-bareilly',
    title: 'SRMS College of Engineering & Technology, Bareilly',
    logo_url: null,
    favicon_url: null,
    theme_color: '#5B4BFF',
    theme_config: DEFAULT_PLATFORM_THEME_CONFIG,
  },
  loading: false,
  activeSlug: 'srms-cet-bareilly',
  setTenantTheme: () => {},
  reloadTheme: async () => {},
  applyThemeToDOM: () => {},
});

export const useTenantTheme = () => useContext(TenantThemeContext);

export default function TenantThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState<boolean>(false);
  const [activeSlug, setActiveSlug] = useState<string>('srms-cet-bareilly');
  const [theme, setTheme] = useState<TenantThemeData>({
    tenant_id: null,
    tenant_slug: 'srms-cet-bareilly',
    title: 'SRMS College of Engineering & Technology, Bareilly',
    logo_url: null,
    favicon_url: null,
    theme_color: '#5B4BFF',
    theme_config: DEFAULT_PLATFORM_THEME_CONFIG,
  });

  const applyThemeToDOM = (data: TenantThemeData) => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const cfg = data.theme_config || DEFAULT_PLATFORM_THEME_CONFIG;

    const primary = cfg.primary_color || data.theme_color || '#5B4BFF';
    const secondary = cfg.secondary_color || '#7867FF';
    const accent = cfg.accent_color || '#F36C21';
    const danger = cfg.danger_color || '#F04438';
    const success = cfg.success_color || '#00C48C';
    const warning = cfg.warning_color || '#FFB020';
    const pageBg = cfg.page_bg || '#F6F8FC';
    const sidebarBg = cfg.sidebar_bg || '#2D2575';
    const sidebarTextColor = cfg.sidebar_text_color || '#FFFFFF';
    const headerBg = cfg.header_bg || cfg.sidebar_bg || '#2D2575';
    const cardBg = cfg.card_bg || '#FFFFFF';
    const cardRadius = cfg.card_radius || '22px';
    const tableHeaderBg = cfg.table_header_bg || '#F8FAFC';
    const fontFamily = cfg.font_family || 'Inter';
    const baseFontSize = cfg.base_font_size || '14px';

    // CSS Custom Properties Injection on :root
    root.style.setProperty('--color-brand-primary', primary);
    root.style.setProperty('--color-brand-secondary', secondary);
    root.style.setProperty('--color-brand-accent', accent);
    root.style.setProperty('--color-danger', danger);
    root.style.setProperty('--color-success', success);
    root.style.setProperty('--color-warning', warning);
    root.style.setProperty('--bg-main', pageBg);
    root.style.setProperty('--color-bg-canvas', pageBg);
    root.style.setProperty('--sidebar-bg', sidebarBg);
    root.style.setProperty('--sidebar-text-color', sidebarTextColor);
    root.style.setProperty('--header-bg', headerBg);
    root.style.setProperty('--card-bg', cardBg);
    root.style.setProperty('--card-radius', cardRadius);
    root.style.setProperty('--radius-lg', cardRadius);
    root.style.setProperty('--table-header-bg', tableHeaderBg);
    root.style.setProperty('--font-family', fontFamily);
    root.style.setProperty('--base-font-size', baseFontSize);

    // Update Favicon dynamically if specified
    if (data.favicon_url) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = data.favicon_url;
    }

    // Cache locally
    try {
      const cacheKey = `mederp_theme_${data.tenant_slug || 'default'}`;
      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem('tenant_primary_color', primary);
      localStorage.setItem('tenant_sidebar_bg', sidebarBg);
      localStorage.setItem('tenant_card_radius', cardRadius);
    } catch {}
  };

  const resolveTenantSlug = (): string => {
    if (typeof window === 'undefined') return 'srms-cet-bareilly';

    const urlParams = new URLSearchParams(window.location.search);
    const querySlug = urlParams.get('tenant') || urlParams.get('college');
    if (querySlug) return querySlug.toLowerCase().trim().replace(/^tenant_/, '');

    const storedSlug =
      localStorage.getItem('tenantSlug') ||
      localStorage.getItem('selectedTenant') ||
      localStorage.getItem('colg_slug');
    if (storedSlug) return storedSlug.toLowerCase().trim().replace(/^tenant_/, '');

    return 'srms-cet-bareilly';
  };

  const reloadTheme = async () => {
    // CRITICAL ISOLATION RULE: Never apply tenant themes to Owner routes
    if (
      pathname?.startsWith('/dashboard/owner') ||
      pathname?.startsWith('/owner') ||
      pathname?.startsWith('/dashboard/superadmin')
    ) {
      const defaultPlatformData: TenantThemeData = {
        tenant_id: null,
        tenant_slug: 'platform-default',
        title: 'Platform Default',
        logo_url: null,
        favicon_url: null,
        theme_color: '#5B4BFF',
        theme_config: DEFAULT_PLATFORM_THEME_CONFIG,
      };
      setTheme(defaultPlatformData);
      applyThemeToDOM(defaultPlatformData);
      return;
    }

    const slug = resolveTenantSlug();
    setActiveSlug(slug);

    // Check cached version first for instant paint
    try {
      const cached = localStorage.getItem(`mederp_theme_${slug}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        setTheme(parsed);
        applyThemeToDOM(parsed);
      }
    } catch {}

    try {
      setLoading(true);
      const res = await fetch(`/api/tenants/${slug}/theme`);
      if (res.ok) {
        const json = await res.json();
        const themeData: TenantThemeData = json.data || json;
        if (themeData && themeData.theme_config) {
          setTheme(themeData);
          applyThemeToDOM(themeData);
        }
      }
    } catch (e) {
      console.warn('Failed to load remote tenant theme, using fallback.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadTheme();

    const handleThemeUpdate = (e: any) => {
      if (e?.detail) {
        const updated: TenantThemeData = {
          ...theme,
          theme_color: e.detail.theme_color || theme.theme_color,
          theme_config: {
            ...theme.theme_config,
            ...(e.detail.theme_config || {}),
          },
        };
        setTheme(updated);
        applyThemeToDOM(updated);
      } else {
        reloadTheme();
      }
    };

    window.addEventListener('themeUpdated', handleThemeUpdate);
    window.addEventListener('tenantChange', reloadTheme);
    window.addEventListener('storage', reloadTheme);

    return () => {
      window.removeEventListener('themeUpdated', handleThemeUpdate);
      window.removeEventListener('tenantChange', reloadTheme);
      window.removeEventListener('storage', reloadTheme);
    };
  }, [pathname]);

  const value = useMemo(
    () => ({
      theme,
      loading,
      activeSlug,
      setTenantTheme: (newTheme: Partial<TenantThemeData>) => {
        setTheme((prev) => {
          const merged = { ...prev, ...newTheme };
          applyThemeToDOM(merged);
          return merged;
        });
      },
      reloadTheme,
      applyThemeToDOM,
    }),
    [theme, loading, activeSlug],
  );

  return <TenantThemeContext.Provider value={value}>{children}</TenantThemeContext.Provider>;
}
