'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Bookmark,
  BookmarkPlus,
  BookmarkCheck,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Save,
  FileText,
  Trash2,
  Compass,
  ZoomIn,
  ZoomOut,
  Layers,
  Monitor,
  Check,
  Sliders,
  ChevronDown
} from 'lucide-react';

export interface BookmarkItem {
  id: string;
  page: number;
  scroll_offset: number; // percentage (0 - 100)
  title: string;
  note?: string;
  created_at: string;
}

export interface ReadingProgressData {
  id?: string;
  book_id: string;
  book_title?: string;
  book_author?: string;
  cover_url?: string | null;
  pdf_url?: string | null;
  last_page_read: number;
  total_pages: number;
  percentage_read: number;
  is_completed: boolean;
  reading_time_seconds?: number;
  scroll_position?: number;
  bookmarks?: BookmarkItem[];
  last_location_description?: string;
  last_read_at?: string;
}

interface BookReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: {
    ttl_id: string;
    titleid: string;
    title: string;
    author: string;
    cover_url: string | null;
    pdf_url: string | null;
    external_link: string | null;
  };
  initialProgress?: ReadingProgressData | null;
  onProgressUpdated?: (updated: ReadingProgressData) => void;
}

// Robust helper to load PDF.js from local public/ directory with zero bundler issues
async function getPdfJsLib(): Promise<any> {
  if (typeof window === 'undefined') return null;

  if ((window as any).pdfjsLib) {
    try {
      (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    } catch (e) {}
    return (window as any).pdfjsLib;
  }

  return new Promise((resolve, reject) => {
    const existing = document.getElementById('pdfjs-lib-loader');
    if (existing) {
      const interval = setInterval(() => {
        if ((window as any).pdfjsLib) {
          clearInterval(interval);
          try {
            (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
          } catch (e) {}
          resolve((window as any).pdfjsLib);
        }
      }, 50);

      setTimeout(() => {
        clearInterval(interval);
        if ((window as any).pdfjsLib) {
          resolve((window as any).pdfjsLib);
        } else {
          reject(new Error('PDF.js script load timeout'));
        }
      }, 7000);
      return;
    }

    const script = document.createElement('script');
    script.id = 'pdfjs-lib-loader';
    script.src = '/pdf.min.js';
    script.async = true;
    script.onload = () => {
      const lib = (window as any).pdfjsLib;
      if (lib) {
        try {
          lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
        } catch (e) {}
        resolve(lib);
      } else {
        reject(new Error('pdfjsLib not defined after script load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load /pdf.min.js'));
    document.head.appendChild(script);
  });
}

export default function BookReaderModal({
  isOpen,
  onClose,
  book,
  initialProgress,
  onProgressUpdated,
}: BookReaderModalProps) {
  // Page states
  const [currentPage, setCurrentPage] = useState<number>(() => {
    return initialProgress?.last_page_read ? Math.max(1, initialProgress.last_page_read) : 1;
  });
  const [totalPages, setTotalPages] = useState<number>(() => {
    return initialProgress?.total_pages && initialProgress.total_pages > 1 
      ? initialProgress.total_pages 
      : 120;
  });
  const [scrollPosition, setScrollPosition] = useState<number>(() => {
    return initialProgress?.scroll_position ? Number(initialProgress.scroll_position) : 0;
  });
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => {
    return Array.isArray(initialProgress?.bookmarks) ? initialProgress.bookmarks : [];
  });

  const [jumpPageInput, setJumpPageInput] = useState<string>(() => {
    return String(initialProgress?.last_page_read ? Math.max(1, initialProgress.last_page_read) : 1);
  });
  const [readerMode, setReaderMode] = useState<'canvas' | 'native'>('canvas');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [readingSeconds, setReadingSeconds] = useState<number>(0);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [newBookmarkNote, setNewBookmarkNote] = useState('');
  const [scale, setScale] = useState<number>(1.25);
  const [resumedBanner, setResumedBanner] = useState<string | null>(null);

  // PDF.js canvas state
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pdfLoading, setPdfLoading] = useState<boolean>(true);
  const [pageRendering, setPageRendering] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  const modalContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Resolved PDF URL through local proxy to eliminate all CORS & streaming issues
  const proxiedPdfUrl = book.pdf_url
    ? `/api/srms/pdf-proxy?url=${encodeURIComponent(book.pdf_url)}`
    : null;

  // Initialize and load PDF document with PDF.js
  useEffect(() => {
    if (!isOpen || !proxiedPdfUrl) return;
    let active = true;

    async function initPdf() {
      try {
        setPdfLoading(true);
        setPdfError(null);

        const pdfjs = await getPdfJsLib();
        if (!active) return;

        const loadingTask = pdfjs.getDocument({
          url: proxiedPdfUrl as string,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (active) {
          setPdfDoc(doc);
          const detectedPages = doc.numPages;
          setTotalPages(detectedPages);

          const startPage = initialProgress?.last_page_read 
            ? Math.min(detectedPages, Math.max(1, initialProgress.last_page_read)) 
            : 1;
          setCurrentPage(startPage);
          setJumpPageInput(String(startPage));
          setPdfLoading(false);
        }
      } catch (err: any) {
        console.warn('PDF.js loading note:', err?.message);
        if (active) {
          setPdfError(err?.message || 'Could not load canvas engine, switching to native reader');
          setReaderMode('native');
          setPdfLoading(false);
        }
      }
    }

    initPdf();
    return () => {
      active = false;
    };
  }, [isOpen, proxiedPdfUrl, initialProgress?.last_page_read]);

  // Render current page to Canvas with High-DPI sharpness
  useEffect(() => {
    if (!pdfDoc || readerMode !== 'canvas' || !canvasRef.current) return;
    let active = true;

    async function renderPage() {
      try {
        setPageRendering(true);
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch (e) {}
        }

        const pageNum = Math.min(pdfDoc.numPages, Math.max(1, currentPage));
        const page = await pdfDoc.getPage(pageNum);
        if (!active) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;

        const outputScale = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
        const viewport = page.getViewport({ scale });

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = Math.floor(viewport.width) + 'px';
        canvas.style.height = Math.floor(viewport.height) + 'px';

        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

        const renderContext = {
          canvasContext: context,
          transform: transform,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        if (active) setPageRendering(false);
      } catch (err: any) {
        if (active) setPageRendering(false);
      }
    }

    renderPage();
    return () => {
      active = false;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {}
      }
    };
  }, [pdfDoc, currentPage, scale, readerMode]);

  // Sync initial progress when book opens
  useEffect(() => {
    if (isOpen) {
      isMountedRef.current = true;
      const startPage = initialProgress?.last_page_read ? Math.max(1, initialProgress.last_page_read) : 1;
      const pages = initialProgress?.total_pages && initialProgress.total_pages > 1 ? initialProgress.total_pages : 120;
      const scrollPos = initialProgress?.scroll_position ? Number(initialProgress.scroll_position) : 0;
      const bms = Array.isArray(initialProgress?.bookmarks) ? initialProgress.bookmarks : [];

      setCurrentPage(startPage);
      setTotalPages(pages);
      setScrollPosition(scrollPos);
      setBookmarks(bms);
      setJumpPageInput(String(startPage));
      setSaveStatus('idle');

      if (startPage > 1) {
        setResumedBanner(
          `📍 Resumed at your exact location: Page ${startPage} of ${pages}`
        );
        setTimeout(() => {
          if (isMountedRef.current) setResumedBanner(null);
        }, 6000);
      }
    }
  }, [isOpen, initialProgress, book.ttl_id]);

  // Reading time counter
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setReadingSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Persist reading progress & bookmarks to backend & PostgreSQL
  const persistProgress = useCallback(
    async (
      page: number,
      total: number,
      currentScroll: number,
      currentBookmarks: BookmarkItem[],
      completed = false
    ) => {
      try {
        setSaveStatus('saving');

        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const tenantSlug =
          typeof window !== 'undefined'
            ? localStorage.getItem('tenantSlug') || localStorage.getItem('tenant') || 'srms-cet-bareilly'
            : 'srms-cet-bareilly';

        let userObj: any = {};
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) userObj = JSON.parse(userStr);
        } catch (e) {}

        const userId = userObj.id || userObj.sub || userObj.usr_id || userObj.emp_id || '202616658';
        const userRole = userObj.role || (typeof window !== 'undefined' ? localStorage.getItem('role') : 'FACULTY');
        const userName = userObj.name || userObj.full_name || 'Academic User';

        const safeTotal = Math.max(1, total);
        const safePage = Math.min(safeTotal, Math.max(1, page));
        const pct = Number(((safePage / safeTotal) * 100).toFixed(1));
        const isDone = completed || safePage >= safeTotal;
        const safeScroll = Number(Math.min(100, Math.max(0, currentScroll)).toFixed(2));
        const locationDesc = `Page ${safePage} of ${safeTotal} (${pct}% completed)`;

        const payload = {
          bookId: book.ttl_id || book.titleid,
          book_id: book.ttl_id || book.titleid,
          bookTitle: book.title,
          bookAuthor: book.author,
          coverUrl: book.cover_url,
          pdfUrl: book.pdf_url,
          lastPageRead: safePage,
          last_page_read: safePage,
          totalPages: safeTotal,
          total_pages: safeTotal,
          percentageRead: pct,
          percentage_read: pct,
          scrollPosition: safeScroll,
          scroll_position: safeScroll,
          bookmarks: currentBookmarks,
          lastLocationDescription: locationDesc,
          last_location_description: locationDesc,
          isCompleted: isDone,
          is_completed: isDone,
          readingTimeSeconds: 1,
          userId,
          userRole,
          userName,
          tenantSlug,
        };

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug,
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch('/api/library/progress', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          if (isMountedRef.current) {
            setSaveStatus('saved');
            setTimeout(() => {
              if (isMountedRef.current) setSaveStatus('idle');
            }, 3000);
          }

          if (onProgressUpdated) {
            onProgressUpdated({
              book_id: book.ttl_id || book.titleid,
              book_title: book.title,
              book_author: book.author,
              cover_url: book.cover_url,
              pdf_url: book.pdf_url,
              last_page_read: safePage,
              total_pages: safeTotal,
              percentage_read: pct,
              scroll_position: safeScroll,
              bookmarks: currentBookmarks,
              last_location_description: locationDesc,
              is_completed: isDone,
              last_read_at: new Date().toISOString(),
            });
          }
        }
      } catch (err) {
        console.error('Failed to save reading progress:', err);
        if (isMountedRef.current) setSaveStatus('idle');
      }
    },
    [book, onProgressUpdated]
  );

  // Debounced auto-save on page change
  const triggerDebouncedSave = useCallback(
    (page: number, currentBookmarks = bookmarks) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        const scrollPct = Number((((page - 1) / Math.max(1, totalPages - 1)) * 100).toFixed(1));
        persistProgress(page, totalPages, scrollPct, currentBookmarks);
      }, 600);
    },
    [totalPages, bookmarks, persistProgress]
  );

  // Change page with auto-saving & container reset
  const handlePageChange = useCallback(
    (newPage: number) => {
      const validPage = Math.min(totalPages, Math.max(1, newPage));
      setCurrentPage(validPage);
      setJumpPageInput(String(validPage));

      const scrollPct = Number((((validPage - 1) / Math.max(1, totalPages - 1)) * 100).toFixed(1));
      setScrollPosition(scrollPct);

      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }

      triggerDebouncedSave(validPage);
    },
    [totalPages, triggerDebouncedSave]
  );

  // Mouse wheel listener in canvas mode: scroll down flips to next page, scroll up flips to previous page
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (readerMode !== 'canvas') return;
    const container = scrollContainerRef.current;
    if (!container) return;

    // If at bottom and scrolling down -> next page
    if (e.deltaY > 60 && container.scrollTop + container.clientHeight >= container.scrollHeight - 10) {
      if (currentPage < totalPages) {
        handlePageChange(currentPage + 1);
      }
    } else if (e.deltaY < -60 && container.scrollTop <= 10) {
      if (currentPage > 1) {
        handlePageChange(currentPage - 1);
      }
    }
  };

  // Keyboard navigation (ArrowLeft / ArrowRight / PageUp / PageDown)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        handlePageChange(currentPage + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePageChange(currentPage - 1);
      } else if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentPage, handlePageChange]);

  // Bookmark Management
  const isCurrentPageBookmarked = bookmarks.some((b) => b.page === currentPage);

  const toggleBookmarkCurrentPage = () => {
    let updated: BookmarkItem[];
    if (isCurrentPageBookmarked) {
      updated = bookmarks.filter((b) => b.page !== currentPage);
    } else {
      const newBm: BookmarkItem = {
        id: `bm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        page: currentPage,
        scroll_offset: scrollPosition,
        title: `Bookmark at Page ${currentPage}`,
        note: newBookmarkNote.trim() || `Bookmarked on Page ${currentPage}`,
        created_at: new Date().toISOString(),
      };
      updated = [newBm, ...bookmarks];
      setNewBookmarkNote('');
    }
    setBookmarks(updated);
    persistProgress(currentPage, totalPages, scrollPosition, updated);
  };

  const removeBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = bookmarks.filter((b) => b.id !== id);
    setBookmarks(updated);
    persistProgress(currentPage, totalPages, scrollPosition, updated);
  };

  const jumpToBookmark = (bm: BookmarkItem) => {
    handlePageChange(bm.page);
    setIsBookmarksOpen(false);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!modalContainerRef.current) return;
    if (!document.fullscreenElement) {
      modalContainerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Close and flush save immediately with latest confirmed page
  const handleClose = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const parsedInput = parseInt(jumpPageInput, 10);
    const finalPage =
      !isNaN(parsedInput) && parsedInput >= 1 && parsedInput <= totalPages
        ? parsedInput
        : currentPage;

    const scrollPct = Number((((finalPage - 1) / Math.max(1, totalPages - 1)) * 100).toFixed(1));
    persistProgress(finalPage, totalPages, scrollPct, bookmarks);
    onClose();
  };

  if (!isOpen) return null;

  const currentPercent = Math.min(100, Math.round((currentPage / totalPages) * 100));
  const minutesSpent = Math.floor(readingSeconds / 60);
  const secondsSpent = readingSeconds % 60;

  // Iframe native URL with direct page anchor
  const nativeIframeSrc = proxiedPdfUrl
    ? `${proxiedPdfUrl}#page=${currentPage}&view=FitH&toolbar=1&navpanes=0`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
      <div
        ref={modalContainerRef}
        className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] shadow-2xl flex flex-col w-full max-w-6xl h-[95vh] overflow-hidden relative"
      >
        {/* Modal Top Header Bar */}
        <div className="bg-gradient-to-r from-[#2D2575] via-[#3E3498] to-[#5B4BFF] text-white p-3.5 sm:p-4 px-4 sm:px-6 flex items-center justify-between border-b border-white/10 shadow-md flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center flex-shrink-0 text-[#F36C21]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-black/40 px-2 py-0.5 rounded border border-white/10 text-orange-200">
                  ID: {book.ttl_id || book.titleid}
                </span>
                <span className="text-[10px] font-bold bg-[#00C48C]/90 text-white px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                  <Compass className="w-3 h-3" />
                  <span>Page {currentPage} of {totalPages}</span>
                </span>
                {bookmarks.length > 0 && (
                  <span className="text-[10px] font-bold bg-[#F36C21] text-white px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                    <BookmarkCheck className="w-3 h-3" />
                    <span>{bookmarks.length} Bookmarks</span>
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-black truncate text-white leading-tight mt-0.5" title={book.title}>
                {book.title}
              </h2>
              <p className="text-[11px] text-purple-200 truncate font-medium">
                By {book.author || 'Academic Publication'}
              </p>
            </div>
          </div>

          {/* Header Action Badges & Controls */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            
            {/* Mode Switcher: Canvas vs Native Embed */}
            <div className="flex items-center p-0.5 bg-black/30 rounded-xl border border-white/15 text-xs font-bold">
              <button
                type="button"
                onClick={() => setReaderMode('canvas')}
                className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                  readerMode === 'canvas'
                    ? 'bg-[#F36C21] text-white shadow-sm font-black'
                    : 'text-purple-200 hover:text-white'
                }`}
                title="Interactive Canvas Reader with live page tracking"
              >
                <Layers className="w-3 h-3" />
                <span>Interactive Flip</span>
              </button>
              <button
                type="button"
                onClick={() => setReaderMode('native')}
                className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                  readerMode === 'native'
                    ? 'bg-[#F36C21] text-white shadow-sm font-black'
                    : 'text-purple-200 hover:text-white'
                }`}
                title="Native Browser PDF Document Viewer"
              >
                <Monitor className="w-3 h-3" />
                <span>Native PDF</span>
              </button>
            </div>

            {/* Memory / DB Save Status Badge */}
            <div
              className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
                saveStatus === 'saving'
                  ? 'bg-amber-500/20 text-amber-200 border-amber-400/30 animate-pulse'
                  : saveStatus === 'saved'
                  ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
                  : 'bg-white/10 text-purple-200 border-white/10'
              }`}
            >
              {saveStatus === 'saving' ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                  <span>Saving to DB...</span>
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Page {currentPage} Saved</span>
                </>
              ) : (
                <>
                  <Save className="w-3 h-3 text-[#F36C21]" />
                  <span>PostgreSQL Synced</span>
                </>
              )}
            </div>

            {/* Quick Bookmark Button */}
            <button
              type="button"
              onClick={toggleBookmarkCurrentPage}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                isCurrentPageBookmarked
                  ? 'bg-[#F36C21] text-white border-orange-400 shadow-md shadow-orange-500/25'
                  : 'bg-white/10 text-purple-100 hover:bg-white/20 border-white/20'
              }`}
              title={isCurrentPageBookmarked ? 'Remove Bookmark from this page' : 'Bookmark this page'}
            >
              {isCurrentPageBookmarked ? (
                <>
                  <BookmarkCheck className="w-4 h-4 fill-white" />
                  <span className="hidden md:inline">Bookmarked</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-4 h-4" />
                  <span className="hidden md:inline">Bookmark</span>
                </>
              )}
            </button>

            {/* Bookmarks List Drawer Toggle */}
            <button
              type="button"
              onClick={() => setIsBookmarksOpen(!isBookmarksOpen)}
              className={`p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                isBookmarksOpen
                  ? 'bg-white text-[#2D2575] border-white shadow-lg'
                  : 'bg-white/10 text-purple-100 hover:bg-white/20 border-white/20'
              }`}
              title="Open Bookmarks Drawer"
            >
              <Bookmark className="w-4 h-4 text-[#F36C21]" />
              <span className="hidden sm:inline font-mono">({bookmarks.length})</span>
            </button>

            {/* Zoom Controls in Canvas Mode */}
            {readerMode === 'canvas' && (
              <div className="hidden lg:flex items-center bg-black/30 rounded-lg p-0.5 border border-white/10">
                <button
                  type="button"
                  onClick={() => setScale((s) => Math.max(0.7, s - 0.2))}
                  className="p-1 hover:bg-white/20 rounded text-slate-300 hover:text-white"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono px-1 font-bold">{Math.round(scale * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
                  className="p-1 hover:bg-white/20 rounded text-slate-300 hover:text-white"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 sm:p-2 rounded-xl bg-white/15 hover:bg-rose-600 text-white transition-colors cursor-pointer"
              title="Save & Close Reader"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Resumed Location Notification Toast */}
        {resumedBanner && (
          <div className="bg-[#F36C21] text-white px-4 py-1.5 text-xs font-bold flex items-center justify-between shadow-inner animate-in slide-in-from-top duration-300 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 animate-spin" />
              <span>{resumedBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setResumedBanner(null)}
              className="text-white/80 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Dynamic Dual Progress Bar: Page & Scroll Offset */}
        <div className="w-full bg-[#E7EAF3] dark:bg-slate-800 h-1.5 relative overflow-hidden flex-shrink-0">
          <div
            className="h-full bg-gradient-to-r from-[#5B4BFF] via-[#7867FF] to-[#F36C21] transition-all duration-300 rounded-r-full"
            style={{ width: `${Math.max(2, currentPercent)}%` }}
          />
        </div>

        {/* Reader Center Workspace with Sliding Bookmarks Drawer */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden flex">
          
          {/* Main Document Reading Viewport */}
          <div
            ref={scrollContainerRef}
            onWheel={handleWheel}
            className="flex-1 w-full h-full relative overflow-y-auto overflow-x-auto flex flex-col items-center justify-start p-2 sm:p-4"
          >
            {/* Mode 1: Canvas Reader (Default & Live Synchronized) */}
            {readerMode === 'canvas' ? (
              pdfLoading ? (
                <div className="my-auto flex flex-col items-center justify-center p-12 text-center text-white space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#5B4BFF]/20 border border-[#5B4BFF]/30 flex items-center justify-center text-[#F36C21] animate-pulse">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">Opening Academic E-Book Engine...</h4>
                    <p className="text-xs text-purple-200 mt-1">Preparing Page {currentPage} of {totalPages}</p>
                  </div>
                  <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-[#F36C21] animate-pulse rounded-full" />
                  </div>
                </div>
              ) : (
                <div className="relative flex flex-col items-center my-auto transition-all duration-300">
                  {pageRendering && (
                    <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-black/60 backdrop-blur rounded text-[10px] text-white font-mono flex items-center gap-1.5">
                      <RotateCcw className="w-3 h-3 animate-spin text-[#F36C21]" />
                      <span>Rendering...</span>
                    </div>
                  )}
                  <div className="relative shadow-2xl rounded-lg overflow-hidden border border-slate-700 bg-white">
                    <canvas ref={canvasRef} className="block max-w-full h-auto" />
                  </div>
                  <div className="mt-2 text-center text-[11px] font-mono text-slate-400 flex items-center gap-2">
                    <span className="text-white font-bold">Page {currentPage} of {totalPages}</span>
                    <span>&bull;</span>
                    <span>Use &larr; / &rarr; keys, scroll wheel, or slider below to turn pages</span>
                  </div>
                </div>
              )
            ) : (
              /* Mode 2: Native PDF Viewer with Quick Location Sync Bar */
              <div className="w-full h-full relative bg-slate-900 flex flex-col">
                <div className="p-2.5 bg-gradient-to-r from-[#2D2575] via-[#3E3498] to-[#2D2575] border-b border-white/10 flex items-center justify-between text-xs text-white px-4 flex-shrink-0 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#F36C21] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                      Native PDF Active
                    </span>
                    <span className="text-purple-100 hidden sm:inline">
                      If you scrolled inside the browser viewer, confirm your page:
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-purple-200">Page:</span>
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={jumpPageInput}
                      onChange={(e) => {
                        setJumpPageInput(e.target.value);
                        const parsed = parseInt(e.target.value, 10);
                        if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
                          setCurrentPage(parsed);
                          triggerDebouncedSave(parsed);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const parsed = parseInt(jumpPageInput, 10);
                          if (!isNaN(parsed)) handlePageChange(parsed);
                        }
                      }}
                      className="w-16 text-center py-1 text-xs font-black rounded-lg border border-white/20 bg-black/40 text-white focus:outline-none focus:ring-1 focus:ring-[#F36C21]"
                      placeholder="Page #"
                    />
                    <span className="text-xs text-purple-200 font-bold">of {totalPages}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const parsed = parseInt(jumpPageInput, 10);
                        if (!isNaN(parsed)) handlePageChange(parsed);
                      }}
                      className="px-3 py-1 bg-[#F36C21] hover:bg-[#e05b10] text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                    >
                      Sync &amp; Save Page {jumpPageInput || currentPage}
                    </button>
                  </div>
                </div>
                <iframe
                  key={`${book.ttl_id}-p${currentPage}`}
                  src={nativeIframeSrc || ''}
                  title={book.title}
                  className="w-full flex-1 border-0 bg-slate-900"
                />
              </div>
            )}
          </div>

          {/* Bookmarks Drawer / Side Panel */}
          {isBookmarksOpen && (
            <div className="w-80 sm:w-96 bg-white dark:bg-slate-900 border-l border-[#E7EAF3] dark:border-slate-800 flex flex-col h-full z-20 shadow-2xl animate-in slide-in-from-right duration-200">
              <div className="p-4 border-b border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between bg-[#F6F8FC] dark:bg-slate-800/60">
                <div className="flex items-center gap-2">
                  <BookmarkCheck className="w-4 h-4 text-[#F36C21]" />
                  <h3 className="text-xs font-black text-[#1B1E28] dark:text-white uppercase tracking-wider">
                    Bookmarked Locations ({bookmarks.length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBookmarksOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Add New Bookmark Form */}
              <div className="p-3.5 border-b border-[#E7EAF3] dark:border-slate-800 space-y-2.5 bg-purple-50/50 dark:bg-purple-950/20">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  <span>Current Page: <strong className="text-[#5B4BFF]">Page {currentPage} of {totalPages}</strong></span>
                  <span className="font-mono text-[10px] text-slate-400">{currentPercent}% read</span>
                </div>
                <input
                  type="text"
                  value={newBookmarkNote}
                  onChange={(e) => setNewBookmarkNote(e.target.value)}
                  placeholder="Note (e.g. Components of Data Communication)..."
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#1B1E28] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#F36C21]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') toggleBookmarkCurrentPage();
                  }}
                />
                <button
                  type="button"
                  onClick={toggleBookmarkCurrentPage}
                  className="w-full py-1.5 px-3 rounded-xl bg-[#F36C21] hover:bg-[#e05b10] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>{isCurrentPageBookmarked ? 'Update Bookmark' : `Add Bookmark at Page ${currentPage}`}</span>
                </button>
              </div>

              {/* List of Saved Bookmarks */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {bookmarks.length === 0 ? (
                  <div className="text-center py-12 space-y-2 text-slate-400">
                    <Bookmark className="w-8 h-8 mx-auto text-slate-300 opacity-60" />
                    <p className="text-xs font-bold">No bookmarks saved yet</p>
                    <p className="text-[11px]">Click "Bookmark" while reading any page to save your place with custom notes.</p>
                  </div>
                ) : (
                  bookmarks.map((bm) => (
                    <div
                      key={bm.id}
                      onClick={() => jumpToBookmark(bm)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1 group ${
                        bm.page === currentPage
                          ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800 shadow-sm'
                          : 'bg-[#F6F8FC] dark:bg-slate-800/80 border-[#E7EAF3] dark:border-slate-700 hover:border-[#F36C21]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-[#5B4BFF] dark:text-purple-400 flex items-center gap-1">
                          <BookmarkCheck className="w-3.5 h-3.5 text-[#F36C21]" />
                          Page {bm.page} of {totalPages}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => removeBookmark(bm.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            title="Delete Bookmark"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      {bm.note && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 italic font-medium">
                          "{bm.note}"
                        </p>
                      )}
                      <div className="text-[9px] text-slate-400 font-mono flex items-center justify-between pt-1">
                        <span>{new Date(bm.created_at).toLocaleDateString()}</span>
                        <span className="text-[#F36C21] font-bold group-hover:underline">Jump to Page {bm.page} &rarr;</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* Bottom Interactive Navigation & Reading Memory Bar */}
        <div className="bg-white dark:bg-slate-900 border-t border-[#E7EAF3] dark:border-slate-800 p-3 sm:p-4 px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          
          {/* Left: Previous / Next & Fast Page Steppers */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto justify-center sm:justify-start">
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 10)}
              disabled={currentPage <= 10}
              className="px-2 sm:px-2.5 py-1.5 rounded-lg bg-[#F6F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:text-[#F36C21] disabled:opacity-40 cursor-pointer"
              title="Jump back 10 pages"
            >
              -10
            </button>

            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 sm:px-4 py-1.5 rounded-xl bg-[#2D2575] hover:bg-[#3D3396] disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-900/10 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev</span>
            </button>

            {/* Direct Page Input & Status */}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-[#F6F8FC] dark:bg-slate-800 rounded-xl border border-[#E7EAF3] dark:border-slate-700">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Page</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpPageInput}
                onChange={(e) => {
                  setJumpPageInput(e.target.value);
                  const parsed = parseInt(e.target.value, 10);
                  if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
                    setCurrentPage(parsed);
                    triggerDebouncedSave(parsed);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const parsed = parseInt(jumpPageInput, 10);
                    if (!isNaN(parsed)) handlePageChange(parsed);
                  }
                }}
                className="w-14 sm:w-16 text-center py-0.5 text-xs font-black rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[#1B1E28] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#F36C21]"
              />
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => {
                  const parsed = parseInt(jumpPageInput, 10);
                  if (!isNaN(parsed)) handlePageChange(parsed);
                }}
                className="px-2 py-0.5 rounded bg-[#F36C21] text-white text-[10px] font-black hover:bg-[#e05b10] cursor-pointer"
              >
                Go
              </button>
            </div>

            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 sm:px-4 py-1.5 rounded-xl bg-[#2D2575] hover:bg-[#3D3396] disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-900/10 transition-all cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 10)}
              disabled={currentPage >= totalPages - 10}
              className="px-2 sm:px-2.5 py-1.5 rounded-lg bg-[#F6F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:text-[#F36C21] disabled:opacity-40 cursor-pointer"
              title="Jump ahead 10 pages"
            >
              +10
            </button>
          </div>

          {/* Center: Interactive Scrubber Slider */}
          <div className="hidden xl:flex items-center gap-2 flex-1 max-w-xs mx-4">
            <span className="text-[10px] font-mono text-slate-400">1</span>
            <input
              type="range"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => handlePageChange(parseInt(e.target.value, 10))}
              className="w-full accent-[#F36C21] h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              title={`Drag to scrub pages: currently Page ${currentPage}`}
            />
            <span className="text-[10px] font-mono text-slate-400">{totalPages}</span>
          </div>

          {/* Right: Exact Location Memory & Save/Complete Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center sm:justify-end w-full sm:w-auto">
            <div className="text-right hidden md:block">
              <div className="text-xs font-black text-[#1B1E28] dark:text-white flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-[#00C48C]" />
                <span>Page {currentPage} of {totalPages} ({currentPercent}%)</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {totalPages - currentPage} pages remaining
              </div>
            </div>

            <button
              type="button"
              onClick={() => persistProgress(currentPage, totalPages, scrollPosition, bookmarks, true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Mark as 100% completed in library memory"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Mark Completed</span>
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-1.5 rounded-xl bg-[#F36C21] hover:bg-[#E05B10] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/25 transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save &amp; Exit</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
