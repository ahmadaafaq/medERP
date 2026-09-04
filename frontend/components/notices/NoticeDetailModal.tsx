'use client';

import Link from 'next/link';
import { NoticeItem, NoticeTarget } from '../../hooks/useNotices';

interface NoticeDetailModalProps {
  notice: NoticeItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge?: (noticeId: string) => Promise<void>;
}

interface CohortLine {
  course?: string;
  branch?: string;
  batch?: string;
  semester?: string;
  label?: string;
  isRole?: boolean;
}

export default function NoticeDetailModal({
  notice,
  isOpen,
  onClose,
  onAcknowledge,
}: NoticeDetailModalProps) {
  if (!isOpen || !notice) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Just now';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const totalRec = notice.total_recipients || 0;
  const readCount = notice.read_count || 0;
  const readPct = notice.read_percentage ?? (totalRec > 0 ? Math.round((readCount * 100) / totalRec) : 0);

  // Group Target Audience Rules into clean lines of: Course — Branch — Batch (— Semester)
  const getCohortLines = (targets?: NoticeTarget[]): CohortLine[] => {
    if (!targets || targets.length === 0) {
      return [{ label: 'All Institution Members', isRole: true }];
    }

    const roles = targets.filter((t) => t.target_type === 'role' || t.target_type === 'all');
    if (roles.length === targets.length) {
      return roles.map((r) => ({
        label: r.target_label || r.target_value || 'All Members',
        isRole: true,
      }));
    }

    const lines: CohortLine[] = [];
    let current: CohortLine = {};

    targets.forEach((t) => {
      const type = (t.target_type || '').toLowerCase();
      const rawLabel = (t.target_label || t.target_value || '').trim();

      if (type === 'course') {
        if (current.course) {
          lines.push(current);
          current = {};
        }
        current.course = rawLabel;
      } else if (type === 'branch' || type === 'department') {
        if (current.branch) {
          lines.push(current);
          current = {};
        }
        current.branch = rawLabel;
      } else if (type === 'batch_year') {
        if (current.batch) {
          lines.push(current);
          current = {};
        }
        current.batch = rawLabel.toLowerCase().startsWith('batch') ? rawLabel : `Batch ${rawLabel}`;
      } else if (type === 'semester') {
        current.semester = rawLabel;
      } else {
        if (current.course || current.branch || current.batch) {
          lines.push(current);
          current = {};
        }
        lines.push({ label: rawLabel, isRole: true });
      }
    });

    if (current.course || current.branch || current.batch || current.semester) {
      lines.push(current);
    }

    // Always ensure semester is present for academic cohort lines
    lines.forEach((line) => {
      if (!line.isRole && !line.semester) {
        line.semester = 'All Semesters';
      }
    });

    return lines;
  };

  const cohortLines = getCohortLines(notice.targets);

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-orange-200/80 dark:border-orange-900/40 rounded-[28px] max-w-3xl w-full shadow-2xl shadow-orange-950/20 overflow-hidden flex flex-col max-h-[92vh] my-auto transition-all">
        
        {/* Top University Official Header Banner (Orange Themed) */}
        <div className="relative bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 text-white p-5 sm:p-6 overflow-hidden shrink-0">
          {/* Subtle Decorative Ambient Pattern */}
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute right-1/3 -bottom-10 w-36 h-36 bg-amber-400/20 rounded-full blur-xl pointer-events-none"></div>

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/30">
                  <span>🏛️</span> OFFICIAL CIRCULAR
                </span>
                
                {notice.priority === 'urgent' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-rose-600 text-white shadow-sm animate-pulse">
                    🚨 URGENT
                  </span>
                ) : notice.priority === 'important' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-amber-400 text-amber-950 shadow-sm font-black">
                    ⭐ IMPORTANT
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-white/25 text-white">
                    📢 NORMAL
                  </span>
                )}

                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-black/20 text-white/90">
                  {notice.category}
                </span>

                {notice.requires_acknowledgement && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white text-orange-700 shadow-sm">
                    ✓ Ack Required
                  </span>
                )}
              </div>

              <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight leading-snug pt-1">
                {notice.title}
              </h2>

              <p className="text-xs text-orange-100/90 font-medium">
                Ref ID: <span className="font-mono font-bold text-white uppercase">{notice.id ? notice.id.slice(0, 13) : 'CIRCULAR'}</span>
              </p>
            </div>

            {/* Clean Close Button (Print & Copy Link Removed) */}
            <div className="shrink-0">
              <button
                type="button"
                onClick={onClose}
                title="Close"
                className="w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center font-black text-base transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Metadata Cards Grid (Authority, Timestamps, Audience Reach) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Authority Card */}
            <div className="p-3.5 rounded-2xl bg-orange-50/60 dark:bg-slate-800/80 border border-orange-100 dark:border-orange-950/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
                🎓
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase text-orange-600 dark:text-orange-400 tracking-wider block">
                  ISSUED BY
                </span>
                <p className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                  {notice.creator_name || 'Academic Administration'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold truncate">
                  {notice.creator_role || 'University Authority'}
                </p>
              </div>
            </div>

            {/* 2. Timeline Card */}
            <div className="p-3.5 rounded-2xl bg-orange-50/60 dark:bg-slate-800/80 border border-orange-100 dark:border-orange-950/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
                📅
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider block">
                  PUBLISHED ON
                </span>
                <p className="font-extrabold text-xs text-slate-900 dark:text-white">
                  {formatDate(notice.created_at)}
                </p>
                {notice.expires_at ? (
                  <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 truncate">
                    Expires: {formatDate(notice.expires_at)}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                    Permanent Notice
                  </p>
                )}
              </div>
            </div>

            {/* 3. Reach & Read Rate Card */}
            <div className="p-3.5 rounded-2xl bg-orange-50/60 dark:bg-slate-800/80 border border-orange-100 dark:border-orange-950/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-amber-500 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
                📊
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black uppercase text-orange-600 dark:text-orange-400 tracking-wider block">
                  READ ENGAGEMENT
                </span>
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="text-slate-900 dark:text-white">
                    {readCount} / {totalRec} read
                  </span>
                  <span className="text-orange-600 dark:text-orange-400">{readPct}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-orange-200/60 dark:bg-slate-700 mt-1 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, readPct)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Target Audience Cohorts Scope Section (Line by Line: Course — Branch — Batch) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                Target Audience & Eligibility Cohorts
              </h4>
              <span className="text-[11px] font-extrabold text-orange-600 dark:text-orange-400">
                {cohortLines.length} Target Cohort Row{cohortLines.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Line by line format: Course — Branch — Batch */}
            <div className="space-y-2">
              {cohortLines.map((cohort, idx) => (
                <div
                  key={idx}
                  className="flex flex-wrap items-center gap-2 p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-900 border border-orange-200/70 dark:border-orange-950/40 shadow-2xs text-xs font-bold"
                >
                  {cohort.isRole ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-900 dark:text-orange-200 font-extrabold">
                      <span>👥</span> {cohort.label}
                    </span>
                  ) : (
                    <>
                      {/* Course */}
                      {cohort.course && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-100/80 dark:bg-orange-950/60 text-orange-900 dark:text-orange-200 font-black">
                          <span>📚</span> {cohort.course}
                        </span>
                      )}

                      {/* Separator */}
                      {cohort.course && cohort.branch && (
                        <span className="text-orange-400 dark:text-orange-500 font-black px-0.5">—</span>
                      )}

                      {/* Branch */}
                      {cohort.branch && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-bold">
                          <span>🏢</span> {cohort.branch}
                        </span>
                      )}

                      {/* Separator */}
                      {((cohort.course || cohort.branch) && cohort.batch) && (
                        <span className="text-orange-400 dark:text-orange-500 font-black px-0.5">—</span>
                      )}

                      {/* Batch */}
                      {cohort.batch && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-extrabold">
                          <span>🎓</span> {cohort.batch}
                        </span>
                      )}

                      {/* Semester (if present) */}
                      {cohort.semester && (
                        <>
                          <span className="text-orange-400 dark:text-orange-500 font-black px-0.5">—</span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold">
                            <span>📅</span> {cohort.semester}
                          </span>
                        </>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Official Notice Content Letterhead */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Notice Description & Guidelines
            </h4>
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-orange-50/40 via-white to-amber-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-orange-950/10 border-l-4 border-l-orange-500 border-y border-r border-slate-200/80 dark:border-slate-800 shadow-soft">
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 font-medium leading-relaxed whitespace-pre-line select-text">
                {notice.body}
              </p>
            </div>
          </div>

          {/* Official Attachments Gallery */}
          {notice.attachments && notice.attachments.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                  Official Attachments & Circular Documents ({notice.attachments.length})
                </h4>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  Click to open or download
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {notice.attachments.map((att, idx) => {
                  const isPdf = att.file_type === 'pdf' || att.file_name.toLowerCase().endsWith('.pdf');
                  const isImg = att.file_type === 'image' || /\.(png|jpg|jpeg|webp)$/i.test(att.file_name);
                  const isDoc = att.file_type === 'docx' || /\.(doc|docx)$/i.test(att.file_name);
                  const isXls = att.file_type === 'xlsx' || /\.(xls|xlsx)$/i.test(att.file_name);

                  return (
                    <a
                      key={idx}
                      href={att.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-850 border border-orange-200/90 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500 hover:shadow-md hover:scale-[1.01] transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shrink-0 ${
                            isPdf
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600'
                              : isImg
                              ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-600'
                              : isDoc
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-600'
                              : isXls
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600'
                              : 'bg-orange-100 dark:bg-orange-950/60 text-orange-600'
                          }`}
                        >
                          {isPdf ? '📄' : isImg ? '🖼️' : isDoc ? '📝' : isXls ? '📊' : '📁'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-xs text-slate-900 dark:text-white truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                            {att.file_name}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                            {att.file_type || 'Document'} {att.file_size_kb ? `• ${att.file_size_kb} KB` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-black shrink-0 shadow-sm transition-all group-hover:scale-105">
                        Download ↗
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {notice.id && (
              <Link
                href={`/dashboard/admin/notices/reports/${notice.id}`}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-black shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5"
              >
                <span>📊</span> View Detailed Read Report
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {notice.requires_acknowledgement && !notice.acknowledged && onAcknowledge && (
              <button
                type="button"
                onClick={async () => {
                  await onAcknowledge(notice.id);
                  onClose();
                }}
                className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>✓</span> Acknowledge Receipt
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-extrabold shadow-sm transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
