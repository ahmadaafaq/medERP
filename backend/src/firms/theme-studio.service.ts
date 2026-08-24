import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface CategoryThemeConfig {
  header: {
    bg_style: 'solid' | 'gradient' | 'glass-blur' | string;
    bg_color: string;
    gradient_to?: string;
    text_color: string;
    icon_color: string;
    height: string;
    shadow: string;
    logo_alignment: 'left' | 'center' | 'right' | string;
  };
  sidebar: {
    bg_style: 'solid' | 'gradient' | 'glass-blur' | string;
    bg_color: string;
    gradient_to?: string;
    text_color: string;
    active_style: 'pill' | 'glow' | 'underline' | 'border-left' | string;
    active_bg: string;
    active_text: string;
    hover_bg: string;
    icon_style: 'minimal' | 'filled' | 'duotone' | string;
    collapsed_mode: boolean;
  };
  buttons: {
    primary_bg: string;
    primary_text: string;
    primary_radius: string;
    primary_shadow: string;
    secondary_bg: string;
    secondary_text: string;
    danger_bg: string;
    danger_text: string;
    ghost_hover_bg: string;
    border_style: 'none' | 'subtle' | 'bold' | string;
  };
  cards: {
    bg_color: string;
    border_style: 'border' | 'borderless' | 'glow' | string;
    border_color: string;
    radius: string;
    shadow_depth: 'none' | 'sm' | 'md' | 'lg' | 'soft' | string;
    padding_density: 'compact' | 'comfortable' | 'spacious' | string;
  };
  kanban: {
    column_header_style: 'filled' | 'minimal' | 'accent-border' | string;
    column_bg: string;
    card_bg: string;
    drag_handle_style: 'dots' | 'bars' | 'none' | string;
    column_accent_color: string;
    wip_badge_style: 'pill' | 'minimal' | 'solid' | string;
  };
  tables: {
    header_style: 'filled' | 'bordered' | 'minimal' | string;
    header_bg: string;
    header_text: string;
    row_striping: boolean;
    row_hover_bg: string;
    badge_style: 'soft' | 'solid' | 'outline' | string;
    density: 'compact' | 'comfortable' | string;
    accordion_border: boolean;
  };
  forms: {
    input_bg: string;
    input_border: string;
    focus_ring_color: string;
    focus_glow: boolean;
    label_position: 'top' | 'floating' | string;
    dropdown_style: 'modern' | 'minimal' | 'bordered' | string;
    error_color: string;
    control_radius: string;
  };
  layout: {
    page_bg: string;
    bg_pattern: 'flat' | 'subtle-gradient' | 'mesh' | string;
    content_max_width: string;
    spacing_scale: 'compact' | 'default' | 'relaxed' | string;
    global_radius: string;
    font_family: string;
    base_font_size: string;
  };
}

export const MASTER_THEME_STUDIO_DEFAULT: CategoryThemeConfig = {
  header: {
    bg_style: 'solid',
    bg_color: '#2D2575',
    gradient_to: '#1E1757',
    text_color: '#FFFFFF',
    icon_color: '#FFFFFF',
    height: '64px',
    shadow: 'shadow-sm',
    logo_alignment: 'left',
  },
  sidebar: {
    bg_style: 'solid',
    bg_color: '#2D2575',
    gradient_to: '#1E1757',
    text_color: '#FFFFFF',
    active_style: 'border-left',
    active_bg: 'rgba(255, 255, 255, 0.15)',
    active_text: '#FFFFFF',
    hover_bg: 'rgba(255, 255, 255, 0.10)',
    icon_style: 'minimal',
    collapsed_mode: false,
  },
  buttons: {
    primary_bg: '#5B4BFF',
    primary_text: '#FFFFFF',
    primary_radius: '14px',
    primary_shadow: 'shadow-lg shadow-indigo-500/25',
    secondary_bg: '#7867FF',
    secondary_text: '#FFFFFF',
    danger_bg: '#F04438',
    danger_text: '#FFFFFF',
    ghost_hover_bg: 'rgba(91, 75, 255, 0.08)',
    border_style: 'none',
  },
  cards: {
    bg_color: '#FFFFFF',
    border_style: 'border',
    border_color: '#E7EAF3',
    radius: '22px',
    shadow_depth: 'soft',
    padding_density: 'comfortable',
  },
  kanban: {
    column_header_style: 'filled',
    column_bg: '#F1F4F9',
    card_bg: '#FFFFFF',
    drag_handle_style: 'dots',
    column_accent_color: '#5B4BFF',
    wip_badge_style: 'pill',
  },
  tables: {
    header_style: 'filled',
    header_bg: '#F8FAFC',
    header_text: '#1B1E28',
    row_striping: true,
    row_hover_bg: '#F8FAFC',
    badge_style: 'soft',
    density: 'comfortable',
    accordion_border: true,
  },
  forms: {
    input_bg: '#FFFFFF',
    input_border: '#E7EAF3',
    focus_ring_color: '#5B4BFF',
    focus_glow: true,
    label_position: 'top',
    dropdown_style: 'modern',
    error_color: '#F04438',
    control_radius: '12px',
  },
  layout: {
    page_bg: '#F6F8FC',
    bg_pattern: 'flat',
    content_max_width: '1440px',
    spacing_scale: 'default',
    global_radius: '22px',
    font_family: 'Inter',
    base_font_size: '14px',
  },
};

@Injectable()
export class ThemeStudioService {
  private readonly logger = new Logger(ThemeStudioService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  private async resolveFirm(idOrSlug: string) {
    if (!idOrSlug) return null;
    const isUuid = idOrSlug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    const cleanSlug = idOrSlug.toLowerCase().trim().replace(/^tenant_/, '').replace(/^tenant-/, '');

    const rows = isUuid
      ? await this.dataSource.query(`SELECT * FROM public.firms WHERE id = $1 LIMIT 1`, [idOrSlug])
      : await this.dataSource.query(`SELECT * FROM public.firms WHERE LOWER(slug) = $1 LIMIT 1`, [cleanSlug]);

    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Load current draft, published theme, and version history for a tenant
   */
  async getThemeStudioData(idOrSlug: string) {
    const firm = await this.resolveFirm(idOrSlug);
    if (!firm) {
      throw new NotFoundException(`Tenant firm '${idOrSlug}' not found.`);
    }

    const publishedConfig = firm.theme_config || {};
    const publishedThemeStudio = publishedConfig.theme_studio || {
      ...MASTER_THEME_STUDIO_DEFAULT,
      header: {
        ...MASTER_THEME_STUDIO_DEFAULT.header,
        bg_color: publishedConfig.header_bg || publishedConfig.sidebar_bg || MASTER_THEME_STUDIO_DEFAULT.header.bg_color,
      },
      sidebar: {
        ...MASTER_THEME_STUDIO_DEFAULT.sidebar,
        bg_color: publishedConfig.sidebar_bg || MASTER_THEME_STUDIO_DEFAULT.sidebar.bg_color,
      },
      buttons: {
        ...MASTER_THEME_STUDIO_DEFAULT.buttons,
        primary_bg: publishedConfig.primary_color || MASTER_THEME_STUDIO_DEFAULT.buttons.primary_bg,
      },
      layout: {
        ...MASTER_THEME_STUDIO_DEFAULT.layout,
        page_bg: publishedConfig.page_bg || MASTER_THEME_STUDIO_DEFAULT.layout.page_bg,
        global_radius: publishedConfig.card_radius || MASTER_THEME_STUDIO_DEFAULT.layout.global_radius,
        font_family: publishedConfig.font_family || MASTER_THEME_STUDIO_DEFAULT.layout.font_family,
      },
    };

    // Load draft
    const draftRows = await this.dataSource.query(
      `SELECT * FROM public.tenant_theme_drafts WHERE tenant_id = $1 LIMIT 1`,
      [firm.id],
    );

    const draftConfig = draftRows.length > 0 && draftRows[0].draft_config
      ? draftRows[0].draft_config
      : publishedThemeStudio;

    // Load history
    const historyRows = await this.dataSource.query(
      `SELECT id, version, published_by, published_at, notes, theme_config
       FROM public.tenant_theme_history
       WHERE tenant_id = $1
       ORDER BY version DESC LIMIT 20`,
      [firm.id],
    );

    return {
      tenant_info: {
        id: firm.id,
        slug: firm.slug,
        title: firm.title,
        logo_url: firm.logo_url,
        favicon_url: firm.favicon_url,
        version: publishedConfig.version || 1,
      },
      published_theme: publishedThemeStudio,
      draft_theme: draftConfig,
      version_history: historyRows,
    };
  }

  /**
   * Autosave draft
   */
  async saveDraft(idOrSlug: string, draftConfig: any, updatedBy: string = 'OWNER') {
    const firm = await this.resolveFirm(idOrSlug);
    if (!firm) {
      throw new NotFoundException(`Tenant firm '${idOrSlug}' not found.`);
    }

    await this.dataSource.query(
      `INSERT INTO public.tenant_theme_drafts (tenant_id, tenant_slug, draft_config, updated_by, updated_at)
       VALUES ($1, $2, $3::jsonb, $4, NOW())
       ON CONFLICT (tenant_id) DO UPDATE
       SET draft_config = $3::jsonb, updated_by = $4, updated_at = NOW()`,
      [firm.id, firm.slug, JSON.stringify(draftConfig), updatedBy],
    );

    return {
      success: true,
      message: `Draft theme saved for ${firm.title}`,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Publish theme live for tenant
   */
  async publishTheme(idOrSlug: string, themeStudioConfig: any, publishedBy: string = 'OWNER', notes?: string) {
    const firm = await this.resolveFirm(idOrSlug);
    if (!firm) {
      throw new NotFoundException(`Tenant firm '${idOrSlug}' not found.`);
    }

    const prevConfig = firm.theme_config || {};
    const nextVersion = (prevConfig.version || 1) + 1;

    // Derive flat CSS tokens from CategoryThemeConfig for fast compatibility
    const flatTokens = {
      ...prevConfig,
      primary_color: themeStudioConfig.buttons?.primary_bg || themeStudioConfig.primary_color || prevConfig.primary_color || '#5B4BFF',
      secondary_color: themeStudioConfig.buttons?.secondary_bg || themeStudioConfig.secondary_color || prevConfig.secondary_color || '#7867FF',
      accent_color: themeStudioConfig.kanban?.column_accent_color || prevConfig.accent_color || '#F36C21',
      danger_color: themeStudioConfig.buttons?.danger_bg || prevConfig.danger_color || '#F04438',
      success_color: prevConfig.success_color || '#00C48C',
      warning_color: prevConfig.warning_color || '#FFB020',
      page_bg: themeStudioConfig.layout?.page_bg || themeStudioConfig.page_bg || prevConfig.page_bg || '#F6F8FC',
      sidebar_bg: themeStudioConfig.sidebar?.bg_color || themeStudioConfig.sidebar_bg || prevConfig.sidebar_bg || '#2D2575',
      sidebar_text_color: themeStudioConfig.sidebar?.text_color || prevConfig.sidebar_text_color || '#FFFFFF',
      header_bg: themeStudioConfig.header?.bg_color || themeStudioConfig.header_bg || prevConfig.header_bg || '#2D2575',
      card_bg: themeStudioConfig.cards?.bg_color || themeStudioConfig.card_bg || prevConfig.card_bg || '#FFFFFF',
      font_family: themeStudioConfig.layout?.font_family || prevConfig.font_family || 'Inter',
      base_font_size: themeStudioConfig.layout?.base_font_size || prevConfig.base_font_size || '14px',
      card_radius: themeStudioConfig.cards?.radius || themeStudioConfig.layout?.global_radius || prevConfig.card_radius || '22px',
      table_header_bg: themeStudioConfig.tables?.header_bg || prevConfig.table_header_bg || '#F8FAFC',
      table_zebra: themeStudioConfig.tables?.row_striping !== undefined ? themeStudioConfig.tables.row_striping : true,
      theme_studio: themeStudioConfig,
      version: nextVersion,
    };

    // Update public.firms
    const updateRows = await this.dataSource.query(
      `UPDATE public.firms SET
        theme_color = $1,
        theme_config = $2::jsonb,
        updated_by = $3,
        updated_at = NOW()
      WHERE id = $4
      RETURNING *`,
      [flatTokens.primary_color, JSON.stringify(flatTokens), publishedBy, firm.id],
    );

    // Save snapshot in version history
    await this.dataSource.query(
      `INSERT INTO public.tenant_theme_history (tenant_id, tenant_slug, version, theme_config, published_by, published_at, notes)
       VALUES ($1, $2, $3, $4::jsonb, $5, NOW(), $6)`,
      [firm.id, firm.slug, nextVersion, JSON.stringify(themeStudioConfig), publishedBy, notes || `Published Version ${nextVersion}`],
    );

    // Clear or update draft
    await this.dataSource.query(
      `INSERT INTO public.tenant_theme_drafts (tenant_id, tenant_slug, draft_config, updated_by, updated_at)
       VALUES ($1, $2, $3::jsonb, $4, NOW())
       ON CONFLICT (tenant_id) DO UPDATE
       SET draft_config = $3::jsonb, updated_by = $4, updated_at = NOW()`,
      [firm.id, firm.slug, JSON.stringify(themeStudioConfig), publishedBy],
    );

    const updatedFirm = updateRows[0];
    return {
      success: true,
      message: `Theme v${nextVersion} published live to ${updatedFirm.title}`,
      tenant_id: updatedFirm.id,
      tenant_slug: updatedFirm.slug,
      version: nextVersion,
      theme_config: flatTokens,
    };
  }

  /**
   * Rollback to a specific historic version
   */
  async revertToVersion(idOrSlug: string, targetVersion: number, revertedBy: string = 'OWNER') {
    const firm = await this.resolveFirm(idOrSlug);
    if (!firm) {
      throw new NotFoundException(`Tenant firm '${idOrSlug}' not found.`);
    }

    const historyRows = await this.dataSource.query(
      `SELECT * FROM public.tenant_theme_history WHERE tenant_id = $1 AND version = $2 LIMIT 1`,
      [firm.id, targetVersion],
    );

    if (historyRows.length === 0) {
      throw new NotFoundException(`Version ${targetVersion} not found in history for ${firm.title}`);
    }

    const snapshot = historyRows[0].theme_config;
    return this.publishTheme(firm.id, snapshot, revertedBy, `Reverted back to Version ${targetVersion}`);
  }
}
