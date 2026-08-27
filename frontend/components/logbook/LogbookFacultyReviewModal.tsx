'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, ShieldCheck, Award, MessageSquare } from 'lucide-react';

interface ReviewTarget {
  entityType: 'WEEKLY_LOG' | 'SEMINAR' | 'TUTORIAL' | 'TECHNICAL_ACTIVITY' | 'PROJECT_REVIEW' | 'MINI_PROJECT' | 'SUBMISSION';
  entityId: string;
  studentName: string;
  itemTitle: string;
  currentMarks?: number;
  maxMarks?: number;
  currentRemarks?: string;
  currentStatus?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  target: ReviewTarget | null;
}

export default function LogbookFacultyReviewModal({ isOpen, onClose, onSuccess, target }: Props) {
  const [marks, setMarks] = useState<number>(target?.currentMarks || 95);
  const [status, setStatus] = useState<string>(target?.currentStatus === 'CHANGES_REQUESTED' ? 'CHANGES_REQUESTED' : 'APPROVED');
  const [remarks, setRemarks] = useState<string>(target?.currentRemarks || '');
  const [digitalSignApproved, setDigitalSignApproved] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !target) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const slug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly';
    const token = localStorage.getItem('token') || '';

    const payload = {
      entityType: target.entityType,
      entityId: target.entityId,
      approvalStatus: status,
      marks: Number(marks),
      remarks: remarks || (status === 'APPROVED' ? 'Approved by Faculty Guide. Regular progress noted.' : 'Please revise deliverable according to guide comments.'),
      signatureStamp: digitalSignApproved ? `DIGITALLY_SIGNED_GUIDE_${new Date().toISOString().slice(0, 10)}` : null,
    };

    try {
      const res = await fetch(`/api/v1/logbook/faculty/review-action?tenant=${slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to submit review');
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
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[24px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#2D2575] to-[#4338CA] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
              <ShieldCheck className="w-5 h-5 text-[#F36C21]" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Faculty Review & Digital Guide Sign-Off</h3>
              <p className="text-xs text-white/80">Evaluate student deliverable, enter remarks, marks & sign-off seal</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Student & Item Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Candidate & Deliverable</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>{target.studentName}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#5B4BFF]/10 text-[#5B4BFF] font-bold">
                {target.entityType.replace('_', ' ')}
              </span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300">{target.itemTitle}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Approval Decision <span className="text-red-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              >
                <option value="APPROVED">✅ Approved & Verified</option>
                <option value="CHANGES_REQUESTED">⚠️ Changes / Revision Requested</option>
                <option value="REJECTED">❌ Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Marks / Score ({target.maxMarks ? `Max ${target.maxMarks}` : 'Score'})
              </label>
              <input
                type="number"
                min="0"
                max={target.maxMarks || 100}
                value={marks}
                onChange={(e) => setMarks(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Faculty Remarks & Action Items
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Provide constructive feedback, required amendments or validation notes..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-[#5B4BFF]" />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Apply Digital Faculty Signature Seal</div>
                <div className="text-[11px] text-slate-500">Cryptographically stamp review with faculty credentials & timestamp</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={digitalSignApproved}
              onChange={(e) => setDigitalSignApproved(e.target.checked)}
              className="w-4 h-4 accent-[#5B4BFF] cursor-pointer"
            />
          </div>

          {/* Footer */}
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
              {submitting ? 'Submitting Review...' : <><CheckCircle2 className="w-4 h-4" /><span>Confirm & Sign-Off</span></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
