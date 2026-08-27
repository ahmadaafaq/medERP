'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface WeeklyLogItem {
  id?: string;
  week_number: number;
  start_date?: string;
  end_date?: string;
  hours_spent?: number;
  tasks_planned: string;
  tasks_accomplished: string;
  challenges_faced?: string;
  next_week_goals?: string;
  attachment_url?: string;
  attachment_name?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem?: WeeklyLogItem | null;
  defaultWeekNumber?: number;
  projectId?: string;
}

export default function LogbookWeeklyModal({ isOpen, onClose, onSuccess, editItem, defaultWeekNumber = 1, projectId }: Props) {
  const [weekNumber, setWeekNumber] = useState<number>(defaultWeekNumber);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hoursSpent, setHoursSpent] = useState<number>(12);
  const [tasksPlanned, setTasksPlanned] = useState('');
  const [tasksAccomplished, setTasksAccomplished] = useState('');
  const [challengesFaced, setChallengesFaced] = useState('');
  const [nextWeekGoals, setNextWeekGoals] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editItem) {
      setWeekNumber(editItem.week_number || 1);
      setStartDate(editItem.start_date ? editItem.start_date.slice(0, 10) : '');
      setEndDate(editItem.end_date ? editItem.end_date.slice(0, 10) : '');
      setHoursSpent(Number(editItem.hours_spent) || 10);
      setTasksPlanned(editItem.tasks_planned || '');
      setTasksAccomplished(editItem.tasks_accomplished || '');
      setChallengesFaced(editItem.challenges_faced || '');
      setNextWeekGoals(editItem.next_week_goals || '');
      setAttachmentUrl(editItem.attachment_url || '');
      setAttachmentName(editItem.attachment_name || '');
    } else {
      setWeekNumber(defaultWeekNumber);
      setStartDate(new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));
      setEndDate(new Date().toISOString().slice(0, 10));
      setHoursSpent(12);
      setTasksPlanned('');
      setTasksAccomplished('');
      setChallengesFaced('');
      setNextWeekGoals('');
      setAttachmentUrl('');
      setAttachmentName('');
    }
    setError(null);
  }, [editItem, isOpen, defaultWeekNumber]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tasksPlanned.trim() || !tasksAccomplished.trim()) {
      setError('Please specify tasks planned and accomplished during this week.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const slug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly';
    const token = localStorage.getItem('token') || '';
    
    let studentId = localStorage.getItem('studentId') || localStorage.getItem('studentUserId') || '';
    if (!studentId) {
      try {
        const rawUser = localStorage.getItem('user');
        if (rawUser) {
          const u = JSON.parse(rawUser);
          studentId = u.student_id || u.id || u.userId || u.rollno || u.roll_no || u.registration_no || u.reg_no || '';
        }
      } catch (e) {}
    }

    const payload = {
      studentId: studentId || undefined,
      projectId: projectId || undefined,
      weekNumber: Number(weekNumber),
      startDate: startDate || null,
      endDate: endDate || null,
      hoursSpent: Number(hoursSpent) || 0,
      tasksPlanned,
      tasksAccomplished,
      challengesFaced,
      nextWeekGoals,
      attachmentUrl: attachmentUrl || null,
      attachmentName: attachmentName || (attachmentUrl ? 'Deliverable_Attachment.pdf' : null),
    };

    try {
      const url = editItem?.id
        ? `/api/v1/logbook/weekly-logs/${editItem.id}?tenant=${slug}`
        : `/api/v1/logbook/weekly-logs?tenant=${slug}`;

      const res = await fetch(url, {
        method: editItem?.id ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to save weekly log');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[24px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#2D2575] to-[#4338CA] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
              <Calendar className="w-5 h-5 text-[#F36C21]" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{editItem ? 'Edit Weekly Work Log' : 'Add Weekly Work Log Entry'}</h3>
              <p className="text-xs text-white/80">Track project milestones, hours spent, accomplishments and blockers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Week Number <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="52"
                value={weekNumber}
                onChange={(e) => setWeekNumber(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Total Hours Devoted</span>
              <span className="text-[#5B4BFF] font-bold">{hoursSpent} Hours</span>
            </label>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-slate-400" />
              <input
                type="range"
                min="1"
                max="40"
                value={hoursSpent}
                onChange={(e) => setHoursSpent(Number(e.target.value))}
                className="flex-1 accent-[#5B4BFF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tasks Planned for this Week <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              value={tasksPlanned}
              onChange={(e) => setTasksPlanned(e.target.value)}
              placeholder="e.g. Design DB schema for user authentication and connect PostgreSQL container..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Actual Work Accomplished <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={tasksAccomplished}
              onChange={(e) => setTasksAccomplished(e.target.value)}
              placeholder="e.g. Created TypeORM entities, wrote migration scripts, and verified CRUD tests passing..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Blockers / Challenges Faced
              </label>
              <textarea
                rows={2}
                value={challengesFaced}
                onChange={(e) => setChallengesFaced(e.target.value)}
                placeholder="e.g. Encountered TypeORM foreign key circular dependency..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Next Week Goals
              </label>
              <textarea
                rows={2}
                value={nextWeekGoals}
                onChange={(e) => setNextWeekGoals(e.target.value)}
                placeholder="e.g. Build frontend Next.js dashboard UI and wire React query hooks..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Deliverable / Code / Report URL (Optional)
            </label>
            <input
              type="url"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              placeholder="https://github.com/... or https://drive.google.com/..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4338CA] text-white text-sm font-semibold shadow-md shadow-[#5B4BFF]/25 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editItem ? 'Save Changes' : 'Submit Weekly Log'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
