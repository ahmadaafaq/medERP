'use client';

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

interface College {
  id: string;
  code: string;
  name: string;
  slug: string;
}

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
  department_name?: string;
  subject_id?: string;
  subject_code?: string;
  subject_name?: string;
  professional_phase?: string;
  unit_id?: string;
  unit_code?: string;
  unit_name?: string;
  topic_id?: string;
  topic?: string;
  sub_topic_id?: string;
  sub_topic_code?: string;
  competency_code?: string;
  mode: 'MCQ' | 'DESC';
  question_text: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_option?: string;
  difficulty_level?: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  has_sub_questions?: boolean;
  sub_questions?: SubQuestion[];
  max_marks?: number;
  created_at?: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
  course_cd?: string;
  course_name?: string;
  college_id?: string;
  college_code?: string;
  college_slug?: string;
  colg_cd?: string;
}


interface Subject {
  id: string;
  name: string;
  code: string;
  department_id?: string;
  department_name?: string;
  department_code?: string;
  branch_cd?: string;
  course_cd?: string;
  college_id?: string;
  college_code?: string;
  college_slug?: string;
  colg_cd?: string;
}

interface UnitItem {
  id: string;
  code: string;
  name: string;
  subject_id?: string;
  subject_code?: string;
  subject_name?: string;
  course_cd?: string;
  branch_cd?: string;
  college_id?: string;
  college_code?: string;
  college_slug?: string;
}

interface TopicItem {
  id: string;
  name: string;
  code: string;
  unit_id?: string;
  unit_code?: string;
  unit_name?: string;
  subject_id?: string;
  subject_code?: string;
  subject_name?: string;
  college_id?: string;
  college_code?: string;
  college_slug?: string;
}

interface SubTopicItem {
  id: string;
  code: string;
  name?: string;
  description: string;
  topic_id?: string;
  topic_code?: string;
  topic_name?: string;
  unit_id?: string;
  unit_code?: string;
  subject_id?: string;
  subject_code?: string;
  bloom_level?: string;
  domain?: string;
  level?: string;
  is_core?: boolean;
  college_id?: string;
  college_code?: string;
  college_slug?: string;
}

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

interface CourseItem {
  id: string;
  code: string;
  name: string;
  course_cd?: string;
  degree_level?: string;
  college_id?: string;
  college_slug?: string;
}

interface BatchItem {
  id: string;
  code: string;
  name?: string;
  year: number;
  batch_cd?: string;
  course_cd?: string;
  course_name?: string;
  colg_cd?: string;
  college_slug?: string;
}

// ─── Paper Design Section & Practical Interfaces ──────────────────────────────
interface SelectedPaperQuestion {
  questionId: string;
  questionText: string;
  mode: 'MCQ' | 'DESC';
  marks: number;
  unit_code?: string;
  unit_name?: string;
  topic?: string;
  sub_topic_code?: string;
  competency_code?: string;
  difficulty_level?: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_option?: string;
  has_sub_questions?: boolean;
  sub_questions?: SubQuestion[];
}

interface PracticalComponent {
  id: string;
  name: string;
  marks: number;
}

interface PaperSection {
  id: string;
  title: string;
  type: 'MCQ' | 'DESC' | 'PRACTICAL';
  instructions: string;
  targetCount: number;
  selectedQuestions: SelectedPaperQuestion[];
  practicalComponents?: PracticalComponent[];
  filterUnit: string;
  filterTopic: string;
  filterSubTopic: string;
  searchQuery: string;
  tempSelectedIds: string[];
  isPickerOpen?: boolean;
}

const API_BASE = 'http://localhost:3001/api/v1';

const getInitialTenantSlug = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('tenantSlug') || 'srms-cet-bareilly';
  }
  return 'srms-cet-bareilly';
};

export default function AssessmentMasterPage() {
  const [activeTab, setActiveTab] = useState<'bank' | 'design' | 'publish'>('bank');

  // College / Tenant Selection (Defaults to logged in tenant, switchable by user)
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollegeSlug, setSelectedCollegeSlug] = useState<string>(getInitialTenantSlug);

  // All master data from Admin-Master & College-Master APIs
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [allUnits, setAllUnits] = useState<UnitItem[]>([]);
  const [dbTopics, setDbTopics] = useState<TopicItem[]>([]);
  const [dbSubTopics, setDbSubTopics] = useState<SubTopicItem[]>([]);
  const [allLinkers, setAllLinkers] = useState<ProfessionalLinker[]>([]);
  const [collegeProfessionals, setCollegeProfessionals] = useState<CollegeProfessional[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);

  // 3-Tier Hierarchy Selections (Dept -> Subject -> Unit -> Topic -> Sub-Topic)
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedCbmeYear, setSelectedCbmeYear] = useState<string>('');
  const [selectedProfPhase, setSelectedProfPhase] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [selectedTopicName, setSelectedTopicName] = useState<string>('');
  const [selectedSubTopicId, setSelectedSubTopicId] = useState<string>('');
  const [selectedSubTopicCode, setSelectedSubTopicCode] = useState<string>('');

  // Mode Switch (Tab 1)
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
  const [hasSubQuestions, setHasSubQuestions] = useState<boolean>(true);
  const [subQuestions, setSubQuestions] = useState<SubQuestion[]>([
    { id: '1', label: 'a)', questionText: '', marks: 2.5 },
    { id: '2', label: 'b)', questionText: '', marks: 2.5 },
    { id: '3', label: 'c)', questionText: '', marks: 2.5 },
    { id: '4', label: 'd)', questionText: '', marks: 2.5 },
  ]);
  const [descDifficulty, setDescDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Expert'>('Medium');
  const [descMaxMarks, setDescMaxMarks] = useState<number>(10.0);

  // Question Ledger & Filter State (Tab 1)
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnit, setFilterUnit] = useState<string>('all');
  const [filterTopic, setFilterTopic] = useState<string>('all');
  const [filterSubTopic, setFilterSubTopic] = useState<string>('all');

  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ─── TAB 2: Dynamic Question Design & Paper Sections State ────────────────
  const [paperTitle, setPaperTitle] = useState('Mid Term BCA 3rd Sem Exam 2025 Batch');
  const [paperCode, setPaperCode] = useState('WBTECHPYTHON2026-1');
  const [paperDuration, setPaperDuration] = useState(60);
  const [paperPassingMarks, setPaperPassingMarks] = useState(20);
  const [designedPapers, setDesignedPapers] = useState<any[]>([]);

  const [sections, setSections] = useState<PaperSection[]>([
    {
      id: 'sec-1',
      title: 'Section A: Multiple Choice Questions (MCQs)',
      type: 'MCQ',
      instructions: 'Answer all multiple choice questions. Each question carries equal marks.',
      targetCount: 20,
      selectedQuestions: [],
      filterUnit: 'all',
      filterTopic: 'all',
      filterSubTopic: 'all',
      searchQuery: '',
      tempSelectedIds: [],
      isPickerOpen: true,
    },
    {
      id: 'sec-2',
      title: 'Section B: Long Descriptive Questions & Sub-parts',
      type: 'DESC',
      instructions: 'Answer all descriptive questions with detailed sub-part answers.',
      targetCount: 4,
      selectedQuestions: [],
      filterUnit: 'all',
      filterTopic: 'all',
      filterSubTopic: 'all',
      searchQuery: '',
      tempSelectedIds: [],
      isPickerOpen: false,
    },
    {
      id: 'sec-3',
      title: 'Section C: Practical / Clinical / Lab Assessment',
      type: 'PRACTICAL',
      instructions: 'Practical experiment execution, Viva Voce, and Logbook / Record evaluation.',
      targetCount: 1,
      selectedQuestions: [],
      practicalComponents: [
        { id: 'p1', name: 'Lab Experiment / Practical Performance Execution', marks: 20 },
        { id: 'p2', name: 'Viva Voce / Oral Examination', marks: 10 },
        { id: 'p3', name: 'Practical Record Book / Logbook / Portfolio', marks: 5 },
        { id: 'p4', name: 'Continuous Internal Assessment / Attendance', marks: 5 },
      ],
      filterUnit: 'all',
      filterTopic: 'all',
      filterSubTopic: 'all',
      searchQuery: '',
      tempSelectedIds: [],
      isPickerOpen: false,
    },
  ]);

  // ─── TAB 3: Publish States ───────────────────────────────────────────────
  const [collegeCourses, setCollegeCourses] = useState<CourseItem[]>([]);
  const [collegeBatches, setCollegeBatches] = useState<BatchItem[]>([]);
  const [publishSelectedCourse, setPublishSelectedCourse] = useState<string>('all');
  const [publishTargetBatch, setPublishTargetBatch] = useState<string>('');
  const [publishDate, setPublishDate] = useState('2026-08-25');
  const [publishStartTime, setPublishStartTime] = useState('09:00');
  const [publishEndTime, setPublishEndTime] = useState('10:00');
  const [publishedExams, setPublishedExams] = useState<any[]>([]);

  // 1. Initial College List Fetch
  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE}/college-master/colleges`, { headers });
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
        setColleges(list);

        const currentSlug = getInitialTenantSlug();
        const found = list.find((c: College) => c.slug === currentSlug || c.code === currentSlug);
        if (found) {
          setSelectedCollegeSlug(found.slug);
        } else if (list.length > 0) {
          setSelectedCollegeSlug(list[0].slug);
        }
      }
    } catch (e) {
      console.error('Failed to fetch colleges', e);
    }
  };

  // 2. Fetch all metadata whenever selected college changes
  const fetchMetadata = async (slug: string) => {
    setMetaLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const h: Record<string, string> = {
        'x-tenant-slug': slug,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      };
      const parse = (j: any) => Array.isArray(j?.data?.data) ? j.data.data : Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : [];

      const [deptRes, subjRes, unitRes, topicRes, compRes, linkRes, profRes, qRes, papersRes, coursesRes, batchesRes] = await Promise.all([
        fetch(`${API_BASE}/admin-master/departments?tenant=${slug}`, { headers: h }).catch(() => null),
        fetch(`${API_BASE}/admin-master/subjects?tenant=${slug}`, { headers: h }).catch(() => null),
        fetch(`${API_BASE}/admin-master/units?tenant=${slug}`, { headers: h }).catch(() => null),
        fetch(`${API_BASE}/admin-master/topics?tenant=${slug}`, { headers: h }).catch(() => null),
        fetch(`${API_BASE}/admin-master/competencies?tenant=${slug}`, { headers: h }).catch(() => null),
        fetch(`${API_BASE}/admin-master/professional-linkers?tenant=${slug}`, { headers: h }).catch(() => null),
        fetch(`${API_BASE}/college-master/professionals?tenant=${slug}`, { headers: h }).catch(() => null),
        fetch(`${API_BASE}/exams/question-bank?tenant=${slug}`, { headers: h }).catch(() => null),
        fetch(`${API_BASE}/exams/papers?tenant=${slug}`, { headers: h }).catch(() => null),
        fetch(`${API_BASE}/college-master/courses?tenant=${slug}`, { headers: h }).catch(() => null),
        fetch(`${API_BASE}/college-master/batches?tenant=${slug}`, { headers: h }).catch(() => null),
      ]);

      if (deptRes && deptRes.ok) { const j = await deptRes.json(); setDepartments(parse(j)); }
      if (subjRes && subjRes.ok) { const j = await subjRes.json(); setAllSubjects(parse(j)); }
      if (unitRes && unitRes.ok) { const j = await unitRes.json(); setAllUnits(parse(j)); }
      if (topicRes && topicRes.ok) { const j = await topicRes.json(); setDbTopics(parse(j)); }
      if (compRes && compRes.ok) { const j = await compRes.json(); setDbSubTopics(parse(j)); }
      if (linkRes && linkRes.ok) { const j = await linkRes.json(); setAllLinkers(parse(j)); }
      if (profRes && profRes.ok) { const j = await profRes.json(); setCollegeProfessionals(parse(j)); }
      if (qRes && qRes.ok) {
        const j = await qRes.json();
        const qList = parse(j);
        setQuestions(qList);
      }
      if (papersRes && papersRes.ok) { const j = await papersRes.json(); setDesignedPapers(parse(j)); }
      if (coursesRes && coursesRes.ok) { const j = await coursesRes.json(); setCollegeCourses(parse(j)); }
      if (batchesRes && batchesRes.ok) { const j = await batchesRes.json(); setCollegeBatches(parse(j)); }
    } catch (e) {
      console.error('[AssessmentMaster] Failed to fetch Master data', e);
    } finally {
      setMetaLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCollegeSlug) {
      fetchMetadata(selectedCollegeSlug);
    }
  }, [selectedCollegeSlug]);

  // ─── Cascading Handlers (Tab 1) ──────────────────────────────────────────
  const handleCollegeChange = (slug: string) => {
    setSelectedCollegeSlug(slug);
    setSelectedDept('');
    setSelectedSubject('');
    setSelectedUnitId('');
    setSelectedTopicId('');
    setSelectedTopicName('');
    setSelectedSubTopicId('');
    setSelectedSubTopicCode('');
  };

  const handleDepartmentChange = (deptId: string) => {
    setSelectedDept(deptId);
    setSelectedSubject('');
    setSelectedUnitId('');
    setSelectedTopicId('');
    setSelectedTopicName('');
    setSelectedSubTopicId('');
    setSelectedSubTopicCode('');
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubject(subjectId);
    setSelectedUnitId('');
    setSelectedTopicId('');
    setSelectedTopicName('');
    setSelectedSubTopicId('');
    setSelectedSubTopicCode('');
  };

  const handleUnitChange = (unitId: string) => {
    setSelectedUnitId(unitId);
    setSelectedTopicId('');
    setSelectedTopicName('');
    setSelectedSubTopicId('');
    setSelectedSubTopicCode('');

    const matchingTopics = dbTopics.filter(t => t.unit_id === unitId || t.unit_code === unitId);
    if (matchingTopics.length > 0) {
      const firstT = matchingTopics[0];
      setSelectedTopicId(firstT.id || firstT.code);
      setSelectedTopicName(firstT.name);

      const matchingSub = dbSubTopics.find(s => s.topic_id === firstT.id || s.topic_code === firstT.code);
      if (matchingSub) {
        setSelectedSubTopicId(matchingSub.id || matchingSub.code);
        setSelectedSubTopicCode(matchingSub.code);
      }
    }
  };

  const handleTopicChange = (topicId: string) => {
    setSelectedTopicId(topicId);
    const found = dbTopics.find(t => t.id === topicId || t.code === topicId);
    setSelectedTopicName(found?.name || '');
    setSelectedSubTopicId('');
    setSelectedSubTopicCode('');

    const matchingSub = dbSubTopics.find(s => s.topic_id === topicId || s.topic_code === topicId || (found && (s.topic_id === found.id || s.topic_code === found.code)));
    if (matchingSub) {
      setSelectedSubTopicId(matchingSub.id || matchingSub.code);
      setSelectedSubTopicCode(matchingSub.code);
    }
  };

  const handleSubTopicChange = (subTopicIdOrCode: string) => {
    const found = dbSubTopics.find(s => s.id === subTopicIdOrCode || s.code === subTopicIdOrCode);
    if (found) {
      setSelectedSubTopicId(found.id || found.code);
      setSelectedSubTopicCode(found.code);
    } else {
      setSelectedSubTopicId(subTopicIdOrCode);
      setSelectedSubTopicCode(subTopicIdOrCode);
    }
  };

  // Subjects filtered by selected Department
  const subjectsForDept = useMemo(() => {
    if (!selectedDept) return allSubjects;
    const deptObj = departments.find(d => d.id === selectedDept || d.code === selectedDept || d.name === selectedDept);
    if (!deptObj) return allSubjects;

    const dName = (deptObj.name || '').toLowerCase();
    const cleanDeptName = dName.replace('department of ', '').replace(' department', '').replace(/[()]/g, '').trim();

    return allSubjects.filter(s => {
      if (s.department_id === deptObj.id || s.department_id === selectedDept) return true;
      if (s.department_code === deptObj.code || s.branch_cd === deptObj.code) return true;
      if (s.department_name && s.department_name.toLowerCase() === dName) return true;
      if (deptObj.course_cd && s.course_cd && String(s.course_cd) === String(deptObj.course_cd)) return true;

      const sName = (s.name || '').toLowerCase();
      const sCode = (s.code || '').toLowerCase();
      if (cleanDeptName && (sName.includes(cleanDeptName) || sCode.includes(cleanDeptName))) return true;

      return false;
    });
  }, [allSubjects, selectedDept, departments]);


  useEffect(() => {
    if (subjectsForDept.length > 0 && !selectedSubject) {
      setSelectedSubject(subjectsForDept[0].id || subjectsForDept[0].code);
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

  // Units filtered by selected Subject
  const availableUnits = useMemo(() => {
    if (!selectedSubject) return allUnits;
    const subObj = allSubjects.find(s => s.id === selectedSubject || s.code === selectedSubject);
    return allUnits.filter(u =>
      u.subject_id === selectedSubject ||
      u.subject_code === selectedSubject ||
      (subObj && (u.subject_id === subObj.id || u.subject_code === subObj.code))
    );
  }, [allUnits, selectedSubject, allSubjects]);

  useEffect(() => {
    if (availableUnits.length > 0) {
      const exists = availableUnits.some(u => u.id === selectedUnitId || u.code === selectedUnitId);
      if (!exists) {
        setSelectedUnitId(availableUnits[0].id || availableUnits[0].code);
      }
    } else {
      setSelectedUnitId('');
    }
  }, [availableUnits, selectedUnitId]);

  // Topics filtered by selected Unit & Subject
  const availableTopics = useMemo(() => {
    const subObj = allSubjects.find(s => s.id === selectedSubject || s.code === selectedSubject);
    const unitObj = allUnits.find(u => u.id === selectedUnitId || u.code === selectedUnitId);

    return dbTopics.filter(t => {
      if (selectedUnitId && !(t.unit_id === selectedUnitId || t.unit_code === selectedUnitId || (unitObj && (t.unit_id === unitObj.id || t.unit_code === unitObj.code)))) {
        return false;
      }
      if (selectedSubject && !(t.subject_id === selectedSubject || t.subject_code === selectedSubject || (subObj && (t.subject_id === subObj.id || t.subject_code === subObj.code)))) {
        return false;
      }
      return true;
    });
  }, [dbTopics, selectedUnitId, selectedSubject, allUnits, allSubjects]);

  useEffect(() => {
    if (availableTopics.length > 0) {
      const exists = availableTopics.some(t => t.id === selectedTopicId || t.code === selectedTopicId);
      if (!exists) {
        const firstT = availableTopics[0];
        setSelectedTopicId(firstT.id || firstT.code);
        setSelectedTopicName(firstT.name);
      }
    } else {
      setSelectedTopicId('');
      setSelectedTopicName('');
    }
  }, [availableTopics, selectedTopicId]);

  // Sub Topics (Competencies) filtered by selected Topic
  const availableSubTopics = useMemo(() => {
    const topicObj = dbTopics.find(t => t.id === selectedTopicId || t.code === selectedTopicId);
    return dbSubTopics.filter(s => {
      if (selectedTopicId) {
        return s.topic_id === selectedTopicId || s.topic_code === selectedTopicId || (topicObj && (s.topic_id === topicObj.id || s.topic_code === topicObj.code));
      }
      return true;
    });
  }, [dbSubTopics, selectedTopicId, dbTopics]);

  useEffect(() => {
    if (availableSubTopics.length > 0) {
      const exists = availableSubTopics.some(s => s.id === selectedSubTopicId || s.code === selectedSubTopicCode);
      if (!exists) {
        const firstSub = availableSubTopics[0];
        setSelectedSubTopicId(firstSub.id || firstSub.code);
        setSelectedSubTopicCode(firstSub.code);
      }
    } else {
      setSelectedSubTopicId('');
      setSelectedSubTopicCode('');
    }
  }, [availableSubTopics, selectedSubTopicId, selectedSubTopicCode]);

  const canEnterQuestion = !!(selectedSubject && selectedTopicId && selectedSubTopicCode);

  // Batches filtered by selected course for Tab 3 (Publish)
  const availablePublishBatches = useMemo(() => {
    return collegeBatches.filter(b => {
      if (!publishSelectedCourse || publishSelectedCourse === 'all') return true;
      return (
        b.course_cd === publishSelectedCourse ||
        b.code?.includes(publishSelectedCourse) ||
        (b.course_name && b.course_name.toLowerCase().includes(publishSelectedCourse.toLowerCase()))
      );
    });
  }, [collegeBatches, publishSelectedCourse]);

  useEffect(() => {
    if (availablePublishBatches.length > 0) {
      const exists = availablePublishBatches.some(b => {
        const fullLabel = `${b.name || `Batch ${b.year}`} [${b.code}]`;
        return b.name === publishTargetBatch || b.code === publishTargetBatch || fullLabel === publishTargetBatch;
      });
      if (!exists) {
        const first = availablePublishBatches[0];
        setPublishTargetBatch(`${first.name || `Batch ${first.year}`} [${first.code}]`);
      }
    }
  }, [availablePublishBatches, publishTargetBatch]);

  // Dynamic Sub-Questions Actions (Tab 1)
  const handleAddSubQuestion = () => {
    const nextIdx = subQuestions.length;
    const label = `${String.fromCharCode(97 + nextIdx)})`;
    setSubQuestions([...subQuestions, { id: Date.now().toString(), label, questionText: '', marks: 2.5 }]);
  };

  const handleRemoveSubQuestion = (id: string) => {
    if (subQuestions.length <= 1) return;
    setSubQuestions(subQuestions.filter(sq => sq.id !== id));
  };

  const handleSubQuestionChange = (id: string, field: 'questionText' | 'marks', value: any) => {
    setSubQuestions(subQuestions.map(sq => (sq.id === id ? { ...sq, [field]: value } : sq)));
  };

  // Save Question to Bank (Tab 1)
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !selectedTopicId || !selectedSubTopicCode) {
      setAlert({ type: 'error', message: 'Please select Subject, Unit, Topic, and Sub-Topic before saving.' });
      return;
    }

    setSaving(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const profObj = collegeProfessionals.find(p => p.id === selectedProfPhase);
    const unitObj = allUnits.find(u => u.id === selectedUnitId || u.code === selectedUnitId);

    const payload = mode === 'MCQ' ? {
      departmentId: selectedDept || null,
      subjectId: selectedSubject || null,
      professionalPhase: profObj?.name || null,
      unitId: unitObj?.id || selectedUnitId || null,
      unitCode: unitObj?.code || selectedUnitId || null,
      unitName: unitObj?.name || null,
      topicId: selectedTopicId || null,
      topic: selectedTopicName,
      subTopicId: selectedSubTopicId || null,
      subTopicCode: selectedSubTopicCode,
      competencyCode: selectedSubTopicCode,
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
      professionalPhase: profObj?.name || null,
      unitId: unitObj?.id || selectedUnitId || null,
      unitCode: unitObj?.code || selectedUnitId || null,
      unitName: unitObj?.name || null,
      topicId: selectedTopicId || null,
      topic: selectedTopicName,
      subTopicId: selectedSubTopicId || null,
      subTopicCode: selectedSubTopicCode,
      competencyCode: selectedSubTopicCode,
      mode: 'DESC',
      questionText: descQuestionText.trim(),
      hasSubQuestions,
      subQuestions: hasSubQuestions ? subQuestions : [],
      difficultyLevel: descDifficulty,
      maxMarks: Number(descMaxMarks) || 10.0,
    };

    try {
      const res = await fetch(`${API_BASE}/exams/question-bank?tenant=${selectedCollegeSlug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': selectedCollegeSlug,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        const newObj = json.data || json;
        setQuestions([newObj, ...questions]);
        setAlert({ type: 'success', message: `${mode} Question saved under Sub-Topic '${selectedSubTopicCode}'!` });
        resetForm();
      } else {
        const newQ: QuestionItem = {
          id: Date.now().toString(),
          ...payload as any,
          topic: payload.topic,
          question_text: payload.questionText,
          difficulty_level: payload.difficultyLevel,
          sub_topic_code: payload.subTopicCode,
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
        setAlert({ type: 'success', message: `${mode} Question saved under Sub-Topic '${selectedSubTopicCode}'!` });
        resetForm();
      }
    } catch {
      const newQ: QuestionItem = {
        id: Date.now().toString(),
        ...payload as any,
        topic: payload.topic,
        question_text: payload.questionText,
        difficulty_level: payload.difficultyLevel,
        sub_topic_code: payload.subTopicCode,
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
      setAlert({ type: 'success', message: `${mode} Question saved under Sub-Topic '${selectedSubTopicCode}'!` });
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
      setHasSubQuestions(true);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
      await fetch(`${API_BASE}/exams/question-bank/${id}?tenant=${selectedCollegeSlug}`, {
        method: 'DELETE',
        headers,
      });
    } catch {}
    setQuestions(questions.filter(q => q.id !== id));
  };

  // Filtered Questions Ledger (Tab 1)
  const filteredQuestions = questions.filter((q) => {
    const qUnit = (q.unit_code || 'CO1').toLowerCase();
    const qUnitName = (q.unit_name || '').toLowerCase();
    const fUnit = filterUnit.toLowerCase();

    const matchesUnit = filterUnit === 'all' || 
      qUnit === fUnit || 
      qUnitName.includes(fUnit) || 
      fUnit.includes(qUnit) ||
      (fUnit.includes('co1') && (qUnit.includes('co1') || qUnitName.includes('co1') || qUnitName.includes('unit 1')));

    const qTopic = (q.topic || '').toLowerCase();
    const fTopic = filterTopic.toLowerCase();
    const matchesTopic = filterTopic === 'all' || 
      qTopic === fTopic || 
      qTopic.includes(fTopic) || 
      fTopic.includes(qTopic);

    const qSub = (q.sub_topic_code || q.competency_code || '').toLowerCase();
    const fSub = filterSubTopic.toLowerCase();
    const matchesSubTopic = filterSubTopic === 'all' || 
      qSub === fSub || 
      qSub.includes(fSub) || 
      fSub.includes(qSub);

    const matchesSearch =
      !searchQuery ||
      (q.question_text && q.question_text.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.competency_code && q.competency_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.sub_topic_code && q.sub_topic_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.topic && q.topic.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSearch && matchesUnit && matchesTopic && matchesSubTopic;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── TAB 2: ADVANCED SECTION & QUESTION DESIGN BUILDER ACTIONS ───────────
  // ═══════════════════════════════════════════════════════════════════════════
  const handleAddSection = () => {
    const secLetter = String.fromCharCode(65 + sections.length);
    const newSec: PaperSection = {
      id: `sec-${Date.now()}`,
      title: `Section ${secLetter}: Additional Component`,
      type: 'MCQ',
      instructions: 'Answer all questions in this section.',
      targetCount: 10,
      selectedQuestions: [],
      filterUnit: 'all',
      filterTopic: 'all',
      filterSubTopic: 'all',
      searchQuery: '',
      tempSelectedIds: [],
      isPickerOpen: true,
    };
    setSections([...sections, newSec]);
  };

  const handleRemoveSection = (sectionId: string) => {
    if (sections.length <= 1) return;
    setSections(sections.filter(s => s.id !== sectionId));
  };

  const handleUpdateSectionField = (sectionId: string, field: keyof PaperSection, value: any) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        if (field === 'type' && value === 'PRACTICAL' && (!s.practicalComponents || s.practicalComponents.length === 0)) {
          return {
            ...s,
            [field]: value,
            practicalComponents: [
              { id: 'p1', name: 'Lab Experiment / Practical Performance Execution', marks: 20 },
              { id: 'p2', name: 'Viva Voce / Oral Examination', marks: 10 },
              { id: 'p3', name: 'Practical Record Book / Logbook / Portfolio', marks: 5 },
              { id: 'p4', name: 'Continuous Internal Assessment / Attendance', marks: 5 },
            ],
          };
        }
        return { ...s, [field]: value };
      }
      return s;
    }));
  };

  // Section Question Picker Filter helper
  const getFilteredQuestionsForSection = (section: PaperSection) => {
    const subObj = allSubjects.find(s => s.id === selectedSubject || s.code === selectedSubject);

    return questions.filter(q => {
      if (q.mode !== section.type) return false;

      // Filter by current Subject context if available
      if (selectedSubject) {
        const matchesSubj = !q.subject_id ||
          q.subject_id === selectedSubject ||
          q.subject_code === selectedSubject ||
          (subObj && (q.subject_id === subObj.id || q.subject_code === subObj.code));
        if (!matchesSubj) return false;
      }

      if (section.filterUnit && section.filterUnit !== 'all') {
        const qUnit = (q.unit_code || 'CO1').toLowerCase();
        const qUnitName = (q.unit_name || '').toLowerCase();
        const fUnit = section.filterUnit.toLowerCase();
        const uMatches = qUnit === fUnit || qUnitName.includes(fUnit) || fUnit.includes(qUnit) || (fUnit.includes('co1') && (qUnit.includes('co1') || qUnitName.includes('co1') || qUnitName.includes('unit 1')));
        if (!uMatches) return false;
      }
      if (section.filterTopic && section.filterTopic !== 'all') {
        const qTopic = (q.topic || '').toLowerCase();
        const fTopic = section.filterTopic.toLowerCase();
        const tMatches = qTopic === fTopic || qTopic.includes(fTopic) || fTopic.includes(qTopic);
        if (!tMatches) return false;
      }
      if (section.filterSubTopic && section.filterSubTopic !== 'all') {
        const qSub = (q.sub_topic_code || q.competency_code || '').toLowerCase();
        const fSub = section.filterSubTopic.toLowerCase();
        const sMatches = qSub === fSub || qSub.includes(fSub) || fSub.includes(qSub);
        if (!sMatches) return false;
      }
      if (section.searchQuery) {
        const qMatches = (q.question_text && q.question_text.toLowerCase().includes(section.searchQuery.toLowerCase())) ||
                         (q.sub_topic_code && q.sub_topic_code.toLowerCase().includes(section.searchQuery.toLowerCase())) ||
                         (q.competency_code && q.competency_code.toLowerCase().includes(section.searchQuery.toLowerCase()));
        if (!qMatches) return false;
      }
      return true;
    });
  };

  // Checkbox toggle for question in section picker
  const handleToggleQuestionInPicker = (sectionId: string, qId: string) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        const has = s.tempSelectedIds.includes(qId);
        return {
          ...s,
          tempSelectedIds: has ? s.tempSelectedIds.filter(id => id !== qId) : [...s.tempSelectedIds, qId],
        };
      }
      return s;
    }));
  };

  // Auto Complete / Select All filtered questions in Section
  const handleSelectAllInPicker = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    const avail = getFilteredQuestionsForSection(section);
    const allIds = avail.map(q => q.id);

    setSections(sections.map(s => {
      if (s.id === sectionId) {
        const allSelected = allIds.every(id => s.tempSelectedIds.includes(id));
        return {
          ...s,
          tempSelectedIds: allSelected ? [] : Array.from(new Set([...s.tempSelectedIds, ...allIds])),
        };
      }
      return s;
    }));
  };

  // Add Selected Questions from Picker into Section list
  const handleAddSelectedQuestionsToSection = (sectionId: string) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        const toAdd = questions
          .filter(q => s.tempSelectedIds.includes(q.id) && !s.selectedQuestions.some(sq => sq.questionId === q.id))
          .map(q => ({
            questionId: q.id,
            questionText: q.question_text,
            mode: q.mode,
            marks: q.max_marks || (q.mode === 'MCQ' ? 1.0 : 10.0),
            unit_code: q.unit_code,
            unit_name: q.unit_name,
            topic: q.topic,
            sub_topic_code: q.sub_topic_code || q.competency_code,
            difficulty_level: q.difficulty_level,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d,
            correct_option: q.correct_option,
            has_sub_questions: q.has_sub_questions,
            sub_questions: q.sub_questions,
          }));

        return {
          ...s,
          selectedQuestions: [...s.selectedQuestions, ...toAdd],
          tempSelectedIds: [],
          isPickerOpen: false,
        };
      }
      return s;
    }));
  };

  // Change individual question marks
  const handleUpdateQuestionMarks = (sectionId: string, questionId: string, newMarks: number) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          selectedQuestions: s.selectedQuestions.map(q => q.questionId === questionId ? { ...q, marks: newMarks } : q),
        };
      }
      return s;
    }));
  };

  // Remove question from section
  const handleRemoveQuestionFromSection = (sectionId: string, questionId: string) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          selectedQuestions: s.selectedQuestions.filter(q => q.questionId !== questionId),
        };
      }
      return s;
    }));
  };

  // Practical Components Management
  const handleAddPracticalComponent = (sectionId: string) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        const comps = s.practicalComponents || [];
        const newC: PracticalComponent = {
          id: `p-${Date.now()}`,
          name: `Component ${comps.length + 1}: Custom Practical Assessment`,
          marks: 10,
        };
        return { ...s, practicalComponents: [...comps, newC] };
      }
      return s;
    }));
  };

  const handleUpdatePracticalComponent = (sectionId: string, compId: string, field: 'name' | 'marks', value: any) => {
    setSections(sections.map(s => {
      if (s.id === sectionId && s.practicalComponents) {
        return {
          ...s,
          practicalComponents: s.practicalComponents.map(c => c.id === compId ? { ...c, [field]: value } : c),
        };
      }
      return s;
    }));
  };

  const handleRemovePracticalComponent = (sectionId: string, compId: string) => {
    setSections(sections.map(s => {
      if (s.id === sectionId && s.practicalComponents) {
        return {
          ...s,
          practicalComponents: s.practicalComponents.filter(c => c.id !== compId),
        };
      }
      return s;
    }));
  };

  // ─── Live Paper Totals Calculation ────────────────────────────────────────
  const paperTotals = useMemo(() => {
    let mcqCount = 0;
    let mcqMarks = 0;
    let descCount = 0;
    let descMarks = 0;
    let practicalMarks = 0;

    sections.forEach(s => {
      if (s.type === 'MCQ') {
        mcqCount += s.selectedQuestions.length;
        mcqMarks += s.selectedQuestions.reduce((acc, q) => acc + (Number(q.marks) || 0), 0);
      } else if (s.type === 'DESC') {
        descCount += s.selectedQuestions.length;
        descMarks += s.selectedQuestions.reduce((acc, q) => acc + (Number(q.marks) || 0), 0);
      } else if (s.type === 'PRACTICAL') {
        practicalMarks += (s.practicalComponents || []).reduce((acc, c) => acc + (Number(c.marks) || 0), 0);
      }
    });

    const totalTheoryMarks = mcqMarks + descMarks;
    const grandTotalMarks = totalTheoryMarks + practicalMarks;

    return {
      mcqCount,
      mcqMarks,
      descCount,
      descMarks,
      totalTheoryMarks,
      practicalMarks,
      grandTotalMarks,
    };
  }, [sections]);

  // Save Paper Design to PostgreSQL & Proceed to Tab 3
  const handleSavePaperDesign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

    const payload = {
      code: paperCode,
      name: paperTitle,
      durationMinutes: Number(paperDuration) || 60,
      maxMarks: paperTotals.grandTotalMarks || 40,
      passingMarks: Number(paperPassingMarks) || 20,
      subjectId: selectedSubject || null,
      type: paperTotals.practicalMarks > 0 ? 'THEORY_PRACTICAL' : 'THEORY',
      sections: sections.map(s => ({
        id: s.id,
        title: s.title,
        type: s.type,
        instructions: s.instructions,
        targetCount: s.targetCount,
        questions: s.selectedQuestions,
        practicalComponents: s.practicalComponents || [],
        subtotalMarks: s.type === 'PRACTICAL'
          ? (s.practicalComponents || []).reduce((acc, c) => acc + (Number(c.marks) || 0), 0)
          : s.selectedQuestions.reduce((acc, q) => acc + (Number(q.marks) || 0), 0),
      })),
    };

    try {
      const res = await fetch(`${API_BASE}/exams/papers?tenant=${selectedCollegeSlug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': selectedCollegeSlug,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        setDesignedPapers([json.data || json, ...designedPapers]);
      } else {
        const newPaper = {
          id: Date.now().toString(),
          code: paperCode,
          name: paperTitle,
          duration_minutes: paperDuration,
          max_marks: paperTotals.grandTotalMarks,
          status: 'Ready for Publish',
          sections: payload.sections,
        };
        setDesignedPapers([newPaper, ...designedPapers]);
      }
      setAlert({ type: 'success', message: `Assessment Paper [${paperCode}] designed with ${sections.length} sections (${paperTotals.grandTotalMarks} Marks)!` });
      setActiveTab('publish');
    } catch {
      const newPaper = {
        id: Date.now().toString(),
        code: paperCode,
        name: paperTitle,
        duration_minutes: paperDuration,
        max_marks: paperTotals.grandTotalMarks,
        status: 'Ready for Publish',
        sections: payload.sections,
      };
      setDesignedPapers([newPaper, ...designedPapers]);
      setAlert({ type: 'success', message: `Assessment Paper [${paperCode}] saved successfully!` });
      setActiveTab('publish');
    } finally {
      setSaving(false);
    }
  };

  // Publish Examination (Tab 3)
  const handlePublishExam = (e: React.FormEvent) => {
    e.preventDefault();
    const newExam = {
      id: Date.now().toString(),
      paperCode,
      paperName: paperTitle,
      batch: publishTargetBatch,
      date: publishDate,
      time: `${publishStartTime} - ${publishEndTime}`,
      status: 'PUBLISHED',
    };
    setPublishedExams([newExam, ...publishedExams]);
    setAlert({ type: 'success', message: `Exam [${paperCode}] published to student portal for batch ${publishTargetBatch}!` });
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Assessment & Question Bank Master" />
        <main className="p-6 space-y-6 flex-1 bg-[#F6F8FC] dark:bg-[#0F172A]">

          {/* Alert Notification Toast */}
          {alert && (
            <div className={`p-4 rounded-2xl border text-xs font-extrabold transition-all shadow-md flex items-center justify-between ${
              alert.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
            }`}>
              <span>{alert.type === 'success' ? '✅' : '⚠️'} {alert.message}</span>
              <button onClick={() => setAlert(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
          )}

          {/* MAIN 3 TABS HEADER adhering to Theme.md */}
          <div className="p-5 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight uppercase">
                Assessment & Examination Design Portal
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Unit, Topic & Sub-Topics Master Question Bank & Interactive Exam Paper Builder
              </p>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-[#F6F8FC] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold shrink-0">
              <button
                onClick={() => setActiveTab('bank')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'bank'
                    ? 'bg-[#5B4BFF] text-white shadow-md shadow-[#5B4BFF]/20 font-extrabold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                1. Question Bank
              </button>

              <button
                onClick={() => setActiveTab('design')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'design'
                    ? 'bg-[#5B4BFF] text-white shadow-md shadow-[#5B4BFF]/20 font-extrabold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                2. Question Design ({sections.length} Sections)
              </button>

              <button
                onClick={() => setActiveTab('publish')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'publish'
                    ? 'bg-[#5B4BFF] text-white shadow-md shadow-[#5B4BFF]/20 font-extrabold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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

              {/* Context Selector Bar with Multi-College Dropdown & Cascading Auto-Select */}
              <div className="p-6 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#5B4BFF] flex items-center gap-2">
                    <span>🏛️</span>
                    <span>Assessment Context & Institution Selection</span>
                  </h3>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono uppercase font-bold">✨ Live Multi-Tenant Master</span>
                </div>

                {/* Row 1: College Selection + Department + Subject */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* 1. College Selection Dropdown */}
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-[#5B4BFF] mb-1">
                      1. Institution / College *
                    </label>
                    <select
                      value={selectedCollegeSlug}
                      onChange={(e) => handleCollegeChange(e.target.value)}
                      disabled={metaLoading}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:border-[#5B4BFF]"
                    >
                      {colleges.map((c) => (
                        <option key={c.id} value={c.slug}>
                          🏛️ [#{c.code || c.id}] {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Department */}
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      2. Department *
                    </label>
                    <select
                      value={selectedDept}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      disabled={metaLoading}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:border-[#5B4BFF] disabled:opacity-50"
                    >
                      {metaLoading ? <option value="">Loading departments…</option>
                        : departments.length === 0 ? <option value="">No departments found</option>
                        : <><option value="">— Select Department —</option>
                           {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}</>}
                    </select>
                  </div>

                  {/* 3. Subject */}
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 mb-1">
                      3. Subject *
                    </label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      disabled={!selectedDept || metaLoading}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-emerald-500/40 text-emerald-700 dark:text-emerald-400 font-bold text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
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
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-[#F36C21] mb-1">
                      CBME Academic Session / Year *
                    </label>
                    <select
                      value={selectedCbmeYear}
                      onChange={(e) => setSelectedCbmeYear(e.target.value)}
                      disabled={!selectedSubject || metaLoading}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-orange-500/40 text-[#F36C21] font-bold text-xs focus:outline-none focus:border-[#F36C21] disabled:opacity-50"
                    >
                      {!selectedSubject ? <option value="">Select Subject first</option>
                        : cbmeYearsList.length === 0 ? <option value="">No CBME sessions in Master</option>
                        : <><option value="">— Select CBME Session —</option>
                           {cbmeYearsList.map(y => <option key={y.id} value={y.id}>{y.label}</option>)}</>}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-purple-600 dark:text-purple-400 mb-1">
                      Professional Phase / Semester *
                    </label>
                    <select
                      value={selectedProfPhase}
                      onChange={(e) => setSelectedProfPhase(e.target.value)}
                      disabled={!selectedCbmeYear || metaLoading}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-purple-500/40 text-purple-700 dark:text-purple-300 font-bold text-xs focus:outline-none focus:border-purple-500 disabled:opacity-50"
                    >
                      {!selectedCbmeYear ? <option value="">Select CBME Session first</option>
                        : collegeProfessionals.length === 0 ? <option value="">No professionals in College Master</option>
                        : <><option value="">— Select Professional Phase —</option>
                           {collegeProfessionals.map(p => (
                             <option key={p.id} value={p.id}>{p.name} [{p.course_cd}]</option>
                           ))}</>}
                    </select>
                  </div>
                </div>
              </div>

              {/* 3-TIER HIERARCHY: Unit -> Topic -> Sub-Topics */}
              <div className="p-6 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 space-y-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7EAF3] dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider">
                      📝 Create New Question for Bank
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Select Unit &rarr; Topic &rarr; Sub Topic from Master to unlock question composition
                    </p>
                  </div>

                  <div className="flex items-center gap-1 p-1 bg-[#F6F8FC] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-black">
                    <button
                      type="button"
                      onClick={() => setMode('MCQ')}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        mode === 'MCQ'
                          ? 'bg-[#5B4BFF] text-white shadow-md shadow-[#5B4BFF]/20'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      🔘 MCQs Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('DESC')}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        mode === 'DESC'
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      📄 DESC Mode
                    </button>
                  </div>
                </div>

                {/* 🎯 3-Tier Cascading Selector: Unit Dropdown -> Topic Dropdown -> Sub Topics Dropdown */}
                <div className="p-5 rounded-2xl bg-[#F6F8FC] dark:bg-slate-900/90 border border-[#5B4BFF]/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-[#5B4BFF] tracking-wider">
                      🎯 Unit Master &rarr; Topic Master &rarr; Sub Topics Master
                    </h4>
                    {canEnterQuestion ? (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-extrabold uppercase">
                        ✅ Ready to Enter Question
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-extrabold uppercase">
                        ⚠️ Select Unit, Topic & Sub Topic to unlock
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 1. Unit Dropdown */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase text-[#5B4BFF] mb-1">
                        1. Unit (Unit Master) *
                      </label>
                      <select
                        value={selectedUnitId}
                        onChange={(e) => handleUnitChange(e.target.value)}
                        disabled={!selectedSubject}
                        className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:border-[#5B4BFF] disabled:opacity-50"
                      >
                        {!selectedSubject ? <option value="">Select Subject first</option>
                          : availableUnits.length === 0 ? <option value="">No units found for this Subject</option>
                          : <><option value="">— Select Unit —</option>
                             {availableUnits.map(u => (
                               <option key={u.id} value={u.id || u.code}>
                                 {u.name} ({u.code})
                               </option>
                             ))}</>}
                      </select>
                    </div>

                    {/* 2. Topic Dropdown */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase text-[#F36C21] mb-1">
                        2. Topic (Topic Master) *
                      </label>
                      <select
                        value={selectedTopicId}
                        onChange={(e) => handleTopicChange(e.target.value)}
                        disabled={!selectedUnitId}
                        className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:border-[#F36C21] disabled:opacity-50"
                      >
                        {!selectedUnitId ? <option value="">Select Unit first</option>
                          : availableTopics.length === 0 ? <option value="">No topics found in this Unit</option>
                          : <><option value="">— Select Topic —</option>
                             {availableTopics.map(t => (
                               <option key={t.id} value={t.id || t.code}>
                                 {t.name} ({t.code || ''})
                               </option>
                             ))}</>}
                      </select>
                    </div>

                    {/* 3. Sub Topics Dropdown */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 mb-1">
                        3. Sub Topics (Sub Topics Master) *
                      </label>
                      <select
                        value={selectedSubTopicCode}
                        onChange={(e) => handleSubTopicChange(e.target.value)}
                        disabled={!selectedTopicId}
                        className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                      >
                        {!selectedTopicId ? <option value="">Select Topic first</option>
                          : availableSubTopics.length === 0 ? <option value="">No sub topics for this topic</option>
                          : <><option value="">— Select Sub Topic —</option>
                             {availableSubTopics.map(s => (
                               <option key={s.id || s.code} value={s.code}>
                                 {s.code}: {s.description || s.name}
                               </option>
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
                        <label className="block text-xs font-extrabold uppercase text-slate-800 dark:text-slate-300 mb-1">
                          Question Prompt / Stem *
                        </label>
                        <textarea
                          rows={3}
                          value={mcqQuestionText}
                          onChange={(e) => setMcqQuestionText(e.target.value)}
                          placeholder="Enter Multiple Choice Question prompt text here..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#5B4BFF]"
                          required
                        />
                      </div>

                      {/* 4 Options Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                            Option A *
                          </label>
                          <input
                            type="text"
                            value={optionA}
                            onChange={(e) => setOptionA(e.target.value)}
                            placeholder="Option A answer choice"
                            className="w-full px-3.5 py-2 rounded-lg bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#5B4BFF]"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                            Option B *
                          </label>
                          <input
                            type="text"
                            value={optionB}
                            onChange={(e) => setOptionB(e.target.value)}
                            placeholder="Option B answer choice"
                            className="w-full px-3.5 py-2 rounded-lg bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#5B4BFF]"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                            Option C *
                          </label>
                          <input
                            type="text"
                            value={optionC}
                            onChange={(e) => setOptionC(e.target.value)}
                            placeholder="Option C answer choice"
                            className="w-full px-3.5 py-2 rounded-lg bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#5B4BFF]"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                            Option D *
                          </label>
                          <input
                            type="text"
                            value={optionD}
                            onChange={(e) => setOptionD(e.target.value)}
                            placeholder="Option D answer choice"
                            className="w-full px-3.5 py-2 rounded-lg bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#5B4BFF]"
                            required
                          />
                        </div>
                      </div>

                      {/* Correct Answer Dropdown, Level & Parameters */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-[#F6F8FC] dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <div>
                          <label className="block text-xs font-extrabold uppercase text-emerald-700 dark:text-emerald-400 mb-1">
                            Correct Answer Choice *
                          </label>
                          <select
                            value={correctOption}
                            onChange={(e) => setCorrectOption(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs focus:outline-none focus:border-emerald-500"
                          >
                            <option value="option_a">Option A</option>
                            <option value="option_b">Option B</option>
                            <option value="option_c">Option C</option>
                            <option value="option_d">Option D</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                            Difficulty Level *
                          </label>
                          <select
                            value={mcqDifficulty}
                            onChange={(e) => setMcqDifficulty(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#5B4BFF]"
                          >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                            <option value="Expert">Expert</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                            Marks
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            value={mcqMaxMarks}
                            onChange={(e) => setMcqMaxMarks(parseFloat(e.target.value) || 1)}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-[#5B4BFF]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ────────────────── MODE 2: DESC FORM ────────────────── */}
                  {mode === 'DESC' && (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-extrabold uppercase text-slate-800 dark:text-slate-300 mb-1">
                          Long Question Text / Case Description *
                        </label>
                        <textarea
                          rows={4}
                          value={descQuestionText}
                          onChange={(e) => setDescQuestionText(e.target.value)}
                          placeholder="Enter Long Question Prompt or Clinical Case Scenario..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-purple-500"
                          required
                        />
                      </div>

                      {/* Sub-Questions Toggle */}
                      <div className="p-4 rounded-xl bg-[#F6F8FC] dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-extrabold uppercase text-purple-700 dark:text-purple-300">
                              Sub-questions / Question Parts (4 Parts a, b, c, d)
                            </span>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Does this long question contain sub-parts?</p>
                          </div>

                          <div className="flex items-center gap-2 bg-white dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                            <button
                              type="button"
                              onClick={() => setHasSubQuestions(true)}
                              className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                                hasSubQuestions ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              Yes (4 Parts)
                            </button>
                            <button
                              type="button"
                              onClick={() => setHasSubQuestions(false)}
                              className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                                !hasSubQuestions ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              No (Single Prompt)
                            </button>
                          </div>
                        </div>

                        {/* Sub-Questions Dynamic Builder */}
                        {hasSubQuestions && (
                          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-700 dark:text-slate-300">Sub-question Parts Breakdown:</span>
                              <button
                                type="button"
                                onClick={handleAddSubQuestion}
                                className="px-2.5 py-1 rounded bg-purple-600/10 text-purple-700 dark:text-purple-300 hover:bg-purple-600/20 border border-purple-500/30 text-[11px] font-bold"
                              >
                                + Add Sub-Question Part
                              </button>
                            </div>

                            {subQuestions.map((sq) => (
                              <div key={sq.id} className="flex items-center gap-2 bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                                <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 shrink-0 w-6">
                                  {sq.label}
                                </span>
                                <input
                                  type="text"
                                  value={sq.questionText}
                                  onChange={(e) => handleSubQuestionChange(sq.id, 'questionText', e.target.value)}
                                  placeholder="Sub-question prompt (e.g. Explain diagnostic criteria)"
                                  className="flex-1 px-2.5 py-1.5 rounded bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-purple-500"
                                />
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="text-[10px] text-slate-500">Marks:</span>
                                  <input
                                    type="number"
                                    step="0.5"
                                    value={sq.marks}
                                    onChange={(e) => handleSubQuestionChange(sq.id, 'marks', parseFloat(e.target.value) || 0)}
                                    className="w-16 px-2 py-1 rounded bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSubQuestion(sq.id)}
                                  className="text-slate-400 hover:text-rose-500 px-1 text-sm font-bold"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Difficulty Level & Total Max Marks */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#F6F8FC] dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                            Difficulty Level *
                          </label>
                          <select
                            value={descDifficulty}
                            onChange={(e) => setDescDifficulty(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-purple-500"
                          >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                            <option value="Expert">Expert</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                            Total Maximum Marks
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            value={descMaxMarks}
                            onChange={(e) => setDescMaxMarks(parseFloat(e.target.value) || 10)}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Save Button Action adhering to Theme.md */}
                  <div className="flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={saving || !canEnterQuestion}
                      className={`px-6 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 ${
                        !canEnterQuestion
                          ? 'bg-slate-400 cursor-not-allowed opacity-60'
                          : mode === 'MCQ'
                            ? 'bg-[#5B4BFF] hover:bg-[#4938DF] shadow-[#5B4BFF]/20'
                            : 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/20'
                      }`}
                    >
                      {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      <span>💾 Save {mode} Question under Sub-Topic {selectedSubTopicCode || 'Code'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Question Bank Repository Ledger Table */}
              <div className="p-6 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider">
                      📚 Question Bank Repository ({filteredQuestions.length})
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Questions filtered by Unit, Topic, Sub Topic, and Mode
                    </p>
                  </div>

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="🔍 Search questions, topics or sub-topics..."
                    className="px-3.5 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#5B4BFF] w-full sm:w-64"
                  />
                </div>

                {/* Repository Filter Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#F6F8FC] dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-[#5B4BFF] mb-1">
                      Filter By Unit (Unit Master)
                    </label>
                    <select
                      value={filterUnit}
                      onChange={(e) => setFilterUnit(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none font-bold"
                    >
                      <option value="all">All Units</option>
                      {allUnits.map(u => (
                        <option key={u.id} value={u.code || u.name}>{u.name} ({u.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-[#F36C21] mb-1">
                      Filter By Topic (Topic Master)
                    </label>
                    <select
                      value={filterTopic}
                      onChange={(e) => setFilterTopic(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none font-bold"
                    >
                      <option value="all">All Topics</option>
                      {dbTopics.map(t => (
                        <option key={t.id} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 mb-1">
                      Filter By Sub Topic Code (Sub Topics Master)
                    </label>
                    <select
                      value={filterSubTopic}
                      onChange={(e) => setFilterSubTopic(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none font-mono font-bold"
                    >
                      <option value="all">All Sub Topics</option>
                      {dbSubTopics.map(s => (
                        <option key={s.id || s.code} value={s.code}>
                          {s.code} — {s.description || s.name || s.topic_name || 'Sub-Topic'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {filteredQuestions.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/20 font-medium">
                    No {mode} questions found matching selected filters. Use the form above to add questions!
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#E7EAF3] dark:border-slate-800 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] tracking-wider bg-slate-50 dark:bg-slate-800/50">
                          <th className="pl-4 py-3">Mode & Level</th>
                          <th className="py-3">Question Prompt</th>
                          <th className="py-3">Unit / Topic / Sub Topic</th>
                          <th className="py-3">Marks</th>
                          <th className="pr-4 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800">
                        {filteredQuestions.map((q) => (
                          <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="align-top py-3 pl-4">
                              <div className="flex flex-col gap-1 items-start">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                                  q.mode === 'MCQ'
                                    ? 'bg-[#5B4BFF]/10 text-[#5B4BFF] border-[#5B4BFF]/30'
                                    : 'bg-purple-500/10 text-purple-600 border-purple-500/30'
                                }`}>
                                  {q.mode}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  q.difficulty_level === 'Easy' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                                  q.difficulty_level === 'Hard' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' :
                                  q.difficulty_level === 'Expert' ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20' :
                                  'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                }`}>
                                  {q.difficulty_level || 'Medium'}
                                </span>
                              </div>
                            </td>

                            <td className="align-top py-3 max-w-md">
                              <p className="font-bold text-slate-900 dark:text-white text-xs leading-relaxed">{q.question_text}</p>
                              {q.mode === 'MCQ' && (
                                <div className="grid grid-cols-2 gap-1.5 pt-2 text-[11px]">
                                  <div className={`p-1.5 rounded border ${q.correct_option === 'option_a' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-400 font-bold' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}>
                                    A) {q.option_a}
                                  </div>
                                  <div className={`p-1.5 rounded border ${q.correct_option === 'option_b' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-400 font-bold' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}>
                                    B) {q.option_b}
                                  </div>
                                  <div className={`p-1.5 rounded border ${q.correct_option === 'option_c' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-400 font-bold' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}>
                                    C) {q.option_c}
                                  </div>
                                  <div className={`p-1.5 rounded border ${q.correct_option === 'option_d' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-400 font-bold' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}>
                                    D) {q.option_d}
                                  </div>
                                </div>
                              )}
                              {q.mode === 'DESC' && q.has_sub_questions && Array.isArray(q.sub_questions) && (
                                <div className="space-y-1 pt-2">
                                  <span className="text-[10px] font-extrabold uppercase text-purple-600 dark:text-purple-400">Sub-questions:</span>
                                  {q.sub_questions.map((sq, idx) => (
                                    <div key={idx} className="p-1.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
                                      <span className="text-slate-800 dark:text-slate-200 font-medium"><strong>{sq.label}</strong> {sq.questionText}</span>
                                      <span className="font-mono text-purple-600 dark:text-purple-400 font-bold ml-2">{sq.marks} Marks</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>

                            <td className="align-top py-3">
                              <div className="flex flex-col gap-1 text-[11px]">
                                {q.unit_name && (
                                  <span className="font-bold text-slate-700 dark:text-slate-300">
                                    🏢 Unit: {q.unit_name}
                                  </span>
                                )}
                                {q.topic && (
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    📚 Topic: {q.topic}
                                  </span>
                                )}
                                {(q.sub_topic_code || q.competency_code) && (
                                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 w-fit">
                                    🎯 Sub-Topic: {q.sub_topic_code || q.competency_code}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="align-top py-3 font-mono font-extrabold text-[#5B4BFF] text-xs">
                              {q.max_marks} Marks
                            </td>

                            <td className="align-top py-3 pr-4 text-right">
                              <button
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white transition-all border border-rose-500/30 text-xs font-bold"
                                title="Remove Question"
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
          {/* TAB 2: ADVANCED QUESTION DESIGN & SECTION BUILDER */}
          {/* ═════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'design' && (
            <div className="space-y-6">

              {/* Top Paper Metadata Header Card */}
              <div className="p-6 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 space-y-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7EAF3] dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-2">
                      <span>🛠️</span>
                      <span>Design New Assessment Test Paper</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Configure Paper Info, Build Multi-Type Sections (MCQs, DESC, Practical), and Filter & Select Questions
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="px-4 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4938DF] text-white font-extrabold text-xs shadow-md shadow-[#5B4BFF]/20 transition-all flex items-center gap-2"
                  >
                    <span>➕ Add New Section</span>
                  </button>
                </div>

                {/* Paper Basic Form Controls */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Paper Code *</label>
                    <input
                      type="text"
                      value={paperCode}
                      onChange={(e) => setPaperCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-[#5B4BFF]"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Exam Paper Title *</label>
                    <input
                      type="text"
                      value={paperTitle}
                      onChange={(e) => setPaperTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#5B4BFF]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Duration (Minutes) *</label>
                    <input
                      type="number"
                      value={paperDuration}
                      onChange={(e) => setPaperDuration(parseInt(e.target.value) || 60)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-[#5B4BFF]"
                    />
                  </div>
                </div>

                {/* 📊 Live Paper Sections Overview Badge Bar */}
                <div className="p-4 rounded-2xl bg-[#F6F8FC] dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-[#5B4BFF] tracking-wider">
                      📋 Paper Sections Overview & Auto Marks Calculation
                    </span>
                    <span className="font-mono text-xs font-extrabold text-[#F36C21]">
                      Total Paper Marks: {paperTotals.grandTotalMarks} Marks
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Section A: MCQs</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">{paperTotals.mcqCount} Qs ({paperTotals.mcqMarks} Marks)</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Section B: Descriptive</span>
                      <strong className="text-purple-600 dark:text-purple-400">{paperTotals.descCount} Qs ({paperTotals.descMarks} Marks)</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Section C: Practical</span>
                      <strong className="text-[#F36C21]">{paperTotals.practicalMarks} Marks (Lab & Viva)</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* ───────────────────────────────────────────────────────────────────────────── */}
              {/* DYNAMIC SECTIONS LIST: MCQs, DESC, PRACTICAL */}
              {/* ───────────────────────────────────────────────────────────────────────────── */}
              <div className="space-y-6">
                {sections.map((section, secIdx) => {
                  const sectionQuestions = section.selectedQuestions || [];
                  const sectionSubtotal = section.type === 'PRACTICAL'
                    ? (section.practicalComponents || []).reduce((acc, c) => acc + (Number(c.marks) || 0), 0)
                    : sectionQuestions.reduce((acc, q) => acc + (Number(q.marks) || 0), 0);

                  const availableQuestions = getFilteredQuestionsForSection(section);
                  const isAllSelectedInPicker = availableQuestions.length > 0 && availableQuestions.every(q => section.tempSelectedIds.includes(q.id));

                  const borderAccentColor =
                    section.type === 'MCQ'
                      ? 'border-l-[6px] border-l-[#5B4BFF]'
                      : section.type === 'DESC'
                        ? 'border-l-[6px] border-l-[#7867FF]'
                        : 'border-l-[6px] border-l-[#F36C21]';

                  return (
                    <div
                      key={section.id}
                      className={`p-6 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 space-y-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all ${borderAccentColor}`}
                    >
                      {/* Section Header Controls */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E7EAF3] dark:border-slate-800 pb-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-1 rounded-lg font-black text-xs font-mono uppercase ${
                                section.type === 'MCQ'
                                  ? 'bg-[#5B4BFF]/10 text-[#5B4BFF]'
                                  : section.type === 'DESC'
                                    ? 'bg-purple-600/10 text-purple-600 dark:text-purple-400'
                                    : 'bg-[#F36C21]/10 text-[#F36C21]'
                              }`}
                            >
                              Section #{secIdx + 1}: {section.type}
                            </span>
                            <input
                              type="text"
                              value={section.title}
                              onChange={(e) => handleUpdateSectionField(section.id, 'title', e.target.value)}
                              className="font-black text-sm text-slate-900 dark:text-white bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] flex-1"
                            />
                          </div>

                          <input
                            type="text"
                            value={section.instructions}
                            onChange={(e) => handleUpdateSectionField(section.id, 'instructions', e.target.value)}
                            placeholder="Section instructions (e.g. Answer all questions. Each question carries specified marks)"
                            className="w-full text-xs text-slate-500 dark:text-slate-400 bg-transparent border-b border-transparent hover:border-slate-300 focus:outline-none focus:border-[#5B4BFF]"
                          />
                        </div>

                        {/* Mode Switch & Remove Section */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center gap-1 p-1 bg-[#F6F8FC] dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
                            <button
                              type="button"
                              onClick={() => handleUpdateSectionField(section.id, 'type', 'MCQ')}
                              className={`px-3 py-1.5 rounded-lg transition-all ${
                                section.type === 'MCQ'
                                  ? 'bg-[#5B4BFF] text-white shadow-sm font-extrabold'
                                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              🔘 MCQs
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateSectionField(section.id, 'type', 'DESC')}
                              className={`px-3 py-1.5 rounded-lg transition-all ${
                                section.type === 'DESC'
                                  ? 'bg-[#7867FF] text-white shadow-sm font-extrabold'
                                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              📄 DESC
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateSectionField(section.id, 'type', 'PRACTICAL')}
                              className={`px-3 py-1.5 rounded-lg transition-all ${
                                section.type === 'PRACTICAL'
                                  ? 'bg-[#F36C21] text-white shadow-sm font-extrabold'
                                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              🧪 Practical / Lab
                            </button>
                          </div>

                          {sections.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSection(section.id)}
                              className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 text-xs font-bold transition-all"
                              title="Delete Section"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>

                      {/* ═════════════════════════════════════════════════════════════════════ */}
                      {/* CASE 1 & 2: THEORY SECTION (MCQ / DESC) QUESTION PICKER & LEDGER */}
                      {/* ═════════════════════════════════════════════════════════════════════ */}
                      {(section.type === 'MCQ' || section.type === 'DESC') && (
                        <div className="space-y-4">
                          {/* Section Ledger Header Bar */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-[#F6F8FC] dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                📋 Section Theory Ledger:
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-[#5B4BFF]/10 text-[#5B4BFF] border border-[#5B4BFF]/20">
                                {sectionQuestions.length} Questions Selected
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                Total: {sectionSubtotal} Marks
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleUpdateSectionField(section.id, 'isPickerOpen', !section.isPickerOpen)}
                              className="px-3.5 py-1.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4938DF] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                            >
                              <span>{section.isPickerOpen ? '🔼 Close Question Picker' : '🔽 + Pick Questions (Unit / Topic / Sub-Topic)'}</span>
                            </button>
                          </div>

                          {/* 🎯 QUESTION PICKER DRAWER with Unit -> Topic -> Sub-Topic Filter & Auto Select */}
                          {section.isPickerOpen && (
                            <div className="p-5 rounded-2xl bg-[#F6F8FC] dark:bg-slate-900/90 border-2 border-[#5B4BFF]/40 space-y-4 shadow-sm">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                                <span className="text-xs font-black uppercase text-[#5B4BFF] tracking-wider flex items-center gap-1.5">
                                  <span>🔍</span> Select {section.type} Questions ({availableQuestions.length} Matching Questions in Bank)
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleSelectAllInPicker(section.id)}
                                    className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-[#5B4BFF] hover:bg-[#5B4BFF] hover:text-white border border-[#5B4BFF]/30 text-xs font-extrabold transition-all"
                                  >
                                    {isAllSelectedInPicker ? '❌ Deselect All' : '⚡ Auto Complete / Select All'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleAddSelectedQuestionsToSection(section.id)}
                                    disabled={section.tempSelectedIds.length === 0}
                                    className={`px-3.5 py-1.5 rounded-lg text-white text-xs font-extrabold shadow-sm transition-all ${
                                      section.tempSelectedIds.length > 0
                                        ? 'bg-[#5B4BFF] hover:bg-[#4938DF]'
                                        : 'bg-slate-400 opacity-50 cursor-not-allowed'
                                    }`}
                                  >
                                    ➕ Add Selected ({section.tempSelectedIds.length}) to Section
                                  </button>
                                </div>
                              </div>

                              {/* 3-Tier Cascading Filter in Picker */}
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                                <div>
                                  <label className="block text-[10px] font-extrabold uppercase text-[#5B4BFF] mb-1">
                                    Filter Unit
                                  </label>
                                  <select
                                    value={section.filterUnit}
                                    onChange={(e) => handleUpdateSectionField(section.id, 'filterUnit', e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                                  >
                                    <option value="all">All Units</option>
                                    {allUnits.map(u => (
                                      <option key={u.id} value={u.code || u.name}>{u.name} ({u.code})</option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-extrabold uppercase text-[#F36C21] mb-1">
                                    Filter Topic
                                  </label>
                                  <select
                                    value={section.filterTopic}
                                    onChange={(e) => handleUpdateSectionField(section.id, 'filterTopic', e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                                  >
                                    <option value="all">All Topics</option>
                                    {dbTopics.map(t => (
                                      <option key={t.id} value={t.name}>{t.name}</option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 mb-1">
                                    Filter Sub-Topic
                                  </label>
                                  <select
                                    value={section.filterSubTopic}
                                    onChange={(e) => handleUpdateSectionField(section.id, 'filterSubTopic', e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                                  >
                                    <option value="all">All Sub Topics</option>
                                    {dbSubTopics.map(s => (
                                      <option key={s.id || s.code} value={s.code}>
                                        {s.code} — {s.description || s.name || 'Sub-Topic'}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-400 mb-1">
                                    Search Prompt
                                  </label>
                                  <input
                                    type="text"
                                    value={section.searchQuery}
                                    onChange={(e) => handleUpdateSectionField(section.id, 'searchQuery', e.target.value)}
                                    placeholder="🔍 Search..."
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                                  />
                                </div>
                              </div>

                              {/* Available Questions List with Checkboxes (Bounded Scroll Container) */}
                              <div className="max-h-56 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-2 text-xs">
                                {availableQuestions.length === 0 ? (
                                  <p className="py-6 text-center text-slate-400">No {section.type} questions match the selected filters.</p>
                                ) : (
                                  availableQuestions.map((q) => {
                                    const isChecked = section.tempSelectedIds.includes(q.id);
                                    const isAlreadyAdded = section.selectedQuestions.some(sq => sq.questionId === q.id);

                                    return (
                                      <div
                                        key={q.id}
                                        onClick={() => !isAlreadyAdded && handleToggleQuestionInPicker(section.id, q.id)}
                                        className={`p-2.5 flex items-start gap-3 rounded-lg transition-colors cursor-pointer ${
                                          isAlreadyAdded ? 'opacity-50 bg-slate-50 dark:bg-slate-900/50 cursor-not-allowed' :
                                          isChecked ? 'bg-indigo-50 dark:bg-indigo-950/40' : 'hover:bg-slate-50 dark:hover:bg-slate-900'
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isChecked || isAlreadyAdded}
                                          disabled={isAlreadyAdded}
                                          onChange={() => {}}
                                          className="mt-0.5 rounded text-[#5B4BFF] focus:ring-0 cursor-pointer"
                                        />
                                        <div className="flex-1 space-y-1">
                                          <p className="font-bold text-slate-900 dark:text-white leading-snug">{q.question_text}</p>
                                          <div className="flex items-center gap-2 text-[10px]">
                                            <span className="px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                              🎯 {q.sub_topic_code || q.competency_code}
                                            </span>
                                            {q.topic && <span className="text-slate-500">📚 {q.topic}</span>}
                                            <span className="font-mono text-[#5B4BFF] font-extrabold ml-auto">{q.max_marks || 1} Marks</span>
                                            {isAlreadyAdded && <span className="text-slate-400 font-bold">(Added)</span>}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          )}

                          {/* 📋 Selected Questions in this Section with Editable Marks (Bounded Scroll Container - max-h-80) */}
                          {sectionQuestions.length === 0 ? (
                            <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20">
                              ℹ️ No questions added to this section yet. Click <strong>&quot;🔽 + Pick Questions (Unit / Topic / Sub-Topic)&quot;</strong> above to select!
                            </div>
                          ) : (
                            <div className="max-h-80 overflow-y-auto pr-1 space-y-2.5">
                              {sectionQuestions.map((q, qIdx) => (
                                <div
                                  key={q.questionId || qIdx}
                                  className="p-3.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-[#5B4BFF]/40 transition-all shadow-sm"
                                >
                                  <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-[#5B4BFF]/10 text-[#5B4BFF] shrink-0">
                                      Q{qIdx + 1}
                                    </span>
                                    <div className="space-y-1 flex-1 min-w-0">
                                      <p className="font-bold text-slate-900 dark:text-white leading-snug truncate">
                                        {q.questionText}
                                      </p>
                                      {/* MCQ 4 Options Preview */}
                                      {q.mode === 'MCQ' && (
                                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] pt-0.5 text-slate-600 dark:text-slate-400">
                                          <span className="truncate">A) {q.option_a}</span>
                                          <span className="truncate">B) {q.option_b}</span>
                                          <span className="truncate">C) {q.option_c}</span>
                                          <span className="truncate">D) {q.option_d}</span>
                                        </div>
                                      )}
                                      {/* DESC Sub-questions preview */}
                                      {q.mode === 'DESC' && q.sub_questions && Array.isArray(q.sub_questions) && (
                                        <div className="text-[11px] text-purple-600 dark:text-purple-400 flex flex-wrap gap-2 pt-0.5">
                                          {q.sub_questions.map((sq, sIdx) => (
                                            <span key={sIdx} className="inline-block bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-500/20">
                                              <strong>{sq.label}</strong> {sq.questionText} ({sq.marks}M)
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      <div className="flex items-center gap-2 text-[10px] pt-0.5">
                                        <span className="px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                          🎯 {q.sub_topic_code || q.competency_code}
                                        </span>
                                        {q.topic && <span className="text-slate-500 truncate">📚 {q.topic}</span>}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right-Side Editable Marks & Remove Question */}
                                  <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm">
                                      <span className="text-[11px] font-extrabold uppercase text-slate-500">Marks:</span>
                                      <input
                                        type="number"
                                        step="0.5"
                                        value={q.marks}
                                        onChange={(e) => handleUpdateQuestionMarks(section.id, q.questionId, parseFloat(e.target.value) || 0)}
                                        className="w-14 text-xs font-mono font-black text-[#5B4BFF] bg-transparent focus:outline-none text-right"
                                      />
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleRemoveQuestionFromSection(section.id, q.questionId)}
                                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 text-xs font-bold transition-all"
                                      title="Remove from Section"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ═════════════════════════════════════════════════════════════════════ */}
                      {/* CASE 3: PRACTICAL / CLINICAL MARKS COMPONENT (LAST STEP) */}
                      {/* ═════════════════════════════════════════════════════════════════════ */}
                      {section.type === 'PRACTICAL' && (
                        <div className="space-y-4 p-5 rounded-2xl bg-orange-500/5 border border-orange-500/20">
                          <div className="flex items-center justify-between border-b border-orange-500/20 pb-3">
                            <div>
                              <h4 className="text-xs font-black uppercase text-[#F36C21] tracking-wider">
                                🧪 Practical Assessment Rubrics & Component Marks Breakdown
                              </h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Configure Lab Performance, Viva Voce, Record Book & Internal Assessment marks
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddPracticalComponent(section.id)}
                              className="px-3 py-1.5 rounded-lg bg-[#F36C21] text-white font-extrabold text-xs shadow-sm hover:bg-[#d95c16] transition-all"
                            >
                              ➕ Add Component
                            </button>
                          </div>

                          <div className="space-y-2.5">
                            {(section.practicalComponents || []).map((comp) => (
                              <div
                                key={comp.id}
                                className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                              >
                                <input
                                  type="text"
                                  value={comp.name}
                                  onChange={(e) => handleUpdatePracticalComponent(section.id, comp.id, 'name', e.target.value)}
                                  className="font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:outline-none focus:border-[#F36C21] flex-1"
                                />

                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700">
                                    <span className="text-[11px] font-bold text-slate-500">Marks:</span>
                                    <input
                                      type="number"
                                      value={comp.marks}
                                      onChange={(e) => handleUpdatePracticalComponent(section.id, comp.id, 'marks', parseFloat(e.target.value) || 0)}
                                      className="w-14 text-xs font-mono font-extrabold text-[#F36C21] bg-transparent focus:outline-none text-right"
                                    />
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleRemovePracticalComponent(section.id, comp.id)}
                                    className="text-slate-400 hover:text-rose-500 text-sm font-bold"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between pt-2 text-xs font-extrabold text-[#F36C21]">
                            <span>Subtotal Practical Marks:</span>
                            <span className="font-mono text-sm">{sectionSubtotal} Marks</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Final Action Bar */}
              <div className="p-6 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Final Paper Summary: {paperTotals.grandTotalMarks} Marks ({paperTotals.mcqCount + paperTotals.descCount} Questions + Practical)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Duration: {paperDuration} Mins | Passing: {paperPassingMarks} Marks
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    ➕ Add Section
                  </button>

                  <button
                    type="button"
                    onClick={handleSavePaperDesign}
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4938DF] text-white text-xs font-black shadow-md shadow-[#5B4BFF]/20 transition-all flex items-center gap-2"
                  >
                    {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    <span>💾 Save Paper Design & Proceed to Publish</span>
                  </button>
                </div>
              </div>

              {/* Designed Papers Ledger */}
              <div className="p-6 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider">
                  📋 Designed Exam Papers ({designedPapers.length})
                </h3>
                <div className="divide-y divide-[#E7EAF3] dark:divide-slate-800 text-xs">
                  {designedPapers.length === 0 ? (
                    <p className="py-8 text-center text-slate-400 font-medium">No exam papers designed yet.</p>
                  ) : (
                    designedPapers.map((dp) => (
                      <div key={dp.id} className="py-3 flex items-center justify-between">
                        <div>
                          <span className="font-mono text-[#5B4BFF] font-extrabold mr-2">[{dp.code}]</span>
                          <strong className="text-slate-900 dark:text-white">{dp.name}</strong>
                          <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                            Duration: {dp.duration_minutes || dp.duration || 60} mins | Total Marks: {dp.max_marks || dp.maxMarks || 40}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 text-[10px]">
                            {dp.status || 'READY'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setPaperCode(dp.code);
                              setPaperTitle(dp.name);
                              setActiveTab('publish');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#5B4BFF] text-white font-bold text-[10px]"
                          >
                            🚀 Publish
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════════════ */}
          {/* TAB 3: PUBLISH */}
          {/* ═════════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'publish' && (
            <div className="space-y-6">
              <div className="p-6 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 space-y-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                <div className="border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider">
                    🚀 Publish & Schedule Examination Paper
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Target batch, schedule date/time, and publish exam to student portal
                  </p>
                </div>

                <form onSubmit={handlePublishExam} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Select Designed Paper *</label>
                      <select
                        value={paperCode}
                        onChange={(e) => setPaperCode(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#5B4BFF] font-bold"
                      >
                        {designedPapers.map(p => (
                          <option key={p.id} value={p.code}>{p.name} [{p.code}]</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Filter by Course (Course Master)
                      </label>
                      <select
                        value={publishSelectedCourse}
                        onChange={(e) => setPublishSelectedCourse(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#5B4BFF] font-bold"
                      >
                        <option value="all">All Courses in this College ({collegeCourses.length} Courses)</option>
                        {collegeCourses.map((c) => (
                          <option key={c.id || c.code} value={c.course_cd || c.code}>
                            {c.name} ({c.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Target Batch (Batch Master) *
                      </label>
                      <select
                        value={publishTargetBatch}
                        onChange={(e) => setPublishTargetBatch(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-[#5B4BFF]"
                        required
                      >
                        <option value="">-- Select Target Batch ({availablePublishBatches.length} Available) --</option>
                        {availablePublishBatches.map((b) => {
                          const val = `${b.name || `Batch ${b.year}`} [${b.code}]`;
                          return (
                            <option key={b.id || b.code} value={val}>
                              {b.name || `Batch ${b.year}`} — {b.course_name || 'Course'} [{b.code}]
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Exam Date *</label>
                      <input
                        type="date"
                        value={publishDate}
                        onChange={(e) => setPublishDate(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-[#5B4BFF]"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Start Time</label>
                        <input
                          type="time"
                          value={publishStartTime}
                          onChange={(e) => setPublishStartTime(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-[#5B4BFF]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">End Time</label>
                        <input
                          type="time"
                          value={publishEndTime}
                          onChange={(e) => setPublishEndTime(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-[#5B4BFF]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
                    >
                      <span>🚀</span> Publish Exam & Notify Students
                    </button>
                  </div>
                </form>
              </div>

              {/* Published Exams Ledger */}
              <div className="p-6 rounded-[22px] bg-white dark:bg-[#1B1E28] border border-[#E7EAF3] dark:border-slate-800 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider">
                  📢 Published Examinations Ledger ({publishedExams.length})
                </h3>
                <div className="divide-y divide-[#E7EAF3] dark:divide-slate-800 text-xs">
                  {publishedExams.length === 0 ? (
                    <p className="py-8 text-center text-slate-400 font-medium">No examinations published yet.</p>
                  ) : (
                    publishedExams.map((ex) => (
                      <div key={ex.id} className="py-3 flex items-center justify-between">
                        <div>
                          <strong className="text-slate-900 dark:text-white">{ex.paperName}</strong>
                          <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                            Batch: <span className="text-[#5B4BFF] font-bold">{ex.batch}</span> | Date: {ex.date} | Time: {ex.time}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold border border-emerald-500/20 text-[10px] uppercase">
                          {ex.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
