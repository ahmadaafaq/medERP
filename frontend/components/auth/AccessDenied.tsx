'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Home, Lock } from 'lucide-react';

interface AccessDeniedProps {
  pathname?: string;
  moduleLabel?: string;
  reason?: string;
  userRole?: string;
  tenantSlug?: string;
}

export default function AccessDenied({
  pathname,
  moduleLabel,
  reason,
  userRole,
  tenantSlug,
}: AccessDeniedProps) {
  const router = useRouter();

  const getDashboardHome = () => {
    const r = (userRole || 'admin').toLowerCase();
    if (r === 'owner' || r === 'superadmin') return '/dashboard/owner';
    if (r === 'faculty') return '/dashboard/faculty';
    if (r === 'student') return '/dashboard/student';
    if (r === 'clerk') return '/dashboard/clerk';
    if (r === 'warden') return '/dashboard/warden';
    return '/dashboard/admin';
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] dark:bg-[#0E131F] flex flex-col items-center justify-center p-4 selection:bg-[#5B4BFF] selection:text-white">
      <div className="max-w-md w-full bg-white dark:bg-[#161B26] border border-[#E7EAF3] dark:border-gray-800 rounded-[22px] shadow-xl shadow-indigo-950/5 p-8 sm:p-10 text-center animate-in fade-in zoom-in-95 duration-300">
        {/* Shield Alert Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/30 text-[#F04438] flex items-center justify-center mb-6 ring-8 ring-red-50/50 dark:ring-red-950/10 transition-transform hover:scale-105 duration-200">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-[#F04438] text-[11px] font-bold tracking-wider uppercase mb-3">
          <Lock className="w-3 h-3" />
          Rights Not Granted
        </div>

        {/* Title */}
        <h1 className="text-2xl font-black text-[#1B1E28] dark:text-white tracking-tight mb-2">
          {moduleLabel ? `${moduleLabel} Access Not Granted` : 'Page Access Not Granted'}
        </h1>

        {/* Description */}
        <p className="text-sm text-[#4E5969] dark:text-gray-400 leading-relaxed mb-6">
          {reason ||
            'SuperAdmin has not granted rights for this menu page for your institution or role. If you require access, please contact SuperAdmin.'}
        </p>

        {/* Technical Details Card */}
        <div className="bg-[#F6F8FC] dark:bg-[#1C2230] border border-[#E7EAF3] dark:border-gray-800 rounded-xl p-3.5 mb-6 text-left text-xs space-y-1.5">
          {pathname && (
            <div className="flex justify-between items-center text-gray-500 dark:text-gray-400">
              <span>Requested Path:</span>
              <span className="font-mono font-semibold text-[#1B1E28] dark:text-gray-200 truncate max-w-[200px]" title={pathname}>
                {pathname}
              </span>
            </div>
          )}
          {userRole && (
            <div className="flex justify-between items-center text-gray-500 dark:text-gray-400">
              <span>Active Role:</span>
              <span className="font-semibold text-[#5B4BFF] uppercase tracking-wide">
                {userRole}
              </span>
            </div>
          )}
          {tenantSlug && (
            <div className="flex justify-between items-center text-gray-500 dark:text-gray-400">
              <span>Institution:</span>
              <span className="font-medium text-[#1B1E28] dark:text-gray-200 truncate max-w-[200px]" title={tenantSlug}>
                {tenantSlug}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[#E7EAF3] dark:border-gray-700 text-[#1B1E28] dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl font-semibold text-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <button
            onClick={() => router.push(getDashboardHome())}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#5B4BFF] hover:bg-[#4A3AFF] text-white rounded-xl font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all hover:shadow-indigo-500/30"
          >
            <Home className="w-4 h-4" />
            Return to Dashboard
          </button>
        </div>

        {/* Footer Hint */}
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-6">
          Need access to this feature? Contact your College Super Administrator to assign this permission.
        </p>
      </div>
    </div>
  );
}
