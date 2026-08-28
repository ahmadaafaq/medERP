'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import {
  CategoryThemeConfig,
  MASTER_THEME_STUDIO_DEFAULT,
} from '../../../components/theme/theme-studio.types';

interface FirmOption {
  id: string;
  slug: string;
  title: string;
  theme_color?: string;
  theme_config?: any;
  logo_url?: string;
  favicon_url?: string;
}

interface PresetSkin {
  id: string;
  name: string;
  description: string;
  swatches: string[];
  config: CategoryThemeConfig;
}

// ─── 6 MASTER DESIGNER SKINS ──────────────────────────────────────────────────
const MASTER_PRESET_SKINS: PresetSkin[] = [
  {
    id: 'minimal_light',
    name: 'Minimal Light & Slate',
    description: 'Clean Apple-like slate/white palette with crisp borders and soft shadows.',
    swatches: ['#0F172A', '#3B82F6', '#F8FAFC', '#FFFFFF'],
    config: {
      header: {
        bg_style: 'solid',
        bg_color: '#FFFFFF',
        text_color: '#0F172A',
        icon_color: '#0F172A',
        height: '64px',
        shadow: 'shadow-sm',
        logo_alignment: 'left',
      },
      sidebar: {
        bg_style: 'solid',
        bg_color: '#0F172A',
        text_color: '#F8FAFC',
        active_style: 'pill',
        active_bg: '#3B82F6',
        active_text: '#FFFFFF',
        hover_bg: 'rgba(255, 255, 255, 0.08)',
        icon_style: 'minimal',
        collapsed_mode: false,
      },
      buttons: {
        primary_bg: '#3B82F6',
        primary_text: '#FFFFFF',
        primary_radius: '10px',
        primary_shadow: 'shadow-md shadow-blue-500/20',
        secondary_bg: '#64748B',
        secondary_text: '#FFFFFF',
        danger_bg: '#EF4444',
        danger_text: '#FFFFFF',
        ghost_hover_bg: 'rgba(59, 130, 246, 0.08)',
        border_style: 'none',
      },
      cards: {
        bg_color: '#FFFFFF',
        border_style: 'border',
        border_color: '#E2E8F0',
        radius: '16px',
        shadow_depth: 'sm',
        padding_density: 'comfortable',
      },
      kanban: {
        column_header_style: 'filled',
        column_bg: '#F1F5F9',
        card_bg: '#FFFFFF',
        drag_handle_style: 'dots',
        column_accent_color: '#3B82F6',
        wip_badge_style: 'pill',
      },
      tables: {
        header_style: 'filled',
        header_bg: '#F8FAFC',
        header_text: '#0F172A',
        row_striping: true,
        row_hover_bg: '#F1F5F9',
        badge_style: 'soft',
        density: 'comfortable',
        accordion_border: true,
      },
      forms: {
        input_bg: '#FFFFFF',
        input_border: '#CBD5E1',
        focus_ring_color: '#3B82F6',
        focus_glow: true,
        label_position: 'top',
        dropdown_style: 'modern',
        error_color: '#EF4444',
        control_radius: '10px',
      },
      layout: {
        page_bg: '#F8FAFC',
        bg_pattern: 'flat',
        content_max_width: '1440px',
        spacing_scale: 'default',
        global_radius: '16px',
        font_family: 'Inter',
        base_font_size: '14px',
      },
    },
  },
  {
    id: 'glassmorphism_frost',
    name: 'Glassmorphism Frost',
    description: 'Deep violet backdrop, frosted translucent glass cards, and neon cyan rings.',
    swatches: ['#1E1B4B', '#6366F1', '#06B6D4', '#EEF2FF'],
    config: {
      header: {
        bg_style: 'glass-blur',
        bg_color: 'rgba(30, 27, 75, 0.85)',
        text_color: '#FFFFFF',
        icon_color: '#06B6D4',
        height: '68px',
        shadow: 'shadow-lg backdrop-blur-md',
        logo_alignment: 'left',
      },
      sidebar: {
        bg_style: 'gradient',
        bg_color: '#1E1B4B',
        gradient_to: '#312E81',
        text_color: '#E0E7FF',
        active_style: 'glow',
        active_bg: 'rgba(99, 102, 241, 0.35)',
        active_text: '#FFFFFF',
        hover_bg: 'rgba(255, 255, 255, 0.08)',
        icon_style: 'duotone',
        collapsed_mode: false,
      },
      buttons: {
        primary_bg: '#6366F1',
        primary_text: '#FFFFFF',
        primary_radius: '16px',
        primary_shadow: 'shadow-lg shadow-indigo-500/40 ring-2 ring-indigo-400/30',
        secondary_bg: '#06B6D4',
        secondary_text: '#FFFFFF',
        danger_bg: '#F43F5E',
        danger_text: '#FFFFFF',
        ghost_hover_bg: 'rgba(99, 102, 241, 0.15)',
        border_style: 'none',
      },
      cards: {
        bg_color: '#FFFFFF',
        border_style: 'glow',
        border_color: 'rgba(99, 102, 241, 0.25)',
        radius: '24px',
        shadow_depth: 'soft',
        padding_density: 'comfortable',
      },
      kanban: {
        column_header_style: 'accent-border',
        column_bg: '#EEF2FF',
        card_bg: '#FFFFFF',
        drag_handle_style: 'bars',
        column_accent_color: '#6366F1',
        wip_badge_style: 'solid',
      },
      tables: {
        header_style: 'bordered',
        header_bg: '#EEF2FF',
        header_text: '#1E1B4B',
        row_striping: false,
        row_hover_bg: '#F5F3FF',
        badge_style: 'outline',
        density: 'comfortable',
        accordion_border: true,
      },
      forms: {
        input_bg: '#FFFFFF',
        input_border: '#C7D2FE',
        focus_ring_color: '#6366F1',
        focus_glow: true,
        label_position: 'top',
        dropdown_style: 'modern',
        error_color: '#F43F5E',
        control_radius: '14px',
      },
      layout: {
        page_bg: '#F5F7FF',
        bg_pattern: 'mesh',
        content_max_width: '1440px',
        spacing_scale: 'relaxed',
        global_radius: '24px',
        font_family: 'Plus Jakarta Sans',
        base_font_size: '14px',
      },
    },
  },
  {
    id: 'bold_corporate',
    name: 'Bold Corporate & Royal Navy',
    description: 'Deep sapphire navy header & sidebar, crisp white cards, and vivid orange accents.',
    swatches: ['#2D2575', '#5B4BFF', '#F36C21', '#F6F8FC'],
    config: MASTER_THEME_STUDIO_DEFAULT,
  },
  {
    id: 'rounded_playful',
    name: 'Rounded Playful & Lilac',
    description: 'Vibrant violet & rose tones, ultra-curved pill buttons, and friendly rounded cards.',
    swatches: ['#7C3AED', '#EC4899', '#FDF2F8', '#FFFFFF'],
    config: {
      header: {
        bg_style: 'solid',
        bg_color: '#7C3AED',
        text_color: '#FFFFFF',
        icon_color: '#FDF2F8',
        height: '64px',
        shadow: 'shadow-md',
        logo_alignment: 'left',
      },
      sidebar: {
        bg_style: 'solid',
        bg_color: '#581C87',
        text_color: '#FAF5FF',
        active_style: 'pill',
        active_bg: '#EC4899',
        active_text: '#FFFFFF',
        hover_bg: 'rgba(255, 255, 255, 0.12)',
        icon_style: 'filled',
        collapsed_mode: false,
      },
      buttons: {
        primary_bg: '#7C3AED',
        primary_text: '#FFFFFF',
        primary_radius: '9999px',
        primary_shadow: 'shadow-lg shadow-purple-500/30',
        secondary_bg: '#EC4899',
        secondary_text: '#FFFFFF',
        danger_bg: '#E11D48',
        danger_text: '#FFFFFF',
        ghost_hover_bg: 'rgba(124, 58, 237, 0.10)',
        border_style: 'none',
      },
      cards: {
        bg_color: '#FFFFFF',
        border_style: 'borderless',
        border_color: '#F3E8FF',
        radius: '30px',
        shadow_depth: 'soft',
        padding_density: 'spacious',
      },
      kanban: {
        column_header_style: 'filled',
        column_bg: '#FAF5FF',
        card_bg: '#FFFFFF',
        drag_handle_style: 'dots',
        column_accent_color: '#EC4899',
        wip_badge_style: 'pill',
      },
      tables: {
        header_style: 'filled',
        header_bg: '#F3E8FF',
        header_text: '#581C87',
        row_striping: true,
        row_hover_bg: '#FAF5FF',
        badge_style: 'soft',
        density: 'comfortable',
        accordion_border: false,
      },
      forms: {
        input_bg: '#FAF5FF',
        input_border: '#E9D5FF',
        focus_ring_color: '#7C3AED',
        focus_glow: true,
        label_position: 'top',
        dropdown_style: 'modern',
        error_color: '#E11D48',
        control_radius: '18px',
      },
      layout: {
        page_bg: '#FAF5FF',
        bg_pattern: 'subtle-gradient',
        content_max_width: '1440px',
        spacing_scale: 'relaxed',
        global_radius: '30px',
        font_family: 'Outfit',
        base_font_size: '14px',
      },
    },
  },
  {
    id: 'clinical_emerald',
    name: 'Clinical Medical Emerald',
    description: 'Specialized healthcare & hospital aesthetic with deep jade green and soothing mint accents.',
    swatches: ['#064E3B', '#059669', '#10B981', '#F0FDF4'],
    config: {
      header: {
        bg_style: 'solid',
        bg_color: '#064E3B',
        text_color: '#FFFFFF',
        icon_color: '#A7F3D0',
        height: '64px',
        shadow: 'shadow-sm',
        logo_alignment: 'left',
      },
      sidebar: {
        bg_style: 'solid',
        bg_color: '#064E3B',
        text_color: '#ECFDF5',
        active_style: 'border-left',
        active_bg: 'rgba(16, 185, 129, 0.20)',
        active_text: '#FFFFFF',
        hover_bg: 'rgba(255, 255, 255, 0.08)',
        icon_style: 'minimal',
        collapsed_mode: false,
      },
      buttons: {
        primary_bg: '#059669',
        primary_text: '#FFFFFF',
        primary_radius: '12px',
        primary_shadow: 'shadow-md shadow-emerald-500/25',
        secondary_bg: '#0284C7',
        secondary_text: '#FFFFFF',
        danger_bg: '#E11D48',
        danger_text: '#FFFFFF',
        ghost_hover_bg: 'rgba(5, 150, 105, 0.08)',
        border_style: 'none',
      },
      cards: {
        bg_color: '#FFFFFF',
        border_style: 'border',
        border_color: '#D1FAE5',
        radius: '20px',
        shadow_depth: 'sm',
        padding_density: 'comfortable',
      },
      kanban: {
        column_header_style: 'accent-border',
        column_bg: '#F0FDF4',
        card_bg: '#FFFFFF',
        drag_handle_style: 'dots',
        column_accent_color: '#059669',
        wip_badge_style: 'pill',
      },
      tables: {
        header_style: 'filled',
        header_bg: '#ECFDF5',
        header_text: '#064E3B',
        row_striping: true,
        row_hover_bg: '#F0FDF4',
        badge_style: 'soft',
        density: 'comfortable',
        accordion_border: true,
      },
      forms: {
        input_bg: '#FFFFFF',
        input_border: '#A7F3D0',
        focus_ring_color: '#059669',
        focus_glow: true,
        label_position: 'top',
        dropdown_style: 'modern',
        error_color: '#E11D48',
        control_radius: '12px',
      },
      layout: {
        page_bg: '#F0FDF4',
        bg_pattern: 'flat',
        content_max_width: '1440px',
        spacing_scale: 'default',
        global_radius: '20px',
        font_family: 'Inter',
        base_font_size: '14px',
      },
    },
  },
  {
    id: 'dark_titanium',
    name: 'Dark Titanium & Obsidian',
    description: 'Sleek dark mode with obsidian glass surfaces, glowing cyan badges, and futuristic accents.',
    swatches: ['#090D16', '#38BDF8', '#1E293B', '#F8FAFC'],
    config: {
      header: {
        bg_style: 'solid',
        bg_color: '#0B0F19',
        text_color: '#F8FAFC',
        icon_color: '#38BDF8',
        height: '64px',
        shadow: 'shadow-lg border-b border-slate-800',
        logo_alignment: 'left',
      },
      sidebar: {
        bg_style: 'solid',
        bg_color: '#090D16',
        text_color: '#94A3B8',
        active_style: 'glow',
        active_bg: 'rgba(56, 189, 248, 0.15)',
        active_text: '#38BDF8',
        hover_bg: 'rgba(255, 255, 255, 0.05)',
        icon_style: 'minimal',
        collapsed_mode: false,
      },
      buttons: {
        primary_bg: '#38BDF8',
        primary_text: '#090D16',
        primary_radius: '12px',
        primary_shadow: 'shadow-lg shadow-sky-500/25',
        secondary_bg: '#64748B',
        secondary_text: '#FFFFFF',
        danger_bg: '#F43F5E',
        danger_text: '#FFFFFF',
        ghost_hover_bg: 'rgba(56, 189, 248, 0.10)',
        border_style: 'none',
      },
      cards: {
        bg_color: '#111827',
        border_style: 'border',
        border_color: '#1F2937',
        radius: '20px',
        shadow_depth: 'md',
        padding_density: 'comfortable',
      },
      kanban: {
        column_header_style: 'filled',
        column_bg: '#0F172A',
        card_bg: '#1E293B',
        drag_handle_style: 'dots',
        column_accent_color: '#38BDF8',
        wip_badge_style: 'solid',
      },
      tables: {
        header_style: 'filled',
        header_bg: '#1E293B',
        header_text: '#F8FAFC',
        row_striping: true,
        row_hover_bg: '#1E293B/50',
        badge_style: 'soft',
        density: 'comfortable',
        accordion_border: true,
      },
      forms: {
        input_bg: '#1E293B',
        input_border: '#334155',
        focus_ring_color: '#38BDF8',
        focus_glow: true,
        label_position: 'top',
        dropdown_style: 'modern',
        error_color: '#F43F5E',
        control_radius: '12px',
      },
      layout: {
        page_bg: '#0B0F19',
        bg_pattern: 'mesh',
        content_max_width: '1440px',
        spacing_scale: 'default',
        global_radius: '20px',
        font_family: 'Poppins',
        base_font_size: '14px',
      },
    },
  },
];

type CategoryKey = 'header' | 'sidebar' | 'buttons' | 'cards' | 'kanban' | 'tables' | 'forms' | 'layout';

export default function OwnerThemeStudioPage() {
  const [firms, setFirms] = useState<FirmOption[]>([]);
  const [selectedFirmId, setSelectedFirmId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [savingDraft, setSavingDraft] = useState<boolean>(false);
  const [publishing, setPublishing] = useState<boolean>(false);

  // Active Category & Theme Config
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('header');
  const [activeConfig, setActiveConfig] = useState<CategoryThemeConfig>(MASTER_THEME_STUDIO_DEFAULT);
  const [activeVersion, setActiveVersion] = useState<number>(1);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);

  // Modals & Feedback
  const [publishModalOpen, setPublishModalOpen] = useState<boolean>(false);
  const [confirmTenantNameInput, setConfirmTenantNameInput] = useState<string>('');
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Fetch firms on mount
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
        if (list.length > 0 && !selectedFirmId) {
          setSelectedFirmId(list[0].id);
          loadThemeData(list[0].id);
        }
      }
    } catch (e) {
      console.warn('Could not fetch firms list:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadThemeData = async (firmId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/owner/theme-studio/${firmId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.draft_theme) {
          setActiveConfig(data.draft_theme);
        } else if (data.published_theme) {
          setActiveConfig(data.published_theme);
        }
        setActiveVersion(data.tenant_info?.version || 1);
        setVersionHistory(data.version_history || []);
      }
    } catch (e) {
      console.error('Failed to load theme studio data:', e);
    } finally {
      setLoading(false);
    }
  };

  const currentFirm = firms.find((f) => f.id === selectedFirmId);

  // Switch college
  const handleSelectFirm = (firmId: string) => {
    setSelectedFirmId(firmId);
    loadThemeData(firmId);
  };

  // 1-Click Rapid Apply Master Skin
  const handleRapidApplyPreset = async (preset: PresetSkin) => {
    if (!selectedFirmId || !currentFirm) return;
    setActiveConfig(preset.config);

    try {
      setPublishing(true);
      const res = await fetch(`/api/owner/theme-studio/${selectedFirmId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme_config: preset.config,
          published_by: 'PLATFORM_OWNER',
          notes: `Rapid applied '${preset.name}' skin`,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Failed to publish preset');

      setActiveVersion(resData.version || activeVersion + 1);
      setFeedbackToast({
        type: 'success',
        message: `🚀 '${preset.name}' is now LIVE for ${currentFirm.title}!`,
      });
      setTimeout(() => setFeedbackToast(null), 5000);
      loadThemeData(selectedFirmId);
    } catch (e: any) {
      setFeedbackToast({ type: 'error', message: e.message || 'Failed to apply preset' });
    } finally {
      setPublishing(false);
    }
  };

  // Save as Draft
  const handleSaveDraft = async () => {
    if (!selectedFirmId || !currentFirm) return;
    setSavingDraft(true);

    try {
      const res = await fetch(`/api/owner/theme-studio/${selectedFirmId}/draft`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draft_config: activeConfig,
          updated_by: 'PLATFORM_OWNER',
        }),
      });

      if (!res.ok) throw new Error('Failed to save draft');

      setFeedbackToast({
        type: 'info',
        message: `💾 Draft saved for ${currentFirm.title}. Not yet published to live users.`,
      });
      setTimeout(() => setFeedbackToast(null), 4000);
    } catch (e: any) {
      setFeedbackToast({ type: 'error', message: e.message || 'Failed to save draft' });
    } finally {
      setSavingDraft(false);
    }
  };

  // Confirm Publish with Safety Check
  const handleConfirmPublish = async () => {
    if (!selectedFirmId || !currentFirm) return;

    if (confirmTenantNameInput.trim().toLowerCase() !== currentFirm.title.trim().toLowerCase()) {
      alert(`Tenant name confirmation mismatch. Please type '${currentFirm.title}' exactly.`);
      return;
    }

    setPublishing(true);
    setPublishModalOpen(false);

    try {
      const res = await fetch(`/api/owner/theme-studio/${selectedFirmId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme_config: activeConfig,
          published_by: 'PLATFORM_OWNER',
          notes: `Published via Theme Studio v${activeVersion + 1}`,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Failed to publish theme');

      setActiveVersion(resData.version || activeVersion + 1);
      setFeedbackToast({
        type: 'success',
        message: `✓ Successfully published Live Theme v${resData.version} to ${currentFirm.title}!`,
      });
      setConfirmTenantNameInput('');
      setTimeout(() => setFeedbackToast(null), 5000);
      loadThemeData(selectedFirmId);
    } catch (e: any) {
      setFeedbackToast({ type: 'error', message: e.message || 'Failed to publish theme' });
    } finally {
      setPublishing(false);
    }
  };

  // Rollback to historic version
  const handleRevertVersion = async (versionNumber: number) => {
    if (!selectedFirmId || !currentFirm) return;
    if (!confirm(`Are you sure you want to rollback ${currentFirm.title} to Version ${versionNumber}?`)) return;

    try {
      setPublishing(true);
      const res = await fetch(`/api/owner/theme-studio/${selectedFirmId}/revert/${versionNumber}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reverted_by: 'PLATFORM_OWNER' }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Failed to rollback');

      setFeedbackToast({
        type: 'success',
        message: `✓ Rolled back to Version ${versionNumber} for ${currentFirm.title}!`,
      });
      setHistoryDrawerOpen(false);
      setTimeout(() => setFeedbackToast(null), 5000);
      loadThemeData(selectedFirmId);
    } catch (e: any) {
      setFeedbackToast({ type: 'error', message: e.message || 'Failed to rollback' });
    } finally {
      setPublishing(false);
    }
  };

  // Navigation Items
  const CATEGORIES: { id: CategoryKey; label: string; icon: string; desc: string }[] = [
    { id: 'header', label: 'Header & Topbar', icon: '🔝', desc: 'Background style, height, shadow & alignment' },
    { id: 'sidebar', label: 'Navigation Sidebar', icon: '📑', desc: 'Active item glow, text color, hover states' },
    { id: 'buttons', label: 'Buttons & CTAs', icon: '🔘', desc: 'Primary, danger, ghost & corner radius' },
    { id: 'cards', label: 'Cards & Elevation', icon: '🃏', desc: 'Surface background, borders, radius & shadows' },
    { id: 'kanban', label: 'Kanban Board UI', icon: '📋', desc: 'Column header style, card drag handles & badges' },
    { id: 'tables', label: 'Data Tables', icon: '📊', desc: 'Header fill, row striping, status pills & density' },
    { id: 'forms', label: 'Forms & Inputs', icon: '📝', desc: 'Input borders, focus ring glow & control radius' },
    { id: 'layout', label: 'Pages & Global Layout', icon: '📐', desc: 'Background pattern, typography & max width' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#F6F8FC]">
      {/* Unthemed, Fixed Platform Owner Sidebar */}
      <Sidebar role="owner" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Unthemed, Fixed Platform Owner Header */}
        <Header title="MedERP Enterprise Theme Studio" />

        <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full space-y-6">
          {/* Top Title & Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-black text-[#F36C21] uppercase tracking-wider mb-1">
                <Link href="/dashboard/owner" className="hover:underline">
                  Owner Portal
                </Link>
                <span>/</span>
                <span>Visual Studio Suite</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#1B1E28] tracking-tight">
                Enterprise Theme Studio 🎨
              </h1>
              <p className="text-xs sm:text-sm text-[#4E5969] mt-0.5">
                Design, sandboxed-test, and publish component-level custom design systems for each college tenant.
              </p>
            </div>

            {/* Top Right Action Bar */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setHistoryDrawerOpen(true)}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-[#1B1E28] font-bold text-xs rounded-xl border border-[#E7EAF3] shadow-sm transition-all flex items-center gap-1.5"
              >
                <span>📜 Version History</span>
                <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-mono font-bold">
                  v{activeVersion}
                </span>
              </button>

              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={savingDraft || !selectedFirmId}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {savingDraft ? 'Saving Draft...' : '💾 Save as Draft'}
              </button>

              <button
                type="button"
                onClick={() => setPublishModalOpen(true)}
                disabled={publishing || !selectedFirmId}
                className="px-5 py-2 bg-[#5B4BFF] hover:bg-[#4838DF] text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-500/25 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {publishing ? 'Publishing...' : '🚀 Save & Publish Live'}
              </button>
            </div>
          </div>

          {/* Feedback Toast */}
          {feedbackToast && (
            <div
              className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between shadow-md animate-fade-in ${
                feedbackToast.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : feedbackToast.type === 'info'
                  ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              <span>{feedbackToast.message}</span>
              <button onClick={() => setFeedbackToast(null)} className="underline text-[10px]">
                Dismiss
              </button>
            </div>
          )}

          {/* ─── STEP 1: TARGET COLLEGE SELECTOR BAR ───────────────────────────── */}
          <div className="bg-white p-5 rounded-[22px] border border-[#E7EAF3] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {currentFirm?.logo_url ? (
                <img
                  src={currentFirm.logo_url}
                  alt={currentFirm.title}
                  className="w-12 h-12 rounded-xl object-contain border p-1 bg-white"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2D2575] to-[#5B4BFF] text-white font-black text-lg flex items-center justify-center shadow-sm">
                  {currentFirm?.title?.charAt(0) || 'U'}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-[#1B1E28] uppercase tracking-wider">
                    Target Institution (Tenant)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Live v{activeVersion}
                  </span>
                </div>
                <h2 className="text-base font-extrabold text-slate-900 mt-0.5">
                  {currentFirm?.title || 'Select a college below'}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedFirmId}
                onChange={(e) => handleSelectFirm(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 border border-[#E7EAF3] rounded-xl text-xs font-bold text-[#1B1E28] focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] min-w-[300px]"
              >
                {firms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.title} ({f.slug})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ─── RAPID APPLY PRESET SKINS GRID ─────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#1B1E28] uppercase tracking-wider">
                ⚡ 1-Click Master Designer Skins (Rapid Apply)
              </span>
              <span className="text-xs text-[#4E5969]">
                Clicking instantly applies & publishes the preset live to {currentFirm?.slug || 'tenant'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {MASTER_PRESET_SKINS.map((preset) => (
                <div
                  key={preset.id}
                  className="bg-white p-3.5 rounded-[18px] border border-[#E7EAF3] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-xs text-[#1B1E28] line-clamp-1">{preset.name}</h4>
                    </div>
                    <p className="text-[10px] text-[#4E5969] line-clamp-2">{preset.description}</p>
                  </div>

                  {/* Swatches Strip */}
                  <div className="flex items-center gap-1.5">
                    {preset.swatches.map((color, i) => (
                      <span
                        key={i}
                        className="w-5 h-5 rounded-full border border-black/10 shadow-inner shrink-0"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRapidApplyPreset(preset)}
                    className="w-full py-1.5 px-2 bg-slate-100 hover:bg-[#5B4BFF] hover:text-white text-[#1B1E28] font-black text-[11px] rounded-lg transition-all text-center shadow-sm active:scale-95"
                  >
                    🚀 Instant Apply
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ─── MAIN 2-COLUMN STUDIO: CONTROLS & LIVE PREVIEW ──────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT: CATEGORY NAVIGATOR & EDITORS (6 COLS) */}
            <div className="lg:col-span-6 space-y-5">
              
              {/* Category Selector Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      activeCategory === cat.id
                        ? 'bg-white border-[#5B4BFF] text-[#5B4BFF] shadow-sm ring-2 ring-indigo-500/10'
                        : 'bg-white/60 border-[#E7EAF3] text-[#4E5969] hover:bg-white'
                    }`}
                  >
                    <div className="text-base mb-1">{cat.icon}</div>
                    <div className="font-extrabold text-xs text-[#1B1E28] line-clamp-1">{cat.label}</div>
                  </button>
                ))}
              </div>

              {/* Dynamic Category Editor Box */}
              <div className="bg-white p-6 rounded-[22px] border border-[#E7EAF3] shadow-sm space-y-5">
                <div className="border-b border-[#E7EAF3] pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-[#1B1E28] uppercase tracking-wider">
                      {CATEGORIES.find((c) => c.id === activeCategory)?.label}
                    </h3>
                    <p className="text-xs text-[#4E5969] mt-0.5">
                      {CATEGORIES.find((c) => c.id === activeCategory)?.desc}
                    </p>
                  </div>
                </div>

                {/* 1. HEADER CONTROLS */}
                {activeCategory === 'header' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#1B1E28]">Background Style</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['solid', 'gradient', 'glass-blur'].map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() =>
                              setActiveConfig({
                                ...activeConfig,
                                header: { ...activeConfig.header, bg_style: st as any },
                              })
                            }
                            className={`py-2 rounded-xl text-xs font-bold border capitalize transition-all ${
                              activeConfig.header.bg_style === st
                                ? 'bg-[#5B4BFF] text-white border-[#5B4BFF]'
                                : 'bg-slate-50 border-[#E7EAF3] text-[#1B1E28]'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-1.5">
                        <label className="text-xs font-bold text-[#1B1E28]">Header Background Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={activeConfig.header.bg_color}
                            onChange={(e) =>
                              setActiveConfig({
                                ...activeConfig,
                                header: { ...activeConfig.header, bg_color: e.target.value },
                              })
                            }
                            className="w-9 h-8 p-0.5 rounded-lg border cursor-pointer"
                          />
                          <input
                            type="text"
                            value={activeConfig.header.bg_color}
                            onChange={(e) =>
                              setActiveConfig({
                                ...activeConfig,
                                header: { ...activeConfig.header, bg_color: e.target.value },
                              })
                            }
                            className="flex-1 px-2.5 py-1 bg-white border border-[#E7EAF3] rounded-lg text-xs font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-1.5">
                        <label className="text-xs font-bold text-[#1B1E28]">Header Text & Icons</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={activeConfig.header.text_color}
                            onChange={(e) =>
                              setActiveConfig({
                                ...activeConfig,
                                header: {
                                  ...activeConfig.header,
                                  text_color: e.target.value,
                                  icon_color: e.target.value,
                                },
                              })
                            }
                            className="w-9 h-8 p-0.5 rounded-lg border cursor-pointer"
                          />
                          <input
                            type="text"
                            value={activeConfig.header.text_color}
                            onChange={(e) =>
                              setActiveConfig({
                                ...activeConfig,
                                header: {
                                  ...activeConfig.header,
                                  text_color: e.target.value,
                                  icon_color: e.target.value,
                                },
                              })
                            }
                            className="flex-1 px-2.5 py-1 bg-white border border-[#E7EAF3] rounded-lg text-xs font-mono font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. SIDEBAR CONTROLS */}
                {activeCategory === 'sidebar' && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#1B1E28]">Active Item Highlight Style</label>
                      <div className="grid grid-cols-4 gap-2">
                        {['border-left', 'pill', 'glow', 'underline'].map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() =>
                              setActiveConfig({
                                ...activeConfig,
                                sidebar: { ...activeConfig.sidebar, active_style: st as any },
                              })
                            }
                            className={`py-2 rounded-xl text-xs font-bold border capitalize transition-all ${
                              activeConfig.sidebar.active_style === st
                                ? 'bg-[#5B4BFF] text-white border-[#5B4BFF]'
                                : 'bg-slate-50 border-[#E7EAF3] text-[#1B1E28]'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-1.5">
                        <label className="text-xs font-bold text-[#1B1E28]">Sidebar Background</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={activeConfig.sidebar.bg_color}
                            onChange={(e) =>
                              setActiveConfig({
                                ...activeConfig,
                                sidebar: { ...activeConfig.sidebar, bg_color: e.target.value },
                              })
                            }
                            className="w-9 h-8 p-0.5 rounded-lg border cursor-pointer"
                          />
                          <input
                            type="text"
                            value={activeConfig.sidebar.bg_color}
                            onChange={(e) =>
                              setActiveConfig({
                                ...activeConfig,
                                sidebar: { ...activeConfig.sidebar, bg_color: e.target.value },
                              })
                            }
                            className="flex-1 px-2.5 py-1 bg-white border border-[#E7EAF3] rounded-lg text-xs font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-1.5">
                        <label className="text-xs font-bold text-[#1B1E28]">Active Item Background</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={activeConfig.sidebar.active_bg.startsWith('#') ? activeConfig.sidebar.active_bg : '#5B4BFF'}
                            onChange={(e) =>
                              setActiveConfig({
                                ...activeConfig,
                                sidebar: { ...activeConfig.sidebar, active_bg: e.target.value },
                              })
                            }
                            className="w-9 h-8 p-0.5 rounded-lg border cursor-pointer"
                          />
                          <input
                            type="text"
                            value={activeConfig.sidebar.active_bg}
                            onChange={(e) =>
                              setActiveConfig({
                                ...activeConfig,
                                sidebar: { ...activeConfig.sidebar, active_bg: e.target.value },
                              })
                            }
                            className="flex-1 px-2.5 py-1 bg-white border border-[#E7EAF3] rounded-lg text-xs font-mono font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. BUTTONS CONTROLS */}
                {activeCategory === 'buttons' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-1.5">
                        <label className="text-xs font-bold text-[#1B1E28]">Primary Button Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={activeConfig.buttons.primary_bg}
                            onChange={(e) =>
                              setActiveConfig({
                                ...activeConfig,
                                buttons: { ...activeConfig.buttons, primary_bg: e.target.value },
                              })
                            }
                            className="w-9 h-8 p-0.5 rounded-lg border cursor-pointer"
                          />
                          <input
                            type="text"
                            value={activeConfig.buttons.primary_bg}
                            onChange={(e) =>
                              setActiveConfig({
                                ...activeConfig,
                                buttons: { ...activeConfig.buttons, primary_bg: e.target.value },
                              })
                            }
                            className="flex-1 px-2.5 py-1 bg-white border border-[#E7EAF3] rounded-lg text-xs font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-1.5">
                        <label className="text-xs font-bold text-[#1B1E28]">Danger / Destructive Action</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={activeConfig.buttons.danger_bg}
                            onChange={(e) =>
                              setActiveConfig({
                                ...activeConfig,
                                buttons: { ...activeConfig.buttons, danger_bg: e.target.value },
                              })
                            }
                            className="w-9 h-8 p-0.5 rounded-lg border cursor-pointer"
                          />
                          <input
                            type="text"
                            value={activeConfig.buttons.danger_bg}
                            onChange={(e) =>
                              setActiveConfig({
                                ...activeConfig,
                                buttons: { ...activeConfig.buttons, danger_bg: e.target.value },
                              })
                            }
                            className="flex-1 px-2.5 py-1 bg-white border border-[#E7EAF3] rounded-lg text-xs font-mono font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#1B1E28]">Button Corner Radius</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Sharp (4px)', val: '4px' },
                          { label: 'Rounded (14px)', val: '14px' },
                          { label: 'Pill (9999px)', val: '9999px' },
                        ].map((item) => (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() =>
                              setActiveConfig({
                                ...activeConfig,
                                buttons: { ...activeConfig.buttons, primary_radius: item.val },
                              })
                            }
                            className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                              activeConfig.buttons.primary_radius === item.val
                                ? 'bg-[#5B4BFF] text-white border-[#5B4BFF]'
                                : 'bg-slate-50 border-[#E7EAF3] text-[#1B1E28]'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. CARDS & ELEVATION */}
                {activeCategory === 'cards' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {['border', 'borderless', 'glow'].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() =>
                            setActiveConfig({
                              ...activeConfig,
                              cards: { ...activeConfig.cards, border_style: st as any },
                            })
                          }
                          className={`py-2 rounded-xl text-xs font-bold border capitalize transition-all ${
                            activeConfig.cards.border_style === st
                              ? 'bg-[#5B4BFF] text-white border-[#5B4BFF]'
                              : 'bg-slate-50 border-[#E7EAF3] text-[#1B1E28]'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-1.5">
                        <label className="text-xs font-bold text-[#1B1E28]">Card Surface Background</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={activeConfig.cards.bg_color}
                            onChange={(e) =>
                              setActiveConfig({
                                ...activeConfig,
                                cards: { ...activeConfig.cards, bg_color: e.target.value },
                              })
                            }
                            className="w-9 h-8 p-0.5 rounded-lg border cursor-pointer"
                          />
                          <input
                            type="text"
                            value={activeConfig.cards.bg_color}
                            onChange={(e) =>
                              setActiveConfig({
                                ...activeConfig,
                                cards: { ...activeConfig.cards, bg_color: e.target.value },
                              })
                            }
                            className="flex-1 px-2.5 py-1 bg-white border border-[#E7EAF3] rounded-lg text-xs font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-1.5">
                        <label className="text-xs font-bold text-[#1B1E28]">Card Radius ({activeConfig.cards.radius})</label>
                        <input
                          type="range"
                          min="0"
                          max="32"
                          value={parseInt(activeConfig.cards.radius, 10) || 22}
                          onChange={(e) =>
                            setActiveConfig({
                              ...activeConfig,
                              cards: { ...activeConfig.cards, radius: `${e.target.value}px` },
                            })
                          }
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. KANBAN BOARD */}
                {activeCategory === 'kanban' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-1.5">
                        <label className="text-xs font-bold text-[#1B1E28]">Column Highlight Accent</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={activeConfig.kanban.column_accent_color}
                            onChange={(e) =>
                              setActiveConfig({
                                ...activeConfig,
                                kanban: { ...activeConfig.kanban, column_accent_color: e.target.value },
                              })
                            }
                            className="w-9 h-8 p-0.5 rounded-lg border cursor-pointer"
                          />
                          <input
                            type="text"
                            value={activeConfig.kanban.column_accent_color}
                            onChange={(e) =>
                              setActiveConfig({
                                ...activeConfig,
                                kanban: { ...activeConfig.kanban, column_accent_color: e.target.value },
                              })
                            }
                            className="flex-1 px-2.5 py-1 bg-white border border-[#E7EAF3] rounded-lg text-xs font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-1.5">
                        <label className="text-xs font-bold text-[#1B1E28]">Column Background</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={activeConfig.kanban.column_bg}
                            onChange={(e) =>
                              setActiveConfig({
                                ...activeConfig,
                                kanban: { ...activeConfig.kanban, column_bg: e.target.value },
                              })
                            }
                            className="w-9 h-8 p-0.5 rounded-lg border cursor-pointer"
                          />
                          <input
                            type="text"
                            value={activeConfig.kanban.column_bg}
                            onChange={(e) =>
                              setActiveConfig({
                                ...activeConfig,
                                kanban: { ...activeConfig.kanban, column_bg: e.target.value },
                              })
                            }
                            className="flex-1 px-2.5 py-1 bg-white border border-[#E7EAF3] rounded-lg text-xs font-mono font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. DATA TABLES */}
                {activeCategory === 'tables' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-[#E7EAF3]">
                      <span className="text-xs font-bold text-[#1B1E28]">Zebra Row Striping</span>
                      <input
                        type="checkbox"
                        checked={activeConfig.tables.row_striping}
                        onChange={(e) =>
                          setActiveConfig({
                            ...activeConfig,
                            tables: { ...activeConfig.tables, row_striping: e.target.checked },
                          })
                        }
                        className="w-4 h-4 rounded text-[#5B4BFF] focus:ring-[#5B4BFF]"
                      />
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-1.5">
                      <label className="text-xs font-bold text-[#1B1E28]">Table Header Background</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={activeConfig.tables.header_bg}
                          onChange={(e) =>
                            setActiveConfig({
                              ...activeConfig,
                              tables: { ...activeConfig.tables, header_bg: e.target.value },
                            })
                          }
                          className="w-9 h-8 p-0.5 rounded-lg border cursor-pointer"
                        />
                        <input
                          type="text"
                          value={activeConfig.tables.header_bg}
                          onChange={(e) =>
                            setActiveConfig({
                              ...activeConfig,
                              tables: { ...activeConfig.tables, header_bg: e.target.value },
                            })
                          }
                          className="flex-1 px-2.5 py-1 bg-white border border-[#E7EAF3] rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. FORMS & INPUTS */}
                {activeCategory === 'forms' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-1.5">
                        <label className="text-xs font-bold text-[#1B1E28]">Focus Ring & Glow Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={activeConfig.forms.focus_ring_color}
                            onChange={(e) =>
                              setActiveConfig({
                                ...activeConfig,
                                forms: { ...activeConfig.forms, focus_ring_color: e.target.value },
                              })
                            }
                            className="w-9 h-8 p-0.5 rounded-lg border cursor-pointer"
                          />
                          <input
                            type="text"
                            value={activeConfig.forms.focus_ring_color}
                            onChange={(e) =>
                              setActiveConfig({
                                ...activeConfig,
                                forms: { ...activeConfig.forms, focus_ring_color: e.target.value },
                              })
                            }
                            className="flex-1 px-2.5 py-1 bg-white border border-[#E7EAF3] rounded-lg text-xs font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-1.5">
                        <label className="text-xs font-bold text-[#1B1E28]">Validation Error Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={activeConfig.forms.error_color}
                            onChange={(e) =>
                              setActiveConfig({
                                ...activeConfig,
                                forms: { ...activeConfig.forms, error_color: e.target.value },
                              })
                            }
                            className="w-9 h-8 p-0.5 rounded-lg border cursor-pointer"
                          />
                          <input
                            type="text"
                            value={activeConfig.forms.error_color}
                            onChange={(e) =>
                              setActiveConfig({
                                ...activeConfig,
                                forms: { ...activeConfig.forms, error_color: e.target.value },
                              })
                            }
                            className="flex-1 px-2.5 py-1 bg-white border border-[#E7EAF3] rounded-lg text-xs font-mono font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 8. PAGES & GLOBAL LAYOUT */}
                {activeCategory === 'layout' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-1.5">
                        <label className="text-xs font-bold text-[#1B1E28]">Page Canvas Background</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={activeConfig.layout.page_bg}
                            onChange={(e) =>
                              setActiveConfig({
                                ...activeConfig,
                                layout: { ...activeConfig.layout, page_bg: e.target.value },
                              })
                            }
                            className="w-9 h-8 p-0.5 rounded-lg border cursor-pointer"
                          />
                          <input
                            type="text"
                            value={activeConfig.layout.page_bg}
                            onChange={(e) =>
                              setActiveConfig({
                                ...activeConfig,
                                layout: { ...activeConfig.layout, page_bg: e.target.value },
                              })
                            }
                            className="flex-1 px-2.5 py-1 bg-white border border-[#E7EAF3] rounded-lg text-xs font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-[#E7EAF3] space-y-1.5">
                        <label className="text-xs font-bold text-[#1B1E28]">Primary Typography</label>
                        <select
                          value={activeConfig.layout.font_family}
                          onChange={(e) =>
                            setActiveConfig({
                              ...activeConfig,
                              layout: { ...activeConfig.layout, font_family: e.target.value },
                            })
                          }
                          className="w-full px-2.5 py-1 bg-white border border-[#E7EAF3] rounded-lg text-xs font-bold"
                        >
                          {['Inter', 'Plus Jakarta Sans', 'Outfit', 'Roboto', 'Poppins', 'IBM Plex Sans'].map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: SANDBOXED LIVE PREVIEW CANVAS (6 COLS) */}
            <div className="lg:col-span-6 space-y-4 sticky top-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#1B1E28] uppercase tracking-wider">
                  🛡️ Sandboxed Live Preview (Real Components)
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Target: {currentFirm?.title || 'Tenant'}
                </span>
              </div>

              {/* Sandboxed Container */}
              <div
                className="p-5 rounded-[26px] border border-[#E7EAF3] shadow-lg space-y-4 overflow-hidden transition-all duration-300"
                style={{
                  backgroundColor: activeConfig.layout.page_bg,
                  fontFamily: activeConfig.layout.font_family,
                }}
              >
                {/* 1. Sandboxed Header */}
                <div
                  className="px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm transition-all"
                  style={{
                    backgroundColor: activeConfig.header.bg_color,
                    color: activeConfig.header.text_color,
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    {currentFirm?.logo_url ? (
                      <img src={currentFirm.logo_url} alt="Logo" className="w-6 h-6 object-contain" />
                    ) : (
                      <span
                        className="w-2.5 h-5 rounded-full"
                        style={{ backgroundColor: activeConfig.buttons.primary_bg }}
                      />
                    )}
                    <span className="text-xs font-extrabold truncate max-w-[200px]">
                      {currentFirm?.title || 'Medical University'}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/20">
                    Live UI Preview
                  </span>
                </div>

                {/* 2. Sandboxed Sidebar + Cards Layout */}
                <div className="flex gap-3">
                  {/* Mini Sidebar */}
                  <div
                    className="w-32 p-3 rounded-2xl flex flex-col justify-between shrink-0 space-y-2 transition-all"
                    style={{
                      backgroundColor: activeConfig.sidebar.bg_color,
                      color: activeConfig.sidebar.text_color,
                    }}
                  >
                    <div className="space-y-1.5">
                      <div
                        className="px-2.5 py-1.5 rounded-xl text-[11px] font-black text-white flex items-center gap-1.5 shadow-sm"
                        style={{
                          backgroundColor: activeConfig.sidebar.active_bg,
                          color: activeConfig.sidebar.active_text,
                          borderLeft:
                            activeConfig.sidebar.active_style === 'border-left'
                              ? `3px solid ${activeConfig.buttons.primary_bg}`
                              : 'none',
                        }}
                      >
                        <span>📊</span>
                        <span>Dashboard</span>
                      </div>
                      <div className="px-2 py-1 text-[10px] opacity-80 flex items-center gap-1.5">
                        <span>👥</span>
                        <span>Students</span>
                      </div>
                      <div className="px-2 py-1 text-[10px] opacity-80 flex items-center gap-1.5">
                        <span>📈</span>
                        <span>Analytics</span>
                      </div>
                    </div>
                    <span className="text-[8px] opacity-60 font-mono">{currentFirm?.slug || 'tenant'}</span>
                  </div>

                  {/* Right: Metric Cards & Buttons */}
                  <div className="flex-1 space-y-3 min-w-0">
                    {/* Metric Card */}
                    <div
                      className="p-3.5 border shadow-sm transition-all"
                      style={{
                        backgroundColor: activeConfig.cards.bg_color,
                        borderRadius: activeConfig.cards.radius,
                        borderColor: activeConfig.cards.border_color,
                      }}
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                        <span>Total Active Enrollments</span>
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: activeConfig.buttons.primary_bg }}
                        />
                      </div>
                      <div className="text-xl font-black text-[#1B1E28] mt-1">4,920</div>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        className="py-1.5 px-2 text-white font-bold text-xs shadow-sm transition-all text-center"
                        style={{
                          backgroundColor: activeConfig.buttons.primary_bg,
                          borderRadius: activeConfig.buttons.primary_radius,
                        }}
                      >
                        Primary Action
                      </button>
                      <button
                        type="button"
                        className="py-1.5 px-2 text-white font-bold text-xs shadow-sm transition-all text-center"
                        style={{
                          backgroundColor: activeConfig.buttons.danger_bg,
                          borderRadius: activeConfig.buttons.primary_radius,
                        }}
                      >
                        Danger
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Mini Kanban Board Preview */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Kanban Task Board
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {['Backlog (4)', 'In Progress (2)', 'Done (9)'].map((col, idx) => (
                      <div
                        key={col}
                        className="p-2.5 rounded-xl border border-slate-200/60 space-y-1.5"
                        style={{ backgroundColor: activeConfig.kanban.column_bg }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-700">{col}</span>
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: idx === 1 ? activeConfig.kanban.column_accent_color : '#94A3B8' }}
                          />
                        </div>
                        <div
                          className="p-2 rounded-lg text-[10px] font-medium border border-slate-200/70 shadow-sm"
                          style={{ backgroundColor: activeConfig.kanban.card_bg }}
                        >
                          Task #{idx + 101}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Mini Data Table Preview */}
                <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                  <table className="w-full text-left text-[11px]">
                    <thead
                      style={{
                        backgroundColor: activeConfig.tables.header_bg,
                        color: activeConfig.tables.header_text,
                      }}
                      className="font-bold"
                    >
                      <tr>
                        <th className="p-2">Name</th>
                        <th className="p-2">Role</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      <tr className={activeConfig.tables.row_striping ? 'bg-slate-50/70' : ''}>
                        <td className="p-2 font-bold text-slate-800">Aafreen Khan</td>
                        <td className="p-2 text-slate-500">Student</td>
                        <td className="p-2">
                          <span
                            className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white"
                            style={{ backgroundColor: activeConfig.buttons.primary_bg }}
                          >
                            Active
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-slate-800">Dr. Rajesh Verma</td>
                        <td className="p-2 text-slate-500">Faculty</td>
                        <td className="p-2">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                            Verified
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 5. Mini Form Input with Focus Glow */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-600">Sample Form Input</span>
                  <input
                    type="text"
                    defaultValue="Interactive focus ring..."
                    className="w-full px-3 py-1.5 text-xs bg-white border rounded-xl focus:outline-none"
                    style={{
                      borderColor: activeConfig.forms.focus_ring_color,
                      borderRadius: activeConfig.forms.control_radius,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ─── CONFIRMATION PUBLISH MODAL (SAFETY CHECK) ──────────────────────── */}
          {publishModalOpen && currentFirm && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-[28px] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-[#5B4BFF]/10 text-[#5B4BFF]">
                    <span className="text-2xl">🛡️</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      Confirm Live Theme Publish
                    </h3>
                    <p className="text-xs text-slate-500">
                      Safety Verification: Prevent accidental publish to the wrong college.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                  <p className="font-bold">You are about to publish Theme v{activeVersion + 1} to:</p>
                  <p className="font-extrabold text-sm">{currentFirm.title}</p>
                  <p className="text-[11px] text-amber-700 font-mono">slug: {currentFirm.slug}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    To confirm, please type <span className="font-mono font-black text-slate-900">{currentFirm.title}</span> below:
                  </label>
                  <input
                    type="text"
                    value={confirmTenantNameInput}
                    onChange={(e) => setConfirmTenantNameInput(e.target.value)}
                    placeholder={currentFirm.title}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPublishModalOpen(false);
                      setConfirmTenantNameInput('');
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmPublish}
                    disabled={
                      publishing ||
                      confirmTenantNameInput.trim().toLowerCase() !== currentFirm.title.trim().toLowerCase()
                    }
                    className="px-5 py-2 bg-[#5B4BFF] hover:bg-[#4838DF] text-white font-black text-xs rounded-xl shadow-md transition-all disabled:opacity-40"
                  >
                    {publishing ? 'Publishing...' : 'Confirm & Publish Live'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── VERSION HISTORY & ROLLBACK DRAWER ─────────────────────────────── */}
          {historyDrawerOpen && currentFirm && (
            <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
              <div className="w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto flex flex-col justify-between border-l border-slate-200">
                <div>
                  <div className="p-6 bg-[#2D2575] text-white flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black tracking-tight">Theme Version History</h3>
                      <p className="text-xs text-indigo-200">{currentFirm.title}</p>
                    </div>
                    <button
                      onClick={() => setHistoryDrawerOpen(false)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    {versionHistory.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No previous snapshots recorded yet.</p>
                    ) : (
                      versionHistory.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 hover:border-[#5B4BFF] transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs text-slate-900">
                              Version {item.version}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(item.published_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium">{item.notes || 'Published snapshot'}</p>
                          <button
                            type="button"
                            onClick={() => handleRevertVersion(item.version)}
                            className="mt-2 text-xs font-bold text-[#5B4BFF] hover:underline flex items-center gap-1"
                          >
                            ↺ Revert {currentFirm.title} to this version
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
