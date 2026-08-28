'use client';

import React from 'react';
import { 
  GraduationCap, 
  Clock, 
  CheckCircle2, 
  Users, 
  Lock, 
  Award, 
  ArrowRight,
  ShieldCheck,
  Calendar,
  Building2,
  MapPin,
  FileText,
  Briefcase,
  ExternalLink,
  Download
} from 'lucide-react';

export interface InternshipProgram {
  id: string;
  title: string;
  category: 'IT' | 'MANAGEMENT' | 'PARAMEDICAL';
  duration: string;
  fee_type: 'PAID' | 'FREE' | 'STIPEND';
  fee_amount?: number;
  stipend_amount?: number;
  campus_type?: 'ON_CAMPUS' | 'OFF_CAMPUS';
  organization_name?: string;
  organization_type?: string;
  off_campus_title?: string;
  location?: string;
  working_conditions?: string;
  work_mode?: 'ON_SITE' | 'REMOTE' | 'HYBRID';
  certification_mode?: 'IN_HOUSE_AUTO' | 'OFF_CAMPUS_UPLOAD' | 'DUAL';
  description?: string;
  seats_available?: number;
  application_deadline?: string;
  status: 'draft' | 'published' | 'applications_locked' | 'completed';
  total_applicants?: number;
  selected_count?: number;
  completed_count?: number;
  my_application?: {
    id: string;
    status: 'applied' | 'under_review' | 'selected' | 'rejected' | 'completed';
    payment_status: 'not_required' | 'pending' | 'paid';
    certificate_no?: string;
    cert_external_url?: string;
    external_cert_url?: string;
    certificate_source?: string;
  };
}

interface ProgramCardProps {
  program: InternshipProgram;
  role: string;
  onApply?: (program: InternshipProgram) => void;
  onViewApplicants?: (program: InternshipProgram) => void;
  onViewCertificate?: (applicationId: string) => void;
  onMakePayment?: (applicationId: string, amount: number) => void;
}

export default function ProgramCard({
  program,
  role,
  onApply,
  onViewApplicants,
  onViewCertificate,
  onMakePayment,
}: ProgramCardProps) {
  // Check deadline expiry
  let isDeadlineExpired = false;
  let deadlineFormatted = '';

  if (program.application_deadline) {
    try {
      const deadlineDate = new Date(program.application_deadline);
      if (!isNaN(deadlineDate.getTime())) {
        const endOfDayDeadline = new Date(deadlineDate);
        endOfDayDeadline.setHours(23, 59, 59, 999);
        isDeadlineExpired = endOfDayDeadline.getTime() < Date.now();
        deadlineFormatted = deadlineDate.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      }
    } catch {}
  }

  const isLocked = program.status === 'applications_locked' || isDeadlineExpired;
  const isPaid = program.fee_type === 'PAID';
  const isStipend = program.fee_type === 'STIPEND';
  const isOffCampus = program.campus_type === 'OFF_CAMPUS';
  const myApp = program.my_application;

  const categoryColor =
    program.category === 'IT'
      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800'
      : program.category === 'MANAGEMENT'
      ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800'
      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';

  const durationFormatted = program.duration ? program.duration.replace('_', ' ') : '3 Months';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[22px] p-6 border border-[#E7EAF3] dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
      <div className="space-y-4">
        {/* Top Badges: Domain, Campus Type & Pricing */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase tracking-wider border ${categoryColor}`}>
              {program.category}
            </span>

            {isOffCampus ? (
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800 flex items-center gap-1">
                <span>🏢</span> Off-Campus
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                <span>🏛️</span> On-Campus
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {isStipend ? (
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                ₹{program.stipend_amount || 0}/mo (Stipend)
              </span>
            ) : isPaid ? (
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                ₹{program.fee_amount} (Paid Fee)
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                100% Free
              </span>
            )}

            {isDeadlineExpired ? (
              <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Expired
              </span>
            ) : isLocked ? (
              <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Locked
              </span>
            ) : null}
          </div>
        </div>

        {/* Title & Organization Host */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-600 dark:text-slate-400 mb-1">
            <Building2 className="w-3.5 h-3.5 text-[#F36C21]" />
            <span className="truncate">
              {program.organization_name || (isOffCampus ? 'Partner Organization' : 'SRMS Internal Research & Incubation Cell')}
            </span>
            {program.organization_type && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-bold">
                {program.organization_type}
              </span>
            )}
          </div>

          <h3 className="font-black text-slate-900 dark:text-white text-base tracking-tight group-hover:text-[#F36C21] transition-colors line-clamp-2">
            {program.off_campus_title && isOffCampus ? program.off_campus_title : program.title}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
            {program.description || 'Hands-on practical training and project certification.'}
          </p>
        </div>

        {/* Working Conditions & Location Details */}
        {(program.location || program.working_conditions || program.work_mode) && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 text-[11px] space-y-1">
            {program.location && (
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold truncate">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Location: {program.location}</span>
                {program.work_mode && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black">
                    {program.work_mode === 'ON_SITE' ? '🏢 On-Site' : (program.work_mode === 'REMOTE' ? '🏠 Remote' : '🔄 Hybrid')}
                  </span>
                )}
              </div>
            )}
            {program.working_conditions && (
              <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                <Briefcase className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span className="line-clamp-2">Conditions: {program.working_conditions}</span>
              </div>
            )}
          </div>
        )}

        {/* Applicants Progress Bar */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#F36C21]" />
              Applied Candidates
            </span>
            <span className="text-[#F36C21] font-black">
              {program.total_applicants || 0} / {program.seats_available || 50} seats ({Math.min(100, Math.round(((program.total_applicants || 0) / (program.seats_available || 50)) * 100))}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#F36C21] transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max((program.total_applicants || 0) > 0 ? 8 : 0, Math.round(((program.total_applicants || 0) / (program.seats_available || 50)) * 100)))}%`
              }}
            />
          </div>
        </div>

        {/* Program Highlights & Certification Mode */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-semibold">
            <Clock className="w-4 h-4 text-[#F36C21] shrink-0" />
            <span>{durationFormatted}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-semibold">
            <ShieldCheck className="w-4 h-4 text-[#00C48C] shrink-0" />
            <span className="truncate">
              {program.certification_mode === 'OFF_CAMPUS_UPLOAD' ? 'External Org Certificate' : 'Verifiable E-Certificate'}
            </span>
          </div>

          {deadlineFormatted && (
            <div className="col-span-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold pt-0.5">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                Deadline: <strong className={isDeadlineExpired ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'}>{deadlineFormatted}</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions / Application State */}
      <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
        {/* Student View */}
        {role === 'student' && (
          <div className="w-full">
            {!myApp ? (
              <button
                onClick={() => {
                  if (!isLocked) onApply?.(program);
                }}
                disabled={isLocked}
                className={`w-full py-2.5 rounded-xl text-xs font-black shadow-sm transition-all flex items-center justify-center gap-2 ${
                  isDeadlineExpired
                    ? 'bg-slate-150 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed'
                    : isLocked
                    ? 'bg-slate-150 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed'
                    : 'bg-[#F36C21] hover:bg-[#E05B10] text-white active:scale-95 cursor-pointer'
                }`}
              >
                {isDeadlineExpired ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Applications Closed (Deadline Expired)</span>
                  </>
                ) : isLocked ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Applications Locked</span>
                  </>
                ) : (
                  <>
                    <span>Apply for Program</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-2">
                {/* Completed State -> Certificate Action */}
                {myApp.status === 'completed' ? (
                  <div className="space-y-1.5">
                    {/* If external certificate uploaded */}
                    {(myApp.cert_external_url || myApp.external_cert_url) ? (
                      <a
                        href={myApp.cert_external_url || myApp.external_cert_url}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        Download External Certificate (PDF)
                      </a>
                    ) : null}

                    {/* In-House Digital Certificate Viewer */}
                    <button
                      onClick={() => onViewCertificate?.(myApp.id)}
                      className="w-full py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                    >
                      <Award className="w-4 h-4" />
                      View Institutional Certificate
                    </button>
                  </div>
                ) : myApp.payment_status === 'pending' ? (
                  <button
                    onClick={() => onMakePayment?.(myApp.id, program.fee_amount || 0)}
                    className="w-full py-2.5 rounded-xl text-xs font-black bg-[#F36C21] hover:bg-[#d95b16] text-white shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    Pay Enrollment Fee (₹{program.fee_amount})
                  </button>
                ) : (
                  <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 text-center text-xs font-bold text-[#F36C21] flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Enrolled ({myApp.status.toUpperCase()})
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Faculty / Admin / Clerk View */}
        {(role === 'admin' || role === 'faculty' || role === 'clerk') && (
          <button
            onClick={() => onViewApplicants?.(program)}
            className="w-full py-2.5 rounded-xl text-xs font-black bg-[#F36C21] hover:bg-[#E05B10] text-white shadow-md shadow-orange-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-orange-500"
          >
            Review Applicants ({program.total_applicants || 0})
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
