'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import NoticeGroupBuilder from './NoticeGroupBuilder';
import { TargetRule, useNoticeGroups } from '../../hooks/useNoticeGroups';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export default function NoticeComposer() {
  const router = useRouter();
  const { groups } = useNoticeGroups();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<'normal' | 'important' | 'urgent'>('normal');
  const [category, setCategory] = useState<'announcement' | 'deadline' | 'exam' | 'event' | 'general'>('announcement');
  const [requiresAck, setRequiresAck] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  // Targeting Rules
  const [targets, setTargets] = useState<TargetRule[]>([
    { target_type: 'role', target_value: 'STUDENT', target_label: 'All Students' },
  ]);

  // Recipient Count Preview
  const [previewCount, setPreviewCount] = useState<{
    totalCount: number;
    breakdown?: { students: number; faculty: number; clerks: number; wardens: number; admins: number };
  }>({ totalCount: 0 });
  const [previewLoading, setPreviewLoading] = useState(false);

  // Attachments
  const [attachments, setAttachments] = useState<
    Array<{ file_name: string; file_type: string; file_url: string; file_size_kb: number }>
  >([]);
  const [uploading, setUploading] = useState(false);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const getTenantSlug = useCallback(() => {
    if (typeof window === 'undefined') return 'srms-cet-bareilly';
    return (
      localStorage.getItem('tenantSlug') ||
      localStorage.getItem('selectedTenant') ||
      localStorage.getItem('tenant') ||
      localStorage.getItem('institutionSlug') ||
      'srms-cet-bareilly'
    );
  }, []);

  const getHeaders = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const tenantSlug = getTenantSlug();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-tenant-slug': tenantSlug,
    };
  }, [getTenantSlug]);

  // Fetch live recipient count preview
  const fetchRecipientPreview = useCallback(async () => {
    if (targets.length === 0) {
      setPreviewCount({ totalCount: 0 });
      return;
    }
    try {
      setPreviewLoading(true);
      const slug = getTenantSlug();
      const res = await fetch(`${API_BASE}/admin/notices/preview-recipients?tenant=${slug}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ targets }),
      });
      if (res.ok) {
        const json = await res.json();
        setPreviewCount(json.data || { totalCount: 0 });
      }
    } catch (err) {
      console.error('Failed to preview recipients:', err);
    } finally {
      setPreviewLoading(false);
    }
  }, [targets, getHeaders, getTenantSlug]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecipientPreview();
    }, 400);
    return () => clearTimeout(timer);
  }, [fetchRecipientPreview]);

  // Handle Attachment Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const slug = getTenantSlug();

      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      const res = await fetch(`${API_BASE}/notices/upload?tenant=${slug}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        const uploadedList = json.data || [];
        setAttachments((prev) => [...prev, ...uploadedList]);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'File upload failed. Allowed types: PDF, Word, Excel, Images (Max 10MB each)');
      }
    } catch (err: any) {
      alert(err.message || 'Upload error');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submit Notice
  const handleSubmitNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || targets.length === 0) {
      setErrorMsg('Please fill in title, body, and at least one target audience rule.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      const slug = getTenantSlug();

      const payload = {
        title: title.trim(),
        body: body.trim(),
        priority,
        category,
        requires_acknowledgement: requiresAck,
        scheduled_at: scheduledAt || null,
        expires_at: expiresAt || null,
        targets,
        attachments,
      };

      const res = await fetch(`${API_BASE}/admin/notices?tenant=${slug}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert('Notice published and broadcast successfully!');
        router.push('/dashboard/admin/notices/sent');
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.message || 'Failed to send notice');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while publishing notice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmitNotice} className="space-y-6">
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs font-bold flex items-center justify-between">
          <span>⚠️ {errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg('')} className="font-black ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Main Notice Details Card */}
      <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-4">
        <h3 className="text-xs font-black uppercase text-[#1B1E28] dark:text-white tracking-wider flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#5B4BFF]"></span>
          Notice Content & Classification
        </h3>

        {/* Title Input */}
        <div>
          <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1">
            Notice / Circular Subject Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Schedule for End-Semester Practical & Theory Examinations"
            className="w-full text-xs font-bold p-3 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
          />
        </div>

        {/* Category & Priority Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1">Priority Level</label>
            <select
              value={priority}
              onChange={(e: any) => setPriority(e.target.value)}
              className="w-full text-xs font-bold p-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
            >
              <option value="normal">Normal (Standard Bulletin)</option>
              <option value="important">Important (Highlighted in Yellow)</option>
              <option value="urgent">Urgent (Red Alert / Top Broadcast)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1">Category</label>
            <select
              value={category}
              onChange={(e: any) => setCategory(e.target.value)}
              className="w-full text-xs font-bold p-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
            >
              <option value="announcement">Announcement</option>
              <option value="deadline">Deadline / Due Date</option>
              <option value="exam">Examination & Assessment</option>
              <option value="event">Academic / Clinical Event</option>
              <option value="general">General Administrative</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1">Acknowledgement</label>
            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs font-bold text-[#1B1E28] dark:text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiresAck}
                  onChange={(e) => setRequiresAck(e.target.checked)}
                  className="w-4 h-4 rounded text-[#5B4BFF] focus:ring-0 cursor-pointer"
                />
                <span>Require Recipient Acknowledgement</span>
              </label>
            </div>
          </div>
        </div>

        {/* Body Textarea */}
        <div>
          <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1">
            Notice Body / Detailed Description *
          </label>
          <textarea
            required
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Enter the full official text of the notice, guidelines, venue details, or instructions..."
            className="w-full text-xs font-medium p-3 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
          />
        </div>
      </div>

      {/* Target Audience Card */}
      <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-xs font-black uppercase text-[#1B1E28] dark:text-white tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00C48C]"></span>
              Target Audience & Fan-Out Scope
            </h3>
            <p className="text-[11px] text-[#4E5969] dark:text-slate-400 font-medium">
              Only recipients matching these rules will receive this circular in their notification inbox.
            </p>
          </div>

          {/* Reusable Template Quick Picker */}
          {groups && groups.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#4E5969] dark:text-slate-400">Load Template:</span>
              <select
                onChange={(e) => {
                  const grp = groups.find((g) => g.id === e.target.value);
                  if (grp && grp.target_rules) {
                    setTargets(grp.target_rules);
                  }
                }}
                className="text-xs font-bold py-1.5 px-2.5 rounded-lg bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white"
              >
                <option value="">Select saved group...</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Builder */}
        <NoticeGroupBuilder rules={targets} onChange={setTargets} />

        {/* Live Audience Preview Counter Card */}
        <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👥</span>
            <div>
              <p className="text-xs font-black text-indigo-950 dark:text-indigo-200 uppercase tracking-wide">
                Live Audience Reach Preview
              </p>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
                {previewLoading ? (
                  'Calculating matched recipients...'
                ) : (
                  <>
                    Total Matched: <span className="font-black text-sm">{previewCount.totalCount}</span> user accounts
                  </>
                )}
              </p>
            </div>
          </div>

          {previewCount.breakdown && (
            <div className="flex flex-wrap gap-2 text-[10px] font-bold text-indigo-900 dark:text-indigo-300">
              <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 shadow-xs">
                Students: {previewCount.breakdown.students}
              </span>
              <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 shadow-xs">
                Faculty: {previewCount.breakdown.faculty}
              </span>
              <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 shadow-xs">
                Staff/Clerk: {previewCount.breakdown.clerks}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Attachments & Scheduling Card */}
      <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-4">
        <h3 className="text-xs font-black uppercase text-[#1B1E28] dark:text-white tracking-wider flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F36C21]"></span>
          Attachments & Scheduling
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* File Upload Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#1B1E28] dark:text-white block">
              Upload Official Circular PDF / Docs / Images
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              disabled={uploading}
              className="w-full text-xs font-semibold p-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-black file:bg-[#5B4BFF] file:text-white"
            />
            {uploading && <p className="text-xs text-[#5B4BFF] font-bold animate-pulse">Uploading file(s)...</p>}

            {/* Uploaded Files Chips */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-[#1B1E28] dark:text-white"
                  >
                    <span>📎 {att.file_name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="text-rose-500 hover:text-rose-700 font-black ml-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expiry / Schedule (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1">
                Schedule Publish (Optional)
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1">
                Expiry Date (Optional)
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Submit Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 rounded-full bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 text-xs font-extrabold text-[#4E5969] dark:text-slate-300 hover:bg-slate-50 transition-all shadow-soft"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="px-8 py-2.5 rounded-full bg-gradient-to-r from-[#5B4BFF] to-[#7867FF] hover:scale-102 active:scale-98 text-white text-xs font-black shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2"
        >
          <span>{submitting ? 'Publishing...' : '📢 Publish & Broadcast Notice'}</span>
        </button>
      </div>
    </form>
  );
}
