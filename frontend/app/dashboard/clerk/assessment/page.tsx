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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api/v1';

const getTenantSlug = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-cet-bareilly';
  }
  return 'srms-cet-bareilly';
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

export default function ClerkAssessmentMasterPage() {
  const [activeTab, setActiveTab] = useState<'bank' | 'design' | 'publish'>('bank');

  // Tenant from session — no manual college selection
  const [tenantName, setTenantName] = useState<string>('');

  // Clerk Context Profile State
  const [clerkDeptName, setClerkDeptName] = useState<string>('Department of Physiology');

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
  const [selectedCbmeYear, setSelectedCbmeYear] = useState<string>('');
  const [selectedProfPhase, setSelectedProfPhase] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [selectedTopicName, setSelectedTopicName] = useState<string>('');
  const [selectedCompetencyId, setSelectedCompetencyId] = useState<string>('');
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
  const [paperTitle, setPaperTitle] = useState('MBBS Physiology Sessional Exam');
  const [paperCode, setPaperCode] = useState('MED-2025-PHY-T1');
  const [paperDuration, setPaperDuration] = useState(180);
  const [paperTotalMarks, setPaperTotalMarks] = useState(100);
  const [designedPapers, setDesignedPapers] = useState<any[]>([]);

  // Dynamic Paper Sections State
  const [paperSections, setPaperSections] = useState<any[]>([
    {
      id: 'sec-1',
      name: 'Section A',
      type: 'MCQ',
      description: 'Multiple Choice Questions (20 Marks)',
      questions: [],
      practicalMarks: 0
    },
    {
      id: 'sec-2',
      name: 'Section B',
      type: 'DESC',
      description: 'Long Descriptive & Short Notes (60 Marks)',
      questions: [],
      practicalMarks: 0
    },
    {
      id: 'sec-3',
      name: 'Section C - Practical',
      type: 'PRACTICAL',
      description: 'Practical Spotting, OSPE Stations & Viva Voce (20 Marks)',
      questions: [],
      practicalMarks: 20
    }
  ]);
  const [secQuestionPick, setSecQuestionPick] = useState<{ [secId: string]: string }>({});

  const [selectedPaperToPublish, setSelectedPaperToPublish] = useState<string>('');
  const [publishTargetBatch, setPublishTargetBatch] = useState('2025-MBBS');
  const [publishDate, setPublishDate] = useState('2026-08-25');
  const [publishStartTime, setPublishStartTime] = useState('09:00');
  const [publishEndTime, setPublishEndTime] = useState('12:00');
  const [publishedExams, setPublishedExams] = useState<any[]>([]);

  const handleAddSection = () => {
    const newSecId = `sec-${Date.now()}`;
    const nextLetter = String.fromCharCode(65 + paperSections.length);
    setPaperSections(prev => [
      ...prev,
      {
        id: newSecId,
        name: `Section ${nextLetter}`,
        type: 'DESC',
        description: `Section ${nextLetter} Description`,
        questions: [],
        practicalMarks: 0
      }
    ]);
  };

  const handleRemoveSection = (secId: string) => {
    setPaperSections(prev => prev.filter(s => s.id !== secId));
  };

  const handleUpdateSectionMeta = (secId: string, field: string, value: any) => {
    setPaperSections(prev => prev.map(s => s.id === secId ? { ...s, [field]: value } : s));
  };

  const [masterBankQuestions, setMasterBankQuestions] = useState<QuestionItem[]>([]);
  const [secFilters, setSecFilters] = useState<{ [secId: string]: { type: string; topic: string; competency: string } }>({});
  const [secCheckedQIds, setSecCheckedQIds] = useState<{ [secId: string]: string[] }>({});

  const fetchMasterBankQuestions = async () => {
    const slug = getTenantSlug();
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      let url = `${API_BASE}/exams/question-bank?tenant=${slug}`;
      if (selectedDept) url += `&departmentId=${selectedDept}`;
      if (selectedSubject) url += `&subjectId=${selectedSubject}`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': slug } });
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        setMasterBankQuestions(list);
      }
    } catch {}
  };

  useEffect(() => {
    fetchMasterBankQuestions();
  }, [selectedDept, selectedSubject, activeTab]);

  const handleUpdateSectionFilter = (secId: string, field: 'type' | 'topic' | 'competency', val: string) => {
    setSecFilters(prev => ({
      ...prev,
      [secId]: {
        type: field === 'type' ? val : (prev[secId]?.type || 'ALL'),
        topic: field === 'topic' ? val : (prev[secId]?.topic || 'ALL'),
        competency: field === 'competency' ? val : (prev[secId]?.competency || 'ALL'),
      }
    }));
  };

  const handleToggleQuestionCheck = (secId: string, qId: string) => {
    setSecCheckedQIds(prev => {
      const current = prev[secId] || [];
      const updated = current.includes(qId) ? current.filter(id => id !== qId) : [...current, qId];
      return { ...prev, [secId]: updated };
    });
  };

  const handleBatchAddQuestionsToSection = (secId: string) => {
    const checkedIds = secCheckedQIds[secId] || [];
    if (checkedIds.length === 0) return;

    const targetQuestions = masterBankQuestions.filter(q => checkedIds.includes(q.id));

    setPaperSections(prev => prev.map(sec => {
      if (sec.id !== secId) return sec;
      const existingIds = sec.questions.map((q: any) => q.questionId);
      const newItems = targetQuestions
        .filter(tq => !existingIds.includes(tq.id))
        .map(tq => ({
          questionId: tq.id,
          questionText: tq.question_text,
          mode: tq.mode,
          topic: tq.topic,
          competencyCode: tq.competency_code,
          defaultMarks: Number(tq.max_marks || 2),
          customMarks: Number(tq.max_marks || 2),
          optionA: tq.option_a,
          optionB: tq.option_b,
          optionC: tq.option_c,
          optionD: tq.option_d,
          correctOption: tq.correct_option,
          subQuestions: tq.sub_questions
        }));
      return {
        ...sec,
        questions: [...sec.questions, ...newItems]
      };
    }));

    setSecCheckedQIds(prev => ({ ...prev, [secId]: [] }));
  };

  const handleSingleAddQuestionToSection = (secId: string, targetQ: QuestionItem) => {
    setPaperSections(prev => prev.map(sec => {
      if (sec.id !== secId) return sec;
      if (sec.questions.some((q: any) => q.questionId === targetQ.id)) return sec;
      return {
        ...sec,
        questions: [
          ...sec.questions,
          {
            questionId: targetQ.id,
            questionText: targetQ.question_text,
            mode: targetQ.mode,
            topic: targetQ.topic,
            competencyCode: targetQ.competency_code,
            defaultMarks: Number(targetQ.max_marks || 2),
            customMarks: Number(targetQ.max_marks || 2),
            optionA: targetQ.option_a,
            optionB: targetQ.option_b,
            optionC: targetQ.option_c,
            optionD: targetQ.option_d,
            correctOption: targetQ.correct_option,
            subQuestions: targetQ.sub_questions
          }
        ]
      };
    }));
  };

  const handleRemoveQuestionFromSection = (secId: string, qId: string) => {
    setPaperSections(prev => prev.map(sec => {
      if (sec.id !== secId) return sec;
      return { ...sec, questions: sec.questions.filter((q: any) => q.questionId !== qId) };
    }));
  };

  const handleUpdateCustomMarks = (secId: string, qId: string, newMarks: number) => {
    setPaperSections(prev => prev.map(sec => {
      if (sec.id !== secId) return sec;
      return {
        ...sec,
        questions: sec.questions.map((q: any) => q.questionId === qId ? { ...q, customMarks: newMarks } : q)
      };
    }));
  };

  // ─── Load User Context & Master Data on Mount ─────────────────────
  useEffect(() => {
    setTenantName(getTenantName());
    fetchMetadataAndUserContext();
  }, []);

  const fetchMetadataAndUserContext = async () => {
    const slug = getTenantSlug();
    setMetaLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const h = { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': slug };
      const parse = (_: any, j: any) => Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : [];

      // 1. Fetch user profile for department context
      const meRes = await fetch(`${API_BASE}/auth/me`, { headers: h });
      let userDept = 'Department of Physiology';
      if (meRes.ok) {
        const json = await meRes.json();
        const meData = json.data || json;
        const profile = meData.profile || {};
        userDept = profile.department_name || meData.departmentName || userDept;
        setClerkDeptName(userDept);
      }

      // 2. Fetch master data from backend APIs
      const [deptRes, subjRes, linkRes, profRes, topicRes, compRes] = await Promise.all([
        fetch(`${API_BASE}/admin-master/departments?tenant=${slug}`, { headers: h }),
        fetch(`${API_BASE}/admin-master/subjects?tenant=${slug}`, { headers: h }),
        fetch(`${API_BASE}/admin-master/professional-linkers?tenant=${slug}`, { headers: h }),
        fetch(`${API_BASE}/college-master/professionals?tenant=${slug}`, { headers: h }),
        fetch(`${API_BASE}/admin-master/topics?tenant=${slug}`, { headers: h }),
        fetch(`${API_BASE}/admin-master/competencies?tenant=${slug}`, { headers: h }),
      ]);

      let fetchedDepts: Department[] = [];
      let fetchedSubjs: Subject[] = [];

      if (deptRes.ok) { fetchedDepts = parse(deptRes, await deptRes.json()); setDepartments(fetchedDepts); }
      if (subjRes.ok) { fetchedSubjs = parse(subjRes, await subjRes.json()); setAllSubjects(fetchedSubjs); }
      if (linkRes.ok) { const j = await linkRes.json(); setAllLinkers(parse(linkRes, j)); }
      if (profRes.ok) { const j = await profRes.json(); setCollegeProfessionals(parse(profRes, j)); }
      if (topicRes.ok) { const j = await topicRes.json(); setDbTopics(parse(topicRes, j)); }
      if (compRes.ok) { const j = await compRes.json(); setDbCompetencies(parse(compRes, j)); }

      // 3. Auto-Select Department & Subject for Clerk
      if (fetchedDepts.length > 0) {
        const targetClean = userDept.toLowerCase().replace('department of ', '').trim();
        const matchedDept = fetchedDepts.find(d =>
          d.name.toLowerCase().includes(targetClean) || targetClean.includes(d.name.toLowerCase())
        ) || fetchedDepts[0];

        setSelectedDept(matchedDept.id);

        const deptSubjs = fetchedSubjs.filter(s => s.department_id === matchedDept.id);
        if (deptSubjs.length > 0) {
          setSelectedSubject(deptSubjs[0].id);
        } else if (fetchedSubjs.length > 0) {
          setSelectedSubject(fetchedSubjs[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to fetch Master data', e);
    } finally {
      setMetaLoading(false);
    }
  };

  // ─── Cascade handlers ─────────────────────────────
  const handleDepartmentChange = (deptId: string) => {
    setSelectedDept(deptId);
    setSelectedSubject('');
    setSelectedTopicId(''); setSelectedTopicName(''); setSelectedCompetencyCode('');
  };
  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubject(subjectId);
    setSelectedTopicId(''); setSelectedTopicName(''); setSelectedCompetencyCode('');
  };
  const handleCbmeYearChange = (year: string) => {
    setSelectedCbmeYear(year);
  };
  const handleProfPhaseChange = (profId: string) => {
    setSelectedProfPhase(profId);
  };
  const handleTopicChange = (topicId: string) => {
    setSelectedTopicId(topicId);
    const found = dbTopics.find(t => t.id === topicId);
    setSelectedTopicName(found?.name || '');
    setSelectedCompetencyCode('');
    const firstComp = dbCompetencies.find(c => c.topic_id === topicId);
    if (firstComp) setSelectedCompetencyCode(firstComp.code);
  };

  const subjectsForDept = useMemo(() => {
    if (!selectedDept) return allSubjects;
    const deptObj = departments.find(d => d.id === selectedDept);
    if (!deptObj) return allSubjects;

    const deptNameClean = deptObj.name.toLowerCase().replace('department of ', '').trim();
    const deptCodeClean = deptObj.code.toLowerCase().trim();

    const matches = allSubjects.filter(s => {
      if (s.department_id === selectedDept) return true;
      const subjDeptName = ((s as any).department_name || '').toLowerCase();
      if (subjDeptName && subjDeptName.includes(deptNameClean)) return true;

      const sName = s.name.toLowerCase();
      const sCode = s.code.toLowerCase();
      if (deptNameClean && (sName.includes(deptNameClean) || deptNameClean.includes(sName))) return true;
      if (deptCodeClean && (sCode.includes(deptCodeClean) || deptCodeClean.includes(sCode))) return true;
      return false;
    });

    return matches.length > 0 ? matches : allSubjects;
  }, [allSubjects, selectedDept, departments]);

  useEffect(() => {
    if (subjectsForDept.length > 0) {
      const exists = subjectsForDept.some(s => s.id === selectedSubject);
      if (!exists) {
        setSelectedSubject(subjectsForDept[0].id);
      }
    }
  }, [subjectsForDept, selectedSubject]);

  const cbmeYearsList = useMemo(() => {
    const map = new Map<string, string>();
    allLinkers.forEach(l => {
      const yearStr = l.academic_session || (l.name ? `${l.name} (${l.code})` : l.code);
      if (yearStr) map.set(l.id, l.name ? `${l.name} (${l.academic_session || l.code})` : yearStr);
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [allLinkers]);

  useEffect(() => {
    if (cbmeYearsList.length > 0 && !selectedCbmeYear) {
      setSelectedCbmeYear(cbmeYearsList[0].id);
    }
  }, [cbmeYearsList, selectedCbmeYear]);

  useEffect(() => {
    if (collegeProfessionals.length > 0 && !selectedProfPhase) {
      setSelectedProfPhase(collegeProfessionals[0].id);
    }
  }, [collegeProfessionals, selectedProfPhase]);

  const availableTopics = useMemo(() => {
    if (!selectedSubject) return dbTopics;
    const filtered = dbTopics.filter(t => (t as any).subject_id === selectedSubject || !(t as any).subject_id);
    return filtered.length > 0 ? filtered : dbTopics;
  }, [dbTopics, selectedSubject]);

  const availableCompetencies = useMemo(() => {
    if (!selectedTopicId) return dbCompetencies;
    const filtered = dbCompetencies.filter(c => c.topic_id === selectedTopicId || (c as any).subject_id === selectedSubject);
    return filtered.length > 0 ? filtered : dbCompetencies;
  }, [dbCompetencies, selectedTopicId, selectedSubject]);

  useEffect(() => {
    if (availableTopics.length > 0 && !selectedTopicId) {
      const firstT = availableTopics[0];
      setSelectedTopicId(firstT.id);
      setSelectedTopicName(firstT.name);
      const firstComp = availableCompetencies.find(c => c.topic_id === firstT.id) || availableCompetencies[0];
      if (firstComp) setSelectedCompetencyCode(firstComp.code);
    }
  }, [availableTopics, selectedTopicId, availableCompetencies]);

  const canEnterQuestion = !!(selectedTopicId && selectedCompetencyCode);

  useEffect(() => {
    if (selectedTopicId) fetchQuestions();
    else setQuestions([]);
  }, [selectedTopicId, selectedCompetencyCode, mode, selectedSubject]);

  const fetchQuestions = async () => {
    const slug = getTenantSlug();
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      let url = `${API_BASE}/exams/question-bank?tenant=${slug}&mode=${mode}`;
      if (selectedSubject) url += `&subjectId=${selectedSubject}`;
      if (selectedTopicName && selectedTopicName !== 'all') url += `&topic=${encodeURIComponent(selectedTopicName)}`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': slug } });
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
        setQuestions(list);
        return;
      }
      setQuestions([]);
    } catch {
      setQuestions([]);
    }
  };

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

  useEffect(() => {
    if (mode === 'DESC' && hasSubQuestions && subQuestions.length > 0) {
      const sum = subQuestions.reduce((acc, curr) => acc + (Number(curr.marks) || 0), 0);
      setDescMaxMarks(sum > 0 ? sum : 10);
    }
  }, [subQuestions, hasSubQuestions, mode]);

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEnterQuestion) {
      setAlert({ type: 'error', message: 'Please select Topic and Competency before saving a question.' });
      return;
    }
    setSaving(true);
    setAlert(null);

    const slug = getTenantSlug();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const profObj = collegeProfessionals.find(p => p.id === selectedProfPhase);
    const profLabel = profObj?.name || null;

    const payload = mode === 'MCQ' ? {
      departmentId: selectedDept || null,
      subjectId: selectedSubject || null,
      professionalPhase: profLabel,
      topicId: (selectedTopicId && selectedTopicId !== 'all') ? selectedTopicId : null,
      topic: selectedTopicName,
      competencyId: (selectedCompetencyId && selectedCompetencyId !== 'all') ? selectedCompetencyId : null,
      competencyCode: selectedCompetencyCode,
      mode: 'MCQ',
      questionText: mcqQuestionText.trim(),
      optionA: optionA.trim(),
      optionB: optionB.trim(),
      optionC: optionC.trim(),
      optionD: optionD.trim(),
      correctOption,
      difficultyLevel: mcqDifficulty,
      maxMarks: Number(mcqMaxMarks) || 1.0,
    } : {
      departmentId: selectedDept || null,
      subjectId: selectedSubject || null,
      professionalPhase: profLabel,
      topicId: (selectedTopicId && selectedTopicId !== 'all') ? selectedTopicId : null,
      topic: selectedTopicName,
      competencyId: (selectedCompetencyId && selectedCompetencyId !== 'all') ? selectedCompetencyId : null,
      competencyCode: selectedCompetencyCode,
      mode: 'DESC',
      questionText: descQuestionText.trim(),
      hasSubQuestions,
      subQuestions: hasSubQuestions ? subQuestions : [],
      difficultyLevel: descDifficulty,
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
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      await fetch(`${API_BASE}/exams/question-bank/${id}?tenant=${slug}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': slug },
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

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.competency_code && q.competency_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.topic && q.topic.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTopic = filterTopic === 'all' || (q.topic && q.topic.toLowerCase() === filterTopic.toLowerCase());
    const matchesCompetency = filterCompetency === 'all' || (q.competency_code && q.competency_code.toLowerCase() === filterCompetency.toLowerCase());

    return matchesSearch && matchesTopic && matchesCompetency;
  });

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar role="clerk" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Academic Clerk Assessment & Question Bank Entry" />
        <main className="p-6 space-y-6 flex-1">

          {/* Alert Toast Notification */}
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
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold text-indigo-400 uppercase tracking-widest">{clerkDeptName}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Auto-Selected Department
                </span>
              </div>
              <h2 className="text-lg font-black text-white tracking-tight uppercase mt-1">Clerk Medical Assessment Engine</h2>
              <p className="text-xs text-slate-400">CBME Competency-Based Question Bank &amp; Examination Setup Portal</p>
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

          {/* TAB 1: QUESTION BANK */}
          {activeTab === 'bank' && (
            <div className="space-y-6">
              <div className="glass-card p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-400">
                    🏛️ Clerk CBME Assessment Context — Department Auto-Selected
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-mono uppercase font-bold">✨ Department Auto-Assigned</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-800/60 flex flex-col justify-center">
                    <span className="text-[10px] font-extrabold uppercase text-indigo-400">Active Institution</span>
                    <div className="flex items-center justify-between text-xs font-bold text-white mt-0.5">
                      <span className="truncate">{tenantName || getTenantSlug()}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-indigo-900 text-indigo-200 border border-indigo-700 ml-1 shrink-0">
                        {getTenantSlug()}
                      </span>
                    </div>
                  </div>

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

                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-emerald-400 mb-1">Subject (Auto-Matched) *</label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      disabled={metaLoading}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-emerald-500/50 text-emerald-300 font-bold text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    >
                      {subjectsForDept.length === 0 ? <option value="">Select Department</option>
                        : subjectsForDept.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-amber-400 mb-1">CBME Year *</label>
                    <select
                      value={selectedCbmeYear}
                      onChange={(e) => handleCbmeYearChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-amber-500/50 text-amber-300 font-bold text-xs focus:outline-none focus:border-amber-500"
                    >
                      <option value="">— Select CBME Year —</option>
                      {cbmeYearsList.map(y => <option key={y.id} value={y.id}>{y.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-rose-400 mb-1">Professional Phase *</label>
                    <select
                      value={selectedProfPhase}
                      onChange={(e) => handleProfPhaseChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-rose-500/50 text-rose-300 font-bold text-xs focus:outline-none focus:border-rose-500"
                    >
                      <option value="">— Select Professional Phase —</option>
                      {collegeProfessionals.map(p => (
                        <option key={p.id} value={p.id}>{p.name} [{p.course_cd}]</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-sm font-extrabold uppercase text-white tracking-wider">
                      📝 Create New Question for Department Question Bank
                    </h3>
                    <p className="text-xs text-slate-400">Competency-Based Medical Education Question Setup</p>
                  </div>

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

                <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-500/30 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Topic Master *</label>
                      <select
                        value={selectedTopicId}
                        onChange={(e) => handleTopicChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-indigo-500/50 text-white font-semibold text-xs focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">— Select Topic —</option>
                        {availableTopics.map(t => <option key={t.id} value={t.id}>{t.name} [{t.code || ''}]</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-400 mb-1">Competency Code *</label>
                      <select
                        value={selectedCompetencyCode}
                        onChange={(e) => setSelectedCompetencyCode(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-emerald-500/50 text-emerald-300 font-bold text-xs focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">— Select Competency —</option>
                        {availableCompetencies.map(c => (
                          <option key={c.id || c.code} value={c.code}>{c.code}: {c.description}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSaveQuestion} className="space-y-6">
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Option A *</label>
                          <input
                            type="text"
                            value={optionA}
                            onChange={(e) => setOptionA(e.target.value)}
                            placeholder="Option A choice"
                            className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Option B *</label>
                          <input
                            type="text"
                            value={optionB}
                            onChange={(e) => setOptionB(e.target.value)}
                            placeholder="Option B choice"
                            className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Option C *</label>
                          <input
                            type="text"
                            value={optionC}
                            onChange={(e) => setOptionC(e.target.value)}
                            placeholder="Option C choice"
                            className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Option D *</label>
                          <input
                            type="text"
                            value={optionD}
                            onChange={(e) => setOptionD(e.target.value)}
                            placeholder="Option D choice"
                            className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                        <div>
                          <label className="block text-xs font-bold uppercase text-emerald-400 mb-1">Correct Answer *</label>
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
                          <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Difficulty Level</label>
                          <select
                            value={mcqDifficulty}
                            onChange={(e) => setMcqDifficulty(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-semibold text-xs focus:outline-none focus:border-indigo-500"
                          >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                            <option value="Expert">Expert</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Max Marks</label>
                          <input
                            type="number"
                            step="0.5"
                            value={mcqMaxMarks}
                            onChange={(e) => setMcqMaxMarks(parseFloat(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-bold text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {mode === 'DESC' && (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                          Descriptive Question Stem / Case Scenario *
                        </label>
                        <textarea
                          rows={3}
                          value={descQuestionText}
                          onChange={(e) => setDescQuestionText(e.target.value)}
                          placeholder="Enter Long Answer Question (LAQ) or Short Answer Question (SAQ) prompt..."
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="hasSubQuestionsClerk"
                          checked={hasSubQuestions}
                          onChange={(e) => setHasSubQuestions(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500"
                        />
                        <label htmlFor="hasSubQuestionsClerk" className="text-xs text-white font-semibold cursor-pointer">
                          Contains Sub-Questions (e.g. a), b), c) with individual marks)
                        </label>
                      </div>

                      {hasSubQuestions && (
                        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-purple-300 uppercase">Sub-Questions Breakdown</span>
                            <button
                              type="button"
                              onClick={handleAddSubQuestion}
                              className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold shadow"
                            >
                              + Add Sub-Question
                            </button>
                          </div>

                          <div className="space-y-2">
                            {subQuestions.map((sq) => (
                              <div key={sq.id} className="flex items-center gap-2">
                                <span className="text-xs font-bold text-purple-400 w-6 text-center">{sq.label}</span>
                                <input
                                  type="text"
                                  placeholder="Sub-question prompt"
                                  value={sq.questionText}
                                  onChange={(e) => handleSubQuestionChange(sq.id, 'questionText', e.target.value)}
                                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
                                />
                                <input
                                  type="number"
                                  placeholder="Marks"
                                  value={sq.marks}
                                  onChange={(e) => handleSubQuestionChange(sq.id, 'marks', Number(e.target.value))}
                                  className="w-20 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-bold text-center"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSubQuestion(sq.id)}
                                  className="text-slate-400 hover:text-rose-400 text-xs px-2"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg transition"
                    >
                      {saving ? 'Saving...' : `💾 Save ${mode} Question to Bank`}
                    </button>
                  </div>
                </form>
              </div>

              {/* Question Ledger Table */}
              <div className="glass-card p-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                      Question Bank Repository ({questions.length} Items)
                    </h3>
                    <p className="text-xs text-slate-400">Authentic Competency-Based MCQs &amp; Descriptive Questions</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="🔍 Search questions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-3.5 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {questions.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">No questions saved under this topic yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                          <th className="py-3 px-4 w-32">Mode &amp; Level</th>
                          <th className="py-3 px-4">Question Prompt</th>
                          <th className="py-3 px-4 w-64">Topic &amp; Competency</th>
                          <th className="py-3 px-4 w-28 text-center">Marks</th>
                          <th className="py-3 px-4 w-24 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {filteredQuestions.map((q) => {
                          let parsedSubs: SubQuestion[] = [];
                          if (q.has_sub_questions && q.sub_questions) {
                            try {
                              parsedSubs = typeof q.sub_questions === 'string' ? JSON.parse(q.sub_questions) : q.sub_questions;
                            } catch {}
                          }

                          return (
                            <tr key={q.id} className="hover:bg-slate-900/40 transition">
                              {/* Mode & Level */}
                              <td className="py-4 px-4 align-top space-y-2">
                                <div>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase border ${
                                    q.mode === 'MCQ' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                  }`}>
                                    {q.mode}
                                  </span>
                                </div>
                                <div>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    {q.difficulty_level || 'Medium'}
                                  </span>
                                </div>
                              </td>

                              {/* Question Prompt */}
                              <td className="py-4 px-4 align-top space-y-3">
                                <p className="font-extrabold text-white text-xs leading-relaxed">{q.question_text}</p>

                                {/* MCQ Options Grid */}
                                {q.mode === 'MCQ' && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl">
                                    {['a', 'b', 'c', 'd'].map((letter) => {
                                      const key = `option_${letter}` as keyof QuestionItem;
                                      const text = q[key] as string;
                                      if (!text) return null;
                                      const isCorrect = q.correct_option === `option_${letter}`;
                                      return (
                                        <div
                                          key={letter}
                                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-between ${
                                            isCorrect
                                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 font-bold'
                                              : 'bg-slate-900/80 text-slate-300 border-slate-800'
                                          }`}
                                        >
                                          <span>{letter.toUpperCase()}) {text}</span>
                                          {isCorrect && <span className="text-[10px] text-emerald-400 font-black">✓</span>}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Sub-Questions Box for DESC */}
                                {q.mode === 'DESC' && parsedSubs.length > 0 && (
                                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 max-w-lg">
                                    <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider">SUB-QUESTIONS:</span>
                                    <div className="space-y-1">
                                      {parsedSubs.map((sq, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-xs px-2 py-1 rounded bg-slate-950/60 border border-slate-800">
                                          <span className="font-semibold text-slate-200">{sq.label || `${idx + 1}.`} {sq.questionText}</span>
                                          <span className="font-bold text-purple-300 text-[10px]">{sq.marks} Marks</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </td>

                              {/* Topic & Competency */}
                              <td className="py-4 px-4 align-top space-y-1.5">
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
                                  <span>📚</span>
                                  <span className="truncate">{q.topic || 'General Physiology'}</span>
                                </div>
                                <div>
                                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 inline-block">
                                    🎯 {q.competency_code || 'PY1.1(2024)'}
                                  </span>
                                </div>
                              </td>

                              {/* Marks */}
                              <td className="py-4 px-4 align-top text-center font-black text-indigo-400 text-xs">
                                {Number(q.max_marks || 2).toFixed(2)} Marks
                              </td>

                              {/* Action */}
                              <td className="py-4 px-4 align-top text-right">
                                <button
                                  onClick={() => handleDeleteQuestion(q.id)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold transition"
                                >
                                  🗑️ Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })}
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
              {/* Context Bar */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-medium">Active Design Context:</span>
                  <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-300 font-bold border border-indigo-500/20">
                    🏛️ {departments.find(d => d.id === selectedDept)?.name || clerkDeptName}
                  </span>
                  <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/20">
                    📖 {subjectsForDept.find(s => s.id === selectedSubject)?.name || 'PHYSIOLOGY'}
                  </span>
                  <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20">
                    🎓 CBME 2024 (NMC)
                  </span>
                  <span className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-300 font-bold border border-rose-500/20">
                    📅 Batch 2025 (1st Prof)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow transition"
                >
                  ➕ Add New Section (A, B, C...)
                </button>
              </div>

              {/* Main Paper Header Form */}
              <div className="glass-card p-6 space-y-6">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                      📝 Examination Paper Design Generator
                    </h3>
                    <p className="text-xs text-slate-400">Assemble Section A, B, C (MCQs, Descriptive, Practical / OSPE)</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-semibold text-slate-400">Calculated Total Marks:</span>
                    <div className="text-lg font-black text-emerald-400">
                      {paperSections.reduce((acc, sec) => {
                        let secTot = sec.type === 'PRACTICAL' ? Number(sec.practicalMarks || 0) : 0;
                        sec.questions.forEach((q: any) => { secTot += Number(q.customMarks || q.defaultMarks || 0); });
                        return acc + secTot;
                      }, 0)} Marks
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSavePaperDesign} className="space-y-6">
                  {/* Paper Header Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-slate-300 mb-1">
                        Exam Paper Title *
                      </label>
                      <input
                        type="text"
                        value={paperTitle}
                        onChange={(e) => setPaperTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-slate-300 mb-1">
                        Paper Code *
                      </label>
                      <input
                        type="text"
                        value={paperCode}
                        onChange={(e) => setPaperCode(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-slate-300 mb-1">
                        Duration (Mins) *
                      </label>
                      <input
                        type="number"
                        value={paperDuration}
                        onChange={(e) => setPaperDuration(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-emerald-400 mb-1">
                        Target Total Marks *
                      </label>
                      <input
                        type="number"
                        value={paperTotalMarks}
                        onChange={(e) => setPaperTotalMarks(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-emerald-500/50 text-emerald-300 font-bold text-xs focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Dynamic Paper Sections List */}
                  <div className="space-y-6 pt-4 border-t border-slate-800">
                    {paperSections.map((sec, secIdx) => {
                      const secMarks = sec.questions.reduce((acc: number, q: any) => acc + Number(q.customMarks || q.defaultMarks || 0), 0) + (sec.type === 'PRACTICAL' ? Number(sec.practicalMarks || 0) : 0);

                      return (
                        <div key={sec.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                          {/* Section Header Controls */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                            <div className="flex items-center gap-3 flex-1">
                              <input
                                type="text"
                                value={sec.name}
                                onChange={(e) => handleUpdateSectionMeta(sec.id, 'name', e.target.value)}
                                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-black text-xs uppercase w-44"
                              />
                              <select
                                value={sec.type}
                                onChange={(e) => handleUpdateSectionMeta(sec.id, 'type', e.target.value)}
                                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-indigo-500/50 text-indigo-300 font-bold text-xs"
                              >
                                <option value="MCQ">Section Type: MCQs</option>
                                <option value="DESC">Section Type: Descriptive</option>
                                <option value="PRACTICAL">Section Type: Practical / OSPE</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg">
                                Section Subtotal: {secMarks} Marks
                              </span>
                              {paperSections.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSection(sec.id)}
                                  className="text-xs text-rose-400 hover:text-rose-300 font-bold px-2 py-1"
                                >
                                  ✕ Remove Section
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Section Description */}
                          <div>
                            <input
                              type="text"
                              value={sec.description}
                              placeholder="Section instructions or description..."
                              onChange={(e) => handleUpdateSectionMeta(sec.id, 'description', e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs"
                            />
                          </div>

                          {/* Practical Marks Input for Practical Section */}
                          {sec.type === 'PRACTICAL' && (
                            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 flex items-center justify-between gap-4">
                              <div>
                                <h4 className="text-xs font-extrabold text-purple-300">🧪 Practical &amp; OSPE Viva Voce Station Marks</h4>
                                <p className="text-[11px] text-slate-400">Set overall practical performance and table viva allocation marks</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-300">Practical Marks:</span>
                                <input
                                  type="number"
                                  value={sec.practicalMarks || 0}
                                  onChange={(e) => handleUpdateSectionMeta(sec.id, 'practicalMarks', Number(e.target.value))}
                                  className="w-24 px-3 py-1.5 rounded-lg bg-slate-900 border border-purple-500/50 text-purple-300 font-black text-xs text-center"
                                />
                              </div>
                            </div>
                          )}

                          {/* Step-by-Step Question Picker Card for Section */}
                          <div className="p-4 rounded-xl bg-slate-950/80 border border-indigo-500/30 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                              <h4 className="text-xs font-extrabold uppercase text-indigo-300 tracking-wider">
                                🔍 Step-by-Step Question Bank Selector &amp; Checklist for {sec.name}
                              </h4>
                              <span className="text-[11px] font-bold text-slate-400">
                                Loaded Master Questions: {masterBankQuestions.length} Items
                              </span>
                            </div>

                            {/* Step 1, 2, 3 Filters Bar */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                              {/* Step 1: Type Filter */}
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                                  1. Select Question Type *
                                </label>
                                <select
                                  value={secFilters[sec.id]?.type || sec.type || 'ALL'}
                                  onChange={(e) => handleUpdateSectionFilter(sec.id, 'type', e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold text-xs"
                                >
                                  <option value="ALL">🌐 All Types (MCQs &amp; DESC)</option>
                                  <option value="MCQ">🔘 MCQs Only</option>
                                  <option value="DESC">📄 Descriptive Only</option>
                                </select>
                              </div>

                              {/* Step 2: Topic Filter */}
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                                  2. Select Topic (Single Cascade) *
                                </label>
                                <select
                                  value={secFilters[sec.id]?.topic || 'ALL'}
                                  onChange={(e) => {
                                    const newTopic = e.target.value;
                                    setSecFilters(prev => ({
                                      ...prev,
                                      [sec.id]: {
                                        type: prev[sec.id]?.type || sec.type || 'ALL',
                                        topic: newTopic,
                                        competency: 'ALL' // Reset competency when topic changes
                                      }
                                    }));
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-semibold text-xs"
                                >
                                  <option value="ALL">— All Physiology Topics ({availableTopics.length}) —</option>
                                  {availableTopics.map(t => (
                                    <option key={t.id} value={t.name}>{t.name}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Step 3: Competency Filter (Single Topic Cascade) */}
                              {(() => {
                                const currentTopicName = secFilters[sec.id]?.topic || 'ALL';
                                const selTopicObj = availableTopics.find(t => t.name === currentTopicName);
                                const sectionCompetencies = currentTopicName === 'ALL'
                                  ? availableCompetencies
                                  : (selTopicObj
                                      ? availableCompetencies.filter(c => c.topic_id === selTopicObj.id)
                                      : availableCompetencies);
                                const displayComps = sectionCompetencies.length > 0 ? sectionCompetencies : availableCompetencies;

                                return (
                                  <div>
                                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                                      3. Select Competency (Single Topic Cascade) *
                                    </label>
                                    <select
                                      value={secFilters[sec.id]?.competency || 'ALL'}
                                      onChange={(e) => handleUpdateSectionFilter(sec.id, 'competency', e.target.value)}
                                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-emerald-300 font-bold text-xs"
                                    >
                                      <option value="ALL">— All Topic Competencies ({displayComps.length}) —</option>
                                      {displayComps.map(c => (
                                        <option key={c.id || c.code} value={c.code}>{c.code}: {c.description ? c.description.slice(0, 45) : c.code}...</option>
                                      ))}
                                    </select>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Step 4: Questions Checklist Table */}
                            {(() => {
                              const secF = secFilters[sec.id] || { type: sec.type || 'ALL', topic: 'ALL', competency: 'ALL' };
                              const normalizeCode = (str?: string) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                              const availableFiltered = masterBankQuestions.filter(q => {
                                const matchType = secF.type === 'ALL' || q.mode === secF.type;
                                const matchTopic = secF.topic === 'ALL' || (q.topic && (
                                  q.topic.toLowerCase() === secF.topic.toLowerCase() ||
                                  q.topic.toLowerCase().includes(secF.topic.toLowerCase()) ||
                                  secF.topic.toLowerCase().includes(q.topic.toLowerCase()) ||
                                  (secF.topic.includes('01') && q.topic.toLowerCase().includes('general')) ||
                                  (secF.topic.includes('02') && (q.topic.toLowerCase().includes('haematology') || q.topic.toLowerCase().includes('blood')))
                                ));
                                const matchComp = secF.competency === 'ALL' || (q.competency_code && (
                                  q.competency_code.toLowerCase() === secF.competency.toLowerCase() ||
                                  normalizeCode(q.competency_code).includes(normalizeCode(secF.competency)) ||
                                  normalizeCode(secF.competency).includes(normalizeCode(q.competency_code))
                                ));
                                return matchType && matchTopic && matchComp;
                              });

                              const checkedList = secCheckedQIds[sec.id] || [];

                              return (
                                <div className="space-y-3 pt-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-300">
                                      Step 4: Check questions to add to {sec.name} ({availableFiltered.length} Available)
                                    </span>
                                    {checkedList.length > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => handleBatchAddQuestionsToSection(sec.id)}
                                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow"
                                      >
                                        ➕ Add Selected ({checkedList.length} Questions) to {sec.name}
                                      </button>
                                    )}
                                  </div>

                                  {availableFiltered.length === 0 ? (
                                    <div className="py-4 text-center text-slate-500 text-xs italic bg-slate-900/60 rounded-lg">
                                      No questions match the selected filters. Change topic or competency dropdown.
                                    </div>
                                  ) : (
                                    <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 border border-slate-800 rounded-lg p-2 bg-slate-900/50">
                                      {availableFiltered.map((q) => {
                                        const isChecked = checkedList.includes(q.id);
                                        const isAlreadyInSec = sec.questions.some((sq: any) => sq.questionId === q.id);

                                        return (
                                          <div
                                            key={q.id}
                                            className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 text-xs transition ${
                                              isAlreadyInSec
                                                ? 'bg-slate-950/40 border-slate-800 opacity-60'
                                                : isChecked
                                                ? 'bg-indigo-950/40 border-indigo-500/50'
                                                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                                            }`}
                                          >
                                            <div className="flex items-start gap-2.5 flex-1">
                                              <input
                                                type="checkbox"
                                                disabled={isAlreadyInSec}
                                                checked={isChecked}
                                                onChange={() => handleToggleQuestionCheck(sec.id, q.id)}
                                                className="mt-0.5 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                                              />
                                              <div className="space-y-0.5">
                                                <p className="font-semibold text-white leading-relaxed">{q.question_text}</p>
                                                <div className="flex flex-wrap items-center gap-2 text-[10px]">
                                                  <span className={`px-1.5 py-0.2 rounded font-bold border ${
                                                    q.mode === 'MCQ' ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                                                  }`}>
                                                    {q.mode}
                                                  </span>
                                                  <span className="px-1.5 py-0.2 rounded font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                                                    🎯 {q.competency_code || 'PY1.1'}
                                                  </span>
                                                  <span className="text-slate-400">📚 {q.topic}</span>
                                                  <span className="font-bold text-amber-300">({q.max_marks || 2} Marks)</span>
                                                </div>
                                              </div>
                                            </div>

                                            {isAlreadyInSec ? (
                                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap">
                                                ✓ Added
                                              </span>
                                            ) : (
                                              <button
                                                type="button"
                                                onClick={() => handleSingleAddQuestionToSection(sec.id, q)}
                                                className="px-2.5 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 font-bold text-[11px] border border-indigo-500/40 whitespace-nowrap transition"
                                              >
                                                + Add
                                              </button>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>

                          {/* Added Questions List in Section */}
                          {sec.questions.length === 0 ? (
                            <div className="text-center py-4 text-slate-500 text-xs italic">
                              No questions added to {sec.name} yet. Use the dropdown above to add questions.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {sec.questions.map((q: any, qIdx: number) => (
                                <div key={q.questionId} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                                  <div className="flex items-start gap-2.5 flex-1">
                                    <span className="font-mono text-indigo-400 font-bold">{qIdx + 1}.</span>
                                    <div className="space-y-1">
                                      <p className="font-bold text-white leading-relaxed">{q.questionText}</p>
                                      <div className="flex items-center gap-2 text-[10px]">
                                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-bold border border-indigo-500/20">
                                          {q.mode}
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/20">
                                          🎯 {q.competencyCode || 'PY1.1'}
                                        </span>
                                        <span className="text-slate-400">📚 {q.topic}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[11px] font-semibold text-slate-400">Question Marks:</span>
                                      <input
                                        type="number"
                                        value={q.customMarks}
                                        onChange={(e) => handleUpdateCustomMarks(sec.id, q.questionId, Number(e.target.value))}
                                        className="w-16 px-2 py-1 rounded bg-slate-900 border border-indigo-500/50 text-indigo-300 font-extrabold text-xs text-center"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveQuestionFromSection(sec.id, q.questionId)}
                                      className="text-rose-400 hover:text-rose-300 text-xs px-2"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Save Action Bar */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    <p className="text-xs text-slate-400">
                      Saving paper design commits sections to PostgreSQL database with status <strong className="text-emerald-400">Approved</strong>.
                    </p>
                    <button
                      type="submit"
                      className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs shadow-xl shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5"
                    >
                      💾 Generate &amp; Save Paper Design
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════════════ */}
          {/* TAB 3: PUBLISH */}
          {/* ═════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'publish' && (
            <div className="space-y-6">
              {/* Context Bar */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-medium">Publishing Context:</span>
                  <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-300 font-bold border border-indigo-500/20">
                    🏛️ {departments.find(d => d.id === selectedDept)?.name || clerkDeptName}
                  </span>
                  <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/20">
                    📖 {subjectsForDept.find(s => s.id === selectedSubject)?.name || 'PHYSIOLOGY'}
                  </span>
                  <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20">
                    🎓 CBME 2024 (NMC)
                  </span>
                  <span className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-300 font-bold border border-rose-500/20">
                    📅 Batch 2025 (1st Prof)
                  </span>
                </div>
              </div>

              {/* Publish Form */}
              <div className="glass-card p-6 space-y-6">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                    🚀 Publish &amp; Schedule Approved Examination Paper
                  </h3>
                  <p className="text-xs text-slate-400">Target student batch, schedule date/time, and verify examination publishing</p>
                </div>

                <form onSubmit={handlePublishExam} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-slate-300 mb-1">
                        Select Approved Exam Paper *
                      </label>
                      <select
                        value={selectedPaperToPublish}
                        onChange={(e) => setSelectedPaperToPublish(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-indigo-500/50 text-indigo-300 font-bold text-xs focus:ring-2 focus:ring-indigo-500"
                        required
                      >
                        {designedPapers.length === 0 ? (
                          <option value="">No Designed Papers Found — Design Paper First in Tab 2</option>
                        ) : (
                          designedPapers.map(p => (
                            <option key={p.id} value={p.id}>
                              [{p.code}] {p.name} ({p.max_marks || p.maxMarks || 100} Marks) — ✓ Approved
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-slate-300 mb-1">
                        Target Student Batch *
                      </label>
                      <select
                        value={publishTargetBatch}
                        onChange={(e) => setPublishTargetBatch(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="2025-MBBS">Batch 2025-MBBS (1st Professional Current)</option>
                        <option value="2024-MBBS">Batch 2024-MBBS (2nd Professional)</option>
                        <option value="2023-MBBS">Batch 2023-MBBS (3rd Professional)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-slate-300 mb-1">
                        Exam Schedule Date *
                      </label>
                      <input
                        type="date"
                        value={publishDate}
                        onChange={(e) => setPublishDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-slate-300 mb-1">
                        Start Time *
                      </label>
                      <input
                        type="time"
                        value={publishStartTime}
                        onChange={(e) => setPublishStartTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-slate-300 mb-1">
                        End Time *
                      </label>
                      <input
                        type="time"
                        value={publishEndTime}
                        onChange={(e) => setPublishEndTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-800">
                    <button
                      type="submit"
                      className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-xl shadow-emerald-600/30 transition-all transform hover:-translate-y-0.5"
                    >
                      🚀 Publish &amp; Schedule Examination
                    </button>
                  </div>
                </form>
              </div>

              {/* Approved & Designed Papers Ledger Table */}
              <div className="glass-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                      📋 Approved &amp; Designed Exam Papers List ({designedPapers.length})
                    </h3>
                    <p className="text-xs text-slate-400">Verified examination papers ready for student portal publication</p>
                  </div>
                </div>

                {designedPapers.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs italic">
                    No approved exam papers found. Design an examination paper in Tab 2 first.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                          <th className="py-3 px-4">Paper Details</th>
                          <th className="py-3 px-4">Paper Code</th>
                          <th className="py-3 px-4 text-center">Duration &amp; Marks</th>
                          <th className="py-3 px-4 text-center">Approval Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {designedPapers.map((dp) => (
                          <tr key={dp.id} className="hover:bg-slate-900/40 transition">
                            <td className="py-4 px-4 align-top">
                              <span className="font-extrabold text-white text-xs block">{dp.name}</span>
                              <span className="text-[10px] text-slate-400">Physiology — Batch 2025 (1st Prof)</span>
                            </td>
                            <td className="py-4 px-4 align-top font-mono text-indigo-300 font-bold">
                              {dp.code}
                            </td>
                            <td className="py-4 px-4 align-top text-center">
                              <span className="font-bold text-amber-300 block">{dp.duration_minutes || dp.duration || 180} mins</span>
                              <span className="text-[11px] font-black text-emerald-400">{dp.max_marks || dp.maxMarks || 100} Marks</span>
                            </td>
                            <td className="py-4 px-4 align-top text-center">
                              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase tracking-wider inline-block">
                                ✓ Approved in MCQs &amp; DESC Mode
                              </span>
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

        </main>
      </div>
    </div>
  );
}
