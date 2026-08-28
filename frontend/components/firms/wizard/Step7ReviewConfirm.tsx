'use client';

import React from 'react';
import { RoleType } from './Step5RoleMenuAccess';

interface Step7Props {
  data: {
    logo_url: string;
    cover_url: string;
    banner_url: string;
    title: string;
    slug: string;
    tenant_name: string;
    domain: string;
    level_type: 'STANDARD' | 'ENTERPRISE';
    theme_color: string;
    firm_mode: 'MED' | 'NONMED';
    trial_days: number;
    applied_key: string;
    key_duration_days: number;
    amount: number;
    payment_method: string;
    transaction_ref: string;
  };
  rolePermissions: Record<RoleType, string[]>;
  onSubmit: () => void;
  onBack: () => void;
  submitting: boolean;
  error?: string;
}

export default function Step7ReviewConfirm({
  data,
  rolePermissions,
  onSubmit,
  onBack,
  submitting,
  error,
}: Step7Props) {
  const totalMenus = Object.values(rolePermissions).reduce((acc, curr) => acc + curr.length, 0);

  return (
    <div className="bg-white rounded-[22px] border border-[#E7EAF3] p-8 shadow-sm transition-all">
      <div className="border-b border-[#E7EAF3] pb-5 mb-6">
        <h2 className="text-xl font-extrabold text-[#1B1E28]">Step 7 — Review & Confirm Registration</h2>
        <p className="text-sm text-[#4E5969] mt-1">
          Review all configured institution assets, security credentials, menu permissions, and licensing parameters before provisioning.
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

      <div className="space-y-6 mb-8">
        {/* Card 1: Visual Branding & Identity */}
        <div className="p-6 rounded-2xl bg-[#F6F8FC] border border-[#E7EAF3]">
          <div className="flex items-center justify-between border-b border-[#E7EAF3] pb-3 mb-4">
            <h3 className="font-extrabold text-sm text-[#1B1E28]">1. Institution Identity & Branding</h3>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#5B4BFF]/10 text-[#5B4BFF]">
              Mode: {data.firm_mode}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-white border border-[#E7EAF3] flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
              {data.logo_url ? (
                <img src={data.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <span className="font-black text-lg text-[#5B4BFF]">M</span>
              )}
            </div>
            <div>
              <h4 className="text-base font-black text-[#1B1E28]">{data.title || 'Untitled Firm'}</h4>
              <p className="text-xs font-mono text-[#5B4BFF] font-bold">Slug: tenant_{data.slug || 'slug'}</p>
              <p className="text-xs text-[#4E5969]">Organization: {data.tenant_name || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white rounded-xl border border-[#E7EAF3]">
              <p className="text-[#4E5969] text-[10px] font-bold uppercase">Plan Tier</p>
              <p className="font-extrabold text-[#1B1E28] mt-0.5">{data.level_type}</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#E7EAF3]">
              <p className="text-[#4E5969] text-[10px] font-bold uppercase">Custom Domain</p>
              <p className="font-mono font-bold text-[#1B1E28] mt-0.5 truncate">{data.domain || 'None'}</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#E7EAF3]">
              <p className="text-[#4E5969] text-[10px] font-bold uppercase">Theme Color</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: data.theme_color || '#5B4BFF' }} />
                <p className="font-mono font-bold text-[#1B1E28]">{data.theme_color}</p>
              </div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#E7EAF3]">
              <p className="text-[#4E5969] text-[10px] font-bold uppercase">Curriculum</p>
              <p className="font-extrabold text-[#1B1E28] mt-0.5">
                {data.firm_mode === 'MED' ? 'Medical / NMC' : 'Non-Medical / AICTE'}
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Role Menu Access Permissions Summary */}
        <div className="p-6 rounded-2xl bg-[#F6F8FC] border border-[#E7EAF3]">
          <div className="flex items-center justify-between border-b border-[#E7EAF3] pb-3 mb-4">
            <h3 className="font-extrabold text-sm text-[#1B1E28]">2. Role Menu Access Matrix</h3>
            <span className="text-xs font-bold text-[#00C48C]">{totalMenus} Total Menus Enabled</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
            {(['STUDENT', 'FACULTY', 'ADMIN', 'CLERK', 'WARDEN', 'SUPERADMIN'] as RoleType[]).map((r) => (
              <div key={r} className="p-2.5 bg-white rounded-xl border border-[#E7EAF3]">
                <p className="text-[10px] font-bold uppercase text-[#4E5969]">{r}</p>
                <p className="text-sm font-black text-[#5B4BFF] mt-0.5">
                  {rolePermissions[r]?.length || 0}
                </p>
                <p className="text-[10px] text-[#4E5969]">menus</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Licensing & Billing Summary */}
        <div className="p-6 rounded-2xl bg-[#F6F8FC] border border-[#E7EAF3]">
          <div className="flex items-center justify-between border-b border-[#E7EAF3] pb-3 mb-4">
            <h3 className="font-extrabold text-sm text-[#1B1E28]">3. Licensing, Status & Billing</h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                data.applied_key
                  ? 'bg-[#00C48C]/15 text-[#00C48C]'
                  : 'bg-[#FFB020]/15 text-amber-700'
              }`}
            >
              Initial Status: {data.applied_key ? 'ACTIVE' : 'TRIAL'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-white rounded-xl border border-[#E7EAF3]">
              <p className="text-[#4E5969] text-[10px] font-bold uppercase">Trial Duration</p>
              <p className="font-extrabold text-[#1B1E28] mt-0.5">{data.trial_days} Days</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#E7EAF3]">
              <p className="text-[#4E5969] text-[10px] font-bold uppercase">Applied License Key</p>
              <p className="font-mono font-bold text-[#1B1E28] mt-0.5 truncate">
                {data.applied_key ? `${data.applied_key.slice(0, 8)}...` : 'None (Trial Mode)'}
              </p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#E7EAF3]">
              <p className="text-[#4E5969] text-[10px] font-bold uppercase">Recorded Billing Amount</p>
              <p className="font-mono font-bold text-[#00C48C] mt-0.5">
                ₹{Number(data.amount || 0).toLocaleString('en-IN')} ({data.payment_method})
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t border-[#E7EAF3]">
        <button
          onClick={onBack}
          disabled={submitting}
          className="px-6 py-2.5 rounded-full font-bold text-sm text-[#4E5969] hover:text-[#1B1E28] hover:bg-[#F6F8FC] transition-all border border-[#E7EAF3]"
        >
          Back to Licensing
        </button>

        <button
          onClick={onSubmit}
          disabled={submitting}
          className="px-10 py-3.5 rounded-full font-extrabold text-sm text-white bg-gradient-to-r from-[#5B4BFF] to-[#7867FF] hover:opacity-95 transition-all shadow-xl shadow-indigo-500/30 flex items-center gap-2 group disabled:opacity-50 cursor-pointer"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Provisioning Firm & Permissions...</span>
            </>
          ) : (
            <>
              <span>⚡ Confirm & Register Firm</span>
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
