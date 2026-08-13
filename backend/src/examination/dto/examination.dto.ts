import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray } from 'class-validator';

export class CreateExamPaperDto {
  @IsString()
  @IsOptional()
  id?: string;

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

  @IsNumber()
  @IsOptional()
  durationMinutes?: number;

  @IsOptional()
  sections?: any;

  @IsString()
  @IsOptional()
  status?: string;
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

  @IsOptional()
  questionMarks?: any;

  @IsOptional()
  subPartMarks?: any;

  @IsOptional()
  practicalMark?: number;

  @IsOptional()
  rollno?: string;

  @IsOptional()
  studentName?: string;
}

export class CreateQuestionDto {
  @IsString()
  @IsOptional()
  collegeId?: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  subjectId?: string;

  @IsString()
  @IsOptional()
  professionalPhase?: string;

  @IsString()
  @IsOptional()
  topicId?: string;

  @IsString()
  @IsOptional()
  topic?: string;

  @IsString()
  @IsOptional()
  competencyId?: string;

  @IsString()
  @IsOptional()
  competencyCode?: string;

  @IsString()
  @IsNotEmpty()
  mode: 'MCQ' | 'DESC';

  @IsString()
  @IsNotEmpty()
  questionText: string;

  @IsString()
  @IsOptional()
  optionA?: string;

  @IsString()
  @IsOptional()
  optionB?: string;

  @IsString()
  @IsOptional()
  optionC?: string;

  @IsString()
  @IsOptional()
  optionD?: string;

  @IsString()
  @IsOptional()
  correctOption?: string;

  @IsString()
  @IsOptional()
  difficultyLevel?: 'Easy' | 'Medium' | 'Hard' | 'Expert';

  @IsOptional()
  hasSubQuestions?: boolean;

  @IsArray()
  @IsOptional()
  subQuestions?: any[];

  @IsNumber()
  @IsOptional()
  maxMarks?: number;
}

export class CreatePaperDesignDto {
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

  @IsNumber()
  maxMarks: number;

  @IsNumber()
  passingMarks: number;

  @IsNumber()
  @IsOptional()
  durationMinutes?: number;

  @IsArray()
  @IsOptional()
  questionIds?: string[];
}

export class PublishPaperDto {
  @IsString()
  @IsNotEmpty()
  paperId: string;

  @IsString()
  @IsOptional()
  batchId?: string;

  @IsString()
  @IsOptional()
  examDate?: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;
}
