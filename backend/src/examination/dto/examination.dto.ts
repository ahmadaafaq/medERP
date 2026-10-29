import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

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

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  department_id?: string;

  @Transform(({ value }) => (value !== null && value !== undefined ? String(value) : value))
  @IsString()
  @IsOptional()
  colgCd?: string;

  @Transform(({ value }) => (value !== null && value !== undefined ? String(value) : value))
  @IsString()
  @IsOptional()
  colg_cd?: string;

  @Transform(({ value }) => (value !== null && value !== undefined ? String(value) : value))
  @IsString()
  @IsOptional()
  courseCd?: string;

  @Transform(({ value }) => (value !== null && value !== undefined ? String(value) : value))
  @IsString()
  @IsOptional()
  course_cd?: string;

  @Transform(({ value }) => (value !== null && value !== undefined ? String(value) : value))
  @IsString()
  @IsOptional()
  branchCd?: string;

  @Transform(({ value }) => (value !== null && value !== undefined ? String(value) : value))
  @IsString()
  @IsOptional()
  branch_cd?: string;

  @Transform(({ value }) => (value !== null && value !== undefined ? String(value) : value))
  @IsString()
  @IsOptional()
  batchCd?: string;

  @Transform(({ value }) => (value !== null && value !== undefined ? String(value) : value))
  @IsString()
  @IsOptional()
  batch_cd?: string;

  @Transform(({ value }) => (value !== null && value !== undefined ? String(value) : value))
  @IsString()
  @IsOptional()
  semester?: string;

  @Transform(({ value }) => (value !== null && value !== undefined ? String(value) : value))
  @IsString()
  @IsOptional()
  section?: string;

  @IsString()
  @IsOptional()
  academicYear?: string;

  @IsString()
  @IsOptional()
  academic_year?: string;

  @IsNumber()
  @IsOptional()
  version?: number;

  @IsString()
  @IsOptional()
  hodRemarks?: string;

  @IsOptional()
  questionRemarks?: any;

  @IsString()
  @IsOptional()
  createdBy?: string;

  @IsString()
  @IsOptional()
  facultyId?: string;

  @IsString()
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  paperSet?: string;

  @IsString()
  @IsOptional()
  paper_set?: string;

  @IsOptional()
  targetSections?: any;

  @IsOptional()
  target_sections?: any;
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
  college_id?: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  department_id?: string;

  @IsString()
  @IsOptional()
  subjectId?: string;

  @IsString()
  @IsOptional()
  subject_id?: string;

  @IsString()
  @IsOptional()
  subjectCode?: string;

  @IsString()
  @IsOptional()
  subject_code?: string;

  @IsString()
  @IsOptional()
  professionalPhase?: string;

  @IsString()
  @IsOptional()
  professional_phase?: string;

  @IsString()
  @IsOptional()
  topicId?: string;

  @IsString()
  @IsOptional()
  topic_id?: string;

  @IsString()
  @IsOptional()
  topic?: string;

  @IsString()
  @IsOptional()
  topicCode?: string;

  @IsString()
  @IsOptional()
  topic_code?: string;

  @IsString()
  @IsOptional()
  competencyId?: string;

  @IsString()
  @IsOptional()
  competency_id?: string;

  @IsString()
  @IsOptional()
  competencyCode?: string;

  @IsString()
  @IsOptional()
  competency_code?: string;

  @IsString()
  @IsNotEmpty()
  mode: 'MCQ' | 'DESC';

  @IsString()
  @IsNotEmpty()
  questionText: string;

  @IsString()
  @IsOptional()
  question_text?: string;

  @IsString()
  @IsOptional()
  optionA?: string;

  @IsString()
  @IsOptional()
  option_a?: string;

  @IsString()
  @IsOptional()
  optionB?: string;

  @IsString()
  @IsOptional()
  option_b?: string;

  @IsString()
  @IsOptional()
  optionC?: string;

  @IsString()
  @IsOptional()
  option_c?: string;

  @IsString()
  @IsOptional()
  optionD?: string;

  @IsString()
  @IsOptional()
  option_d?: string;

  @IsString()
  @IsOptional()
  correctOption?: string;

  @IsString()
  @IsOptional()
  correct_option?: string;

  @IsString()
  @IsOptional()
  difficultyLevel?: string;

  @IsString()
  @IsOptional()
  difficulty_level?: string;

  @IsOptional()
  hasSubQuestions?: boolean;

  @IsOptional()
  has_sub_questions?: boolean;

  @IsArray()
  @IsOptional()
  subQuestions?: any[];

  @IsArray()
  @IsOptional()
  sub_questions?: any[];

  @IsNumber()
  @IsOptional()
  maxMarks?: number;

  @IsNumber()
  @IsOptional()
  max_marks?: number;

  @Transform(({ value }) => (value !== null && value !== undefined ? String(value) : value))
  @IsString()
  @IsOptional()
  colgCd?: string;

  @Transform(({ value }) => (value !== null && value !== undefined ? String(value) : value))
  @IsString()
  @IsOptional()
  colg_cd?: string;

  @Transform(({ value }) => (value !== null && value !== undefined ? String(value) : value))
  @IsString()
  @IsOptional()
  courseCd?: string;

  @Transform(({ value }) => (value !== null && value !== undefined ? String(value) : value))
  @IsString()
  @IsOptional()
  course_cd?: string;

  @Transform(({ value }) => (value !== null && value !== undefined ? String(value) : value))
  @IsString()
  @IsOptional()
  branchCd?: string;

  @Transform(({ value }) => (value !== null && value !== undefined ? String(value) : value))
  @IsString()
  @IsOptional()
  branch_cd?: string;

  @Transform(({ value }) => (value !== null && value !== undefined ? String(value) : value))
  @IsString()
  @IsOptional()
  batchCd?: string;

  @Transform(({ value }) => (value !== null && value !== undefined ? String(value) : value))
  @IsString()
  @IsOptional()
  batch_cd?: string;

  @Transform(({ value }) => (value !== null && value !== undefined ? String(value) : value))
  @IsString()
  @IsOptional()
  semester?: string;

  @Transform(({ value }) => (value !== null && value !== undefined ? String(value) : value))
  @IsString()
  @IsOptional()
  section?: string;

  @IsString()
  @IsOptional()
  unitId?: string;

  @IsString()
  @IsOptional()
  unit_id?: string;

  @IsString()
  @IsOptional()
  unitCode?: string;

  @IsString()
  @IsOptional()
  unit_code?: string;

  @IsString()
  @IsOptional()
  unitName?: string;

  @IsString()
  @IsOptional()
  unit_name?: string;

  @IsString()
  @IsOptional()
  subTopicId?: string;

  @IsString()
  @IsOptional()
  sub_topic_id?: string;

  @IsString()
  @IsOptional()
  subTopicCode?: string;

  @IsString()
  @IsOptional()
  sub_topic_code?: string;

  @IsString()
  @IsOptional()
  subtopicId?: string;

  @IsString()
  @IsOptional()
  subtopic_id?: string;

  @IsString()
  @IsOptional()
  subtopicName?: string;

  @IsString()
  @IsOptional()
  subtopic_name?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  diagramUrl?: string;

  @IsString()
  @IsOptional()
  diagram_url?: string;

  @IsString()
  @IsOptional()
  createdBy?: string;

  @IsString()
  @IsOptional()
  created_by?: string;
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

  @Transform(({ value }) => (value !== null && value !== undefined ? String(value) : value))
  @IsString()
  @IsOptional()
  colgCd?: string;

  @Transform(({ value }) => (value !== null && value !== undefined ? String(value) : value))
  @IsString()
  @IsOptional()
  courseCd?: string;

  @Transform(({ value }) => (value !== null && value !== undefined ? String(value) : value))
  @IsString()
  @IsOptional()
  branchCd?: string;

  @Transform(({ value }) => (value !== null && value !== undefined ? String(value) : value))
  @IsString()
  @IsOptional()
  batchId?: string;

  @Transform(({ value }) => (value !== null && value !== undefined ? String(value) : value))
  @IsString()
  @IsOptional()
  batchCd?: string;

  @Transform(({ value }) => (value !== null && value !== undefined ? String(value) : value))
  @IsString()
  @IsOptional()
  target_batch?: string;

  @Transform(({ value }) => (value !== null && value !== undefined ? String(value) : value))
  @IsString()
  @IsOptional()
  semester?: string;

  @IsString()
  @IsOptional()
  examDate?: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsString()
  @IsOptional()
  room?: string;
}

// ─── HOD Approval Workflow DTOs ──────────────────────────────────────────────

/** HOD approves or rejects a question paper */
export class HodApproveQPDto {
  @IsString()
  @IsNotEmpty()
  paperId: string;

  @IsString()
  @IsNotEmpty()
  action: string; // 'approve' | 'reject' | 'changes_requested'

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  hodRemarks?: string;

  @IsString()
  @IsOptional()
  hod_remarks?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsOptional()
  questionRemarks?: any;

  @IsNumber()
  @IsOptional()
  version?: number;

  @IsString()
  @IsOptional()
  paperSet?: string;

  @IsString()
  @IsOptional()
  paper_set?: string;

  @IsOptional()
  targetSections?: any;

  @IsOptional()
  target_sections?: any;

  @IsString()
  @IsOptional()
  dqacRemarks?: string;

  @IsString()
  @IsOptional()
  dqac_remarks?: string;
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

  @IsString()
  @IsOptional()
  hodRemarks?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsOptional()
  slots?: any;
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

  @Transform(({ value }) => (value !== null && value !== undefined ? String(value) : value))
  @IsString()
  @IsOptional()
  batchId?: string;

  @Transform(({ value }) => (value !== null && value !== undefined ? String(value) : value))
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
  id?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  colgCd?: string;

  @IsString()
  @IsOptional()
  courseCd?: string;

  @IsString()
  @IsOptional()
  branchCd?: string;

  @IsString()
  @IsOptional()
  batchCd?: string;

  @IsString()
  @IsOptional()
  section?: string;
}

