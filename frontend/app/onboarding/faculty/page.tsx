'use client';
import { useState } from 'react';

export default function FacultyOnboardingPage() {
  const [step, setStep] = useState(1);
  const [designation, setDesignation] = useState('Associate Professor');
  const [specialization, setSpecialization] = useState('Pathology & Hematology');
  const [phone, setPhone] = useState('+91-9812345678');

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 flex flex-col justify-center items-center">
      <div className="w-full max-w-xl glass-card p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">Faculty Onboarding</span>
            <h2 className="text-xl font-extrabold text-white">
              {step === 1 && 'Step 1: Department & Specialization'}
              {step === 2 && 'Step 2: Teaching Batches Confirmation'}
              {step === 3 && 'Step 3: Finish Setup'}
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-400">Step {step} of 3</span>
        </div>

        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        {step === 1 && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">Designation</label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">Specialization</label>
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3 text-xs">
            <p className="text-slate-400">Review your assigned teaching subjects & student batches:</p>
            <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
              <p className="font-bold text-white">Systemic Pathology (PATH301)</p>
              <p className="text-slate-400">Assigned Batch: <span className="text-indigo-400 font-semibold">2023-MBBS</span></p>
              <p className="text-slate-400">Total Assigned Students: <span className="text-slate-200">120</span></p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-xs text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xl">
              ✓
            </div>
            <h3 className="text-base font-extrabold text-white">Faculty Profile Configured!</h3>
            <p className="text-slate-400">You are ready to mark lecture attendance and verify student clinical logbooks.</p>
          </div>
        )}

        <div className="flex justify-between pt-4 border-t border-slate-800 text-xs">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold">Back</button>
          ) : <div />}
          {step < 3 ? (
            <button onClick={() => setStep(step + 1)} className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-semibold">Next Step →</button>
          ) : (
            <button onClick={() => window.location.href = '/dashboard/faculty'} className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-semibold">Go to Faculty Dashboard 🎉</button>
          )}
        </div>
      </div>
    </div>
  );
}
