import { IsString, IsNumber, IsOptional, IsIn, Min, Max, IsUUID, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── TARGETS ─────────────────────────────────────────────────────────────────

export class SaveObeTargetDto {
  @ApiPropertyOptional() @IsOptional() @IsString() faculty_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() facultyId?: string;

  @ApiProperty() @IsString() subject_code: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subjectCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subject_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subjectId?: string;

  @ApiProperty() @IsString() unit_code: string; // CO code e.g. "CO1"
  @ApiPropertyOptional() @IsOptional() @IsString() unitCode?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() semester?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== null ? String(value) : value))
  @IsString()
  section?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const n = Number(value);
    return isNaN(n) ? value : n;
  })
  @IsNumber()
  batch_year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const n = Number(value);
    return isNaN(n) ? value : n;
  })
  @IsNumber()
  batchYear?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() course_cd?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() courseCd?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() branch_cd?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() branchCd?: string;

  @ApiPropertyOptional({ enum: ['INTERNAL', 'ESE', 'COMBINED'] })
  @IsOptional() @IsIn(['INTERNAL', 'ESE', 'COMBINED']) exam_type?: string;

  @ApiPropertyOptional({ description: '% of max marks a student must score to "pass" a CO. Default 40.' })
  @IsOptional() @IsNumber() @Min(1) @Max(100) mark_threshold_pct?: number;

  @ApiPropertyOptional({ description: '% of students who must pass for attainment. Default 60.' })
  @IsOptional() @IsNumber() @Min(1) @Max(100) student_pass_pct_target?: number;

  @ApiPropertyOptional({ enum: [1, 2, 3], description: 'NBA target level. Default 2.' })
  @IsOptional() @IsNumber() @Min(1) @Max(3) target_level?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() corrective_action?: string;
}

// ─── EXIT SURVEY ─────────────────────────────────────────────────────────────

export class CreateSurveyDto {
  @ApiProperty() @IsString() subject_code: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subjectCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() faculty_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() facultyId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() semester?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== null ? String(value) : value))
  @IsString()
  section?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const n = Number(value);
    return isNaN(n) ? value : n;
  })
  @IsNumber()
  batch_year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const n = Number(value);
    return isNaN(n) ? value : n;
  })
  @IsNumber()
  batchYear?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() course_cd?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() courseCd?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() branch_cd?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() branchCd?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() closes_at?: string; // ISO date string
}

export class SurveyResponseDto {
  @ApiProperty() @IsUUID() survey_id: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() student_id?: string;
  @ApiProperty() @IsString() unit_code: string;
  @ApiProperty() @IsNumber() @Min(1) @Max(5) rating: number;
}

// ─── ATTAINMENT COMPUTE ───────────────────────────────────────────────────────

export class ComputeAttainmentDto {
  @ApiPropertyOptional() @IsOptional() @IsString() semester?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== null ? String(value) : value))
  @IsString()
  section?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const n = Number(value);
    return isNaN(n) ? value : n;
  })
  @IsNumber()
  batch_year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const n = Number(value);
    return isNaN(n) ? value : n;
  })
  @IsNumber()
  batchYear?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() course_cd?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() courseCd?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() branch_cd?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() branchCd?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subject_code?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subjectCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subject_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subjectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() faculty_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() facultyId?: string;

  @ApiPropertyOptional({ description: 'Internal:ESE weight for direct attainment. e.g. [40, 60]' })
  @IsOptional()
  @IsArray()
  internal_ese_weights?: [number, number];

  @ApiPropertyOptional({ description: 'Direct:Indirect weight for final CO attainment. e.g. [80, 20]' })
  @IsOptional()
  @IsArray()
  direct_indirect_weights?: [number, number];

  @ApiPropertyOptional({ description: 'Mark threshold as % of CO max marks. Default 40.' })
  @IsOptional()
  @IsNumber()
  mark_threshold_pct?: number;
}
