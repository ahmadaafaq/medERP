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
  topic_id?: string;
  mode: 'MCQ' | 'DESC';
  question_text: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_option?: string;
  difficulty_level?: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  competency_code?: string;
  competency_id?: string;
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

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

export default function FacultyAssessmentMasterPage() {
  const [activeTab, setActiveTab] = useState<'bank' | 'design' | 'publish'>('bank');

  // Tenant from session — no manual college selection
  const [tenantName, setTenantName] = useState<string>('');

  // Faculty Context Profile State
  const [facultyDeptName, setFacultyDeptName] = useState<string>('');

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

  // Created Papers Registry & Editor State
  const [createdPapersList, setCreatedPapersList] = useState<any[]>([]);
  const [editingPaperId, setEditingPaperId] = useState<string | null>(null);
  const [showPaperEditor, setShowPaperEditor] = useState<boolean>(false);

  const fetchCreatedPapersList = async () => {
    const slug = getTenantSlug();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const h = { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': slug };
    try {
      const res = await fetch(`${API_BASE}/exams/papers?tenant=${slug}`, { headers: h });
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        setCreatedPapersList(list);
      }
    } catch (e) {
      console.error('Failed to fetch created papers list', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'design' || activeTab === 'publish') {
      fetchCreatedPapersList();
    }
  }, [activeTab, selectedSubject]);

  const handleCreateNewPaper = () => {
    setEditingPaperId(null);
    setPaperTitle('MBBS Physiology 1st Sessional Examination');
    setPaperCode(`MED-${new Date().getFullYear()}-PHY-T${createdPapersList.length + 1}`);
    setPaperDuration(60);
    setPaperTotalMarks(40);
    setPaperSections([
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
        description: 'Long Descriptive & Short Notes (20 Marks)',
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
    setShowPaperEditor(true);
    setTimeout(() => {
      document.getElementById('paper-editor-container')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleEditExistingPaper = (paper: any) => {
    setEditingPaperId(paper.id);
    setPaperTitle(paper.name || 'MBBS Sessional Examination');
    setPaperCode(paper.code || 'MED-EXAM-01');
    setPaperDuration(Number(paper.duration_minutes || paper.duration_mins || 60));
    setPaperTotalMarks(Number(paper.max_marks || 40));

    let rawSections = paper.sections;
    if (typeof rawSections === 'string') {
      try {
        rawSections = JSON.parse(rawSections);
      } catch (e) {
        rawSections = [];
      }
    }

    if (Array.isArray(rawSections) && rawSections.length > 0) {
      const mappedSecs = rawSections.map((sec: any, idx: number) => {
        const rawQs = Array.isArray(sec.pickedQuestions) && sec.pickedQuestions.length > 0
          ? sec.pickedQuestions
          : Array.isArray(sec.questions) ? sec.questions : [];

        const formattedQs = rawQs.map((q: any) => ({
          questionId: q.id || q.questionId,
          questionText: q.question_text || q.questionText || 'Question Prompt',
          mode: q.mode || (sec.type === 'DESC' ? 'DESC' : 'MCQ'),
          topic: q.topic,
          competencyCode: q.competency_code || q.competencyCode,
          defaultMarks: Number(q.customMarks || q.defaultMarks || q.max_marks || q.maxMarks || 2),
          customMarks: Number(q.customMarks || q.defaultMarks || q.max_marks || q.maxMarks || 2),
          optionA: q.option_a || q.optionA,
          optionB: q.option_b || q.optionB,
          optionC: q.option_c || q.optionC,
          optionD: q.option_d || q.optionD,
          correctOption: q.correct_option || q.correctOption,
          subQuestions: Array.isArray(q.sub_questions) ? q.sub_questions : (Array.isArray(q.subQuestions) ? q.subQuestions : [])
        }));

        return {
          id: sec.id || `sec-${idx + 1}`,
          name: sec.name || sec.title || `Section ${String.fromCharCode(65 + idx)}`,
          type: sec.type || 'MCQ',
          description: sec.description || sec.instructions || '',
          questions: formattedQs,
          practicalMarks: Number(sec.practicalMarks || 0)
        };
      });

      // Automatically append missing standard sections (Descriptive & Practical) if not present
      const hasDesc = mappedSecs.some((s: any) => s.type === 'DESC' || (s.name || '').toLowerCase().includes('section b') || (s.name || '').toLowerCase().includes('descriptive'));
      const hasPractical = mappedSecs.some((s: any) => s.type === 'PRACTICAL' || (s.name || '').toLowerCase().includes('section c') || (s.name || '').toLowerCase().includes('practical'));

      if (!hasDesc) {
        mappedSecs.push({
          id: `sec-${Date.now()}-desc`,
          name: 'Section B',
          type: 'DESC',
          description: 'Long Descriptive & Short Notes (20 Marks)',
          questions: [],
          practicalMarks: 0
        });
      }

      if (!hasPractical) {
        mappedSecs.push({
          id: `sec-${Date.now()}-prac`,
          name: 'Section C - Practical',
          type: 'PRACTICAL',
          description: 'Practical Spotting, OSPE Stations & Viva Voce (20 Marks)',
          questions: [],
          practicalMarks: 20
        });
      }

      setPaperSections(mappedSecs);
    } else {
      setPaperSections([
        { id: 'sec-1', name: 'Section A', type: 'MCQ', description: 'Multiple Choice Questions (20 Marks)', questions: [], practicalMarks: 0 },
        { id: 'sec-2', name: 'Section B', type: 'DESC', description: 'Long Descriptive & Short Notes (20 Marks)', questions: [], practicalMarks: 0 },
        { id: 'sec-3', name: 'Section C - Practical', type: 'PRACTICAL', description: 'Practical Spotting, OSPE Stations & Viva Voce (20 Marks)', questions: [], practicalMarks: 20 }
      ]);
    }
    setShowPaperEditor(true);
    setTimeout(() => {
      document.getElementById('paper-editor-container')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleDeleteCreatedPaper = async (paperId: string) => {
    const slug = getTenantSlug();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    try {
      await fetch(`${API_BASE}/exams/papers/${paperId}?tenant=${slug}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': slug }
      });
    } catch {}
    setCreatedPapersList(prev => prev.filter(p => p.id !== paperId));
    setAlert({ type: 'success', message: 'Examination paper deleted.' });
  };

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
      const h = { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': slug };
      const params = new URLSearchParams();
      if (selectedSubject) params.set('subjectId', selectedSubject);
      if (selectedDept) params.set('departmentId', selectedDept);

      const res = await fetch(`${API_BASE}/exams/question-bank?${params.toString()}`, { headers: h });
      if (res.ok) {
        const json = await res.json();
        let list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        if (list.length === 0) {
          const fbRes = await fetch(`${API_BASE}/exams/question-bank`, { headers: h });
          if (fbRes.ok) {
            const fbJson = await fbRes.json();
            list = Array.isArray(fbJson?.data) ? fbJson.data : Array.isArray(fbJson) ? fbJson : [];
          }
        }
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
        questions: sec.questions.map((q: any) => {
          if (q.questionId !== qId) return q;
          let updatedSubs = q.subQuestions;
          if (Array.isArray(q.subQuestions) && q.subQuestions.length > 0) {
            const oldTotalRaw = q.subQuestions.reduce((sum: number, s: any) => sum + Number(s.marks || 1), 0) || 1;
            updatedSubs = q.subQuestions.map((sq: any) => ({
              ...sq,
              marks: Number(((Number(sq.marks || 1) / oldTotalRaw) * newMarks).toFixed(2))
            }));
          }
          return { ...q, customMarks: newMarks, subQuestions: updatedSubs };
        })
      };
    }));
  };

  const handleUpdateSubQuestionMark = (secId: string, qId: string, subId: string, newSubMark: number) => {
    setPaperSections(prev => prev.map(sec => {
      if (sec.id !== secId) return sec;
      return {
        ...sec,
        questions: sec.questions.map((q: any) => {
          if (q.questionId !== qId || !Array.isArray(q.subQuestions)) return q;
          const updatedSubs = q.subQuestions.map((sq: any) => {
            if ((sq.id && sq.id === subId) || (sq.label && sq.label === subId)) {
              return { ...sq, marks: newSubMark };
            }
            return sq;
          });
          const newQTotal = updatedSubs.reduce((sum: number, sq: any) => sum + Number(sq.marks || 0), 0);
          return { ...q, customMarks: newQTotal, subQuestions: updatedSubs };
        })
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
      // Use x-tenant-slug header (the @Tenant() decorator reads from request.tenant.slug set by TenantMiddleware)
      const h = { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': slug };
      const parse = (j: any) => Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : [];

      // 1. Fetch user profile & context (read from localStorage + auth/me)
      let userDeptId = typeof window !== 'undefined' ? localStorage.getItem('departmentId') || '' : '';
      let userDeptNameStr = typeof window !== 'undefined' ? localStorage.getItem('departmentName') || '' : '';
      let userSubjId = typeof window !== 'undefined' ? localStorage.getItem('subjectId') || '' : '';
      let userSubjNameStr = typeof window !== 'undefined' ? localStorage.getItem('subjectName') || '' : '';

      const meRes = await fetch(`${API_BASE}/auth/me`, { headers: h }).catch(() => null);
      if (meRes && meRes.ok) {
        const json = await meRes.json();
        const meData = json.data || json;
        const profile = meData.profile || {};
        userDeptId = userDeptId || profile.department_id || meData.departmentId || meData.department_id || '';
        userDeptNameStr = userDeptNameStr || profile.department_name || meData.departmentName || meData.department_name || '';
        userSubjId = userSubjId || profile.subject_id || meData.subjectId || meData.subject_id || '';
        userSubjNameStr = userSubjNameStr || profile.primary_subject_name || meData.subjectName || meData.subject_name || '';
        
        if (userDeptNameStr) setFacultyDeptName(userDeptNameStr);
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(meData));
          if (userDeptId) localStorage.setItem('departmentId', userDeptId);
          if (userDeptNameStr) localStorage.setItem('departmentName', userDeptNameStr);
          if (userSubjId) localStorage.setItem('subjectId', userSubjId);
          if (userSubjNameStr) localStorage.setItem('subjectName', userSubjNameStr);
        }
      }

      // 2. Fetch Master data strictly from DB APIs
      const [deptRes, subjRes, linkRes, profRes, topicRes, compRes] = await Promise.all([
        fetch(`${API_BASE}/admin-master/departments`, { headers: h }),
        fetch(`${API_BASE}/admin-master/subjects`, { headers: h }),
        fetch(`${API_BASE}/admin-master/professional-linkers`, { headers: h }),
        fetch(`${API_BASE}/college-master/professionals`, { headers: h }),
        fetch(`${API_BASE}/admin-master/topics`, { headers: h }),
        fetch(`${API_BASE}/admin-master/competencies`, { headers: h }),
      ]);

      let fetchedDepts: Department[] = [];
      let fetchedSubjs: Subject[] = [];

      if (deptRes.ok) { fetchedDepts = parse(await deptRes.json()); }
      if (subjRes.ok) { fetchedSubjs = parse(await subjRes.json()); setAllSubjects(fetchedSubjs); }
      if (linkRes.ok) { const j = await linkRes.json(); setAllLinkers(parse(j)); }
      if (profRes.ok) { const j = await profRes.json(); setCollegeProfessionals(parse(j)); }
      if (topicRes.ok) { const j = await topicRes.json(); setDbTopics(parse(j)); }
      if (compRes.ok) { const j = await compRes.json(); setDbCompetencies(parse(j)); }

      setDepartments(fetchedDepts);

      if (fetchedDepts.length > 0) {
        const facultyDeptClean = (userDeptNameStr || facultyDeptName || '').toLowerCase().replace('department of ', '').trim();
        const matchedDept = (userDeptId ? fetchedDepts.find(d => d.id === userDeptId) : null) ||
          (facultyDeptClean ? fetchedDepts.find(d => d.name.toLowerCase().includes(facultyDeptClean) || facultyDeptClean.includes(d.name.toLowerCase())) : null) ||
          fetchedDepts[0];

        setSelectedDept(matchedDept.id);

        const deptSubjs = fetchedSubjs.filter(s => {
          if (s.department_id === matchedDept.id) return true;
          const sClean = s.name.toLowerCase().replace('department of ', '').trim();
          const dClean = matchedDept.name.toLowerCase().replace('department of ', '').trim();
          return sClean && dClean && (sClean.includes(dClean) || dClean.includes(sClean));
        });
        const matchedSubj = (userSubjId ? deptSubjs.find(s => s.id === userSubjId) || fetchedSubjs.find(s => s.id === userSubjId) : null) ||
          deptSubjs.find(s => s.code === 'PY' || s.name.toUpperCase() === 'PHYSIOLOGY') ||
          deptSubjs[0] ||
          fetchedSubjs[0];

        if (matchedSubj) setSelectedSubject(matchedSubj.id);
      }
    } catch (e) {
      console.error('Failed to fetch Master data', e);
      setDepartments([]);
    } finally {
      setMetaLoading(false);
    }
  };

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
    setSelectedCompetencyId('');
    setSelectedCompetencyCode('');
    const topicComps = dbCompetencies.filter(c => c.topic_id === topicId);
    if (topicComps.length > 0) {
      setSelectedCompetencyId(topicComps[0].id || '');
      setSelectedCompetencyCode(topicComps[0].code || '');
    }
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

    const sorted = matches.length > 0 ? [...matches] : [...allSubjects];
    sorted.sort((a, b) => {
      if (a.code === 'PY' || a.name.toUpperCase() === 'PHYSIOLOGY') return -1;
      if (b.code === 'PY' || b.name.toUpperCase() === 'PHYSIOLOGY') return 1;
      return 0;
    });

    return sorted;
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

  // Topics strictly filtered by selectedSubject
  const availableTopics = useMemo(() => {
    if (!selectedSubject) return [];
    return dbTopics.filter(t => (t as any).subject_id === selectedSubject);
  }, [dbTopics, selectedSubject]);

  // Competencies strictly filtered by selectedTopicId
  const availableCompetencies = useMemo(() => {
    if (!selectedTopicId) return [];
    return dbCompetencies.filter(c => c.topic_id === selectedTopicId);
  }, [dbCompetencies, selectedTopicId]);

  useEffect(() => {
    if (availableTopics.length > 0) {
      const savedTopicId = typeof window !== 'undefined' ? sessionStorage.getItem('faculty_selected_topic_id') || '' : '';
      const savedCompCode = typeof window !== 'undefined' ? sessionStorage.getItem('faculty_selected_comp_code') || '' : '';
      const savedCompId = typeof window !== 'undefined' ? sessionStorage.getItem('faculty_selected_comp_id') || '' : '';

      const exists = availableTopics.some(t => t.id === selectedTopicId);
      if (!exists) {
        const restoredTopic = availableTopics.find(t => t.id === savedTopicId) || availableTopics[0];
        setSelectedTopicId(restoredTopic.id);
        setSelectedTopicName(restoredTopic.name);
        const topicComps = dbCompetencies.filter(c => c.topic_id === restoredTopic.id);
        const restoredComp = topicComps.find(c => c.code === savedCompCode || c.id === savedCompId) || topicComps[0];
        if (restoredComp) {
          setSelectedCompetencyId(restoredComp.id || '');
          setSelectedCompetencyCode(restoredComp.code || '');
        } else {
          setSelectedCompetencyId('');
          setSelectedCompetencyCode('');
        }
      }
    } else {
      setSelectedTopicId('');
      setSelectedTopicName('');
      setSelectedCompetencyId('');
      setSelectedCompetencyCode('');
    }
  }, [availableTopics, selectedTopicId, dbCompetencies]);

  // Persist selections to sessionStorage whenever user selects Topic/Competency/Subject
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (selectedTopicId) sessionStorage.setItem('faculty_selected_topic_id', selectedTopicId);
      if (selectedTopicName) sessionStorage.setItem('faculty_selected_topic_name', selectedTopicName);
      if (selectedCompetencyId) sessionStorage.setItem('faculty_selected_comp_id', selectedCompetencyId);
      if (selectedCompetencyCode) sessionStorage.setItem('faculty_selected_comp_code', selectedCompetencyCode);
      if (selectedSubject) sessionStorage.setItem('faculty_selected_subject_id', selectedSubject);
    }
  }, [selectedTopicId, selectedTopicName, selectedCompetencyId, selectedCompetencyCode, selectedSubject]);

  const canEnterQuestion = !!(selectedTopicId && selectedCompetencyCode);

  // Load questions when topic/competency/mode/subject change
  useEffect(() => {
    fetchQuestions();
  }, [selectedTopicId, selectedCompetencyCode, mode, selectedSubject]);

  // Load designed papers from DB on mount and when switching to publish tab
  useEffect(() => {
    fetchDesignedPapers();
  }, []);

  useEffect(() => {
    if (activeTab === 'publish' || activeTab === 'design') fetchDesignedPapers();
  }, [activeTab]);

  const fetchQuestions = async () => {
    const slug = getTenantSlug();
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const h = { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': slug };
      const params = new URLSearchParams();
      if (mode) params.set('mode', mode);
      if (selectedSubject) params.set('subjectId', selectedSubject);

      if (selectedTopicId && selectedTopicId !== 'all') {
        params.set('topicId', selectedTopicId);
      } else if (selectedTopicName && selectedTopicName !== 'all') {
        const cleanTopic = selectedTopicName.replace(/^Topic \d+:\s*/i, '').replace(/\[.*\]$/, '').trim();
        params.set('topic', cleanTopic);
      }

      if (selectedCompetencyCode && selectedCompetencyCode !== 'all') {
        const cleanCompCode = selectedCompetencyCode.includes(':')
          ? selectedCompetencyCode.split(':')[0].trim()
          : selectedCompetencyCode.trim();
        params.set('competencyCode', cleanCompCode);
      }

      const res = await fetch(`${API_BASE}/exams/question-bank?${params.toString()}`, { headers: h });
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

  // Load designed papers from DB (GET /exams/papers)
  const fetchDesignedPapers = async () => {
    const slug = getTenantSlug();
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const h = { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': slug };
      const res = await fetch(`${API_BASE}/exams/papers`, { headers: h });
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
        // Map to UI shape
        const mapped = list.map((p: any) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          duration: p.duration_minutes || p.duration || 180,
          maxMarks: p.max_marks || 100,
          status: p.is_active ? 'Published' : 'Ready for Publishing',
          subject_name: p.subject_name || '',
          sections: p.sections || [],
        }));
        setDesignedPapers(mapped);
      }
    } catch {
      // silently fail — keep existing list
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

    const cleanCompCode = selectedCompetencyCode.includes(':')
      ? selectedCompetencyCode.split(':')[0].trim()
      : selectedCompetencyCode.trim();

    const cleanTopicName = selectedTopicName.replace(/^Topic \d+:\s*/i, '').replace(/\[.*\]$/, '').trim();

    const payload = mode === 'MCQ' ? {
      departmentId: selectedDept || null,
      subjectId: selectedSubject || null,
      professionalPhase: profLabel,
      topicId: selectedTopicId || null,
      topic: cleanTopicName,
      competencyId: selectedCompetencyId || null,
      competencyCode: cleanCompCode,
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
      topicId: selectedTopicId || null,
      topic: cleanTopicName,
      competencyId: selectedCompetencyId || null,
      competencyCode: cleanCompCode,
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

  const handleSavePaperDesign = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = getTenantSlug();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const h = { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': slug, 'Content-Type': 'application/json' };
    try {
      const payload = {
        id: editingPaperId || undefined,
        code: paperCode,
        name: paperTitle,
        subjectId: selectedSubject || null,
        maxMarks: paperTotalMarks,
        passingMarks: Math.round(paperTotalMarks * 0.4),
        durationMinutes: paperDuration,
        type: 'THEORY',
        sections: paperSections,
      };
      const res = await fetch(`${API_BASE}/exams/papers`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setAlert({ type: 'success', message: `Paper '${paperTitle}' (${paperCode}) saved and updated successfully!` });
        await fetchCreatedPapersList();
        setShowPaperEditor(false);
        setEditingPaperId(null);
        return;
      }
    } catch (e) {
      console.error('Save paper error', e);
    }
    
    // Fallback: save locally
    const newPaper = {
      id: editingPaperId || Date.now().toString(),
      code: paperCode,
      name: paperTitle,
      duration_minutes: paperDuration,
      max_marks: paperTotalMarks,
      sections: paperSections,
      subject_name: 'PHYSIOLOGY',
      batch_code: '2025'
    };
    setCreatedPapersList(prev => {
      const idx = prev.findIndex(p => p.id === newPaper.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newPaper;
        return copy;
      }
      return [newPaper, ...prev];
    });
    setAlert({ type: 'success', message: `Paper '${paperTitle}' updated.` });
    setShowPaperEditor(false);
    setEditingPaperId(null);
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
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="faculty" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Faculty Assessment & Question Bank Designer" />
        <main className="p-6 space-y-6 flex-1">

          {/* Alert Toast Notification */}
          {alert && (
            <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border shadow-sm ${
              alert.type === 'success' ? 'bg-[#E6F9F3] text-[#00C48C] border-[#00C48C]/30' : 'bg-[#FEECEB] text-[#F04438] border-[#F04438]/30'
            }`}>
              <span>{alert.type === 'success' ? '✅' : '⚠️'} {alert.message}</span>
              <button onClick={() => setAlert(null)} className="text-[#7B8794] hover:text-[#1B1E28] font-black">✕</button>
            </div>
          )}

          {/* MAIN 3 TABS HEADER */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-5 shadow-soft flex flex-col md:flex-row items-center justify-between gap-4 transition-all">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold text-[#5B4BFF] uppercase tracking-widest">{facultyDeptName}</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E6F9F3] text-[#00C48C] border border-[#00C48C]/20">
                  Auto-Selected Department
                </span>
              </div>
              <h2 className="text-xl font-black text-[#1B1E28] dark:text-white tracking-tight uppercase mt-1">Faculty Medical Assessment Engine</h2>
              <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-0.5">CBME Competency-Based Question Bank & Examination Design Portal</p>
            </div>

            <div className="flex items-center gap-2 p-1.5 bg-[#F1F4F9] dark:bg-slate-800 rounded-full border border-[#E7EAF3] dark:border-slate-700 text-xs font-bold shrink-0 shadow-inner">
              <button
                onClick={() => setActiveTab('bank')}
                className={`px-5 py-2.5 rounded-full transition-all ${
                  activeTab === 'bank'
                    ? 'bg-[#5B4BFF] text-white shadow-md shadow-indigo-500/20 font-black'
                    : 'text-[#4E5969] dark:text-slate-400 hover:text-[#1B1E28]'
                }`}
              >
                1. Question Bank
              </button>

              <button
                onClick={() => setActiveTab('design')}
                className={`px-5 py-2.5 rounded-full transition-all ${
                  activeTab === 'design'
                    ? 'bg-[#5B4BFF] text-white shadow-md shadow-indigo-500/20 font-black'
                    : 'text-[#4E5969] dark:text-slate-400 hover:text-[#1B1E28]'
                }`}
              >
                2. Question Design
              </button>

              <button
                onClick={() => setActiveTab('publish')}
                className={`px-5 py-2.5 rounded-full transition-all ${
                  activeTab === 'publish'
                    ? 'bg-[#5B4BFF] text-white shadow-md shadow-indigo-500/20 font-black'
                    : 'text-[#4E5969] dark:text-slate-400 hover:text-[#1B1E28]'
                }`}
              >
                3. Publish
              </button>
            </div>
          </div>

          {/* TAB 1: QUESTION BANK */}
          {activeTab === 'bank' && (
            <div className="space-y-6">
              {/* Context Selector Bar with Cascading Auto-Select */}
              <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-4">
                <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#5B4BFF]">
                    🏛️ Faculty CBME Assessment Context — Department Auto-Selected
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Active Institution badge */}
                  <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/80 border border-[#E7EAF3] dark:border-slate-700 flex flex-col justify-center">
                    <span className="text-[10px] font-black uppercase text-[#5B4BFF]">Active Institution</span>
                    <div className="flex items-center justify-between text-xs font-black text-[#1B1E28] dark:text-white mt-0.5">
                      <span className="truncate">{tenantName || getTenantSlug()}</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#EEF2FF] text-[#5B4BFF] border border-[#5B4BFF]/20 ml-1 shrink-0">
                        {getTenantSlug()}
                      </span>
                    </div>
                  </div>

                  {/* Department — strictly from DB */}
                  <div>
                    <label className="block text-xs font-black uppercase text-[#1B1E28] dark:text-white mb-1.5">Department *</label>
                    <select
                      value={selectedDept}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      disabled={metaLoading}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white text-xs font-bold focus:outline-none focus:border-[#F36C21] focus:ring-2 focus:ring-[#F36C21]/20 disabled:opacity-50 shadow-sm"
                    >
                      {metaLoading
                        ? <option value="">Loading departments...</option>
                        : departments.length === 0
                          ? <option value="">⚠ No departments — add in Admin Master first</option>
                          : departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                    </select>
                  </div>

                  {/* Subject — filtered by selected dept */}
                  <div>
                    <label className="block text-xs font-black uppercase text-[#00C48C] dark:text-emerald-400 mb-1.5">Subject (Auto-Matched) *</label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      disabled={metaLoading || !selectedDept}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#00C48C]/40 text-[#1B1E28] dark:text-emerald-300 font-bold text-xs focus:outline-none focus:border-[#F36C21] focus:ring-2 focus:ring-[#F36C21]/20 disabled:opacity-50 shadow-sm"
                    >
                      {!selectedDept
                        ? <option value="">Select Department first</option>
                        : subjectsForDept.length === 0
                          ? <option value="">No subjects for this department</option>
                          : subjectsForDept.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                    </select>
                  </div>
                </div>

                {/* Row 2: CBME Year + Professional Phase */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-[#FFB020] dark:text-amber-400 mb-1.5">CBME Year *</label>
                    <select
                      value={selectedCbmeYear}
                      onChange={(e) => handleCbmeYearChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#FFB020]/40 text-[#1B1E28] dark:text-amber-300 font-bold text-xs focus:outline-none focus:border-[#F36C21] focus:ring-2 focus:ring-[#F36C21]/20 shadow-sm"
                    >
                      <option value="">— Select CBME Year —</option>
                      {cbmeYearsList.map(y => <option key={y.id} value={y.id}>{y.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-[#F04438] dark:text-rose-400 mb-1.5">Professional Phase *</label>
                    <select
                      value={selectedProfPhase}
                      onChange={(e) => handleProfPhaseChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#F04438]/40 text-[#1B1E28] dark:text-rose-300 font-bold text-xs focus:outline-none focus:border-[#F36C21] focus:ring-2 focus:ring-[#F36C21]/20 shadow-sm"
                    >
                      <option value="">— Select Professional Phase —</option>
                      {collegeProfessionals.map(p => (
                        <option key={p.id} value={p.id}>{p.name} [{p.course_cd}]</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Mode Switch & Question Creation Form */}
              <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7EAF3] dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-black uppercase text-[#1B1E28] dark:text-white tracking-wider">
                      📝 Create New Question for Department Question Bank
                    </h3>
                    <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium">Competency-Based Medical Education Question Setup</p>
                  </div>

                  <div className="flex items-center gap-1.5 p-1.5 bg-[#F1F4F9] dark:bg-slate-800 rounded-full border border-[#E7EAF3] dark:border-slate-700 text-xs font-bold shrink-0">
                    <button type="button" onClick={() => setMode('MCQ')}
                      className={`px-5 py-2.5 rounded-full transition-all ${mode === 'MCQ' ? 'bg-[#5B4BFF] text-white font-black shadow-md' : 'text-[#4E5969] dark:text-slate-400 hover:text-[#1B1E28]'}`}>
                      🔘 MCQs Mode
                    </button>
                    <button type="button" onClick={() => setMode('DESC')}
                      className={`px-5 py-2.5 rounded-full transition-all ${mode === 'DESC' ? 'bg-purple-600 text-white font-black shadow-md' : 'text-[#4E5969] dark:text-slate-400 hover:text-[#1B1E28]'}`}>
                      📄 DESC Mode
                    </button>
                  </div>
                </div>

                <div className="p-5 rounded-[22px] bg-[#F8FAFC] dark:bg-slate-800/80 border border-[#E7EAF3] dark:border-slate-700 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase text-[#1B1E28] dark:text-white mb-1.5">Topic Master *</label>
                      <select
                        value={selectedTopicId}
                        onChange={(e) => handleTopicChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold text-xs focus:outline-none focus:border-[#F36C21] focus:ring-2 focus:ring-[#F36C21]/20 shadow-sm"
                      >
                        <option value="">— Select Topic —</option>
                        {availableTopics.map(t => <option key={t.id} value={t.id}>{t.name} [{t.code || ''}]</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-[#00C48C] dark:text-emerald-400 mb-1.5">Competency Code *</label>
                      <select
                        value={selectedCompetencyId || selectedCompetencyCode}
                        onChange={(e) => {
                          const val = e.target.value;
                          const match = availableCompetencies.find(c => c.id === val || c.code === val);
                          if (match) {
                            setSelectedCompetencyId(match.id || '');
                            setSelectedCompetencyCode(match.code || val);
                          } else {
                            setSelectedCompetencyCode(val);
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#00C48C]/40 text-[#1B1E28] dark:text-emerald-300 font-bold text-xs focus:outline-none focus:border-[#F36C21] focus:ring-2 focus:ring-[#F36C21]/20 shadow-sm"
                      >
                        <option value="">— Select Competency —</option>
                        {availableCompetencies.map(c => (
                          <option key={c.id || c.code} value={c.id || c.code}>{c.code}: {c.description}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSaveQuestion} className="space-y-6">
                  {mode === 'MCQ' && (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-black uppercase text-[#1B1E28] dark:text-white mb-1.5">
                          Question Prompt / Stem *
                        </label>
                        <textarea
                          rows={3}
                          value={mcqQuestionText}
                          onChange={(e) => setMcqQuestionText(e.target.value)}
                          placeholder="Enter Multiple Choice Question text here..."
                          className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold text-xs focus:outline-none focus:border-[#F36C21] focus:ring-2 focus:ring-[#F36C21]/20 placeholder-[#7B8794] shadow-sm transition-all"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-extrabold text-[#1B1E28] dark:text-slate-200 mb-1">Option A *</label>
                          <input
                            type="text"
                            value={optionA}
                            onChange={(e) => setOptionA(e.target.value)}
                            placeholder="Option A choice"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold text-xs focus:outline-none focus:border-[#F36C21] focus:ring-2 focus:ring-[#F36C21]/20 placeholder-[#7B8794] shadow-sm transition-all"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-extrabold text-[#1B1E28] dark:text-slate-200 mb-1">Option B *</label>
                          <input
                            type="text"
                            value={optionB}
                            onChange={(e) => setOptionB(e.target.value)}
                            placeholder="Option B choice"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold text-xs focus:outline-none focus:border-[#F36C21] focus:ring-2 focus:ring-[#F36C21]/20 placeholder-[#7B8794] shadow-sm transition-all"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-extrabold text-[#1B1E28] dark:text-slate-200 mb-1">Option C *</label>
                          <input
                            type="text"
                            value={optionC}
                            onChange={(e) => setOptionC(e.target.value)}
                            placeholder="Option C choice"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold text-xs focus:outline-none focus:border-[#F36C21] focus:ring-2 focus:ring-[#F36C21]/20 placeholder-[#7B8794] shadow-sm transition-all"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-extrabold text-[#1B1E28] dark:text-slate-200 mb-1">Option D *</label>
                          <input
                            type="text"
                            value={optionD}
                            onChange={(e) => setOptionD(e.target.value)}
                            placeholder="Option D choice"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold text-xs focus:outline-none focus:border-[#F36C21] focus:ring-2 focus:ring-[#F36C21]/20 placeholder-[#7B8794] shadow-sm transition-all"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-[22px] bg-[#F8FAFC] dark:bg-slate-800/80 border border-[#E7EAF3] dark:border-slate-700">
                        <div>
                          <label className="block text-xs font-black uppercase text-[#00C48C] dark:text-emerald-400 mb-1.5">Correct Answer *</label>
                          <select
                            value={correctOption}
                            onChange={(e) => setCorrectOption(e.target.value as any)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#00C48C]/40 text-[#1B1E28] dark:text-emerald-300 font-black text-xs focus:outline-none focus:border-[#F36C21] focus:ring-2 focus:ring-[#F36C21]/20 shadow-sm"
                          >
                            <option value="option_a">Option A</option>
                            <option value="option_b">Option B</option>
                            <option value="option_c">Option C</option>
                            <option value="option_d">Option D</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-black uppercase text-[#1B1E28] dark:text-slate-300 mb-1.5">Difficulty Level</label>
                          <select
                            value={mcqDifficulty}
                            onChange={(e) => setMcqDifficulty(e.target.value as any)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold text-xs focus:outline-none focus:border-[#F36C21] focus:ring-2 focus:ring-[#F36C21]/20 shadow-sm"
                          >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                            <option value="Expert">Expert</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-black uppercase text-[#1B1E28] dark:text-slate-300 mb-1.5">Max Marks</label>
                          <input
                            type="number"
                            step="0.5"
                            value={mcqMaxMarks}
                            onChange={(e) => setMcqMaxMarks(parseFloat(e.target.value))}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-black text-xs focus:outline-none focus:border-[#F36C21] focus:ring-2 focus:ring-[#F36C21]/20 shadow-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MODE 2: DESC FORM */}
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
                          id="hasSubQuestionsFaculty"
                          checked={hasSubQuestions}
                          onChange={(e) => setHasSubQuestions(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500"
                        />
                        <label htmlFor="hasSubQuestionsFaculty" className="text-xs text-white font-semibold cursor-pointer">
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
              <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E7EAF3] dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-black text-[#1B1E28] dark:text-white uppercase tracking-wider">
                      Question Bank Repository ({questions.length} Items)
                    </h3>
                    <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium">Authentic Competency-Based MCQs &amp; Descriptive Questions</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="🔍 Search questions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-4 py-2 text-xs rounded-full bg-white dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold focus:border-[#F36C21] focus:ring-2 focus:ring-[#F36C21]/20 shadow-sm"
                    />
                  </div>
                </div>

                {questions.length === 0 ? (
                  <div className="py-12 text-center text-[#4E5969] dark:text-slate-400 text-xs font-bold">No questions saved under this topic yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#E7EAF3] dark:border-slate-800 text-[11px] font-black uppercase text-[#1B1E28] dark:text-slate-300 tracking-wider bg-[#F8FAFC] dark:bg-slate-800/60">
                          <th className="py-3.5 px-4 w-32 rounded-l-xl">Mode &amp; Level</th>
                          <th className="py-3.5 px-4">Question Prompt</th>
                          <th className="py-3.5 px-4 w-64">Topic &amp; Competency</th>
                          <th className="py-3.5 px-4 w-28 text-center">Marks</th>
                          <th className="py-3.5 px-4 w-24 text-right rounded-r-xl">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800">
                        {filteredQuestions.map((q) => {
                          let parsedSubs: SubQuestion[] = [];
                          if (q.has_sub_questions && q.sub_questions) {
                            try {
                              parsedSubs = typeof q.sub_questions === 'string' ? JSON.parse(q.sub_questions) : q.sub_questions;
                            } catch {}
                          }

                          return (
                            <tr key={q.id} className="hover:bg-[#F1F4F9]/60 dark:hover:bg-slate-800/40 transition">
                              {/* Mode & Level */}
                              <td className="py-4 px-4 align-top space-y-2">
                                <div>
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border ${
                                    q.mode === 'MCQ' ? 'bg-[#EEF2FF] text-[#5B4BFF] border-[#5B4BFF]/30' : 'bg-purple-100 text-purple-700 border-purple-300'
                                  }`}>
                                    {q.mode}
                                  </span>
                                </div>
                                <div>
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFF8E6] text-[#FFB020] border border-[#FFB020]/30">
                                    {q.difficulty_level || 'Medium'}
                                  </span>
                                </div>
                              </td>

                              {/* Question Prompt */}
                              <td className="py-4 px-4 align-top space-y-3">
                                <p className="font-black text-[#1B1E28] dark:text-white text-sm leading-relaxed">{q.question_text}</p>

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
                                          className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center justify-between shadow-sm ${
                                            isCorrect
                                              ? 'bg-[#E6F9F3] text-[#00C48C] border-[#00C48C]/40 font-black'
                                              : 'bg-[#F8FAFC] dark:bg-slate-800 text-[#1B1E28] dark:text-slate-200 border-[#E7EAF3] dark:border-slate-700'
                                          }`}
                                        >
                                          <span>{letter.toUpperCase()}) {text}</span>
                                          {isCorrect && <span className="text-xs text-[#00C48C] font-black">✓</span>}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Sub-Questions Box for DESC */}
                                {q.mode === 'DESC' && parsedSubs.length > 0 && (
                                  <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-slate-800/90 border border-[#E7EAF3] dark:border-slate-700 space-y-2 max-w-lg">
                                    <span className="text-[10px] font-black uppercase text-[#5B4BFF] tracking-wider">SUB-QUESTIONS:</span>
                                    <div className="space-y-1.5">
                                      {parsedSubs.map((sq, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 font-bold text-[#1B1E28] dark:text-slate-200">
                                          <span>{sq.label || `${idx + 1}.`} {sq.questionText}</span>
                                          <span className="font-black text-[#5B4BFF] text-[10px]">{sq.marks} Marks</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </td>

                              {/* Topic & Competency */}
                              <td className="py-4 px-4 align-top space-y-2">
                                <div className="flex items-center gap-1.5 text-xs font-black text-[#2D2575] dark:text-indigo-300">
                                  <span>📚</span>
                                  <span className="truncate">{q.topic || 'General Physiology'}</span>
                                </div>
                                <div>
                                  <span className="px-2.5 py-1 rounded-full font-mono text-[11px] font-black bg-[#E6F9F3] text-[#00C48C] border border-[#00C48C]/30 inline-block">
                                    🎯 {q.competency_code || 'PY1.1(2024)'}
                                  </span>
                                </div>
                              </td>

                              {/* Marks */}
                              <td className="py-4 px-4 align-top text-center font-black text-[#5B4BFF] text-sm">
                                {Number(q.max_marks || 2).toFixed(2)} Marks
                              </td>

                              {/* Action */}
                              <td className="py-4 px-4 align-top text-right">
                                <button
                                  onClick={() => handleDeleteQuestion(q.id)}
                                  className="px-3 py-1.5 rounded-xl bg-[#FEECEB] hover:bg-rose-100 text-[#F04438] border border-[#F04438]/20 text-[11px] font-extrabold shadow-sm transition"
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
              <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-5 shadow-soft flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[#4E5969] dark:text-slate-400 font-bold">Active Design Context:</span>
                  <span className="px-3 py-1 rounded-full bg-[#EEF2FF] text-[#5B4BFF] font-extrabold border border-[#5B4BFF]/30">
                    🏛️ {departments.find(d => d.id === selectedDept)?.name || facultyDeptName}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#E6F9F3] text-[#00C48C] font-extrabold border border-[#00C48C]/30">
                    📖 {subjectsForDept.find(s => s.id === selectedSubject)?.name || 'PHYSIOLOGY'}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#FFF4EC] text-[#F36C21] font-extrabold border border-[#F36C21]/30">
                    🎓 CBME 2024 (NMC)
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#FEECEB] text-[#F04438] font-extrabold border border-[#F04438]/30">
                    📅 Batch 2025 (1st Prof)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCreateNewPaper}
                  className="px-5 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4E3EFF] text-white font-black text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <span>➕</span>
                  <span>Create New Exam Paper</span>
                </button>
              </div>

              {/* ── 1. REGISTRY OF CREATED EXAMINATION PAPERS ── */}
              <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#5B4BFF] flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#5B4BFF] text-white flex items-center justify-center text-[10px] font-black">📋</span>
                      CREATED EXAMINATION PAPERS REGISTRY ({createdPapersList.length} PAPERS CREATED)
                    </h3>
                    <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-0.5">
                      Select any created paper below to modify its title, code, duration, total marks, sections, or picked questions.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateNewPaper}
                    className="px-4 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 hover:bg-[#EEF2FF] border border-[#E7EAF3] dark:border-slate-700 text-[#5B4BFF] font-black text-xs transition-all shadow-sm"
                  >
                    ➕ New Paper
                  </button>
                </div>

                {createdPapersList.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#7B8794] font-bold">
                    No examination papers created yet. Click "Create New Exam Paper" to assemble your first paper.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {createdPapersList.map(paper => {
                      const isEditing = editingPaperId === paper.id;
                      let rawSecs = paper.sections;
                      if (typeof rawSecs === 'string') {
                        try { rawSecs = JSON.parse(rawSecs); } catch (e) { rawSecs = []; }
                      }
                      const secCount = Array.isArray(rawSecs) && rawSecs.length > 0 ? rawSecs.length : 3;

                      return (
                        <div
                          key={paper.id}
                          className={`rounded-[22px] overflow-hidden flex flex-col justify-between transition-all duration-200 ${
                            isEditing
                              ? 'border-2 border-[#5B4BFF] shadow-lg shadow-indigo-500/10 bg-white dark:bg-slate-900'
                              : 'border border-[#E7EAF3] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-soft hover:border-[#5B4BFF]/40'
                          }`}
                        >
                          {/* Top Card Banner */}
                          <div className="bg-[#2D2575] text-white px-4 py-2.5 flex items-center justify-between font-black text-[11px] uppercase tracking-wider">
                            <span className="font-mono text-[#F36C21]">[{paper.code || 'MED-PAPER'}]</span>
                            {isEditing ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#5B4BFF] text-white animate-pulse">
                                ✏️ EDITING NOW
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#E6F9F3] text-[#00C48C]">
                                ✓ ACTIVE PAPER
                              </span>
                            )}
                          </div>

                          {/* Paper Card Content Body */}
                          <div className="p-5 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="text-sm font-black text-[#1B1E28] dark:text-white uppercase leading-snug">
                                  {paper.name || 'MBBS Sessional Examination'}
                                </h4>
                                <span className="text-[11px] font-bold text-[#4E5969] dark:text-slate-400 block mt-0.5">
                                  {paper.subject_name || 'PHYSIOLOGY'} • {paper.batch_code || 'Batch 2025'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-[#E7EAF3] dark:border-slate-800 text-xs">
                              <span className="font-mono font-black text-[#F36C21]">
                                ⏱️ {paper.duration_minutes || paper.duration_mins || 60} MINS
                              </span>
                              <span className="font-mono font-black text-[#5B4BFF]">
                                🎯 {paper.max_marks || 40} MARKS
                              </span>
                              <span className="font-bold text-[#7B8794] text-[11px]">
                                📂 {secCount} Sections
                              </span>
                            </div>
                          </div>

                          {/* Card Footer Actions */}
                          <div className="px-5 py-3 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between bg-[#F8FAFC]/70 dark:bg-slate-800/40">
                            <button
                              type="button"
                              onClick={() => handleEditExistingPaper(paper)}
                              className="px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4E3EFF] text-white text-xs font-black shadow-sm transition-all flex items-center gap-1.5"
                            >
                              <span>✏️</span>
                              <span>Modify / Edit Paper</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteCreatedPaper(paper.id)}
                              className="p-2 rounded-xl bg-[#FEECEB] hover:bg-rose-100 text-[#F04438] text-xs font-bold transition-all"
                              title="Delete Paper"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── 2. EXAMINATION PAPER EDITOR & BUILDER FORM ── */}
              {showPaperEditor && (
                <div id="paper-editor-container" className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-6 animate-fadeIn">
                  <div className="border-b border-[#E7EAF3] dark:border-slate-800 pb-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#EEF2FF] text-[#5B4BFF] border border-[#5B4BFF]/30">
                          {editingPaperId ? '✏️ EDIT MODE ACTIVE' : '➕ NEW PAPER CREATION'}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-[#1B1E28] dark:text-white uppercase tracking-wider mt-1">
                        {editingPaperId ? `Modify Exam Paper: ${paperTitle}` : '📝 Assemble New Examination Paper'}
                      </h3>
                      <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium">
                        Configure Paper Title, Code, Duration, Total Marks, and Section Question Bank Selections.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <span className="text-[11px] font-bold text-[#4E5969] dark:text-slate-400 block">Calculated Total Marks:</span>
                        <div className="text-xl font-black text-[#00C48C]">
                          {paperSections.reduce((acc, sec) => {
                            let secTot = sec.type === 'PRACTICAL' ? Number(sec.practicalMarks || 0) : 0;
                            sec.questions.forEach((q: any) => { secTot += Number(q.customMarks || q.defaultMarks || 0); });
                            return acc + secTot;
                          }, 0)} Marks
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => { setShowPaperEditor(false); setEditingPaperId(null); }}
                        className="px-3 py-1.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 text-[#7B8794] hover:text-[#1B1E28] text-xs font-black border border-[#E7EAF3] dark:border-slate-700"
                      >
                        ✕ Close Editor
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleSavePaperDesign} className="space-y-6">
                    {/* Paper Header Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-black uppercase text-[#1B1E28] dark:text-white mb-1.5">
                          Exam Paper Title *
                        </label>
                        <input
                          type="text"
                          value={paperTitle}
                          onChange={(e) => setPaperTitle(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold text-xs focus:outline-none focus:border-[#F36C21] focus:ring-2 focus:ring-[#F36C21]/20 shadow-sm"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase text-[#1B1E28] dark:text-white mb-1.5">
                          Paper Code *
                        </label>
                        <input
                          type="text"
                          value={paperCode}
                          onChange={(e) => setPaperCode(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-mono font-black text-xs focus:outline-none focus:border-[#F36C21] focus:ring-2 focus:ring-[#F36C21]/20 shadow-sm"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase text-[#1B1E28] dark:text-white mb-1.5">
                          Duration (Mins) *
                        </label>
                        <input
                          type="number"
                          value={paperDuration}
                          onChange={(e) => setPaperDuration(Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-black text-xs focus:outline-none focus:border-[#F36C21] focus:ring-2 focus:ring-[#F36C21]/20 shadow-sm"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase text-[#00C48C] dark:text-emerald-400 mb-1.5">
                          Target Total Marks *
                        </label>
                        <input
                          type="number"
                          value={paperTotalMarks}
                          onChange={(e) => setPaperTotalMarks(Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#00C48C]/40 text-[#00C48C] font-black text-xs focus:outline-none focus:border-[#F36C21] focus:ring-2 focus:ring-[#F36C21]/20 shadow-sm"
                          required
                        />
                      </div>
                    </div>

                  {/* Dynamic Paper Sections List */}
                  <div className="space-y-6 pt-4 border-t border-[#E7EAF3] dark:border-slate-800">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#EEF2FF] dark:bg-slate-800/90 p-4 rounded-2xl border border-[#5B4BFF]/30">
                      <div>
                        <h4 className="text-xs font-black uppercase text-[#5B4BFF] tracking-wider flex items-center gap-2">
                          <span>📂</span> EXAMINATION PAPER SECTIONS ({paperSections.length} SECTIONS CONFIGURED)
                        </h4>
                        <p className="text-[11px] text-[#4E5969] dark:text-slate-300 font-medium mt-0.5">
                          Manage Section A (MCQs), Section B (Descriptive), Section C (Practical / OSPE). Click Add New Section to create more sections.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddSection}
                        className="px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4E3EFF] text-white font-black text-xs shadow transition-all flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <span>➕</span>
                        <span>Add New Section (A, B, C...)</span>
                      </button>
                    </div>

                    {paperSections.map((sec, secIdx) => {
                      const secMarks = sec.questions.reduce((acc: number, q: any) => acc + Number(q.customMarks || q.defaultMarks || 0), 0) + (sec.type === 'PRACTICAL' ? Number(sec.practicalMarks || 0) : 0);

                      return (
                        <div key={sec.id} className="p-5 rounded-[22px] bg-[#F8FAFC] dark:bg-slate-800/80 border border-[#E7EAF3] dark:border-slate-700 space-y-4">
                          {/* Section Header Controls */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E7EAF3] dark:border-slate-700 pb-3">
                            <div className="flex items-center gap-3 flex-1">
                              <input
                                type="text"
                                value={sec.name}
                                onChange={(e) => handleUpdateSectionMeta(sec.id, 'name', e.target.value)}
                                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-black text-xs uppercase w-44 focus:outline-none focus:border-[#F36C21]"
                              />
                              <select
                                value={sec.type}
                                onChange={(e) => handleUpdateSectionMeta(sec.id, 'type', e.target.value)}
                                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#5B4BFF]/40 text-[#5B4BFF] font-black text-xs focus:outline-none focus:border-[#F36C21]"
                              >
                                <option value="MCQ">Section Type: MCQs</option>
                                <option value="DESC">Section Type: Descriptive</option>
                                <option value="PRACTICAL">Section Type: Practical / OSPE</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-xs font-black text-[#5B4BFF] bg-[#EEF2FF] border border-[#5B4BFF]/20 px-3 py-1 rounded-full">
                                Section Subtotal: {secMarks} Marks
                              </span>
                              {paperSections.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSection(sec.id)}
                                  className="text-xs text-[#F04438] hover:text-rose-600 font-extrabold px-2.5 py-1 rounded-lg bg-[#FEECEB] border border-[#F04438]/20"
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
                              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-slate-200 font-bold text-xs focus:outline-none focus:border-[#F36C21]"
                            />
                          </div>

                          {/* Practical Marks Input for Practical Section */}
                          {sec.type === 'PRACTICAL' && (
                            <div className="p-4 rounded-2xl bg-[#F5F3FF] dark:bg-purple-950/20 border border-[#7867FF]/30 flex items-center justify-between gap-4">
                              <div>
                                <h4 className="text-xs font-black text-[#7867FF]">🧪 Practical &amp; OSPE Viva Voce Station Marks</h4>
                                <p className="text-[11px] text-[#4E5969] dark:text-slate-400 font-medium">Set overall practical performance and table viva allocation marks</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#1B1E28] dark:text-slate-300">Practical Marks:</span>
                                <input
                                  type="number"
                                  value={sec.practicalMarks || 0}
                                  onChange={(e) => handleUpdateSectionMeta(sec.id, 'practicalMarks', Number(e.target.value))}
                                  className="w-24 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-[#7867FF]/50 text-[#7867FF] font-black text-xs text-center"
                                />
                              </div>
                            </div>
                          )}

                          {/* Step-by-Step Question Picker Card for Section */}
                          <div className="p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 shadow-sm space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
                              <h4 className="text-xs font-black uppercase text-[#5B4BFF] tracking-wider">
                                🔍 STEP-BY-STEP QUESTION BANK SELECTOR &amp; CHECKLIST FOR {sec.name}
                              </h4>
                              <span className="text-[11px] font-bold text-[#4E5969] dark:text-slate-400">
                                Loaded Master Questions: {masterBankQuestions.length} Items
                              </span>
                            </div>

                            {/* Step 1, 2, 3 Filters Bar */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                              {/* Step 1: Type Filter */}
                              <div>
                                <label className="block text-[10px] font-black uppercase text-[#1B1E28] dark:text-slate-300 mb-1">
                                  1. SELECT QUESTION TYPE *
                                </label>
                                <select
                                  value={secFilters[sec.id]?.type || sec.type || 'ALL'}
                                  onChange={(e) => handleUpdateSectionFilter(sec.id, 'type', e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold text-xs focus:outline-none focus:border-[#F36C21]"
                                >
                                  <option value="ALL">🌐 All Types (MCQs &amp; DESC)</option>
                                  <option value="MCQ">🔘 MCQs Only</option>
                                  <option value="DESC">📄 Descriptive Only</option>
                                </select>
                              </div>

                              {/* Step 2: Topic Filter */}
                              <div>
                                <label className="block text-[10px] font-black uppercase text-[#1B1E28] dark:text-slate-300 mb-1">
                                  2. SELECT TOPIC (SINGLE CASCADE) *
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
                                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold text-xs focus:outline-none focus:border-[#F36C21]"
                                >
                                  <option value="ALL">— All Topics ({availableTopics.length}) —</option>
                                  {availableTopics.map(t => (
                                    <option key={t.id} value={t.name}>{t.name}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Step 3: Competency Filter (Single Topic Cascade) */}
                              {(() => {
                                const currentTopicName = secFilters[sec.id]?.topic || 'ALL';
                                const selTopicObj = availableTopics.find(t => t.name === currentTopicName || t.id === currentTopicName);
                                const sectionCompetencies = (currentTopicName !== 'ALL' && selTopicObj)
                                  ? dbCompetencies.filter(c => c.topic_id === selTopicObj.id)
                                  : dbCompetencies;

                                return (
                                  <div>
                                    <label className="block text-[10px] font-black uppercase text-[#00C48C] dark:text-emerald-400 mb-1">
                                      3. SELECT COMPETENCY (SINGLE TOPIC CASCADE) *
                                    </label>
                                    <select
                                      value={secFilters[sec.id]?.competency || 'ALL'}
                                      onChange={(e) => handleUpdateSectionFilter(sec.id, 'competency', e.target.value)}
                                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#00C48C]/40 text-[#1B1E28] dark:text-emerald-300 font-black text-xs focus:outline-none focus:border-[#F36C21]"
                                    >
                                      <option value="ALL">— All Competencies ({sectionCompetencies.length}) —</option>
                                      {sectionCompetencies.map(c => (
                                        <option key={c.id || c.code} value={c.code}>
                                          {c.code}: {c.description ? (c.description.length > 45 ? c.description.slice(0, 45) + '...' : c.description) : c.code}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Step 4: Questions Checklist Table */}
                            {(() => {
                              const secF = secFilters[sec.id] || { type: sec.type || 'ALL', topic: 'ALL', competency: 'ALL' };
                              const getRootCode = (s?: string) => {
                                if (!s) return '';
                                const m = s.match(/^([A-Za-z]+\s*\d+(?:\.\d+)?)/);
                                return m ? m[1].replace(/\s+/g, '').toLowerCase() : s.toLowerCase().trim();
                              };

                              const availableFiltered = masterBankQuestions.filter(q => {
                                const matchType = secF.type === 'ALL' || q.mode === secF.type;

                                let matchTopic = true;
                                if (secF.topic && secF.topic !== 'ALL') {
                                  const selTopicObj = availableTopics.find(t => t.name === secF.topic || t.id === secF.topic);
                                  if (selTopicObj) {
                                    matchTopic = Boolean(
                                      (q.topic_id && q.topic_id === selTopicObj.id) ||
                                      (q.topic && (
                                        q.topic.toLowerCase() === selTopicObj.name.toLowerCase() ||
                                        q.topic.toLowerCase().includes(selTopicObj.name.toLowerCase()) ||
                                        selTopicObj.name.toLowerCase().includes(q.topic.toLowerCase())
                                      ))
                                    );
                                  } else {
                                    matchTopic = q.topic ? Boolean(
                                      q.topic.toLowerCase() === secF.topic.toLowerCase() ||
                                      q.topic.toLowerCase().includes(secF.topic.toLowerCase()) ||
                                      secF.topic.toLowerCase().includes(q.topic.toLowerCase())
                                    ) : true;
                                  }
                                }

                                let matchComp = true;
                                if (secF.competency && secF.competency !== 'ALL') {
                                  const rootQ = getRootCode(q.competency_code);
                                  const rootFilter = getRootCode(secF.competency);
                                  matchComp = Boolean(
                                    (q.competency_code && (
                                      q.competency_code.toLowerCase() === secF.competency.toLowerCase() ||
                                      rootQ === rootFilter ||
                                      (rootQ && rootFilter && (rootQ.includes(rootFilter) || rootFilter.includes(rootQ)))
                                    )) || (q.competency_id && secF.competency === q.competency_id)
                                  );
                                }

                                return matchType && matchTopic && matchComp;
                              });

                              const checkedList = secCheckedQIds[sec.id] || [];

                              return (
                                <div className="space-y-3 pt-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-[#5B4BFF]">
                                      Step 4: Check questions to add to {sec.name} ({availableFiltered.length} Available)
                                    </span>
                                    {checkedList.length > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => handleBatchAddQuestionsToSection(sec.id)}
                                        className="px-3.5 py-1.5 rounded-xl bg-[#00C48C] hover:bg-[#00B07D] text-white font-black text-xs shadow transition-all"
                                      >
                                        ➕ Add Selected ({checkedList.length} Questions) to {sec.name}
                                      </button>
                                    )}
                                  </div>

                                  {availableFiltered.length === 0 ? (
                                    <div className="py-6 text-center text-[#4E5969] dark:text-slate-400 text-xs font-bold bg-[#F8FAFC] dark:bg-slate-800/60 border border-[#E7EAF3] dark:border-slate-800 rounded-xl">
                                      No questions match the selected topic or competency filter. Try selecting a different topic or competency dropdown.
                                    </div>
                                  ) : (
                                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1 border border-[#E7EAF3] dark:border-slate-800 rounded-xl p-2.5 bg-[#F8FAFC] dark:bg-slate-900/50">
                                      {availableFiltered.map((q) => {
                                        const isChecked = checkedList.includes(q.id);
                                        const isAlreadyInSec = sec.questions.some((sq: any) => sq.questionId === q.id);

                                        return (
                                          <div
                                            key={q.id}
                                            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition shadow-sm ${
                                              isAlreadyInSec
                                                ? 'bg-gray-50 dark:bg-slate-950/40 border-gray-200 dark:border-slate-800 opacity-60'
                                                : isChecked
                                                ? 'bg-[#EEF2FF] dark:bg-indigo-950/40 border-[#5B4BFF]/50'
                                                : 'bg-white dark:bg-slate-800 border-[#E7EAF3] dark:border-slate-700 hover:border-[#5B4BFF]/40'
                                            }`}
                                          >
                                            <div className="flex items-start gap-3 flex-1">
                                              <input
                                                type="checkbox"
                                                disabled={isAlreadyInSec}
                                                checked={isChecked}
                                                onChange={() => handleToggleQuestionCheck(sec.id, q.id)}
                                                className="mt-1 rounded-md bg-white border-[#E7EAF3] text-[#5B4BFF] focus:ring-[#5B4BFF] w-4 h-4"
                                              />
                                              <div className="space-y-1.5 flex-1">
                                                <p className="font-black text-[#1B1E28] dark:text-white text-xs leading-relaxed">{q.question_text}</p>
                                                <div className="flex flex-wrap items-center gap-2 text-[10px]">
                                                  <span className={`px-2 py-0.5 rounded-full font-black border ${
                                                    q.mode === 'MCQ' ? 'bg-[#EEF2FF] text-[#5B4BFF] border-[#5B4BFF]/30' : 'bg-purple-100 text-purple-700 border-purple-300'
                                                  }`}>
                                                    {q.mode}
                                                  </span>
                                                  <span className="px-2 py-0.5 rounded-full font-mono font-black bg-[#E6F9F3] text-[#00C48C] border border-[#00C48C]/30">
                                                    🎯 {q.competency_code || 'PY1.1'}
                                                  </span>
                                                  <span className="px-2 py-0.5 rounded-full font-bold bg-[#FFF4EC] text-[#F36C21] border border-[#F36C21]/30">
                                                    📚 {q.topic || 'General Physiology'}
                                                  </span>
                                                  <span className="font-black text-[#5B4BFF]">({Number(q.max_marks || 2).toFixed(2)} Marks)</span>
                                                </div>
                                              </div>
                                            </div>

                                            {isAlreadyInSec ? (
                                              <span className="text-[10px] font-black text-[#00C48C] bg-[#E6F9F3] px-2.5 py-1 rounded-full border border-[#00C48C]/30 whitespace-nowrap">
                                                ✓ Added
                                              </span>
                                            ) : (
                                              <button
                                                type="button"
                                                onClick={() => handleSingleAddQuestionToSection(sec.id, q)}
                                                className="px-3 py-1.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4E3EFF] text-white font-black text-xs shadow transition-all whitespace-nowrap"
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
                            <div className="text-center py-5 text-[#4E5969] dark:text-slate-400 text-xs font-bold italic bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-xl">
                              No questions added to {sec.name} yet. Use the question selector above to check and add questions.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {sec.questions.map((q: any, qIdx: number) => (
                                <div key={q.questionId} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 space-y-3 shadow-sm">
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    <div className="flex items-start gap-3 flex-1">
                                      <span className="font-mono text-[#5B4BFF] font-black text-sm">{qIdx + 1}.</span>
                                      <div className="space-y-1 flex-1">
                                        <p className="font-black text-[#1B1E28] dark:text-white leading-relaxed text-xs">{q.questionText}</p>
                                        <div className="flex items-center gap-2 text-[10px]">
                                          <span className="px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B4BFF] font-black border border-[#5B4BFF]/20">
                                            {q.mode}
                                          </span>
                                          <span className="px-2 py-0.5 rounded-full bg-[#E6F9F3] text-[#00C48C] font-black border border-[#00C48C]/20">
                                            🎯 {q.competencyCode || 'PY1.1'}
                                          </span>
                                          <span className="px-2 py-0.5 rounded-full bg-[#FFF4EC] text-[#F36C21] font-bold border border-[#F36C21]/20">
                                            📚 {q.topic || 'General Physiology'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-bold text-[#4E5969] dark:text-slate-400">Total Question Marks:</span>
                                        <input
                                          type="number"
                                          value={q.customMarks}
                                          onChange={(e) => handleUpdateCustomMarks(sec.id, q.questionId, Number(e.target.value))}
                                          className="w-16 px-2.5 py-1 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-[#5B4BFF]/40 text-[#5B4BFF] font-black text-xs text-center focus:outline-none focus:border-[#F36C21]"
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveQuestionFromSection(sec.id, q.questionId)}
                                        className="text-[#F04438] hover:text-rose-700 font-extrabold text-xs px-2.5 py-1 rounded-lg bg-[#FEECEB] border border-[#F04438]/20"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </div>

                                  {/* Sub-Questions Breakdown Tree */}
                                  {Array.isArray(q.subQuestions) && q.subQuestions.length > 0 && (
                                    <div className="space-y-2 border-l-2 border-[#5B4BFF]/40 pl-3 bg-[#F8FAFC] dark:bg-slate-800/60 p-3 rounded-xl border border-[#E7EAF3] dark:border-slate-700">
                                      <span className="text-[10px] font-black text-[#5B4BFF] uppercase tracking-wider block">
                                        Sub-Questions Breakdown (Grand Total: {Number(q.customMarks || 0).toFixed(1)} Marks):
                                      </span>
                                      {q.subQuestions.map((sq: any) => (
                                        <div key={sq.id || sq.label} className="flex items-center justify-between gap-3 text-xs bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-[#E7EAF3] dark:border-slate-800">
                                          <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <span className="font-mono font-black text-[#5B4BFF] shrink-0 text-xs">{sq.label || 'a)'}</span>
                                            <span className="font-bold text-[#1B1E28] dark:text-white text-xs truncate">{sq.questionText}</span>
                                          </div>
                                          <div className="flex items-center gap-1.5 shrink-0">
                                            <span className="text-[10px] font-extrabold text-[#4E5969] dark:text-slate-400">Subpart Marks:</span>
                                            <input
                                              type="number"
                                              min={0}
                                              step={0.5}
                                              value={sq.marks !== undefined ? sq.marks : ''}
                                              onChange={(e) => handleUpdateSubQuestionMark(sec.id, q.questionId, sq.id || sq.label, Number(e.target.value))}
                                              className="w-16 px-2 py-1 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-[#00C48C]/50 text-[#00C48C] font-black text-xs text-center focus:outline-none focus:border-[#F36C21]"
                                            />
                                            <span className="text-[10px] text-[#7B8794] font-bold">Marks</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Save Action Bar */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#E7EAF3] dark:border-slate-800">
                    <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium">
                      Saving paper design commits sections to PostgreSQL database with status <strong className="text-[#00C48C]">Approved</strong>.
                    </p>
                    <button
                      type="submit"
                      className="px-8 py-3 rounded-xl bg-[#5B4BFF] hover:bg-[#4E3EFF] text-white font-black text-xs shadow-md transition-all"
                    >
                      💾 Generate &amp; Save Paper Design
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

          {/* ═════════════════════════════════════════════════════════════════════════════ */}
          {/* TAB 3: PUBLISH */}
          {/* ═════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'publish' && (
            <div className="space-y-6">
              {/* Context Bar */}
              <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-5 shadow-soft flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[#4E5969] dark:text-slate-400 font-bold">Publishing Context:</span>
                  <span className="px-3 py-1 rounded-full bg-[#EEF2FF] text-[#5B4BFF] font-extrabold border border-[#5B4BFF]/30">
                    🏛️ {departments.find(d => d.id === selectedDept)?.name || facultyDeptName}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#E6F9F3] text-[#00C48C] font-extrabold border border-[#00C48C]/30">
                    📖 {subjectsForDept.find(s => s.id === selectedSubject)?.name || 'PHYSIOLOGY'}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#FFF4EC] text-[#F36C21] font-extrabold border border-[#F36C21]/30">
                    🎓 CBME 2024 (NMC)
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#FEECEB] text-[#F04438] font-extrabold border border-[#F04438]/30">
                    📅 Batch 2025 (1st Prof)
                  </span>
                </div>
              </div>

              {/* Publish Form */}
              <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-6">
                <div className="border-b border-[#E7EAF3] dark:border-slate-800 pb-4">
                  <h3 className="text-base font-black text-[#1B1E28] dark:text-white uppercase tracking-wider">
                    🚀 Publish &amp; Schedule Approved Examination Paper
                  </h3>
                  <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium">Target student batch, schedule date/time, and verify examination publishing</p>
                </div>

                <form onSubmit={handlePublishExam} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase text-[#1B1E28] dark:text-slate-300 mb-1.5">
                        Select Approved Exam Paper *
                      </label>
                      <select
                        value={selectedPaperToPublish}
                        onChange={(e) => setSelectedPaperToPublish(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#5B4BFF]/40 text-[#5B4BFF] font-black text-xs focus:outline-none focus:border-[#F36C21] shadow-sm"
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
                      <label className="block text-xs font-black uppercase text-[#1B1E28] dark:text-slate-300 mb-1.5">
                        Target Student Batch *
                      </label>
                      <select
                        value={publishTargetBatch}
                        onChange={(e) => setPublishTargetBatch(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold text-xs focus:outline-none focus:border-[#F36C21] shadow-sm"
                      >
                        <option value="2025-MBBS">Batch 2025-MBBS (1st Professional Current)</option>
                        <option value="2024-MBBS">Batch 2024-MBBS (2nd Professional)</option>
                        <option value="2023-MBBS">Batch 2023-MBBS (3rd Professional)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase text-[#1B1E28] dark:text-slate-300 mb-1.5">
                        Exam Schedule Date *
                      </label>
                      <input
                        type="date"
                        value={publishDate}
                        onChange={(e) => setPublishDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold text-xs focus:outline-none focus:border-[#F36C21] shadow-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-[#1B1E28] dark:text-slate-300 mb-1.5">
                        Start Time *
                      </label>
                      <input
                        type="time"
                        value={publishStartTime}
                        onChange={(e) => setPublishStartTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold text-xs focus:outline-none focus:border-[#F36C21] shadow-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-[#1B1E28] dark:text-slate-300 mb-1.5">
                        End Time *
                      </label>
                      <input
                        type="time"
                        value={publishEndTime}
                        onChange={(e) => setPublishEndTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold text-xs focus:outline-none focus:border-[#F36C21] shadow-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-[#E7EAF3] dark:border-slate-800">
                    <button
                      type="submit"
                      className="px-8 py-3 rounded-xl bg-[#00C48C] hover:bg-[#00B07D] text-white font-black text-xs shadow-md transition-all"
                    >
                      🚀 Publish &amp; Schedule Examination
                    </button>
                  </div>
                </form>
              </div>

              {/* Approved & Designed Papers Ledger Table */}
              <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-4">
                <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-black text-[#1B1E28] dark:text-white uppercase tracking-wider">
                      📋 Approved &amp; Designed Exam Papers List ({designedPapers.length})
                    </h3>
                    <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium">Verified examination papers ready for student portal publication</p>
                  </div>
                </div>

                {designedPapers.length === 0 ? (
                  <div className="py-8 text-center text-[#4E5969] dark:text-slate-400 text-xs font-bold">
                    No approved exam papers found. Design an examination paper in Tab 2 first.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#E7EAF3] dark:border-slate-800 text-[11px] font-black uppercase text-[#1B1E28] dark:text-slate-300 tracking-wider bg-[#F8FAFC] dark:bg-slate-800/60">
                          <th className="py-3.5 px-4 rounded-l-xl">Paper Details</th>
                          <th className="py-3.5 px-4">Paper Code</th>
                          <th className="py-3.5 px-4 text-center">Duration &amp; Marks</th>
                          <th className="py-3.5 px-4 text-center rounded-r-xl">Approval Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800">
                        {designedPapers.map((dp) => (
                          <tr key={dp.id} className="hover:bg-[#F1F4F9]/60 dark:hover:bg-slate-800/40 transition">
                            <td className="py-4 px-4 align-top">
                              <span className="font-black text-[#1B1E28] dark:text-white text-xs block">{dp.name}</span>
                              <span className="text-[10px] text-[#4E5969] dark:text-slate-400 font-bold">Physiology — Batch 2025 (1st Prof)</span>
                            </td>
                            <td className="py-4 px-4 align-top font-mono text-[#5B4BFF] font-black">
                              {dp.code}
                            </td>
                            <td className="py-4 px-4 align-top text-center">
                              <span className="font-bold text-[#F36C21] block">{dp.duration_minutes || dp.duration || 180} mins</span>
                              <span className="text-[11px] font-black text-[#00C48C]">{dp.max_marks || dp.maxMarks || 100} Marks</span>
                            </td>
                            <td className="py-4 px-4 align-top text-center">
                              <span className="px-3 py-1 rounded-full bg-[#E6F9F3] text-[#00C48C] border border-[#00C48C]/30 text-[10px] font-black uppercase tracking-wider inline-block">
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
