'use client';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-[#0F172A] relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-2xl text-center relative z-10 space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-indigo-400 text-sm font-semibold mb-2">
          <span>🏥 MedERP v2.0 Platform</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
          Multi-Tenant Medical University ERP
        </h1>
        <p className="text-slate-400 text-lg">
          Unified digital campus ecosystem connecting Students, Faculty, Administrators, and Wardens with real-time analytics & schema isolation.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link
            href="/login"
            className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/25 transition-all"
          >
            Access Portal Login
          </Link>
          <Link
            href="/onboarding"
            className="px-6 py-3 rounded-lg glass-card hover:border-indigo-500/50 text-slate-200 font-semibold transition-all"
          >
            Start Onboarding
          </Link>
        </div>
      </div>
    </div>
  );
}
