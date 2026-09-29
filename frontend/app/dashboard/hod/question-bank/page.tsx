'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

function getHeaders() {
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

interface Question {
  id: string;
  topic?: string;
  mode: 'MCQ' | 'DESC';
  question_text: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_option?: string;
  difficulty_level?: string;
  max_marks?: number;
  created_at?: string;
}

export default function HodQuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterMode, setFilterMode] = useState<string>('ALL');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [form, setForm] = useState({
    topic: '',
    mode: 'MCQ' as 'MCQ' | 'DESC',
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A',
    difficulty_level: 'Medium',
    max_marks: '2',
  });

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const { slug, headers } = getHeaders();
      const res = await fetch(`${API_BASE}/exams/question-bank?tenant=${slug}`, { headers });
      const data = await res.json();
      setQuestions(Array.isArray(data) ? data : (data.data || []));
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { slug, headers } = getHeaders();
      await fetch(`${API_BASE}/exams/question-bank?tenant=${slug}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...form,
          max_marks: Number(form.max_marks) || 1,
        }),
      });
      setForm({
        topic: '',
        mode: 'MCQ',
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_option: 'A',
        difficulty_level: 'Medium',
        max_marks: '2',
      });
      setShowAddForm(false);
      await loadQuestions();
    } catch (err) {
      console.error('Failed to create question:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (filterMode !== 'ALL' && q.mode !== filterMode) return false;
    if (filterDifficulty !== 'ALL' && q.difficulty_level !== filterDifficulty) return false;
    if (searchQuery.trim()) {
      const qText = (q.question_text || '').toLowerCase();
      const topic = (q.topic || '').toLowerCase();
      const s = searchQuery.toLowerCase();
      return qText.includes(s) || topic.includes(s);
    }
    return true;
  });

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 font-sans">
      <Sidebar role="hod" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Department Question Bank & Topics" />
        <main className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full flex-1">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#5B4BFF]/10 text-[#5B4BFF] font-mono font-bold uppercase tracking-wider">HOD ACADEMIC REPOSITORY</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#1B1E28] dark:text-white">Question Bank & Topics</h1>
              <p className="text-xs sm:text-sm text-slate-500">Manage curriculum questions, verify MCQs and descriptive items for exam papers</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#7867FF] text-white text-xs sm:text-sm font-black transition-all shadow-md shadow-[#5B4BFF]/25 flex items-center justify-center gap-2"
            >
              <span>{showAddForm ? '✕ Close Form' : '+ Add Question'}</span>
            </button>
          </div>

          {/* Add Question Form Modal/Section */}
          {showAddForm && (
            <form onSubmit={handleCreateQuestion} className="p-6 bg-white dark:bg-slate-900 rounded-[22px] border border-[#5B4BFF]/30 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="font-extrabold text-base text-[#1B1E28] dark:text-white">Add Question to Question Bank</h2>
                <span className="text-xs text-[#5B4BFF] font-bold">HOD Verification Direct</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Topic / Unit</label>
                  <input
                    type="text"
                    value={form.topic}
                    onChange={(e) => setForm({ ...form, topic: e.target.value })}
                    placeholder="e.g. Unit 2: Data Structures"
                    className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-sm text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Question Mode</label>
                  <select
                    value={form.mode}
                    onChange={(e) => setForm({ ...form, mode: e.target.value as 'MCQ' | 'DESC' })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-sm text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                  >
                    <option value="MCQ">Multiple Choice (MCQ)</option>
                    <option value="DESC">Descriptive / Theory</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Difficulty Level</label>
                  <select
                    value={form.difficulty_level}
                    onChange={(e) => setForm({ ...form, difficulty_level: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-sm text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Question Text *</label>
                <textarea
                  required
                  rows={3}
                  value={form.question_text}
                  onChange={(e) => setForm({ ...form, question_text: e.target.value })}
                  placeholder="Enter the full question description..."
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-sm text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                />
              </div>

              {form.mode === 'MCQ' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(['a', 'b', 'c', 'd'] as const).map((opt) => (
                    <div key={opt} className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Option {opt.toUpperCase()}</label>
                      <input
                        type="text"
                        value={(form as any)[`option_${opt}`]}
                        onChange={(e) => setForm({ ...form, [`option_${opt}`]: e.target.value })}
                        placeholder={`Option ${opt.toUpperCase()} content`}
                        className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-sm text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                      />
                    </div>
                  ))}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Correct Option</label>
                    <select
                      value={form.correct_option}
                      onChange={(e) => setForm({ ...form, correct_option: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-sm text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                    >
                      <option value="A">Option A</option>
                      <option value="B">Option B</option>
                      <option value="C">Option C</option>
                      <option value="D">Option D</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Marks</label>
                    <input
                      type="number"
                      value={form.max_marks}
                      onChange={(e) => setForm({ ...form, max_marks: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-sm text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting || !form.question_text.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#7867FF] text-white text-xs font-extrabold disabled:opacity-50 transition-all shadow-md shadow-[#5B4BFF]/20"
                >
                  {submitting ? 'Saving Question...' : '💾 Save Question'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Filter and Search Bar */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search questions or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs text-[#1B1E28] dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#5B4BFF]"
              />
              <span className="absolute left-3 top-2.5 text-xs text-slate-400">🔍</span>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#5B4BFF]"
              >
                <option value="ALL">All Question Types</option>
                <option value="MCQ">MCQ</option>
                <option value="DESC">Descriptive</option>
              </select>

              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#5B4BFF]"
              >
                <option value="ALL">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
          </div>

          {/* Questions List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-3 border-[#5B4BFF] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="py-20 text-center space-y-3 bg-white dark:bg-slate-900 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800">
              <span className="text-5xl">🗂️</span>
              <p className="text-base font-extrabold text-slate-600 dark:text-slate-300">No questions found</p>
              <p className="text-xs text-slate-400">Add questions using "+ Add Question" or adjust your filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="p-5 bg-white dark:bg-slate-900 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#5B4BFF]/10 text-[#5B4BFF] text-xs font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase">
                        {q.mode}
                      </span>
                      {q.difficulty_level && (
                        <span className="px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/40 text-orange-600 text-[10px] font-black">
                          {q.difficulty_level}
                        </span>
                      )}
                      {q.max_marks && (
                        <span className="text-xs font-bold text-slate-500">[{q.max_marks} Marks]</span>
                      )}
                    </div>
                    {q.topic && (
                      <span className="text-xs font-extrabold text-[#5B4BFF] bg-[#5B4BFF]/5 px-2.5 py-1 rounded-full">
                        📌 {q.topic}
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-bold text-[#1B1E28] dark:text-white leading-relaxed">{q.question_text}</p>

                  {q.mode === 'MCQ' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                      {[
                        { label: 'A', text: q.option_a },
                        { label: 'B', text: q.option_b },
                        { label: 'C', text: q.option_c },
                        { label: 'D', text: q.option_d },
                      ].map(
                        (opt) =>
                          opt.text && (
                            <div
                              key={opt.label}
                              className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                                q.correct_option === opt.label
                                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-800 dark:text-emerald-300 font-bold'
                                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              <span className="w-5 h-5 rounded-md bg-white dark:bg-slate-700 flex items-center justify-center font-black text-[10px] shrink-0">
                                {opt.label}
                              </span>
                              <span>{opt.text}</span>
                              {q.correct_option === opt.label && <span className="ml-auto text-emerald-600 font-black">✓ Correct</span>}
                            </div>
                          )
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
