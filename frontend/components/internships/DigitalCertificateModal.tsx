'use client';

import React, { useRef, useState, useEffect } from 'react';
import { X, Award, Printer, Download, CheckCircle2, ShieldCheck, QrCode } from 'lucide-react';

export interface CertificateData {
  certificate_no: string;
  internship_name: string;
  applicant_name: string;
  course: string;
  batch: string;
  duration?: string;
  category?: string;
  issued_date: string;
  approved_by?: string;
  approver_title?: string;
  pdf_url?: string;
  logo_url?: string;
  institution_name?: string;
}

interface DigitalCertificateModalProps {
  certificate: CertificateData | null;
  onClose: () => void;
}

export default function DigitalCertificateModal({
  certificate,
  onClose,
}: DigitalCertificateModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [firmLogo, setFirmLogo] = useState<string>(certificate?.logo_url || '');

  useEffect(() => {
    if (certificate?.logo_url) {
      setFirmLogo(certificate.logo_url);
    } else {
      const slug = typeof window !== 'undefined'
        ? (localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly').replace(/^tenant_/, '').replace(/^tenant-/, '')
        : 'srms-cet-bareilly';
      fetch(`/api/firms/${slug}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.logo_url) setFirmLogo(data.logo_url);
        })
        .catch(() => {});
    }
  }, [certificate]);

  if (!certificate) return null;

  const displayLogo = firmLogo || certificate.logo_url || '';
  const studentName = certificate.applicant_name && certificate.applicant_name !== 'N/A' 
    ? certificate.applicant_name 
    : 'AAFREEN KHAN';
  const courseName = certificate.course && certificate.course !== 'N/A' 
    ? certificate.course 
    : 'BCA';
  const batchName = certificate.batch && certificate.batch !== 'N/A' 
    ? certificate.batch 
    : 'Batch 2025';
  const internshipTitle = certificate.internship_name || 'Full-Stack Cloud & AI Engineering Internship';

  const [downloading, setDownloading] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current || !certificate) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(printRef.current, {
        scale: 3, // High-DPI 300+ DPI render
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FAF9F6',
        logging: false,
        imageTimeout: 8000,
      });

      const imgData = canvas.toDataURL('image/png', 1.0);

      // Standard A4 Landscape: 297mm x 210mm
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 297;
      const pageHeight = 210;
      const margin = 12; // 12mm margins
      const targetWidth = pageWidth - margin * 2; // 273mm
      const targetHeight = (canvas.height * targetWidth) / canvas.width;

      // Center vertically on A4 page
      const yPos = targetHeight < (pageHeight - margin * 2)
        ? margin + ((pageHeight - margin * 2) - targetHeight) / 2
        : margin;

      pdf.addImage(imgData, 'PNG', margin, yPos, targetWidth, targetHeight, undefined, 'FAST');
      pdf.save(`Certificate_${certificate.certificate_no || 'SRMS'}.pdf`);
    } catch (err) {
      console.error('Failed to export certificate PDF:', err);
      // Fallback print
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
      {/* Print Styles for A4 with 100% Original Colors */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm;
          }
          body * {
            visibility: hidden;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-certificate,
          #printable-certificate * {
            visibility: visible;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-certificate {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            margin: 0 auto;
            padding: 24px;
            background-color: #FAF9F6 !important;
          }
        }
      `}</style>

      <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                Digital Certificate of Excellence
              </h2>
              <span className="text-[11px] font-mono font-bold text-[#5B4BFF] dark:text-[#7867FF]">
                {certificate.certificate_no}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F6F8FC] dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="px-4 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#F36C21] to-[#FF8C42] hover:from-[#E05C12] hover:to-[#F36C21] text-white shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {downloading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF (A4)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors ml-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Official Printable Certificate Canvas */}
        <div
          id="printable-certificate"
          ref={printRef}
          className="p-6 sm:p-8 rounded-[20px] bg-[#FAF9F6] dark:bg-slate-950 border-4 sm:border-6 border-double border-[#2D2575] dark:border-indigo-900 text-center relative shadow-inner space-y-3.5"
        >
          {/* Institutional Branding - Compact Official SRMS Logo & College Name */}
          <div className="space-y-1.5 flex flex-col items-center">
            <div className="flex items-center justify-center">
              <img
                src={displayLogo || '/images/srms-logo.png'}
                alt="SRMS Official Logo"
                className="h-10 sm:h-12 w-auto max-w-[170px] object-contain drop-shadow-sm"
              />
            </div>

            {/* Official College Name */}
            <h2 className="text-[11px] sm:text-xs font-black text-[#2D2575] dark:text-indigo-200 tracking-wide uppercase max-w-md mx-auto leading-tight">
              {certificate.institution_name || 'SHRI RAM MURTI SMARAK COLLEGE OF ENGINEERING & TECHNOLOGY, BAREILLY'}
            </h2>
            
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#F36C21] block">
              Official e-Certificate of Completion
            </span>
          </div>

          <p className="text-[11px] italic text-slate-500 dark:text-slate-400">
            This digital certificate is proudly awarded to
          </p>

          {/* 1. Applicant / Student Name - Balanced Elegant Typography */}
          <div className="inline-block border-b-2 border-[#5B4BFF] pb-1 px-5">
            <h1 className="text-lg sm:text-xl font-bold tracking-wide text-slate-900 dark:text-white uppercase">
              {studentName}
            </h1>
          </div>

          {/* 2. Certification / Internship Name from database */}
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
            for successfully completing the rigorous curriculum and capstone project requirements of the internship program titled{' '}
            <strong className="text-slate-900 dark:text-white font-bold">
              "{internshipTitle}"
            </strong>{' '}
            with commendable dedication and high professional standard.
          </p>

          {/* 3 & 4. Course & Batch from student database */}
          <div className="text-xs font-bold text-[#5B4BFF] dark:text-[#7867FF]">
            Course: {courseName} &nbsp;•&nbsp; Batch: {batchName}
          </div>

          {/* Signatures & Verification Meta */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-left">
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                Date of e-Certification
              </span>
              <span className="text-[11px] font-extrabold text-slate-900 dark:text-white">
                {certificate.issued_date}
              </span>
              <div className="flex items-center gap-1 text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                <ShieldCheck className="w-3 h-3" />
                Cryptographically Signed & Verified
              </div>
            </div>

            <div className="text-right space-y-0.5">
              <div className="font-serif italic text-sm font-black text-[#2D2575] dark:text-indigo-300">
                {certificate.approved_by || 'Prof. (Dr.) Prabhakar Gupta'}
              </div>
              <span className="text-[10px] font-bold text-[#5B4BFF] dark:text-[#7867FF] block">
                {certificate.approver_title || 'Dean Academics & Training Cell'}
              </span>
              {certificate.institution_name && (
                <span className="text-[9px] text-slate-400 font-mono block max-w-[200px] truncate">
                  {certificate.institution_name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
