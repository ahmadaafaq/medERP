'use client';

import React from 'react';

interface Step3Props {
  data: {
    level_type: 'STANDARD' | 'ENTERPRISE';
    theme_color: string;
  };
  updateData: (fields: Partial<{ level_type: 'STANDARD' | 'ENTERPRISE'; theme_color: string }>) => void;
  onNext: () => void;
  onBack: () => void;
}

const PRESET_COLORS = [
  { name: 'Indigo Brand', hex: '#5B4BFF' },
  { name: 'Deep Purple', hex: '#2D2575' },
  { name: 'Royal Blue', hex: '#2563EB' },
  { name: 'Teal Green', hex: '#0D9488' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Crimson Wine', hex: '#991B1B' },
  { name: 'Amber Orange', hex: '#F36C21' },
  { name: 'Slate Dark', hex: '#334155' },
];

export default function Step3PlanTheme({ data, updateData, onNext, onBack }: Step3Props) {
  return (
    <div className="bg-white rounded-[22px] border border-[#E7EAF3] p-8 shadow-sm transition-all">
      <div className="border-b border-[#E7EAF3] pb-5 mb-6">
        <h2 className="text-xl font-extrabold text-[#1B1E28]">Step 3 — Subscription Plan & Theme Color</h2>
        <p className="text-sm text-[#4E5969] mt-1">
          Select the enterprise scale tier and custom primary theme color for this firm's user interface.
        </p>
      </div>

      <div className="space-y-8 mb-8">
        {/* Level Type Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#1B1E28] mb-3">
            Service Tier Level *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Standard */}
            <div
              onClick={() => updateData({ level_type: 'STANDARD' })}
              className={`p-5 rounded-[22px] border-2 cursor-pointer transition-all ${
                data.level_type === 'STANDARD'
                  ? 'border-[#5B4BFF] bg-[#5B4BFF]/5 ring-4 ring-[#5B4BFF]/10'
                  : 'border-[#E7EAF3] hover:border-[#5B4BFF]/50 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    data.level_type === 'STANDARD' ? 'border-[#5B4BFF]' : 'border-[#4E5969]'
                  }`}>
                    {data.level_type === 'STANDARD' && <div className="w-2 h-2 rounded-full bg-[#5B4BFF]" />}
                  </div>
                  <h3 className="font-bold text-base text-[#1B1E28]">Standard Plan</h3>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E7EAF3] text-[#4E5969]">Base</span>
              </div>
              <p className="text-xs text-[#4E5969] ml-6">
                Full core ERP suite: Student lifecycle, faculty modules, attendance, examination, timetables, and reports.
              </p>
            </div>

            {/* Enterprise */}
            <div
              onClick={() => updateData({ level_type: 'ENTERPRISE' })}
              className={`p-5 rounded-[22px] border-2 cursor-pointer transition-all ${
                data.level_type === 'ENTERPRISE'
                  ? 'border-[#5B4BFF] bg-[#5B4BFF]/5 ring-4 ring-[#5B4BFF]/10'
                  : 'border-[#E7EAF3] hover:border-[#5B4BFF]/50 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    data.level_type === 'ENTERPRISE' ? 'border-[#5B4BFF]' : 'border-[#4E5969]'
                  }`}>
                    {data.level_type === 'ENTERPRISE' && <div className="w-2 h-2 rounded-full bg-[#5B4BFF]" />}
                  </div>
                  <h3 className="font-bold text-base text-[#1B1E28]">Enterprise Plan</h3>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#F36C21]/15 text-[#F36C21]">Pro & Custom</span>
              </div>
              <p className="text-xs text-[#4E5969] ml-6">
                Advanced features: Biometric hardware integration, multi-campus clustering, custom domains, AI analytics, and dedicated priority support.
              </p>
            </div>
          </div>
        </div>

        {/* Theme Layout Color */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#1B1E28] mb-3">
            Theme Layout Color (Hex) *
          </label>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {PRESET_COLORS.map((preset) => (
              <button
                key={preset.hex}
                type="button"
                onClick={() => updateData({ theme_color: preset.hex })}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm ${
                  data.theme_color?.toLowerCase() === preset.hex.toLowerCase()
                    ? 'border-[#1B1E28] ring-2 ring-[#1B1E28]/20 bg-white'
                    : 'border-[#E7EAF3] bg-[#F6F8FC] hover:bg-white'
                }`}
              >
                <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: preset.hex }} />
                <span>{preset.name}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 max-w-xs">
            <div className="relative flex-1">
              <input
                type="text"
                value={data.theme_color}
                onChange={(e) => updateData({ theme_color: e.target.value })}
                placeholder="#5B4BFF"
                className="w-full h-12 pl-12 pr-4 rounded-xl border border-[#E7EAF3] text-sm font-mono text-[#1B1E28] font-bold focus:outline-none focus:border-[#5B4BFF] transition-all"
              />
              <div
                className="absolute left-3 top-3 w-6 h-6 rounded-lg border border-black/10 shadow-inner"
                style={{ backgroundColor: data.theme_color || '#5B4BFF' }}
              />
            </div>
            <input
              type="color"
              value={data.theme_color || '#5B4BFF'}
              onChange={(e) => updateData({ theme_color: e.target.value })}
              className="w-12 h-12 rounded-xl cursor-pointer border border-[#E7EAF3] p-1 bg-white"
            />
          </div>
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
          <span>Save & Continue to Firm Mode</span>
          <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
