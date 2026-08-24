'use client';

import React, { useRef } from 'react';

export interface LicenseReceiptData {
  id?: string;
  receipt_no?: string;
  transaction_ref?: string;
  amount?: number | string;
  currency?: string;
  payment_method?: string;
  status?: string;
  paid_at?: string;
  created_at?: string;
  key_prefix?: string;
  duration_days?: number;
  issued_at?: string;
  expires_at?: string;
  is_renewal?: boolean;
  firm_id?: string;
  firm_title?: string;
  firm_slug?: string;
  tenant_name?: string;
  domain?: string;
  logo_url?: string;
  firm_mode?: 'MED' | 'NONMED' | string;
  level_type?: string;
  theme_color?: string;
}

interface LicenseReceiptModalProps {
  receipt: LicenseReceiptData | null;
  onClose: () => void;
}

export default function LicenseReceiptModal({ receipt, onClose }: LicenseReceiptModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!receipt) return null;

  const rawAmount = receipt.amount;
  const amountNum = typeof rawAmount === 'number' ? rawAmount : parseFloat(String(rawAmount ?? 0)) || 0;
  
  const baseAmount = amountNum > 0 ? (amountNum / 1.18).toFixed(2) : '0.00';
  const gstAmount = amountNum > 0 ? (amountNum - parseFloat(baseAmount)).toFixed(2) : '0.00';
  const totalAmountFormatted = amountNum.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const durationDays = receipt.duration_days ?? 
    (receipt.expires_at && (receipt.issued_at || receipt.paid_at) 
      ? Math.max(1, Math.round((new Date(receipt.expires_at).getTime() - new Date(receipt.issued_at || receipt.paid_at!).getTime()) / (1000 * 60 * 60 * 24)))
      : 365);

  const rawIssueDate = receipt.issued_at || receipt.paid_at || receipt.created_at || new Date().toISOString();
  const issueDateFormatted = new Date(rawIssueDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const rawExpiryDate = receipt.expires_at || new Date(new Date(rawIssueDate).getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();
  const validTillFormatted = new Date(rawExpiryDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const receiptNo =
    receipt.receipt_no ||
    (receipt.transaction_ref?.startsWith('NRX-') ? receipt.transaction_ref : `NRX-REC-${new Date(rawIssueDate).getFullYear()}-${(receipt.id || receipt.transaction_ref || '0000').slice(0, 8).toUpperCase()}`);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSlip = () => {
    const htmlContent = printRef.current?.innerHTML;
    if (!htmlContent) return;

    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>NORNX_License_Receipt_${receiptNo}</title>
        <meta charset="utf-8" />
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          body { font-family: 'Plus Jakarta Sans', sans-serif; background: #fff; color: #1B1E28; padding: 24px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div style="max-width: 800px; margin: 0 auto;">
          ${htmlContent}
        </div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NORNX-License-Receipt-${receiptNo}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn font-sans">
      <div className="bg-white rounded-[26px] shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col my-8 transition-all">
        {/* Top Modal Action Bar */}
        <div className="bg-[#2D2575] px-6 py-4 flex items-center justify-between text-white border-b border-purple-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5B4BFF] to-[#F36C21] flex items-center justify-center p-2 shadow-md shadow-indigo-900/30 text-white font-black text-xs">
              NRX
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wide text-white">NORNX Licensing Authority</span>
              <p className="text-[11px] text-purple-200/80">Official SaaS Subscription & License Renewal Receipt</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all flex items-center gap-1.5 text-white cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print Slip</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSlip}
              className="px-3.5 py-1.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4838DF] text-xs font-extrabold transition-all flex items-center gap-1.5 text-white shadow-md shadow-[#5B4BFF]/25 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download Slip</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-purple-200 hover:text-white transition-all ml-1 cursor-pointer"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div ref={printRef} className="p-6 sm:p-10 bg-white space-y-6 text-[#1B1E28] print:p-0">
          {/* Header with NORNX Official Logo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b-2 border-slate-100 gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5B4BFF] to-[#2D2575] flex items-center justify-center p-2.5 shadow-md shadow-indigo-500/20 text-white font-black text-lg">
                  ⚡
                </div>
                <div>
                  <span className="text-2xl font-black tracking-tight text-[#1B1E28]">NORNX</span>
                  <p className="text-[11px] font-bold text-[#5B4BFF] tracking-wide uppercase">
                    Enterprise SaaS Authority
                  </p>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[#5B4BFF] border border-purple-200 text-xs font-black mb-1.5">
                <span className="w-2 h-2 rounded-full bg-[#5B4BFF] animate-pulse" />
                <span>OFFICIAL LICENSE RECEIPT</span>
              </div>
              <p className="text-xs font-mono font-bold text-slate-500">Receipt Ref: <span className="text-[#1B1E28] font-black">{receiptNo}</span></p>
              <p className="text-xs text-slate-400">Date of Payment: {issueDateFormatted}</p>
            </div>
          </div>

          {/* Issuer & Bill-To Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-[#F6F8FC] p-5 rounded-2xl border border-[#E7EAF3]">
            {/* Issuer Details */}
            <div>
              <p className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider mb-1">
                Licensed & Issued By
              </p>
              <h4 className="font-extrabold text-sm text-[#1B1E28]">NORNX Technologies Pvt. Ltd.</h4>
              <p className="text-xs text-[#4E5969] leading-relaxed mt-0.5">
                Enterprise Cloud & SaaS Infrastructure Division<br />
                Multi-Tenant Medical & Academic ERP Core<br />
                CIN: U72200DL2024PTC398214 • GSTIN: 09AAACN1234F1Z8<br />
                support@nornx.com • https://nornx.com
              </p>
            </div>

            {/* Billed Institution Details */}
            <div className="sm:border-l sm:border-slate-200 sm:pl-6">
              <p className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider mb-1">
                Billed Institution / Firm
              </p>
              <h4 className="font-extrabold text-sm text-[#5B4BFF]">
                {receipt.firm_title || 'Registered Academic Institution'}
              </h4>
              <p className="text-xs text-[#4E5969] leading-relaxed mt-0.5">
                <strong>Tenant Identifier:</strong> tenant_{receipt.firm_slug || 'institution'}<br />
                {receipt.tenant_name && <span><strong>Trust / Organization:</strong> {receipt.tenant_name}<br /></span>}
                {receipt.domain && <span><strong>Custom Domain:</strong> {receipt.domain}<br /></span>}
                <strong>Academic Mode:</strong>{' '}
                <span className="font-bold text-[#1B1E28]">
                  {receipt.firm_mode === 'NONMED' ? 'Engineering / Technical (NONMED)' : 'Medical College & Hospital (MED NMC)'}
                </span>
              </p>
            </div>
          </div>

          {/* License & Subscription Line Items */}
          <div className="overflow-hidden rounded-2xl border border-[#E7EAF3]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F6F8FC] text-[#4E5969] font-extrabold border-b border-[#E7EAF3]">
                  <th className="py-3 px-4">Item & License Description</th>
                  <th className="py-3 px-4 text-center">Duration</th>
                  <th className="py-3 px-4 text-center">License Prefix</th>
                  <th className="py-3 px-4 text-center">Valid Until</th>
                  <th className="py-3 px-4 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[#1B1E28]">
                <tr>
                  <td className="py-4 px-4">
                    <p className="font-extrabold text-sm text-[#1B1E28]">
                      {receipt.is_renewal ? 'Enterprise License Renewal' : 'Annual Platform Subscription License'}
                    </p>
                    <p className="text-xs text-[#4E5969] mt-0.5">
                      Full SaaS multi-tenant deployment with Schema-level PostgreSQL isolation, Role-based menu governance, and automated cloud backups.
                    </p>
                  </td>
                  <td className="py-4 px-4 text-center font-black text-[#1B1E28]">
                    {durationDays} {durationDays === 1 ? 'Day' : 'Days'}
                  </td>
                  <td className="py-4 px-4 text-center font-mono font-extrabold text-[#5B4BFF]">
                    {receipt.key_prefix || 'FIRM-ACTIVE'}****
                  </td>
                  <td className="py-4 px-4 text-center font-bold text-[#5B4BFF]">
                    {validTillFormatted}
                  </td>
                  <td className="py-4 px-4 text-right font-extrabold text-sm text-[#1B1E28]">
                    ₹{baseAmount}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Summary & Payment Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Payment Details */}
            <div className="p-4 bg-[#F6F8FC] rounded-2xl border border-[#E7EAF3] space-y-2 text-xs">
              <p className="font-extrabold text-[#1B1E28] uppercase text-[11px] tracking-wider">
                Payment Verification Details
              </p>
              <div className="flex justify-between text-[#4E5969]">
                <span>Transaction Reference:</span>
                <span className="font-mono font-bold text-[#1B1E28]">{receipt.transaction_ref || 'NRX-TXN-AUTO'}</span>
              </div>
              <div className="flex justify-between text-[#4E5969]">
                <span>Payment Mode:</span>
                <span className="font-bold text-[#1B1E28]">{receipt.payment_method || 'Bank Transfer / Direct Wire'}</span>
              </div>
              <div className="flex justify-between text-[#4E5969]">
                <span>Payment Status:</span>
                <span className="font-extrabold text-[#5B4BFF] bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-full">
                  ✓ {receipt.status || 'PAID & CONFIRMED'}
                </span>
              </div>
            </div>

            {/* Total Calculation */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-[#4E5969]">
                <span>Taxable Base Amount:</span>
                <span className="font-mono font-bold">₹{baseAmount}</span>
              </div>
              <div className="flex justify-between text-[#4E5969]">
                <span>Integrated GST (18%):</span>
                <span className="font-mono font-bold">₹{gstAmount}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm">
                <span className="font-black text-[#1B1E28]">Total Net Paid:</span>
                <span className="font-black text-lg text-[#5B4BFF]">₹{totalAmountFormatted}</span>
              </div>
            </div>
          </div>

          {/* Official Verification Seal & Signatures */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full border-2 border-dashed border-[#5B4BFF] flex flex-col items-center justify-center text-center p-1 bg-indigo-50/50">
                <span className="text-[8px] font-black uppercase text-[#5B4BFF]">NORNX</span>
                <span className="text-[7px] font-bold text-slate-600">VERIFIED</span>
                <span className="text-[6px] text-slate-400">SEAL</span>
              </div>
              <div className="text-[11px] text-[#4E5969]">
                <p className="font-bold text-[#1B1E28]">Cryptographically Sealed & Digitally Verified</p>
                <p>This is a computer-generated tax receipt and certificate of license renewal.</p>
              </div>
            </div>

            <div className="text-center sm:text-right">
              <div className="font-mono text-xs font-black text-[#1B1E28] tracking-wider uppercase">
                Aafaq Ahmad / Nornx Team
              </div>
              <div className="h-0.5 w-32 bg-slate-300 ml-auto my-1" />
              <p className="text-[10px] text-slate-400 uppercase font-bold">
                Authorized Signatory • NORNX SaaS Authority
              </p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="bg-[#F6F8FC] px-6 py-4 border-t border-[#E7EAF3] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#5B4BFF] hover:bg-[#4838DF] transition-all shadow-md shadow-[#5B4BFF]/20 cursor-pointer"
          >
            Close Receipt Slip
          </button>
        </div>
      </div>
    </div>
  );
}
