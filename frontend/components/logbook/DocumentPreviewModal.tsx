'use client';

import React from 'react';
import { X, FileText, Download, ExternalLink, ShieldCheck, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  documentUrl?: string;
  documentName?: string;
  studentName?: string;
  projectTitle?: string;
}

function PdfCanvasViewer({ pdfData, blobUrl }: { pdfData: Uint8Array | ArrayBuffer | null; blobUrl?: string | null }) {
  const [numPages, setNumPages] = React.useState<number>(0);
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [scale, setScale] = React.useState<number>(1.2);
  const [rendering, setRendering] = React.useState<boolean>(true);
  const [renderError, setRenderError] = React.useState<string | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [pdfDoc, setPdfDoc] = React.useState<any>(null);

  React.useEffect(() => {
    if (!pdfData) return;
    let active = true;

    async function loadPdf() {
      try {
        setRendering(true);
        setRenderError(null);

        const uint8 = pdfData instanceof Uint8Array ? pdfData : new Uint8Array(pdfData as ArrayBuffer);
        if (!uint8 || uint8.byteLength === 0) {
          throw new Error('PDF data buffer is empty');
        }

        const pdfjs = await import('pdfjs-dist/legacy/build/pdf');
        try {
          pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
        } catch (we) {}

        let doc: any = null;
        try {
          const loadingTask = pdfjs.getDocument({
            data: uint8,
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
            cMapPacked: true,
          });
          doc = await loadingTask.promise;
        } catch (firstErr) {
          console.warn('First worker attempt failed, trying fallback mode...', firstErr);
          // Retry without worker
          const fallbackTask = pdfjs.getDocument({
            data: uint8,
            disableWorker: true,
          } as any);
          doc = await fallbackTask.promise;
        }

        if (active && doc) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setCurrentPage(1);
          setRendering(false);
        }
      } catch (err: any) {
        console.error('Error loading PDF canvas', err);
        if (active) {
          setRenderError(err?.message || 'Could not render PDF canvas');
          setRendering(false);
        }
      }
    }

    loadPdf();
    return () => {
      active = false;
    };
  }, [pdfData]);

  React.useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let renderTask: any = null;

    async function renderPage() {
      try {
        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        renderTask = page.render(renderContext);
        await renderTask.promise;
      } catch (e) {
        // render cancelled or aborted
      }
    }

    renderPage();
    return () => {
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch (e) {}
      }
    };
  }, [pdfDoc, currentPage, scale]);

  if (renderError) {
    if (blobUrl) {
      return (
        <div className="w-full h-full relative rounded-xl overflow-hidden bg-white border border-slate-800 shadow-sm flex flex-col">
          <iframe
            src={blobUrl}
            title="Project Documentation Preview"
            className="w-full h-full rounded-xl bg-white border-0"
          />
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-300 space-y-3 bg-slate-900 rounded-xl w-full h-full">
        <FileText className="w-10 h-10 text-red-400" />
        <div className="text-sm font-bold text-white">PDF Canvas Rendering Notice</div>
        <p className="text-xs text-slate-400 max-w-sm">{renderError}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner">
      {/* Control Bar */}
      <div className="w-full py-2.5 px-4 bg-slate-900/90 backdrop-blur border-b border-slate-800 flex items-center justify-between text-xs text-white flex-shrink-0 z-10 shadow-sm flex-wrap gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 font-bold flex items-center gap-1 border border-slate-700 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Prev</span>
          </button>
          <span className="font-mono text-xs text-slate-300 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">
            Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{numPages || 1}</strong>
          </span>
          <button
            type="button"
            disabled={currentPage >= numPages}
            onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 font-bold flex items-center gap-1 border border-slate-700 transition-colors"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.6, Number((s - 0.15).toFixed(2))))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="font-mono text-xs w-12 text-center text-slate-300">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(2.5, Number((s + 0.15).toFixed(2))))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setScale(1.2)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="flex-1 w-full overflow-auto flex items-start justify-center p-4 bg-slate-950">
        {rendering ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-2.5 my-auto">
            <div className="w-8 h-8 border-2 border-[#5B4BFF] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-slate-300">Rendering high-resolution PDF canvas...</span>
          </div>
        ) : (
          <div className="shadow-2xl rounded-lg overflow-hidden bg-white border border-slate-800">
            <canvas ref={canvasRef} className="block max-w-none shadow-md" />
          </div>
        )}
      </div>
    </div>
  );
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
  const [pdfDataBuffer, setPdfDataBuffer] = React.useState<Uint8Array | ArrayBuffer | null>(null);
  const [blobObjectUrl, setBlobObjectUrl] = React.useState<string | null>(null);
  const [loadingDoc, setLoadingDoc] = React.useState<boolean>(false);
  const [viewMode, setViewMode] = React.useState<'canvas' | 'browser'>('canvas');

  React.useEffect(() => {
    if (!isOpen || !documentUrl) {
      setPdfDataBuffer(null);
      setBlobObjectUrl(null);
      return;
    }

    let isMounted = true;

    // 1. Handle Base64 Data URL
    if (documentUrl.startsWith('data:')) {
      try {
        const parts = documentUrl.split(',');
        const bstr = atob(parts[1] || parts[0]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const b = new Blob([u8arr], { type: 'application/pdf' });
        const objUrl = URL.createObjectURL(b);
        setPdfDataBuffer(u8arr);
        setBlobObjectUrl(objUrl);
      } catch (e) {
        console.error('Error decoding Base64 PDF data', e);
      }
      return;
    }

    // 2. Fetch binary stream from API
    setLoadingDoc(true);
    const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly' : 'srms-cet-bareilly';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

    let fetchUrl = documentUrl;
    if (!fetchUrl.includes('tenant=') && slug) {
      fetchUrl += `${fetchUrl.includes('?') ? '&' : '?'}tenant=${encodeURIComponent(slug)}`;
    }

    fetch(fetchUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-tenant-slug': slug,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load document (${res.status} ${res.statusText})`);
        }
        const blob = await res.blob();
        const arrayBuffer = await blob.arrayBuffer();
        if (isMounted) {
          const uint8 = new Uint8Array(arrayBuffer);
          const pdfBlob = new Blob([uint8], { type: 'application/pdf' });
          const objUrl = URL.createObjectURL(pdfBlob);
          setPdfDataBuffer(uint8);
          setBlobObjectUrl(objUrl);
          setLoadingDoc(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Document buffer fetch error:', err);
          setLoadingDoc(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, documentUrl]);

  if (!isOpen) return null;

  const isDataUrl = documentUrl?.startsWith('data:');
  const isImage = documentUrl?.startsWith('data:image/') || /\.(png|jpg|jpeg|webp|svg)$/i.test(documentUrl || '') || /\.(png|jpg|jpeg|webp|svg)$/i.test(documentName || '');
  const isPdf =
    !isImage &&
    (documentUrl?.includes('.pdf') ||
      documentUrl?.startsWith('data:application/pdf') ||
      documentName?.toLowerCase().endsWith('.pdf') ||
      documentUrl?.includes('/document') ||
      (!documentUrl?.startsWith('http://') && !documentUrl?.startsWith('https://')));

  const handleDownload = () => {
    if (!documentUrl) return;
    if (blobObjectUrl) {
      const a = document.createElement('a');
      a.href = blobObjectUrl;
      a.download = documentName || 'Project_Documentation.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
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
                <div className="hidden sm:flex items-center bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('canvas')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'canvas' ? 'bg-[#5B4BFF] text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Canvas Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('browser')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'browser' ? 'bg-[#5B4BFF] text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Browser Mode
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Download File"
                >
                  <Download className="w-4 h-4 text-[#5B4BFF]" />
                  <span className="hidden sm:inline">Download</span>
                </button>
                <a
                  href={blobObjectUrl || documentUrl}
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
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950/60 p-2 sm:p-4 overflow-hidden flex flex-col items-center justify-center relative">
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
          ) : loadingDoc ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-3 text-center">
              <div className="w-10 h-10 border-3 border-[#5B4BFF] border-t-transparent rounded-full animate-spin" />
              <div className="text-sm font-bold text-slate-800 dark:text-white">Loading Document Preview...</div>
              <p className="text-xs text-slate-500">Preparing high-resolution PDF canvas</p>
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
          ) : viewMode === 'canvas' && pdfDataBuffer ? (
            <PdfCanvasViewer pdfData={pdfDataBuffer} blobUrl={blobObjectUrl || documentUrl} />
          ) : (
            <div className="w-full h-full relative rounded-xl overflow-hidden bg-white border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
              <iframe
                src={blobObjectUrl || documentUrl}
                title={documentName || 'Project Report Document Preview'}
                className="w-full h-full rounded-xl bg-white border-0"
              />
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
