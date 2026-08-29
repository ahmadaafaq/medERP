'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  Loader2,
  Download,
  Table as TableIcon
} from 'lucide-react';

interface ImportDrivesModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportDrivesModal({ onClose, onSuccess }: ImportDrivesModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [batchTitle, setBatchTitle] = useState('Campus Placement Drive 2026-27');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setError(null);
    setLoadingPreview(true);

    try {
      const tenant = typeof window !== 'undefined' ? (localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || localStorage.getItem('colg_slug') || 'srms-cet-bareilly').replace(/^tenant_/, '').replace(/^tenant-/, '') : 'srms-cet-bareilly';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('access_token') || localStorage.getItem('accessToken') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'multipart/form-data',
        'x-tenant-id': tenant,
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const formData = new FormData();
      formData.append('file', selected);

      const res = await axios.post(`/api/placement-drive/import-preview?tenant=${tenant}`, formData, {
        headers,
      }).catch(async () => {
        return axios.post(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/placement-drive/import-preview?tenant=${tenant}`, formData, {
          headers,
        });
      });

      setPreviewData(res.data?.data || res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to parse the Excel file.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData?.preview_rows || previewData.preview_rows.length === 0) return;

    setLoadingConfirm(true);
    setError(null);

    try {
      const tenant = typeof window !== 'undefined' ? (localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || localStorage.getItem('colg_slug') || 'srms-cet-bareilly').replace(/^tenant_/, '').replace(/^tenant-/, '') : 'srms-cet-bareilly';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('access_token') || localStorage.getItem('accessToken') : null;
      const headers: Record<string, string> = {
        'x-tenant-id': tenant,
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const payload = {
        batch_title: batchTitle,
        source_file_name: file?.name || 'placement_companies.xlsx',
        companies: previewData.preview_rows,
      };

      await axios.post(`/api/placement-drive/import-confirm?tenant=${tenant}`, payload, { headers }).catch(async () => {
        return axios.post(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/placement-drive/import-confirm?tenant=${tenant}`, payload, { headers });
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save companies.');
    } finally {
      setLoadingConfirm(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      // First try direct download link
      const directUrl = '/templates/placement-drive-import-template.xlsx';
      const a = document.createElement('a');
      a.href = directUrl;
      a.download = 'placement-drive-import-template.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      // Fallback to backend API
      try {
        const tenant = typeof window !== 'undefined' ? (localStorage.getItem('tenantSlug') || 'srms-cet-bareilly') : 'srms-cet-bareilly';
        const res = await axios.get(`/api/placement-drive/template?tenant=${tenant}`).catch(async () => {
          return axios.get(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/placement-drive/template?tenant=${tenant}`);
        });
        if (res.data?.base64) {
          const link = document.createElement('a');
          link.href = `data:${res.data.contentType};base64,${res.data.base64}`;
          link.download = res.data.filename || 'placement-drive-import-template.xlsx';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } catch (err) {
        console.error('Failed to download template:', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#5B4BFF]/10 text-[#5B4BFF] dark:bg-[#5B4BFF]/20 dark:text-[#7867FF]">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Import Placement Drives via Excel
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Server-side SheetJS parser with automatic column mapping & dynamic JSONB extra fields.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Upload Dropzone & Download Format Banner */}
        {!previewData && (
          <div className="space-y-4">
            
            {/* Download Template Format Card */}
            <div className="p-4 rounded-[22px] bg-gradient-to-r from-[#5B4BFF]/10 via-[#7867FF]/10 to-[#00C48C]/10 border border-[#5B4BFF]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-[#5B4BFF] shadow-xs shrink-0">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Download Excel Template Format</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#00C48C]/15 text-[#00C48C]">
                      Standard Format
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    Download the pre-formatted template with column headers, instructions, and sample rows.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[#5B4BFF] dark:text-[#7867FF] text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95 cursor-pointer hover:border-[#5B4BFF]"
              >
                <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Download Template (.xlsx)</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Drive Batch Title
              </label>
              <input
                type="text"
                value={batchTitle}
                onChange={(e) => setBatchTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                placeholder="e.g. Campus Drive — August 2026"
              />
            </div>

            <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-[22px] p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#5B4BFF] hover:bg-[#5B4BFF]/5 transition-all group">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                disabled={loadingPreview}
              />
              {loadingPreview ? (
                <div className="space-y-2 flex flex-col items-center">
                  <Loader2 className="w-8 h-8 text-[#5B4BFF] animate-spin" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Parsing Excel spreadsheet and detecting column mappings...
                  </p>
                </div>
              ) : (
                <div className="space-y-3 flex flex-col items-center">
                  <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-[#5B4BFF] group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white block">
                      Click to choose Excel sheet (.xlsx, .xls)
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Supports company name, package, branches, dates, and arbitrary extra columns.
                    </span>
                  </div>
                </div>
              )}
            </label>
          </div>
        )}

        {/* Step 2: Live Preview Confirmation */}
        {previewData && (
          <div className="space-y-5">
            {/* Detection Summary Banner */}
            <div className="p-4 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {previewData.total_rows} Companies detected in {previewData.file_name}
                </span>
                <span className="text-slate-500 font-mono">
                  {previewData.recognized_columns.length} core fields mapped
                </span>
              </div>

              {previewData.unrecognized_columns.length > 0 && (
                <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                  <Sparkles className="w-3.5 h-3.5 text-[#F36C21]" />
                  <span>Extra columns (stored in JSONB):</span>
                  {previewData.unrecognized_columns.map((col: string, i: number) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Table Preview */}
            <div className="max-h-64 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold sticky top-0">
                  <tr>
                    <th className="p-3">Company</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Package (CTC)</th>
                    <th className="p-3">Branches</th>
                    <th className="p-3">Drive Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {previewData.preview_rows.map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-extrabold text-slate-900 dark:text-white">
                        {row.company_name}
                      </td>
                      <td className="p-3 text-[#5B4BFF] font-semibold">{row.role}</td>
                      <td className="p-3 font-bold">{row.package_ctc}</td>
                      <td className="p-3">
                        {Array.isArray(row.eligible_branches) ? row.eligible_branches.join(', ') : row.eligible_branches}
                      </td>
                      <td className="p-3">{row.drive_date || 'TBA'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  setPreviewData(null);
                  setFile(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                ← Choose Another File
              </button>

              <button
                onClick={handleConfirmImport}
                disabled={loadingConfirm}
                className="px-6 py-2.5 rounded-xl text-xs font-black bg-[#5B4BFF] hover:bg-[#4a3ae0] text-white shadow-md transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
              >
                {loadingConfirm ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Committing to Placement Board...
                  </>
                ) : (
                  <>
                    Confirm & Publish {previewData.total_rows} Companies
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
