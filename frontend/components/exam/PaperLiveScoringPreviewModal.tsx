'use client';

import React, { useState, useMemo } from 'react';
import {
  PaperSnapshot,
  StudentAttempt,
  computePaperScore,
  QuestionDefinition,
} from '@mederp/shared';
import { I18N_ASSESSMENT, t } from '@mederp/shared';
import { X, CheckCircle, AlertTriangle, Eye, RefreshCw, BarChart2 } from 'lucide-react';

interface PaperLiveScoringPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  paper: any;
  questionsMap: Record<string, QuestionDefinition>;
}

export default function PaperLiveScoringPreviewModal({
  isOpen,
  onClose,
  paper,
  questionsMap,
}: PaperLiveScoringPreviewModalProps) {
  // Simulated student answers: questionId -> { attempted: boolean, score: number }
  const [simAnswers, setSimAnswers] = useState<
    Record<string, { attempted: boolean; score: number }>
  >({});

  // Prepare normalized paper snapshot
  const paperSnapshot: PaperSnapshot = useMemo(() => {
    let rawSecs = paper?.sections;
    if (typeof rawSecs === 'string') {
      try {
        rawSecs = JSON.parse(rawSecs);
      } catch {
        rawSecs = [];
      }
    }
    const sections = Array.isArray(rawSecs) ? rawSecs : [];

    return {
      id: paper?.id || 'preview-id',
      code: paper?.code || 'EXAM-CODE',
      name: paper?.name || 'Examination Paper',
      durationMinutes: paper?.duration_minutes || 60,
      passingMarksPercentage: 40,
      status: paper?.status || ('DRAFT' as any),
      version: Number(paper?.version || 1),
      sections,
      questions: questionsMap,
      effectiveMaxMarks: Number(paper?.max_marks || 0),
    };
  }, [paper, questionsMap]);

  // Real-time pure computePaperScore execution
  const scoringResult = useMemo(() => {
    const studentAnswers: Record<string, any> = {};
    let orderIdx = 0;

    for (const sec of paperSnapshot.sections) {
      for (const qId of sec.questionIds || []) {
        const qDef = questionsMap[qId];
        const maxMarks = qDef ? Number(qDef.marks || 1) : 1;
        const currentSim = simAnswers[qId];
        const isAttempted =
          currentSim !== undefined ? currentSim.attempted : true; // Default to attempted for initial preview
        const rawScore =
          currentSim !== undefined ? currentSim.score : maxMarks;

        studentAnswers[qId] = {
          questionId: qId,
          attempted: isAttempted,
          rawScore: isAttempted ? rawScore : 0,
          paperOrderIndex: orderIdx++,
        };
      }
    }

    const studentAttempt: StudentAttempt = {
      studentId: 'simulated-student',
      paperId: paperSnapshot.id,
      answers: studentAnswers,
    };

    return computePaperScore(paperSnapshot, studentAttempt);
  }, [paperSnapshot, questionsMap, simAnswers]);

  if (!isOpen || !paper) return null;

  const handleToggleAttempt = (qId: string, currentScore: number) => {
    setSimAnswers((prev) => {
      const isAttempted = prev[qId] ? prev[qId].attempted : true;
      return {
        ...prev,
        [qId]: {
          attempted: !isAttempted,
          score: !isAttempted ? currentScore : 0,
        },
      };
    });
  };

  const handleScoreChange = (qId: string, score: number) => {
    setSimAnswers((prev) => ({
      ...prev,
      [qId]: {
        attempted: true,
        score,
      },
    }));
  };

  const handleResetToFullScore = () => {
    setSimAnswers({});
  };

  const countedSet = new Set(scoringResult.countedQuestionIds);
  const ignoredSet = new Set(scoringResult.ignoredQuestionIds);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-[24px] max-w-4xl w-full max-h-[92vh] shadow-2xl flex flex-col overflow-hidden border border-[#E7EAF3] dark:border-slate-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-[#2D2575] to-[#5B4BFF] text-white">
          <div className="flex items-center gap-2">
            <Eye size={20} className="text-[#00C48C]" />
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider">
                {t(I18N_ASSESSMENT.SCORING_LIVE_PREVIEW)}
              </h3>
              <p className="text-[11px] text-white/80">
                Interactive scoring simulation powered by the single source of
                truth pure engine.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToFullScore}
              className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <RefreshCw size={12} />
              <span>Full Attempt</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 transition-all text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Live Score KPI Bar */}
        <div className="px-6 py-4 bg-[#F8FAFC] dark:bg-slate-800/80 border-b border-[#E7EAF3] dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#5B4BFF] flex items-center justify-center font-black">
              🎯
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-[#4E5969] dark:text-slate-400 block">
                {t(I18N_ASSESSMENT.SCORING_EFFECTIVE_MAX)}
              </span>
              <span className="text-xl font-black text-[#5B4BFF]">
                {scoringResult.effectiveMax} Marks
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E6F9F3] text-[#00C48C] flex items-center justify-center font-black">
              📊
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-[#4E5969] dark:text-slate-400 block">
                {t(I18N_ASSESSMENT.SCORING_OBTAINED)}
              </span>
              <span className="text-xl font-black text-[#00C48C]">
                {scoringResult.obtained} Marks
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF4EC] text-[#F36C21] flex items-center justify-center font-black">
              📈
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-[#4E5969] dark:text-slate-400 block">
                {t(I18N_ASSESSMENT.SCORING_PERCENTAGE)}
              </span>
              <span className="text-xl font-black text-[#F36C21]">
                {scoringResult.percentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Body: Sections, Choice Groups, Counted vs Ignored */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {scoringResult.isRejected && (
            <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-800 flex items-start gap-3">
              <AlertTriangle size={20} className="shrink-0 text-rose-600 mt-0.5" />
              <div>
                <span className="font-black text-xs uppercase block">
                  Submission Blocked / Rejected Under REJECT Policy
                </span>
                <p className="text-[11px] mt-0.5">
                  {scoringResult.errors.join('; ')}
                </p>
              </div>
            </div>
          )}

          {paperSnapshot.sections.map((sec, secIdx) => {
            const groupsMap: Record<string, any> = {};
            const questionInGroup = new Set<string>();

            (sec.choiceGroups || []).forEach((g) => {
              groupsMap[g.id] = g;
              g.questionIds.forEach((qId) => questionInGroup.add(qId));
            });

            return (
              <div
                key={sec.id}
                className="p-5 rounded-2xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-[#E7EAF3] dark:border-slate-700 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-700 pb-2">
                  <h4 className="font-black text-xs text-[#1B1E28] dark:text-white uppercase">
                    Section {secIdx + 1}: {sec.name} ({sec.type})
                  </h4>
                  <span className="text-[11px] font-bold text-[#4E5969]">
                    {sec.instructions || 'Standard Section Instructions'}
                  </span>
                </div>

                {/* Render Choice Groups inside Section */}
                {(sec.choiceGroups || []).map((group) => {
                  const breakdown = scoringResult.perGroupBreakdown.find(
                    (b) => b.groupId === group.id,
                  );

                  return (
                    <div
                      key={group.id}
                      className="p-4 rounded-xl bg-indigo-50/60 dark:bg-slate-900/60 border border-[#5B4BFF]/30 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#5B4BFF]/20 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-[#5B4BFF]">
                            ⌥ {group.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#5B4BFF] text-white">
                            Attempt any {group.requiredToAttempt} of{' '}
                            {group.totalQuestions}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-700">
                            Policy: {group.overAttemptPolicy}
                          </span>
                        </div>

                        {breakdown && (
                          <div className="text-[11px] font-black text-[#00C48C]">
                            Obtained: {breakdown.groupObtainedMarks} /{' '}
                            {breakdown.groupEffectiveMax} Marks
                          </div>
                        )}
                      </div>

                      {/* Question items in choice group */}
                      <div className="space-y-2">
                        {group.questionIds.map((qId, qIdx) => {
                          const q = questionsMap[qId];
                          const maxMarks = q ? Number(q.marks || 1) : 1;
                          const currentSim = simAnswers[qId];
                          const isAttempted =
                            currentSim !== undefined
                              ? currentSim.attempted
                              : true;
                          const studentScore =
                            currentSim !== undefined
                              ? currentSim.score
                              : maxMarks;

                          const isCounted = countedSet.has(qId);
                          const isIgnored = ignoredSet.has(qId);

                          return (
                            <div
                              key={qId}
                              className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                                isCounted
                                  ? 'bg-emerald-50/50 border-emerald-300 dark:bg-emerald-950/20'
                                  : isIgnored
                                  ? 'bg-slate-100/70 border-slate-300 dark:bg-slate-800/40 opacity-75'
                                  : 'bg-white border-[#E7EAF3]'
                              }`}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isAttempted}
                                  onChange={() =>
                                    handleToggleAttempt(qId, maxMarks)
                                  }
                                  className="w-4 h-4 rounded text-[#5B4BFF] focus:ring-0 cursor-pointer"
                                  title="Toggle attempt"
                                />

                                <div className="truncate">
                                  <span className="font-black text-[#5B4BFF] mr-2">
                                    Choice {qIdx + 1}.
                                  </span>
                                  <span className="font-medium text-[#1B1E28] dark:text-slate-200">
                                    {q?.text || `Question ${qId}`}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {isAttempted ? (
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-bold text-[#4E5969]">
                                      Score:
                                    </span>
                                    <input
                                      type="number"
                                      min={0}
                                      max={maxMarks}
                                      value={studentScore}
                                      onChange={(e) =>
                                        handleScoreChange(
                                          qId,
                                          Number(e.target.value),
                                        )
                                      }
                                      className="w-14 px-1.5 py-1 rounded-lg border border-[#E7EAF3] text-center font-black text-xs bg-white dark:bg-slate-900"
                                    />
                                    <span className="text-[10px] text-[#4E5969]">
                                      / {maxMarks}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-bold italic">
                                    Not Attempted
                                  </span>
                                )}

                                {isCounted && (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#00C48C] text-white flex items-center gap-1 shadow-sm">
                                    <CheckCircle size={11} />
                                    <span>
                                      {t(
                                        I18N_ASSESSMENT.CHOICE_GROUP_COUNTED_BADGE,
                                      )}
                                    </span>
                                  </span>
                                )}

                                {isIgnored && (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                                    {t(
                                      I18N_ASSESSMENT.CHOICE_GROUP_IGNORED_BADGE,
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Render Mandatory questions in section */}
                {sec.questionIds
                  .filter((qId) => !questionInGroup.has(qId))
                  .map((qId, qIdx) => {
                    const q = questionsMap[qId];
                    const maxMarks = q ? Number(q.marks || 1) : 1;
                    const currentSim = simAnswers[qId];
                    const isAttempted =
                      currentSim !== undefined ? currentSim.attempted : true;
                    const studentScore =
                      currentSim !== undefined ? currentSim.score : maxMarks;

                    return (
                      <div
                        key={qId}
                        className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isAttempted}
                            onChange={() => handleToggleAttempt(qId, maxMarks)}
                            className="w-4 h-4 rounded text-[#5B4BFF] focus:ring-0 cursor-pointer"
                          />
                          <div className="truncate">
                            <span className="font-black text-[#1B1E28] dark:text-white mr-2">
                              Q{qIdx + 1}.
                            </span>
                            <span className="font-medium text-[#1B1E28] dark:text-slate-200">
                              {q?.text || `Question ${qId}`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-100 text-slate-600">
                            Mandatory
                          </span>

                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={maxMarks}
                              value={isAttempted ? studentScore : 0}
                              disabled={!isAttempted}
                              onChange={(e) =>
                                handleScoreChange(qId, Number(e.target.value))
                              }
                              className="w-14 px-1.5 py-1 rounded-lg border border-[#E7EAF3] text-center font-black text-xs bg-white dark:bg-slate-900 disabled:opacity-50"
                            />
                            <span className="text-[10px] text-[#4E5969]">
                              / {maxMarks}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between bg-[#F8FAFC] dark:bg-slate-800/40">
          <div className="text-[11px] text-[#4E5969] dark:text-slate-400 font-medium">
            💡 Notice: Unattempted optional questions in choice groups never
            reduce the percentage because effective max is bounded to top-N.
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4E3EFF] text-white font-black text-xs shadow-md transition-all"
          >
            Done Previewing
          </button>
        </div>
      </div>
    </div>
  );
}

