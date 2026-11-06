'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import FacultyAcademicCascadingDropdown, {
  AcademicCascadingState,
} from '@/components/faculty/FacultyAcademicCascadingDropdown';
import { getTenantSlug, getTenantName } from '@/hooks/useTenantAcademicData';

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

interface Batch {
  id: string;
  code: string;
  year?: number;
  name?: string;
}

interface CbmeYear {
  id: string;
  label: string;
  year?: string;
}

interface Professional {
  id: string;
  name: string;
  course_cd?: string;
  phase_order?: number;
}

interface QuestionSubPart {
  id: string;
  label: string;
  questionText: string;
  marks: number;
}

interface QuestionDetail {
  id?: string;
  questionId: string;
  questionText: string;
  mode: string;
  topic?: string;
  topicCode?: string;
  competencyCode?: string;
  co?: string;
  bloomLevel?: string;
  defaultMarks: number;
  customMarks: number;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctOption?: string;
  subQuestions?: QuestionSubPart[];
}

interface PracticalComponent {
  id: string;
  name: string;
  marks: number;
}

interface PaperSection {
  id: string;
  name: string;
  type: string;
  description?: string;
  questions: QuestionDetail[];
  practicalMarks?: number;
  practicalComponents?: PracticalComponent[];
  requiredToAttempt?: number;
  attemptRule?: string;
  overAttemptPolicy?: string;
  choiceGroups?: any[];
}

interface ExamPaper {
  id: string;
  code: string;
  name: string;
  max_marks: number;
  passing_marks: number;
  duration_mins?: number;
  sections_count?: number;
  mode?: string;
  status?: string;
  subject_id?: string;
  subject_name?: string;
  subject_code?: string;
  course_name?: string;
  course_cd?: string;
  branch_cd?: string;
  batch_id?: string;
  batch_name?: string;
  batch_code?: string;
  topic_name?: string;
  department_name?: string;
  department_id?: string;
  paper_set?: string;
  exam_date?: string;
  created_at?: string;
  room_no?: string;
  hall_name?: string;
  type?: string;
  created_by?: string;
  sections?: PaperSection[];
}

interface StudentRow {
  id: string;
  rollno: string;
  registration_no?: string;
  photo_url?: string;
  name: string;
  gender?: string;
  evaluated: boolean;
  marks_obtained: number;
  max_marks: number;
  questionMarks?: { [qId: string]: number | string };
  subPartMarks?: { [subId: string]: number | string };
  skippedQuestionIds?: string[];
  practicalMark?: number;
  competencyScores: { [compCode: string]: { scored: number; max: number; isSkipped?: boolean } };
  is_pass: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

const createGenericPaperSections = (paperName: string, maxMarks: number, isNonMed: boolean): PaperSection[] => [
  {
    id: 'sec-1',
    name: 'Section A - Evaluation',
    type: 'DESC',
    description: `${paperName} - Question Assessment (${maxMarks} Marks)`,
    practicalMarks: 0,
    questions: [
      {
        questionId: 'q-gen-1',
        questionText: `${paperName} - Evaluation & Question Assessment`,
        mode: 'DESC',
        topic: isNonMed ? 'Course Syllabus' : 'Curriculum Units',
        competencyCode: isNonMed ? 'MOD-1' : 'CBME-1',
        defaultMarks: maxMarks,
        customMarks: maxMarks,
        subQuestions: [],
      }
    ]
  }
];

export default function FacultyMarksPage() {
  // ── Master Meta State ─────────────────────────────────────────────────
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [cbmeYears, setCbmeYears] = useState<CbmeYear[]>([]);
  const [selectedCbmeYearId, setSelectedCbmeYearId] = useState<string>('');
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfId, setSelectedProfId] = useState<string>('');
  const [topicsMaster, setTopicsMaster] = useState<any[]>([]);
  const [metaLoaded, setMetaLoaded] = useState<boolean>(false);

  const formatBloom = (raw?: string) => {
    if (!raw) return 'K2 (Understand)';
    let s = String(raw).trim();
    s = s.replace(/^KL-/i, 'K');
    if (/^K\d/i.test(s)) return s;
    return `K${s}`;
  };

  const getBloomColor = (raw?: string) => {
    const s = String(raw || '').toUpperCase();
    if (s.includes('K1') || s.includes('KL-1') || s.includes('REMEMBER')) {
      return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300';
    }
    if (s.includes('K2') || s.includes('KL-2') || s.includes('UNDERSTAND')) {
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';
    }
    if (s.includes('K3') || s.includes('KL-3') || s.includes('APPLY')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
    }
    if (s.includes('K4') || s.includes('KL-4') || s.includes('ANALYZE')) {
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
    }
    if (s.includes('K5') || s.includes('KL-5') || s.includes('EVALUATE')) {
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800';
    }
    if (s.includes('K6') || s.includes('KL-6') || s.includes('CREATE')) {
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
    }
    return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800';
  };

  const resolveTopicAndBloom = (compCode?: string, topicName?: string) => {
    const code = String(compCode || '').trim();
    const name = String(topicName || '').trim();

    const topicCodePrefix = code.includes('-ST') ? code.split('-ST')[0] : code;
    let matched = topicsMaster.find((t: any) =>
      (t.code && topicCodePrefix && t.code.toLowerCase() === topicCodePrefix.toLowerCase()) ||
      (t.code && code && t.code.toLowerCase() === code.toLowerCase())
    );

    if (!matched && name) {
      matched = topicsMaster.find((t: any) =>
        t.name && t.name.toLowerCase().trim() === name.toLowerCase()
      );
    }

    let co = matched?.unit_code || matched?.unit_name;
    let bloom = matched?.bloom_level;
    let resolvedTopic = matched?.name || name || 'General Topic';

    if (!co) {
      if (code.includes('T1') || code.includes('T2') || topicCodePrefix.endsWith('T1') || topicCodePrefix.endsWith('T2')) co = 'CO1';
      else if (code.includes('T3') || topicCodePrefix.endsWith('T3')) co = 'CO2';
      else if (code.includes('T4') || code.includes('T5') || topicCodePrefix.endsWith('T4') || topicCodePrefix.endsWith('T5')) co = 'CO3';
      else if (code.includes('T6') || code.includes('T7') || topicCodePrefix.endsWith('T6') || topicCodePrefix.endsWith('T7')) co = 'CO4';
      else if (code.includes('T8') || code.includes('T9') || code.includes('T10') || topicCodePrefix.endsWith('T8') || topicCodePrefix.endsWith('T10')) co = 'CO5';
      else co = 'CO1';
    }

    if (!bloom) {
      if (co === 'CO2' || co === 'CO3') bloom = 'KL-5 (Evaluate)';
      else if (co === 'CO4') bloom = 'KL-2 (Understand)';
      else if (co === 'CO5') bloom = 'KL-3 (Apply)';
      else bloom = 'KL-4 (Analyze)';
    }

    return {
      co: String(co).toUpperCase(),
      bloom: String(bloom),
      topic: resolvedTopic,
    };
  };

  const [tenantName, setTenantName] = useState<string>('');
  const [facultyDeptName, setFacultyDeptName] = useState<string>('');
  const [firmMode, setFirmMode] = useState<string>('NONMED');

  // ── Dynamic Course & Subject Linker Cascade State ────────────────────
  const [academicCascade, setAcademicCascade] = useState<AcademicCascadingState | null>(null);

  const handleAcademicCascadeChange = (state: AcademicCascadingState) => {
    setAcademicCascade(state);
    if (state.subject) {
      setSelectedSubject(state.subject.id || state.subject.code || '');
    }
    if (state.batch) {
      setSelectedBatch({
        id: String(state.batch.batch_cd),
        code: state.batch.batch_name || String(state.batch.batch_cd),
        name: state.batch.batch_name || `Batch ${state.batch.batch_cd}`,
        year: state.batch.year ? Number(state.batch.year) : undefined,
      });
    }
  };

  const isNonMed = useMemo(() => {
    if (firmMode === 'NONMED') return true;
    if (firmMode === 'MED') return false;
    const slug = getTenantSlug().toLowerCase();
    if (slug === 'team-university' || slug === 'apex-tech') return true;
    const courseName = (academicCascade?.course?.course_name || '').toLowerCase();
    if (courseName && (
      courseName.includes('bba') ||
      courseName.includes('btech') ||
      courseName.includes('b.tech') ||
      courseName.includes('engineering') ||
      courseName.includes('business') ||
      courseName.includes('commerce') ||
      courseName.includes('law') ||
      courseName.includes('computer')
    )) {
      return true;
    }
    return false;
  }, [firmMode, academicCascade]);

  const cleanDescription = (desc?: string) => {
    if (!desc) {
      return isNonMed
        ? 'Laboratory experiment, project assessment, and oral viva voce evaluation.'
        : 'Clinical procedure execution, OSPE stations, and oral viva voce evaluation.';
    }
    if (isNonMed) {
      return desc
        .replace(/OSPE Stations/gi, 'Lab Tasks')
        .replace(/Practical Spotting,\s*OSPE Stations\s*&/gi, 'Practical &')
        .replace(/OSPE Spotting/gi, 'Practical Assessment')
        .replace(/OSPE/gi, 'Lab Assessment');
    }
    return desc;
  };

  // ── Paper States ──────────────────────────────────────────────────────
  const [allFetchedPapers, setAllFetchedPapers] = useState<ExamPaper[]>([]);
  const [selectedPaperId, setSelectedPaperId] = useState<string>('');

  // Filter papers strictly by selected subject
  const filteredPapers = useMemo(() => {
    if (allFetchedPapers.length === 0) return [];
    const selSubjObj: any = academicCascade?.subject || allSubjects.find(s => s.id === selectedSubject || s.code === selectedSubject);
    const subjCode = (selSubjObj?.code || selSubjObj?.sub_cd || '').toLowerCase().trim();
    const subjName = (selSubjObj?.name || selSubjObj?.sub_name || '').toLowerCase().trim();
    const subjId = String(selSubjObj?.id || selectedSubject || '').toLowerCase().trim();

    if (!subjCode && !subjName && !subjId) return allFetchedPapers;

    const matched = allFetchedPapers.filter(p => {
      if (p.subject_id && String(p.subject_id).toLowerCase() === subjId) return true;
      const pCode = (p.code || '').toLowerCase();
      const pName = (p.name || '').toLowerCase();
      const pSubjName = (p.subject_name || '').toLowerCase();
      const pSubjCode = (p.subject_code || '').toLowerCase();
      if (subjCode && (pCode.includes(subjCode) || pName.includes(subjCode) || pSubjCode.includes(subjCode))) return true;
      if (subjName && (pName.includes(subjName) || pSubjName.includes(subjName))) return true;
      return false;
    });
    return matched;
  }, [allFetchedPapers, selectedSubject, allSubjects, academicCascade]);

  const activePaper = useMemo(() => {
    if (selectedPaperId) {
      const matchInFiltered = filteredPapers.find(p => p.id === selectedPaperId);
      if (matchInFiltered) return matchInFiltered;
      
    }
    return filteredPapers[0] || null;
  }, [filteredPapers, selectedPaperId]);

  // Synchronize selectedPaperId with activePaper if different
  useEffect(() => {
    if (activePaper && activePaper.id !== selectedPaperId) {
      setSelectedPaperId(activePaper.id);
    }
  }, [activePaper, selectedPaperId]);

  const paperCompetencies = useMemo(() => {
    const targetPaper = activePaper || filteredPapers[0] || null;
    if (!targetPaper?.sections) return [];
    const compSet = new Set<string>();
    targetPaper.sections.forEach(sec => {
      sec.questions.forEach(q => {
        const comp = q.competencyCode || q.topic;
        if (comp) compSet.add(comp);
      });
    });
    return Array.from(compSet);
  }, [activePaper, filteredPapers]);

  const calculateStudentCompetencyScores = (
    paper: any,
    qMarks: any = {},
    subMarks: any = {},
    skippedListOrMap: any = {}
  ) => {
    const targetPaper = paper || activePaper || filteredPapers[0] || null;
    if (!targetPaper || !Array.isArray(targetPaper.sections)) return {};
    const scores: { [compCode: string]: { scored: number; max: number; isSkipped?: boolean } } = {};

    const isSkippedCheck = (qId: string) => {
      if (Array.isArray(skippedListOrMap)) return skippedListOrMap.includes(qId);
      if (skippedListOrMap && typeof skippedListOrMap === 'object') {
        if (skippedListOrMap[qId]) return true;
      }
      return qMarks[qId] === 'SKIPPED' || qMarks[qId] === null;
    };

    targetPaper.sections.forEach((sec: any) => {
      if (!Array.isArray(sec.questions)) return;
      sec.questions.forEach((q: any) => {
        const comp = q.competencyCode || q.topic || 'General';
        const qId = q.questionId || q.id;
        const qMax = Number(q.customMarks || q.defaultMarks || q.max_marks || q.maxMarks || 2);

        if (!scores[comp]) {
          scores[comp] = { scored: 0, max: 0, isSkipped: true };
        }

        const isSkipped = isSkippedCheck(qId);
        if (isSkipped) {
          // Unattempted / Skipped question: do not penalize student or inflate max marks
          return;
        }

        scores[comp].isSkipped = false;

        if (Array.isArray(q.subQuestions) && q.subQuestions.length > 0) {
          let subScoredSum = 0;
          q.subQuestions.forEach((sq: any) => {
            const compositeKey = `${qId}_${sq.id}`;
            const rawVal = subMarks[compositeKey] ?? subMarks[sq.id] ?? subMarks[`${qId}___${sq.id}`];
            const sqScored = Number(rawVal ?? 0);
            subScoredSum += isNaN(sqScored) ? 0 : sqScored;
          });
          // Cap total scored on question to question's max marks so subparts never overshoot
          const qScored = Math.min(qMax, subScoredSum);
          scores[comp].max += qMax;
          scores[comp].scored += qScored;
          scores[comp].scored = Math.min(scores[comp].max, scores[comp].scored);
        } else {
          const rawQ = qMarks[qId];
          const numQ = Number(rawQ ?? 0);
          const qScored = isNaN(numQ) ? 0 : Math.min(qMax, Math.max(0, numQ));
          scores[comp].max += qMax;
          scores[comp].scored += qScored;
        }
      });
    });

    return scores;
  };

  // ── Student Roster ────────────────────────────────────────────────────
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // ── Datatable, Search, Sort, Pagination, & Reports Modal State ──
  const [matrixSearch, setMatrixSearch] = useState<string>('');
  const [matrixSortField, setMatrixSortField] = useState<string>('rollno');
  const [matrixSortDir, setMatrixSortDir] = useState<'asc' | 'desc'>('asc');
  const [matrixPage, setMatrixPage] = useState<number>(1);
  const [matrixPageSize, setMatrixPageSize] = useState<number>(25);

  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [activeReportStudent, setActiveReportStudent] = useState<any>(null);
  const [reportModalTab, setReportModalTab] = useState<'subtopics' | 'tracking' | 'practical' | 'chart'>('subtopics');
  const [expandedSubTopics, setExpandedSubTopics] = useState<Record<string, boolean>>({});
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  const CHART_COLORS = ['#5B4BFF', '#00C48C', '#F36C21', '#FFB020', '#7867FF', '#E03137', '#0EA5E9', '#8B5CF6'];

  const handleSort = (field: string) => {
    if (matrixSortField === field) {
      setMatrixSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setMatrixSortField(field);
      setMatrixSortDir('asc');
    }
  };

  const filteredAndSortedStudents = useMemo(() => {
    let list = [...students];
    if (matrixSearch.trim()) {
      const q = matrixSearch.trim().toLowerCase();
      list = list.filter(st => {
        const name = (st.name || '').toLowerCase();
        const roll = String(st.rollno || '').toLowerCase();
        const reg = String(st.registration_no || '').toLowerCase();
        const passText = st.is_pass ? 'pass' : 'fail';
        return name.includes(q) || roll.includes(q) || reg.includes(q) || passText.includes(q);
      });
    }

    list.sort((a, b) => {
      let comp = 0;
      if (matrixSortField === 'rollno') {
        comp = String(a.rollno).localeCompare(String(b.rollno), undefined, { numeric: true });
      } else if (matrixSortField === 'name') {
        comp = a.name.localeCompare(b.name);
      } else if (matrixSortField === 'marks') {
        comp = a.marks_obtained - b.marks_obtained;
      } else if (matrixSortField === 'percentage') {
        const pA = a.max_marks > 0 ? (a.marks_obtained / a.max_marks) : 0;
        const pB = b.max_marks > 0 ? (b.marks_obtained / b.max_marks) : 0;
        comp = pA - pB;
      } else if (matrixSortField === 'status') {
        comp = (a.is_pass === b.is_pass ? 0 : a.is_pass ? 1 : -1);
      } else {
        const getScore = (st: StudentRow) => {
          if (st.competencyScores?.[matrixSortField]?.scored !== undefined) {
            return st.competencyScores[matrixSortField].scored;
          }
          const scores = calculateStudentCompetencyScores(activePaper, st.questionMarks, st.subPartMarks, st.skippedQuestionIds || []);
          return scores[matrixSortField]?.scored || 0;
        };
        comp = getScore(a) - getScore(b);
      }
      return matrixSortDir === 'asc' ? comp : -comp;
    });

    return list;
  }, [students, matrixSearch, matrixSortField, matrixSortDir, activePaper]);

  const totalEntries = filteredAndSortedStudents.length;
  const totalPages = matrixPageSize === 0 ? 1 : Math.ceil(totalEntries / matrixPageSize) || 1;
  const paginatedStudents = useMemo(() => {
    if (matrixPageSize === 0) return filteredAndSortedStudents;
    const start = (matrixPage - 1) * matrixPageSize;
    return filteredAndSortedStudents.slice(start, start + matrixPageSize);
  }, [filteredAndSortedStudents, matrixPage, matrixPageSize]);

  // Handle Open Student Report Modal
  const handleOpenStudentReport = (st: StudentRow) => {
    const paper = activePaper || filteredPapers.find(p => p.id === selectedPaperId) || filteredPapers[0] || null;

    const isPrac = Boolean(
      paper?.sections?.some(s =>
        s.type === 'PRACTICAL' ||
        (Array.isArray(s.practicalComponents) && s.practicalComponents.length > 0) ||
        (Number(s.practicalMarks) > 0)
      )
    );

    const attempts: any[] = [];
    const subTopicMap: Record<string, { scored: number; totalMax: number; pct: number; questionCount: number; desc?: string; co?: string; bloom?: string }> = {};

    let qCounter = 1;
    (paper?.sections || []).forEach((sec) => {
      (sec.questions || []).forEach((q) => {
        const qId = q.questionId || (q as any).id || `q-${qCounter}`;
        const isSkipped = Boolean(
          (st.skippedQuestionIds && st.skippedQuestionIds.includes(qId)) ||
          st.questionMarks?.[qId] === 'SKIPPED' ||
          st.questionMarks?.[qId] === null
        );
        const sCode = q.competencyCode || q.topic || 'CO1';
        const subQs = q.subQuestions || [];

        let qScored = 0;
        let qMax = Number(q.customMarks || q.defaultMarks || 1);

        let mappedSubQs: any[] = [];
        if (subQs.length > 0) {
          mappedSubQs = subQs.map((sq: any, sqIdx: number) => {
            const compositeKey = `${qId}_${sq.id || sq.label || sqIdx}`;
            const rawSub = st.subPartMarks?.[compositeKey] ??
              st.subPartMarks?.[`${qId}_${sq.id}`] ??
              st.subPartMarks?.[sq.id] ??
              st.subPartMarks?.[`${qId}___${sq.id || sq.label || sqIdx}`];
            const subScore = isSkipped ? 0 : (rawSub !== undefined && !isNaN(Number(rawSub)) ? Number(rawSub) : 0);
            const subMax = Number(sq.marks || sq.customMarks || sq.defaultMarks || 2.5);
            qScored += subScore;
            return {
              id: sq.id,
              label: sq.label,
              questionText: sq.questionText || '',
              scored: subScore,
              max: subMax,
            };
          });
          const parentMax = Number(q.customMarks || q.defaultMarks || 0);
          if (parentMax > 0) {
            qMax = parentMax;
            qScored = Math.min(qMax, qScored);
          } else {
            qMax = mappedSubQs.reduce((acc, sub) => acc + sub.max, 0) || 5;
          }
        } else {
          const rawQ = st.questionMarks?.[qId];
          qScored = isSkipped ? 0 : (rawQ !== undefined && !isNaN(Number(rawQ)) ? Number(rawQ) : 0);
        }

        const meta = resolveTopicAndBloom(q.competencyCode, q.topic);
        const resolvedCO = q.co || meta.co;
        const resolvedBloom = q.bloomLevel || meta.bloom;
        const resolvedTopic = q.topic || meta.topic;

        if (!subTopicMap[sCode]) {
          subTopicMap[sCode] = {
            scored: 0,
            totalMax: 0,
            pct: 0,
            questionCount: 0,
            desc: resolvedTopic,
            co: resolvedCO,
            bloom: resolvedBloom,
          };
        }
        subTopicMap[sCode].scored += isSkipped ? 0 : qScored;
        subTopicMap[sCode].totalMax += qMax;
        subTopicMap[sCode].questionCount += 1;
        if (!subTopicMap[sCode].co) subTopicMap[sCode].co = resolvedCO;
        if (!subTopicMap[sCode].bloom) subTopicMap[sCode].bloom = resolvedBloom;

        const isCorrect = !isSkipped && qScored >= (qMax * 0.5);

        attempts.push({
          questionId: qId,
          qNo: qCounter++,
          part: sec.name || 'PART A',
          questionText: q.questionText,
          subTopicCode: sCode,
          subTopicDesc: resolvedTopic,
          co: resolvedCO,
          topic: resolvedTopic,
          bloomLevel: resolvedBloom,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctOption: q.correctOption,
          marksScored: qScored,
          maxMarks: qMax,
          isSkipped,
          isCorrect,
          statusTag: isSkipped ? 'skipped' : (isCorrect ? 'correct' : (qScored > 0 ? 'partial' : 'wrong')),
          subQuestions: mappedSubQs,
        });
      });
    });

    Object.keys(subTopicMap).forEach(k => {
      const item = subTopicMap[k];
      item.pct = item.totalMax > 0 ? Math.round((item.scored / item.totalMax) * 100) : 0;
    });

    const practicalSec = paper?.sections?.find(s => s.type === 'PRACTICAL');
    const practicalMaxMarks = Number(practicalSec?.practicalMarks || (practicalSec?.questions?.reduce((acc, q) => acc + (q.customMarks || q.defaultMarks || 0), 0)) || 40);
    const practicalM = Number(st.practicalMark || 0);
    const practicalPct = practicalMaxMarks > 0 ? Math.round((practicalM / practicalMaxMarks) * 100) : 0;

    const practicalCategories = [
      { id: 'cat-1', name: 'Procedure & Protocol Evaluation', maxMarks: 15, scoredMarks: Number(((practicalM / (practicalMaxMarks || 1)) * 15).toFixed(2)), color: '#5B4BFF' },
      { id: 'cat-2', name: 'Execution & Practical Skill', maxMarks: 10, scoredMarks: Number(((practicalM / (practicalMaxMarks || 1)) * 10).toFixed(2)), color: '#00C48C' },
      { id: 'cat-3', name: 'Viva Voce & Technical Defense', maxMarks: 10, scoredMarks: Number(((practicalM / (practicalMaxMarks || 1)) * 10).toFixed(2)), color: '#F36C21' },
      { id: 'cat-4', name: 'Records, Logbook & Submission', maxMarks: 5, scoredMarks: Number(((practicalM / (practicalMaxMarks || 1)) * 5).toFixed(2)), color: '#FFB020' },
    ];

    const paperMaxM = Number(paper?.max_marks || st.max_marks || 20);

    const reportData = {
      ...st,
      max_marks: paperMaxM,
      batch: academicCascade?.batch?.batch_name || selectedBatch?.name || 'Batch 2024',
      course: academicCascade?.course?.course_name || 'B.Tech',
      semester: academicCascade?.semester?.name || 'Sem 5',
      section: academicCascade?.section || 'A',
      questionAttempts: attempts,
      subTopicResults: subTopicMap,
      isPracticalPaper: isPrac,
      practicalMarks: practicalM,
      practicalMax: practicalMaxMarks,
      practicalPercentage: practicalPct,
      practicalCategories,
    };

    setActiveReportStudent(reportData);
    const expMap: Record<string, boolean> = {};
    Object.keys(subTopicMap).forEach(k => { expMap[k] = true; });
    setExpandedSubTopics(expMap);
    setReportModalTab('subtopics');
    setHoveredSlice(null);
    setReportModalOpen(true);
  };

  const reportPieChartSlices = useMemo(() => {
    if (!activeReportStudent?.subTopicResults) return [];
    const entries = Object.entries(activeReportStudent.subTopicResults);
    if (entries.length === 0) return [];

    const cx = 275;
    const cy = 180;
    const r = 95;

    const dataItems = entries.map(([code, data]: [string, any], idx) => {
      const scored = Number(data.scored) || 0;
      const totalMax = Number(data.totalMax) || 10;
      const pct = Number(data.pct) || 0;
      return {
        code,
        desc: data.desc || code,
        scored,
        totalMax,
        pct,
        val: Math.max(1, scored > 0 ? scored : (totalMax * 0.2)),
        color: CHART_COLORS[idx % CHART_COLORS.length] || '#5B4BFF',
      };
    });

    const totalSum = dataItems.reduce((acc, item) => acc + item.val, 0) || 1;
    let currentAngle = 0;

    return dataItems.map((item) => {
      const sliceAngle = (item.val / totalSum) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      currentAngle += sliceAngle;

      const midAngle = startAngle + sliceAngle / 2;
      const midRad = (midAngle - 90) * (Math.PI / 180);
      const startRad = (startAngle - 90) * (Math.PI / 180);
      const endRad = (endAngle - 90) * (Math.PI / 180);

      const x1 = cx + r * Math.cos(startRad);
      const y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cy + r * Math.sin(endRad);

      const largeArc = sliceAngle > 180 ? 1 : 0;
      const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      const lineLen = 35;
      const lx1 = cx + (r + 4) * Math.cos(midRad);
      const ly1 = cy + (r + 4) * Math.sin(midRad);
      const lx2 = cx + (r + lineLen) * Math.cos(midRad);
      const ly2 = cy + (r + lineLen) * Math.sin(midRad);
      const isRight = lx2 >= cx;
      const lx3 = isRight ? lx2 + 25 : lx2 - 25;
      const ly3 = ly2;

      return {
        ...item,
        pathData,
        lineStart: { x: lx1, y: ly1 },
        lineMid: { x: lx2, y: ly2 },
        lineEnd: { x: lx3, y: ly3 },
        textPos: { x: isRight ? lx3 + 5 : lx3 - 5, y: ly3 + 4 },
        isRight,
      };
    });
  }, [activeReportStudent]);

  // Export to CSV
  const exportMatrixToCsv = () => {
    if (!students.length) return;
    const paperMaxM = Number(activePaper?.max_marks || 20);
    const headers = ['Roll No', 'Registration No', 'Student Name', 'Marks Obtained', 'Max Marks', 'Percentage'];
    paperCompetencies.forEach(comp => headers.push(`CO / Module: ${comp}`));
    headers.push('Result Status');

    const rows = filteredAndSortedStudents.map(st => {
      const pMax = Number(activePaper?.max_marks || st.max_marks || 20);
      const pct = pMax > 0 ? ((st.marks_obtained / pMax) * 100).toFixed(1) : '0.0';
      const row = [
        `"${st.rollno}"`,
        `"${st.registration_no || ''}"`,
        `"${st.name.replace(/"/g, '""')}"`,
        st.marks_obtained.toFixed(2),
        pMax,
        `${pct}%`,
      ];
      paperCompetencies.forEach(comp => {
        const computedScores = calculateStudentCompetencyScores(
          activePaper,
          st.questionMarks,
          st.subPartMarks,
          st.skippedQuestionIds || []
        );
        const compData = (computedScores[comp] && (computedScores[comp].max > 0 || computedScores[comp].isSkipped))
          ? computedScores[comp]
          : (st.competencyScores[comp] || { scored: 0, max: 0, isSkipped: false });
        if (compData.isSkipped || compData.max === 0) {
          row.push('"Skipped (—)"');
        } else {
          const sc = Math.min(compData.max, compData.scored);
          const p = Math.round((sc / compData.max) * 100);
          row.push(`"${sc}/${compData.max} - ${p}%"`);
        }
      });
      row.push(st.is_pass ? '"PASS"' : '"FAIL"');
      return row.join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activePaper?.code || 'Exam'}_Marks_Report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export to Excel
  const exportMatrixToExcel = () => {
    if (!students.length) return;
    const paperMaxM = Number(activePaper?.max_marks || 20);
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
        <x:Name>Marks Report</x:Name>
        <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
        </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          th { background-color: #2D2575; color: #FFFFFF; font-weight: bold; border: 1px solid #CCCCCC; padding: 8px; text-align: left; }
          td { border: 1px solid #DDDDDD; padding: 6px; }
          .pass { color: #00875a; font-weight: bold; }
          .fail { color: #de350b; font-weight: bold; }
          .title { font-size: 14pt; font-weight: bold; color: #2D2575; }
          .meta { font-size: 10pt; color: #555555; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="${7 + paperCompetencies.length}" class="title">FACULTY MARKS EVALUATION &amp; OUTCOMES MATRIX</td></tr>
          <tr><td colspan="${7 + paperCompetencies.length}" class="meta">Paper: [${activePaper?.code}] ${activePaper?.name} | Max Marks: ${paperMaxM} | Generated: ${new Date().toLocaleString()}</td></tr>
          <tr></tr>
          <tr>
            <th>Roll No</th>
            <th>Reg No</th>
            <th>Student Name</th>
            <th>Marks Scored</th>
            <th>Max Marks</th>
            <th>Percentage</th>
            ${paperCompetencies.map(c => `<th>${c}</th>`).join('')}
            <th>Result Status</th>
          </tr>
    `;

    filteredAndSortedStudents.forEach(st => {
      const pMax = Number(activePaper?.max_marks || st.max_marks || 20);
      const pct = pMax > 0 ? ((st.marks_obtained / pMax) * 100).toFixed(1) : '0.0';
      html += `<tr>
        <td>${st.rollno}</td>
        <td>${st.registration_no || ''}</td>
        <td>${st.name}</td>
        <td>${st.marks_obtained.toFixed(2)}</td>
        <td>${pMax}</td>
        <td>${pct}%</td>
      `;
      paperCompetencies.forEach(comp => {
        const computedScores = calculateStudentCompetencyScores(
          activePaper,
          st.questionMarks,
          st.subPartMarks,
          st.skippedQuestionIds || []
        );
        const compData = (computedScores[comp] && (computedScores[comp].max > 0 || computedScores[comp].isSkipped))
          ? computedScores[comp]
          : (st.competencyScores[comp] || { scored: 0, max: 0, isSkipped: false });
        if (compData.isSkipped || compData.max === 0) {
          html += `<td style="color:#888;">Skipped (—)</td>`;
        } else {
          const sc = Math.min(compData.max, compData.scored);
          const p = Math.round((sc / compData.max) * 100);
          html += `<td>${sc}/${compData.max} - ${p}%</td>`;
        }
      });
      html += `<td class="${st.is_pass ? 'pass' : 'fail'}">${st.is_pass ? 'PASS' : 'FAIL'}</td></tr>`;
    });

    html += `</table></body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activePaper?.code || 'Exam'}_Marks_Report_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export / Print PDF
  const exportMatrixToPdf = () => {
    window.print();
  };

  // ── Marks Entry State ─────────────────────────────────────────────────
  const [questionMarksMap, setQuestionMarksMap] = useState<{ [qId: string]: number | string }>({});
  const [subPartMarksMap, setSubPartMarksMap] = useState<{ [subId: string]: number | string }>({});
  const [skippedQuestionsMap, setSkippedQuestionsMap] = useState<{ [qId: string]: boolean }>({});
  const [practicalSectionMark, setPracticalSectionMark] = useState<number | string>(0);
  const [practicalComponentMarksMap, setPracticalComponentMarksMap] = useState<{ [compId: string]: number | string }>({});
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  const detectFirmMode = async () => {
    const stored = typeof window !== 'undefined' ? (localStorage.getItem('firm_mode') || localStorage.getItem('firmMode')) : '';
    if (stored) {
      setFirmMode(stored.toUpperCase());
      return;
    }
    try {
      const uStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (uStr) {
        const u = JSON.parse(uStr);
        if (u.firm_mode || u.firmMode) {
          const fm = String(u.firm_mode || u.firmMode).toUpperCase();
          setFirmMode(fm);
          return;
        }
      }
    } catch {}

    const slug = getTenantSlug().toLowerCase();
    if (slug === 'team-university' || slug === 'apex-tech') {
      setFirmMode('NONMED');
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const d = await res.json();
          const fm = d?.firm_mode || d?.firmMode || d?.user?.firm_mode || d?.user?.firmMode;
          if (fm) {
            setFirmMode(String(fm).toUpperCase());
          }
        }
      } catch {}
    }
  };

  // ── On Mount: fetch all metadata ──────────────────────────────────────
  useEffect(() => {
    setTenantName(getTenantName());
    detectFirmMode();
    fetchAllMetadata();
  }, []);

  // ── When dept changes, auto-select first matching subject ─────────────
  useEffect(() => {
    if (subjectsForDept.length > 0) {
      const exists = subjectsForDept.some(s => s.id === selectedSubject);
      if (!exists) setSelectedSubject(subjectsForDept[0].id);
    }
  }, [selectedDept, allSubjects]);

  // ── When selections or cascade change, reload papers ────────────────────────────
  useEffect(() => {
    fetchExamPapers();
  }, [selectedDept, selectedSubject, selectedBatch, academicCascade]);

  // ── When batch/paper/section changes, reload students ────────────────────────
  useEffect(() => {
    if (selectedBatch || academicCascade?.batch) fetchStudentRoster();
  }, [selectedBatch, selectedPaperId, academicCascade?.section, academicCascade?.batch]);

  const fetchAllMetadata = async () => {
    const slug = getTenantSlug();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const h = { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': slug };

    try {
      let userDeptId = typeof window !== 'undefined' ? localStorage.getItem('departmentId') || '' : '';
      let userDeptNameStr = typeof window !== 'undefined' ? localStorage.getItem('departmentName') || '' : '';
      let userSubjId = typeof window !== 'undefined' ? localStorage.getItem('subjectId') || '' : '';

      let facIdParam = '';
      if (typeof window !== 'undefined') {
        try {
          const u = JSON.parse(localStorage.getItem('user') || '{}');
          facIdParam = u.faculty_id || u.profile?.id || u.id || u.sub || u.emp_id || localStorage.getItem('empid') || '';
        } catch {}
      }

      const meRes = await fetch(`${API_BASE}/auth/me`, { headers: h }).catch(() => null);
      if (meRes && meRes.ok) {
        const json = await meRes.json();
        const meData = json.data || json;
        const profile = meData.profile || {};
        facIdParam = facIdParam || profile.id || profile.emp_id || meData.id || '';
        userDeptId = userDeptId || profile.department_id || meData.departmentId || meData.department_id || '';
        userDeptNameStr = userDeptNameStr || profile.department_name || meData.departmentName || meData.department_name || '';
        userSubjId = userSubjId || profile.subject_id || meData.subjectId || meData.subject_id || '';
        if (userDeptNameStr) setFacultyDeptName(userDeptNameStr);
      }

      // 2. Fetch all master data in parallel
      const [dRes, sRes, bRes, linkRes, profRes, facSubRes, topRes] = await Promise.all([
        fetch(`${API_BASE}/admin-master/departments?tenant=${slug}`, { headers: h }).catch(() => null),
        fetch(`${API_BASE}/admin-master/subjects?tenant=${slug}${facIdParam ? `&facultyId=${encodeURIComponent(facIdParam)}` : ''}`, { headers: h }).catch(() => null),
        fetch(`${API_BASE}/college-master/batches?tenant=${slug}`, { headers: h }).catch(() => null),
        fetch(`${API_BASE}/admin-master/professional-linkers?tenant=${slug}`, { headers: h }).catch(() => null),
        fetch(`${API_BASE}/college-master/professionals?tenant=${slug}`, { headers: h }).catch(() => null),
        facIdParam ? fetch(`${API_BASE}/admin-master/faculty-subjects?tenant=${slug}&facultyId=${encodeURIComponent(facIdParam)}`, { headers: h }).catch(() => null) : Promise.resolve(null),
        fetch(`${API_BASE}/admin-master/topics?tenant=${slug}`, { headers: h }).catch(() => null),
      ]);

      const parseList = (j: any) => Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : [];

      let fetchedDepts: Department[] = [];
      let fetchedSubjects: Subject[] = [];

      if (dRes && dRes.ok) { fetchedDepts = parseList(await dRes.json()); setDepartments(fetchedDepts); }
      if (sRes && sRes.ok) { fetchedSubjects = parseList(await sRes.json()); }

      let linkedItems: any[] = [];
      if (facSubRes && facSubRes.ok) {
        linkedItems = parseList(await facSubRes.json());
      }
      if (linkedItems.length > 0) {
        const linkedKeys = new Set(linkedItems.map((l: any) => String(l.subject_code || l.subject_id || '').toLowerCase()));
        const filtered = fetchedSubjects.filter((s: any) =>
          linkedKeys.has(String(s.code || '').toLowerCase()) ||
          linkedKeys.has(String(s.id || '').toLowerCase()) ||
          linkedKeys.has(String(s.name || '').toLowerCase())
        );
        fetchedSubjects = filtered.length > 0 ? filtered : linkedItems.map((l: any) => ({
          id: l.subject_id || l.id,
          code: l.subject_code || 'SUB',
          name: l.subject_name || 'Subject',
          department_id: l.department_id,
        }));
      }
      setAllSubjects(fetchedSubjects);

      if (fetchedDepts.length > 0) {
        const cleanUserDept = (userDeptNameStr || facultyDeptName || '').toLowerCase().replace('department of ', '').trim();
        const matched = (userDeptId ? fetchedDepts.find(d => d.id === userDeptId) : null) ||
          (cleanUserDept ? fetchedDepts.find(d => d.name.toLowerCase().includes(cleanUserDept) || cleanUserDept.includes(d.name.toLowerCase())) : null) ||
          fetchedDepts[0];

        setSelectedDept(matched.id);

        if (fetchedSubjects.length > 0) {
          const deptSubjs = fetchedSubjects.filter(s => s.department_id === matched.id);
          const matchedSubj = (userSubjId ? deptSubjs.find(s => s.id === userSubjId) || fetchedSubjects.find(s => s.id === userSubjId) : null) ||
            deptSubjs[0] ||
            fetchedSubjects[0];
          if (matchedSubj) setSelectedSubject(matchedSubj.id);
        }
      }

      // Batches
      if (bRes && bRes.ok) {
        const bList = parseList(await bRes.json());
        const mapped: Batch[] = bList.map((b: any) => ({
          id: b.id,
          code: b.code || (b.year ? `Batch ${b.year}` : `Batch ${b.batch_cd || b.id}`),
          year: b.year,
          name: b.name || `${b.code || (b.year ? `Batch ${b.year}` : 'Batch')}`,
        }));
        setBatches(mapped);
        const latest = mapped.sort((a, b) => (b.year || 0) - (a.year || 0))[0];
        if (latest) setSelectedBatch(latest);
      }

      // CBME Years from professional-linkers
      if (linkRes && linkRes.ok) {
        const linkers = parseList(await linkRes.json());
        const years: CbmeYear[] = linkers.map((l: any) => ({
          id: l.id,
          label: l.name ? `${l.name} (${l.academic_session || l.code})` : (l.academic_session || l.code),
          year: l.academic_session || l.code,
        }));
        setCbmeYears(years);
        if (years.length > 0) setSelectedCbmeYearId(years[0].id);
      }

      // Professional Phases
      if (profRes && profRes.ok) {
        const profs = parseList(await profRes.json());
        setProfessionals(profs);
        if (profs.length > 0) setSelectedProfId(profs[0].id);
      }

      // Topics with CO and Bloom's Level
      if (topRes && topRes.ok) {
        const tops = parseList(await topRes.json());
        setTopicsMaster(tops);
      }

    } catch (e) {
      console.error('Failed to fetch metadata', e);
    } finally {
      setMetaLoaded(true);
    }
  };

  const subjectsForDept = useMemo(() => {
    if (!selectedDept) return allSubjects;
    const deptObj = departments.find(d => d.id === selectedDept);
    if (!deptObj) return allSubjects;
    const deptNameClean = deptObj.name.toLowerCase().replace('department of ', '').trim();
    const matches = allSubjects.filter(s => {
      if (s.department_id === selectedDept) return true;
      const sName = s.name.toLowerCase();
      if (deptNameClean && (sName.includes(deptNameClean) || deptNameClean.includes(sName))) return true;
      return false;
    });
    return matches.length > 0 ? matches : allSubjects;
  }, [allSubjects, selectedDept, departments]);

  const fetchExamPapers = async () => {
    const slug = getTenantSlug();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const headers = { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': slug };

    let facIdParam = '';
    let currentRole = '';
    if (typeof window !== 'undefined') {
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        facIdParam = u.faculty_id || u.profile?.id || u.id || u.sub || u.emp_id || localStorage.getItem('empid') || '';
        currentRole = (u.role || '').toUpperCase();
      } catch {}
    }

    try {
      // Query authentic examination papers from backend database
      const queryParams = new URLSearchParams({
        tenant: slug,
        status: 'DQAC_APPROVED,HOD_APPROVED,APPROVED,PUBLISHED',
      });
      if (facIdParam) queryParams.set('facultyId', facIdParam);
      if (currentRole) queryParams.set('role', currentRole);

      if (academicCascade?.college?.colg_cd) queryParams.set('colgCd', academicCascade.college.colg_cd);
      if (academicCascade?.course?.course_cd) queryParams.set('courseCd', String(academicCascade.course.course_cd));
      if (academicCascade?.branch?.branch_cd) queryParams.set('branchCd', String(academicCascade.branch.branch_cd));
      if (academicCascade?.batch?.batch_cd) queryParams.set('batchCd', String(academicCascade.batch.batch_cd));
      if (academicCascade?.semester?.sem_cd) queryParams.set('semester', String(academicCascade.semester.sem_cd));
      if (academicCascade?.section) queryParams.set('section', String(academicCascade.section));
      const activeSubjParam = selectedSubject || academicCascade?.subject?.id || academicCascade?.subject?.code;
      if (activeSubjParam) queryParams.set('subjectId', String(activeSubjParam));

      const res = await fetch(`${API_BASE}/exams/papers?${queryParams.toString()}`, { headers });
      let rawList: any[] = [];
      if (res.ok) {
        const json = await res.json();
        rawList = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
      } else {
        // Fallback fetch if specific filter returned error
        const fallbackRes = await fetch(`${API_BASE}/exams/papers?tenant=${slug}${facIdParam ? `&facultyId=${encodeURIComponent(facIdParam)}` : ''}`, { headers });
        if (fallbackRes.ok) {
          const json = await fallbackRes.json();
          rawList = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        }
      }

      if (rawList.length > 0) {
        const seen = new Set<string>();
        const mapped: ExamPaper[] = rawList
          .filter((p: any) => {
            const code = (p.code || '').toUpperCase();
            const name = (p.name || '').toUpperCase();
            if (code === 'EXAM-PAPER' || name === 'EXAM-PAPER' || code === 'TEST' || code === 'DUMMY') return false;

            // Strictly filter for DQAC / HOD approved papers
            const st = (p.status || '').toUpperCase().trim();
            const isApproved = st === 'DQAC_APPROVED' || st === 'HOD_APPROVED' || st === 'APPROVED' || st === 'PUBLISHED';
            if (!isApproved) return false;

            if (seen.has(p.id) || (p.code && seen.has(p.code))) return false;
            seen.add(p.id);
            if (p.code) seen.add(p.code);
            return true;
          })
          .map((p: any) => {
            const parsedSections = Array.isArray(p.sections) && p.sections.length > 0
              ? mapRawSections(p.sections)
              : [];
            return {
              id: p.id,
              code: p.code || 'EXAM-PAPER',
              name: p.name || 'Examination Paper',
              max_marks: Number(p.max_marks || 100),
              passing_marks: Number(p.passing_marks || Math.round(Number(p.max_marks || 100) * 0.4)),
              duration_mins: Number(p.duration_minutes || p.duration_mins || 60),
              sections_count: parsedSections.length || 1,
              mode: p.type || 'MCQs & DESC',
              status: p.status || 'DQAC_APPROVED',
              subject_id: p.subject_id,
              subject_name: p.subject_name || '',
              subject_code: p.subject_code || '',
              course_name: p.course_name || '',
              course_cd: p.course_cd || '',
              branch_cd: p.branch_cd || '',
              batch_id: p.batch_id,
              batch_name: p.batch_name || '',
              batch_code: p.batch_code || (p.batch_cd ? `Batch ${p.batch_cd}` : selectedBatch?.code || ''),
              topic_name: p.topic_name || '',
              department_name: p.department_name || '',
              paper_set: p.paper_set || '',
              exam_date: p.exam_date || '',
              created_at: p.created_at || '',
              room_no: p.room_no || '',
              hall_name: p.hall_name || '',
              type: p.type || 'THEORY',
              created_by: p.created_by,
              sections: parsedSections.length > 0 ? parsedSections : createGenericPaperSections(p.name, Number(p.max_marks || 100), isNonMed),
            };
          });

        if (mapped.length > 0) {
          setAllFetchedPapers(mapped);
          if (!selectedPaperId || !mapped.find(p => p.id === selectedPaperId)) {
            setSelectedPaperId(mapped[0].id);
          }
          return;
        }
      }
    } catch (e) {
      console.error('Failed to fetch authentic papers from database', e);
    }

    // Never generate fake / mock / medical fallback papers
    setAllFetchedPapers([]);
    setSelectedPaperId('');
  };

  const mapRawSections = (rawSections: any[]): PaperSection[] => {
    return rawSections.map((sec: any) => ({
      id: sec.id || `sec-${Math.random()}`,
      name: sec.name || sec.title || 'Section',
      type: sec.type || 'DESC',
      description: sec.description || sec.instructions || '',
      practicalMarks: Number(
        sec.practicalMarks ||
        (Array.isArray(sec.practicalComponents) && sec.practicalComponents.length > 0
          ? sec.practicalComponents.reduce((acc: number, c: any) => acc + (Number(c.marks) || 0), 0)
          : (sec.type === 'PRACTICAL' ? 20 : 0))
      ),
      practicalComponents: Array.isArray(sec.practicalComponents) ? sec.practicalComponents : [],
      questions: Array.isArray(sec.questions) ? sec.questions.map((q: any) => {
        const meta = resolveTopicAndBloom(q.competencyCode || q.competency_code, q.topic || q.topic_name);
        return {
          questionId: q.questionId || q.id || `q-${Math.random()}`,
          questionText: q.questionText || q.question_text || '',
          mode: q.mode || 'MCQ',
          topic: q.topic || q.topic_name || meta.topic,
          topicCode: q.topicCode || q.topic_code || '',
          competencyCode: q.competencyCode || q.competency_code || '',
          co: q.co || q.unit_code || q.course_outcome || meta.co,
          bloomLevel: q.bloomLevel || q.bloom_level || q.bloomsLevel || meta.bloom,
          defaultMarks: Number(q.defaultMarks || q.max_marks || 2),
          customMarks: Number(q.customMarks || q.max_marks || 2),
          optionA: q.optionA || q.option_a,
          optionB: q.optionB || q.option_b,
          optionC: q.optionC || q.option_c,
          optionD: q.optionD || q.option_d,
          correctOption: q.correctOption || q.correct_option,
          subQuestions: Array.isArray(q.subQuestions) ? q.subQuestions : (typeof q.sub_questions === 'string' ? JSON.parse(q.sub_questions || '[]') : q.sub_questions || []),
        };
      }) : [],
    }));
  };

  const fetchStudentRoster = async () => {
    setLoading(true);
    const slug = getTenantSlug();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const headers = { 'Authorization': `Bearer ${token}`, 'x-tenant-slug': slug };

    // 1. Fetch saved results for current active paper
    const savedResultsMap: { [key: string]: any } = {};
    if (selectedPaperId) {
      try {
        const resResults = await fetch(`${API_BASE}/exams/results?paperId=${selectedPaperId}&tenant=${slug}`, { headers });
        if (resResults.ok) {
          const jsonR = await resResults.json();
          const rList: any[] = Array.isArray(jsonR?.data) ? jsonR.data : Array.isArray(jsonR) ? jsonR : [];
          rList.forEach(r => {
            if (r.student_id) savedResultsMap[String(r.student_id)] = r;
            if (r.rollno) savedResultsMap[String(r.rollno)] = r;
            if (r.registration_no) savedResultsMap[String(r.registration_no)] = r;
          });
        }
      } catch (e) {
        console.error('Error loading paper results:', e);
      }
    }

    // 2. Fetch student list from database
    try {
      let url = `${API_BASE}/student-master?tenant=${slug}`;
      const batchId = academicCascade?.batch?.batch_cd || selectedBatch?.id;
      if (batchId) url += `&batchId=${encodeURIComponent(String(batchId))}`;
      if (academicCascade?.section && academicCascade.section !== 'all') {
        url += `&section=${encodeURIComponent(academicCascade.section)}`;
      }
      if (academicCascade?.branch?.branch_cd) {
        url += `&branchId=${encodeURIComponent(academicCascade.branch.branch_cd)}`;
      }
      if (academicCascade?.course?.course_cd) {
        url += `&courseCd=${encodeURIComponent(academicCascade.course.course_cd)}`;
      }
      const res = await fetch(url, { headers });
      if (res.ok) {
        const json = await res.json();
        const rawList: any[] = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        if (rawList.length > 0) {
          const practicalSec = activePaper?.sections?.find(s => s.type === 'PRACTICAL');
          const hasPractical = Boolean(practicalSec);
          const practicalMaxMarks = Number(
            practicalSec?.practicalMarks ||
            (practicalSec?.practicalComponents?.length ? practicalSec.practicalComponents.reduce((acc: number, c: any) => acc + (Number(c.marks) || 0), 0) : (hasPractical ? 20 : 0))
          );
          const maxM = Number(activePaper?.max_marks || (hasPractical ? (40 + practicalMaxMarks) : 40));

          const seenNameBatch = new Map<string, StudentRow>();
          const seenKey = new Set<string>();

          for (let idx = 0; idx < rawList.length; idx++) {
            const st = rawList[idx];
            if (st.is_active === false) continue;
            const statusUpper = String(st.status || st.studsts || '').toUpperCase().trim();
            if (statusUpper === 'PROPOSED' || statusUpper === 'CANCELLED' || statusUpper === 'WITHDRAWN') continue;

            const stId = st.id || `st-${idx + 1}`;
            const aktuRoll = (st.rollno || '').trim();
            const regNo = (st.registration_no || '').trim();
            const realName = (st.name || '').trim();
            if (!realName) continue;

            const hasAktu = Boolean(aktuRoll && aktuRoll.length >= 10 && aktuRoll !== regNo);
            const displayRoll = aktuRoll || regNo || `#${String(idx + 1).padStart(6, '0')}`;
            const photoUrl = st.photo_url || (regNo ? `https://myportal.srms.ac.in/SRMSERP/Registration/StudentDocument/1/${regNo}/${regNo}.JPG` : undefined);

            const saved = savedResultsMap[stId] || (regNo && savedResultsMap[regNo]) || (aktuRoll && savedResultsMap[aktuRoll]) || savedResultsMap[realName.toLowerCase()];

            const qM = saved?.question_marks ? (typeof saved.question_marks === 'string' ? JSON.parse(saved.question_marks) : saved.question_marks) : undefined;
            const subM = saved?.sub_part_marks ? (typeof saved.sub_part_marks === 'string' ? JSON.parse(saved.sub_part_marks) : saved.sub_part_marks) : undefined;
            const skippedRaw = saved?.skipped_question_ids ? (typeof saved.skipped_question_ids === 'string' ? JSON.parse(saved.skipped_question_ids) : saved.skipped_question_ids) : (saved?.ignored_question_ids ? (typeof saved.ignored_question_ids === 'string' ? JSON.parse(saved.ignored_question_ids) : saved.ignored_question_ids) : []);
            const skippedList: string[] = Array.isArray(skippedRaw) ? skippedRaw : [];

            const rowItem: StudentRow = {
              id: stId,
              rollno: displayRoll,
              registration_no: regNo,
              photo_url: photoUrl,
              name: realName,
              gender: st.gender || 'Male',
              evaluated: Boolean(saved),
              marks_obtained: saved ? Number(saved.marks_obtained) : 0,
              max_marks: maxM,
              questionMarks: qM,
              subPartMarks: subM,
              skippedQuestionIds: skippedList,
              practicalMark: saved ? Number(saved.practical_mark || 0) : undefined,
              competencyScores: {},
              is_pass: saved ? Boolean(saved.is_pass) : false,
            };

            const dedupeKey = hasAktu ? `aktu_${aktuRoll}` : (regNo ? `reg_${regNo}` : `id_${stId}`);
            if (seenKey.has(dedupeKey)) continue;

            const nameBatchKey = `${realName.toLowerCase()}_${st.course_cd || ''}_${st.batch_cd || ''}`;
            const existing = seenNameBatch.get(nameBatchKey);
            if (existing) {
              const existingHasAktu = Boolean(existing.rollno && existing.rollno.length >= 10 && existing.rollno !== existing.registration_no);
              if (hasAktu && !existingHasAktu) {
                seenNameBatch.set(nameBatchKey, rowItem);
                seenKey.add(dedupeKey);
              }
              continue;
            }

            seenNameBatch.set(nameBatchKey, rowItem);
            seenKey.add(dedupeKey);
          }

          const mapped = Array.from(seenNameBatch.values());
          setStudents(mapped);
          setSelectedStudentId(mapped[0]?.id || null);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.error('fetchStudentRoster error:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(s =>
      s.name.toLowerCase().includes(q) ||
      String(s.rollno).toLowerCase().includes(q) ||
      String(s.registration_no || '').toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  const selectedStudent = useMemo(() => students.find(s => s.id === selectedStudentId) || null, [students, selectedStudentId]);

  const hasPracticalSec = useMemo(() => {
    return Boolean(activePaper?.sections?.some(s => s.type === 'PRACTICAL'));
  }, [activePaper]);

  // Pre-calculate flat index of all input fields for keyboard Enter navigation
  const inputIndexMap = useMemo(() => {
    const map: { [fieldKey: string]: number } = {};
    let idx = 0;
    if (!activePaper?.sections) return map;

    activePaper.sections.forEach(sec => {
      if (sec.type === 'PRACTICAL') {
        map[`practical_sec_${sec.id}`] = idx++;
        if (Array.isArray(sec.practicalComponents) && sec.practicalComponents.length > 0) {
          sec.practicalComponents.forEach((comp, cIdx) => {
            const compKey = comp.id || `comp_${cIdx}`;
            map[`practical_comp_${compKey}`] = idx++;
          });
        }
      } else {
        sec.questions.forEach(q => {
          const qId: string = q.questionId || (q as any).id || '';
          if (!q.subQuestions || q.subQuestions.length === 0) {
            map[`q_${qId}`] = idx++;
          } else {
            q.subQuestions.forEach(sq => {
              map[`sq_${qId}_${sq.id}`] = idx++;
            });
          }
        });
      }
    });

    return map;
  }, [activePaper]);

  // Reset / populate marks when selected student or paper changes
  useEffect(() => {
    if (!selectedStudent || !activePaper?.sections) return;
    const qMarks: { [qId: string]: number | string } = {};
    const subMarks: { [subId: string]: number | string } = {};
    const skippedMap: { [qId: string]: boolean } = {};

    const savedSkipped = new Set<string>(selectedStudent.skippedQuestionIds || []);

    activePaper.sections.forEach(sec => {
      sec.questions.forEach(q => {
        const qId: string = q.questionId || (q as any).id || '';
        const savedQ = selectedStudent.questionMarks?.[qId];
        const isQExplicitlySkipped = savedSkipped.has(qId) || savedQ === 'SKIPPED' || savedQ === null;

        if (isQExplicitlySkipped) {
          skippedMap[qId] = true;
          qMarks[qId] = '';
        } else {
          qMarks[qId] = selectedStudent.evaluated
            ? (savedQ !== undefined && !isNaN(Number(savedQ)) ? Number(savedQ) : 0)
            : 0;
        }

        if (Array.isArray(q.subQuestions)) {
          q.subQuestions.forEach(sq => {
            const compositeKey = `${qId}_${sq.id}`;
            const savedSub = selectedStudent.subPartMarks?.[compositeKey] ?? selectedStudent.subPartMarks?.[sq.id];
            const parsedVal = savedSub !== undefined && !isNaN(Number(savedSub)) ? Number(savedSub) : 0;
            subMarks[compositeKey] = selectedStudent.evaluated && !isQExplicitlySkipped ? parsedVal : 0;
          });
        }
      });
    });

    setSkippedQuestionsMap(skippedMap);
    setQuestionMarksMap(qMarks);
    setSubPartMarksMap(subMarks);
    setPracticalSectionMark(
      hasPracticalSec
        ? (selectedStudent.evaluated ? Number(selectedStudent.practicalMark ?? 0) : 0)
        : 0
    );
  }, [selectedStudentId, selectedPaperId, selectedStudent?.evaluated, hasPracticalSec]);

  // Auto focus and select first available input when student is selected
  useEffect(() => {
    if (selectedStudentId) {
      const timer = setTimeout(() => {
        const firstEnabled = inputRefs.current.find(el => el && !el.disabled);
        if (firstEnabled) {
          firstEnabled.focus();
          firstEnabled.select();
        }
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [selectedStudentId, activePaper?.id]);

  const toggleQuestionSkip = (qId: string) => {
    setSkippedQuestionsMap(prev => {
      const isNowSkipped = !prev[qId];
      if (isNowSkipped) {
        setQuestionMarksMap(qm => ({ ...qm, [qId]: '' }));
      }
      return { ...prev, [qId]: isNowSkipped };
    });
  };

  const handleMarkChange = (
    id: string,
    rawVal: string,
    maxMarks: number,
    type: 'question' | 'sub' | 'practical'
  ) => {
    if (rawVal === '') {
      if (type === 'question') setQuestionMarksMap(prev => ({ ...prev, [id]: '' }));
      else if (type === 'sub') setSubPartMarksMap(prev => ({ ...prev, [id]: '' }));
      else setPracticalSectionMark('');
      return;
    }

    const parsed = parseFloat(rawVal);
    if (isNaN(parsed)) return;

    let validated = parsed;
    if (validated < 0) {
      validated = 0;
    } else if (validated > maxMarks) {
      validated = maxMarks;
    }

    if (type === 'question') {
      setSkippedQuestionsMap(sm => ({ ...sm, [id]: false }));
      setQuestionMarksMap(prev => ({ ...prev, [id]: validated }));
    } else if (type === 'sub') {
      const parentQId = id.split('_')[0];
      if (parentQId) setSkippedQuestionsMap(sm => ({ ...sm, [parentQId]: false }));
      setSubPartMarksMap(prev => ({ ...prev, [id]: validated }));
    } else {
      setPracticalSectionMark(validated);
    }
  };

  const handleMarkBlur = (
    id: string,
    maxMarks: number,
    type: 'question' | 'sub' | 'practical'
  ) => {
    if (type === 'question') {
      setQuestionMarksMap(prev => {
        const v = prev[id];
        if (skippedQuestionsMap[id]) return prev;
        const num = typeof v === 'number' ? v : parseFloat(String(v));
        const finalVal = isNaN(num) ? 0 : Math.min(maxMarks, Math.max(0, num));
        return { ...prev, [id]: finalVal };
      });
    } else if (type === 'sub') {
      setSubPartMarksMap(prev => {
        const v = prev[id];
        const num = typeof v === 'number' ? v : parseFloat(String(v));
        const finalVal = isNaN(num) ? 0 : Math.min(maxMarks, Math.max(0, num));
        return { ...prev, [id]: finalVal };
      });
    } else {
      setPracticalSectionMark(prev => {
        const num = typeof prev === 'number' ? prev : parseFloat(String(prev));
        return isNaN(num) ? 0 : Math.min(maxMarks, Math.max(0, num));
      });
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    currentIndex: number,
    id: string,
    maxMarks: number,
    type: 'question' | 'sub' | 'practical'
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleMarkBlur(id, maxMarks, type);

      // Search forward for the next active non-disabled input
      let nextIdx = currentIndex + 1;
      let nextInput = inputRefs.current[nextIdx];
      while (nextInput && nextInput.disabled) {
        nextIdx++;
        nextInput = inputRefs.current[nextIdx];
      }

      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      } else {
        // Last input reached: save current student evaluation and load next
        handleSaveStudentEvaluation();
      }
    }
  };

  const calculatedStudentTotal = useMemo(() => {
    if (!activePaper?.sections) return 0;
    let grandTotal = 0;

    activePaper.sections.forEach(sec => {
      if (sec.type === 'PRACTICAL') {
        const practVal = typeof practicalSectionMark === 'number' ? practicalSectionMark : (parseFloat(String(practicalSectionMark)) || 0);
        grandTotal += isNaN(practVal) ? 0 : practVal;
        return;
      }

      const questionsList = sec.questions || [];
      const scoredQuestions: { qId: string; scored: number; isAttempted: boolean }[] = [];

      questionsList.forEach(q => {
        const qId: string = q.questionId || (q as any).id || '';
        const qMax = Number(q.customMarks || q.defaultMarks || 2);
        const isSkipped = Boolean(skippedQuestionsMap[qId]);

        if (isSkipped) {
          scoredQuestions.push({ qId, scored: 0, isAttempted: false });
          return;
        }

        if (Array.isArray(q.subQuestions) && q.subQuestions.length > 0) {
          let subSum = 0;
          let anyEntered = false;
          q.subQuestions.forEach(sq => {
            const compositeKey = `${qId}_${sq.id}`;
            const val = subPartMarksMap[compositeKey];
            if (val !== undefined && val !== '' && !isNaN(Number(val))) {
              subSum += Number(val);
              anyEntered = true;
            }
          });
          scoredQuestions.push({
            qId,
            scored: Math.min(qMax, subSum),
            isAttempted: anyEntered,
          });
        } else {
          const val = questionMarksMap[qId];
          const hasVal = val !== undefined && val !== '' && !isNaN(Number(val));
          scoredQuestions.push({
            qId,
            scored: hasVal ? Math.min(qMax, Math.max(0, Number(val))) : 0,
            isAttempted: hasVal,
          });
        }
      });

      const reqAttempt = Number(sec.requiredToAttempt);
      const isChoiceRule = (sec.attemptRule === 'CHOICE' || (reqAttempt > 0 && reqAttempt < questionsList.length));

      if (isChoiceRule && reqAttempt > 0) {
        // Top N best scored questions are counted for choice sections
        const attempted = scoredQuestions.filter(sq => sq.isAttempted);
        attempted.sort((a, b) => b.scored - a.scored);
        const counted = attempted.slice(0, reqAttempt);
        const secTotal = counted.reduce((sum, item) => sum + item.scored, 0);
        grandTotal += secTotal;
      } else {
        const secTotal = scoredQuestions.reduce((sum, item) => sum + item.scored, 0);
        grandTotal += secTotal;
      }
    });

    return Math.round(grandTotal * 100) / 100;
  }, [activePaper, questionMarksMap, subPartMarksMap, practicalSectionMark, skippedQuestionsMap]);

  const handleSaveStudentEvaluation = async () => {
    if (!selectedStudent || !activePaper) return;
    setSaving(true);
    const slug = getTenantSlug();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

    const sanitizedQMarks: { [k: string]: number | string } = {};
    Object.entries(questionMarksMap).forEach(([k, v]) => {
      if (skippedQuestionsMap[k]) {
        sanitizedQMarks[k] = 'SKIPPED';
      } else {
        const num = typeof v === 'number' ? v : parseFloat(String(v));
        sanitizedQMarks[k] = isNaN(num) ? 0 : num;
      }
    });

    const sanitizedSubMarks: { [k: string]: number } = {};
    Object.entries(subPartMarksMap).forEach(([k, v]) => {
      const num = typeof v === 'number' ? v : parseFloat(String(v));
      sanitizedSubMarks[k] = isNaN(num) ? 0 : num;
    });

    const skippedIds = Object.keys(skippedQuestionsMap).filter(k => skippedQuestionsMap[k]);

    const sanitizedPractical = typeof practicalSectionMark === 'number'
      ? practicalSectionMark
      : (parseFloat(String(practicalSectionMark)) || 0);

    const evaluatedTotal = calculatedStudentTotal;

    try {
      await fetch(`${API_BASE}/exams/results?tenant=${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'x-tenant-slug': slug },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          rollno: selectedStudent.rollno,
          studentName: selectedStudent.name,
          paperId: activePaper.id,
          marksObtained: evaluatedTotal,
          questionMarks: sanitizedQMarks,
          subPartMarks: sanitizedSubMarks,
          skippedQuestionIds: skippedIds,
          practicalMark: hasPracticalSec ? sanitizedPractical : 0,
        }),
      });
    } catch (err) {
      console.error('Error saving student result:', err);
    }

    const maxM = activePaper.max_marks || 100;
    const computedScores = calculateStudentCompetencyScores(
      activePaper,
      sanitizedQMarks,
      sanitizedSubMarks,
      skippedIds
    );

    setStudents(prev => prev.map(s => {
      if (s.id !== selectedStudent.id) return s;
      return {
        ...s,
        evaluated: true,
        marks_obtained: evaluatedTotal,
        max_marks: maxM,
        questionMarks: sanitizedQMarks,
        subPartMarks: sanitizedSubMarks,
        skippedQuestionIds: skippedIds,
        practicalMark: hasPracticalSec ? sanitizedPractical : 0,
        competencyScores: computedScores,
        is_pass: evaluatedTotal >= (activePaper.passing_marks || maxM * 0.4)
      };
    }));

    // Auto-load next student from the roster
    const currentIdx = filteredStudents.findIndex(s => s.id === selectedStudent.id);
    const nextStudent = currentIdx >= 0 && currentIdx + 1 < filteredStudents.length
      ? filteredStudents[currentIdx + 1]
      : null;

    if (nextStudent) {
      setSelectedStudentId(nextStudent.id);
      setSaveSuccessMsg(`Evaluation for ${selectedStudent.name} (${evaluatedTotal.toFixed(2)} / ${activePaper.max_marks} Marks) saved! Next student loaded: ${nextStudent.name}`);
    } else {
      setSaveSuccessMsg(`Evaluation for ${selectedStudent.name} (${evaluatedTotal.toFixed(2)} / ${activePaper.max_marks} Marks) saved! All students in roster evaluated.`);
    }

    setTimeout(() => setSaveSuccessMsg(''), 5000);
    setSaving(false);
  };

  const deptObj = departments.find(d => d.id === selectedDept);
  const subjObj = subjectsForDept.find(s => s.id === selectedSubject);

  const evaluatedCount = students.filter(s => s.evaluated).length;
  const pendingCount = students.length - evaluatedCount;

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="faculty" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Faculty Evaluation & Marks Entry Portal" />
        <main className="p-6 space-y-6 flex-1">

          {/* ── Alert Toast Notification ── */}
          {saveSuccessMsg && (
            <div className="p-4 rounded-[22px] text-xs font-black flex items-center justify-between border shadow-soft bg-[#E6F9F3] text-[#00C48C] border-[#00C48C]/30 transition-all">
              <span>✅ {saveSuccessMsg}</span>
              <button onClick={() => setSaveSuccessMsg('')} className="text-[#4E5969] hover:text-[#1B1E28] font-black ml-4">✕</button>
            </div>
          )}

          {/* ── Header Banner Card ── */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-extrabold text-[#5B4BFF] uppercase tracking-widest">
                  🏛️ {academicCascade?.course?.course_name || deptObj?.name || facultyDeptName}
                </span>
                {academicCascade?.branch && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E6F9F3] text-[#00C48C] border border-[#00C48C]/20">
                    🌿 {academicCascade.branch.branch_name}
                  </span>
                )}
                {(academicCascade?.subject || subjObj) && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#EEF2FF] text-[#5B4BFF] border border-[#5B4BFF]/20">
                    📖 {academicCascade?.subject?.name || subjObj?.name}
                  </span>
                )}
                {(academicCascade?.batch || selectedBatch) && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFF4EC] text-[#F36C21] border border-[#F36C21]/20">
                    🎓 Batch: {academicCascade?.batch?.batch_name || selectedBatch?.name || selectedBatch?.code}
                  </span>
                )}
                {academicCascade?.section && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#F5F3FF] text-[#7C3AED] border border-[#7C3AED]/20">
                    🏷️ Section: {academicCascade.section}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black text-[#1B1E28] dark:text-white tracking-tight uppercase mt-1.5">
                Faculty Evaluation Center — Designed Paper Grading
              </h2>
              <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-0.5">
                Evaluate student paper submissions section-wise, enter marks per question, and track {isNonMed ? 'Course Learning Outcomes & Module Performance' : 'CBME Competency Achievement'}.
              </p>
            </div>

            <button
              onClick={handleSaveStudentEvaluation}
              disabled={saving || !selectedStudent || !activePaper}
              className="px-7 py-3 bg-[#5B4BFF] hover:bg-[#4E3EFF] text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50 shrink-0"
            >
              {saving ? '⏳ Saving Evaluation...' : '💾 Save Student Evaluation'}
            </button>
          </div>

          {/* ── STEP 1: Cascading Dynamic Course & Subject Linker (FacultyAcademicCascadingDropdown) ── */}
          <FacultyAcademicCascadingDropdown
            onSelectionChange={handleAcademicCascadeChange}
            showSection={true}
            showSubject={true}
            onlyLinkedSubjects={true}
            title="🏛️ Step 1: Faculty Academic Hierarchy Cascading"
            subtitle="College → Course → Branch → Batch → Semester → Section → Linked Subject"
          />

          {/* ── STEP 2: Designed & Approved Examination Paper Cards (Exact screenshot match) ── */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
              <h3 className="text-xs font-black text-[#1B1E28] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#5B4BFF] text-white flex items-center justify-center text-[10px] font-black">2</span>
                STEP 2: DESIGNED &amp; APPROVED EXAMINATION PAPERS ({filteredPapers.length} Papers)
              </h3>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#E6F9F3] text-[#00C48C] border border-[#00C48C]/30">
                ✓ DAQC Approved — Marking Enabled
              </span>
            </div>

            {filteredPapers.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <span className="text-4xl">📋</span>
                <p className="text-sm font-black text-[#1B1E28] dark:text-white">
                  No DQAC-Approved Examination Papers Found
                </p>
                <p className="text-xs text-[#4E5969] dark:text-slate-400 max-w-md mx-auto">
                  Only authentic question papers created and approved by DQAC / HOD for this faculty and subject are displayed here for marks entry.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredPapers.map(paper => {
                  const isActive = paper.id === activePaper?.id;
                  return (
                    <div
                      key={paper.id}
                      onClick={() => setSelectedPaperId(paper.id)}
                      className={`cursor-pointer transition-all duration-200 rounded-[22px] overflow-hidden flex flex-col justify-between ${
                        isActive
                          ? 'border-2 border-[#5B4BFF] shadow-lg shadow-indigo-500/10 bg-white dark:bg-slate-900'
                          : 'border border-[#E7EAF3] dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#5B4BFF]/50 shadow-soft'
                      }`}
                    >
                      {/* Top Header Banner for Active Card */}
                      {isActive && (
                        <div className="bg-[#2D2575] text-white px-4 py-2 flex items-center justify-between font-black text-[11px] uppercase tracking-wider">
                          <span>SELECTED PAPER — MARKING ACTIVE</span>
                          <span className="text-[#F36C21] font-black">✓ ACTIVE</span>
                        </div>
                      )}

                      {/* Card Content Body */}
                      <div className="p-5 flex items-start justify-between gap-4">
                        {/* Left Side: Time / Duration & Date */}
                        <div className="shrink-0 space-y-1">
                          <p className="text-lg sm:text-xl font-black text-[#F36C21] tracking-tight">
                            {paper.duration_mins ? `${paper.duration_mins} MINS` : '60 MINS'}
                          </p>
                          <p className="text-[11px] font-extrabold uppercase text-[#4E5969] dark:text-slate-400">
                            {paper.max_marks} MARKS
                          </p>
                          <p className="text-[10px] font-bold text-[#7B8794] uppercase mt-1">
                            {(() => {
                              const rawDate = paper.exam_date || paper.created_at;
                              if (!rawDate) return 'SESSION 2026';
                              try {
                                const d = new Date(rawDate);
                                if (isNaN(d.getTime())) return 'SESSION 2026';
                                return d.toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                }).toUpperCase();
                              } catch {
                                return 'SESSION 2026';
                              }
                            })()}
                          </p>
                        </div>

                        {/* Right Side: Title, Peach Tag, and Meta */}
                        <div className="flex-1 min-w-0 space-y-2 text-right">
                          <h4 className="text-xs sm:text-sm font-black text-[#1B1E28] dark:text-white uppercase truncate" title={paper.name}>
                            {(() => {
                              const subj = paper.subject_name || academicCascade?.subject?.name || '';
                              if (subj && !paper.name.toLowerCase().includes(subj.toLowerCase())) {
                                return `${subj} — ${paper.name}`;
                              }
                              return paper.name;
                            })()}
                          </h4>

                          <div className="inline-block px-3 py-1 rounded-full bg-[#FFF4EC] text-[#F36C21] border border-[#F36C21]/30 text-[10px] font-extrabold uppercase tracking-tight truncate max-w-full">
                            {(paper.type || 'EXAM').toUpperCase()} &quot;{paper.topic_name || (paper.paper_set ? `SET ${paper.paper_set}` : paper.subject_name || paper.name)}&quot;
                          </div>

                          <div className="text-[11px] text-[#4E5969] dark:text-slate-400 font-bold space-y-0.5">
                            <p>
                              #{paper.batch_name || paper.batch_code || academicCascade?.batch?.batch_name || selectedBatch?.name || 'Batch'}
                              {paper.room_no || paper.hall_name ? ` • ${paper.room_no || paper.hall_name}` : ''}
                            </p>
                            <p className="text-[10px] text-[#7B8794]">
                              🕒 [{paper.code}] • Pass: {paper.passing_marks} Marks
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Card Bottom Footer */}
                      <div className="px-5 py-3 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between bg-[#F8FAFC]/70 dark:bg-slate-800/40">
                        {isActive ? (
                          <>
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#E6F9F3] text-[#00C48C] border border-[#00C48C]/30">
                              ● MARKED ({evaluatedCount} P • {pendingCount} A)
                            </span>
                            <span className="text-[#5B4BFF] font-black text-xs">
                              ✓ Active Roster
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FFF8E6] text-[#FFB020] border border-[#FFB020]/30">
                              ● PENDING
                            </span>
                            <span className="text-[#F36C21] font-black text-xs hover:underline">
                              Select Paper →
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── STEP 3: Split View — Students Roster (Left) + Question-wise Evaluation (Right) ── */}
          {activePaper && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Left Column: Batch Students Roster */}
              <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-5 shadow-soft space-y-4">
                <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
                  <h3 className="text-xs font-black text-[#1B1E28] dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#5B4BFF] text-white flex items-center justify-center text-[10px] font-black">3</span>
                    BATCH STUDENTS ({filteredStudents.length})
                  </h3>
                  <span className="text-[10px] font-mono font-black text-[#F36C21]">
                    {selectedBatch?.name || selectedBatch?.code}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="🔍 Search by roll number or name..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold focus:border-[#5B4BFF] focus:outline-none shadow-sm"
                  />
                </div>

                {loading ? (
                  <div className="py-8 text-center text-[#4E5969] dark:text-slate-400 text-xs font-bold">Loading student roster...</div>
                ) : (
                  <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                    {filteredStudents.map(st => {
                      const isSel = st.id === selectedStudentId;
                      return (
                        <div
                          key={st.id}
                          onClick={() => setSelectedStudentId(st.id)}
                          className={`p-3 rounded-xl cursor-pointer transition-all duration-150 border flex items-center justify-between gap-3 ${
                            isSel
                              ? 'bg-[#EEF2FF] border-2 border-[#5B4BFF] text-[#1B1E28] dark:text-white shadow-sm'
                              : 'bg-white dark:bg-slate-800/60 border-[#E7EAF3] dark:border-slate-800 hover:border-[#5B4BFF]/40 text-[#4E5969] dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Profile Photo */}
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 flex-shrink-0 border border-slate-200 dark:border-slate-600 flex items-center justify-center">
                              {st.photo_url ? (
                                <img
                                  src={st.photo_url}
                                  alt={st.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                    const next = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                                    if (next) next.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <span
                                className="w-full h-full text-[11px] font-black text-slate-500 uppercase flex items-center justify-center"
                                style={st.photo_url ? { display: 'none' } : undefined}
                              >
                                {st.name.slice(0, 2)}
                              </span>
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[11px] font-mono font-black ${isSel ? 'text-[#5B4BFF]' : 'text-slate-800 dark:text-slate-200'}`}>
                                  {st.rollno}
                                </span>
                                {st.registration_no && st.registration_no !== st.rollno && (
                                  <span className="text-[10px] font-mono text-slate-400">
                                    ({st.registration_no})
                                  </span>
                                )}
                                {st.evaluated ? (
                                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-[#E6F9F3] text-[#00C48C] border border-[#00C48C]/30">
                                    ✓ Done
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-[#FFF8E6] text-[#FFB020] border border-[#FFB020]/30">
                                    Pending
                                  </span>
                                )}
                              </div>
                              <h5 className="text-xs font-black text-[#1B1E28] dark:text-white mt-0.5 truncate">{st.name}</h5>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span className={`text-xs font-black ${st.evaluated ? 'text-[#00C48C]' : 'text-[#7B8794]'}`}>
                              {st.marks_obtained.toFixed(1)} / {st.max_marks}
                            </span>
                            <span className="block text-[9px] font-extrabold uppercase text-[#7B8794]">Score</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Full Paper Section & Question Details Breakdown */}
              <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-5">
                {selectedStudent ? (
                  <div className="space-y-5">
                    {/* Student Evaluation Header Bar */}
                    <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-800 pb-4 flex-wrap gap-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Student Avatar */}
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 border-2 border-[#5B4BFF]/30 flex-shrink-0 flex items-center justify-center shadow-sm">
                          {selectedStudent.photo_url ? (
                            <img
                              src={selectedStudent.photo_url}
                              alt={selectedStudent.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                                const next = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                                if (next) next.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <span
                            className="w-full h-full text-sm font-black text-slate-500 uppercase flex items-center justify-center"
                            style={selectedStudent.photo_url ? { display: 'none' } : undefined}
                          >
                            {selectedStudent.name.slice(0, 2)}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-black text-[#5B4BFF] uppercase tracking-widest block">
                            Evaluating Answer Sheet
                          </span>
                          <h3 className="text-lg font-black text-[#1B1E28] dark:text-white mt-0.5">{selectedStudent.name}</h3>
                          <div className="flex items-center gap-2 flex-wrap text-xs text-[#4E5969] dark:text-slate-400 font-medium">
                            <span>AKTU Roll: <strong className="font-mono text-[#5B4BFF]">{selectedStudent.rollno}</strong></span>
                            {selectedStudent.registration_no && (
                              <span>• Reg No: <strong className="font-mono text-slate-700 dark:text-slate-300">{selectedStudent.registration_no}</strong></span>
                            )}
                            <span>• Paper: [{activePaper.code}] {activePaper.name}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right bg-[#F8FAFC] dark:bg-slate-800 p-3.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700">
                        <span className="text-[10px] font-black text-[#4E5969] dark:text-slate-400 uppercase block">Live Calculated Score</span>
                        <span className="text-2xl font-black text-[#00C48C]">{calculatedStudentTotal.toFixed(2)}</span>
                        <span className="text-xs font-black text-[#4E5969] dark:text-slate-400"> / {activePaper.max_marks}</span>
                      </div>
                    </div>

                    {/* Section by Section — With Full Question Name & Prompts */}
                    <div className="space-y-5 max-h-[600px] overflow-y-auto pr-1">
                      {activePaper.sections?.map((sec, secIdx) => (
                        <div key={sec.id} className="p-5 rounded-[20px] bg-[#F8FAFC] dark:bg-slate-800/60 border border-[#E7EAF3] dark:border-slate-800 space-y-4">
                          {/* Section Header */}
                          <div className="flex items-center justify-between border-b border-[#E7EAF3] dark:border-slate-700 pb-2.5 flex-wrap gap-2">
                            <h4 className="text-xs font-black text-[#1B1E28] dark:text-white uppercase flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-[#5B4BFF] text-white flex items-center justify-center text-[10px] font-black">
                                {secIdx + 1}
                              </span>
                              {sec.name}
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-black ${
                                sec.type === 'MCQ'
                                  ? 'bg-[#EEF2FF] text-[#5B4BFF] border border-[#5B4BFF]/30'
                                  : sec.type === 'PRACTICAL'
                                  ? 'bg-purple-100 text-purple-700 border border-purple-300'
                                  : 'bg-[#E6F9F3] text-[#00C48C] border border-[#00C48C]/30'
                              }`}>
                                {sec.type}
                              </span>
                            </h4>
                            <span className="text-[11px] text-[#4E5969] dark:text-slate-400 font-bold">{cleanDescription(sec.description)}</span>
                          </div>

                          {/* Practical Section OSPE / Lab Assessment */}
                          {sec.type === 'PRACTICAL' ? (
                            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800 shadow-sm space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 dark:border-purple-900/40 pb-2.5">
                                <div>
                                  <p className="text-xs font-black text-[#1B1E28] dark:text-white flex items-center gap-1.5">
                                    <span>{isNonMed ? '📊' : '🧪'}</span>
                                    <span>{sec.name || (isNonMed ? 'Practical / Lab & Viva Voce Assessment' : 'Practical & Viva Voce Assessment')}</span>
                                  </p>
                                  <span className="text-[11px] text-[#4E5969] dark:text-slate-400 font-medium">
                                    {cleanDescription(sec.description)} · Max Weightage: {sec.practicalMarks || 20} Marks
                                  </span>
                                </div>
                                  {(() => {
                                    const pMax = sec.practicalMarks || 20;
                                    const inputIdx = inputIndexMap[`practical_sec_${sec.id}`] ?? 0;
                                    const currentVal = practicalSectionMark !== undefined ? practicalSectionMark : 0;
                                    return (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-[#4E5969] dark:text-slate-300">Total Awarded Marks:</span>
                                        <input
                                          ref={el => { inputRefs.current[inputIdx] = el; }}
                                          type="number"
                                          min={0}
                                          max={pMax}
                                          step="any"
                                          value={currentVal}
                                          placeholder="0"
                                          onFocus={e => e.target.select()}
                                          onChange={e => handleMarkChange(sec.id, e.target.value, pMax, 'practical')}
                                          onBlur={() => handleMarkBlur(sec.id, pMax, 'practical')}
                                          onKeyDown={e => handleKeyDown(e, inputIdx, sec.id, pMax, 'practical')}
                                          className="w-20 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border-2 border-purple-400 text-purple-700 dark:text-purple-300 font-black text-xs text-center focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-sm transition"
                                        />
                                        <span className="text-xs text-[#7B8794] font-bold">/ {pMax}</span>
                                      </div>
                                    );
                                  })()}
                              </div>

                              {/* Station Breakdown if practicalComponents are defined */}
                              {Array.isArray(sec.practicalComponents) && sec.practicalComponents.length > 0 && (
                                <div className="space-y-2 pt-1">
                                  <span className="text-[10px] font-extrabold uppercase text-purple-700 dark:text-purple-300 block">
                                    {isNonMed ? 'Component-Wise Rubric Scoring (Auto-Sums into Total):' : 'Station-Wise Rubric Scoring (Auto-Sums into Total):'}
                                  </span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {sec.practicalComponents.map((comp: any, cIdx: number) => {
                                      const compKey = comp.id || `comp_${cIdx}`;
                                      const compMax = Number(comp.marks || 5);
                                      return (
                                        <div key={compKey} className="flex items-center justify-between p-2 rounded-lg bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-xs">
                                          <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-2">
                                            <span className="font-mono font-bold text-purple-600 text-[10px]">#{cIdx + 1}</span>
                                            <span className="font-medium text-[#1B1E28] dark:text-slate-200 truncate">{comp.name}</span>
                                          </div>
                                          <div className="flex items-center gap-1 shrink-0">
                                            <input
                                              type="number"
                                              min={0}
                                              max={compMax}
                                              step="any"
                                              value={practicalComponentMarksMap[compKey] !== undefined ? practicalComponentMarksMap[compKey] : ''}
                                              placeholder="0"
                                              onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                const updated: Record<string, number> = { ...practicalComponentMarksMap, [compKey]: val };
                                                setPracticalComponentMarksMap(updated);
                                                const numValues = Object.values(updated) as number[];
                                                const newTotal = Math.round(numValues.reduce((a: number, b: number) => a + (Number(b) || 0), 0) * 100) / 100;
                                                setPracticalSectionMark(newTotal);
                                              }}
                                              className="w-14 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 font-mono text-center font-bold text-purple-700 dark:text-purple-300 text-xs"
                                            />
                                            <span className="text-[10px] text-[#7B8794] font-bold">/ {compMax}</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-3.5">
                              {sec.questions.length === 0 ? (
                                <p className="text-xs text-[#4E5969] dark:text-slate-400 italic text-center py-3">No questions defined in this section</p>
                              ) : (
                                <div className="space-y-3.5">
                                  {/* Fast Navigation Tip */}
                                  <div className="px-3.5 py-2 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                      <span>⌨️ <strong>Fast Evaluation:</strong> Type marks and press</span>
                                      <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-indigo-200 dark:border-slate-700 font-mono font-black text-[#5B4BFF] shadow-xs text-[10px]">Enter ↵</kbd>
                                      <span>to jump to the next input or save and advance.</span>
                                    </div>
                                    <span className="text-[10px] text-indigo-500 font-medium">Use [Skip Question] for unattempted choices</span>
                                  </div>

                                  {sec.questions.map((q, qIdx) => {
                                    const qId: string = q.questionId || (q as any).id || '';
                                    const isSkipped = Boolean(skippedQuestionsMap[qId]);
                                    const qMax = Number(q.customMarks || q.defaultMarks || 2);

                                    return (
                                      <div
                                        key={qId}
                                        className={`p-4 rounded-xl border shadow-sm transition space-y-3 ${
                                          isSkipped
                                            ? 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-75'
                                            : 'bg-white dark:bg-slate-900 border-[#E7EAF3] dark:border-slate-700'
                                        }`}
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="space-y-1.5 flex-1 min-w-0">
                                            {/* Top Row: Q Number, CO, Bloom, Topic, Competency, Mode */}
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className="font-mono font-black text-[#5B4BFF] text-xs">Q{qIdx + 1}.</span>
                                              
                                              {/* CO Badge */}
                                              {(q.co || q.competencyCode) && (
                                                <span className="px-2.5 py-0.5 rounded-full font-black text-[10px] bg-[#5B4BFF]/10 text-[#5B4BFF] border border-[#5B4BFF]/30 flex items-center gap-1 shadow-2xs">
                                                  <span>🎯</span>
                                                  <span>{q.co || (q.competencyCode ? resolveTopicAndBloom(q.competencyCode, q.topic).co : 'CO1')}</span>
                                                </span>
                                              )}

                                              {/* Bloom's Taxonomy Badge */}
                                              {(q.bloomLevel || q.competencyCode) && (() => {
                                                const bl = q.bloomLevel || resolveTopicAndBloom(q.competencyCode, q.topic).bloom;
                                                return (
                                                  <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] flex items-center gap-1 border shadow-2xs ${getBloomColor(bl)}`}>
                                                    <span>🧠</span>
                                                    <span>Bloom: {formatBloom(bl)}</span>
                                                  </span>
                                                );
                                              })()}

                                              {/* Topic */}
                                              {q.topic && (
                                                <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                                                  <span>📚</span>
                                                  <span>{q.topic}</span>
                                                </span>
                                              )}

                                              {q.competencyCode && (
                                                <span className="px-2 py-0.5 rounded-full font-mono font-bold text-[10px] bg-[#E6F9F3] text-[#00C48C] border border-[#00C48C]/30">
                                                  🏷️ {q.competencyCode}
                                                </span>
                                              )}

                                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                                                q.mode === 'MCQ' ? 'bg-[#EEF2FF] text-[#5B4BFF]' : 'bg-[#FFF4EC] text-[#F36C21]'
                                              }`}>
                                                [{q.mode}]
                                              </span>
                                            </div>

                                            {/* Question Prompt */}
                                            <p className="font-bold text-xs sm:text-sm text-[#1B1E28] dark:text-white leading-relaxed">
                                              {q.questionText}
                                            </p>

                                            {/* MCQ Choices Display (if available) */}
                                            {q.mode === 'MCQ' && (q.optionA || q.optionB || q.optionC || q.optionD) && (
                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1.5 text-xs text-[#4E5969] dark:text-slate-300">
                                                {q.optionA && <div className={`p-2 rounded-lg border text-[11px] ${q.correctOption === 'option_a' ? 'bg-[#E6F9F3] border-[#00C48C]/40 text-[#00C48C] font-black' : 'bg-[#F8FAFC] dark:bg-slate-800 border-[#E7EAF3] dark:border-slate-700'}`}>A) {q.optionA}</div>}
                                                {q.optionB && <div className={`p-2 rounded-lg border text-[11px] ${q.correctOption === 'option_b' ? 'bg-[#E6F9F3] border-[#00C48C]/40 text-[#00C48C] font-black' : 'bg-[#F8FAFC] dark:bg-slate-800 border-[#E7EAF3] dark:border-slate-700'}`}>B) {q.optionB}</div>}
                                                {q.optionC && <div className={`p-2 rounded-lg border text-[11px] ${q.correctOption === 'option_c' ? 'bg-[#E6F9F3] border-[#00C48C]/40 text-[#00C48C] font-black' : 'bg-[#F8FAFC] dark:bg-slate-800 border-[#E7EAF3] dark:border-slate-700'}`}>C) {q.optionC}</div>}
                                                {q.optionD && <div className={`p-2 rounded-lg border text-[11px] ${q.correctOption === 'option_d' ? 'bg-[#E6F9F3] border-[#00C48C]/40 text-[#00C48C] font-black' : 'bg-[#F8FAFC] dark:bg-slate-800 border-[#E7EAF3] dark:border-slate-700'}`}>D) {q.optionD}</div>}
                                              </div>
                                            )}
                                          </div>

                                          {/* Right Actions: Skip Button & Marks Input */}
                                          <div className="flex items-center gap-2 shrink-0">
                                            <button
                                              type="button"
                                              onClick={() => toggleQuestionSkip(qId)}
                                              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition border flex items-center gap-1.5 ${
                                                isSkipped
                                                  ? 'bg-[#FEECEB] text-[#F04438] border-[#F04438]/40 hover:bg-[#FEECEB]/80'
                                                  : 'bg-[#F8FAFC] dark:bg-slate-800 text-[#7B8794] border-[#E7EAF3] dark:border-slate-700 hover:text-[#F04438] hover:border-[#F04438]/40'
                                              }`}
                                              title={isSkipped ? 'Click to unskip and grade marks' : 'Mark as unattempted / skipped by student'}
                                            >
                                              <span>{isSkipped ? '⊘ Skipped (Unattempted)' : 'Skip Question'}</span>
                                            </button>

                                            {/* Single Question Marks Input (when not skipped) */}
                                            {(!q.subQuestions || q.subQuestions.length === 0) && !isSkipped && (() => {
                                              const inputIdx = inputIndexMap[`q_${qId}`] ?? 0;
                                              const currentVal = questionMarksMap[qId] !== undefined ? questionMarksMap[qId] : 0;
                                              return (
                                                <div className="flex items-center gap-1.5 whitespace-nowrap">
                                                  <span className="text-[11px] font-black text-[#4E5969] dark:text-slate-300">Marks:</span>
                                                  <input
                                                    ref={el => { inputRefs.current[inputIdx] = el; }}
                                                    type="number"
                                                    min={0}
                                                    max={qMax}
                                                    step={0.5}
                                                    value={currentVal}
                                                    placeholder="0"
                                                    onFocus={e => e.target.select()}
                                                    onChange={e => handleMarkChange(qId, e.target.value, qMax, 'question')}
                                                    onBlur={() => handleMarkBlur(qId, qMax, 'question')}
                                                    onKeyDown={e => handleKeyDown(e, inputIdx, qId, qMax, 'question')}
                                                    className="w-16 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border-2 border-[#5B4BFF]/50 text-[#00C48C] font-black text-xs text-center focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] shadow-sm transition"
                                                  />
                                                  <span className="text-[11px] text-[#7B8794] font-bold">/ {qMax}</span>
                                                </div>
                                              );
                                            })()}
                                          </div>
                                        </div>

                                        {/* If Skipped: Banner */}
                                        {isSkipped && (
                                          <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/80 border border-dashed border-[#E7EAF3] dark:border-slate-700 flex items-center justify-between text-xs">
                                            <span className="text-[#7B8794] font-bold">
                                              ⊘ Student did not attempt this question (Optional Choice Skipped)
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => toggleQuestionSkip(qId)}
                                              className="font-black text-[#5B4BFF] hover:underline text-[11px]"
                                            >
                                              Click to Enter Marks
                                            </button>
                                          </div>
                                        )}

                                        {/* Sub-Questions / Sub-Parts Tree (if not skipped) */}
                                        {!isSkipped && Array.isArray(q.subQuestions) && q.subQuestions.length > 0 && (
                                          <div className="pl-4 space-y-2 border-l-2 border-[#5B4BFF]/40 pt-1.5">
                                            {(() => {
                                              const totalRaw = q.subQuestions.reduce((sum, s) => sum + Number(s.marks || 1), 0);
                                              return q.subQuestions.map((sq, sqIdx) => {
                                                const sqMax = totalRaw > 0
                                                  ? Number(((Number(sq.marks || 1) / totalRaw) * qMax).toFixed(2))
                                                  : Number((qMax / (q.subQuestions?.length || 1)).toFixed(2));
                                                const compositeKey = `${qId}_${sq.id}`;
                                                const inputIdx = inputIndexMap[`sq_${qId}_${sq.id}`] ?? 0;
                                                const currentVal = subPartMarksMap[compositeKey] !== undefined
                                                  ? subPartMarksMap[compositeKey]
                                                  : 0;

                                                return (
                                                  <div key={sq.id || sqIdx} className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700">
                                                    <div className="flex items-center gap-2 flex-1">
                                                      <span className="font-mono font-black text-[#5B4BFF] text-xs shrink-0">{sq.label || `(${sqIdx + 1})`}</span>
                                                      <span className="text-xs font-bold text-[#1B1E28] dark:text-white">{sq.questionText}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
                                                      <span className="text-[10px] font-black text-[#4E5969] dark:text-slate-300">Marks:</span>
                                                      <input
                                                        ref={el => { inputRefs.current[inputIdx] = el; }}
                                                        type="number"
                                                        min={0}
                                                        max={sqMax}
                                                        step={0.5}
                                                        value={currentVal}
                                                        placeholder="0"
                                                        onFocus={e => e.target.select()}
                                                        onChange={e => handleMarkChange(compositeKey, e.target.value, sqMax, 'sub')}
                                                        onBlur={() => handleMarkBlur(compositeKey, sqMax, 'sub')}
                                                        onKeyDown={e => handleKeyDown(e, inputIdx, compositeKey, sqMax, 'sub')}
                                                        className="w-16 px-2 py-1 rounded-xl bg-white dark:bg-slate-900 border-2 border-[#00C48C]/50 text-[#00C48C] font-black text-xs text-center focus:outline-none focus:ring-2 focus:ring-[#00C48C] shadow-sm transition"
                                                      />
                                                      <span className="text-[10px] text-[#7B8794] font-bold">/ {sqMax}</span>
                                                    </div>
                                                  </div>
                                                );
                                              });
                                            })()}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Bottom Save Evaluation Action Row */}
                    <div className="pt-4 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between flex-wrap gap-4">
                      <div className="text-xs font-bold text-[#4E5969] dark:text-slate-300">
                        Total Evaluated: <strong className="text-[#00C48C] text-base font-black">{calculatedStudentTotal.toFixed(2)}</strong>
                        <span className="text-[#7B8794]"> / {activePaper.max_marks} Marks</span>
                        <span className={`ml-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          calculatedStudentTotal >= activePaper.max_marks * 0.4
                            ? 'bg-[#E6F9F3] text-[#00C48C] border border-[#00C48C]/30'
                            : 'bg-[#FEECEB] text-[#F04438] border border-[#F04438]/30'
                        }`}>
                          {calculatedStudentTotal >= activePaper.max_marks * 0.4 ? '✓ PASS' : '⚠️ FAIL'}
                        </span>
                      </div>

                      <button
                        onClick={handleSaveStudentEvaluation}
                        disabled={saving}
                        className="px-7 py-3 rounded-xl bg-[#5B4BFF] hover:bg-[#4E3EFF] text-white font-black text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        <span>💾</span> Save Evaluation for {selectedStudent.name}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-24 space-y-3">
                    <span className="text-5xl">👈</span>
                    <h4 className="text-base font-black text-[#1B1E28] dark:text-white">Select a Student from Roster</h4>
                    <p className="text-xs text-[#4E5969] dark:text-slate-400 max-w-sm mx-auto">
                      Click any student on the left roster to view their examination paper questions and input marks.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 4: CBME Competency Performance Matrix Table with Datatable Features & Reports ── */}
          {students.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-5">
              {/* Header & Paper Switcher */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-[#E7EAF3] dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-xs font-black text-[#1B1E28] dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#00C48C] text-white flex items-center justify-center text-[10px] font-black">4</span>
                    📈 {isNonMed ? 'COURSE OUTCOME & LEARNING PERFORMANCE MATRIX' : 'CBME COMPETENCY PERFORMANCE MATRIX'} &amp; RESULTS
                  </h3>
                  <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-0.5">
                    {isNonMed ? 'Outcome and module-wise breakdown per student with interactive reports' : 'Competency-wise breakdown and outcome matrix per student'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black text-[#4E5969] dark:text-slate-400 uppercase">PAPER:</span>
                  <select
                    value={activePaper?.id || selectedPaperId}
                    onChange={e => setSelectedPaperId(e.target.value)}
                    className="px-3.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold shadow-sm"
                  >
                    {filteredPapers.map(p => (
                      <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ── Action Toolbar: Search, Exports (Excel, CSV, PDF), & Page Size ── */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 text-xs pointer-events-none">
                    🔍
                  </span>
                  <input
                    type="text"
                    value={matrixSearch}
                    onChange={e => {
                      setMatrixSearch(e.target.value);
                      setMatrixPage(1);
                    }}
                    placeholder="Search by student name, roll no, reg no, or pass/fail..."
                    className="w-full pl-8 pr-8 py-2 text-xs rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white font-medium focus:outline-none focus:border-[#5B4BFF] focus:ring-1 focus:ring-[#5B4BFF] transition"
                  />
                  {matrixSearch && (
                    <button
                      onClick={() => { setMatrixSearch(''); setMatrixPage(1); }}
                      className="absolute inset-y-0 right-2.5 flex items-center text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Right Actions: Page Size & Export Buttons */}
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {/* Page Size Selector */}
                  <div className="flex items-center gap-1.5 text-xs text-[#4E5969] dark:text-slate-400 font-bold bg-[#F6F8FC] dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-[#E7EAF3] dark:border-slate-700">
                    <span>Show:</span>
                    <select
                      value={matrixPageSize}
                      onChange={e => {
                        setMatrixPageSize(Number(e.target.value));
                        setMatrixPage(1);
                      }}
                      className="bg-transparent text-xs font-black text-[#1B1E28] dark:text-white border-none focus:outline-none cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={0}>All</option>
                    </select>
                  </div>

                  {/* Export Excel Button */}
                  <button
                    type="button"
                    onClick={exportMatrixToExcel}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#00C48C]/10 text-[#00C48C] hover:bg-[#00C48C] hover:text-white border border-[#00C48C]/30 shadow-xs transition flex items-center gap-1.5"
                    title="Export styled Excel workbook (.xls)"
                  >
                    <span>📗</span>
                    <span>Excel</span>
                  </button>

                  {/* Export CSV Button */}
                  <button
                    type="button"
                    onClick={exportMatrixToCsv}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#5B4BFF]/10 text-[#5B4BFF] hover:bg-[#5B4BFF] hover:text-white border border-[#5B4BFF]/30 shadow-xs transition flex items-center gap-1.5"
                    title="Export raw CSV data (.csv)"
                  >
                    <span>📄</span>
                    <span>CSV</span>
                  </button>

                  {/* Export PDF / Print Button */}
                  <button
                    type="button"
                    onClick={exportMatrixToPdf}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F36C21]/10 text-[#F36C21] hover:bg-[#F36C21] hover:text-white border border-[#F36C21]/30 shadow-xs transition flex items-center gap-1.5"
                    title="Print or Save as PDF"
                  >
                    <span>🖨️</span>
                    <span>Print / PDF</span>
                  </button>
                </div>
              </div>

              {/* ── Table Container ── */}
              <div className="overflow-x-auto rounded-xl border border-[#E7EAF3] dark:border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E7EAF3] dark:border-slate-800 text-[11px] font-black text-[#1B1E28] dark:text-slate-300 uppercase tracking-wider bg-[#F8FAFC] dark:bg-slate-800/60 select-none">
                      <th
                        onClick={() => handleSort('rollno')}
                        className="py-3.5 px-4 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Roll No</span>
                          <span className="text-[10px] text-slate-400">
                            {matrixSortField === 'rollno' ? (matrixSortDir === 'asc' ? '▲' : '▼') : '↕'}
                          </span>
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('name')}
                        className="py-3.5 px-4 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Student Name</span>
                          <span className="text-[10px] text-slate-400">
                            {matrixSortField === 'name' ? (matrixSortDir === 'asc' ? '▲' : '▼') : '↕'}
                          </span>
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('marks')}
                        className="py-3.5 px-4 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Marks Obtained / Max</span>
                          <span className="text-[10px] text-slate-400">
                            {matrixSortField === 'marks' ? (matrixSortDir === 'asc' ? '▲' : '▼') : '↕'}
                          </span>
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('percentage')}
                        className="py-3.5 px-4 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Percentage</span>
                          <span className="text-[10px] text-slate-400">
                            {matrixSortField === 'percentage' ? (matrixSortDir === 'asc' ? '▲' : '▼') : '↕'}
                          </span>
                        </div>
                      </th>
                      {paperCompetencies.map(comp => (
                        <th
                          key={comp}
                          onClick={() => handleSort(comp)}
                          className="py-3.5 px-4 text-center text-[#00C48C] cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>🎯 {comp}</span>
                            <span className="text-[10px] text-slate-400">
                              {matrixSortField === comp ? (matrixSortDir === 'asc' ? '▲' : '▼') : '↕'}
                            </span>
                          </div>
                        </th>
                      ))}
                      <th
                        onClick={() => handleSort('status')}
                        className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span>Result Status</span>
                          <span className="text-[10px] text-slate-400">
                            {matrixSortField === 'status' ? (matrixSortDir === 'asc' ? '▲' : '▼') : '↕'}
                          </span>
                        </div>
                      </th>
                      <th className="py-3.5 px-4 text-center text-[#5B4BFF] font-black uppercase">
                        View Reports
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800 font-medium">
                    {paginatedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7 + paperCompetencies.length} className="py-8 text-center text-[#4E5969] dark:text-slate-400 italic">
                          No students found matching &quot;{matrixSearch}&quot;
                        </td>
                      </tr>
                    ) : (
                      paginatedStudents.map(st => {
                        const paperMaxM = Number(activePaper?.max_marks || st.max_marks || 20);
                        const percentage = paperMaxM > 0 ? (st.marks_obtained / paperMaxM) * 100 : 0;
                        return (
                          <tr key={st.id} className="hover:bg-[#F1F4F9]/60 dark:hover:bg-slate-800/40 transition">
                            <td className="py-3.5 px-4 font-mono font-black text-[#5B4BFF]">
                              <div>{st.rollno}</div>
                              {st.registration_no && (
                                <div className="text-[10px] text-slate-400 font-mono">Reg: {st.registration_no}</div>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-black text-[#1B1E28] dark:text-white flex items-center gap-2">
                                {st.photo_url ? (
                                  <img src={st.photo_url} alt={st.name} className="w-6 h-6 rounded-full object-cover border border-slate-200" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-[#5B4BFF]/10 text-[#5B4BFF] font-black flex items-center justify-center text-[10px]">
                                    {st.name.charAt(0)}
                                  </div>
                                )}
                                <span>{st.name}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-black text-[#00C48C]">{st.marks_obtained.toFixed(2)} / {paperMaxM}</td>
                            <td className="py-3.5 px-4 font-mono font-black text-[#F36C21]">{percentage.toFixed(1)}%</td>
                            {paperCompetencies.map(comp => {
                              const computedScores = calculateStudentCompetencyScores(
                                activePaper,
                                st.questionMarks,
                                st.subPartMarks,
                                st.skippedQuestionIds || []
                              );
                              const compData = (computedScores[comp] && (computedScores[comp].max > 0 || computedScores[comp].isSkipped))
                                ? computedScores[comp]
                                : (st.competencyScores[comp] || { scored: 0, max: 0, isSkipped: false });

                              if (compData.isSkipped || compData.max === 0) {
                                return (
                                  <td key={comp} className="py-3.5 px-4 text-center">
                                    <span
                                      className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#F1F4F9] dark:bg-slate-800 text-[#7B8794] border border-[#E7EAF3] dark:border-slate-700 shadow-xs"
                                      title="Question was unattempted / skipped (choice rule)"
                                    >
                                      Skipped (—)
                                    </span>
                                  </td>
                                );
                              }

                              const displayScored = Math.min(compData.max, compData.scored);
                              const compPct = Math.min(100, Math.round((displayScored / compData.max) * 100));
                              const isGood = compPct >= 50;

                              return (
                                <td key={comp} className="py-3.5 px-4 text-center">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-black border ${
                                    isGood
                                      ? 'bg-[#E6F9F3] text-[#00C48C] border-[#00C48C]/30'
                                      : 'bg-[#FFF8E6] text-[#FFB020] border-[#FFB020]/30'
                                  }`}>
                                    {displayScored}/{compData.max} - {compPct}%
                                  </span>
                                </td>
                              );
                            })}
                            <td className="py-3.5 px-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                st.is_pass
                                  ? 'bg-[#E6F9F3] text-[#00C48C] border-[#00C48C]/30'
                                  : 'bg-[#FEECEB] text-[#F04438] border-[#F04438]/30'
                              }`}>
                                {st.is_pass ? '✓ PASS' : '⚠️ FAIL'}
                              </span>
                            </td>
                            {/* View Reports Action Column */}
                            <td className="py-3.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleOpenStudentReport(st)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-[#5B4BFF]/10 text-[#5B4BFF] hover:bg-[#5B4BFF] hover:text-white border border-[#5B4BFF]/20 shadow-xs transition"
                                title={`View Section-wise MIS Analysis for ${st.name}`}
                              >
                                <span>📊</span>
                                <span>View Reports</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── Datatable Pagination Footer ── */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#4E5969] dark:text-slate-400 pt-1">
                <div>
                  {totalEntries > 0 ? (
                    <span>
                      Showing <strong>{matrixPageSize === 0 ? 1 : (matrixPage - 1) * matrixPageSize + 1}</strong> to{' '}
                      <strong>{matrixPageSize === 0 ? totalEntries : Math.min(matrixPage * matrixPageSize, totalEntries)}</strong> of{' '}
                      <strong>{totalEntries}</strong> students
                      {matrixSearch && <span> (filtered from {students.length} total)</span>}
                    </span>
                  ) : (
                    <span>No students to display</span>
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setMatrixPage(1)}
                      disabled={matrixPage === 1}
                      className="px-2.5 py-1 rounded-lg border border-[#E7EAF3] dark:border-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      « First
                    </button>
                    <button
                      onClick={() => setMatrixPage(p => Math.max(1, p - 1))}
                      disabled={matrixPage === 1}
                      className="px-2.5 py-1 rounded-lg border border-[#E7EAF3] dark:border-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      ‹ Prev
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum = matrixPage;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (matrixPage <= 3) pageNum = i + 1;
                      else if (matrixPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = matrixPage - 2 + i;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setMatrixPage(pageNum)}
                          className={`px-3 py-1 rounded-lg border font-black transition ${
                            matrixPage === pageNum
                              ? 'bg-[#5B4BFF] text-white border-[#5B4BFF] shadow-xs'
                              : 'border-[#E7EAF3] dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setMatrixPage(p => Math.min(totalPages, p + 1))}
                      disabled={matrixPage === totalPages}
                      className="px-2.5 py-1 rounded-lg border border-[#E7EAF3] dark:border-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      Next ›
                    </button>
                    <button
                      onClick={() => setMatrixPage(totalPages)}
                      disabled={matrixPage === totalPages}
                      className="px-2.5 py-1 rounded-lg border border-[#E7EAF3] dark:border-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      Last »
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* ── MODAL POPUP: Section-Wise Student Analysis (MIS Report Theory Result Standard) ── */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {reportModalOpen && activeReportStudent && (
            <div
              className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
              onClick={() => setReportModalOpen(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-[#1B1E28] rounded-[24px] max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-slate-700 animate-scaleUp"
              >
                {/* 1. Modal Top Bar */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-[#F6F8FC] dark:bg-slate-900 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {activeReportStudent.photo_url ? (
                      <img
                        src={activeReportStudent.photo_url}
                        alt={activeReportStudent.name}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-md"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-[#5B4BFF] text-white flex items-center justify-center font-black text-lg shadow-md">
                        {(activeReportStudent.name || '?').charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-xs text-[#5B4BFF]">{activeReportStudent.rollno}</span>
                        {activeReportStudent.registration_no && (
                          <span className="font-mono text-[10px] text-slate-400">Reg: {activeReportStudent.registration_no}</span>
                        )}
                        <span className={`px-2 py-0.2 rounded text-[10px] font-extrabold uppercase ${
                          activeReportStudent.is_pass ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {activeReportStudent.is_pass ? 'Pass' : 'Fail'}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">{activeReportStudent.name}</h3>
                      <p className="text-[11px] text-slate-500">
                        {activeReportStudent.course} • Batch: {activeReportStudent.batch} • Total Score: <strong>{(Number(activeReportStudent.marks_obtained) || 0).toFixed(2)} / {activeReportStudent.max_marks || 20} ({((Number(activeReportStudent.marks_obtained) || 0) / (activeReportStudent.max_marks || 1) * 100).toFixed(1)}%)</strong>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center transition"
                  >
                    ✕
                  </button>
                </div>

                {/* 2. Modal Tabs Bar (Practical Assessment ONLY rendered if activeReportStudent.isPracticalPaper is true) */}
                <div className="px-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-6 bg-slate-100 dark:bg-slate-950/80 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setReportModalTab('subtopics')}
                    className={`py-3.5 text-xs font-black border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
                      reportModalTab === 'subtopics' ? 'border-[#5B4BFF] text-[#5B4BFF]' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <span>🎯</span>
                    <span>1. Questions Comes Under Sections (SubTopics Analysis)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportModalTab('tracking')}
                    className={`py-3.5 text-xs font-black border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
                      reportModalTab === 'tracking' ? 'border-[#5B4BFF] text-[#5B4BFF]' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <span>📝</span>
                    <span>2. Question Paper Tracking</span>
                  </button>
                  {/* Tab 3: Practical Assessment — Strictly HIDDEN if practical is not included in section */}
                  {activeReportStudent.isPracticalPaper && (
                    <button
                      type="button"
                      onClick={() => setReportModalTab('practical')}
                      className={`py-3.5 text-xs font-black border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
                        reportModalTab === 'practical' ? 'border-[#F36C21] text-[#F36C21]' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <span>🧪</span>
                      <span>3. Practical Assessment</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setReportModalTab('chart')}
                    className={`py-3.5 text-xs font-black border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
                      reportModalTab === 'chart' ? 'border-[#5B4BFF] text-[#5B4BFF]' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <span>📊</span>
                    <span>{activeReportStudent.isPracticalPaper ? '4. Chart' : '3. Chart'}</span>
                  </button>
                </div>

                {/* 3. Modal Body Content */}
                <div className="p-6 overflow-y-auto max-h-[64vh] space-y-4">
                  {/* TAB 1: Questions Comes Under Sections (SubTopics Analysis) */}
                  {reportModalTab === 'subtopics' && (
                    <div className="space-y-4">
                      {/* Paper Banner Header */}
                      <div className="p-3.5 rounded-xl bg-emerald-800 text-white flex items-center justify-between text-xs font-bold shadow-sm">
                        <div className="flex items-center gap-2">
                          <span>📄</span>
                          <span>{activePaper?.name || 'Examination Paper'} ({activePaper?.code || ''})</span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-100">
                          <span>📅</span>
                          <span>Batch: {activeReportStudent.batch}</span>
                        </div>
                      </div>

                      {/* SubTopic Groups */}
                      {Object.entries(activeReportStudent.subTopicResults || {}).map(([sCode, stSummary]: [string, any], idx) => {
                        const isExp = expandedSubTopics[sCode] !== false;
                        const subQuestions = (activeReportStudent.questionAttempts || []).filter(
                          (att: any) => att.subTopicCode === sCode
                        );
                        const colorClass = idx % 2 === 0 ? 'bg-[#2D2575] text-white' : 'bg-rose-900 text-white';

                        return (
                          <div key={sCode} className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                            <div
                              onClick={() => setExpandedSubTopics(prev => ({ ...prev, [sCode]: !prev[sCode] }))}
                              className={`p-3 cursor-pointer flex items-center justify-between gap-3 ${colorClass}`}
                            >
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="w-5 h-5 rounded bg-white/20 flex items-center justify-center text-xs font-black shrink-0">
                                  {isExp ? '−' : '+'}
                                </span>
                                <span className="text-xs font-black">
                                  {sCode} {stSummary.desc ? `— ${stSummary.desc}` : ''}
                                </span>
                                {stSummary.co && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white border border-white/30 flex items-center gap-1">
                                    <span>🎯</span>
                                    <span>{stSummary.co}</span>
                                  </span>
                                )}
                                {stSummary.bloom && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white border border-white/30 flex items-center gap-1">
                                    <span>🧠</span>
                                    <span>Bloom: {formatBloom(stSummary.bloom)}</span>
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-black bg-white/20 text-white border border-white/30">
                                  {stSummary.scored}/{stSummary.totalMax} Marks ({stSummary.pct}%)
                                </span>
                              </div>
                            </div>

                            {isExp && (
                              <div className="p-4 bg-white dark:bg-slate-900 space-y-3">
                                {subQuestions.length === 0 ? (
                                  <p className="text-xs text-slate-400 italic">No questions mapped to this outcome/subtopic.</p>
                                ) : (
                                  subQuestions.map((q: any) => (
                                    <div key={q.questionId} className="p-3.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                                      <div className="flex items-center gap-2 flex-wrap text-[11px]">
                                        <span className="px-2.5 py-0.5 rounded-lg font-black bg-[#F36C21] text-white shadow-xs">
                                          {q.part}
                                        </span>
                                        <span className="px-2.5 py-0.5 rounded-lg font-black bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                          Q. {q.qNo}
                                        </span>

                                        {/* ── CO BADGE ── */}
                                        <span className="px-2.5 py-0.5 rounded-full font-black text-[10px] bg-[#5B4BFF]/10 text-[#5B4BFF] border border-[#5B4BFF]/30 flex items-center gap-1 shadow-2xs">
                                          <span>🎯</span>
                                          <span>{q.co || 'CO2'}</span>
                                        </span>

                                        {/* ── TOPIC BADGE ── */}
                                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                                          <span>📚</span>
                                          <span>{q.topic || q.subTopicDesc}</span>
                                        </span>

                                        {/* ── BLOOM'S TAXONOMY BADGE ── */}
                                        <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] flex items-center gap-1 border shadow-2xs ${getBloomColor(q.bloomLevel)}`}>
                                          <span>🧠</span>
                                          <span>Bloom: {formatBloom(q.bloomLevel)}</span>
                                        </span>

                                        <span className="text-slate-500 dark:text-slate-400 font-medium ml-1">
                                          Note:- Each question contains {q.maxMarks || 1} marks.
                                        </span>
                                      </div>

                                      <div className="flex items-start justify-between gap-3 pt-1">
                                        <p className="font-bold text-slate-900 dark:text-white leading-relaxed flex-1">
                                          <span className="text-slate-400 font-mono mr-1.5">Q. {q.qNo}</span>
                                          {q.questionText}
                                        </p>
                                        {q.isSkipped ? (
                                          <span className="px-2.5 py-1 rounded-full font-mono font-bold text-xs text-slate-500 bg-slate-100 border border-slate-300">
                                            Skipped (—)
                                          </span>
                                        ) : (
                                          <span className="px-2.5 py-1 rounded-full font-mono font-black text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800">
                                            ({q.marksScored || 0}/{q.maxMarks || 1})
                                          </span>
                                        )}
                                      </div>

                                      {/* Sub-parts if any */}
                                      {q.subQuestions && q.subQuestions.length > 0 && (
                                        <div className="pl-4 space-y-1.5 border-l-2 border-slate-300 dark:border-slate-700 pt-1">
                                          {q.subQuestions.map((sq: any) => (
                                            <div key={sq.id} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                              <span><strong>Q. {sq.label}</strong> {sq.questionText}</span>
                                              <span className="font-mono font-bold text-rose-600">({sq.scored || 0}/{sq.max || 2.5})</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* TAB 2: Question Paper Tracking */}
                  {reportModalTab === 'tracking' && (
                    <div className="space-y-6">
                      {Array.from(new Set((activeReportStudent.questionAttempts || []).map((q: any) => q.part))).map((secName: any) => {
                        const secQuestions = (activeReportStudent.questionAttempts || []).filter((q: any) => q.part === secName);
                        if (secQuestions.length === 0) return null;

                        return (
                          <div key={secName} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                            <div className="border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center justify-between">
                              <h4 className="text-sm font-black text-center text-slate-900 dark:text-white uppercase tracking-wider w-full">
                                {secName}
                              </h4>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                              (1). Note:- Tick (✓) the appropriate answer. Each question contains marks as indicated.
                            </p>

                            <div className="space-y-4 pt-2">
                              {secQuestions.map((q: any) => (
                                <div key={q.questionId} className="space-y-2 text-xs border-b border-slate-100 dark:border-slate-800/80 pb-3 last:border-b-0">
                                  <div className="flex items-start gap-2.5">
                                    <span className={`text-base font-black ${
                                      q.isSkipped ? 'text-slate-400' : (q.isCorrect ? 'text-[#00C48C]' : 'text-[#F04438]')
                                    }`}>
                                      {q.isSkipped ? '—' : (q.isCorrect ? '✓' : '✗')}
                                    </span>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 flex-wrap mb-1 text-[11px]">
                                        <span className="px-2.5 py-0.5 rounded-full font-black text-[10px] bg-[#5B4BFF]/10 text-[#5B4BFF] border border-[#5B4BFF]/30 flex items-center gap-1 shadow-2xs">
                                          <span>🎯</span>
                                          <span>{q.co || 'CO2'}</span>
                                        </span>
                                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                                          <span>📚</span>
                                          <span>{q.topic || q.subTopicDesc}</span>
                                        </span>
                                        <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] flex items-center gap-1 border shadow-2xs ${getBloomColor(q.bloomLevel)}`}>
                                          <span>🧠</span>
                                          <span>Bloom: {formatBloom(q.bloomLevel)}</span>
                                        </span>
                                      </div>
                                      <p className="font-bold text-slate-900 dark:text-white">
                                        <strong>({q.qNo}).</strong> {q.questionText}
                                        {q.isSkipped ? (
                                          <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500 font-mono">
                                            Skipped (—)
                                          </span>
                                        ) : (
                                          <span className="ml-2 font-mono font-bold text-[#F04438]">
                                            ({q.marksScored || 0}/{q.maxMarks || 1})
                                          </span>
                                        )}
                                      </p>

                                      {/* MCQ Options 2x2 Grid */}
                                      {q.optionA && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 pl-2">
                                          <div className={`p-1.5 rounded-lg border ${['option_a', 'optiona', 'a'].includes(String(q.correctOption || '').toLowerCase().trim()) ? 'border-[#00C48C] bg-emerald-50/50 text-[#00C48C] font-bold' : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}`}>
                                            <strong>(a).</strong> {q.optionA}
                                          </div>
                                          <div className={`p-1.5 rounded-lg border ${['option_b', 'optionb', 'b'].includes(String(q.correctOption || '').toLowerCase().trim()) ? 'border-[#00C48C] bg-emerald-50/50 text-[#00C48C] font-bold' : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}`}>
                                            <strong>(b).</strong> {q.optionB}
                                          </div>
                                          <div className={`p-1.5 rounded-lg border ${['option_c', 'optionc', 'c'].includes(String(q.correctOption || '').toLowerCase().trim()) ? 'border-[#00C48C] bg-emerald-50/50 text-[#00C48C] font-bold' : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}`}>
                                            <strong>(c).</strong> {q.optionC}
                                          </div>
                                          <div className={`p-1.5 rounded-lg border ${['option_d', 'optiond', 'd'].includes(String(q.correctOption || '').toLowerCase().trim()) ? 'border-[#00C48C] bg-emerald-50/50 text-[#00C48C] font-bold' : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}`}>
                                            <strong>(d).</strong> {q.optionD}
                                          </div>
                                        </div>
                                      )}

                                      {/* Sub-parts */}
                                      {q.subQuestions && q.subQuestions.length > 0 && (
                                        <div className="pl-4 space-y-1.5 border-l-2 border-slate-200 dark:border-slate-800 mt-2">
                                          {q.subQuestions.map((sq: any) => (
                                            <div key={sq.id} className="flex items-center justify-between p-1.5 rounded bg-[#F6F8FC] dark:bg-slate-950 text-xs">
                                              <span><strong>({sq.label})</strong> {sq.questionText}</span>
                                              <span className="font-mono font-bold text-[#F04438]">({sq.scored || 0}/{sq.max || 2.5})</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* TAB 3: Practical Assessment (ONLY if activeReportStudent.isPracticalPaper) */}
                  {activeReportStudent.isPracticalPaper && reportModalTab === 'practical' && (
                    <div className="space-y-6">
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#F36C21] to-[#FF8A48] text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-white/20 text-white">
                              🧪 Practical &amp; Clinical Assessment
                            </span>
                            <span className="text-xs font-bold text-orange-100">
                              4 Categories Matrix
                            </span>
                          </div>
                          <h4 className="text-base font-black text-white mt-1">
                            Practical Score: {(Number(activeReportStudent.practicalMarks) || 0).toFixed(2)} / {activeReportStudent.practicalMax || 40}.00 Marks ({activeReportStudent.practicalPercentage || 0}%)
                          </h4>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-white text-[#F36C21] shadow-sm">
                            {(Number(activeReportStudent.practicalPercentage) || 0) >= 50 ? '✓ Practical Passed' : '⚠️ Needs Improvement'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(activeReportStudent.practicalCategories || []).map((cat: any) => (
                          <div key={cat.id} className="p-4 rounded-2xl bg-[#F6F8FC] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="text-xs font-bold text-slate-900 dark:text-white">{cat.name}</h5>
                                <p className="text-[10px] text-slate-500">Max Component Marks: {cat.maxMarks}</p>
                              </div>
                              <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                                {(Number(cat.scoredMarks) || 0).toFixed(2)} / {cat.maxMarks}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.min(100, Math.round(((cat.scoredMarks || 0) / (cat.maxMarks || 1)) * 100))}%`,
                                  backgroundColor: cat.color,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 4 (or 3): Chart (SubTopics Progress Chart with Radial Labels) */}
                  {reportModalTab === 'chart' && (
                    <div className="space-y-6 text-center">
                      <div>
                        <h3 className="text-xl font-black text-[#F04438] tracking-tight uppercase">
                          SUBTOPICS RESULT : {(Number(activeReportStudent.marks_obtained) || 0).toFixed(2)} / {activeReportStudent.max_marks || 20} = {((((Number(activeReportStudent.marks_obtained) || 0) / (Number(activeReportStudent.max_marks) || 1))) * 100).toFixed(1)}%
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Visual distribution of student performance across question paper modules and outcomes.
                        </p>
                      </div>

                      <div className="flex flex-col items-center justify-center p-2">
                        <div className="relative w-full max-w-[620px] h-[370px]">
                          <svg viewBox="0 0 550 360" className="w-full h-full">
                            <defs>
                              <filter id="reportPieShadow" x="-10%" y="-10%" width="120%" height="120%">
                                <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.15" />
                              </filter>
                            </defs>

                            <g filter="url(#reportPieShadow)">
                              {reportPieChartSlices.map((slice: any) => {
                                const isHov = hoveredSlice === slice.code;
                                return (
                                  <path
                                    key={slice.code}
                                    d={slice.pathData}
                                    fill={slice.color}
                                    stroke="#FFFFFF"
                                    strokeWidth="2.5"
                                    onMouseEnter={() => setHoveredSlice(slice.code)}
                                    onMouseLeave={() => setHoveredSlice(null)}
                                    className="transition-all duration-200 cursor-pointer"
                                    style={{
                                      opacity: hoveredSlice ? (isHov ? 1 : 0.65) : 1,
                                      transformOrigin: '275px 180px',
                                      transform: isHov ? 'scale(1.04)' : 'scale(1)',
                                    }}
                                  />
                                );
                              })}
                            </g>

                            <g className="pointer-events-none">
                              {reportPieChartSlices.map((slice: any) => {
                                const isHov = hoveredSlice === slice.code;
                                return (
                                  <g key={`label-${slice.code}`}>
                                    <polyline
                                      points={`${slice.lineStart.x},${slice.lineStart.y} ${slice.lineMid.x},${slice.lineMid.y} ${slice.lineEnd.x},${slice.lineEnd.y}`}
                                      fill="none"
                                      stroke={isHov ? '#1B1E28' : slice.color}
                                      strokeWidth={isHov ? '2' : '1.2'}
                                      strokeDasharray={isHov ? 'none' : '2,2'}
                                      className="transition-all duration-200"
                                    />
                                    <circle
                                      cx={slice.lineStart.x}
                                      cy={slice.lineStart.y}
                                      r="2.5"
                                      fill={slice.color}
                                    />
                                    <text
                                      x={slice.textPos.x}
                                      y={slice.textPos.y}
                                      textAnchor={slice.isRight ? 'start' : 'end'}
                                      fontSize="11"
                                      fontWeight={isHov ? '900' : '800'}
                                      fill={isHov ? '#1B1E28' : slice.color}
                                      className="font-mono tracking-tight transition-all duration-200"
                                    >
                                      {slice.code} — {slice.scored}/{slice.totalMax} ({slice.pct}%)
                                    </text>
                                  </g>
                                );
                              })}
                            </g>
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Modal Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl text-xs font-black bg-[#5B4BFF]/10 text-[#5B4BFF] hover:bg-[#5B4BFF] hover:text-white transition flex items-center gap-1.5"
                  >
                    <span>🖨️</span>
                    <span>Print Report</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="px-5 py-2 rounded-xl text-xs font-black bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}


          </main>
      </div>
    </div>
  );
}
