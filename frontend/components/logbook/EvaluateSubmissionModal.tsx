'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Award,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  ExternalLink,
  Sparkles,
  User,
  Check,
  Circle,
  Minus,
  PenTool,
  Type,
  Undo2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ShieldCheck,
  Eye,
  FileCheck2,
  Loader2,
  Save,
  Hash,
  Slash,
  Move,
} from 'lucide-react';

export interface PdfAnnotation {
  id: string;
  page: number;
  type: 'tick' | 'cross' | 'circle' | 'line' | 'strike' | 'pen' | 'text' | 'number_stamp';
  x: number;
  y: number;
  w?: number;
  h?: number;
  x_ratio?: number;
  y_ratio?: number;
  w_ratio?: number;
  h_ratio?: number;
  canvasWidth?: number;
  canvasHeight?: number;
  color: 'red' | 'green' | 'blue' | 'purple';
  thickness?: number;
  text?: string;
  fontSize?: number;
  points?: Array<{ x: number; y: number }>;
  style?: 'circle' | 'badge';
  endX?: number;
  endY?: number;
}

export interface SubmissionDetail {
  id: string;
  student_id: string;
  student_name: string;
  rollno?: string;
  registration_no?: string;
  photo_url?: string;
  course_name?: string;
  batch_name?: string;
  topic_title: string;
  topic_description?: string;
  max_marks: number;
  file_url?: string;
  file_name?: string;
  file_size?: string;
  explanation_text?: string;
  status: string;
  submitted_at: string;
  marks_obtained?: number;
  marks_awarded?: number;
  remarks?: string;
  evaluated_at?: string;
  evaluated_file_url?: string;
  annotations?: PdfAnnotation[];
}

interface EvaluateSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: SubmissionDetail | null;
  onSuccess: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

const COLOR_MAP = {
  red: '#F04438',
  green: '#00C48C',
  blue: '#5B4BFF',
  purple: '#8B5CF6',
};

export default function EvaluateSubmissionModal({
  isOpen,
  onClose,
  submission,
  onSuccess,
}: EvaluateSubmissionModalProps) {
  const maxMarks = Number(submission?.max_marks || 10);

  // Rubric State
  const [marks, setMarks] = useState<number | string>(10);
  const [remarks, setRemarks] = useState<string>('');
  const [digitalStamp, setDigitalStamp] = useState<boolean>(true);
  const [status, setStatus] = useState<string>('SUBMITTED');

  // Viewer / Studio State
  const [activeView, setActiveView] = useState<'STUDIO' | 'FINAL_PDF' | 'TEXT'>('STUDIO');
  const [activeTool, setActiveTool] = useState<
    'hand' | 'tick' | 'cross' | 'circle' | 'line' | 'strike' | 'pen' | 'stamp' | 'text'
  >('tick');
  const [activeColor, setActiveColor] = useState<'red' | 'green' | 'blue' | 'purple'>('red');
  const [activeThickness, setActiveThickness] = useState<number>(2.5);

  // Exam Marks & Fast Stamp State
  const [activeStampText, setActiveStampText] = useState<string>('+1');
  const [stampStyle, setStampStyle] = useState<'circle' | 'badge'>('circle');
  const [customStampInput, setCustomStampInput] = useState<string>('');

  // Annotations State
  const [annotations, setAnnotations] = useState<PdfAnnotation[]>([]);
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Text Prompt State
  const [textPrompt, setTextPrompt] = useState<{ x: number; y: number; text: string } | null>(null);

  // PDF Rendering State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [pdfLoading, setPdfLoading] = useState<boolean>(true);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [imageDoc, setImageDoc] = useState<HTMLImageElement | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  // Canvas Refs
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const markCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const currentPathRef = useRef<Array<{ x: number; y: number }>>([]);
  const shapeStartRef = useRef<{ x: number; y: number } | null>(null);

  // Action Loading State
  const [finalizing, setFinalizing] = useState<boolean>(false);
  const [evalSuccess, setEvalSuccess] = useState<boolean>(false);
  const [evaluatedPdfUrl, setEvaluatedPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redraw Annotations on Foreground Canvas (defined before useEffect hooks)
  const redrawAnnotations = useCallback(() => {
    const markCanvas = markCanvasRef.current;
    if (!markCanvas) return;
    const ctx = markCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, markCanvas.width, markCanvas.height);

    const pageAnnotations = annotations.filter((a) => a.page === currentPage);

    for (const ann of pageAnnotations) {
      ctx.save();
      const color = COLOR_MAP[ann.color] || COLOR_MAP.red;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = ann.thickness || 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Scale points relative to current canvas width/height
      const canvasW = markCanvas.width;
      const canvasH = markCanvas.height;
      const x = ann.x_ratio !== undefined ? ann.x_ratio * canvasW : (ann.x / (ann.canvasWidth || canvasW)) * canvasW;
      const y = ann.y_ratio !== undefined ? ann.y_ratio * canvasH : (ann.y / (ann.canvasHeight || canvasH)) * canvasH;
      const w = ann.w_ratio !== undefined ? ann.w_ratio * canvasW : (ann.w ? (ann.w / (ann.canvasWidth || canvasW)) * canvasW : 26);
      const h = ann.h_ratio !== undefined ? ann.h_ratio * canvasH : (ann.h ? (ann.h / (ann.canvasHeight || canvasH)) * canvasH : 26);

      if (ann.type === 'tick') {
        ctx.beginPath();
        ctx.moveTo(x, y + h * 0.5);
        ctx.lineTo(x + w * 0.35, y + h);
        ctx.lineTo(x + w, y);
        ctx.stroke();
      } else if (ann.type === 'cross') {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y + h);
        ctx.moveTo(x + w, y);
        ctx.lineTo(x, y + h);
        ctx.stroke();
      } else if (ann.type === 'circle') {
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, Math.max(w / 2, 6), Math.max(h / 2, 6), 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (ann.type === 'line') {
        const targetEndX = ann.endX !== undefined ? (ann.endX / (ann.canvasWidth || canvasW)) * canvasW : x + w;
        const targetEndY = ann.endY !== undefined ? (ann.endY / (ann.canvasHeight || canvasH)) * canvasH : y;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(targetEndX, targetEndY);
        ctx.stroke();
      } else if (ann.type === 'strike') {
        ctx.beginPath();
        ctx.moveTo(x, y + h / 2);
        ctx.lineTo(x + w, y + h / 2);
        ctx.stroke();
      } else if (ann.type === 'number_stamp') {
        const textStr = ann.text || '+1';
        const isCircle = ann.style !== 'badge';
        const fontSize = ann.fontSize || 13;
        ctx.font = `bold ${fontSize}px sans-serif`;
        const metrics = ctx.measureText(textStr);
        const textWidth = metrics.width;
        const radius = Math.max(textWidth / 2 + 7, fontSize / 2 + 7, 16);

        if (isCircle) {
          ctx.shadowColor = 'rgba(0,0,0,0.12)';
          ctx.shadowBlur = 4;
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.fill();

          ctx.shadowColor = 'transparent';
          ctx.strokeStyle = color;
          ctx.lineWidth = Math.max(ann.thickness || 2.2, 1.8);
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.stroke();

          ctx.fillStyle = color;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(textStr, x, y);
        } else {
          const padX = 8;
          const padY = 5;
          const bW = textWidth + padX * 2;
          const bH = fontSize + padY * 2;
          ctx.shadowColor = 'rgba(0,0,0,0.12)';
          ctx.shadowBlur = 4;
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(x - bW / 2, y - bH / 2, bW, bH, 6);
          } else {
            ctx.rect(x - bW / 2, y - bH / 2, bW, bH);
          }
          ctx.fill();

          ctx.shadowColor = 'transparent';
          ctx.strokeStyle = color;
          ctx.lineWidth = Math.max(ann.thickness || 2.2, 1.8);
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(x - bW / 2, y - bH / 2, bW, bH, 6);
          } else {
            ctx.rect(x - bW / 2, y - bH / 2, bW, bH);
          }
          ctx.stroke();

          ctx.fillStyle = color;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(textStr, x, y);
        }
      } else if (ann.type === 'pen' && Array.isArray(ann.points) && ann.points.length > 0) {
        const pts = ann.points;
        ctx.beginPath();
        if (pts.length === 1) {
          const pX = (pts[0].x / (ann.canvasWidth || canvasW)) * canvasW;
          const pY = (pts[0].y / (ann.canvasHeight || canvasH)) * canvasH;
          ctx.arc(pX, pY, (ann.thickness || 2.5) / 2, 0, 2 * Math.PI);
          ctx.fill();
        } else if (pts.length === 2) {
          const p0X = (pts[0].x / (ann.canvasWidth || canvasW)) * canvasW;
          const p0Y = (pts[0].y / (ann.canvasHeight || canvasH)) * canvasH;
          const p1X = (pts[1].x / (ann.canvasWidth || canvasW)) * canvasW;
          const p1Y = (pts[1].y / (ann.canvasHeight || canvasH)) * canvasH;
          ctx.moveTo(p0X, p0Y);
          ctx.lineTo(p1X, p1Y);
          ctx.stroke();
        } else {
          const p0X = (pts[0].x / (ann.canvasWidth || canvasW)) * canvasW;
          const p0Y = (pts[0].y / (ann.canvasHeight || canvasH)) * canvasH;
          ctx.moveTo(p0X, p0Y);
          for (let i = 1; i < pts.length - 1; i++) {
            const curX = (pts[i].x / (ann.canvasWidth || canvasW)) * canvasW;
            const curY = (pts[i].y / (ann.canvasHeight || canvasH)) * canvasH;
            const nextX = (pts[i + 1].x / (ann.canvasWidth || canvasW)) * canvasW;
            const nextY = (pts[i + 1].y / (ann.canvasHeight || canvasH)) * canvasH;
            const midX = (curX + nextX) / 2;
            const midY = (curY + nextY) / 2;
            ctx.quadraticCurveTo(curX, curY, midX, midY);
          }
          const last = pts[pts.length - 1];
          const lastX = (last.x / (ann.canvasWidth || canvasW)) * canvasW;
          const lastY = (last.y / (ann.canvasHeight || canvasH)) * canvasH;
          ctx.lineTo(lastX, lastY);
          ctx.stroke();
        }
      } else if (ann.type === 'text') {
        const textStr = ann.text || '';
        const fontSize = ann.fontSize || 12;
        ctx.font = `bold ${fontSize}px sans-serif`;
        const metrics = ctx.measureText(textStr);
        const textWidth = metrics.width;
        const textHeight = fontSize;

        // Draw background pill
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 4;
        ctx.fillRect(x - 4, y - textHeight - 4, textWidth + 8, textHeight + 8);
        ctx.strokeRect(x - 4, y - textHeight - 4, textWidth + 8, textHeight + 8);

        // Draw text
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(textStr, x, y);
      }

      ctx.restore();
    }
  }, [annotations, currentPage]);

  // 1. Initialize submission state
  useEffect(() => {
    if (!submission) return;

    const initialMarks = submission.marks_awarded !== undefined && submission.marks_awarded !== null
      ? submission.marks_awarded
      : submission.marks_obtained !== undefined && submission.marks_obtained !== null
      ? submission.marks_obtained
      : Math.min(10, maxMarks);

    setMarks(initialMarks);
    setRemarks(
      submission.remarks ||
        'Overall performance was satisfactory and satisfactory progress was observed.'
    );
    setStatus(submission.status || 'SUBMITTED');
    setEvaluatedPdfUrl(submission.evaluated_file_url || null);
    setAnnotations(Array.isArray(submission.annotations) ? submission.annotations : []);
    setEvalSuccess(submission.status === 'EVALUATED');
    setActiveView('STUDIO');
    setError(null);
  }, [submission, maxMarks]);

  // 2. Fetch latest submission annotations & details
  useEffect(() => {
    if (!submission?.id || !isOpen) return;
    const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly' : 'srms-cet-bareilly';

    async function fetchDetails() {
      try {
        const res = await fetch(`${API_BASE}/logbook/submissions/${submission?.id}?tenant=${slug}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.annotations)) {
            setAnnotations(data.annotations);
          }
          if (data.evaluated_file_url) {
            setEvaluatedPdfUrl(data.evaluated_file_url);
          }
          if (data.status) {
            setStatus(data.status);
            if (data.status === 'EVALUATED') setEvalSuccess(true);
          }
        }
      } catch (e) {
        console.warn('Could not fetch latest submission markup:', e);
      }
    }
    fetchDetails();
  }, [submission?.id, isOpen]);

  // 3. Load PDF Document or Image via pdfjs-dist / Image loader
  useEffect(() => {
    if (!isOpen || !submission) return;

    let active = true;
    setPdfLoading(true);
    setPdfError(null);
    setImageDoc(null);
    setPdfDoc(null);

    async function loadDocument() {
      try {
        const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly' : 'srms-cet-bareilly';
        const docUrl = submission?.file_url || `${API_BASE}/logbook/submission/${submission?.id}/document?tenant=${slug}`;

        const fileName = submission?.file_name || '';
        const isImageByName = /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(fileName) || /\.(jpe?g|png|webp|gif|bmp|svg)/i.test(docUrl);

        const docRes = await fetch(docUrl);
        if (!docRes.ok) {
          throw new Error(`Failed to load document (${docRes.status})`);
        }

        const contentType = docRes.headers.get('content-type') || '';
        const blob = await docRes.blob();

        // Check if document is an image (by extension, MIME type, or fallback)
        if (isImageByName || contentType.startsWith('image/')) {
          const blobUrl = URL.createObjectURL(blob);
          const img = new window.Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            if (!active) return;
            setImageDoc(img);
            setNumPages(1);
            setCurrentPage(1);
            setPdfLoading(false);
          };
          img.onerror = () => {
            if (!active) return;
            setPdfError('Failed to load deliverable image');
            setPdfLoading(false);
          };
          img.src = blobUrl;
          return;
        }

        // PDF rendering via pdfjs-dist
        const buffer = await blob.arrayBuffer();
        const uint8 = new Uint8Array(buffer);

        // Check JPEG / PNG magic bytes in binary stream
        if (uint8.length > 4 && ((uint8[0] === 0xff && uint8[1] === 0xd8) || (uint8[0] === 0x89 && uint8[1] === 0x50))) {
          const blobUrl = URL.createObjectURL(blob);
          const img = new window.Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            if (!active) return;
            setImageDoc(img);
            setNumPages(1);
            setCurrentPage(1);
            setPdfLoading(false);
          };
          img.onerror = () => {
            if (!active) return;
            setPdfError('Failed to load image');
            setPdfLoading(false);
          };
          img.src = blobUrl;
          return;
        }

        const pdfjs = await import('pdfjs-dist/legacy/build/pdf');
        try {
          pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
        } catch (e) {}

        let doc: any = null;
        try {
          const task = pdfjs.getDocument({
            data: uint8,
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
            cMapPacked: true,
          });
          doc = await task.promise;
        } catch (firstErr) {
          const fallbackTask = pdfjs.getDocument({
            data: uint8,
            disableWorker: true,
          } as any);
          doc = await fallbackTask.promise;
        }

        if (active && doc) {
          setPdfDoc(doc);
          setNumPages(doc.numPages || 1);
          setCurrentPage(1);
          setPdfLoading(false);
        }
      } catch (err: any) {
        if (active) {
          console.error('Document Canvas loading error:', err);
          setPdfError(err?.message || 'Unable to render document canvas');
          setPdfLoading(false);
        }
      }
    }

    loadDocument();

    return () => {
      active = false;
    };
  }, [isOpen, submission]);

  // 4. Render Active PDF Page or Image on Background Canvas
  useEffect(() => {
    if (pdfLoading) return;

    // A) If Image Document
    if (imageDoc && pdfCanvasRef.current) {
      const canvas = pdfCanvasRef.current;
      const markCanvas = markCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const baseWidth = Math.min(imageDoc.naturalWidth || 800, 1000);
      const aspect = (imageDoc.naturalHeight || 1000) / (imageDoc.naturalWidth || 800);
      const renderW = Math.round(baseWidth * scale);
      const renderH = Math.round(renderW * aspect);

      canvas.width = renderW;
      canvas.height = renderH;

      if (markCanvas) {
        markCanvas.width = renderW;
        markCanvas.height = renderH;
      }

      ctx.drawImage(imageDoc, 0, 0, renderW, renderH);
      redrawAnnotations();
      return;
    }

    // B) If PDF Document
    if (!pdfDoc || !pdfCanvasRef.current) return;

    let active = true;

    async function renderPage() {
      try {
        const page = await pdfDoc.getPage(currentPage);
        if (!active || !pdfCanvasRef.current) return;

        const viewport = page.getViewport({ scale });
        const canvas = pdfCanvasRef.current;
        const markCanvas = markCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (markCanvas) {
          markCanvas.width = viewport.width;
          markCanvas.height = viewport.height;
        }

        await page.render({
          canvasContext: ctx,
          viewport,
        }).promise;

        // Trigger redrawing of annotations on the overlay canvas
        redrawAnnotations();
      } catch (err) {
        console.warn('Page rendering error:', err);
      }
    }

    renderPage();

    return () => {
      active = false;
    };
  }, [pdfDoc, imageDoc, currentPage, scale, pdfLoading, redrawAnnotations]);

  useEffect(() => {
    redrawAnnotations();
  }, [redrawAnnotations]);

  // 6. Autosave Annotations & Marks
  const triggerAutosave = useCallback(
    async (currentAnns: PdfAnnotation[], currentMarks: number | string, currentRemarks: string) => {
      if (!submission?.id) return;
      setAutosaveStatus('saving');
      try {
        const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly' : 'srms-cet-bareilly';
        const res = await fetch(`${API_BASE}/logbook/submissions/${submission.id}/annotations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-slug': slug,
          },
          body: JSON.stringify({
            annotations: currentAnns,
            marksAwarded: Number(currentMarks) || undefined,
            remarks: currentRemarks || undefined,
          }),
        });

        if (res.ok) {
          setAutosaveStatus('saved');
        } else {
          setAutosaveStatus('error');
        }
      } catch (e) {
        setAutosaveStatus('error');
      }
    },
    [submission?.id]
  );

  // Debounced Autosave on changes
  useEffect(() => {
    if (!submission?.id || annotations.length === 0) return;
    const timer = setTimeout(() => {
      triggerAutosave(annotations, marks, remarks);
    }, 1200);
    return () => clearTimeout(timer);
  }, [annotations, marks, remarks, submission?.id, triggerAutosave]);

  // 7. Interactive Drawing Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool === 'hand') return;
    const canvas = markCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const canvasW = canvas.width;
    const canvasH = canvas.height;

    // 1. Instant stamp for Score / Marks Stamper
    if (activeTool === 'stamp') {
      const newAnn: PdfAnnotation = {
        id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        page: currentPage,
        type: 'number_stamp',
        x,
        y,
        w: 32,
        h: 32,
        x_ratio: x / canvasW,
        y_ratio: y / canvasH,
        canvasWidth: canvasW,
        canvasHeight: canvasH,
        color: activeColor,
        text: activeStampText,
        style: stampStyle,
        fontSize: 13,
        thickness: activeThickness,
      };

      const updated = [...annotations, newAnn];
      setAnnotations(updated);
      triggerAutosave(updated, marks, remarks);
      return;
    }

    // 2. Instant stamp for Tick / Cross
    if (activeTool === 'tick' || activeTool === 'cross') {
      const newAnn: PdfAnnotation = {
        id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        page: currentPage,
        type: activeTool,
        x,
        y,
        w: 26,
        h: 26,
        x_ratio: x / canvasW,
        y_ratio: y / canvasH,
        w_ratio: 26 / canvasW,
        h_ratio: 26 / canvasH,
        canvasWidth: canvasW,
        canvasHeight: canvasH,
        color: activeColor,
        thickness: activeThickness,
      };

      const updated = [...annotations, newAnn];
      setAnnotations(updated);
      triggerAutosave(updated, marks, remarks);
      return;
    }

    if (activeTool === 'text') {
      setTextPrompt({ x, y, text: '' });
      return;
    }

    isDrawingRef.current = true;
    shapeStartRef.current = { x, y };

    if (activeTool === 'pen') {
      currentPathRef.current = [{ x, y }];
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || activeTool === 'hand') return;
    const canvas = markCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (activeTool === 'pen') {
      currentPathRef.current.push({ x, y });
      redrawAnnotations();

      ctx.save();
      ctx.strokeStyle = COLOR_MAP[activeColor];
      ctx.fillStyle = COLOR_MAP[activeColor];
      ctx.lineWidth = activeThickness;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const pts = currentPathRef.current;
      if (pts.length === 1) {
        ctx.beginPath();
        ctx.arc(pts[0].x, pts[0].y, activeThickness / 2, 0, 2 * Math.PI);
        ctx.fill();
      } else if (pts.length === 2) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 1; i++) {
          const midX = (pts[i].x + pts[i + 1].x) / 2;
          const midY = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
        }
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    // Live preview for circle / line / strike
    redrawAnnotations();

    ctx.save();
    ctx.strokeStyle = COLOR_MAP[activeColor];
    ctx.lineWidth = activeThickness;
    ctx.lineCap = 'round';

    const start = shapeStartRef.current;
    if (!start) return;

    if (activeTool === 'circle') {
      const w = x - start.x;
      const h = y - start.y;
      ctx.beginPath();
      ctx.ellipse(start.x + w / 2, start.y + h / 2, Math.max(Math.abs(w / 2), 6), Math.max(Math.abs(h / 2), 6), 0, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (activeTool === 'line') {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (activeTool === 'strike') {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(x, start.y);
      ctx.stroke();
    }
    ctx.restore();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || activeTool === 'hand') return;
    isDrawingRef.current = false;

    const canvas = markCanvasRef.current;
    if (!canvas || !shapeStartRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    const startX = shapeStartRef.current.x;
    const startY = shapeStartRef.current.y;
    const canvasW = canvas.width;
    const canvasH = canvas.height;
    const dragDistance = Math.hypot(endX - startX, endY - startY);

    let newAnn: PdfAnnotation | null = null;

    if (activeTool === 'pen') {
      if (currentPathRef.current.length > 0) {
        newAnn = {
          id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          page: currentPage,
          type: 'pen',
          x: startX,
          y: startY,
          points: [...currentPathRef.current],
          canvasWidth: canvasW,
          canvasHeight: canvasH,
          color: activeColor,
          thickness: activeThickness,
        };
      }
      currentPathRef.current = [];
    } else if (activeTool === 'circle') {
      // If user clicked without dragging (< 6px), stamp a neat 42x38 circle right on top!
      if (dragDistance < 6) {
        const circW = 42;
        const circH = 38;
        const minX = Math.max(0, startX - circW / 2);
        const minY = Math.max(0, startY - circH / 2);
        newAnn = {
          id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          page: currentPage,
          type: 'circle',
          x: minX,
          y: minY,
          w: circW,
          h: circH,
          x_ratio: minX / canvasW,
          y_ratio: minY / canvasH,
          w_ratio: circW / canvasW,
          h_ratio: circH / canvasH,
          canvasWidth: canvasW,
          canvasHeight: canvasH,
          color: activeColor,
          thickness: activeThickness,
        };
      } else {
        const minX = Math.min(startX, endX);
        const minY = Math.min(startY, endY);
        const w = Math.abs(endX - startX);
        const h = Math.abs(endY - startY);
        newAnn = {
          id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          page: currentPage,
          type: 'circle',
          x: minX,
          y: minY,
          w: Math.max(w, 16),
          h: Math.max(h, 16),
          x_ratio: minX / canvasW,
          y_ratio: minY / canvasH,
          w_ratio: Math.max(w, 16) / canvasW,
          h_ratio: Math.max(h, 16) / canvasH,
          canvasWidth: canvasW,
          canvasHeight: canvasH,
          color: activeColor,
          thickness: activeThickness,
        };
      }
    } else if (activeTool === 'line') {
      // If user clicked without dragging (< 6px), place a neat 80px horizontal underline
      if (dragDistance < 6) {
        const lineLen = 80;
        const lineStartX = Math.max(0, startX - lineLen / 2);
        const lineEndX = Math.min(canvasW, startX + lineLen / 2);
        const lineY = startY + 8;
        newAnn = {
          id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          page: currentPage,
          type: 'line',
          x: lineStartX,
          y: lineY,
          endX: lineEndX,
          endY: lineY,
          w: lineLen,
          h: 4,
          x_ratio: lineStartX / canvasW,
          y_ratio: lineY / canvasH,
          canvasWidth: canvasW,
          canvasHeight: canvasH,
          color: activeColor,
          thickness: activeThickness,
        };
      } else {
        newAnn = {
          id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          page: currentPage,
          type: 'line',
          x: startX,
          y: startY,
          endX: endX,
          endY: endY,
          w: Math.abs(endX - startX),
          h: Math.abs(endY - startY),
          x_ratio: startX / canvasW,
          y_ratio: startY / canvasH,
          canvasWidth: canvasW,
          canvasHeight: canvasH,
          color: activeColor,
          thickness: activeThickness,
        };
      }
    } else if (activeTool === 'strike') {
      if (dragDistance < 6) {
        const strikeLen = 70;
        const minX = Math.max(0, startX - strikeLen / 2);
        newAnn = {
          id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          page: currentPage,
          type: 'strike',
          x: minX,
          y: startY,
          w: strikeLen,
          h: 12,
          x_ratio: minX / canvasW,
          y_ratio: startY / canvasH,
          w_ratio: strikeLen / canvasW,
          h_ratio: 12 / canvasH,
          canvasWidth: canvasW,
          canvasHeight: canvasH,
          color: activeColor,
          thickness: activeThickness,
        };
      } else {
        const minX = Math.min(startX, endX);
        const w = Math.abs(endX - startX);
        if (w > 8) {
          newAnn = {
            id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            page: currentPage,
            type: 'strike',
            x: minX,
            y: startY,
            w,
            h: 12,
            x_ratio: minX / canvasW,
            y_ratio: startY / canvasH,
            w_ratio: w / canvasW,
            h_ratio: 12 / canvasH,
            canvasWidth: canvasW,
            canvasHeight: canvasH,
            color: activeColor,
            thickness: activeThickness,
          };
        }
      }
    }

    if (newAnn) {
      const updated = [...annotations, newAnn];
      setAnnotations(updated);
      triggerAutosave(updated, marks, remarks);
    } else {
      redrawAnnotations();
    }
  };

  // 8. Commit Margin Text Remark
  const handleCommitTextPrompt = () => {
    if (!textPrompt || !textPrompt.text.trim()) {
      setTextPrompt(null);
      return;
    }
    const canvas = markCanvasRef.current;
    const canvasW = canvas?.width || 800;
    const canvasH = canvas?.height || 1000;

    const newAnn: PdfAnnotation = {
      id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      page: currentPage,
      type: 'text',
      x: textPrompt.x,
      y: textPrompt.y,
      x_ratio: textPrompt.x / canvasW,
      y_ratio: textPrompt.y / canvasH,
      canvasWidth: canvasW,
      canvasHeight: canvasH,
      color: activeColor,
      text: textPrompt.text.trim(),
      fontSize: 12,
    };

    const updated = [...annotations, newAnn];
    setAnnotations(updated);
    setTextPrompt(null);
    triggerAutosave(updated, marks, remarks);
  };

  // 9. Undo & Clear
  const handleUndo = () => {
    const pageAnns = annotations.filter((a) => a.page === currentPage);
    if (pageAnns.length === 0) return;
    const lastId = pageAnns[pageAnns.length - 1].id;
    const updated = annotations.filter((a) => a.id !== lastId);
    setAnnotations(updated);
    triggerAutosave(updated, marks, remarks);
  };

  const handleClearPage = () => {
    if (!confirm('Clear all markups on this page?')) return;
    const updated = annotations.filter((a) => a.page !== currentPage);
    setAnnotations(updated);
    triggerAutosave(updated, marks, remarks);
  };

  // 10. Finalize Evaluation & Generate Marked PDF
  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submission) return;
    setError(null);

    const numericMarks = Number(marks);
    if (marks === '' || isNaN(numericMarks)) {
      setError('Please enter valid marks awarded.');
      return;
    }
    if (numericMarks < 0 || numericMarks > maxMarks) {
      setError(`Marks awarded must be between 0 and ${maxMarks}.`);
      return;
    }

    setFinalizing(true);
    try {
      const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly' : 'srms-cet-bareilly';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

      const res = await fetch(`${API_BASE}/logbook/submissions/${submission.id}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
        body: JSON.stringify({
          marksAwarded: numericMarks,
          remarks: remarks.trim() || undefined,
          digitalStamp,
          annotations,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setEvalSuccess(true);
        setStatus('EVALUATED');
        setEvaluatedPdfUrl(json.evaluatedFileUrl || `/api/v1/logbook/submissions/${submission.id}/evaluated-pdf?tenant=${slug}`);
        onSuccess();
      } else {
        setError(json.message || 'Failed to finalize evaluation');
      }
    } catch (err: any) {
      setError(err.message || 'Network error while finalizing evaluation');
    } finally {
      setFinalizing(false);
    }
  };

  if (!isOpen || !submission) return null;

  const numericMarks = Number(marks);
  const pct = marks !== '' && !isNaN(numericMarks) ? Math.round((numericMarks / maxMarks) * 100) : null;
  const isPdf =
    submission.file_name?.toLowerCase().endsWith('.pdf') ||
    submission.file_url?.includes('.pdf') ||
    !submission.file_name;

  // Reusable Evaluation Form for Desktop Sidebar and Mobile Slide Drawer
  const renderEvaluationForm = (isMobileDrawer: boolean) => (
    <form onSubmit={handleFinalize} className="space-y-4">
      {/* Candidate Info Card */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-[#5B4BFF]">Candidate Details</div>
          <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
            {submission.student_name}
          </h4>
          <div className="text-[11px] text-slate-500 font-mono">
            Roll: {submission.rollno || submission.registration_no || 'Reg N/A'}
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block">Submitted</span>
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
            {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : '5/9/2026'}
          </span>
        </div>
      </div>

      {/* Evaluation Success Banner */}
      {evalSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-black">Evaluated &amp; Stamped</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Digital annotations have been permanently flattened onto the submission deliverable using <code>pdf-lib</code>.
          </p>
          {evaluatedPdfUrl && (
            <div className="pt-1 flex items-center gap-2">
              <a
                href={evaluatedPdfUrl}
                target="_blank"
                rel="noreferrer"
                download={`Evaluated_${submission.file_name || 'Document.pdf'}`}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Marked PDF</span>
              </a>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Marks Awarded Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider block">
            Marks Awarded (Out of {maxMarks}) *
          </label>
          {pct !== null && (
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-black border ${
                pct >= 75
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                  : pct >= 50
                  ? 'bg-indigo-50 text-[#5B4BFF] border-indigo-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {pct}% Score
            </span>
          )}
        </div>

        <div className="relative">
          <input
            type="number"
            min="0"
            max={maxMarks}
            step="0.5"
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
            placeholder={`0 - ${maxMarks}`}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-base font-black focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] font-mono"
            required
          />
          <span className="absolute right-3.5 top-2.5 text-xs font-mono font-bold text-slate-400">
            / {maxMarks} Marks
          </span>
        </div>

        {/* Quick Score Presets */}
        <div className="flex items-center gap-1.5 pt-1 flex-wrap">
          {[
            { label: `Full (${maxMarks})`, val: maxMarks },
            { label: `80% (${Math.round(maxMarks * 0.8)})`, val: Math.round(maxMarks * 0.8) },
            { label: `60% (${Math.round(maxMarks * 0.6)})`, val: Math.round(maxMarks * 0.6) },
            { label: `40% (${Math.round(maxMarks * 0.4)})`, val: Math.round(maxMarks * 0.4) },
          ].map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setMarks(p.val)}
              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-[10px] font-bold transition-all cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Remarks Textarea */}
      <div className="space-y-1.5">
        <label className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider block">
          Faculty Evaluation Remarks &amp; Feedback
        </label>
        <textarea
          rows={3}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Provide feedback on technical methodology, problem formulation, and solution quality..."
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] resize-none"
        />

        {/* Quick Feedback Chips */}
        <div className="flex flex-wrap gap-1 pt-1">
          {[
            'Overall performance was satisfactory and satisfactory progress was observed.',
            'Well explained with accurate technical methodology.',
            'Good attempt, need to improve edge cases.',
            'Correct solution and clean diagrammatic illustrations.',
          ].map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setRemarks(chip)}
              className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 transition-all text-left truncate max-w-xs cursor-pointer"
            >
              + {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Digital Guide Signature Seal */}
      <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#5B4BFF]" />
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-white">Apply Digital Guide Seal</div>
            <div className="text-[10px] text-slate-500">Official faculty verification stamp on PDF</div>
          </div>
        </div>
        <input
          type="checkbox"
          checked={digitalStamp}
          onChange={(e) => setDigitalStamp(e.target.checked)}
          className="w-4 h-4 text-[#5B4BFF] rounded cursor-pointer"
        />
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
        {isMobileDrawer ? (
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(false)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            ← Back to Canvas
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            Close
          </button>
        )}
        <button
          type="submit"
          disabled={finalizing}
          className="px-5 py-2.5 rounded-xl bg-[#F36C21] hover:bg-[#e05a10] text-white text-xs font-black shadow-lg shadow-[#F36C21]/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ml-auto"
        >
          {finalizing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Flattening &amp; Stamping...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>{status === 'EVALUATED' ? 'Re-Finalize Evaluation' : 'Sign Off & Award Marks'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-2 lg:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none sm:rounded-[24px] shadow-2xl max-w-7xl w-full h-full sm:h-[95vh] sm:w-[98vw] flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-[#2D2575] via-[#3730A3] to-[#4F46E5] text-white shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center font-black text-white shadow-md shrink-0">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-[#F36C21]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base lg:text-lg font-black tracking-tight leading-tight">
                  Evaluation Studio
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black border ${
                  status === 'EVALUATED'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                    : 'bg-orange-500/20 text-orange-300 border-orange-400/40'
                }`}>
                  {status}
                </span>
                {autosaveStatus === 'saving' && (
                  <span className="text-[10px] text-amber-300 flex items-center gap-1 font-mono">
                    <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                  </span>
                )}
                {autosaveStatus === 'saved' && (
                  <span className="text-[10px] text-emerald-300 flex items-center gap-1 font-mono">
                    <Check className="w-3 h-3" /> Saved
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/80 font-medium truncate max-w-[220px] sm:max-w-md">
                Topic: <strong className="text-white">{submission.topic_title}</strong> (Max: {maxMarks})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mobile Slide-over Drawer Trigger Button */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F36C21] hover:bg-[#E05B10] text-white text-xs font-bold shadow-md shadow-[#F36C21]/20 active:scale-95 transition-all"
              title="Open Marks and Evaluation Drawer"
            >
              <Award className="w-3.5 h-3.5" />
              <span>{marks !== '' ? `${marks}/${maxMarks}` : 'Grade'}</span>
            </button>

            {evaluatedPdfUrl && (
              <a
                href={evaluatedPdfUrl}
                target="_blank"
                rel="noreferrer"
                download={`Evaluated_${submission.file_name || 'Deliverable.pdf'}`}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Evaluated PDF</span>
              </a>
            )}
            {submission.file_url && (
              <a
                href={submission.file_url}
                target="_blank"
                rel="noreferrer"
                download={submission.file_name || 'original.pdf'}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Original</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Layout: Left = Interactive Canvas Workspace, Right = Rubric & Mark Panel */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 lg:divide-x divide-slate-200 dark:divide-slate-800 relative">
          {/* Left Column: PDF & Canvas Markup Studio (Full View on Mobile) */}
          <div className="col-span-1 lg:col-span-8 xl:col-span-8 flex flex-col h-full bg-slate-100 dark:bg-slate-950 overflow-hidden relative">
            {/* Top Toolbar */}
            <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0">
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 truncate max-w-[150px] sm:max-w-xs">
                  <FileText className="w-4 h-4 text-[#5B4BFF] shrink-0" />
                  <span className="truncate">{submission.file_name || 'Deliverable'}</span>
                </span>
                {submission.file_size && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono shrink-0">
                    {submission.file_size}
                  </span>
                )}
              </div>

              {/* View Switcher: Annotation Studio vs Evaluated Stamped PDF vs Written Summary */}
              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-bold shrink-0">
                <button
                  onClick={() => setActiveView('STUDIO')}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeView === 'STUDIO'
                      ? 'bg-white dark:bg-slate-700 text-[#5B4BFF] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Studio</span>
                </button>
                {evaluatedPdfUrl && (
                  <button
                    onClick={() => setActiveView('FINAL_PDF')}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeView === 'FINAL_PDF'
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Result</span>
                  </button>
                )}
                {submission.explanation_text && (
                  <button
                    onClick={() => setActiveView('TEXT')}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      activeView === 'TEXT'
                        ? 'bg-white dark:bg-slate-700 text-[#5B4BFF] shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    Summary
                  </button>
                )}
              </div>
            </div>

            {/* Exam Marking Tool Strip (When in STUDIO mode) */}
            {activeView === 'STUDIO' && (
              <div className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 divide-y divide-slate-200/80 dark:divide-slate-800 text-xs shrink-0">
                {/* Row 1: Primary Tools, Color, Size, Undo, Pages - Horizontally Scrollable on Mobile */}
                <div className="px-3 sm:px-4 py-1.5 sm:py-2 flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar flex-nowrap">
                  {/* Tools: Hand (Pan/Scroll), Tick, Cross, Circle, Line/Underline, Strike, Pen, Stamp (Marks), Text */}
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs shrink-0">
                    <button
                      onClick={() => setActiveTool('hand')}
                      title="Hand Pan / Scroll Image (Swipe freely)"
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                        activeTool === 'hand'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 ring-2 ring-purple-500'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Move className="w-4 h-4 text-purple-600" />
                      <span>Pan</span>
                    </button>
                    <button
                      onClick={() => setActiveTool('tick')}
                      title="Stamp Checkmark (Tick)"
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                        activeTool === 'tick'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 ring-2 ring-emerald-500'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Tick</span>
                    </button>
                    <button
                      onClick={() => setActiveTool('cross')}
                      title="Stamp Wrong Mark (Cross)"
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                        activeTool === 'cross'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 ring-2 ring-rose-500'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <X className="w-4 h-4 text-rose-600" />
                      <span>Cross</span>
                    </button>
                    <button
                      onClick={() => setActiveTool('circle')}
                      title="1-Click Circle or Drag Ellipse"
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                        activeTool === 'circle'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 ring-2 ring-amber-500'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Circle className="w-4 h-4 text-amber-600" />
                      <span>Circle</span>
                    </button>
                    <button
                      onClick={() => setActiveTool('line')}
                      title="1-Click Underline or Drag Straight Line"
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                        activeTool === 'line'
                          ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 ring-2 ring-cyan-500'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Minus className="w-4 h-4 text-cyan-600" />
                      <span>Underline</span>
                    </button>
                    <button
                      onClick={() => setActiveTool('strike')}
                      title="Strike-through"
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                        activeTool === 'strike'
                          ? 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white ring-2 ring-slate-400'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Slash className="w-4 h-4" />
                      <span>Strike</span>
                    </button>
                    <button
                      onClick={() => setActiveTool('pen')}
                      title="Smooth Curved Exam Pen"
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                        activeTool === 'pen'
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 ring-2 ring-indigo-500'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <PenTool className="w-4 h-4 text-indigo-600" />
                      <span>Pen</span>
                    </button>
                    <button
                      onClick={() => setActiveTool('stamp')}
                      title="1-Click Score Stamper (+1, +2, etc.)"
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                        activeTool === 'stamp'
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 ring-2 ring-orange-500'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Hash className="w-4 h-4 text-orange-600" />
                      <span>Marks</span>
                    </button>
                    <button
                      onClick={() => setActiveTool('text')}
                      title="Margin Remark & Score Callout"
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                        activeTool === 'text'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 ring-2 ring-purple-500'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Type className="w-4 h-4 text-purple-600" />
                      <span>Note</span>
                    </button>
                  </div>

                  {/* Ink Color Picker */}
                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs shrink-0">
                    <span className="text-[10px] uppercase font-black text-slate-400 mr-0.5">Ink:</span>
                    {(['red', 'green', 'blue', 'purple'] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => setActiveColor(c)}
                        className={`w-5 h-5 rounded-full transition-all cursor-pointer ${
                          activeColor === c ? 'ring-2 ring-offset-1 ring-slate-900 dark:ring-white scale-110' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: COLOR_MAP[c] }}
                        title={`${c.toUpperCase()} ink`}
                      />
                    ))}
                  </div>

                  {/* Pen / Stroke Thickness */}
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs shrink-0">
                    <span className="text-[10px] uppercase font-black text-slate-400 mr-0.5">Size:</span>
                    {[
                      { label: 'Fine', val: 1.5 },
                      { label: 'Med', val: 2.5 },
                      { label: 'Bold', val: 4.0 },
                    ].map((s) => (
                      <button
                        key={s.label}
                        onClick={() => setActiveThickness(s.val)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                          activeThickness === s.val
                            ? 'bg-[#5B4BFF] text-white'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {/* Undo & Clear Controls */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={handleUndo}
                      title="Undo last markup"
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span>Undo</span>
                    </button>
                    <button
                      onClick={handleClearPage}
                      title="Clear page markup"
                      className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                  </div>

                  {/* Page Navigation & Zoom */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-bold">
                      <button
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="p-0.5 hover:text-[#5B4BFF] disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span>
                        {currentPage} / {numPages}
                      </span>
                      <button
                        disabled={currentPage >= numPages}
                        onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                        className="p-0.5 hover:text-[#5B4BFF] disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-0.5 bg-white dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => setScale((s) => Math.max(0.35, Number((s - 0.15).toFixed(2))))}
                        className="p-1 hover:text-[#5B4BFF] text-slate-500 cursor-pointer"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setScale(0.75)}
                        title="Click to reset zoom"
                        className="text-[10px] font-mono px-1 hover:text-[#5B4BFF] font-bold cursor-pointer"
                      >
                        {Math.round(scale * 100)}%
                      </button>
                      <button
                        onClick={() => setScale((s) => Math.min(3.0, Number((s + 0.15).toFixed(2))))}
                        className="p-1 hover:text-[#5B4BFF] text-slate-500 cursor-pointer"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Row 2: FAST EXAM MARKS & QUICK REMARK STAMPER BAR - Horizontally Scrollable on Mobile */}
                <div className="px-3 sm:px-4 py-1.5 bg-indigo-50/70 dark:bg-indigo-950/40 flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar flex-nowrap text-xs">
                  {/* Quick Score Chips */}
                  <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
                    <span className="text-[11px] font-black uppercase text-indigo-900 dark:text-indigo-300 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-[#F36C21]" />
                      <span>Marks:</span>
                    </span>
                    {['+1', '+2', '+3', '+4', '+5', '+½', '10/10', '-1', '0'].map((score) => {
                      const isSelected = activeTool === 'stamp' && activeStampText === score;
                      return (
                        <button
                          key={score}
                          onClick={() => {
                            setActiveStampText(score);
                            setActiveTool('stamp');
                          }}
                          className={`px-2 py-0.5 rounded-lg font-black font-mono text-[11px] transition-all cursor-pointer shadow-2xs shrink-0 ${
                            isSelected
                              ? 'bg-[#F36C21] text-white ring-2 ring-orange-300 scale-105'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {score}
                        </button>
                      );
                    })}

                    {/* Custom Score input */}
                    <div className="flex items-center gap-1 ml-1 shrink-0">
                      <input
                        type="text"
                        value={customStampInput}
                        onChange={(e) => setCustomStampInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && customStampInput.trim()) {
                            setActiveStampText(customStampInput.trim());
                            setActiveTool('stamp');
                          }
                        }}
                        placeholder="e.g. 2.5"
                        className="w-14 px-1.5 py-0.5 text-[11px] font-bold rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#5B4BFF]"
                      />
                      <button
                        onClick={() => {
                          if (customStampInput.trim()) {
                            setActiveStampText(customStampInput.trim());
                            setActiveTool('stamp');
                          }
                        }}
                        className="px-2 py-0.5 rounded-md bg-[#5B4BFF] hover:bg-[#4338CA] text-white text-[10px] font-black cursor-pointer"
                      >
                        Set
                      </button>
                    </div>

                    {/* Style Toggle: Circle vs Badge */}
                    <div className="flex items-center gap-0.5 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 ml-1 shrink-0">
                      <button
                        onClick={() => setStampStyle('circle')}
                        title="Encircled mark (e.g. ②)"
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                          stampStyle === 'circle'
                            ? 'bg-[#2D2575] text-white'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Circle ②
                      </button>
                      <button
                        onClick={() => setStampStyle('badge')}
                        title="Pill badge (e.g. [+2])"
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                          stampStyle === 'badge'
                            ? 'bg-[#2D2575] text-white'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Badge [+2]
                      </button>
                    </div>
                  </div>

                  {/* Quick Remarks Presets */}
                  <div className="flex items-center gap-1 flex-nowrap shrink-0">
                    <span className="text-[10px] uppercase font-black text-slate-400 mr-0.5">Remarks:</span>
                    {[
                      { label: '✓ Correct', text: 'Correct' },
                      { label: '✗ Wrong', text: 'Wrong' },
                      { label: 'Good!', text: 'Good!' },
                      { label: 'Step Error', text: 'Step Error' },
                      { label: 'Formula Missing', text: 'Formula Missing' },
                      { label: 'Incomplete', text: 'Incomplete' },
                    ].map((rem) => {
                      const isSelected = activeTool === 'stamp' && activeStampText === rem.text;
                      return (
                        <button
                          key={rem.text}
                          onClick={() => {
                            setActiveStampText(rem.text);
                            setStampStyle('badge');
                            setActiveTool('stamp');
                          }}
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] transition-all cursor-pointer shrink-0 ${
                            isSelected
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {rem.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Tool Status / Instruction Pill */}
                  <div className="flex items-center gap-1.5 bg-white/90 dark:bg-slate-800/90 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-900 text-[11px] font-bold text-indigo-900 dark:text-indigo-200 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {activeTool === 'stamp' ? (
                      <span>
                        Click paper to stamp: <strong className="text-[#F36C21] font-mono">{activeStampText}</strong>
                      </span>
                    ) : activeTool === 'circle' ? (
                      <span>Click to circle or drag</span>
                    ) : activeTool === 'line' ? (
                      <span>Click to underline or drag</span>
                    ) : activeTool === 'pen' ? (
                      <span>Pen ready (drag to write)</span>
                    ) : activeTool === 'tick' ? (
                      <span>Click anywhere to stamp Checkmark</span>
                    ) : activeTool === 'cross' ? (
                      <span>Click anywhere to stamp Cross (X)</span>
                    ) : activeTool === 'strike' ? (
                      <span>Click to strikethrough</span>
                    ) : activeTool === 'hand' ? (
                      <span>Pan / Scroll mode (drag or swipe freely)</span>
                    ) : activeTool === 'text' ? (
                      <span>Click paper to type remark</span>
                    ) : (
                      <span>Hand navigation mode</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Visualizer Body (Smooth Pan & Bidirectional Scroll on Mobile/Desktop) */}
            <div className="flex-1 overflow-x-auto overflow-y-auto p-2 sm:p-4 w-full h-full relative select-none overscroll-contain">
              <div className="min-w-max min-h-full flex justify-center items-start mx-auto">
                {activeView === 'FINAL_PDF' && evaluatedPdfUrl ? (
                  <div className="w-full min-w-[320px] sm:min-w-[600px] h-full min-h-[500px] bg-slate-900 rounded-2xl overflow-hidden shadow-inner flex flex-col border border-slate-700">
                    <iframe
                      src={evaluatedPdfUrl}
                      title="Stamped Evaluated PDF"
                      className="w-full h-full min-h-[550px] flex-1 border-0 bg-slate-800"
                    />
                  </div>
                ) : activeView === 'TEXT' && submission.explanation_text ? (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 max-w-2xl w-full space-y-3 shadow-xs">
                    <h4 className="text-xs font-bold uppercase text-[#5B4BFF] tracking-wider">
                      Student Written Scope &amp; Technical Explanation:
                    </h4>
                    <div className="text-sm text-slate-800 dark:text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">
                      {submission.explanation_text}
                    </div>
                  </div>
                ) : (
                  <div className="relative shadow-xl rounded-xl overflow-visible bg-white border border-slate-300">
                    {pdfLoading && (
                      <div className="p-16 flex flex-col items-center justify-center space-y-3">
                        <Loader2 className="w-8 h-8 text-[#5B4BFF] animate-spin" />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                          Rendering Canvas Studio...
                        </p>
                      </div>
                    )}

                    {pdfError && (
                      <div className="p-8 max-w-md text-center space-y-3">
                        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                        <div className="text-xs font-bold text-rose-700">Could not render deliverable canvas</div>
                        <p className="text-[11px] text-slate-500">{pdfError}</p>
                        {submission.file_url && (
                          <iframe
                            src={submission.file_url}
                            title="Fallback PDF View"
                            className="w-[600px] h-[500px] rounded-lg border border-slate-300"
                          />
                        )}
                      </div>
                    )}

                    {/* Dual Layer Canvas: PDF/Image Document Background + Foreground Markup Layer */}
                    <div className={`relative ${pdfLoading || pdfError ? 'hidden' : 'block'}`}>
                      <canvas ref={pdfCanvasRef} className="block shadow-md bg-white max-w-none" />
                      <canvas
                        ref={markCanvasRef}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        style={{ touchAction: activeTool === 'hand' ? 'pan-x pan-y' : 'none' }}
                        className={`absolute inset-0 z-10 ${
                          activeTool === 'hand'
                            ? 'cursor-grab active:cursor-grabbing pointer-events-none'
                            : activeTool === 'text'
                            ? 'cursor-text'
                            : activeTool === 'stamp'
                            ? 'cursor-copy'
                            : 'cursor-crosshair'
                        }`}
                      />

                    {/* Inline Margin Textbox Prompt */}
                    {textPrompt && (
                      <div
                        className="absolute z-20 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-300 dark:border-slate-700 shadow-2xl flex flex-col gap-2 min-w-[260px]"
                        style={{ left: Math.min(textPrompt.x, 500), top: Math.max(10, textPrompt.y - 40) }}
                      >
                        <span className="text-[10px] font-black uppercase text-purple-600 tracking-wider">
                          Add Margin Remark / Callout:
                        </span>
                        <input
                          autoFocus
                          type="text"
                          value={textPrompt.text}
                          onChange={(e) => setTextPrompt({ ...textPrompt, text: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCommitTextPrompt();
                            if (e.key === 'Escape') setTextPrompt(null);
                          }}
                          placeholder="+2.5 Marks (Clear syntax)"
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        {/* Quick suggestions inside prompt */}
                        <div className="flex items-center gap-1 flex-wrap">
                          {['+1 Mark', '+2 Marks', 'Good syntax', 'Check formula', 'Incomplete step'].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setTextPrompt({ ...textPrompt, text: s })}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-700 hover:bg-purple-100 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center justify-end gap-1.5 mt-1">
                          <button
                            onClick={() => setTextPrompt(null)}
                            className="px-2 py-1 rounded-md text-[10px] font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleCommitTextPrompt}
                            className="px-3 py-1 rounded-md text-[10px] font-black bg-[#5B4BFF] text-white hover:bg-[#4338CA] cursor-pointer"
                          >
                            Add Callout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              </div>
            </div>

            {/* Floating Mobile Action Button (FAB) to Slide In Evaluation Form */}
            <div className="lg:hidden absolute bottom-4 right-4 z-20 pointer-events-auto">
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(true)}
                className="px-4 py-2.5 rounded-full bg-[#2D2575] hover:bg-[#3730A3] text-white font-bold text-xs shadow-2xl shadow-[#2D2575]/50 flex items-center gap-2 border border-white/25 active:scale-95 transition-all"
              >
                <Award className="w-4 h-4 text-[#F36C21]" />
                <span>Give Marks &amp; Sign Off</span>
                <span className="px-2 py-0.5 rounded-full bg-[#F36C21] text-white font-mono font-black text-[10px]">
                  {marks !== '' ? `${marks}/${maxMarks}` : '0/30'}
                </span>
              </button>
            </div>
          </div>

          {/* Right Column: Desktop Faculty Evaluation Rubric & Sign-off Panel (Hidden on Mobile) */}
          <div className="hidden lg:flex lg:col-span-4 xl:col-span-4 p-6 bg-white dark:bg-slate-900 flex-col justify-between overflow-y-auto">
            {renderEvaluationForm(false)}
          </div>
        </div>

        {/* Mobile Slide-over Drawer / Bottom-side Sheet for Evaluation Rubric */}
        {isMobileDrawerOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
            <div className="w-full sm:max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
              {/* Drawer Top Navigation Header */}
              <div className="px-5 py-3.5 bg-gradient-to-r from-[#2D2575] via-[#3730A3] to-[#4F46E5] text-white flex items-center justify-between shadow-md shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <Award className="w-4 h-4 text-[#F36C21]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Evaluation &amp; Sign-off</h4>
                    <p className="text-[11px] text-white/80 font-mono">{submission.student_name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer flex items-center gap-1 text-xs font-bold px-2.5"
                  title="Close & Return to Markup Canvas"
                >
                  <span>Back</span>
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto p-5">
                {renderEvaluationForm(true)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
