'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  const handleEnterERP = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen w-full bg-[#F6F8FC] text-[#1B1E28] font-sans selection:bg-[#5B4BFF] selection:text-white relative flex flex-col justify-between overflow-x-hidden">
      {/* Dynamic Background Ambient Blobs */}
      <div className="absolute top-0 left-1/4 w-[700px] h-[700px] bg-[#5B4BFF]/8 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute top-1/3 right-[-5%] w-[600px] h-[600px] bg-[#F36C21]/8 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-0 left-[-5%] w-[500px] h-[500px] bg-[#2D2575]/8 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* ─────────────────────────────────────────────────────────────
          1. FULL-WIDTH TOP NAVIGATION HEADER
          ───────────────────────────────────────────────────────────── */}
      <header className="w-full bg-[#2D2575] text-white border-b border-white/10 shadow-md relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl shadow-inner shrink-0">
              🏥
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#F36C21] bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                  UNICAMPUS PLUS
                </span>
                <span className="text-[11px] text-white/60 font-mono hidden sm:inline-block">v2.4</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                <span>UNICAMPUS PLUS</span>
                <span className="text-white/40 text-xs font-normal hidden md:inline">|</span>
                <span className="text-xs text-white/80 font-medium hidden md:inline">A Platform of Medical College</span>
              </h1>
            </div>
          </div>

          {/* Quick Nav & CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/onboarding"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-all"
            >
              <span>🏛️</span>
              <span>Campus Onboarding</span>
            </Link>

            <button
              onClick={handleEnterERP}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-full bg-gradient-to-r from-[#F36C21] to-[#FF843E] hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-[0_4px_16px_rgba(243,108,33,0.35)] hover:shadow-[0_6px_20px_rgba(243,108,33,0.45)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              <span>🔐</span>
              <span>Enter Medical ERP</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. FULL-SCREEN HERO SECTION
          ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 relative z-10 flex flex-col justify-center">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Headline & Value Prop */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#E7EAF3] shadow-sm text-[#5B4BFF] text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#00C48C] animate-ping" />
              <span>UNICAMPUS PLUS</span>
              <span className="text-[#7B8794]">|</span>
              <span className="text-[#2D2575]">A Platform of Medical College</span>
            </div>

            {/* Main Headline */}
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#1B1E28] leading-[1.15]">
              Unified ERP for your <br />
              <span className="bg-gradient-to-r from-[#2D2575] via-[#5B4BFF] to-[#7867FF] bg-clip-text text-transparent">
                Entire Medical Campus
              </span>
            </h2>

            {/* Subtitle */}
            <p className="text-[#4E5969] text-base sm:text-lg leading-relaxed max-w-2xl">
              Manage admissions, CBME academics, clinical postings, examinations, hostels, hospital operations, and multi-tenant governance — all in one schema-isolated ecosystem.
            </p>

            {/* Feature Checklist */}
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2.5 p-3 rounded-[16px] bg-white border border-[#E7EAF3] shadow-sm">
                <span className="w-7 h-7 rounded-lg bg-[#5B4BFF]/10 text-[#5B4BFF] flex items-center justify-center font-bold text-sm shrink-0">
                  ✓
                </span>
                <span className="text-xs sm:text-sm font-semibold text-[#1B1E28]">
                  Role-based Portals (Student, Faculty, Admin)
                </span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-[16px] bg-white border border-[#E7EAF3] shadow-sm">
                <span className="w-7 h-7 rounded-lg bg-[#5B4BFF]/10 text-[#5B4BFF] flex items-center justify-center font-bold text-sm shrink-0">
                  ✓
                </span>
                <span className="text-xs sm:text-sm font-semibold text-[#1B1E28]">
                  PostgreSQL Tenant Schema Isolation
                </span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-[16px] bg-white border border-[#E7EAF3] shadow-sm">
                <span className="w-7 h-7 rounded-lg bg-[#5B4BFF]/10 text-[#5B4BFF] flex items-center justify-center font-bold text-sm shrink-0">
                  ✓
                </span>
                <span className="text-xs sm:text-sm font-semibold text-[#1B1E28]">
                  NMC CBME Competency & Attendance
                </span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-[16px] bg-white border border-[#E7EAF3] shadow-sm">
                <span className="w-7 h-7 rounded-lg bg-[#5B4BFF]/10 text-[#5B4BFF] flex items-center justify-center font-bold text-sm shrink-0">
                  ✓
                </span>
                <span className="text-xs sm:text-sm font-semibold text-[#1B1E28]">
                  Integrated Hospital & Hostel Ledger
                </span>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-gradient-to-r from-[#2D2575] via-[#5B4BFF] to-[#7867FF] hover:opacity-95 text-white font-bold text-base shadow-[0_10px_28px_rgba(91,75,255,0.38)] hover:shadow-[0_14px_34px_rgba(91,75,255,0.48)] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
              >
                <span>🔐</span>
                <span>Enter Medical ERP</span>
                <span>➔</span>
              </Link>

              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-white hover:bg-[#F6F8FC] border border-[#E7EAF3] hover:border-[#5B4BFF] text-[#2D2575] font-bold text-base shadow-sm transition-all"
              >
                <span>🏛️</span>
                <span>Institutional Setup</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Interactive Medical Hub Card */}
          <div className="lg:col-span-5 relative">
            <div className="w-full bg-white rounded-[26px] border border-[#E7EAF3] shadow-[0_16px_48px_-12px_rgba(45,37,117,0.15)] overflow-hidden relative transition-all">
              
              {/* Header Box on Card */}
              <div className="bg-gradient-to-r from-[#2D2575] via-[#221C5C] to-[#3B2F96] p-6 text-white relative">
                {/* Subtle ECG Heartbeat Pulse Line */}
                <div className="absolute top-3 right-4 opacity-25 pointer-events-none">
                  <svg width="120" height="35" viewBox="0 0 140 40" fill="none">
                    <path
                      d="M0 20 H30 L35 10 L42 32 L48 5 L55 28 L60 20 H140"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl">
                    🎓
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#F36C21] bg-white/10 px-2 py-0.5 rounded-full">
                      FOR MEDICAL COLLEGES
                    </span>
                    <h3 className="text-base font-extrabold text-white mt-1">
                      Centralized Academic & Hospital ERP
                    </h3>
                  </div>
                </div>
              </div>

              {/* Modules Grid */}
              <div className="p-6 space-y-5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#7B8794] block">
                  Core Clinical & Academic Modules:
                </span>
                
                <div className="grid grid-cols-2 gap-3">
                  <FeatureModuleCard icon="📚" label="Academics" sub="MBBS, MD, MS, Nursing" />
                  <FeatureModuleCard icon="🏥" label="Hospital" sub="Clinical Postings & Logs" />
                  <FeatureModuleCard icon="🧾" label="Exams" sub="Continuous & University" />
                  <FeatureModuleCard icon="🛏️" label="Hostel" sub="Resident & Student Wings" />
                  <FeatureModuleCard icon="👥" label="Staff / HR" sub="Faculty Roster & Biometric" />
                  <FeatureModuleCard icon="💳" label="Fee Ledger" sub="Real-time Reconciliation" />
                </div>

                {/* Instant Access Banner */}
                <div className="p-4 rounded-[18px] bg-[#F6F8FC] border border-[#E7EAF3] flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-[#1B1E28]">
                      Ready to access your portal?
                    </p>
                    <p className="text-[11px] text-[#7B8794]">
                      Auto-complete college search enabled
                    </p>
                  </div>
                  <button
                    onClick={handleEnterERP}
                    className="px-4 py-2 rounded-full bg-[#5B4BFF] hover:bg-[#4837E8] text-white text-xs font-bold shadow-md transition-all shrink-0 cursor-pointer"
                  >
                    Enter ERP ➔
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          3. FULL-WIDTH FOOTER
          ───────────────────────────────────────────────────────────── */}
      <footer className="w-full bg-white border-t border-[#E7EAF3] py-6 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#7B8794] gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#2D2575]">UNICAMPUS PLUS</span>
            <span>— A Platform of Medical College</span>
            <span>• © 2026</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/onboarding" className="text-[#5B4BFF] font-semibold hover:underline">
              Institutional Onboarding
            </Link>
            <Link href="/login" className="text-[#5B4BFF] font-semibold hover:underline flex items-center gap-1">
              <span>Portal Login</span>
              <span>➔</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureModuleCard({ icon, label, sub }: { icon: string; label: string; sub: string }) {
  return (
    <div className="p-3 rounded-[16px] bg-[#F6F8FC] border border-[#E7EAF3] hover:border-[#5B4BFF] hover:bg-white hover:shadow-[0_4px_16px_rgba(91,75,255,0.08)] transition-all flex items-start gap-2.5">
      <span className="text-xl mt-0.5">{icon}</span>
      <div className="min-w-0">
        <h4 className="text-xs font-bold text-[#1B1E28]">{label}</h4>
        <p className="text-[10px] text-[#7B8794] truncate">{sub}</p>
      </div>
    </div>
  );
}
