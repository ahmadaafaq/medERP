'use client';

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import FacultyAcademicCascadingDropdown, {
  AcademicCascadingState,
} from '../../../../components/faculty/FacultyAcademicCascadingDropdown';
import QuestionPaperReviewModal from '../../../../components/exam/QuestionPaperReviewModal';
import ImagePreviewModal from '../../../../components/exam/ImagePreviewModal';
import {
  PaperStatus,
  QuestionType,
  OverAttemptPolicy,
  MarksMode,
  ChoiceGroup,
  PaperSnapshot,
  QuestionDefinition,
  computeEffectiveMax,
  computePaperScore,
} from '@mederp/shared';
import ChoiceGroupManager from '../../../../components/exam/ChoiceGroupManager';
import PaperBlueprintModal from '../../../../components/exam/PaperBlueprintModal';
import PaperLiveScoringPreviewModal from '../../../../components/exam/PaperLiveScoringPreviewModal';
import PaperVersionDiffModal from '../../../../components/exam/PaperVersionDiffModal';

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
  topic_code?: string;
  unit_id?: string;
  unit_code?: string;
  unit_name?: string;
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
  image_url?: string;
  imageUrl?: string;
  has_sub_questions?: boolean;
  sub_questions?: SubQuestion[];
  max_marks?: number;
  is_active?: boolean;
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
  mst_sub_name?: string;
}

interface UnitItem {
  id: string;
  name: string;
  code: string;
  subject_id?: string;
  subject_code?: string;
  bloom_level?: string;
}

interface TopicItem {
  id: string;
  name: string;
  code: string;
  unit_id?: string;
  unit_code?: string;
  unit_name?: string;
  subject_id?: string;
  subject_name?: string;
  subject_code?: string;
}

interface CompetencyItem {
  id: string;
  code: string;
  description: string;
  name?: string;
  topic_id?: string;
  topic_code?: string;
  topic_name?: string;
  unit_id?: string;
  unit_code?: string;
  subject_id?: string;
  subject_code?: string;
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

// Dynamic syllabus units generator tailored to any subject (Standard CO1 to CO5)
function generateSyllabusUnits(code: string, name: string): UnitItem[] {
  const n = (name || '').toLowerCase();
  const c = (code || '').trim().toLowerCase();

  // 1. Data Analytics / Lifecycle (88622)
  if (c.includes('88622') || n.includes('data analytics') || n.includes('analytics') || n.includes('lifecycle')) {
    return [
      { id: 'CO1', code: 'CO1', name: 'CO1: Discuss various concepts of data analytics pipeline' },
      { id: 'CO2', code: 'CO2', name: 'CO2: Apply classification and regression techniques' },
      { id: 'CO3', code: 'CO3', name: 'CO3: Explain and apply mining techniques on streaming data' },
      { id: 'CO4', code: 'CO4', name: 'CO4: Compare different clustering and frequent pattern mining algorithms' },
      { id: 'CO5', code: 'CO5', name: 'CO5: Describe the concept of R programming and implement analytics on Big data using R' },
    ];
  }

  // 2. Universal Human Values & Professional Ethics
  if (c === '88536' || n.includes('human value') || n.includes('ethics') || n.includes('values')) {
    return [
      { id: 'CO1', code: 'CO1', name: 'CO1: Introduction to Value Education & Self Exploration' },
      { id: 'CO2', code: 'CO2', name: 'CO2: Harmony in the Human Being - Understanding Myself' },
      { id: 'CO3', code: 'CO3', name: 'CO3: Harmony in the Family and Society - Relationship & Trust' },
      { id: 'CO4', code: 'CO4', name: 'CO4: Harmony in Nature & Existence - Whole Existence as Co-existence' },
      { id: 'CO5', code: 'CO5', name: 'CO5: Implications of Holistic Understanding - Professional Ethics' },
    ];
  }

  // 3. Computer Organization & Architecture
  if (c === '88535' || n.includes('computer organization') || n.includes('architecture')) {
    return [
      { id: 'CO1', code: 'CO1', name: 'CO1: Introduction to Computer System, Data Representation & Logic' },
      { id: 'CO2', code: 'CO2', name: 'CO2: Central Processing Unit & Instruction Cycle' },
      { id: 'CO3', code: 'CO3', name: 'CO3: Memory Hierarchy, Cache Memory & Virtual Memory' },
      { id: 'CO4', code: 'CO4', name: 'CO4: Input-Output Organization & DMA Controllers' },
      { id: 'CO5', code: 'CO5', name: 'CO5: Pipelining, Instruction Hazards & Parallel Processing' },
    ];
  }

  // 4. Web Technology & Front End Development
  if (c === '88534' || c === '88539' || c === '88541' || n.includes('web') || n.includes('front end') || n.includes('html') || n.includes('css')) {
    return [
      { id: 'CO1', code: 'CO1', name: 'CO1: Fundamentals of Web Architecture, HTML5 & CSS3 Styling' },
      { id: 'CO2', code: 'CO2', name: 'CO2: JavaScript Essentials, DOM Manipulation & Event Handling' },
      { id: 'CO3', code: 'CO3', name: 'CO3: Responsive Layouts, Flexbox, Grid & UI Components' },
      { id: 'CO4', code: 'CO4', name: 'CO4: Client-Server Architecture, REST APIs & Asynchronous JS' },
      { id: 'CO5', code: 'CO5', name: 'CO5: Full Stack Integration, Web Security & Project Deployment' },
    ];
  }

  // 5. Object Oriented Programming in C++ / Java
  if (c === '88532' || c === '88538' || n.includes('c++') || n.includes('java') || n.includes('object oriented')) {
    return [
      { id: 'CO1', code: 'CO1', name: 'CO1: Principles of OOP, Data Types & Control Structures' },
      { id: 'CO2', code: 'CO2', name: 'CO2: Classes, Objects, Constructors & Destructors' },
      { id: 'CO3', code: 'CO3', name: 'CO3: Operator Overloading & Type Conversion Mechanisms' },
      { id: 'CO4', code: 'CO4', name: 'CO4: Inheritance, Virtual Functions & Dynamic Polymorphism' },
      { id: 'CO5', code: 'CO5', name: 'CO5: Templates, Exception Handling & File Stream I/O' },
    ];
  }

  // 6. Operating System
  if (c === '88537' || c === '87665' || c === '87659' || n.includes('operating system') || n.includes('os')) {
    return [
      { id: 'CO1', code: 'CO1', name: 'CO1: Introduction to Operating Systems & System Structures' },
      { id: 'CO2', code: 'CO2', name: 'CO2: Process Management, Threads & CPU Scheduling Algorithms' },
      { id: 'CO3', code: 'CO3', name: 'CO3: Process Synchronization, Semaphores & Deadlock Handling' },
      { id: 'CO4', code: 'CO4', name: 'CO4: Memory Management, Paging, Segmentation & Virtual Memory' },
      { id: 'CO5', code: 'CO5', name: 'CO5: Storage Management, File Systems & Disk Scheduling' },
    ];
  }

  // 7. Practical / Lab
  if (n.includes('lab') || n.includes('workshop') || n.includes('practical')) {
    return [
      { id: 'CO1', code: 'CO1', name: 'CO1: Environment Setup, Tool Configuration & Foundation' },
      { id: 'CO2', code: 'CO2', name: 'CO2: Implementation of Core Algorithmic Techniques' },
      { id: 'CO3', code: 'CO3', name: 'CO3: Intermediate Problem Solving & Module Testing' },
      { id: 'CO4', code: 'CO4', name: 'CO4: Complex Application Scenarios & Mini-Project Build' },
      { id: 'CO5', code: 'CO5', name: 'CO5: Viva Voce, Practical Evaluation & Code Optimization' },
    ];
  }

  // Default dynamic Course Outcomes (CO1 to CO5)
  return [
    { id: 'CO1', code: 'CO1', name: `CO1: ${name || 'Subject'} - Fundamental Concepts & Architecture` },
    { id: 'CO2', code: 'CO2', name: `CO2: ${name || 'Subject'} - Core Methodologies & Mechanics` },
    { id: 'CO3', code: 'CO3', name: `CO3: ${name || 'Subject'} - Analytical Formulation & Design` },
    { id: 'CO4', code: 'CO4', name: `CO4: ${name || 'Subject'} - Practical Applications & Case Studies` },
    { id: 'CO5', code: 'CO5', name: `CO5: ${name || 'Subject'} - Advanced Trends, Assessment & Review` },
  ];
}

function generateSyllabusTopics(unitCode: string, unitName: string, subjectCode: string, subjectName?: string): TopicItem[] {
  const cleanU = unitCode.replace(/\s+/g, '');
  const prefix = subjectCode ? `${subjectCode}-${cleanU}` : cleanU;
  return [
    {
      id: `${prefix}-T01`,
      code: `${prefix}-T01`,
      name: `${unitCode}: Conceptual Foundations & Core Principles`,
      unit_code: unitCode,
      subject_code: subjectCode,
    },
    {
      id: `${prefix}-T02`,
      code: `${prefix}-T02`,
      name: `${unitCode}: Detailed Architecture, Modeling & Implementation`,
      unit_code: unitCode,
      subject_code: subjectCode,
    },
    {
      id: `${prefix}-T03`,
      code: `${prefix}-T03`,
      name: `${unitCode}: Applied Case Studies, Optimization & Evaluation`,
      unit_code: unitCode,
      subject_code: subjectCode,
    },
  ];
}

function generateSyllabusSubtopics(topicCode: string, topicName?: string): CompetencyItem[] {
  return [
    {
      id: `${topicCode}-ST01`,
      code: `${topicCode}-ST01`,
      description: `Need, principles, key roles & definitions for ${topicName || 'topic'}`,
    },
    {
      id: `${topicCode}-ST02`,
      code: `${topicCode}-ST02`,
      description: `Analytical modeling, design patterns & operational workflow`,
    },
    {
      id: `${topicCode}-ST03`,
      code: `${topicCode}-ST03`,
      description: `Case study analysis, testing, edge cases & performance review`,
    },
  ];
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

export default function FacultyAssessmentMasterPage() {
  const [activeTab, setActiveTab] = useState<'bank' | 'design' | 'publish'>('bank');

  // Tenant from session — no manual college selection
  const [tenantName, setTenantName] = useState<string>('');

  // Image Preview Modal State
  const [viewingImageModal, setViewingImageModal] = useState<{ src: string; title?: string } | null>(null);

  // Faculty Context Profile State
  const [facultyDeptName, setFacultyDeptName] = useState<string>('');

  // All master data from Admin-Master & College-Master APIs
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [allUnits, setAllUnits] = useState<UnitItem[]>([]);
  const [allLinkers, setAllLinkers] = useState<ProfessionalLinker[]>([]);
  const [collegeProfessionals, setCollegeProfessionals] = useState<CollegeProfessional[]>([]);
  const [dbTopics, setDbTopics] = useState<TopicItem[]>([]);
  const [dbCompetencies, setDbCompetencies] = useState<CompetencyItem[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);

  // Cascade selections — strictly from Master data
  const [academicCascade, setAcademicCascade] = useState<AcademicCascadingState | null>(null);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedCbmeYear, setSelectedCbmeYear] = useState<string>('');
  const [selectedProfPhase, setSelectedProfPhase] = useState<string>('');

  // ─── Units -> Topic -> Sub Topics Hierarchy State ───
  const [availableUnits, setAvailableUnits] = useState<UnitItem[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [selectedUnitCode, setSelectedUnitCode] = useState<string>('');
  const [selectedUnitName, setSelectedUnitName] = useState<string>('');
  const [loadingUnits, setLoadingUnits] = useState<boolean>(false);

  const [availableTopics, setAvailableTopics] = useState<TopicItem[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [selectedTopicCode, setSelectedTopicCode] = useState<string>('');
  const [selectedTopicName, setSelectedTopicName] = useState<string>('');
  const [loadingTopics, setLoadingTopics] = useState<boolean>(false);

  const [availableCompetencies, setAvailableCompetencies] = useState<CompetencyItem[]>([]);
  const [selectedCompetencyId, setSelectedCompetencyId] = useState<string>('');
  const [selectedCompetencyCode, setSelectedCompetencyCode] = useState<string>('');
  const [selectedCompetencyDesc, setSelectedCompetencyDesc] = useState<string>('');
  const [loadingCompetencies, setLoadingCompetencies] = useState<boolean>(false);

  const handleAcademicCascadeChange = (state: AcademicCascadingState) => {
    setAcademicCascade(state);
    if (state.college) {
      setTenantName(state.college.colg_name);
    }
    const branchCd = state.branch?.branch_cd || '';
    const courseCd = state.course?.course_cd || '';
    const courseName = (state.course?.course_name || '').toLowerCase();

    // Match department accurately from loaded departments
    const matchedDept = departments.find(d => 
      (branchCd && (d.code === String(branchCd) || d.name.toLowerCase() === String(branchCd).toLowerCase())) ||
      (courseCd && (d.code === String(courseCd) || d.name.toLowerCase() === String(courseCd).toLowerCase())) ||
      (courseName.includes('bba') && (d.code === '2' || d.name.toLowerCase().includes('bba')))
    );
    if (matchedDept) {
      setSelectedDept(matchedDept.id);
      setFacultyDeptName(matchedDept.name);
    } else if (state.branch) {
      setSelectedDept(state.branch.branch_cd);
      setFacultyDeptName(state.branch.branch_name);
    }

    if (state.subject) {
      const sub = state.subject;
      setSelectedSubject(sub.code || sub.id);
      // Auto-generate Paper Title and Code as per subject by default for new papers (faculty can still customize)
      if (!editingPaperId) {
        const subName = sub.name || sub.mst_sub_name || 'Subject';
        const subCode = (sub.code || sub.sub_cd || (sub as any).mst_sub_cd || 'EXAM').replace(/[^a-zA-Z0-9]/g, '');
        const currentYear = new Date().getFullYear();
        setPaperTitle((prev) => {
          if (!prev || prev.includes('Examination') || prev.startsWith('Subject') || prev.trim() === '') {
            return `${subName} Examination ${currentYear}`;
          }
          return prev;
        });
        setPaperCode((prev) => {
          if (!prev || prev.startsWith('EXAM-') || /^[A-Z0-9]+-\d{4}-T\d+$/i.test(prev) || prev.trim() === '') {
            const paperCount = createdPapersList.length + 1;
            return `${subCode}-${currentYear}-T${paperCount}`;
          }
          return prev;
        });
      }
    }
    if (state.semester) {
      setSelectedProfPhase(state.semester.SemName || state.semester.name);
    }
  };

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

  // Question Image Upload State
  const [questionImage, setQuestionImage] = useState<string>('');
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setAlert({ type: 'error', message: 'Image size must be less than 5MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setQuestionImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Question Ledger & Filter State
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTopic, setFilterTopic] = useState<string>('all');
  const [filterCompetency, setFilterCompetency] = useState<string>('all');
  const [editingBankQuestionId, setEditingBankQuestionId] = useState<string | null>(null);
  const [bankStatusFilter, setBankStatusFilter] = useState<'active' | 'archived' | 'all'>('active');

  // Section Question In-place Editing State (gives faculty full rights to edit question prompt, options & weightage)
  const [editingSectionQuestion, setEditingSectionQuestion] = useState<{
    secId: string;
    qId: string;
    questionText: string;
    customMarks: number;
    subQuestions: any[];
    optionA?: string;
    optionB?: string;
    optionC?: string;
    optionD?: string;
    correctOption?: string;
    imageUrl?: string;
    mode?: string;
  } | null>(null);

  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Tab 2 & 3 States
  const [paperType, setPaperType] = useState<'THEORY' | 'PRACTICAL'>('THEORY');
  const [paperTitle, setPaperTitle] = useState('');
  const [paperCode, setPaperCode] = useState('');
  const [paperDuration, setPaperDuration] = useState<number | ''>('');
  const [paperTotalMarks, setPaperTotalMarks] = useState<number | ''>('');
  const [paperSet, setPaperSet] = useState<string>('Set A');
  const [targetSections, setTargetSections] = useState<string[]>(['All']);
  const [designedPapers, setDesignedPapers] = useState<any[]>([]);

  // Pending custom marks and subquestion marks in question bank drawer before adding
  const [pickerTotalMarks, setPickerTotalMarks] = useState<Record<string, number>>({});
  const [pickerSubMarks, setPickerSubMarks] = useState<Record<string, Record<string, number>>>({});

  // Dynamic Paper Sections State (all inputs start blank)
  const [paperSections, setPaperSections] = useState<any[]>([
    {
      id: 'sec-1',
      name: 'Section A',
      type: 'DESC',
      description: '',
      questions: [],
      practicalMarks: 0,
      marksCondition: 'VARIABLE',
      attemptRule: 'ALL',
      targetQuestionsCount: '',
      requiredToAttempt: '',
      overAttemptPolicy: OverAttemptPolicy.BEST_N,
      ruleMaxPolicy: 'EQUAL_MARKS_REQUIRED',
      defaultMarksPerQuestion: '',
      choiceGroups: [],
    }
  ]);
  const [secQuestionPick, setSecQuestionPick] = useState<{ [secId: string]: string }>({});
  const [secGroupSelect, setSecGroupSelect] = useState<{ [secId: string]: string[] }>({});
  const [blueprintModalSecId, setBlueprintModalSecId] = useState<string | null>(null);
  const [showScoringSimulation, setShowScoringSimulation] = useState<boolean>(false);
  const [diffModalPaper, setDiffModalPaper] = useState<{ current: any; previous: any } | null>(null);
  const [editingPaperId, setEditingPaperId] = useState<string | null>(null);

  // Map of all questions in the paper for pure scoring engine
  const allPaperQuestionsMap = useMemo<Record<string, QuestionDefinition>>(() => {
    const map: Record<string, QuestionDefinition> = {};
    paperSections.forEach(sec => {
      (sec.questions || []).forEach((q: any) => {
        const qId = q.questionId || q.id;
        const subQs = q.subQuestions || q.sub_questions || [];
        let marks = 0;
        if (subQs.length > 0) {
          marks = subQs.reduce((sum: number, sq: any) => sum + Number(sq.marks || sq.customMarks || 0), 0);
        } else {
          marks = Number(q.customMarks || q.defaultMarks || (sec.defaultMarksPerQuestion ? Number(sec.defaultMarksPerQuestion) : 5));
        }
        map[qId] = {
          id: qId,
          text: q.questionText || q.text || '',
          type: q.mode === 'MCQ' ? QuestionType.MCQ_SINGLE : QuestionType.SHORT_ANSWER,
          marks,
        };
      });
    });
    return map;
  }, [paperSections]);

  // Reactive Effective Max calculation (Choice N of M takes top-N, All Mandatory takes all)
  const computedEffectiveMax = useMemo(() => {
    let total = 0;
    paperSections.forEach(sec => {
      const isChoice = sec.attemptRule === 'CHOICE';
      const secQs = sec.questions || [];
      if (secQs.length > 0) {
        const marksList = secQs.map((q: any) => {
          const subQs = q.subQuestions || q.sub_questions || [];
          if (subQs.length > 0) {
            return subQs.reduce((sum: number, sq: any) => sum + Number(sq.marks || sq.customMarks || 0), 0);
          }
          return Number(q.customMarks || q.defaultMarks || (sec.defaultMarksPerQuestion ? Number(sec.defaultMarksPerQuestion) : 0));
        });
        marksList.sort((a: number, b: number) => b - a);
        if (isChoice) {
          const rawN = sec.requiredToAttempt;
          const reqN = rawN !== '' && rawN !== undefined && rawN !== null ? Number(rawN) : (secQs.length > 1 ? secQs.length - 1 : 1);
          const topN = marksList.slice(0, Math.min(reqN, marksList.length));
          total += topN.reduce((sum: number, val: number) => sum + val, 0);
        } else {
          // All Mandatory: count all questions added
          total += marksList.reduce((sum: number, val: number) => sum + val, 0);
        }
      } else {
        // If questions are not yet added, use planned count if entered
        const rawM = sec.targetQuestionsCount;
        const rawN = sec.requiredToAttempt;
        const rawDefaultMarks = sec.defaultMarksPerQuestion;
        const m = rawM !== '' && rawM !== undefined && rawM !== null ? Number(rawM) : 0;
        const n = rawN !== '' && rawN !== undefined && rawN !== null ? Number(rawN) : (m > 1 ? m - 1 : m);
        const marksPerQ = rawDefaultMarks !== '' && rawDefaultMarks !== undefined && rawDefaultMarks !== null ? Number(rawDefaultMarks) : 0;
        if (isChoice && n > 0 && marksPerQ > 0) {
          total += n * marksPerQ;
        } else if (!isChoice && m > 0 && marksPerQ > 0) {
          total += m * marksPerQ;
        }
      }
      if (sec.type === 'PRACTICAL' && sec.practicalMarks) {
        total += Number(sec.practicalMarks || 0);
      }
    });
    return total;
  }, [paperSections]);

  // Keep paperTotalMarks in sync with computedEffectiveMax
  useEffect(() => {
    if (computedEffectiveMax > 0) {
      setPaperTotalMarks(computedEffectiveMax);
    }
  }, [computedEffectiveMax]);

  // Choice Group handlers
  const handleToggleSelectForGroup = (secId: string, qId: string) => {
    setSecGroupSelect(prev => {
      const cur = prev[secId] || [];
      const updated = cur.includes(qId) ? cur.filter(id => id !== qId) : [...cur, qId];
      return { ...prev, [secId]: updated };
    });
  };

  const handleCreateChoiceGroup = (secId: string) => {
    const selectedQIds = secGroupSelect[secId] || [];
    if (selectedQIds.length < 2) {
      setAlert({ type: 'error', message: 'Select at least 2 questions to wrap in a Choice Group.' });
      return;
    }

    setPaperSections(prev => prev.map(sec => {
      if (sec.id !== secId) return sec;
      const currentGroups: ChoiceGroup[] = sec.choiceGroups || [];
      const newGroup: ChoiceGroup = {
        id: `cg-${Date.now()}`,
        name: `Group ${currentGroups.length + 1} (Attempt any ${selectedQIds.length - 1} of ${selectedQIds.length})`,
        sectionId: secId,
        questionIds: selectedQIds,
        totalQuestions: selectedQIds.length,
        requiredToAttempt: Math.max(1, selectedQIds.length - 1),
        overAttemptPolicy: OverAttemptPolicy.BEST_N,
        marksMode: MarksMode.UNIFORM,
      };
      return {
        ...sec,
        choiceGroups: [...currentGroups, newGroup],
      };
    }));

    setSecGroupSelect(prev => ({ ...prev, [secId]: [] }));
    setAlert({ type: 'success', message: `Wrapped ${selectedQIds.length} questions in a new Choice Group.` });
  };

  const handleUpdateChoiceGroup = (secId: string, groupId: string, updates: Partial<ChoiceGroup>) => {
    setPaperSections(prev => prev.map(sec => {
      if (sec.id !== secId) return sec;
      return {
        ...sec,
        choiceGroups: (sec.choiceGroups || []).map((g: ChoiceGroup) => g.id === groupId ? { ...g, ...updates } : g),
      };
    }));
  };

  const handleRemoveChoiceGroup = (secId: string, groupId: string) => {
    setPaperSections(prev => prev.map(sec => {
      if (sec.id !== secId) return sec;
      return {
        ...sec,
        choiceGroups: (sec.choiceGroups || []).filter((g: ChoiceGroup) => g.id !== groupId),
      };
    }));
    setAlert({ type: 'success', message: 'Choice group disbanded.' });
  };

  const handleRemoveQuestionFromChoiceGroup = (secId: string, groupId: string, qId: string) => {
    setPaperSections(prev => prev.map(sec => {
      if (sec.id !== secId) return sec;
      return {
        ...sec,
        choiceGroups: (sec.choiceGroups || []).map((g: ChoiceGroup) => {
          if (g.id !== groupId) return g;
          const filtered = g.questionIds.filter(id => id !== qId);
          return {
            ...g,
            questionIds: filtered,
            totalQuestions: filtered.length,
          };
        }),
      };
    }));
  };

  // Section and Question reordering handlers
  const handleMoveSectionUp = (secIdx: number) => {
    if (secIdx <= 0) return;
    setPaperSections(prev => {
      const copy = [...prev];
      const temp = copy[secIdx];
      copy[secIdx] = copy[secIdx - 1];
      copy[secIdx - 1] = temp;
      return copy;
    });
  };

  const handleMoveSectionDown = (secIdx: number) => {
    setPaperSections(prev => {
      if (secIdx >= prev.length - 1) return prev;
      const copy = [...prev];
      const temp = copy[secIdx];
      copy[secIdx] = copy[secIdx + 1];
      copy[secIdx + 1] = temp;
      return copy;
    });
  };

  const handleMoveQuestionUp = (secId: string, qIdx: number) => {
    if (qIdx <= 0) return;
    setPaperSections(prev => prev.map(sec => {
      if (sec.id !== secId) return sec;
      const qCopy = [...sec.questions];
      const temp = qCopy[qIdx];
      qCopy[qIdx] = qCopy[qIdx - 1];
      qCopy[qIdx - 1] = temp;
      return { ...sec, questions: qCopy };
    }));
  };

  const handleMoveQuestionDown = (secId: string, qIdx: number) => {
    setPaperSections(prev => prev.map(sec => {
      if (sec.id !== secId || qIdx >= sec.questions.length - 1) return sec;
      const qCopy = [...sec.questions];
      const temp = qCopy[qIdx];
      qCopy[qIdx] = qCopy[qIdx + 1];
      qCopy[qIdx + 1] = temp;
      return { ...sec, questions: qCopy };
    }));
  };

  const handleApplyBlueprintQuestions = (questions: QuestionDefinition[]) => {
    if (!blueprintModalSecId) return;
    const targetSec = paperSections.find(s => s.id === blueprintModalSecId);
    const defaultM = targetSec?.defaultMarksPerQuestion || (targetSec?.type === 'MCQ' ? 1 : 5);
    const newItems = questions.map((q, idx) => ({
      questionId: q.id || `bp-${Date.now()}-${idx}`,
      questionText: q.text,
      mode: q.type === QuestionType.MCQ_SINGLE || q.type === QuestionType.MCQ_MULTI ? 'MCQ' : 'DESC',
      topic: q.topicName || '',
      competencyCode: q.competencyCode || '',
      defaultMarks: q.marks || defaultM,
      customMarks: q.marks || defaultM,
      options: q.options || [],
    }));

    setPaperSections(prev => prev.map(sec => {
      if (sec.id !== blueprintModalSecId) return sec;
      return {
        ...sec,
        questions: [...sec.questions, ...newItems],
      };
    }));

    setAlert({ type: 'success', message: `Added ${questions.length} questions from blueprint into section!` });
    setBlueprintModalSecId(null);
  };

  const [selectedPaperToPublish, setSelectedPaperToPublish] = useState<string>('');
  const [publishTargetBatch, setPublishTargetBatch] = useState('2026');
  const [publishDate, setPublishDate] = useState('2026-08-25');
  const [publishStartTime, setPublishStartTime] = useState('09:00');
  const [publishEndTime, setPublishEndTime] = useState('12:00');
  const [publishedExams, setPublishedExams] = useState<any[]>([]);

  // Created Papers Registry & Editor State
  const [createdPapersList, setCreatedPapersList] = useState<any[]>([]);
  const [showPaperEditor, setShowPaperEditor] = useState<boolean>(false);
  const [previewModalPaper, setPreviewModalPaper] = useState<any | null>(null);

  const renderPaperStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_DQAC_APPROVAL':
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-[#EEF2FF] text-[#5B4BFF] border border-[#5B4BFF]/30">🔍 PENDING DQAC AUDIT</span>;
      case 'DQAC_APPROVED':
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-[#E6F9F3] text-[#00C48C] border border-[#00C48C]/30">✨ DQAC APPROVED</span>;
      case 'PENDING_HOD_APPROVAL':
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-[#FFF4EC] text-[#F36C21] border border-[#F36C21]/30">⏳ PENDING HOD</span>;
      case 'HOD_APPROVED':
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-[#E6F9F3] text-[#00C48C] border border-[#00C48C]/30">✓ HOD APPROVED</span>;
      case 'CHANGES_REQUESTED':
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-[#FEECEB] text-[#F04438] border border-[#F04438]/30">⚠️ CHANGES REQUESTED</span>;
      case 'POSTPONED':
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-[#FFF4EC] text-[#F36C21] border border-[#F36C21]/30">⏸️ POSTPONED</span>;
      case 'PUBLISHED':
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-[#E6F9F3] text-[#00C48C] border border-[#00C48C]/30">🚀 PUBLISHED</span>;
      case 'DRAFT':
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-[#F1F4F9] text-[#4E5969] border border-[#E7EAF3]">📝 DRAFT</span>;
    }
  };

  const fetchCreatedPapersList = async () => {
    const slug = getTenantSlug();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const h = { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': slug };
    try {
      let matchedDept: any = null;
      let u: any = {};
      try {
        u = JSON.parse(localStorage.getItem('user') || '{}');
      } catch {}
      const userRole = (u.role || '').toUpperCase();
      const userId = u.id || u.sub || u.faculty_id || localStorage.getItem('empid') || '';
      const deptId = u.department_id || selectedDept || '';

      const qp = new URLSearchParams();
      qp.set('tenant', slug);
      if (userRole) qp.set('role', userRole);
      if (userId) qp.set('createdBy', userId);
      if (deptId && (userRole === 'HOD' || userRole.includes('HOD'))) qp.set('departmentId', deptId);

      const res = await fetch(`${API_BASE}/exams/papers?${qp.toString()}`, { headers: h });
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        // STRICT CONFIDENTIALITY: Faculty can ONLY view question papers that they prepared.
        // Other faculties from the same department cannot view it.
        const isFaculty = !userRole || userRole === 'FACULTY' || userRole === 'TEACHER' || userRole === 'INSTRUCTOR';
        const userIds = [u.id, u.sub, u.faculty_id, u.emp_id, typeof window !== 'undefined' ? localStorage.getItem('empid') : null, typeof window !== 'undefined' ? localStorage.getItem('userId') : null]
          .filter(Boolean)
          .map(x => String(x).toLowerCase());

        const filtered = isFaculty
          ? (userIds.length > 0
              ? list.filter((p: any) => {
                  const pCreated = String(p.created_by || p.faculty_id || '').toLowerCase();
                  return userIds.includes(pCreated);
                })
              : [])
          : list;
        setCreatedPapersList(filtered);
      }
    } catch (e) {
      console.error('Failed to fetch created papers list', e);
    }
  };

  useEffect(() => {
    fetchCreatedPapersList();
    fetchDesignedPapers();
  }, [activeTab, selectedSubject, academicCascade?.subject?.code, academicCascade?.subject?.id]);

  const handleCreateNewPaper = () => {
    setEditingPaperId(null);
    setPaperType('THEORY');
    const subName = academicCascade?.subject?.mst_sub_name || academicCascade?.subject?.name || selectedSubject || 'Subject';
    const subCode = (academicCascade?.subject?.code || academicCascade?.subject?.sub_cd || (academicCascade?.subject as any)?.mst_sub_cd || 'EXAM').replace(/[^a-zA-Z0-9]/g, '');
    const currentYear = new Date().getFullYear();
    const paperCount = createdPapersList.length + 1;
    setPaperTitle(`${subName} Examination ${currentYear}`);
    setPaperCode(`${subCode}-${currentYear}-T${paperCount}`);
    setPaperDuration(60);
    setPaperTotalMarks('');
    setPaperSet('Set A');
    setTargetSections(['All']);
    setPaperSections([
      {
        id: 'sec-1',
        name: 'Section A',
        type: 'DESC',
        description: '',
        questions: [],
        practicalMarks: 0,
        marksCondition: 'VARIABLE',
        attemptRule: 'ALL',
        targetQuestionsCount: '',
        requiredToAttempt: '',
        overAttemptPolicy: OverAttemptPolicy.BEST_N,
        ruleMaxPolicy: 'EQUAL_MARKS_REQUIRED',
        defaultMarksPerQuestion: '',
        choiceGroups: [],
      }
    ]);
    setShowPaperEditor(true);
    setTimeout(() => {
      document.getElementById('paper-editor-container')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleEditExistingPaper = (paper: any) => {
    if (paper.status === 'HOD_APPROVED') {
      setAlert({
        type: 'error',
        message: '🔒 This question paper has been approved by HOD and is locked against direct edits. You can clone it as a new set (which must be re-approved).'
      });
      return;
    }
    setEditingPaperId(paper.id);
    setPaperType((paper.type || 'THEORY').toUpperCase() === 'PRACTICAL' ? 'PRACTICAL' : 'THEORY');
    setPaperTitle(paper.name || '');
    setPaperCode(paper.code || '');
    setPaperDuration(paper.duration_minutes ?? paper.duration_mins ?? '');
    setPaperTotalMarks(paper.max_marks ?? '');
    setPaperSet(paper.paper_set || paper.paperSet || 'Set A');

    let targetSecs = paper.target_sections || paper.targetSections || ['All'];
    if (typeof targetSecs === 'string') {
      try {
        targetSecs = JSON.parse(targetSecs);
      } catch {
        targetSecs = [targetSecs];
      }
    }
    setTargetSections(Array.isArray(targetSecs) ? targetSecs : [targetSecs]);

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
          subQuestions: Array.isArray(q.sub_questions) ? q.sub_questions : (Array.isArray(q.subQuestions) ? q.subQuestions : []),
          imageUrl: q.image_url || q.imageUrl || q.image || q.diagramUrl || q.diagram_url || null,
          image_url: q.image_url || q.imageUrl || q.image || q.diagramUrl || q.diagram_url || null,
        }));

        const rawTargetM = sec.targetQuestionsCount ?? sec.target_questions_count;
        const targetCount = rawTargetM !== undefined && rawTargetM !== null && rawTargetM !== '' ? Number(rawTargetM) : '';
        const rawReqCount = sec.requiredToAttempt ?? sec.required_to_attempt;
        const reqCount = rawReqCount !== undefined && rawReqCount !== null && rawReqCount !== '' ? Number(rawReqCount) : '';
        const rawMarks = sec.defaultMarksPerQuestion ?? sec.default_marks_per_question;
        const defaultMarks = rawMarks !== undefined && rawMarks !== null && rawMarks !== '' ? Number(rawMarks) : '';
        const derivedRule = String(sec.attemptRule ?? sec.attempt_rule ?? (reqCount !== '' && targetCount !== '' && reqCount < targetCount ? 'CHOICE' : 'ALL')).toUpperCase();

        return {
          id: sec.id || `sec-${idx + 1}`,
          name: sec.name || sec.title || `Section ${String.fromCharCode(65 + idx)}`,
          type: sec.type || ((paper.type || '').toUpperCase() === 'PRACTICAL' ? 'PRACTICAL' : 'DESC'),
          description: (sec.description || sec.instructions || '').replace(/\s*\(\d+\s*Marks?\)/gi, '').trim(),
          questions: formattedQs,
          practicalMarks: Number(sec.practicalMarks || 0),
          targetQuestionsCount: targetCount,
          requiredToAttempt: reqCount,
          attemptRule: derivedRule,
          marksCondition: sec.marksCondition || (defaultMarks ? 'UNIFORM' : 'VARIABLE'),
          overAttemptPolicy: sec.overAttemptPolicy ?? sec.over_attempt_policy ?? OverAttemptPolicy.BEST_N,
          ruleMaxPolicy: sec.ruleMaxPolicy ?? sec.rule_max_policy ?? 'EQUAL_MARKS_REQUIRED',
          defaultMarksPerQuestion: defaultMarks,
          choiceGroups: Array.isArray(sec.choiceGroups) ? sec.choiceGroups : (Array.isArray(sec.choice_groups) ? sec.choice_groups : []),
        };
      });

      setPaperSections(mappedSecs);
    } else {
      setPaperSections([
        { id: 'sec-1', name: 'Section A', type: (paper.type || '').toUpperCase() === 'PRACTICAL' ? 'PRACTICAL' : 'DESC', description: '', questions: [], practicalMarks: 0, marksCondition: 'VARIABLE', targetQuestionsCount: '', requiredToAttempt: '', attemptRule: 'ALL', overAttemptPolicy: OverAttemptPolicy.BEST_N, ruleMaxPolicy: 'EQUAL_MARKS_REQUIRED', defaultMarksPerQuestion: '', choiceGroups: [] }
      ]);
    }
    setShowPaperEditor(true);
    setTimeout(() => {
      document.getElementById('paper-editor-container')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleDuplicateAsNextSet = (paper: any) => {
    const currentSet = paper.paper_set || paper.paperSet || 'Set A';
    let nextSet = 'Set B';
    if (currentSet.includes('A')) nextSet = 'Set B';
    else if (currentSet.includes('B')) nextSet = 'Set C';
    else if (currentSet.includes('C')) nextSet = 'Set D';
    else nextSet = `${currentSet} (Copy)`;

    setEditingPaperId(null);
    setPaperTitle(`${paper.name || 'Exam Paper'} (${nextSet})`);
    const baseCode = (paper.code || 'EXAM').replace(/-SET[A-Z]/i, '').replace(/_SET[A-Z]/i, '');
    setPaperCode(`${baseCode}-${nextSet.replace(/\s+/g, '').toUpperCase()}`);
    setPaperDuration(Number(paper.duration_minutes || paper.duration_mins || 60));
    setPaperTotalMarks(Number(paper.max_marks || 40));
    setPaperSet(nextSet);

    // If original was for Section A, suggest Section B; otherwise default to All
    const prevSecs = Array.isArray(paper.target_sections) ? paper.target_sections : ['All'];
    if (prevSecs.includes('Section A')) setTargetSections(['Section B']);
    else if (prevSecs.includes('Section B')) setTargetSections(['Section A']);
    else setTargetSections(['All']);

    let rawSections = paper.sections;
    if (typeof rawSections === 'string') {
      try { rawSections = JSON.parse(rawSections); } catch { rawSections = []; }
    }
    if (Array.isArray(rawSections) && rawSections.length > 0) {
      setPaperSections(JSON.parse(JSON.stringify(rawSections)));
    }
    setShowPaperEditor(true);
    setAlert({ type: 'success', message: `📋 Cloned paper into new draft ${nextSet}! Note: This cloned paper is in DRAFT state and MUST be re-submitted for DQAC Quality Audit approval before use.` });
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
        type: paperType === 'PRACTICAL' ? 'PRACTICAL' : 'DESC',
        description: '',
        questions: [],
        practicalMarks: 0,
        marksCondition: 'VARIABLE',
        attemptRule: 'ALL',
        targetQuestionsCount: '',
        requiredToAttempt: '',
        overAttemptPolicy: OverAttemptPolicy.BEST_N,
        ruleMaxPolicy: 'EQUAL_MARKS_REQUIRED',
        defaultMarksPerQuestion: '',
        choiceGroups: [],
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
  const [secFilters, setSecFilters] = useState<{ [secId: string]: { type: string; unit: string; topic: string; competency: string } }>({});
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

  const handleUpdateSectionFilter = (secId: string, field: 'type' | 'unit' | 'topic' | 'competency', val: string) => {
    setSecFilters(prev => ({
      ...prev,
      [secId]: {
        type: field === 'type' ? val : (prev[secId]?.type || 'ALL'),
        unit: field === 'unit' ? val : (prev[secId]?.unit || 'ALL'),
        topic: field === 'unit' ? 'ALL' : (field === 'topic' ? val : (prev[secId]?.topic || 'ALL')),
        competency: (field === 'unit' || field === 'topic') ? 'ALL' : (field === 'competency' ? val : (prev[secId]?.competency || 'ALL')),
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

  const handlePickerTotalMarksChange = (qId: string, marks: number, subQuestions?: any[]) => {
    setPickerTotalMarks(prev => ({ ...prev, [qId]: marks }));
    if (Array.isArray(subQuestions) && subQuestions.length > 0) {
      const oldTotalRaw = subQuestions.reduce((sum: number, s: any) => sum + Number(s.marks || 1), 0) || 1;
      const newSubMap: Record<string, number> = {};
      subQuestions.forEach((sq: any) => {
        const subKey = sq.id || sq.label;
        newSubMap[subKey] = Number(((Number(sq.marks || 1) / oldTotalRaw) * marks).toFixed(2));
      });
      setPickerSubMarks(prev => ({ ...prev, [qId]: newSubMap }));
    }
  };

  const handlePickerSubMarkChange = (qId: string, subKey: string, markVal: number, subQuestions: any[]) => {
    const currentSubs = { ...(pickerSubMarks[qId] || {}) };
    currentSubs[subKey] = markVal;
    subQuestions.forEach((sq: any) => {
      const k = sq.id || sq.label;
      if (currentSubs[k] === undefined) {
        currentSubs[k] = Number(sq.marks || 1);
      }
    });
    const newTot = Object.values(currentSubs).reduce((a, b) => a + Number(b || 0), 0);
    setPickerSubMarks(prev => ({ ...prev, [qId]: currentSubs }));
    setPickerTotalMarks(prev => ({ ...prev, [qId]: newTot }));
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
        .map(tq => {
          const chosenMarks = pickerTotalMarks[tq.id] !== undefined ? pickerTotalMarks[tq.id] : Number(tq.max_marks || 2);
          let chosenSubs = tq.sub_questions || (tq as any).subQuestions;
          if (Array.isArray(chosenSubs) && pickerSubMarks[tq.id]) {
            chosenSubs = chosenSubs.map((sq: any) => {
              const k = sq.id || sq.label;
              return {
                ...sq,
                marks: pickerSubMarks[tq.id]?.[k] !== undefined ? pickerSubMarks[tq.id][k] : Number(sq.marks || 1)
              };
            });
          }
          return {
            questionId: tq.id,
            questionText: tq.question_text,
            mode: tq.mode,
            topic: tq.topic,
            competencyCode: tq.competency_code,
            defaultMarks: Number(tq.max_marks || 2),
            customMarks: chosenMarks,
            optionA: tq.option_a,
            optionB: tq.option_b,
            optionC: tq.option_c,
            optionD: tq.option_d,
            correctOption: tq.correct_option,
            subQuestions: chosenSubs,
            imageUrl: tq.image_url || tq.imageUrl || (tq as any).image || (tq as any).diagramUrl || (tq as any).diagram_url || null,
            image_url: tq.image_url || tq.imageUrl || (tq as any).image || (tq as any).diagramUrl || (tq as any).diagram_url || null,
          };
        });
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
      const chosenMarks = pickerTotalMarks[targetQ.id] !== undefined ? pickerTotalMarks[targetQ.id] : Number(targetQ.max_marks || 2);
      let chosenSubs = targetQ.sub_questions || (targetQ as any).subQuestions;
      if (Array.isArray(chosenSubs) && pickerSubMarks[targetQ.id]) {
        chosenSubs = chosenSubs.map((sq: any) => {
          const k = sq.id || sq.label;
          return {
            ...sq,
            marks: pickerSubMarks[targetQ.id]?.[k] !== undefined ? pickerSubMarks[targetQ.id][k] : Number(sq.marks || 1)
          };
        });
      }
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
            customMarks: chosenMarks,
            optionA: targetQ.option_a,
            optionB: targetQ.option_b,
            optionC: targetQ.option_c,
            optionD: targetQ.option_d,
            correctOption: targetQ.correct_option,
            subQuestions: chosenSubs,
            imageUrl: targetQ.image_url || targetQ.imageUrl || (targetQ as any).image || (targetQ as any).diagramUrl || (targetQ as any).diagram_url || null,
            image_url: targetQ.image_url || targetQ.imageUrl || (targetQ as any).image || (targetQ as any).diagramUrl || (targetQ as any).diagram_url || null,
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

  const handleStartEditSectionQuestion = (secId: string, q: any) => {
    let subs: any[] = [];
    if (Array.isArray(q.subQuestions) && q.subQuestions.length > 0) {
      subs = q.subQuestions.map((s: any) => ({ ...s }));
    } else if (Array.isArray(q.sub_questions) && q.sub_questions.length > 0) {
      subs = q.sub_questions.map((s: any) => ({ ...s }));
    }
    setEditingSectionQuestion({
      secId,
      qId: q.questionId || q.id,
      questionText: q.questionText || q.question_text || '',
      customMarks: Number(q.customMarks || q.defaultMarks || q.marks || 5),
      subQuestions: subs,
      optionA: q.optionA || q.option_a || '',
      optionB: q.optionB || q.option_b || '',
      optionC: q.optionC || q.option_c || '',
      optionD: q.optionD || q.option_d || '',
      correctOption: q.correctOption || q.correct_option || 'option_a',
      imageUrl: q.imageUrl || q.image_url || q.image || '',
      mode: q.mode || 'DESC',
    });
  };

  const handleSaveEditedSectionQuestion = () => {
    if (!editingSectionQuestion) return;
    const { secId, qId, questionText, customMarks, subQuestions, optionA, optionB, optionC, optionD, correctOption, imageUrl } = editingSectionQuestion;

    setPaperSections(prev => prev.map(sec => {
      if (sec.id !== secId) return sec;
      return {
        ...sec,
        questions: sec.questions.map((q: any) => {
          if ((q.questionId || q.id) !== qId) return q;
          const finalSubs = Array.isArray(subQuestions) ? subQuestions : [];
          let finalMarks = customMarks;
          if (finalSubs.length > 0) {
            finalMarks = finalSubs.reduce((sum: number, sq: any) => sum + Number(sq.marks || 0), 0);
          }
          return {
            ...q,
            questionText: questionText.trim(),
            customMarks: finalMarks,
            defaultMarks: finalMarks,
            subQuestions: finalSubs,
            optionA: optionA || q.optionA,
            optionB: optionB || q.optionB,
            optionC: optionC || q.optionC,
            optionD: optionD || q.optionD,
            correctOption: correctOption || q.correctOption,
            imageUrl: imageUrl !== undefined ? imageUrl : q.imageUrl,
          };
        })
      };
    }));
    setEditingSectionQuestion(null);
    setAlert({ type: 'success', message: 'Question prompt and weightage updated successfully in exam paper section!' });
  };

  // ─── Load User Context & Master Data on Mount ─────────────────────
  useEffect(() => {
    setTenantName(getTenantName());
    fetchMetadataAndUserContext();
    fetchCreatedPapersList();
    fetchDesignedPapers();
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

      let facIdParam = '';
      if (typeof window !== 'undefined') {
        try {
          const u = JSON.parse(localStorage.getItem('user') || '{}');
          facIdParam = u.faculty_id || u.profile?.id || u.id || u.sub || u.emp_id || localStorage.getItem('empid') || '';
        } catch {}
      }

      // 2. Fetch Master data strictly from DB APIs
      const [deptRes, subjRes, linkRes, profRes, unitRes, topicRes, compRes, facSubRes] = await Promise.all([
        fetch(`${API_BASE}/admin-master/departments`, { headers: h }),
        fetch(`${API_BASE}/admin-master/subjects${facIdParam ? `?facultyId=${encodeURIComponent(facIdParam)}` : ''}`, { headers: h }),
        fetch(`${API_BASE}/admin-master/professional-linkers`, { headers: h }),
        fetch(`${API_BASE}/college-master/professionals`, { headers: h }),
        fetch(`${API_BASE}/admin-master/units`, { headers: h }).catch(() => null),
        fetch(`${API_BASE}/admin-master/topics`, { headers: h }),
        fetch(`${API_BASE}/admin-master/competencies`, { headers: h }),
        facIdParam ? fetch(`${API_BASE}/admin-master/faculty-subjects?facultyId=${encodeURIComponent(facIdParam)}`, { headers: h }).catch(() => null) : Promise.resolve(null),
      ]);

      let fetchedDepts: Department[] = [];
      let fetchedSubjs: Subject[] = [];

      if (deptRes.ok) { fetchedDepts = parse(await deptRes.json()); }
      if (subjRes.ok) { fetchedSubjs = parse(await subjRes.json()); }

      let linkedItems: any[] = [];
      if (facSubRes && facSubRes.ok) {
        linkedItems = parse(await facSubRes.json());
      }
      if (linkedItems.length > 0) {
        const linkedKeys = new Set(linkedItems.map((l: any) => String(l.subject_code || l.subject_id || '').toLowerCase()));
        const filtered = fetchedSubjs.filter((s: any) =>
          linkedKeys.has(String(s.code || '').toLowerCase()) ||
          linkedKeys.has(String(s.id || '').toLowerCase()) ||
          linkedKeys.has(String(s.name || '').toLowerCase())
        );
        fetchedSubjs = filtered.length > 0 ? filtered : linkedItems.map((l: any) => ({
          id: l.subject_id || l.id,
          code: l.subject_code || 'SUB',
          name: l.subject_name || 'Subject',
          department_id: l.department_id,
        }));
      }
      setAllSubjects(fetchedSubjs);

      if (linkRes.ok) { const j = await linkRes.json(); setAllLinkers(parse(j)); }
      if (profRes.ok) { const j = await profRes.json(); setCollegeProfessionals(parse(j)); }
      if (unitRes && unitRes.ok) { const j = await unitRes.json(); setAllUnits(parse(j)); }
      if (topicRes.ok) { const j = await topicRes.json(); setDbTopics(parse(j)); }
      if (compRes.ok) { const j = await compRes.json(); setDbCompetencies(parse(j)); }

      setDepartments(fetchedDepts);

      if (fetchedDepts.length > 0) {
        const facultyDeptClean = (userDeptNameStr || facultyDeptName || '').toLowerCase().replace('department of ', '').trim();
        const matchedDept = (userDeptId ? fetchedDepts.find(d => d.id === userDeptId) : null) ||
          (facultyDeptClean ? fetchedDepts.find(d => d.name.toLowerCase().includes(facultyDeptClean) || facultyDeptClean.includes(d.name.toLowerCase())) : null) ||
          fetchedDepts[0];

        setSelectedDept(matchedDept.id);

        // Department selected; academic subject selection is driven by FacultyAcademicCascadingDropdown
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
    setSelectedUnitId(''); setSelectedUnitCode(''); setSelectedUnitName('');
    setSelectedTopicId(''); setSelectedTopicCode(''); setSelectedTopicName('');
    setSelectedCompetencyId(''); setSelectedCompetencyCode(''); setSelectedCompetencyDesc('');
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubject(subjectId);
    setSelectedUnitId(''); setSelectedUnitCode(''); setSelectedUnitName('');
    setSelectedTopicId(''); setSelectedTopicCode(''); setSelectedTopicName('');
    setSelectedCompetencyId(''); setSelectedCompetencyCode(''); setSelectedCompetencyDesc('');
  };

  const handleCbmeYearChange = (year: string) => {
    setSelectedCbmeYear(year);
  };

  const handleProfPhaseChange = (profId: string) => {
    setSelectedProfPhase(profId);
  };

  const handleUnitChange = (unitId: string) => {
    setSelectedUnitId(unitId);
    const found = availableUnits.find((u) => u.id === unitId || u.code === unitId);
    setSelectedUnitCode(found?.code || unitId);
    setSelectedUnitName(found?.name || '');
    setSelectedTopicId(''); setSelectedTopicCode(''); setSelectedTopicName('');
    setSelectedCompetencyId(''); setSelectedCompetencyCode(''); setSelectedCompetencyDesc('');
  };

  const handleTopicChange = (topicId: string) => {
    setSelectedTopicId(topicId);
    const found = availableTopics.find((t) => t.id === topicId || t.code === topicId);
    setSelectedTopicCode(found?.code || topicId);
    setSelectedTopicName(found?.name || '');
    setSelectedCompetencyId(''); setSelectedCompetencyCode(''); setSelectedCompetencyDesc('');
  };

  const subjectsForDept = useMemo(() => {
    if (academicCascade?.allSubjects && academicCascade.allSubjects.length > 0) {
      return academicCascade.allSubjects.map((s) => ({
        id: s.code || s.id,
        name: s.mst_sub_name ? `${s.code ? `${s.code} — ` : ''}${s.mst_sub_name}` : s.name,
        code: s.code || s.id,
        department_id: academicCascade.branch?.branch_cd,
      }));
    }
    if (!selectedDept) return allSubjects;
    const deptObj = departments.find((d) => d.id === selectedDept);
    if (!deptObj) return allSubjects;

    const deptNameClean = deptObj.name.toLowerCase().replace('department of ', '').trim();
    const deptCodeClean = deptObj.code.toLowerCase().trim();

    const matches = allSubjects.filter((s) => {
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
  }, [allSubjects, selectedDept, departments, academicCascade?.allSubjects, academicCascade?.branch]);



  const cbmeYearsList = useMemo(() => {
    const map = new Map<string, string>();
    allLinkers.forEach((l) => {
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

  // ─── 1. SUBJECT LOADED -> DYNAMICALLY LOAD UNITS / COURSE OUTCOMES (CO) ───
  useEffect(() => {
    let active = true;
    const loadUnits = async () => {
      const activeSub = (academicCascade?.subject?.code || academicCascade?.subject?.id || selectedSubject || '').trim();
      if (!activeSub) {
        setAvailableUnits([]);
        setSelectedUnitId('');
        setSelectedUnitCode('');
        setSelectedUnitName('');
        return;
      }
      setLoadingUnits(true);
      const slug = getTenantSlug();
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const h = { Authorization: `Bearer ${token}`, 'x-tenant-slug': slug };

      const subjObj =
        academicCascade?.subject ||
        academicCascade?.allSubjects?.find((s: any) => s.code === activeSub || s.id === activeSub) ||
        allSubjects.find((s: any) => s.code === activeSub || s.id === activeSub);

      const rawSubCode = (subjObj?.code || activeSub || '').trim();
      const subCodeMatch = rawSubCode.match(/\[([a-zA-Z0-9_\-\s]+)\]/) || rawSubCode.match(/\b\d{4,6}\b/);
      const cleanSubCode = (subCodeMatch ? (subCodeMatch[1] || subCodeMatch[0]) : rawSubCode).trim();
      const subId = (subjObj?.id && subjObj.id !== rawSubCode && subjObj.id !== cleanSubCode ? subjObj.id : '').trim();
      const subName = (subjObj?.mst_sub_name || subjObj?.name || '').trim();

      try {
        const queryParams = new URLSearchParams();
        queryParams.set('tenant', slug);
        if (cleanSubCode) queryParams.set('subjectCode', cleanSubCode);
        if (subId) queryParams.set('subjectId', subId);

        const res = await fetch(`${API_BASE}/admin-master/units?${queryParams.toString()}`, { headers: h }).catch(() => null);

        let fetched: any[] = [];
        if (res && res.ok) {
          const json = await res.json();
          const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
          if (list.length > 0) {
            fetched = list;
          }
        }

        if (!active) return;

        let finalUnits: UnitItem[] = [];
        if (fetched.length > 0) {
          finalUnits = fetched.map((u: any) => {
            const code = String(u.code || u.unit_code || u.id || '').trim();
            const desc = (u.description || '').trim();
            const uName = (u.name || u.unit_name || '').trim();
            let displayName = uName;
            if (desc && desc !== code) {
              displayName = `${code}: ${desc}`;
            } else if (uName && uName !== code) {
              displayName = `${code}: ${uName}`;
            } else {
              displayName = code || `CO${u.unit_order || 1}`;
            }
            return {
              id: String(u.id || code),
              code: code,
              name: displayName,
              description: desc,
              subject_id: u.subject_id,
              subject_code: u.subject_code || cleanSubCode,
            };
          });
        } else {
          // Check from allUnits cache
          const cached = allUnits.filter((u: any) => {
            const uSubCode = String(u.subject_code || '').toLowerCase().trim();
            const uSubId = String(u.subject_id || '').toLowerCase().trim();
            const target = cleanSubCode.toLowerCase();
            return (target && (uSubCode === target || uSubCode.includes(target))) || (subId && uSubId === subId.toLowerCase());
          });
          if (cached.length > 0) {
            finalUnits = cached.map((u: any) => {
              const code = String(u.code || u.unit_code || u.id || '').trim();
              const desc = (u.description || '').trim();
              const uName = (u.name || u.unit_name || '').trim();
              let displayName = uName;
              if (desc && desc !== code) {
                displayName = `${code}: ${desc}`;
              } else if (uName && uName !== code) {
                displayName = `${code}: ${uName}`;
              } else {
                displayName = code || `CO${u.unit_order || 1}`;
              }
              return {
                id: String(u.id || code),
                code: code,
                name: displayName,
                description: desc,
                subject_id: u.subject_id,
                subject_code: u.subject_code || cleanSubCode,
              };
            });
          } else {
            // Dynamically generate syllabus units tailored to this subject (Standard CO1 to CO5)
            finalUnits = generateSyllabusUnits(cleanSubCode, subName);
          }
        }

        setAvailableUnits(finalUnits);
        if (finalUnits.length > 0) {
          const savedUnitId = typeof window !== 'undefined' ? sessionStorage.getItem('faculty_selected_unit_id') || '' : '';
          const matchUnit = finalUnits.find((u) => u.id === savedUnitId || u.code === savedUnitId) || finalUnits[0];
          setSelectedUnitId(matchUnit.id);
          setSelectedUnitCode(matchUnit.code);
          setSelectedUnitName(matchUnit.name);
        } else {
          setSelectedUnitId('');
          setSelectedUnitCode('');
          setSelectedUnitName('');
        }
      } catch (e) {
        console.error('Failed to load units for subject:', e);
        if (!active) return;
        const fallback = generateSyllabusUnits(cleanSubCode, subName);
        setAvailableUnits(fallback);
        if (fallback.length > 0) {
          setSelectedUnitId(fallback[0].id);
          setSelectedUnitCode(fallback[0].code);
          setSelectedUnitName(fallback[0].name);
        }
      } finally {
        if (active) setLoadingUnits(false);
      }
    };

    loadUnits();
    return () => {
      active = false;
    };
  }, [selectedSubject, academicCascade?.subject, allSubjects, allUnits]);

  // ─── 2. UNIT / CO LOADED/SELECTED -> DYNAMICALLY LOAD TOPICS OF THAT CO ───
  useEffect(() => {
    let active = true;
    const loadTopics = async () => {
      if (!selectedUnitCode && !selectedUnitId) {
        setAvailableTopics([]);
        setSelectedTopicId('');
        setSelectedTopicCode('');
        setSelectedTopicName('');
        return;
      }
      setLoadingTopics(true);
      const slug = getTenantSlug();
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const h = { Authorization: `Bearer ${token}`, 'x-tenant-slug': slug };

      const subjObj =
        academicCascade?.subject ||
        academicCascade?.allSubjects?.find((s: any) => s.code === selectedSubject || s.id === selectedSubject) ||
        allSubjects.find((s: any) => s.code === selectedSubject || s.id === selectedSubject);

      const rawSubCode = (subjObj?.code || selectedSubject || '').trim();
      const subCodeMatch = rawSubCode.match(/\[([a-zA-Z0-9_\-\s]+)\]/) || rawSubCode.match(/\b\d{4,6}\b/);
      const cleanSubCode = (subCodeMatch ? (subCodeMatch[1] || subCodeMatch[0]) : rawSubCode).trim();
      const subId = (subjObj?.id && subjObj.id !== rawSubCode && subjObj.id !== cleanSubCode ? subjObj.id : '').trim();
      const subName = (subjObj?.mst_sub_name || subjObj?.name || '').trim();

      try {
        const queryParams = new URLSearchParams();
        queryParams.set('tenant', slug);
        if (cleanSubCode) queryParams.set('subjectCode', cleanSubCode);
        if (subId) queryParams.set('subjectId', subId);
        if (selectedUnitId) queryParams.set('unitId', selectedUnitId);
        if (selectedUnitCode) queryParams.set('unitCode', selectedUnitCode);

        const res = await fetch(`${API_BASE}/admin-master/topics?${queryParams.toString()}`, { headers: h }).catch(() => null);

        let fetched: any[] = [];
        if (res && res.ok) {
          const json = await res.json();
          const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
          fetched = list.filter((t: any) => {
            const tUnitCode = String(t.unit_code || '').toLowerCase().trim();
            const tUnitId = String(t.unit_id || '').toLowerCase().trim();
            const selCode = (selectedUnitCode || '').toLowerCase().trim();
            const selId = (selectedUnitId || '').toLowerCase().trim();

            const matchUnit =
              (selCode && tUnitCode === selCode) ||
              (selId && tUnitId === selId) ||
              (selCode && String(t.unit_name || '').toLowerCase().includes(selCode));

            const tSubCode = String(t.subject_code || '').toLowerCase().trim();
            const tSubId = String(t.subject_id || '').toLowerCase().trim();
            const target = cleanSubCode.toLowerCase();
            const matchSub =
              !target ||
              tSubCode === target ||
              tSubCode.includes(target) ||
              (subId && tSubId === subId.toLowerCase());

            return matchUnit && matchSub;
          });
        }

        if (!active) return;

        let finalTopics: TopicItem[] = [];
        if (fetched.length > 0) {
          finalTopics = fetched.map((t: any) => {
            const code = String(t.code || t.topic_code || t.id || '').trim();
            const name = (t.name || t.topic_name || '').trim();
            const displayName = name && !name.startsWith(code) ? `${code}: ${name}` : (name || code);
            return {
              id: String(t.id || code),
              code: code,
              name: displayName,
              unit_id: t.unit_id || selectedUnitId,
              unit_code: t.unit_code || selectedUnitCode,
              subject_id: t.subject_id || subId,
              subject_code: t.subject_code || cleanSubCode,
            };
          });
        } else {
          // Check from dbTopics cache
          const cached = dbTopics.filter((t: any) => {
            const tUnitCode = String(t.unit_code || '').toLowerCase().trim();
            const tUnitId = String(t.unit_id || '').toLowerCase().trim();
            const selCode = (selectedUnitCode || '').toLowerCase().trim();
            const selId = (selectedUnitId || '').toLowerCase().trim();

            const matchUnit =
              (selCode && tUnitCode === selCode) ||
              (selId && tUnitId === selId) ||
              (selCode && String(t.unit_name || '').toLowerCase().includes(selCode));

            const tSubCode = String(t.subject_code || t.subject_id || '').toLowerCase().trim();
            const target = cleanSubCode.toLowerCase();
            const matchSub =
              !target ||
              tSubCode === target ||
              tSubCode.includes(target) ||
              String(t.name || '').toLowerCase().includes(target);

            return matchUnit || (matchSub && !t.unit_code);
          });

          if (cached.length > 0) {
            finalTopics = cached.map((t: any) => {
              const code = String(t.code || t.topic_code || t.id || '').trim();
              const name = (t.name || t.topic_name || '').trim();
              const displayName = name && !name.startsWith(code) ? `${code}: ${name}` : (name || code);
              return {
                id: String(t.id || code),
                code: code,
                name: displayName,
                unit_id: t.unit_id || selectedUnitId,
                unit_code: t.unit_code || selectedUnitCode,
                subject_id: t.subject_id || subId,
                subject_code: t.subject_code || cleanSubCode,
              };
            });
          } else {
            // If topics not feeded in master, do not show
            finalTopics = [];
          }
        }

        setAvailableTopics(finalTopics);
        if (finalTopics.length > 0) {
          const savedTopicId = typeof window !== 'undefined' ? sessionStorage.getItem('faculty_selected_topic_id') || '' : '';
          const matchTopic = finalTopics.find((t) => t.id === savedTopicId || t.code === savedTopicId) || finalTopics[0];
          setSelectedTopicId(matchTopic.id);
          setSelectedTopicCode(matchTopic.code);
          setSelectedTopicName(matchTopic.name);
        } else {
          setSelectedTopicId('');
          setSelectedTopicCode('');
          setSelectedTopicName('');
        }
      } catch (e) {
        console.error('Failed to load topics for unit:', e);
        if (!active) return;
        setAvailableTopics([]);
        setSelectedTopicId('');
        setSelectedTopicCode('');
        setSelectedTopicName('');
      } finally {
        if (active) setLoadingTopics(false);
      }
    };

    loadTopics();
    return () => {
      active = false;
    };
  }, [selectedUnitId, selectedUnitCode, selectedUnitName, selectedSubject, academicCascade?.subject, allSubjects, dbTopics]);

  // ─── 3. TOPIC LOADED/SELECTED -> DYNAMICALLY LOAD SUB TOPICS / COMPETENCIES ───
  useEffect(() => {
    let active = true;
    const loadCompetencies = async () => {
      if (!selectedTopicId && !selectedTopicCode) {
        setAvailableCompetencies([]);
        setSelectedCompetencyId('');
        setSelectedCompetencyCode('');
        setSelectedCompetencyDesc('');
        return;
      }
      setLoadingCompetencies(true);
      const slug = getTenantSlug();
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const h = { Authorization: `Bearer ${token}`, 'x-tenant-slug': slug };

      try {
        const queryParams = new URLSearchParams();
        queryParams.set('tenant', slug);
        if (selectedTopicId) queryParams.set('topicId', selectedTopicId);
        if (selectedTopicCode) queryParams.set('topicCode', selectedTopicCode);

        const res = await fetch(`${API_BASE}/admin-master/competencies?${queryParams.toString()}`, { headers: h }).catch(() => null);

        let fetched: any[] = [];
        if (res && res.ok) {
          const json = await res.json();
          const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
          fetched = list.filter((c: any) => {
            const cTopicId = String(c.topic_id || '').toLowerCase().trim();
            const cTopicCode = String(c.topic_code || '').toLowerCase().trim();
            const selId = (selectedTopicId || '').toLowerCase().trim();
            const selCode = (selectedTopicCode || '').toLowerCase().trim();
            return (
              (selId && cTopicId === selId) ||
              (selCode && cTopicCode === selCode) ||
              (selCode && String(c.code || '').toLowerCase().startsWith(selCode))
            );
          });
        }

        if (!active) return;

        let finalComps: CompetencyItem[] = [];
        if (fetched.length > 0) {
          finalComps = fetched.map((c: any) => {
            const code = String(c.code || c.id || '').trim();
            const desc = (c.description || c.name || '').trim();
            return {
              id: String(c.id || code),
              code: code,
              description: desc,
              name: desc || code,
              topic_id: c.topic_id || selectedTopicId,
              topic_code: c.topic_code || selectedTopicCode,
            };
          });
        } else {
          // Check from dbCompetencies cache
          const cached = dbCompetencies.filter((c: any) => {
            const cTopicId = String(c.topic_id || '').toLowerCase().trim();
            const cTopicCode = String(c.topic_code || '').toLowerCase().trim();
            const selId = (selectedTopicId || '').toLowerCase().trim();
            const selCode = (selectedTopicCode || '').toLowerCase().trim();
            return (
              (selId && cTopicId === selId) ||
              (selCode && cTopicCode === selCode) ||
              (selCode && String(c.code || '').toLowerCase().startsWith(selCode))
            );
          });

          if (cached.length > 0) {
            finalComps = cached.map((c: any) => {
              const code = String(c.code || c.id || '').trim();
              const desc = (c.description || c.name || '').trim();
              return {
                id: String(c.id || code),
                code: code,
                description: desc,
                name: desc || code,
                topic_id: c.topic_id || selectedTopicId,
                topic_code: c.topic_code || selectedTopicCode,
              };
            });
          } else {
            // If subtopics not feeded in master, do not show
            finalComps = [];
          }
        }

        setAvailableCompetencies(finalComps);
        if (finalComps.length > 0) {
          const savedCompCode = typeof window !== 'undefined' ? sessionStorage.getItem('faculty_selected_comp_code') || '' : '';
          const savedCompId = typeof window !== 'undefined' ? sessionStorage.getItem('faculty_selected_comp_id') || '' : '';
          const matchComp =
            finalComps.find((c) => c.code === savedCompCode || c.id === savedCompId) || finalComps[0];
          setSelectedCompetencyId(matchComp.id || '');
          setSelectedCompetencyCode(matchComp.code || '');
          setSelectedCompetencyDesc(matchComp.description || '');
        } else {
          setSelectedCompetencyId('');
          setSelectedCompetencyCode('');
          setSelectedCompetencyDesc('');
        }
      } catch (e) {
        console.error('Failed to load competencies for topic:', e);
        if (!active) return;
        setAvailableCompetencies([]);
        setSelectedCompetencyId('');
        setSelectedCompetencyCode('');
        setSelectedCompetencyDesc('');
      } finally {
        if (active) setLoadingCompetencies(false);
      }
    };

    loadCompetencies();
    return () => {
      active = false;
    };
  }, [selectedTopicId, selectedTopicCode, selectedTopicName, dbCompetencies]);

  // Persist selections to sessionStorage whenever user selects Unit/Topic/Competency/Subject
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (selectedUnitId) sessionStorage.setItem('faculty_selected_unit_id', selectedUnitId);
      if (selectedUnitCode) sessionStorage.setItem('faculty_selected_unit_code', selectedUnitCode);
      if (selectedUnitName) sessionStorage.setItem('faculty_selected_unit_name', selectedUnitName);
      if (selectedTopicId) sessionStorage.setItem('faculty_selected_topic_id', selectedTopicId);
      if (selectedTopicName) sessionStorage.setItem('faculty_selected_topic_name', selectedTopicName);
      if (selectedCompetencyId) sessionStorage.setItem('faculty_selected_comp_id', selectedCompetencyId);
      if (selectedCompetencyCode) sessionStorage.setItem('faculty_selected_comp_code', selectedCompetencyCode);
      if (selectedSubject) sessionStorage.setItem('faculty_selected_subject_id', selectedSubject);
    }
  }, [selectedUnitId, selectedUnitCode, selectedUnitName, selectedTopicId, selectedTopicName, selectedCompetencyId, selectedCompetencyCode, selectedSubject]);

  const canEnterQuestion = !!(selectedUnitId || selectedUnitCode);

  // Load questions when unit/CO, topic, competency, mode, subject, or status change
  useEffect(() => {
    fetchQuestions();
  }, [selectedUnitId, selectedUnitCode, selectedTopicId, selectedCompetencyCode, mode, selectedSubject, bankStatusFilter]);

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
      if (bankStatusFilter) params.set('status', bankStatusFilter);

      if (selectedUnitCode && selectedUnitCode !== 'all' && selectedUnitCode !== 'ALL') {
        params.set('unitCode', selectedUnitCode);
      }
      if (selectedUnitId && selectedUnitId !== 'all') {
        params.set('unitId', selectedUnitId);
      }

      if (availableTopics.length > 0 && selectedTopicId && selectedTopicId !== 'all') {
        params.set('topicId', selectedTopicId);
      } else if (availableTopics.length > 0 && selectedTopicName && selectedTopicName !== 'all') {
        const cleanTopic = selectedTopicName.replace(/^Topic \d+:\s*/i, '').replace(/\[.*\]$/, '').trim();
        params.set('topic', cleanTopic);
      }

      if (availableCompetencies.length > 0 && selectedCompetencyCode && selectedCompetencyCode !== 'all') {
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

  // Load designed papers from DB (GET /exams/papers) with role-based confidentiality
  const fetchDesignedPapers = async () => {
    const slug = getTenantSlug();
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const h = { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': slug };
      let u: any = {};
      try {
        u = JSON.parse(localStorage.getItem('user') || '{}');
      } catch {}
      const userRole = (u.role || '').toUpperCase();
      const userId = u.id || u.sub || u.faculty_id || localStorage.getItem('empid') || '';
      const deptId = u.department_id || selectedDept || '';

      const qp = new URLSearchParams();
      qp.set('tenant', slug);
      if (userRole) qp.set('role', userRole);
      if (userId) qp.set('createdBy', userId);
      if (deptId && (userRole === 'HOD' || userRole.includes('HOD'))) qp.set('departmentId', deptId);

      const res = await fetch(`${API_BASE}/exams/papers?${qp.toString()}`, { headers: h });
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
        // STRICT CONFIDENTIALITY: Faculty can ONLY view question papers that they prepared.
        const isFaculty = !userRole || userRole === 'FACULTY' || userRole === 'TEACHER' || userRole === 'INSTRUCTOR';
        const userIds = [u.id, u.sub, u.faculty_id, u.emp_id, typeof window !== 'undefined' ? localStorage.getItem('empid') : null, typeof window !== 'undefined' ? localStorage.getItem('userId') : null]
          .filter(Boolean)
          .map(x => String(x).toLowerCase());

        const filtered = isFaculty
          ? (userIds.length > 0
              ? list.filter((p: any) => {
                  const pCreated = String(p.created_by || p.faculty_id || '').toLowerCase();
                  return userIds.includes(pCreated);
                })
              : [])
          : list;
        // Map to UI shape
        const mapped = filtered.map((p: any) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          duration: p.duration_minutes || p.duration || 180,
          maxMarks: p.max_marks || 100,
          status: p.is_active ? 'Published' : (p.status || 'Ready for Publishing'),
          subject_name: p.subject_name || '',
          paper_set: p.paper_set || p.paperSet || 'Set A',
          target_sections: p.target_sections || p.targetSections || ['All'],
          sections: p.sections || [],
        }));
        setDesignedPapers(mapped);
        setCreatedPapersList(filtered);
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
      setAlert({ type: 'error', message: 'Please select Course Outcome (CO) / Unit before saving a question.' });
      return;
    }
    setSaving(true);
    setAlert(null);

    const slug = getTenantSlug();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const profObj = collegeProfessionals.find(p => p.id === selectedProfPhase);
    const profLabel = profObj?.name || null;

    const cleanCompCode = selectedCompetencyCode ? (selectedCompetencyCode.includes(':')
      ? selectedCompetencyCode.split(':')[0].trim()
      : selectedCompetencyCode.trim()) : null;

    const cleanTopicName = selectedTopicName ? selectedTopicName.replace(/^Topic \d+:\s*/i, '').replace(/\[.*\]$/, '').trim() : (selectedUnitName || selectedUnitCode || 'Core Unit');

    const payload = mode === 'MCQ' ? {
      departmentId: selectedDept || null,
      subjectId: selectedSubject || null,
      professionalPhase: profLabel,
      unitId: selectedUnitId || null,
      unitCode: selectedUnitCode || 'CO1',
      unitName: selectedUnitName || 'Unit 1',
      topicId: selectedTopicId || null,
      topic: cleanTopicName,
      topicCode: selectedTopicCode || null,
      competencyId: selectedCompetencyId || null,
      competencyCode: cleanCompCode,
      subTopicId: selectedCompetencyId || null,
      subTopicCode: cleanCompCode,
      colgCd: academicCascade?.college?.colg_cd ? String(academicCascade.college.colg_cd) : (slug.toLowerCase().includes('srms') ? '1' : null),
      courseCd: academicCascade?.course?.course_cd ? String(academicCascade.course.course_cd) : null,
      branchCd: academicCascade?.branch?.branch_cd ? String(academicCascade.branch.branch_cd) : null,
      batchCd: academicCascade?.batch?.batch_cd ? String(academicCascade.batch.batch_cd) : null,
      semester: academicCascade?.semester?.sem_cd ? String(academicCascade.semester.sem_cd) : null,
      section: academicCascade?.section ? String(academicCascade.section) : null,
      mode: 'MCQ',
      questionText: mcqQuestionText.trim(),
      optionA: optionA.trim(),
      optionB: optionB.trim(),
      optionC: optionC.trim(),
      optionD: optionD.trim(),
      correctOption,
      difficultyLevel: mcqDifficulty,
      maxMarks: Number(mcqMaxMarks) || 1.0,
      imageUrl: questionImage || null,
    } : {
      departmentId: selectedDept || null,
      subjectId: selectedSubject || null,
      professionalPhase: profLabel,
      unitId: selectedUnitId || null,
      unitCode: selectedUnitCode || 'CO1',
      unitName: selectedUnitName || 'Unit 1',
      topicId: selectedTopicId || null,
      topic: cleanTopicName,
      topicCode: selectedTopicCode || null,
      competencyId: selectedCompetencyId || null,
      competencyCode: cleanCompCode,
      subTopicId: selectedCompetencyId || null,
      subTopicCode: cleanCompCode,
      colgCd: academicCascade?.college?.colg_cd ? String(academicCascade.college.colg_cd) : (slug.toLowerCase().includes('srms') ? '1' : null),
      courseCd: academicCascade?.course?.course_cd ? String(academicCascade.course.course_cd) : null,
      branchCd: academicCascade?.branch?.branch_cd ? String(academicCascade.branch.branch_cd) : null,
      batchCd: academicCascade?.batch?.batch_cd ? String(academicCascade.batch.batch_cd) : null,
      semester: academicCascade?.semester?.sem_cd ? String(academicCascade.semester.sem_cd) : null,
      section: academicCascade?.section ? String(academicCascade.section) : null,
      mode: 'DESC',
      questionText: descQuestionText.trim(),
      hasSubQuestions,
      subQuestions: hasSubQuestions ? subQuestions : [],
      difficultyLevel: descDifficulty,
      maxMarks: Number(descMaxMarks) || 10.0,
      imageUrl: questionImage || null,
    };

    try {
      const url = editingBankQuestionId
        ? `${API_BASE}/exams/question-bank/${editingBankQuestionId}?tenant=${slug}`
        : `${API_BASE}/exams/question-bank?tenant=${slug}`;
      const method = editingBankQuestionId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        const savedQ = json?.data || json;
        if (editingBankQuestionId) {
          setQuestions(prev => prev.map(q => q.id === editingBankQuestionId ? { ...q, ...savedQ } : q));
          setMasterBankQuestions(prev => prev.map(q => q.id === editingBankQuestionId ? { ...q, ...savedQ } : q));
          setAlert({ type: 'success', message: `Question updated successfully in Question Bank!` });
          setEditingBankQuestionId(null);
        } else {
          setQuestions([savedQ, ...questions]);
          setMasterBankQuestions([savedQ, ...masterBankQuestions]);
          setAlert({ type: 'success', message: `${mode} Question saved under Topic '${selectedTopicName}' & Competency '${selectedCompetencyCode}'!` });
        }
        resetForm();
      } else {
        const errJson = await res.json().catch(() => ({}));
        const errMsg = Array.isArray(errJson.message) ? errJson.message.join(', ') : (errJson.message || 'Failed to save question to question bank.');
        setAlert({ type: 'error', message: errMsg });
      }
    } catch (err: any) {
      setAlert({ type: 'error', message: err?.message || 'Network error while saving question.' });
    } finally {
      setSaving(false);
    }
  };

  const handleStartEditBankQuestion = (q: QuestionItem) => {
    setEditingBankQuestionId(q.id);
    setMode(q.mode as 'MCQ' | 'DESC');
    setQuestionImage(q.image_url || q.imageUrl || (q as any).image || '');
    if (q.mode === 'MCQ') {
      setMcqQuestionText(q.question_text || '');
      setOptionA(q.option_a || '');
      setOptionB(q.option_b || '');
      setOptionC(q.option_c || '');
      setOptionD(q.option_d || '');
      setCorrectOption((q.correct_option as any) || 'option_a');
      setMcqDifficulty((q.difficulty_level as any) || 'Medium');
      setMcqMaxMarks(Number(q.max_marks || 1));
    } else {
      setDescQuestionText(q.question_text || '');
      setDescDifficulty((q.difficulty_level as any) || 'Medium');
      setDescMaxMarks(Number(q.max_marks || 10));
      let parsedSubs: SubQuestion[] = [];
      if (q.has_sub_questions && q.sub_questions) {
        try {
          parsedSubs = typeof q.sub_questions === 'string' ? JSON.parse(q.sub_questions) : q.sub_questions;
        } catch {}
      }
      setHasSubQuestions(parsedSubs.length > 0);
      setSubQuestions(parsedSubs);
    }
    if (q.unit_code) setSelectedUnitCode(q.unit_code);
    if (q.unit_id) setSelectedUnitId(q.unit_id);
    if (q.topic) setSelectedTopicName(q.topic);
    if (q.topic_id) setSelectedTopicId(q.topic_id);
    if (q.competency_code) setSelectedCompetencyCode(q.competency_code);

    document.getElementById('question-creator-form-card')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelBankEdit = () => {
    setEditingBankQuestionId(null);
    resetForm();
  };

  const handleResumeAllQuestions = async () => {
    const slug = getTenantSlug();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    try {
      const res = await fetch(`${API_BASE}/exams/question-bank/resume-all?tenant=${slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
      });
      if (res.ok) {
        const json = await res.json();
        setAlert({ type: 'success', message: json.message || 'All archived questions resumed successfully!' });
        await fetchQuestions();
        await fetchMasterBankQuestions();
      } else {
        setAlert({ type: 'error', message: 'Failed to resume questions.' });
      }
    } catch (err: any) {
      setAlert({ type: 'error', message: err?.message || 'Error resuming questions.' });
    }
  };

  const handleResumeSingleQuestion = async (qId: string) => {
    const slug = getTenantSlug();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    try {
      const res = await fetch(`${API_BASE}/exams/question-bank/${qId}/resume?tenant=${slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
      });
      if (res.ok) {
        setAlert({ type: 'success', message: 'Question resumed into active bank!' });
        await fetchQuestions();
        await fetchMasterBankQuestions();
      }
    } catch (err: any) {
      setAlert({ type: 'error', message: err?.message || 'Error resuming question.' });
    }
  };

  const resetForm = () => {
    setQuestionImage('');
    setEditingBankQuestionId(null);
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
      setAlert({ type: 'success', message: 'Question archived/removed from active bank. You can resume it anytime.' });
      await fetchQuestions();
      await fetchMasterBankQuestions();
    } catch {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const handleSubmitPaperForDqacApproval = async (paperId: string) => {
    const slug = getTenantSlug();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const h = { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': slug, 'Content-Type': 'application/json' };
    try {
      const paper = createdPapersList.find(p => p.id === paperId);
      let res = await fetch(`${API_BASE}/exams/papers/submit-for-dqac`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ paperId }),
      });
      if (!res.ok) {
        res = await fetch(`${API_BASE}/exams/papers`, {
          method: 'POST',
          headers: h,
          body: JSON.stringify({
            id: paperId,
            status: 'PENDING_DQAC_APPROVAL',
            code: paper?.code,
            name: paper?.name,
            maxMarks: paper?.max_marks || 40,
            passingMarks: paper?.passing_marks || 16,
          }),
        });
      }
      if (res.ok) {
        setAlert({ type: 'success', message: 'Question paper submitted for DQAC Quality Audit successfully!' });
        await fetchCreatedPapersList();
        await fetchDesignedPapers();
      } else {
        const errData = await res.json().catch(() => ({}));
        setAlert({ type: 'error', message: errData.message || 'Failed to submit for DQAC audit' });
      }
    } catch (err) {
      console.error('Submit for DQAC failed', err);
    }
  };

  const handleSavePaperDesign = async (e?: React.FormEvent, targetStatus?: string) => {
    if (e) e.preventDefault();
    const slug = getTenantSlug();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const h = { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': slug, 'Content-Type': 'application/json' };
    try {
      let u: any = {};
      try {
        u = JSON.parse(localStorage.getItem('user') || '{}');
      } catch {}
      const userId = u.id || u.sub || u.faculty_id || null;

      const currentPaper = editingPaperId ? createdPapersList.find(p => p.id === editingPaperId) : null;
      const statusToSave = targetStatus || currentPaper?.status || 'DRAFT';

      // Resolve Department dynamically matching the selected course/branch
      const courseCd = academicCascade?.course?.course_cd || '';
      const branchCd = academicCascade?.branch?.branch_cd || '';
      const courseName = (academicCascade?.course?.course_name || '').toLowerCase();
      const matchedDept = departments.find(d => 
        (branchCd && (d.code === String(branchCd) || d.name.toLowerCase() === String(branchCd).toLowerCase())) ||
        (courseCd && (d.code === String(courseCd) || d.name.toLowerCase() === String(courseCd).toLowerCase())) ||
        (courseName.includes('bba') && (d.code === '2' || d.name.toLowerCase().includes('bba')))
      );
      const resolvedDeptId = matchedDept?.id || (selectedDept && selectedDept.length > 10 ? selectedDept : null);

      const payload = {
        id: editingPaperId || undefined,
        code: paperCode,
        name: paperTitle,
        paperSet: paperSet,
        paper_set: paperSet,
        targetSections: targetSections,
        target_sections: targetSections,
        subjectId: selectedSubject || null,
        maxMarks: Number(computedEffectiveMax > 0 ? computedEffectiveMax : paperTotalMarks) || 40,
        passingMarks: Math.round((Number(computedEffectiveMax > 0 ? computedEffectiveMax : paperTotalMarks) || 40) * 0.33),
        durationMinutes: Number(paperDuration) || 60,
        type: paperType,
        sections: paperSections,
        status: statusToSave,
        departmentId: resolvedDeptId,
        colgCd: academicCascade?.college?.colg_cd ? String(academicCascade.college.colg_cd) : (slug.toLowerCase().includes('srms') ? '1' : null),
        courseCd: academicCascade?.course?.course_cd ? String(academicCascade.course.course_cd) : null,
        branchCd: academicCascade?.branch?.branch_cd ? String(academicCascade.branch.branch_cd) : null,
        batchCd: academicCascade?.batch?.batch_cd ? String(academicCascade.batch.batch_cd) : null,
        semester: academicCascade?.semester?.sem_cd ? String(academicCascade.semester.sem_cd) : null,
        section: academicCascade?.section ? String(academicCascade.section) : null,
        createdBy: userId,
        facultyId: userId,
      };
      const res = await fetch(`${API_BASE}/exams/papers`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const msg = statusToSave === 'PENDING_DQAC_APPROVAL'
          ? `Paper '${paperTitle}' (${paperCode}) submitted for DQAC Quality Audit & HOD approval!`
          : `Paper '${paperTitle}' (${paperCode}) saved as draft successfully!`;
        setAlert({ type: 'success', message: msg });
        await fetchCreatedPapersList();
        await fetchDesignedPapers();
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
      type: paperType,
      duration_minutes: Number(paperDuration) || 60,
      max_marks: Number(computedEffectiveMax > 0 ? computedEffectiveMax : paperTotalMarks) || 40,
      sections: paperSections,
      subject_name: academicCascade?.subject?.name || selectedSubject || '',
      batch_code: academicCascade?.batch?.batch_cd || '2026',
      course_name: academicCascade?.course?.course_name || '',
      department_name: academicCascade?.branch?.branch_name || 'BBA',
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
                <span className="text-[11px] font-extrabold text-[#5B4BFF] uppercase tracking-widest">
                  {academicCascade?.branch?.branch_name || facultyDeptName || 'FACULTY DEPARTMENT'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E6F9F3] text-[#00C48C] border border-[#00C48C]/20">
                  {academicCascade?.course?.course_name
                    ? `${academicCascade.course.course_name} • ${academicCascade.semester?.SemName || 'Active Hierarchy'}`
                    : 'Auto-Selected Department'}
                </span>
              </div>
              <h2 className="text-xl font-black text-[#1B1E28] dark:text-white tracking-tight uppercase mt-1">
                Faculty Assessment &amp; Question Bank Designer
              </h2>
              <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-0.5">
                Academic Hierarchy (College → Course → Branch → Batch → Semester) &amp; Question Bank Portal
              </p>
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
              {/* Dynamic Faculty Academic Hierarchy Cascading (Course & Subject Linker) */}
              <FacultyAcademicCascadingDropdown
                onlyLinkedSubjects={true}
                showSection={true}
                showSubject={true}
                onSelectionChange={handleAcademicCascadeChange}
                title="🏛️ Faculty Academic Hierarchy Cascading"
                subtitle="College → Course → Branch → Batch → Semester → Section → Subject Selection"
              />

              {/* Mode Switch & Question Creation Form */}
              <div id="question-creator-form-card" className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7EAF3] dark:border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        editingBankQuestionId ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-[#EEF2FF] text-[#5B4BFF] border border-[#5B4BFF]/30'
                      }`}>
                        {editingBankQuestionId ? '✏️ EDITING QUESTION' : '➕ CREATE QUESTION'}
                      </span>
                    </div>
                    <h3 className="text-base font-black uppercase text-[#1B1E28] dark:text-white tracking-wider mt-1">
                      {editingBankQuestionId ? '✏️ Modify Question & Weightage in Question Bank' : '📝 Create New Question for Department Question Bank'}
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 1. COURSE OUTCOME (CO) / UNIT MASTER */}
                    <div>
                      <label className="block text-xs font-black uppercase text-[#5B4BFF] dark:text-indigo-400 mb-1.5 flex items-center justify-between">
                        <span>Course Outcome (CO) / Unit Master *</span>
                        {loadingUnits && <span className="text-[10px] text-gray-400 animate-pulse font-normal">Loading...</span>}
                      </label>
                      <select
                        value={selectedUnitId}
                        onChange={(e) => handleUnitChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#5B4BFF]/40 text-[#1B1E28] dark:text-white font-bold text-xs focus:outline-none focus:border-[#F36C21] focus:ring-2 focus:ring-[#F36C21]/20 shadow-sm"
                      >
                        <option value="">— Select Course Outcome (CO) —</option>
                        {availableUnits.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2. TOPIC MASTER */}
                    <div>
                      <label className="block text-xs font-black uppercase text-[#1B1E28] dark:text-white mb-1.5 flex items-center justify-between">
                        <span>Topic Master *</span>
                        {loadingTopics && <span className="text-[10px] text-gray-400 animate-pulse font-normal">Loading...</span>}
                      </label>
                      <select
                        value={selectedTopicId}
                        onChange={(e) => handleTopicChange(e.target.value)}
                        disabled={availableTopics.length === 0}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold text-xs focus:outline-none focus:border-[#F36C21] focus:ring-2 focus:ring-[#F36C21]/20 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <option value="">{availableTopics.length === 0 ? '— No Topics Feeded in Master —' : '— Select Topic —'}</option>
                        {availableTopics.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 3. SUB TOPIC / COMPETENCY CODE */}
                    <div>
                      <label className="block text-xs font-black uppercase text-[#00C48C] dark:text-emerald-400 mb-1.5 flex items-center justify-between">
                        <span>Sub Topic / Competency Code</span>
                        {loadingCompetencies && <span className="text-[10px] text-gray-400 animate-pulse font-normal">Loading...</span>}
                      </label>
                      <select
                        value={selectedCompetencyId || selectedCompetencyCode}
                        onChange={(e) => {
                          const val = e.target.value;
                          const match = availableCompetencies.find((c) => c.id === val || c.code === val);
                          if (match) {
                            setSelectedCompetencyId(match.id || '');
                            setSelectedCompetencyCode(match.code || val);
                            setSelectedCompetencyDesc(match.description || match.name || '');
                          } else {
                            setSelectedCompetencyCode(val);
                          }
                        }}
                        disabled={availableCompetencies.length === 0}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#00C48C]/40 text-[#1B1E28] dark:text-emerald-300 font-bold text-xs focus:outline-none focus:border-[#F36C21] focus:ring-2 focus:ring-[#F36C21]/20 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <option value="">{availableCompetencies.length === 0 ? '— No Subtopics Feeded in Master —' : '— Select Sub Topic / Competency —'}</option>
                        {availableCompetencies.map((c) => (
                          <option key={c.id || c.code} value={c.id || c.code}>
                            {c.code}: {c.description || c.name || c.code}
                          </option>
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

                  {/* Image / Diagram / Formula Upload Box */}
                  <div className="p-4 rounded-[22px] bg-[#F8FAFC] dark:bg-slate-800/80 border border-dashed border-[#5B4BFF]/40 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <label className="text-xs font-black uppercase text-[#1B1E28] dark:text-slate-200 flex items-center gap-1.5">
                          <span>🖼️</span> Question Diagram / Formula / Slide Image (Optional)
                        </label>
                        <p className="text-[11px] text-[#4E5969] dark:text-slate-400 font-medium">
                          Upload anatomical figure, circuit schematic, histology slide, or chart to display in the examination question paper
                        </p>
                      </div>
                      {questionImage && (
                        <button
                          type="button"
                          onClick={() => setQuestionImage('')}
                          className="px-2.5 py-1 rounded-lg bg-[#FEECEB] text-[#F04438] hover:text-rose-600 text-[11px] font-extrabold border border-[#F04438]/20 flex items-center gap-1"
                        >
                          <span>✕</span> Remove Image
                        </button>
                      )}
                    </div>

                    {questionImage ? (
                      <div className="flex items-center gap-4 p-3 bg-white dark:bg-slate-900 rounded-xl border border-[#E7EAF3] dark:border-slate-700">
                        <img
                          src={questionImage}
                          alt="Question Preview Attachment"
                          className="h-20 w-32 object-contain rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shadow-sm"
                        />
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-[#00C48C] flex items-center gap-1">
                            ✓ Image Attached &amp; Ready to Save
                          </span>
                          <p className="text-[11px] text-[#4E5969] dark:text-slate-400">
                            This visual will render immediately below the question prompt across Question Bank ledger, Paper Designer, and Student Review Print.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2.5 p-4 rounded-xl border border-dashed border-[#5B4BFF]/50 bg-white dark:bg-slate-900 hover:bg-[#EEF2FF] dark:hover:bg-slate-800/80 cursor-pointer transition-all">
                        <span className="text-base">📷</span>
                        <span className="text-xs font-black text-[#5B4BFF]">
                          Click or drag image file here to attach (PNG, JPG, SVG, WebP up to 5MB)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                    {editingBankQuestionId && (
                      <button
                        type="button"
                        onClick={handleCancelBankEdit}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs transition"
                      >
                        ✕ Cancel Edit
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg transition"
                    >
                      {saving ? 'Saving...' : editingBankQuestionId ? `✓ Update ${mode} Question` : `💾 Save ${mode} Question to Bank`}
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
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Status Filter Tabs */}
                    <div className="flex items-center gap-1 bg-[#F8FAFC] dark:bg-slate-800 p-1 rounded-xl border border-[#E7EAF3] dark:border-slate-700 text-xs">
                      <button
                        type="button"
                        onClick={() => setBankStatusFilter('active')}
                        className={`px-3 py-1 rounded-lg font-bold text-xs transition ${bankStatusFilter === 'active' ? 'bg-[#5B4BFF] text-white shadow-xs' : 'text-[#4E5969] dark:text-slate-400'}`}
                      >
                        Active
                      </button>
                      <button
                        type="button"
                        onClick={() => setBankStatusFilter('archived')}
                        className={`px-3 py-1 rounded-lg font-bold text-xs transition ${bankStatusFilter === 'archived' ? 'bg-amber-600 text-white shadow-xs' : 'text-[#4E5969] dark:text-slate-400'}`}
                      >
                        Archived
                      </button>
                      <button
                        type="button"
                        onClick={() => setBankStatusFilter('all')}
                        className={`px-3 py-1 rounded-lg font-bold text-xs transition ${bankStatusFilter === 'all' ? 'bg-slate-800 text-white shadow-xs' : 'text-[#4E5969] dark:text-slate-400'}`}
                      >
                        All
                      </button>
                    </div>

                    {/* Resume All Questions Action Button */}
                    <button
                      type="button"
                      onClick={handleResumeAllQuestions}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                      title="Restore and un-archive all questions back into active Question Bank"
                    >
                      <span>🔄</span>
                      <span>Resume All Questions</span>
                    </button>

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
                          <th className="py-3.5 px-4 w-72">CO, Topic &amp; Competency</th>
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

                                {/* Attached Diagram Image in Ledger */}
                                {(q.image_url || q.imageUrl || (q as any).image || (q as any).diagramUrl || (q as any).diagram_url) && (
                                  <div className="flex items-center gap-2.5 mt-1.5">
                                    <img
                                      src={q.image_url || q.imageUrl || (q as any).image || (q as any).diagramUrl || (q as any).diagram_url}
                                      alt="Question Diagram"
                                      className="h-14 w-20 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white shadow-sm cursor-pointer hover:scale-105 transition-transform"
                                      onClick={() => setViewingImageModal({
                                        src: q.image_url || q.imageUrl || (q as any).image || (q as any).diagramUrl || (q as any).diagram_url,
                                        title: q.question_text,
                                      })}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setViewingImageModal({
                                        src: q.image_url || q.imageUrl || (q as any).image || (q as any).diagramUrl || (q as any).diagram_url,
                                        title: q.question_text,
                                      })}
                                      className="px-2.5 py-1 rounded-lg bg-[#EEF2FF] hover:bg-[#5B4BFF] text-[#5B4BFF] hover:text-white border border-[#5B4BFF]/20 text-[11px] font-black transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                                    >
                                      <span>📷</span>
                                      <span>Diagram Attached (Click to enlarge)</span>
                                    </button>
                                  </div>
                                )}

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

                              {/* CO, Topic & Competency */}
                              <td className="py-4 px-4 align-top space-y-1.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-black bg-[#EEF2FF] text-[#5B4BFF] border border-[#5B4BFF]/30 inline-block">
                                    🏛️ {q.unit_code || 'CO1'}
                                  </span>
                                  {q.unit_name && q.unit_name !== q.unit_code && (
                                    <span className="text-[10px] text-slate-500 font-bold truncate max-w-[130px]">{q.unit_name}</span>
                                  )}
                                </div>
                                {q.topic && (
                                  <div className="flex items-center gap-1.5 text-xs font-black text-[#2D2575] dark:text-indigo-300">
                                    <span>📚</span>
                                    <span className="truncate">{q.topic}</span>
                                  </div>
                                )}
                                {q.competency_code && (
                                  <div>
                                    <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-black bg-[#E6F9F3] text-[#00C48C] border border-[#00C48C]/30 inline-block">
                                      🎯 {q.competency_code}
                                    </span>
                                  </div>
                                )}
                              </td>

                              {/* Marks */}
                              <td className="py-4 px-4 align-top text-center font-black text-[#5B4BFF] text-sm">
                                {Number(q.max_marks || 2).toFixed(2)} Marks
                              </td>

                              {/* Action */}
                              <td className="py-4 px-4 align-top text-right">
                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                  {q.is_active === false ? (
                                    <button
                                      type="button"
                                      onClick={() => handleResumeSingleQuestion(q.id)}
                                      className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-[11px] font-black shadow-xs transition flex items-center gap-1 cursor-pointer"
                                      title="Resume question back to active bank"
                                    >
                                      <span>🔄</span>
                                      <span>Resume</span>
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleStartEditBankQuestion(q)}
                                        className="px-2.5 py-1 rounded-xl bg-[#EEF2FF] hover:bg-[#5B4BFF] text-[#5B4BFF] hover:text-white border border-[#5B4BFF]/20 text-[11px] font-black shadow-xs transition flex items-center gap-1 cursor-pointer"
                                        title="Edit question prompt, weightage, or options"
                                      >
                                        <span>✏️</span>
                                        <span>Edit</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteQuestion(q.id)}
                                        className="px-2.5 py-1 rounded-xl bg-[#FEECEB] hover:bg-rose-100 text-[#F04438] border border-[#F04438]/20 text-[11px] font-extrabold shadow-xs transition cursor-pointer"
                                        title="Archive question"
                                      >
                                        🗑️ Remove
                                      </button>
                                    </>
                                  )}
                                </div>
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
                    🏛️ {academicCascade?.college?.colg_name || tenantName || 'College'}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#E6F9F3] text-[#00C48C] font-extrabold border border-[#00C48C]/30">
                    🎓 {academicCascade?.course?.course_name || 'Course'}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#FFF4EC] text-[#F36C21] font-extrabold border border-[#F36C21]/30">
                    🏢 {academicCascade?.branch?.branch_name || facultyDeptName}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 font-extrabold border border-purple-200">
                    📅 {academicCascade?.batch?.batch_name || 'Batch'}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-extrabold border border-blue-200">
                    🔢 {academicCascade?.semester?.SemName || academicCascade?.semester?.name || 'Semester'}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-extrabold border border-emerald-200">
                    📖 {academicCascade?.subject?.name || selectedSubject || 'Subject'}
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
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[#F36C21]">[{paper.code || 'MED-PAPER'}]</span>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-white/20 text-white">
                                {paper.paper_set || 'Set A'}
                              </span>
                            </div>
                            {isEditing ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#5B4BFF] text-white animate-pulse">
                                ✏️ EDITING NOW
                              </span>
                            ) : (
                              renderPaperStatusBadge(paper.status)
                            )}
                          </div>

                          {/* Paper Card Content Body */}
                          <div className="p-5 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="text-sm font-black text-[#1B1E28] dark:text-white uppercase leading-snug">
                                  {paper.name || 'Examination Paper'}
                                </h4>
                                <span className="text-[11px] font-bold text-[#4E5969] dark:text-slate-400 block mt-0.5">
                                  {paper.subject_name || academicCascade?.subject?.name || paper.code?.split('-')[0] || 'Subject'} • {paper.batch_name || (paper.batch_code ? (paper.batch_code.startsWith('Batch') ? paper.batch_code : `Batch ${paper.batch_code}`) : (academicCascade?.batch?.batch_name || 'Current Batch'))}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#EEF2FF] text-[#5B4BFF] border border-[#5B4BFF]/20">
                                📑 {paper.paper_set || 'Set A'}
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#E6F9F3] text-[#00C48C] border border-[#00C48C]/20">
                                🎯 {Array.isArray(paper.target_sections) ? (paper.target_sections.includes('All') ? 'Common: All Sections' : paper.target_sections.join(', ')) : (paper.target_sections || 'Common (All Sections)')}
                              </span>
                            </div>

                            {/* DQAC Quality Audit Directives Box */}
                            {paper.status === 'CHANGES_REQUESTED' && (
                              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-xs space-y-1">
                                <div className="flex items-center gap-1.5 font-black text-amber-800 dark:text-amber-200">
                                  <span>⚠️</span>
                                  <span>DQAC Quality Audit Directives</span>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                                  {paper.dqac_remarks || paper.hod_remarks || 'The quality audit team has requested revisions on this question paper.'}
                                </p>
                                {paper.question_remarks && Object.keys(typeof paper.question_remarks === 'string' ? JSON.parse(paper.question_remarks || '{}') : paper.question_remarks).length > 0 && (
                                  <div className="text-[11px] text-amber-700 dark:text-amber-300 font-bold pt-0.5">
                                    📌 Flagged Questions: {Object.keys(typeof paper.question_remarks === 'string' ? JSON.parse(paper.question_remarks || '{}') : paper.question_remarks).length} question(s) flagged for replacement or mark adjustments.
                                  </div>
                                )}
                              </div>
                            )}

                            {/* DQAC Postponed Exam Paper Directives Box */}
                            {paper.status === 'POSTPONED' && (
                              <div className="p-3 rounded-xl bg-[#FFF4EC] dark:bg-amber-950/30 border border-[#F36C21]/40 text-xs space-y-1">
                                <div className="flex items-center gap-1.5 font-black text-[#F36C21]">
                                  <span>⏸️</span>
                                  <span>Examination Postponed by DQAC</span>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                                  {paper.dqac_remarks || paper.hod_remarks || 'This examination paper has been postponed by the DQAC Quality team. You may edit or clone as needed.'}
                                </p>
                              </div>
                            )}

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
                          <div className="px-5 py-3 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between gap-2 bg-[#F8FAFC]/70 dark:bg-slate-800/40">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* 1. Before HOD approved, paper remains editable */}
                              {paper.status !== 'HOD_APPROVED' ? (
                                <button
                                  type="button"
                                  onClick={() => handleEditExistingPaper(paper)}
                                  className="px-3 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4E3EFF] text-white text-xs font-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                                  title="Edit Question Paper"
                                >
                                  <span>✏️</span>
                                  <span>Edit Paper</span>
                                </button>
                              ) : (
                                <span
                                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700/60 select-none cursor-not-allowed"
                                  title="Paper is approved by HOD / locked against direct edits. Clone to create an editable new set."
                                >
                                  <span>🔒</span>
                                  <span>Edit Locked</span>
                                </span>
                              )}

                              {/* 2. Faculty can view but cannot print (locked) */}
                              <button
                                type="button"
                                onClick={() => setPreviewModalPaper(paper)}
                                className="px-3 py-2 rounded-xl bg-[#00C48C] hover:bg-[#00B07D] text-white text-xs font-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                                title="View Question Paper (Printing is restricted to Exam Dept)"
                              >
                                <span>👁️</span>
                                <span>View Paper</span>
                                <span className="text-[9px] bg-black/20 px-1.5 py-0.5 rounded font-mono font-bold">🔒 No Print</span>
                              </button>

                              {/* 3. Clone set can be done, but cloned set must be re-approved */}
                              <button
                                type="button"
                                onClick={() => handleDuplicateAsNextSet(paper)}
                                className="px-3 py-2 rounded-xl bg-[#EEF2FF] dark:bg-slate-800 text-[#5B4BFF] hover:bg-[#5B4BFF] hover:text-white text-xs font-black border border-[#5B4BFF]/30 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                                title="Duplicate paper to next set (e.g. Set B). Cloned sets start as DRAFT and require DQAC re-approval."
                              >
                                <span>📑</span>
                                <span>Clone Set</span>
                              </button>

                              {paper.status !== 'HOD_APPROVED' && (
                                <button
                                  type="button"
                                  onClick={() => handleSubmitPaperForDqacApproval(paper.id)}
                                  className="px-3 py-2 rounded-xl bg-[#F36C21] hover:bg-[#E05B10] text-white text-xs font-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                                  title="Submit paper for DQAC Quality Audit"
                                >
                                  <span>📤</span>
                                  <span>{paper.status === 'PENDING_DQAC_APPROVAL' ? 'Re-Submit DQAC' : 'Submit DQAC'}</span>
                                </button>
                              )}
                            </div>

                            {paper.status !== 'HOD_APPROVED' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteCreatedPaper(paper.id)}
                                className="p-2 rounded-xl bg-[#FEECEB] hover:bg-rose-100 text-[#F04438] text-xs font-bold transition-all shrink-0 cursor-pointer"
                                title="Delete Paper"
                              >
                                🗑️
                              </button>
                            )}
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
                          {computedEffectiveMax > 0 ? computedEffectiveMax : (paperTotalMarks || 0)} Marks
                        </div>
                        {(() => {
                          const rawPool = paperSections.reduce((acc, sec) => {
                            let secTot = sec.type === 'PRACTICAL' ? Number(sec.practicalMarks || 0) : 0;
                            (sec.questions || []).forEach((q: any) => {
                              const subQs = q.subQuestions || q.sub_questions || [];
                              if (subQs.length > 0) {
                                secTot += subQs.reduce((sum: number, sq: any) => sum + Number(sq.marks || sq.customMarks || 0), 0);
                              } else {
                                secTot += Number(q.customMarks || q.defaultMarks || (sec.defaultMarksPerQuestion ? Number(sec.defaultMarksPerQuestion) : 0));
                              }
                            });
                            return acc + secTot;
                          }, 0);
                          const eff = computedEffectiveMax > 0 ? computedEffectiveMax : Number(paperTotalMarks) || 0;
                          if (rawPool > eff && eff > 0) {
                            return (
                              <span className="text-[10px] font-semibold text-slate-400 block">
                                (Raw Pool: {rawPool} M)
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const currentDraft = {
                            id: editingPaperId || 'preview-draft',
                            code: paperCode || 'DRAFT-PAPER',
                            name: paperTitle || 'Examination Paper',
                            paper_set: paperSet || 'Set A',
                            target_sections: targetSections,
                            type: paperType,
                            duration_minutes: Number(paperDuration) || 60,
                            max_marks: Number(computedEffectiveMax > 0 ? computedEffectiveMax : paperTotalMarks) || 40,
                            passing_marks: Math.round((Number(computedEffectiveMax > 0 ? computedEffectiveMax : paperTotalMarks) || 40) * 0.33),
                            subject_name: academicCascade?.subject?.name || selectedSubject || 'Subject',
                            course_name: academicCascade?.course?.course_name,
                            semester: academicCascade?.semester?.sem_cd || null,
                            section: academicCascade?.section || null,
                            sections: paperSections,
                            status: 'DRAFT',
                          };
                          setPreviewModalPaper(currentDraft);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#00C48C] hover:bg-[#00B07D] text-white text-xs font-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Live preview how questions and diagrams appear on paper"
                      >
                        <span>👁️</span>
                        <span>Live Preview Paper</span>
                      </button>

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
                    {/* Paper Examination Mode Selector: THEORY vs PRACTICAL */}
                    <div className="p-4 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${
                          paperType === 'THEORY'
                            ? 'bg-[#5B4BFF]/10 text-[#5B4BFF]'
                            : 'bg-[#00C48C]/10 text-[#00C48C]'
                        }`}>
                          {paperType === 'THEORY' ? '📖' : '🧪'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#5B4BFF]">
                              EXAMINATION MODE
                            </span>
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {paperType === 'THEORY' ? 'Written Theory Paper' : 'Practical / Clinical / OSPE'}
                            </span>
                          </div>
                          <h4 className="text-sm font-extrabold text-[#1B1E28] dark:text-white mt-0.5">
                            {paperType === 'THEORY' ? 'Theory Examination Paper (MCQs, Descriptive, Short/Long Answers)' : 'Practical Examination (Clinical Stations, Spotting, OSPE & Viva Voce)'}
                          </h4>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-[#F8FAFC] dark:bg-slate-800 p-1.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPaperType('THEORY')}
                          className={`px-4 py-2 rounded-lg font-black text-xs flex items-center gap-1.5 transition-all ${
                            paperType === 'THEORY'
                              ? 'bg-[#5B4BFF] text-white shadow-sm'
                              : 'text-[#4E5969] dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <span>📖</span>
                          <span>THEORY MODE</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaperType('PRACTICAL')}
                          className={`px-4 py-2 rounded-lg font-black text-xs flex items-center gap-1.5 transition-all ${
                            paperType === 'PRACTICAL'
                              ? 'bg-[#00C48C] text-white shadow-sm'
                              : 'text-[#4E5969] dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <span>🧪</span>
                          <span>PRACTICAL MODE</span>
                        </button>
                      </div>
                    </div>

                    {/* Paper Header Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                      <div className="lg:col-span-2">
                        <label className="block text-xs font-black uppercase text-[#1B1E28] dark:text-white mb-1.5">
                          Exam Paper Title
                        </label>
                        <input
                          type="text"
                          value={paperTitle}
                          onChange={(e) => setPaperTitle(e.target.value)}
                          placeholder="Enter exam paper title (e.g. Sessional Exam)..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold text-xs focus:outline-none focus:border-[#F36C21] focus:ring-2 focus:ring-[#F36C21]/20 shadow-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase text-[#1B1E28] dark:text-white mb-1.5">
                          Paper Code
                        </label>
                        <input
                          type="text"
                          value={paperCode}
                          onChange={(e) => setPaperCode(e.target.value)}
                          placeholder="e.g. BCS503-2026-T1"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-mono font-black text-xs focus:outline-none focus:border-[#F36C21] focus:ring-2 focus:ring-[#F36C21]/20 shadow-sm"
                        />
                      </div>

                      {/* Paper Set Selector */}
                      <div>
                        <label className="block text-xs font-black uppercase text-[#F36C21] dark:text-orange-400 mb-1.5">
                          Paper Set *
                        </label>
                        <select
                          value={paperSet}
                          onChange={(e) => setPaperSet(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#F36C21]/50 text-[#F36C21] font-black text-xs focus:outline-none focus:border-[#F36C21] focus:ring-2 focus:ring-[#F36C21]/20 shadow-sm"
                        >
                          <option value="Set A">📑 Set A</option>
                          <option value="Set B">📑 Set B</option>
                          <option value="Set C">📑 Set C</option>
                          <option value="Set D">📑 Set D</option>
                          <option value="Set E">📑 Set E</option>
                        </select>
                      </div>

                      {/* Target Section (Section A, Section B, or Common) */}
                      <div>
                        <label className="block text-xs font-black uppercase text-[#5B4BFF] dark:text-indigo-400 mb-1.5">
                          Target Student Section *
                        </label>
                        <select
                          value={targetSections[0] || 'All'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTargetSections(val === 'All' ? ['All'] : [val]);
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#5B4BFF]/50 text-[#5B4BFF] font-black text-xs focus:outline-none focus:border-[#F36C21] focus:ring-2 focus:ring-[#F36C21]/20 shadow-sm"
                        >
                          <option value="All">🌐 All Sections (Common Exam)</option>
                          <option value="Section A">🎯 Section A Only</option>
                          <option value="Section B">🎯 Section B Only</option>
                          <option value="Section C">🎯 Section C Only</option>
                          <option value="Section D">🎯 Section D Only</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-black uppercase text-[#1B1E28] dark:text-slate-300">
                            Time &amp; Marks *
                          </label>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            title="Duration Minutes"
                            value={paperDuration === '' ? '' : paperDuration}
                            onChange={(e) => setPaperDuration(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full px-2 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-black text-xs text-center focus:outline-none focus:border-[#F36C21] shadow-sm"
                            placeholder="Mins (e.g. 60)"
                          />
                          <div className="relative">
                            <input
                              type="number"
                              title="Total Target Marks (Computed Effective Max)"
                              value={computedEffectiveMax > 0 ? computedEffectiveMax : (paperTotalMarks === '' ? '' : paperTotalMarks)}
                              onChange={(e) => setPaperTotalMarks(e.target.value === '' ? '' : Number(e.target.value))}
                              className="w-full px-2 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-[#00C48C]/40 text-[#00C48C] font-black text-xs text-center shadow-sm"
                              placeholder="Marks (Auto)"
                            />
                            <span className="text-[9px] font-bold text-slate-400 block text-center mt-0.5">
                              Effective Max (Pass: {Math.round((Number(computedEffectiveMax > 0 ? computedEffectiveMax : paperTotalMarks) || 0) * 0.33)} M &bull; 33%)
                            </span>
                          </div>
                        </div>
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

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setShowScoringSimulation(true)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow transition-all flex items-center gap-1.5 whitespace-nowrap"
                          title="Simulate paper scoring and choice group rules"
                        >
                          <span>📊</span>
                          <span>Live Scoring Simulation</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleAddSection}
                          className="px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4E3EFF] text-white font-black text-xs shadow transition-all flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <span>➕</span>
                          <span>Add New Section (A, B, C...)</span>
                        </button>
                      </div>
                    </div>

                    {paperSections.map((sec, secIdx) => {
                      const secMarks = sec.questions.reduce((acc: number, q: any) => {
                        const subQs = q.subQuestions || q.sub_questions || [];
                        if (subQs.length > 0) {
                          return acc + subQs.reduce((sum: number, sq: any) => sum + Number(sq.marks || sq.customMarks || 0), 0);
                        }
                        return acc + Number(q.customMarks || q.defaultMarks || 0);
                      }, 0) + (sec.type === 'PRACTICAL' ? Number(sec.practicalMarks || 0) : 0);

                      const rawTargetM = sec.targetQuestionsCount;
                      const hasTargetM = rawTargetM !== '' && rawTargetM !== undefined && rawTargetM !== null && !isNaN(Number(rawTargetM)) && Number(rawTargetM) > 0;
                      const targetM = hasTargetM ? Number(rawTargetM) : sec.questions.length;

                      const isChoiceMode = sec.attemptRule === 'CHOICE';
                      const rawReqN = sec.requiredToAttempt;
                      const hasReqN = rawReqN !== '' && rawReqN !== undefined && rawReqN !== null && !isNaN(Number(rawReqN)) && Number(rawReqN) > 0;
                      const requiredN = isChoiceMode ? (hasReqN ? Number(rawReqN) : (targetM > 1 ? targetM - 1 : 1)) : targetM;

                      const rawMarksPerQ = sec.defaultMarksPerQuestion;
                      const hasMarksPerQ = rawMarksPerQ !== '' && rawMarksPerQ !== undefined && rawMarksPerQ !== null && !isNaN(Number(rawMarksPerQ)) && Number(rawMarksPerQ) > 0;
                      const marksPerQ = hasMarksPerQ ? Number(rawMarksPerQ) : 0;

                      let effectiveSecMarks = 0;
                      if (sec.questions.length > 0) {
                        const marksList = sec.questions.map((q: any) => {
                          const subQs = q.subQuestions || q.sub_questions || [];
                          if (subQs.length > 0) {
                            return subQs.reduce((sum: number, sq: any) => sum + Number(sq.marks || sq.customMarks || 0), 0);
                          }
                          return Number(q.customMarks || q.defaultMarks || marksPerQ || 0);
                        });
                        marksList.sort((a: number, b: number) => b - a);
                        const countToTake = isChoiceMode && requiredN > 0 ? Math.min(requiredN, marksList.length) : marksList.length;
                        effectiveSecMarks = marksList.slice(0, countToTake).reduce((acc: number, v: number) => acc + v, 0);
                      } else {
                        // If questions are not added yet, only compute planned weightage if user specifically typed planned values
                        if (isChoiceMode && hasReqN && hasMarksPerQ) {
                          effectiveSecMarks = requiredN * marksPerQ;
                        } else if (!isChoiceMode && hasTargetM && hasMarksPerQ) {
                          effectiveSecMarks = targetM * marksPerQ;
                        } else {
                          effectiveSecMarks = 0;
                        }
                      }
                      if (sec.type === 'PRACTICAL' && sec.practicalMarks) {
                        effectiveSecMarks += Number(sec.practicalMarks || 0);
                      }

                      return (
                        <div key={sec.id} className="p-5 rounded-[22px] bg-[#F8FAFC] dark:bg-slate-800/80 border border-[#E7EAF3] dark:border-slate-700 space-y-4">
                          {/* Section Header Controls */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E7EAF3] dark:border-slate-700 pb-3">
                            <div className="flex items-center gap-3 flex-1 flex-wrap">
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
                                <option value="DESC">Section Type: Descriptive / Theory</option>
                                <option value="MCQ">Section Type: MCQs</option>
                                <option value="PRACTICAL">Section Type: Practical / OSPE</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => setBlueprintModalSecId(sec.id)}
                                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#2D2575] to-[#5B4BFF] hover:from-[#241d63] hover:to-[#4e3eff] text-white font-black text-xs shadow-sm flex items-center gap-1 cursor-pointer transition-all"
                                title="Auto-generate questions from blueprint rules"
                              >
                                <span>✨</span>
                                <span>Blueprint Auto-Gen</span>
                              </button>

                              <div className="flex items-center bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 rounded-xl overflow-hidden shadow-xs">
                                <button
                                  type="button"
                                  disabled={secIdx === 0}
                                  onClick={() => handleMoveSectionUp(secIdx)}
                                  className="px-2 py-1 text-xs font-black text-[#4E5969] hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Move Section Up"
                                >
                                  ▲
                                </button>
                                <button
                                  type="button"
                                  disabled={secIdx === paperSections.length - 1}
                                  onClick={() => handleMoveSectionDown(secIdx)}
                                  className="px-2 py-1 text-xs font-black text-[#4E5969] hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed border-l border-[#E7EAF3] dark:border-slate-700"
                                  title="Move Section Down"
                                >
                                  ▼
                                </button>
                              </div>

                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-black text-[#5B4BFF] bg-[#EEF2FF] dark:bg-indigo-950/60 border border-[#5B4BFF]/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                                  <span>Weightage:</span>
                                  <span className="text-sm font-extrabold">
                                    {sec.ruleMaxPolicy === 'STUDENT_WISE'
                                      ? 'Varies per student'
                                      : effectiveSecMarks > 0
                                      ? `${effectiveSecMarks} Marks`
                                      : '0 Marks (Planned)'}
                                  </span>
                                </span>
                                {isChoiceMode && hasReqN && hasTargetM && (
                                  <span className="text-[10px] font-extrabold text-[#F36C21] bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800/60 px-2 py-0.5 rounded-full">
                                    Attempt {requiredN} of {targetM}
                                  </span>
                                )}
                              </div>

                              {paperSections.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSection(sec.id)}
                                  className="text-xs text-[#F04438] hover:text-rose-600 font-extrabold px-2.5 py-1 rounded-lg bg-[#FEECEB] border border-[#F04438]/20"
                                >
                                  ✕ Remove
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Section Description */}
                          <div>
                            <input
                              type="text"
                              value={sec.description || ''}
                              placeholder="Section instructions or description (optional)..."
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
                                  value={sec.practicalMarks || ''}
                                  onChange={(e) => handleUpdateSectionMeta(sec.id, 'practicalMarks', e.target.value === '' ? '' : Number(e.target.value))}
                                  placeholder="e.g. 20"
                                  className="w-24 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-[#7867FF]/50 text-[#7867FF] font-black text-xs text-center"
                                />
                              </div>
                            </div>
                          )}

                          {/* Section Question Planning & Attempt Configuration Card */}
                          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 shadow-xs space-y-3.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E7EAF3] dark:border-slate-800 pb-2.5">
                              <span className="text-xs font-black text-[#2D2575] dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                                <span>⚙️</span> Section Question Planning &amp; Attempt Rules
                              </span>
                              <span className="text-[11px] font-bold text-[#4E5969] dark:text-slate-400">
                                Questions in Section: <span className="text-[#5B4BFF] font-black">{sec.questions.length}</span>
                                {hasTargetM ? ` / ${targetM} planned` : ' questions added'}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {/* Planned Question Count M */}
                              <div>
                                <label className="block text-[10px] font-black uppercase text-[#1B1E28] dark:text-slate-300 mb-1">
                                  1. Questions to Add in Section (M)
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  max={100}
                                  value={sec.targetQuestionsCount !== undefined && sec.targetQuestionsCount !== null ? sec.targetQuestionsCount : ''}
                                  onChange={(e) => handleUpdateSectionMeta(sec.id, 'targetQuestionsCount', e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-black text-xs text-center focus:outline-none focus:border-[#5B4BFF]"
                                  placeholder="e.g. 5 (or leave blank)"
                                />
                                <span className="text-[10px] text-[#4E5969] dark:text-slate-400 font-medium">Planned question count (or leave blank)</span>
                              </div>

                              {/* Marks Per Question Mode (Condition-Based) */}
                              <div>
                                <label className="block text-[10px] font-black uppercase text-[#1B1E28] dark:text-slate-300 mb-1">
                                  2. Marks Allocation Condition *
                                </label>
                                <div className="grid grid-cols-2 gap-1 p-0.5 bg-[#F8FAFC] dark:bg-slate-800 rounded-xl border border-[#E7EAF3] dark:border-slate-700 mb-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateSectionMeta(sec.id, 'marksCondition', 'UNIFORM')}
                                    className={`py-1 px-1.5 rounded-lg text-[10px] font-black transition-all ${
                                      sec.marksCondition !== 'VARIABLE'
                                        ? 'bg-[#5B4BFF] text-white shadow-xs'
                                        : 'text-[#4E5969] dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                  >
                                    Uniform Marks
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateSectionMeta(sec.id, 'marksCondition', 'VARIABLE')}
                                    className={`py-1 px-1.5 rounded-lg text-[10px] font-black transition-all ${
                                      sec.marksCondition === 'VARIABLE'
                                        ? 'bg-[#F36C21] text-white shadow-xs'
                                        : 'text-[#4E5969] dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                  >
                                    Variable / Subparts
                                  </button>
                                </div>

                                {sec.marksCondition === 'VARIABLE' ? (
                                  <div className="space-y-1">
                                    <input
                                      type="number"
                                      min={1}
                                      value={sec.defaultMarksPerQuestion !== undefined && sec.defaultMarksPerQuestion !== null ? sec.defaultMarksPerQuestion : ''}
                                      onChange={(e) => handleUpdateSectionMeta(sec.id, 'defaultMarksPerQuestion', e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                                      className="w-full px-3 py-1.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-black text-xs text-center focus:outline-none focus:border-[#5B4BFF]"
                                      placeholder="Default pre-fill (optional)"
                                    />
                                    <span className="text-[9.5px] text-[#4E5969] dark:text-slate-400 font-medium block leading-tight">
                                      Multiple parts or questions have different marks. Set on each question &amp; sub-part.
                                    </span>
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <input
                                      type="number"
                                      min={1}
                                      max={100}
                                      value={sec.defaultMarksPerQuestion !== undefined && sec.defaultMarksPerQuestion !== null ? sec.defaultMarksPerQuestion : ''}
                                      onChange={(e) => handleUpdateSectionMeta(sec.id, 'defaultMarksPerQuestion', e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                                      className="w-full px-3 py-1.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-black text-xs text-center focus:outline-none focus:border-[#5B4BFF]"
                                      placeholder="e.g. 5"
                                    />
                                    <span className="text-[9.5px] text-[#4E5969] dark:text-slate-400 font-medium block leading-tight">
                                      All questions in this section carry the same marks.
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Attempt Requirement Mode */}
                              <div>
                                <label className="block text-[10px] font-black uppercase text-[#1B1E28] dark:text-slate-300 mb-1">
                                  3. Student Attempt Rule *
                                </label>
                                <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F8FAFC] dark:bg-slate-800 rounded-xl border border-[#E7EAF3] dark:border-slate-700">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateSectionMeta(sec.id, 'attemptRule', 'ALL')}
                                    className={`py-1.5 px-2 rounded-lg text-xs font-black transition-all ${
                                      !isChoiceMode
                                        ? 'bg-[#5B4BFF] text-white shadow-xs'
                                        : 'text-[#4E5969] dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                  >
                                    All Mandatory
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateSectionMeta(sec.id, 'attemptRule', 'CHOICE')}
                                    className={`py-1.5 px-2 rounded-lg text-xs font-black transition-all ${
                                      isChoiceMode
                                        ? 'bg-[#F36C21] text-white shadow-xs'
                                        : 'text-[#4E5969] dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                  >
                                    Choice (N of M)
                                  </button>
                                </div>
                                <span className="text-[10px] text-[#4E5969] dark:text-slate-400 font-medium">
                                  {isChoiceMode ? 'Students attempt any N of M questions' : 'All questions mandatory'}
                                </span>
                              </div>
                            </div>

                            {/* Choice Rule Specific Parameters (when CHOICE is active) */}
                            {isChoiceMode && (
                              <div className="p-3.5 rounded-xl bg-gradient-to-r from-orange-50/80 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/10 border border-orange-200 dark:border-orange-800/50 space-y-2.5">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-black uppercase text-orange-900 dark:text-orange-300 mb-1">
                                      Required to Attempt (N) *
                                    </label>
                                    <input
                                      type="number"
                                      min={1}
                                      max={Math.max(1, targetM > 1 ? targetM - 1 : 99)}
                                      value={sec.requiredToAttempt !== undefined && sec.requiredToAttempt !== null ? sec.requiredToAttempt : ''}
                                      onChange={(e) => handleUpdateSectionMeta(sec.id, 'requiredToAttempt', e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-orange-300 dark:border-orange-700 text-orange-950 dark:text-orange-200 font-black text-xs text-center focus:outline-none focus:border-[#F36C21]"
                                      placeholder="e.g. 2"
                                    />
                                    <span className="text-[10px] text-orange-700 dark:text-orange-400 font-medium">
                                      {sec.requiredToAttempt ? `Students only evaluated for ${sec.requiredToAttempt} questions` : 'Enter required questions'}
                                    </span>
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-black uppercase text-orange-900 dark:text-orange-300 mb-1">
                                      Over-Attempt Policy *
                                    </label>
                                    <select
                                      value={sec.overAttemptPolicy || OverAttemptPolicy.BEST_N}
                                      onChange={(e) => handleUpdateSectionMeta(sec.id, 'overAttemptPolicy', e.target.value)}
                                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-orange-300 dark:border-orange-700 text-[#1B1E28] dark:text-white font-black text-xs focus:outline-none focus:border-[#F36C21]"
                                    >
                                      <option value="BEST_N">BEST_N (Score top {requiredN} highest answers)</option>
                                      <option value="FIRST_N">FIRST_N (Score first {requiredN} in paper order)</option>
                                      <option value="REJECT">REJECT (Block submission if &gt; {requiredN})</option>
                                    </select>
                                    <span className="text-[10px] text-orange-700 dark:text-orange-400 font-medium">Rule if student attempts extra</span>
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-black uppercase text-orange-900 dark:text-orange-300 mb-1">
                                      Rule Max Policy *
                                    </label>
                                    <select
                                      value={sec.ruleMaxPolicy || 'EQUAL_MARKS_REQUIRED'}
                                      onChange={(e) => handleUpdateSectionMeta(sec.id, 'ruleMaxPolicy', e.target.value)}
                                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-orange-300 dark:border-orange-700 text-[#1B1E28] dark:text-white font-black text-xs focus:outline-none focus:border-[#F36C21]"
                                    >
                                      <option value="EQUAL_MARKS_REQUIRED">Equal Marks Required (Standard)</option>
                                      <option value="TOP_N_MAX">Top-N Max Marks (Fairness Notice)</option>
                                      <option value="STUDENT_WISE">Student-Wise Max</option>
                                    </select>
                                    <span className="text-[10px] text-orange-700 dark:text-orange-400 font-medium">Section max calculation policy</span>
                                  </div>
                                </div>

                                {/* Plain-language live helper line */}
                                <div className="p-2.5 rounded-lg bg-orange-100/70 dark:bg-orange-950/40 border border-orange-300 dark:border-orange-800 text-[11px] text-orange-900 dark:text-orange-200 font-semibold flex items-center gap-2">
                                  <span className="text-sm shrink-0">ℹ️</span>
                                  <span>
                                    Students answer any <b>{requiredN}</b> of <b>{targetM}</b> questions. Marks are counted for {requiredN} questions only. Leaving the other {Math.max(0, targetM - requiredN)} unanswered will not reduce the percentage.
                                  </span>
                                </div>

                                {/* Check for unequal marks under EQUAL_MARKS_REQUIRED */}
                                {(() => {
                                  const secQs = sec.questions || [];
                                  if (secQs.length < 2 || sec.ruleMaxPolicy === 'STUDENT_WISE' || sec.ruleMaxPolicy === 'TOP_N_MAX') return null;
                                  const marksArray = secQs.map((q: any) => {
                                    const subQs = q.subQuestions || q.sub_questions || [];
                                    if (subQs.length > 0) {
                                      return subQs.reduce((sum: number, sq: any) => sum + Number(sq.marks || sq.customMarks || sq.defaultMarks || 0), 0);
                                    }
                                    return Number(q.customMarks || q.defaultMarks || marksPerQ);
                                  });
                                  const hasUnequal = marksArray.some((m: number) => m !== marksArray[0]);
                                  if (!hasUnequal) return null;
                                  return (
                                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
                                      <span>⚠️ Questions in this section have unequal marks. Equal Marks policy requires all questions to carry identical total marks.</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPaperSections(prev => prev.map(s => {
                                            if (s.id !== sec.id) return s;
                                            return {
                                              ...s,
                                              questions: s.questions.map((q: any) => ({
                                                ...q,
                                                customMarks: marksPerQ,
                                                defaultMarks: marksPerQ,
                                              }))
                                            };
                                          }));
                                        }}
                                        className="px-2.5 py-1 rounded bg-[#5B4BFF] text-white text-[10px] font-black hover:bg-[#4E3EFF] shrink-0 ml-2"
                                      >
                                        Make All Equal ({marksPerQ} Marks)
                                      </button>
                                    </div>
                                  );
                                })()}

                                {/* Weightage Guarantee Banner */}
                                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-orange-200 dark:border-orange-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base">🎯</span>
                                    <div>
                                      <span className="font-black text-[#1B1E28] dark:text-white">Section Weightage: </span>
                                      <span className="font-extrabold text-[#5B4BFF] text-sm">
                                        {sec.ruleMaxPolicy === 'STUDENT_WISE' ? 'Varies per student' : `${effectiveSecMarks} Marks`}
                                      </span>
                                      {sec.ruleMaxPolicy !== 'STUDENT_WISE' && (
                                        <span className="text-[#4E5969] dark:text-slate-400 text-[11px] ml-1.5">
                                          ({requiredN} required attempts × {marksPerQ} marks)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-[10px] text-[#4E5969] dark:text-slate-400 italic">
                                    💡 Note: {Math.max(0, targetM - requiredN)} optional question(s) will NEVER reduce student percentage or inflate maximum marks.
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Question Count Progress Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs bg-[#F8FAFC] dark:bg-slate-800/60 px-3 py-2 rounded-xl border border-[#E7EAF3] dark:border-slate-800">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="font-bold text-[#1B1E28] dark:text-slate-200 whitespace-nowrap">
                                  Progress: {sec.questions.length} {hasTargetM ? `/ ${targetM} Added` : 'Questions Added'}
                                </span>
                                {hasTargetM && (
                                  <div className="w-24 sm:w-36 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-[#5B4BFF] to-[#00C48C] transition-all duration-300"
                                      style={{ width: `${Math.min(100, (sec.questions.length / Math.max(1, targetM)) * 100)}%` }}
                                    />
                                  </div>
                                )}
                              </div>

                              {hasTargetM && sec.questions.length < targetM ? (
                                <button
                                  type="button"
                                  onClick={() => setBlueprintModalSecId(sec.id)}
                                  className="px-2.5 py-1 rounded-lg bg-[#5B4BFF]/10 hover:bg-[#5B4BFF]/20 text-[#5B4BFF] font-black text-[11px] flex items-center gap-1 transition-all w-fit"
                                  title={`Auto-pick remaining ${targetM - sec.questions.length} questions`}
                                >
                                  <span>✨</span>
                                  <span>Add Remaining {targetM - sec.questions.length} via Blueprint</span>
                                </button>
                              ) : hasTargetM && sec.questions.length >= targetM ? (
                                <span className="text-[11px] font-black text-[#00C48C] flex items-center gap-1">
                                  <span>✓</span>
                                  <span>All {targetM} planned questions added</span>
                                </span>
                              ) : null}
                            </div>
                          </div>

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

                            {/* Step 1, 2, 3, 4 Filters Bar */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
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

                              {/* Step 2: Unit / Course Outcome (CO) Filter */}
                              <div>
                                <label className="block text-[10px] font-black uppercase text-[#5B4BFF] dark:text-indigo-400 mb-1">
                                  2. SELECT UNIT / COURSE OUTCOME (CO) *
                                </label>
                                <select
                                  value={secFilters[sec.id]?.unit || 'ALL'}
                                  onChange={(e) => handleUpdateSectionFilter(sec.id, 'unit', e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#5B4BFF]/40 text-[#5B4BFF] font-black text-xs focus:outline-none focus:border-[#F36C21]"
                                >
                                  <option value="ALL">— All Units / COs ({availableUnits.length}) —</option>
                                  {availableUnits.map(u => (
                                    <option key={u.id || u.code} value={u.code || u.id}>
                                      {u.code}: {u.name ? (u.name.length > 30 ? u.name.slice(0, 30) + '...' : u.name) : u.code}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Step 3: Topic Filter (Cascaded from CO) */}
                              {(() => {
                                const currentUnit = secFilters[sec.id]?.unit || 'ALL';
                                const filteredTopics = currentUnit !== 'ALL'
                                  ? availableTopics.filter(t => !t.unit_code || t.unit_code === currentUnit || t.id.includes(currentUnit) || t.code?.includes(currentUnit))
                                  : availableTopics;
                                const finalTopics = filteredTopics;

                                return (
                                  <div>
                                    <label className="block text-[10px] font-black uppercase text-[#1B1E28] dark:text-slate-300 mb-1">
                                      3. SELECT TOPIC (CO CASCADE)
                                    </label>
                                    <select
                                      value={secFilters[sec.id]?.topic || 'ALL'}
                                      onChange={(e) => handleUpdateSectionFilter(sec.id, 'topic', e.target.value)}
                                      disabled={finalTopics.length === 0}
                                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold text-xs focus:outline-none focus:border-[#F36C21] disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                      <option value="ALL">
                                        {finalTopics.length === 0 ? '— No Topics Feeded in Master —' : `— All Topics (${finalTopics.length}) —`}
                                      </option>
                                      {finalTopics.map(t => (
                                        <option key={t.id} value={t.name}>{t.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                );
                              })()}

                              {/* Step 4: Competency / Subtopic Filter (Cascaded from Topic) */}
                              {(() => {
                                const currentTopicName = secFilters[sec.id]?.topic || 'ALL';
                                const selTopicObj = availableTopics.find(t => t.name === currentTopicName || t.id === currentTopicName);
                                const sectionCompetencies = (currentTopicName !== 'ALL' && selTopicObj)
                                  ? dbCompetencies.filter(c => c.topic_id === selTopicObj.id || (selTopicObj.code && c.code?.startsWith(selTopicObj.code)))
                                  : (currentTopicName === 'ALL' ? availableCompetencies : []);

                                return (
                                  <div>
                                    <label className="block text-[10px] font-black uppercase text-[#00C48C] dark:text-emerald-400 mb-1">
                                      4. SELECT SUBTOPIC / COMPETENCY (TOPIC CASCADE)
                                    </label>
                                    <select
                                      value={secFilters[sec.id]?.competency || 'ALL'}
                                      onChange={(e) => handleUpdateSectionFilter(sec.id, 'competency', e.target.value)}
                                      disabled={sectionCompetencies.length === 0}
                                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#00C48C]/40 text-[#1B1E28] dark:text-emerald-300 font-black text-xs focus:outline-none focus:border-[#F36C21] disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                      <option value="ALL">
                                        {sectionCompetencies.length === 0 ? '— No Subtopics Feeded in Master —' : `— All Subtopics / COs (${sectionCompetencies.length}) —`}
                                      </option>
                                      {sectionCompetencies.map(c => (
                                        <option key={c.id || c.code} value={c.code}>
                                          {c.code}: {c.description ? (c.description.length > 30 ? c.description.slice(0, 30) + '...' : c.description) : c.code}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Step 5: Questions Checklist Table */}
                            {(() => {
                              const secF = secFilters[sec.id] || { type: sec.type || 'ALL', unit: 'ALL', topic: 'ALL', competency: 'ALL' };
                              const getRootCode = (s?: string) => {
                                if (!s) return '';
                                const m = s.match(/^([A-Za-z]+\s*\d+(?:\.\d+)?)/);
                                return m ? m[1].replace(/\s+/g, '').toLowerCase() : s.toLowerCase().trim();
                              };

                              const availableFiltered = masterBankQuestions.filter(q => {
                                const matchType = secF.type === 'ALL' || q.mode === secF.type;

                                let matchUnit = true;
                                if (secF.unit && secF.unit !== 'ALL') {
                                  const uCode = secF.unit.toLowerCase().trim();
                                  matchUnit = Boolean(
                                    (q.unit_code && q.unit_code.toLowerCase().trim() === uCode) ||
                                    (q.unit_id && q.unit_id === secF.unit) ||
                                    (q.unit_name && q.unit_name.toLowerCase().includes(uCode)) ||
                                    (q.topic_code && q.topic_code.toLowerCase().includes(uCode)) ||
                                    (q.topic && q.topic.toLowerCase().includes(uCode)) ||
                                    (q.competency_code && q.competency_code.toLowerCase().includes(uCode))
                                  );
                                }

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

                                return matchType && matchUnit && matchTopic && matchComp;
                              });

                              const checkedList = secCheckedQIds[sec.id] || [];

                              return (
                                <div className="space-y-3 pt-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-[#5B4BFF]">
                                      Step 5: Check questions to add to {sec.name} ({availableFiltered.length} Questions for {secF.unit === 'ALL' ? 'All Units / COs' : secF.unit})
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
                                      No questions match the selected unit, topic or competency filter. Try selecting a different Unit / CO or Topic dropdown.
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
                                                {(q.image_url || q.imageUrl || (q as any).image || (q as any).diagramUrl || (q as any).diagram_url) && (
                                                  <div className="mt-1.5 flex items-center gap-2">
                                                    <img
                                                      src={q.image_url || q.imageUrl || (q as any).image || (q as any).diagramUrl || (q as any).diagram_url}
                                                      alt="Diagram"
                                                      className="h-14 w-20 object-contain rounded-lg border border-[#E7EAF3] dark:border-slate-700 bg-white p-0.5 shadow-xs cursor-pointer hover:scale-105 transition-transform"
                                                      onClick={() => setViewingImageModal({
                                                        src: q.image_url || q.imageUrl || (q as any).image || (q as any).diagramUrl || (q as any).diagram_url,
                                                        title: q.question_text || '',
                                                      })}
                                                    />
                                                    <button
                                                      type="button"
                                                      onClick={() => setViewingImageModal({
                                                        src: q.image_url || q.imageUrl || (q as any).image || (q as any).diagramUrl || (q as any).diagram_url,
                                                        title: q.question_text || '',
                                                      })}
                                                      className="text-[10px] font-bold text-[#5B4BFF] hover:underline flex items-center gap-1 cursor-pointer"
                                                    >
                                                      <span>📷</span>
                                                      <span>View Diagram</span>
                                                    </button>
                                                  </div>
                                                )}
                                                <div className="flex flex-wrap items-center gap-2 text-[10px]">
                                                  <span className="px-2 py-0.5 rounded-full font-mono font-black bg-[#EEF2FF] text-[#5B4BFF] border border-[#5B4BFF]/30">
                                                    🏛️ {q.unit_code || 'CO1'}
                                                  </span>
                                                  <span className={`px-2 py-0.5 rounded-full font-black border ${
                                                    q.mode === 'MCQ' ? 'bg-[#EEF2FF] text-[#5B4BFF] border-[#5B4BFF]/30' : 'bg-purple-100 text-purple-700 border-purple-300'
                                                  }`}>
                                                    {q.mode}
                                                  </span>
                                                  {q.competency_code && (
                                                    <span className="px-2 py-0.5 rounded-full font-mono font-black bg-[#E6F9F3] text-[#00C48C] border border-[#00C48C]/30">
                                                      🎯 {q.competency_code}
                                                    </span>
                                                  )}
                                                  {q.topic && (
                                                    <span className="px-2 py-0.5 rounded-full font-bold bg-[#FFF4EC] text-[#F36C21] border border-[#F36C21]/30">
                                                      📚 {q.topic}
                                                    </span>
                                                  )}
                                                  </div>

                                                  {/* Subquestions breakdown tree in picker before adding */}
                                                  {(() => {
                                                    const qSubs = q.sub_questions || (q as any).subQuestions;
                                                    const curMarks = pickerTotalMarks[q.id] !== undefined ? pickerTotalMarks[q.id] : Number(q.max_marks || 2);
                                                    if (!Array.isArray(qSubs) || qSubs.length === 0) return null;
                                                    return (
                                                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 space-y-1.5">
                                                        <span className="text-[10px] font-black uppercase text-[#5B4BFF] tracking-wider block">
                                                          Sub-Questions Marks (Sum: {Number(curMarks).toFixed(1)} Marks):
                                                        </span>
                                                        {qSubs.map((sq: any) => {
                                                          const sqKey = sq.id || sq.label;
                                                          const curSubMark = pickerSubMarks[q.id]?.[sqKey] !== undefined ? pickerSubMarks[q.id][sqKey] : Number(sq.marks || 1);
                                                          return (
                                                            <div key={sqKey} className="flex items-center justify-between gap-2 text-[11px] bg-slate-50 dark:bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                                                <span className="font-mono font-black text-[#5B4BFF] text-[10px]">{sq.label || '•'}</span>
                                                                <span className="text-slate-700 dark:text-slate-300 truncate text-[11px]">{sq.questionText}</span>
                                                              </div>
                                                              <div className="flex items-center gap-1 shrink-0">
                                                                <span className="text-[9px] font-bold text-slate-500">Marks:</span>
                                                                <input
                                                                  type="number"
                                                                  min={0.5}
                                                                  step={0.5}
                                                                  disabled={isAlreadyInSec}
                                                                  value={curSubMark}
                                                                  onChange={(e) => handlePickerSubMarkChange(q.id, sqKey, Number(e.target.value), qSubs)}
                                                                  className="w-12 px-1 py-0.5 rounded bg-white dark:bg-slate-800 border border-[#00C48C]/50 text-[#00C48C] font-black text-[11px] text-center"
                                                                />
                                                              </div>
                                                            </div>
                                                          );
                                                        })}
                                                      </div>
                                                    );
                                                  })()}
                                                </div>
                                              </div>

                                              <div className="flex items-center gap-2 shrink-0">
                                                {/* Editable Total Marks before adding */}
                                                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                                  <span className="text-[10px] font-bold text-slate-500">Marks:</span>
                                                  <input
                                                    type="number"
                                                    min={0.5}
                                                    step={0.5}
                                                    disabled={isAlreadyInSec}
                                                    value={pickerTotalMarks[q.id] !== undefined ? pickerTotalMarks[q.id] : Number(q.max_marks || 2)}
                                                    onChange={(e) => handlePickerTotalMarksChange(q.id, Number(e.target.value), q.sub_questions || (q as any).subQuestions)}
                                                    className="w-14 px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-[#5B4BFF]/40 text-[#5B4BFF] font-black text-xs text-center focus:outline-none focus:border-[#F36C21]"
                                                    title="Change total question marks before adding"
                                                  />
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
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>

                          {/* Choice Groups Manager within Section */}
                          {sec.choiceGroups && sec.choiceGroups.length > 0 && (
                            <div className="pt-2">
                              <ChoiceGroupManager
                                sectionId={sec.id}
                                choiceGroups={sec.choiceGroups}
                                questionsMap={allPaperQuestionsMap}
                                onUpdateGroup={(gId, updates) => handleUpdateChoiceGroup(sec.id, gId, updates)}
                                onRemoveGroup={(gId) => handleRemoveChoiceGroup(sec.id, gId)}
                                onRemoveQuestionFromGroup={(gId, qId) => handleRemoveQuestionFromChoiceGroup(sec.id, gId, qId)}
                              />
                            </div>
                          )}

                          {/* Group Selection Banner */}
                          {(secGroupSelect[sec.id] || []).length > 0 && (
                            <div className="p-3 bg-indigo-50 dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                              <span className="text-xs font-bold text-[#5B4BFF]">
                                ⌥ {(secGroupSelect[sec.id] || []).length} question(s) selected for Choice Group
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={(secGroupSelect[sec.id] || []).length < 2}
                                  onClick={() => handleCreateChoiceGroup(sec.id)}
                                  className="px-3 py-1.5 bg-[#5B4BFF] hover:bg-[#4E3EFF] text-white text-xs font-black rounded-lg shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                  + Wrap in Choice Group
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSecGroupSelect(prev => ({ ...prev, [sec.id]: [] }))}
                                  className="px-2.5 py-1 text-slate-500 hover:text-slate-800 dark:hover:text-white text-xs font-semibold"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Added Questions List in Section */}
                          {sec.questions.length === 0 ? (
                            <div className="text-center py-5 text-[#4E5969] dark:text-slate-400 text-xs font-bold italic bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-xl">
                              No questions added to {sec.name} yet. Use the question selector above to check and add questions.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {sec.questions.map((q: any, qIdx: number) => {
                                const isEditingThisQ = editingSectionQuestion?.secId === sec.id && editingSectionQuestion?.qId === (q.questionId || q.id);

                                if (isEditingThisQ && editingSectionQuestion) {
                                  return (
                                    <div key={q.questionId || q.id} className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/90 border-2 border-[#5B4BFF] space-y-4 shadow-md animate-fadeIn">
                                      <div className="flex items-center justify-between border-b border-indigo-200 dark:border-indigo-900 pb-2.5">
                                        <div className="flex items-center gap-2">
                                          <span className="w-6 h-6 rounded-full bg-[#5B4BFF] text-white flex items-center justify-center font-black text-xs">
                                            {qIdx + 1}
                                          </span>
                                          <span className="text-xs font-black uppercase text-[#2D2575] dark:text-indigo-300">
                                            ✏️ Edit Question Prompt &amp; Weightage (Q{qIdx + 1})
                                          </span>
                                        </div>
                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-[#5B4BFF]">
                                          {editingSectionQuestion.mode || q.mode}
                                        </span>
                                      </div>

                                      {/* 1. Question Prompt Textarea */}
                                      <div>
                                        <label className="block text-[11px] font-black uppercase text-[#1B1E28] dark:text-slate-300 mb-1">
                                          Question Prompt / Text *
                                        </label>
                                        <textarea
                                          value={editingSectionQuestion.questionText}
                                          onChange={(e) => setEditingSectionQuestion(prev => prev ? { ...prev, questionText: e.target.value } : null)}
                                          rows={3}
                                          placeholder="Type or refine question wording..."
                                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-[#5B4BFF]/40 text-[#1B1E28] dark:text-white font-bold text-xs focus:outline-none focus:border-[#F36C21]"
                                        />
                                      </div>

                                      {/* 2. Weightage & Sub-parts Configuration */}
                                      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 space-y-3">
                                        <div className="flex items-center justify-between">
                                          <label className="text-[11px] font-black uppercase text-[#5B4BFF]">
                                            Weightage &amp; Sub-parts Structure
                                          </label>
                                          <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-extrabold text-[#4E5969] dark:text-slate-400">Total Question Marks:</span>
                                            <span className="px-3 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B4BFF] font-black text-xs border border-[#5B4BFF]/30">
                                              {editingSectionQuestion.subQuestions && editingSectionQuestion.subQuestions.length > 0
                                                ? editingSectionQuestion.subQuestions.reduce((sum, sq) => sum + Number(sq.marks || 0), 0)
                                                : editingSectionQuestion.customMarks} Marks
                                            </span>
                                          </div>
                                        </div>

                                        {/* Sub-parts List if present */}
                                        {editingSectionQuestion.subQuestions && editingSectionQuestion.subQuestions.length > 0 ? (
                                          <div className="space-y-2">
                                            <div className="text-[10px] text-slate-500 font-bold uppercase">Editable Sub-Parts:</div>
                                            {editingSectionQuestion.subQuestions.map((sq: any, sIdx: number) => (
                                              <div key={sq.id || sIdx} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700">
                                                <input
                                                  type="text"
                                                  value={sq.label || `${String.fromCharCode(97 + sIdx)})`}
                                                  onChange={(e) => {
                                                    const val = e.target.value;
                                                    setEditingSectionQuestion(prev => {
                                                      if (!prev) return null;
                                                      const newSubs = [...prev.subQuestions];
                                                      newSubs[sIdx] = { ...newSubs[sIdx], label: val };
                                                      return { ...prev, subQuestions: newSubs };
                                                    });
                                                  }}
                                                  className="w-12 px-2 py-1 rounded bg-white dark:bg-slate-900 border text-center font-mono font-black text-xs text-[#5B4BFF]"
                                                  placeholder="a)"
                                                />
                                                <input
                                                  type="text"
                                                  value={sq.questionText}
                                                  onChange={(e) => {
                                                    const val = e.target.value;
                                                    setEditingSectionQuestion(prev => {
                                                      if (!prev) return null;
                                                      const newSubs = [...prev.subQuestions];
                                                      newSubs[sIdx] = { ...newSubs[sIdx], questionText: val };
                                                      return { ...prev, subQuestions: newSubs };
                                                    });
                                                  }}
                                                  className="flex-1 px-3 py-1 rounded bg-white dark:bg-slate-900 border text-xs font-bold text-[#1B1E28] dark:text-white"
                                                  placeholder="Subpart question text..."
                                                />
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                  <input
                                                    type="number"
                                                    step={0.5}
                                                    min={0}
                                                    value={sq.marks !== undefined ? sq.marks : ''}
                                                    onChange={(e) => {
                                                      const val = Number(e.target.value);
                                                      setEditingSectionQuestion(prev => {
                                                        if (!prev) return null;
                                                        const newSubs = [...prev.subQuestions];
                                                        newSubs[sIdx] = { ...newSubs[sIdx], marks: val };
                                                        const newTotal = newSubs.reduce((sum, s) => sum + Number(s.marks || 0), 0);
                                                        return { ...prev, subQuestions: newSubs, customMarks: newTotal };
                                                      });
                                                    }}
                                                    className="w-16 px-2 py-1 rounded bg-white dark:bg-slate-900 border border-[#00C48C]/40 text-[#00C48C] font-black text-xs text-center"
                                                  />
                                                  <span className="text-[10px] text-slate-400 font-bold">M</span>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      setEditingSectionQuestion(prev => {
                                                        if (!prev) return null;
                                                        const newSubs = prev.subQuestions.filter((_, idx) => idx !== sIdx);
                                                        const newTotal = newSubs.reduce((sum, s) => sum + Number(s.marks || 0), 0);
                                                        return { ...prev, subQuestions: newSubs, customMarks: newTotal };
                                                      });
                                                    }}
                                                    className="p-1 rounded hover:bg-rose-100 text-[#F04438] text-xs font-bold cursor-pointer"
                                                    title="Remove sub-part"
                                                  >
                                                    ✕
                                                  </button>
                                                </div>
                                              </div>
                                            ))}
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingSectionQuestion(prev => {
                                                  if (!prev) return null;
                                                  const nextLabel = `${String.fromCharCode(97 + prev.subQuestions.length)})`;
                                                  const newSubs = [...prev.subQuestions, { id: `sub-${Date.now()}`, label: nextLabel, questionText: '', marks: 5 }];
                                                  const newTotal = newSubs.reduce((sum, s) => sum + Number(s.marks || 0), 0);
                                                  return { ...prev, subQuestions: newSubs, customMarks: newTotal };
                                                });
                                              }}
                                              className="px-3 py-1 rounded-lg bg-[#EEF2FF] text-[#5B4BFF] hover:bg-[#5B4BFF] hover:text-white text-xs font-black transition flex items-center gap-1 cursor-pointer"
                                            >
                                              <span>➕</span>
                                              <span>Add Another Sub-part</span>
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs font-bold text-[#1B1E28] dark:text-slate-300">Marks for Question:</span>
                                              <input
                                                type="number"
                                                min={0.5}
                                                step={0.5}
                                                value={editingSectionQuestion.customMarks}
                                                onChange={(e) => setEditingSectionQuestion(prev => prev ? { ...prev, customMarks: Number(e.target.value) } : null)}
                                                className="w-20 px-3 py-1 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-[#5B4BFF]/40 text-[#5B4BFF] font-black text-xs text-center"
                                              />
                                              <span className="text-xs font-bold text-slate-400">Marks</span>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingSectionQuestion(prev => {
                                                  if (!prev) return null;
                                                  const half = Number((prev.customMarks / 2).toFixed(1)) || 5;
                                                  return {
                                                    ...prev,
                                                    subQuestions: [
                                                      { id: `sub-1`, label: 'a)', questionText: '', marks: half },
                                                      { id: `sub-2`, label: 'b)', questionText: '', marks: half }
                                                    ]
                                                  };
                                                });
                                              }}
                                              className="px-3 py-1.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 hover:bg-[#EEF2FF] text-[#5B4BFF] border border-[#5B4BFF]/30 text-xs font-black transition flex items-center gap-1 cursor-pointer"
                                            >
                                              <span>✨</span>
                                              <span>Split into Sub-Parts (a, b...)</span>
                                            </button>
                                          </div>
                                        )}
                                      </div>

                                      {/* 3. MCQ Options if MCQ */}
                                      {editingSectionQuestion.mode === 'MCQ' && (
                                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 space-y-2">
                                          <span className="text-[11px] font-black uppercase text-[#5B4BFF] block">MCQ Options &amp; Correct Answer</span>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {['a', 'b', 'c', 'd'].map(letter => {
                                              const optKey = `option${letter.toUpperCase()}` as 'optionA' | 'optionB' | 'optionC' | 'optionD';
                                              const isSelected = editingSectionQuestion.correctOption === `option_${letter}`;
                                              return (
                                                <div key={letter} className={`flex items-center gap-2 p-2 rounded-xl border ${isSelected ? 'border-[#00C48C] bg-[#E6F9F3]/40' : 'border-[#E7EAF3] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800'}`}>
                                                  <input
                                                    type="radio"
                                                    name={`correct-${q.questionId}`}
                                                    checked={isSelected}
                                                    onChange={() => setEditingSectionQuestion(prev => prev ? { ...prev, correctOption: `option_${letter}` } : null)}
                                                    className="text-[#00C48C] focus:ring-[#00C48C] cursor-pointer"
                                                  />
                                                  <span className="font-mono font-bold text-xs uppercase">{letter})</span>
                                                  <input
                                                    type="text"
                                                    value={editingSectionQuestion[optKey] || ''}
                                                    onChange={(e) => {
                                                      const val = e.target.value;
                                                      setEditingSectionQuestion(prev => prev ? { ...prev, [optKey]: val } : null);
                                                    }}
                                                    className="flex-1 bg-transparent border-0 text-xs font-bold text-[#1B1E28] dark:text-white focus:outline-none"
                                                    placeholder={`Option ${letter.toUpperCase()} text...`}
                                                  />
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}

                                      {/* Action Buttons: Save or Cancel */}
                                      <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-indigo-200 dark:border-indigo-900">
                                        <button
                                          type="button"
                                          onClick={() => setEditingSectionQuestion(null)}
                                          className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                                        >
                                          ✕ Cancel
                                        </button>
                                        <button
                                          type="button"
                                          onClick={handleSaveEditedSectionQuestion}
                                          className="px-5 py-1.5 rounded-xl bg-gradient-to-r from-[#5B4BFF] to-indigo-600 hover:from-[#4E3EFF] hover:to-indigo-500 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                                        >
                                          <span>✓</span>
                                          <span>Save Question &amp; Weightage</span>
                                        </button>
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                <div key={q.questionId} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 space-y-3 shadow-sm">
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    <div className="flex items-start gap-3 flex-1">
                                      <div className="flex flex-col items-center gap-1 pt-0.5">
                                        <input
                                          type="checkbox"
                                          checked={(secGroupSelect[sec.id] || []).includes(q.questionId)}
                                          onChange={() => handleToggleSelectForGroup(sec.id, q.questionId)}
                                          className="w-4 h-4 rounded text-[#5B4BFF] focus:ring-[#5B4BFF] cursor-pointer"
                                          title="Select for choice group"
                                        />
                                        <div className="flex flex-col bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 overflow-hidden text-[9px] font-black">
                                          <button
                                            type="button"
                                            disabled={qIdx === 0}
                                            onClick={() => handleMoveQuestionUp(sec.id, qIdx)}
                                            className="px-1.5 py-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Move Up"
                                          >
                                            ▲
                                          </button>
                                          <button
                                            type="button"
                                            disabled={qIdx === sec.questions.length - 1}
                                            onClick={() => handleMoveQuestionDown(sec.id, qIdx)}
                                            className="px-1.5 py-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed border-t border-slate-200 dark:border-slate-700"
                                            title="Move Down"
                                          >
                                            ▼
                                          </button>
                                        </div>
                                      </div>
                                      <span className="font-mono text-[#5B4BFF] font-black text-sm">{qIdx + 1}.</span>
                                      <div className="space-y-1 flex-1">
                                        <p className="font-black text-[#1B1E28] dark:text-white leading-relaxed text-xs">{q.questionText}</p>
                                        {(q.imageUrl || q.image_url || q.image || q.diagramUrl || q.diagram_url) && (
                                          <div className="mt-2 flex items-center gap-2">
                                            <img
                                              src={q.imageUrl || q.image_url || q.image || q.diagramUrl || q.diagram_url}
                                              alt="Diagram"
                                              className="h-16 w-24 object-contain rounded-lg border border-[#E7EAF3] dark:border-slate-700 bg-white p-1 shadow-xs cursor-pointer hover:scale-105 transition-transform"
                                              onClick={() => setViewingImageModal({
                                                src: q.imageUrl || q.image_url || q.image || q.diagramUrl || q.diagram_url,
                                                title: `Q${qIdx + 1}: ${q.questionText || ''}`,
                                              })}
                                            />
                                            <button
                                              type="button"
                                              onClick={() => setViewingImageModal({
                                                src: q.imageUrl || q.image_url || q.image || q.diagramUrl || q.diagram_url,
                                                title: `Q${qIdx + 1}: ${q.questionText || ''}`,
                                              })}
                                              className="text-[11px] font-bold text-[#5B4BFF] hover:underline flex items-center gap-1 cursor-pointer"
                                            >
                                              <span>📷</span>
                                              <span>Diagram Attached (Click to enlarge)</span>
                                            </button>
                                          </div>
                                        )}
                                        <div className="flex items-center gap-2 text-[10px]">
                                          <span className="px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B4BFF] font-black border border-[#5B4BFF]/20">
                                            {q.mode}
                                          </span>
                                          <span className="px-2 py-0.5 rounded-full bg-[#E6F9F3] text-[#00C48C] font-black border border-[#00C48C]/20">
                                            🎯 {q.competencyCode || 'CO1'}
                                          </span>
                                          <span className="px-2 py-0.5 rounded-full bg-[#FFF4EC] text-[#F36C21] font-bold border border-[#F36C21]/20">
                                            📚 {q.topic || 'General Accounting / Concepts'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2.5">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-bold text-[#4E5969] dark:text-slate-400">Total Question Marks:</span>
                                        {Array.isArray(q.subQuestions) && q.subQuestions.length > 0 ? (
                                          <span
                                            className="px-2.5 py-1 rounded-xl bg-[#EEF2FF] text-[#5B4BFF] font-black text-xs border border-[#5B4BFF]/40"
                                            title="Computed as sum of subpart marks"
                                          >
                                            {Number(q.customMarks || 0).toFixed(1)} M
                                          </span>
                                        ) : (
                                          <input
                                            type="number"
                                            value={q.customMarks}
                                            onChange={(e) => handleUpdateCustomMarks(sec.id, q.questionId, Number(e.target.value))}
                                            className="w-16 px-2.5 py-1 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-[#5B4BFF]/40 text-[#5B4BFF] font-black text-xs text-center focus:outline-none focus:border-[#F36C21]"
                                          />
                                        )}
                                      </div>

                                      {/* Edit Question & Weightage Action Button */}
                                      <button
                                        type="button"
                                        onClick={() => handleStartEditSectionQuestion(sec.id, q)}
                                        className="text-[#5B4BFF] hover:text-[#4E3EFF] font-black text-xs px-2.5 py-1 rounded-lg bg-[#EEF2FF] hover:bg-[#EEF2FF]/80 border border-[#5B4BFF]/30 flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                                        title="Edit question text, weightage, sub-parts, or options"
                                      >
                                        <span>✏️</span>
                                        <span>Edit</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleRemoveQuestionFromSection(sec.id, q.questionId)}
                                        className="text-[#F04438] hover:text-rose-700 font-extrabold text-xs px-2.5 py-1 rounded-lg bg-[#FEECEB] border border-[#F04438]/20 cursor-pointer"
                                        title="Remove question from section"
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
                              );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Save Action Bar */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-[#E7EAF3] dark:border-slate-800">
                    <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium">
                      Save as draft to edit anytime, or submit to <strong className="text-[#5B4BFF]">DQAC &amp; HOD</strong> for syllabus quality audit and section set approval.
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleSavePaperDesign(undefined, 'DRAFT')}
                        className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 hover:bg-[#F8FAFC] text-[#1B1E28] dark:text-white font-bold text-xs shadow-sm transition-all"
                      >
                        💾 Save as Draft
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSavePaperDesign(undefined, 'PENDING_DQAC_APPROVAL')}
                        className="px-6 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4E3EFF] text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5"
                      >
                        <span>📤</span>
                        <span>Submit for DQAC Audit</span>
                      </button>
                    </div>
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
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[#4E5969] dark:text-slate-400 font-bold">Publishing Context:</span>
                  <span className="px-3 py-1 rounded-full bg-[#EEF2FF] text-[#5B4BFF] font-extrabold border border-[#5B4BFF]/30">
                    🏛️ {academicCascade?.college?.colg_name || tenantName || 'College'}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#E6F9F3] text-[#00C48C] font-extrabold border border-[#00C48C]/30">
                    🎓 {academicCascade?.course?.course_name || 'Course'}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#FFF4EC] text-[#F36C21] font-extrabold border border-[#F36C21]/30">
                    🏢 {academicCascade?.branch?.branch_name || facultyDeptName}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 font-extrabold border border-purple-200">
                    📅 {academicCascade?.batch?.batch_name || 'Batch'}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-extrabold border border-blue-200">
                    🔢 {academicCascade?.semester?.SemName || academicCascade?.semester?.name || 'Semester'}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-extrabold border border-emerald-200">
                    📖 {academicCascade?.subject?.name || subjectsForDept.find(s => s.id === selectedSubject)?.name || 'Subject'}
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
                          designedPapers.map(p => {
                            const setLabel = p.paper_set || p.paperSet || 'Set A';
                            const targetSecs = Array.isArray(p.target_sections) ? p.target_sections : (Array.isArray(p.targetSections) ? p.targetSections : ['All']);
                            const targetLabel = targetSecs[0] !== 'All' ? `🎯 ${targetSecs.join(', ')}` : '🌐 Common / All Sections';
                            return (
                              <option key={p.id} value={p.id}>
                                [{setLabel}] [{p.code}] {p.name} ({p.max_marks || p.maxMarks || 100} Marks) — {targetLabel} — ✓ Approved
                              </option>
                            );
                          })
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
                        {academicCascade?.batch && (
                          <option value={academicCascade.batch.batch_name || String(academicCascade.batch.batch_cd)}>
                            {academicCascade.batch.batch_name} — {academicCascade.course?.course_name || 'Active Course'} ({academicCascade.semester?.SemName || 'Current'})
                          </option>
                        )}
                        <option value="Batch 2024">Batch 2024</option>
                        <option value="Batch 2025">Batch 2025</option>
                        <option value="Batch 2026">Batch 2026</option>
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
                          <th className="py-3.5 px-4 text-center">Approval Status</th>
                          <th className="py-3.5 px-4 text-right rounded-r-xl">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800">
                        {designedPapers.map((dp) => (
                          <tr key={dp.id} className="hover:bg-[#F1F4F9]/60 dark:hover:bg-slate-800/40 transition">
                            <td className="py-4 px-4 align-top">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FFF4EC] text-[#F36C21] border border-[#F36C21]/30">
                                  📑 {dp.paper_set || dp.paperSet || 'Set A'}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#EEF2FF] text-[#5B4BFF] border border-[#5B4BFF]/30">
                                  {(() => {
                                    const ts = Array.isArray(dp.target_sections) ? dp.target_sections : (Array.isArray(dp.targetSections) ? dp.targetSections : ['All']);
                                    return ts[0] !== 'All' ? `🎯 ${ts.join(', ')}` : '🌐 Common / All Sections';
                                  })()}
                                </span>
                              </div>
                              <p className="font-black text-[#1B1E28] dark:text-white text-xs leading-snug">{dp.name}</p>
                              <span className="text-[10px] text-[#4E5969] dark:text-slate-400 font-bold block mt-0.5">
                                {dp.subject_name || academicCascade?.subject?.name || 'Subject'} — {dp.batch_code || academicCascade?.batch?.batch_name || 'Active Batch'}
                              </span>
                            </td>
                            <td className="py-4 px-4 align-top font-mono text-[#5B4BFF] font-black">
                              {dp.code}
                            </td>
                            <td className="py-4 px-4 align-top text-center">
                              <span className="font-bold text-[#F36C21] block">{dp.duration_minutes || dp.duration || 180} mins</span>
                              <span className="text-[11px] font-black text-[#00C48C]">{dp.max_marks || dp.maxMarks || 100} Marks</span>
                            </td>
                            <td className="py-4 px-4 align-top text-center">
                              {renderPaperStatusBadge(dp.status)}
                            </td>
                            <td className="py-4 px-4 align-top text-right">
                              <button
                                type="button"
                                onClick={() => setPreviewModalPaper(dp)}
                                className="px-3 py-1.5 rounded-xl bg-[#00C48C] hover:bg-[#00B07D] text-white text-xs font-black shadow-sm transition-all inline-flex items-center gap-1 cursor-pointer"
                                title="View Question Paper (Printing is restricted to Exam Dept)"
                              >
                                <span>👁️</span>
                                <span>View</span>
                                <span className="text-[9px] bg-black/20 px-1.5 py-0.5 rounded font-mono font-bold">🔒 No Print</span>
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

        </main>
      </div>

      {/* Blueprint Auto-Generation Modal */}
      {blueprintModalSecId && (
        <PaperBlueprintModal
          isOpen={!!blueprintModalSecId}
          onClose={() => setBlueprintModalSecId(null)}
          availableTopics={availableTopics}
          availableUnits={availableUnits}
          onApplyBlueprintQuestions={handleApplyBlueprintQuestions}
          tenantSlug={getTenantSlug()}
          subjectId={selectedSubject}
          subjectCode={selectedSubject}
        />
      )}

      {/* Live Scoring Simulation Modal */}
      {showScoringSimulation && (
        <PaperLiveScoringPreviewModal
          isOpen={showScoringSimulation}
          onClose={() => setShowScoringSimulation(false)}
          paper={{
            id: editingPaperId || 'simulation-paper',
            code: paperCode || 'SIM-01',
            name: paperTitle || 'Simulation Examination Paper',
            duration_minutes: paperDuration || 60,
            passing_marks: Math.round(computedEffectiveMax * 0.33),
            status: PaperStatus.DRAFT,
            version: 1,
            sections: paperSections.map(sec => ({
              ...sec,
              questionIds: (sec.questions || []).map((q: any) => q.questionId || q.id),
              choiceGroups: sec.choiceGroups || [],
              attemptRule: sec.attemptRule || 'ALL',
              targetQuestionsCount: sec.targetQuestionsCount || (sec.questions || []).length,
              requiredToAttempt: sec.requiredToAttempt ?? (sec.questions || []).length,
              overAttemptPolicy: sec.overAttemptPolicy || OverAttemptPolicy.BEST_N,
            })),
            max_marks: computedEffectiveMax,
          }}
          questionsMap={allPaperQuestionsMap}
        />
      )}

      {/* Version Diff Modal */}
      {diffModalPaper && (
        <PaperVersionDiffModal
          isOpen={!!diffModalPaper}
          onClose={() => setDiffModalPaper(null)}
          previousVersion={diffModalPaper.previous}
          currentDraft={diffModalPaper.current}
        />
      )}

      {/* Printable Exam Paper Review Modal */}
      {previewModalPaper && (
        <QuestionPaperReviewModal
          paper={previewModalPaper}
          isOpen={!!previewModalPaper}
          onClose={() => setPreviewModalPaper(null)}
          mode="preview"
          userRole="FACULTY"
        />
      )}

      {/* Enlarged Image Preview Modal */}
      {viewingImageModal && (
        <ImagePreviewModal
          src={viewingImageModal.src}
          title={viewingImageModal.title}
          isOpen={!!viewingImageModal}
          onClose={() => setViewingImageModal(null)}
        />
      )}
    </div>
  );
}
