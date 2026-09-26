'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { X, Search, Filter, Award, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

export interface MarksResultItem {
  id: string;
  studentName: string;
  rollNo: string;
  paperName?: string;
  paperCode?: string;
  marksObtained: string;
  maxMarks: string;
  percentage: string;
  status: string;
  evaluatedAt?: string;
}

export interface MarksSummaryData {
  totalEvaluated: number;
  averageMarks: number;
  maxMarks: number;
  passingRate: string;
  recentList: MarksResultItem[];
}

interface StudentAssessmentMarksCardProps {
  role?: 'admin' | 'faculty' | 'clerk' | string;
  initialData?: MarksSummaryData;
  collegeName?: string;
  className?: string;
}

const MODAL_PAGE_SIZE = 6;

export default function StudentAssessmentMarksCard({
  role = 'admin',
  initialData,
  collegeName = 'SRMS CET',
  className = '',
}: StudentAssessmentMarksCardProps) {
  const [data, setData] = useState<MarksSummaryData>(
    initialData && initialData.recentList && initialData.recentList.length > 0
      ? initialData
      : {
          totalEvaluated: initialData?.totalEvaluated || 0,
          averageMarks: initialData?.averageMarks || 0,
          maxMarks: initialData?.maxMarks || 50,
          passingRate: initialData?.passingRate || '0%',
          recentList: initialData?.recentList || [],
        }
  );

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Modal State
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalFilterStatus, setModalFilterStatus] = useState<'all' | 'evaluated' | 'pending'>('all');
  const [modalPage, setModalPage] = useState(1);

  // Self-fetch if initialData not provided or empty
  useEffect(() => {
    if (initialData && initialData.recentList && initialData.recentList.length > 0) {
      setData(initialData);
      return;
    }

    const fetchMarks = async () => {
      setLoading(true);
      try {
        const savedSlug =
          typeof window !== 'undefined'
            ? localStorage.getItem('tenantSlug') ||
              localStorage.getItem('selectedTenant') ||
              'srms-cet-bareilly'
            : 'srms-cet-bareilly';

        const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
        const headers: Record<string, string> = {
          'x-tenant-slug': savedSlug,
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/analytics/dashboard/college?tenant=${savedSlug}`, { headers });
        if (res.ok) {
          const json = await res.json();
          if (json.marksResults) {
            setData(json.marksResults);
          }
        }
      } catch (err) {
        console.error('[StudentAssessmentMarksCard] Error fetching marks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMarks();
  }, [initialData]);

  // Exactly 2 records displayed on dashboard card
  const cardRecords = useMemo(() => {
    return (data.recentList || []).slice(0, 2);
  }, [data.recentList]);

  // Modal filtered and paginated records
  const modalFilteredList = useMemo(() => {
    const list = data.recentList || [];
    return list.filter((item) => {
      // Status filter
      if (modalFilterStatus === 'evaluated' && !item.status.toLowerCase().includes('eval')) return false;
      if (modalFilterStatus === 'pending' && item.status.toLowerCase().includes('eval')) return false;

      // Search filter
      if (modalSearchTerm.trim()) {
        const q = modalSearchTerm.toLowerCase().trim();
        const matchesName = item.studentName?.toLowerCase().includes(q);
        const matchesRoll = item.rollNo?.toLowerCase().includes(q);
        const matchesPaper = item.paperName?.toLowerCase().includes(q);
        const matchesCode = item.paperCode?.toLowerCase().includes(q);
        return matchesName || matchesRoll || matchesPaper || matchesCode;
      }
      return true;
    });
  }, [data.recentList, modalSearchTerm, modalFilterStatus]);

  const modalTotalPages = Math.max(1, Math.ceil(modalFilteredList.length / MODAL_PAGE_SIZE));
  const modalValidPage = Math.min(modalPage, modalTotalPages);
  const modalStartIndex = (modalValidPage - 1) * MODAL_PAGE_SIZE;
  const modalPaginatedList = modalFilteredList.slice(modalStartIndex, modalStartIndex + MODAL_PAGE_SIZE);

  const handleOpenModal = () => {
    setModalSearchTerm('');
    setModalFilterStatus('all');
    setModalPage(1);
    setShowModal(true);
  };

  // Close modal on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false);
    };
    if (showModal) {
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [showModal]);

  const marksEntryHref =
    role === 'clerk'
      ? '/dashboard/clerk/assessment-marks'
      : role === 'faculty'
      ? '/dashboard/faculty/assessment-marks'
      : '/dashboard/admin/assessment-marks';

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[22px] p-5 sm:p-6 shadow-sm flex flex-col h-full ${className}`}
    >
      {/* Header with Title, Marks Entry Link and See All Button */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5 gap-2 shrink-0">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2 truncate">
            <span className="text-base">📊</span>
            <span className="truncate">Student Assessment & Marks Results</span>
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
            Real-time evaluated records for {collegeName}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={marksEntryHref}
            className="text-xs font-bold text-[#5B4BFF] dark:text-indigo-400 hover:underline hidden sm:inline-block"
          >
            Marks Entry ➔
          </Link>
          <button
            type="button"
            onClick={handleOpenModal}
            className="px-2.5 py-1 rounded-xl bg-[#5B4BFF] hover:bg-[#4838EE] text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            title="View all records in modal popup"
          >
            <span>See All</span>
            <span className="px-1.5 py-0.2 bg-white/20 text-white text-[10px] rounded-full font-extrabold">
              {data.recentList.length}
            </span>
          </button>
        </div>
      </div>

      {/* Summary Badges: Evaluated, Avg Score, Pass Rate */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 my-3 shrink-0">
        <div className="p-2.5 sm:p-3 bg-[#F6F8FC] dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-center">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block tracking-wider">
            Evaluated
          </span>
          <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            {data.totalEvaluated}
          </span>
        </div>
        <div className="p-2.5 sm:p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-200/60 dark:border-indigo-800/60 text-center">
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase block tracking-wider">
            Avg Score
          </span>
          <span className="text-base sm:text-lg font-black text-[#5B4BFF] dark:text-indigo-300 truncate block">
            {data.averageMarks} / {data.maxMarks}
          </span>
        </div>
        <div className="p-2.5 sm:p-3 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60 text-center">
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase block tracking-wider">
            Pass Rate
          </span>
          <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
            {data.passingRate}
          </span>
        </div>
      </div>

      {/* Recent Results Table (Exactly 2 Records on Card) */}
      <div className="flex-1 overflow-x-auto min-h-0">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#F6F8FC] dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <th className="p-2.5">Student / Roll</th>
              <th className="p-2.5">Marks</th>
              <th className="p-2.5 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {loading ? (
              <tr>
                <td colSpan={3} className="p-6 text-center text-slate-400">
                  <div className="inline-block w-5 h-5 rounded-full border-2 border-[#5B4BFF] border-t-transparent animate-spin mr-2 align-middle" />
                  <span className="text-xs font-bold">Loading marks records...</span>
                </td>
              </tr>
            ) : cardRecords.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-6 text-center text-slate-400 text-xs font-bold">
                  No assessment marks submitted yet.
                </td>
              </tr>
            ) : (
              cardRecords.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-2.5">
                    <span className="font-bold text-slate-900 dark:text-white block">{item.studentName}</span>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{item.rollNo}</span>
                  </td>
                  <td className="p-2.5">
                    <span className="font-extrabold text-[#5B4BFF] dark:text-indigo-400">{item.marksObtained}</span>
                    <span className="text-[10px] text-slate-400"> / {item.maxMarks}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 ml-1.5 font-bold">
                      ({item.percentage})
                    </span>
                  </td>
                  <td className="p-2.5 text-right">
                    <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 whitespace-nowrap inline-flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" /> {item.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* See All Bottom Banner Button */}
      {data.recentList.length > 2 && (
        <button
          type="button"
          onClick={handleOpenModal}
          className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-[#5B4BFF] dark:text-indigo-300 font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 border border-slate-200/80 dark:border-slate-700 cursor-pointer group shadow-2xs mt-2 shrink-0"
        >
          <span>See All {data.recentList.length} Student Marks Records with Pagination</span>
          <span className="group-hover:translate-x-1 transition-transform">➔</span>
        </button>
      )}

      {/* Modal Popup: All Evaluated Records with Pagination */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[24px] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-slate-50/60 dark:bg-slate-850/60">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5B4BFF] to-[#7867FF] flex items-center justify-center text-white text-lg shadow-md shadow-indigo-500/20 shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-[#1B1E28] dark:text-white">
                      Student Assessment & Marks Results — All Records
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-[#5B4BFF]/10 text-[#5B4BFF] dark:text-indigo-300 text-[10px] font-black border border-[#5B4BFF]/20">
                      {modalFilteredList.length} Records
                    </span>
                  </div>
                  <p className="text-xs text-[#4E5969] dark:text-slate-400 font-semibold truncate mt-0.5">
                    {data.totalEvaluated} Total Evaluated • Avg: {data.averageMarks}/{data.maxMarks} • Pass Rate: {data.passingRate}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer font-bold shrink-0"
                title="Close Modal (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Controls: Search & Status Filter */}
            <div className="p-3 sm:p-4 border-b border-[#E7EAF3] dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-[#F6F8FC]/50 dark:bg-slate-800/40 shrink-0">
              <div className="relative min-w-[200px] max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by student, roll no, paper..."
                  value={modalSearchTerm}
                  onChange={(e) => {
                    setModalSearchTerm(e.target.value);
                    setModalPage(1);
                  }}
                  className="w-full text-xs font-bold py-1.5 pl-8 pr-3 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#5B4BFF]/30"
                />
              </div>

              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setModalFilterStatus('all');
                    setModalPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg transition-all text-xs font-bold cursor-pointer ${
                    modalFilterStatus === 'all'
                      ? 'bg-[#5B4BFF] text-white shadow-xs font-extrabold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All ({data.recentList.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalFilterStatus('evaluated');
                    setModalPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg transition-all text-xs font-bold cursor-pointer ${
                    modalFilterStatus === 'evaluated'
                      ? 'bg-emerald-600 text-white shadow-xs font-extrabold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Evaluated
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalFilterStatus('pending');
                    setModalPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg transition-all text-xs font-bold cursor-pointer ${
                    modalFilterStatus === 'pending'
                      ? 'bg-amber-600 text-white shadow-xs font-extrabold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Pending
                </button>
              </div>
            </div>

            {/* Modal Body: Paginated Table */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F6F8FC] dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3 pl-4">#</th>
                    <th className="p-3">Student & Roll No</th>
                    <th className="p-3">Assessment Paper</th>
                    <th className="p-3">Score & Percentage</th>
                    <th className="p-3 text-right pr-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {modalPaginatedList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 text-xs font-bold">
                        No student records match this search or filter.
                      </td>
                    </tr>
                  ) : (
                    modalPaginatedList.map((item, idx) => {
                      const recordNum = modalStartIndex + idx + 1;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-3 pl-4 text-slate-400 font-mono text-[11px]">#{recordNum}</td>
                          <td className="p-3">
                            <span className="font-bold text-slate-900 dark:text-white block text-xs">
                              {item.studentName}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                              {item.rollNo}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
                              {item.paperName || 'Assessment Test'}
                            </span>
                            <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                              Code: #{item.paperCode || 'EXAM'}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-[#5B4BFF] dark:text-indigo-400 text-xs">
                                {item.marksObtained}
                              </span>
                              <span className="text-[10px] text-slate-400">/ {item.maxMarks}</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
                                {item.percentage}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-right pr-4">
                            <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 whitespace-nowrap inline-flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" /> {item.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer with Interactive Pagination */}
            <div className="p-3.5 sm:p-4 border-t border-[#E7EAF3] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-850 flex items-center justify-between gap-3 flex-wrap shrink-0">
              <p className="text-xs font-bold text-[#4E5969] dark:text-slate-400">
                Showing <strong className="text-[#1B1E28] dark:text-white">{modalStartIndex + 1}</strong> to{' '}
                <strong className="text-[#1B1E28] dark:text-white">
                  {Math.min(modalStartIndex + MODAL_PAGE_SIZE, modalFilteredList.length)}
                </strong>{' '}
                of <strong className="text-[#1B1E28] dark:text-white">{modalFilteredList.length}</strong> Records
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalPage((p) => Math.max(1, p - 1))}
                  disabled={modalValidPage === 1}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>
                <span className="text-xs font-black text-[#5B4BFF] dark:text-indigo-300 px-2">
                  Page {modalValidPage} of {modalTotalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setModalPage((p) => Math.min(modalTotalPages, p + 1))}
                  disabled={modalValidPage >= modalTotalPages}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="ml-2 px-3.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-black text-slate-800 dark:text-white transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
