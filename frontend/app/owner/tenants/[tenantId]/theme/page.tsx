'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '../../../../../components/Sidebar';
import Header from '../../../../../components/Header';
import {
  DEFAULT_PLATFORM_THEME_CONFIG,
  TenantThemeConfig,
  TenantThemeData,
} from '../../../../../components/theme/TenantThemeProvider';

interface FirmOption {
  id: string;
  slug: string;
  title: string;
  theme_color?: string;
  theme_config?: any;
  logo_url?: string;
  favicon_url?: string;
}

// ─── WCAG CONTRAST RATIO UTILITY ─────────────────────────────────────────────
function getLuminance(hexColor: string): number {
  const clean = hexColor.replace('#', '');
  if (clean.length !== 6) return 0.5;
  const rgb = [
    parseInt(clean.substr(0, 2), 16) / 255,
    parseInt(clean.substr(2, 2), 16) / 255,
    parseInt(clean.substr(4, 2), 16) / 255,
  ].map((val) => (val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)));
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function calculateContrastRatio(color1: string, color2: string): number {
  try {
    const l1 = getLuminance(color1);
    const l2 = getLuminance(color2);
    const brightest = Math.max(l1, l2);
    const darkest = Math.min(l1, l2);
    return (brightest + 0.05) / (darkest + 0.05);
  } catch {
    return 4.5;
  }
}

export default function TenantThemeEditorPage() {
  const params = useParams();
  const router = useRouter();
  const rawTenantParam = (params?.tenantId as string) || '';

  const [firms, setFirms] = useState<FirmOption[]>([]);
  const [selectedFirmId, setSelectedFirmId] = useState<string>(rawTenantParam);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Active Theme State
  const [themeConfig, setThemeConfig] = useState<TenantThemeConfig>(DEFAULT_PLATFORM_THEME_CONFIG);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [faviconUrl, setFaviconUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'branding' | 'layout'>('colors');
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);

  // Fetch registered firms list
  useEffect(() => {
    fetchFirms();
  }, []);

  const fetchFirms = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/firms');
      if (res.ok) {
        const json = await res.json();
        const list: FirmOption[] = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
        setFirms(list);

        // If no selected firm or param is slug, match accordingly
        if (list.length > 0) {
          const match =
            list.find((f) => f.id === rawTenantParam || f.slug === rawTenantParam) || list[0];
          setSelectedFirmId(match.id);
          loadThemeForFirm(match.id);
        }
      }
    } catch (e) {
      console.warn('Could not fetch firms list:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadThemeForFirm = async (firmIdOrSlug: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tenants/${firmIdOrSlug}/theme`);
      if (res.ok) {
        const data: TenantThemeData = await res.json();
        if (data && data.theme_config) {
          setThemeConfig({
            ...DEFAULT_PLATFORM_THEME_CONFIG,
            ...data.theme_config,
            primary_color: data.theme_config.primary_color || data.theme_color || DEFAULT_PLATFORM_THEME_CONFIG.primary_color,
          });
          setLogoUrl(data.logo_url || '');
          setFaviconUrl(data.favicon_url || '');
        }
      }
    } catch (e) {
      console.error('Failed to load tenant theme:', e);
    } finally {
      setLoading(false);
    }
  };

  const currentFirm = firms.find((f) => f.id === selectedFirmId);

  // Switch firm
  const handleSelectFirm = (firmId: string) => {
    setSelectedFirmId(firmId);
    loadThemeForFirm(firmId);
  };

  // Contrast evaluations
  const sidebarContrast = useMemo(() => {
    const ratio = calculateContrastRatio(themeConfig.sidebar_bg, themeConfig.sidebar_text_color);
    return {
      ratio: ratio.toFixed(2),
      isAccessible: ratio >= 4.5,
    };
  }, [themeConfig.sidebar_bg, themeConfig.sidebar_text_color]);

  const buttonContrast = useMemo(() => {
    const ratio = calculateContrastRatio(themeConfig.primary_color, '#FFFFFF');
    return {
      ratio: ratio.toFixed(2),
      isAccessible: ratio >= 3.0,
    };
  }, [themeConfig.primary_color]);

  // Save handler
  const handleSaveTheme = async () => {
    if (!selectedFirmId) return;

    setSaving(true);
    setFeedbackMsg(null);

    const payload = {
      primary_color: themeConfig.primary_color,
      secondary_color: themeConfig.secondary_color,
      accent_color: themeConfig.accent_color,
      danger_color: themeConfig.danger_color,
      success_color: themeConfig.success_color,
      warning_color: themeConfig.warning_color,
      page_bg: themeConfig.page_bg,
      sidebar_bg: themeConfig.sidebar_bg,
      sidebar_text_color: themeConfig.sidebar_text_color,
      header_bg: themeConfig.header_bg,
      card_bg: themeConfig.card_bg,
      font_family: themeConfig.font_family,
      base_font_size: themeConfig.base_font_size,
      card_radius: themeConfig.card_radius,
      border_radius_scale: themeConfig.border_radius_scale,
      login_bg_type: themeConfig.login_bg_type,
      login_bg_url: themeConfig.login_bg_url,
      table_header_bg: themeConfig.table_header_bg,
      table_zebra: themeConfig.table_zebra,
      theme_mode: themeConfig.theme_mode,
      logo_url: logoUrl || undefined,
      favicon_url: faviconUrl || undefined,
      theme_config: themeConfig,
      updated_by: 'PLATFORM_OWNER',
    };

    try {
      const res = await fetch(`/api/tenants/${selectedFirmId}/theme`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Failed to save theme');

      // Instantly dispatch event to all open tabs & update localStorage
      if (typeof window !== 'undefined') {
        const updatedSlug = currentFirm?.slug || selectedFirmId;
        localStorage.setItem(`mederp_theme_${updatedSlug}`, JSON.stringify(resData));
        localStorage.setItem('tenant_primary_color', themeConfig.primary_color);
        localStorage.setItem('tenant_sidebar_bg', themeConfig.sidebar_bg);
        localStorage.setItem('tenant_card_radius', themeConfig.card_radius);

        window.dispatchEvent(
          new CustomEvent('themeUpdated', {
            detail: {
              theme_color: themeConfig.primary_color,
              theme_config: themeConfig,
            },
          })
        );
      }

      setFeedbackMsg({
        type: 'success',
        text: `✓ Theme successfully saved and applied live for ${currentFirm?.title || 'Tenant'}!`,
      });
      setTimeout(() => setFeedbackMsg(null), 4500);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to save theme' });
    } finally {
      setSaving(false);
    }
  };

  // Reset to default
  const handleResetToDefault = () => {
    setThemeConfig(DEFAULT_PLATFORM_THEME_CONFIG);
    setLogoUrl('');
    setFaviconUrl('');
    setFeedbackMsg({
      type: 'success',
      text: 'Values reset to Platform Default. Click "Save Theme" to persist.',
    });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Handle image upload as Base64 for instant preview & persistence
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'favicon' | 'login_bg') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('File size exceeds 2MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      if (target === 'logo') setLogoUrl(b64);
      if (target === 'favicon') setFaviconUrl(b64);
      if (target === 'login_bg') setThemeConfig({ ...themeConfig, login_bg_url: b64, login_bg_type: 'image' });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F6F8FC]">
      <Sidebar role="owner" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header title="Tenant Theme & Visual Identity Editor" />

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Top Breadcrumb Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-black text-[#F36C21] uppercase tracking-wider mb-1">
                <Link href="/dashboard/owner" className="hover:underline">
                  Owner Portal
                </Link>
                <span>/</span>
                <span>Theming Engine</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#1B1E28] tracking-tight">
                Multi-Tenant Theme Editor
              </h1>
              <p className="text-xs sm:text-sm text-[#4E5969] mt-0.5">
                Customize colors, typography, logos, and UI tokens per college tenant with zero-code deployment.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-[#1B1E28] font-bold text-xs rounded-xl border border-[#E7EAF3] shadow-sm transition-all"
              >
                ↺ Reset to Default
              </button>

              <button
                type="button"
                onClick={handleSaveTheme}
                disabled={saving || !selectedFirmId}
                className="px-5 py-2 bg-[#5B4BFF] hover:bg-[#4838DF] text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-500/25 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving & Applying...</span>
                  </>
                ) : (
                  <>
                    <span>💾 Save & Apply Live Theme</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {feedbackMsg && (
            <div
              className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              <span>{feedbackMsg.text}</span>
              <button onClick={() => setFeedbackMsg(null)} className="underline text-[10px]">
                Dismiss
              </button>
            </div>
          )}

          {/* ─── 1. TENANT COLLEGE SELECTOR BAR ──────────────────────────────── */}
          <div className="bg-white p-4 rounded-[22px] border border-[#E7EAF3] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-black text-[#1B1E28] uppercase tracking-wider">
                Active Tenant College
              </label>
              <p className="text-[11px] text-[#4E5969]">Select the institution to edit its visual identity and design system</p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedFirmId}
                onChange={(e) => handleSelectFirm(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-[#E7EAF3] rounded-xl text-xs font-bold text-[#1B1E28] focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] min-w-[280px]"
              >
                {firms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.title} ({f.slug})
                  </option>
                ))}
              </select>

              {currentFirm && (
                <span
                  className="px-2.5 py-1.5 rounded-lg text-white font-mono text-xs font-bold shadow-sm flex items-center gap-1.5"
                  style={{ backgroundColor: themeConfig.primary_color }}
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  {currentFirm.slug}
                </span>
              )}
            </div>
          </div>

          {/* ─── 2. MAIN SPLIT EDITOR: CONTROLS & LIVE PREVIEW ────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: THEME SETTINGS (7 COLS) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-[22px] border border-[#E7EAF3] shadow-sm overflow-hidden">
                {/* Editor Navigation Tabs */}
                <div className="flex items-center gap-1 p-2 border-b border-[#E7EAF3] bg-slate-50/50">
                  {[
                    { id: 'colors', label: '🎨 Color Palette' },
                    { id: 'typography', label: '🔤 Typography & Text' },
                    { id: 'branding', label: '🖼️ Logos & Background' },
                    { id: 'layout', label: '📐 Shapes & Borders' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all text-center ${
                        activeTab === tab.id
                          ? 'bg-white text-[#5B4BFF] shadow-sm border border-[#E7EAF3]'
                          : 'text-[#4E5969] hover:bg-slate-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-5 space-y-5">
                  {/* TAB A: COLOR PALETTE */}
                  {activeTab === 'colors' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Primary Color */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[#1B1E28]">Primary Color</label>
                            <span className="text-[11px] font-mono text-slate-500">{themeConfig.primary_color}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={themeConfig.primary_color}
                              onChange={(e) => setThemeConfig({ ...themeConfig, primary_color: e.target.value })}
                              className="w-10 h-8 p-0.5 border border-slate-200 rounded-lg cursor-pointer bg-white"
                            />
                            <input
                              type="text"
                              value={themeConfig.primary_color}
                              onChange={(e) => setThemeConfig({ ...themeConfig, primary_color: e.target.value })}
                              className="flex-1 px-2.5 py-1 bg-white border border-[#E7EAF3] rounded-lg text-xs font-mono font-bold"
                            />
                          </div>
                        </div>

                        {/* Secondary Color */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[#1B1E28]">Secondary / Hover</label>
                            <span className="text-[11px] font-mono text-slate-500">{themeConfig.secondary_color}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={themeConfig.secondary_color}
                              onChange={(e) => setThemeConfig({ ...themeConfig, secondary_color: e.target.value })}
                              className="w-10 h-8 p-0.5 border border-slate-200 rounded-lg cursor-pointer bg-white"
                            />
                            <input
                              type="text"
                              value={themeConfig.secondary_color}
                              onChange={(e) => setThemeConfig({ ...themeConfig, secondary_color: e.target.value })}
                              className="flex-1 px-2.5 py-1 bg-white border border-[#E7EAF3] rounded-lg text-xs font-mono font-bold"
                            />
                          </div>
                        </div>

                        {/* Accent Color */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[#1B1E28]">Accent / Badges</label>
                            <span className="text-[11px] font-mono text-slate-500">{themeConfig.accent_color}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={themeConfig.accent_color}
                              onChange={(e) => setThemeConfig({ ...themeConfig, accent_color: e.target.value })}
                              className="w-10 h-8 p-0.5 border border-slate-200 rounded-lg cursor-pointer bg-white"
                            />
                            <input
                              type="text"
                              value={themeConfig.accent_color}
                              onChange={(e) => setThemeConfig({ ...themeConfig, accent_color: e.target.value })}
                              className="flex-1 px-2.5 py-1 bg-white border border-[#E7EAF3] rounded-lg text-xs font-mono font-bold"
                            />
                          </div>
                        </div>

                        {/* Danger / Error */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[#1B1E28]">Error / Danger</label>
                            <span className="text-[11px] font-mono text-slate-500">{themeConfig.danger_color}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={themeConfig.danger_color}
                              onChange={(e) => setThemeConfig({ ...themeConfig, danger_color: e.target.value })}
                              className="w-10 h-8 p-0.5 border border-slate-200 rounded-lg cursor-pointer bg-white"
                            />
                            <input
                              type="text"
                              value={themeConfig.danger_color}
                              onChange={(e) => setThemeConfig({ ...themeConfig, danger_color: e.target.value })}
                              className="flex-1 px-2.5 py-1 bg-white border border-[#E7EAF3] rounded-lg text-xs font-mono font-bold"
                            />
                          </div>
                        </div>

                        {/* Success Color */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[#1B1E28]">Success Color</label>
                            <span className="text-[11px] font-mono text-slate-500">{themeConfig.success_color}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={themeConfig.success_color}
                              onChange={(e) => setThemeConfig({ ...themeConfig, success_color: e.target.value })}
                              className="w-10 h-8 p-0.5 border border-slate-200 rounded-lg cursor-pointer bg-white"
                            />
                            <input
                              type="text"
                              value={themeConfig.success_color}
                              onChange={(e) => setThemeConfig({ ...themeConfig, success_color: e.target.value })}
                              className="flex-1 px-2.5 py-1 bg-white border border-[#E7EAF3] rounded-lg text-xs font-mono font-bold"
                            />
                          </div>
                        </div>

                        {/* Warning Color */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[#1B1E28]">Warning Color</label>
                            <span className="text-[11px] font-mono text-slate-500">{themeConfig.warning_color}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={themeConfig.warning_color}
                              onChange={(e) => setThemeConfig({ ...themeConfig, warning_color: e.target.value })}
                              className="w-10 h-8 p-0.5 border border-slate-200 rounded-lg cursor-pointer bg-white"
                            />
                            <input
                              type="text"
                              value={themeConfig.warning_color}
                              onChange={(e) => setThemeConfig({ ...themeConfig, warning_color: e.target.value })}
                              className="flex-1 px-2.5 py-1 bg-white border border-[#E7EAF3] rounded-lg text-xs font-mono font-bold"
                            />
                          </div>
                        </div>

                        {/* Sidebar Background */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[#1B1E28]">Sidebar Background</label>
                            <span className="text-[11px] font-mono text-slate-500">{themeConfig.sidebar_bg}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={themeConfig.sidebar_bg}
                              onChange={(e) => setThemeConfig({ ...themeConfig, sidebar_bg: e.target.value })}
                              className="w-10 h-8 p-0.5 border border-slate-200 rounded-lg cursor-pointer bg-white"
                            />
                            <input
                              type="text"
                              value={themeConfig.sidebar_bg}
                              onChange={(e) => setThemeConfig({ ...themeConfig, sidebar_bg: e.target.value })}
                              className="flex-1 px-2.5 py-1 bg-white border border-[#E7EAF3] rounded-lg text-xs font-mono font-bold"
                            />
                          </div>
                        </div>

                        {/* Sidebar Text Color */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[#1B1E28]">Sidebar Text Color</label>
                            <span className="text-[11px] font-mono text-slate-500">{themeConfig.sidebar_text_color}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={themeConfig.sidebar_text_color}
                              onChange={(e) => setThemeConfig({ ...themeConfig, sidebar_text_color: e.target.value })}
                              className="w-10 h-8 p-0.5 border border-slate-200 rounded-lg cursor-pointer bg-white"
                            />
                            <input
                              type="text"
                              value={themeConfig.sidebar_text_color}
                              onChange={(e) => setThemeConfig({ ...themeConfig, sidebar_text_color: e.target.value })}
                              className="flex-1 px-2.5 py-1 bg-white border border-[#E7EAF3] rounded-lg text-xs font-mono font-bold"
                            />
                          </div>
                        </div>

                        {/* Page Canvas Background */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[#1B1E28]">Page Background (Canvas)</label>
                            <span className="text-[11px] font-mono text-slate-500">{themeConfig.page_bg}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={themeConfig.page_bg}
                              onChange={(e) => setThemeConfig({ ...themeConfig, page_bg: e.target.value })}
                              className="w-10 h-8 p-0.5 border border-slate-200 rounded-lg cursor-pointer bg-white"
                            />
                            <input
                              type="text"
                              value={themeConfig.page_bg}
                              onChange={(e) => setThemeConfig({ ...themeConfig, page_bg: e.target.value })}
                              className="flex-1 px-2.5 py-1 bg-white border border-[#E7EAF3] rounded-lg text-xs font-mono font-bold"
                            />
                          </div>
                        </div>

                        {/* Card Background */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-[#1B1E28]">Card Surface Background</label>
                            <span className="text-[11px] font-mono text-slate-500">{themeConfig.card_bg}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={themeConfig.card_bg}
                              onChange={(e) => setThemeConfig({ ...themeConfig, card_bg: e.target.value })}
                              className="w-10 h-8 p-0.5 border border-slate-200 rounded-lg cursor-pointer bg-white"
                            />
                            <input
                              type="text"
                              value={themeConfig.card_bg}
                              onChange={(e) => setThemeConfig({ ...themeConfig, card_bg: e.target.value })}
                              className="flex-1 px-2.5 py-1 bg-white border border-[#E7EAF3] rounded-lg text-xs font-mono font-bold"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Accessibility Warnings */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-[#E7EAF3] space-y-2">
                        <div className="text-xs font-bold text-[#1B1E28] flex items-center justify-between">
                          <span>♿ WCAG Accessibility Contrast Health Check</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div
                            className={`p-2 rounded-lg border font-medium ${
                              sidebarContrast.isAccessible
                                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                                : 'bg-amber-50/80 border-amber-200 text-amber-800'
                            }`}
                          >
                            <span>Sidebar: {sidebarContrast.ratio}:1</span>{' '}
                            <span className="font-bold">{sidebarContrast.isAccessible ? '(✓ AA Pass)' : '(⚠️ Low Contrast)'}</span>
                          </div>
                          <div
                            className={`p-2 rounded-lg border font-medium ${
                              buttonContrast.isAccessible
                                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                                : 'bg-amber-50/80 border-amber-200 text-amber-800'
                            }`}
                          >
                            <span>Buttons: {buttonContrast.ratio}:1</span>{' '}
                            <span className="font-bold">{buttonContrast.isAccessible ? '(✓ Pass)' : '(⚠️ Warning)'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB B: TYPOGRAPHY */}
                  {activeTab === 'typography' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-[#1B1E28]">Primary Font Family</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {['Inter', 'Plus Jakarta Sans', 'Outfit', 'Roboto', 'Poppins', 'IBM Plex Sans'].map((f) => (
                            <button
                              key={f}
                              type="button"
                              onClick={() => setThemeConfig({ ...themeConfig, font_family: f })}
                              className={`p-3 rounded-xl border text-left transition-all ${
                                themeConfig.font_family === f
                                  ? 'bg-indigo-50 border-[#5B4BFF] text-[#5B4BFF] shadow-sm'
                                  : 'bg-white border-[#E7EAF3] text-[#1B1E28] hover:bg-slate-50'
                              }`}
                              style={{ fontFamily: f }}
                            >
                              <div className="font-bold text-xs">{f}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">Quick Brown Fox 123</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-[#1B1E28]">Base Font Size</label>
                        <div className="grid grid-cols-4 gap-2">
                          {['13px', '14px', '15px', '16px'].map((sz) => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => setThemeConfig({ ...themeConfig, base_font_size: sz })}
                              className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                                themeConfig.base_font_size === sz
                                  ? 'bg-[#5B4BFF] text-white border-[#5B4BFF]'
                                  : 'bg-white border-[#E7EAF3] text-[#1B1E28] hover:bg-slate-50'
                              }`}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB C: BRANDING (LOGOS & BACKGROUNDS) */}
                  {activeTab === 'branding' && (
                    <div className="space-y-4">
                      {/* Logo Upload */}
                      <div className="p-4 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-3">
                        <label className="block text-xs font-bold text-[#1B1E28]">
                          Institution Logo (Displayed on Sidebar, Header, and Login)
                        </label>
                        <div className="flex items-center gap-3">
                          {logoUrl ? (
                            <div className="w-14 h-14 rounded-xl border bg-white p-1 flex items-center justify-center shrink-0">
                              <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-xl border border-dashed border-slate-300 bg-white flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                              No Logo
                            </div>
                          )}
                          <div className="flex-1 space-y-1.5">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, 'logo')}
                              className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#5B4BFF] file:text-white hover:file:bg-[#4838DF]"
                            />
                            <input
                              type="text"
                              value={logoUrl}
                              onChange={(e) => setLogoUrl(e.target.value)}
                              placeholder="Or enter image URL (https://...)"
                              className="w-full px-2.5 py-1 bg-white border border-[#E7EAF3] rounded-lg text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Favicon Upload */}
                      <div className="p-4 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-3">
                        <label className="block text-xs font-bold text-[#1B1E28]">
                          Favicon (Browser Tab Icon)
                        </label>
                        <div className="flex items-center gap-3">
                          {faviconUrl ? (
                            <div className="w-10 h-10 rounded-lg border bg-white p-1 flex items-center justify-center shrink-0">
                              <img src={faviconUrl} alt="Favicon" className="max-h-full max-w-full object-contain" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg border border-dashed border-slate-300 bg-white flex items-center justify-center text-[10px] text-slate-400 shrink-0">
                              Icon
                            </div>
                          )}
                          <div className="flex-1 space-y-1.5">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, 'favicon')}
                              className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#5B4BFF] file:text-white"
                            />
                            <input
                              type="text"
                              value={faviconUrl}
                              onChange={(e) => setFaviconUrl(e.target.value)}
                              placeholder="Or enter favicon URL"
                              className="w-full px-2.5 py-1 bg-white border border-[#E7EAF3] rounded-lg text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Login Background Illustration */}
                      <div className="p-4 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-3">
                        <label className="block text-xs font-bold text-[#1B1E28]">
                          Login Page Background Style
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setThemeConfig({ ...themeConfig, login_bg_type: 'gradient' })}
                            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                              themeConfig.login_bg_type === 'gradient'
                                ? 'bg-[#5B4BFF] text-white border-[#5B4BFF]'
                                : 'bg-white border-[#E7EAF3] text-[#1B1E28]'
                            }`}
                          >
                            🌌 Dynamic Radial Gradient
                          </button>
                          <button
                            type="button"
                            onClick={() => setThemeConfig({ ...themeConfig, login_bg_type: 'image' })}
                            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                              themeConfig.login_bg_type === 'image'
                                ? 'bg-[#5B4BFF] text-white border-[#5B4BFF]'
                                : 'bg-white border-[#E7EAF3] text-[#1B1E28]'
                            }`}
                          >
                            🖼️ Custom Background Image
                          </button>
                        </div>
                        {themeConfig.login_bg_type === 'image' && (
                          <div className="space-y-1.5 pt-1">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, 'login_bg')}
                              className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#5B4BFF] file:text-white"
                            />
                            <input
                              type="text"
                              value={themeConfig.login_bg_url}
                              onChange={(e) => setThemeConfig({ ...themeConfig, login_bg_url: e.target.value })}
                              placeholder="Or enter background image URL (e.g. /images/campus.jpg)"
                              className="w-full px-2.5 py-1 bg-white border border-[#E7EAF3] rounded-lg text-xs"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB D: SHAPES & BORDERS */}
                  {activeTab === 'layout' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-[#1B1E28]">Border Radius Scale</label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { id: 'sharp', label: 'Sharp Corners', radius: '6px', desc: 'Sleek & Technical' },
                            { id: 'rounded', label: 'Modern Rounded', radius: '22px', desc: 'Standard MedERP' },
                            { id: 'pill', label: 'Ultra Curved', radius: '30px', desc: 'Soft & Friendly' },
                          ].map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() =>
                                setThemeConfig({
                                  ...themeConfig,
                                  border_radius_scale: item.id,
                                  card_radius: item.radius,
                                })
                              }
                              className={`p-3.5 border text-left transition-all ${
                                themeConfig.card_radius === item.radius
                                  ? 'bg-indigo-50 border-[#5B4BFF] text-[#5B4BFF] ring-2 ring-indigo-500/20'
                                  : 'bg-white border-[#E7EAF3] text-[#1B1E28] hover:bg-slate-50'
                              }`}
                              style={{ borderRadius: item.radius }}
                            >
                              <div className="font-bold text-xs">{item.label}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{item.desc} ({item.radius})</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-2">
                        <label className="text-xs font-bold text-[#1B1E28]">Table Rows Zebra Striping</label>
                        <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={themeConfig.table_zebra}
                            onChange={(e) => setThemeConfig({ ...themeConfig, table_zebra: e.target.checked })}
                            className="w-4 h-4 rounded text-[#5B4BFF] focus:ring-[#5B4BFF]"
                          />
                          <span className="text-xs font-medium text-[#1B1E28]">
                            Enable alternating table row zebra background
                          </span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: REAL-TIME INTERACTIVE PREVIEW PANE (5 COLS) */}
            <div className="lg:col-span-5 space-y-4 sticky top-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#1B1E28] uppercase tracking-wider">
                  Live Real-Time Preview
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  font: {themeConfig.font_family} | radius: {themeConfig.card_radius}
                </span>
              </div>

              {/* Mockup Canvas Container */}
              <div
                className="p-4 rounded-[24px] border border-[#E7EAF3] shadow-md space-y-3 overflow-hidden transition-all duration-300"
                style={{
                  backgroundColor: themeConfig.page_bg,
                  fontFamily: themeConfig.font_family,
                }}
              >
                {/* 1. Header Bar */}
                <div
                  className="px-3.5 py-2.5 rounded-xl text-white flex items-center justify-between shadow-sm transition-all duration-300"
                  style={{ backgroundColor: themeConfig.header_bg }}
                >
                  <div className="flex items-center gap-2">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-5 h-5 object-contain" />
                    ) : (
                      <span className="w-2 h-4 rounded-full" style={{ backgroundColor: themeConfig.accent_color }} />
                    )}
                    <span className="text-xs font-black truncate max-w-[170px]">
                      {currentFirm?.title || 'Medical University'}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/20">
                    Live UI
                  </span>
                </div>

                {/* 2. Mini Sidebar + Main Area */}
                <div className="flex gap-2.5">
                  {/* Mini Sidebar */}
                  <div
                    className="w-28 p-2.5 rounded-xl flex flex-col justify-between shrink-0 space-y-2 transition-all duration-300"
                    style={{
                      backgroundColor: themeConfig.sidebar_bg,
                      color: themeConfig.sidebar_text_color,
                    }}
                  >
                    <div className="space-y-1">
                      <div
                        className="px-2 py-1 rounded text-[10px] font-black text-white flex items-center gap-1 shadow-sm"
                        style={{ backgroundColor: themeConfig.primary_color }}
                      >
                        <span>📊</span>
                        <span>Overview</span>
                      </div>
                      <div className="px-2 py-1 text-[9px] font-medium opacity-80 flex items-center gap-1">
                        <span>👥</span>
                        <span>Students</span>
                      </div>
                      <div className="px-2 py-1 text-[9px] font-medium opacity-80 flex items-center gap-1">
                        <span>📋</span>
                        <span>Reports</span>
                      </div>
                    </div>
                    <div className="text-[7px] opacity-60 font-mono truncate">{currentFirm?.slug || 'tenant'}</div>
                  </div>

                  {/* Mini Cards & Form Area */}
                  <div className="flex-1 space-y-2 min-w-0">
                    {/* Sample Card */}
                    <div
                      className="p-3 border border-[#E7EAF3] shadow-sm transition-all duration-300"
                      style={{
                        backgroundColor: themeConfig.card_bg,
                        borderRadius: themeConfig.card_radius,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500">Active Students</span>
                        <span
                          className="w-4 h-4 rounded-full text-white flex items-center justify-center text-[8px] font-bold"
                          style={{ backgroundColor: themeConfig.success_color }}
                        >
                          ✓
                        </span>
                      </div>
                      <div className="text-base font-black text-[#1B1E28] mt-0.5">2,840</div>
                    </div>

                    {/* Sample Button Actions */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        className="py-1 px-2 rounded-lg text-white font-bold text-[10px] shadow-sm transition-all text-center"
                        style={{
                          backgroundColor: themeConfig.primary_color,
                          borderRadius: themeConfig.border_radius_scale === 'sharp' ? '4px' : '8px',
                        }}
                      >
                        Primary Action
                      </button>
                      <button
                        type="button"
                        className="py-1 px-2 rounded-lg text-white font-bold text-[10px] shadow-sm transition-all text-center"
                        style={{
                          backgroundColor: themeConfig.danger_color,
                          borderRadius: themeConfig.border_radius_scale === 'sharp' ? '4px' : '8px',
                        }}
                      >
                        Danger
                      </button>
                    </div>

                    {/* Sample Input Field */}
                    <div
                      className="p-2 border border-[#E7EAF3] shadow-sm space-y-1"
                      style={{
                        backgroundColor: themeConfig.card_bg,
                        borderRadius: themeConfig.card_radius,
                      }}
                    >
                      <div className="text-[9px] font-bold text-slate-600">Sample Form Input</div>
                      <input
                        type="text"
                        defaultValue="focus me..."
                        className="w-full px-2 py-1 text-[10px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                        style={{ borderColor: themeConfig.primary_color }}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Sample Modal Dialog Preview Trigger */}
                <div className="pt-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setPreviewModalOpen(!previewModalOpen)}
                    className="text-[10px] font-bold text-[#5B4BFF] hover:underline"
                  >
                    {previewModalOpen ? '▲ Hide Sample Modal' : '👁️ Toggle Sample Modal Preview'}
                  </button>
                </div>

                {previewModalOpen && (
                  <div
                    className="p-3.5 border border-[#E7EAF3] shadow-lg space-y-2 animate-fadeIn"
                    style={{
                      backgroundColor: themeConfig.card_bg,
                      borderRadius: themeConfig.card_radius,
                    }}
                  >
                    <div className="flex items-center justify-between border-b pb-1.5 border-slate-100">
                      <span className="text-xs font-black text-[#1B1E28]">Sample Confirmation Modal</span>
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: themeConfig.accent_color }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-600">
                      This is how popups and dialogs will render across {currentFirm?.title || 'the tenant portal'}.
                    </p>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        className="px-2 py-0.5 rounded text-[9px] font-bold text-slate-600 bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="px-2.5 py-0.5 rounded text-[9px] font-bold text-white shadow-sm"
                        style={{ backgroundColor: themeConfig.primary_color }}
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
