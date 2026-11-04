const {
  computePaperScore,
  computeEffectiveMax,
  validateChoiceGroup,
} = require('../dist/scoring/scoring-engine');
const {
  PaperStatus,
  QuestionType,
  OverAttemptPolicy,
  MarksMode,
} = require('../dist/types/qbank.types');

function createMockQuestion(id, marks) {
  return {
    id,
    text: `Question ${id}`,
    type: QuestionType.MCQ_SINGLE,
    marks,
  };
}

function runTests() {
  console.log('--- RUNNING SCORING ENGINE TESTS ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, msg) {
    if (condition) {
      console.log(`✓ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${msg}`);
      failed++;
    }
  }

  // TEST 1: Mandatory Questions Only
  {
    const q1 = createMockQuestion('q1', 10);
    const q2 = createMockQuestion('q2', 20);
    const paper = {
      id: 'p1',
      code: 'PAP-01',
      name: 'Mandatory Only',
      durationMinutes: 60,
      passingMarksPercentage: 40,
      status: PaperStatus.DRAFT,
      version: 1,
      sections: [
        {
          id: 's1',
          name: 'Section A',
          order: 1,
          type: 'THEORY',
          questionIds: ['q1', 'q2'],
          choiceGroups: [],
        },
      ],
      questions: { q1, q2 },
      effectiveMaxMarks: 30,
    };

    const attempt = {
      studentId: 'st1',
      paperId: 'p1',
      answers: {
        q1: { questionId: 'q1', attempted: true, rawScore: 10, paperOrderIndex: 0 },
        q2: { questionId: 'q2', attempted: true, rawScore: 15, paperOrderIndex: 1 },
      },
    };

    const res = computePaperScore(paper, attempt);
    assert(res.effectiveMax === 30, 'Mandatory effectiveMax is 30');
    assert(res.obtained === 25, 'Mandatory obtained is 25');
    assert(res.percentage === 83.33, `Mandatory percentage is 83.33% (got ${res.percentage})`);
  }

  // TEST 2: Choice Group BEST_N (Attempt any 2 of 3)
  {
    const q1 = createMockQuestion('q1', 10);
    const q2 = createMockQuestion('q2', 10);
    const q3 = createMockQuestion('q3', 10);

    const paper = {
      id: 'p2',
      code: 'PAP-02',
      name: 'Choice Group Paper',
      durationMinutes: 60,
      passingMarksPercentage: 40,
      status: PaperStatus.DRAFT,
      version: 1,
      sections: [
        {
          id: 's1',
          name: 'Section A',
          order: 1,
          type: 'THEORY',
          questionIds: ['q1', 'q2', 'q3'],
          choiceGroups: [
            {
              id: 'cg1',
              name: 'Group 1',
              sectionId: 's1',
              questionIds: ['q1', 'q2', 'q3'],
              totalQuestions: 3,
              requiredToAttempt: 2,
              overAttemptPolicy: OverAttemptPolicy.BEST_N,
              marksMode: MarksMode.UNIFORM,
            },
          ],
        },
      ],
      questions: { q1, q2, q3 },
      effectiveMaxMarks: 20,
    };

    // Case 2A: Student attempts Q1 and Q2 only, Q3 unattempted
    const attempt2A = {
      studentId: 'st1',
      paperId: 'p2',
      answers: {
        q1: { questionId: 'q1', attempted: true, rawScore: 10, paperOrderIndex: 0 },
        q2: { questionId: 'q2', attempted: true, rawScore: 10, paperOrderIndex: 1 },
      },
    };
    const res2A = computePaperScore(paper, attempt2A);
    assert(res2A.effectiveMax === 20, 'Choice Group effectiveMax is 20 (not 30)');
    assert(res2A.obtained === 20, 'Choice Group obtained is 20');
    assert(res2A.percentage === 100, 'Unattempted optional Q3 does NOT reduce percentage (100%)');
    assert(res2A.ignoredQuestionIds.includes('q3'), 'Q3 is marked as ignored');

    // Case 2B: Student attempts all 3 questions under BEST_N: Q1=6, Q2=10, Q3=9
    const attempt2B = {
      studentId: 'st2',
      paperId: 'p2',
      answers: {
        q1: { questionId: 'q1', attempted: true, rawScore: 6, paperOrderIndex: 0 },
        q2: { questionId: 'q2', attempted: true, rawScore: 10, paperOrderIndex: 1 },
        q3: { questionId: 'q3', attempted: true, rawScore: 9, paperOrderIndex: 2 },
      },
    };
    const res2B = computePaperScore(paper, attempt2B);
    assert(res2B.effectiveMax === 20, 'BEST_N effectiveMax is 20');
    assert(res2B.obtained === 19, `BEST_N counts top 2: Q2 (10) + Q3 (9) = 19 (got ${res2B.obtained})`);
    assert(res2B.countedQuestionIds.includes('q2') && res2B.countedQuestionIds.includes('q3'), 'Counted question IDs are Q2 and Q3');
    assert(res2B.ignoredQuestionIds.includes('q1'), 'Lower scoring Q1 (6 marks) is ignored');

    // Case 2C: Student attempts only 1 question (Q1=7)
    const attempt2C = {
      studentId: 'st3',
      paperId: 'p2',
      answers: {
        q1: { questionId: 'q1', attempted: true, rawScore: 7, paperOrderIndex: 0 },
      },
    };
    const res2C = computePaperScore(paper, attempt2C);
    assert(res2C.effectiveMax === 20, 'Effective max remains 20 when student under-attempts');
    assert(res2C.obtained === 7, 'Obtained is 7');
    assert(res2C.percentage === 35, 'Percentage is 35% (7 / 20 * 100)');
  }

  // TEST 3: Choice Group FIRST_N Policy
  {
    const q1 = createMockQuestion('q1', 10);
    const q2 = createMockQuestion('q2', 10);
    const q3 = createMockQuestion('q3', 10);

    const paper = {
      id: 'p3',
      code: 'PAP-03',
      name: 'First N Paper',
      durationMinutes: 60,
      passingMarksPercentage: 40,
      status: PaperStatus.DRAFT,
      version: 1,
      sections: [
        {
          id: 's1',
          name: 'Section A',
          order: 1,
          type: 'THEORY',
          questionIds: ['q1', 'q2', 'q3'],
          choiceGroups: [
            {
              id: 'cg1',
              name: 'Group 1',
              sectionId: 's1',
              questionIds: ['q1', 'q2', 'q3'],
              totalQuestions: 3,
              requiredToAttempt: 2,
              overAttemptPolicy: OverAttemptPolicy.FIRST_N,
              marksMode: MarksMode.UNIFORM,
            },
          ],
        },
      ],
      questions: { q1, q2, q3 },
      effectiveMaxMarks: 20,
    };

    // Student attempts Q1 (5), Q2 (8), Q3 (10) in paper order
    const attempt = {
      studentId: 'st4',
      paperId: 'p3',
      answers: {
        q1: { questionId: 'q1', attempted: true, rawScore: 5, paperOrderIndex: 0 },
        q2: { questionId: 'q2', attempted: true, rawScore: 8, paperOrderIndex: 1 },
        q3: { questionId: 'q3', attempted: true, rawScore: 10, paperOrderIndex: 2 },
      },
    };

    const res = computePaperScore(paper, attempt);
    assert(res.obtained === 13, `FIRST_N scores first 2 attempted: Q1 (5) + Q2 (8) = 13 (got ${res.obtained})`);
    assert(res.ignoredQuestionIds.includes('q3'), 'Third attempted question Q3 is ignored under FIRST_N');
  }

  // TEST 4: Choice Group REJECT Policy
  {
    const q1 = createMockQuestion('q1', 10);
    const q2 = createMockQuestion('q2', 10);
    const q3 = createMockQuestion('q3', 10);

    const paper = {
      id: 'p4',
      code: 'PAP-04',
      name: 'Reject Paper',
      durationMinutes: 60,
      passingMarksPercentage: 40,
      status: PaperStatus.DRAFT,
      version: 1,
      sections: [
        {
          id: 's1',
          name: 'Section A',
          order: 1,
          type: 'THEORY',
          questionIds: ['q1', 'q2', 'q3'],
          choiceGroups: [
            {
              id: 'cg1',
              name: 'Group 1',
              sectionId: 's1',
              questionIds: ['q1', 'q2', 'q3'],
              totalQuestions: 3,
              requiredToAttempt: 2,
              overAttemptPolicy: OverAttemptPolicy.REJECT,
              marksMode: MarksMode.UNIFORM,
            },
          ],
        },
      ],
      questions: { q1, q2, q3 },
      effectiveMaxMarks: 20,
    };

    const attempt = {
      studentId: 'st5',
      paperId: 'p4',
      answers: {
        q1: { questionId: 'q1', attempted: true, rawScore: 10, paperOrderIndex: 0 },
        q2: { questionId: 'q2', attempted: true, rawScore: 10, paperOrderIndex: 1 },
        q3: { questionId: 'q3', attempted: true, rawScore: 10, paperOrderIndex: 2 },
      },
    };

    const res = computePaperScore(paper, attempt);
    assert(res.isRejected === true, 'REJECT policy marks attempt as isRejected=true when over-attempted');
    assert(res.errors.length > 0, 'REJECT policy reports error message for over-attempt');
  }

  // TEST 5: Choice Group with VARIABLE Marks (Sum of top-N marks)
  {
    const q1 = createMockQuestion('q1', 15);
    const q2 = createMockQuestion('q2', 10);
    const q3 = createMockQuestion('q3', 5);

    const paper = {
      id: 'p5',
      code: 'PAP-05',
      name: 'Variable Marks Paper',
      durationMinutes: 60,
      passingMarksPercentage: 40,
      status: PaperStatus.DRAFT,
      version: 1,
      sections: [
        {
          id: 's1',
          name: 'Section A',
          order: 1,
          type: 'THEORY',
          questionIds: ['q1', 'q2', 'q3'],
          choiceGroups: [
            {
              id: 'cg1',
              name: 'Group 1',
              sectionId: 's1',
              questionIds: ['q1', 'q2', 'q3'],
              totalQuestions: 3,
              requiredToAttempt: 2,
              overAttemptPolicy: OverAttemptPolicy.BEST_N,
              marksMode: MarksMode.VARIABLE,
            },
          ],
        },
      ],
      questions: { q1, q2, q3 },
      effectiveMaxMarks: 25,
    };

    const effRes = computeEffectiveMax(paper);
    assert(effRes.effectiveMax === 25, `VARIABLE marks effectiveMax is sum of top 2 (15 + 10 = 25, got ${effRes.effectiveMax})`);
    assert(effRes.warnings.length > 0, 'VARIABLE marks emits fairness warning');
  }

  // TEST 6: Validation Constraints
  {
    const q1 = createMockQuestion('q1', 10);
    const q2 = createMockQuestion('q2', 5);

    // Uniform mode with different marks should fail
    const groupUniformFail = {
      id: 'cg1',
      name: 'Invalid Uniform',
      sectionId: 's1',
      questionIds: ['q1', 'q2'],
      totalQuestions: 2,
      requiredToAttempt: 1,
      overAttemptPolicy: OverAttemptPolicy.BEST_N,
      marksMode: MarksMode.UNIFORM,
    };
    const valFail = validateChoiceGroup(groupUniformFail, { q1, q2 });
    assert(valFail.isValid === false, 'UNIFORM mode fails validation when marks differ');

    // N >= M should fail
    const groupNExceedsM = {
      id: 'cg2',
      name: 'Invalid N',
      sectionId: 's1',
      questionIds: ['q1', 'q2'],
      totalQuestions: 2,
      requiredToAttempt: 2, // Must be 1 <= N < M
      overAttemptPolicy: OverAttemptPolicy.BEST_N,
      marksMode: MarksMode.VARIABLE,
    };
    const valNFail = validateChoiceGroup(groupNExceedsM, { q1, q2 });
    assert(valNFail.isValid === false, 'N >= M fails validation (requires 1 <= N < M)');
  }

  // TEST 8: User scenario: Section with 7 questions added, examiner requires attempting any 5 (5 marks each)
  {
    const q1 = createMockQuestion('q1', 5);
    const q2 = createMockQuestion('q2', 5);
    const q3 = createMockQuestion('q3', 5);
    const q4 = createMockQuestion('q4', 5);
    const q5 = createMockQuestion('q5', 5);
    const q6 = createMockQuestion('q6', 5);
    const q7 = createMockQuestion('q7', 5);

    const paper = {
      id: 'p-7-choose-5',
      code: 'PAP-08',
      name: 'Attempt 5 of 7 Paper',
      durationMinutes: 120,
      passingMarksPercentage: 40,
      status: PaperStatus.DRAFT,
      version: 1,
      sections: [
        {
          id: 'sec-a',
          name: 'Section A (Descriptive)',
          order: 1,
          type: 'DESC',
          questionIds: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7'],
          choiceGroups: [],
          attemptRule: 'CHOICE',
          targetQuestionsCount: 7,
          requiredToAttempt: 5,
          overAttemptPolicy: OverAttemptPolicy.BEST_N,
        },
      ],
      questions: { q1, q2, q3, q4, q5, q6, q7 },
      effectiveMaxMarks: 25,
    };

    // 1. Verify Effective Max is 25 (NOT 35)
    const effective = computeEffectiveMax(paper);
    assert(effective.effectiveMax === 25, `Section with 7 questions (5m each) attempt any 5 has effectiveMax = 25 (got ${effective.effectiveMax})`);

    // 2. Student attempts exactly 5 questions (scores 5 on each)
    const attempt1 = {
      studentId: 'st_5_of_7',
      paperId: 'p-7-choose-5',
      answers: {
        q1: { questionId: 'q1', attempted: true, rawScore: 5, paperOrderIndex: 0 },
        q2: { questionId: 'q2', attempted: true, rawScore: 5, paperOrderIndex: 1 },
        q3: { questionId: 'q3', attempted: true, rawScore: 5, paperOrderIndex: 2 },
        q4: { questionId: 'q4', attempted: true, rawScore: 5, paperOrderIndex: 3 },
        q5: { questionId: 'q5', attempted: true, rawScore: 5, paperOrderIndex: 4 },
      },
    };
    const res1 = computePaperScore(paper, attempt1);
    assert(res1.obtained === 25, `Student scored 25 marks on 5 attempted questions (got ${res1.obtained})`);
    assert(res1.percentage === 100, `Student percentage is 100% (25/25), unattempted 2 optional questions do not reduce percentage (got ${res1.percentage})`);
    assert(res1.countedQuestionIds.length === 5, 'Exactly 5 questions counted');
    assert(res1.ignoredQuestionIds.length === 2, 'Remaining 2 optional questions ignored');

    // 3. Student attempts all 7 questions under BEST_N (scores: 5, 5, 5, 4, 3, 2, 1)
    const attempt2 = {
      studentId: 'st_all_7',
      paperId: 'p-7-choose-5',
      answers: {
        q1: { questionId: 'q1', attempted: true, rawScore: 5, paperOrderIndex: 0 },
        q2: { questionId: 'q2', attempted: true, rawScore: 5, paperOrderIndex: 1 },
        q3: { questionId: 'q3', attempted: true, rawScore: 5, paperOrderIndex: 2 },
        q4: { questionId: 'q4', attempted: true, rawScore: 4, paperOrderIndex: 3 },
        q5: { questionId: 'q5', attempted: true, rawScore: 3, paperOrderIndex: 4 },
        q6: { questionId: 'q6', attempted: true, rawScore: 2, paperOrderIndex: 5 },
        q7: { questionId: 'q7', attempted: true, rawScore: 1, paperOrderIndex: 6 },
      },
    };
    const res2 = computePaperScore(paper, attempt2);
    // Top 5 scores are: 5 + 5 + 5 + 4 + 3 = 22
    assert(res2.obtained === 22, `Student who attempts all 7 has top 5 counted: 5+5+5+4+3 = 22 (got ${res2.obtained})`);
    assert(res2.effectiveMax === 25, `Effective max remains 25 (not 35) (got ${res2.effectiveMax})`);
    assert(res2.percentage === 88, `Percentage is 22/25 * 100 = 88% (got ${res2.percentage})`);
    assert(res2.ignoredQuestionIds.includes('q6') && res2.ignoredQuestionIds.includes('q7'), 'Lowest 2 scoring questions (q6, q7) are ignored');
  }

  console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  if (failed > 0) process.exit(1);
}

runTests();

