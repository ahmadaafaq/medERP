'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import CompanyCard, { PlacementCompany } from '../../../../components/placement/CompanyCard';
import CompanyDetailDrawer from '../../../../components/placement/CompanyDetailDrawer';
import StudentOffersCard from '../../../../components/placement/StudentOffersCard';
import { 
  Building2, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Send,
  X,
  Sparkles
} from 'lucide-react';

export default function StudentPlacementPage() {
  const [companies, setCompanies] = useState<PlacementCompany[]>([]);
  const [offersData, setOffersData] = useState<{ placed_count: number; offers: any[] }>({
    placed_count: 0,
    offers: [],
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [selectedCompany, setSelectedCompany] = useState<PlacementCompany | null>(null);

  // Apply Modal
  const [applyingCompany, setApplyingCompany] = useState<PlacementCompany | null>(null);
  const [resumeLink, setResumeLink] = useState('https://github.com/aafreen-khan/resume');
  const [coverNote, setCoverNote] = useState('');
  const [submittingApply, setSubmittingApply] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const getTenantSlug = () => {
    if (typeof window === 'undefined') return 'srms-cet-bareilly';
    return (
      localStorage.getItem('tenantSlug') ||
      localStorage.getItem('selectedTenant') ||
      localStorage.getItem('colg_slug') ||
      'srms-cet-bareilly'
    ).replace(/^tenant_/, '');
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const tenant = getTenantSlug();
      const [drivesRes, offersRes] = await Promise.all([
        axios.get(`/api/placement-drive/list?tenant=${tenant}`).catch(async () => {
          return axios.get(`http://localhost:3001/api/v1/placement-drive/list?tenant=${tenant}`);
        }),
        axios.get(`/api/placement-drive/student/offers?tenant=${tenant}`).catch(async () => {
          return axios.get(`http://localhost:3001/api/v1/placement-drive/student/offers?tenant=${tenant}`);
        }),
      ]);

      const drivesList = drivesRes.data?.data?.data || drivesRes.data?.data || drivesRes.data || [];
      setCompanies(Array.isArray(drivesList) ? drivesList : []);
      const offersObj = offersRes.data?.data || offersRes.data || {};
      setOffersData({
        placed_count: offersObj.companies_placed_count || 0,
        offers: offersObj.offers || [],
      });
    } catch (e) {
      console.error('Error loading placement data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingCompany) return;

    setSubmittingApply(true);
    setApplyError(null);

    try {
      const tenant = getTenantSlug();
      const payload = {
        drive_id: applyingCompany.drive_id,
        resume_link: resumeLink,
        cover_note: coverNote,
      };

      await axios.post(`/api/placement-drive/apply?tenant=${tenant}`, payload).catch(async () => {
        return axios.post(`http://localhost:3001/api/v1/placement-drive/apply?tenant=${tenant}`, payload);
      });

      setApplySuccess(true);
      setTimeout(() => {
        setApplySuccess(false);
        setApplyingCompany(null);
        loadData();
      }, 1500);
    } catch (err: any) {
      setApplyError(err?.response?.data?.message || err?.message || 'Failed to submit application.');
    } finally {
      setSubmittingApply(false);
    }
  };

  const filteredCompanies = companies.filter((c) => {
    const matchSearch =
      c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.role?.toLowerCase().includes(search.toLowerCase()) ||
      c.package_ctc?.toLowerCase().includes(search.toLowerCase());

    const matchBranch =
      branchFilter === 'ALL' ||
      (Array.isArray(c.eligible_branches)
        ? c.eligible_branches.includes(branchFilter)
        : String(c.eligible_branches).includes(branchFilter));

    return matchSearch && matchBranch;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-[#F6F8FC] dark:bg-slate-900">
      <Sidebar role="student" />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header title="Training & Campus Placement Portal" />

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Student Job Offers & Outcomes Manager */}
          <StudentOffersCard
            placedCount={offersData.placed_count}
            offers={offersData.offers}
            onRefresh={() => loadData()}
          />

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#1B1E28] dark:text-white tracking-tight">
                Visiting Corporate Partners & Opportunities
              </h2>
              <p className="text-xs sm:text-sm text-[#4E5969] dark:text-slate-400 mt-1">
                Explore eligible campus drives, review technical job specs, and submit applications.
              </p>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-[22px] border border-[#E7EAF3] dark:border-slate-700 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search visiting company, role, package..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              />
            </div>

            <div>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              >
                <option value="ALL">All Branches</option>
                <option value="CSE">Computer Science (CSE)</option>
                <option value="IT">Information Tech (IT)</option>
                <option value="ECE">Electronics (ECE)</option>
                <option value="ME">Mechanical (ME)</option>
                <option value="EE">Electrical (EE)</option>
                <option value="CE">Civil (CE)</option>
              </select>
            </div>
          </div>

          {/* Company Card Grid */}
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#5B4BFF] animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Loading campus drives...</p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="p-16 text-center rounded-[28px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
              <Building2 className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                No active placement drives for selected filters
              </h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCompanies.map((comp) => (
                <CompanyCard
                  key={comp.drive_id}
                  company={comp}
                  role="student"
                  onViewDetails={(c) => setSelectedCompany(c)}
                  onApply={(c) => {
                    setApplyingCompany(c);
                    setApplyError(null);
                  }}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* View Details Drawer */}
      <CompanyDetailDrawer
        company={selectedCompany}
        role="student"
        onClose={() => setSelectedCompany(null)}
        onApply={(c) => {
          setApplyingCompany(c);
          setApplyError(null);
        }}
      />

      {/* Apply Modal */}
      {applyingCompany && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2D2575] to-[#5B4BFF] text-white font-black text-lg flex items-center justify-center shrink-0">
                  {applyingCompany.company_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Apply: {applyingCompany.company_name}
                  </h3>
                  <p className="text-xs text-[#5B4BFF] font-semibold">
                    {applyingCompany.role} ({applyingCompany.package_ctc})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setApplyingCompany(null)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {applySuccess ? (
              <div className="py-8 text-center space-y-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-12 h-12 mx-auto animate-bounce" />
                <h4 className="font-extrabold text-base">Application Submitted!</h4>
                <p className="text-xs text-slate-500">
                  Good luck! You can track shortlist status in your portal.
                </p>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-4">
                {applyError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{applyError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Online Resume Link (Drive, GitHub, Portfolio)
                  </label>
                  <input
                    type="url"
                    required
                    value={resumeLink}
                    onChange={(e) => setResumeLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Candidate Statement / Key Skills Note
                  </label>
                  <textarea
                    rows={3}
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    placeholder="Highlight relevant projects, programming skills, or certifications..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setApplyingCompany(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submittingApply}
                    className="px-5 py-2 rounded-xl text-xs font-black bg-[#5B4BFF] hover:bg-[#4a3ae0] text-white shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {submittingApply ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Confirm & Apply
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
