/**
 * Question Blueprint Auto-Generation Module
 * Pure, framework-free generator with seedable pseudo-random re-roll support
 */

import {
  QuestionDefinition,
  BlueprintCriterion,
} from '../types/qbank.types';
import { I18N_ASSESSMENT, t } from '../i18n/keys';

export interface BlueprintGenerationResult {
  selectedQuestions: QuestionDefinition[];
  selectedQuestionIds: string[];
  totalGeneratedMarks: number;
  unmetCriteria: Array<{
    criterion: BlueprintCriterion;
    requested: number;
    found: number;
  }>;
  warnings: string[];
}

/** Simple linear congruential generator for deterministic re-rolls */
function pseudoRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Shuffle array deterministically with a random generator */
function shuffle<T>(array: T[], random: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * Auto-generates questions from a blueprint configuration against the master question bank.
 */
export function generateQuestionsFromBlueprint(
  bank: QuestionDefinition[],
  criteria: BlueprintCriterion[],
  seed: number = Date.now(),
): BlueprintGenerationResult {
  const random = pseudoRandom(seed);
  const selectedQuestions: QuestionDefinition[] = [];
  const chosenIds = new Set<string>();
  const unmetCriteria: BlueprintGenerationResult['unmetCriteria'] = [];
  const warnings: string[] = [];

  for (const crit of criteria) {
    // Filter matching candidate questions
    const candidates = bank.filter(q => {
      if (chosenIds.has(q.id)) return false;

      if (crit.topicId && q.topicId && q.topicId !== crit.topicId) {
        return false;
      }
      if (crit.unitCode && q.unitCode && q.unitCode !== crit.unitCode) {
        return false;
      }
      if (crit.difficulty && q.difficulty && q.difficulty !== crit.difficulty) {
        return false;
      }
      if (crit.bloomLevel && q.bloomLevel && q.bloomLevel !== crit.bloomLevel) {
        return false;
      }
      if (crit.questionType && q.type !== crit.questionType) {
        return false;
      }
      return true;
    });

    const shuffled = shuffle(candidates, random);
    const countToPick = Math.min(crit.count, shuffled.length);
    const picked = shuffled.slice(0, countToPick);

    for (const q of picked) {
      chosenIds.add(q.id);
      // If criterion specifies custom marks, clone question with custom marks
      const questionWithMarks: QuestionDefinition = {
        ...q,
        marks: crit.marksPerQuestion ? Number(crit.marksPerQuestion) : Number(q.marks || 1),
      };
      selectedQuestions.push(questionWithMarks);
    }

    if (countToPick < crit.count) {
      unmetCriteria.push({
        criterion: crit,
        requested: crit.count,
        found: countToPick,
      });
      warnings.push(
        t(I18N_ASSESSMENT.BLUEPRINT_INSUFFICIENT_POOL, {
          rule: `${crit.difficulty || 'ANY'} / ${crit.topicName || crit.unitCode || 'ANY'}`,
          available: countToPick,
          required: crit.count,
        }),
      );
    }
  }

  const totalGeneratedMarks = selectedQuestions.reduce((sum, q) => sum + Number(q.marks || 0), 0);

  return {
    selectedQuestions,
    selectedQuestionIds: selectedQuestions.map(q => q.id),
    totalGeneratedMarks,
    unmetCriteria,
    warnings,
  };
}

