import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, IsBoolean } from 'class-validator';

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
  @IsOptional()
  studentId?: string;

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
  @IsString()
  rollno?: string;

  @IsOptional()
  @IsString()
  registrationNo?: string;

  @IsOptional()
  @IsString()
  paperCode?: string;

  @IsOptional()
  @IsString()
  studentName?: string;

  @IsOptional()
  @IsBoolean()
  isPass?: boolean;
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

// ─── HOD Approval Workflow DTOs ──────────────────────────────────────────────

/** HOD approves or rejects a question paper */
export class HodApproveQPDto {
  @IsString()
  @IsNotEmpty()
  paperId: string;

  @IsString()
  @IsNotEmpty()
  action: string; // 'approve' | 'reject'

  @IsString()
  @IsOptional()
  remarks?: string;
}

/** HOD approves or rejects a timetable draft */
export class HodApproveTimetableDto {
  @IsString()
  @IsNotEmpty()
  draftId: string;

  @IsString()
  @IsNotEmpty()
  action: string; // 'approve' | 'reject'

  @IsString()
  @IsOptional()
  remarks?: string;
}

/** Clerk creates a timetable draft for HOD approval */
export class CreateTimetableDraftDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  departmentName?: string;

  @IsString()
  @IsOptional()
  batchId?: string;

  @IsString()
  @IsOptional()
  semester?: string;

  @IsString()
  @IsOptional()
  academicYear?: string;

  @IsOptional()
  slots?: any[];

  @IsString()
  @IsOptional()
  notes?: string;
}

