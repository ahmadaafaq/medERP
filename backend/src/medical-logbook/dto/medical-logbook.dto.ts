import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateActivityMasterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  course_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branch_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batch_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  professional_year_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cbme_year_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topic_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  competency_id?: string;

  @ApiProperty({ description: 'Activity description or title' })
  @IsNotEmpty()
  @IsString()
  activity_name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  activity_type_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  activity_type_code?: string;
}

export class UpdateActivityMasterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  activity_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  activity_type_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  activity_type_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class CreateSeminarMasterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  course_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branch_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batch_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  professional_year_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cbme_year_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topic_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  competency_id?: string;

  @ApiProperty({ description: 'Category: Central Seminar, Journal Club, PG Seminar, UG Academic' })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({ description: 'Seminar Presentation Topic / Title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seminar_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  presenter_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateSeminarMasterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seminar_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  presenter_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class LogbookStudentRecordDto {
  @ApiProperty({ description: 'Student UUID or admission ID' })
  @IsNotEmpty()
  @IsString()
  student_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rollno?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  student_name?: string;

  @ApiProperty({ description: 'Evaluation code: F, M, C or custom rubric' })
  @IsNotEmpty()
  @IsString()
  status_code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ description: 'Numeric score / marks' })
  @IsOptional()
  @IsNumber()
  score?: number;

  @ApiPropertyOptional({ description: 'Pending, Verified, Absent' })
  @IsOptional()
  @IsString()
  record_status?: string;
}

export class SaveLogbookSessionDto {
  @ApiPropertyOptional({ description: 'Existing session ID if updating' })
  @IsOptional()
  @IsString()
  session_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  activity_master_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  activity_type_id?: string;

  @ApiProperty({ description: 'Date of session (YYYY-MM-DD)' })
  @IsNotEmpty()
  @IsString()
  session_date: string;

  @ApiProperty({ description: 'Target student group ID (e.g. Group A)' })
  @IsNotEmpty()
  @IsString()
  group_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  group_name?: string;

  @ApiPropertyOptional({ description: 'Professional Phase ID (1st Prof, 2nd Prof, etc.)' })
  @IsOptional()
  @IsString()
  professional_year_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject_id?: string;

  @ApiPropertyOptional({ description: 'Program level: UG or PG' })
  @IsOptional()
  @IsString()
  program_level?: 'UG' | 'PG';

  @ApiProperty({ type: [LogbookStudentRecordDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LogbookStudentRecordDto)
  students: LogbookStudentRecordDto[];
}

export class VerifyLogbookRecordDto {
  @ApiPropertyOptional({ description: 'Record status to transition into: Verified, Pending, Absent' })
  @IsOptional()
  @IsString()
  record_status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreatePGLogbookRecordDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  student_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  student_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rollno?: string;

  @ApiProperty({ description: 'PG Year: JR-1, JR-2, JR-3' })
  @IsNotEmpty()
  @IsString()
  pg_year: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department_id?: string;

  @ApiProperty({ description: 'Clinical Procedure, Case Presentation, Journal Club, Thesis/Dissertation' })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({ description: 'Case / Procedure Title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Date of procedure / presentation' })
  @IsNotEmpty()
  @IsString()
  case_date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  patient_details?: string;

  @ApiPropertyOptional({ description: 'Observed, Assisted, Performed Under Supervision, Performed Independently' })
  @IsOptional()
  @IsString()
  procedure_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  faculty_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  faculty_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  score?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}
