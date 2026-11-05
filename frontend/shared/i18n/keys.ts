/**
 * i18n Keys and Dictionary for Assessment & Question Bank Designer
 * Zero hardcoded text rule compliance
 */

export const I18N_ASSESSMENT = {
  // Page & Header Titles
  TITLE_FACULTY_DESIGNER: 'faculty_assessment_designer_title',
  SUBTITLE_FACULTY_DESIGNER: 'faculty_assessment_designer_subtitle',
  SECTION_CONFIGURED_TITLE: 'section_configured_title',
  ADD_NEW_SECTION: 'add_new_section',
  CREATE_NEW_PAPER: 'create_new_paper',
  EDITING_PAPER_TITLE: 'editing_paper_title',
  SAVED_SUCCESS: 'paper_saved_success',
  SAVED_ERROR: 'paper_saved_error',
  SUBMITTED_DQAC: 'paper_submitted_dqac',
  LOCKED_MESSAGE: 'paper_locked_message',

  // Choice Groups
  CHOICE_GROUP_TITLE: 'choice_group_title',
  CHOICE_GROUP_CREATE: 'choice_group_create',
  CHOICE_GROUP_WRAP_BTN: 'choice_group_wrap_btn',
  CHOICE_GROUP_REMOVE: 'choice_group_remove',
  CHOICE_GROUP_ATTEMPT_LABEL: 'choice_group_attempt_label',
  CHOICE_GROUP_POLICY_BEST_N: 'choice_group_policy_best_n',
  CHOICE_GROUP_POLICY_FIRST_N: 'choice_group_policy_first_n',
  CHOICE_GROUP_POLICY_REJECT: 'choice_group_policy_reject',
  CHOICE_GROUP_MODE_UNIFORM: 'choice_group_mode_uniform',
  CHOICE_GROUP_MODE_VARIABLE: 'choice_group_mode_variable',
  CHOICE_GROUP_WARNING_VARIABLE: 'choice_group_warning_variable',
  CHOICE_GROUP_COUNTED_BADGE: 'choice_group_counted_badge',
  CHOICE_GROUP_IGNORED_BADGE: 'choice_group_ignored_badge',

  // Scoring & Preview
  SCORING_EFFECTIVE_MAX: 'scoring_effective_max',
  SCORING_OBTAINED: 'scoring_obtained',
  SCORING_PERCENTAGE: 'scoring_percentage',
  SCORING_LIVE_PREVIEW: 'scoring_live_preview',
  SCORING_REJECT_ERROR: 'scoring_reject_error',

  // Blueprint
  BLUEPRINT_TITLE: 'blueprint_title',
  BLUEPRINT_GENERATE: 'blueprint_generate',
  BLUEPRINT_REROLL: 'blueprint_reroll',
  BLUEPRINT_CRITERIA_ADD: 'blueprint_criteria_add',
  BLUEPRINT_INSUFFICIENT_POOL: 'blueprint_insufficient_pool',
} as const;

export type I18nKey = typeof I18N_ASSESSMENT[keyof typeof I18N_ASSESSMENT];

export const I18N_STRINGS_EN: Record<string, string> = {
  [I18N_ASSESSMENT.TITLE_FACULTY_DESIGNER]: 'FACULTY ASSESSMENT & QUESTION BANK DESIGNER',
  [I18N_ASSESSMENT.SUBTITLE_FACULTY_DESIGNER]: 'Design outcome-based question papers, configure choice groups, and preview scoring semantics.',
  [I18N_ASSESSMENT.SECTION_CONFIGURED_TITLE]: 'EXAMINATION PAPER SECTIONS',
  [I18N_ASSESSMENT.ADD_NEW_SECTION]: 'Add New Section (A, B, C...)',
  [I18N_ASSESSMENT.CREATE_NEW_PAPER]: 'Create New Exam Paper',
  [I18N_ASSESSMENT.EDITING_PAPER_TITLE]: 'Modify Examination Paper',
  [I18N_ASSESSMENT.SAVED_SUCCESS]: 'Question paper saved successfully.',
  [I18N_ASSESSMENT.SAVED_ERROR]: 'Failed to save question paper.',
  [I18N_ASSESSMENT.SUBMITTED_DQAC]: 'Question paper submitted for DQAC Quality Audit approval.',
  [I18N_ASSESSMENT.LOCKED_MESSAGE]: 'This question paper is approved/published and locked against direct edits. Clone to create a new version.',
  [I18N_ASSESSMENT.CHOICE_GROUP_TITLE]: 'Choice Group (Attempt any {N} of {M})',
  [I18N_ASSESSMENT.CHOICE_GROUP_CREATE]: 'Create Choice Group',
  [I18N_ASSESSMENT.CHOICE_GROUP_WRAP_BTN]: 'Wrap Selected in Choice Group',
  [I18N_ASSESSMENT.CHOICE_GROUP_REMOVE]: 'Disband Choice Group',
  [I18N_ASSESSMENT.CHOICE_GROUP_ATTEMPT_LABEL]: 'Required to Attempt (N):',
  [I18N_ASSESSMENT.CHOICE_GROUP_POLICY_BEST_N]: 'Best N (Count top-scoring answers)',
  [I18N_ASSESSMENT.CHOICE_GROUP_POLICY_FIRST_N]: 'First N (Count in chronological order)',
  [I18N_ASSESSMENT.CHOICE_GROUP_POLICY_REJECT]: 'Reject Over-Attempts (Block > N)',
  [I18N_ASSESSMENT.CHOICE_GROUP_MODE_UNIFORM]: 'Uniform Marks',
  [I18N_ASSESSMENT.CHOICE_GROUP_MODE_VARIABLE]: 'Variable Marks',
  [I18N_ASSESSMENT.CHOICE_GROUP_WARNING_VARIABLE]: 'Fairness notice: Marks differ across choices in this group. Effective max calculates from sum of top-{N} question marks.',
  [I18N_ASSESSMENT.CHOICE_GROUP_COUNTED_BADGE]: 'COUNTED IN SCORE',
  [I18N_ASSESSMENT.CHOICE_GROUP_IGNORED_BADGE]: 'OPTIONAL / IGNORED',
  [I18N_ASSESSMENT.SCORING_EFFECTIVE_MAX]: 'Effective Maximum Marks',
  [I18N_ASSESSMENT.SCORING_OBTAINED]: 'Marks Obtained',
  [I18N_ASSESSMENT.SCORING_PERCENTAGE]: 'Score Percentage',
  [I18N_ASSESSMENT.SCORING_LIVE_PREVIEW]: 'Live Scoring & Attempt Preview',
  [I18N_ASSESSMENT.SCORING_REJECT_ERROR]: 'Submission rejected: Choice group "{name}" allows maximum {N} attempts, but {attempted} were submitted.',
  [I18N_ASSESSMENT.BLUEPRINT_TITLE]: 'Auto-Generate Paper from Blueprint',
  [I18N_ASSESSMENT.BLUEPRINT_GENERATE]: 'Generate from Blueprint',
  [I18N_ASSESSMENT.BLUEPRINT_REROLL]: 'Re-roll Random Pick',
  [I18N_ASSESSMENT.BLUEPRINT_CRITERIA_ADD]: 'Add Blueprint Rule',
  [I18N_ASSESSMENT.BLUEPRINT_INSUFFICIENT_POOL]: 'Insufficient questions in Question Bank for rule: {rule}. Available: {available}, Required: {required}.',
};

export function t(key: string, params?: Record<string, string | number>): string {
  let val = I18N_STRINGS_EN[key] || key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      val = val.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return val;
}

