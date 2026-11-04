/**
 * Question Type Registry & Strategy Pattern
 * Extensible strategy pattern for grading and validating question types
 */

import {
  QuestionType,
  QuestionDefinition,
  PartialCreditRule,
} from '../types/qbank.types';

export interface QuestionGradingInput {
  question: QuestionDefinition;
  studentAnswer: unknown;
}

export interface QuestionGradingResult {
  score: number;
  maxScore: number;
  isCorrect: boolean;
  isPartiallyCorrect: boolean;
  feedback?: string;
}

export interface QuestionTypeStrategy {
  type: QuestionType;
  label: string;
  description: string;
  supportsAutoGrading: boolean;
  validate(def: QuestionDefinition): { isValid: boolean; errors: string[] };
  grade(input: QuestionGradingInput): QuestionGradingResult;
}

// 1. MCQ Single Strategy
export class McqSingleStrategy implements QuestionTypeStrategy {
  type = QuestionType.MCQ_SINGLE;
  label = 'Multiple Choice (Single Answer)';
  description = 'Single correct option among multiple choices.';
  supportsAutoGrading = true;

  validate(def: QuestionDefinition) {
    const errors: string[] = [];
    if (!def.options || def.options.length < 2) {
      errors.push('MCQ Single question must have at least 2 options.');
    } else {
      const correctCount = def.options.filter(o => o.isCorrect).length;
      if (correctCount !== 1) {
        errors.push(`MCQ Single question must have exactly 1 correct option. Found ${correctCount}.`);
      }
    }
    return { isValid: errors.length === 0, errors };
  }

  grade({ question, studentAnswer }: QuestionGradingInput): QuestionGradingResult {
    const maxScore = Number(question.marks || 0);
    const correctOption = question.options?.find(o => o.isCorrect);
    const isCorrect = Boolean(correctOption && String(studentAnswer) === String(correctOption.id));

    if (isCorrect) {
      return { score: maxScore, maxScore, isCorrect: true, isPartiallyCorrect: false };
    }

    const penalty = question.negativeMarking?.enabled ? Number(question.negativeMarking.penaltyMarks || 0) : 0;
    return {
      score: penalty > 0 ? -penalty : 0,
      maxScore,
      isCorrect: false,
      isPartiallyCorrect: false,
    };
  }
}

// 2. MCQ Multi Strategy
export class McqMultiStrategy implements QuestionTypeStrategy {
  type = QuestionType.MCQ_MULTI;
  label = 'Multiple Choice (Multiple Correct Answers)';
  description = 'One or more correct options with optional partial credit.';
  supportsAutoGrading = true;

  validate(def: QuestionDefinition) {
    const errors: string[] = [];
    if (!def.options || def.options.length < 2) {
      errors.push('MCQ Multi question must have at least 2 options.');
    } else {
      const correctCount = def.options.filter(o => o.isCorrect).length;
      if (correctCount < 1) {
        errors.push('MCQ Multi question must have at least 1 correct option.');
      }
    }
    return { isValid: errors.length === 0, errors };
  }

  grade({ question, studentAnswer }: QuestionGradingInput): QuestionGradingResult {
    const maxScore = Number(question.marks || 0);
    const selectedIds = Array.isArray(studentAnswer) ? studentAnswer.map(String) : [];
    const correctOptions = question.options?.filter(o => o.isCorrect) || [];
    const correctIds = new Set(correctOptions.map(o => String(o.id)));

    const correctlySelected = selectedIds.filter(id => correctIds.has(id)).length;
    const incorrectlySelected = selectedIds.filter(id => !correctIds.has(id)).length;

    const isAllCorrect = correctlySelected === correctIds.size && incorrectlySelected === 0;
    if (isAllCorrect) {
      return { score: maxScore, maxScore, isCorrect: true, isPartiallyCorrect: false };
    }

    // Partial Credit
    if (question.partialCreditRule === PartialCreditRule.PROPORTIONAL && correctIds.size > 0) {
      const fraction = Math.max(0, (correctlySelected - incorrectlySelected) / correctIds.size);
      const partialScore = Math.round(fraction * maxScore * 100) / 100;
      return {
        score: partialScore,
        maxScore,
        isCorrect: false,
        isPartiallyCorrect: partialScore > 0,
      };
    }

    const penalty = question.negativeMarking?.enabled ? Number(question.negativeMarking.penaltyMarks || 0) : 0;
    return {
      score: penalty > 0 ? -penalty : 0,
      maxScore,
      isCorrect: false,
      isPartiallyCorrect: false,
    };
  }
}

// 3. True / False Strategy
export class TrueFalseStrategy implements QuestionTypeStrategy {
  type = QuestionType.TRUE_FALSE;
  label = 'True / False';
  description = 'Binary true or false determination.';
  supportsAutoGrading = true;

  validate(def: QuestionDefinition) {
    const errors: string[] = [];
    if (!def.options || def.options.length !== 2) {
      errors.push('True/False question must have exactly 2 options (True and False).');
    }
    return { isValid: errors.length === 0, errors };
  }

  grade({ question, studentAnswer }: QuestionGradingInput): QuestionGradingResult {
    const maxScore = Number(question.marks || 0);
    const correctOption = question.options?.find(o => o.isCorrect);
    const isCorrect = Boolean(
      correctOption && String(studentAnswer).toLowerCase() === String(correctOption.text).toLowerCase(),
    );

    return {
      score: isCorrect ? maxScore : 0,
      maxScore,
      isCorrect,
      isPartiallyCorrect: false,
    };
  }
}

// 4. Short Answer Strategy
export class ShortAnswerStrategy implements QuestionTypeStrategy {
  type = QuestionType.SHORT_ANSWER;
  label = 'Short Answer';
  description = 'Brief text response requiring manual or keyword evaluation.';
  supportsAutoGrading = false;

  validate(def: QuestionDefinition) {
    const errors: string[] = [];
    if (!def.text || def.text.trim().length === 0) {
      errors.push('Short answer question prompt cannot be empty.');
    }
    return { isValid: errors.length === 0, errors };
  }

  grade({ question, studentAnswer }: QuestionGradingInput): QuestionGradingResult {
    const maxScore = Number(question.marks || 0);
    if (typeof studentAnswer === 'number') {
      const awarded = Math.min(Math.max(studentAnswer, 0), maxScore);
      return {
        score: awarded,
        maxScore,
        isCorrect: awarded === maxScore,
        isPartiallyCorrect: awarded > 0 && awarded < maxScore,
      };
    }
    return { score: 0, maxScore, isCorrect: false, isPartiallyCorrect: false, feedback: 'Requires manual grading' };
  }
}

// 5. Long Answer Strategy
export class LongAnswerStrategy implements QuestionTypeStrategy {
  type = QuestionType.LONG_ANSWER;
  label = 'Long Answer / Descriptive';
  description = 'Detailed essay or problem-solving response graded by faculty.';
  supportsAutoGrading = false;

  validate(def: QuestionDefinition) {
    const errors: string[] = [];
    if (!def.text || def.text.trim().length === 0) {
      errors.push('Descriptive question prompt cannot be empty.');
    }
    return { isValid: errors.length === 0, errors };
  }

  grade({ question, studentAnswer }: QuestionGradingInput): QuestionGradingResult {
    const maxScore = Number(question.marks || 0);
    if (typeof studentAnswer === 'number') {
      const awarded = Math.min(Math.max(studentAnswer, 0), maxScore);
      return {
        score: awarded,
        maxScore,
        isCorrect: awarded === maxScore,
        isPartiallyCorrect: awarded > 0 && awarded < maxScore,
      };
    }
    return { score: 0, maxScore, isCorrect: false, isPartiallyCorrect: false, feedback: 'Requires faculty evaluation' };
  }
}

// 6. Numeric Strategy
export class NumericStrategy implements QuestionTypeStrategy {
  type = QuestionType.NUMERIC;
  label = 'Numeric';
  description = 'Numerical response with configurable tolerance / margin of error.';
  supportsAutoGrading = true;

  validate(def: QuestionDefinition) {
    const errors: string[] = [];
    if (def.acceptedNumericValue === undefined || isNaN(Number(def.acceptedNumericValue))) {
      errors.push('Numeric question must define an acceptedNumericValue.');
    }
    return { isValid: errors.length === 0, errors };
  }

  grade({ question, studentAnswer }: QuestionGradingInput): QuestionGradingResult {
    const maxScore = Number(question.marks || 0);
    const target = Number(question.acceptedNumericValue);
    const tolerance = Number(question.numericTolerance || 0);
    const studentNum = Number(studentAnswer);

    if (isNaN(studentNum)) {
      return { score: 0, maxScore, isCorrect: false, isPartiallyCorrect: false };
    }

    const diff = Math.abs(studentNum - target);
    const isCorrect = diff <= tolerance;

    return {
      score: isCorrect ? maxScore : 0,
      maxScore,
      isCorrect,
      isPartiallyCorrect: false,
    };
  }
}

// 7. Fill in the Blank Strategy
export class FillInBlankStrategy implements QuestionTypeStrategy {
  type = QuestionType.FILL_IN_BLANK;
  label = 'Fill in the Blank';
  description = 'Exact or case-insensitive keyword matching.';
  supportsAutoGrading = true;

  validate(def: QuestionDefinition) {
    const errors: string[] = [];
    if (!def.fillBlankKeywords || def.fillBlankKeywords.length === 0) {
      errors.push('Fill in Blank question must specify at least one acceptable keyword.');
    }
    return { isValid: errors.length === 0, errors };
  }

  grade({ question, studentAnswer }: QuestionGradingInput): QuestionGradingResult {
    const maxScore = Number(question.marks || 0);
    const cleanStudent = String(studentAnswer || '').trim().toLowerCase();
    const keywords = (question.fillBlankKeywords || []).map(k => k.trim().toLowerCase());
    const isCorrect = keywords.includes(cleanStudent);

    return {
      score: isCorrect ? maxScore : 0,
      maxScore,
      isCorrect,
      isPartiallyCorrect: false,
    };
  }
}

// 8. File Upload Strategy
export class FileUploadStrategy implements QuestionTypeStrategy {
  type = QuestionType.FILE_UPLOAD;
  label = 'File Upload';
  description = 'Student uploads PDF, image, code, or document for manual assessment.';
  supportsAutoGrading = false;

  validate(def: QuestionDefinition) {
    return { isValid: true, errors: [] };
  }

  grade({ question, studentAnswer }: QuestionGradingInput): QuestionGradingResult {
    const maxScore = Number(question.marks || 0);
    if (typeof studentAnswer === 'number') {
      const awarded = Math.min(Math.max(studentAnswer, 0), maxScore);
      return {
        score: awarded,
        maxScore,
        isCorrect: awarded === maxScore,
        isPartiallyCorrect: awarded > 0 && awarded < maxScore,
      };
    }
    return { score: 0, maxScore, isCorrect: false, isPartiallyCorrect: false, feedback: 'Pending document grading' };
  }
}

/**
 * Question Type Registry Pattern
 */
export class QuestionTypeRegistry {
  private strategies = new Map<QuestionType, QuestionTypeStrategy>();

  constructor() {
    this.register(new McqSingleStrategy());
    this.register(new McqMultiStrategy());
    this.register(new TrueFalseStrategy());
    this.register(new ShortAnswerStrategy());
    this.register(new LongAnswerStrategy());
    this.register(new NumericStrategy());
    this.register(new FillInBlankStrategy());
    this.register(new FileUploadStrategy());
  }

  register(strategy: QuestionTypeStrategy) {
    this.strategies.set(strategy.type, strategy);
  }

  get(type: QuestionType): QuestionTypeStrategy | undefined {
    return this.strategies.get(type);
  }

  getAll(): QuestionTypeStrategy[] {
    return Array.from(this.strategies.values());
  }
}

export const questionTypeRegistry = new QuestionTypeRegistry();
