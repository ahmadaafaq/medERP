'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import {
  ShieldCheck, FileText, CheckCircle2, AlertTriangle, RotateCcw,
  Sparkles, Layers, BookOpen, ChevronRight, ArrowUpRight, BarChart3, Users
} from 'lucide-react';
import { getTenantSlug } from '../../../hooks/useTenantAcademicData';
import { formatCourseName, formatSemester } from '../../../lib/exam-formatters';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

function getH() {
  if (typeof window === 'undefined') return { slug: '', headers: {} as any };
  const slug = getTenantSlug() || 'default';
  const token = localStorage.getItem('token') || '';
  return {
    slug,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'x-tenant-slug': slug,
      'Content-Type': 'application/json',
    },
  };
}

export default function DQACDashboardPage() {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const { slug, headers } = getH();
      let list: any[] = [];
      try {
        const res = await fetch(`/api/v1/exams/papers?tenant=${slug}&role=DQAC`, {
          headers: { ...headers, 'x-tenant-slug': slug, 'x-user-role': 'DQAC' },
          cache: 'no-store',
        });
        if (res.ok) {
          const d = await res.json();
          list = Array.isArray(d) ? d : (d.data || []);
        }
      } catch {
        const res2 = await fetch(`${API_BASE}/exams/papers?tenant=${slug}&role=DQAC`, { headers, cache: 'no-store' });
        const d2 = await res2.json();
        list = Array.isArray(d2) ? d2 : (d2.data || []);
      }
      setPapers(list);
    } catch {
      setPapers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingCount = papers.filter(p => p.status === 'PENDING_HOD_APPROVAL' || p.status === 'PENDING_DQAC_APPROVAL' || p.status === 'RESUBMITTED').length;
  const dqacApprovedCount = papers.filter(p => p.status === 'DQAC_APPROVED').length;
  const hodApprovedCount = papers.filter(p => p.status === 'HOD_APPROVED' || p.status === 'PUBLISHED').length;
  const changesCount = papers.filter(p => p.status === 'CHANGES_REQUESTED').length;

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="dqac" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Department Quality Assurance Cell (DQAC)" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Welcome Banner */}
          <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-r from-[#2D2575] via-[#3B3299] to-[#5B4BFF] p-6 sm:p-8 text-white shadow-xl">
            <div className="relative z-10 max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-black uppercase tracking-wider text-orange-300 border border-white/15">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Academic Quality &amp; Confidentiality Cell</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Departmental Quality Assurance Console
              </h1>
              <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
                Audit question paper standards, enforce Bloom&apos;s cognitive levels, assign section set allocations, and protect confidential examination sets before HOD live release.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  href="/dashboard/dqac/qp-approvals"
                  className="px-4 py-2 rounded-xl bg-[#F36C21] hover:bg-[#E05C10] text-white text-xs font-black shadow-md transition-all flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4" />
                  <span>Review Question Paper Approvals ({pendingCount})</span>
                </Link>
                <Link
                  href="/dashboard/hod/question-bank"
                  className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-black backdrop-blur-md border border-white/20 transition-all flex items-center gap-1.5"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Department Question Bank</span>
                </Link>
              </div>
            </div>
            <div className="absolute right-4 bottom-2 opacity-10 pointer-events-none hidden md:block">
              <ShieldCheck className="w-64 h-64 text-white" />
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Audit</span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-600">{pendingCount}</div>
              <p className="text-[11px] text-slate-400">Papers awaiting DQAC quality review</p>
            </div>

            <div className="p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">DQAC Approved</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-indigo-600">{dqacApprovedCount}</div>
              <p className="text-[11px] text-slate-400">Quality verified, sets allocated</p>
            </div>

            <div className="p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">HOD Authorized</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-600">{hodApprovedCount}</div>
              <p className="text-[11px] text-slate-400">Authorized for examination print</p>
            </div>

            <div className="p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Revisions Requested</span>
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
                  <RotateCcw className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-rose-600">{changesCount}</div>
              <p className="text-[11px] text-slate-400">Returned to faculty for question revision</p>
            </div>
          </div>

          {/* Quality Assurance Protocols & Rules */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#5B4BFF]/10 text-[#5B4BFF] flex items-center justify-center font-black">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-[#1B1E28] dark:text-white">
                      Recent Question Paper Submissions
                    </h2>
                    <p className="text-[11px] text-slate-400">Department submissions ready for quality review</p>
                  </div>
                </div>
                <Link
                  href="/dashboard/dqac/qp-approvals"
                  className="text-xs font-bold text-[#5B4BFF] hover:underline flex items-center gap-1"
                >
                  <span>View All Approvals</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
                  Loading department question papers...
                </div>
              ) : papers.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400 space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-slate-300" />
                  <p>No question papers found for your department.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Paper / Code</th>
                        <th className="py-2.5 px-3">Course &amp; Sem</th>
                        <th className="py-2.5 px-3">Set Variant</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {papers.slice(0, 5).map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3 font-bold text-[#1B1E28] dark:text-white">
                            <div>{p.name}</div>
                            <span className="text-[10px] font-mono text-slate-400">{p.code}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                            <div>{formatCourseName(p.course_cd, p.course_name)}</div>
                            <span className="text-[10px] text-slate-400">{formatSemester(p.semester)}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200 dark:border-indigo-800">
                              📑 {p.paper_set || 'Set A'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <Link
                              href="/dashboard/dqac/qp-approvals"
                              className="px-2.5 py-1 rounded-lg bg-[#5B4BFF] hover:bg-[#4A3AFF] text-white text-[11px] font-bold transition-all inline-flex items-center gap-1 shadow-xs"
                            >
                              <span>Audit</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Quality Directives & Confidentiality Card */}
            <div className="rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-[#F36C21] flex items-center justify-center font-black">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#1B1E28] dark:text-white">
                    DQAC Quality Directives
                  </h3>
                  <p className="text-[11px] text-slate-400">Strict governance rules</p>
                </div>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-1">
                  <span className="font-bold text-indigo-900 dark:text-indigo-200 block">
                    🔒 Strict Confidentiality Isolation
                  </span>
                  <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80">
                    Once DQAC approves a question paper, it remains strictly visible ONLY to the particular faculty who created it, plus HOD, DQAC, and Admin. Other faculties cannot see it.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 space-y-1">
                  <span className="font-bold text-amber-900 dark:text-amber-200 block">
                    🎯 Section &amp; Set Decision Control
                  </span>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                    DQAC decides whether to provide a Common Set across Section A &amp; Section B, or allocate distinct paper sets (e.g. Set A for Section A, Set B for Section B).
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 space-y-1">
                  <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
                    📊 Bloom&apos;s Taxonomy Audit
                  </span>
                  <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                    Ensure balance between Remember/Understand (30-40%), Apply/Analyze (40-50%), and Evaluate/Create (10-20%) across all approved sets.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
