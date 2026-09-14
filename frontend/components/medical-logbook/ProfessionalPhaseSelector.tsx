'use client';

import React from 'react';

export interface ProfessionalPhaseItem {
  id: string;
  name: string;
  code?: string;
  phase_order?: number;
  description?: string;
  subjectsSummary?: string;
}

interface ProfessionalPhaseSelectorProps {
  professionals: ProfessionalPhaseItem[];
  selectedId: string;
  onSelect: (id: string, name: string) => void;
  countsByProf?: { [profId: string]: { total: number; pending: number } };
}

export default function ProfessionalPhaseSelector({
  professionals,
  selectedId,
  onSelect,
  countsByProf = {},
}: ProfessionalPhaseSelectorProps) {
  const defaultPhases: ProfessionalPhaseItem[] = [
    {
      id: 'mbbs-prof-1',
      name: '1st Professional MBBS',
      phase_order: 1,
      description: 'Phase I (Pre-Clinical)',
      subjectsSummary: 'Anatomy • Physiology • Biochemistry',
    },
    {
      id: 'mbbs-prof-2',
      name: '2nd Professional MBBS',
      phase_order: 2,
      description: 'Phase II (Para-Clinical)',
      subjectsSummary: 'Pathology • Microbiology • Pharmacology',
    },
    {
      id: 'mbbs-prof-3',
      name: '3rd Professional MBBS (Part I)',
      phase_order: 3,
      description: 'Phase III Part 1 (Clinical Basics)',
      subjectsSummary: 'Community Medicine • Forensic Medicine • Ophthalmology • ENT',
    },
    {
      id: 'mbbs-prof-4',
      name: '3rd Professional MBBS (Part II)',
      phase_order: 4,
      description: 'Phase III Part 2 (Final Clinical)',
      subjectsSummary: 'General Medicine • Surgery • OBG • Pediatrics • Orthopedics',
    },
  ];

  const items = professionals && professionals.length > 0 ? professionals : defaultPhases;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#5B4BFF] animate-ping" />
          <h3 className="text-xs font-black uppercase tracking-wider text-[#1B1E28] dark:text-slate-100">
            Select MBBS Professional Phase
          </h3>
        </div>
        <span className="text-[11px] font-semibold text-[#4E5969] dark:text-slate-400">
          Curriculum & Logbook Scoped by Professional
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {items.map((p, idx) => {
          const isSelected = p.id === selectedId || (idx === 0 && !selectedId);
          const meta = defaultPhases[idx] || {};
          const counts = countsByProf[p.id] || { total: 0, pending: 0 };

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id, p.name)}
              className={`text-left p-4 rounded-[22px] transition-all relative overflow-hidden border ${
                isSelected
                  ? 'bg-gradient-to-br from-[#2D2575] to-[#5B4BFF] text-white shadow-lg shadow-[#5B4BFF]/25 border-transparent scale-[1.01]'
                  : 'bg-white dark:bg-slate-900 border-[#E7EAF3] dark:border-slate-800 text-[#1B1E28] dark:text-slate-100 hover:border-[#5B4BFF]/50 hover:shadow-sm'
              }`}
            >
              {/* Badge for Order */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-white/20 text-white backdrop-blur-sm'
                      : 'bg-[#5B4BFF]/10 text-[#5B4BFF] dark:bg-[#5B4BFF]/20'
                  }`}
                >
                  Prof {p.phase_order || idx + 1}
                </span>

                {isSelected && (
                  <span className="flex items-center gap-1 text-[10px] font-bold bg-[#F36C21] text-white px-2 py-0.5 rounded-full shadow-sm">
                    Active Phase
                  </span>
                )}
              </div>

              <h4 className={`text-sm font-bold line-clamp-1 ${isSelected ? 'text-white' : 'text-[#1B1E28] dark:text-slate-100'}`}>
                {p.name}
              </h4>

              <p className={`text-[11px] mt-0.5 line-clamp-1 ${isSelected ? 'text-white/80' : 'text-[#4E5969] dark:text-slate-400'}`}>
                {p.description || meta.description || 'Clinical & Academic Log'}
              </p>

              <div className={`mt-3 pt-2 text-[10px] border-t font-medium ${
                isSelected ? 'border-white/15 text-white/90' : 'border-slate-100 dark:border-slate-800 text-slate-500'
              }`}>
                {meta.subjectsSummary || 'Clinical departments & competencies'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
