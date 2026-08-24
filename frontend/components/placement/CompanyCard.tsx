'use client';

import React from 'react';
import { Building2, Calendar, MapPin, DollarSign, Award, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';

export interface PlacementCompany {
  drive_id: number;
  company_name: string;
  role: string;
  package_ctc?: string;
  package_min?: number;
  package_max?: number;
  eligible_branches?: string[] | string;
  eligible_batches?: string[] | string;
  drive_date?: string;
  deadline_date?: string;
  logo_url?: string;
  description?: string;
  extra_fields?: Record<string, any>;
  status?: string;
  total_applicants?: number;
  total_selected?: number;
  has_applied?: boolean;
  application_status?: string;
  offer_status?: string;
}

interface CompanyCardProps {
  company: PlacementCompany;
  role: string; // 'student' | 'faculty' | 'admin' | 'clerk'
  onViewDetails: (company: PlacementCompany) => void;
  onApply?: (company: PlacementCompany) => void;
  onManageApplicants?: (company: PlacementCompany) => void;
}

export default function CompanyCard({
  company,
  role,
  onViewDetails,
  onApply,
  onManageApplicants,
}: CompanyCardProps) {
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

  const extraFieldKeys = company.extra_fields ? Object.keys(company.extra_fields) : [];
  const initial = company.company_name?.charAt(0)?.toUpperCase() || 'C';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[22px] p-6 border border-[#E7EAF3] dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Top Badges & Status */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.company_name}
                className="w-12 h-12 rounded-2xl object-cover border border-slate-100 dark:border-slate-700 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2D2575] to-[#5B4BFF] text-white font-black text-xl flex items-center justify-center shadow-sm shrink-0">
                {initial}
              </div>
            )}
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight group-hover:text-[#5B4BFF] transition-colors line-clamp-1">
                {company.company_name}
              </h3>
              <p className="text-xs font-semibold text-[#5B4BFF] dark:text-[#7867FF]">
                {company.role || 'Associate Trainee / Engineer'}
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {company.status || 'Active'}
          </span>
        </div>

        {/* Package & Drive Date Metrics */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="p-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-[#4E5969] dark:text-slate-400 uppercase tracking-wider block">
              Package (CTC)
            </span>
            <span className="text-sm font-black text-[#1B1E28] dark:text-white">
              {company.package_ctc || '₹4.5 - ₹8.0 LPA'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-[#4E5969] dark:text-slate-400 uppercase tracking-wider block">
              Drive Date
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
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

        {/* Eligible Branches & Batches */}
        <div className="space-y-2 mb-4">
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] font-bold text-[#4E5969] dark:text-slate-400 mr-1">
              Branches:
            </span>
            {branches.slice(0, 4).map((b, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800"
              >
                {b}
              </span>
            ))}
            {branches.length > 4 && (
              <span className="text-[10px] text-slate-400 font-bold">
                +{branches.length - 4} more
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#4E5969] dark:text-slate-400">
            <span className="font-bold">Batches:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {batches.join(', ')}
            </span>
          </div>
        </div>

        {/* Quick Extra Fields Preview (if any) */}
        {extraFieldKeys.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 mb-4 space-y-1">
            {extraFieldKeys.slice(0, 2).map((k) => (
              <div key={k} className="text-xs flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 truncate max-w-[130px]">
                  {k}:
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px] text-right">
                  {String(company.extra_fields?.[k])}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
        <button
          onClick={() => onViewDetails(company)}
          className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#5B4BFF] hover:bg-[#5B4BFF]/10 dark:text-[#7867FF] transition-all flex items-center gap-1"
        >
          View Details
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {role === 'student' && (
          <div>
            {company.has_applied ? (
              <span className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {company.application_status || 'Applied'}
              </span>
            ) : (
              <button
                onClick={() => onApply?.(company)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#5B4BFF] hover:bg-[#4a3ae0] text-white shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
              >
                Apply Now
              </button>
            )}
          </div>
        )}

        {(role === 'admin' || role === 'faculty' || role === 'clerk') && (
          <button
            onClick={() => onManageApplicants?.(company)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white transition-all shadow-sm flex items-center gap-1.5"
          >
            Applicants ({company.total_applicants || 0})
          </button>
        )}
      </div>
    </div>
  );
}
