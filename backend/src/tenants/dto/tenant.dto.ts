import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
  IsUrl,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum TenantType {
  MEDICAL = 'MEDICAL',
  ENGINEERING = 'ENGINEERING',
  ARTS = 'ARTS',
  PHARMACY = 'PHARMACY',
  NURSING = 'NURSING',
  OTHER = 'OTHER',
}

export class CreateTenantDto {
  @ApiProperty({ example: 'Shri Ram Medical College' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name: string;

  @ApiProperty({
    example: 'srms',
    description: 'Unique URL-safe slug (lowercase, alphanumeric, hyphens)',
  })
  @IsString()
  @Matches(/^[a-z0-9][a-z0-9-]{2,29}$/, {
    message: 'Slug must be 3-30 chars: lowercase letters, numbers, hyphens only',
  })
  slug: string;

  @ApiProperty({ enum: TenantType })
  @IsEnum(TenantType)
  type: TenantType;

  @ApiProperty({ example: 'admin@srms.ac.in' })
  @IsEmail()
  adminEmail: string;

  @ApiProperty({ example: 'Admin@1234' })
  @IsString()
  @MinLength(8)
  adminPassword: string;

  @ApiPropertyOptional({ example: 'Bareilly, Uttar Pradesh' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '+91-9999999999' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://srms.ac.in' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}

export class UpdateTenantDto extends PartialType(CreateTenantDto) {}

export class TenantSettingsDto {
  @ApiPropertyOptional({ description: 'Attendance % threshold for alerts' })
  @IsOptional()
  attendanceThreshold?: number;

  @ApiPropertyOptional({ description: 'Academic year start month (1-12)' })
  @IsOptional()
  academicYearStart?: number;

  @ApiPropertyOptional({ description: 'Institution logo S3 key' })
  @IsOptional()
  logoKey?: string;

  @ApiPropertyOptional({ description: 'Primary theme color hex' })
  @IsOptional()
  primaryColor?: string;

  @ApiPropertyOptional({ description: 'SMS gateway API key' })
  @IsOptional()
  smsApiKey?: string;

  @ApiPropertyOptional({ description: 'Email from address' })
  @IsOptional()
  emailFrom?: string;
}
