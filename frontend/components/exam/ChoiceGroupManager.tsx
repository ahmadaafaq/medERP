'use client';

import React from 'react';
import {
  ChoiceGroup,
  OverAttemptPolicy,
  MarksMode,
  QuestionDefinition,
} from '@mederp/shared';
import { I18N_ASSESSMENT, t } from '@mederp/shared';
import { Trash2, AlertTriangle, Layers, Info } from 'lucide-react';

interface ChoiceGroupManagerProps {
  sectionId: string;
  choiceGroups: ChoiceGroup[];
  questionsMap: Record<string, QuestionDefinition>;
  onUpdateGroup: (groupId: string, updates: Partial<ChoiceGroup>) => void;
  onRemoveGroup: (groupId: string) => void;
  onRemoveQuestionFromGroup: (groupId: string, questionId: string) => void;
}

export default function ChoiceGroupManager({
  sectionId,
  choiceGroups,
  questionsMap,
  onUpdateGroup,
  onRemoveGroup,
  onRemoveQuestionFromGroup,
}: ChoiceGroupManagerProps) {
  if (!choiceGroups || choiceGroups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 my-4">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#5B4BFF]">
        <Layers size={14} />
        <span>Choice Groups in this Section ("Attempt any N out of M")</span>
      </div>

      {choiceGroups.map((group) => {
        const m = group.questionIds.length;
        const n = group.requiredToAttempt;
        const isInvalidN = n < 1 || n >= m;

        // Check uniform marks
        const marksList = group.questionIds.map(
          (qId) => questionsMap[qId]?.marks ?? 0,
        );
        const distinctMarks = Array.from(new Set(marksList));
        const hasMismatchedMarks =
          group.marksMode === MarksMode.UNIFORM && distinctMarks.length > 1;

        // Top N marks
        const sortedMarks = [...marksList].sort((a, b) => b - a);
        const effectiveGroupMax = sortedMarks
          .slice(0, Math.min(n, m))
          .reduce((sum, val) => sum + val, 0);

        return (
          <div
            key={group.id}
            className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/70 to-purple-50/50 dark:from-slate-800/80 dark:to-purple-950/20 border-2 border-[#5B4BFF]/30 shadow-sm space-y-3"
          >
            {/* Header: Title, Controls, Disband */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#5B4BFF]/20 pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="w-6 h-6 rounded-full bg-[#5B4BFF] text-white flex items-center justify-center text-xs font-black">
                  ⌥
                </span>
                <input
                  type="text"
                  value={group.name}
                  onChange={(e) =>
                    onUpdateGroup(group.id, { name: e.target.value })
                  }
                  placeholder="Choice Group Name..."
                  className="font-black text-xs text-[#1B1E28] dark:text-white px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 w-52 focus:outline-none focus:border-[#5B4BFF]"
                />
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#5B4BFF] text-white">
                  M = {m} Questions
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#00C48C] text-white">
                  Group Max: {effectiveGroupMax} Marks
                </span>
              </div>

              <button
                type="button"
                onClick={() => onRemoveGroup(group.id)}
                className="text-xs text-[#F04438] hover:text-rose-700 font-black px-2.5 py-1 rounded-lg bg-[#FEECEB] border border-[#F04438]/20 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                title="Disband Choice Group"
              >
                <Trash2 size={12} />
                <span>{t(I18N_ASSESSMENT.CHOICE_GROUP_REMOVE)}</span>
              </button>
            </div>

            {/* Config Row: N, Policy, Marks Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* N: Required to Attempt */}
              <div>
                <label className="block text-[10px] font-black uppercase text-[#1B1E28] dark:text-slate-300 mb-1">
                  Required to Attempt (N) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={Math.max(m - 1, 1)}
                  value={group.requiredToAttempt}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onUpdateGroup(group.id, { requiredToAttempt: val });
                  }}
                  className={`w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border text-xs font-black text-center focus:outline-none ${
                    isInvalidN
                      ? 'border-[#F04438] text-[#F04438]'
                      : 'border-[#5B4BFF]/40 text-[#5B4BFF]'
                  }`}
                />
                <span className="text-[10px] text-[#4E5969] dark:text-slate-400 mt-0.5 block">
                  Must be between 1 and {m - 1}
                </span>
              </div>

              {/* Over-Attempt Policy */}
              <div>
                <label className="block text-[10px] font-black uppercase text-[#1B1E28] dark:text-slate-300 mb-1">
                  Over-Attempt Policy *
                </label>
                <select
                  value={group.overAttemptPolicy}
                  onChange={(e) =>
                    onUpdateGroup(group.id, {
                      overAttemptPolicy: e.target.value as OverAttemptPolicy,
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold text-xs focus:outline-none focus:border-[#5B4BFF]"
                >
                  <option value={OverAttemptPolicy.BEST_N}>
                    {t(I18N_ASSESSMENT.CHOICE_GROUP_POLICY_BEST_N)}
                  </option>
                  <option value={OverAttemptPolicy.FIRST_N}>
                    {t(I18N_ASSESSMENT.CHOICE_GROUP_POLICY_FIRST_N)}
                  </option>
                  <option value={OverAttemptPolicy.REJECT}>
                    {t(I18N_ASSESSMENT.CHOICE_GROUP_POLICY_REJECT)}
                  </option>
                </select>
                <span className="text-[10px] text-[#4E5969] dark:text-slate-400 mt-0.5 block">
                  {group.overAttemptPolicy === OverAttemptPolicy.BEST_N &&
                    'Best N highest scores will be counted.'}
                  {group.overAttemptPolicy === OverAttemptPolicy.FIRST_N &&
                    'First N attempted in paper order will be counted.'}
                  {group.overAttemptPolicy === OverAttemptPolicy.REJECT &&
                    'Submission blocked if student answers > N.'}
                </span>
              </div>

              {/* Marks Mode */}
              <div>
                <label className="block text-[10px] font-black uppercase text-[#1B1E28] dark:text-slate-300 mb-1">
                  Marks Mode *
                </label>
                <select
                  value={group.marksMode}
                  onChange={(e) =>
                    onUpdateGroup(group.id, {
                      marksMode: e.target.value as MarksMode,
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold text-xs focus:outline-none focus:border-[#5B4BFF]"
                >
                  <option value={MarksMode.UNIFORM}>
                    {t(I18N_ASSESSMENT.CHOICE_GROUP_MODE_UNIFORM)}
                  </option>
                  <option value={MarksMode.VARIABLE}>
                    {t(I18N_ASSESSMENT.CHOICE_GROUP_MODE_VARIABLE)}
                  </option>
                </select>
                <span className="text-[10px] text-[#4E5969] dark:text-slate-400 mt-0.5 block">
                  {group.marksMode === MarksMode.UNIFORM
                    ? 'All questions carry equal marks.'
                    : 'Effective max uses sum of top-N marks.'}
                </span>
              </div>
            </div>

            {/* Validation Alerts */}
            {isInvalidN && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-bold">
                <AlertTriangle size={14} />
                <span>
                  Validation Error: Required to attempt (N={n}) must satisfy 1
                  &le; N &lt; M (M={m}).
                </span>
              </div>
            )}

            {hasMismatchedMarks && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-bold">
                <AlertTriangle size={14} />
                <span>
                  Validation Error: UNIFORM marks mode requires all questions to
                  have identical marks. Current marks: {marksList.join(', ')}.
                  Switch to VARIABLE mode or adjust question marks.
                </span>
              </div>
            )}

            {group.marksMode === MarksMode.VARIABLE &&
              distinctMarks.length > 1 && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 font-medium">
                  <Info size={14} />
                  <span>
                    {t(I18N_ASSESSMENT.CHOICE_GROUP_WARNING_VARIABLE, { N: n })}
                  </span>
                </div>
              )}

            {/* Group Questions List */}
            <div className="space-y-2 pt-2 border-t border-[#5B4BFF]/10">
              <div className="text-[11px] font-black uppercase text-[#4E5969] dark:text-slate-400">
                Enclosed Questions in Choice Group:
              </div>
              <div className="space-y-1.5">
                {group.questionIds.map((qId, idx) => {
                  const q = questionsMap[qId];
                  return (
                    <div
                      key={qId}
                      className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="font-mono font-black text-[#5B4BFF] text-[11px]">
                          Choice {idx + 1}.
                        </span>
                        <span className="truncate font-medium text-[#1B1E28] dark:text-slate-200">
                          {q?.text || `Question ID: ${qId}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#EEF2FF] text-[#5B4BFF]">
                          {q?.marks ?? 0} Marks
                        </span>
                        {m > 2 && (
                          <button
                            type="button"
                            onClick={() =>
                              onRemoveQuestionFromGroup(group.id, qId)
                            }
                            className="text-rose-500 hover:text-rose-700 font-bold text-xs p-1"
                            title="Remove question from this choice group"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

