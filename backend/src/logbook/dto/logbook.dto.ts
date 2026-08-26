import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateLogbookCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  courseId?: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateLogbookTopicDto {
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  submissionDeadline?: string;

  @IsNumber()
  @IsOptional()
  maxMarks?: number;

  @IsString()
  @IsOptional()
  courseId?: string;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  batchId?: string;

  @IsString()
  @IsOptional()
  semesterId?: string;
}

export class UpdateLogbookTopicDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  submissionDeadline?: string;

  @IsNumber()
  @IsOptional()
  maxMarks?: number;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  batchId?: string;

  @IsString()
  @IsOptional()
  semesterId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateLogbookSubmissionDto {
  @IsString()
  @IsNotEmpty()
  topicId: string;

  @IsString()
  @IsOptional()
  studentId?: string;

  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsString()
  @IsOptional()
  fileName?: string;

  @IsString()
  @IsOptional()
  fileSize?: string;

  @IsString()
  @IsOptional()
  explanationText?: string;
}

export class EvaluateLogbookSubmissionDto {
  @IsNumber()
  @IsNotEmpty()
  marksObtained: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class CreateLogbookEntryDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  activityTypeId: string;

  @IsString()
  @IsNotEmpty()
  entryDate: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  facultyId?: string;
}

export class VerifyLogbookEntryDto {
  @IsString()
  @IsNotEmpty()
  status: string; // VERIFIED, REJECTED

  @IsString()
  @IsOptional()
  remarks?: string;
}
