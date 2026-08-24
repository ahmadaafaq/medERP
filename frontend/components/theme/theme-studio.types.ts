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
