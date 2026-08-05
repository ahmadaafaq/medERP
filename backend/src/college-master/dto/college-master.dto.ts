import {
  IsString, IsOptional, IsBoolean, IsNumber,
  IsDateString, MaxLength, MinLength, IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

// ─── 1. COLLEGE ─────────────────────────────────────────────────────────────
export class CreateCollegeDto {
  @ApiProperty({ example: 'SRMS Institute of Medical Sciences' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'srms' })
  @IsString()
  @MaxLength(50)
  slug: string;

  @ApiPropertyOptional({ example: 'srms.unicampus.app' })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional({ example: 'enterprise' })
  @IsOptional()
  @IsString()
  plan?: string;

  @ApiPropertyOptional({ example: '#6366F1' })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiPropertyOptional({ example: 'admin@srms.ac.in' })
  @IsOptional()
  @IsEmail()
  adminEmail?: string;
}

export class UpdateCollegeDto extends PartialType(CreateCollegeDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primary_color?: string;
}

// ─── 2. COURSES ─────────────────────────────────────────────────────────────
export class CreateCourseDto {
  @ApiProperty({ example: 'MBBS' })
  @IsString()
  @MaxLength(30)
  code: string;

  @ApiProperty({ example: 'Bachelor of Medicine and Bachelor of Surgery' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'UG' })
  @IsOptional()
  @IsString()
  degreeLevel?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  durationYears?: number;

  @ApiPropertyOptional({ example: 'Phase I (1st Professional MBBS)' })
  @IsOptional()
  @IsString()
  professionalPhase?: string;

  @ApiPropertyOptional({ example: 'c0a80101-0000-0000-0000-000000000001' })
  @IsOptional()
  @IsString()
  collegeId?: string;
}

export class UpdateCourseDto extends PartialType(CreateCourseDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ─── 3. BATCHES ─────────────────────────────────────────────────────────────
export class CreateBatchDto {
  @ApiProperty({ example: 'MB2024' })
  @IsString()
  @MaxLength(20)
  code: string;

  @ApiProperty({ example: 2024 })
  @IsNumber()
  year: number;

  @ApiProperty({ example: 'MBBS' })
  @IsString()
  @MaxLength(20)
  courseCd: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ example: '2024-08-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2029-07-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collegeId?: string;
}

export class UpdateBatchDto extends PartialType(CreateBatchDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ─── 4. BRANCH / DEPARTMENT ─────────────────────────────────────────────────
export class CreateBranchDto {
  @ApiProperty({ example: 'ANAT' })
  @IsString()
  @MaxLength(20)
  code: string;

  @ApiProperty({ example: 'Department of Human Anatomy' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'Non-Clinical' })
  @IsString()
  @MaxLength(50)
  type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collegeId?: string;
}

export class UpdateBranchDto extends PartialType(CreateBranchDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ─── 5. ACADEMIC SESSIONS ───────────────────────────────────────────────────
export class CreateSessionDto {
  @ApiProperty({ example: '2024-2025 Academic Session' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: '2024-07-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-06-30' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collegeId?: string;
}

export class UpdateSessionDto extends PartialType(CreateSessionDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ─── 6. PROFESSIONAL PHASES ─────────────────────────────────────────────────
export class CreateProfessionalDto {
  @ApiProperty({ example: '1st Professional MBBS (Phase I)' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  phaseOrder?: number;

  @ApiPropertyOptional({ example: 'MBBS' })
  @IsOptional()
  @IsString()
  courseCd?: string;

  @ApiPropertyOptional({ example: 'professional' })
  @IsOptional()
  @IsString()
  academicSystem?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collegeId?: string;
}

export class UpdateProfessionalDto extends PartialType(CreateProfessionalDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ─── 8. GROUPS MASTER ──────────────────────────────────────────────────────
export class CreateGroupDto {
  @ApiProperty({ example: 'GRP-A' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Group A (Batch 1)' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collegeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  capacity?: number;
}

export class UpdateGroupDto extends PartialType(CreateGroupDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

