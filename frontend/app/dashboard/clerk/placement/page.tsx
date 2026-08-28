'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import CompanyCard, { PlacementCompany } from '../../../../components/placement/CompanyCard';
import CompanyDetailDrawer from '../../../../components/placement/CompanyDetailDrawer';
import { 
  Building2, 
  Download, 
  Search, 
  Users, 
  Loader2, 
  X 
} from 'lucide-react';

export default function ClerkPlacementPage() {
  const [companies, setCompanies] = useState<PlacementCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<PlacementCompany | null>(null);

  // Applicants view
  const [applicantsModalCompany, setApplicantsModalCompany] = useState<PlacementCompany | null>(null);
  const [applicantsList, setApplicantsList] = useState<any[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

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
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    setLoading(true);
    try {
      const tenant = getTenantSlug();
      const res = await axios.get(`/api/placement-drive/list?tenant=${tenant}`).catch(async () => {
        return axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api/v1'}/placement-drive/list?tenant=${tenant}`);
      });
      const list = res.data?.data?.data || res.data?.data || res.data || [];
      setCompanies(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Error fetching placement drives:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenApplicants = async (company: PlacementCompany) => {
    setApplicantsModalCompany(company);
    setLoadingApplicants(true);
    try {
      const tenant = getTenantSlug();
      const res = await axios.get(`/api/placement-drive/${company.drive_id}?tenant=${tenant}`).catch(async () => {
        return axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api/v1'}/placement-drive/${company.drive_id}?tenant=${tenant}`);
      });
      const apps = res.data?.data?.applicants || res.data?.applicants || [];
      setApplicantsList(Array.isArray(apps) ? apps : []);
    } catch (e) {
      console.error('Error fetching applicants:', e);
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleExportAll = async () => {
    try {
      const tenant = getTenantSlug();
      const res = await axios.get(`/api/placement-drive/export?tenant=${tenant}`).catch(async () => {
        return axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api/v1'}/placement-drive/export?tenant=${tenant}`);
      });
      const rows = res.data?.data || res.data || [];
      if (rows.length === 0) {
        alert('No placement records to export.');
        return;
      }
      const headers = ['Student Name', 'Reg No', 'Course', 'Batch', 'Company', 'Role', 'Package', 'Status', 'Applied Date'];
      const csvContent = 'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((r: any) => [
          `"${r.student_name || ''}"`,
          `"${r.registration_no || ''}"`,
          `"${r.course_cd || ''}"`,
          `"${r.batch_cd || ''}"`,
          `"${r.company_name || ''}"`,
          `"${r.role || ''}"`,
          `"${r.package_ctc || ''}"`,
          `"${r.status || ''}"`,
          `"${r.applied_at || ''}"`,
        ].join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Clerk_Placement_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  const filteredCompanies = companies.filter((c) => {
    return (
      c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.role?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="flex h-screen overflow-hidden bg-[#F6F8FC] dark:bg-slate-900">
      <Sidebar role="clerk" />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header title="Placement Records & Verification Desk" />

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#1B1E28] dark:text-white tracking-tight">
                Corporate Placement Verification
              </h1>
              <p className="text-xs sm:text-sm text-[#4E5969] dark:text-slate-400 mt-1">
                View enrolled placement companies, applicant rosters, and export official reports.
              </p>
            </div>

            <button
              onClick={handleExportAll}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              Export Master Roster
            </button>
          </div>

          {/* Search */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-[22px] border border-[#E7EAF3] dark:border-slate-700 shadow-sm">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search company or job designation..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              />
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#5B4BFF] animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Loading placement board...</p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="p-16 text-center rounded-[28px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
              <Building2 className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                No active placement drives found
              </h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCompanies.map((comp) => (
                <CompanyCard
                  key={comp.drive_id}
                  company={comp}
                  role="clerk"
                  onViewDetails={(c) => setSelectedCompany(c)}
                  onManageApplicants={(c) => handleOpenApplicants(c)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <CompanyDetailDrawer
        company={selectedCompany}
        role="clerk"
        onClose={() => setSelectedCompany(null)}
      />

      {/* Clerk Applicants Modal */}
      {applicantsModalCompany && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {applicantsModalCompany.company_name} — Candidate Roster
              </h2>
              <button
                onClick={() => setApplicantsModalCompany(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingApplicants ? (
              <div className="py-16 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-[#5B4BFF] animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-500">Loading candidates...</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                    <tr>
                      <th className="p-3.5">Student</th>
                      <th className="p-3.5">Reg No</th>
                      <th className="p-3.5">Applied Date</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {applicantsList.map((app) => (
                      <tr key={app.application_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">{app.student_name}</td>
                        <td className="p-3.5 font-mono">{app.student_reg_no}</td>
                        <td className="p-3.5">{new Date(app.applied_at).toLocaleDateString('en-IN')}</td>
                        <td className="p-3.5 font-bold">{app.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
