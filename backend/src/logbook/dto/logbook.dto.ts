import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';

// 1. Categories & Topics
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

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// 2. Submissions & Evaluations
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

// 3. Mini Project Assignment & Metadata
export class CreateMiniProjectDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  promptInstructions?: string;

  @IsArray()
  @IsOptional()
  technologies?: string[];

  @IsString()
  @IsOptional()
  collegeId?: string;

  @IsString()
  @IsOptional()
  disciplineType?: string;

  @IsString()
  @IsOptional()
  courseId?: string;

  @IsString()
  @IsOptional()
  batchId?: string;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  semesterId?: string;

  @IsString()
  @IsOptional()
  submissionDeadline?: string;

  @IsNumber()
  @IsOptional()
  maxMarks?: number;

  @IsString()
  @IsOptional()
  repositoryUrl?: string;

  @IsString()
  @IsOptional()
  liveDemoUrl?: string;

  @IsString()
  @IsOptional()
  teamMembers?: string;
}

export class UpdateMiniProjectDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  promptInstructions?: string;

  @IsArray()
  @IsOptional()
  technologies?: string[];

  @IsString()
  @IsOptional()
  repositoryUrl?: string;

  @IsString()
  @IsOptional()
  liveDemoUrl?: string;

  @IsString()
  @IsOptional()
  documentationUrl?: string;

  @IsString()
  @IsOptional()
  documentationName?: string;

  @IsString()
  @IsOptional()
  zipSubmissionUrl?: string;

  @IsString()
  @IsOptional()
  teamMembers?: string;

  @IsString()
  @IsOptional()
  projectStatus?: string; // PLANNING, IN_PROGRESS, REVIEWED, COMPLETED
}

// 4. Weekly Logs
export class CreateWeeklyLogDto {
  @IsString()
  @IsOptional()
  studentId?: string;

  @IsString()
  @IsOptional()
  projectId?: string;

  @IsNumber()
  @IsNotEmpty()
  weekNumber: number;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsOptional()
  hoursSpent?: number;

  @IsString()
  @IsNotEmpty()
  tasksPlanned: string;

  @IsString()
  @IsNotEmpty()
  tasksAccomplished: string;

  @IsString()
  @IsOptional()
  challengesFaced?: string;

  @IsString()
  @IsOptional()
  nextWeekGoals?: string;

  @IsString()
  @IsOptional()
  attachmentUrl?: string;

  @IsString()
  @IsOptional()
  attachmentName?: string;
}

export class UpdateWeeklyLogDto {
  @IsString()
  @IsOptional()
  projectId?: string;
  @IsNumber()
  @IsOptional()
  weekNumber?: number;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsOptional()
  hoursSpent?: number;

  @IsString()
  @IsOptional()
  tasksPlanned?: string;

  @IsString()
  @IsOptional()
  tasksAccomplished?: string;

  @IsString()
  @IsOptional()
  challengesFaced?: string;

  @IsString()
  @IsOptional()
  nextWeekGoals?: string;

  @IsString()
  @IsOptional()
  attachmentUrl?: string;

  @IsString()
  @IsOptional()
  attachmentName?: string;
}

export class EvaluateWeeklyLogDto {
  @IsNumber()
  @IsNotEmpty()
  marks: number;

  @IsString()
  @IsNotEmpty()
  remarks: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  guideSignature?: string;
}

export class FinalizeProjectLockDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsOptional()
  projectId?: string;

  @IsString()
  @IsNotEmpty()
  finalGrade: string;

  @IsNumber()
  @IsNotEmpty()
  finalPercentage: number;

  @IsString()
  @IsNotEmpty()
  finalRemarks: string;

  @IsString()
  @IsOptional()
  guideSignature?: string;
}

// 5. Seminars
export class CreateSeminarDto {
  @IsString()
  @IsOptional()
  studentId?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  presentationDate?: string;

  @IsString()
  @IsOptional()
  abstractText?: string;

  @IsString()
  @IsOptional()
  slideDeckUrl?: string;

  @IsString()
  @IsOptional()
  slideDeckName?: string;

  @IsString()
  @IsOptional()
  keyLearnings?: string;

  @IsString()
  @IsOptional()
  facultyAdvisor?: string;
}

export class UpdateSeminarDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  presentationDate?: string;

  @IsString()
  @IsOptional()
  abstractText?: string;

  @IsString()
  @IsOptional()
  slideDeckUrl?: string;

  @IsString()
  @IsOptional()
  slideDeckName?: string;

  @IsString()
  @IsOptional()
  keyLearnings?: string;

  @IsString()
  @IsOptional()
  facultyAdvisor?: string;
}

// 6. Tutorials
export class CreateTutorialDto {
  @IsString()
  @IsOptional()
  studentId?: string;

  @IsString()
  @IsNotEmpty()
  unitTitle: string;

  @IsString()
  @IsOptional()
  subjectCode?: string;

  @IsString()
  @IsNotEmpty()
  problemStatement: string;

  @IsString()
  @IsOptional()
  solutionText?: string;

  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsString()
  @IsOptional()
  fileName?: string;

  @IsString()
  @IsOptional()
  submissionDate?: string;
}

export class UpdateTutorialDto {
  @IsString()
  @IsOptional()
  unitTitle?: string;

  @IsString()
  @IsOptional()
  subjectCode?: string;

  @IsString()
  @IsOptional()
  problemStatement?: string;

  @IsString()
  @IsOptional()
  solutionText?: string;

  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsString()
  @IsOptional()
  fileName?: string;
}

// 7. Technical Activities
export class CreateTechnicalActivityDto {
  @IsString()
  @IsOptional()
  studentId?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  activityType: string; // HACKATHON, WORKSHOP, CERTIFICATION, INDUSTRIAL_VISIT, CONTEST, OTHER

  @IsString()
  @IsOptional()
  organization?: string;

  @IsString()
  @IsOptional()
  eventDate?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  certificateUrl?: string;

  @IsString()
  @IsOptional()
  certificateName?: string;
}

export class UpdateTechnicalActivityDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  activityType?: string;

  @IsString()
  @IsOptional()
  organization?: string;

  @IsString()
  @IsOptional()
  eventDate?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  certificateUrl?: string;

  @IsString()
  @IsOptional()
  certificateName?: string;
}

// 8. Progress Reviews (Review 0 to 3)
export class CreateProjectReviewDto {
  @IsString()
  @IsOptional()
  studentId?: string;

  @IsString()
  @IsNotEmpty()
  reviewStage: string; // REVIEW_0, REVIEW_1, REVIEW_2, REVIEW_3, FINAL_VIVA

  @IsString()
  @IsOptional()
  reviewDate?: string;

  @IsNumber()
  @IsOptional()
  technicalScore?: number;

  @IsNumber()
  @IsOptional()
  documentationScore?: number;

  @IsNumber()
  @IsOptional()
  presentationScore?: number;

  @IsNumber()
  @IsOptional()
  totalScore?: number;

  @IsString()
  @IsOptional()
  feedback?: string;

  @IsString()
  @IsOptional()
  guideRemarks?: string;

  @IsString()
  @IsOptional()
  approvalStatus?: string; // APPROVED, CHANGES_REQUESTED, REJECTED, PENDING
}

// 9. Faculty Remarks
export class CreateFacultyRemarkDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  category: string; // GENERAL, MINI_PROJECT, WEEKLY_LOG, SEMINAR, VIVA

  @IsString()
  @IsNotEmpty()
  remarks: string;

  @IsString()
  @IsOptional()
  actionRequired?: string;

  @IsString()
  @IsOptional()
  deadline?: string;

  @IsString()
  @IsOptional()
  signatureStamp?: string;
}

// 10. Universal Faculty Review Action
export class FacultyReviewActionDto {
  @IsString()
  @IsNotEmpty()
  entityType: string; // WEEKLY_LOG, SEMINAR, TUTORIAL, TECHNICAL_ACTIVITY, PROJECT_REVIEW, MINI_PROJECT

  @IsString()
  @IsNotEmpty()
  entityId: string;

  @IsString()
  @IsNotEmpty()
  approvalStatus: string; // APPROVED, CHANGES_REQUESTED, REJECTED

  @IsNumber()
  @IsOptional()
  marks?: number;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsString()
  @IsOptional()
  signatureStamp?: string;
}

// Legacy DTOs
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
