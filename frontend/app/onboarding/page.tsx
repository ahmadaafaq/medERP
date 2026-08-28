'use client';
import Link from 'next/link';

export default function OnboardingHubPage() {
  const roles = [
    { title: 'Student Onboarding', role: 'student', desc: 'Complete profile, emergency contact & blood group', href: '/onboarding/student', badge: 'Step 1 of 3' },
    { title: 'Faculty Onboarding', role: 'faculty', desc: 'Confirm department, specialization & teaching batches', href: '/onboarding/faculty', badge: 'Step 1 of 3' },
    { title: 'Admin & HOD Setup', role: 'admin', desc: 'Configure departments, academic batches & subjects', href: '/onboarding/admin', badge: 'Step 1 of 5' },
    { title: 'College Setup Wizard', role: 'college', desc: 'Super-Admin college tenant creation & DB provisioning', href: '/onboarding/college', badge: 'Super Admin' },
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 md:p-12 flex flex-col items-center justify-center">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-card text-indigo-400 text-xs font-semibold">
            <span>🚀 MedERP Onboarding Center</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Select Onboarding Flow</h1>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Choose your role to launch the step-by-step onboarding wizard for your college tenant.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((r, idx) => (
            <Link key={idx} href={r.href} className="glass-card glass-card-hover p-6 block space-y-3 border border-slate-800">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-extrabold text-white">{r.title}</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold uppercase">
                  {r.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{r.desc}</p>
              <div className="pt-2 flex items-center text-xs font-semibold text-indigo-400">
                Launch Wizard →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
