import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateTenantThemeDto {
  @IsString()
  @IsOptional()
  primary_color?: string;

  @IsString()
  @IsOptional()
  secondary_color?: string;

  @IsString()
  @IsOptional()
  accent_color?: string;

  @IsString()
  @IsOptional()
  danger_color?: string;

  @IsString()
  @IsOptional()
  success_color?: string;

  @IsString()
  @IsOptional()
  warning_color?: string;

  @IsString()
  @IsOptional()
  page_bg?: string;

  @IsString()
  @IsOptional()
  sidebar_bg?: string;

  @IsString()
  @IsOptional()
  sidebar_text_color?: string;

  @IsString()
  @IsOptional()
  header_bg?: string;

  @IsString()
  @IsOptional()
  card_bg?: string;

  @IsString()
  @IsOptional()
  font_family?: string;

  @IsString()
  @IsOptional()
  base_font_size?: string;

  @IsString()
  @IsOptional()
  card_radius?: string;

  @IsString()
  @IsOptional()
  border_radius_scale?: string;

  @IsString()
  @IsOptional()
  login_bg_type?: string;

  @IsString()
  @IsOptional()
  login_bg_url?: string;

  @IsString()
  @IsOptional()
  logo_url?: string;

  @IsString()
  @IsOptional()
  favicon_url?: string;

  @IsString()
  @IsOptional()
  table_header_bg?: string;

  @IsBoolean()
  @IsOptional()
  table_zebra?: boolean;

  @IsString()
  @IsOptional()
  theme_mode?: string;

  @IsOptional()
  theme_config?: Record<string, any>;

  @IsString()
  @IsOptional()
  updated_by?: string;
}
