'use client';

import React from 'react';
import { X, FileText, Download, ExternalLink, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  documentUrl?: string;
  documentName?: string;
  studentName?: string;
  projectTitle?: string;
}

export default function DocumentPreviewModal({
  isOpen,
  onClose,
  title,
  documentUrl,
  documentName,
  studentName,
  projectTitle,
}: Props) {
  if (!isOpen) return null;

  const isDataUrl = documentUrl?.startsWith('data:');
  const isPdf = documentUrl?.includes('.pdf') || documentUrl?.startsWith('data:application/pdf') || documentName?.toLowerCase().endsWith('.pdf');
  const isImage = documentUrl?.startsWith('data:image/') || /\.(png|jpg|jpeg|webp|svg)$/i.test(documentUrl || '');

  const handleDownload = () => {
    if (!documentUrl) return;
    const a = document.createElement('a');
    a.href = documentUrl;
    a.download = documentName || 'Project_Documentation.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 w-full max-w-5xl h-[90vh] max-h-[900px] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#5B4BFF]/10 dark:bg-[#5B4BFF]/20 flex items-center justify-center text-[#5B4BFF] flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#5B4BFF]/10 text-[#5B4BFF]">
                  Project Documentation Preview
                </span>
                {studentName && (
                  <span className="text-xs text-slate-500 font-medium truncate">
                    Candidate: <strong className="text-slate-800 dark:text-slate-200">{studentName}</strong>
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {documentName || title || 'Project Report & Architecture Document'}
              </h3>
              {projectTitle && (
                <p className="text-xs text-slate-500 truncate">
                  Topic: {projectTitle}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {documentUrl && (
              <>
                <button
                  onClick={handleDownload}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  title="Download File"
                >
                  <Download className="w-4 h-4 text-[#5B4BFF]" />
                  <span className="hidden sm:inline">Download</span>
                </button>
                <a
                  href={documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4338CA] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-[#5B4BFF]/20 transition-colors"
                  title="Open in Full Tab"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">Open in New Tab</span>
                </a>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950/60 p-2 sm:p-4 overflow-hidden flex flex-col items-center justify-center">
          {!documentUrl ? (
            <div className="text-center p-8 space-y-3">
              <FileText className="w-12 h-12 text-slate-400 mx-auto" />
              <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No Documentation File Available
              </div>
              <p className="text-xs text-slate-500 max-w-md">
                The student has not attached a documentation file or report for this mini project yet.
              </p>
            </div>
          ) : isImage ? (
            <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={documentUrl}
                alt="Document Preview"
                className="max-w-full max-h-full object-contain rounded-xl shadow-lg border border-slate-200 dark:border-slate-800"
              />
            </div>
          ) : isPdf || isDataUrl ? (
            <iframe
              src={documentUrl}
              title="Document Preview"
              className="w-full h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white shadow-sm"
            />
          ) : (
            <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-w-lg shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-[#5B4BFF] flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {documentName || 'External Project Documentation Link'}
                </h4>
                <p className="text-xs text-slate-500 mt-1 break-all">
                  {documentUrl}
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <a
                  href={documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4338CA] text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-[#5B4BFF]/20"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Document URL</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Digital Logbook Document Viewer • Authenticated Candidate Deliverable</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
