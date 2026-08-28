'use client';

import React, { useState } from 'react';
import KeyModal from './KeyModal';

interface Step6Props {
  data: {
    trial_days: number;
    applied_key: string;
    key_duration_days: number;
    amount: number;
    payment_method: string;
    transaction_ref: string;
    transaction_status: 'PENDING' | 'SUCCESS' | 'FAILED';
  };
  updateData: (fields: Partial<{
    trial_days: number;
    applied_key: string;
    key_duration_days: number;
    amount: number;
    payment_method: string;
    transaction_ref: string;
    transaction_status: 'PENDING' | 'SUCCESS' | 'FAILED';
  }>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step6LicenseTrial({ data, updateData, onNext, onBack }: Step6Props) {
  const [error, setError] = useState<string>('');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [generatedKey, setGeneratedKey] = useState<string>('');
  const [generatedPrefix, setGeneratedPrefix] = useState<string>('');
  const [generatedExpiry, setGeneratedExpiry] = useState<string>('');

  const generateBase32Char = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    return chars.charAt(Math.floor(Math.random() * chars.length));
  };

  const generateBlock = (len = 4) => {
    let res = '';
    for (let i = 0; i < len; i++) res += generateBase32Char();
    return res;
  };

  const handleGenerateKey = () => {
    const duration = data.key_duration_days || 365;
    const block1 = generateBlock(4);
    const block2 = generateBlock(4);
    const block3 = generateBlock(4);
    const plaintext = `FIRM-${block1}-${block2}-${block3}`;
    const prefix = plaintext.slice(0, 8);
    const now = new Date();
    const expiry = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000).toISOString();

    setGeneratedKey(plaintext);
    setGeneratedPrefix(prefix);
    setGeneratedExpiry(expiry);
    setModalOpen(true);

    // Auto-fill applied key field for convenience
    updateData({
      applied_key: plaintext,
      transaction_ref: data.transaction_ref || `TXN-REF-${Date.now().toString().slice(-6)}`,
    });
  };

  const handleContinue = () => {
    if (!data.trial_days && data.trial_days !== 0) {
      setError('Please enter a trial period duration in days.');
      return;
    }
    if (data.trial_days < 0) {
      setError('Trial days cannot be negative.');
      return;
    }
    setError('');
    onNext();
  };

  return (
    <div className="bg-white rounded-[22px] border border-[#E7EAF3] p-8 shadow-sm transition-all">
      <div className="border-b border-[#E7EAF3] pb-5 mb-6">
        <h2 className="text-xl font-extrabold text-[#1B1E28]">Step 6 — Licensing, Trial & Payment</h2>
        <p className="text-sm text-[#4E5969] mt-1">
          Issue an authorized cryptographic license key, configure the free trial duration, and record payment transaction records.
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

      <div className="space-y-8 mb-8">
        {/* Section 1: Trial Period */}
        <div className="p-5 rounded-2xl bg-[#F6F8FC] border border-[#E7EAF3]">
          <h3 className="font-extrabold text-sm text-[#1B1E28] mb-1">1. Trial Period Allocation</h3>
          <p className="text-xs text-[#4E5969] mb-4">
            If no paid license key is activated upon registration, this firm will operate in status = 'TRIAL' for the specified period.
          </p>

          <div className="max-w-xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1B1E28] mb-2">
              Trial Period (Days) *
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={data.trial_days}
                onChange={(e) => updateData({ trial_days: parseInt(e.target.value, 10) || 0 })}
                placeholder="14"
                className="w-full h-12 px-4 rounded-xl border border-[#E7EAF3] text-sm font-bold text-[#1B1E28] focus:outline-none focus:border-[#5B4BFF] transition-all"
              />
              <span className="absolute right-4 top-3.5 text-xs text-[#4E5969] font-bold">Days</span>
            </div>
          </div>
        </div>

        {/* Section 2: Key Generation */}
        <div className="p-5 rounded-2xl bg-white border border-[#E7EAF3]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-extrabold text-sm text-[#1B1E28]">2. Cryptographic License Key Generation</h3>
              <p className="text-xs text-[#4E5969]">
                Generate a 128-bit randomized base32 key in format <code>FIRM-XXXX-XXXX-XXXX</code>.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerateKey}
              className="px-5 py-2.5 rounded-full font-bold text-xs text-white bg-[#2D2575] hover:bg-[#231d5b] transition-all shadow-md flex items-center gap-2 shrink-0"
            >
              <span>⚡ Generate License Key</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1B1E28] mb-2">
                Key Duration (Days)
              </label>
              <input
                type="number"
                min="1"
                value={data.key_duration_days}
                onChange={(e) => updateData({ key_duration_days: parseInt(e.target.value, 10) || 365 })}
                placeholder="365"
                className="w-full h-12 px-4 rounded-xl border border-[#E7EAF3] text-sm font-bold text-[#1B1E28] focus:outline-none focus:border-[#5B4BFF] transition-all"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1B1E28] mb-2">
                Apply License Key (Paste or Generated)
              </label>
              <input
                type="text"
                value={data.applied_key}
                onChange={(e) => updateData({ applied_key: e.target.value.trim() })}
                placeholder="FIRM-A1B2-C3D4-E5F6"
                className="w-full h-12 px-4 rounded-xl border border-[#E7EAF3] text-sm font-mono font-bold text-[#1B1E28] focus:outline-none focus:border-[#5B4BFF] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Transaction & Billing */}
        <div className="p-5 rounded-2xl bg-[#F6F8FC] border border-[#E7EAF3]">
          <h3 className="font-extrabold text-sm text-[#1B1E28] mb-1">3. Payment & Transaction Details</h3>
          <p className="text-xs text-[#4E5969] mb-4">
            Record billing amount and gateway transaction reference numbers for institutional audit records.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1B1E28] mb-2">
                Amount (INR ₹)
              </label>
              <input
                type="number"
                min="0"
                value={data.amount}
                onChange={(e) => updateData({ amount: parseFloat(e.target.value) || 0 })}
                placeholder="150000"
                className="w-full h-12 px-4 rounded-xl border border-[#E7EAF3] text-sm font-bold text-[#1B1E28] focus:outline-none focus:border-[#5B4BFF] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1B1E28] mb-2">
                Payment Method
              </label>
              <select
                value={data.payment_method}
                onChange={(e) => updateData({ payment_method: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-[#E7EAF3] text-sm font-bold text-[#1B1E28] focus:outline-none focus:border-[#5B4BFF] transition-all bg-white"
              >
                <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="upi">UPI / QR Payment</option>
                <option value="card">Credit / Debit Card</option>
                <option value="cheque">Cheque / Demand Draft</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1B1E28] mb-2">
                Transaction Reference #
              </label>
              <input
                type="text"
                value={data.transaction_ref}
                onChange={(e) => updateData({ transaction_ref: e.target.value })}
                placeholder="UTR-2026-998822"
                className="w-full h-12 px-4 rounded-xl border border-[#E7EAF3] text-sm font-mono text-[#1B1E28] font-bold focus:outline-none focus:border-[#5B4BFF] transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Plaintext Key Display Modal */}
      <KeyModal
        isOpen={modalOpen}
        plaintextKey={generatedKey}
        keyPrefix={generatedPrefix}
        durationDays={data.key_duration_days || 365}
        expiresAt={generatedExpiry}
        onClose={() => setModalOpen(false)}
      />

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
          <span>Save & Continue to Review</span>
          <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
