'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import ProgramCard, { InternshipProgram } from '../../../../components/internships/ProgramCard';
import DigitalCertificateModal, { CertificateData } from '../../../../components/internships/DigitalCertificateModal';
import { 
  GraduationCap, 
  Search, 
  Award, 
  CheckCircle2, 
  Loader2, 
  Sparkles,
  DollarSign
} from 'lucide-react';

export default function StudentInternshipsPage() {
  const [programs, setPrograms] = useState<InternshipProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
  const [loadingCert, setLoadingCert] = useState(false);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const getHeaders = () => {
    const tenantSlug = typeof window !== 'undefined'
      ? (localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly').replace(/^tenant_/, '').replace(/^tenant-/, '')
      : 'srms-cet-bareilly';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    let userObj: any = {};
    try {
      if (userStr) userObj = JSON.parse(userStr);
    } catch {}

    const regNo = userObj?.registration_no || userObj?.rollno || userObj?.username || userObj?.sub || '';
    const name = userObj?.name || `${userObj?.first_name || ''} ${userObj?.last_name || ''}`.trim() || '';

    return {
      'x-tenant-id': `tenant_${tenantSlug}`,
      'x-tenant': tenantSlug,
      'x-user-reg-no': regNo,
      'x-user-name': name,
      'x-user-id': userObj?.id || regNo,
      'x-user-role': userObj?.role || 'STUDENT',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/internships/list', { headers: getHeaders() });
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setPrograms(list);
    } catch (e) {
      console.error('Error fetching student internships:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (program: InternshipProgram) => {
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      let userObj: any = {};
      try {
        if (userStr) userObj = JSON.parse(userStr);
      } catch {}

      const regNo = userObj?.registration_no || userObj?.rollno || userObj?.username || '';
      const name = userObj?.name || `${userObj?.first_name || ''} ${userObj?.last_name || ''}`.trim() || '';

      const res = await axios.post('/api/internships/apply', { 
        program_id: program.id,
        student_reg_no: regNo,
        student_name: name,
        student_id: userObj?.id || regNo,
        course_cd: userObj?.course_cd || userObj?.course,
        batch_cd: userObj?.batch_cd || userObj?.batch,
      }, { headers: getHeaders() });
      alert(res.data?.message || 'Application submitted successfully!');
      fetchPrograms();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to submit application.');
    }
  };

  const handleMakePayment = async (applicationId: string, amount: number) => {
    const confirm = window.confirm(`Proceed to confirm payment of ₹${amount} for this internship enrollment?`);
    if (!confirm) return;

    try {
      const res = await axios.post(`/api/internships/${applicationId}/payment`, {}, { headers: getHeaders() });
      alert(res.data?.message || 'Payment confirmed!');
      fetchPrograms();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Payment processing failed.');
    }
  };

  const handleViewCertificate = async (applicationId: string, progTitle?: string) => {
    setLoadingCert(true);
    try {
      const res = await axios.get(`/api/internships/applications/${applicationId}/certificate`, { headers: getHeaders() });
      const data = { ...res.data };
      
      // Fallback enrichment if any attribute is not set
      if (typeof window !== 'undefined') {
        const rawUser = localStorage.getItem('user');
        if (rawUser) {
          try {
            const parsed = JSON.parse(rawUser);
            if (!data.applicant_name && parsed.name) data.applicant_name = parsed.name;
            if (!data.course && (parsed.course_name || parsed.course || parsed.course_cd)) {
              data.course = parsed.course_name || parsed.course || parsed.course_cd;
            }
            if (!data.batch && (parsed.batch_name || parsed.batch || parsed.batch_cd)) {
              data.batch = parsed.batch_name || parsed.batch || parsed.batch_cd;
            }
          } catch (_) {}
        }
      }
      if (progTitle && !data.internship_name) {
        data.internship_name = progTitle;
      }
      setCertificateData(data);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Certificate is not available yet.');
    } finally {
      setLoadingCert(false);
    }
  };

  const completedCerts = programs.filter((p) => p.my_application?.status === 'completed');

  const filtered = programs.filter((p) => {
    const matchSearch =
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());

    const matchCategory = categoryFilter === 'ALL' || p.category === categoryFilter;

    return matchSearch && matchCategory;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-[#F6F8FC] dark:bg-slate-900">
      <Sidebar role="student" />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header title="Internships, Workshops & Certifications" />

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Top Banner if Student Has Earned Certificates */}
          {completedCerts.length > 0 && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-indigo-500/10 to-transparent border border-amber-300/40 dark:border-amber-700/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shrink-0 shadow-md">
                  🏆
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    You have {completedCerts.length} Verified Digital Certificate(s) Available!
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Official e-certificates signed by Dean Academics ready for print and portfolio download.
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleViewCertificate(completedCerts[0].my_application!.id, completedCerts[0].title)}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-all shrink-0 active:scale-95 flex items-center gap-1.5"
              >
                <Award className="w-4 h-4" />
                View Latest Certificate
              </button>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#1B1E28] dark:text-white tracking-tight">
                Internship & Certification Programs
              </h1>
              <p className="text-xs sm:text-sm text-[#4E5969] dark:text-slate-400 mt-1">
                Upskill with industry-recognized certificate tracks in IT, Business Analytics, and Para-Medical systems.
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
                placeholder="Search domain or certification topic..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              />
            </div>

            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              >
                <option value="ALL">All Categories</option>
                <option value="IT">IT & Computer Sciences</option>
                <option value="MANAGEMENT">Management & Analytics</option>
                <option value="PARAMEDICAL">Para-Medical & Clinical</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#5B4BFF] animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Loading programs...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center rounded-[28px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
              <GraduationCap className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                No active programs matching your search
              </h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((prog) => (
                <ProgramCard
                  key={prog.id}
                  program={prog}
                  role="student"
                  onApply={(p) => handleApply(p)}
                  onMakePayment={(appId, amt) => handleMakePayment(appId, amt)}
                  onViewCertificate={(appId) => handleViewCertificate(appId, prog.title)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Digital Certificate Modal */}
      {certificateData && (
        <DigitalCertificateModal
          certificate={certificateData}
          onClose={() => setCertificateData(null)}
        />
      )}
    </div>
  );
}
