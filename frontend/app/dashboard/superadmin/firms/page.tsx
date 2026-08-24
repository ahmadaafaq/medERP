'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

interface FirmItem {
  id: string;
  title: string;
  slug: string;
  tenant_name: string;
  level_type: 'STANDARD' | 'ENTERPRISE';
  theme_color: string;
  firm_mode: 'MED' | 'NONMED';
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  trial_days?: number;
  trial_ends_at?: string;
  created_at: string;
  license_keys?: any[];
}

export default function FirmDirectoryPage() {
  const [firms, setFirms] = useState<FirmItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    fetchFirms();
  }, []);

  const fetchFirms = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/firms');
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.data || [];
        setFirms(items);
      }
    } catch {
      setFirms([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredFirms = firms.filter(
    (f) =>
      f.title?.toLowerCase().includes(search.toLowerCase()) ||
      f.slug?.toLowerCase().includes(search.toLowerCase()) ||
      f.tenant_name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#F6F8FC]">
      <Sidebar role="owner" />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header title="Institution & Firm Directory" />

        <main className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#5B4BFF] uppercase tracking-wider mb-1">
                <Link href="/dashboard/superadmin" className="hover:underline">SuperAdmin</Link>
                <span>/</span>
                <span className="text-[#4E5969]">Firms & Institutions</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#1B1E28] tracking-tight">
                Firm Directory & Subscriptions
              </h1>
              <p className="text-sm text-[#4E5969] mt-1">
                Manage registered multi-tenant institutions, subscription tiers, trial periods, and cryptographic licenses.
              </p>
            </div>

            <Link
              href="/dashboard/superadmin/firms/register"
              className="px-6 py-3 rounded-full font-extrabold text-sm text-white bg-gradient-to-r from-[#5B4BFF] to-[#7867FF] hover:opacity-95 transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 self-start sm:self-auto"
            >
              <span>+ Register New Firm</span>
            </Link>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-[22px] border border-[#E7EAF3] p-4 mb-6 shadow-sm flex items-center gap-3">
            <svg className="w-5 h-5 text-[#4E5969] ml-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by firm title, slug or tenant organization..."
              className="w-full text-sm text-[#1B1E28] placeholder-[#4E5969] focus:outline-none font-medium"
            />
          </div>

          {/* Firms Table / Grid */}
          {loading ? (
            <div className="py-16 text-center text-[#4E5969] text-sm">
              <div className="w-8 h-8 border-3 border-[#5B4BFF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <span>Loading registered firms...</span>
            </div>
          ) : filteredFirms.length === 0 ? (
            <div className="bg-white rounded-[22px] border border-dashed border-[#E7EAF3] p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-[#F6F8FC] text-[#5B4BFF] mx-auto flex items-center justify-center text-2xl font-bold mb-4">
                🏛️
              </div>
              <h3 className="text-base font-bold text-[#1B1E28] mb-1">No Firms Found</h3>
              <p className="text-xs text-[#4E5969] max-w-sm mx-auto mb-6">
                {search ? 'No registered firms match your search term.' : 'Get started by provisioning your first institution tenant.'}
              </p>
              <Link
                href="/dashboard/superadmin/firms/register"
                className="px-6 py-2.5 rounded-full font-bold text-xs text-white bg-[#5B4BFF] hover:bg-[#4a3ae0] transition-all shadow-md inline-flex items-center gap-2"
              >
                <span>+ Register First Firm</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFirms.map((firm) => (
                <div
                  key={firm.id}
                  className="bg-white rounded-[22px] border border-[#E7EAF3] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                          firm.status === 'ACTIVE'
                            ? 'bg-[#00C48C]/15 text-[#00C48C]'
                            : firm.status === 'TRIAL'
                            ? 'bg-[#FFB020]/15 text-amber-700'
                            : 'bg-[#F04438]/15 text-[#F04438]'
                        }`}
                      >
                        {firm.status}
                      </span>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#F6F8FC] text-[#4E5969]">
                        {firm.firm_mode}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-sm shrink-0"
                        style={{ backgroundColor: firm.theme_color || '#5B4BFF' }}
                      >
                        {firm.title.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-base text-[#1B1E28] truncate">{firm.title}</h3>
                        <p className="text-xs font-mono text-[#5B4BFF] truncate">tenant_{firm.slug}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-[#4E5969] border-t border-[#E7EAF3] pt-3 mb-6">
                      <div className="flex justify-between">
                        <span>Organization:</span>
                        <span className="font-semibold text-[#1B1E28]">{firm.tenant_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tier:</span>
                        <span className="font-semibold text-[#1B1E28]">{firm.level_type}</span>
                      </div>
                      {firm.status === 'TRIAL' && firm.trial_ends_at && (
                        <div className="flex justify-between">
                          <span>Trial Ends:</span>
                          <span className="font-semibold text-amber-600">
                            {new Date(firm.trial_ends_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-[#E7EAF3]">
                    <Link
                      href={`/dashboard/superadmin/firms/register?firmId=${firm.id}`}
                      className="flex-1 py-2 text-center rounded-xl text-xs font-bold text-[#5B4BFF] bg-[#5B4BFF]/10 hover:bg-[#5B4BFF]/20 transition-all"
                    >
                      Configure
                    </Link>
                    <Link
                      href={`/dashboard/admin?tenant=${firm.slug}`}
                      className="flex-1 py-2 text-center rounded-xl text-xs font-bold text-[#1B1E28] bg-[#F6F8FC] hover:bg-[#E7EAF3] transition-all"
                    >
                      Open Tenant
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
