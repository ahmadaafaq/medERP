'use client';

import React from 'react';
import { X, Building2, Calendar, MapPin, DollarSign, Award, CheckCircle2, ShieldCheck, Briefcase, FileText } from 'lucide-react';
import { PlacementCompany } from './CompanyCard';

interface CompanyDetailDrawerProps {
  company: PlacementCompany | null;
  role: string;
  onClose: () => void;
  onApply?: (company: PlacementCompany) => void;
}

export default function CompanyDetailDrawer({
  company,
  role,
  onClose,
  onApply,
}: CompanyDetailDrawerProps) {
  if (!company) return null;

  const branches = Array.isArray(company.eligible_branches)
    ? company.eligible_branches
    : typeof company.eligible_branches === 'string'
    ? company.eligible_branches.split(',').map((s) => s.trim())
    : ['All Branches'];

  const batches = Array.isArray(company.eligible_batches)
    ? company.eligible_batches
    : typeof company.eligible_batches === 'string'
    ? company.eligible_batches.split(',').map((s) => s.trim())
    : ['2025', '2026'];

  const extraFields = company.extra_fields || {};
  const extraKeys = Object.keys(extraFields);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl overflow-y-auto flex flex-col justify-between border-l border-slate-200 dark:border-slate-800">
        <div>
          {/* Drawer Top Header */}
          <div className="p-6 bg-gradient-to-r from-[#2D2575] to-[#1e1757] text-white flex items-start justify-between">
            <div className="flex items-center gap-4">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.company_name}
                  className="w-14 h-14 rounded-2xl object-cover bg-white p-1 shadow-md shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-[#5B4BFF] text-white font-black text-2xl flex items-center justify-center shadow-md shrink-0">
                  {company.company_name?.charAt(0)?.toUpperCase() || 'C'}
                </div>
              )}
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F36C21] text-white uppercase tracking-wider mb-1 inline-block">
                  Campus Drive 2026-27
                </span>
                <h2 className="text-xl font-extrabold tracking-tight">
                  {company.company_name}
                </h2>
                <p className="text-xs text-indigo-200 font-medium">
                  {company.role}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Offered Package (CTC)
                </span>
                <span className="text-base font-black text-[#5B4BFF] dark:text-[#7867FF]">
                  {company.package_ctc || '₹4.5 - ₹8.0 LPA'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Date of Drive
                </span>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {company.drive_date
                    ? new Date(company.drive_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'TBA'}
                </span>
              </div>
            </div>

            {/* Description & Overview */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Job Overview & Opportunity Details
              </h3>
              <div className="p-4 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {company.description || 'On-campus placement drive. Selected candidates will join as part of the specialized engineering & technology cohort.'}
              </div>
            </div>

            {/* Eligibility Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Eligibility & Qualifications
              </h3>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                <div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
                    Eligible Branches:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {branches.map((b, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600 dark:text-slate-400">
                    Graduating Batches:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {batches.join(', ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic Unmapped Extra Fields from Excel */}
            {extraKeys.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Additional Corporate Details
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Auto-Mapped from Sheet
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {extraKeys.map((key) => (
                    <div
                      key={key}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                    >
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {key}
                      </span>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white text-right">
                        {String(extraFields[key])}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Action Bar */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-all"
          >
            Close Details
          </button>

          {role === 'student' && !company.has_applied && (
            <button
              onClick={() => {
                onApply?.(company);
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl text-xs font-black bg-[#5B4BFF] hover:bg-[#4a3ae0] text-white shadow-md transition-all active:scale-95 flex items-center gap-2"
            >
              Submit Application
            </button>
          )}

          {role === 'student' && company.has_applied && (
            <span className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Already Applied ({company.application_status || 'Under Review'})
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
