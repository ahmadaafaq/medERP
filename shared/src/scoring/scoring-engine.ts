/**
 * Single Source of Truth for Scoring Logic
 * Pure, framework-free TypeScript module — used by both NestJS and Next.js
 */

import {
  PaperSnapshot,
  StudentAttempt,
  ScoringSettings,
  ScoringResult,
  ChoiceGroup,
  ChoiceGroupScoringBreakdown,
  OverAttemptPolicy,
  MarksMode,
  QuestionDefinition,
} from '../types/qbank.types';
import { DEFAULT_SCORING_SETTINGS, ASSESSMENT_LIMITS } from '../constants/settings.constants';
import { I18N_ASSESSMENT, t } from '../i18n/keys';

export interface ChoiceGroupValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a single choice group against its questions and constraints
 */
export function validateChoiceGroup(
  group: ChoiceGroup,
  questionsMap: Record<string, QuestionDefinition>,
): ChoiceGroupValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const m = group.questionIds.length;
  const n = group.requiredToAttempt;

  if (m < ASSESSMENT_LIMITS.MIN_CHOICE_GROUP_QUESTIONS) {
    errors.push(
      `Choice group "${group.name}" must contain at least ${ASSESSMENT_LIMITS.MIN_CHOICE_GROUP_QUESTIONS} questions. Found ${m}.`,
    );
  }

  if (n < ASSESSMENT_LIMITS.MIN_REQUIRED_ATTEMPT || n >= m) {
    errors.push(
      `Choice group "${group.name}" required attempts (N=${n}) must satisfy 1 <= N < M (M=${m}).`,
    );
  }

  // Check questions exist
  const groupQuestions: QuestionDefinition[] = [];
  for (const qId of group.questionIds) {
    const q = questionsMap[qId];
    if (!q) {
      errors.push(`Question with ID "${qId}" in choice group "${group.name}" was not found in paper.`);
    } else {
      groupQuestions.push(q);
    }
  }

  // Marks uniformity check
  if (groupQuestions.length > 0) {
    const distinctMarks = Array.from(new Set(groupQuestions.map(q => Number(q.marks))));
    if (group.marksMode === MarksMode.UNIFORM) {
      if (distinctMarks.length > 1) {
        errors.push(
          `Choice group "${group.name}" is set to UNIFORM marks mode, but questions have differing marks (${distinctMarks.join(', ')}). All questions in a UNIFORM group must carry identical marks.`,
        );
      }
    } else if (group.marksMode === MarksMode.VARIABLE) {
      if (distinctMarks.length > 1) {
        warnings.push(
          t(I18N_ASSESSMENT.CHOICE_GROUP_WARNING_VARIABLE, { N: n }),
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates the complete paper snapshot structure, ensuring:
 * 1. Choice groups are nested in sections, never inside other choice groups.
 * 2. Every question belongs to at most one choice group.
 * 3. Choice group constraints are met.
 */
export function validatePaperSnapshot(paper: PaperSnapshot): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const assignedQuestionToGroup = new Map<string, string>();

  for (const section of paper.sections) {
    const sectionQuestionSet = new Set(section.questionIds);
    const groupsToProcess: ChoiceGroup[] = [...(section.choiceGroups || [])];

    // Section-level choice rule fallback
    if (groupsToProcess.length === 0 && section.attemptRule === 'CHOICE' && section.questionIds.length > 0) {
      const m = section.questionIds.length;
      const n = section.requiredToAttempt ?? (m > 1 ? m - 1 : 1);
      groupsToProcess.push({
        id: `sec-cg-${section.id}`,
        name: `${section.name} (Attempt any ${n} of ${m})`,
        sectionId: section.id,
        questionIds: [...section.questionIds],
        totalQuestions: m,
        requiredToAttempt: n,
        overAttemptPolicy: section.overAttemptPolicy || OverAttemptPolicy.BEST_N,
        marksMode: MarksMode.UNIFORM,
      });
    }

    for (const group of groupsToProcess) {
      // Validate group membership
      for (const qId of group.questionIds) {
        if (!sectionQuestionSet.has(qId)) {
          errors.push(
            `Question "${qId}" in choice group "${group.name}" does not belong to parent section "${section.name}".`,
          );
        }

        const existingGroup = assignedQuestionToGroup.get(qId);
        if (existingGroup) {
          errors.push(
            `Question "${qId}" is assigned to multiple choice groups ("${existingGroup}" and "${group.name}"). A question must belong to at most one choice group.`,
          );
        } else {
          assignedQuestionToGroup.set(qId, group.name);
        }
      }

      // Individual group validation
      const groupVal = validateChoiceGroup(group, paper.questions);
      errors.push(...groupVal.errors);
      warnings.push(...groupVal.warnings);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Computes the effective maximum marks of a paper snapshot dynamically.
 * Formula:
 * effectiveMax = Σ(mandatory questions) + Σ over choice groups ( sum of top-N marks among questions )
 */
export function computeEffectiveMax(paper: PaperSnapshot): { effectiveMax: number; warnings: string[] } {
  const warnings: string[] = [];
  let effectiveMax = 0;

  // Track which questions are in choice groups
  const choiceQuestionIds = new Set<string>();

  for (const section of paper.sections) {
    // Add practical marks if practical section
    if (section.type === 'PRACTICAL' && section.practicalMarks) {
      effectiveMax += Number(section.practicalMarks);
    }

    const groupsToProcess: ChoiceGroup[] = [...(section.choiceGroups || [])];
    if (groupsToProcess.length === 0 && section.attemptRule === 'CHOICE' && section.questionIds.length > 0) {
      const m = section.questionIds.length;
      const n = Math.min(Math.max(section.requiredToAttempt ?? (m > 1 ? m - 1 : 1), 1), Math.max(m, 1));
      groupsToProcess.push({
        id: `sec-cg-${section.id}`,
        name: `${section.name} (Attempt any ${n} of ${m})`,
        sectionId: section.id,
        questionIds: [...section.questionIds],
        totalQuestions: m,
        requiredToAttempt: n,
        overAttemptPolicy: section.overAttemptPolicy || OverAttemptPolicy.BEST_N,
        marksMode: MarksMode.UNIFORM,
      });
    }

    for (const group of groupsToProcess) {
      for (const qId of group.questionIds) {
        choiceQuestionIds.add(qId);
      }

      const m = group.questionIds.length;
      const n = Math.min(Math.max(group.requiredToAttempt, 1), Math.max(m, 1));

      // Get marks of questions in group
      const marksList: number[] = group.questionIds.map(qId => {
        const q = paper.questions[qId];
        return q ? Number(q.marks) : 0;
      });

      // Sort marks descending
      marksList.sort((a, b) => b - a);

      // Sum top N marks
      const topNMarks = marksList.slice(0, n).reduce((sum, val) => sum + val, 0);
      effectiveMax += topNMarks;

      if (group.marksMode === MarksMode.VARIABLE) {
        warnings.push(
          t(I18N_ASSESSMENT.CHOICE_GROUP_WARNING_VARIABLE, { N: n }),
        );
      }
    }

    // Add mandatory questions in this section
    for (const qId of section.questionIds) {
      if (!choiceQuestionIds.has(qId)) {
        const q = paper.questions[qId];
        if (q) {
          effectiveMax += Number(q.marks || 0);
        }
      }
    }
  }

  return {
    effectiveMax,
    warnings,
  };
}

/**
 * Pure framework-free scoring function.
 *
 * Scoring Semantics:
 * effectiveMax = Σ(marks of mandatory questions)
 *              + Σ over choice groups ( sum of the top-N marks among the group's questions )
 *
 * obtained     = Σ(mandatory scores)
 *              + Σ over choice groups ( sum of scores of the N counted answers per overAttemptPolicy )
 *
 * percentage   = effectiveMax > 0 ? (obtained / effectiveMax) * 100 : 0
 *
 * Unattempted optional questions NEVER reduce a student's percentage.
 */
export function computePaperScore(
  paper: PaperSnapshot,
  attempt: StudentAttempt,
  settings: Partial<ScoringSettings> = {},
): ScoringResult {
  const mergedSettings: ScoringSettings = {
    ...DEFAULT_SCORING_SETTINGS,
    ...settings,
  };

  const countedQuestionIds: string[] = [];
  const ignoredQuestionIds: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const perGroupBreakdown: ChoiceGroupScoringBreakdown[] = [];

  let effectiveMax = 0;
  let obtained = 0;
  let isRejected = false;

  // Set of all question IDs assigned to any choice group
  const choiceGroupQuestionIds = new Set<string>();

  for (const section of paper.sections) {
    // Add practical marks if applicable
    if (section.type === 'PRACTICAL' && section.practicalMarks) {
      effectiveMax += Number(section.practicalMarks);
    }

    const groupsToProcess: ChoiceGroup[] = [...(section.choiceGroups || [])];
    if (groupsToProcess.length === 0 && section.attemptRule === 'CHOICE' && section.questionIds.length > 0) {
      const m = section.questionIds.length;
      const n = Math.min(Math.max(section.requiredToAttempt ?? (m > 1 ? m - 1 : 1), 1), Math.max(m, 1));
      groupsToProcess.push({
        id: `sec-cg-${section.id}`,
        name: `${section.name} (Attempt any ${n} of ${m})`,
        sectionId: section.id,
        questionIds: [...section.questionIds],
        totalQuestions: m,
        requiredToAttempt: n,
        overAttemptPolicy: section.overAttemptPolicy || OverAttemptPolicy.BEST_N,
        marksMode: MarksMode.UNIFORM,
      });
    }

    for (const group of groupsToProcess) {
      for (const qId of group.questionIds) {
        choiceGroupQuestionIds.add(qId);
      }

      const policy = group.overAttemptPolicy || mergedSettings.defaultOverAttemptPolicy;
      const marksMode = group.marksMode || mergedSettings.defaultMarksMode;
      const m = group.questionIds.length;
      const n = Math.min(Math.max(group.requiredToAttempt, 1), Math.max(m, 1));

      // Calculate Group Effective Max (Sum of top-N marks among questions in group)
      const groupQuestionMarks = group.questionIds.map(qId => {
        const q = paper.questions[qId];
        return q ? Number(q.marks) : 0;
      });
      groupQuestionMarks.sort((a, b) => b - a);
      const groupEffectiveMax = groupQuestionMarks.slice(0, n).reduce((sum, val) => sum + val, 0);
      effectiveMax += groupEffectiveMax;

      if (marksMode === MarksMode.VARIABLE) {
        warnings.push(
          t(I18N_ASSESSMENT.CHOICE_GROUP_WARNING_VARIABLE, { N: n }),
        );
      }

      // Collect student answers for this choice group
      interface AttemptedItem {
        questionId: string;
        rawScore: number;
        paperOrderIndex: number;
        attemptTimestamp: number;
        attempted: boolean;
      }

      const groupAttemptedItems: AttemptedItem[] = [];
      const groupUnattemptedIds: string[] = [];

      group.questionIds.forEach((qId, idx) => {
        const ans = attempt.answers[qId];
        if (ans && ans.attempted) {
          groupAttemptedItems.push({
            questionId: qId,
            rawScore: Number(ans.rawScore || 0),
            paperOrderIndex: ans.paperOrderIndex !== undefined ? ans.paperOrderIndex : idx,
            attemptTimestamp: ans.attemptTimestamp || idx,
            attempted: true,
          });
        } else {
          groupUnattemptedIds.push(qId);
        }
      });

      const attemptedCount = groupAttemptedItems.length;

      // Handle REJECT Policy
      if (policy === OverAttemptPolicy.REJECT && attemptedCount > n) {
        isRejected = true;
        const errMsg = t(I18N_ASSESSMENT.SCORING_REJECT_ERROR, {
          name: group.name,
          N: n,
          attempted: attemptedCount,
        });
        errors.push(errMsg);
      }

      // Sort attempted items according to Policy
      if (policy === OverAttemptPolicy.BEST_N) {
        // Sort descending by rawScore; tie-break deterministically by paperOrderIndex ascending
        groupAttemptedItems.sort((a, b) => {
          if (b.rawScore !== a.rawScore) {
            return b.rawScore - a.rawScore;
          }
          return a.paperOrderIndex - b.paperOrderIndex;
        });
      } else {
        // FIRST_N or REJECT: sort by paperOrderIndex / timestamp ascending
        groupAttemptedItems.sort((a, b) => {
          if (a.attemptTimestamp !== b.attemptTimestamp) {
            return a.attemptTimestamp - b.attemptTimestamp;
          }
          return a.paperOrderIndex - b.paperOrderIndex;
        });
      }

      // Select top N counted items
      const countedItems = groupAttemptedItems.slice(0, n);
      const ignoredAttemptedItems = groupAttemptedItems.slice(n);

      const groupCountedIds = countedItems.map(item => item.questionId);
      const groupIgnoredIds = [
        ...ignoredAttemptedItems.map(item => item.questionId),
        ...groupUnattemptedIds,
      ];

      const groupObtainedMarks = countedItems.reduce((acc, item) => acc + item.rawScore, 0);
      obtained += groupObtainedMarks;

      countedQuestionIds.push(...groupCountedIds);
      ignoredQuestionIds.push(...groupIgnoredIds);

      perGroupBreakdown.push({
        groupId: group.id,
        groupName: group.name,
        requiredToAttempt: n,
        totalQuestions: m,
        attemptedCount,
        countedQuestionIds: groupCountedIds,
        ignoredQuestionIds: groupIgnoredIds,
        groupEffectiveMax,
        groupObtainedMarks,
        overAttemptPolicy: policy,
        marksMode,
      });
    }

    // Process Mandatory Questions (questions not part of any choice group)
    for (const qId of section.questionIds) {
      if (!choiceGroupQuestionIds.has(qId)) {
        const q = paper.questions[qId];
        const qMarks = q ? Number(q.marks || 0) : 0;
        effectiveMax += qMarks;

        const ans = attempt.answers[qId];
        if (ans && ans.attempted) {
          obtained += Number(ans.rawScore || 0);
          countedQuestionIds.push(qId);
        } else {
          // Unattempted mandatory question is counted in effectiveMax, contributes 0 to obtained
          countedQuestionIds.push(qId);
        }
      }
    }
  }

  const rawPct = effectiveMax > 0 ? (obtained / effectiveMax) * 100 : 0;
  // Round percentage to 2 decimal places
  const percentage = Math.round(rawPct * 100) / 100;

  return {
    effectiveMax,
    obtained,
    percentage,
    perGroupBreakdown,
    countedQuestionIds,
    ignoredQuestionIds,
    warnings,
    errors,
    isRejected,
  };
}

