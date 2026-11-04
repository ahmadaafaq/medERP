'use client';

import React, { useState } from 'react';
import {
  BlueprintCriterion,
  DifficultyLevel,
  BloomLevel,
  QuestionType,
  QuestionDefinition,
} from '@mederp/shared';
import { I18N_ASSESSMENT, t } from '@mederp/shared';
import { X, Sparkles, RefreshCw, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

interface PaperBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableTopics: Array<{ id: string; name: string; code?: string }>;
  availableUnits: Array<{ id: string; name: string; code?: string }>;
  onApplyBlueprintQuestions: (questions: QuestionDefinition[]) => void;
  tenantSlug: string;
  subjectId?: string;
  subjectCode?: string;
}

export default function PaperBlueprintModal({
  isOpen,
  onClose,
  availableTopics,
  availableUnits,
  onApplyBlueprintQuestions,
  tenantSlug,
  subjectId,
  subjectCode,
}: PaperBlueprintModalProps) {
  const [criteria, setCriteria] = useState<BlueprintCriterion[]>([
    {
      id: 'crit-1',
      difficulty: DifficultyLevel.EASY,
      count: 5,
      marksPerQuestion: 2,
    },
    {
      id: 'crit-2',
      difficulty: DifficultyLevel.MEDIUM,
      count: 3,
      marksPerQuestion: 5,
    },
    {
      id: 'crit-3',
      difficulty: DifficultyLevel.HARD,
      count: 2,
      marksPerQuestion: 10,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{
    selectedQuestions: QuestionDefinition[];
    totalGeneratedMarks: number;
    warnings: string[];
  } | null>(null);

  if (!isOpen) return null;

  const handleAddCriterion = () => {
    setCriteria((prev) => [
      ...prev,
      {
        id: `crit-${Date.now()}`,
        difficulty: DifficultyLevel.MEDIUM,
        count: 2,
        marksPerQuestion: 5,
      },
    ]);
  };

  const handleRemoveCriterion = (id: string) => {
    setCriteria((prev) => prev.filter((c) => c.id !== id));
  };

  const handleUpdateCriterion = (
    id: string,
    updates: Partial<BlueprintCriterion>,
  ) => {
    setCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    );
  };

  const handleGenerate = async (seed: number = Date.now()) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/exams/blueprint/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant': tenantSlug,
        },
        body: JSON.stringify({
          criteria,
          seed,
          subjectId,
          subjectCode,
        }),
      });
      const data = await res.json();
      if (data) {
        setGeneratedResult(data);
      }
    } catch (e) {
      console.error('Blueprint generation error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (generatedResult && generatedResult.selectedQuestions.length > 0) {
      onApplyBlueprintQuestions(generatedResult.selectedQuestions);
      onClose();
    }
  };

  const totalRequestedMarks = criteria.reduce(
    (sum, c) => sum + (c.count || 0) * (c.marksPerQuestion || 0),
    0,
  );
  const totalRequestedQuestions = criteria.reduce(
    (sum, c) => sum + (c.count || 0),
    0,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-[24px] max-w-3xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-[#E7EAF3] dark:border-slate-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-[#2D2575] to-[#5B4BFF] text-white">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-[#F36C21]" />
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider">
                {t(I18N_ASSESSMENT.BLUEPRINT_TITLE)}
              </h3>
              <p className="text-[11px] text-white/80">
                Assemble balanced question sections by topic, difficulty, Bloom
                level, and marks with instant re-roll.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-all text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Summary Bar */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-[#E7EAF3] dark:border-slate-700 flex items-center justify-between gap-4">
            <div>
              <span className="font-bold text-[#4E5969] dark:text-slate-400">
                Blueprint Scope:
              </span>
              <div className="font-black text-sm text-[#1B1E28] dark:text-white mt-0.5">
                {totalRequestedQuestions} Questions &bull; {totalRequestedMarks}{' '}
                Marks Target
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddCriterion}
              className="px-3.5 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4E3EFF] text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus size={14} />
              <span>{t(I18N_ASSESSMENT.BLUEPRINT_CRITERIA_ADD)}</span>
            </button>
          </div>

          {/* Criteria List */}
          <div className="space-y-3">
            {criteria.map((crit, idx) => (
              <div
                key={crit.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center gap-3"
              >
                <span className="font-black text-[#5B4BFF] text-xs w-6 shrink-0">
                  #{idx + 1}
                </span>

                {/* Topic / CO */}
                <div className="flex-1 w-full md:w-auto">
                  <label className="block text-[10px] font-bold text-[#4E5969] mb-1">
                    Topic / CO
                  </label>
                  <select
                    value={crit.topicId || 'ALL'}
                    onChange={(e) =>
                      handleUpdateCriterion(crit.id, {
                        topicId:
                          e.target.value === 'ALL' ? undefined : e.target.value,
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-xl border border-[#E7EAF3] text-xs font-bold text-[#1B1E28] dark:bg-slate-900 dark:border-slate-700"
                  >
                    <option value="ALL">Any Topic / Entire Syllabus</option>
                    {availableTopics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Difficulty */}
                <div className="w-full md:w-32">
                  <label className="block text-[10px] font-bold text-[#4E5969] mb-1">
                    Difficulty
                  </label>
                  <select
                    value={crit.difficulty || 'ANY'}
                    onChange={(e) =>
                      handleUpdateCriterion(crit.id, {
                        difficulty:
                          e.target.value === 'ANY'
                            ? undefined
                            : (e.target.value as DifficultyLevel),
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-xl border border-[#E7EAF3] text-xs font-bold text-[#1B1E28] dark:bg-slate-900 dark:border-slate-700"
                  >
                    <option value="ANY">Any</option>
                    <option value={DifficultyLevel.EASY}>Easy</option>
                    <option value={DifficultyLevel.MEDIUM}>Medium</option>
                    <option value={DifficultyLevel.HARD}>Hard</option>
                    <option value={DifficultyLevel.EXPERT}>Expert</option>
                  </select>
                </div>

                {/* Count */}
                <div className="w-full md:w-20">
                  <label className="block text-[10px] font-bold text-[#4E5969] mb-1">
                    Qty (Q)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={crit.count}
                    onChange={(e) =>
                      handleUpdateCriterion(crit.id, {
                        count: Math.max(1, Number(e.target.value)),
                      })
                    }
                    className="w-full px-2 py-1.5 rounded-xl border border-[#E7EAF3] text-xs font-black text-center text-[#5B4BFF] dark:bg-slate-900 dark:border-slate-700"
                  />
                </div>

                {/* Marks Each */}
                <div className="w-full md:w-24">
                  <label className="block text-[10px] font-bold text-[#4E5969] mb-1">
                    Marks / Q
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={crit.marksPerQuestion}
                    onChange={(e) =>
                      handleUpdateCriterion(crit.id, {
                        marksPerQuestion: Math.max(1, Number(e.target.value)),
                      })
                    }
                    className="w-full px-2 py-1.5 rounded-xl border border-[#E7EAF3] text-xs font-black text-center text-[#00C48C] dark:bg-slate-900 dark:border-slate-700"
                  />
                </div>

                {criteria.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCriterion(crit.id)}
                    className="p-2 text-rose-500 hover:text-rose-700 self-end md:self-center"
                    title="Remove Rule"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Generated Result Preview */}
          {generatedResult && (
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/80 border border-[#5B4BFF]/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#00C48C]" />
                  <span className="font-black text-[#1B1E28] dark:text-white">
                    Generated {generatedResult.selectedQuestions.length}{' '}
                    Questions ({generatedResult.totalGeneratedMarks} Marks)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleGenerate(Date.now())}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-[#5B4BFF] border border-[#5B4BFF]/30 font-black text-xs flex items-center gap-1.5 hover:bg-[#EEF2FF] shadow-sm transition-all"
                >
                  <RefreshCw
                    size={12}
                    className={loading ? 'animate-spin' : ''}
                  />
                  <span>{t(I18N_ASSESSMENT.BLUEPRINT_REROLL)}</span>
                </button>
              </div>

              {generatedResult.warnings &&
                generatedResult.warnings.length > 0 && (
                  <div className="space-y-1">
                    {generatedResult.warnings.map((w, i) => (
                      <div
                        key={i}
                        className="text-[11px] text-amber-700 flex items-center gap-1.5 font-bold"
                      >
                        <AlertCircle size={12} />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {generatedResult.selectedQuestions.map((q, i) => (
                  <div
                    key={q.id}
                    className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 text-[11px] flex items-center justify-between gap-2"
                  >
                    <span className="font-bold truncate text-[#1B1E28] dark:text-slate-200">
                      {i + 1}. {q.text}
                    </span>
                    <span className="px-2 py-0.5 rounded font-black text-[10px] bg-[#EEF2FF] text-[#5B4BFF] shrink-0">
                      {q.marks} Marks
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between bg-[#F8FAFC] dark:bg-slate-800/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleGenerate(Date.now())}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-[#5B4BFF] text-[#5B4BFF] font-black text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>
                {generatedResult ? 'Re-roll Pick' : 'Sample Questions'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleApply}
              disabled={
                !generatedResult ||
                generatedResult.selectedQuestions.length === 0
              }
              className="px-5 py-2.5 rounded-xl bg-[#00C48C] hover:bg-[#00B07D] text-white font-black text-xs shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 size={14} />
              <span>Add to Section</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

