'use client';

import React from 'react';

interface Step4Props {
  data: {
    firm_mode: 'MED' | 'NONMED';
  };
  updateData: (fields: Partial<{ firm_mode: 'MED' | 'NONMED' }>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step4FirmMode({ data, updateData, onNext, onBack }: Step4Props) {
  return (
    <div className="bg-white rounded-[22px] border border-[#E7EAF3] p-8 shadow-sm transition-all">
      <div className="border-b border-[#E7EAF3] pb-5 mb-6">
        <h2 className="text-xl font-extrabold text-[#1B1E28]">Step 4 — Academic & Firm Mode</h2>
        <p className="text-sm text-[#4E5969] mt-1">
          Select whether this institution operates as a Medical Institute (NMC/MBBS curriculum, clinical logbooks, hospital rounds) or Non-Medical College (AICTE/Engineering/Law/Management).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Medical (MED) */}
        <div
          onClick={() => updateData({ firm_mode: 'MED' })}
          className={`p-6 rounded-[22px] border-2 cursor-pointer transition-all ${
            data.firm_mode === 'MED'
              ? 'border-[#5B4BFF] bg-[#5B4BFF]/5 ring-4 ring-[#5B4BFF]/10 shadow-md'
              : 'border-[#E7EAF3] hover:border-[#5B4BFF]/50 bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#5B4BFF] flex items-center justify-center font-bold">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              data.firm_mode === 'MED' ? 'border-[#5B4BFF]' : 'border-[#4E5969]'
            }`}>
              {data.firm_mode === 'MED' && <div className="w-2.5 h-2.5 rounded-full bg-[#5B4BFF]" />}
            </div>
          </div>

          <h3 className="font-extrabold text-base text-[#1B1E28] mb-1">Medical College (MED)</h3>
          <p className="text-xs text-[#4E5969] mb-4">
            Optimized for MBBS/BDS/Nursing/Pharmacy institutes following NMC competency-based curriculum.
          </p>

          <ul className="text-xs text-[#4E5969] space-y-2 border-t border-[#E7EAF3] pt-3">
            <li className="flex items-center gap-2">
              <span className="text-[#00C48C] font-bold">✓</span> NMC Competency & Logbook verification
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#00C48C] font-bold">✓</span> Clinical Postings & Hospital OPD rotations
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#00C48C] font-bold">✓</span> Integrated Medical Assessment Modules
            </li>
          </ul>
        </div>

        {/* Non-Medical (NONMED) */}
        <div
          onClick={() => updateData({ firm_mode: 'NONMED' })}
          className={`p-6 rounded-[22px] border-2 cursor-pointer transition-all ${
            data.firm_mode === 'NONMED'
              ? 'border-[#5B4BFF] bg-[#5B4BFF]/5 ring-4 ring-[#5B4BFF]/10 shadow-md'
              : 'border-[#E7EAF3] hover:border-[#5B4BFF]/50 bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F36C21] flex items-center justify-center font-bold">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              data.firm_mode === 'NONMED' ? 'border-[#5B4BFF]' : 'border-[#4E5969]'
            }`}>
              {data.firm_mode === 'NONMED' && <div className="w-2.5 h-2.5 rounded-full bg-[#5B4BFF]" />}
            </div>
          </div>

          <h3 className="font-extrabold text-base text-[#1B1E28] mb-1">Non-Medical / Engineering (NONMED)</h3>
          <p className="text-xs text-[#4E5969] mb-4">
            Optimized for Engineering (B.Tech/M.Tech), MCA/BCA, Law, Business & Humanities colleges.
          </p>

          <ul className="text-xs text-[#4E5969] space-y-2 border-t border-[#E7EAF3] pt-3">
            <li className="flex items-center gap-2">
              <span className="text-[#00C48C] font-bold">✓</span> AICTE / University Semester Curriculum
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#00C48C] font-bold">✓</span> Placement Drives & Industry Internships
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#00C48C] font-bold">✓</span> Engineering Laboratories & Workshops
            </li>
          </ul>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-[#E7EAF3]">
        <button
          onClick={onBack}
          className="px-6 py-2.5 rounded-full font-bold text-sm text-[#4E5969] hover:text-[#1B1E28] hover:bg-[#F6F8FC] transition-all border border-[#E7EAF3]"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-8 py-3 rounded-full font-bold text-sm text-white bg-[#5B4BFF] hover:bg-[#4a3ae0] transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 group"
        >
          <span>Save & Continue to Role Menu Access</span>
          <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
