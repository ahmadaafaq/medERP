'use client';

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  X, 
  Users, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  XCircle, 
  Award, 
  Clock, 
  Loader2, 
  AlertCircle,
  FileCheck,
  Search,
  CheckSquare,
  Square,
  MinusSquare,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { InternshipProgram } from './ProgramCard';
import DigitalCertificateModal, { CertificateData } from './DigitalCertificateModal';

interface ApplicantReviewModalProps {
  program: InternshipProgram | null;
  onClose: () => void;
  onRefresh: () => void;
}

type TabType = 'ALL' | 'applied' | 'selected' | 'completed' | 'rejected';

export default function ApplicantReviewModal({
  program,
  onClose,
  onRefresh,
}: ApplicantReviewModalProps) {
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(program?.status === 'applications_locked');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
  const [loadingCertId, setLoadingCertId] = useState<string | null>(null);

  useEffect(() => {
    if (!program) return;
    fetchApplicants();
  }, [program]);

  // Clear selected checkboxes when tab changes
  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab]);

  const getTenantSlug = () => {
    return typeof window !== 'undefined'
      ? (localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly').replace(/^tenant_/, '').replace(/^tenant-/, '')
      : 'srms-cet-bareilly';
  };

  const getHeaders = () => {
    const tenantSlug = getTenantSlug();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'x-tenant-id': `tenant_${tenantSlug}`,
      'x-tenant': tenantSlug,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchApplicants = async () => {
    if (!program) return;
    setLoading(true);
    try {
      const tenantSlug = getTenantSlug();
      const res = await axios.get(`/api/internships/${program.id}/applicants?tenant=${tenantSlug}`, { headers: getHeaders() });
      const list = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
      setApplicants(list);
    } catch (e) {
      console.error('Error fetching applicants:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLock = async () => {
    if (!program) return;
    const newLockState = !isLocked;
    try {
      const tenantSlug = getTenantSlug();
      await axios.patch(`/api/internships/${program.id}/lock?tenant=${tenantSlug}`, { locked: newLockState }, { headers: getHeaders() });
      setIsLocked(newLockState);
      onRefresh();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not update applicant lock state.');
    }
  };

  const handleStatusChange = async (appId: string, status: string) => {
    setUpdatingId(appId);
    try {
      const tenantSlug = getTenantSlug();
      await axios.patch(`/api/internships/applications/${appId}/status?tenant=${tenantSlug}`, { status }, { headers: getHeaders() });
      await fetchApplicants();
      onRefresh();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update applicant status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Bulk Status Update (e.g. Bulk Certify, Bulk Select, Bulk Reject)
  const handleBulkStatusChange = async (status: string) => {
    if (selectedIds.length === 0) return;
    const actionLabel = status === 'completed' ? 'Certify & Mark Complete' : status === 'selected' ? 'Select / Shortlist' : 'Reject';
    const confirm = window.confirm(`Are you sure you want to ${actionLabel} for all ${selectedIds.length} selected student(s)?`);
    if (!confirm) return;

    setBulkLoading(true);
    try {
      const tenantSlug = getTenantSlug();
      await Promise.all(
        selectedIds.map(appId =>
          axios.patch(`/api/internships/applications/${appId}/status?tenant=${tenantSlug}`, { status }, { headers: getHeaders() })
        )
      );
      setSelectedIds([]);
      await fetchApplicants();
      onRefresh();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to process bulk status change.');
    } finally {
      setBulkLoading(false);
    }
  };

  // View Digital Certificate
  const handleViewCertificate = async (app: any) => {
    setLoadingCertId(app.id);
    try {
      const tenantSlug = getTenantSlug();
      const res = await axios.get(`/api/certificates/${app.id}?tenant=${tenantSlug}`, { headers: getHeaders() }).catch(() => null);
      let data = res?.data?.data || res?.data;
      if (!data || !data.certificate_no) {
        data = {
          certificate_no: app.certificate_no || `SRMS-CERT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
          internship_name: program?.title || 'Institutional Certification',
          applicant_name: app.display_name || app.student_name || 'Candidate',
          course: app.display_course || app.course_cd || 'BCA',
          batch: app.display_batch || app.batch_cd || 'Batch 2025',
          duration: program?.duration || '3 Months',
          category: program?.category || 'IT',
          issued_date: app.issued_date || app.completed_at || new Date().toISOString(),
          approved_by: app.approved_by || 'Dean Academics',
          approver_title: 'Dean Academics & Head Skill Development',
        };
      }
      setCertificateData(data);
    } catch (e) {
      setError('Could not retrieve certificate data.');
    } finally {
      setLoadingCertId(null);
    }
  };

  // Counts per status
  const counts = useMemo(() => {
    return {
      all: applicants.length,
      applied: applicants.filter(a => a.status === 'applied' || a.status === 'under_review').length,
      selected: applicants.filter(a => a.status === 'selected').length,
      completed: applicants.filter(a => a.status === 'completed').length,
      rejected: applicants.filter(a => a.status === 'rejected').length,
    };
  }, [applicants]);

  // Filtered applicants based on activeTab and searchQuery
  const filteredApplicants = useMemo(() => {
    return applicants.filter(app => {
      // Tab filter
      if (activeTab === 'applied' && app.status !== 'applied' && app.status !== 'under_review') return false;
      if (activeTab === 'selected' && app.status !== 'selected') return false;
      if (activeTab === 'completed' && app.status !== 'completed') return false;
      if (activeTab === 'rejected' && app.status !== 'rejected') return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = String(app.display_name || app.student_name || '').toLowerCase().includes(query);
        const matchReg = String(app.student_reg_no || app.rollno || '').toLowerCase().includes(query);
        const matchCourse = String(app.display_course || '').toLowerCase().includes(query);
        return matchName || matchReg || matchCourse;
      }
      return true;
    });
  }, [applicants, activeTab, searchQuery]);

  // Checkbox selection logic
  const isAllSelected = filteredApplicants.length > 0 && filteredApplicants.every(a => selectedIds.includes(a.id));
  const isSomeSelected = filteredApplicants.some(a => selectedIds.includes(a.id)) && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      // Deselect all in current view
      const currentIds = new Set(filteredApplicants.map(a => a.id));
      setSelectedIds(prev => prev.filter(id => !currentIds.has(id)));
    } else {
      // Select all in current view
      const currentIds = filteredApplicants.map(a => a.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...currentIds])));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  if (!program) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-5xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-[#5B4BFF] shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Applicant Evaluation & Certification</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {program.title} • <span className="font-bold text-[#5B4BFF]">{program.category}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleLock}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
                isLocked
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{isLocked ? 'Locked (Stop Applications)' : 'Active (Lock Applications)'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 text-xs font-bold">✕</button>
          </div>
        )}

        {/* Dynamic Status Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'ALL'
                  ? 'bg-[#5B4BFF] text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>All Applicants</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${activeTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                {counts.all}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('applied')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'applied'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>Applied</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${activeTab === 'applied' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                {counts.applied}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('selected')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'selected'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>🟢 Selected / Enrolled</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${activeTab === 'selected' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                {counts.selected}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'completed'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>🏆 Certified</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${activeTab === 'completed' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                {counts.completed}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'rejected'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>Rejected</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${activeTab === 'rejected' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                {counts.rejected}
              </span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-60 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate or roll no..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
            />
          </div>
        </div>

        {/* Bulk Action Bar (When 1 or more candidates are checked) */}
        {selectedIds.length > 0 && (
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 flex flex-wrap items-center justify-between gap-2.5 animate-in fade-in slide-in-from-top-2 duration-150 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-[#5B4BFF] text-white font-black text-xs">
                {selectedIds.length} Selected
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 hidden sm:inline">
                Perform batch action on selected candidates:
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Bulk Mark Complete & Certify */}
              <button
                onClick={() => handleBulkStatusChange('completed')}
                disabled={bulkLoading}
                className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {bulkLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />}
                <span>Certify Selected ({selectedIds.length}) 🏆</span>
              </button>

              {/* Bulk Select */}
              <button
                onClick={() => handleBulkStatusChange('selected')}
                disabled={bulkLoading}
                className="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <span>🟢 Select ({selectedIds.length})</span>
              </button>

              {/* Bulk Reject */}
              <button
                onClick={() => handleBulkStatusChange('rejected')}
                disabled={bulkLoading}
                className="px-3 py-1.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <span>Reject ({selectedIds.length})</span>
              </button>

              {/* Clear */}
              <button
                onClick={() => setSelectedIds([])}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Applicant Table */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#5B4BFF] animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">Loading enrolled candidates...</p>
          </div>
        ) : filteredApplicants.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#F6F8FC] dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
            <Users className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {activeTab === 'ALL'
                ? 'No students have applied to this program yet.'
                : `No candidates found under "${activeTab.toUpperCase()}" status.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3.5 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="p-1 rounded-md text-slate-600 hover:text-[#5B4BFF] dark:text-slate-300 dark:hover:text-[#7867FF] cursor-pointer flex items-center justify-center mx-auto"
                      title={isAllSelected ? 'Deselect All' : 'Select All in View'}
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#5B4BFF]" />
                      ) : isSomeSelected ? (
                        <MinusSquare className="w-4 h-4 text-[#5B4BFF]" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="p-3.5">Student / Candidate</th>
                  <th className="p-3.5">Reg No / Roll</th>
                  <th className="p-3.5">Applied Date</th>
                  <th className="p-3.5">Fee Status</th>
                  <th className="p-3.5">Current Status</th>
                  <th className="p-3.5 text-right">Evaluation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900">
                {filteredApplicants.map((app) => {
                  const isSelected = selectedIds.includes(app.id);
                  return (
                    <tr
                      key={app.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(app.id)}
                          className="p-1 rounded-md text-slate-600 hover:text-[#5B4BFF] dark:text-slate-300 dark:hover:text-[#7867FF] cursor-pointer flex items-center justify-center mx-auto"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#5B4BFF]" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="p-3.5">
                        <div className="font-extrabold text-slate-900 dark:text-white text-[12.5px]">
                          {app.display_name || app.student_name || 'Enrolled Student'}
                        </div>
                        {(app.display_course || app.display_batch) && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                            {[app.display_course, app.display_batch].filter(Boolean).join(' • ')}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400 font-bold">
                        {app.student_reg_no || app.rollno || app.student_id || '-'}
                      </td>
                      <td className="p-3.5 font-medium">
                        {new Date(app.applied_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="p-3.5">
                        {app.payment_status === 'paid' ? (
                          <span className="px-2.5 py-0.5 rounded-md font-bold text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Paid
                          </span>
                        ) : app.payment_status === 'pending' ? (
                          <span className="px-2.5 py-0.5 rounded-md font-bold text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            Pending
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            Free
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-bold uppercase tracking-wider text-[11px]">
                        {app.status === 'completed' ? (
                          <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-black">
                            <Award className="w-3.5 h-3.5" /> Certified
                          </span>
                        ) : app.status === 'selected' ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-black">
                            🟢 Selected
                          </span>
                        ) : app.status === 'rejected' ? (
                          <span className="text-rose-600 dark:text-rose-400 font-black">
                            🔴 Rejected
                          </span>
                        ) : (
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                            Applied
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        {app.status === 'completed' ? (
                          <button
                            onClick={() => handleViewCertificate(app)}
                            disabled={loadingCertId === app.id}
                            className="px-3 py-1.5 rounded-xl font-black text-[11px] bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all inline-flex items-center gap-1 active:scale-95 cursor-pointer"
                          >
                            {loadingCertId === app.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />}
                            <span>View Certificate 🏆</span>
                          </button>
                        ) : (
                          <>
                            {app.status !== 'selected' && (
                              <button
                                onClick={() => handleStatusChange(app.id, 'selected')}
                                disabled={updatingId === app.id}
                                className="px-2.5 py-1.5 rounded-xl font-black text-[11px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 transition-all cursor-pointer active:scale-95"
                              >
                                Select
                              </button>
                            )}

                            {app.status !== 'rejected' && (
                              <button
                                onClick={() => handleStatusChange(app.id, 'rejected')}
                                disabled={updatingId === app.id}
                                className="px-2.5 py-1.5 rounded-xl font-bold text-[11px] bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-300 transition-all cursor-pointer active:scale-95"
                              >
                                Reject
                              </button>
                            )}

                            <button
                              onClick={() => handleStatusChange(app.id, 'completed')}
                              disabled={updatingId === app.id}
                              className="px-3 py-1.5 rounded-xl font-black text-[11px] bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all inline-flex items-center gap-1 active:scale-95 cursor-pointer"
                            >
                              <Award className="w-3.5 h-3.5" />
                              <span>Mark Complete & Certify 🏆</span>
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Digital Certificate Modal Preview inside Admin Review */}
      {certificateData && (
        <DigitalCertificateModal
          certificate={certificateData}
          onClose={() => setCertificateData(null)}
        />
      )}
    </div>
  );
}
