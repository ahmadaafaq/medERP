'use client';
import { useState } from 'react';

export default function AdminOnboardingPage() {
  const [step, setStep] = useState(1);
  const [deptName, setDeptName] = useState('General Surgery');
  const [batchCode, setBatchCode] = useState('2023-MBBS');

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 flex flex-col justify-center items-center">
      <div className="w-full max-w-xl glass-card p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">Admin Setup Wizard</span>
            <h2 className="text-xl font-extrabold text-white">
              {step === 1 && 'Step 1: Department Configurator'}
              {step === 2 && 'Step 2: Academic Batch Builder'}
              {step === 3 && 'Step 3: Admin Dashboard Ready'}
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-400">Step {step} of 3</span>
        </div>

        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        {step === 1 && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-400">Create academic departments for your college tenant:</p>
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">Department Name</label>
              <input
                type="text"
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-400">Define academic student cohorts & batches:</p>
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">Batch Code</label>
              <input
                type="text"
                value={batchCode}
                onChange={(e) => setBatchCode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-xs text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xl">
              ⚙
            </div>
            <h3 className="text-base font-extrabold text-white">College Setup Complete!</h3>
            <p className="text-slate-400">Departments, Batches, and Users are configured in schema isolation.</p>
          </div>
        )}

        <div className="flex justify-between pt-4 border-t border-slate-800 text-xs">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold">Back</button>
          ) : <div />}
          {step < 3 ? (
            <button onClick={() => setStep(step + 1)} className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-semibold">Next Step →</button>
          ) : (
            <button onClick={() => window.location.href = '/dashboard/admin'} className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-semibold">Open Admin Dashboard 🎉</button>
          )}
        </div>
      </div>
    </div>
  );
}
