/**
 * Q-Bank & Examination Paper Designer Types
 * Pure TypeScript — No framework dependencies
 */

export enum PaperStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  POSTPONED = 'POSTPONED',
}

export enum QuestionType {
  MCQ_SINGLE = 'MCQ_SINGLE',
  MCQ_MULTI = 'MCQ_MULTI',
  TRUE_FALSE = 'TRUE_FALSE',
  SHORT_ANSWER = 'SHORT_ANSWER',
  LONG_ANSWER = 'LONG_ANSWER',
  NUMERIC = 'NUMERIC',
  FILL_IN_BLANK = 'FILL_IN_BLANK',
  FILE_UPLOAD = 'FILE_UPLOAD',
}

export enum BloomLevel {
  L1_REMEMBER = 'REMEMBER',
  L2_UNDERSTAND = 'UNDERSTAND',
  L3_APPLY = 'APPLY',
  L4_ANALYZE = 'ANALYZE',
  L5_EVALUATE = 'EVALUATE',
  L6_CREATE = 'CREATE',
}

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  EXPERT = 'EXPERT',
}

export enum OverAttemptPolicy {
  BEST_N = 'BEST_N',
  FIRST_N = 'FIRST_N',
  REJECT = 'REJECT',
}

export enum MarksMode {
  UNIFORM = 'UNIFORM',
  VARIABLE = 'VARIABLE',
}

export enum PartialCreditRule {
  NONE = 'NONE',
  PROPORTIONAL = 'PROPORTIONAL',
  PENALTY_FOR_INCORRECT = 'PENALTY_FOR_INCORRECT',
}

export interface QuestionNegativeMarking {
  enabled: boolean;
  penaltyMarks: number;
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface QuestionDefinition {
  id: string;
  code?: string;
  text: string;
  type: QuestionType;
  marks: number;
  negativeMarking?: QuestionNegativeMarking;
  partialCreditRule?: PartialCreditRule;
  topicId?: string;
  topicName?: string;
  topicCode?: string;
  unitId?: string;
  unitCode?: string;
  unitName?: string;
  bloomLevel?: BloomLevel;
  difficulty?: DifficultyLevel;
  competencyCode?: string;
  tags?: string[];
  options?: QuestionOption[];
  modelAnswer?: string;
  numericTolerance?: number;
  acceptedNumericValue?: number;
  fillBlankKeywords?: string[];
  maxUploadSizeBytes?: number;
  allowedFileExtensions?: string[];
}

export interface ChoiceGroup {
  id: string;
  name: string;
  sectionId: string;
  questionIds: string[];
  totalQuestions: number;
  requiredToAttempt: number;
  overAttemptPolicy: OverAttemptPolicy;
  marksMode: MarksMode;
  uniformMarks?: number;
  instructions?: string;
}

export interface PaperSection {
  id: string;
  name: string;
  order: number;
  type: string;
  instructions?: string;
  questionIds: string[];
  choiceGroups: ChoiceGroup[];
  practicalMarks?: number;
  // Section-level choice & attempt configuration
  attemptRule?: 'ALL' | 'CHOICE';
  targetQuestionsCount?: number;
  requiredToAttempt?: number;
  overAttemptPolicy?: OverAttemptPolicy;
  defaultMarksPerQuestion?: number;
}

export interface PaperMetadata {
  id: string;
  code: string;
  name: string;
  title?: string;
  courseCd?: string;
  courseName?: string;
  branchCd?: string;
  branchName?: string;
  batchCd?: string;
  batchName?: string;
  semester?: string;
  section?: string;
  subjectId?: string;
  subjectCode?: string;
  subjectName?: string;
  durationMinutes: number;
  instructions?: string;
  passingMarksPercentage: number;
  status: PaperStatus;
  version: number;
  paperSet?: string;
  targetSections?: string[];
  isTemplate?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface PaperSnapshot extends PaperMetadata {
  sections: PaperSection[];
  questions: Record<string, QuestionDefinition>;
  effectiveMaxMarks: number;
}

export interface QuestionAnswer {
  questionId: string;
  attempted: boolean;
  paperOrderIndex: number;
  rawScore: number;
  attemptTimestamp?: number;
  studentResponse?: unknown;
}

export interface StudentAttempt {
  attemptId?: string;
  studentId: string;
  paperId: string;
  answers: Record<string, QuestionAnswer>;
  submissionTimestamp?: number;
}

export interface ScoringSettings {
  defaultOverAttemptPolicy: OverAttemptPolicy;
  defaultMarksMode: MarksMode;
  allowPartialCredit: boolean;
  enforceUniformChoiceMarks: boolean;
}

export interface ChoiceGroupScoringBreakdown {
  groupId: string;
  groupName: string;
  requiredToAttempt: number;
  totalQuestions: number;
  attemptedCount: number;
  countedQuestionIds: string[];
  ignoredQuestionIds: string[];
  groupEffectiveMax: number;
  groupObtainedMarks: number;
  overAttemptPolicy: OverAttemptPolicy;
  marksMode: MarksMode;
}

export interface ScoringResult {
  effectiveMax: number;
  obtained: number;
  percentage: number;
  perGroupBreakdown: ChoiceGroupScoringBreakdown[];
  countedQuestionIds: string[];
  ignoredQuestionIds: string[];
  warnings: string[];
  errors: string[];
  isRejected: boolean;
}

export interface BlueprintCriterion {
  id: string;
  topicId?: string;
  topicName?: string;
  unitCode?: string;
  difficulty?: DifficultyLevel;
  bloomLevel?: BloomLevel;
  questionType?: QuestionType;
  count: number;
  marksPerQuestion: number;
}

export interface BlueprintConfig {
  name: string;
  criteria: BlueprintCriterion[];
}
