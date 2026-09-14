'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [checkingBackend, setCheckingBackend] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    console.error('MedERP Application Error Boundary Caught:', error);
    checkBackendHealth();
  }, [error]);

  const checkBackendHealth = async () => {
    setCheckingBackend(true);
    try {
      const res = await fetch('/api/firms?public=true', { cache: 'no-store' });
      if (res.ok) {
        setBackendOnline(true);
      } else {
        setBackendOnline(false);
      }
    } catch {
      setBackendOnline(false);
    } finally {
      setCheckingBackend(false);
    }
  };

  const isConnectionError =
    error?.message?.includes('fetch') ||
    error?.message?.includes('ECONNREFUSED') ||
    error?.message?.includes('NetworkError') ||
    error?.message?.includes('Failed to fetch') ||
    backendOnline === false;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F8FC] dark:bg-[#0F121C] text-[#1B1E28] dark:text-white p-4 font-sans selection:bg-[#F36C21] selection:text-white">
      <div className="w-full max-w-md bg-white dark:bg-[#161926] rounded-[22px] border border-[#E7EAF3] dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-6 text-center transition-all">
        {/* Top Status Icon */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-orange-50 dark:bg-orange-950/40 text-[#F36C21] border border-orange-200 dark:border-orange-800/40">
            <span>● MedERP Status</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1B1E28] dark:text-white tracking-tight">
            {isConnectionError ? 'Backend Connecting / Re-syncing' : 'Something went wrong'}
          </h1>
          <p className="text-xs text-[#4E5969] dark:text-slate-400 leading-relaxed">
            {isConnectionError
              ? 'The MedERP backend service on port 8081 was restarting or momentarily disconnected. Please click reconnect below.'
              : error?.message || 'An unexpected error occurred while loading this view.'}
          </p>
        </div>

        {/* Live Service Indicator */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-[#E7EAF3] dark:border-slate-800 text-xs flex items-center justify-between">
          <span className="font-semibold text-[#4E5969] dark:text-slate-400">Backend API (Port 8081):</span>
          <span className="flex items-center gap-1.5 font-bold">
            {checkingBackend ? (
              <span className="text-indigo-500 animate-pulse">Checking...</span>
            ) : backendOnline ? (
              <span className="text-emerald-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Online & Ready
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400">Restarting / Waiting</span>
            )}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={() => {
              checkBackendHealth();
              reset();
            }}
            className="w-full sm:flex-1 py-3 px-4 bg-[#5B4BFF] hover:bg-[#4838DF] active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Reconnect & Retry</span>
          </button>

          <Link
            href="/login"
            className="w-full sm:w-auto py-3 px-5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[#1B1E28] dark:text-white font-bold text-xs rounded-xl border border-[#E7EAF3] dark:border-slate-700 shadow-sm transition-all text-center"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

