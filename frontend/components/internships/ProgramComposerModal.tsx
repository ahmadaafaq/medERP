'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { X, GraduationCap, DollarSign, Clock, Users, Calendar, AlertCircle, Loader2, Sparkles } from 'lucide-react';

interface ProgramComposerModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProgramComposerModal({ onClose, onSuccess }: ProgramComposerModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'IT' | 'MANAGEMENT' | 'PARAMEDICAL'>('IT');
  const [duration, setDuration] = useState('3_MONTH');
  const [feeType, setFeeType] = useState<'FREE' | 'PAID'>('FREE');
  const [feeAmount, setFeeAmount] = useState<number>(2500);
  const [seats, setSeats] = useState<number>(50);
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a program title.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        title,
        category,
        duration,
        fee_type: feeType,
        fee_amount: feeType === 'PAID' ? Number(feeAmount) : 0,
        seats_available: Number(seats),
        application_deadline: deadline,
        description,
      };

      const tenantSlug = typeof window !== 'undefined'
        ? (localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly').replace(/^tenant_/, '').replace(/^tenant-/, '')
        : 'srms-cet-bareilly';

      await axios.post('/api/internships/create', payload, {
        headers: {
          'x-tenant-id': `tenant_${tenantSlug}`,
          'x-tenant': tenantSlug,
        },
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to publish internship program.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#5B4BFF]/10 text-[#5B4BFF] dark:bg-[#5B4BFF]/20 dark:text-[#7867FF]">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Publish Internship / Workshop Program
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create IT, Management, or Para-Medical certification tracks for students.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Program Title / Workshop Name
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              placeholder="e.g. Full-Stack Cloud & AI Engineering Track"
            />
          </div>

          {/* Category & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Category Domain
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              >
                <option value="IT">IT & Computer Sciences</option>
                <option value="MANAGEMENT">Management & Analytics</option>
                <option value="PARAMEDICAL">Para-Medical & Clinical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              >
                <option value="1_MONTH">1 Month</option>
                <option value="2_MONTH">2 Months</option>
                <option value="3_MONTH">3 Months</option>
                <option value="6_MONTH">6 Months</option>
                <option value="1_YEAR">1 Year</option>
              </select>
            </div>
          </div>

          {/* Fee Type & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Fee Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFeeType('FREE')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                    feeType === 'FREE'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-[#F6F8FC] dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  100% Free
                </button>

                <button
                  type="button"
                  onClick={() => setFeeType('PAID')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                    feeType === 'PAID'
                      ? 'bg-[#5B4BFF] text-white border-[#5B4BFF] shadow-sm'
                      : 'bg-[#F6F8FC] dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Paid Enrollment
                </button>
              </div>
            </div>

            {feeType === 'PAID' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Fee Amount (₹ INR)
                </label>
                <input
                  type="number"
                  min="100"
                  required
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                />
              </div>
            )}
          </div>

          {/* Seats & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Max Available Seats
              </label>
              <input
                type="number"
                min="5"
                max="500"
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Application Deadline
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Curriculum & Program Details
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              placeholder="Outline project milestones, mentor expectations, and certification requirements..."
            />
          </div>

          {/* Submit */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-xs font-black bg-[#5B4BFF] hover:bg-[#4a3ae0] text-white shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                'Publish Program'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
