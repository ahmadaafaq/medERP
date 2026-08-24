import {
  IsString, IsOptional, IsBoolean, IsNumber,
  IsUUID, MaxLength, IsArray,
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseCd?: string;

  @ApiPropertyOptional({ example: '1st Professional (Phase I)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  professional_phase?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  professionalPhase?: string;

  @ApiPropertyOptional({ example: '2024-2025' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  academic_session?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  academicSession?: string;

  @ApiPropertyOptional({ example: 'Linking Foundation Course, Anatomy, Physiology, Biochemistry to Phase I' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  college_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collegeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  college_slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collegeSlug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  colg_cd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProfessionalLinkerDto extends PartialType(CreateProfessionalLinkerDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ─── 2. DEPARTMENT MASTER ────────────────────────────────────────────────────
export class CreateDepartmentMasterDto {
  @ApiProperty({ example: 'Anatomy' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: '1' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiPropertyOptional({ example: 'General' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branch_cd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchCd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  course_cd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseCd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  course_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  colg_cd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  colgCd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  college_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collegeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  college_slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collegeSlug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  hod_user_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  hodUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateDepartmentMasterDto extends PartialType(CreateDepartmentMasterDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
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
  @IsString()
  department_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  course_cd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseCd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  course_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branch_cd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchCd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  college_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collegeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  college_slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collegeSlug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  colg_cd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  colgCd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batch_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsNumber()
  credits?: number;

  @ApiPropertyOptional({ example: 'Combined' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  type?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_longitudinal?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isLongitudinal?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batch_cd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchCd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sem_cd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  semCd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  semester?: string | number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sub_addinfo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subAddinfo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mst_sub_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mstSubName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSubjectMasterDto extends PartialType(CreateSubjectMasterDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ─── 4. TOPIC MASTER ─────────────────────────────────────────────────────────
export class CreateTopicMasterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  college_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collegeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  college_slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collegeSlug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  course_cd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseCd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branch_cd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchCd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unitCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bloom_level?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bloomLevel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linker_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkerId?: string;

  @ApiProperty({ example: 'ANAT-TOPIC-1' })
  @IsString()
  @MaxLength(100)
  code: string;

  @ApiProperty({ example: 'Upper Limb Anatomy & Embryology' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'Study of brachial plexus and axillary vessels' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Lecture' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  learning_method?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  learningMethod?: string;

  @ApiPropertyOptional({ example: 'Written Assessment' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  assessment_method?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  assessmentMethod?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  hours?: number;

  @ApiPropertyOptional({ example: 2025 })
  @IsOptional()
  @IsNumber()
  batch_year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  batchYear?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateTopicMasterDto extends PartialType(CreateTopicMasterDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ─── 5. COMPETENCY / SUB-TOPIC MASTER ──────────────────────────────────────────
export class CreateCompetencyMasterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  college_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collegeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  college_slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collegeSlug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  course_cd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseCd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branch_cd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchCd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unitCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topic_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topicId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topic_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topicCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linker_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkerId?: string;

  @ApiPropertyOptional({ example: 'AN1.1' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  code?: string;

  @ApiPropertyOptional({ example: 'Anatomical positions and planes' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'Describe normal anatomical positions and planes of body' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Knowledge' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  domain?: string;

  @ApiPropertyOptional({ example: 'Knows How' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  level?: string;

  @ApiPropertyOptional({ example: 'KL-2 (Understand)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bloom_level?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bloomLevel?: string;

  @ApiPropertyOptional({ example: 'Lecture' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  learning_method?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  learningMethod?: string;

  @ApiPropertyOptional({ example: 'Written Assessment' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  assessment_method?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  assessmentMethod?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_core?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isCore?: boolean;

  @ApiPropertyOptional({ example: 2025 })
  @IsOptional()
  @IsNumber()
  batch_year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  batchYear?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  items?: Array<{
    code: string;
    name?: string;
    description: string;
    domain?: string;
    level?: string;
    bloom_level?: string;
    is_core?: boolean;
  }>;
}

export class UpdateCompetencyMasterDto extends PartialType(CreateCompetencyMasterDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ─── 6. DELIVERY TYPE MASTER ─────────────────────────────────────────────────
export class CreateDeliveryTypeDto {
  @ApiProperty({ example: 'TH' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Theory' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Classroom interactive lecture' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  college_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collegeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  college_slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collegeSlug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateDeliveryTypeDto extends PartialType(CreateDeliveryTypeDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ─── 7. SUBJECT OFFERINGS JUNCTION ───────────────────────────────────────────
export class CreateSubjectOfferingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prof_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  profId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  phase_order?: string | number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dtype_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dtypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dtype_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dtypeCode?: string;

  @ApiPropertyOptional({ example: 2024 })
  @IsOptional()
  @IsNumber()
  batch_year?: number;

  @ApiPropertyOptional({ example: 2024 })
  @IsOptional()
  @IsNumber()
  batchYear?: number;

  @ApiPropertyOptional({ example: '2024-2025' })
  @IsOptional()
  @IsString()
  academic_year?: string;

  @ApiPropertyOptional({ example: '2024-2025' })
  @IsOptional()
  @IsString()
  academicYear?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batch?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  semester?: string | number;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @IsNumber()
  hours_allotted?: number;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @IsNumber()
  hoursAllotted?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batch_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  course_cd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseCd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branch_cd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchCd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  college_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collegeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  college_slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collegeSlug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  colg_cd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  colgCd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_elective?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isElective?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSubjectOfferingDto extends PartialType(CreateSubjectOfferingDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ─── 8. FACULTY SUBJECT LINKER ───────────────────────────────────────────────
export class LinkFacultySubjectDto {
  @ApiProperty({ description: 'Faculty UUID or Employee Code' })
  @IsString()
  facultyId: string;

  @ApiProperty({ description: 'Subject UUID or Subject Numeric Code' })
  @IsString()
  subjectId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collegeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collegeSlug?: string;
}

// ─── 9. UNIT MASTER ─────────────────────────────────────────────────────────
export class CreateUnitMasterDto {
  @ApiProperty({ example: 'UNIT-1' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ example: 'Introduction to Web Technology' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Detailed description of HTML, CSS, JavaScript core features' })
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unitCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  course_cd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseCd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  course_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branch_cd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchCd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batch_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  batch_year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  batchYear?: number;

  @ApiPropertyOptional({ example: 'KL-2 (Understand)' })
  @IsOptional()
  @IsString()
  bloom_level?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bloomLevel?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  unit_order?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  unitOrder?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  hours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  college_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collegeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  college_slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collegeSlug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  colg_cd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  colgCd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateUnitMasterDto extends PartialType(CreateUnitMasterDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

