import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray } from 'class-validator';

export class CreateExamPaperDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  subjectId?: string;

  @IsString()
  @IsOptional()
  batchId?: string;

  @IsString()
  @IsOptional()
  examDate?: string;

  @IsNumber()
  maxMarks: number;

  @IsNumber()
  passingMarks: number;

  @IsString()
  @IsOptional()
  type?: string;
}

export class SubmitResultDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  paperId: string;

  @IsNumber()
  marksObtained: number;

  @IsNumber()
  @IsOptional()
  attemptNumber?: number;
}
