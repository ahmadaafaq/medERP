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
  DollarSign,
  Building2,
  Eye,
  Download,
  Printer,
  FileCheck
} from 'lucide-react';

export default function StudentInternshipsPage() {
  const [programs, setPrograms] = useState<InternshipProgram[]>([]);
  const [earnedCertificates, setEarnedCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [campusFilter, setCampusFilter] = useState('ALL');
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
  const [loadingCert, setLoadingCert] = useState(false);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const getHeaders = () => {
    const tenantSlug = typeof window !== 'undefined'
      ? (localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly').replace(/^tenant_/, '').replace(/^tenant-/, '')
      : 'srms-cet-bareilly';

    let cookieToken = '';
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/auth_token=([^;]+)/);
      if (match) cookieToken = match[1];
    }
    const token = (typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('accessToken') || '' : '') || cookieToken;
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    let userObj: any = {};
    try {
      if (userStr) userObj = JSON.parse(userStr);
    } catch {}

    const p = userObj?.profile || userObj || {};
    const regNo =
      p.registration_no ||
      userObj?.registration_no ||
      userObj?.registrationNo ||
      p.registrationNo ||
      p.reg_no ||
      userObj?.rollno ||
      p.rollno ||
      (typeof window !== 'undefined' ? localStorage.getItem('registration_no') || localStorage.getItem('rollno') || '' : '') ||
      userObj?.username ||
      '';

    const rollNo = p.rollno || userObj?.rollno || '';
    const name =
      p.name ||
      userObj?.name ||
      p.student_name ||
      `${userObj?.first_name || ''} ${userObj?.last_name || ''}`.trim() ||
      '';

    const email = userObj?.email || p.email || '';

    return {
      'x-tenant-id': `tenant_${tenantSlug}`,
      'x-tenant': tenantSlug,
      'x-tenant-slug': tenantSlug,
      'x-user-reg-no': regNo,
      'x-user-rollno': rollNo,
      'x-user-name': name,
      'x-user-email': email,
      'x-user-id': userObj?.id || p.id || regNo,
      'x-user-role': userObj?.role || 'STUDENT',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      let currentHeaders = getHeaders();

      // If reg-no is not yet in localStorage, fetch /api/auth/me to enrich identity
      if (!currentHeaders['x-user-reg-no'] && typeof window !== 'undefined') {
        try {
          const meRes = await axios.get('/api/auth/me', { headers: currentHeaders }).catch(() => null);
          const meData = meRes?.data?.data || meRes?.data || {};
          const p = meData.profile || meData;
          if (p?.registration_no || p?.rollno) {
            const rawUser = localStorage.getItem('user');
            const parsed = rawUser ? JSON.parse(rawUser) : {};
            parsed.profile = { ...(parsed.profile || {}), ...p };
            parsed.registration_no = p.registration_no || parsed.registration_no;
            parsed.rollno = p.rollno || parsed.rollno;
            localStorage.setItem('user', JSON.stringify(parsed));
            if (p.registration_no) localStorage.setItem('registration_no', p.registration_no);
            currentHeaders = getHeaders();
          }
        } catch {}
      }

      // Fetch programs and earned certificates in parallel
      const [progRes, certRes] = await Promise.all([
        axios.get('/api/internships/list', { headers: currentHeaders }).catch(() => ({ data: [] })),
        axios.get('/api/internships/my-certificates', {
          headers: currentHeaders,
          params: {
            tenant: currentHeaders['x-tenant'],
            student_reg_no: currentHeaders['x-user-reg-no'],
            student_id: currentHeaders['x-user-id'],
          },
        }).catch(() => ({ data: [] })),
      ]);

      const list = Array.isArray(progRes.data) ? progRes.data : progRes.data?.data || [];
      const cList = Array.isArray(certRes.data) ? certRes.data : certRes.data?.data || [];

      setPrograms(list);
      setEarnedCertificates(cList);

      // Auto-open certificate if navigating with (?viewCert=true) or (?appId=...)
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const shouldViewCert = urlParams.get('viewCert') === 'true' || urlParams.get('cert') === 'true';
        const targetAppId = urlParams.get('appId');

        if (shouldViewCert || targetAppId) {
          const targetCert = targetAppId 
            ? cList.find((c: any) => c.application_id === targetAppId) || list.find((p: any) => p.my_application?.id === targetAppId)?.my_application
            : cList[0] || list.find((p: any) => p.my_application?.status === 'completed')?.my_application;

          if (targetCert) {
            const appId = targetCert.application_id || targetCert.id;
            const title = targetCert.internship_title || targetCert.title;
            if (appId) {
              handleViewCertificate(appId, title);
            } else {
              openCertificateModal(targetCert);
            }
          }
        }
      }
    } catch (e) {
      console.error('Error fetching student internships:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (program: InternshipProgram) => {
    if (program.application_deadline) {
      try {
        const deadlineDate = new Date(program.application_deadline);
        const endOfDay = new Date(deadlineDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (endOfDay.getTime() < Date.now()) {
          alert('Applications for this program are closed as the deadline has expired.');
          return;
        }
      } catch {}
    }

    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      let userObj: any = {};
      try {
        if (userStr) userObj = JSON.parse(userStr);
      } catch {}

      const p = userObj?.profile || userObj || {};
      const regNo = p.registration_no || userObj?.registration_no || userObj?.rollno || userObj?.username || '';
      const name = p.name || userObj?.name || `${userObj?.first_name || ''} ${userObj?.last_name || ''}`.trim() || '';

      const res = await axios.post('/api/internships/apply', { 
        program_id: program.id,
        student_reg_no: regNo,
        student_name: name,
        student_id: userObj?.id || p.id || regNo,
        course_cd: p.course_cd || userObj?.course_cd || userObj?.course,
        batch_cd: p.batch_cd || userObj?.batch_cd || userObj?.batch,
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
            const p = parsed?.profile || parsed;
            if (!data.applicant_name && (p.name || parsed.name)) {
              data.applicant_name = p.name || parsed.name;
            }
            if (!data.course && (p.course_name || p.course || p.course_cd)) {
              data.course = p.course_name || p.course || p.course_cd;
            }
            if (!data.batch && (p.batch_name || p.batch || p.batch_cd)) {
              data.batch = p.batch_name || p.batch || p.batch_cd;
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

  const openCertificateModal = async (cert: any) => {
    if (cert.application_id) {
      await handleViewCertificate(cert.application_id, cert.internship_title || cert.title);
    } else {
      setCertificateData({
        certificate_no: cert.certificate_no || `SRMS-CERT-${new Date().getFullYear()}-001`,
        internship_name: cert.internship_title || cert.title || 'Internship Certification',
        applicant_name: cert.student_name || 'Candidate',
        course: cert.course || 'BCA',
        batch: cert.batch || 'Batch 2025',
        duration: cert.duration || '3 Months',
        issued_date: cert.issued_date || new Date().toISOString().split('T')[0],
        approved_by: cert.approved_by || 'Prof. (Dr.) Prabhakar Gupta',
        approver_title: cert.approver_title || 'Dean Academics & Training Cell',
        pdf_url: cert.pdf_url,
        logo_url: cert.logo_url,
        institution_name: cert.institution_name,
      });
    }
  };

  // Merge certificates from my-certificates API and programs list (avoiding duplicate by certificate_no or application_id)
  const completedFromPrograms = programs
    .filter((p) => p.my_application?.status === 'completed')
    .map((p) => ({
      certificate_id: p.my_application?.id,
      application_id: p.my_application?.id,
      certificate_no: p.my_application?.certificate_no || 'SRMS-CERTIFIED',
      internship_title: p.title,
      organization_name: p.organization_name || 'SRMS Internal Research & Incubation Cell',
      student_name: p.my_application?.student_name,
      student_reg_no: p.my_application?.student_reg_no,
      issued_date: p.my_application?.issued_date ? (typeof p.my_application.issued_date === 'string' ? p.my_application.issued_date.split('T')[0] : '') : '',
      approved_by: p.my_application?.approved_by || 'Prof. (Dr.) Prabhakar Gupta',
      duration: p.duration ? p.duration.replace('_', ' ') : '3 Months',
      external_cert_url: p.my_application?.cert_external_url || p.my_application?.external_cert_url,
      course: p.my_application?.course_cd || 'BCA',
      batch: p.my_application?.batch_cd || 'Batch 2025',
    }));

  const allCertsMap = new Map<string, any>();
  for (const c of earnedCertificates) {
    const key = (c.certificate_no || c.application_id || c.certificate_id || '').toLowerCase();
    if (key) allCertsMap.set(key, c);
  }
  for (const c of completedFromPrograms) {
    const key = (c.certificate_no || c.application_id || c.certificate_id || '').toLowerCase();
    if (key && !allCertsMap.has(key)) {
      allCertsMap.set(key, c);
    }
  }
  const allEarnedCertificates = Array.from(allCertsMap.values());

  const filtered = programs.filter((p) => {
    const matchSearch =
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.organization_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.off_campus_title?.toLowerCase().includes(search.toLowerCase()) ||
      p.location?.toLowerCase().includes(search.toLowerCase());

    const matchCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
    const matchCampus = campusFilter === 'ALL' || p.campus_type === campusFilter;

    return matchSearch && matchCategory && matchCampus;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-[#F6F8FC] dark:bg-slate-900">
      <Sidebar role="student" />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header title="Internships, Workshops & Certifications" />

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Top Banner if Student Has Earned Certificates */}
          {allEarnedCertificates.length > 0 && (
            <div className="p-5 sm:p-6 rounded-[22px] bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-indigo-500/10 border border-amber-300/50 dark:border-amber-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-[#F36C21] text-white flex items-center justify-center text-xl shrink-0 shadow-md shadow-amber-500/20">
                  🏆
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300 font-extrabold text-[10px] uppercase tracking-wider">
                      OFFICIAL CREDENTIALS
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 font-bold">
                      Verified & Issued
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    You have {allEarnedCertificates.length} Verified Certificate{allEarnedCertificates.length > 1 ? 's' : ''} Ready!
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Official university in-house e-certificates signed by Dean Academics and corporate completion credentials ready to view, print, and download.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => openCertificateModal(allEarnedCertificates[0])}
                  disabled={loadingCert}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-[#F36C21] hover:from-amber-600 hover:to-[#E25C10] text-white shadow-md shadow-orange-500/20 transition-all shrink-0 active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loadingCert ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Award className="w-4 h-4" />
                  )}
                  <span>View & Download Certificate</span>
                </button>
              </div>
            </div>
          )}

          {/* Earned Certificates Grid Card Section */}
          {allEarnedCertificates.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-[22px] p-6 border border-[#E7EAF3] dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-[#1B1E28] dark:text-white">
                      Earned Digital Certificates & Accreditations ({allEarnedCertificates.length})
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Dean verified credentials with cryptographically authenticated certificate numbers.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Dean Approved & Digitally Verifiable
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {allEarnedCertificates.map((cert: any) => {
                  return (
                    <div
                      key={cert.certificate_id || cert.id || cert.certificate_no}
                      className="p-5 rounded-2xl bg-[#F8FAFC] dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700/80 hover:border-[#F36C21]/40 transition-all flex flex-col justify-between gap-4 shadow-sm group"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-mono border border-amber-300/40">
                            {cert.certificate_no || 'SRMS-CERTIFIED'}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                            {cert.duration || '3 Months'}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-[#F36C21] transition-colors">
                            {cert.internship_title || cert.title || 'Internship & Certification'}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{cert.organization_name || 'SRMS Internal Research & Incubation Cell'}</span>
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Awarded To:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{cert.student_name || 'Candidate'}</span>
                          </div>
                          {cert.student_reg_no && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Reg No:</span>
                              <span className="font-mono text-slate-700 dark:text-slate-300">{cert.student_reg_no}</span>
                            </div>
                          )}
                          {cert.issued_date && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Issued On:</span>
                              <span className="font-medium font-mono">{cert.issued_date}</span>
                            </div>
                          )}
                          {cert.approved_by && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">Authority:</span>
                              <span className="font-medium truncate max-w-[150px]">{cert.approved_by}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                        {cert.external_cert_url && (
                          <a
                            href={cert.external_cert_url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all active:scale-95 flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </a>
                        )}

                        <button
                          onClick={() => openCertificateModal(cert)}
                          disabled={loadingCert}
                          className="flex-1 px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-[#F36C21] hover:from-amber-600 hover:to-[#E25C10] text-white shadow-md shadow-orange-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View, Print & Download</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#1B1E28] dark:text-white tracking-tight">
                Internship & Certification Programs
              </h1>
              <p className="text-xs sm:text-sm text-[#4E5969] dark:text-slate-400 mt-1">
                Explore On-Campus university labs and Off-Campus corporate/hospital opportunities in IT, Engineering, Management, and Healthcare.
              </p>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-[22px] border border-[#E7EAF3] dark:border-slate-700 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search domain, company, city..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              />
            </div>

            <div>
              <select
                value={campusFilter}
                onChange={(e) => setCampusFilter(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              >
                <option value="ALL">All Modes (On-Campus & Off-Campus)</option>
                <option value="ON_CAMPUS">🏛️ On-Campus (College Labs & Units)</option>
                <option value="OFF_CAMPUS">🏢 Off-Campus (Industry / Hospitals)</option>
              </select>
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
