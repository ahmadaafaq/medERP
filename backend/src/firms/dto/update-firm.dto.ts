import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Matches,
  IsHexColor,
} from 'class-validator';
import { FirmLevelType, FirmMode, FirmStatus } from '../../database/entities/firm.entity';

export class UpdateFirmDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must contain only lowercase alphanumeric characters and hyphens',
  })
  slug?: string;

  @IsString()
  @IsOptional()
  tenant_name?: string;

  @IsString()
  @IsOptional()
  domain?: string;

  @IsString()
  @IsOptional()
  logo_url?: string;

  @IsString()
  @IsOptional()
  cover_url?: string;

  @IsString()
  @IsOptional()
  banner_url?: string;

  @IsEnum(FirmLevelType)
  @IsOptional()
  level_type?: FirmLevelType;

  @IsHexColor()
  @IsOptional()
  theme_color?: string;

  @IsEnum(FirmMode)
  @IsOptional()
  firm_mode?: FirmMode;

  @IsEnum(FirmStatus)
  @IsOptional()
  status?: FirmStatus;

  @IsInt()
  @Min(0)
  @IsOptional()
  trial_days?: number;

  @IsOptional()
  theme_config?: Record<string, any>;

  @IsString()
  @IsOptional()
  timetable_module_type?: string; // 'ENGINEERING' | 'MEDICAL'
}

