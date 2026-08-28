'use client';

import React, { useState } from 'react';

interface Step2Props {
  data: {
    title: string;
    slug: string;
    tenant_name: string;
    domain: string;
  };
  updateData: (fields: Partial<{ title: string; slug: string; tenant_name: string; domain: string }>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2Identity({ data, updateData, onNext, onBack }: Step2Props) {
  const [error, setError] = useState<string>('');

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const updates: any = { title: val };
    // Auto suggest slug if slug is empty or was derived from previous title
    if (!data.slug || data.slug === generateSlug(data.title)) {
      updates.slug = generateSlug(val);
    }
    if (!data.tenant_name || data.tenant_name === data.title) {
      updates.tenant_name = val;
    }
    updateData(updates);
  };

  const handleContinue = () => {
    if (!data.title.trim()) {
      setError('Firm Title is required.');
      return;
    }
    if (!data.slug.trim()) {
      setError('Slug Name is required.');
      return;
    }
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(data.slug)) {
      setError('Slug must contain only lowercase alphanumeric characters and hyphens (e.g. srms-cet).');
      return;
    }
    if (!data.tenant_name.trim()) {
      setError('Tenant Name is required.');
      return;
    }
    if (data.domain?.trim()) {
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
      if (!domainRegex.test(data.domain.trim())) {
        setError('Please enter a valid domain format (e.g. erp.srms.ac.in).');
        return;
      }
    }
    setError('');
    onNext();
  };

  return (
    <div className="bg-white rounded-[22px] border border-[#E7EAF3] p-8 shadow-sm transition-all">
      <div className="border-b border-[#E7EAF3] pb-5 mb-6">
        <h2 className="text-xl font-extrabold text-[#1B1E28]">Step 2 — Institution Identity</h2>
        <p className="text-sm text-[#4E5969] mt-1">
          Configure the official identification names, URL slug routing, and optional custom domain.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-[#F04438] text-sm flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Firm Title */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#1B1E28] mb-2">
            Firm Title *
          </label>
          <input
            type="text"
            value={data.title}
            onChange={handleTitleChange}
            placeholder="e.g. Shri Ram Murti Smarak College of Engineering"
            className="w-full h-12 px-4 rounded-xl border border-[#E7EAF3] text-sm text-[#1B1E28] focus:outline-none focus:border-[#5B4BFF] focus:ring-4 focus:ring-[#5B4BFF]/10 transition-all font-medium"
          />
          <p className="text-[11px] text-[#4E5969] mt-1.5">Official display title shown on dashboards and certificates.</p>
        </div>

        {/* Slug */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#1B1E28] mb-2">
            Slug Identifier (URL-Safe) *
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-xs text-[#4E5969] font-mono">/tenant/</span>
            <input
              type="text"
              value={data.slug}
              onChange={(e) => updateData({ slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              placeholder="srms-cet"
              className="w-full h-12 pl-20 pr-4 rounded-xl border border-[#E7EAF3] text-sm font-mono text-[#1B1E28] focus:outline-none focus:border-[#5B4BFF] focus:ring-4 focus:ring-[#5B4BFF]/10 transition-all font-semibold"
            />
          </div>
          <p className="text-[11px] text-[#4E5969] mt-1.5">Used for schema isolation (`tenant_{data.slug || 'slug'}`) and subpath routing.</p>
        </div>

        {/* Tenant Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#1B1E28] mb-2">
            Tenant Organization Name *
          </label>
          <input
            type="text"
            value={data.tenant_name}
            onChange={(e) => updateData({ tenant_name: e.target.value })}
            placeholder="SRMS Trust Bareilly"
            className="w-full h-12 px-4 rounded-xl border border-[#E7EAF3] text-sm text-[#1B1E28] focus:outline-none focus:border-[#5B4BFF] focus:ring-4 focus:ring-[#5B4BFF]/10 transition-all font-medium"
          />
          <p className="text-[11px] text-[#4E5969] mt-1.5">Parent entity or trust name governing this institution.</p>
        </div>

        {/* Custom Domain */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#1B1E28] mb-2">
            Custom Domain (Optional)
          </label>
          <input
            type="text"
            value={data.domain}
            onChange={(e) => updateData({ domain: e.target.value.toLowerCase() })}
            placeholder="portal.srms.ac.in"
            className="w-full h-12 px-4 rounded-xl border border-[#E7EAF3] text-sm font-mono text-[#1B1E28] focus:outline-none focus:border-[#5B4BFF] focus:ring-4 focus:ring-[#5B4BFF]/10 transition-all font-medium"
          />
          <p className="text-[11px] text-[#4E5969] mt-1.5">Optional white-label domain mapped via CNAME DNS record.</p>
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
          onClick={handleContinue}
          className="px-8 py-3 rounded-full font-bold text-sm text-white bg-[#5B4BFF] hover:bg-[#4a3ae0] transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 group"
        >
          <span>Save & Continue to Plan & Theme</span>
          <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
