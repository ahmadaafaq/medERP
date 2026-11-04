import { ScoringSettings, OverAttemptPolicy, MarksMode } from '../types/qbank.types';

export const DEFAULT_SCORING_SETTINGS: ScoringSettings = {
  defaultOverAttemptPolicy: OverAttemptPolicy.BEST_N,
  defaultMarksMode: MarksMode.UNIFORM,
  allowPartialCredit: true,
  enforceUniformChoiceMarks: false,
};

export const ASSESSMENT_LIMITS = {
  MIN_CHOICE_GROUP_QUESTIONS: 2,
  MIN_REQUIRED_ATTEMPT: 1,
  DEFAULT_PAPER_DURATION_MINUTES: 60,
  DEFAULT_PASSING_PERCENTAGE: 40,
  MAX_SECTIONS_PER_PAPER: 10,
  MAX_QUESTIONS_PER_PAPER: 200,
  DEFAULT_MCQ_MARKS: 1,
  DEFAULT_SHORT_ANSWER_MARKS: 5,
  DEFAULT_LONG_ANSWER_MARKS: 10,
} as const;

export const PAPER_SET_NAMES = ['Set A', 'Set B', 'Set C', 'Set D'] as const;
