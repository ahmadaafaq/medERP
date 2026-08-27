'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FolderGit2,
  ExternalLink,
  Award,
  Lock,
  Sparkles,
  ShieldCheck,
  FileCode2,
  FileArchive,
  ChevronRight,
  Save,
} from 'lucide-react';

export interface ApplicantStudent {
  student_id: string;
  student_name: string;
  rollno?: string;
  registration_no?: string;
  course_name?: string;
  batch_name?: string;
  project_id?: string;
  project_title?: string;
  repository_url?: string;
  live_demo_url?: string;
  zip_submission_url?: string;
  is_locked?: boolean;
  project_status?: string;
  final_grade?: string;
  final_percentage?: number;
  guide_remarks?: string;
  locked_at?: string;
  total_hours_spent: number;
  total_weeks_logged: number;
  latest_week_number?: number;
  weekly_logs: Array<{
    id: string;
    week_number: number;
    start_date?: string;
    end_date?: string;
    hours_spent: number;
    tasks_planned: string;
    tasks_accomplished: string;
    challenges_faced?: string;
    next_week_goals?: string;
    attachment_url?: string;
    attachment_name?: string;
    status: string;
    guide_marks?: number;
    guide_remarks?: string;
    guide_signature?: string;
    verified_at?: string;
  }>;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  applicant: ApplicantStudent | null;
  projectTitle?: string;
}

export default function MiniProjectTrackingModal({
  isOpen,
  onClose,
  onSuccess,
  applicant,
  projectTitle = 'React Crud Operation',
}: Props) {
  const [selectedWeekTab, setSelectedWeekTab] = useState<number | 'FINAL'>(1);
  const [weeklyEvaluations, setWeeklyEvaluations] = useState<{
    [logId: string]: { marks: number; remarks: string; status: string; signature: string; saving: boolean; saved: boolean };
  }>({});

  // Final lock state
  const [finalGrade, setFinalGrade] = useState<string>('A+');
  const [finalPercentage, setFinalPercentage] = useState<number>(90);
  const [finalRemarks, setFinalRemarks] = useState<string>('');
  const [guideSignature, setGuideSignature] = useState<string>('Dr. Vinay Kumar (Faculty Guide)');
  const [lockingProject, setLockingProject] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  const [lockSuccess, setLockSuccess] = useState(false);

  useEffect(() => {
    if (applicant) {
      if (applicant.weekly_logs && applicant.weekly_logs.length > 0) {
        setSelectedWeekTab(applicant.weekly_logs[0].week_number);
      } else {
        setSelectedWeekTab('FINAL');
      }

      // Initialize weekly evaluation forms
      const initialEvals: any = {};
      applicant.weekly_logs.forEach((log) => {
        const isAlreadySaved =
          log.status === 'VERIFIED' ||
          (log.guide_marks !== undefined && log.guide_marks !== null && Number(log.guide_marks) > 0);
        initialEvals[log.id] = {
          marks: log.guide_marks !== undefined && log.guide_marks !== null ? Number(log.guide_marks) : 20,
          remarks: log.guide_remarks || 'Milestone verified successfully. Code architecture meets specifications.',
          status: log.status || 'VERIFIED',
          signature: log.guide_signature || 'Dr. Vinay Kumar',
          saving: false,
          saved: isAlreadySaved,
        };
      });
      setWeeklyEvaluations(initialEvals);

      setFinalGrade(applicant.final_grade || 'A+');
      setFinalPercentage(Number(applicant.final_percentage) || 92);
      setFinalRemarks(
        applicant.guide_remarks ||
          'Candidate demonstrated excellent comprehension of full-stack engineering, clean database schemas, and structured git commits across all weekly milestones.'
      );
      setLockSuccess(applicant.is_locked || applicant.project_status === 'CLOSED');
      setLockError(null);
    }
  }, [applicant, isOpen]);

  if (!isOpen || !applicant) return null;

  const isProjectLocked = applicant.is_locked || applicant.project_status === 'CLOSED' || lockSuccess;

  const handleSaveWeekEval = async (logId: string) => {
    const current = weeklyEvaluations[logId];
    if (!current) return;

    setWeeklyEvaluations((prev) => ({
      ...prev,
      [logId]: { ...prev[logId], saving: true, saved: false },
    }));

    const slug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly';
    const token = localStorage.getItem('token') || '';

    try {
      const res = await fetch(`/api/v1/logbook/weekly-logs/${logId}/evaluate?tenant=${slug}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
        body: JSON.stringify({
          marks: Number(current.marks),
          remarks: current.remarks,
          status: current.status || 'VERIFIED',
          guideSignature: current.signature,
        }),
      });

      if (!res.ok) throw new Error('Failed to save weekly evaluation');

      // Update in-memory applicant object so the week tab mark badge and UI immediately update
      const targetLog = applicant.weekly_logs.find((l) => l.id === logId);
      if (targetLog) {
        targetLog.guide_marks = Number(current.marks);
        targetLog.guide_remarks = current.remarks;
        targetLog.guide_signature = current.signature;
        targetLog.status = current.status || 'VERIFIED';
        targetLog.verified_at = new Date().toISOString();
      }

      setWeeklyEvaluations((prev) => ({
        ...prev,
        [logId]: { ...prev[logId], saving: false, saved: true },
      }));
      onSuccess();
    } catch (err: any) {
      alert(err.message || 'Failed to save');
      setWeeklyEvaluations((prev) => ({
        ...prev,
        [logId]: { ...prev[logId], saving: false, saved: false },
      }));
    }
  };

  const handleFinalizeAndLock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalRemarks.trim()) {
      setLockError('Please enter comprehensive final evaluation remarks.');
      return;
    }

    setLockingProject(true);
    setLockError(null);

    const slug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly';
    const token = localStorage.getItem('token') || '';

    try {
      const res = await fetch(`/api/v1/logbook/mini-projects/finalize-lock?tenant=${slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
        body: JSON.stringify({
          studentId: applicant.student_id,
          projectId: applicant.project_id,
          finalGrade,
          finalPercentage: Number(finalPercentage),
          finalRemarks,
          guideSignature,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to finalize and lock project');
      }

      setLockSuccess(true);
      onSuccess();
    } catch (err: any) {
      setLockError(err.message || 'Something went wrong while locking project');
    } finally {
      setLockingProject(false);
    }
  };

  const currentLog = applicant.weekly_logs.find((l) => l.week_number === selectedWeekTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[24px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#2D2575] to-[#4338CA] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-lg font-black text-[#F36C21] border border-white/20">
              {applicant.student_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg leading-tight">{applicant.student_name}</h3>
                <span className="px-2 py-0.5 rounded-md bg-white/20 text-[11px] font-mono font-bold">
                  {applicant.rollno || applicant.registration_no || 'Reg Candidate'}
                </span>
                {isProjectLocked && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white font-bold text-[10px] flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Locked & Closed
                  </span>
                )}
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                {applicant.course_name || 'BCA'} • {applicant.batch_name || 'Batch 2025'} — Mini Project:{' '}
                <span className="font-bold text-[#F36C21]">{applicant.project_title || projectTitle}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lock Status Banner if already locked */}
        {isProjectLocked && (
          <div className="px-6 py-3 bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold uppercase tracking-wider">Project Status: Locked & Closed</span> • Final Grade:{' '}
                <span className="font-black text-emerald-700 dark:text-emerald-300">{finalGrade} ({finalPercentage}%)</span>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              Submissions, Code Zip & Modifications Locked
            </span>
          </div>
        )}

        {/* Deliverable Links Bar */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Project Assets:</span>
            {applicant.repository_url ? (
              <a
                href={applicant.repository_url}
                target="_blank"
                rel="noreferrer"
                className="text-[#5B4BFF] font-semibold hover:underline flex items-center gap-1"
              >
                <FolderGit2 className="w-3.5 h-3.5" />
                <span>Git Repository</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-slate-400">No Git Repo URL</span>
            )}

            {applicant.live_demo_url && (
              <a
                href={applicant.live_demo_url}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-600 font-semibold hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Live Deployed Demo</span>
              </a>
            )}

            {applicant.zip_submission_url && (
              <a
                href={applicant.zip_submission_url}
                target="_blank"
                rel="noreferrer"
                className="text-[#F36C21] font-semibold hover:underline flex items-center gap-1"
              >
                <FileArchive className="w-3.5 h-3.5" />
                <span>Code Zip Archive</span>
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Total Devoted:</span>
            <span className="font-bold text-[#5B4BFF]">{applicant.total_hours_spent} Hours</span>
            <span className="text-slate-300">•</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">{applicant.total_weeks_logged} Weeks Logged</span>
          </div>
        </div>

        {/* Tab Navigation: Week 1, Week 2, ... and Final Grade */}
        <div className="px-6 pt-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2">
            {applicant.weekly_logs.map((log) => {
              const isVerified =
                log.status === 'VERIFIED' ||
                (log.guide_marks !== undefined && log.guide_marks !== null && Number(log.guide_marks) > 0) ||
                weeklyEvaluations[log.id]?.saved;
              return (
                <button
                  key={log.id}
                  onClick={() => setSelectedWeekTab(log.week_number)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    selectedWeekTab === log.week_number
                      ? 'bg-[#2D2575] text-white shadow-md shadow-[#2D2575]/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {isVerified ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-[#F36C21]" />
                  )}
                  <span>Week {log.week_number}</span>
                  {log.guide_marks ? (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      {log.guide_marks}m
                    </span>
                  ) : null}
                </button>
              );
            })}

            <button
              onClick={() => setSelectedWeekTab('FINAL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedWeekTab === 'FINAL'
                  ? 'bg-[#F36C21] text-white shadow-md shadow-[#F36C21]/25 font-black'
                  : 'bg-orange-50 dark:bg-orange-950/40 text-[#F36C21] border border-[#F36C21]/30 hover:bg-orange-100'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>🏆 Final Grade & Lock Project</span>
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-900/50">
          {/* 1. INDIVIDUAL WEEKLY PROGRESS & EVALUATION */}
          {selectedWeekTab !== 'FINAL' && currentLog && (
            <div className="space-y-4">
              {/* Student Submitted Data */}
              <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-lg bg-[#2D2575] text-white font-bold text-xs">
                      Week {currentLog.week_number} Work Report
                    </span>
                    <span className="text-xs text-slate-500">
                      {currentLog.start_date ? new Date(currentLog.start_date).toLocaleDateString() : 'Start'} –{' '}
                      {currentLog.end_date ? new Date(currentLog.end_date).toLocaleDateString() : 'End'}
                    </span>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-[#5B4BFF] font-bold border border-indigo-200 dark:border-indigo-800">
                    {currentLog.hours_spent} Hours Devoted
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-1">
                    <div className="font-bold text-slate-500 uppercase text-[10px]">Tasks Planned for this Week:</div>
                    <div className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {currentLog.tasks_planned}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-1">
                    <div className="font-bold text-emerald-600 uppercase text-[10px]">Actual Work Accomplished:</div>
                    <div className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {currentLog.tasks_accomplished}
                    </div>
                  </div>
                </div>

                {(currentLog.challenges_faced || currentLog.next_week_goals) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                    {currentLog.challenges_faced && (
                      <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 text-amber-900 dark:text-amber-200 space-y-1">
                        <div className="font-bold uppercase text-[10px] text-amber-700">Blockers & Challenges Faced:</div>
                        <div>{currentLog.challenges_faced}</div>
                      </div>
                    )}
                    {currentLog.next_week_goals && (
                      <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 text-indigo-900 dark:text-indigo-200 space-y-1">
                        <div className="font-bold uppercase text-[10px] text-indigo-700">Next Week Goals:</div>
                        <div>{currentLog.next_week_goals}</div>
                      </div>
                    )}
                  </div>
                )}

                {currentLog.attachment_url && (
                  <div className="pt-2">
                    <a
                      href={currentLog.attachment_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs font-bold text-[#5B4BFF] hover:bg-slate-200 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View Week Deliverable / Attachment</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Faculty Evaluation Box for this week */}
              <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 border border-indigo-200 dark:border-indigo-900 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#5B4BFF]" />
                    <span>Faculty Evaluation & Remarks for Week {currentLog.week_number}</span>
                  </h4>
                  {weeklyEvaluations[currentLog.id]?.saved && (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Evaluated & Saved
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Marks Awarded (Max 25)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="25"
                      disabled={isProjectLocked}
                      value={weeklyEvaluations[currentLog.id]?.marks ?? 20}
                      onChange={(e) =>
                        setWeeklyEvaluations((prev) => ({
                          ...prev,
                          [currentLog.id]: { ...prev[currentLog.id], marks: Number(e.target.value) },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-[#5B4BFF]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Verification Status
                    </label>
                    <select
                      disabled={isProjectLocked}
                      value={weeklyEvaluations[currentLog.id]?.status || 'VERIFIED'}
                      onChange={(e) =>
                        setWeeklyEvaluations((prev) => ({
                          ...prev,
                          [currentLog.id]: { ...prev[currentLog.id], status: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-[#5B4BFF]"
                    >
                      <option value="VERIFIED">VERIFIED (Approved)</option>
                      <option value="APPROVED">APPROVED (Satisfactory)</option>
                      <option value="REVISION_NEEDED">REVISION NEEDED</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Faculty Guide Stamp / Signature
                    </label>
                    <input
                      type="text"
                      disabled={isProjectLocked}
                      value={weeklyEvaluations[currentLog.id]?.signature || 'Dr. Vinay Kumar'}
                      onChange={(e) =>
                        setWeeklyEvaluations((prev) => ({
                          ...prev,
                          [currentLog.id]: { ...prev[currentLog.id], signature: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-[#5B4BFF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Faculty Remarks & Milestone Feedback
                  </label>
                  <textarea
                    rows={2}
                    disabled={isProjectLocked}
                    value={weeklyEvaluations[currentLog.id]?.remarks || ''}
                    onChange={(e) =>
                      setWeeklyEvaluations((prev) => ({
                        ...prev,
                        [currentLog.id]: { ...prev[currentLog.id], remarks: e.target.value },
                      }))
                    }
                    placeholder="Enter feedback on this week's code quality and milestones..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-[#5B4BFF]"
                  />
                </div>

                {!isProjectLocked && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      disabled={weeklyEvaluations[currentLog.id]?.saving}
                      onClick={() => handleSaveWeekEval(currentLog.id)}
                      className="px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4338CA] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-[#5B4BFF]/20"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{weeklyEvaluations[currentLog.id]?.saving ? 'Saving...' : `Save Week ${currentLog.week_number} Evaluation`}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. FINAL GRADE & LOCK PROJECT TAB */}
          {selectedWeekTab === 'FINAL' && (
            <form onSubmit={handleFinalizeAndLock} className="space-y-4">
              <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                  <div>
                    <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                      <Award className="w-5 h-5 text-[#F36C21]" />
                      <span>Final Mini Project Evaluation & Mandatory Lockdown</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Grant overall grade, percentage score, remarks, and permanently lock project submissions
                    </p>
                  </div>
                  {isProjectLocked ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-black text-xs border border-emerald-300">
                      🔒 STATUS: CLOSED
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-xs border border-amber-300">
                      IN PROGRESS (Awaiting Final Lock)
                    </span>
                  )}
                </div>

                {lockError && (
                  <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{lockError}</span>
                  </div>
                )}

                {lockSuccess && (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Project Successfully Evaluated & Locked!
                    </div>
                    <div>
                      Project details status, weekly submission portal, and code deliverables are now closed in accordance with academic regulations.
                    </div>
                  </div>
                )}

                {/* Performance Rubric Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Total Devoted Hours</div>
                    <div className="text-xl font-black text-[#5B4BFF] mt-1">{applicant.total_hours_spent} hrs</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Weekly Milestones Completed</div>
                    <div className="text-xl font-black text-emerald-600 mt-1">{applicant.total_weeks_logged} Weeks</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Target Degree & Cohort</div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1.5">
                      {applicant.course_name} • {applicant.batch_name}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Final Awarded Letter Grade <span className="text-red-500">*</span>
                    </label>
                    <select
                      disabled={isProjectLocked}
                      value={finalGrade}
                      onChange={(e) => setFinalGrade(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-[#5B4BFF]"
                      required
                    >
                      <option value="A+">Grade A+ (Outstanding • 90%+)</option>
                      <option value="A">Grade A (Excellent • 80-89%)</option>
                      <option value="B+">Grade B+ (Very Good • 70-79%)</option>
                      <option value="B">Grade B (Good • 60-69%)</option>
                      <option value="C">Grade C (Satisfactory • 50-59%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Overall Percentage Score (%) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      disabled={isProjectLocked}
                      value={finalPercentage}
                      onChange={(e) => setFinalPercentage(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-[#5B4BFF]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Comprehensive Final Evaluation Remarks <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    disabled={isProjectLocked}
                    value={finalRemarks}
                    onChange={(e) => setFinalRemarks(e.target.value)}
                    placeholder="Provide detailed feedback on project architecture, code execution, and rubric performance..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-[#5B4BFF] leading-relaxed"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Faculty Guide Digital Signature Stamp
                  </label>
                  <input
                    type="text"
                    disabled={isProjectLocked}
                    value={guideSignature}
                    onChange={(e) => setGuideSignature(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-[#5B4BFF]"
                  />
                </div>

                {/* Mandatory Lockdown Callout */}
                <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-1.5 text-xs">
                  <div className="font-bold text-[#2D2575] dark:text-indigo-300 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#F36C21]" />
                    <span>Mandatory Lockdown Enforcement upon Finalization:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-300 text-[11px] pl-1">
                    <li>Project details status will be permanently marked as <strong>CLOSED</strong>.</li>
                    <li>Weekly work log entries & deliverable submissions will be <strong>LOCKED</strong>.</li>
                    <li>Code zip uploads & repository modification will be <strong>LOCKED</strong> for the candidate.</li>
                  </ul>
                </div>

                {!isProjectLocked && (
                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="submit"
                      disabled={lockingProject}
                      className="px-6 py-3 rounded-xl bg-[#2D2575] hover:bg-[#1f1955] text-white font-bold text-xs shadow-lg shadow-[#2D2575]/25 flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      {lockingProject ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Finalizing & Locking Project...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 text-[#F36C21]" />
                          <span>Finalize, Grade & Lock Mini Project</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
