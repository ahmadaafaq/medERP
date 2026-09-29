'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Printer, CheckCircle2, ChevronRight, FileText, Sparkles } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

function getTenantHeaders() {
  if (typeof window === 'undefined') return { slug: '', headers: {} as Record<string, string> };
  const slug = (localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || '').replace(/^tenant_/, '').replace(/^tenant-/, '') || 'default';
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

export interface ApprovedExamPaper {
  id: string;
  code: string;
  name: string;
  subject_name?: string;
  subject_id?: string;
  department_name?: string;
  max_marks: number;
  passing_marks: number;
  type: string;
  duration_minutes?: number;
  status: string;
  hod_approved_at?: string;
  hod_approved_by?: string;
  sections?: any[];
}

export default function AdminApprovedQPCard() {
  const [papers, setPapers] = useState<ApprovedExamPaper[]>([]);
  const [loading, setLoading] = useState(true);

  const loadApprovedPapers = async () => {
    setLoading(true);
    try {
      const { slug, headers } = getTenantHeaders();
      const res = await fetch(`${API_BASE}/exams/papers/approved?tenant=${slug}`, { headers });
      const json = await res.json();
      const list = Array.isArray(json) ? json : Array.isArray(json.data) ? json.data : [];
      setPapers(list);
    } catch {
      setPapers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovedPapers();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[22px] p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-xl text-orange-500">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-[#1B1E28] dark:text-white">
                HOD-Approved Question Papers
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Ready for Print
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Verified by Department HOD — Authorized for examination printing
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/admin/qp-print"
          className="text-xs font-black text-[#5B4BFF] hover:text-[#7867FF] flex items-center gap-1 transition-colors"
        >
          <span>Print Center</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center gap-2 py-6 justify-center">
          <div className="w-5 h-5 border-2 border-[#5B4BFF] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-400">Loading approved papers...</span>
        </div>
      ) : papers.length === 0 ? (
        <div className="py-8 text-center space-y-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
          <FileText className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs font-extrabold text-slate-600 dark:text-slate-300">
            No HOD-approved papers ready for printing
          </p>
          <p className="text-[10px] text-slate-400 max-w-sm mx-auto">
            Once a Department HOD reviews and verifies clerk-designed question papers, they will appear here automatically for administration printout.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
            {papers.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-3 hover:border-orange-300 dark:hover:border-orange-500/40 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-extrabold text-[#1B1E28] dark:text-white leading-tight">
                      {p.name}
                    </h4>
                    <span className="px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 text-[9px] font-black uppercase shrink-0">
                      {p.type || 'THEORY'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Code: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{p.code}</span>
                    {p.subject_name ? ` · ${p.subject_name}` : ''}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                    <span>Max: {p.max_marks}M</span>
                    <span>·</span>
                    <span>Pass: {p.passing_marks}M</span>
                    {p.duration_minutes && (
                      <>
                        <span>·</span>
                        <span>{p.duration_minutes} mins</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> HOD Verified
                  </span>
                  <Link
                    href={`/dashboard/admin/qp-print?paperId=${p.id}`}
                    className="px-3 py-1.5 rounded-lg bg-[#5B4BFF] hover:bg-[#7867FF] text-white text-[11px] font-black flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Print Paper</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span className="font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>{papers.length} approved paper{papers.length === 1 ? '' : 's'} available to print</span>
            </span>
            <Link
              href="/dashboard/admin/qp-print"
              className="text-[#5B4BFF] font-black hover:underline"
            >
              Open Full Print Facility →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
