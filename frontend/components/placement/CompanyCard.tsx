'use client';

import React from 'react';
import { Building2, Calendar, MapPin, DollarSign, Award, ChevronRight, CheckCircle2, AlertCircle, Trash2, Loader2, Pencil } from 'lucide-react';

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
  eligibility_course_cd?: string | number;
  eligibility_branch_cd?: string | number;
  eligibility_batch_cd?: string | number;
  colg_cd?: string | number;
  min_score_required?: number;
  extra_fields?: Record<string, any>;
  status?: string;
  mode?: string;
  branches?: string[] | string;
  batches?: string[] | string;
  total_applicants?: number;
  total_selected?: number;
  has_applied?: boolean;
  application_status?: string;
  offer_status?: string;
  [key: string]: any;
}

interface CompanyCardProps {
  company: PlacementCompany;
  role: string; // 'student' | 'faculty' | 'admin' | 'clerk'
  userRole?: string;
  isDeleting?: boolean;
  onViewDetails: (company: PlacementCompany) => void;
  onEdit?: (company: PlacementCompany) => void;
  onApply?: (company: PlacementCompany) => void;
  onManageApplicants?: (company: PlacementCompany) => void;
  onDelete?: (company: PlacementCompany) => void;
}

export default function CompanyCard({
  company,
  role,
  userRole,
  isDeleting,
  onViewDetails,
  onEdit,
  onApply,
  onManageApplicants,
  onDelete,
}: CompanyCardProps) {
  const normRole = (userRole || role || '').toUpperCase();
  const canDelete = normRole === 'ADMIN' || normRole === 'SUPER_ADMIN' || normRole === 'COLLEGE_ADMIN' || role === 'admin';

  const courses = React.useMemo(() => {
    const detected = new Set<string>();

    const addNormalized = (raw: string) => {
      if (!raw) return;
      const clean = String(raw).replace(/^\[#\d+\]\s*/, '').trim();
      const upper = clean.toUpperCase().replace(/[\.\s_-]/g, '');
      
      if (upper.includes('BTECH') || upper.includes('BACHELOROFTECH')) detected.add('B.Tech');
      else if (upper.includes('MTECH') || upper.includes('MASTEROFTECH')) detected.add('M.Tech');
      else if (upper.includes('BCA') || upper.includes('BACHELOROFCOMPUTER')) detected.add('BCA');
      else if (upper.includes('MCA') || upper.includes('MASTEROFCOMPUTER')) detected.add('MCA');
      else if (upper.includes('BBA') || upper.includes('BACHELOROFBUSINESS')) detected.add('BBA');
      else if (upper.includes('MBA') || upper.includes('MASTEROFBUSINESS')) detected.add('MBA');
      else if (upper.includes('BPHARM') || upper.includes('PHARMACY')) detected.add('B.Pharm');
      else if (upper.includes('MPHARM')) detected.add('M.Pharm');
      else if (upper.includes('BSC') || upper.includes('BACHELOROFSCI')) detected.add('B.Sc');
      else if (upper.includes('MSC') || upper.includes('MASTEROFSCI')) detected.add('M.Sc');
      else if (upper.includes('BCOM')) detected.add('B.Com');
      else if (upper.includes('MCOM')) detected.add('M.Com');
      else if (upper.includes('DIPLOMA')) detected.add('Diploma');
      else {
        const standard = clean.replace(/\.+$/, '');
        if (standard) detected.add(standard);
      }
    };

    // 1. Target cohorts
    if (company.extra_fields?.target_cohorts && Array.isArray(company.extra_fields.target_cohorts)) {
      company.extra_fields.target_cohorts.forEach((c: any) => {
        if (c.course_name) {
          addNormalized(c.course_name);
        } else if (c.course_cd) {
          const cd = String(c.course_cd).trim();
          if (cd === '13') addNormalized('BCA');
          else if (cd === '1') addNormalized('B.Tech');
          else if (cd === '14') addNormalized('MCA');
          else addNormalized(`Course ${cd}`);
        }
      });
    }

    // 2. Direct course fields
    const rawCourses = company.eligible_courses || company.courses;
    if (Array.isArray(rawCourses)) {
      rawCourses.forEach((c: any) => {
        if (c) addNormalized(c);
      });
    } else if (typeof rawCourses === 'string' && rawCourses) {
      rawCourses.split(',').forEach((s: string) => {
        const trimmed = s.trim();
        if (trimmed) addNormalized(trimmed);
      });
    }

    // 3. eligibility_course_cd codes
    if (company.eligibility_course_cd) {
      const cdStr = String(company.eligibility_course_cd);
      cdStr.split(',').forEach((c) => {
        const trimmed = c.trim();
        if (trimmed === '13') addNormalized('BCA');
        else if (trimmed === '1') addNormalized('B.Tech');
        else if (trimmed === '14') addNormalized('MCA');
        else if (trimmed && trimmed !== 'ALL') addNormalized(`Course ${trimmed}`);
      });
    }

    // 4. Derive from eligible branches (only if no courses detected yet or if explicit branches match known patterns)
    const allBranchStrs = Array.isArray(company.eligible_branches)
      ? company.eligible_branches
      : typeof company.eligible_branches === 'string'
      ? company.eligible_branches.split(',')
      : Array.isArray(company.branches)
      ? company.branches
      : [];

    allBranchStrs.forEach((b: any) => {
      const bUpper = String(b).toUpperCase();
      if (bUpper.includes('BCA')) {
        addNormalized('BCA');
      }
      if (
        bUpper.includes('CSE') ||
        bUpper.includes('IT') ||
        bUpper.includes('(IT)') ||
        bUpper.includes('ECE') ||
        bUpper.includes('ME') ||
        bUpper.includes('EE') ||
        bUpper.includes('COMPUTER SCIENCE') ||
        bUpper.includes('DATA SCIENCE') ||
        bUpper.includes('INFORMATION TECH') ||
        bUpper.includes('MECHANICAL') ||
        bUpper.includes('ELECTRICAL') ||
        bUpper.includes('ELECTRONICS') ||
        bUpper.includes('CIVIL') ||
        bUpper.includes('B.TECH') ||
        bUpper.includes('BTECH')
      ) {
        addNormalized('B.Tech');
      }
      if (bUpper.includes('MCA')) {
        addNormalized('MCA');
      }
      if (bUpper.includes('MBA')) {
        addNormalized('MBA');
      }
      if (bUpper.includes('BBA')) {
        addNormalized('BBA');
      }
      if (bUpper.includes('PHARM')) {
        addNormalized('B.Pharm');
      }
    });

    if (detected.size === 0) {
      return ['BCA'];
    }
    return Array.from(detected);
  }, [company]);

  const branches = React.useMemo(() => {
    const raw = Array.isArray(company.eligible_branches) && company.eligible_branches.length > 0
      ? company.eligible_branches
      : typeof company.eligible_branches === 'string' && company.eligible_branches
      ? company.eligible_branches.split(',').map((s) => s.trim())
      : company.eligibility_branch_cd
      ? [String(company.eligibility_branch_cd)]
      : ['All Branches'];
    return Array.from(new Set(raw.map((b: any) => String(b || '').trim()).filter(Boolean)));
  }, [company]);

  const batches = React.useMemo(() => {
    const raw = Array.isArray(company.eligible_batches) && company.eligible_batches.length > 0
      ? company.eligible_batches
      : typeof company.eligible_batches === 'string' && company.eligible_batches
      ? company.eligible_batches.split(',').map((s) => s.trim())
      : company.eligibility_batch_cd
      ? [String(company.eligibility_batch_cd)]
      : ['2025'];
    return Array.from(new Set(raw.map((b: any) => String(b || '').trim()).filter(Boolean)));
  }, [company]);

  const extraFieldKeys = company.extra_fields ? Object.keys(company.extra_fields).filter(k => k !== 'target_cohorts' && k !== 'eligible_courses') : [];
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

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {company.status || 'Active'}
            </span>
            {canDelete && onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(company);
                }}
                title="Edit Placement Drive"
                className="px-2 py-1 rounded-full text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-800 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1 shrink-0 transition-all cursor-pointer active:scale-95 shadow-xs"
              >
                <Pencil className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              </button>
            )}
            {canDelete && onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(company);
                }}
                disabled={isDeleting}
                title="Delete Placement Drive"
                className="px-2 py-1 rounded-full text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1 shrink-0 transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-xs"
              >
                {isDeleting ? (
                  <Loader2 className="w-3 h-3 animate-spin text-rose-600 dark:text-rose-400" />
                ) : (
                  <Trash2 className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                )}
              </button>
            )}
          </div>
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

        {/* Eligible Courses, Branches & Batches */}
        <div className="space-y-2 mb-4">
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] font-bold text-[#4E5969] dark:text-slate-400 mr-1">
              Courses:
            </span>
            {courses.slice(0, 3).map((c: any, i: number) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-50 text-[#5B4BFF] dark:bg-violet-950/40 dark:text-violet-300 border border-violet-200/80 dark:border-violet-800/60"
              >
                {String(c)}
              </span>
            ))}
            {courses.length > 3 && (
              <span className="text-[10px] text-slate-400 font-bold">
                +{courses.length - 3} more
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] font-bold text-[#4E5969] dark:text-slate-400 mr-1">
              Branches:
            </span>
            {branches.slice(0, 4).map((b, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60"
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
            {(company.has_applied || (company as any).my_application || company.application_status) ? (
              <span className="px-3.5 py-2 rounded-xl text-xs font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Applied ({company.application_status || (company as any).my_application?.status || 'Under Review'})</span>
              </span>
            ) : (
              <button
                onClick={() => onApply?.(company)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#5B4BFF] hover:bg-[#4a3ae0] text-white shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
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
