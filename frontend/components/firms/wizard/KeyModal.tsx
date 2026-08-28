'use client';

import React, { useState } from 'react';

interface KeyModalProps {
  isOpen: boolean;
  plaintextKey: string;
  keyPrefix: string;
  durationDays: number;
  expiresAt: string | Date;
  onClose: () => void;
}

export default function KeyModal({
  isOpen,
  plaintextKey,
  keyPrefix,
  durationDays,
  expiresAt,
  onClose,
}: KeyModalProps) {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(plaintextKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-[22px] shadow-2xl border border-[#E7EAF3] overflow-hidden">
        {/* Header */}
        <div className="bg-[#2D2575] text-white p-6 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F36C21] flex items-center justify-center text-white text-lg font-black shadow-md shadow-orange-500/30">
              🔑
            </div>
            <div>
              <h3 className="text-lg font-black tracking-wide">License Key Generated</h3>
              <p className="text-xs text-purple-200">Cryptographically issued & stored as hash</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Critical Warning Alert */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
            <svg className="w-5 h-5 text-[#FFB020] shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-bold">CRITICAL: Save this license key now!</p>
              <p className="mt-0.5 text-amber-800">
                This is the ONLY time the plaintext key will ever be displayed. MedERP stores strictly a salted hash in PostgreSQL and cannot recover this secret key once this window is closed.
              </p>
            </div>
          </div>

          {/* Key Display Card */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1B1E28] mb-2">
              Generated License Key
            </label>
            <div className="flex items-center gap-2 p-3 bg-[#F6F8FC] rounded-xl border border-[#E7EAF3]">
              <span className="font-mono text-base font-bold text-[#1B1E28] tracking-widest flex-1 select-all break-all">
                {plaintextKey}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                  copied
                    ? 'bg-[#00C48C] text-white'
                    : 'bg-[#5B4BFF] text-white hover:bg-[#4a3ae0]'
                }`}
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    <span>Copy Key</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Key Specs */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-xl text-center text-xs">
            <div>
              <p className="text-[#4E5969] text-[10px] uppercase font-bold">Public Prefix</p>
              <p className="font-mono font-bold text-[#1B1E28]">{keyPrefix}</p>
            </div>
            <div>
              <p className="text-[#4E5969] text-[10px] uppercase font-bold">Duration</p>
              <p className="font-bold text-[#1B1E28]">{durationDays} Days</p>
            </div>
            <div>
              <p className="text-[#4E5969] text-[10px] uppercase font-bold">Expiry Date</p>
              <p className="font-bold text-[#1B1E28]">
                {new Date(expiresAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-[#F6F8FC] border-t border-[#E7EAF3] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full font-bold text-sm text-white bg-[#2D2575] hover:bg-[#221b58] transition-all shadow-md"
          >
            I have saved the key securely
          </button>
        </div>
      </div>
    </div>
  );
}
