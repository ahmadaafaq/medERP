import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Matches,
  IsHexColor,
} from 'class-validator';
import { FirmLevelType, FirmMode } from '../../database/entities/firm.entity';

export class CreateFirmDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must contain only lowercase alphanumeric characters and hyphens',
  })
  slug: string;

  @IsString()
  @IsNotEmpty()
  tenant_name: string;

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
  level_type?: FirmLevelType = FirmLevelType.STANDARD;

  @IsHexColor()
  @IsOptional()
  theme_color?: string = '#5B4BFF';

  @IsEnum(FirmMode)
  @IsOptional()
  firm_mode?: FirmMode = FirmMode.MED;

  @IsInt()
  @Min(0)
  @IsOptional()
  trial_days?: number;

  @IsString()
  @IsOptional()
  timetable_module_type?: string; // 'ENGINEERING' | 'MEDICAL'
}

