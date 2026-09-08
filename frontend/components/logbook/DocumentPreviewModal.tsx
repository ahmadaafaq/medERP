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
  studentRollNo?: string;
  projectTitle?: string;
  explanationText?: string;
  category?: string;
  marksObtained?: number | null;
  maxMarks?: number;
  facultyRemarks?: string;
  submittedAt?: string;
  isEvaluated?: boolean;
  evaluatedPdfUrl?: string;
  originalPdfUrl?: string;
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
            title="Document Preview"
            className="w-full h-full rounded-xl bg-white border-0"
          />
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-300 space-y-3 bg-slate-900 rounded-xl w-full h-full">
        <FileText className="w-10 h-10 text-slate-400" />
        <div className="text-sm font-bold text-white">Document Stream Available</div>
        <p className="text-xs text-slate-400 max-w-sm">Use Document Reader or the Academic Notes tab to view the deliverable content.</p>
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
            <span>Prev</span>
          </button>
          <span className="font-mono text-slate-300 font-bold px-1">
            Page {currentPage} of {numPages || 1}
          </span>
          <button
            type="button"
            disabled={currentPage >= numPages}
            onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 font-bold flex items-center gap-1 border border-slate-700 transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.6, s - 0.2))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-xs font-bold text-slate-300 w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setScale(1.2)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white"
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
  studentRollNo,
  projectTitle,
  explanationText,
  category,
  marksObtained,
  maxMarks,
  facultyRemarks,
  submittedAt,
  isEvaluated,
  evaluatedPdfUrl,
  originalPdfUrl,
}: Props) {
  const [selectedCopy, setSelectedCopy] = React.useState<'evaluated' | 'original'>('evaluated');
  const [loadingDoc, setLoadingDoc] = React.useState<boolean>(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [pdfDataBuffer, setPdfDataBuffer] = React.useState<Uint8Array | null>(null);
  const [blobObjectUrl, setBlobObjectUrl] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<'canvas' | 'browser' | 'notes'>('browser');
  const [reloadKey, setReloadKey] = React.useState<number>(0);

  const activeDocUrl = (isEvaluated && selectedCopy === 'evaluated' && evaluatedPdfUrl)
    ? evaluatedPdfUrl
    : (isEvaluated && selectedCopy === 'original' && originalPdfUrl)
    ? originalPdfUrl
    : documentUrl;

  React.useEffect(() => {
    if (!isOpen) {
      setPdfDataBuffer(null);
      setBlobObjectUrl(null);
      setLoadError(null);
      setLoadingDoc(false);
      return;
    }

    let isMounted = true;
    setPdfDataBuffer(null);
    setBlobObjectUrl(null);
    setLoadError(null);

    if (!activeDocUrl) {
      setLoadingDoc(false);
      return;
    }

    // 1. Handle Base64 Data URL
    if (activeDocUrl.startsWith('data:')) {
      try {
        setLoadingDoc(true);
        const parts = activeDocUrl.split(',');
        const bstr = atob(parts[1] || parts[0]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const isPdf = u8arr.length > 4 && u8arr[0] === 0x25 && u8arr[1] === 0x50 && u8arr[2] === 0x44 && u8arr[3] === 0x46;
        const isImg = !isPdf && (
          (u8arr.length > 4 && ((u8arr[0] === 0xff && u8arr[1] === 0xd8) || (u8arr[0] === 0x89 && u8arr[1] === 0x50) || (u8arr[0] === 0x47 && u8arr[1] === 0x49))) ||
          /\.(png|jpe?g|webp|svg|gif|bmp)$/i.test(documentName || '') ||
          activeDocUrl.startsWith('data:image/')
        );
        const mimeMatch = activeDocUrl.match(/^data:([^;]+);/);
        const mimeType = mimeMatch ? mimeMatch[1] : (isImg ? 'image/jpeg' : 'application/pdf');
        const b = new Blob([u8arr as unknown as BlobPart], { type: mimeType });
        const objUrl = URL.createObjectURL(b);
        if (isMounted) {
          setPdfDataBuffer(u8arr);
          setBlobObjectUrl(objUrl);
          setLoadingDoc(false);
        }
      } catch (e: any) {
        if (isMounted) {
          setLoadError('Failed to parse Base64 document stream');
          setLoadingDoc(false);
        }
      }
      return;
    }

    // 2. Asynchronously fetch backend stream
    setLoadingDoc(true);
    const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly' : 'srms-cet-bareilly';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

    let fetchUrl = activeDocUrl;
    const isLocal = fetchUrl.startsWith('/');
    if (!fetchUrl.includes('tenant=') && slug && isLocal) {
      fetchUrl += `${fetchUrl.includes('?') ? '&' : '?'}tenant=${encodeURIComponent(slug)}`;
    }

    const headers: Record<string, string> = {};
    if (isLocal) {
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (slug) headers['x-tenant-slug'] = slug;
    }

    fetch(fetchUrl, isLocal ? { headers } : {})
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Server returned ${res.status}: ${res.statusText || 'Unable to stream deliverable'}`);
        }
        const blob = await res.blob();
        const arrayBuffer = await blob.arrayBuffer();
        if (isMounted && arrayBuffer.byteLength > 0) {
          const uint8 = new Uint8Array(arrayBuffer);
          const isPdf = uint8.length > 4 && uint8[0] === 0x25 && uint8[1] === 0x50 && uint8[2] === 0x44 && uint8[3] === 0x46; // %PDF-
          const isImg = !isPdf && (
            (blob.type && blob.type.startsWith('image/')) ||
            (uint8.length > 4 && ((uint8[0] === 0xff && uint8[1] === 0xd8) || (uint8[0] === 0x89 && uint8[1] === 0x50) || (uint8[0] === 0x47 && uint8[1] === 0x49))) ||
            /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(documentName || '') ||
            /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(fetchUrl)
          );
            
          const mimeType = isPdf ? 'application/pdf' : (isImg ? (blob.type?.startsWith('image/') ? blob.type : 'image/jpeg') : (blob.type || 'application/pdf'));
          const fileBlob = new Blob([uint8 as unknown as BlobPart], { type: mimeType });
          const objUrl = URL.createObjectURL(fileBlob);
          setPdfDataBuffer(uint8);
          setBlobObjectUrl(objUrl);
          setLoadingDoc(false);
          setLoadError(null);
        } else if (isMounted) {
          throw new Error('Received empty document content from server');
        }
      })
      .catch((err) => {
        if (isMounted) {
          setLoadingDoc(false);
          setLoadError(err?.message || 'Could not stream document preview');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, activeDocUrl, reloadKey]);

  if (!isOpen) return null;

  const isPdfByBuffer = pdfDataBuffer && pdfDataBuffer.length > 4 && pdfDataBuffer[0] === 0x25 && pdfDataBuffer[1] === 0x50 && pdfDataBuffer[2] === 0x44 && pdfDataBuffer[3] === 0x46;
  const isImageByBuffer = pdfDataBuffer && pdfDataBuffer.length > 4 && (
    (pdfDataBuffer[0] === 0xff && pdfDataBuffer[1] === 0xd8) || // JPEG
    (pdfDataBuffer[0] === 0x89 && pdfDataBuffer[1] === 0x50) || // PNG
    (pdfDataBuffer[0] === 0x47 && pdfDataBuffer[1] === 0x49)    // GIF
  );
  const isImageByName = /\.(png|jpe?g|webp|svg|gif|bmp)$/i.test(documentName || '') || /\.(png|jpe?g|webp|svg|gif|bmp)$/i.test(activeDocUrl || '');
  const isImage = !isPdfByBuffer && (isImageByBuffer || (isImageByName && !activeDocUrl?.includes('evaluated-pdf')) || (typeof activeDocUrl === 'string' && activeDocUrl.startsWith('data:image/')));

  const handleDownload = () => {
    const downloadName = (isEvaluated && selectedCopy === 'evaluated')
      ? `Evaluated_${documentName || 'Submission_Document.pdf'}`
      : (documentName || 'Submission_Document.pdf');

    if (blobObjectUrl) {
      const a = document.createElement('a');
      a.href = blobObjectUrl;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    if (activeDocUrl) {
      const a = document.createElement('a');
      a.href = activeDocUrl;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const hasEvaluationInfo = isEvaluated || (marksObtained !== null && marksObtained !== undefined);
  const maxM = maxMarks || 20;
  const marksPct = marksObtained !== null && marksObtained !== undefined ? Math.round((Number(marksObtained) / maxM) * 100) : null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md animate-fadeIn"
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800 w-full max-w-5xl h-[92vh] max-h-[920px] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#2D2575] text-white flex items-center justify-between border-b border-indigo-950 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#5B4BFF] text-white flex items-center justify-center font-black shadow-md flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-[#F36C21] text-white">
                  {category || 'Academic Deliverable Visualizer'}
                </span>
                {studentName && (
                  <span className="text-xs text-purple-200 font-medium truncate">
                    Candidate: <strong className="text-white">{studentName}</strong> {studentRollNo ? `(${studentRollNo})` : ''}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-black text-white truncate mt-0.5">
                {documentName || title || 'Academic Logbook Submission Document'}
              </h3>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* View Mode Switcher (Picture 2 Exact Match) */}
            <div className="hidden sm:flex items-center bg-white/10 p-1 rounded-xl gap-1 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('browser')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  viewMode === 'browser' ? 'bg-[#F36C21] text-white shadow-sm' : 'text-purple-200 hover:text-white'
                }`}
              >
                Document Reader
              </button>
              <button
                type="button"
                onClick={() => setViewMode('canvas')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  viewMode === 'canvas' ? 'bg-[#F36C21] text-white shadow-sm' : 'text-purple-200 hover:text-white'
                }`}
              >
                Canvas Zoom
              </button>
              {explanationText && (
                <button
                  type="button"
                  onClick={() => setViewMode('notes')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    viewMode === 'notes' ? 'bg-[#F36C21] text-white shadow-sm' : 'text-purple-200 hover:text-white'
                  }`}
                >
                  Student Notes
                </button>
              )}
            </div>

            {activeDocUrl && (
              <>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Download File"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Download</span>
                </button>
                <a
                  href={blobObjectUrl || activeDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-[#F36C21] hover:bg-[#E05B10] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                  title="Open in New Tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Open in New Tab</span>
                </a>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-purple-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Evaluated Results & Version Switcher Banner */}
        {hasEvaluationInfo && (
          <div className="w-full bg-emerald-50/90 dark:bg-emerald-950/40 border-b border-emerald-200/80 dark:border-emerald-800/60 px-5 py-2.5 flex items-center justify-between gap-3 flex-wrap text-xs shrink-0">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600 text-white font-black text-[11px] shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>OFFICIALLY EVALUATED</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-700 dark:text-slate-200">Score:</span>
                <span className="font-black text-emerald-700 dark:text-emerald-300 text-sm">
                  {marksObtained} / {maxM} Marks
                </span>
                {marksPct !== null && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold">
                    {marksPct}%
                  </span>
                )}
              </div>
              {facultyRemarks && (
                <div className="text-slate-600 dark:text-slate-300 italic truncate max-w-sm pl-2 border-l border-emerald-300 dark:border-emerald-700">
                  &ldquo;{facultyRemarks}&rdquo;
                </div>
              )}
            </div>

            {evaluatedPdfUrl && originalPdfUrl && (
              <div className="flex items-center bg-emerald-100/80 dark:bg-emerald-900/50 p-1 rounded-xl gap-1 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedCopy('evaluated')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedCopy === 'evaluated'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-emerald-800 dark:text-emerald-200 hover:text-emerald-950'
                  }`}
                >
                  Evaluated (Marked PDF)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCopy('original')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedCopy === 'original'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-emerald-800 dark:text-emerald-200 hover:text-emerald-950'
                  }`}
                >
                  Original Submission
                </button>
              </div>
            )}
          </div>
        )}

        {/* Content Viewer Body */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950/60 p-3 sm:p-4 overflow-hidden flex flex-col items-center justify-center relative">
          {viewMode === 'notes' && explanationText ? (
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 overflow-y-auto space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#5B4BFF] tracking-wider block">
                    Student Written Scope &amp; Technical Analysis
                  </span>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    {projectTitle || title}
                  </h4>
                </div>
                {submittedAt && (
                  <span className="text-xs text-slate-400 font-medium">
                    Submitted on {new Date(submittedAt).toLocaleString()}
                  </span>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">
                {explanationText}
              </div>

              {facultyRemarks && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase">
                      Faculty Evaluation Feedback:
                    </span>
                    {marksObtained !== null && marksObtained !== undefined && (
                      <span className="font-bold text-xs text-emerald-700 dark:text-emerald-300">
                        {marksObtained} / {maxMarks || 20} Marks
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 italic pt-1">
                    &ldquo;{facultyRemarks}&rdquo;
                  </p>
                </div>
              )}
            </div>
          ) : loadingDoc ? (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 my-auto">
              <div className="w-10 h-10 border-3 border-[#5B4BFF] border-t-transparent rounded-full animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800 dark:text-white">
                  Loading {documentName || 'Submission Document'}...
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Streaming verified institutional deliverable
                </p>
              </div>
            </div>
          ) : loadError && !blobObjectUrl ? (
            <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm my-auto">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Preview unavailable</h4>
                <p className="text-xs text-slate-500 mt-1">{loadError}</p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setReloadKey((k) => k + 1)}
                  className="px-4 py-2 rounded-xl bg-[#5B4BFF] text-white text-xs font-bold hover:bg-[#4E3EE8] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
                {activeDocUrl && (
                  <a
                    href={blobObjectUrl || activeDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Original</span>
                  </a>
                )}
              </div>
            </div>
          ) : isImage && (blobObjectUrl || activeDocUrl || documentUrl) ? (
            <div className="w-full h-full overflow-auto flex items-center justify-center p-2 sm:p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={blobObjectUrl || activeDocUrl || documentUrl}
                alt={documentName || "Document Preview"}
                className="max-w-full max-h-full object-contain rounded-xl shadow-lg border border-slate-200 dark:border-slate-800"
              />
            </div>
          ) : viewMode === 'canvas' && pdfDataBuffer ? (
            <PdfCanvasViewer pdfData={pdfDataBuffer} blobUrl={blobObjectUrl || documentUrl} />
          ) : (blobObjectUrl || activeDocUrl) ? (
            <div className="w-full h-full relative rounded-xl overflow-hidden bg-white border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
              <iframe
                src={blobObjectUrl || `${activeDocUrl}#toolbar=1&navpanes=0`}
                title={documentName || 'Submission Document Preview'}
                className="w-full h-full rounded-xl bg-white border-0 min-h-[480px]"
              />
            </div>
          ) : (
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 overflow-y-auto space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#5B4BFF] flex items-center justify-center font-bold shadow-sm">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white">
                      {documentName || projectTitle || title}
                    </h4>
                    <span className="text-xs text-slate-400">
                      Academic Deliverable • Candidate: <strong className="text-slate-700 dark:text-slate-200">{studentName || 'Student'}</strong> {studentRollNo ? `(${studentRollNo})` : ''}
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800/60">
                  ✓ Verified Submission
                </span>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                <span className="text-xs font-black uppercase text-[#5B4BFF] tracking-wider block">
                  Submission Summary &amp; Technical Analysis
                </span>
                <p className="text-sm text-slate-800 dark:text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">
                  {explanationText || 'In-depth research and comprehensive deliverable documentation submitted on schedule for faculty evaluation.'}
                </p>
              </div>

              {facultyRemarks && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase">
                      Faculty Remarks &amp; Feedback:
                    </span>
                    {marksObtained !== null && marksObtained !== undefined && (
                      <span className="font-bold text-xs text-emerald-700 dark:text-emerald-300">
                        {marksObtained} / {maxMarks || 20} Marks
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 italic pt-1">
                    &ldquo;{facultyRemarks}&rdquo;
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Digital Logbook Document Visualizer • Verified Institutional Deliverable</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer shadow-sm"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
