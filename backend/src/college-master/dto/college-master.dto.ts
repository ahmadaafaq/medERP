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

  @ApiPropertyOptional({ example: '#6366F1' })
  @IsOptional()
  @IsString()
  primary_color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primaryColor?: string;
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

  @ApiPropertyOptional({ example: 'UG' })
  @IsOptional()
  @IsString()
  degree_level?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  durationYears?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  duration_years?: number;

  @ApiPropertyOptional({ example: 'Phase I (1st Professional MBBS)' })
  @IsOptional()
  @IsString()
  professionalPhase?: string;

  @ApiPropertyOptional({ example: 'Phase I (1st Professional MBBS)' })
  @IsOptional()
  @IsString()
  professional_phase?: string;

  @ApiPropertyOptional({ example: 'professional' })
  @IsOptional()
  @IsString()
  academicSystem?: string;

  @ApiPropertyOptional({ example: 'professional' })
  @IsOptional()
  @IsString()
  academic_system?: string;

  @ApiPropertyOptional({ example: 'c0a80101-0000-0000-0000-000000000001' })
  @IsOptional()
  @IsString()
  collegeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  college_id?: string;
}

export class UpdateCourseDto extends PartialType(CreateCourseDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
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

  @ApiPropertyOptional({ example: 'MBBS' })
  @IsOptional()
  @IsString()
  course_cd?: string;

  @ApiPropertyOptional({ example: 'MBBS' })
  @IsOptional()
  @IsString()
  courseCode?: string;

  @ApiPropertyOptional({ example: 'MBBS' })
  @IsOptional()
  @IsString()
  course_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  course_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department_id?: string;

  @ApiPropertyOptional({ example: '2024-08-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-08-01' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ example: '2029-07-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: '2029-07-31' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collegeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  college_id?: string;
}

export class UpdateBatchDto extends PartialType(CreateBatchDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  college_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  course_id?: string;
}

export class UpdateBranchDto extends PartialType(CreateBranchDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
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

  @ApiPropertyOptional({ example: '2024-07-01' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiProperty({ example: '2025-06-30' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ example: '2025-06-30' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_current?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collegeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  college_id?: string;
}

export class UpdateSessionDto extends PartialType(CreateSessionDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
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

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  phase_order?: number;

  @ApiPropertyOptional({ example: 'MBBS' })
  @IsOptional()
  @IsString()
  courseCd?: string;

  @ApiPropertyOptional({ example: 'MBBS' })
  @IsOptional()
  @IsString()
  course_cd?: string;

  @ApiPropertyOptional({ example: 'MBBS' })
  @IsOptional()
  @IsString()
  courseCode?: string;

  @ApiPropertyOptional({ example: 'MBBS' })
  @IsOptional()
  @IsString()
  course_code?: string;

  @ApiPropertyOptional({ example: 'professional' })
  @IsOptional()
  @IsString()
  academicSystem?: string;

  @ApiPropertyOptional({ example: 'professional' })
  @IsOptional()
  @IsString()
  academic_system?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collegeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  college_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  course_id?: string;
}

export class UpdateProfessionalDto extends PartialType(CreateProfessionalDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// ─── 7. RESIDENCY CATEGORIES (Hostel / Resident / Day Scholar) ─────────────
export class CreateResidencyDto {
  @ApiProperty({ example: 'Hosteller' })
  @IsString()
  residencyType: string;

  @ApiPropertyOptional({ example: 'Hosteller' })
  @IsOptional()
  @IsString()
  residency_type?: string;

  @ApiProperty({ example: 'Charak Hostel Block A' })
  @IsString()
  @MaxLength(200)
  categoryName: string;

  @ApiPropertyOptional({ example: 'Charak Hostel Block A' })
  @IsOptional()
  @IsString()
  category_name?: string;

  @ApiPropertyOptional({ example: 'North Wing Floor 2' })
  @IsOptional()
  @IsString()
  blockWing?: string;

  @ApiPropertyOptional({ example: 'North Wing Floor 2' })
  @IsOptional()
  @IsString()
  block_wing?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  totalCapacity?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  total_capacity?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  allocatedCount?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  allocated_count?: number;

  @ApiPropertyOptional({ example: 12000 })
  @IsOptional()
  @IsNumber()
  monthlyFee?: number;

  @ApiPropertyOptional({ example: 12000 })
  @IsOptional()
  @IsNumber()
  monthly_fee?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collegeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  college_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  course_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  course_code?: string;
}

export class UpdateResidencyDto extends PartialType(CreateResidencyDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// ─── 8. GROUPS MASTER (Batch Sub-Groups: A, B, C, D) ───────────────────────
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
  college_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  course_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batch_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department_id?: string;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

