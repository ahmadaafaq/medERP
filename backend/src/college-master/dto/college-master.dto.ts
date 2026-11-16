import {
  IsString, IsOptional, IsBoolean, IsNumber, IsArray,
  IsDateString, MaxLength, MinLength, IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

// ─── 1. COLLEGE ─────────────────────────────────────────────────────────────
export class CreateCollegeDto {
  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

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
  @IsString()
  code?: string;

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
  @Type(() => Number)
  @IsNumber()
  durationYears?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  duration_years?: number;

  @ApiPropertyOptional({ example: 'Phase I (1st Professional MBBS)' })
  @IsOptional()
  @IsString()
  professionalPhase?: string;

  @ApiPropertyOptional({ example: 'professional' })
  @IsOptional()
  @IsString()
  academicSystem?: string;

  @ApiPropertyOptional({ example: 'professional' })
  @IsOptional()
  @IsString()
  academic_system?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  courseCd?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  course_cd?: string;

  @ApiPropertyOptional({ example: 'UG' })
  @IsOptional()
  @IsString()
  courseType?: string;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// ─── 3. BATCHES ─────────────────────────────────────────────────────────────
export class CreateBatchDto {
  @ApiProperty({ example: 'MB2024' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 2024 })
  @IsNumber()
  year: number;

  @ApiPropertyOptional({ example: 2024 })
  @IsOptional()
  @IsNumber()
  admissionYear?: number;

  @ApiPropertyOptional({ example: 'MBBS' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  courseCd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  course_cd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseId?: string;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  college_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collegeSlug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  college_slug?: string;
}

export class UpdateBatchDto extends PartialType(CreateBatchDto) {
  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  durationMonths?: number;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  duration_months?: number;

  @ApiPropertyOptional({ example: '2025-08-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-08-01' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ example: '2026-07-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: '2026-07-31' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ example: 'PHASE-1' })
  @IsOptional()
  @IsString()
  phaseCode?: string;

  @ApiPropertyOptional({ example: 'PHASE-1' })
  @IsOptional()
  @IsString()
  phase_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ─── 4. BRANCH / DEPARTMENT ─────────────────────────────────────────────────
export class CreateBranchDto {
  @ApiProperty({ example: '1' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Computer Science & Engineering' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'Engineering' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchCd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseCd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  colgCd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collegeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateBranchDto extends PartialType(CreateBranchDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ─── 5. ACADEMIC SESSIONS ───────────────────────────────────────────────────
export class CreateSessionDto {
  @ApiProperty({ example: '2024-2025' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: '14' })
  @IsOptional()
  @IsString()
  session_cd?: string;

  @ApiPropertyOptional({ example: '14' })
  @IsOptional()
  @IsString()
  sessionCd?: string;

  @ApiPropertyOptional({ example: '14' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  colg_cd?: string;

  @ApiPropertyOptional({ example: '2024-2025' })
  @IsOptional()
  @IsString()
  session_name?: string;

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
}

// ─── 6. PROFESSIONAL PHASES / ACADEMIC YEAR ─────────────────────────────────
export class CreateProfessionalDto {
  @ApiPropertyOptional({ example: '1st Professional MBBS (Phase I)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ example: '1st Professional MBBS (Phase I)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  phaseName?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  phaseOrder?: number;

  @ApiPropertyOptional({ example: 'MBBS' })
  @IsOptional()
  @IsString()
  courseCd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  course_cd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional({ example: 'CS' })
  @IsOptional()
  @IsString()
  branchCd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ example: 'Computer Science & Engg' })
  @IsOptional()
  @IsString()
  branchName?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  academicYear?: number;

  @ApiPropertyOptional({ example: 4.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  durationYears?: number;

  @ApiPropertyOptional({ example: 4.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  duration_years?: number;

  @ApiPropertyOptional({ example: 'professional' })
  @IsOptional()
  @IsString()
  academicSystem?: string;

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
  @IsBoolean()
  isActive?: boolean;
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

  @ApiPropertyOptional({ example: 'PRACTICAL', enum: ['PRACTICAL', 'CLINICAL', 'COMMUNITY', 'TUTORIAL'] })
  @IsOptional()
  @IsString()
  groupType?: string;

  @ApiPropertyOptional({ example: 'PRACTICAL', enum: ['PRACTICAL', 'CLINICAL', 'COMMUNITY', 'TUTORIAL'] })
  @IsOptional()
  @IsString()
  group_type?: string;

  @ApiPropertyOptional({ description: 'Optional subject ID if group is for a specific subject (e.g. Lab, PSM posting)' })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({ description: 'Optional subject ID if group is for a specific subject' })
  @IsOptional()
  @IsString()
  subject_id?: string;

  @ApiPropertyOptional({ description: 'Professional Phase ID if applicable' })
  @IsOptional()
  @IsString()
  phaseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phase_id?: string;

  @ApiPropertyOptional({ example: '1st Semester' })
  @IsOptional()
  @IsString()
  semester?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sem_cd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchCd?: string;

  @ApiPropertyOptional({ description: 'Section ID from Section Master' })
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  section_id?: string;

  @ApiPropertyOptional({ type: [String], description: 'Student IDs to allocate immediately upon creation/update' })
  @IsOptional()
  @IsArray()
  studentIds?: string[];

  @ApiPropertyOptional({ description: 'When updating group, replace existing members with provided studentIds' })
  @IsOptional()
  @IsBoolean()
  replaceMembers?: boolean;
}

export class AssignGroupMembersDto {
  @ApiPropertyOptional({ type: [String], description: 'Array of student UUIDs to enroll' })
  @IsOptional()
  @IsArray()
  studentIds?: string[];

  @ApiPropertyOptional({ example: '1', description: 'Start Roll Number for bulk range assignment' })
  @IsOptional()
  @IsString()
  startRollNo?: string;

  @ApiPropertyOptional({ example: '35', description: 'End Roll Number for bulk range assignment' })
  @IsOptional()
  @IsString()
  endRollNo?: string;

  @ApiPropertyOptional({ example: 'PRACTICAL', enum: ['PRACTICAL', 'CLINICAL', 'COMMUNITY', 'TUTORIAL'] })
  @IsOptional()
  @IsString()
  groupType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

export class UpdateGroupDto extends PartialType(CreateGroupDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ─── 9. RESIDENCY CATEGORY / RESIDENT ────────────────────────────────────────
export class CreateResidencyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collegeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional({ example: 'Hosteller' })
  @IsOptional()
  @IsString()
  residencyType?: string;

  @ApiProperty({ example: 'AC Single Deluxe' })
  @IsString()
  @MaxLength(200)
  categoryName: string;

  @ApiPropertyOptional({ example: 'Wing B' })
  @IsOptional()
  @IsString()
  blockWing?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  totalCapacity?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  allocatedCount?: number;

  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @IsNumber()
  monthlyFee?: number;
}

export class UpdateResidencyDto extends PartialType(CreateResidencyDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}


// ─── 10. HOD SCOPE LINKER ───────────────────────────────────────────────────
export class UpdateHodScopeDto {
  @ApiProperty({ example: '41a6bd13-efc4-4dea-a257-f698075391b1' })
  @IsString()
  hodUserId: string;

  @ApiProperty({ example: ['b9b2bdea-a8a2-4552-861f-f589c8299ffd'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  departmentIds: string[];
}

// ─── 9. SECTIONS MASTER ────────────────────────────────────────────────────
export class CreateSectionDto {
  @ApiProperty({ example: '1' })
  @IsString()
  @MaxLength(20)
  code: string;

  @ApiProperty({ example: 'Section 1' })
  @IsString()
  @MaxLength(100)
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
  departmentId?: string;

  @ApiProperty({ example: 'batch-uuid' })
  @IsString()
  batchId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phaseId?: string;

  @ApiPropertyOptional({ example: '5th Semester' })
  @IsOptional()
  @IsString()
  semester?: string;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsNumber()
  capacity?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateSectionDto extends PartialType(CreateSectionDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
