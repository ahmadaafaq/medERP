'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { X, Search, Calendar, ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react';

export interface TimetableSlotItem {
  id: string;
  dayName: string;
  timeRange: string;
  subjectName: string;
  subjectCode: string;
  facultyName: string;
  departmentName: string;
  room: string;
}

export interface TimetableData {
  hasSchedule: boolean;
  departmentExists: boolean;
  departmentName: string;
  totalSlots: number;
  slots: TimetableSlotItem[];
}

interface DepartmentTimetableCardProps {
  role?: 'admin' | 'faculty' | 'clerk' | string;
  initialData?: TimetableData;
  className?: string;
}

const MODAL_PAGE_SIZE = 6;
const DAYS_ORDER = ['All Days', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DepartmentTimetableCard({
  role = 'admin',
  initialData,
  className = '',
}: DepartmentTimetableCardProps) {
  const [data, setData] = useState<TimetableData>(
    initialData && initialData.slots && initialData.slots.length > 0
      ? initialData
      : {
          hasSchedule: initialData?.hasSchedule ?? true,
          departmentExists: initialData?.departmentExists ?? true,
          departmentName: initialData?.departmentName || 'Computer Science & Engineering',
          totalSlots: initialData?.totalSlots || 0,
          slots: initialData?.slots || [],
        }
  );

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Modal filters & pagination
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalSelectedDay, setModalSelectedDay] = useState('All Days');
  const [modalPage, setModalPage] = useState(1);

  // Self-fetch if initialData not provided or empty
  useEffect(() => {
    if (initialData && initialData.slots && initialData.slots.length > 0) {
      setData(initialData);
      return;
    }

    const fetchTimetable = async () => {
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
          if (json.timetable) {
            setData(json.timetable);
          }
        }
      } catch (err) {
        console.error('[DepartmentTimetableCard] Error fetching timetable:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, [initialData]);

  // Unique slots de-duplicated
  const uniqueSlots = useMemo(() => {
    const raw = data.slots || [];
    return raw.filter(
      (slot, idx, arr) =>
        arr.findIndex(
          (s) =>
            s.dayName === slot.dayName &&
            s.timeRange === slot.timeRange &&
            s.subjectName === slot.subjectName &&
            s.facultyName === slot.facultyName &&
            s.room === slot.room
        ) === idx
    );
  }, [data.slots]);

  // Exactly 2 records for dashboard card view
  const cardRecords = useMemo(() => {
    return uniqueSlots.slice(0, 2);
  }, [uniqueSlots]);

  // Filtered slots for modal
  const modalFilteredSlots = useMemo(() => {
    return uniqueSlots.filter((slot) => {
      // Day filter
      if (modalSelectedDay !== 'All Days' && slot.dayName !== modalSelectedDay) {
        return false;
      }

      // Search filter
      if (modalSearchTerm.trim()) {
        const q = modalSearchTerm.toLowerCase().trim();
        const matchesSubj = slot.subjectName?.toLowerCase().includes(q);
        const matchesCode = slot.subjectCode?.toLowerCase().includes(q);
        const matchesFac = slot.facultyName?.toLowerCase().includes(q);
        const matchesDept = slot.departmentName?.toLowerCase().includes(q);
        const matchesRoom = slot.room?.toLowerCase().includes(q);
        const matchesDay = slot.dayName?.toLowerCase().includes(q);
        const matchesTime = slot.timeRange?.toLowerCase().includes(q);
        return matchesSubj || matchesCode || matchesFac || matchesDept || matchesRoom || matchesDay || matchesTime;
      }

      return true;
    });
  }, [uniqueSlots, modalSelectedDay, modalSearchTerm]);

  const modalTotalPages = Math.max(1, Math.ceil(modalFilteredSlots.length / MODAL_PAGE_SIZE));
  const modalValidPage = Math.min(modalPage, modalTotalPages);
  const modalStartIndex = (modalValidPage - 1) * MODAL_PAGE_SIZE;
  const modalPaginatedSlots = modalFilteredSlots.slice(modalStartIndex, modalStartIndex + MODAL_PAGE_SIZE);

  const handleOpenModal = () => {
    setModalSearchTerm('');
    setModalSelectedDay('All Days');
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

  const timetableDesignHref =
    role === 'clerk'
      ? '/dashboard/clerk/schedule'
      : role === 'faculty'
      ? '/dashboard/faculty/schedule'
      : '/dashboard/admin/timetable-design';

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[22px] p-5 sm:p-6 shadow-sm flex flex-col h-full ${className}`}
    >
      {/* Header with Title, Active Schedule Badge, and See All Button */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5 gap-2 shrink-0">
        <div className="space-y-0.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2 truncate">
              <span className="text-base">📅</span>
              <span className="truncate">Current College & Department Timetable</span>
            </h2>
            <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 shrink-0">
              Active Schedule
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
            {data.departmentExists ? `Department: ${data.departmentName}` : 'Department Schedule'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={timetableDesignHref}
            className="text-xs font-bold text-[#5B4BFF] dark:text-indigo-400 hover:underline hidden sm:inline-block"
          >
            Design ➔
          </Link>
          <button
            type="button"
            onClick={handleOpenModal}
            className="px-3 py-1.5 bg-[#5B4BFF] hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
            title="View all timetable slots in modal popup"
          >
            <span>See All</span>
            <span className="px-1.5 py-0.2 bg-white/20 text-white text-[10px] rounded-full font-extrabold">
              {uniqueSlots.length}
            </span>
          </button>
        </div>
      </div>

      {/* Schedule Table (Exactly 2 Records on Card) */}
      <div className="flex-1 overflow-x-auto min-h-0 pt-2">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#F6F8FC] dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <th className="p-3 pl-4">Day & Time</th>
              <th className="p-3">Subject</th>
              <th className="p-3">Faculty Member</th>
              <th className="p-3 pr-4">Room / Lab</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {loading ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-400">
                  <div className="inline-block w-5 h-5 rounded-full border-2 border-[#5B4BFF] border-t-transparent animate-spin mr-2 align-middle" />
                  <span className="text-xs font-bold">Loading college timetable slots...</span>
                </td>
              </tr>
            ) : cardRecords.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-400 text-xs font-bold">
                  No timetable slots scheduled for this department. Click &apos;See All&apos; to configure timetable.
                </td>
              </tr>
            ) : (
              cardRecords.map((slot) => (
                <tr key={slot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-3 pl-4 whitespace-nowrap">
                    <span className="font-extrabold text-slate-900 dark:text-white block">{slot.dayName}</span>
                    <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-200/50 dark:border-indigo-800/50 inline-flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5" /> {slot.timeRange}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-slate-900 dark:text-white block text-xs">{slot.subjectName}</span>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      Code: #{slot.subjectCode}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 block text-xs">
                      {slot.facultyName}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{slot.departmentName}</span>
                  </td>
                  <td className="p-3 pr-4 whitespace-nowrap">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-2 py-1 rounded-lg text-[11px] border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-500" /> {slot.room}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* See All Bottom Banner Button */}
      {uniqueSlots.length > 2 && (
        <button
          type="button"
          onClick={handleOpenModal}
          className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-[#5B4BFF] dark:text-indigo-300 font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 border border-slate-200/80 dark:border-slate-700 cursor-pointer group shadow-2xs mt-2 shrink-0"
        >
          <span>See All {uniqueSlots.length} Timetable Slots with Pagination</span>
          <span className="group-hover:translate-x-1 transition-transform">➔</span>
        </button>
      )}

      {/* Modal Popup: All Timetable Slots with Pagination */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[24px] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-slate-50/60 dark:bg-slate-850/60">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5B4BFF] to-[#7867FF] flex items-center justify-center text-white text-lg shadow-md shadow-indigo-500/20 shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-[#1B1E28] dark:text-white">
                      Current College & Department Timetable — Full Schedule
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-[#5B4BFF]/10 text-[#5B4BFF] dark:text-indigo-300 text-[10px] font-black border border-[#5B4BFF]/20">
                      {modalFilteredSlots.length} Slots
                    </span>
                  </div>
                  <p className="text-xs text-[#4E5969] dark:text-slate-400 font-semibold truncate mt-0.5">
                    {data.departmentName} • Academic Timetable Registry
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

            {/* Modal Controls: Search & Day Filters */}
            <div className="p-3 sm:p-4 border-b border-[#E7EAF3] dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 bg-[#F6F8FC]/50 dark:bg-slate-800/40 shrink-0">
              <div className="relative min-w-[200px] max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search subject, faculty, code, room..."
                  value={modalSearchTerm}
                  onChange={(e) => {
                    setModalSearchTerm(e.target.value);
                    setModalPage(1);
                  }}
                  className="w-full text-xs font-bold py-1.5 pl-8 pr-3 rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#5B4BFF]/30"
                />
              </div>

              {/* Day filter pills */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold overflow-x-auto max-w-full shrink-0">
                {DAYS_ORDER.map((day) => {
                  const count =
                    day === 'All Days' ? uniqueSlots.length : uniqueSlots.filter((s) => s.dayName === day).length;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        setModalSelectedDay(day);
                        setModalPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg transition-all text-[11px] font-bold whitespace-nowrap cursor-pointer ${
                        modalSelectedDay === day
                          ? 'bg-[#5B4BFF] text-white shadow-xs font-extrabold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {day} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Body: Paginated Table */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F6F8FC] dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3 pl-4">#</th>
                    <th className="p-3">Day & Time</th>
                    <th className="p-3">Subject & Code</th>
                    <th className="p-3">Faculty Member</th>
                    <th className="p-3">Department</th>
                    <th className="p-3 pr-4 text-right">Room / Lab</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {modalPaginatedSlots.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs font-bold">
                        No timetable slots match this search or day filter.
                      </td>
                    </tr>
                  ) : (
                    modalPaginatedSlots.map((slot, idx) => {
                      const recordNum = modalStartIndex + idx + 1;
                      return (
                        <tr key={slot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-3 pl-4 text-slate-400 font-mono text-[11px]">#{recordNum}</td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="font-extrabold text-slate-900 dark:text-white block text-xs">
                              {slot.dayName}
                            </span>
                            <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-200/50 dark:border-indigo-800/50 inline-flex items-center gap-1 mt-0.5">
                              <Clock className="w-2.5 h-2.5" /> {slot.timeRange}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-900 dark:text-white block text-xs">
                              {slot.subjectName}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                              Code: #{slot.subjectCode}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-extrabold text-slate-800 dark:text-slate-200 block text-xs">
                              {slot.facultyName}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-slate-600 dark:text-slate-400 text-xs font-medium">
                              {slot.departmentName}
                            </span>
                          </td>
                          <td className="p-3 pr-4 text-right whitespace-nowrap">
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-2 py-1 rounded-lg text-[11px] border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-rose-500" /> {slot.room}
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
                  {Math.min(modalStartIndex + MODAL_PAGE_SIZE, modalFilteredSlots.length)}
                </strong>{' '}
                of <strong className="text-[#1B1E28] dark:text-white">{modalFilteredSlots.length}</strong> Slots
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
