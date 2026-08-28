'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

interface SubTopicScore {
  code: string;
  name: string;
  scored: number;
  max: number;
  percentage: number;
}

interface StudentResult {
  id: string;
  paper_name?: string;
  paper_code?: string;
  subject_name?: string;
  subject_code?: string;
  semester?: string | number;
  marks_obtained: number;
  max_marks?: number;
  passing_marks?: number;
  is_pass: boolean;
  paper_type?: string;
  created_at?: string;
  question_marks?: Record<string, number>;
  sub_topic_scores?: SubTopicScore[];
  competency_scores?: Record<string, { scored: number; max: number }>;
}

const API_BASE = 'http://localhost:8081/api/v1';

const getTenantSlug = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('tenantSlug') || 'srms-cet-bareilly';
  }
  return 'srms-cet-bareilly';
};

// ─── Mini Bar Chart for SubTopic/Competency ─────────────────────────────────
function SubTopicBar({ label, scored, max, color = '#5B4BFF' }: { label: string; scored: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (scored / max) * 100) : 0;
  const passPct = 40;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] font-bold text-[#1B1E28] dark:text-white">
        <span className="truncate max-w-[60%]" title={label}>{label}</span>
        <span className="font-mono text-[#5B4BFF]">{scored.toFixed(1)}/{max}</span>
      </div>
      <div className="relative h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: pct >= passPct ? color : '#F04438' }}
        />
        {/* Passing line */}
        <div className="absolute top-0 h-full w-px bg-amber-400/80" style={{ left: `${passPct}%` }} />
      </div>
      <div className="text-[9px] text-right text-slate-400 font-mono">{pct.toFixed(1)}%</div>
    </div>
  );
}

// ─── Radial progress ring ────────────────────────────────────────────────────
function RingChart({ pct, size = 72, stroke = 7, color = '#5B4BFF', label }: {
  pct: number; size?: number; stroke?: number; color?: string; label: string;
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const dash = (Math.min(100, pct) / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E7EAF3" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={pct >= 40 ? color : '#F04438'}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - dash}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="text-center -mt-1">
        <div className="text-base font-black text-[#1B1E28] dark:text-white">{pct.toFixed(0)}%</div>
        <div className="text-[9px] text-slate-500 font-medium">{label}</div>
      </div>
    </div>
  );
}

export default function StudentMarksPage() {
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [filterSem, setFilterSem] = useState<string>('all');

  useEffect(() => {
    fetchMarks();
  }, []);

  const fetchMarks = async () => {
    setLoading(true);
    const slug = getTenantSlug();
    const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || '') : '';
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'x-tenant-slug': slug,
    };

    try {
      const meRes = await fetch(`${API_BASE}/auth/me`, { headers });
      if (meRes.ok) {
        const meJson = await meRes.json();
        const identifier = meJson.profile?.registration_no || meJson.profile?.rollno || meJson.profile?.id || '';
        if (identifier) {
          const marksRes = await fetch(`${API_BASE}/exams/student/${identifier}?tenant=${slug}`, { headers });
          if (marksRes.ok) {
            const mJson = await marksRes.json();
            const mData = mJson.data !== undefined ? mJson.data : mJson;
            if (Array.isArray(mData) && mData.length > 0) {
              setResults(mData);
              setSelectedResultId(mData[0].id);
              setLoading(false);
              return;
            }
          }
        }
      }
    } catch { /* fallthrough to fallback */ }
    // No real data — show empty state instead of fake data
    setResults([]);
    setLoading(false);
  };

  // Filter by semester
  const filteredResults = useMemo(() => {
    if (filterSem === 'all') return results;
    return results.filter(r => String(r.semester || '') === filterSem);
  }, [results, filterSem]);

  const selectedResult = useMemo(
    () => filteredResults.find(r => r.id === selectedResultId) || filteredResults[0] || null,
    [filteredResults, selectedResultId],
  );

  // Build SubTopic chart data from result
  const subTopicData = useMemo((): SubTopicScore[] => {
    if (!selectedResult) return [];
    if (selectedResult.sub_topic_scores && selectedResult.sub_topic_scores.length > 0) {
      return selectedResult.sub_topic_scores;
    }
    // Build from competency_scores if available
    if (selectedResult.competency_scores) {
      return Object.entries(selectedResult.competency_scores).map(([code, val]) => ({
        code,
        name: code,
        scored: val.scored,
        max: val.max,
        percentage: val.max > 0 ? (val.scored / val.max) * 100 : 0,
      }));
    }
    return [];
  }, [selectedResult]);

  const overallPct = selectedResult
    ? ((selectedResult.marks_obtained / (selectedResult.max_marks || 100)) * 100)
    : 0;

  const semesters = useMemo(() => {
    const sems = new Set(results.map(r => String(r.semester || '')).filter(Boolean));
    return Array.from(sems).sort();
  }, [results]);

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-[#0F172A] text-[#4E5969] dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar role="student" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Assessment Marks & Performance Report" />
        <main className="p-6 space-y-6 flex-1">

          {/* HEADER BANNER */}
          <div className="p-6 rounded-[22px] bg-gradient-to-r from-[#2D2575] via-[#3E3498] to-[#2D2575] text-white shadow-soft flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-[10px] font-extrabold text-[#F36C21] uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/20">
                Academic Performance
              </span>
              <h2 className="text-2xl font-black text-white mt-2">
                Internal Assessment & SubTopic Analytics
              </h2>
              <p className="text-xs text-white/80 mt-1">
                SubTopic-wise performance breakdown across all exam papers and competencies.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/student/reports/theory-result"
                className="px-4 py-2.5 bg-[#2D2575] hover:bg-[#3D3399] text-white rounded-xl font-bold text-xs transition shadow-md flex items-center gap-2 cursor-pointer shrink-0"
              >
                📝 Theory Exam Results
              </Link>
              <button
                onClick={fetchMarks}
                className="px-4 py-2.5 bg-[#5B4BFF] hover:bg-[#4E3FE3] text-white rounded-xl font-bold text-xs transition shadow-md flex items-center gap-2 cursor-pointer shrink-0"
              >
                🔄 Refresh Results
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-[#4E5969] dark:text-slate-400 text-sm animate-pulse font-bold">
              Loading your assessment marks...
            </div>
          ) : results.length === 0 ? (
            <div className="p-10 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 text-center space-y-3">
              <div className="text-4xl">📊</div>
              <h3 className="text-base font-black text-[#1B1E28] dark:text-white">No Assessment Results Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Your marks will appear here once your faculty evaluates your exam papers.
              </p>
              <Link
                href="/dashboard/student"
                className="inline-block mt-2 px-4 py-2 bg-[#5B4BFF] text-white rounded-xl text-xs font-bold"
              >
                ← Back to Dashboard
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* LEFT: Results List */}
              <div className="lg:col-span-4 space-y-4">
                <div className="p-5 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 shadow-soft space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-[#1B1E28] dark:text-white uppercase tracking-wider">
                      📋 Exam Results ({filteredResults.length})
                    </h3>
                    {semesters.length > 0 && (
                      <select
                        value={filterSem}
                        onChange={e => setFilterSem(e.target.value)}
                        className="px-2 py-1 text-[10px] rounded-lg bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold focus:outline-none focus:border-[#5B4BFF]"
                      >
                        <option value="all">All Sems</option>
                        {semesters.map(s => <option key={s} value={s}>Sem {s}</option>)}
                      </select>
                    )}
                  </div>

                  <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                    {filteredResults.map(r => {
                      const maxM = r.max_marks || 100;
                      const pct = (r.marks_obtained / maxM) * 100;
                      const isSelected = (selectedResultId || filteredResults[0]?.id) === r.id;
                      return (
                        <div
                          key={r.id}
                          onClick={() => setSelectedResultId(r.id)}
                          className={`p-3.5 rounded-xl cursor-pointer transition-all duration-150 border ${
                            isSelected
                              ? 'bg-[#5B4BFF] border-[#5B4BFF] text-white shadow-md'
                              : 'bg-[#F6F8FC] dark:bg-slate-900 border-[#E7EAF3] dark:border-slate-800 hover:border-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-mono font-black ${isSelected ? 'text-white/80' : 'text-[#5B4BFF]'}`}>
                              [{r.paper_code || 'EXAM'}]
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${
                              r.is_pass
                                ? isSelected ? 'bg-white/20 text-white border-white/30' : 'bg-[#00C48C]/15 text-[#00C48C] border-[#00C48C]/30'
                                : isSelected ? 'bg-red-500/20 text-white border-red-300/30' : 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                            }`}>
                              {r.is_pass ? '✓ PASS' : '✗ FAIL'}
                            </span>
                          </div>
                          <h5 className={`text-xs font-extrabold mt-1 ${isSelected ? 'text-white' : 'text-[#1B1E28] dark:text-white'}`}>
                            {r.paper_name || r.subject_name || 'Assessment'}
                          </h5>
                          <div className="mt-2">
                            <div className={`w-full h-1.5 rounded-full ${isSelected ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, pct)}%`, background: isSelected ? '#fff' : (pct >= 40 ? '#00C48C' : '#F04438') }}
                              />
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className={`text-[9px] font-mono ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                                {r.marks_obtained}/{maxM}
                              </span>
                              <span className={`text-[9px] font-black ${isSelected ? 'text-white' : (pct >= 40 ? 'text-[#00C48C]' : 'text-rose-500')}`}>
                                {pct.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RIGHT: Detail & SubTopic Charts */}
              <div className="lg:col-span-8 space-y-4">
                {selectedResult && (
                  <>
                    {/* Overall Score Ring */}
                    <div className="p-6 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 shadow-soft">
                      <h3 className="text-xs font-black text-[#1B1E28] dark:text-white uppercase tracking-wider mb-4">
                        📈 Overall Performance — {selectedResult.paper_name || selectedResult.subject_name}
                      </h3>
                      <div className="flex flex-wrap gap-6 items-start">
                        <RingChart pct={overallPct} size={90} stroke={8} color="#5B4BFF" label="Overall" />
                        {selectedResult.max_marks && (
                          <RingChart
                            pct={selectedResult.passing_marks ? ((selectedResult.marks_obtained / selectedResult.max_marks) * 100) : overallPct}
                            size={90} stroke={8} color="#00C48C" label="vs Pass"
                          />
                        )}
                        <div className="flex-1 min-w-[200px] space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { label: 'Marks Obtained', val: selectedResult.marks_obtained.toFixed(1), color: '#5B4BFF' },
                              { label: 'Max Marks', val: String(selectedResult.max_marks || 100), color: '#4E5969' },
                              { label: 'Passing Marks', val: String(selectedResult.passing_marks || '—'), color: '#FFB020' },
                              { label: 'Status', val: selectedResult.is_pass ? 'PASS' : 'FAIL', color: selectedResult.is_pass ? '#00C48C' : '#F04438' },
                            ].map(item => (
                              <div key={item.label} className="p-3 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800">
                                <div className="text-[9px] text-slate-400 font-bold uppercase">{item.label}</div>
                                <div className="text-sm font-black mt-0.5" style={{ color: item.color }}>{item.val}</div>
                              </div>
                            ))}
                          </div>
                          {selectedResult.paper_type && (
                            <div className="px-3 py-2 rounded-xl bg-[#5B4BFF]/10 border border-[#5B4BFF]/20 text-[10px] text-[#5B4BFF] font-bold">
                              Paper Type: {selectedResult.paper_type} {selectedResult.semester ? `· Semester ${selectedResult.semester}` : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* SubTopic / Competency Chart */}
                    {subTopicData.length > 0 ? (
                      <div className="p-6 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 shadow-soft space-y-4">
                        <h3 className="text-xs font-black text-[#1B1E28] dark:text-white uppercase tracking-wider">
                          🎯 SubTopic / Competency-wise Breakdown
                        </h3>
                        <p className="text-[10px] text-slate-400">
                          Each bar shows marks scored vs max for that SubTopic. The amber line marks 40% passing threshold.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                          {subTopicData.map(st => (
                            <SubTopicBar
                              key={st.code}
                              label={st.name || st.code}
                              scored={st.scored}
                              max={st.max}
                              color={st.percentage >= 40 ? '#5B4BFF' : '#F04438'}
                            />
                          ))}
                        </div>
                        {/* Legend */}
                        <div className="flex gap-4 text-[10px] font-bold pt-2 border-t border-[#E7EAF3] dark:border-slate-800">
                          <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-[#5B4BFF] inline-block" /> Passed SubTopic</span>
                          <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-[#F04438] inline-block" /> Below Pass</span>
                          <span className="flex items-center gap-1.5"><span className="w-px h-3 bg-amber-400 inline-block" /> 40% Threshold</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 shadow-soft">
                        <h3 className="text-xs font-black text-[#1B1E28] dark:text-white uppercase tracking-wider mb-3">
                          🎯 SubTopic / Competency Breakdown
                        </h3>
                        <p className="text-[11px] text-slate-400 text-center py-6">
                          SubTopic-wise breakdown will appear after faculty completes question-level evaluation.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Full Results Table */}
          {results.length > 0 && (
            <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft space-y-4">
              <h3 className="text-base font-black text-[#1B1E28] dark:text-white flex items-center gap-2">
                📋 All Assessment Results
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E7EAF3] dark:border-slate-800 text-[#4E5969] dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                      <th className="py-3 px-4">Paper Code</th>
                      <th className="py-3 px-4">Assessment Title</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Sem</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Marks</th>
                      <th className="py-3 px-4">Max</th>
                      <th className="py-3 px-4">%</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800 font-medium">
                    {results.map((r) => {
                      const maxM = r.max_marks || 100;
                      const pct = ((r.marks_obtained / maxM) * 100).toFixed(1);
                      return (
                        <tr
                          key={r.id}
                          onClick={() => setSelectedResultId(r.id)}
                          className="hover:bg-[#F1F4F9]/60 dark:hover:bg-slate-800/40 transition cursor-pointer"
                        >
                          <td className="py-3.5 px-4 font-mono font-black text-[#5B4BFF]">{r.paper_code || '—'}</td>
                          <td className="py-3.5 px-4 font-bold text-[#1B1E28] dark:text-white">{r.paper_name || 'Assessment'}</td>
                          <td className="py-3.5 px-4 text-[#4E5969] dark:text-slate-300">{r.subject_name || '—'}</td>
                          <td className="py-3.5 px-4 text-[#4E5969] dark:text-slate-400">{r.semester || '—'}</td>
                          <td className="py-3.5 px-4 text-[#4E5969] dark:text-slate-400">{r.paper_type || 'Theory'}</td>
                          <td className="py-3.5 px-4 font-black text-[#1B1E28] dark:text-white text-sm">{r.marks_obtained}</td>
                          <td className="py-3.5 px-4 text-[#4E5969] dark:text-slate-400">{maxM}</td>
                          <td className="py-3.5 px-4 font-black text-[#5B4BFF]">{pct}%</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase border ${
                              r.is_pass
                                ? 'bg-[#00C48C]/15 text-[#00C48C] border-[#00C48C]/30'
                                : 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                            }`}>
                              {r.is_pass ? 'PASSED' : 'FAILED'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
