'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import NoticeGroupBuilder from './NoticeGroupBuilder';
import { TargetRule } from '../../hooks/useNoticeGroups';
import { NoticeAttachment } from '../../hooks/useNotices';

const API_BASE = 'http://localhost:3001/api/v1';

export default function NoticeComposer() {
  const router = useRouter();

  // Form Fields
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<'normal' | 'important' | 'urgent'>('normal');
  const [category, setCategory] = useState<'announcement' | 'deadline' | 'event' | 'exam' | 'general'>('announcement');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [requiresAck, setRequiresAck] = useState(false);

  // Targets & Attachments
  const [targets, setTargets] = useState<TargetRule[]>([
    { target_type: 'all', target_value: 'all', target_label: 'Everyone in College' },
  ]);
  const [attachments, setAttachments] = useState<NoticeAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Preview & Submit state
  const [previewData, setPreviewData] = useState<{
    totalCount: number;
    breakdown: { students: number; faculty: number; clerks: number; wardens: number; admins: number };
    sampleRecipients?: any[];
  } | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getHeaders = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const tenantSlug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-ims' : 'srms-ims';
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-tenant-slug': tenantSlug,
    };
  }, []);

  const getTenantSlug = useCallback(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-ims' : 'srms-ims';
  }, []);

  // Multi-file upload handler
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > 5) {
      setUploadError('Maximum 5 attachments allowed per notice');
      return;
    }

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`File "${file.name}" exceeds 10 MB limit`);
        setUploading(false);
        return;
      }
      formData.append('files', file);
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const slug = getTenantSlug();
      const res = await fetch(`${API_BASE}/notices/upload?tenant=${slug}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'File upload failed');
      }

      const json = await res.json();
      const uploadedList: NoticeAttachment[] = json.data || [];
      setAttachments((prev) => [...prev, ...uploadedList]);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Failed to upload attachments');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Preview Recipients Live
  const calculateReach = async () => {
    if (targets.length === 0) return;
    setIsPreviewLoading(true);
    try {
      const slug = getTenantSlug();
      const res = await fetch(`${API_BASE}/admin/notices/preview-recipients?tenant=${slug}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ targets }),
      });
      if (res.ok) {
        const json = await res.json();
        setPreviewData(json.data || null);
      }
    } catch (err) {
      console.error('Failed to preview recipients:', err);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Quick formatting toolbar insertion
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('notice-body-textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = body.substring(start, end);
    const replacement = `${prefix}${selectedText || 'text'}${suffix}`;
    const newBody = body.substring(0, start) + replacement + body.substring(end);
    setBody(newBody);
  };

  // Submit Notice
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setSubmitError('Notice title is required');
      return;
    }
    if (!body.trim()) {
      setSubmitError('Message body is required');
      return;
    }
    if (targets.length === 0) {
      setSubmitError('At least one target audience rule is required');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      title: title.trim(),
      body: body.trim(),
      priority,
      category,
      scheduled_at: isScheduled && scheduledAt ? scheduledAt : undefined,
      expires_at: hasExpiry && expiresAt ? expiresAt : undefined,
      requires_acknowledgement: requiresAck,
      targets,
      attachments,
    };

    try {
      const slug = getTenantSlug();
      const res = await fetch(`${API_BASE}/admin/notices?tenant=${slug}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to send notice');
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/admin/notices/sent');
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || 'Failed to send notice');
    } finally {
      setSubmitting(false);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return '📄 PDF';
      case 'xlsx':
      case 'xls':
        return '📊 Excel';
      case 'docx':
      case 'doc':
        return '📝 Word';
      case 'image':
        return '🖼️ Image';
      default:
        return '📎 File';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto">
      {/* Success Notification Banner */}
      {submitSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-200 text-xs font-black flex items-center gap-3 animate-in fade-in">
          <span className="w-8 h-8 rounded-xl bg-[#00C48C] text-white flex items-center justify-center font-black text-sm">
            ✓
          </span>
          <div>
            <p className="font-extrabold text-sm">Notice Published & Broadcast Successfully!</p>
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
              Recipients have received the notification. Redirecting to Sent Notices...
            </p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {submitError && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-[#F04438] text-white flex items-center justify-center font-black">
            !
          </span>
          <p>{submitError}</p>
        </div>
      )}

      {/* ── SECTION 1: NOTICE DETAILS CARD ── */}
      <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#E7EAF3] dark:border-slate-800">
          <div>
            <h2 className="text-sm font-black text-[#1B1E28] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F36C21]"></span>
              Compose New Notice & Circular
            </h2>
            <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium mt-0.5">
              Draft priority announcements, clinical postings, or exam circulars with multi-file attachments
            </p>
          </div>

          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-[#5B4BFF] border border-purple-200 dark:border-purple-800">
            Admin Workspace
          </span>
        </div>

        {/* Title Input */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-bold text-[#1B1E28] dark:text-white">Notice Title *</label>
            <span
              className={`text-[10px] font-bold ${
                title.length > 110 ? 'text-[#F04438]' : 'text-[#4E5969] dark:text-slate-400'
              }`}
            >
              {title.length}/120 characters
            </span>
          </div>
          <input
            type="text"
            required
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. [ERP] Sujat Khan — Phase II Internal Examination Datesheet Released"
            className="w-full text-xs font-semibold p-3.5 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-xs"
          />
        </div>

        {/* Priority & Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Priority Selector */}
          <div>
            <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">
              Urgency Priority Level *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  id: 'normal',
                  label: 'Normal',
                  desc: 'Standard feed notice',
                  color: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300',
                  active: 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-600/30',
                },
                {
                  id: 'important',
                  label: 'Important',
                  desc: 'Orange highlight & badge',
                  color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300',
                  active: 'bg-[#FFB020] text-slate-950 border-[#FFB020] shadow-amber-500/30 font-black',
                },
                {
                  id: 'urgent',
                  label: 'Urgent',
                  desc: 'Login popup stack alert',
                  color: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300',
                  active: 'bg-[#F04438] text-white border-[#F04438] shadow-rose-600/30 font-black',
                },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    priority === p.id ? p.active : p.color
                  }`}
                >
                  <span className="text-xs font-black uppercase tracking-wider">{p.label}</span>
                  <span className="text-[10px] opacity-85 mt-0.5">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">Notice Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full text-xs font-bold p-3 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
            >
              <option value="announcement">📢 Announcement (General Update)</option>
              <option value="deadline">⏳ Deadline (Logbook / Fees / Submissions)</option>
              <option value="exam">📝 Examination (Datesheet / Seating Plan)</option>
              <option value="event">🏥 Clinical Posting & Hospital Rotations</option>
              <option value="general">ℹ️ General Notice</option>
            </select>
          </div>
        </div>

        {/* Message Body & Formatting Toolbar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-[#1B1E28] dark:text-white">Notice Body & Details *</label>

            {/* Quick Markdown Toolbar */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => insertFormatting('**', '**')}
                className="px-2 py-0.5 rounded bg-[#F6F8FC] dark:bg-slate-800 hover:bg-slate-200 text-xs font-black text-[#1B1E28] dark:text-white"
                title="Bold"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('*', '*')}
                className="px-2 py-0.5 rounded bg-[#F6F8FC] dark:bg-slate-800 hover:bg-slate-200 text-xs font-serif italic text-[#1B1E28] dark:text-white"
                title="Italic"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('\n- ')}
                className="px-2 py-0.5 rounded bg-[#F6F8FC] dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-[#1B1E28] dark:text-white"
                title="Bullet List"
              >
                • List
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('[Link Title](', ')')}
                className="px-2 py-0.5 rounded bg-[#F6F8FC] dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-[#1B1E28] dark:text-white"
                title="Link"
              >
                🔗 Link
              </button>
            </div>
          </div>

          <textarea
            id="notice-body-textarea"
            required
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write the full notice announcement details here. You can include timing, instructions, venue, and reporting guidelines..."
            className="w-full text-xs font-medium p-3.5 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF] focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans"
          />
        </div>
      </div>

      {/* ── SECTION 2: TARGET AUDIENCE BUILDER ── */}
      <NoticeGroupBuilder
        rules={targets}
        onChange={setTargets}
        onPreviewCount={calculateReach}
        previewData={previewData}
        isPreviewLoading={isPreviewLoading}
      />

      {/* ── SECTION 3: ATTACHMENTS & SCHEDULING CARD ── */}
      <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-5">
        <h3 className="text-sm font-black text-[#1B1E28] dark:text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-[#E7EAF3] dark:border-slate-800">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00C48C]"></span>
          Attachments & Publishing Schedule
        </h3>

        {/* Dropzone File Upload */}
        <div>
          <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1.5">
            File Attachments (PDF, Excel, Word, Images — Max 10MB each, up to 5 files)
          </label>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-6 rounded-2xl border-2 border-dashed border-[#E7EAF3] dark:border-slate-700 hover:border-[#5B4BFF] dark:hover:border-[#5B4BFF] bg-[#F6F8FC] dark:bg-slate-800/40 text-center cursor-pointer transition-all hover:bg-white dark:hover:bg-slate-800 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.xlsx,.xls,.docx,.doc,.jpg,.jpeg,.png,.webp"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-[#5B4BFF] flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p className="text-xs font-bold text-[#1B1E28] dark:text-white">
              {uploading ? 'Uploading and validating files...' : 'Click or Drag files to attach'}
            </p>
            <p className="text-[11px] text-[#4E5969] dark:text-slate-400 mt-0.5">
              Supports .pdf, .xlsx, .docx, .png, .jpg (Max 10 MB per file)
            </p>
          </div>

          {uploadError && <p className="text-xs font-bold text-[#F04438] mt-1.5">⚠️ {uploadError}</p>}

          {/* Attached Files List */}
          {attachments.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              {attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between gap-2 shadow-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-extrabold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[#1B1E28] dark:text-white shrink-0">
                      {getFileIcon(att.file_type)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#1B1E28] dark:text-white truncate">{att.file_name}</p>
                      <p className="text-[10px] text-[#4E5969] dark:text-slate-400">{att.file_size_kb || 0} KB</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all font-black text-xs"
                    title="Remove attachment"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scheduling, Expiry & Acknowledgement Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-[#E7EAF3] dark:border-slate-800">
          {/* Schedule Picker */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-bold text-[#1B1E28] dark:text-white cursor-pointer">
              <input
                type="checkbox"
                checked={isScheduled}
                onChange={(e) => setIsScheduled(e.target.checked)}
                className="w-4 h-4 rounded text-[#5B4BFF] focus:ring-indigo-500"
              />
              Schedule for Later
            </label>
            {isScheduled && (
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full text-xs font-bold p-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white"
              />
            )}
          </div>

          {/* Expiry Picker */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-bold text-[#1B1E28] dark:text-white cursor-pointer">
              <input
                type="checkbox"
                checked={hasExpiry}
                onChange={(e) => setHasExpiry(e.target.checked)}
                className="w-4 h-4 rounded text-[#5B4BFF] focus:ring-indigo-500"
              />
              Auto-Archive Expiry Date
            </label>
            {hasExpiry && (
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full text-xs font-bold p-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white"
              />
            )}
          </div>

          {/* Requires Acknowledgement */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-bold text-[#1B1E28] dark:text-white cursor-pointer">
              <input
                type="checkbox"
                checked={requiresAck}
                onChange={(e) => setRequiresAck(e.target.checked)}
                className="w-4 h-4 rounded text-[#5B4BFF] focus:ring-indigo-500"
              />
              Require Acknowledgement
            </label>
            <p className="text-[10px] text-[#4E5969] dark:text-slate-400">
              Users must explicitly click "I Acknowledge" button
            </p>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ACTIONS BAR ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft">
        <div className="text-xs text-[#4E5969] dark:text-slate-400 font-medium">
          Targeting <strong>{targets.length} rule(s)</strong> • <strong>{attachments.length} attachment(s)</strong>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => router.push('/dashboard/admin/notices/sent')}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-full border border-[#E7EAF3] dark:border-slate-700 hover:bg-[#F6F8FC] dark:hover:bg-slate-800 text-[#1B1E28] dark:text-white text-xs font-bold transition-all"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="flex-1 sm:flex-none px-7 py-2.5 rounded-full bg-gradient-to-r from-[#5B4BFF] to-[#7867FF] hover:from-[#4F46E5] hover:to-[#6366F1] text-white text-xs font-black shadow-lg shadow-indigo-500/30 transition-all hover:scale-102 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Publishing Notice...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
                Send & Broadcast Notice
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
