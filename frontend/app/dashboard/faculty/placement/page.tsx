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
  X,
  Award
} from 'lucide-react';

export default function FacultyPlacementPage() {
  const [companies, setCompanies] = useState<PlacementCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
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
        return axios.get(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/placement-drive/list?tenant=${tenant}`);
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
        return axios.get(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/placement-drive/${company.drive_id}?tenant=${tenant}`);
      });
      const apps = res.data?.data?.applicants || res.data?.applicants || [];
      setApplicantsList(Array.isArray(apps) ? apps : []);
    } catch (e) {
      console.error('Error fetching applicants:', e);
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleUpdateStatus = async (appId: number, status: string) => {
    try {
      const tenant = getTenantSlug();
      await axios.patch(`/api/placement-drive/shortlist?tenant=${tenant}`, { application_id: appId, status }).catch(async () => {
        return axios.patch(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/placement-drive/shortlist?tenant=${tenant}`, { application_id: appId, status });
      });
      if (applicantsModalCompany) {
        handleOpenApplicants(applicantsModalCompany);
      }
      fetchDrives();
    } catch (e) {
      console.error('Error updating status:', e);
    }
  };

  const handleExportCompany = async (driveId: number, companyName: string, status?: string) => {
    try {
      const tenant = getTenantSlug();
      const url = status
        ? `/api/placement-drive/export?tenant=${tenant}&drive_id=${driveId}&status=${status}`
        : `/api/placement-drive/export?tenant=${tenant}&drive_id=${driveId}`;
      const res = await axios.get(url).catch(async () => {
        return axios.get(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/placement-drive/export?tenant=${tenant}&drive_id=${driveId}${status ? `&status=${status}` : ''}`);
      });
      const rows = res.data?.data || res.data || [];
      if (rows.length === 0) {
        alert(`No ${status || ''} applicant records found for ${companyName}.`);
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
      link.setAttribute('download', `${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_Applicants.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Export failed:', e);
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
      <Sidebar role="faculty" />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header title="Department Placement & Career Oversight" />

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#1B1E28] dark:text-white tracking-tight">
                Corporate Recruitment Drives
              </h1>
              <p className="text-xs sm:text-sm text-[#4E5969] dark:text-slate-400 mt-1">
                Monitor visiting companies, review departmental applicants, and export shortlisted cohorts.
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
                placeholder="Search company, role, package..."
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
                  role="faculty"
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
        role="faculty"
        onClose={() => setSelectedCompany(null)}
      />

      {/* Faculty Applicants Modal */}
      {applicantsModalCompany && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-[#5B4BFF]">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {applicantsModalCompany.company_name} — Applicants
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {applicantsModalCompany.role} ({applicantsModalCompany.package_ctc})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportCompany(applicantsModalCompany.drive_id, applicantsModalCompany.company_name)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Applicants
                </button>

                <button
                  onClick={() => setApplicantsModalCompany(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {loadingApplicants ? (
              <div className="py-16 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-[#5B4BFF] animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-500">Loading candidates...</p>
              </div>
            ) : applicantsList.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-[#F6F8FC] dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <Users className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No applicants registered yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                    <tr>
                      <th className="p-3.5">Student</th>
                      <th className="p-3.5">Reg No</th>
                      <th className="p-3.5">Resume Link</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {applicantsList.map((app) => (
                      <tr key={app.application_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-extrabold text-slate-900 dark:text-white">
                          {app.student_name}
                        </td>
                        <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                          {app.student_reg_no}
                        </td>
                        <td className="p-3.5">
                          {app.resume_link ? (
                            <a
                              href={app.resume_link}
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold text-[#5B4BFF] hover:underline"
                            >
                              View Resume ↗
                            </a>
                          ) : (
                            <span className="text-slate-400">No link</span>
                          )}
                        </td>
                        <td className="p-3.5 font-bold uppercase tracking-wider text-[11px]">
                          {app.status}
                        </td>
                        <td className="p-3.5 text-right space-x-1.5">
                          <button
                            onClick={() => handleUpdateStatus(app.application_id, 'Shortlisted')}
                            className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                          >
                            Shortlist
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(app.application_id, 'Selected')}
                            className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          >
                            Place
                          </button>
                        </td>
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
