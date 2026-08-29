'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import CompanyCard, { PlacementCompany } from '../../../../components/placement/CompanyCard';
import CompanyDetailDrawer from '../../../../components/placement/CompanyDetailDrawer';
import ImportDrivesModal from '../../../../components/placement/ImportDrivesModal';
import { 
  Building2, 
  UploadCloud, 
  Download, 
  FileSpreadsheet,
  Filter, 
  Search, 
  Users, 
  Award, 
  Sparkles,
  Loader2,
  CheckCircle2,
  Briefcase,
  Plus,
  X
} from 'lucide-react';

export default function AdminPlacementPage() {
  const [companies, setCompanies] = useState<PlacementCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [batchFilter, setBatchFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [selectedCompany, setSelectedCompany] = useState<PlacementCompany | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creatingDrive, setCreatingDrive] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  const [createFormData, setCreateFormData] = useState({
    company_name: '',
    role: '',
    package_ctc: '',
    eligibility_course_cd: '13',
    eligibility_branch_cd: 'CSE',
    eligibility_batch_cd: '2025',
    min_score_required: 60,
    drive_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    deadline_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: '',
  });

  const [applicantsModalCompany, setApplicantsModalCompany] = useState<PlacementCompany | null>(null);
  const [applicantsList, setApplicantsList] = useState<any[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  const getTenantSlug = () => {
    if (typeof window === 'undefined') return 'srms-cet-bareilly';
    const slug =
      localStorage.getItem('tenantSlug') ||
      localStorage.getItem('selectedTenant') ||
      localStorage.getItem('colg_slug') ||
      'srms-cet-bareilly';
    return (slug || 'srms-cet-bareilly').replace(/^tenant_/, '').replace(/^tenant-/, '');
  };

  const getAuthHeaders = () => {
    if (typeof window === 'undefined') return {};
    const tenant = getTenantSlug();
    const token = localStorage.getItem('token') || localStorage.getItem('access_token') || localStorage.getItem('accessToken');
    const headers: Record<string, string> = {
      'x-tenant-id': tenant,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    setLoading(true);
    try {
      const tenant = getTenantSlug();
      const headers = getAuthHeaders();
      const res = await axios.get(`/api/placement-drive/list?tenant=${tenant}`, { headers }).catch(async () => {
        return axios.get(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/placement-drive/list?tenant=${tenant}`, { headers });
      });
      const dataObj = res.data?.data || res.data;
      const list = Array.isArray(dataObj?.data) ? dataObj.data : Array.isArray(dataObj) ? dataObj : [];
      setCompanies(list);
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
      const headers = getAuthHeaders();
      const res = await axios.get(`/api/placement-drive/${company.drive_id}?tenant=${tenant}`, { headers }).catch(async () => {
        return axios.get(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/placement-drive/${company.drive_id}?tenant=${tenant}`, { headers });
      });
      const dataObj = res.data?.data || res.data;
      const apps = Array.isArray(dataObj?.applicants) ? dataObj.applicants : Array.isArray(dataObj) ? dataObj : [];
      setApplicantsList(apps);
    } catch (e) {
      console.error('Error fetching applicants:', e);
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleUpdateStatus = async (appId: string, newStatus: string) => {
    try {
      const tenant = getTenantSlug();
      const headers = getAuthHeaders();
      await axios.patch(`/api/placement-drive/applicant/${appId}/status?tenant=${tenant}`, { status: newStatus }, { headers }).catch(async () => {
        return axios.patch(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/placement-drive/applicant/${appId}/status?tenant=${tenant}`, { status: newStatus }, { headers });
      });
      setApplicantsList((prev) =>
        prev.map((a) => (a.application_id === appId ? { ...a, status: newStatus } : a))
      );
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleCreateDriveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.company_name.trim() || !createFormData.role.trim()) {
      setCreateError('Company Name and Role are required.');
      return;
    }

    setCreatingDrive(true);
    setCreateError(null);

    try {
      const tenant = getTenantSlug();
      const headers = getAuthHeaders();
      const payload = {
        ...createFormData,
        min_score_required: Number(createFormData.min_score_required) || 0,
        eligible_branches: [createFormData.eligibility_branch_cd],
        eligible_batches: [createFormData.eligibility_batch_cd],
      };

      await axios.post(`/api/placement-drive/create?tenant=${tenant}`, payload, { headers }).catch(async () => {
        return axios.post(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/placement-drive/create?tenant=${tenant}`, payload, { headers });
      });

      setCreateSuccess(true);
      setTimeout(() => {
        setCreateSuccess(false);
        setIsCreateModalOpen(false);
        setCreateFormData({
          company_name: '',
          role: '',
          package_ctc: '',
          eligibility_course_cd: '13',
          eligibility_branch_cd: 'CSE',
          eligibility_batch_cd: '2025',
          min_score_required: 60,
          drive_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          deadline_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: '',
        });
        fetchDrives();
      }, 1200);
    } catch (err: any) {
      setCreateError(err?.response?.data?.message || err?.message || 'Failed to create placement drive.');
    } finally {
      setCreatingDrive(false);
    }
  };

  const handleExportAll = async () => {
    try {
      const tenant = getTenantSlug();
      const headers = getAuthHeaders();
      const res = await axios.get(`/api/placement-drive/export?tenant=${tenant}`, { headers }).catch(async () => {
        return axios.get(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/placement-drive/export?tenant=${tenant}`, { headers });
      });
      const rows = res.data?.data || res.data || [];
      if (!Array.isArray(rows) || rows.length === 0) {
        alert('No placement records to export.');
        return;
      }
      const fileHeaders = ['Student Name', 'Reg No', 'Course', 'Batch', 'Company', 'Role', 'Package', 'Status', 'Offer Status', 'Applied Date'];
      const csvContent = 'data:text/csv;charset=utf-8,' +
        [fileHeaders.join(','), ...rows.map((r: any) => [
          `"${r.student_name || ''}"`,
          `"${r.registration_no || ''}"`,
          `"${r.course_cd || ''}"`,
          `"${r.batch_cd || ''}"`,
          `"${r.company_name || ''}"`,
          `"${r.role || ''}"`,
          `"${r.package_ctc || ''}"`,
          `"${r.status || ''}"`,
          `"${r.offer_status || ''}"`,
          `"${r.applied_at || ''}"`,
        ].join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Master_Placement_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  const handleExportCompany = async (driveId: number, companyName: string, status?: string) => {
    try {
      const tenant = getTenantSlug();
      const headers = getAuthHeaders();
      const url = status
        ? `/api/placement-drive/export?tenant=${tenant}&drive_id=${driveId}&status=${status}`
        : `/api/placement-drive/export?tenant=${tenant}&drive_id=${driveId}`;
      const res = await axios.get(url, { headers }).catch(async () => {
        return axios.get(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/placement-drive/export?tenant=${tenant}&drive_id=${driveId}${status ? `&status=${status}` : ''}`, { headers });
      });
      const rows = res.data?.data || res.data || [];
      if (!Array.isArray(rows) || rows.length === 0) {
        alert(`No ${status || ''} applicant records found for ${companyName}.`);
        return;
      }
      const fileHeaders = ['Student Name', 'Reg No', 'Course', 'Batch', 'Company', 'Role', 'Package', 'Status', 'Offer Status', 'Applied Date'];
      const csvContent = 'data:text/csv;charset=utf-8,' +
        [fileHeaders.join(','), ...rows.map((r: any) => [
          `"${r.student_name || ''}"`,
          `"${r.registration_no || ''}"`,
          `"${r.course_cd || ''}"`,
          `"${r.batch_cd || ''}"`,
          `"${r.company_name || ''}"`,
          `"${r.role || ''}"`,
          `"${r.package_ctc || ''}"`,
          `"${r.status || ''}"`,
          `"${r.offer_status || ''}"`,
          `"${r.applied_at || ''}"`,
        ].join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${status || 'All'}_Applicants.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  const filteredCompanies = companies.filter((c) => {
    const s = (search || '').toLowerCase().trim();
    const matchSearch =
      !s ||
      (c.company_name || '').toLowerCase().includes(s) ||
      (c.role || '').toLowerCase().includes(s) ||
      (c.package_ctc || '').toLowerCase().includes(s) ||
      (c.description || '').toLowerCase().includes(s);

    const matchBranch =
      branchFilter === 'ALL' ||
      !c.eligible_branches ||
      (Array.isArray(c.eligible_branches) && c.eligible_branches.length === 0) ||
      (Array.isArray(c.eligible_branches)
        ? c.eligible_branches.includes(branchFilter)
        : String(c.eligible_branches).includes(branchFilter));

    const matchBatch =
      batchFilter === 'ALL' ||
      !c.eligible_batches ||
      (Array.isArray(c.eligible_batches) && c.eligible_batches.length === 0) ||
      (Array.isArray(c.eligible_batches)
        ? c.eligible_batches.includes(batchFilter)
        : String(c.eligible_batches).includes(batchFilter));

    const matchStatus =
      statusFilter === 'ALL' || (c.status || '').toUpperCase() === statusFilter.toUpperCase();

    return matchSearch && matchBranch && matchBatch && matchStatus;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-[#F6F8FC] dark:bg-slate-900">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header title="Campus Placement Drives & Corporate Relations" />

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Top Bar Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#5B4BFF] uppercase tracking-wider mb-1">
                <span>Placement Board</span>
                <span>•</span>
                <span>Institutional Authority</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#1B1E28] dark:text-white tracking-tight">
                Corporate Recruitment Drives
              </h1>
              <p className="text-xs sm:text-sm text-[#4E5969] dark:text-slate-400 mt-1">
                Import Excel company rosters, track applicants, review interviews, and export placed cohorts.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href="/templates/placement-drive-import-template.xlsx"
                download="placement-drive-import-template.xlsx"
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Download Format
              </a>

              <button
                onClick={handleExportAll}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                Export All Placements
              </button>

              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-[#5B4BFF]/30 text-[#5B4BFF] hover:bg-[#5B4BFF]/10 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <UploadCloud className="w-4 h-4" />
                Import Excel Drives
              </button>

              <button
                onClick={() => {
                  setCreateError(null);
                  setIsCreateModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#5B4BFF] hover:bg-[#4a3ae0] text-white shadow-md transition-all flex items-center gap-2 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Post Placement Drive
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-[22px] border border-[#E7EAF3] dark:border-slate-700 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

            <div>
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              >
                <option value="ALL">All Batches</option>
                <option value="2025">Batch 2025</option>
                <option value="2026">Batch 2026</option>
              </select>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open / Active</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

          {/* Placement Drives Card Grid */}
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#5B4BFF] animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Loading placement board...</p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="p-16 text-center rounded-[28px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
              <Building2 className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                No matching placement drives found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Upload an Excel sheet of visiting companies or adjust your branch/batch filters.
              </p>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#5B4BFF] text-white shadow-sm"
              >
                Import Excel Sheet Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCompanies.map((comp) => (
                <CompanyCard
                  key={comp.drive_id}
                  company={comp}
                  role="admin"
                  onViewDetails={(c) => setSelectedCompany(c)}
                  onManageApplicants={(c) => handleOpenApplicants(c)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* View Details Drawer */}
      <CompanyDetailDrawer
        company={selectedCompany}
        role="admin"
        onClose={() => setSelectedCompany(null)}
      />

      {/* Excel Import Modal */}
      {isImportModalOpen && (
        <ImportDrivesModal
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => fetchDrives()}
        />
      )}

      {/* Manage Applicants Modal */}
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
                  onClick={() => handleExportCompany(applicantsModalCompany.drive_id, applicantsModalCompany.company_name, 'Shortlisted')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-all"
                >
                  Export Shortlisted
                </button>

                <button
                  onClick={() => handleExportCompany(applicantsModalCompany.drive_id, applicantsModalCompany.company_name, 'Selected')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-all"
                >
                  Export Placed
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
                <p className="text-xs font-bold text-slate-500">Loading candidate roster...</p>
              </div>
            ) : applicantsList.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-[#F6F8FC] dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <Users className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No students have applied for this drive yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                    <tr>
                      <th className="p-3.5">Student</th>
                      <th className="p-3.5">Reg No</th>
                      <th className="p-3.5">Resume / Note</th>
                      <th className="p-3.5">Applied Date</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Shortlisting Actions</th>
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
                              className="font-bold text-[#5B4BFF] hover:underline block"
                            >
                              View Resume ↗
                            </a>
                          ) : (
                            <span className="text-slate-400">No Resume</span>
                          )}
                          {app.cover_note && (
                            <span className="text-[11px] text-slate-500 block truncate max-w-xs">
                              {app.cover_note}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          {new Date(app.applied_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="p-3.5 font-bold uppercase tracking-wider text-[11px]">
                          {app.status === 'Selected' ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-black">
                              Selected (Placed)
                            </span>
                          ) : app.status === 'Shortlisted' ? (
                            <span className="text-indigo-600 dark:text-indigo-400">
                              Shortlisted
                            </span>
                          ) : app.status === 'Rejected' ? (
                            <span className="text-rose-600 dark:text-rose-400">
                              Rejected
                            </span>
                          ) : (
                            <span className="text-slate-600 dark:text-slate-400">
                              Applied
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right space-x-1.5">
                          <button
                            onClick={() => handleUpdateStatus(app.application_id, 'Shortlisted')}
                            className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300 transition-all"
                          >
                            Shortlist
                          </button>

                          <button
                            onClick={() => handleUpdateStatus(app.application_id, 'Selected')}
                            className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300 transition-all"
                          >
                            Select (Place)
                          </button>

                          <button
                            onClick={() => handleUpdateStatus(app.application_id, 'Rejected')}
                            className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/40 dark:text-rose-300 transition-all"
                          >
                            Reject
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

      {/* Post New Placement Drive Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2D2575] to-[#5B4BFF] text-white font-black text-lg flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Post New Campus Placement Drive
                  </h3>
                  <p className="text-xs text-slate-500">
                    Immediately announces to students and triggers dashboard highlight alerts.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createSuccess ? (
              <div className="py-8 text-center space-y-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-12 h-12 mx-auto animate-bounce" />
                <h4 className="font-extrabold text-base">Placement Drive Announced Successfully!</h4>
                <p className="text-xs text-slate-500">
                  Live notice posted and highlighted alerts activated on student dashboards.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreateDriveSubmit} className="space-y-4">
                {createError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                    {createError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={createFormData.company_name}
                      onChange={(e) => setCreateFormData({ ...createFormData, company_name: e.target.value })}
                      placeholder="e.g. Google Cloud, TCS, Infosys"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Job Role / Designation *
                    </label>
                    <input
                      type="text"
                      required
                      value={createFormData.role}
                      onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value })}
                      placeholder="e.g. Cloud Engineer, SDE-1"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Offered Package (CTC)
                    </label>
                    <input
                      type="text"
                      value={createFormData.package_ctc}
                      onChange={(e) => setCreateFormData({ ...createFormData, package_ctc: e.target.value })}
                      placeholder="e.g. ₹8.5 - ₹12 LPA"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Eligible Branch
                    </label>
                    <select
                      value={createFormData.eligibility_branch_cd}
                      onChange={(e) => setCreateFormData({ ...createFormData, eligibility_branch_cd: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                    >
                      <option value="CSE">Computer Science (CSE)</option>
                      <option value="IT">Information Tech (IT)</option>
                      <option value="ECE">Electronics (ECE)</option>
                      <option value="ME">Mechanical (ME)</option>
                      <option value="EE">Electrical (EE)</option>
                      <option value="ALL">All Engineering Branches</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Eligible Batch
                    </label>
                    <select
                      value={createFormData.eligibility_batch_cd}
                      onChange={(e) => setCreateFormData({ ...createFormData, eligibility_batch_cd: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                    >
                      <option value="2025">Batch 2025</option>
                      <option value="2026">Batch 2026</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Drive Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={createFormData.drive_date}
                      onChange={(e) => setCreateFormData({ ...createFormData, drive_date: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Application Deadline *
                    </label>
                    <input
                      type="date"
                      required
                      value={createFormData.deadline_date}
                      onChange={(e) => setCreateFormData({ ...createFormData, deadline_date: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Job Description &amp; Technical Requirements
                  </label>
                  <textarea
                    rows={3}
                    value={createFormData.description}
                    onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                    placeholder="Describe interview stages, coding assessments, skills required..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={creatingDrive}
                    className="px-5 py-2 rounded-xl text-xs font-black bg-[#5B4BFF] hover:bg-[#4a3ae0] text-white shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {creatingDrive ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Announcing...
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        Announce Placement Drive
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
