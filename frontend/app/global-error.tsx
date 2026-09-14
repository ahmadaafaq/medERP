'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('MedERP Global Error (Root Layout):', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-[#F6F8FC] text-[#1B1E28] p-4 font-sans selection:bg-[#F36C21] selection:text-white">
        <div className="w-full max-w-md bg-white rounded-[22px] border border-[#E7EAF3] shadow-xl p-6 sm:p-8 space-y-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-orange-50 text-[#F36C21] border border-orange-200">
              <span>● MedERP Platform</span>
            </div>
            <h1 className="text-2xl font-black text-[#1B1E28] tracking-tight">
              Application Error
            </h1>
            <p className="text-xs text-[#4E5969] leading-relaxed">
              The application encountered an unexpected connection error during initial launch.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={() => reset()}
              className="w-full sm:flex-1 py-3 px-4 bg-[#5B4BFF] hover:bg-[#4838DF] active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Reload Application</span>
            </button>
            <a
              href="/login"
              className="w-full sm:w-auto py-3 px-5 bg-white hover:bg-slate-50 text-[#1B1E28] font-bold text-xs rounded-xl border border-[#E7EAF3] shadow-sm transition-all"
            >
              Login
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
