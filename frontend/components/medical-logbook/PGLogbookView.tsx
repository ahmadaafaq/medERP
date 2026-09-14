'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, Plus, CheckCircle2, Clock, Search, Filter, Stethoscope, 
  BookOpen, Award, User, Calendar, ShieldCheck, AlertCircle, RefreshCw,
  ChevronRight, X, Sparkles, Building2
} from 'lucide-react';

interface PGRecord {
  id: string;
  student_id: string | null;
  student_name: string;
  rollno: string | null;
  pg_year: string;
  department_id: string | null;
  department_name?: string;
  category: string;
  title: string;
  case_date: string;
  patient_details: string | null;
  procedure_type: string | null;
  faculty_id: string | null;
  faculty_name: string | null;
  score: number | null;
  remarks: string | null;
  record_status: 'Pending' | 'Verified';
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
}

const CATEGORIES = [
  'Clinical Procedure',
  'Case Presentation',
  'Journal Club',
  'Thesis/Dissertation',
] as const;

const PROCEDURE_TYPES = [
  'Observed',
  'Assisted',
  'Performed Under Supervision',
  'Performed Independently',
] as const;

const PG_YEARS = ['JR-1', 'JR-2', 'JR-3'] as const;

export default function PGLogbookView() {
  const [records, setRecords] = useState<PGRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    student_name: '',
    rollno: '',
    pg_year: 'JR-1',
    category: 'Clinical Procedure',
    title: '',
    case_date: new Date().toISOString().split('T')[0],
    patient_details: '',
    procedure_type: 'Performed Under Supervision',
    faculty_name: '',
    score: '',
    remarks: '',
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const params = new URLSearchParams();
      if (selectedYear !== 'ALL') params.append('pgYear', selectedYear);
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
      if (selectedStatus !== 'ALL') params.append('recordStatus', selectedStatus);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      params.append('limit', '50');

      const res = await fetch(`/api/v1/medical-logbook/pg-logbook?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Failed to fetch PG Logbook records');
      const json = await res.json();
      const payload = json.data !== undefined ? json.data : json;
      setRecords(payload.items || []);
      setTotalCount(payload.total || 0);
    } catch (err: any) {
      console.error('Error loading PG records:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedCategory, selectedStatus, searchQuery]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('Please enter a case / procedure title', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token') || '';
      const payload = {
        student_name: formData.student_name.trim() || undefined,
        rollno: formData.rollno.trim() || undefined,
        pg_year: formData.pg_year,
        category: formData.category,
        title: formData.title.trim(),
        case_date: formData.case_date,
        patient_details: formData.patient_details.trim() || undefined,
        procedure_type: formData.category === 'Clinical Procedure' ? formData.procedure_type : undefined,
        faculty_name: formData.faculty_name.trim() || undefined,
        score: formData.score ? parseFloat(formData.score) : undefined,
        remarks: formData.remarks.trim() || undefined,
      };

      const res = await fetch('/api/v1/medical-logbook/pg-logbook', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to save PG logbook record');
      }

      showToast('PG log record created successfully!');
      setIsModalOpen(false);
      setFormData({
        student_name: '',
        rollno: '',
        pg_year: 'JR-1',
        category: 'Clinical Procedure',
        title: '',
        case_date: new Date().toISOString().split('T')[0],
        patient_details: '',
        procedure_type: 'Performed Under Supervision',
        faculty_name: '',
        score: '',
        remarks: '',
      });
      fetchRecords();
    } catch (err: any) {
      showToast(err.message || 'Submission error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (recordId: string) => {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/v1/medical-logbook/pg-logbook/${recordId}/verify`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to verify record');
      }

      showToast('Record verified successfully!');
      // Optimistic update
      setRecords(prev => prev.map(r => r.id === recordId ? { ...r, record_status: 'Verified', verified_by: 'Faculty / HOD', verified_at: new Date().toISOString() } : r));
    } catch (err: any) {
      showToast(err.message || 'Verification error', 'error');
    }
  };

  // Stats calculation
  const verifiedCount = records.filter(r => r.record_status === 'Verified').length;
  const pendingCount = records.filter(r => r.record_status === 'Pending').length;
  const independentCount = records.filter(r => r.procedure_type === 'Performed Independently').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-white font-medium text-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
          toastMessage.type === 'success' ? 'bg-[#00C48C]' : 'bg-[#F04438]'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[22px] border border-[#E7EAF3] shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#5B4BFF] uppercase tracking-wider mb-1">
            <Stethoscope className="w-4 h-4" />
            Post-Graduate Medical Education (MD / MS)
          </div>
          <h1 className="text-2xl font-bold text-[#1B1E28]">PG Resident Clinical Logbook</h1>
          <p className="text-sm text-[#4E5969] mt-0.5">
            Log, supervise, and verify specialized clinical procedures, mortality/CPC meets, journal clubs, and thesis milestones for Junior & Senior Residents.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#5B4BFF] hover:bg-[#4a3ae0] text-white font-semibold rounded-xl text-sm transition-all shadow-md hover:shadow-lg active:scale-98"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Log PG Case / Procedure
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-[20px] border border-[#E7EAF3] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#5B4BFF]/10 text-[#5B4BFF] flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#1B1E28]">{totalCount}</div>
            <div className="text-xs font-medium text-[#4E5969]">Total Log Entries</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[20px] border border-[#E7EAF3] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#00C48C]/10 text-[#00C48C] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#1B1E28]">{verifiedCount}</div>
            <div className="text-xs font-medium text-[#4E5969]">Faculty Verified</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[20px] border border-[#E7EAF3] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FFB020]/10 text-[#FFB020] flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#1B1E28]">{pendingCount}</div>
            <div className="text-xs font-medium text-[#4E5969]">Pending Signoff</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[20px] border border-[#E7EAF3] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#F36C21]/10 text-[#F36C21] flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#1B1E28]">{independentCount}</div>
            <div className="text-xs font-medium text-[#4E5969]">Independent Procedures</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-5 rounded-[22px] border border-[#E7EAF3] shadow-sm space-y-4">
        {/* PG Year Selector Pills */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#E7EAF3] pb-4">
          <span className="text-xs font-semibold text-[#4E5969] uppercase tracking-wider mr-2">Residency Level:</span>
          {['ALL', ...PG_YEARS].map((yr) => (
            <button
              key={yr}
              onClick={() => setSelectedYear(yr)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedYear === yr
                  ? 'bg-[#2D2575] text-white shadow-sm ring-2 ring-[#2D2575]/20'
                  : 'bg-[#F6F8FC] text-[#4E5969] hover:bg-[#E7EAF3]'
              }`}
            >
              {yr === 'ALL' ? 'All PG Years' : yr === 'JR-1' ? '1st Year (JR-1)' : yr === 'JR-2' ? '2nd Year (JR-2)' : '3rd Year (JR-3)'}
            </button>
          ))}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-3 pr-8 py-2 bg-[#F6F8FC] border border-[#E7EAF3] rounded-xl text-xs font-semibold text-[#1B1E28] focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              >
                <option value="ALL">All Categories</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="pl-3 pr-8 py-2 bg-[#F6F8FC] border border-[#E7EAF3] rounded-xl text-xs font-semibold text-[#1B1E28] focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              >
                <option value="ALL">All Statuses</option>
                <option value="Pending">Pending Review</option>
                <option value="Verified">Verified</option>
              </select>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#4E5969] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search case, resident, roll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#F6F8FC] border border-[#E7EAF3] rounded-xl text-xs text-[#1B1E28] focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Main Records Table */}
      <div className="bg-white rounded-[22px] border border-[#E7EAF3] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F6F8FC] border-b border-[#E7EAF3] text-[11px] font-bold text-[#4E5969] uppercase tracking-wider">
                <th className="py-3.5 px-4">Date & Level</th>
                <th className="py-3.5 px-4">Resident Information</th>
                <th className="py-3.5 px-4">Category & Procedure</th>
                <th className="py-3.5 px-4">Procedure Type</th>
                <th className="py-3.5 px-4">Faculty In-Charge</th>
                <th className="py-3.5 px-4 text-center">Score</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7EAF3] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#4E5969]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#5B4BFF]" />
                      <span>Loading PG logbook entries...</span>
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto text-[#4E5969]">
                      <Stethoscope className="w-10 h-10 text-gray-300 stroke-1" />
                      <p className="font-semibold text-base text-[#1B1E28]">No PG Logbook Records Found</p>
                      <p className="text-xs text-gray-500">
                        No case or procedure records match your current filters. Click "Log PG Case / Procedure" above to add a new clinical entry.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F6F8FC]/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#1B1E28]">{r.case_date}</div>
                      <span className="inline-block mt-0.5 px-2 py-0.5 bg-[#2D2575]/10 text-[#2D2575] font-bold text-[10px] rounded-md">
                        {r.pg_year}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#1B1E28]">{r.student_name}</div>
                      <div className="text-[11px] text-[#4E5969]">
                        {r.rollno ? `Roll: ${r.rollno}` : 'Resident'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="inline-block text-[10px] font-semibold text-[#5B4BFF] uppercase tracking-wider mb-0.5">
                        {r.category}
                      </span>
                      <div className="font-semibold text-[#1B1E28] line-clamp-1">{r.title}</div>
                      {r.patient_details && (
                        <div className="text-[11px] text-[#4E5969] line-clamp-1 italic">
                          Pt: {r.patient_details}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {r.procedure_type ? (
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                          r.procedure_type === 'Performed Independently'
                            ? 'bg-[#00C48C]/15 text-[#00875A]'
                            : r.procedure_type === 'Performed Under Supervision'
                            ? 'bg-[#5B4BFF]/10 text-[#5B4BFF]'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {r.procedure_type}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#1B1E28]">{r.faculty_name || 'Assigned Faculty'}</div>
                      {r.verified_by && (
                        <div className="text-[10px] text-[#00C48C] font-semibold">
                          ✓ Signed by {r.verified_by}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#1B1E28]">
                      {r.score !== null ? `${r.score}/10` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        r.record_status === 'Verified'
                          ? 'bg-[#00C48C]/10 text-[#00C48C]'
                          : 'bg-[#FFB020]/15 text-[#D97706]'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          r.record_status === 'Verified' ? 'bg-[#00C48C]' : 'bg-[#FFB020]'
                        }`} />
                        {r.record_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {r.record_status === 'Pending' ? (
                        <button
                          onClick={() => handleVerify(r.id)}
                          className="px-3 py-1.5 bg-[#00C48C] hover:bg-[#00a877] text-white font-semibold rounded-lg text-xs transition-all shadow-sm"
                        >
                          Verify Record
                        </button>
                      ) : (
                        <span className="text-[11px] font-medium text-[#00C48C] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[24px] shadow-2xl border border-[#E7EAF3] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7EAF3] bg-[#F6F8FC]">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-[#5B4BFF]" />
                <h3 className="font-bold text-lg text-[#1B1E28]">New PG Resident Clinical Entry</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1B1E28] uppercase tracking-wider mb-1">
                    Resident Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Aryan Sharma"
                    value={formData.student_name}
                    onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F6F8FC] border border-[#E7EAF3] rounded-xl text-xs text-[#1B1E28] focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1B1E28] uppercase tracking-wider mb-1">
                    Roll / Reg. Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PG/2024/MS-014"
                    value={formData.rollno}
                    onChange={(e) => setFormData({ ...formData, rollno: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F6F8FC] border border-[#E7EAF3] rounded-xl text-xs text-[#1B1E28] focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1B1E28] uppercase tracking-wider mb-1">
                    Residency Year
                  </label>
                  <select
                    value={formData.pg_year}
                    onChange={(e) => setFormData({ ...formData, pg_year: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F6F8FC] border border-[#E7EAF3] rounded-xl text-xs font-semibold text-[#1B1E28] focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                  >
                    <option value="JR-1">JR-1 (1st Year)</option>
                    <option value="JR-2">JR-2 (2nd Year)</option>
                    <option value="JR-3">JR-3 (3rd Year)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1B1E28] uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F6F8FC] border border-[#E7EAF3] rounded-xl text-xs font-semibold text-[#1B1E28] focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1B1E28] uppercase tracking-wider mb-1">
                    Date of Entry
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.case_date}
                    onChange={(e) => setFormData({ ...formData, case_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F6F8FC] border border-[#E7EAF3] rounded-xl text-xs text-[#1B1E28] focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1B1E28] uppercase tracking-wider mb-1">
                  Procedure / Case Presentation Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Laparoscopic Appendectomy / CPC Case Presentation on ARDS"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F6F8FC] border border-[#E7EAF3] rounded-xl text-xs text-[#1B1E28] focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                />
              </div>

              {formData.category === 'Clinical Procedure' && (
                <div>
                  <label className="block text-xs font-bold text-[#1B1E28] uppercase tracking-wider mb-1">
                    NMC Procedural Involvement Level
                  </label>
                  <select
                    value={formData.procedure_type}
                    onChange={(e) => setFormData({ ...formData, procedure_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F6F8FC] border border-[#E7EAF3] rounded-xl text-xs font-semibold text-[#1B1E28] focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                  >
                    {PROCEDURE_TYPES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#1B1E28] uppercase tracking-wider mb-1">
                  Patient Clinical Details (Age, Gender, IPD/OPD No., Diagnosis)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 42M, IPD-89211, Acute appendicitis with localized peritonitis"
                  value={formData.patient_details}
                  onChange={(e) => setFormData({ ...formData, patient_details: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F6F8FC] border border-[#E7EAF3] rounded-xl text-xs text-[#1B1E28] focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1B1E28] uppercase tracking-wider mb-1">
                    Faculty Guide / In-Charge
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Prof. R. K. Singhal"
                    value={formData.faculty_name}
                    onChange={(e) => setFormData({ ...formData, faculty_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F6F8FC] border border-[#E7EAF3] rounded-xl text-xs text-[#1B1E28] focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1B1E28] uppercase tracking-wider mb-1">
                    Evaluation Score (out of 10)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    placeholder="e.g. 8.5"
                    value={formData.score}
                    onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F6F8FC] border border-[#E7EAF3] rounded-xl text-xs text-[#1B1E28] focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1B1E28] uppercase tracking-wider mb-1">
                  Supervisor Notes / Clinical Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="Key procedural steps demonstrated, complications handled, or critique points..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F6F8FC] border border-[#E7EAF3] rounded-xl text-xs text-[#1B1E28] focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E7EAF3]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-[#F6F8FC] hover:bg-[#E7EAF3] text-[#4E5969] font-semibold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#5B4BFF] hover:bg-[#4a3ae0] text-white font-semibold rounded-xl text-xs transition-all shadow-md flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Save PG Log Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
