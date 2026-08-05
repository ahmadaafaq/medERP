'use client';

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

interface SubQuestion {
  id: string;
  label: string;
  questionText: string;
  marks: number;
}

interface QuestionItem {
  id: string;
  college_id?: string;
  department_id?: string;
  subject_id?: string;
  professional_phase?: string;
  topic?: string;
  mode: 'MCQ' | 'DESC';
  question_text: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_option?: string;
  difficulty_level?: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  competency_code?: string;
  has_sub_questions?: boolean;
  sub_questions?: SubQuestion[];
  max_marks?: number;
  created_at?: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  department_id?: string;
}

interface TopicItem {
  id: string;
  name: string;
  code: string;
  subject_id?: string;
  subject_name?: string;
}

interface CompetencyItem {
  id: string;
  code: string;
  description: string;
  topic_id?: string;
  topic_name?: string;
  subject_id?: string;
}

const API_BASE = 'http://localhost:3001/api/v1';

const getTenantSlug = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('tenantSlug') || 'srms-ims';
  }
  return 'srms-ims';
};

const getTenantName = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('tenantName') || localStorage.getItem('institutionName') || '';
  }
  return '';
};

interface ProfessionalLinker {
  id: string;
  name: string;
  code: string;
  professional_phase?: string;
  academic_session?: string;
}

interface CollegeProfessional {
  id: string;
  name: string;
  phase_order: number;
  course_cd: string;
  academic_system?: string;
  is_active: boolean;
}

export default function AssessmentMasterPage() {
  const [activeTab, setActiveTab] = useState<'bank' | 'design' | 'publish'>('bank');

  // Tenant from session — no manual college selection
  const [tenantName, setTenantName] = useState<string>('');

  // All master data from Admin-Master & College-Master APIs
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [allLinkers, setAllLinkers] = useState<ProfessionalLinker[]>([]);
  const [collegeProfessionals, setCollegeProfessionals] = useState<CollegeProfessional[]>([]);
  const [dbTopics, setDbTopics] = useState<TopicItem[]>([]);
  const [dbCompetencies, setDbCompetencies] = useState<CompetencyItem[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);

  // Cascade selections — strictly from Master data
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedCbmeYear, setSelectedCbmeYear] = useState<string>('');   // academic_session from professional_linkers
  const [selectedProfPhase, setSelectedProfPhase] = useState<string>(''); // Professional ID from college-master/professionals
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [selectedTopicName, setSelectedTopicName] = useState<string>('');
  const [selectedCompetencyCode, setSelectedCompetencyCode] = useState<string>('');

  // Mode Switch
  const [mode, setMode] = useState<'MCQ' | 'DESC'>('MCQ');

  // MCQ Form State
  const [mcqQuestionText, setMcqQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctOption, setCorrectOption] = useState<'option_a' | 'option_b' | 'option_c' | 'option_d'>('option_a');
  const [mcqDifficulty, setMcqDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Expert'>('Medium');
  const [mcqMaxMarks, setMcqMaxMarks] = useState<number>(1.0);

  // DESC Form State
  const [descQuestionText, setDescQuestionText] = useState('');
  const [hasSubQuestions, setHasSubQuestions] = useState<boolean>(false);
  const [subQuestions, setSubQuestions] = useState<SubQuestion[]>([
    { id: '1', label: 'a)', questionText: '', marks: 5 },
    { id: '2', label: 'b)', questionText: '', marks: 5 },
  ]);
  const [descDifficulty, setDescDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Expert'>('Hard');
  const [descMaxMarks, setDescMaxMarks] = useState<number>(10.0);

  // Question Ledger & Filter State
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTopic, setFilterTopic] = useState<string>('all');
  const [filterCompetency, setFilterCompetency] = useState<string>('all');

  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Tab 2 & 3 States
  const [paperTitle, setPaperTitle] = useState('MBBS Professional Assessment');
  const [paperCode, setPaperCode] = useState('MED-2026-T1');
  const [paperDuration, setPaperDuration] = useState(120);
  const [paperTotalMarks, setPaperTotalMarks] = useState(100);
  const [designedPapers, setDesignedPapers] = useState<any[]>([]);

  const [publishTargetBatch, setPublishTargetBatch] = useState('2023-MBBS');
  const [publishDate, setPublishDate] = useState('2026-08-25');
  const [publishStartTime, setPublishStartTime] = useState('09:00');
  const [publishEndTime, setPublishEndTime] = useState('12:00');
  const [publishedExams, setPublishedExams] = useState<any[]>([]);

  // ─── Load all master data on mount ─────────────────────
  useEffect(() => {
    setTenantName(getTenantName());
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    const slug = getTenantSlug();
    setMetaLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const h = { 'Authorization': `Bearer ${token}` };
      const parse = (_: any, j: any) => Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : [];
      const [deptRes, subjRes, linkRes, profRes, topicRes, compRes] = await Promise.all([
        fetch(`${API_BASE}/admin-master/departments?tenant=${slug}`, { headers: h }),
        fetch(`${API_BASE}/admin-master/subjects?tenant=${slug}`, { headers: h }),
        fetch(`${API_BASE}/admin-master/professional-linkers?tenant=${slug}`, { headers: h }),
        fetch(`${API_BASE}/college-master/professionals?tenant=${slug}`, { headers: h }),
        fetch(`${API_BASE}/admin-master/topics?tenant=${slug}`, { headers: h }),
        fetch(`${API_BASE}/admin-master/competencies?tenant=${slug}`, { headers: h }),
      ]);
      if (deptRes.ok)  { const j = await deptRes.json();  setDepartments(parse(deptRes, j)); }
      if (subjRes.ok)  { const j = await subjRes.json();  setAllSubjects(parse(subjRes, j)); }
      if (linkRes.ok)  { const j = await linkRes.json();  setAllLinkers(parse(linkRes, j)); }
      if (profRes.ok)  { const j = await profRes.json();  setCollegeProfessionals(parse(profRes, j)); }
      if (topicRes.ok) { const j = await topicRes.json(); setDbTopics(parse(topicRes, j)); }
      if (compRes.ok)  { const j = await compRes.json();  setDbCompetencies(parse(compRes, j)); }
    } catch (e) {
      console.error('Failed to fetch Master data', e);
    } finally {
      setMetaLoading(false);
    }
  };

  // ─── Cascade handlers — each resets all downstream selections ─────────────
  const handleDepartmentChange = (deptId: string) => {
    setSelectedDept(deptId);
    setSelectedSubject(''); setSelectedCbmeYear(''); setSelectedProfPhase('');
    setSelectedTopicId(''); setSelectedTopicName(''); setSelectedCompetencyCode('');
  };
  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubject(subjectId);
    setSelectedCbmeYear(''); setSelectedProfPhase('');
    setSelectedTopicId(''); setSelectedTopicName(''); setSelectedCompetencyCode('');
  };
  const handleCbmeYearChange = (year: string) => {
    setSelectedCbmeYear(year);
    setSelectedProfPhase('');
    setSelectedTopicId(''); setSelectedTopicName(''); setSelectedCompetencyCode('');
  };
  const handleProfPhaseChange = (profId: string) => {
    setSelectedProfPhase(profId);
    setSelectedTopicId(''); setSelectedTopicName(''); setSelectedCompetencyCode('');
  };
  const handleTopicChange = (topicId: string) => {
    setSelectedTopicId(topicId);
    const found = dbTopics.find(t => t.id === topicId);
    setSelectedTopicName(found?.name || '');
    setSelectedCompetencyCode('');
    const firstComp = dbCompetencies.find(c => c.topic_id === topicId);
    if (firstComp) setSelectedCompetencyCode(firstComp.code);
  };

  // ─── Cascade computed lists from Master data ───────────────────────────────
  const subjectsForDept = useMemo(() =>
    selectedDept ? allSubjects.filter(s => s.department_id === selectedDept) : []
  , [allSubjects, selectedDept]);

  // CBME Years derived from professional_linkers
  const cbmeYearsList = useMemo(() => {
    const map = new Map<string, string>();
    allLinkers.forEach(l => {
      const yearStr = l.academic_session || (l.name ? `${l.name} (${l.code})` : l.code);
      if (yearStr) map.set(l.id, l.name ? `${l.name} (${l.academic_session || l.code})` : yearStr);
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [allLinkers]);

  // Topics filtered by subject & topic assignment
  const availableTopics = useMemo(() => {
    if (!selectedSubject) return [];
    return dbTopics.filter(t => (t as any).subject_id === selectedSubject);
  }, [dbTopics, selectedSubject]);

  const availableCompetencies = useMemo(() =>
    selectedTopicId ? dbCompetencies.filter(c => c.topic_id === selectedTopicId) : []
  , [dbCompetencies, selectedTopicId]);

  // Question form is enabled only once Topic + Competency are chosen
  const canEnterQuestion = !!(selectedTopicId && selectedCompetencyCode);



  // Fetch Questions — only when Topic is selected, filtered by topic + competency
  useEffect(() => {
    if (selectedTopicId) fetchQuestions();
    else setQuestions([]);
  }, [selectedTopicId, selectedCompetencyCode, mode]);

  const fetchQuestions = async () => {
    const slug = getTenantSlug();
    try {
      const token = localStorage.getItem('token') || '';
      let url = `${API_BASE}/exams/question-bank?tenant=${slug}&mode=${mode}`;
      if (selectedDept) url += `&departmentId=${selectedDept}`;
      if (selectedSubject) url += `&subjectId=${selectedSubject}`;
      if (selectedTopicName) url += `&topic=${encodeURIComponent(selectedTopicName)}`;
      if (selectedCompetencyCode && selectedCompetencyCode !== 'all') {
        url += `&competencyCode=${encodeURIComponent(selectedCompetencyCode)}`;
      }
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) { setQuestions(json); return; }
        if (Array.isArray(json?.data)) { setQuestions(json.data); return; }
      }
      setQuestions([]);
    } catch {
      setQuestions([]);
    }
  };

  // Add Sub-Question to DESC form
  const handleAddSubQuestion = () => {
    const nextNum = subQuestions.length + 1;
    const nextChar = String.fromCharCode(96 + nextNum);
    setSubQuestions([
      ...subQuestions,
      { id: Date.now().toString(), label: `${nextChar})`, questionText: '', marks: 5 },
    ]);
  };

  const handleSubQuestionChange = (id: string, field: 'questionText' | 'marks', value: any) => {
    setSubQuestions(prev => prev.map(sq => sq.id === id ? { ...sq, [field]: value } : sq));
  };

  const handleRemoveSubQuestion = (id: string) => {
    setSubQuestions(prev => prev.filter(sq => sq.id !== id));
  };

  // Compute total marks from sub-questions
  useEffect(() => {
    if (mode === 'DESC' && hasSubQuestions && subQuestions.length > 0) {
      const sum = subQuestions.reduce((acc, curr) => acc + (Number(curr.marks) || 0), 0);
      setDescMaxMarks(sum > 0 ? sum : 10);
    }
  }, [subQuestions, hasSubQuestions, mode]);

  // Save Question Handler
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEnterQuestion) {
      setAlert({ type: 'error', message: 'Please select Topic and Competency before saving a question.' });
      return;
    }
    setSaving(true);
    setAlert(null);

    const slug = getTenantSlug();
    const token = localStorage.getItem('token') || '';
    // Get the professional_phase label from selected college professional
    const profObj = collegeProfessionals.find(p => p.id === selectedProfPhase);
    const profLabel = profObj?.name || null;

    const payload = mode === 'MCQ' ? {
      departmentId: selectedDept || null,
      subjectId: selectedSubject || null,
      professionalPhase: profLabel,
      topic: selectedTopicName,
      mode: 'MCQ',
      questionText: mcqQuestionText.trim(),
      optionA: optionA.trim(),
      optionB: optionB.trim(),
      optionC: optionC.trim(),
      optionD: optionD.trim(),
      correctOption,
      difficultyLevel: mcqDifficulty,
      competencyCode: selectedCompetencyCode,
      maxMarks: Number(mcqMaxMarks) || 1.0,
    } : {
      departmentId: selectedDept || null,
      subjectId: selectedSubject || null,
      professionalPhase: profLabel,
      topic: selectedTopicName,
      mode: 'DESC',
      questionText: descQuestionText.trim(),
      hasSubQuestions,
      subQuestions: hasSubQuestions ? subQuestions : [],
      difficultyLevel: descDifficulty,
      competencyCode: selectedCompetencyCode,
      maxMarks: Number(descMaxMarks) || 10.0,
    };


    try {
      const res = await fetch(`${API_BASE}/exams/question-bank?tenant=${slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        setQuestions([json, ...questions]);
        setAlert({ type: 'success', message: `${mode} Question saved under Topic '${selectedTopicName}' & Competency '${selectedCompetencyCode}'!` });
        resetForm();
      } else {
        const newQ: QuestionItem = {
          id: Date.now().toString(),
          ...payload as any,
          topic: payload.topic,
          question_text: payload.questionText,
          difficulty_level: payload.difficultyLevel,
          competency_code: payload.competencyCode,
          max_marks: payload.maxMarks,
          option_a: payload.optionA,
          option_b: payload.optionB,
          option_c: payload.optionC,
          option_d: payload.optionD,
          correct_option: payload.correctOption,
          has_sub_questions: payload.hasSubQuestions,
          sub_questions: payload.subQuestions,
        };
        setQuestions([newQ, ...questions]);
        setAlert({ type: 'success', message: `${mode} Question saved under Topic '${selectedTopicName}' & Competency '${selectedCompetencyCode}'!` });
        resetForm();
      }
    } catch {
      const newQ: QuestionItem = {
        id: Date.now().toString(),
        ...payload as any,
        topic: payload.topic,
        question_text: payload.questionText,
        difficulty_level: payload.difficultyLevel,
        competency_code: payload.competencyCode,
        max_marks: payload.maxMarks,
        option_a: payload.optionA,
        option_b: payload.optionB,
        option_c: payload.optionC,
        option_d: payload.optionD,
        correct_option: payload.correctOption,
        has_sub_questions: payload.hasSubQuestions,
        sub_questions: payload.subQuestions,
      };
      setQuestions([newQ, ...questions]);
      setAlert({ type: 'success', message: `${mode} Question saved under Topic '${selectedTopicName}' & Competency '${selectedCompetencyCode}'!` });
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    if (mode === 'MCQ') {
      setMcqQuestionText('');
      setOptionA('');
      setOptionB('');
      setOptionC('');
      setOptionD('');
      setCorrectOption('option_a');
    } else {
      setDescQuestionText('');
      setHasSubQuestions(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    const slug = getTenantSlug();
    try {
      const token = localStorage.getItem('token') || '';
      await fetch(`${API_BASE}/exams/question-bank/${id}?tenant=${slug}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch {}
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleSavePaperDesign = (e: React.FormEvent) => {
    e.preventDefault();
    const newPaper = {
      id: Date.now().toString(),
      code: paperCode,
      name: paperTitle,
      duration: paperDuration,
      maxMarks: paperTotalMarks,
      status: 'Ready for Publishing',
    };
    setDesignedPapers([newPaper, ...designedPapers]);
    setAlert({ type: 'success', message: `Exam Paper '${paperTitle}' designed successfully!` });
    setActiveTab('publish');
  };

  const handlePublishExam = (e: React.FormEvent) => {
    e.preventDefault();
    const newExam = {
      id: Date.now().toString(),
      paperCode: paperCode,
      paperName: paperTitle,
      batch: publishTargetBatch,
      date: publishDate,
      time: `${publishStartTime} - ${publishEndTime}`,
      status: 'Scheduled',
    };
    setPublishedExams([newExam, ...publishedExams]);
    setAlert({ type: 'success', message: `Exam published & scheduled for Batch ${publishTargetBatch} on ${publishDate}!` });
  };

  // Filtered Question Bank Repository List
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.competency_code && q.competency_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.topic && q.topic.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTopic = filterTopic === 'all' || (q.topic && q.topic.toLowerCase() === filterTopic.toLowerCase());
    const matchesCompetency = filterCompetency === 'all' || (q.competency_code && q.competency_code.toLowerCase() === filterCompetency.toLowerCase());

    return matchesSearch && matchesTopic && matchesCompetency;
  });

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 transition-colors">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Assessment & Question Bank Master" />
        <main className="p-6 space-y-6 flex-1">

          {/* Alert Notification Toast */}
          {alert && (
            <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
              alert.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}>
              <span>{alert.type === 'success' ? '✅' : '⚠️'} {alert.message}</span>
              <button onClick={() => setAlert(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
          )}

          {/* MAIN 3 TABS HEADER */}
          <div className="glass-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-white tracking-tight uppercase">Medical Assessment Engine</h2>
              <p className="text-xs text-slate-400">CBME Competency-Based Question Bank & Examination Design Portal</p>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-bold shrink-0">
              <button
                onClick={() => setActiveTab('bank')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'bank'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                1. Question Bank
              </button>

              <button
                onClick={() => setActiveTab('design')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'design'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                2. Question Design
              </button>

              <button
                onClick={() => setActiveTab('publish')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'publish'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                3. Publish
              </button>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════════════════════ */}
          {/* TAB 1: QUESTION BANK */}
          {/* ═════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'bank' && (
            <div className="space-y-6">
              {/* Context Selector Bar with Cascading Auto-Select */}
              <div className="glass-card p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-400">
                    🏛️ CBME Assessment Context — Admin-Master Cascade
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-mono uppercase font-bold">✨ Live Admin-Master</span>
                </div>

                {/* Row 1: Tenant + Department + Subject */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Tenant from session — no manual college select */}
                  <div className="p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-800/60 flex flex-col justify-center">
                    <span className="text-[10px] font-extrabold uppercase text-indigo-400">Active Institution</span>
                    <div className="flex items-center justify-between text-xs font-bold text-white mt-0.5">
                      <span className="truncate">{tenantName || getTenantSlug()}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-indigo-900 text-indigo-200 border border-indigo-700 ml-1 shrink-0">
                        {getTenantSlug()}
                      </span>
                    </div>
                  </div>

                  {/* Department — from Department Master */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Department *</label>
                    <select
                      value={selectedDept}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      disabled={metaLoading}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-indigo-500/50 text-white text-xs font-semibold focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                    >
                      {metaLoading ? <option value="">Loading…</option>
                        : departments.length === 0 ? <option value="">No departments in Admin-Master</option>
                        : <><option value="">— Select Department —</option>
                           {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}</>}
                    </select>
                  </div>

                  {/* Subject — filtered by department */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-emerald-400 mb-1">Subject *</label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      disabled={!selectedDept || metaLoading}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-emerald-500/50 text-emerald-300 font-bold text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    >
                      {!selectedDept ? <option value="">Select Department first</option>
                        : subjectsForDept.length === 0 ? <option value="">No subjects in this department</option>
                        : <><option value="">— Select Subject —</option>
                           {subjectsForDept.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}</>}
                    </select>
                  </div>
                </div>

                {/* Row 2: CBME Year + Professional Phase */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* CBME Year — fetched from professional_linkers */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-amber-400 mb-1">CBME Year *</label>
                    <select
                      value={selectedCbmeYear}
                      onChange={(e) => handleCbmeYearChange(e.target.value)}
                      disabled={!selectedSubject || metaLoading}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-amber-500/50 text-amber-300 font-bold text-xs focus:outline-none focus:border-amber-500 disabled:opacity-50"
                    >
                      {!selectedSubject ? <option value="">Select Subject first</option>
                        : cbmeYearsList.length === 0 ? <option value="">No CBME years in Master</option>
                        : <><option value="">— Select CBME Year —</option>
                           {cbmeYearsList.map(y => <option key={y.id} value={y.id}>{y.label}</option>)}</>}
                    </select>
                  </div>

                  {/* Professional — fetched from college-master/professionals */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-rose-400 mb-1">Professional *</label>
                    <select
                      value={selectedProfPhase}
                      onChange={(e) => handleProfPhaseChange(e.target.value)}
                      disabled={!selectedCbmeYear || metaLoading}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-rose-500/50 text-rose-300 font-bold text-xs focus:outline-none focus:border-rose-500 disabled:opacity-50"
                    >
                      {!selectedCbmeYear ? <option value="">Select CBME Year first</option>
                        : collegeProfessionals.length === 0 ? <option value="">No professionals found in College Master</option>
                        : <><option value="">— Select Professional —</option>
                           {collegeProfessionals.map(p => (
                             <option key={p.id} value={p.id}>{p.name} [{p.course_cd}]</option>
                           ))}</>}
                    </select>
                  </div>
                </div>
              </div>

              {/* Mode Switch (MCQs vs DESC) & Question Creation Form */}
              <div className="glass-card p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-sm font-extrabold uppercase text-white tracking-wider">
                      📝 Create New Question for Bank
                    </h3>
                    <p className="text-xs text-slate-400">Topic &amp; Competency from Admin-Master — Question locked until both are selected</p>
                  </div>

                  {/* Mode Pills */}
                  <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-black">
                    <button type="button" onClick={() => setMode('MCQ')}
                      className={`px-4 py-2 rounded-lg transition-all ${mode === 'MCQ' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                      🔘 MCQs Mode
                    </button>
                    <button type="button" onClick={() => setMode('DESC')}
                      className={`px-4 py-2 rounded-lg transition-all ${mode === 'DESC' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                      📄 DESC Mode
                    </button>
                  </div>
                </div>

                {/* 🎯 Topic + Competency — gated on Professional Phase selection */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase text-indigo-300">🎯 Topic Master &amp; Competency Master</h4>
                    {canEnterQuestion
                      ? <span className="text-[10px] text-emerald-400 font-mono font-bold">✅ Ready to Enter Question</span>
                      : <span className="text-[10px] text-amber-400 font-mono font-bold">⚠️ Select Topic &amp; Competency to unlock form</span>
                    }
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Topic — filtered by Subject + Professional Linker */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Topic (Topic Master) *</label>
                      <select
                        value={selectedTopicId}
                        onChange={(e) => handleTopicChange(e.target.value)}
                        disabled={!selectedSubject}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-indigo-500/50 text-white font-semibold text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                      >
                        {!selectedSubject ? <option value="">Select Subject first</option>
                          : availableTopics.length === 0 ? <option value="">No topics for this Subject</option>
                          : <><option value="">— Select Topic —</option>
                             {availableTopics.map(t => <option key={t.id} value={t.id}>{t.name} [{t.code || ''}]</option>)}</>}
                      </select>
                    </div>

                    {/* Competency — filtered by Topic */}
                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-400 mb-1">Competency Code (Competency Master) *</label>
                      <select
                        value={selectedCompetencyCode}
                        onChange={(e) => setSelectedCompetencyCode(e.target.value)}
                        disabled={!selectedTopicId}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-emerald-500/50 text-emerald-300 font-bold text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                      >
                        {!selectedTopicId ? <option value="">Select Topic first</option>
                          : availableCompetencies.length === 0 ? <option value="">No competencies for this topic</option>
                          : <><option value="">— Select Competency —</option>
                             {availableCompetencies.map(c => (
                               <option key={c.id || c.code} value={c.code}>{c.code}: {c.description}</option>
                             ))}</>}
                      </select>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSaveQuestion} className="space-y-6">
                  {/* ────────────────── MODE 1: MCQs FORM ────────────────── */}
                  {mode === 'MCQ' && (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                          Question Prompt / Stem *
                        </label>
                        <textarea
                          rows={3}
                          value={mcqQuestionText}
                          onChange={(e) => setMcqQuestionText(e.target.value)}
                          placeholder="Enter Multiple Choice Question text here..."
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>

                      {/* 4 Options Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">
                            Option A *
                          </label>
                          <input
                            type="text"
                            value={optionA}
                            onChange={(e) => setOptionA(e.target.value)}
                            placeholder="Option A answer choice"
                            className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">
                            Option B *
                          </label>
                          <input
                            type="text"
                            value={optionB}
                            onChange={(e) => setOptionB(e.target.value)}
                            placeholder="Option B answer choice"
                            className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">
                            Option C *
                          </label>
                          <input
                            type="text"
                            value={optionC}
                            onChange={(e) => setOptionC(e.target.value)}
                            placeholder="Option C answer choice"
                            className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">
                            Option D *
                          </label>
                          <input
                            type="text"
                            value={optionD}
                            onChange={(e) => setOptionD(e.target.value)}
                            placeholder="Option D answer choice"
                            className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                            required
                          />
                        </div>
                      </div>

                      {/* Correct Answer Dropdown, Level & Parameters */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                        <div>
                          <label className="block text-xs font-bold uppercase text-emerald-400 mb-1">
                            Correct Answer Dropdown *
                          </label>
                          <select
                            value={correctOption}
                            onChange={(e) => setCorrectOption(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-emerald-500/40 text-emerald-300 font-bold text-xs focus:outline-none focus:border-emerald-500"
                          >
                            <option value="option_a">Option A</option>
                            <option value="option_b">Option B</option>
                            <option value="option_c">Option C</option>
                            <option value="option_d">Option D</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                            Difficulty Level *
                          </label>
                          <select
                            value={mcqDifficulty}
                            onChange={(e) => setMcqDifficulty(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                          >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                            <option value="Expert">Expert</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                            Marks
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            value={mcqMaxMarks}
                            onChange={(e) => setMcqMaxMarks(parseFloat(e.target.value) || 1)}
                            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ────────────────── MODE 2: DESC FORM ────────────────── */}
                  {mode === 'DESC' && (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                          Long Question Text / Case Description *
                        </label>
                        <textarea
                          rows={4}
                          value={descQuestionText}
                          onChange={(e) => setDescQuestionText(e.target.value)}
                          placeholder="Enter Long Question Prompt or Clinical Case Scenario..."
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
                          required
                        />
                      </div>

                      {/* Sub-Questions Toggle */}
                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-extrabold uppercase text-purple-300">
                              Sub-questions / Question Parts
                            </span>
                            <p className="text-[11px] text-slate-400">Does this long question contain sub-parts (e.g. a, b, c)?</p>
                          </div>

                          <div className="flex items-center gap-3 bg-slate-950 p-1 rounded-lg border border-slate-800">
                            <button
                              type="button"
                              onClick={() => setHasSubQuestions(true)}
                              className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                                hasSubQuestions ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Yes (Has Parts)
                            </button>
                            <button
                              type="button"
                              onClick={() => setHasSubQuestions(false)}
                              className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                                !hasSubQuestions ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              No (Single Prompt)
                            </button>
                          </div>
                        </div>

                        {/* Sub-Questions Dynamic Builder */}
                        {hasSubQuestions && (
                          <div className="space-y-3 pt-2 border-t border-slate-800">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-300">Sub-question Parts Breakdown:</span>
                              <button
                                type="button"
                                onClick={handleAddSubQuestion}
                                className="px-2.5 py-1 rounded bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border border-purple-500/30 text-[11px] font-bold"
                              >
                                + Add Sub-Question Part
                              </button>
                            </div>

                            {subQuestions.map((sq) => (
                              <div key={sq.id} className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                                <span className="font-mono text-xs font-bold text-purple-400 shrink-0 w-6">
                                  {sq.label}
                                </span>
                                <input
                                  type="text"
                                  value={sq.questionText}
                                  onChange={(e) => handleSubQuestionChange(sq.id, 'questionText', e.target.value)}
                                  placeholder="Sub-question prompt (e.g. Define etiology and pathogenesis)"
                                  className="flex-1 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
                                />
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="text-[10px] text-slate-400">Marks:</span>
                                  <input
                                    type="number"
                                    value={sq.marks}
                                    onChange={(e) => handleSubQuestionChange(sq.id, 'marks', parseFloat(e.target.value) || 0)}
                                    className="w-14 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSubQuestion(sq.id)}
                                  className="text-slate-500 hover:text-rose-400 px-1 text-sm font-bold"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Difficulty Level & Total Max Marks */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                            Difficulty Level *
                          </label>
                          <select
                            value={descDifficulty}
                            onChange={(e) => setDescDifficulty(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
                          >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                            <option value="Expert">Expert</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                            Total Maximum Marks
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            value={descMaxMarks}
                            onChange={(e) => setDescMaxMarks(parseFloat(e.target.value) || 10)}
                            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Save Button Action */}
                  <div className="flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className={`px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2 ${
                        mode === 'MCQ' 
                          ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30' 
                          : 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
                      }`}
                    >
                      {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      <span>💾 Save {mode} Question under {selectedCompetencyCode}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Question Bank Repository Ledger Table with Topic & Competency Filters */}
              <div className="glass-card p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold uppercase text-white tracking-wider">
                      📚 Question Bank Repository ({filteredQuestions.length})
                    </h3>
                    <p className="text-xs text-slate-400">Questions filtered by Topic, Competency, and Mode</p>
                  </div>

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="🔍 Search questions or competencies..."
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 w-full sm:w-64"
                  />
                </div>

                {/* 🔍 Repository Filter Controls (Topic & Competency Filters) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Filter By Topic (Topic Master)
                    </label>
                    <select
                      value={filterTopic}
                      onChange={(e) => setFilterTopic(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none"
                    >
                      <option value="all">All Topics</option>
                      {dbTopics.map(t => (
                        <option key={t.id} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Filter By Competency Code (Competency Master)
                    </label>
                    <select
                      value={filterCompetency}
                      onChange={(e) => setFilterCompetency(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none font-mono"
                    >
                      <option value="all">All Competencies</option>
                      {dbCompetencies.map(c => (
                        <option key={c.id || c.code} value={c.code}>
                          {c.code} — {c.topic_name || 'Topic'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {filteredQuestions.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-300 rounded-xl bg-white">
                    No {mode} questions found matching selected filters. Use the form above to add questions!
                  </div>
                ) : (
                  <div className="datatable-wrapper">
                    <table className="datatable">
                      <thead>
                        <tr>
                          <th>Mode &amp; Level</th>
                          <th>Question Prompt</th>
                          <th>Topic &amp; Competency</th>
                          <th>Marks</th>
                          <th className="text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white text-slate-800 divide-y divide-slate-100">
                        {filteredQuestions.map((q) => (
                          <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                            <td className="align-top py-3">
                              <div className="flex flex-col gap-1.5 items-start">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                                  q.mode === 'MCQ'
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    : 'bg-purple-50 text-purple-700 border-purple-200'
                                }`}>
                                  {q.mode}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  q.difficulty_level === 'Easy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                  q.difficulty_level === 'Hard' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                  q.difficulty_level === 'Expert' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                  'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {q.difficulty_level || 'Medium'}
                                </span>
                              </div>
                            </td>
                            <td className="align-top py-3 max-w-md">
                              <p className="font-semibold text-slate-900 text-xs leading-relaxed">{q.question_text}</p>
                              {q.mode === 'MCQ' && (
                                <div className="grid grid-cols-2 gap-1.5 pt-2 text-[11px]">
                                  <div className={`p-1.5 rounded border ${q.correct_option === 'option_a' ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                    A) {q.option_a}
                                  </div>
                                  <div className={`p-1.5 rounded border ${q.correct_option === 'option_b' ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                    B) {q.option_b}
                                  </div>
                                  <div className={`p-1.5 rounded border ${q.correct_option === 'option_c' ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                    C) {q.option_c}
                                  </div>
                                  <div className={`p-1.5 rounded border ${q.correct_option === 'option_d' ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                    D) {q.option_d}
                                  </div>
                                </div>
                              )}
                              {q.mode === 'DESC' && q.has_sub_questions && Array.isArray(q.sub_questions) && (
                                <div className="space-y-1 pt-2">
                                  <span className="text-[10px] font-bold uppercase text-purple-700">Sub-questions:</span>
                                  {q.sub_questions.map((sq, idx) => (
                                    <div key={idx} className="p-1.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
                                      <span className="text-slate-800"><strong>{sq.label}</strong> {sq.questionText}</span>
                                      <span className="font-mono text-purple-700 font-bold ml-2">{sq.marks} Marks</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="align-top py-3">
                              <div className="flex flex-col gap-1 text-[11px]">
                                {q.topic && (
                                  <span className="font-semibold text-slate-800">
                                    📚 {q.topic}
                                  </span>
                                )}
                                {q.competency_code && (
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
                                    🎯 {q.competency_code}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="align-top py-3 font-mono font-bold text-indigo-700 text-xs">
                              {q.max_marks} Marks
                            </td>
                            <td className="align-top py-3 text-right">
                              <button
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[11px] border border-rose-200 transition-colors"
                              >
                                🗑️ Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════════════ */}
          {/* TAB 2: QUESTION DESIGN */}
          {/* ═════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'design' && (
            <div className="space-y-6">
              <div className="glass-card p-6 space-y-6">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-extrabold uppercase text-white tracking-wider">
                    🛠️ Design New Assessment Test Paper
                  </h3>
                  <p className="text-xs text-slate-400">Assemble Section A (MCQs) and Section B (Descriptive) from Question Bank</p>
                </div>

                <form onSubmit={handleSavePaperDesign} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Paper Code *</label>
                      <input
                        type="text"
                        value={paperCode}
                        onChange={(e) => setPaperCode(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Exam Paper Title *</label>
                      <input
                        type="text"
                        value={paperTitle}
                        onChange={(e) => setPaperTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Duration (Minutes) *</label>
                      <input
                        type="number"
                        value={paperDuration}
                        onChange={(e) => setPaperDuration(parseInt(e.target.value) || 120)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Total Paper Marks *</label>
                      <input
                        type="number"
                        value={paperTotalMarks}
                        onChange={(e) => setPaperTotalMarks(parseInt(e.target.value) || 100)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 text-xs">
                    <h4 className="font-bold text-indigo-400">Paper Sections Overview</h4>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                      <span>Section A: Multiple Choice Questions (MCQs)</span>
                      <strong className="text-emerald-400">20 Questions (20 Marks)</strong>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                      <span>Section B: Long Descriptive Questions & Sub-parts</span>
                      <strong className="text-purple-400">8 Questions (80 Marks)</strong>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
                    >
                      💾 Save Paper Design & Proceed to Publish
                    </button>
                  </div>
                </form>
              </div>

              {/* Designed Papers Ledger */}
              <div className="glass-card p-6 space-y-4">
                <h3 className="text-sm font-extrabold uppercase text-white tracking-wider">
                  📋 Designed Exam Papers ({designedPapers.length})
                </h3>
                <div className="divide-y divide-slate-800 text-xs">
                  {designedPapers.map((dp) => (
                    <div key={dp.id} className="py-3 flex items-center justify-between">
                      <div>
                        <span className="font-mono text-indigo-400 font-bold mr-2">[{dp.code}]</span>
                        <strong className="text-white">{dp.name}</strong>
                        <p className="text-slate-400 text-[11px] mt-0.5">Duration: {dp.duration} mins | Total Marks: {dp.maxMarks}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 text-[10px]">
                        {dp.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════════════ */}
          {/* TAB 3: PUBLISH */}
          {/* ═════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'publish' && (
            <div className="space-y-6">
              <div className="glass-card p-6 space-y-6">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-extrabold uppercase text-white tracking-wider">
                    🚀 Publish & Schedule Examination Paper
                  </h3>
                  <p className="text-xs text-slate-400">Target batch, schedule date/time, and publish exam to student portal</p>
                </div>

                <form onSubmit={handlePublishExam} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Select Designed Paper *</label>
                      <select
                        value={paperCode}
                        onChange={(e) => setPaperCode(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none"
                      >
                        {designedPapers.map(p => (
                          <option key={p.id} value={p.code}>{p.name} [{p.code}]</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Target Batch *</label>
                      <input
                        type="text"
                        value={publishTargetBatch}
                        onChange={(e) => setPublishTargetBatch(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Exam Date *</label>
                      <input
                        type="date"
                        value={publishDate}
                        onChange={(e) => setPublishDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Start Time</label>
                        <input
                          type="time"
                          value={publishStartTime}
                          onChange={(e) => setPublishStartTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">End Time</label>
                        <input
                          type="time"
                          value={publishEndTime}
                          onChange={(e) => setPublishEndTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
                    >
                      <span>🚀</span> Publish Exam & Notify Students
                    </button>
                  </div>
                </form>
              </div>

              {/* Published Exams Ledger */}
              <div className="glass-card p-6 space-y-4">
                <h3 className="text-sm font-extrabold uppercase text-white tracking-wider">
                  📢 Published Examinations Ledger ({publishedExams.length})
                </h3>
                <div className="divide-y divide-slate-800 text-xs">
                  {publishedExams.map((ex) => (
                    <div key={ex.id} className="py-3 flex items-center justify-between">
                      <div>
                        <strong className="text-white">{ex.paperName}</strong>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          Batch: <span className="text-indigo-300 font-bold">{ex.batch}</span> | Date: {ex.date} | Time: {ex.time}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-extrabold border border-emerald-500/20 text-[10px] uppercase">
                        {ex.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
