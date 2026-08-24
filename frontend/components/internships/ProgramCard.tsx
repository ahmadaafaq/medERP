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
  ShieldCheck
} from 'lucide-react';

export interface InternshipProgram {
  id: string;
  title: string;
  category: 'IT' | 'MANAGEMENT' | 'PARAMEDICAL';
  duration: string;
  fee_type: 'PAID' | 'FREE';
  fee_amount?: number;
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
  const isLocked = program.status === 'applications_locked';
  const isPaid = program.fee_type === 'PAID';
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
        {/* Badges & Duration */}
        <div className="flex items-start justify-between gap-2">
          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase tracking-wider border ${categoryColor}`}>
            {program.category}
          </span>

          <div className="flex items-center gap-1.5">
            {isPaid ? (
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                ₹{program.fee_amount} (Paid)
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                100% Free
              </span>
            )}

            {isLocked && (
              <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Locked
              </span>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="font-black text-slate-900 dark:text-white text-base tracking-tight group-hover:text-[#5B4BFF] transition-colors line-clamp-2">
            {program.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
            {program.description || 'Hands-on practical training and project certification.'}
          </p>
        </div>

        {/* Applicants Progress Bar */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#5B4BFF]" />
              Applied Applicants
            </span>
            <span className="text-[#5B4BFF] dark:text-[#7867FF] font-black">
              {program.total_applicants || 0} / {program.seats_available || 50} seats ({Math.min(100, Math.round(((program.total_applicants || 0) / (program.seats_available || 50)) * 100))}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#5B4BFF] via-[#7867FF] to-[#00C48C] transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max((program.total_applicants || 0) > 0 ? 8 : 0, Math.round(((program.total_applicants || 0) / (program.seats_available || 50)) * 100)))}%`
              }}
            />
          </div>
        </div>

        {/* Program Highlights */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-semibold">
            <Clock className="w-4 h-4 text-[#5B4BFF] shrink-0" />
            <span>{durationFormatted}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-semibold">
            <ShieldCheck className="w-4 h-4 text-[#00C48C] shrink-0" />
            <span>Official Certification</span>
          </div>
        </div>
      </div>

      {/* Footer Actions / Application State */}
      <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
        {/* Student View */}
        {role === 'student' && (
          <div className="w-full">
            {!myApp ? (
              <button
                onClick={() => onApply?.(program)}
                disabled={isLocked}
                className="w-full py-2.5 rounded-xl text-xs font-black bg-[#5B4BFF] hover:bg-[#4a3ae0] text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLocked ? 'Applications Locked' : 'Apply for Program'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="space-y-2">
                {/* Completed State -> Certificate Action */}
                {myApp.status === 'completed' ? (
                  <button
                    onClick={() => onViewCertificate?.(myApp.id)}
                    className="w-full py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 animate-pulse"
                  >
                    <Award className="w-4 h-4" />
                    View & Download Certificate
                  </button>
                ) : myApp.payment_status === 'pending' ? (
                  <button
                    onClick={() => onMakePayment?.(myApp.id, program.fee_amount || 0)}
                    className="w-full py-2.5 rounded-xl text-xs font-black bg-[#F36C21] hover:bg-[#d95b16] text-white shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    Pay Enrollment Fee (₹{program.fee_amount})
                  </button>
                ) : (
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-center text-xs font-bold text-[#5B4BFF] dark:text-indigo-300 flex items-center justify-center gap-1.5">
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
            className="w-full py-2.5 rounded-xl text-xs font-black bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white shadow-sm transition-all flex items-center justify-center gap-2"
          >
            Review Applicants ({program.total_applicants || 0})
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
