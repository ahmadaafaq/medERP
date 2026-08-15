import {
  IsString, IsOptional, IsBoolean, IsNumber,
  IsUUID, MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

// ─── 1. PROFESSIONAL LINKER ──────────────────────────────────────────────────
export class CreateProfessionalLinkerDto {
  @ApiProperty({ example: 'LINK-MBBS-PHASE1' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: '1st Professional Phase I Linker' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'MBBS' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  course_cd?: string;

  @ApiPropertyOptional({ example: '1st Professional (Phase I)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  professional_phase?: string;

  @ApiPropertyOptional({ example: '2024-2025' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  academic_session?: string;

  @ApiPropertyOptional({ example: 'Linking Foundation Course, Anatomy, Physiology, Biochemistry to Phase I' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateProfessionalLinkerDto extends PartialType(CreateProfessionalLinkerDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// ─── 2. DEPARTMENT MASTER ────────────────────────────────────────────────────
export class CreateDepartmentMasterDto {
  @ApiProperty({ example: 'Anatomy' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'ANAT' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Pre-Clinical' })
  @IsString()
  @MaxLength(50)
  type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  hod_user_id?: string;
}

export class UpdateDepartmentMasterDto extends PartialType(CreateDepartmentMasterDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// ─── 3. SUBJECT MASTER ───────────────────────────────────────────────────────
export class CreateSubjectMasterDto {
  @ApiProperty({ example: 'ANAT-101' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Human Anatomy' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  department_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  batch_id?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsNumber()
  credits?: number;

  @ApiPropertyOptional({ example: 'Combined' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  type?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_longitudinal?: boolean;
}

export class UpdateSubjectMasterDto extends PartialType(CreateSubjectMasterDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// ─── 4. TOPIC MASTER ─────────────────────────────────────────────────────────
export class CreateTopicMasterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  subject_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  linker_id?: string;

  @ApiProperty({ example: 'ANAT-TOPIC-1' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Upper Limb Anatomy & Embryology' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'Study of brachial plexus and axillary vessels' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  hours?: number;
}

export class UpdateTopicMasterDto extends PartialType(CreateTopicMasterDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// ─── 5. COMPETENCY MASTER ────────────────────────────────────────────────────
export class CreateCompetencyMasterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  subject_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  topic_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  linker_id?: string;

  @ApiProperty({ example: 'AN1.1' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Describe normal anatomical positions and planes of body' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: 'Knowledge' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  domain?: string;

  @ApiPropertyOptional({ example: 'Knows How' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  level?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_core?: boolean;
}

export class UpdateCompetencyMasterDto extends PartialType(CreateCompetencyMasterDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// ─── 6. DELIVERY TYPE MASTER ─────────────────────────────────────────────────
export class CreateDeliveryTypeDto {
  @ApiProperty({ example: 'TH' })
  @IsString()
  @MaxLength(10)
  code: string;

  @ApiProperty({ example: 'Theory' })
  @IsString()
  @MaxLength(50)
  name: string;
}

export class UpdateDeliveryTypeDto extends PartialType(CreateDeliveryTypeDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// ─── 7. SUBJECT OFFERINGS JUNCTION ───────────────────────────────────────────
export class CreateSubjectOfferingDto {
  @ApiProperty()
  @IsUUID()
  subject_id: string;

  @ApiProperty()
  @IsUUID()
  prof_id: string;

  @ApiProperty()
  @IsUUID()
  dtype_id: string;

  @ApiProperty({ example: 2024 })
  @IsNumber()
  batch_year: number;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @IsNumber()
  hours_allotted?: number;
}

export class UpdateSubjectOfferingDto extends PartialType(CreateSubjectOfferingDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// ─── 8. FACULTY SUBJECT LINKER ───────────────────────────────────────────────
export class LinkFacultySubjectDto {
  @ApiProperty()
  @IsUUID()
  facultyId: string;

  @ApiProperty()
  @IsUUID()
  subjectId: string;
}

