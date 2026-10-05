'use client';
import { useState, useEffect, useRef } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
function getH() {
  if (typeof window === 'undefined') return { slug: '', headers: {} as any };
  const slug = (localStorage.getItem('tenantSlug') || '').replace(/^tenant_/, '') || 'default';
  const token = localStorage.getItem('token') || '';
  return { slug, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'x-tenant-slug': slug } };
}

export default function AdminQPPrintPage() {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { slug, headers } = getH();
        const r = await fetch(`${API_BASE}/exams/papers/approved?tenant=${slug}`, { headers });
        const d = await r.json();
        const list = Array.isArray(d) ? d : (d.data || []);
        setPapers(list);
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const pid = params.get('paperId');
          const target = list.find((p: any) => p.id === pid) || list[0] || null;
          setSelected(target);
        } else if (list.length > 0) {
          setSelected(list[0]);
        }
      } catch { setPapers([]); } finally { setLoading(false); }
    };
    load();
  }, []);

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return;
    w.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Question Paper — ${selected?.name || ''}</title>
          <style>
            body { font-family: 'Times New Roman', serif; margin: 20mm; font-size: 12pt; color: #000; }
            h1 { text-align: center; font-size: 16pt; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 8px; }
            h2 { text-align: center; font-size: 13pt; margin-top: 4px; }
            .meta { display: flex; justify-content: space-between; margin: 12px 0; font-size: 10pt; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 6px 0; }
            .section-title { font-weight: bold; font-size: 12pt; margin-top: 16px; text-decoration: underline; }
            .question { margin: 8px 0; padding-left: 16px; }
            .question-text { font-weight: bold; }
            .options { padding-left: 24px; list-style: none; }
            .options li { margin: 2px 0; }
            @media print { body { margin: 15mm; } }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 500);
  };

  const sections = selected?.sections
    ? (typeof selected.sections === 'string' ? JSON.parse(selected.sections || '[]') : selected.sections)
    : [];

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 font-sans">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col">
        <Header title="Question Paper Print Center" />
        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-[#1B1E28] dark:text-white">📄 Question Paper Print Center</h1>
              <p className="text-sm text-slate-500">Only HOD-approved question papers are available for printing</p>
            </div>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-extrabold border border-emerald-500/20">
              ✅ HOD Approved Only
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Papers List */}
            <div className="lg:col-span-1 space-y-3">
              <h2 className="font-extrabold text-sm text-slate-500 uppercase tracking-wide">Approved Papers ({papers.length})</h2>
              {loading ? (
                <div className="flex items-center gap-2 py-8"><div className="w-5 h-5 border-2 border-[#5B4BFF] border-t-transparent rounded-full animate-spin" /><span className="text-sm text-slate-400">Loading...</span></div>
              ) : papers.length === 0 ? (
                <div className="py-12 text-center space-y-2 bg-white dark:bg-slate-900 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800">
                  <span className="text-3xl">📋</span>
                  <p className="text-sm font-bold text-slate-500">No approved papers yet</p>
                  <p className="text-xs text-slate-400">Papers appear here after HOD approval</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {papers.map((p) => (
                    <button key={p.id} onClick={() => setSelected(p)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${selected?.id === p.id ? 'border-[#5B4BFF] bg-[#5B4BFF]/5 shadow-md' : 'border-[#E7EAF3] dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#5B4BFF]/40 hover:shadow-sm'}`}>
                      <p className="font-extrabold text-sm text-[#1B1E28] dark:text-white truncate">{p.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{p.subject_name || p.code} · {p.max_marks}M · {p.type || 'THEORY'}</p>
                      <span className="text-[10px] text-emerald-600 font-bold">✅ HOD Approved</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Preview + Print */}
            <div className="lg:col-span-2">
              {!selected ? (
                <div className="h-full min-h-80 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800 space-y-3">
                  <span className="text-5xl">🖨️</span>
                  <p className="text-base font-extrabold text-slate-500">Select a paper to preview</p>
                  <p className="text-sm text-slate-400">Click any approved paper on the left</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-[#E7EAF3] dark:border-slate-800">
                    <h3 className="font-extrabold text-sm text-[#1B1E28] dark:text-white">{selected.name}</h3>
                    <button onClick={handlePrint} className="px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#7867FF] text-white text-sm font-extrabold transition-all shadow-sm shadow-[#5B4BFF]/30 flex items-center gap-2">
                      🖨️ Print Paper
                    </button>
                  </div>

                  {/* Print Content */}
                  <div ref={printRef} className="p-6 space-y-4 font-serif">
                    <h1 className="text-xl font-black text-center text-[#1B1E28] dark:text-white border-b-2 border-[#1B1E28] dark:border-white pb-3">
                      {selected.name}
                    </h1>
                    {selected.subject_name && <h2 className="text-base font-bold text-center text-slate-600 dark:text-slate-300">{selected.subject_name} ({selected.subject_code || selected.code})</h2>}

                    <div className="flex justify-between text-sm font-semibold text-slate-600 dark:text-slate-300 border-t border-b border-slate-200 dark:border-slate-700 py-2">
                      <span>Type: {selected.type || 'THEORY'}</span>
                      <span>Max Marks: {selected.max_marks}</span>
                      <span>Pass Marks: {selected.passing_marks}</span>
                      <span>Duration: {selected.duration_minutes || 60} min</span>
                    </div>

                    {(() => {
                      const isTheory = (selected.type || '').toUpperCase() === 'THEORY';
                      const printableSections = sections.filter((sec: any) => {
                        if (isTheory && (sec.type === 'PRACTICAL' || String(sec.title || '').toLowerCase().includes('practical'))) {
                          return false;
                        }
                        return true;
                      });

                      if (printableSections.length === 0) {
                        return (
                          <p className="text-sm text-slate-400 italic text-center py-8">
                            {isTheory ? 'No theory sections defined for this paper.' : 'No structured sections defined. Raw paper content to be added by HOD.'}
                          </p>
                        );
                      }

                      return printableSections.map((sec: any, si: number) => {
                        const qList = (sec.questions || []).filter((q: any) => !isTheory || (q.mode !== 'PRACTICAL' && !q.is_practical && q.type !== 'PRACTICAL'));
                        return (
                          <div key={si} className="space-y-3">
                            <p className="font-extrabold text-sm text-[#1B1E28] dark:text-white underline">Section {String.fromCharCode(65 + si)}: {sec.title || sec.name || ''}</p>
                            {qList.length === 0 ? (
                              <p className="pl-4 text-xs text-slate-400 italic">No questions added in this section.</p>
                            ) : (
                              qList.map((q: any, qi: number) => (
                                <div key={qi} className="pl-4 space-y-1">
                                  <p className="text-sm font-semibold text-[#1B1E28] dark:text-white">Q{qi + 1}. {q.questionText || q.text} {q.marks ? `[${q.marks}M]` : ''}</p>
                                  {(q.options || [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean)).length > 0 && (
                                    <ul className="pl-4 space-y-0.5">
                                      {(q.options || [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean)).map((opt: string, oi: number) => (
                                        <li key={oi} className="text-sm text-slate-600 dark:text-slate-400">{String.fromCharCode(65 + oi)}. {opt}</li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
