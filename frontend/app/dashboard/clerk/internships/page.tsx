'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import ProgramCard, { InternshipProgram } from '../../../../components/internships/ProgramCard';
import ApplicantReviewModal from '../../../../components/internships/ApplicantReviewModal';
import { 
  GraduationCap, 
  Search, 
  Loader2 
} from 'lucide-react';

export default function ClerkInternshipsPage() {
  const [programs, setPrograms] = useState<InternshipProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [reviewProgram, setReviewProgram] = useState<InternshipProgram | null>(null);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const tenantSlug = typeof window !== 'undefined'
        ? (localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly').replace(/^tenant_/, '').replace(/^tenant-/, '')
        : 'srms-cet-bareilly';

      const res = await axios.get('/api/internships/list', {
        headers: {
          'x-tenant-id': `tenant_${tenantSlug}`,
          'x-tenant': tenantSlug,
        },
      });
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setPrograms(list);
    } catch (e) {
      console.error('Error fetching clerk internships:', e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = programs.filter((p) => {
    return (
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="flex h-screen overflow-hidden bg-[#F6F8FC] dark:bg-slate-900">
      <Sidebar role="clerk" />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header title="Internship & Certification Registry" />

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#1B1E28] dark:text-white tracking-tight">
                Internship & Certification Registry
              </h1>
              <p className="text-xs sm:text-sm text-[#4E5969] dark:text-slate-400 mt-1">
                Verify enrolled student rosters, fee payments, and completion certification records.
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-[22px] border border-[#E7EAF3] dark:border-slate-700 shadow-sm">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search internship program..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              />
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#5B4BFF] animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Loading registry...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center rounded-[28px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
              <GraduationCap className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                No internship programs found
              </h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((prog) => (
                <ProgramCard
                  key={prog.id}
                  program={prog}
                  role="clerk"
                  onViewApplicants={(p) => setReviewProgram(p)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {reviewProgram && (
        <ApplicantReviewModal
          program={reviewProgram}
          onClose={() => setReviewProgram(null)}
          onRefresh={() => fetchPrograms()}
        />
      )}
    </div>
  );
}
