'use client';

import React, { useState, useEffect } from 'react';
import { X, Award, CheckCircle2, AlertCircle } from 'lucide-react';

interface TechActivityItem {
  id?: string;
  title: string;
  activity_type: string;
  organization?: string;
  event_date?: string;
  description?: string;
  certificate_url?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editItem?: TechActivityItem | null;
}

export default function LogbookTechActivityModal({ isOpen, onClose, onSuccess, editItem }: Props) {
  const [title, setTitle] = useState('');
  const [activityType, setActivityType] = useState('HACKATHON');
  const [organization, setOrganization] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [description, setDescription] = useState('');
  const [certificateUrl, setCertificateUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editItem) {
      setTitle(editItem.title || '');
      setActivityType(editItem.activity_type || 'HACKATHON');
      setOrganization(editItem.organization || '');
      setEventDate(editItem.event_date ? editItem.event_date.slice(0, 10) : '');
      setDescription(editItem.description || '');
      setCertificateUrl(editItem.certificate_url || '');
    } else {
      setTitle('');
      setActivityType('HACKATHON');
      setOrganization('');
      setEventDate(new Date().toISOString().slice(0, 10));
      setDescription('');
      setCertificateUrl('');
    }
    setError(null);
  }, [editItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide activity / certification title.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const slug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly';
    const token = localStorage.getItem('token') || '';
    const studentId = localStorage.getItem('studentId') || localStorage.getItem('studentUserId') || '';

    const payload = {
      studentId: studentId || undefined,
      title,
      activityType,
      organization,
      eventDate: eventDate || null,
      description,
      certificateUrl: certificateUrl || null,
      certificateName: certificateUrl ? 'Verification_Certificate.pdf' : null,
    };

    try {
      const url = editItem?.id
        ? `/api/v1/logbook/technical-activities/${editItem.id}?tenant=${slug}`
        : `/api/v1/logbook/technical-activities?tenant=${slug}`;

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
        throw new Error(data.message || 'Failed to save technical activity');
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
        <div className="px-6 py-4 bg-gradient-to-r from-[#2D2575] to-[#4338CA] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
              <Award className="w-5 h-5 text-[#F36C21]" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{editItem ? 'Edit Technical Activity' : 'Add Technical Activity / Badge'}</h3>
              <p className="text-xs text-white/80">Record hackathons, workshops, certs, and coding contest achievements</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Event / Certification Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Smart India Hackathon 2025 / AWS Certified Cloud Practitioner"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Activity Category
              </label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              >
                <option value="HACKATHON">🏆 Hackathon</option>
                <option value="CERTIFICATION">📜 Certification</option>
                <option value="WORKSHOP">🛠️ Workshop</option>
                <option value="CONTEST">⚡ Coding Contest</option>
                <option value="INDUSTRIAL_VISIT">🏭 Industrial Visit</option>
                <option value="PUBLICATION">📄 Research Paper</option>
                <option value="OTHER">✨ Other Co-Curricular</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Organizing Body / Issuer
              </label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. SRMS College / IIT Delhi / AWS"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Event Date
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description & Key Role
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail your contribution, team placement, or key competencies acquired..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Certificate / Badge Verification Link
            </label>
            <input
              type="url"
              value={certificateUrl}
              onChange={(e) => setCertificateUrl(e.target.value)}
              placeholder="https://coursera.org/verify/... or https://drive.google.com/..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
            />
          </div>

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
              {submitting ? 'Saving...' : <><CheckCircle2 className="w-4 h-4" /><span>Save Activity</span></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
