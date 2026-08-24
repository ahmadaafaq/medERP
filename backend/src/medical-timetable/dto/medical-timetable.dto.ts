import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray, IsUUID, Min, Max } from 'class-validator';

export class CreateMedicalScheduleDto {
  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  courseName?: string;

  @IsNotEmpty()
  @IsString()
  departmentId: string;

  @IsOptional()
  @IsString()
  departmentName?: string;

  @IsNotEmpty()
  @IsString()
  professionalYearId: string;

  @IsOptional()
  @IsString()
  professionalYearName?: string;

  @IsNotEmpty()
  @IsString()
  subjectId: string;

  @IsOptional()
  @IsString()
  subjectName?: string;

  @IsOptional()
  @IsString()
  linkedSubjectId?: string;

  @IsOptional()
  @IsString()
  linkedSubjectName?: string;

  @IsOptional()
  @IsString()
  facultyId?: string;

  @IsOptional()
  @IsString()
  facultyName?: string;

  @IsOptional()
  @IsString()
  facultyEmpId?: string;

  @IsOptional()
  @IsString()
  unitId?: string;

  @IsOptional()
  @IsString()
  unitName?: string;

  @IsOptional()
  @IsString()
  topicId?: string;

  @IsOptional()
  @IsString()
  topicName?: string;

  @IsOptional()
  @IsArray()
  competencyIds?: string[];

  @IsOptional()
  @IsString()
  competencyCodes?: string;

  @IsOptional()
  @IsString()
  room?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(7)
  dayOfWeek: number; // 1 = Monday, 6 = Saturday

  @IsNotEmpty()
  @IsString()
  startTime: string; // e.g. "08:30"

  @IsNotEmpty()
  @IsString()
  endTime: string; // e.g. "09:30"

  @IsOptional()
  @IsString()
  sessionType?: string; // Lecture, Practical, SGD, DOAP, Seminar, Clinical Posting

  @IsOptional()
  @IsString()
  deliveryTypeId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateMedicalScheduleDto extends CreateMedicalScheduleDto {}
