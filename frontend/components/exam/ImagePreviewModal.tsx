'use client';

import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download, Maximize2 } from 'lucide-react';

interface ImagePreviewModalProps {
  src: string | null;
  title?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImagePreviewModal({
  src,
  title,
  isOpen,
  onClose,
}: ImagePreviewModalProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [isFit, setIsFit] = useState<boolean>(true);

  // Reset zoom on open
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setIsFit(true);
    }
  }, [isOpen, src]);

  // Keyboard navigation: Escape to close, + / - to zoom
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        setZoom((prev) => Math.min(prev + 0.25, 3));
      } else if (e.key === '-' || e.key === '_') {
        setZoom((prev) => Math.max(prev - 0.25, 0.5));
      } else if (e.key === '0') {
        setZoom(1);
        setIsFit(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !src) return null;

  const handleDownload = () => {
    try {
      const a = document.createElement('a');
      a.href = src;
      a.download = `question-diagram-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(src, '_blank');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800 shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-[#F8FAFC] dark:bg-slate-800/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#5B4BFF]/10 text-[#5B4BFF] flex items-center justify-center font-bold text-lg shrink-0">
              📷
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#5B4BFF]/10 text-[#5B4BFF] border border-[#5B4BFF]/20">
                  Question Diagram
                </span>
                <span className="text-[11px] font-mono font-bold text-slate-400">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
              <h3 className="text-sm font-black text-[#1B1E28] dark:text-white truncate mt-0.5" title={title || 'Attached Question Diagram'}>
                {title || 'Attached Question Diagram / Figure'}
              </h3>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Zoom Controls */}
            <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 shadow-xs">
              <button
                type="button"
                onClick={() => {
                  setZoom((prev) => Math.max(prev - 0.25, 0.5));
                  setIsFit(false);
                }}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all disabled:opacity-40"
                disabled={zoom <= 0.5}
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setIsFit(true);
                }}
                className="px-2 h-8 text-[11px] font-black font-mono text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                title="Reset Zoom (0)"
              >
                <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoom((prev) => Math.min(prev + 0.25, 3));
                  setIsFit(false);
                }}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all disabled:opacity-40"
                disabled={zoom >= 3}
                title="Zoom In (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
              title="Download Diagram"
            >
              <Download className="w-4 h-4 text-[#F36C21]" />
              <span className="hidden sm:inline">Download</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-all border border-transparent hover:border-rose-200"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport / Image Container */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 bg-[#F1F4F9] dark:bg-slate-950 flex items-center justify-center min-h-[360px] max-h-[75vh]">
          <div
            className="transition-transform duration-150 ease-out flex items-center justify-center"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          >
            <img
              src={src}
              alt={title || 'Question Diagram'}
              className={`rounded-xl border border-slate-300 dark:border-slate-800 bg-white p-2 shadow-lg transition-all ${
                isFit && zoom === 1 ? 'max-h-[68vh] max-w-full object-contain' : 'max-w-none'
              }`}
            />
          </div>
        </div>

        {/* Footer info bar */}
        <div className="px-5 py-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>Click diagram to drag or zoom. Use <b>+</b> / <b>-</b> to scale, <b>Esc</b> to close.</span>
          <span className="font-bold text-[#5B4BFF]">Medical &amp; Technical Examination Repository</span>
        </div>
      </div>
    </div>
  );
}
